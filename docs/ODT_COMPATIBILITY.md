# Word/ODT compatibility follow-on

Requested 2026-11-03 after the completed focused release. The user explicitly reopened advanced work and selected Word/ODT compatibility as the lead area.

## Behavior in this batch

- Export native ODF annotations for text comments, including overlapping ranges across paragraphs, cursor anchors, author/date, multiline literal bodies and resolved state. Resolved state uses LibreOffice's `loext:resolved` extension; other applications may ignore it.
- Import native annotations into editable Slate Forge comments, including namespace aliases. Ambiguous duplicate/reversed ranges are ignored with a warning; annotation bodies never become document prose. Import/export allow up to 300 comments. Expanded comment markup is limited to 20 MB.
- Export design canvases as page/column-fitted PNG previews instead of refusing the document. Previews retain aspect ratio and description and reopen as ordinary images. They omit editable scene data and hidden objects. Keep HTML/workspace backups for original editable canvases. The DOCX canvas settings remain DOCX-specific.
- Refuse missing or oversized canvas previews rather than silently omitting them. The existing 1.5 MB ODT image import ceiling also bounds exported canvas previews.
- Preserve external ODF namespace aliases for headings, links, image relationships/geometry and table spans/repeats instead of depending on literal XML prefixes.
- Keep image descriptions in image alternative text instead of duplicating them as body prose on ODT import.

ODT still exports final inline review text and requires decisions on structural groups. This batch adds comments, not native ODF tracked changes. Native text boxes/shapes, exact external layout and round-trip preservation of arbitrary ODF features remain future compatibility work.

## Verification

Regression tests in `test/odt-comments.test.mjs` reconstruct exported archives and pass imported HTML through the sanitizer and editor schema, then export/import again. They cover overlapping/cursor comments, metadata and literal hostile text, malformed ranges, count limits, deleted review text, namespace aliases, preview bytes/geometry and missing/oversized previews. Existing ODT style/section/table tests remain applicable.

The browser suite adds a real downloaded ODT round trip covering comment metadata, a cursor anchor, rendered canvas preview and hidden-data omission across the existing five configurations. Record actual CI results before claiming browser success. These checks do not certify physical devices or external Word/LibreOffice resaves.

No storage identifiers, database versions, workspace backup formats, origins or private Site configuration change.
