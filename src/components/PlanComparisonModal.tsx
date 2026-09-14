import React, { useState, useMemo } from 'react';
import {
  X,
  Save,
  ArrowRight,
  Building2,
  Calendar,
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';
import { ProjectData, PlanEdition, UserAccount } from '../types';
import { DEVELOPMENT_STRATEGIES, DEPARTMENTS } from '../utils/constants';

interface PlanComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateProject: ProjectData | null;
  edition: PlanEdition; // 'changed' or 'amended'
  onSave: (newProject: ProjectData) => void;
  readOnly?: boolean;
  currentUser?: UserAccount | null;
  isPublic?: boolean;
}

export const PlanComparisonModal: React.FC<PlanComparisonModalProps> = ({
  isOpen,
  onClose,
  candidateProject,
  edition,
  onSave,
  readOnly = false,
  currentUser,
  isPublic = false
}) => {
  if (!isOpen || !candidateProject) return null;

  const isReadOnly = Boolean(
    readOnly ||
    isPublic ||
    currentUser?.role === 'public' ||
    currentUser?.role === 'executive'
  );

  const isChanged = edition === 'changed';
  const actionLabel = isChanged ? 'เปลี่ยนแปลง' : 'แก้ไข';

  // Form states for the new version
  const [name, setName] = useState(candidateProject.name);
  const [planStrategy, setPlanStrategy] = useState(candidateProject.planStrategy);
  const [planCategory, setPlanCategory] = useState(candidateProject.planCategory);
  const [department, setDepartment] = useState(candidateProject.department);
  const [objective, setObjective] = useState(candidateProject.objective || '');
  const [target, setTarget] = useState(candidateProject.target || '');
  const [expectedResults, setExpectedResults] = useState(
    candidateProject.expectedResults || ''
  );
  const [reason, setReason] = useState(
    isChanged
      ? 'ปรับปรุงแบบรูปรายการและงบประมาณให้สอดคล้องกับสภาพพื้นที่จริง'
      : 'แก้ไขรายละเอียดสถานที่ตั้งและเป้าหมายให้ถูกต้องครบถ้วน'
  );

  // 5-Year budgets for new version
  const [b2571, setB2571] = useState<string>(
    candidateProject.budgetByYear?.['2571']?.toString() || '0'
  );
  const [b2572, setB2572] = useState<string>(
    candidateProject.budgetByYear?.['2572']?.toString() || '0'
  );
  const [b2573, setB2573] = useState<string>(
    candidateProject.budgetByYear?.['2573']?.toString() || '0'
  );
  const [b2574, setB2574] = useState<string>(
    candidateProject.budgetByYear?.['2574']?.toString() || '0'
  );
  const [b2575, setB2575] = useState<string>(
    candidateProject.budgetByYear?.['2575']?.toString() || '0'
  );

  // Original budget sums
  const origSum = useMemo(() => {
    const o71 = candidateProject.budgetByYear?.['2571'] || 0;
    const o72 = candidateProject.budgetByYear?.['2572'] || 0;
    const o73 = candidateProject.budgetByYear?.['2573'] || 0;
    const o74 = candidateProject.budgetByYear?.['2574'] || 0;
    const o75 = candidateProject.budgetByYear?.['2575'] || 0;
    const total = o71 + o72 + o73 + o74 + o75 || candidateProject.budgetPlan;
    return { o71, o72, o73, o74, o75, total };
  }, [candidateProject]);

  // New budget sums
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (!name.trim()) return;

    const suffix = isChanged ? 'ป' : 'ก';
    const newProject: ProjectData = {
      id: `PRJ-CHG-${Date.now()}`,
      orderNumber: Date.now(),
      code: `${candidateProject.code.replace(/-[พปกร]$/, '')}-${suffix}`,
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
      budgetSource: candidateProject.budgetSource || '- ยังไม่ได้จัดสรร -',
      budgetApproved: candidateProject.budgetApproved || 0,
      approvedDate: candidateProject.approvedDate || '-',
      status: 'pending',
      department,
      year: candidateProject.year || '2571',
      note: `ขออนุมัติ${actionLabel}จากโครงการเดิม (${candidateProject.code})`,
      reason: reason.trim(),
      originalProjectId: candidateProject.id,
      originalProjectName: candidateProject.name,
      originalEdition: candidateProject.edition,
      originalTarget: candidateProject.target,
      originalObjective: candidateProject.objective,
      originalBudgetPlan: origSum.total,
      originalBudgetByYear: candidateProject.budgetByYear
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-hidden">
      <div
        id="modal-plan-comparison-form"
        className="bg-white rounded-2xl shadow-2xl w-[95vw] lg:w-[95%] max-w-[1400px] overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[94vh] border border-slate-200"
      >
        {/* Modal Header */}
        <div className="bg-[#055740] px-6 py-4 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#034131] border border-emerald-600/50 flex items-center justify-center text-emerald-300 shadow-inner">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
                  แบบ ผ.02 บัญชีเปรียบเทียบโครงการพัฒนาท้องถิ่น (ฉบับ{actionLabel})
                </h2>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-400/40 bg-emerald-800/60 text-emerald-200">
                  บัญชีเปรียบเทียบสาระสำคัญ เดิม vs ใหม่
                </span>
                {isReadOnly && (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full border border-amber-400/40 bg-amber-500/20 text-amber-200">
                    โหมดอ่านอย่างเดียว
                  </span>
                )}
              </div>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                เปรียบเทียบข้อมูลสาระสำคัญระหว่างโครงการเดิมในแผน กับโครงการที่ขออนุมัติ{actionLabel}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-emerald-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Two-Column Comparative Layout */}
        <form onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-7 space-y-5 bg-slate-50">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Column 1: Original Project Data (Read-Only) */}
            <div className="bg-white border border-slate-300 rounded-xl p-4 sm:p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                  <h3 className="text-sm sm:text-base font-bold text-slate-800">
                    ข้อมูลเดิมในแผนพัฒนาท้องถิ่น
                  </h3>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                  {candidateProject.edition === 'first' ? 'ฉบับแรก' : 'ฉบับเพิ่มเติม'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  ชื่อโครงการเดิม
                </label>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs sm:text-sm text-slate-800 font-bold leading-relaxed">
                  {candidateProject.name}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  ยุทธศาสตร์ / ประเด็นการพัฒนาเดิม
                </label>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 sm:p-3 text-xs sm:text-sm text-slate-700">
                  {candidateProject.planStrategy}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  วัตถุประสงค์เดิม
                </label>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 sm:p-3 text-xs sm:text-sm text-slate-700 leading-relaxed min-h-[64px]">
                  {candidateProject.objective || '-'}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  เป้าหมาย (ผลผลิต) เดิม
                </label>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 sm:p-3 text-xs sm:text-sm text-slate-700 leading-relaxed min-h-[64px]">
                  {candidateProject.target || '-'}
                </div>
              </div>

              {/* Original 5-Year Budget Table */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                  งบประมาณเดิม (พ.ศ. 2571 - 2575)
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
                  ผลที่คาดว่าจะได้รับเดิม
                </label>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 sm:p-3 text-xs sm:text-sm text-slate-700 leading-relaxed min-h-[64px]">
                  {candidateProject.expectedResults || '-'}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  หน่วยงานรับผิดชอบเดิม
                </label>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 sm:p-3 text-xs sm:text-sm text-slate-700 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <span>{candidateProject.department}</span>
                </div>
              </div>
            </div>

            {/* Column 2: New / Requested Changes (Editable Form) */}
            <div className="bg-white border-2 border-emerald-600/60 rounded-xl p-4 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  <h3 className="text-sm sm:text-base font-bold text-emerald-950">
                    ข้อมูลโครงการที่ขอ{actionLabel} (เสนออนุมัติใหม่)
                  </h3>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                  ฉบับ{actionLabel}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ชื่อโครงการ (ใหม่) {!isReadOnly && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  rows={2}
                  required={!isReadOnly}
                  disabled={isReadOnly}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full text-xs sm:text-sm font-bold border rounded-lg p-2.5 sm:p-3 min-h-[58px] resize-y leading-relaxed outline-none ${
                    isReadOnly
                      ? 'bg-slate-100 text-slate-600 cursor-not-allowed border-slate-200'
                      : 'border-slate-300 text-slate-900 focus:ring-2 focus:ring-emerald-500 bg-white'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ยุทธศาสตร์ / ประเด็นการพัฒนา
                </label>
                <select
                  value={planStrategy}
                  disabled={isReadOnly}
                  onChange={(e) => setPlanStrategy(e.target.value)}
                  title={planStrategy || '-- เลือกประเด็นการพัฒนา --'}
                  className={`w-full text-xs sm:text-sm border rounded-lg p-2.5 truncate outline-none ${
                    isReadOnly
                      ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200'
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  วัตถุประสงค์ (ใหม่)
                </label>
                <textarea
                  rows={3}
                  disabled={isReadOnly}
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  className={`w-full text-xs sm:text-sm border rounded-lg p-2.5 sm:p-3 min-h-[76px] resize-y leading-relaxed outline-none ${
                    isReadOnly
                      ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200'
                      : 'border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500'
                  }`}
                  placeholder="ระบุวัตถุประสงค์..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  เป้าหมาย (ผลผลิต) (ใหม่)
                </label>
                <textarea
                  rows={3}
                  disabled={isReadOnly}
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className={`w-full text-xs sm:text-sm border rounded-lg p-2.5 sm:p-3 min-h-[76px] resize-y leading-relaxed outline-none ${
                    isReadOnly
                      ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200'
                      : 'border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500'
                  }`}
                  placeholder="ระบุเป้าหมายผลผลิตใหม่..."
                />
              </div>

              {/* New 5-Year Budget Inputs */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  งบประมาณใหม่แยกรายปี (บาท) พ.ศ. 2571 - 2575
                </label>
                <div className="grid grid-cols-5 gap-2 text-center bg-emerald-50/50 p-3 rounded-lg border border-emerald-200">
                  <div>
                    <span className="block text-[11px] text-emerald-800 font-semibold mb-1">
                      2571
                    </span>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      value={b2571}
                      onChange={(e) => setB2571(e.target.value)}
                      className={`w-full text-center border rounded-lg px-1.5 py-2 text-xs sm:text-sm font-mono font-bold outline-none ${
                        isReadOnly
                          ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200'
                          : 'border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500'
                      }`}
                    />
                  </div>
                  <div>
                    <span className="block text-[11px] text-emerald-800 font-semibold mb-1">
                      2572
                    </span>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      value={b2572}
                      onChange={(e) => setB2572(e.target.value)}
                      className={`w-full text-center border rounded-lg px-1.5 py-2 text-xs sm:text-sm font-mono font-bold outline-none ${
                        isReadOnly
                          ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200'
                          : 'border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500'
                      }`}
                    />
                  </div>
                  <div>
                    <span className="block text-[11px] text-emerald-800 font-semibold mb-1">
                      2573
                    </span>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      value={b2573}
                      onChange={(e) => setB2573(e.target.value)}
                      className={`w-full text-center border rounded-lg px-1.5 py-2 text-xs sm:text-sm font-mono font-bold outline-none ${
                        isReadOnly
                          ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200'
                          : 'border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500'
                      }`}
                    />
                  </div>
                  <div>
                    <span className="block text-[11px] text-emerald-800 font-semibold mb-1">
                      2574
                    </span>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      value={b2574}
                      onChange={(e) => setB2574(e.target.value)}
                      className={`w-full text-center border rounded-lg px-1.5 py-2 text-xs sm:text-sm font-mono font-bold outline-none ${
                        isReadOnly
                          ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200'
                          : 'border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500'
                      }`}
                    />
                  </div>
                  <div>
                    <span className="block text-[11px] text-emerald-800 font-semibold mb-1">
                      2575
                    </span>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      value={b2575}
                      onChange={(e) => setB2575(e.target.value)}
                      className={`w-full text-center border rounded-lg px-1.5 py-2 text-xs sm:text-sm font-mono font-bold outline-none ${
                        isReadOnly
                          ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200'
                          : 'border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Diff Comparison */}
                <div className="mt-2.5 flex items-center justify-between text-xs sm:text-sm bg-slate-100 rounded-lg px-3.5 py-2">
                  <span className="font-semibold text-slate-700">
                    รวมงบประมาณใหม่:{' '}
                    <strong className="text-emerald-700 font-mono text-sm sm:text-base">
                      {newBudgetSum.total.toLocaleString()}
                    </strong>{' '}
                    บาท
                  </span>
                  <span
                    className={`font-mono text-xs font-bold px-2.5 py-1 rounded ${
                      newBudgetSum.diff > 0
                        ? 'bg-amber-100 text-amber-800'
                        : newBudgetSum.diff < 0
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {newBudgetSum.diff > 0
                      ? `+${newBudgetSum.diff.toLocaleString()} บาท (เพิ่มขึ้น)`
                      : newBudgetSum.diff < 0
                      ? `${newBudgetSum.diff.toLocaleString()} บาท (ลดลง)`
                      : 'งบประมาณเท่าเดิม'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ผลที่คาดว่าจะได้รับ (ใหม่)
                </label>
                <textarea
                  rows={3}
                  disabled={isReadOnly}
                  value={expectedResults}
                  onChange={(e) => setExpectedResults(e.target.value)}
                  className={`w-full text-xs sm:text-sm border rounded-lg p-2.5 sm:p-3 min-h-[76px] resize-y leading-relaxed outline-none ${
                    isReadOnly
                      ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200'
                      : 'border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500'
                  }`}
                  placeholder="ระบุผลที่คาดว่าจะได้รับใหม่..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  หน่วยงานรับผิดชอบหลัก
                </label>
                <select
                  value={department}
                  disabled={isReadOnly}
                  onChange={(e) => setDepartment(e.target.value)}
                  title={department || '-- เลือกหน่วยงานรับผิดชอบ --'}
                  className={`w-full text-xs sm:text-sm border rounded-lg p-2.5 truncate outline-none ${
                    isReadOnly
                      ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200'
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

              {/* CRITICAL FIELD: เหตุผลความจำเป็นในการเปลี่ยนแปลง/แก้ไข (ซ่อนในโหมดอ่านอย่างเดียว) */}
              {!isReadOnly && (
                <div className="bg-amber-50/80 border border-amber-300 rounded-xl p-4 sm:p-5 space-y-2.5">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs sm:text-sm">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      เหตุผลความจำเป็นในการ{actionLabel}โครงการ (จำเป็นต้องระบุตามระเบียบ){' '}
                      <span className="text-red-500">*</span>
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={`ระบุเหตุผลความจำเป็นในการขออนุมัติ${actionLabel}...`}
                    className="w-full text-xs sm:text-sm border border-amber-300 bg-white rounded-lg p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed min-h-[96px] resize-y"
                  />

                  {/* Quick tags */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-xs font-semibold text-amber-800">
                      ข้อความแนะนำ:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {sampleReasons.map((r, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setReason(r)}
                          className="text-xs bg-white hover:bg-amber-100 text-amber-900 border border-amber-200 px-2.5 py-1 rounded transition-colors cursor-pointer text-left"
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

          {/* Action Buttons */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="text-xs text-slate-500">
              {isReadOnly ? (
                <span className="font-medium bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600">
                  โหมดอ่านอย่างเดียว (Read-Only) - สิทธิ์เข้าชมทั่วไป ไม่สามารถบันทึกหรือแก้ไขได้
                </span>
              ) : (
                `เมื่อบันทึก โครงการจะถูกบันทึกในบัญชีรายละเอียดแบบ ผ.02 (ฉบับ${actionLabel}) พร้อมตารางเปรียบเทียบ`
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
      </div>
    </div>
  );
};
