# Architecture

Signal Repeat follows the module boundaries and privacy constraints in
[`../Signal-Repeat-SPECIFICATION.md`](../Signal-Repeat-SPECIFICATION.md).

## Runtime flow

1. `src/widgets/index.tsx` registers settings, the command, the selected-text
   entry point, and the flashcard-answer entry point.
2. `src/services/targetResolver.ts` resolves selected text, a revealed
   flashcard answer, or the focused Rem in strict priority order.
3. `src/services/startRepeat.ts` reads the current duration and opens the popup
   with typed, transient context.
4. `src/widgets/popup.tsx` validates that context and renders
   `RepeatSessionModal`.
5. `useRepeatTimer` derives progress from elapsed wall-clock time. Completion,
   Escape, or the close button cleans up the timer and closes the popup with
   focus restoration.

## Module boundaries

- `src/components/`: presentational controls, modal, and progress bar
- `src/hooks/`: elapsed-time timer behavior and React cleanup
- `src/services/remnoteAdapter.ts`: the only RemNote Plugin SDK boundary
- `src/services/targetResolver.ts`: target priority and content-free failures
- `src/services/settingsService.ts`: supported settings and safe defaults
- `src/services/startRepeat.ts`: repeat-session orchestration
- `src/types/`: shared domain and popup-context types
- `src/widgets/`: RemNote activation and widget entry points discovered by the
  official React plugin-template build

The flashcard integration renders a presentational `RepeatButton` only after
reveal. It resolves forward and reverse answers through an identified card and
does not guess at Cloze content or missing card IDs.

## Safety properties

Learning content is held only in memory for the active session and rendered as
ordinary React text. There is no logging, browser storage, external network, Rem
write, card-rating, queue, or scheduling path. The plugin manifest requests
read-only access, and regression tests enforce these boundaries.
