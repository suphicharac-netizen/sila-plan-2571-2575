import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Building2,
  Calendar,
  Clock,
  Coins,
  Tag,
  CheckCircle2,
  FileText,
  Printer
} from 'lucide-react';
import { ProjectData, UserAccount, ApprovalAuditEntry } from '../types';

interface BudgetApprovalModalProps {
  project: ProjectData | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedProject: ProjectData) => void;
  currentUser?: UserAccount | null;
}

// Helper: Format clean number with comma separation and no "บาท" or "฿"
const formatCleanNumber = (val: number | null | undefined): string => {
  if (val === null || val === undefined || isNaN(val)) return '0';
  return Math.round(val).toLocaleString('th-TH');
};

// Helper: Get formatted Thai Date & Time string for Audit Trail
const getCurrentThaiDateTime = (): { dateStr: string; fullTimestamp: string } => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear() + 543; // Buddhist Era
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return {
    dateStr: `${day}/${month}/${year}`,
    fullTimestamp: `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`
  };
};

export const BudgetApprovalModal: React.FC<BudgetApprovalModalProps> = ({
  project,
  isOpen,
  onClose,
  onSave,
  currentUser
}) => {
  // Editable text note state
  const [approvalNote, setApprovalNote] = useState<string>('');

  // Reset/Initialize note ONLY when modal opens or target project id changes
  useEffect(() => {
    if (isOpen && project) {
      setApprovalNote(project.note || '');
    }
  }, [isOpen, project?.id]);

  if (!isOpen || !project) return null;

  // Determine requested budget amount
  const requestedBudgetAmount =
    project.budgetApproved > 0 ? project.budgetApproved : project.budgetPlan;

  // Determine budget source
  const currentBudgetSource =
    project.budgetSource && project.budgetSource !== '- ยังไม่ได้จัดสรร -'
      ? project.budgetSource
      : 'เทศบัญญัติงบประมาณรายจ่าย';

  // Handle Confirm Approval
  const handleConfirmApproval = (e: React.FormEvent) => {
    e.preventDefault();

    const { dateStr, fullTimestamp } = getCurrentThaiDateTime();
    const approverName = currentUser?.fullName || 'ผู้ดูแลระบบ (Admin)';
    const approverRole = currentUser?.role || 'admin';
    const trimmedNote = approvalNote.trim();

    // 1. Create Audit Trail Entry
    const newAuditEntry: ApprovalAuditEntry = {
      action: 'อนุมัติงบประมาณ',
      timestamp: fullTimestamp,
      userName: approverName,
      userRole: approverRole,
      note: trimmedNote || undefined,
      amount: requestedBudgetAmount
    };

    const existingAudit = project.approvalAuditTrail || [];

    // 2. Automated Updates:
    // - เปลี่ยนสถานะโครงการทันทีจาก "รออนุมัติ" -> "อนุมัติแล้ว"
    // - บันทึก วันที่/เวลา ที่กดอนุมัติ + ชื่อผู้ใช้งาน/ผู้อนุมัติ ลงในระบบประวัติการอนุมัติอัตโนมัติ (Audit Trail)
    // - บันทึกข้อความหมายเหตุที่พิมพ์ไปบันทึกร่วมกับข้อมูล
    const updatedProject: ProjectData = {
      ...project,
      status: 'approved',
      budgetApproved: requestedBudgetAmount,
      budgetSource: currentBudgetSource,
      approvedDate: dateStr,
      approvedBy: approverName,
      approvedAt: fullTimestamp,
      approvalAuditTrail: [newAuditEntry, ...existingAudit],
      note: trimmedNote || project.note || ''
    };

    onSave(updatedProject);
    onClose();
  };

  return (
    <div
      id="budget-approval-modal"
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 my-auto flex flex-col">
        {/* 1. Modal Header: "อนุมัติงบประมาณ" */}
        <div className="px-5 py-4 bg-linear-to-r from-[#054e3b] to-[#046c4e] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                อนุมัติงบประมาณ
              </h3>
              <p className="text-[11px] text-emerald-100 font-normal mt-0.5">
                ยืนยันการจัดสรรงบประมาณโครงการพัฒนาท้องถิ่น
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="พิมพ์หน้ารายละเอียดการอนุมัตินี้"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>พิมพ์หน้านี้</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg text-emerald-100 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
              title="ปิดหน้าต่าง"
              aria-label="ปิดหน้าต่าง"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleConfirmApproval} className="p-5 sm:p-6 space-y-5">
          {/* 2. ส่วนแสดงสรุปรายการข้อมูลโครงการ (Card Summary - อ่านได้อย่างเดียว) */}
          <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 sm:p-4.5 space-y-3.5 shadow-2xs">
            {/* Project Name */}
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                ชื่อโครงการ
              </span>
              <h4 className="text-sm sm:text-base font-bold text-slate-900 mt-0.5 leading-snug">
                {project.name}
              </h4>
              {project.code && (
                <span className="inline-block mt-1 font-mono text-[11px] text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                  รหัส: {project.code}
                </span>
              )}
            </div>

            {/* Grid 2 Columns: Metadata */}
            <div className="grid grid-cols-2 gap-3 pt-2.5 border-t border-slate-200/80 text-xs">
              {/* หน่วยงานรับผิดชอบ (สำนัก / กอง) */}
              <div>
                <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>หน่วยงานรับผิดชอบ</span>
                </span>
                <div className="font-bold text-slate-800 mt-0.5 truncate" title={project.department}>
                  {project.department || '-'}
                </div>
              </div>

              {/* ปีงบประมาณ */}
              <div>
                <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>ปีงบประมาณ</span>
                </span>
                <div className="font-bold text-slate-800 mt-0.5">
                  พ.ศ. {project.year || '2571'}
                </div>
              </div>

              {/* แหล่งงบประมาณ */}
              <div className="col-span-2 sm:col-span-1">
                <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  <span>แหล่งงบประมาณ</span>
                </span>
                <div className="font-bold text-slate-800 mt-0.5 truncate" title={currentBudgetSource}>
                  {currentBudgetSource}
                </div>
              </div>

              {/* สถานะปัจจุบัน (แสดง Badge "รออนุมัติ") */}
              <div className="col-span-2 sm:col-span-1">
                <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                  สถานะปัจจุบัน
                </span>
                {project.status === 'approved' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                    อนุมัติแล้ว
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold text-amber-800 bg-amber-100 border border-amber-300 rounded-full shadow-2xs">
                    <Clock className="w-3 h-3 text-amber-600" />
                    <span>รออนุมัติ</span>
                  </span>
                )}
              </div>
            </div>

            {/* Financial Highlight Box: งบตามแผน & งบขออนุมัติ (บาท) */}
            <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-slate-200/80">
              {/* งบประมาณตามแผน (บาท) */}
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 font-medium block">
                  งบประมาณตามแผน (บาท)
                </span>
                <span className="text-sm sm:text-base font-bold font-mono text-slate-800 mt-0.5 block truncate">
                  {formatCleanNumber(project.budgetPlan)}
                </span>
              </div>

              {/* จำนวนเงินงบประมาณที่ขออนุมัติ (บาท) */}
              <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200">
                <span className="text-[11px] text-emerald-800 font-semibold block">
                  จำนวนเงินที่ขออนุมัติ (บาท)
                </span>
                <span className="text-sm sm:text-base font-bold font-mono text-emerald-900 mt-0.5 block truncate">
                  {formatCleanNumber(requestedBudgetAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* 3. ช่องกรอกข้อมูล: ฟิลด์ "หมายเหตุการอนุมัติ" แบบ Interactive, Enabled และ Editable อย่างแท้จริง */}
          <div>
            <label
              htmlFor="approval-note-input"
              className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>หมายเหตุการอนุมัติ</span>
              <span className="text-slate-400 font-normal text-[11px]">
                (ไม่บังคับกรอก)
              </span>
            </label>
            <input
              id="approval-note-input"
              name="approvalNote"
              type="text"
              disabled={false}
              readOnly={false}
              autoComplete="off"
              value={approvalNote}
              onChange={(e) => setApprovalNote(e.target.value)}
              placeholder="ระบุหมายเหตุหรือเงื่อนไขเพิ่มเติม (ไม่บังคับกรอก)..."
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-emerald-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-500 hover:border-emerald-400 transition-colors shadow-2xs"
            />
          </div>

          {/* 4. ปุ่มดำเนินการมีเพียง 2 ปุ่มสไตล์ Minimalist: [ยกเลิก] และ [✓ ยืนยันอนุมัติ] */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            {/* [ยกเลิก] (ปุ่มขอบเทา/ฟ้าอ่อน) */}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:border-slate-400 rounded-xl transition-colors cursor-pointer shadow-2xs"
            >
              ยกเลิก
            </button>

            {/* [✓ ยืนยันอนุมัติ] (ปุ่มสีฟ้า/เขียวเด่นชัด) */}
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs sm:text-sm font-bold text-white bg-linear-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 active:scale-[0.98] rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>ยืนยันอนุมัติ</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
