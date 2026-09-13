import { memo, type ReactNode, useCallback, useEffect } from 'react';
import { useRepeatTimer } from '../hooks/useRepeatTimer';
import type { RepeatSessionCloseReason } from '../types/repeatSession';
import { ProgressBar } from './ProgressBar';

export type RepeatSessionModalProps = {
  targetContent: ReactNode;
  durationMs: number;
  showProgressBar: boolean;
  showCloseHint: boolean;
  onClose: (reason: RepeatSessionCloseReason) => void;
};

type RepeatSessionTargetProps = {
  targetContent: ReactNode;
};

export function hasSameRepeatSessionTarget(
  previous: Readonly<RepeatSessionTargetProps>,
  next: Readonly<RepeatSessionTargetProps>,
): boolean {
  return Object.is(previous.targetContent, next.targetContent);
}

const StableRepeatSessionTarget = memo(function StableRepeatSessionTarget({
  targetContent,
}: RepeatSessionTargetProps): JSX.Element {
  return (
    <div className="signal-repeat-session__target">{targetContent}</div>
  );
}, hasSameRepeatSessionTarget);

export function isRepeatSessionCancelKey(key: string): boolean {
  return key === 'Escape';
}

export function RepeatSessionModal({
  targetContent,
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

    // Capture Escape so cancellation remains reliable while a media action or
    // another control inside the popup owns keyboard focus.
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
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
        <StableRepeatSessionTarget targetContent={targetContent} />
      </div>

      <footer className="signal-repeat-session__footer">
        {showProgressBar ? <ProgressBar durationMs={durationMs} /> : null}
        {showCloseHint ? (
          <p className="signal-repeat-session__hint">
            <kbd>Esc</kbd> to close
          </p>
        ) : null}
      </footer>
    </main>
  );
}
