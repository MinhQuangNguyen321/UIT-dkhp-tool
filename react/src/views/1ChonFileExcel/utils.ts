import { ClassModelOriginal } from 'types';

export function arrayToTkbObject(array: any[]): ClassModelOriginal {
  // convert excel based date (1899-Dec-30) to Js based date (1970-Jan-01)
  function convertExcelDateToStringDate(excelDate: any): string {
    if (!excelDate && excelDate !== 0) return '';
    if (excelDate instanceof Date) {
      if (isNaN(excelDate.getTime())) return '';
      return (
        excelDate.getFullYear() +
        '-' +
        (excelDate.getMonth() + 1).toString().padStart(2, '0') +
        '-' +
        excelDate.getDate().toString().padStart(2, '0')
      );
    }
    const num = typeof excelDate === 'number' ? excelDate : parseFloat(excelDate);
    if (isNaN(num) || num <= 0) return typeof excelDate === 'string' ? excelDate : '';
    // in Excel, base date is 1899-Dec-31: https://stackoverflow.com/questions/36378476/why-does-the-date-returns-31-12-1899-when-1-is-passed-to-it
    const offsetOfBases = new Date(0).getTime() - new Date(1899, 11, 31).getTime();
    const jsDate = new Date(num * 24 * 60 * 60 * 1000 - offsetOfBases);
    if (isNaN(jsDate.getTime()) || isNaN(jsDate.getFullYear())) return '';
    return (
      jsDate.getFullYear() +
      '-' +
      (jsDate.getMonth() + 1).toString().padStart(2, '0') +
      '-' +
      jsDate.getDate().toString().padStart(2, '0')
    );
  }

  const parseDateField = (val: any): string => {
    if (!val && val !== 0) return '';
    if (typeof val === 'string') {
      const trimmed = val.trim();
      return trimmed === 'NaN-NaN-NaN' ? '' : trimmed;
    }
    return convertExcelDateToStringDate(val);
  };

  return {
    STT: array[0],
    MaMH: array[1],
    MaLop: array[2],
    TenMH: array[3],
    MaGV: array[4],
    TenGV: array[5],
    SiSo: array[6],
    SoTc: parseInt(array[7]) || 0,
    ThucHanh: array[8],
    HTGD: array[9],
    Thu: String(array[10]),
    Tiet: String(array[11]),
    CachTuan: String(array[12]),
    PhongHoc: array[13],
    KhoaHoc: String(array[14]),
    HocKy: String(array[15]),
    NamHoc: String(array[16]),
    HeDT: array[17],
    KhoaQL: array[18],
    NBD: parseDateField(array[19]),
    NKT: parseDateField(array[20]),
    GhiChu: array[21],
    NgonNgu: array[22],
  };
}

// from Date object to 'hh:mm dd/MM/yyyy' format
export function toDateTimeString(date: Date) {
  return (
    date.getHours().toString().padStart(2, '0') +
    ':' +
    date.getMinutes().toString().padStart(2, '0') +
    ' ' +
    date.getDate().toString().padStart(2, '0') +
    '/' +
    (date.getMonth() + 1).toString().padStart(2, '0') +
    '/' +
    date.getFullYear()
  );
}

// Format epoch timestamp to 'hh:mm dd/MM/yyyy' format
export function formatTimestampToString(timestamp: number): string {
  return toDateTimeString(new Date(timestamp));
}

// Get formatted lastUpdate string from dataExcel (backward compatible)
export function getLastUpdateString(dataExcel: { lastUpdate?: string; lastUpdateTimestamp?: number } | null): string | undefined {
  if (!dataExcel) return undefined;
  if (dataExcel.lastUpdateTimestamp !== undefined) {
    return formatTimestampToString(dataExcel.lastUpdateTimestamp);
  }
  return dataExcel.lastUpdate;
}

// copied from: https://github.com/SheetJS/sheetjs/blob/master/demos/react/sheetjs.jsx#L134-L136
export const sheetJSFT = [
  '.xlsx',
  '.xlsb',
  '.xlsm',
  '.xls',
  // '.xml',
  '.csv',
  // '.txt',
  // '.ods',
  // '.fods',
  // '.uos',
  // '.sylk',
  // '.dif',
  // '.dbf',
  // '.prn',
  // '.qpw',
  // '.123',
  // '.wb*',
  // '.wq*',
  // '.html',
  // '.htm',
].join(',');
