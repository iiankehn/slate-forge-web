# Native ODF canvas pictures

Native-canvas ODT export includes bounded embedded PNG/JPEG pictures as actual `draw:frame` / `draw:image` objects, with crop, horizontal mirroring and image opacity. Reopening reads current picture bytes, geometry and styles; it does not restore an old private scene. Hidden objects and private scene snapshots are omitted. Preview and retained-original export modes remain available.

Native editable pictures include the **whole original image file**, including cropped-out pixels and metadata. The export dialog explains this. Choose flattened preview export with original-canvas retention off when original image files must be excluded.

## Supported bounds

- PNG and 8-bit grayscale/RGB JPEG, at most 1.5 MB per image, 24,000 pixels per edge and 80 million pixels. Image signatures, PNG chunk CRCs, dimensions and physical density are checked. PNG animations/EXIF and JPEG implicit orientation are refused.
- Crop distances use intrinsic physical dimensions from PNG pHYs or JPEG JFIF/EXIF density, defaulting to 96 DPI. Supported physical crop units are mm, cm, in and pt. Current external stretching is representable through effective aspect ratio.
- Canvas image aspect ratio .05–20, zoom 100–400%, opacity 10–100%. Existing canvas, ZIP and expanded-scene limits remain. Repeated pictures share package bytes but count individually toward the 20 MB expanded picture budget.
- Contained pictures reopen at their painted bounds; thin painted frames may acquire a minimum 20-unit editing frame while preserving visible placement. Empty letterbox margins are not private layout history.
- Export supports horizontal picture flips. Vertical flips are explicitly refused: the available LibreOffice build discards standard `style:mirror="vertical"` on resave. The importer can read explicit standard vertical mirroring, but exporting it requires preview until transform support resolves this editor behavior.
- Unsupported formats, rotations/skews, page-dependent mirrors, color adjustments, picture frame paint/borders, remote references, unsupported child content and out-of-bounds geometry fail before import/export loses content.

## Evidence

Focused regressions cover original embedded bytes/MIME, current crop/geometry/mirror/opacity edits, JPEG/PNG density, orientation refusal, contain/thin placement, repeated-asset budgets and unsafe/unsupported input. A real headless LibreOfficeDev 26.8.0.0.alpha0 resave is committed as `test/fixtures/odt-pictures-libreoffice-resaved.odt`; it retains the horizontal crop/mirror/opacity case and contained JPEG/thin PNG cases. Source content.xml and styles.xml validate against the official ODF 1.3 Relax NG schema.

The browser scenario downloads native ODT, modifies current image opacity, reopens it, saves/reloads device state, exports HTML and opens the actual LibreOffice fixture across the five CI configurations. Browser results and publication evidence will be recorded after release checks finish. Headless rendering/resave and browser emulation do not establish Microsoft Word, GUI-editor or physical-device certification.
