import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Clock,
  History,
  GitCompare,
  FileText,
  Table2,
  Printer,
  Calendar,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Tag,
  Layers,
  Edit3,
  Check
} from 'lucide-react';
import { ProjectData, PlanEdition, UserAccount } from '../types';

interface PlanHistoryModalProps {
  project: ProjectData | null;
  allProjects?: ProjectData[];
  onClose: () => void;
  onOpenNewChange?: (project: ProjectData) => void;
  currentUser?: UserAccount | null;
  isPublic?: boolean;
}

export interface ProjectVersionItem {
  id: string;
  versionNumber: number;
  editionType: PlanEdition; // 'first' | 'additional' | 'changed' | 'amended'
  editionNumber?: number;
  editionName: string;
  editionBadge: string;
  originTag?: string;
  isOrigin: boolean;
  isInitial: boolean; // Alias for backward compatibility
  date: string;
  approvedDate: string;
  approvalOrderNo: string;
  reason: string;
  changeSummary: string;
  name: string;
  planStrategy?: string;
  planCategory?: string;
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
  budgetSource?: string;
  expectedResults: string;
  department: string;
  zone?: string;
  village?: string;
  originalProjectId?: string;
  year?: string;
}

export const PlanHistoryModal: React.FC<PlanHistoryModalProps> = ({
  project,
  allProjects = [],
  onClose,
  onOpenNewChange,
  currentUser,
  isPublic = false
}) => {
  const isPublicViewer = Boolean(isPublic || currentUser?.role === 'public');

  // Comparison toggle mode: 'previous' (ฉบับก่อนหน้า) or 'initial' (ฉบับตั้งต้น)
  const [compareMode, setCompareMode] = useState<'previous' | 'initial'>('previous');
  const [selectedVersionId, setSelectedVersionId] = useState<string>('');

  const yearsList = ['2571', '2572', '2573', '2574', '2575'] as const;

  // ---------------------------------------------------------------------------
  // 1. Version Construction Logic according to Local Plan Regulations
  //    - Origin: 'first' (ฉบับแรก) or 'additional' (ฉบับเพิ่มเติม)
  //    - Modifications: 'changed' (ฉบับเปลี่ยนแปลง ข้อ 22/1) or 'amended' (ฉบับแก้ไข ข้อ 21)
  // ---------------------------------------------------------------------------
  const versions: ProjectVersionItem[] = useMemo(() => {
    if (!project) return [];
    const list: ProjectVersionItem[] = [];

    const isProjectOrigin = project.edition === 'first' || project.edition === 'additional';

    if (isProjectOrigin) {
      // Current project is an Origin Version (ฉบับตั้งต้นกำเนิดโครงการ)
      const originYear = project.year || '2571';
      const originBadge =
        project.edition === 'first'
          ? 'บรรจุครั้งแรกในฉบับแรก'
          : `เพิ่มเติม ครั้งที่ ${project.editionNumber || 1}/${originYear}`;

      const originName =
        project.edition === 'first'
          ? 'ฉบับแรก (พ.ศ. 2571-2575)'
          : `เพิ่มเติม ครั้งที่ ${project.editionNumber || 1}/${originYear}`;

      const originItem: ProjectVersionItem = {
        id: `ver-origin-${project.id}`,
        versionNumber: 1,
        editionType: project.edition,
        editionNumber: project.editionNumber || 1,
        editionName: originName,
        editionBadge: originBadge,
        originTag: originBadge,
        isOrigin: true,
        isInitial: true,
        year: originYear,
        date: project.approvedDate && project.approvedDate !== '-' ? project.approvedDate : '2569-09-01',
        approvedDate: project.approvedDate || '2569-09-01',
        approvalOrderNo:
          project.approvalOrderNo ||
          (project.edition === 'first'
            ? 'ประกาศใช้แผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575)'
            : `ประกาศใช้แผนพัฒนาท้องถิ่น ฉบับเพิ่มเติม ครั้งที่ ${project.editionNumber || 1}`),
        reason:
          project.reason ||
          (project.edition === 'first'
            ? 'จัดทำแผนพัฒนาท้องถิ่น 5 ปี ตามระเบียบกระทรวงมหาดไทยฯ'
            : 'บรรจุโครงการใหม่ตามระเบียบ มท. ว่าด้วยการจัดทำแผนพัฒนาของ อปท. (ฉบับเพิ่มเติม)'),
        changeSummary:
          project.edition === 'first'
            ? 'บรรจุครั้งแรกในแผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575)'
            : `บรรจุโครงการใหม่ในแผนพัฒนาท้องถิ่น (ฉบับเพิ่มเติม ครั้งที่ ${project.editionNumber || 1})`,
        name: project.name,
        planStrategy: project.planStrategy,
        planCategory: project.planCategory,
        objective: project.objective || '-',
        target: project.target || '-',
        budgetByYear: project.budgetByYear || { '2571': project.budgetPlan || 0 },
        budgetTotal: project.budgetPlan || 0,
        budgetSource: project.budgetSource || 'เทศบาลเมืองศิลา',
        expectedResults: project.expectedResults || '-',
        department: project.department || '-',
        zone: project.zone,
        village: project.village,
        originalProjectId: project.originalProjectId
      };

      list.push(originItem);

      // Search for subsequent modification projects in allProjects (changed / amended)
      const childModifications = allProjects.filter(
        (p) =>
          p.originalProjectId === project.id &&
          (p.edition === 'changed' || p.edition === 'amended')
      );

      // Sort by orderNumber or editionNumber
      childModifications.sort((a, b) => (a.editionNumber || 0) - (b.editionNumber || 0) || a.orderNumber - b.orderNumber);

      childModifications.forEach((child, idx) => {
        const modBadge =
          child.edition === 'changed'
            ? 'ฉบับเปลี่ยนแปลง (ข้อ 22/1)'
            : 'ฉบับแก้ไข (ข้อ 21)';
        const modName =
          child.edition === 'changed'
            ? `ฉบับเปลี่ยนแปลง ครั้งที่ ${child.editionNumber || 1}`
            : `ฉบับแก้ไข ครั้งที่ ${child.editionNumber || 1}`;

        list.push({
          id: `ver-mod-${child.id}`,
          versionNumber: idx + 2,
          editionType: child.edition,
          editionNumber: child.editionNumber || 1,
          editionName: modName,
          editionBadge: modBadge,
          originTag: originBadge,
          isOrigin: false,
          isInitial: false,
          date: child.approvedDate && child.approvedDate !== '-' ? child.approvedDate : '2569-09-02',
          approvedDate: child.approvedDate || '2569-09-02',
          approvalOrderNo:
            child.approvalOrderNo ||
            `ประกาศเทศบาลเมืองศิลา เรื่อง ${modBadge}`,
          reason:
            child.reason ||
            child.note ||
            (child.edition === 'changed'
              ? 'เปลี่ยนแปลงแบบรูปรายการ/งบประมาณ ตามระเบียบฯ ข้อ 22/1'
              : 'แก้ไขข้อความ/คำผิด และปรับปรุงรายละเอียดให้ถูกต้อง ตามระเบียบฯ ข้อ 21'),
          changeSummary:
            child.note ||
            (child.edition === 'changed'
              ? 'เปลี่ยนแปลงแบบรูปรายการและปรับแผนงบประมาณให้สอดคล้องกับสภาพพื้นที่จริง'
              : 'แก้ไขรายละเอียดเป้าหมายและข้อความโครงการ'),
          name: child.name,
          planStrategy: child.planStrategy || project.planStrategy,
          planCategory: child.planCategory || project.planCategory,
          objective: child.objective || project.objective || '-',
          target: child.target || project.target || '-',
          budgetByYear: child.budgetByYear || {},
          budgetTotal: child.budgetPlan || 0,
          budgetSource: child.budgetSource || project.budgetSource || 'เทศบาลเมืองศิลา',
          expectedResults: child.expectedResults || project.expectedResults || '-',
          department: child.department || project.department || '-',
          zone: child.zone || project.zone,
          village: child.village || project.village,
          originalProjectId: child.originalProjectId
        });
      });
    } else {
      // Current project is a Modification Version ('changed' or 'amended')
      // Find its origin project from allProjects or reconstruct from original* fields
      const originPrj = allProjects.find(
        (p) => p.id === project.originalProjectId && (p.edition === 'first' || p.edition === 'additional')
      );

      const originEdition: PlanEdition = originPrj?.edition || (project.originalEdition as PlanEdition) || 'first';
      const originEditionNum = originPrj?.editionNumber || 1;

      const originYear = originPrj?.year || project.year || '2571';
      const originBadge =
        originEdition === 'first'
          ? 'บรรจุครั้งแรกในฉบับแรก'
          : `เพิ่มเติม ครั้งที่ ${originEditionNum}/${originYear}`;

      const originName =
        originEdition === 'first'
          ? 'ฉบับแรก (พ.ศ. 2571-2575)'
          : `เพิ่มเติม ครั้งที่ ${originEditionNum}/${originYear}`;

      const initialBudgetByYear =
        originPrj?.budgetByYear ||
        project.originalBudgetByYear || {
          '2571': originPrj?.budgetPlan || project.originalBudgetPlan || project.budgetPlan || 500000
        };

      const initialTotal =
        originPrj?.budgetPlan || project.originalBudgetPlan || project.budgetPlan || 500000;

      const originItem: ProjectVersionItem = {
        id: originPrj ? `ver-origin-${originPrj.id}` : 'ver-origin-reconstructed',
        versionNumber: 1,
        editionType: originEdition,
        editionNumber: originEditionNum,
        editionName: originName,
        editionBadge: originBadge,
        originTag: originBadge,
        isOrigin: true,
        isInitial: true,
        year: originYear,
        date: originPrj?.approvedDate || project.originalApprovedDate || '2569-09-01',
        approvedDate: originPrj?.approvedDate || project.originalApprovedDate || '2569-09-01',
        approvalOrderNo:
          originPrj?.approvalOrderNo ||
          (originEdition === 'first'
            ? 'ประกาศใช้แผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575)'
            : `ประกาศใช้แผนพัฒนาท้องถิ่น ฉบับเพิ่มเติม ครั้งที่ ${originEditionNum}`),
        reason:
          originPrj?.reason ||
          (originEdition === 'first'
            ? 'จัดทำแผนพัฒนาท้องถิ่น 5 ปี ตามระเบียบกระทรวงมหาดไทยฯ'
            : 'บรรจุโครงการใหม่ตามระเบียบ มท. ว่าด้วยการจัดทำแผนพัฒนาของ อปท. (ฉบับเพิ่มเติม)'),
        changeSummary:
          originEdition === 'first'
            ? 'บรรจุครั้งแรกในแผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575)'
            : `บรรจุโครงการใหม่ในแผนพัฒนาท้องถิ่น (ฉบับเพิ่มเติม ครั้งที่ ${originEditionNum})`,
        name: originPrj?.name || project.originalProjectName || project.name,
        planStrategy: originPrj?.planStrategy || project.originalPlanStrategy || project.planStrategy,
        planCategory: originPrj?.planCategory || project.planCategory,
        objective: originPrj?.objective || project.originalObjective || project.objective || '-',
        target: originPrj?.target || project.originalTarget || project.target || '-',
        budgetByYear: initialBudgetByYear,
        budgetTotal: initialTotal,
        budgetSource: originPrj?.budgetSource || project.budgetSource || 'เทศบาลเมืองศิลา',
        expectedResults: originPrj?.expectedResults || project.originalExpectedResults || project.expectedResults || '-',
        department: originPrj?.department || project.originalDepartment || project.department || '-',
        zone: originPrj?.zone || project.zone,
        village: originPrj?.village || project.village,
        originalProjectId: originPrj?.id
      };

      list.push(originItem);

      // Find all sibling modifications for this origin project (including this project)
      const siblingModifications = allProjects.filter(
        (p) =>
          p.originalProjectId === (project.originalProjectId || originPrj?.id) &&
          (p.edition === 'changed' || p.edition === 'amended')
      );

      // Make sure the current project is included even if not in allProjects list
      if (!siblingModifications.some((p) => p.id === project.id)) {
        siblingModifications.push(project);
      }

      siblingModifications.sort((a, b) => (a.editionNumber || 0) - (b.editionNumber || 0) || a.orderNumber - b.orderNumber);

      siblingModifications.forEach((modPrj, idx) => {
        const modBadge =
          modPrj.edition === 'changed'
            ? 'ฉบับเปลี่ยนแปลง (ข้อ 22/1)'
            : 'ฉบับแก้ไข (ข้อ 21)';
        const modName =
          modPrj.edition === 'changed'
            ? `ฉบับเปลี่ยนแปลง ครั้งที่ ${modPrj.editionNumber || 1}`
            : `ฉบับแก้ไข ครั้งที่ ${modPrj.editionNumber || 1}`;

        list.push({
          id: `ver-mod-${modPrj.id}`,
          versionNumber: idx + 2,
          editionType: modPrj.edition,
          editionNumber: modPrj.editionNumber || 1,
          editionName: modName,
          editionBadge: modBadge,
          originTag: originBadge,
          isOrigin: false,
          isInitial: false,
          date: modPrj.approvedDate && modPrj.approvedDate !== '-' ? modPrj.approvedDate : '2569-09-02',
          approvedDate: modPrj.approvedDate || '2569-09-02',
          approvalOrderNo:
            modPrj.approvalOrderNo ||
            `ประกาศเทศบาลเมืองศิลา เรื่อง ${modBadge}`,
          reason:
            modPrj.reason ||
            modPrj.note ||
            (modPrj.edition === 'changed'
              ? 'เปลี่ยนแปลงแบบรูปรายการ/งบประมาณ ตามระเบียบฯ ข้อ 22/1'
              : 'แก้ไขข้อความ/คำผิด และปรับปรุงรายละเอียดให้ถูกต้อง ตามระเบียบฯ ข้อ 21'),
          changeSummary:
            modPrj.note ||
            (modPrj.edition === 'changed'
              ? 'เปลี่ยนแปลงแบบรูปรายการและปรับแผนงบประมาณให้สอดคล้องกับสภาพพื้นที่จริง'
              : 'แก้ไขรายละเอียดเป้าหมายและข้อความโครงการ'),
          name: modPrj.name,
          planStrategy: modPrj.planStrategy || project.planStrategy,
          planCategory: modPrj.planCategory || project.planCategory,
          objective: modPrj.objective || project.objective || '-',
          target: modPrj.target || project.target || '-',
          budgetByYear: modPrj.budgetByYear || {},
          budgetTotal: modPrj.budgetPlan || 0,
          budgetSource: modPrj.budgetSource || project.budgetSource || 'เทศบาลเมืองศิลา',
          expectedResults: modPrj.expectedResults || project.expectedResults || '-',
          department: modPrj.department || project.department || '-',
          zone: modPrj.zone || project.zone,
          village: modPrj.village || project.village,
          originalProjectId: modPrj.originalProjectId
        });
      });
    }

    return list;
  }, [project, allProjects]);

  // Set default selected version when opened
  useEffect(() => {
    if (versions.length > 0) {
      if (project?.edition === 'first' || project?.edition === 'additional') {
        // Origin project -> select the origin version
        setSelectedVersionId(versions[0].id);
      } else {
        // Modification project -> select its specific version node
        const target = versions.find((v) => v.id === `ver-mod-${project?.id}`) || versions[versions.length - 1];
        setSelectedVersionId(target.id);
      }
    }
  }, [versions, project]);

  // Currently selected version
  const currentVersion = useMemo(() => {
    return versions.find((v) => v.id === selectedVersionId) || versions[0] || ({} as ProjectVersionItem);
  }, [versions, selectedVersionId]);

  // Find origin version
  const originVersion = useMemo(() => {
    return versions.find((v) => v.isOrigin) || versions[0] || null;
  }, [versions]);

  // Dynamic label for change type (เปลี่ยนแปลง / แก้ไข)
  const changeTypeLabel = useMemo(() => {
    if (currentVersion.editionType === 'amended') return 'แก้ไข (ข้อ 21)';
    if (currentVersion.editionType === 'changed') return 'เปลี่ยนแปลง (ข้อ 22/1)';
    return 'เปลี่ยนแปลง / แก้ไข';
  }, [currentVersion.editionType]);

  // Find previous or origin version for diff comparison
  const { beforeVersion, beforeLabel, afterLabel } = useMemo(() => {
    if (!currentVersion || currentVersion.isOrigin) {
      return {
        beforeVersion: null,
        beforeLabel: 'ฉบับตั้งต้น',
        afterLabel: currentVersion?.editionName || 'ฉบับตั้งต้น'
      };
    }

    if (compareMode === 'initial') {
      return {
        beforeVersion: originVersion,
        beforeLabel: originVersion?.editionName || 'ฉบับตั้งต้น',
        afterLabel: currentVersion.editionName
      };
    }

    // Default 'previous'
    const currentIndex = versions.findIndex((v) => v.id === currentVersion.id);
    const prev = currentIndex > 0 ? versions[currentIndex - 1] : originVersion;
    return {
      beforeVersion: prev,
      beforeLabel: prev ? prev.editionName : 'ฉบับก่อนหน้า',
      afterLabel: currentVersion.editionName
    };
  }, [currentVersion, compareMode, versions, originVersion]);

  // Budget difference calculation
  const budgetDiff = useMemo(() => {
    if (currentVersion.isOrigin) return 0;
    const after = currentVersion?.budgetTotal || 0;
    const before = beforeVersion ? beforeVersion.budgetTotal : 0;
    return after - before;
  }, [currentVersion, beforeVersion]);

  // List of modified fields between beforeVersion and currentVersion
  const diffSummaryList = useMemo(() => {
    if (currentVersion.isOrigin || !beforeVersion) return [];
    const items: string[] = [];

    if (currentVersion.name.trim() !== beforeVersion.name.trim()) {
      items.push('ชื่อโครงการ');
    }
    if ((currentVersion.objective || '').trim() !== (beforeVersion.objective || '').trim()) {
      items.push('วัตถุประสงค์');
    }
    if ((currentVersion.target || '').trim() !== (beforeVersion.target || '').trim()) {
      items.push('เป้าหมาย (ผลผลิต)');
    }

    // Budget check
    let hasBudgetChange = false;
    let hasYearShift = false;
    yearsList.forEach((yr) => {
      const bAmt = beforeVersion.budgetByYear?.[yr] || 0;
      const aAmt = currentVersion.budgetByYear?.[yr] || 0;
      if (bAmt !== aAmt) {
        hasBudgetChange = true;
        if ((bAmt > 0 && aAmt === 0) || (bAmt === 0 && aAmt > 0)) {
          hasYearShift = true;
        }
      }
    });

    if (hasYearShift) {
      items.push('ย้ายปีดำเนินการ');
    }
    if (hasBudgetChange || currentVersion.budgetTotal !== beforeVersion.budgetTotal) {
      items.push('งบประมาณรายปี');
    }
    if ((currentVersion.expectedResults || '').trim() !== (beforeVersion.expectedResults || '').trim()) {
      items.push('ผลที่คาดว่าจะได้รับ');
    }
    if ((currentVersion.department || '').trim() !== (beforeVersion.department || '').trim()) {
      items.push('หน่วยงานรับผิดชอบหลัก');
    }

    return items;
  }, [currentVersion, beforeVersion]);

  const [isPreviewPrint, setIsPreviewPrint] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleClose = () => {
    setIsPreviewPrint(false);
    onClose();
  };

  // Helper formatting for budget difference badge
  const renderDiffBadge = () => {
    if (currentVersion.isOrigin) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>ฉบับตั้งต้น ({currentVersion.editionBadge})</span>
        </span>
      );
    }
    if (budgetDiff > 0) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          <span>ผลต่างงบประมาณ:</span>
          <span className="font-mono font-bold">+{budgetDiff.toLocaleString()} บาท (เพิ่มขึ้น)</span>
        </span>
      );
    }
    if (budgetDiff < 0) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-300 shadow-2xs">
          <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
          <span>ผลต่างงบประมาณ:</span>
          <span className="font-mono font-bold">-{Math.abs(budgetDiff).toLocaleString()} บาท (ลดลง)</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
        <span>ผลต่างงบประมาณ:</span>
        <span className="font-mono font-medium">คงเดิม (0 บาท)</span>
      </span>
    );
  };

  // ---------------------------------------------------------------------------
  // ฟังก์ชันเรนเดอร์เอกสารสำหรับพิมพ์ประวัติโครงการ (Print Sheet & Print Preview)
  // ---------------------------------------------------------------------------
  const renderPrintSheet = (isInsidePreview = false) => {
    const targetVer = currentVersion;
    const isOrigin = targetVer.isOrigin;

    return (
      <div
        id="plan-history-print-sheet"
        className={`bg-white text-black font-['Prompt',sans-serif] leading-snug print:w-full print:max-w-none print:p-0 print:m-0 print:border-none print:shadow-none ${
          isInsidePreview
            ? 'w-full max-w-[287mm] p-5 sm:p-6 shadow-2xl border border-slate-300 rounded-xs'
            : 'w-full'
        }`}
      >
        <style>{`
          @media print {
            @page {
              size: A4 landscape !important;
              margin: 8mm 10mm !important;
            }
          }
        `}</style>

        {/* ตรงกลาง: หัวข้อหลัก "ประวัติโครงการ" ตัวหนาขนาดใหญ่ และสังกัดเทศบาล */}
        <div className="text-center mb-2">
          <h1 className="text-2xl font-bold text-black tracking-wide font-['Prompt',sans-serif]">
            ประวัติโครงการ{!isOrigin ? ` (${changeTypeLabel})` : ''}
          </h1>
          <p className="text-[15px] text-black mt-0.5 font-['Prompt',sans-serif]">
            แผนพัฒนาท้องถิ่น (พ.ศ. 2571 - 2575) เทศบาลเมืองศิลา อำเภอเมืองขอนแก่น จังหวัดขอนแก่น
          </p>
        </div>

        {/* ตารางข้อมูลฉบับ / สถานะ */}
        <div className="mb-2">
          <table className="w-full border-collapse border border-black text-[15px] bg-white text-black plan-history-table">
            <thead>
              <tr className="border-b border-black bg-white text-black">
                {isOrigin ? (
                  <th className="border border-black p-1 sm:p-1.5 text-center align-middle font-bold w-full text-black bg-white text-[16px]">
                    {targetVer.editionType === 'first'
                      ? `ข้อมูลฉบับแรก (พ.ศ. 2571 - 2575)`
                      : `ข้อมูลฉบับแผน — เพิ่มเติม ครั้งที่ ${targetVer.editionNumber || 1}/${targetVer.year || project.year || '2571'}`}
                  </th>
                ) : (
                  <>
                    <th className="border border-black p-1 sm:p-1.5 text-center align-middle font-bold w-1/2 text-black bg-white text-[16px]">
                      ข้อมูลเดิม ({beforeLabel})
                    </th>
                    <th className="border border-black p-1 sm:p-1.5 text-center align-middle font-bold w-1/2 text-black bg-white text-[16px]">
                      การปรับปรุงแก้ไข ({targetVer.editionName})
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="bg-white">
              <tr className="bg-white">
                {isOrigin ? (
                  <td className="border border-black p-2 px-3 align-top leading-snug text-black bg-white">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div>
                          <span className="font-bold">ฉบับแผน:</span>{' '}
                          {targetVer.editionType === 'additional'
                            ? `เพิ่มเติม ครั้งที่ ${targetVer.editionNumber || 1}/${targetVer.year || project.year || '2571'}`
                            : targetVer.editionType === 'first'
                            ? 'ฉบับแรก (พ.ศ. 2571 - 2575)'
                            : targetVer.editionBadge}
                        </div>
                        <div>
                          <span className="font-bold">วันที่มีผลบังคับใช้:</span> {targetVer.date || '-'}
                        </div>
                        <div>
                          <span className="font-bold">วันที่อนุมัติ:</span> {targetVer.approvedDate || '-'}
                        </div>
                      </div>
                      <div>
                        <div>
                          <span className="font-bold">มติ/เลขที่ประกาศ:</span> {targetVer.approvalOrderNo || '-'}
                        </div>
                        <div>
                          <span className="font-bold">งบประมาณรวม 5 ปี:</span>{' '}
                          <span className="font-mono font-bold">
                            {targetVer.budgetTotal.toLocaleString()} บาท
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                ) : (
                  <>
                    {/* Before */}
                    <td className="border border-black p-1.5 px-2 align-top leading-snug text-black bg-white">
                      <div>
                        <span className="font-bold">ฉบับ:</span> {beforeLabel}
                      </div>
                      <div>
                        <span className="font-bold">วันที่มีผล:</span> {beforeVersion?.date || '-'}
                      </div>
                      <div>
                        <span className="font-bold">วันที่อนุมัติ:</span> {beforeVersion?.approvedDate || '-'}
                      </div>
                      <div className="mt-0.5 font-bold">
                        งบประมาณ:{' '}
                        <span className="font-mono">
                          {(beforeVersion?.budgetTotal || 0).toLocaleString()} บาท
                        </span>
                      </div>
                    </td>

                    {/* After */}
                    <td className="border border-black p-1.5 px-2 align-top leading-snug text-black bg-white">
                      <div>
                        <span className="font-bold">ฉบับ:</span> {targetVer.editionName} ({targetVer.editionBadge})
                      </div>
                      <div>
                        <span className="font-bold">วันที่มีผล:</span> {targetVer.date || '-'}
                      </div>
                      <div>
                        <span className="font-bold">วันที่อนุมัติ:</span> {targetVer.approvedDate || '-'}
                      </div>
                      <div className="mt-0.5 font-bold">
                        งบประมาณ:{' '}
                        <span className="font-mono">
                          {targetVer.budgetTotal.toLocaleString()} บาท
                        </span>
                        {budgetDiff !== 0 && (
                          <span className="ml-2 font-normal text-[13.5px]">
                            (ผลต่าง:{' '}
                            {budgetDiff > 0
                              ? `+${budgetDiff.toLocaleString()}`
                              : `-${Math.abs(budgetDiff).toLocaleString()}`}{' '}
                            บาท)
                          </span>
                        )}
                      </div>
                    </td>
                  </>
                )}
              </tr>
            </tbody>
          </table>
        </div>

        {/* เหตุผลความจำเป็น */}
        <div className="border border-black p-1.5 px-2.5 mb-2 bg-white text-[15px] leading-snug">
          <div className="font-bold text-black mb-0.5 text-[16px]">
            {isOrigin
              ? 'ที่มาและความจำเป็นของโครงการ'
              : `เหตุผลและความจำเป็นในการ${changeTypeLabel}`}
          </div>
          <div className="text-black leading-snug">
            {project.reason || targetVer.reason || '-'}
          </div>
        </div>

        {/* ตารางแสดงข้อมูลรายละเอียด */}
        {isOrigin ? (
          /* ตารางรายละเอียดฉบับตั้งต้น (Single Table) */
          <div className="mb-2">
            <table className="w-full border-collapse border border-black text-[15px] bg-white text-black plan-history-table">
              <thead>
                <tr className="border-b border-black bg-white text-black">
                  <th className="border border-black p-1.5 text-center font-bold w-[25%] bg-white text-black text-[16px]">
                    หัวข้อข้อมูล
                  </th>
                  <th className="border border-black p-1.5 text-center font-bold w-[75%] bg-white text-black text-[16px]">
                    รายละเอียดโครงการ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                <tr className="border-b border-black">
                  <td className="border border-black p-1.5 px-2 font-bold align-top">1. ยุทธศาสตร์และแผนงาน</td>
                  <td className="border border-black p-1.5 px-2">{targetVer.planStrategy || '-'} / {targetVer.planCategory || '-'}</td>
                </tr>
                <tr className="border-b border-black">
                  <td className="border border-black p-1.5 px-2 font-bold align-top">2. ชื่อโครงการ</td>
                  <td className="border border-black p-1.5 px-2 font-bold">{targetVer.name}</td>
                </tr>
                <tr className="border-b border-black">
                  <td className="border border-black p-1.5 px-2 font-bold align-top">3. วัตถุประสงค์</td>
                  <td className="border border-black p-1.5 px-2">{targetVer.objective}</td>
                </tr>
                <tr className="border-b border-black">
                  <td className="border border-black p-1.5 px-2 font-bold align-top">4. เป้าหมาย (ผลผลิต)</td>
                  <td className="border border-black p-1.5 px-2">{targetVer.target}</td>
                </tr>
                <tr className="border-b border-black">
                  <td className="border border-black p-1.5 px-2 font-bold align-top">
                    5. งบประมาณ
                  </td>
                  <td className="border border-black p-0 align-top">
                    <table className="w-full border-collapse border border-black text-[14px]">
                      <thead>
                        <tr className="border-b border-black bg-white">
                          {yearsList.map((yr) => (
                            <th key={yr} className="border border-black p-1 text-center font-bold">พ.ศ. {yr}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          {yearsList.map((yr) => (
                            <td key={yr} className="border border-black p-1 text-center font-mono">
                              {(targetVer.budgetByYear?.[yr] || 0) > 0
                                ? (targetVer.budgetByYear?.[yr] || 0).toLocaleString()
                                : '-'}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
                <tr className="border-b border-black">
                  <td className="border border-black p-1.5 px-2 font-bold align-top">6. ผลที่คาดว่าจะได้รับ</td>
                  <td className="border border-black p-1.5 px-2">{targetVer.expectedResults}</td>
                </tr>
                <tr className="border-b border-black">
                  <td className="border border-black p-1.5 px-2 font-bold align-top">7. หน่วยงานรับผิดชอบหลัก</td>
                  <td className="border border-black p-1.5 px-2">{targetVer.department}</td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          /* ตารางเปรียบเทียบ Before / After (ฉบับเปลี่ยนแปลง / ฉบับแก้ไข) */
          <div className="mb-2">
            <table className="w-full border-collapse border border-black text-[15px] bg-white text-black plan-history-table">
              <thead>
                <tr className="border-b border-black bg-white text-black">
                  <th className="border border-black p-1 sm:p-1.5 text-center font-bold w-[22%] bg-white text-black text-[16px]">
                    รายละเอียด
                  </th>
                  <th className="border border-black p-1 sm:p-1.5 text-center font-bold w-[39%] bg-white text-black text-[16px]">
                    ข้อมูลเดิมก่อนแก้ไข ({beforeLabel})
                  </th>
                  <th className="border border-black p-1 sm:p-1.5 text-center font-bold w-[39%] bg-white text-black text-[16px]">
                    ข้อมูลหลังแก้ไข ({targetVer.editionName})
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {/* ชื่อโครงการ */}
                <tr className="border-b border-black bg-white">
                  <td className="border border-black p-1.5 px-2 font-bold align-top">1. ชื่อโครงการ</td>
                  <td className="border border-black p-1.5 px-2 align-top">{beforeVersion?.name || '-'}</td>
                  <td className="border border-black p-1.5 px-2 align-top font-bold">
                    {targetVer.name}
                    {targetVer.name !== beforeVersion?.name && (
                      <span className="ml-1 text-[13px] font-normal underline">(แก้ไข)</span>
                    )}
                  </td>
                </tr>

                {/* วัตถุประสงค์ */}
                <tr className="border-b border-black bg-white">
                  <td className="border border-black p-1.5 px-2 font-bold align-top">2. วัตถุประสงค์</td>
                  <td className="border border-black p-1.5 px-2 align-top">{beforeVersion?.objective || '-'}</td>
                  <td className="border border-black p-1.5 px-2 align-top">
                    {targetVer.objective}
                    {targetVer.objective !== beforeVersion?.objective && (
                      <span className="ml-1 text-[13px] font-normal underline">(แก้ไข)</span>
                    )}
                  </td>
                </tr>

                {/* เป้าหมาย */}
                <tr className="border-b border-black bg-white">
                  <td className="border border-black p-1.5 px-2 font-bold align-top">3. เป้าหมาย (ผลผลิต)</td>
                  <td className="border border-black p-1.5 px-2 align-top">{beforeVersion?.target || '-'}</td>
                  <td className="border border-black p-1.5 px-2 align-top font-bold">
                    {targetVer.target}
                    {targetVer.target !== beforeVersion?.target && (
                      <span className="ml-1 text-[13px] font-normal underline">(แก้ไข)</span>
                    )}
                  </td>
                </tr>

                {/* แผนงบประมาณ */}
                <tr className="border-b border-black bg-white">
                  <td className="border border-black p-1.5 px-2 font-bold align-top">
                    4. แผนงบประมาณรายปี
                    <div className="text-[12px] font-normal">(พ.ศ. 2571 - 2575)</div>
                  </td>
                  <td colSpan={2} className="border border-black p-0 align-top">
                    <table className="w-full border-collapse border border-black text-[14px]">
                      <thead>
                        <tr className="border-b border-black bg-white">
                          <th className="border border-black p-1 text-center font-bold w-[20%]">ปี พ.ศ.</th>
                          <th className="border border-black p-1 text-center font-bold w-[40%]">เดิม ({beforeLabel})</th>
                          <th className="border border-black p-1 text-center font-bold w-[40%]">ใหม่ ({targetVer.editionName})</th>
                        </tr>
                      </thead>
                      <tbody>
                        {yearsList.map((yr) => {
                          const bAmt = beforeVersion?.budgetByYear?.[yr] || 0;
                          const aAmt = targetVer.budgetByYear?.[yr] || 0;
                          const diff = aAmt - bAmt;
                          return (
                            <tr key={yr} className="border-b border-black">
                              <td className="border border-black p-1 text-center font-bold">{yr}</td>
                              <td className="border border-black p-1 px-2 text-right font-mono">
                                {bAmt > 0 ? bAmt.toLocaleString() : '-'}
                              </td>
                              <td className="border border-black p-1 px-2 text-right font-mono font-bold">
                                {aAmt > 0 ? aAmt.toLocaleString() : '-'}
                                {diff !== 0 && (
                                  <span className="ml-1 text-[12px] font-normal">
                                    ({diff > 0 ? `+${diff.toLocaleString()}` : `-${Math.abs(diff).toLocaleString()}`})
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                        <tr className="font-bold bg-white">
                          <td className="border border-black p-1 text-center">รวม 5 ปี</td>
                          <td className="border border-black p-1 px-2 text-right font-mono">
                            {(beforeVersion?.budgetTotal || 0).toLocaleString()}
                          </td>
                          <td className="border border-black p-1 px-2 text-right font-mono font-bold">
                            {targetVer.budgetTotal.toLocaleString()}
                            {budgetDiff !== 0 && (
                              <span className="ml-1 text-[12px] font-normal">
                                ({budgetDiff > 0 ? `+${budgetDiff.toLocaleString()}` : `-${Math.abs(budgetDiff).toLocaleString()}`})
                              </span>
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>

                {/* ผลที่คาดว่าจะได้รับ */}
                <tr className="border-b border-black bg-white">
                  <td className="border border-black p-1.5 px-2 font-bold align-top">5. ผลที่คาดว่าจะได้รับ</td>
                  <td className="border border-black p-1.5 px-2 align-top">{beforeVersion?.expectedResults || '-'}</td>
                  <td className="border border-black p-1.5 px-2 align-top">{targetVer.expectedResults}</td>
                </tr>

                {/* หน่วยงานรับผิดชอบหลัก */}
                <tr className="bg-white">
                  <td className="border border-black p-1.5 px-2 font-bold align-top">6. หน่วยงานรับผิดชอบ</td>
                  <td className="border border-black p-1.5 px-2 align-top">{beforeVersion?.department || '-'}</td>
                  <td className="border border-black p-1.5 px-2 align-top">{targetVer.department}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* ท้ายเอกสาร: แสดงวันที่พิมพ์ */}
        <div className="pt-1.5 flex justify-end items-center text-xs sm:text-[14px] text-black font-['Prompt',sans-serif]">
          <span>
            วันที่พิมพ์: {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </div>
    );
  };

  if (!project) return null;

  return (
    <div
      id="plan-history-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-hidden print:p-0 print:bg-white print:static print:overflow-visible"
    >
      <div
        id="plan-history-modal-container"
        className={`bg-white rounded-2xl shadow-2xl ${
          isPreviewPrint
            ? 'max-w-[98vw] 2xl:max-w-[1400px] w-full'
            : 'max-w-5xl w-full'
        } max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 print:border-none print:shadow-none print:max-h-none print:h-auto print:w-full print:rounded-none print:overflow-visible`}
      >
        {isPreviewPrint ? (
          <div className="flex flex-col h-full overflow-hidden bg-slate-200/70 print:bg-white print:overflow-visible">
            {/* Top Toolbar */}
            <div className="shrink-0 px-4 sm:px-6 py-2.5 bg-white border-b border-slate-200 flex items-center justify-between gap-3 z-10 print:hidden shadow-xs">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => setIsPreviewPrint(false)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>ย้อนกลับ</span>
                </button>
                <div className="h-5 w-px bg-slate-300 hidden sm:block" />
                <span className="font-bold text-slate-900 text-xs sm:text-sm md:text-base">
                  ตัวอย่างก่อนพิมพ์ ประวัติโครงการ
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  📑 แนวนอน (A4 Landscape)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl cursor-pointer transition-all shadow-xs active:scale-95"
                  title="สั่งพิมพ์หรือบันทึก PDF ทันที"
                >
                  <Printer className="w-4 h-4 text-white" />
                  <span>พิมพ์ประวัติโครงการ</span>
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-8 h-8 sm:w-9 sm:h-9 bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg shadow-xs flex items-center justify-center transition-colors cursor-pointer p-0"
                  title="ปิดหน้าต่าง"
                  aria-label="ปิดหน้าต่าง"
                >
                  <X className="w-5 h-5 stroke-[2.2]" />
                </button>
              </div>
            </div>

            {/* Scrollable Paper Container */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col items-center print:p-0 print:overflow-visible print:block">
              {renderPrintSheet(true)}
            </div>
          </div>
        ) : (
          <>
            {/* =========================================================================
                1. MODAL HEADER
            ========================================================================= */}
            <div className="bg-white text-slate-900 px-5 py-3.5 sm:px-6 flex items-center justify-between border-b border-slate-200 shrink-0 print:hidden">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0 shadow-2xs">
                  <History className="w-5 h-5" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center flex-wrap gap-2 text-xs">
                    <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-0.5 rounded-full font-medium">
                      โครงการ #{project.orderNumber || 1}
                    </span>

                    {/* Origin Badge vs Modification Badge */}
                    {project.edition === 'first' ? (
                      <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full font-bold shadow-2xs inline-flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-600" />
                        <span>บรรจุครั้งแรกในฉบับแรก</span>
                      </span>
                    ) : project.edition === 'additional' ? (
                      <span className="bg-purple-100 text-purple-800 border border-purple-300 px-2.5 py-0.5 rounded-full font-bold shadow-2xs inline-flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-purple-600" />
                        <span>เพิ่มเติม ครั้งที่ {project.editionNumber || 1}/{project.year || '2571'}</span>
                      </span>
                    ) : (
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold shadow-2xs border inline-flex items-center gap-1 ${
                          project.edition === 'changed'
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-blue-100 text-blue-800 border-blue-300'
                        }`}
                      >
                        <Layers className="w-3 h-3" />
                        <span>
                          {project.edition === 'changed'
                            ? `ฉบับเปลี่ยนแปลง ครั้งที่ ${project.editionNumber || 1} (ข้อ 22/1)`
                            : `ฉบับแก้ไข ครั้งที่ ${project.editionNumber || 1} (ข้อ 21)`}
                        </span>
                      </span>
                    )}

                    <span className="text-slate-500 font-normal text-[11px] sm:text-xs">
                      (มีประวัติในระบบ {versions.length} เวอร์ชัน)
                    </span>
                  </div>

                  <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight mt-1 truncate">
                    ประวัติโครงการ: <span className="font-semibold text-slate-800">{project.name}</span>
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 ml-3">
                <button
                  id="btn-print-plan-history-modal"
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
                  title="พิมพ์เฉพาะเนื้อหาในหน้ารายละเอียดนี้ออกทางเครื่องพิมพ์"
                >
                  <Printer className="w-4 h-4" />
                  <span>พิมพ์หน้านี้</span>
                </button>

                <button
                  type="button"
                  title="ปิดหน้าต่าง"
                  aria-label="ปิดหน้าต่าง"
                  onClick={handleClose}
                  className="w-8 h-8 sm:w-9 sm:h-9 bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg shadow-xs flex items-center justify-center transition-colors cursor-pointer p-0"
                >
                  <X className="w-5 h-5 stroke-[2.2]" />
                </button>
              </div>
            </div>

            {/* =========================================================================
                2. MODAL BODY
            ========================================================================= */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4 bg-white text-slate-800 print:hidden">
              {/* SECTION 1: ลำดับไทม์ไลน์ (Timeline UI) */}
              <section className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 text-sm">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <span>ลำดับไทม์ไลน์</span>
                  </div>
                </div>

                {/* Timeline Horizontal Track */}
                <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-2 pt-2 scrollbar-thin">
                  {versions.map((ver, index) => {
                    const isSelected = ver.id === currentVersion.id;

                    return (
                      <React.Fragment key={ver.id}>
                        {/* Timeline Connector Arrow */}
                        {index > 0 && (
                          <div className="shrink-0 flex items-center text-slate-400">
                            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 stroke-[2.2]" />
                          </div>
                        )}

                        {/* Version Card Node */}
                        <div className="relative shrink-0">
                          {/* Top Floating Badge */}
                          {ver.isOrigin ? (
                            <span className="absolute -top-2.5 left-3 bg-emerald-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs z-10 flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5" />
                              <span>จุดเริ่มต้นกำเนิดโครงการ</span>
                            </span>
                          ) : (
                            <span className="absolute -top-2.5 left-3 bg-amber-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs z-10 flex items-center gap-1">
                              <Edit3 className="w-2.5 h-2.5" />
                              <span>ฉบับปรับปรุงแก้ไข</span>
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => setSelectedVersionId(ver.id)}
                            className={`w-[230px] sm:w-[250px] rounded-xl p-3.5 pt-5 sm:pt-6 text-left transition-all cursor-pointer ${
                              isSelected
                                ? 'border-2 border-emerald-600 bg-emerald-50/30 shadow-md ring-2 ring-emerald-400/30'
                                : 'border border-slate-200 bg-slate-50/80 hover:bg-white hover:border-slate-300 hover:shadow-xs'
                            }`}
                          >
                            {/* Card Header Badge */}
                            <div className="flex items-center justify-between gap-1.5 mb-2 mt-0.5">
                              <span
                                className={`text-[11px] px-2 py-0.5 rounded-md font-bold whitespace-nowrap ${
                                  ver.isOrigin
                                    ? ver.editionType === 'first'
                                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                                      : 'bg-purple-100 text-purple-900 border border-purple-200'
                                    : ver.editionType === 'changed'
                                    ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                    : 'bg-blue-100 text-blue-900 border border-blue-200'
                                }`}
                              >
                                {ver.isOrigin
                                  ? ver.editionType === 'first'
                                    ? 'ฉบับแรก'
                                    : 'ฉบับเพิ่มเติม'
                                  : ver.editionType === 'changed'
                                  ? 'ฉบับเปลี่ยนแปลง'
                                  : 'ฉบับแก้ไข'}
                              </span>

                              {isSelected && (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded shrink-0">
                                  กำลังดู
                                </span>
                              )}
                            </div>

                            {/* Edition Name */}
                            <div className="font-bold text-xs sm:text-sm text-slate-900 leading-snug">
                              {ver.editionType === 'additional'
                                ? `เพิ่มเติม ครั้งที่ ${ver.editionNumber || 1}/${ver.year || project.year || '2571'}`
                                : ver.editionName}
                            </div>

                            {/* Date */}
                            <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>วันที่มีผล: {ver.date}</span>
                            </div>

                            {/* Budget summary */}
                            <div className="flex items-center justify-between text-xs text-slate-600 mt-2 pt-2 border-t border-slate-200/80">
                              <span className="text-[11px] text-slate-500">งบประมาณ:</span>
                              <span className="font-bold text-slate-900 font-mono text-xs">
                                {ver.budgetTotal.toLocaleString()} บ.
                              </span>
                            </div>
                          </button>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              </section>

              {/* SECTION 2: แถบสถานะ / ตัวเลือกเปรียบเทียบ */}
              <section className="flex flex-wrap items-center justify-between gap-3 text-xs pt-2 border-t border-slate-100">
                {!currentVersion.isOrigin ? (
                  <div className="flex items-center flex-wrap gap-2.5">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <GitCompare className="w-4 h-4 text-emerald-600" />
                      <span>การแสดงผลรายละเอียด:</span>
                    </div>

                    {/* Comparison mode toggles for modification editions */}
                    <div className="inline-flex items-center gap-2">
                      <div className="inline-flex rounded-lg p-0.5 bg-slate-100 border border-slate-200">
                        <button
                          type="button"
                          onClick={() => setCompareMode('previous')}
                          className={`px-3 py-1 rounded-md text-xs transition-colors cursor-pointer ${
                            compareMode === 'previous'
                              ? 'bg-white text-slate-900 font-bold shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          เทียบกับฉบับก่อนหน้า ({beforeLabel})
                        </button>
                        <button
                          type="button"
                          onClick={() => setCompareMode('initial')}
                          className={`px-3 py-1 rounded-md text-xs transition-colors cursor-pointer ${
                            compareMode === 'initial'
                              ? 'bg-white text-slate-900 font-bold shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          เทียบกับฉบับตั้งต้น ({originVersion?.editionName})
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div />
                )}

                {/* Status difference badge */}
                <div className="ml-auto">{renderDiffBadge()}</div>
              </section>

              {/* SECTION 3: ข้อมูลการอนุมัติและเหตุผลความจำเป็น */}
              <section
                className={`rounded-xl p-4 text-xs space-y-3 shadow-2xs border ${
                  currentVersion.isOrigin
                    ? 'bg-emerald-50/40 border-emerald-200'
                    : 'bg-[#fffdf5] border-amber-200'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2.5 border-slate-200/60">
                  <div
                    className={`flex items-center gap-2 font-bold ${
                      currentVersion.isOrigin ? 'text-emerald-900' : 'text-amber-900'
                    }`}
                  >
                    <FileText
                      className={`w-4 h-4 ${
                        currentVersion.isOrigin ? 'text-emerald-600' : 'text-amber-600'
                      }`}
                    />
                    <span>
                      {currentVersion.isOrigin
                        ? 'ข้อมูลการอนุมัติโครงการ'
                        : `ข้อมูลการอนุมัติโครงการ — ${currentVersion.editionName}`}
                    </span>
                  </div>

                  <div className="text-slate-700 font-medium text-xs">
                    <span>วันที่อนุมัติ: </span>
                    <span className="font-semibold text-slate-900">{currentVersion.approvedDate}</span>
                    <span className="mx-2 text-slate-300">|</span>
                    <span>มติ/คำสั่ง/ประกาศ: </span>
                    <span className="font-semibold text-slate-900">{currentVersion.approvalOrderNo}</span>
                  </div>
                </div>

                <div>
                  <div
                    className={`font-semibold mb-1 ${
                      currentVersion.isOrigin ? 'text-emerald-900' : 'text-amber-900'
                    }`}
                  >
                    {currentVersion.isOrigin
                      ? 'ที่มาและความจำเป็นในการจัดทำโครงการ:'
                      : `เหตุผลและความจำเป็นในการ${changeTypeLabel}:`}
                  </div>
                  <div className="bg-white border border-slate-200 rounded-lg p-2.5 text-slate-800 leading-relaxed font-normal shadow-2xs">
                    {project.reason || currentVersion.reason || '-'}
                  </div>
                </div>
              </section>

              {/* SECTION 4: ตารางรายละเอียดโครงการ / ตารางเปรียบเทียบการเปลี่ยนแปลง (Diff Table) */}
              {currentVersion.isOrigin ? (
                /* -------------------------------------------------------------
                   4.1 ตารางรายละเอียดโครงการแบบปกติ (กรณีเลือกดูฉบับตั้งต้น)
                   ไม่ต้องแสดงตารางเปรียบเทียบ Before/After
                ------------------------------------------------------------- */
                <section className="space-y-0 shadow-2xs rounded-xl overflow-hidden border border-slate-200">
                  <div className="bg-[#0f2e24] text-white px-4 py-3 flex items-center justify-between text-xs font-medium">
                    <div className="flex items-center gap-2">
                      <Table2 className="w-4 h-4 text-emerald-400" />
                      <span className="font-bold text-white text-sm">
                        รายละเอียดโครงการ
                      </span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 bg-emerald-900/60 px-3 py-1 rounded-md text-emerald-200 border border-emerald-700/50">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{currentVersion.editionBadge}</span>
                    </div>
                  </div>

                  <div className="overflow-x-auto bg-white">
                    <table className="w-full border-collapse border border-slate-200 text-xs text-slate-900 bg-white">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-800">
                          <th className="py-2.5 px-4 text-left w-52 border border-slate-300 bg-slate-100">
                            หัวข้อข้อมูล
                          </th>
                          <th className="py-2.5 px-4 text-left border border-slate-300 bg-slate-100">
                            รายละเอียดโครงการ ({currentVersion.editionName})
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {/* 1. ยุทธศาสตร์และแผนงาน */}
                        <tr className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-4 font-bold text-slate-900 bg-slate-50/80 border border-slate-200 align-top">
                            1. ยุทธศาสตร์และแผนงาน
                          </td>
                          <td className="py-2.5 px-4 text-slate-800 border border-slate-200 align-top leading-relaxed">
                            <span className="font-semibold text-slate-900">ยุทธศาสตร์:</span>{' '}
                            {currentVersion.planStrategy || '-'}{' '}
                            <span className="mx-2 text-slate-400">|</span>
                            <span className="font-semibold text-slate-900">แผนงาน:</span>{' '}
                            {currentVersion.planCategory || '-'}
                          </td>
                        </tr>

                        {/* 2. ชื่อโครงการ */}
                        <tr className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-bold text-slate-900 bg-slate-50/80 border border-slate-200 align-top">
                            2. ชื่อโครงการ
                          </td>
                          <td className="py-3 px-4 text-slate-900 border border-slate-200 align-top font-bold text-sm">
                            {currentVersion.name}
                          </td>
                        </tr>

                        {/* 3. วัตถุประสงค์ */}
                        <tr className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-4 font-bold text-slate-900 bg-slate-50/80 border border-slate-200 align-top">
                            3. วัตถุประสงค์
                          </td>
                          <td className="py-2.5 px-4 text-slate-800 border border-slate-200 align-top leading-relaxed">
                            {currentVersion.objective || '-'}
                          </td>
                        </tr>

                        {/* 4. เป้าหมาย (ผลผลิต) */}
                        <tr className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-4 font-bold text-slate-900 bg-slate-50/80 border border-slate-200 align-top">
                            4. เป้าหมาย (ผลผลิตของโครงการ)
                          </td>
                          <td className="py-2.5 px-4 text-slate-900 border border-slate-200 align-top leading-relaxed font-medium">
                            {currentVersion.target || '-'}
                          </td>
                        </tr>

                        {/* 5. งบประมาณ */}
                        <tr className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-4 font-bold text-slate-900 bg-slate-50/80 border border-slate-200 align-top">
                            5. งบประมาณ
                          </td>
                          <td className="p-0 border border-slate-200 align-top">
                            <table className="w-full border-collapse text-xs">
                              <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700">
                                  {yearsList.map((yr, idx) => (
                                    <th
                                      key={yr}
                                      className={`py-2 px-3 text-center font-bold ${
                                        idx < yearsList.length - 1 ? 'border-r border-slate-200' : ''
                                      }`}
                                    >
                                      พ.ศ. {yr}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  {yearsList.map((yr, idx) => {
                                    const amt = currentVersion.budgetByYear?.[yr] || 0;
                                    return (
                                      <td
                                        key={yr}
                                        className={`py-2.5 px-3 text-center font-mono text-slate-800 ${
                                          idx < yearsList.length - 1 ? 'border-r border-slate-200' : ''
                                        }`}
                                      >
                                        {amt > 0 ? amt.toLocaleString() : '-'}
                                      </td>
                                    );
                                  })}
                                </tr>
                              </tbody>
                            </table>
                          </td>
                        </tr>

                        {/* 6. แหล่งที่มาของงบประมาณ */}
                        <tr className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-4 font-bold text-slate-900 bg-slate-50/80 border border-slate-200 align-top">
                            6. แหล่งที่มาของงบประมาณ
                          </td>
                          <td className="py-2.5 px-4 text-slate-800 border border-slate-200 align-top">
                            {currentVersion.budgetSource || '-'}
                          </td>
                        </tr>

                        {/* 7. ผลที่คาดว่าจะได้รับ */}
                        <tr className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-4 font-bold text-slate-900 bg-slate-50/80 border border-slate-200 align-top">
                            7. ผลที่คาดว่าจะได้รับ
                          </td>
                          <td className="py-2.5 px-4 text-slate-800 border border-slate-200 align-top leading-relaxed">
                            {currentVersion.expectedResults || '-'}
                          </td>
                        </tr>

                        {/* 8. หน่วยงานรับผิดชอบหลัก */}
                        <tr className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-4 font-bold text-slate-900 bg-slate-50/80 border border-slate-200 align-top">
                            8. หน่วยงานรับผิดชอบหลัก
                          </td>
                          <td className="py-2.5 px-4 text-slate-900 border border-slate-200 align-top font-semibold">
                            {currentVersion.department || '-'}
                          </td>
                        </tr>

                        {/* 9. พื้นที่ดำเนินการ */}
                        <tr className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-4 font-bold text-slate-900 bg-slate-50/80 border border-slate-200 align-top">
                            9. พื้นที่ดำเนินการ
                          </td>
                          <td className="py-2.5 px-4 text-slate-800 border border-slate-200 align-top">
                            {currentVersion.village || '-'} {currentVersion.zone ? `(${currentVersion.zone})` : ''}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>
              ) : (
                /* -------------------------------------------------------------
                   4.2 ตารางเปรียบเทียบการเปลี่ยนแปลง (กรณีเลือกดูฉบับเปลี่ยนแปลง / ฉบับแก้ไข)
                   แสดง 2 คอลัมน์ Before / After พร้อม Highlight ชัดเจน
                ------------------------------------------------------------- */
                <section className="space-y-0 shadow-2xs rounded-xl overflow-hidden border border-slate-200">
                  {/* Top Bar with Diff Badges */}
                  <div className="bg-[#1e293b] text-white px-4 py-3 flex items-center justify-between text-xs font-medium flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Table2 className="w-4 h-4 text-emerald-400" />
                      <span className="font-bold text-white text-sm">
                        ตารางเปรียบเทียบการเปลี่ยนแปลง (Before / After Comparison)
                      </span>
                    </div>
                    <div className="text-slate-300 text-xs flex items-center gap-1.5 flex-wrap">
                      <span>เปรียบเทียบ: </span>
                      <span className="text-slate-200 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                        เดิม: {beforeLabel}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-700">
                        ใหม่: {currentVersion.editionName}
                      </span>
                    </div>
                  </div>

                  {/* Highlight indicators summary row */}
                  {diffSummaryList.length > 0 ? (
                    <div className="bg-amber-50/80 border-b border-amber-200 px-4 py-2 flex items-center gap-2 text-xs flex-wrap">
                      <span className="font-bold text-amber-900 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        <span>พบรายการที่มีการปรับปรุงแก้ไข ({diffSummaryList.length} จุด):</span>
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {diffSummaryList.map((item) => (
                          <span
                            key={item}
                            className="bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-md font-semibold text-[11px]"
                          >
                            ✓ {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 text-xs text-slate-600">
                      <span>ไม่พบการเปลี่ยนแปลงรายละเอียดสำคัญ (ข้อมูลตรงกันกับฉบับก่อนหน้า)</span>
                    </div>
                  )}

                  {/* 2-Column Diff Table */}
                  <div className="overflow-x-auto bg-white">
                    <table className="w-full border-collapse border border-slate-200 text-xs text-slate-900 bg-white">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-800">
                          <th className="py-2.5 px-4 text-left w-48 border border-slate-300 bg-slate-100">
                            หัวข้อข้อมูล
                          </th>
                          <th className="py-2.5 px-4 text-left w-[41%] border border-slate-300 bg-slate-100">
                            <div className="flex items-center justify-between">
                              <span>ข้อมูลเดิมก่อนแก้ไข (Before)</span>
                              <span className="text-[11px] font-normal text-slate-500">[{beforeLabel}]</span>
                            </div>
                          </th>
                          <th className="py-2.5 px-4 text-left w-[41%] border border-slate-300 bg-slate-100">
                            <div className="flex items-center justify-between">
                              <span className="text-emerald-950 font-bold">ข้อมูลหลังแก้ไข (After)</span>
                              <span className="text-[11px] font-semibold text-emerald-700">[{currentVersion.editionName}]</span>
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {/* 1. ชื่อโครงการ */}
                        {(() => {
                          const isChanged = currentVersion.name.trim() !== (beforeVersion?.name || '').trim();
                          return (
                            <tr className={isChanged ? 'bg-amber-50/30' : 'hover:bg-slate-50/50'}>
                              <td className="py-3 px-4 font-bold text-slate-900 bg-slate-50/80 border border-slate-200 align-top">
                                <div className="flex items-center justify-between">
                                  <span>1. ชื่อโครงการ</span>
                                  {isChanged && (
                                    <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-1.5 py-0.5 rounded">
                                      แก้ไข
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-slate-700 border border-slate-200 align-top font-medium">
                                {beforeVersion?.name || '-'}
                              </td>
                              <td className="py-3 px-4 border border-slate-200 align-top font-bold text-slate-950">
                                {isChanged ? (
                                  <div className="p-2 rounded-lg bg-amber-100/90 text-amber-950 border border-amber-300 shadow-2xs">
                                    <div className="text-[11px] text-amber-800 font-semibold mb-0.5">
                                      [ข้อความใหม่ที่ปรับปรุง]:
                                    </div>
                                    <div className="text-sm font-bold">{currentVersion.name}</div>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between">
                                    <span>{currentVersion.name}</span>
                                    <span className="text-[10px] text-slate-400 font-normal">[คงเดิม]</span>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })()}

                        {/* 2. วัตถุประสงค์ */}
                        {(() => {
                          const isChanged = (currentVersion.objective || '').trim() !== (beforeVersion?.objective || '').trim();
                          return (
                            <tr className={isChanged ? 'bg-amber-50/30' : 'hover:bg-slate-50/50'}>
                              <td className="py-3 px-4 font-bold text-slate-900 bg-slate-50/80 border border-slate-200 align-top">
                                <div className="flex items-center justify-between">
                                  <span>2. วัตถุประสงค์</span>
                                  {isChanged && (
                                    <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-1.5 py-0.5 rounded">
                                      แก้ไข
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-slate-700 border border-slate-200 align-top leading-relaxed">
                                {beforeVersion?.objective || '-'}
                              </td>
                              <td className="py-3 px-4 border border-slate-200 align-top leading-relaxed">
                                {isChanged ? (
                                  <div className="p-2 rounded-lg bg-amber-100/90 text-amber-950 border border-amber-300 shadow-2xs font-medium">
                                    {currentVersion.objective}
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-800">{currentVersion.objective}</span>
                                    <span className="text-[10px] text-slate-400 font-normal">[คงเดิม]</span>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })()}

                        {/* 3. เป้าหมาย (ผลผลิตของโครงการ) */}
                        {(() => {
                          const isChanged = (currentVersion.target || '').trim() !== (beforeVersion?.target || '').trim();
                          return (
                            <tr className={isChanged ? 'bg-amber-50/30' : 'hover:bg-slate-50/50'}>
                              <td className="py-3 px-4 font-bold text-slate-900 bg-slate-50/80 border border-slate-200 align-top">
                                <div className="flex items-center justify-between">
                                  <span>3. เป้าหมาย (ผลผลิต)</span>
                                  {isChanged && (
                                    <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-1.5 py-0.5 rounded">
                                      แก้ไข
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-slate-700 border border-slate-200 align-top leading-relaxed">
                                {beforeVersion?.target || '-'}
                              </td>
                              <td className="py-3 px-4 border border-slate-200 align-top leading-relaxed">
                                {isChanged ? (
                                  <div className="p-2.5 rounded-lg bg-amber-100/90 text-amber-950 border border-amber-300 shadow-2xs">
                                    <div className="text-[11px] text-amber-800 font-bold mb-0.5">
                                      [ปรับเปลี่ยนเป้าหมาย/ปริมาณงาน]:
                                    </div>
                                    <div className="font-bold">{currentVersion.target}</div>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-800">{currentVersion.target}</span>
                                    <span className="text-[10px] text-slate-400 font-normal">[คงเดิม]</span>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })()}

                        {/* 4. งบประมาณ Subtable */}
                        <tr>
                          <td className="py-3 px-4 font-bold text-slate-900 bg-slate-50/80 border border-slate-200 align-top">
                            <span>4. งบประมาณ</span>
                            <div className="mt-2">
                              {budgetDiff > 0 ? (
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded border border-emerald-300">
                                  งบเพิ่ม +{budgetDiff.toLocaleString()}
                                </span>
                              ) : budgetDiff < 0 ? (
                                <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-1.5 py-0.5 rounded border border-rose-300">
                                  งบลด -{Math.abs(budgetDiff).toLocaleString()}
                                </span>
                              ) : (
                                <span className="text-[10px] bg-slate-100 text-slate-600 font-medium px-1.5 py-0.5 rounded">
                                  งบรวมคงเดิม
                                </span>
                              )}
                            </div>
                          </td>
                          <td colSpan={2} className="p-0 border border-slate-200 align-top">
                            <table className="w-full border-collapse text-xs">
                              <thead>
                                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                                  <th className="py-2 px-3 text-left w-20 border-r border-slate-200">ปี พ.ศ.</th>
                                  <th className="py-2 px-3 text-right border-r border-slate-200 w-[35%]">
                                    เดิม: {beforeLabel} (บาท)
                                  </th>
                                  <th className="py-2 px-3 text-right border-r border-slate-200 w-[35%] bg-amber-50/40 text-amber-950 font-bold">
                                    ใหม่: {currentVersion.editionName} (บาท)
                                  </th>
                                  <th className="py-2 px-3 text-right font-bold w-[25%]">ผลต่าง (+/-)</th>
                                </tr>
                              </thead>
                              <tbody>
                                {yearsList.map((yr) => {
                                  const beforeAmount = beforeVersion?.budgetByYear?.[yr] || 0;
                                  const afterAmount = currentVersion.budgetByYear?.[yr] || 0;
                                  const diff = afterAmount - beforeAmount;
                                  const isYearShift =
                                    (beforeAmount > 0 && afterAmount === 0) ||
                                    (beforeAmount === 0 && afterAmount > 0);
                                  const isAmountChanged = diff !== 0;

                                  return (
                                    <tr
                                      key={yr}
                                      className={`border-b border-slate-200 ${
                                        isAmountChanged ? 'bg-amber-50/40' : 'hover:bg-slate-50/50'
                                      }`}
                                    >
                                      <td className="py-2 px-3 font-bold text-slate-800 border-r border-slate-200">
                                        {yr}
                                      </td>
                                      <td className="py-2 px-3 text-right text-slate-700 font-mono border-r border-slate-200">
                                        {beforeAmount > 0 ? beforeAmount.toLocaleString() : '-'}
                                      </td>
                                      <td className="py-2 px-3 text-right font-mono border-r border-slate-200">
                                        {isAmountChanged ? (
                                          <div className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-950 font-bold px-2 py-0.5 rounded border border-amber-300">
                                            <span>{afterAmount > 0 ? afterAmount.toLocaleString() : '-'}</span>
                                            {isYearShift && (
                                              <span className="text-[10px] bg-amber-200 text-amber-900 px-1 py-0.2 rounded font-normal">
                                                {afterAmount > 0 ? 'ย้ายมาปีนี้' : 'ย้ายออก'}
                                              </span>
                                            )}
                                          </div>
                                        ) : (
                                          <span className="text-slate-800 font-medium">
                                            {afterAmount > 0 ? afterAmount.toLocaleString() : '-'}
                                          </span>
                                        )}
                                      </td>
                                      <td className="py-2 px-3 text-right font-mono">
                                        {diff > 0 ? (
                                          <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded text-[11px]">
                                            +{diff.toLocaleString()}
                                          </span>
                                        ) : diff < 0 ? (
                                          <span className="text-rose-700 font-bold bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded text-[11px]">
                                            -{Math.abs(diff).toLocaleString()}
                                          </span>
                                        ) : (
                                          <span className="text-slate-400 font-normal">คงเดิม (0)</span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}

                                {/* Total 5-year budget row */}
                                <tr className="bg-slate-100/90 font-bold border-t-2 border-slate-300">
                                  <td className="py-2.5 px-3 text-slate-900 border-r border-slate-200 font-bold">
                                    รวม 5 ปี
                                  </td>
                                  <td className="py-2.5 px-3 text-right text-slate-800 font-mono border-r border-slate-200 font-bold">
                                    {(beforeVersion?.budgetTotal || 0).toLocaleString()}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono border-r border-slate-200 font-bold">
                                    {budgetDiff !== 0 ? (
                                      <span className="bg-amber-100 text-amber-950 font-bold px-2 py-0.5 rounded border border-amber-300 inline-block text-xs">
                                        {currentVersion.budgetTotal.toLocaleString()}
                                      </span>
                                    ) : (
                                      <span className="text-slate-900 font-bold">
                                        {currentVersion.budgetTotal.toLocaleString()}
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono">
                                    {budgetDiff > 0 ? (
                                      <span className="text-emerald-800 font-bold bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded text-xs">
                                        +{budgetDiff.toLocaleString()}
                                      </span>
                                    ) : budgetDiff < 0 ? (
                                      <span className="text-rose-800 font-bold bg-rose-100 border border-rose-300 px-2 py-0.5 rounded text-xs">
                                        -{Math.abs(budgetDiff).toLocaleString()}
                                      </span>
                                    ) : (
                                      <span className="text-slate-500 font-semibold">คงเดิม (0)</span>
                                    )}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </td>
                        </tr>

                        {/* 5. ผลที่คาดว่าจะได้รับ */}
                        {(() => {
                          const isChanged =
                            (currentVersion.expectedResults || '').trim() !==
                            (beforeVersion?.expectedResults || '').trim();
                          return (
                            <tr className={isChanged ? 'bg-amber-50/30' : 'hover:bg-slate-50/50'}>
                              <td className="py-3 px-4 font-bold text-slate-900 bg-slate-50/80 border border-slate-200 align-top">
                                <div className="flex items-center justify-between">
                                  <span>5. ผลที่คาดว่าจะได้รับ</span>
                                  {isChanged && (
                                    <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-1.5 py-0.5 rounded">
                                      แก้ไข
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-slate-700 border border-slate-200 align-top leading-relaxed">
                                {beforeVersion?.expectedResults || '-'}
                              </td>
                              <td className="py-3 px-4 border border-slate-200 align-top leading-relaxed">
                                {isChanged ? (
                                  <div className="p-2 rounded-lg bg-amber-100/90 text-amber-950 border border-amber-300 shadow-2xs font-medium">
                                    {currentVersion.expectedResults}
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-800">{currentVersion.expectedResults}</span>
                                    <span className="text-[10px] text-slate-400 font-normal">[คงเดิม]</span>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })()}

                        {/* 6. หน่วยงานรับผิดชอบหลัก */}
                        {(() => {
                          const isChanged =
                            (currentVersion.department || '').trim() !==
                            (beforeVersion?.department || '').trim();
                          return (
                            <tr className={isChanged ? 'bg-amber-50/30' : 'hover:bg-slate-50/50'}>
                              <td className="py-3 px-4 font-bold text-slate-900 bg-slate-50/80 border border-slate-200 align-top">
                                <div className="flex items-center justify-between">
                                  <span>6. หน่วยงานรับผิดชอบ</span>
                                  {isChanged && (
                                    <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-1.5 py-0.5 rounded">
                                      แก้ไข
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-slate-700 border border-slate-200 align-top">
                                {beforeVersion?.department || '-'}
                              </td>
                              <td className="py-3 px-4 border border-slate-200 align-top font-semibold text-slate-900">
                                {isChanged ? (
                                  <span className="p-1.5 rounded-md bg-amber-100/90 text-amber-950 border border-amber-300 font-bold inline-block">
                                    {currentVersion.department}
                                  </span>
                                ) : (
                                  <div className="flex items-center justify-between">
                                    <span>{currentVersion.department}</span>
                                    <span className="text-[10px] text-slate-400 font-normal">[คงเดิม]</span>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })()}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </div>

            {/* =========================================================================
                3. MODAL FOOTER
            ========================================================================= */}
            <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 sm:px-6 flex items-center justify-end gap-3 text-xs shrink-0 print:hidden">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPreviewPrint(true)}
                  className="bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-95"
                >
                  <Printer className="w-4 h-4 text-white" />
                  <span>พิมพ์ประวัติโครงการ</span>
                </button>

                <button
                  type="button"
                  onClick={handleClose}
                  className="bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-700 hover:text-slate-900 font-medium px-5 py-2 rounded-xl border border-slate-300 transition-colors cursor-pointer shadow-xs"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </div>

            {/* แผ่นพิมพ์สำหรับ Direct Print (Ctrl+P) */}
            <div className="hidden print:block">
              {renderPrintSheet(false)}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
