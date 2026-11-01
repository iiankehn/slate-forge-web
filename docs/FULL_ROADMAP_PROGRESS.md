# Full roadmap completion work

The user requires the entire remaining roadmap, not a beta subset or one batch per response. Continue work across checkpoints. Keep docs/ROADMAP.md as the completion record; this file records active work and dependencies, not permission gates.

## Current unshipped checkpoint

- Native Word pressure strokes export as editable, clipped vector contours; closed contours persist through canvas/HTML and repeated DOCX reopening.
- Native mirrored and sheared shapes/text/paths reconstruct and export using affine decomposition. The fixed canvas frame prevents transform-group bounds from rescaling unrelated content. Non-image flips/shear are editable in the canvas controls.
- Native translucent text uses Word text-fill alpha. Contained images rotate/reflect about the original canvas frame, and do not acquire an unwanted border.
- Nested ODT sections and continuous page-design changes retain logical section modes, parent master/furniture inheritance and return to parent layout. Native section master references and inline bookmarks retain those modes; content/styles validate against the official ODF 1.3 schema. Nested images use the active column hierarchy.
- Safe custom and international font families survive editor/HTML/Word/ODT/canvas/review state. Font references never fetch font URLs. Actual rendering still requires a locally available matching font.
- Word mixed-script runs select Latin/East Asian/complex-script and supplemental theme fonts, respect language hints and complex-script formatting, and retain text/revision metadata across splitting.
- Word style toggles respect paragraph/character/default inheritance and direct overrides.
- Paragraph direction has automatic/LTR/RTL controls and HTML/DOCX/ODT/review persistence. Default direction does not create spurious comparison differences.

Validation at this checkpoint: all 441 Node cases pass, production build and static/whitespace checks pass. Focused native and ODT cases pass. Browser CI expands the existing Word/ODT scenarios and adds international-font/direction actual downloads (70 scenarios); results are pending. No checkpoint publication or overall roadmap completion is claimed.

## Remaining checklist snapshot

- [ ] Real-device large-workspace performance, actual quota pressure and browser/OS eviction validation.
- [ ] Free page coordinates for images with automatic surrounding text flow.
- [ ] Two-sided wrapping, page-coordinate exclusions and objects outside canvas blocks.
- [ ] Mixed orientations/columns in live pagination.
- [ ] Nested images, images beside tables and wrapping across page breaks.
- [ ] Split text through an active float, nested wraps and arbitrary wrap/page-break interactions.
- [ ] Full widow/orphan balancing across nested layouts/columns/complex typography and nested-layout keep-rule parity.
- [ ] Complex-section/nested note parity and physical-reader/rendering certification.
- [ ] Continuous sections with geometry/furniture changes, nested sections and full nested keep-rule parity; live mixed-section pagination remains open.
- [ ] Editor/preview/Word pagination consistency.
- [ ] Exact DOCX layout, unsupported/script-specific theme fonts, complex style semantics and other contents-field forms.
- [ ] Broad cross-editor object fidelity, skewed/mirrored text groups, advanced effects, pressure-varying native paths and full typography parity.
- [ ] Advanced ODT layout/styles, nested section export, continuous page-design changes, complex master pages/fields and broad external-editor fidelity.
- [ ] Microsoft Word round-trip certification.
- [ ] Fine-grained nested/move-specific structural decisions and native DOCX structural-revision interoperability.
- [ ] Semantic matching beyond shared wording and disambiguation of repeated/equally similar replacement or moved blocks.
- [ ] General PDF text/font editing, embedded/subset/complex text, automatic text reflow and XFA.
- [ ] Broad script/font coverage, paragraph-level typography controls and cross-reader font/render certification.
- [ ] Trusted timestamps, revocation, long-term signature validation and certified/locked-field permission-policy support.
- [ ] Larger PDF byte limits and real-device memory/storage-pressure validation.
- [ ] Physical stylus QA.
- [ ] Physical iPhone/iPad Safari, Android 12+ Chrome, desktop Chrome/Firefox/Safari.
- [ ] Virtual/hardware keyboards, IME, rotation/safe areas and screen readers.
- [ ] Real persistent-storage permission paths.
- [ ] Installed PWA offline PDF/OCR and service-worker updates.
- [ ] Native sharing, file associations and installed shortcuts.
- [ ] Eviction, suspended/restored/competing tabs and long-document/table performance.
- [ ] Provider sign-in, cloud storage/sync, collaboration/permissions.
- [ ] Separate notes and coding applications.

Physical hardware/installed-app lifecycle and licensed Microsoft Word results require actual access and observation; synthetic tests cannot close those entries. Provider/cloud features and trusted timestamp/revocation interoperability require real provider/trust configuration for final integration evidence. Continue independent feature implementation rather than stopping at these external dependencies. Preserve the original private Site and document-studio storage/version identifiers. No sub-agents have been authorized.
