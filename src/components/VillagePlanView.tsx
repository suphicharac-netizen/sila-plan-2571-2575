import React, { useState, useMemo } from 'react';
import {
  MapPin,
  ChevronRight,
  ArrowLeft,
  Building2,
  Layers,
  Search,
  CheckCircle2,
  Clock,
  Coins,
  FileText,
  Filter,
  Check,
  Eye,
  BarChart3,
  Home,
  Sparkles,
  RotateCcw,
  Printer,
  FileSpreadsheet,
  AlertCircle,
  Activity,
  FolderOpen,
  Download,
  Plus
} from 'lucide-react';
import {
  ProjectData,
  SILA_ZONES,
  ALL_VILLAGES,
  ZoneInfo,
  VillageInfo,
  UserAccount,
  ProjectExecutionStatus
} from '../types';
import { DEVELOPMENT_STRATEGIES, DEPARTMENTS } from '../utils/constants';
import { matchesProjectSearch } from '../utils/projectCode';
import {
  getProjectVillageInfo,
  isProjectInVillage,
  isProjectInZone,
  normalizeProjectVillageData,
  isProjectBudgetAllocated,
  toggleProjectBudgetAllocation,
  EXECUTION_STATUS_CONFIG,
  getExecutionStatus,
  canUserUpdateExecutionStatus,
  updateProjectExecutionStatus
} from '../utils/villageUtils';

interface VillagePlanViewProps {
  projects: ProjectData[];
  onViewProjectDetail: (project: ProjectData) => void;
  onRestoreInitialData?: () => void;
  onAddNewProject?: (villageNum?: number) => void;
  onUpdateProject?: (project: ProjectData) => void;
  currentUser?: UserAccount | null;
  onSwitchToReport?: () => void;
}

