import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar,
  Search,
  Plus,
  CheckCircle2,
  Clock,
  RotateCcw,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Printer,
  ChevronDown,
  Layers,
  Eye,
  PlusCircle,
  ArrowLeftRight,
  FileEdit,
  History,
  ArrowLeft,
  Building2,
  Check,
  AlertCircle,
  Send,
  ShieldCheck,
  Download,
  AlertTriangle,
  Sparkles,
  ChevronUp,
  PieChart,
  FileSpreadsheet
} from 'lucide-react';
import { ProjectData, PlanAnnouncement, UserAccount } from '../types';
import { storageService } from '../services/storage';
import { PlanApprovalAnnouncementModal } from './PlanApprovalAnnouncementModal';
import { exportTableToExcel, exportTableToCSV } from '../utils/exportUtils';
import {
  getStandardPlanName,
  resolveAnnouncementBatchDisplay,
  getNextBatchSequence,
  isInitialPlanEdition,
  getStandardAnnouncementTitle
} from '../utils/planSequence';

interface PlanApprovalAnnouncementViewProps {
  projects: ProjectData[];
  announcements: PlanAnnouncement[];
  onSaveAnnouncement: (announcement: PlanAnnouncement, updatedProjects?: ProjectData[]) => void;
  onDeleteAnnouncement: (id: string) => void;
  onViewProjectDetail?: (project: ProjectData) => void;
  onUpdateProjects?: (updatedProjects: ProjectData[]) => void;
  currentUser?: UserAccount | null;
}

// Helper: Format clean number with comma separation and no "฿" or "บาท" prefix/suffix
const formatCleanNumber = (val: number | null | undefined): string => {
  if (val === null || val === undefined || isNaN(val)) return '0';
  return Math.round(val).toLocaleString('th-TH');
};

// Helper: Get formatted Thai Date & Time string for Audit Trail (fixed to 2571 for mockup)
const getCurrentThaiDateTime = (): string => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = 2571; // พ.ศ. 2571 ตามข้อกำหนด
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};

// Helper: Map status to 3 Simple States
// 1 = pending_approval (รออนุมัติ)
// 2 = approved (อนุมัติแล้ว)
// 3 = published (ประกาศใช้แล้ว)
const getSimplePlanState = (status?: string): 'pending_approval' | 'approved' | 'published' => {
  if (!status) return 'pending_approval';
  if (status === 'pending_approval' || status === 'pending' || status === 'returned') {
    return 'pending_approval';
  }
  if (status === 'approved' || status === 'pending_announcement') {
    return 'approved';
  }
  return 'published';
};

// Helper: Get clean standard plan name for column 3 according to municipal regulations
// - ฉบับแรก: "แผนพัฒนาท้องถิ่น (พ.ศ. 2571 - 2575)"
// - เพิ่มเติม: "แผนพัฒนาท้องถิ่น (พ.ศ. 2571 - 2575) เพิ่มเติม"
// - เปลี่ยนแปลง: "แผนพัฒนาท้องถิ่น (พ.ศ. 2571 - 2575) เปลี่ยนแปลง"
// - แก้ไข: "แผนพัฒนาท้องถิ่น (พ.ศ. 2571 - 2575) แก้ไข"
const getCleanPlanName = (planType?: string): string => {
  return getStandardPlanName(planType);
};

// Helper: Format Plan Type badge
const getPlanTypeBadge = (planType: string) => {
  const pt = planType || '';
  if (pt.includes('เพิ่มเติม') || pt.toLowerCase().includes('additional')) {
    return {
      label: 'เพิ่มเติม',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      iconClass: 'text-emerald-600',
      Icon: PlusCircle
    };
  }
  if (pt.includes('เปลี่ยนแปลง') || pt.toLowerCase().includes('changed')) {
    return {
      label: 'เปลี่ยนแปลง',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
      iconClass: 'text-amber-600',
      Icon: ArrowLeftRight
    };
  }
  if (pt.includes('แก้ไข') || pt.toLowerCase().includes('amended')) {
    return {
      label: 'แก้ไข',
      badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
      iconClass: 'text-blue-600',
      Icon: FileEdit
    };
  }
  return {
    label: 'ฉบับแรก',
    badgeClass: 'bg-teal-50 text-teal-800 border-teal-200',
    iconClass: 'text-teal-600',
    Icon: FileText
  };
};

