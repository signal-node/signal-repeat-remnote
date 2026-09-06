import { describe, expect, it } from 'vitest';
import { parseRepeatPopupContext } from '../src/services/repeatPopupContext';

describe('parseRepeatPopupContext', () => {
  it('accepts a valid popup context', () => {
    expect(
      parseRepeatPopupContext({
        targetRichText: ['Repeat me'],
        durationSeconds: 30,
        showProgressBar: false,
        showCloseHint: true,
      }),
    ).toEqual({
      targetRichText: ['Repeat me'],
      durationSeconds: 30,
      showProgressBar: false,
      showCloseHint: true,
    });
  });

  it('rejects missing or blank target RichText', () => {
    expect(parseRepeatPopupContext(undefined)).toBeNull();
    expect(parseRepeatPopupContext({ targetRichText: ['   '] })).toBeNull();
  });

  it('uses safe defaults for invalid settings', () => {
    expect(
      parseRepeatPopupContext({
        targetRichText: ['Repeat me'],
        durationSeconds: 60,
        showProgressBar: 'false',
        showCloseHint: null,
      }),
    ).toEqual({
      targetRichText: ['Repeat me'],
      durationSeconds: 15,
      showProgressBar: true,
      showCloseHint: true,
    });
  });

  it('keeps media while excluding interactive plugin embeds', () => {
    expect(
      parseRepeatPopupContext({
        targetRichText: [
          { i: 'a', url: 'https://example.invalid/audio.mp3' },
          { i: 'p', url: 'https://example.invalid/plugin' },
        ],
      }),
    ).toMatchObject({
      targetRichText: [
        { i: 'a', url: 'https://example.invalid/audio.mp3' },
      ],
    });
  });
});
