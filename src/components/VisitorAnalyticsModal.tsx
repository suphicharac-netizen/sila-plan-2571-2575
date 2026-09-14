import React, { useState, useMemo } from 'react';
import {
  X,
  BarChart3,
  Users,
  MapPin,
  Calendar,
  Search,
  Download,
  Printer,
  RefreshCw,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Filter,
  Layers,
  Building
} from 'lucide-react';
import { authService } from '../services/authService';
import { SILA_ZONES, ALL_VILLAGES } from '../utils/constants';
import { VisitorLog } from '../types';

interface VisitorAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VisitorAnalyticsModal: React.FC<VisitorAnalyticsModalProps> = ({
  isOpen,
  onClose
}) => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [searchLogKeyword, setSearchLogKeyword] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'villages' | 'logs'>('villages');

  const stats = useMemo(() => {
    return authService.getVisitorStats();
  }, [refreshKey, isOpen]);

  if (!isOpen) return null;

  // Filtered village counts
  const villageListWithCounts = ALL_VILLAGES.map((v) => {
    // Check various name formats
    const count =
      (stats.byVillage[v.villageName] || 0) +
      (stats.byVillage[`หมู่ที่ ${v.villageNumber} ${v.shortName}`] || 0);
    return {
      ...v,
      count
    };
  }).filter((v) => {
    if (selectedZone === 'all') return true;
    return v.zone === selectedZone;
  }).sort((a, b) => b.count - a.count);

  const maxVillageCount = Math.max(...villageListWithCounts.map((v) => v.count), 1);

  // Filtered logs
  const filteredLogs = stats.recentLogs.filter((log) => {
    if (!searchLogKeyword.trim()) return true;
    const kw = searchLogKeyword.toLowerCase();
    return (
      log.fullName.toLowerCase().includes(kw) ||
      log.village.toLowerCase().includes(kw) ||
      log.purpose.toLowerCase().includes(kw)
    );
  });

  const handleExportCSV = () => {
    const header = 'ลำดับ,วัน-เวลา,ชื่อ-นามสกุล,หมู่ที่/หมู่บ้าน,วัตถุประสงค์\n';
    const rows = stats.recentLogs
      .map(
        (log, idx) =>
          `"${idx + 1}","${log.timestamp}","${log.fullName}","${log.village}","${log.purpose}"`
      )
      .join('\n');
    const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `รายงานสถิติผู้เข้าชม_เทศบาลเมืองศิลา_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-emerald-100 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#02281e] via-[#054333] to-[#075e47] px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white tracking-wide">
                    สถิติผู้เข้าชมรายงานแผนพัฒนาท้องถิ่น
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-700/80 text-emerald-100 border border-emerald-500/40">
                    สำหรับ Admin / ผู้บริหาร
                  </span>
                </div>
                <p className="text-xs text-emerald-200/90 mt-0.5">
                  เทศบาลเมืองศิลา • บันทึกสถิติการเข้าถึงข้อมูลของประชาชนตามรายหมู่บ้าน
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setRefreshKey((k) => k + 1)}
                title="รีเฟรชข้อมูลสถิติ"
                className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick KPI Summary Cards */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                <span>ยอดผู้เข้าชมรวม</span>
              </div>
              <div className="text-2xl font-black text-emerald-700 mt-1">
                {stats.total.toLocaleString()} <span className="text-xs font-normal text-slate-500">ครั้ง</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">นับรวมการลงชื่อทุกประเภท</div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>หมู่บ้านที่มีการเข้าชม</span>
              </div>
              <div className="text-2xl font-black text-blue-700 mt-1">
                {Object.keys(stats.byVillage).length}{' '}
                <span className="text-xs font-normal text-slate-500">/ {ALL_VILLAGES.length} หมู่บ้าน</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">ครอบคลุมทั้ง 3 เขตการปกครอง</div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-purple-600" />
                <span>เขต 1 / เขต 2 / เขต 3</span>
              </div>
              <div className="text-sm font-bold text-slate-700 mt-2 flex items-center gap-2">
                <span className="text-emerald-700">ข.1: {stats.byZone['เขต 1'] || 0}</span>
                <span>•</span>
                <span className="text-sky-700">ข.2: {stats.byZone['เขต 2'] || 0}</span>
                <span>•</span>
                <span className="text-purple-700">ข.3: {stats.byZone['เขต 3'] || 0}</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">สถิติกระจายตามพื้นที่</div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
                <span>วัตถุประสงค์ยอดนิยม</span>
              </div>
              <div className="text-xs font-bold text-slate-800 mt-2 truncate">
                {Object.entries(stats.byPurpose).sort((a, b) => b[1] - a[1])[0]?.[0] || 'ติดตามโครงการ'}
              </div>
              <div className="text-[10px] text-amber-600 font-medium mt-0.5">
                {Object.entries(stats.byPurpose).sort((a, b) => b[1] - a[1])[0]?.[1] || 0} ครั้ง
              </div>
            </div>
          </div>
        </div>

        {/* Tab & Filter Bar */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-200 px-6 py-2.5 bg-white gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('villages')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'villages'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              สถิติแยกตามรายหมู่บ้าน (28 หมู่บ้าน)
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'logs'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              ประวัติการลงชื่อเข้าชมล่าสุด ({stats.recentLogs.length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'villages' && (
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span>เลือกเขต:</span>
                <select
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                  className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="all">ทั้งหมด (3 เขต)</option>
                  {SILA_ZONES.map((z) => (
                    <option key={z.id} value={z.name}>
                      {z.name} ({z.villages.length} หมู่บ้าน)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {activeTab === 'logs' && (
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อ หรือ หมู่บ้าน..."
                  value={searchLogKeyword}
                  onChange={(e) => setSearchLogKeyword(e.target.value)}
                  className="pl-8 pr-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-48 placeholder:text-slate-400"
                />
              </div>
            )}

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ส่งออก CSV</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* VIEW 1: VILLAGES BREAKDOWN */}
          {activeTab === 'villages' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>
                  แสดง {villageListWithCounts.length} หมู่บ้าน{' '}
                  {selectedZone !== 'all' ? `(เฉพาะ ${selectedZone})` : `(ครอบคลุมทั้ง ${ALL_VILLAGES.length} หมู่บ้าน)`}
                </span>
                <span>เรียงตามยอดเข้าชมจากมากไปน้อย</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {villageListWithCounts.map((v) => {
                  const percent = Math.round((v.count / maxVillageCount) * 100);
                  const isTop = v.count > 0;
                  return (
                    <div
                      key={v.villageNumber}
                      className="p-3 bg-white rounded-xl border border-slate-200 hover:border-emerald-300 transition-all shadow-2xs flex flex-col justify-between"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                              {v.villageNumber}
                            </span>
                            <span>{v.villageName}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            สังกัด: <span className="text-slate-600 font-medium">{v.zone}</span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                              isTop
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {v.count} ครั้ง
                          </span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            v.zone === 'เขต 1'
                              ? 'bg-emerald-600'
                              : v.zone === 'เขต 2'
                              ? 'bg-sky-600'
                              : 'bg-purple-600'
                          }`}
                          style={{ width: `${Math.max(percent, 4)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW 2: LOGS TABLE */}
          {activeTab === 'logs' && (
            <div className="overflow-hidden rounded-xl border border-slate-200 shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 w-12 text-center">#</th>
                    <th className="py-2.5 px-3">วัน - เวลา</th>
                    <th className="py-2.5 px-3">ชื่อ - นามสกุล ผู้เข้าชม</th>
                    <th className="py-2.5 px-3">หมู่ที่ / หมู่บ้าน</th>
                    <th className="py-2.5 px-3">วัตถุประสงค์การสืบค้น</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredLogs.length > 0 ? (
                    filteredLogs.map((log, idx) => (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3 text-slate-600 flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{log.timestamp}</span>
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-800">
                          {log.fullName}
                        </td>
                        <td className="py-2 px-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px]">
                            <MapPin className="w-3 h-3 text-emerald-600" />
                            <span>{log.village}</span>
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-600">{log.purpose}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                        ไม่พบประวัติการเข้าชมที่ตรงกับเงื่อนไขการค้นหา
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 text-emerald-700">
            <ShieldCheck className="w-4 h-4" />
            <span>ข้อมูลนี้จัดเก็บใน IndexedDB / LocalStorage ของเบราว์เซอร์ พร้อมใช้งานทันที</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
