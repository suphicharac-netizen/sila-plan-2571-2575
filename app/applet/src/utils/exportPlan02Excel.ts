import * as XLSX from 'xlsx';
import { ProjectData, PlanEdition } from '../types';

interface ExportExcelOptions {
  edition: PlanEdition;
  editionTitle: string;
  projects: ProjectData[];
  fiscalYear?: string;
  selectedStrategy?: string;
  selectedDepartment?: string;
}

export function exportPlan02ToExcel({
  edition,
  editionTitle,
  projects,
  fiscalYear,
  selectedStrategy,
  selectedDepartment
}: ExportExcelOptions) {
  const isNotFirst = edition !== 'first';

  // 1. Prepare Header rows
  const today = new Date();
  const thaiDate = today.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const filterNoteParts: string[] = [];
  if (fiscalYear && fiscalYear !== 'all') filterNoteParts.push(`ปีงบประมาณ: พ.ศ. ${fiscalYear}`);
  if (selectedStrategy) filterNoteParts.push(`ประเด็นการพัฒนา: ${selectedStrategy}`);
  if (selectedDepartment) filterNoteParts.push(`หน่วยงาน: ${selectedDepartment}`);
  const filterNote = filterNoteParts.length > 0 ? `(เงื่อนไขตัวกรอง: ${filterNoteParts.join(' | ')})` : '';

  // 2. Table Header
  const headers = [
    'ลำดับ',
    'ชื่อโครงการพัฒนา',
    'ประเด็นการพัฒนา',
    'วัตถุประสงค์',
    'เป้าหมาย (ผลผลิตของโครงการ)',
    'งบประมาณ พ.ศ. 2571 (บาท)',
    'งบประมาณ พ.ศ. 2572 (บาท)',
    'งบประมาณ พ.ศ. 2573 (บาท)',
    'งบประมาณ พ.ศ. 2574 (บาท)',
    'งบประมาณ พ.ศ. 2575 (บาท)',
    'รวม 5 ปี (บาท)',
    'ผลที่คาดว่าจะได้รับ',
    'หน่วยงานรับผิดชอบหลัก'
  ];

  if (isNotFirst) {
    headers.push('เหตุผลความจำเป็นในการแก้ไข/เพิ่มเติม');
  }

  // 3. Assemble Data Rows
  const aoa: any[][] = [];

  // Title Block
  aoa.push(['แบบ ผ.02 บัญชีรายละเอียดโครงการพัฒนา แผนพัฒนาท้องถิ่น (พ.ศ. 2571 - 2575)']);
  aoa.push([`เทศบาลเมืองศิลา อำเภอเมืองขอนแก่น จังหวัดขอนแก่น - ${editionTitle}`]);
  aoa.push([`ข้อมูล ณ วันที่: ${thaiDate} ${filterNote}`]);
  aoa.push([]); // Empty line
  aoa.push(headers);

  // Accumulators for totals
  let totalB71 = 0;
  let totalB72 = 0;
  let totalB73 = 0;
  let totalB74 = 0;
  let totalB75 = 0;
  let grandTotal5Years = 0;

  projects.forEach((p, idx) => {
    const b71 = p.budgetByYear?.['2571'] || 0;
    const b72 = p.budgetByYear?.['2572'] || 0;
    const b73 = p.budgetByYear?.['2573'] || 0;
    const b74 = p.budgetByYear?.['2574'] || 0;
    const b75 = p.budgetByYear?.['2575'] || 0;
    const bTotal = b71 + b72 + b73 + b74 + b75;

    totalB71 += b71;
    totalB72 += b72;
    totalB73 += b73;
    totalB74 += b74;
    totalB75 += b75;
    grandTotal5Years += bTotal;

    const rowData: any[] = [
      idx + 1,
      p.name || '',
      p.planStrategy || '',
      p.objective || '',
      p.target || '',
      b71,
      b72,
      b73,
      b74,
      b75,
      bTotal,
      p.expectedResults || '',
      p.department || ''
    ];

    if (isNotFirst) {
      const reasonContent = p.reason
        ? (p.note && p.note !== p.reason ? `${p.reason} (${p.note})` : p.reason)
        : (p.note || p.planReference || '-');
      rowData.push(reasonContent);
    }

    aoa.push(rowData);
  });

  // Summary Row
  const summaryRow: any[] = [
    '',
    `รวมงบประมาณทั้งสิ้น (${projects.length} โครงการ)`,
    '',
    '',
    '',
    totalB71,
    totalB72,
    totalB73,
    totalB74,
    totalB75,
    grandTotal5Years,
    '',
    ''
  ];
  if (isNotFirst) {
    summaryRow.push('');
  }
  aoa.push(summaryRow);

  // 4. Create Worksheet
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // 5. Format Cells (Number formats & Alignment)
  // Header row is index 4 (0-based)
  const headerRowIdx = 4;
  const startDataRowIdx = 5;
  const endDataRowIdx = 4 + projects.length;
  const totalRowIdx = endDataRowIdx + 1;

  // Set number format for budget columns (Col E to J: index 5 to 10)
  for (let r = startDataRowIdx; r <= totalRowIdx; r++) {
    for (let c = 5; c <= 10; c++) {
      const cellRef = XLSX.utils.encode_cell({ r, c });
      if (ws[cellRef]) {
        ws[cellRef].t = 'n';
        ws[cellRef].z = '#,##0';
      }
    }
  }

  // 6. Calculate Auto-fit Column Widths
  const colWidths = headers.map((h, colIdx) => {
    let maxLen = Math.max(h.length * 1.6, 10);
    // Scan up to first 100 rows to estimate length
    const sampleRows = Math.min(projects.length, 100);
    for (let r = 0; r < sampleRows; r++) {
      const val = aoa[startDataRowIdx + r]?.[colIdx];
      if (val !== undefined && val !== null) {
        if (typeof val === 'number') {
          const numStr = val.toLocaleString();
          maxLen = Math.max(maxLen, numStr.length + 3);
        } else {
          const str = String(val);
          // Limit length cap to prevent excessively wide text columns
          const visualLen = Math.min(str.length * 1.3, 50);
          maxLen = Math.max(maxLen, visualLen);
        }
      }
    }
    // Specific comfortable minimum widths
    if (colIdx === 0) return { wch: 8 }; // ลำดับ
    if (colIdx === 1) return { wch: Math.max(maxLen, 36) }; // ชื่อโครงการ
    if (colIdx >= 5 && colIdx <= 10) return { wch: Math.max(maxLen, 16) }; // งบประมาณ
    return { wch: Math.min(Math.max(Math.ceil(maxLen) + 3, 14), 55) };
  });

  ws['!cols'] = colWidths;

  // 7. Page Setup & Margins for Ready-to-Print
  ws['!pageSetup'] = {
    orientation: 'landscape',
    paperSize: 9, // A4
    scale: 65,
    fitToWidth: 1,
    fitToHeight: 0
  };

  ws['!margins'] = {
    left: 0.4,
    right: 0.4,
    top: 0.6,
    bottom: 0.6,
    header: 0.3,
    footer: 0.3
  };

  // Merge Title rows across columns
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: headers.length - 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: headers.length - 1 } },
    { s: { r: totalRowIdx, c: 1 }, e: { r: totalRowIdx, c: 4 } }
  ];

  // 8. Build Workbook & Trigger Download
  const wb = XLSX.utils.book_new();
  const sheetName = `ผ.02 ${editionTitle}`.substring(0, 31);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const cleanTitle = editionTitle.replace(/[\/\\?%*:|"<>]/g, '_');
  const filename = `แบบ_ผ02_${cleanTitle}_${today.getFullYear() + 543}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}.xlsx`;

  XLSX.writeFile(wb, filename);
}
