import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { IconButton, Tooltip } from '@mui/material';
import clsx from 'clsx';
import constate from 'constate';
import groupBy from 'lodash/groupBy';
import reverse from 'lodash/reverse';
import { useMemo, useState } from 'react';
import { tracker } from '../../..';
import { ClassModel } from '../../../types';
import { getMaMHFromClass, isSameAgGridRowId, isThucHanhClass, uniqMaLop } from '../../../utils';
import { selectIsChiVeTkb, selectSelectedClasses, selectSelectedClassesBuoc3, useTkbStore } from '../../../zus';
import { usePhanLoaiHocTrenTruongContext } from './hooks';
import './styles.css';

const randomColors = [
  '#FF5733',
  '#3498DB',
  '#1ABC9C',
  '#9B59B6',
  '#E74C3C',
  '#2ECC71',
  '#F39C12',
  '#7F8C8D',
  '#D35400',
  '#2980B9',
  '#27AE60',
  '#8E44AD',
  '#C0392B',
  '#16A085',
  '#F1C40F',
  '#34495E',
  '#E67E22',
  '#3498DB',
  '#2C3E50',
  '#E74C3C',
  '#1B1464',
  '#6C3483',
  '#2E4053',
  '#FF4500',
  '#008080',
  '#800000',
  '#8B4513',
  '#FF6347',
  '#4B0082',
  '#7CFC00',
  '#8A2BE2',
  '#00FA9A',
  '#DC143C',
  '#20B2AA',
  '#FFFF00',
  '#191970',
  '#A52A2A',
  '#808080',
  '#8B008B',
  '#008B8B',
  '#00CED1',
  '#BC8F8F',
  '#4169E1',
  '#00FF7F',
  '#FF1493',
] as const;

type Props = {
  data: ClassModel;
  isOutsideTable?: boolean;
} & React.TdHTMLAttributes<HTMLTableCellElement>;

// Two classes are a valid LT+TH pair when one MaLop is a prefix of the other
// e.g. IT004.R110 (LT) and IT004.R110.1 (TH) — the TH's MaLop starts with LT's MaLop + "."
const isRelatedClasses = (a: ClassModel, b: ClassModel): boolean => {
  const aLop = (a.MaLop || '').trim();
  const bLop = (b.MaLop || '').trim();
  return aLop.startsWith(bLop + '.') || bLop.startsWith(aLop + '.');
};

const useMonChonRoi = () => {
  const newRandomColors = useMemo(() => reverse([...randomColors]), []);
  const selectedClasses = useTkbStore(selectSelectedClassesBuoc3);

  // For each selected class, find if there's any OTHER selected class with same MaMH
  // that is NOT a related LT/TH pair → that's a true duplicate worth warning
  const warningClassSet = useMemo(() => {
    const uniq = uniqMaLop(selectedClasses);
    const warningMaLops = new Set<string>();
    for (let i = 0; i < uniq.length; i++) {
      for (let j = i + 1; j < uniq.length; j++) {
        const a = uniq[i];
        const b = uniq[j];
        if (getMaMHFromClass(a) !== getMaMHFromClass(b)) continue; // different subject
        if (isRelatedClasses(a, b)) continue; // valid LT+TH pair, skip
        // Same subject, not a LT/TH pair → both are duplicates
        warningMaLops.add(a.MaLop);
        warningMaLops.add(b.MaLop);
      }
    }
    return warningMaLops;
  }, [selectedClasses]);

  // Assign a color per "duplicate group" (same MaMH, unrelated classes)
  const colorMap = useMemo(() => {
    const result: Record<string, string> = {};
    let colorIdx = 0;
    const uniq = uniqMaLop(selectedClasses);
    // Group classes that are duplicates together by MaMH
    const groups = new Map<string, ClassModel[]>();
    for (const cls of uniq) {
      if (!warningClassSet.has(cls.MaLop)) continue;
      const key = getMaMHFromClass(cls);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(cls);
    }
    groups.forEach((classes) => {
      const color = newRandomColors[colorIdx++ % newRandomColors.length];
      for (const cls of classes) result[cls.MaLop] = color;
    });
    return result;
  }, [selectedClasses, warningClassSet, newRandomColors]);

  const getWarningColor = (data: ClassModel) => colorMap[data.MaLop];
  const isWarning = (data: ClassModel) => warningClassSet.has(data.MaLop);
  return { isWarning, getWarningColor };
};
export const [ClassCellContext, useClassCellContext] = constate(() => {
  const [cellHovering, setCellHovering] = useState<ClassModel | null>(null);
  const [isHoveringOnRemoveIcon, setIsHoveringOnRemoveIcon] = useState(false);
  const [isHoveringOnWarningIcon, setIsHoveringOnWarningIcon] = useState(false);
  const { isWarning, getWarningColor } = useMonChonRoi();
  const isHoveringOnThisCell = (data: ClassModel, fieldCompare: keyof ClassModel) => {
    return cellHovering?.[fieldCompare] === data?.[fieldCompare];
  };
  const isHoveringOnThisCellRemoveIcon = (data: ClassModel) =>
    isHoveringOnThisCell(data, 'MaMH') && isHoveringOnRemoveIcon;
  const isHoveringOnThisCellWarningIcon = (data: ClassModel) => {
    // Show tooltip on all classes in the same warning group (same subject, duplicate)
    return (
      !!cellHovering &&
      isWarning(data) &&
      isWarning(cellHovering) &&
      getMaMHFromClass(data) === getMaMHFromClass(cellHovering) &&
      isHoveringOnWarningIcon
    );
  };
  const onRemoveClass = () => {
    setCellHovering(null);
    setIsHoveringOnRemoveIcon(false);
    setIsHoveringOnWarningIcon(false);
  };
  return {
    isHoveringOnThisCell,
    isHoveringOnThisCellRemoveIcon,
    isHoveringOnThisCellWarningIcon,
    setCellHovering,
    setIsHoveringOnRemoveIcon,
    setIsHoveringOnWarningIcon,
    isWarning,
    getWarningColor,
    onRemoveClass,
  };
});

