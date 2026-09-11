import { DEVELOPMENT_STRATEGIES, PLAN_CATEGORIES } from './constants';

/**
 * ตารางจับคู่ชื่อแผนงานทางการ กับตัวย่อแผนงานมาตรฐาน
 * ตัวอย่าง:
 * - แผนงานเคหะและชุมชน -> เคหะ
 * - แผนงานการศึกษา -> ศึกษา
 * - แผนงานสาธารณสุข -> สาธารณ
 * - แผนงานอุตสาหกรรมและการโยธา -> โยธา
 */
export const PLAN_CATEGORY_ABBR_MAP: Record<string, string> = {
  'แผนงานเคหะและชุมชน': 'เคหะ',
  'แผนงานการศึกษา': 'ศึกษา',
  'แผนงานสาธารณสุข': 'สาธารณ',
  'แผนงานอุตสาหกรรมและการโยธา': 'โยธา',
  'แผนงานสร้างความเข้มแข็งของชุมชน': 'ชุมชน',
  'แผนงานการเกษตร': 'เกษตร',
  'แผนงานสังคมสงเคราะห์': 'สงเคราะห์',
  'แผนงานการรักษาความสงบภายใน': 'ความสงบ',
  'แผนงานการศาสนา วัฒนธรรม และนันทนาการ': 'วัฒนธรรม',
  'แผนงานการพาณิชย์': 'พาณิชย์',
  'แผนงานบริหารงานทั่วไป': 'บริหาร',
  'แผนงานงบกลาง': 'งบกลาง'
};

/**
 * ดึงตัวย่อแผนงานจากชื่อเต็ม หรือข้อความที่มีชื่อหมวดหมู่
 */
export function getPlanCategoryAbbr(category?: string | null): string {
  if (!category) return 'ทั่วไป';
  const trimmed = category.trim();

  // ตรวจสอบจากตารางตรงตัว
  if (PLAN_CATEGORY_ABBR_MAP[trimmed]) {
    return PLAN_CATEGORY_ABBR_MAP[trimmed];
  }

  // ตรวจสอบคำสำคัญในข้อความ
  if (trimmed.includes('เคหะ')) return 'เคหะ';
  if (trimmed.includes('ศึกษา')) return 'ศึกษา';
  if (trimmed.includes('สาธารณ')) return 'สาธารณ';
  if (trimmed.includes('โยธา') || trimmed.includes('อุตสาหกรรม')) return 'โยธา';
  if (trimmed.includes('เข้มแข็ง') || trimmed.includes('ชุมชน')) return 'ชุมชน';
  if (trimmed.includes('เกษตร')) return 'เกษตร';
  if (trimmed.includes('สงเคราะห์')) return 'สงเคราะห์';
  if (trimmed.includes('ความสงบ') || trimmed.includes('รักษาความสงบ')) return 'ความสงบ';
  if (trimmed.includes('วัฒนธรรม') || trimmed.includes('ศาสนา') || trimmed.includes('นันทนาการ')) return 'วัฒนธรรม';
  if (trimmed.includes('พาณิชย์')) return 'พาณิชย์';
  if (trimmed.includes('บริหาร') || trimmed.includes('ทั่วไป')) return 'บริหาร';
  if (trimmed.includes('งบกลาง')) return 'งบกลาง';

  // ตัดคำว่า แผนงาน ออกถ้ามี
  const cleaned = trimmed.replace(/^แผนงาน/, '').trim();
  return cleaned.slice(0, 6) || 'ทั่วไป';
}

/**
 * สกัดหมายเลขประเด็นการพัฒนา (เช่น "ประเด็นการพัฒนาที่ 1: ..." -> "1")
 */
