# RemNote SDK integration verification

This document records the integration decisions and manual checks that began in
GitHub issue #13. The temporary verification widgets reported metadata only;
they did not display, persist, or log selected text, Rem content, or flashcard
content. They were removed after the checks so diagnostic controls are not
shipped.

## Static SDK contract

The project pins `@remnote/plugin-sdk@0.0.46`. Its bundled TypeScript
declarations expose every API needed for the MVP:

| Integration | SDK contract in 0.0.46 | Decision |
| --- | --- | --- |
| Selected text | `editor.getSelectedText()` returns `TextSelection \| undefined` | Read `richText` from the returned selection. Retain no content after the popup closes. |
| Focused target | `editor.getFocusedEditorText()` and `focus.getFocusedRem()` | Prefer non-empty focused editor text, then the focused Rem's `text`. |
| Popup | `widget.openPopup()` and `widget.closePopup(restoreFocus?)` | Pass target data through popup context and close with `closePopup(true)`. |
| Flashcard answer | `FlashcardUnder` context supplies `remId`, optional `cardId`, and `revealed` | Place the action below native card content and hide it until `revealed` is true. Resolve direction by `cardId`, or by an exact `queue.getCurrentCard()`/`remId` match when the ID is absent. |
| Shortcut | `app.registerCommand()` accepts `keyboardShortcut` | Register the specification default, `alt+m`; re-check conflicts in Desktop and Web. |
| Settings | Dropdown, boolean, string, and number registration APIs | Register the three MVP settings in issue #15 and read them through a dedicated service. |
| Notification | `app.toast(message)` | Use only fixed messages that contain no learning content. |

The npm registry currently identifies 0.0.46 as the latest published SDK
version. No SDK update is available or required for the MVP integration spike.

## Target-resolution decisions

### Selected Text

`TextSelection.richText` is the repeat target. `TextSelection.remId`, `range`,
and `isReverse` describe the selection but are not needed to render the target.
The Selected Text Menu widget did not render on the tested Desktop version, so
the MVP must resolve the selection immediately in the registered command before
opening the popup. If that widget location is reconsidered later, its selection
timing must be reverified against the then-current host.

The integration was rechecked in RemNote Web on 2026-09-05 for issue #19. The
registered widget is available from **… → Search & Plugins → Signal Repeat** in
the selected-text toolbar. Its **Repeat in focus** action resolved only the
selected range, opened the popup immediately, preserved the source Rem, closed
with Escape, and closed automatically after the default 15 seconds. This Web
result does not supersede the Desktop 1.28.11 limitation recorded below, so the
keyboard command remains an important fallback.

## Web command verification

The product command was checked in RemNote Web on 2026-09-05 for issue #20 with
placeholder content only.

| Check | Result |
| --- | --- |
| Omnibar registration | **Signal Repeat: Repeat in focus** appeared under Plugin and opened the repeat popup. |
| Default shortcut | Option+M opened the same repeat flow. |
| Target priority | Selecting only `selected target` from a longer placeholder Rem displayed exactly that selected range. |
| Missing target | Invoking the command from the Documents page showed the fixed target-missing toast and did not open a popup. |
| Duplicate prevention | A second Option+M invocation left exactly one popup iframe mounted. |
| Cleanup and privacy | Escape closed the popup, the placeholder document was moved to Trash, and no learning content was logged, persisted by the plugin, or transmitted. |

## Web focused-target verification

The focused-target fallback was checked in RemNote Web on 2026-09-05 for issue
#21 with a temporary document containing placeholder text only.

