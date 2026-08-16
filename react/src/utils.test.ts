import { Buoi, ClassModel } from './types';
import {
  findOverlapedClasses,
  getBuoiFromTiet,
  getDanhSachTiet,
  hasOverlapSchedule,
  isDateRangesOverlap,
  isThucHanhClass,
} from './utils';

const createMockClass = (overrides: Partial<ClassModel>): ClassModel => ({
  STT: 1,
  MaMH: 'IT001',
  MaLop: 'IT001.O11',
  TenMH: 'Nhập môn lập trình',
  MaGV: 'GV01',
  TenGV: 'Nguyễn Văn A',
  SiSo: '50',
  SoTc: 4,
  ThucHanh: 0,
  HTGD: 'LT',
  Thu: '2',
  Tiet: '123',
  CachTuan: '0',
  PhongHoc: 'A101',
  KhoaHoc: '2023',
  HocKy: '1',
  NamHoc: '2023-2024',
  HeDT: 'CQUI',
  KhoaQL: 'CNTT',
  NBD: '2023-09-04',
  NKT: '2023-12-30',
  GhiChu: '',
  NgonNgu: 'Tiếng Việt',
  ...overrides,
});

describe('getDanhSachTiet', () => {
  it('handles standard single-digit periods', () => {
    expect(getDanhSachTiet('123')).toEqual(['1', '2', '3']);
    expect(getDanhSachTiet('678')).toEqual(['6', '7', '8']);
  });

  it('handles periods ending with 10 or containing 0 as period 10', () => {
    expect(getDanhSachTiet('678910')).toEqual(['6', '7', '8', '9', '10']);
    expect(getDanhSachTiet('78910')).toEqual(['7', '8', '9', '10']);
    expect(getDanhSachTiet('8910')).toEqual(['8', '9', '10']);
    expect(getDanhSachTiet('67890')).toEqual(['6', '7', '8', '9', '10']);
    expect(getDanhSachTiet('10')).toEqual(['10']);
    expect(getDanhSachTiet('0')).toEqual(['10']);
  });

  it('handles evening periods correctly without breaking into 1s and 2s', () => {
    expect(getDanhSachTiet('111213')).toEqual(['11', '12', '13']);
    expect(getDanhSachTiet('101112')).toEqual(['10', '11', '12']);
    expect(getDanhSachTiet('1112')).toEqual(['11', '12']);
    expect(getDanhSachTiet('11')).toEqual(['11']);
    expect(getDanhSachTiet('12')).toEqual(['12']);
    expect(getDanhSachTiet('13')).toEqual(['13']);
  });

  it('handles range formats', () => {
    expect(getDanhSachTiet('1-3')).toEqual(['1', '2', '3']);
    expect(getDanhSachTiet('6-10')).toEqual(['6', '7', '8', '9', '10']);
    expect(getDanhSachTiet('10-12')).toEqual(['10', '11', '12']);
  });

  it('handles separated formats', () => {
    expect(getDanhSachTiet('1,2,3')).toEqual(['1', '2', '3']);
    expect(getDanhSachTiet('6, 7, 8, 9, 10')).toEqual(['6', '7', '8', '9', '10']);
    expect(getDanhSachTiet('6 7 8 9 10')).toEqual(['6', '7', '8', '9', '10']);
  });

  it('handles online or empty', () => {
    expect(getDanhSachTiet('*')).toEqual(['*']);
    expect(getDanhSachTiet('')).toEqual(['*']);
  });
});

describe('getBuoiFromTiet', () => {
  it('correctly classifies morning, afternoon, and evening', () => {
    expect(getBuoiFromTiet('123')).toBe(Buoi.Sang);
    expect(getBuoiFromTiet('67890')).toBe(Buoi.Chieu);
    expect(getBuoiFromTiet('678910')).toBe(Buoi.Chieu); // was falsely classified as Buoi.Sang before fix
    expect(getBuoiFromTiet('78910')).toBe(Buoi.Chieu);
    expect(getBuoiFromTiet('111213')).toBe(Buoi.Toi);
    expect(getBuoiFromTiet('*')).toBe(Buoi.N_A);
  });
});

