# v0.1.2 release readiness

This document tracks the release evidence for the RichText media and multi-line
flashcard safety patch. Use synthetic content for all manual checks and do not
record Rem content or media URLs.

## Candidate contents

- RichText-safe rendering and explicit non-autoplay audio/video controls from
  pull request #53.
- Exact supported multi-line answers and safe rejection of unsupported shapes
  from pull request #55.
- Versioned distribution archive `signal-repeat-remnote-v0.1.2.zip`.

## Automated gates

- [x] `mise run typecheck`
- [x] `mise run test` (14 files, 122 tests).
- [x] `mise run build` (SDK validation passed; only the existing webpack size
      advisories remain).
- [x] Candidate ZIP is non-empty and passes `unzip -t`.
- [x] Package, lockfile, and manifest all report version `0.1.2`.
- [x] Source safety checks confirm no learning-content logging, persistence,
      Rem/card mutation, or plugin-owned network path.

Candidate SHA-256 from the local release-preparation build:
`60de1f1d19f51132c08ec198b9d80c02b2787bf6f04926ad3478b62c76207265`.
Rebuild and replace this value after the release commit reaches `main`; the
published asset must match that final build byte for byte.

## Manual gates

- [x] RemNote Desktop: text plus audio, audio/image-only content, URL omission,
      non-autoplay, explicit playback, and Escape cleanup.
- [x] RemNote Desktop: forward Set displays ordered direct answers.
- [x] RemNote Desktop: backward multi-line displays the immediate parent.
- [x] RemNote Desktop: forward List stops with the fixed unsupported notice.
- [ ] RemNote Web: repeat the final forward Set, backward multi-line, and
      unsupported List regression checks against the v0.1.2 candidate.
- [ ] Install and smoke-test the ZIP downloaded from the published GitHub
      Release before replacing any pending RemNote listing submission.

Do not tag or publish v0.1.2 until every required gate is complete.
