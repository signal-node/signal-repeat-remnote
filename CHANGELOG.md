# Changelog

All notable changes to Signal Repeat are documented in this file. The format is
based on Keep a Changelog, and the project follows Semantic Versioning.

## [Unreleased]

## [0.1.2] - 2026-09-13

### Added

- RichText-preserving focus sessions for formatted text, links, Rem references,
  LaTeX, images, audio, and video.
- Exact answer support for forward Set cards and backward multi-line cards when
  the public SDK exposes a matching card and supported answer shape.

### Fixed

- Prevented audio and video URLs from appearing as visible answer text while
  retaining explicit, non-autoplay media controls.
- Prevented List, Partial, recursive, unmatched, and otherwise unsupported
  multi-line cards from displaying guessed or incomplete answers.
- Moved the flashcard action below RemNote's native card content so multi-line
  child rows and scoring controls remain available.
- Removed progress-tick DOM mutations and kept the repeat target subtree stable
  so RemNote's RichText positioning does not jitter in the popup.

### Security

- Kept media handling inside the RemNote plugin environment without adding
  plugin-owned uploads, logging, persistence, tracking, or fetch/XHR paths.

## [0.1.1] - 2026-09-06

### Added

- Dedicated Signal Repeat logo for RemNote plugin listings and installed-plugin
  surfaces.
- RemNote public-listing checklist and mobile v0.2.0 handoff documentation.

### Changed

- Aligned release documentation with versioned distribution archive names.

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

[Unreleased]: https://github.com/signal-node/signal-repeat-remnote/compare/v0.1.2...HEAD
[0.1.2]: https://github.com/signal-node/signal-repeat-remnote/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/signal-node/signal-repeat-remnote/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/signal-node/signal-repeat-remnote/releases/tag/v0.1.0
