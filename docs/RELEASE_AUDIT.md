# Accumulated implementation release audit

The user requested an audit and publication of the existing implementation, ending the feature-only phase. This release does not finish or expand the eight-area roadmap. The audit covers the accumulated changes from main `897f873` through the feature implementation at `b411f18`, plus the release-blocker corrections described below.

## Readiness decision

Public beta for everyday local writing, saving, backup and supported import/export is the intended release level, conditional on passing the release workflow. Advanced layout, review interoperability, PDF editing, XFA and signing remain bounded beta capabilities. A passing automated suite does not establish universal document compatibility, physical-device reliability or legal signature acceptance. Keep originals and export complete workspace backups; ordinary device storage can be cleared or evicted.

## Audit findings and corrections

The first full run had 431 passes and 19 failures. Several assertions described old refusals or old normalization defaults; those were updated to verify the new supported behavior. Actual defects fixed:

- CMS parsing referenced a nonexistent node-forge validator, breaking additional-signature and timestamp paths. It now uses the schema exposed by the pinned dependency.
- Opening signature fields without widgets attempted to read nonexistent rectangles, interrupting PDF initialization and saved-file listing. Such fields are displayed without editable geometry.
- Turning tracking off allowed removal of pending structural metadata. Pending suggestions now require explicit decisions before their metadata can be removed.
- Unsupported PDF inline-image streams could leak partial text-edit candidates. Failed scans now discard candidates from that stream or nested form.
- Read-only XFA files without edits can export their original bytes without attempting a field rewrite.
- New signing identities are bounded to RSA keys of 2,048–8,192 bits. Public help now describes current capabilities and limits.

Additional regressions cover XFA dependency convergence, protected/calculated fields, unsafe scripts, multi-selection values, explicit credential-free submissions, DOCX snapshot sanitization and stale-package refusal, certification/field-lock policies, signature tampering, timestamp request binding and denied responses. The browser suite includes page-positioned image reload, preview and actual source download.

## Scope assessment

| Existing roadmap area | Release boundary |
| --- | --- |
| Images and wrapping | Page coordinates, ordinary floats and supported two-sided exclusions are available. Complex nested/table/break interactions can fall back or differ between layouts. |
| Pagination and sections | Live/preview pagination and supported orientations/columns are available. Complex nesting, keeps, widow/orphan and footnote consistency remain incomplete. |
| DOCX/ODT fidelity | Supported native styles, sections and drawings are available. Exact cross-editor layout and broad effect/typography fidelity are not guaranteed. |
| Structural review | Nested editor suggestions and supported row/boundary changes are available. DOCX retains the full Slate Forge tree with an outer native Word review layer; native Word hierarchy fidelity remains incomplete. |
| PDF editing | Supported Unicode-mapped text and local-font replacement work in place. General content reflow, vertical text and unmapped fonts remain incomplete. Replacement is not secure redaction. |
| XFA | Bound fields, multi-selection, limited interpreted calculations and reviewed submissions are available. Unsupported bindings/scripts are refused; delivery depends on destination/CORS. |
| Signature permissions | Supported RSA integrity, certification, empty slots and field locks are available. Earlier form/annotation/appearance changes can require an external reader. Certificate trust and revocation are not established for ordinary signatures. |
| Signature longevity | RFC 3161 request/response attachment uses selected trust anchors. OCSP/CRL, DSS/LTV and document/archive timestamps remain unfinished. No independent real-authority interoperability certification is claimed. |

Optional semantic comparison uses packaged local models and does not upload document text. Existing local-first/account-free behavior, private Site identity and legacy storage identifiers are preserved. Browser automation is performed by GitHub Actions; no local browser workaround is used for the workspace policy restriction.

## Evidence and publication

Local baseline after corrections: all 450 existing tests pass; new focused regressions pass separately. Production build and static packaging checks pass (260 files, 83.7 MiB); the production dependency audit reports zero known vulnerabilities. The release workflow must repeat the full suite, build, static checks and browser scenarios on the release commit before merge. The Pages workflow repeats these checks on main before publishing. Final run links and deployed revision will be recorded after publication.

Physical devices, IME/assistive technology, actual storage eviction, printer output and Microsoft Word/other external-reader interoperability remain unverified. These are limits of the assessment, not newly added roadmap features. No claim of completed roadmap or comprehensive production certification is made.
