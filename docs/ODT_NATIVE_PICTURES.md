# Native ODF canvas pictures

Native-canvas ODT export includes bounded embedded PNG/JPEG pictures as actual `draw:frame` / `draw:image` objects, with crop, horizontal/vertical mirroring and image opacity within the [bounded transform extension](ODT_NATIVE_TRANSFORMS.md). Reopening reads current picture bytes, geometry and styles; it does not restore an old private scene. Hidden objects and private scene snapshots are omitted. Preview and retained-original export modes remain available.

Native editable pictures include the **whole original image file**, including cropped-out pixels and metadata. The export dialog explains this. Choose flattened preview export with original-canvas retention off when original image files must be excluded.

## Supported bounds

- PNG and 8-bit grayscale/RGB JPEG, at most 1.5 MB per image, 24,000 pixels per edge and 80 million pixels. Image signatures, PNG chunk CRCs, dimensions and physical density are checked. PNG animations/EXIF and JPEG implicit orientation are refused.
- Crop distances use intrinsic physical dimensions from PNG pHYs or JPEG JFIF/EXIF density, defaulting to 96 DPI. Supported physical crop units are mm, cm, in and pt. Current external stretching is representable through effective aspect ratio.
- Canvas image aspect ratio .05–20, zoom 100–400%, opacity 10–100%. Existing canvas, ZIP and expanded-scene limits remain. Repeated pictures share package bytes but count individually toward the 20 MB expanded picture budget. Each encoded canvas also respects the editor’s existing 15 MB reopening limit on both export and import.
- Contained pictures reopen at their painted bounds; thin painted frames may acquire a minimum 20-unit editing frame while preserving visible placement. Empty letterbox margins are not private layout history.
- Horizontal and vertical picture flips are supported within the [transform bounds](ODT_NATIVE_TRANSFORMS.md). The follow-on uses a half-turn plus horizontal mirroring because direct vertical mirror metadata is discarded by the available LibreOffice build.
- Scene-level title/description survive; canvas grouping/locking and per-picture descriptive metadata are not transferred by this bounded object model.
- Unsupported formats/transforms and page-dependent mirrors, color adjustments, picture frame paint/borders, remote references, unsupported child content and out-of-bounds geometry fail before import/export loses content.

## Evidence

Focused regressions cover original embedded bytes/MIME, current crop/geometry/mirror/opacity edits, JPEG/PNG density, orientation refusal, contain/thin placement, repeated-asset budgets and unsafe/unsupported input. A real headless LibreOfficeDev 26.8.0.0.alpha0 resave is committed as `test/fixtures/odt-pictures-libreoffice-resaved.odt`; it retains the horizontal crop/mirror/opacity case and contained JPEG/thin PNG cases. [Reviewed headless PDF rendering](ui/odt-native-pictures-libreoffice.png) shows the marked quadrant crop and horizontal mirror, contained JPEG and thin PNG. An additional [actual 300 DPI PNG/JPEG resave](fixtures/odt-pictures-300dpi-libreoffice.odt) preserved zoom 150%, crop 25/70, horizontal flip and 70% opacity within .25 logical units. Source content.xml and styles.xml validate against the official ODF 1.3 Relax NG schema.

The browser scenario downloads native ODT, modifies current image opacity, reopens it, saves/reloads device state, exports HTML and opens the actual LibreOffice fixture across the five CI configurations. Headless rendering/resave and browser emulation do not establish Microsoft Word, GUI-editor or physical-device certification.

## Initial picture-release verification — historical

Published native ODF pictures from `f946ef30559d61ad516f91e0ab1b3842476a19d7` at https://slate-web.iiankehn.com/ . PR #19 and [main CI](https://github.com/iiankehn/slate-forge-web/actions/runs/41905448242) passed 537 Node tests and all 135 browser scenarios without retries. [Pages promotion](https://github.com/iiankehn/slate-forge-web/actions/runs/41907698905) deployed that successful main artifact without rebuilding or rerunning browsers. Verified 45 live shell/worker URLs and cache digest `c7223919ff92c3ff`.

PNG/JPEG canvas pictures retain editable crop, horizontal flip and opacity; import reads current native files/styles. Whole image files, including cropped-out pixels and metadata, remain embedded, as the dialog explains. Vertical flips remain preview-only on export because the actual LibreOffice resave discards them. See [ODT_NATIVE_PICTURES.md](ODT_NATIVE_PICTURES.md) for bounds and actual editor evidence. Preserve storage/origins, earlier modes and the confirmed mobile fix. **Next: broader transforms, including a reliable vertical-flip representation**, per [ROADMAP.md](ROADMAP.md).

Final PR verification: [CI 41903114868](https://github.com/iiankehn/slate-forge-web/actions/runs/41903114868), source `32371468c87caee5347f6b559070b27220ee0151`. Superseded/redundant runs were cancelled; only the final successful source counts as release evidence.

Promoted artifact: `static-site` 13361616106, archive SHA-256 `6df3e1bd3e5fa44d59ec500a318663ca39651eca831577a51fd99dd7561c5b5a`. Promotion and deployment jobs succeeded; their steps contain artifact retrieval/provenance validation, upload and deployment only. Live cache verification allows the known platform-specific notices difference and reconciles the digest against those live notices. Final documentation bookkeeping does not change runtime bytes.
