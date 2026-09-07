import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UseRepeatTimerOptions } from '../src/hooks/useRepeatTimer';

const timerHook = vi.fn<(options: UseRepeatTimerOptions) => {
  elapsedMs: number;
  progress: number;
  isComplete: boolean;
  cancel: () => void;
}>();

vi.mock('../src/hooks/useRepeatTimer', () => ({
  useRepeatTimer: (options: UseRepeatTimerOptions) => timerHook(options),
}));

import {
  isRepeatSessionCancelKey,
  RepeatSessionModal,
} from '../src/components/RepeatSessionModal';

describe('RepeatSessionModal', () => {
  beforeEach(() => {
    timerHook.mockReset();
    timerHook.mockReturnValue({
      elapsedMs: 7_500,
      progress: 0.5,
      isComplete: false,
      cancel: vi.fn(),
    });
  });

  it('renders the target prominently with accessible controls and no countdown', () => {
    const markup = renderToStaticMarkup(
      <RepeatSessionModal
        targetContent="A focused repetition target"
        durationMs={15_000}
        showProgressBar
        showCloseHint
        onClose={vi.fn()}
      />,
    );

    expect(markup).toContain('A focused repetition target');
    expect(markup).toContain('aria-label="Close repeat session"');
    expect(markup).toContain('autofocus=""');
    expect(markup).toContain('role="progressbar"');
    expect(markup).toContain('aria-valuenow="50"');
    expect(markup).toContain('<kbd>Esc</kbd> to close');
    expect(markup).not.toContain('15 seconds');
  });

  it('connects elapsed-time completion to popup closure', () => {
    const onClose = vi.fn();

    renderToStaticMarkup(
      <RepeatSessionModal
        targetContent="Target"
        durationMs={20_000}
        showProgressBar
        showCloseHint={false}
        onClose={onClose}
      />,
    );

    const timerOptions = timerHook.mock.calls[0]?.[0];
    expect(timerOptions?.durationMs).toBe(20_000);
    timerOptions?.onComplete();
    expect(onClose).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledWith('completed');
  });

  it('renders target content as escaped text instead of HTML', () => {
    const markup = renderToStaticMarkup(
      <RepeatSessionModal
        targetContent={'<img src=x onerror="privateLearningContent()">'}
        durationMs={15_000}
        showProgressBar={false}
        showCloseHint={false}
        onClose={vi.fn()}
      />,
    );

    expect(markup).toContain(
      '&lt;img src=x onerror=&quot;privateLearningContent()&quot;&gt;',
    );
    expect(markup).not.toContain('<img src="x"');
  });

  it('renders an injected media view without adding its URL as body text', () => {
    const markup = renderToStaticMarkup(
      <RepeatSessionModal
        targetContent={<span data-rich-text-kind="a">Listen</span>}
        durationMs={15_000}
        showProgressBar={false}
        showCloseHint={false}
        onClose={vi.fn()}
      />,
    );

    expect(markup).toContain('Listen');
    expect(markup).toContain('data-rich-text-kind="a"');
    expect(markup).not.toContain('private-audio.mp3');
  });

  it('recognizes only Escape as the cancel key', () => {
    expect(isRepeatSessionCancelKey('Escape')).toBe(true);
    expect(isRepeatSessionCancelKey('Enter')).toBe(false);
  });

  it('captures keyboard cancellation before focused media controls', () => {
    const source = readFileSync(
      new URL('../src/components/RepeatSessionModal.tsx', import.meta.url),
      'utf8',
    );

    expect(source).toContain(
      "window.addEventListener('keydown', handleKeyDown, true)",
    );
    expect(source).toContain(
      "window.removeEventListener('keydown', handleKeyDown, true)",
    );
  });
});
