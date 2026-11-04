# Slate Forge — completed essential-product release

Word/ODT continuation (2026-11-04): original-canvas retention for ODT is implemented in the current development batch; see ODT_EDITABLE_CANVASES.md. Other editors show previews; native ODF objects and formatting/structural revisions remain separate limits. Preserve the user-confirmed mobile safe-area fix. Release evidence is pending.

## User-reported mobile stability correction

- [x] Restore safe-area protection for the document header after redesign padding overrides.
- [x] Keep fullscreen Workspace scrolling, onboarding and tour controls inside protected regions.
- [x] Add five-configuration simulated inset geometry checks and review portrait/landscape captures.
- [x] Publish verified source and reconcile live stylesheet/worker assets.

[MOBILE_SAFE_AREAS.md](MOBILE_SAFE_AREAS.md) records evidence. The user confirmed the reported header clipping is fixed on the affected device (2026-11-04). Broader device QA retains its separate status.

## Requested advanced compatibility follow-on

The next requested batch is now published; [ODT_TEXT_REVISIONS.md](ODT_TEXT_REVISIONS.md) records its evidence and bounds.

- [x] Native inline ODT insertion/deletion round trips with metadata and supported deleted-text styling.
- [x] Recording on/off preservation and grouped accept/reject, undo and save/reload behavior.
- [x] ODT → native DOCX → ODT converter coverage and actual downloaded-file browser decisions.
- [x] Reproduce/fix long-ID decision collisions; validate and publish corrected source.

Complex native formatting/structural revisions and editable ODF canvases are not completed by this text-revision batch. Earlier comments/canvas evidence below remains historical.

The user subsequently reopened advanced features and selected Word/ODT compatibility on 2026-11-03. [ODT_COMPATIBILITY.md](ODT_COMPATIBILITY.md) records the first batch: native ODT comments, canvas preview export and image-description import correction. The completed essential-product checklist below remains release history.

- [x] Native ODT text comments, overlapping ranges and cursor anchors.
- [x] Canvas preview export with an explicit editable-original warning.
- [x] External ODF namespace aliases and image-description correction.
- [x] Reproduce/fix the CI server cleanup race, validate and publish the compatibility batch.

Published evidence and remaining compatibility boundaries are recorded in ODT_COMPATIBILITY.md. This batch does not claim universal Word/ODT fidelity.

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

Post-release review (2026-11-03): the user reaffirmed this focused scope. [POST_RELEASE_REVIEW.md](POST_RELEASE_REVIEW.md) distinguishes already-covered limitations from remaining manual verification and gives acceptance evidence. Advanced limitations are not reopened as feature requirements.
