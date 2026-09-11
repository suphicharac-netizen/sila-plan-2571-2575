import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Search,
  RotateCcw,
  Calendar,
  Building2,
  Clock,
  CheckCircle2,
  Check,
  AlertCircle,
  Coins,
  FileText,
  Filter,
  BarChart2,
  Table as TableIcon,
  Layers,
  Info,
  X
} from 'lucide-react';
import { ProjectData, ActiveNavMenu, ProjectTrackingItem } from '../types';
import { DEVELOPMENT_STRATEGIES, DEPARTMENTS } from '../utils/constants';
import { matchesProjectSearch } from '../utils/projectCode';

interface DashboardOverviewViewProps {
  projects: ProjectData[];
  trackingItems?: ProjectTrackingItem[];
  onNavigateToMenu: (menu: ActiveNavMenu) => void;
  onViewProjectDetail: (project: ProjectData) => void;
}

type GroupByType = 'edition' | 'strategy' | 'category' | 'department';
type ActiveTab = 'overview_budget' | 'department_workload' | 'recent_projects';
type ChartViewMode = 'vertical_bar' | 'horizontal_bar' | 'table';

export const DashboardOverviewView: React.FC<DashboardOverviewViewProps> = ({
  projects,
  trackingItems = [],
  onNavigateToMenu,
  onViewProjectDetail
}) => {
  // Filter States
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedStrategy, setSelectedStrategy] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [budgetFilter, setBudgetFilter] = useState<string>('');

  // Applied Filter States (activated by "ค้นหา")
  const [appliedFilters, setAppliedFilters] = useState({
    year: 'all',
    strategy: 'all',
    department: 'all',
    keyword: '',
    budget: ''
  });

  // Segmentation & Tabs
  const [groupBy, setGroupBy] = useState<GroupByType>('edition');
  const [activeTab, setActiveTab] = useState<ActiveTab>('recent_projects');
  const [chartSortOrder, setChartSortOrder] = useState<'desc' | 'asc' | 'name'>('desc');
  const [chartViewMode, setChartViewMode] = useState<ChartViewMode>('vertical_bar');

  // Selected bar to inspect projects
  const [selectedCategoryModal, setSelectedCategoryModal] = useState<{
    name: string;
    projects: ProjectData[];
  } | null>(null);

  // Handle Search Trigger
  const handleApplySearch = () => {
    setAppliedFilters({
      year: selectedYear,
      strategy: selectedStrategy,
      department: selectedDepartment,
      keyword: searchKeyword.trim(),
      budget: budgetFilter.trim()
    });
  };

  // Handle Reset
  const handleResetFilters = () => {
    setSelectedYear('all');
    setSelectedStrategy('all');
    setSelectedDepartment('all');
    setSearchKeyword('');
    setBudgetFilter('');
    setAppliedFilters({
      year: 'all',
      strategy: 'all',
      department: 'all',
      keyword: '',
      budget: ''
    });
  };

  // Handle Show All
  const handleShowAll = () => {
    handleResetFilters();
  };

  // Compute 5-year budget for a project or specific year
  const getProjectBudget = (p: ProjectData, yearFilter: string): number => {
    if (yearFilter !== 'all' && p.budgetByYear) {
      const yrKey = yearFilter as '2571' | '2572' | '2573' | '2574' | '2575';
      return p.budgetByYear[yrKey] || 0;
    }
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

  // Filter projects based on applied filters
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      // Year filter
      if (appliedFilters.year !== 'all') {
        const amtInYear = getProjectBudget(p, appliedFilters.year);
        if (amtInYear <= 0 && p.year !== appliedFilters.year) {
          return false;
        }
      }

      // Strategy filter
      if (
        appliedFilters.strategy !== 'all' &&
        p.planStrategy !== appliedFilters.strategy
      ) {
        return false;
      }

      // Department filter
      if (
        appliedFilters.department !== 'all' &&
        p.department !== appliedFilters.department
      ) {
        return false;
      }

      // Keyword search (รองรับค้นหาด้วยรหัส ID ใหม่ ป.X-แผนงาน-XXX, ชื่อโครงการ, วัตถุประสงค์)
      if (appliedFilters.keyword) {
        if (!matchesProjectSearch(appliedFilters.keyword, p)) return false;
      }

      // Budget search
      if (appliedFilters.budget) {
        const budgetNum = parseFloat(appliedFilters.budget.replace(/,/g, ''));
        if (!isNaN(budgetNum)) {
          const pBudget = getProjectBudget(p, appliedFilters.year);
          if (pBudget < budgetNum) return false;
        }
      }

      return true;
    });
  }, [projects, appliedFilters]);

  // Overall KPI metrics
  const totalProjectsCount = filteredProjects.length;

  // Execution status distribution
  const statusStats = useMemo(() => {
    let completed = 0;
    let inProgress = 0;
    let notStarted = 0;

    filteredProjects.forEach((p) => {
      const trk = trackingItems.find((t) => t.projectId === p.id);
      const st = trk ? trk.status : p.executionStatus || 'not_started';

      if (st === 'completed') {
        completed++;
      } else if (st === 'in_progress') {
        inProgress++;
      } else {
        notStarted++;
      }
    });

    const total = totalProjectsCount || 1;
    return {
      completed,
      completedPct: Math.round((completed / total) * 100),
      inProgress,
      inProgressPct: Math.round((inProgress / total) * 100),
      notStarted,
      notStartedPct: Math.round((notStarted / total) * 100)
    };
  }, [filteredProjects, trackingItems, totalProjectsCount]);

  // Total 5-year budget
  const total5YearBudget = useMemo(() => {
    return filteredProjects.reduce((sum, p) => sum + getProjectBudget(p, appliedFilters.year), 0);
  }, [filteredProjects, appliedFilters.year]);

  // Average budget per project
  const avgBudgetPerProject = totalProjectsCount > 0 ? Math.round(total5YearBudget / totalProjectsCount) : 0;

  // Yearly Distribution (2571 - 2575)
  const yearlyDistribution = useMemo(() => {
    const years = ['2571', '2572', '2573', '2574', '2575'] as const;
    const yearSums: Record<string, number> = {
      '2571': 0,
      '2572': 0,
      '2573': 0,
      '2574': 0,
      '2575': 0
    };

    filteredProjects.forEach((p) => {
      years.forEach((yr) => {
        if (p.budgetByYear && p.budgetByYear[yr]) {
          yearSums[yr] += p.budgetByYear[yr] || 0;
        } else if (p.year === yr && (!p.budgetByYear || Object.values(p.budgetByYear).every((v) => !v))) {
          yearSums[yr] += p.budgetPlan || 0;
        }
      });
    });

    const grandTotal = Object.values(yearSums).reduce((a, b) => a + b, 0) || 1;

    return years.map((yr) => {
      const amount = yearSums[yr];
      const pct = Math.round((amount / grandTotal) * 100);
      return {
        year: yr,
        amount,
        percentage: pct
      };
    });
  }, [filteredProjects]);

  // Grouped Data for the Chart based on `groupBy`
  const chartData = useMemo(() => {
    type GroupItem = {
      key: string;
      label: string;
      amount: number;
      count: number;
      percentage: number;
      color: string;
      projects: ProjectData[];
    };

    const colorPalette = [
      '#059669', // emerald
      '#7c3aed', // purple
      '#0284c7', // sky
      '#f59e0b', // amber
      '#ec4899', // pink
      '#10b981', // green
      '#6366f1', // indigo
      '#84cc16'  // lime
    ];

    if (groupBy === 'edition') {
      const editions: { key: ProjectData['edition']; label: string; color: string }[] = [
        { key: 'first', label: 'ฉบับแรก', color: '#059669' },
        { key: 'changed', label: 'เปลี่ยนแปลง', color: '#7c3aed' },
        { key: 'additional', label: 'เพิ่มเติม', color: '#0284c7' },
        { key: 'amended', label: 'แก้ไข', color: '#f59e0b' }
      ];

      const groups: GroupItem[] = editions.map((ed) => {
        const prjs = filteredProjects.filter((p) => p.edition === ed.key);
        const amount = prjs.reduce((s, p) => s + getProjectBudget(p, appliedFilters.year), 0);
        return {
          key: ed.key,
          label: ed.label,
          amount,
          count: prjs.length,
          percentage: 0,
          color: ed.color,
          projects: prjs
        };
      });

      const totalAmt = groups.reduce((s, g) => s + g.amount, 0) || 1;
      groups.forEach((g) => {
        g.percentage = Number(((g.amount / totalAmt) * 100).toFixed(1));
      });

      return groups;
    }

    if (groupBy === 'strategy') {
      const map: Record<string, ProjectData[]> = {};
      filteredProjects.forEach((p) => {
        const strat = p.planStrategy || 'ไม่ระบุยุทธศาสตร์';
        if (!map[strat]) map[strat] = [];
        map[strat].push(p);
      });

      const totalAmt = total5YearBudget || 1;
      const groups: GroupItem[] = Object.keys(map).map((k, idx) => {
        const prjs = map[k];
        const amount = prjs.reduce((s, p) => s + getProjectBudget(p, appliedFilters.year), 0);
        return {
          key: k,
          label: k,
          amount,
          count: prjs.length,
          percentage: Number(((amount / totalAmt) * 100).toFixed(1)),
          color: colorPalette[idx % colorPalette.length],
          projects: prjs
        };
      });

      return groups;
    }

    if (groupBy === 'category') {
      const map: Record<string, ProjectData[]> = {};
      filteredProjects.forEach((p) => {
        const cat = p.planCategory || 'ไม่ระบุแผนงาน';
        if (!map[cat]) map[cat] = [];
        map[cat].push(p);
      });

      const totalAmt = total5YearBudget || 1;
      const groups: GroupItem[] = Object.keys(map).map((k, idx) => {
        const prjs = map[k];
        const amount = prjs.reduce((s, p) => s + getProjectBudget(p, appliedFilters.year), 0);
        return {
          key: k,
          label: k,
          amount,
          count: prjs.length,
          percentage: Number(((amount / totalAmt) * 100).toFixed(1)),
          color: colorPalette[idx % colorPalette.length],
          projects: prjs
        };
      });

      return groups;
    }

    // groupBy === 'department'
    const map: Record<string, ProjectData[]> = {};
    filteredProjects.forEach((p) => {
      const dept = p.department || 'ไม่ระบุหน่วยงาน';
      if (!map[dept]) map[dept] = [];
      map[dept].push(p);
    });

    const totalAmt = total5YearBudget || 1;
    const groups: GroupItem[] = Object.keys(map).map((k, idx) => {
      const prjs = map[k];
      const amount = prjs.reduce((s, p) => s + getProjectBudget(p, appliedFilters.year), 0);
      return {
        key: k,
        label: k,
        amount,
        count: prjs.length,
        percentage: Number(((amount / totalAmt) * 100).toFixed(1)),
        color: colorPalette[idx % colorPalette.length],
        projects: prjs
      };
    });

    return groups;
  }, [filteredProjects, groupBy, appliedFilters.year, total5YearBudget]);

  // Sorted chart data based on chartSortOrder
  const sortedChartData = useMemo(() => {
    const list = [...chartData];
    if (chartSortOrder === 'desc') {
      list.sort((a, b) => b.amount - a.amount);
    } else if (chartSortOrder === 'asc') {
      list.sort((a, b) => a.amount - b.amount);
    } else if (chartSortOrder === 'name') {
      list.sort((a, b) => a.label.localeCompare(b.label, 'th'));
    }
    return list;
  }, [chartData, chartSortOrder]);

  // Max amount for scaling chart
  const maxChartAmount = useMemo(() => {
    const maxVal = Math.max(...chartData.map((d) => d.amount), 0);
    return maxVal > 0 ? maxVal : 1;
  }, [chartData]);

  // Highest category
  const highestCategory = useMemo(() => {
    if (chartData.length === 0) return null;
    const highest = [...chartData].sort((a, b) => b.amount - a.amount)[0];
    return highest;
  }, [chartData]);

  // Sorted recent projects (highest order number first, matching image ID 10 down to 1)
  const sortedRecentProjects = useMemo(() => {
    return [...filteredProjects].sort((a, b) => (b.orderNumber || 0) - (a.orderNumber || 0));
  }, [filteredProjects]);

  return (
    <div className="flex-1 flex flex-col bg-slate-50 h-full min-h-0 overflow-hidden">
      {/* Top Banner Bar - Exactly matching reference screenshot */}
      <header className="bg-[#055740] text-white px-4 py-2 sm:px-5 shadow-xs flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          {/* Logo badge "ศิลา" */}
          <div className="px-2 py-0.5 rounded bg-[#086d50] border border-emerald-400/30 text-white font-bold text-xs tracking-wider shrink-0 shadow-xs select-none">
            ศิลา
          </div>
          <h1 className="text-xs sm:text-sm font-semibold tracking-wide text-emerald-50 truncate">
            หน้าหลักภาพรวมและสถิติ (Dashboard) <span className="mx-1 text-emerald-300/60">|</span> ระบบแผนพัฒนาเทศบาลเมืองศิลา <span className="mx-1 text-emerald-300/60">|</span> เทศบาลเมืองศิลา จ.ขอนแก่น
          </h1>
        </div>
      </header>

      <div className="flex-1 min-h-0 flex flex-col p-2.5 sm:p-3 space-y-2 w-full overflow-hidden">
        {/* Filter & Toolbar Card (Card 1) */}
        <div className="bg-white border border-slate-200 rounded-xl p-2.5 sm:p-3 shadow-xs space-y-2 shrink-0">
          {/* Row 1: ปีงบประมาณ Dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-700 shrink-0">ปีงบประมาณ:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1 text-slate-800 font-medium focus:ring-1 focus:ring-emerald-600 focus:outline-none cursor-pointer"
            >
              <option value="all">ทั้งหมด (2571-2575)</option>
              <option value="2571">พ.ศ. 2571</option>
              <option value="2572">พ.ศ. 2572</option>
              <option value="2573">พ.ศ. 2573</option>
              <option value="2574">พ.ศ. 2574</option>
              <option value="2575">พ.ศ. 2575</option>
            </select>
          </div>

          {/* Row 2: 4-Column Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
            {/* Field 1: ประเด็นการพัฒนา */}
            <div>
              <label className="block text-slate-600 font-medium mb-0.5 text-[11px]">ประเด็นการพัฒนา</label>
              <select
                value={selectedStrategy}
                onChange={(e) => setSelectedStrategy(e.target.value)}
                title={selectedStrategy === 'all' ? '-- ทุกประเด็นการพัฒนา --' : selectedStrategy}
                className="w-full bg-slate-50 border border-slate-300 rounded-md px-2 py-1 text-slate-700 truncate focus:ring-1 focus:ring-emerald-600 focus:outline-none cursor-pointer text-xs"
              >
                <option value="all">-- ทุกประเด็นการพัฒนา --</option>
                {DEVELOPMENT_STRATEGIES.map((st) => (
                  <option key={st} value={st} title={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Field 2: หน่วยงานรับผิดชอบหลัก */}
            <div>
              <label className="block text-slate-600 font-medium mb-0.5 text-[11px]">หน่วยงานรับผิดชอบหลัก</label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                title={selectedDepartment === 'all' ? '-- ทุกหน่วยงาน --' : selectedDepartment}
                className="w-full bg-slate-50 border border-slate-300 rounded-md px-2 py-1 text-slate-700 truncate focus:ring-1 focus:ring-emerald-600 focus:outline-none cursor-pointer text-xs"
              >
                <option value="all">-- ทุกหน่วยงาน --</option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept} title={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Field 3: ชื่อโครงการ / คำค้นหา */}
            <div>
              <label className="block text-slate-600 font-medium mb-0.5 text-[11px]">ชื่อโครงการ / คำค้นหา</label>
              <div className="relative">
                <Search className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplySearch()}
                  placeholder="ค้นหารหัส ID, ชื่อโครงการ..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-md pl-7 pr-2 py-1 text-slate-800 placeholder-slate-400 focus:ring-1 focus:ring-emerald-600 focus:outline-none text-xs"
                />
              </div>
            </div>

            {/* Field 4: งบประมาณ (บาท) */}
            <div>
              <label className="block text-slate-600 font-medium mb-0.5 text-[11px]">งบประมาณ (บาท)</label>
              <input
                type="text"
                value={budgetFilter}
                onChange={(e) => setBudgetFilter(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApplySearch()}
                placeholder="ระบุจำนวนเงิน..."
                className="w-full bg-slate-50 border border-slate-300 rounded-md px-2 py-1 text-slate-800 placeholder-slate-400 focus:ring-1 focus:ring-emerald-600 focus:outline-none font-mono text-xs"
              />
            </div>
          </div>

          {/* Row 3: Actions & Segmentation & View Tabs */}
          <div className="pt-1.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            {/* Left: Action Buttons + Segmented Button */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={handleApplySearch}
                className="inline-flex items-center gap-1 px-3 py-1 bg-[#055740] hover:bg-[#044834] text-white font-medium rounded-md shadow-xs transition-colors cursor-pointer text-xs"
              >
                <Search className="w-3 h-3" />
                <span>ค้นหา</span>
              </button>

              <button
                onClick={handleShowAll}
                className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-md transition-colors cursor-pointer text-xs"
              >
                <Layers className="w-3 h-3 text-slate-500" />
                <span>แสดงทั้งหมด</span>
              </button>

              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-amber-300 hover:bg-amber-50 text-amber-700 font-medium rounded-md transition-colors cursor-pointer text-xs"
              >
                <RotateCcw className="w-3 h-3 text-amber-600" />
                <span>เริ่มใหม่</span>
              </button>

              {/* Segmented Toggles */}
              <div className="flex items-center gap-1 pl-2 ml-1 border-l border-slate-200">
                <span className="text-slate-500 text-[11px] mr-1 hidden sm:inline">จำแนกตาม:</span>
                <div className="inline-flex rounded-md border border-slate-200 p-0.5 bg-slate-50">
                  <button
                    onClick={() => setGroupBy('edition')}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                      groupBy === 'edition'
                        ? 'bg-[#055740] text-white shadow-xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ประเภทโครงการ
                  </button>
                  <button
                    onClick={() => setGroupBy('strategy')}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                      groupBy === 'strategy'
                        ? 'bg-[#055740] text-white shadow-xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ประเด็นยุทธศาสตร์
                  </button>
                  <button
                    onClick={() => setGroupBy('category')}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                      groupBy === 'category'
                        ? 'bg-[#055740] text-white shadow-xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    แผนงาน
                  </button>
                  <button
                    onClick={() => setGroupBy('department')}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                      groupBy === 'department'
                        ? 'bg-[#055740] text-white shadow-xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    สำนัก/กอง
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Date pill & View tabs */}
            <div className="flex items-center gap-1.5">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-md text-[11px]">
                <Calendar className="w-3 h-3 text-slate-500" />
                <span>
                  {appliedFilters.year === 'all'
                    ? 'รวม 5 ปี (2571-2575)'
                    : `พ.ศ. ${appliedFilters.year}`}
                </span>
              </div>

              <div className="inline-flex rounded-md border border-slate-200 p-0.5 bg-slate-50">
                <button
                  onClick={() => setActiveTab('overview_budget')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                    activeTab === 'overview_budget'
                      ? 'bg-[#055740] text-white shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <BarChart3 className="w-3 h-3" />
                  <span>ภาพรวม & งบประมาณ</span>
                </button>
                <button
                  onClick={() => setActiveTab('department_workload')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                    activeTab === 'department_workload'
                      ? 'bg-[#055740] text-white shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Building2 className="w-3 h-3" />
                  <span>หน่วยงาน & ภาระงาน</span>
                </button>
                <button
                  onClick={() => setActiveTab('recent_projects')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                    activeTab === 'recent_projects'
                      ? 'bg-[#055740] text-white shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  <span>โครงการล่าสุด</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 5 KPI Metric Summary Cards (Card 2) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 shrink-0">
          {/* Card 1: โครงการทั้งหมดในแผน */}
          <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs flex items-center justify-between">
            <div className="min-w-0">
              <div className="text-[11px] text-slate-500 font-medium truncate">โครงการทั้งหมดในแผน</div>
              <div className="text-base sm:text-lg font-bold font-mono text-slate-900 mt-0.5 leading-tight">
                {totalProjectsCount}
              </div>
              <div className="text-[10px] text-slate-400">
                (ทุกฉบับรวมกัน)
              </div>
            </div>
            <div className="w-7 h-7 rounded-full bg-sky-50 border border-sky-200/60 flex items-center justify-center shrink-0">
              <Layers className="w-3.5 h-3.5 text-sky-600" />
            </div>
          </div>

          {/* Card 2: เสร็จสิ้น / บรรลุผล */}
          <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs flex items-center justify-between">
            <div className="min-w-0">
              <div className="text-[11px] text-slate-500 font-medium truncate">เสร็จสิ้น / บรรลุผล</div>
              <div className="text-base sm:text-lg font-bold font-mono text-emerald-600 mt-0.5 leading-tight">
                {statusStats.completed} <span className="text-xs font-semibold">({statusStats.completedPct}%)</span>
              </div>
              <div className="text-[10px] text-emerald-600/80">
                (ดำเนินการแล้วเสร็จ)
              </div>
            </div>
            <div className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            </div>
          </div>

          {/* Card 3: กำลังดำเนินการ */}
          <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs flex items-center justify-between">
            <div className="min-w-0">
              <div className="text-[11px] text-slate-500 font-medium truncate">กำลังดำเนินการ</div>
              <div className="text-base sm:text-lg font-bold font-mono text-amber-600 mt-0.5 leading-tight">
                {statusStats.inProgress} <span className="text-xs font-semibold">({statusStats.inProgressPct}%)</span>
              </div>
              <div className="text-[10px] text-amber-600/80">
                (อยู่ระหว่างดำเนินการ)
              </div>
            </div>
            <div className="w-7 h-7 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
            </div>
          </div>

          {/* Card 4: ไม่ดำเนินการ / รอจัดสรร */}
          <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs flex items-center justify-between">
            <div className="min-w-0">
              <div className="text-[11px] text-slate-500 font-medium truncate">ไม่ดำเนินการ / รอจัดสรร</div>
              <div className="text-base sm:text-lg font-bold font-mono text-rose-600 mt-0.5 leading-tight">
                {statusStats.notStarted} <span className="text-xs font-semibold">({statusStats.notStartedPct}%)</span>
              </div>
              <div className="text-[10px] text-rose-500/80">
                (ยังไม่ได้เริ่มดำเนินการ)
              </div>
            </div>
            <div className="w-7 h-7 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
              <span className="w-3.5 h-3.5 rounded-full border-2 border-dotted border-rose-500" />
            </div>
          </div>

          {/* Card 5: งบรวม 5 ปี (Dark themed as shown in image) */}
          <div className="bg-[#032e28] border border-[#064e3b] text-white rounded-xl p-2.5 shadow-xs flex items-center justify-between col-span-2 sm:col-span-1">
            <div className="min-w-0">
              <div className="text-[11px] text-emerald-300 font-medium truncate">
                {appliedFilters.year === 'all' ? 'งบรวม 5 ปี (2571-2575)' : `งบรวมปี ${appliedFilters.year}`}
              </div>
              <div className="text-sm sm:text-base font-bold font-mono text-white mt-0.5 tracking-tight truncate">
                {total5YearBudget.toLocaleString()} บาท
              </div>
              <div className="text-[10px] text-emerald-300/80 truncate">
                {appliedFilters.year === 'all'
                  ? '(งบรวม 5 ปี ทุกโครงการในแผน)'
                  : `(งบประมาณปี ${appliedFilters.year})`}
              </div>
            </div>
            <div className="w-7 h-7 rounded-full bg-[#064e3b] border border-emerald-600/40 flex items-center justify-center shrink-0">
              <Coins className="w-4 h-4 text-emerald-300" />
            </div>
          </div>
        </div>

        {/* Tab 1: ภาพรวม & งบประมาณ */}
        {activeTab === 'overview_budget' && (
          <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1">
            {/* Chart Card (Card 3) */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-800 text-sm">กราฟสรุปยอดรวมงบประมาณ</h3>
                </div>

                <div className="flex items-center gap-2">
                  {/* Sort dropdown */}
                  <div className="relative">
                    <select
                      value={chartSortOrder}
                      onChange={(e) => setChartSortOrder(e.target.value as any)}
                      className="text-xs bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-6 py-1 text-slate-700 font-medium focus:outline-none cursor-pointer"
                    >
                      <option value="desc">↑↓ เรียง: งบประมาณมากไปน้อย</option>
                      <option value="asc">↑↓ เรียง: งบประมาณน้อยไปมาก</option>
                      <option value="name">↑↓ เรียง: ตามชื่อหมวด</option>
                    </select>
                  </div>

                  {/* View mode icons */}
                  <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
                    <button
                      onClick={() => setChartViewMode('vertical_bar')}
                      title="แท่งแนวตั้ง"
                      className={`p-1 rounded cursor-pointer transition-colors ${
                        chartViewMode === 'vertical_bar'
                          ? 'bg-white shadow-xs text-emerald-700'
                          : 'text-slate-400 hover:text-slate-700'
                      }`}
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setChartViewMode('horizontal_bar')}
                      title="แท่งแนวนอน"
                      className={`p-1 rounded cursor-pointer transition-colors ${
                        chartViewMode === 'horizontal_bar'
                          ? 'bg-white shadow-xs text-emerald-700'
                          : 'text-slate-400 hover:text-slate-700'
                      }`}
                    >
                      <BarChart2 className="w-3.5 h-3.5 rotate-90" />
                    </button>
                    <button
                      onClick={() => setChartViewMode('table')}
                      title="ตารางข้อมูล"
                      className={`p-1 rounded cursor-pointer transition-colors ${
                        chartViewMode === 'table'
                          ? 'bg-white shadow-xs text-emerald-700'
                          : 'text-slate-400 hover:text-slate-700'
                      }`}
                    >
                      <TableIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Sub-KPI stats row (4 boxes inside chart card) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
                <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3">
                  <div className="text-[11px] text-slate-500">ยอดงบประมาณรวม (5 ปี)</div>
                  <div className="text-base sm:text-lg font-bold font-mono text-emerald-700 mt-0.5">
                    ฿{total5YearBudget.toLocaleString()}
                  </div>
                </div>

                <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3">
                  <div className="text-[11px] text-slate-500">จำนวนโครงการทั้งหมด</div>
                  <div className="text-base sm:text-lg font-bold font-mono text-slate-800 mt-0.5">
                    {totalProjectsCount} โครงการ
                  </div>
                </div>

                <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3">
                  <div className="text-[11px] text-slate-500">หมวดที่ใช้งบประมาณสูงสุด</div>
                  <div className="text-xs sm:text-sm font-bold text-slate-800 truncate mt-0.5">
                    {highestCategory ? highestCategory.label : '-'}
                  </div>
                  {highestCategory && (
                    <div className="text-[11px] font-semibold text-emerald-600">
                      {highestCategory.percentage}% (฿{(highestCategory.amount / 1000000).toFixed(2)} ลบ.)
                    </div>
                  )}
                </div>

                <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3">
                  <div className="text-[11px] text-slate-500">งบประมาณเฉลี่ยต่อโครงการ</div>
                  <div className="text-base sm:text-lg font-bold font-mono text-slate-800 mt-0.5">
                    ฿{avgBudgetPerProject.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Chart Scale & Subtitle info */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2 px-1">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Info className="w-3.5 h-3.5 text-emerald-600" />
                  <span>หน่วย: บาท (คลิกที่แท่งกราฟเพื่อดูรายชื่อโครงการ)</span>
                </div>
                <div>
                  สเกลสูงสุด: ฿{maxChartAmount.toLocaleString()}
                </div>
              </div>

              {/* Chart Body */}
              {chartViewMode === 'vertical_bar' && (
                <div className="pt-8 pb-4 px-2 border-t border-slate-100">
                  <div className="h-64 sm:h-72 w-full flex items-end justify-around gap-2 sm:gap-6 border-b border-slate-200 relative pb-1">
                    {/* Dotted grid lines */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40">
                      <div className="border-b border-dashed border-slate-300 w-full" />
                      <div className="border-b border-dashed border-slate-300 w-full" />
                      <div className="border-b border-dashed border-slate-300 w-full" />
                      <div className="border-b border-dashed border-slate-300 w-full" />
                    </div>

                    {/* Bars */}
                    {sortedChartData.map((item) => {
                      // Calculate height percentage relative to max
                      const heightPercent = Math.max(
                        Math.round((item.amount / maxChartAmount) * 100),
                        item.amount > 0 ? 4 : 0
                      );

                      return (
                        <div
                          key={item.key}
                          onClick={() =>
                            setSelectedCategoryModal({
                              name: item.label,
                              projects: item.projects
                            })
                          }
                          className="flex-1 max-w-[120px] flex flex-col items-center justify-end h-full group cursor-pointer relative z-10"
                        >
                          {/* Value at top of bar */}
                          <div className="text-center mb-1 transition-transform group-hover:-translate-y-1">
                            <div className="text-[11px] sm:text-xs font-bold font-mono text-slate-800">
                              {(item.amount / 1000000).toFixed(2)} ลบ.
                            </div>
                            <div className="text-[10px] text-slate-500 font-semibold">
                              {item.percentage}%
                            </div>
                          </div>

                          {/* Bar Cylinder */}
                          <div className="w-full max-w-[56px] bg-slate-100 rounded-t-sm relative flex items-end justify-center overflow-hidden h-full">
                            <div
                              style={{
                                height: `${heightPercent}%`,
                                backgroundColor: item.color
                              }}
                              className="w-full rounded-t-sm transition-all duration-500 ease-out group-hover:brightness-110 shadow-xs"
                            />
                          </div>

                          {/* Bottom Labels */}
                          <div className="text-center mt-2.5">
                            <div className="text-xs font-bold text-slate-800 truncate max-w-[110px]" title={item.label}>
                              {item.label}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              {item.count} โครงการ
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Horizontal Bar View */}
              {chartViewMode === 'horizontal_bar' && (
                <div className="py-4 space-y-3">
                  {sortedChartData.map((item) => {
                    const widthPct = Math.max(
                      Math.round((item.amount / maxChartAmount) * 100),
                      item.amount > 0 ? 2 : 0
                    );
                    return (
                      <div
                        key={item.key}
                        onClick={() =>
                          setSelectedCategoryModal({
                            name: item.label,
                            projects: item.projects
                          })
                        }
                        className="p-2.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-bold text-slate-800">{item.label} ({item.count} โครงการ)</span>
                          <span className="font-mono font-semibold text-slate-900">
                            ฿{item.amount.toLocaleString()} ({item.percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                          <div
                            style={{
                              width: `${widthPct}%`,
                              backgroundColor: item.color
                            }}
                            className="h-full rounded-full transition-all duration-500"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Table View */}
              {chartViewMode === 'table' && (
                <div className="overflow-x-auto my-3 border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                        <th className="py-2.5 px-3">หมวดหมู่ / รายการ</th>
                        <th className="py-2.5 px-3 text-center">จำนวนโครงการ</th>
                        <th className="py-2.5 px-3 text-right">งบประมาณรวม</th>
                        <th className="py-2.5 px-3 text-right">สัดส่วน (%)</th>
                        <th className="py-2.5 px-3 text-center">ดูโครงการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {sortedChartData.map((item) => (
                        <tr key={item.key} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-medium flex items-center gap-2">
                            <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: item.color }} />
                            <span>{item.label}</span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono">{item.count}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold">
                            ฿{item.amount.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-emerald-700 font-semibold">
                            {item.percentage}%
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              onClick={() =>
                                setSelectedCategoryModal({
                                  name: item.label,
                                  projects: item.projects
                                })
                              }
                              className="text-emerald-700 hover:text-emerald-900 text-[11px] underline cursor-pointer"
                            >
                              แสดง ({item.count})
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Timeline Card: การกระจายงบประมาณตามปี พ.ศ. (2571 - 2575) (Card 4) */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              {/* Header */}
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 text-xs">
                <div className="flex items-center gap-2 font-bold text-slate-800">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>การกระจายงบประมาณตามปี พ.ศ. (2571 - 2575)</span>
                </div>
                <div className="text-slate-500 font-mono">
                  รวม {total5YearBudget.toLocaleString()} บาท
                </div>
              </div>

              {/* 5-Year Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-3">
                {yearlyDistribution.map((item) => (
                  <div key={item.year} className="bg-slate-50/70 border border-slate-100 rounded-lg p-2.5">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-700">พ.ศ. {item.year}</span>
                      <span className="text-[11px] font-bold text-emerald-700">{item.percentage}%</span>
                    </div>
                    <div className="font-mono text-xs font-bold text-slate-900 mb-1.5">
                      {item.amount.toLocaleString()} บ.
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${item.percentage}%` }}
                        className="bg-emerald-600 h-full rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: หน่วยงาน & ภาระงาน */}
        {activeTab === 'department_workload' && (
          <div className="flex-1 min-h-0 bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex flex-col overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-slate-800 text-xs sm:text-sm">ภาระงานและการจัดสรรงบประมาณแยกตามสำนัก/กอง</h3>
              </div>
              <span className="text-xs text-slate-500">
                รวมทั้งหมด {DEPARTMENTS.length} หน่วยงาน
              </span>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-2.5 pr-1">
              {DEPARTMENTS.map((dept) => {
                const deptPrjs = filteredProjects.filter((p) => p.department === dept);
                const deptBudget = deptPrjs.reduce((s, p) => s + getProjectBudget(p, appliedFilters.year), 0);
                const completedCount = deptPrjs.filter((p) => p.executionStatus === 'completed').length;
                const inProgCount = deptPrjs.filter((p) => p.executionStatus === 'in_progress').length;

                return (
                  <div key={dept} className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 text-xs truncate">{dept}</h4>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {deptPrjs.length} โครงการตามแผน
                        </div>
                      </div>
                      <span className="font-mono font-bold text-emerald-700 text-xs shrink-0">
                        ฿{deptBudget.toLocaleString()}
                      </span>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                      <span className="text-emerald-700">เสร็จสิ้น {completedCount}</span>
                      <span className="text-amber-700">กำลังทำ {inProgCount}</span>
                      <button
                        onClick={() =>
                          setSelectedCategoryModal({
                            name: `หน่วยงาน: ${dept}`,
                            projects: deptPrjs
                          })
                        }
                        className="text-emerald-700 hover:underline font-medium cursor-pointer"
                      >
                        ดูรายการ
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: โครงการล่าสุด */}
        {activeTab === 'recent_projects' && (
          <div className="flex-1 min-h-0 bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex flex-col overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="font-bold text-slate-800 text-xs sm:text-sm">รายการโครงการล่าสุด</h3>
                <p className="text-[11px] text-slate-500">
                  คลิกที่แถวของโครงการเพื่อดูหรือแก้ไขข้อมูล
                </p>
              </div>
              <button
                onClick={() => onNavigateToMenu('edition_first')}
                className="text-xs font-medium text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>ดูในแผน ผ.02 ทั้งหมด</span>
                <span>&gt;</span>
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-auto border border-slate-200 rounded-lg mt-2">
              <table className="table-fixed w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#0e533c] text-white font-semibold sticky top-0 z-10">
                    <th className="py-2 px-2.5 w-12 text-center text-emerald-100 font-medium border-r border-[#0a4230]">ที่</th>
                    <th className="py-2 px-2.5 w-20 text-center font-semibold border-r border-[#0a4230]">ประเภท</th>
                    <th className="py-2 px-2.5 w-[16%] font-semibold">ประเด็นการพัฒนา</th>
                    <th className="py-2 px-2.5 w-[14%] font-semibold">แผนงาน</th>
                    <th className="py-2 px-2.5 w-[28%] font-semibold">ชื่อโครงการ / รายละเอียดเป้าหมาย</th>
                    <th className="py-2 px-2.5 w-[12%] text-center font-semibold">หน่วยงาน</th>
                    <th className="py-2 px-2.5 w-[12%] text-right font-semibold">งบประมาณ</th>
                    <th className="py-2 px-2.5 w-20 text-center font-semibold">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {sortedRecentProjects.map((p, idx) => (
                    <tr
                      key={p.id}
                      onClick={() => onViewProjectDetail(p)}
                      className="hover:bg-emerald-50/40 cursor-pointer transition-colors border-b border-slate-100 last:border-b-0"
                    >
                      {/* 1. ที่ (ลำดับ 1, 2, 3...) */}
                      <td className="py-2 px-2.5 w-12 text-center font-mono font-medium text-slate-500 whitespace-nowrap bg-slate-50/50 border-r border-slate-100">
                        {idx + 1}
                      </td>

                      {/* 2. ประเภท */}
                      <td className="py-2 px-2.5 w-20 text-center whitespace-nowrap border-r border-slate-100">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${
                            p.edition === 'first'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : p.edition === 'additional'
                              ? 'bg-sky-50 text-sky-700 border border-sky-200'
                              : p.edition === 'changed'
                              ? 'bg-[#f5eeff] text-[#7e22ce] border border-[#d8b4fe]'
                              : 'bg-[#fef9c3] text-[#a16207] border border-[#fde047]'
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
                      <td className="py-2 px-2.5 text-slate-600 truncate" title={p.planStrategy}>
                        {p.planStrategy || '-'}
                      </td>

                      {/* 4. แผนงาน */}
                      <td className="py-2 px-2.5 text-slate-600 truncate" title={p.planCategory}>
                        {p.planCategory || '-'}
                      </td>

                      {/* 5. ชื่อโครงการ / รายละเอียดเป้าหมาย */}
                      <td className="py-2 px-2.5 font-medium text-slate-800">
                        <div className="font-semibold text-slate-900 truncate" title={p.name}>{p.name}</div>
                        {p.target && (
                          <div className="text-[11px] text-slate-500 font-normal truncate mt-0.5" title={`เป้าหมาย: ${p.target}`}>
                            เป้าหมาย: {p.target}
                          </div>
                        )}
                      </td>

                      {/* 6. หน่วยงานรับผิดชอบ */}
                      <td className="py-2 px-2.5 text-center text-slate-700 truncate" title={p.department}>
                        {p.department || '-'}
                      </td>

                      {/* 7. งบประมาณ */}
                      <td className="py-2 px-2.5 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                        ฿{getProjectBudget(p, appliedFilters.year).toLocaleString()}
                      </td>

                      {/* 8. สถานะ */}
                      <td className="py-2 px-2.5 w-20 text-center whitespace-nowrap">
                        {p.executionStatus === 'completed' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0]">
                            <Check className="w-2.5 h-2.5" />
                            <span>เสร็จสิ้น</span>
                          </span>
                        ) : p.executionStatus === 'in_progress' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#fffbeb] text-[#d97706] border border-[#fde68a]">
                            <Clock className="w-2.5 h-2.5" />
                            <span>กำลังทำ</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#fff1f2] text-[#e11d48] border border-[#fecdd3]">
                            <span className="inline-block w-2 h-2 rounded-full border-2 border-dotted border-[#e11d48]" />
                            <span>ไม่ทำ</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Category Project Inspection (Opens when clicking any bar on the chart) */}
      {selectedCategoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-[#055740] text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">
                  รายการโครงการในหมวด: {selectedCategoryModal.name}
                </h3>
                <p className="text-xs text-emerald-200 mt-0.5">
                  พบ {selectedCategoryModal.projects.length} โครงการ | งบประมาณรวม ฿
                  {selectedCategoryModal.projects
                    .reduce((s, p) => s + getProjectBudget(p, appliedFilters.year), 0)
                    .toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedCategoryModal(null)}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal List */}
            <div className="p-4 overflow-y-auto divide-y divide-slate-100 flex-1 space-y-2">
              {selectedCategoryModal.projects.map((p, idx) => (
                <div
                  key={p.id}
                  onClick={() => {
                    setSelectedCategoryModal(null);
                    onViewProjectDetail(p);
                  }}
                  className="py-2.5 px-3 rounded-lg hover:bg-emerald-50/50 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-400">#{idx + 1}</span>
                      {p.code && (
                        <span className="font-mono text-emerald-800 font-bold bg-emerald-50 text-[10px] px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">
                          {p.code}
                        </span>
                      )}
                      <h4 className="font-semibold text-slate-900 text-xs truncate">{p.name}</h4>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {p.department} • {p.planCategory}
                      {p.edition === 'changed' && p.originalProjectName && (
                        <span className="block text-[10px] text-purple-700 mt-0.5">
                          เดิม: {p.originalProjectName}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono font-bold text-emerald-800 text-xs">
                      ฿{getProjectBudget(p, appliedFilters.year).toLocaleString()}
                    </div>
                    <span
                      className={`inline-block mt-0.5 px-1.5 py-0.2 rounded text-[10px] ${
                        p.executionStatus === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : p.executionStatus === 'in_progress'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {p.executionStatus === 'completed'
                        ? 'เสร็จสิ้น'
                        : p.executionStatus === 'in_progress'
                        ? 'กำลังทำ'
                        : 'รอจัดสรร'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedCategoryModal(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium rounded-lg cursor-pointer transition-colors"
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
