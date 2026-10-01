import * as XLSX from 'xlsx';

export interface ExportTableOptions {
  filename: string;
  sheetName?: string;
  title?: string;
  subTitle?: string;
  filterDesc?: string;
  headers: string[];
  rows: (string | number)[][];
}

/**
 * ส่งออกข้อมูลตารางเป็นไฟล์ Microsoft Excel (.xlsx) ทันที
 */
export function exportTableToExcel({
  filename,
  sheetName = 'Sheet1',
  title,
  subTitle,
  filterDesc,
  headers,
  rows
}: ExportTableOptions): void {
  try {
    const wb = XLSX.utils.book_new();
    const wsData: (string | number)[][] = [];

    if (title) {
      wsData.push([title]);
    }
    if (subTitle) {
      wsData.push([subTitle]);
    }
    if (filterDesc) {
      wsData.push([filterDesc]);
    }
    if (title || subTitle || filterDesc) {
      wsData.push([]); // Blank separator row
    }

    // Add Table Header
    wsData.push(headers);

    // Add Table Rows
    rows.forEach((row) => {
      wsData.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths based on maximum string lengths
    const colWidths = headers.map((header, colIdx) => {
      let maxLen = header.length;
      rows.forEach((r) => {
        const val = r[colIdx];
        if (val !== undefined && val !== null) {
          const str = String(val);
          if (str.length > maxLen) {
            maxLen = Math.min(str.length, 60);
          }
        }
      });
      return { wch: Math.max(maxLen + 4, 12) };
    });
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));

    const finalName = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
    XLSX.writeFile(wb, finalName);
  } catch (err) {
    console.error('Export to Excel error, falling back to CSV:', err);
    exportTableToCSV({ filename: filename.replace(/\.xlsx$/i, ''), headers, rows });
  }
}

/**
 * ส่งออกข้อมูลตารางเป็นไฟล์ CSV (.csv) พร้อม UTF-8 BOM สำหรับเปิดใน Excel ภาษาไทยได้ทันที
 */
export function exportTableToCSV({
  filename,
  headers,
  rows
}: {
  filename: string;
  headers: string[];
  rows: (string | number)[][];
}): void {
  const sanitizeCell = (cell: string | number | undefined | null): string => {
    if (cell === null || cell === undefined) return '""';
    const str = String(cell);
    return `"${str.replace(/"/g, '""')}"`;
  };

  const headerLine = headers.map(sanitizeCell).join(',');
  const rowLines = rows.map((r) => r.map(sanitizeCell).join(','));

  const csvContent = '\uFEFF' + [headerLine, ...rowLines].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const finalName = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  link.setAttribute('download', finalName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * สั่งพิมพ์เอกสารหรือหน้ารายงานผ่าน window.print()
 */
export function triggerPrint(): void {
  if (typeof window !== 'undefined') {
    window.print();
  }
}
