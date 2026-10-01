import { ProjectData, PlanAnnouncement, ProjectTrackingItem, PlanAuditLogEntry } from '../types';
import { INITIAL_PROJECTS, INITIAL_ANNOUNCEMENTS, INITIAL_TRACKING_ITEMS } from '../data/initialData';
import { normalizeProjectVillageData } from '../utils/villageUtils';
import { sanitizeAnnouncementsSequence } from '../utils/planSequence';

const STORAGE_KEY = 'sila_digital_plan_projects_v8';
const ANNOUNCEMENTS_KEY = 'sila_digital_plan_announcements_v4';
const TRACKING_KEY = 'sila_digital_plan_tracking_v3';
const AUDIT_LOGS_KEY = 'sila_digital_plan_audit_logs_v1';
const VERSION_KEY = 'sila_digital_plan_version';
const CURRENT_VERSION = '2571_v23_master_28_villages_synced';

const normalizeBudgetSource = (source?: string): string => {
  if (!source) return '- ยังไม่ได้จัดสรร -';
  if (source === 'งบประมาณเทศบาล (เงินรายได้)' || source === 'เทศบัญญัติงบประมาณรายจ่ายประจำปี') {
    return 'เทศบัญญัติงบประมาณรายจ่าย';
  }
  if (source === 'เงินสะสม / เงินทุนสำรองสะสม' || source === 'เงินสะสม') {
    return 'เงินสะสม (จ่ายขาดเงินสะสม)';
  }
  if (source === 'เงินอุดหนุนทั่วไป') {
    return 'เงินอุดหนุนเฉพาะกิจ';
  }
  if (source === 'เงินกู้ / เงินบริจาค / แหล่งอื่น' || source === 'เงินกู้ / อื่นๆ') {
    return 'งบประมาณสนับสนุนจากหน่วยงานอื่น';
  }
  return source;
};

