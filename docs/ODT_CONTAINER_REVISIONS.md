# Native ODT whole-list and whole-table revisions

Complete top-level lists and tables now transfer through native ODT as editable structural review decisions. Existing Review controls accept/reject them with Undo/Redo. Unchanged content, originals, storage identifiers and backup formats are preserved. This extension uses standard ODF revision content, not private document snapshots.

## Supported behavior

- Whole bullet/numbered lists, nested lists and explicit ordered starts from 1 to 100.
- Whole rectangular tables with supported headers, palette/density, stable merged cells and fully covered rows; lists inside cells retain their structure.
- Mixed paragraph/heading/list/table content in one complete change, independent changes separated by unchanged paragraphs, meaningful empty items/anchors, spaces, tabs, rich runs and links.
- Inserted comments remain anchored. Comments inside deleted content are omitted under the existing ODT policy.

An insertion requires a following unchanged paragraph anchor. Its standard insertion range starts at the complete changed block and ends at that paragraph's beginning. A deletion requires matching unchanged paragraph designs on both sides. The deletion point sits at the preceding paragraph's end; stored native content contains an empty left anchor, the complete deleted blocks and an empty right anchor. Both anchors preserve surrounding paragraphs through Writer exchange.

The importer validates all markers before consuming supported container ranges, then passes remaining revisions to the existing boundary, paragraph and inline readers. It reconstructs deleted blocks in reverse marker order and uses the normal list/table renderer, style resolution, sanitization and expansion limits. Revision-store ordering cannot reorder decisions. All revision kinds share the 1,000-range cap; bounded traversal and field/object/nesting checks remain enforced. Structural import preserves spaces while constructing the existing editor model.

## Explicit limits found during exchange

- Incomplete/list-item/cell/individual-row histories, nested review layers, object/field changes, moves and change notes remain unsupported. Whole-container revisions do not add row-level tracking.
- Unanchored whole-document, trailing container insertions and leading/trailing container deletions require decisions or DOCX/HTML. Independent deletions need a paragraph between their anchors: Writer merged adjacent records and introduced a blank paragraph in the initial probe.
- A logical table column hidden inside merged cells in every row collapses in Writer. Such reviewed tables explicitly refuse native export. A table with a visible cell boundary in that column preserves its grid; a full ordinary row can provide that boundary.
- List starts outside 1–100 and continuation without an explicit start value refuse. Unrepresented shapes, pictures and other embedded fields remain refused inside these native revisions.

The failed probes are retained in `docs/fixtures/odt-containers-failed/` and matching `test/fixtures/odt-containers-failed/`: unanchored list deletion, a missing table tail, collapsed logical columns, merged independent deletions and the initially missing hyperlink type. They are not accepted evidence. A source conformance fix now emits required `xlink:type="simple"` on ordinary and contents hyperlinks.

## Verification

LibreOfficeDev 26.8.0.0.alpha0, build `2c87e51eeaa2b413ff4ae097b2705eea1995d8e5`, headlessly reopened and saved 39 accepted inputs from `docs/fixtures/odt-containers/`. Resaves and source models are in `test/fixtures/odt-containers/`. Both decisions, independent group counts, list starts, table cells/design and a further native export/reimport pass. Rich emphasis, links, comments, metadata and Undo/Redo have focused checks.

All 117 checked XML parts validate against their declared ODF versions: 39 generated content/styles pairs and 39 Writer content parts. Validation copies exclude exactly two `loext:resolved` attributes, 270 Writer `loext:num-list-format` attributes and two Writer `loext:opacity="100%"` attributes. Fixture bytes are unchanged for validation. Writer `styles.xml` contains extensions and is not claimed core-conformant; no whole-package/editor certification is implied.

Ten focused Node cases cover the model, real resaves, corrupt markers/fields, expansion limits, reviewer metadata, ordering, explicit source refusals and original non-mutation. One browser scenario across five profiles checks real native download/reopen, saved reload, Accept/Undo/Reject and an actual Writer-numbered-list resave. Browser execution remains in required GitHub Actions; no physical-device gate is added.

## Release state

Published through PR #30 from runtime `07a3d52e980f762723adf20f56037523c087c6c7`. PR/main CI each passed 678 Node tests and all 220 browser scenarios without retries. Pages promoted the exact successful main artifact; all 56 checked live shell/worker URLs byte-match and the cache digest reconciles. See [release provenance](RELEASE_2026_11_13.md). Local full-suite/build/packaging checks and the affected app checks after the guidance repair also pass. Broader remaining cases stay in [COMPATIBILITY_INVENTORY.md](COMPATIBILITY_INVENTORY.md).

## Initial PR verification and repair

Run `43508856264` was cancelled as superseded after the download/reopen browser check was strengthened to wait for an additional imported document. Corrected-source run `43509384461` passed Node/build checks but stopped with 41 browser passes, one failure (also failing its built-in retry) and 178 unrun cases: the existing paragraph-review scenario expected the guidance phrase “whole-paragraph changes,” which the expanded list/table wording had separated. The phrase is restored while retaining the new guidance. Assertions and strict retry policy are unchanged. Neither run is accepted release evidence. Corrected PR/main verification subsequently passed as recorded above.
