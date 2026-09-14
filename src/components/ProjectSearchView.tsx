import React, { useState, useMemo } from 'react';
import {
  Search,
  FolderOpen,
  RotateCcw,
  Download,
  Printer,
  ChevronDown,
  Building2,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { ProjectData, PlanEdition } from '../types';
import { DEVELOPMENT_STRATEGIES, DEPARTMENTS } from '../utils/constants';
import { matchesProjectSearch, formatProjectDisplayTitle, getProjectDisplayId } from '../utils/projectCode';

interface ProjectSearchViewProps {
  projects: ProjectData[];
  onOpenProjectDetail: (project: ProjectData) => void;
}

export const ProjectSearchView: React.FC<ProjectSearchViewProps> = ({
  projects,
  onOpenProjectDetail
}) => {
  // Filter States
  const [selectedYear, setSelectedYear] = useState<string>('2571');
  const [selectedStrategy, setSelectedStrategy] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [searchName, setSearchName] = useState<string>('');
  const [searchBudget, setSearchBudget] = useState<string>('');
  const [isExportMenuOpen, setIsExportMenuOpen] = useState<boolean>(false);

  // Available strategies and departments
  const strategies = useMemo(() => {
    const list = Array.from(
      new Set([...DEVELOPMENT_STRATEGIES, ...projects.map((p) => p.planStrategy)])
    ).filter(Boolean);
    return list;
  }, [projects]);

  const departments = useMemo(() => {
    const list = Array.from(
      new Set([...DEPARTMENTS, ...projects.map((p) => p.department)])
    ).filter(Boolean);
    return list;
  }, [projects]);

  // Filtered and Sorted Projects
  const filteredProjects = useMemo(() => {
    return projects
      .filter((p) => {
        // Year filter
        if (selectedYear !== 'all' && p.year !== selectedYear) {
          // If project has budget in selectedYear, include it as well
          const budgetInYear = p.budgetByYear?.[selectedYear] || 0;
          if (p.year !== selectedYear && budgetInYear <= 0) return false;
        }

        // Strategy filter
        if (selectedStrategy && p.planStrategy !== selectedStrategy) {
          return false;
        }

        // Department filter
        if (selectedDepartment && p.department !== selectedDepartment) {
          return false;
        }

        // Project Name & Code search
        if (searchName.trim()) {
          if (!matchesProjectSearch(searchName, p)) {
            return false;
          }
        }

        // Budget search
        if (searchBudget.trim()) {
          const targetBudget = parseFloat(searchBudget.replace(/,/g, ''));
          if (!isNaN(targetBudget)) {
            const total5Y =
              (p.budgetByYear?.['2571'] || 0) +
              (p.budgetByYear?.['2572'] || 0) +
              (p.budgetByYear?.['2573'] || 0) +
              (p.budgetByYear?.['2574'] || 0) +
              (p.budgetByYear?.['2575'] || 0);
            if (
              p.budgetPlan < targetBudget &&
              (p.budgetByYear?.['2571'] || 0) < targetBudget &&
              total5Y < targetBudget
            ) {
              return false;
            }
          }
        }

        return true;
      })
      .sort((a, b) => {
        // Extract numeric ID for descending order matching screenshot (#9, #8, #7...)
        const getNum = (proj: ProjectData) => {
          const match = proj.id.match(/\d+$/);
          return match ? parseInt(match[0], 10) : proj.orderNumber;
        };
        return getNum(b) - getNum(a);
      });
  }, [
    projects,
    selectedYear,
    selectedStrategy,
    selectedDepartment,
    searchName,
    searchBudget
  ]);

  // Handle Reset / Clear
  const handleReset = () => {
    setSelectedYear('2571');
    setSelectedStrategy('');
    setSelectedDepartment('');
    setSearchName('');
    setSearchBudget('');
  };

  const handleShowAll = () => {
    setSelectedYear('all');
    setSelectedStrategy('');
    setSelectedDepartment('');
    setSearchName('');
    setSearchBudget('');
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'ID',
      'ปี พ.ศ.',
      'ประเภท',
      'ที่',
      'ประเด็นการพัฒนา',
      'แผนงาน',
      'ชื่อโครงการ',
      'วัตถุประสงค์',
      'เป้าหมาย (ผลผลิตของโครงการ)',
      'งบประมาณ 2571',
      'งบประมาณ 2572',
      'งบประมาณ 2573',
      'งบประมาณ 2574',
      'งบประมาณ 2575',
      'รวม 5 ปี',
      'หน่วยงานรับผิดชอบหลัก'
    ];

    const editionLabelMap: Record<PlanEdition, string> = {
      first: 'ฉบับแรก',
      additional: 'เพิ่มเติม',
      changed: 'เปลี่ยนแปลง',
      amended: 'แก้ไข'
    };

    const rows = filteredProjects.map((p, idx) => {
      const match = p.id.match(/\d+$/);
      const displayId = match ? parseInt(match[0], 10) : idx + 1;
      const b71 = p.budgetByYear?.['2571'] || 0;
      const b72 = p.budgetByYear?.['2572'] || 0;
      const b73 = p.budgetByYear?.['2573'] || 0;
      const b74 = p.budgetByYear?.['2574'] || 0;
      const b75 = p.budgetByYear?.['2575'] || 0;
      const total5Y = b71 + b72 + b73 + b74 + b75;

      return [
        `"${getProjectDisplayId(p, p.orderNumber || idx + 1)}"`,
        p.year || '2571',
        editionLabelMap[p.edition] || 'ฉบับแรก',
        idx + 1,
        `"${(p.planStrategy || '').replace(/"/g, '""')}"`,
        `"${(p.planCategory || '').replace(/"/g, '""')}"`,
        `"${(p.name || '').replace(/"/g, '""')}"`,
        `"${(p.objective || '').replace(/"/g, '""')}"`,
        `"${(p.target || '').replace(/"/g, '""')}"`,
        b71,
        b72,
        b73,
        b74,
        b75,
        total5Y,
        `"${(p.department || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `รายงานสืบค้นโครงการ_${selectedYear === 'all' ? 'ทุกปี' : selectedYear}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setIsExportMenuOpen(false);
  };

  // Helper for edition badges
  const renderEditionBadge = (edition: PlanEdition) => {
    switch (edition) {
      case 'changed':
        return (
          <span className="inline-block px-2 py-0.5 text-[11px] font-semibold rounded-md bg-purple-50 text-purple-700 border border-purple-200">
            เปลี่ยนแปลง
          </span>
        );
      case 'amended':
        return (
          <span className="inline-block px-2 py-0.5 text-[11px] font-semibold rounded-md bg-amber-50 text-amber-700 border border-amber-200">
            แก้ไข
          </span>
        );
      case 'additional':
        return (
          <span className="inline-block px-2 py-0.5 text-[11px] font-semibold rounded-md bg-blue-50 text-blue-700 border border-blue-200">
            เพิ่มเติม
          </span>
        );
      case 'first':
      default:
        return (
          <span className="inline-block px-2 py-0.5 text-[11px] font-semibold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
            ฉบับแรก
          </span>
        );
    }
  };

  // Budget calculations
  const totalB2571 = filteredProjects.reduce(
    (sum, p) => sum + (p.budgetByYear?.['2571'] || 0),
    0
  );
  const totalB2572 = filteredProjects.reduce(
    (sum, p) => sum + (p.budgetByYear?.['2572'] || 0),
    0
  );
  const totalB2573 = filteredProjects.reduce(
    (sum, p) => sum + (p.budgetByYear?.['2573'] || 0),
    0
  );
  const totalB2574 = filteredProjects.reduce(
    (sum, p) => sum + (p.budgetByYear?.['2574'] || 0),
    0
  );
  const totalB2575 = filteredProjects.reduce(
    (sum, p) => sum + (p.budgetByYear?.['2575'] || 0),
    0
  );
  const grandTotal5Y =
    totalB2571 + totalB2572 + totalB2573 + totalB2574 + totalB2575;

  return (
    <div className="flex-1 flex flex-col bg-slate-50 h-full min-h-0 overflow-hidden">
      {/* Top Header Banner matching Sila theme */}
      <header className="bg-[#055740] text-white px-4 py-2 sm:px-6 shadow-sm flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-[#086d50] flex items-center justify-center shrink-0">
            <Search className="w-4 h-4 text-emerald-100" />
          </div>
          <div>
            <h1 className="text-xs sm:text-sm font-bold tracking-tight">
              ระบบสืบค้นโครงการแผนพัฒนาท้องถิ่น | ระบบแผนพัฒนาเทศบาลเมืองศิลา | เทศบาลเมืองศิลา จ.ขอนแก่น
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-3">
        {/* Controls Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
          {/* Top Year Filter Row */}
          <div className="flex items-center gap-3 text-xs">
            <label htmlFor="select-budget-year" className="font-bold text-slate-700 whitespace-nowrap">
              ปีงบประมาณ:
            </label>
            <div className="relative w-44">
              <select
                id="select-budget-year"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full appearance-none pl-3 pr-8 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold cursor-pointer shadow-2xs"
              >
                <option value="2571">พ.ศ. 2571</option>
                <option value="2572">พ.ศ. 2572</option>
                <option value="2573">พ.ศ. 2573</option>
                <option value="2574">พ.ศ. 2574</option>
                <option value="2575">พ.ศ. 2575</option>
                <option value="all">ทุกปีงบประมาณ</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* 4 Filters Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Filter 1: ประเด็นการพัฒนา */}
            <div>
              <label htmlFor="filter-strategy" className="block font-semibold text-slate-700 mb-1">
                ประเด็นการพัฒนา
              </label>
              <div className="relative">
                <select
                  id="filter-strategy"
                  value={selectedStrategy}
                  onChange={(e) => setSelectedStrategy(e.target.value)}
                  title={selectedStrategy || '-- ทุกประเด็นการพัฒนา --'}
                  className="w-full appearance-none pl-3 pr-8 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer truncate"
                >
                  <option value="">-- ทุกประเด็นการพัฒนา --</option>
                  {strategies.map((strat, idx) => (
                    <option key={idx} value={strat} title={strat}>
                      {strat}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Filter 2: หน่วยงานรับผิดชอบหลัก */}
            <div>
              <label htmlFor="filter-department" className="block font-semibold text-slate-700 mb-1">
                หน่วยงานรับผิดชอบหลัก
              </label>
              <div className="relative">
                <select
                  id="filter-department"
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  title={selectedDepartment || '-- ทุกหน่วยงาน --'}
                  className="w-full appearance-none pl-3 pr-8 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer truncate"
                >
                  <option value="">-- ทุกหน่วยงาน --</option>
                  {departments.map((dept, idx) => (
                    <option key={idx} value={dept} title={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Filter 3: ชื่อโครงการ */}
            <div>
              <label htmlFor="filter-name" className="block font-semibold text-slate-700 mb-1">
                ชื่อโครงการ
              </label>
              <div className="relative">
                <input
                  id="filter-name"
                  type="text"
                  placeholder="ค้นหาชื่อโครงการ..."
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="w-full pl-3 pr-8 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Filter 4: งบประมาณ (บาท) */}
            <div>
              <label htmlFor="filter-budget" className="block font-semibold text-slate-700 mb-1">
                งบประมาณ (บาท)
              </label>
              <input
                id="filter-budget"
                type="text"
                placeholder="ระบุจำนวนเงิน..."
                value={searchBudget}
                onChange={(e) => setSearchBudget(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 text-xs">
            {/* Left Action Buttons */}
            <div className="flex items-center flex-wrap gap-2">
              <button
                id="btn-search-execute"
                type="button"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#059669] hover:bg-[#047857] text-white font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>ค้นหา</span>
              </button>

              <button
                id="btn-search-show-all"
                type="button"
                onClick={handleShowAll}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-lg transition-colors cursor-pointer"
              >
                <FolderOpen className="w-3.5 h-3.5 text-slate-500" />
                <span>แสดงทั้งหมด</span>
              </button>

              <button
                id="btn-search-reset"
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                <span>เริ่มใหม่</span>
              </button>

              <div className="flex items-center gap-1.5 text-slate-700 ml-1">
                <span>รายการโครงการ ({filteredProjects.length} รายการ)</span>
                <span className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-600 rounded-md border border-slate-200">
                  ผลการกรอง
                </span>
              </div>
            </div>

            {/* Right Action Buttons */}
            <div className="flex items-center gap-2">
              {/* Export Dropdown */}
              <div className="relative">
                <button
                  id="btn-search-export-menu"
                  type="button"
                  onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#055740] hover:bg-[#044835] text-white font-medium rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ส่งออกข้อมูล</span>
                  <span className="bg-[#086d50] text-emerald-100 text-[10px] px-1.5 py-0.2 rounded font-mono">
                    {filteredProjects.length}
                  </span>
                  <ChevronDown className="w-3 h-3" />
                </button>

                {isExportMenuOpen && (
                  <div className="absolute right-0 mt-1 w-44 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-30 animate-in fade-in duration-100">
                    <button
                      type="button"
                      onClick={handleExportCSV}
                      className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                      <span>ส่งออก Excel / CSV</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        window.print();
                        setIsExportMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-blue-600" />
                      <span>พิมพ์รายงาน PDF</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Print Report */}
              <button
                id="btn-search-print"
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-lg transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>พิมพ์รายงาน</span>
              </button>
            </div>
          </div>
        </div>

        {/* Results Table Card */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-auto max-h-[60vh]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#055740] text-white font-semibold text-[11px] select-none sticky top-0 z-10">
                  <th className="py-2.5 px-2.5 text-center w-16 border-r border-emerald-800/40">ปี พ.ศ.</th>
                  <th className="py-2.5 px-3 text-center w-24 border-r border-emerald-800/40">ประเภท</th>
                  <th className="py-2.5 px-2 text-center w-10 border-r border-emerald-800/40">ที่</th>
                  <th className="py-2.5 px-3 min-w-[180px] border-r border-emerald-800/40">ประเด็นการพัฒนา</th>
                  <th className="py-2.5 px-3 min-w-[140px] border-r border-emerald-800/40">แผนงาน</th>
                  <th className="py-2.5 px-3 min-w-[220px] border-r border-emerald-800/40">ชื่อโครงการ</th>
                  <th className="py-2.5 px-3 min-w-[220px] border-r border-emerald-800/40">วัตถุประสงค์</th>
                  <th className="py-2.5 px-3 min-w-[220px] border-r border-emerald-800/40">เป้าหมาย (ผลผลิตของโครงการ)</th>
                  <th className="py-2.5 px-2.5 text-right w-24 border-r border-emerald-800/40">งบ 2571</th>
                  <th className="py-2.5 px-2.5 text-right w-24 border-r border-emerald-800/40">งบ 2572</th>
                  <th className="py-2.5 px-2.5 text-right w-24 border-r border-emerald-800/40">งบ 2573</th>
                  <th className="py-2.5 px-2.5 text-right w-24 border-r border-emerald-800/40">งบ 2574</th>
                  <th className="py-2.5 px-2.5 text-right w-24 border-r border-emerald-800/40">งบ 2575</th>
                  <th className="py-2.5 px-2.5 text-right w-26 border-r border-emerald-800/40 bg-[#044835]">รวม 5 ปี</th>
                  <th className="py-2.5 px-3 min-w-[130px] text-center">หน่วยงาน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700 text-xs">
                {filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan={15} className="py-12 text-center text-slate-400">
                      <Search className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <div className="font-medium text-slate-600">ไม่พบโครงการตามเงื่อนไขการสืบค้น</div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        ลองเปลี่ยนคำค้นหา หรือกดปุ่ม "แสดงทั้งหมด" เพื่อดูโครงการทั้งหมด
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredProjects.map((p, idx) => {
                    const match = p.id.match(/\d+$/);
                    const displayId = match ? parseInt(match[0], 10) : idx + 1;
                    const b71 = p.budgetByYear?.['2571'] || 0;
                    const b72 = p.budgetByYear?.['2572'] || 0;
                    const b73 = p.budgetByYear?.['2573'] || 0;
                    const b74 = p.budgetByYear?.['2574'] || 0;
                    const b75 = p.budgetByYear?.['2575'] || 0;
                    const rowTotal5Y = b71 + b72 + b73 + b74 + b75;

                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-emerald-50/40 transition-colors border-b border-slate-100"
                      >
                        {/* ปี พ.ศ. */}
                        <td className="py-2.5 px-2.5 text-center font-mono text-slate-700">
                          {p.year || '2571'}
                        </td>

                        {/* ประเภท */}
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          {renderEditionBadge(p.edition)}
                        </td>

                        {/* ที่ */}
                        <td className="py-2.5 px-2 text-center text-slate-500 font-mono">
                          {idx + 1}
                        </td>

                        {/* ประเด็นการพัฒนา */}
                        <td className="py-2.5 px-3 text-slate-700 leading-relaxed text-[11px]">
                          {p.planStrategy}
                        </td>

                        {/* แผนงาน */}
                        <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap text-[11px]">
                          {p.planCategory}
                        </td>

                        {/* ชื่อโครงการ */}
                        <td className="py-2.5 px-3">
                          <button
                            type="button"
                            onClick={() => onOpenProjectDetail(p)}
                            className="font-bold text-[#055740] hover:text-[#033627] hover:underline text-left cursor-pointer transition-colors block"
                          >
                            <span>{p.name}</span>
                          </button>
                        </td>

                        {/* วัตถุประสงค์ */}
                        <td className="py-2.5 px-3 text-slate-600 text-[11px] leading-relaxed">
                          {p.objective || '-'}
                        </td>

                        {/* เป้าหมาย (ผลผลิตของโครงการ) */}
                        <td className="py-2.5 px-3 text-slate-600 text-[11px] leading-relaxed">
                          {p.target || '-'}
                        </td>

                        {/* งบ 2571 */}
                        <td className="py-2.5 px-2.5 text-right font-mono font-medium text-slate-800">
                          {b71 > 0 ? b71.toLocaleString() : '-'}
                        </td>

                        {/* งบ 2572 */}
                        <td className="py-2.5 px-2.5 text-right font-mono font-medium text-slate-800">
                          {b72 > 0 ? b72.toLocaleString() : '-'}
                        </td>

                        {/* งบ 2573 */}
                        <td className="py-2.5 px-2.5 text-right font-mono font-medium text-slate-800">
                          {b73 > 0 ? b73.toLocaleString() : '-'}
                        </td>

                        {/* งบ 2574 */}
                        <td className="py-2.5 px-2.5 text-right font-mono font-medium text-slate-800">
                          {b74 > 0 ? b74.toLocaleString() : '-'}
                        </td>

                        {/* งบ 2575 */}
                        <td className="py-2.5 px-2.5 text-right font-mono font-medium text-slate-800">
                          {b75 > 0 ? b75.toLocaleString() : '-'}
                        </td>

                        {/* รวม 5 ปี */}
                        <td className="py-2.5 px-2.5 text-right font-mono font-bold text-[#055740] bg-emerald-50/60">
                          {rowTotal5Y > 0 ? rowTotal5Y.toLocaleString() : '-'}
                        </td>

                        {/* หน่วยงาน */}
                        <td className="py-2.5 px-3 text-center whitespace-nowrap text-slate-700 text-[11px]">
                          {p.department}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* Table Footer Summary */}
              {filteredProjects.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300 text-xs">
                    <td colSpan={8} className="py-3 px-4 text-right">
                      รวมงบประมาณทั้งสิ้น ({filteredProjects.length} โครงการ):
                    </td>
                    <td className="py-3 px-2.5 text-right font-mono text-emerald-800">
                      {totalB2571 > 0 ? totalB2571.toLocaleString() : '-'}
                    </td>
                    <td className="py-3 px-2.5 text-right font-mono text-emerald-800">
                      {totalB2572 > 0 ? totalB2572.toLocaleString() : '-'}
                    </td>
                    <td className="py-3 px-2.5 text-right font-mono text-emerald-800">
                      {totalB2573 > 0 ? totalB2573.toLocaleString() : '-'}
                    </td>
                    <td className="py-3 px-2.5 text-right font-mono text-emerald-800">
                      {totalB2574 > 0 ? totalB2574.toLocaleString() : '-'}
                    </td>
                    <td className="py-3 px-2.5 text-right font-mono text-emerald-800">
                      {totalB2575 > 0 ? totalB2575.toLocaleString() : '-'}
                    </td>
                    <td className="py-3 px-2.5 text-right font-mono text-[#055740] bg-emerald-100/70">
                      {grandTotal5Y.toLocaleString()}
                    </td>
                    <td className="py-3 px-3"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
