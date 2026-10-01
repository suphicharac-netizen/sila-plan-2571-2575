import React, { useState } from 'react';
import {
  Users,
  Shield,
  Briefcase,
  Lock,
  User,
  ArrowRight,
  UserPlus,
  Eye,
  EyeOff,
  FileText,
  Search,
  Printer,
  CheckCircle2,
  AlertCircle,
  Building2,
  Sparkles,
  KeyRound,
  LogOut,
  HelpCircle,
  Phone,
  Compass,
  ArrowLeft,
  ChevronRight
} from 'lucide-react';
import { UserAccount, UserRole } from '../types';
import { authService } from '../services/authService';

interface LoginScreenProps {
  currentUser?: UserAccount | null;
  onLoginSuccess: (user: UserAccount) => void;
  onOpenRegister: () => void;
  onOpenPublicModal: () => void;
  onBackToApp?: () => void;
  onLogout?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  currentUser,
  onLoginSuccess,
  onOpenRegister,
  onOpenPublicModal,
  onBackToApp,
  onLogout
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'citizen' | 'staff'>('all');

  const handleStaffLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUser = username.trim();
    if (!cleanUser) {
      setError('กรุณาระบุชื่อผู้ใช้งาน');
      return;
    }

    const res = authService.loginWithCredentials(cleanUser, password);
    if (!res.success || !res.user) {
      setError(res.error || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง (ค่าเริ่มต้น: password)');
      return;
    }

    onLoginSuccess(res.user);
  };

  const handleFastDemoLogin = (role: UserRole) => {
    setError(null);
    const user = authService.switchRoleQuick(role);
    onLoginSuccess(user);
  };

