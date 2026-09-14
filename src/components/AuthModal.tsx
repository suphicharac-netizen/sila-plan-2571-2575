import React, { useState } from 'react';
import {
  X,
  UserCheck,
  UserPlus,
  LogIn,
  Users,
  Shield,
  Briefcase,
  Building2,
  Lock,
  User,
  ArrowRight,
  LogOut,
  MapPin,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { UserAccount, UserRole } from '../types';
import { DEPARTMENTS, ALL_VILLAGES, SILA_ZONES } from '../utils/constants';
import { authService, INITIAL_USERS } from '../services/authService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  onUserChanged: (user: UserAccount | null) => void;
  onOpenAnalytics?: () => void;
  initialTab?: 'login' | 'register' | 'public';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChanged,
  onOpenAnalytics,
  initialTab = 'login'
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'public'>(initialTab);

  // Login Form State
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Register Form State (Staff / Exec / Admin)
  const [regFullName, setRegFullName] = useState('');
  const [regRole, setRegRole] = useState<'admin' | 'staff' | 'executive'>('staff');
  const [regDepartment, setRegDepartment] = useState<string>(DEPARTMENTS[2]); // กองช่าง
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  // Public Form State
  const [pubFullName, setPubFullName] = useState('');
  const [pubVillage, setPubVillage] = useState('หมู่ที่ 2 บ้านหนองกุง');
  const [pubPurpose, setPubPurpose] = useState('ติดตามโครงการในหมู่บ้าน / ชุมชน');
  const [pubError, setPubError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle Login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const res = authService.loginWithCredentials(loginUsername, loginPassword);
    if (!res.success || !res.user) {
      setLoginError(res.error || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      return;
    }

    onUserChanged(res.user);
    onClose();
  };

  // Handle Register Staff/Exec/Admin
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccess(null);

    if (!regFullName.trim()) {
      setRegError('กรุณากรอก ชื่อ-นามสกุล');
      return;
    }
    if (!regUsername.trim()) {
      setRegError('กรุณากรอก ชื่อผู้ใช้งาน (Username)');
      return;
    }
    if (!regPassword.trim()) {
      setRegError('กรุณากำหนดรหัสผ่าน');
      return;
    }

    const res = authService.registerStaffUser({
      fullName: regFullName,
      role: regRole,
      department: regDepartment,
      username: regUsername,
      password: regPassword
    });

    if (!res.success || !res.user) {
      setRegError(res.error || 'เกิดข้อผิดพลาดในการลงทะเบียน');
      return;
    }

    setRegSuccess('ลงทะเบียนและเข้าสู่ระบบสำเร็จ!');
    setTimeout(() => {
      onUserChanged(res.user!);
      onClose();
    }, 500);
  };

  // Handle Public Access
  const handlePublicSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPubError(null);

    if (!pubFullName.trim()) {
      setPubError('กรุณาระบุ ชื่อ-นามสกุล');
      return;
    }

    const { user } = authService.registerPublicVisitor(pubFullName, pubVillage, pubPurpose);
    onUserChanged(user);
    onClose();
  };

  // Quick Switch Role (for easy demo testing)
  const handleQuickSwitch = (role: UserRole) => {
    const user = authService.switchRoleQuick(role);
    onUserChanged(user);
    onClose();
  };

  // Logout
  const handleLogout = () => {
    authService.setCurrentUser(null);
    onUserChanged(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-emerald-100 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#02241b] via-[#053d2f] to-[#085440] px-6 py-4.5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-wide">
                  จัดการสิทธิ์และสลับผู้ใช้งาน
                </h3>
                <p className="text-xs text-emerald-200/90 mt-0.5">
                  ระบบแผนพัฒนาท้องถิ่น เทศบาลเมืองศิลา (พ.ศ. 2571-2575)
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Current User Status Banner */}
          {currentUser && (
            <div className="mt-3.5 p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-700/50 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-emerald-200">ผู้ใช้ปัจจุบัน:</span>
                <span className="text-white font-semibold">{currentUser.fullName}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-800 text-emerald-100 border border-emerald-600/50">
                  {currentUser.role === 'admin' && 'ผู้ดูแลระบบ (Admin)'}
                  {currentUser.role === 'staff' && 'เจ้าหน้าที่ (Staff)'}
                  {currentUser.role === 'executive' && 'ผู้บริหาร (Executive)'}
                  {currentUser.role === 'public' && 'ประชาชนทั่วไป (Public)'}
                </span>
                {currentUser.department && (
                  <span className="text-emerald-300 text-[11px]">({currentUser.department})</span>
                )}
                {currentUser.village && (
                  <span className="text-emerald-300 text-[11px]">({currentUser.village})</span>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="text-[11px] text-rose-300 hover:text-white hover:bg-rose-900/60 px-2 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
              >
                <LogOut className="w-3 h-3" />
                <span>ออกจากระบบ</span>
              </button>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-6 pt-2 gap-2 text-xs font-medium">
          <button
            onClick={() => setActiveTab('login')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'login'
                ? 'border-emerald-600 text-emerald-700 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>เข้าสู่ระบบ (เจ้าหน้าที่/ผู้บริหาร/Admin)</span>
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'register'
                ? 'border-emerald-600 text-emerald-700 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>ลงทะเบียนบัญชีใหม่</span>
          </button>
          <button
            onClick={() => setActiveTab('public')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'public'
                ? 'border-emerald-600 text-emerald-700 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>เข้าชมสำหรับ ประชาชนทั่วไป</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: LOGIN */}
          {activeTab === 'login' && (
            <div className="space-y-5">
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {loginError && (
                  <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ชื่อผู้ใช้งาน (Username)
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="เช่น admin, staff หรือ executive"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    รหัสผ่าน (Password)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="password"
                      placeholder="กรอกรหัสผ่าน (ค่าเริ่มต้นคือ password)"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-slate-400">
                    * บัญชีตัวอย่างสามารถทดสอบได้จากปุ่มลัดด้านล่าง
                  </span>
                  <button
                    type="submit"
                    className="px-5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <span>เข้าสู่ระบบ</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>

              {/* Fast Demo Role Switcher */}
              <div className="pt-4 border-t border-slate-100">
                <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center justify-between">
                  <span>ทดสอบสลับบัญชีแบบด่วน (Demo Quick Switch):</span>
                  <span className="text-[10px] text-emerald-600 font-normal">คลิกเพื่อสลับทันที</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleQuickSwitch('admin')}
                    className="p-3 rounded-xl border border-amber-200 bg-amber-50/70 hover:bg-amber-100/80 transition-colors text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-amber-700" />
                      <span className="text-xs font-bold text-amber-900">ผู้ดูแลระบบ (Admin)</span>
                    </div>
                    <div className="text-[11px] text-amber-800/80 mt-1 truncate">
                      นางสุพิชฌาย์ ราชเซ่ง
                    </div>
                    <div className="text-[10px] text-amber-600 mt-0.5 truncate">
                      กองยุทธศาสตร์และงบประมาณ
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickSwitch('staff')}
                    className="p-3 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100/80 transition-colors text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-blue-700" />
                      <span className="text-xs font-bold text-blue-900">กลุ่มเจ้าหน้าที่ (Staff)</span>
                    </div>
                    <div className="text-[11px] text-blue-800/80 mt-1 truncate">
                      นายสมเกียรติ สถิตมั่น
                    </div>
                    <div className="text-[10px] text-blue-600 mt-0.5 truncate">กองช่าง</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickSwitch('executive')}
                    className="p-3 rounded-xl border border-purple-200 bg-purple-50/70 hover:bg-purple-100/80 transition-colors text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-purple-700" />
                      <span className="text-xs font-bold text-purple-900">ผู้บริหาร (Executive)</span>
                    </div>
                    <div className="text-[11px] text-purple-800/80 mt-1 truncate">
                      นายกเทศมนตรีเมืองศิลา
                    </div>
                    <div className="text-[10px] text-purple-600 mt-0.5 truncate">สำนักปลัดเทศบาล</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: REGISTER (STAFF / EXECUTIVE / ADMIN) */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
                <span className="font-semibold text-slate-800">เงื่อนไขการลงทะเบียน:</span> สำหรับ
                เจ้าหน้าที่, ผู้บริหาร, หรือผู้ดูแลระบบ เพื่อเข้าถึงฟังก์ชันจัดทำ บันทึก ตรวจสอบ
                และอนุมัติโครงการตามบทบาท
              </div>

              {regError && (
                <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{regError}</span>
                </div>
              )}

              {regSuccess && (
                <div className="p-3 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{regSuccess}</span>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อ - นามสกุล <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น นายช่าง โยธาชำนาญการ"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  สิทธิ์การใช้งาน (User Role) <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRegRole('staff')}
                    className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-all cursor-pointer ${
                      regRole === 'staff'
                        ? 'bg-blue-50 border-blue-500 text-blue-900 ring-2 ring-blue-500/20'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                      <span>เจ้าหน้าที่ (Staff)</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      จัดทำ บันทึก แก้ไข ผ.01, ผ.02
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegRole('executive')}
                    className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-all cursor-pointer ${
                      regRole === 'executive'
                        ? 'bg-purple-50 border-purple-500 text-purple-900 ring-2 ring-purple-500/20'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                      <span>ผู้บริหาร (Executive)</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      ตรวจสอบ พิมพ์ และอนุมัติโครงการ
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegRole('admin')}
                    className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-all cursor-pointer ${
                      regRole === 'admin'
                        ? 'bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-500/20'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-amber-600" />
                      <span>ผู้ดูแลระบบ (Admin)</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      จัดการสิทธิ์ ดูสถิติ และตั้งค่า
                    </div>
                  </button>
                </div>
              </div>

              {/* Department Dropdown (11 main units of Sila Municipality) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>สังกัดสำนัก/กอง (11 หน่วยงานหลักเทศบาลเมืองศิลา)</span>{' '}
                  <span className="text-rose-500">*</span>
                </label>
                <select
                  value={regDepartment}
                  onChange={(e) => setRegDepartment(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-slate-800 cursor-pointer"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* Username & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ชื่อผู้ใช้งาน (Username) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น somchai_eng"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    รหัสผ่าน (Password) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="กำหนดรหัสผ่าน"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Submit */}
              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer transition-all"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>บันทึกลงทะเบียนและเข้าสู่ระบบ</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: PUBLIC CITIZEN REGISTRATION */}
          {activeTab === 'public' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-900 leading-relaxed">
                <div className="font-bold text-emerald-950 flex items-center gap-1.5 mb-1">
                  <Users className="w-4 h-4 text-emerald-700" />
                  <span>สิทธิ์การเข้าชมสำหรับ ประชาชนทั่วไป (Read-Only)</span>
                </div>
                สามารถค้นหาโครงการ กรองข้อมูล ดูรายงาน ผ.01 / ผ.02 สั่งพิมพ์ และส่งออกเอกสารได้
                (ไม่ต้องสังกัดสำนัก/กอง และไม่ต้องตั้งรหัสผ่าน)
              </div>

              <form onSubmit={handlePublicSubmit} className="space-y-4">
                {pubError && (
                  <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{pubError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ชื่อ - นามสกุล <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น นายสมชาย ใจดี"
                    value={pubFullName}
                    onChange={(e) => setPubFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>หมู่ที่ / ชื่อหมู่บ้านในเขตเทศบาลเมืองศิลา</span>{' '}
                    <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="select-auth-modal-public-village"
                    value={pubVillage}
                    onChange={(e) => setPubVillage(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-slate-800 cursor-pointer"
                  >
                    {SILA_ZONES.map((zone) => (
                      <optgroup key={zone.id} label={zone.name}>
                        {zone.villages.map((v) => (
                          <option key={v.villageNumber} value={v.villageName}>
                            {v.villageName}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    วัตถุประสงค์การสืบค้น (ทางเลือก)
                  </label>
                  <select
                    value={pubPurpose}
                    onChange={(e) => setPubPurpose(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-slate-800 cursor-pointer"
                  >
                    <option value="ติดตามโครงการในหมู่บ้าน / ชุมชน">
                      ติดตามโครงการในหมู่บ้าน / ชุมชน
                    </option>
                    <option value="ติดตามงบประมาณประจำปี (พ.ศ. 2571-2575)">
                      ติดตามงบประมาณประจำปี (พ.ศ. 2571-2575)
                    </option>
                    <option value="ค้นหาข้อมูลทั่วไปเกี่ยวกับแผนพัฒนาท้องถิ่น">
                      ค้นหาข้อมูลทั่วไปเกี่ยวกับแผนพัฒนาท้องถิ่น
                    </option>
                    <option value="ตรวจสอบความคืบหน้าโครงการโครงสร้างพื้นฐาน">
                      ตรวจสอบความคืบหน้าโครงการโครงสร้างพื้นฐาน
                    </option>
                  </select>
                </div>

                <div className="text-[11px] text-slate-400 italic">
                  * ช่องสังกัดสำนัก/กอง และรหัสผ่านถูกซ่อนโดยอัตโนมัติตามสิทธิ์ประชาชน
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="submit"
                    className="px-5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <ArrowRight className="w-4 h-4" />
                    <span>เข้าสู่ระบบและเริ่มสืบค้น</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-100/80 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            {currentUser && (currentUser.role === 'admin' || currentUser.role === 'executive') && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenAnalytics) onOpenAnalytics();
                }}
                className="text-emerald-700 hover:text-emerald-800 font-semibold underline cursor-pointer"
              >
                📊 ดูหน้าสรุปสถิติผู้เข้าชมระบบ (Visitor Analytics)
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
