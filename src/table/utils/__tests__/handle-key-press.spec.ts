import { stardust } from '@nebula.js/stardust';
import React from 'react';

import {
  shouldBubble,
  handleWrapperKeyDown,
  handleBodyKeyDown,
  handleHeadKeyDown,
  handleTotalKeyDown,
  handleLastTab,
  handleBodyKeyUp,
} from '../handle-key-press';
import * as handleAccessibility from '../accessibility-utils';
import * as handleScroll from '../handle-scroll';
import * as handleCopy from '../copy-utils';
import { Announce, Column, ExtendedSelectionAPI, Cell, TotalsPosition } from '../../../types';
import { SelectionDispatch } from '../../types';
import { KeyCodes } from '../../constants';

describe('handle-key-press', () => {
  let areBasicFeaturesEnabled: boolean;

  beforeEach(() => {
    areBasicFeaturesEnabled = true;
    jest.spyOn(handleCopy, 'default').mockImplementation(() => new Promise(() => {}));
  });

  afterEach(() => jest.clearAllMocks());

  describe('shouldBubble', () => {
    let evt: React.KeyboardEvent;
    let isSelectionMode: boolean;
    let keyboardEnabled: boolean;
    let paginationNeeded: boolean;

    const callShouldBubble = () => shouldBubble(evt, isSelectionMode, keyboardEnabled, paginationNeeded);

    beforeEach(() => {
      evt = {
        key: KeyCodes.ESC,
        shiftKey: false,
        ctrlKey: false,
        metaKey: false, // cases when meta key is pressed instead of ctrl is not tested here, the test are granular enough anyway
      } as unknown as React.KeyboardEvent;
      isSelectionMode = false;
      keyboardEnabled = false;
      paginationNeeded = true;
      areBasicFeaturesEnabled = true;
    });

    it('should return true when esc is pressed and isSelectionMode is false', () => {
      expect(callShouldBubble()).toBe(true);
    });

    it('should return false when esc is pressed and isSelectionMode is true', () => {
      isSelectionMode = true;
      expect(callShouldBubble()).toBe(false);
    });

    it('should return true when tab is pressed and paginationNeeded is true', () => {
      evt.key = KeyCodes.TAB;
      expect(callShouldBubble()).toBe(true);
    });

    it('should return true when tab is pressed, paginationNeeded is false and keyboardEnabled is false but isSelectionMode is true', () => {
      evt.key = KeyCodes.TAB;
      paginationNeeded = false;
      isSelectionMode = true;
      expect(callShouldBubble()).toBe(true);
    });

    it('should return true when tab is pressed, paginationNeeded is false and isSelectionMode is false but keyboardEnabled is true', () => {
      evt.key = KeyCodes.TAB;
      paginationNeeded = false;
      keyboardEnabled = true;
      expect(callShouldBubble()).toBe(true);
    });

    it('should return false when tab is pressed, paginationNeeded is false and keyboardEnabled && isSelectionMode is true', () => {
      evt.key = KeyCodes.TAB;
      paginationNeeded = false;
      keyboardEnabled = true;
      isSelectionMode = true;
      expect(callShouldBubble()).toBe(false);
    });

    it('should return true when shift + tab is pressed and keyboardEnabled is false but isSelectionMode is true', () => {
      evt.key = KeyCodes.TAB;
      evt.shiftKey = true;
      isSelectionMode = true;
      expect(callShouldBubble()).toBe(true);
    });

    it('should return true when shift + tab is pressed and isSelectionMode is false but keyboardEnabled is true', () => {
      evt.key = KeyCodes.TAB;
      evt.shiftKey = true;
      keyboardEnabled = true;
      expect(callShouldBubble()).toBe(true);
    });

    it('should return false when shift + tab is pressed and keyboardEnabled && isSelectionMode is true', () => {
      evt.key = KeyCodes.TAB;
      evt.shiftKey = true;
      keyboardEnabled = true;
      isSelectionMode = true;
      expect(callShouldBubble()).toBe(false);
    });

    it('should return true when ctrl + shift + arrowRight is pressed', () => {
      evt.key = KeyCodes.RIGHT;
      evt.shiftKey = true;
      evt.ctrlKey = true;
      expect(callShouldBubble()).toBe(true);
    });

    it('should return true when ctrl + shift + arrowLeft is pressed', () => {
      evt.key = KeyCodes.LEFT;
      evt.shiftKey = true;
      evt.ctrlKey = true;
      expect(callShouldBubble()).toBe(true);
    });

    it('should return false when ctrl + shift + some other key is pressed', () => {
      evt.key = KeyCodes.UP;
      evt.shiftKey = true;
      evt.ctrlKey = true;
      expect(callShouldBubble()).toBe(false);
    });

    it('should return false when ctrl + arrowLeft but not shift', () => {
      evt.key = KeyCodes.LEFT;
      evt.ctrlKey = true;
      expect(callShouldBubble()).toBe(false);
    });

    it('should return false when shift + arrowLeft but not ctrl', () => {
      evt.key = KeyCodes.LEFT;
      evt.shiftKey = true;
      expect(callShouldBubble()).toBe(false);
    });
  });

  describe('handleWrapperKeyDown', () => {
    let evt: React.KeyboardEvent;
    let totalRowCount: number;
    let page: number;
    let rowsPerPage: number;
    let handleChangePage: (pageIdx: number) => void;
    let setShouldRefocus: () => void;
    let keyboard: stardust.Keyboard;
    let isSelectionMode: boolean;

    const callHandleWrapperKeyDown = () =>
      handleWrapperKeyDown({
        evt,
        totalRowCount,
        page,
        rowsPerPage,
        handleChangePage,
        setShouldRefocus,
        keyboard,
        isSelectionMode,
      });

    beforeEach(() => {
      evt = {
        shiftKey: true,
        ctrlKey: true,
        metaKey: true,
        key: KeyCodes.RIGHT,
        stopPropagation: jest.fn(),
        preventDefault: jest.fn(),
      } as unknown as React.KeyboardEvent;
      handleChangePage = jest.fn();
      setShouldRefocus = jest.fn();
      keyboard = { enabled: false, active: false, blur: jest.fn(), focus: jest.fn() };
      isSelectionMode = false;
    });

    it('when shift key is not pressed, handleChangePage should not run', () => {
      evt.shiftKey = false;
      callHandleWrapperKeyDown();
      expect(handleChangePage).not.toHaveBeenCalled();
      expect(setShouldRefocus).not.toHaveBeenCalled();
    });

    it('when ctrl key or meta key is not pressed, handleChangePage should not run', () => {
      evt.ctrlKey = false;
      evt.metaKey = false;
      callHandleWrapperKeyDown();
      expect(handleChangePage).not.toHaveBeenCalled();
      expect(setShouldRefocus).not.toHaveBeenCalled();
    });

    it('when press arrow right key on the first page which contains all rows, handleChangePage should not run', () => {
      page = 0;
      totalRowCount = 40;
      rowsPerPage = 40;
      callHandleWrapperKeyDown();
      expect(handleChangePage).not.toHaveBeenCalled();
      expect(setShouldRefocus).not.toHaveBeenCalled();
    });

    it('when press arrow left key on the first page, handleChangePage should not run', () => {
      evt.key = KeyCodes.LEFT;
      page = 0;
      totalRowCount = 40;
      rowsPerPage = 10;
      callHandleWrapperKeyDown();
      expect(handleChangePage).not.toHaveBeenCalled();
      expect(setShouldRefocus).not.toHaveBeenCalled();
    });

    it('when press arrow right key on the page whose next page contains rows, should change page', () => {
      totalRowCount = 40;
      page = 0;
      rowsPerPage = 10;
      callHandleWrapperKeyDown();
      expect(handleChangePage).toHaveBeenCalledTimes(1);
      expect(setShouldRefocus).toHaveBeenCalledTimes(1);
    });

    it('when press arrow left key not on the first page, should change page', () => {
      evt.key = KeyCodes.LEFT;
      totalRowCount = 40;
      page = 1;
      rowsPerPage = 40;
      callHandleWrapperKeyDown();
      expect(handleChangePage).toHaveBeenCalledTimes(1);
      expect(setShouldRefocus).toHaveBeenCalledTimes(1);
      expect(evt.preventDefault).toHaveBeenCalledTimes(1);
      expect(evt.stopPropagation).toHaveBeenCalledTimes(1);
    });

    it('when press escape is pressed and keyboard.enabled is true, should call keyboard.blur', () => {
      evt = {
        key: KeyCodes.ESC,
        stopPropagation: jest.fn(),
        preventDefault: jest.fn(),
      } as unknown as React.KeyboardEvent;
      keyboard.enabled = true;
      callHandleWrapperKeyDown();
      expect(evt.preventDefault).toHaveBeenCalledTimes(1);
      expect(evt.stopPropagation).toHaveBeenCalledTimes(1);
      expect(keyboard.blur).toHaveBeenCalledWith(true);
    });

    it('should run keyboard.blur when you are in selection mode, keyboard.enabled is true and pressing Esc key', () => {
      evt = {
        key: KeyCodes.ESC,
        stopPropagation: jest.fn(),
        preventDefault: jest.fn(),
      } as unknown as React.KeyboardEvent;
      keyboard.enabled = true;
      isSelectionMode = true;
      callHandleWrapperKeyDown();
      expect(evt.preventDefault).toHaveBeenCalledTimes(0);
      expect(evt.stopPropagation).toHaveBeenCalledTimes(0);
      expect(keyboard.blur).toHaveBeenCalledTimes(0);
    });

    it('should run preventDefaultBehavior when pressing arrow key but not shift + ctrl/cmd', () => {
      evt.key = KeyCodes.DOWN;
      callHandleWrapperKeyDown();
      expect(evt.preventDefault).toHaveBeenCalledTimes(1);
      expect(evt.stopPropagation).toHaveBeenCalledTimes(1);
      expect(handleChangePage).toHaveBeenCalledTimes(0);
      expect(setShouldRefocus).toHaveBeenCalledTimes(0);
    });
  });

  describe('handleHeadKeyDown', () => {
    let rowIndex: number;
    let colIndex: number;
    let column: Column;
    let evt: React.KeyboardEvent;
    let rootElement: HTMLElement;
    let changeSortOrder: (column: Column) => Promise<void>;
    let isInteractionEnabled: boolean;
    let setFocusedCellCoord: React.Dispatch<React.SetStateAction<[number, number]>>;

    const callHandleHeadKeyDown = () =>
      handleHeadKeyDown({
        evt,
        rootElement,
        cellCoord: [rowIndex, colIndex],
        column,
        changeSortOrder,
        isInteractionEnabled,
        setFocusedCellCoord,
        areBasicFeaturesEnabled,
      });

    beforeEach(() => {
      rowIndex = 0;
      colIndex = 0;
      column = {} as unknown as Column;
      evt = {
        key: KeyCodes.DOWN,
        stopPropagation: jest.fn(),
        preventDefault: jest.fn(),
        target: {
          blur: jest.fn(),
          setAttribute: jest.fn(),
        } as unknown as HTMLElement,
      } as unknown as React.KeyboardEvent;
      rootElement = {
        getElementsByClassName: () => [
          {
            getElementsByClassName: () => [{ focus: () => undefined, setAttribute: () => undefined }],
          },
        ],
      } as unknown as HTMLElement;
      changeSortOrder = jest.fn();
      isInteractionEnabled = true;
      setFocusedCellCoord = jest.fn();
    });

    it('when press arrow down key on head cell, should prevent default behavior, remove current focus and set focus and attribute to the next cell', () => {
      callHandleHeadKeyDown();
      expect(evt.preventDefault).toHaveBeenCalledTimes(1);
      expect(evt.stopPropagation).toHaveBeenCalledTimes(1);
      expect((evt.target as HTMLElement).setAttribute).toHaveBeenCalledTimes(1);
      expect(setFocusedCellCoord).toHaveBeenCalledTimes(1);
    });

    it('when press space bar key, should update the sorting', () => {
      evt.key = KeyCodes.SPACE;
      callHandleHeadKeyDown();
      expect(evt.preventDefault).toHaveBeenCalledTimes(1);
      expect(evt.stopPropagation).toHaveBeenCalledTimes(1);
      expect(changeSortOrder).toHaveBeenCalledTimes(1);
      expect(setFocusedCellCoord).not.toHaveBeenCalled();
    });

    it('when press enter key, should update the sorting', () => {
      evt.key = KeyCodes.ENTER;
      callHandleHeadKeyDown();
      expect(evt.preventDefault).toHaveBeenCalledTimes(1);
      expect(evt.stopPropagation).toHaveBeenCalledTimes(1);
      expect(changeSortOrder).toHaveBeenCalledTimes(1);
      expect(setFocusedCellCoord).not.toHaveBeenCalled();
    });

    it('when pressing a valid key and isInteractionEnabled is false, should only call preventDefaultBehavior', () => {
      evt.key = KeyCodes.SPACE;
      isInteractionEnabled = false;
      callHandleHeadKeyDown();
      expect(evt.preventDefault).toHaveBeenCalledTimes(1);
      expect(evt.stopPropagation).toHaveBeenCalledTimes(1);
      expect(changeSortOrder).not.toHaveBeenCalled();
      expect(setFocusedCellCoord).not.toHaveBeenCalled();
    });

    it('when pressing an invalid key, should only call preventDefaultBehavior', () => {
      evt.key = KeyCodes.UP;
      callHandleHeadKeyDown();
      expect(evt.preventDefault).toHaveBeenCalledTimes(1);
      expect(evt.stopPropagation).toHaveBeenCalledTimes(1);
      expect(changeSortOrder).not.toHaveBeenCalled();
      expect(setFocusedCellCoord).not.toHaveBeenCalled();
    });

    it('should call copyCellValue on Head cell when the pressed keys are Ctrl and C keys', () => {
      evt.key = KeyCodes.C;
      evt.ctrlKey = true;
      callHandleHeadKeyDown();
      expect(handleCopy.default).toHaveBeenCalled();
    });

    it('should call copyCellValue on Head cell when the pressed keys are Meta and C keys', () => {
      evt.key = KeyCodes.C;
      evt.metaKey = true;
      callHandleHeadKeyDown();
      expect(handleCopy.default).toHaveBeenCalled();
    });

    it('should not call copyCellValue on Head cell when the flag is disabled', () => {
      evt.key = KeyCodes.C;
      evt.metaKey = true;
      areBasicFeaturesEnabled = false;
      callHandleHeadKeyDown();
      expect(handleCopy.default).not.toHaveBeenCalled();
    });
  });

  describe('handleTotalKeyDown', () => {
    let evt: React.KeyboardEvent;
    let rootElement: HTMLElement;
    let setFocusedCellCoord: React.Dispatch<React.SetStateAction<[number, number]>>;
    let cellCoord: [number, number];
    let isSelectionMode: boolean;

    beforeEach(() => {
      evt = {
        key: KeyCodes.DOWN,
        stopPropagation: jest.fn(),
        preventDefault: jest.fn(),
        target: {
          blur: jest.fn(),
          setAttribute: jest.fn(),
        } as unknown as HTMLElement,
      } as unknown as React.KeyboardEvent;
      cellCoord = [1, 1];
      rootElement = {
        getElementsByClassName: () => [
          { getElementsByClassName: () => [{ focus: () => undefined, setAttribute: () => undefined }] },
        ],
      } as unknown as HTMLElement;
      setFocusedCellCoord = jest.fn();
      isSelectionMode = false;
    });

    it('should move the focus from the current cell to the next when arrow key down is pressed on a total cell', () => {
      handleTotalKeyDown(evt, rootElement, cellCoord, setFocusedCellCoord, isSelectionMode, areBasicFeaturesEnabled);
      expect(evt.preventDefault).toHaveBeenCalledTimes(1);
      expect(evt.stopPropagation).toHaveBeenCalledTimes(1);
      expect((evt.target as HTMLElement).setAttribute).toHaveBeenCalledTimes(1);
      expect(setFocusedCellCoord).toHaveBeenCalledTimes(1);
    });

    it('should only call preventDefaultBehavior when isSelectionMode is true', () => {
      isSelectionMode = true;
      handleTotalKeyDown(evt, rootElement, cellCoord, setFocusedCellCoord, isSelectionMode, areBasicFeaturesEnabled);
      expect(evt.preventDefault).toHaveBeenCalledTimes(1);
      expect(evt.stopPropagation).toHaveBeenCalledTimes(1);
      expect(setFocusedCellCoord).not.toHaveBeenCalled();
    });

    it('should take the default case when the pressed key is not an arrow key', () => {
      evt.key = KeyCodes.ENTER;
      handleTotalKeyDown(evt, rootElement, cellCoord, setFocusedCellCoord, isSelectionMode, areBasicFeaturesEnabled);
      expect(evt.preventDefault).toHaveBeenCalledTimes(1);
      expect(evt.stopPropagation).toHaveBeenCalledTimes(1);
      expect(setFocusedCellCoord).not.toHaveBeenCalled();
    });

    it('should call copyCellValue on Total cell when the pressed keys are Ctrl and C keys', () => {
      evt.key = KeyCodes.C;
      evt.ctrlKey = true;
      handleTotalKeyDown(evt, rootElement, cellCoord, setFocusedCellCoord, isSelectionMode, areBasicFeaturesEnabled);
      expect(handleCopy.default).toHaveBeenCalled();
    });

    it('should call copyCellValue on Total cell when the pressed keys are Meta and C keys', async () => {
      evt.key = KeyCodes.C;
      evt.metaKey = true;
      handleTotalKeyDown(evt, rootElement, cellCoord, setFocusedCellCoord, isSelectionMode, areBasicFeaturesEnabled);
      expect(handleCopy.default).toHaveBeenCalled();
    });

    it('should not call copyCellValue on Total cell when the flag is disabled', () => {
      evt.key = KeyCodes.C;
      evt.metaKey = true;
      areBasicFeaturesEnabled = false;
      handleTotalKeyDown(evt, rootElement, cellCoord, setFocusedCellCoord, isSelectionMode, areBasicFeaturesEnabled);
      expect(handleCopy.default).not.toHaveBeenCalled();
    });
  });

  describe('handleBodyKeyDown', () => {
    let isModal: boolean;
    let isExcluded: boolean;
    let evt: React.KeyboardEvent;
    let rootElement: HTMLElement;
    let selectionsAPI: ExtendedSelectionAPI;
    let cell: Cell;
    let selectionDispatch: SelectionDispatch;
    let isSelectionsEnabled: boolean;
    let setFocusedCellCoord: React.Dispatch<React.SetStateAction<[number, number]>>;
    let keyboard: stardust.Keyboard;
    let announce: Announce;
    let paginationNeeded: boolean;
    let totalsPosition: TotalsPosition;

    const runHandleBodyKeyDown = () =>
      handleBodyKeyDown({
        evt,
        rootElement,
        selectionsAPI,
        cell,
        selectionDispatch,
        isSelectionsEnabled,
        setFocusedCellCoord,
        announce,
        keyboard,
        paginationNeeded,
        totalsPosition,
        areBasicFeaturesEnabled,
      });

    beforeEach(() => {
      isModal = false;
      isExcluded = false;
      evt = {
        key: KeyCodes.DOWN,
        stopPropagation: jest.fn(),
        preventDefault: jest.fn(),
        target: {
          blur: jest.fn(),
          setAttribute: jest.fn(),
          classList: {
            contains: () => isExcluded,
          },
        } as unknown as HTMLElement,
      } as unknown as React.KeyboardEvent;
      rootElement = {
        getElementsByClassName: () => [
          { getElementsByClassName: () => [{ focus: () => undefined, setAttribute: () => undefined }] },
        ],
      } as unknown as HTMLElement;
      selectionsAPI = {
        confirm: jest.fn(),
        cancel: jest.fn(),
        isModal: () => isModal,
      } as unknown as ExtendedSelectionAPI;
      cell = { qElemNumber: 1, colIdx: 1, rowIdx: 1, isSelectable: true, isLastRow: false, pageRowIdx: 1 } as Cell;
      keyboard = { enabled: true } as unknown as stardust.Keyboard;
      selectionDispatch = jest.fn();
      isSelectionsEnabled = true;
      setFocusedCellCoord = jest.fn();
      announce = jest.fn();
      paginationNeeded = true;
      totalsPosition = 'noTotals';
      areBasicFeaturesEnabled = true;
      jest.spyOn(handleAccessibility, 'focusSelectionToolbar').mockImplementation(() => jest.fn());
      jest.spyOn(handleAccessibility, 'announceSelectionState').mockImplementation(() => jest.fn());
      jest.spyOn(handleScroll, 'handleNavigateTop').mockImplementation(() => jest.fn());
    });

    it('when press arrow down key on body cell, should prevent default behavior, remove current focus and set focus and attribute to the next cell', () => {
      runHandleBodyKeyDown();
      expect(evt.preventDefault).toHaveBeenCalledTimes(1);
      expect(evt.stopPropagation).toHaveBeenCalledTimes(1);
      expect((evt.target as HTMLElement).setAttribute).toHaveBeenCalledTimes(1);
      expect(setFocusedCellCoord).toHaveBeenCalledTimes(1);
      expect(handleAccessibility.announceSelectionState).toHaveBeenCalledTimes(1);
      expect(handleScroll.handleNavigateTop).not.toHaveBeenCalled();
    });

    it('when press arrow left key on body cell, should prevent default behavior, remove current focus and set focus and attribute to the next cell', () => {
      evt.key = KeyCodes.LEFT;

      runHandleBodyKeyDown();
      expect(evt.preventDefault).toHaveBeenCalledTimes(1);
      expect(evt.stopPropagation).toHaveBeenCalledTimes(1);
      expect((evt.target as HTMLElement).setAttribute).toHaveBeenCalledTimes(1);
      expect(setFocusedCellCoord).toHaveBeenCalledTimes(1);
      expect(handleAccessibility.announceSelectionState).not.toHaveBeenCalled();
      expect(handleScroll.handleNavigateTop).not.toHaveBeenCalled();
    });

    it('when press arrow up key on body cell, should prevent default behavior, remove current focus and set focus and attribute to the next cell and call handleNavigateTop', () => {
      evt.key = KeyCodes.UP;

      runHandleBodyKeyDown();
      expect(evt.preventDefault).toHaveBeenCalledTimes(1);
      expect(evt.stopPropagation).toHaveBeenCalledTimes(1);
      expect((evt.target as HTMLElement).setAttribute).toHaveBeenCalledTimes(1);
      expect(setFocusedCellCoord).toHaveBeenCalledTimes(1);
      expect(handleAccessibility.announceSelectionState).toHaveBeenCalledTimes(1);
      expect(handleScroll.handleNavigateTop).toHaveBeenCalledTimes(1);
    });

    it('when press shift + arrow down key on body cell, should prevent default behavior, remove current focus and set focus and attribute to the next cell, and select values for dimension', () => {
      evt.shiftKey = true;

      runHandleBodyKeyDown();
      expect(evt.preventDefault).toHaveBeenCalledTimes(1);
      expect(evt.stopPropagation).toHaveBeenCalledTimes(1);
      expect((evt.target as HTMLElement).setAttribute).toHaveBeenCalledTimes(1);
      expect(setFocusedCellCoord).toHaveBeenCalledTimes(1);
      expect(selectionDispatch).toHaveBeenCalledTimes(1);
      expect(handleAccessibility.announceSelectionState).not.toHaveBeenCalled();
      expect(handleScroll.handleNavigateTop).not.toHaveBeenCalled();
    });

    it('when press shift + arrow down key on the last row cell, should prevent default behavior, remove current focus and set focus and attribute to the next cell, but not select values for dimension', () => {
      cell.isLastRow = true;
      evt.shiftKey = true;

      runHandleBodyKeyDown();
      expect(evt.preventDefault).toHaveBeenCalledTimes(1);
      expect(evt.stopPropagation).toHaveBeenCalledTimes(1);
      expect((evt.target as HTMLElement).setAttribute).toHaveBeenCalledTimes(1);
      expect(setFocusedCellCoord).toHaveBeenCalledTimes(1);
      expect(selectionDispatch).not.toHaveBeenCalled();
      expect(handleAccessibility.announceSelectionState).toHaveBeenCalledTimes(1);
      expect(handleScroll.handleNavigateTop).not.toHaveBeenCalled();
    });

    it('when press shift + arrow up key on body cell, should prevent default behavior, remove current focus and set focus and attribute to the next cell, and select values for dimension', () => {
      evt.shiftKey = true;
      evt.key = KeyCodes.UP;

      runHandleBodyKeyDown();
      expect(evt.preventDefault).toHaveBeenCalledTimes(1);
      expect(evt.stopPropagation).toHaveBeenCalledTimes(1);
      expect((evt.target as HTMLElement).setAttribute).toHaveBeenCalledTimes(1);
      expect(setFocusedCellCoord).toHaveBeenCalledTimes(1);
      expect(selectionDispatch).toHaveBeenCalledTimes(1);
      expect(handleAccessibility.announceSelectionState).not.toHaveBeenCalled();
      expect(handleScroll.handleNavigateTop).toHaveBeenCalledTimes(1);
    });

    it('when press shift + arrow up key on the second row cell, should prevent default behavior, remove current focus and set focus and attribute to the next cell, but not select values for dimension', () => {
      cell.pageRowIdx = 0;
      evt.shiftKey = true;
      evt.key = KeyCodes.UP;

      runHandleBodyKeyDown();
      expect(evt.preventDefault).toHaveBeenCalledTimes(1);
      expect(evt.stopPropagation).toHaveBeenCalledTimes(1);
      expect((evt.target as HTMLElement).setAttribute).toHaveBeenCalledTimes(1);
      expect(setFocusedCellCoord).toHaveBeenCalledTimes(1);
      expect(selectionDispatch).not.toHaveBeenCalled();
      expect(handleAccessibility.announceSelectionState).toHaveBeenCalledTimes(1);
      expect(handleScroll.handleNavigateTop).toHaveBeenCalledTimes(1);
    });

    it('when press space bar key and dimension, should select value for dimension', () => {
      evt.key = KeyCodes.SPACE;
      runHandleBodyKeyDown();
      expect(evt.preventDefault).toHaveBeenCalledTimes(1);
      expect(evt.stopPropagation).toHaveBeenCalledTimes(1);
      expect(selectionDispatch).toHaveBeenCalledTimes(1);
      expect(setFocusedCellCoord).not.toHaveBeenCalled();
    });

    it('when press space bar key on a cell that is not selectable, should not select value', () => {
      evt.key = KeyCodes.SPACE;
      cell = {
        isSelectable: false,
      } as Cell;
      runHandleBodyKeyDown();
      expect(evt.preventDefault).toHaveBeenCalledTimes(1);
      expect(evt.stopPropagation).toHaveBeenCalledTimes(1);
      expect(selectionDispatch).not.toHaveBeenCalled();
      expect(setFocusedCellCoord).not.toHaveBeenCalled();
      expect(announce).not.toHaveBeenCalled();
    });

    it('when press space bar key and selections are not enabled, should not select value', () => {
      evt.key = KeyCodes.SPACE;
      isSelectionsEnabled = false;
      runHandleBodyKeyDown();
      expect(evt.preventDefault).toHaveBeenCalledTimes(1);
      expect(evt.stopPropagation).toHaveBeenCalledTimes(1);
      expect(selectionDispatch).not.toHaveBeenCalled();
      expect(setFocusedCellCoord).not.toHaveBeenCalled();
      expect(announce).not.toHaveBeenCalled();
    });

    it('when press enter key, should confirms selections', () => {
      evt.key = KeyCodes.ENTER;
      isModal = true;
      runHandleBodyKeyDown();
      expect(evt.preventDefault).toHaveBeenCalledTimes(1);
      expect(evt.stopPropagation).toHaveBeenCalledTimes(1);
      expect(selectionsAPI.confirm).toHaveBeenCalledTimes(1);
      expect(setFocusedCellCoord).not.toHaveBeenCalled();
      expect(announce).toHaveBeenCalledWith({ keys: ['SNTable.SelectionLabel.SelectionsConfirmed'] });
    });

    it('when press enter key and not in selections mode, should not confirms selections', () => {
      evt.key = KeyCodes.ENTER;
      runHandleBodyKeyDown();
      expect(evt.preventDefault).toHaveBeenCalledTimes(1);
      expect(evt.stopPropagation).toHaveBeenCalledTimes(1);
      expect(selectionsAPI.confirm).not.toHaveBeenCalled();
      expect(setFocusedCellCoord).not.toHaveBeenCalled();
      expect(announce).not.toHaveBeenCalled();
    });

    it('when press esc key and in selections mode, should cancel selection', () => {
      evt.key = KeyCodes.ESC;
      isModal = true;
      runHandleBodyKeyDown();
      expect(evt.preventDefault).toHaveBeenCalledTimes(1);
      expect(evt.stopPropagation).toHaveBeenCalledTimes(1);
      expect(selectionsAPI.cancel).toHaveBeenCalledTimes(1);
      expect(setFocusedCellCoord).not.toHaveBeenCalled();
      expect(announce).toHaveBeenCalledWith({ keys: ['SNTable.SelectionLabel.ExitedSelectionMode'] });
    });

    it('when shift + tab is pressed and in selections mode, should prevent default and call focusSelectionToolbar', () => {
      evt.key = KeyCodes.TAB;
      evt.shiftKey = true;
      isModal = true;
      runHandleBodyKeyDown();
      expect(evt.preventDefault).toHaveBeenCalledTimes(1);
      expect(evt.stopPropagation).toHaveBeenCalledTimes(1);
      expect(handleAccessibility.focusSelectionToolbar).toHaveBeenCalledTimes(1);
      expect(announce).not.toHaveBeenCalled();
    });

    it('when tab is pressed, paginationNeeded is false and in selection mode, should prevent default and call focusSelectionToolbar', () => {
      evt.key = KeyCodes.TAB;
      isModal = true;
      paginationNeeded = false;
      runHandleBodyKeyDown();
      expect(evt.preventDefault).toHaveBeenCalledTimes(1);
      expect(evt.stopPropagation).toHaveBeenCalledTimes(1);
      expect(handleAccessibility.focusSelectionToolbar).toHaveBeenCalledTimes(1);
      expect(announce).not.toHaveBeenCalled();
    });

    it('should call copyCellValue when the pressed keys are Ctrl and C keys', () => {
      evt.key = KeyCodes.C;
      evt.ctrlKey = true;
      runHandleBodyKeyDown();
      expect(handleCopy.default).toHaveBeenCalled();
    });

    it('should call copyCellValue when the pressed keys are Meta and C keys', () => {
      evt.key = KeyCodes.C;
      evt.metaKey = true;
      runHandleBodyKeyDown();
      expect(handleCopy.default).toHaveBeenCalled();
    });

    it('should not call copyCellValue when the flag is disabled', () => {
      evt.key = KeyCodes.C;
      evt.metaKey = true;
      areBasicFeaturesEnabled = false;
      runHandleBodyKeyDown();
      expect(handleCopy.default).not.toHaveBeenCalled();
    });

    it('when other keys are pressed, should only prevent default behavior', () => {
      evt.key = 'A';
      runHandleBodyKeyDown();
      expect(evt.preventDefault).toHaveBeenCalledTimes(1);
      expect(evt.stopPropagation).toHaveBeenCalledTimes(1);
      expect((evt.target as HTMLElement).blur).not.toHaveBeenCalled();
      expect((evt.target as HTMLElement).setAttribute).not.toHaveBeenCalled();
      expect(selectionsAPI.cancel).not.toHaveBeenCalled();
      expect(setFocusedCellCoord).not.toHaveBeenCalled();
    });

    it('when event is coming from excluded cell, should only prevent default behavior', () => {
      isExcluded = true;
      runHandleBodyKeyDown();
      expect(evt.preventDefault).toHaveBeenCalledTimes(1);
      expect(evt.stopPropagation).toHaveBeenCalledTimes(1);
      expect((evt.target as HTMLElement).blur).not.toHaveBeenCalled();
      expect((evt.target as HTMLElement).setAttribute).not.toHaveBeenCalled();
      expect(selectionsAPI.cancel).not.toHaveBeenCalled();
      expect(setFocusedCellCoord).not.toHaveBeenCalled();
    });
  });

  describe('handleBodyKeyUp', () => {
    let evt: React.KeyboardEvent;
    let selectionDispatch: SelectionDispatch;

    beforeEach(() => {
      evt = {
        key: KeyCodes.SHIFT,
      } as unknown as React.KeyboardEvent;
      selectionDispatch = jest.fn();
    });

    it('when the shift key is pressed, should run selectionDispatch', () => {
      handleBodyKeyUp(evt, selectionDispatch, areBasicFeaturesEnabled);

      expect(selectionDispatch).toHaveBeenCalledTimes(1);
    });

    it('when other keys are pressed, should not do anything', () => {
      evt.key = 'Control';

      handleBodyKeyUp(evt, selectionDispatch, areBasicFeaturesEnabled);

      expect(selectionDispatch).not.toHaveBeenCalled();
    });
  });

  describe('handleLastTab', () => {
    let evt: React.KeyboardEvent;
    let isSelectionMode: boolean;
    const keyboard = {} as unknown as stardust.Keyboard;

    beforeEach(() => {
      evt = {
        key: KeyCodes.TAB,
        shiftKey: false,
        target: {} as HTMLElement,
        stopPropagation: jest.fn(),
        preventDefault: jest.fn(),
      } as unknown as React.KeyboardEvent;
      isSelectionMode = true;
      jest.spyOn(handleAccessibility, 'focusSelectionToolbar').mockImplementation(() => jest.fn());
    });

    it('should call focusSelectionToolbar when isSelectionMode is true and tab is pressed', () => {
      handleLastTab(evt, isSelectionMode, keyboard);

      expect(evt.stopPropagation).toHaveBeenCalledTimes(1);
      expect(evt.preventDefault).toHaveBeenCalledTimes(1);
      expect(handleAccessibility.focusSelectionToolbar).toHaveBeenCalledTimes(1);
    });

    it('should not call focusSelectionToolbar when isSelectionMode is false', () => {
      isSelectionMode = false;
      handleLastTab(evt, isSelectionMode, keyboard);

      expect(evt.stopPropagation).not.toHaveBeenCalled();
      expect(evt.preventDefault).not.toHaveBeenCalled();
      expect(handleAccessibility.focusSelectionToolbar).not.toHaveBeenCalled();
    });

    it('should not call focusSelectionToolbar when key is not tab', () => {
      evt.key = 'someKey';
      handleLastTab(evt, isSelectionMode, keyboard);

      expect(evt.stopPropagation).not.toHaveBeenCalled();
      expect(evt.preventDefault).not.toHaveBeenCalled();
      expect(handleAccessibility.focusSelectionToolbar).not.toHaveBeenCalled();
    });

    it('should not call focusSelectionToolbar when shift+tab is pressed', () => {
      evt.shiftKey = true;
      handleLastTab(evt, isSelectionMode, keyboard);

      expect(evt.stopPropagation).not.toHaveBeenCalled();
      expect(evt.preventDefault).not.toHaveBeenCalled();
      expect(handleAccessibility.focusSelectionToolbar).not.toHaveBeenCalled();
    });
  });
});
