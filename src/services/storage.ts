import { ProjectData, PlanAnnouncement, ProjectTrackingItem } from '../types';
import { INITIAL_PROJECTS, INITIAL_ANNOUNCEMENTS, INITIAL_TRACKING_ITEMS } from '../data/initialData';
import { normalizeProjectVillageData } from '../utils/villageUtils';

const STORAGE_KEY = 'sila_digital_plan_projects_v8';
const ANNOUNCEMENTS_KEY = 'sila_digital_plan_announcements_v2';
const TRACKING_KEY = 'sila_digital_plan_tracking_v3';
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