describe('Schedule overlap detection', () => {
  it('does NOT report conflict for morning class (123) and afternoon class (678910) on same day', () => {
    const morningClass = createMockClass({ MaLop: 'IT001.N11', Thu: '2', Tiet: '123' });
    const afternoonClass = createMockClass({ MaLop: 'MA003.N12', Thu: '2', Tiet: '678910' });

    expect(hasOverlapSchedule([morningClass], afternoonClass)).toBe(false);

    const { kept, redundant } = findOverlapedClasses([morningClass, afternoonClass]);
    expect(kept.length).toBe(2);
    expect(redundant.length).toBe(0);
  });

  it('does NOT report conflict for morning class (123) and afternoon class (67890) on same day', () => {
    const morningClass = createMockClass({ MaLop: 'IT001.N11', Thu: '2', Tiet: '123' });
    const afternoonClass = createMockClass({ MaLop: 'MA003.N12', Thu: '2', Tiet: '67890' });

    expect(hasOverlapSchedule([morningClass], afternoonClass)).toBe(false);

    const { kept, redundant } = findOverlapedClasses([morningClass, afternoonClass]);
    expect(kept.length).toBe(2);
    expect(redundant.length).toBe(0);
  });

  it('does NOT report conflict for morning class (123) and evening class (111213) on same day', () => {
    const morningClass = createMockClass({ MaLop: 'IT001.N11', Thu: '2', Tiet: '123' });
    const eveningClass = createMockClass({ MaLop: 'AV001.N13', Thu: '2', Tiet: '111213' });

    expect(hasOverlapSchedule([morningClass], eveningClass)).toBe(false);

    const { kept, redundant } = findOverlapedClasses([morningClass, eveningClass]);
    expect(kept.length).toBe(2);
    expect(redundant.length).toBe(0);
  });

  it('does NOT report conflict for classes on different days', () => {
    const class1 = createMockClass({ MaLop: 'IT001.N11', Thu: '2', Tiet: '123' });
    const class2 = createMockClass({ MaLop: 'MA003.N12', Thu: '3', Tiet: '123' });

    expect(hasOverlapSchedule([class1], class2)).toBe(false);
  });

  it('does NOT report conflict for 2 online classes (Thu: *) or (Tiet: *)', () => {
    const online1 = createMockClass({ MaLop: 'ONLINE.01', Thu: '*', Tiet: '*' });
    const online2 = createMockClass({ MaLop: 'ONLINE.02', Thu: '*', Tiet: '*' });

    expect(hasOverlapSchedule([online1], online2)).toBe(false);

    const { kept, redundant } = findOverlapedClasses([online1, online2]);
    expect(kept.length).toBe(2);
    expect(redundant.length).toBe(0);
  });

  it('does NOT report conflict for 2 classes in different date ranges (half semesters)', () => {
    const phase1Class = createMockClass({
      MaLop: 'PE001.N11',
      Thu: '2',
      Tiet: '123',
      NBD: '2023-09-04',
      NKT: '2023-10-22',
    });
    const phase2Class = createMockClass({
      MaLop: 'PE002.N11',
      Thu: '2',
      Tiet: '123',
      NBD: '2023-10-30',
      NKT: '2023-12-30',
    });

    expect(isDateRangesOverlap(phase1Class, phase2Class)).toBe(false);
    expect(hasOverlapSchedule([phase1Class], phase2Class)).toBe(false);

    const { kept, redundant } = findOverlapedClasses([phase1Class, phase2Class]);
    expect(kept.length).toBe(2);
    expect(redundant.length).toBe(0);
  });

  it('correctly reports conflict for overlapping time on same day and same date range', () => {
    const class1 = createMockClass({ MaLop: 'IT001.N11', Thu: '2', Tiet: '123' });
    const class2 = createMockClass({ MaLop: 'IT002.N12', Thu: '2', Tiet: '345' }); // Overlaps at period 3

    expect(hasOverlapSchedule([class1], class2)).toBe(true);

    const { kept, redundant } = findOverlapedClasses([class1, class2]);
    expect(kept.length).toBe(1);
    expect(redundant.length).toBe(1);
  });
});

describe('isThucHanhClass and getMaMHFromClass', () => {
  it('correctly identifies practical / lab classes vs lecture classes', () => {
    const ltClass = createMockClass({ MaLop: 'IT004.R110', HTGD: 'LT', ThucHanh: 0 });
    const thClass = createMockClass({ MaLop: 'IT004.R110.1', HTGD: 'LT', ThucHanh: 0 }); // has .1 suffix
    const thClass2 = createMockClass({ MaLop: 'IT004.R110', HTGD: 'TH', ThucHanh: 0 }); // has HTGD = TH
    const thClass3 = createMockClass({ MaLop: 'IT004.R110', HTGD: 'LT', ThucHanh: 1 }); // has ThucHanh = 1

    expect(isThucHanhClass(ltClass)).toBe(false);
    expect(isThucHanhClass(thClass)).toBe(true);
    expect(isThucHanhClass(thClass2)).toBe(true);
    expect(isThucHanhClass(thClass3)).toBe(true);
  });

  it('correctly extracts MaMH and distinguishes keys for IT004.R110 and IT004.R110.1', () => {
    const { getMaMHFromClass } = require('./utils');
    const ltClass = createMockClass({ MaMH: 'IT004', MaLop: 'IT004.R110' });
    const thClass = createMockClass({ MaMH: '', MaLop: 'IT004.R110.1' });

    expect(getMaMHFromClass(ltClass)).toBe('IT004');
    expect(getMaMHFromClass(thClass)).toBe('IT004');

    const keyLT = `${getMaMHFromClass(ltClass)}-${isThucHanhClass(ltClass) ? 'TH' : 'LT'}`;
    const keyTH = `${getMaMHFromClass(thClass)}-${isThucHanhClass(thClass) ? 'TH' : 'LT'}`;

    expect(keyLT).toBe('IT004-LT');
    expect(keyTH).toBe('IT004-TH');
    expect(keyLT).not.toBe(keyTH);
  });
});
