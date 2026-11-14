# Thin transformed native ODT picture release — November 14, 2026

Published at https://slate-web.iiankehn.com/ through PR #33. Runtime: `558a182333ead95a33334ced953f4b3cfcb14655`.

Native ODT picture transforms now support painted frames from 2 canvas units and .35 mm thick at the exported page scale, preserving the 20-unit editable viewport minimum. The 16-picture actual Writer resave keeps all 400 sampled source points within .22071 canvas unit and both original PNGs. An independent padded control bounds all rendered ink differences to two pixels at 144 DPI; the renders are not pixel-identical. Eight generated content/styles XML parts pass core ODF 1.3.

## Exact release evidence

- PR source: `2b6266e24e2a406af323898a2ce76ef3d48ece6b`; [PR verification 43637905866](https://github.com/iiankehn/slate-forge-web/actions/runs/43637905866).
- Runtime: `558a182333ead95a33334ced953f4b3cfcb14655`; [main verification 43639813636](https://github.com/iiankehn/slate-forge-web/actions/runs/43639813636).
- Both required gates passed **703 Node tests and 235 browser scenarios without retries**, production build and static packaging.
- [Pages promotion 43641365732](https://github.com/iiankehn/slate-forge-web/actions/runs/43641365732) reused exact main artifact `14132241999` without rebuilding or repeating browsers.
- Archive SHA-256: `b41ce8729db058305ffce16ae39abc3ce3cfd95e4cfb9d7267641769090449e8`; archive bytes: 50262632. Extracted: 284 files / 88428284 bytes.
- All 56 checked live shell/worker URLs byte-match the artifact; worker cache digest `899e2816e4b1f5e7` reconciles.

## Behavior and evidence limits

Rotated, X-skewed and reflected pictures with painted frames at least 2 canvas units and .35 mm thick at the exported page scale now retain current editable source placement, crop, opacity and supported opaque membership. The object viewport still uses the existing 20-unit minimum. Native import reads current file geometry, mirroring and image bytes; no private original is restored. Ordinary shape/canvas/transform bounds and image/archive budgets remain enforced.

The corrected actual Writer corpus covers 16 wide/tall pictures across two canvases, with 2- and 5-unit painted thicknesses and an opaque group. Maximum sampled Euclidean source-point displacement is .06434 on fresh reopening and .22071 after Writer resaving, within the full-width test’s .3-unit tolerance. Both original PNGs remain byte-identical; another export/import and three fresh cycles pass. Eight generated XML parts validate against core ODF 1.3.

The independent padded-image control uses full-size frames and original pixels. Its two-page 144-DPI render has no unmatched nonwhite ink beyond a two-pixel radius in either direction. Maximum channel deltas are 145/147 and means .04893/.03852; these renders are not pixel-identical. One-unit transformed frames demonstrated visible ink loss despite a provisional metadata repair. Their failed input/resave/PDF remain retained, that repair was removed, and both logical and physical floors are explicit. See [ODT_THIN_PICTURES.md](ODT_THIN_PICTURES.md).

A retained three-column control lost all visible ink at the old logical-only minimum, while its padded control retained 18 pixels. The final physical floor prevents that output. A supported three-column resave has maximum source-point displacement .52804 within the established .7-unit native tolerance; its rendered ink matches the control within one pixel. Canvas-first section bookmarks now preserve page/continuous intent through an empty, attribute-limited, matching-ancestor whitelist. Initial PR run 43636007469 was cancelled as superseded after this narrow-layout failure was established; it is excluded from release evidence.

Solo source review applied Cloudflare security-audit guidance. Final local functional/editor checks used an offline OS namespace, allowlisted environment, read-only source/toolchains and bounded scratch/process resources. The initial local suite passed 697 cases but its OCR process could not reserve V8 address space under the first validation limits. Correcting those limits made all four affected OCR cases pass with no product or assertion changes for that runtime repair; 55 affected format checks then passed after the page-scale and section fixes; unchanged full local checks were reused. Both required source gates above subsequently passed all 703 cases in complete runs. This source review is not the full multi-agent security audit.

Broader native review history, paint, layout and demonstrated subminimum frame limits remain explicit in [COMPATIBILITY_INVENTORY.md](COMPATIBILITY_INVENTORY.md). No physical-device or universal Office certification is claimed. Originals, backups, storage/origins/private Site, fonts and mobile safe areas are preserved. Work remains solo under the broader completion mandate. Documentation-only follow-up reuses this verified runtime/artifact evidence.
