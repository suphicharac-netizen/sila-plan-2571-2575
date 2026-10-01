import { PlanAnnouncement } from '../types';

/**
 * Extracts a 4-digit Buddhist Era year string (e.g. "2571", "2572")
 */
export const extractFiscalYear = (val?: string): string => {
  if (!val) return '2571';
  const match = val.match(/25\d{2}/);
  return match ? match[0] : '2571';
};

/**
 * Checks if a plan is the initial/first edition (ฉบับแรกสุด ตั้งต้น)
 */
export const isInitialPlanEdition = (planType?: string, batchNumber?: string): boolean => {
  const p = (planType || '').toLowerCase();
  const b = (batchNumber || '').toLowerCase();
  if (p.includes('ฉบับแรก') || b.includes('ฉบับแรก')) return true;
  if (
    !p.includes('เพิ่มเติม') &&
    !p.includes('เปลี่ยนแปลง') &&
    !p.includes('แก้ไข') &&
    !p.includes('additional') &&
    !p.includes('changed') &&
    !p.includes('amended')
  ) {
    return true;
  }
  return false;
};

/**
 * Returns Standard Plan Name according to municipal regulations:
 * - ฉบับแรก: "แผนพัฒนาท้องถิ่น (พ.ศ. 2571 - 2575)"
 * - เพิ่มเติม: "แผนพัฒนาท้องถิ่น (พ.ศ. 2571 - 2575) เพิ่มเติม"
 * - เปลี่ยนแปลง: "แผนพัฒนาท้องถิ่น (พ.ศ. 2571 - 2575) เปลี่ยนแปลง"
 * - แก้ไข: "แผนพัฒนาท้องถิ่น (พ.ศ. 2571 - 2575) แก้ไข"
 */
export const getStandardPlanName = (planType?: string): string => {
  const pt = planType || '';
  if (pt.includes('เพิ่มเติม') || pt.toLowerCase().includes('additional')) {
    return 'แผนพัฒนาท้องถิ่น (พ.ศ. 2571 - 2575) เพิ่มเติม';
  }
  if (pt.includes('เปลี่ยนแปลง') || pt.toLowerCase().includes('changed')) {
    return 'แผนพัฒนาท้องถิ่น (พ.ศ. 2571 - 2575) เปลี่ยนแปลง';
  }
  if (pt.includes('แก้ไข') || pt.toLowerCase().includes('amended')) {
    return 'แผนพัฒนาท้องถิ่น (พ.ศ. 2571 - 2575) แก้ไข';
  }
  return 'แผนพัฒนาท้องถิ่น (พ.ศ. 2571 - 2575)';
};

/**
 * Computes next batch number when creating a new plan in a given year:
 * - If type is "ฉบับแรก":
 *     -> "ฉบับแรก/2571"
 * - If in same year as "ฉบับแรก" (e.g. 2571):
 *     If 1 plan (ฉบับแรก) exists, next is "ครั้งที่ 2/2571"
 *     If 2 plans exist, next is "ครั้งที่ 3/2571"
 * - If in next year (e.g. 2572):
 *     Resets sequence!
 *     If 0 plans exist in 2572, next is "ครั้งที่ 1/2572"
 *     If 1 plan exists in 2572, next is "ครั้งที่ 2/2572"
 */
