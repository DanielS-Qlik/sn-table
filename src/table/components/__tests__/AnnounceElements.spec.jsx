import React from 'react';
import { render } from '@testing-library/react';
import { perf, wait } from 'react-performance-testing';
import 'jest-performance-testing';

import AnnounceElements from '../AnnounceElements';

describe('<AnnounceElements />', () => {
  it('should render the Announce component properly', () => {
    const result = render(<AnnounceElements />);
    const firstAnnounceElement = result.container.querySelector('#sn-table-announcer--01');
    const secondAnnounceElement = result.container.querySelector('#sn-table-announcer--02');

    expect(firstAnnounceElement).toBeVisible();
    expect(secondAnnounceElement).toBeVisible();
  });

  it('should render AnnounceElements once and div twice', () => {
    const { renderCount } = perf(React);

    render(<AnnounceElements />);

    wait(() => {
      expect(renderCount.current.AnnounceElements).toBeRenderedTimes(1);
      expect(renderCount.current['styled.div']).toBeRenderedTimes(2);
    });
  });
});
