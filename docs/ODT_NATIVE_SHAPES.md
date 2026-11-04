# Native ODF canvas shapes and text boxes

This Word/ODT continuation adds an optional native ODF export mode for rectangles, rounded rectangles, ellipses and uniform text boxes. Native mode takes precedence over original-canvas retention. Its standard `draw:g`, `draw:rect`, `draw:ellipse` and `draw:frame`/`draw:text-box` elements are editable objects in compatible editors, rather than PNG previews. Hidden objects and private scene data are omitted. Group membership and locking are not transferred; the outer native canvas remains a group.

Supported visible objects retain positions, dimensions, solid fills/strokes, shape opacity, rounded corners, text, supported fonts/sizes/colors, bold/italic/underline/strike, alignment, line height and horizontal text direction. Text uses native paragraphs; the external editor controls wrapping and font layout. Native import reads the current object geometry/text/styles, including supported edits, rather than restoring a hidden original snapshot. It recognizes Slate Forge native canvas groups with a background viewport rectangle, including the tested LibreOffice rewrites; general arbitrary ODF drawing import is not claimed.

Visible pictures, paths, lines/arrows, rotations/skews/flips and translucent text require preview export. Unsupported native imports (nested/custom shapes, mixed rich text, transforms, unsupported paint, altered text insets or nonstandalone groups) fail explicitly before adding the document. Preserve HTML/workspace backups for exact original data. Unrecognized external drawing groups remain outside this bounded importer.

Bounds: 50 native canvases, 100 visible objects per canvas, 2,000 characters per text box and 20 MB aggregate encoded scene markup, plus existing archive/input limits. No database, storage identifier, backup format, origin or private Site changes are included. Preserve the confirmed mobile safe-area correction.

## Evidence

Generated content.xml and styles.xml pass the official ODF 1.3 Relax NG schema. A synthetic native document was actually opened/resaved through `writer8` by LibreOfficeDev 26.8.0.0.alpha0 (`2c87e51eeaa2b413ff4ae097b2705eea1995d8e5`). The committed `test/fixtures/odt-native-libreoffice-resaved.odt` keeps that output. Sanitized editor parsing retains its editable rectangle/ellipse/text objects, opacity and bold/italic text after another export. LibreOffice rounds geometry slightly (for example canvas height 560 becomes 560.1); original hidden metadata is not used to override current geometry.

Focused regressions cover supported native round trips, current native edits, absence of preview/private data, literal text, namespace aliases, unsupported content/transforms, shape counts and the actual LibreOffice fixture. Browser coverage adds actual native ODT download, an edited native file, save/reload, HTML export and reopening the LibreOffice fixture across the existing five configurations. Final release results are pending. This is limited headless development-runtime evidence, not stable LibreOffice GUI, Microsoft Word or physical-device certification.

## Remaining compatibility work

Native pictures/paths/lines and affine transforms, arbitrary external native groups, mixed rich text, native formatting/structural ODT revisions and broader stable Word/LibreOffice exchange testing remain open. Preview and retained-original-canvas modes remain available for the broader original canvas model.
