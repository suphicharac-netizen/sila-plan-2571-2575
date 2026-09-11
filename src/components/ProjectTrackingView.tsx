import React, { useState, useMemo } from 'react';
import {
  Activity,
  Search,
  FolderOpen,
  RotateCcw,
  Download,
  Share2,
  Plus,
  Printer,
  FileText,
  LayoutGrid,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Circle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Calendar,
  Building2,
  Coins,
  FileCheck,
  Sparkles,
  Info
} from 'lucide-react';
import { ProjectData, ProjectTrackingItem, TrackingStatus } from '../types';
import { DEVELOPMENT_STRATEGIES, DEPARTMENTS, BUDGET_SOURCES } from '../utils/constants';
import { matchesProjectSearch, getProjectDisplayId } from '../utils/projectCode';

interface ProjectTrackingViewProps {
  trackingItems: ProjectTrackingItem[];
  allProjects: ProjectData[];
  onSaveTrackingItems: (items: ProjectTrackingItem[]) => void;
  onOpenProjectDetail?: (project: ProjectData) => void;
}

export const ProjectTrackingView: React.FC<ProjectTrackingViewProps> = ({
  trackingItems,
  allProjects,
  onSaveTrackingItems,
  onOpenProjectDetail
}) => {
  // Filters
  const [selectedYear, setSelectedYear] = useState<string>('2571');
  const [selectedStrategy, setSelectedStrategy] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [budgetFilter, setBudgetFilter] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Modals state
  const [isPullModalOpen, setIsPullModalOpen] = useState<boolean>(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<ProjectTrackingItem | null>(null);
  const [viewingItem, setViewingItem] = useState<ProjectTrackingItem | null>(null);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState<boolean>(false);

  // New tracking form state matching the requested UI design
  const [formYear, setFormYear] = useState<string>('2571');
  const [formStrategy, setFormStrategy] = useState<string>(DEVELOPMENT_STRATEGIES[0]);
  const [formName, setFormName] = useState<string>('');
  const [formObjective, setFormObjective] = useState<string>('');
  const [formTarget, setFormTarget] = useState<string>('');
  const [formStatus, setFormStatus] = useState<TrackingStatus>('not_started');
  const [formProgress, setFormProgress] = useState<number>(0);
  const [formStartDate, setFormStartDate] = useState<string>('09/03/2026');
  const [formEndDate, setFormEndDate] = useState<string>('');
  const [formDepartment, setFormDepartment] = useState<string>(DEPARTMENTS[0]);
  const [formResponsiblePerson, setFormResponsiblePerson] = useState<string>(DEPARTMENTS[0]);
  const [formBudgetSource, setFormBudgetSource] = useState<string>('เทศบัญญัติงบประมาณรายจ่าย');
  const [formNote, setFormNote] = useState<string>('');
  const [formBudgetApproved, setFormBudgetApproved] = useState<number>(0);

  // Financial & Budget Tracking states
  const [formInitialBudget, setFormInitialBudget] = useState<number>(0);
  const [formTransferIn, setFormTransferIn] = useState<number>(0);
  const [formTransferOut, setFormTransferOut] = useState<number>(0);
  const [formContractBudget, setFormContractBudget] = useState<number>(0);
  const [formDisbursedAmount, setFormDisbursedAmount] = useState<number>(0);

  // Computed Financial & Budget values
  const formNetBudget = (formInitialBudget || 0) + (formTransferIn || 0) - (formTransferOut || 0);
  const formRemainingBudget = Math.max(0, formNetBudget - (formDisbursedAmount || 0));

  // Quick project picker modal/dialog inside the new tracking item form
  const [isInnerProjectPickerOpen, setIsInnerProjectPickerOpen] = useState<boolean>(false);
  const [pickerSearch, setPickerSearch] = useState<string>('');
  const [pickerPage, setPickerPage] = useState<number>(1);
  const PICKER_PAGE_SIZE = 4; // 3-4 items per page for compact layout without scrollbar

  // Filtered projects for picker
  const filteredPickerProjects = useMemo(() => {
    return allProjects.filter((p) => {
      if (!pickerSearch.trim()) return true;
      return matchesProjectSearch(pickerSearch, p);
    });
  }, [allProjects, pickerSearch]);

  const totalPickerPages = Math.max(1, Math.ceil(filteredPickerProjects.length / PICKER_PAGE_SIZE));
  const paginatedPickerProjects = useMemo(() => {
    const start = (pickerPage - 1) * PICKER_PAGE_SIZE;
    return filteredPickerProjects.slice(start, start + PICKER_PAGE_SIZE);
  }, [filteredPickerProjects, pickerPage]);

  // Selected projects to pull
  const [selectedPullProjectIds, setSelectedPullProjectIds] = useState<string[]>([]);

  // Standard strategies
  const strategies = useMemo(() => {
    return DEVELOPMENT_STRATEGIES;
  }, []);

  // Standard departments
  const departments = useMemo(() => {
    return DEPARTMENTS;
  }, []);

  // Filtered tracking items
  const filteredItems = useMemo(() => {
    return trackingItems.filter((item) => {
      if (selectedYear !== 'all' && item.year !== selectedYear) return false;
      if (selectedStrategy && item.planStrategy !== selectedStrategy) return false;
      if (selectedDepartment && item.department !== selectedDepartment) return false;
      if (searchKeyword.trim()) {
        if (!matchesProjectSearch(searchKeyword, item as any)) return false;
      }
      if (budgetFilter) {
        const num = parseFloat(budgetFilter.replace(/,/g, ''));
        if (!isNaN(num) && item.budgetApproved < num) return false;
      }
      return true;
    });
  }, [trackingItems, selectedYear, selectedStrategy, selectedDepartment, searchKeyword, budgetFilter]);

  // KPI Calculations based on filteredItems
  const totalTracked = filteredItems.length;
  const avgProgress = totalTracked > 0
    ? Math.round(filteredItems.reduce((sum, item) => sum + (item.progressPercent || 0), 0) / totalTracked)
    : 0;

  const countCompleted = filteredItems.filter((i) => i.status === 'completed').length;
  const countInProgress = filteredItems.filter((i) => i.status === 'in_progress').length;
  const countDelayed = filteredItems.filter((i) => i.status === 'delayed').length;
  const countNotStarted = filteredItems.filter((i) => i.status === 'not_started').length;

  const pctCompleted = totalTracked > 0 ? Math.round((countCompleted / totalTracked) * 100) : 0;
  const pctInProgress = totalTracked > 0 ? Math.round((countInProgress / totalTracked) * 100) : 0;
  const pctDelayed = totalTracked > 0 ? Math.round((countDelayed / totalTracked) * 100) : 0;
  const pctNotStarted = totalTracked > 0 ? Math.round((countNotStarted / totalTracked) * 100) : 0;

  // Reset filters
  const handleResetFilters = () => {
    setSelectedYear('2571');
    setSelectedStrategy('');
    setSelectedDepartment('');
    setSearchKeyword('');
    setBudgetFilter('');
  };

  // Show all (clear filters except year)
  const handleShowAll = () => {
    setSelectedStrategy('');
    setSelectedDepartment('');
    setSearchKeyword('');
    setBudgetFilter('');
  };

  // Delete tracking item
  const handleDeleteItem = (id: string) => {
    if (window.confirm('คุณต้องการลบรายการติดตามโครงการนี้ใช่หรือไม่?')) {
      const updated = trackingItems.filter((item) => item.id !== id);
      onSaveTrackingItems(updated);
    }
  };

  // Save edited tracking item
  const handleSaveEdit = (updatedItem: ProjectTrackingItem) => {
    const updated = trackingItems.map((item) =>
      item.id === updatedItem.id ? updatedItem : item
    );
    onSaveTrackingItems(updated);
    setEditingItem(null);
  };

  // Pull projects from approved budget
  const handlePullProjects = () => {
    if (selectedPullProjectIds.length === 0) return;

    const existingProjectIds = new Set(trackingItems.map((t) => t.projectId).filter(Boolean));
    const newItems: ProjectTrackingItem[] = [];

    selectedPullProjectIds.forEach((pid, idx) => {
      if (!existingProjectIds.has(pid)) {
        const p = allProjects.find((proj) => proj.id === pid);
        if (p) {
          newItems.push({
            id: `TRK-${p.year}-${Date.now()}-${idx}`,
            projectId: p.id,
            orderNumber: trackingItems.length + newItems.length + 1,
            code: p.code,
            name: p.name,
            planStrategy: p.planStrategy,
            planCategory: p.planCategory,
            objective: p.objective || '',
            target: p.target || '',
            department: p.department,
            budgetSource: p.budgetSource && p.budgetSource !== '- ยังไม่ได้จัดสรร -'
              ? p.budgetSource
              : 'เทศบัญญัติงบประมาณรายจ่าย',
            budgetApproved: p.budgetApproved > 0 ? p.budgetApproved : p.budgetPlan,
            contractBudget: null,
            disbursedAmount: null,
            progressPercent: 0,
            status: 'not_started',
            year: p.year
          });
        }
      }
    });

    if (newItems.length > 0) {
      onSaveTrackingItems([...trackingItems, ...newItems]);
    }
    setIsPullModalOpen(false);
    setSelectedPullProjectIds([]);
  };

  // Create single tracking item from the new form
  const handleCreateTrackingItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      return;
    }

    const net = (formInitialBudget || 0) + (formTransferIn || 0) - (formTransferOut || 0);
    const remaining = Math.max(0, net - (formDisbursedAmount || 0));

    const newItem: ProjectTrackingItem = {
      id: `TRK-${formYear}-${Date.now()}`,
      orderNumber: trackingItems.length + 1,
      name: formName.trim(),
      planStrategy: formStrategy,
      objective: formObjective.trim(),
      target: formTarget.trim(),
      department: formDepartment,
      responsiblePerson: formResponsiblePerson.trim(),
      budgetSource: formBudgetSource,
      budgetApproved: net > 0 ? net : (formInitialBudget || formBudgetApproved),
      initialBudget: formInitialBudget,
      transferIn: formTransferIn,
      transferOut: formTransferOut,
      netBudget: net,
      contractBudget: formContractBudget > 0 ? formContractBudget : null,
      disbursedAmount: formDisbursedAmount > 0 ? formDisbursedAmount : 0,
      remainingBudget: remaining,
      progressPercent: formProgress,
      status: formStatus,
      startDate: formStartDate.trim(),
      endDate: formEndDate.trim(),
      note: formNote.trim(),
      year: formYear
    };

    onSaveTrackingItems([...trackingItems, newItem]);
    setIsAddModalOpen(false);

    // Reset form fields
    setFormName('');
    setFormObjective('');
    setFormTarget('');
    setFormProgress(0);
    setFormStatus('not_started');
    setFormNote('');
    setFormBudgetApproved(0);
    setFormInitialBudget(0);
    setFormTransferIn(0);
    setFormTransferOut(0);
    setFormContractBudget(0);
    setFormDisbursedAmount(0);
  };

  // Export handlers
  const handleExportCSV = () => {
    const headers = [
      'ID',
      'โครงการ',
      'ยุทธศาสตร์/ประเด็นการพัฒนา',
      'วัตถุประสงค์',
      'เป้าหมาย',
      'หน่วยงาน',
      'แหล่งที่มา',
      'งบประมาณที่อนุมัติ',
      'งบตามสัญญา',
      'เบิกจ่าย (บาท)',
      'คงเหลือ (บาท)',
      'วันที่เริ่มต้น',
      'วันที่สิ้นสุด',
      'ความคืบหน้า (%)',
      'สถานะ'
    ];
    const rows = filteredItems.map((item, idx) => {
      const remaining = Math.max(0, (item.budgetApproved || 0) - (item.disbursedAmount || 0));
      return [
        `"${getProjectDisplayId(item, item.orderNumber || idx + 1)}"`,
        `"${item.name.replace(/"/g, '""')}"`,
        `"${item.planStrategy.replace(/"/g, '""')}"`,
        `"${(item.objective || '').replace(/"/g, '""')}"`,
        `"${(item.target || '').replace(/"/g, '""')}"`,
        `"${item.department}"`,
        `"${item.budgetSource}"`,
        item.budgetApproved,
        item.contractBudget ?? '-',
        item.disbursedAmount ?? 0,
        remaining,
        item.startDate || '2026-09-02',
        item.endDate || '2029-09-30',
        `${item.progressPercent}%`,
        item.status === 'completed'
          ? 'ดำเนินการแล้วเสร็จ'
          : item.status === 'in_progress'
          ? 'อยู่ระหว่างดำเนินการ'
          : item.status === 'delayed'
          ? 'ล่าช้ากว่าแผน'
          : 'ยังไม่เริ่มดำเนินการ'
      ];
    });
    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `project_tracking_${selectedYear}.csv`;
    a.click();
    setIsExportDropdownOpen(false);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 h-full min-h-0 overflow-hidden">
      {/* Top Banner Header */}
      <header className="bg-[#055740] text-white px-4 py-2 sm:px-6 shadow-xs flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-[#086d50] flex items-center justify-center shrink-0">
            <Activity className="w-4 h-4 text-emerald-100" />
          </div>
          <h1 className="text-xs sm:text-sm font-bold tracking-tight">
            <span className="text-white">ระบบติดตามโครงการ</span>
            <span className="mx-2 text-emerald-300/60 font-normal">|</span>
            <span className="font-normal text-emerald-100 text-xs">
              ระบบแผนพัฒนาเทศบาลเมืองศิลา
            </span>
            <span className="mx-2 text-emerald-300/60 font-normal">|</span>
            <span className="font-normal text-emerald-100 text-xs">
              เทศบาลเมืองศิลา จ.ขอนแก่น
            </span>
          </h1>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-3">
        {/* Filters Box */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
          {/* Year selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">ปีงบประมาณ:</span>
            <div className="relative">
              <select
                id="filter-tracking-year"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1 text-xs font-semibold bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="2571">พ.ศ. 2571</option>
                <option value="2572">พ.ศ. 2572</option>
                <option value="2573">พ.ศ. 2573</option>
                <option value="2574">พ.ศ. 2574</option>
                <option value="2575">พ.ศ. 2575</option>
                <option value="all">ทุกปีงบประมาณ</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* 4 Form Filter Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. ประเด็นการพัฒนา */}
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                ประเด็นการพัฒนา
              </label>
              <div className="relative">
                <select
                  id="filter-strategy"
                  value={selectedStrategy}
                  onChange={(e) => setSelectedStrategy(e.target.value)}
                  title={selectedStrategy || '-- ทุกประเด็นการพัฒนา --'}
                  className="w-full appearance-none pl-3 pr-8 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer truncate"
                >
                  <option value="">-- ทุกประเด็นการพัฒนา --</option>
                  {strategies.map((strat) => (
                    <option key={strat} value={strat} title={strat}>
                      {strat}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* 2. ผู้รับผิดชอบ */}
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                ผู้รับผิดชอบ
              </label>
              <div className="relative">
                <select
                  id="filter-department"
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  title={selectedDepartment || '-- ทุกหน่วยงาน --'}
                  className="w-full appearance-none pl-3 pr-8 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer truncate"
                >
                  <option value="">-- ทุกหน่วยงาน --</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept} title={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* 3. ค้นหาชื่อโครงการ */}
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                ค้นหาชื่อโครงการ
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="filter-search-name"
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="ค้นหารหัส ID (เช่น ป.1-โยธา-001), ชื่อโครงการ..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* 4. งบประมาณ (บาท) */}
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                งบประมาณ (บาท)
              </label>
              <input
                id="filter-budget-amount"
                type="text"
                value={budgetFilter}
                onChange={(e) => setBudgetFilter(e.target.value)}
                placeholder="ระบุจำนวนเงิน..."
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
              />
            </div>
          </div>

          {/* Action buttons row */}
          <div className="pt-2 flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-t border-slate-100">
            {/* Left buttons */}
            <div className="flex items-center flex-wrap gap-2">
              <button
                id="btn-tracking-search"
                type="button"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#059669] hover:bg-[#047857] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>ค้นหา</span>
              </button>

              <button
                id="btn-tracking-show-all"
                type="button"
                onClick={handleShowAll}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                <FolderOpen className="w-3.5 h-3.5 text-slate-500" />
                <span>แสดงทั้งหมด</span>
              </button>

              <button
                id="btn-tracking-reset"
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                <span>เริ่มใหม่</span>
              </button>

              <div className="flex items-center gap-1.5 text-xs text-slate-700 ml-1">
                <span>รายการโครงการ ({filteredItems.length} รายการ)</span>
                <span className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-600 rounded-md border border-slate-200">
                  ผลการกรอง
                </span>
              </div>
            </div>

            {/* Right buttons */}
            <div className="flex items-center flex-wrap gap-2">
              {/* Export dropdown */}
              <div className="relative">
                <button
                  id="btn-tracking-export"
                  type="button"
                  onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#055740] hover:bg-[#044835] text-white text-xs font-medium rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ส่งออกข้อมูล</span>
                  <span className="bg-[#086d50] text-emerald-100 text-[10px] px-1.5 py-0.2 rounded font-mono">
                    {filteredItems.length}
                  </span>
                  <ChevronDown className="w-3 h-3" />
                </button>

                {isExportDropdownOpen && (
                  <div className="absolute right-0 mt-1 w-44 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-30 animate-in fade-in duration-100">
                    <button
                      type="button"
                      onClick={handleExportCSV}
                      className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-emerald-600" />
                      <span>ส่งออก Excel / CSV</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        window.print();
                        setIsExportDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-blue-600" />
                      <span>พิมพ์รายงาน PDF</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Pull from approved budget */}
              <button
                id="btn-tracking-pull-approved"
                type="button"
                onClick={() => setIsPullModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#ecfdf5] border border-[#a7f3d0] hover:bg-[#d1fae5] text-[#065f46] text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-[#059669]" />
                <span>ดึงจากโครงการที่อนุมัติงบ ({allProjects.length})</span>
              </button>

              {/* Add tracking item */}
              <button
                id="btn-tracking-add"
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#059669] hover:bg-[#047857] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มรายการติดตาม</span>
              </button>

              {/* Print report */}
              <button
                id="btn-tracking-print"
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>พิมพ์รายงาน</span>
              </button>

              {/* View Toggle */}
              <div className="inline-flex items-center rounded-lg border border-slate-200 p-0.5 bg-white">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    viewMode === 'table'
                      ? 'border border-emerald-500 bg-emerald-50/50 text-emerald-700'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>ตาราง</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    viewMode === 'cards'
                      ? 'border border-emerald-500 bg-emerald-50/50 text-emerald-700'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>การ์ด</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 6 KPI Metric Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Card 1: โครงการที่ติดตามทั้งหมด */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
              <span>โครงการที่ติดตามทั้งหมด</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-bold font-mono text-slate-900">
                {totalTracked}
              </span>
              <span className="text-xs text-slate-400">รายการ</span>
            </div>
          </div>

          {/* Card 2: ความคืบหน้าเฉลี่ยรวม */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-col justify-between">
            <div className="text-xs text-slate-600 font-medium">
              ความคืบหน้าเฉลี่ยรวม
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold font-mono text-[#059669]">
                {avgProgress}%
              </div>
              <div className="w-full bg-[#d1fae5] h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="bg-[#059669] h-full rounded-full transition-all duration-300"
                  style={{ width: `${avgProgress}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Card 3: ดำเนินการแล้วเสร็จ */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
              <span>ดำเนินการแล้วเสร็จ</span>
              <CheckCircle2 className="w-4 h-4 text-[#16a34a]" />
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-bold font-mono text-slate-900">
                {countCompleted}
              </span>
              <span className="text-xs font-semibold text-[#16a34a] font-mono">
                {pctCompleted}%
              </span>
            </div>
          </div>

          {/* Card 4: อยู่ระหว่างดำเนินการ */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
              <span>อยู่ระหว่างดำเนินการ</span>
              <Clock className="w-4 h-4 text-[#2563eb]" />
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-bold font-mono text-slate-900">
                {countInProgress}
              </span>
              <span className="text-xs font-semibold text-[#2563eb] font-mono">
                {pctInProgress}%
              </span>
            </div>
          </div>

          {/* Card 5: ล่าช้ากว่าแผน */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
              <span>ล่าช้ากว่าแผน</span>
              <AlertTriangle className="w-4 h-4 text-[#d97706]" />
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-bold font-mono text-slate-900">
                {countDelayed}
              </span>
              <span className="text-xs font-semibold text-[#d97706] font-mono">
                {pctDelayed}%
              </span>
            </div>
          </div>

          {/* Card 6: ยังไม่เริ่มดำเนินการ */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
              <span>ยังไม่เริ่มดำเนินการ</span>
              <Circle className="w-3.5 h-3.5 text-slate-400 fill-slate-400" />
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-bold font-mono text-slate-900">
                {countNotStarted}
              </span>
              <span className="text-xs font-semibold text-slate-500 font-mono">
                {pctNotStarted}%
              </span>
            </div>
          </div>
        </div>

        {/* View Content: Table or Cards */}
        {viewMode === 'table' ? (
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-auto max-h-[60vh]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#054e3b] text-white text-xs font-semibold sticky top-0 z-10">
                    <th className="py-3 px-3 text-center w-28 font-medium">ID</th>
                    <th className="py-3 px-3 text-center w-24">จัดการ</th>
                    <th className="py-3 px-4 min-w-[260px]">โครงการ</th>
                    <th className="py-3 px-4 min-w-[180px]">วัตถุประสงค์</th>
                    <th className="py-3 px-4 min-w-[240px]">
                      รายละเอียดโครงการ (เป้าหมาย / ผลผลิต / กิจกรรมสำคัญ)
                    </th>
                    <th className="py-3 px-3 text-center min-w-[100px]">หน่วยงาน</th>
                    <th className="py-3 px-3 text-center min-w-[170px]">แหล่งที่มา</th>
                    <th className="py-3 px-4 text-right min-w-[130px]">งบประมาณที่อนุมัติ</th>
                    <th className="py-3 px-3 text-center min-w-[100px]">งบตามสัญญา</th>
                    <th className="py-3 px-3 text-center min-w-[100px]">เบิกจ่าย (บาท)</th>
                    <th className="py-3 px-3 text-center min-w-[110px]">คงเหลือ (บาท)</th>
                    <th className="py-3 px-3 text-center min-w-[110px]">วันที่เริ่มต้น</th>
                    <th className="py-3 px-3 text-center min-w-[110px]">วันที่สิ้นสุด</th>
                    <th className="py-3 px-3 text-center min-w-[90px]">ร้อยละ (%)</th>
                    <th className="py-3 px-3 text-center min-w-[140px]">สถานะการดำเนินงาน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={15} className="py-8 text-center text-slate-400">
                        ไม่พบรายการโครงการที่ติดตามตามเงื่อนไขที่เลือก
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item, idx) => {
                      const remaining = Math.max(
                        0,
                        (item.budgetApproved || 0) - (item.disbursedAmount || 0)
                      );
                      const displayStartDate = item.startDate || '2026-09-02';
                      const displayEndDate = item.endDate || '2029-09-30';

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* ID */}
                          <td className="py-3.5 px-3 text-center w-28 font-mono text-emerald-800 font-medium whitespace-nowrap bg-emerald-50/20">
                            {getProjectDisplayId(item, item.orderNumber || idx + 1)}
                          </td>

                          {/* จัดการ (Eye, Edit, Trash) */}
                          <td className="py-3.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setViewingItem(item);
                                  const linkedProj = allProjects.find((p) => p.id === item.projectId);
                                  if (linkedProj && onOpenProjectDetail) {
                                    onOpenProjectDetail(linkedProj);
                                  }
                                }}
                                className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50 border border-emerald-200 transition-colors cursor-pointer"
                                title="ดูรายละเอียดโครงการ"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingItem(item)}
                                className="p-1 rounded-md text-blue-600 hover:bg-blue-50 border border-blue-200 transition-colors cursor-pointer"
                                title="แก้ไขข้อมูลติดตาม"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteItem(item.id)}
                                className="p-1 rounded-md text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                                title="ลบรายการติดตาม"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>

                          {/* โครงการ */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 leading-snug flex items-center gap-1.5 flex-wrap">
                              {item.code && (
                                <span className="font-mono text-emerald-800 font-bold bg-emerald-50 text-[11px] px-1.5 py-0.5 rounded border border-emerald-200/80">
                                  {item.code}
                                </span>
                              )}
                              <span>{item.name}</span>
                            </div>
                            <div className="text-[11px] text-emerald-700 mt-1 font-normal line-clamp-1">
                              ประเด็น: {item.planStrategy}
                            </div>
                          </td>

                          {/* วัตถุประสงค์ */}
                          <td className="py-3.5 px-4 text-slate-700 leading-relaxed">
                            {item.objective || '-'}
                          </td>

                          {/* รายละเอียดโครงการ */}
                          <td className="py-3.5 px-4 text-slate-700 leading-relaxed">
                            {item.target || '-'}
                          </td>

                          {/* หน่วยงาน */}
                          <td className="py-3.5 px-3 text-center text-slate-700 font-medium">
                            {item.department}
                          </td>

                          {/* แหล่งที่มา */}
                          <td className="py-3.5 px-3 text-center">
                            <span className="inline-block px-2.5 py-1 text-[11px] font-medium bg-slate-50 text-slate-700 border border-slate-200 rounded-md">
                              {item.budgetSource}
                            </span>
                          </td>

                          {/* งบประมาณที่อนุมัติ */}
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                            {item.budgetApproved > 0
                              ? item.budgetApproved.toLocaleString()
                              : '-'}
                          </td>

                          {/* งบตามสัญญา */}
                          <td className="py-3.5 px-3 text-center font-mono text-indigo-600 font-medium">
                            {item.contractBudget !== null &&
                            item.contractBudget !== undefined &&
                            item.contractBudget > 0
                              ? item.contractBudget.toLocaleString()
                              : '-'}
                          </td>

                          {/* เบิกจ่าย (บาท) */}
                          <td className="py-3.5 px-3 text-center font-mono font-bold text-emerald-600">
                            {(item.disbursedAmount || 0).toLocaleString()}
                          </td>

                          {/* คงเหลือ (บาท) */}
                          <td className="py-3.5 px-3 text-center font-mono font-bold text-amber-700">
                            {remaining.toLocaleString()}
                          </td>

                          {/* วันที่เริ่มต้น */}
                          <td className="py-3.5 px-3 text-center font-mono text-slate-600">
                            {displayStartDate}
                          </td>

                          {/* วันที่สิ้นสุด */}
                          <td className="py-3.5 px-3 text-center font-mono text-slate-600">
                            {displayEndDate}
                          </td>

                          {/* ร้อยละ (%) */}
                          <td className="py-3.5 px-3 text-center font-mono font-bold text-emerald-600">
                            {item.progressPercent || 0}%
                          </td>

                          {/* สถานะการดำเนินงาน */}
                          <td className="py-3.5 px-3 text-center whitespace-nowrap">
                            {item.status === 'completed' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                ดำเนินการแล้วเสร็จ
                              </span>
                            ) : item.status === 'in_progress' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                                อยู่ระหว่างดำเนินการ
                              </span>
                            ) : item.status === 'delayed' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                ล่าช้ากว่าแผน
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                ยังไม่เริ่มดำเนินการ
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination and Summary footer */}
            <div className="p-3.5 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span>หน้าละ:</span>
                  <select
                    defaultValue="20"
                    className="border border-slate-300 rounded px-2 py-1 text-xs bg-white text-slate-700"
                  >
                    <option value="10">10 รายการ</option>
                    <option value="20">20 รายการ</option>
                    <option value="50">50 รายการ</option>
                  </select>
                </div>
                <div className="flex items-center gap-1.5">
                  <span>หน้าที่:</span>
                  <select
                    defaultValue="1"
                    className="border border-slate-300 rounded px-2 py-1 text-xs bg-white text-slate-700"
                  >
                    <option value="1">1 จาก 1</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span>
                  1 ถึง {filteredItems.length} จาก {filteredItems.length} รายการ
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled
                    className="px-2 py-1 border border-slate-200 rounded text-slate-300 cursor-not-allowed text-xs"
                  >
                    &laquo;
                  </button>
                  <button
                    type="button"
                    disabled
                    className="px-2 py-1 border border-slate-200 rounded text-slate-300 cursor-not-allowed text-xs"
                  >
                    &lsaquo;
                  </button>
                  <button
                    type="button"
                    disabled
                    className="px-2 py-1 border border-slate-200 rounded text-slate-300 cursor-not-allowed text-xs"
                  >
                    &rsaquo;
                  </button>
                  <button
                    type="button"
                    disabled
                    className="px-2 py-1 border border-slate-200 rounded text-slate-300 cursor-not-allowed text-xs"
                  >
                    &raquo;
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Cards View Mode */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredItems.map((item, idx) => (
              <div
                key={item.id}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-mono font-semibold text-slate-400 mr-2">
                      #{idx + 1}
                    </span>
                    {item.code && (
                      <span className="font-mono text-emerald-800 font-bold bg-emerald-50 text-[10px] px-1.5 py-0.5 rounded border border-emerald-200/80 mr-1.5 inline-block">
                        {item.code}
                      </span>
                    )}
                    <span className="text-xs font-bold text-slate-900">{item.name}</span>
                    <div className="text-[11px] text-emerald-700 mt-0.5">
                      {item.planStrategy}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setViewingItem(item)}
                      className="p-1 rounded text-emerald-600 hover:bg-emerald-50 border border-emerald-200"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingItem(item)}
                      className="p-1 rounded text-blue-600 hover:bg-blue-50 border border-blue-200"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1 rounded text-rose-600 hover:bg-rose-50 border border-rose-200"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div>
                    <span className="text-slate-500 text-[11px] block">หน่วยงาน</span>
                    <span className="font-semibold text-slate-800">{item.department}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] block">แหล่งที่มา</span>
                    <span className="font-semibold text-slate-800">{item.budgetSource}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] block">งบอนุมัติ</span>
                    <span className="font-mono font-bold text-slate-900">
                      ฿{item.budgetApproved.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] block">คงเหลือ</span>
                    <span className="font-mono font-bold text-amber-700">
                      ฿{Math.max(0, (item.budgetApproved || 0) - (item.disbursedAmount || 0)).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] block">ระยะเวลาดำเนินงาน</span>
                    <span className="font-mono text-slate-600 text-[11px]">
                      {item.startDate || '2026-09-02'} ถึง {item.endDate || '2029-09-30'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] block">ความคืบหน้า</span>
                    <span className="font-mono font-bold text-emerald-600">
                      {item.progressPercent || 0}%
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">สถานะ:</span>
                  {item.status === 'completed' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      ดำเนินการแล้วเสร็จ
                    </span>
                  ) : item.status === 'in_progress' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                      อยู่ระหว่างดำเนินการ
                    </span>
                  ) : item.status === 'delayed' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      ล่าช้ากว่าแผน
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                      ยังไม่เริ่มดำเนินการ
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL 1: Pull from Approved Budget */}
      {isPullModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-[#055740] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-emerald-200" />
                <h3 className="font-bold text-base text-white">
                  ดึงโครงการจากระบบอนุมัติงบประมาณ ({allProjects.length} โครงการ)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPullModalOpen(false)}
                className="text-emerald-100 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
              <p className="text-xs text-slate-600">
                เลือกโครงการที่ต้องการนำเข้าสู่ระบบติดตามและประเมินผลโครงการ (แผน ผ.03):
              </p>

              <div className="space-y-2">
                {allProjects.map((p) => {
                  const isAlreadyTracked = trackingItems.some((t) => t.projectId === p.id);
                  const isSelected = selectedPullProjectIds.includes(p.id);

                  return (
                    <label
                      key={p.id}
                      className={`flex items-start gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                        isAlreadyTracked
                          ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                          : isSelected
                          ? 'bg-emerald-50/60 border-emerald-400'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        disabled={isAlreadyTracked}
                        checked={isSelected || isAlreadyTracked}
                        onChange={(e) => {
                          if (isAlreadyTracked) return;
                          if (e.target.checked) {
                            setSelectedPullProjectIds([...selectedPullProjectIds, p.id]);
                          } else {
                            setSelectedPullProjectIds(
                              selectedPullProjectIds.filter((id) => id !== p.id)
                            );
                          }
                        }}
                        className="mt-1 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                          {p.code && (
                            <span className="font-mono text-emerald-800 font-bold bg-emerald-50 text-[10px] px-1.5 py-0.5 rounded border border-emerald-200/80">
                              {p.code}
                            </span>
                          )}
                          <span>{p.name}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {p.department} • {p.planStrategy}
                        </div>
                        <div className="text-[11px] font-mono font-semibold text-emerald-700 mt-1">
                          งบประมาณ:{' '}
                          {p.budgetApproved > 0
                            ? `฿${p.budgetApproved.toLocaleString()} (อนุมัติแล้ว)`
                            : `฿${p.budgetPlan.toLocaleString()} (ตามแผน)`}
                        </div>
                      </div>
                      {isAlreadyTracked && (
                        <span className="px-2 py-0.5 text-[10px] font-medium bg-slate-200 text-slate-600 rounded">
                          นำเข้าแล้ว
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsPullModalOpen(false)}
                className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handlePullProjects}
                disabled={selectedPullProjectIds.length === 0}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg cursor-pointer"
              >
                นำเข้าที่เลือก ({selectedPullProjectIds.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Add New Tracking Item (Compact single-screen layout without vertical scrollbar) */}
      {isAddModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-hidden"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full h-auto max-h-[92vh] overflow-hidden border border-slate-700/20 my-auto flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Emerald Header */}
            <div className="px-5 py-2.5 bg-[#055740] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#086d50] flex items-center justify-center text-white shrink-0 shadow-xs">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white leading-tight">
                    บันทึกข้อมูลติดตามโครงการใหม่
                  </h3>
                  <p className="text-[11px] text-emerald-100/80 font-normal">
                    กรอกข้อมูลติดตามผลการดำเนินงานและปัญหาอุปสรรค
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-[#086d50] transition-colors cursor-pointer"
                title="ปิด"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body & Form */}
            <form
              onSubmit={handleCreateTrackingItem}
              className="p-3.5 sm:p-4 space-y-2.5 flex-1 overflow-hidden text-xs"
            >
              {/* Quick Pull Banner Card */}
              <div className="border border-emerald-300 bg-[#f0fdf4] rounded-xl p-2 px-3 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                    <Sparkles className="w-3.5 h-3.5 text-[#059669]" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-emerald-950 text-xs truncate">
                      ดึงข้อมูลจากโครงการที่ได้รับอนุมัติงบประมาณ
                    </div>
                    <div className="text-[11px] text-emerald-700 truncate">
                      คลิกเพื่อเลือกโครงการในแผนที่อนุมัติงบ ระบบจะใส่อัตโนมัติ
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPickerSearch('');
                    setPickerPage(1);
                    setIsInnerProjectPickerOpen(true);
                  }}
                  className="bg-[#059669] hover:bg-[#047857] text-white text-xs font-semibold px-3 py-1 rounded-lg transition-colors cursor-pointer shrink-0 shadow-xs flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>เลือกโครงการ</span>
                </button>
              </div>

              {/* Row 1: ปีงบ (พ.ศ.), ประเด็นการพัฒนา, ชื่อโครงการ (Grid 3 คอลัมน์) */}
              <div className="grid grid-cols-12 gap-2.5">
                <div className="col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    ปีงบ (พ.ศ.) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={formYear}
                      onChange={(e) => setFormYear(e.target.value)}
                      className="w-full appearance-none pl-2.5 pr-7 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer font-medium"
                    >
                      <option value="2571">2571</option>
                      <option value="2572">2572</option>
                      <option value="2573">2573</option>
                      <option value="2574">2574</option>
                      <option value="2575">2575</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div className="col-span-4">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    ประเด็นการพัฒนา <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={formStrategy}
                      onChange={(e) => setFormStrategy(e.target.value)}
                      title={formStrategy || '-- เลือกประเด็นการพัฒนา --'}
                      className="w-full appearance-none pl-2.5 pr-7 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer truncate font-medium"
                    >
                      <option value="">-- เลือกประเด็นการพัฒนา --</option>
                      {strategies.map((strat) => (
                        <option key={strat} value={strat} title={strat}>
                          {strat}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div className="col-span-6">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    ชื่อโครงการ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="ระบุชื่อโครงการ เช่น โครงการก่อสร้างถนน คสล. ..."
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                  />
                </div>
              </div>

              {/* Row 2: วัตถุประสงค์โครงการ และ รายละเอียดโครงการ คู่กัน (textarea rows=2) */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    วัตถุประสงค์โครงการ
                  </label>
                  <textarea
                    rows={2}
                    value={formObjective}
                    onChange={(e) => setFormObjective(e.target.value)}
                    placeholder="ระบุวัตถุประสงค์ของโครงการ..."
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none font-normal leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    รายละเอียดโครงการ (เป้าหมาย / ผลผลิต / กิจกรรมสำคัญ)
                  </label>
                  <textarea
                    rows={2}
                    value={formTarget}
                    onChange={(e) => setFormTarget(e.target.value)}
                    placeholder="ระบุเป้าหมาย ผลผลิต หรือรายละเอียดกิจกรรมโครงการ..."
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none font-normal leading-relaxed"
                  />
                </div>
              </div>

              {/* Row 3: สถานะโครงการ, ความคืบหน้า (%), วันเริ่มต้น - วันสิ้นสุด วางขนานกัน */}
              <div className="grid grid-cols-12 gap-2.5 items-start">
                {/* สถานะโครงการ */}
                <div className="col-span-3">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    สถานะโครงการ <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as TrackingStatus)}
                      className="w-full appearance-none pl-2.5 pr-7 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer font-medium"
                    >
                      <option value="not_started">ยังไม่เริ่มดำเนินการ</option>
                      <option value="in_progress">อยู่ระหว่างดำเนินการ</option>
                      <option value="delayed">ล่าช้ากว่าแผน</option>
                      <option value="completed">ดำเนินการแล้วเสร็จ</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* ความคืบหน้า (%) */}
                <div className="col-span-3">
                  <div className="flex items-center justify-between mb-0.5">
                    <label className="text-[11px] font-semibold text-slate-700">
                      ความคืบหน้า <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] font-bold font-mono text-emerald-700 bg-emerald-50 px-1.5 rounded">
                      {formProgress}%
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={formProgress}
                      onChange={(e) => setFormProgress(parseInt(e.target.value, 10))}
                      className="w-full accent-[#059669] h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    {[0, 25, 50, 75, 100].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setFormProgress(pct)}
                        className={`text-[10px] px-1.5 py-0.2 rounded transition-colors cursor-pointer ${
                          formProgress === pct
                            ? 'bg-[#059669] text-white font-bold shadow-xs'
                            : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* วันที่เริ่มต้น */}
                <div className="col-span-3">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    วันที่เริ่มต้น
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formStartDate}
                      onChange={(e) => setFormStartDate(e.target.value)}
                      placeholder="09/03/2026"
                      className="w-full pl-2.5 pr-7 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                    />
                    <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* วันที่คาดว่าจะสิ้นสุด */}
                <div className="col-span-3">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    วันที่คาดว่าจะสิ้นสุด
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formEndDate}
                      onChange={(e) => setFormEndDate(e.target.value)}
                      placeholder="mm/dd/yyyy"
                      className="w-full pl-2.5 pr-7 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                    />
                    <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Row 4: กลุ่มผู้รับผิดชอบ (หน่วยงาน / ผู้รับผิดชอบ / แหล่งที่มา / หมายเหตุ) จัดเป็น Grid 2 คอลัมน์ */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    หน่วยงาน / สำนัก-กอง <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={formDepartment}
                      onChange={(e) => setFormDepartment(e.target.value)}
                      title={formDepartment || '-- เลือกหน่วยงานรับผิดชอบ --'}
                      className="w-full appearance-none pl-2.5 pr-7 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer font-medium truncate"
                    >
                      <option value="">-- เลือกหน่วยงานรับผิดชอบ --</option>
                      {departments.map((dept) => (
                        <option key={dept} value={dept} title={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    ผู้รับผิดชอบ (ชื่อเจ้าหน้าที่) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formResponsiblePerson}
                    onChange={(e) => setFormResponsiblePerson(e.target.value)}
                    placeholder="ระบุชื่อเจ้าหน้าที่หรือหน่วยงาน..."
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    แหล่งที่มาของงบประมาณ <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={formBudgetSource}
                      onChange={(e) => setFormBudgetSource(e.target.value)}
                      className="w-full appearance-none pl-2.5 pr-7 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer font-medium"
                    >
                      {BUDGET_SOURCES.map((src, idx) => (
                        <option key={idx} value={src}>
                          {src}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    หมายเหตุ / ปัญหาที่พบ
                  </label>
                  <input
                    type="text"
                    value={formNote}
                    onChange={(e) => setFormNote(e.target.value)}
                    placeholder="บันทึกปัญหา อุปสรรค ความล่าช้า..."
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* ข้อมูลทางการเงินและงบประมาณ (บาท) - จัดวางแบบ Compact Grid แนวยาว */}
              <div className="bg-sky-50/40 border border-sky-200/90 rounded-xl p-2.5 px-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-sky-950">
                    <Info className="w-3.5 h-3.5 text-sky-600" />
                    <span>ข้อมูลทางการเงินและงบประมาณ (บาท)</span>
                  </div>
                  <span className="text-[10px] text-sky-700 font-medium">
                    รองรับการโอนเพิ่ม/โอนลดงบประมาณ
                  </span>
                </div>

                {/* Compact Grid แนวยาว 7 คอลัมน์ */}
                <div className="grid grid-cols-7 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5 truncate" title="ยอดตั้งต้น (อนุมัติเดิม)">
                      ยอดตั้งต้นเดิม
                    </label>
                    <input
                      type="number"
                      value={formInitialBudget}
                      onChange={(e) => setFormInitialBudget(e.target.value === '' ? 0 : Number(e.target.value))}
                      placeholder="0"
                      className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded-md text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-emerald-600 mb-0.5 truncate" title="โอนเพิ่ม (+)">
                      โอนเพิ่ม (+)
                    </label>
                    <input
                      type="number"
                      value={formTransferIn}
                      onChange={(e) => setFormTransferIn(e.target.value === '' ? 0 : Number(e.target.value))}
                      placeholder="0"
                      className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded-md text-emerald-600 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-rose-600 mb-0.5 truncate" title="โอนลด (-)">
                      โอนลด (-)
                    </label>
                    <input
                      type="number"
                      value={formTransferOut}
                      onChange={(e) => setFormTransferOut(e.target.value === '' ? 0 : Number(e.target.value))}
                      placeholder="0"
                      className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded-md text-rose-600 font-mono focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-sky-800 mb-0.5 truncate" title="งบอนุมัติสุทธิ">
                      งบอนุมัติสุทธิ
                    </label>
                    <div className="w-full px-2 py-1 text-xs bg-sky-100/90 border border-sky-300/80 rounded-md text-sky-950 font-mono font-bold text-right truncate">
                      {formNetBudget.toLocaleString()}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-purple-700 mb-0.5 truncate" title="ลงนามสัญญา">
                      ลงนามสัญญา
                    </label>
                    <input
                      type="number"
                      value={formContractBudget}
                      onChange={(e) => setFormContractBudget(e.target.value === '' ? 0 : Number(e.target.value))}
                      placeholder="0"
                      className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded-md text-purple-700 font-mono focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-emerald-700 mb-0.5 truncate" title="เบิกจ่ายแล้ว">
                      เบิกจ่ายแล้ว
                    </label>
                    <input
                      type="number"
                      value={formDisbursedAmount}
                      onChange={(e) => setFormDisbursedAmount(e.target.value === '' ? 0 : Number(e.target.value))}
                      placeholder="0"
                      className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded-md text-emerald-700 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-amber-900 mb-0.5 truncate" title="คงเหลือ (สุทธิ - เบิกจ่าย)">
                      คงเหลือสุทธิ
                    </label>
                    <div className="w-full px-2 py-1 text-xs bg-amber-100/90 border border-amber-300/80 rounded-md text-amber-950 font-mono font-bold text-right truncate">
                      {formRemainingBudget.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons in Footer */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#059669] hover:bg-[#047857] rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>บันทึกข้อมูลติดตาม</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Popover / Dialog to Pick an Approved Project for Form Auto-Fill */}
      {isInnerProjectPickerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-hidden"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full h-auto max-h-[85vh] overflow-hidden border border-slate-200 flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-5 py-2.5 bg-[#111827] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <h4 className="font-bold text-sm text-white">
                  เลือกโครงการที่ได้รับอนุมัติงบประมาณ
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsInnerProjectPickerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="ปิด"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Box - Compact py-1.5 px-3 text-sm */}
            <div className="p-2.5 px-4 border-b border-slate-100 bg-slate-50 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="ค้นหาตามชื่อโครงการ หรือหน่วยงาน..."
                  value={pickerSearch}
                  onChange={(e) => {
                    setPickerSearch(e.target.value);
                    setPickerPage(1);
                  }}
                  className="w-full pl-9 pr-8 py-1.5 px-3 text-sm bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
                />
                {pickerSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setPickerSearch('');
                      setPickerPage(1);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    title="ล้างคำค้นหา"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Project Cards Container - Compact padding p-2.5 my-1.5, Inline Grid, 4 items per page */}
            <div className="p-3 px-4 flex-1 overflow-hidden flex flex-col justify-start">
              {paginatedPickerProjects.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  ไม่พบโครงการที่ค้นหา
                </div>
              ) : (
                paginatedPickerProjects.map((p, idx) => {
                  const displayId = getProjectDisplayId(p, p.orderNumber || idx + 1);
                  const budgetAmount = p.budgetApproved > 0 ? p.budgetApproved : p.budgetPlan;

                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        setFormYear(p.year || '2571');
                        setFormStrategy(p.planStrategy || strategies[0]);
                        setFormName(p.name);
                        setFormObjective(p.objective || '');
                        setFormTarget(p.target || '');
                        setFormDepartment(p.department || 'สำนักปลัดเทศบาล');
                        setFormResponsiblePerson(p.department || 'สำนักปลัดเทศบาล');
                        setFormBudgetSource(
                          p.budgetSource && p.budgetSource !== '- ยังไม่ได้จัดสรร -'
                            ? p.budgetSource
                            : 'เทศบัญญัติงบประมาณรายจ่าย'
                        );
                        setFormBudgetApproved(budgetAmount);
                        setFormInitialBudget(budgetAmount);
                        setFormTransferIn(0);
                        setFormTransferOut(0);
                        setFormContractBudget(0);
                        setFormDisbursedAmount(0);
                        setIsInnerProjectPickerOpen(false);
                      }}
                      className="p-2.5 my-1.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 cursor-pointer transition-all flex items-center justify-between gap-3 text-xs bg-white shadow-2xs"
                    >
                      {/* ซ้าย: Badge รหัส ID + ชื่อโครงการ + กองผู้รับผิดชอบ + งบประมาณ */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-mono text-emerald-800 font-bold bg-emerald-50 text-[10px] px-1.5 py-0.5 rounded border border-emerald-200/80 shrink-0">
                            {p.code || displayId}
                          </span>
                          <span className="font-bold text-slate-900 truncate text-xs" title={p.name}>
                            {p.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1 min-w-0 flex-wrap">
                          <span className="truncate max-w-[170px] text-slate-600 font-medium">
                            {p.department || '-'}
                          </span>
                          <span>•</span>
                          <span className="text-slate-500">พ.ศ. {p.year || '2571'}</span>
                          <span>•</span>
                          <span className="font-mono font-semibold text-emerald-700 bg-emerald-50/60 px-1.5 py-0.5 rounded border border-emerald-200/50">
                            งบประมาณ: ฿{budgetAmount.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* ขวา: ปุ่ม เลือก */}
                      <button
                        type="button"
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-[#059669] hover:bg-[#047857] rounded-lg shrink-0 transition-colors shadow-xs flex items-center gap-1"
                      >
                        <span>เลือก</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer with Pagination Controls */}
            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0 text-xs">
              <div className="text-[11px] text-slate-500">
                {filteredPickerProjects.length > 0 ? (
                  <span>
                    แสดง {(pickerPage - 1) * PICKER_PAGE_SIZE + 1} -{' '}
                    {Math.min(pickerPage * PICKER_PAGE_SIZE, filteredPickerProjects.length)} จาก{' '}
                    <span className="font-semibold text-slate-700">{filteredPickerProjects.length}</span> รายการ
                  </span>
                ) : (
                  <span>0 รายการ</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {totalPickerPages > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={pickerPage <= 1}
                      onClick={() => setPickerPage((prev) => Math.max(1, prev - 1))}
                      className="p-1 px-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-0.5 text-[11px]"
                      title="หน้าก่อนหน้า"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>ก่อนหน้า</span>
                    </button>
                    <span className="text-[11px] font-medium text-slate-600 px-1.5 font-mono">
                      {pickerPage} / {totalPickerPages}
                    </span>
                    <button
                      type="button"
                      disabled={pickerPage >= totalPickerPages}
                      onClick={() => setPickerPage((prev) => Math.min(totalPickerPages, prev + 1))}
                      className="p-1 px-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-0.5 text-[11px]"
                      title="หน้าถัดไป"
                    >
                      <span>ถัดไป</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setIsInnerProjectPickerOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Edit Tracking Details */}
      {editingItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-[#055740] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-emerald-200" />
                <h3 className="font-bold text-base text-white">แก้ไขข้อมูลการติดตามโครงการ</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-emerald-100 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const updated: ProjectTrackingItem = {
                  ...editingItem,
                  contractBudget: form.contractBudget.value
                    ? parseFloat(form.contractBudget.value)
                    : null,
                  disbursedAmount: form.disbursedAmount.value
                    ? parseFloat(form.disbursedAmount.value)
                    : null,
                  progressPercent: parseInt(form.progressPercent.value || '0', 10),
                  status: form.trackingStatus.value as TrackingStatus,
                  note: form.note.value
                };
                handleSaveEdit(updated);
              }}
              className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs"
            >
              <div>
                <div className="text-slate-500 text-[11px]">ชื่อโครงการ</div>
                <div className="font-bold text-slate-900 text-sm">{editingItem.name}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    งบประมาณที่อนุมัติ
                  </label>
                  <div className="font-mono text-emerald-700 font-bold px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
                    ฿{editingItem.budgetApproved.toLocaleString()}
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    สถานะการดำเนินงาน
                  </label>
                  <select
                    name="trackingStatus"
                    defaultValue={editingItem.status}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                  >
                    <option value="not_started">ยังไม่เริ่มดำเนินการ</option>
                    <option value="in_progress">อยู่ระหว่างดำเนินการ</option>
                    <option value="delayed">ล่าช้ากว่าแผน</option>
                    <option value="completed">ดำเนินการแล้วเสร็จ</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    งบตามสัญญา (บาท)
                  </label>
                  <input
                    name="contractBudget"
                    type="number"
                    defaultValue={editingItem.contractBudget ?? ''}
                    placeholder="เช่น 480000"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    เบิกจ่ายแล้ว (บาท)
                  </label>
                  <input
                    name="disbursedAmount"
                    type="number"
                    defaultValue={editingItem.disbursedAmount ?? ''}
                    placeholder="เช่น 240000"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ความคืบหน้า (%)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    name="progressPercent"
                    type="range"
                    min="0"
                    max="100"
                    defaultValue={editingItem.progressPercent}
                    className="flex-1"
                    id="progress-slider"
                    onChange={(e) => {
                      const valEl = document.getElementById('progress-val');
                      if (valEl) valEl.innerText = `${e.target.value}%`;
                    }}
                  />
                  <span
                    id="progress-val"
                    className="font-mono font-bold text-emerald-700 w-12 text-right"
                  >
                    {editingItem.progressPercent}%
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  หมายเหตุ / ผลการประเมิน
                </label>
                <textarea
                  name="note"
                  rows={2}
                  defaultValue={editingItem.note ?? ''}
                  placeholder="บันทึกผลการติดตามหรือปัญหาอุปสรรค..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold cursor-pointer"
                >
                  บันทึกการเปลี่ยนแปลง
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: View Tracking Details */}
      {viewingItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-[#055740] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-emerald-200" />
                <h3 className="font-bold text-base text-white">รายละเอียดการติดตามโครงการ</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingItem(null)}
                className="text-emerald-100 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              <div>
                <span className="text-[11px] text-slate-500 block">ชื่อโครงการ</span>
                <h4 className="text-base font-bold text-slate-900 mt-0.5">
                  {viewingItem.name}
                </h4>
                <div className="text-emerald-700 text-[11px] mt-1 font-medium">
                  {viewingItem.planStrategy}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[11px] text-slate-500">หน่วยงานรับผิดชอบ</span>
                  <div className="font-semibold text-slate-800 mt-0.5">
                    {viewingItem.department}
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500">แหล่งงบประมาณ</span>
                  <div className="font-semibold text-slate-800 mt-0.5">
                    {viewingItem.budgetSource}
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500">งบประมาณที่อนุมัติ</span>
                  <div className="font-mono font-bold text-emerald-700 mt-0.5 text-sm">
                    ฿{viewingItem.budgetApproved.toLocaleString()}
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500">สถานะ</span>
                  <div className="font-semibold text-slate-800 mt-0.5">
                    {viewingItem.status === 'completed'
                      ? 'ดำเนินการแล้วเสร็จ'
                      : viewingItem.status === 'in_progress'
                      ? 'อยู่ระหว่างดำเนินการ'
                      : viewingItem.status === 'delayed'
                      ? 'ล่าช้ากว่าแผน'
                      : 'ยังไม่เริ่มดำเนินการ'}
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[11px] text-slate-500 block">วัตถุประสงค์</span>
                <p className="text-slate-800 mt-0.5 leading-relaxed">
                  {viewingItem.objective || '-'}
                </p>
              </div>

              <div>
                <span className="text-[11px] text-slate-500 block">เป้าหมาย (ผลผลิต)</span>
                <p className="text-slate-800 mt-0.5 leading-relaxed">
                  {viewingItem.target || '-'}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setViewingItem(null)}
                  className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium cursor-pointer"
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
