import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  RotateCcw,
  Printer,
  Download,
  ChevronDown,
  Layers,
  ArrowLeftRight,
  FileEdit,
  Eye,
  FolderOpen,
  Check,
  FileSpreadsheet,
  FileCode2
} from 'lucide-react';
import { ProjectData } from '../types';
import { DEVELOPMENT_STRATEGIES, DEPARTMENTS } from '../utils/constants';
import { matchesProjectSearch } from '../utils/projectCode';

interface LocalPlanReportViewProps {
  projects: ProjectData[];
  onOpenProjectDetail?: (project: ProjectData) => void;
}

type ReportTab = 'p01' | 'p02_first' | 'p02_additional' | 'p02_changed' | 'p02_amended' | 'all_summary';

export const LocalPlanReportView: React.FC<LocalPlanReportViewProps> = ({
  projects,
  onOpenProjectDetail
}) => {
  // Filter States
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedStrategy, setSelectedStrategy] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [budgetFilter, setBudgetFilter] = useState<string>('');
  
  // Tab Selection
  const [activeTab, setActiveTab] = useState<ReportTab>('p02_first');
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState<boolean>(false);

  // Standard strategies and departments
  const strategies = useMemo(() => {
    return DEVELOPMENT_STRATEGIES;
  }, []);

  const departments = useMemo(() => {
    return DEPARTMENTS;
  }, []);

  // Filter projects by active tab (edition)
  const tabProjects = useMemo(() => {
    switch (activeTab) {
      case 'p02_first':
        return projects.filter((p) => p.edition === 'first');
      case 'p02_additional':
        return projects.filter((p) => p.edition === 'additional');
      case 'p02_changed':
        return projects.filter((p) => p.edition === 'changed');
      case 'p02_amended':
        return projects.filter((p) => p.edition === 'amended');
      case 'p01':
      case 'all_summary':
      default:
        return projects;
    }
  }, [projects, activeTab]);

  // Apply user search / filter criteria
  const filteredProjects = useMemo(() => {
    return tabProjects.filter((p) => {
      // Year filter
      if (selectedYear !== 'all') {
        const yrBudget = p.budgetByYear?.[selectedYear as '2571' | '2572' | '2573' | '2574' | '2575'] || 0;
        if (p.year !== selectedYear && yrBudget <= 0) return false;
      }

      // Strategy filter
      if (selectedStrategy && p.planStrategy !== selectedStrategy) {
        return false;
      }

      // Department filter
      if (selectedDepartment && p.department !== selectedDepartment) {
        return false;
      }

      // Search keyword (matches name, objective, target, code, issue, etc.)
      if (searchQuery.trim()) {
        if (!matchesProjectSearch(searchQuery, p)) return false;
      }

      // Budget filter
      if (budgetFilter.trim()) {
        const targetAmount = parseFloat(budgetFilter.replace(/,/g, ''));
        if (!isNaN(targetAmount)) {
          const totalPrjBudget =
            p.budgetPlan ||
            Object.values(p.budgetByYear || {}).reduce((a, b) => a + (b || 0), 0);
          if (Math.abs(totalPrjBudget - targetAmount) > 100 && totalPrjBudget < targetAmount) {
            return false;
          }
        }
      }

      return true;
    });
  }, [tabProjects, selectedYear, selectedStrategy, selectedDepartment, searchQuery, budgetFilter]);

  // Group filtered projects by strategy
  const groupedByStrategy = useMemo(() => {
    const groups: { [strategy: string]: ProjectData[] } = {};
    filteredProjects.forEach((p) => {
      const st = p.planStrategy || 'ประเด็นการพัฒนาทั่วไป';
      if (!groups[st]) groups[st] = [];
      groups[st].push(p);
    });
    return groups;
  }, [filteredProjects]);

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedYear('all');
    setSelectedStrategy('');
    setSelectedDepartment('');
    setSearchQuery('');
    setBudgetFilter('');
  };

  // Show All
  const handleShowAll = () => {
    handleResetFilters();
  };

  // Handle Print
  const handlePrint = () => {
    window.print();
  };

  // Check if activeTab should display the reason column (ฉบับเพิ่มเติม, เปลี่ยนแปลง, แก้ไข)
  const showReasonColumn = useMemo(() => {
    return (
      activeTab === 'p02_additional' ||
      activeTab === 'p02_changed' ||
      activeTab === 'p02_amended'
    );
  }, [activeTab]);

  // Export CSV
  const handleExportCSV = () => {
    setIsExportDropdownOpen(false);
    const headers = [
      'ที่',
      'โครงการ',
      'วัตถุประสงค์',
      'เป้าหมาย(ผลผลิตของโครงการ)',
      'งบประมาณ_2571(บาท)',
      'งบประมาณ_2572(บาท)',
      'งบประมาณ_2573(บาท)',
      'งบประมาณ_2574(บาท)',
      'งบประมาณ_2575(บาท)',
      'ผลที่คาดว่าจะได้รับ',
      'หน่วยงานรับผิดชอบ',
      ...(showReasonColumn ? ['เหตุผลความจำเป็น'] : [])
    ];

    const rows = filteredProjects.map((p, idx) => [
      idx + 1,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${(p.objective || '').replace(/"/g, '""')}"`,
      `"${(p.target || '').replace(/"/g, '""')}"`,
      p.budgetByYear?.['2571'] ?? 0,
      p.budgetByYear?.['2572'] ?? 0,
      p.budgetByYear?.['2573'] ?? 0,
      p.budgetByYear?.['2574'] ?? 0,
      p.budgetByYear?.['2575'] ?? 0,
      `"${(p.expectedResults || '').replace(/"/g, '""')}"`,
      `"${p.department || ''}"`,
      ...(showReasonColumn ? [`"${(p.reason || p.note || '').replace(/"/g, '""')}"`] : [])
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `รายงานแผนพัฒนาท้องถิ่น_${activeTab}_2571-2575.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export HTML as Word .doc
  const handleExportWord = () => {
    setIsExportDropdownOpen(false);
    const content = document.getElementById('printable-report-sheet')?.innerHTML;
    if (!content) return;

    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>รายงานแผนพัฒนาท้องถิ่น (แบบ ผ.02)</title>
        <style>
          @page { size: landscape; margin: 1cm; }
          body { font-family: 'TH Sarabun PSK', 'TH Sarabun New', 'Angsana New', sans-serif; font-size: 14pt; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 15px; }
          th, td { border: 1px solid #000; padding: 5px; font-size: 10.5pt; vertical-align: top; }
          th { background-color: #f2f2f2; text-align: center; font-weight: bold; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .text-left { text-align: left; }
          .font-bold { font-weight: bold; }
          .title { text-align: center; font-weight: bold; font-size: 16pt; }
          .subtitle { text-align: center; font-weight: bold; font-size: 14pt; }
        </style>
      </head>
      <body>
        ${content}
      </body>
      </html>
    `;

    const blob = new Blob(['\uFEFF' + html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `รายงานแผนพัฒนาท้องถิ่น_${activeTab}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Grand totals across years
  const grandTotals = useMemo(() => {
    const totals = {
      '2571': 0,
      '2572': 0,
      '2573': 0,
      '2574': 0,
      '2575': 0,
      all: 0
    };
    filteredProjects.forEach((p) => {
      const b71 = p.budgetByYear?.['2571'] || 0;
      const b72 = p.budgetByYear?.['2572'] || 0;
      const b73 = p.budgetByYear?.['2573'] || 0;
      const b74 = p.budgetByYear?.['2574'] || 0;
      const b75 = p.budgetByYear?.['2575'] || 0;

      totals['2571'] += b71;
      totals['2572'] += b72;
      totals['2573'] += b73;
      totals['2574'] += b74;
      totals['2575'] += b75;
      totals.all += (b71 + b72 + b73 + b74 + b75) || p.budgetPlan || 0;
    });
    return totals;
  }, [filteredProjects]);

  const getEditionSubtitle = () => {
    if (activeTab === 'p02_additional') {
      const num = filteredProjects.find((p) => p.editionNumber)?.editionNumber || 1;
      return `เพิ่มเติม ครั้งที่ ${num}/2571`;
    }
    if (activeTab === 'p02_changed') {
      const num = filteredProjects.find((p) => p.editionNumber)?.editionNumber || 1;
      return `เปลี่ยนแปลง ครั้งที่ ${num}/2571`;
    }
    if (activeTab === 'p02_amended') {
      const num = filteredProjects.find((p) => p.editionNumber)?.editionNumber || 1;
      return `แก้ไข ครั้งที่ ${num}/2571`;
    }
    if (activeTab === 'all_summary') {
      return 'ฉบับรวม';
    }
    return '';
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 h-full min-h-0 overflow-hidden print:bg-white print:overflow-visible">
      {/* 1. Header Banner */}
      <header className="bg-[#055740] text-white px-4 py-2 sm:px-6 shadow-sm flex items-center justify-between shrink-0 no-print print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-[#086d50] flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-emerald-100" />
          </div>
          <h1 className="text-xs sm:text-sm font-bold tracking-tight">
            รายงานแผนพัฒนาท้องถิ่น | ระบบแผนพัฒนาเทศบาลเมืองศิลา | เทศบาลเมืองศิลา จ.ขอนแก่น
          </h1>
        </div>
      </header>

      {/* Internal scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto print:overflow-visible">
        {/* 2. Controls & Filter Bar Container */}
        <div className="p-3 sm:p-4 space-y-3 no-print print:hidden">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          {/* Row 1: Year selection */}
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-xs font-semibold text-slate-700 whitespace-nowrap">
              ปีงบประมาณ:
            </label>
            <div className="relative inline-block min-w-[190px]">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full appearance-none bg-white border border-slate-300 rounded-lg px-3 py-1.5 pr-8 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="all">ทั้งหมด (2571-2575)</option>
                <option value="2571">ปี 2571</option>
                <option value="2572">ปี 2572</option>
                <option value="2573">ปี 2573</option>
                <option value="2574">ปี 2574</option>
                <option value="2575">ปี 2575</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Row 2: 4-Column Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* ประเด็นการพัฒนา */}
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                ประเด็นการพัฒนา
              </label>
              <div className="relative">
                <select
                  value={selectedStrategy}
                  onChange={(e) => setSelectedStrategy(e.target.value)}
                  title={selectedStrategy || '-- ทุกประเด็นการพัฒนา --'}
                  className="w-full appearance-none bg-white border border-slate-300 rounded-lg px-3 py-2 pr-8 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer truncate"
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

            {/* หน่วยงานรับผิดชอบหลัก */}
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                หน่วยงานรับผิดชอบหลัก
              </label>
              <div className="relative">
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  title={selectedDepartment || '-- ทุกหน่วยงาน --'}
                  className="w-full appearance-none bg-white border border-slate-300 rounded-lg px-3 py-2 pr-8 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer truncate"
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

            {/* ชื่อโครงการ */}
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                ชื่อโครงการ
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="ค้นหารหัส ID (เช่น ป.1-โยธา-001), ชื่อโครงการในรายงาน..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg pl-8 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* งบประมาณ (บาท) */}
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                งบประมาณ (บาท)
              </label>
              <input
                type="text"
                placeholder="ระบุจำนวนเงิน..."
                value={budgetFilter}
                onChange={(e) => setBudgetFilter(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Row 3: Action Buttons & Tabs */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
            {/* Left Button Group: ค้นหา, แสดงทั้งหมด, เริ่มใหม่ */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {}}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#059669] hover:bg-[#047857] text-white text-xs font-medium rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>ค้นหา</span>
              </button>

              <button
                type="button"
                onClick={handleShowAll}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <FolderOpen className="w-3.5 h-3.5 text-slate-500" />
                <span>แสดงทั้งหมด</span>
              </button>

              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-amber-700 border border-amber-200 text-xs font-medium rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                <span>เริ่มใหม่</span>
              </button>

              <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>

              {/* Tabs for Plan Types */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveTab('p01')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors cursor-pointer ${
                    activeTab === 'p01'
                      ? 'bg-[#059669] text-white font-medium shadow-xs'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>แบบ ผ.01</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('p02_first')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors cursor-pointer ${
                    activeTab === 'p02_first'
                      ? 'bg-[#059669] text-white font-medium shadow-xs'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>แบบ ผ.02 (ฉบับแรก)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('p02_additional')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors cursor-pointer ${
                    activeTab === 'p02_additional'
                      ? 'bg-[#059669] text-white font-medium shadow-xs'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>แบบ ผ.02 (เพิ่มเติม)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('p02_changed')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors cursor-pointer ${
                    activeTab === 'p02_changed'
                      ? 'bg-[#059669] text-white font-medium shadow-xs'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300'
                  }`}
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  <span>แบบ ผ.02 (เปลี่ยนแปลง)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('p02_amended')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors cursor-pointer ${
                    activeTab === 'p02_amended'
                      ? 'bg-[#059669] text-white font-medium shadow-xs'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300'
                  }`}
                >
                  <FileEdit className="w-3.5 h-3.5" />
                  <span>แบบ ผ.02 (แก้ไข)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('all_summary')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors cursor-pointer ${
                    activeTab === 'all_summary'
                      ? 'bg-[#059669] text-white font-medium shadow-xs'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>ฉบับรวม</span>
                </button>
              </div>
            </div>

            {/* Right Group: ส่งออกข้อมูล & พิมพ์รายงาน */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0f5132] hover:bg-[#0b3d26] text-white text-xs font-medium rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ส่งออกข้อมูล</span>
                  <span className="bg-emerald-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    3
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
                </button>

                {isExportDropdownOpen && (
                  <div className="absolute right-0 mt-1.5 w-48 bg-white border border-slate-200 rounded-lg shadow-lg py-1.5 z-20 text-xs text-slate-700">
                    <button
                      type="button"
                      onClick={handleExportCSV}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <span>ส่งออก Excel (.csv)</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleExportWord}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <FileCode2 className="w-4 h-4 text-blue-600" />
                      <span>ส่งออก Word (.doc)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsExportDropdownOpen(false);
                        window.print();
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <Printer className="w-4 h-4 text-slate-600" />
                      <span>พิมพ์ / PDF</span>
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>พิมพ์รายงาน</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Official Printable Paper Sheet */}
      <div className="px-4 sm:px-6 pb-12 print:p-0 print:m-0">
        <div
          id="printable-report-sheet"
          className="bg-white border border-slate-300 rounded-xl p-6 sm:p-10 shadow-sm max-w-[1400px] mx-auto print:border-none print:shadow-none print:p-0 print:max-w-none text-slate-900"
        >
          {/* Top Right Form Code */}
          <div className="text-right font-bold text-xs sm:text-sm text-slate-900 print:text-black mb-1">
            {activeTab === 'p01' ? 'แบบ ผ.01' : 'แบบ ผ.02'}
          </div>

          {/* Centered Document Header */}
          <div className="text-center space-y-1 mb-6">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 print:text-black leading-tight">
              {activeTab === 'p01'
                ? 'บัญชีสรุปจำนวนโครงการและงบประมาณ'
                : 'บัญชีรายละเอียดโครงการพัฒนาท้องถิ่น'}
            </h2>
            <h3 className="text-sm sm:text-base font-bold text-slate-800 print:text-black leading-tight">
              แผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575)
              {getEditionSubtitle() ? ` ${getEditionSubtitle()}` : ''}
            </h3>
            <p className="text-xs sm:text-sm font-semibold text-slate-800 print:text-black leading-tight">
              เทศบาลเมืองศิลา อำเภอเมืองขอนแก่น จังหวัดขอนแก่น
            </p>
          </div>

          {/* If Form P.01 is selected */}
          {activeTab === 'p01' ? (
            <div className="space-y-6">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-slate-900 text-xs p02-print-table">
                  <thead>
                    <tr className="bg-slate-50 text-slate-900 font-bold border-b border-slate-900 text-center">
                      <th rowSpan={2} className="border border-slate-900 py-3 px-2 w-12">
                        ที่
                      </th>
                      <th rowSpan={2} className="border border-slate-900 py-3 px-4 text-left">
                        ประเด็นยุทธศาสตร์การพัฒนา
                      </th>
                      <th rowSpan={2} className="border border-slate-900 py-3 px-2 w-20">
                        จำนวน<br />โครงการ
                      </th>
                      <th colSpan={5} className="border border-slate-900 py-2 px-3">
                        งบประมาณตามแผนพัฒนา (บาท)
                      </th>
                      <th rowSpan={2} className="border border-slate-900 py-3 px-3 w-28">
                        รวมงบประมาณ<br />(บาท)
                      </th>
                    </tr>
                    <tr className="bg-slate-50 text-slate-900 font-bold border-b border-slate-900 text-center">
                      <th className="border border-slate-900 py-1.5 px-2 w-24">2571</th>
                      <th className="border border-slate-900 py-1.5 px-2 w-24">2572</th>
                      <th className="border border-slate-900 py-1.5 px-2 w-24">2573</th>
                      <th className="border border-slate-900 py-1.5 px-2 w-24">2574</th>
                      <th className="border border-slate-900 py-1.5 px-2 w-24">2575</th>
                    </tr>
                  </thead>
                  <tbody>
                    {strategies.map((st, idx) => {
                      const stProjects = projects.filter((p) => p.planStrategy === st);
                      const stCount = stProjects.length;
                      const y71 = stProjects.reduce((s, p) => s + (p.budgetByYear?.['2571'] || 0), 0);
                      const y72 = stProjects.reduce((s, p) => s + (p.budgetByYear?.['2572'] || 0), 0);
                      const y73 = stProjects.reduce((s, p) => s + (p.budgetByYear?.['2573'] || 0), 0);
                      const y74 = stProjects.reduce((s, p) => s + (p.budgetByYear?.['2574'] || 0), 0);
                      const y75 = stProjects.reduce((s, p) => s + (p.budgetByYear?.['2575'] || 0), 0);
                      const stTotal = y71 + y72 + y73 + y74 + y75;

                      return (
                        <tr key={st} className="hover:bg-slate-50/60 transition-colors">
                          <td className="border border-slate-900 py-2.5 px-2 text-center font-mono font-medium">
                            {idx + 1}
                          </td>
                          <td className="border border-slate-900 py-2.5 px-4 font-medium text-slate-900">
                            {st}
                          </td>
                          <td className="border border-slate-900 py-2.5 px-2 text-center font-mono font-bold">
                            {stCount}
                          </td>
                          <td className="border border-slate-900 py-2.5 px-2 text-right font-mono">
                            {y71 > 0 ? y71.toLocaleString() : '-'}
                          </td>
                          <td className="border border-slate-900 py-2.5 px-2 text-right font-mono">
                            {y72 > 0 ? y72.toLocaleString() : '-'}
                          </td>
                          <td className="border border-slate-900 py-2.5 px-2 text-right font-mono">
                            {y73 > 0 ? y73.toLocaleString() : '-'}
                          </td>
                          <td className="border border-slate-900 py-2.5 px-2 text-right font-mono">
                            {y74 > 0 ? y74.toLocaleString() : '-'}
                          </td>
                          <td className="border border-slate-900 py-2.5 px-2 text-right font-mono">
                            {y75 > 0 ? y75.toLocaleString() : '-'}
                          </td>
                          <td className="border border-slate-900 py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                            {stTotal > 0 ? stTotal.toLocaleString() : '-'}
                          </td>
                        </tr>
                      );
                    })}

                    {/* Total Row */}
                    <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-900">
                      <td colSpan={2} className="border border-slate-900 py-3 px-4 text-center">
                        รวมทั้งสิ้น
                      </td>
                      <td className="border border-slate-900 py-3 px-2 text-center font-mono font-bold">
                        {projects.length}
                      </td>
                      <td className="border border-slate-900 py-3 px-2 text-right font-mono">
                        {grandTotals['2571'].toLocaleString()}
                      </td>
                      <td className="border border-slate-900 py-3 px-2 text-right font-mono">
                        {grandTotals['2572'].toLocaleString()}
                      </td>
                      <td className="border border-slate-900 py-3 px-2 text-right font-mono">
                        {grandTotals['2573'].toLocaleString()}
                      </td>
                      <td className="border border-slate-900 py-3 px-2 text-right font-mono">
                        {grandTotals['2574'].toLocaleString()}
                      </td>
                      <td className="border border-slate-900 py-3 px-2 text-right font-mono">
                        {grandTotals['2575'].toLocaleString()}
                      </td>
                      <td className="border border-slate-900 py-3 px-3 text-right font-mono font-bold text-emerald-800">
                        {grandTotals.all.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Official Form P.02 View (Exact layout matching screenshot) */
            <div className="space-y-6">
              {Object.keys(groupedByStrategy).length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-300 rounded-lg text-slate-400 text-xs">
                  ไม่พบรายการโครงการตามเงื่อนไขที่เลือก
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-slate-900 text-xs p02-print-table">
                    <thead>
                      <tr className="bg-slate-50 print:bg-slate-100 text-slate-900 print:text-black font-bold border-b border-slate-900">
                        {/* 1. ที่ (w-12 text-center) */}
                        <th
                          rowSpan={2}
                          className="border border-slate-900 py-3 px-2 text-center w-12 font-bold text-xs"
                        >
                          ที่
                        </th>

                        {/* 2. โครงการ (แสดงเฉพาะชื่อโครงการ) */}
                        <th
                          rowSpan={2}
                          className="border border-slate-900 py-3 px-3 text-left min-w-[220px] font-bold text-xs"
                        >
                          โครงการ
                        </th>

                        {/* 3. วัตถุประสงค์ */}
                        <th
                          rowSpan={2}
                          className="border border-slate-900 py-3 px-3 text-left min-w-[180px] font-bold text-xs"
                        >
                          วัตถุประสงค์
                        </th>

                        {/* 4. เป้าหมาย (ผลผลิตของโครงการ) */}
                        <th
                          rowSpan={2}
                          className="border border-slate-900 py-3 px-3 text-left min-w-[200px] font-bold text-xs"
                        >
                          เป้าหมาย
                          <br />
                          (ผลผลิตของโครงการ)
                        </th>

                        {/* 5. งบประมาณ (บาท) (ครอบปี 2571 - 2575) */}
                        <th
                          colSpan={5}
                          className="border border-slate-900 py-2 px-2 text-center font-bold text-xs"
                        >
                          งบประมาณ
                          <br />
                          (บาท)
                        </th>

                        {/* 6. ผลที่คาดว่าจะได้รับ */}
                        <th
                          rowSpan={2}
                          className="border border-slate-900 py-3 px-3 text-left min-w-[180px] font-bold text-xs"
                        >
                          ผลที่คาดว่า
                          <br />
                          จะได้รับ
                        </th>

                        {/* 7. หน่วยงานรับผิดชอบ */}
                        <th
                          rowSpan={2}
                          className="border border-slate-900 py-3 px-2 text-center w-28 font-bold text-xs"
                        >
                          หน่วยงาน
                          <br />
                          รับผิดชอบ
                        </th>

                        {/* 8. เหตุผลความจำเป็น (แสดงเฉพาะฉบับเพิ่มเติม/เปลี่ยนแปลง/แก้ไข) */}
                        {showReasonColumn && (
                          <th
                            rowSpan={2}
                            className="border border-slate-900 py-3 px-3 text-left min-w-[200px] font-bold text-xs"
                          >
                            เหตุผลความจำเป็น
                          </th>
                        )}
                      </tr>
                      <tr className="bg-slate-50 print:bg-slate-100 text-slate-900 print:text-black font-bold border-b border-slate-900 text-center">
                        <th className="border border-slate-900 py-1.5 px-2 min-w-[80px] text-[11px]">
                          2571
                          <br />
                          (บาท)
                        </th>
                        <th className="border border-slate-900 py-1.5 px-2 min-w-[70px] text-[11px]">
                          2572
                          <br />
                          (บาท)
                        </th>
                        <th className="border border-slate-900 py-1.5 px-2 min-w-[70px] text-[11px]">
                          2573
                          <br />
                          (บาท)
                        </th>
                        <th className="border border-slate-900 py-1.5 px-2 min-w-[70px] text-[11px]">
                          2574
                          <br />
                          (บาท)
                        </th>
                        <th className="border border-slate-900 py-1.5 px-2 min-w-[70px] text-[11px]">
                          2575
                          <br />
                          (บาท)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300">
                      {Object.entries(groupedByStrategy).map(([strategyTitle, prjList], stIdx) => {
                        const stB71 = prjList.reduce((acc, p) => acc + (p.budgetByYear?.['2571'] || 0), 0);
                        const stB72 = prjList.reduce((acc, p) => acc + (p.budgetByYear?.['2572'] || 0), 0);
                        const stB73 = prjList.reduce((acc, p) => acc + (p.budgetByYear?.['2573'] || 0), 0);
                        const stB74 = prjList.reduce((acc, p) => acc + (p.budgetByYear?.['2574'] || 0), 0);
                        const stB75 = prjList.reduce((acc, p) => acc + (p.budgetByYear?.['2575'] || 0), 0);
                        const stTotal = stB71 + stB72 + stB73 + stB74 + stB75;

                        return (
                          <React.Fragment key={strategyTitle}>
                            {/* Strategy Heading Row */}
                            <tr className="bg-slate-100/90 print:bg-slate-100 font-bold border-t-2 border-b border-slate-900">
                              <td
                                colSpan={showReasonColumn ? 12 : 11}
                                className="border border-slate-900 py-2.5 px-3 text-left font-bold text-slate-900 print:text-black text-xs"
                              >
                                {stIdx + 1}. ประเด็นการพัฒนาท้องถิ่น: {strategyTitle}
                              </td>
                            </tr>

                            {/* Project Rows */}
                            {prjList.map((p, idx) => {
                              const b71 = p.budgetByYear?.['2571'] || 0;
                              const b72 = p.budgetByYear?.['2572'] || 0;
                              const b73 = p.budgetByYear?.['2573'] || 0;
                              const b74 = p.budgetByYear?.['2574'] || 0;
                              const b75 = p.budgetByYear?.['2575'] || 0;

                              return (
                                <tr
                                  key={p.id}
                                  className="hover:bg-slate-50/70 transition-colors align-top print:border-b print:border-black"
                                >
                                  {/* 1. ที่ (w-12 text-center) */}
                                  <td className="border border-slate-900 py-2.5 px-2 text-center font-mono font-medium text-slate-900 print:text-black text-xs w-12">
                                    {idx + 1}
                                  </td>

                                  {/* 2. โครงการ (แสดงเฉพาะชื่อโครงการโดยตรง) */}
                                  <td className="border border-slate-900 py-2.5 px-3 font-medium text-slate-900 print:text-black text-xs leading-snug">
                                    {onOpenProjectDetail ? (
                                      <button
                                        type="button"
                                        onClick={() => onOpenProjectDetail(p)}
                                        className="text-left font-medium text-slate-900 hover:text-emerald-700 hover:underline transition-colors cursor-pointer print:text-black print:no-underline"
                                        title="คลิกเพื่อดูรายละเอียดโครงการ"
                                      >
                                        {p.name}
                                      </button>
                                    ) : (
                                      <span>{p.name}</span>
                                    )}
                                  </td>

                                  {/* 3. วัตถุประสงค์ */}
                                  <td className="border border-slate-900 py-2.5 px-3 text-slate-800 print:text-black text-xs leading-relaxed">
                                    {p.objective || '-'}
                                  </td>

                                  {/* 4. เป้าหมาย (ผลผลิตของโครงการ) */}
                                  <td className="border border-slate-900 py-2.5 px-3 text-slate-800 print:text-black text-xs leading-relaxed">
                                    {p.target || '-'}
                                  </td>

                                  {/* 5. งบประมาณ (บาท) */}
                                  <td className="border border-slate-900 py-2.5 px-2 text-right font-mono font-medium text-slate-900 print:text-black text-xs">
                                    {b71 > 0 ? b71.toLocaleString() : '-'}
                                  </td>
                                  <td className="border border-slate-900 py-2.5 px-2 text-right font-mono text-slate-800 print:text-black text-xs">
                                    {b72 > 0 ? b72.toLocaleString() : '-'}
                                  </td>
                                  <td className="border border-slate-900 py-2.5 px-2 text-right font-mono text-slate-800 print:text-black text-xs">
                                    {b73 > 0 ? b73.toLocaleString() : '-'}
                                  </td>
                                  <td className="border border-slate-900 py-2.5 px-2 text-right font-mono text-slate-800 print:text-black text-xs">
                                    {b74 > 0 ? b74.toLocaleString() : '-'}
                                  </td>
                                  <td className="border border-slate-900 py-2.5 px-2 text-right font-mono text-slate-800 print:text-black text-xs">
                                    {b75 > 0 ? b75.toLocaleString() : '-'}
                                  </td>

                                  {/* 6. ผลที่คาดว่าจะได้รับ */}
                                  <td className="border border-slate-900 py-2.5 px-3 text-slate-800 print:text-black text-xs leading-relaxed">
                                    {p.expectedResults || '-'}
                                  </td>

                                  {/* 7. หน่วยงานรับผิดชอบ */}
                                  <td className="border border-slate-900 py-2.5 px-2 text-center text-slate-800 print:text-black font-medium text-xs">
                                    {p.department || '-'}
                                  </td>

                                  {/* 8. เหตุผลความจำเป็น (แสดงเฉพาะฉบับเพิ่มเติม/เปลี่ยนแปลง/แก้ไข) */}
                                  {showReasonColumn && (
                                    <td className="border border-slate-900 py-2.5 px-3 text-slate-800 print:text-black text-xs leading-relaxed">
                                      {p.reason || p.note || '-'}
                                    </td>
                                  )}
                                </tr>
                              );
                            })}

                            {/* รวมของแต่ละประเด็นยุทธศาสตร์ */}
                            <tr className="bg-slate-100/80 print:bg-slate-50 font-bold text-slate-900 print:text-black border-t-2 border-b border-slate-900">
                              <td colSpan={4} className="border border-slate-900 py-2 px-3 text-center text-xs">
                                รวม {prjList.length} โครงการ ({strategyTitle})
                              </td>
                              <td className="border border-slate-900 py-2 px-2 text-right font-mono text-xs">
                                {stB71 > 0 ? stB71.toLocaleString() : '-'}
                              </td>
                              <td className="border border-slate-900 py-2 px-2 text-right font-mono text-xs">
                                {stB72 > 0 ? stB72.toLocaleString() : '-'}
                              </td>
                              <td className="border border-slate-900 py-2 px-2 text-right font-mono text-xs">
                                {stB73 > 0 ? stB73.toLocaleString() : '-'}
                              </td>
                              <td className="border border-slate-900 py-2 px-2 text-right font-mono text-xs">
                                {stB74 > 0 ? stB74.toLocaleString() : '-'}
                              </td>
                              <td className="border border-slate-900 py-2 px-2 text-right font-mono text-xs">
                                {stB75 > 0 ? stB75.toLocaleString() : '-'}
                              </td>
                              <td
                                colSpan={showReasonColumn ? 3 : 2}
                                className="border border-slate-900 py-2 px-3 text-center text-slate-600 print:text-black font-normal text-xs"
                              >
                                {stTotal > 0 ? `รวม ${stTotal.toLocaleString()} บาท` : '-'}
                              </td>
                            </tr>
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                    {/* รวมแถวสรุปจำนวนโครงการและรวมงบประมาณรายปีไว้ท้ายตาราง */}
                    <tfoot className="border-t-2 border-b-2 border-slate-900 font-bold">
                      <tr className="bg-slate-100 print:bg-slate-100 font-bold text-slate-900 print:text-black border-t-2 border-b-2 border-slate-900">
                        <td
                          colSpan={4}
                          className="border border-slate-900 py-3 px-3 text-center font-bold text-xs print:border-black print:text-black"
                        >
                          รวมทั้งสิ้น ({filteredProjects.length} โครงการ)
                        </td>
                        <td className="border border-slate-900 py-3 px-2 text-right font-mono font-bold text-xs print:border-black print:text-black">
                          {grandTotals['2571'] > 0 ? grandTotals['2571'].toLocaleString() : '-'}
                        </td>
                        <td className="border border-slate-900 py-3 px-2 text-right font-mono font-bold text-xs print:border-black print:text-black">
                          {grandTotals['2572'] > 0 ? grandTotals['2572'].toLocaleString() : '-'}
                        </td>
                        <td className="border border-slate-900 py-3 px-2 text-right font-mono font-bold text-xs print:border-black print:text-black">
                          {grandTotals['2573'] > 0 ? grandTotals['2573'].toLocaleString() : '-'}
                        </td>
                        <td className="border border-slate-900 py-3 px-2 text-right font-mono font-bold text-xs print:border-black print:text-black">
                          {grandTotals['2574'] > 0 ? grandTotals['2574'].toLocaleString() : '-'}
                        </td>
                        <td className="border border-slate-900 py-3 px-2 text-right font-mono font-bold text-xs print:border-black print:text-black">
                          {grandTotals['2575'] > 0 ? grandTotals['2575'].toLocaleString() : '-'}
                        </td>
                        <td
                          colSpan={showReasonColumn ? 3 : 2}
                          className="border border-slate-900 py-3 px-3 text-center font-bold text-xs print:border-black print:text-black text-emerald-900"
                        >
                          งบประมาณรวมทั้งสิ้น 5 ปี: {grandTotals.all.toLocaleString()} บาท
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              {/* Total Summary Block at bottom - hidden during print because footer table row handles it */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-2 no-print print:hidden">
                <div>
                  รวมโครงการที่แสดง:{' '}
                  <strong className="text-slate-900 font-mono">
                    {filteredProjects.length}
                  </strong>{' '}
                  โครงการ
                </div>
                <div className="flex items-center gap-4">
                  <span>
                    งบประมาณรวมปี 2571:{' '}
                    <strong className="text-emerald-700 font-mono">
                      ฿{grandTotals['2571'].toLocaleString()}
                    </strong>
                  </span>
                  <span>
                    งบประมาณรวมทั้งสิ้น 5 ปี:{' '}
                    <strong className="text-slate-900 font-mono">
                      ฿{grandTotals.all.toLocaleString()}
                    </strong>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);
};
