import { memo } from 'react';

type ProgressBarProps = {
  durationMs: number;
};

export function normalizeProgressDuration(durationMs: number): number {
  if (!Number.isFinite(durationMs) || durationMs <= 0) {
    return 0;
  }

  return durationMs;
}

export const ProgressBar = memo(function ProgressBar({
  durationMs,
}: ProgressBarProps): JSX.Element {
  const normalizedDurationMs = normalizeProgressDuration(durationMs);

  return (
    <div
      className="signal-repeat-progress"
      role="progressbar"
      aria-label="Repeat session progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuetext="Repeat session in progress"
    >
      <div
        className="signal-repeat-progress__fill"
        style={{ animationDuration: `${normalizedDurationMs}ms` }}
      />
    </div>
  );
});
