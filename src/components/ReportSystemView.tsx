import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  FileText,
  Coins,
  Building2,
  CheckCircle2,
  Calendar,
  Search,
  ChevronRight,
  TrendingUp,
  Home,
  Users,
  Activity,
  Download,
  Printer,
  FileSpreadsheet,
  Clock,
  ArrowRight,
  PieChart,
  Eye,
  X,
  Filter,
  Layers,
  Sparkles,
  HelpCircle,
  Bell,
  Briefcase,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { ProjectData, ProjectTrackingItem, UserAccount } from '../types';
import { DEVELOPMENT_STRATEGIES, DEPARTMENTS, ALL_VILLAGES } from '../utils/constants';
import { getProjectDisplayId } from '../utils/projectCode';

interface ReportSystemViewProps {
  projects: ProjectData[];
  trackingItems?: ProjectTrackingItem[];
  currentUser?: UserAccount | null;
  onNavigateToMenu?: (menu: any) => void;
  onOpenProjectDetail?: (project: ProjectData) => void;
}

export const ReportSystemView: React.FC<ReportSystemViewProps> = ({
  projects,
  trackingItems = [],
  currentUser,
  onNavigateToMenu,
  onOpenProjectDetail
}) => {
  // Search & Filter State
  const [selectedYear, setSelectedYear] = useState<string>('2570');
  const [selectedPlanType, setSelectedPlanType] = useState<string>('ทุกประเภท');
  const [selectedStrategy, setSelectedStrategy] = useState<string>('ทุกยุทธศาสตร์');
  const [selectedStatus, setSelectedStatus] = useState<string>('ทั้งหมด');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // Top header popover & active report modal
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [activeReportModal, setActiveReportModal] = useState<{
    id: string;
    title: string;
    description: string;
  } | null>(null);

  // View Mode: 'dashboard' = Executive Dashboard & Visuals, 'table' = Detailed Project Data Table
  const [activeTab, setActiveTab] = useState<'dashboard' | 'table'>('dashboard');
  const [tablePage, setTablePage] = useState<number>(1);
  const [modalSearchKeyword, setModalSearchKeyword] = useState<string>('');

  // Compute aggregated stats
  const stats = useMemo(() => {
    const totalProjectsCount = projects.length > 0 ? projects.length : 446;
    const completedProjectsCount = projects.filter((p) => p.executionStatus === 'completed').length || 28;
    const inProgressProjectsCount = projects.filter((p) => p.executionStatus === 'in_progress' || p.status === 'approved').length || 412;
    const pendingProjectsCount = projects.filter((p) => p.status === 'pending').length || 6;

    const totalBudget = projects.reduce((sum, p) => sum + (p.budgetPlan || 0), 0) || 610427612;

    const completedPct = totalProjectsCount > 0 ? ((completedProjectsCount / totalProjectsCount) * 100).toFixed(1) : '6.3';
    const inProgressPct = totalProjectsCount > 0 ? ((inProgressProjectsCount / totalProjectsCount) * 100).toFixed(1) : '92.4';

    return {
      editionsCount: 4,
      totalBudget,
      totalProjectsCount,
      inProgressProjectsCount,
      inProgressPct,
      completedProjectsCount,
      completedPct,
      pendingProjectsCount
    };
  }, [projects]);

  // Strategy budget breakdown for Donut Chart
  const strategyBreakdown = useMemo(() => {
    if (projects.length > 0) {
      const colors = ['#10b981', '#059669', '#f59e0b', '#8b5cf6', '#3b82f6'];
      const totalB = projects.reduce((sum, p) => sum + (p.budgetPlan || 0), 0) || 1;

      const dynamicList = DEVELOPMENT_STRATEGIES.map((strat, idx) => {
        const stratProjects = projects.filter((p) =>
          p.planStrategy && (p.planStrategy.includes(strat) || strat.includes(p.planStrategy) || p.planStrategy.includes(`ที่ ${idx + 1}`))
        );
        const amount = stratProjects.reduce((sum, p) => sum + (p.budgetPlan || 0), 0);
        const percentage = Number(((amount / totalB) * 100).toFixed(1));
        return {
          name: strat.split(':')[0] || `ยุทธศาสตร์ที่ ${idx + 1}`,
          amount,
          percentage,
          color: colors[idx % colors.length]
        };
      });

      if (dynamicList.some((item) => item.amount > 0)) {
        return {
          list: dynamicList,
          totalMillions: (totalB / 1000000).toFixed(2)
        };
      }
    }

    const fallbackList = [
      { name: 'ยุทธศาสตร์ที่ 1 ด้านโครงสร้างพื้นฐาน', amount: 185600000, percentage: 30.4, color: '#10b981' },
      { name: 'ยุทธศาสตร์ที่ 2 ด้านการพัฒนาเศรษฐกิจ', amount: 123750000, percentage: 20.3, color: '#059669' },
      { name: 'ยุทธศาสตร์ที่ 3 ด้านการพัฒนาสังคมและคุณภาพชีวิต', amount: 96400000, percentage: 16.1, color: '#f59e0b' },
      { name: 'ยุทธศาสตร์ที่ 4 ด้านการอนุรักษ์ทรัพยากรธรรมชาติและสิ่งแวดล้อม', amount: 60800000, percentage: 12.6, color: '#8b5cf6' },
      { name: 'ยุทธศาสตร์ที่ 5 ด้านการบริหารจัดการบ้านเมืองที่ดี', amount: 13100000, percentage: 2.7, color: '#3b82f6' }
    ];

    const totalMillions = (610.43).toFixed(2);
    return { list: fallbackList, totalMillions };
  }, [projects]);

  // Filtered projects for search or drill-down
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (selectedYear !== 'ทั้งหมด' && p.year !== selectedYear) return false;
      if (selectedPlanType !== 'ทุกประเภท') {
        if (selectedPlanType === 'ฉบับแรก' && p.edition !== 'first') return false;
        if (selectedPlanType === 'ฉบับเพิ่มเติม' && p.edition !== 'additional') return false;
        if (selectedPlanType === 'ฉบับเปลี่ยนแปลง' && p.edition !== 'changed') return false;
        if (selectedPlanType === 'ฉบับแก้ไข' && p.edition !== 'amended') return false;
      }
      if (selectedStrategy !== 'ทุกยุทธศาสตร์' && p.planStrategy && !p.planStrategy.includes(selectedStrategy.replace('ยุทธศาสตร์ที่ ', ''))) {
        return false;
      }
      if (selectedStatus !== 'ทั้งหมด') {
        if (selectedStatus === 'ดำเนินการ' && p.executionStatus !== 'in_progress' && p.status !== 'approved') return false;
        if (selectedStatus === 'แล้วเสร็จ' && p.executionStatus !== 'completed') return false;
        if (selectedStatus === 'รออนุมัติ' && p.status !== 'pending') return false;
      }
      if (searchKeyword.trim()) {
        const kw = searchKeyword.toLowerCase();
        const matchName = p.name.toLowerCase().includes(kw);
        const matchCode = (p.code || '').toLowerCase().includes(kw);
        const matchVillage = (p.village || '').toLowerCase().includes(kw);
        const matchDept = (p.department || '').toLowerCase().includes(kw);
        if (!matchName && !matchCode && !matchVillage && !matchDept) return false;
      }
      return true;
    });
  }, [projects, selectedYear, selectedPlanType, selectedStrategy, selectedStatus, searchKeyword]);

  // Dynamically filtered projects for the Active Report Drill-down Modal
  const modalProjects = useMemo(() => {
    if (!activeReportModal) return [];
    const reportId = activeReportModal.id;
    let list = [...projects];

    if (reportId === 'report_completed') {
      list = list.filter((p) => p.executionStatus === 'completed');
    } else if (reportId === 'report_in_progress') {
      list = list.filter((p) => p.executionStatus === 'in_progress' || p.status === 'approved');
    } else if (reportId === 'report_waiting_approval' || reportId === 'report_pending_budget') {
      list = list.filter((p) => p.status === 'pending' || !p.budgetApproved || p.budgetApproved === 0);
    } else if (reportId === 'report_approved_all') {
      list = list.filter((p) => p.status === 'approved');
    } else if (reportId === 'report_by_strategy') {
      list.sort((a, b) => (a.planStrategy || '').localeCompare(b.planStrategy || ''));
    } else if (reportId === 'report_by_year') {
      if (selectedYear !== 'ทั้งหมด') {
        list = list.filter((p) => p.year === selectedYear);
      }
    } else if (reportId === 'report_village_summary' || reportId === 'report_village') {
      list = list.filter((p) => Boolean(p.village));
    } else if (reportId === 'report_quarterly') {
      list = list.filter((p) => Boolean(p.executionStatus));
    } else if (reportId === 'report_filtered') {
      list = filteredProjects;
    }

    if (modalSearchKeyword.trim()) {
      const kw = modalSearchKeyword.toLowerCase();
      list = list.filter((p) => {
        return (
          p.name.toLowerCase().includes(kw) ||
          (p.code || '').toLowerCase().includes(kw) ||
          (p.village || '').toLowerCase().includes(kw) ||
          (p.department || '').toLowerCase().includes(kw)
        );
      });
    }

    return list;
  }, [activeReportModal, projects, filteredProjects, selectedYear, modalSearchKeyword]);

  // Export to CSV
  const handleExportCSV = (reportName: string = 'รายงานแผนพัฒนาท้องถิ่น') => {
    const listToExport = filteredProjects.length > 0 ? filteredProjects : projects;
    const headers = [
      'ลำดับ',
      'รหัสโครงการ',
      'ชื่อโครงการ',
      'ประเด็นการพัฒนา',
      'แผนงาน',
      'งบประมาณตามแผน (บาท)',
      'งบประมาณที่อนุมัติ (บาท)',
      'สถานะ',
      'หน่วยงานรับผิดชอบ',
      'หมู่บ้าน/พื้นที่'
    ];

    const rows = listToExport.map((p, idx) => [
      idx + 1,
      `"${getProjectDisplayId(p, p.orderNumber || idx + 1)}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.planStrategy}"`,
      `"${p.planCategory || '-'}"`,
      p.budgetPlan || 0,
      p.budgetApproved || 0,
      `"${p.status === 'approved' ? 'อนุมัติแล้ว' : 'รออนุมัติ'}"`,
      `"${p.department}"`,
      `"${p.village || '-'}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${reportName}_เทศบาลเมืองศิลา.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-[#f8fafc] text-slate-800 antialiased font-['Prompt',sans-serif]">
      
      {/* ========================================================================= */}
      {/* 1. Header Bar: Breadcrumb + Notifications + User Capsule */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-4 sm:px-6 py-2.5 flex items-center justify-between shadow-2xs">
        {/* Left: Breadcrumb */}
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 font-medium">
          <button
            onClick={() => onNavigateToMenu?.('dashboard')}
            className="flex items-center gap-1.5 hover:text-blue-600 transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4 text-blue-600" />
            <span>หน้าหลัก</span>
          </button>
          <span>&gt;</span>
          <span className="text-slate-900 font-bold">รายงาน</span>
        </div>

        {/* Right: Notifications & User Profile */}
        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
              title="การแจ้งเตือน"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                3
              </span>
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-3 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-1.5 font-bold text-sm text-slate-900">
                    <Bell className="w-4 h-4 text-blue-600" />
                    <span>การแจ้งเตือนรายงานล่าสุด</span>
                  </div>
                  <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="divide-y divide-slate-100 text-xs mt-1">
                  <div className="py-2.5 hover:bg-slate-50 px-2 rounded-lg cursor-pointer">
                    <div className="font-bold text-slate-900">📊 อัปเดตรายงานงบประมาณประจำปี 2570</div>
                    <div className="text-slate-500 text-[11px] mt-0.5">กองคลังส่งรายงานสรุปยอดการจัดสรรและเบิกจ่าย</div>
                    <div className="text-[10px] text-blue-600 font-semibold mt-1">28 ก.ย. 2569</div>
                  </div>
                  <div className="py-2.5 hover:bg-slate-50 px-2 rounded-lg cursor-pointer">
                    <div className="font-bold text-slate-900">📑 รายงาน ผ.02 ทั้ง 4 ฉบับ สมบูรณ์แล้ว</div>
                    <div className="text-slate-500 text-[11px] mt-0.5">กองยุทธศาสตร์รวบรวมเล่มแผนพัฒนา 5 ปีเรียบร้อย</div>
                    <div className="text-[10px] text-blue-600 font-semibold mt-1">27 ก.ย. 2569</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Capsule */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2.5 py-1 px-2.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
            >
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs ring-2 ring-blue-100">
                {currentUser?.fullName ? currentUser.fullName.charAt(0) : 'ก'}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  {currentUser?.fullName || 'นางสาวกมลวรรณ แซ่ดี'}
                </div>
                <div className="text-[11px] text-slate-500 leading-tight">
                  {currentUser?.role === 'public'
                    ? 'ประชาชน (Public)'
                    : currentUser?.role === 'admin'
                    ? 'ผู้ดูแลระบบ (Admin)'
                    : currentUser?.role === 'executive'
                    ? 'ผู้บริหาร'
                    : 'เจ้าหน้าที่ (Staff)'}
                </div>
              </div>
              <span className="text-xs text-slate-400">▾</span>
            </button>
          </div>
        </div>
      </header>

      {/* Official Governmental Header for Browser Printing */}
      <div className="hidden print:block p-6 text-center border-b border-slate-300 mb-4 bg-white">
        <div className="flex items-center justify-center gap-4 mb-2">
          <img src="/sila-logo.png" alt="ตราเทศบาลเมืองศิลา" className="w-16 h-16 object-contain" />
          <div className="text-center">
            <h1 className="text-xl font-bold text-slate-900 leading-tight">เทศบาลเมืองศิลา อำเภอเมืองขอนแก่น จังหวัดขอนแก่น</h1>
            <p className="text-sm font-semibold text-slate-700">ระบบรายงานสรุปข้อมูลแผนพัฒนาท้องถิ่น (พ.ศ. 2571 - 2575)</p>
          </div>
        </div>
        <p className="text-xs text-slate-500">ข้อมูลสรุป ณ วันที่ {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* ========================================================================= */}
      {/* 2. Main Content Container */}
      {/* ========================================================================= */}
      <div className="p-4 sm:p-6 lg:p-7 max-w-[1720px] w-full mx-auto space-y-6">
        
        {/* Page Title with Blue BarChart Icon & Tab Switcher */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-4 no-print">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-sm shadow-blue-500/20 shrink-0">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  ระบบรายงาน
                </h1>
                <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-700 border border-blue-200">
                  e-Report System
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
                สรุปข้อมูล แผนพัฒนาท้องถิ่น โครงการ งบประมาณ และผลการดำเนินงาน เทศบาลเมืองศิลา
              </p>
            </div>
          </div>

          {/* Interactive Navigation Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 self-start md:self-auto shrink-0">
            <button
              type="button"
              id="tab-report-dashboard"
              onClick={() => setActiveTab('dashboard')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'dashboard'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📊 แดชบอร์ดสรุปสถิติ
            </button>
            <button
              type="button"
              id="tab-report-table"
              onClick={() => setActiveTab('table')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'table'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📑 ตารางข้อมูลโครงการ ({filteredProjects.length})
            </button>
            <button
              type="button"
              id="tab-report-plan-link"
              onClick={() => onNavigateToMenu?.('report_plan')}
              className="px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 cursor-pointer whitespace-nowrap flex items-center gap-1"
            >
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              <span>รายงานแผนฯ (ผ.01 - ผ.02)</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. Top 5 KPI Stat Cards in 1 Row (Exact visual from image.png) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5">
          
          {/* Card 1: รายงาน ผ.02 */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs hover:border-blue-300 transition-all flex flex-col justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-2xs shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-600">รายงาน ผ.02</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black font-mono text-slate-900 leading-none">
                {stats.editionsCount} <span className="text-xs font-normal text-slate-500">ฉบับ</span>
              </div>
              <button
                type="button"
                onClick={() =>
                  setActiveReportModal({
                    id: 'report_plan_all',
                    title: 'รายงาน ผ.02 แผนพัฒนาท้องถิ่น',
                    description: 'รายงานแผนพัฒนาท้องถิ่น (พ.ศ. 2571 - 2575) ทั้ง 4 ฉบับ'
                  })
                }
                className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>ดูรายงาน</span>
                <span>→</span>
              </button>
            </div>
          </div>

          {/* Card 2: งบประมาณรวม */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs hover:border-emerald-300 transition-all flex flex-col justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-2xs shrink-0">
                <Coins className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-600">งบประมาณรวม</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black font-mono text-slate-900 leading-none">
                {stats.totalBudget.toLocaleString()} <span className="text-xs font-normal text-slate-500">บาท</span>
              </div>
              <button
                type="button"
                onClick={() =>
                  setActiveReportModal({
                    id: 'report_budget',
                    title: 'รายงานงบประมาณรวม',
                    description: 'สรุปงบประมาณตามแผน การตั้งงบประมาณ และการเบิกจ่าย'
                  })
                }
                className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>ดูรายละเอียด</span>
                <span>→</span>
              </button>
            </div>
          </div>

          {/* Card 3: โครงการทั้งหมด */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs hover:border-amber-300 transition-all flex flex-col justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-2xs shrink-0">
                <Briefcase className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-600">โครงการทั้งหมด</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black font-mono text-slate-900 leading-none">
                {stats.totalProjectsCount} <span className="text-xs font-normal text-slate-500">โครงการ</span>
              </div>
              <button
                type="button"
                onClick={() =>
                  setActiveReportModal({
                    id: 'report_all_projects',
                    title: 'รายงานโครงการทั้งหมดตามแผนพัฒนาท้องถิ่น',
                    description: 'รวบรวมโครงการพัฒนาท้องถิ่นทุกยุทธศาสตร์และแผนงาน'
                  })
                }
                className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>ดูรายละเอียด</span>
                <span>→</span>
              </button>
            </div>
          </div>

          {/* Card 4: โครงการดำเนินการ */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs hover:border-purple-300 transition-all flex flex-col justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-2xs shrink-0">
                <Activity className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-600">โครงการดำเนินการ</span>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black font-mono text-slate-900 leading-none">
                  {stats.inProgressProjectsCount}
                </span>
                <span className="text-xs font-normal text-slate-500">โครงการ</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">{stats.inProgressPct}%</div>
              <button
                type="button"
                onClick={() =>
                  setActiveReportModal({
                    id: 'report_in_progress',
                    title: 'รายงานโครงการที่อยู่ระหว่างดำเนินการ',
                    description: 'สถานะการดำเนินงานของโครงการที่ได้รับการจัดสรรงบประมาณ'
                  })
                }
                className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>ดูรายละเอียด</span>
                <span>→</span>
              </button>
            </div>
          </div>

          {/* Card 5: โครงการแล้วเสร็จ */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs hover:border-teal-300 transition-all flex flex-col justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-2xs shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-600">โครงการแล้วเสร็จ</span>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black font-mono text-slate-900 leading-none">
                  {stats.completedProjectsCount}
                </span>
                <span className="text-xs font-normal text-slate-500">โครงการ</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">{stats.completedPct}%</div>
              <button
                type="button"
                onClick={() =>
                  setActiveReportModal({
                    id: 'report_completed',
                    title: 'รายงานโครงการที่ดำเนินการแล้วเสร็จ',
                    description: 'สรุปผลสำเร็จโครงการที่ได้ดำเนินการและส่งมอบงานเรียบร้อย'
                  })
                }
                className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>ดูรายละเอียด</span>
                <span>→</span>
              </button>
            </div>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* 4. Filter & Search Toolbar (White card with 4 dropdowns + Search Input + Button) */}
        {/* ========================================================================= */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            
            {/* ปีงบประมาณ */}
            <div className="sm:col-span-2">
              <div className="text-[11px] font-semibold text-slate-500 mb-1">ปีงบประมาณ</div>
              <div className="relative">
                <select
                  id="select-report-year"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full pl-2.5 pr-6 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 cursor-pointer appearance-none font-medium"
                >
                  <option value="2570">พ.ศ. 2570</option>
                  <option value="2568">พ.ศ. 2568</option>
                  <option value="2569">พ.ศ. 2569</option>
                  <option value="2571">พ.ศ. 2571</option>
                  <option value="2572">พ.ศ. 2572</option>
                  <option value="2573">พ.ศ. 2573</option>
                  <option value="2574">พ.ศ. 2574</option>
                  <option value="2575">พ.ศ. 2575</option>
                  <option value="ทั้งหมด">-- ทุกปีงบประมาณ --</option>
                </select>
                <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* ประเภทแผน */}
            <div className="sm:col-span-2">
              <div className="text-[11px] font-semibold text-slate-500 mb-1">ประเภทแผน</div>
              <select
                id="select-report-plan-type"
                value={selectedPlanType}
                onChange={(e) => setSelectedPlanType(e.target.value)}
                className="w-full py-1.5 px-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 cursor-pointer font-medium"
              >
                <option value="ทุกประเภท">ทุกประเภท</option>
                <option value="ฉบับแรก">ฉบับแรก</option>
                <option value="ฉบับเพิ่มเติม">ฉบับเพิ่มเติม</option>
                <option value="ฉบับเปลี่ยนแปลง">ฉบับเปลี่ยนแปลง</option>
                <option value="ฉบับแก้ไข">ฉบับแก้ไข</option>
              </select>
            </div>

            {/* ยุทธศาสตร์ */}
            <div className="sm:col-span-2">
              <div className="text-[11px] font-semibold text-slate-500 mb-1">ยุทธศาสตร์</div>
              <select
                id="select-report-strategy"
                value={selectedStrategy}
                onChange={(e) => setSelectedStrategy(e.target.value)}
                className="w-full py-1.5 px-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 cursor-pointer truncate font-medium"
              >
                <option value="ทุกยุทธศาสตร์">ทุกยุทธศาสตร์</option>
                <option value="ยุทธศาสตร์ที่ 1">ยุทธศาสตร์ที่ 1 โครงสร้างพื้นฐาน</option>
                <option value="ยุทธศาสตร์ที่ 2">ยุทธศาสตร์ที่ 2 เศรษฐกิจ</option>
                <option value="ยุทธศาสตร์ที่ 3">ยุทธศาสตร์ที่ 3 สังคมและคุณภาพชีวิต</option>
                <option value="ยุทธศาสตร์ที่ 4">ยุทธศาสตร์ที่ 4 สิ่งแวดล้อม</option>
                <option value="ยุทธศาสตร์ที่ 5">ยุทธศาสตร์ที่ 5 บริหารจัดการ</option>
              </select>
            </div>

            {/* สถานะโครงการ */}
            <div className="sm:col-span-2">
              <div className="text-[11px] font-semibold text-slate-500 mb-1">สถานะโครงการ</div>
              <select
                id="select-report-status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full py-1.5 px-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 cursor-pointer font-medium"
              >
                <option value="ทั้งหมด">ทั้งหมด</option>
                <option value="ดำเนินการ">ดำเนินการ</option>
                <option value="แล้วเสร็จ">แล้วเสร็จ</option>
                <option value="รออนุมัติ">รออนุมัติ</option>
              </select>
            </div>

            {/* ค้นหา Text Input */}
            <div className="sm:col-span-3 pt-3 sm:pt-4">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="input-report-search"
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="ค้นหา ชื่อโครงการ, ชื่อหมู่บ้าน..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
                />
              </div>
            </div>

            {/* Blue Search Button */}
            <div className="sm:col-span-1 pt-3 sm:pt-4">
              <button
                type="button"
                onClick={() => {
                  setActiveReportModal({
                    id: 'report_filtered',
                    title: `ผลการสืบค้นรายงาน (ปี พ.ศ. ${selectedYear})`,
                    description: `พบโครงการที่ตรงตามเงื่อนไข ${filteredProjects.length} โครงการ`
                  });
                }}
                className="w-full inline-flex items-center justify-center gap-1 py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>ค้นหา</span>
              </button>
            </div>

          </div>
        </div>

        {/* ========================================================================= */}
        {/* 5. Main Content: Dashboard Mode OR Detailed Table Mode */}
        {/* ========================================================================= */}
        {activeTab === 'dashboard' ? (
          /* DASHBOARD VIEW: Left (Reports & Analytics) | Right (Quick Reports & Exports) */
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          
          {/* LEFT 8/12: รายงานที่ใช้งานบ่อย (6 cards) + 3 Analytics Cards */}
          <div className="xl:col-span-8 space-y-6">
            
            {/* Section: รายงานที่ใช้งานบ่อย */}
            <div className="space-y-3">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                รายงานที่ใช้งานบ่อย
              </h2>

              {/* 6 Grid Cards (3 cols x 2 rows) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                
                {/* 1. รายงาน ผ.02 */}
                <div
                  onClick={() =>
                    setActiveReportModal({
                      id: 'report_plan_all',
                      title: 'รายงาน ผ.02',
                      description: 'รายงานแผนพัฒนาท้องถิ่น (พ.ศ. 2571 - 2575) ทั้ง 4 ฉบับ'
                    })
                  }
                  className="bg-white border border-slate-200 hover:border-blue-300 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-2xs">
                      <FileText className="w-4 h-4" />
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <div className="mt-3">
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      รายงาน ผ.02
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                      รายงานแผนพัฒนาท้องถิ่น (พ.ศ. 2571 - 2575) ทั้ง 4 ฉบับ
                    </p>
                  </div>
                </div>

                {/* 2. รายงานงบประมาณ */}
                <div
                  onClick={() =>
                    setActiveReportModal({
                      id: 'report_budget',
                      title: 'รายงานงบประมาณ',
                      description: 'สรุปงบประมาณตามแผน / การตั้งงบ / การเบิกจ่าย'
                    })
                  }
                  className="bg-white border border-slate-200 hover:border-emerald-300 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-2xs">
                      <Coins className="w-4 h-4" />
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <div className="mt-3">
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                      รายงานงบประมาณ
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                      สรุปงบประมาณตามแผน / การตั้งงบ / การเบิกจ่าย
                    </p>
                  </div>
                </div>

                {/* 3. รายงานความก้าวหน้าโครงการ */}
                <div
                  onClick={() =>
                    setActiveReportModal({
                      id: 'report_progress',
                      title: 'รายงานความก้าวหน้าโครงการ',
                      description: 'สถานะการดำเนินงานของโครงการ'
                    })
                  }
                  className="bg-white border border-slate-200 hover:border-purple-300 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-2xs">
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <div className="mt-3">
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                      รายงานความก้าวหน้าโครงการ
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                      สถานะการดำเนินงานของโครงการ
                    </p>
                  </div>
                </div>

                {/* 4. รายงานสรุปผลการดำเนินงาน */}
                <div
                  onClick={() =>
                    setActiveReportModal({
                      id: 'report_performance',
                      title: 'รายงานสรุปผลการดำเนินงาน',
                      description: 'ผลการดำเนินงานตามยุทธศาสตร์ / ตัวชี้วัด'
                    })
                  }
                  className="bg-white border border-slate-200 hover:border-rose-300 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-2xs">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-rose-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <div className="mt-3">
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-rose-600 transition-colors">
                      รายงานสรุปผลการดำเนินงาน
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                      ผลการดำเนินงานตามยุทธศาสตร์ / ตัวชี้วัด
                    </p>
                  </div>
                </div>

                {/* 5. รายงานแผนรายหมู่บ้าน */}
                <div
                  onClick={() =>
                    setActiveReportModal({
                      id: 'report_village',
                      title: 'รายงานแผนรายหมู่บ้าน',
                      description: 'สรุปโครงการระดับหมู่บ้าน'
                    })
                  }
                  className="bg-white border border-slate-200 hover:border-cyan-300 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-full bg-cyan-600 text-white flex items-center justify-center shadow-2xs">
                      <Home className="w-4 h-4" />
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-cyan-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <div className="mt-3">
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-cyan-600 transition-colors">
                      รายงานแผนรายหมู่บ้าน
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                      สรุปโครงการระดับหมู่บ้าน
                    </p>
                  </div>
                </div>

                {/* 6. รายงานสำหรับประชาชน */}
                <div
                  onClick={() =>
                    setActiveReportModal({
                      id: 'report_public',
                      title: 'รายงานสำหรับประชาชน',
                      description: 'ข้อมูลโครงการและการใช้งบประมาณสำหรับเผยแพร่สู่สาธารณะ'
                    })
                  }
                  className="bg-white border border-slate-200 hover:border-amber-300 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-2xs">
                      <Users className="w-4 h-4" />
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <div className="mt-3">
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                      รายงานสำหรับประชาชน
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                      ข้อมูลโครงการและการใช้งบประมาณสำหรับเผยแพร่สู่สาธารณะ
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* Section: 3 Bottom Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              
              {/* Card 1: สรุปงบประมาณตามยุทธศาสตร์ (SVG Donut Chart) */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
                <div className="font-bold text-xs sm:text-sm text-slate-800 border-b border-slate-100 pb-2">
                  สรุปงบประมาณตามยุทธศาสตร์
                </div>

                <div className="flex items-center gap-3 my-3">
                  {/* SVG Donut Chart */}
                  <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="36" stroke="#f1f5f9" strokeWidth="12" fill="none" />
                      {(() => {
                        const c = 2 * Math.PI * 36;
                        let offset = 0;
                        return strategyBreakdown.list.map((item, idx) => {
                          const strokeLen = (item.percentage / 100) * c;
                          const currentOffset = offset;
                          offset += strokeLen;
                          return (
                            <circle
                              key={idx}
                              cx="50"
                              cy="50"
                              r="36"
                              stroke={item.color}
                              strokeWidth="12"
                              fill="none"
                              strokeDasharray={`${strokeLen} ${c - strokeLen}`}
                              strokeDashoffset={-currentOffset}
                            />
                          );
                        });
                      })()}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-1">
                      <span className="text-xs font-black font-mono text-slate-900 leading-tight">
                        {strategyBreakdown.totalMillions}
                      </span>
                      <span className="text-[10px] text-slate-400">ล้านบาท</span>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="space-y-1.5 text-[11px] flex-1">
                    {strategyBreakdown.list.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-slate-600">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                          <span className="truncate">ยุทธศาสตร์ที่ {idx + 1}</span>
                        </div>
                        <span className="font-mono text-[10px] text-slate-500 shrink-0">
                          {(item.amount / 1000000).toFixed(2)} ลบ. ({item.percentage}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card 2: จำนวนโครงการตามสถานะ (Bar Chart) */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
                <div className="font-bold text-xs sm:text-sm text-slate-800 border-b border-slate-100 pb-2">
                  จำนวนโครงการตามสถานะ
                </div>

                <div className="my-3 flex-1 flex flex-col justify-end">
                  <div className="flex items-end justify-between h-28 pt-2 pb-1 border-b border-slate-200 px-3 gap-2">
                    {/* Bar 1: ดำเนินการ */}
                    <div className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                      <span className="text-[11px] font-mono font-bold text-emerald-800">{stats.inProgressProjectsCount}</span>
                      <div
                        className="w-full max-w-[32px] bg-emerald-600 rounded-t-md transition-all"
                        style={{ height: `${Math.max(12, Math.min(95, (stats.inProgressProjectsCount / (stats.totalProjectsCount || 1)) * 100))}%` }}
                      />
                    </div>
                    {/* Bar 2: แล้วเสร็จ */}
                    <div className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                      <span className="text-[11px] font-mono font-bold text-amber-700">{stats.completedProjectsCount}</span>
                      <div
                        className="w-full max-w-[32px] bg-amber-500 rounded-t-md transition-all"
                        style={{ height: `${Math.max(10, Math.min(95, (stats.completedProjectsCount / (stats.totalProjectsCount || 1)) * 100))}%` }}
                      />
                    </div>
                    {/* Bar 3: รออนุมัติ */}
                    <div className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                      <span className="text-[11px] font-mono font-bold text-blue-700">{stats.pendingProjectsCount}</span>
                      <div
                        className="w-full max-w-[32px] bg-blue-500 rounded-t-md transition-all"
                        style={{ height: `${Math.max(8, Math.min(95, (stats.pendingProjectsCount / (stats.totalProjectsCount || 1)) * 100))}%` }}
                      />
                    </div>
                    {/* Bar 4: ยกเลิก (0) */}
                    <div className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                      <span className="text-[11px] font-mono font-bold text-slate-400">0</span>
                      <div className="w-full max-w-[32px] bg-rose-400 rounded-t-md transition-all h-[4px]" />
                    </div>
                  </div>

                  {/* Labels under bars */}
                  <div className="flex items-center justify-between text-[10px] text-slate-600 pt-1 text-center font-medium">
                    <span className="flex-1 truncate">ดำเนินการ</span>
                    <span className="flex-1 truncate">แล้วเสร็จ</span>
                    <span className="flex-1 truncate">รออนุมัติ</span>
                    <span className="flex-1 truncate">ยกเลิก</span>
                  </div>
                </div>
              </div>

              {/* Card 3: รายงานสรุปล่าสุด (Table) */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-bold text-xs sm:text-sm text-slate-800">รายงานสรุปล่าสุด</span>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveReportModal({
                        id: 'report_recent_all',
                        title: 'รายงานสรุปทั้งหมด',
                        description: 'รายการรายงานสรุปผลการจัดทำและติดตามแผนพัฒนาท้องถิ่น'
                      })
                    }
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>ดูทั้งหมด</span>
                    <span>→</span>
                  </button>
                </div>

                <div className="my-2 divide-y divide-slate-100 text-xs">
                  <div className="grid grid-cols-12 py-1 text-[11px] font-semibold text-slate-400">
                    <span className="col-span-4">วันที่</span>
                    <span className="col-span-5">รายการ</span>
                    <span className="col-span-3 text-right">ผู้จัดทำ</span>
                  </div>
                  <div className="grid grid-cols-12 py-1.5 items-center hover:bg-slate-50 px-0.5 rounded cursor-pointer">
                    <span className="col-span-4 font-mono text-slate-500 text-[11px]">28 ก.ย. 2569</span>
                    <span className="col-span-5 font-semibold text-slate-800 truncate">รายงานงบประมาณ</span>
                    <span className="col-span-3 text-right text-slate-500 text-[11px] truncate">กองคลัง</span>
                  </div>
                  <div className="grid grid-cols-12 py-1.5 items-center hover:bg-slate-50 px-0.5 rounded cursor-pointer">
                    <span className="col-span-4 font-mono text-slate-500 text-[11px]">27 ก.ย. 2569</span>
                    <span className="col-span-5 font-semibold text-slate-800 truncate">รายงาน ผ.02</span>
                    <span className="col-span-3 text-right text-slate-500 text-[11px] truncate">กองยุทธศาสตร์</span>
                  </div>
                  <div className="grid grid-cols-12 py-1.5 items-center hover:bg-slate-50 px-0.5 rounded cursor-pointer">
                    <span className="col-span-4 font-mono text-slate-500 text-[11px]">26 ก.ย. 2569</span>
                    <span className="col-span-5 font-semibold text-slate-800 truncate">รายงานความก้าวหน้าโครงการ</span>
                    <span className="col-span-3 text-right text-slate-500 text-[11px] truncate">กองช่าง</span>
                  </div>
                  <div className="grid grid-cols-12 py-1.5 items-center hover:bg-slate-50 px-0.5 rounded cursor-pointer">
                    <span className="col-span-4 font-mono text-slate-500 text-[11px]">25 ก.ย. 2569</span>
                    <span className="col-span-5 font-semibold text-slate-800 truncate">รายงานสรุปผลการดำเนินงาน</span>
                    <span className="col-span-3 text-right text-slate-500 text-[11px] truncate">กองยุทธศาสตร์</span>
                  </div>
                  <div className="grid grid-cols-12 py-1.5 items-center hover:bg-slate-50 px-0.5 rounded cursor-pointer">
                    <span className="col-span-4 font-mono text-slate-500 text-[11px]">24 ก.ย. 2569</span>
                    <span className="col-span-5 font-semibold text-slate-800 truncate">รายงานแผนรายหมู่บ้าน</span>
                    <span className="col-span-3 text-right text-slate-500 text-[11px] truncate">กองสวัสดิการฯ</span>
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* RIGHT 4/12: รายงานด่วน + ส่งออกข้อมูล (Right Action Column) */}
          <div className="xl:col-span-4 space-y-4">
            
            {/* Box 1: รายงานด่วน */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
              <h3 className="text-sm font-bold text-slate-900 mb-3">รายงานด่วน</h3>
              <div className="space-y-1.5">
                
                {/* 1. รายชื่อโครงการตามยุทธศาสตร์ */}
                <button
                  type="button"
                  onClick={() =>
                    setActiveReportModal({
                      id: 'report_by_strategy',
                      title: 'รายชื่อโครงการตามยุทธศาสตร์',
                      description: 'สรุปรายการโครงการจำแนกตาม 5 ยุทธศาสตร์การพัฒนา'
                    })
                  }
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-blue-300 hover:bg-blue-50/50 transition-all text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">📗</span>
                    <span className="text-xs sm:text-sm font-semibold text-slate-800">
                      รายชื่อโครงการตามยุทธศาสตร์
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                </button>

                {/* 2. งบประมาณรายปี */}
                <button
                  type="button"
                  onClick={() =>
                    setActiveReportModal({
                      id: 'report_by_year',
                      title: 'งบประมาณรายปี',
                      description: 'สรุปวงเงินงบประมาณรายจ่ายจำแนกตามปี พ.ศ. 2571 - 2575'
                    })
                  }
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">💰</span>
                    <span className="text-xs sm:text-sm font-semibold text-slate-800">
                      งบประมาณรายปี
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                </button>

                {/* 3. สรุปจำนวนโครงการรายหมู่บ้าน */}
                <button
                  type="button"
                  onClick={() =>
                    setActiveReportModal({
                      id: 'report_village_summary',
                      title: 'สรุปจำนวนโครงการรายหมู่บ้าน',
                      description: 'การกระจายตัวของโครงการพัฒนาทั้ง 28 หมู่บ้านในเขตเทศบาลเมืองศิลา'
                    })
                  }
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-cyan-300 hover:bg-cyan-50/50 transition-all text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">🏠</span>
                    <span className="text-xs sm:text-sm font-semibold text-slate-800">
                      สรุปจำนวนโครงการรายหมู่บ้าน
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-600 transition-colors" />
                </button>

                {/* 4. โครงการที่ยังไม่ได้ตั้งงบประมาณ */}
                <button
                  type="button"
                  onClick={() =>
                    setActiveReportModal({
                      id: 'report_pending_budget',
                      title: 'โครงการที่ยังไม่ได้ตั้งงบประมาณ',
                      description: 'โครงการตามแผนพัฒนาท้องถิ่นที่อยู่ระหว่างรอการจัดสรรงบประมาณ'
                    })
                  }
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-rose-300 hover:bg-rose-50/50 transition-all text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">📕</span>
                    <span className="text-xs sm:text-sm font-semibold text-slate-800">
                      โครงการที่ยังไม่ได้ตั้งงบประมาณ
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600 transition-colors" />
                </button>

                {/* 5. โครงการที่รออนุมัติ */}
                <button
                  type="button"
                  onClick={() =>
                    setActiveReportModal({
                      id: 'report_waiting_approval',
                      title: 'โครงการที่รออนุมัติ',
                      description: 'โครงการที่รอเสนอขอความเห็นชอบจากสภาเทศบาล'
                    })
                  }
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-amber-300 hover:bg-amber-50/50 transition-all text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">📙</span>
                    <span className="text-xs sm:text-sm font-semibold text-slate-800">
                      โครงการที่รออนุมัติ
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-colors" />
                </button>

                {/* 6. โครงการที่อนุมัติแล้ว */}
                <button
                  type="button"
                  onClick={() =>
                    setActiveReportModal({
                      id: 'report_approved_all',
                      title: 'โครงการที่อนุมัติแล้ว',
                      description: 'โครงการที่สภาเทศบาลมีมติอนุมัติและตั้งงบประมาณเรียบร้อยแล้ว'
                    })
                  }
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">📗</span>
                    <span className="text-xs sm:text-sm font-semibold text-slate-800">
                      โครงการที่อนุมัติแล้ว
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                </button>

                {/* 7. รายงานผลการดำเนินงานรายไตรมาส */}
                <button
                  type="button"
                  onClick={() =>
                    setActiveReportModal({
                      id: 'report_quarterly',
                      title: 'รายงานผลการดำเนินงานรายไตรมาส',
                      description: 'สรุปการเบิกจ่ายและความก้าวหน้าจำแนกตามไตรมาส 1 - 4'
                    })
                  }
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-purple-300 hover:bg-purple-50/50 transition-all text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">📋</span>
                    <span className="text-xs sm:text-sm font-semibold text-slate-800">
                      รายงานผลการดำเนินงานรายไตรมาส
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition-colors" />
                </button>

              </div>
            </div>

            {/* Box 2: ส่งออกข้อมูล (Export Data Buttons matching image.png) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-2.5">
              <h3 className="text-sm font-bold text-slate-900">ส่งออกข้อมูล</h3>
              
              {/* Green Button: ดาวน์โหลด Excel */}
              <button
                type="button"
                id="btn-report-download-excel"
                onClick={() => handleExportCSV('รายงานสรุปแผนพัฒนาท้องถิ่น')}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>ดาวน์โหลด Excel</span>
              </button>

              {/* Blue Button: ดาวน์โหลด PDF */}
              <button
                type="button"
                id="btn-report-download-pdf"
                onClick={handlePrint}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>ดาวน์โหลด PDF</span>
              </button>

              {/* White Button: พิมพ์รายงาน */}
              <button
                type="button"
                id="btn-report-print"
                onClick={handlePrint}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-xs sm:text-sm shadow-2xs transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4 text-slate-500" />
                <span>พิมพ์รายงาน</span>
              </button>
            </div>

          </div>

        </div>
        ) : (
          /* ========================================================================= */
          /* DETAILED PROJECT DATA TABLE VIEW (Full Grid Mode) */
          /* ========================================================================= */
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden space-y-4 p-4 sm:p-6">
            {/* Table Header Summary & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>ตารางแสดงข้อมูลโครงการตามเงื่อนไขตัวกรอง</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    {filteredProjects.length} โครงการ
                  </span>
                </h2>
                <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                  <span>
                    งบประมาณตามแผนรวม:{' '}
                    <strong className="font-mono text-slate-900">
                      {filteredProjects.reduce((s, p) => s + (p.budgetPlan || 0), 0).toLocaleString()}
                    </strong>{' '}
                    บาท
                  </span>
                  <span>
                    งบอนุมัติรวม:{' '}
                    <strong className="font-mono text-emerald-700">
                      {filteredProjects.reduce((s, p) => s + (p.budgetApproved || 0), 0).toLocaleString()}
                    </strong>{' '}
                    บาท
                  </span>
                  <span>
                    งบคงเหลือตามแผน:{' '}
                    <strong className="font-mono text-blue-700">
                      {filteredProjects
                        .reduce((s, p) => s + Math.max(0, (p.budgetPlan || 0) - (p.budgetApproved || 0)), 0)
                        .toLocaleString()}
                    </strong>{' '}
                    บาท
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleExportCSV(`รายงานโครงการ_${selectedYear}`)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>ส่งออก Excel (.CSV)</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  <span>พิมพ์ตาราง</span>
                </button>
              </div>
            </div>

            {/* Responsive Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                    <th className="py-3 px-3 font-bold text-center w-12">ลำดับ</th>
                    <th className="py-3 px-3 font-bold w-28">รหัสโครงการ</th>
                    <th className="py-3 px-3 font-bold min-w-[240px]">ชื่อโครงการ / แผนงาน</th>
                    <th className="py-3 px-3 font-bold min-w-[160px]">ประเด็นยุทธศาสตร์</th>
                    <th className="py-3 px-3 font-bold min-w-[130px]">หน่วยงาน</th>
                    <th className="py-3 px-3 font-bold min-w-[120px]">พื้นที่ / หมู่บ้าน</th>
                    <th className="py-3 px-3 font-bold text-right min-w-[120px]">งบตามแผน (บาท)</th>
                    <th className="py-3 px-3 font-bold text-right min-w-[120px]">งบอนุมัติ (บาท)</th>
                    <th className="py-3 px-3 font-bold text-center w-24">สถานะ</th>
                    <th className="py-3 px-3 font-bold text-center w-20">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProjects.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400">
                        ไม่พบข้อมูลโครงการที่ตรงกับเงื่อนไขการค้นหา
                      </td>
                    </tr>
                  ) : (
                    filteredProjects.slice((tablePage - 1) * 25, tablePage * 25).map((p, idx) => {
                      const actualIdx = (tablePage - 1) * 25 + idx + 1;
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 px-3 font-mono text-center text-slate-500">{actualIdx}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-700">
                            {getProjectDisplayId(p, p.orderNumber || actualIdx)}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900 leading-snug">{p.name}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">{p.planCategory || '-'}</div>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 leading-snug">{p.planStrategy}</td>
                          <td className="py-2.5 px-3 text-slate-700 font-medium">{p.department}</td>
                          <td className="py-2.5 px-3 text-slate-600">{p.village || '-'}</td>
                          <td className="py-2.5 px-3 font-mono text-right text-slate-900 font-medium">
                            {p.budgetPlan ? p.budgetPlan.toLocaleString() : '0'}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-right font-bold text-emerald-700">
                            {p.budgetApproved ? p.budgetApproved.toLocaleString() : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                p.status === 'approved'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              {p.status === 'approved' ? 'อนุมัติแล้ว' : 'รออนุมัติ'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => onOpenProjectDetail?.(p)}
                              className="text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer"
                            >
                              ดูรายละเอียด
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {/* Table Footer Totals */}
                {filteredProjects.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-100/90 font-bold text-slate-900 border-t-2 border-slate-300">
                      <td colSpan={6} className="py-3 px-3 text-right">
                        รวมทั้งสิ้น ({filteredProjects.length} โครงการ):
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {filteredProjects.reduce((s, p) => s + (p.budgetPlan || 0), 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-800">
                        {filteredProjects.reduce((s, p) => s + (p.budgetApproved || 0), 0).toLocaleString()}
                      </td>
                      <td colSpan={2} className="py-3 px-3 text-center text-slate-500 font-normal">
                        -
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {/* Pagination Controls */}
            {filteredProjects.length > 25 && (
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-600">
                <div>
                  แสดง {(tablePage - 1) * 25 + 1} - {Math.min(tablePage * 25, filteredProjects.length)} จาก{' '}
                  {filteredProjects.length} รายการ
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={tablePage === 1}
                    onClick={() => setTablePage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                  >
                    ก่อนหน้า
                  </button>
                  <span className="px-2 font-mono font-bold text-slate-800">
                    {tablePage} / {Math.ceil(filteredProjects.length / 25)}
                  </span>
                  <button
                    type="button"
                    disabled={tablePage >= Math.ceil(filteredProjects.length / 25)}
                    onClick={() => setTablePage((p) => p + 1)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                  >
                    ถัดไป
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* 6. Interactive Drill-Down Report Viewer Modal */}
      {/* ========================================================================= */}
      {activeReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden my-auto animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    {activeReportModal.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {activeReportModal.description} • เทศบาลเมืองศิลา
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveReportModal(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Toolbar & Stats */}
            <div className="px-6 py-3 border-b border-slate-100 bg-white flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-slate-700">จำนวนโครงการ:</span>
                <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  {modalProjects.length} โครงการ
                </span>
                <span className="font-semibold text-slate-700 ml-2">งบตามแผน:</span>
                <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-full">
                  {modalProjects.reduce((sum, p) => sum + (p.budgetPlan || 0), 0).toLocaleString()} บาท
                </span>
                <span className="font-semibold text-slate-700 ml-2">งบอนุมัติ:</span>
                <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {modalProjects.reduce((sum, p) => sum + (p.budgetApproved || 0), 0).toLocaleString()} บาท
                </span>
              </div>

              {/* In-modal Search & Action Buttons */}
              <div className="flex items-center gap-2">
                <div className="relative w-48 sm:w-56">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={modalSearchKeyword}
                    onChange={(e) => setModalSearchKeyword(e.target.value)}
                    placeholder="ค้นหาในรายงานนี้..."
                    className="w-full pl-8 pr-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700"
                  />
                  {modalSearchKeyword && (
                    <button
                      type="button"
                      onClick={() => setModalSearchKeyword('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleExportCSV(activeReportModal.title)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-bold transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>ส่งออก Excel</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-bold transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>พิมพ์รายงาน</span>
                </button>
              </div>
            </div>

            {/* Modal Table Content */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-700 border-b border-slate-200">
                    <th className="py-2.5 px-3 font-bold w-12 text-center">ลำดับ</th>
                    <th className="py-2.5 px-3 font-bold w-28">รหัสโครงการ</th>
                    <th className="py-2.5 px-3 font-bold">ชื่อโครงการ / แผนงาน</th>
                    <th className="py-2.5 px-3 font-bold">พื้นที่ / หมู่บ้าน</th>
                    <th className="py-2.5 px-3 font-bold">หน่วยงาน</th>
                    <th className="py-2.5 px-3 font-bold text-right">งบตามแผน (บาท)</th>
                    <th className="py-2.5 px-3 font-bold text-right">งบที่อนุมัติ (บาท)</th>
                    <th className="py-2.5 px-3 font-bold text-center">สถานะ</th>
                    <th className="py-2.5 px-3 font-bold text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {modalProjects.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-slate-400">
                        ไม่พบข้อมูลโครงการในหมวดหมู่รายงานนี้
                      </td>
                    </tr>
                  ) : (
                    modalProjects.slice(0, 100).map((p, idx) => (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-center text-slate-500">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-700">
                          {getProjectDisplayId(p, p.orderNumber || idx + 1)}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900 leading-snug">{p.name}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{p.planCategory || p.planStrategy}</div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 truncate max-w-[120px]">
                          {p.village || '-'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 truncate max-w-[120px]">{p.department}</td>
                        <td className="py-2.5 px-3 font-mono text-right text-slate-800">
                          {p.budgetPlan ? p.budgetPlan.toLocaleString() : '0'}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-right font-bold text-emerald-700">
                          {p.budgetApproved ? p.budgetApproved.toLocaleString() : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              p.status === 'approved'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {p.status === 'approved' ? 'อนุมัติแล้ว' : 'รออนุมัติ'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveReportModal(null);
                              onOpenProjectDetail?.(p);
                            }}
                            className="text-blue-600 hover:text-blue-800 font-bold text-[11px] cursor-pointer hover:underline"
                          >
                            ดูรายละเอียด
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
              <span>
                แสดงผล {Math.min(modalProjects.length, 100)} จาก {modalProjects.length} รายการ
              </span>
              <button
                type="button"
                onClick={() => {
                  setActiveReportModal(null);
                  setModalSearchKeyword('');
                }}
                className="px-4 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
