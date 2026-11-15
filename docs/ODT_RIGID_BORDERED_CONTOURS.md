# Rigid bordered contours in native ODT

Native ODT export and import now support rotation and reflection of straight-segment closed contours with constant-width round borders. Both filled contours with holes and border-only contours remain editable paths. The native projection bakes rigid geometry into ordinary path vertices and preserves current border color/width, fill, opacity and supported nested group membership. It adds no private original or storage migration.

Sheared borders, scaled foreign strokes, curves, custom arrowheads and unsupported joins remain refused. Rigid projection preserves stroke width; shear would require a different paint representation. Transformed border paint must fit the canvas; projecting the centerline alone cannot justify clipped borders. Existing point/intersection/archive limits and the 20-unit editable frame remain enforced.

## Paint verification

Bordered filled paths must have equal nonzero/even-odd paint before native export. Identical integer union boundaries now prove that equality directly. Applying XOR again to identical slanted boundaries could produce numerical slivers and a false refusal. Unequal boundaries still go through the existing bounded XOR check; unequal fill rules still refuse. Original contour edges remain intact, so canonicalizing a fill cannot remove visible border edges.

## Actual exchange evidence

The eight-contour source fixture contains holes, border-only paint, 2/5/8/12-unit borders, rotation, horizontal/vertical/both reflections, opacity and two-level opaque groups. An independently constructed raw measured rigid-matrix input and a native projected control were each opened/resaved/rendered with fresh isolated profiles in LibreOfficeDev 26.8.0.0.alpha0, build `2c87e51eeaa2b413ff4ae097b2705eea1995d8e5`.

All 60 source vertices remain within .3 unit: maximum .07950 fresh, .14285 after raw resave and .14143 after native-control resave. Maximum border-width change is .1 unit, within the existing .15-unit stroke tolerance. Fill, stroke, opacity and group hierarchy survive. Repeated native export/reopen preserves geometry and holes. No raw matrix, image preview or Slate Forge scene part is emitted.

The independent raw/native PDF comparison at 144 DPI has zero unmatched nonwhite ink beyond one pixel in either direction. Maximum channel difference is 33 and mean .01449; the renders are not pixel-identical. All four input content/styles XML parts validate against core ODF 1.3. Packages store mimetype first and uncompressed. Fixtures, resaves, PDFs, source model and metrics are retained under `docs/fixtures/odt-rigid-bordered-contours/` and `test/fixtures/odt-rigid-bordered-contours/`. This is bounded headless Writer evidence, not universal Office certification.

## Checks and release state

Five new Node cases cover repeated export, real raw/control resaves, source geometry, hole coverage away from the rounding boundary, paint and nested groups, current translation edits, unequal fill rules and preserved shear/scale/edge/join refusals. Existing reflection/stroke cases now distinguish supported rigid borders from refused nonrigid paint. A five-profile browser scenario checks native download, a new imported document, saved reload and HTML reconstruction of vertices/paint/hierarchy.

PR #35 is merged and live at https://slate-web.iiankehn.com/ from runtime `dc926eaea040715f0068f3b861951158ff566555`. PR CI 43670387334 and main CI 43671937605 each passed 714 Node tests and all 245 browser scenarios without retries. Pages 43673306080 promoted exact main artifact 14144513795 without rebuilding or repeating browsers. All 56 checked live shell/worker URLs byte-match; worker cache digest `604a77522bd67826` reconciles. See [RELEASE_2026_11_15_RIGID_BORDERS.md](RELEASE_2026_11_15_RIGID_BORDERS.md). Local 714-case regression, final 27 affected checks, production/static packaging and whitespace checks passed. Guidance-mode security review stays solo; functional/editor processing runs in the existing offline OS sandbox with allowlisted environment, read-only source and bounded resources. Preserve originals, backups, storage/origins/private Site, fonts and mobile safe areas.