function ClassCell({ data, isOutsideTable = false, ...restProps }: Props) {
  const { MaLop, NgonNgu, TenMH, TenGV, PhongHoc, NBD, NKT, Thu, Tiet } = data;

  // Format yyyy-MM-dd → dd/MM/yyyy for display
  const formatDate = (d: string | undefined) => {
    if (!d || d === 'NaN-NaN-NaN') return '';
    const parts = d.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return d;
  };
  const nbdDisplay = formatDate(NBD);
  const nktDisplay = formatDate(NKT);
  const removeClasses = useTkbStore((s) => s.removeClasses);
  const selectedClasses = useTkbStore(selectSelectedClasses);
  const isChiVeTkb = useTkbStore(selectIsChiVeTkb);
  const {
    isHoveringOnThisCell,
    isHoveringOnThisCellRemoveIcon,
    isHoveringOnThisCellWarningIcon,
    setIsHoveringOnWarningIcon,
    setCellHovering,
    setIsHoveringOnRemoveIcon,
    isWarning,
    getWarningColor,
    onRemoveClass,
  } = useClassCellContext();

  const { redundant } = usePhanLoaiHocTrenTruongContext();

  // display warning for classes of same subject
  const cacLopChungMonDangChon = useMemo(() => {
    const maMH = getMaMHFromClass(data);
    return selectedClasses.filter((selectedClass) => getMaMHFromClass(selectedClass) === maMH);
  }, [data, selectedClasses]);

  const redundantIndex = redundant.findIndex((info) => {
    return (
      isSameAgGridRowId(info.existing, data) || info.new.some((addingClass) => isSameAgGridRowId(addingClass, data))
    );
  });
  const isRedundantRelated = redundantIndex > -1;

  return (
    <Tooltip title={isRedundantRelated ? 'Bị trùng TKB' : null}>
      <td
        {...restProps}
        className={clsx('cell-class', {
          'cell-class-hovering': isHoveringOnThisCell(data, 'MaMH'),
        })}
        style={{
          boxShadow: isRedundantRelated ? `inset 0 0 0 3px ${randomColors[redundantIndex]}` : undefined,
        }}
        onMouseEnter={() => setCellHovering(data)}
        onMouseLeave={() => setCellHovering(null)}
      >
        {!isChiVeTkb && (
          <Tooltip
            title={
              <>
                Xoá môn này
                {isWarning(data) && isHoveringOnThisCell(data, 'MaLop') && (
                  <>
                    <br />
                    hoặc Shift+Click để chỉ xoá slot thừa này
                  </>
                )}
              </>
            }
            open={isHoveringOnThisCellRemoveIcon(data)}
          >
            <IconButton
              onMouseEnter={() => setIsHoveringOnRemoveIcon(true)}
              onMouseLeave={() => setIsHoveringOnRemoveIcon(false)}
              style={{ position: 'absolute', top: 0, right: 0 }}
              color="inherit"
              size="small"
              onClick={(e) => {
                let clickType: string;
                const classesToRemove = (() => {
                  if (isWarning(data) && e.shiftKey) {
                    clickType = 'shift_click';
                    return [data];
                  }
                  if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
                    clickType = 'cmd_shift_click';
                    // easter eggs: Cmd + Shift + Click to remove all selected classes
                    return selectedClasses;
                  }
                  clickType = 'click';
                  return cacLopChungMonDangChon;
                })();
                tracker.track('[tkb_table] btn_remove_class_clicked', {
                  clickType,
                  classesToRemove: classesToRemove.map((it) => it.MaLop).join(','),
                });
                removeClasses(classesToRemove);
                onRemoveClass();
              }}
              className="remove-class-btn"
            >
              <DeleteOutlineIcon />
            </IconButton>
          </Tooltip>
        )}
        <strong>
          {MaLop}
          {isWarning(data) && (
            <Tooltip open={isHoveringOnThisCellWarningIcon(data)} title="Có vẻ như bạn đang chọn thừa cho môn này">
              <WarningAmberIcon
                onMouseEnter={() => setIsHoveringOnWarningIcon(true)}
                onMouseLeave={() => setIsHoveringOnWarningIcon(false)}
                style={{ color: getWarningColor(data) }}
              />
            </Tooltip>
          )}{' '}
          - {NgonNgu}
        </strong>
        <br />
        {TenMH}
        <br />
        <strong>{TenGV}</strong>
        <br />
        {PhongHoc}
        <br />
        {nbdDisplay && (
          <>
            BĐ: {nbdDisplay}
            <br />
          </>
        )}
        {nktDisplay && (
          <>
            KT: {nktDisplay}
            <br />
          </>
        )}
        {isOutsideTable && (
          <>
            <br />
            <strong>
              Thứ {Thu} Tiết {Tiet}
            </strong>
            <br />
          </>
        )}
      </td>
    </Tooltip>
  );
}

export default ClassCell;
