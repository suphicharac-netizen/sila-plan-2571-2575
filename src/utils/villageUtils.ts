import { ProjectData, VillageInfo, ZoneInfo, ProjectExecutionStatus, UserAccount } from '../types';
import { ALL_VILLAGES, SILA_ZONES } from './constants';

export const EXECUTION_STATUS_CONFIG: Record<
  ProjectExecutionStatus,
  {
    value: ProjectExecutionStatus;
    label: string;
    shortLabel: string;
    icon: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    bgClass: string;
    textClass: string;
    borderClass: string;
    description: string;
  }
> = {
  in_progress: {
    value: 'in_progress',
    label: 'อยู่ระหว่างดำเนินการ',
    shortLabel: 'กำลังทำ',
    icon: '⏳',
    badgeBg: 'bg-sky-100',
    badgeText: 'text-sky-900',
    badgeBorder: 'border-sky-300',
    bgClass: 'bg-sky-100',
    textClass: 'text-sky-900',
    borderClass: 'border-sky-300',
    description: 'โครงการอยู่ระหว่างดำเนินการตามแผนงานในพื้นที่'
  },
  completed: {
    value: 'completed',
    label: 'ดำเนินการแล้วเสร็จ',
    shortLabel: 'แล้วเสร็จ',
    icon: '✅',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-900',
    badgeBorder: 'border-emerald-300',
    bgClass: 'bg-emerald-100',
    textClass: 'text-emerald-900',
    borderClass: 'border-emerald-300',
    description: 'โครงการดำเนินการเสร็จสิ้นและส่งมอบงานเรียบร้อย'
  },
  cancelled: {
    value: 'cancelled',
    label: 'ไม่ได้ดำเนินการ / โอนลด',
    shortLabel: 'ไม่ได้ทำ/โอนลด',
    icon: '🔴',
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-900',
    badgeBorder: 'border-rose-300',
    bgClass: 'bg-rose-100',
    textClass: 'text-rose-900',
    borderClass: 'border-rose-300',
    description: 'โครงการถูกยกเลิก ไม่ได้ดำเนินการ หรือโอนลดงบประมาณ'
  },
  not_started: {
    value: 'not_started',
    label: 'รอดำเนินการ',
    shortLabel: 'ยังไม่เริ่ม',
    icon: '⚪',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-700',
    badgeBorder: 'border-slate-300',
    bgClass: 'bg-slate-100',
    textClass: 'text-slate-700',
    borderClass: 'border-slate-300',
    description: 'โครงการตั้งงบประมาณแล้วแต่ยังไม่เริ่มเข้าพื้นที่'
  }
};

/**
 * Resolves canonical execution status for a budgeted project
 */
export const getExecutionStatus = (p: Partial<ProjectData>): ProjectExecutionStatus => {
  if (p.executionStatus === 'cancelled') return 'cancelled';
  if (p.executionStatus === 'completed') return 'completed';
  if (p.executionStatus === 'in_progress') return 'in_progress';
  if (p.executionStatus === 'not_started') return 'not_started';
  return 'in_progress';
};

/**
 * Checks if user has permission to update project execution status (RBAC)
 * Admin, Executive, and Staff in the responsible department can update. Public is read-only.
 */
export const canUserUpdateExecutionStatus = (
  user: UserAccount | null | undefined,
  project?: ProjectData | null
): boolean => {
  if (!user) return false;
  if (user.role === 'public') return false;
  if (user.role === 'admin' || user.role === 'executive') return true;
  if (user.role === 'staff') {
    if (!project || !project.department || !user.department) return true;
    return user.department === project.department || user.department === 'สำนักปลัดเทศบาล';
  }
  return false;
};

/**
 * Robustly matches any project to its canonical VillageInfo from Master Data (28 villages)
 */
