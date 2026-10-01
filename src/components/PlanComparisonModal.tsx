import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Save,
  Building2,
  AlertTriangle,
  FileSpreadsheet,
  Search,
  RotateCcw,
  CheckCircle2,
  Filter,
  ArrowRight,
  ChevronRight,
  FolderOpen
} from 'lucide-react';
import { ProjectData, PlanEdition, UserAccount } from '../types';
import { DEVELOPMENT_STRATEGIES, DEPARTMENTS, PLAN_CATEGORIES } from '../utils/constants';
import { matchesProjectSearch } from '../utils/projectCode';

interface PlanComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateProject?: ProjectData | null;
  projects?: ProjectData[];
  edition: PlanEdition; // 'changed' or 'amended'
  onSave: (newProject: ProjectData) => void;
  readOnly?: boolean;
  currentUser?: UserAccount | null;
  isPublic?: boolean;
}

export const PlanComparisonModal: React.FC<PlanComparisonModalProps> = ({
  isOpen,
  onClose,
  candidateProject = null,
  projects = [],
  edition,
  onSave,
  readOnly = false,
  currentUser,
  isPublic = false
}) => {
  const isReadOnly = Boolean(
    readOnly ||
    isPublic ||
    currentUser?.role === 'public' ||
    currentUser?.role === 'executive'
  );

  const isChanged = edition === 'changed';
  const actionLabel = isChanged ? 'เปลี่ยนแปลง' : 'แก้ไข';

  // Active candidate project being modified
  const [activeCandidate, setActiveCandidate] = useState<ProjectData | null>(candidateProject);

  // Whether user is currently in the candidate search/selection view
  const [isSelectingCandidate, setIsSelectingCandidate] = useState<boolean>(!candidateProject);

  // Candidate search & filter states
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedSourceEdition, setSelectedSourceEdition] = useState<'all' | 'first' | 'additional'>('all');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedStrategy, setSelectedStrategy] = useState('');

  // Sync activeCandidate if candidateProject prop changes
  useEffect(() => {
    if (candidateProject) {
      setActiveCandidate(candidateProject);
      setIsSelectingCandidate(false);
    }
  }, [candidateProject]);

  // Candidate projects pool (must come from 'first' or 'additional')
  const candidateProjects = useMemo(() => {
    return projects.filter((p) => p.edition === 'first' || p.edition === 'additional');
  }, [projects]);

  // Filtered candidate list
  const filteredCandidates = useMemo(() => {
    return candidateProjects.filter((p) => {
      if (selectedSourceEdition !== 'all' && p.edition !== selectedSourceEdition) {
        return false;
      }
      if (selectedDepartment && p.department !== selectedDepartment) {
        return false;
      }
      if (selectedStrategy && p.planStrategy !== selectedStrategy) {
        return false;
      }
      if (searchKeyword.trim()) {
        if (!matchesProjectSearch(searchKeyword, p)) return false;
      }
      return true;
    });
  }, [candidateProjects, selectedSourceEdition, selectedDepartment, selectedStrategy, searchKeyword]);

  // Form states for the new/modified version
  const [name, setName] = useState(activeCandidate?.name || '');
  const [planStrategy, setPlanStrategy] = useState(activeCandidate?.planStrategy || DEVELOPMENT_STRATEGIES[0]);
  const [planCategory, setPlanCategory] = useState(activeCandidate?.planCategory || PLAN_CATEGORIES[0]);
  const [department, setDepartment] = useState(activeCandidate?.department || DEPARTMENTS[0]);
  const [objective, setObjective] = useState(activeCandidate?.objective || '');
  const [target, setTarget] = useState(activeCandidate?.target || '');
  const [expectedResults, setExpectedResults] = useState(activeCandidate?.expectedResults || '');
  const [reason, setReason] = useState(
    isChanged
      ? 'ปรับปรุงแบบรูปรายการและงบประมาณให้สอดคล้องกับสภาพพื้นที่จริง'
      : 'แก้ไขรายละเอียดสถานที่ตั้งและเป้าหมายให้ถูกต้องครบถ้วน'
  );

  // 5-Year budgets for new version
  const [b2571, setB2571] = useState<string>(activeCandidate?.budgetByYear?.['2571']?.toString() || '0');
  const [b2572, setB2572] = useState<string>(activeCandidate?.budgetByYear?.['2572']?.toString() || '0');
  const [b2573, setB2573] = useState<string>(activeCandidate?.budgetByYear?.['2573']?.toString() || '0');
  const [b2574, setB2574] = useState<string>(activeCandidate?.budgetByYear?.['2574']?.toString() || '0');
  const [b2575, setB2575] = useState<string>(activeCandidate?.budgetByYear?.['2575']?.toString() || '0');

  // Populate form fields when active candidate changes
  useEffect(() => {
    if (activeCandidate) {
      setName(activeCandidate.name || '');
      setPlanStrategy(activeCandidate.planStrategy || DEVELOPMENT_STRATEGIES[0]);
      setPlanCategory(activeCandidate.planCategory || PLAN_CATEGORIES[0]);
      setDepartment(activeCandidate.department || DEPARTMENTS[0]);
      setObjective(activeCandidate.objective || '');
      setTarget(activeCandidate.target || '');
      setExpectedResults(activeCandidate.expectedResults || '');
      setB2571(activeCandidate.budgetByYear?.['2571']?.toString() || '0');
      setB2572(activeCandidate.budgetByYear?.['2572']?.toString() || '0');
      setB2573(activeCandidate.budgetByYear?.['2573']?.toString() || '0');
      setB2574(activeCandidate.budgetByYear?.['2574']?.toString() || '0');
      setB2575(activeCandidate.budgetByYear?.['2575']?.toString() || '0');
      setReason(
        isChanged
          ? 'ปรับปรุงแบบรูปรายการและงบประมาณให้สอดคล้องกับสภาพพื้นที่จริง'
          : 'แก้ไขรายละเอียดสถานที่ตั้งและเป้าหมายให้ถูกต้องครบถ้วน'
      );
    }
  }, [activeCandidate, isChanged]);

  // Original budget sums
  const origSum = useMemo(() => {
    if (!activeCandidate) return { o71: 0, o72: 0, o73: 0, o74: 0, o75: 0, total: 0 };
    const o71 = activeCandidate.budgetByYear?.['2571'] || 0;
    const o72 = activeCandidate.budgetByYear?.['2572'] || 0;
    const o73 = activeCandidate.budgetByYear?.['2573'] || 0;
    const o74 = activeCandidate.budgetByYear?.['2574'] || 0;
    const o75 = activeCandidate.budgetByYear?.['2575'] || 0;
    const total = o71 + o72 + o73 + o74 + o75 || activeCandidate.budgetPlan || 0;
    return { o71, o72, o73, o74, o75, total };
  }, [activeCandidate]);

  // New budget sums & differences
  const newBudgetSum = useMemo(() => {
    const n71 = Number(b2571.replace(/,/g, '')) || 0;
    const n72 = Number(b2572.replace(/,/g, '')) || 0;
    const n73 = Number(b2573.replace(/,/g, '')) || 0;
    const n74 = Number(b2574.replace(/,/g, '')) || 0;
    const n75 = Number(b2575.replace(/,/g, '')) || 0;
    const total = n71 + n72 + n73 + n74 + n75;
    const diff = total - origSum.total;
    return { n71, n72, n73, n74, n75, total, diff };
  }, [b2571, b2572, b2573, b2574, b2575, origSum.total]);

  // Field change detection for Visual Highlights
  const isNameModified = Boolean(
    activeCandidate && name.trim() !== (activeCandidate.name || '').trim()
  );
  const isStrategyModified = Boolean(
    activeCandidate && planStrategy !== activeCandidate.planStrategy
  );
  const isCategoryModified = Boolean(
    activeCandidate && planCategory !== activeCandidate.planCategory
  );
  const isObjectiveModified = Boolean(
    activeCandidate && objective.trim() !== (activeCandidate.objective || '').trim()
  );
  const isTargetModified = Boolean(
    activeCandidate && target.trim() !== (activeCandidate.target || '').trim()
  );
  const isResultsModified = Boolean(
    activeCandidate && expectedResults.trim() !== (activeCandidate.expectedResults || '').trim()
  );
  const isDeptModified = Boolean(
    activeCandidate && department !== activeCandidate.department
  );
  const isB71Modified = Boolean(activeCandidate && newBudgetSum.n71 !== origSum.o71);
  const isB72Modified = Boolean(activeCandidate && newBudgetSum.n72 !== origSum.o72);
  const isB73Modified = Boolean(activeCandidate && newBudgetSum.n73 !== origSum.o73);
  const isB74Modified = Boolean(activeCandidate && newBudgetSum.n74 !== origSum.o74);
  const isB75Modified = Boolean(activeCandidate && newBudgetSum.n75 !== origSum.o75);

  const isBudgetModified =
    isB71Modified || isB72Modified || isB73Modified || isB74Modified || isB75Modified;

  // Count of modified fields
  const modifiedCount = [
    isNameModified,
    isStrategyModified,
    isCategoryModified,
    isObjectiveModified,
    isTargetModified,
    isResultsModified,
    isDeptModified,
    isBudgetModified
  ].filter(Boolean).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (!activeCandidate) return;
    if (!name.trim()) return;

    const suffix = isChanged ? 'ป' : 'ก';
    const newProject: ProjectData = {
      id: `PRJ-CHG-${Date.now()}`,
      orderNumber: Date.now(),
      code: `${activeCandidate.code.replace(/-[พปกร]$/, '')}-${suffix}`,
      name: name.trim(),
      planStrategy,
      planCategory,
      edition,
      editionNumber: 1,
      publishStatus: 'published_first',
      objective: objective.trim(),
      target: target.trim(),
      budgetByYear: {
        '2571': newBudgetSum.n71,
        '2572': newBudgetSum.n72,
        '2573': newBudgetSum.n73,
        '2574': newBudgetSum.n74,
        '2575': newBudgetSum.n75
      },
      expectedResults: expectedResults.trim(),
      budgetPlan: newBudgetSum.total,
      budgetSource: activeCandidate.budgetSource || '- ยังไม่ได้จัดสรร -',
      budgetApproved: activeCandidate.budgetApproved || 0,
      approvedDate: activeCandidate.approvedDate || '-',
      status: 'pending',
      department,
      year: activeCandidate.year || '2571',
      note: `ขออนุมัติ${actionLabel}จากโครงการเดิม (${activeCandidate.code})`,
      reason: reason.trim(),
      originalProjectId: activeCandidate.id,
      originalProjectName: activeCandidate.name,
      originalEdition: activeCandidate.edition,
      originalTarget: activeCandidate.target,
      originalObjective: activeCandidate.objective,
      originalBudgetPlan: origSum.total,
      originalBudgetByYear: activeCandidate.budgetByYear
    };

    onSave(newProject);
    onClose();
  };

  const sampleReasons = isChanged
    ? [
        'ปรับปรุงแบบรูปรายการและปริมาณงานตามสภาพพื้นที่จริง',
        'ปรับเพิ่มงบประมาณเนื่องจากราคากลางวัสดุก่อสร้างปรับตัวสูงขึ้น',
        'ขยายขนาดท่อระบายน้ำเพื่อรองรับปริมาณน้ำฝนและป้องกันน้ำท่วมขัง',
        'ปรับลดงบประมาณหลังสำรวจรายละเอียดหน้างานเพื่อความประหยัด'
      ]
    : [
        'แก้ไขรายละเอียดสถานที่ตั้งและพิกัดการดำเนินงานให้ชัดเจน',
        'แก้ไขกลุ่มเป้าหมายผู้เข้าร่วมโครงการให้ครอบคลุมทุกหมู่บ้าน',
        'แก้ไขระยะเวลาและแผนการดำเนินงานให้สอดคล้องกับระเบียบราชการ'
      ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-hidden">
      <div
        id="modal-plan-comparison-form"
        className="bg-white rounded-2xl shadow-2xl w-[96vw] lg:w-[95%] max-w-[1440px] overflow-hidden flex flex-col max-h-[94vh] border border-slate-200"
      >
        {/* Modal Header */}
        <div className="bg-[#055740] px-5 sm:px-6 py-3.5 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#034131] border border-emerald-600/50 flex items-center justify-center text-emerald-300 shadow-inner shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
                  แบบ ผ.02 บัญชีเปรียบเทียบโครงการ (ฉบับ{actionLabel})
                </h2>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-400/40 bg-emerald-800/60 text-emerald-200">
                  ฉบับ{actionLabel}
                </span>
                {isReadOnly && (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full border border-amber-400/40 bg-amber-500/20 text-amber-200">
                    โหมดอ่านอย่างเดียว
                  </span>
                )}
              </div>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                เปรียบเทียบข้อมูลสาระสำคัญระหว่างข้อมูลเดิม กับโครงการที่ขอ{actionLabel}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 sm:w-9 sm:h-9 bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg shadow-xs flex items-center justify-center cursor-pointer transition-colors p-0"
            title="ปิดหน้าต่าง"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5 stroke-[2.2]" />
          </button>
        </div>

        {/* 1-2 Line Microcopy & Guidance Banner (Requirement 3) */}
        <div className="bg-emerald-50/90 border-b border-emerald-100 px-5 sm:px-6 py-2.5 flex items-center justify-between text-xs sm:text-sm text-emerald-950 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-emerald-800">📌 ขั้นตอน:</span>
            <span className="font-semibold text-emerald-950 flex items-center gap-1.5 flex-wrap">
              <span className={`px-2 py-0.5 rounded text-xs transition-colors ${
                !activeCandidate || isSelectingCandidate
                  ? 'bg-emerald-700 text-white font-bold'
                  : 'bg-emerald-100 border border-emerald-300 text-emerald-900'
              }`}>
                1. เลือกโครงการที่ต้องการ{actionLabel}
              </span>
              <span>➔</span>
              <span className={`px-2 py-0.5 rounded text-xs transition-colors ${
                activeCandidate && !isSelectingCandidate
                  ? 'bg-emerald-700 text-white font-bold'
                  : 'bg-emerald-100 border border-emerald-300 text-emerald-900'
              }`}>
                2. ปรับเปลี่ยนรายละเอียด
              </span>
              <span>➔</span>
              <span className="px-2 py-0.5 rounded bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs">
                3. กดบันทึก
              </span>
            </span>
          </div>

          <div className="text-xs text-emerald-800 hidden sm:flex items-center gap-1.5 font-medium">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400 border border-amber-500"></span>
            <span>ช่องที่แก้ไขจะแสดงแถบไฮไลท์สีส้มทันที</span>
          </div>
        </div>

        {/* Candidate Selector Bar / Panel */}
        <div className="bg-slate-100/90 border-b border-slate-200 px-5 sm:px-6 py-2.5 shrink-0">
          {activeCandidate && !isSelectingCandidate ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold border border-emerald-300 shrink-0">
                  {activeCandidate.edition === 'first' ? 'ฉบับแรก' : 'ฉบับเพิ่มเติม'}
                </span>
                <span className="font-mono text-xs font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-slate-200 shrink-0">
                  {activeCandidate.code}
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-800 truncate" title={activeCandidate.name}>
                  {activeCandidate.name}
                </span>
                <span className="text-xs text-slate-500 hidden md:inline">
                  ({activeCandidate.department} • งบเดิม {origSum.total.toLocaleString()} บาท)
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsSelectingCandidate(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-lg shadow-2xs transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>เปลี่ยนโครงการ / เลือกโครงการอื่น</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3 py-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span className="text-xs sm:text-sm font-bold text-slate-800">
                    ค้นหาและเลือกโครงการต้นทางที่ต้องการ{actionLabel}:
                  </span>
                  <span className="text-xs text-slate-500">
                    (พบ {filteredCandidates.length} โครงการ)
                  </span>
                </div>

                {activeCandidate && (
                  <button
                    type="button"
                    onClick={() => setIsSelectingCandidate(false)}
                    className="text-xs font-medium text-slate-600 hover:text-slate-900 underline cursor-pointer self-start sm:self-auto"
                  >
                    กลับไปยังโครงการที่เลือกไว้ ({activeCandidate.code})
                  </button>
                )}
              </div>

              {/* Fast Search & Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-5 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder="พิมพ์ชื่อโครงการ หรือรหัสโครงการ..."
                    className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg pl-9 pr-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                  />
                  {searchKeyword && (
                    <button
                      type="button"
                      onClick={() => setSearchKeyword('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="sm:col-span-3">
                  <select
                    value={selectedSourceEdition}
                    onChange={(e) => setSelectedSourceEdition(e.target.value as any)}
                    className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg p-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                  >
                    <option value="all">ฉบับต้นทาง: ทั้งหมด</option>
                    <option value="first">เฉพาะฉบับแรก</option>
                    <option value="additional">เฉพาะฉบับเพิ่มเติม</option>
                  </select>
                </div>

                <div className="sm:col-span-4">
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg p-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                  >
                    <option value="">หน่วยงาน: ทั้งหมด</option>
                    {DEPARTMENTS.map((dept, idx) => (
                      <option key={idx} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Body: Single View */}
        <div className="flex-1 min-h-0 overflow-y-auto bg-slate-50 p-4 sm:p-6">
          {/* If user is actively searching/selecting candidate project */}
          {(!activeCandidate || isSelectingCandidate) ? (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-semibold text-slate-600">
                  คลิกเลือกโครงการเพื่อเริ่มทำการเปรียบเทียบและแก้ไขข้อมูล:
                </span>
                <span className="text-xs text-slate-500">
                  แสดง {filteredCandidates.length} จากทั้งหมด {candidateProjects.length} โครงการ
                </span>
              </div>

              {filteredCandidates.length === 0 ? (
                <div className="text-center py-12 bg-white border border-dashed border-slate-300 rounded-xl space-y-2">
                  <FolderOpen className="w-10 h-10 text-slate-400 mx-auto" />
                  <p className="text-sm font-semibold text-slate-700">ไม่พบโครงการที่ตรงกับคำค้นหา</p>
                  <p className="text-xs text-slate-500">ลองเปลี่ยนคำค้นหา หรือรีเซ็ตตัวกรอง</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchKeyword('');
                      setSelectedSourceEdition('all');
                      setSelectedDepartment('');
                      setSelectedStrategy('');
                    }}
                    className="mt-2 text-xs font-medium text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
                  >
                    ล้างตัวกรองทั้งหมด
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[58vh] overflow-y-auto pr-1">
                  {filteredCandidates.map((proj) => {
                    const budget = proj.budgetPlan || Object.values(proj.budgetByYear || {}).reduce((a, b) => a + (Number(b) || 0), 0);
                    const isCurrent = activeCandidate?.id === proj.id;

                    return (
                      <div
                        key={proj.id}
                        onClick={() => {
                          setActiveCandidate(proj);
                          setIsSelectingCandidate(false);
                        }}
                        className={`border rounded-xl p-3.5 bg-white transition-all cursor-pointer hover:border-emerald-500 hover:shadow-md flex flex-col justify-between group ${
                          isCurrent
                            ? 'border-emerald-600 ring-2 ring-emerald-500/20 bg-emerald-50/20'
                            : 'border-slate-200 shadow-2xs'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              {proj.code}
                            </span>
                            <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                              {proj.edition === 'first' ? 'ฉบับแรก' : 'ฉบับเพิ่มเติม'}
                            </span>
                          </div>

                          <h4 className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-emerald-800 transition-colors line-clamp-2 leading-snug">
                            {proj.name}
                          </h4>

                          <div className="text-[11px] text-slate-500 space-y-0.5 pt-1">
                            <div className="flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{proj.department}</span>
                            </div>
                            <div className="text-slate-600 font-medium">
                              งบประมาณรวม: <span className="font-mono font-bold text-slate-800">{budget.toLocaleString()}</span> บาท
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[11px] text-emerald-700 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                            <span>เลือกโครงการนี้เพื่อ{actionLabel}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                          {isCurrent && (
                            <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>เลือกอยู่</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Two-Column Comparison View (Before & After) */
            <form id="form-plan-comparison" onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Column 1: Original Project Data (Read-Only) - Requirement 2 */}
                <div className="bg-slate-100/80 border border-slate-300 rounded-xl p-4 sm:p-6 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-300/80 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                      <h3 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
                        <span>ข้อมูลเดิมในแผนพัฒนาท้องถิ่น</span>
                        <span className="text-[11px] font-semibold text-slate-500 bg-slate-200 px-2 py-0.5 rounded border border-slate-300">
                          อ่านอย่างเดียว (Read-Only)
                        </span>
                      </h3>
                    </div>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold border border-slate-300">
                      {activeCandidate.edition === 'first' ? 'ฉบับแรก' : 'ฉบับเพิ่มเติม'}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      ชื่อโครงการเดิม [เดิม]
                    </label>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs sm:text-sm text-slate-800 font-bold leading-relaxed">
                      {activeCandidate.name}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      ยุทธศาสตร์ / ประเด็นการพัฒนาเดิม [เดิม]
                    </label>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 sm:p-3 text-xs sm:text-sm text-slate-700">
                      {activeCandidate.planStrategy}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      หมวดแผนงานเดิม [เดิม]
                    </label>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 sm:p-3 text-xs sm:text-sm text-slate-700">
                      {activeCandidate.planCategory || '-'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      วัตถุประสงค์เดิม [เดิม]
                    </label>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 sm:p-3 text-xs sm:text-sm text-slate-700 leading-relaxed min-h-[64px]">
                      {activeCandidate.objective || '-'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      เป้าหมาย (ผลผลิต) เดิม [เดิม]
                    </label>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 sm:p-3 text-xs sm:text-sm text-slate-700 leading-relaxed min-h-[64px]">
                      {activeCandidate.target || '-'}
                    </div>
                  </div>

                  {/* Original 5-Year Budget Table */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                      งบประมาณเดิมรายปี (พ.ศ. 2571 - 2575) [เดิม]
                    </label>
                    <div className="grid grid-cols-5 gap-2 text-center bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <div>
                        <span className="block text-[11px] text-slate-500 mb-0.5">2571</span>
                        <span className="font-mono text-xs sm:text-sm font-bold text-slate-700">
                          {origSum.o71 > 0 ? origSum.o71.toLocaleString() : '-'}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[11px] text-slate-500 mb-0.5">2572</span>
                        <span className="font-mono text-xs sm:text-sm font-bold text-slate-700">
                          {origSum.o72 > 0 ? origSum.o72.toLocaleString() : '-'}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[11px] text-slate-500 mb-0.5">2573</span>
                        <span className="font-mono text-xs sm:text-sm font-bold text-slate-700">
                          {origSum.o73 > 0 ? origSum.o73.toLocaleString() : '-'}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[11px] text-slate-500 mb-0.5">2574</span>
                        <span className="font-mono text-xs sm:text-sm font-bold text-slate-700">
                          {origSum.o74 > 0 ? origSum.o74.toLocaleString() : '-'}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[11px] text-slate-500 mb-0.5">2575</span>
                        <span className="font-mono text-xs sm:text-sm font-bold text-slate-700">
                          {origSum.o75 > 0 ? origSum.o75.toLocaleString() : '-'}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 text-right text-xs sm:text-sm text-slate-600 font-semibold">
                      รวมงบประมาณเดิม 5 ปี:{' '}
                      <span className="font-mono text-slate-900 font-bold">
                        {origSum.total.toLocaleString()} บาท
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      ผลที่คาดว่าจะได้รับเดิม [เดิม]
                    </label>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 sm:p-3 text-xs sm:text-sm text-slate-700 leading-relaxed min-h-[64px]">
                      {activeCandidate.expectedResults || '-'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      หน่วยงานรับผิดชอบเดิม [เดิม]
                    </label>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 sm:p-3 text-xs sm:text-sm text-slate-700 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      <span>{activeCandidate.department}</span>
                    </div>
                  </div>
                </div>

                {/* Column 2: New / Requested Changes (Editable Form with Visual Highlights) - Requirement 2 */}
                <div className="bg-white border-2 border-emerald-600/60 rounded-xl p-4 sm:p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                      <h3 className="text-sm sm:text-base font-bold text-emerald-950">
                        ข้อมูลโครงการที่ขอ{actionLabel} (เสนออนุมัติใหม่)
                      </h3>
                    </div>
                    {modifiedCount > 0 ? (
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-300 flex items-center gap-1 animate-in fade-in shadow-2xs">
                        <span>✏️ มีการแก้ไข {modifiedCount} จุด</span>
                      </span>
                    ) : (
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                        ฉบับ{actionLabel}
                      </span>
                    )}
                  </div>

                  {/* 1. Project Name */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-800 flex items-center">
                        <span>ชื่อโครงการ (ใหม่)</span>
                        {!isReadOnly && <span className="text-red-500 ml-0.5">*</span>}
                        {isNameModified ? (
                          <span className="ml-2 text-[11px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.2 rounded shadow-2xs">
                            ✏️ มีการแก้ไข
                          </span>
                        ) : (
                          <span className="ml-2 text-[11px] text-slate-400 font-normal">[คงเดิม]</span>
                        )}
                      </label>
                    </div>
                    <textarea
                      rows={2}
                      required={!isReadOnly}
                      disabled={isReadOnly}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={`w-full text-xs sm:text-sm font-bold border rounded-lg p-2.5 sm:p-3 min-h-[58px] resize-y leading-relaxed outline-none transition-all ${
                        isReadOnly
                          ? 'bg-slate-100 text-slate-600 cursor-not-allowed border-slate-200'
                          : isNameModified
                          ? 'border-amber-400 bg-amber-50/40 ring-2 ring-amber-300/30 text-slate-900 focus:ring-amber-500'
                          : 'border-slate-300 text-slate-900 focus:ring-2 focus:ring-emerald-500 bg-white'
                      }`}
                    />
                  </div>

                  {/* 2. Strategy */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700 flex items-center">
                        <span>ยุทธศาสตร์ / ประเด็นการพัฒนา</span>
                        {isStrategyModified ? (
                          <span className="ml-2 text-[11px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.2 rounded shadow-2xs">
                            ✏️ มีการแก้ไข
                          </span>
                        ) : (
                          <span className="ml-2 text-[11px] text-slate-400 font-normal">[คงเดิม]</span>
                        )}
                      </label>
                    </div>
                    <select
                      value={planStrategy}
                      disabled={isReadOnly}
                      onChange={(e) => setPlanStrategy(e.target.value)}
                      title={planStrategy || '-- เลือกประเด็นการพัฒนา --'}
                      className={`w-full text-xs sm:text-sm border rounded-lg p-2.5 truncate outline-none transition-all ${
                        isReadOnly
                          ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200'
                          : isStrategyModified
                          ? 'border-amber-400 bg-amber-50/40 ring-2 ring-amber-300/30 text-slate-900 focus:ring-amber-500'
                          : 'border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500'
                      }`}
                    >
                      {DEVELOPMENT_STRATEGIES.map((s, idx) => (
                        <option key={idx} value={s} title={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 3. Plan Category */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700 flex items-center">
                        <span>หมวดแผนงาน</span>
                        {isCategoryModified ? (
                          <span className="ml-2 text-[11px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.2 rounded shadow-2xs">
                            ✏️ มีการแก้ไข
                          </span>
                        ) : (
                          <span className="ml-2 text-[11px] text-slate-400 font-normal">[คงเดิม]</span>
                        )}
                      </label>
                    </div>
                    <select
                      value={planCategory}
                      disabled={isReadOnly}
                      onChange={(e) => setPlanCategory(e.target.value)}
                      className={`w-full text-xs sm:text-sm border rounded-lg p-2.5 truncate outline-none transition-all ${
                        isReadOnly
                          ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200'
                          : isCategoryModified
                          ? 'border-amber-400 bg-amber-50/40 ring-2 ring-amber-300/30 text-slate-900 focus:ring-amber-500'
                          : 'border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500'
                      }`}
                    >
                      {PLAN_CATEGORIES.map((c, idx) => (
                        <option key={idx} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 4. Objective */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700 flex items-center">
                        <span>วัตถุประสงค์ (ใหม่)</span>
                        {isObjectiveModified ? (
                          <span className="ml-2 text-[11px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.2 rounded shadow-2xs">
                            ✏️ มีการแก้ไข
                          </span>
                        ) : (
                          <span className="ml-2 text-[11px] text-slate-400 font-normal">[คงเดิม]</span>
                        )}
                      </label>
                    </div>
                    <textarea
                      rows={3}
                      disabled={isReadOnly}
                      value={objective}
                      onChange={(e) => setObjective(e.target.value)}
                      className={`w-full text-xs sm:text-sm border rounded-lg p-2.5 sm:p-3 min-h-[76px] resize-y leading-relaxed outline-none transition-all ${
                        isReadOnly
                          ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200'
                          : isObjectiveModified
                          ? 'border-amber-400 bg-amber-50/40 ring-2 ring-amber-300/30 text-slate-900 focus:ring-amber-500'
                          : 'border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500'
                      }`}
                      placeholder="ระบุวัตถุประสงค์..."
                    />
                  </div>

                  {/* 5. Target */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700 flex items-center">
                        <span>เป้าหมาย (ผลผลิต) (ใหม่)</span>
                        {isTargetModified ? (
                          <span className="ml-2 text-[11px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.2 rounded shadow-2xs">
                            ✏️ มีการแก้ไข
                          </span>
                        ) : (
                          <span className="ml-2 text-[11px] text-slate-400 font-normal">[คงเดิม]</span>
                        )}
                      </label>
                    </div>
                    <textarea
                      rows={3}
                      disabled={isReadOnly}
                      value={target}
                      onChange={(e) => setTarget(e.target.value)}
                      className={`w-full text-xs sm:text-sm border rounded-lg p-2.5 sm:p-3 min-h-[76px] resize-y leading-relaxed outline-none transition-all ${
                        isReadOnly
                          ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200'
                          : isTargetModified
                          ? 'border-amber-400 bg-amber-50/40 ring-2 ring-amber-300/30 text-slate-900 focus:ring-amber-500'
                          : 'border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500'
                      }`}
                      placeholder="ระบุเป้าหมายผลผลิตใหม่..."
                    />
                  </div>

                  {/* 6. New 5-Year Budget Inputs (พ.ศ. 2571 - 2575) */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-700 flex items-center">
                        <span>งบประมาณใหม่แยกรายปี (บาท) พ.ศ. 2571 - 2575</span>
                        {isBudgetModified ? (
                          <span className="ml-2 text-[11px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.2 rounded shadow-2xs">
                            ✏️ มีการแก้ไขงบประมาณ
                          </span>
                        ) : (
                          <span className="ml-2 text-[11px] text-slate-400 font-normal">[คงเดิม]</span>
                        )}
                      </label>
                    </div>
                    <div className="grid grid-cols-5 gap-2 text-center bg-emerald-50/40 p-3 rounded-lg border border-emerald-200">
                      <div>
                        <span className="block text-[11px] text-emerald-900 font-semibold mb-1">
                          2571
                        </span>
                        <input
                          type="text"
                          disabled={isReadOnly}
                          value={b2571}
                          onChange={(e) => setB2571(e.target.value)}
                          className={`w-full text-center border rounded-lg px-1 py-2 text-xs sm:text-sm font-mono font-bold outline-none transition-all ${
                            isReadOnly
                              ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200'
                              : isB71Modified
                              ? 'border-amber-400 bg-amber-50 text-amber-950 ring-2 ring-amber-300/40'
                              : 'border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500'
                          }`}
                        />
                        {isB71Modified && (
                          <span className="block text-[10px] font-mono font-bold mt-1 text-amber-800">
                            {newBudgetSum.n71 > origSum.o71 ? `+${(newBudgetSum.n71 - origSum.o71).toLocaleString()}` : (newBudgetSum.n71 - origSum.o71).toLocaleString()}
                          </span>
                        )}
                      </div>

                      <div>
                        <span className="block text-[11px] text-emerald-900 font-semibold mb-1">
                          2572
                        </span>
                        <input
                          type="text"
                          disabled={isReadOnly}
                          value={b2572}
                          onChange={(e) => setB2572(e.target.value)}
                          className={`w-full text-center border rounded-lg px-1 py-2 text-xs sm:text-sm font-mono font-bold outline-none transition-all ${
                            isReadOnly
                              ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200'
                              : isB72Modified
                              ? 'border-amber-400 bg-amber-50 text-amber-950 ring-2 ring-amber-300/40'
                              : 'border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500'
                          }`}
                        />
                        {isB72Modified && (
                          <span className="block text-[10px] font-mono font-bold mt-1 text-amber-800">
                            {newBudgetSum.n72 > origSum.o72 ? `+${(newBudgetSum.n72 - origSum.o72).toLocaleString()}` : (newBudgetSum.n72 - origSum.o72).toLocaleString()}
                          </span>
                        )}
                      </div>

                      <div>
                        <span className="block text-[11px] text-emerald-900 font-semibold mb-1">
                          2573
                        </span>
                        <input
                          type="text"
                          disabled={isReadOnly}
                          value={b2573}
                          onChange={(e) => setB2573(e.target.value)}
                          className={`w-full text-center border rounded-lg px-1 py-2 text-xs sm:text-sm font-mono font-bold outline-none transition-all ${
                            isReadOnly
                              ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200'
                              : isB73Modified
                              ? 'border-amber-400 bg-amber-50 text-amber-950 ring-2 ring-amber-300/40'
                              : 'border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500'
                          }`}
                        />
                        {isB73Modified && (
                          <span className="block text-[10px] font-mono font-bold mt-1 text-amber-800">
                            {newBudgetSum.n73 > origSum.o73 ? `+${(newBudgetSum.n73 - origSum.o73).toLocaleString()}` : (newBudgetSum.n73 - origSum.o73).toLocaleString()}
                          </span>
                        )}
                      </div>

                      <div>
                        <span className="block text-[11px] text-emerald-900 font-semibold mb-1">
                          2574
                        </span>
                        <input
                          type="text"
                          disabled={isReadOnly}
                          value={b2574}
                          onChange={(e) => setB2574(e.target.value)}
                          className={`w-full text-center border rounded-lg px-1 py-2 text-xs sm:text-sm font-mono font-bold outline-none transition-all ${
                            isReadOnly
                              ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200'
                              : isB74Modified
                              ? 'border-amber-400 bg-amber-50 text-amber-950 ring-2 ring-amber-300/40'
                              : 'border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500'
                          }`}
                        />
                        {isB74Modified && (
                          <span className="block text-[10px] font-mono font-bold mt-1 text-amber-800">
                            {newBudgetSum.n74 > origSum.o74 ? `+${(newBudgetSum.n74 - origSum.o74).toLocaleString()}` : (newBudgetSum.n74 - origSum.o74).toLocaleString()}
                          </span>
                        )}
                      </div>

                      <div>
                        <span className="block text-[11px] text-emerald-900 font-semibold mb-1">
                          2575
                        </span>
                        <input
                          type="text"
                          disabled={isReadOnly}
                          value={b2575}
                          onChange={(e) => setB2575(e.target.value)}
                          className={`w-full text-center border rounded-lg px-1 py-2 text-xs sm:text-sm font-mono font-bold outline-none transition-all ${
                            isReadOnly
                              ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200'
                              : isB75Modified
                              ? 'border-amber-400 bg-amber-50 text-amber-950 ring-2 ring-amber-300/40'
                              : 'border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500'
                          }`}
                        />
                        {isB75Modified && (
                          <span className="block text-[10px] font-mono font-bold mt-1 text-amber-800">
                            {newBudgetSum.n75 > origSum.o75 ? `+${(newBudgetSum.n75 - origSum.o75).toLocaleString()}` : (newBudgetSum.n75 - origSum.o75).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Diff Comparison Bar */}
                    <div className="mt-2.5 flex items-center justify-between text-xs sm:text-sm bg-slate-100 rounded-lg px-3.5 py-2">
                      <span className="font-semibold text-slate-700">
                        รวมงบประมาณใหม่:{' '}
                        <strong className="text-emerald-700 font-mono text-sm sm:text-base">
                          {newBudgetSum.total.toLocaleString()}
                        </strong>{' '}
                        บาท
                      </span>
                      <span
                        className={`font-mono text-xs font-bold px-2.5 py-1 rounded shadow-2xs ${
                          newBudgetSum.diff > 0
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : newBudgetSum.diff < 0
                            ? 'bg-blue-100 text-blue-900 border border-blue-300'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {newBudgetSum.diff > 0
                          ? `+${newBudgetSum.diff.toLocaleString()} บาท (เพิ่มขึ้น)`
                          : newBudgetSum.diff < 0
                          ? `${newBudgetSum.diff.toLocaleString()} บาท (ลดลง)`
                          : 'งบประมาณเท่าเดิม (0 บาท)'}
                      </span>
                    </div>
                  </div>

                  {/* 7. Expected Results */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700 flex items-center">
                        <span>ผลที่คาดว่าจะได้รับ (ใหม่)</span>
                        {isResultsModified ? (
                          <span className="ml-2 text-[11px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.2 rounded shadow-2xs">
                            ✏️ มีการแก้ไข
                          </span>
                        ) : (
                          <span className="ml-2 text-[11px] text-slate-400 font-normal">[คงเดิม]</span>
                        )}
                      </label>
                    </div>
                    <textarea
                      rows={3}
                      disabled={isReadOnly}
                      value={expectedResults}
                      onChange={(e) => setExpectedResults(e.target.value)}
                      className={`w-full text-xs sm:text-sm border rounded-lg p-2.5 sm:p-3 min-h-[76px] resize-y leading-relaxed outline-none transition-all ${
                        isReadOnly
                          ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200'
                          : isResultsModified
                          ? 'border-amber-400 bg-amber-50/40 ring-2 ring-amber-300/30 text-slate-900 focus:ring-amber-500'
                          : 'border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500'
                      }`}
                      placeholder="ระบุผลที่คาดว่าจะได้รับใหม่..."
                    />
                  </div>

                  {/* 8. Department */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700 flex items-center">
                        <span>หน่วยงานรับผิดชอบหลัก</span>
                        {isDeptModified ? (
                          <span className="ml-2 text-[11px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.2 rounded shadow-2xs">
                            ✏️ มีการแก้ไข
                          </span>
                        ) : (
                          <span className="ml-2 text-[11px] text-slate-400 font-normal">[คงเดิม]</span>
                        )}
                      </label>
                    </div>
                    <select
                      value={department}
                      disabled={isReadOnly}
                      onChange={(e) => setDepartment(e.target.value)}
                      title={department || '-- เลือกหน่วยงานรับผิดชอบ --'}
                      className={`w-full text-xs sm:text-sm border rounded-lg p-2.5 truncate outline-none transition-all ${
                        isReadOnly
                          ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200'
                          : isDeptModified
                          ? 'border-amber-400 bg-amber-50/40 ring-2 ring-amber-300/30 text-slate-900 focus:ring-amber-500'
                          : 'border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500'
                      }`}
                    >
                      {DEPARTMENTS.map((d, idx) => (
                        <option key={idx} value={d} title={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 9. Reason for Change */}
                  {!isReadOnly && (
                    <div className="bg-amber-50/90 border border-amber-300 rounded-xl p-4 sm:p-5 space-y-2.5">
                      <div className="flex items-center gap-2 text-amber-900 font-bold text-xs sm:text-sm">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>
                          เหตุผลความจำเป็นในการ{actionLabel}โครงการ (จำเป็นต้องระบุตามระเบียบ){' '}
                          <span className="text-red-500">*</span>
                        </span>
                      </div>
                      <textarea
                        rows={3}
                        required
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder={`ระบุเหตุผลความจำเป็นในการขออนุมัติ${actionLabel}...`}
                        className="w-full text-xs sm:text-sm border border-amber-300 bg-white rounded-lg p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed min-h-[80px] resize-y"
                      />

                      {/* Quick sample suggestion chips */}
                      <div className="space-y-1.5 pt-1">
                        <span className="text-xs font-semibold text-amber-900">
                          ข้อความแนะนำ (คลิกเพื่อเลือก):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {sampleReasons.map((r, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setReason(r)}
                              className="text-xs bg-white hover:bg-amber-100 text-amber-900 border border-amber-200 px-2.5 py-1 rounded transition-colors cursor-pointer text-left shadow-2xs"
                            >
                              + {r}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons Bar */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="text-xs text-slate-600 flex items-center gap-2">
                  {isReadOnly ? (
                    <span className="font-medium bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600">
                      โหมดอ่านอย่างเดียว (Read-Only) - ไม่สามารถบันทึกหรือแก้ไขได้
                    </span>
                  ) : (
                    <span>
                      เมื่อบันทึก โครงการจะถูกบันทึกในบัญชีแบบ ผ.02 (ฉบับ{actionLabel}) พร้อมตารางเปรียบเทียบ
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs sm:text-sm font-medium border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 rounded-lg transition-colors cursor-pointer"
                  >
                    {isReadOnly ? 'ปิดหน้าต่าง' : 'ยกเลิก'}
                  </button>
                  {!isReadOnly && (
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 px-5 py-2 text-xs sm:text-sm font-semibold bg-[#055740] hover:bg-[#034131] text-white rounded-lg shadow-xs transition-colors cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>บันทึกโครงการ (ฉบับ{actionLabel})</span>
                    </button>
                  )}
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
