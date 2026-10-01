import React, { useState, useMemo } from 'react';
import {
  History,
  ShieldCheck,
  Search,
  Filter,
  Download,
  Printer,
  Calendar,
  User,
  Building2,
  CheckCircle2,
  AlertCircle,
  FileText,
  FileCode,
  FileEdit,
  CircleDollarSign,
  Activity,
  Layers,
  Sparkles,
  RefreshCw,
  Plus,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Clock,
  ArrowRight,
  Check,
  Share2,
  Cpu,
  Shield,
  FileSpreadsheet,
  TrendingUp,
  MapPin,
  Tag
} from 'lucide-react';
import { PlanAuditLogEntry, AuditLogCategory, UserAccount, ProjectData, PlanAnnouncement } from '../types';
import { storageService } from '../services/storage';
import { DEPARTMENTS } from '../utils/constants';

interface AuditLogViewProps {
  currentUser?: UserAccount | null;
  projects?: ProjectData[];
  announcements?: PlanAnnouncement[];
  onOpenProjectDetail?: (project: ProjectData) => void;
}

// Helper: Format Thai Date & Time string for display
const formatThaiTimestamp = (ts: string): string => {
  return ts;
};

// Helper: Action Badge & Color Mapping
const getActionMeta = (action: string) => {
  const act = action || '';
  if (act.includes('อนุมัติ')) {
    return {
      label: act,
      dotColor: 'bg-emerald-500',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      icon: CheckCircle2
    };
  }
  if (act.includes('ประกาศใช้')) {
    return {
      label: act,
      dotColor: 'bg-sky-500',
      badgeClass: 'bg-sky-50 text-sky-800 border-sky-200',
      icon: ShieldCheck
    };
  }
  if (act.includes('เปลี่ยนแปลง')) {
    return {
      label: act,
      dotColor: 'bg-amber-500',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
      icon: FileCode
    };
  }
  if (act.includes('แก้ไข')) {
    return {
      label: act,
      dotColor: 'bg-indigo-500',
      badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      icon: FileEdit
    };
  }
  if (act.includes('เพิ่ม')) {
    return {
      label: act,
      dotColor: 'bg-teal-500',
      badgeClass: 'bg-teal-50 text-teal-800 border-teal-200',
      icon: Plus
    };
  }
  if (act.includes('งบประมาณ')) {
    return {
      label: act,
      dotColor: 'bg-amber-600',
      badgeClass: 'bg-amber-50 text-amber-900 border-amber-300',
      icon: CircleDollarSign
    };
  }
  if (act.includes('ก้าวหน้า') || act.includes('ติดตาม')) {
    return {
      label: act,
      dotColor: 'bg-blue-500',
      badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
      icon: Activity
    };
  }
  if (act.includes('ซิงค์') || act.includes('สำรอง')) {
    return {
      label: act,
      dotColor: 'bg-purple-500',
      badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
      icon: Cpu
    };
  }
  return {
    label: act,
    dotColor: 'bg-slate-500',
    badgeClass: 'bg-slate-50 text-slate-800 border-slate-200',
    icon: History
  };
};

