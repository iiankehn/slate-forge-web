# Slate Forge remaining roadmap

## Current implementation priority

The public beta is deployed at https://slate-web.iiankehn.com/ through GitHub Pages ([latest verified deployment 41266496688](https://github.com/iiankehn/slate-forge-web/actions/runs/41266496688)). The user has now authorized continuing the remaining feature roadmap; physical-device testing is explicitly deferred from current work. Keep those verification items open without treating them as feature-work blockers. Cloud services and separate applications remain deferred products. Existing private Sites hosting and document-studio storage identifiers remain unchanged.

## Storage and recovery
- [x] Encrypted complete workspace backup export/import, including PDFs and edits. AES-256-GCM with random salt/nonce, PBKDF2-SHA256, authenticated header; password not persisted. Automated round trip, wrong-password and tampering tests pass.
- [x] Automatic encrypted device recovery including PDF originals and edits; legacy copies remain readable.
- [x] Durable PDF journal before committed writes; reopened failed drafts appear as separate recovery copies. Closure before the journal transaction completes remains a browser limitation.
- [x] 200-document workspaces across creation, restore, backups and recovery, with bounded library rendering and cached body indexes.
- [x] Reduced tab-cache fallback, storage-capacity diagnostics and simulated quota-abort/retry validation.
- [ ] Real-device large-workspace performance, actual quota pressure and browser/OS eviction validation.

## Layout and design
- [ ] Free page coordinates for images with automatic surrounding text flow.
- [x] Oval/diamond image masks with contour wrapping for paragraph-anchored floats.
- [x] Custom polygon image masks and one-sided contour wrapping for paragraph-anchored floats; bounded point editing and shaped raster export.
- [ ] Two-sided wrapping, page-coordinate exclusions and objects outside canvas blocks.
- [ ] Mixed orientations/columns in live pagination.
- [ ] Nested images, images beside tables and wrapping across page breaks.
- [x] Split supported top-level wrapped paragraphs after the float ends; the wrapped prefix stays with its image.
- [ ] Split text through an active float, nested wraps and arbitrary wrap/page-break interactions.
- [x] Paragraph keep-together, keep-with-next and page-break-before controls in HTML/DOCX and supported paginated blocks.
- [x] Two-line widow/orphan balancing for supported ordinary text in live pages and preview, with a persisted paragraph opt-out and DOCX round trip.
- [ ] Full widow/orphan balancing across nested layouts/columns/complex typography and nested-layout keep-rule parity.
- [x] Optional page-bottom notes in supported paged editing and measured print preview, with bounded reservations and preserved endnote defaults.
- [x] Page-bottom note continuations across live/preview pages, preserving literal text, reference identity and source notes without scaling.
- [ ] Complex-section/nested note parity and physical-reader/rendering certification.
- [x] Compatible continuous one-column and plain-text column sections can share preview pages.
- [x] Compatible continuous columns with fitting tables/images/canvases and bounded object-aware text fragmentation in measured preview.
- [ ] Continuous sections with geometry/furniture changes, nested sections and full nested keep-rule parity; live mixed-section pagination remains open.
- [ ] Editor/preview/Word pagination consistency.

