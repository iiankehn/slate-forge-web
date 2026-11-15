# Word section and sequential-column flow

This batch closes the bounded DOCX gap following PR #38. Native DOCX import reconstructs current top-level section boundaries, one to three equal columns, portrait/landscape orientation, supported common paper/margins and simple default header/footer text with footer PAGE fields. Temporary conversion markers use unused style IDs and are removed before returning editable HTML. Plain one-section documents retain their existing HTML shape.

Sequential DOCX export uses Word's document-wide `w:noColumnBalance` compatibility setting. All multicolumn sections must use sequential flow. Mixing balanced and sequential columns refuses Word export because one global setting cannot express both. Single-column sections can coexist. ODT and editable HTML remain available for mixed modes. A generated terminal editor caret is omitted from sequential DOCX output without mutating editing or storage.

The existing 8-point Word paragraph spacing is now retained through sanitizing, editor attributes, review snapshots and native ODT instead of producing an unsupported-spacing warning. The paragraph panel exposes that supported value.

External native settings and section properties are authoritative on import. Custom/unequal columns, custom gaps, mixed paper/margins/numbering, odd/even/column starts, nested/history assignments, complex or active first/even furniture, and sequential objects/notes keep a warned document fallback. This is bounded interoperability, not universal Word layout parity. Backups, database identifiers, origins and private Site are unchanged; old app builds may ignore sequential flow.

## GitHub acceptance

Verification and publication are pending. Eight new Node cases cover repeated native/sanitized reconstruction, authoritative current edits, continuous/balanced sections, plain furniture, fallback preservation, terminal caret handling and planning limits. A browser scenario in five profiles covers actual DOCX download/reopen, saving/reload and measured page flow.

The sixth Office case generates fresh DOCX through the sanitized editor from the existing raw ODT seed, then uses independent LibreOffice profiles for direct rendering, actual DOCX resaving and resaved rendering. It requires three portrait/landscape/portrait pages, current section/flow reimport, unchanged text/page geometry and pixel-identical direct/resaved DOCX renders. The render reference is the generated DOCX, explicitly not the ODT seed; this does not claim cross-format pixel equality. The seed XML retains its ODF schema check. Generated DOCX, actual resave, PDFs and report remain attached to GitHub. All test/build/Office/browser execution belongs to Actions.

## Initial exchange failure and repair

GitHub run 43701511801 initially failed native reimport: Writer emitted inactive first/even furniture references and both source/resave contained the exporter's existing 8-point spacing. The original and actual Writer resave are retained under `test/fixtures/docx-section-flow/initial-*`. Import now ignores inactive references while refusing active first/even modes, and represents 8-point spacing explicitly. The failed run is not accepted render evidence; fresh GitHub exchange checks remain required. No local conversion, rendering or target-code execution was used to diagnose it.