// Helper: Category metadata
const getCategoryMeta = (cat?: AuditLogCategory) => {
  switch (cat) {
    case 'plan_approval':
      return { label: 'อนุมัติ/ประกาศใช้แผน', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    case 'project_modification':
      return { label: 'แก้ไข/เปลี่ยนแปลงโครงการ', color: 'text-amber-800 bg-amber-50 border-amber-200' };
    case 'budget':
      return { label: 'อนุมัติงบประมาณ', color: 'text-amber-900 bg-amber-50 border-amber-300' };
    case 'tracking':
      return { label: 'ติดตามประเมินผล', color: 'text-sky-700 bg-sky-50 border-sky-200' };
    case 'system':
      return { label: 'กิจกรรมระบบ/ซิงค์', color: 'text-purple-700 bg-purple-50 border-purple-200' };
    default:
      return { label: 'ทั่วไป', color: 'text-slate-700 bg-slate-50 border-slate-200' };
  }
};

export const AuditLogView: React.FC<AuditLogViewProps> = ({
  currentUser,
  projects = [],
  announcements = [],
  onOpenProjectDetail
}) => {
  // Logs state from persistent storage
  const [logs, setLogs] = useState<PlanAuditLogEntry[]>(() => {
    return storageService.getPlanAuditLogs();
  });

  // Display mode: 'table' (ตารางทางการ) or 'timeline' (ไทม์ไลน์)
  const [viewMode, setViewMode] = useState<'table' | 'timeline'>('table');

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<string>('all');

  // Pagination states
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Selected Log for Deep Inspection Modal
  const [inspectLog, setInspectLog] = useState<PlanAuditLogEntry | null>(null);

  // Modal: Add New Official Administrative Record
  const [isAddRecordModalOpen, setIsAddRecordModalOpen] = useState(false);
  const [newLogData, setNewLogData] = useState({
    planName: '',
    action: 'อนุมัติ',
    category: 'plan_approval' as AuditLogCategory,
    actorName: currentUser?.fullName || 'เจ้าหน้าที่วิเคราะห์นโยบายและแผน',
    actorRole: currentUser?.role === 'executive' ? 'ผู้บริหาร' : 'เจ้าหน้าที่วิเคราะห์นโยบายและแผน',
    department: currentUser?.department || 'กองยุทธศาสตร์และงบประมาณ',
    targetCode: '',
    details: '',
    note: ''
  });

  // Reload logs
  const reloadLogs = () => {
    setLogs(storageService.getPlanAuditLogs());
  };

  // KPI Calculations
  const stats = useMemo(() => {
    let total = logs.length;
    let planApprovals = 0;
    let projectMods = 0;
    let budgetActions = 0;
    let trackingActions = 0;

    logs.forEach((log) => {
      const act = log.action || '';
      const cat = log.category;

      if (cat === 'plan_approval' || act.includes('อนุมัติ') || act.includes('ประกาศใช้')) {
        planApprovals++;
      }
      if (cat === 'project_modification' || act.includes('แก้ไข') || act.includes('เปลี่ยนแปลง') || act.includes('เพิ่ม')) {
        projectMods++;
      }
      if (cat === 'budget' || act.includes('งบประมาณ')) {
        budgetActions++;
      }
      if (cat === 'tracking' || act.includes('ก้าวหน้า')) {
        trackingActions++;
      }
    });

    return {
      total,
      planApprovals,
      projectMods,
      budgetActions,
      trackingActions
    };
  }, [logs]);

  // Unique actions list for dropdown
  const uniqueActions = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => {
      if (l.action) set.add(l.action);
    });
    return Array.from(set);
  }, [logs]);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // 1. Category Filter
      if (selectedCategory !== 'all' && log.category !== selectedCategory) {
        return false;
      }

      // 2. Action Filter
      if (selectedAction !== 'all' && log.action !== selectedAction) {
        return false;
      }

      // 3. Department Filter
      if (selectedDepartment !== 'all') {
        if (!log.department || !log.department.includes(selectedDepartment)) {
          return false;
        }
      }

      // 4. Time Period Filter
      if (selectedTimePeriod !== 'all') {
        // e.g. '2571', 'month_09', 'today'
        if (selectedTimePeriod === '2571' && !log.timestamp.includes('2571')) {
          return false;
        }
      }

      // 5. Search Keyword Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchId = (log.id || '').toLowerCase().includes(q);
        const matchPlan = (log.planName || '').toLowerCase().includes(q);
        const matchAction = (log.action || '').toLowerCase().includes(q);
        const matchActor = (log.actorName || '').toLowerCase().includes(q);
        const matchRole = (log.actorRole || '').toLowerCase().includes(q);
        const matchDept = (log.department || '').toLowerCase().includes(q);
        const matchDetails = (log.details || '').toLowerCase().includes(q);
        const matchNote = (log.note || '').toLowerCase().includes(q);
        const matchTarget = (log.targetCode || '').toLowerCase().includes(q);

        if (
          !matchId &&
          !matchPlan &&
          !matchAction &&
          !matchActor &&
          !matchRole &&
          !matchDept &&
          !matchDetails &&
          !matchNote &&
          !matchTarget
        ) {
          return false;
        }
      }

      return true;
    });
  }, [logs, selectedCategory, selectedAction, selectedDepartment, selectedTimePeriod, searchQuery]);

  // Pagination calculations
  const totalItems = filteredLogs.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize + 1;
  const endIndex = Math.min(safePage * pageSize, totalItems);

  const paginatedLogs = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, safePage, pageSize]);

  // Grouped by Date for Timeline View
  const groupedTimeline = useMemo(() => {
    const groups: { [dateStr: string]: PlanAuditLogEntry[] } = {};
    filteredLogs.forEach((log) => {
      // timestamp e.g. "28/09/2571 14:20:18"
      const datePart = log.timestamp.split(' ')[0] || 'วันที่ระบุไม่ได้';
      if (!groups[datePart]) {
        groups[datePart] = [];
      }
      groups[datePart].push(log);
    });
    return groups;
  }, [filteredLogs]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'รหัสบันทึก',
      'วันที่-เวลา',
      'หมวดหมู่',
      'การดำเนินการ',
      'รายการ/แผนพัฒนาท้องถิ่น',
      'รหัสอ้างอิง',
      'ผู้ดำเนินการ',
      'ตำแหน่ง',
      'หน่วยงาน',
      'รายละเอียดการเปลี่ยนแปลง',
      'ข้อมูลเดิม',
      'ข้อมูลใหม่',
      'หมายเหตุ',
      'IP/อุปกรณ์'
    ];

    const rows = filteredLogs.map((log) => [
      `"${log.id}"`,
      `"${log.timestamp}"`,
      `"${getCategoryMeta(log.category).label}"`,
      `"${log.action}"`,
      `"${(log.planName || '').replace(/"/g, '""')}"`,
      `"${log.targetCode || '-'}"`,
      `"${log.actorName}"`,
      `"${log.actorRole || '-'}"`,
      `"${log.department || '-'}"`,
      `"${(log.details || '').replace(/"/g, '""')}"`,
      `"${(log.beforeValue || '-').replace(/"/g, '""')}"`,
      `"${(log.afterValue || '-').replace(/"/g, '""')}"`,
      `"${(log.note || '-').replace(/"/g, '""')}"`,
      `"${log.ipAddress || '-'}"`
    ]);

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Sila_Audit_Log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Add new official administrative log
  const handleSaveNewRecord = () => {
    if (!newLogData.planName.trim()) {
      alert('กรุณากรอกชื่อแผนพัฒนาท้องถิ่นหรือโครงการที่เกี่ยวข้อง');
      return;
    }

    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = 2571;
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const fullTs = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;

    const created = storageService.addPlanAuditLog({
      timestamp: fullTs,
      planName: newLogData.planName.trim(),
      action: newLogData.action,
      category: newLogData.category,
      actorName: newLogData.actorName,
      actorRole: newLogData.actorRole,
      department: newLogData.department,
      targetCode: newLogData.targetCode.trim() || undefined,
      details: newLogData.details.trim() || 'บันทึกการปฏิบัติงานราชการตามระเบียบฯ',
      note: newLogData.note.trim() || undefined,
      ipAddress: '192.168.10.15 (งานนโยบายและแผน)'
    });

    setLogs([created, ...logs]);
    setIsAddRecordModalOpen(false);
    setNewLogData({
      planName: '',
      action: 'อนุมัติ',
      category: 'plan_approval',
      actorName: currentUser?.fullName || 'เจ้าหน้าที่วิเคราะห์นโยบายและแผน',
      actorRole: currentUser?.role === 'executive' ? 'ผู้บริหาร' : 'เจ้าหน้าที่วิเคราะห์นโยบายและแผน',
      department: currentUser?.department || 'กองยุทธศาสตร์และงบประมาณ',
      targetCode: '',
      details: '',
      note: ''
    });
  };

  // Reset to initial dataset
  const handleResetLogs = () => {
    if (window.confirm('คุณต้องการรีเซ็ตประวัติการดำเนินงานกลับเป็นค่าเริ่มต้นใช่หรือไม่?')) {
      const reset = storageService.resetPlanAuditLogs();
      setLogs(reset);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#f8fafc] h-full min-h-0 overflow-y-auto font-sans">
      <div className="p-4 sm:p-6 lg:p-7 max-w-[1720px] w-full mx-auto space-y-5 sm:space-y-6">
        {/* ========================================================================= */}
        {/* 1. Header Bar: Title, Governance badge & Action Buttons */}
        {/* ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1 border-b border-slate-200">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-800 text-white flex items-center justify-center shadow-md shadow-emerald-900/20 shrink-0 ring-2 ring-emerald-600/30">
              <History className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  ระบบประวัติและบันทึกการเปลี่ยนแปลง (Audit Log)
                </h1>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>ระบบตรวจสอบตามหลักธรรมาภิบาล</span>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                บันทึกประวัติการอนุมัติแผน การแก้ไขโครงการ การจัดสรรงบประมาณ และกิจกรรมสำคัญในระบบ เทศบาลเมืองศิลา พ.ศ. 2571-2575
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap self-start sm:self-center">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-200/80 p-0.5 rounded-xl border border-slate-300/80 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-emerald-950 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ตารางบันทึก
              </button>
              <button
                type="button"
                onClick={() => setViewMode('timeline')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'timeline'
                    ? 'bg-white text-emerald-950 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ไทม์ไลน์
              </button>
            </div>

            {/* Print button */}
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl shadow-2xs transition-colors cursor-pointer"
              title="พิมพ์รายงานบันทึกประวัติ"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span className="hidden sm:inline">พิมพ์รายงาน</span>
            </button>

            {/* Export CSV button */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold text-emerald-800 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 rounded-xl shadow-2xs transition-colors cursor-pointer"
              title="ส่งออกข้อมูลเป็น CSV / Excel"
            >
              <Download className="w-4 h-4 text-emerald-700" />
              <span>ส่งออก (CSV)</span>
            </button>

            {/* Add Record button (for staff/exec/admin) */}
            {currentUser?.role !== 'public' && (
              <button
                type="button"
                onClick={() => setIsAddRecordModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>บันทึกเหตุการณ์</span>
              </button>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. Top Summary KPI Cards */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Card 1: ทั้งหมด */}
          <div
            onClick={() => setSelectedCategory('all')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white border-slate-900 ring-2 ring-emerald-500'
                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold ${selectedCategory === 'all' ? 'text-slate-300' : 'text-slate-600'}`}>
                กิจกรรมทั้งหมด
              </span>
              <History className={`w-4 h-4 ${selectedCategory === 'all' ? 'text-emerald-400' : 'text-slate-400'}`} />
            </div>
            <div className="mt-2.5 flex items-baseline gap-1.5">
              <span className={`text-2xl sm:text-3xl font-bold font-mono ${selectedCategory === 'all' ? 'text-white' : 'text-slate-900'}`}>
                {stats.total}
              </span>
              <span className={`text-xs font-medium ${selectedCategory === 'all' ? 'text-slate-300' : 'text-slate-500'}`}>
                รายการ
              </span>
            </div>
            <div className={`text-[11px] mt-1 ${selectedCategory === 'all' ? 'text-emerald-400' : 'text-slate-500'}`}>
              บันทึกกิจกรรมสะสม
            </div>
          </div>

          {/* Card 2: อนุมัติ & ประกาศใช้แผน */}
          <div
            onClick={() => setSelectedCategory(selectedCategory === 'plan_approval' ? 'all' : 'plan_approval')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
              selectedCategory === 'plan_approval'
                ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400'
                : 'bg-white border-slate-200 hover:border-emerald-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900">อนุมัติ/ประกาศใช้แผน</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2.5 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-bold font-mono text-emerald-950">
                {stats.planApprovals}
              </span>
              <span className="text-xs font-medium text-emerald-700">ฉบับ</span>
            </div>
            <div className="text-[11px] text-emerald-700/80 mt-1">มติสภาฯ และนายกเทศมนตรี</div>
          </div>

          {/* Card 3: การแก้ไข/เปลี่ยนแปลงโครงการ */}
          <div
            onClick={() => setSelectedCategory(selectedCategory === 'project_modification' ? 'all' : 'project_modification')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
              selectedCategory === 'project_modification'
                ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400'
                : 'bg-white border-slate-200 hover:border-amber-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900">แก้ไข/เปลี่ยนแปลงโครงการ</span>
              <FileEdit className="w-4 h-4 text-amber-600" />
            </div>
            <div className="mt-2.5 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-bold font-mono text-amber-950">
                {stats.projectMods}
              </span>
              <span className="text-xs font-medium text-amber-700">ครั้ง</span>
            </div>
            <div className="text-[11px] text-amber-700/80 mt-1">ตามระเบียบฯ ข้อ 21 และ 22/1</div>
          </div>

          {/* Card 4: การอนุมัติงบประมาณ */}
          <div
            onClick={() => setSelectedCategory(selectedCategory === 'budget' ? 'all' : 'budget')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
              selectedCategory === 'budget'
                ? 'bg-amber-100/70 border-amber-500 ring-2 ring-amber-400'
                : 'bg-white border-slate-200 hover:border-amber-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-950">การอนุมัติงบประมาณ</span>
              <CircleDollarSign className="w-4 h-4 text-amber-700" />
            </div>
            <div className="mt-2.5 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-bold font-mono text-amber-950">
                {stats.budgetActions}
              </span>
              <span className="text-xs font-medium text-amber-800">รายการ</span>
            </div>
            <div className="text-[11px] text-amber-800/80 mt-1">เทศบัญญัติ/เงินสะสม</div>
          </div>

          {/* Card 5: ติดตามผล & ระบบ */}
          <div
            onClick={() => setSelectedCategory(selectedCategory === 'tracking' ? 'all' : 'tracking')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs col-span-2 lg:col-span-1 ${
              selectedCategory === 'tracking'
                ? 'bg-sky-50 border-sky-400 ring-2 ring-sky-400'
                : 'bg-white border-slate-200 hover:border-sky-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-900">ติดตามผล & ระบบ</span>
              <Activity className="w-4 h-4 text-sky-600" />
            </div>
            <div className="mt-2.5 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-bold font-mono text-sky-950">
                {stats.trackingActions}
              </span>
              <span className="text-xs font-medium text-sky-700">รายการ</span>
            </div>
            <div className="text-[11px] text-sky-700/80 mt-1">รายงานความก้าวหน้า ผ.03</div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. Search & Advanced Filter Controls */}
        {/* ========================================================================= */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-4 sm:p-5 space-y-3.5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-emerald-700" />
              <h2 className="text-sm sm:text-base font-bold text-slate-800">
                ตัวกรองและสืบค้นประวัติการดำเนินงาน
              </h2>
              <span className="text-xs text-slate-500 font-medium">
                (พบข้อมูล {filteredLogs.length} จาก {logs.length} รายการ)
              </span>
            </div>

            {(searchQuery || selectedCategory !== 'all' || selectedAction !== 'all' || selectedDepartment !== 'all' || selectedTimePeriod !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedAction('all');
                  setSelectedDepartment('all');
                  setSelectedTimePeriod('all');
                }}
                className="self-start md:self-auto text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
              >
                ล้างตัวกรองทั้งหมด
              </button>
            )}
          </div>

          {/* Filter row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
            {/* Search Input */}
            <div className="lg:col-span-4 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="ค้นหารหัส, ชื่อแผน, ชื่อโครงการ, ผู้ดำเนินการ..."
                className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* หมวดหมู่กิจกรรม */}
            <div className="lg:col-span-3">
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full py-2 px-3 text-xs sm:text-sm border border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium cursor-pointer"
              >
                <option value="all">หมวดหมู่ทั้งหมด</option>
                <option value="plan_approval">อนุมัติ / ประกาศใช้แผน</option>
                <option value="project_modification">แก้ไข / เปลี่ยนแปลงโครงการ</option>
                <option value="budget">การจัดสรรงบประมาณ</option>
                <option value="tracking">ติดตามและประเมินผล</option>
                <option value="system">กิจกรรมระบบและซิงค์</option>
              </select>
            </div>

            {/* ประเภทการดำเนินการ */}
            <div className="lg:col-span-3">
              <select
                value={selectedAction}
                onChange={(e) => {
                  setSelectedAction(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full py-2 px-3 text-xs sm:text-sm border border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium cursor-pointer"
              >
                <option value="all">การกระทำทั้งหมด</option>
                {uniqueActions.map((act) => (
                  <option key={act} value={act}>
                    {act}
                  </option>
                ))}
              </select>
            </div>

            {/* หน่วยงานรับผิดชอบ */}
            <div className="lg:col-span-2">
              <select
                value={selectedDepartment}
                onChange={(e) => {
                  setSelectedDepartment(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full py-2 px-3 text-xs sm:text-sm border border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium cursor-pointer"
              >
                <option value="all">ทุกหน่วยงาน</option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. Main Content: Table View vs Timeline View */}
        {/* ========================================================================= */}
        {viewMode === 'table' ? (
          /* ========================================================= */
          /* TABLE VIEW: ตารางบันทึกทางการ พร้อม Pagination */
          /* ========================================================= */
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden w-full">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-3 px-3.5 w-14 text-center font-mono">ลำดับ</th>
                    <th className="py-3 px-3.5 w-24 font-mono">รหัสบันทึก</th>
                    <th className="py-3 px-3.5 w-36 whitespace-nowrap">วันที่-เวลา</th>
                    <th className="py-3 px-3.5 w-32">การดำเนินการ</th>
                    <th className="py-3 px-3.5 min-w-[280px]">รายการ / แผนพัฒนาที่เกี่ยวข้อง</th>
                    <th className="py-3 px-3.5 min-w-[160px]">ผู้ดำเนินการ</th>
                    <th className="py-3 px-3.5 w-40">หน่วยงาน</th>
                    <th className="py-3 px-3.5 min-w-[200px]">สรุปรายละเอียด / หมายเหตุ</th>
                    <th className="py-3 px-3.5 w-24 text-center">ตรวจสอบ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-normal">
                  {paginatedLogs.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        <History className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        <div className="font-semibold text-slate-600">ไม่พบบันทึกประวัติที่ตรงกับเงื่อนไข</div>
                        <div className="text-xs text-slate-400 mt-1">ลองเปลี่ยนคำค้นหาหรือตัวกรอง</div>
                      </td>
                    </tr>
                  ) : (
                    paginatedLogs.map((log, index) => {
                      const actionMeta = getActionMeta(log.action);
                      const catMeta = getCategoryMeta(log.category);
                      const rowNum = startIndex + index;

                      return (
                        <tr
                          key={log.id}
                          className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                          onClick={() => setInspectLog(log)}
                        >
                          {/* 1. ลำดับ */}
                          <td className="py-3 px-3.5 text-center font-mono text-slate-500 font-medium">
                            {rowNum}
                          </td>

                          {/* 2. รหัสบันทึก */}
                          <td className="py-3 px-3.5 font-mono font-bold text-slate-800 whitespace-nowrap">
                            <span className="bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                              {log.id}
                            </span>
                          </td>

                          {/* 3. วันที่-เวลา */}
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 font-medium text-slate-700">
                              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="font-mono">{log.timestamp.split(' ')[0]}</span>
                            </div>
                            <div className="text-[11px] font-mono text-slate-500 ml-5">
                              {log.timestamp.split(' ')[1] || ''} น.
                            </div>
                          </td>

                          {/* 4. การดำเนินการ (Action badge with colored dot) */}
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${actionMeta.badgeClass}`}>
                              <span className={`w-2 h-2 rounded-full ${actionMeta.dotColor}`} />
                              <span>{log.action}</span>
                            </span>
                          </td>

                          {/* 5. รายการ / แผนพัฒนาที่เกี่ยวข้อง */}
                          <td className="py-3 px-3.5">
                            <div className="font-bold text-slate-900 leading-snug line-clamp-2">
                              {log.planName}
                            </div>
                            {log.targetCode && (
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono mt-0.5">
                                <Tag className="w-3 h-3 text-slate-400" />
                                <span>อ้างอิง: {log.targetCode}</span>
                              </div>
                            )}
                          </td>

                          {/* 6. ผู้ดำเนินการ */}
                          <td className="py-3 px-3.5">
                            <div className="font-bold text-slate-800 leading-tight">
                              {log.actorName}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                              {log.actorRole || 'เจ้าหน้าที่'}
                            </div>
                          </td>

                          {/* 7. หน่วยงาน */}
                          <td className="py-3 px-3.5">
                            <span className="text-slate-700 font-medium">
                              {log.department || 'เทศบาลเมืองศิลา'}
                            </span>
                          </td>

                          {/* 8. สรุปรายละเอียด / หมายเหตุ */}
                          <td className="py-3 px-3.5 text-slate-600 text-xs">
                            <div className="line-clamp-2 font-normal leading-relaxed">
                              {log.details || log.note || '-'}
                            </div>
                            {log.beforeValue && log.afterValue && (
                              <div className="mt-1 text-[11px] text-amber-800 bg-amber-50/80 px-2 py-0.5 rounded-md border border-amber-200/80 inline-block">
                                มีบันทึกข้อมูลก่อนและหลังการเปลี่ยนแปลง (Diff)
                              </div>
                            )}
                          </td>

                          {/* 9. ตรวจสอบ */}
                          <td className="py-3 px-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => setInspectLog(log)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 hover:text-emerald-900 border border-emerald-300 font-semibold text-xs transition-colors cursor-pointer"
                              title="ดูรายละเอียดการบันทึกประวัติ"
                            >
                              <Eye className="w-3.5 h-3.5 text-emerald-700" />
                              <span>ดูข้อมูล</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="px-4 sm:px-5 py-3 border-t border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm text-slate-600">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-slate-600">แสดงหน้าละ:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="border border-slate-300 rounded-lg px-2.5 py-1 text-xs bg-white text-slate-700 cursor-pointer font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
        ) : (
          /* ========================================================= */
          /* TIMELINE VIEW: ไทม์ไลน์ภาพประวัติ เรียงตามลำดับเวลา */
          /* ========================================================= */
          <div className="space-y-6">
            {Object.keys(groupedTimeline).length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
                <History className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <div className="font-semibold text-slate-600">ไม่พบบันทึกประวัติที่ตรงกับเงื่อนไข</div>
              </div>
            ) : (
              Object.entries(groupedTimeline).map(([dateStr, items]) => (
                <div key={dateStr} className="space-y-3">
                  {/* Date Heading */}
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-600 ring-4 ring-emerald-100 shrink-0" />
                    <h3 className="text-sm font-bold text-slate-800 font-mono flex items-center gap-2">
                      <span>วันที่ {dateStr}</span>
                      <span className="text-xs font-normal text-slate-500">
                        ({items.length} กิจกรรม)
                      </span>
                    </h3>
                    <div className="flex-1 border-t border-slate-200 ml-2" />
                  </div>

                  {/* Events in this date */}
                  <div className="ml-5 pl-5 border-l-2 border-slate-200 space-y-3">
                    {items.map((item) => {
                      const actionMeta = getActionMeta(item.action);

                      return (
                        <div
                          key={item.id}
                          onClick={() => setInspectLog(item)}
                          className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all cursor-pointer space-y-2.5"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                                {item.id}
                              </span>
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold border ${actionMeta.badgeClass}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${actionMeta.dotColor}`} />
                                <span>{item.action}</span>
                              </span>
                              <span className="text-xs text-slate-500 font-mono">
                                🕒 {item.timestamp.split(' ')[1] || ''} น.
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-slate-700 font-semibold">{item.actorName}</span>
                              {item.department && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span>{item.department}</span>
                                </>
                              )}
                            </div>
                          </div>

                          <div>
                            <h4 className="text-sm font-bold text-slate-900 leading-snug">
                              {item.planName}
                            </h4>
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                              {item.details || item.note || '-'}
                            </p>
                          </div>

                          {/* Before & After comparison preview */}
                          {item.beforeValue && item.afterValue && (
                            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                              <div className="text-rose-700 font-medium flex items-center gap-1.5">
                                <span className="font-bold text-[11px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded">เดิม</span>
                                <span className="truncate">{item.beforeValue}</span>
                              </div>
                              <div className="text-emerald-700 font-medium flex items-center gap-1.5">
                                <span className="font-bold text-[11px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">ใหม่</span>
                                <span className="truncate">{item.afterValue}</span>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                            <span className="text-[11px] text-slate-400 font-mono">
                              IP: {item.ipAddress || '192.168.10.x'}
                            </span>
                            <span className="text-emerald-700 hover:text-emerald-800 font-bold inline-flex items-center gap-1">
                              <span>ดูบันทึกฉบับเต็ม</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. Deep Inspection Modal: ตรวจสอบรายละเอียดและหลักฐานบันทึกประวัติ */}
      {/* ========================================================================= */}
      {inspectLog && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 my-auto flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-5 py-4 bg-linear-to-r from-[#054e3b] to-[#046c4e] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-300" />
                <div>
                  <h3 className="font-bold text-base sm:text-lg leading-tight">
                    ใบบันทึกประวัติการดำเนินงาน (Audit Record Slip)
                  </h3>
                  <div className="text-xs text-emerald-200 font-mono mt-0.5">
                    รหัสบันทึก: {inspectLog.id} · เทศบาลเมืองศิลา
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectLog(null)}
                className="text-emerald-100 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
              {/* Event Summary Box */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-xs font-semibold text-slate-500 block">รายการ / แผนพัฒนาท้องถิ่น:</span>
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base mt-0.5 leading-snug">
                      {inspectLog.planName}
                    </h4>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold border shrink-0 ${getActionMeta(inspectLog.action).badgeClass}`}>
                    <span className={`w-2 h-2 rounded-full ${getActionMeta(inspectLog.action).dotColor}`} />
                    <span>{inspectLog.action}</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-500 font-medium block">วันที่และเวลาบันทึก:</span>
                    <span className="font-bold font-mono text-slate-800 mt-0.5 block">
                      {inspectLog.timestamp} น.
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block">หมวดหมู่กิจกรรม:</span>
                    <span className="font-bold text-slate-800 mt-0.5 block">
                      {getCategoryMeta(inspectLog.category).label}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block">เลขอ้างอิงราชการ:</span>
                    <span className="font-bold font-mono text-slate-800 mt-0.5 block">
                      {inspectLog.targetCode || 'ทม.ศล. -'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actor & Authority Credentials */}
              <div className="p-4 border border-slate-200 rounded-xl space-y-2 bg-white">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-xs sm:text-sm">
                  <User className="w-4 h-4 text-emerald-700" />
                  <span>ข้อมูลผู้ลงนามและผู้ปฏิบัติหน้าที่</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                  <div>
                    <span className="text-slate-500">ชื่อ-นามสกุล ผู้ดำเนินการ:</span>
                    <div className="font-bold text-slate-800 text-sm mt-0.5">{inspectLog.actorName}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">ตำแหน่ง / บทบาทหน้าที่:</span>
                    <div className="font-semibold text-slate-800 mt-0.5">{inspectLog.actorRole || 'เจ้าหน้าที่'}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">หน่วยงานรับผิดชอบ:</span>
                    <div className="font-semibold text-slate-800 mt-0.5">{inspectLog.department || 'เทศบาลเมืองศิลา'}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">สถานีบันทึกข้อมูล (IP / Device):</span>
                    <div className="font-mono text-slate-600 mt-0.5">{inspectLog.ipAddress || '192.168.10.x'}</div>
                  </div>
                </div>
              </div>

              {/* Action Description & Regulatory Basis */}
              <div className="space-y-2">
                <div className="font-bold text-slate-800 text-xs">รายละเอียดการดำเนินการ:</div>
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 leading-relaxed text-xs sm:text-sm">
                  {inspectLog.details || inspectLog.note || 'ไม่มีข้อมูลบันทึกเพิ่มเติม'}
                </div>
              </div>

              {/* Before & After Diff Box (if applicable) */}
              {inspectLog.beforeValue && inspectLog.afterValue && (
                <div className="space-y-2">
                  <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <span>การเปรียบเทียบข้อมูลก่อนและหลังการเปลี่ยนแปลง (Data Diff):</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                      <span className="font-bold text-rose-800 block">ข้อมูลเดิม (Before):</span>
                      <p className="text-rose-900 leading-relaxed">{inspectLog.beforeValue}</p>
                    </div>
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                      <span className="font-bold text-emerald-800 block">ข้อมูลใหม่ (After):</span>
                      <p className="text-emerald-900 leading-relaxed">{inspectLog.afterValue}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Legal Reference Note */}
              <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl text-[11px] text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1 text-amber-950">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                  <span>การรับรองความถูกต้องตามระเบียบราชการ</span>
                </div>
                <p className="leading-relaxed">
                  บันทึกประวัตินี้ถูกจัดทำขึ้นตามพระราชบัญญัติการปฏิบัติราชการทางอิเล็กทรอนิกส์ พ.ศ. 2565 และระเบียบกระทรวงมหาดไทยว่าด้วยการจัดทำแผนพัฒนาขององค์กรปกครองส่วนท้องถิ่น พ.ศ. 2548 และที่แก้ไขเพิ่มเติม
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 cursor-pointer shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>พิมพ์ใบบันทึก (Print Slip)</span>
              </button>

              <button
                type="button"
                onClick={() => setInspectLog(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs cursor-pointer shadow-2xs"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. Add Administrative Record Modal (บันทึกเหตุการณ์ทางการ) */}
      {/* ========================================================================= */}
      {isAddRecordModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 my-auto">
            {/* Header */}
            <div className="px-5 py-4 bg-linear-to-r from-[#054e3b] to-[#046c4e] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileEdit className="w-5 h-5 text-emerald-300" />
                <h3 className="font-bold text-base sm:text-lg">บันทึกเหตุการณ์ราชการ / กิจกรรมในระบบ</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddRecordModalOpen(false)}
                className="text-emerald-100 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <div className="p-5 sm:p-6 space-y-3.5 text-xs sm:text-sm max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ชื่อแผนพัฒนาท้องถิ่น หรือโครงการที่เกี่ยวข้อง <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newLogData.planName}
                  onChange={(e) => setNewLogData({ ...newLogData, planName: e.target.value })}
                  placeholder="เช่น แผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575) เพิ่มเติม ครั้งที่ 24/2571"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">หมวดหมู่กิจกรรม</label>
                  <select
                    value={newLogData.category}
                    onChange={(e) => setNewLogData({ ...newLogData, category: e.target.value as AuditLogCategory })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="plan_approval">อนุมัติ / ประกาศใช้แผน</option>
                    <option value="project_modification">แก้ไข / เปลี่ยนแปลงโครงการ</option>
                    <option value="budget">การจัดสรรงบประมาณ</option>
                    <option value="tracking">ติดตามประเมินผล</option>
                    <option value="system">กิจกรรมระบบและซิงค์</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">การดำเนินการ (Action)</label>
                  <select
                    value={newLogData.action}
                    onChange={(e) => setNewLogData({ ...newLogData, action: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="อนุมัติ">อนุมัติ</option>
                    <option value="ประกาศใช้">ประกาศใช้</option>
                    <option value="แก้ไขโครงการ">แก้ไขโครงการ</option>
                    <option value="เปลี่ยนแปลงโครงการ">เปลี่ยนแปลงโครงการ</option>
                    <option value="เพิ่มโครงการ">เพิ่มโครงการ</option>
                    <option value="จัดสรรงบประมาณ">จัดสรรงบประมาณ</option>
                    <option value="อัปเดตความก้าวหน้า">อัปเดตความก้าวหน้า</option>
                    <option value="บันทึกข้อความราชการ">บันทึกข้อความราชการ</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ผู้ดำเนินการ</label>
                  <input
                    type="text"
                    value={newLogData.actorName}
                    onChange={(e) => setNewLogData({ ...newLogData, actorName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ตำแหน่ง / บทบาท</label>
                  <input
                    type="text"
                    value={newLogData.actorRole}
                    onChange={(e) => setNewLogData({ ...newLogData, actorRole: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">หน่วยงานรับผิดชอบ</label>
                  <select
                    value={newLogData.department}
                    onChange={(e) => setNewLogData({ ...newLogData, department: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">เลขที่อ้างอิงราชการ</label>
                  <input
                    type="text"
                    value={newLogData.targetCode}
                    onChange={(e) => setNewLogData({ ...newLogData, targetCode: e.target.value })}
                    placeholder="เช่น ทม.ศล. 24/2571"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  รายละเอียดการปฏิบัติงาน
                </label>
                <textarea
                  rows={3}
                  value={newLogData.details}
                  onChange={(e) => setNewLogData({ ...newLogData, details: e.target.value })}
                  placeholder="ระบุข้อความสรุปการดำเนินงาน มติ หรือเหตุผลความจำเป็น..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">หมายเหตุเพิ่มเติม</label>
                <input
                  type="text"
                  value={newLogData.note}
                  onChange={(e) => setNewLogData({ ...newLogData, note: e.target.value })}
                  placeholder="เช่น ส่งให้ฝ่ายนโยบายและแผนเรียบร้อย"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="px-5 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsAddRecordModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-700 hover:bg-slate-200 font-semibold text-xs cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveNewRecord}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                บันทึกข้อมูล
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
