/**
 * รายการประเด็นการพัฒนามาตรฐาน 5 ประเด็น และรายชื่อหน่วยงานรับผิดชอบหลัก 11 หน่วยงาน
 * เทศบาลเมืองศิลา อ.เมืองขอนแก่น จ.ขอนแก่น
 */

// 1. รายการประเด็นการพัฒนามาตรฐาน (5 ประเด็น)
export const DEVELOPMENT_STRATEGIES = [
  'ประเด็นการพัฒนาที่ 1: การพัฒนาและปรับปรุงระบบสาธารณูปโภคและโครงสร้างพื้นฐานให้เอื้อต่อการคมนาคม รักษาสภาพแวดล้อมและการอยู่อาศัย',
  'ประเด็นการพัฒนาที่ 2: การยกระดับคุณภาพชีวิต ส่งเสริมความเข้มแข็งของชุมชน และความปลอดภัยในชีวิตและทรัพย์สิน',
  'ประเด็นการพัฒนาที่ 3: การพัฒนาสิ่งแวดล้อมเมืองยั่งยืน สุขาภิบาลอาหาร และการสร้างเสริมสุขภาวะที่ดี',
  'ประเด็นการพัฒนาที่ 4: การส่งเสริมด้านการศึกษา ประเพณีวัฒนธรรมและกีฬาให้กับประชาชนทุกช่วงวัย ยกระดับการท่องเที่ยวเชิงวัฒนธรรม',
  'ประเด็นการพัฒนาที่ 5: การพัฒนาระบบการบริการและบริหารจัดการองค์กรให้เป็นหน่วยงานที่มีประสิทธิภาพ มีธรรมาภิบาล มีนวัตกรรม'
] as const;

// 2. รายชื่อหน่วยงานรับผิดชอบหลักของเทศบาลเมืองศิลา (11 หน่วยงาน)
export const DEPARTMENTS = [
  'สำนักปลัดเทศบาล',
  'กองคลัง',
  'กองช่าง',
  'กองการศึกษา',
  'กองสาธารณสุขและสิ่งแวดล้อม',
  'กองสวัสดิการสังคม',
  'กองยุทธศาสตร์และงบประมาณ',
  'กองการเจ้าหน้าที่',
  'หน่วยตรวจสอบภายใน',
  'ศูนย์พัฒนาเด็กเล็กเทศบาลเมืองศิลา',
  'โรงเรียนสาธิตเทศบาลเมืองศิลา'
] as const;

// 3. แหล่งที่มาของงบประมาณ
export const BUDGET_SOURCES = [
  'เทศบัญญัติงบประมาณรายจ่าย',
  'เงินสะสม (จ่ายขาดเงินสะสม)',
  'เงินอุดหนุนเฉพาะกิจ',
  'โอนเพิ่ม/โอนลด/ตั้งจ่ายเป็นรายการใหม่',
  'เงินอุดหนุนจาก อบจ. ขอนแก่น',
  'งบประมาณสนับสนุนจากหน่วยงานอื่น'
] as const;

// 4. หมวดหมู่แผนงานมาตรฐาน
export const PLAN_CATEGORIES = [
  'แผนงานอุตสาหกรรมและการโยธา',
  'แผนงานการศึกษา',
  'แผนงานสาธารณสุข',
  'แผนงานสร้างความเข้มแข็งของชุมชน',
  'แผนงานการเกษตร',
  'แผนงานเคหะและชุมชน',
  'แผนงานสังคมสงเคราะห์',
  'แผนงานการรักษาความสงบภายใน',
  'แผนงานการศาสนา วัฒนธรรม และนันทนาการ',
  'แผนงานการพาณิชย์',
  'แผนงานบริหารงานทั่วไป',
  'แผนงานงบกลาง'
] as const;

export type DevelopmentStrategy = (typeof DEVELOPMENT_STRATEGIES)[number];
export type Department = (typeof DEPARTMENTS)[number];
export type BudgetSource = (typeof BUDGET_SOURCES)[number];
export type PlanCategory = (typeof PLAN_CATEGORIES)[number];

// 5. โครงสร้างข้อมูลเขตและหมู่บ้าน เทศบาลเมืองศิลา (28 หมู่บ้าน 3 เขต)
export interface VillageInfo {
  villageNumber: number;
  villageName: string;
  shortName: string;
  zone: string;
}

export interface ZoneInfo {
  id: string;
  name: string;
  fullName: string;
  description: string;
  color: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  villages: VillageInfo[];
}

