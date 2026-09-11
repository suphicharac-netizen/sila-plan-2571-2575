import React from 'react';
import { X, Printer, Building2, Calendar, FileText, CheckCircle, Clock, MapPin } from 'lucide-react';
import { ProjectData } from '../types';
import { PlanProjectChangedModal } from './PlanProjectChangedModal';
import { getProjectDisplayId } from '../utils/projectCode';

interface PlanProjectDetailModalProps {
  project: ProjectData | null;
  allProjects?: ProjectData[];
  onClose: () => void;
  onSave?: (updatedProject: ProjectData) => void;
  onDelete?: (projectId: string) => void;
  readOnly?: boolean;
}

export const PlanProjectDetailModal: React.FC<PlanProjectDetailModalProps> = ({
  project,
  allProjects,
  onClose,
  onSave,
  onDelete,
  readOnly = false
}) => {
  if (!project) return null;

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

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-hidden">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="bg-[#055740] text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-[#034131] border border-emerald-600/60 text-emerald-200 font-bold px-2 py-0.5 rounded text-xs">
              ผ.02
            </div>
            <div>
              <h2 className="font-bold text-base leading-tight">รายละเอียดโครงการพัฒนาท้องถิ่น (แบบ ผ.02)</h2>
              <p className="text-xs text-emerald-100 font-mono">รหัส ID: {getProjectDisplayId(project, project.orderNumber)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-emerald-100 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 flex-1 min-h-0 overflow-y-auto space-y-4 sm:space-y-6 text-sm text-slate-700">
          {/* Project Title Block */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="text-xs font-semibold text-emerald-700 mb-1">ชื่อโครงการ</div>
            <div className="text-base font-bold text-slate-900">{project.name}</div>
            <div className="text-xs text-slate-500 mt-1">ประเด็นการพัฒนา: {project.planStrategy}</div>
          </div>

          {/* Key Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">วัตถุประสงค์</label>
              <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs leading-relaxed text-slate-800">
                {project.objective || 'ไม่มีข้อมูลระบุ'}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">เป้าหมาย (ผลผลิตของโครงการ)</label>
              <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs leading-relaxed text-slate-800">
                {project.target || 'ไม่มีข้อมูลระบุ'}
              </div>
            </div>
          </div>

          {/* 5-Year Budget Table */}
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-2">
              กรอบงบประมาณตามแผนพัฒนาท้องถิ่น (พ.ศ. 2571 - 2575)
            </label>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs text-center border-collapse">
                <thead>
                  <tr className="bg-emerald-800 text-white font-semibold">
                    <th className="py-2 px-3 border-r border-emerald-700">พ.ศ. 2571</th>
                    <th className="py-2 px-3 border-r border-emerald-700">พ.ศ. 2572</th>
                    <th className="py-2 px-3 border-r border-emerald-700">พ.ศ. 2573</th>
                    <th className="py-2 px-3 border-r border-emerald-700">พ.ศ. 2574</th>
                    <th className="py-2 px-3 border-r border-emerald-700">พ.ศ. 2575</th>
                    <th className="py-2 px-3 bg-emerald-900 font-bold">รวม 5 ปี (บาท)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="divide-x divide-slate-200 bg-white">
                    <td className="py-3 px-3 font-mono font-medium">{b71 > 0 ? b71.toLocaleString() : '-'}</td>
                    <td className="py-3 px-3 font-mono font-medium">{b72 > 0 ? b72.toLocaleString() : '-'}</td>
                    <td className="py-3 px-3 font-mono font-medium">{b73 > 0 ? b73.toLocaleString() : '-'}</td>
                    <td className="py-3 px-3 font-mono font-medium">{b74 > 0 ? b74.toLocaleString() : '-'}</td>
                    <td className="py-3 px-3 font-mono font-medium">{b75 > 0 ? b75.toLocaleString() : '-'}</td>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-700 bg-emerald-50">
                      {total5Years.toLocaleString()} บาท
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Expected Results & Department */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">ผลที่คาดว่าจะได้รับ</label>
              <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs leading-relaxed text-slate-800">
                {project.expectedResults || 'ไม่มีข้อมูลระบุ'}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-500">หน่วยงานหลักที่รับผิดชอบ</label>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  <span>{project.department}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500">หมวดแผนงาน</label>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span>{project.planCategory}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500">พื้นที่ดำเนินการ (เขต / หมู่บ้าน)</label>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>
                    {project.zone ? `${project.zone} • ` : ''}{project.village || 'เทศบาลเมืองศิลา'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Budget Approval Information (Read-Only) */}
          {project.status === 'approved' && (
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>สถานะการเงินราชการ: ได้รับการอนุมัติงบประมาณแล้ว</span>
                </div>
                <span className="bg-emerald-100 text-emerald-800 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-emerald-300">
                  อนุมัติแล้ว
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                  <div className="text-[11px] text-slate-500 font-medium">งบประมาณที่อนุมัติ</div>
                  <div className="text-sm font-bold text-emerald-700 font-mono mt-0.5">
                    ฿{project.budgetApproved.toLocaleString()}
                  </div>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                  <div className="text-[11px] text-slate-500 font-medium">แหล่งที่มาของงบประมาณ</div>
                  <div className="text-xs font-semibold text-slate-800 mt-0.5 truncate" title={project.budgetSource}>
                    {project.budgetSource || '-'}
                  </div>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                  <div className="text-[11px] text-slate-500 font-medium">วันที่อนุมัติ</div>
                  <div className="text-xs font-semibold text-slate-800 mt-0.5">
                    {project.approvedDate || '-'}
                  </div>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                  <div className="text-[11px] text-slate-500 font-medium">เลขที่คำสั่งอนุมัติ</div>
                  <div className="text-xs font-semibold text-slate-800 mt-0.5 truncate" title={project.approvalOrderNo}>
                    {project.approvalOrderNo || '-'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-300 rounded-xl bg-white text-slate-700 hover:bg-slate-100 text-xs font-medium transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>พิมพ์แบบ ผ.02</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-medium rounded-xl transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
