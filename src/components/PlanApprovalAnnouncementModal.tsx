import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  CheckSquare,
  Square,
  Coins,
  Calendar,
  Search,
  X,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  Save,
  BookOpen,
  Info,
  FileCheck,
  Building2,
  Layers,
  RotateCcw,
  Printer
} from 'lucide-react';
import { ProjectData, PlanAnnouncement } from '../types';
import { DEPARTMENTS } from '../utils/constants';
import { matchesProjectSearch, getProjectDisplayId } from '../utils/projectCode';
import {
  getStandardPlanName,
  getNextBatchSequence,
  isInitialPlanEdition,
  getStandardAnnouncementTitle,
  extractFiscalYear
} from '../utils/planSequence';

interface PlanApprovalAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingAnnouncement: PlanAnnouncement | null;
  projects: ProjectData[];
  announcements: PlanAnnouncement[];
  onSaveAnnouncement: (announcement: PlanAnnouncement, updatedProjects: ProjectData[]) => void;
  onUpdateProjects?: (updatedProjects: ProjectData[]) => void;
}

export const PlanApprovalAnnouncementModal: React.FC<PlanApprovalAnnouncementModalProps> = ({
  isOpen,
  onClose,
  editingAnnouncement,
  projects,
  announcements,
  onSaveAnnouncement,
  onUpdateProjects
}) => {
  // Form State - ส่วนที่ 1: รายละเอียดประกาศ
  const [formPlanType, setFormPlanType] = useState<string>('แผนพัฒนาท้องถิ่น เพิ่มเติม');
  const [formApprovalRound, setFormApprovalRound] = useState<string>('1/2571');
  const [formYear, setFormYear] = useState<string>('พ.ศ. 2571');
  const [formApprovalDate, setFormApprovalDate] = useState<string>('05/09/2571');
  const [formEffectiveDate, setFormEffectiveDate] = useState<string>('05/09/2571');
  const [formAnnouncementTitle, setFormAnnouncementTitle] = useState<string>(
    'ประกาศเทศบาลเมืองศิลา เรื่อง ประกาศใช้แผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575) เพิ่มเติม ครั้งที่ 1/2571'
  );
  const [formApprover, setFormApprover] = useState<string>('นายกเทศมนตรีเมืองศิลา');
  const [formStatus, setFormStatus] = useState<'pending_approval' | 'approved' | 'published'>('published');
  const [formDepartment, setFormDepartment] = useState<string>('กองยุทธศาสตร์และงบประมาณ');
  const [formSelectedProjectIds, setFormSelectedProjectIds] = useState<string[]>([]);
  const [formNote, setFormNote] = useState<string>('');

  // ส่วนที่ 2: การค้นหา กรอง และเลือกโครงการ
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterPlanType, setFilterPlanType] = useState<string>('all');
  const [filterDept, setFilterDept] = useState<string>('all');
  const [filterOnlySelected, setFilterOnlySelected] = useState<boolean>(false);
  const [projectReferences, setProjectReferences] = useState<Record<string, { page: string; order: string }>>({});

  // แปลงวันที่สำหรับแสดงผล พ.ศ. (DD/MM/YYYY)
  const toThaiBeDisplay = (isoDateOrStr?: string): string => {
    if (!isoDateOrStr) return '';
    if (isoDateOrStr.includes('/')) return isoDateOrStr;
    const parts = isoDateOrStr.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parts[1];
      const d = parts[2];
      const beYear = y > 2400 ? y : y + 543;
      return `${d}/${m}/${beYear}`;
    }
    return isoDateOrStr;
  };

  const parseThaiBeToIso = (thaiDateStr: string): string => {
    if (!thaiDateStr) return '';
    const parts = thaiDateStr.split('/');
    if (parts.length === 3) {
      const d = parts[0].padStart(2, '0');
      const m = parts[1].padStart(2, '0');
      const beYear = parseInt(parts[2], 10);
      const ceYear = beYear > 2400 ? beYear - 543 : beYear;
      return `${ceYear}-${m}-${d}`;
    }
    return '';
  };

  // Sync state เมื่อเปิด Modal
  useEffect(() => {
    if (isOpen) {
      if (editingAnnouncement) {
        setFormPlanType(editingAnnouncement.planType);
        setFormApprovalRound(editingAnnouncement.batchNumber || '1/2571');
        setFormYear(
          editingAnnouncement.year
            ? editingAnnouncement.year.startsWith('พ.ศ.')
              ? editingAnnouncement.year
              : `พ.ศ. ${editingAnnouncement.year}`
            : 'พ.ศ. 2571'
        );
        setFormApprovalDate(toThaiBeDisplay(editingAnnouncement.approvalDate) || '05/09/2571');
        setFormEffectiveDate(
          toThaiBeDisplay(editingAnnouncement.effectiveDate || editingAnnouncement.approvalDate) || '05/09/2571'
        );
        setFormAnnouncementTitle(
          editingAnnouncement.announcementNo ||
            `ประกาศเทศบาลเมืองศิลา เรื่อง ประกาศใช้${editingAnnouncement.planType} ครั้งที่ ${editingAnnouncement.batchNumber}`
        );
        setFormApprover(editingAnnouncement.approver || 'นายกเทศมนตรีเมืองศิลา');
        setFormStatus(
          editingAnnouncement.status === 'published'
            ? 'published'
            : editingAnnouncement.status === 'approved' || editingAnnouncement.status === 'pending_announcement'
            ? 'approved'
            : 'pending_approval'
        );
        setFormDepartment(editingAnnouncement.department || 'กองยุทธศาสตร์และงบประมาณ');
        setFormSelectedProjectIds(editingAnnouncement.projectIds || []);
        setFormNote(editingAnnouncement.note || '');
      } else {
        const defaultPlanType = 'แผนพัฒนาท้องถิ่น เพิ่มเติม';
        const defaultYear = 'พ.ศ. 2571';
        const cleanYear = extractFiscalYear(defaultYear);
        const autoRound = getNextBatchSequence(defaultPlanType, cleanYear, announcements);
        const autoTitle = getStandardAnnouncementTitle(defaultPlanType, autoRound, cleanYear);

        setFormPlanType(defaultPlanType);
        setFormApprovalRound(autoRound);
        setFormYear(defaultYear);
        setFormApprovalDate('05/09/2571');
        setFormEffectiveDate('05/09/2571');
        setFormAnnouncementTitle(autoTitle);
        setFormApprover('นายกเทศมนตรีเมืองศิลา');
        setFormStatus('published');
        setFormDepartment('กองยุทธศาสตร์และงบประมาณ');
        setFormSelectedProjectIds([]);
        setFormNote('');
      }

      setSearchQuery('');
      // ซิงค์ตัวกรองเริ่มต้นตามประเภทแผนที่เลือก
      setFilterPlanType('additional');
      setFilterDept('all');
      setFilterOnlySelected(false);

      const initialRefs: Record<string, { page: string; order: string }> = {};
      projects.forEach((p) => {
        if (p.planBookPage || p.planBookOrder) {
          initialRefs[p.id] = {
            page: p.planBookPage || '',
            order: p.planBookOrder || ''
          };
        }
      });
      setProjectReferences(initialRefs);
    }
  }, [isOpen, editingAnnouncement, projects, announcements]);

  const updateAnnouncementTitle = (type: string, round: string, yearVal: string) => {
    const cleanYear = extractFiscalYear(yearVal);
    const title = getStandardAnnouncementTitle(type, round, cleanYear);
    setFormAnnouncementTitle(title);
  };

  const handlePlanTypeChange = (val: string) => {
    setFormPlanType(val);
    const cleanYear = extractFiscalYear(formYear);
    const autoRound = getNextBatchSequence(val, cleanYear, announcements);
    setFormApprovalRound(autoRound);
    updateAnnouncementTitle(val, autoRound, cleanYear);

    // ซิงค์ตัวกรองรายการโครงการอัตโนมัติตามประเภทแผนที่เลือก
    if (val.includes('เพิ่มเติม')) setFilterPlanType('additional');
    else if (val.includes('เปลี่ยนแปลง')) setFilterPlanType('changed');
    else if (val.includes('แก้ไข')) setFilterPlanType('amended');
    else if (val.includes('ฉบับแรก')) setFilterPlanType('first');
    else setFilterPlanType('all');
  };

  const handleApprovalRoundChange = (val: string) => {
    setFormApprovalRound(val);
    updateAnnouncementTitle(formPlanType, val, formYear);
  };

  const handleYearChange = (val: string) => {
    setFormYear(val);
    const cleanYear = extractFiscalYear(val);
    const autoRound = getNextBatchSequence(formPlanType, cleanYear, announcements);
    setFormApprovalRound(autoRound);
    updateAnnouncementTitle(formPlanType, autoRound, cleanYear);
  };

  // Toggle โครงการแต่ละรายการ
  const handleToggleProject = (id: string) => {
    if (formSelectedProjectIds.includes(id)) {
      setFormSelectedProjectIds(formSelectedProjectIds.filter((item) => item !== id));
    } else {
      setFormSelectedProjectIds([...formSelectedProjectIds, id]);
    }
  };

  // รายการโครงการที่ผ่านการค้นหาและตัวกรอง
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (filterOnlySelected && !formSelectedProjectIds.includes(p.id)) return false;
      if (filterDept !== 'all' && p.department !== filterDept) return false;
      if (filterPlanType !== 'all') {
        const ed = p.edition || 'first';
        if (filterPlanType === 'first' && ed !== 'first') return false;
        if (filterPlanType === 'additional' && ed !== 'additional') return false;
        if (filterPlanType === 'changed' && ed !== 'changed') return false;
        if (filterPlanType === 'amended' && ed !== 'amended') return false;
      }
      if (searchQuery.trim()) {
        if (!matchesProjectSearch(searchQuery, p)) return false;
      }
      return true;
    });
  }, [projects, filterDept, filterPlanType, searchQuery, filterOnlySelected, formSelectedProjectIds]);

  // คำนวณงบประมาณรวม 5 ปี ของโครงการที่เลือก
  const totalSelectedBudget = useMemo(() => {
    const selected = projects.filter((p) => formSelectedProjectIds.includes(p.id));
    return selected.reduce((sum, p) => {
      const b71 = p.budgetByYear?.['2571'] || 0;
      const b72 = p.budgetByYear?.['2572'] || 0;
      const b73 = p.budgetByYear?.['2573'] || 0;
      const b74 = p.budgetByYear?.['2574'] || 0;
      const b75 = p.budgetByYear?.['2575'] || 0;
      const sum5 = b71 + b72 + b73 + b74 + b75;
      return sum + (sum5 > 0 ? sum5 : p.budgetPlan || 0);
    }, 0);
  }, [projects, formSelectedProjectIds]);

  // ตรวจสอบว่าโครงการที่แสดงอยู่ถูกเลือกครบหรือไม่
  const isAllFilteredSelected = useMemo(() => {
    if (filteredProjects.length === 0) return false;
    return filteredProjects.every((p) => formSelectedProjectIds.includes(p.id));
  }, [filteredProjects, formSelectedProjectIds]);

  // จัดการกดปุ่ม "เลือกทั้งหมดในฉบับนี้" (1-Click Select All)
  const handleSelectAllInEdition = () => {
    const allFilteredIds = filteredProjects.map((p) => p.id);
    if (isAllFilteredSelected) {
      // หากเลือกครบทั้งหมดแล้ว ให้ยกเลิกการเลือกในกลุ่มนี้
      setFormSelectedProjectIds(formSelectedProjectIds.filter((id) => !allFilteredIds.includes(id)));
    } else {
      // รวมไอดีโครงการทั้งหมดเข้าด้วยกัน
      const union = Array.from(new Set([...formSelectedProjectIds, ...allFilteredIds]));
      setFormSelectedProjectIds(union);
    }
  };

  const handleSelectEveryProject = () => {
    // เลือกโครงการทุกโครงการในระบบทั้งหมด
    const allProjectIds = projects.map((p) => p.id);
    setFormSelectedProjectIds(allProjectIds);
  };

  const handleClearAllSelected = () => {
    setFormSelectedProjectIds([]);
  };

  const generatePlanReferenceText = (planType: string, page: string, order: string) => {
    let typeName = 'แผนพัฒนาท้องถิ่น เพิ่มเติม';
    if (planType.includes('ฉบับแรก')) typeName = 'แผนพัฒนาท้องถิ่น ฉบับแรก';
    else if (planType.includes('เปลี่ยนแปลง')) typeName = 'แผนพัฒนาท้องถิ่น เปลี่ยนแปลง';
    else if (planType.includes('แก้ไข')) typeName = 'แผนพัฒนาท้องถิ่น แก้ไข';

    const parts: string[] = [typeName];
    if (page.trim()) parts.push(`หน้า ${page.trim()}`);
    if (order.trim()) parts.push(`ลำดับที่ ${order.trim()}`);
    return parts.join(' ');
  };

  // บันทึกประกาศใช้แผน
  const handleFinalSubmit = () => {
    if (!formApprovalRound.trim()) {
      alert('กรุณาระบุครั้งที่อนุมัติ เช่น 1/2571');
      return;
    }

    if (formSelectedProjectIds.length === 0) {
      alert('⚠️ ไม่สามารถบันทึกได้: กรุณาเลือกโครงการที่ต้องการประกาศใช้อย่างน้อย 1 โครงการ ในส่วนที่ 2 (รายการโครงการ)');
      return;
    }

    const cleanYear = formYear.replace('พ.ศ.', '').trim();
    const formattedApprovalDate = toThaiBeDisplay(formApprovalDate) || '05/09/2571';
    const formattedEffectiveDate = toThaiBeDisplay(formEffectiveDate) || formattedApprovalDate;

    const statusTitle =
      formStatus === 'published' ? '3. ประกาศใช้แล้ว' :
      formStatus === 'approved' ? '2. อนุมัติแล้ว (รอประกาศใช้)' :
      '1. รออนุมัติ (ร่างแผน)';

    const confirmMsg = `ยืนยันการบันทึกข้อมูลแผนพัฒนาท้องถิ่น\n\n• ชื่อประกาศ: ${formAnnouncementTitle.trim()}\n• ประเภทแผน: ${formPlanType}\n• ครั้งที่ / ปี พ.ศ.: ครั้งที่ ${formApprovalRound.trim()} (${formYear})\n• สถานะการดำเนินการ: ${statusTitle}\n• วันที่มีผลบังคับใช้: ${formattedEffectiveDate}\n• จำนวนโครงการที่ระบุ: ${formSelectedProjectIds.length} โครงการ\n• งบประมาณรวมทั้งหมด: ${totalSelectedBudget.toLocaleString()} บาท\n• ผู้อนุมัติ: ${formApprover}\n\nต้องการดำเนินการบันทึกข้อมูลหรือไม่?`;
    if (!window.confirm(confirmMsg)) {
      return;
    }

    const newAnnouncement: PlanAnnouncement = {
      id: editingAnnouncement?.id || `ANN-${Date.now()}`,
      orderNumber: editingAnnouncement?.orderNumber || announcements.length + 1,
      planType: formPlanType,
      batchNumber: formApprovalRound.trim(),
      year: cleanYear || '2571',
      approvalDate: formattedApprovalDate,
      effectiveDate: formattedEffectiveDate,
      announcementNo: formAnnouncementTitle.trim(),
      approver: formApprover.trim() || 'นายกเทศมนตรีเมืองศิลา',
      status: formStatus,
      department: formDepartment,
      projectIds: formSelectedProjectIds,
      budgetTotal5Years: totalSelectedBudget,
      note: formNote.trim()
    };

    const updatedProjects = projects.map((p) => {
      if (formSelectedProjectIds.includes(p.id)) {
        const ref = projectReferences[p.id] || { page: '', order: '' };
        const pageVal = ref.page?.trim() || '';
        const orderVal = ref.order?.trim() || '';
        const planRefText = generatePlanReferenceText(formPlanType, pageVal, orderVal);

        let newPublishStatus = p.publishStatus;
        if (formStatus === 'published') {
          if (formPlanType.includes('เพิ่มเติม')) newPublishStatus = 'published_additional';
          else if (formPlanType.includes('เปลี่ยนแปลง')) newPublishStatus = 'published_changed';
          else newPublishStatus = 'published_first';
        } else if (formStatus === 'approved') {
          // ในสถานะอนุมัติแล้ว แต่ยังไม่ประกาศใช้ ให้คงสถานะเป็นรอประกาศใช้
          newPublishStatus = 'pending_publish';
        }

        return {
          ...p,
          planReference: planRefText,
          planBookPage: pageVal,
          planBookOrder: orderVal,
          publishStatus: newPublishStatus,
          approvalOrderNo: formAnnouncementTitle || p.approvalOrderNo,
          approvedDate: formattedApprovalDate || p.approvedDate
        };
      }
      return p;
    });

    onSaveAnnouncement(newAnnouncement, updatedProjects);
    if (onUpdateProjects) {
      onUpdateProjects(updatedProjects);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden border border-slate-700/30">
        
        {/* ========================================================================= */}
        {/* Modal Header: แถบหัวข้อหลักและปุ่มปิด */}
        {/* ========================================================================= */}
        <div className="bg-gradient-to-r from-[#093529] via-[#0b4435] to-[#0c4e3e] text-white shrink-0 px-5 sm:px-6 py-3.5 flex items-center justify-between border-b border-emerald-900/40 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md ring-2 ring-emerald-400/30 shrink-0">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base sm:text-lg leading-tight text-white">
                  {editingAnnouncement
                    ? 'แก้ไขการอนุมัติและประกาศใช้แผนพัฒนาท้องถิ่น'
                    : 'เพิ่มการอนุมัติและประกาศใช้แผนพัฒนาท้องถิ่น'}
                </h2>
                <span className="text-[11px] bg-emerald-500/90 text-white px-2.5 py-0.5 rounded-full font-semibold">
                  ฟอร์มจบในหน้าเดียว
                </span>
              </div>
              <p className="text-xs text-emerald-200/90 mt-0.5">
                เทศบาลเมืองศิลา (พ.ศ. 2571-2575) • กรอกรายละเอียดประกาศ เลือกโครงการ และบันทึกได้ทันที
              </p>
            </div>
          </div>

          {/* Action buttons (Print & Close) */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="พิมพ์หน้ารายละเอียดนี้ออกทางเครื่องพิมพ์"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>พิมพ์หน้านี้</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              title="ปิดหน้าต่าง"
              aria-label="ปิดหน้าต่าง"
              className="w-8 h-8 sm:w-9 sm:h-9 bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg shadow-xs flex items-center justify-center cursor-pointer transition-colors p-0"
            >
              <X className="w-5 h-5 stroke-[2.2]" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* Modal Body: เลื่อนในแนวตั้ง รวบรวม 3 ส่วนจบในหน้าเดียว */}
        {/* ========================================================================= */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-5 bg-slate-50/80">
          
          {/* ------------------------------------------------------------------------- */}
          {/* ส่วนที่ 1 (ด้านบน): รายละเอียดประกาศ */}
          {/* ------------------------------------------------------------------------- */}
          <section className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="bg-[#0a4233] px-4 py-2.5 flex items-center justify-between text-white border-b border-emerald-900/40">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-emerald-500 flex items-center justify-center text-white shrink-0">
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <h3 className="font-bold text-sm text-white">
                  ส่วนที่ 1: รายละเอียดประกาศและการอนุมัติ
                </h3>
              </div>
              <span className="text-xs text-emerald-200 bg-emerald-900/60 px-2.5 py-0.5 rounded-md border border-emerald-700/40">
                ข้อมูลตามระเบียบ มท.
              </span>
            </div>

            <div className="p-4 sm:p-5 space-y-4">
              {/* แถวที่ 1: ประเภทแผน, ครั้งที่อนุมัติ, ปี พ.ศ., วันที่อนุมัติ, วันที่มีผลบังคับใช้ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3.5">
                {/* ประเภทแผน (ขยายความกว้างเพื่อไม่ให้ข้อความตกขอบ) */}
                <div className="sm:col-span-2 md:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    ประเภทแผน <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formPlanType}
                    onChange={(e) => handlePlanTypeChange(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs sm:text-sm bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all cursor-pointer font-medium"
                  >
                    <option value="แผนพัฒนาท้องถิ่น เพิ่มเติม">แผนพัฒนาท้องถิ่น เพิ่มเติม</option>
                    <option value="แผนพัฒนาท้องถิ่น ฉบับแรก">แผนพัฒนาท้องถิ่น ฉบับแรก</option>
                    <option value="แผนพัฒนาท้องถิ่น เปลี่ยนแปลง">แผนพัฒนาท้องถิ่น เปลี่ยนแปลง</option>
                    <option value="แผนพัฒนาท้องถิ่น แก้ไข">แผนพัฒนาท้องถิ่น แก้ไข</option>
                  </select>
                </div>

                {/* ครั้งที่ / ปี พ.ศ. (รันเลขอัตโนมัติตามระเบียบ) */}
                <div className="sm:col-span-1 md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>ครั้งที่ / ปี พ.ศ. <span className="text-red-500">*</span></span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1 rounded">Auto</span>
                  </label>
                  <input
                    type="text"
                    value={formApprovalRound}
                    onChange={(e) => handleApprovalRoundChange(e.target.value)}
                    placeholder="เช่น ฉบับแรก/2571 หรือ ครั้งที่ 2/2571"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs sm:text-sm bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-mono font-medium"
                  />
                </div>

                {/* ปี พ.ศ. */}
                <div className="sm:col-span-1 md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    ปี พ.ศ. <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formYear}
                    onChange={(e) => handleYearChange(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs sm:text-sm bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all cursor-pointer font-medium"
                  >
                    <option value="พ.ศ. 2571">พ.ศ. 2571</option>
                    <option value="พ.ศ. 2572">พ.ศ. 2572</option>
                    <option value="พ.ศ. 2573">พ.ศ. 2573</option>
                    <option value="พ.ศ. 2574">พ.ศ. 2574</option>
                    <option value="พ.ศ. 2575">พ.ศ. 2575</option>
                  </select>
                </div>

                {/* วันที่อนุมัติ (พ.ศ.) */}
                <div className="sm:col-span-1 md:col-span-2 lg:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    วันที่อนุมัติ (พ.ศ.) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formApprovalDate}
                      onChange={(e) => setFormApprovalDate(e.target.value)}
                      placeholder="05/09/2571"
                      className="w-full border border-slate-300 rounded-lg pl-3 pr-8 py-2 text-xs sm:text-sm bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-mono font-medium"
                    />
                    <input
                      type="date"
                      tabIndex={-1}
                      value={parseThaiBeToIso(formApprovalDate)}
                      onChange={(e) => {
                        if (e.target.value) {
                          setFormApprovalDate(toThaiBeDisplay(e.target.value));
                        }
                      }}
                      className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 w-7 h-7 cursor-pointer z-10"
                      title="เลือกวันที่จากปฏิทิน"
                    />
                    <Calendar className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* วันที่มีผลบังคับใช้ */}
                <div className="sm:col-span-1 md:col-span-3 lg:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    วันที่มีผลบังคับใช้ <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formEffectiveDate}
                      onChange={(e) => setFormEffectiveDate(e.target.value)}
                      placeholder="05/09/2571"
                      className="w-full border border-slate-300 rounded-lg pl-3 pr-8 py-2 text-xs sm:text-sm bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-mono font-medium"
                    />
                    <input
                      type="date"
                      tabIndex={-1}
                      value={parseThaiBeToIso(formEffectiveDate)}
                      onChange={(e) => {
                        if (e.target.value) {
                          setFormEffectiveDate(toThaiBeDisplay(e.target.value));
                        }
                      }}
                      className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 w-7 h-7 cursor-pointer z-10"
                      title="เลือกวันที่จากปฏิทิน"
                    />
                    <Calendar className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* แสดงตัวอย่างชื่อแผนพัฒนาท้องถิ่นและลำดับครั้งที่คำนวณอัตโนมัติตามระเบียบ มท. */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 py-2 rounded-lg bg-emerald-50/80 border border-emerald-200/90 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-emerald-950">ชื่อแผนพัฒนาท้องถิ่น:</span>
                  <span className="font-semibold text-emerald-900 bg-white px-2.5 py-0.5 rounded border border-emerald-200 shadow-2xs">
                    {getStandardPlanName(formPlanType)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 text-[11px]">
                  <span>ลำดับฉบับ:</span>
                  <span className="font-mono font-bold text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200 shadow-2xs">
                    {formApprovalRound}
                  </span>
                </div>
              </div>

              {/* แถวที่ 2: ชื่อ / เลขที่ประกาศ */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ชื่อ / เลขที่ประกาศ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formAnnouncementTitle}
                  onChange={(e) => setFormAnnouncementTitle(e.target.value)}
                  placeholder="เช่น ประกาศเทศบาลเมืองศิลา เรื่อง ประกาศใช้แผนพัฒนาท้องถิ่น..."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs sm:text-sm bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-medium"
                />
              </div>

              {/* แถวที่ 3: ผู้ลงนาม/ผู้อนุมัติ, หน่วยงานรับผิดชอบ, สถานะการประกาศ, หมายเหตุ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5 pt-1">
                {/* ผู้ลงนาม/ผู้อนุมัติ */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    ผู้ลงนาม / ผู้อนุมัติ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formApprover}
                    onChange={(e) => setFormApprover(e.target.value)}
                    placeholder="นายกเทศมนตรีเมืองศิลา"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs sm:text-sm bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-medium"
                  />
                </div>

                {/* หน่วยงานรับผิดชอบ */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    หน่วยงานรับผิดชอบ
                  </label>
                  <select
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs sm:text-sm bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none cursor-pointer font-medium"
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                {/* สถานะการดำเนินการ (ตามขั้นตอน 3 สถานะ) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    สถานะการดำเนินการ <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as 'pending_approval' | 'approved' | 'published')}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs sm:text-sm bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none cursor-pointer font-medium"
                  >
                    <option value="published">🔵 3. ประกาศใช้แล้ว (มีผลบังคับใช้)</option>
                    <option value="approved">🟢 2. อนุมัติแล้ว (ผ่านสภา/รอประกาศใช้)</option>
                    <option value="pending_approval">🟡 1. รออนุมัติ (ร่างแผน/เสนอพิจารณา)</option>
                  </select>
                </div>

                {/* หมายเหตุ */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    หมายเหตุ / อ้างอิง
                  </label>
                  <input
                    type="text"
                    value={formNote}
                    onChange={(e) => setFormNote(e.target.value)}
                    placeholder="ระบุหมายเหตุเพิ่มเติม (ถ้ามี)"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs sm:text-sm bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-medium"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ------------------------------------------------------------------------- */}
          {/* ส่วนที่ 2 (ตรงกลาง): รายการโครงการที่ต้องการประกาศใช้ พร้อมปุ่มคลิกเดียว */}
          {/* ------------------------------------------------------------------------- */}
          <section className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="bg-[#0a4233] px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-white border-b border-emerald-900/40">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-emerald-500 flex items-center justify-center text-white shrink-0">
                  <CheckSquare className="w-3.5 h-3.5" />
                </div>
                <h3 className="font-bold text-sm text-white">
                  ส่วนที่ 2: รายการโครงการที่ต้องการประกาศใช้
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-emerald-500 font-mono font-bold text-white px-3 py-0.5 rounded-full shadow-2xs">
                  เลือกแล้ว {formSelectedProjectIds.length} จาก {projects.length} โครงการ
                </span>
              </div>
            </div>

            {/* แถบเครื่องมือ: ปุ่ม "เลือกทั้งหมดในฉบับนี้" และ ตัวกรอง/ค้นหา */}
            <div className="p-3.5 sm:p-4 bg-slate-50/90 border-b border-slate-200 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                {/* กลุ่มปุ่มเลือกด่วน (1-Click Select Buttons) */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* ปุ่มหลัก: [✓] เลือกทั้งหมดในฉบับนี้ */}
                  <button
                    type="button"
                    onClick={handleSelectAllInEdition}
                    className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-lg shadow-xs flex items-center gap-2 transition-all cursor-pointer ${
                      isAllFilteredSelected
                        ? 'bg-emerald-800 hover:bg-emerald-900 text-white border border-emerald-700 ring-2 ring-emerald-400/40'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500'
                    }`}
                  >
                    <CheckSquare className="w-4 h-4 text-white" />
                    <span>
                      {isAllFilteredSelected
                        ? `[✓] เลือกครบแล้ว (${filteredProjects.length} โครงการ)`
                        : `[✓] เลือกทั้งหมดในฉบับนี้ (${filteredProjects.length} โครงการ)`}
                    </span>
                  </button>

                  {/* ปุ่มเลือกทุกโครงการในฐานข้อมูล */}
                  {projects.length !== filteredProjects.length && (
                    <button
                      type="button"
                      onClick={handleSelectEveryProject}
                      className="px-3 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-300 hover:border-emerald-400 text-slate-700 hover:text-emerald-900 hover:bg-emerald-50/50 transition-colors cursor-pointer"
                    >
                      เลือกทั้ง {projects.length} โครงการทั้งหมด
                    </button>
                  )}

                  {/* ปุ่มล้างการเลือก */}
                  {formSelectedProjectIds.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllSelected}
                      className="px-3 py-2 text-xs font-medium rounded-lg bg-white border border-slate-300 hover:border-red-300 text-slate-600 hover:text-red-700 hover:bg-red-50/50 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>ยกเลิกการเลือก</span>
                    </button>
                  )}
                </div>

                {/* ปุ่มแสดงเฉพาะที่เลือก */}
                <button
                  type="button"
                  onClick={() => setFilterOnlySelected(!filterOnlySelected)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer transition-colors ${
                    filterOnlySelected
                      ? 'bg-emerald-100 border-emerald-300 text-emerald-900 font-bold'
                      : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {filterOnlySelected ? '✓ แสดงเฉพาะที่เลือก' : 'แสดงเฉพาะที่เลือก'}
                </button>
              </div>

              {/* ช่องค้นหาและตัวกรองประเภทแผน/หน่วยงาน */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1 border-t border-slate-200/80">
                {/* ค้นหาชื่อโครงการ หรือรหัส */}
                <div className="relative sm:col-span-6">
                  <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="พิมพ์ค้นหาชื่อโครงการ, รหัส, วัตถุประสงค์..."
                    className="w-full pl-8 pr-7 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-2xs placeholder:text-slate-400 font-medium"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                      title="ล้างข้อความค้นหา"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* กรองตามประเภทแผน */}
                <div className="relative sm:col-span-3">
                  <select
                    value={filterPlanType}
                    onChange={(e) => setFilterPlanType(e.target.value)}
                    className="w-full appearance-none pl-2.5 pr-6 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-2xs font-medium truncate"
                  >
                    <option value="all">ทุกประเภทแผน</option>
                    <option value="first">ฉบับแรก</option>
                    <option value="additional">ฉบับเพิ่มเติม</option>
                    <option value="changed">ฉบับเปลี่ยนแปลง</option>
                    <option value="amended">ฉบับแก้ไข</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* กรองตามหน่วยงาน */}
                <div className="relative sm:col-span-3">
                  <select
                    value={filterDept}
                    onChange={(e) => setFilterDept(e.target.value)}
                    className="w-full appearance-none pl-2.5 pr-6 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-2xs font-medium truncate"
                  >
                    <option value="all">ทุกหน่วยงานรับผิดชอบ</option>
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* ตารางรายการโครงการ พร้อม Checkbox และกรอกหน้า/ลำดับในเล่ม */}
            <div className="max-h-[360px] overflow-y-auto overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead className="bg-[#0b382d] text-white text-[11px] sm:text-xs font-semibold sticky top-0 z-10 shadow-xs">
                  <tr>
                    <th className="py-2.5 px-3 w-12 text-center">
                      <input
                        type="checkbox"
                        checked={isAllFilteredSelected}
                        onChange={handleSelectAllInEdition}
                        className="rounded border-slate-400 text-emerald-500 focus:ring-emerald-400 cursor-pointer w-4 h-4"
                        title="เลือก/ยกเลิกทั้งหมดในหน้านี้"
                      />
                    </th>
                    <th className="py-2.5 px-3 w-12 text-center">ลำดับ</th>
                    <th className="py-2.5 px-3 w-28">รหัสโครงการ</th>
                    <th className="py-2.5 px-3 min-w-[240px]">ชื่อโครงการพัฒนา</th>
                    <th className="py-2.5 px-3 w-36">หน่วยงาน</th>
                    <th className="py-2.5 px-3 w-32">ประเภท</th>
                    <th className="py-2.5 px-3 w-40 text-center">อ้างอิงเล่มแผน</th>
                    <th className="py-2.5 px-3 w-32 text-right">งบรวม 5 ปี (บาท)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredProjects.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-400 bg-white">
                        <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                        <p className="font-semibold text-slate-600 text-sm">ไม่พบโครงการตามเงื่อนไขที่ระบุ</p>
                        <p className="text-xs text-slate-400 mt-0.5">โปรดลองล้างคำค้นหาหรือรีเซ็ตตัวกรอง</p>
                      </td>
                    </tr>
                  ) : (
                    filteredProjects.map((p, idx) => {
                      const isChecked = formSelectedProjectIds.includes(p.id);
                      const total5 =
                        (p.budgetByYear?.['2571'] || 0) +
                        (p.budgetByYear?.['2572'] || 0) +
                        (p.budgetByYear?.['2573'] || 0) +
                        (p.budgetByYear?.['2574'] || 0) +
                        (p.budgetByYear?.['2575'] || 0);
                      const displayBudget = total5 > 0 ? total5 : p.budgetPlan || 0;
                      const currentRef = projectReferences[p.id] || { page: '', order: '' };

                      return (
                        <tr
                          key={p.id}
                          onClick={(e) => {
                            // หลีกเลี่ยงการ toggle หากคลิกที่ input หน้า/ลำดับ
                            if ((e.target as HTMLElement).tagName === 'INPUT') return;
                            handleToggleProject(p.id);
                          }}
                          className={`cursor-pointer transition-colors ${
                            isChecked
                              ? 'bg-emerald-50/75 hover:bg-emerald-100/70'
                              : 'bg-white hover:bg-slate-50'
                          }`}
                        >
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleProject(p.id)}
                              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer w-4 h-4"
                            />
                          </td>
                          <td className="py-2.5 px-3 text-center text-slate-500 font-mono text-xs">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-700 text-xs">
                            {getProjectDisplayId(p)}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900 leading-snug">
                              {p.name}
                            </div>
                            {p.planStrategy && (
                              <div className="text-slate-500 text-xs mt-0.5 line-clamp-1">
                                ยุทธศาสตร์: {p.planStrategy}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 text-xs">
                            {p.department}
                          </td>
                          <td className="py-2.5 px-3">
                            {p.edition === 'additional' ? (
                              <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                เพิ่มเติม {p.editionNumber ? `ครั้งที่ ${p.editionNumber}` : ''}
                              </span>
                            ) : p.edition === 'changed' ? (
                              <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                                เปลี่ยนแปลง {p.editionNumber ? `ครั้งที่ ${p.editionNumber}` : ''}
                              </span>
                            ) : p.edition === 'amended' ? (
                              <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                                แก้ไข {p.editionNumber ? `ครั้งที่ ${p.editionNumber}` : ''}
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                                ฉบับแรก
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1.5">
                              <input
                                type="text"
                                placeholder="หน้า"
                                value={currentRef.page}
                                onChange={(e) => {
                                  setProjectReferences((prev) => ({
                                    ...prev,
                                    [p.id]: {
                                      page: e.target.value,
                                      order: prev[p.id]?.order || ''
                                    }
                                  }));
                                }}
                                className="w-16 px-2 py-1 text-xs border border-slate-300 rounded bg-white text-center focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                              />
                              <input
                                type="text"
                                placeholder="ลำดับ"
                                value={currentRef.order}
                                onChange={(e) => {
                                  setProjectReferences((prev) => ({
                                    ...prev,
                                    [p.id]: {
                                      page: prev[p.id]?.page || '',
                                      order: e.target.value
                                    }
                                  }));
                                }}
                                className="w-16 px-2 py-1 text-xs border border-slate-300 rounded bg-white text-center focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                              />
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800">
                            {displayBudget.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* ------------------------------------------------------------------------- */}
          {/* ส่วนที่ 3 (ด้านล่าง): สรุปยอดรวม (จำนวนโครงการ และงบประมาณรวมทั้งหมด) */}
          {/* ------------------------------------------------------------------------- */}
          <section className="bg-gradient-to-r from-emerald-50 via-teal-50/70 to-emerald-50 rounded-xl border border-emerald-200/90 shadow-2xs p-4 sm:p-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-emerald-950">
                    ส่วนที่ 3: สรุปยอดรวมโครงการที่ประกาศใช้
                  </h3>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    {formPlanType} ครั้งที่ {formApprovalRound} ({formYear}) • วันที่มีผลบังคับใช้: {formEffectiveDate || formApprovalDate}
                  </p>
                </div>
              </div>

              {/* Stat Highlights */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 shrink-0">
                {/* จำนวนโครงการที่เลือก */}
                <div className="bg-white/90 border border-emerald-200 rounded-xl px-4 py-2.5 shadow-2xs">
                  <span className="text-xs font-semibold text-slate-600 block">
                    จำนวนโครงการที่เลือก
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-xl sm:text-2xl font-extrabold font-mono text-emerald-800">
                      {formSelectedProjectIds.length}
                    </span>
                    <span className="text-xs text-slate-500">
                      / {projects.length} โครงการ
                    </span>
                  </div>
                </div>

                {/* งบประมาณรวมทั้งหมด */}
                <div className="bg-white/90 border border-emerald-200 rounded-xl px-4 py-2.5 shadow-2xs">
                  <span className="text-xs font-semibold text-slate-600 block">
                    งบประมาณรวมทั้งหมด (5 ปี)
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-xl sm:text-2xl font-extrabold font-mono text-emerald-900">
                      {totalSelectedBudget.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-500">บาท</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* ========================================================================= */}
        {/* Modal Footer: ปุ่มการทำงาน (Action Buttons) ด้านล่างขวา */}
        {/* ========================================================================= */}
        <div className="bg-white border-t border-slate-200 px-5 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-600 flex items-center gap-2">
            <CheckCircle2
              className={`w-4 h-4 shrink-0 ${
                formStatus === 'published'
                  ? 'text-sky-600'
                  : formStatus === 'approved'
                  ? 'text-emerald-600'
                  : 'text-amber-500'
              }`}
            />
            <span>
              {formStatus === 'published' && 'พร้อมประกาศใช้ '}
              {formStatus === 'approved' && 'พร้อมบันทึกอนุมัติ '}
              {formStatus === 'pending_approval' && 'บันทึกร่าง '}
              <strong className="text-slate-800 font-mono font-bold">{formSelectedProjectIds.length}</strong> โครงการ • งบประมาณรวม <strong className="text-emerald-800 font-mono font-bold">{totalSelectedBudget.toLocaleString()}</strong> บาท
            </span>
          </div>

          {/* Action Buttons: มีปุ่ม "ยกเลิก" และปุ่มหลักที่เปลี่ยนข้อความ/สีตามสถานะ */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors cursor-pointer shadow-2xs"
            >
              ยกเลิก
            </button>

            <button
              type="button"
              onClick={handleFinalSubmit}
              className={`px-6 py-2.5 text-xs sm:text-sm font-bold text-white rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer hover:shadow-lg ${
                formStatus === 'published'
                  ? 'bg-sky-600 hover:bg-sky-700 active:bg-sky-800'
                  : formStatus === 'approved'
                  ? 'bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900'
                  : 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800'
              }`}
            >
              <Save className="w-4 h-4" />
              <span>
                {formStatus === 'published' && 'บันทึกและประกาศใช้แผน'}
                {formStatus === 'approved' && 'บันทึกการอนุมัติแผน'}
                {formStatus === 'pending_approval' && 'บันทึกร่างแผน (รออนุมัติ)'}
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
