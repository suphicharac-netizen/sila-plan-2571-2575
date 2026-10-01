export type PlanEdition = 'first' | 'additional' | 'changed' | 'amended';

export type BudgetStatus = 'pending' | 'approved';

export type PublishStatus = 'pending_publish' | 'published_first' | 'published_additional' | 'published_changed';

export type ProjectExecutionStatus = 'in_progress' | 'completed' | 'cancelled' | 'not_started';

export type ProjectAreaType = 'village' | 'facility' | 'custom';

export interface ApprovalAuditEntry {
  action: string;
  timestamp: string;
  userName: string;
  userRole?: string;
  note?: string;
  amount?: number;
}

export interface ProjectData {
  id: string;
  orderNumber: number;
  code: string;
  name: string;
  planStrategy: string; // ประเด็นการพัฒนา
  strategy?: string; // ยุทธศาสตร์
  planCategory: string; // แผนงาน เช่น แผนงานการศึกษา, แผนงานอุตสาหกรรมและการโยธา
  edition: PlanEdition; // ฉบับแรก, เพิ่มเติม, เปลี่ยนแปลง, แก้ไข
  editionNumber?: number; // ครั้งที่
  publishStatus: PublishStatus; // รอจัดรอบประกาศใช้, ประกาศใช้แล้ว ฯลฯ
  objective?: string; // วัตถุประสงค์
  target?: string; // เป้าหมาย (ผลผลิต)
  kpi?: string; // ตัวชี้วัด (KPI)
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
  approvedBy?: string; // ผู้อนุมัติ
  approvedAt?: string; // วันที่และเวลาอนุมัติ
  approvalAuditTrail?: ApprovalAuditEntry[]; // ประวัติการอนุมัติ (Audit Trail)
  status: BudgetStatus; // สถานะ: ยังไม่อนุมัติงบ, อนุมัติงบแล้ว
  planStatus?: 'draft' | 'approved'; // สถานะแผนพัฒนาท้องถิ่น: 'draft' = ร่างแผน (ก่อนอนุมัติ), 'approved' = อนุมัติ / ประกาศใช้แล้ว
  executionStatus?: ProjectExecutionStatus; // สถานะการดำเนินงานโครงการ: in_progress | completed | cancelled | not_started
  executionProgressNote?: string; // บันทึกหมายเหตุความก้าวหน้าโครงการ
  executionUpdatedDate?: string; // วันที่อัปเดตสถานะการดำเนินงานล่าสุด
  executionUpdatedBy?: string; // ผู้บันทึก/อัปเดตสถานะ (ชื่อ-สกุล และตำแหน่ง)
  department: string; // หน่วยงานรับผิดชอบ เช่น กองการศึกษา, กองช่าง
  year: string; // 2571 - 2575
  note?: string;
  planReference?: string; // ข้อความอ้างอิงตำแหน่งในเล่มแผนฯ เช่น ปรากฏในแผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575) เพิ่มเติม ครั้งที่ 1/2571 หน้าที่ 12 ลำดับที่ 1
  planBookPage?: string; // หน้าที่ในเล่มแผน
  planBookOrder?: string; // ลำดับที่ในเล่มแผน
  reason?: string; // เหตุผลความจำเป็น (กรณีฉบับเปลี่ยนแปลง หรือ แก้ไข)
  originalProjectId?: string;
  originalProjectName?: string;
  originalPlanStrategy?: string;
  originalEdition?: PlanEdition;
  originalTarget?: string;
  originalObjective?: string;
  originalExpectedResults?: string;
  originalDepartment?: string;
  originalBudgetPlan?: number;
  originalApprovedDate?: string;
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
  isBudgetAllocated?: boolean; // สถานะการนำไปตั้งงบประมาณ: true = ตั้งงบประมาณแล้ว, false = อยู่ในแผน (ยังไม่ตั้งงบ)
  imageUrl?: string; // ภาพประกอบโครงการ (Data URL หรือ URL รูปภาพ)
  image?: string; // ภาพประกอบโครงการ
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
  status: 'approved' | 'pending' | 'pending_approval' | 'pending_announcement' | 'returned' | string;
  budgetTotal5Years: number; // งบรวม 5 ปี
  department?: string;
  note?: string;
  budgetByYear?: { [year: string]: number };
  lastActionDate?: string; // วันที่ดำเนินการล่าสุด
}

