import uniqBy from 'lodash/uniqBy';
import { Buoi, ClassModel } from 'types';
import { TTrungTkb } from './views/2XepLop/TrungTkbDialog';
import { isProd } from './constants';

export function uniqMaLop(classes: ClassModel[]): ClassModel[] {
  return uniqBy(classes, 'MaLop'); // Có nhiều lớp học nhiều buổi 1 tuần, xuất hiện nhiều lần, nhưng chỉ nên cộng 1 lần
}

export const getMaMHFromClass = (data: ClassModel): string => {
  if (!data) return '';
  if (data.MaMH && data.MaMH.trim()) return data.MaMH.trim();
  // Fallback: extract subject code from MaLop (e.g. IT004.R110 -> IT004)
  const maLop = (data.MaLop || '').trim();
  const dotIndex = maLop.indexOf('.');
  if (dotIndex > 0) return maLop.slice(0, dotIndex);
  return maLop;
};

export const isThucHanhClass = (data: ClassModel): boolean => {
  if (!data) return false;

  const maLop = (data.MaLop || '').trim();
  const htgd = (data.HTGD || '').trim().toUpperCase();
  const tenMH = (data.TenMH || '').trim().toLowerCase();
  const ghiChu = (data.GhiChu || '').trim().toLowerCase();
  const thucHanhStr = String(data.ThucHanh ?? '').trim().toUpperCase();

  // 1. Check HTGD (Hình thức giảng dạy: TH = Thực hành, HT2 = Thực hành / Học tập 2)
  if (htgd === 'TH' || htgd === 'HT2' || htgd.includes('TH')) return true;

  // 2. Check ThucHanh column
  if (thucHanhStr === '1' || thucHanhStr === 'TH' || thucHanhStr === 'TRUE') return true;

  // 3. Check MaLop suffix: UIT practical classes have suffix like .1, .2, .3 (1-2 digit only)
  // e.g. IT004.R110.1, IT004.R110.2 are TH — but IT004.R110 ends with .110 (3 digits) = LT
  if (/\.\d{1,2}$/.test(maLop)) return true;
  if (/(\.| |_)TH(\d|\.|$)/i.test(maLop)) return true;

  // 4. Check TenMH or GhiChu
  if (tenMH.includes('(th)') || tenMH.includes('thực hành') || ghiChu.includes('thực hành')) return true;

  return false;
};

export function calcTongSoTC(classes: ClassModel[]) {
  const { kept } = findOverlapedClasses(classes);
  const unique = uniqMaLop(kept);
  return unique.reduce((acc, cur) => acc + cur.SoTc, 0);
}

export function getTongSoTcJudgement(tongSoTC: number) {
  const text =
    tongSoTC < 14
      ? 'Chưa đạt số TC quy định: 14'
      : tongSoTC > 24
      ? 'Vượt quá số TC quy định: 24'
      : 'Thỏa mãn số TC quy định 14-24';
  const isOk = tongSoTC >= 14 && tongSoTC <= 24;
  return {
    isOk,
    text,
  };
}

export function extractListMaLop(classes: ClassModel[]) {
  const unique = uniqMaLop(classes);
  return unique.map((it) => it.MaLop);
}

export const parseDateToTimestamp = (dateStr: string): number | null => {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  // YYYY-MM-DD
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(trimmed)) {
    const [y, m, d] = trimmed.split('-').map(Number);
    return new Date(y, m - 1, d).getTime();
  }
  // DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
    const [d, m, y] = trimmed.split('/').map(Number);
    return new Date(y, m - 1, d).getTime();
  }
  const timestamp = Date.parse(trimmed);
  return isNaN(timestamp) ? null : timestamp;
};

export const isDateRangesOverlap = (classA: ClassModel, classB: ClassModel): boolean => {
  if (!classA?.NBD || !classA?.NKT || !classB?.NBD || !classB?.NKT) return true;

  const startA = parseDateToTimestamp(classA.NBD);
  const endA = parseDateToTimestamp(classA.NKT);
  const startB = parseDateToTimestamp(classB.NBD);
  const endB = parseDateToTimestamp(classB.NKT);

  if (startA !== null && endA !== null && startB !== null && endB !== null) {
    if (endA < startB || endB < startA) {
      return false;
    }
  }
  return true;
};

export const getDanhSachTiet = (tiet: ClassModel['Tiet']): string[] => {
  if (!tiet || tiet === '*' || tiet === 'N/A') return ['*'];
  const raw = String(tiet).trim();
  if (!raw || raw === '*') return ['*'];

  // Handle range format: "1-3", "6-10", "10-12", "1 - 5"
  const rangeMatch = raw.match(/^(\d+)\s*[-–—]\s*(\d+)$/);
  if (rangeMatch) {
    const start = parseInt(rangeMatch[1], 10);
    const end = parseInt(rangeMatch[2], 10);
    const res: string[] = [];
    for (let i = start; i <= end; i++) {
      res.push(String(i));
    }
    return res;
  }

  // Handle comma/semicolon/space separated: "1,2,3", "10, 11, 12", "6 7 8 9 10"
  if (raw.includes(',') || raw.includes(';') || raw.includes(' ')) {
    return raw
      .split(/[,;\s]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => (s === '0' ? '10' : s));
  }

  // Handle evening / 2-digit periods: "101112", "111213", "1011", "1112", "1213"
  if (raw === '101112') return ['10', '11', '12'];
  if (raw === '111213') return ['11', '12', '13'];
  if (raw === '1011') return ['10', '11'];
  if (raw === '1112') return ['11', '12'];
  if (raw === '1213') return ['12', '13'];
  if (raw === '10' || raw === '11' || raw === '12' || raw === '13') return [raw];

  // Handle strings ending with "10" like "678910", "78910", "8910", "910"
  if (raw.length > 2 && raw.endsWith('10')) {
    const prefix = raw.slice(0, -2);
    const prefixTiet = prefix.split('').map((c) => (c === '0' ? '10' : c));
    return [...prefixTiet, '10'];
  }

  // Default: single digit per period, normalizing '0' (period 10) to '10'
  return raw.split('').map((c) => (c === '0' ? '10' : c));
};