| Check | Result |
| --- | --- |
| Active editor | With no text selected, Option+M displayed the complete focused Rem text and reported it through the `focused-rem` target path. |
| Focused Rem fallback | Opening the placeholder Rem as a document and invoking Option+M outside its text editor displayed the same complete Rem text. |
| Selection priority | Selecting only `editor` inside the placeholder Rem displayed exactly `editor`, confirming that selected text remains higher priority. |
| Empty Rem | Invoking Option+M from a focused empty Rem showed the fixed target-missing toast and did not mount a popup. |
| Rendering safety | The original v0.1.1 check converted focused RichText with `richText.toString()`. The current implementation validates supported RichText, delegates text/references/LaTeX/images to the official read-only `RichText` component, and renders audio/video with popup-local controls; media results are recorded below. |
| Cleanup and privacy | Escape restored focus after each popup, the temporary document was moved to Trash, and the plugin did not mutate, persist, log, or transmit Rem content. |

## Web flashcard-answer verification

The product flashcard widget was checked in RemNote Web on 2026-09-05 for
issue #22. No card was rated, edited, or advanced by Signal Repeat, and answer
content was not copied into logs or documentation.

| Check | Result |
| --- | --- |
| Before reveal | The `FlashcardAnswer` iframe was mounted without a Repeat action while the answer remained hidden. |
| Default label | Revealing the answer displayed the keyboard-accessible **Repeat · 15s** action. |
| Reverse card | The action displayed the reverse card's question-side RichText as the answer target, matching the revealed content. |
| Forward card | The action displayed the forward card's back-side RichText as the answer target, matching the revealed content. |
| Settings | Changing Repeat duration to 30 seconds updated the action to **Repeat · 30s**; the setting was restored to 15 seconds after verification. |
| Session return | Escape closed the popup onto the same revealed card, with all RemNote rating buttons still available. |
| Theme and focus | The action retained readable contrast in RemNote's light theme and exposed a descriptive focusable button label. |
| Unsupported cards | Missing card IDs, empty answers, and Cloze cards resolve to no target in focused tests; Cloze answer extraction remains outside the MVP. |
| Privacy and mutation | Source inspection found no logging, storage, or network path for answer content. Signal Repeat called no rating, scheduling, queue-advance, or Rem-write API. |

## RichText media verification

Use synthetic content only. Do not record media URLs, Rem IDs, or content in
logs or committed documentation.

| Check | Expected result | Status |
| --- | --- | --- |
| Text and audio | Text and an audio control render; the media URL does not appear as body text. | **Passed on RemNote Desktop with synthetic text, image, and audio.** The text and controls rendered, while the media URL was absent from visible body text. |
| Audio/video only | The repeat popup opens with usable media controls and no autoplay. | **Passed on RemNote Desktop and Web.** Audio and video both opened in a stopped state and changed to an accessible pause action only after activation. RemNote Web/Desktop omitted the explicit `onlyAudio: false` flag for the synthetic video, so the renderer treats only the positively tagged `onlyAudio: true` variant as audio. |
| Image only | The image remains within the popup and long content can scroll. | **Passed on RemNote Desktop** with the repository's synthetic session screenshot. |
| Unsupported embed | Interactive plugin embeds are excluded; an unsupported-only target opens no popup. | **Passed in focused boundary and session-start tests.** Unsupported elements are removed before popup context is constructed, so no host renderer is invoked. |
| Cleanup | Closing by Escape, button, or timer disposes the viewer and stops active playback. | **Passed for active audio on RemNote Desktop and active video on Desktop and Web.** After playback changed the action to pause, one Escape press immediately removed the popup and playback UI and restored the source Rem. Close button passed separately; timer disposal is covered by automated tests. |
| Network boundary | Signal Repeat makes no direct `fetch`/XHR; the viewer uses only the existing URL supplied by RichText. | **Passed by source inspection and the safety regression test.** Host playback necessarily reads the existing RichText media URL through the native media element; there is no plugin-owned request, upload, tracking, log, or persistence path. |

The Desktop media check used only an approved repository image and the macOS
standard `Glass.aiff` sound in a temporary synthetic RemNote document. No media
URL, Rem ID, or learning content was copied into logs or this document. The
image viewer exposed the underlying source to the accessibility tree as a
resource path, but did not render it as body text; this is distinct from the
original URL-leak defect. A later MP3 fixture was used to verify active playback
and Escape cleanup without recording its URL or Rem ID. A public synthetic video
fixture was then embedded with RemNote's Video command to verify the video-only
path in Desktop and Web; its URL was not copied into logs or committed
documentation.

