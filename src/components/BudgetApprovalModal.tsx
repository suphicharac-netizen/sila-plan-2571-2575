import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import { ProjectData } from '../types';
import { BUDGET_SOURCES } from '../utils/constants';

interface BudgetApprovalModalProps {
  project: ProjectData | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedProject: ProjectData) => void;
}

export const BudgetApprovalModal: React.FC<BudgetApprovalModalProps> = ({
  project,
  isOpen,
  onClose,
  onSave
}) => {
  const [budgetSource, setBudgetSource] = useState('');
  const [budgetApproved, setBudgetApproved] = useState<number>(0);
  const [approvedDate, setApprovedDate] = useState('');
  const [approvalOrderNo, setApprovalOrderNo] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (project) {
      setBudgetSource(
        project.budgetSource && project.budgetSource !== '- ยังไม่ได้จัดสรร -'
          ? project.budgetSource
          : 'เทศบัญญัติงบประมาณรายจ่าย'
      );
      setBudgetApproved(project.budgetApproved > 0 ? project.budgetApproved : project.budgetPlan);
      setApprovedDate(
        project.approvedDate && project.approvedDate !== '-'
          ? project.approvedDate
          : '03/09/2569'
      );
      setApprovalOrderNo(project.approvalOrderNo || 'คำสั่ง ทม.ศิลา ที่ 128/2569');
      setNote(project.note || '');
    }
  }, [project]);

  if (!isOpen || !project) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: ProjectData = {
      ...project,
      budgetSource: budgetSource || 'เทศบัญญัติงบประมาณรายจ่าย',
      budgetApproved: Number(budgetApproved),
      approvedDate: approvedDate || '03/09/2569',
      approvalOrderNo,
      status: 'approved',
      note
    };
    onSave(updated);
  };

  const handleRevoke = () => {
    if (confirm('คุณต้องการยกเลิกการอนุมัติงบประมาณของโครงการนี้หรือไม่?')) {
      const updated: ProjectData = {
        ...project,
        budgetSource: '- ยังไม่ได้จัดสรร -',
        budgetApproved: 0,
        approvedDate: '-',
        approvalOrderNo: '',
        status: 'pending'
      };
      onSave(updated);
    }
  };

  return (
    <div
      id="budget-approval-modal"
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-hidden"
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="shrink-0 px-6 py-4 bg-[#055740] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-300" />
            <h3 className="text-base font-bold">
              {project.status === 'approved' ? 'แก้ไขการอนุมัติงบประมาณ' : 'อนุมัติงบประมาณโครงการ'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-100 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Project Summary Card */}
        <div className="shrink-0 p-4 sm:p-5 bg-slate-50 border-b border-slate-200 text-xs text-slate-700 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-medium text-[11px]">
              {project.department}
            </span>
          </div>
          <div className="font-semibold text-slate-900 text-sm">{project.name}</div>
          <div className="text-slate-500">ประเด็นการพัฒนา: {project.planStrategy}</div>
          <div className="flex items-center justify-between pt-1 border-t border-slate-200">
            <span>
              งบประมาณตามแผนพัฒนา (ปี {project.year}):
            </span>
            <span className="font-mono font-bold text-slate-900 text-sm">
              ฿{project.budgetPlan.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Form Body - Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              แหล่งที่มาของงบประมาณ <span className="text-red-500">*</span>
            </label>
            <select
              value={budgetSource}
              onChange={(e) => setBudgetSource(e.target.value)}
              title={budgetSource || '-- เลือกแหล่งที่มาของงบประมาณ --'}
              required
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer truncate"
            >
              {BUDGET_SOURCES.map((src, idx) => (
                <option key={idx} value={src} title={src}>
                  {src}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                จำนวนงบประมาณที่อนุมัติ (บาท) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={budgetApproved}
                onChange={(e) => setBudgetApproved(Number(e.target.value))}
                required
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 font-mono font-semibold text-emerald-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                วันที่อนุมัติ (วว/ดด/ปปปป) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="03/09/2569"
                value={approvedDate}
                onChange={(e) => setApprovedDate(e.target.value)}
                required
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              เลขที่คำสั่ง / มติคณะกรรมการอนุมัติ
            </label>
            <input
              type="text"
              placeholder="เช่น คำสั่ง ทม.ศิลา ที่ 128/2569 หรือ มติสภาเทศบาลฯ"
              value={approvalOrderNo}
              onChange={(e) => setApprovalOrderNo(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">หมายเหตุการจัดสรร</label>
            <textarea
              rows={2}
              placeholder="ระบุข้อความหรือเงื่อนไขเพิ่มเติม (ถ้ามี)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            {project.status === 'approved' ? (
              <button
                type="button"
                onClick={handleRevoke}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ยกเลิกการอนุมัติ</span>
              </button>
            ) : (
              <div></div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>

              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#059669] hover:bg-[#047857] rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>บันทึกอนุมัติงบประมาณ</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
