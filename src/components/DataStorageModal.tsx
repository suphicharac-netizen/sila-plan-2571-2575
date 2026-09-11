import React, { useState } from 'react';
import { Database, X, RefreshCw, Download, Upload, Check, AlertTriangle } from 'lucide-react';
import { ProjectData } from '../types';
import { storageService } from '../services/storage';

interface DataStorageModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: ProjectData[];
  onDataUpdated: (newProjects: ProjectData[]) => void;
}

export const DataStorageModal: React.FC<DataStorageModalProps> = ({
  isOpen,
  onClose,
  projects,
  onDataUpdated
}) => {
  const [copied, setCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleReset = () => {
    if (confirm('คุณต้องการรีเซ็ตข้อมูลทั้งหมดกลับเป็นชุดตั้งต้นตามแผนปี 2571 (9 โครงการ ฿7,200,000) หรือไม่?')) {
      const initial = storageService.resetToInitial();
      onDataUpdated(initial);
      setStatusMessage('รีเซ็ตข้อมูลตั้งต้นสำเร็จเรียบร้อยแล้ว');
      setTimeout(() => setStatusMessage(null), 3500);
    }
  };

  const handleDownloadJSON = () => {
    const jsonStr = storageService.exportJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sila_digital_plan_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusMessage('ส่งออกไฟล์ข้อมูล JSON สำเร็จ');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const imported = storageService.importJSON(content);
      if (imported) {
        onDataUpdated(imported);
        setStatusMessage(`นำเข้าข้อมูลสำเร็จ (${imported.length} รายการ)`);
      } else {
        alert('รูปแบบไฟล์ JSON ไม่ถูกต้อง');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div
      id="storage-management-modal"
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-hidden"
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 bg-[#055740] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-emerald-300" />
            <h3 className="text-base font-bold">สำรองและจัดการฐานข้อมูล (IndexedDB / LocalStorage)</h3>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-100 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4 text-xs text-slate-700 flex-1 min-h-0 overflow-y-auto">
          {statusMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
            <div className="font-semibold text-slate-900 text-sm">
              สถานะการจัดเก็บข้อมูลในเบราว์เซอร์
            </div>
            <div className="text-slate-600">
              จำนวนโครงการที่บันทึกในฐานข้อมูลเครื่องนี้: <strong className="text-emerald-700">{projects.length} รายการ</strong>
            </div>
            <div className="text-slate-500 text-[11px]">
              * ข้อมูลจัดเก็บผ่าน HTML5 LocalStorage & IndexedDB ทำงานได้ทั้งบน Google AI Studio และ GitHub Pages
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <div className="font-semibold text-slate-800">การจัดการข้อมูล:</div>

            {/* Force Reset to Initial Data button */}
            <div className="p-3 border border-amber-200 bg-amber-50/70 rounded-lg flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold text-amber-900">
                  ซิงค์ข้อมูลตั้งต้น (Force Sync Initial Data)
                </div>
                <div className="text-amber-700 text-[11px] mt-0.5">
                  หากข้อมูลบน GitHub Pages ไม่ตรงกับระบบ ให้กดปุ่มนี้เพื่อโหลดข้อมูลตั้งต้นล่าสุด 9 โครงการ (งบ ฿7,200,000)
                </div>
                <button
                  id="btn-force-reset-data"
                  onClick={handleReset}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-md shadow-xs transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>รีเซ็ตและโหลดข้อมูลตั้งต้นใหม่</span>
                </button>
              </div>
            </div>

            {/* Export & Import */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                id="btn-export-backup"
                onClick={handleDownloadJSON}
                className="flex items-center justify-center gap-2 p-3 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 font-medium transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>สำรองข้อมูล (JSON)</span>
              </button>

              <label className="flex items-center justify-center gap-2 p-3 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 font-medium transition-colors cursor-pointer">
                <Upload className="w-4 h-4 text-blue-600" />
                <span>กู้คืนข้อมูล (JSON)</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
