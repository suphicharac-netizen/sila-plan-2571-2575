import React, { useState, useMemo, useEffect } from 'react';
import {
  Landmark,
  Coins,
  Search,
  FolderOpen,
  RotateCcw,
  Download,
  Printer,
  FileSpreadsheet,
  Clock,
  CheckCircle2,
  MoreVertical,
  Eye,
  ShieldAlert,
  AlertTriangle,
  AlertCircle,
  X,
  Check,
  PieChart,
  Calendar,
  Building2,
  Layers,
  ArrowUpDown,
  Tag,
  CheckSquare,
  Square,
  MinusSquare,
  CheckCheck
} from 'lucide-react';
import { ProjectData, FilterCriteria, UserAccount, ApprovalAuditEntry } from '../types';
import { DEVELOPMENT_STRATEGIES, BUDGET_SOURCES, DEPARTMENTS } from '../utils/constants';
import { matchesProjectSearch, getProjectDisplayId } from '../utils/projectCode';
import { exportTableToExcel } from '../utils/exportUtils';

interface BudgetApprovalViewProps {
  projects: ProjectData[];
  onOpenApprovalModal?: (project: ProjectData) => void;
  onOpenRemainingBudgetReport?: () => void;
  onOpenProjectDetail?: (project: ProjectData) => void;
  onRevokeApproval?: (project: ProjectData) => void;
  onUpdateProjects?: (projects: ProjectData[]) => void;
  isAdmin?: boolean;
  currentUser?: UserAccount | null;
}

// Colors for Budget Sources in Donut Chart and Badges
const BUDGET_SOURCE_COLORS: Record<string, { hex: string; bg: string; text: string; border: string }> = {
  'เทศบัญญัติงบประมาณรายจ่าย': {
    hex: '#059669',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200'
  },
  'เงินสะสม (จ่ายขาดเงินสะสม)': {
    hex: '#0d9488',
    bg: 'bg-teal-50',
    text: 'text-teal-800',
    border: 'border-teal-200'
  },
  'เงินอุดหนุนเฉพาะกิจ': {
    hex: '#f59e0b',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200'
  },
  'โอนเพิ่ม/โอนลด/ตั้งจ่ายเป็นรายการใหม่': {
    hex: '#0284c7',
    bg: 'bg-sky-50',
    text: 'text-sky-800',
    border: 'border-sky-200'
  },
  'เงินอุดหนุนจาก อบจ. ขอนแก่น': {
    hex: '#7c3aed',
    bg: 'bg-purple-50',
    text: 'text-purple-800',
    border: 'border-purple-200'
  },
  'งบประมาณสนับสนุนจากหน่วยงานอื่น': {
    hex: '#e11d48',
    bg: 'bg-rose-50',
    text: 'text-rose-800',
    border: 'border-rose-200'
  },
  '- ยังไม่ได้จัดสรร -': {
    hex: '#94a3b8',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200'
  }
};

const getSourceColor = (source?: string) => {
  if (!source) return BUDGET_SOURCE_COLORS['- ยังไม่ได้จัดสรร -'];
  return BUDGET_SOURCE_COLORS[source] || {
    hex: '#64748b',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200'
  };
};

// Helper: Format Thai Date & Time string
const getCurrentThaiDateTime = (): { dateStr: string; fullTimestamp: string } => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear() + 543;
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return {
    dateStr: `${day}/${month}/${year}`,
    fullTimestamp: `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`
  };
};

