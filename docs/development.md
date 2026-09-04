# Development

Mise manages the Node.js runtime and the project development tasks. Install the
runtime and dependencies with:

```sh
mise install
mise run setup
```

Start the local development server with:

```sh
mise run dev
```

Before submitting a change, run:

```sh
mise run typecheck
mise run test
mise run build
```

Vitest runs unit tests in a Node environment, independently of a running
RemNote client. Test files belong under `tests/` and use the `*.test.ts` naming
convention. Run `mise exec -- npm run test:watch` for an interactive watch
session.

See `AGENTS.md` for repository-wide development constraints.

The manual RemNote integration matrix, the temporary verification harness, and
the resulting implementation decisions are documented in
`remnote-sdk-verification.md`.
