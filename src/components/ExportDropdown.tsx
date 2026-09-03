import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Download,
  FileSpreadsheet,
  FileText,
  FileType,
  ChevronDown
} from 'lucide-react';

export interface ExportDropdownProps {
  onExportExcel?: () => void;
  onExportCsv?: () => void;
  onExportPdf?: () => void;
  itemsCount?: number;
  className?: string;
  buttonVariant?: 'default' | 'outline' | 'secondary' | 'compact' | 'emerald';
}

export const ExportDropdown: React.FC<ExportDropdownProps> = ({
  onExportExcel,
  onExportCsv,
  onExportPdf,
  itemsCount,
  className = '',
  buttonVariant = 'emerald'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number }>({ top: 0, right: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updateMenuPosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const right = Math.max(8, window.innerWidth - rect.right);
      const top = rect.bottom + 6;
      setMenuPosition({ top, right });
    }
  }, []);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isOpen) {
      updateMenuPosition();
    }
    setIsOpen((prev) => !prev);
  };

  // Handle outside click, scroll, resize, Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = () => {
      updateMenuPosition();
    };

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (buttonRef.current && buttonRef.current.contains(target)) {
        return;
      }
      if (menuRef.current && menuRef.current.contains(target)) {
        return;
      }
      setIsOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside, true);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, updateMenuPosition]);

  const handleSelect = (action?: () => void) => {
    setIsOpen(false);
    if (action) {
      // Small defer to let dropdown state close smoothly
      setTimeout(() => {
        try {
          action();
        } catch (err) {
          console.error('Export action execution error:', err);
        }
      }, 50);
    }
  };

  const isEmerald = buttonVariant !== 'outline';

  return (
    <div className={`relative inline-block text-left ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        data-action="export"
        onClick={handleToggle}
        className={
          isEmerald
            ? 'inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#006853] hover:bg-[#005544] active:bg-[#00473a] text-white text-xs font-medium border-0 shadow-2xs transition cursor-pointer select-none'
            : 'inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium border border-slate-300 shadow-2xs transition cursor-pointer select-none'
        }
        aria-expanded={isOpen}
        aria-haspopup="true"
        title="ส่งออกข้อมูล (Excel / CSV / PDF)"
      >
        <Download className={`w-3.5 h-3.5 shrink-0 ${isEmerald ? 'text-white' : 'text-slate-600'}`} />
        <span>ส่งออกข้อมูล</span>
        {typeof itemsCount === 'number' && (
          <span
            data-badge="export-count"
            className={`text-[11px] px-2 py-0.5 rounded-full font-medium leading-none ${
              isEmerald ? 'bg-black/20 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {itemsCount}
          </span>
        )}
        <ChevronDown
          className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
            isEmerald ? 'text-white' : 'text-slate-400'
          } ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            top: `${menuPosition.top}px`,
            right: `${menuPosition.right}px`,
            zIndex: 99999
          }}
          className="w-56 rounded-xl bg-white shadow-2xl border border-slate-200 py-1 divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100 select-none"
          role="menu"
          aria-orientation="vertical"
        >
          <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400">
            เลือกรูปแบบไฟล์ส่งออก
          </div>

          <div className="py-1">
            {onExportExcel && (
              <button
                type="button"
                onClick={() => handleSelect(onExportExcel)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition cursor-pointer text-left group"
              >
                <div className="w-6 h-6 rounded-md bg-emerald-100 group-hover:bg-emerald-200 flex items-center justify-center text-emerald-700 shrink-0 transition">
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-bold text-slate-800 group-hover:text-emerald-900">ไฟล์ Excel (.xlsx)</div>
                  <div className="text-[10px] text-slate-500">ตารางคำนวณ Microsoft Excel</div>
                </div>
              </button>
            )}

            {onExportCsv && (
              <button
                type="button"
                onClick={() => handleSelect(onExportCsv)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition cursor-pointer text-left group"
              >
                <div className="w-6 h-6 rounded-md bg-blue-100 group-hover:bg-blue-200 flex items-center justify-center text-blue-700 shrink-0 transition">
                  <FileType className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-bold text-slate-800 group-hover:text-blue-900">ไฟล์ CSV (.csv)</div>
                  <div className="text-[10px] text-slate-500">ข้อมูลคั่นด้วยจุลภาค UTF-8 (BOM)</div>
                </div>
              </button>
            )}

            {onExportPdf && (
              <button
                type="button"
                onClick={() => handleSelect(onExportPdf)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition cursor-pointer text-left group"
              >
                <div className="w-6 h-6 rounded-md bg-rose-100 group-hover:bg-rose-200 flex items-center justify-center text-rose-700 shrink-0 transition">
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-bold text-slate-800 group-hover:text-rose-900">ไฟล์ PDF (.pdf)</div>
                  <div className="text-[10px] text-slate-500">แบบฟอร์มทางการราชการ</div>
                </div>
              </button>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
