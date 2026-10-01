import * as XLSX from 'xlsx';
import { ProjectData, PlanEdition } from '../types';

interface ExportPlan02Options {
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
}: ExportPlan02Options) {
  const wb = XLSX.utils.book_new();

  // Determine Title Text
  const sheetTitle = `แบบ ผ.02 บัญชีรายละเอียดโครงการพัฒนา`;
  const subTitle = `เทศบาลเมืองศิลา อำเภอเมืองขอนแก่น จังหวัดขอนแก่น (${editionTitle})`;
  const filterDesc = [
    fiscalYear && fiscalYear !== 'all' ? `ปีงบประมาณ พ.ศ. ${fiscalYear}` : 'ปีงบประมาณ พ.ศ. 2571-2575',
    selectedStrategy ? `ยุทธศาสตร์: ${selectedStrategy}` : '',
    selectedDepartment ? `หน่วยงาน: ${selectedDepartment}` : ''
  ].filter(Boolean).join(' | ');

  // Headers matching official Plan 02 format
  const headers = [
    'ลำดับ',
    'โครงการ',
    'ประเด็นการพัฒนา',
    'ยุทธศาสตร์',
    'วัตถุประสงค์',
    'เป้าหมาย (ผลผลิตของโครงการ)',
    'งบประมาณ พ.ศ. 2571 (บาท)',
    'งบประมาณ พ.ศ. 2572 (บาท)',
    'งบประมาณ พ.ศ. 2573 (บาท)',
    'งบประมาณ พ.ศ. 2574 (บาท)',
    'งบประมาณ พ.ศ. 2575 (บาท)',
    'รวม 5 ปี (บาท)',
    'ผลที่คาดว่าจะได้รับ',
    'หน่วยงานรับผิดชอบหลัก',
    ...(edition !== 'first' ? ['เหตุผลความจำเป็น'] : [])
  ];

  // Prepare table data rows
  const wsData: (string | number)[][] = [
    [sheetTitle],
    [subTitle],
    [filterDesc || 'ข้อมูลโครงการทั้งหมด'],
    [], // Blank separator row
    headers
  ];

  let totalB71 = 0;
  let totalB72 = 0;
  let totalB73 = 0;
  let totalB74 = 0;
  let totalB75 = 0;
  let grandTotal = 0;

  projects.forEach((p, idx) => {
    const b71 = Number(p.budgetByYear?.['2571']) || 0;
    const b72 = Number(p.budgetByYear?.['2572']) || 0;
    const b73 = Number(p.budgetByYear?.['2573']) || 0;
    const b74 = Number(p.budgetByYear?.['2574']) || 0;
    const b75 = Number(p.budgetByYear?.['2575']) || 0;
    const rowTotal = b71 + b72 + b73 + b74 + b75 || (Number(p.budgetPlan) || 0);

    totalB71 += b71;
    totalB72 += b72;
    totalB73 += b73;
    totalB74 += b74;
    totalB75 += b75;
    grandTotal += rowTotal;

    const reasonContent = p.reason
      ? (p.note && p.note !== p.reason ? `${p.reason} (${p.note})` : p.reason)
      : (p.note || p.planReference || '');

    const row: (string | number)[] = [
      idx + 1,
      p.name || '',
      p.planStrategy || '',
      p.strategy || '',
      p.objective || '',
      p.target || '',
      b71,
      b72,
      b73,
      b74,
      b75,
      rowTotal,
      p.expectedResults || '',
      p.department || ''
    ];

    if (edition !== 'first') {
      row.push(reasonContent);
    }

    wsData.push(row);
  });

  // Total Summary Row
  const totalRow: (string | number)[] = [
    '',
    'รวมงบประมาณทั้งสิ้น',
    '',
    '',
    '',
    '',
    totalB71,
    totalB72,
    totalB73,
    totalB74,
    totalB75,
    grandTotal,
    '',
    ''
  ];
  if (edition !== 'first') {
    totalRow.push('');
  }
  wsData.push(totalRow);

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Column width calculations (Auto-fit with reasonable limits)
  const colWidths = headers.map((header, colIdx) => {
    let maxLen = header.length * 1.5;
    wsData.forEach((row, rowIdx) => {
      if (rowIdx >= 4) { // only consider header and data rows
        const val = row[colIdx];
        if (val !== undefined && val !== null) {
          const str = String(val);
          // Limit single column width if text is very long to prevent huge sheets
          const len = Math.min(str.length * 1.2, 45);
          if (len > maxLen) {
            maxLen = len;
          }
        }
      }
    });
    return { wch: Math.max(Math.ceil(maxLen), 10) };
  });

  // Specific fine-tuning for widths
  colWidths[0] = { wch: 8 }; // No.
  colWidths[1] = { wch: 35 }; // Name
  colWidths[2] = { wch: 28 }; // Plan Strategy
  colWidths[3] = { wch: 28 }; // Strategy
  colWidths[4] = { wch: 30 }; // Objective
  colWidths[5] = { wch: 25 }; // Target
  colWidths[6] = { wch: 16 }; // b71
  colWidths[7] = { wch: 16 }; // b72
  colWidths[8] = { wch: 16 }; // b73
  colWidths[9] = { wch: 16 }; // b74
  colWidths[10] = { wch: 16 }; // b75
  colWidths[11] = { wch: 18 }; // total
  colWidths[12] = { wch: 28 }; // expectedResults
  colWidths[13] = { wch: 24 }; // department
  if (edition !== 'first') {
    colWidths[14] = { wch: 25 }; // reason
  }

  ws['!cols'] = colWidths;

  // Format numeric cells with commas (Currency/Accounting format)
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
  const numberFormat = '#,##0';

  for (let R = 5; R <= range.e.r; ++R) {
    for (let C = 6; C <= 11; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = ws[cellAddress];
      if (cell && typeof cell.v === 'number') {
        cell.z = numberFormat;
      }
    }
  }

  // Merges for main titles
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: headers.length - 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: headers.length - 1 } },
    // Merge summary label across columns 1 to 4
    { s: { r: range.e.r, c: 1 }, e: { r: range.e.r, c: 4 } }
  ];

  // Print Setup: A4 Landscape, Fit to 1 page wide
  ws['!pageSetup'] = {
    paperSize: 9, // A4
    orientation: 'landscape',
    fitToWidth: 1,
    fitToHeight: 0
  };

  // Margins setup (standard printing margins in inches)
  ws['!margins'] = {
    left: 0.5,
    right: 0.5,
    top: 0.75,
    bottom: 0.75,
    header: 0.3,
    footer: 0.3
  };

  XLSX.utils.book_append_sheet(wb, ws, 'ผ.02 รายละเอียดโครงการ');

  // Generate clean filename
  const filename = `แผน_ผ02_${editionTitle.replace(/\s+/g, '_')}_เทศบาลเมืองศิลา.xlsx`;
  XLSX.writeFile(wb, filename);
}
