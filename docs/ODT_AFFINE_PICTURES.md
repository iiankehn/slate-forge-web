# Affine matrices on native ODT pictures

Native-canvas ODT imports now accept a standalone measured affine matrix on a validated picture frame. Nonuniform scale, X shear, rotation and reflection normalize into the existing editable image geometry. Native export writes ordinary frame dimensions and rotation/skew lists, without retaining raw matrices or private originals. Original picture payloads, current crop, opacity and supported opaque membership remain intact.

The extension is picture-only. Shapes, text, strokes and groups keep their existing rigid-matrix or refusal rules. Nonuniform transform lists, mixed matrix/list syntax and nonzero unitless translations remain refused.

## Dialect and bounds

The first four coefficients are finite numbers with magnitude at most 10,000. Their decomposed X and perpendicular Y scales must each lie between .01 and 100, and existing skew, canvas, frame, crop and image bounds still apply. Singular matrices refuse. Translation uses explicit decimal `mm`, `cm`, `in` or `pt`; exact unitless zero remains allowed. This measured dialect follows the existing [rigid leaf matrix](ODT_RIGID_LEAF_MATRICES.md) evidence rather than guessing what nonzero unitless translations mean.

Only the validated `draw:frame`/`draw:image` branch enables affine parsing. Mixed text/image frames, unsupported picture paint, raw group transforms, unsafe image references and invalid archive/model data remain refused. Native import reads current matrix values and file bytes. No source-state restoration or storage-format migration is added. The 20-unit editable viewport and transformed-picture logical/physical minimums remain enforced.

Small QR-normalization residues exposed a length-serialization defect: scientific notation such as `1e-7mm` is not a valid ODF clip length. Picture crop and native-box lengths now use fixed decimal output, including those tiny values. Repeated import/export remains schema-valid without discarding legitimate crop values.

## Actual editor evidence

The accepted raw input and native control in `docs/fixtures/odt-affine-pictures/` contain the same 16 pictures across two canvases. Cases cover nonuniform matrices, shear, rotation, negative determinants, measured translation units, PNG/JPEG and alpha payloads, stretched aspect ratios, crop/letterbox positions, opacity and opaque pairs. Each editor conversion uses a fresh isolated profile.

LibreOfficeDev 26.8.0.0.alpha0, build `2c87e51eeaa2b413ff4ae097b2705eea1995d8e5`, resaved both inputs. All 400 sampled source points stay within the .3-unit regression tolerance: maximum Euclidean displacement .05811 for fresh raw import, .14558 after raw-matrix resave and .12656 after native-control resave. All three original image assets remain byte-identical. Repeated normalized export/reopen passes, with no raw matrix or private scene part in output.

Independent two-page PDF renders at 144 DPI retain all nonwhite ink within one pixel of the control in both directions. Maximum RGB channel deltas are 125/157 and means .01865/.02303; the renders are not pixel-identical. Six generated content/styles XML parts validate against core ODF 1.3. Raw/control inputs, resaves, matrix manifest, rendered PDFs and comparison metrics are retained. This is bounded headless Writer evidence, not universal Office or physical-device certification.

## Retained producer failures and normalization route

Writer changes vertical/both mirror styles in the original raw representation. The retained `vertical-mirror-*` case demonstrates that failure, including source-point displacement over 100 units after the direct resave. Slate Forge honors the original file's declared geometry and warns about this mirror representation. Re-exporting native ODT normalizes it to the existing horizontal-mirror/rotation dialect before exchange. The actual `normalized-mirror-*` resave retains the original source points within .12656 unit. A file already changed by another editor imports its current native state; missing mirror information cannot be recovered.

The first batched control resave contained enormous invalid offsets and was rejected. Its stored failure remains `failed-batch-control-resaved.odt`; coordinate limits were not loosened. Accepted controls instead use independent fresh profiles. Neither this failed resave nor the direct vertical-mirror failure counts as passing interchange evidence.

## Verification and release

Six new Node cases cover explicit opt-in at the picture branch, parser units/ranges, 400 source points, repeat export, three actual resave paths, original image bytes, current native edits, malformed/degenerate/excessive matrices, other-leaf/group restrictions, mixed content, mirror warnings and rejection of the failed control. A five-profile browser scenario imports the raw file, downloads normalized native ODT, waits for a new imported document, saves/reloads it and checks image bytes, source-point placement, opacity and groups through HTML output.

Focused source review follows the installed Cloudflare security-audit guidance while staying solo. The parser flag is selected by validated element type, not document attributes; finite scales, explicit units, numeric/layout/image budgets and the other paint/model guards remain. Final functional/editor checks run in an offline OS namespace with allowlisted environment, read-only checkout/toolchains and bounded scratch/resources. This is guidance-mode review, not the full multi-agent audit.

Implemented on `feat/odt-affine-picture-matrices`; all 709 Node tests, production build, static packaging and source whitespace checks pass locally. Accepted raw fixtures store the mimetype member first and uncompressed; six affected checks pass after refreshing that package metadata. Required PR/main browser verification (240 scenarios) and exact-artifact publication remain pending. PR #33 remains published. Broader paint, text/stroke/group affine, layout and native-review cases remain explicit in [COMPATIBILITY_INVENTORY.md](COMPATIBILITY_INVENTORY.md).
