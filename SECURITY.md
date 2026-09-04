# Security policy

## Supported versions

Signal Repeat is under initial development and has no supported public release.
Security fixes are applied to the latest revision of `main`. This section will
be updated when version `0.1.0` is released.

## Reporting a vulnerability

Use GitHub's private vulnerability reporting for this repository when it is
available. If private reporting is unavailable, contact the repository owner
privately before sharing technical details.

Do not include real RemNote content, selected text, flashcard answers, access
tokens, or other personal data in a public issue. Use synthetic examples when
describing reproduction steps.

Security-sensitive behavior includes:

- transmitting RemNote content outside the plugin environment;
- logging or persisting learning content unexpectedly;
- rendering untrusted content as executable HTML;
- requesting permissions beyond the documented plugin requirements;
- changing Rem content, card ratings, queue state, or scheduling data.

## Design expectations

Signal Repeat processes learning content locally. Render learning content as
ordinary React text and do not use `dangerouslySetInnerHTML`. Do not add an
external network dependency without an explicit specification change and a
security review.