export const getNextBatchSequence = (
  planType: string,
  targetYear: string,
  existingAnnouncements: PlanAnnouncement[]
): string => {
  const cleanYear = extractFiscalYear(targetYear);
  const isFirst = isInitialPlanEdition(planType);

  if (isFirst) {
    return `ฉบับแรก/${cleanYear}`;
  }

  // Filter existing announcements for this year
  const yearAnnouncements = existingAnnouncements.filter((a) => {
    const aYear = extractFiscalYear(a.year || a.approvalDate || a.batchNumber);
    return aYear === cleanYear;
  });

  const hasFirstInYear = yearAnnouncements.some((a) =>
    isInitialPlanEdition(a.planType, a.batchNumber)
  );

  // Find maximum sequence number used so far in this year
  let maxSeq = 0;
  yearAnnouncements.forEach((a) => {
    if (isInitialPlanEdition(a.planType, a.batchNumber)) {
      if (maxSeq < 1) maxSeq = 1;
    }
    const raw = a.batchNumber || '';
    const match = raw.match(/ครั้งที่\s*(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxSeq) maxSeq = num;
    } else {
      const numMatch = raw.match(/^(\d+)(?:\/|$)/);
      if (numMatch) {
        const num = parseInt(numMatch[1], 10);
        if (num > maxSeq) maxSeq = num;
      }
    }
  });

  if (hasFirstInYear) {
    // ฉบับแรก counts as #1 in that year, so additional/changed/amended start at 2
    const nextNum = Math.max(yearAnnouncements.length + 1, maxSeq + 1, 2);
    return `ครั้งที่ ${nextNum}/${cleanYear}`;
  } else {
    // No initial edition in this year (e.g. year 2572) -> resets sequence to start at 1
    const nextNum = Math.max(yearAnnouncements.length + 1, maxSeq + 1, 1);
    return `ครั้งที่ ${nextNum}/${cleanYear}`;
  }
};

/**
 * Resolves the display text for the "ครั้งที่ / ปี พ.ศ." column in the table:
 * - For initial plan: "ฉบับแรก/2571" (no "ครั้งที่")
 * - For subsequent plans in same year (2571): "ครั้งที่ 2/2571", "ครั้งที่ 3/2571", ...
 * - When changing year (e.g. 2572): "ครั้งที่ 1/2572", "ครั้งที่ 2/2572", ...
 */
export const resolveAnnouncementBatchDisplay = (
  ann: PlanAnnouncement,
  allAnnouncements?: PlanAnnouncement[]
): string => {
  const year = extractFiscalYear(ann.year || ann.approvalDate || ann.batchNumber);
  const isFirst = isInitialPlanEdition(ann.planType, ann.batchNumber);

  if (isFirst) {
    return `ฉบับแรก/${year}`;
  }

  // If ann already has formatted batchNumber
  if (ann.batchNumber) {
    const raw = ann.batchNumber.trim();
    if (raw.includes('ฉบับแรก')) {
      return `ฉบับแรก/${year}`;
    }
    // Matches "ครั้งที่ X/25XX"
    if (/^ครั้งที่\s*\d+\/25\d{2}$/.test(raw)) {
      return raw.replace(/\s+/g, ' ');
    }
    // Matches "ครั้งที่ X"
    if (/^ครั้งที่\s*\d+$/.test(raw)) {
      return `${raw.replace(/\s+/g, ' ')}/${year}`;
    }
    // Matches "X/25XX"
    if (/^\d+\/25\d{2}$/.test(raw)) {
      return `ครั้งที่ ${raw}`;
    }
    // Matches "X"
    if (/^\d+$/.test(raw)) {
      return `ครั้งที่ ${raw}/${year}`;
    }
  }

  // If allAnnouncements provided, compute dynamically based on position within that year
  if (allAnnouncements && allAnnouncements.length > 0) {
    // Filter all announcements belonging to this fiscal year and sort by orderNumber or ID
    const yearAnnouncements = allAnnouncements
      .filter((a) => extractFiscalYear(a.year || a.approvalDate || a.batchNumber) === year)
      .sort((a, b) => (a.orderNumber ?? 9999) - (b.orderNumber ?? 9999));

    const indexInYear = yearAnnouncements.findIndex((a) => a.id === ann.id);
    if (indexInYear !== -1) {
      const targetItem = yearAnnouncements[indexInYear];
      if (isInitialPlanEdition(targetItem.planType, targetItem.batchNumber)) {
        return `ฉบับแรก/${year}`;
      }

      const hasFirstInYear = yearAnnouncements.some((a) =>
        isInitialPlanEdition(a.planType, a.batchNumber)
      );

      if (hasFirstInYear) {
        // Since index 0 is first edition (#1), index 1 is #2, index 2 is #3, etc.
        const seq = indexInYear + 1;
        return `ครั้งที่ ${seq}/${year}`;
      } else {
        // No first edition in this year (e.g. 2572), starts from 1
        const seq = indexInYear + 1;
        return `ครั้งที่ ${seq}/${year}`;
      }
    }
  }

  return `ครั้งที่ 1/${year}`;
};

