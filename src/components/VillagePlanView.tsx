import React, { useState, useMemo } from 'react';
import {
  Home,
  FileText,
  AlertTriangle,
  Search,
  RotateCcw,
  Eye,
  MoreVertical,
  Plus,
  Download,
  BookOpen,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  X,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Printer,
  Building2,
  Users,
  Layers,
  ArrowRight,
  Check
} from 'lucide-react';
import { ProjectData, UserAccount } from '../types';
import { getProjectDisplayId } from '../utils/projectCode';

export interface VillagePlanItem {
  id: string;
  orderNumber: number;
  code: string; // e.g. "01", "02"
  villageName: string; // e.g. "บ้านหนองบัว"
  subdistrict: string; // ตำบล เช่น "ตำบลหนองบัว"
  district: string; // อำเภอ เช่น "อำเภอเมือง"
  status: 'has_plan' | 'in_progress' | 'no_plan'; // มีแผนแล้ว | อยู่ระหว่างจัดทำ | ยังไม่จัดทำ
  planYears: string; // e.g. "2567 - 2571" หรือ "-"
  population?: number;
  households?: number;
  headmanName?: string;
  contactPhone?: string;
  zone?: string;
  coordinates?: { x: number; y: number }; // For map placement (percentage 0-100)
}

// Initial 15 Village dataset strictly matching image.png
const INITIAL_VILLAGE_PLANS: VillagePlanItem[] = [
  {
    id: 'v-01',
    orderNumber: 1,
    code: '01',
    villageName: 'บ้านหนองบัว',
    subdistrict: 'ตำบลหนองบัว',
    district: 'อำเภอเมือง',
    status: 'has_plan',
    planYears: '2567 - 2571',
    population: 1420,
    households: 360,
    headmanName: 'นายประสิทธิ์ สุขเกษม',
    contactPhone: '081-234-5678',
    zone: 'เขต 1',
    coordinates: { x: 38, y: 55 }
  },
  {
    id: 'v-02',
    orderNumber: 2,
    code: '02',
    villageName: 'บ้านศรีสุข',
    subdistrict: 'ตำบลหนองบัว',
    district: 'อำเภอเมือง',
    status: 'has_plan',
    planYears: '2567 - 2571',
    population: 980,
    households: 245,
    headmanName: 'นายสมพร กิตติคุณ',
    contactPhone: '082-345-6789',
    zone: 'เขต 1',
    coordinates: { x: 44, y: 48 }
  },
  {
    id: 'v-03',
    orderNumber: 3,
    code: '03',
    villageName: 'บ้านทุ่งสว่าง',
    subdistrict: 'ตำบลทุ่งสว่าง',
    district: 'อำเภอเมือง',
    status: 'in_progress',
    planYears: '2567 - 2571',
    population: 1150,
    households: 290,
    headmanName: 'นายบุญเลิศ รัตนชัย',
    contactPhone: '083-456-7890',
    zone: 'เขต 2',
    coordinates: { x: 72, y: 42 }
  },
  {
    id: 'v-04',
    orderNumber: 4,
    code: '04',
    villageName: 'บ้านโคกสูง',
    subdistrict: 'ตำบลหนองบัว',
    district: 'อำเภอเมือง',
    status: 'has_plan',
    planYears: '2567 - 2571',
    population: 860,
    households: 215,
    headmanName: 'นางสาวพิมพ์ใจ มีสุข',
    contactPhone: '084-567-8901',
    zone: 'เขต 1',
    coordinates: { x: 32, y: 38 }
  },
  {
    id: 'v-05',
    orderNumber: 5,
    code: '05',
    villageName: 'บ้านคลองใหม่',
    subdistrict: 'ตำบลคลองใหม่',
    district: 'อำเภอเมือง',
    status: 'has_plan',
    planYears: '2567 - 2571',
    population: 1320,
    households: 330,
    headmanName: 'นายอำนวย พงษ์ศิริ',
    contactPhone: '085-678-9012',
    zone: 'เขต 2',
    coordinates: { x: 62, y: 64 }
  },
  {
    id: 'v-06',
    orderNumber: 6,
    code: '06',
    villageName: 'บ้านเขาพระ',
    subdistrict: 'ตำบลเขาพระ',
    district: 'อำเภอเมือง',
    status: 'has_plan',
    planYears: '2567 - 2571',
    population: 1540,
    households: 385,
    headmanName: 'นายธีระศักดิ์ วงศ์มณี',
    contactPhone: '086-789-0123',
    zone: 'เขต 3',
    coordinates: { x: 48, y: 22 }
  },
  {
    id: 'v-07',
    orderNumber: 7,
    code: '07',
    villageName: 'บ้านดอนมะขาม',
    subdistrict: 'ตำบลดอนมะขาม',
    district: 'อำเภอเมือง',
    status: 'in_progress',
    planYears: '2567 - 2571',
    population: 780,
    households: 195,
    headmanName: 'นายสมบัติ ใจภักดี',
    contactPhone: '087-890-1234',
    zone: 'เขต 2',
    coordinates: { x: 26, y: 68 }
  },
  {
    id: 'v-08',
    orderNumber: 8,
    code: '08',
    villageName: 'บ้านป่าคา',
    subdistrict: 'ตำบลป่าคา',
    district: 'อำเภอเมือง',
    status: 'has_plan',
    planYears: '2567 - 2571',
    population: 940,
    households: 235,
    headmanName: 'นายวันชัย เลิศวิไล',
    contactPhone: '088-901-2345',
    zone: 'เขต 3',
    coordinates: { x: 78, y: 28 }
  },
  {
    id: 'v-09',
    orderNumber: 9,
    code: '09',
    villageName: 'บ้านใหม่พัฒนา',
    subdistrict: 'ตำบลใหม่พัฒนา',
    district: 'อำเภอเมือง',
    status: 'has_plan',
    planYears: '2567 - 2571',
    population: 1680,
    households: 420,
    headmanName: 'นางสาวจารุวรรณ ชัยเจริญ',
    contactPhone: '089-012-3456',
    zone: 'เขต 1',
    coordinates: { x: 55, y: 76 }
  },
  {
    id: 'v-10',
    orderNumber: 10,
    code: '10',
    villageName: 'บ้านน้ำใส',
    subdistrict: 'ตำบลน้ำใส',
    district: 'อำเภอเมือง',
    status: 'no_plan',
    planYears: '-',
    population: 620,
    households: 155,
    headmanName: 'นายสุเทพ ยิ่งเจริญ',
    contactPhone: '080-123-4567',
    zone: 'เขต 3',
    coordinates: { x: 82, y: 72 }
  },
  {
    id: 'v-11',
    orderNumber: 11,
    code: '11',
    villageName: 'บ้านโนนม่วง',
    subdistrict: 'ตำบลศิลา',
    district: 'อำเภอเมือง',
    status: 'has_plan',
    planYears: '2567 - 2571',
    population: 2450,
    households: 680,
    headmanName: 'นายณรงค์ เกียรติคุณ',
    contactPhone: '081-345-6789',
    zone: 'เขต 1',
    coordinates: { x: 22, y: 45 }
  },
  {
    id: 'v-12',
    orderNumber: 12,
    code: '12',
    villageName: 'บ้านหนองกุง',
    subdistrict: 'ตำบลศิลา',
    district: 'อำเภอเมือง',
    status: 'has_plan',
    planYears: '2567 - 2571',
    population: 1890,
    households: 510,
    headmanName: 'นายวิเชียร สาระคำ',
    contactPhone: '082-456-7890',
    zone: 'เขต 1',
    coordinates: { x: 34, y: 78 }
  },
  {
    id: 'v-13',
    orderNumber: 13,
    code: '13',
    villageName: 'บ้านดอนหญ้านาง',
    subdistrict: 'ตำบลศิลา',
    district: 'อำเภอเมือง',
    status: 'has_plan',
    planYears: '2567 - 2571',
    population: 1340,
    households: 360,
    headmanName: 'นายสุริยันต์ สรรพคุณ',
    contactPhone: '083-567-8901',
    zone: 'เขต 2',
    coordinates: { x: 65, y: 52 }
  },
  {
    id: 'v-14',
    orderNumber: 14,
    code: '14',
    villageName: 'บ้านหนองไผ่',
    subdistrict: 'ตำบลศิลา',
    district: 'อำเภอเมือง',
    status: 'has_plan',
    planYears: '2567 - 2571',
    population: 2100,
    households: 590,
    headmanName: 'นายมนัส ปราชญ์ดี',
    contactPhone: '084-678-9012',
    zone: 'เขต 2',
    coordinates: { x: 74, y: 62 }
  },
  {
    id: 'v-15',
    orderNumber: 15,
    code: '15',
    villageName: 'บ้านโกทา',
    subdistrict: 'ตำบลศิลา',
    district: 'อำเภอเมือง',
    status: 'has_plan',
    planYears: '2567 - 2571',
    population: 1750,
    households: 480,
    headmanName: 'นายเอกชัย ภักดีสุวรรณ',
    contactPhone: '085-789-0123',
    zone: 'เขต 3',
    coordinates: { x: 52, y: 35 }
  }
];

