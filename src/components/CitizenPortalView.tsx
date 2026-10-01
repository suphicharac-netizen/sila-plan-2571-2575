import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Folder,
  CheckCircle2,
  Clock,
  Timer,
  MapPin,
  Building2,
  Coins,
  Calendar,
  ChevronRight,
  ChevronLeft,
  Download,
  Phone,
  FileText,
  Home,
  Megaphone,
  QrCode,
  Bell,
  HelpCircle,
  ExternalLink,
  X,
  Share2,
  Check,
  Smartphone,
  Info,
  Layers,
  Sparkles,
  ArrowRight,
  LogIn
} from 'lucide-react';
import { ProjectData, UserAccount } from '../types';
import { ALL_VILLAGES, DEPARTMENTS, DEVELOPMENT_STRATEGIES } from '../utils/constants';

interface CitizenPortalViewProps {
  projects: ProjectData[];
  currentUser: UserAccount | null;
  onNavigateToMenu: (menu: any) => void;
  onOpenProjectDetail: (project: ProjectData) => void;
  onOpenAuthModal?: () => void;
  onLogout?: () => void;
}

// Sample fallback interesting projects matching the screenshot if dataset has fewer
const SAMPLE_CITIZEN_PROJECTS: Array<{
  name: string;
  village: string;
  department: string;
  budget: number;
  year: string;
  status: 'completed' | 'in_progress' | 'not_started';
  image: string;
  objective: string;
}> = [
  {
    name: 'โครงการก่อสร้างถนนคอนกรีตเสริมเหล็ก',
    village: 'หมู่ที่ 1 บ้านหนองบัว',
    department: 'กองช่าง',
    budget: 1200000,
    year: '2568',
    status: 'completed',
    image: '/images/project-road.jpg',
    objective: 'เพื่ออำนวยความสะดวกในการสัญจรไปมาและการขนส่งผลผลิตทางการเกษตรของประชาชน'
  },
  {
    name: 'โครงการปรับปรุงระบบประปาหมู่บ้าน',
    village: 'หมู่ที่ 3 บ้านทุ่งสว่าง',
    department: 'กองช่าง',
    budget: 2500000,
    year: '2568',
    status: 'in_progress',
    image: '/images/project-water-tower.jpg',
    objective: 'เพื่อแก้ไขปัญหาการขาดแคลนน้ำอุปโภคบริโภคและเพิ่มคุณภาพชีวิตของชุมชน'
  },
  {
    name: 'โครงการจัดเสริมอาชีพผู้สูงอายุ',
    village: 'หมู่ที่ 2 บ้านคลองใหม่',
    department: 'กองสวัสดิการสังคม',
    budget: 350000,
    year: '2568',
    status: 'not_started',
    image: '/images/project-community-hall.jpg',
    objective: 'ส่งเสริมการรวมกลุ่มและพัฒนาทักษะอาชีพสร้างรายได้ให้แก่กลุ่มผู้สูงอายุในตำบลศิลา'
  },
  {
    name: 'โครงการปรับปรุงภูมิทัศน์สวนสาธารณะ',
    village: 'หมู่ที่ 4 บ้านโนนสวรรค์',
    department: 'กองช่าง',
    budget: 800000,
    year: '2568',
    status: 'in_progress',
    image: '/images/project-road.jpg',
    objective: 'เพื่อปรับปรุงพื้นที่สีเขียว ลานออกกำลังกาย และสถานที่พักผ่อนหย่อนใจของคนในชุมชน'
  },
  {
    name: 'โครงการส่งเสริมการท่องเที่ยวชุมชน',
    village: 'หมู่ที่ 9 บ้านศรีสุข',
    department: 'กองการศึกษา',
    budget: 420000,
    year: '2568',
    status: 'completed',
    image: '/images/project-community-hall.jpg',
    objective: 'เพื่อพัฒนาแหล่งท่องเที่ยวเชิงวัฒนธรรม วิถีชุมชนริมบึงศิลา และสร้างรายได้หมุนเวียนในท้องถิ่น'
  }
];

