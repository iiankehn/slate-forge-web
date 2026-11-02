# Accumulated implementation release audit

The user requested an audit and publication of the existing implementation, ending the feature-only phase. This release does not finish or expand the eight-area roadmap. The audit covers the accumulated changes from main `897f873` through the feature implementation at `b411f18`, plus the release-blocker corrections described below.

## Readiness decision

The published release is suitable for everyday local writing, saving, backup and supported import/export as a public beta. The required release and deployment checks passed. Advanced layout, review interoperability, PDF editing, XFA and signing remain bounded beta capabilities. A passing automated suite does not establish universal document compatibility, physical-device reliability or legal signature acceptance. Keep originals and export complete workspace backups; ordinary device storage can be cleared or evicted.

## Audit findings and corrections

The first full run had 431 passes and 19 failures. Several assertions described old refusals or old normalization defaults; those were updated to verify the new supported behavior. Actual defects fixed:

- CMS parsing referenced a nonexistent node-forge validator, breaking additional-signature and timestamp paths. It now uses the schema exposed by the pinned dependency.
- Opening signature fields without widgets attempted to read nonexistent rectangles, interrupting PDF initialization and saved-file listing. Such fields are displayed without editable geometry.
- Turning tracking off allowed removal of pending structural metadata. Pending suggestions now require explicit decisions before their metadata can be removed.
- Unsupported PDF inline-image streams could leak partial text-edit candidates. Failed scans now discard candidates from that stream or nested form.
- Read-only XFA files without edits can export their original bytes without attempting a field rewrite.
- New signing identities are bounded to RSA keys of 2,048–8,192 bits. Public help now describes current capabilities and limits.

Additional regressions cover XFA dependency convergence, protected/calculated fields, unsafe scripts, multi-selection values, explicit credential-free submissions, DOCX snapshot sanitization and stale-package refusal, certification/field-lock policies, signature tampering, timestamp request binding and denied responses. The browser suite includes page-positioned image reload, preview and actual source download.

Browser CI also exposed and prompted fixes for three integration defects: image node views accessed Tiptap before mounting (blocking image-containing imports); the offline URL allowlist omitted new semantic assets; and incremental signing reused object-stream/cross-reference container numbers discarded by pdf-lib, which strict PDF readers could not resolve. Signing now reserves all parsed indirect-object numbers. CI stops after the first persistent browser failure to make failures reviewable sooner.

An independent ephemeral OpenSSL RFC 3161 responder generated and verified a matching response; the app attached it, retained signature integrity and recognized the attached timestamp. This is a local interoperability check, not certification by a public TSA.

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

Published revision: `c0400862e45b9be412a49244e6c2062fd18a4530` from [PR #6](https://github.com/iiankehn/slate-forge-web/pull/6). Public site: https://slate-web.iiankehn.com/ .

- [PR CI 41391321090](https://github.com/iiankehn/slate-forge-web/actions/runs/41391321090): 459 Node tests, production/static checks and all 75 browser scenarios passed without retries.
- [Main CI 41391911123](https://github.com/iiankehn/slate-forge-web/actions/runs/41391911123): passed on the merged revision.
- [Pages 41391915460](https://github.com/iiankehn/slate-forge-web/actions/runs/41391915460): repeated all 459 tests and 75 browser scenarios without retries, then deployed successfully.
- Production packaging: 260 files, 83.7 MiB. Production dependency audit: zero known vulnerabilities. Source whitespace checks pass.
- Live HTML, app/PDF scripts, styles, help and PDF worker return HTTP 200 and match the audited runtime bytes. The service-worker code and asset lists match exactly; its cache version recomputes correctly with the CI platform-specific package notices (`bb5775eec6f8ef76`).
- Independent ephemeral OpenSSL timestamp response generation/verification, attachment to the latest of two signatures and subsequent integrity checks passed; pdfinfo opens the final file successfully.

The 75 browser scenarios cover the 15 checked workflows across desktop Chromium/Firefox/WebKit and phone Chromium/WebKit emulation, including actual downloads, backup restoration, offline OCR, image layout, native document round trips and signed-PDF export. XFA rendering/dataset export and semantic inference did not receive full browser round-trip coverage in this audit; their source/package review and focused model/interpreter tests do not establish universal compatibility.

Physical devices, IME/assistive technology, actual storage eviction, printer output and Microsoft Word/other external-reader interoperability remain unverified. These are limits of the assessment, not newly added roadmap features. No claim of completed roadmap or comprehensive production certification is made.
