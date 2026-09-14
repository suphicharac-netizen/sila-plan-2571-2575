import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  Clock,
  Building2,
  Calendar,
  FileCheck2,
  Send,
  ShieldCheck,
  BookOpen,
  ArrowRight,
  Info,
  Check,
  ExternalLink,
  Copy
} from 'lucide-react';
import { ProjectData, UserAccount, ActiveNavMenu } from '../types';
import { getProjectDisplayId } from '../utils/projectCode';
import { EXECUTION_STATUS_CONFIG, getExecutionStatus } from '../utils/villageUtils';

interface ProjectStatusWorkflowModalProps {
  project: ProjectData | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserAccount | null;
  onViewProjectDetail?: (project: ProjectData) => void;
  onNavigateToMenu?: (menu: ActiveNavMenu) => void;
}

export const ProjectStatusWorkflowModal: React.FC<ProjectStatusWorkflowModalProps> = ({
  project,
  isOpen,
  onClose,
  currentUser,
  onViewProjectDetail,
  onNavigateToMenu
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !project) return null;

  const isPublicUser = currentUser?.role === 'public';
  const isAdminOrExec = currentUser?.role === 'admin' || currentUser?.role === 'executive';
  const isApproved = project.status === 'approved';
  const isPublished =
    project.publishStatus === 'published_first' ||
    project.publishStatus === 'published_additional' ||
    project.publishStatus === 'published_changed' ||
    isApproved;

  // Determine current stage & label
  let currentStageText = 'ร่างโครงการ';
  let currentStageColor = 'bg-slate-100 text-slate-700 border-slate-300';

  if (isPublished) {
    if (project.executionStatus === 'completed') {
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

  // Format Dates
  const formattedApproveDate =
    project.approvedDate && project.approvedDate !== '-'
      ? project.approvedDate
      : '01/09/2569';

  const handleCopyCode = () => {
    const code = project.code || getProjectDisplayId(project, project.orderNumber);
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="project-status-workflow-modal"
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-hidden animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="shrink-0 px-6 py-4 bg-[#055740] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 text-emerald-300">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                สถานะและประวัติการเสนอเรื่องโครงการ
              </h3>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                Project Approval & Tracking Workflow • เทศบาลเมืองศิลา
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่าง"
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          {/* ========================================================= */}
          {/* ส่วนที่ 2.1 สรุปสถานะปัจจุบัน (Current Status Summary) */}
          {/* ========================================================= */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="space-y-1 max-w-[78%]">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-200/70 text-slate-700">
                    ปีงบประมาณ {project.year}
                  </span>
                  <span
                    className={`text-[11px] font-medium px-2 py-0.5 rounded border ${
                      project.edition === 'first'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : project.edition === 'additional'
                        ? 'bg-sky-50 text-sky-700 border-sky-200'
                        : project.edition === 'changed'
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {project.edition === 'first'
                      ? 'ฉบับแรก'
                      : project.edition === 'additional'
                      ? 'เพิ่มเติม'
                      : project.edition === 'changed'
                      ? 'เปลี่ยนแปลง'
                      : 'แก้ไข'}
                  </span>
                </div>
                <h4 className="font-bold text-sm sm:text-base text-slate-900 leading-snug">
                  {project.name}
                </h4>
              </div>

              {/* Status Badge */}
              <div className="text-right shrink-0">
                <span className="text-[10px] text-slate-500 block mb-1 font-medium">สถานะปัจจุบัน</span>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shadow-xs ${currentStageColor}`}
                >
                  {isPublished ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : isApproved ? (
                    <Check className="w-3.5 h-3.5 text-teal-600" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                  )}
                  <span>{currentStageText}</span>
                </span>
              </div>
            </div>

            {/* Quick Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-200/70 text-xs">
              <div className="flex items-center gap-2 text-slate-600">
                <Building2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span className="truncate">
                  <span className="text-slate-400">หน่วยงาน:</span>{' '}
                  <strong className="text-slate-800">{project.department || '-'}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Calendar className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>
                  <span className="text-slate-400">งบประมาณ:</span>{' '}
                  <strong className="font-mono text-emerald-800">
                    ฿{(project.budgetApproved > 0 ? project.budgetApproved : project.budgetPlan).toLocaleString()}
                  </strong>
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <span className="text-slate-400">แหล่งงบ:</span>
                <span className="truncate font-medium text-slate-700" title={project.budgetSource}>
                  {project.budgetSource || 'เทศบัญญัติงบประมาณ'}
                </span>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* ส่วนที่ 2.2 และ 3: สายงานการเสนอเรื่อง & สิทธิ์การเข้าถึง */}
          {/* ========================================================= */}
          {isPublicUser ? (
            /* -------------------------------------------------- */
            /* มุมมองสำหรับประชาชนทั่วไป (Simplified Public View) */
            /* -------------------------------------------------- */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h5 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>ขั้นตอนความคืบหน้าโครงการ (สำหรับประชาชน)</span>
                </h5>
                <span className="text-[11px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                  โปร่งใส ตรวจสอบได้
                </span>
              </div>

              {/* Simplified 3-Step Public Timeline */}
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {/* Public Step 1 */}
                <div className="relative">
                  <span className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                    <Check className="w-3 h-3" />
                  </span>
                  <div>
                    <div className="flex items-center justify-between">
                      <h6 className="font-bold text-xs text-slate-900">1. จัดทำและเสนอโครงการ</h6>
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded font-medium">
                        ดำเนินการแล้ว
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      หน่วยงานผู้รับผิดชอบ ({project.department}) สำรวจความต้องการของชุมชนและจัดทำรายละเอียดโครงการ
                    </p>
                  </div>
                </div>

                {/* Public Step 2 */}
                <div className="relative">
                  <span
                    className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs ${
                      isApproved
                        ? 'bg-emerald-600 text-white'
                        : 'bg-amber-500 text-white'
                    }`}
                  >
                    {isApproved ? <Check className="w-3 h-3" /> : '2'}
                  </span>
                  <div>
                    <div className="flex items-center justify-between">
                      <h6 className="font-bold text-xs text-slate-900">2. การพิจารณาและกลั่นกรอง</h6>
                      <span
                        className={`text-[10px] px-2 py-0.2 rounded font-medium ${
                          isApproved
                            ? 'text-emerald-700 bg-emerald-50'
                            : 'text-amber-700 bg-amber-50'
                        }`}
                      >
                        {isApproved ? 'ผ่านความเห็นชอบแล้ว' : 'อยู่ระหว่างพิจารณา'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      ผ่านการกลั่นกรองโดยคณะกรรมการพัฒนาเทศบาลเมืองศิลา และผู้บริหารพิจารณาความสอดคล้องกับยุทธศาสตร์
                    </p>
                  </div>
                </div>

                {/* Public Step 3 */}
                <div className="relative">
                  <span
                    className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs ${
                      isPublished
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {isPublished ? <Check className="w-3 h-3" /> : '3'}
                  </span>
                  <div>
                    <div className="flex items-center justify-between">
                      <h6 className="font-bold text-xs text-slate-900">3. อนุมัติบรรจุในแผนพัฒนาท้องถิ่น</h6>
                      <span
                        className={`text-[10px] px-2 py-0.2 rounded font-medium ${
                          isPublished
                            ? 'text-emerald-700 bg-emerald-50'
                            : 'text-slate-600 bg-slate-100'
                        }`}
                      >
                        {isPublished ? 'ประกาศใช้เรียบร้อยแล้ว' : 'รอการประกาศใช้'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      บรรจุในแผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575) และประกาศใช้เป็นกรอบงบประมาณสำหรับการพัฒนาเมืองศิลา
                    </p>
                  </div>
                </div>
              </div>

              {/* Public Friendly Notice */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 flex items-start gap-2 text-xs text-emerald-900">
                <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">ข้อมูลสำหรับประชาชน:</p>
                  <p className="text-emerald-800/90 mt-0.5">
                    โครงการนี้ได้รับการจัดทำและบรรจุในระบบแผนพัฒนาท้องถิ่นเทศบาลเมืองศิลา
                    ท่านสามารถติดตามสถานะการจัดสรรงบประมาณและการดำเนินงานของหมู่บ้านของท่านได้ผ่านระบบนี้อย่างต่อเนื่อง
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* -------------------------------------------------- */
            /* สายงานการเสนอเรื่อง 4 ขั้นตอนสำหรับเจ้าหน้าที่/ผู้บริหาร */
            /* -------------------------------------------------- */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h5 className="font-bold text-xs uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <FileCheck2 className="w-4 h-4 text-emerald-700" />
                  <span>สายงานการเสนอเรื่องและประวัติการอนุมัติ (Workflow 4 ขั้นตอน)</span>
                </h5>
                <span className="text-[10px] text-slate-500 font-mono">
                  เอกสารอ้างอิง: {project.planBookOrder ? `ลำดับที่ ${project.planBookOrder}` : '-'}
                </span>
              </div>

              <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {/* Step 1: เสนอต้นเรื่อง */}
                <div className="relative">
                  <span className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                    <Check className="w-3 h-3" />
                  </span>
                  <div className="bg-white rounded-xl p-3 border border-slate-200 hover:border-slate-300 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">
                            ขั้นตอนที่ 1: เสนอต้นเรื่องโครงการ
                          </span>
                          <span className="text-[10px] font-medium bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded border border-emerald-200">
                            สำเร็จ
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          เจ้าหน้าที่ผู้รับผิดชอบ / ผู้อำนวยการ{project.department || 'กองเจ้าของเรื่อง'}
                        </p>
                      </div>
                      <span className="text-[11px] font-mono text-slate-500 shrink-0">
                        {formattedApproveDate !== '-' ? formattedApproveDate : '15/08/2569'}
                      </span>
                    </div>
                    <div className="mt-2 text-[11px] text-slate-500 bg-slate-50 rounded-lg p-2 border border-slate-100">
                      • จัดทำแบบฟอร์มคำขอและวัตถุประสงค์โครงการ พร้อมประมาณการกรอบงบประมาณ
                    </div>
                  </div>
                </div>

                {/* Step 2: อนุมัติในหลักการ */}
                <div className="relative">
                  <span
                    className={`absolute -left-6 top-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs ${
                      isApproved
                        ? 'bg-emerald-600 text-white'
                        : 'bg-amber-500 text-white'
                    }`}
                  >
                    {isApproved ? <Check className="w-3 h-3" /> : '2'}
                  </span>
                  <div
                    className={`bg-white rounded-xl p-3 border transition-colors ${
                      isApproved ? 'border-slate-200' : 'border-amber-200 bg-amber-50/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">
                            ขั้นตอนที่ 2: อนุมัติในหลักการ
                          </span>
                          <span
                            className={`text-[10px] font-medium px-1.5 py-0.2 rounded border ${
                              isApproved
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {isApproved ? 'สำเร็จ' : 'อยู่ระหว่างเสนออนุมัติ'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          คณะผู้บริหาร / นายกเทศมนตรีเมืองศิลา
                        </p>
                      </div>
                      <span className="text-[11px] font-mono text-slate-500 shrink-0">
                        {isApproved ? formattedApproveDate : 'รอพิจารณา'}
                      </span>
                    </div>
                    <div className="mt-2 text-[11px] text-slate-500 bg-slate-50 rounded-lg p-2 border border-slate-100">
                      {isApproved ? (
                        <>
                          • คำสั่ง/มติ:{' '}
                          <strong className="text-slate-700">
                            {project.approvalOrderNo || 'คำสั่ง ทม.ศิลา ที่ 128/2569'}
                          </strong>{' '}
                          (อนุมัติในหลักการแล้ว)
                        </>
                      ) : (
                        '• อยู่ระหว่างการพิจารณากลั่นกรองและลงนามเห็นชอบโดยผู้บริหาร'
                      )}
                    </div>
                  </div>
                </div>

                {/* Step 3: ส่งมอบเอกสารแนบ ผ.02/ผ.03 */}
                <div className="relative">
                  <span
                    className={`absolute -left-6 top-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs ${
                      isApproved
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-300 text-slate-600'
                    }`}
                  >
                    {isApproved ? <Check className="w-3 h-3" /> : '3'}
                  </span>
                  <div className="bg-white rounded-xl p-3 border border-slate-200">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">
                            ขั้นตอนที่ 3: ส่งมอบเอกสารแนบ ผ.02/ผ.03
                          </span>
                          <span
                            className={`text-[10px] font-medium px-1.5 py-0.2 rounded border ${
                              isApproved
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {isApproved ? 'สำเร็จ' : 'รอดำเนินการ'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          ส่งมอบไปยัง กองยุทธศาสตร์และงบประมาณ (ฝ่ายแผนงานและงบประมาณ)
                        </p>
                      </div>
                      <span className="text-[11px] font-mono text-slate-500 shrink-0">
                        {isApproved ? formattedApproveDate : '-'}
                      </span>
                    </div>
                    <div className="mt-2 text-[11px] text-slate-500 bg-slate-50 rounded-lg p-2 border border-slate-100">
                      • ตรวจรับเอกสารแบบ ผ.02 ตรวจสอบความสอดคล้องกับยุทธศาสตร์การพัฒนาท้องถิ่น
                    </div>
                  </div>
                </div>

                {/* Step 4: บรรจุแผนและประกาศใช้ */}
                <div className="relative">
                  <span
                    className={`absolute -left-6 top-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs ${
                      isPublished
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-300 text-slate-600'
                    }`}
                  >
                    {isPublished ? <Check className="w-3 h-3" /> : '4'}
                  </span>
                  <div className="bg-white rounded-xl p-3 border border-slate-200">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">
                            ขั้นตอนที่ 4: บรรจุแผนและประกาศใช้
                          </span>
                          <span
                            className={`text-[10px] font-medium px-1.5 py-0.2 rounded border ${
                              isPublished
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {isPublished ? 'สำเร็จ (ประกาศใช้แล้ว)' : 'รอดำเนินการ'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          สภาเทศบาลเมืองศิลา / นายกเทศมนตรีเมืองศิลา ลงนามประกาศใช้
                        </p>
                      </div>
                      <span className="text-[11px] font-mono text-slate-500 shrink-0">
                        {isPublished ? formattedApproveDate : '-'}
                      </span>
                    </div>
                    <div className="mt-2 text-[11px] text-slate-500 bg-slate-50 rounded-lg p-2 border border-slate-100">
                      {project.planReference ? (
                        <>• {project.planReference}</>
                      ) : (
                        '• บรรจุในแผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575) และประกาศใช้เป็นฉบับสมบูรณ์'
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* ส่วนที่ 2.3 ติดตามผลการดำเนินงานจริง (Project Implementation Status) */}
          {/* ========================================================= */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <h5 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>สถานะการดำเนินงานจริงและการจัดตั้งงบประมาณ (Implementation Status)</span>
              </h5>
              {project.isBudgetAllocated ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  <span>🔵 จัดตั้งงบประมาณแล้ว</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span>🟡 อยู่ในแผน (ยังไม่ตั้งงบ)</span>
                </span>
              )}
            </div>

            {project.isBudgetAllocated ? (
              <div className="bg-white rounded-lg p-3 border border-slate-200 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-slate-500 font-medium">ความก้าวหน้าโครงการจริง:</span>
                  {(() => {
                    const st = getExecutionStatus(project);
                    const conf = EXECUTION_STATUS_CONFIG[st];
                    return (
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-2xs ${conf.bgClass} ${conf.textClass} ${conf.borderClass}`}>
                        <span>{conf.icon}</span>
                        <span>{conf.label}</span>
                      </span>
                    );
                  })()}
                </div>

                {project.executionProgressNote && (
                  <div className="pt-2 border-t border-slate-100 text-xs">
                    <span className="text-slate-400 font-medium">บันทึกความก้าวหน้า / หมายเหตุ:</span>
                    <p className="text-slate-800 mt-0.5 bg-slate-50 rounded p-2 border border-slate-100">
                      "{project.executionProgressNote}"
                    </p>
                  </div>
                )}

                {project.executionUpdatedDate && (
                  <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                    <span>ปรับปรุงล่าสุด: {project.executionUpdatedDate}</span>
                    {project.executionUpdatedBy && (
                      <span>โดย: {project.executionUpdatedBy}</span>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500 leading-relaxed bg-white rounded-lg p-2.5 border border-slate-200">
                โครงการนี้ได้รับการบรรจุในแผนพัฒนาท้องถิ่น (พ.ศ. 2571–2575) แล้ว โดยจะดำเนินการติดตามและอัปเดตสถานะงานจริงเมื่อมีการจัดทำเทศบัญญัติจัดตั้งงบประมาณประจำปีต่อไป
              </p>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="shrink-0 px-6 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-end gap-2">
          <div className="flex items-center gap-2">
            {/* View Full 02 Detail Button (if authorized) */}
            {onViewProjectDetail && !isPublicUser && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onViewProjectDetail(project);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#055740] bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg cursor-pointer transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>ดูรายละเอียดโครงการ (แบบ ผ.02)</span>
              </button>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg cursor-pointer transition-colors"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
