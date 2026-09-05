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
| Flashcard answer | `FlashcardAnswer` context supplies `remId`, optional `cardId`, and `revealed` | Hide the action until `revealed` is true. Require `cardId` to resolve direction safely. |
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

### Focused Rem

Use `editor.getFocusedEditorText()` first because it reflects the active editor.
If it is missing or empty, call `focus.getFocusedRem()` and use `rem.text`.
Neither call modifies Rem content.

### Flashcard Answer

The answer widget context does not contain rendered answer text. Resolve its
`cardId` with `card.findOne()`, get the owning Rem, and select content by card
type:

| Card type | Safe MVP answer source | Support |
| --- | --- | --- |
| `forward` | `rem.backText` | Supported when non-empty |
| `backward` | `rem.text` | Supported when non-empty |
| `{ clozeId }` | The answer widget context has no dedicated rendered-answer field | Out of scope for MVP |

If `cardId` is absent, the card cannot be distinguished safely as forward,
backward, or Cloze. Signal Repeat must fall back to another target or show a
fixed toast; it must not guess from `remId` alone. Cloze-aware extraction remains
the v0.4 roadmap item defined by the product specification.

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
| Flashcard placement | Reveal a card in the queue. | The action is absent before reveal and available after reveal. | Passed: `FlashcardAnswer`, `FlashcardExtraDetail`, and `FlashcardUnder` rendered after reveal when context was refreshed on `RevealAnswer`. Use `FlashcardAnswer` for the MVP. |
| Flashcard context | Read the answer widget context after reveal. | `revealed` gates the action; `remId` and optional `cardId` follow the SDK contract. | `revealed` was verified on Desktop. The 0.0.46 contract makes `remId` required and `cardId` optional; absence of `cardId` must be handled without guessing. |
| Forward card | Resolve a forward card through `cardId`. | Use the owning Rem's non-empty `backText`. | Decision verified against SDK card and Rem contracts; product implementation belongs to issue #22. |
| Reverse card | Resolve a reverse card through `cardId`. | Use the owning Rem's non-empty `text`. | Decision verified against SDK card and Rem contracts; product implementation belongs to issue #22. |
| Cloze card | Resolve a Cloze card through `cardId`. | Do not guess the rendered answer segment. | Declared out of scope for the MVP; defer to the v0.4 Cloze-aware roadmap item. |
| No mutation | Compare the placeholder Rem and queue state before and after all checks. | Text, rating, scheduling, and queue position are unchanged by the harness. | Passed. One deliberate placeholder edit used to verify focus restoration was immediately undone. |
| No content logs | Inspect harness source and terminal output. | No selected text, Rem text, or flashcard answer appears in logs. | Passed: only fixed status messages and boolean/count metadata were emitted. |

## Implementation constraints for follow-up issues

- Keep all SDK calls behind `src/services/remnoteAdapter.ts` when issue #18
  introduces that boundary.
- Resolve selected text immediately in the command action. Do not depend on the
  Selected Text Menu, which did not render on the tested Desktop version.
- Refresh flashcard widget context on `QueueEvent.RevealAnswer`; a one-time
  context read remains stale when an already-mounted widget reveals its answer.
- Register the MVP action only at `WidgetLocation.FlashcardAnswer`; the other
  working placements would duplicate the control.
- Treat a missing `cardId` and Cloze card as unsupported instead of guessing.
- Close the popup with `closePopup(true)` to restore the prior editor selection.
- Never log or persist target RichText.
