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
  Search,
  LogOut,
  Code2,
  Database
} from 'lucide-react';
import { ActiveNavMenu } from '../types';

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
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeMenu,
  onSelectMenu,
  editionCounts,
  onOpenSyncModal,
  onOpenStorageModal,
  className = ''
}) => {
  return (
    <aside
      id="sidebar-navigation"
      className={`w-64 bg-[#03231a] text-slate-200 flex flex-col h-screen shrink-0 border-r border-[#064232] select-none no-print print:hidden ${className}`}
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-[#064232] flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-md">
          <Building2 className="w-6 h-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-white text-xs font-bold truncate leading-tight">
            ระบบแผนพัฒนาเทศบาลเมืองศิลา
          </div>
          <div className="text-emerald-400 text-[11px] truncate">
            เทศบาลเมืองศิลา จ.ขอนแก่น
          </div>
          <div className="text-slate-400 text-[10px] tracking-tight">
            Sila Digital Plan • (พ.ศ. 2571-2575)
          </div>
        </div>
      </div>

      {/* Nav Menu Items */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4 text-xs font-medium scrollbar-thin scrollbar-thumb-emerald-900">
        {/* Group 1: แผนพัฒนา 5 ปี */}
        <div>
          <div className="px-2.5 py-1 text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5 tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>แผนพัฒนา 5 ปี (ผ.02)</span>
          </div>
          <div className="mt-1 space-y-0.5">
            <button
              id="menu-dashboard"
              onClick={() => onSelectMenu('dashboard')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors cursor-pointer text-left ${
                activeMenu === 'dashboard'
                  ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                  : 'text-slate-300 hover:bg-[#063b2c] hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0 text-emerald-300" />
              <span>แดชบอร์ดภาพรวมแผน</span>
            </button>

            <button
              id="menu-edition-first"
              onClick={() => onSelectMenu('edition_first')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer text-left ${
                activeMenu === 'edition_first'
                  ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                  : 'text-slate-300 hover:bg-[#063b2c] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className="w-4 h-4 shrink-0 text-emerald-300" />
                <span className="truncate">แผนพัฒนาท้องถิ่น ฉบับแรก</span>
              </div>
              <span className="bg-[#064232] text-emerald-200 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                {editionCounts.first}
              </span>
            </button>

            <button
              id="menu-edition-additional"
              onClick={() => onSelectMenu('edition_additional')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer text-left ${
                activeMenu === 'edition_additional'
                  ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                  : 'text-slate-300 hover:bg-[#063b2c] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <FilePlus className="w-4 h-4 shrink-0 text-emerald-300" />
                <span className="truncate">แผนพัฒนาท้องถิ่น ฉบับเพิ่มเติม</span>
              </div>
              <span className="bg-[#064232] text-emerald-200 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                {editionCounts.additional}
              </span>
            </button>

            <button
              id="menu-edition-changed"
              onClick={() => onSelectMenu('edition_changed')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer text-left ${
                activeMenu === 'edition_changed'
                  ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                  : 'text-slate-300 hover:bg-[#063b2c] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <FileCode className="w-4 h-4 shrink-0 text-emerald-300" />
                <span className="truncate">แผนพัฒนาท้องถิ่น ฉบับเปลี่ยนแปลง</span>
              </div>
              <span className="bg-[#064232] text-emerald-200 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                {editionCounts.changed}
              </span>
            </button>

            <button
              id="menu-edition-amended"
              onClick={() => onSelectMenu('edition_amended')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer text-left ${
                activeMenu === 'edition_amended'
                  ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                  : 'text-slate-300 hover:bg-[#063b2c] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <FileEdit className="w-4 h-4 shrink-0 text-emerald-300" />
                <span className="truncate">แผนพัฒนาท้องถิ่น ฉบับแก้ไข</span>
              </div>
              <span className="bg-[#064232] text-emerald-200 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                {editionCounts.amended}
              </span>
            </button>

            <button
              id="menu-village-plan"
              onClick={() => onSelectMenu('village_plan')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer text-left ${
                activeMenu === 'village_plan'
                  ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                  : 'text-slate-300 hover:bg-[#063b2c] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <MapPin className="w-4 h-4 shrink-0 text-emerald-300" />
                <span className="truncate">แผนพัฒนารายหมู่บ้าน</span>
              </div>
              <span className="bg-emerald-700/60 text-emerald-200 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                3 เขต
              </span>
            </button>
          </div>
        </div>

        {/* Group 2: อนุมัติ & งบประมาณ */}
        <div>
          <div className="px-2.5 py-1 text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5 tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>อนุมัติ & งบประมาณ</span>
          </div>
          <div className="mt-1 space-y-0.5">
            <button
              id="menu-approve-plan"
              onClick={() => onSelectMenu('approve_plan')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors cursor-pointer text-left ${
                activeMenu === 'approve_plan'
                  ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                  : 'text-slate-300 hover:bg-[#063b2c] hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-300" />
              <span>อนุมัติประกาศใช้แผน</span>
            </button>

            <button
              id="menu-budget-approval"
              onClick={() => onSelectMenu('budget_approval')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors cursor-pointer text-left ${
                activeMenu === 'budget_approval'
                  ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                  : 'text-slate-300 hover:bg-[#063b2c] hover:text-white'
              }`}
            >
              <CircleDollarSign className="w-4 h-4 shrink-0 text-emerald-300" />
              <span className="font-semibold">อนุมัติตั้งงบประมาณ</span>
            </button>
          </div>
        </div>

        {/* Group 3: รายงาน & การสืบค้น */}
        <div>
          <div className="px-2.5 py-1 text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5 tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>รายงาน & การสืบค้น</span>
          </div>
          <div className="mt-1 space-y-0.5">
            <button
              id="menu-report-plan"
              onClick={() => onSelectMenu('report_plan')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors cursor-pointer text-left ${
                activeMenu === 'report_plan'
                  ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                  : 'text-slate-300 hover:bg-[#063b2c] hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4 shrink-0 text-emerald-300" />
              <span>รายงานแผนพัฒนาท้องถิ่น</span>
            </button>

            <button
              id="menu-project-tracking"
              onClick={() => onSelectMenu('project_tracking')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors cursor-pointer text-left ${
                activeMenu === 'project_tracking'
                  ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                  : 'text-slate-300 hover:bg-[#063b2c] hover:text-white'
              }`}
            >
              <Activity className="w-4 h-4 shrink-0 text-emerald-300" />
              <span>ระบบติดตามโครงการ</span>
            </button>

            <button
              id="menu-project-search"
              onClick={() => onSelectMenu('project_search')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors cursor-pointer text-left ${
                activeMenu === 'project_search'
                  ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                  : 'text-slate-300 hover:bg-[#063b2c] hover:text-white'
              }`}
            >
              <Search className="w-4 h-4 shrink-0 text-emerald-300" />
              <span>ระบบสืบค้นโครงการ</span>
            </button>
          </div>
        </div>
      </div>

      {/* User Profile & Footer Utilities */}
      <div className="p-3 border-t border-[#064232] space-y-2 bg-[#021a13]">
        {/* User Card */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-[#04281e] border border-[#094736]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
              น
            </div>
            <div className="min-w-0">
              <div className="text-white text-xs font-semibold truncate leading-tight">
                นางสุพิชฌาย์ ราชเซ่ง
              </div>
              <div className="text-emerald-400 text-[10px] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>ผู้ดูแลระบบ</span>
              </div>
            </div>
          </div>
          <button
            id="btn-logout"
            title="ออกจากระบบ"
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Action Button: Google Sheets & GAS Sync */}
        <button
          id="btn-gas-sync"
          onClick={onOpenSyncModal}
          className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs text-emerald-300 bg-[#052b21] hover:bg-[#083a2d] border border-[#0c4e3b] transition-colors cursor-pointer font-medium"
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>Google Sheets & GAS Sync</span>
        </button>

        {/* Action Button: Backup / IndexedDB */}
        <button
          id="btn-db-backup"
          onClick={onOpenStorageModal}
          className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs text-slate-300 bg-[#04241c] hover:bg-[#073227] border border-[#0c4e3b] transition-colors cursor-pointer font-medium"
        >
          <Database className="w-3.5 h-3.5 text-emerald-400" />
          <span>สำรอง / จัดการข้อมูล (IndexedDB)</span>
        </button>

        <div className="text-center text-[10px] text-emerald-600/70 pt-1">
          เทศบาลเมืองศิลา © 2571-2575
        </div>
      </div>
    </aside>
  );
};
