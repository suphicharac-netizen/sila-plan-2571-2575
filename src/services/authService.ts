import { UserAccount, UserRole, VisitorLog } from '../types';
import { SILA_ZONES, ALL_VILLAGES } from '../utils/constants';

const USERS_STORAGE_KEY = 'sila_digital_plan_users_v1';
const SESSION_STORAGE_KEY = 'sila_digital_plan_current_user_v1';
const VISITOR_LOGS_STORAGE_KEY = 'sila_digital_plan_visitor_logs_v1';

// Pre-seeded initial accounts
export const INITIAL_USERS: UserAccount[] = [
  {
    id: 'user-admin-01',
    username: 'admin',
    password: 'password',
    fullName: 'นางสุพิชฌาย์ ราชเซ่ง',
    role: 'admin',
    department: 'กองยุทธศาสตร์และงบประมาณ',
    createdAt: '2026-08-01T08:30:00.000Z',
    lastLoginAt: '2026-09-11T09:00:00.000Z'
  },
  {
    id: 'user-staff-01',
    username: 'staff',
    password: 'password',
    fullName: 'นายสมเกียรติ สถิตมั่น',
    role: 'staff',
    department: 'กองช่าง',
    createdAt: '2026-08-05T09:15:00.000Z',
    lastLoginAt: '2026-09-10T14:20:00.000Z'
  },
  {
    id: 'user-exec-01',
    username: 'executive',
    password: 'password',
    fullName: 'นายกเทศมนตรีเมืองศิลา',
    role: 'executive',
    department: 'สำนักปลัดเทศบาล',
    createdAt: '2026-08-01T08:00:00.000Z',
    lastLoginAt: '2026-09-11T08:00:00.000Z'
  }
];

// Pre-seeded realistic visitor logs for village analytics
export const INITIAL_VISITOR_LOGS: VisitorLog[] = [
  {
    id: 'log-001',
    fullName: 'นายสมชาย ใจดี',
    village: 'หมู่ที่ 1 บ้านศิลา',
    villageNumber: 1,
    purpose: 'ติดตามโครงการในหมู่บ้าน',
    timestamp: '2026-09-11 11:45 น.'
  },
  {
    id: 'log-002',
    fullName: 'นางสมศรี มีสุข',
    village: 'หมู่ที่ 18 บ้านศิลา',
    villageNumber: 18,
    purpose: 'ติดตามงบประมาณประจำปี',
    timestamp: '2026-09-11 10:20 น.'
  },
  {
    id: 'log-003',
    fullName: 'นายประเสริฐ วงศ์คำ',
    village: 'หมู่ที่ 27 บ้านโนนม่วง',
    villageNumber: 27,
    purpose: 'ติดตามโครงการในหมู่บ้าน',
    timestamp: '2026-09-11 09:15 น.'
  },
  {
    id: 'log-004',
    fullName: 'นางสาวกัญญา พงษ์สวัสดิ์',
    village: 'หมู่ที่ 4 บ้านห้วยซัน',
    villageNumber: 4,
    purpose: 'ค้นหาข้อมูลทั่วไป',
    timestamp: '2026-09-10 16:30 น.'
  },
  {
    id: 'log-005',
    fullName: 'นายวิชัย รัตนศักดิ์',
    village: 'หมู่ที่ 6 บ้านท่าแก',
    villageNumber: 6,
    purpose: 'ติดตามโครงการในหมู่บ้าน',
    timestamp: '2026-09-10 14:10 น.'
  },
  {
    id: 'log-006',
    fullName: 'นางพรพิมล ชัยสิทธิ์',
    village: 'หมู่ที่ 2 บ้านหนองกุง',
    villageNumber: 2,
    purpose: 'ติดตามงบประมาณประจำปี',
    timestamp: '2026-09-10 11:00 น.'
  },
  {
    id: 'log-007',
    fullName: 'นายอัครเดช ทองหล่อ',
    village: 'หมู่ที่ 14 บ้านหนองไผ่',
    villageNumber: 14,
    purpose: 'ติดตามโครงการในหมู่บ้าน',
    timestamp: '2026-09-09 15:40 น.'
  },
  {
    id: 'log-008',
    fullName: 'นางบุญเรือน คำแพง',
    village: 'หมู่ที่ 5 บ้านบึงอีเฒ่า',
    villageNumber: 5,
    purpose: 'ค้นหาข้อมูลทั่วไป',
    timestamp: '2026-09-09 13:25 น.'
  },
  {
    id: 'log-009',
    fullName: 'นายธนาธิป ภูผา',
    village: 'หมู่ที่ 11 บ้านดอนยาง',
    villageNumber: 11,
    purpose: 'ติดตามโครงการในหมู่บ้าน',
    timestamp: '2026-09-08 16:50 น.'
  },
  {
    id: 'log-010',
    fullName: 'นางวิลาวรรณ ดวงแก้ว',
    village: 'หมู่ที่ 8 บ้านหนองหิน',
    villageNumber: 8,
    purpose: 'ติดตามงบประมาณประจำปี',
    timestamp: '2026-09-08 10:15 น.'
  },
  {
    id: 'log-011',
    fullName: 'นายกิตติคุณ ศรีมงคล',
    village: 'หมู่ที่ 13 บ้านดอนหญ้านาง',
    villageNumber: 13,
    purpose: 'ติดตามโครงการในหมู่บ้าน',
    timestamp: '2026-09-07 14:00 น.'
  },
  {
    id: 'log-012',
    fullName: 'นางนฤมล เจริญสุข',
    village: 'หมู่ที่ 1 บ้านศิลา',
    villageNumber: 1,
    purpose: 'ติดตามงบประมาณประจำปี',
    timestamp: '2026-09-07 09:30 น.'
  }
];

