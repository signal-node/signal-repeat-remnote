# Development

Mise manages the Node.js runtime and repository tasks. Install the exact runtime
declared in `mise.toml`, then install dependencies from `package-lock.json`:

```sh
mise install
mise run setup
```

Start the local plugin server with:

```sh
mise run dev
```

Add `http://localhost:8080` as a development plugin in RemNote Web or Desktop.
Use only synthetic placeholder content during integration checks. The popup can
also be inspected without RemNote at:

```text
http://localhost:8080/?widgetName=popup&preview=release
```

## Verification

Before submitting a change, run:

```sh
mise run typecheck
mise run test
mise run build
test -s PluginZip.zip
```

Vitest runs in a Node environment. Tests belong under `tests/` and use the
`*.test.ts` or `*.test.tsx` naming convention. Run
`mise exec -- npm run test:watch` for an interactive watch session.

GitHub Actions runs on every pull request and push to `main`. It installs Mise,
uses the lockfile-backed setup task, then runs typecheck, test, build, and a
non-empty `PluginZip.zip` check in order. No CI secret or RemNote user data is
required.

The acceptance mapping and browser checklist are in
[`mvp-acceptance-checklist.md`](mvp-acceptance-checklist.md). Detailed SDK and
host observations are in
[`remnote-sdk-verification.md`](remnote-sdk-verification.md).