export const VillagePlanView: React.FC<VillagePlanViewProps> = ({
  projects,
  onViewProjectDetail,
  onRestoreInitialData,
  onAddNewProject,
  onUpdateProject,
  currentUser,
  onSwitchToReport
}) => {
  // Navigation State for 3 Levels:
  // Level 1: Zone overview (3 zones)
  // Level 2: Village overview within selected zone
  // Level 3: Projects within selected village
  const [currentLevel, setCurrentLevel] = useState<1 | 2 | 3>(1);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [selectedVillageNumber, setSelectedVillageNumber] = useState<number | null>(null);

  // Filters matching Top Filter Controls Component (บรรทัดที่ 2 - 3 ตามรูปที่ 1)
  const [fiscalYear, setFiscalYear] = useState<string>('all');
  const [selectedStrategy, setSelectedStrategy] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [minBudget, setMinBudget] = useState<string>('');
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  // Status and View filters
  const [budgetStatusFilter, setBudgetStatusFilter] = useState<
    'all' | 'unbudgeted' | 'budgeted' | 'in_progress' | 'completed' | 'cancelled'
  >('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const canUpdateStatus = Boolean(currentUser && currentUser.role !== 'public' && onUpdateProject);

  const handlePrint = () => {
    window.print();
  };

  // Helper to get total budget for a project
  const getProjectBudget = (p: ProjectData): number => {
    if (p.budgetApproved && p.budgetApproved > 0) return p.budgetApproved;
    if (p.budgetPlan && p.budgetPlan > 0) return p.budgetPlan;
    return 0;
  };

  // 1. Reactive filtered projects based on the Top Filter Controls (Line 1 - 3)
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      // 1. Fiscal year
      if (fiscalYear !== 'all') {
        const yearBudget = p.budgetByYear?.[fiscalYear as keyof typeof p.budgetByYear];
        const matchYear = p.year === fiscalYear || (yearBudget !== undefined && yearBudget > 0);
        if (!matchYear) return false;
      }

      // 2. Strategy (ประเด็นการพัฒนา)
      if (selectedStrategy && p.planStrategy !== selectedStrategy) {
        return false;
      }

      // 3. Department (ผู้รับผิดชอบ/หน่วยงาน)
      if (selectedDepartment && p.department !== selectedDepartment) {
        return false;
      }

      // 4. Keyword search (ชื่อโครงการ, รหัส ID, วัตถุประสงค์, เป้าหมาย, หมู่บ้าน, เขต)
      if (searchKeyword.trim()) {
        const term = searchKeyword.toLowerCase().trim();
        const codeMatch = (p.code || p.id || '').toLowerCase().includes(term);
        const nameMatch = (p.name || '').toLowerCase().includes(term);
        const objMatch = (p.objective || '').toLowerCase().includes(term);
        const targetMatch = (p.target || '').toLowerCase().includes(term);
        const deptMatch = (p.department || '').toLowerCase().includes(term);
        const stratMatch = (p.planStrategy || '').toLowerCase().includes(term);
        const villageMatch =
          (p.village || '').toLowerCase().includes(term) ||
          (p.villageNumber !== undefined && String(p.villageNumber) === term) ||
          (p.zone || '').toLowerCase().includes(term);
        const noteMatch = (p.executionProgressNote || '').toLowerCase().includes(term);

        if (
          !codeMatch &&
          !nameMatch &&
          !objMatch &&
          !targetMatch &&
          !deptMatch &&
          !stratMatch &&
          !villageMatch &&
          !noteMatch
        ) {
          return false;
        }
      }

      // 5. Min budget (งบประมาณรวม บาท)
      if (minBudget.trim()) {
        const min = Number(minBudget.replace(/,/g, ''));
        const prjBudget = getProjectBudget(p);
        if (!isNaN(min) && prjBudget < min) {
          return false;
        }
      }

      return true;
    });
  }, [projects, fiscalYear, selectedStrategy, selectedDepartment, searchKeyword, minBudget]);

  // Reactive Totals for Top Header Badge and Banner Overview
  const totalFilteredProjects = filteredProjects.length;
  const totalFilteredBudget = useMemo(
    () => filteredProjects.reduce((sum, p) => sum + getProjectBudget(p), 0),
    [filteredProjects]
  );

  // Filter Reset Handlers
  const handleReset = () => {
    setFiscalYear('all');
    setSelectedStrategy('');
    setSelectedDepartment('');
    setSearchKeyword('');
    setMinBudget('');
    setBudgetStatusFilter('all');
    setYearFilter('all');
  };

  const handleShowAll = () => {
    setFiscalYear('all');
    setSelectedStrategy('');
    setSelectedDepartment('');
    setSearchKeyword('');
    setMinBudget('');
    setBudgetStatusFilter('all');
    setYearFilter('all');
    setCurrentLevel(1);
    setSelectedZoneId(null);
    setSelectedVillageNumber(null);
  };

  const handleExportCSV = () => {
    const headers = [
      'ที่',
      'รหัสโครงการ',
      'ชื่อโครงการ',
      'ประเด็นการพัฒนา',
      'เขต',
      'หมู่ที่',
      'หมู่บ้าน',
      'ปีงบประมาณ',
      'งบประมาณ (บาท)',
      'สถานะการตั้งงบประมาณ',
      'สถานะการดำเนินงานโครงการ',
      'หมายเหตุความก้าวหน้า',
      'หน่วยงาน'
    ];

    const rows = filteredProjects.map((p, idx) => {
      const isAllocated = isProjectBudgetAllocated(p);
      const execSt = getExecutionStatus(p);
      const execLabel = isAllocated
        ? EXECUTION_STATUS_CONFIG[execSt]?.label || 'อยู่ระหว่างดำเนินการ'
        : 'อยู่ในแผน (ยังไม่ตั้งงบ)';

      return [
        idx + 1,
        `"${p.code || p.id || ''}"`,
        `"${(p.name || '').replace(/"/g, '""')}"`,
        `"${(p.planStrategy || '').replace(/"/g, '""')}"`,
        `"${p.zone || ''}"`,
        `"${p.villageNumber || ''}"`,
        `"${(p.village || '').replace(/"/g, '""')}"`,
        `"${p.year || ''}"`,
        p.budgetApproved || p.budgetPlan || 0,
        `"${isAllocated ? 'ตั้งงบประมาณแล้ว' : 'อยู่ในแผน (ยังไม่ตั้งงบ)'}"`,
        `"${execLabel}"`,
        `"${(p.executionProgressNote || '').replace(/"/g, '""')}"`,
        `"${p.department || ''}"`
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `รายงานแผนพัฒนารายหมู่บ้าน_ผ02_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    setShowExportDropdown(false);
  };

  // Find selected zone and village objects
  const activeZone = useMemo(() => {
    if (!selectedZoneId) return null;
    return SILA_ZONES.find((z) => z.id === selectedZoneId) || null;
  }, [selectedZoneId]);

  const activeVillage = useMemo(() => {
    if (selectedVillageNumber === null) return null;
    return ALL_VILLAGES.find((v) => v.villageNumber === selectedVillageNumber) || null;
  }, [selectedVillageNumber]);

  // Precompute statistics per zone (Reactivly using filteredProjects)
  const zoneStats = useMemo(() => {
    return SILA_ZONES.map((zone) => {
      const zoneProjects = filteredProjects.filter((p) => isProjectInZone(p, zone));
      const totalBudget = zoneProjects.reduce((sum, p) => sum + getProjectBudget(p), 0);
      const budgetedProjects = zoneProjects.filter((p) => isProjectBudgetAllocated(p));
      const unbudgetedProjects = zoneProjects.filter((p) => !isProjectBudgetAllocated(p));
      const budgetedCount = budgetedProjects.length;
      const unbudgetedCount = unbudgetedProjects.length;

      // Project Implementation Statuses for budgeted projects
      const completedCount = budgetedProjects.filter((p) => p.executionStatus === 'completed').length;
      const inProgressCount = budgetedProjects.filter(
        (p) => p.executionStatus === 'in_progress' || !p.executionStatus || p.executionStatus === 'not_started'
      ).length;
      const cancelledCount = budgetedProjects.filter((p) => p.executionStatus === 'cancelled').length;

      // Completion rate: % of completed projects among those with allocated budget
      const completionRate =
        budgetedCount > 0 ? Math.round((completedCount / budgetedCount) * 100) : 0;

      return {
        zone,
        totalVillages: zone.villages.length,
        totalProjects: zoneProjects.length,
        totalBudget,
        budgetedCount,
        unbudgetedCount,
        completedCount,
        inProgressCount,
        cancelledCount,
        completionRate
      };
    });
  }, [filteredProjects]);

  // Precompute statistics per village in the active zone (Reactively using filteredProjects)
  const villageStatsInActiveZone = useMemo(() => {
    if (!activeZone) return [];

    return activeZone.villages.map((village) => {
      const vProjects = filteredProjects.filter((p) => isProjectInVillage(p, village));
      const totalBudget = vProjects.reduce((sum, p) => sum + getProjectBudget(p), 0);
      const budgetedProjects = vProjects.filter((p) => isProjectBudgetAllocated(p));
      const unbudgetedProjects = vProjects.filter((p) => !isProjectBudgetAllocated(p));
      const budgetedCount = budgetedProjects.length;
      const unbudgetedCount = unbudgetedProjects.length;

      const completedCount = budgetedProjects.filter((p) => p.executionStatus === 'completed').length;
      const inProgressCount = budgetedProjects.filter(
        (p) => p.executionStatus === 'in_progress' || !p.executionStatus || p.executionStatus === 'not_started'
      ).length;
      const cancelledCount = budgetedProjects.filter((p) => p.executionStatus === 'cancelled').length;

      // Completion rate for budgeted projects
      const completionRate =
        budgetedCount > 0 ? Math.round((completedCount / budgetedCount) * 100) : 0;

      return {
        village,
        projects: vProjects,
        totalProjects: vProjects.length,
        totalBudget,
        budgetedCount,
        unbudgetedCount,
        completedCount,
        inProgressCount,
        cancelledCount,
        completionRate
      };
    });
  }, [activeZone, filteredProjects]);

  // Filtered villages in active zone by search keyword
  const filteredVillages = useMemo(() => {
    if (!searchKeyword.trim()) return villageStatsInActiveZone;
    const term = searchKeyword.toLowerCase().trim();
    return villageStatsInActiveZone.filter(
      (item) =>
        item.village.villageName.toLowerCase().includes(term) ||
        item.village.shortName.toLowerCase().includes(term) ||
        String(item.village.villageNumber).includes(term)
    );
  }, [villageStatsInActiveZone, searchKeyword]);

  // Projects in the selected village (Level 3 - Reactively using filteredProjects)
  const villageProjects = useMemo(() => {
    if (!activeVillage) return [];
    let list = filteredProjects.filter((p) => isProjectInVillage(p, activeVillage));

    // Budget Allocation & Execution Status Filter
    if (budgetStatusFilter !== 'all') {
      if (budgetStatusFilter === 'budgeted') {
        list = list.filter((p) => isProjectBudgetAllocated(p));
      } else if (budgetStatusFilter === 'unbudgeted') {
        list = list.filter((p) => !isProjectBudgetAllocated(p));
      } else if (budgetStatusFilter === 'completed') {
        list = list.filter((p) => isProjectBudgetAllocated(p) && p.executionStatus === 'completed');
      } else if (budgetStatusFilter === 'in_progress') {
        list = list.filter(
          (p) =>
            isProjectBudgetAllocated(p) &&
            (p.executionStatus === 'in_progress' || !p.executionStatus || p.executionStatus === 'not_started')
        );
      } else if (budgetStatusFilter === 'cancelled') {
        list = list.filter((p) => isProjectBudgetAllocated(p) && p.executionStatus === 'cancelled');
      }
    }

    if (yearFilter !== 'all') {
      list = list.filter((p) => p.year === yearFilter);
    }

    return list;
  }, [activeVillage, filteredProjects, budgetStatusFilter, yearFilter]);

  // Active Village summary stats (all projects in active village before budgetStatusFilter)
  const activeVillageStats = useMemo(() => {
    if (!activeVillage) return null;
    const all = filteredProjects.filter((p) => isProjectInVillage(p, activeVillage));
    const budgeted = all.filter((p) => isProjectBudgetAllocated(p));
    const completed = budgeted.filter((p) => p.executionStatus === 'completed');
    const inProgress = budgeted.filter(
      (p) => p.executionStatus === 'in_progress' || !p.executionStatus || p.executionStatus === 'not_started'
    );
    const cancelled = budgeted.filter((p) => p.executionStatus === 'cancelled');
    const unbudgeted = all.length - budgeted.length;
    const totalBudget = all.reduce((sum, p) => sum + getProjectBudget(p), 0);
    const budgetedBudget = budgeted.reduce((sum, p) => sum + getProjectBudget(p), 0);
    const completionRate = budgeted.length > 0 ? Math.round((completed.length / budgeted.length) * 100) : 0;

    return {
      totalProjects: all.length,
      budgetedCount: budgeted.length,
      unbudgetedCount: unbudgeted,
      completedCount: completed.length,
      inProgressCount: inProgress.length,
      cancelledCount: cancelled.length,
      totalBudget,
      budgetedBudget,
      completionRate,
    };
  }, [activeVillage, filteredProjects]);

  // Navigation Handlers
  const handleSelectZone = (zoneId: string) => {
    setSelectedZoneId(zoneId);
    setSelectedVillageNumber(null);
    setCurrentLevel(2);
    setSearchKeyword('');
  };

  const handleSelectVillage = (villageNum: number) => {
    setSelectedVillageNumber(villageNum);
    setCurrentLevel(3);
    setSearchKeyword('');
  };

  const handleGoToLevel1 = () => {
    setSelectedZoneId(null);
    setSelectedVillageNumber(null);
    setCurrentLevel(1);
    setSearchKeyword('');
  };

  const handleGoToLevel2 = () => {
    setSelectedVillageNumber(null);
    setCurrentLevel(2);
    setSearchKeyword('');
  };

  return (
    <div id="village-plan-view-container" className="flex-1 flex flex-col min-w-0 bg-slate-50 h-full min-h-0 overflow-hidden">
      {/* ========================================================================= */}
      {/* 1. ส่วนบนสุด บรรทัดที่ 1 (Header Bar): แถบหัวข้อสีเขียวเข้ม ผ.02 */}
      {/* ========================================================================= */}
      <header
        id="village-plan-header-bar"
        className="bg-[#055740] text-white px-4 py-3 sm:px-6 shadow-xs flex items-center justify-between shrink-0 z-20 print:hidden"
      >
        <div className="flex items-center gap-3.5">
          <div className="bg-[#034131] border border-emerald-500/60 text-emerald-200 font-extrabold px-2.5 py-1 rounded-md text-sm tracking-wider font-mono">
            ผ.02
          </div>
          <h1 className="text-sm sm:text-base md:text-lg font-bold tracking-tight text-white">
            ผ.02 บัญชีรายละเอียดโครงการพัฒนาท้องถิ่น (แบบ ผ.02) - แผนพัฒนารายหมู่บ้าน | ระบบแผนพัฒนาเทศบาลเมืองศิลา
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-[#047857] text-white text-sm font-bold px-3.5 py-1.5 rounded-full border border-emerald-400/50 shadow-2xs font-mono">
            {totalFilteredProjects.toLocaleString()} โครงการ
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4 print:p-0 print:overflow-visible">
        {/* ========================================================================= */}
        {/* บรรทัดที่ 2 - 3 (Filter Controls Component): วางการ์ดฟอร์มค้นหาโครงการ (รูปที่ 1) */}
        {/* ========================================================================= */}
        <section
          id="village-plan-filter-controls-card"
          className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-4 print:hidden"
        >
          {/* แถวบน: Dropdown เลือกปีงบประมาณ */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
            <label
              htmlFor="filter-fiscal-year"
              className="text-base font-bold text-slate-800 min-w-[140px]"
            >
              เลือกปีงบประมาณ:
            </label>
            <div className="relative flex-1 max-w-sm">
              <select
                id="filter-fiscal-year"
                value={fiscalYear}
                onChange={(e) => setFiscalYear(e.target.value)}
                className="w-full text-base bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 min-h-[44px] text-slate-900 font-semibold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600 cursor-pointer"
              >
                <option value="all">ทั้งหมด (พ.ศ. 2571 - 2575)</option>
                <option value="2571">ปี พ.ศ. 2571</option>
                <option value="2572">ปี พ.ศ. 2572</option>
                <option value="2573">ปี พ.ศ. 2573</option>
                <option value="2574">ปี พ.ศ. 2574</option>
                <option value="2575">ปี พ.ศ. 2575</option>
              </select>
            </div>
          </div>

          {/* แถวกลาง: 4 คอลัมน์ตัวกรองละเอียด */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
            {/* 1. ประเด็นการพัฒนา */}
            <div>
              <label
                htmlFor="filter-strategy"
                className="block text-base font-bold text-slate-800 mb-1.5"
              >
                ประเด็นการพัฒนา:
              </label>
              <select
                id="filter-strategy"
                value={selectedStrategy}
                onChange={(e) => setSelectedStrategy(e.target.value)}
                className="w-full text-base bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 min-h-[44px] text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600 cursor-pointer truncate font-medium"
              >
                <option value="">ทั้งหมดทุกประเด็นการพัฒนา</option>
                {DEVELOPMENT_STRATEGIES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. ผู้รับผิดชอบ (หน่วยงาน) */}
            <div>
              <label
                htmlFor="filter-department"
                className="block text-base font-bold text-slate-800 mb-1.5"
              >
                ผู้รับผิดชอบ (สำนัก/กอง):
              </label>
              <select
                id="filter-department"
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full text-base bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 min-h-[44px] text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600 cursor-pointer truncate font-medium"
              >
                <option value="">ทั้งหมดทุกสำนัก/กอง</option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. ค้นหาชื่อโครงการ */}
            <div>
              <label
                htmlFor="filter-keyword"
                className="block text-base font-bold text-slate-800 mb-1.5"
              >
                ค้นหาชื่อโครงการ:
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="filter-keyword"
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="ค้นหาชื่อโครงการ..."
                  className="w-full pl-9.5 pr-3 py-2.5 min-h-[44px] text-base bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600 font-medium"
                />
              </div>
            </div>

            {/* 4. ช่องระบุงบประมาณรวม (บาท) */}
            <div>
              <label
                htmlFor="filter-min-budget"
                className="block text-base font-bold text-slate-800 mb-1.5"
              >
                งบประมาณรวม (บาท) ตั้งแต่:
              </label>
              <div className="relative">
                <span className="text-slate-400 text-sm absolute left-3 top-1/2 -translate-y-1/2 font-mono">฿</span>
                <input
                  id="filter-min-budget"
                  type="number"
                  value={minBudget}
                  onChange={(e) => setMinBudget(e.target.value)}
                  placeholder="ระบุงบขั้นต่ำ เช่น 500000"
                  className="w-full pl-8 pr-3 py-2.5 min-h-[44px] text-base bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* แถวล่าง: แถบปุ่มกดแอ็กชัน */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-3 border-t border-slate-100">
            {/* ฝั่งซ้าย: ค้นหา, แสดงทั้งหมด, เริ่มใหม่ */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                id="btn-filter-apply"
                type="button"
                className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-base font-bold transition-colors cursor-pointer shadow-2xs"
              >
                <Search className="w-4 h-4" />
                <span>ค้นหา</span>
              </button>

              <button
                id="btn-filter-show-all"
                type="button"
                onClick={handleShowAll}
                className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-base font-bold transition-colors cursor-pointer"
              >
                <FolderOpen className="w-4 h-4 text-slate-600" />
                <span>แสดงทั้งหมด</span>
              </button>

              <button
                id="btn-filter-reset"
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-base font-bold transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-slate-500" />
                <span>เริ่มใหม่</span>
              </button>

              {onSwitchToReport && (
                <button
                  id="btn-switch-to-official-report"
                  type="button"
                  onClick={onSwitchToReport}
                  className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 text-emerald-900 text-base font-bold rounded-xl transition-colors cursor-pointer"
                  title="เปิดดูรายงานทางการ แบบ ผ.02 รายหมู่บ้าน (10 คอลัมน์)"
                >
                  <FileText className="w-4 h-4 text-emerald-700" />
                  <span>รายงานทางการ (แบบ ผ.02)</span>
                </button>
              )}
            </div>

            {/* ฝั่งขวา: ส่งออกข้อมูล, พิมพ์รายงาน, สิทธิ์ผู้ใช้งาน, เพิ่มโครงการ */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Dropdown ส่งออกข้อมูล */}
              <div className="relative">
                <button
                  id="btn-export-dropdown"
                  type="button"
                  onClick={() => setShowExportDropdown(!showExportDropdown)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 rounded-xl text-base font-bold transition-colors cursor-pointer shadow-2xs"
                >
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>ส่งออกข้อมูล</span>
                </button>

                {showExportDropdown && (
                  <div className="absolute right-0 top-full mt-1.5 w-52 bg-white border border-slate-200 rounded-xl shadow-lg z-30 py-1.5 animate-in fade-in zoom-in-95 duration-100">
                    <button
                      type="button"
                      onClick={handleExportCSV}
                      className="w-full text-left px-4 py-2.5 text-base text-slate-800 hover:bg-emerald-50 hover:text-emerald-900 flex items-center gap-2.5 cursor-pointer font-semibold"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <span>ดาวน์โหลดเป็น CSV</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowExportDropdown(false);
                        handlePrint();
                      }}
                      className="w-full text-left px-4 py-2.5 text-base text-slate-800 hover:bg-emerald-50 hover:text-emerald-900 flex items-center gap-2.5 cursor-pointer font-semibold"
                    >
                      <Printer className="w-4 h-4 text-slate-600" />
                      <span>พิมพ์หน้ารายการ (PDF)</span>
                    </button>
                  </div>
                )}
              </div>

              {/* ปุ่มพิมพ์รายงาน */}
              <button
                id="btn-print-report"
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 rounded-xl text-base font-bold transition-colors cursor-pointer shadow-2xs"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                <span>พิมพ์รายงาน</span>
              </button>

              {/* Status Badge สิทธิ์ผู้ใช้งาน */}
              <div className="inline-flex items-center gap-2 px-3 py-2 min-h-[44px] rounded-xl bg-slate-100 border border-slate-200 text-slate-800 text-sm font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <span>
                  สิทธิ์: {currentUser?.fullName || currentUser?.username || 'ผู้เยี่ยมชมทั่วไป'}
                </span>
              </div>

              {/* ปุ่มเพิ่มโครงการ (ถ้ามีสิทธิ์) */}
              {onAddNewProject && currentUser && currentUser.role !== 'public' && (
                <button
                  id="btn-add-new-project"
                  type="button"
                  onClick={() => onAddNewProject()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-base font-bold transition-colors cursor-pointer shadow-2xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>เพิ่มโครงการ</span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2. ส่วนบรรทัดถัดมา: แบนเนอร์สรุปภาพรวมรายพื้นที่ (ตามรูปที่ 2) */}
        {/* ========================================================================= */}
        <section
          id="village-plan-overview-banner"
          className="bg-gradient-to-r from-[#03231a] via-[#064232] to-[#0a5c45] rounded-2xl p-6 sm:p-7 text-white shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6"
        >
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/25 text-emerald-200 text-sm font-bold border border-emerald-400/40">
              <Sparkles className="w-4 h-4 text-emerald-300" />
              <span>โครงสร้างการบริหารจัดการแผนพัฒนารายพื้นที่</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              แผนพัฒนารายเขตและหมู่บ้าน เทศบาลเมืองศิลา
            </h2>
            <p className="text-base text-emerald-100/90 leading-relaxed font-normal">
              ครอบคลุม {ALL_VILLAGES.length} หมู่บ้าน แบ่งออกเป็น 3 เขตการปกครองหลัก เพื่อการกระจายงบประมาณและการพัฒนาโครงสร้างพื้นฐาน คุณภาพชีวิต และสิ่งแวดล้อมอย่างทั่วถึง
            </p>
          </div>

          {/* กล่องสรุปสถิติด้านขวา: แสดงยอดรวมเชื่อมโยงตามตัวกรองด้านบน */}
          <div className="grid grid-cols-2 gap-5 bg-white/10 backdrop-blur-xs p-5 rounded-2xl border border-white/20 shrink-0 min-w-[280px]">
            <div>
              <div className="text-sm font-semibold text-emerald-200">โครงการทั้งหมด</div>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-white mt-1">
                {totalFilteredProjects.toLocaleString()} โครงการ
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold text-emerald-200">งบประมาณรวม</div>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-amber-300 mt-1">
                ฿{totalFilteredBudget.toLocaleString()}
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* แถบนำทางระดับโครงสร้าง (Breadcrumbs & Quick Village Jumper) */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-2xl border border-slate-200 px-4 py-3 sm:px-5 sm:py-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
          {/* Breadcrumb Navigation Trail */}
          <div className="flex items-center gap-2.5 overflow-x-auto">
            {currentLevel > 1 && (
              <button
                id="btn-village-plan-back"
                type="button"
                onClick={currentLevel === 3 ? handleGoToLevel2 : handleGoToLevel1}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm sm:text-base font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4 text-slate-700" />
                <span>
                  {currentLevel === 3
                    ? `กลับไประดับเขต (${activeZone?.name})`
                    : 'กลับไปภาพรวม 3 เขต'}
                </span>
              </button>
            )}

            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-2 text-base font-medium overflow-x-auto py-0.5 text-slate-700 scrollbar-none"
            >
              {/* Root: Level 1 */}
              <button
                id="breadcrumb-level-1"
                type="button"
                onClick={handleGoToLevel1}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors cursor-pointer whitespace-nowrap text-base ${
                  currentLevel === 1
                    ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-300'
                    : 'hover:bg-slate-100 text-slate-700 font-semibold'
                }`}
              >
                <Home className="w-4 h-4 text-emerald-700" />
                <span>ภาพรวม 3 เขต</span>
              </button>

              {/* Step 2: Level 2 */}
              {currentLevel >= 2 && activeZone && (
                <>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  <button
                    id="breadcrumb-level-2"
                    type="button"
                    onClick={handleGoToLevel2}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors cursor-pointer whitespace-nowrap text-base ${
                      currentLevel === 2
                        ? `${activeZone.badgeBg} ${activeZone.badgeText} font-bold border ${activeZone.badgeBorder}`
                        : 'hover:bg-slate-100 text-slate-700 font-semibold'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span>{activeZone.name} ({activeZone.villages.length} หมู่บ้าน)</span>
                  </button>
                </>
              )}

              {/* Step 3: Level 3 */}
              {currentLevel === 3 && activeVillage && (
                <>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  <div
                    id="breadcrumb-level-3"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 text-white font-bold whitespace-nowrap text-base shadow-2xs"
                  >
                    <MapPin className="w-4 h-4" />
                    <span>{activeVillage.villageName}</span>
                  </div>
                </>
              )}
            </nav>
          </div>

          {/* Quick Village Dropdown Jump */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="flex items-center gap-1.5 text-base text-slate-800 font-bold">
              <MapPin className="w-4 h-4 text-emerald-700" />
              <span>ไปยังหมู่บ้าน:</span>
            </div>
            <select
              id="select-quick-village-jump"
              value={selectedVillageNumber || ''}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (val) {
                  const vObj = ALL_VILLAGES.find((v) => v.villageNumber === val);
                  if (vObj) {
                    const zObj = SILA_ZONES.find((z) => z.name === vObj.zone);
                    if (zObj) setSelectedZoneId(zObj.id);
                    handleSelectVillage(val);
                  }
                } else {
                  handleGoToLevel1();
                }
              }}
              className="text-base bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 min-h-[42px] text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600 cursor-pointer font-bold"
            >
              <option value="">-- เลือกหมู่บ้านจาก 28 หมู่บ้าน --</option>
              {SILA_ZONES.map((zone) => (
                <optgroup key={zone.id} label={zone.name}>
                  {zone.villages.map((v) => (
                    <option key={v.villageNumber} value={v.villageNumber}>
                      ม.{v.villageNumber} {v.shortName}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>

        {/* Standard 2-Line Official Header for Print & Display */}
        <div className="text-center py-3 sm:py-4 border-b border-slate-200 print:border-none bg-white rounded-2xl shadow-2xs print:shadow-none p-5">
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-950 print:text-black leading-snug">
            {currentLevel === 3 && activeVillage
              ? `รายงานแผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575) ประจำพื้นที่ ${activeVillage.villageName}`
              : currentLevel === 2 && activeZone
              ? `รายงานแผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575) ${activeZone.fullName}`
              : 'รายงานแผนพัฒนาท้องถิ่นรายหมู่บ้าน (พ.ศ. 2571-2575)'}
          </h2>
          <p className="text-sm sm:text-base font-bold text-slate-800 print:text-black leading-tight mt-1.5">
            เทศบาลเมืองศิลา อำเภอเมืองขอนแก่น จังหวัดขอนแก่น
          </p>
        </div>

        {/* Fallback Banner if projects array is empty */}
        {(!projects || projects.length === 0) && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center shadow-xs">
            <div className="max-w-xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-left">
                <h4 className="text-xs sm:text-sm font-bold text-amber-900 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>ไม่พบข้อมูลโครงการในระบบ หรือชุดข้อมูลว่างเปล่า</span>
                </h4>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  ระบบสามารถกู้คืนชุดข้อมูลแผนพัฒนาเทศบาลเมืองศิลา (28 หมู่บ้าน) กลับคืนมาให้ท่านได้ทันที
                </p>
              </div>
              {onRestoreInitialData && (
                <button
                  type="button"
                  onClick={onRestoreInitialData}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer transition-colors shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>กู้คืนข้อมูลแผนพัฒนา (28 หมู่บ้าน)</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* LEVEL 1: ภาพรวมระดับเขต (3 เขตการปกครอง) */}
        {/* ========================================================================= */}
        {currentLevel === 1 && (
          <div className="space-y-6 animate-in fade-in duration-200">

            {/* Instant Search Results Chips if keyword typed at Level 1 */}
            {searchKeyword.trim() && (
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5">
                <div className="text-xs font-semibold text-emerald-900 mb-2 flex items-center justify-between">
                  <span>ผลการค้นหาหมู่บ้านที่ตรงกับ "{searchKeyword}":</span>
                  <span className="text-[11px] text-emerald-700">คลิกเพื่อเปิดดูโครงการในหมู่บ้าน</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {ALL_VILLAGES.filter(
                    (v) =>
                      v.villageName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
                      v.shortName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
                      String(v.villageNumber) === searchKeyword.trim()
                  ).map((v) => {
                    const zObj = SILA_ZONES.find((z) => z.name === v.zone);
                    return (
                      <button
                        key={v.villageNumber}
                        type="button"
                        onClick={() => {
                          if (zObj) setSelectedZoneId(zObj.id);
                          handleSelectVillage(v.villageNumber);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-emerald-300 hover:border-emerald-500 hover:bg-emerald-100 text-emerald-900 rounded-lg text-xs font-medium transition-all cursor-pointer shadow-2xs"
                      >
                        <span className="px-1.5 py-0.2 rounded bg-emerald-600 text-white text-[10px] font-mono font-bold">
                          {v.zone}
                        </span>
                        <span>{v.villageName}</span>
                        <ChevronRight className="w-3 h-3 text-emerald-600" />
                      </button>
                    );
                  })}
                  {ALL_VILLAGES.filter(
                    (v) =>
                      v.villageName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
                      v.shortName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
                      String(v.villageNumber) === searchKeyword.trim()
                  ).length === 0 && (
                    <div className="text-xs text-slate-500 py-1">
                      ไม่พบหมู่บ้านที่ตรงกับคำค้นหา กรุณาระบุชื่อหมู่บ้านหรือเลขที่หมู่ (1-28)
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3 Zone Cards */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-800">
                    เลือกระดับเขตการปกครองเพื่อดูรายชื่อหมู่บ้าน (3 เขต)
                  </h3>
                </div>
                <span className="text-xs text-slate-500">คลิกที่การ์ดเพื่อเจาะลึกระดับหมู่บ้าน</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {zoneStats.map((item) => {
                  const { zone } = item;
                  return (
                    <div
                      key={zone.id}
                      id={`card-zone-${zone.id}`}
                      onClick={() => handleSelectZone(zone.id)}
                      className="group bg-white rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-lg transition-all duration-200 overflow-hidden cursor-pointer flex flex-col"
                    >
                      {/* Card Header Strip */}
                      <div
                        className="p-5 border-b border-slate-100 flex items-start justify-between relative"
                        style={{ borderTop: `4px solid ${zone.color}` }}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-bold px-2.5 py-0.5 rounded-md ${zone.badgeBg} ${zone.badgeText} border ${zone.badgeBorder}`}
                            >
                              {zone.name}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">
                              {item.totalVillages} หมู่บ้าน
                            </span>
                          </div>
                          <h4 className="text-base font-bold text-slate-900 mt-1.5 group-hover:text-emerald-700 transition-colors">
                            {zone.fullName}
                          </h4>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                            {zone.description}
                          </p>
                        </div>
                      </div>

                      {/* Metrics Section */}
                      <div className="p-5 flex-1 space-y-4 bg-slate-50/50">
                        {/* 3 Primary Metric Pills */}
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                            <div className="text-[11px] text-slate-500 font-medium">โครงการในแผน</div>
                            <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
                              {item.totalProjects}
                            </div>
                          </div>
                          <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                            <div className="text-[11px] text-slate-500 font-medium">ตั้งงบแล้ว</div>
                            <div className="text-base font-bold font-mono text-blue-700 mt-0.5">
                              {item.budgetedCount}
                            </div>
                          </div>
                          <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                            <div className="text-[11px] text-slate-500 font-medium">งบประมาณรวม</div>
                            <div className="text-sm font-bold font-mono text-emerald-700 mt-0.5 truncate" title={`฿${item.totalBudget.toLocaleString()}`}>
                              ฿{item.totalBudget >= 1000000 ? `${(item.totalBudget / 1000000).toFixed(1)}M` : item.totalBudget.toLocaleString()}
                            </div>
                          </div>
                        </div>

                        {/* Status Breakdown Bar */}
                        <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-700">ความก้าวหน้าโครงการที่ได้งบ</span>
                            <span className="font-mono font-bold text-emerald-700">
                              {item.completionRate}%
                            </span>
                          </div>

                          {/* Multi-segmented Progress bar */}
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                            <div
                              style={{
                                width: `${
                                  item.budgetedCount > 0
                                    ? (item.completedCount / item.budgetedCount) * 100
                                    : 0
                                }%`
                              }}
                              className="bg-emerald-600 h-full transition-all"
                              title={`ดำเนินการแล้วเสร็จ: ${item.completedCount}`}
                            />
                            <div
                              style={{
                                width: `${
                                  item.budgetedCount > 0
                                    ? (item.inProgressCount / item.budgetedCount) * 100
                                    : 0
                                }%`
                              }}
                              className="bg-sky-500 h-full transition-all"
                              title={`อยู่ระหว่างดำเนินการ: ${item.inProgressCount}`}
                            />
                            <div
                              style={{
                                width: `${
                                  item.budgetedCount > 0
                                    ? (item.cancelledCount / item.budgetedCount) * 100
                                    : 0
                                }%`
                              }}
                              className="bg-rose-500 h-full transition-all"
                              title={`ไม่ได้ดำเนินการ/โอนลด: ${item.cancelledCount}`}
                            />
                          </div>

                          {/* Status Legend Pills */}
                          <div className="grid grid-cols-2 gap-1 text-[11px] pt-1 text-slate-600">
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                              <span>✅</span> เสร็จสิ้น {item.completedCount}
                            </span>
                            <span className="inline-flex items-center gap-1 text-sky-700 font-medium">
                              <span>⏳</span> กำลังทำ {item.inProgressCount}
                            </span>
                            <span className="inline-flex items-center gap-1 text-rose-700 font-medium">
                              <span>🔴</span> โอนลด {item.cancelledCount}
                            </span>
                            <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                              <span>🟡</span> รอตั้งงบ {item.unbudgetedCount}
                            </span>
                          </div>
                        </div>

                        {/* Village Badges Sample */}
                        <div>
                          <div className="text-[11px] font-semibold text-slate-600 mb-1.5">
                            รายชื่อหมู่บ้านในสังกัด ({zone.villages.length} หมู่):
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {zone.villages.slice(0, 6).map((v) => (
                              <span
                                key={v.villageNumber}
                                className="text-[10px] px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600"
                              >
                                ม.{v.villageNumber} {v.shortName}
                              </span>
                            ))}
                            {zone.villages.length > 6 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                                + อีก {zone.villages.length - 6} หมู่
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Button */}
                      <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-700 group-hover:bg-emerald-50/50 transition-colors">
                        <span>เข้าดูรายชื่อหมู่บ้านใน {zone.name}</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Comparative Summary Table of All 3 Zones */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-800">
                    ตารางเปรียบเทียบสถิติการพัฒนา 3 เขตการปกครอง
                  </h3>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#0e533c] text-white font-semibold">
                      <th className="py-2.5 px-3">เขตการปกครอง</th>
                      <th className="py-2.5 px-3 text-center">หมู่บ้าน</th>
                      <th className="py-2.5 px-3 text-center">โครงการในแผน</th>
                      <th className="py-2.5 px-3 text-center">ตั้งงบแล้ว</th>
                      <th className="py-2.5 px-3 text-right">งบประมาณรวม</th>
                      <th className="py-2.5 px-3 text-center">แล้วเสร็จ (✅)</th>
                      <th className="py-2.5 px-3 text-center">กำลังทำ (⏳)</th>
                      <th className="py-2.5 px-3 text-center">โอนลด (🔴)</th>
                      <th className="py-2.5 px-3 text-center">ยังไม่ตั้งงบ (🟡)</th>
                      <th className="py-2.5 px-3 text-center">ก้าวหน้า</th>
                      <th className="py-2.5 px-3 text-center">การดำเนินการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {zoneStats.map((item) => (
                      <tr key={item.zone.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 font-semibold text-slate-900 flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: item.zone.color }}
                          />
                          <span>{item.zone.fullName}</span>
                        </td>
                        <td className="py-3 px-3 text-center font-mono">{item.totalVillages} หมู่</td>
                        <td className="py-3 px-3 text-center font-mono font-medium">
                          {item.totalProjects}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-blue-700">
                          {item.budgetedCount}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                          ฿{item.totalBudget.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-mono">
                            {item.completedCount}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 text-[11px] font-mono">
                            {item.inProgressCount}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-mono">
                            {item.cancelledCount}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-mono">
                            {item.unbudgetedCount}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="font-mono font-bold text-emerald-700 text-xs">
                            {item.completionRate}%
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => handleSelectZone(item.zone.id)}
                            className="px-3 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[11px] transition-colors cursor-pointer shadow-2xs"
                          >
                            เลือกเขตนี้
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-200">
                      <td className="py-2.5 px-3">รวมทั้งเทศบาลเมืองศิลา (3 เขต)</td>
                      <td className="py-2.5 px-3 text-center font-mono">28 หมู่บ้าน</td>
                      <td className="py-2.5 px-3 text-center font-mono">{totalFilteredProjects.toLocaleString()} โครงการ</td>
                      <td className="py-2.5 px-3 text-center font-mono text-blue-700">
                        {zoneStats.reduce((s, z) => s + z.budgetedCount, 0)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-800">
                        ฿{totalFilteredBudget.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-emerald-700">
                        {zoneStats.reduce((s, z) => s + z.completedCount, 0)}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-sky-700">
                        {zoneStats.reduce((s, z) => s + z.inProgressCount, 0)}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-rose-700">
                        {zoneStats.reduce((s, z) => s + z.cancelledCount, 0)}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-amber-800">
                        {zoneStats.reduce((s, z) => s + z.unbudgetedCount, 0)}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-emerald-700">
                        {(() => {
                          const totalBudgeted = zoneStats.reduce((s, z) => s + z.budgetedCount, 0);
                          const totalCompleted = zoneStats.reduce((s, z) => s + z.completedCount, 0);
                          return totalBudgeted > 0 ? `${Math.round((totalCompleted / totalBudgeted) * 100)}%` : '0%';
                        })()}
                      </td>
                      <td className="py-2.5 px-3 text-center">-</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* LEVEL 2: ระดับหมู่บ้านในเขต (รายการหมู่บ้านในเขตที่เลือก) */}
        {/* ========================================================================= */}
        {currentLevel === 2 && activeZone && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Zone Header Banner */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                  style={{ backgroundColor: activeZone.color }}
                >
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${activeZone.badgeBg} ${activeZone.badgeText}`}>
                      {activeZone.name}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      {activeZone.villages.length} หมู่บ้านในเขตนี้
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 mt-1">
                    {activeZone.fullName}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">{activeZone.description}</p>
                </div>
              </div>

              {/* Zone Quick Stats */}
              <div className="flex items-center gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-100 shrink-0">
                <div>
                  <div className="text-[11px] text-slate-500">โครงการทั้งเขต</div>
                  <div className="text-base font-bold font-mono text-slate-900">
                    {villageStatsInActiveZone.reduce((s, v) => s + v.totalProjects, 0)} รายการ
                  </div>
                </div>
                <div className="w-px h-8 bg-slate-200" />
                <div>
                  <div className="text-[11px] text-slate-500">งบประมาณรวมทั้งเขต</div>
                  <div className="text-base font-bold font-mono text-emerald-700">
                    ฿{villageStatsInActiveZone.reduce((s, v) => s + v.totalBudget, 0).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Filter and View Controls */}
            <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="input-search-village"
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="ค้นหาหมู่บ้าน (ชื่อหมู่บ้าน หรือ เลขที่หมู่)..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:bg-white transition-all"
                />
              </div>

              {/* View Mode & Reset */}
              <div className="flex items-center gap-2">
                {searchKeyword && (
                  <button
                    onClick={() => setSearchKeyword('')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>ล้างค้นหา</span>
                  </button>
                )}

                <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 text-xs">
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`px-3 py-1 rounded-md transition-colors cursor-pointer font-medium ${
                      viewMode === 'cards'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    การ์ด (Grid)
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-3 py-1 rounded-md transition-colors cursor-pointer font-medium ${
                      viewMode === 'table'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ตาราง (Table)
                  </button>
                </div>
              </div>
            </div>

            {/* List of Villages in Selected Zone */}
            {filteredVillages.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Search className="w-6 h-6" />
                </div>
                <div className="text-slate-800 font-bold text-sm">
                  ไม่พบหมู่บ้านที่ตรงกับคำค้นหา "{searchKeyword}" ใน {activeZone.name}
                </div>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  กรุณาลองค้นหาด้วยชื่อหมู่บ้าน หรือเลขที่หมู่ใหม่อีกครั้ง หรือกดปุ่มด้านล่างเพื่อแสดงรายการทั้งหมด
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setSearchKeyword('')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors shadow-2xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>ล้างการค้นหา / แสดงทุกหมู่บ้านในเขตนี้ ({activeZone.villages.length} หมู่บ้าน)</span>
                  </button>
                </div>
              </div>
            ) : viewMode === 'cards' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredVillages.map((item) => {
                  const { village } = item;
                  return (
                    <div
                      key={village.villageNumber}
                      id={`card-village-${village.villageNumber}`}
                      onClick={() => handleSelectVillage(village.villageNumber)}
                      className="group bg-white rounded-xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all duration-150 p-4 cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="inline-block px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200 mb-1">
                              หมู่ที่ {village.villageNumber}
                            </div>
                            <h4 className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors">
                              {village.villageName}
                            </h4>
                          </div>
                          <span className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-emerald-100 text-slate-600 group-hover:text-emerald-700 flex items-center justify-center transition-colors shrink-0">
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                          </span>
                        </div>

                        {/* Stats Metrics */}
                        <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-3 gap-1.5 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 block">ในแผน</span>
                            <span className="font-bold font-mono text-slate-800 text-xs">
                              {item.totalProjects}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">ตั้งงบ</span>
                            <span className="font-bold font-mono text-blue-700 text-xs">
                              {item.budgetedCount}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">งบประมาณ</span>
                            <span className="font-bold font-mono text-emerald-700 text-xs truncate block" title={`฿${item.totalBudget.toLocaleString()}`}>
                              ฿{item.totalBudget >= 1000000 ? `${(item.totalBudget / 1000000).toFixed(1)}M` : item.totalBudget.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar for Budgeted Projects */}
                        <div className="mt-2.5">
                          <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                            <span>ความก้าวหน้าโครงการ</span>
                            <span className="font-mono font-bold text-emerald-700">{item.completionRate}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                            <div
                              style={{
                                width: `${item.budgetedCount > 0 ? (item.completedCount / item.budgetedCount) * 100 : 0}%`
                              }}
                              className="bg-emerald-600 h-full"
                              title={`เสร็จสิ้น: ${item.completedCount}`}
                            />
                            <div
                              style={{
                                width: `${item.budgetedCount > 0 ? (item.inProgressCount / item.budgetedCount) * 100 : 0}%`
                              }}
                              className="bg-sky-500 h-full"
                              title={`กำลังดำเนิน: ${item.inProgressCount}`}
                            />
                            <div
                              style={{
                                width: `${item.budgetedCount > 0 ? (item.cancelledCount / item.budgetedCount) * 100 : 0}%`
                              }}
                              className="bg-rose-500 h-full"
                              title={`โอนลด: ${item.cancelledCount}`}
                            />
                          </div>
                        </div>

                        {/* Status Distribution Pills */}
                        <div className="mt-3 bg-slate-50 rounded-lg p-2 grid grid-cols-4 gap-1 text-[10px] text-center">
                          <span className="text-emerald-700 font-medium" title="เสร็จสิ้นแล้ว">
                            ✅ {item.completedCount}
                          </span>
                          <span className="text-sky-700 font-medium" title="กำลังดำเนินการ">
                            ⏳ {item.inProgressCount}
                          </span>
                          <span className="text-rose-700 font-medium" title="ไม่ได้ดำเนินการ/โอนลด">
                            🔴 {item.cancelledCount}
                          </span>
                          <span className="text-amber-700 font-medium" title="อยู่ในแผน (ยังไม่ตั้งงบ)">
                            🟡 {item.unbudgetedCount}
                          </span>
                        </div>
                      </div>

                      {/* Footer Link */}
                      <div className="mt-3 pt-2 text-right">
                        <span className="text-[11px] font-semibold text-emerald-700 group-hover:underline inline-flex items-center gap-1">
                          <span>ดูโครงการในหมู่บ้านนี้</span>
                          <span>→</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Table View for Villages in Selected Zone */
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#0e533c] text-white font-semibold">
                      <th className="py-2.5 px-3 text-center w-16">หมู่ที่</th>
                      <th className="py-2.5 px-3">ชื่อหมู่บ้าน</th>
                      <th className="py-2.5 px-3 text-center w-20">ในแผน</th>
                      <th className="py-2.5 px-3 text-center w-20">ตั้งงบแล้ว</th>
                      <th className="py-2.5 px-3 text-center w-20">แล้วเสร็จ (✅)</th>
                      <th className="py-2.5 px-3 text-center w-20">กำลังทำ (⏳)</th>
                      <th className="py-2.5 px-3 text-center w-20">โอนลด (🔴)</th>
                      <th className="py-2.5 px-3 text-center w-20">รอตั้งงบ (🟡)</th>
                      <th className="py-2.5 px-3 text-right w-28">งบประมาณรวม</th>
                      <th className="py-2.5 px-3 text-center w-20">ก้าวหน้า</th>
                      <th className="py-2.5 px-3 text-center w-20">การกระทำ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredVillages.map((item) => {
                      const { village } = item;
                      return (
                        <tr
                          key={village.villageNumber}
                          onClick={() => handleSelectVillage(village.villageNumber)}
                          className="hover:bg-emerald-50/40 cursor-pointer transition-colors"
                        >
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800">
                            {village.villageNumber}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            {village.villageName}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-medium">
                            {item.totalProjects}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-blue-700">
                            {item.budgetedCount}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-mono text-[11px]">
                              {item.completedCount}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-1.5 py-0.5 rounded-full bg-sky-50 text-sky-700 font-mono text-[11px]">
                              {item.inProgressCount}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-700 font-mono text-[11px]">
                              {item.cancelledCount}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-800 font-mono text-[11px]">
                              {item.unbudgetedCount}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                            ฿{item.totalBudget.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-700">
                            {item.completionRate}%
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="text-emerald-700 hover:text-emerald-900 font-semibold underline text-[11px]">
                              เปิดดู
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* LEVEL 3: ระดับโครงการรายหมู่บ้าน (ตารางรายการโครงการของหมู่บ้านที่เลือก) */}
        {/* ========================================================================= */}
        {currentLevel === 3 && activeVillage && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Village Profile Banner */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {activeZone?.name || 'เขตการปกครอง'}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      หมู่ที่ {activeVillage.villageNumber}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mt-1">
                    {activeVillage.villageName}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    รายการโครงการแผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575) ประจำพื้นที่ {activeVillage.villageName}
                  </p>
                </div>
              </div>

              {/* Village Quick Stats */}
              <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 shrink-0">
                <div>
                  <div className="text-[10px] text-slate-500">ในแผน / ตั้งงบ</div>
                  <div className="text-sm font-bold font-mono text-slate-900">
                    {activeVillageStats?.totalProjects || villageProjects.length}{' '}
                    <span className="text-[10px] text-blue-700 font-semibold">
                      (ตั้งงบ {activeVillageStats?.budgetedCount || 0})
                    </span>
                  </div>
                </div>
                <div className="w-px h-7 bg-slate-200" />
                <div>
                  <div className="text-[10px] text-slate-500">งบประมาณรวม</div>
                  <div className="text-sm font-bold font-mono text-emerald-700">
                    ฿{(activeVillageStats?.totalBudget || 0).toLocaleString()}
                  </div>
                </div>
                <div className="w-px h-7 bg-slate-200" />
                <div>
                  <div className="text-[10px] text-slate-500 flex items-center justify-between gap-2">
                    <span>ความก้าวหน้าโครงการ</span>
                    <span className="font-mono font-bold text-emerald-700">
                      {activeVillageStats?.completionRate || 0}%
                    </span>
                  </div>
                  <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden flex mt-1">
                    <div
                      style={{
                        width: `${
                          activeVillageStats && activeVillageStats.budgetedCount > 0
                            ? (activeVillageStats.completedCount / activeVillageStats.budgetedCount) * 100
                            : 0
                        }%`
                      }}
                      className="bg-emerald-600 h-full"
                      title={`เสร็จสิ้น: ${activeVillageStats?.completedCount || 0}`}
                    />
                    <div
                      style={{
                        width: `${
                          activeVillageStats && activeVillageStats.budgetedCount > 0
                            ? (activeVillageStats.inProgressCount / activeVillageStats.budgetedCount) * 100
                            : 0
                        }%`
                      }}
                      className="bg-sky-500 h-full"
                      title={`กำลังดำเนิน: ${activeVillageStats?.inProgressCount || 0}`}
                    />
                    <div
                      style={{
                        width: `${
                          activeVillageStats && activeVillageStats.budgetedCount > 0
                            ? (activeVillageStats.cancelledCount / activeVillageStats.budgetedCount) * 100
                            : 0
                        }%`
                      }}
                      className="bg-rose-500 h-full"
                      title={`โอนลด: ${activeVillageStats?.cancelledCount || 0}`}
                    />
                  </div>
                  <div className="flex items-center gap-2 text-[9px] text-slate-500 mt-1 font-mono">
                    <span className="text-emerald-700">✅ {activeVillageStats?.completedCount || 0}</span>
                    <span className="text-sky-700">⏳ {activeVillageStats?.inProgressCount || 0}</span>
                    <span className="text-rose-700">🔴 {activeVillageStats?.cancelledCount || 0}</span>
                    <span className="text-amber-700">🟡 {activeVillageStats?.unbudgetedCount || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Search */}
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="input-search-village-project"
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="ค้นหาชื่อโครงการ, แผนงาน หรือหน่วยงาน..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:bg-white transition-all"
                />
              </div>

              {/* Status & Year & Village Dropdowns */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 text-xs">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-slate-500 text-[11px] whitespace-nowrap">สลับหมู่บ้าน:</span>
                  <select
                    value={activeVillage.villageNumber}
                    onChange={(e) => {
                      const vNum = Number(e.target.value);
                      const targetV = ALL_VILLAGES.find((v) => v.villageNumber === vNum);
                      if (targetV) {
                        const targetZ = SILA_ZONES.find((z) => z.name === targetV.zone);
                        if (targetZ) setSelectedZoneId(targetZ.id);
                        handleSelectVillage(vNum);
                      }
                    }}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 font-medium focus:outline-hidden focus:ring-1 focus:ring-emerald-500 cursor-pointer max-w-[160px] truncate"
                  >
                    {SILA_ZONES.map((zone) => (
                      <optgroup key={zone.id} label={zone.name}>
                        {zone.villages.map((v) => (
                          <option key={v.villageNumber} value={v.villageNumber}>
                            {v.villageName}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                {/* Status Filter Buttons (Requirement 4: Budget & Execution Status) */}
                <div className="inline-flex flex-wrap rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setBudgetStatusFilter('all')}
                    className={`px-3 py-1.5 rounded-lg transition-all font-bold cursor-pointer text-sm min-h-[38px] ${
                      budgetStatusFilter === 'all'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-700 hover:text-slate-950'
                    }`}
                  >
                    ทั้งหมด
                  </button>
                  <button
                    type="button"
                    onClick={() => setBudgetStatusFilter('unbudgeted')}
                    className={`px-3 py-1.5 rounded-lg transition-all font-bold cursor-pointer flex items-center gap-1 text-sm min-h-[38px] ${
                      budgetStatusFilter === 'unbudgeted'
                        ? 'bg-amber-500 text-white shadow-2xs'
                        : 'text-amber-800 hover:text-amber-950'
                    }`}
                  >
                    <span>🟡 ยังไม่ตั้งงบ</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBudgetStatusFilter('budgeted')}
                    className={`px-3 py-1.5 rounded-lg transition-all font-bold cursor-pointer flex items-center gap-1 text-sm min-h-[38px] ${
                      budgetStatusFilter === 'budgeted'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-blue-800 hover:text-blue-950'
                    }`}
                  >
                    <span>🔵 ตั้งงบแล้ว</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBudgetStatusFilter('in_progress')}
                    className={`px-3 py-1.5 rounded-lg transition-all font-bold cursor-pointer flex items-center gap-1 text-sm min-h-[38px] ${
                      budgetStatusFilter === 'in_progress'
                        ? 'bg-sky-600 text-white shadow-2xs'
                        : 'text-sky-800 hover:text-sky-950'
                    }`}
                  >
                    <span>⏳ กำลังทำ</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBudgetStatusFilter('completed')}
                    className={`px-3 py-1.5 rounded-lg transition-all font-bold cursor-pointer flex items-center gap-1 text-sm min-h-[38px] ${
                      budgetStatusFilter === 'completed'
                        ? 'bg-emerald-700 text-white shadow-2xs'
                        : 'text-emerald-800 hover:text-emerald-950'
                    }`}
                  >
                    <span>✅ เสร็จสิ้น</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBudgetStatusFilter('cancelled')}
                    className={`px-3 py-1.5 rounded-lg transition-all font-bold cursor-pointer flex items-center gap-1 text-sm min-h-[38px] ${
                      budgetStatusFilter === 'cancelled'
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'text-rose-800 hover:text-rose-950'
                    }`}
                  >
                    <span>🔴 โอนลด</span>
                  </button>
                </div>

                <select
                  id="select-year-filter"
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="text-sm font-bold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 min-h-[40px] text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="all">ทุกปี พ.ศ.</option>
                  <option value="2571">พ.ศ. 2571</option>
                  <option value="2572">พ.ศ. 2572</option>
                  <option value="2573">พ.ศ. 2573</option>
                  <option value="2574">พ.ศ. 2574</option>
                  <option value="2575">พ.ศ. 2575</option>
                </select>

                {(searchKeyword || budgetStatusFilter !== 'all' || yearFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchKeyword('');
                      setBudgetStatusFilter('all');
                      setYearFilter('all');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer min-h-[40px]"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>ล้างตัวกรอง</span>
                  </button>
                )}
              </div>
            </div>

            {/* Project Table (reusing identical layout and styles from Dashboard/Recent Projects) */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">
                    ตารางโครงการใน {activeVillage.villageName}
                  </h3>
                  <p className="text-base text-slate-600 mt-1">
                    คลิกที่แถวโครงการเพื่อดูรายละเอียด ฉบับแผน และการจัดสรรงบประมาณ
                  </p>
                </div>
                <span className="text-sm font-mono font-bold text-slate-700 bg-slate-100 px-3.5 py-1.5 rounded-full border border-slate-200">
                  พบ {villageProjects.length} รายการ
                </span>
              </div>

              {villageProjects.length === 0 ? (
                <div className="py-12 px-4 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="text-slate-900 font-bold text-base">
                    {searchKeyword || budgetStatusFilter !== 'all' || yearFilter !== 'all'
                      ? 'ไม่พบรายการโครงการตามตัวกรองที่กำหนด'
                      : `ยังไม่มีรายการโครงการที่ระบุพื้นที่ใน ${activeVillage.villageName}`}
                  </div>
                  <p className="text-sm text-slate-600 max-w-md mx-auto">
                    {searchKeyword || budgetStatusFilter !== 'all' || yearFilter !== 'all'
                      ? 'ลองล้างคำค้นหาหรือตัวกรองสถานะ/ปีงบประมาณเพื่อดูโครงการทั้งหมดของหมู่บ้านนี้'
                      : 'ท่านสามารถเพิ่มโครงการใหม่ผ่านแบบ ผ.02 สำหรับหมู่บ้านนี้ หรือกลับไปดูโครงการทั้งหมดในเขต'}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                    {(searchKeyword || budgetStatusFilter !== 'all' || yearFilter !== 'all') && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchKeyword('');
                          setBudgetStatusFilter('all');
                          setYearFilter('all');
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white text-base font-bold rounded-xl cursor-pointer transition-colors shadow-2xs"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>ล้างตัวกรองทั้งหมด</span>
                      </button>
                    )}
                    {onAddNewProject && (
                      <button
                        type="button"
                        onClick={() => onAddNewProject(activeVillage.villageNumber)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-base font-bold rounded-xl cursor-pointer transition-colors shadow-2xs"
                      >
                        <span>+ เพิ่มโครงการสำหรับหมู่บ้านนี้ (ผ.02)</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleGoToLevel2}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-base font-bold rounded-xl cursor-pointer transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>ดูโครงการทั้งหมดใน {activeZone?.name}</span>
                    </button>
                    {onRestoreInitialData && (!projects || projects.length === 0) && (
                      <button
                        type="button"
                        onClick={onRestoreInitialData}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-300 hover:bg-amber-100 text-amber-900 text-base font-bold rounded-xl cursor-pointer transition-colors"
                      >
                        <RotateCcw className="w-4 h-4 text-amber-700" />
                        <span>กู้คืนชุดข้อมูลดั้งเดิม (28 หมู่บ้าน)</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="overflow-auto max-h-[65vh]">
                  <table className="table-fixed w-full text-left text-base border-collapse">
                    <thead>
                      <tr className="bg-[#005242] text-white font-bold sticky top-0 z-10">
                        <th className="py-3.5 px-3 w-14 text-center text-emerald-100 font-bold border-r border-[#003d31] text-base">
                          ที่
                        </th>
                        <th className="py-3.5 px-3 w-24 text-center font-bold border-r border-[#003d31] text-base">
                          ประเภท
                        </th>
                        <th className="py-3.5 px-3 w-[16%] font-bold text-base border-r border-[#003d31]">ประเด็นการพัฒนา</th>
                        <th className="py-3.5 px-3 w-[14%] font-bold text-base border-r border-[#003d31]">แผนงาน</th>
                        <th className="py-3.5 px-3 w-[26%] font-bold text-base border-r border-[#003d31]">ชื่อโครงการ / รายละเอียดเป้าหมาย</th>
                        <th className="py-3.5 px-3 w-[12%] text-center font-bold text-base border-r border-[#003d31]">หน่วยงาน</th>
                        <th className="py-3.5 px-3 w-[13%] text-right font-bold text-base border-r border-[#003d31]">งบประมาณ</th>
                        <th className="py-3.5 px-3 w-48 text-center font-bold text-base">สถานะการดำเนินงาน</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-800">
                      {villageProjects.map((p, idx) => (
                        <tr
                          key={p.id}
                          id={`row-village-project-${p.id}`}
                          onClick={() => onViewProjectDetail(p)}
                          className="hover:bg-emerald-50/50 cursor-pointer transition-colors border-b border-slate-200 last:border-b-0"
                        >
                          {/* 1. ที่ (ลำดับ 1, 2, 3...) */}
                          <td className="py-3 px-3 w-14 text-center font-mono font-bold text-slate-700 whitespace-nowrap bg-slate-50/70 border-r border-slate-200 text-base">
                            {idx + 1}
                          </td>

                          {/* 2. ประเภท */}
                          <td className="py-3 px-3 w-24 text-center whitespace-nowrap border-r border-slate-200">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold ${
                                p.edition === 'first'
                                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                  : p.edition === 'additional'
                                  ? 'bg-sky-100 text-sky-900 border border-sky-300'
                                  : p.edition === 'changed'
                                  ? 'bg-[#f3e8ff] text-[#6b21a8] border border-[#d8b4fe]'
                                  : 'bg-[#fef9c3] text-[#854d0e] border border-[#fde047]'
                              }`}
                            >
                              {p.edition === 'first'
                                ? 'ฉบับแรก'
                                : p.edition === 'additional'
                                ? 'เพิ่มเติม'
                                : p.edition === 'changed'
                                ? 'เปลี่ยนแปลง'
                                : 'แก้ไข'}
                            </span>
                          </td>

                          {/* 3. ประเด็นการพัฒนา */}
                          <td className="py-3 px-3 text-slate-800 border-r border-slate-100 text-base leading-relaxed truncate" title={p.planStrategy}>
                            {p.planStrategy || '-'}
                          </td>

                          {/* 4. แผนงาน */}
                          <td className="py-3 px-3 text-slate-800 border-r border-slate-100 text-base leading-relaxed truncate" title={p.planCategory}>
                            {p.planCategory || '-'}
                          </td>

                          {/* 5. ชื่อโครงการ / รายละเอียดเป้าหมาย */}
                          <td className="py-3 px-3 font-medium text-slate-900 border-r border-slate-100">
                            <div className="font-bold text-slate-950 text-base leading-snug truncate" title={p.name}>{p.name}</div>
                            {p.target && (
                              <div className="text-sm text-slate-600 font-normal leading-normal truncate mt-1" title={`เป้าหมาย: ${p.target}`}>
                                เป้าหมาย: {p.target}
                              </div>
                            )}
                          </td>

                          {/* 6. หน่วยงานรับผิดชอบ */}
                          <td className="py-3 px-3 text-center text-slate-800 border-r border-slate-100 text-base truncate" title={p.department}>
                            {p.department || '-'}
                          </td>

                          {/* 7. งบประมาณ */}
                          <td className="py-3 px-3 text-right font-mono font-bold text-emerald-800 border-r border-slate-100 whitespace-nowrap text-base sm:text-[17px]">
                            ฿{getProjectBudget(p).toLocaleString()}
                          </td>

                          {/* 8. สถานะการตั้งงบประมาณ & การดำเนินงานโครงการ (Requirement 4) */}
                          <td className="py-3 px-3 w-48 text-center whitespace-nowrap">
                            {isProjectBudgetAllocated(p) ? (
                              <div className="flex flex-col items-center gap-1.5">
                                <div className="flex items-center gap-1.5 flex-wrap justify-center">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300">
                                    ตั้งงบแล้ว
                                  </span>
                                  {(() => {
                                    const execSt = getExecutionStatus(p);
                                    const conf = EXECUTION_STATUS_CONFIG[execSt];
                                    return (
                                      <span
                                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${conf.bgClass} ${conf.textClass} ${conf.borderClass}`}
                                        title={conf.description}
                                      >
                                        <span>{conf.icon}</span>
                                        <span>{conf.shortLabel}</span>
                                      </span>
                                    );
                                  })()}
                                </div>

                                {p.executionProgressNote && (
                                  <div className="text-xs text-slate-600 truncate max-w-[170px]" title={p.executionProgressNote}>
                                    "{p.executionProgressNote}"
                                  </div>
                                )}

                                {canUserUpdateExecutionStatus(currentUser, p) && (
                                  <div className="flex items-center gap-1.5 mt-1">
                                    <select
                                      value={getExecutionStatus(p)}
                                      onClick={(e) => e.stopPropagation()}
                                      onChange={(e) => {
                                        e.stopPropagation();
                                        const newStatus = e.target.value as ProjectExecutionStatus;
                                        if (onUpdateProject) {
                                          onUpdateProject(
                                            updateProjectExecutionStatus(
                                              p,
                                              newStatus,
                                              p.executionProgressNote,
                                              currentUser?.fullName || currentUser?.username
                                            )
                                          );
                                        }
                                      }}
                                      className="text-xs bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-800 font-bold focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-2xs"
                                      title="อัปเดตสถานะการดำเนินงานจริง"
                                    >
                                      <option value="in_progress">⏳ กำลังดำเนิน</option>
                                      <option value="completed">✅ เสร็จสิ้น</option>
                                      <option value="cancelled">🔴 โอนลด</option>
                                    </select>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (onUpdateProject) {
                                          onUpdateProject(toggleProjectBudgetAllocation(p));
                                        }
                                      }}
                                      className="text-xs text-slate-500 hover:text-amber-800 underline font-semibold cursor-pointer"
                                      title="คลิกเพื่อสลับกลับเป็นยังไม่ตั้งงบ"
                                    >
                                      คืนสถานะ
                                    </button>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-1">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-950 border border-amber-300">
                                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                                  <span>อยู่ในแผน (ยังไม่ตั้งงบ)</span>
                                </span>
                                {canUpdateStatus && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (onUpdateProject) {
                                        onUpdateProject(toggleProjectBudgetAllocation(p));
                                      }
                                    }}
                                    className="text-xs text-emerald-800 hover:text-emerald-950 font-bold underline cursor-pointer"
                                    title="คลิกเพื่อนำไปตั้งงบประมาณ"
                                  >
                                    + นำไปตั้งงบประมาณ
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
