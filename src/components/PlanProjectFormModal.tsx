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
import { ProjectData, PlanEdition, ALL_VILLAGES } from '../types';
import { DEVELOPMENT_STRATEGIES, DEPARTMENTS } from '../utils/constants';
import { PLAN_CATEGORIES } from '../data/initialData';
import { generateStandardProjectCode } from '../utils/projectCode';

interface PlanProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: ProjectData) => void;
  initialProject?: ProjectData | null;
  defaultEdition: PlanEdition;
}

export const PlanProjectFormModal: React.FC<PlanProjectFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialProject,
  defaultEdition
}) => {
  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-in fade-in duration-150">
      <div
        id="modal-plan-project-form"
        className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200"
      >
        {/* 1. Modal Header - Dark Green Matching Screenshot */}
        <div className="bg-[#0b4d3c] text-white px-6 py-3 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#06382b] border border-emerald-500/40 flex items-center justify-center text-emerald-300 shadow-inner">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm sm:text-base leading-snug">
                {isEdit
                  ? `แก้ไขข้อมูลโครงการ (${editionLabel})`
                  : `เพิ่มข้อมูลโครงการใหม่ (${editionLabel})`}
              </h2>
              <p className="text-[11px] text-emerald-100/90 font-light mt-0.5">
                แผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575) — ประเภทรายการ: {editionLabel}
              </p>
            </div>
          </div>

          <button
            id="btn-close-project-form-modal"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Modal Body - Grouped into Clear Sections */}
        <form
          onSubmit={handleSubmit}
          className="p-5 sm:p-6 flex-1 min-h-0 overflow-y-auto space-y-5 text-xs text-slate-700 bg-white"
        >
          {/* หมวดหมู่ 1: ข้อมูลพื้นฐาน */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200">
              <FileText className="w-4 h-4 text-emerald-700" />
              <h3 className="font-bold text-xs text-slate-800 tracking-wide">
                ข้อมูลพื้นฐาน
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* 1.1 ปี พ.ศ. บรรจุแผน */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ปี พ.ศ. บรรจุแผน
                </label>
                <select
                  value={targetYear}
                  onChange={(e) => setTargetYear(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ประเภทรายการ
                </label>
                <div className="flex items-center justify-between border border-emerald-300 bg-emerald-50/60 rounded-md px-3 py-1.5 h-[34px]">
                  <span className="text-xs font-semibold text-emerald-900">
                    {editionLabel}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-white border border-emerald-400 px-1 py-0.5 rounded leading-none">
                    ผ.02
                  </span>
                </div>
              </div>

              {/* 1.3 ประเด็นการพัฒนา (ยุทธศาสตร์) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ประเด็นการพัฒนา (ยุทธศาสตร์)
                </label>
                <select
                  value={planStrategy}
                  onChange={(e) => setPlanStrategy(e.target.value)}
                  title={planStrategy || '-- เลือกประเด็นการพัฒนา --'}
                  className="w-full text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none truncate cursor-pointer"
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  แผนงาน
                </label>
                <select
                  value={planCategory}
                  onChange={(e) => setPlanCategory(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none truncate cursor-pointer"
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* รหัสโครงการ (Project Code ID) */}
              <div className="md:col-span-1">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    รหัสโครงการ (Project Code)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const strat = planStrategy || DEVELOPMENT_STRATEGIES[0];
                      const cat = planCategory || PLAN_CATEGORIES[0];
                      const generated = generateStandardProjectCode(strat, cat, Math.floor(Math.random() * 80 + 1));
                      setCode(generated);
                    }}
                    className="text-[11px] text-emerald-700 hover:text-emerald-800 hover:underline font-medium cursor-pointer"
                  >
                    สร้างรหัสอัตโนมัติ
                  </button>
                </div>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="เช่น ป.1-เคหะ-001"
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-xs font-mono font-medium focus:ring-2 focus:ring-emerald-500 outline-none bg-white placeholder:text-slate-400"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  รูปแบบ: [ป.ประเด็น]-[ตัวย่อแผนงาน]-[ลำดับ 3 หลัก]
                </p>
              </div>

              {/* ชื่อโครงการ * */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อโครงการ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น โครงการก่อสร้างถนนคอนกรีตเสริมเหล็ก..."
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none bg-white placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>

          {/* หมวดหมู่ 2: รายละเอียดโครงการ */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200">
              <Target className="w-4 h-4 text-emerald-700" />
              <h3 className="font-bold text-xs text-slate-800 tracking-wide">
                รายละเอียดโครงการ
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  วัตถุประสงค์
                </label>
                <textarea
                  rows={3}
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  placeholder="เพื่ออำนวยความสะดวกในการสัญจรและขนส่งผลผลิตทางการเกษตร..."
                  className="w-full border border-slate-300 rounded-md p-2.5 text-xs focus:ring-2 focus:ring-emerald-500 outline-none bg-white placeholder:text-slate-400 leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  เป้าหมาย (ผลผลิตของโครงการ)
                </label>
                <textarea
                  rows={3}
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="ก่อสร้างถนน คสล. กว้าง 6 เมตร ยาว 1,500 เมตร หนา 0.15 เมตร..."
                  className="w-full border border-slate-300 rounded-md p-2.5 text-xs focus:ring-2 focus:ring-emerald-500 outline-none bg-white placeholder:text-slate-400 leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* หมวดหมู่ 3: งบประมาณ 5 ปี */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200">
              <Coins className="w-4 h-4 text-emerald-700" />
              <h3 className="font-bold text-xs text-slate-800 tracking-wide">
                งบประมาณ 5 ปี
              </h3>
            </div>

            <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/60 space-y-2">
              {/* Header row with Link icon and Total budget pill */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <LinkIcon className="w-3.5 h-3.5 text-emerald-700" />
                  <span>ประมาณการงบประมาณรายปี (พ.ศ. 2571 - 2575)</span>
                </div>
                <div className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                  งบประมาณรวม: <span className="font-mono font-bold">{totalBudget.toLocaleString()}</span> บาท
                </div>
              </div>

              {/* 5 Input columns */}
              <div className="grid grid-cols-5 gap-2 text-center pt-1">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">พ.ศ. 2571</label>
                  <input
                    type="text"
                    value={b2571}
                    onChange={(e) => setB2571(e.target.value)}
                    className="w-full text-center border border-slate-300 rounded-md py-1.5 text-xs font-mono font-semibold bg-white focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">พ.ศ. 2572</label>
                  <input
                    type="text"
                    value={b2572}
                    onChange={(e) => setB2572(e.target.value)}
                    className="w-full text-center border border-slate-300 rounded-md py-1.5 text-xs font-mono font-semibold bg-white focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">พ.ศ. 2573</label>
                  <input
                    type="text"
                    value={b2573}
                    onChange={(e) => setB2573(e.target.value)}
                    className="w-full text-center border border-slate-300 rounded-md py-1.5 text-xs font-mono font-semibold bg-white focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">พ.ศ. 2574</label>
                  <input
                    type="text"
                    value={b2574}
                    onChange={(e) => setB2574(e.target.value)}
                    className="w-full text-center border border-slate-300 rounded-md py-1.5 text-xs font-mono font-semibold bg-white focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">พ.ศ. 2575</label>
                  <input
                    type="text"
                    value={b2575}
                    onChange={(e) => setB2575(e.target.value)}
                    className="w-full text-center border border-slate-300 rounded-md py-1.5 text-xs font-mono font-semibold bg-white focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* หมวดหมู่ 4: ผลลัพธ์และผู้รับผิดชอบ */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200">
              <Building2 className="w-4 h-4 text-emerald-700" />
              <h3 className="font-bold text-xs text-slate-800 tracking-wide">
                ผลลัพธ์และผู้รับผิดชอบ
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ผลที่คาดว่าจะได้รับ
                </label>
                <input
                  type="text"
                  value={expectedResults}
                  onChange={(e) => setExpectedResults(e.target.value)}
                  placeholder="ประชาชนสัญจรได้สะดวกรวดเร็วและปลอดภัย มีเส้นทางคมนาคมที่ได้มาตรฐาน..."
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none bg-white placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  หน่วยงานรับผิดชอบหลัก
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  title={department || '-- เลือกหน่วยงานรับผิดชอบ --'}
                  className="w-full text-xs border border-slate-300 rounded-md px-2.5 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer truncate"
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  พื้นที่ดำเนินการ (เขต / หมู่บ้าน)
                </label>
                <select
                  value={selectedVillageNum}
                  onChange={(e) => setSelectedVillageNum(Number(e.target.value))}
                  className="w-full text-xs border border-slate-300 rounded-md px-2.5 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer truncate"
                >
                  {ALL_VILLAGES.map((v) => (
                    <option key={v.villageNumber} value={v.villageNumber}>
                      [{v.zone}] {v.villageName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* หมวดหมู่พิเศษ: เหตุผลและความจำเป็น (แสดงเฉพาะฉบับเพิ่มเติม / เปลี่ยนแปลง / แก้ไข) */}
          {currentEdition !== 'first' && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2 pb-1 border-b border-amber-200">
                <AlertCircle className="w-4 h-4 text-amber-700" />
                <h3 className="font-bold text-xs text-amber-900 tracking-wide">
                  เหตุผลและความจำเป็น
                </h3>
              </div>
              <div className="bg-amber-50/50 border border-amber-300 rounded-xl p-3 space-y-1.5">
                <label className="block text-xs font-semibold text-amber-900">
                  เหตุผลและความจำเป็น ที่ต้อง{editionLabel}
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="ระบุเหตุผลความจำเป็นและข้อเท็จจริงประกอบการพิจารณา..."
                  className="w-full border border-amber-300 rounded-lg px-3 py-2 text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-slate-400"
                />
              </div>
            </div>
          )}

          {/* ส่วนท้ายฟอร์มและปุ่มกด (Modal Footer) */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3 mt-4">
            <button
              id="btn-cancel-project-form"
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-700 bg-[#F1F5F9] hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-600" />
              <span>กลับไป</span>
            </button>
            <button
              id="btn-submit-project-form"
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold bg-[#006853] hover:bg-[#005242] text-white rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>บันทึกข้อมูล</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
