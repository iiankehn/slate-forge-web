# Native Word section reopening

This batch closes the bounded DOCX section-import gap following PR #38. Native import reconstructs current top-level section boundaries, one to three equal columns, portrait/landscape orientation, supported common paper/margins and simple default header/footer text with footer PAGE fields. Temporary conversion markers use unused style IDs and are removed before returning editable HTML. Plain one-section documents retain their existing HTML shape.

Word's existing 8-point paragraph spacing is now retained through sanitizing, editor attributes, review snapshots and native ODT instead of producing an unsupported-spacing warning. The paragraph panel exposes that supported value. A generated terminal editor caret is omitted from ordinary DOCX output without mutating editing or storage; nested review output retains its previous path.

Current native settings and section properties are authoritative on import. An explicit `w:noColumnBalance` declaration imports as sequential flow. Native DOCX export of sequential sections remains refused: the actual Writer resave removed this document-wide declaration. ODT and editable HTML remain the reliable supported outputs for sequential sections. Missing settings never resurrect a private or guessed flow mode.

Custom/unequal columns or gaps, column separators, gutters/vertical text, mixed paper/margins/numbering, odd/even/column starts, nested/history assignments, complex or active first/even furniture, and sequential objects/notes keep a warned document fallback. Inactive first/even references are ignored. This is bounded interoperability, not universal Word layout parity. Backups, database identifiers, origins and private Site are unchanged.

## GitHub acceptance

Verification and publication are pending. Eight new Node cases cover repeated native/sanitized reconstruction, authoritative edits, continuous/balanced sections, plain furniture, fallback preservation, terminal caret handling, spacing and planning limits. A browser scenario in five profiles covers balanced DOCX download/reopen, saving/reload and measured page flow.

The sixth accepted Office case projects the existing ODT seed into an explicitly balanced editor model and generates fresh DOCX. Independent LibreOffice profiles render it, resave it as DOCX and render the resave. It requires three portrait/landscape/portrait pages, current section/flow reimport, unchanged text/page geometry and pixel-identical direct/resaved DOCX renders. Its reference is generated balanced DOCX, not the ODT seed; no cross-format pixel equality is claimed. Seed XML retains its ODF schema check. All test/build/Office/browser execution belongs to Actions.

## Retained failed sequential exchange

GitHub run 43701511801 initially failed native reimport on inactive first/even references and the existing 8-point spacing mismatch. Inspecting its actual resave also showed that Writer removed `w:noColumnBalance`. The original and actual resave remain under `test/fixtures/docx-section-flow/initial-*`; the rejected sequential probe specification is retained in `docs/fixtures/docx-section-flow/failed-sequential-probe.json`. Source import reads the explicit sequential mode, while actual resave imports current balanced mode. No private restoration overrides it.

The attempted sequential export was withdrawn; its failed probe was not relabeled a pass or relaxed. The accepted balanced probe is a distinct representation and case. Initial files are not accepted rendered evidence. No local conversion, rendering or target-code execution was used for diagnosis. Fresh GitHub exchange checks remain required.
