import React, { MouseEvent } from 'react';
import { stardust } from '@nebula.js/stardust';
import { Announce, Cell, ChangeSortOrder, TotalsPosition, Column } from '../../types';
import { SelectionDispatch } from '../types';
import { SelectionActions } from '../constants';
import { removeTabAndFocusCell, updateFocus, getCellElement } from './accessibility-utils';

export const handleClickToFocusBody = (
  cell: Cell,
  rootElement: HTMLElement,
  setFocusedCellCoord: React.Dispatch<React.SetStateAction<[number, number]>>,
  keyboard: stardust.Keyboard,
  totalsPosition: TotalsPosition
) => {
  const { pageRowIdx, pageColIdx } = cell;
  const adjustedRowIdx = totalsPosition === 'top' ? pageRowIdx + 2 : pageRowIdx + 1;
  removeTabAndFocusCell([adjustedRowIdx, pageColIdx], rootElement, setFocusedCellCoord, keyboard);
};

export const handleClickToFocusHead = (
  columnIndex: number,
  rootElement: HTMLElement,
  setFocusedCellCoord: React.Dispatch<React.SetStateAction<[number, number]>>,
  keyboard: stardust.Keyboard
) => {
  removeTabAndFocusCell([0, columnIndex], rootElement, setFocusedCellCoord, keyboard);
};

export const handleMouseDownLabelToFocusHeadCell = (evt: MouseEvent, rootElement: HTMLElement, columnIndex: number) => {
  evt.preventDefault();
  updateFocus({ focusType: 'focus', cell: getCellElement(rootElement, [0, columnIndex]) });
};

export const handleClickToSort = (
  evt: React.MouseEvent,
  column: Column,
  changeSortOrder: ChangeSortOrder,
  isInteractionEnabled: boolean
) => {
  !(evt.target as HTMLElement).closest('#sn-table-head-menu-button') && isInteractionEnabled && changeSortOrder(column);
};

/**
 * gets all relevant mouse handlers for making selections, including dragging to select multiple rows
 */
export const getSelectionMouseHandlers = (
  cell: Cell,
  announce: Announce,
  onMouseDown: React.MouseEventHandler<HTMLTableCellElement> | undefined,
  selectionDispatch: SelectionDispatch,
  areBasicFeaturesEnabled: boolean
) => {
  const handleMouseDown = (evt: React.MouseEvent) => {
    // run handleClickToFocusBody
    onMouseDown?.(evt as React.MouseEvent<HTMLTableCellElement>);
    // only need to check isSelectable here. once you are holding you want to be able to drag outside the current column
    if (areBasicFeaturesEnabled && cell.isSelectable) {
      const mouseupOutsideCallback = () => selectionDispatch({ type: SelectionActions.SELECT_MULTI_END });
      selectionDispatch({ type: SelectionActions.SELECT_MOUSE_DOWN, payload: { cell, mouseupOutsideCallback } });
    }
  };

  const handleMouseOver = (evt: React.MouseEvent) => {
    if (areBasicFeaturesEnabled && evt.buttons === 1)
      selectionDispatch({ type: SelectionActions.SELECT_MULTI_ADD, payload: { cell, evt, announce } });
  };

  const handleMouseUp = (evt: React.MouseEvent) => {
    if (evt.button === 0) {
      if (areBasicFeaturesEnabled) {
        selectionDispatch({ type: SelectionActions.SELECT_MOUSE_UP, payload: { cell, evt, announce } });
      } else if (cell.isSelectable) {
        selectionDispatch({ type: SelectionActions.SELECT, payload: { cell, evt, announce } });
      }
    }
  };

  return { handleMouseDown, handleMouseOver, handleMouseUp };
};