export function getStrategyIssueNumber(strategy?: string | null): string {
  if (!strategy) return '1';
  const trimmed = strategy.trim();

  // 1. ตรวจหาจากรูปแบบตัวเลขตรงตัว เช่น "ประเด็นการพัฒนาที่ 1", "ประเด็นที่ 2", "2. ...", "ป.1"
  const match = trimmed.match(/(?:ประเด็นการพัฒนาที่|ประเด็นที่|ยุทธศาสตร์ที่|\bป\.)\s*(\d+)/);
  if (match && match[1]) {
    return match[1];
  }
  const leadingNumMatch = trimmed.match(/^(\d+)[.:\s]/);
  if (leadingNumMatch && leadingNumMatch[1]) {
    return leadingNumMatch[1];
  }

  // 2. ตรวจสอบจากการเทียบกับ DEVELOPMENT_STRATEGIES
  const idx = DEVELOPMENT_STRATEGIES.findIndex(
    (s) => s.includes(trimmed) || trimmed.includes(s.replace(/^ประเด็นการพัฒนาที่ \d+:\s*/, ''))
  );
  if (idx >= 0) {
    return String(idx + 1);
  }

  // 3. ตรวจหาคำสำคัญในประเด็น
  if (trimmed.includes('โครงสร้างพื้นฐาน') || trimmed.includes('สาธารณูปโภค') || trimmed.includes('คมนาคม')) return '1';
  if (trimmed.includes('คุณภาพชีวิต') || trimmed.includes('ความเข้มแข็งของชุมชน')) return '2';
  if (trimmed.includes('สิ่งแวดล้อม') || trimmed.includes('สุขภาวะ') || trimmed.includes('สุขาภิบาล')) return '3';
  if (trimmed.includes('การศึกษา') || trimmed.includes('วัฒนธรรม') || trimmed.includes('กีฬา')) return '4';
  if (trimmed.includes('บริหารจัดการ') || trimmed.includes('ธรรมาภิบาล') || trimmed.includes('ประสิทธิภาพ')) return '5';

  const digitMatch = trimmed.match(/\d+/);
  return digitMatch ? digitMatch[0] : '1';
}

/**
 * สร้างรหัสโครงการสั้นมาตรฐาน:
 * รูปแบบ: [ป.ประเด็น]-[ตัวย่อแผนงาน]-[ลำดับที่ 3 หลัก]
 * เช่น: ป.1-โยธา-001, ป.2-ศึกษา-001, ป.1-พาณิชย์-001
 */
export function generateStandardProjectCode(
  strategy?: string | null,
  category?: string | null,
  sequence: number | string = 1,
  suffix?: string
): string {
  const issueNum = getStrategyIssueNumber(strategy);
  const catAbbr = getPlanCategoryAbbr(category);
  const seqPadded = String(sequence).replace(/\D/g, '').padStart(3, '0') || '001';

  let baseCode = `ป.${issueNum}-${catAbbr}-${seqPadded}`;
  if (suffix && suffix.trim()) {
    const cleanSuffix = suffix.replace(/^-/, '').trim();
    if (cleanSuffix) {
      baseCode += `-${cleanSuffix}`;
    }
  }
  return baseCode;
}

/**
 * รับรหัส ID มาตรฐานสำหรับแสดงผลในคอลัมน์ ID ของทุกตาราง
 * รูปแบบ: ป.1-โยธา-001
 */
export function getProjectDisplayId(
  project?: {
    code?: string | null;
    planStrategy?: string | null;
    planCategory?: string | null;
    orderNumber?: number | string | null;
    id?: string | null;
    [key: string]: any;
  } | null,
  fallbackIndex: number = 1
): string {
  if (!project) return `ป.1-โยธา-${String(fallbackIndex).padStart(3, '0')}`;
  
  if (project.code && project.code.trim()) {
    const trimmed = project.code.trim();
    if (trimmed.startsWith('ป.')) {
      return trimmed;
    }
    // หากเป็น PRJ-xxx หรือตัวเลขโดด ให้แปลงเป็นรหัสมาตรฐานตามแผน
    if (/^PRJ/i.test(trimmed) || /^\d+$/.test(trimmed)) {
      const seq = project.orderNumber || fallbackIndex;
      return generateStandardProjectCode(project.planStrategy, project.planCategory, seq);
    }
    return trimmed;
  }

  const seq = project.orderNumber || fallbackIndex;
  return generateStandardProjectCode(project.planStrategy, project.planCategory, seq);
}