  const handleQuickGuestCitizen = () => {
    setError(null);
    const user = authService.switchRoleQuick('public');
    onLoginSuccess(user);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#021d15] via-[#05372a] to-[#0a4d3b] flex flex-col justify-between font-['Prompt',sans-serif] text-slate-800 antialiased p-4 sm:p-6 md:p-8 selection:bg-emerald-500 selection:text-white">
      {/* Top Municipal Brand Header */}
      <header className="w-full max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 py-3 border-b border-emerald-800/60 text-emerald-200">
        <div className="flex items-center gap-3.5">
          <div className="w-13 h-13 rounded-full bg-white/15 p-1 border border-emerald-400/50 flex items-center justify-center shadow-lg overflow-hidden shrink-0 ring-2 ring-amber-400/40">
            <img
              src="/sila-logo.png"
              alt="ตราเทศบาลเมืองศิลา จังหวัดขอนแก่น"
              className="w-full h-full object-contain rounded-full aspect-square"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <div className="text-white font-bold text-lg sm:text-xl leading-tight tracking-wide flex items-center gap-2">
              <span>เทศบาลเมืองศิลา</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 font-semibold">
                จ.ขอนแก่น
              </span>
            </div>
            <div className="text-emerald-300 text-sm font-medium">
              อำเภอเมืองขอนแก่น จังหวัดขอนแก่น • ระบบสารสนเทศดิจิทัล
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <div className="text-sm text-emerald-200 font-bold">
              แผนพัฒนาท้องถิ่น พ.ศ. 2571 - 2575
            </div>
            <div className="text-xs text-emerald-300/80 font-medium">
              แบบ ผ.01, ผ.02, ผ.03 และการอนุมัติงบประมาณ
            </div>
          </div>

          {currentUser && onBackToApp && (
            <button
              type="button"
              onClick={onBackToApp}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer border border-emerald-500/50 shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>กลับสู่ระบบงาน</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-6xl mx-auto my-auto py-6 sm:py-8">
        {/* Banner if already logged in */}
        {currentUser && (
          <div className="max-w-4xl mx-auto mb-6 p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 shadow-xl backdrop-blur-xs flex flex-col sm:flex-row items-center justify-between gap-4 text-emerald-100">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center font-bold text-base text-amber-300 shrink-0">
                {currentUser.fullName.charAt(0)}
              </div>
              <div>
                <div className="text-sm text-emerald-300 font-medium">
                  สถานะการเข้าใช้งานปัจจุบัน:
                </div>
                <div className="text-base font-bold text-white flex items-center gap-2">
                  <span>{currentUser.fullName}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-800 text-emerald-200 border border-emerald-600">
                    {currentUser.role === 'admin' && 'ผู้ดูแลระบบ (Admin)'}
                    {currentUser.role === 'executive' && 'ผู้บริหาร (Executive)'}
                    {currentUser.role === 'staff' && 'เจ้าหน้าที่ (Staff)'}
                    {currentUser.role === 'public' && `ประชาชน (${currentUser.village || 'ทั่วไป'})`}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {onBackToApp && (
                <button
                  type="button"
                  onClick={onBackToApp}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold text-sm transition-all cursor-pointer shadow-md"
                >
                  เข้าสู่หน้าใช้งาน
                </button>
              )}
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-600 text-rose-200 hover:text-white font-semibold text-sm transition-all cursor-pointer border border-rose-500/40 flex items-center gap-1.5"
                >
                  <LogOut className="w-4 h-4" />
                  <span>ออกจากระบบ</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Title Headline */}
        <div className="text-center max-w-3xl mx-auto mb-7">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold bg-emerald-900/80 text-emerald-200 border border-emerald-600/60 mb-3 shadow-inner">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>เข้าสู่ระบบสารสนเทศดิจิทัล เทศบาลเมืองศิลา</span>
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-[40px] font-black text-white tracking-tight leading-tight">
            หน้า Login — เข้าระบบและจัดการสิทธิ์
          </h1>
          <p className="text-emerald-200/90 text-sm sm:text-base mt-2.5 font-medium max-w-2xl mx-auto">
            เลือกช่องทางการเข้าใช้งาน: สำหรับประชาชนทั่วไปเพื่อร่วมติดตามโครงการ หรือ สำหรับเจ้าหน้าที่/ผู้บริหารเพื่อบริหารจัดการแผนพัฒนา
          </p>
        </div>

        {/* 2 Main Portals Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch">
          {/* LEFT: Public Portal (Prominent Citizen Access) */}
          <section
            aria-label="ช่องทางสำหรับประชาชนทั่วไป"
            className="lg:col-span-6 bg-gradient-to-b from-white via-white to-emerald-50/80 rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-emerald-400/60 flex flex-col justify-between relative overflow-hidden group hover:border-emerald-300 transition-all duration-300"
          >
            {/* Background watermark badge */}
            <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-2 shadow-2xs">
                  <Users className="w-4 h-4 text-emerald-700" />
                  <span>ประชาชนทั่วไป (Public Access)</span>
                </span>
                <span className="text-xs sm:text-sm text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  ไม่ต้องตั้งรหัสผ่าน
                </span>
              </div>

              <h2 className="text-2xl sm:text-[26px] font-black text-slate-950 leading-snug">
                สำหรับ ประชาชนทั่วไป
              </h2>
              <p className="text-sm sm:text-base text-slate-700 mt-2 leading-relaxed font-normal">
                ร่วมติดตามโครงการพัฒนาชุมชน งบประมาณประจำปี และการดำเนินงานของเทศบาลเมืองศิลา สามารถสืบค้น ค้นหา กรองข้อมูล ดูรายงาน ผ.01/ผ.02 สั่งพิมพ์ และส่งออกเอกสารได้ทันที
              </p>

              {/* Statistics Pill */}
              <div className="grid grid-cols-3 gap-2 my-5 p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-center">
                <div>
                  <div className="text-base sm:text-lg font-black text-emerald-900">28</div>
                  <div className="text-[11px] text-emerald-700 font-medium">หมู่บ้านในศิลา</div>
                </div>
                <div className="border-x border-emerald-200">
                  <div className="text-base sm:text-lg font-black text-emerald-900">3 เขต</div>
                  <div className="text-[11px] text-emerald-700 font-medium">พื้นที่พัฒนา</div>
                </div>
                <div>
                  <div className="text-base sm:text-lg font-black text-emerald-900">2571-2575</div>
                  <div className="text-[11px] text-emerald-700 font-medium">แผนพัฒนา 5 ปี</div>
                </div>
              </div>

              {/* Feature Highlights */}
              <div className="space-y-2.5 my-5">
                <div className="flex items-start gap-2.5 text-sm sm:text-base text-slate-800 bg-white p-3 rounded-xl border border-emerald-200/70 shadow-2xs">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>สิทธิ์เข้าชมอย่างเดียว (Read-Only) ปลอดภัย ไม่แก้ไขข้อมูล</span>
                </div>
                <div className="flex items-start gap-2.5 text-sm sm:text-base text-slate-800 bg-white p-3 rounded-xl border border-emerald-200/70 shadow-2xs">
                  <Search className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>ค้นหาโครงการแยกตามรายหมู่บ้านทั้ง 28 หมู่บ้านใน 3 เขต</span>
                </div>
                <div className="flex items-start gap-2.5 text-sm sm:text-base text-slate-800 bg-white p-3 rounded-xl border border-emerald-200/70 shadow-2xs">
                  <FileText className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>ดูเล่มแผน ผ.01, ผ.02 ทุกฉบับ และดาวน์โหลดรายงานสรุปได้</span>
                </div>
              </div>
            </div>

            {/* Access Buttons */}
            <div className="pt-3 space-y-2.5">
              <button
                type="button"
                id="btn-public-portal-prominent"
                onClick={onOpenPublicModal}
                className="w-full py-3.5 sm:py-4 px-6 text-base sm:text-lg font-bold text-white bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 hover:from-emerald-500 hover:to-teal-600 active:scale-[0.99] rounded-2xl shadow-xl shadow-emerald-900/30 flex items-center justify-center gap-3 transition-all cursor-pointer group-hover:shadow-emerald-600/30 min-h-[52px]"
              >
                <Eye className="w-6 h-6 text-emerald-200" />
                <span>เข้าชมรายงานสำหรับ ประชาชนทั่วไป</span>
                <ArrowRight className="w-6 h-6 text-emerald-200 group-hover:translate-x-1.5 transition-transform" />
              </button>

              <button
                type="button"
                id="btn-public-quick-guest"
                onClick={handleQuickGuestCitizen}
                className="w-full py-2.5 px-4 text-xs sm:text-sm font-semibold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 active:scale-[0.99] rounded-xl border border-emerald-300 flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Compass className="w-4 h-4 text-emerald-700" />
                <span>เข้าชมทันทีแบบด่วน (One-Click Guest Entrance)</span>
              </button>

              <div className="text-center text-xs text-slate-500 font-medium pt-1">
                * คลิกเพื่อระบุหมู่บ้านของท่าน หรือเข้าชมแบบด่วนได้ทันทีโดยไม่ต้องลงทะเบียน
              </div>
            </div>
          </section>

          {/* RIGHT: Staff / Executive / Admin Portal */}
          <section
            aria-label="ช่องทางสำหรับเจ้าหน้าที่และผู้บริหาร"
            className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold bg-slate-100 text-slate-800 border border-slate-300 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-slate-700" />
                  <span>เจ้าหน้าที่ / ผู้บริหาร / Admin</span>
                </span>
                <button
                  type="button"
                  onClick={onOpenRegister}
                  className="text-xs sm:text-sm text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1.5 cursor-pointer hover:underline"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>ลงทะเบียนบัญชีใหม่</span>
                </button>
              </div>

              <h2 className="text-2xl sm:text-[26px] font-black text-slate-950 leading-snug">
                สำหรับ เจ้าหน้าที่และผู้บริหาร
              </h2>
              <p className="text-sm sm:text-base text-slate-600 mt-1.5">
                กรอกชื่อผู้ใช้งานและรหัสผ่านเพื่อเข้าใช้งานระบบตามสิทธิ์ที่ได้รับมอบหมาย
              </p>

              {/* Login Form */}
              <form onSubmit={handleStaffLogin} className="space-y-4 mt-5">
                {error && (
                  <div className="p-3.5 text-sm text-rose-800 bg-rose-50 border border-rose-300 rounded-xl flex items-center gap-2.5 font-medium animate-shake">
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label className="block text-sm sm:text-base font-bold text-slate-800 mb-1.5">
                    ชื่อผู้ใช้งาน (Username)
                  </label>
                  <div className="relative">
                    <User className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="เช่น admin, staff หรือ executive"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 text-base bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder:text-slate-400 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm sm:text-base font-bold text-slate-800">
                      รหัสผ่าน (Password)
                    </label>
                    <span className="text-xs text-slate-500 font-medium">
                      ค่าเริ่มต้น: password
                    </span>
                  </div>
                  <div className="relative">
                    <Lock className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="กรอกรหัสผ่าน"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-11 pr-12 py-3 text-base bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder:text-slate-400 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                      title={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <label className="flex items-center gap-2 text-slate-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                    />
                    <span>จดจำชื่อผู้ใช้งานบนอุปกรณ์นี้</span>
                  </label>
                </div>

                <button
                  type="submit"
                  id="btn-staff-login-submit"
                  className="w-full py-3.5 px-5 text-base font-bold text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.99] rounded-xl shadow-md flex items-center justify-center gap-2.5 transition-all cursor-pointer mt-2 min-h-[50px]"
                >
                  <KeyRound className="w-5 h-5 text-amber-300" />
                  <span>เข้าสู่ระบบตามสิทธิ์</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </form>
            </div>

            {/* Quick Demo Test Buttons */}
            <div className="pt-5 mt-5 border-t border-slate-100">
              <div className="text-xs sm:text-sm font-bold text-slate-700 mb-2.5 flex items-center justify-between">
                <span>ทดสอบเข้าสู่ระบบแบบด่วน (Fast Demo):</span>
                <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  คลิกเดียวเข้าได้ทันที
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  id="btn-demo-admin"
                  onClick={() => handleFastDemoLogin('admin')}
                  className="p-2.5 sm:p-3 rounded-xl border border-amber-300 bg-amber-50/90 hover:bg-amber-100 transition-colors text-left cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-bold text-amber-950">Admin</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 font-bold">👑 สิทธิ์เต็ม</span>
                  </div>
                  <div className="text-xs sm:text-sm text-amber-900 truncate font-semibold mt-1">
                    นางสุพิชฌาย์
                  </div>
                  <div className="text-[10px] text-amber-700/80 truncate">กองยุทธศาสตร์</div>
                </button>

                <button
                  type="button"
                  id="btn-demo-staff"
                  onClick={() => handleFastDemoLogin('staff')}
                  className="p-2.5 sm:p-3 rounded-xl border border-blue-300 bg-blue-50/90 hover:bg-blue-100 transition-colors text-left cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-bold text-blue-950">Staff</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-200 text-blue-900 font-bold">👷 เจ้าหน้าที่</span>
                  </div>
                  <div className="text-xs sm:text-sm text-blue-900 truncate font-semibold mt-1">
                    นายสมเกียรติ
                  </div>
                  <div className="text-[10px] text-blue-700/80 truncate">กองช่าง</div>
                </button>

                <button
                  type="button"
                  id="btn-demo-executive"
                  onClick={() => handleFastDemoLogin('executive')}
                  className="p-2.5 sm:p-3 rounded-xl border border-purple-300 bg-purple-50/90 hover:bg-purple-100 transition-colors text-left cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-bold text-purple-950">Executive</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-200 text-purple-900 font-bold">🏛️ ผู้บริหาร</span>
                  </div>
                  <div className="text-xs sm:text-sm text-purple-900 truncate font-semibold mt-1">
                    นายกเทศมนตรี
                  </div>
                  <div className="text-[10px] text-purple-700/80 truncate">สำนักปลัด</div>
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* Security and Information Notice */}
        <div className="mt-8 max-w-4xl mx-auto p-4 rounded-2xl bg-emerald-950/40 border border-emerald-700/40 text-emerald-200 text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-amber-300 shrink-0" />
            <span>
              <strong>มาตรฐานความปลอดภัย:</strong> ระบบจัดเก็บประวัติการเข้าใช้งานตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA) พ.ศ. 2562
            </span>
          </div>
          <div className="flex items-center gap-2 text-emerald-300 text-xs shrink-0">
            <Phone className="w-3.5 h-3.5 text-emerald-400" />
            <span>ติดต่อสอบถาม: กองยุทธศาสตร์และงบประมาณ โทร. 043-246505</span>
          </div>
        </div>
      </main>

      {/* Footer copyright */}
      <footer className="w-full max-w-6xl mx-auto text-center text-xs sm:text-sm text-emerald-300/80 py-4 border-t border-emerald-900/50 font-medium">
        ระบบสารสนเทศเทศบาลเมืองศิลา อำเภอเมืองขอนแก่น จังหวัดขอนแก่น © 2571-2575 •
        พัฒนาตามระเบียบกระทรวงมหาดไทยว่าด้วยการจัดทำแผนพัฒนาขององค์กรปกครองส่วนท้องถิ่น
      </footer>
    </div>
  );
};
