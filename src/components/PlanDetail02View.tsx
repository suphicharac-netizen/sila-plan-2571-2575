import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  FolderOpen,
  RotateCcw,
  Download,
  Printer,
  Plus,
  Network,
  History,
  Pencil,
  Trash2,
  FileSpreadsheet,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Clock,
  AlertTriangle,
  CheckCircle2,
  X
} from 'lucide-react';
import { ProjectData, PlanEdition, UserAccount, PlanAnnouncement } from '../types';
import { DEVELOPMENT_STRATEGIES, DEPARTMENTS } from '../utils/constants';
import { matchesProjectSearch } from '../utils/projectCode';
import { exportPlan02ToExcel } from '../utils/exportPlan02Excel';
import { PlanSelectCandidateModal } from './PlanSelectCandidateModal';
import { PlanComparisonModal } from './PlanComparisonModal';

// Helper component for typographic hierarchy in long table text
const FormattedTextHierarchy: React.FC<{ text: string }> = ({ text }) => {
  if (!text || !text.trim()) return <span className="text-slate-400 italic text-sm font-normal">-</span>;

  return (
    <div className="text-sm font-normal text-slate-800 leading-relaxed break-words whitespace-pre-line text-left">
      {text.trim()}
    </div>
  );
};

/**
 * ตรวจสอบเงื่อนไขสถานะของแผนพัฒนาท้องถิ่น สำหรับโครงการ
 * - สถานะ "ร่างแผน" (ก่อนอนุมัติ): อนุญาตให้คลิกไอคอนรูปดินสอ (Edit) เพื่อแก้ไขข้อมูลโครงการได้ตามปกติ
 * - สถานะ "อนุมัติ / ประกาศใช้แล้ว": ปิดการใช้งานไอคอนรูปดินสอ (Disable Edit Icon / เปลี่ยนเป็นสีเทา) ห้ามแก้ไขข้อมูลโดยตรง พร้อมแสดง Tooltip
 */
export const checkIsProjectApprovedOrPublished = (
  project: ProjectData,
  announcements?: PlanAnnouncement[]
): boolean => {
  // 1. Explicit override if specified
  if (project.planStatus === 'draft') return false;
  if (project.planStatus === 'approved') return true;

  // 2. ถ้าโครงการอยู่ในประกาศแผนฯ ที่มีสถานะ "approved" (อนุมัติแล้ว)
  if (
    announcements &&
    announcements.some(
      (a) => a.status === 'approved' && a.projectIds?.includes(project.id)
    )
  ) {
    return true;
  }

  // 3. ถ้า publishStatus เป็น 'pending_publish' -> คือร่างแผน (รอจัดรอบประกาศใช้)
  if (project.publishStatus === 'pending_publish') {
    return false;
  }

  // 4. ถ้าสถานะเป็น 'approved' -> ได้รับการอนุมัติแล้ว
  if (project.status === 'approved') {
    return true;
  }

  // 5. ถ้า publishStatus เป็นรอบประกาศใช้ที่ประกาศแล้ว และ status ไม่ใช่ 'pending'
  if (
    (project.publishStatus === 'published_first' ||
      project.publishStatus === 'published_additional' ||
      project.publishStatus === 'published_changed') &&
    project.status !== 'pending'
  ) {
    return true;
  }

  // 6. กรณีอื่นๆ เช่น status เป็น 'pending' และไม่มีการอนุมัติ -> ร่างแผน (ก่อนอนุมัติ)
  return false;
};

interface PlanDetail02ViewProps {
  edition: PlanEdition;
  projects: ProjectData[];
  onAddProject: (edition: PlanEdition) => void;
  onEditProject: (project: ProjectData) => void;
  onViewProject: (project: ProjectData) => void;
  onViewHistory: (project: ProjectData) => void;
  onDeleteProject: (projectId: string) => void;
  onSaveNewProject?: (project: ProjectData) => void;
  currentUser?: UserAccount | null;
  announcements?: PlanAnnouncement[];
}

