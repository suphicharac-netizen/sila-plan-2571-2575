import React, { useState } from 'react';
import { Printer, X, Download, FileSpreadsheet, ChevronLeft, ChevronRight, Settings2 } from 'lucide-react';
import { ProjectData, PlanEdition } from '../types';

interface Plan02PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  edition: PlanEdition;
  editionTitle: string;
  projects: ProjectData[];
  fiscalYear: string;
  selectedStrategy: string;
  selectedDepartment: string;
}

export const Plan02PrintModal: React.FC<Plan02PrintModalProps> = ({
  isOpen,
  onClose,
  edition,
  editionTitle,
  projects,
  fiscalYear,
  selectedStrategy,
  selectedDepartment
}) => {
  const [itemsPerPage, setItemsPerPage] = useState<number>(5);

  if (!isOpen) return null;

  // Split projects into pages for A4 Landscape
  const pages: ProjectData[][] = [];
  for (let i = 0; i < projects.length; i += itemsPerPage) {
    pages.push(projects.slice(i, i + itemsPerPage));
  }
  if (pages.length === 0) {
    pages.push([]);
  }

  // Calculate budget sums
  const sum2571 = projects.reduce((s, p) => s + (Number(p.budgetByYear?.['2571']) || 0), 0);
  const sum2572 = projects.reduce((s, p) => s + (Number(p.budgetByYear?.['2572']) || 0), 0);
  const sum2573 = projects.reduce((s, p) => s + (Number(p.budgetByYear?.['2573']) || 0), 0);
  const sum2574 = projects.reduce((s, p) => s + (Number(p.budgetByYear?.['2574']) || 0), 0);
  const sum2575 = projects.reduce((s, p) => s + (Number(p.budgetByYear?.['2575']) || 0), 0);
  const grandTotal = sum2571 + sum2572 + sum2573 + sum2574 + sum2575;

  const handlePrint = () => {
    window.print();
  };

  const getEditionSubtitle = () => {
    if (edition === 'first') {
      return 'แผนพัฒนาท้องถิ่น (พ.ศ. 2571 - 2575)';
    }
    const pWithEd = projects.find((p) => p.editionNumber);
    const editionNum = pWithEd?.editionNumber || 1;
    const yearStr = fiscalYear !== 'all' ? fiscalYear : pWithEd?.year || '2571';

    if (edition === 'additional') {
      return `แผนพัฒนาท้องถิ่น (พ.ศ. 2571 - 2575) เพิ่มเติม ครั้งที่ ${editionNum}/${yearStr}`;
    }
    if (edition === 'changed') {
      return `แผนพัฒนาท้องถิ่น (พ.ศ. 2571 - 2575) เปลี่ยนแปลง ครั้งที่ ${editionNum}/${yearStr}`;
    }
    if (edition === 'amended') {
      return `แผนพัฒนาท้องถิ่น (พ.ศ. 2571 - 2575) แก้ไข ครั้งที่ ${editionNum}/${yearStr}`;
    }
    return `แผนพัฒนาท้องถิ่น (พ.ศ. 2571 - 2575) (${editionTitle})`;
  };

  return (
    <div
      id="modal-plan02-print-container"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex flex-col justify-between overflow-hidden animate-in fade-in duration-150 print:p-0 print:bg-white print:static"
    >
      {/* Top Action Bar (Hidden on print) */}
      <div className="bg-slate-900 text-white px-4 py-3 sm:px-6 flex items-center justify-between shadow-lg shrink-0 print:hidden z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-600/30 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>พิมพ์แบบ ผ.02 (จัดหน้ากระดาษ A4 แนวนอน)</span>
              <span className="text-xs font-semibold bg-emerald-700/80 text-emerald-200 px-2.5 py-0.5 rounded-full border border-emerald-500/40">
                A4 Landscape
              </span>
            </h2>
            <p className="text-xs text-slate-300">
              คำนวณการแบ่งหน้าอัตโนมัติ ({pages.length} หน้า) • รวม {projects.length} โครงการ • เทศบาลเมืองศิลา
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Items per page selector */}
          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-300 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
            <span>จำนวนต่อหน้า:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="bg-slate-900 text-white font-semibold rounded px-2 py-0.5 outline-none cursor-pointer"
            >
              <option value={4}>4 โครงการ / หน้า</option>
              <option value={5}>5 โครงการ / หน้า (แนะนำ)</option>
              <option value={6}>6 โครงการ / หน้า</option>
              <option value={8}>8 โครงการ / หน้า</option>
              <option value={10}>10 โครงการ / หน้า</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl shadow-md transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>สั่งพิมพ์ (A4 แนวนอน)</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Sheet Preview Container (Scrollable on screen, 100% printed) */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-800/60 print:bg-white print:p-0 print:overflow-visible">
        <div className="max-w-[297mm] mx-auto space-y-8 print:space-y-0 print:max-w-none">
          {pages.map((pageProjects, pageIndex) => {
            const isLastPage = pageIndex === pages.length - 1;
            const startIdx = pageIndex * itemsPerPage;

            return (
              <div
                key={pageIndex}
                className="bg-white text-black p-8 sm:p-10 shadow-2xl rounded-xl border border-slate-300 print:border-none print:shadow-none print:rounded-none print:p-0 print:m-0 w-full min-h-[210mm] flex flex-col justify-between"
                style={{
                  pageBreakAfter: isLastPage ? 'auto' : 'always',
                  breakAfter: isLastPage ? 'auto' : 'page',
                }}
              >
                {/* 1. Header of Form ผ.02 */}
                <div>
                  <div className="flex justify-between items-start text-xs font-bold text-black mb-1">
                    <span className="text-slate-600 font-normal">
                      {fiscalYear !== 'all' ? `ปีงบประมาณ พ.ศ. ${fiscalYear}` : 'ปีงบประมาณ พ.ศ. 2571-2575'}
                      {selectedStrategy ? ` • ยุทธศาสตร์: ${selectedStrategy}` : ''}
                      {selectedDepartment ? ` • หน่วยงาน: ${selectedDepartment}` : ''}
                    </span>
                    <span className="text-sm font-bold">แบบ ผ.02</span>
                  </div>

                  <div className="text-center space-y-1 mb-4">
                    <h2 className="text-xl font-bold tracking-tight text-black">
                      บัญชีรายละเอียดโครงการพัฒนา
                    </h2>
                    <h3 className="text-base font-bold text-black">
                      {getEditionSubtitle()}
                    </h3>
                    <p className="text-sm font-medium text-slate-800">
                      เทศบาลเมืองศิลา อำเภอเมืองขอนแก่น จังหวัดขอนแก่น
                    </p>
                  </div>

                  {/* 2. Official Table */}
                  <table className="w-full text-left border-collapse border border-black text-[12px] leading-tight">
                    <thead>
                      <tr className="bg-slate-100 text-black font-bold border-b border-black text-center">
                        <th rowSpan={2} className="border border-black px-1.5 py-2 w-[4%]">ลำดับ</th>
                        <th rowSpan={2} className="border border-black px-2 py-2 w-[16%]">โครงการ</th>
                        <th rowSpan={2} className="border border-black px-2 py-2 w-[11%]">ประเด็นการพัฒนา / ยุทธศาสตร์</th>
                        <th rowSpan={2} className="border border-black px-2 py-2 w-[12%]">วัตถุประสงค์</th>
                        <th rowSpan={2} className="border border-black px-2 py-2 w-[12%]">เป้าหมาย (ผลผลิต)</th>
                        <th colSpan={5} className="border border-black px-1 py-1.5">งบประมาณ (บาท)</th>
                        <th rowSpan={2} className="border border-black px-1.5 py-2 w-[6.5%]">รวม 5 ปี (บาท)</th>
                        <th rowSpan={2} className="border border-black px-2 py-2 w-[11%]">ผลที่คาดว่าจะได้รับ</th>
                        <th rowSpan={2} className="border border-black px-1.5 py-2 w-[7.5%]">หน่วยงานรับผิดชอบหลัก</th>
                        {edition !== 'first' && (
                          <th rowSpan={2} className="border border-black px-2 py-2 w-[8%]">เหตุผลความจำเป็น</th>
                        )}
                      </tr>
                      <tr className="bg-slate-100 text-black font-bold border-b border-black text-center text-[11px]">
                        <th className="border border-black px-1 py-1 w-[5.5%]">2571</th>
                        <th className="border border-black px-1 py-1 w-[5.5%]">2572</th>
                        <th className="border border-black px-1 py-1 w-[5.5%]">2573</th>
                        <th className="border border-black px-1 py-1 w-[5.5%]">2574</th>
                        <th className="border border-black px-1 py-1 w-[5.5%]">2575</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageProjects.length === 0 ? (
                        <tr>
                          <td colSpan={edition === 'first' ? 12 : 13} className="border border-black py-8 text-center text-slate-500">
                            ไม่มีรายการโครงการในหน้านี้
                          </td>
                        </tr>
                      ) : (
                        pageProjects.map((p, pIdx) => {
                          const globalIdx = startIdx + pIdx + 1;
                          const b71 = Number(p.budgetByYear?.['2571']) || 0;
                          const b72 = Number(p.budgetByYear?.['2572']) || 0;
                          const b73 = Number(p.budgetByYear?.['2573']) || 0;
                          const b74 = Number(p.budgetByYear?.['2574']) || 0;
                          const b75 = Number(p.budgetByYear?.['2575']) || 0;
                          const total = b71 + b72 + b73 + b74 + b75 || Number(p.budgetPlan) || 0;

                          return (
                            <tr key={p.id} className="align-top border-b border-black">
                              <td className="border border-black px-1 py-1.5 text-center font-mono font-medium">{globalIdx}</td>
                              <td className="border border-black px-2 py-1.5 font-bold leading-normal">{p.name}</td>
                              <td className="border border-black px-1.5 py-1.5 text-[11.5px] leading-snug">
                                <div className="font-semibold text-slate-900">{p.planStrategy || '-'}</div>
                                {p.strategy && (
                                  <div className="text-[10.5px] text-slate-600 mt-0.5">{p.strategy}</div>
                                )}
                              </td>
                              <td className="border border-black px-2 py-1.5 text-[11.5px] leading-snug">{p.objective || '-'}</td>
                              <td className="border border-black px-2 py-1.5 text-[11.5px] leading-snug">{p.target || '-'}</td>
                              <td className="border border-black px-1 py-1.5 text-right font-mono text-[11.5px] whitespace-nowrap">
                                {b71 > 0 ? b71.toLocaleString() : '-'}
                              </td>
                              <td className="border border-black px-1 py-1.5 text-right font-mono text-[11.5px] whitespace-nowrap">
                                {b72 > 0 ? b72.toLocaleString() : '-'}
                              </td>
                              <td className="border border-black px-1 py-1.5 text-right font-mono text-[11.5px] whitespace-nowrap">
                                {b73 > 0 ? b73.toLocaleString() : '-'}
                              </td>
                              <td className="border border-black px-1 py-1.5 text-right font-mono text-[11.5px] whitespace-nowrap">
                                {b74 > 0 ? b74.toLocaleString() : '-'}
                              </td>
                              <td className="border border-black px-1 py-1.5 text-right font-mono text-[11.5px] whitespace-nowrap">
                                {b75 > 0 ? b75.toLocaleString() : '-'}
                              </td>
                              <td className="border border-black px-1 py-1.5 text-right font-mono font-bold text-[11.5px] whitespace-nowrap">
                                {total > 0 ? total.toLocaleString() : '-'}
                              </td>
                              <td className="border border-black px-2 py-1.5 text-[11.5px] leading-snug">{p.expectedResults || '-'}</td>
                              <td className="border border-black px-1.5 py-1.5 text-center text-[11.5px] leading-snug">{p.department}</td>
                              {edition !== 'first' && (
                                <td className="border border-black px-1.5 py-1.5 text-[11px] leading-snug">
                                  {p.reason || p.note || p.planReference || '-'}
                                </td>
                              )}
                            </tr>
                          );
                        })
                      )}

                      {/* On the last page: Grand Total Summary Row */}
                      {isLastPage && (
                        <tr className="bg-slate-100 font-bold border-t-2 border-black text-[12px]">
                          <td colSpan={5} className="border border-black px-3 py-2 text-right">
                            รวมงบประมาณทั้งสิ้น ({projects.length} โครงการ)
                          </td>
                          <td className="border border-black px-1 py-2 text-right font-mono">
                            {sum2571 > 0 ? sum2571.toLocaleString() : '-'}
                          </td>
                          <td className="border border-black px-1 py-2 text-right font-mono">
                            {sum2572 > 0 ? sum2572.toLocaleString() : '-'}
                          </td>
                          <td className="border border-black px-1 py-2 text-right font-mono">
                            {sum2573 > 0 ? sum2573.toLocaleString() : '-'}
                          </td>
                          <td className="border border-black px-1 py-2 text-right font-mono">
                            {sum2574 > 0 ? sum2574.toLocaleString() : '-'}
                          </td>
                          <td className="border border-black px-1 py-2 text-right font-mono">
                            {sum2575 > 0 ? sum2575.toLocaleString() : '-'}
                          </td>
                          <td className="border border-black px-1 py-2 text-right font-mono text-emerald-950 font-black">
                            {grandTotal.toLocaleString()}
                          </td>
                          <td colSpan={edition === 'first' ? 2 : 3} className="border border-black px-2 py-2 text-center text-xs">
                            บาท
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* 3. Footer / Signatures on Last Page */}
                <div className="mt-6 pt-2">
                  {isLastPage ? (
                    <div className="grid grid-cols-3 gap-6 text-center text-xs text-black pt-4">
                      {/* 1. ผู้จัดทำแผน */}
                      <div className="space-y-1">
                        <p>(ลงชื่อ) ...........................................................</p>
                        <p className="font-bold">( ........................................................... )</p>
                        <p>ตำแหน่ง เจ้าหน้าที่วิเคราะห์นโยบายและแผน</p>
                        <p className="text-[11px] text-slate-600">ผู้จัดทำแผนพัฒนาท้องถิ่น</p>
                      </div>

                      {/* 2. ผู้เห็นชอบ */}
                      <div className="space-y-1">
                        <p>(ลงชื่อ) ...........................................................</p>
                        <p className="font-bold">( ........................................................... )</p>
                        <p>ตำแหน่ง ปลัดเทศบาลเมืองศิลา</p>
                        <p className="text-[11px] text-slate-600">ผู้เห็นชอบแผนพัฒนาท้องถิ่น</p>
                      </div>

                      {/* 3. ผู้อนุมัติ */}
                      <div className="space-y-1">
                        <p>(ลงชื่อ) ...........................................................</p>
                        <p className="font-bold">( ........................................................... )</p>
                        <p>ตำแหน่ง นายกเทศมนตรีเมืองศิลา</p>
                        <p className="text-[11px] text-slate-600">ผู้อนุมัติประกาศใช้แผนพัฒนาท้องถิ่น</p>
                      </div>
                    </div>
                  ) : null}

                  {/* Page numbering footer */}
                  <div className="flex justify-between items-center text-[11px] text-slate-500 pt-3 border-t border-slate-200 mt-4">
                    <span>เทศบาลเมืองศิลา อำเภอเมืองขอนแก่น จังหวัดขอนแก่น</span>
                    <span className="font-mono font-bold">
                      หน้า {pageIndex + 1} จาก {pages.length}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
