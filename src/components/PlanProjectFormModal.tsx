import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Save,
  Layers,
  Link as LinkIcon,
  ArrowLeft,
  FileText,
  Target,
  Coins,
  Building2,
  AlertCircle
} from 'lucide-react';
import { ProjectData, PlanEdition, ALL_VILLAGES, SILA_ZONES, UserAccount } from '../types';
import { DEVELOPMENT_STRATEGIES, DEPARTMENTS } from '../utils/constants';
import { PLAN_CATEGORIES } from '../data/initialData';
import { generateStandardProjectCode } from '../utils/projectCode';

interface PlanProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: ProjectData) => void;
  initialProject?: ProjectData | null;
  defaultEdition: PlanEdition;
  readOnly?: boolean;
  currentUser?: UserAccount | null;
  isPublic?: boolean;
}

export const PlanProjectFormModal: React.FC<PlanProjectFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialProject,
  defaultEdition,
  readOnly = false,
  currentUser,
  isPublic = false
}) => {
  if (!isOpen) return null;

  const isReadOnly = Boolean(
    readOnly ||
    isPublic ||
    currentUser?.role === 'public' ||
    currentUser?.role === 'executive'
  );

  const isEdit = Boolean(initialProject);
  const currentEdition = initialProject?.edition || defaultEdition;

  const editionTextMap: Record<PlanEdition, string> = {
    first: 'ฉบับแรก',
    additional: 'เพิ่มเติม',
    changed: 'เปลี่ยนแปลง',
    amended: 'แก้ไข'
  };

  const editionLabel = editionTextMap[currentEdition] || 'เพิ่มเติม';

  // Form states
  const [targetYear, setTargetYear] = useState<string>('พ.ศ. 2571');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [planStrategy, setPlanStrategy] = useState('');
  const [planCategory, setPlanCategory] = useState('');
  const [department, setDepartment] = useState('');
  const [objective, setObjective] = useState('');
  const [target, setTarget] = useState('');
  const [expectedResults, setExpectedResults] = useState('');
  const [reason, setReason] = useState('');
  const [selectedVillageNum, setSelectedVillageNum] = useState<number>(1);

  // 5-Year Budgets
  const [b2571, setB2571] = useState<string>('0');
  const [b2572, setB2572] = useState<string>('0');
  const [b2573, setB2573] = useState<string>('0');
  const [b2574, setB2574] = useState<string>('0');
  const [b2575, setB2575] = useState<string>('0');

  // Initialize or reset values when modal opens or initialProject changes
  useEffect(() => {
    if (initialProject) {
      setName(initialProject.name || '');
      setCode(initialProject.code || '');
      setPlanStrategy(initialProject.planStrategy || '');
      setPlanCategory(initialProject.planCategory || '');
      setDepartment(initialProject.department || '');
      setObjective(initialProject.objective || '');
      setTarget(initialProject.target || '');
      setExpectedResults(initialProject.expectedResults || '');
      setReason(initialProject.reason || initialProject.note || '');
      setTargetYear(`พ.ศ. ${initialProject.year || '2571'}`);
      setSelectedVillageNum(initialProject.villageNumber || 1);
      setB2571(initialProject.budgetByYear?.['2571']?.toString() || '0');
      setB2572(initialProject.budgetByYear?.['2572']?.toString() || '0');
      setB2573(initialProject.budgetByYear?.['2573']?.toString() || '0');
      setB2574(initialProject.budgetByYear?.['2574']?.toString() || '0');
      setB2575(initialProject.budgetByYear?.['2575']?.toString() || '0');
    } else {
      setName('');
      setCode('');
      setPlanStrategy('');
      setPlanCategory('');
      setDepartment('');
      setObjective('');
      setTarget('');
      setExpectedResults('');
      setReason('');
      setTargetYear('พ.ศ. 2571');
      setB2571('0');
      setB2572('0');
      setB2573('0');
      setB2574('0');
      setB2575('0');
    }
  }, [initialProject, isOpen]);

  // Total 5-year budget calculation
  const totalBudget = useMemo(() => {
    const n71 = Number(b2571.replace(/,/g, '')) || 0;
    const n72 = Number(b2572.replace(/,/g, '')) || 0;
    const n73 = Number(b2573.replace(/,/g, '')) || 0;
    const n74 = Number(b2574.replace(/,/g, '')) || 0;
    const n75 = Number(b2575.replace(/,/g, '')) || 0;
    return n71 + n72 + n73 + n74 + n75;
  }, [b2571, b2572, b2573, b2574, b2575]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (!name.trim()) return;

    const num2571 = Number(b2571.replace(/,/g, '')) || 0;
    const num2572 = Number(b2572.replace(/,/g, '')) || 0;
    const num2573 = Number(b2573.replace(/,/g, '')) || 0;
    const num2574 = Number(b2574.replace(/,/g, '')) || 0;
    const num2575 = Number(b2575.replace(/,/g, '')) || 0;
    const total5Years = num2571 + num2572 + num2573 + num2574 + num2575;

    // Suffix based on edition
    const suffix =
      currentEdition === 'additional'
        ? 'พ'
        : currentEdition === 'changed'
        ? 'ป'
        : currentEdition === 'amended'
        ? 'ก'
        : '';
    const codeSuffix = suffix ? `-${suffix}` : '';

    const yearNumeric = targetYear.replace('พ.ศ. ', '').trim() || '2571';

    const strat = planStrategy || DEVELOPMENT_STRATEGIES[0];
    const cat = planCategory || PLAN_CATEGORIES[0];
    const matchedVillage = ALL_VILLAGES.find((v) => v.villageNumber === selectedVillageNum) || ALL_VILLAGES[0];
    const finalCode =
      code.trim() ||
      initialProject?.code ||
      generateStandardProjectCode(strat, cat, Math.floor(Math.random() * 80 + 1));

    const updated: ProjectData = {
      id: initialProject?.id || `PRJ-CUSTOM-${Date.now()}`,
      orderNumber: initialProject?.orderNumber || Date.now(),
      code: finalCode,
      name: name.trim(),
      planStrategy: strat,
      planCategory: cat,
      edition: currentEdition,
      editionNumber: initialProject?.editionNumber || 1,
      publishStatus: initialProject?.publishStatus || 'published_first',
      objective: objective.trim(),
      target: target.trim(),
      expectedResults: expectedResults.trim(),
      budgetByYear: {
        '2571': num2571,
        '2572': num2572,
        '2573': num2573,
        '2574': num2574,
        '2575': num2575
      },
      budgetPlan: total5Years,
      budgetSource: initialProject?.budgetSource || '- ยังไม่ได้จัดสรร -',
      budgetApproved: initialProject?.budgetApproved || 0,
      approvedDate: initialProject?.approvedDate || '-',
      status: initialProject?.status || 'pending',
      department: department || DEPARTMENTS[0],
      year: yearNumeric,
      zone: matchedVillage.zone,
      village: matchedVillage.villageName,
      villageNumber: matchedVillage.villageNumber,
      note: reason.trim() || initialProject?.note,
      reason: reason.trim() || initialProject?.reason
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-in fade-in duration-150">
      <div
        id="modal-plan-project-form"
        className="bg-white rounded-2xl shadow-2xl w-[95vw] lg:w-[95%] max-w-[1400px] max-h-[92vh] sm:max-h-[94vh] flex flex-col overflow-hidden border border-slate-200"
      >
        {/* 1. Modal Header - Dark Green Matching Screenshot */}
        <div className="bg-[#0b4d3c] text-white px-6 py-4.5 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#06382b] border border-emerald-500/40 flex items-center justify-center text-emerald-300 shadow-inner">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="font-bold text-lg sm:text-xl leading-snug">
                  {isReadOnly
                    ? `รายละเอียดโครงการ (${editionLabel})`
                    : isEdit
                    ? `แก้ไขข้อมูลโครงการ (${editionLabel})`
                    : `เพิ่มข้อมูลโครงการใหม่ (${editionLabel})`}
                </h2>
                {isReadOnly && (
                  <span className="text-xs font-bold bg-amber-500/20 text-amber-200 border border-amber-400/30 px-2.5 py-0.5 rounded-full">
                    โหมดอ่านอย่างเดียว
                  </span>
                )}
              </div>
              <p className="text-sm text-emerald-100/90 font-medium mt-1">
                แผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575) — ประเภทรายการ: {editionLabel}
              </p>
            </div>
          </div>

          <button
            id="btn-close-project-form-modal"
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-emerald-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="ปิดหน้าต่าง"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 2. Modal Body - Grouped into Clear Sections */}
        <form
          onSubmit={handleSubmit}
          className="p-6 sm:p-8 flex-1 min-h-0 overflow-y-auto space-y-6 sm:space-y-7 text-base text-slate-800 bg-white"
        >
          {/* หมวดหมู่ 1: ข้อมูลพื้นฐาน */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200">
              <FileText className="w-5 h-5 text-emerald-700" />
              <h3 className="font-bold text-base sm:text-lg text-slate-900 tracking-wide">
                ข้อมูลพื้นฐาน
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1.1 ปี พ.ศ. บรรจุแผน */}
              <div>
                <label className="block text-base font-bold text-slate-800 mb-1.5">
                  ปี พ.ศ. บรรจุแผน
                </label>
                <select
                  value={targetYear}
                  disabled={isReadOnly}
                  onChange={(e) => setTargetYear(e.target.value)}
                  className={`w-full text-base border rounded-xl px-3.5 py-2.5 min-h-[44px] outline-none ${
                    isReadOnly
                      ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200 font-medium'
                      : 'bg-white text-slate-900 border-slate-300 focus:ring-2 focus:ring-emerald-500 cursor-pointer font-semibold'
                  }`}
                >
                  <option value="พ.ศ. 2571">พ.ศ. 2571</option>
                  <option value="พ.ศ. 2572">พ.ศ. 2572</option>
                  <option value="พ.ศ. 2573">พ.ศ. 2573</option>
                  <option value="พ.ศ. 2574">พ.ศ. 2574</option>
                  <option value="พ.ศ. 2575">พ.ศ. 2575</option>
                </select>
              </div>

              {/* 1.2 ประเภทรายการ (badge box with ผ.02 tag) */}
              <div>
                <label className="block text-base font-bold text-slate-800 mb-1.5">
                  ประเภทรายการ
                </label>
                <div className="flex items-center justify-between border border-emerald-300 bg-emerald-50/80 rounded-xl px-3.5 py-2.5 min-h-[44px]">
                  <span className="text-base font-bold text-emerald-950">
                    {editionLabel}
                  </span>
                  <span className="text-xs font-bold text-emerald-800 bg-white border border-emerald-400 px-2.5 py-0.5 rounded leading-normal">
                    ผ.02
                  </span>
                </div>
              </div>

              {/* 1.3 ประเด็นการพัฒนา (ยุทธศาสตร์) */}
              <div>
                <label className="block text-base font-bold text-slate-800 mb-1.5">
                  ประเด็นการพัฒนา (ยุทธศาสตร์)
                </label>
                <select
                  value={planStrategy}
                  disabled={isReadOnly}
                  onChange={(e) => setPlanStrategy(e.target.value)}
                  title={planStrategy || '-- เลือกประเด็นการพัฒนา --'}
                  className={`w-full text-base border rounded-xl px-3.5 py-2.5 min-h-[44px] truncate outline-none ${
                    isReadOnly
                      ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200'
                      : 'bg-white text-slate-900 border-slate-300 focus:ring-2 focus:ring-emerald-500 cursor-pointer font-medium'
                  }`}
                >
                  <option value="">-- เลือกประเด็นการพัฒนา --</option>
                  {DEVELOPMENT_STRATEGIES.map((s, idx) => (
                    <option key={idx} value={s} title={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* 1.4 แผนงาน */}
              <div>
                <label className="block text-base font-bold text-slate-800 mb-1.5">
                  แผนงาน
                </label>
                <select
                  value={planCategory}
                  disabled={isReadOnly}
                  onChange={(e) => setPlanCategory(e.target.value)}
                  className={`w-full text-base border rounded-xl px-3.5 py-2.5 min-h-[44px] truncate outline-none ${
                    isReadOnly
                      ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200'
                      : 'bg-white text-slate-900 border-slate-300 focus:ring-2 focus:ring-emerald-500 cursor-pointer font-medium'
                  }`}
                >
                  <option value="">-- เลือกแผนงาน --</option>
                  {PLAN_CATEGORIES.map((cat, idx) => (
                    <option key={idx} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              {/* ชื่อโครงการ * */}
              <label className="block text-base font-bold text-slate-800 mb-1.5">
                ชื่อโครงการ {!isReadOnly && <span className="text-red-500">*</span>}
              </label>
              <textarea
                rows={2}
                required={!isReadOnly}
                disabled={isReadOnly}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="เช่น โครงการก่อสร้างถนนคอนกรีตเสริมเหล็ก พร้อมระบบระบายน้ำ..."
                className={`w-full border rounded-xl px-3.5 py-3 text-base font-medium outline-none min-h-[64px] resize-y leading-relaxed ${
                  isReadOnly
                    ? 'bg-slate-100 text-slate-700 cursor-not-allowed border-slate-200'
                    : 'bg-white text-slate-900 border-slate-300 focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400'
                }`}
              />
            </div>
          </div>

          {/* หมวดหมู่ 2: รายละเอียดโครงการ */}
          <div className="space-y-4 pt-1">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200">
              <Target className="w-5 h-5 text-emerald-700" />
              <h3 className="font-bold text-base sm:text-lg text-slate-900 tracking-wide">
                รายละเอียดโครงการ
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-base font-bold text-slate-800 mb-2">
                  วัตถุประสงค์
                </label>
                <textarea
                  rows={3}
                  disabled={isReadOnly}
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  placeholder="เพื่ออำนวยความสะดวกในการสัญจรและขนส่งผลผลิตทางการเกษตรของประชาชน..."
                  className={`w-full border rounded-xl p-3.5 text-base outline-none leading-relaxed min-h-[88px] resize-y ${
                    isReadOnly
                      ? 'bg-slate-100 text-slate-600 cursor-not-allowed border-slate-200'
                      : 'bg-white text-slate-900 border-slate-300 focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400'
                  }`}
                />
              </div>

              <div>
                <label className="block text-base font-bold text-slate-800 mb-2">
                  เป้าหมาย (ผลผลิตของโครงการ)
                </label>
                <textarea
                  rows={3}
                  disabled={isReadOnly}
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="ก่อสร้างถนน คสล. กว้าง 6 เมตร ยาว 1,500 เมตร หนา 0.15 เมตร หรือมีพื้นที่ไม่น้อยกว่า..."
                  className={`w-full border rounded-xl p-3.5 text-base outline-none leading-relaxed min-h-[88px] resize-y ${
                    isReadOnly
                      ? 'bg-slate-100 text-slate-600 cursor-not-allowed border-slate-200'
                      : 'bg-white text-slate-900 border-slate-300 focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* หมวดหมู่ 3: งบประมาณ 5 ปี */}
          <div className="space-y-4 pt-1">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200">
              <Coins className="w-5 h-5 text-emerald-700" />
              <h3 className="font-bold text-base sm:text-lg text-slate-900 tracking-wide">
                งบประมาณ 5 ปี
              </h3>
            </div>

            <div className="border border-slate-200 rounded-2xl p-5 sm:p-6 bg-slate-50/80 space-y-4">
              {/* Header row with Link icon and Total budget pill */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 text-base font-bold text-slate-900">
                  <LinkIcon className="w-5 h-5 text-emerald-700" />
                  <span>ประมาณการงบประมาณรายปี (พ.ศ. 2571 - 2575)</span>
                </div>
                <div className="text-base font-bold px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-950 border border-emerald-300 shadow-2xs">
                  งบประมาณรวม: <span className="font-mono font-black text-emerald-900 text-lg">{totalBudget.toLocaleString()}</span> บาท
                </div>
              </div>

              {/* 5 Input columns */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center pt-1">
                <div>
                  <label className="block text-sm text-slate-700 font-bold mb-1.5">พ.ศ. 2571</label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={b2571}
                    onChange={(e) => setB2571(e.target.value)}
                    className={`w-full text-center border rounded-xl py-2.5 px-2 text-base font-mono font-bold outline-none min-h-[44px] ${
                      isReadOnly
                        ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200'
                        : 'bg-white border-slate-300 focus:ring-2 focus:ring-emerald-500 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-700 font-bold mb-1.5">พ.ศ. 2572</label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={b2572}
                    onChange={(e) => setB2572(e.target.value)}
                    className={`w-full text-center border rounded-xl py-2.5 px-2 text-base font-mono font-bold outline-none min-h-[44px] ${
                      isReadOnly
                        ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200'
                        : 'bg-white border-slate-300 focus:ring-2 focus:ring-emerald-500 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-700 font-bold mb-1.5">พ.ศ. 2573</label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={b2573}
                    onChange={(e) => setB2573(e.target.value)}
                    className={`w-full text-center border rounded-xl py-2.5 px-2 text-base font-mono font-bold outline-none min-h-[44px] ${
                      isReadOnly
                        ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200'
                        : 'bg-white border-slate-300 focus:ring-2 focus:ring-emerald-500 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-700 font-bold mb-1.5">พ.ศ. 2574</label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={b2574}
                    onChange={(e) => setB2574(e.target.value)}
                    className={`w-full text-center border rounded-xl py-2.5 px-2 text-base font-mono font-bold outline-none min-h-[44px] ${
                      isReadOnly
                        ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200'
                        : 'bg-white border-slate-300 focus:ring-2 focus:ring-emerald-500 text-slate-900'
                    }`}
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm text-slate-700 font-bold mb-1.5">พ.ศ. 2575</label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={b2575}
                    onChange={(e) => setB2575(e.target.value)}
                    className={`w-full text-center border rounded-xl py-2.5 px-2 text-base font-mono font-bold outline-none min-h-[44px] ${
                      isReadOnly
                        ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200'
                        : 'bg-white border-slate-300 focus:ring-2 focus:ring-emerald-500 text-slate-900'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* หมวดหมู่ 4: ผลลัพธ์และผู้รับผิดชอบ */}
          <div className="space-y-4 pt-1">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200">
              <Building2 className="w-5 h-5 text-emerald-700" />
              <h3 className="font-bold text-base sm:text-lg text-slate-900 tracking-wide">
                ผลลัพธ์และผู้รับผิดชอบ
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-base font-bold text-slate-800 mb-2">
                  ผลที่คาดว่าจะได้รับ
                </label>
                <textarea
                  rows={3}
                  disabled={isReadOnly}
                  value={expectedResults}
                  onChange={(e) => setExpectedResults(e.target.value)}
                  placeholder="ประชาชนสัญจรได้สะดวกรวดเร็วและปลอดภัย มีเส้นทางคมนาคมที่ได้มาตรฐาน ลดอุบัติเหตุ..."
                  className={`w-full border rounded-xl p-3.5 text-base outline-none leading-relaxed min-h-[88px] resize-y ${
                    isReadOnly
                      ? 'bg-slate-100 text-slate-600 cursor-not-allowed border-slate-200'
                      : 'bg-white text-slate-900 border-slate-300 focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-base font-bold text-slate-800 mb-1.5">
                    หน่วยงานรับผิดชอบหลัก
                  </label>
                  <select
                    value={department}
                    disabled={isReadOnly}
                    onChange={(e) => setDepartment(e.target.value)}
                    title={department || '-- เลือกหน่วยงานรับผิดชอบ --'}
                    className={`w-full text-base border rounded-xl px-3.5 py-2.5 min-h-[44px] truncate outline-none ${
                      isReadOnly
                        ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200'
                        : 'bg-white text-slate-900 border-slate-300 focus:ring-2 focus:ring-emerald-500 cursor-pointer font-medium'
                    }`}
                  >
                    <option value="">-- เลือกหน่วยงานรับผิดชอบ --</option>
                    {DEPARTMENTS.map((dept, idx) => (
                      <option key={idx} value={dept} title={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-base font-bold text-slate-800 mb-1.5">
                    พื้นที่ดำเนินการ (เขต / หมู่บ้าน)
                  </label>
                  <select
                    id="select-plan-project-village"
                    value={selectedVillageNum}
                    disabled={isReadOnly}
                    onChange={(e) => setSelectedVillageNum(Number(e.target.value))}
                    className={`w-full text-base border rounded-xl px-3.5 py-2.5 min-h-[44px] truncate outline-none ${
                      isReadOnly
                        ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200'
                        : 'bg-white text-slate-900 border-slate-300 focus:ring-2 focus:ring-emerald-500 cursor-pointer font-medium'
                    }`}
                  >
                    {SILA_ZONES.map((zone) => (
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
              </div>
            </div>
          </div>

          {/* หมวดหมู่พิเศษ: เหตุผลและความจำเป็น */}
          {currentEdition !== 'first' && !isReadOnly && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-2.5 pb-2 border-b border-amber-200">
                <AlertCircle className="w-5 h-5 text-amber-700" />
                <h3 className="font-bold text-base sm:text-lg text-amber-950 tracking-wide">
                  เหตุผลและความจำเป็น
                </h3>
              </div>
              <div className="bg-amber-50/80 border border-amber-300 rounded-2xl p-5 space-y-2.5">
                <label className="block text-base font-bold text-amber-950">
                  เหตุผลและความจำเป็น ที่ต้อง{editionLabel}
                </label>
                <textarea
                  rows={4}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="ระบุเหตุผลความจำเป็นและข้อเท็จจริงประกอบการพิจารณา..."
                  className="w-full border border-amber-300 rounded-xl px-4 py-3 text-base bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-slate-400 min-h-[104px] resize-y leading-relaxed font-normal"
                />
              </div>
            </div>
          )}

          {/* ส่วนท้ายฟอร์มและปุ่มกด (Modal Footer) */}
          <div className="pt-5 border-t border-slate-200 flex items-center justify-between gap-3 mt-6">
            <div>
              {isReadOnly && (
                <span className="text-sm text-slate-600 font-bold bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-200">
                  โหมดอ่านอย่างเดียว (Read-Only) - สิทธิ์เข้าชมทั่วไป
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                id="btn-cancel-project-form"
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-base font-bold text-slate-700 bg-[#F1F5F9] hover:bg-slate-200 border border-slate-300 rounded-xl transition-colors cursor-pointer shadow-2xs min-h-[44px]"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
                <span>{isReadOnly ? 'ปิดหน้าต่าง' : 'กลับไป'}</span>
              </button>
              {!isReadOnly && (
                <button
                  id="btn-submit-project-form"
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-base font-bold bg-[#006853] hover:bg-[#005242] text-white rounded-xl shadow-xs transition-colors cursor-pointer min-h-[44px]"
                >
                  <Save className="w-5 h-5" />
                  <span>บันทึกข้อมูล</span>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
