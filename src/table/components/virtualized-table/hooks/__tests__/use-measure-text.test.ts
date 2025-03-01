import { renderHook } from '@testing-library/react';
import useMeasureText from '../use-measure-text';

describe('useMeasureText', () => {
  let measureTextMock: jest.Mock<{ width: number }>;

  beforeEach(() => {
    measureTextMock = jest.fn();
    const context = {
      measureText: measureTextMock,
    } as unknown as CanvasRenderingContext2D;
    jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('estimateWidth', () => {
    test('should estimate width', () => {
      measureTextMock.mockReturnValue({ width: 150 });
      const { result } = renderHook(() => useMeasureText('13px', 'font'));

      expect(result.current.estimateWidth(2)).toBe(332);
    });
  });

  describe('measureText', () => {
    test('should measure width', () => {
      measureTextMock.mockReturnValue({ width: 150 });
      const { result } = renderHook(() => useMeasureText('13px', 'font'));

      expect(result.current.measureText('some string')).toBe(182);
    });
  });
});
