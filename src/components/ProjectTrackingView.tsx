import React, { useState, useMemo } from 'react';
import {
  Activity,
  Search,
  RotateCcw,
  Download,
  Printer,
  FileText,
  Eye,
  Edit3,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Circle,
  XCircle,
  ChevronDown,
  X,
  Calendar,
  Building2,
  FileCheck,
  Sparkles,
  Paperclip,
  Upload,
  Star,
  Check,
  TrendingUp,
  Percent,
  ThumbsUp,
  AlertCircle,
  Filter,
  CircleDollarSign,
  Image as ImageIcon,
  Trash2,
  Plus,
  FileSpreadsheet
} from 'lucide-react';
import { ProjectData, ProjectTrackingItem, TrackingStatus } from '../types';
import { DEVELOPMENT_STRATEGIES, DEPARTMENTS } from '../utils/constants';
import { matchesProjectSearch, getProjectDisplayId } from '../utils/projectCode';
import { exportTableToExcel } from '../utils/exportUtils';

// Sample activity images for quick demonstration
const SAMPLE_ACTIVITY_IMAGES = [
  {
    name: 'งานตรวจรับพัสดุและผิวจราจร.jpg',
    url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18615f3?auto=format&fit=crop&w=800&q=80',
    title: 'งานตรวจรับพัสดุและผิวจราจร'
  },
  {
    name: 'งานติดตั้งระบบโคมไฟและพลังงานแสงอาทิตย์.jpg',
    url: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80',
    title: 'ติดตั้งระบบโซลาร์เซลล์'
  },
  {
    name: 'ลงพื้นที่ประชุมประชาคมรับฟังความคิดเห็น.jpg',
    url: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=800&q=80',
    title: 'ประชุมรับฟังความคิดเห็นชุมชน'
  },
  {
    name: 'งานปรับปรุงภูมิทัศน์และสวนสาธารณะ.jpg',
    url: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=800&q=80',
    title: 'ปรับปรุงภูมิทัศน์และสวนสุขภาพ'
  }
];

interface ProjectTrackingViewProps {
  trackingItems: ProjectTrackingItem[];
  allProjects: ProjectData[];
  onSaveTrackingItems: (items: ProjectTrackingItem[]) => void;
  onOpenProjectDetail?: (project: ProjectData) => void;
}

// Helper: Format clean number with comma separation and no "บาท" or "฿"
const formatCleanNumber = (val: number | null | undefined): string => {
  if (val === null || val === undefined || isNaN(val)) return '0';
  return Math.round(val).toLocaleString('th-TH');
};

