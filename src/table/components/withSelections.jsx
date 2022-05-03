import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { getSelectionStyle } from '../utils/styling-utils';

export default function withSelections(CellComponent) {
  const HOC = (props) => {
    const { selectionState, cell, selectionDispatch, styling, announce, column, ...passThroughProps } = props;

    const selectionStyling = useMemo(
      () => getSelectionStyle(styling, cell, selectionState),
      [styling, cell, selectionState]
    );

    return <CellComponent {...passThroughProps} styling={selectionStyling} />;
  };

  HOC.defaultProps = {
    column: null,
  };

  HOC.propTypes = {
    styling: PropTypes.object.isRequired,
    selectionState: PropTypes.object.isRequired,
    cell: PropTypes.object.isRequired,
    selectionDispatch: PropTypes.func.isRequired,
    announce: PropTypes.func.isRequired,
    column: PropTypes.object,
  };

  return HOC;
}
