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
  FileText,
  Search,
  Printer,
  CheckCircle2,
  AlertCircle,
  Building2,
  Sparkles
} from 'lucide-react';
import { UserAccount, UserRole } from '../types';
import { authService } from '../services/authService';

interface LoginScreenProps {
  onLoginSuccess: (user: UserAccount) => void;
  onOpenRegister: () => void;
  onOpenPublicModal: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onOpenRegister,
  onOpenPublicModal
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleStaffLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const res = authService.loginWithCredentials(username, password);
    if (!res.success || !res.user) {
      setError(res.error || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      return;
    }

    onLoginSuccess(res.user);
  };

  const handleFastDemoLogin = (role: UserRole) => {
    const user = authService.switchRoleQuick(role);
    onLoginSuccess(user);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#021d15] via-[#05372a] to-[#0a4d3b] flex flex-col justify-between font-['Sarabun',sans-serif] text-slate-800 antialiased p-4 md:p-8">
      {/* Top Municipal Brand Header */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between py-3 border-b border-emerald-800/50 text-emerald-200">
        <div className="flex items-center gap-3.5">
          <div className="w-13 h-13 rounded-2xl bg-emerald-600/40 border border-emerald-400/50 flex items-center justify-center text-emerald-300 font-black text-2xl shadow-lg">
            ศ
          </div>
          <div>
            <div className="text-white font-bold text-lg sm:text-xl leading-tight tracking-wide">
              เทศบาลเมืองศิลา
            </div>
            <div className="text-emerald-300 text-sm font-medium">
              อำเภอเมืองขอนแก่น จังหวัดขอนแก่น
            </div>
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <div className="text-sm text-emerald-300 font-bold">
            แผนพัฒนาท้องถิ่น พ.ศ. 2571 - 2575
          </div>
          <div className="text-xs text-emerald-400/90 font-medium">
            ระบบดิจิทัล ผ.01, ผ.02, ผ.03 และการอนุมัติงบประมาณ
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-5xl mx-auto my-auto py-8">
        {/* Title Headline */}
        <div className="text-center max-w-3xl mx-auto mb-9">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold bg-emerald-900/70 text-emerald-200 border border-emerald-600/60 mb-3.5 shadow-inner">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>ระบบสารสนเทศแผนพัฒนาท้องถิ่นดิจิทัล</span>
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            เข้าสู่ระบบและจัดการสิทธิ์ผู้ใช้งาน
          </h1>
          <p className="text-emerald-200 text-base sm:text-lg mt-2.5 font-medium">
            โปรดเลือกทางเข้าใช้งานตามสิทธิ์ของท่าน: สำหรับประชาชนทั่วไป หรือ สำหรับเจ้าหน้าที่/ผู้บริหาร
          </p>
        </div>

        {/* 2 Main Portals Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-stretch">
          {/* LEFT: Public Portal (Prominent Citizen Access) */}
          <div className="lg:col-span-6 bg-gradient-to-b from-white to-emerald-50/70 rounded-3xl p-7 sm:p-9 shadow-2xl border-2 border-emerald-400/50 flex flex-col justify-between relative overflow-hidden group">
            {/* Background watermark badge */}
            <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3.5 py-1.5 rounded-full text-sm font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-700" />
                  <span>ประชาชนทั่วไป (Public Access)</span>
                </span>
                <span className="text-xs sm:text-sm text-emerald-800 font-bold">
                  ไม่ต้องตั้งรหัสผ่าน
                </span>
              </div>

              <h2 className="text-2xl font-black text-slate-950 leading-snug">
                สำหรับ ประชาชนทั่วไป
              </h2>
              <p className="text-base text-slate-700 mt-2.5 leading-relaxed font-normal">
                ร่วมติดตามโครงการพัฒนาชุมชน งบประมาณประจำปี และการดำเนินงานของเทศบาลเมืองศิลา
                สามารถสืบค้น ค้นหา กรองข้อมูล ดูรายงาน ผ.01/ผ.02 สั่งพิมพ์ และส่งออกเอกสารได้ทันที
              </p>

              {/* Feature Highlights */}
              <div className="space-y-3 my-7">
                <div className="flex items-start gap-3 text-base text-slate-800 bg-white/90 p-3 rounded-xl border border-emerald-200/80 shadow-xs">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>สิทธิ์เข้าชมอย่างเดียว (Read-Only) ปลอดภัย ไม่แก้ไขข้อมูล</span>
                </div>
                <div className="flex items-start gap-3 text-base text-slate-800 bg-white/90 p-3 rounded-xl border border-emerald-200/80 shadow-xs">
                  <Search className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>ค้นหาโครงการแยกตามรายหมู่บ้านทั้ง 28 หมู่บ้านใน 3 เขต</span>
                </div>
                <div className="flex items-start gap-3 text-base text-slate-800 bg-white/90 p-3 rounded-xl border border-emerald-200/80 shadow-xs">
                  <FileText className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>ดูเล่มแผน ผ.01, ผ.02 ทุกฉบับ และดาวน์โหลดรายงานสรุปได้</span>
                </div>
              </div>
            </div>

            {/* Prominent Access Button as requested */}
            <div className="pt-2">
              <button
                type="button"
                id="btn-public-portal-prominent"
                onClick={onOpenPublicModal}
                className="w-full py-4 px-6 text-base sm:text-lg font-bold text-white bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 hover:from-emerald-500 hover:to-teal-600 active:scale-[0.99] rounded-2xl shadow-xl shadow-emerald-900/30 flex items-center justify-center gap-3 transition-all cursor-pointer group-hover:shadow-emerald-600/30 min-h-[56px]"
              >
                <Eye className="w-6 h-6 text-emerald-200" />
                <span>เข้าชมรายงานสำหรับ ประชาชนทั่วไป</span>
                <ArrowRight className="w-6 h-6 text-emerald-200 group-hover:translate-x-1.5 transition-transform" />
              </button>
              <div className="text-center text-xs sm:text-sm text-slate-500 font-medium mt-2.5">
                * คลิกเพื่อลงชื่อเข้าชมอย่างง่าย (ระบุเพียงชื่อและหมู่บ้าน)
              </div>
            </div>
          </div>

          {/* RIGHT: Staff / Executive / Admin Portal */}
          <div className="lg:col-span-6 bg-white rounded-3xl p-7 sm:p-9 shadow-2xl border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3.5 py-1.5 rounded-full text-sm font-bold bg-slate-100 text-slate-800 border border-slate-300 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-slate-700" />
                  <span>เจ้าหน้าที่ / ผู้บริหาร / Admin</span>
                </span>
                <button
                  type="button"
                  onClick={onOpenRegister}
                  className="text-sm text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>ลงทะเบียนบัญชีใหม่</span>
                </button>
              </div>

              <h2 className="text-2xl font-black text-slate-950 leading-snug">
                สำหรับ เจ้าหน้าที่และผู้บริหาร
              </h2>
              <p className="text-base text-slate-600 mt-1.5">
                กรอกชื่อผู้ใช้งานและรหัสผ่านเพื่อเข้าใช้งานระบบตามสิทธิ์ที่ได้รับมอบหมาย
              </p>

              {/* Login Form */}
              <form onSubmit={handleStaffLogin} className="space-y-4 mt-6">
                {error && (
                  <div className="p-3.5 text-sm text-rose-800 bg-rose-50 border border-rose-300 rounded-xl flex items-center gap-2.5 font-medium">
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label className="block text-base font-bold text-slate-800 mb-1.5">
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
                  <label className="block text-base font-bold text-slate-800 mb-1.5">
                    รหัสผ่าน (Password)
                  </label>
                  <div className="relative">
                    <Lock className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="password"
                      placeholder="รหัสผ่าน (ค่าเริ่มต้น: password)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 text-base bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder:text-slate-400 font-medium"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  id="btn-staff-login-submit"
                  className="w-full py-3.5 px-5 text-base font-bold text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.99] rounded-xl shadow-md flex items-center justify-center gap-2.5 transition-all cursor-pointer mt-2 min-h-[50px]"
                >
                  <span>เข้าสู่ระบบตามสิทธิ์</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </form>
            </div>

            {/* Quick Demo Test Buttons */}
            <div className="pt-6 mt-6 border-t border-slate-100">
              <div className="text-sm font-bold text-slate-700 mb-2.5 flex items-center justify-between">
                <span>ทดสอบเข้าสู่ระบบแบบด่วน (Fast Demo):</span>
                <span className="text-xs sm:text-sm text-emerald-700 font-bold">ไม่ต้องพิมพ์รหัส</span>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleFastDemoLogin('admin')}
                  className="p-3 rounded-xl border border-amber-300 bg-amber-50/80 hover:bg-amber-100 transition-colors text-left cursor-pointer"
                >
                  <div className="text-sm font-bold text-amber-950 truncate">Admin</div>
                  <div className="text-xs sm:text-sm text-amber-800 truncate font-medium">นางสุพิชฌาย์</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleFastDemoLogin('staff')}
                  className="p-3 rounded-xl border border-blue-300 bg-blue-50/80 hover:bg-blue-100 transition-colors text-left cursor-pointer"
                >
                  <div className="text-sm font-bold text-blue-950 truncate">Staff (ช่าง)</div>
                  <div className="text-xs sm:text-sm text-blue-800 truncate font-medium">นายสมเกียรติ</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleFastDemoLogin('executive')}
                  className="p-3 rounded-xl border border-purple-300 bg-purple-50/80 hover:bg-purple-100 transition-colors text-left cursor-pointer"
                >
                  <div className="text-sm font-bold text-purple-950 truncate">Executive</div>
                  <div className="text-xs sm:text-sm text-purple-800 truncate font-medium">นายกเทศมนตรี</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer copyright */}
      <div className="w-full max-w-5xl mx-auto text-center text-sm text-emerald-300/80 py-4 border-t border-emerald-900/40 font-medium">
        ระบบสารสนเทศเทศบาลเมืองศิลา อำเภอเมืองขอนแก่น จังหวัดขอนแก่น © 2571-2575 •
        พัฒนาตามระเบียบกระทรวงมหาดไทยว่าด้วยการจัดทำแผนพัฒนาขององค์กรปกครองส่วนท้องถิ่น
      </div>
    </div>
  );
};