/**
 * จัดรูปแบบการแสดงชื่อโครงการในตารางทุกหน้า:
 * เช่น: [ป.1-โยธา-001] โครงการก่อสร้างถนน คสล. บ้านโนนม่วง ซอย 5
 */
export function formatProjectDisplayTitle(code?: string | null, name?: string | null): string {
  const cleanName = (name || '').trim();
  const cleanCode = (code || '').trim();

  if (!cleanCode) return cleanName;

  // ตรวจสอบว่ามีรหัสในวงเล็บอยู่หน้าชื่อแล้วหรือไม่
  const pattern = new RegExp(`^\\[${cleanCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]\\s*`, 'i');
  if (pattern.test(cleanName)) {
    return cleanName;
  }

  // หากชื่อมีรหัสอื่นในวงเล็บอยู่แล้ว (เช่น [ป.1-xxx-001])
  if (/^\[[^\]]+\]\s*/.test(cleanName)) {
    return cleanName;
  }

  return `[${cleanCode}] ${cleanName}`;
}

/**
 * Logic ตรวจสอบการค้นหาโครงการ (Search Bar):
 * รองรับการค้นหาด้วยรหัสโครงการแบบสั้นทุกรูปแบบ (เช่น ป.1-โยธา-001, โยธา, ป.1, 001, ป1)
 * และคำค้นหาชื่อโครงการ, วัตถุประสงค์, แผนงาน, หน่วยงาน
 */
export function matchesProjectSearch(
  query: string,
  project: {
    name?: string;
    code?: string;
    objective?: string;
    target?: string;
    department?: string;
    planCategory?: string;
    planStrategy?: string;
    orderNumber?: number;
    [key: string]: any;
  }
): boolean {
  if (!query || !query.trim()) return true;

  const rawKeyword = query.trim().toLowerCase();
  // ทำความสะอาดคีย์เวิร์ดตัด [ ] ออกสำหรับเปรียบเทียบรหัส
  const normalizedKeyword = rawKeyword.replace(/[[\]]/g, '').trim();
  const noDotKeyword = normalizedKeyword.replace(/\./g, '');

  const displayId = getProjectDisplayId(project).toLowerCase();
  const code = (project.code || displayId).toLowerCase();
  const normalizedCode = code.replace(/[[\]]/g, '');
  const noDotCode = normalizedCode.replace(/\./g, '');

  const name = (project.name || '').toLowerCase();
  const objective = (project.objective || '').toLowerCase();
  const target = (project.target || '').toLowerCase();
  const department = (project.department || '').toLowerCase();
  const planCategory = (project.planCategory || '').toLowerCase();
  const planStrategy = (project.planStrategy || '').toLowerCase();

  // 1. ค้นหาตรงกับรหัสโครงการ (รวมแบบย่อย เช่น "โยธา", "ศึกษา", "ป.1", "001", "ป1", "ป.1-โยธา-001")
  if (
    code.includes(rawKeyword) ||
    normalizedCode.includes(normalizedKeyword) ||
    code.includes(normalizedKeyword) ||
    displayId.includes(rawKeyword) ||
    displayId.includes(normalizedKeyword) ||
    noDotCode.includes(noDotKeyword)
  ) {
    return true;
  }

  // 2. ค้นหาในชื่อโครงการ (ทั้งแบบมีรหัสนำหน้าและไม่มี)
  if (name.includes(rawKeyword) || name.includes(normalizedKeyword)) {
    return true;
  }

  // 3. ค้นหาในวัตถุประสงค์, เป้าหมาย, หน่วยงาน, แผนงาน, ประเด็น
  if (
    objective.includes(rawKeyword) ||
    target.includes(rawKeyword) ||
    department.includes(rawKeyword) ||
    planCategory.includes(rawKeyword) ||
    planStrategy.includes(rawKeyword)
  ) {
    return true;
  }

  return false;
}
