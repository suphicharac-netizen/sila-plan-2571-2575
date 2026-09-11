import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Trash2,
  Save,
  ArrowLeftRight
} from 'lucide-react';
import { ProjectData, PlanEdition } from '../types';
import { DEVELOPMENT_STRATEGIES, DEPARTMENTS } from '../utils/constants';
import { PLAN_CATEGORIES } from '../data/initialData';
import { getProjectDisplayId } from '../utils/projectCode';

interface PlanProjectChangedModalProps {
  isOpen: boolean;
  project: ProjectData | null;
  allProjects?: ProjectData[];
  onClose: () => void;
  onSave?: (updatedProject: ProjectData) => void;
  onDelete?: (projectId: string) => void;
  readOnly?: boolean;
}

export const PlanProjectChangedModal: React.FC<PlanProjectChangedModalProps> = ({
  isOpen,
  project,
  allProjects = [],
  onClose,
  onSave,
  onDelete,
  readOnly = false
}) => {
  if (!isOpen || !project) return null;

  // Find original project if referenced
  const matchedOriginal = useMemo(() => {
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
  const [year, setYear] = useState<string>(project.year || '2571');
  const [edition, setEdition] = useState<PlanEdition>(project.edition || 'changed');
  const [planStrategy, setPlanStrategy] = useState<string>(
    project.planStrategy || DEVELOPMENT_STRATEGIES[0]
  );
  const [planCategory, setPlanCategory] = useState<string>(
    project.planCategory || PLAN_CATEGORIES[0]
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

    setYear(project.year || '2571');
    setEdition(project.edition || 'changed');
    setPlanStrategy(project.planStrategy || '');
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
        : 'เพื่ออำนวยความสะดวก');

    const initialOrigTarget =
      project.originalTarget ||
      matchedOriginal?.target ||
      project.target ||
      (project.edition === 'amended'
        ? 'จัดซื้ออุปกรณ์คอมพิวเตอร์ 30 ชุด พร้อมระบบเครือข่าย'
        : 'ก่อสร้างถนน กว้าง4 เมตร ยาว 15 เมตร');

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
        ? 'เยาวชนและประชาชนสามารถเข้าถึงเทคโนโลยีเพื่อการ'
        : 'ประชาชนสัญจร ได้');

    const initialOrigDept =
      project.originalDepartment ||
      matchedOriginal?.department ||
      project.department ||
      (project.edition === 'amended' ? 'กองการศึกษา' : 'กองช่าง');

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

  const orderNum = project.orderNumber || 8;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      <div
        id="modal-plan-project-changed"
        className="bg-[#0b1329] rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-700/80 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header - Matches Screenshot */}
        <div className="px-5 py-3 flex items-center justify-between border-b border-slate-800 shrink-0 bg-[#0b1329]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-base shadow-sm shrink-0">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-2">
                <span>แก้ไขข้อมูลโครงการ</span>
                <span className="font-mono text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 text-xs px-2 py-0.5 rounded">
                  {getProjectDisplayId(project, orderNum)}
                </span>
              </h2>
              <div className="text-[11px] text-emerald-400 font-medium">
                แผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575) — ประเภทรายการ: {editionLabel}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="bg-white p-4 sm:p-5 overflow-y-auto flex-1 min-h-0 space-y-3.5 text-xs text-slate-800">
          {/* Top 4 Selectors Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. ปี พ.ศ. บรรจุแผน */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                ปี พ.ศ. บรรจุแผน
              </label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:ring-1 focus:ring-emerald-600 focus:outline-none cursor-pointer"
              >
                <option value="2571">พ.ศ. 2571</option>
                <option value="2572">พ.ศ. 2572</option>
                <option value="2573">พ.ศ. 2573</option>
                <option value="2574">พ.ศ. 2574</option>
                <option value="2575">พ.ศ. 2575</option>
              </select>
            </div>

            {/* 2. ประเภทรายการ */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                ประเภทรายการ
              </label>
              <div className="flex items-center gap-1.5">
                <select
                  value={edition}
                  onChange={(e) => setEdition(e.target.value as PlanEdition)}
                  className="flex-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-emerald-700 focus:ring-1 focus:ring-emerald-600 focus:outline-none cursor-pointer"
                >
                  <option value="changed">เปลี่ยนแปลง</option>
                  <option value="first">ฉบับแรก</option>
                  <option value="additional">เพิ่มเติม</option>
                  <option value="amended">แก้ไข</option>
                </select>
                <span className="bg-emerald-50 text-emerald-700 font-bold text-[11px] px-2 py-1.5 rounded border border-emerald-200 shrink-0">
                  ผ.02
                </span>
              </div>
            </div>

            {/* 3. ประเด็นการพัฒนา (ยุทธศาสตร์) */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                ประเด็นการพัฒนา (ยุทธศาสตร์)
              </label>
              <select
                value={planStrategy}
                onChange={(e) => setPlanStrategy(e.target.value)}
                title={planStrategy}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 truncate focus:ring-1 focus:ring-emerald-600 focus:outline-none cursor-pointer"
              >
                <option value="">-- เลือกประเด็นการพัฒนา --</option>
                {DEVELOPMENT_STRATEGIES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. แผนงาน */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">แผนงาน</label>
              <select
                value={planCategory}
                onChange={(e) => setPlanCategory(e.target.value)}
                title={planCategory}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 truncate focus:ring-1 focus:ring-emerald-600 focus:outline-none cursor-pointer"
              >
                {PLAN_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Two-Column Comparison Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
            {/* LEFT COLUMN: ข้อมูลเดิม (ก่อนแก้ไข / ก่อนเปลี่ยนแปลง) */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <span className="text-slate-400 text-sm leading-none">•</span>
                <span>ข้อมูลเดิม (ก่อน{actionVerb})</span>
              </div>

              <div className="bg-[#f8fafc] border border-slate-200 rounded-xl p-3.5 space-y-3">
                {/* ชื่อโครงการ (เดิม) */}
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">
                    ชื่อโครงการ (เดิม)
                  </label>
                  <input
                    type="text"
                    value={origName}
                    onChange={(e) => setOrigName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-slate-400"
                  />
                </div>

                {/* Sub-row: วัตถุประสงค์ (เดิม) & เป้าหมาย (ผลผลิตเดิม) */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">
                      วัตถุประสงค์ (เดิม)
                    </label>
                    <input
                      type="text"
                      value={origObjective}
                      onChange={(e) => setOrigObjective(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">
                      เป้าหมาย (ผลผลิตเดิม)
                    </label>
                    <input
                      type="text"
                      value={origTarget}
                      onChange={(e) => setOrigTarget(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-slate-400"
                    />
                  </div>
                </div>

                {/* งบประมาณ 5 ปี เดิม */}
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1">
                    <span>งบประมาณ 5 ปี เดิม</span>
                    <span className="font-mono text-slate-500 font-medium">
                      รวม: {origTotal.toLocaleString()} บ.
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    <div className="text-center">
                      <span className="block text-[10px] text-slate-400 mb-0.5">2571</span>
                      <input
                        type="text"
                        value={origB71}
                        onChange={(e) => setOrigB71(e.target.value)}
                        className="w-full text-center bg-white border border-slate-200 rounded-lg py-1 px-1 text-xs font-mono text-slate-800 focus:outline-none focus:border-slate-400"
                      />
                    </div>
                    <div className="text-center">
                      <span className="block text-[10px] text-slate-400 mb-0.5">2572</span>
                      <input
                        type="text"
                        value={origB72}
                        onChange={(e) => setOrigB72(e.target.value)}
                        className="w-full text-center bg-white border border-slate-200 rounded-lg py-1 px-1 text-xs font-mono text-slate-800 focus:outline-none focus:border-slate-400"
                      />
                    </div>
                    <div className="text-center">
                      <span className="block text-[10px] text-slate-400 mb-0.5">2573</span>
                      <input
                        type="text"
                        value={origB73}
                        onChange={(e) => setOrigB73(e.target.value)}
                        className="w-full text-center bg-white border border-slate-200 rounded-lg py-1 px-1 text-xs font-mono text-slate-800 focus:outline-none focus:border-slate-400"
                      />
                    </div>
                    <div className="text-center">
                      <span className="block text-[10px] text-slate-400 mb-0.5">2574</span>
                      <input
                        type="text"
                        value={origB74}
                        onChange={(e) => setOrigB74(e.target.value)}
                        className="w-full text-center bg-white border border-slate-200 rounded-lg py-1 px-1 text-xs font-mono text-slate-800 focus:outline-none focus:border-slate-400"
                      />
                    </div>
                    <div className="text-center">
                      <span className="block text-[10px] text-slate-400 mb-0.5">2575</span>
                      <input
                        type="text"
                        value={origB75}
                        onChange={(e) => setOrigB75(e.target.value)}
                        className="w-full text-center bg-white border border-slate-200 rounded-lg py-1 px-1 text-xs font-mono text-slate-800 focus:outline-none focus:border-slate-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Sub-row: ผลที่คาดว่าจะได้รับ (เดิม) & หน่วยงานรับผิดชอบ (เดิม) */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">
                      ผลที่คาดว่าจะได้รับ (เดิม)
                    </label>
                    <input
                      type="text"
                      value={origExpected}
                      onChange={(e) => setOrigExpected(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">
                      หน่วยงานรับผิดชอบ (เดิม)
                    </label>
                    <input
                      type="text"
                      value={origDept}
                      onChange={(e) => setOrigDept(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-slate-400"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: ข้อมูลใหม่ (ที่ขอแก้ไข / ที่ขอเปลี่ยนแปลง) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-700">
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-500 text-sm leading-none">•</span>
                  <span>ข้อมูลใหม่ (ที่ขอ{actionVerb})</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyAllFromOld}
                  className="text-emerald-600 hover:text-emerald-800 text-xs font-semibold hover:underline cursor-pointer"
                >
                  คัดลอกจากเดิมทั้งหมด
                </button>
              </div>

              <div className="bg-emerald-50/20 border border-emerald-300 rounded-xl p-3.5 space-y-3">
                {/* ชื่อโครงการ (ใหม่) * */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    ชื่อโครงการ (ใหม่) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-white border border-emerald-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-medium focus:outline-none"
                  />
                </div>

                {/* Sub-row: วัตถุประสงค์ (ใหม่) & เป้าหมาย (ผลผลิตใหม่) */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-700 mb-1">
                      วัตถุประสงค์ (ใหม่)
                    </label>
                    <input
                      type="text"
                      value={newObjective}
                      onChange={(e) => setNewObjective(e.target.value)}
                      className="w-full bg-white border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-700 mb-1">
                      เป้าหมาย (ผลผลิตใหม่)
                    </label>
                    <input
                      type="text"
                      value={newTarget}
                      onChange={(e) => setNewTarget(e.target.value)}
                      className="w-full bg-white border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>

                {/* งบประมาณ 5 ปี ใหม่ (รวม: ... บ.) */}
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-700 mb-1">
                    <span>งบประมาณ 5 ปี ใหม่ (รวม: {newTotal.toLocaleString()} บ.)</span>
                    {diff !== 0 && (
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          diff > 0
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-rose-100 text-rose-900 border border-rose-300'
                        }`}
                      >
                        {diff > 0
                          ? `+${diff.toLocaleString()} บ.`
                          : `${diff.toLocaleString()} บ.`}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    <div className="text-center">
                      <span className="block text-[10px] text-slate-500 mb-0.5">2571</span>
                      <input
                        type="text"
                        value={newB71}
                        onChange={(e) => setNewB71(e.target.value)}
                        className="w-full text-center bg-white border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-lg py-1 px-1 text-xs font-mono font-bold text-slate-900 focus:outline-none"
                      />
                    </div>
                    <div className="text-center">
                      <span className="block text-[10px] text-slate-500 mb-0.5">2572</span>
                      <input
                        type="text"
                        value={newB72}
                        onChange={(e) => setNewB72(e.target.value)}
                        className="w-full text-center bg-white border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-lg py-1 px-1 text-xs font-mono font-bold text-slate-900 focus:outline-none"
                      />
                    </div>
                    <div className="text-center">
                      <span className="block text-[10px] text-slate-500 mb-0.5">2573</span>
                      <input
                        type="text"
                        value={newB73}
                        onChange={(e) => setNewB73(e.target.value)}
                        className="w-full text-center bg-white border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-lg py-1 px-1 text-xs font-mono font-bold text-slate-900 focus:outline-none"
                      />
                    </div>
                    <div className="text-center">
                      <span className="block text-[10px] text-slate-500 mb-0.5">2574</span>
                      <input
                        type="text"
                        value={newB74}
                        onChange={(e) => setNewB74(e.target.value)}
                        className="w-full text-center bg-white border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-lg py-1 px-1 text-xs font-mono font-bold text-slate-900 focus:outline-none"
                      />
                    </div>
                    <div className="text-center">
                      <span className="block text-[10px] text-slate-500 mb-0.5">2575</span>
                      <input
                        type="text"
                        value={newB75}
                        onChange={(e) => setNewB75(e.target.value)}
                        className="w-full text-center bg-white border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-lg py-1 px-1 text-xs font-mono font-bold text-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Sub-row: ผลที่คาดว่าจะได้รับ (ใหม่) & หน่วยงานรับผิดชอบ (ใหม่) */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-700 mb-1">
                      ผลที่คาดว่าจะได้รับ (ใหม่)
                    </label>
                    <input
                      type="text"
                      value={newExpected}
                      onChange={(e) => setNewExpected(e.target.value)}
                      className="w-full bg-white border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-700 mb-1">
                      หน่วยงานรับผิดชอบ (ใหม่)
                    </label>
                    <select
                      value={newDept}
                      onChange={(e) => setNewDept(e.target.value)}
                      className="w-full bg-white border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none cursor-pointer"
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
          </div>

          {/* Yellow Box: เหตุผลและความจำเป็น ที่ต้องแก้ไข / ที่ต้องเปลี่ยนแปลง */}
          <div className="border border-amber-300 bg-[#fffbeb]/50 rounded-xl p-3 space-y-1">
            <label className="block text-xs font-bold text-amber-800">
              เหตุผลและความจำเป็น ที่ต้อง{actionVerb}
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="ระบุเหตุผลความจำเป็นและข้อเท็จจริงประกอบการพิจารณา..."
              className="w-full bg-white border border-amber-200 focus:border-amber-400 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
            />
          </div>

          {/* Footer Action Buttons */}
          <div className="pt-2 flex items-center justify-between">
            {readOnly ? (
              <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2.5 py-1 rounded-md">
                โหมดอ่านอย่างเดียว (Read-Only)
              </span>
            ) : (
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-rose-300 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-medium cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ลบโครงการ</span>
              </button>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium cursor-pointer transition-colors"
              >
                {readOnly ? 'ปิดหน้าต่าง' : 'ยกเลิก'}
              </button>
              {!readOnly && (
                <button
                  type="button"
                  onClick={handleSave}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>บันทึกข้อมูล</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
