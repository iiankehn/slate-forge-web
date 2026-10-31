# Slate Forge remaining roadmap

User authorized completion of the remaining roadmap on 2026-10-29. This checklist is the continuation record. Completion requires implementation and appropriate evidence; physical checks cannot be marked complete using DOM stubs. Account/cloud work and separate applications require product scope decisions before introducing services or changing the current private audience.

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
- [ ] Two-sided and arbitrary-shape wrapping; objects outside canvas blocks.
- [ ] Mixed orientations/columns in live pagination.
- [ ] Nested images, images beside tables and wrapping across page breaks.
- [ ] Split long wrapped paragraphs.
- [x] Paragraph keep-together, keep-with-next and page-break-before controls in HTML/DOCX and supported paginated blocks.
- [x] Two-line widow/orphan balancing for supported ordinary text in live pages and preview, with a persisted paragraph opt-out and DOCX round trip.
- [ ] Full widow/orphan balancing across nested layouts/columns/complex typography and nested-layout keep-rule parity.
- [ ] Page-bottom footnotes in editor/print.
- [x] Compatible continuous one-column and plain-text column sections can share preview pages.
- [ ] Continuous sections with complex objects, geometry/furniture changes and full nested keep-rule parity.
- [ ] Editor/preview/Word pagination consistency.

## Formats and review
- [x] DOCX import of supported fonts/sizes, alignment/indentation, blank paragraphs, paper settings, native text revisions and comment ranges.
- [x] Supported DOCX inherited run/paragraph styles and explicit RGB colors.
- [x] Live contents import for standard body-level Word contents controls with Heading 1–3 ranges.
- [x] Supported DOCX theme Latin fonts/colors, tint/shade resolution, default styles and partial font/spacing/indent inheritance.
- [x] DOCX import of supported paragraph spacing and keep/new-page rules for ordinary paragraphs and headings.
- [ ] Exact DOCX layout, unsupported/script-specific theme fonts, complex style semantics, overlapping/point comments and other contents-field forms.
- [x] Editable Slate Forge canvas data across DOCX export/reopen, with validated preview binding and an image-only export choice.
- [ ] Native editable Word drawing/text-box reconstruction and broad cross-editor object fidelity.
- [x] ODT content import/export for text, lists, ordinary tables, images and notes.
- [x] ODT export/import of horizontal and vertical table spans with covered cells.
- [x] Bounded ODT repeated-row/cell expansion.
- [x] Supported ODT named/default style inheritance, fonts/colors/highlights, paragraph design, nested list types and supported starts.
- [x] ODT A4/Letter page design, supported margins, orientation, default typography and simple header/footer/page-number round trips.
- [ ] Advanced ODT layout/styles, complex master pages/fields and broad external-editor fidelity.
- [ ] Microsoft Word round-trip certification.
- [x] Supported inline and paragraph formatting revisions, individual/bulk decisions, Undo, HTML/device persistence and native DOCX properties revisions.
- [x] Text revisions and comments in code blocks; code menu/style controls and native DOCX line-break/tab handling.
- [ ] Track structural and object edits; general paragraph-type conversion revisions.
- [x] Confirmed Find/Replace through unresolved revisions: accept complete affected changes, then replace in one undoable operation.
- [x] Accept all / Reject all text changes with confirmation and one-step undo.
- [x] Highlighted text comparison plus bounded formatting, structure, object and page-design difference reports.
- [x] Exact-content move matching within parents, insertion-resistant structural reports and inline formatting comparison on shared text inside edited blocks.
- [ ] Meaning-based matching of rewritten/moved blocks, cross-parent moves and ambiguous repeated/unequal replacement gaps.
- [x] Placeholder checks covering notes and canvas text, with navigation to the owning editor.

## PDF, OCR and drawing
- [ ] Existing PDF text editing; password protection; XFA.
- [ ] International fonts in PDF appearances.
- [x] Numeric geometry editing for supported imported PDF widgets; readonly/unsupported fields remain protected.
- [ ] Cryptographic signatures.
- [ ] Larger PDF capacity with performance/storage validation.
- [x] PDF page-range OCR using the local English engine.
- [ ] Additional OCR languages.
- [x] Persistent workspace-scoped OCR correction text; End session removes it.
- [x] Persist source scans and crop/rotation/page settings with correction drafts.
- [x] Include saved OCR scans/settings/corrections in ZIP, encrypted backups and encrypted recovery.
- [x] Pressure-sensitive canvas pen strokes with compatible fixed-width mouse/touch fallback.
- [ ] Physical stylus QA.

## Release verification
- [ ] Download/reimport the exact downloaded files, including encrypted backups.
- [ ] Actual browser-produced PDF inspection.
- [ ] Physical iPhone/iPad Safari, Android 12+ Chrome, desktop Chrome/Firefox/Safari.
- [ ] Virtual/hardware keyboards, IME, rotation/safe areas and screen readers.
- [ ] Real persistent-storage permission paths.
- [ ] Installed PWA offline PDF/OCR and service-worker updates.
- [ ] Native sharing, file associations and installed shortcuts.
- [ ] Eviction, suspended/restored/competing tabs and long-document/table performance.
- [ ] Restore automated browser access through supported platform infrastructure.

## Deferred product scope
- [ ] Provider sign-in, cloud storage/sync, collaboration/permissions.
- [ ] Separate notes and coding applications.

These deferred products are not requirements for the current account-free word processor release.
