import { describe, expect, it } from 'vitest';
import {
  prepareRepeatContent,
  splitRepeatContent,
} from '../src/services/repeatContent';

describe('prepareRepeatContent', () => {
  it('keeps text, links, references, LaTeX, annotations, images, and audio', () => {
    const content = [
      { i: 'm', text: 'linked text', url: 'https://example.invalid/page' },
      { i: 'q', _id: 'referenced-rem' },
      { i: 'x', text: 'x^2' },
      { i: 'n', text: 'annotation', url: 'https://example.invalid/source' },
      { i: 'i', url: 'https://example.invalid/image.png' },
      { i: 'a', url: 'https://example.invalid/audio.mp3', onlyAudio: true },
    ];

    expect(prepareRepeatContent(content)).toEqual(content);
  });

  it('keeps an audio-only target', () => {
    const audio = { i: 'a', url: 'https://example.invalid/audio.mp3' };
    expect(prepareRepeatContent([audio])).toEqual([audio]);
  });

  it('preserves whitespace between supported text chunks', () => {
    expect(prepareRepeatContent(['first', ' ', 'second'])).toEqual([
      'first',
      ' ',
      'second',
    ]);
  });

  it('excludes plugin embeds and unknown elements without exposing their URLs', () => {
    expect(
      prepareRepeatContent([
        'visible text',
        { i: 'p', url: 'https://example.invalid/plugin' },
        { i: 'future-media', url: 'https://example.invalid/internal' },
      ]),
    ).toEqual(['visible text']);
  });

  it('rejects blank or unsupported-only content', () => {
    expect(prepareRepeatContent(['  ', { i: 'fi', size: 'small' }])).toBeNull();
    expect(prepareRepeatContent({ target: 'not-rich-text' })).toBeNull();
  });

  it('separates audio and video while preserving surrounding RichText order', () => {
    const audio = {
      i: 'a' as const,
      url: 'https://example.invalid/audio.mp3',
      onlyAudio: true,
    };
    const video = {
      i: 'a' as const,
      url: 'https://example.invalid/video.mp4',
      onlyAudio: false,
    };

    expect(splitRepeatContent(['before', audio, { i: 'x', text: 'x^2' }, video]))
      .toEqual([
        { kind: 'rich-text', content: ['before'] },
        { kind: 'media', media: audio },
        { kind: 'rich-text', content: [{ i: 'x', text: 'x^2' }] },
        { kind: 'media', media: video },
      ]);
  });
});
