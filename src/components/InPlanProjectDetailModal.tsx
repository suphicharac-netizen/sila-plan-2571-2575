import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  FileText,
  MapPin,
  Building2,
  Compass,
  Layers,
  Sparkles,
  Target,
  CheckCircle2,
  Coins,
  ArrowLeft,
  AlertCircle,
  Edit3,
  RotateCcw,
  Eye,
  ShieldCheck,
  Calendar,
  FileCheck2,
  Clock,
  MessageSquare,
  Image as ImageIcon
} from 'lucide-react';
import { ProjectData } from '../types';
import { getProjectVillageInfo, getExecutionStatus, EXECUTION_STATUS_CONFIG } from '../utils/villageUtils';

// Helper function สำหรับสร้างชื่อตำแหน่งเริ่มต้นตามหน่วยงานรับผิดชอบหลัก
const getDefaultPreparerTitle = (dept?: string): string => {
  const d = (dept || '').trim();
  if (!d) return 'เจ้าหน้าที่ผู้รับผิดชอบโครงการ';
  return `เจ้าหน้าที่ผู้รับผิดชอบโครงการประจำ${d}`;
};

const getDefaultApproverTitle = (dept?: string): string => {
  const d = (dept || '').trim();
  if (!d) return 'ผู้อำนวยการกอง / หัวหน้าสำนัก';
  if (d.includes('สำนัก')) {
    return `หัวหน้า${d}`;
  }
  if (d.startsWith('กอง')) {
    return `ผู้อำนวยการ${d}`;
  }
  return `ผู้อำนวยการ${d}`;
};

interface InPlanProjectDetailModalProps {
  project: ProjectData | null;
  isOpen: boolean;
  onClose: () => void;
}

