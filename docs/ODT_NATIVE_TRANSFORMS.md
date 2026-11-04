# Bounded native ODF transforms

The [stroke-transform follow-on](ODT_STROKE_TRANSFORMS.md) adds rigid stroke rotations/reflections, axis-line recovery and skew/pressure outlines. The remaining limits below still apply where the follow-on does not supersede them.

Native ODT canvases now export/reimport rotated and X-skewed rectangles, rounded rectangles, ellipses and PNG/JPEG pictures, plus rotated uniform opaque text boxes. Pictures support horizontal and vertical flips together with existing crop and opacity. A vertical flip is represented by a half-turn plus horizontal mirroring; it does not depend on the vertical-mirror property that the available LibreOffice build discards.

Import reads current object transforms and geometry, without restoring a private scene snapshot. Contained-picture placement accounts for the transformed painted frame. Whole embedded picture files, including cropped-out pixels and metadata, remain included, as disclosed in the export dialog. Existing preview and retained-original alternatives remain available. No storage identifiers, database versions, backup formats, fonts or origins change.

## Bounds

- This is the bounded native Writer transform-list dialect exercised by actual LibreOffice exchange: rotate, X skew, physical-unit translation and positive uniform scale. Operations are applied in listed order. Writer writes angle parameters in radians, with opposite rotation/X-shear signs to the canvas model; the ODF 1.3 prose describes degrees. These files pass its schema, but no universal transform interpretation across all editors is claimed.
- Export canonicalizes rotation into −180–180 degrees. Model X skew remains within ±85 degrees. Import limits transform strings to 2,048 characters and 16 operations, finite bounded operands and nondegenerate positive uniform scale; unsupported raw matrices, Y skew, reflections/nonuniform scale and transformed groups are refused.
- Editing boxes and all transformed box corners must fit the canvas. Transformed picture painted frames must also have representable editing bounds and dimensions of at least 20 canvas units; thinner transformed frames require preview export. Untransformed thin-picture handling remains supported.
- Text boxes support rotation; skewed/mirrored text, scaling through a transform list, translucent text and unsupported rich text remain explicit refusals. Other editors control line wrapping.
- Bounded line/arrow/path transforms are supported by the [stroke extension](ODT_STROKE_TRANSFORMS.md); its paint/representation limits remain explicit. Symmetric basic-shape flips can normalize to the equivalent unflipped shape. Grouping/locking and per-picture descriptive metadata remain outside the bounded object model.
- Existing image, geometry, ZIP, 15 MB per-canvas and 20 MB aggregate native scene limits remain enforced before reopening can lose content.

## Evidence

The representative corpus includes rotated/skewed rectangle and ellipse, rotated text and a cropped, translucent, vertically flipped PNG. `test/fixtures/odt-transforms-libreoffice-resaved.odt` is an actual LibreOfficeDev 26.8.0.0.alpha0 resave. The transformed ODT resave also retains the original embedded PNG bytes. Tests compare current geometry, text and source-image sample positions after resave and another export/reimport, plus contained/flipped pictures and 24 representative rotation/skew/crop combinations.

Direct source-to-PDF rendering initially exposed missing group-position defaults, producing an empty initial render. Explicit native group positioning fixes it: the source now directly renders shapes, text and picture without a save workaround. [Reviewed direct rendering](ui/odt-native-transforms-libreoffice.png). Both content.xml and styles.xml pass the official ODF 1.3 Relax NG schema. This is headless editor evidence, not Microsoft Word, GUI-editor or physical-device certification.

Browser CI adds actual native ODT download, current transformed-text editing, reopening, device save/reload, HTML export and opening the real LibreOffice fixture in all five configurations.

## Axis-line corpus follow-on

An [actual LibreOffice resave probe](fixtures/odt-axis-strokes-libreoffice-probe.odt) retains a horizontal line and vertical arrow as exact axis-aligned native endpoints. The stroke-transform follow-on now imports this probe with legal pre-rotation editing frames. Reimport must recover a legal pre-rotation editing frame instead of clamping zero-width/height endpoint boxes to 20 units and changing the line. Sheared caps/arrowheads now use unioned filled outlines; group/matrix cases still need representation proof.

## Initial transform-release verification — historical

Published from `890b9a8afe9198365dac6606bf56ca56aaee12c6` at https://slate-web.iiankehn.com/ . [PR #20 verification](https://github.com/iiankehn/slate-forge-web/actions/runs/41914345731) and [main CI](https://github.com/iiankehn/slate-forge-web/actions/runs/41916632916) passed 544 Node tests and all 140 browser scenarios without retries. [Pages promotion](https://github.com/iiankehn/slate-forge-web/actions/runs/41918905404) deployed the successful main artifact without rebuilding or rerunning browsers. Verified 45 live shell/worker URLs and cache digest `b010212a4d776036`.

Bounded native ODF rotation/X skew now works for basic shapes and PNG/JPEG pictures; uniform opaque text boxes support rotation. Vertical picture flips use a half-turn plus horizontal mirroring that survives the available LibreOffice resave. Explicit group positioning fixes the blank initial rendering found during exchange testing. Whole image files/metadata remain embedded, and storage/origins, preview alternatives and the confirmed mobile fix remain intact. **Next: the remaining bounded stroke/group transform cases**, in [ROADMAP.md](ROADMAP.md); do not claim arbitrary matrices, groups or mirrored/skewed text are supported.

Promoted `static-site` artifact 13366171294; archive SHA-256 `ec5a7860f63f2d4fd4edf1a276851febb16de074bc31ff546e75d33d068aa01d`. Final PR source `9ed59b274df904eb6b54807ca61937afdc03199b`. Pages job steps contain artifact retrieval/provenance validation, upload and deployment only. Live cache verification reconciles the known platform-specific notices difference. Final documentation bookkeeping changes no runtime bytes.
