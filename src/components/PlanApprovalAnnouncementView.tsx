import React, { useState, useMemo, useEffect } from 'react';
import {
  CheckSquare,
  Search,
  RotateCcw,
  FolderOpen,
  Download,
  ChevronDown,
  Printer,
  Plus,
  BookOpen,
  FileText,
  Bookmark,
  Clock,
  Eye,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Save,
  CheckCircle2,
  Calendar,
  Building2,
  Coins,
  ArrowRight,
  ArrowLeft,
  FileCheck,
  Check,
  Filter,
  Layers,
  AlertCircle,
  AlertTriangle,
  LayoutList,
  Table,
  ChevronUp,
  Info
} from 'lucide-react';
import { ProjectData, PlanAnnouncement } from '../types';
import { DEPARTMENTS } from '../utils/constants';
import { matchesProjectSearch, getProjectDisplayId } from '../utils/projectCode';

interface PlanApprovalAnnouncementViewProps {
  projects: ProjectData[];
  announcements: PlanAnnouncement[];
  onSaveAnnouncement: (announcement: PlanAnnouncement, updatedProjects?: ProjectData[]) => void;
  onDeleteAnnouncement: (id: string) => void;
  onViewProjectDetail?: (project: ProjectData) => void;
  onUpdateProjects?: (projects: ProjectData[]) => void;
}

