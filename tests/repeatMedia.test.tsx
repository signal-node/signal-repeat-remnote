import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { RepeatMedia } from '../src/components/RepeatMedia';

describe('RepeatMedia', () => {
  it('renders audio without autoplay or browser-native controls', () => {
    const markup = renderToStaticMarkup(
      <RepeatMedia
        media={{
          i: 'a',
          url: 'https://example.invalid/private-audio.mp3',
          onlyAudio: true,
        }}
      />,
    );

    expect(markup).toContain('<audio');
    expect(markup).toContain('preload="metadata"');
    expect(markup).toContain('aria-label="音声を再生"');
    expect(markup).not.toContain('autoplay');
    expect(markup).not.toContain('controls');
    expect(markup).not.toContain('>https://example.invalid/private-audio.mp3<');
  });

  it('renders video with inline playback and the shared accessible control', () => {
    const markup = renderToStaticMarkup(
      <RepeatMedia
        media={{
          i: 'a',
          url: 'https://example.invalid/private-video.mp4',
          onlyAudio: false,
        }}
      />,
    );

    expect(markup).toContain('<video');
    expect(markup).toContain('playsinline=""');
    expect(markup).toContain('aria-label="動画を再生"');
    expect(markup).not.toContain('autoplay');
    expect(markup).not.toContain('controls');
  });
});