export const storageService = {
  getProjects(): ProjectData[] {
    try {
      const storedVersion = localStorage.getItem(VERSION_KEY);
      const storedData = localStorage.getItem(STORAGE_KEY);

      // If version changed or data does not exist, initialize with default dataset
      if (!storedData || storedVersion !== CURRENT_VERSION) {
        this.saveProjects(INITIAL_PROJECTS);
        localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
        return INITIAL_PROJECTS;
      }

      const parsed = JSON.parse(storedData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((p: ProjectData) => {
          const withZone = normalizeProjectVillageData(p);
          return {
            ...withZone,
            budgetSource: normalizeBudgetSource(withZone.budgetSource)
          };
        });
      }
      return INITIAL_PROJECTS;
    } catch (err) {
      console.warn('Storage read error, using initial dataset:', err);
      return INITIAL_PROJECTS;
    }
  },

  saveProjects(projects: ProjectData[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
      localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
    } catch (err) {
      console.error('Storage write error:', err);
    }
  },

  getAnnouncements(): PlanAnnouncement[] {
    try {
      const stored = localStorage.getItem(ANNOUNCEMENTS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const sanitized = sanitizeAnnouncementsSequence(parsed);
          return sanitized;
        }
      }
      const initial = sanitizeAnnouncementsSequence(INITIAL_ANNOUNCEMENTS);
      this.saveAnnouncements(initial);
      return initial;
    } catch (err) {
      console.warn('Announcements read error:', err);
      return sanitizeAnnouncementsSequence(INITIAL_ANNOUNCEMENTS);
    }
  },

  saveAnnouncements(announcements: PlanAnnouncement[]): void {
    try {
      localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(announcements));
    } catch (err) {
      console.error('Announcements write error:', err);
    }
  },

  getPlanAuditLogs(): PlanAuditLogEntry[] {
    try {
      const stored = localStorage.getItem(AUDIT_LOGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      const initialLogs: PlanAuditLogEntry[] = [
        {
          id: 'LOG-014',
          timestamp: '28/09/2571 14:20:18',
          planName: 'แผนพัฒนาท้องถิ่น (พ.ศ. 2571 - 2575) แก้ไข ครั้งที่ 17/2571',
          action: 'ประกาศใช้',
          category: 'plan_approval',
          actorName: 'นายกเทศมนตรีเมืองศิลา',
          actorRole: 'ผู้บริหารสูงสุด',
          department: 'สำนักปลัดเทศบาล',
          targetCode: 'ทม.ศล. 17/2571',
          details: 'ลงนามประกาศใช้แผนพัฒนาท้องถิ่น (แก้ไข ครั้งที่ 17) และปิดประกาศ ณ ป้ายประชาสัมพันธ์เทศบาลเมืองศิลา',
          ipAddress: '192.168.10.12 (เครื่องนายกฯ)',
          note: 'ปิดประกาศอย่างเป็นทางการตามระเบียบกระทรวงมหาดไทยฯ'
        },
        {
          id: 'LOG-013',
          timestamp: '25/09/2571 09:30:15',
          planName: 'แผนพัฒนาท้องถิ่น (พ.ศ. 2571 - 2575) แก้ไข ครั้งที่ 17/2571',
          action: 'อนุมัติ',
          category: 'plan_approval',
          actorName: 'นายกเทศมนตรีเมืองศิลา',
          actorRole: 'ผู้บริหารสูงสุด',
          department: 'กองยุทธศาสตร์และงบประมาณ',
          targetCode: 'ทม.ศล. 17/2571',
          details: 'อนุมัติการแก้ไขข้อความและรายละเอียดโครงการตามอำนาจของผู้บริหารท้องถิ่น (ระเบียบฯ ข้อ 21)',
          ipAddress: '192.168.10.12 (เครื่องนายกฯ)',
          note: 'สภาเทศบาลฯ และคณะกรรมการพัฒนาเทศบาลเมืองศิลาให้ความเห็นชอบแล้ว อนุมัติเพื่อเตรียมการประกาศใช้'
        },
        {
          id: 'LOG-012',
          timestamp: '22/09/2571 15:45:00',
          planName: 'โครงการก่อสร้างระบบระบายน้ำและขยายผิวจราจร คสล. หมู่ที่ 3 บ้านดอนหญ้านาง',
          action: 'จัดสรรงบประมาณ',
          category: 'budget',
          actorName: 'นางสาวกมลวรรณ แซ่ดี',
          actorRole: 'หัวหน้าฝ่ายแผนงานและงบประมาณ',
          department: 'กองคลัง',
          targetCode: 'ยุทธศาสตร์ที่ 1 ลำดับที่ 3',
          details: 'จัดสรรและอนุมัติตั้งงบประมาณโครงการจากแหล่งเงินสะสม (จ่ายขาดเงินสะสมประจำปี 2571)',
          beforeValue: 'สถานะ: อยู่ในแผน (ยังไม่ตั้งงบ) | งบที่อนุมัติ: 0 บาท',
          afterValue: 'สถานะ: อนุมัติตั้งงบแล้ว | งบที่อนุมัติ: 3,500,000 บาท',
          ipAddress: '192.168.10.45 (กองคลัง)',
          note: 'ผ่านความเห็นชอบตามมติสภาเทศบาลเมืองศิลา สมัยสามัญ สมัยที่ 3'
        },
        {
          id: 'LOG-011',
          timestamp: '18/09/2571 11:10:22',
          planName: 'โครงการปรับปรุงระบบประปาผิวดินขนาดใหญ่ หมู่ที่ 1 บ้านศิลา',
          action: 'อัปเดตความก้าวหน้า',
          category: 'tracking',
          actorName: 'นายสมเกียรติ สุขสมบูรณ์',
          actorRole: 'วิศวกรสุขาภิบาลชำนาญการ',
          department: 'กองช่าง',
          targetCode: 'ผ.03-2571-008',
          details: 'บันทึกรายงานผลความก้าวหน้างานงวดที่ 2 ติดตั้งถังตกตะกอนและระบบกรองทรายเรียบร้อย',
          beforeValue: 'ความก้าวหน้า: 40% (อยู่ระหว่างดำเนินการ)',
          afterValue: 'ความก้าวหน้า: 75% (งานคืบหน้าตามแผน)',
          ipAddress: '192.168.10.88 (กองช่าง)',
          note: 'การตรวจรับงานจ้างงวดที่ 2 เป็นไปตามข้อกำหนดสัญญา'
        },
        {
          id: 'LOG-010',
          timestamp: '12/09/2571 16:00:30',
          planName: 'โครงการติดตั้งกล้องโทรทัศน์วงจรปิด (CCTV) เพื่อความปลอดภัยชุมชน',
          action: 'แก้ไขโครงการ',
          category: 'project_modification',
          actorName: 'นางสาวพรทิพย์ เจริญผล',
          actorRole: 'นักวิเคราะห์นโยบายและแผนชำนาญการ',
          department: 'สำนักปลัดเทศบาล',
          targetCode: 'ยุทธศาสตร์ที่ 4 ลำดับที่ 6',
          details: 'แก้ไขจุดติดตั้งกล้องวงจรปิดเพิ่มเติมบริเวณจุดตัดทางแยกถนนเลี่ยงเมืองตามข้อร้องเรียนประชาคม',
          beforeValue: 'เป้าหมาย: ติดตั้ง CCTV จำนวน 24 จุด ทั่วพื้นที่เทศบาล',
          afterValue: 'เป้าหมาย: ติดตั้ง CCTV จำนวน 32 จุด พร้อมระบบตรวจจับป้ายทะเบียนอัจฉริยะ',
          ipAddress: '192.168.10.24 (สำนักปลัด)',
          note: 'แก้ไขตามระเบียบกระทรวงมหาดไทยฯ ข้อ 21 โดยอำนาจนายกเทศมนตรี'
        },
        {
          id: 'LOG-009',
          timestamp: '05/09/2571 10:15:40',
          planName: 'โครงการศูนย์เรียนรู้เศรษฐกิจพอเพียงและนวัตกรรมเกษตรยั่งยืน หมู่ 14',
          action: 'เพิ่มโครงการ',
          category: 'project_modification',
          actorName: 'นายประสิทธิ์ ศรีสวัสดิ์',
          actorRole: 'นักวิชาการเกษตรชำนาญการ',
          department: 'กองสาธารณสุขและสิ่งแวดล้อม',
          targetCode: 'ยุทธศาสตร์ที่ 3 ลำดับที่ 12',
          details: 'บรรจุโครงการใหม่ในแผนพัฒนาท้องถิ่น ฉบับเพิ่มเติม ครั้งที่ 24/2571 จากเวทีประชาคมตำบลศิลา',
          beforeValue: '- ไม่มีในระบบ -',
          afterValue: 'บรรจุโครงการใหม่ งบประมาณรวม 1,200,000 บาท',
          ipAddress: '192.168.10.33 (กองสาธารณสุขฯ)',
          note: 'ผ่านการพิจารณาของคณะกรรมการสนับสนุนการจัดทำแผนพัฒนา'
        },
        {
          id: 'LOG-008',
          timestamp: '01/09/2571 08:30:00',
          planName: 'ฐานข้อมูลแผนพัฒนาท้องถิ่นและระบบงบประมาณเทศบาลเมืองศิลา',
          action: 'สำรองและซิงค์ข้อมูล',
          category: 'system',
          actorName: 'ผู้ดูแลระบบกลาง',
          actorRole: 'System Administrator',
          department: 'กองยุทธศาสตร์และงบประมาณ',
          targetCode: 'SYS-SYNC-25710901',
          details: 'เชื่อมต่อและซิงค์ข้อมูลฐานข้อมูลโครงการ 28 หมู่บ้าน กับ Google Sheets API อัตโนมัติ',
          ipAddress: '127.0.0.1 (System Core)',
          note: 'สำรองข้อมูลโครงการทั้งหมด 150+ รายการสมบูรณ์ ไม่พบข้อผิดพลาด'
        },
        {
          id: 'LOG-007',
          timestamp: '25/08/2571 09:30:15',
          planName: 'แผนพัฒนาท้องถิ่น (พ.ศ. 2571 - 2575) แก้ไข ครั้งที่ 16/2571',
          action: 'อนุมัติ',
          category: 'plan_approval',
          actorName: 'นายกเทศมนตรีเมืองศิลา',
          actorRole: 'ผู้บริหารสูงสุด',
          department: 'สำนักปลัดเทศบาล',
          targetCode: 'ทม.ศล. 16/2571',
          details: 'อนุมัติการแก้ไขข้อความและคำผิดในเล่มแผนพัฒนาท้องถิ่น (ระเบียบฯ ข้อ 21)',
          ipAddress: '192.168.10.12 (เครื่องนายกฯ)',
          note: 'สภาเทศบาลฯ ให้ความเห็นชอบแล้ว อนุมัติเพื่อเตรียมการประกาศใช้'
        },
        {
          id: 'LOG-006',
          timestamp: '16/08/2571 10:30:00',
          planName: 'แผนพัฒนาท้องถิ่น (พ.ศ. 2571 - 2575) แก้ไข ครั้งที่ 16/2571',
          action: 'ประกาศใช้',
          category: 'plan_approval',
          actorName: 'นายกเทศมนตรีเมืองศิลา',
          actorRole: 'ผู้บริหารสูงสุด',
          department: 'สำนักปลัดเทศบาล',
          targetCode: 'ทม.ศล. 16/2571',
          details: 'ลงนามประกาศใช้แผนพัฒนาท้องถิ่นอย่างเป็นทางการและเผยแพร่ผ่านช่องทางประชาสัมพันธ์',
          ipAddress: '192.168.10.12 (เครื่องนายกฯ)',
          note: 'ลงนามประกาศใช้แผนพัฒนาท้องถิ่นอย่างเป็นทางการ'
        },
        {
          id: 'LOG-005',
          timestamp: '15/08/2571 09:15:00',
          planName: 'แผนพัฒนาท้องถิ่น (พ.ศ. 2571 - 2575) แก้ไข ครั้งที่ 16/2571',
          action: 'อนุมัติ',
          category: 'plan_approval',
          actorName: 'นายกเทศมนตรีเมืองศิลา',
          actorRole: 'ผู้บริหารสูงสุด',
          department: 'สำนักปลัดเทศบาล',
          targetCode: 'ทม.ศล. 16/2571',
          details: 'พิจารณาอนุมัติร่างแผนพัฒนาท้องถิ่น ฉบับแก้ไข',
          ipAddress: '192.168.10.12 (เครื่องนายกฯ)',
          note: 'อนุมัติการแก้ไขข้อความและคำผิดตามระเบียบฯ ข้อ 21'
        },
        {
          id: 'LOG-004',
          timestamp: '10/08/2571 14:00:00',
          planName: 'แผนพัฒนาท้องถิ่น (พ.ศ. 2571 - 2575) เปลี่ยนแปลง ครั้งที่ 23/2571',
          action: 'ประกาศใช้',
          category: 'plan_approval',
          actorName: 'นายกเทศมนตรีเมืองศิลา',
          actorRole: 'ผู้บริหารสูงสุด',
          department: 'กองยุทธศาสตร์และงบประมาณ',
          targetCode: 'ทม.ศล. 23/2571',
          details: 'ลงนามและประกาศใช้แผนพัฒนาท้องถิ่น ฉบับเปลี่ยนแปลง หลังได้รับความเห็นชอบจากสภาเทศบาล',
          ipAddress: '192.168.10.12 (เครื่องนายกฯ)',
          note: 'ประกาศใช้แผนพัฒนาท้องถิ่น (เปลี่ยนแปลง)'
        },
        {
          id: 'LOG-003',
          timestamp: '08/08/2571 11:20:00',
          planName: 'แผนพัฒนาท้องถิ่น (พ.ศ. 2571 - 2575) เปลี่ยนแปลง ครั้งที่ 23/2571',
          action: 'เปลี่ยนแปลงโครงการ',
          category: 'project_modification',
          actorName: 'สภาเทศบาลเมืองศิลา',
          actorRole: 'สภาท้องถิ่น',
          department: 'กองช่าง',
          targetCode: 'ญัตติที่ 23/2571',
          details: 'มีมติเห็นชอบการเปลี่ยนแปลงรูปแบบอาคารศูนย์ป้องกันและบรรเทาสาธารณภัยและปรับลดขนาดงบประมาณ',
          beforeValue: 'งบประมาณเดิม: 8,500,000 บาท',
          afterValue: 'งบประมาณใหม่: 6,800,000 บาท (ลดลง 1,700,000 บาท)',
          ipAddress: '192.168.10.100 (ห้องประชุมสภา)',
          note: 'อนุมัติการเปลี่ยนแปลงรายละเอียดและงบประมาณโครงการตามระเบียบฯ ข้อ 22/1'
        },
        {
          id: 'LOG-002',
          timestamp: '01/08/2571 09:00:00',
          planName: 'แผนพัฒนาท้องถิ่น (พ.ศ. 2571 - 2575) เพิ่มเติม ครั้งที่ 23/2571',
          action: 'ประกาศใช้',
          category: 'plan_approval',
          actorName: 'นายกเทศมนตรีเมืองศิลา',
          actorRole: 'ผู้บริหารสูงสุด',
          department: 'สำนักปลัดเทศบาล',
          targetCode: 'ทม.ศล. 22/2571',
          details: 'ประกาศใช้แผนพัฒนาท้องถิ่น ฉบับเพิ่มเติม ครั้งที่ 23/2571 บรรจุโครงการเร่งด่วน 14 โครงการ',
          ipAddress: '192.168.10.12 (เครื่องนายกฯ)',
          note: 'ประกาศใช้แผนพัฒนาท้องถิ่น (เพิ่มเติม)'
        },
        {
          id: 'LOG-001',
          timestamp: '25/07/2571 13:45:00',
          planName: 'แผนพัฒนาท้องถิ่น (พ.ศ. 2571 - 2575) เพิ่มเติม ครั้งที่ 23/2571',
          action: 'อนุมัติ',
          category: 'plan_approval',
          actorName: 'สภาเทศบาลเมืองศิลา',
          actorRole: 'สภาท้องถิ่น',
          department: 'กองยุทธศาสตร์และงบประมาณ',
          targetCode: 'มติสภา 45/2571',
          details: 'สภาเทศบาลเมืองศิลามีมติเอกฉันท์อนุมัติเห็นชอบบรรจุโครงการเพิ่มเติมเพื่อแก้ไขปัญหาน้ำท่วม',
          ipAddress: '192.168.10.100 (ห้องประชุมสภา)',
          note: 'สภาเทศบาลเมืองศิลาให้ความเห็นชอบโครงการเพิ่มเติม'
        }
      ];
      this.savePlanAuditLogs(initialLogs);
      return initialLogs;
    } catch (err) {
      console.warn('Audit logs read error:', err);
      return [];
    }
  },

  savePlanAuditLogs(logs: PlanAuditLogEntry[]): void {
    try {
      localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(logs));
    } catch (err) {
      console.error('Audit logs write error:', err);
    }
  },

  addPlanAuditLog(entry: Omit<PlanAuditLogEntry, 'id'>): PlanAuditLogEntry {
    const existing = this.getPlanAuditLogs();
    const newId = `LOG-${String(existing.length + 1).padStart(3, '0')}`;
    const newEntry: PlanAuditLogEntry = {
      ...entry,
      id: newId
    };
    const updated = [newEntry, ...existing];
    this.savePlanAuditLogs(updated);
    return newEntry;
  },

  resetPlanAuditLogs(): PlanAuditLogEntry[] {
    localStorage.removeItem(AUDIT_LOGS_KEY);
    return this.getPlanAuditLogs();
  },

  getTrackingItems(): ProjectTrackingItem[] {
    try {
      const stored = localStorage.getItem(TRACKING_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      this.saveTrackingItems(INITIAL_TRACKING_ITEMS);
      return INITIAL_TRACKING_ITEMS;
    } catch (err) {
      console.warn('Tracking read error:', err);
      return INITIAL_TRACKING_ITEMS;
    }
  },

  saveTrackingItems(items: ProjectTrackingItem[]): void {
    try {
      localStorage.setItem(TRACKING_KEY, JSON.stringify(items));
    } catch (err) {
      console.error('Tracking write error:', err);
    }
  },

  resetToInitial(): ProjectData[] {
    const normalized = INITIAL_PROJECTS.map((p) => {
      const withZone = normalizeProjectVillageData(p);
      return {
        ...withZone,
        budgetSource: normalizeBudgetSource(withZone.budgetSource)
      };
    });
    this.saveProjects(normalized);
    this.saveAnnouncements(INITIAL_ANNOUNCEMENTS);
    this.saveTrackingItems(INITIAL_TRACKING_ITEMS);
    return normalized;
  },

  exportJSON(): string {
    const data = {
      projects: this.getProjects(),
      announcements: this.getAnnouncements()
    };
    return JSON.stringify(data, null, 2);
  },

  importJSON(jsonString: string): ProjectData[] | null {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed)) {
        this.saveProjects(parsed);
        return parsed;
      } else if (parsed && Array.isArray(parsed.projects)) {
        this.saveProjects(parsed.projects);
        if (Array.isArray(parsed.announcements)) {
          this.saveAnnouncements(parsed.announcements);
        }
        return parsed.projects;
      }
      return null;
    } catch {
      return null;
    }
  }
};