interface VillagePlanViewProps {
  projects: ProjectData[];
  onViewProjectDetail: (project: ProjectData) => void;
  onRestoreInitialData?: () => void;
  onAddNewProject?: (villageNum?: number) => void;
  onUpdateProject?: (project: ProjectData) => void;
  currentUser?: UserAccount | null;
  onSwitchToReport?: () => void;
}

export const VillagePlanView: React.FC<VillagePlanViewProps> = ({
  projects,
  onViewProjectDetail,
  onAddNewProject,
  currentUser
}) => {
  // Main Village Plans State
  const [villagePlans, setVillagePlans] = useState<VillagePlanItem[]>(INITIAL_VILLAGE_PLANS);

  // Filters State
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [selectedSubdistrict, setSelectedSubdistrict] = useState<string>('ทั้งหมด');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ทั้งหมด');
  const [selectedStatus, setSelectedStatus] = useState<string>('ทั้งหมด');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  // Selected village for detail modal
  const [selectedVillageDetail, setSelectedVillageDetail] = useState<VillagePlanItem | null>(null);

  // Create new village plan modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [newVillageForm, setNewVillageForm] = useState({
    villageName: '',
    subdistrict: 'ตำบลหนองบัว',
    district: 'อำเภอเมือง',
    status: 'has_plan' as 'has_plan' | 'in_progress' | 'no_plan',
    planYears: '2567 - 2571',
    headmanName: '',
    contactPhone: '',
    population: '',
    households: '',
    zone: 'เขต 1'
  });

  // Action Menu dropdown per row
  const [openActionDropdownId, setOpenActionDropdownId] = useState<string | null>(null);

  // Notification / Toast Message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Distinct subdistricts & districts for dropdowns
  const subdistrictsList = useMemo(() => {
    const list = Array.from(new Set(villagePlans.map((v) => v.subdistrict)));
    return ['ทั้งหมด', ...list];
  }, [villagePlans]);

  const districtsList = useMemo(() => {
    const list = Array.from(new Set(villagePlans.map((v) => v.district)));
    return ['ทั้งหมด', ...list];
  }, [villagePlans]);

  // Reactive KPI Statistics
  const stats = useMemo(() => {
    const total = villagePlans.length;
    const hasPlan = villagePlans.filter((v) => v.status === 'has_plan').length;
    const inProgress = villagePlans.filter((v) => v.status === 'in_progress').length;
    const noPlan = villagePlans.filter((v) => v.status === 'no_plan').length;

    const hasPlanPct = total > 0 ? ((hasPlan / total) * 100).toFixed(1) : '0.0';
    const inProgressPct = total > 0 ? ((inProgress / total) * 100).toFixed(1) : '0.0';
    const noPlanPct = total > 0 ? ((noPlan / total) * 100).toFixed(1) : '0.0';

    return {
      total,
      hasPlan,
      inProgress,
      noPlan,
      hasPlanPct,
      inProgressPct,
      noPlanPct
    };
  }, [villagePlans]);

  // Filtered Village Plans
  const filteredVillages = useMemo(() => {
    return villagePlans.filter((v) => {
      // Subdistrict filter
      if (selectedSubdistrict !== 'ทั้งหมด' && v.subdistrict !== selectedSubdistrict) {
        return false;
      }
      // District filter
      if (selectedDistrict !== 'ทั้งหมด' && v.district !== selectedDistrict) {
        return false;
      }
      // Status filter
      if (selectedStatus !== 'ทั้งหมด') {
        if (selectedStatus === 'มีแผนแล้ว' && v.status !== 'has_plan') return false;
        if (selectedStatus === 'อยู่ระหว่างจัดทำ' && v.status !== 'in_progress') return false;
        if (selectedStatus === 'ยังไม่จัดทำ' && v.status !== 'no_plan') return false;
      }
      // Search keyword (ชื่อหมู่บ้าน / รหัสหมู่บ้าน / ตำบล / ผู้ใหญ่บ้าน)
      if (searchKeyword.trim()) {
        const kw = searchKeyword.trim().toLowerCase();
        const matchName = v.villageName.toLowerCase().includes(kw);
        const matchCode = v.code.toLowerCase().includes(kw);
        const matchSub = v.subdistrict.toLowerCase().includes(kw);
        const matchHead = (v.headmanName || '').toLowerCase().includes(kw);
        if (!matchName && !matchCode && !matchSub && !matchHead) {
          return false;
        }
      }
      return true;
    });
  }, [villagePlans, selectedSubdistrict, selectedDistrict, selectedStatus, searchKeyword]);

  // Paginated records
  const totalPages = Math.ceil(filteredVillages.length / pageSize) || 1;
  const paginatedVillages = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredVillages.slice(start, start + pageSize);
  }, [filteredVillages, currentPage, pageSize]);

  // Reset filters
  const handleResetFilters = () => {
    setSearchKeyword('');
    setSelectedSubdistrict('ทั้งหมด');
    setSelectedDistrict('ทั้งหมด');
    setSelectedStatus('ทั้งหมด');
    setCurrentPage(1);
  };

  // Find projects related to the selected village in detail modal
  const villageProjects = useMemo(() => {
    if (!selectedVillageDetail) return [];
    const vName = selectedVillageDetail.villageName;
    const vCodeNum = parseInt(selectedVillageDetail.code, 10);
    return projects.filter((p) => {
      if (p.village && p.village.includes(vName.replace('บ้าน', ''))) return true;
      if (p.villageNumber === vCodeNum) return true;
      return false;
    });
  }, [selectedVillageDetail, projects]);

  // Village total budget from projects
  const villageTotalBudget = useMemo(() => {
    return villageProjects.reduce((sum, p) => sum + (p.budgetApproved || p.budgetPlan || 0), 0);
  }, [villageProjects]);

  // Handle Download Excel/CSV
  const handleDownloadExcel = () => {
    const headers = ['ลำดับ', 'รหัสหมู่บ้าน', 'ชื่อหมู่บ้าน', 'ตำบล', 'อำเภอ', 'สถานะแผน', 'ปีที่จัดทำ', 'ประชากร', 'ครัวเรือน', 'ผู้นำชุมชน', 'เบอร์ติดต่อ'];
    const rows = villagePlans.map((v, i) => [
      i + 1,
      `"${v.code}"`,
      `"${v.villageName}"`,
      `"${v.subdistrict}"`,
      `"${v.district}"`,
      `"${v.status === 'has_plan' ? 'มีแผนแล้ว' : v.status === 'in_progress' ? 'อยู่ระหว่างจัดทำ' : 'ยังไม่จัดทำ'}"`,
      `"${v.planYears}"`,
      v.population || 0,
      v.households || 0,
      `"${v.headmanName || '-'}"`,
      `"${v.contactPhone || '-'}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `รายชื่อหมู่บ้านและแผนพัฒนาท้องถิ่น_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    showToast('ดาวน์โหลดไฟล์ข้อมูลหมู่บ้าน (Excel/CSV) สำเร็จ');
  };

  // Handle Download Form Template
  const handleDownloadForm = () => {
    const text = `แบบฟอร์มการจัดทำแผนพัฒนาหมู่บ้าน/ชุมชน เทศบาลเมืองศิลา
ประจำปีงบประมาณ พ.ศ. 2567 - 2571
==================================================
1. ข้อมูลพื้นฐานหมู่บ้าน/ชุมชน
   ชื่อหมู่บ้าน: ..................................................... หมู่ที่: ........... ตำบล: ....................................
   จำนวนประชากร: ................... คน   จำนวนครัวเรือน: ................... ครัวเรือน
   ชื่อผู้นำชุมชน/ผู้ใหญ่บ้าน: .................................................... โทรศัพท์: ..................................

2. สรุปปัญหาและความต้องการของชุมชน
   (1) ด้านโครงสร้างพื้นฐาน: ............................................................................................
   (2) ด้านเศรษฐกิจและอาชีพ: ............................................................................................
   (3) ด้านคุณภาพชีวิตและสาธารณสุข: ................................................................................

3. บัญชีโครงการพัฒนาตามแผนหมู่บ้าน
   - โครงการที่ 1: .................................................... งบประมาณ: ............................. บาท
   - โครงการที่ 2: .................................................... งบประมาณ: ............................. บาท
==================================================`;
    const blob = new Blob(['\uFEFF' + text], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `แบบฟอร์มแผนรายหมู่บ้าน_ทม_ศิลา.txt`;
    link.click();
    showToast('ดาวน์โหลดแบบฟอร์มแผนรายหมู่บ้านเรียบร้อยแล้ว');
  };

  // Handle Download Manual Guide
  const handleDownloadGuide = () => {
    const text = `คู่มือการจัดทำแผนรายหมู่บ้านและแผนชุมชน เทศบาลเมืองศิลา
========================================================
ขั้นตอนที่ 1: การสำรวจข้อมูลและจัดประชุมประชาคมหมู่บ้าน
ขั้นตอนที่ 2: การวิเคราะห์ปัญหา จัดลำดับความสำคัญของโครงการ
ขั้นตอนที่ 3: การรวบรวมร่างแผนและส่งมอบให้กองยุทธศาสตร์และงบประมาณ
ขั้นตอนที่ 4: การบรรจุโครงการลงในแผนพัฒนาท้องถิ่น (แบบ ผ.02)
ขั้นตอนที่ 5: การติดตามและประเมินผลการดำเนินโครงการ
========================================================`;
    const blob = new Blob(['\uFEFF' + text], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `คู่มือการจัดทำแผนรายหมู่บ้าน_ทม_ศิลา.txt`;
    link.click();
    showToast('ดาวน์โหลดคู่มือการจัดทำแผนรายหมู่บ้านเรียบร้อยแล้ว');
  };

  // Submit New Village Plan
  const handleCreateVillageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVillageForm.villageName.trim()) {
      alert('กรุณากรอกชื่อหมู่บ้าน');
      return;
    }

    const nextOrder = villagePlans.length + 1;
    const nextCode = nextOrder < 10 ? `0${nextOrder}` : `${nextOrder}`;

    const newVillage: VillagePlanItem = {
      id: `v-${Date.now()}`,
      orderNumber: nextOrder,
      code: nextCode,
      villageName: newVillageForm.villageName.trim(),
      subdistrict: newVillageForm.subdistrict,
      district: newVillageForm.district,
      status: newVillageForm.status,
      planYears: newVillageForm.status === 'no_plan' ? '-' : newVillageForm.planYears,
      population: parseInt(newVillageForm.population, 10) || 1000,
      households: parseInt(newVillageForm.households, 10) || 250,
      headmanName: newVillageForm.headmanName || 'ผู้นำชุมชน',
      contactPhone: newVillageForm.contactPhone || '-',
      zone: newVillageForm.zone,
      coordinates: { x: 50, y: 50 }
    };

    setVillagePlans([...villagePlans, newVillage]);
    setIsCreateModalOpen(false);
    setNewVillageForm({
      villageName: '',
      subdistrict: 'ตำบลหนองบัว',
      district: 'อำเภอเมือง',
      status: 'has_plan',
      planYears: '2567 - 2571',
      headmanName: '',
      contactPhone: '',
      population: '',
      households: '',
      zone: 'เขต 1'
    });
    showToast(`สร้างแผนรายหมู่บ้าน "${newVillage.villageName}" เรียบร้อยแล้ว`);
  };

  return (
    <div id="village-plan-view-container" className="flex-1 flex flex-col min-w-0 bg-[#f8fafc] h-full min-h-0 overflow-y-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-sm font-medium animate-in fade-in slide-in-from-top-3 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. Top Header Bar (Matching screenshot breadcrumb & staff avatar profile) */}
      {/* ========================================================================= */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-2xs">
        {/* Left: Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 font-medium">
          <button
            type="button"
            className="p-1.5 -ml-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer mr-1"
            title="สลับเมนู"
          >
            <span className="text-base font-bold">☰</span>
          </button>
          <Home className="w-4 h-4 text-slate-400" />
          <span className="hover:text-slate-700 cursor-pointer">หน้าหลัก</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-800 font-bold">แผนรายหมู่บ้าน</span>
        </div>

        {/* Right: Notifications & User Profile */}
        <div className="flex items-center gap-3">
          {/* Notification bell with badge 3 */}
          <button
            type="button"
            className="relative p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer"
            title="การแจ้งเตือน"
          >
            <span className="text-lg">🔔</span>
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
              3
            </span>
          </button>

          {/* User Profile Chip */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs select-none">
              {currentUser?.fullName ? currentUser.fullName.charAt(0) : 'ก'}
            </div>
            <div className="hidden sm:block text-left leading-tight">
              <div className="text-xs font-bold text-slate-800">
                {currentUser?.fullName || 'นางสาวกมลวรรณ แซ่ดี'}
              </div>
              <div className="text-[11px] text-slate-500">
                {currentUser?.role === 'admin'
                  ? 'ผู้ดูแลระบบ (Admin)'
                  : currentUser?.role === 'executive'
                  ? 'ผู้บริหาร (Executive)'
                  : 'เจ้าหน้าที่ (Staff)'}
              </div>
            </div>
            <span className="text-slate-400 text-xs hidden sm:inline">▾</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="p-4 sm:p-6 max-w-[1600px] w-full mx-auto space-y-5">
        
        {/* ========================================================================= */}
        {/* 2. Page Title Banner & Create Button */}
        {/* ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-sm shadow-blue-500/20 shrink-0">
              <Home className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                แผนรายหมู่บ้าน
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
                ข้อมูลแผนพัฒนาท้องถิ่นระดับหมู่บ้าน/ชุมชน ครบถ้วน เข้าถึงง่าย เพื่อการพัฒนาที่ยั่งยืน
              </p>
            </div>
          </div>

          {/* Create Button */}
          <button
            type="button"
            id="btn-create-village-plan"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-xs hover:shadow-md transition-all cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>สร้างแผนรายหมู่บ้านใหม่</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* 3. 4 Top KPI Cards (Exact numbers: 15, 12 [80%], 2 [13.3%], 1 [6.7%]) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: จำนวนหมู่บ้านทั้งหมด */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-4 hover:shadow-xs transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-sm shadow-blue-500/20 shrink-0">
              <Home className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-500">จำนวนหมู่บ้านทั้งหมด</div>
              <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                {stats.total}
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                <Home className="w-3 h-3 text-slate-400" />
                <span>หมู่บ้าน</span>
              </div>
            </div>
          </div>

          {/* Card 2: มีแผนแล้ว */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-4 hover:shadow-xs transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shadow-emerald-500/20 shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-slate-500">มีแผนแล้ว</div>
              <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                {stats.hasPlan}
              </div>
              <div className="flex items-center justify-between text-[11px] mt-0.5">
                <span className="text-slate-500">หมู่บ้าน</span>
                <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                  <span>↑</span>
                  <span>{stats.hasPlanPct}%</span>
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: อยู่ระหว่างจัดทำ */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-4 hover:shadow-xs transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-sm shadow-amber-500/20 shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-slate-500">อยู่ระหว่างจัดทำ</div>
              <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                {stats.inProgress}
              </div>
              <div className="flex items-center justify-between text-[11px] mt-0.5">
                <span className="text-slate-500">หมู่บ้าน</span>
                <span className="text-amber-600 font-bold flex items-center gap-0.5">
                  <span>↑</span>
                  <span>{stats.inProgressPct}%</span>
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: ยังไม่จัดทำ */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-4 hover:shadow-xs transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-sm shadow-rose-500/20 shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-slate-500">ยังไม่จัดทำ</div>
              <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                {stats.noPlan}
              </div>
              <div className="flex items-center justify-between text-[11px] mt-0.5">
                <span className="text-slate-500">หมู่บ้าน</span>
                <span className="text-rose-600 font-bold flex items-center gap-0.5">
                  <span>↓</span>
                  <span>{stats.noPlanPct}%</span>
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* 4. Filter Toolbar (Search + 3 Selects + ค้นหา + รีเซ็ต) */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-4 shadow-2xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 items-center">
            
            {/* Search Input (md:col-span-4) */}
            <div className="md:col-span-4 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => {
                  setSearchKeyword(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="ค้นหาชื่อหมู่บ้าน / รหัสหมู่บ้าน / ตำบล ..."
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50/60 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 placeholder-slate-400 font-medium"
              />
              {searchKeyword && (
                <button
                  type="button"
                  onClick={() => setSearchKeyword('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Select 1: ตำบล */}
            <div className="md:col-span-2">
              <div className="relative">
                <span className="absolute -top-2 left-2 px-1 bg-white text-[10px] font-bold text-slate-500 z-10">
                  ตำบล
                </span>
                <select
                  value={selectedSubdistrict}
                  onChange={(e) => {
                    setSelectedSubdistrict(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full py-2 px-3 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 font-medium cursor-pointer"
                >
                  {subdistrictsList.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Select 2: อำเภอ */}
            <div className="md:col-span-2">
              <div className="relative">
                <span className="absolute -top-2 left-2 px-1 bg-white text-[10px] font-bold text-slate-500 z-10">
                  อำเภอ
                </span>
                <select
                  value={selectedDistrict}
                  onChange={(e) => {
                    setSelectedDistrict(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full py-2 px-3 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 font-medium cursor-pointer"
                >
                  {districtsList.map((dist) => (
                    <option key={dist} value={dist}>
                      {dist}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Select 3: สถานะ */}
            <div className="md:col-span-2">
              <div className="relative">
                <span className="absolute -top-2 left-2 px-1 bg-white text-[10px] font-bold text-slate-500 z-10">
                  สถานะ
                </span>
                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full py-2 px-3 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 font-medium cursor-pointer"
                >
                  <option value="ทั้งหมด">ทั้งหมด</option>
                  <option value="มีแผนแล้ว">มีแผนแล้ว</option>
                  <option value="อยู่ระหว่างจัดทำ">อยู่ระหว่างจัดทำ</option>
                  <option value="ยังไม่จัดทำ">ยังไม่จัดทำ</option>
                </select>
              </div>
            </div>

            {/* Buttons: ค้นหา & รีเซ็ต */}
            <div className="md:col-span-2 flex items-center gap-2">
              <button
                type="button"
                className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>ค้นหา</span>
              </button>
              <button
                type="button"
                onClick={handleResetFilters}
                className="py-2 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs sm:text-sm shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>รีเซ็ต</span>
              </button>
            </div>

          </div>
        </div>

        {/* ========================================================================= */}
        {/* 5. 2-Column Main Section: Left (Table 8 cols) | Right (3 Widgets 4 cols) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
          
          {/* LEFT 8/12: รายการแผนรายหมู่บ้าน (Table) */}
          <div className="xl:col-span-8 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
              
              {/* Header */}
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>รายการแผนรายหมู่บ้าน</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-bold bg-slate-100 text-slate-600">
                    {filteredVillages.length} หมู่บ้าน
                  </span>
                </h2>
              </div>

              {/* Responsive Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 text-slate-600 border-b border-slate-200 font-bold">
                      <th className="py-3 px-3.5 text-center w-12">ลำดับ</th>
                      <th className="py-3 px-3.5 text-center w-24">รหัสหมู่บ้าน</th>
                      <th className="py-3 px-4 min-w-[130px]">หมู่บ้าน</th>
                      <th className="py-3 px-3.5 min-w-[120px]">ตำบล</th>
                      <th className="py-3 px-3.5 min-w-[100px]">อำเภอ</th>
                      <th className="py-3 px-3.5 text-center min-w-[120px]">สถานะ</th>
                      <th className="py-3 px-3.5 text-center min-w-[100px]">ปีที่จัดทำ</th>
                      <th className="py-3 px-3.5 text-center min-w-[120px]">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {paginatedVillages.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          ไม่พบข้อมูลหมู่บ้านที่ตรงกับเงื่อนไขการค้นหา
                        </td>
                      </tr>
                    ) : (
                      paginatedVillages.map((village, idx) => {
                        const actualIdx = (currentPage - 1) * pageSize + idx + 1;
                        return (
                          <tr
                            key={village.id}
                            className="hover:bg-blue-50/30 transition-colors group"
                          >
                            {/* ลำดับ */}
                            <td className="py-3 px-3.5 text-center font-mono text-slate-500">
                              {actualIdx}
                            </td>

                            {/* รหัสหมู่บ้าน */}
                            <td className="py-3 px-3.5 text-center font-mono font-bold text-slate-800">
                              {village.code}
                            </td>

                            {/* หมู่บ้าน */}
                            <td className="py-3 px-4 font-bold text-slate-900">
                              {village.villageName}
                            </td>

                            {/* ตำบล */}
                            <td className="py-3 px-3.5 text-slate-600">
                              {village.subdistrict}
                            </td>

                            {/* อำเภอ */}
                            <td className="py-3 px-3.5 text-slate-600">
                              {village.district}
                            </td>

                            {/* สถานะ (Exact 3 status pill styles) */}
                            <td className="py-3 px-3.5 text-center">
                              {village.status === 'has_plan' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <Check className="w-3 h-3 stroke-[2.5]" />
                                  <span>มีแผนแล้ว</span>
                                </span>
                              )}
                              {village.status === 'in_progress' && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                  <span>อยู่ระหว่างจัดทำ</span>
                                </span>
                              )}
                              {village.status === 'no_plan' && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                  <span>ยังไม่จัดทำ</span>
                                </span>
                              )}
                            </td>

                            {/* ปีที่จัดทำ */}
                            <td className="py-3 px-3.5 text-center font-mono text-slate-600">
                              {village.planYears}
                            </td>

                            {/* จัดการ (ดูรายละเอียด + 3 dots menu) */}
                            <td className="py-3 px-3.5 text-center relative">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setSelectedVillageDetail(village)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs transition-colors cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>ดูรายละเอียด</span>
                                </button>
                                
                                <div className="relative">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setOpenActionDropdownId(
                                        openActionDropdownId === village.id ? null : village.id
                                      )
                                    }
                                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                                    title="เมนูเพิ่มเติม"
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </button>

                                  {/* Dropdown Menu */}
                                  {openActionDropdownId === village.id && (
                                    <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-30 text-left text-xs animate-in fade-in zoom-in-95 duration-150">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedVillageDetail(village);
                                          setOpenActionDropdownId(null);
                                        }}
                                        className="w-full px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center gap-2 font-medium"
                                      >
                                        <Layers className="w-3.5 h-3.5 text-blue-600" />
                                        <span>ดูโครงการในหมู่บ้าน</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          onAddNewProject?.(parseInt(village.code, 10));
                                          setOpenActionDropdownId(null);
                                        }}
                                        className="w-full px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center gap-2 font-medium"
                                      >
                                        <Plus className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>เพิ่มโครงการลงในแผน</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleDownloadExcel();
                                          setOpenActionDropdownId(null);
                                        }}
                                        className="w-full px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center gap-2 font-medium"
                                      >
                                        <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
                                        <span>ส่งออกสรุปข้อมูล</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Footer */}
              <div className="px-5 py-3.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
                <div>
                  แสดง {(currentPage - 1) * pageSize + 1} –{' '}
                  {Math.min(currentPage * pageSize, filteredVillages.length)} จาก{' '}
                  {filteredVillages.length} รายการ
                </div>
                <div className="flex items-center gap-1 self-center sm:self-auto">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    title="หน้าก่อนหน้า"
                  >
                    <ChevronLeft className="w-4 h-4 text-slate-600" />
                  </button>

                  {Array.from({ length: totalPages }).map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    title="หน้าถัดไป"
                  >
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* RIGHT 4/12: 3 Cards (Map + Donut Summary + Related Documents) */}
          <div className="xl:col-span-4 space-y-4">
            
            {/* Widget 1: แผนที่แสดงที่ตั้งหมู่บ้าน */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                แผนที่แสดงที่ตั้งหมู่บ้าน
              </h3>

              {/* Map Canvas Box with Styled SVG Map */}
              <div className="relative w-full h-56 rounded-xl overflow-hidden border border-slate-200 bg-[#e2f1e8] shadow-inner select-none">
                {/* SVG Geography / Water reservoir and roads */}
                <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="waterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#bfdbfe" />
                      <stop offset="100%" stopColor="#93c5fd" />
                    </linearGradient>
                  </defs>
                  
                  {/* Water Body (Lake / River curve) */}
                  <path
                    d="M-20,180 Q100,120 180,140 T320,130 Q380,160 420,110 L420,240 L-20,240 Z"
                    fill="url(#waterGrad)"
                    opacity="0.85"
                  />
                  <path
                    d="M120,0 Q160,80 180,140 Q200,200 240,240"
                    stroke="#93c5fd"
                    strokeWidth="14"
                    fill="none"
                    opacity="0.6"
                  />

                  {/* Roads network */}
                  <path d="M0,80 Q150,100 240,60 T420,90" stroke="#ffffff" strokeWidth="4" fill="none" />
                  <path d="M80,0 Q120,110 200,160 T350,240" stroke="#ffffff" strokeWidth="3" fill="none" />
                  <path d="M240,60 L380,180" stroke="#fef08a" strokeWidth="2.5" strokeDasharray="4 2" fill="none" />
                </svg>

                {/* Map Pins Matching image.png */}
                {/* Pin 1: หมู่ 06 บ้านเขาพระ (Green) */}
                <div
                  onClick={() => {
                    const v = villagePlans.find((x) => x.code === '06');
                    if (v) setSelectedVillageDetail(v);
                  }}
                  className="absolute top-5 left-1/4 -translate-x-1/2 cursor-pointer group flex items-center gap-1 z-10"
                >
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md ring-2 ring-white">
                    <MapPin className="w-3.5 h-3.5 fill-white" />
                  </div>
                  <div className="bg-white/95 px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-800 shadow-xs border border-slate-200 whitespace-nowrap">
                    หมู่ 06 บ้านเขาพระ
                  </div>
                </div>

                {/* Pin 2: หมู่ 03 บ้านทุ่งสว่าง (Yellow) */}
                <div
                  onClick={() => {
                    const v = villagePlans.find((x) => x.code === '03');
                    if (v) setSelectedVillageDetail(v);
                  }}
                  className="absolute top-20 right-6 cursor-pointer group flex items-center gap-1 z-10"
                >
                  <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-md ring-2 ring-white">
                    <MapPin className="w-3.5 h-3.5 fill-white" />
                  </div>
                  <div className="bg-white/95 px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-800 shadow-xs border border-slate-200 whitespace-nowrap">
                    หมู่ 03 บ้านทุ่งสว่าง
                  </div>
                </div>

                {/* Pin 3: หมู่ 01 บ้านหนองบัว (Blue) */}
                <div
                  onClick={() => {
                    const v = villagePlans.find((x) => x.code === '01');
                    if (v) setSelectedVillageDetail(v);
                  }}
                  className="absolute bottom-12 left-16 cursor-pointer group flex items-center gap-1 z-10"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md ring-2 ring-white">
                    <MapPin className="w-3.5 h-3.5 fill-white" />
                  </div>
                  <div className="bg-white/95 px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-800 shadow-xs border border-slate-200 whitespace-nowrap">
                    หมู่ 01 บ้านหนองบัว
                  </div>
                </div>

                {/* Pin 4: หมู่ 10 บ้านน้ำใส (Red) */}
                <div
                  onClick={() => {
                    const v = villagePlans.find((x) => x.code === '10');
                    if (v) setSelectedVillageDetail(v);
                  }}
                  className="absolute bottom-5 right-8 cursor-pointer group flex items-center gap-1 z-10"
                >
                  <div className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md ring-2 ring-white">
                    <MapPin className="w-3.5 h-3.5 fill-white" />
                  </div>
                  <div className="bg-white/95 px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-800 shadow-xs border border-slate-200 whitespace-nowrap">
                    หมู่ 10 บ้านน้ำใส
                  </div>
                </div>

                {/* Zoom Controls */}
                <div className="absolute bottom-2 left-2 flex flex-col bg-white rounded-lg shadow-xs border border-slate-200 overflow-hidden text-slate-700 text-xs font-bold">
                  <button type="button" className="px-2 py-1 hover:bg-slate-100 border-b border-slate-100">
                    +
                  </button>
                  <button type="button" className="px-2 py-1 hover:bg-slate-100">
                    -
                  </button>
                </div>
              </div>

              {/* Map Legend Overlay */}
              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100 text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="truncate">มีแผนแล้ว <strong>{stats.hasPlan}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                  <span className="truncate">อยู่ระหว่างจัดทำ <strong>{stats.inProgress}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                  <span className="truncate">ยังไม่จัดทำ <strong>{stats.noPlan}</strong></span>
                </div>
              </div>
            </div>

            {/* Widget 2: สรุปแผนรายหมู่บ้าน (Donut Chart) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                สรุปแผนรายหมู่บ้าน
              </h3>

              <div className="flex items-center justify-between gap-4 py-1">
                
                {/* SVG Donut Chart with center text */}
                <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    {/* Background circle */}
                    <circle cx="50" cy="50" r="38" stroke="#f1f5f9" strokeWidth="12" fill="none" />
                    {/* Slice 1: มีแผนแล้ว 80% (Green) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#10b981"
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={`${(stats.hasPlan / stats.total) * 238.76} 238.76`}
                      strokeDashoffset="0"
                      strokeLinecap="round"
                    />
                    {/* Slice 2: อยู่ระหว่างจัดทำ 13.3% (Amber) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#f59e0b"
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={`${(stats.inProgress / stats.total) * 238.76} 238.76`}
                      strokeDashoffset={`-${(stats.hasPlan / stats.total) * 238.76}`}
                      strokeLinecap="round"
                    />
                    {/* Slice 3: ยังไม่จัดทำ 6.7% (Rose) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#f43f5e"
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={`${(stats.noPlan / stats.total) * 238.76} 238.76`}
                      strokeDashoffset={`-${((stats.hasPlan + stats.inProgress) / stats.total) * 238.76}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  {/* Center Label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center leading-none">
                    <span className="text-xl font-black text-slate-800 font-mono">
                      {stats.total}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium mt-0.5">
                      หมู่บ้าน
                    </span>
                  </div>
                </div>

                {/* Legend with percentages */}
                <div className="flex-1 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className="text-slate-700">มีแผนแล้ว</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">{stats.hasPlan}</span>
                      <span className="text-slate-400 font-mono">{stats.hasPlanPct}%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <span className="text-slate-700">อยู่ระหว่างจัดทำ</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">{stats.inProgress}</span>
                      <span className="text-slate-400 font-mono">{stats.inProgressPct}%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      <span className="text-slate-700">ยังไม่จัดทำ</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">{stats.noPlan}</span>
                      <span className="text-slate-400 font-mono">{stats.noPlanPct}%</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Widget 3: เอกสาร/ข้อมูลที่เกี่ยวข้อง */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                เอกสาร/ข้อมูลที่เกี่ยวข้อง
              </h3>

              <div className="space-y-2.5">
                {/* 1. แบบฟอร์มแผนรายหมู่บ้าน */}
                <div
                  onClick={handleDownloadForm}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/80 hover:border-blue-300 hover:bg-blue-50/40 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-800 group-hover:text-blue-700 truncate">
                        แบบฟอร์มแผนรายหมู่บ้าน
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Download className="w-3 h-3 text-blue-500" />
                        <span>ดาวน์โหลดแบบฟอร์ม</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-colors shrink-0" />
                </div>

                {/* 2. คู่มือการจัดทำแผนรายหมู่บ้าน */}
                <div
                  onClick={handleDownloadGuide}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/80 hover:border-purple-300 hover:bg-purple-50/40 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-800 group-hover:text-purple-700 truncate">
                        คู่มือการจัดทำแผนรายหมู่บ้าน
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Download className="w-3 h-3 text-purple-500" />
                        <span>ดาวน์โหลดคู่มือ</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-purple-600 transition-colors shrink-0" />
                </div>

                {/* 3. รายชื่อหมู่บ้านทั้งหมด (Excel) */}
                <div
                  onClick={handleDownloadExcel}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/80 hover:border-emerald-300 hover:bg-emerald-50/40 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 truncate">
                        รายชื่อหมู่บ้านทั้งหมด (Excel)
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Download className="w-3 h-3 text-emerald-500" />
                        <span>ดาวน์โหลดไฟล์</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 transition-colors shrink-0" />
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* 6. Village Detail Modal (ดูรายละเอียด) */}
      {/* ========================================================================= */}
      {selectedVillageDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Home className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">
                      หมู่ที่ {selectedVillageDetail.code} {selectedVillageDetail.villageName}
                    </h2>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                        selectedVillageDetail.status === 'has_plan'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : selectedVillageDetail.status === 'in_progress'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {selectedVillageDetail.status === 'has_plan'
                        ? 'มีแผนแล้ว'
                        : selectedVillageDetail.status === 'in_progress'
                        ? 'อยู่ระหว่างจัดทำ'
                        : 'ยังไม่จัดทำ'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedVillageDetail.subdistrict} {selectedVillageDetail.district} จังหวัดขอนแก่น
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedVillageDetail(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
              
              {/* Village Info Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="text-slate-400 font-medium">รอบปีที่จัดทำแผน</div>
                  <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">
                    {selectedVillageDetail.planYears}
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="text-slate-400 font-medium">ประชากร</div>
                  <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">
                    {selectedVillageDetail.population ? selectedVillageDetail.population.toLocaleString() : '-'} คน
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="text-slate-400 font-medium">จำนวนครัวเรือน</div>
                  <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">
                    {selectedVillageDetail.households ? selectedVillageDetail.households.toLocaleString() : '-'} ครัวเรือน
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="text-slate-400 font-medium">ผู้นำชุมชน / ผู้ใหญ่บ้าน</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5 truncate">
                    {selectedVillageDetail.headmanName || '-'}
                  </div>
                </div>
              </div>

              {/* Projects in this Village */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span>โครงการพัฒนาท้องถิ่นที่เกี่ยวข้องในหมู่บ้านนี้ ({villageProjects.length})</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      onAddNewProject?.(parseInt(selectedVillageDetail.code, 10));
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-bold transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>เพิ่มโครงการใหม่</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold">
                        <th className="py-2.5 px-3 w-12 text-center">ลำดับ</th>
                        <th className="py-2.5 px-3 w-28">รหัสโครงการ</th>
                        <th className="py-2.5 px-3 min-w-[200px]">ชื่อโครงการ</th>
                        <th className="py-2.5 px-3">แผนงาน / ยุทธศาสตร์</th>
                        <th className="py-2.5 px-3 text-right">งบประมาณ (บาท)</th>
                        <th className="py-2.5 px-3 text-center">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {villageProjects.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400">
                            ยังไม่มีโครงการบรรจุลงในแผนสำหรับหมู่บ้านนี้
                          </td>
                        </tr>
                      ) : (
                        villageProjects.map((p, pIdx) => (
                          <tr key={p.id} className="hover:bg-slate-50">
                            <td className="py-2 px-3 text-center font-mono text-slate-500">{pIdx + 1}</td>
                            <td className="py-2 px-3 font-mono font-bold text-slate-700">
                              {getProjectDisplayId(p, p.orderNumber || pIdx + 1)}
                            </td>
                            <td className="py-2 px-3 font-bold text-slate-900">{p.name}</td>
                            <td className="py-2 px-3 text-slate-600 truncate max-w-[180px]">
                              {p.planCategory || p.planStrategy}
                            </td>
                            <td className="py-2 px-3 font-mono text-right font-bold text-emerald-700">
                              {(p.budgetApproved || p.budgetPlan || 0).toLocaleString()}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => onViewProjectDetail(p)}
                                className="text-blue-600 hover:text-blue-800 font-bold hover:underline"
                              >
                                รายละเอียด
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    {villageProjects.length > 0 && (
                      <tfoot>
                        <tr className="bg-slate-50 font-bold text-slate-900 border-t border-slate-200">
                          <td colSpan={4} className="py-2.5 px-3 text-right">
                            งบประมาณรวมทั้งสิ้น:
                          </td>
                          <td className="py-2.5 px-3 font-mono text-right text-emerald-800 font-black">
                            {villageTotalBudget.toLocaleString()}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500">
                ข้อมูลแผนพัฒนาท้องถิ่น เทศบาลเมืองศิลา พ.ศ. 2571 - 2575
              </span>
              <button
                type="button"
                onClick={() => setSelectedVillageDetail(null)}
                className="px-4 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. Create New Village Plan Modal (+ สร้างแผนรายหมู่บ้านใหม่) */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">สร้างแผนรายหมู่บ้านใหม่</h2>
                  <p className="text-xs text-slate-500">บันทึกข้อมูลแผนพัฒนาท้องถิ่นระดับหมู่บ้าน/ชุมชน</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateVillageSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  ชื่อหมู่บ้าน/ชุมชน <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น บ้านโนนตุ่น, บ้านดงพอง"
                  value={newVillageForm.villageName}
                  onChange={(e) => setNewVillageForm({ ...newVillageForm, villageName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ตำบล</label>
                  <input
                    type="text"
                    value={newVillageForm.subdistrict}
                    onChange={(e) => setNewVillageForm({ ...newVillageForm, subdistrict: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">อำเภอ</label>
                  <input
                    type="text"
                    value={newVillageForm.district}
                    onChange={(e) => setNewVillageForm({ ...newVillageForm, district: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">สถานะการจัดทำ</label>
                  <select
                    value={newVillageForm.status}
                    onChange={(e) =>
                      setNewVillageForm({
                        ...newVillageForm,
                        status: e.target.value as any
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                  >
                    <option value="has_plan">มีแผนแล้ว</option>
                    <option value="in_progress">อยู่ระหว่างจัดทำ</option>
                    <option value="no_plan">ยังไม่จัดทำ</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">รอบปีที่จัดทำ</label>
                  <input
                    type="text"
                    value={newVillageForm.planYears}
                    onChange={(e) => setNewVillageForm({ ...newVillageForm, planYears: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ผู้นำชุมชน/ผู้ใหญ่บ้าน</label>
                  <input
                    type="text"
                    placeholder="ชื่อ-นามสกุล"
                    value={newVillageForm.headmanName}
                    onChange={(e) => setNewVillageForm({ ...newVillageForm, headmanName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">เบอร์โทรศัพท์ติดต่อ</label>
                  <input
                    type="text"
                    placeholder="08x-xxx-xxxx"
                    value={newVillageForm.contactPhone}
                    onChange={(e) => setNewVillageForm({ ...newVillageForm, contactPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs"
                >
                  บันทึกข้อมูล
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
