import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  Building2,
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  MapPin,
  Coins,
  CheckCircle2,
  AlertTriangle,
  Save,
  UserCheck,
  ShieldCheck,
  Activity
} from 'lucide-react';
import { ProjectData, UserAccount, ProjectExecutionStatus } from '../types';
import { PlanProjectChangedModal } from './PlanProjectChangedModal';
import {
  isProjectBudgetAllocated,
  toggleProjectBudgetAllocation,
  getProjectVillageInfo,
  canUserUpdateExecutionStatus,
  EXECUTION_STATUS_CONFIG,
  getExecutionStatus
} from '../utils/villageUtils';

interface PlanProjectDetailModalProps {
  project: ProjectData | null;
  allProjects?: ProjectData[];
  onClose: () => void;
  onSave?: (updatedProject: ProjectData) => void;
  onDelete?: (projectId: string) => void;
  readOnly?: boolean;
  currentUser?: UserAccount | null;
}

export const PlanProjectDetailModal: React.FC<PlanProjectDetailModalProps> = ({
  project,
  allProjects,
  onClose,
  onSave,
  onDelete,
  readOnly = false,
  currentUser
}) => {
  if (!project) return null;

  // Local state for tracking implementation status & progress notes
  const isBudgetAllocated = isProjectBudgetAllocated(project);
  const [selectedStatus, setSelectedStatus] = useState<ProjectExecutionStatus>(
    getExecutionStatus(project)
  );
  const [progressNote, setProgressNote] = useState<string>(
    project.executionProgressNote || ''
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setSelectedStatus(getExecutionStatus(project));
    setProgressNote(project.executionProgressNote || '');
    setSavedSuccess(false);
  }, [project]);

  // If the project is a changed plan (ฉบับเปลี่ยนแปลง), render the dedicated comparative layout matching user mockup
  if (project.edition === 'changed') {
    return (
      <PlanProjectChangedModal
        isOpen={Boolean(project)}
        project={project}
        allProjects={allProjects}
        onClose={onClose}
        onSave={readOnly ? undefined : onSave}
        onDelete={readOnly ? undefined : onDelete}
        readOnly={readOnly}
      />
    );
  }

  const b71 = project.budgetByYear?.['2571'] || 0;
  const b72 = project.budgetByYear?.['2572'] || 0;
  const b73 = project.budgetByYear?.['2573'] || 0;
  const b74 = project.budgetByYear?.['2574'] || 0;
  const b75 = project.budgetByYear?.['2575'] || 0;
  const total5Years = b71 + b72 + b73 + b74 + b75;

  // RBAC Permission Check
  const canUpdate = canUserUpdateExecutionStatus(currentUser, project) && Boolean(onSave) && !readOnly;
  const isPublicUser = currentUser?.role === 'public';

  const handleSaveExecutionStatus = () => {
    if (!onSave) return;
    const updaterName = currentUser
      ? `${currentUser.fullName} (${
          currentUser.role === 'admin'
            ? 'ผู้ดูแลระบบ'
            : currentUser.role === 'executive'
            ? 'ผู้บริหาร/ผอ.กอง'
            : currentUser.department || 'เจ้าหน้าที่'
        })`
      : 'เจ้าหน้าที่ผู้รับผิดชอบ';

    const updated: ProjectData = {
      ...project,
      executionStatus: selectedStatus,
      executionProgressNote: progressNote.trim(),
      executionUpdatedDate: new Date().toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      executionUpdatedBy: updaterName
    };

    onSave(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-hidden">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="bg-[#055740] text-white px-6 py-4.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-[#034131] border border-emerald-600/60 text-emerald-200 font-bold px-2.5 py-1 rounded text-sm">
              ผ.02
            </div>
            <div>
              <h2 className="font-bold text-xl leading-tight">รายละเอียดโครงการพัฒนาท้องถิ่น (แบบ ผ.02)</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-emerald-100 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-7 flex-1 min-h-0 overflow-y-auto space-y-5 sm:space-y-6 text-base text-slate-800">
          {/* Project Title Block */}
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
            <div className="text-sm font-bold text-emerald-800 mb-1.5">ชื่อโครงการ</div>
            <div className="text-xl sm:text-2xl font-black text-slate-950 leading-snug">{project.name}</div>
            <div className="text-sm sm:text-base text-slate-600 mt-2 font-medium">ประเด็นการพัฒนา: {project.planStrategy}</div>
          </div>

          {/* Key Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-base font-bold text-slate-800">วัตถุประสงค์</label>
              <div className="p-4 bg-white border border-slate-200 rounded-xl text-base leading-relaxed text-slate-800 shadow-xs">
                {project.objective || 'ไม่มีข้อมูลระบุ'}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-base font-bold text-slate-800">เป้าหมาย (ผลผลิตของโครงการ)</label>
              <div className="p-4 bg-white border border-slate-200 rounded-xl text-base leading-relaxed text-slate-800 shadow-xs">
                {project.target || 'ไม่มีข้อมูลระบุ'}
              </div>
            </div>
          </div>

          {/* 5-Year Budget Table */}
          <div>
            <label className="text-base font-bold text-slate-800 block mb-2.5">
              กรอบงบประมาณตามแผนพัฒนาท้องถิ่น (พ.ศ. 2571 - 2575)
            </label>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-base text-center border-collapse">
                <thead>
                  <tr className="bg-emerald-800 text-white font-bold text-base">
                    <th className="py-3 px-3.5 border-r border-emerald-700">พ.ศ. 2571</th>
                    <th className="py-3 px-3.5 border-r border-emerald-700">พ.ศ. 2572</th>
                    <th className="py-3 px-3.5 border-r border-emerald-700">พ.ศ. 2573</th>
                    <th className="py-3 px-3.5 border-r border-emerald-700">พ.ศ. 2574</th>
                    <th className="py-3 px-3.5 border-r border-emerald-700">พ.ศ. 2575</th>
                    <th className="py-3 px-4 bg-emerald-900 font-bold">รวม 5 ปี (บาท)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="divide-x divide-slate-200 bg-white text-base">
                    <td className="py-3.5 px-3.5 font-mono font-bold text-slate-900">{b71 > 0 ? b71.toLocaleString() : '-'}</td>
                    <td className="py-3.5 px-3.5 font-mono font-bold text-slate-900">{b72 > 0 ? b72.toLocaleString() : '-'}</td>
                    <td className="py-3.5 px-3.5 font-mono font-bold text-slate-900">{b73 > 0 ? b73.toLocaleString() : '-'}</td>
                    <td className="py-3.5 px-3.5 font-mono font-bold text-slate-900">{b74 > 0 ? b74.toLocaleString() : '-'}</td>
                    <td className="py-3.5 px-3.5 font-mono font-bold text-slate-900">{b75 > 0 ? b75.toLocaleString() : '-'}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-800 bg-emerald-50/70 text-lg">
                      {total5Years.toLocaleString()} บาท
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Expected Results & Department */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-base font-bold text-slate-800">ผลที่คาดว่าจะได้รับ</label>
              <div className="p-4 bg-white border border-slate-200 rounded-xl text-base leading-relaxed text-slate-800 shadow-xs">
                {project.expectedResults || 'ไม่มีข้อมูลระบุ'}
              </div>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="text-base font-bold text-slate-800">หน่วยงานหลักที่รับผิดชอบ</label>
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-semibold text-slate-900 flex items-center gap-2.5">
                  <Building2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>{project.department}</span>
                </div>
              </div>

              <div>
                <label className="text-base font-bold text-slate-800">หมวดแผนงาน</label>
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-semibold text-slate-900 flex items-center gap-2.5">
                  <FileText className="w-5 h-5 text-slate-500 shrink-0" />
                  <span>{project.planCategory}</span>
                </div>
              </div>

              <div>
                <label className="text-base font-bold text-slate-800">พื้นที่ดำเนินการ (เขต / หมู่บ้าน)</label>
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-semibold text-slate-900 flex items-center gap-2.5">
                  <MapPin className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>
                    {(() => {
                      const vInfo = getProjectVillageInfo(project);
                      return vInfo ? `${vInfo.zone} • ${vInfo.villageName}` : (project.zone ? `${project.zone} • ` : '') + (project.village || 'เทศบาลเมืองศิลา');
                    })()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Budget Allocation Status Tracking Card (Requirement 3) */}
          <div className={`p-5 rounded-2xl border transition-all ${
            isBudgetAllocated
              ? 'bg-emerald-50/90 border-emerald-300'
              : 'bg-amber-50/90 border-amber-300'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isBudgetAllocated ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
                }`}>
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-base font-bold text-slate-950 flex flex-wrap items-center gap-2.5">
                    <span>การติดตามสถานะการนำไปตั้งงบประมาณ</span>
                    {isBudgetAllocated ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-blue-100 text-blue-950 border border-blue-300">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                        <span>🔵 ตั้งงบประมาณแล้ว</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-amber-100 text-amber-950 border border-amber-400">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        <span>🟡 อยู่ในแผน (ยังไม่ตั้งงบ)</span>
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-700 mt-1 leading-relaxed">
                    {isBudgetAllocated
                      ? 'โครงการนี้ถูกบรรจุในเทศบัญญัติงบประมาณรายจ่ายประจำปีของเทศบาลเมืองศิลาแล้ว พร้อมสำหรับการติดตามการดำเนินงาน'
                      : 'โครงการได้รับการบรรจุในแผนพัฒนาท้องถิ่น (ผ.02) แล้ว แต่ยังไม่ได้นำไปจัดทำเทศบัญญัติงบประมาณรายจ่าย'}
                  </p>
                </div>
              </div>

              {/* Toggle button for Staff / Admin / Executives */}
              {currentUser?.role !== 'public' && onSave && (
                <div className="shrink-0">
                  {isBudgetAllocated ? (
                    <button
                      type="button"
                      onClick={() => {
                        const updated = toggleProjectBudgetAllocation(project);
                        onSave(updated);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 text-sm font-bold rounded-xl shadow-xs transition-colors cursor-pointer min-h-[42px]"
                      title="สลับสถานะกลับเป็นยังไม่ตั้งงบประมาณ"
                    >
                      <span>สลับกลับเป็นยังไม่ตั้งงบ (🟡)</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        const updated = toggleProjectBudgetAllocation(project);
                        onSave(updated);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold rounded-xl shadow-xs transition-colors cursor-pointer min-h-[42px]"
                      title="นำโครงการนี้ไปจัดทำเทศบัญญัติงบประมาณรายจ่าย"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>นำไปตั้งงบประมาณแล้ว (🔵)</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Project Implementation Status Section (สถานะการดำเนินงานโครงการจริงในพื้นที่) */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="bg-slate-50 px-5 py-3.5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5">
                <Activity className="w-5 h-5 text-emerald-700" />
                <span className="text-base font-bold text-slate-900">
                  สถานะการดำเนินงานโครงการในพื้นที่ (Project Implementation Status)
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isBudgetAllocated ? (
                  <span className="text-xs text-slate-600 font-semibold">
                    เฉพาะโครงการที่ตั้งงบประมาณแล้ว
                  </span>
                ) : (
                  <span className="text-xs text-amber-800 font-bold bg-amber-50 px-2.5 py-1 rounded-md border border-amber-300">
                    ต้องตั้งงบประมาณก่อนจึงติดตามงานจริงได้
                  </span>
                )}
              </div>
            </div>

            <div className="p-5 space-y-5">
              {!isBudgetAllocated ? (
                /* Unbudgeted State */
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-center space-y-2.5">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 text-amber-800 font-bold text-base">
                    🟡
                  </div>
                  <h4 className="text-base font-bold text-slate-900">
                    โครงการอยู่ในแผนพัฒนาท้องถิ่น (ยังไม่ตั้งงบประมาณ)
                  </h4>
                  <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
                    โครงการนี้ยังไม่ได้นำไปจัดทำเทศบัญญัติงบประมาณรายจ่าย จึงยังไม่มีการเริ่มดำเนินงานจริงในพื้นที่
                    เมื่อสำนัก/กองที่รับผิดชอบได้ตั้งงบประมาณแล้ว ระบบจะเปิดให้บันทึกและติดตามสถานะการดำเนินงานจริง
                  </p>
                </div>
              ) : (
                /* Budgeted State: Implementation Workflow */
                <div className="space-y-5">
                  {/* Status Selection / Display */}
                  <div>
                    <div className="text-base font-bold text-slate-800 mb-2.5 flex items-center justify-between">
                      <span>สถานะความก้าวหน้าโครงการจริง:</span>
                      {isPublicUser && (
                        <span className="text-xs text-emerald-800 font-bold flex items-center gap-1">
                          <UserCheck className="w-4 h-4" />
                          <span>มุมมองประชาชน (อ่านอย่างเดียว)</span>
                        </span>
                      )}
                    </div>

                    {canUpdate ? (
                      /* Interactive Status Selector for Authorized Staff / Executive / Admin */
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* 1. In Progress */}
                        <button
                          type="button"
                          onClick={() => setSelectedStatus('in_progress')}
                          className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                            selectedStatus === 'in_progress'
                              ? 'bg-sky-50 border-sky-500 ring-2 ring-sky-300 text-sky-950 shadow-xs'
                              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-base font-bold flex items-center gap-2">
                              <span>⏳</span>
                              <span>อยู่ระหว่างดำเนินการ</span>
                            </span>
                            {selectedStatus === 'in_progress' && (
                              <CheckCircle2 className="w-5 h-5 text-sky-600" />
                            )}
                          </div>
                          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                            เข้าพื้นที่แล้ว / จัดซื้อจัดจ้าง / กำลังก่อสร้างหรือจัดกิจกรรม
                          </p>
                          <div className="mt-2.5 text-xs font-bold text-sky-800">
                            Badge: สีฟ้า/น้ำเงิน
                          </div>
                        </button>

                        {/* 2. Completed */}
                        <button
                          type="button"
                          onClick={() => setSelectedStatus('completed')}
                          className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                            selectedStatus === 'completed'
                              ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-300 text-emerald-950 shadow-xs'
                              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-base font-bold flex items-center gap-2">
                              <span>✅</span>
                              <span>ดำเนินการแล้วเสร็จ</span>
                            </span>
                            {selectedStatus === 'completed' && (
                              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            )}
                          </div>
                          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                            งานเสร็จสิ้น 100% ตรวจรับพัสดุและส่งมอบพื้นที่เรียบร้อย
                          </p>
                          <div className="mt-2.5 text-xs font-bold text-emerald-800">
                            Badge: สีเขียว
                          </div>
                        </button>

                        {/* 3. Cancelled / Transferred */}
                        <button
                          type="button"
                          onClick={() => setSelectedStatus('cancelled')}
                          className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                            selectedStatus === 'cancelled'
                              ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-300 text-rose-950 shadow-xs'
                              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-base font-bold flex items-center gap-2">
                              <span>🔴</span>
                              <span>ไม่ได้ดำเนินการ / โอนลด</span>
                            </span>
                            {selectedStatus === 'cancelled' && (
                              <CheckCircle2 className="w-5 h-5 text-rose-600" />
                            )}
                          </div>
                          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                            ยกเลิกโครงการ โอนลดงบประมาณ หรือปรับเปลี่ยนแผน
                          </p>
                          <div className="mt-2.5 text-xs font-bold text-rose-800">
                            Badge: สีแดง/เทา
                          </div>
                        </button>
                      </div>
                    ) : (
                      /* Read-Only Status Display for Public or Non-authorized Users */
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3.5">
                          <span className="text-3xl">
                            {selectedStatus === 'completed' ? '✅' : selectedStatus === 'cancelled' ? '🔴' : '⏳'}
                          </span>
                          <div>
                            <div className="flex items-center gap-2.5">
                              <span className="text-base font-bold text-slate-950">
                                {selectedStatus === 'completed'
                                  ? 'ดำเนินการแล้วเสร็จ'
                                  : selectedStatus === 'cancelled'
                                  ? 'ไม่ได้ดำเนินการ / โอนลด'
                                  : 'อยู่ระหว่างดำเนินการ'}
                              </span>
                              <span
                                className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                                  selectedStatus === 'completed'
                                    ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                                    : selectedStatus === 'cancelled'
                                    ? 'bg-rose-100 text-rose-950 border-rose-300'
                                    : 'bg-sky-100 text-sky-950 border-sky-300'
                                }`}
                              >
                                {selectedStatus === 'completed'
                                  ? 'สถานะ: เสร็จสิ้น 100%'
                                  : selectedStatus === 'cancelled'
                                  ? 'สถานะ: โอนลด/ยกเลิก'
                                  : 'สถานะ: กำลังดำเนินงาน'}
                              </span>
                            </div>
                            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                              {EXECUTION_STATUS_CONFIG[selectedStatus]?.description || 'อยู่ระหว่างดำเนินงานตามแผนงาน'}
                            </p>
                          </div>
                        </div>

                        {/* Combined Badge Preview */}
                        <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium">
                          <span className="text-blue-800 font-bold">🔵 ตั้งงบแล้ว</span>
                          <span className="text-slate-300">|</span>
                          <span
                            className={
                              selectedStatus === 'completed'
                                ? 'text-emerald-800 font-bold'
                                : selectedStatus === 'cancelled'
                                ? 'text-rose-800 font-bold'
                                : 'text-sky-800 font-bold'
                            }
                          >
                            {selectedStatus === 'completed'
                              ? '✅ แล้วเสร็จ'
                              : selectedStatus === 'cancelled'
                              ? '🔴 โอนลด'
                              : '⏳ กำลังทำ'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Progress Notes & Remarks */}
                  <div className="space-y-2">
                    <label className="text-base font-bold text-slate-800 flex items-center justify-between">
                      <span>บันทึกหมายเหตุความก้าวหน้าโครงการ (Progress Notes / Remarks):</span>
                      {canUpdate && (
                        <span className="text-xs text-slate-500 font-normal">
                          เช่น % งานหน้างาน, รายละเอียดการส่งมอบ, หรือสาเหตุการโอนลด
                        </span>
                      )}
                    </label>

                    {canUpdate ? (
                      <textarea
                        rows={3}
                        value={progressNote}
                        onChange={(e) => setProgressNote(e.target.value)}
                        placeholder="ระบุความคืบหน้าการดำเนินงานจริงในพื้นที่ เช่น ผู้รับเหมาเริ่มเข้าปรับพื้นที่แล้ว หรือ ส่งมอบงานงวดสุดท้ายเรียบร้อย..."
                        className="w-full text-base p-3.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-slate-900 leading-relaxed font-normal"
                      />
                    ) : (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-base text-slate-800 leading-relaxed min-h-[52px]">
                        {project.executionProgressNote ? (
                          <span>{project.executionProgressNote}</span>
                        ) : (
                          <span className="text-slate-400 italic">
                            ยังไม่มีการบันทึกหมายเหตุความก้าวหน้าเพิ่มเติม
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Audit Trail & Save Action */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                    <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1">
                      {project.executionUpdatedDate && (
                        <span>
                          อัปเดตล่าสุด:{' '}
                          <strong className="text-slate-800 font-bold font-mono">
                            {project.executionUpdatedDate}
                          </strong>
                        </span>
                      )}
                      {project.executionUpdatedBy && (
                        <span>
                          โดย:{' '}
                          <strong className="text-slate-800 font-bold">
                            {project.executionUpdatedBy}
                          </strong>
                        </span>
                      )}
                      {!project.executionUpdatedDate && !project.executionUpdatedBy && (
                        <span>สถานะเริ่มต้นจากการจัดทำแผนพัฒนา</span>
                      )}
                    </div>

                    {canUpdate && (
                      <div className="flex items-center gap-2.5">
                        {savedSuccess && (
                          <span className="text-sm font-bold text-emerald-800 flex items-center gap-1.5 animate-in fade-in">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>บันทึกสำเร็จ</span>
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={handleSaveExecutionStatus}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-base font-bold rounded-xl shadow-xs transition-colors cursor-pointer min-h-[44px]"
                        >
                          <Save className="w-4 h-4" />
                          <span>บันทึกสถานะและความก้าวหน้า</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Budget Approval Information (Read-Only) */}
          {project.status === 'approved' && (
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-emerald-900 font-bold text-base">
                  <CheckCircle className="w-5 h-5 text-emerald-700" />
                  <span>สถานะการเงินราชการ: ได้รับการอนุมัติงบประมาณแล้ว</span>
                </div>
                <span className="bg-emerald-100 text-emerald-900 text-xs font-bold px-3 py-1 rounded-full border border-emerald-300">
                  อนุมัติแล้ว
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="bg-white p-3.5 rounded-xl border border-emerald-100">
                  <div className="text-xs text-slate-500 font-bold">งบประมาณที่อนุมัติ</div>
                  <div className="text-base font-black text-emerald-800 font-mono mt-1">
                    ฿{project.budgetApproved.toLocaleString()}
                  </div>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-emerald-100">
                  <div className="text-xs text-slate-500 font-bold">แหล่งที่มาของงบประมาณ</div>
                  <div className="text-sm font-bold text-slate-800 mt-1 truncate" title={project.budgetSource}>
                    {project.budgetSource || '-'}
                  </div>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-emerald-100">
                  <div className="text-xs text-slate-500 font-bold">วันที่อนุมัติ</div>
                  <div className="text-sm font-bold text-slate-800 mt-1">
                    {project.approvedDate || '-'}
                  </div>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-emerald-100">
                  <div className="text-xs text-slate-500 font-bold">เลขที่คำสั่งอนุมัติ</div>
                  <div className="text-sm font-bold text-slate-800 mt-1 truncate" title={project.approvalOrderNo}>
                    {project.approvalOrderNo || '-'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-4.5 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-slate-300 rounded-xl bg-white text-slate-800 hover:bg-slate-100 text-base font-semibold transition-colors cursor-pointer min-h-[44px]"
          >
            <Printer className="w-5 h-5 text-slate-600" />
            <span>พิมพ์แบบ ผ.02</span>
          </button>

          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white text-base font-bold rounded-xl transition-colors cursor-pointer min-h-[44px]"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
