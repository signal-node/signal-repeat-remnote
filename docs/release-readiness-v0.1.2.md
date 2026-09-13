# v0.1.2 release readiness

This document tracks the release evidence for the RichText media and multi-line
flashcard safety patch. Use synthetic content for all manual checks and do not
record Rem content or media URLs.

## Candidate contents

- RichText-safe rendering and explicit non-autoplay audio/video controls from
  pull request #53.
- Exact supported multi-line answers and safe rejection of unsupported shapes
  from pull request #55.
- Non-invasive flashcard action placement from issue #57, outside RemNote's
  native multi-line answer region.
- Versioned distribution archive `signal-repeat-remnote-v0.1.2.zip`.

## Automated gates

- [x] `mise run typecheck`
- [x] `mise run test` (14 files, 123 tests).
- [x] `mise run build` (SDK validation passed; only the existing webpack size
      advisories remain).
- [x] Candidate ZIP is non-empty and passes `unzip -t`.
- [x] Package, lockfile, and manifest all report version `0.1.2`.
- [x] Source safety checks confirm no learning-content logging, persistence,
      Rem/card mutation, or plugin-owned network path.

Candidate SHA-256 from the local release-preparation build:
`4da9791b1a84aa119f18162d1406e3e98581067aa3330c4236405ef4f6bbee02`.
Rebuild and replace this value after the release commit reaches `main`; the
published asset must match that final build byte for byte.

## Manual gates

- [x] RemNote Desktop: text plus audio, audio/image-only content, URL omission,
      non-autoplay, explicit playback, and Escape cleanup.
- [x] RemNote Desktop: forward Set displays ordered direct answers.
- [x] RemNote Desktop: backward multi-line displays the immediate parent.
- [x] RemNote Desktop: forward List stops with the fixed unsupported notice.
- [x] RemNote Desktop issue #57 regression: registering the action at
      `FlashcardUnder` preserves native List/Set child rows before and after
      reveal, leaves every scoring action enabled, and places Repeat below the
      native answer. Forward Set and unsupported forward List behavior also
      remained correct in the same synthetic queue.
- [x] RemNote Web issue #57 regression: `FlashcardUnder` preserves native
      List/Set child rows before and after reveal, leaves every scoring action
      enabled, and places Repeat below the native answer. Forward Set repeated
      both direct items and forward List retained the fixed unsupported notice.
- [ ] After this release commit reaches `main`, reinstall or reload the
      candidate and confirm that both version fields in RemNote's Build view
      report `0.1.2`. Before merge, the live localhost manifest reports
      `0.1.2` while the repository-backed detail remains at `origin/main`'s
      current `0.1.1`.
- [ ] Install and smoke-test the ZIP downloaded from the published GitHub
      Release before replacing any pending RemNote listing submission.

Do not tag or publish v0.1.2 until every required gate is complete.
