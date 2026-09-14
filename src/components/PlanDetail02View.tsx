import React, { useState, useMemo, useEffect } from 'react';
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
  Eye
} from 'lucide-react';
import { ProjectData, PlanEdition, UserAccount } from '../types';
import { DEVELOPMENT_STRATEGIES, DEPARTMENTS } from '../utils/constants';
import { matchesProjectSearch } from '../utils/projectCode';
import { PlanSelectCandidateModal } from './PlanSelectCandidateModal';
import { PlanComparisonModal } from './PlanComparisonModal';

// Helper component for typographic hierarchy in long table text
const FormattedTextHierarchy: React.FC<{ text?: string }> = ({ text }) => {
  if (!text || !text.trim()) return <span className="text-slate-400">-</span>;

  const trimmed = text.trim();
  const lines = trimmed.split(/\r?\n/).filter((l) => l.trim().length > 0);

  if (lines.length > 1) {
    return (
      <div className="leading-relaxed text-xs">
        <div className="font-semibold text-[#0F172A]">{lines[0]}</div>
        <div className="text-[#475569] mt-0.5">{lines.slice(1).join(' ')}</div>
      </div>
    );
  }

  const sepMatch = trimmed.match(/^([^:;—\-]+[:;—\-])\s*(.+)$/);
  if (sepMatch) {
    return (
      <div className="leading-relaxed text-xs">
        <span className="font-semibold text-[#0F172A]">{sepMatch[1]} </span>
        <span className="text-[#475569]">{sepMatch[2]}</span>
      </div>
    );
  }

  const spaceIndex = trimmed.indexOf(' ');
  if (spaceIndex >= 6 && spaceIndex <= 45) {
    const head = trimmed.slice(0, spaceIndex);
    const tail = trimmed.slice(spaceIndex + 1);
    return (
      <div className="leading-relaxed text-xs">
        <span className="font-semibold text-[#0F172A]">{head} </span>
        <span className="text-[#475569]">{tail}</span>
      </div>
    );
  }

  if (trimmed.length > 32) {
    const head = trimmed.slice(0, 26);
    const tail = trimmed.slice(26);
    return (
      <div className="leading-relaxed text-xs">
        <span className="font-semibold text-[#0F172A]">{head}</span>
        <span className="text-[#475569]">{tail}</span>
      </div>
    );
  }

  return <div className="font-semibold text-[#0F172A] text-xs">{trimmed}</div>;
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
  currentUser
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

  // Filter states matching screenshot
  const [fiscalYear, setFiscalYear] = useState<string>('all');
  const [selectedStrategy, setSelectedStrategy] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [minBudget, setMinBudget] = useState<string>('');
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
  }, [editionProjects, selectedStrategy, selectedDepartment, searchKeyword, minBudget]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStrategy, selectedDepartment, searchKeyword, minBudget, edition]);

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
  };

  const handleShowAll = () => {
    setFiscalYear('all');
    setSelectedStrategy('');
    setSelectedDepartment('');
    setSearchKeyword('');
    setMinBudget('');
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
      {/* 1. Top Green Banner Bar */}
      <header
        id="edition-top-banner"
        className="bg-[#055740] text-white px-4 py-2.5 sm:px-6 shadow-xs flex items-center justify-between shrink-0 print:hidden"
      >
        <div className="flex items-center gap-3">
          <div className="bg-[#034131] border border-emerald-500/60 text-emerald-100 font-bold px-3 py-1 rounded-lg text-sm tracking-wider">
            ผ.02
          </div>
          <h1 className="text-sm sm:text-base md:text-lg font-bold tracking-tight">
            บัญชีรายละเอียดโครงการพัฒนาท้องถิ่น (แบบ ผ.02) - {currentInfo.short} | ระบบแผนพัฒนาเทศบาลเมืองศิลา | เทศบาลเมืองศิลา จ.ขอนแก่น
          </h1>
        </div>

        <div className="bg-[#047857] text-white text-sm font-bold px-3 py-1 rounded-full border border-emerald-400/50 shadow-xs">
          {filteredProjects.length} โครงการ
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto p-3.5 sm:p-5 space-y-4">
        {/* 2. Filter Box */}
        <section
          id="edition-filter-panel"
          className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-4 print:hidden"
        >
          {/* Row 1: ปีงบประมาณ */}
          <div className="flex items-center gap-3">
            <label className="text-base font-bold text-slate-800 whitespace-nowrap">
              ปีงบประมาณ:
            </label>
            <div className="w-64">
              <select
                id="select-plan-year"
                value={fiscalYear}
                onChange={(e) => setFiscalYear(e.target.value)}
                className="w-full text-base border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="all">ทั้งหมด (2571-2575)</option>
                <option value="2571">พ.ศ. 2571</option>
                <option value="2572">พ.ศ. 2572</option>
                <option value="2573">พ.ศ. 2573</option>
                <option value="2574">พ.ศ. 2574</option>
                <option value="2575">พ.ศ. 2575</option>
              </select>
            </div>
          </div>

          {/* Row 2: 4-Column Filter Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-base">
            <div>
              <label className="block text-[15px] sm:text-base font-bold text-slate-700 mb-1.5">
                ประเด็นการพัฒนา
              </label>
              <select
                id="filter-plan-strategy"
                value={selectedStrategy}
                onChange={(e) => setSelectedStrategy(e.target.value)}
                title={selectedStrategy || '-- ทุกประเด็นการพัฒนา --'}
                className="w-full text-base border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 truncate focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
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
              <label className="block text-[15px] sm:text-base font-bold text-slate-700 mb-1.5">
                ผู้รับผิดชอบ
              </label>
              <select
                id="filter-plan-department"
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                title={selectedDepartment || '-- ทุกหน่วยงาน --'}
                className="w-full text-base border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 truncate focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="">-- ทุกหน่วยงาน --</option>
                {DEPARTMENTS.map((d, idx) => (
                  <option key={idx} value={d} title={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[15px] sm:text-base font-bold text-slate-700 mb-1.5">
                ค้นหาชื่อโครงการ
              </label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="filter-plan-keyword"
                  type="text"
                  placeholder="ค้นหาชื่อโครงการ..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-full text-base border border-slate-300 rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[15px] sm:text-base font-bold text-slate-700 mb-1.5">
                งบประมาณรวม (บาท)
              </label>
              <input
                id="filter-plan-min-budget"
                type="text"
                placeholder="ระบุจำนวนเงินขั้นต่ำ..."
                value={minBudget}
                onChange={(e) => setMinBudget(e.target.value)}
                className="w-full text-base font-mono border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Row 3: Action Buttons */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-3 border-t border-slate-100 text-base">
            {/* Left Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                id="btn-plan-search"
                type="button"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#059669] hover:bg-[#047857] text-white text-base font-bold rounded-lg shadow-xs cursor-pointer transition-colors"
              >
                <Search className="w-4 h-4" />
                <span>ค้นหา</span>
              </button>

              <button
                id="btn-plan-show-all"
                type="button"
                onClick={handleShowAll}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-base font-bold rounded-lg transition-colors cursor-pointer"
              >
                <FolderOpen className="w-4 h-4 text-slate-600" />
                <span>แสดงทั้งหมด</span>
              </button>

              <button
                id="btn-plan-reset"
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-amber-50 text-amber-700 border border-amber-300 text-base font-bold rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-amber-600" />
                <span>เริ่มใหม่</span>
              </button>
            </div>

            {/* Right Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <button
                  id="btn-plan-export"
                  type="button"
                  onClick={() => setShowExportDropdown(!showExportDropdown)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#064e3b] hover:bg-[#053d2e] text-white text-base font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>ส่งออกข้อมูล ({filteredProjects.length})</span>
                  <span className="text-xs">▼</span>
                </button>

                {showExportDropdown && (
                  <div className="absolute right-0 mt-1.5 w-52 bg-white border border-slate-200 rounded-xl shadow-xl z-20 py-1.5 text-base text-slate-800">
                    <button
                      onClick={handleExportCSV}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-100 flex items-center gap-2.5 font-medium cursor-pointer"
                    >
                      <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                      <span>ดาวน์โหลดเป็น CSV</span>
                    </button>
                    <button
                      onClick={() => {
                        window.print();
                        setShowExportDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-100 flex items-center gap-2.5 font-medium cursor-pointer"
                    >
                      <Printer className="w-5 h-5 text-blue-600" />
                      <span>พิมพ์หน้ารายการ (PDF)</span>
                    </button>
                  </div>
                )}
              </div>

              <button
                id="btn-plan-print"
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-base font-bold rounded-lg transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                <span>พิมพ์รายงาน</span>
              </button>

              {/* Add Project Button (Only for Staff & Admin) */}
              {currentUser?.role !== 'public' && currentUser?.role !== 'executive' ? (
                <button
                  id="btn-plan-add-project"
                  type="button"
                  onClick={() => {
                    if (edition === 'changed' || edition === 'amended') {
                      setIsSelectCandidateModalOpen(true);
                    } else {
                      onAddProject(edition);
                    }
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#064e3b] hover:bg-[#053d2e] text-white text-base font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{currentInfo.addLabel}</span>
                </button>
              ) : currentUser?.role === 'public' ? (
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 border border-teal-200 text-teal-800 text-sm font-semibold rounded-lg">
                  <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                  <span>สิทธิ์ประชาชน (เข้าชมอย่างเดียว)</span>
                </span>
              ) : null}
            </div>
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
          className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden print:border-0 print:shadow-none"
        >
          <div className="overflow-auto max-h-[62vh]">
            <table className="report-table p02-print-table w-full text-left border-collapse min-w-[1300px]">
              {/* Header */}
              <thead>
                <tr className="bg-[#054e3b] text-white font-bold text-[17px] tracking-wide border-b border-[#075f48] print:bg-white print:text-black print:border-black">
                  {/* 1. จัดการ (Action) - ซ่อนในโหมดพิมพ์ */}
                  <th rowSpan={2} className="py-3.5 px-3 text-center w-40 min-w-[150px] border-r border-[#075f48] print:hidden">
                    จัดการ
                  </th>

                  {/* 2. โครงการ (Project Name) — แสดง Badge รหัส ID ไว้บรรทัดบนก่อนชื่อโครงการ */}
                  <th rowSpan={2} className="py-3.5 px-4 min-w-[280px] border-r border-[#075f48] print:border-black print:text-black">
                    โครงการ
                  </th>

                  {/* 3. วัตถุประสงค์ */}
                  <th rowSpan={2} className="py-3.5 px-3 min-w-[200px] border-r border-[#075f48] print:border-black print:text-black">
                    วัตถุประสงค์
                  </th>

                  {/* 4. เป้าหมาย (ผลผลิต) */}
                  <th rowSpan={2} className="py-3.5 px-3 min-w-[200px] border-r border-[#075f48] print:border-black print:text-black">
                    เป้าหมาย (ผลผลิต)
                  </th>

                  {/* 5. งบประมาณ (พ.ศ. 2571 - 2575) */}
                  <th colSpan={5} className="py-2.5 px-2 text-center border-r border-[#075f48] print:border-black print:text-black">
                    งบประมาณ (พ.ศ. 2571 - 2575)
                  </th>

                  {/* 6. ผลที่คาดว่าจะได้รับ */}
                  <th rowSpan={2} className="py-3.5 px-3 min-w-[190px] border-r border-[#075f48] print:border-black print:text-black">
                    ผลที่คาดว่าจะได้รับ
                  </th>

                  {/* 7. หน่วยงานหลัก */}
                  <th
                    rowSpan={2}
                    className={`py-3.5 px-3 text-center w-32 min-w-[120px] ${
                      edition === 'first' ? '' : 'border-r border-[#075f48]'
                    } print:border-black print:text-black`}
                  >
                    หน่วยงานหลัก
                  </th>

                  {/* 8. เหตุผลความจำเป็น (แสดงเฉพาะฉบับเพิ่มเติม, เปลี่ยนแปลง, แก้ไข) */}
                  {edition !== 'first' && (
                    <th rowSpan={2} className="py-3.5 px-3 text-center min-w-[220px] print:border-black print:text-black">
                      เหตุผลความจำเป็น
                    </th>
                  )}
                </tr>
                <tr className="bg-[#054e3b] text-white font-bold text-[16px] border-b border-[#075f48] print:bg-white print:text-black print:border-black">
                  <th className="py-2.5 px-2 text-center w-28 border-r border-[#075f48] print:border-black print:text-black">พ.ศ. 2571</th>
                  <th className="py-2.5 px-2 text-center w-28 border-r border-[#075f48] print:border-black print:text-black">พ.ศ. 2572</th>
                  <th className="py-2.5 px-2 text-center w-28 border-r border-[#075f48] print:border-black print:text-black">พ.ศ. 2573</th>
                  <th className="py-2.5 px-2 text-center w-28 border-r border-[#075f48] print:border-black print:text-black">พ.ศ. 2574</th>
                  <th className="py-2.5 px-2 text-center w-28 border-r border-[#075f48] print:border-black print:text-black">พ.ศ. 2575</th>
                </tr>
              </thead>

              {/* Body */}
              <tbody className="divide-y divide-slate-200 text-slate-800 print:divide-black text-base">
                {filteredProjects.length === 0 ? (
                  <tr>
                    <td
                      colSpan={edition === 'first' ? 11 : 12}
                      className="py-14 text-center text-slate-500 font-medium text-base print:text-black"
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
                    const rowNumber = index + 1;
                    const isCurrentPage = index >= (safePage - 1) * pageSize && index < safePage * pageSize;

                    return (
                      <tr
                        key={project.id}
                        className={`${
                          isCurrentPage ? 'table-row hover:bg-emerald-50/40' : 'hidden print:table-row'
                        } transition-colors group align-top print:border-b print:border-black`}
                      >
                        {/* 1. จัดการ (Action) - ซ่อนในโหมดพิมพ์ */}
                        <td className="py-3.5 px-3 text-center border-r border-slate-100 align-middle whitespace-nowrap print:hidden">
                          <div className="flex items-center justify-center space-x-2">
                            {/* ดูรายละเอียดโครงการ */}
                            <button
                              id={`btn-view-project-${project.id}`}
                              type="button"
                              title="ดูรายละเอียดโครงการ"
                              onClick={() => onViewProject(project)}
                              className="p-2 rounded-lg hover:bg-slate-100 text-[#006853] transition-colors cursor-pointer"
                            >
                              <Eye className="w-5 h-5" />
                            </button>

                            {/* ประวัติการแก้ไข */}
                            <button
                              id={`btn-history-project-${project.id}`}
                              type="button"
                              title="ประวัติการแก้ไข"
                              onClick={() => onViewHistory(project)}
                              className="p-2 rounded-lg hover:bg-slate-100 text-[#0284C7] transition-colors cursor-pointer"
                            >
                              <History className="w-5 h-5" />
                            </button>

                            {/* แก้ไขข้อมูล (เฉพาะเจ้าหน้าที่และแอดมิน) */}
                            {currentUser?.role !== 'public' && currentUser?.role !== 'executive' && (
                              <button
                                id={`btn-edit-project-${project.id}`}
                                type="button"
                                title="แก้ไขข้อมูล"
                                onClick={() => onEditProject(project)}
                                className="p-2 rounded-lg hover:bg-slate-100 text-[#D97706] transition-colors cursor-pointer"
                              >
                                <Pencil className="w-5 h-5" />
                              </button>
                            )}

                            {/* ลบโครงการ (เฉพาะเจ้าหน้าที่และแอดมิน) */}
                            {currentUser?.role !== 'public' && currentUser?.role !== 'executive' && (
                              <button
                                id={`btn-delete-project-${project.id}`}
                                type="button"
                                title="ลบโครงการ"
                                onClick={() => onDeleteProject(project.id)}
                                className="p-2 rounded-lg hover:bg-slate-100 text-[#DC2626] transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        </td>

                        {/* 2. โครงการ (Project Name) — แสดง [ประเด็นการพัฒนา] -> [แผนงาน] -> [ชื่อโครงการ] */}
                        <td className="py-3.5 px-4 border-r border-slate-100 print:border-black print:text-black">
                          {/* บรรทัดที่ 1 (ประเด็นการพัฒนา) */}
                          {project.planStrategy && (
                            <div className="text-sm text-slate-600 font-semibold line-clamp-2 mb-1 print:text-slate-700 leading-relaxed" title={project.planStrategy}>
                              {project.planStrategy}
                            </div>
                          )}

                          {/* บรรทัดที่ 3 (แผนงาน) */}
                          {project.planCategory && (
                            <div className="text-sm text-emerald-800 font-bold mb-1.5 print:text-emerald-900">
                              {project.planCategory}
                            </div>
                          )}

                          {/* บรรทัดที่ 4 (ชื่อโครงการ) */}
                          <div className="text-[17px] font-bold text-slate-950 leading-snug print:text-black">
                            {project.name}
                          </div>
                        </td>

                        {/* 3. วัตถุประสงค์ (Typographic Hierarchy) */}
                        <td className="py-3.5 px-3 border-r border-slate-100 text-slate-800 leading-relaxed text-base print:border-black print:text-black">
                          <div className="line-clamp-3 print:line-clamp-none" title={project.objective}>
                            <FormattedTextHierarchy text={project.objective} />
                          </div>
                        </td>

                        {/* 4. เป้าหมาย (ผลผลิต) (Typographic Hierarchy) */}
                        <td className="py-3.5 px-3 border-r border-slate-100 text-slate-800 leading-relaxed text-base print:border-black print:text-black">
                          <div className="line-clamp-3 print:line-clamp-none" title={project.target}>
                            <FormattedTextHierarchy text={project.target} />
                          </div>
                        </td>

                        {/* 5. งบประมาณ 2571 */}
                        <td className="py-3.5 px-2 text-right font-mono border-r border-slate-100 font-bold text-slate-900 text-base print:border-black print:text-black">
                          {b71 && b71 > 0 ? b71.toLocaleString() : '-'}
                        </td>

                        {/* 6. งบประมาณ 2572 */}
                        <td className="py-3.5 px-2 text-right font-mono border-r border-slate-100 font-bold text-slate-900 text-base print:border-black print:text-black">
                          {b72 && b72 > 0 ? b72.toLocaleString() : '-'}
                        </td>

                        {/* 7. งบประมาณ 2573 */}
                        <td className="py-3.5 px-2 text-right font-mono border-r border-slate-100 font-bold text-slate-900 text-base print:border-black print:text-black">
                          {b73 && b73 > 0 ? b73.toLocaleString() : '-'}
                        </td>

                        {/* 8. งบประมาณ 2574 */}
                        <td className="py-3.5 px-2 text-right font-mono border-r border-slate-100 font-bold text-slate-900 text-base print:border-black print:text-black">
                          {b74 && b74 > 0 ? b74.toLocaleString() : '-'}
                        </td>

                        {/* 9. งบประมาณ 2575 */}
                        <td className="py-3.5 px-2 text-right font-mono border-r border-slate-100 font-bold text-slate-900 text-base print:border-black print:text-black">
                          {b75 && b75 > 0 ? b75.toLocaleString() : '-'}
                        </td>

                        {/* 10. ผลที่คาดว่าจะได้รับ (Typographic Hierarchy) */}
                        <td className="py-3.5 px-3 border-r border-slate-100 text-slate-800 leading-relaxed text-base print:border-black print:text-black">
                          <div className="line-clamp-3 print:line-clamp-none" title={project.expectedResults}>
                            <FormattedTextHierarchy text={project.expectedResults} />
                          </div>
                        </td>

                        {/* 11. หน่วยงานหลัก */}
                        <td
                          className={`py-3.5 px-3 text-center text-slate-900 font-semibold text-base ${
                            edition === 'first' ? '' : 'border-r border-slate-100'
                          } print:border-black print:text-black`}
                        >
                          {project.department}
                        </td>

                        {/* 12. เหตุผลความจำเป็น (แสดงเฉพาะฉบับเพิ่มเติม, เปลี่ยนแปลง, แก้ไข) */}
                        {edition !== 'first' && (
                          <td className="py-3.5 px-3 text-base text-slate-800 leading-relaxed min-w-[200px] max-w-[280px] print:border-black print:text-black">
                            {project.reason || project.note ? (
                              <div className="text-slate-800 text-base leading-relaxed print:text-black">
                                <FormattedTextHierarchy text={project.reason || project.note || ''} />
                                {project.note && project.reason && project.note !== project.reason && (
                                  <div className="text-slate-600 text-sm mt-1 print:text-black">
                                    <span className="font-semibold text-slate-700 print:text-black">หมายเหตุ: </span>
                                    {project.note}
                                  </div>
                                )}
                                {project.planReference && (
                                  <div className="text-emerald-800 text-sm mt-1 font-semibold print:text-black">
                                    ที่มาในแผน: {project.planReference}
                                  </div>
                                )}
                              </div>
                            ) : project.planReference ? (
                              <div className="text-emerald-800 text-base leading-relaxed print:text-black">
                                <span className="font-bold">ที่มาในแผน: </span>
                                {project.planReference}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-sm italic print:text-black">-</span>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* Table Footer: Summary Strip Matching Screenshot */}
              {filteredProjects.length > 0 && (
                <tfoot>
                  <tr className="bg-[#064e3b] text-white font-bold text-[17px] border-t-2 border-[#075f48] print:bg-white print:text-black print:border-black">
                    {/* จัดการ column in footer: hidden when printing */}
                    <td className="print:hidden border-r border-[#075f48]" />

                    {/* Left title spans โครงการ + วัตถุประสงค์ + เป้าหมาย (3 columns) */}
                    <td colSpan={3} className="py-3.5 px-4 text-right border-r border-[#075f48] tracking-wide font-bold print:border-black print:text-black">
                      รวมทั้งสิ้น {filteredProjects.length} โครงการ
                    </td>

                    {/* 2571 Sum */}
                    <td className="py-3.5 px-2 text-right font-mono font-bold border-r border-[#075f48] print:border-black print:text-black">
                      {budgetSums.sum2571 > 0 ? budgetSums.sum2571.toLocaleString() : '-'}
                    </td>

                    {/* 2572 Sum */}
                    <td className="py-3.5 px-2 text-right font-mono font-bold border-r border-[#075f48] print:border-black print:text-black">
                      {budgetSums.sum2572 > 0 ? budgetSums.sum2572.toLocaleString() : '-'}
                    </td>

                    {/* 2573 Sum */}
                    <td className="py-3.5 px-2 text-right font-mono font-bold border-r border-[#075f48] print:border-black print:text-black">
                      {budgetSums.sum2573 > 0 ? budgetSums.sum2573.toLocaleString() : '-'}
                    </td>

                    {/* 2574 Sum */}
                    <td className="py-3.5 px-2 text-right font-mono font-bold border-r border-[#075f48] print:border-black print:text-black">
                      {budgetSums.sum2574 > 0 ? budgetSums.sum2574.toLocaleString() : '-'}
                    </td>

                    {/* 2575 Sum */}
                    <td className="py-3.5 px-2 text-right font-mono font-bold border-r border-[#075f48] print:border-black print:text-black">
                      {budgetSums.sum2575 > 0 ? budgetSums.sum2575.toLocaleString() : '-'}
                    </td>

                    {/* Right empty span */}
                    <td
                      colSpan={edition === 'first' ? 2 : 3}
                      className="py-3.5 px-4 print:border-black print:text-black"
                    />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="bg-slate-50 border-t border-slate-200 px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-base text-slate-700 print:hidden font-medium">
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

        {/* Modal for selecting candidate project for change/amendment */}
        <PlanSelectCandidateModal
          isOpen={isSelectCandidateModalOpen}
          onClose={() => setIsSelectCandidateModalOpen(false)}
          projects={projects}
          edition={edition}
          onSelectCandidate={(candidate) => {
            setSelectedCandidate(candidate);
            setIsSelectCandidateModalOpen(false);
            setIsComparisonModalOpen(true);
          }}
        />

        {/* Modal for comparing original project with changes and saving */}
        <PlanComparisonModal
          isOpen={isComparisonModalOpen}
          onClose={() => {
            setIsComparisonModalOpen(false);
            setSelectedCandidate(null);
          }}
          candidateProject={selectedCandidate}
          edition={edition}
          currentUser={currentUser}
          readOnly={currentUser?.role === 'public' || currentUser?.role === 'executive'}
          onSave={(newProject) => {
            if (onSaveNewProject) {
              onSaveNewProject(newProject);
            }
          }}
        />
      </div>
    </div>
  );
};
