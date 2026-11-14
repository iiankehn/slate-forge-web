# Retained ODT review history

The optional **Retain complete review history for Slate Forge** export choice preserves the existing review model in an ODT reopening snapshot. It covers row changes, cell content revisions, list replacements, nested structural decisions, formatting history with prior values, comments and unanchored replacements. The existing native-history export remains the default.

## User-visible behavior

The checkbox starts unchecked. With it selected, other editors receive an editable accepted document. Slate Forge reopens the stored review tree, original recording setting and supported layout when the package is unchanged. Existing Review controls and Undo/Redo operate on the restored decisions. Private snapshots preserve validated table widths; the same correction applies to retained DOCX review snapshots.

The file includes deleted content, comments, prior formatting and original embedded images. Editable canvas retention can include hidden layers. Native/image-only canvas choices retain image previews in the review snapshot. This is a working review copy; use the separate editable redacted-copy workflow for sharing without retained source history. Redacted exports do not request this option and do not attach the review part.

A Writer resave or external edit imports the current native document instead of automatically resurrecting an obsolete snapshot. Keep the original ODT or a workspace backup when the complete review tree is needed. The package fingerprint is a stale-restoration guard, not authorship authentication.

## Native format boundary and evidence

The two native Word row controls in `docs/fixtures/odt-row-history-controls/` use standard row insertion/deletion properties. Actual LibreOfficeDev 26.8.0.0.alpha0, build `2c87e51eeaa2b413ff4ae097b2705eea1995d8e5`, converted both controls into ODT with no retained row change definitions. Their resaves remain in `test/fixtures/odt-row-history-controls/`; both still contain the changed row. This is a failed native-history transfer, not passing interoperability evidence.

The new mode provides explicit Slate Forge history retention rather than claiming native Word/Writer row, cell or nested-review interoperability. Existing native inline/paragraph/boundary and supported whole-list/table exchange remains available without this option.

Eight accepted-view inputs in `docs/fixtures/odt-review-history/` cover nested, unanchored, cell, list, row insertion/deletion, formatting and comments. Exact fresh-package restoration and both decision outcomes pass. Their actual Writer resaves in `test/fixtures/odt-review-history/` import current accepted text with no obsolete history restored. The generated content/styles XML parts pass core ODF 1.3 validation; private metadata uses a manifest-listed JSON part. No interactive Word/Writer or device certification is implied.

## Implementation and bounds

`SlateForge/review.json` contains versioned HTML/layout data plus a SHA-256 binding to all other decoded package parts, including the manifest. Export captures HTML and the editor model together before asynchronous media preparation. Native content is generated from the existing accepted-review projection with recording off; the original model is not changed.

On import, native validation runs first. Only the expected version, manifest entry and matching package fingerprint make stored review available. The app then sanitizes HTML, applies document/node/review-depth bounds, parses through its current schema and confirms supported review remains before replacing the native view. Invalid, missing, changed or unrepresentable metadata falls back to current native content. Author-controlled HTML still passes the ordinary safe-image/link/style filters. Validated numeric table-width attributes are enabled only for retained review; ordinary import defaults remain unchanged.

Limits remain 5 MB compressed ODT, 50 MB decoded package, 20 MB per ordinary member, 1,000 members, 10 MB retained snapshot, 100,000 document nodes, depth 100 and 20 nested structural review layers. Canvas/native geometry limits continue to apply to the accepted projection. Oversized copies refuse without mutating originals; workspace backups remain available.

Ten new Node cases check exact sanitized model reopening, both decisions, row author/identity/width preservation, Undo/Redo, current native projection, external edits/removal, malformed and oversized metadata, sanitization, image/canvas choices, limits and actual Writer resaves. Existing DOCX snapshot sanitization now also checks retained widths. A five-profile browser scenario covers explicit opt-in, real download/reopen, saved reload, row Accept/Undo/Reject and external native edits.

## Release state

PR #31 is merged and live at https://slate-web.iiankehn.com/ from runtime `f7488f3f50df43c71e9e9851bbaedb3a02008096`. PR CI 43571680009 and main CI 43573166532 each passed 688 Node tests and all 225 browser scenarios without retries. Pages 43574825195 promoted exact main artifact 14106330531 without rebuilding or repeating browsers. All 56 checked live shell/worker URLs byte-match; worker cache digest `03d2a194f9797fda` reconciles. See [RELEASE_2026_11_14.md](RELEASE_2026_11_14.md). Ten new Node cases and the five-profile download/reopen scenario are included in those gates. The eight actual Writer resaves and two failed native row-history controls retain the boundaries described above. Broader native interchange and paint/layout limits remain in [COMPATIBILITY_INVENTORY.md](COMPATIBILITY_INVENTORY.md).
