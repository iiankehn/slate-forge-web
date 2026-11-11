# Opaque heterogeneous ODF groups — published

The reopened compatibility batch supports adjacent one-level opaque groups containing rectangles, ellipses, uniform text, PNG/JPEG pictures, bounded paths and lines/arrows. Existing leaf readers enforce their individual geometry/paint limits. Group membership and layer order remain editable. Named or inherited group text/paragraph overrides refuse text membership; final picture opacity is checked after decoding its graphic style. Raw group transform attributes, deeper nesting, group effects and separated membership remain explicit refusals.

The flat scene carries each child's current position/rotation. Translation and rotation can be baked into those children before native export, using existing native child geometry helpers and an ordinary membership group. No raw group-transform attribute is emitted or claimed interchangeable. Reflection/shear/scale and other unsupported text/stroke cases retain their existing bounds.

## Actual editor evidence

Adversarial executed exactly one initial and one corrected headless Writer resave using LibreOfficeDev `26.8.0.0.alpha0`, build `2c87e51eeaa2b413ff4ae097b2705eea1995d8e5`. The corrected input changed representation in response to observed failures; it was not a retry of unchanged input.

The initial [input](fixtures/odt-heterogeneous-raw-group-input.odt), [resave](fixtures/odt-heterogeneous-raw-group-resaved.odt) and [comparison](fixtures/odt-heterogeneous-raw-comparison.json) exposed two failures:

- Writer removed raw nested group translation/rotation without applying them to children. Intended transformed world deviations reached 8.645058 mm. Those raw attributes stay refused.
- Writer rebased a polyline's normalized y extent `.2.. .9` and shrank its height while retaining its old y origin, shifting its vertices about 14 logical units. This was a real geometry defect, not rounding tolerance.

Native path XML now uses its occupied frame: the origin moves by the minimum vertex offset, dimensions shrink to the occupied extent, and vertices rebase to that frame. Horizontal/vertical open sampled paths use round-cap native lines at their true endpoints and reopen as editable paths; a zero-area point-only path is refused. The workspace scene remains unchanged.

The [corrected input](fixtures/odt-heterogeneous-baked-groups-input.odt) retains the same formerly failing inset path. Its [actual resave](../test/fixtures/odt-heterogeneous-baked-groups-libreoffice-resaved.odt) contains three groups of rectangle→ellipse→text→PNG→JPEG→path→line, a fourth horizontal/vertical path group, and a trailing ungrouped rectangle. Group B uses baked translation; C uses baked centers/child rotations. Raw group attributes are absent. [Full comparison](fixtures/odt-heterogeneous-baked-comparison.json) and [source world-vertex checks](fixtures/odt-heterogeneous-source-world-check.json) retain the measurements.

All child geometry differs by at most `0.01967005 mm` (about `.11149` logical units), within the existing `.7`-unit regression tolerance. Original logical path/axis vertices differ by at most `0.00730799 mm`. Axis endpoints and round caps survive. Order, meaningful text, effective paint/crop/mirror and exact PNG/JPEG payload hashes survive. Writer moves text styling into a `T1` span: Arial, color and normal emphasis remain; `11.00247469 pt` rounds to `11 pt`, with `125%` line height. Paragraph defaults alone do not describe effective text styling.

The committed native reopen regression checks all 24 editable objects, painted styles, grouping/order, text/fonts, image bytes and source path/line world vertices through another native export. A named-text-override negative fixture is generated separately and was not resaved. Focused regressions also cover translucent picture refusal, unsupported raw transforms, thin/axis paths and inherited named text overrides. Actual browser-download verification passed in all five required profiles on PR/main. See [published release evidence](RELEASE_2026_11_11.md). This is bounded headless exchange evidence, not GUI/device or universal Microsoft Word certification.
