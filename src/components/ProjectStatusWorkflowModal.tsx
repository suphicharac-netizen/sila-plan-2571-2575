import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  CheckCircle2,
  Clock,
  Building2,
  Calendar,
  FileCheck2,
  ShieldCheck,
  BookOpen,
  Save,
  Copy,
  Check,
  Info,
  ArrowRight,
  Target,
  Coins,
  AlertCircle,
  ArrowLeftRight,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sparkles,
  FileText,
  Trash2,
  Printer,
  MapPin
} from 'lucide-react';
import { ProjectData, UserAccount, ActiveNavMenu, PlanEdition, ALL_VILLAGES, SILA_ZONES, ProjectAreaType } from '../types';
import { getProjectDisplayId } from '../utils/projectCode';
import { EXECUTION_STATUS_CONFIG, getExecutionStatus, getProjectVillageInfo } from '../utils/villageUtils';
import { DEVELOPMENT_STRATEGIES, DEPARTMENTS, MUNICIPAL_FACILITIES } from '../utils/constants';
import { PLAN_CATEGORIES } from '../data/initialData';

interface ProjectStatusWorkflowModalProps {
  project: ProjectData | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserAccount | null;
  onViewProjectDetail?: (project: ProjectData) => void;
  onNavigateToMenu?: (menu: ActiveNavMenu) => void;
  onSave?: (updatedProject: ProjectData) => void;
  onDelete?: (projectId: string) => void;
}

type ViewSection = 'all' | 'workflow' | 'edit' | 'detail02';