export const BudgetApprovalView: React.FC<BudgetApprovalViewProps> = ({
  projects,
  onOpenApprovalModal,
  onOpenRemainingBudgetReport,
  onOpenProjectDetail,
  onRevokeApproval,
  onUpdateProjects,
  isAdmin = true,
  currentUser
}) => {
  // 1. Search & Filter State
  const [fiscalYear, setFiscalYear] = useState<string>('2571');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [planStrategy, setPlanStrategy] = useState<string>('');
  const [budgetSource, setBudgetSource] = useState<string>('');
  const [department, setDepartment] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending'>('all');
  const [selectedSourceFilter, setSelectedSourceFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'default' | 'budget_desc' | 'budget_asc' | 'name'>('default');

  // 2. Selection & Batch Action State
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(new Set());

  // 3. UI Controls & Modals State
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const [revokingProject, setRevokingProject] = useState<ProjectData | null>(null);

  // Single Approval Modal state (Integrated)
  const [approvingProject, setApprovingProject] = useState<ProjectData | null>(null);
  const [singleApprovalBudget, setSingleApprovalBudget] = useState<number>(0);
  const [singleApprovalSource, setSingleApprovalSource] = useState<string>(BUDGET_SOURCES[0]);
  const [singleApprovalOrderNo, setSingleApprovalOrderNo] = useState<string>('');
  const [singleApprovalNote, setSingleApprovalNote] = useState<string>('');

  // Batch Approval Modal state
  const [isBatchApprovalOpen, setIsBatchApprovalOpen] = useState(false);
  const [batchApprovalSource, setBatchApprovalSource] = useState<string>(BUDGET_SOURCES[0]);
  const [batchApprovalOrderNo, setBatchApprovalOrderNo] = useState<string>('');
  const [batchApprovalNote, setBatchApprovalNote] = useState<string>('');

  // Close context menu on outside click
  useEffect(() => {
    const handleDocumentClick = () => {
      setOpenActionMenuId(null);
    };
    if (openActionMenuId) {
      document.addEventListener('click', handleDocumentClick);
      return () => document.removeEventListener('click', handleDocumentClick);
    }
  }, [openActionMenuId]);

  // Reset single approval inputs when a project is selected
  useEffect(() => {
    if (approvingProject) {
      const defaultBudget = approvingProject.budgetApproved > 0 
        ? approvingProject.budgetApproved 
        : approvingProject.budgetPlan;
      setSingleApprovalBudget(defaultBudget);
      setSingleApprovalSource(
        approvingProject.budgetSource && approvingProject.budgetSource !== '- ยังไม่ได้จัดสรร -'
          ? approvingProject.budgetSource
          : BUDGET_SOURCES[0]
      );
      setSingleApprovalOrderNo(approvingProject.approvalOrderNo || '');
      setSingleApprovalNote(approvingProject.note || '');
    }
  }, [approvingProject]);

  // Filter projects based on criteria
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      // Fiscal Year
      if (fiscalYear && fiscalYear !== 'all' && p.year !== fiscalYear) {
        return false;
      }
      // Plan Strategy
      if (planStrategy && p.planStrategy !== planStrategy) {
        return false;
      }
      // Budget Source filter (dropdown)
      if (budgetSource && p.budgetSource !== budgetSource) {
        return false;
      }
      // Budget Source filter from Donut Chart
      if (selectedSourceFilter !== 'all') {
        if (selectedSourceFilter === '- ยังไม่ได้จัดสรร -') {
          if (p.budgetSource && p.budgetSource !== '- ยังไม่ได้จัดสรร -') return false;
        } else if (p.budgetSource !== selectedSourceFilter) {
          return false;
        }
      }
      // Department
      if (department && p.department !== department) {
        return false;
      }
      // Status
      if (statusFilter === 'approved' && p.status !== 'approved') {
        return false;
      }
      if (statusFilter === 'pending' && p.status !== 'pending') {
        return false;
      }
      // Search keyword
      if (searchKeyword.trim()) {
        if (!matchesProjectSearch(searchKeyword, p)) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'budget_desc') return (b.budgetPlan || 0) - (a.budgetPlan || 0);
      if (sortBy === 'budget_asc') return (a.budgetPlan || 0) - (b.budgetPlan || 0);
      if (sortBy === 'name') return a.name.localeCompare(b.name, 'th');
      return (a.orderNumber || 0) - (b.orderNumber || 0);
    });
  }, [projects, fiscalYear, planStrategy, budgetSource, selectedSourceFilter, department, statusFilter, searchKeyword, sortBy]);

  // Overall Statistics for Fiscal Year
  const stats = useMemo(() => {
    const totalCount = filteredProjects.length;
    const approvedCount = filteredProjects.filter((p) => p.status === 'approved').length;
    const pendingCount = totalCount - approvedCount;

    const totalPlanBudget = filteredProjects.reduce((sum, p) => sum + (p.budgetPlan || 0), 0);
    const totalApprovedBudget = filteredProjects.reduce((sum, p) => sum + (p.budgetApproved || 0), 0);
    const remainingBudget = totalPlanBudget - totalApprovedBudget;

    const approvedPct = totalPlanBudget > 0 ? Math.round((totalApprovedBudget / totalPlanBudget) * 100) : 0;

    return {
      totalCount,
      approvedCount,
      pendingCount,
      totalPlanBudget,
      totalApprovedBudget,
      remainingBudget,
      approvedPct
    };
  }, [filteredProjects]);

  // Budget Source Breakdown for Donut Chart
  const budgetSourceBreakdown = useMemo(() => {
    const map = new Map<string, { count: number; totalAmount: number }>();

    // Initialize all standard sources
    BUDGET_SOURCES.forEach((src) => {
      map.set(src, { count: 0, totalAmount: 0 });
    });
    map.set('- ยังไม่ได้จัดสรร -', { count: 0, totalAmount: 0 });

    filteredProjects.forEach((p) => {
      const src = p.budgetSource && map.has(p.budgetSource) ? p.budgetSource : '- ยังไม่ได้จัดสรร -';
      const current = map.get(src)!;
      current.count += 1;
      current.totalAmount += (p.status === 'approved' && p.budgetApproved > 0) ? p.budgetApproved : (p.budgetPlan || 0);
    });

    const totalAmt = Array.from(map.values()).reduce((sum, item) => sum + item.totalAmount, 0) || 1;

    const items = Array.from(map.entries())
      .map(([name, data]) => ({
        name,
        count: data.count,
        totalAmount: data.totalAmount,
        percentage: Math.round((data.totalAmount / totalAmt) * 100),
        color: getSourceColor(name)
      }))
      .filter((item) => item.count > 0 || item.name === 'เทศบัญญัติงบประมาณรายจ่าย');

    return {
      items,
      totalAmount: totalAmt
    };
  }, [filteredProjects]);

  // Urgent pending projects for the horizontal action strip (top pending items with highest budget)
  const urgentPendingProjects = useMemo(() => {
    return filteredProjects
      .filter((p) => p.status === 'pending')
      .sort((a, b) => (b.budgetPlan || 0) - (a.budgetPlan || 0))
      .slice(0, 10);
  }, [filteredProjects]);

  // Selection Checkbox Logic
  const allFilteredSelected = useMemo(() => {
    if (filteredProjects.length === 0) return false;
    return filteredProjects.every((p) => selectedProjectIds.has(p.id));
  }, [filteredProjects, selectedProjectIds]);

  const someFilteredSelected = useMemo(() => {
    return filteredProjects.some((p) => selectedProjectIds.has(p.id)) && !allFilteredSelected;
  }, [filteredProjects, selectedProjectIds, allFilteredSelected]);

  const handleToggleSelectAll = () => {
    const next = new Set(selectedProjectIds);
    if (allFilteredSelected) {
      filteredProjects.forEach((p) => next.delete(p.id));
    } else {
      filteredProjects.forEach((p) => next.add(p.id));
    }
    setSelectedProjectIds(next);
  };

  const handleToggleSelectRow = (id: string) => {
    const next = new Set(selectedProjectIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedProjectIds(next);
  };

  const clearSelection = () => {
    setSelectedProjectIds(new Set());
  };

  // Selected items metadata for batch action bar
  const selectedSummary = useMemo(() => {
    const selectedList = projects.filter((p) => selectedProjectIds.has(p.id));
    const pendingList = selectedList.filter((p) => p.status === 'pending');
    const approvedList = selectedList.filter((p) => p.status === 'approved');
    const totalPlanBudget = selectedList.reduce((sum, p) => sum + (p.budgetPlan || 0), 0);
    const totalApprovedBudget = selectedList.reduce((sum, p) => sum + (p.budgetApproved || 0), 0);

    return {
      selectedCount: selectedList.length,
      pendingCount: pendingList.length,
      approvedCount: approvedList.length,
      totalPlanBudget,
      totalApprovedBudget,
      selectedList
    };
  }, [projects, selectedProjectIds]);

  // Handler: Confirm Single Project Approval
  const handleConfirmSingleApproval = (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvingProject) return;

    const { dateStr, fullTimestamp } = getCurrentThaiDateTime();
    const approverName = currentUser?.fullName || 'ผู้ดูแลระบบ (Admin)';
    const approverRole = currentUser?.role || 'admin';
    const trimmedNote = singleApprovalNote.trim();
    const approvedAmount = Number(singleApprovalBudget) || approvingProject.budgetPlan;

    const newAuditEntry: ApprovalAuditEntry = {
      action: 'อนุมัติตั้งงบประมาณ',
      timestamp: fullTimestamp,
      userName: approverName,
      userRole: approverRole,
      note: trimmedNote || undefined,
      amount: approvedAmount
    };

    const updatedProject: ProjectData = {
      ...approvingProject,
      status: 'approved',
      budgetApproved: approvedAmount,
      budgetSource: singleApprovalSource,
      approvalOrderNo: singleApprovalOrderNo.trim() || undefined,
      approvedDate: dateStr,
      approvedBy: approverName,
      approvedAt: fullTimestamp,
      approvalAuditTrail: [newAuditEntry, ...(approvingProject.approvalAuditTrail || [])],
      note: trimmedNote || approvingProject.note || ''
    };

    if (onUpdateProjects) {
      const nextProjects = projects.map((p) => (p.id === updatedProject.id ? updatedProject : p));
      onUpdateProjects(nextProjects);
    }
    setApprovingProject(null);
  };

  // Handler: Confirm Batch Approval for all selected pending items
  const handleConfirmBatchApproval = (e: React.FormEvent) => {
    e.preventDefault();
    const { dateStr, fullTimestamp } = getCurrentThaiDateTime();
    const approverName = currentUser?.fullName || 'ผู้ดูแลระบบ (Admin)';
    const approverRole = currentUser?.role || 'admin';
    const trimmedNote = batchApprovalNote.trim();

    const nextProjects = projects.map((p) => {
      if (!selectedProjectIds.has(p.id) || p.status === 'approved') {
        return p;
      }

      const approvedAmount = p.budgetPlan;
      const newAuditEntry: ApprovalAuditEntry = {
        action: 'อนุมัติตั้งงบประมาณ (แบบกลุ่ม Batch)',
        timestamp: fullTimestamp,
        userName: approverName,
        userRole: approverRole,
        note: trimmedNote || 'อนุมัติพร้อมกันหลายรายการ',
        amount: approvedAmount
      };

      return {
        ...p,
        status: 'approved' as const,
        budgetApproved: approvedAmount,
        budgetSource: batchApprovalSource,
        approvalOrderNo: batchApprovalOrderNo.trim() || undefined,
        approvedDate: dateStr,
        approvedBy: approverName,
        approvedAt: fullTimestamp,
        approvalAuditTrail: [newAuditEntry, ...(p.approvalAuditTrail || [])],
        note: trimmedNote ? `${p.note ? `${p.note} | ` : ''}${trimmedNote}` : p.note
      };
    });

    if (onUpdateProjects) {
      onUpdateProjects(nextProjects);
    }
    setIsBatchApprovalOpen(false);
    clearSelection();
  };

  // Handler: Batch Revoke approval (Admin only)
  const handleBatchRevokeApproval = () => {
    if (!isAdmin) return;
    const nextProjects = projects.map((p) => {
      if (!selectedProjectIds.has(p.id) || p.status !== 'approved') {
        return p;
      }
      return {
        ...p,
        status: 'pending' as const,
        budgetSource: '- ยังไม่ได้จัดสรร -',
        budgetApproved: 0,
        approvedDate: '-',
        approvalOrderNo: ''
      };
    });

    if (onUpdateProjects) {
      onUpdateProjects(nextProjects);
    }
    clearSelection();
  };

  // Handler: Revoke Single Project Approval
  const handleExecuteRevoke = (project: ProjectData) => {
    const updated: ProjectData = {
      ...project,
      budgetSource: '- ยังไม่ได้จัดสรร -',
      budgetApproved: 0,
      approvedDate: '-',
      approvalOrderNo: '',
      status: 'pending'
    };

    if (onRevokeApproval) {
      onRevokeApproval(updated);
    } else if (onUpdateProjects) {
      const nextProjects = projects.map((p) => (p.id === updated.id ? updated : p));
      onUpdateProjects(nextProjects);
    }
    setRevokingProject(null);
    setOpenActionMenuId(null);
  };

  // Reset Filters
  const handleResetFilters = () => {
    setFiscalYear('2571');
    setSearchKeyword('');
    setPlanStrategy('');
    setBudgetSource('');
    setDepartment('');
    setStatusFilter('all');
    setSelectedSourceFilter('all');
    setSortBy('default');
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'ID โครงการ',
      'รหัสเดิม',
      'ประเด็นการพัฒนา',
      'ชื่อโครงการ',
      'แผนงาน',
      'งบตามแผน (บาท)',
      'แหล่งที่มาของงบประมาณ',
      'งบประมาณที่อนุมัติ (บาท)',
      'วันที่อนุมัติ',
      'สถานะ',
      'หน่วยงานรับผิดชอบ',
      'เลขที่คำสั่ง/มติ',
      'หมายเหตุ'
    ];

    const rows = filteredProjects.map((p, idx) => [
      `"${getProjectDisplayId(p, p.orderNumber || idx + 1)}"`,
      `"${p.code || '-'}"`,
      `"${p.planStrategy}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.planCategory || '-'}"`,
      p.budgetPlan,
      `"${p.budgetSource || '- ยังไม่ได้จัดสรร -'}"`,
      p.budgetApproved,
      `"${p.approvedDate || '-'}"`,
      `"${p.status === 'approved' ? 'อนุมัติแล้ว' : 'ยังไม่อนุมัติงบ'}"`,
      `"${p.department}"`,
      `"${p.approvalOrderNo || '-'}"`,
      `"${(p.note || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ระบบอนุมัติงบประมาณ_เทศบาลเมืองศิลา_${fiscalYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  // Export to Excel (.xlsx)
  const handleExportExcel = () => {
    const headers = [
      'ลำดับ',
      'รหัสโครงการ',
      'รหัสแผน',
      'ยุทธศาสตร์ / ประเด็นการพัฒนา',
      'ชื่อโครงการ',
      'แผนงาน',
      'งบประมาณตามแผน (บาท)',
      'แหล่งเงินงบประมาณ',
      'งบประมาณที่อนุมัติ (บาท)',
      'วันที่อนุมัติ',
      'สถานะการอนุมัติ',
      'หน่วยงานรับผิดชอบ',
      'เลขที่คำสั่ง / มติสภา',
      'หมายเหตุ'
    ];

    const rows = filteredProjects.map((p, idx) => [
      idx + 1,
      getProjectDisplayId(p, p.orderNumber || idx + 1),
      p.code || '-',
      p.planStrategy,
      p.name,
      p.planCategory || '-',
      p.budgetPlan || 0,
      p.budgetSource || '- ยังไม่ได้จัดสรร -',
      p.budgetApproved || 0,
      p.approvedDate || '-',
      p.status === 'approved' ? 'อนุมัติแล้ว' : 'ยังไม่อนุมัติงบ',
      p.department,
      p.approvalOrderNo || '-',
      p.note || ''
    ]);

    exportTableToExcel({
      filename: `ระบบอนุมัติงบประมาณ_เทศบาลเมืองศิลา_${fiscalYear}`,
      title: 'ระบบอนุมัติตั้งงบประมาณ เทศบาลเมืองศิลา',
      subTitle: `ปีงบประมาณ พ.ศ. ${fiscalYear} | รวม ${filteredProjects.length} โครงการ`,
      headers,
      rows
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 flex flex-col bg-[#f8fafc] h-full min-h-0 overflow-y-auto font-sans">
      <div className="p-4 sm:p-6 lg:p-7 max-w-[1720px] w-full mx-auto space-y-5 sm:space-y-6">
        
        {/* ========================================================================= */}
        {/* 1. ส่วนหัวหน้าจอ (Header Bar): ตราเทศบาลเมืองศิลา + ข้อมูลปีงบประมาณ + เครื่องมือ */}
        {/* ========================================================================= */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1 border-b border-slate-200">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-white p-1 border border-slate-200 shadow-sm flex items-center justify-center shrink-0 ring-1 ring-emerald-500/20 overflow-hidden">
              <img
                src="/sila-logo.png"
                alt="ตราเทศบาลเมืองศิลา จังหวัดขอนแก่น"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  ระบบอนุมัติตั้งงบประมาณ
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <Coins className="w-3.5 h-3.5 text-emerald-700" />
                  <span>e-Budget Approval</span>
                </span>
                {currentUser && (
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                    {currentUser.role === 'admin' ? '🛡️ ผู้ดูแลระบบ (Admin)' : currentUser.role === 'executive' ? '👔 ผู้บริหาร' : '👤 เจ้าหน้าที่'}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
                เทศบาลเมืองศิลา อ.เมืองขอนแก่น จ.ขอนแก่น • แผนพัฒนาท้องถิ่น (พ.ศ. 2571 - 2575)
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
            {/* Year selector */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 shadow-2xs">
              <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
              <select
                id="select-header-fiscal-year"
                value={fiscalYear}
                onChange={(e) => setFiscalYear(e.target.value)}
                className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="2571">ปีงบประมาณ พ.ศ. 2571</option>
                <option value="2572">ปีงบประมาณ พ.ศ. 2572</option>
                <option value="2573">ปีงบประมาณ พ.ศ. 2573</option>
                <option value="2574">ปีงบประมาณ พ.ศ. 2574</option>
                <option value="2575">ปีงบประมาณ พ.ศ. 2575</option>
                <option value="all">-- ทุกปีงบประมาณ --</option>
              </select>
            </div>

            {/* Remaining budget report button */}
            {onOpenRemainingBudgetReport && (
              <button
                type="button"
                id="btn-header-remaining-budget"
                onClick={onOpenRemainingBudgetReport}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl shadow-2xs transition-colors cursor-pointer"
                title="เปิดรายงานยอดงบประมาณคงเหลือแยกตามแผนงาน"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                <span>รายงานยอดงบคงเหลือ</span>
              </button>
            )}

            {/* Export & Print buttons */}
            <button
              type="button"
              id="btn-header-export-excel"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl shadow-2xs transition-colors cursor-pointer"
              title="ส่งออกตารางเป็นไฟล์ Excel (.xlsx) ทันที"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>ส่งออก Excel</span>
            </button>

            <button
              type="button"
              id="btn-header-export-csv"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl shadow-2xs transition-colors cursor-pointer"
              title="ส่งออกตารางเป็นไฟล์ CSV ทันที"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>ส่งออก CSV</span>
            </button>

            <button
              type="button"
              id="btn-header-print-report"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-sky-800 bg-sky-50 border border-sky-300 hover:bg-sky-100 rounded-xl shadow-2xs transition-colors cursor-pointer"
              title="สั่งพิมพ์รายงาน หรือบันทึกเป็น PDF"
            >
              <Printer className="w-3.5 h-3.5 text-sky-700" />
              <span>พิมพ์รายงาน</span>
            </button>

            {/* Print button */}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl shadow-2xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>พิมพ์</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. การ์ดสถิติ 3 สถานะหลัก + กราฟ Donut Chart สรุปแหล่งที่มางบประมาณแบบแนวนอน */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 w-full">
          {/* ซ้าย: การ์ดสถิติ 3 สถานะหลัก (🟡 รออนุมัติงบ | 🟢 อนุมัติแล้ว | 🔵 งบรวมตามแผน) */}
          <div className="xl:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Card 1: 🟡 รออนุมัติงบประมาณ */}
            <div
              onClick={() => setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs flex flex-col justify-between ${
                statusFilter === 'pending'
                  ? 'bg-amber-100/90 border-amber-400 ring-2 ring-amber-300'
                  : 'bg-amber-50/50 border-amber-200 hover:border-amber-300 hover:bg-amber-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900">🟡 รออนุมัติงบประมาณ</span>
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black font-mono text-amber-950 leading-none">
                    {stats.pendingCount}
                  </span>
                  <span className="text-xs font-semibold text-amber-700">โครงการ</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-amber-800">
                  <span>งบรอจัดสรร:</span>
                  <span className="font-mono font-bold text-amber-950">
                    {stats.remainingBudget.toLocaleString()} บ.
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: 🟢 อนุมัติงบประมาณแล้ว */}
            <div
              onClick={() => setStatusFilter(statusFilter === 'approved' ? 'all' : 'approved')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs flex flex-col justify-between ${
                statusFilter === 'approved'
                  ? 'bg-emerald-100/90 border-emerald-400 ring-2 ring-emerald-300'
                  : 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900">🟢 อนุมัติงบประมาณแล้ว</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-950 leading-none">
                    {stats.approvedCount}
                  </span>
                  <span className="text-xs font-semibold text-emerald-700">โครงการ</span>
                  <span className="text-[10px] font-bold text-emerald-700 ml-auto bg-emerald-100 px-1.5 py-0.5 rounded-full border border-emerald-200">
                    {stats.approvedPct}%
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-emerald-800">
                  <span>งบอนุมัติจริง:</span>
                  <span className="font-mono font-bold text-emerald-950">
                    {stats.totalApprovedBudget.toLocaleString()} บ.
                  </span>
                </div>
              </div>
            </div>

            {/* Card 3: 🔵 ยอดรวมงบตามแผนพัฒนา */}
            <div
              onClick={() => {
                setStatusFilter('all');
                setSelectedSourceFilter('all');
              }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs flex flex-col justify-between ${
                statusFilter === 'all' && selectedSourceFilter === 'all'
                  ? 'bg-sky-100/90 border-sky-400 ring-2 ring-sky-300'
                  : 'bg-sky-50/50 border-sky-200 hover:border-sky-300 hover:bg-sky-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-900">🔵 ยอดรวมงบตามแผน</span>
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 border border-sky-200">
                  <Landmark className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black font-mono text-sky-950 leading-none">
                    {stats.totalCount}
                  </span>
                  <span className="text-xs font-semibold text-sky-700">โครงการ</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-sky-800">
                  <span>งบรวมทั้งหมด:</span>
                  <span className="font-mono font-bold text-sky-950">
                    {stats.totalPlanBudget.toLocaleString()} บ.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ขวา: กราฟ Donut Chart สรุปสัดส่วนแหล่งที่มาของงบประมาณ */}
          <div className="xl:col-span-5 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-emerald-700" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-800">
                  สัดส่วนแหล่งที่มาของงบประมาณ
                </h3>
              </div>
              <span className="text-[11px] font-mono font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                {fiscalYear === 'all' ? 'รวมทุกปี' : `ปี พ.ศ. ${fiscalYear}`}
              </span>
            </div>

            <div className="flex flex-row items-center justify-between gap-4">
              {/* SVG Donut Chart with Center Total Amount */}
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
                  {budgetSourceBreakdown.totalAmount > 0 && (() => {
                    const c = 2 * Math.PI * 36;
                    let accumulatedOffset = 0;
                    return budgetSourceBreakdown.items.map((item, idx) => {
                      const strokeLength = (item.totalAmount / budgetSourceBreakdown.totalAmount) * c;
                      const currentOffset = accumulatedOffset;
                      accumulatedOffset += strokeLength;
                      if (strokeLength <= 0) return null;

                      return (
                        <circle
                          key={idx}
                          cx="50"
                          cy="50"
                          r="36"
                          stroke={item.color.hex}
                          strokeWidth="12"
                          fill="none"
                          strokeDasharray={`${strokeLength} ${c - strokeLength}`}
                          strokeDashoffset={-currentOffset}
                          className="transition-all duration-500"
                        />
                      );
                    });
                  })()}
                </svg>
                {/* Center Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-[11px] font-bold text-slate-400">อนุมัติแล้ว</span>
                  <span className="text-sm sm:text-base font-black font-mono text-emerald-800 leading-none">
                    {stats.approvedCount}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500 mt-0.5">โครงการ</span>
                </div>
              </div>

              {/* Horizontal / Compact Grid Legend with filter toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 flex-1 text-xs">
                {budgetSourceBreakdown.items.slice(0, 4).map((item, idx) => {
                  const isSelected = selectedSourceFilter === item.name;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() =>
                        setSelectedSourceFilter(isSelected ? 'all' : item.name)
                      }
                      className={`flex items-center justify-between p-1.5 rounded-lg border text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-300'
                          : 'border-slate-100 hover:bg-slate-50'
                      }`}
                      title={`กรองเฉพาะแหล่งเงิน: ${item.name}`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: item.color.hex }}
                        />
                        <span className="font-semibold text-slate-700 truncate text-[11px]">
                          {item.name.replace(' (จ่ายขาดเงินสะสม)', '')}
                        </span>
                      </div>
                      <div className="text-right shrink-0 font-mono text-slate-800 text-[11px]">
                        <span className="font-bold">{item.count}</span>
                        <span className="text-[10px] text-slate-400 ml-1">({item.percentage}%)</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. แถบ "รายการรออนุมัติตั้งงบประมาณเร่งด่วน" วางแนวนอนสไตล์ Clean Action Strip */}
        {/* ========================================================================= */}
        {urgentPendingProjects.length > 0 ? (
          <div className="bg-linear-to-r from-amber-500/10 via-amber-500/5 to-emerald-500/10 border border-amber-200/90 rounded-2xl p-3.5 sm:p-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>รายการรออนุมัติตั้งงบประมาณเร่งด่วน</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-200 text-amber-900 font-mono">
                      {urgentPendingProjects.length} โครงการ
                    </span>
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-600">
                    โครงการตามแผนพัฒนาท้องถิ่นที่อยู่ระหว่างรอการจัดสรรและอนุมัติตั้งงบประมาณประจำปี
                  </p>
                </div>
              </div>

              <div className="text-[11px] font-medium text-slate-500 hidden sm:block">
                เลื่อนแนวนอนเพื่อดูโครงการทั้งหมด →
              </div>
            </div>

            {/* Horizontal Scroll Track */}
            <div className="flex items-center gap-3 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin">
              {urgentPendingProjects.map((p, idx) => {
                const displayId = getProjectDisplayId(p, p.orderNumber || idx + 1);
                return (
                  <div
                    key={p.id}
                    className="min-w-[280px] max-w-[320px] bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl p-3 shadow-2xs transition-all flex flex-col justify-between gap-2.5 shrink-0"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                        {displayId}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap bg-amber-100 text-amber-800 border border-amber-200">
                        🟡 รออนุมัติงบ
                      </span>
                    </div>

                    <div>
                      <div
                        className="font-bold text-xs text-slate-900 leading-snug line-clamp-1"
                        title={p.name}
                      >
                        {p.name}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        {p.department}
                      </div>
                      <div className="text-[12px] font-mono text-emerald-700 font-bold mt-1">
                        {p.budgetPlan ? p.budgetPlan.toLocaleString() : '0'} บาท
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => onOpenProjectDetail?.(p)}
                        className="text-sky-600 hover:text-sky-800 font-semibold text-[11px] cursor-pointer"
                      >
                        ดูรายละเอียด
                      </button>

                      <button
                        type="button"
                        id={`btn-urgent-approve-${p.id}`}
                        onClick={() => setApprovingProject(p)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>อนุมัติตั้งงบ</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3.5 px-4 flex items-center justify-between text-xs text-emerald-900 shadow-2xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold">
                โครงการทั้งหมดในเงื่อนไขได้รับการจัดสรรและอนุมัติตั้งงบประมาณครบถ้วนเรียบร้อยแล้ว
              </span>
            </div>
            <span className="font-mono font-semibold text-emerald-700 text-[11px]">
              อนุมัติสมบูรณ์ 100%
            </span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 4. แถบตัวกรองและเครื่องมือค้นหา (Filter & Search Toolbar) */}
        {/* ========================================================================= */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
            {/* Search Input */}
            <div className="lg:col-span-4 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="input-budget-search"
                type="text"
                placeholder="ค้นหาชื่อโครงการ, รหัส, แผนงาน หรือหน่วยงาน..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full text-xs sm:text-sm pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Filter: Strategy */}
            <div className="lg:col-span-3">
              <select
                id="filter-select-strategy"
                value={planStrategy}
                onChange={(e) => setPlanStrategy(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-xl px-2.5 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer truncate"
              >
                <option value="">-- ทุกประเด็นการพัฒนา (5 ประเด็น) --</option>
                {DEVELOPMENT_STRATEGIES.map((s, idx) => (
                  <option key={idx} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter: Budget Source */}
            <div className="lg:col-span-2">
              <select
                id="filter-select-source"
                value={budgetSource}
                onChange={(e) => setBudgetSource(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-xl px-2.5 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer truncate"
              >
                <option value="">-- ทุกแหล่งที่มางบประมาณ --</option>
                {BUDGET_SOURCES.map((src, idx) => (
                  <option key={idx} value={src}>
                    {src}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter: Department */}
            <div className="lg:col-span-2">
              <select
                id="filter-select-department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-xl px-2.5 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer truncate"
              >
                <option value="">-- ทุกหน่วยงานรับผิดชอบ --</option>
                {DEPARTMENTS.map((dept, idx) => (
                  <option key={idx} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Filter Button */}
            <div className="lg:col-span-1 flex items-center justify-end">
              <button
                type="button"
                id="btn-reset-filters"
                onClick={handleResetFilters}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                title="ล้างการค้นหาและตัวกรองทั้งหมด"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>รีเซ็ต</span>
              </button>
            </div>
          </div>

          {/* Quick Status Chips & Result Count */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-500">กรองสถานะ:</span>
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                ทั้งหมด ({stats.totalCount})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('pending')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'pending'
                    ? 'bg-amber-500 text-white shadow-2xs'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                🟡 รออนุมัติ ({stats.pendingCount})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('approved')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'approved'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                🟢 อนุมัติแล้ว ({stats.approvedCount})
              </button>

              {selectedSourceFilter !== 'all' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-xs font-medium">
                  <span>แหล่งเงิน: {selectedSourceFilter}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedSourceFilter('all')}
                    className="hover:text-teal-950 font-bold"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-slate-500 font-medium">เรียงตาม:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs font-medium text-slate-700 border border-slate-300 rounded-lg px-2 py-1 bg-white focus:outline-none cursor-pointer"
              >
                <option value="default">ลำดับตามแผน (เริ่มต้น)</option>
                <option value="budget_desc">งบประมาณ (มาก → น้อย)</option>
                <option value="budget_asc">งบประมาณ (น้อย → มาก)</option>
                <option value="name">ชื่อโครงการ (ก-ฮ)</option>
              </select>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 5. ตารางหลักระบบอนุมัติงบประมาณ (Full-Width Clean Table) พร้อม Checkbox */}
        {/* ========================================================================= */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto max-h-[65vh]">
            <table className="w-full text-left border-collapse min-w-[1100px]">
              <thead>
                <tr className="bg-[#054e3b] text-white text-xs font-bold tracking-wide sticky top-0 z-20">
                  {/* Checkbox column */}
                  <th className="py-3 px-3 w-10 text-center border-r border-[#075f48]">
                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      className="p-1 hover:bg-emerald-800 rounded transition-colors text-white cursor-pointer"
                      title={allFilteredSelected ? 'ยกเลิกการเลือกทั้งหมด' : 'เลือกทั้งหมด'}
                    >
                      {allFilteredSelected ? (
                        <CheckSquare className="w-4 h-4 text-amber-300" />
                      ) : someFilteredSelected ? (
                        <MinusSquare className="w-4 h-4 text-amber-300" />
                      ) : (
                        <Square className="w-4 h-4 text-emerald-200" />
                      )}
                    </button>
                  </th>

                  {/* ID / Code */}
                  <th className="py-3 px-3 w-28 text-center border-r border-[#075f48]">
                    รหัสโครงการ
                  </th>

                  {/* Strategy */}
                  <th className="py-3 px-4 w-48 border-r border-[#075f48]">
                    ประเด็นการพัฒนา
                  </th>

                  {/* Project Name & Category */}
                  <th className="py-3 px-4 border-r border-[#075f48]">
                    ชื่อโครงการ / แผนงาน
                  </th>

                  {/* Budget Plan */}
                  <th className="py-3 px-4 text-right w-36 border-r border-[#075f48]">
                    งบตามแผน (บาท)
                  </th>

                  {/* Budget Source */}
                  <th className="py-3 px-3 text-center w-40 border-r border-[#075f48]">
                    แหล่งที่มาของงบประมาณ
                  </th>

                  {/* Approved Budget */}
                  <th className="py-3 px-3 text-right w-36 border-r border-[#075f48]">
                    งบที่อนุมัติ (บาท)
                  </th>

                  {/* Approved Date */}
                  <th className="py-3 px-3 text-center w-28 border-r border-[#075f48]">
                    วันที่อนุมัติ
                  </th>

                  {/* Status */}
                  <th className="py-3 px-3 text-center w-28 border-r border-[#075f48]">
                    สถานะ
                  </th>

                  {/* Department */}
                  <th className="py-3 px-3 text-center w-32 border-r border-[#075f48]">
                    หน่วยงาน
                  </th>

                  {/* Actions */}
                  <th className="py-3 px-4 text-center w-36">
                    การจัดการ
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 text-xs text-slate-700">
                {filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-16 text-center text-slate-400">
                      <FolderOpen className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <div className="font-semibold text-slate-600">ไม่พบโครงการตามเงื่อนไขที่ค้นหา</div>
                      <div className="text-xs text-slate-400 mt-1">
                        ลองปรับตัวกรองหรือคำค้นหาใหม่ หรือกดปุ่ม "รีเซ็ต" ด้านบน
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredProjects.map((p, idx) => {
                    const isApproved = p.status === 'approved';
                    const isSelected = selectedProjectIds.has(p.id);
                    const displayId = getProjectDisplayId(p, p.orderNumber || idx + 1);
                    const sourceInfo = getSourceColor(p.budgetSource);

                    return (
                      <tr
                        key={p.id}
                        className={`transition-colors cursor-pointer group ${
                          isSelected
                            ? 'bg-amber-50/70 hover:bg-amber-100/60'
                            : 'hover:bg-emerald-50/40'
                        }`}
                        onClick={() => onOpenProjectDetail?.(p)}
                      >
                        {/* Checkbox */}
                        <td
                          className="py-3 px-3 text-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleSelectRow(p.id);
                          }}
                        >
                          <button
                            type="button"
                            className="p-1 rounded text-slate-400 hover:text-emerald-700 cursor-pointer"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>

                        {/* ID */}
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-700 whitespace-nowrap">
                          <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {displayId}
                          </span>
                        </td>

                        {/* Strategy */}
                        <td className="py-3 px-4 text-slate-700 leading-relaxed">
                          <span className="line-clamp-2" title={p.planStrategy}>
                            {p.planStrategy}
                          </span>
                        </td>

                        {/* Name & Category */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 group-hover:text-emerald-900 leading-snug flex items-center gap-1.5">
                            <span>{p.name}</span>
                            <Eye className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                            <span>แผนงาน: {p.planCategory}</span>
                            {p.approvalOrderNo && (
                              <>
                                <span>•</span>
                                <span className="text-emerald-800 font-mono">
                                  มติ: {p.approvalOrderNo}
                                </span>
                              </>
                            )}
                          </div>
                        </td>

                        {/* Budget Plan */}
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                          {p.budgetPlan > 0 ? p.budgetPlan.toLocaleString() : '-'}
                        </td>

                        {/* Budget Source Badge */}
                        <td className="py-3 px-3 text-center">
                          {p.budgetSource && p.budgetSource !== '- ยังไม่ได้จัดสรร -' ? (
                            <span
                              className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold border ${sourceInfo.bg} ${sourceInfo.text} ${sourceInfo.border}`}
                              title={p.budgetSource}
                            >
                              {p.budgetSource}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">
                              - ยังไม่ได้จัดสรร -
                            </span>
                          )}
                        </td>

                        {/* Approved Budget */}
                        <td className="py-3 px-3 text-right font-mono font-bold whitespace-nowrap">
                          {isApproved ? (
                            <span className="text-emerald-700 text-xs">
                              {p.budgetApproved.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        {/* Approved Date */}
                        <td className="py-3 px-3 text-center text-slate-600 font-mono text-[11px]">
                          {p.approvedDate || '-'}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          {isApproved ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                              <span>อนุมัติแล้ว</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-amber-800 bg-amber-100 border border-amber-300">
                              <Clock className="w-3 h-3 text-amber-700" />
                              <span>รออนุมัติ</span>
                            </span>
                          )}
                        </td>

                        {/* Department */}
                        <td className="py-3 px-3 text-center text-slate-700 font-medium">
                          {p.department}
                        </td>

                        {/* Action buttons */}
                        <td
                          className="py-3 px-4 text-center whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {isApproved ? (
                            <div className="inline-flex items-center justify-center gap-1.5">
                              {/* Disabled button indicating already approved */}
                              <button
                                type="button"
                                disabled
                                aria-disabled="true"
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 rounded-lg opacity-90 cursor-not-allowed select-none"
                                title="โครงการนี้ได้รับการอนุมัติตั้งงบประมาณแล้ว (ไม่สามารถกดอนุมัติซ้ำได้)"
                              >
                                <Check className="w-3 h-3 text-emerald-700" />
                                <span>✓ อนุมัติแล้ว</span>
                              </button>

                              {/* View detail button */}
                              <button
                                type="button"
                                onClick={() => onOpenProjectDetail?.(p)}
                                className="p-1.5 text-slate-500 hover:text-sky-700 hover:bg-sky-50 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                                title="ดูรายละเอียดโครงการ"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* Admin Action Menu */}
                              {isAdmin && (
                                <div className="relative inline-block text-left">
                                  <button
                                    type="button"
                                    onClick={() => setOpenActionMenuId(openActionMenuId === p.id ? null : p.id)}
                                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                                    title="ตัวเลือกเพิ่มเติม (Admin)"
                                  >
                                    <MoreVertical className="w-3.5 h-3.5" />
                                  </button>

                                  {openActionMenuId === p.id && (
                                    <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-30 text-left animate-in fade-in zoom-in-95">
                                      <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                        <ShieldAlert className="w-3 h-3 text-emerald-600" />
                                        <span>สิทธิ์ผู้ดูแลระบบ</span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setOpenActionMenuId(null);
                                          setApprovingProject(p);
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 text-left cursor-pointer"
                                      >
                                        <Coins className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>แก้ไขงบประมาณ</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setOpenActionMenuId(null);
                                          setRevokingProject(p);
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-amber-700 hover:bg-amber-50 text-left cursor-pointer border-t border-slate-100 font-medium"
                                      >
                                        <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                                        <span>ยกเลิกการอนุมัติ</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <button
                              type="button"
                              id={`btn-table-approve-${p.id}`}
                              onClick={() => setApprovingProject(p)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-linear-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 rounded-lg shadow-2xs transition-all cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>อนุมัติงบประมาณ</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* Table Footer: Totals Row */}
              <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-xs shadow-2xs">
                <tr className="text-slate-900">
                  <td colSpan={4} className="py-3 px-4 text-right font-bold text-slate-900 border-r border-slate-200">
                    รวมทั้งสิ้น ({filteredProjects.length} โครงการ)
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 border-r border-slate-200 whitespace-nowrap">
                    {stats.totalPlanBudget.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-center text-slate-400 border-r border-slate-200">-</td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-emerald-800 border-r border-slate-200 whitespace-nowrap">
                    {stats.totalApprovedBudget.toLocaleString()}
                  </td>
                  <td colSpan={4} className="py-3 px-4 text-left font-mono font-bold text-slate-800">
                    งบคงเหลือตามแผน: <span className="text-blue-700">{stats.remainingBudget.toLocaleString()} บาท</span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Bottom Table Toolbar */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-700 gap-3">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-slate-800">
                แสดงผล {filteredProjects.length} โครงการ
              </span>
              <span className="text-slate-500">
                (อนุมัติแล้ว {stats.approvedCount} โครงการ | รออนุมัติ {stats.pendingCount} โครงการ)
              </span>
            </div>
            <div className="flex items-center gap-4 font-mono font-bold text-xs">
              <span className="text-slate-800">
                งบตามแผน: {stats.totalPlanBudget.toLocaleString()} บ.
              </span>
              <span className="text-emerald-700">
                อนุมัติแล้ว: {stats.totalApprovedBudget.toLocaleString()} บ.
              </span>
              <span className="text-blue-700">
                คงเหลือ: {stats.remainingBudget.toLocaleString()} บ.
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 6. แถบ Floating Batch Action Bar ด้านล่าง (แสดงเมื่อมีการติ๊ก Checkbox) */}
        {/* ========================================================================= */}
        {selectedProjectIds.size > 0 && (
          <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700 flex flex-wrap items-center justify-between gap-4 max-w-4xl w-[92%] animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold font-mono text-sm shrink-0">
                {selectedProjectIds.size}
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold flex items-center gap-2">
                  <span>เลือก {selectedProjectIds.size} โครงการ</span>
                  <span className="text-slate-400 font-normal hidden sm:inline">
                    (รออนุมัติ {selectedSummary.pendingCount} | อนุมัติแล้ว {selectedSummary.approvedCount})
                  </span>
                </div>
                <div className="text-[11px] text-emerald-400 font-mono font-medium">
                  งบประมาณตามแผนรวม: {selectedSummary.totalPlanBudget.toLocaleString()} บาท
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Batch Approve Button */}
              {selectedSummary.pendingCount > 0 && (
                <button
                  type="button"
                  id="btn-batch-approve"
                  onClick={() => setIsBatchApprovalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-sm transition-colors cursor-pointer"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>อนุมัติรายการที่เลือก ({selectedSummary.pendingCount})</span>
                </button>
              )}

              {/* Admin Batch Revoke Button */}
              {isAdmin && selectedSummary.approvedCount > 0 && (
                <button
                  type="button"
                  id="btn-batch-revoke"
                  onClick={handleBatchRevokeApproval}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-300 hover:text-white bg-amber-950/80 hover:bg-amber-900 border border-amber-700 rounded-xl transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>ยกเลิกการอนุมัติ ({selectedSummary.approvedCount})</span>
                </button>
              )}

              {/* Clear selection button */}
              <button
                type="button"
                onClick={clearSelection}
                className="px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                ยกเลิกการเลือก
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* 7. Modal อนุมัติงบประมาณเดี่ยว (Single Approval Modal) */}
      {/* ========================================================================= */}
      {approvingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-linear-to-r from-emerald-700 to-teal-800 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5 font-bold text-base">
                <Coins className="w-5 h-5 text-emerald-200" />
                <span>อนุมัติตั้งงบประมาณโครงการ</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="btn-print-budget-approval-top"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  title="พิมพ์เฉพาะเนื้อหาในหน้ารายละเอียดนี้ออกทางเครื่องพิมพ์"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>พิมพ์หน้านี้</span>
                </button>
                <button
                  type="button"
                  onClick={() => setApprovingProject(null)}
                  className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleConfirmSingleApproval} className="p-6 space-y-4 text-xs">
              {/* Project Info Summary */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>รหัส: {getProjectDisplayId(approvingProject, approvingProject.orderNumber)}</span>
                  <span>ปีงบประมาณ: พ.ศ. {approvingProject.year}</span>
                </div>
                <div className="font-bold text-slate-900 text-sm leading-snug">
                  {approvingProject.name}
                </div>
                <div className="text-slate-600">
                  <span className="font-semibold">หน่วยงาน:</span> {approvingProject.department} • <span className="font-semibold">แผนงาน:</span> {approvingProject.planCategory}
                </div>
                <div className="pt-1 flex items-center justify-between text-xs border-t border-slate-200">
                  <span className="text-slate-600">งบประมาณตามแผนพัฒนา:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {approvingProject.budgetPlan.toLocaleString()} บาท
                  </span>
                </div>
              </div>

              {/* Form Input: Approved Budget */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  จำนวนเงินงบประมาณที่อนุมัติตั้งงบ (บาท) *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={singleApprovalBudget}
                  onChange={(e) => setSingleApprovalBudget(Number(e.target.value))}
                  className="w-full text-sm font-mono font-bold px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  ระบุยอดเงินที่ได้รับจัดสรรจริง (เริ่มต้นตั้งไว้เท่างบตามแผน)
                </span>
              </div>

              {/* Form Input: Budget Source */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  แหล่งที่มาของงบประมาณ *
                </label>
                <select
                  value={singleApprovalSource}
                  onChange={(e) => setSingleApprovalSource(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  {BUDGET_SOURCES.map((src, idx) => (
                    <option key={idx} value={src}>
                      {src}
                    </option>
                  ))}
                </select>
              </div>

              {/* Form Input: Order No */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  เลขที่คำสั่ง / มติการประชุมสภา (ถ้ามี)
                </label>
                <input
                  type="text"
                  placeholder="เช่น มติสภาเทศบาลเมืองศิลา สมัยสามัญที่ 2/2571"
                  value={singleApprovalOrderNo}
                  onChange={(e) => setSingleApprovalOrderNo(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Form Input: Approval Note */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  หมายเหตุการอนุมัติงบประมาณ
                </label>
                <textarea
                  rows={2}
                  placeholder="ระบุหมายเหตุเพิ่มเติม (ถ้ามี)..."
                  value={singleApprovalNote}
                  onChange={(e) => setSingleApprovalNote(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2.5">
                <button
                  type="button"
                  id="btn-print-budget-approval-bottom"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                  title="พิมพ์เฉพาะเนื้อหาในหน้ารายละเอียดนี้ออกทางเครื่องพิมพ์"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                  <span>พิมพ์หน้านี้</span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setApprovingProject(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    id="btn-confirm-single-approval"
                    className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>ยืนยันอนุมัติตั้งงบประมาณ</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. Modal อนุมัติหลายโครงการพร้อมกัน (Batch Approval Modal) */}
      {/* ========================================================================= */}
      {isBatchApprovalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="bg-linear-to-r from-emerald-700 to-teal-800 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-base">
                <CheckCheck className="w-5 h-5 text-emerald-200" />
                <span>อนุมัติตั้งงบประมาณพร้อมกัน ({selectedSummary.pendingCount} โครงการ)</span>
              </div>
              <button
                type="button"
                onClick={() => setIsBatchApprovalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmBatchApproval} className="p-6 space-y-4 text-xs">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 space-y-1.5 text-emerald-900">
                <div className="font-bold flex items-center gap-1.5 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>ยืนยันอนุมัติตั้งงบประมาณแบบกลุ่ม (Batch Approval)</span>
                </div>
                <div className="text-xs">
                  ระบบจะเปลี่ยนสถานะของโครงการที่รออนุมัติทั้ง <strong>{selectedSummary.pendingCount} โครงการ</strong> เป็น <strong>"อนุมัติแล้ว"</strong> โดยกำหนดยอดงบประมาณอนุมัติตามงบที่ระบุไว้ในแผนพัฒนาท้องถิ่น
                </div>
                <div className="font-mono font-bold text-sm text-emerald-950 pt-1">
                  ยอดงบประมาณรวมทั้งสิ้น: {selectedSummary.totalPlanBudget.toLocaleString()} บาท
                </div>
              </div>

              {/* Select Source */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  แหล่งที่มาของงบประมาณสำหรับทุกโครงการ *
                </label>
                <select
                  value={batchApprovalSource}
                  onChange={(e) => setBatchApprovalSource(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  {BUDGET_SOURCES.map((src, idx) => (
                    <option key={idx} value={src}>
                      {src}
                    </option>
                  ))}
                </select>
              </div>

              {/* Order No */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  เลขที่คำสั่ง / มติการประชุมสภา (ถ้ามี)
                </label>
                <input
                  type="text"
                  placeholder="เช่น มติสภาเทศบาลเมืองศิลา สมัยสามัญที่ 2/2571"
                  value={batchApprovalOrderNo}
                  onChange={(e) => setBatchApprovalOrderNo(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Note */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  หมายเหตุการอนุมัติร่วม
                </label>
                <textarea
                  rows={2}
                  placeholder="ระบุหมายเหตุสำหรับการอนุมัติรอบนี้..."
                  value={batchApprovalNote}
                  onChange={(e) => setBatchApprovalNote(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsBatchApprovalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  id="btn-confirm-batch-approval-submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>ยืนยันอนุมัติ {selectedSummary.pendingCount} โครงการ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. Modal ยืนยันยกเลิกการอนุมัติ (Revoke Modal - Admin Only) */}
      {/* ========================================================================= */}
      {revokingProject && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="bg-amber-500 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-base">
                <AlertTriangle className="w-5 h-5 text-amber-100" />
                <span>ยืนยันยกเลิกการอนุมัติงบประมาณ</span>
              </div>
              <button
                type="button"
                onClick={() => setRevokingProject(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-amber-600/50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-900 leading-relaxed">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">การดำเนินการสำหรับผู้ดูแลระบบ (Admin Only)</div>
                  <div className="mt-0.5 text-amber-800">
                    การยกเลิกการอนุมัติจะคืนสถานะโครงการนี้กลับเป็น <strong>"ยังไม่อนุมัติงบ" (Pending)</strong> และรีเซ็ตยอดงบประมาณที่อนุมัติเป็น 0 บาท
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-1.5">
                <div className="text-slate-500">โครงการ:</div>
                <div className="font-bold text-slate-800 leading-snug">
                  {revokingProject.name}
                </div>
                <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-600">
                  <span>งบเดิมที่อนุมัติ:</span>
                  <span className="font-bold font-mono text-emerald-700">
                    {revokingProject.budgetApproved.toLocaleString()} บาท
                  </span>
                  <span>({revokingProject.budgetSource})</span>
                </div>
              </div>

              <p className="text-slate-600">
                คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการอนุมัติงบประมาณโครงการนี้?
              </p>
            </div>

            <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setRevokingProject(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                id="btn-confirm-revoke-approval"
                onClick={() => handleExecuteRevoke(revokingProject)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>ยืนยันยกเลิกการอนุมัติ</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
