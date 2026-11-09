# Redacted PDF copies

The user selected suite-wide redaction with flattened PDF output first on 2026-11-09. Implementation is awaiting browser CI and publication; it is not yet a live feature.

## Use and output boundary

Choose **Redact & share PDF** from Review, command search, or the workspace export options. Drawing tools and PDF tools offer the same action; scan tools offer the current scan page. Export also accepts a PDF or embedded image file directly. Mark rectangular areas by dragging or by entering percentage coordinates, review every page, then export `redacted.pdf`.

Each page is rendered to a fresh image. Covered pixels are overwritten with opaque black before PNG encoding; transparent pixels are flattened onto white. A fresh PDF contains only these page images and generic metadata. Original text objects, fonts, form fields, links, annotations, attachments, layers, document metadata and digital signatures are not copied into the output. Visible annotations and field appearances are rendered into the image. This loses searchable/selectable text and editable structure.

This creates a sharing copy. Original documents, imported files, saved PDF edits, undo history, backups and device recovery copies remain unchanged and can contain the sensitive material. It does not erase those originals. Inspect every output page and cover all sensitive content before sharing. Unmarked visible content remains readable in the output; automatic sensitive-text discovery is not included.

## Supported bounds

- Writing documents use a captured paginated layout, including rasterized embedded canvases and images. Capture can differ from browser printing; review the actual preview. Animated images use a frozen frame. Image shape clipping is baked into pixels.
- Design canvases export their current scene. Scan tools export the current cropped/rotated scan page. PDF tools snapshot current edits; signed PDF source files produce a separate unsigned sharing copy.
- PDF inputs must be unlocked and non-XFA. Redacted copies support at most 25 pages, 8 megapixels per page, 60 megapixels total and 40 MB input/output files. Image preparation has additional explicit memory limits. Existing ordinary PDF workflows retain their separate limits.
- Each area must cover at least two source pixels per dimension. A one-pixel outward margin covers edge rounding; the preview shows the resulting pixels. At most 1,000 areas are accepted. All pages must render successfully and be visited before export.
- Masks exist only in the open redaction dialog. Closing it or switching workspaces cancels export and discards masks. No storage identifiers, database versions or backup formats change. New scan records store bytes rather than Blob/File objects to avoid WebKit persistence failures. Reads accept legacy Blob records and expose the same Blob snapshot/backup shape. Older app builds cannot read these new byte-backed scan records; finish updates before reopening saved scans.

Editable redacted DOCX/ODT/HTML, automatic discovery/OCR-based redaction and original-file erasure require separate format-specific work and are not included.

## Verification

Local Node checks cover actual decoded PDF image pixels, transparency flattening, fresh PDF object structure, cancellation, failure handling, page review gating and preservation of saved PDF originals/current edit snapshots. These checks do not establish browser rendering or physical-device behavior. Browser CI covers document text/canvas capture, downloaded PDF structure/pixels, file inputs and direct PDF/drawing/scan entry points across the existing five configurations. Final CI and publication evidence will be recorded after execution.