## Multi-line answer verification

The adapter treats a card as multi-line when its owning Rem has the public
`MultiLineCard` Powerup or a direct child reports `isCardItem()`. With an exact
`cardId`, the public card direction and child `isListItem()` flags allow a
limited safe subset to be reconstructed. Unresolved shapes still raise a
content-free unsupported-card result and never fall back to the focused Rem.

| Card shape | Expected result | Status |
| --- | --- | --- |
| Forward Set | Join direct card-item RichText in source order and omit only structurally empty editor placeholders. | Passed in a 2026-09-13 Desktop real queue: the popup showed both placeholder answers on separate lines. Unit tests also keep non-empty unsupported RichText fail-closed. A second Desktop check with `FlashcardUnder` preserved both native answer rows and all scoring controls. Web regression remains pending. |
| Forward List | Fixed unsupported notification; no popup. | Numbered card items are detected through `isListItem()`. A 2026-09-13 Desktop real-queue check confirmed the fixed notification and no popup after contextual parent resolution. A second Desktop check with `FlashcardUnder` preserved the native row and all scoring controls. The currently rendered item is not exposed by the public SDK. |
| Backward Set/List | Repeat the owning parent Rem text. | Passed in a 2026-09-12 Desktop real queue: the popup showed the immediate parent. Web regression remains pending. |
| Partial Set/List | Fixed unsupported notification; no popup. | Covered by the same shape gate and unit tests; Signal Repeat does not inspect or guess the currently rendered subset. |
| Recursive Set/List | Fixed unsupported notification; no popup. | Covered by the same shape gate and unit tests; Signal Repeat does not traverse descendants to construct an answer. |

A deterministic synthetic Set subsequently passed on Desktop and Web. The
fixed unsupported notification appeared for the focused parent, focused answer
item, and the revealed-answer widget, and no repeat popup opened. The answer
widget supplied `remId` without `cardId`, confirming that shape detection must
happen before exact card lookup. In the Desktop queue, the global keyboard
command could not obtain the current multi-line card from the public queue API;
it showed the fixed target-missing notification and still did not fall back or
open a popup. No card was rated or advanced during these checks.

The safety behavior is also covered at the public SDK boundary for focused
parent Powerup, focused card item, direct child card item, no fallback after an
unsupported result, and fail-closed behavior when card-shape inspection fails.
When `cardId` is absent, the widget uses `queue.getCurrentCard()` only if its
owning `remId` exactly matches the widget context; otherwise it returns no
target. With an exact direction, only a non-numbered, non-recursive forward Set
or a backward parent answer is enabled.

On 2026-09-12, a Desktop preview of an existing two-way numbered List confirmed
that the forward card reveals items sequentially and the backward card reveals
the immediate parent as its answer. This verifies the direction and
`isListItem()` design assumptions without changing or rating the card. A later
Cards Table session used **Don't record answer choices** to put only the two
matching cards into the real queue. It confirmed that the answer widget receives
a usable `cardId` and `forward` card type, but `Card.getRem()` does not expose
the parent multi-line shape. The adapter now combines that exact card direction
with the owning or contextual parent Rem from `remId`; this host-specific
boundary is covered by regression tests.

On 2026-09-13, post-fix Desktop queue checks completed the supported-subset
verification. The forward numbered List produced the fixed unsupported
notification without opening a popup; its backward card opened a popup with the
immediate parent. A synthetic forward Set opened a popup with its two direct
answers in source order on separate lines. The public SDK also showed that a
direct Set item can report the multi-line powerup itself, so recursive detection
now depends on nested card-item children rather than that inherited flag. All
checks used **Don't record answer choices** and no rating was selected. No
Rem/card IDs or learning content were written to logs or documentation.

