# Release

Signal Repeat follows Semantic Versioning. `package.json`, `package-lock.json`,
and `public/manifest.json` must describe the same release version.

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
   test -s PluginZip.zip
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
   `PluginZip.zip` produced from the tagged commit.
8. Download the attached archive, verify it is non-empty, and perform one final
   installation smoke test before publishing the plugin listing.

Do not create or move the tag after publication. If a release defect is found,
fix it on a new branch and publish a patch version.
