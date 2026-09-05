export type RepeatButtonProps = {
  durationSeconds: number;
  disabled?: boolean;
  onClick: () => void;
};

export function RepeatButton({
  durationSeconds,
  disabled = false,
  onClick,
}: RepeatButtonProps): JSX.Element {
  return (
    <button
      className="signal-repeat-flashcard-action"
      type="button"
      disabled={disabled}
      aria-label={`Repeat flashcard answer for ${durationSeconds} seconds`}
      onClick={onClick}
    >
      <span aria-hidden="true">↻</span>
      <span>Repeat · {durationSeconds}s</span>
    </button>
  );
}
