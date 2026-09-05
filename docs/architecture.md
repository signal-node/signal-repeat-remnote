# Architecture

Signal Repeat follows the module boundaries defined in
`../Signal-Repeat-SPECIFICATION.md`.

- `src/components/`: presentation components
- `src/hooks/`: reusable UI and timer behavior
- `src/services/`: target resolution, settings, and the RemNote SDK boundary
- `src/types/`: shared domain types
- `src/widgets/`: RemNote plugin and widget entry points

The official RemNote React plugin template build discovers TypeScript React
entry points under `src/widgets/`.

The flashcard integration keeps `RepeatButton` presentational, resolves only a
revealed and identified card in `services/flashcardAnswer.ts`, and keeps widget
context, card lookup, queue events, and settings reads behind
`services/remnoteAdapter.ts`.