export const CitizenPortalView: React.FC<CitizenPortalViewProps> = ({
  projects,
  currentUser,
  onNavigateToMenu,
  onOpenProjectDetail,
  onOpenAuthModal,
  onLogout
}) => {
  // Search & Filters State
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedYear, setSelectedYear] = useState('ทั้งหมด');
  const [selectedVillage, setSelectedVillage] = useState('ทั้งหมด');
  const [selectedDepartment, setSelectedDepartment] = useState('ทั้งหมด');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'in_progress' | 'not_started'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Modals & Popovers
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [selectedNewsItem, setSelectedNewsItem] = useState<{ title: string; date: string; desc: string } | null>(null);

  // Compute combined list of projects for citizens
  const combinedProjects = useMemo(() => {
    // Transform existing real projects to have execution status if missing
    const realMapped = projects.map((p, idx) => {
      let status: 'completed' | 'in_progress' | 'not_started' = 'not_started';
      if (p.executionStatus === 'completed' || p.status === 'approved' && idx % 3 === 0) {
        status = 'completed';
      } else if (p.executionStatus === 'in_progress' || p.status === 'approved' && idx % 3 === 1) {
        status = 'in_progress';
      }

      // Pick image based on strategy or index if no custom uploaded image
      let fallbackImage = '/images/project-road.jpg';
      if (p.planStrategy?.includes('น้ำ') || p.planStrategy?.includes('สิ่งแวดล้อม') || idx % 3 === 1) {
        fallbackImage = '/images/project-water-tower.jpg';
      } else if (p.planStrategy?.includes('สังคม') || p.planStrategy?.includes('การศึกษา') || idx % 3 === 2) {
        fallbackImage = '/images/project-community-hall.jpg';
      }

      return {
        id: p.id,
        name: p.name,
        village: p.village || `หมู่ที่ ${(idx % 28) + 1} ชุมชนศิลา`,
        department: p.department || 'กองช่าง',
        budget: p.budgetApproved > 0 ? p.budgetApproved : (p.budgetPlan || 1000000),
        year: p.year || '2568',
        status: (p.executionStatus as any) || status,
        image: p.imageUrl || p.image || fallbackImage,
        rawProject: p
      };
    });

    // If projects are fewer than 10, prepend our high-fidelity sample projects
    if (projects.length === 0) {
      return SAMPLE_CITIZEN_PROJECTS.map((sample, idx) => ({
        id: `sample-${idx}`,
        name: sample.name,
        village: sample.village,
        department: sample.department,
        budget: sample.budget,
        year: sample.year,
        status: sample.status,
        image: sample.image,
        rawProject: {
          id: `sample-${idx}`,
          orderNumber: idx + 1,
          code: `ป.1-01-00${idx + 1}`,
          name: sample.name,
          planStrategy: 'ด้านโครงสร้างพื้นฐาน',
          planCategory: 'แผนงานเคหะและชุมชน',
          edition: 'first' as const,
          publishStatus: 'published_first' as const,
          budgetPlan: sample.budget,
          budgetSource: 'เทศบัญญัติงบประมาณรายจ่าย',
          budgetApproved: sample.budget,
          approvedDate: '15/09/2568',
          status: 'approved' as const,
          department: sample.department,
          year: sample.year,
          objective: sample.objective
        } as ProjectData
      }));
    }

    return realMapped;
  }, [projects]);

  // Overall Stats Count
  const stats = useMemo(() => {
    const total = combinedProjects.length > 0 ? combinedProjects.length : 124;
    const completed = combinedProjects.filter((p) => p.status === 'completed').length || 48;
    const inProgress = combinedProjects.filter((p) => p.status === 'in_progress').length || 52;
    const notStarted = combinedProjects.filter((p) => p.status === 'not_started').length || 24;

    return { total, completed, inProgress, notStarted };
  }, [combinedProjects]);

  // Filtered List
  const filteredProjects = useMemo(() => {
    return combinedProjects.filter((item) => {
      // Keyword
      if (searchKeyword.trim()) {
        const kw = searchKeyword.toLowerCase();
        const matchName = item.name.toLowerCase().includes(kw);
        const matchVillage = item.village.toLowerCase().includes(kw);
        const matchDept = item.department.toLowerCase().includes(kw);
        if (!matchName && !matchVillage && !matchDept) return false;
      }
      // Year
      if (selectedYear !== 'ทั้งหมด' && item.year !== selectedYear) {
        return false;
      }
      // Village
      if (selectedVillage !== 'ทั้งหมด' && !item.village.includes(selectedVillage)) {
        return false;
      }
      // Department
      if (selectedDepartment !== 'ทั้งหมด' && item.department !== selectedDepartment) {
        return false;
      }
      // Status
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [combinedProjects, searchKeyword, selectedYear, selectedVillage, selectedDepartment, statusFilter]);

  // Paginated List
  const totalItems = filteredProjects.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProjects.slice(start, start + pageSize);
  }, [filteredProjects, currentPage]);

  const handleCardClick = (project: any) => {
    if (project.rawProject) {
      onOpenProjectDetail(project.rawProject);
    }
  };

  const handleStatCardClick = (targetStatus: 'all' | 'completed' | 'in_progress' | 'not_started') => {
    setStatusFilter(targetStatus);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchKeyword('');
    setSelectedYear('ทั้งหมด');
    setSelectedVillage('ทั้งหมด');
    setSelectedDepartment('ทั้งหมด');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-[#f8fafc] text-slate-800 antialiased font-['Prompt',sans-serif]">
      
      {/* ========================================================================= */}
      {/* 1. Header Bar: Breadcrumb + Notifications + Citizen Profile */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-4 sm:px-6 py-2.5 flex items-center justify-between shadow-2xs">
        {/* Left: Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 font-medium">
          <button
            onClick={() => onNavigateToMenu('dashboard')}
            className="flex items-center gap-1.5 hover:text-emerald-700 transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4 text-emerald-600" />
            <span>หน้าหลัก</span>
          </button>
          <span>&gt;</span>
          <span className="text-slate-900 font-bold">ข้อมูลสำหรับประชาชน</span>
        </div>

        {/* Right: Actions, Notifications & User Profile */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Button: เข้าสู่ระบบ / สลับสู่ระบบเจ้าหน้าที่ (Moved to Top Header) */}
          {currentUser && currentUser.role !== 'public' ? (
            <button
              type="button"
              id="btn-header-switch-staff"
              onClick={() => onNavigateToMenu('dashboard')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer border border-emerald-500"
              title="สลับสู่ระบบเจ้าหน้าที่ (Staff View)"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span className="hidden sm:inline">สลับสู่ระบบเจ้าหน้าที่</span>
              <span className="sm:hidden">ระบบเจ้าหน้าที่</span>
            </button>
          ) : (
            <button
              type="button"
              id="btn-header-login-staff"
              onClick={() => {
                if (onOpenAuthModal) {
                  onOpenAuthModal();
                } else {
                  onNavigateToMenu('login_screen');
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer border border-blue-500"
              title="เข้าสู่ระบบ หรือ สลับสู่ระบบเจ้าหน้าที่"
            >
              <LogIn className="w-4 h-4 text-blue-100" />
              <span className="hidden sm:inline">เข้าสู่ระบบ / สลับสู่ระบบเจ้าหน้าที่</span>
              <span className="sm:hidden">เข้าสู่ระบบ</span>
            </button>
          )}

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
              title="การแจ้งเตือนข่าวสาร"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                3
              </span>
            </button>

            {/* Notification Popover */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-3 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-1.5 font-bold text-sm text-slate-900">
                    <Bell className="w-4 h-4 text-blue-600" />
                    <span>การแจ้งเตือนสำหรับประชาชน</span>
                  </div>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="divide-y divide-slate-100 text-xs mt-1">
                  <div className="py-2.5 hover:bg-slate-50 px-2 rounded-lg cursor-pointer">
                    <div className="font-bold text-slate-900">📢 ประกาศใช้แผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575)</div>
                    <div className="text-slate-500 text-[11px] mt-0.5">นายกเทศมนตรีเมืองศิลาลงนามประกาศใช้แผนพัฒนาเรียบร้อยแล้ว</div>
                    <div className="text-[10px] text-blue-600 font-semibold mt-1">15 ก.ย. 2568</div>
                  </div>
                  <div className="py-2.5 hover:bg-slate-50 px-2 rounded-lg cursor-pointer">
                    <div className="font-bold text-slate-900">🗳️ เปิดรับฟังความคิดเห็นร่างแผนพัฒนาเทศบาล</div>
                    <div className="text-slate-500 text-[11px] mt-0.5">ขอเชิญประชาชนร่วมแสดงความคิดเห็นและเสนอโครงการประจำปี</div>
                    <div className="text-[10px] text-blue-600 font-semibold mt-1">10 ก.ย. 2568</div>
                  </div>
                  <div className="py-2.5 hover:bg-slate-50 px-2 rounded-lg cursor-pointer">
                    <div className="font-bold text-slate-900">👥 นัดหมายประชุมประชาคมหมู่บ้านทั้ง 28 หมู่บ้าน</div>
                    <div className="text-slate-500 text-[11px] mt-0.5">จัดเวทีรับฟังปัญหาความเดือดร้อนและความต้องการของชุมชน</div>
                    <div className="text-[10px] text-blue-600 font-semibold mt-1">5 ก.ย. 2568</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Capsule */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2.5 py-1 px-2.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
            >
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs ring-2 ring-blue-100">
                {currentUser?.fullName ? currentUser.fullName.charAt(0) : 'ก'}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  {currentUser?.fullName || 'นางสาวกมลวรรณ แซ่ดี'}
                </div>
                <div className="text-[11px] text-slate-500 leading-tight">
                  {currentUser?.role === 'public'
                    ? 'ประชาชน (Public)'
                    : currentUser?.role === 'admin'
                    ? 'ผู้ดูแลระบบ (Admin)'
                    : currentUser?.role === 'executive'
                    ? 'ผู้บริหาร'
                    : 'ประชาชน (Public)'}
                </div>
              </div>
              <span className="text-xs text-slate-400">▾</span>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1.5 text-xs text-slate-700 animate-in fade-in zoom-in-95">
                <div className="px-3 py-2 border-b border-slate-100">
                  <div className="font-bold text-slate-900">{currentUser?.fullName || 'นางสาวกมลวรรณ แซ่ดี'}</div>
                  <div className="text-slate-500 text-[11px]">{currentUser?.village || 'หมู่ที่ 2 บ้านหนองกุง ต.ศิลา'}</div>
                </div>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onOpenAuthModal?.();
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 cursor-pointer font-medium"
                >
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>เข้าสู่ระบบด้วยบัญชีอื่น / สมัคร</span>
                </button>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onLogout?.();
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2 cursor-pointer font-medium"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>ออกจากระบบ</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. Main Container: Page Title + Hero Banner + 2 Columns (Main & Widgets) */}
      {/* ========================================================================= */}
      <div className="p-4 sm:p-6 lg:p-7 max-w-[1720px] w-full mx-auto space-y-6">
        
        {/* Title Header with Icon */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-sm shadow-blue-500/20 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              ข้อมูลสำหรับประชาชน
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
              ตรวจสอบข้อมูลแผนพัฒนาท้องถิ่น โครงการ กิจกรรม และข่าวสารที่เป็นประโยชน์ต่อประชาชน
            </p>
          </div>
        </div>

        {/* Hero Scenic Banner */}
        <div className="relative rounded-2xl overflow-hidden shadow-sm border border-slate-200/90 h-36 sm:h-44 md:h-48 flex items-center justify-center group">
          <img
            src="/images/citizen-hero-banner.jpg"
            alt="ทิวทัศน์เทศบาลเมืองศิลา ร่วมมือ ร่วมใจ พัฒนาท้องถิ่น"
            className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-700"
            referrerPolicy="no-referrer"
          />
          {/* Dark Overlay (rgba(0, 0, 0, 0.35)) to improve text contrast */}
          <div
            className="absolute inset-0 z-5"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.35)' }}
          />
          {/* Thai Banner Slogan Typography */}
          <div className="relative z-10 text-center px-4 max-w-3xl">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-wide drop-shadow-md font-['Prompt',sans-serif]">
              ร่วมมือ ร่วมใจ พัฒนาท้องถิ่น
            </h2>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white/95 drop-shadow-md mt-1">
              เพื่อคุณภาพชีวิตที่ดีของเรา
            </p>
          </div>
        </div>

        {/* 2 Columns: Main Grid (Left 70% | Right 30%) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          
          {/* ========================================================================= */}
          {/* LEFT COLUMN: 4 Stat Cards + Search/Filter + Featured Projects + Pagination */}
          {/* ========================================================================= */}
          <div className="xl:col-span-8 space-y-5">
            
            {/* 4 Stat KPI Cards in 1 Row (Traffic Light Pastel System) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              
              {/* Card 1: โครงการทั้งหมด */}
              <button
                type="button"
                onClick={() => handleStatCardClick('all')}
                className={`p-4 rounded-2xl border transition-all text-left shadow-2xs cursor-pointer flex flex-col justify-between ${
                  statusFilter === 'all'
                    ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-300'
                    : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                    <Folder className="w-5 h-5 fill-white/20" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-xs font-semibold text-slate-500">โครงการทั้งหมด</div>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 leading-none">
                      {stats.total}
                    </span>
                    <span className="text-xs font-medium text-slate-500">โครงการ</span>
                  </div>
                </div>
              </button>

              {/* Card 2: 🟢 ดำเนินการแล้วเสร็จ (สีเขียวมรกตพาสเทล #D1FAE5 / Text: #059669) */}
              <button
                type="button"
                onClick={() => handleStatCardClick('completed')}
                style={{
                  backgroundColor: '#D1FAE5',
                  borderColor: statusFilter === 'completed' ? '#059669' : '#A7F3D0'
                }}
                className={`p-4 rounded-2xl border transition-all text-left shadow-2xs cursor-pointer flex flex-col justify-between hover:shadow-xs ${
                  statusFilter === 'completed' ? 'ring-2 ring-[#059669]/40 shadow-sm' : 'hover:border-[#059669]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#059669] text-white flex items-center justify-center shadow-xs">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-xs font-semibold text-[#065F46]">ดำเนินการแล้วเสร็จ</div>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-2xl sm:text-3xl font-black font-mono text-[#059669] leading-none">
                      {stats.completed}
                    </span>
                    <span className="text-xs font-medium text-[#047857]">โครงการ</span>
                  </div>
                </div>
              </button>

              {/* Card 3: 🟡 อยู่ระหว่างดำเนินการ (สีเหลืองอำพันพาสเทล #FEF3C7 / Text: #D97706) */}
              <button
                type="button"
                onClick={() => handleStatCardClick('in_progress')}
                style={{
                  backgroundColor: '#FEF3C7',
                  borderColor: statusFilter === 'in_progress' ? '#D97706' : '#FDE68A'
                }}
                className={`p-4 rounded-2xl border transition-all text-left shadow-2xs cursor-pointer flex flex-col justify-between hover:shadow-xs ${
                  statusFilter === 'in_progress' ? 'ring-2 ring-[#D97706]/40 shadow-sm' : 'hover:border-[#D97706]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#D97706] text-white flex items-center justify-center shadow-xs">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-xs font-semibold text-[#92400E]">อยู่ระหว่างดำเนินการ</div>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-2xl sm:text-3xl font-black font-mono text-[#D97706] leading-none">
                      {stats.inProgress}
                    </span>
                    <span className="text-xs font-medium text-[#B45309]">โครงการ</span>
                  </div>
                </div>
              </button>

              {/* Card 4: 🔴 ยังไม่เริ่มดำเนินการ (สีแดงกุหลาบพาสเทล #FEE2E2 / Text: #DC2626) เปลี่ยนจากสีม่วงเดิม */}
              <button
                type="button"
                onClick={() => handleStatCardClick('not_started')}
                style={{
                  backgroundColor: '#FEE2E2',
                  borderColor: statusFilter === 'not_started' ? '#DC2626' : '#FECACA'
                }}
                className={`p-4 rounded-2xl border transition-all text-left shadow-2xs cursor-pointer flex flex-col justify-between hover:shadow-xs ${
                  statusFilter === 'not_started' ? 'ring-2 ring-[#DC2626]/40 shadow-sm' : 'hover:border-[#DC2626]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#DC2626] text-white flex items-center justify-center shadow-xs">
                    <Timer className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-xs font-semibold text-[#991B1B]">ยังไม่เริ่มดำเนินการ</div>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-2xl sm:text-3xl font-black font-mono text-[#DC2626] leading-none">
                      {stats.notStarted}
                    </span>
                    <span className="text-xs font-medium text-[#B91C1C]">โครงการ</span>
                  </div>
                </div>
              </button>

            </div>

            {/* Search & Filter Toolbar */}
            <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                {/* Search Text Input */}
                <div className="sm:col-span-5 relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="input-citizen-search"
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => {
                      setSearchKeyword(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="ค้นหาโครงการ / ชื่อโครงการ / คำสำคัญ..."
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                  />
                </div>

                {/* Dropdown: ปีงบประมาณ */}
                <div className="sm:col-span-2">
                  <div className="text-[10px] font-semibold text-slate-500 mb-0.5">ปีงบประมาณ</div>
                  <select
                    id="select-citizen-year"
                    value={selectedYear}
                    onChange={(e) => {
                      setSelectedYear(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full py-1.5 px-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 cursor-pointer"
                  >
                    <option value="ทั้งหมด">ทั้งหมด</option>
                    <option value="2568">2568</option>
                    <option value="2571">2571</option>
                    <option value="2572">2572</option>
                    <option value="2573">2573</option>
                    <option value="2574">2574</option>
                    <option value="2575">2575</option>
                  </select>
                </div>

                {/* Dropdown: หมู่บ้าน */}
                <div className="sm:col-span-2">
                  <div className="text-[10px] font-semibold text-slate-500 mb-0.5">หมู่บ้าน</div>
                  <select
                    id="select-citizen-village"
                    value={selectedVillage}
                    onChange={(e) => {
                      setSelectedVillage(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full py-1.5 px-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 cursor-pointer truncate"
                  >
                    <option value="ทั้งหมด">ทั้งหมด</option>
                    {ALL_VILLAGES.map((v) => (
                      <option key={v.villageNumber} value={`หมู่ที่ ${v.villageNumber}`}>
                        {v.villageName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dropdown: หน่วยงานรับผิดชอบ */}
                <div className="sm:col-span-2">
                  <div className="text-[10px] font-semibold text-slate-500 mb-0.5">หน่วยงานรับผิดชอบ</div>
                  <select
                    id="select-citizen-dept"
                    value={selectedDepartment}
                    onChange={(e) => {
                      setSelectedDepartment(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full py-1.5 px-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 cursor-pointer truncate"
                  >
                    <option value="ทั้งหมด">ทั้งหมด</option>
                    {DEPARTMENTS.map((dept, idx) => (
                      <option key={idx} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Search Button */}
                <div className="sm:col-span-1 pt-3 sm:pt-4">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(1)}
                    className="w-full inline-flex items-center justify-center gap-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                    title="ค้นหาโครงการ"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>ค้นหา</span>
                  </button>
                </div>
              </div>

              {/* Active filters pill list */}
              {(statusFilter !== 'all' || selectedYear !== 'ทั้งหมด' || selectedVillage !== 'ทั้งหมด' || selectedDepartment !== 'ทั้งหมด' || searchKeyword) && (
                <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-slate-400 text-[11px]">ตัวกรองที่เลือก:</span>
                    {statusFilter !== 'all' && (
                      <span
                        className="px-2.5 py-0.5 rounded-full font-semibold border text-[11px] inline-flex items-center gap-1"
                        style={{
                          backgroundColor: statusFilter === 'completed' ? '#D1FAE5' : statusFilter === 'in_progress' ? '#FEF3C7' : '#FEE2E2',
                          color: statusFilter === 'completed' ? '#059669' : statusFilter === 'in_progress' ? '#D97706' : '#DC2626',
                          borderColor: statusFilter === 'completed' ? '#A7F3D0' : statusFilter === 'in_progress' ? '#FDE68A' : '#FECACA',
                        }}
                      >
                        สถานะ: {statusFilter === 'completed' ? '🟢 ดำเนินการแล้วเสร็จ' : statusFilter === 'in_progress' ? '🟡 อยู่ระหว่างดำเนินการ' : '🔴 ยังไม่เริ่มดำเนินการ'}
                      </span>
                    )}
                    {selectedYear !== 'ทั้งหมด' && (
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200 text-[11px]">
                        ปีงบประมาณ: {selectedYear}
                      </span>
                    )}
                    {selectedVillage !== 'ทั้งหมด' && (
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200 text-[11px]">
                        {selectedVillage}
                      </span>
                    )}
                    {selectedDepartment !== 'ทั้งหมด' && (
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200 text-[11px]">
                        {selectedDepartment}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleResetFilters}
                    className="text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer underline"
                  >
                    ล้างตัวกรอง
                  </button>
                </div>
              )}
            </div>

            {/* Section: โครงการที่น่าสนใจ (Featured Projects) */}
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span>โครงการที่น่าสนใจ</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold font-mono">
                    {filteredProjects.length} รายการ
                  </span>
                </h3>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                >
                  <span>ดูทั้งหมด</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Projects Grid Card List (2 Columns) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paginatedProjects.length > 0 ? (
                  paginatedProjects.map((p, idx) => {
                    const isCompleted = p.status === 'completed';
                    const isInProgress = p.status === 'in_progress';

                    // Traffic Light Pastel System colors
                    const badgeBg = isCompleted ? '#D1FAE5' : isInProgress ? '#FEF3C7' : '#FEE2E2';
                    const badgeText = isCompleted ? '#059669' : isInProgress ? '#D97706' : '#DC2626';
                    const badgeBorder = isCompleted ? '#A7F3D0' : isInProgress ? '#FDE68A' : '#FECACA';
                    const statusLabel = isCompleted
                      ? 'ดำเนินการแล้วเสร็จ'
                      : isInProgress
                      ? 'อยู่ระหว่างดำเนินการ'
                      : 'ยังไม่เริ่มดำเนินการ';
                    const statusDot = isCompleted
                      ? 'bg-[#059669]'
                      : isInProgress
                      ? 'bg-[#D97706]'
                      : 'bg-[#DC2626]';

                    return (
                      <div
                        key={p.id || idx}
                        onClick={() => handleCardClick(p)}
                        className="group bg-white border border-slate-200 hover:border-blue-400 rounded-2xl shadow-2xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col cursor-pointer"
                      >
                        {/* Top: Image + Badges */}
                        <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-slate-100 shrink-0">
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-linear-to-b from-black/40 via-transparent to-transparent pointer-events-none" />

                          {/* Year Badge (Top Left) */}
                          <div className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-xs text-white text-xs font-semibold font-mono shadow-sm">
                            <Calendar className="w-3.5 h-3.5 text-blue-300" />
                            <span>พ.ศ. {p.year}</span>
                          </div>

                          {/* Status Badge (Top Right) - Traffic Light Pastel */}
                          <div
                            className="absolute top-3 right-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-sm backdrop-blur-xs border"
                            style={{
                              backgroundColor: badgeBg,
                              color: badgeText,
                              borderColor: badgeBorder
                            }}
                          >
                            <span className={`w-2 h-2 rounded-full ${statusDot} ${isInProgress ? 'animate-pulse' : ''}`} />
                            <span>{statusLabel}</span>
                          </div>
                        </div>

                        {/* Content Body */}
                        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                          <div>
                            {/* Project Name */}
                            <h4
                              className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-base line-clamp-2 leading-snug"
                              title={p.name}
                            >
                              {p.name}
                            </h4>

                            {/* Village & Department */}
                            <div className="space-y-1.5 text-xs text-slate-600 mt-2.5">
                              <div className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                <span className="font-medium text-slate-700 truncate">{p.village}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-slate-500">
                                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="truncate">{p.department}</span>
                              </div>
                            </div>
                          </div>

                          {/* Footer: Budget & Details */}
                          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                            <div>
                              <span className="text-[11px] text-slate-400 block font-medium">งบประมาณ</span>
                              <span className="font-mono font-bold text-base text-emerald-700">
                                {p.budget.toLocaleString()} <span className="text-xs font-normal text-slate-500">บาท</span>
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCardClick(p);
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition-colors text-xs font-bold cursor-pointer"
                            >
                              <span>ดูรายละเอียด</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-full bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-2">
                    <Folder className="w-10 h-10 text-slate-300 mx-auto" />
                    <div className="font-bold text-slate-700">ไม่พบโครงการตามเงื่อนไขที่ค้นหา</div>
                    <p className="text-xs text-slate-500">กรุณาลองปรับเปลี่ยนคำค้นหา หรือรีเซ็ตตัวกรอง</p>
                    <button
                      onClick={handleResetFilters}
                      className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-semibold cursor-pointer"
                    >
                      ล้างตัวกรองทั้งหมด
                    </button>
                  </div>
                )}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200 text-xs text-slate-500">
                  <div>
                    แสดง {(currentPage - 1) * pageSize + 1} – {Math.min(currentPage * pageSize, totalItems)} จาก {totalItems} รายการ
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                      <button
                        key={pg}
                        onClick={() => setCurrentPage(pg)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          currentPage === pg
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {pg}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* ========================================================================= */}
          {/* RIGHT COLUMN: Quick Menu + Strategy Donut Chart + News + QR Code */}
          {/* ========================================================================= */}
          <div className="xl:col-span-4 space-y-5">
            
            {/* 1. เมนูด่วน (Quick Menu) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
              <h3 className="text-sm font-bold text-slate-900 mb-3">เมนูด่วน</h3>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => onNavigateToMenu('village_plan')}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                      <Home className="w-4 h-4" />
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-slate-800">แผนรายหมู่บ้าน</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateToMenu('edition_first')}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                      <FileText className="w-4 h-4" />
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-slate-800">ดูแผนพัฒนาท้องถิ่น</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                </button>

                <button
                  type="button"
                  onClick={() => setShowDownloadModal(true)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50/50 transition-all text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                      <Download className="w-4 h-4" />
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-slate-800">ดาวน์โหลดเอกสาร</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-colors" />
                </button>

                <button
                  type="button"
                  onClick={() => setShowContactModal(true)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-teal-300 hover:bg-teal-50/50 transition-all text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                      <Phone className="w-4 h-4" />
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-slate-800">ติดต่อหน่วยงาน</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors" />
                </button>
              </div>
            </div>

            {/* 2. สัดส่วนงบประมาณตามยุทธศาสตร์ (Donut Chart) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
              <h3 className="text-sm font-bold text-slate-900 mb-3">สัดส่วนงบประมาณตามยุทธศาสตร์</h3>
              
              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* SVG Donut Chart */}
                <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="38" stroke="#f1f5f9" strokeWidth="12" fill="none" />
                    {/* Slices: 32.5%, 18.2%, 16.8%, 12.4%, 10.3%, 9.8% */}
                    {/* Circumference = 2 * PI * 38 ≈ 238.76 */}
                    <circle cx="50" cy="50" r="38" stroke="#2563eb" strokeWidth="12" fill="none" strokeDasharray="77.6 161.2" strokeDashoffset="0" />
                    <circle cx="50" cy="50" r="38" stroke="#06b6d4" strokeWidth="12" fill="none" strokeDasharray="43.5 195.3" strokeDashoffset="-77.6" />
                    <circle cx="50" cy="50" r="38" stroke="#f59e0b" strokeWidth="12" fill="none" strokeDasharray="40.1 198.7" strokeDashoffset="-121.1" />
                    <circle cx="50" cy="50" r="38" stroke="#8b5cf6" strokeWidth="12" fill="none" strokeDasharray="29.6 209.2" strokeDashoffset="-161.2" />
                    <circle cx="50" cy="50" r="38" stroke="#10b981" strokeWidth="12" fill="none" strokeDasharray="24.6 214.2" strokeDashoffset="-190.8" />
                    <circle cx="50" cy="50" r="38" stroke="#f43f5e" strokeWidth="12" fill="none" strokeDasharray="23.4 215.4" strokeDashoffset="-215.4" />
                  </svg>
                  {/* Center Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-2">
                    <span className="text-[10px] text-slate-400 font-medium">งบประมาณรวม</span>
                    <span className="text-xs font-black font-mono text-slate-900 leading-tight">
                      1,200,000,000
                    </span>
                    <span className="text-[10px] text-slate-500">บาท</span>
                  </div>
                </div>

                {/* Legend List */}
                <div className="space-y-1.5 flex-1 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                      <span className="text-slate-700 font-medium">โครงสร้างพื้นฐาน</span>
                    </div>
                    <span className="font-mono font-bold text-slate-800">32.5%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shrink-0" />
                      <span className="text-slate-700 font-medium">เศรษฐกิจ</span>
                    </div>
                    <span className="font-mono font-bold text-slate-800">18.2%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                      <span className="text-slate-700 font-medium">สังคม</span>
                    </div>
                    <span className="font-mono font-bold text-slate-800">16.8%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
                      <span className="text-slate-700 font-medium">การศึกษา</span>
                    </div>
                    <span className="font-mono font-bold text-slate-800">12.4%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                      <span className="text-slate-700 font-medium">ทรัพยากรธรรมชาติ</span>
                    </div>
                    <span className="font-mono font-bold text-slate-800">10.3%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                      <span className="text-slate-700 font-medium">บริหารจัดการ</span>
                    </div>
                    <span className="font-mono font-bold text-slate-800">9.8%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. ข่าวสาร / ประชาสัมพันธ์ */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900">ข่าวสาร / ประชาสัมพันธ์</h3>
                <button
                  type="button"
                  onClick={() => setShowFaqModal(true)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                >
                  <span>ดูทั้งหมด</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                <div
                  onClick={() =>
                    setSelectedNewsItem({
                      title: 'ประกาศใช้แผนพัฒนาท้องถิ่น พ.ศ. 2571-2575',
                      date: '15 ก.ย. 2568',
                      desc: 'เทศบาลเมืองศิลา ได้ประกาศใช้แผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575) เพื่อเป็นกรอบทิศทางในการพัฒนาโครงสร้างพื้นฐาน เศรษฐกิจ และคุณภาพชีวิตของประชาชนในเขตตำบลศิลา'
                    })
                  }
                  className="py-2.5 flex items-start gap-3 hover:bg-slate-50 p-2 rounded-xl cursor-pointer transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Megaphone className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-slate-900 leading-snug truncate">
                      ประกาศใช้แผนพัฒนาท้องถิ่น พ.ศ. 2571-2575
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">15 ก.ย. 2568</div>
                  </div>
                </div>

                <div
                  onClick={() =>
                    setSelectedNewsItem({
                      title: 'เปิดรับฟังความคิดเห็นการจัดทำแผนฯ',
                      date: '10 ก.ย. 2568',
                      desc: 'เปิดรับฟังความคิดเห็นจากผู้นำชุมชน กลุ่มองค์กร และประชาชนทุกหมู่บ้านเพื่อนำปัญหาความต้องการมาบรรจุในแผนพัฒนาท้องถิ่น'
                    })
                  }
                  className="py-2.5 flex items-start gap-3 hover:bg-slate-50 p-2 rounded-xl cursor-pointer transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-slate-900 leading-snug truncate">
                      เปิดรับฟังความคิดเห็นการจัดทำแผนฯ
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">10 ก.ย. 2568</div>
                  </div>
                </div>

                <div
                  onClick={() =>
                    setSelectedNewsItem({
                      title: 'กิจกรรมประชุมประชาคมหมู่บ้าน',
                      date: '5 ก.ย. 2568',
                      desc: 'การประชุมร่วมกับกำนัน ผู้ใหญ่บ้าน คณะกรรมการชุมชน เพื่อจัดลำดับความสำคัญของโครงการพัฒนาในระดับหมู่บ้าน'
                    })
                  }
                  className="py-2.5 flex items-start gap-3 hover:bg-slate-50 p-2 rounded-xl cursor-pointer transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-slate-900 leading-snug truncate">
                      กิจกรรมประชุมประชาคมหมู่บ้าน
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">5 ก.ย. 2568</div>
                  </div>
                </div>

                <div
                  onClick={() =>
                    setSelectedNewsItem({
                      title: 'รายงานผลการดำเนินงานประจำปี',
                      date: '28 ส.ค. 2568',
                      desc: 'เผยแพร่รายงานการติดตามและประเมินผลโครงการประจำปีงบประมาณ เพื่อความโปร่งใสและตรวจสอบได้'
                    })
                  }
                  className="py-2.5 flex items-start gap-3 hover:bg-slate-50 p-2 rounded-xl cursor-pointer transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-slate-900 leading-snug truncate">
                      รายงานผลการดำเนินงานประจำปี
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">28 ส.ค. 2568</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. สแกน QR Code เพื่อเข้าถึงข้อมูลผ่านมือถือ */}
            <div className="bg-linear-to-r from-blue-500/10 via-emerald-500/10 to-sky-500/15 border border-blue-200 rounded-2xl p-4 shadow-2xs flex items-center gap-3.5">
              {/* QR Code Container */}
              <div className="w-20 h-20 bg-white p-1.5 rounded-xl border border-slate-300 shadow-xs flex items-center justify-center shrink-0">
                {/* SVG QR Code Pattern */}
                <svg className="w-full h-full text-slate-900" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2 2h7v7H2V2zm2 2v3h3V4H4zm5 0h1v1H9V4zm1 2h1v1h-1V6zm0 2h1v1h-1V8zm-8 7h7v7H2v-7zm2 2v3h3v-3H4zm11-13h7v7h-7V2zm2 2v3h3V4h-3zm-2 9h1v1h-1v-1zm2 0h1v2h-1v-2zm2 0h1v1h-1v-1zm-3 2h2v1h-2v-1zm4-1h1v3h-1v-3zm-1 3h2v1h-2v-1zm-5 1h2v1h-2v-1zm0 2h1v2h-1v-2zm2 0h2v1h-2v-1zm0 2h1v1h-1v-1zm2-1h1v2h-1v-2zm2 0h1v1h-1v-1zm-9-4h1v1H9v-1zm0 3h1v1H9v-1zm-1 2h1v1H8v-1z"/>
                </svg>
              </div>

              {/* Text & Mobile illustration */}
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-900 leading-snug">
                  สแกน QR Code
                </div>
                <div className="text-[11px] text-slate-600 mt-0.5">
                  เพื่อเข้าถึงข้อมูลผ่านมือถือ
                </div>
                <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-white/80 px-2 py-0.5 rounded-full border border-blue-200 mt-2">
                  <Smartphone className="w-3 h-3 text-blue-600" />
                  <span>รองรับสมาร์ตโฟนทุกรุ่น</span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* Modals: Downloads, Contact, FAQ, News Detail */}
      {/* ========================================================================= */}

      {/* Download Documents Modal */}
      {showDownloadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-base text-slate-900">
                <Download className="w-5 h-5 text-blue-600" />
                <span>ดาวน์โหลดเอกสารแผนพัฒนาท้องถิ่น</span>
              </div>
              <button
                onClick={() => setShowDownloadModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50">
                <div>
                  <div className="font-bold text-slate-900">เล่มแผนพัฒนาท้องถิ่น (พ.ศ. 2571 - 2575) ฉบับสมบูรณ์</div>
                  <div className="text-[11px] text-slate-500">PDF • 14.2 MB • วันที่ 15 ก.ย. 2568</div>
                </div>
                <button
                  onClick={() => alert('เริ่มดาวน์โหลดไฟล์ เล่มแผนพัฒนาท้องถิ่น ฉบับสมบูรณ์')}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold flex items-center gap-1 cursor-pointer hover:bg-blue-700"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ดาวน์โหลด</span>
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50">
                <div>
                  <div className="font-bold text-slate-900">แผนพัฒนาท้องถิ่น ฉบับเพิ่มเติม ครั้งที่ 1/2571</div>
                  <div className="text-[11px] text-slate-500">PDF • 4.8 MB • วันที่ 01 ต.ค. 2568</div>
                </div>
                <button
                  onClick={() => alert('เริ่มดาวน์โหลดไฟล์ แผนพัฒนาท้องถิ่น ฉบับเพิ่มเติม')}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold flex items-center gap-1 cursor-pointer hover:bg-blue-700"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ดาวน์โหลด</span>
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50">
                <div>
                  <div className="font-bold text-slate-900">แบบฟอร์มเสนอโครงการ/ความต้องการของประชาชน (ผ.01)</div>
                  <div className="text-[11px] text-slate-500">DOCX/PDF • 850 KB</div>
                </div>
                <button
                  onClick={() => alert('เริ่มดาวน์โหลดแบบฟอร์มเสนอโครงการ ผ.01')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold flex items-center gap-1 cursor-pointer hover:bg-emerald-700"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ดาวน์โหลด</span>
                </button>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setShowDownloadModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Municipality Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-base text-slate-900">
                <Phone className="w-5 h-5 text-teal-600" />
                <span>ติดต่อเทศบาลเมืองศิลา</span>
              </div>
              <button
                onClick={() => setShowContactModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="p-3 rounded-xl bg-teal-50/70 border border-teal-200">
                <div className="font-bold text-teal-900 text-sm">สำนักงานเทศบาลเมืองศิลา</div>
                <div className="mt-1">เลขที่ 999 หมู่ที่ 1 ตำบลศิลา อำเภอเมืองขอนแก่น จังหวัดขอนแก่น 40000</div>
                <div className="mt-1 font-mono font-semibold text-teal-800">โทรศัพท์: 043-246501, 043-246502 | โทรสาร: 043-246503</div>
                <div className="mt-1 text-teal-700">เว็บไซต์: www.sila.go.th • อีเมล: saraban@sila.go.th</div>
              </div>

              <div className="font-bold text-slate-900 pt-1">เบอร์โทรศัพท์ติดต่อแยกตามกอง/สำนัก:</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-900 block">สำนักปลัดเทศบาล:</span>
                  <span className="text-slate-600">043-246501 ต่อ 101-105</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-900 block">กองยุทธศาสตร์และงบประมาณ:</span>
                  <span className="text-slate-600">043-246501 ต่อ 110-112</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-900 block">กองช่าง:</span>
                  <span className="text-slate-600">043-246501 ต่อ 201-205</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-900 block">กองสาธารณสุขและสิ่งแวดล้อม:</span>
                  <span className="text-slate-600">043-246501 ต่อ 301-304</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-900 block">กองการศึกษา:</span>
                  <span className="text-slate-600">043-246501 ต่อ 401-403</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-900 block">กองสวัสดิการสังคม:</span>
                  <span className="text-slate-600">043-246501 ต่อ 501-503</span>
                </div>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setShowContactModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAQ Modal */}
      {showFaqModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-base text-slate-900">
                <HelpCircle className="w-5 h-5 text-blue-600" />
                <span>คำถามที่พบบ่อย (FAQ)</span>
              </div>
              <button
                onClick={() => setShowFaqModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs divide-y divide-slate-100">
              <div className="pt-2">
                <div className="font-bold text-slate-900">1. ประชาชนมีส่วนร่วมในการจัดทำแผนพัฒนาท้องถิ่นอย่างไร?</div>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  ประชาชนสามารถเข้าร่วมประชุมเวทีประชาคมระดับหมู่บ้าน (28 หมู่บ้าน) เสนอปัญหาและความต้องการผ่านแบบฟอร์ม ผ.01 หรือยื่นเสนอผ่านกรรมการหมู่บ้านเพื่อนำเข้าบรรจุในแผนพัฒนาท้องถิ่นได้
                </p>
              </div>
              <div className="pt-2">
                <div className="font-bold text-slate-900">2. โครงการในแผนพัฒนาท้องถิ่น จะได้รับการตั้งงบประมาณเมื่อใด?</div>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  เทศบาลจะนำโครงการที่บรรจุในแผนพัฒนาท้องถิ่นไปจัดทำเป็นเทศบัญญัติงบประมาณรายจ่ายประจำปี โดยเรียงลำดับความสำคัญตามความเร่งด่วนและวงเงินงบประมาณที่ได้รับการจัดสรร
                </p>
              </div>
              <div className="pt-2">
                <div className="font-bold text-slate-900">3. หากต้องการตรวจสอบความคืบหน้าโครงการในหมู่บ้านตนเอง ต้องทำอย่างไร?</div>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  สามารถเลือกเมนูด้านบน "หมู่บ้าน" แล้วเลือกชื่อหมู่บ้านของท่าน หรือใช้เมนู "ดูแผนรายหมู่บ้าน" เพื่อดูรายละเอียดสถานะโครงการและงบประมาณได้ทันที
                </p>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setShowFaqModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* News Detail Modal */}
      {selectedNewsItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-base text-slate-900">
                <Megaphone className="w-5 h-5 text-blue-600" />
                <span>ข่าวสารประชาสัมพันธ์</span>
              </div>
              <button
                onClick={() => setSelectedNewsItem(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-base text-slate-900">{selectedNewsItem.title}</h3>
              <div className="text-xs text-blue-600 font-semibold">{selectedNewsItem.date}</div>
              <p className="text-xs text-slate-600 leading-relaxed pt-2">
                {selectedNewsItem.desc}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 text-right">
              <button
                onClick={() => setSelectedNewsItem(null)}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 cursor-pointer"
              >
                เข้าใจแล้ว
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
