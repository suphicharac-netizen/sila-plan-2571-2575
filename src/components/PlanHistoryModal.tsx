import React, { useState, useMemo } from 'react';
import {
  X,
  Clock,
  History,
  GitCompare,
  FileText,
  Table2,
  Plus,
  Printer,
  Calendar,
  CheckCircle2,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { ProjectData, PlanEdition } from '../types';

interface PlanHistoryModalProps {
  project: ProjectData | null;
  onClose: () => void;
  onOpenNewChange?: (project: ProjectData) => void;
}

interface ProjectVersionItem {
  id: string;
  versionNumber: number;
  editionName: string;
  editionType: PlanEdition;
  editionBadge: string;
  isInitial: boolean;
  date: string;
  approvedDate: string;
  approvalOrderNo: string;
  reason: string;
  changeSummary: string;
  name: string;
  objective: string;
  target: string;
  budgetByYear: {
    '2571'?: number;
    '2572'?: number;
    '2573'?: number;
    '2574'?: number;
    '2575'?: number;
  };
  budgetTotal: number;
  expectedResults: string;
  department: string;
}

export const PlanHistoryModal: React.FC<PlanHistoryModalProps> = ({
  project,
  onClose,
  onOpenNewChange
}) => {
  if (!project) return null;

  // Comparison toggle mode: 'previous' (ฉบับก่อนหน้า) or 'initial' (ฉบับตั้งต้น)
  const [compareMode, setCompareMode] = useState<'previous' | 'initial'>('previous');
  const [selectedVersionId, setSelectedVersionId] = useState<string>('v-initial');

  // Build versions list for this project
  const versions: ProjectVersionItem[] = useMemo(() => {
    const list: ProjectVersionItem[] = [];

    // 1. Initial Version (ฉบับตั้งต้น / ฉบับแรก)
    const initialBudgetByYear =
      project.edition === 'first'
        ? project.budgetByYear || { '2571': project.budgetPlan || 500000 }
        : project.originalBudgetByYear || {
            '2571': project.originalBudgetPlan || project.budgetPlan || 500000
          };

    const initialTotal =
      project.edition === 'first'
        ? project.budgetPlan || 500000
        : project.originalBudgetPlan || project.budgetPlan || 500000;

    const vInitial: ProjectVersionItem = {
      id: 'v-initial',
      versionNumber: 1,
      editionName: 'ฉบับแรก',
      editionType: 'first',
      editionBadge: 'ฉบับแรก',
      isInitial: true,
      date: project.approvedDate || '2569-09-01',
      approvedDate: project.approvedDate || '2569-09-01',
      approvalOrderNo: project.approvalOrderNo || 'ประกาศใช้แผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575)',
      reason:
        project.reason ||
        'จัดทำแผนพัฒนาท้องถิ่น 5 ปี ตามระเบียบกระทรวงมหาดไทยฯ',
      changeSummary: 'บรรจุในแผนพัฒนาท้องถิ่นฉบับแรก (ตั้งต้น)',
      name:
        project.edition === 'first'
          ? project.name
          : project.originalProjectName || project.name,
      objective:
        (project.edition === 'first'
          ? project.objective
          : project.originalObjective) ||
        project.objective ||
        'เพื่ออำนวยความสะดวก',
      target:
        (project.edition === 'first'
          ? project.target
          : project.originalTarget) ||
        project.target ||
        'ก่อสร้างถนน กว้าง4 เมตร ยาว 15 เมตร',
      budgetByYear: initialBudgetByYear,
      budgetTotal: initialTotal,
      expectedResults: project.expectedResults || 'ประชาชนสัญจรได้',
      department: project.department || 'กองช่าง'
    };

    list.push(vInitial);

    // 2. If the current project is a changed / amended / additional edition, add it as subsequent version
    if (project.edition !== 'first') {
      let editionLabel = 'ฉบับเปลี่ยนแปลง ครั้งที่ 1';
      let badgeLabel = 'ฉบับเปลี่ยนแปลง';
      let summary = 'เปลี่ยนแปลงแบบรูปรายการและปรับแผนงบประมาณ';

      if (project.edition === 'amended') {
        editionLabel = `ฉบับแก้ไข ครั้งที่ ${project.editionNumber || 1}`;
        badgeLabel = 'ฉบับแก้ไข';
        summary = 'แก้ไขรายละเอียดเป้าหมายและข้อความโครงการ';
      } else if (project.edition === 'additional') {
        editionLabel = `ฉบับเพิ่มเติม ครั้งที่ ${project.editionNumber || 1}`;
        badgeLabel = 'ฉบับเพิ่มเติม';
        summary = 'บรรจุโครงการเพิ่มเติมตามความต้องการของประชาชน';
      } else if (project.edition === 'changed') {
        editionLabel = `ฉบับเปลี่ยนแปลง ครั้งที่ ${project.editionNumber || 1}`;
        badgeLabel = 'ฉบับเปลี่ยนแปลง';
        summary = 'เปลี่ยนแปลงแบบรูปรายการและงบประมาณให้สอดคล้องกับสภาพพื้นที่จริง';
      }

      const vCurrent: ProjectVersionItem = {
        id: 'v-current',
        versionNumber: 2,
        editionName: editionLabel,
        editionType: project.edition,
        editionBadge: badgeLabel,
        isInitial: false,
        date: project.approvedDate || '2569-09-02',
        approvedDate: project.approvedDate || '2569-09-02',
        approvalOrderNo:
          project.approvalOrderNo ||
          `ประกาศเทศบาลเมืองศิลา เรื่อง ${badgeLabel}แผนพัฒนาท้องถิ่น`,
        reason:
          project.reason ||
          project.note ||
          'ปรับปรุงรายการเพื่อให้ตรงตามวัตถุประสงค์และสภาพแวดล้อมปัจจุบัน',
        changeSummary: summary,
        name: project.name,
        objective: project.objective || 'เพื่ออำนวยความสะดวก',
        target: project.target || 'ก่อสร้างถนน กว้าง4 เมตร ยาว 15 เมตร',
        budgetByYear: project.budgetByYear || {},
        budgetTotal: project.budgetPlan || 0,
        expectedResults: project.expectedResults || 'ประชาชนสัญจรได้',
        department: project.department || 'กองช่าง'
      };

      list.push(vCurrent);
    }

    return list;
  }, [project]);

  // Selected Version to view
  const currentVersion = useMemo(() => {
    return versions.find((v) => v.id === selectedVersionId) || versions[0];
  }, [versions, selectedVersionId]);

  // Find previous or initial version for diff comparison
  const { beforeVersion, beforeLabel, afterLabel } = useMemo(() => {
    if (currentVersion.isInitial) {
      return {
        beforeVersion: null,
        beforeLabel: 'ฉบับก่อนหน้า',
        afterLabel: 'ฉบับแรก'
      };
    }

    if (compareMode === 'initial') {
      const initialVer = versions.find((v) => v.isInitial) || null;
      return {
        beforeVersion: initialVer,
        beforeLabel: 'ฉบับตั้งต้น',
        afterLabel: currentVersion.editionName
      };
    }

    // Default 'previous'
    const currentIndex = versions.findIndex((v) => v.id === currentVersion.id);
    const prev = currentIndex > 0 ? versions[currentIndex - 1] : null;
    return {
      beforeVersion: prev,
      beforeLabel: prev ? prev.editionName : 'ฉบับก่อนหน้า',
      afterLabel: currentVersion.editionName
    };
  }, [currentVersion, compareMode, versions]);

  // Budget difference calculation
  const budgetDiff = useMemo(() => {
    const after = currentVersion.budgetTotal;
    const before = beforeVersion ? beforeVersion.budgetTotal : 0;
    return after - before;
  }, [currentVersion, beforeVersion]);

  const handlePrint = () => {
    window.print();
  };

  // Helper formatting for budget difference badge
  const renderDiffBadge = () => {
    if (budgetDiff > 0) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span>ผลต่างงบประมาณ:</span>
          <span className="font-mono">↗ +{budgetDiff.toLocaleString()} บาท (เพิ่มขึ้น)</span>
        </span>
      );
    }
    if (budgetDiff < 0) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
          <span>ผลต่างงบประมาณ:</span>
          <span className="font-mono">↘ -{Math.abs(budgetDiff).toLocaleString()} บาท (ลดลง)</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
        <span>ผลต่างงบประมาณ:</span>
        <span className="font-mono">คงเดิม (0 บาท)</span>
      </span>
    );
  };

  const yearsList = ['2571', '2572', '2573', '2574', '2575'] as const;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* =========================================================================
            1. MODAL HEADER (Dark Pine Green)
        ========================================================================= */}
        <div className="bg-[#0f2922] text-white px-5 py-3 sm:px-6 flex items-center justify-between border-b border-[#0a211b] shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Square Emerald History Icon */}
            <div className="w-11 h-11 rounded-xl bg-[#0b3d30] border border-emerald-600/30 flex items-center justify-center text-emerald-300 shrink-0 shadow-xs">
              <History className="w-5 h-5" />
            </div>

            <div className="min-w-0">
              {/* Badges Row */}
              <div className="flex items-center flex-wrap gap-2 text-xs">
                <span className="bg-[#063f31] text-emerald-300 border border-emerald-700/50 px-2.5 py-0.5 rounded-full font-medium">
                  โครงการ #{project.orderNumber || 3}
                </span>

                <span className="bg-blue-600 text-white px-2.5 py-0.5 rounded-full font-medium shadow-2xs">
                  {project.edition === 'first'
                    ? 'ฉบับแรก'
                    : project.edition === 'changed'
                    ? 'ฉบับเปลี่ยนแปลง'
                    : project.edition === 'amended'
                    ? 'ฉบับแก้ไข'
                    : 'ฉบับเพิ่มเติม'}
                </span>

                <span className="text-slate-300 font-light text-[11px] sm:text-xs">
                  (มีประวัติการปรับปรุง {versions.length} ฉบับ)
                </span>
              </div>

              {/* Title */}
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide mt-1 truncate">
                {project.name}
              </h2>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 shrink-0 ml-3">
            {/* + บันทึกการเปลี่ยนแปลง/แก้ไขใหม่ */}
            <button
              type="button"
              onClick={() => {
                if (onOpenNewChange) {
                  onOpenNewChange(project);
                } else {
                  alert(
                    `บันทึกการเปลี่ยนแปลง/แก้ไขสำหรับ ${project.name}\nท่านสามารถใช้ฟังก์ชัน "แก้ไข/เปลี่ยนแปลงโครงการ" ในระบบเพื่อสร้างฉบับใหม่ได้`
                  );
                }
              }}
              className="hidden sm:inline-flex items-center gap-1.5 bg-[#007a5e] hover:bg-[#006853] text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>บันทึกการเปลี่ยนแปลง/แก้ไขใหม่</span>
            </button>

            {/* Print Icon Button */}
            <button
              type="button"
              title="พิมพ์เอกสาร"
              onClick={handlePrint}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* Close (X) Icon Button */}
            <button
              type="button"
              title="ปิดหน้าต่าง"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* =========================================================================
            2. MODAL BODY (Scrollable)
        ========================================================================= */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4 bg-white text-slate-800">
          {/* SECTION 1: ลำดับไทม์ไลน์และประวัติการเปลี่ยนแปลง/แก้ไข (Version History) */}
          <section className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800 text-sm">
                <Clock className="w-4 h-4 text-slate-500" />
                <span>ลำดับไทม์ไลน์และประวัติการเปลี่ยนแปลง/แก้ไข (Version History)</span>
              </div>
              <span className="text-slate-400 hidden sm:inline text-xs">
                คลิกเลือกฉบับเพื่อดูรายละเอียดและเปรียบเทียบ
              </span>
            </div>

            {/* Timeline Cards Row */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-3">
              {versions.map((ver) => {
                const isSelected = ver.id === currentVersion.id;

                return (
                  <div key={ver.id} className="relative shrink-0">
                    {/* Floating top badge for Initial Version */}
                    {ver.isInitial && (
                      <span className="absolute -top-2.5 right-4 bg-[#0284c7] text-white text-[10px] font-medium px-2 py-0.5 rounded-full shadow-xs z-10">
                        ฉบับตั้งต้น
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => setSelectedVersionId(ver.id)}
                      className={`w-[210px] sm:w-[220px] rounded-xl p-3.5 text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-2 border-emerald-500 bg-white shadow-xs'
                          : 'border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-slate-300'
                      }`}
                    >
                      {/* Top row in card: Edition Badge + Name */}
                      <div className="flex items-center gap-2">
                        <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-md font-semibold">
                          {ver.editionBadge}
                        </span>
                        <span className="text-xs font-semibold text-slate-800 truncate">
                          {ver.editionName}
                        </span>
                      </div>

                      {/* Date */}
                      <div className="text-xs text-slate-500 mt-2.5 flex items-center gap-1.5">
                        <span>📅</span>
                        <span>{ver.date}</span>
                      </div>

                      {/* Budget */}
                      <div className="flex items-center justify-between text-xs text-slate-600 mt-2.5 pt-2 border-t border-slate-100">
                        <span>งบรวม:</span>
                        <span className="font-bold text-slate-900 font-mono">
                          {ver.budgetTotal.toLocaleString()} บ.
                        </span>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          {/* SECTION 2: เปรียบเทียบการเปลี่ยนแปลง (Diff controls) */}
          <section className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1 border-t border-slate-100">
            <div className="flex items-center flex-wrap gap-2.5">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                <GitCompare className="w-4 h-4 text-emerald-600" />
                <span>เปรียบเทียบการเปลี่ยนแปลง:</span>
              </div>

              {/* Toggle Buttons */}
              <div className="inline-flex rounded-lg p-0.5 bg-slate-100 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setCompareMode('previous')}
                  className={`px-3 py-1 rounded-md text-xs transition-colors cursor-pointer ${
                    compareMode === 'previous'
                      ? 'bg-white text-slate-800 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  เทียบกับฉบับก่อนหน้า
                </button>
                <button
                  type="button"
                  onClick={() => setCompareMode('initial')}
                  className={`px-3 py-1 rounded-md text-xs transition-colors cursor-pointer ${
                    compareMode === 'initial'
                      ? 'bg-white text-slate-800 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  เทียบกับฉบับตั้งต้น
                </button>
              </div>
            </div>

            {/* Difference Badge */}
            <div>{renderDiffBadge()}</div>
          </section>

          {/* SECTION 3: ข้อมูลการอนุมัติและเหตุผลความจำเป็น (Warm Yellow / Amber Box) */}
          <section className="bg-[#fffdf5] border border-amber-200 rounded-xl p-4 text-xs space-y-3 shadow-2xs">
            {/* Header row */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200/60 pb-2.5">
              <div className="flex items-center gap-2 text-amber-900 font-bold">
                <FileText className="w-4 h-4 text-amber-600" />
                <span>ข้อมูลการอนุมัติและเหตุผลความจำเป็น — {currentVersion.editionName}</span>
              </div>

              <div className="text-amber-800 font-medium text-xs">
                <span>วันที่อนุมัติ: </span>
                <span className="font-semibold">{currentVersion.approvedDate}</span>
                <span className="mx-2">|</span>
                <span>มติ/คำสั่ง: </span>
                <span className="font-semibold">{currentVersion.approvalOrderNo}</span>
              </div>
            </div>

            {/* Reason input display */}
            <div>
              <div className="font-semibold text-amber-900 mb-1">
                เหตุผลและความจำเป็นในการเปลี่ยนแปลง/แก้ไข:
              </div>
              <div className="bg-white border border-amber-200 rounded-lg p-2.5 text-slate-800 leading-relaxed font-normal">
                {currentVersion.reason}
              </div>
            </div>

            {/* Summary bullet points */}
            <div>
              <div className="font-semibold text-amber-900 mb-1">
                สรุปจุดสำคัญที่มีการเปลี่ยนแปลง:
              </div>
              <div className="text-slate-800 font-normal pl-1">
                • {currentVersion.changeSummary}
              </div>
            </div>
          </section>

          {/* SECTION 4: ตารางเปรียบเทียบรายละเอียดโครงการ (เดิม → ใหม่) */}
          <section className="space-y-0 shadow-2xs rounded-xl overflow-hidden border border-slate-200">
            {/* Navy Header Bar */}
            <div className="bg-[#1e293b] text-white px-4 py-2.5 flex items-center justify-between text-xs font-medium">
              <div className="flex items-center gap-2">
                <Table2 className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold text-white">
                  ตารางเปรียบเทียบรายละเอียดโครงการ (เดิม → ใหม่)
                </span>
              </div>
              <div className="text-slate-300 text-xs">
                เปรียบเทียบ:{' '}
                <span className="text-slate-300 font-medium">{beforeLabel} → </span>
                <span className="text-emerald-400 font-semibold">{afterLabel}</span>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto bg-white">
              <table className="w-full border-collapse text-xs text-slate-700">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                    <th className="py-2.5 px-4 text-left w-48 border-r border-slate-200">
                      หัวข้อข้อมูล
                    </th>
                    <th className="py-2.5 px-4 text-left w-1/2 border-r border-slate-200">
                      <div className="flex items-center">
                        <span>โครงการเดิม (ก่อนการปรับปรุง)</span>
                        <span className="ml-2 bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-normal">
                          Before
                        </span>
                      </div>
                    </th>
                    <th className="py-2.5 px-4 text-left w-1/2">
                      <div className="flex items-center">
                        <span>โครงการที่เปลี่ยนแปลง / แก้ไข</span>
                        <span className="ml-2 bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                          After (ใหม่)
                        </span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* 1. ชื่อโครงการ */}
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-4 font-semibold text-slate-800 bg-slate-50/40 border-r border-slate-200 align-top">
                      <div className="flex items-center gap-1.5">
                        <span>1. ชื่อโครงการ</span>
                        <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5 rounded font-medium">
                          แก้ไข
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 border-r border-slate-200 align-top">
                      {beforeVersion ? (
                        <span className="font-medium text-slate-800">{beforeVersion.name}</span>
                      ) : (
                        <span className="text-slate-400 italic">- ไม่มีข้อมูลเดิม -</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900 align-top">
                      {currentVersion.name}
                    </td>
                  </tr>

                  {/* 2. วัตถุประสงค์ */}
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-4 font-semibold text-slate-800 bg-slate-50/40 border-r border-slate-200 align-top">
                      <div className="flex items-center gap-1.5">
                        <span>2. วัตถุประสงค์</span>
                        <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5 rounded font-medium">
                          แก้ไข
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 border-r border-slate-200 align-top">
                      {beforeVersion?.objective || '-'}
                    </td>
                    <td className="py-2.5 px-4 text-slate-800 align-top">
                      {currentVersion.objective || '-'}
                    </td>
                  </tr>

                  {/* 3. เป้าหมาย (ผลผลิตของโครงการ) */}
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-4 font-semibold text-slate-800 bg-slate-50/40 border-r border-slate-200 align-top">
                      <div className="flex items-center gap-1.5">
                        <span>3. เป้าหมาย (ผลผลิตของโครงการ)</span>
                        <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5 rounded font-medium">
                          แก้ไข
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 border-r border-slate-200 align-top">
                      {beforeVersion?.target || '-'}
                    </td>
                    <td className="py-2.5 px-4 text-slate-800 align-top">
                      {currentVersion.target || '-'}
                    </td>
                  </tr>

                  {/* 4. งบประมาณรายปี (พ.ศ. 2571 - 2575) Nested Subtable */}
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-4 font-semibold text-slate-800 bg-slate-50/40 border-r border-slate-200 align-top">
                      <span>4. งบประมาณรายปี (พ.ศ. 2571 - 2575)</span>
                    </td>
                    <td colSpan={2} className="p-0 align-top">
                      <table className="w-full border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-600 font-semibold">
                            <th className="py-1.5 px-3 text-left w-24">ปี พ.ศ.</th>
                            <th className="py-1.5 px-3 text-right">เดิม (บาท)</th>
                            <th className="py-1.5 px-3 text-right">ใหม่ (บาท)</th>
                            <th className="py-1.5 px-3 text-right">ผลต่าง (+/-)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {yearsList.map((yr) => {
                            const beforeAmount = beforeVersion?.budgetByYear?.[yr];
                            const afterAmount = currentVersion.budgetByYear?.[yr];
                            const diff = (afterAmount || 0) - (beforeAmount || 0);

                            return (
                              <tr key={yr} className="hover:bg-slate-50/40">
                                <td className="py-1.5 px-3 font-semibold text-slate-700">
                                  {yr}
                                </td>
                                <td className="py-1.5 px-3 text-right text-slate-600 font-mono">
                                  {beforeAmount !== undefined && beforeAmount > 0
                                    ? beforeAmount.toLocaleString()
                                    : '-'}
                                </td>
                                <td className="py-1.5 px-3 text-right font-bold text-slate-900 font-mono">
                                  {afterAmount !== undefined && afterAmount > 0
                                    ? afterAmount.toLocaleString()
                                    : '-'}
                                </td>
                                <td className="py-1.5 px-3 text-right font-mono">
                                  {diff > 0 ? (
                                    <span className="text-emerald-600 font-bold">
                                      +{diff.toLocaleString()}
                                    </span>
                                  ) : diff < 0 ? (
                                    <span className="text-red-600 font-bold">
                                      -{Math.abs(diff).toLocaleString()}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400">คงเดิม</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}

                          {/* Summary row (รวม 5 ปี) */}
                          <tr className="bg-slate-50 font-semibold border-t border-slate-200">
                            <td className="py-2 px-3 text-slate-900">รวม 5 ปี</td>
                            <td className="py-2 px-3 text-right text-slate-700 font-mono">
                              {beforeVersion && beforeVersion.budgetTotal > 0
                                ? beforeVersion.budgetTotal.toLocaleString()
                                : '-'}
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-slate-900 font-mono">
                              {currentVersion.budgetTotal > 0
                                ? currentVersion.budgetTotal.toLocaleString()
                                : '-'}
                            </td>
                            <td className="py-2 px-3 text-right font-mono">
                              {budgetDiff > 0 ? (
                                <span className="text-emerald-600 font-bold">
                                  +{budgetDiff.toLocaleString()}
                                </span>
                              ) : budgetDiff < 0 ? (
                                <span className="text-red-600 font-bold">
                                  -{Math.abs(budgetDiff).toLocaleString()}
                                </span>
                              ) : (
                                <span className="text-slate-400">คงเดิม</span>
                              )}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>

                  {/* 5. ผลที่คาดว่าจะได้รับ */}
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-4 font-semibold text-slate-800 bg-slate-50/40 border-r border-slate-200 align-top">
                      <div className="flex items-center gap-1.5">
                        <span>5. ผลที่คาดว่าจะได้รับ</span>
                        <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5 rounded font-medium">
                          แก้ไข
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 border-r border-slate-200 align-top">
                      {beforeVersion?.expectedResults || '-'}
                    </td>
                    <td className="py-2.5 px-4 text-slate-800 align-top">
                      {currentVersion.expectedResults || '-'}
                    </td>
                  </tr>

                  {/* 6. หน่วยงานรับผิดชอบหลัก */}
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-4 font-semibold text-slate-800 bg-slate-50/40 border-r border-slate-200 align-top">
                      <div className="flex items-center gap-1.5">
                        <span>6. หน่วยงานรับผิดชอบหลัก</span>
                        <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5 rounded font-medium">
                          แก้ไข
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 border-r border-slate-200 align-top">
                      {beforeVersion?.department || '-'}
                    </td>
                    <td className="py-2.5 px-4 text-slate-800 align-top">
                      {currentVersion.department || '-'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* =========================================================================
            3. MODAL FOOTER
        ========================================================================= */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shrink-0">
          <div className="text-slate-500 text-center sm:text-left">
            ระบบบันทึกประวัติการเปลี่ยนแปลงและแก้ไขแผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575) |
            เทศบาลเมืองศิลา
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>พิมพ์บัญชีเปรียบเทียบ</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="bg-[#1e293b] hover:bg-slate-800 text-white font-medium px-5 py-1.5 rounded-lg transition-colors cursor-pointer shadow-2xs"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
