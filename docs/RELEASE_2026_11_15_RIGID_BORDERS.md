# Rigid bordered-contour ODT release — November 15, 2026

Published at https://slate-web.iiankehn.com/ through PR #35. Runtime: `dc926eaea040715f0068f3b861951158ff566555`.

Native ODT now preserves rigid rotation/reflection of straight-segment bordered contours as editable paths, retaining constant-width round borders, fill, holes, opacity and supported nested group hierarchy. Eight actual raw/control Writer-resaved contours retain all 60 source vertices within .14285 unit and borders within .1 unit. Independent raw/native rendered ink agrees within one pixel at 144 DPI; the renders are not pixel-identical. Four generated XML parts pass core ODF 1.3. Exact integer-boundary equality avoids a false XOR-sliver refusal without accepting unequal fill rules.

## Exact release evidence

- PR source: `e7f78b99243d143609c14474ec3f6445f699a99a`; [PR verification 43670387334](https://github.com/iiankehn/slate-forge-web/actions/runs/43670387334).
- Runtime: `dc926eaea040715f0068f3b861951158ff566555`; [main verification 43671937605](https://github.com/iiankehn/slate-forge-web/actions/runs/43671937605).
- Both required gates passed **714 Node tests and 245 browser scenarios without retries**, production build and static packaging.
- [Pages promotion 43673306080](https://github.com/iiankehn/slate-forge-web/actions/runs/43673306080) reused exact main artifact `14144513795` without rebuilding or repeating browsers.
- Archive SHA-256: `b11e69d8db751d74bdddf77d8f4f4968b36d9a06656e334f6ff19c3c857322bc`; archive bytes: 50263001. Extracted: 284 files / 88429176 bytes.
- All 56 checked live shell/worker URLs byte-match the artifact; worker cache digest `604a77522bd67826` reconciles.

## Behavior and bounded evidence

Rigid path rotation/reflection preserves stroke width, so native export now bakes those transforms into contour vertices while retaining ordinary round borders. Import reads current measured rigid matrices/lists, validates explicit round joins and projects current vertices. Source state is not restored. A one-millimetre native edit moves the reopened contour by the expected 5.625 canvas units within the model's .1-unit coordinate quantization. Re-export contains ordinary editable paths, with no matrix, preview image or private scene part. The source model remains unchanged.

Eight independent raw/control contours cover holes, border-only paint, 2/5/8/12-unit borders, rotation, both reflection axes, opacity and two-level opaque groups. Separate fresh isolated LibreOfficeDev 26.8 alpha profiles resaved/rendered raw measured matrices and projected native paths. All 60 source vertices remain within .3 unit: maximum .07950 fresh, .14285 raw resave and .14143 native resave. Border-width change is at most .1 unit, within the existing .15-unit stroke tolerance. Paint and hierarchy remain intact. Four input content/styles parts pass core ODF 1.3; mimetype is first and uncompressed.

The 144-DPI raw/native PDF comparison has zero unmatched nonwhite ink beyond one pixel in either direction. Maximum channel difference is 33 and mean .01449; it is not pixel-identical. See [ODT_RIGID_BORDERED_CONTOURS.md](ODT_RIGID_BORDERED_CONTOURS.md) for fixtures and metrics.

Fill parity verification now uses exact equality of integer union boundaries as a direct proof, avoiding numerical slivers caused by repeating XOR on the same slanted edges. Different boundaries still use the bounded existing XOR check; unequal fill rules remain refused. Original edges are preserved, so canonicalizing a fill cannot silently remove visible borders. Five new Node cases cover repeated export, real resaves, current edits, source geometry/paint/hole samples away from the rounding boundary, group membership, fill disagreement and shear/scale/edge/join refusals. The five-profile browser scenario checks download, an actual new-document import, saved reload and HTML reconstruction.

Sheared/scaled borders, custom curves/arrowheads, non-round or unspecified joins on transformed bordered imports, unrepresentable edge/minimum frames and other paint/layout/native-review limits remain explicit. Transformed border paint must fit the canvas. Continue solo under the broader completion mandate and focused security guidance, preserving originals, backups, storage/origins/private Site, fonts and mobile safe areas. No device gate or background watcher; do not impose a new finite freeze.

The local full suite passed 714 cases; final explicit-join guard changes passed all 27 affected cases. The production/static build passed. Focused solo source review used installed security-audit guidance; functional/editor checks ran in an offline OS namespace with allowlisted environment, read-only source/toolchains and bounded scratch/resources. No full multi-agent audit, physical-device or universal Office certification is claimed. Documentation-only follow-up reuses this exact runtime/artifact evidence.
