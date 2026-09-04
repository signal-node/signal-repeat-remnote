# Signal Repeat development guide

## Project

Signal Repeat is a focused repetition plugin for RemNote.

Before making behavioral or architectural changes, read
`Signal-Repeat-SPECIFICATION.md`. It is the source of truth for product scope,
behavior, acceptance criteria, privacy, and accessibility requirements.

## Technology and structure

- Use Mise as the project environment and task runner.
- Use the Node.js version declared in `mise.toml`; do not rely on a globally
  installed Node.js or npm.
- Use TypeScript with strict type checking.
- Build UI with React function components and hooks.
- Use the public RemNote Plugin SDK and the official React plugin template
  conventions.
- Keep RemNote SDK calls behind `src/services/remnoteAdapter.ts` when that
  boundary is introduced.
- Keep UI components, timer logic, target resolution, and settings access in
  separate modules as described by the specification.
- Widget entry points belong in `src/widgets/`; the template build discovers
  them automatically.

## Commands

- Install the configured runtime: `mise install`
- Install dependencies: `mise run setup`
- Start development server: `mise run dev`
- Check TypeScript: `mise run typecheck`
- Run tests once: `mise run test`
- Watch tests: `mise exec -- npm run test:watch`
- Build and validate the plugin: `mise run build`

## Implementation rules

- Prefer documented RemNote Plugin SDK APIs.
- Do not depend on RemNote internal DOM class names or private APIs.
- Do not transmit or persist selected text, Rem content, or flashcard content.
- Do not log user learning content.
- Do not modify Rem content, card ratings, queue state, or scheduling data.
- Use elapsed wall-clock time for repeat timing; do not count interval ticks.
- Avoid `any`; define types at SDK boundaries.
- Clean up timers, listeners, and widget resources on unmount or deactivation.
- Preserve keyboard access, reduced-motion behavior, readable contrast, and
  long-text scrolling.
- Keep dependencies minimal; do not add state-management, HTTP, or UI-framework
  packages without a concrete requirement.

## Verification

- Run `mise run typecheck` after TypeScript changes.
- Run `mise run test` after behavior or test changes.
- Run `mise run build` after manifest, widget, dependency, or build changes.
- Add or update focused tests when implementing behavior from the acceptance
  criteria.
- Confirm that no user content is written to logs, storage, or network calls.

## Documentation priority

When guidance conflicts, use this order:

1. The user's current instructions.
2. `Signal-Repeat-SPECIFICATION.md` for product behavior and scope.
3. Public RemNote Plugin SDK and official template constraints.
4. This `AGENTS.md` for repository workflow and implementation boundaries.
5. `README.md` and files under `docs/` for explanatory documentation.

Do not duplicate the full product specification in this file. Update the
specification when product requirements change and update this file only when
the development workflow or repository-wide constraints change.
