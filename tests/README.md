# Tests

Vitest runs the TypeScript unit suite in a Node environment. Tests must not
require a running RemNote client or import the SDK solely to make the test
environment work.

- Place tests in this directory and name them `*.test.ts`.
- Run the suite once with `mise run test`.
- Run an interactive watch session with `mise exec -- npm run test:watch`.
- Use `vi.useFakeTimers()` for time-dependent behavior and restore real timers
  after each test that enables them.

The behavior targets are target resolution, elapsed-time progress, session
state transitions, settings validation, and the MVP privacy/non-mutation
boundary. The acceptance-criteria mapping and browser checklist live in
`docs/mvp-acceptance-checklist.md`.