export const authService = {
  // 1. User Management
  getUserAccounts(): UserAccount[] {
    try {
      const stored = localStorage.getItem(USERS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      this.saveUserAccounts(INITIAL_USERS);
      return INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  },

  saveUserAccounts(users: UserAccount[]): void {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (err) {
      console.error('Failed to save users:', err);
    }
  },

  // 2. Session Management
  getCurrentUser(): UserAccount {
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.id && parsed.role) {
          return parsed;
        }
      }
      // Default initial session is Admin (นางสุพิชฌาย์ ราชเซ่ง)
      const defaultUser = INITIAL_USERS[0];
      this.setCurrentUser(defaultUser);
      return defaultUser;
    } catch {
      return INITIAL_USERS[0];
    }
  },

  setCurrentUser(user: UserAccount | null): void {
    try {
      if (user) {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(SESSION_STORAGE_KEY);
      }
    } catch (err) {
      console.error('Failed to update session:', err);
    }
  },

  // 3. Register Staff / Exec / Admin
  registerStaffUser(data: {
    fullName: string;
    role: 'admin' | 'staff' | 'executive';
    department: string;
    username: string;
    password?: string;
  }): { success: boolean; user?: UserAccount; error?: string } {
    const users = this.getUserAccounts();
    const cleanUsername = data.username.trim().toLowerCase();

    if (users.some((u) => u.username.toLowerCase() === cleanUsername)) {
      return { success: false, error: 'ชื่อผู้ใช้งาน (Username) นี้มีในระบบแล้ว กรุณาใช้ชื่ออื่น' };
    }

    const newUser: UserAccount = {
      id: `user-${Date.now()}`,
      username: cleanUsername,
      password: data.password || 'password',
      fullName: data.fullName.trim(),
      role: data.role,
      department: data.department,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };

    const nextUsers = [newUser, ...users];
    this.saveUserAccounts(nextUsers);
    this.setCurrentUser(newUser);

    return { success: true, user: newUser };
  },

  // 4. Login with Username & Password
  loginWithCredentials(
    username: string,
    password?: string
  ): { success: boolean; user?: UserAccount; error?: string } {
    const users = this.getUserAccounts();
    const cleanUsername = username.trim().toLowerCase();

    const user = users.find(
      (u) => u.username.toLowerCase() === cleanUsername
    );

    if (!user) {
      return { success: false, error: 'ไม่พบบัญชีผู้ใช้งานนี้ในระบบ' };
    }

    if (user.password && password && user.password !== password.trim()) {
      return { success: false, error: 'รหัสผ่านไม่ถูกต้อง' };
    }

    const updatedUser = {
      ...user,
      lastLoginAt: new Date().toISOString()
    };
    this.setCurrentUser(updatedUser);

    return { success: true, user: updatedUser };
  },

  // 5. Register & Sign-in Public Visitor
  registerPublicVisitor(
    fullName: string,
    village: string,
    purpose: string = 'ติดตามโครงการในหมู่บ้าน'
  ): { user: UserAccount; log: VisitorLog } {
    const cleanName = fullName.trim() || 'ประชาชนทั่วไป';
    const cleanVillage = village.trim() || 'หมู่ที่ 1 บ้านศิลา';

    // Parse village number if present
    const vMatch = cleanVillage.match(/หมู่ที่\s*(\d+)/);
    const villageNumber = vMatch ? parseInt(vMatch[1], 10) : undefined;

    const publicUser: UserAccount = {
      id: `public-${Date.now()}`,
      username: `public_${Date.now()}`,
      fullName: cleanName,
      role: 'public',
      village: cleanVillage,
      villageNumber,
      purpose: purpose || 'ติดตามโครงการในหมู่บ้าน',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };

    // Save session
    this.setCurrentUser(publicUser);

    // Record visit in log
    const log = this.addVisitorLog({
      fullName: cleanName,
      village: cleanVillage,
      villageNumber,
      purpose: purpose || 'ค้นหาข้อมูลทั่วไป'
    });

    return { user: publicUser, log };
  },

  // 6. Visitor Logs & Analytics
  getVisitorLogs(): VisitorLog[] {
    try {
      const stored = localStorage.getItem(VISITOR_LOGS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      this.saveVisitorLogs(INITIAL_VISITOR_LOGS);
      return INITIAL_VISITOR_LOGS;
    } catch {
      return INITIAL_VISITOR_LOGS;
    }
  },

  saveVisitorLogs(logs: VisitorLog[]): void {
    try {
      localStorage.setItem(VISITOR_LOGS_STORAGE_KEY, JSON.stringify(logs));
    } catch (err) {
      console.error('Failed to save visitor logs:', err);
    }
  },

  addVisitorLog(data: {
    fullName: string;
    village: string;
    villageNumber?: number;
    purpose?: string;
  }): VisitorLog {
    const logs = this.getVisitorLogs();
    const now = new Date();
    const thaiDateStr = `${now.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} น.`;

    const newLog: VisitorLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      fullName: data.fullName,
      village: data.village,
      villageNumber: data.villageNumber,
      purpose: data.purpose || 'ค้นหาข้อมูลทั่วไป',
      timestamp: thaiDateStr
    };

    const nextLogs = [newLog, ...logs];
    this.saveVisitorLogs(nextLogs);
    return newLog;
  },

  getVisitorStats() {
    const logs = this.getVisitorLogs();
    const total = logs.length;

    const byVillage: Record<string, number> = {};
    const byPurpose: Record<string, number> = {};
    const byZone: Record<string, number> = {
      'เขต 1': 0,
      'เขต 2': 0,
      'เขต 3': 0
    };

    // Helper map of village to zone
    const villageZoneMap = new Map<string, string>();
    SILA_ZONES.forEach((z) => {
      z.villages.forEach((v) => {
        villageZoneMap.set(v.villageName, z.name);
        villageZoneMap.set(`หมู่ที่ ${v.villageNumber}`, z.name);
      });
    });

    logs.forEach((log) => {
      // By Village
      byVillage[log.village] = (byVillage[log.village] || 0) + 1;

      // By Purpose
      const p = log.purpose || 'ค้นหาข้อมูลทั่วไป';
      byPurpose[p] = (byPurpose[p] || 0) + 1;

      // By Zone
      let matchedZone = 'เขต 1';
      // First check by villageNumber if present
      if (log.villageNumber) {
        const found = ALL_VILLAGES.find((v) => v.villageNumber === log.villageNumber);
        if (found) {
          matchedZone = found.zone;
        }
      }
      if (!log.villageNumber) {
        for (const [vName, zName] of villageZoneMap.entries()) {
          if (log.village.includes(vName)) {
            matchedZone = zName;
            break;
          }
        }
      }
      byZone[matchedZone] = (byZone[matchedZone] || 0) + 1;
    });

    return {
      total,
      byVillage,
      byZone,
      byPurpose,
      recentLogs: logs.slice(0, 30)
    };
  },

  // Helper for quick demo role switching
  switchRoleQuick(role: UserRole): UserAccount {
    const users = this.getUserAccounts();
    const existing = users.find((u) => u.role === role);
    if (existing) {
      this.setCurrentUser(existing);
      return existing;
    }

    if (role === 'public') {
      const publicUser: UserAccount = {
        id: 'user-public-demo',
        username: 'public',
        fullName: 'นายสมชาย ใจดี',
        role: 'public',
        village: 'หมู่ที่ 1 บ้านศิลา',
        villageNumber: 1,
        purpose: 'ติดตามโครงการในหมู่บ้าน',
        createdAt: new Date().toISOString()
      };
      this.setCurrentUser(publicUser);
      return publicUser;
    }

    return this.getCurrentUser();
  }
};