export type AuditLogCategory = 
  | 'plan_approval'        // การอนุมัติและประกาศใช้แผน
  | 'project_modification' // การเพิ่ม/แก้ไข/เปลี่ยนแปลง/ลบโครงการ
  | 'budget'               // การอนุมัติงบประมาณ
  | 'tracking'             // ติดตามประเมินผล
  | 'system';              // การซิงค์และจัดการระบบ

export interface PlanAuditLogEntry {
  id: string;
  timestamp: string; // วันที่-เวลา
  planName: string; // แผนพัฒนาท้องถิ่น หรือชื่อโครงการ
  action: 'อนุมัติ' | 'ประกาศใช้' | 'ส่งกลับแก้ไข' | 'เพิ่มโครงการ' | 'แก้ไขโครงการ' | 'เปลี่ยนแปลงโครงการ' | 'ลบโครงการ' | 'จัดสรรงบประมาณ' | 'ปลดล็อกงบประมาณ' | 'อัปเดตความก้าวหน้า' | string; // การดำเนินการ
  category?: AuditLogCategory;
  actorName: string; // ผู้ดำเนินการ
  actorRole?: string; // บทบาท/ตำแหน่ง
  department?: string; // หน่วยงานรับผิดชอบ
  targetCode?: string; // รหัสอ้างอิง เช่น เลขที่โครงการ / เลขที่ประกาศ
  details?: string; // รายละเอียดการเปลี่ยนแปลง
  beforeValue?: string; // ข้อมูลเดิม (กรณีเปรียบเทียบ)
  afterValue?: string; // ข้อมูลใหม่ (กรณีเปรียบเทียบ)
  ipAddress?: string; // ช่องทางหรือ IP
  note?: string; // หมายเหตุ (ถ้ามี)
}

export type TrackingStatus = 'not_started' | 'in_progress' | 'delayed' | 'completed' | 'cancelled';

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
  executionDate?: string;
  progressSummary?: string;
  obstacles?: string;
  satisfactionLevel?: string;
  attachmentName?: string;
  attachmentUrl?: string;
  activityImages?: string[];
  responsiblePerson?: string;
  year: string;
  note?: string;
}

export type UserRole = 'admin' | 'staff' | 'executive' | 'public';

export interface UserAccount {
  id: string;
  username: string;
  password?: string;
  fullName: string;
  role: UserRole;
  department?: string; // One of 11 departments (for admin/staff/executive)
  village?: string;    // e.g. 'หมู่ที่ 1 บ้านศิลา' (for public)
  villageNumber?: number;
  purpose?: string;    // e.g. 'ติดตามโครงการในหมู่บ้าน' (for public)
  createdAt: string;
  lastLoginAt?: string;
}

export interface VisitorLog {
  id: string;
  fullName: string;
  village: string;
  villageNumber?: number;
  purpose: string;
  timestamp: string; // Thai format or ISO string
}

export type ActiveNavMenu = 
  | 'dashboard'
  | 'citizen_portal'
  | 'report_system'
  | 'edition_first'
  | 'edition_additional'
  | 'edition_changed'
  | 'edition_amended'
  | 'approve_plan'
  | 'budget_approval'
  | 'project_tracking'
  | 'village_plan'
  | 'village_plan_report'
  | 'report_plan'
  | 'report_comparison'
  | 'audit_log'
  | 'data_management'
  | 'login_screen'
  | 'citizen_news'
  | 'citizen_downloads'
  | 'citizen_faq'
  | 'citizen_contact';

export { DEVELOPMENT_STRATEGIES, MUNICIPAL_STRATEGIES, DEPARTMENTS, SILA_ZONES, ALL_VILLAGES } from './utils/constants';
export type { DevelopmentStrategy, Department, ZoneInfo, VillageInfo } from './utils/constants';