/**
 * Normalizes an array of PlanAnnouncements so all batch numbers and plan names
 * strictly follow the local government sequence naming regulations.
 */
export const sanitizeAnnouncementsSequence = (
  announcements: PlanAnnouncement[]
): PlanAnnouncement[] => {
  if (!Array.isArray(announcements)) return [];

  // Group by clean fiscal year
  const yearMap = new Map<string, PlanAnnouncement[]>();
  announcements.forEach((ann) => {
    const y = extractFiscalYear(ann.year || ann.approvalDate || ann.batchNumber);
    if (!yearMap.has(y)) {
      yearMap.set(y, []);
    }
    yearMap.get(y)!.push(ann);
  });

  const result: PlanAnnouncement[] = [];

  // Process year by year in order
  const sortedYears = Array.from(yearMap.keys()).sort();
  sortedYears.forEach((year) => {
    const list = yearMap.get(year)!;
    // Sort so first edition (if any) is first, then by orderNumber
    list.sort((a, b) => {
      const aIsFirst = isInitialPlanEdition(a.planType, a.batchNumber);
      const bIsFirst = isInitialPlanEdition(b.planType, b.batchNumber);
      if (aIsFirst && !bIsFirst) return -1;
      if (!aIsFirst && bIsFirst) return 1;
      return (a.orderNumber ?? 9999) - (b.orderNumber ?? 9999);
    });

    const hasFirst = list.some((a) => isInitialPlanEdition(a.planType, a.batchNumber));

    list.forEach((ann, idx) => {
      let formattedBatch: string;
      const isFirst = isInitialPlanEdition(ann.planType, ann.batchNumber);

      if (isFirst) {
        formattedBatch = `ฉบับแรก/${year}`;
      } else if (hasFirst) {
        // If year has first edition, first is #1, next is #2, #3, ...
        formattedBatch = `ครั้งที่ ${idx + 1}/${year}`;
      } else {
        // Reset when year changes (e.g. 2572), starts at #1, #2, ...
        formattedBatch = `ครั้งที่ ${idx + 1}/${year}`;
      }

      result.push({
        ...ann,
        year,
        batchNumber: formattedBatch
      });
    });
  });

  return result;
};

/**
 * Generates official announcement title text:
 * e.g. "ประกาศเทศบาลเมืองศิลา เรื่อง ประกาศใช้แผนพัฒนาท้องถิ่น (พ.ศ. 2571 - 2575) เพิ่มเติม ครั้งที่ 2/2571"
 */
export const getStandardAnnouncementTitle = (
  planType: string,
  batchDisplay: string,
  yearVal: string
): string => {
  const cleanYear = extractFiscalYear(yearVal);
  const isFirst = isInitialPlanEdition(planType, batchDisplay);

  if (isFirst) {
    return `ประกาศเทศบาลเมืองศิลา เรื่อง ประกาศใช้แผนพัฒนาท้องถิ่น (พ.ศ. 2571 - 2575)`;
  }

  const standardName = getStandardPlanName(planType);
  const cleanBatch = batchDisplay.startsWith('ครั้งที่')
    ? batchDisplay
    : `ครั้งที่ ${batchDisplay}`;

  return `ประกาศเทศบาลเมืองศิลา เรื่อง ประกาศใช้${standardName} ${cleanBatch}`;
};
