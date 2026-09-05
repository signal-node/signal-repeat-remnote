# Changelog

All notable changes to Signal Repeat are documented in this file. The format is
based on Keep a Changelog, and the project follows Semantic Versioning.

## [Unreleased]

## [0.1.0] - 2026-09-05

### Added

- Focused repeat sessions with 10, 15, 20, and 30-second durations.
- Selected-text, revealed flashcard-answer, focused-Rem, and keyboard-command
  entry points.
- Elapsed-time progress, optional close hint, Escape cancellation, automatic
  completion, and focus restoration.
- Read-only RemNote SDK boundary with content-free errors and safe unsupported
  card handling.
- Automated MVP, accessibility, privacy, and non-mutation regression coverage.
- Mise-managed setup, reproducible lockfile installation, and pull-request/main
  CI validation.

### Security

- Learning content is neither logged nor persisted and is never sent outside
  the RemNote plugin environment.
- Signal Repeat does not write Rem content or alter ratings, queues, or
  scheduling data.

[Unreleased]: https://github.com/signal-node/signal-repeat-remnote/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/signal-node/signal-repeat-remnote/releases/tag/v0.1.0
