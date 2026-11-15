# Affine picture-matrix native ODT release — November 15, 2026

Published at https://slate-web.iiankehn.com/ through PR #34. Runtime: `0d3bc17f6331831ba199c5c2bbe9c29515638546`.

Validated native ODT picture frames now accept bounded standalone measured affine matrices, normalizing nonuniform scale, shear and reflection into existing editable geometry. Native re-export removes raw matrices and preserves current crop, opacity and opaque groups within existing picture-format rules. Fixed-decimal crop/box lengths preserve tiny normalization residues as legal ODF lengths. The 16-picture actual raw/control Writer resaves retain all 400 source points within .14558 unit and all three PNG/JPEG payloads. Rendered ink matches within one pixel at 144 DPI; the renders are not pixel-identical. Six generated XML parts pass core ODF 1.3.

## Exact release evidence

- PR source: `f7c032ba3c51e6d783ad62eedcfc016254a0b9d2`; [PR verification 43662647488](https://github.com/iiankehn/slate-forge-web/actions/runs/43662647488).
- Runtime: `0d3bc17f6331831ba199c5c2bbe9c29515638546`; [main verification 43664296030](https://github.com/iiankehn/slate-forge-web/actions/runs/43664296030).
- Both required gates passed **709 Node tests and 240 browser scenarios without retries**, production build and static packaging.
- [Pages promotion 43665651054](https://github.com/iiankehn/slate-forge-web/actions/runs/43665651054) reused exact main artifact `14142112437` without rebuilding or repeating browsers.
- Archive SHA-256: `d18377052a4d22244ab9e31b6b10436c12280dcd2c2cb2ce4fad651ecee2cd7b`; archive bytes: 50262922. Extracted: 284 files / 88428850 bytes.
- All 56 checked live shell/worker URLs byte-match the artifact; worker cache digest `50af55de1fd327f3` reconciles.

## Behavior and evidence limits

Only validated native-canvas picture frames opt into affine matrices. Decomposed X/perpendicular-Y scales are bounded to .01–100; measured translation, finite coefficients, skew, viewport, page-scale, crop, image and archive bounds remain enforced. Other objects keep the rigid dialect or explicit refusal. No new storage format or private original is introduced. Current matrix edits are read directly, and native re-export uses ordinary dimensions and rotation/skew lists.

The 16-picture raw/control corpus includes nonuniform scale, shear, rotation/reflection, measured units, PNG/JPEG/alpha, stretched aspect ratios, crop/letterboxing, opacity and opaque pairs. Each actual conversion uses its own fresh isolated LibreOfficeDev 26.8 alpha profile. Maximum sampled source-point distance is .05811 on fresh import, .14558 after raw resave and .12656 after native-control resave, within the .3-unit test tolerance. All three original assets remain byte-identical. The two-page 144-DPI raw/control render has no unmatched nonwhite ink beyond one pixel. Maximum channel deltas are 125/157 and means .01865/.02303; the renders are not pixel-identical.

Writer changes vertical/both mirror styles in the retained original-raw failure. Slate Forge honors declared source geometry and warns about this representation. Its normalized native output has a passing actual resave within .12656 unit. Already changed files import their current native state; lost mirror information cannot be invented. The first batched control contained enormous invalid offsets and remains rejected, with no loosened coordinate limit. Accepted controls instead use independent fresh profiles. See [ODT_AFFINE_PICTURES.md](ODT_AFFINE_PICTURES.md) for fixtures and bounds.

Tiny QR residues exposed invalid scientific-notation clip lengths. Fixed-decimal output repairs their legal representation without dropping crop values. Six generated content/styles parts validate against core ODF 1.3; accepted raw packages store mimetype first and uncompressed. Six new Node cases cover math, current state, repeat export, real resaves, mirror normalization, malformed inputs and unchanged other-leaf guards. The five-profile browser case verifies raw import, normalized download, new-document reopen, saved reload and source-point/image/group state.

Solo source review used the installed security-audit guidance. Functional/editor checks used an offline OS namespace, allowlisted environment, read-only source/toolchains and bounded scratch/resources; no full multi-agent audit is claimed. Originals, backups, storage/origins/private Site, fonts and mobile safe areas are preserved. Broader compatibility limits remain in [COMPATIBILITY_INVENTORY.md](COMPATIBILITY_INVENTORY.md). No physical-device or universal Office certification is implied. Documentation-only follow-up reuses this exact runtime/artifact evidence.
