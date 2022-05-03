import { selectCell } from './selections-utils';

export const bodyHandleMouseDown = (evt, cell) => {
  console.log('🚀 ~ file: handle-mouse-event.js ~ line 4 ~ bodyHandleMouseDown ~ cell', cell);
  console.log('🚀 ~ file: handle-mouse-event.js ~ line 4 ~ evt', evt);
};

export const bodyHandleMouseEnter = (evt, cell) => {
  console.log('🚀 ~ file: handle-mouse-event.js ~ line 9 ~ bodyHandleMouseEnter ~ cell', cell);
  console.log('🚀 ~ file: handle-mouse-event.js ~ line 8 ~ bodyHandleMouseEnter ~ evt', evt);
};

export const handleMouseUp = (selectionState, cell, selectionDispatch, evt, announce) => {
  console.log('🚀 ~ file: handle-mouse-event.js ~ line 12 ~ evt', evt);
  cell.isDim && evt.button === 0 && selectCell({ selectionState, cell, selectionDispatch, evt, announce });
};
