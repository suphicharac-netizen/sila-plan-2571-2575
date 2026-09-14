import React, { useState } from 'react';
import { X, Users, MapPin, Target, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { ALL_VILLAGES, SILA_ZONES } from '../utils/constants';
import { authService } from '../services/authService';
import { UserAccount } from '../types';

interface PublicVisitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserAccount) => void;
}

const SEARCH_PURPOSES = [
  'ติดตามโครงการในหมู่บ้าน / ชุมชน',
  'ติดตามงบประมาณประจำปี (พ.ศ. 2571-2575)',
  'ค้นหาข้อมูลทั่วไปเกี่ยวกับแผนพัฒนาท้องถิ่น',
  'ตรวจสอบความคืบหน้าโครงการโครงสร้างพื้นฐาน',
  'ศึกษาข้อมูลสำหรับงานวิจัย / การศึกษา'
];

export const PublicVisitorModal: React.FC<PublicVisitorModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [fullName, setFullName] = useState('');
  const [village, setVillage] = useState('หมู่ที่ 2 บ้านหนองกุง');
  const [customVillage, setCustomVillage] = useState('');
  const [useCustomVillage, setUseCustomVillage] = useState(false);
  const [purpose, setPurpose] = useState(SEARCH_PURPOSES[0]);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = fullName.trim();
    if (!finalName) {
      setError('กรุณาระบุ ชื่อ-นามสกุล ของท่าน');
      return;
    }

    const selectedVillage = useCustomVillage ? customVillage.trim() : village;
    if (!selectedVillage) {
      setError('กรุณาเลือกหรือระบุหมู่ที่ / ชื่อหมู่บ้าน');
      return;
    }

    setError(null);
    const { user } = authService.registerPublicVisitor(finalName, selectedVillage, purpose);
    onSuccess(user);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-emerald-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Emerald Theme */}
        <div className="bg-gradient-to-r from-[#032e22] via-[#054333] to-[#075e47] px-6 py-5 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-wide">
                  ลงชื่อเข้าชมรายงานสำหรับ ประชาชนทั่วไป
                </h3>
                <p className="text-xs text-emerald-200/90 mt-0.5">
                  สิทธิ์เข้าชมอย่างเดียว (Read-Only) • เทศบาลเมืองศิลา
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

          {/* Feature Badges */}
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-emerald-700/50 text-[11px] text-emerald-100">
            <span className="flex items-center gap-1 bg-emerald-900/50 px-2 py-0.5 rounded-md border border-emerald-600/40">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> ค้นหาและกรองข้อมูล
            </span>
            <span className="flex items-center gap-1 bg-emerald-900/50 px-2 py-0.5 rounded-md border border-emerald-600/40">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> ดูรายงาน ผ.01 / ผ.02
            </span>
            <span className="flex items-center gap-1 bg-emerald-900/50 px-2 py-0.5 rounded-md border border-emerald-600/40">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> พิมพ์และส่งออกเอกสาร
            </span>
          </div>
        </div>

        {/* Informative Alert */}
        <div className="bg-emerald-50/70 border-b border-emerald-100 px-6 py-2.5 flex items-center gap-2 text-xs text-emerald-800">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            ไม่ต้องตั้งรหัสผ่าน ข้อมูลนี้จัดเก็บเพื่อสถิติการรับฟังและเข้าถึงข้อมูลของประชาชน
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              <span>{error}</span>
            </div>
          )}

          {/* 1. Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ชื่อ - นามสกุล <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="ตัวอย่าง: นายสมชาย ใจดี"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* 2. Village / Community */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>หมู่ที่ / ชื่อหมู่บ้านในเขตเทศบาลเมืองศิลา</span> <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setUseCustomVillage(!useCustomVillage)}
                className="text-[11px] text-emerald-600 hover:text-emerald-700 underline cursor-pointer"
              >
                {useCustomVillage ? 'เลือกจากรายการ 28 หมู่บ้าน' : 'ระบุหมู่บ้านเอง'}
              </button>
            </div>

            {!useCustomVillage ? (
              <select
                id="select-public-village"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
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
            ) : (
              <input
                type="text"
                placeholder="เช่น หมู่ที่ 18 บ้านโกทา หรือ หมู่ที่ 27 บ้านหนองกุง"
                value={customVillage}
                onChange={(e) => setCustomVillage(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder:text-slate-400"
              />
            )}
          </div>

          {/* 3. Purpose (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-emerald-600" />
              <span>วัตถุประสงค์การสืบค้น (ทางเลือก)</span>
            </label>
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-slate-800 cursor-pointer"
            >
              {SEARCH_PURPOSES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Note about hidden fields */}
          <div className="text-[11px] text-slate-400 italic">
            * สังกัดสำนัก/กอง และรหัสผ่านถูกซ่อนโดยอัตโนมัติ สำหรับสิทธิ์ประชาชนทั่วไป
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              id="btn-confirm-public-login"
              className="px-5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <span>ลงชื่อเข้าชมรายงาน</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
