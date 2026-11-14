# Thin transformed native ODT pictures

Native ODT canvas pictures can now retain rotation, X skew and reflection when their painted frame is between 2 and 20 canvas units thick. The document's editable object still uses the existing minimum 20-unit viewport. Import reconstructs that viewport around the current native picture; source-image placement, crop, opacity and supported opaque group membership survive. Original images and documents are unchanged, and no private original is restored.

## Actual exchange and rendering

The corrected input in `docs/fixtures/odt-thin-pictures/native-input.odt` contains 16 panoramic/portrait pictures across two canvases: 20:1 and 1:20 aspect ratios, 2- and 5-unit painted thicknesses, rotated/skewed/reflected combinations, varied letterbox positions, opacity and an opaque two-picture group. LibreOfficeDev 26.8.0.0.alpha0, build `2c87e51eeaa2b413ff4ae097b2705eea1995d8e5`, opened and resaved it. The committed resave and source model are in `test/fixtures/odt-thin-pictures/`.

All 400 sampled source points stay within the existing .3-unit tolerance: maximum Euclidean distance .06434 on fresh reopening and .22071 after Writer resaving. Both original PNG assets remain byte-identical, all 16 objects remain editable, and another native export/reopen retains placement and opacity. Three additional fresh export/reopen cycles also pass.

An independent control pads each original image into a transparent square at its original pixel resolution. Its native frame stays at the original full viewport size, avoiding the new thin-frame path. Writer rendered both two-page documents to PDF. At 144 DPI, all nonwhite ink in either render lies within two pixels of the other render. Maximum RGB channel differences are 145/147, with means .04893/.03852, reflecting rasterization differences; these renders are **not pixel-identical**. Input/control ODTs, PDFs and exact metrics are retained alongside the input. Four generated content/styles XML parts validate against core ODF 1.3. This is bounded headless Writer evidence, not universal Office or physical-device certification.

## Retained failure and limits

The initial one-unit-thick transformed corpus reopened after a provisional zoom-rounding adjustment, but its independent render lost visible ink. That adjustment was removed. The failed input, Writer resave and PDF remain as `failed-one-unit-*` fixtures. Native export and import now refuse transformed painted frames below 2 units; ordinary untransformed thin-picture behavior remains available. Do not relax this floor based on metadata reopening alone.

The minimum-size exception belongs only to painted picture frames. Ordinary shapes and editable object viewports keep their existing minimum, and transformed corners, canvas bounds, native image/archive budgets, crop/zoom limits and complexity checks remain enforced. Current external geometry, mirroring, opacity and image bytes are read instead of stale source state. Broader picture effects, unsupported formats, paint/layout and native history cases remain explicit in [COMPATIBILITY_INVENTORY.md](COMPATIBILITY_INVENTORY.md).

## Review and verification

Four new Node cases cover 16-picture source-point preservation, repeated export/import, the actual Writer resave and original bytes, retained one-unit failures, ordinary-shape and canvas bounds, hostile dimension edits, and current external picture changes. A five-profile browser scenario downloads and reopens the native file as a new document, saves/reloads it, and checks picture source points, bytes, opacity and group state through HTML output.

Focused source review uses the installed Cloudflare `security-audit` guidance while remaining solo. The changed dimensional exception is a trusted call-site constant; native imports enforce their own picture floor, and the existing numeric, image, archive and transform guards remain. No executable-markup or authorization path is added. The final functional tests and editor/fixture processing run in an offline OS namespace with an allowlisted environment, read-only source/toolchains, bounded scratch storage and process/resource limits. This is a focused source review, not the skill's full multi-agent audit.

## Release state

Implemented on `feat/odt-thin-picture-transforms`; 701 local Node cases pass across the suite and affected OCR rerun, plus production build, static packaging and source whitespace checks. The initial offline suite passed 697 cases but its four-case OCR process could not reserve V8 address space under the first sandbox limits; only those OCR cases were rerun after correcting the validation limits. Product code and assertions were unchanged. Required PR/main browser verification (235 scenarios) and exact-artifact publication remain pending. PR #32 remains the published runtime.
