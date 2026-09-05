import { describe, expect, it } from 'vitest';
import { parseRepeatPopupContext } from '../src/services/repeatPopupContext';

describe('parseRepeatPopupContext', () => {
  it('accepts a valid popup context', () => {
    expect(
      parseRepeatPopupContext({
        targetText: 'Repeat me',
        durationSeconds: 30,
        showProgressBar: false,
        showCloseHint: true,
      }),
    ).toEqual({
      targetText: 'Repeat me',
      durationSeconds: 30,
      showProgressBar: false,
      showCloseHint: true,
    });
  });

  it('rejects missing or blank target text', () => {
    expect(parseRepeatPopupContext(undefined)).toBeNull();
    expect(parseRepeatPopupContext({ targetText: '   ' })).toBeNull();
  });

  it('uses safe defaults for invalid settings', () => {
    expect(
      parseRepeatPopupContext({
        targetText: 'Repeat me',
        durationSeconds: 60,
        showProgressBar: 'false',
        showCloseHint: null,
      }),
    ).toEqual({
      targetText: 'Repeat me',
      durationSeconds: 15,
      showProgressBar: true,
      showCloseHint: true,
    });
  });
});
