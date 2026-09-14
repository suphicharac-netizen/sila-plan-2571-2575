import React, { useState, useMemo } from 'react';
import {
  Printer,
  FileSpreadsheet,
  Download,
  Search,
  RotateCcw,
  ChevronDown,
  Layers,
  ArrowLeftRight,
  CheckCircle2,
  Clock,
  Coins,
  Building2,
  Check,
  Eye,
  BarChart3
} from 'lucide-react';
import { ProjectData } from '../types';
import { DEVELOPMENT_STRATEGIES, DEPARTMENTS } from '../utils/constants';
import { matchesProjectSearch, getProjectDisplayId } from '../utils/projectCode';

interface PlanBudgetComparisonReportViewProps {
  projects: ProjectData[];
  onOpenProjectDetail?: (project: ProjectData) => void;
}

export const PlanBudgetComparisonReportView: React.FC<PlanBudgetComparisonReportViewProps> = ({
  projects,
  onOpenProjectDetail
}) => {
  // Filter state
  const [selectedYear, setSelectedYear] = useState<string>('2571');
  const [selectedStrategy, setSelectedStrategy] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'projects' | 'strategy_summary'>('projects');
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);

  // Strategies & Departments
  const strategies = useMemo(() => DEVELOPMENT_STRATEGIES, []);
  const departments = useMemo(() => DEPARTMENTS, []);

  // Filter projects based on criteria
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      // Year filter
      if (selectedYear !== 'all') {
        const yrBudget = p.budgetByYear?.[selectedYear as '2571' | '2572' | '2573' | '2574' | '2575'] || 0;
        if (p.year !== selectedYear && yrBudget <= 0) return false;
      }

      // Strategy
      if (selectedStrategy && p.planStrategy !== selectedStrategy) return false;

      // Department
      if (selectedDepartment && p.department !== selectedDepartment) return false;

      // Status
      if (selectedStatus === 'approved' && p.status !== 'approved') return false;
      if (selectedStatus === 'pending' && p.status === 'approved') return false;

      // Search keyword
      if (searchQuery.trim() && !matchesProjectSearch(searchQuery, p)) return false;

      return true;
    });
  }, [projects, selectedYear, selectedStrategy, selectedDepartment, selectedStatus, searchQuery]);

  // Calculations
  const stats = useMemo(() => {
    let totalPlanBudget = 0;
    let totalApprovedBudget = 0;
    let approvedCount = 0;
    let pendingCount = 0;

    filteredProjects.forEach((p) => {
      let pPlan = p.budgetPlan || 0;
      if (selectedYear !== 'all' && p.budgetByYear) {
        const yr = p.budgetByYear[selectedYear as '2571' | '2572' | '2573' | '2574' | '2575'];
        if (yr && yr > 0) pPlan = yr;
      }
      totalPlanBudget += pPlan;

      if (p.status === 'approved') {
        approvedCount += 1;
        totalApprovedBudget += p.budgetApproved || pPlan || 0;
      } else {
        pendingCount += 1;
      }
    });

    const remainingBudget = Math.max(0, totalPlanBudget - totalApprovedBudget);
    const approvedPercent = totalPlanBudget > 0 ? (totalApprovedBudget / totalPlanBudget) * 100 : 0;

    return {
      totalCount: filteredProjects.length,
      approvedCount,
      pendingCount,
      totalPlanBudget,
      totalApprovedBudget,
      remainingBudget,
      approvedPercent
    };
  }, [filteredProjects, selectedYear]);

  // Strategy summary data
  const strategySummary = useMemo(() => {
    const map: Record<string, { totalProjects: number; approvedProjects: number; planBudget: number; approvedBudget: number }> = {};
    strategies.forEach((st) => {
      map[st] = { totalProjects: 0, approvedProjects: 0, planBudget: 0, approvedBudget: 0 };
    });

    filteredProjects.forEach((p) => {
      const st = p.planStrategy || 'ประเด็นการพัฒนาทั่วไป';
      if (!map[st]) {
        map[st] = { totalProjects: 0, approvedProjects: 0, planBudget: 0, approvedBudget: 0 };
      }
      map[st].totalProjects += 1;
      let pPlan = p.budgetPlan || 0;
      if (selectedYear !== 'all' && p.budgetByYear) {
        const yr = p.budgetByYear[selectedYear as '2571' | '2572' | '2573' | '2574' | '2575'];
        if (yr && yr > 0) pPlan = yr;
      }
      map[st].planBudget += pPlan;
      if (p.status === 'approved') {
        map[st].approvedProjects += 1;
        map[st].approvedBudget += p.budgetApproved || pPlan || 0;
      }
    });

    return Object.entries(map).map(([name, data], idx) => ({
      index: idx + 1,
      name,
      ...data,
      remainingBudget: data.planBudget - data.approvedBudget,
      percent: data.planBudget > 0 ? (data.approvedBudget / data.planBudget) * 100 : 0
    }));
  }, [filteredProjects, strategies, selectedYear]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = [
      'ลำดับ',
      'รหัสโครงการ',
      'ชื่อโครงการ/กิจกรรม',
      'ประเด็นการพัฒนา',
      'หน่วยงานรับผิดชอบ',
      'ปีงบประมาณ',
      'งบประมาณตามแผน (บาท)',
      'งบประมาณที่อนุมัติ (บาท)',
      'ผลต่าง/คงเหลือ (บาท)',
      'สถานะการอนุมัติ',
      'เลขที่คำสั่ง/มติอนุมัติ'
    ];

    const rows = filteredProjects.map((p, idx) => {
      let planAmt = p.budgetPlan || 0;
      if (selectedYear !== 'all' && p.budgetByYear) {
        const yr = p.budgetByYear[selectedYear as '2571' | '2572' | '2573' | '2574' | '2575'];
        if (yr && yr > 0) planAmt = yr;
      }
      const appAmt = p.status === 'approved' ? (p.budgetApproved || planAmt) : 0;
      const diff = planAmt - appAmt;

      return [
        `"${idx + 1}"`,
        `"${getProjectDisplayId(p)}"`,
        `"${(p.name || '').replace(/"/g, '""')}"`,
        `"${(p.planStrategy || '').replace(/"/g, '""')}"`,
        `"${(p.department || '').replace(/"/g, '""')}"`,
        `"${p.year || ''}"`,
        `"${planAmt}"`,
        `"${appAmt}"`,
        `"${diff}"`,
        `"${p.status === 'approved' ? 'อนุมัติตั้งงบแล้ว' : 'ยังไม่อนุมัติ'}"`,
        `"${(p.approvalOrderNo || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `รายงานเปรียบเทียบแผน_งบประมาณ_${selectedYear}.csv`;
    link.click();
    setIsExportOpen(false);
  };

  const handleResetFilters = () => {
    setSelectedYear('2571');
    setSelectedStrategy('');
    setSelectedDepartment('');
    setSelectedStatus('all');
    setSearchQuery('');
  };

  const yearLabel = selectedYear === 'all' ? '2571-2575 (ทุกปีงบประมาณ)' : selectedYear;

  return (
    <div className="flex-1 flex flex-col bg-slate-50 h-full min-h-0 overflow-hidden">
      {/* Top Banner Bar with Print and Export buttons */}
      <header className="bg-[#03231a] text-white px-4 py-2.5 sm:px-6 shadow-xs flex items-center justify-between shrink-0 no-print print:hidden">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#064232] flex items-center justify-center shrink-0">
            <ArrowLeftRight className="w-4 h-4 text-emerald-300" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              <span>รายงานเปรียบเทียบแผน/งบประมาณ</span>
              <span className="text-emerald-400 font-normal text-xs">|</span>
              <span className="text-emerald-200 text-xs font-normal">เทศบาลเมืองศิลา</span>
            </h1>
            <p className="text-[11px] text-emerald-300/80">
              เปรียบเทียบโครงการตามแผนพัฒนาท้องถิ่นและโครงการที่ได้รับอนุมัติตั้งงบประมาณ
            </p>
          </div>
        </div>

        {/* Action Controls: Print & Export */}
        <div className="flex items-center gap-2">
          {/* Export Dropdown */}
          <div className="relative">
            <button
              id="btn-export-comparison-report"
              type="button"
              onClick={() => setIsExportOpen(!isExportOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#064232] hover:bg-[#085440] text-emerald-100 border border-emerald-700/60 rounded-lg text-xs font-medium transition-colors cursor-pointer shadow-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" />
              <span>ส่งออก Excel</span>
              <ChevronDown className="w-3 h-3 text-emerald-400" />
            </button>

            {isExportOpen && (
              <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 text-slate-800">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="w-full px-3 py-1.5 text-left text-xs hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 flex items-center gap-2 cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>ส่งออก CSV (Excel)</span>
                </button>
              </div>
            )}
          </div>

          {/* Print Button */}
          <button
            id="btn-print-comparison-report"
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>พิมพ์รายงาน</span>
          </button>
        </div>
      </header>

      {/* Main Scrollable Content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-5 space-y-4 print:p-0 print:overflow-visible">
        {/* ========================================================================= */}
        {/* OFFICIAL 2-LINE REPORT HEADER (Both Screen and Print) */}
        {/* ========================================================================= */}
        <div className="text-center py-2 sm:py-3 border-b border-slate-200 print:border-none bg-white rounded-xl shadow-2xs print:shadow-none p-4">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 print:text-black leading-snug">
            รายงานสรุปผลการเปรียบเทียบโครงการตามแผนพัฒนาและโครงการที่อนุมัติงบประมาณ ประจำปีงบประมาณ พ.ศ. {yearLabel}
          </h2>
          <p className="text-xs sm:text-sm font-semibold text-slate-700 print:text-black mt-1">
            เทศบาลเมืองศิลา อำเภอเมืองขอนแก่น จังหวัดขอนแก่น
          </p>
        </div>

        {/* Filter Bar (Hidden on Print) */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3 no-print print:hidden">
          {/* Row 1: Year selection */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-700">ปีงบประมาณ:</label>
              <div className="relative">
                <select
                  id="filter-comparison-year"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="2571">พ.ศ. 2571</option>
                  <option value="2572">พ.ศ. 2572</option>
                  <option value="2573">พ.ศ. 2573</option>
                  <option value="2574">พ.ศ. 2574</option>
                  <option value="2575">พ.ศ. 2575</option>
                  <option value="all">ทั้งหมด (2571-2575)</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* View Mode Toggle: รายโครงการ vs สรุปรายยุทธศาสตร์ */}
            <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('projects')}
                className={`px-3 py-1 text-xs rounded-md transition-all font-medium cursor-pointer ${
                  viewMode === 'projects'
                    ? 'bg-white text-emerald-800 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                รายโครงการเปรียบเทียบ
              </button>
              <button
                type="button"
                onClick={() => setViewMode('strategy_summary')}
                className={`px-3 py-1 text-xs rounded-md transition-all font-medium cursor-pointer ${
                  viewMode === 'strategy_summary'
                    ? 'bg-white text-emerald-800 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                สรุปรายประเด็นยุทธศาสตร์
              </button>
            </div>
          </div>

          {/* Row 2: 4 Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. ประเด็นการพัฒนา */}
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                ประเด็นการพัฒนา
              </label>
              <div className="relative">
                <select
                  value={selectedStrategy}
                  onChange={(e) => setSelectedStrategy(e.target.value)}
                  className="w-full appearance-none pl-3 pr-8 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer truncate"
                >
                  <option value="">-- ทุกประเด็นการพัฒนา --</option>
                  {strategies.map((st) => (
                    <option key={st} value={st} title={st}>
                      {st}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* 2. หน่วยงานรับผิดชอบหลัก */}
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                หน่วยงานรับผิดชอบหลัก
              </label>
              <div className="relative">
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full appearance-none pl-3 pr-8 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer truncate"
                >
                  <option value="">-- ทุกหน่วยงาน --</option>
                  {departments.map((dep) => (
                    <option key={dep} value={dep} title={dep}>
                      {dep}
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
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อโครงการ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* 4. สถานะการอนุมัติ */}
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                สถานะการอนุมัติงบประมาณ
              </label>
              <div className="relative">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full appearance-none pl-3 pr-8 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="all">-- ทุกสถานะ --</option>
                  <option value="approved">อนุมัติตั้งงบประมาณแล้ว</option>
                  <option value="pending">ยังไม่อนุมัติตั้งงบประมาณ</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Action row */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {}}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#059669] hover:bg-[#047857] text-white text-xs font-medium rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>ค้นหา</span>
              </button>

              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>เริ่มใหม่</span>
              </button>
            </div>

            <div className="text-xs text-slate-500">
              พบ <span className="font-semibold text-emerald-700">{filteredProjects.length}</span> โครงการ
            </div>
          </div>
        </div>

        {/* KPI Cards (Hidden on Print) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 no-print print:hidden">
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
            <div className="text-[11px] font-medium text-slate-500">โครงการตามแผนทั้งหมด</div>
            <div className="text-lg font-bold text-slate-800 mt-1">
              {stats.totalCount} <span className="text-xs font-normal text-slate-500">โครงการ</span>
            </div>
            <div className="text-xs text-slate-600 font-mono mt-0.5">
              ฿{stats.totalPlanBudget.toLocaleString()}
            </div>
          </div>

          <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-3.5 shadow-xs">
            <div className="text-[11px] font-medium text-emerald-800 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>อนุมัติงบประมาณแล้ว</span>
            </div>
            <div className="text-lg font-bold text-emerald-800 mt-1">
              {stats.approvedCount} <span className="text-xs font-normal text-emerald-600">โครงการ</span>
            </div>
            <div className="text-xs text-emerald-700 font-mono font-semibold mt-0.5">
              ฿{stats.totalApprovedBudget.toLocaleString()}
            </div>
          </div>

          <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-3.5 shadow-xs">
            <div className="text-[11px] font-medium text-amber-800 flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-600" />
              <span>ยังไม่อนุมัติ / รอจัดสรร</span>
            </div>
            <div className="text-lg font-bold text-amber-800 mt-1">
              {stats.pendingCount} <span className="text-xs font-normal text-amber-600">โครงการ</span>
            </div>
            <div className="text-xs text-amber-700 font-mono font-semibold mt-0.5">
              ฿{stats.remainingBudget.toLocaleString()}
            </div>
          </div>

          <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-3.5 shadow-xs">
            <div className="text-[11px] font-medium text-blue-800 flex items-center gap-1">
              <Coins className="w-3 h-3 text-blue-600" />
              <span>สัดส่วนการอนุมัติงบ</span>
            </div>
            <div className="text-lg font-bold text-blue-800 mt-1">
              {stats.approvedPercent.toFixed(1)}%
            </div>
            <div className="w-full bg-blue-200 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, stats.approvedPercent)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Data Table Section */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden print:border-none print:shadow-none">
          {viewMode === 'projects' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse print:text-[10pt] budget-report-table">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 print:bg-white print:text-black">
                    <th className="py-2.5 px-2 text-center w-12 border border-slate-200 print:border-black">ที่</th>
                    <th className="py-2.5 px-3 border border-slate-200 print:border-black">ชื่อโครงการ / วัตถุประสงค์</th>
                    <th className="py-2.5 px-2 border border-slate-200 print:border-black">ประเด็นการพัฒนา</th>
                    <th className="py-2.5 px-2 border border-slate-200 print:border-black">หน่วยงาน</th>
                    <th className="py-2.5 px-2 text-right w-28 border border-slate-200 print:border-black">งบตามแผน (บาท)</th>
                    <th className="py-2.5 px-2 text-right w-28 border border-slate-200 print:border-black">งบที่อนุมัติ (บาท)</th>
                    <th className="py-2.5 px-2 text-right w-28 border border-slate-200 print:border-black">คงเหลือ (บาท)</th>
                    <th className="py-2.5 px-2 text-center w-28 border border-slate-200 print:border-black">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredProjects.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        ไม่พบข้อมูลโครงการตามเงื่อนไขที่เลือก
                      </td>
                    </tr>
                  ) : (
                    filteredProjects.map((p, idx) => {
                      let planAmt = p.budgetPlan || 0;
                      if (selectedYear !== 'all' && p.budgetByYear) {
                        const yr = p.budgetByYear[selectedYear as '2571' | '2572' | '2573' | '2574' | '2575'];
                        if (yr && yr > 0) planAmt = yr;
                      }
                      const appAmt = p.status === 'approved' ? (p.budgetApproved || planAmt) : 0;
                      const diff = planAmt - appAmt;

                      return (
                        <tr
                          key={p.id}
                          onClick={() => onOpenProjectDetail?.(p)}
                          className="hover:bg-slate-50/80 transition-colors cursor-pointer print:hover:bg-transparent"
                        >
                          <td className="py-2 px-2 text-center font-mono border border-slate-200 print:border-black">
                            {idx + 1}
                          </td>
                          <td className="py-2 px-3 border border-slate-200 print:border-black">
                            <div className="font-semibold text-slate-900 print:text-black">{p.name}</div>
                            {p.target && (
                              <div className="text-[11px] text-slate-500 print:text-slate-600 line-clamp-1 mt-0.5">
                                เป้าหมาย: {p.target}
                              </div>
                            )}
                          </td>
                          <td className="py-2 px-2 text-slate-600 print:text-black border border-slate-200 print:border-black">
                            {p.planStrategy || '-'}
                          </td>
                          <td className="py-2 px-2 text-slate-600 print:text-black border border-slate-200 print:border-black">
                            {p.department || '-'}
                          </td>
                          <td className="py-2 px-2 text-right font-mono text-slate-800 print:text-black border border-slate-200 print:border-black">
                            {planAmt > 0 ? planAmt.toLocaleString() : '-'}
                          </td>
                          <td className="py-2 px-2 text-right font-mono font-semibold text-emerald-700 print:text-black border border-slate-200 print:border-black">
                            {appAmt > 0 ? appAmt.toLocaleString() : '-'}
                          </td>
                          <td className="py-2 px-2 text-right font-mono text-amber-700 print:text-black border border-slate-200 print:border-black">
                            {diff > 0 ? diff.toLocaleString() : '0'}
                          </td>
                          <td className="py-2 px-2 text-center border border-slate-200 print:border-black">
                            {p.status === 'approved' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-100 text-emerald-800 print:bg-white print:text-black print:border print:border-black">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 print:hidden" />
                                <span>อนุมัติแล้ว</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-slate-100 text-slate-600 print:bg-white print:text-black print:border print:border-black">
                                <Clock className="w-3 h-3 text-slate-400 print:hidden" />
                                <span>ยังไม่อนุมัติ</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300 print:bg-white print:text-black print:border-t-2 print:border-black">
                    <td colSpan={5} className="py-2.5 px-3 text-right border border-slate-200 print:border-black">
                      รวมทั้งสิ้น ({filteredProjects.length} โครงการ):
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono text-slate-900 print:text-black border border-slate-200 print:border-black">
                      {stats.totalPlanBudget.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono text-emerald-800 print:text-black border border-slate-200 print:border-black">
                      {stats.totalApprovedBudget.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono text-amber-800 print:text-black border border-slate-200 print:border-black">
                      {stats.remainingBudget.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-2 text-center text-[11px] border border-slate-200 print:border-black">
                      อนุมัติ {stats.approvedPercent.toFixed(1)}%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse print:text-[10pt] budget-report-table">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 print:bg-white print:text-black">
                    <th className="py-2.5 px-2 text-center w-12 border border-slate-200 print:border-black">ที่</th>
                    <th className="py-2.5 px-3 border border-slate-200 print:border-black">ประเด็นยุทธศาสตร์การพัฒนา</th>
                    <th className="py-2.5 px-2 text-center w-24 border border-slate-200 print:border-black">โครงการตามแผน</th>
                    <th className="py-2.5 px-2 text-center w-24 border border-slate-200 print:border-black">โครงการอนุมัติ</th>
                    <th className="py-2.5 px-2 text-right w-32 border border-slate-200 print:border-black">งบตามแผน (บาท)</th>
                    <th className="py-2.5 px-2 text-right w-32 border border-slate-200 print:border-black">งบที่อนุมัติ (บาท)</th>
                    <th className="py-2.5 px-2 text-right w-32 border border-slate-200 print:border-black">คงเหลือ (บาท)</th>
                    <th className="py-2.5 px-2 text-center w-24 border border-slate-200 print:border-black">ร้อยละอนุมัติ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {strategySummary.map((st) => (
                    <tr key={st.index} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-2 text-center font-mono border border-slate-200 print:border-black">
                        {st.index}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-900 print:text-black border border-slate-200 print:border-black">
                        {st.name}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono border border-slate-200 print:border-black">
                        {st.totalProjects}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono font-semibold text-emerald-700 print:text-black border border-slate-200 print:border-black">
                        {st.approvedProjects}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono border border-slate-200 print:border-black">
                        {st.planBudget.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono font-semibold text-emerald-700 print:text-black border border-slate-200 print:border-black">
                        {st.approvedBudget.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono text-amber-700 print:text-black border border-slate-200 print:border-black">
                        {st.remainingBudget.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono border border-slate-200 print:border-black">
                        {st.percent.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300 print:bg-white print:text-black">
                    <td colSpan={2} className="py-2.5 px-3 text-right border border-slate-200 print:border-black">
                      รวมทุกประเด็นยุทธศาสตร์:
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono border border-slate-200 print:border-black">
                      {stats.totalCount}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono text-emerald-800 print:text-black border border-slate-200 print:border-black">
                      {stats.approvedCount}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono border border-slate-200 print:border-black">
                      {stats.totalPlanBudget.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono text-emerald-800 print:text-black border border-slate-200 print:border-black">
                      {stats.totalApprovedBudget.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono text-amber-800 print:text-black border border-slate-200 print:border-black">
                      {stats.remainingBudget.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono border border-slate-200 print:border-black">
                      {stats.approvedPercent.toFixed(1)}%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
