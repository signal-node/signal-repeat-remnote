# Contributing to Signal Repeat

Thank you for helping improve Signal Repeat.

## Before starting

Read `Signal-Repeat-SPECIFICATION.md` and `AGENTS.md`. For behavior changes,
open or reference a GitHub issue so the intended scope and acceptance criteria
are clear.

## Development setup

Install Mise, then run:

```sh
mise install
mise run setup
```

Start the local RemNote plugin development server with:

```sh
mise run dev
```

## Verification

Before opening a pull request, run:

```sh
mise run typecheck
mise run test
mise run build
```

Add or update focused tests when implementing behavior.

## Privacy and security

Never commit, log, or paste real RemNote content into an issue or test fixture.
Use synthetic text in reproduction steps and tests. Report vulnerabilities
according to `SECURITY.md`.

## Commits and pull requests

Use focused changes and Conventional Commits where practical, for example:

```text
feat: add selected text target resolution
fix: clean up repeat timer on close
docs: clarify local development setup
```

Complete the pull request checklist and describe any manual RemNote testing.