RemNote Web Guest-mode testing on 2026-09-13 confirmed the target-resolution
results with synthetic content: a forward Set opened the repeat popup with both
direct items on separate lines, a backward multi-line card repeated its
immediate parent, and a forward numbered List showed the fixed unsupported
notice without opening a popup. However, the overall Web regression failed.
Registering Signal Repeat at `WidgetLocation.FlashcardAnswer` suppressed the
host's multi-line child rows, including before answer reveal, and left the
List-card **Remembered** action disabled after reveal. Disabling Signal Repeat
restored both behaviors for the same cards. No rating control was used and no
identifiers or learning content were recorded. The release remains blocked
until the action can be placed without altering RemNote's native card content
or scoring controls.

Issue #57 moves the action to `WidgetLocation.FlashcardUnder`, which exposes the
same public flashcard context without occupying the native answer region. A
post-fix Desktop synthetic queue confirmed that List and Set child rows remain
visible before and after reveal, every scoring action remains enabled, and the
Repeat action renders below the native content. Forward Set still repeated both
direct items on separate lines, while forward List still showed the fixed
unsupported notice without a popup. No score was selected. The equivalent Web
regression remains a release gate.

## Web MVP regression verification

The completed MVP was regression-checked in RemNote Web on 2026-09-05 for
issue #23. Only placeholder preview content was recorded; learning content was
not copied into this document, logs, storage, or network requests.

| Check | Result |
| --- | --- |
| Long content | The 24-line placeholder preview scrolled from the opening lines to later lines without clipping, and the focused close button retained a visible outline. |
| 30-second duration | The revealed-card action displayed **Repeat · 30s**. The popup was absent at the approximately 33-second observation, including browser-automation latency, and the same revealed card and rating controls remained available. |
| Unsupported card | Invoking the action for a Cloze card produced the fixed target-missing notification and opened no popup. |
| Cleanup | No card rating was selected and no queue-advance API was called. Repeat duration was restored to the 15-second default after the check. |

### Focused Rem

Inspect `focus.getFocusedRem()` first so a multi-line card parent or item is
rejected before any editor text is accepted. For a supported Rem, prefer the
non-empty value from `editor.getFocusedEditorText()` and otherwise use
`rem.text`. If the focus API itself is unavailable, editor text remains a
compatibility fallback; if the Rem is available but its card shape cannot be
checked, fail closed. None of these calls modifies Rem content.

### Flashcard Answer

The answer widget context does not contain rendered answer text. Resolve its
`cardId` with `card.findOne()` for the exact direction. For a multi-line card,
use the contextual `remId` to read the parent shape because `Card.getRem()` can
return a generated Rem without that metadata:

| Card type | Safe MVP answer source | Support |
| --- | --- | --- |
| `forward` | `rem.backText` | Supported when non-empty |
| `backward` | `rem.text` | Supported when non-empty |
| Multi-line `forward` Set | Ordered direct children where `isCardItem()` is true and `isListItem()` is false | Supported when non-recursive and every item has displayable RichText |
| Multi-line `backward` | Owning parent `rem.text` | Supported with an exact card ID |
| Multi-line List/Partial/recursive | The current rendered item/subset/expansion is not public | Unsupported |
| `{ clozeId }` | The answer widget context has no dedicated rendered-answer field | Out of scope for MVP |

If `cardId` is absent, use `queue.getCurrentCard()` only when its `remId` exactly
matches the widget context. Otherwise the card cannot be distinguished safely
as forward, backward, or Cloze, so Signal Repeat returns no target and never
guesses from `remId` alone. Cloze-aware extraction remains the v0.4 roadmap item
defined by the product specification.

## Desktop verification procedure

Use a local knowledge base containing only placeholder content. Start the
development server with `mise run dev`, then add `http://localhost:8080` as a
development plugin in RemNote Desktop.

Installed test host detected on 2026-09-04: RemNote Desktop 1.28.11 for macOS.
Confirm that the version has not changed when executing the checks. Do not paste
placeholder or real learning text into this document or DevTools.

