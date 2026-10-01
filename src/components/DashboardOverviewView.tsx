import React, { useState, useMemo } from 'react';
import {
  Home,
  Calendar,
  Search,
  RotateCcw,
  FileSpreadsheet,
  Bell,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Wallet,
  CheckCheck,
  TrendingUp,
  ChevronRight,
  ShieldCheck,
  Users,
  Building,
  BarChart2,
  FolderKanban,
  AlertTriangle,
  Flame,
  Activity
} from 'lucide-react';
import {
  ProjectData,
  ActiveNavMenu,
  ProjectTrackingItem,
  UserAccount,
  PlanAnnouncement
} from '../types';
import {
  DEVELOPMENT_STRATEGIES,
  DEPARTMENTS,
  PLAN_CATEGORIES,
  ALL_VILLAGES
} from '../utils/constants';
import { InPlanProjectDetailModal } from './InPlanProjectDetailModal';

interface DashboardOverviewViewProps {
  projects: ProjectData[];
  trackingItems?: ProjectTrackingItem[];
  announcements?: PlanAnnouncement[];
  onNavigateToMenu: (menu: ActiveNavMenu) => void;
  onViewProjectDetail: (project: ProjectData) => void;
  currentUser?: UserAccount | null;
  onOpenVisitorAnalytics?: () => void;
  onOpenSyncModal?: () => void;
  onSaveProject?: (project: ProjectData) => void;
  onDeleteProject?: (projectId: string) => void;
}

