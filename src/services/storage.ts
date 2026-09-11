import { ProjectData, PlanAnnouncement, ProjectTrackingItem } from '../types';
import { INITIAL_PROJECTS, INITIAL_ANNOUNCEMENTS, INITIAL_TRACKING_ITEMS } from '../data/initialData';

const STORAGE_KEY = 'sila_digital_plan_projects_v7';
const ANNOUNCEMENTS_KEY = 'sila_digital_plan_announcements_v2';
const TRACKING_KEY = 'sila_digital_plan_tracking_v3';
const VERSION_KEY = 'sila_digital_plan_version';
const CURRENT_VERSION = '2571_v19_village_hierarchy_drilldown';

const normalizeZoneAndVillage = (p: ProjectData): ProjectData => {
  if (p.zone && p.village) return p;
  if (p.name?.includes('โกทา') || p.village?.includes('โกทา')) {
    return { ...p, zone: 'เขต 2', village: 'หมู่ที่ 4 บ้านโกทา', villageNumber: 4 };
  }
  if (p.name?.includes('หนองหิน') || p.village?.includes('หนองหิน')) {
    return { ...p, zone: 'เขต 2', village: 'หมู่ที่ 5 บ้านหนองหิน', villageNumber: 5 };
  }
  if (p.name?.includes('ดอนหญ้านาง') || p.village?.includes('ดอนหญ้านาง')) {
    return { ...p, zone: 'เขต 2', village: 'หมู่ที่ 10 บ้านดอนหญ้านาง', villageNumber: 10 };
  }
  if (p.name?.includes('ท่าพระเนาว์') || p.village?.includes('ท่าพระเนาว์')) {
    return { ...p, zone: 'เขต 2', village: 'หมู่ที่ 11 บ้านท่าพระเนาว์', villageNumber: 11 };
  }
  if (p.name?.includes('ขามเจริญ') || p.village?.includes('ขามเจริญ')) {
    return { ...p, zone: 'เขต 2', village: 'หมู่ที่ 16 บ้านขามเจริญ', villageNumber: 16 };
  }
  if (p.name?.includes('หนองกุง') || p.village?.includes('หนองกุง')) {
    return { ...p, zone: 'เขต 3', village: 'หมู่ที่ 6 บ้านหนองกุง', villageNumber: 6 };
  }
  if (p.name?.includes('หนองไผ่') || p.village?.includes('หนองไผ่')) {
    return { ...p, zone: 'เขต 3', village: 'หมู่ที่ 8 บ้านหนองไผ่', villageNumber: 8 };
  }
  if (p.name?.includes('เต่านอ') || p.village?.includes('เต่านอ')) {
    return { ...p, zone: 'เขต 3', village: 'หมู่ที่ 9 บ้านเต่านอ', villageNumber: 9 };
  }
  if (p.name?.includes('ศิลา') || p.village?.includes('ศิลา')) {
    return { ...p, zone: 'เขต 1', village: 'หมู่ที่ 2 บ้านศิลา', villageNumber: 2 };
  }
  return { ...p, zone: 'เขต 1', village: 'หมู่ที่ 1 บ้านโนนม่วง', villageNumber: 1 };
};

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
          const withZone = normalizeZoneAndVillage(p);
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
          return parsed;
        }
      }
      this.saveAnnouncements(INITIAL_ANNOUNCEMENTS);
      return INITIAL_ANNOUNCEMENTS;
    } catch (err) {
      console.warn('Announcements read error:', err);
      return INITIAL_ANNOUNCEMENTS;
    }
  },

  saveAnnouncements(announcements: PlanAnnouncement[]): void {
    try {
      localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(announcements));
    } catch (err) {
      console.error('Announcements write error:', err);
    }
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
    this.saveProjects(INITIAL_PROJECTS);
    this.saveAnnouncements(INITIAL_ANNOUNCEMENTS);
    this.saveTrackingItems(INITIAL_TRACKING_ITEMS);
    return INITIAL_PROJECTS;
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
