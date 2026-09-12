# Release

Signal Repeat follows Semantic Versioning. `package.json`, `package-lock.json`,
and `public/manifest.json` must describe the same release version.

`mise run build` reads the version from `package.json` and writes
`signal-repeat-remnote-v<version>.zip`. Use
`mise exec -- npm run --silent archive-name` whenever a script or checklist
needs the exact current filename.

## v0.1.0 release candidate

1. Confirm every item in `docs/mvp-acceptance-checklist.md`, then review the
   Section 34 evidence in `docs/release-readiness-v0.1.0.md`.
2. From a clean checkout, run:

   ```sh
   mise install
   mise run setup
   mise run typecheck
   mise run test
   mise run build
   archive_name="$(mise exec -- npm run --silent archive-name)"
   test -s "$archive_name"
   unzip -t "$archive_name"
   ```

3. Load the candidate in RemNote and complete the browser smoke checklist with
   synthetic content. Do not paste learning content into logs or release notes.
4. Confirm CI succeeds on the release-preparation pull request and again after
   it reaches `main`.
5. Confirm the release version is `0.1.0` in the package, lockfile, and plugin
   manifest, and that `CHANGELOG.md` contains the matching entry.
6. Create the annotated tag from the verified `main` commit:

   ```sh
   git tag -a v0.1.0 -m "Signal Repeat v0.1.0"
   git push origin v0.1.0
   ```

7. Create GitHub Release **Signal Repeat v0.1.0** from that tag. Use
   `docs/release-notes-v0.1.0.md` as the notes and attach the exact
   versioned ZIP produced from the tagged commit.
8. Download the attached archive, verify it is non-empty, and perform one final
   installation smoke test before publishing the plugin listing.

Do not create or move the tag after publication. If a release defect is found,
fix it on a new branch and publish a patch version.

## v0.1.1 public-listing patch

1. Confirm `public/logo.svg` contains no scripts, event handlers, external
   references, embedded HTML, user content, or animation.
2. Confirm version `0.1.1` in `package.json`, `package-lock.json`, and
   `public/manifest.json`.
3. From a clean checkout, repeat the setup, typecheck, test, build, and ZIP
   integrity checks above.
4. Confirm `logo.svg` exists at the root of the versioned ZIP and visually verify
   the logo at small sizes on light and dark backgrounds.
5. Install the candidate ZIP in RemNote and repeat the synthetic-content Web and
   Desktop smoke tests.
6. Confirm CI on the release Pull Request and again after merge to `main`.
7. Create annotated tag `v0.1.1` from the verified `main` commit and publish the
   GitHub Release using `docs/release-notes-v0.1.1.md`.
8. Attach the generated `signal-repeat-remnote-v0.1.1.zip`, download it
   again, compare checksums, and install that downloaded asset before submitting
   the RemNote public listing.

## v0.1.2 RichText and multi-line safety patch

1. Confirm the RichText media and multi-line acceptance evidence in
   `docs/mvp-acceptance-checklist.md` and `docs/remnote-sdk-verification.md`.
2. Confirm version `0.1.2` in `package.json`, `package-lock.json`, and
   `public/manifest.json`.
3. From a clean checkout, repeat the setup, typecheck, test, build, and ZIP
   integrity checks above.
4. Install the candidate ZIP in RemNote Desktop and Web with synthetic content.
   Confirm that media URLs are not exposed as body text, media never autoplays,
   supported Set/backward answers are exact, and unsupported multi-line shapes
   stop with the fixed notification.
5. Confirm that the checks do not modify Rem content, ratings, schedules, or
   queue state and do not add learning-content logging, storage, or network
   calls.
6. Confirm CI on the release Pull Request and again after merge to `main`.
7. Create annotated tag `v0.1.2` from the verified `main` commit and publish the
   GitHub Release using `docs/release-notes-v0.1.2.md`.
8. Attach `signal-repeat-remnote-v0.1.2.zip`, download it again, compare
   checksums, and install that downloaded asset before replacing any pending
   RemNote public-listing submission.
