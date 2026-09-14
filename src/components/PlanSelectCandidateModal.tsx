import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Building2,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  Info,
  ArrowLeftRight
} from 'lucide-react';
import { ProjectData, PlanEdition } from '../types';
import { DEVELOPMENT_STRATEGIES, DEPARTMENTS } from '../utils/constants';
import { matchesProjectSearch } from '../utils/projectCode';

interface PlanSelectCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: ProjectData[];
  edition: PlanEdition; // 'changed' or 'amended'
  onSelectCandidate: (candidateProject: ProjectData) => void;
}

export const PlanSelectCandidateModal: React.FC<PlanSelectCandidateModalProps> = ({
  isOpen,
  onClose,
  projects,
  edition,
  onSelectCandidate
}) => {
  if (!isOpen) return null;

  const isChanged = edition === 'changed';
  const actionLabel = isChanged ? 'เปลี่ยนแปลง' : 'แก้ไข';

  // Filters state inside candidate modal
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedStrategy, setSelectedStrategy] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedSourceEdition, setSelectedSourceEdition] = useState<'all' | 'first' | 'additional'>('all');

  // Candidates must come from 'first' (ฉบับแรก) or 'additional' (ฉบับเพิ่มเติม)
  const candidateProjects = useMemo(() => {
    return projects.filter(
      (p) => p.edition === 'first' || p.edition === 'additional'
    );
  }, [projects]);

  // Apply filters
  const filteredCandidates = useMemo(() => {
    return candidateProjects.filter((p) => {
      // Source edition filter
      if (selectedSourceEdition !== 'all' && p.edition !== selectedSourceEdition) {
        return false;
      }
      // Strategy filter
      if (selectedStrategy && p.planStrategy !== selectedStrategy) {
        return false;
      }
      // Department filter
      if (selectedDepartment && p.department !== selectedDepartment) {
        return false;
      }
      // Keyword filter
      if (searchKeyword.trim()) {
        if (!matchesProjectSearch(searchKeyword, p)) return false;
      }
      return true;
    });
  }, [
    candidateProjects,
    selectedSourceEdition,
    selectedStrategy,
    selectedDepartment,
    searchKeyword
  ]);

  const get5YearTotal = (p: ProjectData) => {
    return (
      (p.budgetByYear?.['2571'] || 0) +
      (p.budgetByYear?.['2572'] || 0) +
      (p.budgetByYear?.['2573'] || 0) +
      (p.budgetByYear?.['2574'] || 0) +
      (p.budgetByYear?.['2575'] || 0) || p.budgetPlan
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-hidden">
      <div
        id="modal-select-candidate"
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200"
      >
        {/* 1. Modal Header - Dark Green Matching Screenshot */}
        <div className="bg-[#055740] px-6 py-4 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#034131] border border-emerald-600/50 flex items-center justify-center text-emerald-300 shadow-inner">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
                  เลือกโครงการในแผน เพื่อขออนุมัติ{actionLabel}
                </h2>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-emerald-400/40 bg-emerald-800/60 text-emerald-200">
                  แบบ ผ.02 บัญชีเปรียบเทียบ
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 mt-0.5 font-light">
                เลือกโครงการจาก แผนพัฒนาท้องถิ่น (ฉบับแรก) หรือ แผนพัฒนาท้องถิ่น (ฉบับเพิ่มเติม) เพื่อดึงข้อมูลตั้งต้นเข้าสู่ฟอร์ม
              </p>
            </div>
          </div>

          <button
            id="btn-close-select-candidate-modal"
            onClick={onClose}
            className="p-1.5 text-emerald-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 min-h-0 bg-slate-50/50">
          {/* Info Alert Box */}
          <div className="bg-emerald-50/90 border border-emerald-200 rounded-xl p-3.5 flex items-start gap-3 shadow-2xs">
            <Info className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 leading-relaxed">
              <span className="font-bold text-emerald-900">
                แนวทางปฏิบัติการ{actionLabel}แผนพัฒนาท้องถิ่น:{' '}
              </span>
              นำโครงการที่มีอยู่ในแผนพัฒนาท้องถิ่นมาปรับปรุงสาระสำคัญ (เช่น ปรับเพิ่ม/ลดงบประมาณ, เปลี่ยนแปลงเป้าหมาย หรือวัตถุประสงค์) ระบบจะดึงข้อมูลโครงการเดิมเข้าสู่แบบบัญชีเปรียบเทียบ (เดิม vs ใหม่) ให้อัตโนมัติ
            </div>
          </div>

          {/* 4-Column Filter Grid */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Filter 1: ค้นหาโครงการ */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  ค้นหาโครงการ
                </label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder="ค้นหาชื่อโครงการ..."
                    className="w-full text-xs border border-slate-300 rounded-lg pl-8 pr-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>
              </div>

              {/* Filter 2: ยุทธศาสตร์ / ประเด็นการพัฒนา */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  ยุทธศาสตร์ / ประเด็นการพัฒนา
                </label>
                <select
                  value={selectedStrategy}
                  onChange={(e) => setSelectedStrategy(e.target.value)}
                  title={selectedStrategy || '-- ทุกยุทธศาสตร์/ประเด็นการพัฒนา --'}
                  className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-2 bg-white text-slate-700 truncate focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="">-- ทุกยุทธศาสตร์/ประเด็นการพัฒนา --</option>
                  {DEVELOPMENT_STRATEGIES.map((s, idx) => (
                    <option key={idx} value={s} title={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter 3: หน่วยงานรับผิดชอบหลัก */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  หน่วยงานรับผิดชอบหลัก
                </label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  title={selectedDepartment || '-- ทุกหน่วยงานรับผิดชอบ --'}
                  className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-2 bg-white text-slate-700 truncate focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="">-- ทุกหน่วยงานรับผิดชอบ --</option>
                  {DEPARTMENTS.map((d, idx) => (
                    <option key={idx} value={d} title={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter 4: แผนพัฒนาท้องถิ่นฉบับต้นทาง */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  แผนพัฒนาท้องถิ่นฉบับต้นทาง
                </label>
                <select
                  value={selectedSourceEdition}
                  onChange={(e) =>
                    setSelectedSourceEdition(e.target.value as 'all' | 'first' | 'additional')
                  }
                  title={selectedSourceEdition === 'all' ? 'จากทุกฉบับ (ฉบับแรก + เพิ่มเติม)' : selectedSourceEdition === 'first' ? 'แผนพัฒนาท้องถิ่น (ฉบับแรก)' : 'แผนพัฒนาท้องถิ่น (ฉบับเพิ่มเติม)'}
                  className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-2 bg-white text-slate-700 truncate focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="all">จากทุกฉบับ (ฉบับแรก + เพิ่มเติม)</option>
                  <option value="first">แผนพัฒนาท้องถิ่น (ฉบับแรก)</option>
                  <option value="additional">แผนพัฒนาท้องถิ่น (ฉบับเพิ่มเติม)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Result count line */}
          <div className="flex items-center justify-between text-xs text-slate-600 px-1">
            <span className="font-medium">
              ผลการค้นหา:{' '}
              <strong className="text-emerald-700 font-bold">
                {filteredCandidates.length}
              </strong>{' '}
              โครงการ
            </span>
          </div>

          {/* 3. Project Cards List */}
          <div className="space-y-3">
            {filteredCandidates.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
                ไม่พบโครงการที่สามารถนำมา{actionLabel}ได้ตามเงื่อนไขที่ค้นหา
              </div>
            ) : (
              filteredCandidates.map((project, idx) => {
                const total5Years = get5YearTotal(project);
                const isAdditional = project.edition === 'additional';

                return (
                  <div
                    key={project.id}
                    className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-2xs hover:border-emerald-300 hover:shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    {/* Left Info */}
                    <div className="space-y-2 flex-1 min-w-0">
                      {/* Top row tags */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-xs font-semibold">
                          #{project.orderNumber || idx + 1}
                        </span>

                        {isAdditional ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 text-xs font-semibold">
                            เพิ่มเติม
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">
                            ฉบับแรก
                          </span>
                        )}

                        <span
                          className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs truncate max-w-[280px]"
                          title={project.planStrategy}
                        >
                          {project.planStrategy}
                        </span>

                        <span className="text-xs text-slate-400">
                          {project.planCategory}
                        </span>
                      </div>

                      {/* Project Name */}
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                        <span>{project.name}</span>
                      </h3>

                      {/* Objective & Target */}
                      <div className="space-y-1 text-xs text-slate-600">
                        <div>
                          <span className="font-semibold text-slate-500">
                            วัตถุประสงค์:{' '}
                          </span>
                          <span>{project.objective || '-'}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-500">
                            เป้าหมาย:{' '}
                          </span>
                          <span>{project.target || '-'}</span>
                        </div>
                      </div>

                      {/* Meta Footer */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            หน่วยงาน:{' '}
                            <strong className="text-slate-700 font-medium">
                              {project.department}
                            </strong>
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            งบประมาณรวม 5 ปี:{' '}
                            <strong className="text-emerald-700 font-mono font-bold">
                              {total5Years.toLocaleString()} บาท
                            </strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Button */}
                    <div className="shrink-0 pt-2 md:pt-0 flex items-center justify-end">
                      <button
                        onClick={() => onSelectCandidate(project)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#055740] hover:bg-[#034131] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                        <span>เลือกโครงการนี้</span>
                        <ArrowRight className="w-4 h-4 text-emerald-200" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 4. Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <span className="text-xs text-slate-500">
            เมื่อเลือกโครงการ ระบบจะเปิดฟอร์มเปรียบเทียบข้อมูลเดิมและบันทึกเป็นฉบับ{actionLabel}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-lg transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
