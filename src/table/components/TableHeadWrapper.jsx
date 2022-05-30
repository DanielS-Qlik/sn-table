import React, { memo, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/system';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import SearchIcon from '@mui/icons-material/Search';

import { useContextSelector, TableContext } from '../context';
import { getHeaderStyle } from '../utils/styling-utils';
import { headHandleKeyPress } from '../utils/handle-key-press';
import { handleClickToFocusHead } from '../utils/handle-accessibility';

const VisuallyHidden = styled('span')({
  border: 0,
  clip: 'rect(0 0 0 0)',
  height: 1,
  margin: -1,
  overflow: 'hidden',
  padding: 0,
  position: 'absolute',
  top: 20,
  width: 1,
});

function TableHeadWrapper({
  rootElement,
  tableData,
  theme,
  layout,
  changeSortOrder,
  constraints,
  translator,
  selectionsAPI,
  keyboard,
  embed,
}) {
  const { columns, paginationNeeded } = tableData;
  const isFocusInHead = useContextSelector(TableContext, (value) => value.focusedCellCoord[0] === 0);
  const setFocusedCellCoord = useContextSelector(TableContext, (value) => value.setFocusedCellCoord);

  const headRowStyle = {
    '& :last-child': {
      borderRight: paginationNeeded && 0,
    },
    'th:first-of-type': {
      borderLeft: !paginationNeeded && '1px solid rgb(217, 217, 217)',
    },
  };
  const headerStyle = useMemo(() => getHeaderStyle(layout, theme), [layout, theme.name(), theme.table.backgroundColor]);
  const tableSortLabelStyle = {
    '&.Mui-active .MuiTableSortLabel-icon': {
      color: headerStyle.sortLabelColor,
    },
  };

  const tableContainerRef = useRef();
  const handleSearch = async (evt, label) => {
    evt.preventDefault();
    const fieldInstance = await embed.field(label);
    fieldInstance.mount(tableContainerRef.current);
  };

  return (
    <TableHead ref={tableContainerRef}>
      <TableRow sx={headRowStyle} className="sn-table-row">
        {columns.map((column, columnIndex) => {
          const tabIndex = columnIndex === 0 && !keyboard.enabled ? 0 : -1;
          const isCurrentColumnActive = layout.qHyperCube.qEffectiveInterColumnSortOrder[0] === column.dataColIdx;

          return (
            <TableCell
              // ref={tableCellWrapperRef}
              sx={headerStyle}
              key={column.id}
              align={column.align}
              className="sn-table-head-cell sn-table-cell"
              tabIndex={tabIndex}
              aria-sort={isCurrentColumnActive ? `${column.sortDirection}ending` : null}
              aria-pressed={isCurrentColumnActive}
              onKeyDown={(e) =>
                headHandleKeyPress(
                  e,
                  rootElement,
                  [0, columnIndex],
                  column,
                  changeSortOrder,
                  layout,
                  !constraints.active,
                  setFocusedCellCoord
                )
              }
              onMouseDown={() => handleClickToFocusHead(columnIndex, rootElement, setFocusedCellCoord, keyboard)}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <SearchIcon
                  aria-label="search"
                  fontSize="small"
                  sx={{ cursor: 'pointer' }}
                  onClick={(evt) => handleSearch(evt, column.label)}
                />
                <TableSortLabel
                  onClick={() => !selectionsAPI.isModal() && !constraints.active && changeSortOrder(layout, column)}
                  sx={tableSortLabelStyle}
                  active={isCurrentColumnActive}
                  title={!constraints.passive && column.sortDirection} // passive: turn off tooltips.
                  direction={column.sortDirection}
                  tabIndex={-1}
                >
                  {column.label}
                  {isFocusInHead && (
                    <VisuallyHidden data-testid={`VHL-for-col-${columnIndex}`}>
                      {translator.get('SNTable.SortLabel.PressSpaceToSort')}
                    </VisuallyHidden>
                  )}
                </TableSortLabel>
              </div>
            </TableCell>
          );
        })}
      </TableRow>
    </TableHead>
  );
}

TableHeadWrapper.propTypes = {
  rootElement: PropTypes.object.isRequired,
  tableData: PropTypes.object.isRequired,
  theme: PropTypes.object.isRequired,
  layout: PropTypes.object.isRequired,
  changeSortOrder: PropTypes.func.isRequired,
  constraints: PropTypes.object.isRequired,
  selectionsAPI: PropTypes.object.isRequired,
  keyboard: PropTypes.object.isRequired,
  translator: PropTypes.object.isRequired,
  embed: PropTypes.object.isRequired,
};

export default memo(TableHeadWrapper);
