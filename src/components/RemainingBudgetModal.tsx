import React, { useState, useEffect } from 'react';
import { X, Printer, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { ProjectData } from '../types';
import { matchesProjectSearch, getProjectDisplayId } from '../utils/projectCode';

interface RemainingBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: ProjectData[];
  year?: string;
}

export const RemainingBudgetModal: React.FC<RemainingBudgetModalProps> = ({
  isOpen,
  onClose,
  projects,
  year = '2571'
}) => {
  const [selectedYear, setSelectedYear] = useState<string>(year || '2571');
  const [selectedStrategy, setSelectedStrategy] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'projects' | 'strategies'>('projects');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const PAGE_SIZE = 5; // 4-5 items per page for compact layout without scrollbar

  useEffect(() => {
    if (year) {
      setSelectedYear(year);
    }
  }, [year]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedYear, selectedStrategy, searchTerm, viewMode]);

  if (!isOpen) return null;

  // Extract unique strategies across all projects for filter dropdown
  const uniqueStrategies = Array.from(
    new Set(projects.map((p) => p.planStrategy).filter(Boolean))
  );

  // Combined Filter Logic: year + strategy + search
  const filteredProjects = projects.filter((p) => {
    // 1. ปี พ.ศ. บรรจุแผน
    const matchYear = selectedYear === 'all' || p.year === selectedYear;

    // 2. ประเด็นการพัฒนา
    const matchStrategy =
      selectedStrategy === 'all' || p.planStrategy === selectedStrategy;

    // 3. ค้นหาชื่อโครงการ หรือรหัสโครงการ
    const matchSearch = matchesProjectSearch(searchTerm, p);

    return matchYear && matchStrategy && matchSearch;
  });

  // Strategy Grouping for optional summary tab
  const strategyMap: Record<
    string,
    { count: number; plan: number; approved: number }
  > = {};

  filteredProjects.forEach((p) => {
    const strat = p.planStrategy || 'ประเด็นการพัฒนาทั่วไป';
    if (!strategyMap[strat]) {
      strategyMap[strat] = { count: 0, plan: 0, approved: 0 };
    }
    strategyMap[strat].count += 1;
    strategyMap[strat].plan += p.budgetPlan || 0;
    strategyMap[strat].approved += p.budgetApproved || 0;
  });

  const strategyList = Object.entries(strategyMap).map(([strat, data], idx) => ({
    order: idx + 1,
    name: strat,
    count: data.count,
    plan: data.plan,
    approved: data.approved,
    remaining: data.plan - data.approved
  }));

  // Calculations for KPI cards and Table Footer
  const totalProjects = filteredProjects.length;
  const totalPlan = filteredProjects.reduce((sum, p) => sum + (p.budgetPlan || 0), 0);
  const totalApproved = filteredProjects.reduce((sum, p) => sum + (p.budgetApproved || 0), 0);
  const totalRemaining = totalPlan - totalApproved;

  // Pagination for 5 items per page (fits modal height without vertical scrollbar)
  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / PAGE_SIZE));
  const paginatedProjects = filteredProjects.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const totalStrategyPages = Math.max(1, Math.ceil(strategyList.length / PAGE_SIZE));
  const paginatedStrategies = strategyList.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      id="remaining-budget-report-modal"
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-hidden print:p-0 print:bg-white"
    >
      {/* Print Stylesheet for @media print */}
      <style>{`
        @media print {
          @page {
            size: landscape;
            margin: 10mm;
          }
          body {
            background: #fff !important;
            color: #000 !important;
          }
          #remaining-budget-report-modal {
            position: static !important;
            inset: auto !important;
            background: transparent !important;
            padding: 0 !important;
            display: block !important;
            overflow: visible !important;
          }
          #remaining-budget-report-modal > div {
            max-width: 100% !important;
            max-height: none !important;
            border: none !important;
            box-shadow: none !important;
            overflow: visible !important;
          }
          .print-hidden,
          .print\\:hidden,
          button,
          #btn-print-remaining-report,
          #btn-close-remaining-report,
          #btn-footer-close,
          .report-filter-bar {
            display: none !important;
          }
          .budget-report-table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
          .budget-report-table,
          .budget-report-table th,
          .budget-report-table td {
            border: 1px solid #000 !important;
            color: #000 !important;
          }
          .budget-report-table th {
            background-color: #fff !important;
            background: #fff !important;
            color: #000 !important;
            font-weight: bold !important;
          }
          .budget-report-table tfoot td {
            background-color: #fff !important;
            background: #fff !important;
            color: #000 !important;
            font-weight: bold !important;
            border-top: 2px solid #000 !important;
          }
          .print-title-banner {
            display: block !important;
            margin-bottom: 12px;
          }
        }
        @media screen {
          .print-title-banner {
            display: none;
          }
        }
      `}</style>

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl mx-2 sm:mx-4 h-auto max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 transition-all print:border-none print:shadow-none print:max-w-none print:mx-0 print:max-h-none">
        {/* 1. Modal Header: Sticky / Locked at Top */}
        <div className="shrink-0 px-4 sm:px-6 py-2.5 bg-[#182138] text-white flex items-center justify-between border-b border-slate-700/50 print:bg-white print:text-black print:border-b-2 print:border-black print:px-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-white/10 text-white shrink-0 print:hidden">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white print:text-black leading-snug">
                รายงานสรุปยอดงบประมาณคงเหลือและการจัดสรรงบประมาณ
              </h3>
              <p className="text-[10.5px] sm:text-xs text-slate-300 print:text-slate-700 font-light mt-0.5">
                เทศบาลเมืองศิลา ประจำปีงบประมาณ พ.ศ. {selectedYear === 'all' ? '2571-2575 (ทุกปีงบประมาณ)' : selectedYear}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <button
              id="btn-print-remaining-report"
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white bg-[#4f46e5] hover:bg-[#4338ca] rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>พิมพ์รายงาน</span>
            </button>

            <button
              id="btn-close-remaining-report"
              type="button"
              onClick={onClose}
              className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="ปิดหน้าต่าง"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* บรรทัดที่ 1 (แถบค้นหาและตัวกรอง): Compact (py-1 px-2.5 text-xs h-8) */}
        <div className="report-filter-bar shrink-0 px-4 sm:px-6 py-2 bg-white border-b border-slate-200 print:hidden shadow-2xs">
          <div className="flex flex-wrap items-end gap-2 text-xs">
            {/* 1. ตัวกรองปี พ.ศ. บรรจุแผน (ซ้ายสุด) */}
            <div className="flex flex-col gap-0.5 w-full sm:w-36 shrink-0">
              <label htmlFor="filter-budget-year" className="text-[11px] font-semibold text-slate-700">
                ปี พ.ศ. บรรจุแผน
              </label>
              <select
                id="filter-budget-year"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full h-8 py-1 px-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 font-medium cursor-pointer"
              >
                <option value="all">ทุกปีงบประมาณ</option>
                <option value="2571">พ.ศ. 2571</option>
                <option value="2572">พ.ศ. 2572</option>
                <option value="2573">พ.ศ. 2573</option>
                <option value="2574">พ.ศ. 2574</option>
                <option value="2575">พ.ศ. 2575</option>
              </select>
            </div>

            {/* 2. ตัวกรองประเด็นการพัฒนา */}
            <div className="flex flex-col gap-0.5 w-full sm:w-56 md:w-64 shrink-0">
              <label htmlFor="filter-budget-strategy" className="text-[11px] font-semibold text-slate-700">
                ประเด็นการพัฒนา
              </label>
              <select
                id="filter-budget-strategy"
                value={selectedStrategy}
                onChange={(e) => setSelectedStrategy(e.target.value)}
                className="w-full h-8 py-1 px-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 truncate cursor-pointer"
              >
                <option value="all">ทุกประเด็นการพัฒนา</option>
                {uniqueStrategies.map((strat) => (
                  <option key={strat} value={strat}>
                    {strat}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. ช่องค้นหา */}
            <div className="flex flex-col gap-0.5 flex-1 min-w-[180px]">
              <label htmlFor="filter-budget-search" className="text-[11px] font-semibold text-slate-700">
                ค้นหา
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="filter-budget-search"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ค้นหาชื่อโครงการ..."
                  className="w-full h-8 py-1 pl-8 pr-7 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white text-slate-800"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                    aria-label="ล้างการค้นหา"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* 4. ปุ่มสลับมุมมอง */}
            <div className="flex flex-col gap-0.5 shrink-0 sm:ml-auto">
              <span className="text-[11px] font-semibold text-slate-700">
                มุมมอง
              </span>
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 h-8">
                <button
                  type="button"
                  onClick={() => setViewMode('projects')}
                  className={`h-full px-2.5 text-xs font-medium rounded-md transition-all cursor-pointer whitespace-nowrap ${
                    viewMode === 'projects'
                      ? 'bg-white text-indigo-700 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  โครงการ ({filteredProjects.length})
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('strategies')}
                  className={`h-full px-2.5 text-xs font-medium rounded-md transition-all cursor-pointer whitespace-nowrap ${
                    viewMode === 'strategies'
                      ? 'bg-white text-indigo-700 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ประเด็น ({strategyList.length})
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Modal Body: No vertical scrollbar (overflow-hidden) */}
        <div className="flex-1 overflow-hidden p-3 sm:p-4 flex flex-col justify-start print:p-0 print:overflow-visible">
          {/* การ์ดสรุปยอดเงิน (Summary Stats): ลด Padding ลงเหลือ p-2, ตัวเลข text-lg/xl */}
          <div className="mb-2.5 print:mb-3 shrink-0">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
              {/* Card 1: การ์ดงบประมาณตามแผนทั้งหมด */}
              <div className="p-2 px-3 bg-white border border-slate-200 rounded-xl shadow-2xs print:border-black print:rounded-none">
                <div className="text-[11px] font-medium text-slate-600 print:text-black">
                  ยอดงบประมาณตามแผนทั้งหมด
                </div>
                <div className="text-lg font-bold font-mono text-slate-900 mt-0.5 tracking-tight print:text-black">
                  ฿{totalPlan.toLocaleString()}
                </div>
              </div>

              {/* Card 2: การ์ดงบประมาณที่อนุมัติแล้ว */}
              <div className="p-2 px-3 bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl shadow-2xs print:border-black print:bg-white print:rounded-none">
                <div className="text-[11px] font-medium text-[#15803d] print:text-black">
                  ยอดงบประมาณที่อนุมัติแล้ว
                </div>
                <div className="text-lg font-bold font-mono text-[#15803d] mt-0.5 tracking-tight print:text-black">
                  ฿{totalApproved.toLocaleString()}
                </div>
              </div>

              {/* Card 3: การ์ดงบประมาณคงเหลือ */}
              <div className="p-2 px-3 bg-[#f5f3ff] border border-[#ddd6fe] rounded-xl shadow-2xs print:border-black print:bg-white print:rounded-none">
                <div className="text-[11px] font-medium text-[#4f46e5] print:text-black">
                  ยอดงบประมาณคงเหลือ
                </div>
                <div className="text-lg font-bold font-mono text-[#4f46e5] mt-0.5 tracking-tight print:text-black">
                  ฿{totalRemaining.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* ตารางแสดงข้อมูล Compact (py-1.5 px-2 text-xs) */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs print:border-none print:shadow-none print:rounded-none flex flex-col justify-start">
            {viewMode === 'projects' ? (
              /* PRIMARY REQUESTED 6-COLUMN TABLE */
              <table className="w-full text-left border-collapse budget-report-table">
                <thead className="bg-slate-100/95 backdrop-blur-xs shadow-2xs print:bg-white">
                  <tr className="text-slate-800 text-xs font-semibold border-b border-slate-200 print:border-black">
                    {/* 1. ประเด็นการพัฒนา */}
                    <th className="py-1.5 px-2.5 text-left border-r border-slate-200 print:border-black print:text-black w-48 sm:w-56">
                      ประเด็นการพัฒนา
                    </th>
                    {/* 3. ชื่อโครงการ */}
                    <th className="py-1.5 px-2.5 text-left border-r border-slate-200 print:border-black print:text-black">
                      ชื่อโครงการ
                    </th>
                    {/* 4. งบตามแผน (บาท) */}
                    <th className="py-1.5 px-2 text-right w-28 sm:w-32 border-r border-slate-200 print:border-black print:text-black">
                      งบตามแผน (บาท)
                    </th>
                    {/* 5. อนุมัติแล้ว (บาท) */}
                    <th className="py-1.5 px-2 text-right w-28 sm:w-30 border-r border-slate-200 print:border-black print:text-black">
                      อนุมัติแล้ว (บาท)
                    </th>
                    {/* 6. คงเหลือ (บาท) */}
                    <th className="py-1.5 px-2 text-right w-28 sm:w-32 print:border-black print:text-black">
                      คงเหลือ (บาท)
                    </th>
                  </tr>
                </thead>

                {/* Screen Table Body (Paginated - max 5 items to fit perfectly without scrollbar) */}
                <tbody className="divide-y divide-slate-100 text-xs print:hidden">
                  {paginatedProjects.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        ไม่พบข้อมูลโครงการตามเงื่อนไขที่ระบุ
                      </td>
                    </tr>
                  ) : (
                    paginatedProjects.map((project, index) => {
                      const budgetPlan = project.budgetPlan || 0;
                      const budgetApproved = project.budgetApproved || 0;
                      const remaining = budgetPlan - budgetApproved;

                      return (
                        <tr
                          key={project.id || `${project.code}-${index}`}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          {/* 1. ประเด็นการพัฒนา */}
                          <td className="py-1.5 px-2.5 text-slate-700 leading-normal text-left border-r border-slate-100">
                            <span className="truncate block max-w-[200px]" title={project.planStrategy}>
                              {project.planStrategy || '-'}
                            </span>
                          </td>

                          {/* 2. ชื่อโครงการ */}
                          <td className="py-1.5 px-2.5 text-left border-r border-slate-100 min-w-0">
                            <div className="font-medium text-slate-900 leading-normal flex items-center gap-1.5 min-w-0">
                              <span className="truncate" title={project.name}>{project.name}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 truncate mt-0.5">
                              {project.department || '-'}
                            </div>
                          </td>

                          {/* 4. งบตามแผน (บาท) */}
                          <td className="py-1.5 px-2 text-right font-mono font-bold text-slate-900 border-r border-slate-100 whitespace-nowrap">
                            {budgetPlan.toLocaleString()}
                          </td>

                          {/* 5. อนุมัติแล้ว (บาท) */}
                          <td className="py-1.5 px-2 text-right font-mono font-bold text-[#15803d] border-r border-slate-100 whitespace-nowrap">
                            {budgetApproved.toLocaleString()}
                          </td>

                          {/* 6. คงเหลือ (บาท) */}
                          <td className="py-1.5 px-2 text-right font-mono font-bold text-[#4f46e5] whitespace-nowrap">
                            {remaining.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>

                {/* Print Table Body (All filtered projects printed) */}
                <tbody className="hidden print:table-row-group divide-y divide-black text-xs">
                  {filteredProjects.map((project, index) => {
                    const budgetPlan = project.budgetPlan || 0;
                    const budgetApproved = project.budgetApproved || 0;
                    const remaining = budgetPlan - budgetApproved;

                    return (
                      <tr key={`print-${project.id || index}`}>
                        <td className="py-1.5 px-2.5 border border-black text-black">
                          {project.planStrategy || '-'}
                        </td>
                        <td className="py-1.5 px-2.5 border border-black text-black">
                          {project.name}
                        </td>
                        <td className="py-1.5 px-2 text-right font-mono font-bold border border-black text-black">
                          {budgetPlan.toLocaleString()}
                        </td>
                        <td className="py-1.5 px-2 text-right font-mono font-bold border border-black text-black">
                          {budgetApproved.toLocaleString()}
                        </td>
                        <td className="py-1.5 px-2 text-right font-mono font-bold border border-black text-black">
                          {remaining.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {/* แถวสรุปรวมท้ายตาราง (Table Footer) */}
                <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-xs shadow-2xs print:bg-white print:border-black">
                  <tr className="print:border-black">
                    <td
                      colSpan={3}
                      className="py-1.5 px-2.5 text-right font-bold text-slate-900 border-r border-slate-200 print:border-black print:text-black"
                    >
                      รวมทั้งสิ้น ({totalProjects} โครงการ)
                    </td>
                    <td className="py-1.5 px-2 text-right font-mono font-bold text-slate-900 border-r border-slate-200 print:border-black print:text-black whitespace-nowrap">
                      {totalPlan.toLocaleString()}
                    </td>
                    <td className="py-1.5 px-2 text-right font-mono font-bold text-[#15803d] border-r border-slate-200 print:border-black print:text-black whitespace-nowrap">
                      {totalApproved.toLocaleString()}
                    </td>
                    <td className="py-1.5 px-2 text-right font-mono font-bold text-[#4f46e5] print:border-black print:text-black whitespace-nowrap">
                      {totalRemaining.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            ) : (
              /* SECONDARY STRATEGY SUMMARY TABLE */
              <table className="w-full text-left border-collapse budget-report-table">
                <thead className="bg-slate-100/95 backdrop-blur-xs shadow-2xs print:bg-white">
                  <tr className="text-slate-800 text-xs font-semibold border-b border-slate-200 print:border-black">
                    <th className="py-1.5 px-2 text-center w-12 border-r border-slate-200 print:border-black">ที่</th>
                    <th className="py-1.5 px-3 border-r border-slate-200 print:border-black">ยุทธศาสตร์ / ประเด็นการพัฒนา</th>
                    <th className="py-1.5 px-2 text-center w-20 border-r border-slate-200 print:border-black">โครงการ</th>
                    <th className="py-1.5 px-2 text-right w-28 sm:w-32 border-r border-slate-200 print:border-black">งบตามแผน (บาท)</th>
                    <th className="py-1.5 px-2 text-right w-28 sm:w-30 border-r border-slate-200 print:border-black">อนุมัติแล้ว (บาท)</th>
                    <th className="py-1.5 px-2 text-right w-28 sm:w-32 print:border-black">คงเหลือ (บาท)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs print:hidden">
                  {paginatedStrategies.map((item) => (
                    <tr key={item.order} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-1.5 px-2 text-center text-slate-700 font-medium border-r border-slate-100">
                        {item.order}
                      </td>
                      <td className="py-1.5 px-3 text-slate-800 font-normal leading-normal border-r border-slate-100 truncate max-w-[280px]">
                        {item.name}
                      </td>
                      <td className="py-1.5 px-2 text-center font-mono font-medium text-slate-800 border-r border-slate-100">
                        {item.count}
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono font-bold text-slate-900 border-r border-slate-100 whitespace-nowrap">
                        {item.plan.toLocaleString()}
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono font-bold text-[#15803d] border-r border-slate-100 whitespace-nowrap">
                        {item.approved.toLocaleString()}
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono font-bold text-[#4f46e5] whitespace-nowrap">
                        {item.remaining.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                {/* Print Body for Strategy Summary */}
                <tbody className="hidden print:table-row-group divide-y divide-black text-xs">
                  {strategyList.map((item) => (
                    <tr key={`print-strat-${item.order}`}>
                      <td className="py-1.5 px-2 text-center border border-black font-medium">{item.order}</td>
                      <td className="py-1.5 px-3 border border-black text-black">{item.name}</td>
                      <td className="py-1.5 px-2 text-center font-mono border border-black text-black">{item.count}</td>
                      <td className="py-1.5 px-2 text-right font-mono font-bold border border-black text-black">{item.plan.toLocaleString()}</td>
                      <td className="py-1.5 px-2 text-right font-mono font-bold border border-black text-black">{item.approved.toLocaleString()}</td>
                      <td className="py-1.5 px-2 text-right font-mono font-bold border border-black text-black">{item.remaining.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-xs shadow-2xs print:bg-white print:border-black">
                  <tr className="print:border-black">
                    <td colSpan={2} className="py-1.5 px-3 text-right text-slate-800 font-bold border-r border-slate-200 print:border-black print:text-black">
                      รวมทั้งสิ้น
                    </td>
                    <td className="py-1.5 px-2 text-center font-mono text-slate-900 border-r border-slate-200 print:border-black print:text-black">
                      {totalProjects}
                    </td>
                    <td className="py-1.5 px-2 text-right font-mono text-slate-900 border-r border-slate-200 print:border-black print:text-black whitespace-nowrap">
                      {totalPlan.toLocaleString()}
                    </td>
                    <td className="py-1.5 px-2 text-right font-mono text-[#15803d] border-r border-slate-200 print:border-black print:text-black whitespace-nowrap">
                      {totalApproved.toLocaleString()}
                    </td>
                    <td className="py-1.5 px-2 text-right font-mono text-[#4f46e5] print:border-black print:text-black whitespace-nowrap">
                      {totalRemaining.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </div>

        {/* 4. Modal Bottom Footer: Sticky / Locked at Bottom (shrink-0) with Pagination */}
        <div className="shrink-0 px-4 sm:px-6 py-2 bg-white border-t border-slate-200 flex items-center justify-between shadow-2xs print:hidden text-xs">
          <div className="text-[11px] text-slate-500">
            {viewMode === 'projects' ? (
              filteredProjects.length > 0 ? (
                <span>
                  แสดง {(currentPage - 1) * PAGE_SIZE + 1} -{' '}
                  {Math.min(currentPage * PAGE_SIZE, filteredProjects.length)} จากทั้งหมด{' '}
                  <span className="font-semibold text-slate-700">{filteredProjects.length}</span> โครงการ
                </span>
              ) : (
                <span>0 โครงการ</span>
              )
            ) : (
              strategyList.length > 0 ? (
                <span>
                  แสดง {(currentPage - 1) * PAGE_SIZE + 1} -{' '}
                  {Math.min(currentPage * PAGE_SIZE, strategyList.length)} จากทั้งหมด{' '}
                  <span className="font-semibold text-slate-700">{strategyList.length}</span> ประเด็น
                </span>
              ) : (
                <span>0 ประเด็น</span>
              )
            )}
          </div>

          {/* Pagination Controls */}
          {((viewMode === 'projects' && totalPages > 1) || (viewMode === 'strategies' && totalStrategyPages > 1)) && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                className="p-1 px-2 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-0.5 text-xs font-medium"
                title="หน้าก่อนหน้า"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>ก่อนหน้า</span>
              </button>
              <span className="text-xs font-medium text-slate-600 px-1.5 font-mono">
                {currentPage} / {viewMode === 'projects' ? totalPages : totalStrategyPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= (viewMode === 'projects' ? totalPages : totalStrategyPages)}
                onClick={() => setCurrentPage((prev) => Math.min(viewMode === 'projects' ? totalPages : totalStrategyPages, prev + 1))}
                className="p-1 px-2 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-0.5 text-xs font-medium"
                title="หน้าถัดไป"
              >
                <span>ถัดไป</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>พิมพ์</span>
            </button>
            <button
              id="btn-footer-close"
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-700 hover:bg-slate-800 rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              ปิด
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

