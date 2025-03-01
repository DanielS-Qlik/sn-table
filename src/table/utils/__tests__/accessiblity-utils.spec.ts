import { stardust } from '@nebula.js/stardust';
import React from 'react';
import { Announce } from '../../../types';
import * as accessibilityUtils from '../accessibility-utils';

describe('handle-accessibility', () => {
  let cell: HTMLTableCellElement | undefined;
  let keyboard: stardust.Keyboard;
  let rootElement: HTMLElement;
  let focusedCellCoord: [number, number];
  let setFocusedCellCoord: React.Dispatch<React.SetStateAction<[number, number]>>;

  beforeEach(() => {
    cell = { focus: jest.fn(), blur: jest.fn(), setAttribute: jest.fn() } as unknown as HTMLTableCellElement;
    rootElement = {
      getElementsByClassName: () => [{ getElementsByClassName: () => [cell] }],
      querySelector: () => cell,
    } as unknown as HTMLDivElement;
    focusedCellCoord = [0, 0];
    setFocusedCellCoord = jest.fn();
    keyboard = {
      blur: jest.fn(),
      focus: jest.fn(),
      focusSelection: jest.fn(),
      enabled: true,
      active: false,
    } as unknown as stardust.Keyboard;
  });

  afterEach(() => jest.clearAllMocks());

  describe('updateFocus', () => {
    let focusType: string;
    beforeEach(() => {
      focusType = 'focus';
    });

    it('should focus cell and call setAttribute when focusType is focus', () => {
      accessibilityUtils.updateFocus({ focusType, cell });
      expect(cell?.focus).toHaveBeenCalledTimes(1);
      expect(cell?.setAttribute).toHaveBeenCalledWith('tabIndex', '0');
    });

    it('should blur cell and call setAttribute when focusType is blur', () => {
      focusType = 'blur';

      accessibilityUtils.updateFocus({ focusType, cell });
      expect(cell?.blur).toHaveBeenCalledTimes(1);
      expect(cell?.setAttribute).toHaveBeenCalledWith('tabIndex', '-1');
    });

    it('should call setAttribute when focusType is addTab', () => {
      focusType = 'addTab';

      accessibilityUtils.updateFocus({ focusType, cell });
      expect(cell?.focus).not.toHaveBeenCalled();
      expect(cell?.setAttribute).toHaveBeenCalledWith('tabIndex', '0');
    });

    it('should call setAttribute when focusType is removeTab', () => {
      focusType = 'removeTab';

      accessibilityUtils.updateFocus({ focusType, cell });
      expect(cell?.blur).not.toHaveBeenCalled();
      expect(cell?.setAttribute).toHaveBeenCalledWith('tabIndex', '-1');
    });

    it('should early return and not throw error when cell is undefined', () => {
      cell = undefined;
      expect(() => accessibilityUtils.updateFocus({ focusType, cell })).not.toThrow();
    });
  });

  describe('findCellWithTabStop', () => {
    const elementCreator = (type: string, tabIdx: string) => {
      const targetElement = global.document.createElement(type);
      targetElement.setAttribute('tabIndex', tabIdx);
      return targetElement;
    };

    beforeEach(() => {
      rootElement = {
        querySelector: () => {
          if ((cell?.tagName === 'TD' || cell?.tagName === 'TH') && cell?.getAttribute('tabIndex') === '0') return cell;
          return null;
        },
      } as unknown as HTMLDivElement;
    });

    it('should return active td element', () => {
      cell = elementCreator('td', '0') as HTMLTableCellElement;

      const cellElement = accessibilityUtils.findCellWithTabStop(rootElement);

      expect(cellElement).not.toBeNull();
      expect(cellElement.tagName).toBe('TD');
      expect(cellElement.getAttribute('tabIndex')).toBe('0');
    });

    it('should return active th element', () => {
      cell = elementCreator('th', '0') as HTMLTableCellElement;
      const cellElement = accessibilityUtils.findCellWithTabStop(rootElement);

      expect(cellElement).not.toBeNull();
      expect(cellElement.tagName).toBe('TH');
      expect(cellElement.getAttribute('tabIndex')).toBe('0');
    });

    it('should return null', () => {
      cell = elementCreator('div', '-1') as HTMLTableCellElement;
      const cellElement = accessibilityUtils.findCellWithTabStop(rootElement);
      expect(cellElement).toBeNull();
    });
  });

  describe('resetFocus', () => {
    let shouldRefocus: React.MutableRefObject<boolean>;
    let isSelectionMode: boolean;
    let announce: Announce;
    let totalsPosition: string;

    const resetFocus = () =>
      accessibilityUtils.resetFocus({
        focusedCellCoord,
        rootElement,
        shouldRefocus,
        isSelectionMode,
        setFocusedCellCoord,
        keyboard,
        announce,
        totalsPosition,
      });

    beforeEach(() => {
      focusedCellCoord = [2, 1];
      shouldRefocus = { current: false };
      isSelectionMode = false;
      keyboard.enabled = true;
      keyboard.active = true;
      totalsPosition = 'bottom';
      announce = jest.fn();
    });

    it('should only remove tabIndex when keyboard.enabled is true and keyboard.active is false', () => {
      keyboard.enabled = true;
      keyboard.active = false;

      resetFocus();
      expect(cell?.setAttribute).toHaveBeenCalledTimes(1);
      expect(setFocusedCellCoord).toHaveBeenCalledWith([0, 0]);
      expect(cell?.focus).not.toHaveBeenCalled();
      expect(announce).not.toHaveBeenCalled();
    });

    it('should set tabindex on the first cell and not focus', () => {
      resetFocus();
      expect(cell?.setAttribute).toHaveBeenCalledTimes(2);
      expect(setFocusedCellCoord).toHaveBeenCalledWith([0, 0]);
      expect(cell?.focus).not.toHaveBeenCalled();
      expect(announce).not.toHaveBeenCalled();
    });

    it('should set tabindex on the first cell and focus when shouldRefocus is true', () => {
      shouldRefocus.current = true;

      resetFocus();
      expect(cell?.setAttribute).toHaveBeenCalledTimes(2);
      expect(setFocusedCellCoord).toHaveBeenCalledWith([0, 0]);
      expect(cell?.focus).toHaveBeenCalled();
      expect(announce).not.toHaveBeenCalled();
    });

    it('should set tabindex on the second cell in currently focused column when isSelectionMode is true', () => {
      isSelectionMode = true;
      const row = { getElementsByClassName: () => [cell, cell] };
      rootElement = {
        getElementsByClassName: () => [row, row],
        querySelector: () => cell,
      } as unknown as HTMLElement;

      resetFocus();
      expect(cell?.setAttribute).toHaveBeenCalledTimes(2);
      expect(setFocusedCellCoord).toHaveBeenCalledWith([1, 1]);
      expect(cell?.focus).not.toHaveBeenCalled();
    });

    it('should set focus on the first body cell when isSelectionMode is true and totals is on top', () => {
      const row = { getElementsByClassName: () => [cell, cell] };
      rootElement = {
        getElementsByClassName: () => [row, row, row],
        querySelector: () => cell,
      } as unknown as HTMLElement;
      isSelectionMode = true;
      focusedCellCoord = [5, 0];
      totalsPosition = 'top';

      resetFocus();
      expect(setFocusedCellCoord).toHaveBeenCalledWith([2, 0]);
    });

    it('should announce cell content and selection status for non selected first cell after focusing on it', () => {
      cell = { ...cell, textContent: '#something' } as HTMLTableCellElement;
      const row = { getElementsByClassName: () => [cell, cell] };
      rootElement = {
        getElementsByClassName: () => [row, row],
        querySelector: () => cell,
      } as unknown as HTMLElement;
      isSelectionMode = true;

      resetFocus();
      expect(announce).toHaveBeenCalledWith({
        keys: ['#something,', 'SNTable.SelectionLabel.NotSelectedValue'],
      });
    });

    it('should announce cell content and selection status for selected first cell after focusing on it', () => {
      const tmpCell = global.document.createElement('td');
      tmpCell?.classList.add('selected');

      cell = { ...cell, classList: tmpCell?.classList, textContent: '#something' } as HTMLTableCellElement;
      const row = { getElementsByClassName: () => [cell, cell] };
      rootElement = {
        getElementsByClassName: () => [row, row],
        querySelector: () => cell,
      } as unknown as HTMLElement;
      isSelectionMode = true;

      resetFocus();
      expect(announce).toHaveBeenCalledWith({
        keys: ['#something,', 'SNTable.SelectionLabel.SelectedValue'],
      });
    });
  });

  describe('handleFocusoutEvent', () => {
    let containsRelatedTarget: boolean;
    let focusoutEvent: FocusEvent;
    let shouldRefocus: React.MutableRefObject<boolean>;
    let announcement1: {
      innerHTML: string;
    };
    let announcement2: {
      innerHTML: string;
    };

    beforeEach(() => {
      containsRelatedTarget = false;
      announcement1 = { innerHTML: 'firstAnnouncement' };
      announcement2 = { innerHTML: 'secondAnnouncement' };
      focusoutEvent = {
        currentTarget: {
          contains: () => containsRelatedTarget,
          querySelector: (identifier: string) => (identifier.slice(-1) === '1' ? announcement1 : announcement2),
        },
      } as unknown as FocusEvent;
      shouldRefocus = { current: false };
      keyboard = { blur: jest.fn(), focus: jest.fn(), focusSelection: jest.fn(), enabled: true, active: false };
    });

    it('should call blur and remove announcements when currentTarget does not contain relatedTarget, shouldRefocus is false and keyboard.enabled is true', () => {
      accessibilityUtils.handleFocusoutEvent(focusoutEvent, shouldRefocus, keyboard);
      expect(keyboard.blur).toHaveBeenCalledWith(false);
      expect(announcement1.innerHTML).toBe('');
      expect(announcement2.innerHTML).toBe('');
    });

    it('should not call blur when currentTarget contains relatedTarget', () => {
      containsRelatedTarget = true;

      accessibilityUtils.handleFocusoutEvent(focusoutEvent, shouldRefocus, keyboard);
      expect(keyboard.blur).not.toHaveBeenCalled();
    });

    it('should not call blur when shouldRefocus is true', () => {
      shouldRefocus.current = true;

      accessibilityUtils.handleFocusoutEvent(focusoutEvent, shouldRefocus, keyboard);
      expect(keyboard.blur).not.toHaveBeenCalled();
    });

    it('should not call blur when keyboard.enabled is false', () => {
      keyboard.enabled = false;

      accessibilityUtils.handleFocusoutEvent(focusoutEvent, shouldRefocus, keyboard);
      expect(keyboard.blur).not.toHaveBeenCalled();
    });
  });

  describe('focusSelectionToolbar', () => {
    let element: HTMLElement;
    let parentElement: HTMLElement | null;
    let last: boolean;

    beforeEach(() => {
      parentElement = { focus: jest.fn() } as unknown as HTMLElement;
      element = {
        closest: () => ({ querySelector: () => ({ parentElement }) }),
      } as unknown as HTMLElement;
      last = false;
    });

    it('should call parentElement.focus when clientConfirmButton exists', () => {
      accessibilityUtils.focusSelectionToolbar(element, keyboard, last);
      expect(parentElement?.focus).toHaveBeenCalledTimes(1);
      expect(keyboard.focusSelection).not.toHaveBeenCalled();
    });

    it("should call keyboard.focusSelection when clientConfirmButton doesn't exist", () => {
      parentElement = null;
      accessibilityUtils.focusSelectionToolbar(element, keyboard, last);
      expect(keyboard.focusSelection).toHaveBeenCalledWith(false);
    });
  });

  describe('announceSelectionState', () => {
    let isSelected: boolean;
    let announce: Announce;
    let nextCell: HTMLTableCellElement;
    let isSelectionMode: boolean;

    beforeEach(() => {
      isSelected = false;
      announce = jest.fn() as Announce;
      nextCell = {
        classList: {
          contains: () => isSelected,
        },
      } as unknown as HTMLTableCellElement;
      isSelectionMode = false;
    });

    it('should do nothing when not in selection mode', () => {
      accessibilityUtils.announceSelectionState(announce, nextCell, isSelectionMode);
      expect(announce).not.toHaveBeenCalled();
    });

    it('should call announce with SelectedValue key when in selection mode and value is selected', () => {
      isSelectionMode = true;
      isSelected = true;
      accessibilityUtils.announceSelectionState(announce, nextCell, isSelectionMode);
      expect(announce).toHaveBeenCalledWith({ keys: ['SNTable.SelectionLabel.SelectedValue'] });
    });

    it('should Call announce with NotSelectedValue key when in selection mode and value is not selected', () => {
      isSelectionMode = true;
      accessibilityUtils.announceSelectionState(announce, nextCell, isSelectionMode);
      expect(announce).toHaveBeenCalledWith({ keys: ['SNTable.SelectionLabel.NotSelectedValue'] });
    });
  });

  describe('getNextCellCoord', () => {
    let rowCount: number;
    let columnCount: number;
    let rowIndex: number;
    let colIndex: number;
    let evt: React.KeyboardEvent;

    beforeEach(() => {
      evt = {} as unknown as React.KeyboardEvent;
      rowCount = 1;
      columnCount = 1;
      rootElement = {
        getElementsByClassName: (className: string) =>
          className === 'sn-table-row' ? Array(rowCount) : Array(columnCount),
      } as unknown as HTMLElement;
      rowIndex = 0;
      colIndex = 0;
    });

    it('should stay the current cell when move down', () => {
      evt.key = 'ArrowDown';
      const [nextRow, nextCol] = accessibilityUtils.getNextCellCoord(evt, rootElement, [rowIndex, colIndex]);
      expect(nextRow).toBe(0);
      expect(nextCol).toBe(0);
    });

    it('should not move to the next row when the totals row is set at the bottom', () => {
      evt.key = 'ArrowDown';
      const allowedRows = { top: 0, bottom: 1 };
      rowCount = 3;
      rowIndex = 1;
      colIndex = 0;
      const [nextRow, nextCol] = accessibilityUtils.getNextCellCoord(
        evt,
        rootElement,
        [rowIndex, colIndex],
        allowedRows
      );
      expect(nextRow).toBe(1);
      expect(nextCol).toBe(0);
    });

    it('should stay the current cell when move up', () => {
      evt.key = 'ArrowUp';
      const [nextRow, nextCol] = accessibilityUtils.getNextCellCoord(evt, rootElement, [rowIndex, colIndex]);
      expect(nextRow).toBe(0);
      expect(nextCol).toBe(0);
    });

    it('should go to one row down cell', () => {
      evt.key = 'ArrowDown';
      rowCount = 2;
      const [nextRow, nextCol] = accessibilityUtils.getNextCellCoord(evt, rootElement, [rowIndex, colIndex]);
      expect(nextRow).toBe(1);
      expect(nextCol).toBe(0);
    });

    it('should go to one row up cell', () => {
      evt.key = 'ArrowUp';
      rowCount = 2;
      rowIndex = 1;
      const [nextRow, nextCol] = accessibilityUtils.getNextCellCoord(evt, rootElement, [rowIndex, colIndex]);
      expect(nextRow).toBe(0);
      expect(nextCol).toBe(0);
    });

    it('should go to one column left cell', () => {
      evt.key = 'ArrowLeft';
      columnCount = 2;
      colIndex = 1;
      const [nextRow, nextCol] = accessibilityUtils.getNextCellCoord(evt, rootElement, [rowIndex, colIndex]);
      expect(nextRow).toBe(0);
      expect(nextCol).toBe(0);
    });

    it('should go to one column right cell', () => {
      evt.key = 'ArrowRight';
      columnCount = 2;
      const [nextRow, nextCol] = accessibilityUtils.getNextCellCoord(evt, rootElement, [rowIndex, colIndex]);
      expect(nextRow).toBe(0);
      expect(nextCol).toBe(1);
    });

    it('should stay the current cell when other keys are pressed', () => {
      evt.key = 'Control';
      const [nextRow, nextCol] = accessibilityUtils.getNextCellCoord(evt, rootElement, [rowIndex, colIndex]);
      expect(nextRow).toBe(0);
      expect(nextCol).toBe(0);
    });

    it('should move to the next row when you reach to the end of the current row', () => {
      evt.key = 'ArrowRight';
      rowCount = 3;
      columnCount = 3;
      rowIndex = 1;
      colIndex = 3;
      const [nextRow, nextCol] = accessibilityUtils.getNextCellCoord(evt, rootElement, [rowIndex, colIndex]);
      expect(nextRow).toBe(2);
      expect(nextCol).toBe(0);
    });

    it('should move to the prev row when we reach to the beginning of the current row', () => {
      evt.key = 'ArrowLeft';
      rowCount = 3;
      columnCount = 3;
      rowIndex = 2;
      colIndex = 0;
      const [nextRow, nextCol] = accessibilityUtils.getNextCellCoord(evt, rootElement, [rowIndex, colIndex]);
      expect(nextRow).toBe(1);
      expect(nextCol).toBe(2);
    });

    it('should stay at the first row and first col of table when we reached to the beginning of the table', () => {
      evt.key = 'ArrowLeft';
      rowCount = 2;
      columnCount = 2;
      rowIndex = 0;
      colIndex = 0;
      const [nextRow, nextCol] = accessibilityUtils.getNextCellCoord(evt, rootElement, [rowIndex, colIndex]);
      expect(nextRow).toBe(0);
      expect(nextCol).toBe(0);
    });

    it('should stay at the end row and end col of table when you reached to the end of the table', () => {
      evt.key = 'ArrowRight';
      rowCount = 2;
      columnCount = 2;
      rowIndex = 1;
      colIndex = 1;
      const [nextRow, nextCol] = accessibilityUtils.getNextCellCoord(evt, rootElement, [rowIndex, colIndex]);
      expect(nextRow).toBe(1);
      expect(nextCol).toBe(1);
    });

    it('should stay at the current cell when allowedRows cell index is 1 and trying to move up from rowIdx 1', () => {
      evt.key = 'ArrowUp';
      const allowedRows = { top: 1, bottom: 0 };
      rowCount = 3;
      rowIndex = 1;
      const [nextRow, nextCol] = accessibilityUtils.getNextCellCoord(
        evt,
        rootElement,
        [rowIndex, colIndex],
        allowedRows
      );
      expect(nextRow).toBe(1);
      expect(nextCol).toBe(0);
    });

    it('should stay at the current cell when trying to move left and allowedRows is > 0 (i.e in selection mode', () => {
      evt.key = 'ArrowLeft';
      const allowedRows = { top: 1, bottom: 0 };
      rowCount = 3;
      columnCount = 3;
      rowIndex = 1;
      colIndex = 1;
      const [nextRow, nextCol] = accessibilityUtils.getNextCellCoord(
        evt,
        rootElement,
        [rowIndex, colIndex],
        allowedRows
      );
      expect(nextRow).toBe(1);
      expect(nextCol).toBe(1);
    });

    it('should stay at the current cell when trying to move right and allowedRows is > 0 (i.e in selection mode', () => {
      evt.key = 'ArrowRight';
      const allowedRows = { top: 1, bottom: 0 };
      rowCount = 3;
      columnCount = 3;
      rowIndex = 1;
      colIndex = 1;
      const [nextRow, nextCol] = accessibilityUtils.getNextCellCoord(
        evt,
        rootElement,
        [rowIndex, colIndex],
        allowedRows
      );
      expect(nextRow).toBe(1);
      expect(nextCol).toBe(1);
    });
  });

  describe('removeTabAndFocusCell', () => {
    const newCoord: [number, number] = [1, 1];

    it('should call setFocusedCellCoord but not keyboard.focus when keyboard.enabled is false', () => {
      keyboard.enabled = false;
      accessibilityUtils.removeTabAndFocusCell(newCoord, rootElement, setFocusedCellCoord, keyboard);
      expect(setFocusedCellCoord).toHaveBeenCalledWith(newCoord);
      expect(keyboard.focus).not.toHaveBeenCalled();
    });

    it('should call update setFocusedCellCoord but not keyboard.focus when keyboard.enabled is true and active is true', () => {
      keyboard.active = true;
      accessibilityUtils.removeTabAndFocusCell(newCoord, rootElement, setFocusedCellCoord, keyboard);
      expect(setFocusedCellCoord).toHaveBeenCalledWith(newCoord);
      expect(keyboard.focus).not.toHaveBeenCalled();
    });

    it('should call update setFocusedCellCoord and keyboard.focus when keyboard.enabled is true and active is false', () => {
      accessibilityUtils.removeTabAndFocusCell(newCoord, rootElement, setFocusedCellCoord, keyboard);
      expect(setFocusedCellCoord).toHaveBeenCalledWith(newCoord);
      expect(keyboard.focus).toHaveBeenCalledTimes(1);
    });
  });
});
