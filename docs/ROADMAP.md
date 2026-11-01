# Slate Forge — locked feature scope

This is the active feature roadmap approved by the user. It replaces older broad checklists and backlog snapshots. Work only within the eight areas below; do not add features or turn deferred verification into feature requirements. Implementation details may be broken down under their existing area without expanding its scope.

Target: complete feature implementation by end of day if possible. This is a best-effort target, not a completion guarantee. Do not claim completion or remove an outstanding requirement to meet the target.

## Remaining feature work

| Area | Completion scope |
| --- | --- |
| 1. Image placement and wrapping | Free page positioning, two-sided text flow, page exclusions, nested images, images beside tables, and wrapping through page breaks. |
| 2. Pagination and sections | Mixed orientations/columns in live editing; remaining nested-section, keep-rule, widow/orphan and footnote cases; better editor/preview/Word consistency. |
| 3. DOCX/ODT fidelity | Unsupported complex layouts, styles, fields, master pages, drawing effects and typography cases across editors. |
| 4. Structural review | Nested suggestions, partially revised Word table rows, and paragraph split/join revisions. |
| 5. PDF editing | Reflow that moves subsequent content, remaining unmapped-font and vertical-text cases, and broader script/font handling. |
| 6. XFA forms | Scripts, calculations and submissions remain. Bound pure-XFA multiple-selection controls are implemented in source; unbound/conflicting data bindings remain unsupported. |
| 7. PDF signature permissions | Broader certified-document workflows involving earlier form filling, annotations and appearance changes. |
| 8. Signature longevity | Revocation checks through OCSP/CRLs, DSS/LTV evidence, and document/archive timestamps. |

## Current work rules

- Feature development only. Do not run tests, builds, validation, audits, browser/device checks or CI during this phase.
- Use `[skip ci]` on commits pushed to the implementation branch.
- Do not merge, deploy or describe untested source as verified or published.
- Preserve existing work, local-first/account-free behavior, storage identifiers, file-format compatibility and the original private Site identity.
- Existing comparison, font, contents-table, review, PDF, XFA-field and signature-timestamp implementations are source work already done; their later verification is not implementation from scratch.
- No routine permission questions. Do not add cloud services, separate applications or other product scope.

## Deferred release phase

After feature implementation, the previously discussed release work is auditing/testing/building accumulated changes, browser/PWA/storage/accessibility/print/Word verification, fixing resulting issues, and publication. None of those checks are authorized to run during the current feature-only phase.

Historical roadmap descriptions and completed features remain available in Git history. Current implementation notes are in CODEX_HANDOFF.md; they do not expand this locked scope.
