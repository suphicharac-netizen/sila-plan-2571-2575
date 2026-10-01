import React, { useState, useEffect } from 'react';
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
  Database,
  UserCheck,
  User,
  Users,
  Shield,
  Home,
  Megaphone,
  Download,
  HelpCircle,
  Phone,
  Sparkles,
  ArrowRight,
  History,
  LogIn,
  Layers,
  ChevronRight
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
  // Toggle Switch state: 'admin' (Full Menu) or 'public' (Compact/Public Menu)
  const [viewMode, setViewMode] = useState<'admin' | 'public'>(() => {
    try {
      const saved = localStorage.getItem('sila_sidebar_view_mode');
      if (saved === 'admin' || saved === 'public') return saved;
    } catch {
      // ignore
    }
    // Default to admin view for dev/preview testing unless user role is strictly public
    if (currentUser?.role === 'public') return 'public';
    return 'admin';
  });

  const handleToggleViewMode = (mode: 'admin' | 'public') => {
    setViewMode(mode);
    try {
      localStorage.setItem('sila_sidebar_view_mode', mode);
    } catch {
      // ignore
    }
  };

  const isCitizenMenu = viewMode === 'public';

  return (
    <aside
      id="sidebar-navigation"
      className={`w-72 sm:w-80 bg-[#031d16] text-white flex flex-col h-screen shrink-0 border-r border-emerald-900/80 select-none no-print print:hidden ${className}`}
    >
      {/* 1. Brand Header */}
      <div className="px-3.5 py-3 border-b border-emerald-800/80 flex items-center gap-3 shrink-0 bg-[#021711]">
        <div className="w-10 h-10 rounded-full bg-white/10 p-0.5 border border-emerald-400/40 flex items-center justify-center shrink-0 shadow-md ring-1 ring-amber-400/40 overflow-hidden">
          <img
            src="/sila-logo.png"
            alt="ตราเทศบาลเมืองศิลา จังหวัดขอนแก่น"
            className="w-full h-full object-contain rounded-full aspect-square"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-white text-[15px] font-bold truncate leading-tight">
            ระบบแผนพัฒนาท้องถิ่น
          </div>
          <div className="text-emerald-300 text-xs font-semibold tracking-wide truncate leading-tight mt-0.5">
            เทศบาลเมืองศิลา (พ.ศ. 2571–2575)
          </div>
        </div>
      </div>

      {/* 2. Mode Toggle Switch (Full Menu vs Public Menu) */}
      <div className="px-3 pt-2.5 pb-2 shrink-0 border-b border-emerald-900/70 bg-[#021a13]">
        <div className="flex items-center justify-between text-[11px] font-medium text-emerald-300/80 mb-1.5 px-0.5">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>โหมดแสดงผลเมนู (Preview)</span>
          </span>
          <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-emerald-950 text-emerald-400 border border-emerald-800/80">
            {viewMode === 'admin' ? 'FULL ADMIN' : 'PUBLIC VIEW'}
          </span>
        </div>

        <div className="bg-[#02130e] p-1 rounded-xl border border-emerald-800/80 flex items-center gap-1 shadow-inner">
          {/* Button: Full Menu (Admin View) */}
          <button
            type="button"
            id="toggle-sidebar-admin"
            onClick={() => handleToggleViewMode('admin')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'admin'
                ? 'bg-emerald-600 text-white shadow-xs ring-1 ring-emerald-400/50'
                : 'text-emerald-300/90 hover:text-white hover:bg-emerald-900/50'
            }`}
            title="แสดงเมนูการบริหารจัดการของเจ้าหน้าที่ทั้งหมด (Full Admin Menu)"
          >
            <Shield className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Full Menu (เจ้าหน้าที่)</span>
          </button>

          {/* Button: Public Menu (Citizen View) */}
          <button
            type="button"
            id="toggle-sidebar-public"
            onClick={() => handleToggleViewMode('public')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'public'
                ? 'bg-blue-600 text-white shadow-xs ring-1 ring-blue-400/50'
                : 'text-emerald-300/90 hover:text-white hover:bg-emerald-900/50'
            }`}
            title="แสดงเมนูสำหรับประชาชนและบริการสาธารณะครบถ้วน (Compact / Public Menu)"
          >
            <Users className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Public (ประชาชน)</span>
          </button>
        </div>
      </div>

      {/* 3. Scrollable Nav Menu Items */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3.5 font-medium scrollbar-thin scrollbar-thumb-emerald-900/60 scrollbar-track-transparent">
        {isCitizenMenu ? (
          /* ========================================================= */
          /* PUBLIC VIEW: Complete Citizen Navigation & Services       */
          /* ========================================================= */
          <div className="space-y-3.5">
            {/* Group 1: การนำทางหลักและแผนงานพัฒนา */}
            <div>
              <div className="px-2.5 py-1 text-[12px] font-bold text-emerald-300 flex items-center gap-1.5 uppercase tracking-wide">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-xs"></span>
                <span>บริการข้อมูลและแผนงานพัฒนา</span>
              </div>
              <div className="mt-1 space-y-1">
                {/* 1. หน้าหลัก (ภาพรวม) */}
                <button
                  type="button"
                  id="menu-citizen-home"
                  onClick={() => onSelectMenu('dashboard')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer text-left text-[14px] ${
                    activeMenu === 'dashboard'
                      ? 'bg-blue-600 text-white font-bold shadow-xs ring-1 ring-white/30'
                      : 'text-slate-100 hover:bg-emerald-900/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="p-1 rounded-md bg-emerald-500/25 border border-emerald-400/30 text-emerald-300 shrink-0">
                      <Home className="w-4 h-4" />
                    </span>
                    <span className="truncate">หน้าหลัก (ภาพรวม)</span>
                  </div>
                </button>

                {/* 2. ข้อมูลสำหรับประชาชน (Citizen Portal) */}
                <button
                  type="button"
                  id="menu-citizen-portal-active"
                  onClick={() => onSelectMenu('citizen_portal')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer text-left text-[14px] ${
                    activeMenu === 'citizen_portal'
                      ? 'bg-blue-600 text-white font-bold shadow-xs ring-1 ring-white/30'
                      : 'text-slate-100 hover:bg-emerald-900/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="p-1 rounded-md bg-blue-500/30 border border-blue-400/40 text-blue-200 shrink-0">
                      <Users className="w-4 h-4" />
                    </span>
                    <span className="truncate font-semibold">ข้อมูลสำหรับประชาชน</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-500 text-white shrink-0">
                    แนะนำ
                  </span>
                </button>

                {/* 3. แผนพัฒนาท้องถิ่น (ผ.02) */}
                <button
                  type="button"
                  id="menu-citizen-plan"
                  onClick={() => onSelectMenu('edition_first')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer text-left text-[14px] ${
                    activeMenu === 'edition_first'
                      ? 'bg-blue-600 text-white font-bold shadow-xs ring-1 ring-white/30'
                      : 'text-slate-100 hover:bg-emerald-900/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="p-1 rounded-md bg-teal-500/25 border border-teal-400/30 text-teal-300 shrink-0">
                      <FileText className="w-4 h-4" />
                    </span>
                    <span className="truncate">แผนพัฒนาท้องถิ่น (ผ.02)</span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full font-mono font-bold bg-emerald-900/90 text-emerald-200 border border-emerald-700/60">
                    {editionCounts.first}
                  </span>
                </button>

                {/* 4. แผนรายหมู่บ้าน (28 หมู่บ้าน) */}
                <button
                  type="button"
                  id="menu-citizen-village-plan"
                  onClick={() => onSelectMenu('village_plan')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer text-left text-[14px] ${
                    activeMenu === 'village_plan'
                      ? 'bg-blue-600 text-white font-bold shadow-xs ring-1 ring-white/30'
                      : 'text-slate-100 hover:bg-emerald-900/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="p-1 rounded-md bg-sky-500/25 border border-sky-400/30 text-sky-300 shrink-0">
                      <MapPin className="w-4 h-4" />
                    </span>
                    <span className="truncate">แผนรายหมู่บ้าน (28 หมู่บ้าน)</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-sky-900/80 text-sky-200 border border-sky-700/60 shrink-0">
                    15 ม.
                  </span>
                </button>

                {/* 5. สถิติและรายงานสรุป */}
                <button
                  type="button"
                  id="menu-citizen-report"
                  onClick={() => onSelectMenu('report_system')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer text-left text-[14px] ${
                    activeMenu === 'report_system'
                      ? 'bg-blue-600 text-white font-bold shadow-xs ring-1 ring-white/30'
                      : 'text-slate-100 hover:bg-emerald-900/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="p-1 rounded-md bg-amber-500/25 border border-amber-400/30 text-amber-300 shrink-0">
                      <BarChart3 className="w-4 h-4" />
                    </span>
                    <span className="truncate">สถิติและรายงานสรุป</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-900/80 text-amber-200 border border-amber-700/60 shrink-0">
                    สถิติ
                  </span>
                </button>
              </div>
            </div>

            {/* Group 2: สารสนเทศและบริการประชาชน */}
            <div>
              <div className="px-2.5 py-1 text-[12px] font-bold text-sky-300 flex items-center gap-1.5 uppercase tracking-wide">
                <span className="w-2 h-2 rounded-full bg-sky-400 shadow-xs"></span>
                <span>สารสนเทศ & บริการประชาชน</span>
              </div>
              <div className="mt-1 space-y-1">
                {/* 6. ข่าวสาร / ประชาสัมพันธ์ */}
                <button
                  type="button"
                  id="menu-citizen-news"
                  onClick={() => onSelectMenu('citizen_news')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer text-left text-[14px] ${
                    activeMenu === 'citizen_news'
                      ? 'bg-blue-600 text-white font-bold shadow-xs ring-1 ring-white/30'
                      : 'text-slate-100 hover:bg-emerald-900/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="p-1 rounded-md bg-rose-500/25 border border-rose-400/30 text-rose-300 shrink-0">
                      <Megaphone className="w-4 h-4" />
                    </span>
                    <span className="truncate">ข่าวสาร / ประชาสัมพันธ์</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-900/80 text-rose-200 border border-rose-700/60 shrink-0">
                    ข่าว
                  </span>
                </button>

                {/* 7. ดาวน์โหลดเอกสาร / แบบฟอร์ม */}
                <button
                  type="button"
                  id="menu-citizen-downloads"
                  onClick={() => onSelectMenu('citizen_downloads')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer text-left text-[14px] ${
                    activeMenu === 'citizen_downloads'
                      ? 'bg-blue-600 text-white font-bold shadow-xs ring-1 ring-white/30'
                      : 'text-slate-100 hover:bg-emerald-900/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="p-1 rounded-md bg-emerald-500/25 border border-emerald-400/30 text-emerald-300 shrink-0">
                      <Download className="w-4 h-4" />
                    </span>
                    <span className="truncate">ดาวน์โหลดเอกสาร</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-900/80 text-emerald-200 border border-emerald-700/60 shrink-0">
                    PDF
                  </span>
                </button>

                {/* 8. คำถามที่พบบ่อย (FAQ) */}
                <button
                  type="button"
                  id="menu-citizen-faq"
                  onClick={() => onSelectMenu('citizen_faq')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer text-left text-[14px] ${
                    activeMenu === 'citizen_faq'
                      ? 'bg-blue-600 text-white font-bold shadow-xs ring-1 ring-white/30'
                      : 'text-slate-100 hover:bg-emerald-900/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="p-1 rounded-md bg-amber-500/25 border border-amber-400/30 text-amber-300 shrink-0">
                      <HelpCircle className="w-4 h-4" />
                    </span>
                    <span className="truncate">คำถามที่พบบ่อย (FAQ)</span>
                  </div>
                </button>

                {/* 9. ติดต่อเทศบาลเมืองศิลา */}
                <button
                  type="button"
                  id="menu-citizen-contact"
                  onClick={() => onSelectMenu('citizen_contact')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer text-left text-[14px] ${
                    activeMenu === 'citizen_contact'
                      ? 'bg-blue-600 text-white font-bold shadow-xs ring-1 ring-white/30'
                      : 'text-slate-100 hover:bg-emerald-900/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="p-1 rounded-md bg-sky-500/25 border border-sky-400/30 text-sky-300 shrink-0">
                      <Phone className="w-4 h-4" />
                    </span>
                    <span className="truncate">ติดต่อเทศบาลเมืองศิลา</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-sky-900/80 text-sky-200 border border-sky-700/60 shrink-0">
                    สายด่วน
                  </span>
                </button>
              </div>
            </div>

            {/* Quick Switch Helper Button for Dev/Tester */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => handleToggleViewMode('admin')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-emerald-900/30 hover:bg-emerald-900/60 border border-emerald-700/50 text-emerald-200 hover:text-white text-xs font-semibold transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-emerald-300 group-hover:text-emerald-100" />
                  <span>สลับดูเมนูเต็มเจ้าหน้าที่ (Full Menu)</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* FULL MENU (ADMIN / STAFF NAVIGATION)                      */
          /* ========================================================= */
          <>
            {/* Top Quick Entry: ข้อมูลสำหรับประชาชน */}
            <div className="pb-0.5">
              <button
                type="button"
                id="menu-staff-to-citizen"
                onClick={() => {
                  onSelectMenu('citizen_portal');
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer text-left text-[14px] ${
                  activeMenu === 'citizen_portal'
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'bg-blue-900/40 hover:bg-blue-900/70 text-blue-200 border border-blue-500/40'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="p-1 rounded-md bg-blue-500 text-white shadow-2xs shrink-0">
                    <Users className="w-4 h-4" />
                  </span>
                  <span className="text-white font-bold truncate">ข้อมูลสำหรับประชาชน</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-500 text-white">
                  เปิดดู
                </span>
              </button>
            </div>

            {/* Group 1: แผนพัฒนา 5 ปี */}
            <div>
              <div className="px-2.5 py-1 text-[13px] font-bold text-emerald-300 flex items-center gap-1.5 uppercase tracking-wide">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-xs"></span>
                <span>แผนพัฒนา 5 ปี (ผ.02)</span>
              </div>
              <div className="mt-1 space-y-1">
                {/* ภาพรวมแผนพัฒนาท้องถิ่น */}
                <button
                  id="menu-dashboard"
                  onClick={() => onSelectMenu('dashboard')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors cursor-pointer text-left text-[14.5px] leading-normal ${
                    activeMenu === 'dashboard'
                      ? 'bg-emerald-600 text-white font-semibold shadow-xs ring-1 ring-white/30'
                      : 'text-white font-medium hover:bg-emerald-900/70 hover:text-white'
                  }`}
                >
                  <span className="p-1.5 rounded-md bg-sky-500/25 border border-sky-400/40 text-sky-300 shadow-2xs shrink-0">
                    <LayoutDashboard className="w-4 h-4 fill-sky-400/30" />
                  </span>
                  <span className="text-white truncate">ภาพรวมแผนพัฒนาท้องถิ่น</span>
                </button>

                {/* 1. แผนพัฒนาท้องถิ่น ฉบับแรก */}
                <button
                  id="menu-edition-first"
                  onClick={() => onSelectMenu('edition_first')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer text-left text-[14.5px] leading-normal ${
                    activeMenu === 'edition_first'
                      ? 'bg-emerald-600 text-white font-semibold shadow-xs ring-1 ring-white/30'
                      : 'text-white font-medium hover:bg-emerald-900/70 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="p-1.5 rounded-md bg-emerald-500/25 border border-emerald-400/40 text-emerald-300 shadow-2xs shrink-0">
                      <FileText className="w-4 h-4 fill-emerald-400/30" />
                    </span>
                    <span className="truncate text-white">แผนพัฒนาท้องถิ่น ฉบับแรก</span>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-bold text-white ${
                      activeMenu === 'edition_first'
                        ? 'bg-emerald-800 ring-1 ring-white/40'
                        : 'bg-emerald-900/90 border border-emerald-700'
                    }`}
                  >
                    {editionCounts.first}
                  </span>
                </button>

                {/* 2. แผนพัฒนาท้องถิ่น ฉบับเพิ่มเติม */}
                <button
                  id="menu-edition-additional"
                  onClick={() => onSelectMenu('edition_additional')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer text-left text-[14.5px] leading-normal ${
                    activeMenu === 'edition_additional'
                      ? 'bg-emerald-600 text-white font-semibold shadow-xs ring-1 ring-white/30'
                      : 'text-white font-medium hover:bg-emerald-900/70 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="p-1.5 rounded-md bg-teal-500/25 border border-teal-400/40 text-teal-300 shadow-2xs shrink-0">
                      <FilePlus className="w-4 h-4 fill-teal-400/30" />
                    </span>
                    <span className="truncate text-white">แผนพัฒนาท้องถิ่น ฉบับเพิ่มเติม</span>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-bold text-white ${
                      activeMenu === 'edition_additional'
                        ? 'bg-emerald-800 ring-1 ring-white/40'
                        : 'bg-emerald-900/90 border border-emerald-700'
                    }`}
                  >
                    {editionCounts.additional}
                  </span>
                </button>

                {/* 3. แผนพัฒนาท้องถิ่น ฉบับเปลี่ยนแปลง */}
                <button
                  id="menu-edition-changed"
                  onClick={() => onSelectMenu('edition_changed')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer text-left text-[14.5px] leading-normal ${
                    activeMenu === 'edition_changed'
                      ? 'bg-emerald-600 text-white font-semibold shadow-xs ring-1 ring-white/30'
                      : 'text-white font-medium hover:bg-emerald-900/70 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="p-1.5 rounded-md bg-amber-500/25 border border-amber-400/40 text-amber-300 shadow-2xs shrink-0">
                      <FileCode className="w-4 h-4 fill-amber-400/30" />
                    </span>
                    <span className="truncate text-white">แผนพัฒนาท้องถิ่น ฉบับเปลี่ยนแปลง</span>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-bold text-white ${
                      activeMenu === 'edition_changed'
                        ? 'bg-emerald-800 ring-1 ring-white/40'
                        : 'bg-emerald-900/90 border border-emerald-700'
                    }`}
                  >
                    {editionCounts.changed}
                  </span>
                </button>

                {/* 4. แผนพัฒนาท้องถิ่น ฉบับแก้ไข */}
                <button
                  id="menu-edition-amended"
                  onClick={() => onSelectMenu('edition_amended')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer text-left text-[14.5px] leading-normal ${
                    activeMenu === 'edition_amended'
                      ? 'bg-emerald-600 text-white font-semibold shadow-xs ring-1 ring-white/30'
                      : 'text-white font-medium hover:bg-emerald-900/70 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="p-1.5 rounded-md bg-purple-500/25 border border-purple-400/40 text-purple-300 shadow-2xs shrink-0">
                      <FileEdit className="w-4 h-4 fill-purple-400/30" />
                    </span>
                    <span className="truncate text-white">แผนพัฒนาท้องถิ่น ฉบับแก้ไข</span>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-bold text-white ${
                      activeMenu === 'edition_amended'
                        ? 'bg-emerald-800 ring-1 ring-white/40'
                        : 'bg-emerald-900/90 border border-emerald-700'
                    }`}
                  >
                    {editionCounts.amended}
                  </span>
                </button>

                {/* 5. แผนรายหมู่บ้าน */}
                <button
                  id="menu-village-plan"
                  onClick={() => onSelectMenu('village_plan')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer text-left text-[14.5px] leading-normal ${
                    activeMenu === 'village_plan'
                      ? 'bg-blue-600 text-white font-semibold shadow-xs ring-1 ring-white/30'
                      : 'text-white font-medium hover:bg-emerald-900/70 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="p-1.5 rounded-md bg-blue-500/25 border border-blue-400/40 text-blue-300 shadow-2xs shrink-0">
                      <Home className="w-4 h-4 text-white" />
                    </span>
                    <span className="truncate text-white font-medium">แผนรายหมู่บ้าน</span>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-bold text-white ${
                      activeMenu === 'village_plan'
                        ? 'bg-blue-700 ring-1 ring-white/40'
                        : 'bg-emerald-900/90 border border-emerald-700'
                    }`}
                  >
                    15
                  </span>
                </button>
              </div>
            </div>

            {/* Group 2: อนุมัติ & งบประมาณ */}
            <div>
              <div className="px-2.5 py-1 text-[13px] font-bold text-emerald-300 flex items-center gap-1.5 uppercase tracking-wide">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-xs"></span>
                <span>อนุมัติ & งบประมาณ</span>
              </div>
              <div className="mt-1 space-y-1">
                <button
                  id="menu-approve-plan"
                  onClick={() => onSelectMenu('approve_plan')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors cursor-pointer text-left text-[14.5px] leading-normal ${
                    activeMenu === 'approve_plan'
                      ? 'bg-emerald-600 text-white font-semibold shadow-xs ring-1 ring-white/30'
                      : 'text-white font-medium hover:bg-emerald-900/70 hover:text-white'
                  }`}
                >
                  <span className="p-1.5 rounded-md bg-emerald-500/25 border border-emerald-400/40 text-emerald-300 shadow-2xs shrink-0">
                    <CheckCircle2 className="w-4 h-4 fill-emerald-400/30" />
                  </span>
                  <span className="text-white truncate">อนุมัติประกาศใช้แผน</span>
                </button>

                <button
                  id="menu-budget-approval"
                  onClick={() => onSelectMenu('budget_approval')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors cursor-pointer text-left text-[14.5px] leading-normal ${
                    activeMenu === 'budget_approval'
                      ? 'bg-emerald-600 text-white font-semibold shadow-xs ring-1 ring-white/30'
                      : 'text-white font-medium hover:bg-emerald-900/70 hover:text-white'
                  }`}
                >
                  <span className="p-1.5 rounded-md bg-amber-500/25 border border-amber-400/40 text-amber-300 shadow-2xs shrink-0">
                    <CircleDollarSign className="w-4 h-4 fill-amber-400/30" />
                  </span>
                  <span className="text-white truncate">อนุมัติตั้งงบประมาณ</span>
                </button>
              </div>
            </div>

            {/* Group 3: ติดตามและประเมินผล */}
            <div>
              <div className="px-2.5 py-1 text-[13px] font-bold text-sky-300 flex items-center gap-1.5 uppercase tracking-wide">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-xs"></span>
                <span>ติดตามและประเมินผล</span>
              </div>
              <div className="mt-1 space-y-1">
                <button
                  id="menu-project-tracking"
                  onClick={() => onSelectMenu('project_tracking')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer text-left text-[14.5px] leading-normal ${
                    activeMenu === 'project_tracking'
                      ? 'bg-sky-600 text-white font-semibold shadow-xs ring-1 ring-white/40'
                      : 'text-white font-medium hover:bg-emerald-900/70 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="p-1.5 rounded-md bg-sky-400/30 border border-sky-300/50 text-sky-200 shadow-2xs shrink-0">
                      <Activity className="w-4 h-4 text-sky-200" />
                    </span>
                    <span className="truncate text-white font-bold">ติดตามและประเมินผล</span>
                  </div>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-bold text-white shrink-0 ${
                      activeMenu === 'project_tracking'
                        ? 'bg-sky-800 ring-1 ring-white/40'
                        : 'bg-sky-950/80 border border-sky-700/60 text-sky-200'
                    }`}
                  >
                    ผ.03
                  </span>
                </button>
              </div>
            </div>

            {/* Group 4: รายงาน & การสืบค้น */}
            <div>
              <div className="px-2.5 py-1 text-[13px] font-bold text-emerald-300 flex items-center gap-1.5 uppercase tracking-wide">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-xs"></span>
                <span>รายงาน & การสืบค้น</span>
              </div>
              <div className="mt-1 space-y-1">
                {/* ระบบรายงาน (e-Report System & Statistics) */}
                <button
                  id="menu-report-system"
                  onClick={() => onSelectMenu('report_system')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer text-left text-[14.5px] leading-normal ${
                    activeMenu === 'report_system'
                      ? 'bg-emerald-600 text-white font-semibold shadow-xs ring-1 ring-white/30'
                      : 'text-white font-medium hover:bg-emerald-900/70 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="p-1.5 rounded-md bg-blue-500/25 border border-blue-400/40 text-blue-300 shadow-2xs shrink-0">
                      <BarChart3 className="w-4 h-4 text-blue-300" />
                    </span>
                    <span className="truncate text-white font-bold">ระบบรายงาน</span>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-bold text-white shrink-0 bg-blue-600/80 border border-blue-500">
                    สถิติ
                  </span>
                </button>

                {/* ระบบประวัติ / Audit Log */}
                <button
                  id="menu-audit-log"
                  onClick={() => onSelectMenu('audit_log')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer text-left text-[14.5px] leading-normal ${
                    activeMenu === 'audit_log'
                      ? 'bg-emerald-600 text-white font-semibold shadow-xs ring-1 ring-white/30'
                      : 'text-white font-medium hover:bg-emerald-900/70 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="p-1.5 rounded-md bg-amber-500/25 border border-amber-400/40 text-amber-300 shadow-2xs shrink-0">
                      <History className="w-4 h-4" />
                    </span>
                    <span className="truncate text-white font-bold">ระบบประวัติ / Audit Log</span>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-bold text-white shrink-0 bg-emerald-700/80 border border-emerald-600">
                    บันทึก
                  </span>
                </button>

                {/* จัดการข้อมูล / ค้นหา / นำเข้า */}
                <button
                  id="menu-data-management"
                  onClick={() => onSelectMenu('data_management')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer text-left text-[14.5px] leading-normal ${
                    activeMenu === 'data_management'
                      ? 'bg-blue-600 text-white font-semibold shadow-xs ring-1 ring-white/30'
                      : 'text-white font-medium hover:bg-emerald-900/70 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="p-1.5 rounded-md bg-blue-500/25 border border-blue-400/40 text-blue-300 shadow-2xs shrink-0">
                      <Database className="w-4 h-4" />
                    </span>
                    <span className="truncate text-white font-bold">จัดการข้อมูล / ค้นหา / นำเข้า</span>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-bold text-white shrink-0 bg-blue-700/80 border border-blue-500">
                    นำเข้า
                  </span>
                </button>

                {/* หน้า Login — เข้าระบบ */}
                <button
                  id="menu-login-screen"
                  onClick={() => onSelectMenu('login_screen')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer text-left text-[14.5px] leading-normal ${
                    activeMenu === 'login_screen'
                      ? 'bg-amber-600 text-white font-semibold shadow-xs ring-1 ring-white/30'
                      : 'text-white font-medium hover:bg-emerald-900/70 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="p-1.5 rounded-md bg-amber-500/25 border border-amber-400/40 text-amber-300 shadow-2xs shrink-0">
                      <LogIn className="w-4 h-4" />
                    </span>
                    <span className="truncate text-white font-bold">หน้า Login — เข้าระบบ</span>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-bold text-white shrink-0 bg-amber-600/80 border border-amber-400">
                    สิทธิ์
                  </span>
                </button>
              </div>
            </div>

            {/* Group 5: พรีวิวบริการประชาชน (Citizen Services) */}
            <div>
              <div className="px-2.5 py-1 text-[13px] font-bold text-sky-300 flex items-center gap-1.5 uppercase tracking-wide">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-xs"></span>
                <span>พรีวิวบริการประชาชน</span>
              </div>
              <div className="mt-1 space-y-1">
                <button
                  id="menu-staff-news"
                  onClick={() => onSelectMenu('citizen_news')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors cursor-pointer text-left text-[14px] ${
                    activeMenu === 'citizen_news'
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'text-slate-200 hover:bg-emerald-900/70 hover:text-white'
                  }`}
                >
                  <span className="p-1 rounded-md bg-rose-500/25 text-rose-300 shrink-0">
                    <Megaphone className="w-4 h-4" />
                  </span>
                  <span className="truncate">ข่าวสาร / ประชาสัมพันธ์</span>
                </button>

                <button
                  id="menu-staff-downloads"
                  onClick={() => onSelectMenu('citizen_downloads')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors cursor-pointer text-left text-[14px] ${
                    activeMenu === 'citizen_downloads'
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'text-slate-200 hover:bg-emerald-900/70 hover:text-white'
                  }`}
                >
                  <span className="p-1 rounded-md bg-emerald-500/25 text-emerald-300 shrink-0">
                    <Download className="w-4 h-4" />
                  </span>
                  <span className="truncate">ดาวน์โหลดเอกสารแบบฟอร์ม</span>
                </button>

                <button
                  id="menu-staff-contact"
                  onClick={() => onSelectMenu('citizen_contact')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors cursor-pointer text-left text-[14px] ${
                    activeMenu === 'citizen_contact'
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'text-slate-200 hover:bg-emerald-900/70 hover:text-white'
                  }`}
                >
                  <span className="p-1 rounded-md bg-sky-500/25 text-sky-300 shrink-0">
                    <Phone className="w-4 h-4" />
                  </span>
                  <span className="truncate">ช่องทางติดต่อเทศบาล</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 4. Nature Graphic Card at bottom */}
      <div className="px-3 pb-2 pt-1 shrink-0">
        <div className="relative rounded-2xl overflow-hidden border border-emerald-700/60 shadow-md h-28 group">
          <img
            src="/images/citizen-sidebar-nature.jpg"
            alt="ร่วมพัฒนาท้องถิ่นเพื่อคุณภาพชีวิตที่ดีขึ้นของประชาชน"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/95 via-emerald-950/40 to-transparent" />
          <div className="absolute bottom-2 left-2.5 right-2.5 text-center">
            <p className="text-[12.5px] font-bold text-white drop-shadow-sm leading-tight">
              ร่วมพัฒนาท้องถิ่น
            </p>
            <p className="text-[11px] font-medium text-emerald-200 drop-shadow-xs leading-tight mt-0.5">
              เพื่อคุณภาพชีวิตที่ดีขึ้น ของประชาชน
            </p>
          </div>
        </div>
      </div>

      {/* 5. User Profile & Footer Utilities */}
      <div className="px-3 py-2.5 border-t border-emerald-800/80 bg-emerald-950 shrink-0 space-y-1.5">
        <div
          onClick={onOpenAuthModal}
          title="คลิกเพื่อจัดการสิทธิ์หรือสลับผู้ใช้"
          className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-emerald-900/50 transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 shadow-xs ring-2 ${
                currentUser?.role === 'public'
                  ? 'bg-blue-600 text-white ring-blue-400/60'
                  : currentUser?.role === 'admin'
                  ? 'bg-amber-600 text-white ring-amber-400/60'
                  : currentUser?.role === 'executive'
                  ? 'bg-purple-600 text-white ring-purple-400/60'
                  : 'bg-emerald-600 text-white ring-emerald-400/60'
              }`}
            >
              {currentUser?.fullName ? currentUser.fullName.charAt(0) : 'ผ'}
            </div>
            <div className="min-w-0">
              <div className="text-white text-[13px] font-bold truncate leading-tight">
                {currentUser?.fullName || 'นางสาวกมลวรรณ แซ่ดี'}
              </div>
              <div className="text-[11px] flex items-center gap-1.5 leading-tight text-emerald-200/90 mt-0.5 truncate">
                {currentUser?.role === 'public' ? (
                  <span className="text-emerald-100 font-medium truncate">
                    ประชาชน ({currentUser.village || 'หมู่บ้านในตำบลศิลา'})
                  </span>
                ) : (
                  <>
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        currentUser?.role === 'admin'
                          ? 'bg-amber-400 ring-1 ring-white/40'
                          : currentUser?.role === 'executive'
                          ? 'bg-purple-400 ring-1 ring-white/40'
                          : 'bg-blue-400 ring-1 ring-white/40'
                      }`}
                    />
                    <span className="text-emerald-100 font-medium truncate">
                      {currentUser?.role === 'admin' && 'ผู้ดูแลระบบ'}
                      {currentUser?.role === 'executive' && 'ผู้บริหาร'}
                      {currentUser?.role === 'staff' && 'เจ้าหน้าที่'}
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
            className="p-1.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:text-white hover:bg-rose-600 transition-colors cursor-pointer ml-1 shrink-0 shadow-2xs"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-300 fill-rose-400/20" />
          </button>
        </div>

        {/* Quick Utility Switch User */}
        <div className="pt-0.5 flex items-center justify-between text-xs text-emerald-300/80 px-1">
          <button
            type="button"
            onClick={onOpenAuthModal}
            className="hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-300" />
            <span>สลับผู้ใช้งาน</span>
          </button>
          <span className="text-[10px] select-none text-emerald-400/70">ศิลาโมเดล © 2571-2575</span>
        </div>
      </div>
    </aside>
  );
};