export const getBuoiFromTiet = (tiet: ClassModel['Tiet']): Buoi => {
  if (!tiet || tiet === '*') return Buoi.N_A;
  const listTiet = getDanhSachTiet(tiet);
  if (listTiet.includes('*')) return Buoi.N_A;
  if (listTiet.some((t) => ['11', '12', '13'].includes(t))) return Buoi.Toi;
  if (listTiet.some((t) => ['6', '7', '8', '9', '10', '0'].includes(t))) return Buoi.Chieu;
  if (listTiet.some((t) => ['1', '2', '3', '4', '5'].includes(t))) return Buoi.Sang;
  return Buoi.N_A;
};

/**
 * "*": Không lên trường
 * 2-1, 2-2, 2-3: Thứ 2, tiết 1,2,3
 * 7-11, 7-12, 7-13: Thứ 7, tiết 11,12,13
 */
type ValidTimeSlot = `${string}-${string}`;
type TimeSlots = '*' | ValidTimeSlot[];
const getTimeSlots = ({ Thu, Tiet }: ClassModel): TimeSlots => {
  if (!Thu || Thu === '*' || !Tiet || Tiet === '*') return '*';
  const listTiet = getDanhSachTiet(Tiet).filter((t) => t !== '*');
  if (!listTiet.length) return '*';
  return listTiet.map((tiet): ValidTimeSlot => `${Thu}-${tiet === '0' ? '10' : tiet}`);
};

const isTimeSlotsOverlap = (timeSlotsA: TimeSlots, timeSlotsB: TimeSlots) => {
  if (timeSlotsA === '*' || timeSlotsB === '*') return false;
  return timeSlotsA.some((slotA) => timeSlotsB.includes(slotA));
};

export const hasOverlapSchedule = (classAs: ClassModel[], classB: ClassModel) => {
  const classBTimeSlots = getTimeSlots(classB);
  if (classBTimeSlots === '*') return false;

  return classAs.some((classA) => {
    if (isSameAgGridRowId(classA, classB)) return false;
    if (!isDateRangesOverlap(classA, classB)) return false;
    const classATimeSlots = getTimeSlots(classA);
    return isTimeSlotsOverlap(classATimeSlots, classBTimeSlots);
  });
};

// Thường thì MaLop alone is enough because most of the classes only appear once a week or once every 2 weeks, nhưng mà có thể có môn Anh Văn học 1 tuần tới 2 buổi, nên cần có thêm Thu và Tiet
// TODO: maybe use STT?
export const getAgGridRowId = (classModel: ClassModel): string => {
  return classModel.MaLop + classModel.Thu + classModel.Tiet;
};

export const isSameAgGridRowId = (class1: ClassModel, class2: ClassModel) => {
  return getAgGridRowId(class1) === getAgGridRowId(class2);
};

export const findOverlapedClasses = (
  /** the first elements in the array will have higher priority, it's OK to have duplicated classes */
  classes: ClassModel[],
): { kept: ClassModel[]; redundant: TTrungTkb[] } => {
  const kept: ClassModel[] = [];
  const redundant: TTrungTkb[] = [];

  const findExistingOverlap = (newClass: ClassModel) => {
    const newClassTimeSlots = getTimeSlots(newClass);
    if (newClassTimeSlots === '*') return undefined;

    return kept.find((existingClass) => {
      if (!isDateRangesOverlap(existingClass, newClass)) return false;
      const existingClassTimeSlots = getTimeSlots(existingClass);
      return isTimeSlotsOverlap(existingClassTimeSlots, newClassTimeSlots);
    });
  };

  const processedAgGridRowIds = new Set<string>();
  classes.forEach((addingClass) => {
    const agGridRowId = getAgGridRowId(addingClass);
    if (processedAgGridRowIds.has(agGridRowId)) return;

    processedAgGridRowIds.add(agGridRowId);
    const existingClassOverlapped = findExistingOverlap(addingClass);
    // TODO: refactor the mess below
    const existingRedundant =
      existingClassOverlapped && redundant.find((it) => isSameAgGridRowId(it.existing, existingClassOverlapped));
    if (existingRedundant) {
      existingRedundant.new.push(addingClass);
    } else if (existingClassOverlapped) {
      redundant.push({
        existing: existingClassOverlapped,
        new: [addingClass],
      });
    } else {
      kept.push(addingClass);
    }
  });

  return { kept, redundant };
};

export const log = (...args: any[]) => {
  (window.__DEBUG__ || !isProd) && console.log(...args);
};
