# Native ODT tracked paragraph splits and joins

This extension transfers tracked Enter/Backspace paragraph breaks between the existing writing review model and native ODT. Review accepts or rejects the break using the existing structural review controls; decisions remain undoable. It composes with independent whole-paragraph revisions, retains author/date grouping, and preserves spaces, tabs, supported rich runs, links and comment anchors beside the break. Originals and storage formats are unchanged.

## Representation and bounds

An inserted break uses a native insertion range from the end of the left paragraph to the beginning of the right paragraph. A deleted break uses one merged visible paragraph, a deletion point between the two text runs, and two empty stored paragraphs. Text is not duplicated in private metadata. Imports reconstruct the two editable paragraphs before the remaining block/inline readers run. Shared marker validation rejects malformed, nested, overlapping or missing endpoints before consuming any subset. All revision types share the existing 1,000-range limit and bounded document traversal.

The supported source is adjacent top-level paragraphs with identical paragraph design, containing text, hard breaks and comment anchors. Headings, mismatched design, lists, tables, sections, objects, overlapping text/format revisions and change notes remain explicit refusals. Independent supported content outside the affected pair is retained. Current native IDs disambiguate empty sides; foreign ambiguous empty changes may reopen as whole-paragraph review instead, preserving both Accept/Reject outcomes. Native IDs are recognized by an exact bounded pattern, not an arbitrary prefix.

Rich joins with paragraph keep-together, keep-with-next or page-break-before flags remain refused. Writer drops character formatting when the stored trailing paragraph has a named style; making that paragraph inherit run context fixes rich text but loses keep flags. The exporter therefore uses the inherited tail only for rich joins without those flags, and styled empty paragraphs otherwise. It does not silently remove settings to make a file exportable.

The app sanitizes imported HTML before parsing. Structural ODT review imports request whitespace preservation in the editor parser because reconstructed paragraph edges can contain spaces that previously occurred inside a merged paragraph. Ordinary ODT imports retain their existing parser path.

## Actual editor evidence

LibreOfficeDev 26.8.0.0.alpha0, build `2c87e51eeaa2b413ff4ae097b2705eea1995d8e5`, headlessly reopened and saved all 19 corrected inputs in `docs/fixtures/odt-boundaries/`; outputs and original source models are in `test/fixtures/odt-boundaries/`. The corpus covers both change kinds, empty sides, whitespace/tabs, consecutive and mixed changes, independent paragraph changes, paragraph design, rich comments/emphasis, an empty italic tail, bold-to-plain transitions and styled italic paragraphs. Both decisions also pass after another native export/reimport. Separate native DOCX paragraph-mark inputs and their Writer-converted ODT outputs provide independent dialect controls.

The first character-format loss and subsequent keep-setting loss are retained as `odt-boundary-initial-format-loss.odt` and `odt-boundary-initial-keep-loss.odt` in the input/output fixture directories. They are failed probes, not passing acceptance fixtures. Regression checks explicitly cover the retained formatting and unsupported combination.

All 19 generated input content/styles pairs validate against ODF 1.3. All 19 Writer `content.xml` parts validate against their declared ODF 1.4 after excluding two existing `loext:resolved` comment attributes from the validation copies. The unmodified Writer `styles.xml` files contain extended paragraph/page properties and do not pass core-schema validation; no whole-package conformance claim is made. Fixture bytes are not altered for validation.

Twelve new Node cases cover review semantics, source refusals, marker corruption, shuffled revision-store order, comments, whitespace and a 1,000-break chain. One browser scenario across five profiles checks real download/reopen, local save/reload, Accept/Undo/Reject and an independent native split. CI is the browser execution environment; headless Writer exchange does not certify interactive Writer Review, Microsoft Word, exact layout or physical devices.

## Release state

All 668 Node tests, the production build, static packaging checks and source whitespace checks pass locally. Required PR/main browser checks and exact main-artifact publication remain the release gates; see the current roadmap and handoff for the latest status.
