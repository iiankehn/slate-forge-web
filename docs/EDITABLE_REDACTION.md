# Editable redacted sharing copies — implementation in progress

The user selected genuine editable DOCX, ODT and HTML sharing copies after the flattened PDF release. This implementation is not published yet. It removes logical content from a separate frozen writing model; it does not put PDF/page images inside nominally editable containers.

## Sharing boundary

Open **Editable redacted copy** from File/Review/export or drawing tools. Select text across formatted runs and remove it with Redact selection; remove complete media/canvas objects, or select canvas text in the full-text fields. Unmarked prose, table/list structure, formatting and supported canvas vector/text objects remain editable. Review the copy before exporting. Main documents, undo state, saved originals and backups are untouched.

A fresh allowlisted model accepts current visible revisions and omits deleted/review/comment history, links and arbitrary old attributes. The title/filenames and metadata are generic. Canvas/object/group IDs and names/descriptions are regenerated; hidden layers and unused geometry payloads are removed. A fresh visible native stroke projection replaces pressure/skew source geometry with editable contours where supported. DOCX/ODT native outputs do not attach original canvas or review custom parts. HTML retains only the sanitized current editable scene.

Every kept image is freshly reencoded as PNG. Shapes/masks and canvas picture crop, flip and zoom are baked into the actual asset; original files/EXIF/unused crop pixels are not copied. Fully transparent hidden RGB is cleared. Images may be resized to meet encoded limits. The preparation budgets are 16 megapixels per decoded source, 60 megapixels across unique decoded sources, 60 megapixels of prepared output, 24 MB encoded media, 100 media nodes, 30,000 document nodes and one million text characters. Review the resulting images.

Visible headers/footers and section furniture are expanded once into editable body text; note text becomes inline editable text. Contents are regenerated from current sanitized/redacted headings rather than retained cached labels; the contents title can be redacted separately. This preserves the text but can change pagination and native furniture/note semantics. Review styling makes writing text readable independently of its original color; export keeps supported formatting.

PDF/scan pixel-area redaction remains its separate flattened-PDF workflow. This path does not claim to reconstruct an editable PDF/scan document. Images can be removed as whole objects; arbitrary image pixel-area edits are not represented by the logical writing range controls.

## Explicit refusals

Unsupported native canvas features are refused per format rather than silently flattened. Canvas text ink that could clip outside its frame is refused; all full canvas text is available for review/removal. Native Word and ODF have different supported bounds, so a sanitized HTML canvas can remain editable when a particular native format refuses it. Table-cell rectangular selections need individual text ranges; continuous text and complete object removal are supported.

After marking, export consumes only the current sharing model, fresh assets and sanitized layout. It does not reread the original document. Cancellation/closing or switching workspace prevents late output. No original-file erasure is implied. Unmarked content remains readable, including in editable source; automatic sensitive-data discovery is not included.

## Evidence pending release

Focused checks cover split-run text removal, unchanged tables/originals, current-review projection, metadata/history/link removal, header/footer/note conversion, rebuilt contents, fresh IDs/hidden-layer removal, unused path data, actual text ink bounds, decoded-media budgets, three genuine editable format outputs and temporary-editor disposal. Browser scenarios inspect real downloads, native vectors, PNG crop pixels and stripped source metadata, plus actual LibreOffice group download/reopen/reload. Final CI/release evidence will be recorded after execution. No device or universal external-editor certification is claimed.