export const ProjectTrackingView: React.FC<ProjectTrackingViewProps> = ({
  trackingItems,
  allProjects,
  onSaveTrackingItems,
  onOpenProjectDetail
}) => {
  // 1. Filter States
  const [selectedYear, setSelectedYear] = useState<string>('2571');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // 2. Modals state
  const [editingItem, setEditingItem] = useState<ProjectTrackingItem | null>(null);
  const [viewingItem, setViewingItem] = useState<ProjectTrackingItem | null>(null);
  const [saveSuccessToast, setSaveSuccessToast] = useState<string | null>(null);

  // 3. Form state for the Update Progress Form (ฟอร์มบันทึกผลการดำเนินงาน)
  const [formData, setFormData] = useState<{
    executionDate: string;
    status: TrackingStatus;
    progressPercent: number;
    disbursedAmount: number;
    progressSummary: string;
    obstacles: string;
    satisfactionLevel: string;
    attachmentName: string;
    attachmentUrl: string;
    activityImages: string[];
  }>({
    executionDate: '',
    status: 'not_started',
    progressPercent: 0,
    disbursedAmount: 0,
    progressSummary: '',
    obstacles: '',
    satisfactionLevel: 'มากที่สุด (85% - 100%)',
    attachmentName: '',
    attachmentUrl: '',
    activityImages: []
  });

  // 4. Unified Tracking Data:
  // Shows all projects that have received approved budget (งบประมาณที่อนุมัติแล้ว)
  // Merged with tracking records so every approved project is displayed and editable
  const unifiedTrackingList = useMemo(() => {
    // Collect projects that have received approved budget
    const approvedProjects = allProjects.filter(
      (p) => p.status === 'approved' || (p.budgetApproved && p.budgetApproved > 0)
    );

    // Create a map of existing tracking items by projectId or id or name
    const trackingMap = new Map<string, ProjectTrackingItem>();
    trackingItems.forEach((t) => {
      if (t.projectId) trackingMap.set(t.projectId, t);
      trackingMap.set(t.id, t);
      trackingMap.set(t.name, t);
    });

    const result: ProjectTrackingItem[] = [];
    const processedIds = new Set<string>();

    // First, map through all approved projects
    approvedProjects.forEach((proj, idx) => {
      processedIds.add(proj.id);
      const existing =
        trackingMap.get(proj.id) ||
        (proj.code ? trackingMap.get(proj.code) : undefined) ||
        trackingMap.get(proj.name);

      if (existing) {
        result.push({
          ...existing,
          projectId: proj.id,
          name: proj.name,
          code: proj.code || existing.code,
          department: proj.department || existing.department,
          year: proj.year || existing.year || '2571',
          budgetApproved:
            existing.budgetApproved > 0
              ? existing.budgetApproved
              : proj.budgetApproved > 0
              ? proj.budgetApproved
              : proj.budgetPlan,
          activityImages: existing.activityImages || []
        });
      } else {
        // Derive initial status from project data
        let initialStatus: TrackingStatus = 'not_started';
        let initialDisbursed = 0;
        let initialProgress = 0;

        if (proj.executionStatus === 'completed') {
          initialStatus = 'completed';
          initialDisbursed = proj.budgetApproved;
          initialProgress = 100;
        } else if (proj.executionStatus === 'in_progress') {
          initialStatus = 'in_progress';
          initialDisbursed = Math.round(proj.budgetApproved * 0.5);
          initialProgress = 50;
        } else if (proj.executionStatus === 'cancelled') {
          initialStatus = 'cancelled';
          initialDisbursed = 0;
          initialProgress = 0;
        }

        result.push({
          id: `TRK-${proj.id}`,
          projectId: proj.id,
          orderNumber: idx + 1,
          code: proj.code,
          name: proj.name,
          planStrategy: proj.planStrategy,
          planCategory: proj.planCategory,
          objective: proj.objective || '',
          target: proj.target || '',
          department: proj.department,
          budgetSource: proj.budgetSource || 'เทศบัญญัติงบประมาณรายจ่าย',
          budgetApproved: proj.budgetApproved > 0 ? proj.budgetApproved : proj.budgetPlan,
          contractBudget: null,
          disbursedAmount: initialDisbursed,
          progressPercent: initialProgress,
          status: initialStatus,
          year: proj.year || '2571',
          startDate: proj.approvedDate || '2026-09-02',
          executionDate: proj.approvedDate || new Date().toISOString().split('T')[0],
          progressSummary: proj.executionProgressNote || '',
          obstacles: '',
          satisfactionLevel: 'มากที่สุด (85% - 100%)',
          activityImages: []
        });
      }
    });

    // Also include any standalone tracking items that weren't in approvedProjects
    trackingItems.forEach((t) => {
      if (t.projectId && processedIds.has(t.projectId)) return;
      if (processedIds.has(t.id)) return;
      result.push(t);
    });

    return result;
  }, [allProjects, trackingItems]);

  // 5. Filtered items based on user selections
  const filteredItems = useMemo(() => {
    return unifiedTrackingList.filter((item) => {
      // Filter Year
      if (selectedYear !== 'all' && item.year !== selectedYear) return false;
      // Filter Department
      if (selectedDepartment && item.department !== selectedDepartment) return false;
      // Filter Status
      if (selectedStatus && item.status !== selectedStatus) return false;
      // Filter Keyword
      if (searchKeyword.trim()) {
        const kw = searchKeyword.toLowerCase().trim();
        const matchName = item.name.toLowerCase().includes(kw);
        const matchCode = (item.code || '').toLowerCase().includes(kw);
        const matchDept = item.department.toLowerCase().includes(kw);
        const matchSummary = (item.progressSummary || '').toLowerCase().includes(kw);
        if (!matchName && !matchCode && !matchDept && !matchSummary) return false;
      }
      return true;
    });
  }, [unifiedTrackingList, selectedYear, selectedDepartment, selectedStatus, searchKeyword]);

  // 6. Summary KPI Calculations
  const totalProjectsCount = filteredItems.length;
  const totalApprovedBudget = useMemo(() => {
    return filteredItems.reduce((acc, curr) => acc + (curr.budgetApproved || 0), 0);
  }, [filteredItems]);

  const totalDisbursedBudget = useMemo(() => {
    return filteredItems.reduce((acc, curr) => acc + (curr.disbursedAmount || 0), 0);
  }, [filteredItems]);

  const overallDisbursementRate = totalApprovedBudget > 0
    ? ((totalDisbursedBudget / totalApprovedBudget) * 100).toFixed(1)
    : '0.0';

  const countCompleted = useMemo(() => {
    return filteredItems.filter((i) => i.status === 'completed').length;
  }, [filteredItems]);

  const countInProgress = useMemo(() => {
    return filteredItems.filter((i) => i.status === 'in_progress').length;
  }, [filteredItems]);

  const countNotStarted = useMemo(() => {
    return filteredItems.filter((i) => i.status === 'not_started').length;
  }, [filteredItems]);

  const countCancelled = useMemo(() => {
    return filteredItems.filter((i) => i.status === 'cancelled').length;
  }, [filteredItems]);

  const countPendingOrDelayed = useMemo(() => {
    return filteredItems.filter(
      (i) => i.status === 'not_started' || i.status === 'cancelled' || i.status === 'delayed'
    ).length;
  }, [filteredItems]);

  // Handle open Edit/Update Progress Modal
  const handleOpenUpdateForm = (item: ProjectTrackingItem) => {
    setEditingItem(item);
    setFormData({
      executionDate: item.executionDate || new Date().toISOString().split('T')[0],
      status: item.status || 'not_started',
      progressPercent: item.progressPercent || 0,
      disbursedAmount: item.disbursedAmount || 0,
      progressSummary: item.progressSummary || '',
      obstacles: item.obstacles || '',
      satisfactionLevel: item.satisfactionLevel || 'มากที่สุด (85% - 100%)',
      attachmentName: item.attachmentName || '',
      attachmentUrl: item.attachmentUrl || '',
      activityImages: item.activityImages || []
    });
  };

  // Handle Save Update Progress Form
  const handleSaveProgress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    let finalProgress = formData.progressPercent;
    if (formData.status === 'completed' && finalProgress < 100) {
      finalProgress = 100;
    } else if (formData.status === 'not_started') {
      finalProgress = 0;
    }

    const updatedItem: ProjectTrackingItem = {
      ...editingItem,
      executionDate: formData.executionDate,
      status: formData.status,
      disbursedAmount: formData.disbursedAmount,
      progressPercent: finalProgress,
      progressSummary: formData.progressSummary,
      obstacles: formData.obstacles,
      satisfactionLevel: formData.satisfactionLevel,
      attachmentName: formData.attachmentName,
      attachmentUrl: formData.attachmentUrl,
      activityImages: formData.activityImages,
      note: formData.progressSummary || editingItem.note
    };

    // Update in trackingItems list
    const existingIndex = trackingItems.findIndex(
      (t) =>
        t.id === updatedItem.id ||
        (t.projectId && t.projectId === updatedItem.projectId) ||
        t.name === updatedItem.name
    );

    let nextTrackingItems: ProjectTrackingItem[];
    if (existingIndex >= 0) {
      nextTrackingItems = [...trackingItems];
      nextTrackingItems[existingIndex] = updatedItem;
    } else {
      nextTrackingItems = [updatedItem, ...trackingItems];
    }

    onSaveTrackingItems(nextTrackingItems);
    setEditingItem(null);

    // Show toast notification
    setSaveSuccessToast(`บันทึกผลการดำเนินงานโครงการ "${updatedItem.name}" เรียบร้อยแล้ว`);
    setTimeout(() => {
      setSaveSuccessToast(null);
    }, 4000);
  };

  // Helper for Status Badge styling (Badges: "ยังไม่เริ่ม", "กำลังดำเนินการ", "เสร็จสิ้น", "ยกเลิก/ชะลอ")
  const renderStatusBadge = (status: TrackingStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            เสร็จสิ้น
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            กำลังดำเนินการ
          </span>
        );
      case 'cancelled':
      case 'delayed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-300 shadow-2xs whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            ยกเลิก/ชะลอ
          </span>
        );
      case 'not_started':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            ยังไม่เริ่ม
          </span>
        );
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedYear('2571');
    setSelectedDepartment('');
    setSelectedStatus('');
    setSearchKeyword('');
  };

  // Export to Excel (.xlsx)
  const handleExportExcel = () => {
    const headers = [
      'ที่',
      'ชื่อโครงการ',
      'หน่วยงานรับผิดชอบ',
      'งบประมาณจัดสรร (บาท)',
      'งบเบิกจ่ายจริง (บาท)',
      'สถานะการดำเนินงาน',
      'วันที่ดำเนินการ',
      'ผลการดำเนินงาน',
      'ปัญหาและอุปสรรค',
      'ความพึงพอใจของประชาชน'
    ];

    const rows = filteredItems.map((item, idx) => {
      const statusText =
        item.status === 'completed'
          ? 'เสร็จสิ้น'
          : item.status === 'in_progress'
          ? 'อยู่ระหว่างดำเนินการ'
          : item.status === 'cancelled'
          ? 'ยกเลิก'
          : 'ยังไม่ดำเนินการ';

      return [
        idx + 1,
        item.name,
        item.department,
        item.budgetApproved || 0,
        item.disbursedAmount || 0,
        statusText,
        item.executionDate || item.startDate || '',
        item.progressSummary || '',
        item.obstacles || '',
        item.satisfactionLevel || '-'
      ];
    });

    exportTableToExcel({
      filename: `รายงานติดตามและประเมินผลโครงการ_พศ_${selectedYear}_เทศบาลเมืองศิลา`,
      title: 'รายงานติดตามและประเมินผลโครงการ เทศบาลเมืองศิลา',
      subTitle: `ปีงบประมาณ พ.ศ. ${selectedYear} | รวม ${filteredItems.length} โครงการ`,
      headers,
      rows
    });
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'ที่',
      'ชื่อโครงการ',
      'หน่วยงานรับผิดชอบ',
      'งบตั้ง (บาท)',
      'งบใช้จริง (บาท)',
      'สถานะการดำเนินงาน',
      'วันที่ดำเนินการ',
      'ผลการดำเนินงาน',
      'ปัญหาและอุปสรรค',
      'ความพึงพอใจของประชาชน'
    ];

    const rows = filteredItems.map((item, idx) => {
      const statusText =
        item.status === 'completed'
          ? 'เสร็จสิ้น'
          : item.status === 'in_progress'
          ? 'อยู่ระหว่างดำเนินการ'
          : item.status === 'cancelled'
          ? 'ยกเลิก'
          : 'ยังไม่ดำเนินการ';

      return [
        idx + 1,
        `"${item.name.replace(/"/g, '""')}"`,
        `"${item.department}"`,
        item.budgetApproved || 0,
        item.disbursedAmount || 0,
        `"${statusText}"`,
        `"${item.executionDate || item.startDate || ''}"`,
        `"${(item.progressSummary || '').replace(/"/g, '""')}"`,
        `"${(item.obstacles || '').replace(/"/g, '""')}"`,
        `"${item.satisfactionLevel || '-'}"`
      ];
    });

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `รายงานติดตามและประเมินผลโครงการ_พศ_${selectedYear}_เทศบาลเมืองศิลา.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 font-['Prompt',sans-serif]">
      {/* Toast Notification */}
      {saveSuccessToast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 bg-emerald-900 text-white rounded-xl shadow-xl border border-emerald-700 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
          <span className="text-sm font-semibold">{saveSuccessToast}</span>
          <button
            type="button"
            onClick={() => setSaveSuccessToast(null)}
            className="p-1 hover:bg-emerald-800 rounded-lg text-emerald-200 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Content Container */}
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Header Title Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-linear-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white shadow-md shrink-0">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
                  ระบบติดตามและประเมินผลโครงการ
                </h1>
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Project Monitoring & Evaluation
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                เทศบาลเมืองศิลา อำเภอเมืองขอนแก่น จังหวัดขอนแก่น • บันทึกผลงานจริง ความก้าวหน้า และการเบิกจ่ายงบประมาณ
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0 self-start md:self-center flex-wrap">
            <button
              type="button"
              id="btn-export-tracking-excel"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 rounded-xl shadow-2xs transition-colors cursor-pointer"
              title="ส่งออกรายงานเป็นไฟล์ Excel (.xlsx) ทันที"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>ส่งออก Excel</span>
            </button>
            <button
              type="button"
              id="btn-export-tracking-csv"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl shadow-2xs transition-colors cursor-pointer"
              title="ส่งออกรายงานเป็นไฟล์ CSV ทันที"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>ส่งออก CSV</span>
            </button>
            <button
              type="button"
              id="btn-print-tracking-report"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-bold text-white bg-linear-to-r from-emerald-700 to-teal-800 hover:from-emerald-800 hover:to-teal-900 rounded-xl shadow-sm transition-colors cursor-pointer"
              title="สั่งพิมพ์รายงาน หรือบันทึกเป็น PDF"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์รายงาน</span>
            </button>
          </div>
        </div>

        {/* SECTION 3: Summary KPI / Filter Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Filter className="w-4 h-4 text-emerald-700" />
            <h2 className="text-sm font-bold text-slate-800">
              ตัวกรองข้อมูลโครงการ
            </h2>
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* 1. เลือกปีงบประมาณ */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                เลือกปีงบประมาณ
              </label>
              <div className="relative">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full appearance-none pl-3.5 pr-9 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer min-h-[42px]"
                >
                  <option value="2571">ปีงบประมาณ พ.ศ. 2571</option>
                  <option value="2572">ปีงบประมาณ พ.ศ. 2572</option>
                  <option value="2573">ปีงบประมาณ พ.ศ. 2573</option>
                  <option value="2574">ปีงบประมาณ พ.ศ. 2574</option>
                  <option value="2575">ปีงบประมาณ พ.ศ. 2575</option>
                  <option value="all">ทุกปีงบประมาณ (2571 - 2575)</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* 2. สำนัก / กอง */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                สำนัก / กอง
              </label>
              <div className="relative">
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full appearance-none pl-3.5 pr-9 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer truncate min-h-[42px]"
                >
                  <option value="">ทุกสำนัก / กอง</option>
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* 3. สถานะโครงการ */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                สถานะการดำเนินงาน
              </label>
              <div className="relative">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full appearance-none pl-3.5 pr-9 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer min-h-[42px]"
                >
                  <option value="">ทุกสถานะ</option>
                  <option value="not_started">⚪ ยังไม่เริ่ม</option>
                  <option value="in_progress">🟡 กำลังดำเนินการ</option>
                  <option value="completed">🟢 เสร็จสิ้น</option>
                  <option value="cancelled">🔴 ยกเลิก/ชะลอ</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* 4. ค้นหาชื่อโครงการ */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                ค้นหาโครงการ
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="ค้นหาชื่อโครงการ, รหัส..."
                  className="w-full pl-9 pr-9 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[42px]"
                />
                {searchKeyword && (
                  <button
                    type="button"
                    onClick={() => setSearchKeyword('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Filter Action Bar */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 flex-wrap gap-2 text-xs">
            <div className="text-slate-600 font-medium">
              พบข้อมูลโครงการที่อนุมัติงบประมาณ{' '}
              <span className="font-bold text-emerald-800 font-mono text-sm">
                {filteredItems.length}
              </span>{' '}
              โครงการ
            </div>
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>ล้างตัวกรองทั้งหมด</span>
            </button>
          </div>
        </div>

        {/* 5 Project Status KPI Cards (ตามข้อกำหนด: โครงการทั้งหมด, อยู่ระหว่างดำเนินการ, เสร็จสิ้น, ยังไม่ได้ดำเนินการ/ล่าช้า, % เบิกจ่าย) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Card 1: โครงการทั้งหมดในแผน */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600">
              <span>โครงการทั้งหมดในแผน</span>
              <span className="p-1 rounded-md bg-slate-100 text-slate-500">
                <Activity className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between">
              <span className="text-2xl lg:text-3xl font-black font-mono text-slate-900">
                {totalProjectsCount}
              </span>
              <span className="text-xs font-bold text-slate-500">โครงการ</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
              <span>ปีงบ {selectedYear === 'all' ? '2571-2575' : selectedYear}</span>
            </div>
          </div>

          {/* Card 2: อยู่ระหว่างดำเนินการ (In Progress) */}
          <div className="bg-white border border-amber-200/80 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between text-xs font-bold text-amber-800">
              <span>อยู่ระหว่างดำเนินการ</span>
              <span className="p-1 rounded-md bg-amber-100 text-amber-600">
                <Clock className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between">
              <span className="text-2xl lg:text-3xl font-black font-mono text-amber-900">
                {countInProgress}
              </span>
              <span className="text-xs font-bold text-amber-700 font-mono">
                {totalProjectsCount > 0 ? `${Math.round((countInProgress / totalProjectsCount) * 100)}%` : '0%'}
              </span>
            </div>
            <div className="mt-2 text-[11px] text-amber-700 font-medium">
              In Progress • กำลังเร่งรัดดำเนินงาน
            </div>
          </div>

          {/* Card 3: ดำเนินการแล้วเสร็จ (Completed) */}
          <div className="bg-white border border-emerald-200/80 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-800">
              <span>ดำเนินการแล้วเสร็จ</span>
              <span className="p-1 rounded-md bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between">
              <span className="text-2xl lg:text-3xl font-black font-mono text-emerald-800">
                {countCompleted}
              </span>
              <span className="text-xs font-bold text-emerald-700 font-mono">
                {totalProjectsCount > 0 ? `${Math.round((countCompleted / totalProjectsCount) * 100)}%` : '0%'}
              </span>
            </div>
            <div className="mt-2 text-[11px] text-emerald-700 font-medium">
              Completed • ดำเนินการเรียบร้อยแล้ว
            </div>
          </div>

          {/* Card 4: ยังไม่ได้ดำเนินการ / ล่าช้า (Pending / Delayed) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>ยังไม่ได้ดำเนินการ / ล่าช้า</span>
              <span className="p-1 rounded-md bg-slate-100 text-slate-600">
                <AlertTriangle className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between">
              <span className="text-2xl lg:text-3xl font-black font-mono text-slate-800">
                {countPendingOrDelayed}
              </span>
              <span className="text-xs font-bold text-slate-500 font-mono">
                {totalProjectsCount > 0 ? `${Math.round((countPendingOrDelayed / totalProjectsCount) * 100)}%` : '0%'}
              </span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500 font-medium">
              Pending / Delayed • รอเริ่มงาน / ชะลอ
            </div>
          </div>

          {/* Card 5: เปอร์เซ็นต์ความก้าวหน้าการเบิกจ่ายงบประมาณรวม (%) */}
          <div className="bg-white border border-sky-200/80 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between text-xs font-bold text-sky-800">
              <span>เบิกจ่ายงบประมาณรวม</span>
              <span className="p-1 rounded-md bg-sky-100 text-sky-600">
                <TrendingUp className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between">
              <span className="text-2xl lg:text-3xl font-black font-mono text-sky-900">
                {overallDisbursementRate}%
              </span>
              <span className="text-xs font-bold text-sky-700">ความก้าวหน้า</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden border border-slate-200">
              <div
                className="bg-linear-to-r from-sky-500 to-teal-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, parseFloat(overallDisbursementRate)))}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Secondary Budget Metric Bar */}
        <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-xl px-4 py-2.5 flex items-center justify-between flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-2">
            <CircleDollarSign className="w-4 h-4 text-emerald-700" />
            <span className="font-bold text-slate-800">สรุปการเงินและงบประมาณโครงการ:</span>
          </div>
          <div className="flex items-center gap-4 sm:gap-6 flex-wrap font-mono">
            <span>
              งบประมาณที่ได้รับจัดสรร:{' '}
              <strong className="text-slate-900 font-bold">{formatCleanNumber(totalApprovedBudget)}</strong>
            </span>
            <span className="text-slate-300">•</span>
            <span>
              งบประมาณเบิกจ่ายจริง:{' '}
              <strong className="text-emerald-800 font-bold">{formatCleanNumber(totalDisbursedBudget)}</strong>
            </span>
            <span className="text-slate-300">•</span>
            <span>
              คงเหลือ:{' '}
              <strong className="text-amber-800 font-bold">
                {formatCleanNumber(Math.max(0, totalApprovedBudget - totalDisbursedBudget))}
              </strong>
            </span>
          </div>
        </div>

        {/* SECTION 1: หน้าตารางติดตามโครงการหลัก (Main Monitoring Table) */}
        {/* คอลัมน์: [รหัสโครงการ] | [ชื่อโครงการ / กองที่รับผิดชอบ] | [งบประมาณที่ได้รับจัดสรร] | [งบประมาณเบิกจ่ายจริง] | [ความก้าวหน้า (% Progress Bar)] | [สถานะการดำเนินงาน] | [การจัดการ] */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-700" />
              <h2 className="text-base font-bold text-slate-900">
                ตารางติดตามความก้าวหน้ารายโครงการ
              </h2>
            </div>
            <div className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              แสดงผล {filteredItems.length} รายการ
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#054e3b] text-white text-xs font-bold sticky top-0 z-10 border-b border-emerald-800">
                  {/* 1. [รหัสโครงการ] */}
                  <th className="py-3.5 px-3 text-center min-w-[120px]">รหัสโครงการ</th>

                  {/* 2. [ชื่อโครงการ / กองที่รับผิดชอบ] */}
                  <th className="py-3.5 px-4 min-w-[280px]">ชื่อโครงการ / กองที่รับผิดชอบ</th>

                  {/* 3. [งบประมาณที่ได้รับจัดสรร] */}
                  <th className="py-3.5 px-4 text-right min-w-[140px]">
                    งบประมาณที่ได้รับจัดสรร
                  </th>

                  {/* 4. [งบประมาณเบิกจ่ายจริง] */}
                  <th className="py-3.5 px-4 text-right min-w-[140px]">
                    งบประมาณเบิกจ่ายจริง
                  </th>

                  {/* 5. [ความก้าวหน้า (% Progress Bar)] */}
                  <th className="py-3.5 px-4 text-center min-w-[170px]">
                    ความก้าวหน้า (% Progress Bar)
                  </th>

                  {/* 6. [สถานะการดำเนินงาน] */}
                  <th className="py-3.5 px-4 text-center min-w-[140px]">
                    สถานะการดำเนินงาน
                  </th>

                  {/* 7. [การจัดการ] */}
                  <th className="py-3.5 px-4 text-center min-w-[160px]">
                    การจัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Activity className="w-8 h-8 text-slate-300" />
                        <span className="text-sm font-medium">
                          ไม่พบรายการโครงการตามเงื่อนไขที่เลือก
                        </span>
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="mt-1 text-xs text-emerald-700 hover:underline font-semibold cursor-pointer"
                        >
                          ล้างตัวกรองเพื่อดูทั้งหมด
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item, idx) => {
                    const displayCode = item.code || getProjectDisplayId(item);
                    return (
                      <tr
                        key={item.id || idx}
                        className="hover:bg-emerald-50/30 transition-colors group"
                      >
                        {/* 1. [รหัสโครงการ] */}
                        <td className="py-3.5 px-3 text-center whitespace-nowrap">
                          <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 text-xs inline-block">
                            {displayCode}
                          </span>
                        </td>

                        {/* 2. [ชื่อโครงการ / กองที่รับผิดชอบ] */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 group-hover:text-emerald-950 leading-snug">
                            {item.name}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1 flex-wrap">
                            <span className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              <Building2 className="w-3 h-3 text-slate-500" />
                              {item.department || '-'}
                            </span>
                            <span className="text-slate-400">•</span>
                            <span className="text-slate-600">
                              พ.ศ. {item.year || '2571'}
                            </span>
                            {item.executionDate && (
                              <>
                                <span className="text-slate-400">•</span>
                                <span className="text-slate-500">
                                  อัปเดต: {item.executionDate}
                                </span>
                              </>
                            )}
                            {item.activityImages && item.activityImages.length > 0 && (
                              <span className="inline-flex items-center gap-1 text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                                <ImageIcon className="w-3 h-3 text-sky-600" />
                                {item.activityImages.length} ภาพ
                              </span>
                            )}
                          </div>
                          {item.progressSummary && (
                            <div className="text-[11px] text-emerald-800 bg-emerald-50/60 p-1.5 rounded-md mt-1.5 border border-emerald-100 line-clamp-1">
                              <span className="font-semibold">ความก้าวหน้า:</span> {item.progressSummary}
                            </div>
                          )}
                        </td>

                        {/* 3. [งบประมาณที่ได้รับจัดสรร] */}
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                          {formatCleanNumber(item.budgetApproved)}
                        </td>

                        {/* 4. [งบประมาณเบิกจ่ายจริง] */}
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-800 whitespace-nowrap">
                          {formatCleanNumber(item.disbursedAmount)}
                        </td>

                        {/* 5. [ความก้าวหน้า (% Progress Bar)] */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex flex-col gap-1 w-full max-w-[150px] mx-auto">
                            <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-700">
                              <span>ความก้าวหน้า</span>
                              <span className={item.progressPercent >= 100 ? 'text-emerald-700' : 'text-slate-800'}>
                                {item.progressPercent || 0}%
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  item.progressPercent >= 100
                                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600'
                                    : item.progressPercent >= 50
                                    ? 'bg-gradient-to-r from-sky-500 to-blue-600'
                                    : item.progressPercent > 0
                                    ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                                    : 'bg-slate-300'
                                }`}
                                style={{ width: `${Math.min(100, Math.max(0, item.progressPercent || 0))}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* 6. [สถานะการดำเนินงาน] (Badges: "ยังไม่เริ่ม", "กำลังดำเนินการ", "เสร็จสิ้น", "ยกเลิก/ชะลอ") */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {renderStatusBadge(item.status)}
                        </td>

                        {/* 7. [การจัดการ] (ปุ่ม [อัปเดตความก้าวหน้า] และ [ดูรายละเอียด]) */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* ปุ่ม อัปเดตความก้าวหน้า */}
                            <button
                              type="button"
                              onClick={() => handleOpenUpdateForm(item)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-2xs hover:shadow-xs transition-all cursor-pointer whitespace-nowrap"
                              title="บันทึกผลการดำเนินงาน ปัญหา/อุปสรรค และอัปโหลดภาพกิจกรรม"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>อัปเดตความก้าวหน้า</span>
                            </button>

                            {/* ปุ่ม ดูรายละเอียด */}
                            <button
                              type="button"
                              onClick={() => setViewingItem(item)}
                              className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                              title="ดูรายละเอียดข้อมูลติดตาม"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* Table Footer: Clean Total Row */}
              {filteredItems.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-100/90 font-bold text-slate-900 border-t-2 border-slate-300 text-xs sm:text-sm">
                    <td colSpan={2} className="py-3.5 px-4 text-right font-bold text-slate-800">
                      รวมทั้งสิ้น ({filteredItems.length} โครงการ)
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-950">
                      {formatCleanNumber(totalApprovedBudget)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-800">
                      {formatCleanNumber(totalDisbursedBudget)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-mono text-xs font-bold text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded border border-emerald-200">
                        เบิกจ่าย {overallDisbursementRate}%
                      </span>
                    </td>
                    <td colSpan={2} className="py-3.5 px-4 text-center font-mono text-xs text-slate-600">
                      คงเหลือ: {formatCleanNumber(Math.max(0, totalApprovedBudget - totalDisbursedBudget))}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>

      {/* SECTION 2: ฟอร์มป๊อปอัป / หน้าบันทึกผลการดำเนินงาน (Update Progress Form) */}
      {editingItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 my-auto flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-sky-700 via-teal-700 to-emerald-800 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0 border border-white/20">
                  <Activity className="w-5 h-5 text-sky-200" />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-white leading-tight">
                    อัปเดตความก้าวหน้าโครงการ (ผ.03)
                  </h3>
                  <p className="text-xs text-sky-100 mt-0.5">
                    บันทึกผลการดำเนินงาน ปัญหา/อุปสรรค และอัปโหลดรูปภาพกิจกรรม
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="btn-print-editing-item"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  title="พิมพ์เฉพาะเนื้อหาในหน้ารายละเอียดนี้ออกทางเครื่องพิมพ์"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>พิมพ์หน้านี้</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="p-1.5 rounded-lg text-sky-100 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="ปิด"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Context Card: Project Name & Budget */}
            <div className="bg-slate-50 p-4 px-6 border-b border-slate-200 text-xs space-y-1.5 shrink-0">
              <div className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                {editingItem.name}
              </div>
              <div className="flex items-center gap-4 text-slate-600 flex-wrap">
                <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700 font-bold">
                  รหัส: {editingItem.code || getProjectDisplayId(editingItem)}
                </span>
                <span>•</span>
                <span>
                  <strong className="text-slate-700">หน่วยงาน:</strong> {editingItem.department}
                </span>
                <span>•</span>
                <span>
                  <strong className="text-slate-700">ปีงบประมาณ:</strong> พ.ศ. {editingItem.year || '2571'}
                </span>
                <span>•</span>
                <span className="font-mono text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  งบจัดสรร: {formatCleanNumber(editingItem.budgetApproved)}
                </span>
              </div>
            </div>

            {/* Form Fields - Scrollable body */}
            <form onSubmit={handleSaveProgress} className="p-5 sm:p-6 space-y-4 text-xs sm:text-sm overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. วันที่รายงาน / ดำเนินการ (Date Picker) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    1. วันที่รายงาน / ดำเนินการ <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      required
                      value={formData.executionDate}
                      onChange={(e) =>
                        setFormData({ ...formData, executionDate: e.target.value })
                      }
                      className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                    />
                  </div>
                </div>

                {/* 2. สถานะโครงการ (Dropdown 4 ระดับ: ยังไม่เริ่ม, กำลังดำเนินการ, เสร็จสิ้น, ยกเลิก/ชะลอ) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    2. สถานะการดำเนินงาน <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={formData.status}
                      onChange={(e) => {
                        const nextStatus = e.target.value as TrackingStatus;
                        let nextProgress = formData.progressPercent;
                        if (nextStatus === 'completed' && nextProgress < 100) nextProgress = 100;
                        if (nextStatus === 'not_started') nextProgress = 0;
                        setFormData({
                          ...formData,
                          status: nextStatus,
                          progressPercent: nextProgress
                        });
                      }}
                      className="w-full appearance-none pl-3.5 pr-9 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                    >
                      <option value="not_started">⚪ ยังไม่เริ่ม</option>
                      <option value="in_progress">🟡 กำลังดำเนินการ</option>
                      <option value="completed">🟢 เสร็จสิ้น</option>
                      <option value="cancelled">🔴 ยกเลิก/ชะลอ</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* 3. ความก้าวหน้า (% Progress Bar Slider) */}
              <div className="bg-sky-50/60 border border-sky-200/80 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    3. ความก้าวหน้าโครงการ (% Progress) <span className="text-rose-500">*</span>
                  </label>
                  <span className="font-mono text-sm font-bold text-sky-800 bg-white px-2 py-0.5 rounded border border-sky-300">
                    {formData.progressPercent}%
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.progressPercent}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10) || 0;
                      let nextStatus = formData.status;
                      if (val >= 100) nextStatus = 'completed';
                      else if (val > 0 && nextStatus === 'not_started') nextStatus = 'in_progress';
                      setFormData({ ...formData, progressPercent: val, status: nextStatus });
                    }}
                    className="w-full accent-sky-600 cursor-pointer"
                  />
                  <div className="flex items-center gap-1 shrink-0">
                    {[0, 25, 50, 75, 100].map((step) => (
                      <button
                        key={step}
                        type="button"
                        onClick={() => {
                          let nextStatus = formData.status;
                          if (step >= 100) nextStatus = 'completed';
                          else if (step === 0) nextStatus = 'not_started';
                          else if (nextStatus === 'not_started') nextStatus = 'in_progress';
                          setFormData({ ...formData, progressPercent: step, status: nextStatus });
                        }}
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                          formData.progressPercent === step
                            ? 'bg-sky-600 text-white border-sky-600 font-bold'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {step}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 4. งบประมาณเบิกจ่ายจริง (บาท) */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    4. งบประมาณเบิกจ่ายจริง (บาท) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] font-mono text-slate-500">
                    งบประมาณที่ได้รับจัดสรร: {formatCleanNumber(editingItem.budgetApproved)}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    value={formData.disbursedAmount || ''}
                    onChange={(e) => {
                      const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                      setFormData({ ...formData, disbursedAmount: isNaN(val) ? 0 : val });
                    }}
                    placeholder="0"
                    className="w-full px-3.5 py-2 text-sm sm:text-base font-mono font-bold bg-white border border-slate-300 rounded-xl text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                {/* Real-time calculation helper */}
                <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 font-mono">
                  <span>
                    คงเหลือ:{' '}
                    <strong className="text-amber-800">
                      {formatCleanNumber(
                        Math.max(0, (editingItem.budgetApproved || 0) - (formData.disbursedAmount || 0))
                      )}
                    </strong>
                  </span>
                  <span>
                    อัตราเบิกจ่าย:{' '}
                    <strong className="text-emerald-800">
                      {editingItem.budgetApproved > 0
                        ? `${((formData.disbursedAmount / editingItem.budgetApproved) * 100).toFixed(1)}%`
                        : '0%'}
                    </strong>
                  </span>
                </div>
              </div>

              {/* 5. บันทึกผลการดำเนินงาน / ความก้าวหน้า (Textarea) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  5. บันทึกผลการดำเนินงาน / ความก้าวหน้า
                </label>
                <textarea
                  rows={3}
                  value={formData.progressSummary}
                  onChange={(e) =>
                    setFormData({ ...formData, progressSummary: e.target.value })
                  }
                  placeholder="ระบุสรุปเนื้องานที่ทำเสร็จแล้ว เช่น เทพื้นคอนกรีตแล้วเสร็จ 100%, ติดตั้งอุปกรณ์เรียบร้อย, ส่งมอบงานงวดสุดท้าย..."
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 leading-relaxed"
                ></textarea>
              </div>

              {/* 6. ปัญหาและอุปสรรค (Textarea) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  6. ปัญหาและอุปสรรค (ถ้ามี)
                </label>
                <textarea
                  rows={2}
                  value={formData.obstacles}
                  onChange={(e) =>
                    setFormData({ ...formData, obstacles: e.target.value })
                  }
                  placeholder="ระบุปัญหาและอุปสรรคในการดำเนินงาน เช่น สภาพอากาศฝนตกชุกทำให้งานล่าช้า, การปรับย้ายแนวเสาไฟฟ้า..."
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 leading-relaxed"
                ></textarea>
              </div>

              {/* 7. อัปโหลดรูปภาพกิจกรรม (Activity Images Upload) */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-sky-600" />
                      <span>7. อัปโหลดรูปภาพกิจกรรมโครงการ</span>
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      เลือกไฟล์ภาพจากเครื่อง หรือเลือกภาพตัวอย่างกิจกรรมหน้างานจริง
                    </p>
                  </div>
                  {/* File upload input & quick sample button */}
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg cursor-pointer transition-colors shadow-2xs">
                      <Upload className="w-3.5 h-3.5" />
                      <span>เลือกไฟล์ภาพ</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const files = e.target.files;
                          if (!files || files.length === 0) return;
                          Array.from(files).forEach((file) => {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              if (event.target?.result) {
                                const dataUrl = event.target.result as string;
                                setFormData((prev) => ({
                                  ...prev,
                                  activityImages: [...prev.activityImages, dataUrl]
                                }));
                              }
                            };
                            reader.readAsDataURL(file);
                          });
                        }}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        const randomSample = SAMPLE_ACTIVITY_IMAGES[Math.floor(Math.random() * SAMPLE_ACTIVITY_IMAGES.length)];
                        if (!formData.activityImages.includes(randomSample.url)) {
                          setFormData((prev) => ({
                            ...prev,
                            activityImages: [...prev.activityImages, randomSample.url]
                          }));
                        }
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg cursor-pointer transition-colors"
                      title="เพิ่มภาพตัวอย่างกิจกรรมงานพัฒนาเทศบาล"
                    >
                      <Plus className="w-3 h-3 text-emerald-600" />
                      <span>ภาพตัวอย่าง</span>
                    </button>
                  </div>
                </div>

                {/* Images Preview Grid */}
                {formData.activityImages && formData.activityImages.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                    {formData.activityImages.map((imgUrl, imgIdx) => (
                      <div
                        key={imgIdx}
                        className="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-100 aspect-video shadow-2xs"
                      >
                        <img
                          src={imgUrl}
                          alt={`ภาพกิจกรรม ${imgIdx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              activityImages: prev.activityImages.filter((_, idx) => idx !== imgIdx)
                            }));
                          }}
                          className="absolute top-1 right-1 p-1 bg-rose-600/90 text-white rounded-md opacity-90 group-hover:opacity-100 hover:bg-rose-700 transition-opacity cursor-pointer shadow-xs"
                          title="ลบรูปภาพนี้"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border border-dashed border-slate-300 rounded-lg p-4 text-center text-slate-400 bg-white/60">
                    <ImageIcon className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                    <span className="text-xs">ยังไม่มีรูปภาพกิจกรรม สามารถคลิก [เลือกไฟล์ภาพ] หรือ [ภาพตัวอย่าง]</span>
                  </div>
                )}
              </div>

              {/* 8. แนบเอกสารหลักฐาน / เอกสารแนบ */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  8. แนบเอกสารหลักฐาน / เอกสารแนบ
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={formData.attachmentName}
                      onChange={(e) =>
                        setFormData({ ...formData, attachmentName: e.target.value })
                      }
                      placeholder="ชื่อไฟล์เอกสารหลักฐาน เช่น ใบตรวจรับงานจ้าง, รายงานผลโครงการ.pdf"
                      className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 truncate"
                    />
                    <Paperclip className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const samples = [
                        'รายงานผลการตรวจรับงานจ้าง_งวดสุดท้าย.pdf',
                        'บันทึกข้อความสรุปผลการดำเนินโครงการ.pdf',
                        'เอกสารส่งมอบงาน_กองช่าง.pdf'
                      ];
                      const randomSample = samples[Math.floor(Math.random() * samples.length)];
                      setFormData({
                        ...formData,
                        attachmentName: randomSample,
                        attachmentUrl: '#'
                      });
                    }}
                    className="px-2.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-colors cursor-pointer shrink-0 flex items-center gap-1"
                    title="เลือกตัวอย่างเอกสาร"
                  >
                    <Upload className="w-3.5 h-3.5 text-sky-700" />
                    <span>แนบเอกสาร</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons: [บันทึกข้อมูล] และ [ยกเลิก] */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-sky-600 via-teal-700 to-emerald-700 hover:from-sky-700 hover:to-emerald-800 rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>บันทึกข้อมูล</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Tracking Details (ดูรายละเอียดแบบสมบูรณ์) */}
      {viewingItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 my-auto">
            <div className="px-6 py-4 bg-[#054e3b] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-emerald-200" />
                <h3 className="font-bold text-base text-white">
                  รายละเอียดการติดตามและประเมินผลโครงการ
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="btn-print-viewing-item-top"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  title="พิมพ์เฉพาะเนื้อหาในหน้ารายละเอียดนี้ออกทางเครื่องพิมพ์"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>พิมพ์หน้านี้</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewingItem(null)}
                  className="text-emerald-100 hover:text-white cursor-pointer p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4 text-xs sm:text-sm max-h-[75vh] overflow-y-auto">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {viewingItem.code || getProjectDisplayId(viewingItem)}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-xs text-slate-600">พ.ศ. {viewingItem.year || '2571'}</span>
                </div>
                <h4 className="text-base font-bold text-slate-900 leading-snug">
                  {viewingItem.name}
                </h4>
                {viewingItem.planStrategy && (
                  <div className="text-xs text-emerald-800 mt-1 font-medium bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                    ยุทธศาสตร์: {viewingItem.planStrategy}
                  </div>
                )}
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 text-xs">หน่วยงานรับผิดชอบ</span>
                  <div className="font-bold text-slate-800 mt-0.5">
                    {viewingItem.department}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 text-xs">สถานะโครงการ</span>
                  <div className="mt-1">{renderStatusBadge(viewingItem.status)}</div>
                </div>
                <div>
                  <span className="text-slate-500 text-xs">งบประมาณที่ได้รับจัดสรร</span>
                  <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">
                    {formatCleanNumber(viewingItem.budgetApproved)}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 text-xs">งบประมาณเบิกจ่ายจริง</span>
                  <div className="font-mono font-bold text-emerald-700 text-sm mt-0.5">
                    {formatCleanNumber(viewingItem.disbursedAmount)}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 text-xs">ความก้าวหน้าโครงการ</span>
                  <div className="font-mono font-bold text-sky-800 text-sm mt-0.5">
                    {viewingItem.progressPercent || 0}%
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 text-xs">วันที่ดำเนินการล่าสุด</span>
                  <div className="font-mono text-slate-700 mt-0.5">
                    {viewingItem.executionDate || viewingItem.startDate || '-'}
                  </div>
                </div>
              </div>

              {/* Progress Summary */}
              {viewingItem.progressSummary && (
                <div>
                  <span className="text-xs text-slate-500 font-bold block">
                    ผลการดำเนินงาน / ความก้าวหน้า:
                  </span>
                  <p className="text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-200 mt-1 leading-relaxed">
                    {viewingItem.progressSummary}
                  </p>
                </div>
              )}

              {/* Obstacles */}
              {viewingItem.obstacles && (
                <div>
                  <span className="text-xs text-slate-500 font-bold block">
                    ปัญหาและอุปสรรค:
                  </span>
                  <p className="text-slate-800 bg-amber-50/50 p-3 rounded-xl border border-amber-200 mt-1 leading-relaxed">
                    {viewingItem.obstacles}
                  </p>
                </div>
              )}

              {/* Activity Images in View Modal */}
              {viewingItem.activityImages && viewingItem.activityImages.length > 0 && (
                <div>
                  <span className="text-xs text-slate-500 font-bold block mb-1.5 flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5 text-sky-600" />
                    <span>ภาพถ่ายกิจกรรมโครงการ ({viewingItem.activityImages.length} ภาพ):</span>
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {viewingItem.activityImages.map((img, i) => (
                      <div key={i} className="rounded-lg overflow-hidden border border-slate-200 aspect-video">
                        <img src={img} alt={`ภาพกิจกรรม ${i + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Attachment */}
              {viewingItem.attachmentName && (
                <div>
                  <span className="text-xs text-slate-500 font-bold block">
                    เอกสารหลักฐาน / เอกสารแนบ:
                  </span>
                  <div className="mt-1 flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-emerald-800 font-medium">
                    <Paperclip className="w-4 h-4 text-emerald-700" />
                    <span>{viewingItem.attachmentName}</span>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    id="btn-print-viewing-item-bottom"
                    onClick={() => window.print()}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer flex items-center gap-1.5 text-xs shadow-xs"
                    title="พิมพ์เฉพาะเนื้อหาในหน้ารายละเอียดนี้ออกทางเครื่องพิมพ์"
                  >
                    <Printer className="w-4 h-4" />
                    <span>พิมพ์หน้านี้</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const itemToEdit = viewingItem;
                      setViewingItem(null);
                      handleOpenUpdateForm(itemToEdit);
                    }}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold cursor-pointer flex items-center gap-1.5 text-xs"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>อัปเดตความก้าวหน้า</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingItem(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer text-xs"
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
