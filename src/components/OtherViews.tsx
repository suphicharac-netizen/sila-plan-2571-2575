import React from 'react';
import {
  LayoutDashboard,
  FileText,
  FilePlus,
  FileCode,
  FileEdit,
  CheckCircle2,
  Activity,
  BarChart3,
  Search,
  ArrowLeft,
  Building2,
  Calendar,
  Layers,
  Coins,
  MapPin
} from 'lucide-react';
import { ActiveNavMenu, ProjectData } from '../types';

interface OtherViewsProps {
  activeMenu: ActiveNavMenu;
  projects: ProjectData[];
  onNavigateToBudgetApproval: () => void;
  onOpenApprovalModal: (project: ProjectData) => void;
}

export const OtherViews: React.FC<OtherViewsProps> = ({
  activeMenu,
  projects,
  onNavigateToBudgetApproval,
  onOpenApprovalModal
}) => {
  // Title mapping
  const titles: Record<ActiveNavMenu, { title: string; subtitle: string; icon: React.ReactNode }> = {
    dashboard: {
      title: 'แดชบอร์ดภาพรวมแผนพัฒนา 5 ปี (พ.ศ. 2571-2575)',
      subtitle: 'สรุปสถานะโครงการ งบประมาณรายจ่าย และสถิติการดำเนินงานของเทศบาลเมืองศิลา',
      icon: <LayoutDashboard className="w-5 h-5 text-emerald-600" />
    },
    edition_first: {
      title: 'แผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575) ฉบับแรก',
      subtitle: 'รายการโครงการตามแผนพัฒนาท้องถิ่น ฉบับแรกที่ผ่านการอนุมัติและประกาศใช้',
      icon: <FileText className="w-5 h-5 text-emerald-600" />
    },
    edition_additional: {
      title: 'แผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575) ฉบับเพิ่มเติม',
      subtitle: 'รายการโครงการที่บรรจุเพิ่มเติมเพื่อตอบสนองความจำเป็นเร่งด่วนของประชาชน',
      icon: <FilePlus className="w-5 h-5 text-emerald-600" />
    },
    edition_changed: {
      title: 'แผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575) ฉบับเปลี่ยนแปลง',
      subtitle: 'รายการโครงการที่มีการเปลี่ยนแปลงรายละเอียด แบบรูปรายการ หรือสถานที่ดำเนินการ',
      icon: <FileCode className="w-5 h-5 text-emerald-600" />
    },
    edition_amended: {
      title: 'แผนพัฒนาท้องถิ่น (พ.ศ. 2571-2575) ฉบับแก้ไข',
      subtitle: 'รายการโครงการที่มีการแก้ไขข้อความ คำผิด หรือรายละเอียดงบประมาณโดยอำนาจผู้บริหาร',
      icon: <FileEdit className="w-5 h-5 text-emerald-600" />
    },
    approve_plan: {
      title: 'ระบบอนุมัติและประกาศใช้แผนพัฒนาท้องถิ่น',
      subtitle: 'ขั้นตอนการตรวจสอบ การลงนามประกาศใช้ และการจัดรอบประกาศในราชกิจจานุเบกษา/เทศบาล',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />
    },
    budget_approval: {
      title: 'ระบบอนุมัติงบประมาณ',
      subtitle: 'จัดสรรและอนุมัติงบประมาณรายจ่ายโครงการ',
      icon: <Coins className="w-5 h-5 text-emerald-600" />
    },
    project_tracking: {
      title: 'ระบบติดตามและประเมินผลโครงการ (แผน ผ.03)',
      subtitle: 'ความก้าวหน้าการจัดซื้อจัดจ้าง ผลการเบิกจ่าย และการประเมินผลสัมฤทธิ์',
      icon: <Activity className="w-5 h-5 text-emerald-600" />
    },
    report_plan: {
      title: 'รายงานแผนพัฒนาท้องถิ่น (ผ.01 / ผ.02 / ผ.03)',
      subtitle: 'ส่งออกรายงานทางการและแบบพิมพ์ตามระเบียบกระทรวงมหาดไทย',
      icon: <BarChart3 className="w-5 h-5 text-emerald-600" />
    },
    project_search: {
      title: 'ระบบสืบค้นและคัดกรองโครงการอัจฉริยะ',
      subtitle: 'ค้นหาโครงการตามยุทธศาสตร์ แผนงาน พิกัดชุมชน และงบประมาณ',
      icon: <Search className="w-5 h-5 text-emerald-600" />
    },
    village_plan: {
      title: 'แผนพัฒนารายหมู่บ้าน (Zone Hierarchy)',
      subtitle: 'โครงสร้างการกระจายโครงการและงบประมาณระดับเขตและหมู่บ้าน (28 หมู่บ้าน 3 เขต)',
      icon: <MapPin className="w-5 h-5 text-emerald-600" />
    }
  };

  const current = titles[activeMenu] || titles.dashboard;

  // Filter projects if viewing a specific edition
  let filteredList = projects;
  if (activeMenu === 'edition_first') {
    filteredList = projects.filter((p) => p.edition === 'first');
  } else if (activeMenu === 'edition_additional') {
    filteredList = projects.filter((p) => p.edition === 'additional');
  } else if (activeMenu === 'edition_changed') {
    filteredList = projects.filter((p) => p.edition === 'changed');
  } else if (activeMenu === 'edition_amended') {
    filteredList = projects.filter((p) => p.edition === 'amended');
  }

  const totalBudget = filteredList.reduce((sum, p) => sum + (p.budgetPlan || 0), 0);
  const approvedBudget = filteredList.reduce((sum, p) => sum + (p.budgetApproved || 0), 0);

  return (
    <div className="flex-1 flex flex-col bg-slate-50 h-full min-h-0 overflow-hidden">
      {/* Top Banner Bar */}
      <header className="bg-[#055740] text-white px-4 py-2 sm:px-6 shadow-sm flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-[#086d50] flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4 text-emerald-100" />
          </div>
          <h1 className="text-xs sm:text-sm font-bold tracking-tight">
            {current.title} | เทศบาลเมืองศิลา จ.ขอนแก่น
          </h1>
        </div>

        <button
          onClick={onNavigateToBudgetApproval}
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#086d50] hover:bg-[#0a8260] text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>กลับไปหน้าอนุมัติงบประมาณ</span>
        </button>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-4">
        {/* Header Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-100 shrink-0">
              {current.icon}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">{current.title}</h2>
              <p className="text-xs text-slate-500 mt-0.5">{current.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onNavigateToBudgetApproval}
              className="px-3.5 py-1.5 bg-[#059669] hover:bg-[#047857] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              เปิดหน้าอนุมัติงบประมาณ
            </button>
          </div>
        </div>

        {/* Dashboard KPIs if in dashboard */}
        {activeMenu === 'dashboard' ? (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-xs text-slate-500">โครงการทั้งหมด (ปี 2571)</div>
                <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
                  {projects.length} โครงการ
                </div>
                <div className="text-[11px] text-emerald-600 mt-1">บรรจุในแผนพัฒนาแล้ว</div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-xs text-slate-500">งบประมาณตามแผนรวม</div>
                <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
                  ฿{projects.reduce((s, p) => s + p.budgetPlan, 0).toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">ปีงบประมาณ พ.ศ. 2571</div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-xs text-slate-500">อนุมัติงบประมาณแล้ว</div>
                <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">
                  ฿{projects.reduce((s, p) => s + p.budgetApproved, 0).toLocaleString()}
                </div>
                <div className="text-[11px] text-emerald-600 mt-1">
                  {projects.filter((p) => p.status === 'approved').length} โครงการ
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-xs text-slate-500">งบคงเหลือรอจัดสรร</div>
                <div className="text-2xl font-bold font-mono text-blue-700 mt-1">
                  ฿
                  {(
                    projects.reduce((s, p) => s + p.budgetPlan, 0) -
                    projects.reduce((s, p) => s + p.budgetApproved, 0)
                  ).toLocaleString()}
                </div>
                <div className="text-[11px] text-blue-600 mt-1">
                  {projects.filter((p) => p.status === 'pending').length} โครงการรอจัดสรร
                </div>
              </div>
            </div>

            {/* List Preview */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
              <h3 className="font-bold text-slate-900 text-sm mb-3">
                รายการโครงการล่าสุดตามแผนพัฒนา
              </h3>
              <div className="divide-y divide-slate-100 text-xs">
                {projects.slice(0, 5).map((p) => (
                  <div key={p.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800">{p.name}</span>
                      <div className="text-slate-500 text-[11px]">
                        {p.department} • {p.planCategory}
                      </div>
                    </div>
                    <div className="font-mono font-semibold text-slate-900">
                      ฿{p.budgetPlan.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Table View for Editions / Reports */
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-600">
                พบรายการในหมวดนี้: <strong>{filteredList.length} โครงการ</strong> | งบรวม:{' '}
                <strong className="text-slate-900">฿{totalBudget.toLocaleString()}</strong>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#054e3b] text-white font-semibold">
                    <th className="py-3 px-3 text-center w-12">ลำดับ</th>
                    <th className="py-3 px-4">ชื่อโครงการ</th>
                    <th className="py-3 px-3">แผนงาน</th>
                    <th className="py-3 px-3 text-right">งบตามแผน</th>
                    <th className="py-3 px-3 text-center">สถานะงบประมาณ</th>
                    <th className="py-3 px-3 text-center">หน่วยงาน</th>
                    <th className="py-3 px-3 text-center">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredList.map((p, idx) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-3 px-4 font-medium text-slate-900">{p.name}</td>
                      <td className="py-3 px-3 text-slate-600">{p.planCategory}</td>
                      <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900">
                        {p.budgetPlan > 0 ? `฿${p.budgetPlan.toLocaleString()}` : '-'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {p.status === 'approved' ? (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[11px] font-medium">
                            อนุมัติแล้ว
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full text-[11px] font-medium">
                            ยังไม่อนุมัติ
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">{p.department}</td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => {
                            onOpenApprovalModal(p);
                          }}
                          className="px-2.5 py-1 text-xs text-emerald-700 hover:bg-emerald-50 rounded-md font-medium cursor-pointer"
                        >
                          จัดการงบ
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