## Formats and review
- [x] DOCX import of supported fonts/sizes, alignment/indentation, blank paragraphs, paper settings, native text revisions and comment ranges.
- [x] Supported DOCX inherited run/paragraph styles and explicit RGB colors.
- [x] Live contents import for standard body-level Word contents controls with Heading 1–3 ranges.
- [x] Supported DOCX theme Latin fonts/colors, tint/shade resolution, default styles and partial font/spacing/indent inheritance.
- [x] DOCX import of supported paragraph spacing and keep/new-page rules for ordinary paragraphs and headings.
- [x] Overlapping comment ranges and point comments in HTML/device state and native DOCX, with independent editing/removal.
- [ ] Exact DOCX layout, unsupported/script-specific theme fonts, complex style semantics and other contents-field forms.
- [x] Editable Slate Forge canvas data across DOCX export/reopen, with validated preview binding and an image-only export choice.
- [x] Opt-in native Word canvas shapes/text-box export and supported DrawingML reconstruction on import, reading edited Word text rather than stale original metadata.
- [x] Supported nested native Word groups with translation, scale and rotation; mixed text/drawing paragraphs retain text order. Adjacent canvas groups survive native export/reopen.
- [ ] Broad cross-editor object fidelity, skewed/mirrored text groups, advanced effects, pressure-varying native paths and full typography parity.
- [x] ODT content import/export for text, lists, ordinary tables, images and notes.
- [x] ODT export/import of horizontal and vertical table spans with covered cells.
- [x] Bounded ODT repeated-row/cell expansion.
- [x] Supported ODT named/default style inheritance, fonts/colors/highlights, paragraph design, nested list types and supported starts.
- [x] ODT A4/Letter page design, supported margins, orientation, default typography and simple header/footer/page-number round trips.
- [ ] Advanced ODT layout/styles, complex master pages/fields and broad external-editor fidelity.
- [ ] Microsoft Word round-trip certification.
- [x] Supported inline and paragraph formatting revisions, individual/bulk decisions, Undo, HTML/device persistence and native DOCX properties revisions.
- [x] Text revisions and comments in code blocks; code menu/style controls and native DOCX line-break/tab handling.
- [x] Grouped structural/object edits and paragraph-type conversions, retaining original top-level blocks for individual/bulk decisions and Undo through HTML/device state.
- [ ] Fine-grained nested/move-specific structural decisions and native DOCX structural-revision interoperability.
- [x] Confirmed Find/Replace through unresolved revisions: accept complete affected changes, then replace in one undoable operation.
- [x] Accept all / Reject all text changes with confirmation and one-step undo.
- [x] Highlighted text comparison plus bounded formatting, structure, object and page-design difference reports.
- [x] Exact-content move matching within parents, insertion-resistant structural reports and inline formatting comparison on shared text inside edited blocks.
- [x] Globally unique exact-content moves between compared containers, including swaps and retained formatting checks.
- [x] Exact-content moves into/out of unmatched whole containers and bounded, mutual-best lexical matching of rewritten paragraphs, including unequal replacement gaps.
- [ ] Semantic matching beyond shared wording and disambiguation of repeated/equally similar replacement or moved blocks.
- [x] Placeholder checks covering notes and canvas text, with navigation to the owning editor.

## PDF, OCR and drawing
- [x] AES-256 password-protected PDF export and explicit unlock-to-device-copy import, without retaining passwords.
- [x] In-place replacement of supported simple existing PDF text (unembedded standard Latin Type1 fonts, printable ASCII, direct page content text operators), with Undo/Redo and backup/recovery persistence.
- [ ] General PDF text/font editing, embedded/subset/complex text, automatic text reflow and XFA.
- [x] International PDF annotation/form appearances using an embedded local TTF/OTF with glyph-coverage checks.
- [x] Bidirectional/script-run ordering and explicit fontkit glyph advances/offsets for generated PDF annotation/form appearances, with embedded local fonts and preserved logical field values.
- [ ] Broad script/font coverage, paragraph-level typography controls and cross-reader font/render certification.
- [x] Numeric geometry editing for supported imported PDF widgets; readonly/unsupported fields remain protected.
- [x] Final PDF export with one detached SHA-256/RSA PKCS#12 certificate signature; signed inputs are view/export-only.
- [x] Append additional detached RSA/SHA-256 signatures as incremental revisions while preserving and cryptographically testing earlier signed byte ranges; certified/locked-field policies are refused.
- [ ] Trusted timestamps, revocation, long-term signature validation and certified/locked-field permission-policy support.
- [x] 250-page PDFs with direct page navigation and a bounded current-state preview cache; last-page editing/export/ZIP/recovery regressions.
- [ ] Larger PDF byte limits and real-device memory/storage-pressure validation.
- [x] PDF page-range OCR using the local English engine.
- [x] Local Arabic, simplified Chinese, French, German, Italian, Japanese, Portuguese, Russian and Spanish OCR, optionally combined with English.
- [x] Persistent workspace-scoped OCR correction text; End session removes it.
- [x] Persist source scans and crop/rotation/page settings with correction drafts.
- [x] Include saved OCR scans/settings/corrections in ZIP, encrypted backups and encrypted recovery.
- [x] Pressure-sensitive canvas pen strokes with compatible fixed-width mouse/touch fallback.
- [ ] Physical stylus QA.

## Release verification
- [x] Actual downloaded HTML, complete ZIP/PDF state and encrypted backups reimported across five CI browser configurations.
- [x] Browser-exported PDF form fields parsed and checked; physical print/PDF visual inspection remains open.
- [ ] Physical iPhone/iPad Safari, Android 12+ Chrome, desktop Chrome/Firefox/Safari.
- [ ] Virtual/hardware keyboards, IME, rotation/safe areas and screen readers.
- [ ] Real persistent-storage permission paths.
- [ ] Installed PWA offline PDF/OCR and service-worker updates.
- [ ] Native sharing, file associations and installed shortcuts.
- [ ] Eviction, suspended/restored/competing tabs and long-document/table performance.
- [x] Supported GitHub Actions browser infrastructure across Chromium, Firefox and WebKit; physical devices remain separate.

## Deferred product scope
- [ ] Provider sign-in, cloud storage/sync, collaboration/permissions.
- [ ] Separate notes and coding applications.

These deferred products are not requirements for the current account-free word processor release.
