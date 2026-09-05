type ProgressBarProps = {
  progress: number;
};

function clampProgress(progress: number): number {
  if (!Number.isFinite(progress)) {
    return 0;
  }

  return Math.min(1, Math.max(0, progress));
}

export function ProgressBar({ progress }: ProgressBarProps): JSX.Element {
  const normalizedProgress = clampProgress(progress);
  const percentage = Math.round(normalizedProgress * 100);

  return (
    <div
      className="signal-repeat-progress"
      role="progressbar"
      aria-label="Repeat session progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percentage}
    >
      <div
        className="signal-repeat-progress__fill"
        style={{ transform: `scaleX(${normalizedProgress})` }}
      />
    </div>
  );
}
