# Static GIF and WebP in native ODT

Native ODT canvas export accepts static GIF and static WebP alongside PNG/JPEG. GIF bytes remain embedded as editable pictures. WebP is decoded on this device to a full-resolution PNG before embedding, preserving editable crop, mirroring, rotation, opacity and supported opaque groups. The original document, source image and retained-review HTML are not changed. Export guidance discloses the conversion and whole-image retention; cropped-out pixels remain in the output image. Use redacted sharing copies for pixel removal.

## Why WebP is normalized

The initial raw-WebP probe failed. Writer converted WebP to PNG when saving, recording approximately 72 DPI, while rendering cropped raw WebP against a different preferred physical size. A 96-DPI crop initially reopened at 133.3% instead of 150%; substituting 72 DPI repaired metadata reopening but failed the independent rendered comparison. Neither raw representation is accepted evidence. The retained failed input/resave in `docs/fixtures/odt-static-pictures/failed-density-input.odt` and `test/fixtures/odt-static-pictures/failed-density-resaved.odt` preserve the first failure. Do not re-enable cropped raw WebP based only on round-trip metadata.

The correction exports decoded PNG pixels with the PNG's actual preferred size. New native exports contain PNG/GIF assets, not raw WebP. Raw WebP encountered in a native import is allowed only without cropping; cropped raw WebP explicitly refuses because editor density is ambiguous. The current native pixels are always read; there is no private original restoration.

## Actual editor evidence

LibreOfficeDev 26.8.0.0.alpha0, build `2c87e51eeaa2b413ff4ae097b2705eea1995d8e5`, opened and resaved the corrected six-picture input. It covers lossy/lossless WebP, both alpha encodings, opaque/transparent GIF, crop/150% zoom, horizontal reflection, ±15-degree rotation, 70% opacity and an opaque two-picture group. All six editable objects retain geometry and crop within the existing .3-unit regression tolerance. The two GIF assets remain byte-identical. Writer deduplicates identical decoded alpha pictures into one PNG asset; all six objects remain.

The corrected native input and an independently generated all-PNG control were each rendered to PDF by Writer. Their one-page RGB renders at 144 DPI are pixel-identical: maximum channel delta 0, mean delta 0. Input/control ODTs, rendered PDFs and comparison JSON are retained in `docs/fixtures/odt-static-pictures/`. Four generated content/styles XML parts validate against core ODF 1.3. This is actual headless Writer evidence, not interactive Word or physical-device certification.

## Bounds and failure behavior

The container reader accepts one full-frame static GIF image, supported palette/transparency/interlace, static VP8/VP8L WebP and bounded VP8X/ALPH data. It refuses animation, GIF application/plain-text extensions, nonsquare pixels, partial GIF frames, WebP orientation/color/XMP metadata, inconsistent dimensions, malformed chunks and trailing bytes. Existing MIME/extension, image/file/decoded-size, drawing bounds, crop and effect guards remain enforced.

WebP preparation validates the complete container before browser decoding. Each decoded image is limited to 24 megapixels and the unique-image preparation batch to 60 megapixels; each prepared PNG must fit the existing 1.5 MB image limit and match the original dimensions. Repeated source images are prepared once; hidden objects are omitted. Map entries commit only when preparation completes successfully. Converted PNG bytes count toward the existing 15 MB per-canvas and 20 MB aggregate reopening limits, including repeated visible occurrences. Failed preparation/export cannot mutate the original. Closing the export dialog or switching documents/workspaces prevents a late ODT download.

Nine new Node cases cover formats, actual resave, native current-file edits, malformed/animated containers, atomic preparation, preservation and expanded-output budgets. A five-profile browser scenario starts from original WebP/GIF canvas data, downloads native PNG/GIF ODT, waits for a new imported document, saves/reloads it, and checks editable picture content and crop/group state.

## Release state

Implemented on `feat/odt-static-picture-formats`; all 697 Node tests, production build, static packaging and source whitespace checks pass locally. Required PR/main browser verification (230 scenarios) and exact-artifact publication remain pending. PR #31 is the published baseline. Broader paint, frame effects, mixed rich text, native history and layout cases remain explicit in [COMPATIBILITY_INVENTORY.md](COMPATIBILITY_INVENTORY.md).
