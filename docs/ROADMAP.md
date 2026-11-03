# Slate Forge — completed essential-product release

The latest user direction replaces the former eight-area feature-completion mandate. [PRODUCT_FOCUS.md](PRODUCT_FOCUS.md) records which advanced areas to keep, bound or stop. The previous feature roadmap is preserved in Git history; it is not an expanding backlog for this release.

- [x] A distinct ribbon with grouped everyday commands.
- [x] A Workspace start/backstage screen for documents, templates, opening, print, preferences and local session management.
- [x] First-visit setup cards and a skippable/replayable tour.
- [x] More light and dark palettes, preserving preferences and document colors.
- [x] Sans-serif interface and new-document defaults, preserving existing font choices.
- [x] Stability, accessibility and UX regressions, including saving/reload, backups, offline use, Workspace discovery and keyboard/focus behavior.
- [x] Correct the reproducible reload-ownership and delayed-focus defects; reject flaky browser checks in CI.
- [x] Publish the verified release to the existing public GitHub Pages host and verify live assets.
- [x] Explicit follow-on requested 2026-11-03: silent automatic updates on launch/return, with local-save protection and offline fallback.
- [x] Explicit follow-on requested 2026-11-03: incorporate the supplied Brand Kit in app identity, browser favicons and install icons.

The current release passes 477 Node tests and 100 browser scenarios without retries in main CI and Pages. [Automatic updates](AUTOMATIC_UPDATES.md) and [branding integration](BRANDING.md) record the explicitly requested follow-ons. [UX_STABILITY.md](UX_STABILITY.md) records exact runs, historical retry outcomes and verification limits. The historical Firefox discovery failure did not recur in the strengthened checks; its original cause remains unproven. Any recurrence is a regression to investigate, not a new feature item.

This release roadmap is complete. No further feature work is authorized by it. Preserve local saving, backup compatibility, the public host and the separate private Site identity. Future accounts and broader advanced compatibility require a separate user decision.
