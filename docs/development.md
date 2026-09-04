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
mise run build
```

See `AGENTS.md` for repository-wide development constraints.
