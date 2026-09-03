import * as XLSX from 'xlsx';
import { Project, ProjectTrackingItem, BudgetApproval, PlanApproval, UserItem } from '../types';
import { YEARS, ORG_NAME } from '../data/initialData';

/**
 * Trigger browser file download
 */
function downloadFile(content: string | Blob, filename: string, mimeType: string) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 150);
}

/**
 * Clean cell content for CSV
 */
function escapeCsvCell(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Export generic 2D table data to CSV with UTF-8 BOM
 */
export function exportTableToCsv(headers: string[], rows: (string | number)[][], filename: string) {
  const headerLine = headers.map(escapeCsvCell).join(',');
  const rowLines = rows.map((r) => r.map(escapeCsvCell).join(','));
  const csvContent = '\uFEFF' + [headerLine, ...rowLines].join('\r\n');
  downloadFile(csvContent, filename.endsWith('.csv') ? filename : `${filename}.csv`, 'text/csv;charset=utf-8;');
}

/**
 * Export generic 2D table data to Excel (.xlsx) using SheetJS
 */
export function exportTableToExcel(
  headers: string[],
  rows: (string | number)[][],
  filename: string,
  sheetName = 'ข้อมูล'
) {
  try {
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

    // Calculate auto column widths
    const colWidths = headers.map((h, i) => {
      let maxLen = h ? String(h).length : 8;
      rows.forEach((r) => {
        const cell = r[i];
        if (cell !== null && cell !== undefined) {
          const len = String(cell).length;
          if (len > maxLen) maxLen = len;
        }
      });
      return { wch: Math.min(Math.max(maxLen + 3, 10), 60) };
    });
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    const cleanSheetName = (sheetName || 'ข้อมูล').replace(/[\\/?*\[\]]/g, '_').slice(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, cleanSheetName);

    const cleanFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
    XLSX.writeFile(wb, cleanFilename);
    return;
  } catch (err) {
    console.error('XLSX export error, falling back to CSV with UTF-8 BOM:', err);
    exportTableToCsv(headers, rows, filename);
  }
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Projects exporter
 */
export function exportProjects(projects: Project[], format: 'csv' | 'excel', planType = 'แผนพัฒนาท้องถิ่น') {
  const headers = [
    'ลำดับ',
    'รหัสโครงการ',
    'ประเด็นการพัฒนา',
    'ยุทธศาสตร์',
    'แผนงาน',
    'ชื่อโครงการ',
    'วัตถุประสงค์',
    'เป้าหมาย (ผลผลิต)',
    ...YEARS.map((y) => `งบประมาณ พ.ศ. ${y}`),
    'งบประมาณรวม (บาท)',
    'ผลที่คาดว่าจะได้รับ',
    'หน่วยงานรับผิดชอบหลัก',
    'ประเภทรายการ',
    'สถานะโครงการ'
  ];

  const rows = projects.map((p, idx) => {
    const totalBudget = YEARS.reduce((sum, y) => sum + (Number(p[`งบประมาณ ${y}` as keyof Project]) || 0), 0);
    return [
      idx + 1,
      p.ID,
      p['ประเด็นการพัฒนา'] || '',
      p['ยุทธศาสตร์'] || '',
      p['แผนงาน'] || '',
      p['ชื่อโครงการ'] || '',
      p['วัตถุประสงค์'] || '',
      p['เป้าหมาย (ผลผลิต)'] || '',
      ...YEARS.map((y) => Number(p[`งบประมาณ ${y}` as keyof Project]) || 0),
      totalBudget,
      p['ผลที่คาดว่าจะได้รับ'] || '',
      p['หน่วยงานรับผิดชอบหลัก'] || '',
      p['ประเภทรายการ'] || 'ฉบับแรก',
      p['สถานะโครงการ'] || 'บรรจุในแผน'
    ];
  });

  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `โครงการ_${planType}_${timestamp}`;

  if (format === 'csv') {
    exportTableToCsv(headers, rows, filename);
  } else {
    exportTableToExcel(headers, rows, filename, planType);
  }
}

/**
 * Tracking items exporter
 */
export function exportTrackings(trackings: ProjectTrackingItem[], format: 'csv' | 'excel', title = 'รายงานติดตามโครงการ') {
  const headers = [
    'ลำดับ',
    'รหัสโครงการ',
    'ปีงบประมาณ',
    'ชื่อโครงการ',
    'หน่วยงานรับผิดชอบ',
    'แหล่งที่มาของงบ',
    'ความคืบหน้า (%)',
    'สถานะโครงการ',
    'งบประมาณที่อนุมัติ (บาท)',
    'ลงนามสัญญา (บาท)',
    'เบิกจ่าย (บาท)',
    'คงเหลือ (บาท)',
    'วันเริ่มโครงการ',
    'วันสิ้นสุดโครงการ',
    'ปัญหาและอุปสรรค'
  ];

  const rows = trackings.map((t, idx) => {
    const approved = Number(t['งบประมาณที่อนุมัติ'] ?? t['งบประมาณที่ได้รับจัดสรร']) || 0;
    const contract = Number(t['ลงนามสัญญา']) || 0;
    const disbursed = Number(t['เบิกจ่าย'] ?? t['ผลการเบิกจ่าย']) || 0;
    const remaining = t['คงเหลือ'] !== undefined ? Number(t['คงเหลือ']) : Math.max(0, approved - disbursed);

    return [
      idx + 1,
      t.ID,
      t['ปีงบประมาณ'] || '',
      t['ชื่อโครงการ'] || '',
      t['หน่วยงาน'] || t['ผู้รับผิดชอบ'] || '',
      t['แหล่งที่มา'] || t['แหล่งงบประมาณ'] || '',
      Number(t['ความคืบหน้า (%)']) || 0,
      t['สถานะโครงการ'] || 'ยังไม่เริ่มดำเนินการ',
      approved,
      contract,
      disbursed,
      remaining,
      t['วันเริ่มต้น'] || '',
      t['วันสิ้นสุด'] || '',
      t['ปัญหาและอุปสรรค'] || ''
    ];
  });

  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `${title}_${timestamp}`;

  if (format === 'csv') {
    exportTableToCsv(headers, rows, filename);
  } else {
    exportTableToExcel(headers, rows, filename, 'ติดตามโครงการ');
  }
}

/**
 * Approvals exporter
 */
export function exportApprovals(approvals: PlanApproval[], format: 'csv' | 'excel', title = 'รายงานการอนุมัติประกาศใช้') {
  const headers = [
    'ลำดับ',
    'รหัส',
    'ประเภทแผน',
    'ครั้งที่',
    'ปี พ.ศ.',
    'วันที่อนุมัติประกาศใช้',
    'วันที่มีผลบังคับใช้',
    'เลขที่ประกาศ',
    'ผู้อนุมัติ/ผู้ลงนาม',
    'สถานะการประกาศ',
    'จำนวนโครงการ'
  ];

  const rows = approvals.map((a, idx) => [
    idx + 1,
    a.ID,
    a['ประเภท'] || '',
    a['ครั้งที่'] || '',
    a['ปี พ.ศ.'] || '',
    a['วันที่อนุมัติประกาศใช้'] || '',
    a['วันที่มีผลบังคับใช้'] || '',
    a['เลขที่ประกาศ'] || '',
    a['ผู้อนุมัติ'] || a['ผู้ลงนาม'] || '',
    a['สถานะการประกาศ'] || 'อนุมัติ',
    a['จำนวนโครงการ'] !== undefined ? a['จำนวนโครงการ'] : (String(a.ProjectIDs || '').split(',').filter(Boolean).length)
  ]);

  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `${title}_${timestamp}`;

  if (format === 'csv') {
    exportTableToCsv(headers, rows, filename);
  } else {
    exportTableToExcel(headers, rows, filename, 'การอนุมัติประกาศใช้');
  }
}

/**
 * Users exporter
 */
export function exportUsers(users: UserItem[], format: 'csv' | 'excel', title = 'รายชื่อผู้ใช้งานระบบ') {
  const headers = [
    'ลำดับ',
    'ID',
    'ชื่อ-สกุล',
    'ตำแหน่ง',
    'หน่วยงาน/กอง',
    'อีเมล',
    'เบอร์โทรศัพท์',
    'สิทธิ์การใช้งาน',
    'สถานะ'
  ];

  const rows = users.map((u, idx) => [
    idx + 1,
    u.ID,
    u['ชื่อ-สกุล'] || '',
    u['ตำแหน่ง'] || '',
    u['หน่วยงาน/กอง'] || '',
    u['อีเมล'] || '',
    u['เบอร์โทรศัพท์'] || '',
    u['สิทธิ์การใช้งาน'] || '',
    u['สถานะ'] || ''
  ]);

  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `${title}_${timestamp}`;

  if (format === 'csv') {
    exportTableToCsv(headers, rows, filename);
  } else {
    exportTableToExcel(headers, rows, filename, 'ผู้ใช้งาน');
  }
}

/**
 * Report 01 (แบบ ผ.01 บัญชีสรุปโครงการพัฒนาท้องถิ่น) Exporter
 */
export function exportReport01(
  reportData: { rows: any[]; totals: Record<string, number>; grandTotalCount: number; grandTotalBudget: number },
  format: 'csv' | 'excel',
  title = 'แบบ_ผ.01_บัญชีสรุปโครงการพัฒนาท้องถิ่น'
) {
  const headers = [
    'ลำดับ',
    'ประเด็นการพัฒนาท้องถิ่น',
    'พ.ศ. 2571 (โครงการ)',
    'พ.ศ. 2571 (งบประมาณ บาท)',
    'พ.ศ. 2572 (โครงการ)',
    'พ.ศ. 2572 (งบประมาณ บาท)',
    'พ.ศ. 2573 (โครงการ)',
    'พ.ศ. 2573 (งบประมาณ บาท)',
    'พ.ศ. 2574 (โครงการ)',
    'พ.ศ. 2574 (งบประมาณ บาท)',
    'พ.ศ. 2575 (โครงการ)',
    'พ.ศ. 2575 (งบประมาณ บาท)',
    'รวม 5 ปี (โครงการ)',
    'รวม 5 ปี (งบประมาณ บาท)'
  ];

  const rows: (string | number)[][] = reportData.rows.map((r, idx) => [
    idx + 1,
    r.strategicIssue || '',
    r.year2571Count || 0,
    r.year2571Budget || 0,
    r.year2572Count || 0,
    r.year2572Budget || 0,
    r.year2573Count || 0,
    r.year2573Budget || 0,
    r.year2574Count || 0,
    r.year2574Budget || 0,
    r.year2575Count || 0,
    r.year2575Budget || 0,
    r.total5YearCount || 0,
    r.total5YearBudget || 0
  ]);

  // Add Grand Total Row
  rows.push([
    '',
    'รวมทั้งสิ้น',
    reportData.totals['2571Count'] || 0,
    reportData.totals['2571Budget'] || 0,
    reportData.totals['2572Count'] || 0,
    reportData.totals['2572Budget'] || 0,
    reportData.totals['2573Count'] || 0,
    reportData.totals['2573Budget'] || 0,
    reportData.totals['2574Count'] || 0,
    reportData.totals['2574Budget'] || 0,
    reportData.totals['2575Count'] || 0,
    reportData.totals['2575Budget'] || 0,
    reportData.grandTotalCount || 0,
    reportData.grandTotalBudget || 0
  ]);

  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `${title}_${timestamp}`;

  if (format === 'csv') {
    exportTableToCsv(headers, rows, filename);
  } else {
    exportTableToExcel(headers, rows, filename, 'แบบ ผ.01');
  }
}

/**
 * Report 02 Change Comparison (แบบ ผ.02 ฉบับเปลี่ยนแปลง) Exporter
 */
export function exportReport02Change(
  projects: Project[],
  format: 'csv' | 'excel',
  title = 'แบบ_ผ.02_เปรียบเทียบฉบับเปลี่ยนแปลง'
) {
  const headers = [
    'ลำดับ',
    'ประเด็นการพัฒนา',
    'โครงการเดิม (ชื่อโครงการ)',
    'โครงการเดิม (วัตถุประสงค์)',
    'โครงการเดิม (เป้าหมาย)',
    'โครงการเดิม (งบประมาณรวม 5 ปี)',
    'โครงการที่ขอเปลี่ยนแปลง (ชื่อโครงการ)',
    'โครงการที่ขอเปลี่ยนแปลง (วัตถุประสงค์)',
    'โครงการที่ขอเปลี่ยนแปลง (เป้าหมาย)',
    'โครงการที่ขอเปลี่ยนแปลง (งบประมาณรวม 5 ปี)',
    'ส่วนต่างงบประมาณ (เพิ่ม/ลด)',
    'เหตุผลและความจำเป็นในการเปลี่ยนแปลง',
    'หน่วยงานรับผิดชอบ'
  ];

  const rows = projects.map((p, idx) => {
    let sumBefore = 0;
    let sumAfter = 0;
    YEARS.forEach((y) => {
      sumBefore += Number(p[`งบประมาณ ${y} (เดิม)` as keyof Project]) || 0;
      sumAfter += Number(p[`งบประมาณ ${y}` as keyof Project]) || 0;
    });
    const diff = sumAfter - sumBefore;

    return [
      idx + 1,
      p['ประเด็นการพัฒนา'] || '',
      p['ชื่อโครงการ (เดิม)'] || p['ชื่อโครงการ'] || '',
      p['วัตถุประสงค์ (เดิม)'] || p['วัตถุประสงค์'] || '',
      p['เป้าหมาย (เดิม)'] || p['เป้าหมาย (ผลผลิต)'] || '',
      sumBefore,
      p['ชื่อโครงการ'] || '',
      p['วัตถุประสงค์'] || '',
      p['เป้าหมาย (ผลผลิต)'] || '',
      sumAfter,
      diff,
      p['เหตุผลและความจำเป็น'] || '',
      p['หน่วยงานรับผิดชอบหลัก'] || ''
    ];
  });

  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `${title}_${timestamp}`;

  if (format === 'csv') {
    exportTableToCsv(headers, rows, filename);
  } else {
    exportTableToExcel(headers, rows, filename, 'แบบ ผ.02 เปลี่ยนแปลง');
  }
}

/**
 * Report 02 Edit Comparison (แบบ ผ.02 ฉบับแก้ไข) Exporter
 */
export function exportReport02Edit(
  projects: Project[],
  format: 'csv' | 'excel',
  title = 'แบบ_ผ.02_เปรียบเทียบฉบับแก้ไข'
) {
  const headers = [
    'ลำดับ',
    'ประเด็นการพัฒนา',
    'ข้อความเดิม (ชื่อโครงการ)',
    'ข้อความเดิม (วัตถุประสงค์)',
    'ข้อความเดิม (เป้าหมาย)',
    'ข้อความที่ขอแก้ไข (ชื่อโครงการ)',
    'ข้อความที่ขอแก้ไข (วัตถุประสงค์)',
    'ข้อความที่ขอแก้ไข (เป้าหมาย)',
    'งบประมาณรวม 5 ปี (บาท)',
    'เหตุผลและความจำเป็นในการแก้ไข',
    'หน่วยงานรับผิดชอบ'
  ];

  const rows = projects.map((p, idx) => {
    let totalBudget = 0;
    YEARS.forEach((y) => {
      totalBudget += Number(p[`งบประมาณ ${y}` as keyof Project]) || 0;
    });

    return [
      idx + 1,
      p['ประเด็นการพัฒนา'] || '',
      p['ชื่อโครงการ (เดิม)'] || p['ชื่อโครงการ'] || '',
      p['วัตถุประสงค์ (เดิม)'] || p['วัตถุประสงค์'] || '',
      p['เป้าหมาย (เดิม)'] || p['เป้าหมาย (ผลผลิต)'] || '',
      p['ชื่อโครงการ'] || '',
      p['วัตถุประสงค์'] || '',
      p['เป้าหมาย (ผลผลิต)'] || '',
      totalBudget,
      p['เหตุผลและความจำเป็น'] || '',
      p['หน่วยงานรับผิดชอบหลัก'] || ''
    ];
  });

  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `${title}_${timestamp}`;

  if (format === 'csv') {
    exportTableToCsv(headers, rows, filename);
  } else {
    exportTableToExcel(headers, rows, filename, 'แบบ ผ.02 แก้ไข');
  }
}

/**
 * Extract clean 2D data from an HTMLTableElement
 * Skips action columns, removes buttons/icons/SVGs, cleans text and badges, parses numbers
 */
export function extractTableData(tableElement: HTMLTableElement): { headers: string[]; rows: (string | number)[][] } {
  const skipKeywords = ['จัดการ', 'ดำเนินการ', 'action', 'actions', 'เลือก', 'แก้ไข', 'ลบ', 'เครื่องมือ', 'ตัวเลือก'];
  const skipColIndices = new Set<number>();

  // 1. Extract Headers from the first thead tr or tr
  const headers: string[] = [];
  const headerRow = tableElement.querySelector('thead tr') || tableElement.querySelector('tr');
  if (headerRow) {
    const ths = headerRow.querySelectorAll('th, td');
    ths.forEach((th, idx) => {
      const text = (th.textContent || '').trim();
      const lower = text.toLowerCase();
      const hasSkipClass = th.classList.contains('no-export') || th.classList.contains('no-print');
      const matchesKeyword = skipKeywords.some((kw) => lower === kw || lower.includes(kw));
      const isActionOnly = Boolean(th.querySelector('button, input[type="checkbox"]')) && text.length < 4;

      if (hasSkipClass || matchesKeyword || isActionOnly) {
        skipColIndices.add(idx);
      } else {
        headers.push(text || `คอลัมน์ ${idx + 1}`);
      }
    });
  }

  // 2. Extract Data Rows from tbody tr
  const rows: (string | number)[][] = [];
  const bodyRows = tableElement.querySelectorAll('tbody tr');
  const trList = bodyRows.length > 0 ? bodyRows : tableElement.querySelectorAll('tr:not(:first-child)');

  trList.forEach((tr) => {
    if (tr.classList.contains('no-export') || tr.classList.contains('no-print')) return;

    const rowData: (string | number)[] = [];
    const cells = tr.querySelectorAll('td, th');
    if (cells.length === 0) return;

    cells.forEach((cell, idx) => {
      if (skipColIndices.has(idx)) return;
      if (cell.classList.contains('no-export') || cell.classList.contains('no-print')) return;

      // Clone cell to strip unwanted action elements, icons, SVGs, buttons
      const clone = cell.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('button, svg, input, .no-export, .no-print, [aria-hidden="true"]').forEach((el) => el.remove());

      // Extract cleaned text (remove excess whitespace)
      const text = (clone.textContent || '').replace(/\s+/g, ' ').trim();

      // If numeric, parse into number (support commas like 1,250,000 or 1250000.50)
      const cleanNum = text.replace(/,/g, '');
      const isDate = /^\d{1,4}[-/]\d{1,2}[-/]\d{1,4}/.test(text);
      const isLeadingZero = /^0\d+/.test(cleanNum) && cleanNum.length > 1; // preserve leading zeros like phone numbers or IDs
      if (cleanNum !== '' && !isNaN(Number(cleanNum)) && !isDate && !isLeadingZero) {
        rowData.push(Number(cleanNum));
      } else {
        rowData.push(text);
      }
    });

    if (rowData.length > 0 && rowData.some((c) => c !== '')) {
      rows.push(rowData);
    }
  });

  return { headers, rows };
}

/**
 * Direct HTML Table Export to Excel (.xlsx) using SheetJS
 */
export function exportHtmlTableToExcel(tableElement: HTMLTableElement, systemName = 'ระบบแผนพัฒนาท้องถิ่น') {
  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `${systemName}_${timestamp}`;
  const { headers, rows } = extractTableData(tableElement);
  exportTableToExcel(headers, rows, filename, systemName);
}

/**
 * Direct HTML Table Export to CSV (.csv) with UTF-8 BOM
 */
export function exportHtmlTableToCsv(tableElement: HTMLTableElement, systemName = 'ระบบแผนพัฒนาท้องถิ่น') {
  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `${systemName}_${timestamp}`;
  const { headers, rows } = extractTableData(tableElement);
  exportTableToCsv(headers, rows, filename);
}

/**
 * Direct HTML Element to PDF (.pdf) using html2pdf.js
 */
export function exportHtmlElementToPdf(
  element: HTMLElement,
  systemName = 'ระบบแผนพัฒนาท้องถิ่น',
  orientation: 'portrait' | 'landscape' = 'landscape'
) {
  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `${systemName}_${timestamp}.pdf`;

  if (typeof window !== 'undefined' && (window as any).html2pdf) {
    try {
      const html2pdf = (window as any).html2pdf;
      const opt = {
        margin: [8, 8, 8, 8],
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation }
      };
      html2pdf().set(opt).from(element).save();
      return;
    } catch (e) {
      console.warn('html2pdf execution error:', e);
    }
  }

  // Fallback
  window.print();
}

