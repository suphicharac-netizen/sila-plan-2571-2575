import React from 'react';
import {
  Building2,
  LayoutDashboard,
  MapPin,
  FileText,
  FilePlus,
  FileCode,
  FileEdit,
  CheckCircle2,
  CircleDollarSign,
  Activity,
  BarChart3,
  ArrowLeftRight,
  Search,
  LogOut,
  Code2,
  Database,
  UserCheck,
  User,
  Users,
  Shield,
  Briefcase,
  FileSpreadsheet
} from 'lucide-react';
import { ActiveNavMenu, UserAccount } from '../types';

interface SidebarProps {
  activeMenu: ActiveNavMenu;
  onSelectMenu: (menu: ActiveNavMenu) => void;
  editionCounts: {
    first: number;
    additional: number;
    changed: number;
    amended: number;
  };
  onOpenSyncModal: () => void;
  onOpenStorageModal: () => void;
  currentUser: UserAccount | null;
  onOpenAuthModal: () => void;
  onOpenVisitorAnalytics?: () => void;
  onLogout: () => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeMenu,
  onSelectMenu,
  editionCounts,
  onOpenSyncModal,
  onOpenStorageModal,
  currentUser,
  onOpenAuthModal,
  onOpenVisitorAnalytics,
  onLogout,
  className = ''
}) => {
  return (
    <aside
      id="sidebar-navigation"
      className={`w-72 sm:w-80 bg-[#03231a] text-slate-100 flex flex-col h-screen shrink-0 border-r border-[#064232] select-none no-print print:hidden ${className}`}
    >
      {/* Brand Header */}
      <div className="p-4 sm:p-4.5 border-b border-[#064232] flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-md">
          <Building2 className="w-6 h-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-white text-sm sm:text-base font-bold truncate leading-snug">
            ระบบแผนพัฒนาเทศบาลเมืองศิลา
          </div>
          <div className="text-emerald-300 text-[13px] sm:text-[14px] font-medium truncate">
            เทศบาลเมืองศิลา จ.ขอนแก่น
          </div>
          <div className="text-slate-400 text-[12px] tracking-tight">
            Sila Digital Plan • (พ.ศ. 2571-2575)
          </div>
        </div>
      </div>

      {/* Nav Menu Items */}
      <div className="flex-1 overflow-y-auto px-3 py-3.5 space-y-4 font-medium scrollbar-thin scrollbar-thumb-emerald-900">
        {/* Group 1: แผนพัฒนา 5 ปี */}
        <div>
          <div className="px-2.5 py-1 text-[15px] font-bold text-emerald-300 flex items-center gap-2 uppercase tracking-wide">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>แผนพัฒนา 5 ปี (ผ.02)</span>
          </div>
          <div className="mt-1.5 space-y-1">
            <button
              id="menu-dashboard"
              onClick={() => onSelectMenu('dashboard')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer text-left text-[16px] sm:text-[17px] font-bold ${
                activeMenu === 'dashboard'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-200 hover:bg-[#063b2c] hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-5 h-5 shrink-0 text-emerald-300" />
              <span>แดชบอร์ดภาพรวมแผน</span>
            </button>

            {/* 1. แผนพัฒนาท้องถิ่น ฉบับแรก */}
            <button
              id="menu-edition-first"
              onClick={() => onSelectMenu('edition_first')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer text-left text-[16px] sm:text-[17px] font-bold ${
                activeMenu === 'edition_first'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-200 hover:bg-[#063b2c] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="w-5 h-5 shrink-0 text-emerald-300" />
                <span className="truncate">แผนพัฒนาท้องถิ่น ฉบับแรก</span>
              </div>
              <span className="bg-[#064232] text-emerald-200 text-[12px] px-2 py-0.5 rounded-full font-mono font-bold">
                {editionCounts.first}
              </span>
            </button>

            {/* 2. แผนพัฒนาท้องถิ่น ฉบับเพิ่มเติม */}
            <button
              id="menu-edition-additional"
              onClick={() => onSelectMenu('edition_additional')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer text-left text-[16px] sm:text-[17px] font-bold ${
                activeMenu === 'edition_additional'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-200 hover:bg-[#063b2c] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <FilePlus className="w-5 h-5 shrink-0 text-emerald-300" />
                <span className="truncate">แผนพัฒนาท้องถิ่น ฉบับเพิ่มเติม</span>
              </div>
              <span className="bg-[#064232] text-emerald-200 text-[12px] px-2 py-0.5 rounded-full font-mono font-bold">
                {editionCounts.additional}
              </span>
            </button>

            {/* 3. แผนพัฒนาท้องถิ่น ฉบับเปลี่ยนแปลง */}
            <button
              id="menu-edition-changed"
              onClick={() => onSelectMenu('edition_changed')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer text-left text-[16px] sm:text-[17px] font-bold ${
                activeMenu === 'edition_changed'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-200 hover:bg-[#063b2c] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <FileCode className="w-5 h-5 shrink-0 text-emerald-300" />
                <span className="truncate">แผนพัฒนาท้องถิ่น ฉบับเปลี่ยนแปลง</span>
              </div>
              <span className="bg-[#064232] text-emerald-200 text-[12px] px-2 py-0.5 rounded-full font-mono font-bold">
                {editionCounts.changed}
              </span>
            </button>

            {/* 4. แผนพัฒนาท้องถิ่น ฉบับแก้ไข */}
            <button
              id="menu-edition-amended"
              onClick={() => onSelectMenu('edition_amended')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer text-left text-[16px] sm:text-[17px] font-bold ${
                activeMenu === 'edition_amended'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-200 hover:bg-[#063b2c] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <FileEdit className="w-5 h-5 shrink-0 text-emerald-300" />
                <span className="truncate">แผนพัฒนาท้องถิ่น ฉบับแก้ไข</span>
              </div>
              <span className="bg-[#064232] text-emerald-200 text-[12px] px-2 py-0.5 rounded-full font-mono font-bold">
                {editionCounts.amended}
              </span>
            </button>

            {/* 5. แผนพัฒนารายหมู่บ้าน (Zone Hierarchy 3 เขต / 28 หมู่บ้าน) */}
            <button
              id="menu-village-plan"
              onClick={() => onSelectMenu('village_plan')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer text-left text-[16px] sm:text-[17px] font-bold ${
                activeMenu === 'village_plan'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-200 hover:bg-[#063b2c] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <MapPin className="w-5 h-5 shrink-0 text-emerald-300" />
                <span className="truncate">แผนพัฒนารายหมู่บ้าน</span>
              </div>
              <span className="bg-emerald-700/80 text-emerald-100 text-[12px] px-2 py-0.5 rounded-full font-mono font-bold">
                3 เขต
              </span>
            </button>
          </div>
        </div>

        {/* Group 2: อนุมัติ & งบประมาณ */}
        <div>
          <div className="px-2.5 py-1 text-[15px] font-bold text-emerald-300 flex items-center gap-2 uppercase tracking-wide">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>อนุมัติ & งบประมาณ</span>
          </div>
          <div className="mt-1.5 space-y-1">
            <button
              id="menu-approve-plan"
              onClick={() => onSelectMenu('approve_plan')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer text-left text-[16px] sm:text-[17px] font-bold ${
                activeMenu === 'approve_plan'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-200 hover:bg-[#063b2c] hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-300" />
              <span>อนุมัติประกาศใช้แผน</span>
            </button>

            <button
              id="menu-budget-approval"
              onClick={() => onSelectMenu('budget_approval')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer text-left text-[16px] sm:text-[17px] font-bold ${
                activeMenu === 'budget_approval'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-200 hover:bg-[#063b2c] hover:text-white'
              }`}
            >
              <CircleDollarSign className="w-5 h-5 shrink-0 text-emerald-300" />
              <span>อนุมัติตั้งงบประมาณ</span>
            </button>
          </div>
        </div>

        {/* Group 3: รายงาน & การสืบค้น */}
        <div>
          <div className="px-2.5 py-1 text-[15px] font-bold text-emerald-300 flex items-center gap-2 uppercase tracking-wide">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>รายงาน & การสืบค้น</span>
          </div>
          <div className="mt-1.5 space-y-1">
            {/* 1. รายงานแผนพัฒนาท้องถิ่น (ดึงข้อมูลแบบ ผ.01 และ ผ.02 ทุกฉบับ) */}
            <button
              id="menu-report-plan"
              onClick={() => onSelectMenu('report_plan')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer text-left text-[16px] sm:text-[17px] font-bold ${
                activeMenu === 'report_plan'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-200 hover:bg-[#063b2c] hover:text-white'
              }`}
            >
              <BarChart3 className="w-5 h-5 shrink-0 text-emerald-300" />
              <span className="truncate">รายงานแผนพัฒนาท้องถิ่น</span>
            </button>

            {/* 2. รายงานเปรียบเทียบแผน/งบประมาณ */}
            <button
              id="menu-report-comparison"
              onClick={() => onSelectMenu('report_comparison')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer text-left text-[16px] sm:text-[17px] font-bold ${
                activeMenu === 'report_comparison'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-200 hover:bg-[#063b2c] hover:text-white'
              }`}
            >
              <ArrowLeftRight className="w-5 h-5 shrink-0 text-emerald-300" />
              <span className="truncate">รายงานเปรียบเทียบแผน/งบประมาณ</span>
            </button>

            {/* 3. รายงานสรุปผลการดำเนินงานประจำปี */}
            <button
              id="menu-project-tracking"
              onClick={() => onSelectMenu('project_tracking')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer text-left text-[16px] sm:text-[17px] font-bold ${
                activeMenu === 'project_tracking'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-200 hover:bg-[#063b2c] hover:text-white'
              }`}
            >
              <Activity className="w-5 h-5 shrink-0 text-emerald-300" />
              <span className="truncate">รายงานสรุปผลการดำเนินงาน</span>
            </button>

            {/* 4. รายงานแผนพัฒนารายหมู่บ้าน (Official Report View - แบบ ผ.02 รายหมู่บ้าน) */}
            <button
              id="menu-village-plan-report"
              onClick={() => onSelectMenu('village_plan_report')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer text-left text-[16px] sm:text-[17px] font-bold ${
                activeMenu === 'village_plan_report'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-200 hover:bg-[#063b2c] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <FileSpreadsheet className="w-5 h-5 shrink-0 text-emerald-300" />
                <span className="truncate">รายงานแผนรายหมู่บ้าน</span>
              </div>
              <span className="bg-emerald-700/80 text-emerald-100 text-[12px] px-2 py-0.5 rounded-full font-mono font-bold">
                ผ.02
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* User Profile & Footer Utilities */}
      <div className="p-3.5 border-t border-[#064232] space-y-2.5 bg-[#021a13]">
        {/* User Profile Card */}
        <div
          onClick={onOpenAuthModal}
          title="คลิกเพื่อจัดการสิทธิ์หรือสลับผู้ใช้"
          className="flex items-center justify-between p-2.5 rounded-xl bg-[#04281e] border border-[#094736] hover:border-emerald-500/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-base shrink-0 shadow-sm ${
                currentUser?.role === 'public'
                  ? 'bg-teal-600 text-white'
                  : currentUser?.role === 'admin'
                  ? 'bg-amber-600 text-white'
                  : currentUser?.role === 'executive'
                  ? 'bg-purple-600 text-white'
                  : 'bg-blue-600 text-white'
              }`}
            >
              {currentUser?.fullName ? currentUser.fullName.charAt(0) : 'ผู้'}
            </div>
            <div className="min-w-0">
              <div className="text-white text-[15px] font-bold truncate leading-tight group-hover:text-emerald-300 transition-colors">
                {currentUser?.fullName || 'ผู้ใช้งานระบบ'}
              </div>
              <div className="text-[13px] flex items-center gap-1.5 mt-0.5 truncate">
                {currentUser?.role === 'public' ? (
                  <span className="text-teal-300 font-medium truncate">
                    ประชาชน ({currentUser.village || 'หมู่บ้านในศิลา'})
                  </span>
                ) : (
                  <>
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        currentUser?.role === 'admin'
                          ? 'bg-amber-400'
                          : currentUser?.role === 'executive'
                          ? 'bg-purple-400'
                          : 'bg-blue-400'
                      }`}
                    />
                    <span className="text-emerald-300 font-medium truncate">
                      {currentUser?.role === 'admin' && 'ผู้ดูแลระบบ'}
                      {currentUser?.role === 'executive' && 'ผู้บริหาร'}
                      {currentUser?.role === 'staff' && 'กลุ่มเจ้าหน้าที่'}
                      {currentUser?.department ? ` • ${currentUser.department}` : ''}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button
            id="btn-logout"
            onClick={(e) => {
              e.stopPropagation();
              onLogout();
            }}
            title="ออกจากระบบ"
            className="text-slate-400 hover:text-rose-300 hover:bg-rose-900/30 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        {/* Action Button: สลับผู้ใช้งาน / ลงทะเบียน */}
        <button
          id="btn-switch-user"
          onClick={onOpenAuthModal}
          className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-[15px] text-amber-300 bg-[#063b2c] hover:bg-[#094d3a] border border-[#0d5f47] transition-colors cursor-pointer font-bold shadow-xs"
        >
          <UserCheck className="w-4 h-4 text-amber-400" />
          <span>สลับผู้ใช้งาน / จัดการสิทธิ์</span>
        </button>

        {/* Action Button: สถิติผู้เข้าชมระบบ (Analytics) สำหรับ Admin และ ผู้บริหาร */}
        {currentUser && (currentUser.role === 'admin' || currentUser.role === 'executive') && (
          <button
            id="btn-visitor-analytics-sidebar"
            onClick={onOpenVisitorAnalytics}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-[15px] text-sky-300 bg-[#042823] hover:bg-[#073931] border border-[#0a4e40] transition-colors cursor-pointer font-bold"
          >
            <BarChart3 className="w-4 h-4 text-white" />
            <span>สถิติผู้เข้าชมระบบ (Analytics)</span>
          </button>
        )}

        {/* Action Button: Google Sheets & GAS Sync */}
        <button
          id="btn-gas-sync"
          onClick={onOpenSyncModal}
          className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-[15px] text-emerald-300 bg-[#052b21] hover:bg-[#083a2d] border border-[#0c4e3b] transition-colors cursor-pointer font-bold"
        >
          <Code2 className="w-4 h-4" />
          <span>Google Sheets & GAS Sync</span>
        </button>

        {/* Action Button: Backup / IndexedDB */}
        <button
          id="btn-db-backup"
          onClick={onOpenStorageModal}
          className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-[15px] text-white bg-[#04241c] hover:bg-[#073227] border border-[#0c4e3b] transition-colors cursor-pointer font-bold"
        >
          <Database className="w-4 h-4 text-emerald-400" />
          <span>สำรอง / จัดการข้อมูล</span>
        </button>

        <div className="text-center text-[12px] text-emerald-500/70 pt-1">
          เทศบาลเมืองศิลา © 2571-2575
        </div>
      </div>
    </aside>
  );
};