export const SILA_ZONES: ZoneInfo[] = [
  {
    id: 'zone_1',
    name: 'เขต 1',
    fullName: 'เขตการปกครองที่ 1 (หนองกุง - โนนม่วง)',
    description: 'พื้นที่ชุมชนบ้านหนองกุง และบ้านโนนม่วง',
    color: '#059669', // emerald
    badgeBg: 'bg-emerald-50',
    badgeBorder: 'border-emerald-200',
    badgeText: 'text-emerald-800',
    villages: [
      { villageNumber: 2, villageName: 'หมู่ที่ 2 บ้านหนองกุง', shortName: 'บ้านหนองกุง', zone: 'เขต 1' },
      { villageNumber: 3, villageName: 'หมู่ที่ 3 บ้านโนนม่วง', shortName: 'บ้านโนนม่วง', zone: 'เขต 1' },
      { villageNumber: 12, villageName: 'หมู่ที่ 12 บ้านโนนม่วง', shortName: 'บ้านโนนม่วง', zone: 'เขต 1' },
      { villageNumber: 19, villageName: 'หมู่ที่ 19 บ้านโนนม่วง', shortName: 'บ้านโนนม่วง', zone: 'เขต 1' },
      { villageNumber: 23, villageName: 'หมู่ที่ 23 บ้านโนนม่วง', shortName: 'บ้านโนนม่วง', zone: 'เขต 1' },
      { villageNumber: 27, villageName: 'หมู่ที่ 27 บ้านโนนม่วง', shortName: 'บ้านโนนม่วง', zone: 'เขต 1' }
    ]
  },
  {
    id: 'zone_2',
    name: 'เขต 2',
    fullName: 'เขตการปกครองที่ 2 (ดอนหญ้านาง - หนองไผ่ - หนองกุง)',
    description: 'พื้นที่ชุมชนบ้านดอนหญ้านาง บ้านหนองไผ่ และบ้านหนองกุง',
    color: '#0284c7', // sky
    badgeBg: 'bg-sky-50',
    badgeBorder: 'border-sky-200',
    badgeText: 'text-sky-800',
    villages: [
      { villageNumber: 13, villageName: 'หมู่ที่ 13 บ้านดอนหญ้านาง', shortName: 'บ้านดอนหญ้านาง', zone: 'เขต 2' },
      { villageNumber: 14, villageName: 'หมู่ที่ 14 บ้านหนองไผ่', shortName: 'บ้านหนองไผ่', zone: 'เขต 2' },
      { villageNumber: 17, villageName: 'หมู่ที่ 17 บ้านหนองกุง', shortName: 'บ้านหนองกุง', zone: 'เขต 2' },
      { villageNumber: 20, villageName: 'หมู่ที่ 20 บ้านดอนหญ้านาง', shortName: 'บ้านดอนหญ้านาง', zone: 'เขต 2' },
      { villageNumber: 21, villageName: 'หมู่ที่ 21 บ้านหนองไผ่', shortName: 'บ้านหนองไผ่', zone: 'เขต 2' },
      { villageNumber: 24, villageName: 'หมู่ที่ 24 บ้านหนองไผ่', shortName: 'บ้านหนองไผ่', zone: 'เขต 2' },
      { villageNumber: 26, villageName: 'หมู่ที่ 26 บ้านหนองไผ่', shortName: 'บ้านหนองไผ่', zone: 'เขต 2' }
    ]
  },
  {
    id: 'zone_3',
    name: 'เขต 3',
    fullName: 'เขตการปกครองที่ 3 (ศิลา - โกทา - หนองหิน - ห้วยซัน - ดอนยาง)',
    description: 'พื้นที่ชุมชนบ้านศิลา โกทา หนองหิน ห้วยซัน ดอนยาง ดงพอง ท่าแก เต่านอ และเกษตร',
    color: '#7c3aed', // purple
    badgeBg: 'bg-purple-50',
    badgeBorder: 'border-purple-200',
    badgeText: 'text-purple-800',
    villages: [
      { villageNumber: 1, villageName: 'หมู่ที่ 1 บ้านศิลา', shortName: 'บ้านศิลา', zone: 'เขต 3' },
      { villageNumber: 4, villageName: 'หมู่ที่ 4 บ้านห้วยซัน', shortName: 'บ้านห้วยซัน', zone: 'เขต 3' },
      { villageNumber: 5, villageName: 'หมู่ที่ 5 บ้านบึงอีเฒ่า', shortName: 'บ้านบึงอีเฒ่า', zone: 'เขต 3' },
      { villageNumber: 6, villageName: 'หมู่ที่ 6 บ้านท่าแก', shortName: 'บ้านท่าแก', zone: 'เขต 3' },
      { villageNumber: 7, villageName: 'หมู่ที่ 7 บ้านเต่านอ', shortName: 'บ้านเต่านอ', zone: 'เขต 3' },
      { villageNumber: 8, villageName: 'หมู่ที่ 8 บ้านหนองหิน', shortName: 'บ้านหนองหิน', zone: 'เขต 3' },
      { villageNumber: 9, villageName: 'หมู่ที่ 9 บ้านโกทา', shortName: 'บ้านโกทา', zone: 'เขต 3' },
      { villageNumber: 10, villageName: 'หมู่ที่ 10 บ้านดงพอง', shortName: 'บ้านดงพอง', zone: 'เขต 3' },
      { villageNumber: 11, villageName: 'หมู่ที่ 11 บ้านดอนยาง', shortName: 'บ้านดอนยาง', zone: 'เขต 3' },
      { villageNumber: 15, villageName: 'หมู่ที่ 15 บ้านเกษตร', shortName: 'บ้านเกษตร', zone: 'เขต 3' },
      { villageNumber: 16, villageName: 'หมู่ที่ 16 บ้านดอนยาง', shortName: 'บ้านดอนยาง', zone: 'เขต 3' },
      { villageNumber: 18, villageName: 'หมู่ที่ 18 บ้านศิลา', shortName: 'บ้านศิลา', zone: 'เขต 3' },
      { villageNumber: 22, villageName: 'หมู่ที่ 22 บ้านหนองหิน', shortName: 'บ้านหนองหิน', zone: 'เขต 3' },
      { villageNumber: 25, villageName: 'หมู่ที่ 25 บ้านโกทา', shortName: 'บ้านโกทา', zone: 'เขต 3' },
      { villageNumber: 28, villageName: 'หมู่ที่ 28 บ้านศิลา', shortName: 'บ้านศิลา', zone: 'เขต 3' }
    ]
  }
];

export const ALL_VILLAGES: VillageInfo[] = SILA_ZONES.flatMap((z) => z.villages);

