# v0.1.0 release readiness

This matrix maps the MVP Definition of Done in
`Signal-Repeat-SPECIFICATION.md` Section 34 to release evidence. Browser checks
use placeholder content only.

| Definition of Done | Evidence |
| --- | --- |
| Plugin loads | RemNote Web product checks for issues #19–23 and the Desktop 1.28.11 SDK verification loaded the development plugin successfully. |
| Selected Text starts a session | Automated target/popup tests and the issue #19 Web check. |
| Flashcard Answer starts a session | Forward/reverse automated tests and the issue #22 Web check. |
| Shortcut starts a session | Command tests plus Web and Desktop Option+M checks. |
| Default 15 seconds | Timer/settings tests and the issue #19 Web completion check. |
| 10/15/20/30-second settings | Settings boundary tests and the issue #23 30-second Web check. |
| Progress bar | Component tests and browser preview inspection. |
| Escape cancellation | Modal/timer tests and Web integration checks. |
| Automatic completion | Wall-clock completion tests and 15/30-second Web checks. |
| No Rem mutation | Read-only adapter design, source regression guard, and browser observations. |
| No flashcard rating mutation | Source regression guard and revealed-card browser observations without rating actions. |
| No external communication | Source regression guard and development-server inspection. |
| No learning-content logs | Source regression guard and content-free error tests. |
| Unit tests | `mise run test`: 11 files and 82 tests pass for the release candidate. |
| Build | Manifest validation and `mise run build` pass; `PluginZip.zip` is non-empty and contains the v0.1.0 manifest, README, and screenshot. |
| Final browser smoke | The v0.1.0 placeholder previews rendered the Selected Text action, the 15-second Flashcard action, and the focused popup with progress and close hint. The popup closed automatically and with Escape. |
| CI | The Issue #24 pull request and resulting `main` push passed the complete workflow. The release pull request and its resulting `main` push must also pass before tagging. |
| Required repository documents | README, LICENSE, CONTRIBUTING, and SECURITY are present and reviewed in the release pull request. |
| GitHub Release can be created | Versions, changelog, release notes, artifact, tag command, and immutable-tag procedure are prepared in `docs/release.md`. |

Product-level screen verification is performed in RemNote Web as requested by
the project owner. Existing Desktop evidence is retained in
`docs/remnote-sdk-verification.md`; Desktop-only items not re-run on the final
candidate remain explicit pre-publication checks rather than being represented
as new browser evidence.
