import React, { useState, useMemo } from 'react';
import {
  Printer,
  FileSpreadsheet,
  Download,
  Search,
  RotateCcw,
  Eye,
  CheckCircle2,
  Clock,
  MapPin,
  Building2,
  Coins,
  ChevronDown,
  Layers,
  FileText
} from 'lucide-react';
import { ProjectData, UserAccount, ProjectExecutionStatus } from '../types';
import { SILA_ZONES, ALL_VILLAGES, ZoneInfo, VillageInfo } from '../utils/constants';
import {
  getProjectVillageInfo,
  isProjectInVillage,
  isProjectInZone,
  isProjectBudgetAllocated,
  toggleProjectBudgetAllocation,
  EXECUTION_STATUS_CONFIG,
  getExecutionStatus,
  canUserUpdateExecutionStatus,
  updateProjectExecutionStatus
} from '../utils/villageUtils';
import { matchesProjectSearch } from '../utils/projectCode';

interface VillagePlanReportViewProps {
  projects: ProjectData[];
  onOpenProjectDetail?: (project: ProjectData) => void;
  onUpdateProject?: (project: ProjectData) => void;
  currentUser?: UserAccount | null;
  onSwitchToInteractive?: () => void;
}

export const VillagePlanReportView: React.FC<VillagePlanReportViewProps> = ({
  projects,
  onOpenProjectDetail,
  onUpdateProject,
  currentUser,
  onSwitchToInteractive
}) => {
  // Filter States
  const [selectedZoneId, setSelectedZoneId] = useState<string>('all');
  const [selectedVillageNum, setSelectedVillageNum] = useState<number | 'all'>('all');
  const [budgetStatusFilter, setBudgetStatusFilter] = useState<
    'all' | 'unbudgeted' | 'budgeted' | 'in_progress' | 'completed' | 'cancelled'
  >('all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState<boolean>(false);

  // Active Zone & Village Objects
  const activeZone = useMemo(() => {
    if (selectedZoneId === 'all') return null;
    return SILA_ZONES.find((z) => z.id === selectedZoneId) || null;
  }, [selectedZoneId]);

  const activeVillage = useMemo(() => {
    if (selectedVillageNum === 'all') return null;
    return ALL_VILLAGES.find((v) => v.villageNumber === selectedVillageNum) || null;
  }, [selectedVillageNum]);

  // Handle Zone selection change
  const handleZoneChange = (zoneId: string) => {
    setSelectedZoneId(zoneId);
    if (zoneId === 'all') {
      setSelectedVillageNum('all');
    } else {
      const z = SILA_ZONES.find((item) => item.id === zoneId);
      // If current village not in new zone, reset to 'all'
      if (selectedVillageNum !== 'all' && z) {
        const inZone = z.villages.some((v) => v.villageNumber === selectedVillageNum);
        if (!inZone) setSelectedVillageNum('all');
      }
    }
  };

  // Pre-filter projects based on Zone, Village, Budget Allocation Status, Execution Status, and Search Keyword
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      // 1. Zone filter
      if (activeZone) {
        if (!isProjectInZone(p, activeZone)) return false;
      }

      // 2. Village filter
      if (activeVillage) {
        if (!isProjectInVillage(p, activeVillage)) return false;
      }

      // 3. Budget Allocation & Execution Status filter (Requirement 4)
      const isAllocated = isProjectBudgetAllocated(p);
      const execStatus = getExecutionStatus(p);

      if (budgetStatusFilter === 'budgeted' && !isAllocated) return false;
      if (budgetStatusFilter === 'unbudgeted' && isAllocated) return false;
      if (budgetStatusFilter === 'in_progress' && (!isAllocated || execStatus !== 'in_progress')) return false;
      if (budgetStatusFilter === 'completed' && (!isAllocated || execStatus !== 'completed')) return false;
      if (budgetStatusFilter === 'cancelled' && (!isAllocated || execStatus !== 'cancelled')) return false;

      // 4. Keyword search
      if (searchKeyword.trim()) {
        if (!matchesProjectSearch(searchKeyword, p)) {
          const vInfo = getProjectVillageInfo(p);
          const vName = vInfo ? vInfo.villageName.toLowerCase() : '';
          const term = searchKeyword.toLowerCase().trim();
          if (!vName.includes(term)) return false;
        }
      }

      return true;
    });
  }, [projects, activeZone, activeVillage, budgetStatusFilter, searchKeyword]);

  // Statistics for the current filter scope
  const stats = useMemo(() => {
    let totalProjects = 0;
    let budgetedCount = 0;
    let unbudgetedCount = 0;
    let completedCount = 0;
    let inProgressCount = 0;
    let cancelledCount = 0;

    let b71 = 0;
    let b72 = 0;
    let b73 = 0;
    let b74 = 0;
    let b75 = 0;

    filteredProjects.forEach((p) => {
      totalProjects++;
      if (isProjectBudgetAllocated(p)) {
        budgetedCount++;
        const execSt = getExecutionStatus(p);
        if (execSt === 'completed') completedCount++;
        else if (execSt === 'in_progress') inProgressCount++;
        else if (execSt === 'cancelled') cancelledCount++;
      } else {
        unbudgetedCount++;
      }

      b71 += p.budgetByYear?.['2571'] || 0;
      b72 += p.budgetByYear?.['2572'] || 0;
      b73 += p.budgetByYear?.['2573'] || 0;
      b74 += p.budgetByYear?.['2574'] || 0;
      b75 += p.budgetByYear?.['2575'] || 0;
    });

    const total5Years = b71 + b72 + b73 + b74 + b75;
    const completionRate = budgetedCount > 0 ? Math.round((completedCount / budgetedCount) * 100) : 0;

    return {
      totalProjects,
      budgetedCount,
      unbudgetedCount,
      completedCount,
      inProgressCount,
      cancelledCount,
      completionRate,
      b71,
      b72,
      b73,
      b74,
      b75,
      total5Years
    };
  }, [filteredProjects]);

  // Can user update status? Staff, executive, or admin (not read-only public)
  const canUpdateStatus = Boolean(currentUser && currentUser.role !== 'public' && onUpdateProject);

  const handleToggleBudgetAllocation = (e: React.MouseEvent, p: ProjectData) => {
    e.stopPropagation();
    if (!canUpdateStatus || !onUpdateProject) return;
    const updated = toggleProjectBudgetAllocation(p);
    onUpdateProject(updated);
  };

  // Export to CSV (Includes Budget and Execution Status)
  const handleExportCSV = () => {
    setIsExportDropdownOpen(false);
    const headers = [
      'ลำดับที่',
      'เขตการปกครอง',
      'หมู่บ้าน',
      'โครงการ',
      'วัตถุประสงค์',
      'เป้าหมาย(ผลผลิตของโครงการ)',
      'งบประมาณ_2571(บาท)',
      'งบประมาณ_2572(บาท)',
      'งบประมาณ_2573(บาท)',
      'งบประมาณ_2574(บาท)',
      'งบประมาณ_2575(บาท)',
      'รวม5ปี(บาท)',
      'หน่วยงานรับผิดชอบหลัก',
      'สถานะการนำไปตั้งงบประมาณ',
      'สถานะการดำเนินงานจริง',
      'บันทึกความก้าวหน้า'
    ];

    const rows = filteredProjects.map((p, idx) => {
      const vInfo = getProjectVillageInfo(p);
      const isAllocated = isProjectBudgetAllocated(p);
      const execSt = getExecutionStatus(p);
      const conf = EXECUTION_STATUS_CONFIG[execSt];
      const b1 = p.budgetByYear?.['2571'] || 0;
      const b2 = p.budgetByYear?.['2572'] || 0;
      const b3 = p.budgetByYear?.['2573'] || 0;
      const b4 = p.budgetByYear?.['2574'] || 0;
      const b5 = p.budgetByYear?.['2575'] || 0;
      const total = b1 + b2 + b3 + b4 + b5;

      return [
        idx + 1,
        `"${vInfo?.zone || p.zone || 'เขต 1'}"`,
        `"${vInfo?.villageName || p.village || ''}"`,
        `"${(p.name || '').replace(/"/g, '""')}"`,
        `"${(p.objective || '').replace(/"/g, '""')}"`,
        `"${(p.target || '').replace(/"/g, '""')}"`,
        b1,
        b2,
        b3,
        b4,
        b5,
        total,
        `"${p.department || ''}"`,
        `"${isAllocated ? 'ตั้งงบประมาณแล้ว' : 'อยู่ในแผน (ยังไม่ตั้งงบ)'}"`,
        `"${isAllocated ? conf.label : '-'}"`,
        `"${(p.executionProgressNote || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const vNamePart = activeVillage ? `_${activeVillage.shortName}` : activeZone ? `_${activeZone.name}` : '_ทั้ง3เขต';
    link.setAttribute('download', `รายงานแบบ_ผ02_รายหมู่บ้าน${vNamePart}_2571-2575.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export HTML table as Word .doc
  const handleExportWord = () => {
    setIsExportDropdownOpen(false);
    const content = document.getElementById('printable-village-plan-sheet')?.innerHTML;
    if (!content) return;

    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>แบบ ผ.02 รายงานแผนพัฒนารายหมู่บ้าน</title>
        <style>
          @page { size: landscape; margin: 1cm; }
          body { font-family: 'TH Sarabun PSK', 'TH Sarabun New', 'Angsana New', sans-serif; font-size: 14pt; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 20px; }
          th, td { border: 1px solid #000; padding: 6px; font-size: 11pt; vertical-align: top; }
          th { background-color: #f2f2f2; text-align: center; font-weight: bold; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .text-left { text-align: left; }
          .font-bold { font-weight: bold; }
          .form-badge { border: 2px solid #000; padding: 4px 8px; font-weight: bold; font-size: 12pt; display: inline-block; }
          .title { text-align: center; font-weight: bold; font-size: 16pt; }
          .subtitle { text-align: center; font-weight: bold; font-size: 14pt; }
        </style>
      </head>
      <body>
        ${content}
      </body>
      </html>
    `;

    const blob = new Blob(['\uFEFF' + html], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const vNamePart = activeVillage ? `_${activeVillage.shortName}` : activeZone ? `_${activeZone.name}` : '_ทั้ง3เขต';
    link.setAttribute('download', `แบบ_ผ02_รายหมู่บ้าน${vNamePart}_2571-2575.doc`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-100 h-full min-h-0 overflow-hidden">
      {/* 1. Top Controls & Filter Toolbar (Card 1 - Not printed) */}
      <div className="bg-white border-b border-slate-200 p-3 sm:p-4 shrink-0 shadow-2xs no-print print:hidden">
        <div className="max-w-7xl mx-auto space-y-3">
          {/* Header Row: Title & Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-700 flex items-center justify-center text-white shadow-xs shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>รายงานแผนพัฒนารายหมู่บ้าน (แบบ ผ.02 รายหมู่บ้าน)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                    แบบ ผ.02 ทางการ
                  </span>
                </h1>
                <p className="text-xs text-slate-500">
                  ตารางรายงานมาตรฐาน 10 คอลัมน์ (พ.ศ. 2571-2575) พร้อมสถานะการจัดทำเทศบัญญัติงบประมาณรายจ่าย
                </p>
              </div>
            </div>

            {/* Print & Export Toolbar */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              {onSwitchToInteractive && (
                <button
                  id="btn-switch-to-interactive-dashboard"
                  type="button"
                  onClick={onSwitchToInteractive}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-slate-300 shadow-2xs"
                  title="สลับไปหน้าแดชบอร์ดโครงสร้าง 3 ระดับ (เขต/หมู่บ้าน)"
                >
                  <Layers className="w-4 h-4 text-emerald-700" />
                  <span className="hidden sm:inline">สลับไปหน้า</span>แดชบอร์ด 3 ระดับ
                </button>
              )}

              <button
                id="btn-print-village-report"
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                title="พิมพ์รายงาน หรือพิมพ์เป็น PDF (A4 แนวนอน)"
              >
                <Printer className="w-4 h-4" />
                <span>พิมพ์รายงาน (A4 แนวนอน)</span>
              </button>

              {/* Export Dropdown */}
              <div className="relative">
                <button
                  id="btn-export-village-report-dropdown"
                  type="button"
                  onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4 text-slate-500" />
                  <span>ส่งออกข้อมูล</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {isExportDropdownOpen && (
                  <div className="absolute right-0 mt-1 w-52 bg-white border border-slate-200 rounded-xl shadow-lg z-30 py-1.5 text-xs text-slate-700 divide-y divide-slate-100">
                    <button
                      type="button"
                      onClick={handleExportCSV}
                      className="w-full text-left px-3.5 py-2 hover:bg-emerald-50 hover:text-emerald-800 flex items-center gap-2 cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <div>
                        <div className="font-semibold">ส่งออก Excel / CSV</div>
                        <div className="text-[10px] text-slate-500">ตาราง 10 คอลัมน์รองรับภาษาไทย</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={handleExportWord}
                      className="w-full text-left px-3.5 py-2 hover:bg-blue-50 hover:text-blue-800 flex items-center gap-2 cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-blue-600" />
                      <div>
                        <div className="font-semibold">ส่งออก Word (.doc)</div>
                        <div className="text-[10px] text-slate-500">เอกสารรายงานแบบ ผ.02 แนวนอน</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Filter Row 1: Zone & Village Selection with optgroup */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 pt-1 border-t border-slate-100">
            {/* Zone Filter */}
            <div className="md:col-span-4 flex items-center gap-1.5">
              <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">เขตการปกครอง:</label>
              <select
                id="select-report-zone"
                value={selectedZoneId}
                onChange={(e) => handleZoneChange(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="all">ทุกเขต (ครอบคลุมทั้ง 3 เขต)</option>
                {SILA_ZONES.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.fullName}
                  </option>
                ))}
              </select>
            </div>

            {/* Village Filter with <optgroup label="เขต X"> */}
            <div className="md:col-span-5 flex items-center gap-1.5">
              <label className="text-xs font-semibold text-slate-600 whitespace-nowrap flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>หมู่บ้าน:</span>
              </label>
              <select
                id="select-report-village"
                value={selectedVillageNum}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'all') {
                    setSelectedVillageNum('all');
                  } else {
                    const vNumber = Number(val);
                    setSelectedVillageNum(vNumber);
                    const vObj = ALL_VILLAGES.find((v) => v.villageNumber === vNumber);
                    if (vObj) {
                      const zObj = SILA_ZONES.find((z) => z.name === vObj.zone);
                      if (zObj && selectedZoneId !== 'all' && selectedZoneId !== zObj.id) {
                        setSelectedZoneId(zObj.id);
                      }
                    }
                  }
                }}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="all">
                  {selectedZoneId === 'all'
                    ? '-- ทุกหมู่บ้าน (ทั้ง 28 หมู่บ้าน) --'
                    : `-- ทุกหมู่บ้านใน ${activeZone?.name || 'เขตนี้'} --`}
                </option>
                {SILA_ZONES.filter((z) => selectedZoneId === 'all' || z.id === selectedZoneId).map((zone) => (
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

            {/* Keyword Search */}
            <div className="md:col-span-3 relative">
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="ค้นหาชื่อโครงการ/หน่วยงาน..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              {searchKeyword && (
                <button
                  type="button"
                  onClick={() => setSearchKeyword('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Filter Row 2: Budget Allocation & Execution Status Control (Requirement 4) */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-amber-600" />
                <span>สถานะดำเนินงาน:</span>
              </span>
              <div className="inline-flex flex-wrap rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-xs font-medium">
                <button
                  type="button"
                  id="filter-budget-all"
                  onClick={() => setBudgetStatusFilter('all')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    budgetStatusFilter === 'all'
                      ? 'bg-white text-slate-900 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ทั้งหมด ({stats.totalProjects})
                </button>
                <button
                  type="button"
                  id="filter-budget-unbudgeted"
                  onClick={() => setBudgetStatusFilter('unbudgeted')}
                  className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                    budgetStatusFilter === 'unbudgeted'
                      ? 'bg-amber-500 text-white font-bold shadow-xs'
                      : 'text-amber-700 hover:text-amber-900'
                  }`}
                >
                  <span>🟡 ยังไม่ตั้งงบ ({stats.unbudgetedCount})</span>
                </button>
                <button
                  type="button"
                  id="filter-budget-budgeted"
                  onClick={() => setBudgetStatusFilter('budgeted')}
                  className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                    budgetStatusFilter === 'budgeted'
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : 'text-blue-700 hover:text-blue-900'
                  }`}
                >
                  <span>🔵 ตั้งงบแล้ว ({stats.budgetedCount})</span>
                </button>
                <button
                  type="button"
                  id="filter-budget-inprogress"
                  onClick={() => setBudgetStatusFilter('in_progress')}
                  className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                    budgetStatusFilter === 'in_progress'
                      ? 'bg-sky-600 text-white font-bold shadow-xs'
                      : 'text-sky-700 hover:text-sky-900'
                  }`}
                >
                  <span>⏳ กำลังทำ ({stats.inProgressCount})</span>
                </button>
                <button
                  type="button"
                  id="filter-budget-completed"
                  onClick={() => setBudgetStatusFilter('completed')}
                  className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                    budgetStatusFilter === 'completed'
                      ? 'bg-emerald-700 text-white font-bold shadow-xs'
                      : 'text-emerald-800 hover:text-emerald-950'
                  }`}
                >
                  <span>✅ เสร็จสิ้น ({stats.completedCount})</span>
                </button>
                <button
                  type="button"
                  id="filter-budget-cancelled"
                  onClick={() => setBudgetStatusFilter('cancelled')}
                  className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                    budgetStatusFilter === 'cancelled'
                      ? 'bg-rose-600 text-white font-bold shadow-xs'
                      : 'text-rose-700 hover:text-rose-900'
                  }`}
                >
                  <span>🔴 โอนลด ({stats.cancelledCount})</span>
                </button>
              </div>

              {stats.budgetedCount > 0 && (
                <div className="hidden xl:flex items-center gap-2 text-[11px] text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                  <span>ความก้าวหน้าโครงการที่ตั้งงบ:</span>
                  <span className="font-bold text-emerald-700 font-mono">{stats.completionRate}%</span>
                </div>
              )}
            </div>

            {/* Quick Reset */}
            {(selectedZoneId !== 'all' || selectedVillageNum !== 'all' || budgetStatusFilter !== 'all' || searchKeyword) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedZoneId('all');
                  setSelectedVillageNum('all');
                  setBudgetStatusFilter('all');
                  setSearchKeyword('');
                }}
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>รีเซ็ตตัวกรองทั้งหมด</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Official Printable Report Paper Container */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-6 flex justify-center">
        <div
          id="printable-village-plan-sheet"
          className="bg-white w-full max-w-[1240px] shadow-sm border border-slate-300 rounded-none sm:rounded-lg p-4 sm:p-8 flex flex-col print:border-none print:shadow-none print:p-0 print:m-0"
        >
          {/* Top Right: Official Form Code Box */}
          <div className="flex justify-end items-start mb-2">
            <div className="border-2 border-black px-3.5 py-1 font-bold text-sm tracking-wider text-black select-none bg-white">
              แบบ ผ.02
            </div>
          </div>

          {/* Centered Official Header */}
          <div className="text-center space-y-1 mb-5">
            <h1 className="text-lg sm:text-xl font-bold text-black tracking-normal">
              แบบ ผ.02 รายละเอียดโครงการพัฒนา (แผนพัฒนารายหมู่บ้าน)
            </h1>
            <h2 className="text-sm sm:text-base font-bold text-black">
              เทศบาลเมืองศิลา อำเภอเมืองขอนแก่น จังหวัดขอนแก่น
            </h2>
            <h3 className="text-xs sm:text-sm font-semibold text-slate-800">
              แผนพัฒนาท้องถิ่น (พ.ศ. 2571 - 2575)
            </h3>
            <div className="text-xs text-slate-600 font-medium pt-1">
              {activeVillage ? (
                <span className="font-bold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  พื้นที่ดำเนินการ: {activeVillage.villageName} ({activeVillage.zone})
                </span>
              ) : activeZone ? (
                <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  พื้นที่ดำเนินการ: {activeZone.fullName} (ครอบคลุม {activeZone.villages.length} หมู่บ้าน)
                </span>
              ) : (
                <span className="text-slate-700">
                  พื้นที่ดำเนินการ: ครอบคลุม 3 เขตการปกครอง (28 หมู่บ้านในเขตเทศบาลเมืองศิลา)
                </span>
              )}
              {budgetStatusFilter === 'budgeted' && (
                <span className="ml-2 font-semibold text-blue-700">
                  [ เฉพาะโครงการที่ตั้งงบประมาณแล้ว ]
                </span>
              )}
              {budgetStatusFilter === 'unbudgeted' && (
                <span className="ml-2 font-semibold text-amber-700">
                  [ เฉพาะโครงการที่อยู่ในแผน ยังไม่ตั้งงบประมาณ ]
                </span>
              )}
              {budgetStatusFilter === 'in_progress' && (
                <span className="ml-2 font-semibold text-sky-700">
                  [ เฉพาะโครงการที่อยู่ระหว่างดำเนินการ (⏳) ]
                </span>
              )}
              {budgetStatusFilter === 'completed' && (
                <span className="ml-2 font-semibold text-emerald-700">
                  [ เฉพาะโครงการที่ดำเนินการแล้วเสร็จ (✅) ]
                </span>
              )}
              {budgetStatusFilter === 'cancelled' && (
                <span className="ml-2 font-semibold text-rose-700">
                  [ เฉพาะโครงการที่ไม่ได้ดำเนินการ/โอนลด (🔴) ]
                </span>
              )}
            </div>
          </div>

          {/* Standard 10-Column Table */}
          {filteredProjects.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-slate-300 rounded-lg text-slate-500">
              <FileSpreadsheet className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <div className="text-sm font-semibold text-slate-700">ไม่พบรายการโครงการตามเงื่อนไขตัวกรอง</div>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                ลองปรับเปลี่ยนเขตการปกครอง หมู่บ้าน หรือสถานะการตั้งงบประมาณเพื่อดูรายการโครงการ
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse border border-black text-xs text-black">
                <thead>
                  <tr className="bg-slate-100 text-black font-bold">
                    <th className="border border-black p-2 text-center w-10 shrink-0" rowSpan={2}>
                      ที่
                    </th>
                    <th className="border border-black p-2 w-[18%]" rowSpan={2}>
                      โครงการ / พื้นที่
                    </th>
                    <th className="border border-black p-2 w-[13%]" rowSpan={2}>
                      วัตถุประสงค์
                    </th>
                    <th className="border border-black p-2 w-[13%]" rowSpan={2}>
                      เป้าหมาย (ผลผลิตของโครงการ)
                    </th>
                    <th className="border border-black p-1 text-center" colSpan={5}>
                      งบประมาณและที่ผ่านมา (บาท)
                    </th>
                    <th className="border border-black p-2 text-center w-[12%]" rowSpan={2}>
                      หน่วยงานรับผิดชอบหลัก
                    </th>
                    <th className="border border-black p-2 text-center w-36 shrink-0 no-print print:hidden" rowSpan={2}>
                      สถานะการดำเนินงาน
                    </th>
                  </tr>
                  <tr className="bg-slate-50 text-black font-semibold text-center text-[11px]">
                    <th className="border border-black p-1 w-16">2571</th>
                    <th className="border border-black p-1 w-16">2572</th>
                    <th className="border border-black p-1 w-16">2573</th>
                    <th className="border border-black p-1 w-16">2574</th>
                    <th className="border border-black p-1 w-16">2575</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/20 text-black">
                  {filteredProjects.map((p, idx) => {
                    const vInfo = getProjectVillageInfo(p);
                    const isAllocated = isProjectBudgetAllocated(p);
                    const b71 = p.budgetByYear?.['2571'] || 0;
                    const b72 = p.budgetByYear?.['2572'] || 0;
                    const b73 = p.budgetByYear?.['2573'] || 0;
                    const b74 = p.budgetByYear?.['2574'] || 0;
                    const b75 = p.budgetByYear?.['2575'] || 0;

                    return (
                      <tr
                        key={p.id}
                        id={`report-row-${p.id}`}
                        onClick={() => onOpenProjectDetail && onOpenProjectDetail(p)}
                        className="hover:bg-emerald-50/50 cursor-pointer transition-colors"
                      >
                        {/* 1. ที่ */}
                        <td className="border border-black p-2 text-center font-mono align-top text-[11px]">
                          {idx + 1}
                        </td>

                        {/* 2. โครงการ / พื้นที่ */}
                        <td className="border border-black p-2 align-top">
                          <div className="font-bold text-black leading-snug">{p.name}</div>
                          <div className="text-[11px] text-slate-700 mt-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-emerald-700 shrink-0 inline" />
                            <span className="font-semibold text-emerald-950">
                              {vInfo?.villageName || p.village || 'เทศบาลเมืองศิลา'}
                            </span>
                            <span className="text-slate-500 font-normal">({vInfo?.zone || p.zone || 'เขต 1'})</span>
                          </div>
                          {p.planStrategy && (
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              ยุทธศาสตร์: {p.planStrategy}
                            </div>
                          )}
                        </td>

                        {/* 3. วัตถุประสงค์ */}
                        <td className="border border-black p-2 align-top text-slate-800 leading-relaxed text-[11px]">
                          {p.objective || '-'}
                        </td>

                        {/* 4. เป้าหมาย (ผลผลิตของโครงการ) */}
                        <td className="border border-black p-2 align-top text-slate-800 leading-relaxed text-[11px]">
                          {p.target || '-'}
                        </td>

                        {/* 5-9. งบประมาณ 2571 - 2575 */}
                        <td className="border border-black p-2 text-right font-mono align-top text-[11px]">
                          {b71 > 0 ? b71.toLocaleString() : '-'}
                        </td>
                        <td className="border border-black p-2 text-right font-mono align-top text-[11px]">
                          {b72 > 0 ? b72.toLocaleString() : '-'}
                        </td>
                        <td className="border border-black p-2 text-right font-mono align-top text-[11px]">
                          {b73 > 0 ? b73.toLocaleString() : '-'}
                        </td>
                        <td className="border border-black p-2 text-right font-mono align-top text-[11px]">
                          {b74 > 0 ? b74.toLocaleString() : '-'}
                        </td>
                        <td className="border border-black p-2 text-right font-mono align-top text-[11px]">
                          {b75 > 0 ? b75.toLocaleString() : '-'}
                        </td>

                        {/* 10. หน่วยงานรับผิดชอบหลัก */}
                        <td className="border border-black p-2 text-center align-top text-[11px] font-medium">
                          {p.department || '-'}
                          {/* Print-only badge for budget allocation & execution status */}
                          <div className="hidden print:block text-[9px] mt-1 font-bold">
                            {isAllocated ? (
                              <div className="text-slate-900">
                                <div>[ตั้งงบประมาณแล้ว]</div>
                                <div className="text-[8.5px] text-slate-700">
                                  สถานะ: {EXECUTION_STATUS_CONFIG[getExecutionStatus(p)].label}
                                </div>
                              </div>
                            ) : (
                              <div className="text-slate-600">[อยู่ในแผน ยังไม่ตั้งงบ]</div>
                            )}
                          </div>
                        </td>

                        {/* Interactive Budget Allocation & Execution Status (Screen Only) */}
                        <td className="border border-black p-2 text-center align-middle no-print print:hidden">
                          {isAllocated ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 justify-center flex-wrap">
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                  ตั้งงบแล้ว
                                </span>
                                {(() => {
                                  const execSt = getExecutionStatus(p);
                                  const conf = EXECUTION_STATUS_CONFIG[execSt];
                                  return (
                                    <span
                                      className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${conf.bgClass} ${conf.textClass} ${conf.borderClass}`}
                                      title={conf.description}
                                    >
                                      <span>{conf.icon}</span>
                                      <span>{conf.shortLabel}</span>
                                    </span>
                                  );
                                })()}
                              </div>

                              {p.executionProgressNote && (
                                <div
                                  className="text-[10px] text-slate-500 truncate max-w-[130px] mx-auto"
                                  title={p.executionProgressNote}
                                >
                                  "{p.executionProgressNote}"
                                </div>
                              )}

                              {canUserUpdateExecutionStatus(currentUser, p) && (
                                <div className="flex items-center justify-center gap-1 pt-0.5">
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
                                    className="text-[10px] bg-white border border-slate-300 rounded px-1 py-0.5 text-slate-700 font-medium focus:ring-1 focus:ring-emerald-500 cursor-pointer shadow-2xs"
                                    title="อัปเดตสถานะงานจริง"
                                  >
                                    <option value="in_progress">⏳ ดำเนินการ</option>
                                    <option value="completed">✅ แล้วเสร็จ</option>
                                    <option value="cancelled">🔴 โอนลด</option>
                                  </select>
                                  <button
                                    type="button"
                                    onClick={(e) => handleToggleBudgetAllocation(e, p)}
                                    className="text-[10px] text-slate-400 hover:text-amber-700 underline cursor-pointer"
                                    title="สลับกลับเป็นยังไม่ตั้งงบ"
                                  >
                                    คืนสถานะ
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                <span>อยู่ในแผน (ยังไม่ตั้งงบ)</span>
                              </span>
                              {canUpdateStatus && (
                                <div>
                                  <button
                                    type="button"
                                    onClick={(e) => handleToggleBudgetAllocation(e, p)}
                                    className="text-[10px] text-emerald-700 hover:text-emerald-900 font-semibold underline cursor-pointer"
                                    title="คลิกเพื่อนำไปตั้งงบประมาณ"
                                  >
                                    + นำไปตั้งงบ
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Summary Total Row */}
                  <tr className="bg-slate-100 font-bold text-black border-t-2 border-black">
                    <td className="border border-black p-2 text-center" colSpan={4}>
                      รวมทั้งสิ้น ({stats.totalProjects} โครงการ)
                    </td>
                    <td className="border border-black p-2 text-right font-mono">
                      {stats.b71 > 0 ? stats.b71.toLocaleString() : '-'}
                    </td>
                    <td className="border border-black p-2 text-right font-mono">
                      {stats.b72 > 0 ? stats.b72.toLocaleString() : '-'}
                    </td>
                    <td className="border border-black p-2 text-right font-mono">
                      {stats.b73 > 0 ? stats.b73.toLocaleString() : '-'}
                    </td>
                    <td className="border border-black p-2 text-right font-mono">
                      {stats.b74 > 0 ? stats.b74.toLocaleString() : '-'}
                    </td>
                    <td className="border border-black p-2 text-right font-mono">
                      {stats.b75 > 0 ? stats.b75.toLocaleString() : '-'}
                    </td>
                    <td className="border border-black p-2 text-center text-[11px]">
                      รวม 5 ปี: {stats.total5Years.toLocaleString()} บาท
                    </td>
                    <td className="border border-black p-2 text-center text-[10px] no-print print:hidden">
                      ตั้งงบ: {stats.budgetedCount} | ยังไม่ตั้ง: {stats.unbudgetedCount}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Official Signatures Section (Displayed for Print / Report export) */}
          <div className="mt-12 pt-6 grid grid-cols-2 gap-8 text-center text-xs text-black">
            <div className="space-y-6">
              <div>(ลงชื่อ) ................................................................ ผู้รายงาน</div>
              <div>( ................................................................ )</div>
              <div>ตำแหน่ง ................................................................</div>
            </div>
            <div className="space-y-6">
              <div>(ลงชื่อ) ................................................................ ผู้เห็นชอบ</div>
              <div>( ................................................................ )</div>
              <div>นายกเทศมนตรีเมืองศิลา</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