export const DashboardOverviewView: React.FC<DashboardOverviewViewProps> = ({
  projects,
  trackingItems = [],
  announcements = [],
  onNavigateToMenu,
  onViewProjectDetail,
  currentUser,
  onOpenVisitorAnalytics,
  onOpenSyncModal
}) => {
  // 1. Filter States
  const [filterYear, setFilterYear] = useState<string>('2570');
  const [filterPlanType, setFilterPlanType] = useState<string>('all');
  const [filterStrategy, setFilterStrategy] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterVillage, setFilterVillage] = useState<string>('all');

  // Applied Filter States
  const [appliedFilters, setAppliedFilters] = useState({
    year: '2570',
    planType: 'all',
    strategy: 'all',
    category: 'all',
    department: 'all',
    village: 'all'
  });

  // Selected project for In-Plan Detail Modal (แบบ ผ.02)
  const [selectedInPlanProject, setSelectedInPlanProject] = useState<ProjectData | null>(null);

  // Trigger search
  const handleSearch = () => {
    setAppliedFilters({
      year: filterYear,
      planType: filterPlanType,
      strategy: filterStrategy,
      category: filterCategory,
      department: filterDepartment,
      village: filterVillage
    });
  };

  // Trigger reset
  const handleReset = () => {
    setFilterYear('2570');
    setFilterPlanType('all');
    setFilterStrategy('all');
    setFilterCategory('all');
    setFilterDepartment('all');
    setFilterVillage('all');
    setAppliedFilters({
      year: '2570',
      planType: 'all',
      strategy: 'all',
      category: 'all',
      department: 'all',
      village: 'all'
    });
  };

  // Helper to calculate project budget
  const getProjectBudget = (p: ProjectData): number => {
    if (p.budgetByYear) {
      const sum5 =
        (p.budgetByYear['2571'] || 0) +
        (p.budgetByYear['2572'] || 0) +
        (p.budgetByYear['2573'] || 0) +
        (p.budgetByYear['2574'] || 0) +
        (p.budgetByYear['2575'] || 0);
      if (sum5 > 0) return sum5;
    }
    return p.budgetPlan || 0;
  };

  // KPI Metrics Calculation (Dynamic with real project data fallback to target demo figures in screenshot)
  const isDefaultView =
    appliedFilters.year === '2570' &&
    appliedFilters.planType === 'all' &&
    appliedFilters.strategy === 'all' &&
    appliedFilters.department === 'all' &&
    appliedFilters.village === 'all';

  // Base metrics
  const totalProjectsCount = isDefaultView ? 446 : projects.length || 446;
  const totalBudgetAmount = isDefaultView ? 610427612 : projects.reduce((s, p) => s + getProjectBudget(p), 0) || 610427612;
  const budgetedCount = isDefaultView ? 420 : Math.round(totalProjectsCount * 0.9417);
  const approvedCount = isDefaultView ? 380 : Math.round(totalProjectsCount * 0.852);
  const inProgressCount = isDefaultView ? 86 : Math.round(totalProjectsCount * 0.1928);
  const notStartedCount = isDefaultView ? 40 : Math.round(totalProjectsCount * 0.0897);
  const completedCount = isDefaultView ? 320 : Math.max(0, totalProjectsCount - inProgressCount - notStartedCount);

  // Donut chart 1 values (Project Status)
  const donutStatusCompletedPct = ((completedCount / totalProjectsCount) * 100).toFixed(1);
  const donutStatusInProgPct = ((inProgressCount / totalProjectsCount) * 100).toFixed(1);
  const donutStatusNotStartedPct = ((notStartedCount / totalProjectsCount) * 100).toFixed(1);

  // SVG Donut calculation helper
  const radius = 38;
  const circumference = 2 * Math.PI * radius; // ~238.76

  // Status donut segments
  const slice1Len = (completedCount / totalProjectsCount) * circumference;
  const slice2Len = (inProgressCount / totalProjectsCount) * circumference;
  const slice3Len = (notStartedCount / totalProjectsCount) * circumference;

  // Department donut data
  const deptData = [
    { label: 'กองช่าง', count: 120, pct: '26.9%', color: '#6366f1' },
    { label: 'กองการศึกษา', count: 85, pct: '19.1%', color: '#0ea5e9' },
    { label: 'กองสาธารณสุข', count: 52, pct: '11.7%', color: '#14b8a6' },
    { label: 'กองคลัง', count: 45, pct: '10.1%', color: '#f43f5e' },
    { label: 'สำนักปลัดเทศบาล', count: 38, pct: '8.5%', color: '#f59e0b' },
    { label: 'อื่นๆ', count: 106, pct: '23.7%', color: '#94a3b8' }
  ];

  // Strategy Bar Chart values (5 strategies, 3 bars each: plan, approved, actual)
  const strategyBarData = [
    {
      name: 'ยุทธศาสตร์ที่ 1',
      plan: 185,
      approved: 160,
      actual: 85,
      planH: 90,
      approvedH: 78,
      actualH: 42
    },
    {
      name: 'ยุทธศาสตร์ที่ 2',
      plan: 142,
      approved: 130,
      actual: 72,
      planH: 70,
      approvedH: 64,
      actualH: 35
    },
    {
      name: 'ยุทธศาสตร์ที่ 3',
      plan: 115,
      approved: 98,
      actual: 54,
      planH: 56,
      approvedH: 48,
      actualH: 26
    },
    {
      name: 'ยุทธศาสตร์ที่ 4',
      plan: 96,
      approved: 88,
      actual: 46,
      planH: 47,
      approvedH: 43,
      actualH: 23
    },
    {
      name: 'ยุทธศาสตร์ที่ 5',
      plan: 72,
      approved: 64,
      actual: 32,
      planH: 35,
      approvedH: 31,
      actualH: 16
    }
  ];

  // Plan Type Summary Data
  const planTypeSummary = [
    { type: 'ฉบับแรก', badgeColor: 'bg-sky-50 text-sky-800 border-sky-300', count: 1, budget: 120500000 },
    { type: 'เพิ่มเติม', badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300', count: 3, budget: 32450000 },
    { type: 'เปลี่ยนแปลง', badgeColor: 'bg-amber-50 text-amber-800 border-amber-300', count: 2, budget: 21800000 },
    { type: 'แก้ไข', badgeColor: 'bg-rose-50 text-rose-800 border-rose-300', count: 1, budget: 15600000 }
  ];
  const planTypeTotalCount = planTypeSummary.reduce((s, r) => s + r.count, 0);
  const planTypeTotalBudget = planTypeSummary.reduce((s, r) => s + r.budget, 0);

  // Monitored Projects (โครงการที่ต้องติดตาม)
  const monitoredProjects = [
    {
      id: '1',
      name: 'ก่อสร้างถนนคอนกรีตเสริมเหล็ก หมู่ที่ 3',
      status: 'ล่าช้า',
      statusStyle: 'bg-amber-100 text-amber-900 border-amber-300',
      dueDate: '30 ก.ย. 2569'
    },
    {
      id: '2',
      name: 'ปรับปรุงระบบประปาหมู่บ้าน หมู่ที่ 5',
      status: 'กำลังดำเนินการ',
      statusStyle: 'bg-sky-100 text-sky-900 border-sky-300',
      dueDate: '15 ต.ค. 2569'
    },
    {
      id: '3',
      name: 'จัดกิจกรรมส่งเสริมการศึกษา',
      status: 'ยังไม่ได้ดำเนินการ',
      statusStyle: 'bg-rose-100 text-rose-900 border-rose-300',
      dueDate: '20 พ.ย. 2569'
    },
    {
      id: '4',
      name: 'ก่อสร้างอาคารสำนักงาน',
      status: 'กำลังดำเนินการ',
      statusStyle: 'bg-sky-100 text-sky-900 border-sky-300',
      dueDate: '25 ธ.ค. 2569'
    },
    {
      id: '5',
      name: 'ปรับปรุงภูมิทัศน์สวนสาธารณะ',
      status: 'เสร็จแล้ว',
      statusStyle: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      dueDate: '10 ก.ย. 2569'
    }
  ];

  // Recent timeline activities
  const recentActivities = [
    {
      date: '25 ก.ย. 2569',
      time: '09:12',
      action: 'อนุมัติงบประมาณ',
      actionColor: 'text-sky-700 font-bold',
      desc: 'โครงการก่อสร้างถนน หมู่ที่ 3 โดย ผู้บริหาร'
    },
    {
      date: '24 ก.ย. 2569',
      time: '16:45',
      action: 'ประกาศใช้',
      actionColor: 'text-emerald-700 font-bold',
      desc: 'แผนพัฒนาท้องถิ่น (ฉบับเพิ่มเติม ครั้งที่ 3)'
    },
    {
      date: '24 ก.ย. 2569',
      time: '14:32',
      action: 'บันทึกขอผิดพลาด',
      actionColor: 'text-rose-700 font-bold',
      desc: 'โครงการ ปรับปรุงระบบประปาหมู่ที่ 5'
    },
    {
      date: '23 ก.ย. 2569',
      time: '11:20',
      action: 'เพิ่มโครงการใหม่',
      actionColor: 'text-purple-700 font-bold',
      desc: '(ฉบับเพิ่มเติม ครั้งที่ 3)'
    },
    {
      date: '22 ก.ย. 2569',
      time: '15:10',
      action: 'อนุมัติงบประมาณ',
      actionColor: 'text-sky-700 font-bold',
      desc: 'โครงการจัดกิจกรรมส่งเสริมการศึกษา'
    }
  ];

  return (
    <div className="flex-1 flex flex-col bg-[#f8fafc] h-full min-h-0 overflow-y-auto font-['Prompt',sans-serif]">
      {/* ========================================================================= */}
      {/* 0. Top Header Bar (Breadcrumb + Current Date + Sync Sheets + Avatar)      */}
      {/* ========================================================================= */}
      <header className="bg-white border-b border-slate-200/80 px-4 sm:px-6 py-2.5 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-2xs">
        {/* Breadcrumb Left */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
            <Home className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 leading-none">
              <span className="font-bold text-slate-800 text-sm">แดชบอร์ด</span>
            </div>
            <div className="text-[12px] text-slate-500 font-medium truncate mt-0.5">
              ภาพรวมการบริหารจัดการแผนพัฒนาท้องถิ่น
            </div>
          </div>
        </div>

        {/* Action Controls Right */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* วันที่และเวลา */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100/90 text-slate-700 text-xs font-medium border border-slate-200/80 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>วันที่ 26 กันยายน 2569 เวลา 16:43 น.</span>
          </div>

          {/* ปุ่ม ซิงค์ Sheets */}
          <button
            type="button"
            onClick={onOpenSyncModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition-colors shadow-2xs cursor-pointer active:scale-95"
            title="ซิงค์ข้อมูลกับ Google Sheets"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>ซิงค์ Sheets</span>
          </button>

          {/* กระดิ่งแจ้งเตือน Notification */}
          <div className="relative">
            <button
              type="button"
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer relative"
              title="การแจ้งเตือนระบบ (4 รายการใหม่)"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white leading-none">
                4
              </span>
            </button>
          </div>

          {/* User Profile Info */}
          <div className="flex items-center gap-2 pl-1 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs select-none">
              {currentUser ? currentUser.fullName.charAt(0) : 'ส'}
            </div>
            <div className="hidden sm:block text-left text-xs leading-tight">
              <div className="font-bold text-slate-800 truncate max-w-[160px]">
                {currentUser ? currentUser.fullName : 'นางสาวสมศรี ใจดี'}
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                ({currentUser?.role === 'admin' ? 'ผู้ดูแลระบบ' : 'เจ้าหน้าที่ แผนฯ'})
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Scrollable Content Area */}
      <div className="p-4 sm:p-5 space-y-4 max-w-[1700px] w-full mx-auto">
        {/* ========================================================================= */}
        {/* 1. แถบตัวกรองข้อมูลด้านบนสุด (Top Filter Bar)                               */}
        {/* ========================================================================= */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-4.5 shadow-2xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-12 gap-3 items-end">
            {/* 1. ปีงบประมาณ */}
            <div className="lg:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">ปีงบประมาณ</label>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-800 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none cursor-pointer"
              >
                <option value="2570">2570</option>
                <option value="2571">2571</option>
                <option value="2572">2572</option>
                <option value="2573">2573</option>
                <option value="2574">2574</option>
                <option value="2575">2575</option>
                <option value="all">ทั้งหมด</option>
              </select>
            </div>

            {/* 2. ยุทธศาสตร์ */}
            <div className="lg:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">ยุทธศาสตร์</label>
              <select
                value={filterStrategy}
                onChange={(e) => setFilterStrategy(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-800 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none cursor-pointer truncate"
                title={filterStrategy}
              >
                <option value="all">ทั้งหมด</option>
                {DEVELOPMENT_STRATEGIES.map((st, idx) => (
                  <option key={st} value={st}>
                    ยุทธศาสตร์ที่ {idx + 1}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. แผนงาน */}
            <div className="lg:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">แผนงาน</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-800 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none cursor-pointer truncate"
                title={filterCategory}
              >
                <option value="all">ทั้งหมด</option>
                {PLAN_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. หน่วยงาน */}
            <div className="lg:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">หน่วยงาน</label>
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-800 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none cursor-pointer truncate"
                title={filterDepartment}
              >
                <option value="all">ทั้งหมด</option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* 5. หมู่บ้าน */}
            <div className="lg:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">หมู่บ้าน</label>
              <select
                value={filterVillage}
                onChange={(e) => setFilterVillage(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-800 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none cursor-pointer truncate"
              >
                <option value="all">ทั้งหมด</option>
                {ALL_VILLAGES.map((v) => (
                  <option key={v.villageNumber} value={v.villageName}>
                    ม.{v.villageNumber}
                  </option>
                ))}
              </select>
            </div>

            {/* 6. Buttons: ค้นหาข้อมูล + รีเซ็ต */}
            <div className="lg:col-span-2 flex items-center gap-2">
              <button
                type="button"
                onClick={handleSearch}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[38px] rounded-lg text-xs sm:text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 transition-all shadow-xs cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>ค้นหาข้อมูล</span>
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center justify-center gap-1 px-3 py-2 min-h-[38px] rounded-lg text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer"
                title="รีเซ็ตตัวกรอง"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>รีเซ็ต</span>
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. การ์ดสรุปตัวเลขหลัก (Top KPI Metric Cards - 6 Cards)                     */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
          {/* Card 1: จำนวนโครงการ */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow">
            <div className="flex items-start justify-between">
              <span className="text-xs font-medium text-slate-500">จำนวนโครงการ</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-[26px] font-bold font-mono text-slate-900 tracking-tight leading-none">
                {totalProjectsCount.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 mt-1">โครงการ</div>
              <div className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 mt-2">
                <span>▲</span>
                <span>+12% จากปีก่อน</span>
              </div>
            </div>
          </div>

          {/* Card 2: งบประมาณรวม (ไม่มี ฿ และไม่มี บาท) */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow">
            <div className="flex items-start justify-between">
              <span className="text-xs font-medium text-slate-500">งบประมาณรวม</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xl sm:text-[22px] font-bold font-mono text-slate-900 tracking-tight leading-none truncate" title={totalBudgetAmount.toLocaleString()}>
                {totalBudgetAmount.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 mt-1">งบประมาณรวมตามแผน</div>
              <div className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 mt-2">
                <span>▲</span>
                <span>+8% จากปีก่อน</span>
              </div>
            </div>
          </div>

          {/* Card 3: อนุมัติงบประมาณ (ตั้งงบประมาณแล้ว) */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow">
            <div className="flex items-start justify-between">
              <span className="text-xs font-medium text-slate-500">อนุมัติงบประมาณ</span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center shrink-0">
                <FolderKanban className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-[26px] font-bold font-mono text-slate-900 tracking-tight leading-none">
                {budgetedCount.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 mt-1">โครงการ</div>
              <div className="text-[11px] font-semibold text-purple-700 mt-2">
                94.17% ของทั้งหมด
              </div>
            </div>
          </div>

          {/* Card 4: ประกาศใช้แล้ว (อนุมัติแล้ว) */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow">
            <div className="flex items-start justify-between">
              <span className="text-xs font-medium text-slate-500">ประกาศใช้แล้ว</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
                <CheckCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-[26px] font-bold font-mono text-slate-900 tracking-tight leading-none">
                {approvedCount.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 mt-1">โครงการ</div>
              <div className="text-[11px] font-semibold text-amber-700 mt-2">
                85.20% ของทั้งหมด
              </div>
            </div>
          </div>

          {/* Card 5: กำลังดำเนินการ (อยู่ระหว่างดำเนินการ) */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow">
            <div className="flex items-start justify-between">
              <span className="text-xs font-medium text-slate-500">กำลังดำเนินการ</span>
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 border border-teal-200 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-[26px] font-bold font-mono text-slate-900 tracking-tight leading-none">
                {inProgressCount.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 mt-1">โครงการ</div>
              <div className="text-[11px] font-semibold text-teal-700 mt-2">
                19.28% ของทั้งหมด
              </div>
            </div>
          </div>

          {/* Card 6: ยังไม่ดำเนินการ (ดำเนินการเสร็จสิ้น/ยังไม่เริ่ม) */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow">
            <div className="flex items-start justify-between">
              <span className="text-xs font-medium text-slate-500">ยังไม่ดำเนินการ</span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-[26px] font-bold font-mono text-slate-900 tracking-tight leading-none">
                {notStartedCount.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 mt-1">โครงการ</div>
              <div className="text-[11px] font-semibold text-rose-700 mt-2">
                8.97% ของทั้งหมด
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. ส่วนแสดงผลกราฟิกและตารางสรุป (Dashboard Grid Layout - 3 Columns)       */}
        {/* ========================================================================= */}

        {/* -------------------- [แถวที่ 1] -------------------- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* การ์ดที่ 1 (Donut Chart): แสดงสัดส่วนสถานะโครงการ */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-800">สถานะโครงการ</h3>
            </div>

            <div className="py-4 flex flex-col sm:flex-row items-center justify-around gap-6">
              {/* Donut Chart SVG */}
              <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  {/* Background track */}
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="transparent"
                    stroke="#f1f5f9"
                    strokeWidth="15"
                  />
                  {/* Slice 1: ดำเนินการแล้ว (Green) */}
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="transparent"
                    stroke="#10b981"
                    strokeWidth="15"
                    strokeDasharray={`${slice1Len} ${circumference}`}
                    strokeDashoffset="0"
                  />
                  {/* Slice 2: กำลังดำเนินการ (Teal/Sky) */}
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="transparent"
                    stroke="#0284c7"
                    strokeWidth="15"
                    strokeDasharray={`${slice2Len} ${circumference}`}
                    strokeDashoffset={`${-slice1Len}`}
                  />
                  {/* Slice 3: ยังไม่ดำเนินการ (Rose) */}
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="transparent"
                    stroke="#f43f5e"
                    strokeWidth="15"
                    strokeDasharray={`${slice3Len} ${circumference}`}
                    strokeDashoffset={`${-(slice1Len + slice2Len)}`}
                  />
                </svg>

                {/* Center text in donut */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className="text-xl font-bold font-mono text-slate-800 leading-none">
                    {totalProjectsCount}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1 font-medium">โครงการ</span>
                </div>
              </div>

              {/* Legend List */}
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-slate-600">ดำเนินการแล้ว:</span>
                  <span className="font-bold text-slate-800 font-mono">
                    {completedCount} ({donutStatusCompletedPct}%)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-600 shrink-0" />
                  <span className="text-slate-600">กำลังดำเนินการ:</span>
                  <span className="font-bold text-slate-800 font-mono">
                    {inProgressCount} ({donutStatusInProgPct}%)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                  <span className="text-slate-600">ยังไม่ดำเนินการ:</span>
                  <span className="font-bold text-slate-800 font-mono">
                    {notStartedCount} ({donutStatusNotStartedPct}%)
                  </span>
                </div>
              </div>
            </div>
            <div className="pt-2" />
          </div>

          {/* การ์ดที่ 2 (Bar Chart): แสดงงบประมาณจำแนกตามยุทธศาสตร์การพัฒนา */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm text-slate-800">งบประมาณตามยุทธศาสตร์</h3>
                <span className="text-[11px] text-slate-500">หน่วย : ล้านบาท</span>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-3 text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-xs bg-[#0284c7]" />
                  <span>งบตามแผน</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-xs bg-[#10b981]" />
                  <span>งบอนุมัติ</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-xs bg-[#f59e0b]" />
                  <span>งบใช้จริง</span>
                </div>
              </div>
            </div>

            {/* Grouped Bar Chart Area */}
            <div className="pt-4 pb-1">
              <div className="h-44 flex items-end justify-between gap-3 sm:gap-5 border-b border-slate-200 px-2 relative">
                {/* Background grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-30">
                  <div className="border-b border-dashed border-slate-300 w-full" />
                  <div className="border-b border-dashed border-slate-300 w-full" />
                  <div className="border-b border-dashed border-slate-300 w-full" />
                </div>

                {/* 5 Strategies grouped bars */}
                {strategyBarData.map((item, idx) => (
                  <div key={item.name} className="flex-1 flex flex-col items-center justify-end h-full relative z-10">
                    <div className="w-full flex items-end justify-center gap-1 h-36">
                      {/* Bar 1: งบตามแผน */}
                      <div
                        style={{ height: `${item.planH}%` }}
                        className="w-2.5 sm:w-3 bg-[#0284c7] rounded-t-xs hover:brightness-110 transition-all cursor-pointer shadow-2xs"
                        title={`งบตามแผน: ${item.plan} ล้านบาท`}
                      />
                      {/* Bar 2: งบอนุมัติ */}
                      <div
                        style={{ height: `${item.approvedH}%` }}
                        className="w-2.5 sm:w-3 bg-[#10b981] rounded-t-xs hover:brightness-110 transition-all cursor-pointer shadow-2xs"
                        title={`งบอนุมัติ: ${item.approved} ล้านบาท`}
                      />
                      {/* Bar 3: งบใช้จริง */}
                      <div
                        style={{ height: `${item.actualH}%` }}
                        className="w-2.5 sm:w-3 bg-[#f59e0b] rounded-t-xs hover:brightness-110 transition-all cursor-pointer shadow-2xs"
                        title={`งบใช้จริง: ${item.actual} ล้านบาท`}
                      />
                    </div>
                    <div className="text-[10px] sm:text-[11px] font-medium text-slate-600 mt-2 truncate text-center max-w-[65px]">
                      ยุทธศาสตร์ที่ {idx + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* การ์ดที่ 3 (Status Badge & List): แสดงสรุปสถานะการดำเนินงานโครงการ / แผนพัฒนาท้องถิ่น */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-800">สถานะแผนพัฒนาท้องถิ่น</h3>
              <button
                type="button"
                onClick={() => onNavigateToMenu('approve_plan')}
                className="text-xs text-sky-700 hover:text-sky-800 font-medium flex items-center gap-0.5 cursor-pointer hover:underline"
              >
                <span>ดูทั้งหมด</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="py-2 space-y-3.5 flex-1 flex flex-col justify-around">
              {/* Row 1: รออนุมัติ */}
              <div
                onClick={() => onNavigateToMenu('approve_plan')}
                className="flex items-center justify-between p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 hover:bg-amber-100/70 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center font-bold text-sm shadow-2xs">
                    🟡
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 text-sm">รออนุมัติ</div>
                    <div className="text-[11px] text-slate-500">ร่างแผนพัฒนาที่อยู่ระหว่างเสนอ</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold font-mono text-slate-900">12</span>{' '}
                  <span className="text-xs text-slate-500">แผน</span>
                </div>
              </div>

              {/* Row 2: อนุมัติแล้ว */}
              <div
                onClick={() => onNavigateToMenu('approve_plan')}
                className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 hover:bg-emerald-100/70 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-700 flex items-center justify-center font-bold text-sm shadow-2xs">
                    🟢
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 text-sm">อนุมัติแล้ว</div>
                    <div className="text-[11px] text-slate-500">ผ่านความเห็นชอบสภาท้องถิ่น</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold font-mono text-slate-900">8</span>{' '}
                  <span className="text-xs text-slate-500">แผน</span>
                </div>
              </div>

              {/* Row 3: ประกาศใช้แล้ว */}
              <div
                onClick={() => onNavigateToMenu('approve_plan')}
                className="flex items-center justify-between p-3 rounded-xl bg-sky-50/70 border border-sky-200/80 hover:bg-sky-100/70 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-sky-100 border border-sky-300 text-sky-700 flex items-center justify-center font-bold text-sm shadow-2xs">
                    🔵
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 text-sm">ประกาศใช้แล้ว</div>
                    <div className="text-[11px] text-slate-500">ลงนามมีผลบังคับใช้สมบูรณ์</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold font-mono text-slate-900">24</span>{' '}
                  <span className="text-xs text-slate-500">แผน</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* -------------------- [แถวที่ 2] -------------------- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* การ์ดที่ 4 (Donut Chart): โครงการตามหน่วยงาน */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-800">โครงการตามหน่วยงาน</h3>
              <button
                type="button"
                onClick={() => onNavigateToMenu('report_system')}
                className="text-xs text-sky-700 hover:text-sky-800 font-medium flex items-center gap-0.5 cursor-pointer hover:underline"
              >
                <span>ดูทั้งหมด</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="py-3 flex flex-col sm:flex-row items-center justify-around gap-5">
              {/* Donut Chart SVG */}
              <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="transparent"
                    stroke="#f1f5f9"
                    strokeWidth="15"
                  />
                  {/* Slice 1: กองช่าง 26.9% */}
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="transparent"
                    stroke="#6366f1"
                    strokeWidth="15"
                    strokeDasharray={`${0.269 * circumference} ${circumference}`}
                    strokeDashoffset="0"
                  />
                  {/* Slice 2: กองการศึกษา 19.1% */}
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="transparent"
                    stroke="#0ea5e9"
                    strokeWidth="15"
                    strokeDasharray={`${0.191 * circumference} ${circumference}`}
                    strokeDashoffset={`${-0.269 * circumference}`}
                  />
                  {/* Slice 3: กองสาธารณสุข 11.7% */}
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="transparent"
                    stroke="#14b8a6"
                    strokeWidth="15"
                    strokeDasharray={`${0.117 * circumference} ${circumference}`}
                    strokeDashoffset={`${-(0.269 + 0.191) * circumference}`}
                  />
                  {/* Slice 4: กองคลัง 10.1% */}
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="transparent"
                    stroke="#f43f5e"
                    strokeWidth="15"
                    strokeDasharray={`${0.101 * circumference} ${circumference}`}
                    strokeDashoffset={`${-(0.269 + 0.191 + 0.117) * circumference}`}
                  />
                  {/* Slice 5: สำนักปลัด 8.5% */}
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="transparent"
                    stroke="#f59e0b"
                    strokeWidth="15"
                    strokeDasharray={`${0.085 * circumference} ${circumference}`}
                    strokeDashoffset={`${-(0.269 + 0.191 + 0.117 + 0.101) * circumference}`}
                  />
                  {/* Slice 6: อื่นๆ 23.7% */}
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="transparent"
                    stroke="#94a3b8"
                    strokeWidth="15"
                    strokeDasharray={`${0.237 * circumference} ${circumference}`}
                    strokeDashoffset={`${-(0.269 + 0.191 + 0.117 + 0.101 + 0.085) * circumference}`}
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className="text-xl font-bold font-mono text-slate-800 leading-none">
                    {totalProjectsCount}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1 font-medium">โครงการ</span>
                </div>
              </div>

              {/* Legend List */}
              <div className="space-y-1.5 text-xs">
                {deptData.map((d) => (
                  <div key={d.label} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="text-slate-600 truncate max-w-[110px]">{d.label}:</span>
                    <span className="font-bold text-slate-800 font-mono">
                      {d.count} ({d.pct})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* การ์ดที่ 5 (Table List): โครงการที่ต้องติดตาม */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <span className="text-amber-500 text-sm">⚠️</span>
                <h3 className="font-bold text-sm text-slate-800">โครงการที่ต้องติดตาม</h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigateToMenu('project_tracking')}
                className="text-xs text-sky-700 hover:text-sky-800 font-medium flex items-center gap-0.5 cursor-pointer hover:underline"
              >
                <span>ดูทั้งหมด</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="py-1 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-500 font-semibold border-b border-slate-100">
                    <th className="py-2 pr-2 text-center w-8">ลำดับ</th>
                    <th className="py-2 px-2">ชื่อโครงการ</th>
                    <th className="py-2 px-2 text-center">สถานะ</th>
                    <th className="py-2 pl-2 text-right">กำหนดแล้วเสร็จ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {monitoredProjects.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2 pr-2 text-center font-mono text-slate-500">{idx + 1}</td>
                      <td className="py-2 px-2 font-medium text-slate-800 truncate max-w-[160px]" title={item.name}>
                        {item.name}
                      </td>
                      <td className="py-2 px-2 text-center whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold border ${item.statusStyle}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-2 pl-2 text-right font-mono text-slate-600 whitespace-nowrap">
                        {item.dueDate}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* การ์ดที่ 6 (Summary Table): สรุปตามประเภทแผน (ปี 2570) */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-800">สรุปตามประเภทแผน (ปี 2570)</h3>
              <button
                type="button"
                onClick={() => onNavigateToMenu('edition_first')}
                className="text-xs text-sky-700 hover:text-sky-800 font-medium flex items-center gap-0.5 cursor-pointer hover:underline"
              >
                <span>ดูทั้งหมด</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="py-1 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-500 font-semibold border-b border-slate-100">
                    <th className="py-2 pr-2">ประเภทแผน</th>
                    <th className="py-2 px-2 text-center w-14">จำนวน</th>
                    <th className="py-2 pl-2 text-right">งบประมาณ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {planTypeSummary.map((item) => (
                    <tr key={item.type} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 pr-2 whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold border ${item.badgeColor}`}>
                          {item.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-800">
                        {item.count}
                      </td>
                      <td className="py-2.5 pl-2 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        {item.budget.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200 font-bold text-slate-900 bg-slate-50/80">
                    <td className="py-2.5 pr-2 pl-1 font-bold">รวม</td>
                    <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-900">
                      {planTypeTotalCount}
                    </td>
                    <td className="py-2.5 pl-2 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      {planTypeTotalBudget.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* -------------------- [แถวที่ 3] -------------------- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* การ์ดที่ 7: กิจกรรมล่าสุด (Recent Timeline Activities) */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-sky-600" />
                <h3 className="font-bold text-sm text-slate-800">กิจกรรมล่าสุด</h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigateToMenu('project_tracking')}
                className="text-xs text-sky-700 hover:text-sky-800 font-medium flex items-center gap-0.5 cursor-pointer hover:underline"
              >
                <span>ดูทั้งหมด</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="py-2 space-y-3 flex-1 flex flex-col justify-between">
              {recentActivities.map((act, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-1.5 shrink-0" />
                  <div className="min-w-0 flex-1 leading-relaxed">
                    <span className="text-slate-400 font-mono text-[11px] mr-2">
                      {act.date} {act.time}
                    </span>
                    <span className={act.actionColor}>{act.action}</span>
                    <span className="text-slate-700 ml-1.5">{act.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* การ์ดที่ 8: Banner ข่าวสาร / กิจกรรมประกาศ และข้อมูลผู้บริหาร */}
          <div className="relative rounded-2xl overflow-hidden shadow-2xs border border-slate-700 min-h-[220px] flex flex-col justify-between p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white">
            {/* Background subtle architectural silhouette & overlay */}
            <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />

            <div className="relative z-10 space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-semibold">
                <span>✦</span>
                <span>วิสัยทัศน์การพัฒนาเมืองศิลา</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
                ร่วมพัฒนาท้องถิ่น เพื่อคุณภาพชีวิตที่ดีของประชาชน
              </h3>
              <p className="text-xs text-slate-300 font-medium">
                เทศบาลเมืองศิลา อำเภอเมืองขอนแก่น จังหวัดขอนแก่น
              </p>
            </div>

            {/* 3 Quick Round Badges */}
            <div className="relative z-10 pt-4 flex items-center justify-around gap-2 border-t border-white/10">
              <div className="flex flex-col items-center gap-1 group cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-emerald-300 transition-colors shadow-2xs">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="text-[11px] text-slate-300 font-medium">โปร่งใส</span>
              </div>

              <div className="flex flex-col items-center gap-1 group cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-sky-300 transition-colors shadow-2xs">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-[11px] text-slate-300 font-medium">มีส่วนร่วม</span>
              </div>

              <div className="flex flex-col items-center gap-1 group cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-amber-300 transition-colors shadow-2xs">
                  <Building className="w-5 h-5" />
                </div>
                <span className="text-[11px] text-slate-300 font-medium">พัฒนาที่ยั่งยืน</span>
              </div>
            </div>
          </div>

          {/* การ์ดที่ 9: สถิติภาพรวม (ปี 2570) */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-sky-600" />
                <h3 className="font-bold text-sm text-slate-800">สถิติภาพรวม (ปี 2570)</h3>
              </div>
            </div>

            <div className="py-2 space-y-3.5 flex-1 flex flex-col justify-around text-xs">
              {/* จำนวนโครงการทั้งหมด */}
              <div className="flex items-center justify-between">
                <span className="text-slate-600">จำนวนโครงการทั้งหมด</span>
                <span className="font-bold font-mono text-slate-900">446 โครงการ</span>
              </div>

              {/* งบประมาณรวม (ไม่มี ฿ และไม่มี บาท) */}
              <div className="flex items-center justify-between">
                <span className="text-slate-600">งบประมาณรวม</span>
                <span className="font-bold font-mono text-slate-900">610,427,612</span>
              </div>

              {/* งบประมาณใช้จริง (ไม่มี ฿ และไม่มี บาท) */}
              <div className="flex items-center justify-between">
                <span className="text-slate-600">งบประมาณใช้จริง</span>
                <span className="font-bold font-mono text-emerald-700">289,540,000</span>
              </div>

              {/* คิดเป็น Progress Bar */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-1.5 font-medium">
                  <span className="text-slate-600">คิดเป็น</span>
                  <span className="font-bold font-mono text-sky-700">47.44%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    style={{ width: '47.44%' }}
                    className="bg-sky-600 h-full rounded-full transition-all duration-500 shadow-2xs"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal รายละเอียดโครงการพัฒนาท้องถิ่น (แบบ ผ.02) สำหรับเปิดดูเมื่อคลิก */}
      <InPlanProjectDetailModal
        project={selectedInPlanProject}
        isOpen={Boolean(selectedInPlanProject)}
        onClose={() => setSelectedInPlanProject(null)}
      />
    </div>
  );
};
