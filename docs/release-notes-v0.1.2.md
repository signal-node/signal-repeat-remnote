# Signal Repeat v0.1.2

Signal Repeat v0.1.2 is a safety and compatibility patch for RichText media and
multi-line flashcards.

## What's new

- Preserves supported RemNote RichText instead of flattening it into a plain
  string, including formatting, links, Rem references, LaTeX, and images.
- Shows audio and video through explicit, keyboard-accessible controls without
  autoplaying or exposing their internal URLs as answer text.
- Supports exact ordered answers for forward Set cards and the immediate parent
  answer for backward multi-line cards when the public SDK identifies the card
  and answer shape.
- Stops safely with a fixed notification for List, Partial, recursive,
  unmatched, or otherwise unsupported multi-line cards instead of guessing an
  answer.

## Privacy and safety

Learning content stays inside the RemNote plugin environment. Signal Repeat
adds no upload, logging, persistence, tracking, or plugin-owned fetch/XHR path,
and it does not modify Rem content, ratings, queues, or scheduling data.

## Known limitations

- Mobile activation remains disabled pending real-device SDK verification.
- Cloze-answer extraction is not included.
- List, Partial, and recursive multi-line answer extraction remains disabled
  until the public SDK can identify the exact answer shown by RemNote.

## Installation

Install the published plugin from **Settings → Plugins** in RemNote. The
attached `signal-repeat-remnote-v0.1.2.zip` is the exact release artifact for
verification and distribution.
