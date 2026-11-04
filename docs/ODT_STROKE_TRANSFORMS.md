# Native ODF stroke transforms

Native ODT canvases now export/reimport rigidly rotated/reflected lines, supported triangular arrows and straight-segment paths. Lines/arrows stay native primitives when their endpoints and paint have a faithful representation. Skewed line/arrow shafts and heads, skewed uniform paths and pressure strokes become editable filled contours. Transformed fill-only contours retain real holes. Current native endpoint/path edits are read; no original private scene is restored.

A thin endpoint box is not enlarged and mistaken for new line geometry. The importer finds a legal pre-rotation frame with the same segment length/midpoint and restores its direction. Horizontal/vertical and near-axis lines can therefore reopen without changing their endpoints. Rotation/control values may normalize to an equivalent representation; use HTML/workspace backups for exact original scene controls.

## Bounds

- Existing model rotation ±180 degrees and X skew ±85 degrees apply. Rigid lines/arrows/path vertices must fit the canvas with their caps/heads; edge-clipped rigid paint requires preview export. Fill-only transformed contours and generated skew/pressure outlines clip to the canvas before union.
- Skewed outlines preserve a single opacity at overlapping shaft/head/segment regions. Adaptive semicircle tessellation limits transformed round-cap approximation to roughly .12 canvas units at maximum width before model normalization; the existing polygon/union budgets remain authoritative.
- Skew/pressure conversion is limited to 512 input points per object, 12,000 input contour points per union, 50,000 across a canvas, 100,000 intersection operations and the existing 44,000-point contour/output cap. Rigid flat paths retain their existing 2,000-point limit. Oversized geometry fails explicitly.
- Ordinary lines/arrows need a legal model frame at least 20×20 units. Too-short segments or midpoints too close to a canvas edge can be unrepresentable as primitives and are refused. Small physical-unit rounding from editor exchange is tolerated; the model still normalizes geometry to .1 units.
- Current foreign rotation/translation lists are supported for native lines and open paths. Affine stroke scaling/shearing in foreign transform lists remains refused until independently demonstrated; import supports bounded affine lists on fill-only contours through the existing box reader. Generated native outlines contain baked geometry and do not depend on that foreign stroke interpretation.
- Transformed contours with visible borders, custom arrowheads, curves, unsupported cap/join styles, raw matrices, nested transformed groups and unsupported text transforms remain preview cases. Stroke outlining preserves visible ink rather than the original pressure/arrow editing controls.
- Existing ZIP/image/scene limits, including 15 MB per encoded canvas and 20 MB aggregate native scenes, remain enforced. Storage formats, origins and image metadata disclosure are unchanged.

## Evidence

`test/fixtures/odt-stroke-transforms-libreoffice-resaved.odt` is an actual LibreOfficeDev 26.8.0.0.alpha0 resave of rotated directed primitives, a reflected/rotated polyline, a translucent skewed arrow, a skewed uniform path, a transformed pressure path and a transformed contour with a hole. Regressions compare endpoints and vertices after another export/import, union/hole coverage, source capsule coverage, high skew, minimum-size frames and unsafe/oversized cases. The prior axis-aligned LibreOffice probe now opens successfully.

[Reviewed direct source-to-PDF rendering](ui/odt-stroke-transforms-libreoffice.png) contains the seven strokes/contours without a save workaround. content.xml and styles.xml pass the official ODF 1.3 Relax NG schema. Headless editor rendering/resaving is distinct from Microsoft Word, GUI-editor and physical-device certification.

Browser CI adds actual native ODT download, current canvas-title editing, reopening, device save/reload, HTML export and opening the real LibreOffice fixture across five configurations.

## Next-batch corpus preparation

A [one-level opaque group probe](fixtures/odt-grouped-strokes-libreoffice-probe.odt) survives actual LibreOffice resaving with both directed child endpoints and order unchanged within .01 mm. The current importer still refuses the nested group explicitly. This is evidence for the next bounded group batch, not a current group-support claim; group paint/compositing, deeper nesting and raw matrix semantics still need representation proof.

## Published verification

Published from `3154878e39110ceb1d3e6ea41677e73e5a2cbe3f` at https://slate-web.iiankehn.com/ . [PR #21 verification](https://github.com/iiankehn/slate-forge-web/actions/runs/41922726717) and [main CI](https://github.com/iiankehn/slate-forge-web/actions/runs/41924728034) passed 554 Node tests and all 145 browser scenarios without retries. [Pages promotion](https://github.com/iiankehn/slate-forge-web/actions/runs/41926898336) deployed the successful main artifact without rebuilding or rerunning browsers. Verified 45 live shell/worker URLs and cache digest `90ef44bc52d2e75b`.

Native ODF strokes now retain rigid line/arrow/path rotations/reflections and axis-line geometry. Skewed strokes and transformed pressure paths become editable unioned contours, preserving cap/head geometry and single opacity. Current rigid native endpoint/path edits are read. Edge-clipped rigid paint, unrepresentable short/edge-positioned primitives, transformed bordered contours and foreign stroke scaling/shearing lists remain explicit preview cases. Preserve storage/origins, image metadata disclosure, earlier modes and the confirmed mobile fix. **Next: bounded group/matrix compatibility**, with unsupported text/bordered-contour cases explicit, in [ROADMAP.md](ROADMAP.md).

Promoted `static-site` artifact 13369038767; archive SHA-256 `49bb62fc30d59e12dc2bd2d97977d2d73e9bf10784a3d9adceea895617426794`. Final PR source `917ec5de85993641d237fd614d6971ab1fe467fb`. Pages job steps contain artifact retrieval/provenance validation, upload and deployment only. Live cache verification reconciles the known platform-specific notices difference. Documentation bookkeeping changes no runtime bytes.
