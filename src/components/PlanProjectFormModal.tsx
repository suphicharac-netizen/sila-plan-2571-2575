import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  AlertCircle,
  PlusCircle,
  CheckCircle2,
  Check,
  Image as ImageIcon,
  Upload,
  Trash2
} from 'lucide-react';
import { ProjectData, PlanEdition, ALL_VILLAGES, SILA_ZONES, UserAccount, ProjectAreaType } from '../types';
import { DEVELOPMENT_STRATEGIES, MUNICIPAL_STRATEGIES, DEPARTMENTS, MUNICIPAL_FACILITIES } from '../utils/constants';
import { PLAN_CATEGORIES } from '../data/initialData';
import { generateStandardProjectCode } from '../utils/projectCode';

interface PlanProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: ProjectData, keepModalOpen?: boolean) => void;
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
  const formRef = useRef<HTMLFormElement>(null);
  const nameInputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);
  const [isSubsequentNewItem, setIsSubsequentNewItem] = useState(false);

  const [targetYear, setTargetYear] = useState<string>('พ.ศ. 2571');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [planStrategy, setPlanStrategy] = useState('');
  const [strategy, setStrategy] = useState('');
  const [planCategory, setPlanCategory] = useState('');
  const [department, setDepartment] = useState('');
  const [objective, setObjective] = useState('');
  const [target, setTarget] = useState('');
  const [expectedResults, setExpectedResults] = useState('');
  const [reason, setReason] = useState('');
  const [imageUrl, setImageUrl] = useState<string>('');

  // Dynamic Operating Area states
  const [areaType, setAreaType] = useState<ProjectAreaType>('village');
  const [selectedVillageNum, setSelectedVillageNum] = useState<number>(1);
  const [selectedFacility, setSelectedFacility] = useState<string>(MUNICIPAL_FACILITIES[0]);
  const [customLocation, setCustomLocation] = useState<string>('');

  // 5-Year Budgets
  const [b2571, setB2571] = useState<string>('0');
  const [b2572, setB2572] = useState<string>('0');
  const [b2573, setB2573] = useState<string>('0');
  const [b2574, setB2574] = useState<string>('0');
  const [b2575, setB2575] = useState<string>('0');

  // Initialize or reset values when modal opens or initialProject changes
  useEffect(() => {
    setIsSubsequentNewItem(false);
    setShowSuccessAlert(false);
    setToastMessage(null);
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }

    if (initialProject) {
      setName(initialProject.name || '');
      setCode(initialProject.code || '');
      setPlanStrategy(initialProject.planStrategy || '');
      setStrategy(initialProject.strategy || '');
      setPlanCategory(initialProject.planCategory || '');
      setDepartment(initialProject.department || '');
      setObjective(initialProject.objective || '');
      setTarget(initialProject.target || '');
      setExpectedResults(initialProject.expectedResults || '');
      setReason(initialProject.reason || initialProject.note || '');
      setImageUrl(initialProject.imageUrl || initialProject.image || '');
      setTargetYear(`พ.ศ. ${initialProject.year || '2571'}`);
      setB2571(initialProject.budgetByYear?.['2571']?.toString() || '0');
      setB2572(initialProject.budgetByYear?.['2572']?.toString() || '0');
      setB2573(initialProject.budgetByYear?.['2573']?.toString() || '0');
      setB2574(initialProject.budgetByYear?.['2574']?.toString() || '0');
      setB2575(initialProject.budgetByYear?.['2575']?.toString() || '0');

      // Determine area type from initialProject
      if (
        initialProject.zone === 'ภายในหน่วยงาน' ||
        initialProject.zone === 'อาคาร/หน่วยงานในสังกัด' ||
        MUNICIPAL_FACILITIES.some((f) => initialProject.village?.includes(f)) ||
        (!initialProject.villageNumber && (initialProject.village?.includes('สำนักงาน') || initialProject.village?.includes('ศูนย์พัฒนาเด็กเล็ก') || initialProject.village?.includes('โรงเรียน')))
      ) {
        setAreaType('facility');
        setSelectedFacility(initialProject.village || MUNICIPAL_FACILITIES[0]);
        setCustomLocation('');
        setSelectedVillageNum(1);
      } else if (
        initialProject.zone === 'ภายในเขต/ภายนอกเขต' ||
        initialProject.zone === 'พื้นที่ภาพรวม / นอกเขต' ||
        initialProject.zone === 'ภาพรวม/นอกเขต' ||
        initialProject.villageNumber === 0 ||
        (initialProject.village && (initialProject.village.includes('ทุกหมู่บ้าน') || initialProject.village.includes('นอกเขต')))
      ) {
        setAreaType('custom');
        setCustomLocation(initialProject.village || '');
        setSelectedFacility(MUNICIPAL_FACILITIES[0]);
        setSelectedVillageNum(1);
      } else {
        setAreaType('village');
        setSelectedVillageNum(initialProject.villageNumber || 1);
        setSelectedFacility(MUNICIPAL_FACILITIES[0]);
        setCustomLocation('');
      }
    } else {
      setName('');
      setCode('');
      setPlanStrategy('');
      setStrategy('');
      setPlanCategory('');
      setDepartment('');
      setObjective('');
      setTarget('');
      setExpectedResults('');
      setReason('');
      setImageUrl('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTargetYear('พ.ศ. 2571');
      setB2571('0');
      setB2572('0');
      setB2573('0');
      setB2574('0');
      setB2575('0');
      setAreaType('village');
      setSelectedVillageNum(1);
      setSelectedFacility(MUNICIPAL_FACILITIES[0]);
      setCustomLocation('');
    }
  }, [initialProject, isOpen]);

  // Image Upload Handlers
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|png|jpg|webp)$/i)) {
      alert('กรุณาเลือกไฟล์รูปภาพที่เป็นนามสกุล .jpg หรือ .png');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('ขนาดไฟล์รูปภาพต้องไม่เกิน 5 MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setImageUrl(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setImageUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Total 5-year budget calculation
  const totalBudget = useMemo(() => {
    const n71 = Number(b2571.replace(/,/g, '')) || 0;
    const n72 = Number(b2572.replace(/,/g, '')) || 0;
    const n73 = Number(b2573.replace(/,/g, '')) || 0;
    const n74 = Number(b2574.replace(/,/g, '')) || 0;
    const n75 = Number(b2575.replace(/,/g, '')) || 0;
    return n71 + n72 + n73 + n74 + n75;
  }, [b2571, b2572, b2573, b2574, b2575]);

  const resetFormFields = () => {
    setName('');
    setCode('');
    setPlanStrategy('');
    setStrategy('');
    setPlanCategory('');
    setDepartment('');
    setObjective('');
    setTarget('');
    setExpectedResults('');
    setReason('');
    setImageUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setTargetYear('พ.ศ. 2571');
    setB2571('0');
    setB2572('0');
    setB2573('0');
    setB2574('0');
    setB2575('0');
    setAreaType('village');
    setSelectedVillageNum(1);
    setSelectedFacility(MUNICIPAL_FACILITIES[0]);
    setCustomLocation('');
  };

  const buildProjectData = (forceNew: boolean): ProjectData | null => {
    if (!name.trim()) {
      alert('กรุณากรอกชื่อโครงการ');
      return null;
    }

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

    // Compute dynamic operating area fields
    let finalZone = '';
    let finalVillage = '';
    let finalVillageNum: number | undefined = undefined;

    if (areaType === 'village') {
      const matchedVillage = ALL_VILLAGES.find((v) => v.villageNumber === selectedVillageNum) || ALL_VILLAGES[0];
      finalZone = matchedVillage.zone;
      finalVillage = matchedVillage.villageName;
      finalVillageNum = matchedVillage.villageNumber;
    } else if (areaType === 'facility') {
      finalZone = 'ภายในหน่วยงาน';
      finalVillage = selectedFacility || MUNICIPAL_FACILITIES[0];
      finalVillageNum = 0;
    } else {
      finalZone = 'ภายในเขต/ภายนอกเขต';
      finalVillage = customLocation.trim() || 'ทุกหมู่บ้านในเขตเทศบาล';
      finalVillageNum = 0;
    }

    const finalCode =
      code.trim() ||
      (!forceNew && initialProject?.code) ||
      generateStandardProjectCode(strat, cat, Math.floor(Math.random() * 80 + 1));

    const updated: ProjectData = {
      ...(!forceNew && initialProject ? initialProject : {}),
      id: (!forceNew && initialProject?.id) || `PRJ-CUSTOM-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      orderNumber: (!forceNew && initialProject?.orderNumber && initialProject.orderNumber < 10000) ? initialProject.orderNumber : 1,
      code: finalCode,
      name: name.trim(),
      planStrategy: strat,
      strategy: strategy.trim() || undefined,
      planCategory: cat,
      edition: currentEdition,
      editionNumber: (!forceNew && initialProject?.editionNumber) || 1,
      publishStatus: (!forceNew && initialProject?.publishStatus) || 'pending_publish',
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
      budgetSource: (!forceNew && initialProject?.budgetSource) || '- ยังไม่ได้จัดสรร -',
      budgetApproved: (!forceNew && initialProject?.budgetApproved) || 0,
      approvedDate: (!forceNew && initialProject?.approvedDate) || '-',
      status: (!forceNew && initialProject?.status) || 'pending',
      department: department || DEPARTMENTS[0],
      year: yearNumeric,
      zone: finalZone,
      village: finalVillage,
      villageNumber: finalVillageNum,
      note: reason.trim() || (!forceNew ? initialProject?.note : undefined),
      reason: reason.trim() || (!forceNew ? initialProject?.reason : undefined),
      imageUrl: imageUrl.trim() || undefined,
      image: imageUrl.trim() || undefined
    };

    return updated;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    const project = buildProjectData(isSubsequentNewItem);
    if (!project) return;

    onSave(project, false);
    onClose();
  };

  const handleConfirmSuccessAlert = () => {
    setShowSuccessAlert(false);
    setTimeout(() => {
      nameInputRef.current?.focus();
    }, 80);
  };

  const handleSaveAndAddNew = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isReadOnly) return;
    const project = buildProjectData(isSubsequentNewItem);
    if (!project) return;

    // Save project with keepModalOpen = true (DO NOT close modal)
    onSave(project, true);
    setIsSubsequentNewItem(true);
    resetFormFields();

    formRef.current?.scrollTo({ top: 0, behavior: 'smooth' });

    // Show SweetAlert popup dialog
    setShowSuccessAlert(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-in fade-in duration-150">
      <div
        id="modal-plan-project-form"
        className="relative bg-white rounded-2xl shadow-2xl w-[95vw] lg:w-[95%] max-w-[1400px] max-h-[92vh] sm:max-h-[94vh] flex flex-col overflow-hidden border border-slate-200"
      >
        {/* 1. Modal Header - Dark Green Matching Screenshot */}
        <div className="bg-[#0b4d3c] text-white px-6 py-4.5 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#06382b] border border-emerald-500/40 flex items-center justify-center text-emerald-300 shadow-inner">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2
                  className="font-bold text-lg sm:text-xl leading-snug break-words line-clamp-1 max-w-xl sm:max-w-2xl lg:max-w-3xl"
                  title={isEdit ? `แก้ไขข้อมูลโครงการ - ${initialProject?.name || name}` : undefined}
                >
                  {isReadOnly
                    ? `รายละเอียดโครงการ - ${initialProject?.name || name}`
                    : isSubsequentNewItem
                    ? `เพิ่มข้อมูลโครงการใหม่ (${editionLabel})`
                    : isEdit
                    ? `แก้ไขข้อมูลโครงการ - ${initialProject?.name || name}`
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
            className="w-8 h-8 sm:w-9 sm:h-9 bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg shadow-xs flex items-center justify-center cursor-pointer transition-colors p-0"
            title="ปิดหน้าต่าง"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5 stroke-[2.2]" />
          </button>
        </div>

        {/* 2. Modal Body - Grouped into Clear Sections */}
        <form
          ref={formRef}
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
              {/* 1.1 ปี พ.ศ. บรรจุแผน */}
              <div>
                <label className="block text-sm sm:text-base font-bold text-slate-800 mb-1.5">
                  ปี พ.ศ. บรรจุแผน
                </label>
                <select
                  value={targetYear}
                  disabled={isReadOnly}
                  onChange={(e) => setTargetYear(e.target.value)}
                  className={`w-full text-base border rounded-xl px-3 py-2.5 min-h-[44px] outline-none ${
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
                <label className="block text-sm sm:text-base font-bold text-slate-800 mb-1.5">
                  ประเภทรายการ
                </label>
                <div className="flex items-center justify-between border border-emerald-300 bg-emerald-50/80 rounded-xl px-3 py-2.5 min-h-[44px]">
                  <span className="text-base font-bold text-emerald-950 truncate">
                    {editionLabel}
                  </span>
                  <span className="text-xs font-bold text-emerald-800 bg-white border border-emerald-400 px-2 py-0.5 rounded leading-normal shrink-0">
                    ผ.02
                  </span>
                </div>
              </div>

              {/* 1.3 ประเด็นการพัฒนา */}
              <div>
                <label className="block text-sm sm:text-base font-bold text-slate-800 mb-1.5">
                  ประเด็นการพัฒนา
                </label>
                <select
                  value={planStrategy}
                  disabled={isReadOnly}
                  onChange={(e) => setPlanStrategy(e.target.value)}
                  title={planStrategy || '-- เลือกประเด็นการพัฒนา --'}
                  className={`w-full text-base border rounded-xl px-3 py-2.5 min-h-[44px] truncate outline-none ${
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

              {/* 1.4 ยุทธศาสตร์การพัฒนา */}
              <div>
                <label className="block text-sm sm:text-base font-bold text-slate-800 mb-1.5">
                  ยุทธศาสตร์
                </label>
                <select
                  value={strategy}
                  disabled={isReadOnly}
                  onChange={(e) => setStrategy(e.target.value)}
                  title={strategy || '-- เลือกยุทธศาสตร์ --'}
                  className={`w-full text-base border rounded-xl px-3 py-2.5 min-h-[44px] truncate outline-none ${
                    isReadOnly
                      ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200'
                      : 'bg-white text-slate-900 border-slate-300 focus:ring-2 focus:ring-emerald-500 cursor-pointer font-medium'
                  }`}
                >
                  <option value="">-- เลือกยุทธศาสตร์ --</option>
                  {MUNICIPAL_STRATEGIES.map((st, idx) => (
                    <option key={idx} value={st} title={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              {/* 1.5 แผนงาน */}
              <div>
                <label className="block text-sm sm:text-base font-bold text-slate-800 mb-1.5">
                  แผนงาน
                </label>
                <select
                  value={planCategory}
                  disabled={isReadOnly}
                  onChange={(e) => setPlanCategory(e.target.value)}
                  className={`w-full text-base border rounded-xl px-3 py-2.5 min-h-[44px] truncate outline-none ${
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
                ref={nameInputRef}
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

          {/* หมวดหมู่ 3: รูปภาพประกอบโครงการ (Project Image Upload & Preview) */}
          <div className="space-y-4 pt-1">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <ImageIcon className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-base sm:text-lg text-slate-900 tracking-wide">
                  รูปภาพประกอบโครงการ
                </h3>
              </div>
              {imageUrl && !isReadOnly && (
                <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>มีรูปภาพประกอบโครงการแล้ว</span>
                </span>
              )}
            </div>

            {/* Hidden Native File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/jpg, image/webp"
              disabled={isReadOnly}
              onChange={handleImageChange}
              className="hidden"
              id="input-project-image-file"
            />

            {imageUrl ? (
              /* Preview Mode */
              <div className="border border-slate-200 rounded-2xl p-4 sm:p-5 bg-slate-50/70 space-y-4">
                <div className="flex flex-col sm:flex-row items-center gap-5">
                  {/* Image Preview with object-fit: cover */}
                  <div className="relative w-full sm:w-80 h-48 sm:h-52 rounded-xl overflow-hidden bg-slate-900/5 border border-slate-200 shadow-sm shrink-0 group">
                    <img
                      src={imageUrl}
                      alt="ตัวอย่างรูปภาพโครงการ"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute top-2 left-2 bg-slate-900/75 text-white text-[11px] font-semibold px-2.5 py-1 rounded-md backdrop-blur-xs flex items-center gap-1 shadow-xs">
                      <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                      <span>ภาพตัวอย่าง (Preview)</span>
                    </div>
                  </div>

                  {/* Info & Action Buttons */}
                  <div className="flex-1 space-y-3 w-full">
                    <div>
                      <div className="text-base font-bold text-slate-900">
                        ภาพตัวอย่างสำหรับแสดงผลบนการ์ดโครงการ
                      </div>
                      <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                        ภาพนี้จะแสดงผลเป็นภาพหน้าปกบนการ์ดโครงการในหน้าระบบข้อมูลสำหรับประชาชน และหน้ารายละเอียดโครงการแบบอัตราส่วนภาพมาตรฐาน (Cover)
                      </p>
                    </div>

                    {!isReadOnly && (
                      <div className="flex items-center gap-2.5 flex-wrap pt-1">
                        <button
                          type="button"
                          id="btn-change-project-image"
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold border border-slate-300 rounded-xl shadow-2xs hover:border-emerald-500 hover:text-emerald-700 transition-colors cursor-pointer"
                        >
                          <Upload className="w-4 h-4 text-emerald-600" />
                          <span>เปลี่ยนรูป</span>
                        </button>

                        <button
                          type="button"
                          id="btn-remove-project-image"
                          onClick={handleRemoveImage}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-sm font-bold border border-rose-200 rounded-xl shadow-2xs transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4 text-rose-600" />
                          <span>ลบรูปภาพ</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Upload Trigger Dropzone */
              <div
                onClick={() => {
                  if (!isReadOnly) fileInputRef.current?.click();
                }}
                className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all ${
                  isReadOnly
                    ? 'border-slate-200 bg-slate-50/50 cursor-not-allowed'
                    : 'border-slate-300 hover:border-emerald-500 bg-slate-50/50 hover:bg-emerald-50/30 cursor-pointer group'
                }`}
              >
                <div className="max-w-md mx-auto space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center mx-auto group-hover:scale-110 group-hover:bg-emerald-200/80 transition-transform">
                    <Upload className="w-7 h-7 stroke-[2.2]" />
                  </div>
                  <div>
                    <div className="text-base font-bold text-slate-800 group-hover:text-emerald-800 transition-colors">
                      {isReadOnly ? 'ไม่มีรูปภาพประกอบโครงการ' : 'คลิกเพื่อเลือกรูปภาพ หรือลากไฟล์มาวางที่นี่'}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      รองรับไฟล์ภาพมาตรฐาน .jpg, .jpeg, .png (ขนาดแนะนำไม่เกิน 5 MB)
                    </p>
                  </div>
                  {!isReadOnly && (
                    <button
                      type="button"
                      id="btn-trigger-upload-image"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-xs hover:shadow transition-all cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      <span>เลือกรูปภาพ / Upload Image</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* หมวดหมู่ 4: งบประมาณ 5 ปี */}
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

              {/* พื้นที่ดำเนินการ (Dynamic 2-Field Inline Row) */}
              <div>
                <label className="block text-base font-bold text-slate-800 mb-1.5">
                  พื้นที่ดำเนินการ
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* ช่องที่ 1 (ประเภทพื้นที่): 3 ตัวเลือกหลัก */}
                  <div>
                    <select
                      id="select-plan-project-area-type"
                      value={areaType}
                      disabled={isReadOnly}
                      onChange={(e) => setAreaType(e.target.value as ProjectAreaType)}
                      className={`w-full text-base border rounded-xl px-3.5 py-2.5 min-h-[44px] truncate outline-none ${
                        isReadOnly
                          ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200'
                          : 'bg-white text-slate-900 border-slate-300 focus:ring-2 focus:ring-emerald-500 cursor-pointer font-medium'
                      }`}
                    >
                      <option value="village">1) รายหมู่บ้าน (เขต 1-2-3)</option>
                      <option value="facility">2) ภายในหน่วยงาน</option>
                      <option value="custom">3) ภายในเขต/ภายนอกเขต</option>
                    </select>
                  </div>

                  {/* ช่องที่ 2 (Dynamic Field Response ตามตัวเลือกช่องแรก) */}
                  <div>
                    {areaType === 'village' && (
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
                          <optgroup key={zone.id} label={`${zone.name} (${zone.villages.length} หมู่บ้าน)`}>
                            {zone.villages.map((v) => (
                              <option key={v.villageNumber} value={v.villageNumber}>
                                {v.villageName}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    )}

                    {areaType === 'facility' && (
                      <select
                        id="select-plan-project-facility"
                        value={selectedFacility}
                        disabled={isReadOnly}
                        onChange={(e) => setSelectedFacility(e.target.value)}
                        className={`w-full text-base border rounded-xl px-3.5 py-2.5 min-h-[44px] truncate outline-none ${
                          isReadOnly
                            ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200'
                            : 'bg-white text-slate-900 border-slate-300 focus:ring-2 focus:ring-emerald-500 cursor-pointer font-medium'
                        }`}
                      >
                        {MUNICIPAL_FACILITIES.map((facility) => (
                          <option key={facility} value={facility}>
                            {facility}
                          </option>
                        ))}
                      </select>
                    )}

                    {areaType === 'custom' && (
                      <input
                        id="input-plan-project-custom-area"
                        type="text"
                        disabled={isReadOnly}
                        value={customLocation}
                        onChange={(e) => setCustomLocation(e.target.value)}
                        placeholder='พิมพ์ระบุสถานที่ เช่น "ทุกหมู่บ้านในเขตเทศบาล" หรือ "นอกเขตพื้นที่เทศบาล"'
                        className={`w-full text-base border rounded-xl px-3.5 py-2.5 min-h-[44px] outline-none ${
                          isReadOnly
                            ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200'
                            : 'bg-white text-slate-900 border-slate-300 focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400 font-medium'
                        }`}
                      />
                    )}
                  </div>
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
              {/* ปุ่มยกเลิก (สีเทา) */}
              <button
                id="btn-cancel-project-form"
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-base font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-colors cursor-pointer shadow-2xs min-h-[44px]"
              >
                <X className="w-5 h-5 text-slate-500" />
                <span>{isReadOnly ? 'ปิดหน้าต่าง' : isEdit ? 'ยกเลิก' : 'กลับไป'}</span>
              </button>
              {!isReadOnly && (
                <>
                  {!isEdit && (
                    <button
                      id="btn-save-and-add-new-project"
                      type="button"
                      onClick={handleSaveAndAddNew}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-base font-bold bg-[#E6F4EA] hover:bg-[#D2EBD8] text-[#006853] border border-[#A8DBC0] hover:border-[#006853] rounded-xl shadow-2xs transition-all cursor-pointer min-h-[44px]"
                      title="บันทึกข้อมูลโครงการนี้ทันที และคงหน้าต่างไว้พร้อมสำหรับกรอกรายการใหม่"
                    >
                      <PlusCircle className="w-5 h-5 text-[#006853]" />
                      <span>บันทึกและเพิ่มรายการใหม่</span>
                    </button>
                  )}
                  {/* ปุ่มบันทึกการแก้ไข / บันทึกข้อมูล (สีเขียว) */}
                  <button
                    id="btn-submit-project-form"
                    type="submit"
                    className="inline-flex items-center gap-2 px-6 py-2.5 text-base font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer min-h-[44px]"
                  >
                    <Save className="w-5 h-5 text-white" />
                    <span>{isEdit ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูล'}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Pop-up แจ้งเตือนสไตล์ SweetAlert ตรงกลางหน้าจอ */}
      {showSuccessAlert && (
        <div
          id="sweetalert-save-success-overlay"
          className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={handleConfirmSuccessAlert}
        >
          <div
            id="sweetalert-save-success-modal"
            role="dialog"
            aria-modal="true"
            className="bg-white rounded-3xl shadow-2xl p-7 sm:p-8 max-w-sm w-full text-center flex flex-col items-center border border-slate-100 transform animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ไอคอนเครื่องหมายถูกสีเขียว (✓) ในวงกลม */}
            <div className="w-20 h-20 rounded-full border-4 border-emerald-500 bg-emerald-50 flex items-center justify-center mb-5 text-emerald-600 shadow-inner">
              <Check className="w-10 h-10 stroke-[3.5]" />
            </div>

            <h3 className="text-xl font-bold text-slate-800 mb-2 tracking-tight">
              สำเร็จ!
            </h3>

            <p className="text-base text-slate-600 font-medium mb-6 leading-relaxed">
              บันทึกสำเร็จ พร้อมกรอกรายการใหม่
            </p>

            <button
              id="btn-sweetalert-confirm"
              type="button"
              onClick={handleConfirmSuccessAlert}
              className="w-full sm:w-36 py-2.5 px-6 bg-[#006853] hover:bg-[#005242] text-white font-bold text-base rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer min-h-[44px]"
              autoFocus
            >
              ตกลง
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
