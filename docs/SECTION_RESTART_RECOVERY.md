# Recovered section-restart checkpoint — November 17, 2026

The original `feat/section-page-number-restarts` branch and all six previously uncommitted source files were recovered from the original hosted workspace. This checkpoint preserves the original changes, not a reconstructed implementation. Its base is `c06b72862bbe601619a6d9da91ffc91e6ec8fad0` (documentation following the published PR #42 runtime). The source diff was checked for whitespace only. No test, build, browser, Office conversion or release verification has run for this checkpoint. It is incomplete and must not be merged or published as a finished feature.

## Preserved work

- `src/sections.mjs`: optional strict integer `pageStart` from 1 to 9999, schema attribute, native start parsing, and top-level/page-boundary validation.
- `app.mjs`: initial section start-number input and boundary synchronization.
- `src/pagination.mjs`: initial logical page counter and restart handling, separate from physical page indices.
- `src/odt.mjs`: initial native paragraph restart emission/import and consumed-restart bookkeeping.
- `src/docx-export.mjs`: initial native section page-number start output and validation.
- `src/docx-sections.mjs`: initial decimal start import, including first-section wrapping.

These are work in progress, not acceptance claims. Inspect the whole diff against the base before editing.

## Still unfinished

The next attempted tool call failed before executing. In particular, `src/odt-page-runs.mjs` was NOT updated and still refuses raw master-page restarts. No restart tests, independent Office control generator/manifest cases, browser scenario, help text or feature release documentation were added. The attempted Windows-status documentation cleanup also did not execute. The user subsequently explicitly removed Windows recovery from the task list; do not treat older deferred-repair wording as an active task.

Complete raw ODT run projection and safe fallback behavior; review native restart consumption, nested/continuous refusals, empty preview-page counting, first-page starts, inherited/hidden numbering, and continuing after sections. Add meaningful Node/browser/actual Office controls, including a hidden page restarted at 7 followed by visible 8. Preserve unsupported numbering styles, complex furniture/history and format/security bounds. Do not relax old guards or assertions merely to pass CI; replace only obsolete supported-case expectations with positive and negative coverage.

Use GitHub Actions for all routine tests, builds, browser/Office execution and publication checks. Work solo. Follow AGENTS.md and GITHUB_VERIFICATION.md. Optional skill defaults for local testing/Sites do not override these rules. Preserve originals, storage/database/session/backup compatibility, public/private hosting identities, fonts and mobile safe areas. No background watcher or physical-device gate.

## Continue in another checkout

Fetch `origin` and inspect local status first. The checkpoint is pushed on `feat/section-page-number-restarts`; its exact SHA is available from GitHub/Git. If another checkout has pending work or a conflicting branch, create a separate worktree from the remote branch instead of resetting or overwriting it. Do not force-push, clean, discard or silently stash changes. This recovery creates no PR, triggers no deployment and changes no runtime release.

## Continuation status

The checkpoint was fetched at `77328c38bd9577caa071ed520c6e0b31270a37c1` into a clean checkout. Raw projection, input validation, tests, browser coverage and independent Office controls are now authored; see [SECTION_RESTARTS.md](SECTION_RESTARTS.md). The recovery description above records the original checkpoint. No merge or publication is authorized for this continuation.
