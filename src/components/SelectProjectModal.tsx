import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  GitCompare,
  FileEdit,
  ArrowRight,
  Filter,
  CheckCircle2,
  Building2,
  Calendar,
  Coins,
  Layers,
  Sparkles,
  Info,
  RotateCcw
} from 'lucide-react';
import { Project, OptionsData } from '../types';
import { YEARS, STANDARD_STRATEGIC_ISSUES, STANDARD_DEPARTMENTS, sortStrategicIssues } from '../data/initialData';

export interface SelectProjectModalProps {
  id?: string;
  isOpen?: boolean;
  onClose: () => void;
  allProjects?: Project[];
  projects?: Project[];
  targetPlanType: 'เปลี่ยนแปลง' | 'แก้ไข';
  options?: OptionsData;
  onSelectProject: (project: Project) => void;
}

export const SelectProjectModal: React.FC<SelectProjectModalProps> = ({
  id = 'selectProjectModal',
  isOpen = true,
  onClose,
  allProjects,
  projects,
  targetPlanType,
  options,
  onSelectProject
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceTypeFilter, setSourceTypeFilter] = useState<'all' | 'ฉบับแรก' | 'เพิ่มเติม'>('all');
  const [issueFilter, setIssueFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

  // Fallback so it safely accepts either allProjects or projects prop
  const projectList = useMemo(() => {
    if (Array.isArray(allProjects) && allProjects.length > 0) return allProjects;
    if (Array.isArray(projects) && projects.length > 0) return projects;
    return [];
  }, [allProjects, projects]);

  // Extract unique departments for filtering
  const uniqueDepartments = useMemo(() => {
    const depts = new Set<string>(options?.['หน่วยงานรับผิดชอบหลัก'] || STANDARD_DEPARTMENTS);
    projectList.forEach((p) => {
      if (p['หน่วยงานรับผิดชอบหลัก']) depts.add(p['หน่วยงานรับผิดชอบหลัก']);
    });
    return Array.from(depts).filter(Boolean).sort();
  }, [projectList, options]);

  // Extract unique issues/strategies for filtering
  const uniqueIssues = useMemo(() => {
    const issues = new Set<string>(options?.['ประเด็นการพัฒนา'] || STANDARD_STRATEGIC_ISSUES);
    projectList.forEach((p) => {
      if (p['ประเด็นการพัฒนา']) issues.add(p['ประเด็นการพัฒนา']);
    });
    return sortStrategicIssues(Array.from(issues));
  }, [projectList, options]);

  // Candidate source projects from "ฉบับแรก" and "เพิ่มเติม" (baseline or additions)
  const candidateProjects = useMemo(() => {
    return projectList.filter((p) => {
      const pType = p['ประเภทรายการ'] || 'ฉบับแรก';
      // Only baseline and additional projects can be modified or corrected
      const isValidSource = pType === 'ฉบับแรก' || pType === 'เพิ่มเติม';
      if (!isValidSource) return false;

      if (sourceTypeFilter !== 'all' && pType !== sourceTypeFilter) return false;
      if (issueFilter && p['ประเด็นการพัฒนา'] !== issueFilter) return false;
      if (departmentFilter && !(p['หน่วยงานรับผิดชอบหลัก'] || '').includes(departmentFilter)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (p['ชื่อโครงการ'] || '').toLowerCase().includes(q);
        const matchObj = (p['วัตถุประสงค์'] || '').toLowerCase().includes(q);
        const matchTarget = (p['เป้าหมาย (ผลผลิต)'] || '').toLowerCase().includes(q);
        const matchResp = (p['หน่วยงานรับผิดชอบหลัก'] || '').toLowerCase().includes(q);
        const matchId = String(p.ID) === searchQuery.trim();
        if (!matchName && !matchObj && !matchTarget && !matchResp && !matchId) return false;
      }

      return true;
    });
  }, [projectList, sourceTypeFilter, issueFilter, departmentFilter, searchQuery]);

  // Reset all search and filter conditions
  const handleResetFilters = () => {
    setSearchQuery('');
    setSourceTypeFilter('all');
    setIssueFilter('');
    setDepartmentFilter('');
  };

  if (isOpen !== undefined && !isOpen) return null;

  const isChange = targetPlanType === 'เปลี่ยนแปลง';

  const formatMoney = (n: number | undefined) => {
    const num = Number(n) || 0;
    return num > 0 ? num.toLocaleString('th-TH') : '-';
  };

  const calculateTotalBudget = (p: Project) => {
    return YEARS.reduce((sum, y) => sum + (Number(p[`งบประมาณ ${y}` as keyof Project]) || 0), 0);
  };

  return (
    <div
      id={id}
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto backdrop-blur-2xs"
    >
      <div className="bg-white rounded-xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white flex items-center justify-between border-b border-emerald-700/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white bg-[#006853] border border-emerald-400/30 shadow-xs">
              {isChange ? <GitCompare className="w-5 h-5 text-emerald-100" /> : <FileEdit className="w-5 h-5 text-emerald-100" />}
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white leading-tight flex items-center gap-2">
                <span>{isChange ? 'เลือกโครงการในแผน เพื่อขออนุมัติเปลี่ยนแปลง' : 'เลือกโครงการในแผน เพื่อขอแก้ไขข้อความ/คำผิด'}</span>
                <span className="text-[11px] font-semibold bg-white/20 text-white px-2 py-0.5 rounded-md border border-white/20">
                  แบบ ผ.02 บัญชีเปรียบเทียบ
                </span>
              </h3>
              <p className="text-[11px] text-emerald-100 mt-0.5">
                เลือกโครงการจาก <strong>แผนพัฒนาท้องถิ่น (ฉบับแรก)</strong> หรือ <strong>แผนพัฒนาท้องถิ่น (ฉบับเพิ่มเติม)</strong> เพื่อดึงข้อมูลตั้งต้นเข้าสู่ฟอร์ม
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-emerald-200 hover:text-white p-1.5 rounded-lg hover:bg-emerald-700/60 transition cursor-pointer"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Regulatory Guidance Banner */}
        <div className="p-3 bg-emerald-50/80 border-b border-emerald-200/80 flex items-start gap-2.5 text-xs text-emerald-950 shrink-0">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#006853]" />
          <div className="leading-relaxed">
            {isChange ? (
              <span>
                <strong>แนวทางปฏิบัติการเปลี่ยนแปลงแผนพัฒนาท้องถิ่น:</strong> นำโครงการที่มีอยู่ในแผนพัฒนาท้องถิ่นมาปรับปรุงสาระสำคัญ (เช่น ปรับเพิ่ม/ลดงบประมาณ, เปลี่ยนแปลงเป้าหมาย หรือวัตถุประสงค์) ระบบจะดึงข้อมูลโครงการเดิมเข้าสู่แบบบัญชีเปรียบเทียบ (เดิม vs ใหม่) ให้อัตโนมัติ
              </span>
            ) : (
              <span>
                <strong>แนวทางปฏิบัติการแก้ไขแผนพัฒนาท้องถิ่น:</strong> นำโครงการที่มีอยู่ในแผนพัฒนาท้องถิ่นมาแก้ไขข้อความที่พิมพ์ผิด หรือข้อความผิดพลาด โดยไม่กระทบต่อเป้าหมายและวัตถุประสงค์หลักของโครงการ
              </span>
            )}
          </div>
        </div>

        {/* Search & Filter Toolbar (Search Bar + Strategy + Department + Source Type Filters) */}
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 shrink-0 space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
            {/* 1. Search Bar */}
            <div className="relative">
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                ค้นหาโครงการ
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อโครงการ, วัตถุประสงค์, รหัส..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-xs rounded-lg pl-8 pr-2.5 py-1.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#006853] focus:border-transparent shadow-2xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* 2. Strategy Filter (ยุทธศาสตร์ / ประเด็นการพัฒนา) */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                ยุทธศาสตร์ / ประเด็นการพัฒนา
              </label>
              <select
                value={issueFilter}
                onChange={(e) => setIssueFilter(e.target.value)}
                className="w-full bg-white border border-slate-300 text-xs rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#006853] focus:border-transparent shadow-2xs truncate"
              >
                <option value="">-- ทุกยุทธศาสตร์/ประเด็นการพัฒนา --</option>
                {uniqueIssues.map((issue) => (
                  <option key={issue} value={issue}>
                    {issue}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Department Filter (หน่วยงานรับผิดชอบหลัก) */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                หน่วยงานรับผิดชอบหลัก
              </label>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="w-full bg-white border border-slate-300 text-xs rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#006853] focus:border-transparent shadow-2xs truncate"
              >
                <option value="">-- ทุกหน่วยงานรับผิดชอบ --</option>
                {uniqueDepartments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Plan Source Type Filter */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                แผนพัฒนาท้องถิ่นฉบับต้นทาง
              </label>
              <select
                value={sourceTypeFilter}
                onChange={(e) => setSourceTypeFilter(e.target.value as any)}
                className="w-full bg-white border border-slate-300 text-xs rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#006853] focus:border-transparent shadow-2xs"
              >
                <option value="all">จากทุกฉบับ (ฉบับแรก + เพิ่มเติม)</option>
                <option value="ฉบับแรก">เฉพาะแผนพัฒนาท้องถิ่น (ฉบับแรก)</option>
                <option value="เพิ่มเติม">เฉพาะแผนพัฒนาท้องถิ่น เพิ่มเติม</option>
              </select>
            </div>
          </div>

          {/* Status & Quick Reset Row */}
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs pt-1 border-t border-slate-200/80">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">
                ผลการค้นหา: <span className="text-[#006853] font-bold">{candidateProjects.length}</span> โครงการ
              </span>
              {(searchQuery || issueFilter || departmentFilter || sourceTypeFilter !== 'all') && (
                <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-medium">
                  กำลังกรองข้อมูล
                </span>
              )}
            </div>
            {(searchQuery || issueFilter || departmentFilter || sourceTypeFilter !== 'all') && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 px-2.5 py-1 rounded-md transition cursor-pointer shadow-2xs"
              >
                <RotateCcw className="w-3 h-3 text-slate-500" />
                <span>ล้างตัวกรองทั้งหมด</span>
              </button>
            )}
          </div>
        </div>

        {/* Project List / Selection Table */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 text-xs custom-scrollbar">
          {candidateProjects.length > 0 ? (
            <div className="space-y-2">
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                {candidateProjects.map((p, idx) => {
                  const total5Year = calculateTotalBudget(p);
                  const pType = p['ประเภทรายการ'] || 'ฉบับแรก';

                  return (
                    <div
                      key={p.ID}
                      className="p-3.5 hover:bg-slate-50/90 transition flex flex-col md:flex-row md:items-center justify-between gap-3.5 group border-l-4 border-l-transparent hover:border-l-[#006853]"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        {/* Meta Tags */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-bold text-slate-600 text-xs bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            #{p.ID}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            pType === 'ฉบับแรก'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : 'bg-teal-50 text-teal-800 border-teal-200'
                          }`}>
                            {pType}
                          </span>
                          <span className="text-[11px] text-slate-600 font-medium bg-slate-100/80 px-2 py-0.5 rounded border border-slate-200/60 truncate max-w-[280px]">
                            {p['ประเด็นการพัฒนา'] || 'ไม่ระบุประเด็น'}
                          </span>
                          {p['แผนงาน'] && (
                            <span className="text-[11px] text-slate-500 truncate max-w-[200px]">
                              {p['แผนงาน']}
                            </span>
                          )}
                        </div>

                        {/* Project Name */}
                        <h4 className="font-bold text-slate-900 text-sm group-hover:text-[#006853] transition leading-snug">
                          {p['ชื่อโครงการ']}
                        </h4>

                        {/* Objective & Target */}
                        {p['วัตถุประสงค์'] && (
                          <p className="text-xs text-slate-600 line-clamp-2">
                            <span className="font-semibold text-slate-700">วัตถุประสงค์:</span> {p['วัตถุประสงค์']}
                          </p>
                        )}
                        {p['เป้าหมาย (ผลผลิต)'] && (
                          <p className="text-[11px] text-slate-500 line-clamp-1">
                            <span className="font-medium text-slate-600">เป้าหมาย:</span> {p['เป้าหมาย (ผลผลิต)']}
                          </p>
                        )}

                        {/* Department & Budget */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 pt-1">
                          <div className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              <strong className="text-slate-700">หน่วยงาน:</strong> {p['หน่วยงานรับผิดชอบหลัก'] || '-'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Coins className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              <strong className="text-slate-700">งบประมาณรวม 5 ปี:</strong>{' '}
                              <span className="font-mono font-bold text-slate-900 text-xs">
                                {formatMoney(total5Year)} บาท
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Select Action Button - Emerald Green #006853 */}
                      <div className="flex-shrink-0 flex items-center justify-end">
                        <button
                          type="button"
                          id={`btnSelectProject_${p.ID}`}
                          onClick={() => {
                            onSelectProject(p);
                            onClose();
                          }}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#006853] hover:bg-[#005242] text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer shrink-0"
                          style={{ borderRadius: '8px', cursor: 'pointer' }}
                          title={`เลือกโครงการ #${p.ID} เพื่อดำเนินการเปลี่ยนแปลง/แก้ไข`}
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                          <span>เลือกโครงการนี้</span>
                          <ArrowRight className="w-3.5 h-3.5 text-emerald-200" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-10 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-500 space-y-2">
              <p className="font-bold text-slate-700 text-sm">ไม่พบโครงการในแผนที่ตรงกับเงื่อนไขการค้นหา</p>
              <p className="text-xs text-slate-500">
                ลองปรับเปลี่ยนคำค้นหา หรือกดปุ่ม "ล้างตัวกรองทั้งหมด" เพื่อแสดงรายการโครงการทั้งหมดในระบบ
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold shadow-2xs transition cursor-pointer"
                  style={{ borderRadius: '8px', cursor: 'pointer' }}
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>ล้างตัวกรองและค้นหาใหม่</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 shrink-0">
          <span className="text-[11px] text-slate-500">
            {isChange
              ? 'เมื่อเลือกโครงการ ระบบจะเปิดฟอร์มเปรียบเทียบข้อมูลเดิมและบันทึกเป็นฉบับเปลี่ยนแปลง'
              : 'เมื่อเลือกโครงการ ระบบจะเปิดฟอร์มเปรียบเทียบเพื่อบันทึกการแก้ไขคำผิด/ข้อความ'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-200 font-bold transition cursor-pointer shadow-2xs"
            style={{ borderRadius: '8px', cursor: 'pointer' }}
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
