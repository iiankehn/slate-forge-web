# Slate Forge web — Codex handoff


## Active mandate — complete the whole roadmap

The user explicitly clarified that finishing selected batches is insufficient: continue all remaining roadmap work, with no routine approval questions and no final response at a release milestone. Work is on `feat/full-roadmap-completion`. The published runtime below is historical; current source is an unshipped checkpoint. See FULL_ROADMAP_PROGRESS.md. Never mark open features or physical/Word certification complete without implementation/evidence. Do not imply execution continues after a final response.


## Latest verified public release — native ODT sections

PR #5 is merged at `a5eea5fd0207eb5c678d963423b49faca438efd6`. [CI 41267909541](https://github.com/iiankehn/slate-forge-web/actions/runs/41267909541) and [Pages 41268357642](https://github.com/iiankehn/slate-forge-web/actions/runs/41268357642) both passed all 418 Node cases across 67 test files, production/static checks and 65 browser scenarios without retries. Pages deployed successfully. Live root matches canonical HTML; live app.js includes native ODT section handling and table-column declarations, and live help describes the supported ODT sections. Public URL: https://slate-web.iiankehn.com/ .

This release includes the earlier grouped native Word/mixed-paragraph, 250-page PDF/direct-navigation/preview-cache and tester-feedback updates. Native ODT text-section columns and supported orientation/plain furniture bindings now round trip, including table/list/image-first sections and page-break blocks. Nested ODT section export, continuous page-design changes, broad external-editor fidelity and the other unchecked roadmap features remain open. Physical-device/Word certification is not claimed; device QA remains deferred. All original private Site and storage/version identifiers remain unchanged.

Working tree should be clean on main after the release-evidence commit. Continue the remaining unchecked feature roadmap in coherent tested batches without unnecessary permission prompts. No source work or deployment is pending for these three completed batches.

## Previous verified public release — 250-page PDFs

PR #4 is merged at `b3e5fa78f35394c30a2bee473f6da52402fe83ec`. [CI 41266108348](https://github.com/iiankehn/slate-forge-web/actions/runs/41266108348) and [Pages 41266496688](https://github.com/iiankehn/slate-forge-web/actions/runs/41266496688) both passed all 66 Node test-file runners, production/static checks and 60 browser scenarios without retries. Pages published successfully; live root matches canonical HTML and live pdf-workspace.js contains direct page navigation/range validation. Public URL: https://slate-web.iiankehn.com/ .

PDF support now includes 250 pages, direct navigation and one prepared current-state preview reused across navigation/extraction. Edits, Undo/Redo and source changes invalidate it. Final-page fields, reordering, storage, actual downloaded PDF/ZIP and recovery regressions pass. See RELEASE_BATCH.md for timing evidence and earlier grouped Word release details. Physical-device testing remains deferred; larger byte limits and the other unchecked feature roadmap entries remain open.

The grouped Word batch is already published: PR #3 is merged at `3434632dc0539afd224f66e446c3d411a19f82f6`. [CI 41265333142](https://github.com/iiankehn/slate-forge-web/actions/runs/41265333142) passed all 65 Node test-file runners and all 55 browser scenarios without retries. [Pages 41265628185](https://github.com/iiankehn/slate-forge-web/actions/runs/41265628185) repeated the checks and deployed successfully. Live index matches canonical HTML; live app.js contains the new grouped import/export and help links to the public issue forms. The alternate-content regression also passes.

The remaining unchecked layout/format/PDF features are unfinished. Do not claim full-roadmap completion or physical-device/Word certification. Continue coherent feature batches without unnecessary permission prompts. All storage identifiers and original private Site hosting remain unchanged.

## Verified public release — 2026-11-01

PR #2 is merged at `737df79385297c4da7a29d128fde191997606e5a`. [Release CI 41258202228](https://github.com/iiankehn/slate-forge-web/actions/runs/41258202228) passed all 65 Node test-file runners, production/static checks and 55 browser scenarios without retries. [Pages deployment 41258638452](https://github.com/iiankehn/slate-forge-web/actions/runs/41258638452) repeated release checks and published successfully. The live custom-domain index matches canonical HTML; app.js exposes the new native Word controls and pdf-workspace.js exposes existing-text editing and incremental signing. Public URL: https://slate-web.iiankehn.com/ .

The completed batch includes note continuations, custom image contours, compatible continuous columns with objects, rewritten/cross-wrapper comparison, native Word objects, bounded PDF text replacement, incremental signatures and generated PDF script/bidirectional shaping. CI uses the pinned matching Playwright container and aligns profile-directory ownership for Firefox. The full remaining roadmap is still open; device QA remains deferred by the user. This section supersedes older unpublished/private release descriptions below. The original private Site and all storage identifiers are unchanged.