export const PlanApprovalAnnouncementView: React.FC<PlanApprovalAnnouncementViewProps> = ({
  projects,
  announcements,
  onSaveAnnouncement,
  onDeleteAnnouncement,
  onViewProjectDetail,
  onUpdateProjects,
  currentUser
}) => {
  // Main filter states
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<string>('2571-2575');
  const [selectedPlanTypeFilter, setSelectedPlanTypeFilter] = useState<string>('all');
  const [activeStateFilter, setActiveStateFilter] = useState<'all' | 'pending_approval' | 'approved' | 'published'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Pagination states
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Modals & Views State
  const [detailAnnouncement, setDetailAnnouncement] = useState<PlanAnnouncement | null>(null);
  const [approvingAnnouncement, setApprovingAnnouncement] = useState<PlanAnnouncement | null>(null);
  const [publishingAnnouncement, setPublishingAnnouncement] = useState<PlanAnnouncement | null>(null);
  const [officialAnnouncementPlan, setOfficialAnnouncementPlan] = useState<PlanAnnouncement | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<PlanAnnouncement | null>(null);

  // Multi-select & Bulk Action State
  const [selectedPlanIds, setSelectedPlanIds] = useState<string[]>([]);
  const [bulkActionType, setBulkActionType] = useState<'approve' | 'publish' | null>(null);
  const [bulkActionNote, setBulkActionNote] = useState<string>('');

  // Approval form state (1 line note)
  const [approvalNote, setApprovalNote] = useState<string>('');

  // Calculate stats for 3 Simple States
  const stateCounts = useMemo(() => {
    let pendingApproval = 0;
    let approved = 0;
    let published = 0;

    announcements.forEach((ann) => {
      const state = getSimplePlanState(ann.status);
      if (state === 'pending_approval') pendingApproval++;
      else if (state === 'approved') approved++;
      else if (state === 'published') published++;
    });

    return {
      total: announcements.length,
      pendingApproval,
      approved,
      published
    };
  }, [announcements]);

  // Plan Type Distribution for Donut Chart
  const planTypeStats = useMemo(() => {
    const scopedList = announcements.filter((ann) => {
      if (selectedFiscalYear !== '2571-2575' && ann.year !== selectedFiscalYear) {
        return false;
      }
      return true;
    });

    let initial = 0;
    let additional = 0;
    let changed = 0;
    let amended = 0;

    scopedList.forEach((ann) => {
      const pt = ann.planType || '';
      if (isInitialPlanEdition(pt, ann.batchNumber) || pt.includes('ฉบับแรก')) {
        initial++;
      } else if (pt.includes('เพิ่มเติม') || pt.toLowerCase().includes('additional')) {
        additional++;
      } else if (pt.includes('เปลี่ยนแปลง') || pt.toLowerCase().includes('changed')) {
        changed++;
      } else if (pt.includes('แก้ไข') || pt.toLowerCase().includes('amended')) {
        amended++;
      } else {
        additional++;
      }
    });

    const total = scopedList.length;
    const initialPct = total > 0 ? Math.round((initial / total) * 100) : 0;
    const additionalPct = total > 0 ? Math.round((additional / total) * 100) : 0;
    const changedPct = total > 0 ? Math.round((changed / total) * 100) : 0;
    const amendedPct = total > 0 ? Math.max(0, 100 - initialPct - additionalPct - changedPct) : 0;

    return {
      initial,
      additional,
      changed,
      amended,
      total,
      initialPct,
      additionalPct,
      changedPct,
      amendedPct
    };
  }, [announcements, selectedFiscalYear]);

  // Urgent tasks: items pending approval or waiting for announcement
  const urgentItems = useMemo(() => {
    return announcements.filter((ann) => {
      const state = getSimplePlanState(ann.status);
      return state === 'pending_approval' || state === 'approved';
    });
  }, [announcements]);

  // Filtered announcements
  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((ann) => {
      // 1. Fiscal Year Filter
      if (selectedFiscalYear !== '2571-2575' && ann.year !== selectedFiscalYear) {
        return false;
      }

      // 2. Plan Type Filter
      if (selectedPlanTypeFilter !== 'all') {
        const pt = ann.planType || '';
        if (selectedPlanTypeFilter === 'initial' && !isInitialPlanEdition(pt, ann.batchNumber) && !pt.includes('ฉบับแรก')) {
          return false;
        }
        if (selectedPlanTypeFilter === 'additional' && !pt.includes('เพิ่มเติม') && !pt.toLowerCase().includes('additional')) {
          return false;
        }
        if (selectedPlanTypeFilter === 'changed' && !pt.includes('เปลี่ยนแปลง') && !pt.toLowerCase().includes('changed')) {
          return false;
        }
        if (selectedPlanTypeFilter === 'amended' && !pt.includes('แก้ไข') && !pt.toLowerCase().includes('amended')) {
          return false;
        }
      }

      // 3. 3-State Filter
      const state = getSimplePlanState(ann.status);
      if (activeStateFilter !== 'all' && state !== activeStateFilter) {
        return false;
      }

      // 4. Search Query Filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchTitle = (ann.planType || '').toLowerCase().includes(query);
        const matchCleanTitle = (getCleanPlanName(ann.planType) || '').toLowerCase().includes(query);
        const matchBatch = (resolveAnnouncementBatchDisplay(ann, announcements) || '').toLowerCase().includes(query) || (ann.batchNumber || '').toLowerCase().includes(query);
        const matchNo = (ann.announcementNo || '').toLowerCase().includes(query);
        const matchDept = (ann.department || '').toLowerCase().includes(query);
        const matchYear = (ann.year || '').toLowerCase().includes(query);
        if (!matchTitle && !matchCleanTitle && !matchBatch && !matchNo && !matchDept && !matchYear) {
          return false;
        }
      }

      return true;
    });
  }, [announcements, selectedFiscalYear, selectedPlanTypeFilter, activeStateFilter, searchQuery]);

  // Reset pagination when filter changes
  useEffect(() => {
    setCurrentPage(1);
    setSelectedPlanIds([]);
  }, [selectedFiscalYear, selectedPlanTypeFilter, activeStateFilter, searchQuery, pageSize]);

  // Pagination calculations
  const totalItems = filteredAnnouncements.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize + 1;
  const endIndex = Math.min(safePage * pageSize, totalItems);

  const paginatedAnnouncements = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredAnnouncements.slice(start, start + pageSize);
  }, [filteredAnnouncements, safePage, pageSize]);

  // Multi-select handlers
  const isAllPageSelected =
    paginatedAnnouncements.length > 0 &&
    paginatedAnnouncements.every((ann) => selectedPlanIds.includes(ann.id));

  const handleToggleSelect = (id: string) => {
    setSelectedPlanIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllPage = () => {
    if (isAllPageSelected) {
      const pageIds = paginatedAnnouncements.map((a) => a.id);
      setSelectedPlanIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      const pageIds = paginatedAnnouncements.map((a) => a.id);
      setSelectedPlanIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  // Helper to get projects belonging to an announcement
  const getAnnouncementProjects = (ann: PlanAnnouncement): ProjectData[] => {
    if (!ann || !ann.projectIds || ann.projectIds.length === 0) {
      // Fallback matching by edition
      const planTypeLower = (ann.planType || '').toLowerCase();
      let matchedEdition: 'first' | 'additional' | 'changed' | 'amended' = 'first';
      if (planTypeLower.includes('เพิ่มเติม') || planTypeLower.includes('additional')) {
        matchedEdition = 'additional';
      } else if (planTypeLower.includes('เปลี่ยนแปลง') || planTypeLower.includes('changed')) {
        matchedEdition = 'changed';
      } else if (planTypeLower.includes('แก้ไข') || planTypeLower.includes('amended')) {
        matchedEdition = 'amended';
      }
      return projects.filter((p) => p.edition === matchedEdition).slice(0, 5);
    }
    return projects.filter((p) => ann.projectIds.includes(p.id));
  };

  // Handle Confirm Approval (Item 3)
  const handleConfirmApproval = () => {
    if (!approvingAnnouncement) return;

    const fullTimestamp = getCurrentThaiDateTime();
    const updatedAnnouncement: PlanAnnouncement = {
      ...approvingAnnouncement,
      status: 'approved',
      lastActionDate: fullTimestamp.split(' ')[0],
      note: approvalNote.trim() ? approvalNote.trim() : approvingAnnouncement.note
    };

    onSaveAnnouncement(updatedAnnouncement);

    // If detail view is currently showing this announcement, update it
    if (detailAnnouncement && detailAnnouncement.id === approvingAnnouncement.id) {
      setDetailAnnouncement(updatedAnnouncement);
    }

    // Reset modal
    setApprovingAnnouncement(null);
    setApprovalNote('');
  };

  // Handle Confirm Publish (Item 4)
  const handleConfirmPublish = () => {
    if (!publishingAnnouncement) return;

    const fullTimestamp = getCurrentThaiDateTime();
    const updatedAnnouncement: PlanAnnouncement = {
      ...publishingAnnouncement,
      status: 'published',
      effectiveDate: fullTimestamp.split(' ')[0],
      lastActionDate: fullTimestamp.split(' ')[0]
    };

    onSaveAnnouncement(updatedAnnouncement);

    // If detail view is currently showing this announcement, update it
    if (detailAnnouncement && detailAnnouncement.id === publishingAnnouncement.id) {
      setDetailAnnouncement(updatedAnnouncement);
    }

    // Reset modal
    setPublishingAnnouncement(null);
  };

  // Handle Bulk Action (Approve, Publish)
  const handleConfirmBulkAction = () => {
    if (!bulkActionType || selectedPlanIds.length === 0) return;

    const fullTimestamp = getCurrentThaiDateTime();
    const selectedList = announcements.filter((a) => selectedPlanIds.includes(a.id));

    selectedList.forEach((ann) => {
      let nextStatus = ann.status;

      if (bulkActionType === 'approve') {
        nextStatus = 'approved';
      } else if (bulkActionType === 'publish') {
        nextStatus = 'published';
      }

      const updated: PlanAnnouncement = {
        ...ann,
        status: nextStatus,
        lastActionDate: fullTimestamp.split(' ')[0],
        effectiveDate: nextStatus === 'published' ? fullTimestamp.split(' ')[0] : ann.effectiveDate,
        note: bulkActionNote.trim() ? bulkActionNote.trim() : ann.note
      };

      onSaveAnnouncement(updated);
    });

    setSelectedPlanIds([]);
    setBulkActionType(null);
    setBulkActionNote('');
  };

  // Export to Excel (.xlsx)
  const handleExportExcel = () => {
    const headers = [
      'ลำดับ',
      'ประเภทแผน',
      'ชื่อแผนพัฒนาท้องถิ่น',
      'ครั้งที่/ปี',
      'จำนวนโครงการ',
      'งบประมาณรวม 5 ปี (บาท)',
      'สถานะ',
      'วันที่อนุมัติ',
      'วันที่มีผลบังคับใช้',
      'หน่วยงานรับผิดชอบ'
    ];

    const rows = filteredAnnouncements.map((ann, idx) => {
      const simpleState = getSimplePlanState(ann.status);
      const stateLabel =
        simpleState === 'published'
          ? 'ประกาศใช้แล้ว'
          : simpleState === 'approved'
          ? 'อนุมัติแล้ว'
          : 'รออนุมัติ';
      const projectCount = ann.projectIds ? ann.projectIds.length : 0;
      const planName = getCleanPlanName(ann.planType);
      const batchDisplay = resolveAnnouncementBatchDisplay(ann, announcements);
      const budget = ann.budgetTotal5Years || 0;

      return [
        idx + 1,
        ann.planType || '',
        planName,
        batchDisplay || '',
        projectCount,
        budget,
        stateLabel,
        ann.approvalDate || '',
        ann.effectiveDate || '',
        ann.department || ''
      ];
    });

    exportTableToExcel({
      filename: `ทะเบียนอนุมัติและประกาศใช้แผนพัฒนาท้องถิ่น_${selectedFiscalYear}`,
      title: 'ทะเบียนอนุมัติและประกาศใช้แผนพัฒนาท้องถิ่น เทศบาลเมืองศิลา',
      subTitle: `ปีงบประมาณ ${selectedFiscalYear} | รวม ${filteredAnnouncements.length} แผนงาน`,
      headers,
      rows
    });
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'ลำดับ',
      'ประเภทแผน',
      'ชื่อแผนพัฒนาท้องถิ่น',
      'ครั้งที่/ปี',
      'จำนวนโครงการ',
      'งบประมาณรวม_5ปี_บาท',
      'สถานะ',
      'วันที่อนุมัติ',
      'วันที่มีผลบังคับใช้',
      'หน่วยงานรับผิดชอบ'
    ];

    const rows = filteredAnnouncements.map((ann, idx) => {
      const simpleState = getSimplePlanState(ann.status);
      const stateLabel =
        simpleState === 'published'
          ? 'ประกาศใช้แล้ว'
          : simpleState === 'approved'
          ? 'อนุมัติแล้ว'
          : 'รออนุมัติ';
      const projectCount = ann.projectIds ? ann.projectIds.length : 0;
      const planName = getCleanPlanName(ann.planType);
      const batchDisplay = resolveAnnouncementBatchDisplay(ann, announcements);
      const budget = ann.budgetTotal5Years || 0;

      return [
        idx + 1,
        ann.planType || '',
        planName,
        batchDisplay || '',
        projectCount,
        budget,
        stateLabel,
        ann.approvalDate || '',
        ann.effectiveDate || '',
        ann.department || ''
      ];
    });

    exportTableToCSV({
      filename: `ทะเบียนอนุมัติและประกาศใช้แผนพัฒนาท้องถิ่น_${selectedFiscalYear}`,
      headers,
      rows
    });
  };

  // =========================================================================
  // VIEW: หน้ารายละเอียดแผน (Detail View - เมื่อกด [ดูรายละเอียด])
  // =========================================================================
  if (detailAnnouncement) {
    const planProjects = getAnnouncementProjects(detailAnnouncement);
    const planTypeBadge = getPlanTypeBadge(detailAnnouncement.planType);
    const simpleState = getSimplePlanState(detailAnnouncement.status);
    const isSpecialPlan =
      detailAnnouncement.planType.includes('เพิ่มเติม') ||
      detailAnnouncement.planType.includes('เปลี่ยนแปลง') ||
      detailAnnouncement.planType.includes('แก้ไข');

    // Calculate totals for 5 years
    const yearlyTotals = {
      '2571': planProjects.reduce((sum, p) => sum + (p.budgetByYear?.['2571'] || 0), 0),
      '2572': planProjects.reduce((sum, p) => sum + (p.budgetByYear?.['2572'] || 0), 0),
      '2573': planProjects.reduce((sum, p) => sum + (p.budgetByYear?.['2573'] || 0), 0),
      '2574': planProjects.reduce((sum, p) => sum + (p.budgetByYear?.['2574'] || 0), 0),
      '2575': planProjects.reduce((sum, p) => sum + (p.budgetByYear?.['2575'] || 0), 0)
    };
    const total5Years =
      yearlyTotals['2571'] +
      yearlyTotals['2572'] +
      yearlyTotals['2573'] +
      yearlyTotals['2574'] +
      yearlyTotals['2575'];

    return (
      <div className="flex-1 flex flex-col bg-[#f8fafc] h-full min-h-0 overflow-y-auto font-sans">
        <div className="p-4 sm:p-6 lg:p-7 max-w-[1720px] w-full mx-auto space-y-5">
          {/* Top Bar: Back & Print Buttons */}
          <div className="flex items-center justify-between gap-4 pb-2 border-b border-slate-200">
            <button
              type="button"
              onClick={() => setDetailAnnouncement(null)}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:border-slate-400 rounded-xl shadow-2xs transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-slate-600" />
              <span>ย้อนกลับ</span>
            </button>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Action button inside detail view based on state */}
              {simpleState === 'pending_approval' && (
                <button
                  type="button"
                  onClick={() => {
                    setApprovingAnnouncement(detailAnnouncement);
                    setApprovalNote('');
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>อนุมัติ</span>
                </button>
              )}

              {simpleState === 'approved' && (
                <button
                  type="button"
                  onClick={() => setPublishingAnnouncement(detailAnnouncement)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>ประกาศใช้</span>
                </button>
              )}

              {simpleState === 'published' && (
                <>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-50 text-sky-800 border border-sky-300 shadow-2xs">
                    <CheckCircle2 className="w-4 h-4 text-sky-600" />
                    <span>✅ ประกาศใช้แล้ว</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setOfficialAnnouncementPlan(detailAnnouncement)}
                    className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-bold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl shadow-2xs transition-colors cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span>หนังสือประกาศราชการ</span>
                  </button>
                </>
              )}

              {/* ปุ่มพิมพ์รายงาน (สีฟ้าพาสเทลขอบมน) */}
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold text-sky-800 bg-sky-50 border border-sky-300 hover:bg-sky-100 rounded-xl shadow-2xs transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4 text-sky-700" />
                <span>พิมพ์รายงาน</span>
              </button>
            </div>
          </div>

          {/* Card Summary: สรุปข้อมูลที่จำเป็น */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold border ${planTypeBadge.badgeClass}`}>
                    <planTypeBadge.Icon className={`w-3.5 h-3.5 ${planTypeBadge.iconClass}`} />
                    <span>{planTypeBadge.label}</span>
                  </span>
                  <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                    {resolveAnnouncementBatchDisplay(detailAnnouncement, announcements)}
                  </span>
                  {detailAnnouncement.announcementNo && (
                    <span className="text-xs text-slate-500 font-mono">
                      {detailAnnouncement.announcementNo}
                    </span>
                  )}
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-1.5 leading-snug">
                  {isInitialPlanEdition(detailAnnouncement.planType, detailAnnouncement.batchNumber)
                    ? getStandardPlanName(detailAnnouncement.planType)
                    : `${getStandardPlanName(detailAnnouncement.planType)} ${resolveAnnouncementBatchDisplay(detailAnnouncement, announcements)}`}
                </h2>
              </div>

              {/* Status Badge */}
              <div>
                {simpleState === 'published' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-800 border border-sky-300 shadow-2xs">
                    <CheckCircle2 className="w-4 h-4 text-sky-600" />
                    <span>✅ ประกาศใช้แล้ว</span>
                  </span>
                )}
                {simpleState === 'approved' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>อนุมัติแล้ว</span>
                  </span>
                )}
                {simpleState === 'pending_approval' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>รออนุมัติ</span>
                  </span>
                )}
              </div>
            </div>

            {/* Info Grid: ช่วงปีงบประมาณ, จำนวนโครงการ, งบประมาณรวม */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-3 border-t border-slate-100">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500 font-medium block">
                  ช่วงปีงบประมาณ
                </span>
                <span className="text-sm sm:text-base font-bold text-slate-900 mt-0.5 block">
                  พ.ศ. 2571 - 2575
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500 font-medium block">
                  จำนวนโครงการ
                </span>
                <span className="text-sm sm:text-base font-bold text-slate-900 mt-0.5 block">
                  {planProjects.length} โครงการ
                </span>
              </div>

              <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200">
                <span className="text-xs text-emerald-800 font-medium block">
                  งบประมาณรวม (บาท)
                </span>
                <span className="text-sm sm:text-base font-bold font-mono text-emerald-950 mt-0.5 block truncate">
                  {formatCleanNumber(total5Years > 0 ? total5Years : detailAnnouncement.budgetTotal5Years)}
                </span>
              </div>
            </div>

            {/* หากเป็นประเภทแผน "ฉบับเพิ่มเติม / เปลี่ยนแปลง / แก้ไข" ให้แสดงฟิลด์ "เหตุผลความจำเป็น" เพิ่มเติม */}
            {isSpecialPlan && (
              <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-xl text-xs sm:text-sm">
                <span className="font-bold text-amber-900 block mb-1">
                  เหตุผลความจำเป็น:
                </span>
                <p className="text-amber-800 leading-relaxed">
                  {detailAnnouncement.note ||
                    'เนื่องจากมีความจำเป็นเร่งด่วนในการแก้ไขปัญหาความเดือดร้อนของประชาชนในเขตเทศบาลเมืองศิลา และเพื่อปรับปรุงแผนงานโครงการให้สอดคล้องกับสภาพข้อเท็จจริงในพื้นที่'}
                </p>
              </div>
            )}
          </div>

          {/* ตารางโครงการในแผนครบถ้วนทุกมิติ */}
          {/* ลำดับ -> ชื่อโครงการ -> วัตถุประสงค์ -> เป้าหมาย (ผลผลิต) -> งบประมาณรายปี (5 คอลัมน์ย่อย) -> ตัวชี้วัด -> ผลที่คาดว่าจะได้รับ -> หน่วยงานรับผิดชอบ */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                รายการโครงการในแผนพัฒนาท้องถิ่น ({planProjects.length} โครงการ)
              </h3>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs border-collapse min-w-[1400px]">
                <thead className="bg-[#054e3b] text-white sticky top-0 z-10 font-semibold">
                  <tr className="border-b border-emerald-800">
                    <th rowSpan={2} className="py-3 px-2.5 text-center w-12 border-r border-emerald-800">
                      ลำดับ
                    </th>
                    <th rowSpan={2} className="py-3 px-3.5 min-w-[220px] border-r border-emerald-800">
                      ชื่อโครงการ
                    </th>
                    <th rowSpan={2} className="py-3 px-3 min-w-[180px] border-r border-emerald-800">
                      วัตถุประสงค์
                    </th>
                    <th rowSpan={2} className="py-3 px-3 min-w-[180px] border-r border-emerald-800">
                      เป้าหมาย (ผลผลิต)
                    </th>
                    <th colSpan={5} className="py-2 px-3 text-center border-r border-emerald-800 bg-[#073d2f]">
                      งบประมาณรายปี (บาท)
                    </th>
                    <th rowSpan={2} className="py-3 px-3 min-w-[160px] border-r border-emerald-800">
                      ตัวชี้วัด (KPI)
                    </th>
                    <th rowSpan={2} className="py-3 px-3 min-w-[180px] border-r border-emerald-800">
                      ผลที่คาดว่าจะได้รับ
                    </th>
                    <th rowSpan={2} className="py-3 px-3 text-center min-w-[140px]">
                      หน่วยงานรับผิดชอบ
                    </th>
                  </tr>
                  <tr className="bg-[#073d2f] text-emerald-100 text-[11.5px] border-b border-emerald-800">
                    <th className="py-1.5 px-2.5 text-right w-24 border-r border-emerald-800 font-mono">2571</th>
                    <th className="py-1.5 px-2.5 text-right w-24 border-r border-emerald-800 font-mono">2572</th>
                    <th className="py-1.5 px-2.5 text-right w-24 border-r border-emerald-800 font-mono">2573</th>
                    <th className="py-1.5 px-2.5 text-right w-24 border-r border-emerald-800 font-mono">2574</th>
                    <th className="py-1.5 px-2.5 text-right w-24 border-r border-emerald-800 font-mono">2575</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 bg-white">
                  {planProjects.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="text-center py-10 text-slate-400">
                        ไม่พบรายการโครงการในแผนนี้
                      </td>
                    </tr>
                  ) : (
                    planProjects.map((p, pIdx) => (
                      <tr key={p.id || pIdx} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-2.5 text-center font-mono text-slate-600 border-r border-slate-100">
                          {pIdx + 1}
                        </td>
                        <td className="py-3 px-3.5 font-bold text-slate-900 border-r border-slate-100 leading-snug">
                          {p.name}
                          {p.code && (
                            <span className="block font-mono text-[11px] text-slate-500 font-normal mt-0.5">
                              {p.code}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-700 border-r border-slate-100 leading-relaxed">
                          {p.objective || '-'}
                        </td>
                        <td className="py-3 px-3 text-slate-700 border-r border-slate-100 leading-relaxed">
                          {p.target || '-'}
                        </td>
                        {/* 5 Annual Budget Columns (Clean numbers without ฿) */}
                        <td className="py-3 px-2.5 text-right font-mono font-medium text-slate-900 border-r border-slate-100">
                          {formatCleanNumber(p.budgetByYear?.['2571'])}
                        </td>
                        <td className="py-3 px-2.5 text-right font-mono font-medium text-slate-900 border-r border-slate-100">
                          {formatCleanNumber(p.budgetByYear?.['2572'])}
                        </td>
                        <td className="py-3 px-2.5 text-right font-mono font-medium text-slate-900 border-r border-slate-100">
                          {formatCleanNumber(p.budgetByYear?.['2573'])}
                        </td>
                        <td className="py-3 px-2.5 text-right font-mono font-medium text-slate-900 border-r border-slate-100">
                          {formatCleanNumber(p.budgetByYear?.['2574'])}
                        </td>
                        <td className="py-3 px-2.5 text-right font-mono font-medium text-slate-900 border-r border-slate-100">
                          {formatCleanNumber(p.budgetByYear?.['2575'])}
                        </td>
                        <td className="py-3 px-3 text-slate-700 border-r border-slate-100 leading-relaxed">
                          {p.kpi || '-'}
                        </td>
                        <td className="py-3 px-3 text-slate-700 border-r border-slate-100 leading-relaxed">
                          {p.expectedResults || '-'}
                        </td>
                        <td className="py-3 px-3 text-center text-slate-800 font-medium">
                          {p.department}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>

                {/* Footer Total Row */}
                {planProjects.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                      <td colSpan={4} className="py-3 px-4 text-right border-r border-slate-200">
                        รวมงบประมาณทั้งสิ้น (บาท)
                      </td>
                      <td className="py-3 px-2.5 text-right font-mono border-r border-slate-200">
                        {formatCleanNumber(yearlyTotals['2571'])}
                      </td>
                      <td className="py-3 px-2.5 text-right font-mono border-r border-slate-200">
                        {formatCleanNumber(yearlyTotals['2572'])}
                      </td>
                      <td className="py-3 px-2.5 text-right font-mono border-r border-slate-200">
                        {formatCleanNumber(yearlyTotals['2573'])}
                      </td>
                      <td className="py-3 px-2.5 text-right font-mono border-r border-slate-200">
                        {formatCleanNumber(yearlyTotals['2574'])}
                      </td>
                      <td className="py-3 px-2.5 text-right font-mono border-r border-slate-200">
                        {formatCleanNumber(yearlyTotals['2575'])}
                      </td>
                      <td colSpan={3} className="py-3 px-3 text-center text-emerald-800 font-mono">
                        ยอดรวม 5 ปี: {formatCleanNumber(total5Years)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW: ตารางรายการหน้าหลัก (3 Simple States Layout)
  // =========================================================================
  return (
    <div className="flex-1 flex flex-col bg-[#f8fafc] h-full min-h-0 overflow-y-auto font-sans">
      <div className="p-4 sm:p-6 lg:p-7 max-w-[1720px] w-full mx-auto space-y-5 sm:space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-md shadow-sky-600/20 shrink-0">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>ระบบอนุมัติและประกาศใช้แผนพัฒนาท้องถิ่น</span>
                <span className="hidden sm:inline-flex text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                  Official Workflow
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                ขั้นตอนการพิจารณา ตรวจสอบ อนุมัติ และประกาศใช้แผนพัฒนาท้องถิ่น เทศบาลเมืองศิลา
              </p>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-center">
            {/* Year Selector */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-300 rounded-xl shadow-2xs">
              <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
              <select
                value={selectedFiscalYear}
                onChange={(e) => setSelectedFiscalYear(e.target.value)}
                className="bg-transparent text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none cursor-pointer pr-1"
              >
                <option value="2571-2575">ปีงบประมาณ 2571 - 2575</option>
                <option value="2571">ปีงบประมาณ 2571</option>
                <option value="2572">ปีงบประมาณ 2572</option>
                <option value="2573">ปีงบประมาณ 2573</option>
                <option value="2574">ปีงบประมาณ 2574</option>
                <option value="2575">ปีงบประมาณ 2575</option>
              </select>
            </div>

            {/* Export Excel button */}
            <button
              type="button"
              id="btn-export-announcement-excel"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 rounded-xl shadow-2xs transition-colors cursor-pointer"
              title="ส่งออกข้อมูลทะเบียนแผนเป็นไฟล์ Excel (.xlsx) ทันที"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>ส่งออก Excel</span>
            </button>

            {/* Export CSV button */}
            <button
              type="button"
              id="btn-export-announcement-csv"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl shadow-2xs transition-colors cursor-pointer"
              title="ส่งออกข้อมูลทะเบียนแผนเป็นไฟล์ CSV (UTF-8)"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>ส่งออก CSV</span>
            </button>

            {/* Print Report button */}
            <button
              type="button"
              id="btn-print-announcement-table"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-sky-800 bg-sky-50 border border-sky-300 hover:bg-sky-100 rounded-xl shadow-2xs transition-colors cursor-pointer"
              title="สั่งพิมพ์รายงานทางเครื่องพิมพ์ หรือบันทึกเป็น PDF"
            >
              <Printer className="w-3.5 h-3.5 text-sky-700" />
              <span>พิมพ์รายงาน</span>
            </button>
          </div>
        </div>

        {/* 1. ด้านบนสุด: การ์ดสถิติ 3 สถานะหลัก + กราฟ Donut Chart สรุปประเภทแผนแบบแนวนอน */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 w-full">
          {/* การ์ดสถิติ 3 สถานะหลัก (🟡 รออนุมัติ | 🟢 อนุมัติแล้ว | 🔵 ประกาศใช้แล้ว) */}
          <div className="xl:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Card 1: 🟡 รออนุมัติ */}
            <div
              onClick={() =>
                setActiveStateFilter(activeStateFilter === 'pending_approval' ? 'all' : 'pending_approval')
              }
              className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs flex flex-col justify-between ${
                activeStateFilter === 'pending_approval'
                  ? 'bg-amber-100/90 border-amber-400 ring-2 ring-amber-300'
                  : 'bg-amber-50/50 border-amber-200 hover:border-amber-300 hover:bg-amber-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900">🟡 รออนุมัติ</span>
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black font-mono text-amber-950 leading-none">
                    {stateCounts.pendingApproval}
                  </span>
                  <span className="text-xs font-semibold text-amber-700">ฉบับ</span>
                </div>
                <span className="text-[11px] text-amber-700/80 font-medium">รอผู้บริหารพิจารณา</span>
              </div>
            </div>

            {/* Card 2: 🟢 อนุมัติแล้ว */}
            <div
              onClick={() =>
                setActiveStateFilter(activeStateFilter === 'approved' ? 'all' : 'approved')
              }
              className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs flex flex-col justify-between ${
                activeStateFilter === 'approved'
                  ? 'bg-emerald-100/90 border-emerald-400 ring-2 ring-emerald-300'
                  : 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900">🟢 อนุมัติแล้ว</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-950 leading-none">
                    {stateCounts.approved}
                  </span>
                  <span className="text-xs font-semibold text-emerald-700">ฉบับ</span>
                </div>
                <span className="text-[11px] text-emerald-700/80 font-medium">รอจัดทำประกาศ</span>
              </div>
            </div>

            {/* Card 3: 🔵 ประกาศใช้แล้ว */}
            <div
              onClick={() =>
                setActiveStateFilter(activeStateFilter === 'published' ? 'all' : 'published')
              }
              className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs flex flex-col justify-between ${
                activeStateFilter === 'published'
                  ? 'bg-sky-100/90 border-sky-400 ring-2 ring-sky-300'
                  : 'bg-sky-50/50 border-sky-200 hover:border-sky-300 hover:bg-sky-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-900">🔵 ประกาศใช้แล้ว</span>
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 border border-sky-200">
                  <Check className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black font-mono text-sky-950 leading-none">
                    {stateCounts.published}
                  </span>
                  <span className="text-xs font-semibold text-sky-700">ฉบับ</span>
                </div>
                <span className="text-[11px] text-sky-700/80 font-medium">มีผลบังคับใช้สมบูรณ์</span>
              </div>
            </div>
          </div>

          {/* กราฟ Donut Chart สรุปประเภทแผนแบบแนวนอน */}
          <div className="xl:col-span-5 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-emerald-700" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-800">
                  สัดส่วนประเภทแผนพัฒนาท้องถิ่น
                </h3>
              </div>
              <span className="text-[11px] font-mono font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                พ.ศ. 2571 - 2575
              </span>
            </div>

            <div className="flex flex-row items-center justify-between gap-4">
              {/* SVG Donut Chart with Center Total */}
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="36"
                    stroke="#f1f5f9"
                    strokeWidth="12"
                    fill="none"
                  />
                  {planTypeStats.total > 0 && (() => {
                    const c = 2 * Math.PI * 36;
                    const s1 = (planTypeStats.initial / planTypeStats.total) * c;
                    const s2 = (planTypeStats.additional / planTypeStats.total) * c;
                    const s3 = (planTypeStats.changed / planTypeStats.total) * c;
                    const s4 = (planTypeStats.amended / planTypeStats.total) * c;

                    return (
                      <>
                        {s1 > 0 && (
                          <circle
                            cx="50"
                            cy="50"
                            r="36"
                            stroke="#0d9488"
                            strokeWidth="12"
                            fill="none"
                            strokeDasharray={`${s1} ${c - s1}`}
                            strokeDashoffset={-0}
                            className="transition-all duration-500"
                          />
                        )}
                        {s2 > 0 && (
                          <circle
                            cx="50"
                            cy="50"
                            r="36"
                            stroke="#10b981"
                            strokeWidth="12"
                            fill="none"
                            strokeDasharray={`${s2} ${c - s2}`}
                            strokeDashoffset={-s1}
                            className="transition-all duration-500"
                          />
                        )}
                        {s3 > 0 && (
                          <circle
                            cx="50"
                            cy="50"
                            r="36"
                            stroke="#f59e0b"
                            strokeWidth="12"
                            fill="none"
                            strokeDasharray={`${s3} ${c - s3}`}
                            strokeDashoffset={-(s1 + s2)}
                            className="transition-all duration-500"
                          />
                        )}
                        {s4 > 0 && (
                          <circle
                            cx="50"
                            cy="50"
                            r="36"
                            stroke="#0284c7"
                            strokeWidth="12"
                            fill="none"
                            strokeDasharray={`${s4} ${c - s4}`}
                            strokeDashoffset={-(s1 + s2 + s3)}
                            className="transition-all duration-500"
                          />
                        )}
                      </>
                    );
                  })()}
                </svg>
                {/* Center Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-base sm:text-lg font-black font-mono text-slate-900 leading-none">
                    {planTypeStats.total}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500 mt-0.5">ฉบับ</span>
                </div>
              </div>

              {/* Horizontal / Compact Grid Legend with filter toggle */}
              <div className="grid grid-cols-2 gap-x-2.5 gap-y-1.5 flex-1 text-xs">
                {/* ฉบับแรก */}
                <button
                  type="button"
                  onClick={() =>
                    setSelectedPlanTypeFilter(selectedPlanTypeFilter === 'initial' ? 'all' : 'initial')
                  }
                  className={`flex items-center justify-between p-1.5 rounded-lg border text-left transition-colors cursor-pointer ${
                    selectedPlanTypeFilter === 'initial'
                      ? 'bg-teal-50 border-teal-300 ring-1 ring-teal-300'
                      : 'border-slate-100 hover:bg-slate-50'
                  }`}
                  title="กรองเฉพาะแผนฉบับแรก"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0d9488] shrink-0" />
                    <span className="font-semibold text-slate-700 truncate">ฉบับแรก</span>
                  </div>
                  <div className="text-right shrink-0 font-mono text-slate-800">
                    <span className="font-bold">{planTypeStats.initial}</span>
                    <span className="text-[10px] text-slate-400 ml-1">({planTypeStats.initialPct}%)</span>
                  </div>
                </button>

                {/* เพิ่มเติม */}
                <button
                  type="button"
                  onClick={() =>
                    setSelectedPlanTypeFilter(selectedPlanTypeFilter === 'additional' ? 'all' : 'additional')
                  }
                  className={`flex items-center justify-between p-1.5 rounded-lg border text-left transition-colors cursor-pointer ${
                    selectedPlanTypeFilter === 'additional'
                      ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-300'
                      : 'border-slate-100 hover:bg-slate-50'
                  }`}
                  title="กรองเฉพาะแผนเพิ่มเติม"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] shrink-0" />
                    <span className="font-semibold text-slate-700 truncate">เพิ่มเติม</span>
                  </div>
                  <div className="text-right shrink-0 font-mono text-slate-800">
                    <span className="font-bold">{planTypeStats.additional}</span>
                    <span className="text-[10px] text-slate-400 ml-1">({planTypeStats.additionalPct}%)</span>
                  </div>
                </button>

                {/* เปลี่ยนแปลง */}
                <button
                  type="button"
                  onClick={() =>
                    setSelectedPlanTypeFilter(selectedPlanTypeFilter === 'changed' ? 'all' : 'changed')
                  }
                  className={`flex items-center justify-between p-1.5 rounded-lg border text-left transition-colors cursor-pointer ${
                    selectedPlanTypeFilter === 'changed'
                      ? 'bg-amber-50 border-amber-300 ring-1 ring-amber-300'
                      : 'border-slate-100 hover:bg-slate-50'
                  }`}
                  title="กรองเฉพาะแผนเปลี่ยนแปลง"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] shrink-0" />
                    <span className="font-semibold text-slate-700 truncate">เปลี่ยนแปลง</span>
                  </div>
                  <div className="text-right shrink-0 font-mono text-slate-800">
                    <span className="font-bold">{planTypeStats.changed}</span>
                    <span className="text-[10px] text-slate-400 ml-1">({planTypeStats.changedPct}%)</span>
                  </div>
                </button>

                {/* แก้ไข */}
                <button
                  type="button"
                  onClick={() =>
                    setSelectedPlanTypeFilter(selectedPlanTypeFilter === 'amended' ? 'all' : 'amended')
                  }
                  className={`flex items-center justify-between p-1.5 rounded-lg border text-left transition-colors cursor-pointer ${
                    selectedPlanTypeFilter === 'amended'
                      ? 'bg-sky-50 border-sky-300 ring-1 ring-sky-300'
                      : 'border-slate-100 hover:bg-slate-50'
                  }`}
                  title="กรองเฉพาะแผนแก้ไข"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7] shrink-0" />
                    <span className="font-semibold text-slate-700 truncate">แก้ไข</span>
                  </div>
                  <div className="text-right shrink-0 font-mono text-slate-800">
                    <span className="font-bold">{planTypeStats.amended}</span>
                    <span className="text-[10px] text-slate-400 ml-1">({planTypeStats.amendedPct}%)</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 2. ใต้การ์ดสถิติ: แถบ "รายการที่ต้องดำเนินการวันนี้" วางแนวนอนสไตล์รูปที่ 1 */}
        {urgentItems.length > 0 ? (
          <div className="bg-linear-to-r from-amber-500/10 via-amber-500/5 to-emerald-500/10 border border-amber-200/90 rounded-2xl p-3.5 sm:p-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>รายการที่ต้องดำเนินการวันนี้</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-200 text-amber-900 font-mono">
                      {urgentItems.length} ฉบับ
                    </span>
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-600">
                    แผนพัฒนาท้องถิ่นที่อยู่ระหว่างรอการอนุมัติหรือรอประกาศใช้อย่างเป็นทางการ
                  </p>
                </div>
              </div>

              <div className="text-[11px] font-medium text-slate-500 hidden sm:block">
                เลื่อนแนวนอนเพื่อดูรายการทั้งหมด →
              </div>
            </div>

            {/* Horizontal Scroll Track */}
            <div className="flex items-center gap-3 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin">
              {urgentItems.map((item) => {
                const s = getSimplePlanState(item.status);
                const isPending = s === 'pending_approval';
                const batchDisplay = resolveAnnouncementBatchDisplay(item, announcements);

                return (
                  <div
                    key={item.id}
                    className="min-w-[280px] max-w-[320px] bg-white/95 hover:bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-3 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between gap-2.5 shrink-0"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                        {batchDisplay}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap ${
                          isPending
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {isPending ? '🟡 รออนุมัติ' : '🟢 รอประกาศใช้'}
                      </span>
                    </div>

                    <div>
                      <div
                        className="font-bold text-xs text-slate-900 leading-snug line-clamp-1"
                        title={getCleanPlanName(item.planType)}
                      >
                        {getCleanPlanName(item.planType)}
                      </div>
                      <div className="text-[11px] font-mono text-emerald-700 font-bold mt-0.5">
                        {formatCleanNumber(item.budgetTotal5Years)} บาท
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setDetailAnnouncement(item)}
                        className="text-sky-600 hover:text-sky-800 font-semibold text-[11px] cursor-pointer"
                      >
                        ดูรายละเอียด
                      </button>

                      {isPending ? (
                        <button
                          type="button"
                          onClick={() => {
                            setApprovingAnnouncement(item);
                            setApprovalNote('');
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>อนุมัติ</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setPublishingAnnouncement(item)}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>ประกาศใช้</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs sm:text-sm text-emerald-900">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="font-semibold">
                รายการที่ต้องดำเนินการวันนี้: ไม่มีรายการค้างดำเนินการ ทุกแผนพัฒนาท้องถิ่นได้รับการอนุมัติและประกาศใช้เรียบร้อยแล้ว
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-300 shrink-0">
              0 รายการค้าง
            </span>
          </div>
        )}

        {/* 3. ตารางหลักตรงกลางกว้าง สบายตา พร้อมแถบตัวกรองค้นหาครบวงจร */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden w-full">
          {/* แถบตัวกรองค้นหาด้านบนตาราง (ค้นหาชื่อแผน / ประเภทแผน / ครั้งที่ / ปี พ.ศ. / สถานะ) */}
          <div className="p-4 sm:p-5 border-b border-slate-200 bg-white space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center shadow-xs">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                    ตารางรายการแผนพัฒนาท้องถิ่น
                  </h3>
                  <p className="text-xs text-slate-500">
                    แสดงรายการทั้งหมด {filteredAnnouncements.length} ฉบับ
                    {activeStateFilter !== 'all' && (
                      <span className="ml-1.5 text-sky-600 font-semibold">
                        (กรองเฉพาะ:{' '}
                        {activeStateFilter === 'pending_approval'
                          ? 'รออนุมัติ'
                          : activeStateFilter === 'approved'
                          ? 'อนุมัติแล้ว'
                          : 'ประกาศใช้แล้ว'}
                        )
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {(searchQuery || selectedPlanTypeFilter !== 'all' || selectedFiscalYear !== '2571-2575' || activeStateFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedPlanTypeFilter('all');
                    setSelectedFiscalYear('2571-2575');
                    setActiveStateFilter('all');
                  }}
                  className="self-start sm:self-auto text-xs font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                >
                  ล้างตัวกรองทั้งหมด
                </button>
              )}
            </div>

            {/* Filter Controls Row: Search Input, Plan Type, Fiscal Year, Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 items-center">
              {/* 1. ค้นหาชื่อแผน / ครั้งที่ / ประกาศ (lg:col-span-5) */}
              <div className="lg:col-span-5 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาชื่อแผน / ครั้งที่ / เลขที่ประกาศ / หน่วยงาน..."
                  className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 shadow-2xs font-medium"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    title="ล้างคำค้นหา"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* 2. ประเภทแผน (lg:col-span-3) */}
              <div className="lg:col-span-3">
                <select
                  value={selectedPlanTypeFilter}
                  onChange={(e) => setSelectedPlanTypeFilter(e.target.value)}
                  className="w-full py-2 px-3 text-xs sm:text-sm border border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer font-medium shadow-2xs"
                >
                  <option value="all">ประเภทแผนทั้งหมด</option>
                  <option value="initial">ฉบับแรก</option>
                  <option value="additional">เพิ่มเติม</option>
                  <option value="changed">เปลี่ยนแปลง</option>
                  <option value="amended">แก้ไข</option>
                </select>
              </div>

              {/* 3. ปี พ.ศ. (lg:col-span-2) */}
              <div className="lg:col-span-2">
                <select
                  value={selectedFiscalYear}
                  onChange={(e) => setSelectedFiscalYear(e.target.value)}
                  className="w-full py-2 px-3 text-xs sm:text-sm border border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer font-medium shadow-2xs"
                >
                  <option value="2571-2575">ทุกปี (2571 - 2575)</option>
                  <option value="2571">ปี พ.ศ. 2571</option>
                  <option value="2572">ปี พ.ศ. 2572</option>
                  <option value="2573">ปี พ.ศ. 2573</option>
                  <option value="2574">ปี พ.ศ. 2574</option>
                  <option value="2575">ปี พ.ศ. 2575</option>
                </select>
              </div>

              {/* 4. สถานะ (lg:col-span-2) */}
              <div className="lg:col-span-2">
                <select
                  value={activeStateFilter}
                  onChange={(e) => setActiveStateFilter(e.target.value as any)}
                  className="w-full py-2 px-3 text-xs sm:text-sm border border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer font-medium shadow-2xs"
                >
                  <option value="all">สถานะทั้งหมด</option>
                  <option value="pending_approval">🟡 รออนุมัติ</option>
                  <option value="approved">🟢 อนุมัติแล้ว</option>
                  <option value="published">🔵 ประกาศใช้แล้ว</option>
                </select>
              </div>
            </div>
          </div>

          {/* ตารางหลัก: ลำดับคอลัมน์
              0. Checkbox [ ] หน้าตารางทุกแถว
              1. ลำดับ
              2. ประเภทแผน
              3. ชื่อแผนพัฒนาท้องถิ่น
              4. ครั้งที่ / ปี พ.ศ. (ฉบับแรก/2571, ครั้งที่ 2/2571, รีเซ็ตเป็น ครั้งที่ 1/2572)
              5. จำนวนโครงการ
              6. งบประมาณรวม (บาท)
              7. สถานะ
              8. จัดการ */}
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[1100px]">
              <thead className="bg-[#054e3b] text-white sticky top-0 z-10 font-semibold border-b border-emerald-800">
                <tr>
                  {/* 0. เช็คบ็อกซ์เลือกทั้งหมด */}
                  <th className="py-3.5 px-3 text-center w-12 border-r border-emerald-800/40">
                    <input
                      type="checkbox"
                      checked={isAllPageSelected}
                      onChange={handleSelectAllPage}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-500"
                      title="เลือกทั้งหมดในหน้านี้"
                    />
                  </th>
                  {/* 1. ลำดับ */}
                  <th className="py-3.5 px-2.5 text-center w-12 border-r border-emerald-800/40">
                    ลำดับ
                  </th>
                  {/* 2. ประเภทแผน */}
                  <th className="py-3.5 px-3.5 text-center min-w-[130px] border-r border-emerald-800/40">
                    ประเภทแผน
                  </th>
                  {/* 3. ชื่อแผนพัฒนาท้องถิ่น */}
                  <th className="py-3.5 px-4 min-w-[270px] border-r border-emerald-800/40">
                    ชื่อแผนพัฒนาท้องถิ่น
                  </th>
                  {/* 4. ครั้งที่ / ปี พ.ศ. */}
                  <th className="py-3.5 px-3.5 text-center w-36 border-r border-emerald-800/40">
                    ครั้งที่ / ปี พ.ศ.
                  </th>
                  {/* 5. จำนวนโครงการ */}
                  <th className="py-3.5 px-3.5 text-center w-28 border-r border-emerald-800/40">
                    จำนวนโครงการ
                  </th>
                  {/* 6. งบประมาณรวม (บาท) */}
                  <th className="py-3.5 px-4 text-right min-w-[140px] border-r border-emerald-800/40">
                    งบประมาณรวม (บาท)
                  </th>
                  {/* 7. สถานะ */}
                  <th className="py-3.5 px-3.5 text-center w-36 border-r border-emerald-800/40">
                    สถานะ
                  </th>
                  {/* 8. จัดการ */}
                  <th className="py-3.5 px-4 text-center min-w-[200px]">
                    จัดการ
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {paginatedAnnouncements.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-slate-400 bg-white">
                      <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-base font-semibold text-slate-700">
                        ไม่พบรายการแผนพัฒนาท้องถิ่นตามเงื่อนไขที่เลือก
                      </p>
                      <button
                        onClick={() => {
                          setActiveStateFilter('all');
                          setSelectedPlanTypeFilter('all');
                          setSelectedFiscalYear('2571-2575');
                          setSearchQuery('');
                        }}
                        className="mt-2 text-xs text-sky-600 hover:underline font-semibold cursor-pointer"
                      >
                        ล้างตัวกรองทั้งหมด
                      </button>
                    </td>
                  </tr>
                ) : (
                  paginatedAnnouncements.map((ann, idx) => {
                    const rowNumber = (safePage - 1) * pageSize + idx + 1;
                    const simpleState = getSimplePlanState(ann.status);
                    const planBadge = getPlanTypeBadge(ann.planType);
                    const projectCount = ann.projectIds ? ann.projectIds.length : 0;
                    const isSelected = selectedPlanIds.includes(ann.id);

                    return (
                      <tr
                        key={ann.id || idx}
                        className={`transition-colors group ${
                          isSelected ? 'bg-sky-50/70 hover:bg-sky-50' : 'hover:bg-slate-50'
                        }`}
                      >
                        {/* 0. Checkbox [ ] หน้าตารางทุกแถว */}
                        <td className="py-3.5 px-3 text-center border-r border-slate-100">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(ann.id)}
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                          />
                        </td>

                        {/* 1. ลำดับ */}
                        <td className="py-3.5 px-2.5 text-center font-mono font-medium text-slate-600 border-r border-slate-100">
                          {rowNumber}
                        </td>

                        {/* 2. ประเภทแผน */}
                        <td className="py-3.5 px-3.5 text-center border-r border-slate-100 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold border ${planBadge.badgeClass}`}
                          >
                            <planBadge.Icon className={`w-3.5 h-3.5 ${planBadge.iconClass}`} />
                            <span>{planBadge.label}</span>
                          </span>
                        </td>

                        {/* 3. ชื่อแผนพัฒนาท้องถิ่น */}
                        <td className="py-3.5 px-4 border-r border-slate-100">
                          <div className="font-bold text-slate-900 leading-snug">
                            {getCleanPlanName(ann.planType)}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                            {ann.announcementNo && (
                              <span className="font-mono">{ann.announcementNo}</span>
                            )}
                            {ann.department && (
                              <>
                                <span>•</span>
                                <span>{ann.department}</span>
                              </>
                            )}
                          </div>
                        </td>

                        {/* 4. ครั้งที่ / ปี พ.ศ. (ฉบับแรกแสดง "ฉบับแรก/2571", ลำดับถัดไปแสดง "ครั้งที่ 2/2571", ขึ้นปีใหม่ Reset เป็น "ครั้งที่ 1/2572") */}
                        <td className="py-3.5 px-3.5 text-center border-r border-slate-100 whitespace-nowrap">
                          <div className="font-mono font-bold text-slate-800">
                            {resolveAnnouncementBatchDisplay(ann, announcements)}
                          </div>
                        </td>

                        {/* 5. จำนวนโครงการ */}
                        <td className="py-3.5 px-3.5 text-center border-r border-slate-100 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            {projectCount} โครงการ
                          </span>
                        </td>

                        {/* 6. งบประมาณรวม (บาท) */}
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 border-r border-slate-100 whitespace-nowrap">
                          {formatCleanNumber(ann.budgetTotal5Years)}
                        </td>

                        {/* 7. สถานะ (🟡 รออนุมัติ | 🟢 อนุมัติแล้ว | 🔵 ประกาศใช้แล้ว) */}
                        <td className="py-3.5 px-3.5 text-center border-r border-slate-100 whitespace-nowrap">
                          {simpleState === 'published' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-800 border border-sky-300 shadow-2xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
                              <span>✅ ประกาศใช้แล้ว</span>
                            </span>
                          )}
                          {simpleState === 'approved' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>อนุมัติแล้ว</span>
                            </span>
                          )}
                          {simpleState === 'pending_approval' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>รออนุมัติ</span>
                            </span>
                          )}
                        </td>

                        {/* 8. จัดการ: รออนุมัติ -> [อนุมัติ], อนุมัติแล้ว -> [ประกาศใช้], ตัดปุ่มยกเลิกและส่งกลับออก */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            {/* ปุ่ม ดูรายละเอียด */}
                            <button
                              type="button"
                              onClick={() => setDetailAnnouncement(ann)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 shadow-2xs transition-colors cursor-pointer"
                              title="ดูรายละเอียดแผนพัฒนาท้องถิ่น"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>ดูรายละเอียด</span>
                            </button>

                            {/* 🟡 รออนุมัติ: มีปุ่ม [อนุมัติ] (ตัดปุ่มยกเลิกและส่งกลับออก) */}
                            {simpleState === 'pending_approval' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setApprovingAnnouncement(ann);
                                  setApprovalNote('');
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-colors cursor-pointer"
                                title="อนุมัติแผนพัฒนาท้องถิ่น"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>อนุมัติ</span>
                              </button>
                            )}

                            {/* 🟢 อนุมัติแล้ว: มีปุ่ม [ประกาศใช้] (ตัดปุ่มยกเลิกและส่งกลับออก) */}
                            {simpleState === 'approved' && (
                              <button
                                type="button"
                                onClick={() => setPublishingAnnouncement(ann)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-2xs transition-colors cursor-pointer"
                                title="ประกาศใช้แผนพัฒนาท้องถิ่น"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>ประกาศใช้</span>
                              </button>
                            )}

                            {/* 🔵 ประกาศใช้แล้ว: แสดงปุ่ม [หนังสือประกาศ] */}
                            {simpleState === 'published' && (
                              <button
                                type="button"
                                onClick={() => setOfficialAnnouncementPlan(ann)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 shadow-2xs transition-colors cursor-pointer"
                                title="พิมพ์หนังสือประกาศเทศบาลเมืองศิลา (ตราครุฑ)"
                              >
                                <Printer className="w-3.5 h-3.5 text-indigo-600" />
                                <span>หนังสือประกาศ</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* แถบ Action Bar ด้านล่างตาราง: [อนุมัติรายการที่เลือก] และ [ประกาศใช้รายการที่เลือก] (ตัดปุ่มยกเลิกและส่งกลับออก) */}
          {selectedPlanIds.length > 0 && (
            <div className="sticky bottom-3 z-30 mx-4 my-2 bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-3 shadow-xl border border-slate-700 flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs sm:text-sm font-bold">
                  เลือกแล้ว <span className="font-mono text-emerald-400 font-bold">{selectedPlanIds.length}</span> ฉบับ
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setBulkActionType('approve')}
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>อนุมัติรายการที่เลือก</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBulkActionType('publish')}
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>ประกาศใช้รายการที่เลือก</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPlanIds([])}
                  className="text-xs text-slate-300 hover:text-white px-2 py-1 underline cursor-pointer"
                >
                  ล้างการเลือก
                </button>
              </div>
            </div>
          )}

          {/* Pagination Bar */}
          <div className="px-4 sm:px-5 py-2.5 border-t border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm text-slate-600">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-slate-600">แสดงหน้าละ:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border border-slate-300 rounded-lg px-2.5 py-1 text-xs bg-white text-slate-700 cursor-pointer font-medium focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value={10}>10 รายการ</option>
                  <option value={20}>20 รายการ</option>
                  <option value={50}>50 รายการ</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="font-medium text-slate-600">หน้าที่:</span>
                <span className="font-mono font-bold text-slate-800">
                  {safePage} / {totalPages}
                </span>
              </div>
            </div>

            <div className="text-slate-600 font-medium text-xs">
              แสดง {startIndex} ถึง {endIndex} จากทั้งหมด {totalItems} รายการ
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage(1)}
                className="p-1.5 border border-slate-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
                title="หน้าแรก"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 border border-slate-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
                title="ก่อนหน้า"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 border border-slate-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
                title="ถัดไป"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage(totalPages)}
                className="p-1.5 border border-slate-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
                title="หน้าสุดท้าย"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. ป๊อปอัปอนุมัติแผน (Approval Modal - เมื่อกด [อนุมัติ]) */}
      {/* ========================================================================= */}
      {approvingAnnouncement && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 my-auto">
            {/* Header */}
            <div className="px-5 py-4 bg-linear-to-r from-[#054e3b] to-[#046c4e] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                <h3 className="font-bold text-base sm:text-lg">อนุมัติแผนพัฒนาท้องถิ่น</h3>
              </div>
              <button
                type="button"
                onClick={() => setApprovingAnnouncement(null)}
                className="text-emerald-100 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-5 sm:p-6 space-y-4 text-xs sm:text-sm">
              {/* สรุปข้อมูลสั้นๆ: ชื่อแผน, จำนวนโครงการ, งบประมาณรวม */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <div>
                  <span className="text-slate-500 text-xs font-semibold block">ชื่อแผนพัฒนาท้องถิ่น:</span>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">
                    {isInitialPlanEdition(approvingAnnouncement.planType, approvingAnnouncement.batchNumber)
                      ? getStandardPlanName(approvingAnnouncement.planType)
                      : `${getStandardPlanName(approvingAnnouncement.planType)} ${resolveAnnouncementBatchDisplay(approvingAnnouncement, announcements)}`}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-500 font-medium">จำนวนโครงการ:</span>
                    <div className="font-bold text-slate-800 mt-0.5">
                      {approvingAnnouncement.projectIds?.length || 0} โครงการ
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">งบประมาณรวม (บาท):</span>
                    <div className="font-bold font-mono text-emerald-800 text-sm mt-0.5">
                      {formatCleanNumber(approvingAnnouncement.budgetTotal5Years)}
                    </div>
                  </div>
                </div>
              </div>

              {/* ช่องกรอกข้อมูลสั้น: "หมายเหตุการอนุมัติ" (Text field 1 บรรทัด - ระบุว่าไม่บังคับกรอก) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  หมายเหตุการอนุมัติ <span className="text-slate-400 font-normal">(ไม่บังคับกรอก)</span>
                </label>
                <input
                  type="text"
                  value={approvalNote}
                  onChange={(e) => setApprovalNote(e.target.value)}
                  placeholder="ระบุหมายเหตุหรือข้อความประกอบการอนุมัติ (ไม่บังคับกรอก)..."
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* ปุ่มดำเนินการ 2 ปุ่ม: [ยกเลิก] และ [✓ ยืนยันอนุมัติ] */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setApprovingAnnouncement(null)}
                  className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleConfirmApproval}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs sm:text-sm font-bold text-white bg-linear-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>ยืนยันอนุมัติ</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. ป๊อปอัปประกาศใช้แผน (Publish Modal - เมื่อกด [ประกาศใช้]) */}
      {/* ========================================================================= */}
      {publishingAnnouncement && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 my-auto">
            {/* Header */}
            <div className="px-5 py-4 bg-linear-to-r from-sky-700 to-blue-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Send className="w-5 h-5 text-sky-200" />
                <h3 className="font-bold text-base sm:text-lg">ยืนยันการประกาศใช้แผนพัฒนาท้องถิ่น</h3>
              </div>
              <button
                type="button"
                onClick={() => setPublishingAnnouncement(null)}
                className="text-sky-100 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-5 sm:p-6 space-y-4 text-xs sm:text-sm">
              <p className="text-slate-700 leading-relaxed">
                คุณต้องการยืนยันการประกาศใช้แผนพัฒนาท้องถิ่นนี้เพื่อบังคับใช้ในเขตเทศบาลเมืองศิลาอย่างเป็นทางการใช่หรือไม่?
              </p>

              <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-xl space-y-1.5">
                <span className="text-[11px] font-bold text-sky-900 block">แผนพัฒนาท้องถิ่น:</span>
                <div className="font-bold text-slate-900 text-sm">
                  {isInitialPlanEdition(publishingAnnouncement.planType, publishingAnnouncement.batchNumber)
                    ? getStandardPlanName(publishingAnnouncement.planType)
                    : `${getStandardPlanName(publishingAnnouncement.planType)} ${resolveAnnouncementBatchDisplay(publishingAnnouncement, announcements)}`}
                </div>
                <div className="text-xs text-slate-600 font-mono">
                  งบประมาณรวม: {formatCleanNumber(publishingAnnouncement.budgetTotal5Years)} บาท
                </div>
              </div>

              {/* ปุ่มดำเนินการ 2 ปุ่ม: [ยกเลิก] และ [ประกาศใช้] */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setPublishingAnnouncement(null)}
                  className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPublish}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs sm:text-sm font-bold text-white bg-linear-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>ประกาศใช้</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. ป๊อปอัปดำเนินการหลายรายการพร้อมกัน (Bulk Action Modal) */}
      {/* ========================================================================= */}
      {bulkActionType && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 my-auto">
            <div
              className={`px-5 py-4 text-white flex items-center justify-between ${
                bulkActionType === 'approve'
                  ? 'bg-linear-to-r from-emerald-600 to-teal-700'
                  : 'bg-linear-to-r from-sky-600 to-blue-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {bulkActionType === 'approve' && <Check className="w-5 h-5 text-emerald-200" />}
                {bulkActionType === 'publish' && <Send className="w-5 h-5 text-sky-200" />}
                <h3 className="font-bold text-base sm:text-lg">
                  {bulkActionType === 'approve'
                    ? 'ยืนยันอนุมัติหลายรายการพร้อมกัน'
                    : 'ยืนยันประกาศใช้หลายรายการพร้อมกัน'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setBulkActionType(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4 text-xs sm:text-sm">
              <p className="text-slate-700">
                คุณกำลังจะดำเนินการกับแผนพัฒนาท้องถิ่นจำนวน{' '}
                <span className="font-bold font-mono text-slate-900 text-base">
                  {selectedPlanIds.length}
                </span>{' '}
                ฉบับพร้อมกัน
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  หมายเหตุ / ข้อความบันทึก <span className="text-slate-400 font-normal">(ไม่บังคับ)</span>
                </label>
                <input
                  type="text"
                  value={bulkActionNote}
                  onChange={(e) => setBulkActionNote(e.target.value)}
                  placeholder="ระบุข้อความประกอบการดำเนินการกลุ่ม..."
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setBulkActionType(null)}
                  className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBulkAction}
                  className={`inline-flex items-center gap-1.5 px-5 py-2 text-xs sm:text-sm font-bold text-white rounded-xl shadow-xs transition-all cursor-pointer ${
                    bulkActionType === 'approve'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-sky-600 hover:bg-sky-700'
                  }`}
                >
                  <span>ยืนยันดำเนินการ</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. ป๊อปอัปหนังสือประกาศเทศบาลเมืองศิลา (Official Municipal Proclamation Modal) */}
      {/* ========================================================================= */}
      {officialAnnouncementPlan && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden border border-slate-200 flex flex-col my-auto">
            {/* Top Toolbar (Non-printable) */}
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0 print:hidden">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-sm sm:text-base">
                  แบบฟอร์มหนังสือประกาศเทศบาลเมืองศิลา (ตราครุฑทางการ)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-2xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>พิมพ์หนังสือประกาศ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOfficialAnnouncementPlan(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Content (Standard Government Letterhead) */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-slate-50 print:bg-white print:p-0">
              <div
                id="official-announcement-letter"
                className="max-w-[720px] mx-auto bg-white p-8 sm:p-12 shadow-md print:shadow-none border print:border-none border-slate-200 text-slate-900 font-sans leading-relaxed text-sm sm:text-base space-y-6 print-portrait official-proclamation-doc"
              >
                {/* Garuda Seal (ตราครุฑ) */}
                <div className="text-center flex flex-col items-center">
                  <img
                    src="/sila-logo.png"
                    alt="ตราเทศบาลเมืองศิลา"
                    className="w-20 h-20 object-contain mx-auto mb-3"
                  />
                  <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                    ประกาศเทศบาลเมืองศิลา
                  </h2>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                    {isInitialPlanEdition(officialAnnouncementPlan.planType, officialAnnouncementPlan.batchNumber)
                      ? `เรื่อง ประกาศใช้${getStandardPlanName(officialAnnouncementPlan.planType)}`
                      : `เรื่อง ประกาศใช้${getStandardPlanName(officialAnnouncementPlan.planType)} ${resolveAnnouncementBatchDisplay(officialAnnouncementPlan, announcements)}`}
                  </h3>
                </div>

                {/* Body Paragraphs */}
                <div className="space-y-4 text-justify indent-8 text-slate-800 leading-loose">
                  <p>
                    ด้วยเทศบาลเมืองศิลา ได้ดำเนินการจัดทำ{getStandardPlanName(officialAnnouncementPlan.planType)} {isInitialPlanEdition(officialAnnouncementPlan.planType, officialAnnouncementPlan.batchNumber) ? '' : resolveAnnouncementBatchDisplay(officialAnnouncementPlan, announcements)} เพื่อให้เป็นไปตามระเบียบกระทรวงมหาดไทยว่าด้วยการจัดทำแผนพัฒนาขององค์กรปกครองส่วนท้องถิ่น พ.ศ. 2548 และที่แก้ไขเพิ่มเติม (ฉบับที่ 3) พ.ศ. 2561 ข้อ 24 โดยได้รับความเห็นชอบจากคณะกรรมการพัฒนาเทศบาลเมืองศิลา และสภาเทศบาลเมืองศิลาเป็นที่เรียบร้อยแล้ว
                  </p>
                  <p>
                    อาศัยอำนาจตามความในระเบียบกระทรวงมหาดไทยว่าด้วยการจัดทำแผนพัฒนาขององค์กรปกครองส่วนท้องถิ่น พ.ศ. 2548 และที่แก้ไขเพิ่มเติม เทศบาลเมืองศิลาจึงขอประกาศใช้{getStandardPlanName(officialAnnouncementPlan.planType)} {isInitialPlanEdition(officialAnnouncementPlan.planType, officialAnnouncementPlan.batchNumber) ? '' : resolveAnnouncementBatchDisplay(officialAnnouncementPlan, announcements)} โดยมีผลบังคับใช้นับแต่วันประกาศเป็นต้นไป เพื่อเป็นกรอบในการจัดทำงบประมาณรายจ่ายประจำปี งบประมาณรายจ่ายเพิ่มเติม และการจัดสรรงบประมาณดำเนินโครงการพัฒนาท้องถิ่นตามลำดับความจำเป็นต่อไป
                  </p>
                </div>

                {/* Summary Box */}
                <div className="border border-slate-300 rounded-xl p-4 bg-slate-50 space-y-2 text-xs sm:text-sm">
                  <div className="font-bold text-slate-900">สรุปรายละเอียดแผนพัฒนาท้องถิ่น:</div>
                  <div className="grid grid-cols-2 gap-2 text-slate-700">
                    <div>
                      • จำนวนโครงการบรรจุในแผน:{' '}
                      <span className="font-bold font-mono text-slate-900">
                        {officialAnnouncementPlan.projectIds?.length || 0}
                      </span>{' '}
                      โครงการ
                    </div>
                    <div>
                      • งบประมาณรวมทั้งสิ้น 5 ปี:{' '}
                      <span className="font-bold font-mono text-emerald-800">
                        {formatCleanNumber(officialAnnouncementPlan.budgetTotal5Years)}
                      </span>{' '}
                      บาท
                    </div>
                    <div>
                      • เลขที่ประกาศ:{' '}
                      <span className="font-mono text-slate-900">
                        {officialAnnouncementPlan.announcementNo || 'ทม.ศล. 01/2571'}
                      </span>
                    </div>
                    <div>
                      • หน่วยงานรับผิดชอบหลัก:{' '}
                      <span className="text-slate-900">
                        {officialAnnouncementPlan.department || 'กองยุทธศาสตร์และงบประมาณ'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Closing & Signature */}
                <div className="pt-6 space-y-8">
                  <div className="text-right pr-6">
                    ประกาศ ณ วันที่ {officialAnnouncementPlan.effectiveDate || getCurrentThaiDateTime().split(' ')[0]}
                  </div>

                  <div className="flex flex-col items-end pr-10 pt-4 text-center">
                    <div className="w-56 space-y-2">
                      <div className="h-14 flex items-center justify-center">
                        <span className="text-xs text-slate-400 italic font-mono">[ลงนามนายกเทศมนตรีเมืองศิลา]</span>
                      </div>
                      <div className="font-bold text-slate-900">
                        ({officialAnnouncementPlan.approver || 'นายกเทศมนตรีเมืองศิลา'})
                      </div>
                      <div className="text-xs text-slate-700">
                        นายกเทศมนตรีเมืองศิลา
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Footer (Non-printable) */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0 print:hidden text-xs">
              <span className="text-slate-500">
                เอกสารทางการราชการ เทศบาลเมืองศิลา อำเภอเมืองขอนแก่น จังหวัดขอนแก่น
              </span>
              <button
                type="button"
                onClick={() => setOfficialAnnouncementPlan(null)}
                className="px-4 py-1.5 font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Add / Edit Modal */}
      <PlanApprovalAnnouncementModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        editingAnnouncement={editingAnnouncement}
        projects={projects}
        announcements={announcements}
        onSaveAnnouncement={onSaveAnnouncement}
        onUpdateProjects={onUpdateProjects}
      />
    </div>
  );
};
