import React, { useState, useRef } from 'react';
import { X, UploadCloud, FileSpreadsheet, CheckCircle2, AlertTriangle, ArrowRight, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { ProjectData, PlanEdition } from '../types';
import { DEVELOPMENT_STRATEGIES, MUNICIPAL_STRATEGIES, DEPARTMENTS } from '../utils/constants';
import { PLAN_CATEGORIES } from '../data/initialData';
import { generateStandardProjectCode } from '../utils/projectCode';

interface Plan02ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  edition: PlanEdition;
  editionTitle: string;
  onImport: (newProjects: ProjectData[]) => void;
}

export const Plan02ImportModal: React.FC<Plan02ImportModalProps> = ({
  isOpen,
  onClose,
  edition,
  editionTitle,
  onImport
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>('');
  const [parsedProjects, setParsedProjects] = useState<ProjectData[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setFileName(file.name);
    setIsProcessing(true);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (rawRows.length < 2) {
        setErrorMsg('ไม่พบข้อมูลในไฟล์ Excel ที่เลือก');
        setIsProcessing(false);
        return;
      }

      // Find the header row (look for 'โครงการ' or 'ชื่อโครงการ')
      let headerRowIdx = -1;
      for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
        const row = rawRows[i];
        if (row && row.some((cell: any) => typeof cell === 'string' && (cell.includes('โครงการ') || cell.includes('วัตถุประสงค์')))) {
          headerRowIdx = i;
          break;
        }
      }

      if (headerRowIdx === -1) {
        // Fallback to row 0 or 4
        headerRowIdx = rawRows.length > 4 ? 4 : 0;
      }

      const headers = rawRows[headerRowIdx].map((h: any) => String(h || '').trim());
      const findColIdx = (keywords: string[]) => {
        return headers.findIndex((h: string) => keywords.some((kw) => h.includes(kw)));
      };

      const nameIdx = findColIdx(['โครงการ', 'ชื่อโครงการ', 'รายการ']);
      const planStratIdx = findColIdx(['ประเด็นการพัฒนา', 'ประเด็น']);
      const stratIdx = findColIdx(['ยุทธศาสตร์']);
      const objIdx = findColIdx(['วัตถุประสงค์']);
      const targetIdx = findColIdx(['เป้าหมาย', 'ผลผลิต']);
      const b71Idx = findColIdx(['2571']);
      const b72Idx = findColIdx(['2572']);
      const b73Idx = findColIdx(['2573']);
      const b74Idx = findColIdx(['2574']);
      const b75Idx = findColIdx(['2575']);
      const expIdx = findColIdx(['ผลที่คาดว่าจะได้รับ', 'ผลลัพธ์']);
      const deptIdx = findColIdx(['หน่วยงาน', 'กอง']);
      const reasonIdx = findColIdx(['เหตุผลความจำเป็น', 'เหตุผล', 'หมายเหตุ']);

      if (nameIdx === -1) {
        setErrorMsg('ไม่พบคอลัมน์ "โครงการ" หรือ "ชื่อโครงการ" ในไฟล์ Excel โปรดตรวจสอบหัวตาราง');
        setIsProcessing(false);
        return;
      }

      const projectsToAdd: ProjectData[] = [];
      const dataRows = rawRows.slice(headerRowIdx + 1);

      dataRows.forEach((row, rIdx) => {
        const pName = String(row[nameIdx] || '').trim();
        // Skip empty rows or summary rows like 'รวมงบประมาณทั้งสิ้น'
        if (!pName || pName.includes('รวมงบประมาณ') || pName.includes('รวมทั้งสิ้น')) {
          return;
        }

        const b71 = Number(String(row[b71Idx] || 0).replace(/,/g, '')) || 0;
        const b72 = Number(String(row[b72Idx] || 0).replace(/,/g, '')) || 0;
        const b73 = Number(String(row[b73Idx] || 0).replace(/,/g, '')) || 0;
        const b74 = Number(String(row[b74Idx] || 0).replace(/,/g, '')) || 0;
        const b75 = Number(String(row[b75Idx] || 0).replace(/,/g, '')) || 0;
        const total = b71 + b72 + b73 + b74 + b75;

        const strat = planStratIdx !== -1 && row[planStratIdx] ? String(row[planStratIdx]).trim() : DEVELOPMENT_STRATEGIES[0];
        const strategyVal = stratIdx !== -1 && row[stratIdx] ? String(row[stratIdx]).trim() : undefined;
        const obj = objIdx !== -1 && row[objIdx] ? String(row[objIdx]).trim() : '';
        const tgt = targetIdx !== -1 && row[targetIdx] ? String(row[targetIdx]).trim() : '';
        const exp = expIdx !== -1 && row[expIdx] ? String(row[expIdx]).trim() : '';
        const dept = deptIdx !== -1 && row[deptIdx] ? String(row[deptIdx]).trim() : DEPARTMENTS[2]; // Default: กองช่าง
        const rsn = reasonIdx !== -1 && row[reasonIdx] ? String(row[reasonIdx]).trim() : undefined;

        const newP: ProjectData = {
          id: `PRJ-IMPORT-${Date.now()}-${rIdx}-${Math.floor(Math.random() * 1000)}`,
          orderNumber: rIdx + 1,
          code: generateStandardProjectCode(strat, PLAN_CATEGORIES[0], rIdx + 1),
          name: pName,
          planStrategy: strat,
          strategy: strategyVal,
          planCategory: PLAN_CATEGORIES[0],
          edition,
          editionNumber: 1,
          publishStatus: 'pending_publish',
          objective: obj,
          target: tgt,
          expectedResults: exp,
          budgetByYear: {
            '2571': b71,
            '2572': b72,
            '2573': b73,
            '2574': b74,
            '2575': b75
          },
          budgetPlan: total,
          budgetSource: '- ยังไม่ได้จัดสรร -',
          budgetApproved: 0,
          approvedDate: '-',
          status: 'pending',
          department: dept,
          year: '2571',
          reason: rsn
        };

        projectsToAdd.push(newP);
      });

      if (projectsToAdd.length === 0) {
        setErrorMsg('ไม่พบแถวข้อมูลโครงการที่สามารถนำเข้าได้');
      } else {
        setParsedProjects(projectsToAdd);
      }
    } catch (err: any) {
      setErrorMsg(`เกิดข้อผิดพลาดในการอ่านไฟล์: ${err.message || String(err)}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmImport = () => {
    if (parsedProjects.length === 0) return;
    onImport(parsedProjects);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-hidden animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-[#055740] text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#044432] border border-emerald-500/40 flex items-center justify-center text-emerald-300">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                นำเข้าข้อมูลโครงการจากไฟล์ Excel (ผ.02)
              </h2>
              <p className="text-xs text-emerald-200">
                นำเข้าสู่: {editionTitle} • เทศบาลเมืองศิลา
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-emerald-200 hover:text-white hover:bg-[#066f52] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-sm text-slate-800">
          {/* File Picker Area */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileChange}
            className="hidden"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50/70 rounded-2xl p-6 text-center cursor-pointer transition-all group"
          >
            <FileSpreadsheet className="w-12 h-12 text-emerald-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <div className="font-bold text-slate-800 text-base">
              {fileName ? `ไฟล์ที่เลือก: ${fileName}` : 'คลิกเพื่อเลือกไฟล์ Excel (.xlsx, .xls) หรือลากไฟล์มาวาง'}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              รองรับไฟล์ Excel มาตรฐานแบบ ผ.02 ที่มีคอลัมน์ โครงการ, ประเด็นการพัฒนา, งบประมาณ 5 ปี
            </p>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Preview of Parsed Projects */}
          {parsedProjects.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>ตรวจสอบพบข้อมูลโครงการพร้อมนำเข้า ({parsedProjects.length} รายการ)</span>
                </span>
                <span className="text-xs text-slate-500">
                  งบประมาณรวม:{' '}
                  <strong className="text-emerald-700 font-mono">
                    {parsedProjects.reduce((s, p) => s + p.budgetPlan, 0).toLocaleString()} บาท
                  </strong>
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto divide-y divide-slate-100 text-xs">
                {parsedProjects.map((p, idx) => (
                  <div key={idx} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                    <div className="min-w-0 flex-1 pr-3">
                      <div className="font-bold text-slate-900 truncate">{idx + 1}. {p.name}</div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {p.planStrategy} • {p.department}
                      </div>
                    </div>
                    <div className="font-mono font-bold text-emerald-700 text-right shrink-0">
                      {p.budgetPlan > 0 ? `${p.budgetPlan.toLocaleString()} บ.` : '-'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
          >
            ยกเลิก
          </button>

          {parsedProjects.length > 0 ? (
            <button
              type="button"
              onClick={handleConfirmImport}
              className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>ยืนยันการนำเข้า {parsedProjects.length} โครงการ</span>
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="px-5 py-2 bg-slate-200 text-slate-400 rounded-xl text-xs font-bold cursor-not-allowed"
            >
              โปรดเลือกไฟล์ Excel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
