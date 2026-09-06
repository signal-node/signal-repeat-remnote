import { useCallback, useEffect, useRef, useState } from 'react';
import type { RichTextAudioInterface } from '@remnote/plugin-sdk';

export type RepeatMediaProps = {
  media: RichTextAudioInterface;
};

export function RepeatMedia({ media }: RepeatMediaProps): JSX.Element {
  const mediaRef = useRef<HTMLMediaElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);
  const isVideo = media.onlyAudio === false;
  const mediaName = isVideo ? '動画' : '音声';

  const stopPlayback = useCallback(() => {
    mediaRef.current?.pause();
  }, []);

  useEffect(() => {
    const element = mediaRef.current;
    return () => element?.pause();
  }, []);

  const togglePlayback = useCallback(async () => {
    const element = mediaRef.current;
    if (!element || hasFailed) {
      return;
    }

    if (!element.paused) {
      stopPlayback();
      return;
    }

    try {
      await element.play();
    } catch {
      if (mediaRef.current === element) {
        setHasFailed(true);
        setIsPlaying(false);
      }
    }
  }, [hasFailed, stopPlayback]);

  const commonProps = {
    className: 'signal-repeat-session__media',
    src: media.url,
    preload: 'metadata' as const,
    onPlay: () => setIsPlaying(true),
    onPause: () => setIsPlaying(false),
    onEnded: () => setIsPlaying(false),
    onError: () => {
      setHasFailed(true);
      setIsPlaying(false);
    },
    'aria-label': `Repeat ${isVideo ? 'video' : 'audio'}`,
  };

  return (
    <div className="signal-repeat-media">
      {isVideo ? (
        <video
          {...commonProps}
          ref={(element) => {
            mediaRef.current = element;
          }}
          playsInline
        />
      ) : (
        <audio
          {...commonProps}
          ref={(element) => {
            mediaRef.current = element;
          }}
        />
      )}
      <button
        className="signal-repeat-media__toggle"
        type="button"
        disabled={hasFailed}
        aria-label={`${mediaName}を${isPlaying ? '一時停止' : '再生'}`}
        onClick={() => void togglePlayback()}
      >
        {isPlaying ? '一時停止' : '再生'}
      </button>
      {hasFailed ? (
        <p className="signal-repeat-media__error" role="status">
          メディアを読み込めませんでした。
        </p>
      ) : null}
    </div>
  );
}
