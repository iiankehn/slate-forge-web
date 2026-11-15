# Supported section paper and margins

This batch adds optional A4/Letter paper and 15/22/30 mm uniform margin overrides to writing sections. Legacy sections keep inheriting document or parent paper/margins; no default attributes or backup envelopes change. Section tools exposes explicit overrides and a Document default choice. Editing remains continuous; Page preview provides measured per-page geometry.

Preview, native ODT masters and document-level Word sections use the scoped geometry. ODT nested sections inherit/restore their actual parent geometry. Word refuses nested paper/margin overrides instead of flattening them. Inline/page-anchored images and native canvas scaling use active paper/content dimensions; Word respects column width. Compact Word margins use furniture distances that leave room for header/footer text.

ODT page-master projection now accepts supported paper/margin changes with existing numbering, furniture and complexity guards. Native Word sections reconstruct current supported geometry. Unsupported custom dimensions, asymmetric/custom margins, restarts and unsupported header/history designs retain their explicit fallbacks. Native imports reconstruct current effective values; HTML/backups preserve full override intent. Older builds may ignore the optional fields. Document/session/database identifiers, origins, private Site, body font choices, originals and mobile safe areas remain unchanged.

## GitHub acceptance

Acceptance and publication are pending. Eight new Node cases cover legacy attributes, sanitized/native cycles, raw master changes, unsupported geometry fallback, Word geometry/furniture distances, nested ODT scopes, backup/sharing, preview and media bounds. One new browser scenario in five profiles covers ODT/Word download/reopen, saving/reload, measured A4 → Letter landscape → A4 pages and section controls.

Two new actual Office cases use a GitHub-only native XML generator to change the committed orientation seed to A4/22 → Letter landscape/15 → A4/22. The source is not constructed with the importer/exporter under test. Transformed raw ODT and normalized XML must validate against core ODF 1.3. The ODT case requires pixel-identical raw/normalized/resaved PDFs; the Word case compares generated DOCX directly with its actual Writer resave, without a cross-format pixel claim. Both require native sizes/margins and page orientations. Prior eight accepted probes keep their assertions. All test, build, browser, Office and live-byte execution belongs to Actions.

## Initial GitHub diagnosis

Run 43756347772 passed all ten Office probes, including the new mixed-paper controls. Two Node assertions failed: an unsupported-geometry fixture unexpectedly produced a section and needs a case-specific diagnostic, while the page-image assertion incorrectly expected the anchor to move. The existing placement rule preserves the requested x coordinate and shrinks width at the paper edge; its expectation now checks x=205 mm and the Letter-specific remaining width of 10.9 mm. No rendering assertion or Office tolerance was relaxed. Fresh full acceptance remains pending.

Source review isolated an existing margin-precedence error: missing side attributes inherited the selected left margin, even when a different shorthand margin was declared. Side resolution now falls back to the actual shorthand, so asymmetric layouts cannot pass the uniform-margin projection check. The negative geometry assertion and all strict exchange/render criteria remain in place.

Run 43756990378 confirmed the exact asymmetric case: a 30 mm left override plus 15 mm shorthand incorrectly projected as uniform 30 mm with no warning. The corrected shorthand resolution addresses that product bug; the image-placement assertion now passes. Fresh GitHub acceptance is pending.
