import { useCallback, useEffect } from 'react';
import { useRepeatTimer } from '../hooks/useRepeatTimer';
import type { RepeatSessionCloseReason } from '../types/repeatSession';
import { ProgressBar } from './ProgressBar';

export type RepeatSessionModalProps = {
  targetText: string;
  durationMs: number;
  showProgressBar: boolean;
  showCloseHint: boolean;
  onClose: (reason: RepeatSessionCloseReason) => void;
};

export function isRepeatSessionCancelKey(key: string): boolean {
  return key === 'Escape';
}

export function RepeatSessionModal({
  targetText,
  durationMs,
  showProgressBar,
  showCloseHint,
  onClose,
}: RepeatSessionModalProps): JSX.Element {
  const handleComplete = useCallback(() => {
    onClose('completed');
  }, [onClose]);
  const timer = useRepeatTimer({ durationMs, onComplete: handleComplete });

  const handleCancel = useCallback(() => {
    timer.cancel();
    onClose('cancelled');
  }, [onClose, timer.cancel]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (isRepeatSessionCancelKey(event.key)) {
        event.preventDefault();
        handleCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCancel]);

  return (
    <main className="signal-repeat-session" aria-label="Signal Repeat session">
      <button
        className="signal-repeat-session__close"
        type="button"
        aria-label="Close repeat session"
        autoFocus
        onClick={handleCancel}
      >
        <span aria-hidden="true">×</span>
      </button>

      <div className="signal-repeat-session__content">
        <p className="signal-repeat-session__target">{targetText}</p>
      </div>

      <footer className="signal-repeat-session__footer">
        {showProgressBar ? <ProgressBar progress={timer.progress} /> : null}
        {showCloseHint ? (
          <p className="signal-repeat-session__hint">
            <kbd>Esc</kbd> to close
          </p>
        ) : null}
      </footer>
    </main>
  );
}