export const getProjectVillageInfo = (p: Partial<ProjectData>): VillageInfo | null => {
  if (!p) return null;

  // Priority 1: Match by villageNumber (numeric or numeric string 1-28)
  if (p.villageNumber !== undefined && p.villageNumber !== null) {
    const num = typeof p.villageNumber === 'number' ? p.villageNumber : parseInt(String(p.villageNumber), 10);
    if (!isNaN(num) && num >= 1 && num <= 28) {
      const found = ALL_VILLAGES.find((v) => v.villageNumber === num);
      if (found) return found;
    }
  }

  const combinedText = `${p.village || ''} ${p.name || ''}`;

  // Priority 2: Extract village number from village or name string, e.g. "หมู่ที่ 12", "หมู่ 12", "ม.12"
  const matchNum = combinedText.match(/หมู่ที่\s*(\d+)|หมู่\s*(\d+)|ม\.(\d+)/);
  if (matchNum) {
    const num = parseInt(matchNum[1] || matchNum[2] || matchNum[3], 10);
    if (num >= 1 && num <= 28) {
      const found = ALL_VILLAGES.find((v) => v.villageNumber === num);
      if (found) return found;
    }
  }

  // Priority 3: Exact villageName matching (e.g. "หมู่ที่ 3 บ้านโนนม่วง")
  if (p.village) {
    const cleaned = p.village.trim();
    const found = ALL_VILLAGES.find((v) => v.villageName === cleaned);
    if (found) return found;
  }

  // Priority 4: Sila Municipality Villages with Unique Names
  if (combinedText.includes('ห้วยซัน')) return ALL_VILLAGES.find((v) => v.villageNumber === 4) || null;
  if (combinedText.includes('บึงอีเฒ่า')) return ALL_VILLAGES.find((v) => v.villageNumber === 5) || null;
  if (combinedText.includes('ท่าแก')) return ALL_VILLAGES.find((v) => v.villageNumber === 6) || null;
  if (combinedText.includes('เต่านอ')) return ALL_VILLAGES.find((v) => v.villageNumber === 7) || null;
  if (combinedText.includes('ดงพอง')) return ALL_VILLAGES.find((v) => v.villageNumber === 10) || null;
  if (combinedText.includes('เกษตร')) return ALL_VILLAGES.find((v) => v.villageNumber === 15) || null;

  // Multi-village Communities with disambiguation
  if (combinedText.includes('ดอนหญ้านาง')) {
    if (combinedText.includes('20')) return ALL_VILLAGES.find((v) => v.villageNumber === 20) || null;
    return ALL_VILLAGES.find((v) => v.villageNumber === 13) || null;
  }
  if (combinedText.includes('หนองไผ่')) {
    if (combinedText.includes('21')) return ALL_VILLAGES.find((v) => v.villageNumber === 21) || null;
    if (combinedText.includes('24')) return ALL_VILLAGES.find((v) => v.villageNumber === 24) || null;
    if (combinedText.includes('26')) return ALL_VILLAGES.find((v) => v.villageNumber === 26) || null;
    return ALL_VILLAGES.find((v) => v.villageNumber === 14) || null;
  }
  if (combinedText.includes('หนองกุง')) {
    if (p.zone === 'เขต 2' || combinedText.includes('17')) {
      return ALL_VILLAGES.find((v) => v.villageNumber === 17) || null;
    }
    return ALL_VILLAGES.find((v) => v.villageNumber === 2) || null;
  }
  if (combinedText.includes('โกทา')) {
    if (combinedText.includes('25')) return ALL_VILLAGES.find((v) => v.villageNumber === 25) || null;
    return ALL_VILLAGES.find((v) => v.villageNumber === 9) || null;
  }
  if (combinedText.includes('หนองหิน')) {
    if (combinedText.includes('22')) return ALL_VILLAGES.find((v) => v.villageNumber === 22) || null;
    return ALL_VILLAGES.find((v) => v.villageNumber === 8) || null;
  }
  if (combinedText.includes('ดอนยาง')) {
    if (combinedText.includes('16')) return ALL_VILLAGES.find((v) => v.villageNumber === 16) || null;
    return ALL_VILLAGES.find((v) => v.villageNumber === 11) || null;
  }
  if (combinedText.includes('โนนม่วง')) {
    if (combinedText.includes('12')) return ALL_VILLAGES.find((v) => v.villageNumber === 12) || null;
    if (combinedText.includes('19')) return ALL_VILLAGES.find((v) => v.villageNumber === 19) || null;
    if (combinedText.includes('23')) return ALL_VILLAGES.find((v) => v.villageNumber === 23) || null;
    if (combinedText.includes('27')) return ALL_VILLAGES.find((v) => v.villageNumber === 27) || null;
    return ALL_VILLAGES.find((v) => v.villageNumber === 3) || null;
  }
  if (combinedText.includes('ศิลา')) {
    if (combinedText.includes('18')) return ALL_VILLAGES.find((v) => v.villageNumber === 18) || null;
    if (combinedText.includes('28')) return ALL_VILLAGES.find((v) => v.villageNumber === 28) || null;
    return ALL_VILLAGES.find((v) => v.villageNumber === 1) || null;
  }

  // Priority 5: If zone is known, pick first village in zone
  if (p.zone) {
    const z = SILA_ZONES.find((z) => z.name === p.zone);
    if (z && z.villages.length > 0) return z.villages[0];
  }

  return ALL_VILLAGES[0] || null;
};

