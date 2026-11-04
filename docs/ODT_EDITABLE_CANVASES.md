# ODT original-canvas retention

The next Word/ODT batch adds optional original-canvas retention to ODT export. The export dialog enables it by default when a document contains canvases; clear “Retain original canvases in ODT” for a preview-only copy. Other editors display the PNG preview. This is not native ODF drawing-object export.

The ODT package contains `SlateForge/designs.json`, declared as application/json in the manifest. It retains normalized original scenes, including hidden/locked/grouped objects and uncropped embedded image sources. The dialog explains that retained data is included. Image-only copies contain neither the scene part nor its hidden objects.

Each record binds one uniquely named standalone image frame to its preview SHA-256, dimensions, description and supported frame structure. Import restores the scene only when those checks pass. Changed bytes, geometry, transformations, graphic styles/defaults, descriptions, mixed paragraph content, duplicate frames/records, invalid scenes or unsupported metadata retain the current preview as an image with a warning. Missing metadata leaves an ordinary image; removed previews never resurrect deleted canvases. Checks use namespace URIs and support XML prefix aliases. Conservative rejection is intentional: an external editor may rewrite an unchanged frame in a way that requires image fallback.

Bounds: 50 retained canvases, 100 objects per scene, 10 MB aggregate metadata, 15 MB encoded data per scene, 20 MB expanded retained-scene markup and the existing 1.5 MB preview-image limit. Export now checks the existing archive import limits before producing a file (50 MB expanded total, 20 MB per part, 1,000 entries, plus the 5 MB packed-file opening limit); oversized exports fail with a suggestion to simplify or split the document. Storage formats are unchanged. Retained data is not authenticated; its checks prevent accidental stale restoration, not deliberate modification of both metadata and preview.

## Validation

Ten focused Node regressions cover sanitized editor reopening/re-export, original hidden data, preview-only exclusion, changed preview/geometry/style/description/content, ambiguity, corrupt/oversized/unsafe metadata, removed canvases, namespace aliases, independent neighboring canvases and aggregate size limits, including oversized preview archives. Browser coverage exercises actual download, original-canvas reopening, device save/reload and changed-preview fallback, in addition to the existing image-only ODT/comments test. Release results will be recorded after CI and publication.

## Remaining selected compatibility work

Native editable ODF shapes/text boxes, native formatting/structural ODT revisions, broader unsupported ODF drawing imports and actual Word/LibreOffice resave testing remain open. Keep an HTML or workspace backup for complete original document/review data. The user-confirmed mobile header correction remains intact. No account, storage identifier, database, backup format, origin or private Site identity changes are included.