| Check | Procedure | Expected result | Result |
| --- | --- | --- | --- |
| Selected range | Select part of a placeholder Rem and click **Verify Signal Repeat** in the Selected Text Menu. | Popup reports `selectionAvailable: true`, a positive `characterCount`, and `remIdPresent: true`. | Blocked on Desktop 1.28.11: the registered Selected Text Menu widget was not displayed. |
| Selection timing | Repeat the selected-range check after opening the menu by mouse and keyboard. | Selection remains resolvable when the widget action runs. | Not testable because the host menu widget was not displayed. |
| Shortcut fallback | Select part of a placeholder Rem and press Option+M or Alt+M. | Popup reports `source: selected-text` and `selectionAvailable: true`, even if the Selected Text Menu is unavailable. | Passed on Desktop 1.28.11 for macOS. |
| Popup context | Select three placeholder characters and press Option+M. | Popup opens and reports `source: selected-text` without showing content. | Passed: source `selected-text`, selection available, length 3, Rem ID present. |
| Focus restoration | Close the popup with its button, then type one placeholder character without clicking the editor. | `closePopup(true)` returns focus to the prior RemNote editing selection. | Passed: the selected three placeholder characters were replaced by the typed character; the manual edit was then undone. |
| Shortcut and toast | Press Option+M on macOS. | A fixed toast appears and the verification popup opens. | Passed: the command opened the popup; the action awaited the fixed toast first. |
| Settings contract | Register a dropdown and two booleans in the harness activation path. | The 0.0.46 methods accept the specification's setting shapes. | Passed by strict typecheck and successful plugin activation; product settings are implemented in issue #15. |
| Flashcard placement | Reveal a card in the queue. | The action is absent before reveal, available below native content after reveal, and does not alter child rows or scoring controls. | Passed with `FlashcardUnder`. Issue #57 showed that `FlashcardAnswer` occupied the native multi-line answer region even though it exposed the same context. |
| Flashcard context | Read the answer widget context after reveal. | `revealed` gates the action; `remId` and optional `cardId` follow the SDK contract. | `revealed` was verified on Desktop. The 0.0.46 contract makes `remId` required and `cardId` optional; absence of `cardId` must be handled without guessing. |
| Forward card | Resolve a forward card through `cardId`. | Use the owning Rem's non-empty `backText`. | Implemented and verified in RemNote Web for issue #22. |
| Reverse card | Resolve a reverse card through `cardId`. | Use the owning Rem's non-empty `text`. | Implemented and verified in RemNote Web for issue #22. |
| Cloze card | Resolve a Cloze card through `cardId`. | Do not guess the rendered answer segment. | Declared out of scope for the MVP; defer to the v0.4 Cloze-aware roadmap item. |
| No mutation | Compare the placeholder Rem and queue state before and after all checks. | Text, rating, scheduling, and queue position are unchanged by the harness. | Passed. One deliberate placeholder edit used to verify focus restoration was immediately undone. |
| No content logs | Inspect harness source and terminal output. | No selected text, Rem text, or flashcard answer appears in logs. | Passed: only fixed status messages and boolean/count metadata were emitted. |

## Implementation constraints for follow-up issues

- Keep all SDK calls behind `src/services/remnoteAdapter.ts` when issue #18
  introduces that boundary.
- Resolve selected text immediately in the command action. Do not depend on the
  Selected Text Menu, which did not render on the tested Desktop version.
- Refresh flashcard widget context when the queue loads a card or reveals its
  answer; a one-time context read remains stale across those transitions.
- Register the action only at `WidgetLocation.FlashcardUnder`. Do not use
  `FlashcardAnswer`: issue #57 demonstrated that it suppresses native
  multi-line rows and can disable List scoring controls.
- When `cardId` is missing, require an exact current-card/context-Rem match;
  treat a mismatch, unavailable current card, and Cloze as unsupported instead
  of guessing.
- Close the popup with `closePopup(true)` to restore the prior editor selection.
- Never log or persist target RichText.