export const InPlanProjectDetailModal: React.FC<InPlanProjectDetailModalProps> = ({
  project,
  isOpen,
  onClose
}) => {
  const [isPreviewPrint, setIsPreviewPrint] = useState(false);

  // Dynamic signature states
  const [preparerName, setPreparerName] = useState('');
  const [preparerPosition, setPreparerPosition] = useState(() => getDefaultPreparerTitle(project?.department));
  const [approverName, setApproverName] = useState('');
  const [approverPosition, setApproverPosition] = useState(() => getDefaultApproverTitle(project?.department));

  // Sync default positions when project changes
  useEffect(() => {
    if (project) {
      setPreparerPosition(getDefaultPreparerTitle(project.department));
      setApproverPosition(getDefaultApproverTitle(project.department));
      setPreparerName('');
      setApproverName('');
    }
  }, [project?.id, project?.department]);

  const handleResetSignatures = () => {
    if (project) {
      setPreparerPosition(getDefaultPreparerTitle(project.department));
      setApproverPosition(getDefaultApproverTitle(project.department));
      setPreparerName('');
      setApproverName('');
    }
  };

  if (!isOpen || !project) return null;

  const villageInfo = getProjectVillageInfo(project);

  // Extract 5-year budget figures
  const b2571 = project.budgetByYear?.['2571'] || 0;
  const b2572 = project.budgetByYear?.['2572'] || 0;
  const b2573 = project.budgetByYear?.['2573'] || 0;
  const b2574 = project.budgetByYear?.['2574'] || 0;
  const b2575 = project.budgetByYear?.['2575'] || 0;
  const totalBudget =
    (Number(b2571) + Number(b2572) + Number(b2573) + Number(b2574) + Number(b2575)) ||
    project.budgetPlan ||
    0;

  // Computed values for Status & Budget sections
  const isBudgetAllocated = Boolean(
    project.status === 'approved' ||
    project.isBudgetAllocated ||
    (project.budgetApproved && project.budgetApproved > 0)
  );

  const executionStatus = getExecutionStatus(project);
  const executionConfig = EXECUTION_STATUS_CONFIG[executionStatus] || EXECUTION_STATUS_CONFIG.in_progress;

  const displayApprovedBudget =
    project.budgetApproved && project.budgetApproved > 0
      ? project.budgetApproved
      : project.budgetPlan || totalBudget;

  const displayBudgetSource =
    project.budgetSource && project.budgetSource !== '- ยังไม่ได้จัดสรร -'
      ? project.budgetSource
      : 'เทศบัญญัติงบประมาณรายจ่าย';

  const displayApprovedDate =
    project.approvedDate && project.approvedDate !== '-'
      ? project.approvedDate
      : isBudgetAllocated
      ? '03/09/2569'
      : 'รอการอนุมัติ';

  const displayApprovalOrderNo =
    project.approvalOrderNo ||
    (isBudgetAllocated ? 'คำสั่ง ทม.ศิลา ที่ 128/2569' : 'รอออกเลขที่คำสั่ง/มติ');

  // Format Edition label
  const editionLabel =
    project.edition === 'first'
      ? 'ฉบับแรก'
      : project.edition === 'additional'
      ? `เพิ่มเติม ${project.editionNumber ? `ครั้งที่ ${project.editionNumber}` : ''}`
      : project.edition === 'changed'
      ? `เปลี่ยนแปลง ${project.editionNumber ? `ครั้งที่ ${project.editionNumber}` : ''}`
      : `แก้ไข ${project.editionNumber ? `ครั้งที่ ${project.editionNumber}` : ''}`;

  // Helper function: คอลัมน์ลำดับที่ แสดงเฉพาะตัวเลขลำดับโครงการ
  const getProjectDisplaySeq = (proj: ProjectData): string => {
    if (proj.planBookOrder && !isNaN(Number(proj.planBookOrder))) {
      const bOrder = Number(proj.planBookOrder);
      if (bOrder > 0 && bOrder < 10000) return String(bOrder);
    }
    const rawOrder = Number(proj.orderNumber);
    if (!isNaN(rawOrder) && rawOrder > 0 && rawOrder < 10000) {
      return String(rawOrder);
    }
    if (proj.code) {
      const match = proj.code.match(/-(\d+)$/);
      if (match && match[1]) {
        const parsed = parseInt(match[1], 10);
        if (parsed > 0 && parsed < 10000) return String(parsed);
      }
    }
    return '1';
  };

  const handlePrint = () => {
    window.print();
  };

  const handleClose = () => {
    setIsPreviewPrint(false);
    onClose();
  };

  // ---------------------------------------------------------------------------
  // ฟังก์ชันเรนเดอร์แผ่นพิมพ์ แบบ ผ.02 A4 แนวนอน (1 หน้าพอดี)
  // ---------------------------------------------------------------------------
  const renderPrintSheet = (isInsideCanvas = false) => (
    <div
      id="plan02-print-sheet"
      className={`w-full max-w-[297mm] bg-white text-black flex flex-col justify-between print:border-none print:shadow-none print:p-0 print:m-0 print:w-full print:max-w-none print:h-auto print:min-h-0 print:overflow-hidden ${
        isInsideCanvas
          ? 'min-h-[210mm] p-7 sm:p-9 shadow-lg border border-slate-300'
          : 'border-0 p-0'
      }`}
      style={{ pageBreakInside: 'avoid', breakInside: 'avoid', pageBreakAfter: 'avoid', breakAfter: 'avoid' }}
    >
      <div>
        {/* หัวเอกสารทางการ */}
        <div className="flex justify-end items-start mb-2">
          <div className="text-right text-xs sm:text-sm font-bold px-2.5 py-0.5 border border-black rounded">
            แบบ ผ.02
          </div>
        </div>

        <div className="text-center space-y-1 mb-3">
          <h3 className="text-base sm:text-lg font-bold text-black">
            รายละเอียดโครงการพัฒนา
          </h3>
          <p className="text-sm font-medium text-black">
            แผนพัฒนาท้องถิ่น (พ.ศ. 2571 - 2575)
          </p>
          <p className="text-sm font-medium text-black">
            เทศบาลเมืองศิลา อำเภอเมืองขอนแก่น จังหวัดขอนแก่น
          </p>
        </div>

        {/* ข้อมูลกำกับยุทธศาสตร์ / ประเด็นการพัฒนา */}
        <div className="text-sm my-3 font-semibold text-black leading-relaxed">
          <div>
            {project.planStrategy?.startsWith('ยุทธศาสตร์ / ประเด็นการพัฒนา:')
              ? project.planStrategy.replace(/^ยุทธศาสตร์\s*\/\s*ประเด็นการพัฒนา\s*:\s*/, '')
              : (project.planStrategy || '-')}
          </div>
        </div>

        {/* ตารางแบบ ผ.02 มาตรฐาน (A4 Landscape) */}
        <div className="w-full overflow-hidden print:overflow-hidden">
          <table className="w-full border-collapse border border-black text-sm text-black table-fixed">
            <colgroup>
              <col className="w-[4%]" />
              <col className="w-[21%]" />
              <col className="w-[14%]" />
              <col className="w-[14%]" />
              <col className="w-[5%]" />
              <col className="w-[5%]" />
              <col className="w-[5%]" />
              <col className="w-[5%]" />
              <col className="w-[5%]" />
              <col className="w-[14%]" />
              <col className="w-[8%]" />
            </colgroup>
            <thead className="p02-table-header" style={{ color: '#000000' }}>
              <tr className="bg-slate-100 print:bg-transparent font-bold text-center border-b border-black text-black">
                <th rowSpan={2} style={{ color: '#000000' }} className="border border-black p-1.5 text-black !text-black font-bold text-center text-xs sm:text-[12.5px] align-middle">
                  ลำดับ
                </th>
                <th rowSpan={2} style={{ color: '#000000' }} className="border border-black p-1.5 text-left text-black !text-black font-bold text-xs sm:text-[12.5px] align-middle">
                  โครงการ<br/>(ชื่อโครงการ)
                </th>
                <th rowSpan={2} style={{ color: '#000000' }} className="border border-black p-1.5 text-left text-black !text-black font-bold text-xs sm:text-[12.5px] align-middle">
                  วัตถุประสงค์
                </th>
                <th rowSpan={2} style={{ color: '#000000' }} className="border border-black p-1.5 text-left text-black !text-black font-bold text-xs sm:text-[12.5px] align-middle">
                  เป้าหมาย<br/>(ผลผลิตของโครงการ)
                </th>
                <th colSpan={5} style={{ color: '#000000' }} className="border border-black py-1 px-0.5 text-center text-black !text-black font-bold text-xs sm:text-[12.5px] align-middle">
                  งบประมาณ
                </th>
                <th rowSpan={2} style={{ color: '#000000' }} className="border border-black p-1.5 text-left text-black !text-black font-bold text-xs sm:text-[12.5px] align-middle">
                  ผลที่คาดว่าจะได้รับ
                </th>
                <th rowSpan={2} style={{ color: '#000000' }} className="border border-black py-1.5 px-0.5 text-center text-black !text-black font-bold text-[11px] sm:text-[11.5px] leading-tight align-middle dept-header">
                  หน่วยงาน<br/>รับผิดชอบหลัก
                </th>
              </tr>
              <tr className="bg-slate-100 print:bg-transparent font-bold text-center border-b border-black text-black">
                <th style={{ color: '#000000' }} className="border border-black py-1 px-0.5 text-black !text-black font-bold text-center text-[10.5px] sm:text-[11px] leading-tight align-middle">
                  <div>พ.ศ. 2571</div>
                  <div className="text-[9.5px] font-normal tracking-tighter">(บาท)</div>
                </th>
                <th style={{ color: '#000000' }} className="border border-black py-1 px-0.5 text-black !text-black font-bold text-center text-[10.5px] sm:text-[11px] leading-tight align-middle">
                  <div>พ.ศ. 2572</div>
                  <div className="text-[9.5px] font-normal tracking-tighter">(บาท)</div>
                </th>
                <th style={{ color: '#000000' }} className="border border-black py-1 px-0.5 text-black !text-black font-bold text-center text-[10.5px] sm:text-[11px] leading-tight align-middle">
                  <div>พ.ศ. 2573</div>
                  <div className="text-[9.5px] font-normal tracking-tighter">(บาท)</div>
                </th>
                <th style={{ color: '#000000' }} className="border border-black py-1 px-0.5 text-black !text-black font-bold text-center text-[10.5px] sm:text-[11px] leading-tight align-middle">
                  <div>พ.ศ. 2574</div>
                  <div className="text-[9.5px] font-normal tracking-tighter">(บาท)</div>
                </th>
                <th style={{ color: '#000000' }} className="border border-black py-1 px-0.5 text-black !text-black font-bold text-center text-[10.5px] sm:text-[11px] leading-tight align-middle">
                  <div>พ.ศ. 2575</div>
                  <div className="text-[9.5px] font-normal tracking-tighter">(บาท)</div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="align-top border-b border-black font-normal">
                <td className="border border-black p-2.5 text-center font-normal text-black text-sm sm:text-base">
                  {getProjectDisplaySeq(project)}
                </td>
                <td className="border border-black p-2.5">
                  <div className="font-normal text-black text-sm sm:text-base leading-snug">{project.name}</div>
                  {project.village && (
                    <div className="text-xs sm:text-sm text-slate-700 mt-1 font-normal">
                      พื้นที่: {project.village}
                    </div>
                  )}
                </td>
                <td className="border border-black p-2.5 text-sm leading-relaxed whitespace-pre-wrap font-normal">
                  {project.objective || '-'}
                </td>
                <td className="border border-black p-2.5 text-sm leading-relaxed whitespace-pre-wrap font-normal">
                  {project.target || '-'}
                </td>
                <td className="border border-black p-2 text-right font-mono font-normal text-sm whitespace-nowrap">
                  {Number(b2571) > 0 ? Number(b2571).toLocaleString() : '-'}
                </td>
                <td className="border border-black p-2 text-right font-mono font-normal text-sm whitespace-nowrap">
                  {Number(b2572) > 0 ? Number(b2572).toLocaleString() : '-'}
                </td>
                <td className="border border-black p-2 text-right font-mono font-normal text-sm whitespace-nowrap">
                  {Number(b2573) > 0 ? Number(b2573).toLocaleString() : '-'}
                </td>
                <td className="border border-black p-2 text-right font-mono font-normal text-sm whitespace-nowrap">
                  {Number(b2574) > 0 ? Number(b2574).toLocaleString() : '-'}
                </td>
                <td className="border border-black p-2 text-right font-mono font-normal text-sm whitespace-nowrap">
                  {Number(b2575) > 0 ? Number(b2575).toLocaleString() : '-'}
                </td>
                <td className="border border-black p-2.5 text-sm leading-relaxed whitespace-pre-wrap font-normal">
                  {project.expectedResults || '-'}
                </td>
                <td className="border border-black p-2.5 text-center text-sm leading-relaxed font-normal">
                  {project.department || '-'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* กรณีมีเหตุผลความจำเป็นในการแก้ไข/เปลี่ยนแปลง */}
        {(project.edition === 'changed' || project.edition === 'amended' || project.reason) && (
          <div className="mt-3 p-3 border border-black rounded text-sm leading-relaxed">
            <strong>* เหตุผลและความจำเป็นในการขอ{project.edition === 'amended' ? 'แก้ไข' : 'เปลี่ยนแปลง'}:</strong>{' '}
            {project.reason || 'เพื่อให้สอดคล้องกับสภาพพื้นที่และความต้องการที่แท้จริงของประชาชน'}
          </div>
        )}
      </div>

      {/* ส่วนลายเซ็นและท้ายเอกสาร: Fit 1 Page */}
      <div className="mt-8 sm:mt-10 print:mt-7 pt-2" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
        <div className="grid grid-cols-2 gap-10 sm:gap-14 text-sm text-center text-black">
          <div className="space-y-1.5">
            <div className="font-medium text-black">
              (ลงชื่อ) ........................................................................ ผู้จัดทำ
            </div>
            <div className="pt-1 font-medium text-black">
              ({preparerName.trim() ? ` ${preparerName.trim()} ` : '........................................................................'})
            </div>
            <div className="text-black font-medium">
              ตำแหน่ง {preparerPosition.trim() || getDefaultPreparerTitle(project.department)}
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="font-medium text-black">
              (ลงชื่อ) ........................................................................ ผู้เห็นชอบ/รับรอง
            </div>
            <div className="pt-1 font-medium text-black">
              ({approverName.trim() ? ` ${approverName.trim()} ` : '........................................................................'})
            </div>
            <div className="text-black font-medium">
              ตำแหน่ง {approverPosition.trim() || getDefaultApproverTitle(project.department)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div
      id="in-plan-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 print:p-0 print:bg-white print:static print:overflow-hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        id="in-plan-modal-container"
        className="relative w-full max-w-5xl xl:max-w-6xl max-h-[94vh] sm:max-h-[92vh] h-full flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 print:border-none print:shadow-none print:max-h-none print:h-auto print:w-full print:rounded-none print:overflow-hidden"
      >
        {/* ========================================================================= */}
        {/* โหมดที่ 1: หน้าจอ Print Preview (พรีวิวแบบ ผ.02 A4 แนวนอน)                 */}
        {/* ========================================================================= */}
        {isPreviewPrint ? (
          <div className="flex flex-col h-full overflow-hidden bg-slate-100 print:bg-white print:overflow-hidden">
            {/* Top Toolbar (ซ่อนตอนสั่งพิมพ์ผ่าน print:hidden) */}
            <div className="shrink-0 px-4 sm:px-6 py-3.5 bg-white border-b border-slate-200 flex items-center justify-between gap-3 z-10 print:hidden shadow-xs">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setIsPreviewPrint(false)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>ย้อนกลับ</span>
                </button>
                <div className="h-5 w-px bg-slate-300" />
                <span className="font-bold text-slate-900 text-xs sm:text-sm md:text-base">
                  ตัวอย่างก่อนพิมพ์ (Print Preview) แบบ ผ.02
                </span>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-[#055740] border border-emerald-200">
                  A4 แนวนอน (Landscape 1 หน้าพอดี)
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* ปุ่มพิมพ์เอกสาร / PDF สีเขียวเด่นชัด */}
                <button
                  id="btn-confirm-print-landscape"
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl cursor-pointer transition-all shadow-sm active:scale-95"
                  title="สั่งพิมพ์หรือบันทึก PDF ทันที"
                >
                  <Printer className="w-4 h-4 text-white" />
                  <span>พิมพ์เอกสาร / PDF</span>
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-8 h-8 sm:w-9 sm:h-9 bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg shadow-xs flex items-center justify-center transition-colors cursor-pointer p-0"
                  title="ปิดหน้าต่าง"
                  aria-label="ปิดหน้าต่าง"
                >
                  <X className="w-5 h-5 stroke-[2.2]" />
                </button>
              </div>
            </div>

            {/* Scrollable Container on Screen (แผ่นกระดาษตัวอย่างและกล่องแก้ไขข้อมูลผู้ลงนาม) */}
            <div className="flex-1 overflow-y-auto overflow-x-auto p-4 sm:p-6 lg:p-8 flex flex-col items-center print:p-0 print:overflow-hidden print:block">
              {/* กล่องสีเหลือง/ครีม สำหรับปรับแต่งข้อมูลผู้ลงนาม (Dynamic Signature Block) - ซ่อนในหน้าพิมพ์จริง */}
              <div className="w-full max-w-[297mm] mb-6 p-4 sm:p-5 bg-amber-50/95 border border-amber-200 rounded-2xl shadow-xs print:hidden">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-amber-200/70">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 shrink-0">
                      <Edit3 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-base sm:text-lg text-slate-900">
                          ปรับแต่งข้อมูลผู้ลงนาม (Dynamic Signature Block)
                        </h4>
                        <span className="text-xs text-amber-900 font-medium bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                          หน่วยงานรับผิดชอบ: {project.department || 'ไม่ระบุ'}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                        แก้ไขชื่อและตำแหน่งผู้ลงนามในช่องด้านล่าง ข้อมูลจะอัปเดตลงในแผ่นพิมพ์ตัวอย่างด้านล่างแบบเรียลไทม์ทันทีก่อนสั่งพิมพ์
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleResetSignatures}
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:text-amber-900 bg-white hover:bg-amber-100/60 px-3 py-1.5 rounded-lg border border-amber-300 cursor-pointer transition-colors shadow-2xs"
                    title="คืนค่าตำแหน่งอัตโนมัติตามหน่วยงานรับผิดชอบหลัก"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                    <span>รีเซ็ตตามหน่วยงาน</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
                  {/* ฝั่งที่ 1: ข้อมูลผู้จัดทำ */}
                  <div className="p-4 bg-white/90 rounded-xl border border-amber-200 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-600" />
                        1. ข้อมูลผู้จัดทำ
                      </span>
                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        เจ้าหน้าที่ประจำกอง/สำนัก
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                        ชื่อ-นามสกุล (เว้นว่างไว้หากต้องการลงลายมือชื่อสด):
                      </label>
                      <input
                        type="text"
                        value={preparerName}
                        onChange={(e) => setPreparerName(e.target.value)}
                        placeholder="เช่น นายสมชาย สบายดี (หรือเว้นว่าง)"
                        className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                        ตำแหน่งผู้จัดทำ:
                      </label>
                      <input
                        type="text"
                        value={preparerPosition}
                        onChange={(e) => setPreparerPosition(e.target.value)}
                        placeholder={`เช่น ${getDefaultPreparerTitle(project.department)}`}
                        className="w-full px-3 py-2 text-sm font-medium text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* ฝั่งที่ 2: ข้อมูลผู้เห็นชอบ/รับรอง */}
                  <div className="p-4 bg-white/90 rounded-xl border border-amber-200 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-600" />
                        2. ข้อมูลผู้เห็นชอบ/รับรอง
                      </span>
                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        ผู้อำนวยการกอง / หัวหน้าสำนัก
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                        ชื่อ-นามสกุล (เว้นว่างไว้หากต้องการลงลายมือชื่อสด):
                      </label>
                      <input
                        type="text"
                        value={approverName}
                        onChange={(e) => setApproverName(e.target.value)}
                        placeholder="เช่น นายประสิทธิ์ มั่งมี (หรือเว้นว่าง)"
                        className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                        ตำแหน่งผู้เห็นชอบ/รับรอง:
                      </label>
                      <input
                        type="text"
                        value={approverPosition}
                        onChange={(e) => setApproverPosition(e.target.value)}
                        placeholder={`เช่น ${getDefaultApproverTitle(project.department)}`}
                        className="w-full px-3 py-2 text-sm font-medium text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* แผ่นพิมพ์ แบบ ผ.02 A4 แนวนอน (อัปเดตเรียลไทม์ตามข้อมูลด้านบน) */}
              {renderPrintSheet(true)}
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* โหมดที่ 2: หน้าต่าง Pop-up แสดงรายละเอียดโครงการ (พร้อมพิมพ์ทันที)         */
          /* ========================================================================= */
          <>
            {/* กล่องเอกสารทางการสำหรับส่งพิมพ์เมื่ออยู่ในโหมด Pop-up (ซ่อนบนหน้าจอ แต่ปรากฏบนหน้าพิมพ์ทันที) */}
            <div className="hidden print:block w-full">
              {renderPrintSheet(false)}
            </div>

            {/* ส่วนแสดงผลบนหน้าจอ Pop-up (จะถูกซ่อนทันทีเมื่อสั่งพิมพ์) */}
            <div className="flex flex-col h-full overflow-hidden print:hidden">
              {/* ----------------------------------------------------------------------- */}
              {/* แถบ Header ตรึงอยู่กับที่ (Fixed Header)                                  */}
              {/* ----------------------------------------------------------------------- */}
              <div className="shrink-0 px-5 sm:px-7 py-3 sm:py-3.5 bg-white border-b border-slate-200 flex items-center justify-between gap-4 z-10">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="shrink-0 bg-[#055740] text-white font-bold px-2.5 py-1 rounded-md text-xs sm:text-sm tracking-wide shadow-2xs">
                    แบบ ผ.02
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-lg sm:text-xl text-slate-900 leading-tight">
                        รายละเอียดโครงการ (แบบ ผ.02)
                      </h3>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-[#055740] border border-emerald-200">
                        {editionLabel}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">
                      เทศบาลเมืองศิลา อำเภอเมืองขอนแก่น จังหวัดขอนแก่น • แผนพัฒนาท้องถิ่น (พ.ศ. 2571 - 2575)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    id="btn-print-this-detail-modal-top"
                    type="button"
                    onClick={handlePrint}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
                    title="พิมพ์เฉพาะเนื้อหาในหน้ารายละเอียดนี้ออกทางเครื่องพิมพ์"
                  >
                    <Printer className="w-4 h-4" />
                    <span>พิมพ์หน้านี้</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClose}
                    aria-label="ปิดหน้าต่าง"
                    title="ปิดหน้าต่าง"
                    className="shrink-0 w-8 h-8 sm:w-9 sm:h-9 bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg shadow-xs flex items-center justify-center transition-colors cursor-pointer p-0"
                  >
                    <X className="w-5 h-5 stroke-[2.2]" />
                  </button>
                </div>
              </div>

              {/* ----------------------------------------------------------------------- */}
              {/* เนื้อหาเรียงตามคอลัมน์มาตรฐานของแบบ ผ.02                                  */}
              {/* ----------------------------------------------------------------------- */}
              <div className="flex-1 min-h-0 overflow-y-auto px-5 sm:px-7 py-4 sm:py-5 space-y-4 text-slate-800 bg-slate-50/50">
                
                {/* ภาพประกอบโครงการ (ถ้ามี) */}
                {(project.imageUrl || project.image) && (
                  <div className="w-full h-52 sm:h-64 md:h-72 rounded-xl overflow-hidden border border-slate-200 shadow-xs relative bg-slate-100 group">
                    <img
                      src={project.imageUrl || project.image}
                      alt={project.name}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-slate-900/75 text-white text-xs font-semibold px-3 py-1 rounded-lg backdrop-blur-xs flex items-center gap-1.5 shadow-xs">
                      <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                      <span>ภาพประกอบโครงการ</span>
                    </div>
                  </div>
                )}

                {/* 1) ชื่อโครงการ */}
                <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-3.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                      <FileText className="w-3.5 h-3.5" />
                      <span>รหัสโครงการ: {project.code || `PRJ-${project.orderNumber || project.id.slice(0, 6)}`}</span>
                    </div>
                    <div className="text-xs sm:text-sm text-slate-500 font-medium">
                      ปีที่บรรจุแผน: <span className="font-bold text-slate-700">พ.ศ. {project.year || '2571'}</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      ชื่อโครงการ
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-950 leading-snug tracking-tight">
                      {project.name}
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2.5 border-t border-slate-100">
                    <div className="flex items-start gap-2.5">
                      <Compass className="w-4 h-4 text-emerald-700 shrink-0 mt-1" />
                      <div>
                        <div className="text-xs sm:text-sm text-slate-500 font-semibold">ประเด็นการพัฒนา (ยุทธศาสตร์)</div>
                        <div className="text-sm sm:text-base font-bold text-slate-900 mt-0.5 leading-relaxed">
                          {project.planStrategy || '-'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <Layers className="w-4 h-4 text-emerald-700 shrink-0 mt-1" />
                      <div>
                        <div className="text-xs sm:text-sm text-slate-500 font-semibold">หมวดแผนงาน</div>
                        <div className="text-sm sm:text-base font-bold text-slate-900 mt-0.5 leading-relaxed">
                          {project.planCategory || '-'}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 2 & 3) วัตถุประสงค์ และ เป้าหมาย (ผลผลิตของโครงการ) */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 2. วัตถุประสงค์ */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-2.5">
                    <div className="flex items-center gap-2 text-[17px] sm:text-[18px] font-bold text-slate-900">
                      <Target className="w-4 h-4 text-emerald-700" />
                      <span>วัตถุประสงค์</span>
                    </div>
                    <div className="text-base text-slate-800 leading-relaxed sm:leading-loose whitespace-pre-wrap">
                      {project.objective || 'เพื่อพัฒนาโครงสร้างพื้นฐานและยกระดับคุณภาพชีวิตของประชาชนในเขตเทศบาลเมืองศิลา'}
                    </div>
                  </div>

                  {/* 3. เป้าหมาย (ผลผลิตของโครงการ) */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-2.5">
                    <div className="flex items-center gap-2 text-[17px] sm:text-[18px] font-bold text-slate-900">
                      <Sparkles className="w-4 h-4 text-emerald-700" />
                      <span>เป้าหมาย (ผลผลิตของโครงการ)</span>
                    </div>
                    <div className="text-base text-slate-800 leading-relaxed sm:leading-loose whitespace-pre-wrap">
                      {project.target || 'ดำเนินการก่อสร้าง/ปรับปรุงตามมาตรฐานทางวิศวกรรมและแผนการพัฒนาที่กำหนด'}
                    </div>
                  </div>
                </section>

                {/* 4) แผนการใช้จ่ายงบประมาณ (พ.ศ. 2571 - 2575) */}
                <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-3.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-emerald-700" />
                      <span className="text-[17px] sm:text-[18px] font-bold text-slate-900">
                        งบประมาณตามแผนพัฒนาท้องถิ่น (พ.ศ. 2571 - 2575)
                      </span>
                    </div>
                    <div className="text-sm sm:text-base text-slate-600">
                      รวมงบประมาณทั้งสิ้น:{' '}
                      <span className="font-black text-emerald-900 text-lg sm:text-xl font-mono">
                        {Number(totalBudget).toLocaleString()}
                      </span>{' '}
                      บาท
                    </div>
                  </div>

                  {/* ตารางงบประมาณรายปี 5 ปี */}
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-center">
                      <thead className="bg-slate-50 text-slate-800 font-bold border-b border-slate-200 text-[15px] sm:text-[16px]">
                        <tr>
                          <th className="py-3 px-3.5 border-r border-slate-200">พ.ศ. 2571</th>
                          <th className="py-3 px-3.5 border-r border-slate-200">พ.ศ. 2572</th>
                          <th className="py-3 px-3.5 border-r border-slate-200">พ.ศ. 2573</th>
                          <th className="py-3 px-3.5 border-r border-slate-200">พ.ศ. 2574</th>
                          <th className="py-3 px-3.5 border-r border-slate-200">พ.ศ. 2575</th>
                          <th className="py-3 px-3.5 bg-emerald-50 text-emerald-900 font-bold">รวม (บาท)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-mono">
                        <tr className="hover:bg-slate-50/50">
                          <td className="py-3 px-3.5 border-r border-slate-200 text-right pr-4 font-mono font-bold text-[16px] sm:text-[17px] text-slate-900">
                            {Number(b2571) > 0 ? Number(b2571).toLocaleString() : '-'}
                          </td>
                          <td className="py-3 px-3.5 border-r border-slate-200 text-right pr-4 font-mono font-bold text-[16px] sm:text-[17px] text-slate-900">
                            {Number(b2572) > 0 ? Number(b2572).toLocaleString() : '-'}
                          </td>
                          <td className="py-3 px-3.5 border-r border-slate-200 text-right pr-4 font-mono font-bold text-[16px] sm:text-[17px] text-slate-900">
                            {Number(b2573) > 0 ? Number(b2573).toLocaleString() : '-'}
                          </td>
                          <td className="py-3 px-3.5 border-r border-slate-200 text-right pr-4 font-mono font-bold text-[16px] sm:text-[17px] text-slate-900">
                            {Number(b2574) > 0 ? Number(b2574).toLocaleString() : '-'}
                          </td>
                          <td className="py-3 px-3.5 border-r border-slate-200 text-right pr-4 font-mono font-bold text-[16px] sm:text-[17px] text-slate-900">
                            {Number(b2575) > 0 ? Number(b2575).toLocaleString() : '-'}
                          </td>
                          <td className="py-3 px-3.5 text-right pr-4 font-mono font-black text-[17px] sm:text-[18px] text-emerald-900 bg-emerald-100/60">
                            {Number(totalBudget).toLocaleString()}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* แถบติดตามสถานะการใช้เทศบัญญัติงบประมาณ (ด้านล่างตารางงบประมาณ) */}
                  <div className="mt-3 p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-200/80 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span className="font-bold text-sm sm:text-base text-slate-900">
                        การติดตามสถานะการใช้เทศบัญญัติงบประมาณ:
                      </span>
                      {isBudgetAllocated ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs">
                          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                          ตั้งงบประมาณแล้ว
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-bold bg-amber-50 text-amber-900 border border-amber-300 shadow-2xs">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          อยู่ในแผน (ยังไม่ตั้งงบ)
                        </span>
                      )}
                    </div>

                    <div className="text-slate-700 text-xs sm:text-sm">
                      {isBudgetAllocated ? (
                        <span className="font-semibold text-emerald-900">บรรจุในเทศบัญญัติงบประมาณรายจ่ายเรียบร้อย</span>
                      ) : (
                        <span className="font-semibold text-amber-900">บรรจุในแผนพัฒนาท้องถิ่น (รอจัดสรรงบประมาณรายจ่าย)</span>
                      )}
                    </div>
                  </div>
                </section>

                {/* 5) ผลที่คาดว่าจะได้รับ & หน่วยงาน & พื้นที่ */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* ผลที่คาดว่าจะได้รับ */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-2.5">
                    <div className="flex items-center gap-2 text-[17px] sm:text-[18px] font-bold text-slate-900">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      <span>ผลที่คาดว่าจะได้รับ</span>
                    </div>
                    <div className="text-base text-slate-800 leading-relaxed sm:leading-loose whitespace-pre-wrap">
                      {project.expectedResults ||
                        'ประชาชนได้รับความสะดวก รวดเร็ว ปลอดภัย และมีคุณภาพชีวิตที่ดีขึ้นตามวิสัยทัศน์การพัฒนาของเทศบาลเมืองศิลา'}
                    </div>
                  </div>

                  {/* หน่วยงาน & พื้นที่ */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-3">
                    <div className="flex items-start gap-2.5 p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <Building2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs sm:text-sm text-slate-500 font-semibold">หน่วยงานรับผิดชอบหลัก</div>
                        <div className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">
                          {project.department || '-'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <MapPin className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs sm:text-sm text-slate-500 font-semibold">พื้นที่ดำเนินการ</div>
                        <div className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">
                          {villageInfo
                            ? `${villageInfo.zone} • ${villageInfo.villageName}`
                            : (project.zone ? `${project.zone} • ` : '') + (project.village || 'เทศบาลเมืองศิลา')}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* กรณีเป็นฉบับเปลี่ยนแปลง หรือ แก้ไข */}
                {(project.edition === 'changed' || project.edition === 'amended' || project.reason) && (
                  <section className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                    <div className="flex items-center gap-1.5 text-[17px] sm:text-[18px] font-bold text-amber-950">
                      <AlertCircle className="w-4 h-4" />
                      <span>เหตุผลและความจำเป็นในการขอ{project.edition === 'amended' ? 'แก้ไข' : 'เปลี่ยนแปลง'}</span>
                    </div>
                    <div className="min-h-[50px] w-full p-3 bg-white/80 rounded-md border border-amber-200 text-base text-slate-800 leading-relaxed sm:leading-loose whitespace-pre-wrap">
                      {project.reason || 'เพื่อให้สอดคล้องกับสภาพพื้นที่และความต้องการที่แท้จริงของประชาชน'}
                    </div>
                  </section>
                )}

                {/* ------------------------------------------------------------------- */}
                {/* 6) สถานะการดำเนินงานโครงการในพื้นที่ (Project Implementation Status)  */}
                {/* ------------------------------------------------------------------- */}
                <section className="bg-white border border-emerald-200/90 rounded-xl p-4 sm:p-5 shadow-xs space-y-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-emerald-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800 shrink-0">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-[17px] sm:text-[18px] text-slate-900">
                          สถานะการดำเนินงานโครงการในพื้นที่ (Project Implementation Status)
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-500">
                          ติดตามความก้าวหน้าและการลงพื้นที่ดำเนินงานจริงตามแผนพัฒนาท้องถิ่น
                        </p>
                      </div>
                    </div>

                    {/* Badge แสดงสถานะการดำเนินงานปัจจุบัน */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm text-slate-600 font-medium">สถานะปัจจุบัน:</span>
                      <span
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold border shadow-2xs ${executionConfig.bgClass} ${executionConfig.textClass} ${executionConfig.borderClass}`}
                      >
                        <span>{executionConfig.icon}</span>
                        <span>{executionConfig.label}</span>
                      </span>
                    </div>
                  </div>

                  {/* ช่องบันทึกรายละเอียดความก้าวหน้าโครงการ (Progress Notes / Remarks) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs sm:text-sm flex-wrap gap-1">
                      <label className="font-bold text-slate-800 flex items-center gap-1.5 text-sm sm:text-base">
                        <MessageSquare className="w-4 h-4 text-emerald-700" />
                        <span>บันทึกรายละเอียดความก้าวหน้าโครงการ (Progress Notes / Remarks):</span>
                      </label>
                      {project.executionUpdatedDate && (
                        <span className="text-xs text-slate-500 font-mono">
                          อัปเดตล่าสุด: {project.executionUpdatedDate}
                          {project.executionUpdatedBy ? ` (${project.executionUpdatedBy})` : ''}
                        </span>
                      )}
                    </div>

                    <div className="p-4 bg-emerald-50/30 rounded-xl border border-emerald-200/70 text-base text-slate-800 leading-relaxed sm:leading-loose min-h-[56px] whitespace-pre-wrap">
                      {project.executionProgressNote ||
                        'โครงการอยู่ระหว่างดำเนินงานตามขั้นตอนแผนงานประจำปีงบประมาณของเทศบาลเมืองศิลา'}
                    </div>
                  </div>
                </section>

                {/* ------------------------------------------------------------------- */}
                {/* 7) สถานะการอนุมัติงบประมาณประจำปี (Budget Approval Status Section)    */}
                {/* ------------------------------------------------------------------- */}
                <section className="bg-emerald-50/40 border border-emerald-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-3.5">
                  <div className="flex items-center justify-between flex-wrap gap-2 pb-2.5 border-b border-emerald-200/60">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 shrink-0">
                        <Coins className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-[17px] sm:text-[18px] text-slate-900">
                          สถานะการอนุมัติงบประมาณประจำปี
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-600">
                          ข้อมูลความสอดคล้องตามมติและการอนุมัติงบประมาณรายจ่าย
                        </p>
                      </div>
                    </div>

                    <span className="text-xs sm:text-sm font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                      {isBudgetAllocated ? 'อนุมัติเรียบร้อย' : 'รอการจัดสรรงบ'}
                    </span>
                  </div>

                  {/* การ์ดข้อมูล 4 ช่อง: 1) งบประมาณอนุมัติ 2) แหล่งที่มากระบวนการงบประมาณ 3) วันที่อนุมัติ 4) เลขที่อนุมัติ */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* การ์ดที่ 1: งบประมาณอนุมัติ */}
                    <div className="bg-white border border-emerald-200/90 rounded-xl p-4 shadow-2xs space-y-1.5 flex flex-col justify-between">
                      <div className="flex items-center justify-between text-xs sm:text-sm text-slate-500 font-semibold">
                        <span>1) งบประมาณอนุมัติ</span>
                        <Coins className="w-4 h-4 text-emerald-700" />
                      </div>
                      <div>
                        <div className="text-lg sm:text-xl font-black text-emerald-900 font-mono leading-tight">
                          {Number(displayApprovedBudget).toLocaleString()}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">บาท (ยอดอนุมัติจริง)</div>
                      </div>
                    </div>

                    {/* การ์ดที่ 2: แหล่งที่มากระบวนการงบประมาณ */}
                    <div className="bg-white border border-emerald-200/90 rounded-xl p-4 shadow-2xs space-y-1.5 flex flex-col justify-between">
                      <div className="flex items-center justify-between text-xs sm:text-sm text-slate-500 font-semibold">
                        <span>2) แหล่งที่มากระบวนการงบประมาณ</span>
                        <Layers className="w-4 h-4 text-emerald-700" />
                      </div>
                      <div>
                        <div className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                          {displayBudgetSource}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">ประเภทงบประมาณ</div>
                      </div>
                    </div>

                    {/* การ์ดที่ 3: วันที่อนุมัติ */}
                    <div className="bg-white border border-emerald-200/90 rounded-xl p-4 shadow-2xs space-y-1.5 flex flex-col justify-between">
                      <div className="flex items-center justify-between text-xs sm:text-sm text-slate-500 font-semibold">
                        <span>3) วันที่อนุมัติ</span>
                        <Calendar className="w-4 h-4 text-emerald-700" />
                      </div>
                      <div>
                        <div className="text-sm sm:text-base font-bold text-slate-900 font-mono leading-snug">
                          {displayApprovedDate}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">วัน/เดือน/ปี ที่ลงนาม</div>
                      </div>
                    </div>

                    {/* การ์ดที่ 4: เลขที่อนุมัติ */}
                    <div className="bg-white border border-emerald-200/90 rounded-xl p-4 shadow-2xs space-y-1.5 flex flex-col justify-between">
                      <div className="flex items-center justify-between text-xs sm:text-sm text-slate-500 font-semibold">
                        <span>4) เลขที่อนุมัติ</span>
                        <FileCheck2 className="w-4 h-4 text-emerald-700" />
                      </div>
                      <div>
                        <div className="text-sm sm:text-base font-bold text-slate-900 leading-snug truncate" title={displayApprovalOrderNo}>
                          {displayApprovalOrderNo}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">เลขที่คำสั่ง/มติสภา</div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* ----------------------------------------------------------------------- */}
              {/* แถบ Footer ตรึงอยู่กับที่ (Fixed Footer)                                  */}
              {/* ----------------------------------------------------------------------- */}
              <div className="shrink-0 px-5 sm:px-7 py-3 sm:py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5 z-10">
                {/* ปุ่ม [ตัวอย่างก่อนพิมพ์] */}
                <button
                  id="btn-preview-in-plan-02"
                  type="button"
                  onClick={() => setIsPreviewPrint(true)}
                  className="inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl cursor-pointer transition-all shadow-2xs active:scale-95"
                  title="เปิดดูหน้าตัวอย่างกระดาษ A4 แนวนอนและปรับแต่งผู้ลงนามก่อนสั่งพิมพ์"
                >
                  <Eye className="w-4 h-4 text-slate-600" />
                  <span>ตัวอย่างก่อนพิมพ์</span>
                </button>

                {/* ปุ่ม [พิมพ์หน้านี้] สั่งพิมพ์ทันที (Direct Print / PDF Export) */}
                <button
                  id="btn-print-in-plan-detail-02"
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-emerald-950 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-xl cursor-pointer transition-all shadow-2xs active:scale-95"
                  title="สั่งพิมพ์เฉพาะเนื้อหาหน้ารายละเอียดนี้ออกทางเครื่องพิมพ์หรือบันทึก PDF"
                >
                  <Printer className="w-4 h-4 text-emerald-800" />
                  <span>พิมพ์หน้านี้ (แบบ ผ.02)</span>
                </button>

                {/* ปุ่ม [ปิดหน้าต่าง] */}
                <button
                  id="btn-close-in-plan-modal"
                  type="button"
                  onClick={handleClose}
                  className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl cursor-pointer transition-all shadow-2xs active:scale-95"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