/**
 * Checks if a project belongs to a given Village
 */
export const isProjectInVillage = (p: ProjectData, village: VillageInfo): boolean => {
  if (!p || !village) return false;

  // Strict check on villageNumber if available
  if (p.villageNumber !== undefined && p.villageNumber !== null) {
    const num = typeof p.villageNumber === 'number' ? p.villageNumber : parseInt(String(p.villageNumber), 10);
    if (!isNaN(num) && num > 0) {
      return num === village.villageNumber;
    }
  }

  const info = getProjectVillageInfo(p);
  return info?.villageNumber === village.villageNumber;
};

/**
 * Checks if a project belongs to a given Zone
 */
export const isProjectInZone = (p: ProjectData, zone: ZoneInfo): boolean => {
  if (!p || !zone) return false;

  // Match by village membership
  if (p.villageNumber !== undefined && p.villageNumber !== null) {
    const num = typeof p.villageNumber === 'number' ? p.villageNumber : parseInt(String(p.villageNumber), 10);
    if (!isNaN(num) && num > 0) {
      const inZone = zone.villages.some((v) => v.villageNumber === num);
      if (inZone) return true;
    }
  }

  const info = getProjectVillageInfo(p);
  if (info) {
    return info.zone === zone.name;
  }

  return p.zone === zone.name;
};

/**
 * Normalizes project zone, village, and villageNumber to match Master Data
 */
export const normalizeProjectVillageData = (p: ProjectData): ProjectData => {
  const info = getProjectVillageInfo(p);
  if (info) {
    return {
      ...p,
      zone: info.zone,
      village: info.villageName,
      villageNumber: info.villageNumber
    };
  }
  return p;
};

/**
 * Checks if a project has been allocated in the annual municipal budget (ตั้งงบประมาณแล้ว)
 */
export const isProjectBudgetAllocated = (p: ProjectData): boolean => {
  if (!p) return false;
  if (p.isBudgetAllocated !== undefined) return p.isBudgetAllocated;
  if (p.budgetApproved && p.budgetApproved > 0) return true;
  if (p.status === 'approved') return true;
  return false;
};

/**
 * Toggles a project between "อยู่ในแผน (ยังไม่ตั้งงบ)" and "ตั้งงบประมาณแล้ว"
 */
export const toggleProjectBudgetAllocation = (p: ProjectData): ProjectData => {
  const current = isProjectBudgetAllocated(p);
  const next = !current;
  if (next) {
    const total5Years =
      (p.budgetByYear?.['2571'] || 0) +
      (p.budgetByYear?.['2572'] || 0) +
      (p.budgetByYear?.['2573'] || 0) +
      (p.budgetByYear?.['2574'] || 0) +
      (p.budgetByYear?.['2575'] || 0);
    const approvedAmount =
      p.budgetApproved && p.budgetApproved > 0
        ? p.budgetApproved
        : (p.budgetPlan || total5Years || 0);
    return {
      ...p,
      isBudgetAllocated: true,
      status: 'approved',
      budgetApproved: approvedAmount,
      approvedDate: p.approvedDate || new Date().toISOString().split('T')[0],
      executionStatus: p.executionStatus || 'in_progress'
    };
  } else {
    return {
      ...p,
      isBudgetAllocated: false,
      status: 'pending',
      budgetApproved: 0
    };
  }
};

/**
 * Updates a project's execution status along with optional progress note and updater information
 */
export const updateProjectExecutionStatus = (
  p: ProjectData,
  newStatus: ProjectExecutionStatus,
  progressNote?: string,
  updatedBy?: string
): ProjectData => {
  return {
    ...p,
    executionStatus: newStatus,
    executionProgressNote: progressNote !== undefined ? progressNote : p.executionProgressNote,
    executionUpdatedDate: new Date().toISOString().split('T')[0],
    executionUpdatedBy: updatedBy || p.executionUpdatedBy
  };
};