## Current continuation — public host and resumed feature roadmap

Public beta host: https://slate-web.iiankehn.com/ . Pages workflow deployment 41244967161 succeeded; live index/app.js/help.html returned HTTP 200 and index matched the build. Repository is public, Pages uses workflow source, custom domain/HTTPS are configured. The older private Sites identity is preserved separately. Historical paragraphs below describing unpublished/private GitHub status are superseded by this section.

Incremental signing is implemented in signPDFIncremental: append-only PDF objects/xref preserve the prior byte prefix and signatures, with DocMDP/FieldMDP guards and a 20-signature-field limit. The PDF tools expose this separately from ordinary final signing. No trusted timestamp, revocation or LTV claims. Runtime d315388 passed all 40 browser scenarios in run 41249152046 and all 64 Node test-file runners; the incremental-signature extension requires its own final CI evidence.

Supported existing PDF text replacement is implemented in pdf-text-edit.mjs and exposed in PDF tools. It rewrites source text operators for standard unembedded Latin Type1 fonts and ASCII strings only, preserving original input bytes. State uses validated textEdits records bound to page/stream/range/original text, persists through journals/ZIP/recovery and is applied before other PDF edits. It is not redaction or general PDF text/font layout editing. Do not weaken source/font matching or signed/XFA guards.

Native Word objects are also implemented as an opt-in DOCX export mode, with supported DrawingML import reconstruction. Native mode omits original scene metadata/hidden objects and reads actual Word edits on reimport. Unsupported modes are explicit; the old exact-scene/preview path remains the default. OCR initialization now disables controls until saved-draft restoration and handler binding finish, fixing the early-selection race seen in Firefox CI.

User now wants remaining feature implementation; physical-device testing is explicitly deferred. The first resumed batch adds split page-bottom notes, custom polygon contours and rewritten/cross-wrapper comparison matching. Notes remain single unchanged source nodes; only displayed fragments are split, with bounded note-space and page counts. Contours accept 3–32 bounded numeric points and export the same clipped raster; left/right paragraph wrapping remains, arbitrary coordinates/two-sided exclusions remain open. Rewritten matching uses bounded mutual-best word overlap, not semantic inference; repeated/weak/equally scored matches stay unresolved. See the final release-batch section for current validation.

