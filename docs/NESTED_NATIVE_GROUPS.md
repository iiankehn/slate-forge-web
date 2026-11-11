# Nested editable canvas groups — November 11, 2026

Implemented on `feat/nested-native-groups`, stacked on the preserved PR #26 checkpoint. Published through PR #28; see [published release evidence](RELEASE_2026_11_11.md). This closes the loss of nested opaque group hierarchy; it does not enable arbitrary ODF group transforms or effects.

Canvas objects retain an optional outer-to-inner `groupPath` of up to eight levels alongside the legacy outermost `group`. Existing single-group documents retain their behavior. Selection/movement still operate on the outer group. Group adds an outer level; Ungroup removes one level, exposing existing subgroups. Duplication regenerates every group ID independently. Fresh editable sharing copies regenerate every surviving hierarchy ID and omit hidden-only membership. Version, storage identifiers, origins and backup envelopes are unchanged. Older app builds can read the outer membership but do not retain the additional hierarchy.

Native ODT writes ordinary nested `draw:g` containers with absolute child geometry and no raw group transforms. Import checks graphic style provenance, attributes, text inheritance and opacity at every ancestor. Native DOCX exports the corresponding nested shape groups; import projects child geometry while preserving hierarchy. Internal affine leaf wrappers are excluded from user grouping. Export refuses nonadjacent/reopened membership or conflicting parentage rather than moving paint layers. There are limits of 100 groups and 100 visible objects per canvas. ODF grouped leaves remain opaque.

## Exchange evidence

LibreOfficeDev `26.8.0.0.alpha0`, build `2c87e51eeaa2b413ff4ae097b2705eea1995d8e5`, opened and resaved [the native input](fixtures/odt-nested-groups-input.odt) using an isolated headless profile. The committed resave is `test/fixtures/odt-nested-groups-libreoffice-resaved.odt`; its source is `test/fixtures/odt-nested-groups-source.json`.

All 24 objects, six user groups across three levels, sibling order, editable uniform text, exact PNG/JPEG bytes and path samples survive the actual editor resave and subsequent app-native re-export. Maximum reopened frame/rotation/stroke-width delta is .1 canvas unit; maximum visible sampled-path vertex delta is .1 unit, below the existing .7-unit tolerance. Tests also cover eight levels, ninth-level rejection, ancestor paint/text/transform refusals, reparented/separated membership, sharing cleanup, UI group/ungroup/duplicate/undo, and DOCX reopening with affine leaf wrappers.

The five-profile browser scenario adds native download, reopen, device-save/reload and HTML reconstruction. It passed required PR/main CI in all five profiles; local browser automation remained policy-blocked. This evidence does not certify Microsoft Word rendering.

## Local validation

All 642 Node cases pass (85.45 seconds), including the hierarchy, UI, redaction, legacy formats, saving/recovery and backup regressions. Production build, static packaging (284 files, 84.3 MiB), browser-source syntax and source whitespace checks pass. The final release passed 656 Node tests and all 210 browser scenarios on both PR/main without retries. See [published release evidence](RELEASE_2026_11_11.md). The previous PR #26 checkpoint remains preserved.

## Confirmed exchange limits

A separate [input probe](fixtures/odt-effect-boundary-input.odt) uses a reflected text frame, an X-skewed text frame, and overlapping red/blue shapes inside a 50%-opacity group. The same LibreOffice build renders all three text lines upright with text direction `(1, 0)` and paints the rectangles fully saturated. Resaving drops both text-frame transform attributes. Retained evidence: `test/fixtures/odt-effect-boundary-libreoffice-resaved.odt` and [rendered PDF](fixtures/odt-effect-boundary-rendered.pdf).

This is a failed representation probe, not feature acceptance. Native ODF mirrored/skewed text and group compositing remain refused. Enabling attributes that this editor discards would silently change output; distributing opacity among overlapping leaves would also produce different colors. Preview output and retained-scene formats remain available. The result applies to this tested representation/editor, not to every possible ODF implementation. Mixed rich text, broader affine strokes, structural revisions and other named inventory cases remain separate work.
