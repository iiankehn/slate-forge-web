# Native ODF strokes


Published 2026-11-04: this Word/ODT continuation extends native ODT canvas mode to lines, triangular arrows, straight-segment paths and filled contours. Lines/arrows use `draw:line`; open paths use `draw:polyline`; filled/pressure geometry uses `draw:path` and standard marker definitions. Hidden objects, PNG previews and private original-canvas data are absent in native mode. Line/arrow axis flips are supported. Pictures, rotations/skews and other transforms remain outside this mode.

Pressure strokes become editable filled contours rather than pressure samples. A bounded integer polygon union preserves nonzero fill while removing overlap gaps seen in LibreOffice's path renderer. Disjoint regions and real holes are retained. Filled contours with visible strokes are accepted only when even-odd and nonzero filling agree, so geometry processing cannot silently remove visible interior stroke edges. The pinned Clipper library is distributed under Boost Software License 1.0; its attribution, complete license and included JSBN permission notice are retained in THIRD-PARTY-NOTICES.txt.

Import reads current endpoints, points, contours, paint and supported arrowhead geometry. LibreOffice can rewrite a flat round-capped polyline into a line or a single contour into a polygon; these reopen as editable path objects. Reconstructed thin paths use the existing minimum 20-unit canvas frame while preserving their ink coordinates. Arrowheads must match the supported triangular marker and size relation; custom heads, start markers, curves/arcs, multiple open subpaths, incompatible caps/joins and unsupported fill rules are refused before adding the document. Native line/arrow objects require both endpoint extents to fit the existing minimum object dimensions; flat round-capped paths are supported separately. Use preview/original-canvas retention or an HTML/workspace backup for unsupported cases.

Bounds: existing 50 canvases/100 objects, 2,000 points per open path, 44,000 contour points per object and 500,000 geometry points per canvas. Pressure conversion accepts up to 512 input points. Boolean processing accepts 12,000 input contour points per object, 50,000 per canvas and 100,000 intersection-processing events; excess complexity refuses export. Converted scene markup is bounded to 20 MB, and existing packed/expanded archive limits remain enforced. Original storage identifiers, databases, backup formats, host identities and the confirmed mobile safe-area fix are unchanged.

## Format-revision investigation

[ODF 1.3 part 3 §5.5.6](https://docs.oasis-open.org/office/OpenDocument/v1.3/os/part3-schema/OpenDocument-v1.3-os-part3-schema.html) says that `text:format-change` represents a formatting change, but explicitly notes that the element does not contain the formatting changes that took place. Its only child is `office:change-info`. Standard metadata alone therefore cannot recover the previous marks for a reliable Reject action. Native formatting/structural revision refusal remains; no invented previous formatting or misleading accept/reject behavior was added. A future app-specific history snapshot would be a separate feature, not standard native ODF rejection fidelity.

## Verification

Nine new format regressions cover native primitives without private data, flipped arrows and effective zero-width shafts, current edited geometry, linear SVG syntax and invalid curves, altered arrow markers, actual LibreOffice resaves, geometry budgets, overlap/real-hole preservation and thin path rewrites. Existing native basic-shape tests remain. Two synthetic ODT files were actually resaved by LibreOfficeDev 26.8.0.0.alpha0 (`2c87e51eeaa2b413ff4ae097b2705eea1995d8e5`); their outputs are committed as `test/fixtures/odt-strokes-libreoffice-resaved.odt` and `test/fixtures/odt-thin-libreoffice-resaved.odt`.

Generated content/styles pass the official ODF 1.3 Relax NG schema. A LibreOffice PDF rendering was visually reviewed; it exposed pressure overlap gaps, which the contour union corrected before release. Browser coverage adds actual native-stroke download, editing a native polyline, save/reload, HTML export and the LibreOffice fixture across five configurations. [PR #17](https://github.com/iiankehn/slate-forge-web/pull/17) and the final main/Pages runs passed 529 Node tests and all 130 browser scenarios without retries. These are limited development-runtime checks, not Microsoft Word, stable LibreOffice GUI, physical-device or printer certification.

## Remaining limits

Native pictures and broader affine transforms, edited curves, arbitrary external groups, custom arrowheads, advanced mixed text formatting, native formatting/structural revisions and broader target-editor QA remain open. Preview and original-canvas modes preserve the wider model.

## Validated source and render

The final PR run is https://github.com/iiankehn/slate-forge-web/actions/runs/41859218463 . Final full CI passed 529 Node tests and all 130 browser scenarios without retries; both release verification logs independently confirm the same totals. A local fixture helper initially assumed a leading paragraph in every test file; it was corrected for the canvas-only thin-path fixture, and all 16 affected format cases passed before final CI. Pressure overlap gaps were found and fixed before validation.

[Reviewed final LibreOffice rendering](ui/odt-native-strokes-libreoffice-render.png) shows the line, flipped arrow, open polyline and pressure ink without overlap gaps. The Boost and JSBN notices are bundled. This is synthetic headless development-runtime evidence, not stable-editor GUI, Word, printer or physical-device certification.

## Publication evidence

Published 2026-11-04 from `ffbec7cfadd668fbfca3a026951e2f622ce15209` at https://slate-web.iiankehn.com/ . Native ODF mode now exports/reopens lines, supported triangular arrows, straight-segment paths and pressure-derived filled contours. Bounded polygon union removes LibreOffice pressure-overlap gaps; flat-path rewrites and current native edits remain editable. [main CI](https://github.com/iiankehn/slate-forge-web/actions/runs/41861651898) and [Pages](https://github.com/iiankehn/slate-forge-web/actions/runs/41861664906) passed 529 Node tests, production/static checks and all 130 browser scenarios without retries. Verified 45 live shell/worker URLs and reconciled cache digest `bd1c60e2117542ac` against platform-specific notices. See [ODT_NATIVE_STROKES.md](ODT_NATIVE_STROKES.md) for geometry/work limits, actual LibreOffice resaves/rendering and the standards-based native formatting-rejection limitation. Storage/origin identities, earlier export modes and the confirmed mobile fix are preserved.

PR CI: https://github.com/iiankehn/slate-forge-web/actions/runs/41859218463 . Before final validation, a local fixture helper incorrectly assumed every file had a leading paragraph; the thin-path fixture contains only a canvas. The helper was corrected and the affected 16 format cases passed. Pressure overlap gaps were reproduced by a real LibreOffice PDF render and fixed before publication; topology tests verify overlap removal and real-hole preservation. The complete Boost/JSBN notices are bundled.

[Reviewed final LibreOffice rendering](ui/odt-native-strokes-libreoffice-render.png) shows the line, flipped arrow, open polyline and pressure ink between the surrounding paragraphs. The final pressure ink has no overlap gaps. This is a synthetic development-runtime sample, not physical-printer, stable-editor GUI, Word or device certification.