Verified release runtime: commit `338be73`; [GitHub CI run 41241670375](https://github.com/iiankehn/slate-forge-web/actions/runs/41241670375) passed all 61 Node test-file runners, production/static checks and all 20 browser scenarios across desktop Chromium/Firefox/WebKit and phone Chromium/WebKit. Actual downloaded-file restoration and offline French OCR passed. Physical-device/manual gates remain open; no public deployment is claimed.

## Current release priority

The user narrowed the immediate goal to a usable first public beta, then iteration. Follow [PUBLIC_BETA.md](PUBLIC_BETA.md) for release scope and [GITHUB_PAGES.md](GITHUB_PAGES.md) for static hosting; advanced roadmap items below remain later work. Node/npm are build-time tools, not a hosting server requirement. Release preparation adds a getting-started guide, startup help, project-relative PWA URLs, scoped offline caches and automated browser CI. Browser CI results and publication must be verified separately; the private Site is unchanged.


## Project and baseline

GitHub destination: iiankehn/slate-forge-web, private. This is a migration of the existing web application, not either Android repository. Source baseline is Sites commit 3e8348a9734ee1195c661ed997f98af7c79a1107. All 313 automated tests, production build and source whitespace checks passed for that baseline. Migration instructions/docs do not change runtime behavior.

Existing live Site: https://document-studio-iian.iiankehn.chatgpt.site
Site project ID: appgprj_6ae296f07e4881918b653497e03232d7
Last verified deployment: appgdep_6ae53f65f42c81918c33ef451d8e1892
Saved version: appgprj_6ae296f07e4881918b653497e03232d7~appgver_a0632476eb408191a8851b7637b0560b

The existing Site remains the live host. GitHub development and publication are separate until a supported integration is configured. Do not change audience or origin. User documents live in browser device storage and are not part of this repository; moving code does not move document data.

## Architecture and commands

Plain JavaScript ES modules with a Tiptap/ProseMirror rich-text editor. app.mjs integrates menus, workspace state and dialogs; src/ holds editor extensions, import/export, layout/pagination, local storage/recovery, PDF, OCR and canvas models. test/ contains Node and JSDOM/fake-indexeddb tests. Production builds use esbuild. dist/index.html is retained source, and dist/ includes generated production assets and local PDF/OCR components. npm ci; npm test; npm run build. Dependencies are pinned by package-lock.json. OCR has ten local Tesseract language models. PDF uses PDF.js/pdf-lib, optional embedded local fonts, node-forge for RSA certificate signing, and a pinned @cantoo/pdf-lib AES-256 security adapter. The adapter explicitly encrypts standalone/dictionary strings, which the pinned non-object-stream writer otherwise leaves plaintext; preserve the field-recovery and plaintext-exposure regressions. Signed PDFs are view/export-only. Unlocked PDFs require an explicit device-storage choice; passwords/certificates are not retained. No paid service or application account is required.

Settings retain White/Colored/Grey/Dark/System themes, independent accents and screen-only dark paper. Desktop menus and mobile hamburger share a catalog; command search is Ctrl/Cmd+K. Ordinary IndexedDB autosave is independent of encrypted recovery. Workspace tokens provide local namespacing, not account identity. End-session tombstones and optimistic revisions prevent late writers from resurrecting ended work. Preserve document-studio identifiers for compatibility.

Existing capabilities and limitations are recorded in docs/ROADMAP.md and docs/RELEASE_READINESS.md; docs/RELEASE_BATCH.md is chronological release evidence, so its final sections supersede older limitations. docs/DEVICE_QA.md lists physical checks. Latest GitHub batch adds globally unique exact-content moves between compared containers, including swaps, with retained formatting checks. Sibling moves and shared-text formatting in edited paragraphs remain supported; rewritten moves, moves into/out of unmatched whole containers and ambiguous repeated matching remain incomplete. GitHub changes have not been deployed to the existing live Site. The full app supports rich text/review/comments, DOCX/ODT/HTML/JSON/ZIP/encrypted exports, editable canvases, PDF forms/ink, local OCR drafts, backups/recovery and 200-document local workspaces.

## Important boundaries

Source image inputs allow up to 1 GB but native decoding and an 80 MP cap still apply; embedded images are optimized. DOCX input allows 20 MB with expanded-archive bounds. PDF capacity/backup byte limits remain bounded; see source/docs. Do not raise a cap and claim device validation without evidence. DOCX custom XML retains editable Slate Forge canvas scenes, including hidden layers/uncropped images when enabled; other word processors see image previews rather than native editable shapes.

Latest GitHub development also includes overlapping/point comments, wrapped paragraph tails, multilingual OCR, embedded PDF fonts, password protection/unlock and single-certificate final PDF signatures. These changes are not deployed to the live Site.

Native Word drawing objects, free page-coordinate images with surrounding text, arbitrary/two-sided wrap, complex live sections/pagination and oversized/split footnotes, fine-grained/native-DOCX structural revision interoperability, advanced format fidelity and larger PDF capacity remain open. Local structural/object changes now use protected deleted/inserted top-level block groups with HTML/device persistence and review decisions. Keep the guard against treating editor-generated trailing paragraphs as new revisions. DOCX/ODT require structural decisions first, and old builds do not understand blockRevision metadata. Provider sign-in, cloud collaboration and separate notes/coding apps are deferred scope, not required for the account-free release.

## Continuing work

Read the current roadmap; select a coherent, substantial batch and finish implementation, tests, build, documentation and reviewable commits/PRs. The user dislikes repeated tiny handoffs and unnecessary confirmation. Do not claim the entire roadmap or production certification merely because tests pass. Physical Safari/iPhone/iPad, Android 12+ Chrome, desktop browsers, accessibility/IME/stylus, real storage eviction/quota and installed PWA/download/print checks are still open. Target generic Android 12+, not a particular device.

Prior reusable startup/release/storage skills were installed in the original Work environment; their installed availability is environment-specific. Their essential checks are represented by AGENTS.md and the repository docs. Do not depend on absolute paths to those skills or original Sites helper scripts in another environment.

## GitHub source packaging

The GitHub repository tracks all editable source, tests, canonical HTML/CSS/PWA manifest/icons and documentation. Reproducible generated JavaScript chunks, service worker, license notices and npm-provided PDF/OCR vendor bundles are ignored; npm ci followed by npm run build regenerates them. The original complete Sites history remains in its original source repository; the GitHub import starts a new history with this recorded baseline.

Page-bottom notes are an optional notePlacement layout value (page/end), defaulting to end for older documents. Supported live pages and measured print preview reserve note space per reference page; live reservations are monotonic to prevent oscillation and can leave extra whitespace. At most 500 references and existing page caps apply. Temporary page-note DOM is excluded from stored content, and leaving paged mode restores the original accessible endnotes list. Split notes/complex sections and physical rendering/accessibility remain open.
