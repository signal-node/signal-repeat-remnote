# MVP acceptance checklist

This checklist maps the product acceptance criteria in
`Signal-Repeat-SPECIFICATION.md` to automated and manual evidence. Manual checks
use placeholder content only. Signal Repeat must not copy learning content into
test output, logs, documentation, storage, or network requests.

## Acceptance-criteria mapping

| Criterion | Automated evidence | Browser evidence |
| --- | --- | --- |
| AC-01 Selected Text | `targetResolver.test.ts` verifies exact selection text and strict selection-only resolution. `startRepeat.test.ts` verifies the exact target passed to the popup. | RemNote Web issue #19 check: the selected-text action displayed only the selected range. |
| AC-02 Default-duration completion | `useRepeatTimer.test.ts` verifies zero elapsed time, midpoint progress, wall-clock completion, delayed callbacks, exactly-once completion, and cleanup. `repeatSessionModal.test.tsx` connects completion to popup closure. | RemNote Web issue #19 check: the 15-second session closed automatically. |
| AC-03 Cancel | `useRepeatTimer.test.ts` verifies cancellation stops ticks and completion. `repeatSessionModal.test.tsx` limits keyboard cancellation to Escape. | RemNote Web issues #19–22: Escape closed the popup immediately and restored the previous context. |
| AC-04 No data mutation | `mvpSafety.test.ts` rejects Rem writes, card ratings, scheduling changes, queue mutation, persistence, logging, and external communication paths. | Web checks compared the source Rem and revealed flashcard before and after sessions; no plugin-driven change was observed. |
| AC-05 Flashcard | `flashcardAnswer.test.tsx` and `remnoteAdapter.test.ts` verify revealed gating, exact card ID, forward/reverse direction, and unsupported-card safety. | RemNote Web issue #22 check: the revealed forward and reverse answers started Signal Repeat and the rating controls remained available afterward. |
| AC-06 Settings | `settingsService.test.ts` verifies 30 seconds and all supported/invalid setting boundaries. `startRepeat.test.ts` verifies the active duration reaches the popup. | RemNote Web issue #23 regression: the action showed **Repeat · 30s**, the popup was absent at the approximately 33-second observation, and the same revealed card and rating controls remained. The observation includes browser automation latency. The setting was restored to 15 seconds afterward. |
| AC-07 Target missing | `startRepeat.test.ts` verifies a fixed notification and no popup. `targetResolver.test.ts` verifies empty values and failures at every priority level. | RemNote Web issue #20 check: invoking the command without a target showed the fixed notification and mounted no popup. |

## Timer and state-transition coverage

| Boundary | Evidence |
| --- | --- |
| Zero elapsed | Initial snapshot is `elapsedMs: 0`, progress `0`, incomplete. |
| Intermediate | 7.5 seconds of a 15-second duration yields progress `0.5`. |
| Completion | Elapsed wall-clock time reaches progress `1` and completes exactly once. |
| Delayed callback | A late interval uses `Date.now()`-style elapsed time and completes immediately. |
| Cleanup | Completion clears the scheduled handle; repeated cancellation stops all later ticks and completion. |
| Settings | 10, 15, 20, and 30 seconds are accepted; malformed and unsupported values fall back to 15 seconds. |
| Target priority | Selected Text precedes Flashcard Answer, which precedes Focused Rem; later readers are skipped after success or failure. |

## Browser checklist

The detailed browser observations are recorded in
`docs/remnote-sdk-verification.md`. Before release, repeat this compact smoke
check in RemNote Web using placeholder content:

- [x] Selected Text opens the popup with only the selected range.
- [x] The default session closes after approximately 15 seconds.
- [x] Escape closes immediately and restores focus.
- [x] A revealed forward and reverse flashcard shows the Repeat action; the
      action is absent before reveal.
- [x] A 30-second setting produces a 30-second session, then is restored to the
      default.
- [x] Missing input shows the fixed notification without a popup.
- [x] Long text scrolls without clipping and keyboard focus is visible.
- [x] The reduced-motion CSS contract removes progress animation.
- [x] Rem text, rating controls, scheduling data, and queue position remain
      unchanged by the plugin.
- [x] Source and development-server output contain no learning-content logging
      path.

The final two invariants are backed by the source-level regression test as well
as the browser observations. The test session did not rate a card or call a
queue-advance API. One Cloze card was also exercised and produced the fixed
target-missing notification without opening the popup, as required for the MVP.

## Host coverage

The SDK verification spike recorded the mandatory RemNote Desktop API checks on
macOS Desktop 1.28.11, including shortcut fallback, popup context, focus
restoration, settings registration, flashcard placement, and non-mutation. The
Selected Text Menu itself did not render in that host version, so the registered
Option+M command is the supported Desktop fallback.

Product-level visual checks for issues #19–22 were performed in RemNote Web at
the user's request. Any Desktop item not re-run against the final product build
is explicitly retained as a release-checklist item rather than reported as new
evidence.