export const PlanDetail02View: React.FC<PlanDetail02ViewProps> = ({
  edition,
  projects,
  onAddProject,
  onEditProject,
  onViewProject,
  onViewHistory,
  onDeleteProject,
  onSaveNewProject,
  currentUser,
  announcements
}) => {
  // Edition title mappings
  const editionInfo: Record<PlanEdition, { title: string; short: string; addLabel: string }> = {
    first: {
      title: 'แผนพัฒนาท้องถิ่น (แบบ ผ.02) - ฉบับแรก',
      short: 'ฉบับแรก',
      addLabel: '+ เพิ่มโครงการ (ฉบับแรก)'
    },
    additional: {
      title: 'แผนพัฒนาท้องถิ่น (แบบ ผ.02) - ฉบับเพิ่มเติม',
      short: 'ฉบับเพิ่มเติม',
      addLabel: '+ เพิ่มโครงการ (ฉบับเพิ่มเติม)'
    },
    changed: {
      title: 'แผนพัฒนาท้องถิ่น (แบบ ผ.02) - ฉบับเปลี่ยนแปลง',
      short: 'ฉบับเปลี่ยนแปลง',
      addLabel: '+ เลือกโครงการเพื่อเปลี่ยนแปลง'
    },
    amended: {
      title: 'แผนพัฒนาท้องถิ่น (แบบ ผ.02) - ฉบับแก้ไข',
      short: 'ฉบับแก้ไข',
      addLabel: '+ เลือกโครงการเพื่อแก้ไข'
    }
  };

  const currentInfo = editionInfo[edition] || editionInfo.first;

  const getPrintEditionLine = () => {
    if (edition === 'first') {
      return 'แผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575)';
    }
    const pWithEd = filteredProjects.find((p) => p.editionNumber) || editionProjects.find((p) => p.editionNumber);
    const editionNum = pWithEd?.editionNumber || 1;
    const editionYear = fiscalYear !== 'all' ? fiscalYear : pWithEd?.year || '2571';

    if (edition === 'additional') {
      return `แผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575) เพิ่มเติม ครั้งที่ ${editionNum}/${editionYear}`;
    }
    if (edition === 'changed') {
      return `แผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575) เปลี่ยนแปลง ครั้งที่ ${editionNum}/${editionYear}`;
    }
    if (edition === 'amended') {
      return `แผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575) แก้ไข ครั้งที่ ${editionNum}/${editionYear}`;
    }
    return 'แผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575)';
  };

  // Candidate selection & comparison modal states for changed / amended
  const [isSelectCandidateModalOpen, setIsSelectCandidateModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<ProjectData | null>(null);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);

  // Delete confirmation modal states & toast
  const [projectToDelete, setProjectToDelete] = useState<ProjectData | null>(null);
  const [deleteToastMessage, setDeleteToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const handleConfirmDelete = () => {
    if (!projectToDelete) return;
    onDeleteProject(projectToDelete.id);
    setProjectToDelete(null);

    setDeleteToastMessage('ลบรายการเรียบร้อยแล้ว');
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setDeleteToastMessage(null);
    }, 3500);
  };

  // Filter states matching screenshot
  const [fiscalYear, setFiscalYear] = useState<string>('all');
  const [selectedStrategy, setSelectedStrategy] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [minBudget, setMinBudget] = useState<string>('');
  const [planStatusFilter, setPlanStatusFilter] = useState<'all' | 'draft' | 'approved'>('all');
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  // Pagination state
  const [pageSize, setPageSize] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Filter projects belonging to this edition
  const editionProjects = useMemo(() => {
    return projects.filter((p) => p.edition === edition);
  }, [projects, edition]);

  // Apply search/filters
  const filteredProjects = useMemo(() => {
    return editionProjects.filter((p) => {
      // Plan Status filter (ร่างแผน vs อนุมัติ/ประกาศใช้แล้ว)
      if (planStatusFilter !== 'all') {
        const isApproved = checkIsProjectApprovedOrPublished(p, announcements);
        if (planStatusFilter === 'approved' && !isApproved) return false;
        if (planStatusFilter === 'draft' && isApproved) return false;
      }
      // Fiscal year filter
      if (fiscalYear && fiscalYear !== 'all') {
        const bYear = p.budgetByYear?.[fiscalYear] || 0;
        const matchesTargetYear = p.year === fiscalYear;
        if (bYear <= 0 && !matchesTargetYear) {
          return false;
        }
      }
      // Strategy filter
      if (selectedStrategy && p.planStrategy !== selectedStrategy) {
        return false;
      }
      // Department filter
      if (selectedDepartment && p.department !== selectedDepartment) {
        return false;
      }
      // Search keyword (name, objective, code, etc.)
      if (searchKeyword.trim()) {
        if (!matchesProjectSearch(searchKeyword, p)) return false;
      }
      // Min budget filter
      if (minBudget.trim()) {
        const min = Number(minBudget.replace(/,/g, ''));
        const totalPrjBudget =
          (p.budgetByYear?.['2571'] || 0) +
          (p.budgetByYear?.['2572'] || 0) +
          (p.budgetByYear?.['2573'] || 0) +
          (p.budgetByYear?.['2574'] || 0) +
          (p.budgetByYear?.['2575'] || 0) || p.budgetPlan;

        if (!isNaN(min) && totalPrjBudget < min) {
          return false;
        }
      }
      return true;
    });
  }, [editionProjects, fiscalYear, selectedStrategy, selectedDepartment, searchKeyword, minBudget, planStatusFilter, announcements]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [fiscalYear, selectedStrategy, selectedDepartment, searchKeyword, minBudget, planStatusFilter, edition]);

  // Pagination slicing
  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedProjects = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredProjects.slice(start, start + pageSize);
  }, [filteredProjects, safePage, pageSize]);

  const startIndex = filteredProjects.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endIndex = Math.min(safePage * pageSize, filteredProjects.length);

  // Calculations for summary footer
  const budgetSums = useMemo(() => {
    let sum2571 = 0;
    let sum2572 = 0;
    let sum2573 = 0;
    let sum2574 = 0;
    let sum2575 = 0;

    filteredProjects.forEach((p) => {
      sum2571 += p.budgetByYear?.['2571'] || 0;
      sum2572 += p.budgetByYear?.['2572'] || 0;
      sum2573 += p.budgetByYear?.['2573'] || 0;
      sum2574 += p.budgetByYear?.['2574'] || 0;
      sum2575 += p.budgetByYear?.['2575'] || 0;
    });

    const total5Years = sum2571 + sum2572 + sum2573 + sum2574 + sum2575;

    return {
      sum2571,
      sum2572,
      sum2573,
      sum2574,
      sum2575,
      total5Years
    };
  }, [filteredProjects]);

  const handleReset = () => {
    setFiscalYear('all');
    setSelectedStrategy('');
    setSelectedDepartment('');
    setSearchKeyword('');
    setMinBudget('');
    setPlanStatusFilter('all');
  };

  const handleShowAll = () => {
    setFiscalYear('all');
    setSelectedStrategy('');
    setSelectedDepartment('');
    setSearchKeyword('');
    setMinBudget('');
    setPlanStatusFilter('all');
  };

  const handleExportExcel = () => {
    exportPlan02ToExcel({
      edition,
      editionTitle: currentInfo.short,
      projects: filteredProjects,
      fiscalYear,
      selectedStrategy,
      selectedDepartment
    });
  };

  const handleExportCSV = () => {
    const headers = [
      'ที่',
      'โครงการ',
      'ประเด็นการพัฒนา',
      'วัตถุประสงค์',
      'เป้าหมาย (ผลผลิต)',
      'งบประมาณ พ.ศ. 2571',
      'งบประมาณ พ.ศ. 2572',
      'งบประมาณ พ.ศ. 2573',
      'งบประมาณ พ.ศ. 2574',
      'งบประมาณ พ.ศ. 2575',
      'รวม 5 ปี',
      'ผลที่คาดว่าจะได้รับ',
      'หน่วยงานหลัก',
      ...(edition !== 'first' ? ['เหตุผลความจำเป็น'] : [])
    ];

    const rows = filteredProjects.map((p, idx) => {
      const b71 = p.budgetByYear?.['2571'] || 0;
      const b72 = p.budgetByYear?.['2572'] || 0;
      const b73 = p.budgetByYear?.['2573'] || 0;
      const b74 = p.budgetByYear?.['2574'] || 0;
      const b75 = p.budgetByYear?.['2575'] || 0;
      const bTotal = b71 + b72 + b73 + b74 + b75;
      const reasonContent = p.reason
        ? (p.note && p.note !== p.reason ? `${p.reason} (${p.note})` : p.reason)
        : (p.note || p.planReference || '');

      const row = [
        idx + 1,
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.planStrategy.replace(/"/g, '""')}"`,
        `"${(p.objective || '').replace(/"/g, '""')}"`,
        `"${(p.target || '').replace(/"/g, '""')}"`,
        b71,
        b72,
        b73,
        b74,
        b75,
        bTotal,
        `"${(p.expectedResults || '').replace(/"/g, '""')}"`,
        `"${p.department.replace(/"/g, '""')}"`
      ];

      if (edition !== 'first') {
        row.push(`"${reasonContent.replace(/"/g, '""')}"`);
      }

      return row;
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `บัญชีรายละเอียดโครงการ_${currentInfo.short}_เทศบาลเมืองศิลา.csv`;
    a.click();
    setShowExportDropdown(false);
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 h-full min-h-0 overflow-hidden">
      {/* 1. Top Green Banner Bar - Clean, concise, balanced height */}
      <header
        id="edition-top-banner"
        className="bg-[#055740] text-white px-4 py-2 sm:px-6 shadow-xs flex items-center justify-between shrink-0 print:hidden"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 p-0.5 border border-emerald-400/40 flex items-center justify-center shrink-0 shadow-xs select-none overflow-hidden ring-1 ring-amber-400/30">
            <img
              src="/sila-logo.png"
              alt="ตราเทศบาลเมืองศิลา จังหวัดขอนแก่น"
              className="w-full h-full object-contain rounded-full aspect-square"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="bg-[#034131] border border-emerald-500/60 text-emerald-100 font-bold px-2.5 py-0.5 rounded-lg text-xs sm:text-sm tracking-wider shrink-0">
            ผ.02
          </div>
          <h1 className="text-sm sm:text-base font-bold tracking-tight text-white truncate">
            บัญชีรายละเอียดโครงการพัฒนาท้องถิ่น (แบบ ผ.02) - {currentInfo.short}
          </h1>
        </div>

        <div className="bg-[#047857] text-white text-xs sm:text-sm font-bold px-3 py-1 rounded-full border border-emerald-400/50 shadow-xs shrink-0 font-mono">
          {filteredProjects.length} โครงการ
        </div>
      </header>

      <div className="flex-1 min-h-0 flex flex-col p-2.5 sm:p-3.5 gap-2.5 overflow-hidden">
        {/* 2. Filter Box */}
        <section
          id="edition-filter-panel"
          className="shrink-0 bg-white rounded-xl border border-slate-200 shadow-xs p-3 sm:p-3.5 space-y-2.5 print:hidden"
        >
          {/* Row 1: Filter Controls (จัดวางตัวกรองข้อมูลเรียงในบรรทัดเดียวกัน) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 items-end">
            {/* 1. ปีงบประมาณ */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 whitespace-nowrap truncate">
                ปีงบประมาณ
              </label>
              <select
                id="select-plan-year"
                value={fiscalYear}
                onChange={(e) => setFiscalYear(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-2xs"
              >
                <option value="all">ทั้งหมด (2571-2575)</option>
                <option value="2571">พ.ศ. 2571</option>
                <option value="2572">พ.ศ. 2572</option>
                <option value="2573">พ.ศ. 2573</option>
                <option value="2574">พ.ศ. 2574</option>
                <option value="2575">พ.ศ. 2575</option>
              </select>
            </div>

            {/* 2. ประเด็นการพัฒนา */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 whitespace-nowrap truncate">
                ประเด็นการพัฒนา
              </label>
              <select
                id="filter-plan-strategy"
                value={selectedStrategy}
                onChange={(e) => setSelectedStrategy(e.target.value)}
                title={selectedStrategy || '-- ทุกประเด็นการพัฒนา --'}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 truncate focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-2xs"
              >
                <option value="">-- ทุกประเด็นการพัฒนา --</option>
                {DEVELOPMENT_STRATEGIES.map((s, idx) => (
                  <option key={idx} value={s} title={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. หน่วยงานรับผิดชอบหลัก */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 whitespace-nowrap truncate">
                หน่วยงานรับผิดชอบหลัก
              </label>
              <select
                id="filter-plan-department"
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                title={selectedDepartment || '-- ทุกหน่วยงาน --'}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 truncate focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-2xs"
              >
                <option value="">-- ทุกหน่วยงาน --</option>
                {DEPARTMENTS.map((d, idx) => (
                  <option key={idx} value={d} title={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. ชื่อโครงการ / คำค้นหา */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 whitespace-nowrap truncate">
                ชื่อโครงการ / คำค้นหา
              </label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="filter-plan-keyword"
                  type="text"
                  placeholder="ค้นหาชื่อโครงการ / คำค้นหา..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg pl-9 pr-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                />
              </div>
            </div>

            {/* 5. งบประมาณ (บาท) */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 whitespace-nowrap truncate">
                งบประมาณ (บาท)
              </label>
              <input
                id="filter-plan-min-budget"
                type="text"
                placeholder="ระบุงบประมาณขั้นต่ำ..."
                value={minBudget}
                onChange={(e) => setMinBudget(e.target.value)}
                className="w-full text-sm font-mono border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
              />
            </div>

            {/* 6. สถานะของแผนพัฒนาท้องถิ่น */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 whitespace-nowrap truncate">
                สถานะของแผนฯ
              </label>
              <select
                id="filter-plan-status"
                value={planStatusFilter}
                onChange={(e) => setPlanStatusFilter(e.target.value as 'all' | 'draft' | 'approved')}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-2xs font-medium"
              >
                <option value="all">-- ทุกสถานะ --</option>
                <option value="draft">⌛ ร่างแผน (ก่อนอนุมัติ)</option>
                <option value="approved">✔ อนุมัติ / ประกาศใช้แล้ว</option>
              </select>
            </div>
          </div>

          {/* Row 2: Action Buttons Layout & Soft/Pastel Styles */}
          <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-slate-100">
            {/* [🔍 ค้นหาข้อมูล] : ปุ่มสีฟ้าอ่อน (Soft Blue) */}
            <button
              id="btn-plan-search"
              type="button"
              onClick={() => {
                const el = document.getElementById('filter-plan-keyword');
                if (el) el.focus();
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-300 rounded-lg text-sm font-medium shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>🔍</span>
              <span>ค้นหาข้อมูล</span>
            </button>

            {/* [📊 แสดงข้อมูลทั้งหมด] : ปุ่มสีน้ำเงิน/ม่วงอ่อน (Soft Indigo/Lavender) */}
            <button
              id="btn-plan-show-all"
              type="button"
              onClick={handleShowAll}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-sm font-medium shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>📊</span>
              <span>แสดงข้อมูลทั้งหมด</span>
            </button>

            {/* [🔄 ล้างตัวกรอง] : ปุ่มสีส้มอ่อนนวล (Warm Amber) */}
            <button
              id="btn-plan-reset"
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-sm font-medium shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>🔄</span>
              <span>ล้างตัวกรอง</span>
            </button>

            {/* [➕ เพิ่มโครงการ(ฉบับแรก)] : ปุ่มสีอ่อนนุ่มนวล (Soft Neutral / Light Blue-Gray) */}
            {currentUser?.role !== 'public' && currentUser?.role !== 'executive' ? (
              <button
                id="btn-plan-add-project"
                type="button"
                onClick={() => {
                  if (edition === 'changed' || edition === 'amended') {
                    setSelectedCandidate(null);
                    setIsComparisonModalOpen(true);
                  } else {
                    onAddProject(edition);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-sm font-medium shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>➕</span>
                <span>{edition === 'first' ? 'เพิ่มโครงการ(ฉบับแรก)' : currentInfo.addLabel.replace('+ ', '')}</span>
              </button>
            ) : currentUser?.role === 'public' ? (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 border border-slate-200 text-slate-500 text-sm font-medium rounded-lg whitespace-nowrap">
                <span>🔒</span>
                <span>สิทธิ์ประชาชน (เข้าชมอย่างเดียว)</span>
              </span>
            ) : null}

            {/* [📥 ส่งออกข้อมูล (Excel)] : ปุ่มสีเขียว Sage / เขียวอ่อนนุ่มนวล (Soft Sage Green) */}
            <button
              id="btn-plan-export-excel"
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-sm font-medium shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
              title="ดาวน์โหลดไฟล์ Excel (.xlsx) จัดหน้าและตารางพร้อมใช้งานทันที"
            >
              <span>📥</span>
              <span>ส่งออกข้อมูล (Excel)</span>
            </button>

            {/* [📊 ส่งออกข้อมูล (CSV)] */}
            <button
              id="btn-plan-export-csv"
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-sm font-medium shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
              title="ดาวน์โหลดไฟล์ CSV (Excel UTF-8) ทันที"
            >
              <span>📊</span>
              <span>ส่งออกข้อมูล (CSV)</span>
            </button>

            {/* [📄 ส่งออกข้อมูล (PDF)] : ปุ่มสีส้มแดงอ่อน / พาสเทล (Soft Coral/PDF Style) */}
            <button
              id="btn-plan-export-pdf"
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-sm font-medium shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
              title="พิมพ์หรือบันทึกเป็นเอกสาร PDF"
            >
              <span>📄</span>
              <span>ส่งออกข้อมูล (PDF)</span>
            </button>

            {/* [🖨️ พิมพ์รายงาน] : ปุ่มสีเทาเข้มอมฟ้า (Slate Grey) */}
            <button
              id="btn-plan-print"
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-600 hover:bg-slate-700 text-white border border-slate-500 rounded-lg text-sm font-medium shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
              title="สั่งพิมพ์รายงานทางเครื่องพิมพ์"
            >
              <span>🖨️</span>
              <span>พิมพ์รายงาน</span>
            </button>
          </div>
        </section>

        {/* Printable Report Header */}
        <div className="hidden print:block mb-6">
          <div className="text-right font-bold text-base text-black mb-1.5">
            แบบ ผ.02
          </div>
          <div className="text-center space-y-1.5">
            <h2 className="text-2xl font-bold text-black leading-tight">
              บัญชีรายละเอียดโครงการพัฒนาท้องถิ่น
            </h2>
            <h3 className="text-xl font-bold text-black leading-tight">
              {getPrintEditionLine()}
            </h3>
            <p className="text-base text-slate-900 leading-relaxed">
              เทศบาลเมืองศิลา อำเภอเมืองขอนแก่น จังหวัดขอนแก่น
            </p>
          </div>
        </div>

        {/* 3. Table: บัญชีรายละเอียดโครงการพัฒนาท้องถิ่น (แบบ ผ.02) */}
        <section
          id="plan-table-wrapper"
          className="flex-1 min-h-0 flex flex-col bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden print:border-0 print:shadow-none"
        >
          <div className="flex-1 min-h-0 overflow-x-hidden overflow-y-auto pb-1">
            <table className="report-table p02-print-table w-full table-fixed text-left border-collapse font-['Prompt',sans-serif]">
              {/* Column Width Proportions for 100% Responsive Screen Fit */}
              <colgroup>
                {/* 1. จัดการ */}
                <col className={edition === 'first' ? 'w-[7%] print:hidden' : 'w-[6%] print:hidden'} />
                {/* 2. โครงการ */}
                <col className={edition === 'first' ? 'w-[21%]' : 'w-[18%]'} />
                {/* 3. วัตถุประสงค์ */}
                <col className={edition === 'first' ? 'w-[13%]' : 'w-[11%]'} />
                {/* 4. เป้าหมาย (ผลผลิต) */}
                <col className={edition === 'first' ? 'w-[13%]' : 'w-[11%]'} />
                {/* 5-9. งบประมาณ 5 ปี */}
                <col className={edition === 'first' ? 'w-[6.2%]' : 'w-[5.6%]'} />
                <col className={edition === 'first' ? 'w-[6.2%]' : 'w-[5.6%]'} />
                <col className={edition === 'first' ? 'w-[6.2%]' : 'w-[5.6%]'} />
                <col className={edition === 'first' ? 'w-[6.2%]' : 'w-[5.6%]'} />
                <col className={edition === 'first' ? 'w-[6.2%]' : 'w-[5.6%]'} />
                {/* 10. ผลที่คาดว่าจะได้รับ */}
                <col className={edition === 'first' ? 'w-[11.8%]' : 'w-[10%]'} />
                {/* 11. หน่วยงานหลัก */}
                <col className={edition === 'first' ? 'w-[7.2%]' : 'w-[6%]'} />
                {/* 12. เหตุผลความจำเป็น (สำหรับฉบับเพิ่มเติม/เปลี่ยนแปลง/แก้ไข) */}
                {edition !== 'first' && <col className="w-[10%]" />}
              </colgroup>

              {/* Header */}
              <thead>
                <tr className="bg-[#054e3b] text-white font-bold text-sm tracking-wide border-b border-[#075f48] print:bg-white print:text-black print:border-black">
                  {/* 1. จัดการ (Action) - ซ่อนในโหมดพิมพ์ */}
                  <th rowSpan={2} className="py-2.5 px-1 text-center font-bold text-sm border-r border-[#075f48] print:hidden">
                    จัดการ
                  </th>

                  {/* 2. โครงการ (Project Name) */}
                  <th rowSpan={2} className="py-2.5 px-2.5 text-left font-bold text-sm border-r border-[#075f48] print:border-black print:text-black">
                    โครงการ
                  </th>

                  {/* 3. วัตถุประสงค์ */}
                  <th rowSpan={2} className="py-2.5 px-2 text-left font-bold text-sm border-r border-[#075f48] print:border-black print:text-black">
                    วัตถุประสงค์
                  </th>

                  {/* 4. เป้าหมาย (ผลผลิต) */}
                  <th rowSpan={2} className="py-2.5 px-2 text-left font-bold text-sm border-r border-[#075f48] print:border-black print:text-black">
                    เป้าหมาย (ผลผลิต)
                  </th>

                  {/* 5. งบประมาณ (พ.ศ. 2571 - 2575) */}
                  <th colSpan={5} className="py-2 px-1 text-center font-bold text-sm border-r border-[#075f48] print:border-black print:text-black">
                    งบประมาณ (พ.ศ. 2571 - 2575)
                  </th>

                  {/* 6. ผลที่คาดว่าจะได้รับ */}
                  <th rowSpan={2} className="py-2.5 px-2 text-left font-bold text-sm border-r border-[#075f48] print:border-black print:text-black">
                    ผลที่คาดว่าจะได้รับ
                  </th>

                  {/* 7. หน่วยงานหลัก */}
                  <th
                    rowSpan={2}
                    className={`py-2.5 px-1.5 text-center font-bold text-sm ${
                      edition === 'first' ? '' : 'border-r border-[#075f48]'
                    } print:border-black print:text-black`}
                  >
                    หน่วยงานหลัก
                  </th>

                  {/* 8. เหตุผลความจำเป็น (แสดงเฉพาะฉบับเพิ่มเติม, เปลี่ยนแปลง, แก้ไข) */}
                  {edition !== 'first' && (
                    <th rowSpan={2} className="py-2.5 px-2 text-left font-bold text-sm print:border-black print:text-black">
                      เหตุผลความจำเป็น
                    </th>
                  )}
                </tr>
                <tr className="bg-[#054e3b] text-white font-bold text-sm border-b border-[#075f48] print:bg-white print:text-black print:border-black">
                  <th className="py-2 px-1 text-center font-bold text-sm border-r border-[#075f48] print:border-black print:text-black">พ.ศ. 2571</th>
                  <th className="py-2 px-1 text-center font-bold text-sm border-r border-[#075f48] print:border-black print:text-black">พ.ศ. 2572</th>
                  <th className="py-2 px-1 text-center font-bold text-sm border-r border-[#075f48] print:border-black print:text-black">พ.ศ. 2573</th>
                  <th className="py-2 px-1 text-center font-bold text-sm border-r border-[#075f48] print:border-black print:text-black">พ.ศ. 2574</th>
                  <th className="py-2 px-1 text-center font-bold text-sm border-r border-[#075f48] print:border-black print:text-black">พ.ศ. 2575</th>
                </tr>
              </thead>

              {/* Body */}
              <tbody className="divide-y divide-slate-200 text-slate-800 print:divide-black text-sm">
                {filteredProjects.length === 0 ? (
                  <tr>
                    <td
                      colSpan={edition === 'first' ? 11 : 12}
                      className="py-14 text-center text-slate-500 font-medium text-sm print:text-black"
                    >
                      ไม่พบข้อมูลโครงการตามเงื่อนไขที่ระบุ
                    </td>
                  </tr>
                ) : (
                  filteredProjects.map((project, index) => {
                    const b71 = project.budgetByYear?.['2571'];
                    const b72 = project.budgetByYear?.['2572'];
                    const b73 = project.budgetByYear?.['2573'];
                    const b74 = project.budgetByYear?.['2574'];
                    const b75 = project.budgetByYear?.['2575'];
                    const isCurrentPage = index >= (safePage - 1) * pageSize && index < safePage * pageSize;
                    const isApprovedOrPublished = checkIsProjectApprovedOrPublished(project, announcements);

                    return (
                      <tr
                        key={project.id}
                        className={`${
                          isCurrentPage ? 'table-row hover:bg-emerald-50/40' : 'hidden print:table-row'
                        } transition-colors group align-top print:border-b print:border-black`}
                      >
                        {/* 1. จัดการ (Action) - ซ่อนในโหมดพิมพ์ */}
                        <td className="py-2.5 px-1 text-center border-r border-slate-100 align-middle print:hidden">
                          <div className="flex items-center justify-center gap-1">
                            {/* 1. ดูรายละเอียดโครงการ (แบบ ผ.02) */}
                            <button
                              id={`btn-view-project-${project.id}`}
                              type="button"
                              title="ดูรายละเอียดโครงการ (แบบ ผ.02)"
                              onClick={() => onViewProject(project)}
                              className="p-1 rounded-md hover:bg-slate-100 text-[#006853] transition-colors cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* 2. ติดตามประวัติและสถานะโครงการ */}
                            <button
                              id={`btn-history-project-${project.id}`}
                              type="button"
                              title="ติดตามประวัติและสถานะโครงการ"
                              onClick={() => onViewHistory(project)}
                              className="p-1 rounded-md hover:bg-slate-100 text-[#0284C7] transition-colors cursor-pointer"
                            >
                              <Clock className="w-3.5 h-3.5" />
                            </button>

                            {/* แก้ไขข้อมูล (เฉพาะเจ้าหน้าที่และแอดมิน) */}
                            {currentUser?.role !== 'public' && currentUser?.role !== 'executive' && (
                              <button
                                id={`btn-edit-project-${project.id}`}
                                type="button"
                                title="แก้ไขข้อมูลโครงการ"
                                onClick={() => onEditProject(project)}
                                className="p-1 rounded-md hover:bg-slate-100 text-[#D97706] hover:text-[#B45309] transition-colors cursor-pointer"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* ลบโครงการ (เฉพาะเจ้าหน้าที่และแอดมิน) */}
                            {currentUser?.role !== 'public' && currentUser?.role !== 'executive' && (
                              <button
                                id={`btn-delete-project-${project.id}`}
                                type="button"
                                title="ลบโครงการ"
                                onClick={() => setProjectToDelete(project)}
                                className="p-1 rounded-md hover:bg-slate-100 text-[#DC2626] transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>

                        {/* 2. โครงการ (Project Name) */}
                        <td className="py-2.5 px-2.5 border-r border-slate-100 text-left break-words whitespace-normal print:border-black print:text-black">
                          <div className="text-sm font-normal text-slate-800 leading-relaxed break-words text-left print:text-black">
                            {project.name}
                          </div>
                        </td>

                        {/* 3. วัตถุประสงค์ */}
                        <td className="py-2.5 px-2 border-r border-slate-100 text-left text-slate-800 font-normal leading-relaxed text-sm break-words whitespace-normal print:border-black print:text-black">
                          <div className="line-clamp-4 print:line-clamp-none break-words text-left font-normal" title={project.objective}>
                            <FormattedTextHierarchy text={project.objective} />
                          </div>
                        </td>

                        {/* 4. เป้าหมาย (ผลผลิต) */}
                        <td className="py-2.5 px-2 border-r border-slate-100 text-left text-slate-800 font-normal leading-relaxed text-sm break-words whitespace-normal print:border-black print:text-black">
                          <div className="line-clamp-4 print:line-clamp-none break-words text-left font-normal" title={project.target}>
                            <FormattedTextHierarchy text={project.target} />
                          </div>
                        </td>

                        {/* 5. งบประมาณ 2571 */}
                        <td className="py-2.5 px-1.5 text-right tabular-nums tabular-num-cell font-normal border-r border-slate-100 text-slate-800 text-sm break-words whitespace-normal print:border-black print:text-black">
                          {b71 && b71 > 0 ? b71.toLocaleString('th-TH') : '-'}
                        </td>

                        {/* 6. งบประมาณ 2572 */}
                        <td className="py-2.5 px-1.5 text-right tabular-nums tabular-num-cell font-normal border-r border-slate-100 text-slate-800 text-sm break-words whitespace-normal print:border-black print:text-black">
                          {b72 && b72 > 0 ? b72.toLocaleString('th-TH') : '-'}
                        </td>

                        {/* 7. งบประมาณ 2573 */}
                        <td className="py-2.5 px-1.5 text-right tabular-nums tabular-num-cell font-normal border-r border-slate-100 text-slate-800 text-sm break-words whitespace-normal print:border-black print:text-black">
                          {b73 && b73 > 0 ? b73.toLocaleString('th-TH') : '-'}
                        </td>

                        {/* 8. งบประมาณ 2574 */}
                        <td className="py-2.5 px-1.5 text-right tabular-nums tabular-num-cell font-normal border-r border-slate-100 text-slate-800 text-sm break-words whitespace-normal print:border-black print:text-black">
                          {b74 && b74 > 0 ? b74.toLocaleString('th-TH') : '-'}
                        </td>

                        {/* 9. งบประมาณ 2575 */}
                        <td className="py-2.5 px-1.5 text-right tabular-nums tabular-num-cell font-normal border-r border-slate-100 text-slate-800 text-sm break-words whitespace-normal print:border-black print:text-black">
                          {b75 && b75 > 0 ? b75.toLocaleString('th-TH') : '-'}
                        </td>

                        {/* 10. ผลที่คาดว่าจะได้รับ */}
                        <td className="py-2.5 px-2 border-r border-slate-100 text-left text-slate-800 font-normal leading-relaxed text-sm break-words whitespace-normal print:border-black print:text-black">
                          <div className="line-clamp-4 print:line-clamp-none break-words text-left font-normal" title={project.expectedResults}>
                            <FormattedTextHierarchy text={project.expectedResults} />
                          </div>
                        </td>

                        {/* 11. หน่วยงานหลัก */}
                        <td
                          className={`py-2.5 px-1.5 text-center text-slate-800 font-normal text-sm break-words whitespace-normal leading-relaxed ${
                            edition === 'first' ? '' : 'border-r border-slate-100'
                          } print:border-black print:text-black`}
                        >
                          {project.department}
                        </td>

                        {/* 12. เหตุผลความจำเป็น (แสดงเฉพาะฉบับเพิ่มเติม, เปลี่ยนแปลง, แก้ไข) */}
                        {edition !== 'first' && (
                          <td className="py-2.5 px-2 text-left text-sm text-slate-800 font-normal leading-relaxed break-words whitespace-normal print:border-black print:text-black">
                            {project.reason || project.note ? (
                              <div className="text-slate-800 text-sm font-normal leading-relaxed break-words print:text-black text-left">
                                <FormattedTextHierarchy text={project.reason || project.note || ''} />
                                {project.note && project.reason && project.note !== project.reason && (
                                  <div className="text-slate-600 text-xs mt-1 print:text-black text-left font-normal">
                                    <span className="text-slate-700 print:text-black font-normal">หมายเหตุ: </span>
                                    {project.note}
                                  </div>
                                )}
                                {project.planReference && (
                                  <div className="text-emerald-800 text-xs mt-1 print:text-black text-left font-normal">
                                    ที่มาในแผน: {project.planReference}
                                  </div>
                                )}
                              </div>
                            ) : project.planReference ? (
                              <div className="text-emerald-800 text-sm font-normal leading-relaxed break-words print:text-black text-left">
                                <span className="font-normal">ที่มาในแผน: </span>
                                {project.planReference}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs italic font-normal print:text-black">-</span>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* Table Footer: Summary Total Row with Light Background & Bold Dark Text */}
              {filteredProjects.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-100 text-slate-900 font-bold text-sm border-t-2 border-slate-300 shadow-2xs print:bg-white print:text-black print:border-black">
                    {/* จัดการ column in footer: hidden when printing */}
                    <td className="print:hidden border-r border-slate-200 py-2.5 px-1 text-center" />

                    {/* Left title spans โครงการ + วัตถุประสงค์ + เป้าหมาย (3 columns) */}
                    <td colSpan={3} className="py-2.5 px-2.5 text-right border-r border-slate-200 tracking-wide font-bold text-slate-900 text-sm print:border-black print:text-black">
                      รวมทั้งสิ้น ({filteredProjects.length} โครงการ)
                    </td>

                    {/* 2571 Sum */}
                    <td className="py-2.5 px-1.5 text-right tabular-nums tabular-num-cell font-bold text-slate-900 text-sm border-r border-slate-200 print:border-black print:text-black">
                      {budgetSums.sum2571 > 0 ? budgetSums.sum2571.toLocaleString('th-TH') : '-'}
                    </td>

                    {/* 2572 Sum */}
                    <td className="py-2.5 px-1.5 text-right tabular-nums tabular-num-cell font-bold text-slate-900 text-sm border-r border-slate-200 print:border-black print:text-black">
                      {budgetSums.sum2572 > 0 ? budgetSums.sum2572.toLocaleString('th-TH') : '-'}
                    </td>

                    {/* 2573 Sum */}
                    <td className="py-2.5 px-1.5 text-right tabular-nums tabular-num-cell font-bold text-slate-900 text-sm border-r border-slate-200 print:border-black print:text-black">
                      {budgetSums.sum2573 > 0 ? budgetSums.sum2573.toLocaleString('th-TH') : '-'}
                    </td>

                    {/* 2574 Sum */}
                    <td className="py-2.5 px-1.5 text-right tabular-nums tabular-num-cell font-bold text-slate-900 text-sm border-r border-slate-200 print:border-black print:text-black">
                      {budgetSums.sum2574 > 0 ? budgetSums.sum2574.toLocaleString('th-TH') : '-'}
                    </td>

                    {/* 2575 Sum */}
                    <td className="py-2.5 px-1.5 text-right tabular-nums tabular-num-cell font-bold text-slate-900 text-sm border-r border-slate-200 print:border-black print:text-black">
                      {budgetSums.sum2575 > 0 ? budgetSums.sum2575.toLocaleString('th-TH') : '-'}
                    </td>

                    {/* Right empty span */}
                    <td
                      colSpan={edition === 'first' ? 2 : 3}
                      className="py-2.5 px-2.5 text-slate-900 font-bold text-right text-sm tabular-nums tabular-num-cell print:border-black print:text-black"
                    >
                      รวม 5 ปี: {(budgetSums.sum2571 + budgetSums.sum2572 + budgetSums.sum2573 + budgetSums.sum2574 + budgetSums.sum2575).toLocaleString('th-TH')}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="shrink-0 bg-slate-50 border-t border-slate-200 px-4 py-2 sm:py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-sm text-slate-700 print:hidden font-medium">
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-2">
                <span>หน้าละ:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-800 font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value={10}>10 รายการ</option>
                  <option value={20}>20 รายการ</option>
                  <option value={50}>50 รายการ</option>
                  <option value={100}>100 รายการ</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span>หน้าที่:</span>
                <select
                  value={safePage}
                  onChange={(e) => setCurrentPage(Number(e.target.value))}
                  className="border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-800 font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <option key={p} value={p}>
                      {p} จาก {totalPages}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="font-semibold text-slate-800">
                {filteredProjects.length === 0
                  ? '0 รายการ'
                  : `${startIndex} ถึง ${endIndex} จาก ${filteredProjects.length} รายการ`}
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage(1)}
                  title="หน้าแรก"
                  className={`p-1.5 rounded-lg border border-slate-200 bg-white transition-colors ${
                    safePage <= 1
                      ? 'text-slate-300 opacity-60 cursor-not-allowed'
                      : 'text-slate-700 hover:bg-slate-100 cursor-pointer'
                  }`}
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  title="หน้าก่อนหน้า"
                  className={`p-1.5 rounded-lg border border-slate-200 bg-white transition-colors ${
                    safePage <= 1
                      ? 'text-slate-300 opacity-60 cursor-not-allowed'
                      : 'text-slate-700 hover:bg-slate-100 cursor-pointer'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  title="หน้าถัดไป"
                  className={`p-1.5 rounded-lg border border-slate-200 bg-white transition-colors ${
                    safePage >= totalPages
                      ? 'text-slate-300 opacity-60 cursor-not-allowed'
                      : 'text-slate-700 hover:bg-slate-100 cursor-pointer'
                  }`}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                  title="หน้าสุดท้าย"
                  className={`p-1.5 rounded-lg border border-slate-200 bg-white transition-colors ${
                    safePage >= totalPages
                      ? 'text-slate-300 opacity-60 cursor-not-allowed'
                      : 'text-slate-700 hover:bg-slate-100 cursor-pointer'
                  }`}
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Unified Single Modal for Selecting Candidate & Comparing/Editing Project (ฉบับเปลี่ยนแปลง / ฉบับแก้ไข) */}
        {isComparisonModalOpen && (
          <PlanComparisonModal
            isOpen={isComparisonModalOpen}
            onClose={() => {
              setIsComparisonModalOpen(false);
              setSelectedCandidate(null);
            }}
            candidateProject={selectedCandidate}
            projects={projects}
            edition={edition}
            currentUser={currentUser}
            readOnly={currentUser?.role === 'public' || currentUser?.role === 'executive'}
            onSave={(newProject) => {
              if (onSaveNewProject) {
                onSaveNewProject(newProject);
              }
            }}
          />
        )}

        {/* Modal ยืนยันการลบข้อมูล (Delete Confirmation Dialog) */}
        {projectToDelete && (
          <div
            id="modal-delete-confirm-overlay"
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => setProjectToDelete(null)}
          >
            <div
              id="modal-delete-confirm-dialog"
              role="dialog"
              aria-modal="true"
              className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-sm sm:max-w-md w-full text-center flex flex-col items-center border border-slate-100 transform animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              {/* ไอคอนแจ้งเตือนสีส้มหรือแดง (Warning Icon !) */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-rose-50 border-4 border-rose-200 text-rose-600 flex items-center justify-center mb-4 shadow-inner">
                <AlertTriangle className="w-8 h-8 sm:w-10 sm:h-10 stroke-[2.5]" />
              </div>

              {/* หัวข้อ: "ยืนยันการลบข้อมูล" */}
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2 tracking-tight">
                ยืนยันการลบข้อมูล
              </h3>

              {/* ข้อความย่อย: "คุณต้องการลบรายการโครงการนี้ใช่หรือไม่?" */}
              <p className="text-base text-slate-600 font-medium mb-4 leading-relaxed">
                คุณต้องการลบรายการโครงการนี้ใช่หรือไม่?
              </p>

              {/* แสดงชื่อโครงการที่ต้องการลบ */}
              {projectToDelete.name && (
                <div className="w-full mb-6 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 text-left line-clamp-2">
                  {projectToDelete.name}
                </div>
              )}

              {/* ปุ่มการทำงาน */}
              <div className="flex items-center gap-3 w-full">
                <button
                  id="btn-cancel-delete"
                  type="button"
                  onClick={() => setProjectToDelete(null)}
                  className="flex-1 py-2.5 px-5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-base rounded-xl transition-colors cursor-pointer min-h-[44px]"
                >
                  ยกเลิก
                </button>
                <button
                  id="btn-confirm-delete"
                  type="button"
                  onClick={handleConfirmDelete}
                  className="flex-1 py-2.5 px-5 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold text-base rounded-xl shadow-md transition-colors cursor-pointer min-h-[44px]"
                >
                  ตกลง
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast Alert สีเขียวสั้นๆ: "ลบรายการเรียบร้อยแล้ว" */}
        {deleteToastMessage && (
          <div
            id="toast-delete-success"
            role="alert"
            className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-emerald-800 text-white px-5 py-3.5 rounded-xl shadow-2xl border border-emerald-500 animate-in fade-in slide-in-from-top-2 duration-200"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
            <span className="text-sm sm:text-base font-semibold tracking-wide">
              {deleteToastMessage}
            </span>
            <button
              type="button"
              onClick={() => setDeleteToastMessage(null)}
              className="ml-2 text-emerald-200 hover:text-white transition-colors cursor-pointer p-0.5 rounded-lg hover:bg-emerald-700"
              aria-label="ปิดการแจ้งเตือน"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
