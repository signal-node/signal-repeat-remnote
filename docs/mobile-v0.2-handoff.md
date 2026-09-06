# Signal Repeat v0.2.0 mobile support handoff

## Purpose

This document is the execution brief for adding smartphone and tablet support
after the Web/Desktop v0.1.0 baseline. Use it as the starting instruction for a
separate Codex chat.

The objective is to make the existing focused-repeat experience usable in the
official RemNote apps on phones and tablets without weakening Signal Repeat's
privacy, safety, accessibility, or non-invasive behavior.

## Baseline

- Repository: `signal-node/signal-repeat-remnote`
- Stable baseline: `v0.1.0`
- Baseline commit: `b2a21ae88aa465a02450ed70ee97c23296a2b170`
- Release: <https://github.com/signal-node/signal-repeat-remnote/releases/tag/v0.1.0>
- Target mobile release: `v0.2.0`
- RemNote Plugin SDK at the baseline: `0.0.46`
- `public/manifest.json` currently has `"enableOnMobile": false`
- Web/Desktop baseline verification: TypeScript passed, all 82 tests passed,
  the plugin build passed, and the generated versioned ZIP was valid.

Mobile support was intentionally outside the v0.1.0 MVP. Do not treat the
manifest flag alone as proof that the plugin works on mobile.

## Read before changing anything

Read these files completely, in this order:

1. `AGENTS.md`
2. `Signal-Repeat-SPECIFICATION.md`
3. `docs/architecture.md`
4. `docs/development.md`
5. `docs/remnote-sdk-verification.md`
6. `docs/mvp-acceptance-checklist.md`
7. `public/manifest.json`
8. The current files under `src/widgets/`, `src/components/`, `src/services/`,
   and `src/hooks/`

Then inspect the current `main`, open Issues and Pull Requests, current GitHub
Release, and the latest public RemNote Plugin SDK documentation. Do not assume
the versions or repository state recorded above are still current.

## Product and engineering constraints

- Use Mise for the runtime and all project tasks.
- Keep TypeScript strict and avoid `any` at SDK boundaries.
- Use only documented public RemNote Plugin SDK APIs.
- Do not depend on RemNote internal DOM class names or private APIs.
- Keep SDK calls behind `src/services/remnoteAdapter.ts`.
- Do not transmit, persist, or log selected text, Rem content, or flashcard
  content.
- Do not modify Rem content, card ratings, queue state, or scheduling data.
- Preserve the elapsed wall-clock timer implementation.
- Clean up timers, listeners, and widgets when the app is backgrounded,
  suspended, unmounted, or deactivated.
- Preserve keyboard access for Web/Desktop while adding touch access.
- Preserve reduced-motion behavior, contrast, text selection, and long-text
  scrolling.
- Keep dependencies minimal. Do not add a UI framework, HTTP library, or state
  manager without a demonstrated requirement.
- Make changes Issue-by-Issue and merge them through focused Pull Requests.

## Supported scope for v0.2.0

The minimum supported matrix should be defined and verified for:

| Platform | Required orientation/input |
|---|---|
| iPhone | Portrait, touch only |
| iPad | Portrait and landscape, touch only |
| Android phone | Portrait, touch only |
| RemNote Web/Desktop | Existing mouse and keyboard behavior must not regress |

An external keyboard on iPad may be tested, but it must not be required.

Assume that plugins require an online RemNote session unless current official
documentation explicitly proves otherwise. Document the online-only limitation
for mobile; do not promise offline plugin availability.

## Required work sequence

### 2. Define the mobile product specification

Update `Signal-Repeat-SPECIFICATION.md` through a documentation-only Pull
Request before implementing mobile behavior.

Specify:

- supported devices, OS ranges, orientations, and input methods;
- mobile entry points for selected text, flashcard answers, and focused Rem;
- the fallback when a widget location is unavailable in a mobile client;
- touch target sizes, safe-area handling, long-text behavior, and font scaling;
- background, lock-screen, app-switching, and interruption behavior;
- the online-only limitation;
- accessibility and regression acceptance criteria;
- which items remain explicitly out of scope.

Do not silently reinterpret the existing MVP behavior. Record any deliberate
behavior difference and why it is necessary on mobile.

Suggested Issue title:

`docs: define v0.2.0 mobile support and device matrix`

Exit criteria:

- the product owner can approve the device matrix and mobile behavior without
  reading implementation code;
- every later work item maps to a written acceptance criterion.

### 3. Run a RemNote mobile SDK compatibility spike

Create a minimal, disposable or clearly isolated spike using synthetic content.
Test the existing public widget locations and adapter calls inside the official
RemNote mobile apps.

Verify at least:

- plugin load and activation with mobile support enabled on the spike branch;
- Selected Text Menu availability after a touch selection;
- flashcard-answer widget availability after revealing an answer;
- focused Rem or editor context access;
- popup creation and closing;
- settings reads;
- focus restoration or the safest available mobile equivalent;
- behavior after switching apps, locking the device, and returning;
- absence of learning content in logs, storage, and network traffic.

Record each result as `supported`, `unsupported`, or `inconclusive`, including
the RemNote app version, OS version, device class, and reproduction steps. Use
synthetic text only in evidence.

Do not merge `"enableOnMobile": true` into `main` as part of the spike unless
all required paths are safe. A browser responsive preview is useful for layout
work but is not evidence of native RemNote mobile SDK support.

Suggested Issue title:

`spike: verify RemNote Plugin SDK behavior on mobile clients`

Exit criteria:

- every required SDK capability has real-device evidence;
- unsupported entry points have an approved fallback design;
- no private API or DOM workaround is proposed.

### 4. Implement touch-accessible entry points

Implement the smallest approved entry-point changes from the spike.

Requirements:

- touch-only users can start a repeat session from every supported context;
- existing Web/Desktop selected-text, flashcard, focused-Rem, and shortcut
  behavior remains intact;
- unavailable mobile widget locations fail with a fixed, content-free message;
- no learning text appears in diagnostic output;
- repeated taps cannot open overlapping sessions.

Add adapter-level types and focused tests before expanding UI code.

Suggested Issue title:

`feat: add mobile-safe repeat session entry points`

### 5. Make the session UI responsive and safe-area aware

Adapt the popup without changing the product's focused visual hierarchy.

Requirements:

- correct rendering at narrow phone widths and tablet split-screen widths;
- `env(safe-area-inset-*)` handling where relevant;
- minimum practical touch target size for Close;
- no clipped target text or controls at large text sizes;
- long content scrolls while Close remains reachable;
- portrait and landscape layouts do not overflow;
- reduced motion remains respected;
- progress remains perceivable but visually secondary.

Prefer CSS and existing components over device-specific branches.

Suggested Issue title:

`feat: make repeat session responsive for phones and tablets`

### 6. Harden timer and lifecycle behavior

Define and implement the specification's chosen behavior for backgrounding,
suspension, and resume.

The timer must continue to derive progress from elapsed wall-clock time. On
resume, it must either close immediately if time expired or show the correct
remaining progress. It must never restart merely because the app resumed.

Verify cleanup on:

- manual Close;
- automatic completion;
- widget unmount;
- plugin deactivation;
- navigation away;
- app background and resume.

Suggested Issue title:

`fix: harden repeat timer across mobile lifecycle changes`

### 7. Add automated mobile-focused regression tests

Add focused unit and component tests for:

- narrow and long-content rendering contracts that can be tested in jsdom;
- repeated touch activation and session de-duplication;
- elapsed-time completion after a simulated suspension;
- cleanup after unmount and deactivation;
- fixed, content-free error reporting;
- settings parity;
- existing Web/Desktop paths.

Do not claim that automated browser tests replace native-device verification.

Run after each behavior change:

```sh
mise run typecheck
mise run test
mise run build
```

Suggested Issue title:

`test: add mobile and lifecycle regression coverage`

### 8. Complete real-device acceptance testing

Use a release candidate ZIP built from a clean checkout. Test synthetic content
on the supported matrix and attach content-free evidence to the Issue or Pull
Request.

For every device, verify:

1. installation and activation;
2. selected-text entry point or approved fallback;
3. revealed flashcard-answer entry point;
4. focused-Rem entry point or approved fallback;
5. 10, 15, 20, and 30-second settings;
6. Close by touch;
7. automatic completion;
8. app-switch and resume behavior;
9. portrait and landscape where required;
10. long text and increased text size;
11. no content mutation, rating, queue advance, storage, log, or network leak;
12. Web/Desktop regression smoke test.

Record app and OS versions. A failed required case blocks mobile publication.

Suggested Issue title:

`test: complete v0.2.0 mobile device acceptance`

### 9. Enable mobile and prepare v0.2.0

Only after the compatibility spike, implementation, and device acceptance pass:

- change `public/manifest.json` to `"enableOnMobile": true`;
- update package, lockfile, and manifest versions together to `0.2.0`;
- update README installation, usage, supported platforms, and online-only
  limitation;
- add a dedicated `public/logo.svg` (or `public/logo.png`) before the RemNote
  store listing; do not rely on the SDK-generated placeholder logo for the
  public product page;
- prepare store/README screenshots using synthetic content only, with useful
  alt text and phone/tablet examples where the listing supports them;
- update `CHANGELOG.md` and add v0.2.0 release notes;
- run the full clean-checkout release checklist;
- confirm CI on the Pull Request and again on `main`;
- create an annotated `v0.2.0` tag from the verified `main` commit;
- attach the exact verified build as
  `signal-repeat-remnote-v0.2.0.zip` to the GitHub Release;
- download the attached asset and re-verify its checksum and contents;
- install that downloaded artifact and perform the final real-device smoke test.

Suggested Issue title:

`release: enable mobile and publish v0.2.0`

## Definition of done

Mobile support is complete only when all of the following are true:

- the approved phone/tablet matrix is documented;
- touch-only users can reach the core repeat flow;
- the feature works in actual supported RemNote mobile clients;
- lifecycle behavior matches the specification;
- layouts pass phone, tablet, orientation, safe-area, long-text, and text-scaling
  checks;
- Web/Desktop behavior has no regression;
- no Rem content, rating, queue, or scheduling data is changed;
- no learning content is transmitted, persisted, or logged;
- typecheck, all tests, build, and CI pass;
- README and release documentation state mobile limitations accurately;
- `enableOnMobile` is enabled only in the verified release candidate;
- the published v0.2.0 asset is the same artifact that passed final testing.

## First prompt for the next chat

Use this prompt in the new chat:

> Read `AGENTS.md`, `Signal-Repeat-SPECIFICATION.md`, and
> `docs/mobile-v0.2-handoff.md` completely. Inspect the latest local and GitHub
> state, then begin Step 2 with a documentation-only Issue and Pull Request.
> Preserve all privacy, non-mutation, SDK-boundary, Mise, verification, and
> GitHub Flow requirements. Do not enable mobile in `main` before the real-device
> SDK spike and acceptance matrix pass.
