import React, { useState, useMemo } from 'react';
import {
  MapPin,
  ChevronRight,
  ArrowLeft,
  Building2,
  Layers,
  Search,
  CheckCircle2,
  Clock,
  Coins,
  FileText,
  Filter,
  Check,
  Eye,
  BarChart3,
  Home,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { ProjectData, SILA_ZONES, ALL_VILLAGES, ZoneInfo, VillageInfo } from '../types';

interface VillagePlanViewProps {
  projects: ProjectData[];
  onViewProjectDetail: (project: ProjectData) => void;
}

export const VillagePlanView: React.FC<VillagePlanViewProps> = ({
  projects,
  onViewProjectDetail
}) => {
  // Navigation State for 3 Levels:
  // Level 1: Zone overview (3 zones)
  // Level 2: Village overview within selected zone
  // Level 3: Projects within selected village
  const [currentLevel, setCurrentLevel] = useState<1 | 2 | 3>(1);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [selectedVillageNumber, setSelectedVillageNumber] = useState<number | null>(null);

  // Filters
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'in_progress' | 'not_started'>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Find selected zone and village objects
  const activeZone = useMemo(() => {
    if (!selectedZoneId) return null;
    return SILA_ZONES.find((z) => z.id === selectedZoneId) || null;
  }, [selectedZoneId]);

  const activeVillage = useMemo(() => {
    if (selectedVillageNumber === null) return null;
    return ALL_VILLAGES.find((v) => v.villageNumber === selectedVillageNumber) || null;
  }, [selectedVillageNumber]);

  // Helper to get total budget for a project
  const getProjectBudget = (p: ProjectData): number => {
    if (p.budgetApproved && p.budgetApproved > 0) return p.budgetApproved;
    if (p.budgetPlan && p.budgetPlan > 0) return p.budgetPlan;
    return 0;
  };

  // Helper to match a project to a village
  const isProjectInVillage = (p: ProjectData, village: VillageInfo): boolean => {
    if (p.villageNumber === village.villageNumber) return true;
    if (p.village && (p.village.includes(village.shortName) || p.village.includes(`หมู่ที่ ${village.villageNumber}`))) {
      return true;
    }
    if (p.name && (p.name.includes(village.shortName) || p.name.includes(`หมู่ที่ ${village.villageNumber}`))) {
      return true;
    }
    return false;
  };

  // Helper to match a project to a zone
  const isProjectInZone = (p: ProjectData, zone: ZoneInfo): boolean => {
    if (p.zone === zone.name) return true;
    // Check if project's village belongs to this zone
    const village = ALL_VILLAGES.find((v) => isProjectInVillage(p, v));
    if (village && village.zone === zone.name) return true;
    return false;
  };

  // Precompute statistics per zone
  const zoneStats = useMemo(() => {
    return SILA_ZONES.map((zone) => {
      const zoneProjects = projects.filter((p) => isProjectInZone(p, zone));
      const totalBudget = zoneProjects.reduce((sum, p) => sum + getProjectBudget(p), 0);
      const completedCount = zoneProjects.filter((p) => p.executionStatus === 'completed').length;
      const inProgressCount = zoneProjects.filter((p) => p.executionStatus === 'in_progress').length;
      const notStartedCount = zoneProjects.filter((p) => !p.executionStatus || p.executionStatus === 'not_started').length;

      return {
        zone,
        totalVillages: zone.villages.length,
        totalProjects: zoneProjects.length,
        totalBudget,
        completedCount,
        inProgressCount,
        notStartedCount,
        completionRate: zoneProjects.length > 0 ? Math.round((completedCount / zoneProjects.length) * 100) : 0
      };
    });
  }, [projects]);

  // Precompute statistics per village in the active zone
  const villageStatsInActiveZone = useMemo(() => {
    if (!activeZone) return [];

    return activeZone.villages.map((village) => {
      const vProjects = projects.filter((p) => isProjectInVillage(p, village));
      const totalBudget = vProjects.reduce((sum, p) => sum + getProjectBudget(p), 0);
      const completedCount = vProjects.filter((p) => p.executionStatus === 'completed').length;
      const inProgressCount = vProjects.filter((p) => p.executionStatus === 'in_progress').length;
      const notStartedCount = vProjects.filter((p) => !p.executionStatus || p.executionStatus === 'not_started').length;

      return {
        village,
        projects: vProjects,
        totalProjects: vProjects.length,
        totalBudget,
        completedCount,
        inProgressCount,
        notStartedCount,
        completionRate: vProjects.length > 0 ? Math.round((completedCount / vProjects.length) * 100) : 0
      };
    });
  }, [activeZone, projects]);

  // Filtered villages in active zone by search keyword
  const filteredVillages = useMemo(() => {
    if (!searchKeyword.trim()) return villageStatsInActiveZone;
    const term = searchKeyword.toLowerCase().trim();
    return villageStatsInActiveZone.filter(
      (item) =>
        item.village.villageName.toLowerCase().includes(term) ||
        item.village.shortName.toLowerCase().includes(term) ||
        String(item.village.villageNumber).includes(term)
    );
  }, [villageStatsInActiveZone, searchKeyword]);

  // Projects in the selected village (Level 3)
  const villageProjects = useMemo(() => {
    if (!activeVillage) return [];
    let list = projects.filter((p) => isProjectInVillage(p, activeVillage));

    if (statusFilter !== 'all') {
      if (statusFilter === 'not_started') {
        list = list.filter((p) => !p.executionStatus || p.executionStatus === 'not_started');
      } else {
        list = list.filter((p) => p.executionStatus === statusFilter);
      }
    }

    if (yearFilter !== 'all') {
      list = list.filter((p) => p.year === yearFilter);
    }

    if (searchKeyword.trim()) {
      const term = searchKeyword.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.code?.toLowerCase().includes(term) ||
          p.department?.toLowerCase().includes(term) ||
          p.planCategory?.toLowerCase().includes(term)
      );
    }

    return list;
  }, [activeVillage, projects, statusFilter, yearFilter, searchKeyword]);

  // Overall totals across all 3 zones
  const totalAllProjects = useMemo(() => projects.length, [projects]);
  const totalAllBudget = useMemo(
    () => projects.reduce((sum, p) => sum + getProjectBudget(p), 0),
    [projects]
  );

  // Navigation Handlers
  const handleSelectZone = (zoneId: string) => {
    setSelectedZoneId(zoneId);
    setSelectedVillageNumber(null);
    setCurrentLevel(2);
    setSearchKeyword('');
  };

  const handleSelectVillage = (villageNum: number) => {
    setSelectedVillageNumber(villageNum);
    setCurrentLevel(3);
    setSearchKeyword('');
  };

  const handleGoToLevel1 = () => {
    setSelectedZoneId(null);
    setSelectedVillageNumber(null);
    setCurrentLevel(1);
    setSearchKeyword('');
  };

  const handleGoToLevel2 = () => {
    setSelectedVillageNumber(null);
    setCurrentLevel(2);
    setSearchKeyword('');
  };

  return (
    <div id="village-plan-view-container" className="flex-1 flex flex-col min-w-0 bg-slate-50 h-full min-h-0 overflow-hidden">
      {/* 1. Top Header & Breadcrumbs Bar */}
      <header className="bg-white border-b border-slate-200 shrink-0 z-20 shadow-xs">
        <div className="px-4 py-2 sm:py-2.5">
          {/* Top Row: Title & Badges */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>แผนพัฒนารายหมู่บ้าน (Zone Hierarchy)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-normal">
                    28 หมู่บ้าน • 3 เขต
                  </span>
                </h1>
                <p className="text-[11px] text-slate-500">
                  โครงสร้างการกระจายโครงการและงบประมาณตามเขตการปกครอง เทศบาลเมืองศิลา
                </p>
              </div>
            </div>

            {/* Back button if in Level 2 or Level 3 */}
            {currentLevel > 1 && (
              <button
                id="btn-village-plan-back"
                onClick={currentLevel === 3 ? handleGoToLevel2 : handleGoToLevel1}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer self-start sm:self-auto shadow-2xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>
                  {currentLevel === 3
                    ? `กลับไประดับเขต (${activeZone?.name})`
                    : 'กลับไปภาพรวม 3 เขต'}
                </span>
              </button>
            )}
          </div>

          {/* Breadcrumb Navigation Trail */}
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-xs font-medium overflow-x-auto py-0.5 text-slate-600 scrollbar-none"
          >
            {/* Root: Level 1 */}
            <button
              id="breadcrumb-level-1"
              onClick={handleGoToLevel1}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded transition-colors cursor-pointer whitespace-nowrap text-xs ${
                currentLevel === 1
                  ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200'
                  : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              <Home className="w-3 h-3 text-emerald-600" />
              <span>ภาพรวม 3 เขต</span>
            </button>

            {/* Step 2: Level 2 */}
            {currentLevel >= 2 && activeZone && (
              <>
                <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                <button
                  id="breadcrumb-level-2"
                  onClick={handleGoToLevel2}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded transition-colors cursor-pointer whitespace-nowrap text-xs ${
                    currentLevel === 2
                      ? `${activeZone.badgeBg} ${activeZone.badgeText} font-semibold border ${activeZone.badgeBorder}`
                      : 'hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  <Building2 className="w-3 h-3" />
                  <span>{activeZone.name} ({activeZone.villages.length} หมู่บ้าน)</span>
                </button>
              </>
            )}

            {/* Step 3: Level 3 */}
            {currentLevel === 3 && activeVillage && (
              <>
                <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                <div
                  id="breadcrumb-level-3"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-700 text-white font-semibold whitespace-nowrap text-xs shadow-2xs"
                >
                  <MapPin className="w-3 h-3" />
                  <span>{activeVillage.villageName}</span>
                </div>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-3">
        {/* ========================================================================= */}
        {/* LEVEL 1: ภาพรวมระดับเขต (3 เขตการปกครอง) */}
        {/* ========================================================================= */}
        {currentLevel === 1 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Banner Overview */}
            <div className="bg-gradient-to-r from-[#03231a] via-[#064232] to-[#0a5c45] rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1.5 max-w-2xl">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-medium border border-emerald-400/30">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>โครงสร้างการบริหารจัดการแผนพัฒนารายพื้นที่</span>
                </div>
                <h2 className="text-xl font-bold tracking-tight">
                  แผนพัฒนารายเขตและหมู่บ้าน เทศบาลเมืองศิลา
                </h2>
                <p className="text-xs text-emerald-100/80 leading-relaxed">
                  ครอบคลุม 28 หมู่บ้าน แบ่งออกเป็น 3 เขตการปกครองหลัก เพื่อการกระจายงบประมาณและการพัฒนาโครงสร้างพื้นฐาน คุณภาพชีวิต และสิ่งแวดล้อมอย่างทั่วถึง
                </p>
              </div>

              {/* Total Stats Box */}
              <div className="grid grid-cols-2 gap-3 bg-white/10 backdrop-blur-xs p-4 rounded-xl border border-white/15 shrink-0 min-w-[240px]">
                <div>
                  <div className="text-[11px] text-emerald-200">โครงการทั้งหมด</div>
                  <div className="text-xl font-bold font-mono text-white">
                    {totalAllProjects.toLocaleString()} โครงการ
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-emerald-200">งบประมาณรวม</div>
                  <div className="text-xl font-bold font-mono text-amber-300">
                    ฿{totalAllBudget.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* 3 Zone Cards */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-800">
                    เลือกระดับเขตการปกครองเพื่อดูรายชื่อหมู่บ้าน (3 เขต)
                  </h3>
                </div>
                <span className="text-xs text-slate-500">คลิกที่การ์ดเพื่อเจาะลึกระดับหมู่บ้าน</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {zoneStats.map((item) => {
                  const { zone } = item;
                  return (
                    <div
                      key={zone.id}
                      id={`card-zone-${zone.id}`}
                      onClick={() => handleSelectZone(zone.id)}
                      className="group bg-white rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-lg transition-all duration-200 overflow-hidden cursor-pointer flex flex-col"
                    >
                      {/* Card Header Strip */}
                      <div
                        className="p-5 border-b border-slate-100 flex items-start justify-between relative"
                        style={{ borderTop: `4px solid ${zone.color}` }}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-bold px-2.5 py-0.5 rounded-md ${zone.badgeBg} ${zone.badgeText} border ${zone.badgeBorder}`}
                            >
                              {zone.name}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">
                              {item.totalVillages} หมู่บ้าน
                            </span>
                          </div>
                          <h4 className="text-base font-bold text-slate-900 mt-1.5 group-hover:text-emerald-700 transition-colors">
                            {zone.fullName}
                          </h4>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                            {zone.description}
                          </p>
                        </div>
                      </div>

                      {/* Metrics Section */}
                      <div className="p-5 flex-1 space-y-4 bg-slate-50/50">
                        {/* 3 Primary Metric Pills */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                            <div className="text-[11px] text-slate-500 font-medium">โครงการในแผน</div>
                            <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
                              {item.totalProjects}{' '}
                              <span className="text-xs font-normal text-slate-500">โครงการ</span>
                            </div>
                          </div>
                          <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                            <div className="text-[11px] text-slate-500 font-medium">งบประมาณรวม</div>
                            <div className="text-lg font-bold font-mono text-emerald-700 mt-0.5">
                              ฿{item.totalBudget.toLocaleString()}
                            </div>
                          </div>
                        </div>

                        {/* Status Breakdown Bar */}
                        <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-700">ความก้าวหน้าโครงการ</span>
                            <span className="font-mono font-bold text-emerald-700">
                              {item.completionRate}%
                            </span>
                          </div>

                          {/* Multi-segmented Progress bar */}
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                            <div
                              style={{
                                width: `${
                                  item.totalProjects > 0
                                    ? (item.completedCount / item.totalProjects) * 100
                                    : 0
                                }%`
                              }}
                              className="bg-emerald-600 h-full"
                              title={`เสร็จสิ้น: ${item.completedCount}`}
                            />
                            <div
                              style={{
                                width: `${
                                  item.totalProjects > 0
                                    ? (item.inProgressCount / item.totalProjects) * 100
                                    : 0
                                }%`
                              }}
                              className="bg-amber-500 h-full"
                              title={`กำลังดำเนิน: ${item.inProgressCount}`}
                            />
                            <div
                              style={{
                                width: `${
                                  item.totalProjects > 0
                                    ? (item.notStartedCount / item.totalProjects) * 100
                                    : 0
                                }%`
                              }}
                              className="bg-slate-300 h-full"
                              title={`ยังไม่ดำเนิน: ${item.notStartedCount}`}
                            />
                          </div>

                          {/* Status Legend Pills */}
                          <div className="flex items-center justify-between text-[11px] pt-1 text-slate-600">
                            <span className="inline-flex items-center gap-1 text-emerald-700">
                              <span className="w-2 h-2 rounded-full bg-emerald-600" />
                              เสร็จ {item.completedCount}
                            </span>
                            <span className="inline-flex items-center gap-1 text-amber-700">
                              <span className="w-2 h-2 rounded-full bg-amber-500" />
                              กำลังทำ {item.inProgressCount}
                            </span>
                            <span className="inline-flex items-center gap-1 text-slate-500">
                              <span className="w-2 h-2 rounded-full bg-slate-400" />
                              ยังไม่ทำ {item.notStartedCount}
                            </span>
                          </div>
                        </div>

                        {/* Village Badges Sample */}
                        <div>
                          <div className="text-[11px] font-semibold text-slate-600 mb-1.5">
                            รายชื่อหมู่บ้านในสังกัด ({zone.villages.length} หมู่):
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {zone.villages.slice(0, 6).map((v) => (
                              <span
                                key={v.villageNumber}
                                className="text-[10px] px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600"
                              >
                                ม.{v.villageNumber} {v.shortName}
                              </span>
                            ))}
                            {zone.villages.length > 6 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                                + อีก {zone.villages.length - 6} หมู่
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Button */}
                      <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-700 group-hover:bg-emerald-50/50 transition-colors">
                        <span>เข้าดูรายชื่อหมู่บ้านใน {zone.name}</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Comparative Summary Table of All 3 Zones */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-800">
                    ตารางเปรียบเทียบสถิติการพัฒนา 3 เขตการปกครอง
                  </h3>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#0e533c] text-white font-semibold">
                      <th className="py-2.5 px-3">เขตการปกครอง</th>
                      <th className="py-2.5 px-3 text-center">จำนวนหมู่บ้าน</th>
                      <th className="py-2.5 px-3 text-center">โครงการในแผน</th>
                      <th className="py-2.5 px-3 text-right">งบประมาณรวม</th>
                      <th className="py-2.5 px-3 text-center">เสร็จสิ้น</th>
                      <th className="py-2.5 px-3 text-center">กำลังดำเนิน</th>
                      <th className="py-2.5 px-3 text-center">ยังไม่เริ่ม</th>
                      <th className="py-2.5 px-3 text-center">การดำเนินการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {zoneStats.map((item) => (
                      <tr key={item.zone.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 font-semibold text-slate-900 flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: item.zone.color }}
                          />
                          <span>{item.zone.fullName}</span>
                        </td>
                        <td className="py-3 px-3 text-center font-mono">{item.totalVillages} หมู่</td>
                        <td className="py-3 px-3 text-center font-mono font-medium">
                          {item.totalProjects} โครงการ
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                          ฿{item.totalBudget.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-mono">
                            {item.completedCount}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-mono">
                            {item.inProgressCount}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-mono">
                            {item.notStartedCount}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => handleSelectZone(item.zone.id)}
                            className="px-3 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[11px] transition-colors cursor-pointer shadow-2xs"
                          >
                            เลือกเขตนี้
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-200">
                      <td className="py-2.5 px-3">รวมทั้งเทศบาลเมืองศิลา (3 เขต)</td>
                      <td className="py-2.5 px-3 text-center font-mono">28 หมู่บ้าน</td>
                      <td className="py-2.5 px-3 text-center font-mono">{totalAllProjects} โครงการ</td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-800">
                        ฿{totalAllBudget.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono">
                        {zoneStats.reduce((s, z) => s + z.completedCount, 0)}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono">
                        {zoneStats.reduce((s, z) => s + z.inProgressCount, 0)}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono">
                        {zoneStats.reduce((s, z) => s + z.notStartedCount, 0)}
                      </td>
                      <td className="py-2.5 px-3 text-center">-</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* LEVEL 2: ระดับหมู่บ้านในเขต (รายการหมู่บ้านในเขตที่เลือก) */}
        {/* ========================================================================= */}
        {currentLevel === 2 && activeZone && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Zone Header Banner */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                  style={{ backgroundColor: activeZone.color }}
                >
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${activeZone.badgeBg} ${activeZone.badgeText}`}>
                      {activeZone.name}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      {activeZone.villages.length} หมู่บ้านในเขตนี้
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 mt-1">
                    {activeZone.fullName}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">{activeZone.description}</p>
                </div>
              </div>

              {/* Zone Quick Stats */}
              <div className="flex items-center gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-100 shrink-0">
                <div>
                  <div className="text-[11px] text-slate-500">โครงการทั้งเขต</div>
                  <div className="text-base font-bold font-mono text-slate-900">
                    {villageStatsInActiveZone.reduce((s, v) => s + v.totalProjects, 0)} รายการ
                  </div>
                </div>
                <div className="w-px h-8 bg-slate-200" />
                <div>
                  <div className="text-[11px] text-slate-500">งบประมาณรวมทั้งเขต</div>
                  <div className="text-base font-bold font-mono text-emerald-700">
                    ฿{villageStatsInActiveZone.reduce((s, v) => s + v.totalBudget, 0).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Filter and View Controls */}
            <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="input-search-village"
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="ค้นหาหมู่บ้าน (ชื่อหมู่บ้าน หรือ เลขที่หมู่)..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:bg-white transition-all"
                />
              </div>

              {/* View Mode & Reset */}
              <div className="flex items-center gap-2">
                {searchKeyword && (
                  <button
                    onClick={() => setSearchKeyword('')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>ล้างค้นหา</span>
                  </button>
                )}

                <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 text-xs">
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`px-3 py-1 rounded-md transition-colors cursor-pointer font-medium ${
                      viewMode === 'cards'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    การ์ด (Grid)
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-3 py-1 rounded-md transition-colors cursor-pointer font-medium ${
                      viewMode === 'table'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ตาราง (Table)
                  </button>
                </div>
              </div>
            </div>

            {/* List of Villages in Selected Zone (Grid View) */}
            {viewMode === 'cards' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredVillages.map((item) => {
                  const { village } = item;
                  return (
                    <div
                      key={village.villageNumber}
                      id={`card-village-${village.villageNumber}`}
                      onClick={() => handleSelectVillage(village.villageNumber)}
                      className="group bg-white rounded-xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all duration-150 p-4 cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="inline-block px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200 mb-1">
                              หมู่ที่ {village.villageNumber}
                            </div>
                            <h4 className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors">
                              {village.villageName}
                            </h4>
                          </div>
                          <span className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-emerald-100 text-slate-600 group-hover:text-emerald-700 flex items-center justify-center transition-colors shrink-0">
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                          </span>
                        </div>

                        {/* Stats Metrics */}
                        <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-[11px] text-slate-400 block">โครงการ</span>
                            <span className="font-bold font-mono text-slate-800 text-sm">
                              {item.totalProjects}{' '}
                              <span className="text-[11px] font-normal text-slate-500">โครงการ</span>
                            </span>
                          </div>
                          <div>
                            <span className="text-[11px] text-slate-400 block">งบประมาณ</span>
                            <span className="font-bold font-mono text-emerald-700 text-sm">
                              ฿{item.totalBudget.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* Status Distribution Pills */}
                        <div className="mt-3 bg-slate-50 rounded-lg p-2 flex items-center justify-between text-[11px]">
                          <span className="text-emerald-700 font-medium" title="เสร็จสิ้น">
                            ✓ {item.completedCount}
                          </span>
                          <span className="text-amber-700 font-medium" title="กำลังดำเนินการ">
                            ⏳ {item.inProgressCount}
                          </span>
                          <span className="text-slate-500 font-medium" title="ยังไม่ดำเนินการ">
                            ○ {item.notStartedCount}
                          </span>
                        </div>
                      </div>

                      {/* Footer Link */}
                      <div className="mt-3 pt-2 text-right">
                        <span className="text-[11px] font-semibold text-emerald-700 group-hover:underline inline-flex items-center gap-1">
                          <span>ดูโครงการในหมู่บ้านนี้</span>
                          <span>→</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Table View for Villages in Selected Zone */
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#0e533c] text-white font-semibold">
                      <th className="py-2.5 px-3 text-center w-20">หมู่ที่</th>
                      <th className="py-2.5 px-3">ชื่อหมู่บ้าน</th>
                      <th className="py-2.5 px-3 text-center w-28">โครงการทั้งหมด</th>
                      <th className="py-2.5 px-3 text-center w-24">เสร็จแล้ว</th>
                      <th className="py-2.5 px-3 text-center w-24">กำลังทำ</th>
                      <th className="py-2.5 px-3 text-center w-24">ยังไม่เริ่ม</th>
                      <th className="py-2.5 px-3 text-right w-36">งบประมาณรวม</th>
                      <th className="py-2.5 px-3 text-center w-24">การกระทำ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredVillages.map((item) => {
                      const { village } = item;
                      return (
                        <tr
                          key={village.villageNumber}
                          onClick={() => handleSelectVillage(village.villageNumber)}
                          className="hover:bg-emerald-50/40 cursor-pointer transition-colors"
                        >
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800">
                            {village.villageNumber}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            {village.villageName}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-medium">
                            {item.totalProjects}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-mono text-[11px]">
                              {item.completedCount}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-mono text-[11px]">
                              {item.inProgressCount}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono text-[11px]">
                              {item.notStartedCount}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                            ฿{item.totalBudget.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="text-emerald-700 hover:text-emerald-900 font-semibold underline text-[11px]">
                              เปิดดู
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* LEVEL 3: ระดับโครงการรายหมู่บ้าน (ตารางรายการโครงการของหมู่บ้านที่เลือก) */}
        {/* ========================================================================= */}
        {currentLevel === 3 && activeVillage && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Village Profile Banner */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {activeZone?.name || 'เขตการปกครอง'}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      หมู่ที่ {activeVillage.villageNumber}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mt-1">
                    {activeVillage.villageName}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    รายการโครงการแผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575) ประจำพื้นที่ {activeVillage.villageName}
                  </p>
                </div>
              </div>

              {/* Village Quick Stats */}
              <div className="flex items-center gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-100 shrink-0">
                <div>
                  <div className="text-[11px] text-slate-500">จำนวนโครงการ</div>
                  <div className="text-base font-bold font-mono text-slate-900">
                    {villageProjects.length} โครงการ
                  </div>
                </div>
                <div className="w-px h-8 bg-slate-200" />
                <div>
                  <div className="text-[11px] text-slate-500">งบประมาณรวม</div>
                  <div className="text-base font-bold font-mono text-emerald-700">
                    ฿{villageProjects.reduce((s, p) => s + getProjectBudget(p), 0).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Search */}
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="input-search-village-project"
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="ค้นหาชื่อโครงการ, แผนงาน หรือหน่วยงาน..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:bg-white transition-all"
                />
              </div>

              {/* Status & Year Dropdowns */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-xs">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-500 text-[11px]">สถานะ:</span>
                </div>
                <select
                  id="select-status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="all">ทั้งหมด</option>
                  <option value="completed">เสร็จสิ้น</option>
                  <option value="in_progress">กำลังดำเนินการ</option>
                  <option value="not_started">ยังไม่ดำเนินการ</option>
                </select>

                <select
                  id="select-year-filter"
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="all">ทุกปี พ.ศ.</option>
                  <option value="2571">พ.ศ. 2571</option>
                  <option value="2572">พ.ศ. 2572</option>
                  <option value="2573">พ.ศ. 2573</option>
                  <option value="2574">พ.ศ. 2574</option>
                  <option value="2575">พ.ศ. 2575</option>
                </select>

                {(searchKeyword || statusFilter !== 'all' || yearFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchKeyword('');
                      setStatusFilter('all');
                      setYearFilter('all');
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>ล้างตัวกรอง</span>
                  </button>
                )}
              </div>
            </div>

            {/* Project Table (reusing identical layout and styles from Dashboard/Recent Projects) */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    ตารางโครงการใน {activeVillage.villageName}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    คลิกที่แถวโครงการเพื่อดูรายละเอียด ฉบับแผน และการจัดสรรงบประมาณ
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                  พบ {villageProjects.length} รายการ
                </span>
              </div>

              {villageProjects.length === 0 ? (
                <div className="py-12 px-4 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="text-slate-700 font-medium text-sm">
                    ยังไม่มีรายการโครงการที่ระบุพื้นที่ใน {activeVillage.villageName}
                  </div>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    ท่านสามารถเพิ่มโครงการใหม่ผ่านเมนู แผนพัฒนาท้องถิ่น (ผ.02) หรือสืบค้นโครงการทั้งหมด
                  </p>
                </div>
              ) : (
                <div className="overflow-auto max-h-[65vh]">
                  <table className="table-fixed w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#0e533c] text-white font-semibold sticky top-0 z-10">
                        <th className="py-2 px-2.5 w-12 text-center text-emerald-100 font-medium border-r border-[#0a4230]">
                          ที่
                        </th>
                        <th className="py-2 px-2.5 w-20 text-center font-semibold border-r border-[#0a4230]">
                          ประเภท
                        </th>
                        <th className="py-2 px-2.5 w-[16%] font-semibold">ประเด็นการพัฒนา</th>
                        <th className="py-2 px-2.5 w-[14%] font-semibold">แผนงาน</th>
                        <th className="py-2 px-2.5 w-[28%] font-semibold">ชื่อโครงการ / รายละเอียดเป้าหมาย</th>
                        <th className="py-2 px-2.5 w-[12%] text-center font-semibold">หน่วยงาน</th>
                        <th className="py-2 px-2.5 w-[12%] text-right font-semibold">งบประมาณ</th>
                        <th className="py-2 px-2.5 w-20 text-center font-semibold">สถานะ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {villageProjects.map((p, idx) => (
                        <tr
                          key={p.id}
                          id={`row-village-project-${p.id}`}
                          onClick={() => onViewProjectDetail(p)}
                          className="hover:bg-emerald-50/40 cursor-pointer transition-colors border-b border-slate-100 last:border-b-0"
                        >
                          {/* 1. ที่ (ลำดับ 1, 2, 3...) */}
                          <td className="py-2 px-2.5 w-12 text-center font-mono font-medium text-slate-500 whitespace-nowrap bg-slate-50/50 border-r border-slate-100">
                            {idx + 1}
                          </td>

                          {/* 2. ประเภท */}
                          <td className="py-2 px-2.5 w-20 text-center whitespace-nowrap border-r border-slate-100">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${
                                p.edition === 'first'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : p.edition === 'additional'
                                  ? 'bg-sky-50 text-sky-700 border border-sky-200'
                                  : p.edition === 'changed'
                                  ? 'bg-[#f5eeff] text-[#7e22ce] border border-[#d8b4fe]'
                                  : 'bg-[#fef9c3] text-[#a16207] border border-[#fde047]'
                              }`}
                            >
                              {p.edition === 'first'
                                ? 'ฉบับแรก'
                                : p.edition === 'additional'
                                ? 'เพิ่มเติม'
                                : p.edition === 'changed'
                                ? 'เปลี่ยนแปลง'
                                : 'แก้ไข'}
                            </span>
                          </td>

                          {/* 3. ประเด็นการพัฒนา */}
                          <td className="py-2 px-2.5 text-slate-600 truncate" title={p.planStrategy}>
                            {p.planStrategy || '-'}
                          </td>

                          {/* 4. แผนงาน */}
                          <td className="py-2 px-2.5 text-slate-600 truncate" title={p.planCategory}>
                            {p.planCategory || '-'}
                          </td>

                          {/* 5. ชื่อโครงการ / รายละเอียดเป้าหมาย */}
                          <td className="py-2 px-2.5 font-medium text-slate-800">
                            <div className="font-semibold text-slate-900 truncate" title={p.name}>{p.name}</div>
                            {p.target && (
                              <div className="text-[11px] text-slate-500 font-normal truncate mt-0.5" title={`เป้าหมาย: ${p.target}`}>
                                เป้าหมาย: {p.target}
                              </div>
                            )}
                          </td>

                          {/* 6. หน่วยงานรับผิดชอบ */}
                          <td className="py-2 px-2.5 text-center text-slate-700 truncate" title={p.department}>
                            {p.department || '-'}
                          </td>

                          {/* 7. งบประมาณ */}
                          <td className="py-2 px-2.5 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                            ฿{getProjectBudget(p).toLocaleString()}
                          </td>

                          {/* 8. สถานะ */}
                          <td className="py-2 px-2.5 w-20 text-center whitespace-nowrap">
                            {p.executionStatus === 'completed' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0]">
                                <Check className="w-2.5 h-2.5" />
                                <span>เสร็จสิ้น</span>
                              </span>
                            ) : p.executionStatus === 'in_progress' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#fffbeb] text-[#d97706] border border-[#fde68a]">
                                <Clock className="w-2.5 h-2.5" />
                                <span>กำลังทำ</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#fff1f2] text-[#e11d48] border border-[#fecdd3]">
                                <span className="inline-block w-2 h-2 rounded-full border-2 border-dotted border-[#e11d48]" />
                                <span>ไม่ทำ</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
