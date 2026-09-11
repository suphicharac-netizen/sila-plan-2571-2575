export type PlanEdition = 'first' | 'additional' | 'changed' | 'amended';

export type BudgetStatus = 'pending' | 'approved';

export type PublishStatus = 'pending_publish' | 'published_first' | 'published_additional' | 'published_changed';

export interface ProjectData {
  id: string;
  orderNumber: number;
  code: string;
  name: string;
  planStrategy: string; // ประเด็นการพัฒนา
  planCategory: string; // แผนงาน เช่น แผนงานการศึกษา, แผนงานอุตสาหกรรมและการโยธา
  edition: PlanEdition; // ฉบับแรก, เพิ่มเติม, เปลี่ยนแปลง, แก้ไข
  editionNumber?: number; // ครั้งที่
  publishStatus: PublishStatus; // รอจัดรอบประกาศใช้, ประกาศใช้แล้ว ฯลฯ
  objective?: string; // วัตถุประสงค์
  target?: string; // เป้าหมาย (ผลผลิต)
  budgetByYear?: {
    '2571'?: number;
    '2572'?: number;
    '2573'?: number;
    '2574'?: number;
    '2575'?: number;
  };
  expectedResults?: string; // ผลที่คาดว่าจะได้รับ
  budgetPlan: number; // งบตามแผนพัฒนาท้องถิ่น (ปีปัจจุบัน หรือ ยอดรวม)
  budgetSource: string; // แหล่งที่มาของงบประมาณ
  budgetApproved: number; // งบประมาณที่อนุมัติ
  approvedDate: string; // วันที่อนุมัติ
  approvalOrderNo?: string; // เลขที่คำสั่ง/มติ
  status: BudgetStatus; // สถานะ: ยังไม่อนุมัติงบ, อนุมัติงบแล้ว
  executionStatus?: 'completed' | 'in_progress' | 'not_started'; // สถานะการดำเนินงานโครงการ
  department: string; // หน่วยงานรับผิดชอบ เช่น กองการศึกษา, กองช่าง
  year: string; // 2571 - 2575
  note?: string;
  planReference?: string; // ข้อความอ้างอิงตำแหน่งในเล่มแผนฯ เช่น ปรากฏในแผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575) เพิ่มเติม ครั้งที่ 1/2571 หน้าที่ 12 ลำดับที่ 1
  planBookPage?: string; // หน้าที่ในเล่มแผน
  planBookOrder?: string; // ลำดับที่ในเล่มแผน
  reason?: string; // เหตุผลความจำเป็น (กรณีฉบับเปลี่ยนแปลง หรือ แก้ไข)
  originalProjectId?: string;
  originalProjectName?: string;
  originalEdition?: PlanEdition;
  originalTarget?: string;
  originalObjective?: string;
  originalExpectedResults?: string;
  originalDepartment?: string;
  originalBudgetPlan?: number;
  originalBudgetByYear?: {
    '2571'?: number;
    '2572'?: number;
    '2573'?: number;
    '2574'?: number;
    '2575'?: number;
  };
  zone?: string; // เช่น 'เขต 1', 'เขต 2', 'เขต 3'
  village?: string; // เช่น 'หมู่ที่ 1 บ้านโนนม่วง'
  villageNumber?: number; // 1 - 28
}

export interface FilterCriteria {
  year: string;
  planStrategy: string;
  budgetSource: string;
  searchKeyword: string;
  budgetAmount: string;
  status: 'all' | 'approved' | 'pending';
}

export interface PlanAnnouncement {
  id: string;
  orderNumber: number;
  planType: string; // เช่น 'แผนพัฒนาท้องถิ่น เพิ่มเติม', 'แผนพัฒนาท้องถิ่น ฉบับแรก', 'แผนพัฒนาท้องถิ่น เปลี่ยนแปลง', 'แผนพัฒนาท้องถิ่น แก้ไข'
  batchNumber: string; // เช่น '2571-01-01'
  year: string; // '2571'
  approvalDate: string; // '2026-09-02'
  effectiveDate?: string; // วันที่มีผลบังคับใช้ เช่น '09/03/2026'
  announcementNo?: string; // เลขที่ประกาศ เช่น 'ทม.ศล. 01/2571'
  approver?: string; // ผู้อนุมัติ เช่น นายกเทศมนตรีเมืองศิลา
  projectIds: string[]; // รายการรหัสโครงการที่บรรจุในประกาศนี้
  status: 'approved' | 'pending';
  budgetTotal5Years: number; // งบรวม 5 ปี
  department?: string;
  note?: string;
}

export type TrackingStatus = 'not_started' | 'in_progress' | 'delayed' | 'completed';

export interface ProjectTrackingItem {
  id: string;
  projectId?: string;
  orderNumber: number;
  code?: string;
  name: string;
  planStrategy: string;
  planCategory?: string;
  objective: string;
  target: string;
  department: string;
  budgetSource: string;
  budgetApproved: number;
  initialBudget?: number;
  transferIn?: number;
  transferOut?: number;
  netBudget?: number;
  contractBudget: number | null;
  disbursedAmount: number | null;
  remainingBudget?: number;
  progressPercent: number;
  status: TrackingStatus;
  contractNo?: string;
  contractDate?: string;
  startDate?: string;
  endDate?: string;
  responsiblePerson?: string;
  year: string;
  note?: string;
}

export type ActiveNavMenu = 
  | 'dashboard'
  | 'edition_first'
  | 'edition_additional'
  | 'edition_changed'
  | 'edition_amended'
  | 'approve_plan'
  | 'budget_approval'
  | 'project_tracking'
  | 'village_plan'
  | 'report_plan'
  | 'project_search';

export { DEVELOPMENT_STRATEGIES, DEPARTMENTS, SILA_ZONES, ALL_VILLAGES } from './utils/constants';
export type { DevelopmentStrategy, Department, ZoneInfo, VillageInfo } from './utils/constants';
