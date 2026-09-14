import React, { useState, useMemo, useEffect } from 'react';
import {
  Landmark,
  Search,
  FolderOpen,
  RotateCcw,
  Download,
  Printer,
  FileSpreadsheet,
  Plus,
  Clock,
  CheckCircle2,
  MoreVertical,
  Eye,
  ShieldAlert,
  AlertTriangle,
  X
} from 'lucide-react';
import { ProjectData, FilterCriteria, UserAccount } from '../types';
import { DEVELOPMENT_STRATEGIES, BUDGET_SOURCES } from '../utils/constants';
import { matchesProjectSearch, getProjectDisplayId } from '../utils/projectCode';

interface BudgetApprovalViewProps {
  projects: ProjectData[];
  onOpenApprovalModal: (project: ProjectData) => void;
  onOpenRemainingBudgetReport: () => void;
  onOpenProjectDetail?: (project: ProjectData) => void;
  onRevokeApproval?: (project: ProjectData) => void;
  isAdmin?: boolean;
  currentUser?: UserAccount | null;
}

export const BudgetApprovalView: React.FC<BudgetApprovalViewProps> = ({
  projects,
  onOpenApprovalModal,
  onOpenRemainingBudgetReport,
  onOpenProjectDetail,
  onRevokeApproval,
  isAdmin = true,
  currentUser
}) => {
  const [filterCriteria, setFilterCriteria] = useState<FilterCriteria>({
    year: '2571',
    planStrategy: '',
    budgetSource: '',
    searchKeyword: '',
    budgetAmount: '',
    status: 'all'
  });

  const [showExportMenu, setShowExportMenu] = useState(false);
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const [revokingProject, setRevokingProject] = useState<ProjectData | null>(null);

  // Close context menu on outside click
  useEffect(() => {
    const handleDocumentClick = () => {
      setOpenActionMenuId(null);
    };
    if (openActionMenuId) {
      document.addEventListener('click', handleDocumentClick);
      return () => document.removeEventListener('click', handleDocumentClick);
    }
  }, [openActionMenuId]);

  // Handle Admin revoking budget approval
  const handleExecuteRevoke = (project: ProjectData) => {
    const updated: ProjectData = {
      ...project,
      budgetSource: '- ยังไม่ได้จัดสรร -',
      budgetApproved: 0,
      approvedDate: '-',
      approvalOrderNo: '',
      status: 'pending'
    };
    if (onRevokeApproval) {
      onRevokeApproval(updated);
    }
    setRevokingProject(null);
    setOpenActionMenuId(null);
  };

  // Filter projects based on criteria
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      // Year filter
      if (filterCriteria.year && filterCriteria.year !== 'all' && p.year !== filterCriteria.year) {
        return false;
      }
      // Plan Strategy filter
      if (filterCriteria.planStrategy && p.planStrategy !== filterCriteria.planStrategy) {
        return false;
      }
      // Budget Source filter
      if (filterCriteria.budgetSource && p.budgetSource !== filterCriteria.budgetSource) {
        return false;
      }
      // Status filter
      if (filterCriteria.status === 'approved' && p.status !== 'approved') {
        return false;
      }
      if (filterCriteria.status === 'pending' && p.status !== 'pending') {
        return false;
      }
      // Search keyword filter (name, code, department, or note)
      if (filterCriteria.searchKeyword.trim()) {
        if (!matchesProjectSearch(filterCriteria.searchKeyword, p)) return false;
      }
      // Budget Amount filter
      if (filterCriteria.budgetAmount.trim()) {
        const amount = Number(filterCriteria.budgetAmount.replace(/,/g, ''));
        if (!isNaN(amount) && amount > 0 && p.budgetPlan !== amount) {
          return false;
        }
      }
      return true;
    });
  }, [projects, filterCriteria]);

  // Calculations for summary banner
  const stats = useMemo(() => {
    const totalCount = filteredProjects.length;
    const approvedCount = filteredProjects.filter((p) => p.status === 'approved').length;
    const pendingCount = totalCount - approvedCount;

    const totalPlanBudget = filteredProjects.reduce((sum, p) => sum + (p.budgetPlan || 0), 0);
    const totalApprovedBudget = filteredProjects.reduce((sum, p) => sum + (p.budgetApproved || 0), 0);
    const remainingBudget = totalPlanBudget - totalApprovedBudget;

    return {
      totalCount,
      approvedCount,
      pendingCount,
      totalPlanBudget,
      totalApprovedBudget,
      remainingBudget
    };
  }, [filteredProjects]);

  const handleResetFilter = () => {
    setFilterCriteria({
      year: '2571',
      planStrategy: '',
      budgetSource: '',
      searchKeyword: '',
      budgetAmount: '',
      status: 'all'
    });
  };

  const handleShowAll = () => {
    setFilterCriteria({
      year: 'all',
      planStrategy: '',
      budgetSource: '',
      searchKeyword: '',
      budgetAmount: '',
      status: 'all'
    });
  };

  const handleExportCSV = () => {
    const headers = [
      'ID',
      'รหัสโครงการเดิม',
      'ประเด็นการพัฒนา',
      'ชื่อโครงการ',
      'แผนงาน',
      'งบตามแผน (บาท)',
      'แหล่งที่มาของงบประมาณ',
      'งบประมาณที่อนุมัติ (บาท)',
      'วันที่อนุมัติ',
      'สถานะ',
      'หน่วยงานรับผิดชอบ'
    ];

    const rows = filteredProjects.map((p, idx) => [
      `"${getProjectDisplayId(p, p.orderNumber || idx + 1)}"`,
      `"${p.code}"`,
      `"${p.planStrategy}"`,
      `"${p.name}"`,
      `"${p.planCategory}"`,
      p.budgetPlan,
      `"${p.budgetSource}"`,
      p.budgetApproved,
      `"${p.approvedDate}"`,
      `"${p.status === 'approved' ? 'อนุมัติแล้ว' : 'ยังไม่อนุมัติงบ'}"`,
      `"${p.department}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `งบประมาณแผนพัฒนาเทศบาลเมืองศิลา_${filterCriteria.year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 h-full min-h-0 overflow-hidden">
      {/* Top Banner Bar */}
      <header
        id="top-banner"
        className="bg-[#055740] text-white px-4 py-2 sm:px-6 shadow-sm flex items-center gap-2.5 shrink-0"
      >
        <div className="w-7 h-7 rounded-lg bg-[#086d50] flex items-center justify-center shrink-0">
          <Landmark className="w-4 h-4 text-emerald-100" />
        </div>
        <h1 className="text-xs sm:text-sm font-bold tracking-tight">
          ระบบอนุมัติงบประมาณ | ระบบแผนพัฒนาเทศบาลเมืองศิลา | เทศบาลเมืองศิลา จ.ขอนแก่น
        </h1>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-3">
        {/* Filter Card */}
        <section
          id="filter-panel"
          className="bg-white rounded-xl border border-slate-200 shadow-xs p-3 sm:p-4 space-y-3"
        >
          {/* Row 1: ปีงบประมาณ */}
          <div className="flex items-center gap-3">
            <label className="text-xs sm:text-sm font-semibold text-slate-700 whitespace-nowrap">
              ปีงบประมาณ:
            </label>
            <div className="w-44">
              <select
                id="select-fiscal-year"
                value={filterCriteria.year}
                onChange={(e) => setFilterCriteria({ ...filterCriteria, year: e.target.value })}
                className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="2571">พ.ศ. 2571</option>
                <option value="2572">พ.ศ. 2572</option>
                <option value="2573">พ.ศ. 2573</option>
                <option value="2574">พ.ศ. 2574</option>
                <option value="2575">พ.ศ. 2575</option>
                <option value="all">-- ทุกปีงบประมาณ --</option>
              </select>
            </div>
          </div>

          {/* Row 2: Filters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                ประเด็นการพัฒนา
              </label>
              <select
                id="filter-strategy"
                value={filterCriteria.planStrategy}
                onChange={(e) =>
                  setFilterCriteria({ ...filterCriteria, planStrategy: e.target.value })
                }
                title={filterCriteria.planStrategy || '-- ทุกประเด็นการพัฒนา --'}
                className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-2 bg-white text-slate-700 truncate focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="">-- ทุกประเด็นการพัฒนา --</option>
                {DEVELOPMENT_STRATEGIES.map((s, idx) => (
                  <option key={idx} value={s} title={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                แหล่งที่มาของงบประมาณ
              </label>
              <select
                id="filter-budget-source"
                value={filterCriteria.budgetSource}
                onChange={(e) =>
                  setFilterCriteria({ ...filterCriteria, budgetSource: e.target.value })
                }
                title={filterCriteria.budgetSource || '-- เลือกแหล่งที่มาของงบประมาณ --'}
                className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-2 bg-white text-slate-700 truncate focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="">-- เลือกแหล่งที่มาของงบประมาณ --</option>
                {BUDGET_SOURCES.map((src, idx) => (
                  <option key={idx} value={src} title={src}>
                    {src}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                ชื่อโครงการ
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="input-search-project"
                  type="text"
                  placeholder="ค้นหาชื่อโครงการ..."
                  value={filterCriteria.searchKeyword}
                  onChange={(e) =>
                    setFilterCriteria({ ...filterCriteria, searchKeyword: e.target.value })
                  }
                  className="w-full text-xs border border-slate-300 rounded-lg pl-8 pr-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                งบประมาณ (บาท)
              </label>
              <input
                id="input-filter-budget"
                type="text"
                placeholder="ระบุจำนวนเงิน..."
                value={filterCriteria.budgetAmount}
                onChange={(e) =>
                  setFilterCriteria({ ...filterCriteria, budgetAmount: e.target.value })
                }
                className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
              </input>
            </div>
          </div>

          {/* Row 3: Action Buttons & Radios */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-2 border-t border-slate-100">
            {/* Left controls */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                id="btn-filter-search"
                type="button"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#059669] hover:bg-[#047857] text-white text-xs font-medium rounded-lg shadow-xs cursor-pointer transition-colors"
              >
                <Search className="w-3.5 h-3.5" />
                <span>ค้นหา</span>
              </button>

              <button
                id="btn-filter-all"
                type="button"
                onClick={handleShowAll}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                <FolderOpen className="w-3.5 h-3.5 text-slate-500" />
                <span>แสดงทั้งหมด</span>
              </button>

              <button
                id="btn-filter-reset"
                type="button"
                onClick={handleResetFilter}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-amber-50 text-amber-600 border border-amber-300 text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                <span>เริ่มใหม่</span>
              </button>

              {/* Radio buttons: สถานะ */}
              <div className="flex items-center gap-3 pl-3 text-xs text-slate-700">
                <span className="font-semibold text-slate-600">สถานะ:</span>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="status_filter"
                    checked={filterCriteria.status === 'all'}
                    onChange={() => setFilterCriteria({ ...filterCriteria, status: 'all' })}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>ทั้งหมด</span>
                </label>

                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="status_filter"
                    checked={filterCriteria.status === 'approved'}
                    onChange={() => setFilterCriteria({ ...filterCriteria, status: 'approved' })}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>อนุมัติแล้ว</span>
                </label>

                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="status_filter"
                    checked={filterCriteria.status === 'pending'}
                    onChange={() => setFilterCriteria({ ...filterCriteria, status: 'pending' })}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>ยังไม่อนุมัติ</span>
                </label>
              </div>
            </div>

            {/* Right controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <button
                  id="btn-export-dropdown"
                  type="button"
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#064e3b] hover:bg-[#053d2e] text-white text-xs font-medium rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ส่งออกข้อมูล {stats.totalCount}</span>
                  <span className="text-[10px]">▼</span>
                </button>

                {showExportMenu && (
                  <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1 text-xs text-slate-700">
                    <button
                      onClick={handleExportCSV}
                      className="w-full text-left px-3 py-2 hover:bg-slate-100 flex items-center gap-2 cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <span>ดาวน์โหลดเป็น CSV</span>
                    </button>
                    <button
                      onClick={handlePrint}
                      className="w-full text-left px-3 py-2 hover:bg-slate-100 flex items-center gap-2 cursor-pointer"
                    >
                      <Printer className="w-4 h-4 text-blue-600" />
                      <span>พิมพ์หน้ารายการ (PDF)</span>
                    </button>
                  </div>
                )}
              </div>

              <button
                id="btn-print-report"
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>พิมพ์รายงาน</span>
              </button>

              <button
                id="btn-remaining-budget-report"
                type="button"
                onClick={onOpenRemainingBudgetReport}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#059669] hover:bg-[#047857] text-white text-xs font-medium rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>รายงานยอดงบประมาณคงเหลือ</span>
              </button>
            </div>
          </div>
        </section>

        {/* Summary Stats Strip */}
        <section
          id="summary-stats-strip"
          className="bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
        >
          {/* Left stats */}
          <div className="flex flex-wrap items-center gap-3 text-slate-700">
            <span>
              พบโครงการตามเงื่อนไข: <strong className="text-slate-900">{stats.totalCount} โครงการ</strong>{' '}
              <span className="text-slate-500">
                ({filterCriteria.year === 'all' ? 'ทุกปี' : `โครงการปี ${filterCriteria.year}`})
              </span>
            </span>
            <span className="text-slate-300">•</span>
            <span>
              อนุมัติงบแล้ว:{' '}
              <strong className="text-emerald-700">{stats.approvedCount} โครงการ</strong>{' '}
              <span className="text-emerald-600">(มีงบพร้อมใช้)</span>
            </span>
            <span className="text-slate-300">•</span>
            <span>
              ยังไม่อนุมัติ:{' '}
              <strong className="text-amber-700">{stats.pendingCount} โครงการ</strong>{' '}
              <span className="text-amber-600">(รอจัดสรรงบ)</span>
            </span>
          </div>

          {/* Right stats */}
          <div className="flex flex-wrap items-center gap-4 font-mono font-medium">
            <div>
              <span className="text-slate-500 text-[11px] mr-1">
                งบตามแผน ({filterCriteria.year === 'all' ? 'รวม' : `ปี ${filterCriteria.year}`}):
              </span>
              <strong className="text-slate-900 text-xs">
                ฿{stats.totalPlanBudget.toLocaleString()}
              </strong>
            </div>

            <div className="border-l border-slate-300 pl-3">
              <span className="text-emerald-600 text-[11px] mr-1">อนุมัติจัดสรรจริง:</span>
              <strong className="text-emerald-700 text-xs">
                ฿{stats.totalApprovedBudget.toLocaleString()}
              </strong>
            </div>

            <div className="border-l border-slate-300 pl-3">
              <span className="text-blue-600 text-[11px] mr-1">งบคงเหลือตามแผน:</span>
              <strong className="text-blue-700 text-xs">
                ฿{stats.remainingBudget.toLocaleString()}
              </strong>
            </div>
          </div>
        </section>

        {/* Data Table */}
        <section
          id="budget-approval-table-wrapper"
          className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden"
        >
          <div className="overflow-auto max-h-[60vh]">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-[#054e3b] text-white text-xs font-semibold tracking-wide sticky top-0 z-10">
                  <th className="py-3 px-4 w-52 border-r border-[#075f48]">ประเด็นการพัฒนา</th>
                  <th className="py-3 px-3 text-center w-32 border-r border-[#075f48]">
                    อนุมัติงบประมาณ
                  </th>
                  <th className="py-3 px-4 border-r border-[#075f48]">ชื่อโครงการ</th>
                  <th className="py-3 px-4 text-right w-36 border-r border-[#075f48]">
                    งบตามแผนพัฒนาท้องถิ่น
                  </th>
                  <th className="py-3 px-3 text-center w-36 border-r border-[#075f48]">
                    แหล่งที่มาของงบประมาณ
                  </th>
                  <th className="py-3 px-3 text-right w-32 border-r border-[#075f48]">
                    งบประมาณที่อนุมัติ
                  </th>
                  <th className="py-3 px-3 text-center w-28 border-r border-[#075f48]">
                    วันที่อนุมัติ
                  </th>
                  <th className="py-3 px-3 text-center w-28 border-r border-[#075f48]">สถานะ</th>
                  <th className="py-3 px-4 text-center w-32 border-r border-[#075f48]">หน่วยงานรับผิดชอบ</th>
                  <th className="py-3 px-4 text-center w-52">หมายเหตุ / ที่มาในแผน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs text-slate-700">
                {filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      ไม่พบข้อมูลโครงการตามเงื่อนไขที่ระบุ
                    </td>
                  </tr>
                ) : (
                  filteredProjects.map((project, index) => {
                    const isApproved = project.status === 'approved';
                    return (
                      <tr
                        key={project.id}
                        onClick={() => onOpenProjectDetail?.(project)}
                        className="hover:bg-emerald-50/40 transition-colors group cursor-pointer"
                        title="กดที่แถบโครงการเพื่อเปิดดูข้อมูล (Read-Only)"
                      >
                        {/* 1. ประเด็นการพัฒนา */}
                        <td className="py-3.5 px-4 text-slate-700 leading-relaxed">
                          <span className="line-clamp-2" title={project.planStrategy}>
                            {project.planStrategy}
                          </span>
                        </td>

                        {/* 3. อนุมัติงบประมาณ / การจัดการ */}
                        <td
                          className="py-3.5 px-3 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {isApproved ? (
                            <div className="inline-flex items-center justify-center gap-1.5 relative">
                              {/* Read-only Badge: สไตล์สีเขียว bg-emerald-50 text-emerald-700 border-emerald-200 */}
                              <span
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md select-none shadow-2xs"
                                title="รายการนี้ได้รับการอนุมัติงบประมาณแล้ว (อ่านอย่างเดียว)"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>อนุมัติแล้ว</span>
                              </span>

                              {/* ระบบปลดล็อกสำหรับ Admin (Action Context Menu) */}
                              {isAdmin && (
                                <div className="relative inline-block text-left">
                                  <button
                                    type="button"
                                    id={`btn-action-menu-${project.id}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenActionMenuId(openActionMenuId === project.id ? null : project.id);
                                    }}
                                    title="เมนูจัดการ (เฉพาะ Admin)"
                                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer"
                                  >
                                    <MoreVertical className="w-3.5 h-3.5" />
                                  </button>

                                  {openActionMenuId === project.id && (
                                    <div
                                      className="absolute left-1/2 -translate-x-1/2 mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40 text-left animate-in fade-in zoom-in-95 duration-100"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 border-b border-slate-100 uppercase tracking-wider flex items-center gap-1">
                                        <ShieldAlert className="w-3 h-3 text-emerald-600" />
                                        <span>สิทธิ์ผู้ดูแลระบบ (Admin)</span>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setOpenActionMenuId(null);
                                          onOpenProjectDetail?.(project);
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                                      >
                                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                                        <span>ดูข้อมูลโครงการ (Read-Only)</span>
                                      </button>

                                      <button
                                        type="button"
                                        id={`btn-revoke-approval-${project.id}`}
                                        onClick={() => {
                                          setOpenActionMenuId(null);
                                          setRevokingProject(project);
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-amber-700 hover:bg-amber-50 transition-colors text-left cursor-pointer font-medium border-t border-slate-100"
                                      >
                                        <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                                        <span>ยกเลิกการอนุมัติ</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : currentUser?.role === 'public' || currentUser?.role === 'staff' ? (
                            <span
                              title="การอนุมัติตั้งงบประมาณสงวนไว้สำหรับผู้บริหาร (Executive) และผู้ดูแลระบบ (Admin)"
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-md select-none"
                            >
                              <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                              <span>รอผู้บริหารอนุมัติ</span>
                            </span>
                          ) : (
                            <button
                              id={`btn-approve-${project.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenApprovalModal(project);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-[#059669] hover:bg-[#047857] rounded-md shadow-xs transition-colors cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>อนุมัติข้อมูล</span>
                            </button>
                          )}
                        </td>

                        {/* 4. ชื่อโครงการ */}
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-slate-900 group-hover:text-emerald-900 leading-tight flex items-center gap-1.5 flex-wrap">
                            <span className="underline-offset-2 group-hover:underline">{project.name}</span>
                            <Eye className="w-3 h-3 text-slate-400 group-hover:text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-0.5" />
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                            <span>แผนงาน: {project.planCategory}</span>
                            <span>•</span>
                            {project.publishStatus === 'pending_publish' ? (
                              <span className="inline-block bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.2 rounded-full font-medium text-[10px]">
                                รอจัดรอบประกาศใช้
                              </span>
                            ) : project.publishStatus === 'published_additional' ? (
                              <span className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.2 rounded-full font-medium text-[10px]">
                                ประกาศใช้แล้ว (เพิ่มเติม)
                              </span>
                            ) : (
                              <span className="inline-block bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.2 rounded-full font-medium text-[10px]">
                                ประกาศใช้แล้ว
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 5. งบตามแผนพัฒนาท้องถิ่น */}
                        <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-900">
                          {project.budgetPlan > 0
                            ? `฿${project.budgetPlan.toLocaleString()}`
                            : '-'}
                        </td>

                        {/* 6. แหล่งที่มาของงบประมาณ */}
                        <td className="py-3.5 px-3 text-center text-slate-500 italic">
                          {project.budgetSource || '- ยังไม่ได้จัดสรร -'}
                        </td>

                        {/* 7. งบประมาณที่อนุมัติ */}
                        <td className="py-3.5 px-3 text-right font-mono font-medium">
                          {isApproved ? (
                            <span className="text-emerald-700 font-bold">
                              ฿{project.budgetApproved.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        {/* 8. วันที่อนุมัติ */}
                        <td className="py-3.5 px-3 text-center text-slate-600">
                          {project.approvedDate || '-'}
                        </td>

                        {/* 9. สถานะ */}
                        <td className="py-3.5 px-3 text-center">
                          {isApproved ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>อนุมัติแล้ว</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium text-slate-600 bg-slate-100 border border-slate-200">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>ยังไม่อนุมัติงบ</span>
                            </span>
                          )}
                        </td>

                        {/* 10. หน่วยงานรับผิดชอบ */}
                        <td className="py-3.5 px-4 text-center font-medium text-slate-700 border-r border-slate-100">
                          {project.department}
                        </td>

                        {/* 11. หมายเหตุ / ที่มาในแผน */}
                        <td className="py-3.5 px-4 text-xs text-slate-700">
                          {project.planReference ? (
                            <div className="bg-emerald-50/80 text-emerald-900 border border-emerald-200 rounded-lg p-2 text-[11px] leading-relaxed shadow-2xs">
                              <div className="font-bold text-emerald-800 flex items-center gap-1.5 mb-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block"></span>
                                <span>ที่มาในเล่มแผน:</span>
                              </div>
                              <div className="text-slate-700 font-medium">
                                {project.planReference}
                              </div>
                            </div>
                          ) : project.note ? (
                            <span className="text-slate-500 text-[11px] leading-relaxed">{project.note}</span>
                          ) : (
                            <span className="text-slate-400 text-[11px] italic">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {/* แถวสรุปรวมท้ายตาราง (Table Footer) */}
              <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-xs print:bg-white print:border-black">
                <tr>
                  <td colSpan={4} className="py-3 px-4 text-right text-slate-900 font-bold">
                    รวมทั้งสิ้น ({filteredProjects.length} โครงการ)
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                    ฿{stats.totalPlanBudget.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-center text-slate-400">-</td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                    ฿{stats.totalApprovedBudget.toLocaleString()}
                  </td>
                  <td colSpan={4} className="py-3 px-4 text-left font-mono font-bold text-blue-700">
                    คงเหลือ: ฿{stats.remainingBudget.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      </div>

      {/* Modal ยืนยันยกเลิกการอนุมัติ (เฉพาะสิทธิ์ Admin) */}
      {revokingProject && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="bg-amber-500 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-base">
                <AlertTriangle className="w-5 h-5 text-amber-100" />
                <span>ยืนยันยกเลิกการอนุมัติงบประมาณ</span>
              </div>
              <button
                type="button"
                onClick={() => setRevokingProject(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-amber-600/50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 leading-relaxed">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">การดำเนินการสำหรับผู้ดูแลระบบ (Admin Only)</div>
                  <div className="mt-0.5 text-amber-800">
                    การยกเลิกการอนุมัติจะคืนสถานะโครงการนี้กลับเป็น <strong>"ยังไม่อนุมัติงบ" (Pending)</strong> และรีเซ็ตยอดงบประมาณที่อนุมัติเป็น 0 บาท
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-1.5 text-xs">
                <div className="text-slate-500">โครงการ:</div>
                <div className="font-semibold text-slate-800 leading-snug">
                  {revokingProject.name}
                </div>
                <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-600">
                  <span>งบเดิมที่อนุมัติ:</span>
                  <span className="font-bold font-mono text-emerald-700">
                    ฿{revokingProject.budgetApproved.toLocaleString()}
                  </span>
                  <span>({revokingProject.budgetSource})</span>
                </div>
              </div>

              <p className="text-xs text-slate-600">
                คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการอนุมัติโครงการนี้?
              </p>
            </div>

            <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setRevokingProject(null)}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                id="btn-confirm-revoke-approval"
                onClick={() => handleExecuteRevoke(revokingProject)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>ยืนยันยกเลิกการอนุมัติ</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