export const PlanApprovalAnnouncementView: React.FC<PlanApprovalAnnouncementViewProps> = ({
  projects,
  announcements,
  onSaveAnnouncement,
  onDeleteAnnouncement,
  onViewProjectDetail,
  onUpdateProjects
}) => {
  // Filters
  const [filterYear, setFilterYear] = useState<string>('all');
  const [filterPlanType, setFilterPlanType] = useState<string>('all');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [filterBudget, setFilterBudget] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'approved' | 'pending'>('approved');

  // Modals - default open so user immediately sees the requested screen
  const [isFormModalOpen, setIsFormModalOpen] = useState(true);
  const [editingAnnouncement, setEditingAnnouncement] = useState<PlanAnnouncement | null>(null);
  const [viewAnnouncement, setViewAnnouncement] = useState<PlanAnnouncement | null>(null);

  // Stepper state: 1 = ข้อมูลการอนุมัติ, 2 = เลือกโครงการ, 3 = สรุปก่อนบันทึก
  // Default to Step 2 so user directly sees the updated Step 2 UI
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(2);
  const [maxStepReached, setMaxStepReached] = useState<number>(2);

  // Form State for Add / Edit
  const [formPlanType, setFormPlanType] = useState<string>('แผนพัฒนาท้องถิ่น เพิ่มเติม');
  const [formApprovalRound, setFormApprovalRound] = useState<string>('1/2571');
  const [formYear, setFormYear] = useState<string>('พ.ศ. 2571');
  const [formApprovalDate, setFormApprovalDate] = useState<string>('05/09/2571');
  const [formEffectiveDate, setFormEffectiveDate] = useState<string>('05/09/2571');
  const [formAnnouncementTitle, setFormAnnouncementTitle] = useState<string>(
    'ประกาศเทศบาลเมืองศิลา เรื่อง ประกาศใช้แผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575) เพิ่มเติม ครั้งที่ 1/2571'
  );
  const [formApprover, setFormApprover] = useState<string>('นายกเทศมนตรีเมืองศิลา');
  const [formStatus, setFormStatus] = useState<'approved' | 'pending'>('approved');
  const [formDepartment, setFormDepartment] = useState<string>(DEPARTMENTS[3] || 'กองยุทธศาสตร์และงบประมาณ');
  const [formSelectedProjectIds, setFormSelectedProjectIds] = useState<string[]>(['PRJ-2571-001', 'PRJ-2571-002']);
  const [formNote, setFormNote] = useState<string>('');

  // References state mapping project id -> { page: string; order: string }
  const [projectReferences, setProjectReferences] = useState<Record<string, { page: string; order: string }>>(() => {
    const initialRefs: Record<string, { page: string; order: string }> = {
      'PRJ-2571-001': { page: '12', order: '1' },
      'PRJ-2571-002': { page: '28', order: '2' },
      'PRJ-2571-003': { page: '35', order: '3' }
    };
    return initialRefs;
  });

  // Synchronize project references when projects update
  useEffect(() => {
    setProjectReferences((prev) => {
      const next = { ...prev };
      projects.forEach((p) => {
        if (!next[p.id]) {
          next[p.id] = {
            page: p.planBookPage || '',
            order: p.planBookOrder || ''
          };
        }
      });
      return next;
    });
  }, [projects]);

  // Convert any date format to Thai Buddhist Era (พ.ศ.) display: DD/MM/YYYY
  const toThaiBeDisplay = (dateInput?: string): string => {
    if (!dateInput || dateInput === '-') return '';
    // If already DD/MM/YYYY
    if (dateInput.includes('/')) {
      const parts = dateInput.split('/');
      if (parts.length === 3) {
        const d = parts[0].padStart(2, '0');
        const m = parts[1].padStart(2, '0');
        let y = parseInt(parts[2], 10);
        if (!isNaN(y)) {
          if (y < 2400) y += 543; // Convert CE to BE
          return `${d}/${m}/${y}`;
        }
      }
    }
    // If YYYY-MM-DD
    if (dateInput.includes('-')) {
      const parts = dateInput.split('-');
      if (parts.length === 3) {
        let y = parseInt(parts[0], 10);
        const m = parts[1].padStart(2, '0');
        const d = parts[2].padStart(2, '0');
        if (!isNaN(y)) {
          if (y < 2400) y += 543; // Convert CE to BE
          return `${d}/${m}/${y}`;
        }
      }
    }
    return dateInput;
  };

  // Convert Thai BE date DD/MM/YYYY to ISO YYYY-MM-DD for native HTML5 date picker
  const parseThaiBeToIso = (displayDate?: string): string => {
    if (!displayDate) return '';
    if (displayDate.includes('/')) {
      const parts = displayDate.split('/');
      if (parts.length === 3) {
        const [d, m, yStr] = parts;
        let y = parseInt(yStr, 10);
        if (!isNaN(y)) {
          if (y >= 2400) y -= 543; // Convert BE to CE
          return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        }
      }
    }
    if (displayDate.includes('-')) {
      const parts = displayDate.split('-');
      if (parts.length === 3) {
        let y = parseInt(parts[0], 10);
        const m = parts[1].padStart(2, '0');
        const d = parts[2].padStart(2, '0');
        if (!isNaN(y)) {
          if (y >= 2400) y -= 543;
          return `${y}-${m}-${d}`;
        }
      }
    }
    return '';
  };

  // Format date to full Thai BE string e.g. "5 กันยายน 2571"
  const formatThaiDateLong = (dateInput?: string): string => {
    const beStr = toThaiBeDisplay(dateInput);
    if (!beStr) return '-';
    const parts = beStr.split('/');
    if (parts.length === 3) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const y = parts[2];
      const THAI_MONTHS = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
      ];
      if (m >= 1 && m <= 12) {
        return `${d} ${THAI_MONTHS[m - 1]} พ.ศ. ${y}`;
      }
    }
    return dateInput || '-';
  };

  // Legacy alias for compatibility
  const formatDateToDisplay = toThaiBeDisplay;
  const parseDisplayToIso = parseThaiBeToIso;

  // Step 2 filter and view states
  const [step2Search, setStep2Search] = useState<string>('');
  const [step2PlanType, setStep2PlanType] = useState<string>('all');
  const [step2Dept, setStep2Dept] = useState<string>('all');
  const [step2OnlySelected, setStep2OnlySelected] = useState<boolean>(false);
  const [step2ViewMode, setStep2ViewMode] = useState<'card' | 'table'>('card');
  const [expandedDetailProjectIds, setExpandedDetailProjectIds] = useState<string[]>([]);

  // Toggle selection of a single project in Step 2
  const handleToggleProject = (projectId: string) => {
    setFormSelectedProjectIds((prev) => {
      if (prev.includes(projectId)) {
        return prev.filter((id) => id !== projectId);
      } else {
        const prj = projects.find((p) => p.id === projectId);
        if (prj && (prj.planBookPage || prj.planBookOrder) && !projectReferences[projectId]) {
          setProjectReferences((refPrev) => ({
            ...refPrev,
            [projectId]: {
              page: prj.planBookPage || '',
              order: prj.planBookOrder || ''
            }
          }));
        }
        return [...prev, projectId];
      }
    });
  };

  // Reference Text Generator Helper
  const generatePlanReferenceText = (planType: string, page?: string, order?: string) => {
    const pageStr = page && page.trim() ? page.trim() : '-';
    const orderStr = order && order.trim() ? order.trim() : '-';
    return `ปรากฏในแผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575) ${planType} หน้าที่ ${pageStr} ลำดับที่ ${orderStr}`;
  };

  // Dynamic announcement title helper
  const updateAnnouncementTitle = (type: string, round: string, yr: string) => {
    const rawYear = yr.replace('พ.ศ.', '').trim();
    if (type.includes('เพิ่มเติม')) {
      setFormAnnouncementTitle(`ประกาศเทศบาลเมืองศิลา เรื่อง ประกาศใช้แผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575) เพิ่มเติม ครั้งที่ ${round || '1/2571'}`);
    } else if (type.includes('เปลี่ยนแปลง')) {
      setFormAnnouncementTitle(`ประกาศเทศบาลเมืองศิลา เรื่อง ประกาศใช้แผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575) เปลี่ยนแปลง ครั้งที่ ${round || '1/2571'}`);
    } else if (type.includes('แก้ไข')) {
      setFormAnnouncementTitle(`ประกาศเทศบาลเมืองศิลา เรื่อง ประกาศใช้แผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575) แก้ไข ครั้งที่ ${round || '1/2571'}`);
    } else {
      setFormAnnouncementTitle(`ประกาศเทศบาลเมืองศิลา เรื่อง ประกาศใช้แผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575) ประจำปี พ.ศ. ${rawYear}`);
    }
  };

  const handlePlanTypeChange = (val: string) => {
    setFormPlanType(val);
    updateAnnouncementTitle(val, formApprovalRound, formYear);
  };

  const handleApprovalRoundChange = (val: string) => {
    setFormApprovalRound(val);
    updateAnnouncementTitle(formPlanType, val, formYear);
  };

  const handleYearChange = (val: string) => {
    setFormYear(val);
    updateAnnouncementTitle(formPlanType, formApprovalRound, val);
  };

  // Stepper navigation handlers
  const handleStepClick = (targetStep: 1 | 2 | 3) => {
    if (targetStep === currentStep) return;
    if (targetStep > 1 && !formApprovalRound.trim()) {
      alert('กรุณาระบุครั้งที่อนุมัติ ก่อนไปยังขั้นตอนถัดไป');
      return;
    }
    // Allow if previously visited or if step 1 is valid
    if (targetStep <= maxStepReached || (targetStep === 2 && formApprovalRound.trim())) {
      setCurrentStep(targetStep);
      setMaxStepReached((prev) => Math.max(prev, targetStep));
    }
  };

  const handleGoToStep2 = () => {
    if (!formApprovalRound.trim()) {
      alert('กรุณาระบุครั้งที่อนุมัติ ก่อนไปยังขั้นตอนถัดไป');
      return;
    }
    setCurrentStep(2);
    setMaxStepReached((prev) => Math.max(prev, 2));
  };

  const handleGoToStep3 = () => {
    setCurrentStep(3);
    setMaxStepReached((prev) => Math.max(prev, 3));
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingAnnouncement(null);
    setCurrentStep(1);
    setMaxStepReached(1);
    setFormPlanType('แผนพัฒนาท้องถิ่น เพิ่มเติม');
    setFormApprovalRound('1/2571');
    setFormYear('พ.ศ. 2571');
    setFormApprovalDate('05/09/2571');
    setFormEffectiveDate('05/09/2571');
    setFormAnnouncementTitle('ประกาศเทศบาลเมืองศิลา เรื่อง ประกาศใช้แผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575) เพิ่มเติม ครั้งที่ 1/2571');
    setFormApprover('นายกเทศมนตรีเมืองศิลา');
    setFormStatus('approved');
    setFormDepartment('กองยุทธศาสตร์และงบประมาณ');
    setFormSelectedProjectIds([]);
    setFormNote('');
    setStep2Search('');
    setStep2PlanType('all');
    setStep2Dept('all');
    setStep2OnlySelected(false);
    setStep2ViewMode('card');
    setExpandedDetailProjectIds([]);
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
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (ann: PlanAnnouncement) => {
    setEditingAnnouncement(ann);
    setCurrentStep(1);
    setMaxStepReached(3);
    setFormPlanType(ann.planType);
    setFormApprovalRound(ann.batchNumber || '1/2571');
    setFormYear(ann.year ? (ann.year.startsWith('พ.ศ.') ? ann.year : `พ.ศ. ${ann.year}`) : 'พ.ศ. 2571');
    setFormApprovalDate(toThaiBeDisplay(ann.approvalDate) || '05/09/2571');
    setFormEffectiveDate(toThaiBeDisplay(ann.effectiveDate || ann.approvalDate) || '05/09/2571');
    setFormAnnouncementTitle(ann.announcementNo || `ประกาศเทศบาลเมืองศิลา เรื่อง ประกาศใช้${ann.planType} ครั้งที่ ${ann.batchNumber}`);
    setFormApprover(ann.approver || 'นายกเทศมนตรีเมืองศิลา');
    setFormStatus(ann.status || 'approved');
    setFormDepartment(ann.department || 'กองยุทธศาสตร์และงบประมาณ');
    setFormSelectedProjectIds(ann.projectIds || []);
    setFormNote(ann.note || '');
    setStep2Search('');
    setStep2PlanType('all');
    setStep2Dept('all');
    setStep2OnlySelected(false);
    setStep2ViewMode('card');
    setExpandedDetailProjectIds([]);
    const initialEditRefs: Record<string, { page: string; order: string }> = {};
    projects.forEach((p) => {
      if (p.planBookPage || p.planBookOrder) {
        initialEditRefs[p.id] = {
          page: p.planBookPage || '',
          order: p.planBookOrder || ''
        };
      }
    });
    setProjectReferences(initialEditRefs);
    setIsFormModalOpen(true);
  };

  // Save Announcement
  const handleFinalSubmit = () => {
    if (!formApprovalRound.trim()) {
      alert('กรุณาระบุครั้งที่อนุมัติ');
      setCurrentStep(1);
      return;
    }

    if (formSelectedProjectIds.length === 0) {
      alert('⚠️ ไม่สามารถบันทึกได้: กรุณาเลือกโครงการที่ต้องการบรรจุในแผนอย่างน้อย 1 โครงการ ในขั้นตอนที่ 2');
      setCurrentStep(2);
      return;
    }

    // Calculate total 5-year budget from selected projects
    const selectedProjects = projects.filter((p) => formSelectedProjectIds.includes(p.id));
    const total5Years = selectedProjects.reduce((sum, p) => {
      const b71 = p.budgetByYear?.['2571'] || 0;
      const b72 = p.budgetByYear?.['2572'] || 0;
      const b73 = p.budgetByYear?.['2573'] || 0;
      const b74 = p.budgetByYear?.['2574'] || 0;
      const b75 = p.budgetByYear?.['2575'] || 0;
      const sum5 = b71 + b72 + b73 + b74 + b75;
      return sum + (sum5 > 0 ? sum5 : p.budgetPlan || 0);
    }, 0);

    const cleanYear = formYear.replace('พ.ศ.', '').trim();
    const formattedApprovalDate = toThaiBeDisplay(formApprovalDate) || '05/09/2571';
    const formattedEffectiveDate = toThaiBeDisplay(formEffectiveDate) || formattedApprovalDate;

    // Confirm dialog
    const confirmMsg = `ยืนยันการบันทึกและประกาศใช้แผนพัฒนาท้องถิ่น\n\n• ชื่อประกาศ: ${formAnnouncementTitle.trim()}\n• ประเภทแผน: ${formPlanType}\n• ครั้งที่ / ปี พ.ศ.: ครั้งที่ ${formApprovalRound.trim()} (${formYear})\n• จำนวนโครงการที่บรรจุ: ${formSelectedProjectIds.length} โครงการ\n• งบประมาณรวม 5 ปี: ฿${total5Years.toLocaleString()} บาท\n• วันที่อนุมัติ (พ.ศ.): ${formattedApprovalDate}\n• สถานะ: ${formStatus === 'approved' ? 'อนุมัติแล้ว และ ประกาศใช้แล้ว' : 'ร่างประกาศ (รอประกาศใช้)'}\n\nต้องการดำเนินการบันทึกข้อมูลหรือไม่?`;
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
      approver: formApprover.trim(),
      department: formDepartment,
      projectIds: formSelectedProjectIds,
      status: formStatus,
      budgetTotal5Years: total5Years,
      note: formNote.trim()
    };

    // Update projects with planReference, planBookPage, planBookOrder and publishStatus
    const updatedProjects = projects.map((p) => {
      if (formSelectedProjectIds.includes(p.id)) {
        const ref = projectReferences[p.id] || { page: '', order: '' };
        const pageVal = ref.page?.trim() || '';
        const orderVal = ref.order?.trim() || '';
        const planRefText = generatePlanReferenceText(formPlanType, pageVal, orderVal);

        let newPublishStatus = p.publishStatus;
        if (formStatus === 'approved') {
          if (formPlanType.includes('เพิ่มเติม')) newPublishStatus = 'published_additional';
          else if (formPlanType.includes('เปลี่ยนแปลง')) newPublishStatus = 'published_changed';
          else newPublishStatus = 'published_first';
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
    setIsFormModalOpen(false);
  };

  // Filtered projects for Step 2
  const filteredStep2Projects = useMemo(() => {
    return projects.filter((p) => {
      if (step2OnlySelected && !formSelectedProjectIds.includes(p.id)) return false;
      if (step2Dept !== 'all' && p.department !== step2Dept) return false;
      if (step2PlanType !== 'all') {
        const ed = p.edition || 'first';
        if (step2PlanType === 'first' && ed !== 'first') return false;
        if (step2PlanType === 'additional' && ed !== 'additional') return false;
        if (step2PlanType === 'changed' && ed !== 'changed') return false;
        if (step2PlanType === 'amended' && ed !== 'amended') return false;
      }
      if (step2Search.trim()) {
        if (!matchesProjectSearch(step2Search, p)) return false;
      }
      return true;
    });
  }, [projects, step2Dept, step2PlanType, step2Search, step2OnlySelected, formSelectedProjectIds]);

  // Total budget of selected projects
  const step2TotalBudget = useMemo(() => {
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

  // Reset Filters
  const handleResetFilters = () => {
    setFilterYear('all');
    setFilterPlanType('all');
    setFilterDepartment('all');
    setSearchKeyword('');
    setFilterBudget('');
  };

  // Filtered announcements
  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((ann) => {
      // Tab filter
      if (activeTab === 'approved' && ann.status !== 'approved') return false;
      if (activeTab === 'pending' && ann.status !== 'pending') return false;

      // Year filter
      if (filterYear !== 'all' && ann.year !== filterYear) return false;

      // Plan type filter
      if (filterPlanType !== 'all' && ann.planType !== filterPlanType) return false;

      // Department filter
      if (filterDepartment !== 'all' && ann.department !== filterDepartment) return false;

      // Keyword search
      if (searchKeyword.trim()) {
        const q = searchKeyword.toLowerCase();
        const matchBatch = ann.batchNumber.toLowerCase().includes(q);
        const matchNo = ann.announcementNo?.toLowerCase().includes(q);
        const matchApprover = ann.approver?.toLowerCase().includes(q);
        const matchType = ann.planType.toLowerCase().includes(q);
        if (!matchBatch && !matchNo && !matchApprover && !matchType) return false;
      }

      // Budget filter
      if (filterBudget.trim()) {
        const num = Number(filterBudget.replace(/,/g, ''));
        if (!isNaN(num) && ann.budgetTotal5Years < num) return false;
      }

      return true;
    });
  }, [
    announcements,
    activeTab,
    filterYear,
    filterPlanType,
    filterDepartment,
    searchKeyword,
    filterBudget
  ]);

  // Total projects in approved announcements
  const approvedAnnouncements = announcements.filter((a) => a.status === 'approved');
  const totalApprovedEditions = approvedAnnouncements.length;

  const totalProjectsInAnnouncements = useMemo(() => {
    const ids = new Set<string>();
    approvedAnnouncements.forEach((a) => a.projectIds.forEach((id) => ids.add(id)));
    return ids.size > 0 ? ids.size : 4;
  }, [approvedAnnouncements]);

  const totalBudget5Years = useMemo(() => {
    const sum = approvedAnnouncements.reduce((acc, a) => acc + (a.budgetTotal5Years || 0), 0);
    return sum > 0 ? sum : 2800000;
  }, [approvedAnnouncements]);

  // Pending projects / waiting for round
  const pendingCount = Math.max(0, projects.length - totalProjectsInAnnouncements);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['ที่', 'ประเภทแผน', 'ครั้งที่ / ปี พ.ศ.', 'วันที่อนุมัติ/ประกาศ', 'จำนวนโครงการ', 'งบรวม 5 ปี (บาท)', 'สถานะ'];
    const rows = filteredAnnouncements.map((ann, idx) => [
      idx + 1,
      ann.planType,
      `${ann.batchNumber} (พ.ศ. ${ann.year})`,
      ann.approvalDate,
      `${ann.projectIds.length} โครงการ`,
      ann.budgetTotal5Years,
      ann.status === 'approved' ? 'อนุมัติ' : 'รอจัดทำรอบ'
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `รายงานอนุมัติและประกาศใช้แผน_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Report
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 h-full min-h-0 overflow-hidden">
      {/* 1. Green Top Header Banner */}
      <header className="bg-[#0b4d3c] text-white px-4 py-2 sm:px-6 shadow-sm flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#06382b] border border-emerald-500/40 flex items-center justify-center text-emerald-300 shadow-inner shrink-0">
            <CheckSquare className="w-4 h-4" />
          </div>
          <h1 className="text-xs sm:text-sm font-semibold tracking-tight text-white/95">
            ระบบอนุมัติและประกาศใช้แผนพัฒนาท้องถิ่น <span className="text-emerald-300/80 mx-1">|</span> ระบบแผนพัฒนาเทศบาลเมืองศิลา <span className="text-emerald-300/80 mx-1">|</span> เทศบาลเมืองศิลา จ.ขอนแก่น
          </h1>
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-3 max-w-7xl mx-auto w-full">
        {/* 2. Filter & Action Panel */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-3.5">
          {/* Row 1: ปีงบประมาณ */}
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-700 shrink-0">ปีงบประมาณ:</span>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="text-xs border border-slate-300 rounded-md px-3 py-1.5 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
            >
              <option value="all">ทั้งหมด (2571-2575)</option>
              <option value="2571">พ.ศ. 2571</option>
              <option value="2572">พ.ศ. 2572</option>
              <option value="2573">พ.ศ. 2573</option>
              <option value="2574">พ.ศ. 2574</option>
              <option value="2575">พ.ศ. 2575</option>
            </select>
          </div>

          {/* Row 2: 4 Columns (ประเภทแผน, หน่วยงาน, ค้นหา, งบประมาณ) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-slate-700 font-medium mb-1">ประเภทแผน</label>
              <select
                value={filterPlanType}
                onChange={(e) => setFilterPlanType(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
              >
                <option value="all">-- ทุกประเภทแผน --</option>
                <option value="แผนพัฒนาท้องถิ่น ฉบับแรก">แผนพัฒนาท้องถิ่น ฉบับแรก</option>
                <option value="แผนพัฒนาท้องถิ่น เพิ่มเติม">แผนพัฒนาท้องถิ่น เพิ่มเติม</option>
                <option value="แผนพัฒนาท้องถิ่น เปลี่ยนแปลง">แผนพัฒนาท้องถิ่น เปลี่ยนแปลง</option>
                <option value="แผนพัฒนาท้องถิ่น แก้ไข">แผนพัฒนาท้องถิ่น แก้ไข</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">หน่วยงานรับผิดชอบ</label>
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                title={filterDepartment === 'all' ? '-- ทุกหน่วยงาน --' : filterDepartment}
                className="w-full text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer truncate"
              >
                <option value="all">-- ทุกหน่วยงาน --</option>
                {DEPARTMENTS.map((d, i) => (
                  <option key={i} value={d} title={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">ค้นหาข้อมูล</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="ค้นหาครั้งที่, ผู้อนุมัติ, เลขที่ประกาศ..."
                  className="w-full text-xs border border-slate-300 rounded-md pl-8 pr-2.5 py-1.5 focus:ring-2 focus:ring-emerald-500 outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">งบประมาณ (บาท)</label>
              <input
                type="text"
                value={filterBudget}
                onChange={(e) => setFilterBudget(e.target.value)}
                placeholder="ระบุจำนวนเงิน..."
                className="w-full text-xs border border-slate-300 rounded-md px-2.5 py-1.5 focus:ring-2 focus:ring-emerald-500 outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Row 3: Buttons Row (Left Search/Tabs, Right Export/Print/Add) */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-100 text-xs">
            {/* Left Action Buttons & Status Tabs */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#055740] hover:bg-[#034131] text-white rounded-md font-medium shadow-2xs transition-colors cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>ค้นหา</span>
              </button>

              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md font-medium transition-colors cursor-pointer"
              >
                <FolderOpen className="w-3.5 h-3.5 text-slate-500" />
                <span>แสดงทั้งหมด</span>
              </button>

              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-amber-300 hover:bg-amber-50 text-amber-700 rounded-md font-medium transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                <span>เริ่มใหม่</span>
              </button>

              {/* Status Tabs */}
              <button
                type="button"
                onClick={() => setActiveTab('approved')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                  activeTab === 'approved'
                    ? 'bg-[#055740] text-white shadow-xs'
                    : 'border border-slate-300 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>ประกาศใช้แล้ว ({announcements.filter((a) => a.status === 'approved').length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('pending')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                  activeTab === 'pending'
                    ? 'bg-sky-700 text-white shadow-xs'
                    : 'border border-sky-300 text-sky-700 hover:bg-sky-50'
                }`}
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>รอประกาศใช้ / จัดทำรอบ ({pendingCount})</span>
              </button>
            </div>

            {/* Right Buttons: ส่งออกข้อมูล, พิมพ์รายงาน, + เพิ่มการอนุมัติและประกาศใช้ */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0b4d3c] hover:bg-[#06382b] text-white rounded-md font-medium shadow-2xs transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ส่งออกข้อมูล {filteredAnnouncements.length}</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-80" />
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-md font-medium shadow-2xs transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>พิมพ์รายงาน</span>
              </button>

              <button
                type="button"
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#055740] hover:bg-[#034131] text-white rounded-md font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มการอนุมัติและประกาศใช้</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3. Summary KPI Cards (4 Cards in a row) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: ฉบับที่ประกาศใช้ */}
          <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-emerald-600 p-4 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">ฉบับที่ประกาศใช้</p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-bold font-mono text-slate-900 leading-none">
                  {totalApprovedEditions}
                </span>
                <span className="text-xs text-slate-500 font-normal">ฉบับ</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>

          {/* Card 2: จำนวนโครงการในประกาศ */}
          <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-emerald-600 p-4 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">จำนวนโครงการในประกาศ</p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-bold font-mono text-slate-900 leading-none">
                  {totalProjectsInAnnouncements}
                </span>
                <span className="text-xs text-slate-500 font-normal">โครงการ</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
          </div>

          {/* Card 3: งบรวม 5 ปีที่ประกาศ */}
          <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-sky-600 p-4 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">งบรวม 5 ปีที่ประกาศ</p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-bold font-mono text-slate-900 leading-none">
                  ฿{totalBudget5Years.toLocaleString()}
                </span>
                <span className="text-xs text-slate-500 font-normal">บาท</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
              <Bookmark className="w-5 h-5" />
            </div>
          </div>

          {/* Card 4: รอจัดทำรอบประกาศ */}
          <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-amber-500 p-4 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">รอจัดทำรอบประกาศ</p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-bold font-mono text-slate-900 leading-none">
                  {pendingCount}
                </span>
                <span className="text-xs text-slate-500 font-normal">โครงการ</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* 4. Table of Announcements */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-auto max-h-[55vh]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/95 text-slate-700 font-semibold border-b border-slate-200 text-center sticky top-0 z-10">
                  <th className="py-3 px-3 w-12">ที่</th>
                  <th className="py-3 px-3 w-28">จัดการ</th>
                  <th className="py-3 px-4">ประเภทแผน</th>
                  <th className="py-3 px-4">ครั้งที่ / ปี พ.ศ.</th>
                  <th className="py-3 px-4">วันที่อนุมัติ / ประกาศ (พ.ศ.)</th>
                  <th className="py-3 px-4">จำนวนโครงการ</th>
                  <th className="py-3 px-4 w-36">สถานะการประกาศใช้</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAnnouncements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-400">
                      ไม่พบข้อมูลการอนุมัติและประกาศใช้แผนตามเงื่อนไขที่เลือก
                    </td>
                  </tr>
                ) : (
                  filteredAnnouncements.map((ann, index) => (
                    <tr key={ann.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* ที่ */}
                      <td className="py-3.5 px-3 text-center text-slate-600 font-medium">
                        {index + 1}
                      </td>

                      {/* จัดการ (Eye, Edit, Trash) */}
                      <td className="py-3.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewAnnouncement(ann)}
                            className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                            title="ดูรายละเอียดโครงการในประกาศนี้"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(ann)}
                            className="p-1 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors cursor-pointer"
                            title="แก้ไขประกาศ"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`ต้องการลบรายการประกาศ ${ann.batchNumber} หรือไม่?`)) {
                                onDeleteAnnouncement(ann.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="ลบประกาศ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                      {/* ประเภทแผน (Pill Badge) */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-medium text-sky-800 bg-sky-50 border border-sky-200">
                          {ann.planType}
                        </span>
                      </td>

                      {/* ครั้งที่ / ปี พ.ศ. */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="font-mono font-bold text-slate-800">
                          {ann.batchNumber}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          พ.ศ. {ann.year}
                        </div>
                      </td>

                      {/* วันที่อนุมัติ / ประกาศ (พ.ศ.) */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="font-mono font-bold text-slate-800">
                          {toThaiBeDisplay(ann.approvalDate)}
                        </div>
                        <div className="text-[10px] text-emerald-800 font-medium">
                          {formatThaiDateLong(ann.approvalDate)}
                        </div>
                      </td>

                      {/* จำนวนโครงการ */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => setViewAnnouncement(ann)}
                          className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 transition-colors cursor-pointer"
                        >
                          <Search className="w-3 h-3 text-slate-500" />
                          <span>{ann.projectIds.length} โครงการ</span>
                        </button>
                      </td>

                      {/* สถานะการประกาศใช้ */}
                      <td className="py-3.5 px-4 text-center">
                        {ann.status === 'approved' ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>ประกาศใช้แล้ว</span>
                            </span>
                            <span className="text-[10px] text-emerald-700 font-medium">
                              (อนุมัติแล้ว)
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-300">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>รอประกาศใช้</span>
                            </span>
                            <span className="text-[10px] text-amber-700 font-medium">
                              (ร่างประกาศ)
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 5. Pagination / Table Footer */}
          <div className="p-3.5 border-t border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
            {/* Page Size & Page Dropdown */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span>หน้าละ:</span>
                <select className="border border-slate-300 rounded px-2 py-1 text-xs bg-white text-slate-700 cursor-pointer">
                  <option>20 รายการ</option>
                  <option>50 รายการ</option>
                  <option>100 รายการ</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span>หน้าที่:</span>
                <select className="border border-slate-300 rounded px-2 py-1 text-xs bg-white text-slate-700 cursor-pointer">
                  <option>1 จาก 1</option>
                </select>
              </div>
            </div>

            {/* Total items counter */}
            <div className="text-slate-500 font-medium">
              1 ถึง {filteredAnnouncements.length} จาก {filteredAnnouncements.length} รายการ
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled
                className="p-1 border border-slate-200 rounded text-slate-300 cursor-not-allowed"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled
                className="p-1 border border-slate-200 rounded text-slate-300 cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled
                className="p-1 border border-slate-200 rounded text-slate-300 cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled
                className="p-1 border border-slate-200 rounded text-slate-300 cursor-not-allowed"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: Add / Edit Announcement Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-hidden">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full h-[90vh] max-h-[860px] flex flex-col overflow-hidden border border-slate-700/30">
            {/* Header Container with Stepper */}
            <div className="bg-gradient-to-b from-[#093529] to-[#0c4436] text-white shrink-0 border-b border-emerald-900/40">
              {/* Title Bar */}
              <div className="px-6 py-4 flex items-center justify-between border-b border-emerald-800/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/90 text-white flex items-center justify-center shadow-md ring-2 ring-emerald-400/30 shrink-0">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-base sm:text-lg leading-tight text-white">
                      {editingAnnouncement ? 'แก้ไขการอนุมัติและประกาศใช้แผนพัฒนาท้องถิ่น' : 'เพิ่มการอนุมัติและประกาศใช้แผนพัฒนาท้องถิ่น'}
                    </h2>
                    <p className="text-xs text-emerald-300/90 mt-0.5">
                      เทศบาลเมืองศิลา (พ.ศ. 2571-2575)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  title="ปิดหน้าต่าง"
                  className="p-2 text-emerald-200 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Stepper Header (3 Segments with Interactive Navigation) */}
              <div className="px-6 py-3.5 bg-[#06261e]">
                <div className="grid grid-cols-3 gap-3 relative">
                  {/* Connecting line between steps */}
                  <div className="hidden sm:block absolute top-1/2 left-[18%] right-[18%] -translate-y-1/2 h-[2px] bg-emerald-950 -z-0 pointer-events-none">
                    <div 
                      className="h-full bg-emerald-400 transition-all duration-300"
                      style={{
                        width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%'
                      }}
                    />
                  </div>

                  {/* STEP 1 ITEM */}
                  <button
                    type="button"
                    onClick={() => handleStepClick(1)}
                    className={`relative z-10 rounded-xl p-2.5 sm:p-3 text-left transition-all cursor-pointer flex items-center gap-3 border ${
                      currentStep === 1
                        ? 'bg-[#0e4e3e] border-emerald-400 shadow-md ring-2 ring-emerald-400/20'
                        : currentStep > 1
                        ? 'bg-[#08362b]/90 border-emerald-700/50 hover:bg-[#0c4739] hover:border-emerald-500'
                        : 'bg-[#06241c]/80 border-white/5 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center shrink-0 transition-transform ${
                        currentStep === 1
                          ? 'bg-emerald-400 text-[#093529] shadow-sm font-extrabold ring-4 ring-emerald-400/25 scale-105'
                          : currentStep > 1
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-700/80 text-slate-300'
                      }`}
                    >
                      {currentStep > 1 ? <Check className="w-4 h-4 stroke-[3]" /> : '1'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs sm:text-sm text-white truncate">ข้อมูลการอนุมัติ</span>
                        {currentStep > 1 && (
                          <span className="hidden sm:inline-block text-[10px] text-emerald-300 bg-emerald-900/60 px-1.5 py-0.2 rounded font-medium">
                            เสร็จแล้ว
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-emerald-200/80 truncate">ประเภท, วันที่, ผู้อนุมัติ</div>
                    </div>
                  </button>

                  {/* STEP 2 ITEM */}
                  <button
                    type="button"
                    onClick={() => handleStepClick(2)}
                    className={`relative z-10 rounded-xl p-2.5 sm:p-3 text-left transition-all cursor-pointer flex items-center gap-3 border ${
                      currentStep === 2
                        ? 'bg-[#0e4e3e] border-emerald-400 shadow-md ring-2 ring-emerald-400/20'
                        : currentStep > 2
                        ? 'bg-[#08362b]/90 border-emerald-700/50 hover:bg-[#0c4739] hover:border-emerald-500'
                        : maxStepReached >= 2
                        ? 'bg-[#08362b]/60 border-emerald-800/40 hover:bg-[#0a3f32]'
                        : 'bg-[#06241c]/80 border-white/5 opacity-70 hover:opacity-90'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center shrink-0 transition-transform ${
                        currentStep === 2
                          ? 'bg-emerald-400 text-[#093529] shadow-sm font-extrabold ring-4 ring-emerald-400/25 scale-105'
                          : currentStep > 2
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-700/80 text-slate-300'
                      }`}
                    >
                      {currentStep > 2 ? <Check className="w-4 h-4 stroke-[3]" /> : '2'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs sm:text-sm text-white truncate">เลือกโครงการ</span>
                        <span className="text-[10px] bg-emerald-950/80 text-emerald-200 px-1.5 py-0.2 rounded font-mono font-semibold">
                          {formSelectedProjectIds.length}
                        </span>
                      </div>
                      <div className="text-[11px] text-emerald-200/80 truncate">
                        {formSelectedProjectIds.length > 0 ? `${formSelectedProjectIds.length} โครงการที่เลือก` : 'คัดเลือกโครงการบรรจุ'}
                      </div>
                    </div>
                  </button>

                  {/* STEP 3 ITEM */}
                  <button
                    type="button"
                    onClick={() => handleStepClick(3)}
                    className={`relative z-10 rounded-xl p-2.5 sm:p-3 text-left transition-all cursor-pointer flex items-center gap-3 border ${
                      currentStep === 3
                        ? 'bg-[#0e4e3e] border-emerald-400 shadow-md ring-2 ring-emerald-400/20'
                        : maxStepReached >= 3
                        ? 'bg-[#08362b]/90 border-emerald-700/50 hover:bg-[#0c4739]'
                        : 'bg-[#06241c]/80 border-white/5 opacity-70 hover:opacity-90'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center shrink-0 transition-transform ${
                        currentStep === 3
                          ? 'bg-emerald-400 text-[#093529] shadow-sm font-extrabold ring-4 ring-emerald-400/25 scale-105'
                          : 'bg-slate-700/80 text-slate-300'
                      }`}
                    >
                      3
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs sm:text-sm text-white truncate">สรุปก่อนบันทึก</div>
                      <div className="text-[11px] text-emerald-200/80 truncate">ตรวจสอบและยืนยัน</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Body: Scrollable Independent Content Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/60 space-y-4">
              {/* STEP 1: ข้อมูลการอนุมัติ */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  {/* 1. Step Header Alert */}
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-4 flex items-center gap-3 shadow-2xs">
                    <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs sm:text-sm text-emerald-950">
                        ขั้นตอนที่ 1: กำหนดข้อมูลประกาศและการอนุมัติ
                      </div>
                    </div>
                  </div>

                  {/* 2. Form Layout & Input Fields */}
                  <div className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 shadow-2xs space-y-4">
                    {/* แถวที่ 1 (แบ่ง 3 คอลัมน์) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          ประเภทแผน <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formPlanType}
                          onChange={(e) => handlePlanTypeChange(e.target.value)}
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all cursor-pointer font-medium"
                        >
                          <option value="แผนพัฒนาท้องถิ่น เพิ่มเติม">แผนพัฒนาท้องถิ่น เพิ่มเติม</option>
                          <option value="แผนพัฒนาท้องถิ่น ฉบับแรก">แผนพัฒนาท้องถิ่น ฉบับแรก</option>
                          <option value="แผนพัฒนาท้องถิ่น เปลี่ยนแปลง">แผนพัฒนาท้องถิ่น เปลี่ยนแปลง</option>
                          <option value="แผนพัฒนาท้องถิ่น แก้ไข">แผนพัฒนาท้องถิ่น แก้ไข</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          ครั้งที่อนุมัติ <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formApprovalRound}
                          onChange={(e) => handleApprovalRoundChange(e.target.value)}
                          placeholder="เช่น 1/2571"
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-mono font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          ปี พ.ศ. ที่อนุมัติ <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formYear}
                          onChange={(e) => handleYearChange(e.target.value)}
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all cursor-pointer font-medium"
                        >
                          <option value="พ.ศ. 2571">พ.ศ. 2571</option>
                          <option value="พ.ศ. 2572">พ.ศ. 2572</option>
                          <option value="พ.ศ. 2573">พ.ศ. 2573</option>
                          <option value="พ.ศ. 2574">พ.ศ. 2574</option>
                          <option value="พ.ศ. 2575">พ.ศ. 2575</option>
                        </select>
                      </div>
                    </div>

                    {/* แถวที่ 2 (แบ่ง 2 คอลัมน์): วันที่อนุมัติ และ วันที่มีผลบังคับใช้ */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          วันที่อนุมัติประกาศใช้ <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={formApprovalDate}
                            onChange={(e) => setFormApprovalDate(e.target.value)}
                            placeholder="09/05/2026"
                            className="w-full border border-slate-300 rounded-lg pl-3 pr-10 py-2 text-xs bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-mono font-medium"
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
                            className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 w-8 h-8 cursor-pointer z-10"
                            title="เลือกวันที่จากปฏิทิน"
                          />
                          <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          วันที่มีผลบังคับใช้
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={formEffectiveDate}
                            onChange={(e) => setFormEffectiveDate(e.target.value)}
                            placeholder="09/05/2026"
                            className="w-full border border-slate-300 rounded-lg pl-3 pr-10 py-2 text-xs bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-mono font-medium"
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
                            className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 w-8 h-8 cursor-pointer z-10"
                            title="เลือกวันที่จากปฏิทิน"
                          />
                          <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    {/* แถวที่ 3 (เต็มความกว้าง - Full Width) */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        ชื่อ / เลขที่ประกาศ
                      </label>
                      <input
                        type="text"
                        value={formAnnouncementTitle}
                        onChange={(e) => setFormAnnouncementTitle(e.target.value)}
                        placeholder="ประกาศเทศบาลเมืองศิลา เรื่อง ประกาศใช้แผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575) เพิ่มเติม ครั้งที่ 1/2571"
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-medium"
                      />
                    </div>

                    {/* แถวที่ 4 (แบ่ง 2 คอลัมน์) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          ผู้อนุมัติ / ผู้ลงนาม
                        </label>
                        <input
                          type="text"
                          value={formApprover}
                          onChange={(e) => setFormApprover(e.target.value)}
                          placeholder="นายกเทศมนตรีเมืองศิลา"
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          สถานะการประกาศ
                        </label>
                        <select
                          value={formStatus}
                          onChange={(e) => setFormStatus(e.target.value as 'approved' | 'pending')}
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all cursor-pointer font-medium"
                        >
                          <option value="approved">อนุมัติ (ประกาศใช้แล้ว)</option>
                          <option value="pending">ร่างประกาศ</option>
                        </select>
                      </div>
                    </div>

                    {/* แถวที่ 5: ช่อง หมายเหตุ */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        หมายเหตุ
                      </label>
                      <input
                        type="text"
                        value={formNote}
                        onChange={(e) => setFormNote(e.target.value)}
                        placeholder="ระบุหมายเหตุ (ถ้ามี)"
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-medium"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: เลือกโครงการ */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  {/* 1. การ์ดสรุปยอดโครงการด้านบน (Summary Header Banner) */}
                  <div className="bg-emerald-900 text-white rounded-lg p-4 mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-xs">
                    {/* ฝั่งซ้าย: แสดงจำนวนโครงการที่เลือก */}
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-800/90 flex items-center justify-center text-emerald-200 shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs text-emerald-300 font-medium">ยอดโครงการที่เลือกบรรจุในรอบนี้</div>
                        <div className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5 font-mono">
                          <span className="underline decoration-emerald-400 underline-offset-4 font-extrabold text-base sm:text-lg">
                            {formSelectedProjectIds.length}
                          </span>
                          <span className="text-xs font-normal text-emerald-200">โครงการ</span>
                          <span className="text-[11px] text-emerald-300/80 font-normal ml-2 hidden md:inline">
                            (จากทั้งหมด {projects.length} โครงการในระบบ)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* ฝั่งขวา: แสดงงบประมาณรวม 5 ปีของโครงการที่เลือก */}
                    <div className="flex items-center gap-3 bg-emerald-950/60 px-3.5 py-2 rounded-lg border border-emerald-700/50 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="text-right sm:text-right">
                        <div className="text-xs text-emerald-300 font-medium">งบประมาณรวม 5 ปี (ตามแผน)</div>
                        <div className="text-base sm:text-lg font-bold font-mono text-amber-300">
                          ฿{step2TotalBudget.toLocaleString()} <span className="text-xs font-normal text-emerald-200">บาท</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. แถบตัวกรองและเลือกทั้งหมด (Filter & Bulk Selection Bar) */}
                  <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-2.5">
                    {/* แถวที่ 1: ช่องค้นหา + ตัวกรองประเภทแผน + ปุ่มเลือกทั้งหมด */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                      {/* ค้นหาชื่อโครงการ หรือวัตถุประสงค์ */}
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={step2Search}
                          onChange={(e) => setStep2Search(e.target.value)}
                          placeholder="ค้นหารหัส ID (เช่น ป.1-โยธา-001), ชื่อโครงการ..."
                          className="w-full pl-9 pr-8 py-2 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white shadow-2xs placeholder:text-slate-400"
                        />
                        {step2Search && (
                          <button
                            type="button"
                            onClick={() => setStep2Search('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                            title="ล้างข้อความค้นหา"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* ตัวกรองประเภทแผน */}
                      <div className="relative w-full sm:w-56 shrink-0">
                        <select
                          value={step2PlanType}
                          onChange={(e) => setStep2PlanType(e.target.value)}
                          className="w-full appearance-none pl-3 pr-8 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-2xs font-medium"
                        >
                          <option value="all">ทุกประเภทแผน</option>
                          <option value="first">แผนพัฒนาท้องถิ่น ฉบับแรก</option>
                          <option value="additional">แผนพัฒนาท้องถิ่น ฉบับเพิ่มเติม</option>
                          <option value="changed">แผนพัฒนาท้องถิ่น ฉบับเปลี่ยนแปลง</option>
                          <option value="amended">แผนพัฒนาท้องถิ่น ฉบับแก้ไข</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>

                      {/* ปุ่มเลือกทั้งหมด */}
                      <button
                        type="button"
                        onClick={() => {
                          const visibleIds = filteredStep2Projects.map((p) => p.id);
                          const allVisibleSelected =
                            visibleIds.length > 0 && visibleIds.every((id) => formSelectedProjectIds.includes(id));
                          if (allVisibleSelected) {
                            setFormSelectedProjectIds(formSelectedProjectIds.filter((id) => !visibleIds.includes(id)));
                          } else {
                            const combined = Array.from(new Set([...formSelectedProjectIds, ...visibleIds]));
                            setFormSelectedProjectIds(combined);
                          }
                        }}
                        className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-emerald-950 border border-slate-300 hover:border-emerald-400 rounded-lg bg-slate-100/90 hover:bg-emerald-50 transition-colors cursor-pointer shrink-0 shadow-2xs flex items-center justify-center gap-1.5"
                        title={
                          filteredStep2Projects.length > 0 &&
                          filteredStep2Projects.every((p) => formSelectedProjectIds.includes(p.id))
                            ? `ยกเลิกเลือกทั้งหมดในผลค้นหานี้ (${filteredStep2Projects.length})`
                            : `เลือกทั้งหมดในผลค้นหานี้ (${filteredStep2Projects.length})`
                        }
                      >
                        <CheckSquare className="w-3.5 h-3.5 text-emerald-700" />
                        <span>
                          {filteredStep2Projects.length > 0 &&
                          filteredStep2Projects.every((p) => formSelectedProjectIds.includes(p.id))
                            ? `ยกเลิกเลือกทั้งหมด (${filteredStep2Projects.length})`
                            : `เลือกทั้งหมดในผลค้นหานี้ (${filteredStep2Projects.length})`}
                        </span>
                      </button>
                    </div>

                    {/* แถวที่ 2: ตัวกรองผู้รับผิดชอบ + ผลลัพธ์ + สลับมุมมอง + แสดงเฉพาะที่เลือก + รีเซ็ต */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1 border-t border-slate-100">
                      {/* ตัวกรองผู้รับผิดชอบ */}
                      <div className="relative w-full sm:w-64 shrink-0">
                        <select
                          value={step2Dept}
                          onChange={(e) => setStep2Dept(e.target.value)}
                          className="w-full appearance-none pl-3 pr-8 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-2xs font-medium"
                        >
                          <option value="all">ทุกหน่วยงาน</option>
                          {DEPARTMENTS.map((dept) => (
                            <option key={dept} value={dept}>
                              {dept}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>

                      {/* Quick Filters / Controls */}
                      <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 text-xs">
                        <div className="text-slate-500 text-[11px] flex items-center gap-1.5 mr-1">
                          <span>
                            ผลค้นหา: <strong className="text-slate-800 font-mono font-bold">{filteredStep2Projects.length}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            เลือกแล้ว: <strong className="text-emerald-700 font-mono font-bold">{formSelectedProjectIds.length}</strong>
                          </span>
                        </div>

                        {/* View Mode Toggle: รายการการ์ด (ตามรูปภาพ) vs ตาราง */}
                        <div className="inline-flex rounded-lg border border-slate-300 p-0.5 bg-slate-100/80">
                          <button
                            type="button"
                            onClick={() => setStep2ViewMode('card')}
                            className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                              step2ViewMode === 'card'
                                ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                            title="มุมมองการ์ดรายการ (ตามรูปภาพต้นแบบ)"
                          >
                            <LayoutList className="w-3 h-3" />
                            <span>รายการการ์ด</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setStep2ViewMode('table')}
                            className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                              step2ViewMode === 'table'
                                ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                            title="มุมมองตารางละเอียด 11 คอลัมน์"
                          >
                            <Table className="w-3 h-3" />
                            <span>ตาราง</span>
                          </button>
                        </div>

                        {/* Filter only selected */}
                        <button
                          type="button"
                          onClick={() => setStep2OnlySelected(!step2OnlySelected)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border cursor-pointer transition-colors ${
                            step2OnlySelected
                              ? 'bg-emerald-100 border-emerald-300 text-emerald-800 font-bold'
                              : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {step2OnlySelected ? '✓ แสดงเฉพาะที่เลือก' : 'แสดงเฉพาะที่เลือก'}
                        </button>

                        {/* Reset filters */}
                        {(step2Search || step2PlanType !== 'all' || step2Dept !== 'all' || step2OnlySelected) && (
                          <button
                            type="button"
                            onClick={() => {
                              setStep2Search('');
                              setStep2PlanType('all');
                              setStep2Dept('all');
                              setStep2OnlySelected(false);
                            }}
                            className="text-[11px] text-rose-600 hover:text-rose-800 font-medium underline cursor-pointer ml-1"
                          >
                            รีเซ็ตตัวกรอง
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 3. รายการโครงการและการระบุตำแหน่งในเล่มแผนฯ */}
                  {filteredStep2Projects.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <AlertCircle className="w-8 h-8 text-slate-300" />
                        <p className="text-xs sm:text-sm font-medium text-slate-600">ไม่พบโครงการตามเงื่อนไขที่ระบุ</p>
                        <p className="text-[11px] text-slate-400">โปรดลองเปลี่ยนคำค้นหา หรือรีเซ็ตตัวกรองประเภทแผนและหน่วยงาน</p>
                        {(step2Search || step2PlanType !== 'all' || step2Dept !== 'all' || step2OnlySelected) && (
                          <button
                            type="button"
                            onClick={() => {
                              setStep2Search('');
                              setStep2PlanType('all');
                              setStep2Dept('all');
                              setStep2OnlySelected(false);
                            }}
                            className="text-xs text-emerald-700 font-semibold hover:underline mt-2 cursor-pointer"
                          >
                            ล้างตัวกรองทั้งหมด
                          </button>
                        )}
                      </div>
                    </div>
                  ) : step2ViewMode === 'card' ? (
                    /* ====== 3A. CARD VIEW (มุมมองการ์ดรายการ ตามรูปภาพ) ====== */
                    <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                      {filteredStep2Projects.map((p) => {
                        const isChecked = formSelectedProjectIds.includes(p.id);
                        const total5 =
                          (p.budgetByYear?.['2571'] || 0) +
                          (p.budgetByYear?.['2572'] || 0) +
                          (p.budgetByYear?.['2573'] || 0) +
                          (p.budgetByYear?.['2574'] || 0) +
                          (p.budgetByYear?.['2575'] || 0);
                        const displayBudget = total5 > 0 ? total5 : p.budgetPlan || 0;
                        const currentRef = projectReferences[p.id] || { page: '', order: '' };
                        const isDetailExpanded = expandedDetailProjectIds.includes(p.id);

                        return (
                          <div
                            key={p.id}
                            className={`rounded-xl border transition-all p-3 sm:p-4 ${
                              isChecked
                                ? 'bg-emerald-50/70 border-emerald-400 shadow-sm ring-1 ring-emerald-400/20'
                                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                            }`}
                          >
                            {/* ส่วนหัวการ์ด: Checkbox, หมายเลขโครงการ, ชื่อโครงการ, ป้ายประเภทแผน, งบประมาณ 5 ปี */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleToggleProject(p.id)}
                                  className="mt-1 w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600 shrink-0"
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-mono text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                      {getProjectDisplayId(p, p.orderNumber)}
                                    </span>
                                    <span
                                      onClick={() => handleToggleProject(p.id)}
                                      className="font-bold text-xs sm:text-sm text-slate-900 leading-snug cursor-pointer hover:text-emerald-800"
                                    >
                                      {p.name}
                                    </span>
                                    {/* ป้ายประเภทแผน */}
                                    <span
                                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                        p.edition === 'additional'
                                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                          : p.edition === 'changed'
                                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                                          : p.edition === 'amended'
                                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                                          : 'bg-blue-50 text-blue-700 border-blue-200'
                                      }`}
                                    >
                                      {p.edition === 'additional'
                                        ? 'เพิ่มเติม'
                                        : p.edition === 'changed'
                                        ? 'เปลี่ยนแปลง'
                                        : p.edition === 'amended'
                                        ? 'แก้ไข'
                                        : 'ฉบับแรก'}
                                      {p.editionNumber ? ` ครั้งที่ ${p.editionNumber}` : ''}
                                    </span>
                                  </div>

                                  {/* หน่วยงานรับผิดชอบ • ประเด็นการพัฒนา */}
                                  <div className="text-[11px] text-slate-600 mt-1 flex flex-wrap items-center gap-1.5 leading-relaxed">
                                    <span className="font-semibold text-slate-800">{p.department}</span>
                                    <span className="text-slate-400">•</span>
                                    <span className="text-slate-600 truncate max-w-xl">{p.planStrategy}</span>
                                  </div>
                                </div>
                              </div>

                              {/* ด้านขวา: งบประมาณรวม 5 ปี */}
                              <div className="text-right shrink-0">
                                <div className="text-xs sm:text-sm font-bold font-mono text-slate-900">
                                  ฿{displayBudget.toLocaleString()}
                                </div>
                                <div className="text-[10px] text-slate-400 font-medium">งบ 5 ปี</div>
                              </div>
                            </div>

                            {/* เมื่อเลือกแล้ว: ช่องระบุตำแหน่งในเล่มแผนฯ (หน้าที่ / ลำดับที่) + พรีวิวข้อความอ้างอิงมาตรฐาน */}
                            {isChecked && (
                              <div className="mt-3 pt-3 border-t border-emerald-200 bg-white/95 rounded-lg p-3 shadow-2xs space-y-2.5">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                                      <Bookmark className="w-3.5 h-3.5 text-emerald-700" />
                                      ระบุตำแหน่งโครงการในเล่มแผนฯ:
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1">
                                      <label className="text-[11px] font-semibold text-slate-700">หน้าที่:</label>
                                      <input
                                        type="text"
                                        placeholder="หน้าที่"
                                        value={currentRef.page}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setProjectReferences((prev) => ({
                                            ...prev,
                                            [p.id]: { ...(prev[p.id] || { order: '' }), page: val }
                                          }));
                                        }}
                                        className="w-24 px-2.5 py-1 text-xs border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono text-center bg-white shadow-2xs placeholder:text-slate-400 font-bold text-slate-800"
                                        title="ระบุเลขหน้าที่ในเล่มแผนพัฒนาท้องถิ่น"
                                      />
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <label className="text-[11px] font-semibold text-slate-700">ลำดับที่:</label>
                                      <input
                                        type="text"
                                        placeholder="ลำดับที่"
                                        value={currentRef.order}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setProjectReferences((prev) => ({
                                            ...prev,
                                            [p.id]: { ...(prev[p.id] || { page: '' }), order: val }
                                          }));
                                        }}
                                        className="w-24 px-2.5 py-1 text-xs border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono text-center bg-white shadow-2xs placeholder:text-slate-400 font-bold text-slate-800"
                                        title="ระบุลำดับที่ในเล่มแผนพัฒนาท้องถิ่น"
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* พรีวิวข้อความอ้างอิงอัตโนมัติ */}
                                <div className="text-[11px] text-emerald-900 bg-emerald-50/90 border border-emerald-200 px-3 py-1.5 rounded-lg flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                  <span className="font-bold text-emerald-800 shrink-0 flex items-center gap-1">
                                    <Check className="w-3 h-3 text-emerald-700" />
                                    ข้อความอ้างอิงอัตโนมัติ:
                                  </span>
                                  <span className="font-medium text-slate-800 break-all">
                                    {generatePlanReferenceText(formPlanType, currentRef.page, currentRef.order)}
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* รายละเอียดโครงการ: วัตถุประสงค์, เป้าหมาย, งบประมาณรายปี 2571-2575, ผลที่คาดว่าจะได้รับ */}
                            <div className="mt-2.5 pt-2 border-t border-slate-100 text-xs text-slate-600 space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="text-[11px] text-slate-500 flex items-center gap-2">
                                  <span>
                                    รหัส ID: <strong className="font-mono text-emerald-800">{getProjectDisplayId(p, p.orderNumber)}</strong>
                                  </span>
                                  {p.planCategory && (
                                    <span>
                                      • หมวด: <strong className="text-slate-700">{p.planCategory}</strong>
                                    </span>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setExpandedDetailProjectIds((prev) =>
                                      prev.includes(p.id) ? prev.filter((id) => id !== p.id) : [...prev, p.id]
                                    );
                                  }}
                                  className="text-[11px] text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer flex items-center gap-1"
                                >
                                  <span>{isDetailExpanded ? 'ย่อรายละเอียด' : 'ดูรายละเอียดโครงการเต็ม'}</span>
                                  {isDetailExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </button>
                              </div>

                              {/* แสดงรายละเอียดโครงการแบบขยาย */}
                              {(isDetailExpanded || isChecked) && (
                                <div className="bg-slate-50/80 rounded-lg p-2.5 space-y-2 border border-slate-200/70 text-[11px]">
                                  {p.objective && (
                                    <div>
                                      <span className="font-bold text-slate-700">วัตถุประสงค์: </span>
                                      <span className="text-slate-600">{p.objective}</span>
                                    </div>
                                  )}
                                  {p.target && (
                                    <div>
                                      <span className="font-bold text-slate-700">เป้าหมาย (ผลผลิต): </span>
                                      <span className="text-slate-600">{p.target}</span>
                                    </div>
                                  )}

                                  {/* ตารางงบประมาณ 5 ปี (พ.ศ. 2571 - 2575) */}
                                  <div>
                                    <div className="font-bold text-slate-700 mb-1">งบประมาณรายปี (พ.ศ. 2571 - 2575):</div>
                                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 font-mono text-center">
                                      {(['2571', '2572', '2573', '2574', '2575'] as const).map((yr) => {
                                        const amt = p.budgetByYear?.[yr] || 0;
                                        return (
                                          <div key={yr} className="bg-white rounded border border-slate-200 p-1">
                                            <div className="text-[10px] text-slate-400 font-sans">{yr}</div>
                                            <div
                                              className={`text-[11px] font-bold ${
                                                amt > 0 ? 'text-emerald-800' : 'text-slate-400'
                                              }`}
                                            >
                                              ฿{amt.toLocaleString()}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  {p.expectedResults && (
                                    <div>
                                      <span className="font-bold text-slate-700">ผลที่คาดว่าจะได้รับ: </span>
                                      <span className="text-slate-600">{p.expectedResults}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* ====== 3B. TABLE VIEW (มุมมองตารางละเอียด 11 คอลัมน์) ====== */
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs max-h-[460px] overflow-y-auto">
                      <table className="w-full text-left text-xs border-collapse min-w-[1100px]">
                        <thead className="bg-[#054e3b] text-white font-semibold sticky top-0 z-10 border-b border-[#075f48]">
                          <tr>
                            <th className="py-3 px-3 text-center w-12 border-r border-[#075f48]">
                              <input
                                type="checkbox"
                                checked={
                                  filteredStep2Projects.length > 0 &&
                                  filteredStep2Projects.every((p) => formSelectedProjectIds.includes(p.id))
                                }
                                onChange={() => {
                                  const visibleIds = filteredStep2Projects.map((p) => p.id);
                                  const allVisibleSelected = visibleIds.every((id) =>
                                    formSelectedProjectIds.includes(id)
                                  );
                                  if (allVisibleSelected) {
                                    setFormSelectedProjectIds(
                                      formSelectedProjectIds.filter((id) => !visibleIds.includes(id))
                                    );
                                  } else {
                                    const combined = Array.from(new Set([...formSelectedProjectIds, ...visibleIds]));
                                    setFormSelectedProjectIds(combined);
                                  }
                                }}
                                className="rounded border-2 border-emerald-200 text-emerald-600 focus:ring-emerald-400 cursor-pointer w-4 h-4 bg-white accent-emerald-600"
                                title="เลือก/ยกเลิกทั้งหมดในผลค้นหานี้"
                              />
                            </th>
                            <th className="py-3 px-3 w-28 text-center border-r border-[#075f48] font-medium">ID</th>
                            <th className="py-3 px-3 text-center w-28 border-r border-[#075f48]">ประเภทแผน</th>
                            <th className="py-3 px-3 border-r border-[#075f48] w-36">ประเด็นการพัฒนา</th>
                            <th className="py-3 px-4 border-r border-[#075f48]">ชื่อโครงการ</th>
                            <th className="py-3 px-3 border-r border-[#075f48] w-48">วัตถุประสงค์</th>
                            <th className="py-3 px-3 border-r border-[#075f48] w-44">เป้าหมาย (ผลผลิต)</th>
                            <th className="py-3 px-3 text-right w-32 border-r border-[#075f48]">งบประมาณ 5 ปี</th>
                            <th className="py-3 px-3 border-r border-[#075f48] w-44">ผลที่คาดว่าจะได้รับ</th>
                            <th className="py-3 px-3 text-center w-32 border-r border-[#075f48]">หน่วยงานรับผิดชอบ</th>
                            <th className="py-3 px-3 text-center w-60">ตำแหน่งในเล่มแผนฯ (หน้าที่ / ลำดับที่)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {filteredStep2Projects.map((p) => {
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
                                onClick={() => handleToggleProject(p.id)}
                                className={`cursor-pointer transition-colors ${
                                  isChecked
                                    ? 'bg-emerald-50/80 hover:bg-emerald-100/70 border-l-4 border-l-emerald-600'
                                    : 'hover:bg-slate-50'
                                }`}
                              >
                                {/* 1. Checkbox */}
                                <td className="py-3 px-3 text-center border-r border-slate-100" onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => handleToggleProject(p.id)}
                                    className="rounded border-2 border-slate-400 checked:border-emerald-600 text-emerald-600 focus:ring-emerald-500 cursor-pointer w-4 h-4 bg-white accent-emerald-600 shadow-2xs"
                                  />
                                </td>

                                {/* 2. รหัสโครงการ / ID */}
                                <td className="py-3 px-3 text-center border-r border-slate-100">
                                  <span className="bg-emerald-50 px-2 py-0.5 rounded text-emerald-800 border border-emerald-200/80 font-mono text-xs font-semibold inline-block whitespace-nowrap">
                                    {getProjectDisplayId(p, p.orderNumber)}
                                  </span>
                                </td>

                                {/* 3. ประเภทแผน */}
                                <td className="py-3 px-3 text-center border-r border-slate-100">
                                  {p.edition === 'additional' ? (
                                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      เพิ่มเติม {p.editionNumber ? `ครั้งที่ ${p.editionNumber}` : ''}
                                    </span>
                                  ) : p.edition === 'changed' ? (
                                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                      เปลี่ยนแปลง {p.editionNumber ? `ครั้งที่ ${p.editionNumber}` : ''}
                                    </span>
                                  ) : p.edition === 'amended' ? (
                                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                                      แก้ไข {p.editionNumber ? `ครั้งที่ ${p.editionNumber}` : ''}
                                    </span>
                                  ) : (
                                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                      ฉบับแรก
                                    </span>
                                  )}
                                </td>

                                {/* 4. ประเด็นการพัฒนา */}
                                <td className="py-3 px-3 text-slate-700 text-xs border-r border-slate-100">
                                  <div className="line-clamp-2" title={p.planStrategy || '-'}>
                                    {p.planStrategy || '-'}
                                  </div>
                                </td>

                                {/* 5. ชื่อโครงการ */}
                                <td className="py-3 px-4 border-r border-slate-100">
                                  <div className="font-semibold text-slate-900 text-xs leading-snug">
                                    {p.name}
                                  </div>
                                  {p.planCategory && (
                                    <div className="text-[10px] text-slate-500 mt-0.5">
                                      แผนงาน: {p.planCategory}
                                    </div>
                                  )}
                                </td>

                                {/* 6. วัตถุประสงค์ */}
                                <td className="py-3 px-3 text-slate-600 text-[11px] border-r border-slate-100">
                                  <div className="line-clamp-2" title={p.objective || '-'}>
                                    {p.objective || '-'}
                                  </div>
                                </td>

                                {/* 7. เป้าหมาย (ผลผลิต) */}
                                <td className="py-3 px-3 text-slate-600 text-[11px] border-r border-slate-100">
                                  <div className="line-clamp-2" title={p.target || '-'}>
                                    {p.target || '-'}
                                  </div>
                                </td>

                                {/* 8. งบประมาณ 5 ปี */}
                                <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 text-xs border-r border-slate-100">
                                  <div>฿{displayBudget.toLocaleString()}</div>
                                  <div className="text-[9px] text-slate-400 font-normal">งบ 5 ปี</div>
                                </td>

                                {/* 9. ผลที่คาดว่าจะได้รับ */}
                                <td className="py-3 px-3 text-slate-600 text-[11px] border-r border-slate-100">
                                  <div className="line-clamp-2" title={p.expectedResults || '-'}>
                                    {p.expectedResults || '-'}
                                  </div>
                                </td>

                                {/* 10. หน่วยงานรับผิดชอบ */}
                                <td className="py-3 px-3 text-center text-slate-600 text-xs border-r border-slate-100">
                                  <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] border border-slate-200">
                                    {p.department}
                                  </span>
                                </td>

                                {/* 11. ตำแหน่งในเล่มแผนฯ (หน้าที่ / ลำดับที่) */}
                                <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                                  {isChecked ? (
                                    <div className="flex flex-col items-center gap-1">
                                      <div className="flex items-center justify-center gap-1.5">
                                        <div className="relative">
                                          <input
                                            type="text"
                                            placeholder="หน้าที่"
                                            value={currentRef.page}
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              setProjectReferences((prev) => ({
                                                ...prev,
                                                [p.id]: { ...(prev[p.id] || { order: '' }), page: val }
                                              }));
                                            }}
                                            className="w-24 px-2 py-1 text-xs border border-emerald-300 rounded focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono text-center bg-white shadow-2xs placeholder:text-slate-400 font-bold"
                                            title="ระบุเลขหน้าที่ในเล่มแผนพัฒนาท้องถิ่น"
                                          />
                                        </div>
                                        <div className="relative">
                                          <input
                                            type="text"
                                            placeholder="ลำดับที่"
                                            value={currentRef.order}
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              setProjectReferences((prev) => ({
                                                ...prev,
                                                [p.id]: { ...(prev[p.id] || { page: '' }), order: val }
                                              }));
                                            }}
                                            className="w-24 px-2 py-1 text-xs border border-emerald-300 rounded focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono text-center bg-white shadow-2xs placeholder:text-slate-400 font-bold"
                                            title="ระบุลำดับที่ในเล่มแผนพัฒนาท้องถิ่น"
                                          />
                                        </div>
                                      </div>
                                      {(currentRef.page || currentRef.order) && (
                                        <div
                                          className="text-[10px] text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded font-medium truncate max-w-[210px] border border-emerald-200"
                                          title={generatePlanReferenceText(formPlanType, currentRef.page, currentRef.order)}
                                        >
                                          หน้า {currentRef.page || '-'} ลำดับที่ {currentRef.order || '-'}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-slate-400 text-[11px] italic">
                                      - ติ๊กเลือกเพื่อระบุตำแหน่ง -
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: สรุปก่อนบันทึก */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  {/* Helper Banner */}
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3.5 flex items-start gap-3 shadow-2xs">
                    <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-emerald-950 flex items-center gap-2">
                        <span>ขั้นตอนที่ 3: สรุปก่อนบันทึก ตรวจสอบและยืนยัน</span>
                        <span className="text-[11px] font-normal text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                          ตรวจสอบความถูกต้อง
                        </span>
                      </div>
                      <div className="text-xs text-emerald-800/90 mt-0.5 leading-relaxed">
                        โปรดตรวจสอบความถูกต้องของข้อมูลประกาศและรายการโครงการ ก่อนทำการบันทึกและประกาศใช้แผนพัฒนาท้องถิ่น
                      </div>
                    </div>
                  </div>

                  {/* Highlight Metric Banner (ยอดรวมงบประมาณสุทธิอย่างชัดเจน) */}
                  <div className="bg-gradient-to-r from-emerald-900 via-[#0b4a3a] to-emerald-800 text-white rounded-2xl p-5 shadow-md border border-emerald-700/50 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/30 border border-emerald-400/40 flex items-center justify-center text-amber-300 shadow-sm shrink-0">
                        <Coins className="w-7 h-7" />
                      </div>
                      <div>
                        <div className="text-xs text-emerald-200 font-medium">
                          ยอดรวมงบประมาณสุทธิ 5 ปี (พ.ศ. 2571 - 2575)
                        </div>
                        <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-white mt-0.5">
                          ฿{step2TotalBudget.toLocaleString()} <span className="text-sm font-normal text-emerald-200">บาท</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      <div className="bg-[#062920]/80 px-3.5 py-2 rounded-xl border border-emerald-700/60 text-center">
                        <div className="text-[11px] text-emerald-300">โครงการที่อนุมัติ</div>
                        <div className="text-base font-bold font-mono text-emerald-200">{formSelectedProjectIds.length} รายการ</div>
                      </div>
                      <div className="bg-[#062920]/80 px-3.5 py-2 rounded-xl border border-emerald-700/60 text-center">
                        <div className="text-[11px] text-emerald-300">สถานะการประกาศใช้</div>
                        <div className="text-xs font-bold text-white mt-1">
                          {formStatus === 'approved' ? (
                            <span className="text-emerald-300 flex items-center gap-1">✔ ประกาศใช้แล้ว (อนุมัติ)</span>
                          ) : (
                            <span className="text-amber-300 flex items-center gap-1">⌛ ร่างประกาศ (รออนุมัติ)</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card 1: รายละเอียดประกาศ */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-2xs space-y-3.5">
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs">
                          <FileText className="w-4 h-4" />
                        </div>
                        <h3 className="font-bold text-xs sm:text-sm text-slate-900">รายละเอียดประกาศและการอนุมัติ</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold inline-flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>แก้ไขข้อมูลประกาศ</span>
                      </button>
                    </div>

                    {/* Announcement Title Box */}
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                      <div className="text-[11px] text-slate-500 font-medium">ชื่อ / เลขที่ประกาศ</div>
                      <div className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5">{formAnnouncementTitle}</div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                        <span className="text-[11px] text-slate-500 block">ประเภทแผน</span>
                        <span className="font-bold text-slate-800 mt-0.5 block">{formPlanType}</span>
                      </div>
                      <div className="bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                        <span className="text-[11px] text-slate-500 block">ครั้งที่ / ปี พ.ศ.</span>
                        <span className="font-bold text-slate-800 font-mono mt-0.5 block">ครั้งที่ {formApprovalRound} ({formYear})</span>
                      </div>
                      <div className="bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                        <span className="text-[11px] text-slate-500 block">วันที่อนุมัติ (พ.ศ.)</span>
                        <span className="font-bold text-slate-800 font-mono mt-0.5 block">{toThaiBeDisplay(formApprovalDate)}</span>
                        <span className="text-[10px] text-emerald-800 font-medium block mt-0.5">{formatThaiDateLong(formApprovalDate)}</span>
                      </div>
                      <div className="bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                        <span className="text-[11px] text-slate-500 block">วันที่มีผลบังคับใช้ (พ.ศ.)</span>
                        <span className="font-bold text-slate-800 font-mono mt-0.5 block">{toThaiBeDisplay(formEffectiveDate || formApprovalDate)}</span>
                        <span className="text-[10px] text-emerald-800 font-medium block mt-0.5">{formatThaiDateLong(formEffectiveDate || formApprovalDate)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                      <div className="bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                        <span className="text-[11px] text-slate-500 block">ผู้อนุมัติ / ผู้ลงนาม</span>
                        <span className="font-semibold text-slate-800 mt-0.5 block">{formApprover}</span>
                      </div>
                      <div className="bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                        <span className="text-[11px] text-slate-500 block">หน่วยงานรับผิดชอบ</span>
                        <span className="font-semibold text-slate-800 mt-0.5 block">{formDepartment}</span>
                      </div>
                      <div className="bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                        <span className="text-[11px] text-slate-500 block">สถานะการประกาศใช้</span>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold mt-1 ${
                          formStatus === 'approved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}>
                          {formStatus === 'approved' ? '✔ ประกาศใช้แล้ว (อนุมัติแล้ว)' : '⌛ ร่างประกาศ (รอการอนุมัติ)'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: รายการโครงการที่ได้รับอนุมัติ */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-2xs space-y-3.5">
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs">
                          <CheckSquare className="w-4 h-4" />
                        </div>
                        <h3 className="font-bold text-xs sm:text-sm text-slate-900">รายการโครงการที่ได้รับอนุมัติบรรจุ</h3>
                        <span className="bg-emerald-100 text-emerald-800 font-mono font-bold text-xs px-2 py-0.5 rounded-full">
                          {formSelectedProjectIds.length} โครงการ
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold inline-flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>ปรับเปลี่ยนโครงการ</span>
                      </button>
                    </div>

                    {formSelectedProjectIds.length === 0 ? (
                      <div className="p-4 border border-rose-200 rounded-xl bg-rose-50 text-rose-800 text-xs flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
                        <div className="flex items-center gap-2.5">
                          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                          <div>
                            <div className="font-bold text-rose-900 text-xs sm:text-sm">ยังไม่มีโครงการที่ถูกเลือกในประกาศนี้</div>
                            <div className="text-[11px] text-rose-700 mt-0.5">
                              ตามระเบียบการจัดทำแผนพัฒนาท้องถิ่น ต้องมีโครงการบรรจุอย่างน้อย 1 โครงการก่อนทำการบันทึกประกาศใช้
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(2)}
                          className="px-3.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-lg font-semibold text-xs transition-colors shrink-0 cursor-pointer shadow-2xs inline-flex items-center gap-1"
                        >
                          <span>+ ไปเลือกโครงการ</span>
                        </button>
                      </div>
                    ) : (
                      <div className="border border-slate-200 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0 z-10 border-b border-slate-200">
                            <tr>
                              <th className="p-2.5 text-center w-10">ที่</th>
                              <th className="p-2.5 w-28 text-center font-medium">ID</th>
                              <th className="p-2.5">ชื่อโครงการ</th>
                              <th className="p-2.5 w-32">หน่วยงาน</th>
                              <th className="p-2.5 text-right w-28">งบประมาณ 5 ปี</th>
                              <th className="p-2.5 w-48 text-center">ตำแหน่งในเล่มแผนฯ</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {projects
                              .filter((p) => formSelectedProjectIds.includes(p.id))
                              .map((p, idx) => {
                                const total5 =
                                  (p.budgetByYear?.['2571'] || 0) +
                                  (p.budgetByYear?.['2572'] || 0) +
                                  (p.budgetByYear?.['2573'] || 0) +
                                  (p.budgetByYear?.['2574'] || 0) +
                                  (p.budgetByYear?.['2575'] || 0);
                                const displayBudget = total5 > 0 ? total5 : p.budgetPlan || 0;
                                const ref = projectReferences[p.id] || { page: '', order: '' };
                                return (
                                  <tr key={p.id} className="hover:bg-slate-50">
                                    <td className="p-2.5 text-center text-slate-500">{idx + 1}</td>
                                    <td className="p-2.5 font-mono text-emerald-800 font-medium text-center whitespace-nowrap bg-emerald-50/20">{getProjectDisplayId(p, p.orderNumber || idx + 1)}</td>
                                    <td className="p-2.5 font-semibold text-slate-900">{p.name}</td>
                                    <td className="p-2.5 text-slate-600">{p.department}</td>
                                    <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                                      ฿{displayBudget.toLocaleString()}
                                    </td>
                                    <td className="p-2.5 text-center">
                                      {ref.page || ref.order ? (
                                        <span className="inline-block bg-emerald-50 text-emerald-800 border border-emerald-200 rounded px-2 py-0.5 text-[11px] font-medium">
                                          หน้า {ref.page || '-'} ลำดับที่ {ref.order || '-'}
                                        </span>
                                      ) : (
                                        <span className="text-slate-400 text-[11px] italic">- ไม่ได้ระบุ -</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                          <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                            <tr>
                              <td colSpan={4} className="p-2.5 text-right text-slate-700">
                                รวมงบประมาณทั้งสิ้น ({formSelectedProjectIds.length} โครงการ):
                              </td>
                              <td className="p-2.5 text-right font-mono text-emerald-800 font-extrabold text-sm">
                                ฿{step2TotalBudget.toLocaleString()}
                              </td>
                              <td className="p-2.5"></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* FIXED FOOTER (shrink-0) - ALWAYS VISIBLE, NEVER SCROLLS AWAY */}
            <div className="shrink-0 bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-between shadow-xs">
              {/* Left button: ย้อนกลับ (when step > 1) */}
              <div>
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep((prev) => (prev > 1 ? (prev - 1 as 1 | 2) : 1))}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shadow-2xs"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>ย้อนกลับ</span>
                  </button>
                ) : (
                  <div />
                )}
              </div>

              {/* Right buttons: กลับไป and ถัดไป / บันทึก */}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  กลับไป
                </button>

                {currentStep === 1 && (
                  <button
                    type="button"
                    onClick={handleGoToStep2}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold bg-[#0b5442] hover:bg-[#084234] text-white rounded-lg shadow-sm transition-all cursor-pointer hover:shadow-md"
                  >
                    <span>ถัดไป</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                {currentStep === 2 && (
                  <button
                    type="button"
                    onClick={handleGoToStep3}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold bg-[#0b5442] hover:bg-[#084234] text-white rounded-lg shadow-sm transition-all cursor-pointer hover:shadow-md"
                  >
                    <span>ถัดไป</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                {currentStep === 3 && (
                  <button
                    type="button"
                    onClick={handleFinalSubmit}
                    disabled={formSelectedProjectIds.length === 0}
                    title={formSelectedProjectIds.length === 0 ? 'กรุณาเลือกโครงการอย่างน้อย 1 โครงการก่อนทำการบันทึก' : 'บันทึกข้อมูล'}
                    className={`inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white rounded-lg shadow-md transition-all ${
                      formSelectedProjectIds.length === 0
                        ? 'bg-slate-400 cursor-not-allowed opacity-60 shadow-none'
                        : 'bg-[#055740] hover:bg-[#034131] cursor-pointer ring-2 ring-emerald-500/20 hover:scale-[1.01]'
                    }`}
                  >
                    <Save className="w-4 h-4" />
                    <span>
                      {formStatus === 'approved' ? 'บันทึกและประกาศใช้แผน' : 'บันทึกร่างประกาศ'}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: View Announcement Detail Modal */}
      {viewAnnouncement && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="bg-[#0b4d3c] text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-5 h-5 text-emerald-300" />
                <div>
                  <h2 className="font-bold text-sm sm:text-base">
                    ประกาศใช้แผนพัฒนาท้องถิ่น ครั้งที่ {viewAnnouncement.batchNumber}
                  </h2>
                  <p className="text-[11px] text-emerald-200">
                    {viewAnnouncement.planType} (ประจำปีงบประมาณ พ.ศ. {viewAnnouncement.year})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewAnnouncement(null)}
                className="p-1 text-emerald-200 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Metadata Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block">เลขที่ประกาศ</span>
                  <span className="font-semibold text-slate-900">{viewAnnouncement.announcementNo || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">วันที่ประกาศ (พ.ศ.)</span>
                  <span className="font-semibold text-slate-900 font-mono">
                    {toThaiBeDisplay(viewAnnouncement.approvalDate)}
                  </span>
                  <div className="text-[10px] text-emerald-800 font-medium">
                    {formatThaiDateLong(viewAnnouncement.approvalDate)}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 block">ผู้อนุมัติ/ลงนาม</span>
                  <span className="font-semibold text-slate-900">{viewAnnouncement.approver || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">งบประมาณรวม 5 ปี</span>
                  <span className="font-semibold text-emerald-700 font-mono text-sm">
                    {viewAnnouncement.budgetTotal5Years.toLocaleString()} บาท
                  </span>
                </div>
              </div>

              {/* Projects List in this announcement */}
              <div>
                <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                  <span>รายการโครงการที่บรรจุในประกาศนี้</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px]">
                    {viewAnnouncement.projectIds.length} โครงการ
                  </span>
                </h3>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-semibold">
                      <tr>
                        <th className="p-2.5 text-center w-10">ที่</th>
                        <th className="p-2.5 w-28 text-center font-medium">ID</th>
                        <th className="p-2.5">ชื่อโครงการ</th>
                        <th className="p-2.5">หน่วยงานหลัก</th>
                        <th className="p-2.5 text-right">งบประมาณ 5 ปี</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {projects
                        .filter((p) => viewAnnouncement.projectIds.includes(p.id))
                        .map((p, idx) => (
                          <tr
                            key={p.id}
                            className="hover:bg-slate-50 cursor-pointer"
                            onClick={() => onViewProjectDetail && onViewProjectDetail(p)}
                          >
                            <td className="p-2.5 text-center text-slate-500">{idx + 1}</td>
                            <td className="p-2.5 font-mono text-emerald-800 font-medium text-center whitespace-nowrap bg-emerald-50/20">{getProjectDisplayId(p, p.orderNumber || idx + 1)}</td>
                            <td className="p-2.5 font-medium text-slate-900">{p.name}</td>
                            <td className="p-2.5 text-slate-600">{p.department}</td>
                            <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                              {(p.budgetPlan || 0).toLocaleString()} ฿
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded-lg hover:bg-slate-50 font-medium"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>พิมพ์เอกสารประกาศ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewAnnouncement(null)}
                  className="px-4 py-1.5 bg-slate-800 text-white rounded-lg hover:bg-slate-900 font-medium"
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