export const ProjectStatusWorkflowModal: React.FC<ProjectStatusWorkflowModalProps> = ({
  project,
  isOpen,
  onClose,
  currentUser,
  onViewProjectDetail,
  onNavigateToMenu,
  onSave,
  onDelete
}) => {
  const isPublicUser = currentUser?.role === 'public';
  const isReadOnly = Boolean(
    isPublicUser ||
    currentUser?.role === 'executive'
  );

  // Active section view filter ('all', 'workflow', 'edit')
  const [activeSection, setActiveSection] = useState<ViewSection>('all');
  const [isWorkflowCollapsed, setIsWorkflowCollapsed] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'compare' | 'detail02'>('compare');

  const villageInfo = project ? getProjectVillageInfo(project) : null;
  const isSingleView = project?.edition === 'first' || project?.edition === 'additional';

  // --- Left Column: Original Data (Read-only reference) ---
  const origName =
    project?.originalProjectName ||
    project?.name ||
    '';
  const origObjective =
    project?.originalObjective ||
    project?.objective ||
    '';
  const origTarget =
    project?.originalTarget ||
    project?.target ||
    '';
  const origExpected =
    project?.originalExpectedResults ||
    project?.expectedResults ||
    '';
  const origDept =
    project?.originalDepartment ||
    project?.department ||
    '';
  const origStrategy = project?.planStrategy || '';
  const origCategory = project?.planCategory || '';

  const origB71 = project?.originalBudgetByYear?.['2571'] ?? project?.budgetByYear?.['2571'] ?? 0;
  const origB72 = project?.originalBudgetByYear?.['2572'] ?? project?.budgetByYear?.['2572'] ?? 0;
  const origB73 = project?.originalBudgetByYear?.['2573'] ?? project?.budgetByYear?.['2573'] ?? 0;
  const origB74 = project?.originalBudgetByYear?.['2574'] ?? project?.budgetByYear?.['2574'] ?? 0;
  const origB75 = project?.originalBudgetByYear?.['2575'] ?? project?.budgetByYear?.['2575'] ?? 0;

  const origTotalBudget = origB71 + origB72 + origB73 + origB74 + origB75;

  // --- Right Column: Editable Form State ---
  const [name, setName] = useState<string>('');
  const [objective, setObjective] = useState<string>('');
  const [target, setTarget] = useState<string>('');
  const [expectedResults, setExpectedResults] = useState<string>('');
  const [department, setDepartment] = useState<string>('');
  const [planStrategy, setPlanStrategy] = useState<string>('');
  const [planCategory, setPlanCategory] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [edition, setEdition] = useState<PlanEdition>(project?.edition || 'first');
  const [year, setYear] = useState<string>(project?.year || '2571-2575');

  // Budget Inputs
  const [b2571, setB2571] = useState<string>('0');
  const [b2572, setB2572] = useState<string>('0');
  const [b2573, setB2573] = useState<string>('0');
  const [b2574, setB2574] = useState<string>('0');
  const [b2575, setB2575] = useState<string>('0');

  // Dynamic Operating Area states
  const [areaType, setAreaType] = useState<ProjectAreaType>('village');
  const [selectedVillageNum, setSelectedVillageNum] = useState<number>(1);
  const [selectedFacility, setSelectedFacility] = useState<string>(MUNICIPAL_FACILITIES[0]);
  const [customLocation, setCustomLocation] = useState<string>('');

  // Synchronize initial form state whenever project changes or modal opens
  useEffect(() => {
    if (project) {
      setName(project.name || '');
      setObjective(project.objective || '');
      setTarget(project.target || '');
      setExpectedResults(project.expectedResults || '');
      setDepartment(project.department || DEPARTMENTS[0]);
      setPlanStrategy(project.planStrategy || DEVELOPMENT_STRATEGIES[0]);
      setPlanCategory(project.planCategory || PLAN_CATEGORIES[0]);
      setReason(project.reason || project.note || '');
      setEdition(project.edition || 'first');
      setYear(project.year || '2571-2575');

      setB2571(String(project.budgetByYear?.['2571'] ?? 0));
      setB2572(String(project.budgetByYear?.['2572'] ?? 0));
      setB2573(String(project.budgetByYear?.['2573'] ?? 0));
      setB2574(String(project.budgetByYear?.['2574'] ?? 0));
      setB2575(String(project.budgetByYear?.['2575'] ?? 0));
      setSaveSuccess(false);

      // Determine area type from project
      if (
        project.zone === 'ภายในหน่วยงาน' ||
        project.zone === 'อาคาร/หน่วยงานในสังกัด' ||
        MUNICIPAL_FACILITIES.some((f) => project.village?.includes(f)) ||
        (!project.villageNumber && (project.village?.includes('สำนักงาน') || project.village?.includes('ศูนย์พัฒนาเด็กเล็ก') || project.village?.includes('โรงเรียน')))
      ) {
        setAreaType('facility');
        setSelectedFacility(project.village || MUNICIPAL_FACILITIES[0]);
        setCustomLocation('');
        setSelectedVillageNum(1);
      } else if (
        project.zone === 'ภายในเขต/ภายนอกเขต' ||
        project.zone === 'พื้นที่ภาพรวม / นอกเขต' ||
        project.zone === 'ภาพรวม/นอกเขต' ||
        project.villageNumber === 0 ||
        (project.village && (project.village.includes('ทุกหมู่บ้าน') || project.village.includes('นอกเขต')))
      ) {
        setAreaType('custom');
        setCustomLocation(project.village || '');
        setSelectedFacility(MUNICIPAL_FACILITIES[0]);
        setSelectedVillageNum(1);
      } else {
        setAreaType('village');
        setSelectedVillageNum(project.villageNumber || 1);
        setSelectedFacility(MUNICIPAL_FACILITIES[0]);
        setCustomLocation('');
      }

      // สำหรับฉบับแรกและฉบับเพิ่มเติม ให้เปิดแบบหน้าเดียว (Single View)
      if (project.edition === 'first' || project.edition === 'additional') {
        setActiveSection('workflow');
        setViewMode('compare');
      } else {
        setActiveSection('all');
        setViewMode('compare');
      }
    }
  }, [project, isOpen]);

  // Calculate new total budget
  const newTotalBudget = useMemo(() => {
    const n1 = parseFloat(b2571.replace(/,/g, '')) || 0;
    const n2 = parseFloat(b2572.replace(/,/g, '')) || 0;
    const n3 = parseFloat(b2573.replace(/,/g, '')) || 0;
    const n4 = parseFloat(b2574.replace(/,/g, '')) || 0;
    const n5 = parseFloat(b2575.replace(/,/g, '')) || 0;
    return n1 + n2 + n3 + n4 + n5;
  }, [b2571, b2572, b2573, b2574, b2575]);

  const budgetDiff = newTotalBudget - origTotalBudget;

  // Copy all fields from original data to new inputs
  const handleCopyFromOriginal = () => {
    setName(origName);
    setObjective(origObjective);
    setTarget(origTarget);
    setExpectedResults(origExpected);
    setDepartment(origDept);
    setPlanStrategy(origStrategy);
    setPlanCategory(origCategory);
    setB2571(String(origB71));
    setB2572(String(origB72));
    setB2573(String(origB73));
    setB2574(String(origB74));
    setB2575(String(origB75));

    if (
      project.zone === 'ภายในหน่วยงาน' ||
      project.zone === 'อาคาร/หน่วยงานในสังกัด' ||
      MUNICIPAL_FACILITIES.some((f) => project.village?.includes(f))
    ) {
      setAreaType('facility');
      setSelectedFacility(project.village || MUNICIPAL_FACILITIES[0]);
      setCustomLocation('');
      setSelectedVillageNum(1);
    } else if (
      project.zone === 'ภายในเขต/ภายนอกเขต' ||
      project.zone === 'พื้นที่ภาพรวม / นอกเขต' ||
      project.villageNumber === 0
    ) {
      setAreaType('custom');
      setCustomLocation(project.village || '');
      setSelectedFacility(MUNICIPAL_FACILITIES[0]);
      setSelectedVillageNum(1);
    } else {
      setAreaType('village');
      setSelectedVillageNum(project.villageNumber || 1);
      setSelectedFacility(MUNICIPAL_FACILITIES[0]);
      setCustomLocation('');
    }
  };

  // Reset to initial project state
  const handleResetForm = () => {
    if (project) {
      setName(project.name || '');
      setObjective(project.objective || '');
      setTarget(project.target || '');
      setExpectedResults(project.expectedResults || '');
      setDepartment(project.department || DEPARTMENTS[0]);
      setPlanStrategy(project.planStrategy || DEVELOPMENT_STRATEGIES[0]);
      setPlanCategory(project.planCategory || PLAN_CATEGORIES[0]);
      setEdition(project.edition || 'first');
      setYear(project.year || '2571-2575');
      setReason(project.reason || project.note || '');
      setB2571(String(project.budgetByYear?.['2571'] ?? 0));
      setB2572(String(project.budgetByYear?.['2572'] ?? 0));
      setB2573(String(project.budgetByYear?.['2573'] ?? 0));
      setB2574(String(project.budgetByYear?.['2574'] ?? 0));
      setB2575(String(project.budgetByYear?.['2575'] ?? 0));

      if (
        project.zone === 'ภายในหน่วยงาน' ||
        project.zone === 'อาคาร/หน่วยงานในสังกัด' ||
        MUNICIPAL_FACILITIES.some((f) => project.village?.includes(f))
      ) {
        setAreaType('facility');
        setSelectedFacility(project.village || MUNICIPAL_FACILITIES[0]);
        setCustomLocation('');
        setSelectedVillageNum(1);
      } else if (
        project.zone === 'ภายในเขต/ภายนอกเขต' ||
        project.zone === 'พื้นที่ภาพรวม / นอกเขต' ||
        project.villageNumber === 0
      ) {
        setAreaType('custom');
        setCustomLocation(project.village || '');
        setSelectedFacility(MUNICIPAL_FACILITIES[0]);
        setSelectedVillageNum(1);
      } else {
        setAreaType('village');
        setSelectedVillageNum(project.villageNumber || 1);
        setSelectedFacility(MUNICIPAL_FACILITIES[0]);
        setCustomLocation('');
      }
    }
  };

  // Handle Save
  const handleSave = () => {
    if (isReadOnly) return;
    if (!name.trim()) {
      alert('กรุณากรอกชื่อโครงการ');
      return;
    }

    const n1 = parseFloat(b2571.replace(/,/g, '')) || 0;
    const n2 = parseFloat(b2572.replace(/,/g, '')) || 0;
    const n3 = parseFloat(b2573.replace(/,/g, '')) || 0;
    const n4 = parseFloat(b2574.replace(/,/g, '')) || 0;
    const n5 = parseFloat(b2575.replace(/,/g, '')) || 0;

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

    const updatedProject: ProjectData = {
      ...project,
      name: name.trim(),
      year,
      edition,
      planStrategy,
      planCategory,
      department,
      zone: finalZone,
      village: finalVillage,
      villageNumber: finalVillageNum,
      objective: objective.trim(),
      target: target.trim(),
      expectedResults: expectedResults.trim(),
      reason: reason.trim(),
      budgetByYear: {
        '2571': n1,
        '2572': n2,
        '2573': n3,
        '2574': n4,
        '2575': n5
      },
      budgetPlan: newTotalBudget,
      // Retain original reference if modified
      originalProjectName: origName,
      originalObjective: origObjective,
      originalTarget: origTarget,
      originalExpectedResults: origExpected,
      originalDepartment: origDept,
      originalBudgetPlan: origTotalBudget,
      originalBudgetByYear: {
        '2571': origB71,
        '2572': origB72,
        '2573': origB73,
        '2574': origB74,
        '2575': origB75
      }
    };

    if (onSave) {
      onSave(updatedProject);
    }

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 3500);
  };

  // Status & Approval calculations
  const isApproved = project?.status === 'approved';
  const isPublished = Boolean(
    project?.publishStatus === 'published_first' ||
    project?.publishStatus === 'published_additional' ||
    project?.publishStatus === 'published_changed' ||
    isApproved
  );

  let currentStageText = 'ร่างโครงการ';
  let currentStageColor = 'bg-slate-100 text-slate-700 border-slate-300';

  if (isPublished) {
    if (project?.executionStatus === 'completed') {
      currentStageText = 'อนุมัติและประกาศใช้แล้ว (เสร็จสิ้น)';
      currentStageColor = 'bg-emerald-50 text-emerald-800 border-emerald-300';
    } else {
      currentStageText = 'อนุมัติและประกาศใช้แล้ว';
      currentStageColor = 'bg-emerald-50 text-emerald-700 border-emerald-300';
    }
  } else if (isApproved) {
    currentStageText = 'อนุมัติในหลักการ (รอจัดรอบประกาศ)';
    currentStageColor = 'bg-teal-50 text-teal-800 border-teal-300';
  } else {
    currentStageText = 'อยู่ระหว่างเสนออนุมัติ';
    currentStageColor = 'bg-amber-50 text-amber-800 border-amber-300';
  }

  const formattedApproveDate =
    project?.approvedDate && project.approvedDate !== '-'
      ? project.approvedDate
      : '01/09/2569';

  if (!isOpen || !project) return null;

  return (
    <div
      id="project-all-in-one-modal"
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-hidden animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full h-[90vh] max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* ========================================================================= */}
        {/* Header: ชื่อโครงการ, ปี พ.ศ., ประเภทรายการ, Badge สถานะปัจจุบัน, ปุ่มปิด  */}
        {/* ========================================================================= */}
        <div className="shrink-0 px-5 sm:px-6 py-4 bg-[#055740] text-white flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 text-emerald-300 shrink-0 shadow-xs">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                    ข้อมูลโครงการ แผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575) — ประเภทรายการ:{' '}
                    {project.edition === 'first'
                      ? 'ฉบับแรก'
                      : project.edition === 'additional'
                      ? 'เพิ่มเติม'
                      : project.edition === 'amended'
                      ? 'แก้ไข'
                      : 'เปลี่ยนแปลง'}
                  </h3>
                </div>
                <div className="flex items-center gap-2.5 flex-wrap mt-1 text-sm">
                  <span className="font-semibold text-emerald-100 truncate max-w-xl" title={project.name}>
                    {project.name}
                  </span>
                  <span className="text-emerald-200/90 font-mono">
                    • รหัส: {project.code || getProjectDisplayId(project, project.orderNumber)}
                  </span>
                  {project.department && (
                    <span className="text-emerald-100/90 hidden sm:inline">
                      • หน่วยงาน: <strong className="text-white font-semibold">{project.department}</strong>
                    </span>
                  )}
                  {isSingleView && (
                    <span className="text-emerald-100/90">
                      • งบประมาณรวม 5 ปี:{' '}
                      <strong className="text-white font-mono font-semibold">{newTotalBudget.toLocaleString()}</strong>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              {/* Status Badge */}
              <span
                className={`hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold border shadow-xs ${currentStageColor}`}
              >
                {isPublished ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : isApproved ? (
                  <Check className="w-4 h-4 text-teal-600" />
                ) : (
                  <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                )}
                <span>{currentStageText}</span>
              </span>

              <div className="flex items-center gap-2">
                <button
                  id="btn-print-workflow-modal-top"
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
                  title="พิมพ์เฉพาะเนื้อหาในหน้ารายละเอียดนี้ออกทางเครื่องพิมพ์"
                >
                  <Printer className="w-4 h-4" />
                  <span>พิมพ์หน้านี้</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="ปิดหน้าต่าง"
                  title="ปิดหน้าต่าง"
                  className="w-8 h-8 sm:w-9 sm:h-9 bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg shadow-xs flex items-center justify-center cursor-pointer transition-colors p-0"
                >
                  <X className="w-5 h-5 stroke-[2.2]" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Sub-Navigation / Section Filter Tabs (ซ่อนทั้งหมดเมื่อเป็นฉบับแรก หรือฉบับเพิ่มเติม ตามรูปแบบ Single View) */}
          {!isSingleView && (
            <div className="flex items-center justify-between border-t border-white/10 pt-2.5 text-sm flex-wrap gap-2.5">
              <div className="inline-flex p-1 bg-black/25 rounded-xl border border-white/20 gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setActiveSection('all');
                    setViewMode('compare');
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                    activeSection === 'all' && viewMode === 'compare'
                      ? 'bg-white/25 border border-white/60 shadow-xs'
                      : 'hover:bg-white/10'
                  }`}
                  style={{ color: '#FFFFFF' }}
                >
                  <span style={{ color: '#FFFFFF' }}>📋 มุมมองรวม</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveSection('workflow');
                    setViewMode('compare');
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                    activeSection === 'workflow'
                      ? 'bg-white/25 border border-white/60 shadow-xs'
                      : 'hover:bg-white/10'
                  }`}
                  style={{ color: '#FFFFFF' }}
                >
                  <span style={{ color: '#FFFFFF' }}>🔄 เสนอเรื่องและสถานะอนุมัติ</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveSection('edit');
                    setViewMode('compare');
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                    activeSection === 'edit' && viewMode === 'compare'
                      ? 'bg-white/25 border border-white/60 shadow-xs'
                      : 'hover:bg-white/10'
                  }`}
                  style={{ color: '#FFFFFF' }}
                >
                  <span style={{ color: '#FFFFFF' }}>✏️ ฟอร์มแก้ไขและเปรียบเทียบ</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveSection('detail02');
                    setViewMode('detail02');
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                    viewMode === 'detail02' || activeSection === 'detail02'
                      ? 'bg-white/25 border border-white/60 shadow-xs'
                      : 'hover:bg-white/10'
                  }`}
                  style={{ color: '#FFFFFF' }}
                >
                  <span style={{ color: '#FFFFFF' }}>📋 ข้อมูลรายละเอียดโครงการ (ผ.02)</span>
                </button>
              </div>

              <div className="flex items-center gap-3 text-emerald-100/90 text-sm">
                <span className="hidden md:inline">
                  หน่วยงาน: <strong className="text-white font-semibold">{project.department || '-'}</strong>
                </span>
                <span className="hidden md:inline">•</span>
                <span>
                  งบประมาณเดิม:{' '}
                  <strong className="text-white font-mono font-semibold">{origTotalBudget.toLocaleString()}</strong>
                </span>
                {budgetDiff !== 0 && (
                  <span
                    className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${
                      budgetDiff > 0 ? 'bg-amber-400 text-amber-950' : 'bg-rose-400 text-rose-950'
                    }`}
                  >
                    {budgetDiff > 0 ? `+${budgetDiff.toLocaleString()}` : `-${Math.abs(budgetDiff).toLocaleString()}`}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* Scrollable Body: ส่วนที่ 1 (Workflow) + ส่วนที่ 2 (Edit Form Comparison)   */}
        {/* ========================================================================= */}
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar p-4 sm:p-6 space-y-6 text-slate-800 bg-slate-50/50">
          {/* Success Banner Notification */}
          {saveSuccess && (
            <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                <span className="text-sm font-bold">
                  บันทึกการแก้ไขข้อมูลโครงการเรียบร้อยแล้ว! (ข้อมูลได้รับการอัปเดตในระบบแล้ว)
                </span>
              </div>
              <span className="text-xs text-emerald-700 font-mono">บันทึกสำเร็จ</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ส่วนที่ 1: สายงานการเสนอเรื่องและประวัติการอนุมัติ (Workflow 4 ขั้นตอน)    */}
          {/* ========================================================================= */}
          {(
            isSingleView ||
            (activeSection === 'all' || activeSection === 'workflow')
          ) && (
            <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                    <FileCheck2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900">
                      ส่วนที่ 1: สายงานการเสนอเรื่องและประวัติการอนุมัติ (Workflow 4 ขั้นตอน)
                    </h4>
                    <p className="text-sm text-slate-500 mt-0.5">
                      ติดตามลำดับขั้นการเสนอเรื่องจากเจ้าหน้าที่จนถึงการประกาศใช้ในแผนพัฒนาท้องถิ่น
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsWorkflowCollapsed(!isWorkflowCollapsed)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors font-medium"
                  >
                    {isWorkflowCollapsed ? (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        <span>ขยายสายงาน</span>
                      </>
                    ) : (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        <span>ย่อสายงาน</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {!isWorkflowCollapsed && (
                <>
                  {/* Workflow 4 Steps Horizontal/Grid Stepper */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    {/* Step 1: เสนอต้นเรื่อง */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-3 shadow-2xs">
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-2.5">
                          <span className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                            1
                          </span>
                          <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                            สำเร็จ
                          </span>
                        </div>
                        <h5 className="font-bold text-sm text-slate-900 leading-snug">
                          1. เสนอต้นเรื่องโครงการ
                        </h5>
                        <p className="text-sm text-slate-700 mt-1.5 font-medium">
                          ผู้อำนวยการ{project.department || 'กองเจ้าของเรื่อง'} / เจ้าหน้าที่ผู้รับผิดชอบ
                        </p>
                        <p className="text-sm text-slate-600 mt-1 leading-relaxed line-clamp-2">
                          จัดทำแบบฟอร์มคำขอและวัตถุประสงค์โครงการ พร้อมประมาณการงบประมาณ
                        </p>
                      </div>
                      <div className="pt-2.5 border-t border-slate-200/80 text-sm text-slate-600 font-mono">
                        วันที่เสนอ: {formattedApproveDate !== '-' ? formattedApproveDate : '15/08/2569'}
                      </div>
                    </div>

                    {/* Step 2: อนุมัติในหลักการ */}
                    <div
                      className={`border rounded-xl p-4 flex flex-col justify-between space-y-3 shadow-2xs ${
                        isApproved ? 'bg-slate-50 border-slate-200' : 'bg-amber-50/40 border-amber-200'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-2.5">
                          <span
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                              isApproved ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
                            }`}
                          >
                            2
                          </span>
                          <span
                            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                              isApproved
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {isApproved ? 'สำเร็จ' : 'รอพิจารณา'}
                          </span>
                        </div>
                        <h5 className="font-bold text-sm text-slate-900 leading-snug">
                          2. อนุมัติในหลักการ
                        </h5>
                        <p className="text-sm text-slate-700 mt-1.5 font-medium">
                          คณะผู้บริหาร / นายกเทศมนตรีเมืองศิลา
                        </p>
                        <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                          {isApproved ? (
                            <span>คำสั่ง: {project.approvalOrderNo || 'คำสั่ง ทม.ศิลา ที่ 128/2569'}</span>
                          ) : (
                            <span>อยู่ระหว่างการพิจารณากลั่นกรองและลงนาม</span>
                          )}
                        </p>
                      </div>
                      <div className="pt-2.5 border-t border-slate-200/80 text-sm text-slate-600 font-mono">
                        วันที่อนุมัติ: {isApproved ? formattedApproveDate : 'รอลงนาม'}
                      </div>
                    </div>

                    {/* Step 3: ส่งมอบเอกสารแนบ ผ.02/ผ.03 */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-3 shadow-2xs">
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-2.5">
                          <span
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                              isApproved ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-600'
                            }`}
                          >
                            3
                          </span>
                          <span
                            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                              isApproved
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {isApproved ? 'สำเร็จ' : 'รอดำเนินการ'}
                          </span>
                        </div>
                        <h5 className="font-bold text-sm text-slate-900 leading-snug">
                          3. ตรวจสอบเอกสาร ผ.02
                        </h5>
                        <p className="text-sm text-slate-700 mt-1.5 font-medium">
                          กองยุทธศาสตร์และงบประมาณ
                        </p>
                        <p className="text-sm text-slate-600 mt-1 leading-relaxed line-clamp-2">
                          ตรวจรับเอกสารแนบ ผ.02 ตรวจสอบความสอดคล้องกับยุทธศาสตร์
                        </p>
                      </div>
                      <div className="pt-2.5 border-t border-slate-200/80 text-sm text-slate-600 font-mono">
                        ตรวจรับ: {isApproved ? formattedApproveDate : '-'}
                      </div>
                    </div>

                    {/* Step 4: บรรจุแผนและประกาศใช้ */}
                    <div
                      className={`border rounded-xl p-4 flex flex-col justify-between space-y-3 shadow-2xs ${
                        isPublished ? 'bg-slate-50 border-slate-200' : 'bg-slate-50/50 border-slate-200'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-2.5">
                          <span
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                              isPublished ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-600'
                            }`}
                          >
                            4
                          </span>
                          <span
                            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                              isPublished
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {isPublished ? 'ประกาศใช้แล้ว' : 'รอดำเนินการ'}
                          </span>
                        </div>
                        <h5 className="font-bold text-sm text-slate-900 leading-snug">
                          4. บรรจุแผนและประกาศใช้
                        </h5>
                        <p className="text-sm text-slate-700 mt-1.5 font-medium">
                          สภาเทศบาล / นายกเทศมนตรีเมืองศิลา
                        </p>
                        <p className="text-sm text-slate-600 mt-1 leading-relaxed line-clamp-2">
                          {project.planReference || 'บรรจุในแผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575)'}
                        </p>
                      </div>
                      <div className="pt-2.5 border-t border-slate-200/80 text-sm text-slate-600 font-mono">
                        ประกาศใช้: {isPublished ? formattedApproveDate : '-'}
                      </div>
                    </div>
                  </div>

                  {/* Implementation Status Card */}
                  <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-sm">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span className="font-bold text-slate-900">
                        สถานะการดำเนินงานและการจัดสรรงบประมาณ:
                      </span>
                      {project.isBudgetAllocated ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                          🔵 จัดตั้งงบประมาณแล้ว
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300">
                          🟡 อยู่ในแผน (ยังไม่ตั้งงบ)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-slate-600 font-medium">ความก้าวหน้าจริง:</span>
                      {(() => {
                        const st = getExecutionStatus(project);
                        const conf = EXECUTION_STATUS_CONFIG[st];
                        return (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${conf.bgClass} ${conf.textClass} ${conf.borderClass}`}
                          >
                            <span>{conf.icon}</span>
                            <span>{conf.label}</span>
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                </>
              )}
            </section>
          )}

          {/* ========================================================================= */}
          {/* ส่วนที่ 2: ฟอร์มแก้ไขข้อมูลโครงการ เปรียบเทียบสองฝั่ง "ข้อมูลเดิม" vs "ข้อมูลใหม่" */}
          {/* ซ่อนในฉบับแรกและฉบับเพิ่มเติม ตามรูปแบบ Single View */}
          {/* ========================================================================= */}
          {!isSingleView && viewMode === 'compare' && (activeSection === 'all' || activeSection === 'edit') && (
            <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
              {/* Section Header with Quick Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200">
                    <ArrowLeftRight className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900">
                      ส่วนที่ 2: ฟอร์มแก้ไขข้อมูลโครงการ (เปรียบเทียบข้อมูลเดิม vs ข้อมูลใหม่ที่ขอเปลี่ยนแปลง)
                    </h4>
                    <p className="text-sm text-slate-500 mt-0.5">
                      เปรียบเทียบข้อมูลเดิมตามแผนพัฒนาท้องถิ่น กับข้อมูลใหม่ที่ต้องการปรับปรุงหรือขอเปลี่ยนแปลง
                    </p>
                  </div>
                </div>

                {!isReadOnly && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyFromOriginal}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg cursor-pointer transition-colors"
                      title="คัดลอกค่าจากข้อมูลเดิมมาใส่ในฟอร์มข้อมูลใหม่"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-600" />
                      <span>คัดลอกจากข้อมูลเดิม</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleResetForm}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg cursor-pointer transition-colors"
                      title="ล้างค่าที่กรอกกลับไปเป็นค่าเริ่มต้น"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                      <span>รีเซ็ตค่า</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Top 4 Category Dropdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ปี พ.ศ. บรรจุแผน
                  </label>
                  <select
                    value={year}
                    disabled={isReadOnly}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 outline-none focus:ring-1 focus:ring-emerald-600"
                  >
                    <option value="2571-2575">พ.ศ. 2571-2575 (5 ปี)</option>
                    <option value="2571">พ.ศ. 2571</option>
                    <option value="2572">พ.ศ. 2572</option>
                    <option value="2573">พ.ศ. 2573</option>
                    <option value="2574">พ.ศ. 2574</option>
                    <option value="2575">พ.ศ. 2575</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ประเภทรายการ
                  </label>
                  <div className="flex items-center gap-1.5">
                    <select
                      value={edition}
                      disabled={isReadOnly}
                      onChange={(e) => setEdition(e.target.value as PlanEdition)}
                      className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold text-emerald-800 outline-none focus:ring-1 focus:ring-emerald-600"
                    >
                      <option value="changed">เปลี่ยนแปลง</option>
                      <option value="first">ฉบับแรก</option>
                      <option value="additional">เพิ่มเติม</option>
                      <option value="amended">แก้ไข</option>
                    </select>
                    <span className="bg-emerald-50 text-emerald-700 font-bold text-xs px-2.5 py-2 rounded-lg border border-emerald-200 shrink-0">
                      ผ.02
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ประเด็นการพัฒนา (ยุทธศาสตร์)
                  </label>
                  <select
                    value={planStrategy}
                    disabled={isReadOnly}
                    onChange={(e) => setPlanStrategy(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm truncate text-slate-800 outline-none focus:ring-1 focus:ring-emerald-600"
                  >
                    {DEVELOPMENT_STRATEGIES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">แผนงาน</label>
                  <select
                    value={planCategory}
                    disabled={isReadOnly}
                    onChange={(e) => setPlanCategory(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm truncate text-slate-800 outline-none focus:ring-1 focus:ring-emerald-600"
                  >
                    {PLAN_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Side-by-Side Comparison Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* ------------------------------------------------------------- */}
                {/* ฝั่งซ้าย: ข้อมูลเดิม (Current / Original Plan Data - Read-only) */}
                {/* ------------------------------------------------------------- */}
                <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-sm tracking-wide">
                      <FileText className="w-4 h-4 text-slate-600" />
                      <span>📜 ข้อมูลเดิม (ตามแผนพัฒนาท้องถิ่น)</span>
                    </div>
                    <span className="text-xs font-medium text-slate-500 bg-slate-200 px-2.5 py-0.5 rounded">
                      อ่านอย่างเดียว
                    </span>
                  </div>

                  {/* 1. ชื่อโครงการเดิม */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">
                      1. ชื่อโครงการ (เดิม)
                    </label>
                    <div className="p-3 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-800">
                      {origName || '-'}
                    </div>
                  </div>

                  {/* 2. วัตถุประสงค์เดิม */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">
                      2. วัตถุประสงค์ (เดิม)
                    </label>
                    <div className="p-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 min-h-[4.5rem] whitespace-pre-wrap leading-relaxed">
                      {origObjective || '-'}
                    </div>
                  </div>

                  {/* 3. เป้าหมายเดิม */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">
                      3. เป้าหมาย ผลผลิตของโครงการ (เดิม)
                    </label>
                    <div className="p-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 min-h-[4.5rem] whitespace-pre-wrap leading-relaxed">
                      {origTarget || '-'}
                    </div>
                  </div>

                  {/* 4. งบประมาณ 5 ปีเดิม */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-sm font-bold text-slate-700">
                        4. งบประมาณรายปี 5 ปี (เดิม)
                      </label>
                      <span className="text-sm font-mono font-bold text-slate-800">
                        รวม: {origTotalBudget.toLocaleString()}
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-1.5 text-center text-sm">
                      <div className="p-2 bg-white border border-slate-200 rounded-lg">
                        <span className="block text-xs text-slate-500 mb-0.5">2571</span>
                        <span className="font-mono text-xs sm:text-sm font-semibold text-slate-800">
                          {origB71.toLocaleString()}
                        </span>
                      </div>
                      <div className="p-2 bg-white border border-slate-200 rounded-lg">
                        <span className="block text-xs text-slate-500 mb-0.5">2572</span>
                        <span className="font-mono text-xs sm:text-sm font-semibold text-slate-800">
                          {origB72.toLocaleString()}
                        </span>
                      </div>
                      <div className="p-2 bg-white border border-slate-200 rounded-lg">
                        <span className="block text-xs text-slate-500 mb-0.5">2573</span>
                        <span className="font-mono text-xs sm:text-sm font-semibold text-slate-800">
                          {origB73.toLocaleString()}
                        </span>
                      </div>
                      <div className="p-2 bg-white border border-slate-200 rounded-lg">
                        <span className="block text-xs text-slate-500 mb-0.5">2574</span>
                        <span className="font-mono text-xs sm:text-sm font-semibold text-slate-800">
                          {origB74.toLocaleString()}
                        </span>
                      </div>
                      <div className="p-2 bg-white border border-slate-200 rounded-lg">
                        <span className="block text-xs text-slate-500 mb-0.5">2575</span>
                        <span className="font-mono text-xs sm:text-sm font-semibold text-slate-800">
                          {origB75.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 5. ผลที่คาดว่าจะได้รับเดิม */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">
                      5. ผลที่คาดว่าจะได้รับ (เดิม)
                    </label>
                    <div className="p-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 min-h-[4rem] whitespace-pre-wrap leading-relaxed">
                      {origExpected || '-'}
                    </div>
                  </div>

                  {/* 6. หน่วยงานและยุทธศาสตร์เดิม */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm">
                    <div>
                      <span className="text-slate-600 block text-xs font-bold mb-1">หน่วยงานเดิม:</span>
                      <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium truncate text-sm">
                        {origDept || '-'}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-600 block text-xs font-bold mb-1">แผนงานเดิม:</span>
                      <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium truncate text-sm">
                        {origCategory || '-'}
                      </div>
                    </div>
                  </div>

                  {/* 7. พื้นที่ดำเนินการเดิม */}
                  <div className="text-sm">
                    <span className="text-slate-600 block text-xs font-bold mb-1">พื้นที่ดำเนินการเดิม:</span>
                    <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium truncate text-sm">
                      {project.zone && project.zone !== 'ภาพรวม' && project.zone !== 'พื้นที่ภาพรวม / นอกเขต'
                        ? `${project.zone} • ${project.village || ''}`
                        : (project.village || 'ทุกหมู่บ้านในเขตเทศบาล')}
                    </div>
                  </div>
                </div>

                {/* ----------------------------------------------------------------- */}
                {/* ฝั่งขวา: ข้อมูลใหม่ (ที่ขอเปลี่ยนแปลง/ปรับปรุง - Editable Inputs) */}
                {/* ----------------------------------------------------------------- */}
                <div className="bg-emerald-50/40 border border-emerald-300 rounded-xl p-4 sm:p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-emerald-200 pb-2.5">
                    <div className="flex items-center gap-2 text-[#055740] font-bold text-sm tracking-wide">
                      <Sparkles className="w-4 h-4 text-emerald-700" />
                      <span>✏️ ข้อมูลใหม่ (ที่ขอเปลี่ยนแปลง/ปรับปรุง)</span>
                    </div>
                    <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded border border-emerald-200">
                      ฟอร์มแก้ไข
                    </span>
                  </div>

                  {/* 1. ชื่อโครงการใหม่ */}
                  <div>
                    <label className="block text-sm font-bold text-emerald-950 mb-1">
                      1. ชื่อโครงการ (ใหม่) <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="ระบุชื่อโครงการ..."
                      className="w-full bg-white border border-emerald-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/30 rounded-lg p-2.5 text-sm text-slate-900 font-medium disabled:bg-slate-100 disabled:text-slate-500 transition-all outline-none"
                    />
                  </div>

                  {/* 2. วัตถุประสงค์ใหม่ */}
                  <div>
                    <label className="block text-sm font-bold text-emerald-950 mb-1">
                      2. วัตถุประสงค์ (ใหม่)
                    </label>
                    <textarea
                      rows={2}
                      disabled={isReadOnly}
                      value={objective}
                      onChange={(e) => setObjective(e.target.value)}
                      placeholder="ระบุวัตถุประสงค์ของโครงการ..."
                      className="w-full bg-white border border-emerald-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/30 rounded-lg p-2.5 text-sm text-slate-900 min-h-[4.5rem] disabled:bg-slate-100 disabled:text-slate-500 transition-all outline-none"
                    />
                  </div>

                  {/* 3. เป้าหมายใหม่ */}
                  <div>
                    <label className="block text-sm font-bold text-emerald-950 mb-1">
                      3. เป้าหมาย ผลผลิตของโครงการ (ใหม่)
                    </label>
                    <textarea
                      rows={2}
                      disabled={isReadOnly}
                      value={target}
                      onChange={(e) => setTarget(e.target.value)}
                      placeholder="ระบุผลผลิต/ปริมาณงาน เช่น ก่อสร้างถนน กว้าง... ยาว..."
                      className="w-full bg-white border border-emerald-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/30 rounded-lg p-2.5 text-sm text-slate-900 min-h-[4.5rem] disabled:bg-slate-100 disabled:text-slate-500 transition-all outline-none"
                    />
                  </div>

                  {/* 4. งบประมาณ 5 ปีใหม่ */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-sm font-bold text-emerald-950">
                        4. งบประมาณรายปี 5 ปี (ใหม่)
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono font-bold text-emerald-900">
                          รวมใหม่: {newTotalBudget.toLocaleString()}
                        </span>
                        {budgetDiff !== 0 && (
                          <span
                            className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                              budgetDiff > 0
                                ? 'bg-amber-200 text-amber-900'
                                : 'bg-rose-200 text-rose-900'
                            }`}
                          >
                            ({budgetDiff > 0 ? '+' : ''}
                            {budgetDiff.toLocaleString()})
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-5 gap-1.5 text-center text-sm">
                      <div>
                        <span className="block text-xs text-emerald-800 font-semibold mb-0.5">
                          2571
                        </span>
                        <input
                          type="text"
                          disabled={isReadOnly}
                          value={b2571}
                          onChange={(e) => setB2571(e.target.value)}
                          className="w-full bg-white border border-emerald-300 focus:border-emerald-600 rounded-lg p-2 text-center font-mono text-xs sm:text-sm text-slate-900 outline-none"
                        />
                      </div>
                      <div>
                        <span className="block text-xs text-emerald-800 font-semibold mb-0.5">
                          2572
                        </span>
                        <input
                          type="text"
                          disabled={isReadOnly}
                          value={b2572}
                          onChange={(e) => setB2572(e.target.value)}
                          className="w-full bg-white border border-emerald-300 focus:border-emerald-600 rounded-lg p-2 text-center font-mono text-xs sm:text-sm text-slate-900 outline-none"
                        />
                      </div>
                      <div>
                        <span className="block text-xs text-emerald-800 font-semibold mb-0.5">
                          2573
                        </span>
                        <input
                          type="text"
                          disabled={isReadOnly}
                          value={b2573}
                          onChange={(e) => setB2573(e.target.value)}
                          className="w-full bg-white border border-emerald-300 focus:border-emerald-600 rounded-lg p-2 text-center font-mono text-xs sm:text-sm text-slate-900 outline-none"
                        />
                      </div>
                      <div>
                        <span className="block text-xs text-emerald-800 font-semibold mb-0.5">
                          2574
                        </span>
                        <input
                          type="text"
                          disabled={isReadOnly}
                          value={b2574}
                          onChange={(e) => setB2574(e.target.value)}
                          className="w-full bg-white border border-emerald-300 focus:border-emerald-600 rounded-lg p-2 text-center font-mono text-xs sm:text-sm text-slate-900 outline-none"
                        />
                      </div>
                      <div>
                        <span className="block text-xs text-emerald-800 font-semibold mb-0.5">
                          2575
                        </span>
                        <input
                          type="text"
                          disabled={isReadOnly}
                          value={b2575}
                          onChange={(e) => setB2575(e.target.value)}
                          className="w-full bg-white border border-emerald-300 focus:border-emerald-600 rounded-lg p-2 text-center font-mono text-xs sm:text-sm text-slate-900 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 5. ผลที่คาดว่าจะได้รับใหม่ */}
                  <div>
                    <label className="block text-sm font-bold text-emerald-950 mb-1">
                      5. ผลที่คาดว่าจะได้รับ (ใหม่)
                    </label>
                    <textarea
                      rows={2}
                      disabled={isReadOnly}
                      value={expectedResults}
                      onChange={(e) => setExpectedResults(e.target.value)}
                      placeholder="ระบุผลประโยชน์ที่ประชาชนหรือท้องถิ่นจะได้รับ..."
                      className="w-full bg-white border border-emerald-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/30 rounded-lg p-2.5 text-sm text-slate-900 min-h-[4rem] disabled:bg-slate-100 disabled:text-slate-500 transition-all outline-none"
                    />
                  </div>

                  {/* 6. หน่วยงานและแผนงานใหม่ */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm">
                    <div>
                      <label className="text-emerald-950 font-bold block text-xs mb-1">
                        หน่วยงานรับผิดชอบ:
                      </label>
                      <select
                        disabled={isReadOnly}
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full bg-white border border-emerald-300 rounded-lg p-2.5 text-slate-900 text-sm outline-none"
                      >
                        {DEPARTMENTS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-emerald-950 font-bold block text-xs mb-1">
                        แผนงาน:
                      </label>
                      <select
                        disabled={isReadOnly}
                        value={planCategory}
                        onChange={(e) => setPlanCategory(e.target.value)}
                        className="w-full bg-white border border-emerald-300 rounded-lg p-2.5 text-slate-900 text-sm outline-none"
                      >
                        {PLAN_CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* 7. พื้นที่ดำเนินการ */}
                  <div className="text-sm">
                    <label className="text-emerald-950 font-bold block text-xs mb-1">
                      พื้นที่ดำเนินการ{edition === 'amended' || edition === 'changed' ? 'ใหม่' : ''}:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <select
                        disabled={isReadOnly}
                        value={areaType}
                        onChange={(e) => setAreaType(e.target.value as ProjectAreaType)}
                        className="w-full bg-white border border-emerald-300 rounded-lg p-2.5 text-slate-900 text-sm outline-none"
                      >
                        <option value="village">1) รายหมู่บ้าน (เขต 1-2-3)</option>
                        <option value="facility">2) ภายในหน่วยงาน</option>
                        <option value="custom">3) ภายในเขต/ภายนอกเขต</option>
                      </select>

                      {areaType === 'village' && (
                        <select
                          disabled={isReadOnly}
                          value={selectedVillageNum}
                          onChange={(e) => setSelectedVillageNum(Number(e.target.value))}
                          className="w-full bg-white border border-emerald-300 rounded-lg p-2.5 text-slate-900 text-sm outline-none"
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
                          disabled={isReadOnly}
                          value={selectedFacility}
                          onChange={(e) => setSelectedFacility(e.target.value)}
                          className="w-full bg-white border border-emerald-300 rounded-lg p-2.5 text-slate-900 text-sm outline-none"
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
                          type="text"
                          disabled={isReadOnly}
                          value={customLocation}
                          onChange={(e) => setCustomLocation(e.target.value)}
                          placeholder='ระบุสถานที่ เช่น "ทุกหมู่บ้านในเขตเทศบาล" หรือ "นอกเขตพื้นที่เทศบาล"'
                          className="w-full bg-white border border-emerald-300 rounded-lg p-2.5 text-slate-900 text-sm outline-none placeholder:text-slate-400 font-medium"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. ส่วนล่างของฟอร์ม: เหตุผลและความจำเป็น ที่ต้องเปลี่ยนแปลง/แก้ไข */}
              <div className="border border-amber-300 bg-[#fffbeb]/80 rounded-xl p-4 space-y-2 shadow-2xs">
                <label className="block text-sm font-bold text-amber-900">
                  เหตุผลและความจำเป็น ที่ต้อง{edition === 'amended' ? 'แก้ไข' : 'เปลี่ยนแปลง'}
                </label>
                <textarea
                  rows={2}
                  disabled={isReadOnly}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="ระบุเหตุผลความจำเป็นและข้อเท็จจริงประกอบการพิจารณา..."
                  className={`w-full border rounded-lg p-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none resize-y leading-relaxed ${
                    isReadOnly
                      ? 'bg-amber-50/50 border-amber-200 text-slate-600 cursor-not-allowed'
                      : 'bg-white border-amber-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-400/20'
                  }`}
                />
              </div>
            </section>
          )}

          {/* ========================================================================= */}
          {/* ส่วนที่ 2 (ฉบับแรก/เพิ่มเติม) / ส่วนที่ 3 (ฉบับอื่น): รายละเอียดโครงการตามแบบ ผ.02 เต็มรูปแบบ */}
          {/* ========================================================================= */}
          {(isSingleView || viewMode === 'detail02' || activeSection === 'detail02') && (
            <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 flex-wrap gap-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="bg-[#055740] text-white font-bold px-3 py-1 rounded-md text-sm">
                    แบบ ผ.02
                  </span>
                  <div>
                    <h4 className="font-bold text-base text-slate-900">
                      {isSingleView ? 'ส่วนที่ 2: ' : ''}บัญชีรายละเอียดโครงการพัฒนาท้องถิ่น (แบบ ผ.02)
                    </h4>
                    <p className="text-sm text-slate-500 mt-0.5">
                      รายละเอียดทางการสำหรับโครงการตามระเบียบกระทรวงมหาดไทย
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-sm font-semibold cursor-pointer shadow-2xs transition-colors"
                >
                  <Printer className="w-4 h-4 text-slate-600" />
                  <span>พิมพ์หน้านี้ (แบบ ผ.02)</span>
                </button>
              </div>

              {/* ข้อมูลพื้นฐานโครงการ */}
              <div className="bg-emerald-50/50 p-5 rounded-xl border border-emerald-200 space-y-2">
                <div className="text-sm font-bold text-emerald-800">ชื่อโครงการ</div>
                <div className="text-base sm:text-lg font-bold text-slate-950 leading-relaxed">
                  {name || project.name}
                </div>
                <div className="flex items-center gap-3 flex-wrap text-sm text-slate-700 pt-1 border-t border-emerald-200/60">
                  <span>
                    <strong className="font-bold text-slate-900">ประเด็นการพัฒนา:</strong> {planStrategy || project.planStrategy || '-'}
                  </span>
                  <span className="text-emerald-400">•</span>
                  <span>
                    <strong className="font-bold text-slate-900">แผนงาน:</strong> {planCategory || project.planCategory || '-'}
                  </span>
                  <span className="text-emerald-400">•</span>
                  <span>
                    <strong className="font-bold text-slate-900">ประเภท:</strong>{' '}
                    {edition === 'first'
                      ? 'ฉบับแรก'
                      : edition === 'additional'
                      ? 'เพิ่มเติม'
                      : edition === 'changed'
                      ? 'เปลี่ยนแปลง'
                      : 'แก้ไข'}
                  </span>
                </div>
              </div>

              {/* วัตถุประสงค์ & เป้าหมาย */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 sm:p-5 bg-white border border-slate-200 rounded-xl space-y-2">
                  <label className="text-sm font-bold text-slate-900 block">วัตถุประสงค์</label>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {objective || project.objective || 'ไม่มีข้อมูลระบุ'}
                  </p>
                </div>
                <div className="p-4 sm:p-5 bg-white border border-slate-200 rounded-xl space-y-2">
                  <label className="text-sm font-bold text-slate-900 block">
                    เป้าหมาย (ผลผลิตของโครงการ)
                  </label>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {target || project.target || 'ไม่มีข้อมูลระบุ'}
                  </p>
                </div>
              </div>

              {/* ตารางกรอบงบประมาณ 5 ปี */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-900 block">
                  กรอบงบประมาณตามแผนพัฒนาท้องถิ่น (พ.ศ. 2571 - 2575)
                </label>
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-[#055740] text-white font-bold text-center">
                        <th className="py-3 px-3.5 border-r border-emerald-700/60 text-sm w-1/5">พ.ศ. 2571 (บาท)</th>
                        <th className="py-3 px-3.5 border-r border-emerald-700/60 text-sm w-1/5">พ.ศ. 2572 (บาท)</th>
                        <th className="py-3 px-3.5 border-r border-emerald-700/60 text-sm w-1/5">พ.ศ. 2573 (บาท)</th>
                        <th className="py-3 px-3.5 border-r border-emerald-700/60 text-sm w-1/5">พ.ศ. 2574 (บาท)</th>
                        <th className="py-3 px-3.5 text-sm w-1/5">พ.ศ. 2575 (บาท)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="divide-x divide-slate-200 bg-white">
                        <td className="py-3 px-3.5 font-mono text-right text-slate-900 text-sm font-semibold">
                          {Number(b2571 || 0) > 0 ? Number(b2571).toLocaleString() : '-'}
                        </td>
                        <td className="py-3 px-3.5 font-mono text-right text-slate-900 text-sm font-semibold">
                          {Number(b2572 || 0) > 0 ? Number(b2572).toLocaleString() : '-'}
                        </td>
                        <td className="py-3 px-3.5 font-mono text-right text-slate-900 text-sm font-semibold">
                          {Number(b2573 || 0) > 0 ? Number(b2573).toLocaleString() : '-'}
                        </td>
                        <td className="py-3 px-3.5 font-mono text-right text-slate-900 text-sm font-semibold">
                          {Number(b2574 || 0) > 0 ? Number(b2574).toLocaleString() : '-'}
                        </td>
                        <td className="py-3 px-3.5 font-mono text-right text-slate-900 text-sm font-semibold">
                          {Number(b2575 || 0) > 0 ? Number(b2575).toLocaleString() : '-'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ผลที่คาดว่าจะได้รับ & พื้นที่/หน่วยงาน */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="p-4 sm:p-5 bg-white border border-slate-200 rounded-xl space-y-2">
                  <label className="font-bold text-slate-900 text-sm block">ผลที่คาดว่าจะได้รับ</label>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-sm">
                    {expectedResults || project.expectedResults || 'ไม่มีข้อมูลระบุ'}
                  </p>
                </div>
                <div className="p-4 sm:p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 text-sm">
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>
                      หน่วยงานหลักที่รับผิดชอบ:{' '}
                      <strong className="font-bold text-slate-900">{department || project.department || '-'}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>
                      พื้นที่ดำเนินการ:{' '}
                      <strong className="font-bold text-slate-900">
                        {areaType === 'village'
                          ? (() => {
                              const v = ALL_VILLAGES.find((vil) => vil.villageNumber === selectedVillageNum);
                              return v ? `${v.zone} • ${v.villageName}` : (project.village || 'เทศบาลเมืองศิลา');
                            })()
                          : areaType === 'facility'
                          ? `ภายในหน่วยงาน • ${selectedFacility}`
                          : `ภายในเขต/ภายนอกเขต • ${customLocation.trim() || 'ทุกหมู่บ้านในเขตเทศบาล'}`}
                      </strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>
                      ปี พ.ศ. ที่บรรจุในแผน: <strong className="font-bold text-slate-900">พ.ศ. {year}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* เหตุผลและความจำเป็นที่ต้องเพิ่มเติมแผน (เฉพาะโครงการเพิ่มเติม) */}
              {project.edition === 'additional' && (
                <div className="p-4 sm:p-5 bg-[#FFF8E1] border border-[#FDE68A] rounded-xl space-y-2 shadow-2xs">
                  <label className="text-sm font-bold text-amber-950 block">
                    เหตุผลและความจำเป็นที่ต้องเพิ่มเติมแผน
                  </label>
                  <p className="text-sm text-amber-950/90 font-medium leading-relaxed whitespace-pre-wrap">
                    {reason || project.reason || project.note || 'ไม่มีข้อมูลระบุ'}
                  </p>
                </div>
              )}

              {/* เหตุผลความจำเป็น (กรณีฉบับเปลี่ยนแปลง/แก้ไข - ซ่อนในโครงการฉบับแรกและฉบับเพิ่มเติม) */}
              {!isSingleView && (edition === 'changed' || edition === 'amended' || reason) && (
                <div className="p-4 sm:p-5 bg-[#FFF8E1] border border-[#FDE68A] rounded-xl space-y-2 shadow-2xs">
                  <label className="font-bold text-amber-950 text-sm block">
                    เหตุผลและความจำเป็น ที่ต้อง{edition === 'amended' ? 'แก้ไข' : 'เปลี่ยนแปลง'}
                  </label>
                  <p className="text-sm text-amber-950/90 font-medium leading-relaxed whitespace-pre-wrap">
                    {reason || 'ไม่มีข้อมูลระบุ'}
                  </p>
                </div>
              )}
            </section>
          )}
        </div>

        {/* ========================================================================= */}
        {/* Modal Actions Bar (ปุ่มควบคุมด้านล่าง)                                    */}
        {/* ========================================================================= */}
        <div className="shrink-0 px-5 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          {/* Left: Indicator Note & Delete Button */}
          <div className="flex items-center gap-3">
            {!isReadOnly && onDelete && (
              <button
                id="btn-delete-workflow-project"
                type="button"
                onClick={() => {
                  if (window.confirm(`ต้องการลบโครงการ "${project.name}" ออกจากระบบใช่หรือไม่?`)) {
                    onDelete(project.id);
                    onClose();
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold border border-rose-300 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl cursor-pointer transition-colors shadow-2xs"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>ลบโครงการ</span>
              </button>
            )}

            {isReadOnly ? (
              <span className="inline-flex items-center gap-1.5 text-slate-500 font-medium text-xs">
                <Info className="w-4 h-4 text-slate-400" />
                <span>โหมดดูข้อมูลอย่างเดียว (Read-only)</span>
              </span>
            ) : isSingleView ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-900 font-medium text-xs sm:text-sm">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>
                  งบประมาณรวม 5 ปี:{' '}
                  <strong className="font-mono font-bold text-emerald-800 text-sm sm:text-base">
                    {newTotalBudget.toLocaleString()}
                  </strong>
                </span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-emerald-900 font-medium text-xs">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>
                  งบรวมใหม่:{' '}
                  <strong className="font-mono text-emerald-800">
                    {newTotalBudget.toLocaleString()}
                  </strong>{' '}
                  ({budgetDiff > 0 ? `+${budgetDiff.toLocaleString()}` : budgetDiff < 0 ? `-${Math.abs(budgetDiff).toLocaleString()}` : 'เท่างบเดิม'})
                </span>
              </span>
            )}
          </div>

          {/* Right: Actions Buttons */}
          <div className="flex items-center gap-2.5">
            {/* ปุ่ม [บันทึกการแก้ไข] : ซ่อนในฉบับแรกและฉบับเพิ่มเติมตามข้อ 4 */}
            {!isReadOnly && !isSingleView && (
              <button
                id="btn-save-project-edit"
                type="button"
                onClick={handleSave}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm sm:text-base font-bold bg-[#055740] hover:bg-emerald-800 text-white rounded-xl shadow-xs cursor-pointer transition-all active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>บันทึกการแก้ไข</span>
              </button>
            )}

            {/* สำหรับฉบับอื่น (ที่ไม่ใช่ฉบับแรกและไม่ใช่ฉบับเพิ่มเติม): สลับมุมมองดูแบบ ผ.02 หรือกลับฟอร์มแก้ไข */}
            {!isSingleView && !isPublicUser && (
              <button
                id="btn-view-detail-02"
                type="button"
                onClick={() => {
                  if (viewMode === 'compare') {
                    setViewMode('detail02');
                    setActiveSection('detail02');
                  } else {
                    setViewMode('compare');
                    setActiveSection('all');
                  }
                }}
                className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm sm:text-base font-semibold rounded-xl cursor-pointer transition-colors shadow-2xs ${
                  viewMode === 'compare'
                    ? 'text-[#055740] bg-emerald-50 hover:bg-emerald-100 border border-emerald-300'
                    : 'text-slate-700 bg-white hover:bg-slate-100 border border-slate-300'
                }`}
              >
                {viewMode === 'compare' ? (
                  <>
                    <BookOpen className="w-4 h-4" />
                    <span>ดูรายละเอียดโครงการ (แบบ ผ.02)</span>
                  </>
                ) : (
                  <>
                    <ArrowLeftRight className="w-4 h-4" />
                    <span>กลับสู่ฟอร์มแก้ไข</span>
                  </>
                )}
              </button>
            )}

            {/* ปุ่ม [ปิดหน้าต่าง] - สไตล์สีเขียวอ่อนพาสเทลพร้อมตัวอักษรสีเขียวเข้ม */}
            <button
              id="btn-close-workflow-modal"
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center px-5 py-2 text-sm sm:text-base font-semibold rounded-xl cursor-pointer transition-colors shadow-2xs bg-[#E8F5E9] hover:bg-[#D1E7DD] text-[#0F5132] border border-[#C8E6C9] active:scale-95"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
