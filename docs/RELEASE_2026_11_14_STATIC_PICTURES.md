# Static GIF/WebP native ODT release — November 14, 2026

Published at https://slate-web.iiankehn.com/ through PR #32. Runtime: `43310f89b995d5b59b35e4eb015b887f82088944`.

Static GIF and WebP canvas pictures now export through native editable ODT. GIF retains original bytes; WebP becomes full-resolution PNG for reliable editable crop. Originals and retained-review HTML are unchanged. The corrected six-picture actual Writer resave preserves crop, geometry, rotation, mirroring, opacity and opaque membership; its 144-DPI PDF render is pixel-identical to an independent all-PNG control. Four generated content/styles XML parts pass core ODF 1.3 validation.

## Exact release evidence

- PR source: `7570c8d74031991cee208a36bdcc27fc1de7e684`; [PR verification 43628252747](https://github.com/iiankehn/slate-forge-web/actions/runs/43628252747).
- Runtime: `43310f89b995d5b59b35e4eb015b887f82088944`; [main verification 43630236627](https://github.com/iiankehn/slate-forge-web/actions/runs/43630236627).
- Both required gates passed **697 Node tests and 230 browser scenarios without retries**, production build and static packaging.
- [Pages promotion 43632316106](https://github.com/iiankehn/slate-forge-web/actions/runs/43632316106) reused exact main artifact `14128586915` without rebuilding or repeating browsers.
- Archive SHA-256: `017ee9e379f5224fcf48e9ff010169f79aa855dea9352887935f005b6d15e5de`; archive bytes: 50262329. Extracted: 284 files / 88427349 bytes.
- All 56 checked live shell/worker URLs byte-match the artifact; worker cache digest `68f8fe3c30c581b4` reconciles.

## Behavior and limits

WebP is decoded on this device to a full-resolution PNG before native embedding; GIF remains an original-byte static picture. Crop, mirroring, rotation, opacity and supported opaque membership remain editable. Original documents and retained-review HTML are untouched. Whole image pixels remain in the native picture; use the separate redacted sharing workflow for pixel removal. Preparation is bounded and commits image-map entries only after success. Converted output, including repeated occurrences, counts toward existing native reopening limits. Closing the dialog or switching documents/workspaces blocks a late ODT download.

Initial raw-WebP probes failed: a density change that repaired metadata reopening still changed rendered crop. Those failures remain documented and cropped raw-WebP import refuses explicitly. The corrected actual Writer input and independent all-PNG control render identically at 144 DPI, with maximum channel delta 0. The resave retains all six editable picture objects, both original GIF assets and tested geometry/effects/group state; identical decoded alpha pictures share one PNG asset. Nine new Node cases and the five-profile original-input/download/reopen/saved-reload scenario are included in the gate counts above. See [ODT_STATIC_PICTURES.md](ODT_STATIC_PICTURES.md) for fixtures and bounds.

Animation, partial GIF frames, WebP orientation/color metadata, unsupported effects and ambiguous raw-WebP crop remain explicit limits. Broader native history, paint and layout cases remain in [COMPATIBILITY_INVENTORY.md](COMPATIBILITY_INVENTORY.md). No physical-device or universal Office certification is claimed. Originals, backups, storage/origins/private Site, fonts and mobile safe areas are preserved. Work remains solo under the broader completion mandate. Documentation-only follow-up reuses this runtime/artifact evidence.
