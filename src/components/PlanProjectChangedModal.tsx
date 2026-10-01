import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Trash2,
  Save,
  ArrowLeftRight,
  CheckCircle2,
  Clock,
  ShieldCheck,
  BookOpen,
  Printer,
  Building2,
  MapPin,
  Coins,
  Copy,
  Pencil
} from 'lucide-react';
import { ProjectData, PlanEdition, UserAccount } from '../types';
import { DEVELOPMENT_STRATEGIES, DEPARTMENTS } from '../utils/constants';
import { PLAN_CATEGORIES } from '../data/initialData';
import {
  isProjectBudgetAllocated,
  getExecutionStatus,
  EXECUTION_STATUS_CONFIG,
  getProjectVillageInfo
} from '../utils/villageUtils';

interface PlanProjectChangedModalProps {
  isOpen: boolean;
  project: ProjectData | null;
  allProjects?: ProjectData[];
  onClose: () => void;
  onSave?: (updatedProject: ProjectData) => void;
  onDelete?: (projectId: string) => void;
  onViewProjectDetail?: (project: ProjectData) => void;
  readOnly?: boolean;
  currentUser?: UserAccount | null;
  isPublic?: boolean;
}

export const PlanProjectChangedModal: React.FC<PlanProjectChangedModalProps> = ({
  isOpen,
  project,
  allProjects = [],
  onClose,
  onSave,
  onDelete,
  onViewProjectDetail,
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

  // Active display mode: 'compare' (Master All-in-One Edit & Compare) or 'detail02' (แบบ ผ.02 เต็มรูปแบบ)
  const [viewMode, setViewMode] = useState<'compare' | 'detail02'>('compare');

  // Find original project if referenced
  const matchedOriginal = useMemo(() => {
    if (!project) return null;
    if (project.originalProjectId) {
      return allProjects.find((p) => p.id === project.originalProjectId) || null;
    }
    if (project.originalProjectName) {
      return allProjects.find((p) => p.name === project.originalProjectName) || null;
    }
    // Try by code without suffix
    if (project.code) {
      const baseCode = project.code.replace(/-[พปกร]$/, '');
      return allProjects.find((p) => p.code === baseCode && p.id !== project.id) || null;
    }
    return null;
  }, [project, allProjects]);

  // Top control bar states
  const [year, setYear] = useState<string>(project?.year || '2571-2575');
  const [edition, setEdition] = useState<PlanEdition>(project?.edition || 'changed');
  const [planStrategy, setPlanStrategy] = useState<string>(
    project?.planStrategy || DEVELOPMENT_STRATEGIES[0]
  );
  const [planCategory, setPlanCategory] = useState<string>(
    project?.planCategory || PLAN_CATEGORIES[0]
  );

  // Left column (Original data)
  const [origName, setOrigName] = useState<string>('');
  const [origObjective, setOrigObjective] = useState<string>('');
  const [origTarget, setOrigTarget] = useState<string>('');
  const [origB71, setOrigB71] = useState<string>('0');
  const [origB72, setOrigB72] = useState<string>('0');
  const [origB73, setOrigB73] = useState<string>('0');
  const [origB74, setOrigB74] = useState<string>('0');
  const [origB75, setOrigB75] = useState<string>('0');
  const [origExpected, setOrigExpected] = useState<string>('');
  const [origDept, setOrigDept] = useState<string>('');

  // Right column (New requested data)
  const [newName, setNewName] = useState<string>('');
  const [newObjective, setNewObjective] = useState<string>('');
  const [newTarget, setNewTarget] = useState<string>('');
  const [newB71, setNewB71] = useState<string>('0');
  const [newB72, setNewB72] = useState<string>('0');
  const [newB73, setNewB73] = useState<string>('0');
  const [newB74, setNewB74] = useState<string>('0');
  const [newB75, setNewB75] = useState<string>('0');
  const [newExpected, setNewExpected] = useState<string>('');
  const [newDept, setNewDept] = useState<string>('');

  // Reason
  const [reason, setReason] = useState<string>('');

  // Initialize values when modal opens or project changes
  useEffect(() => {
    if (!project) return;
    setViewMode('compare');

    setYear(project.year || '2571-2575');
    setEdition(project.edition || 'changed');
    setPlanStrategy(project.planStrategy || DEVELOPMENT_STRATEGIES[0]);
    setPlanCategory(
      project.planCategory ||
      (project.edition === 'amended' ? 'แผนงานการศึกษา' : PLAN_CATEGORIES[0])
    );

    // Original fields derivation
    const initialOrigName =
      project.originalProjectName ||
      matchedOriginal?.name ||
      project.name ||
      (project.edition === 'amended'
        ? 'โครงการพัฒนาศูนย์การเรียนรู้ดิจิทัลชุมชนและห้องสมุดอัจฉริยะ'
        : 'โครงการก่อสร้างถนน คสล. บ้านศิลา');

    const initialOrigObj =
      project.originalObjective ||
      matchedOriginal?.objective ||
      project.objective ||
      (project.edition === 'amended'
        ? 'เพื่อส่งเสริมการเข้าถึงองค์ความรู้และทักษะดิจิทัล'
        : 'เพื่ออำนวยความสะดวกในการสัญจรของประชาชน');

    const initialOrigTarget =
      project.originalTarget ||
      matchedOriginal?.target ||
      project.target ||
      (project.edition === 'amended'
        ? 'จัดซื้ออุปกรณ์คอมพิวเตอร์ 30 ชุด พร้อมระบบเครือข่าย'
        : 'ก่อสร้างถนน กว้าง 4 เมตร ยาว 150 เมตร');

    const initialOrigB71 =
      project.originalBudgetByYear?.['2571'] ??
      matchedOriginal?.budgetByYear?.['2571'] ??
      project.budgetByYear?.['2571'] ??
      (project.edition === 'amended' ? 850000 : 500000);
    const initialOrigB72 =
      project.originalBudgetByYear?.['2572'] ??
      matchedOriginal?.budgetByYear?.['2572'] ??
      project.budgetByYear?.['2572'] ??
      (project.edition === 'amended' ? 200000 : 0);
    const initialOrigB73 =
      project.originalBudgetByYear?.['2573'] ??
      matchedOriginal?.budgetByYear?.['2573'] ??
      project.budgetByYear?.['2573'] ??
      (project.edition === 'amended' ? 200000 : 0);
    const initialOrigB74 =
      project.originalBudgetByYear?.['2574'] ??
      matchedOriginal?.budgetByYear?.['2574'] ??
      project.budgetByYear?.['2574'] ??
      (project.edition === 'amended' ? 200000 : 0);
    const initialOrigB75 =
      project.originalBudgetByYear?.['2575'] ??
      matchedOriginal?.budgetByYear?.['2575'] ??
      project.budgetByYear?.['2575'] ??
      (project.edition === 'amended' ? 200000 : 0);

    const initialOrigExpected =
      project.originalExpectedResults ||
      matchedOriginal?.expectedResults ||
      project.expectedResults ||
      (project.edition === 'amended'
        ? 'เยาวชนและประชาชนสามารถเข้าถึงเทคโนโลยีเพื่อการเรียนรู้'
        : 'ประชาชนสัญจรไปมาได้อย่างสะดวกรวดเร็วและปลอดภัย');

    const initialOrigDept =
      project.originalDepartment ||
      matchedOriginal?.department ||
      project.department ||
      (project.edition === 'amended' ? 'กองการศึกษา' : 'สำนักช่าง');

    setOrigName(initialOrigName);
    setOrigObjective(initialOrigObj);
    setOrigTarget(initialOrigTarget);
    setOrigB71(String(initialOrigB71));
    setOrigB72(String(initialOrigB72));
    setOrigB73(String(initialOrigB73));
    setOrigB74(String(initialOrigB74));
    setOrigB75(String(initialOrigB75));
    setOrigExpected(initialOrigExpected);
    setOrigDept(initialOrigDept);

    // New requested fields
    setNewName(project.name || initialOrigName);
    setNewObjective(project.objective || initialOrigObj);
    setNewTarget(project.target || initialOrigTarget);
    setNewB71(String(project.budgetByYear?.['2571'] ?? initialOrigB71));
    setNewB72(String(project.budgetByYear?.['2572'] ?? initialOrigB72));
    setNewB73(String(project.budgetByYear?.['2573'] ?? initialOrigB73));
    setNewB74(String(project.budgetByYear?.['2574'] ?? initialOrigB74));
    setNewB75(String(project.budgetByYear?.['2575'] ?? initialOrigB75));
    setNewExpected(project.expectedResults || initialOrigExpected);
    setNewDept(project.department || initialOrigDept);

    setReason(project.reason || project.note || '');
  }, [project, matchedOriginal]);

  // Sums calculation
  const origTotal = useMemo(() => {
    const v1 = parseFloat(origB71.replace(/,/g, '')) || 0;
    const v2 = parseFloat(origB72.replace(/,/g, '')) || 0;
    const v3 = parseFloat(origB73.replace(/,/g, '')) || 0;
    const v4 = parseFloat(origB74.replace(/,/g, '')) || 0;
    const v5 = parseFloat(origB75.replace(/,/g, '')) || 0;
    return v1 + v2 + v3 + v4 + v5;
  }, [origB71, origB72, origB73, origB74, origB75]);

  const newTotal = useMemo(() => {
    const v1 = parseFloat(newB71.replace(/,/g, '')) || 0;
    const v2 = parseFloat(newB72.replace(/,/g, '')) || 0;
    const v3 = parseFloat(newB73.replace(/,/g, '')) || 0;
    const v4 = parseFloat(newB74.replace(/,/g, '')) || 0;
    const v5 = parseFloat(newB75.replace(/,/g, '')) || 0;
    return v1 + v2 + v3 + v4 + v5;
  }, [newB71, newB72, newB73, newB74, newB75]);

  const diff = newTotal - origTotal;

  // Handle "คัดลอกจากเดิมทั้งหมด"
  const handleCopyAllFromOld = () => {
    setNewName(origName);
    setNewObjective(origObjective);
    setNewTarget(origTarget);
    setNewB71(origB71);
    setNewB72(origB72);
    setNewB73(origB73);
    setNewB74(origB74);
    setNewB75(origB75);
    setNewExpected(origExpected);
    setNewDept(origDept);
  };

  // Handle Save
  const handleSave = () => {
    if (!newName.trim()) {
      alert('กรุณากรอกชื่อโครงการ (ใหม่)');
      return;
    }

    const n1 = parseFloat(newB71.replace(/,/g, '')) || 0;
    const n2 = parseFloat(newB72.replace(/,/g, '')) || 0;
    const n3 = parseFloat(newB73.replace(/,/g, '')) || 0;
    const n4 = parseFloat(newB74.replace(/,/g, '')) || 0;
    const n5 = parseFloat(newB75.replace(/,/g, '')) || 0;

    const o1 = parseFloat(origB71.replace(/,/g, '')) || 0;
    const o2 = parseFloat(origB72.replace(/,/g, '')) || 0;
    const o3 = parseFloat(origB73.replace(/,/g, '')) || 0;
    const o4 = parseFloat(origB74.replace(/,/g, '')) || 0;
    const o5 = parseFloat(origB75.replace(/,/g, '')) || 0;

    const updated: ProjectData = {
      ...project,
      name: newName.trim(),
      year,
      edition,
      planStrategy,
      planCategory,
      objective: newObjective.trim(),
      target: newTarget.trim(),
      budgetByYear: {
        '2571': n1,
        '2572': n2,
        '2573': n3,
        '2574': n4,
        '2575': n5
      },
      budgetPlan: newTotal,
      expectedResults: newExpected.trim(),
      department: newDept,
      reason: reason.trim(),
      originalProjectName: origName.trim(),
      originalObjective: origObjective.trim(),
      originalTarget: origTarget.trim(),
      originalExpectedResults: origExpected.trim(),
      originalDepartment: origDept.trim(),
      originalBudgetPlan: origTotal,
      originalBudgetByYear: {
        '2571': o1,
        '2572': o2,
        '2573': o3,
        '2574': o4,
        '2575': o5
      }
    };

    if (onSave) {
      onSave(updated);
    }
    onClose();
  };

  // Handle Delete
  const handleDelete = () => {
    if (window.confirm(`ต้องการลบโครงการ "${project.name}" ออกจากระบบใช่หรือไม่?`)) {
      if (onDelete) {
        onDelete(project.id);
      }
      onClose();
    }
  };

  // Handle View Detail แบบ ผ.02
  const handleViewDetail02 = () => {
    if (viewMode === 'compare') {
      setViewMode('detail02');
    } else {
      setViewMode('compare');
    }
    if (onViewProjectDetail) {
      onViewProjectDetail(project);
    }
  };

  const isAmended = edition === 'amended';
  const actionVerb = isAmended ? 'แก้ไข' : 'เปลี่ยนแปลง';

  const editionLabel =
    edition === 'changed'
      ? 'เปลี่ยนแปลง'
      : edition === 'additional'
      ? 'เพิ่มเติม'
      : edition === 'amended'
      ? 'แก้ไข'
      : 'ฉบับแรก';

  const isApproved = Boolean(
    project?.status === 'approved' ||
    project?.publishStatus === 'published_first' ||
    project?.publishStatus === 'published_additional' ||
    project?.publishStatus === 'published_changed'
  );

  const isAllocated = project ? isProjectBudgetAllocated(project) : false;
  const executionStatus = project ? getExecutionStatus(project) : 'not_started';
  const executionConfig = EXECUTION_STATUS_CONFIG[executionStatus];
  const villageInfo = project ? getProjectVillageInfo(project) : null;

  const orderNum = project?.orderNumber || 8;

  if (!isOpen || !project) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-1 sm:p-2.5 overflow-hidden">
      <div
        id="master-all-in-one-modal"
        className="bg-[#0b1329] rounded-2xl shadow-2xl w-[98vw] lg:w-[96%] max-w-[1440px] overflow-hidden flex flex-col max-h-[96vh] border border-slate-700/80 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* ========================================================================= */}
        {/* 1. ส่วน Header (ดึงจุดเด่นจากรูปที่ 2)                                      */}
        {/* ========================================================================= */}
        <div className="px-4 py-2 sm:py-2.5 flex items-center justify-between border-b border-slate-800 shrink-0 bg-[#0b1329] text-white">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xs sm:text-sm font-bold text-white tracking-wide truncate">
                  ข้อมูลโครงการ แผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575) — ประเภทรายการ: {editionLabel}
                </h2>
                {/* Status Badge */}
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold border shadow-2xs ${
                    isApproved
                      ? 'bg-teal-950 text-teal-300 border-teal-600/40'
                      : 'bg-amber-950 text-amber-300 border-amber-600/40'
                  }`}
                >
                  {isApproved ? (
                    <CheckCircle2 className="w-3 h-3 text-teal-400" />
                  ) : (
                    <Clock className="w-3 h-3 text-amber-400 animate-pulse" />
                  )}
                  <span>{isApproved ? 'อนุมัติและประกาศใช้แล้ว' : 'อยู่ระหว่างเสนออนุมัติ'}</span>
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-emerald-200 mt-0.5 truncate">
                <span className="font-semibold text-white truncate max-w-[280px] sm:max-w-md md:max-w-xl" title={project.name}>
                  {project.name}
                </span>
                <span className="text-emerald-300/80 font-mono shrink-0">
                  • รหัส: {project.code || `69-02-000${orderNum}`}
                </span>
                <span className="hidden md:inline text-emerald-300/80 shrink-0">• เทศบาลเมืองศิลา</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0 ml-2">
            {/* Department & Budget & Difference Badges */}
            <div className="hidden lg:flex items-center gap-2 text-[11px] text-emerald-100/90">
              <span>
                หน่วยงาน: <strong className="text-white">{newDept || origDept || project.department || '-'}</strong>
              </span>
              <span>•</span>
              <span>
                งบประมาณเดิม:{' '}
                <strong className="text-white font-mono">{origTotal.toLocaleString()} บาท</strong>
              </span>
              {diff !== 0 ? (
                <span
                  className={`px-1.5 py-0.5 rounded font-mono font-bold text-[11px] shadow-2xs ${
                    diff > 0 ? 'bg-amber-400 text-amber-950' : 'bg-rose-400 text-rose-950'
                  }`}
                >
                  ({diff > 0 ? `+${diff.toLocaleString()}` : `-${Math.abs(diff).toLocaleString()}`})
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded font-mono text-[10px] bg-white/10 text-emerald-200">
                  (คงเดิม)
                </span>
              )}
            </div>

            {/* Clear White Close (X) button */}
            <button
              id="btn-close-master-modal"
              type="button"
              onClick={onClose}
              className="w-8 h-8 sm:w-9 sm:h-9 bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg shadow-xs flex items-center justify-center cursor-pointer transition-colors p-0"
              title="ปิดหน้าต่าง"
              aria-label="ปิดหน้าต่าง"
            >
              <X className="w-5 h-5 stroke-[2.2]" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* Content Body: ViewMode === 'compare' vs 'detail02'                        */}
        {/* ========================================================================= */}
        {viewMode === 'compare' ? (
          <div className="bg-white px-4 py-2.5 overflow-y-auto no-scrollbar flex-1 min-h-0 space-y-2 text-xs text-slate-800">
            {/* =================================================================== */}
            {/* 2. ส่วนตัวเลือกหมวดหมู่ (ดึงจากรูปที่ 1: Dropdown 4 ช่อง)           */}
            {/* =================================================================== */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {/* 1. ปี พ.ศ. บรรจุแผน */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                  ปี พ.ศ. บรรจุแผน
                </label>
                <select
                  value={year}
                  disabled={isReadOnly}
                  onChange={(e) => setYear(e.target.value)}
                  className={`w-full border rounded-lg px-2.5 py-1 text-xs font-medium focus:ring-1 focus:ring-emerald-600 focus:outline-none ${
                    isReadOnly
                      ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200'
                      : 'bg-white border-slate-300 text-slate-800 cursor-pointer'
                  }`}
                >
                  <option value="2571-2575">พ.ศ. 2571-2575 (5 ปี)</option>
                  <option value="2571">พ.ศ. 2571</option>
                  <option value="2572">พ.ศ. 2572</option>
                  <option value="2573">พ.ศ. 2573</option>
                  <option value="2574">พ.ศ. 2574</option>
                  <option value="2575">พ.ศ. 2575</option>
                </select>
              </div>

              {/* 2. ประเภทรายการ */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                  ประเภทรายการ
                </label>
                <div className="flex items-center gap-1.5">
                  <select
                    value={edition}
                    disabled={isReadOnly}
                    onChange={(e) => setEdition(e.target.value as PlanEdition)}
                    className={`flex-1 border rounded-lg px-2.5 py-1 text-xs font-bold focus:ring-1 focus:ring-emerald-600 focus:outline-none ${
                      isReadOnly
                        ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200'
                        : 'bg-white border-slate-300 text-emerald-700 cursor-pointer'
                    }`}
                  >
                    <option value="changed">เปลี่ยนแปลง</option>
                    <option value="first">ฉบับแรก</option>
                    <option value="additional">เพิ่มเติม</option>
                    <option value="amended">แก้ไข</option>
                  </select>
                  <span className="bg-emerald-50 text-emerald-700 font-bold text-[11px] px-2 py-1 rounded border border-emerald-200 shrink-0">
                    ผ.02
                  </span>
                </div>
              </div>

              {/* 3. ประเด็นการพัฒนา (ยุทธศาสตร์) */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                  ประเด็นการพัฒนา (ยุทธศาสตร์)
                </label>
                <select
                  value={planStrategy}
                  disabled={isReadOnly}
                  onChange={(e) => setPlanStrategy(e.target.value)}
                  title={planStrategy}
                  className={`w-full border rounded-lg px-2.5 py-1 text-xs truncate focus:ring-1 focus:ring-emerald-600 focus:outline-none ${
                    isReadOnly
                      ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200'
                      : 'bg-white border-slate-300 text-slate-800 cursor-pointer'
                  }`}
                >
                  {DEVELOPMENT_STRATEGIES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. แผนงาน */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">แผนงาน</label>
                <select
                  value={planCategory}
                  disabled={isReadOnly}
                  onChange={(e) => setPlanCategory(e.target.value)}
                  title={planCategory}
                  className={`w-full border rounded-lg px-2.5 py-1 text-xs truncate focus:ring-1 focus:ring-emerald-600 focus:outline-none ${
                    isReadOnly
                      ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200'
                      : 'bg-white border-slate-300 text-slate-800 cursor-pointer'
                  }`}
                >
                  {PLAN_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* =================================================================== */}
            {/* 3. ส่วนแท็บ/สถานะการดำเนินงาน (ดึงจากรูปที่ 2: Status & Progress)     */}
            {/* =================================================================== */}
            <div className="bg-slate-50 rounded-lg px-3 py-1.5 border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2.5 flex-wrap">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="font-semibold text-slate-800 text-[11px]">
                  สถานะการดำเนินงานและการจัดสรรงบประมาณ:
                </span>
                {isAllocated ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                    🔵 จัดตั้งงบประมาณแล้ว
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-300">
                    🟡 อยู่ในแผน (ยังไม่ตั้งงบ)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-[11px]">ความก้าวหน้าจริง:</span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${executionConfig.bgClass} ${executionConfig.textClass} ${executionConfig.borderClass}`}
                >
                  <span>{executionConfig.icon}</span>
                  <span>{executionConfig.label}</span>
                </span>
                {project.executionProgressNote && (
                  <span className="hidden xl:inline text-[11px] text-slate-500 truncate max-w-xs" title={project.executionProgressNote}>
                    ({project.executionProgressNote})
                  </span>
                )}
              </div>
            </div>

            {/* =================================================================== */}
            {/* 4. ส่วนฟอร์มแก้ไขข้อมูลโครงการ (ตารางเปรียบเทียบ 2 ฝั่ง ข้อมูลเดิม vs ใหม่) */}
            {/* =================================================================== */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
              {/* --- ฝั่งซ้าย: ข้อมูลเดิม (อ่านอย่างเดียว) --- */}
              <div className="bg-[#f8fafc] border border-slate-200 rounded-xl p-2.5 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                    <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                      <span>ข้อมูลเดิม (ก่อน{actionVerb})</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">โหมดอ่านอย่างเดียว</span>
                  </div>

                  {/* 1. ชื่อโครงการเดิม */}
                  <div className="mt-1.5">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                      ชื่อโครงการ (เดิม)
                    </label>
                    <textarea
                      rows={1}
                      disabled
                      value={origName}
                      className="w-full bg-slate-100/80 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 cursor-not-allowed leading-snug resize-none"
                    />
                  </div>

                  {/* 2. วัตถุประสงค์ & เป้าหมายเดิม */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                        วัตถุประสงค์ (เดิม)
                      </label>
                      <textarea
                        rows={2}
                        disabled
                        value={origObjective}
                        className="w-full bg-slate-100/80 border border-slate-200 rounded-lg px-2 py-1 text-[11px] text-slate-700 cursor-not-allowed leading-snug resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                        เป้าหมาย (ผลผลิตเดิม)
                      </label>
                      <textarea
                        rows={2}
                        disabled
                        value={origTarget}
                        className="w-full bg-slate-100/80 border border-slate-200 rounded-lg px-2 py-1 text-[11px] text-slate-700 cursor-not-allowed leading-snug resize-none"
                      />
                    </div>
                  </div>

                  {/* 3. งบประมาณ 5 ปี เดิม */}
                  <div className="mt-2 border-t border-slate-200 pt-1.5">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-700">
                        งบประมาณ 5 ปี เดิม
                      </label>
                      <span className="text-xs font-mono font-bold text-slate-900">
                        รวม: {origTotal.toLocaleString()} บาท
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-1 text-center">
                      <div>
                        <span className="text-[10px] text-slate-500 font-medium block">2571</span>
                        <input
                          type="text"
                          disabled
                          value={parseFloat(origB71).toLocaleString()}
                          className="w-full bg-slate-100 border border-slate-200 rounded px-1 py-0.5 text-center text-xs font-mono text-slate-700 cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-medium block">2572</span>
                        <input
                          type="text"
                          disabled
                          value={parseFloat(origB72).toLocaleString()}
                          className="w-full bg-slate-100 border border-slate-200 rounded px-1 py-0.5 text-center text-xs font-mono text-slate-700 cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-medium block">2573</span>
                        <input
                          type="text"
                          disabled
                          value={parseFloat(origB73).toLocaleString()}
                          className="w-full bg-slate-100 border border-slate-200 rounded px-1 py-0.5 text-center text-xs font-mono text-slate-700 cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-medium block">2574</span>
                        <input
                          type="text"
                          disabled
                          value={parseFloat(origB74).toLocaleString()}
                          className="w-full bg-slate-100 border border-slate-200 rounded px-1 py-0.5 text-center text-xs font-mono text-slate-700 cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-medium block">2575</span>
                        <input
                          type="text"
                          disabled
                          value={parseFloat(origB75).toLocaleString()}
                          className="w-full bg-slate-100 border border-slate-200 rounded px-1 py-0.5 text-center text-xs font-mono text-slate-700 cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. ผลที่คาดว่าจะได้รับ & หน่วยงานเดิม */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 border-t border-slate-200">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                      ผลที่คาดว่าจะได้รับ (เดิม)
                    </label>
                    <textarea
                      rows={1}
                      disabled
                      value={origExpected}
                      className="w-full bg-slate-100/80 border border-slate-200 rounded-lg px-2 py-0.5 text-[11px] text-slate-700 cursor-not-allowed leading-snug resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                      หน่วยงานรับผิดชอบ (เดิม)
                    </label>
                    <input
                      type="text"
                      disabled
                      value={origDept}
                      className="w-full bg-slate-100/80 border border-slate-200 rounded-lg px-2 py-0.5 text-xs text-slate-700 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* --- ฝั่งขวา: ข้อมูลใหม่ (ฟอร์มแก้ไข) --- */}
              <div className="bg-emerald-50/20 border border-emerald-300 rounded-xl p-2.5 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-1.5 border-b border-emerald-200">
                    <span className="font-bold text-emerald-900 text-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                      <span>ข้อมูลใหม่ (ที่ขอ{actionVerb})</span>
                    </span>
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={handleCopyAllFromOld}
                        className="inline-flex items-center gap-1 text-[11px] text-emerald-800 hover:text-emerald-950 font-bold bg-white border border-emerald-300 hover:bg-emerald-50 px-2 py-0.5 rounded cursor-pointer transition-colors shadow-2xs"
                      >
                        <Copy className="w-3 h-3 text-emerald-600" />
                        <span>คัดลอกจากเดิมทั้งหมด</span>
                      </button>
                    )}
                  </div>

                  {/* 1. ชื่อโครงการใหม่ */}
                  <div className="mt-1.5">
                    <label className="block text-[11px] font-semibold text-emerald-950 mb-0.5">
                      ชื่อโครงการ (ใหม่) <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={1}
                      disabled={isReadOnly}
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="กรอกชื่อโครงการใหม่..."
                      className={`w-full rounded-lg px-2.5 py-1 text-xs font-semibold leading-snug resize-none focus:outline-none ${
                        isReadOnly
                          ? 'bg-slate-100 text-slate-500 cursor-not-allowed border border-slate-200'
                          : 'bg-white border border-emerald-400 text-slate-900 focus:ring-1 focus:ring-emerald-500'
                      }`}
                    />
                  </div>

                  {/* 2. วัตถุประสงค์ & เป้าหมายใหม่ */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-emerald-950 mb-0.5">
                        วัตถุประสงค์ (ใหม่)
                      </label>
                      <textarea
                        rows={2}
                        disabled={isReadOnly}
                        value={newObjective}
                        onChange={(e) => setNewObjective(e.target.value)}
                        placeholder="กรอกวัตถุประสงค์..."
                        className={`w-full rounded-lg px-2 py-1 text-[11px] leading-snug resize-none focus:outline-none ${
                          isReadOnly
                            ? 'bg-slate-100 text-slate-500 cursor-not-allowed border border-slate-200'
                            : 'bg-white border border-slate-300 text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-emerald-950 mb-0.5">
                        เป้าหมาย (ผลผลิตใหม่)
                      </label>
                      <textarea
                        rows={2}
                        disabled={isReadOnly}
                        value={newTarget}
                        onChange={(e) => setNewTarget(e.target.value)}
                        placeholder="กรอกเป้าหมายผลผลิต..."
                        className={`w-full rounded-lg px-2 py-1 text-[11px] leading-snug resize-none focus:outline-none ${
                          isReadOnly
                            ? 'bg-slate-100 text-slate-500 cursor-not-allowed border border-slate-200'
                            : 'bg-white border border-slate-300 text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20'
                        }`}
                      />
                    </div>
                  </div>

                  {/* 3. งบประมาณ 5 ปี ใหม่ */}
                  <div className="mt-2 border-t border-emerald-200/80 pt-1.5">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <label className="text-[11px] font-bold text-emerald-950">
                          งบประมาณ 5 ปี ใหม่
                        </label>
                        {diff !== 0 && (
                          <span
                            className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                              diff > 0
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-rose-100 text-rose-900 border border-rose-300'
                            }`}
                          >
                            {diff > 0 ? `+${diff.toLocaleString()}` : `-${Math.abs(diff).toLocaleString()}`}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-800">
                        รวม: {newTotal.toLocaleString()} บาท
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-1 text-center">
                      <div>
                        <span className="text-[10px] text-slate-600 font-medium block">2571</span>
                        <input
                          type="text"
                          disabled={isReadOnly}
                          value={newB71}
                          onChange={(e) => setNewB71(e.target.value)}
                          className={`w-full rounded px-1 py-0.5 text-center text-xs font-mono focus:outline-none ${
                            isReadOnly
                              ? 'bg-slate-100 text-slate-500 cursor-not-allowed border border-slate-200'
                              : 'bg-white border border-slate-300 text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20'
                          }`}
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-600 font-medium block">2572</span>
                        <input
                          type="text"
                          disabled={isReadOnly}
                          value={newB72}
                          onChange={(e) => setNewB72(e.target.value)}
                          className={`w-full rounded px-1 py-0.5 text-center text-xs font-mono focus:outline-none ${
                            isReadOnly
                              ? 'bg-slate-100 text-slate-500 cursor-not-allowed border border-slate-200'
                              : 'bg-white border border-slate-300 text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20'
                          }`}
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-600 font-medium block">2573</span>
                        <input
                          type="text"
                          disabled={isReadOnly}
                          value={newB73}
                          onChange={(e) => setNewB73(e.target.value)}
                          className={`w-full rounded px-1 py-0.5 text-center text-xs font-mono focus:outline-none ${
                            isReadOnly
                              ? 'bg-slate-100 text-slate-500 cursor-not-allowed border border-slate-200'
                              : 'bg-white border border-slate-300 text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20'
                          }`}
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-600 font-medium block">2574</span>
                        <input
                          type="text"
                          disabled={isReadOnly}
                          value={newB74}
                          onChange={(e) => setNewB74(e.target.value)}
                          className={`w-full rounded px-1 py-0.5 text-center text-xs font-mono focus:outline-none ${
                            isReadOnly
                              ? 'bg-slate-100 text-slate-500 cursor-not-allowed border border-slate-200'
                              : 'bg-white border border-slate-300 text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20'
                          }`}
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-600 font-medium block">2575</span>
                        <input
                          type="text"
                          disabled={isReadOnly}
                          value={newB75}
                          onChange={(e) => setNewB75(e.target.value)}
                          className={`w-full rounded px-1 py-0.5 text-center text-xs font-mono focus:outline-none ${
                            isReadOnly
                              ? 'bg-slate-100 text-slate-500 cursor-not-allowed border border-slate-200'
                              : 'bg-white border border-slate-300 text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. ผลที่คาดว่าจะได้รับ & หน่วยงานใหม่ */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 border-t border-emerald-200/80">
                  <div>
                    <label className="block text-[11px] font-semibold text-emerald-950 mb-0.5">
                      ผลที่คาดว่าจะได้รับ (ใหม่)
                    </label>
                    <textarea
                      rows={1}
                      disabled={isReadOnly}
                      value={newExpected}
                      onChange={(e) => setNewExpected(e.target.value)}
                      placeholder="กรอกผลที่คาดว่าจะได้รับ..."
                      className={`w-full rounded-lg px-2 py-0.5 text-[11px] leading-snug resize-none focus:outline-none ${
                        isReadOnly
                          ? 'bg-slate-100 text-slate-500 cursor-not-allowed border border-slate-200'
                          : 'bg-white border border-slate-300 text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-emerald-950 mb-0.5">
                      หน่วยงานรับผิดชอบ (ใหม่)
                    </label>
                    <select
                      value={newDept}
                      disabled={isReadOnly}
                      onChange={(e) => setNewDept(e.target.value)}
                      className={`w-full rounded-lg px-2 py-0.5 text-xs focus:outline-none ${
                        isReadOnly
                          ? 'bg-slate-100 text-slate-500 cursor-not-allowed border border-slate-200'
                          : 'bg-white border border-slate-300 text-slate-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500/20 cursor-pointer'
                      }`}
                    >
                      {DEPARTMENTS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* =================================================================== */}
            {/* 5. ส่วนล่างของฟอร์ม (ดึงจากรูปที่ 1: เหตุผลและความจำเป็น)             */}
            {/* =================================================================== */}
            <div className="border border-amber-300 bg-[#fffbeb]/70 rounded-xl px-3 py-1.5 space-y-1">
              <label className="block text-[11px] font-bold text-amber-900">
                เหตุผลและความจำเป็น ที่ต้อง{actionVerb}
              </label>
              <textarea
                rows={2}
                disabled={isReadOnly}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="ระบุเหตุผลความจำเป็นและข้อเท็จจริงประกอบการพิจารณา..."
                className={`w-full border rounded-lg px-2.5 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-none min-h-[38px] max-h-[52px] resize-y leading-snug ${
                  isReadOnly
                    ? 'bg-amber-50/50 border-amber-200 text-slate-600 cursor-not-allowed'
                    : 'bg-white border-amber-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-400/20'
                }`}
              />
            </div>
          </div>
        ) : (
          /* ===================================================================== */
          /* ViewMode === 'detail02': รายละเอียดโครงการตามแบบ ผ.02 เต็มรูปแบบ       */
          /* ===================================================================== */
          <div className="bg-white p-4 sm:p-5 overflow-y-auto no-scrollbar flex-1 min-h-0 space-y-4 text-slate-800">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="bg-emerald-700 text-white font-bold px-2 py-0.5 rounded text-xs">
                  แบบ ผ.02
                </span>
                <h3 className="font-bold text-base text-slate-900">
                  บัญชีรายละเอียดโครงการพัฒนาท้องถิ่น (แบบ ผ.02)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold cursor-pointer shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>พิมพ์แบบ ผ.02</span>
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="text-xs font-bold text-emerald-800 mb-0.5">ชื่อโครงการ</div>
              <div className="text-base sm:text-lg font-black text-slate-950 leading-snug">
                {project.name}
              </div>
              <div className="text-xs text-slate-600 mt-1 font-medium">
                ประเด็นการพัฒนา: {project.planStrategy} • แผนงาน: {project.planCategory}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                <label className="text-xs font-bold text-slate-800">วัตถุประสงค์</label>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {project.objective || 'ไม่มีข้อมูลระบุ'}
                </p>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                <label className="text-xs font-bold text-slate-800">เป้าหมาย (ผลผลิตของโครงการ)</label>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {project.target || 'ไม่มีข้อมูลระบุ'}
                </p>
              </div>
            </div>

            {/* 5-Year Budget Table */}
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1.5">
                กรอบงบประมาณตามแผนพัฒนาท้องถิ่น (พ.ศ. 2571 - 2575)
              </label>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-xs text-center border-collapse">
                  <thead>
                    <tr className="bg-[#055740] text-white font-bold">
                      <th className="py-2 px-3 border-r border-emerald-700/60 w-1/5">พ.ศ. 2571 (บาท)</th>
                      <th className="py-2 px-3 border-r border-emerald-700/60 w-1/5">พ.ศ. 2572 (บาท)</th>
                      <th className="py-2 px-3 border-r border-emerald-700/60 w-1/5">พ.ศ. 2573 (บาท)</th>
                      <th className="py-2 px-3 border-r border-emerald-700/60 w-1/5">พ.ศ. 2574 (บาท)</th>
                      <th className="py-2 px-3 w-1/5">พ.ศ. 2575 (บาท)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="divide-x divide-slate-200 bg-white">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 text-right pr-4">
                        {project.budgetByYear?.['2571'] ? project.budgetByYear['2571'].toLocaleString() : '-'}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 text-right pr-4">
                        {project.budgetByYear?.['2572'] ? project.budgetByYear['2572'].toLocaleString() : '-'}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 text-right pr-4">
                        {project.budgetByYear?.['2573'] ? project.budgetByYear['2573'].toLocaleString() : '-'}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 text-right pr-4">
                        {project.budgetByYear?.['2574'] ? project.budgetByYear['2574'].toLocaleString() : '-'}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 text-right pr-4">
                        {project.budgetByYear?.['2575'] ? project.budgetByYear['2575'].toLocaleString() : '-'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Additional info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                <label className="font-bold text-slate-800">ผลที่คาดว่าจะได้รับ</label>
                <p className="text-slate-700 leading-relaxed">
                  {project.expectedResults || 'ไม่มีข้อมูลระบุ'}
                </p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  <span>หน่วยงานหลักที่รับผิดชอบ: <strong>{project.department || '-'}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>พื้นที่ดำเนินการ: <strong>{villageInfo ? `${villageInfo.zone} • ${villageInfo.villageName}` : (project.zone ? `${project.zone} • ` : '') + (project.village || 'เทศบาลเมืองศิลา')}</strong></span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 6. แถบปุ่มควบคุม Footer (รวมปุ่มจากทั้ง 2 รูป)                             */}
        {/* ========================================================================= */}
        <div className="bg-white px-4 py-2 border-t border-slate-200 flex items-center justify-between shrink-0">
          {/* ฝั่งซ้าย: ปุ่ม [🗑️ ลบโครงการ] */}
          <div>
            {!isReadOnly && onDelete ? (
              <button
                id="btn-delete-project-master"
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-rose-300 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>ลบโครงการ</span>
              </button>
            ) : isReadOnly ? (
              <span className="text-[11px] text-slate-500 font-medium bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                โหมดอ่านอย่างเดียว (Read-Only)
              </span>
            ) : null}
          </div>

          {/* ฝั่งขวา: [บันทึกการแก้ไข], [📖 ดูรายละเอียดโครงการ (แบบ ผ.02)], [กลับไป] */}
          <div className="flex items-center gap-2">
            {!isReadOnly && onSave && (
              <button
                id="btn-save-project-master"
                type="button"
                onClick={handleSave}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer transition-all active:scale-95"
              >
                <Save className="w-3.5 h-3.5" />
                <span>บันทึกการแก้ไข</span>
              </button>
            )}

            {/* ปุ่ม [ดูรายละเอียดโครงการ (แบบ ผ.02)] / [กลับไปหน้าเปรียบเทียบ] */}
            <button
              id="btn-view-detail-02-master"
              type="button"
              onClick={handleViewDetail02}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-2xs ${
                viewMode === 'detail02'
                  ? 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100'
                  : 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300'
              }`}
              title={viewMode === 'detail02' ? 'สลับกลับสู่หน้าเปรียบเทียบและแก้ไข' : 'เปิดดูรายละเอียดโครงการตามแบบ ผ.02 เต็มรูปแบบ'}
            >
              {viewMode === 'detail02' ? (
                <>
                  <Pencil className="w-3.5 h-3.5 text-amber-700" />
                  <span>กลับไปหน้าเปรียบเทียบ</span>
                </>
              ) : (
                <>
                  <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                  <span>ดูรายละเอียดโครงการ (แบบ ผ.02)</span>
                </>
              )}
            </button>

            {/* ปุ่ม [ปิดหน้าต่าง] */}
            <button
              id="btn-close-master"
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-[#E8F5E9] hover:bg-[#D1E7DD] text-[#0F5132] border border-[#C8E6C9] rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
