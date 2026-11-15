# Slate Forge development roadmap

## Active sequential-column continuation

Sequential page-column flow is in development on `feat/sequential-column-flow`; GitHub acceptance is pending. See [SEQUENTIAL_COLUMNS.md](SEQUENTIAL_COLUMNS.md) for supported text sections, persistence, explicit DOCX limits and the fresh normalized Office render gate. This addresses the retained failed balanced projection without claiming arbitrary layout parity.

## GitHub-owned verification mandate — November 15, 2026

The user moved testing to GitHub and reserved Codex for development. This supersedes earlier local test/build/editor-probe instructions, including skill defaults. Work solo. Codex authors code/tests/probes, reviews source, pushes coherent PRs and diagnoses GitHub reports. Do not run routine local Node/Python suites, builds, browser checks, LibreOffice conversions or release-byte probes. Execute them in Actions; use local execution only if the user specifically requests it to diagnose a problem. Never bypass the browser policy.

`chore/github-owned-verification` implements one shared build, parallel browser profiles, Node/tooling/Office jobs, a stable fail-closed `verify` gate, explicit docs-only handling, stale-PR cancellation, and Actions-owned post-deploy byte/cache proof. Read [GITHUB_VERIFICATION.md](GITHUB_VERIFICATION.md). Required PR/main checks and reviewed merges remain; Pages promotes the exact accepted main artifact and performs live verification on GitHub. PR #37 is merged. PR CI 43687642290 and main CI 43688210737 passed the new GitHub-only pipeline: 723 Node regressions, 20 tooling-policy tests, all 250 browser scenarios across five parallel profiles, and four fresh LibreOffice 24.2.7.2 exchange probes. Browser retry-only passes remain failures. Pages 43688736615 promoted main artifact 14151247002 from source `23fe7078146c1295a6702abac5f3d38a38739298`; GitHub verified all 56 live shell/worker URLs and cache `f9ac5bd25803f1ed` on its first publication check. No local test, build, editor or release-byte suite ran for this work. See [RELEASE_2026_11_15_GITHUB_VERIFICATION.md](RELEASE_2026_11_15_GITHUB_VERIFICATION.md). Product behavior remains the PR #36 feature baseline; app/build inputs, storage formats and origins are unchanged. Preserve originals, backups, storage/origins/private Site, fonts and mobile safe areas.

## Published master-page orientation continuation — November 15, 2026

PR #36 is merged and live at https://slate-web.iiankehn.com/ from runtime `3ecc0bb8eca2612fa2899cd495ae1a29466fd36a`. PR CI 43676895517 and main CI 43678207478 each passed 723 Node tests and all 250 browser scenarios without retries. Pages 43684656595 promoted exact main artifact 14147094969 without rebuilding or repeating browsers. All 56 checked live shell/worker URLs byte-match; worker cache digest `f9ac5bd25803f1ed` reconciles. See [RELEASE_2026_11_15_MASTER_PAGES.md](RELEASE_2026_11_15_MASTER_PAGES.md).

Compatible top-level single-column ODT master-page orientation switches now reopen as existing editable sections, preserving portrait → landscape → portrait content order, common furniture and sequential numbering. Native heading export repeats both inherited margin defaults to repair a demonstrated 12-point shift; supported custom bottom spacing still wins. A corrected three-page raw/control/normalized Writer corpus has pixel-identical 144-DPI renders. Eight accepted generated XML parts pass core ODF 1.3. A plain empty terminal section caret no longer creates an extra preview/ODT page; editing and storage remain unchanged. A landscape-ending two-page actual probe retains its final orientation. Planning is bounded to 100 runs and 100,000 nodes before rendering. Read [ODT_MASTER_PAGE_RUNS.md](ODT_MASTER_PAGE_RUNS.md).

A separate sequential-column projection failed rendered flow and remains retained with a specific fallback warning. Mixed paper/furniture, page-number restarts and nested assignments keep explicit fallbacks; existing text sections and native review histories retain their previous import paths. Broader paint, native history and exact-layout cases remain in the inventory. Continue solo under the broader completion mandate, preserving originals, backups, storage/origins/private Site, fonts and mobile safe areas. No device gate or background watcher; do not impose a new finite freeze.

## Published rigid bordered-contour continuation — November 15, 2026

PR #35 is merged and live at https://slate-web.iiankehn.com/ from runtime `dc926eaea040715f0068f3b861951158ff566555`. PR CI 43670387334 and main CI 43671937605 each passed 714 Node tests and all 245 browser scenarios without retries. Pages 43673306080 promoted exact main artifact 14144513795 without rebuilding or repeating browsers. All 56 checked live shell/worker URLs byte-match; worker cache digest `604a77522bd67826` reconciles. See [RELEASE_2026_11_15_RIGID_BORDERS.md](RELEASE_2026_11_15_RIGID_BORDERS.md).

Native ODT now preserves rigid rotation/reflection of straight-segment bordered contours as editable paths, retaining constant-width round borders, fill, holes, opacity and supported nested group hierarchy. Eight actual raw/control Writer-resaved contours retain all 60 source vertices within .14285 unit and borders within .1 unit. Independent raw/native rendered ink agrees within one pixel at 144 DPI; the renders are not pixel-identical. Four generated XML parts pass core ODF 1.3. Exact integer-boundary equality avoids a false XOR-sliver refusal without accepting unequal fill rules. Read [ODT_RIGID_BORDERED_CONTOURS.md](ODT_RIGID_BORDERED_CONTOURS.md).

Sheared/scaled borders, custom curves/arrowheads, non-round or unspecified joins on transformed bordered imports, unrepresentable edge/minimum frames and other paint/layout/native-review limits remain explicit. Transformed border paint must fit the canvas. Continue solo under the broader completion mandate and focused security guidance, preserving originals, backups, storage/origins/private Site, fonts and mobile safe areas. No device gate or background watcher; do not impose a new finite freeze.

## Published affine-picture continuation — November 15, 2026

PR #34 is merged and live at https://slate-web.iiankehn.com/ from runtime `0d3bc17f6331831ba199c5c2bbe9c29515638546`. PR CI 43662647488 and main CI 43664296030 each passed 709 Node tests and all 240 browser scenarios without retries. Pages 43665651054 promoted exact main artifact 14142112437 without rebuilding or repeating browsers. All 56 checked live shell/worker URLs byte-match; worker cache digest `50af55de1fd327f3` reconciles. See [RELEASE_2026_11_15_AFFINE_PICTURES.md](RELEASE_2026_11_15_AFFINE_PICTURES.md).

Validated native ODT picture frames now accept bounded standalone measured affine matrices, normalizing nonuniform scale, shear and reflection into existing editable geometry. Native re-export removes raw matrices and preserves current crop, opacity and opaque groups within existing picture-format rules. Fixed-decimal crop/box lengths preserve tiny normalization residues as legal ODF lengths. The 16-picture actual raw/control Writer resaves retain all 400 source points within .14558 unit and all three PNG/JPEG payloads. Rendered ink matches within one pixel at 144 DPI; the renders are not pixel-identical. Six generated XML parts pass core ODF 1.3. Read [ODT_AFFINE_PICTURES.md](ODT_AFFINE_PICTURES.md).

Original vertical/both mirror styles have a retained direct-Writer failure; import warns, and native normalization before exchange has a passing actual resave within .12656 unit. An invalid batched control remains rejected; accepted conversions use independent fresh profiles. Other leaves/groups, nonzero unitless translations, mixed lists and existing layout/image/archive bounds keep their guards. Continue solo under the broader completion mandate and focused security guidance, preserving originals, backups, storage/origins/private Site, fonts and mobile safe areas. No device gate or background watcher; do not impose a new finite freeze.

## Published thin-picture continuation — November 14, 2026

PR #33 is merged and live at https://slate-web.iiankehn.com/ from runtime `558a182333ead95a33334ced953f4b3cfcb14655`. PR CI 43637905866 and main CI 43639813636 each passed 703 Node tests and all 235 browser scenarios without retries. Pages 43641365732 promoted exact main artifact 14132241999 without rebuilding or repeating browsers. All 56 checked live shell/worker URLs byte-match; worker cache digest `899e2816e4b1f5e7` reconciles. See [RELEASE_2026_11_14_THIN_PICTURES.md](RELEASE_2026_11_14_THIN_PICTURES.md).

Native ODT picture transforms now support painted frames from 2 canvas units and .35 mm thick at the exported page scale, preserving the 20-unit editable viewport minimum. The 16-picture actual Writer resave keeps all 400 sampled source points within .22071 canvas unit and both original PNGs. An independent padded control bounds all rendered ink differences to two pixels at 144 DPI; the renders are not pixel-identical. Eight generated content/styles XML parts pass core ODF 1.3. Read [ODT_THIN_PICTURES.md](ODT_THIN_PICTURES.md).

One-unit transformed frames lost visible ink; their failed input/resave/PDF remain retained and the provisional zoom adjustment was removed. Import/export keep both logical and physical floors, including narrow column layouts. Empty matching section-mode bookmarks preserve page/continuous intent. Other shape, viewport, canvas, crop, image and archive bounds remain enforced. Continue solo under the broader completion mandate, using focused security guidance for source review; do not impose a new finite freeze. Preserve originals, backups, storage/origins/private Site, fonts and mobile safe areas. No device gate or background watcher.

## Published static-picture continuation — November 14, 2026

PR #32 is merged and live at https://slate-web.iiankehn.com/ from runtime `43310f89b995d5b59b35e4eb015b887f82088944`. PR CI 43628252747 and main CI 43630236627 each passed 697 Node tests and all 230 browser scenarios without retries. Pages 43632316106 promoted exact main artifact 14128586915 without rebuilding or repeating browsers. All 56 checked live shell/worker URLs byte-match; worker cache digest `68f8fe3c30c581b4` reconciles. See [RELEASE_2026_11_14_STATIC_PICTURES.md](RELEASE_2026_11_14_STATIC_PICTURES.md).

Static GIF and WebP canvas pictures now export through native editable ODT. GIF retains original bytes; WebP becomes full-resolution PNG for reliable editable crop. Originals and retained-review HTML are unchanged. The corrected six-picture actual Writer resave preserves crop, geometry, rotation, mirroring, opacity and opaque membership; its 144-DPI PDF render is pixel-identical to an independent all-PNG control. Four generated content/styles XML parts pass core ODF 1.3 validation. Read [ODT_STATIC_PICTURES.md](ODT_STATIC_PICTURES.md).

Raw cropped WebP failed actual density/rendering probes and remains explicitly refused on native import. Animation, WebP orientation/color metadata, partial GIF frames and unsupported picture effects remain explicit limits. Converted PNG bytes count toward existing reopening budgets. Continue solo under the broader completion mandate; do not impose a new finite freeze. Preserve originals, backups, storage formats/identifiers/origins, private Site, fonts and mobile safe areas. No device gate or background watcher.

## Published retained-review continuation — November 14, 2026

PR #31 is merged and live at https://slate-web.iiankehn.com/ from runtime `f7488f3f50df43c71e9e9851bbaedb3a02008096`. PR CI 43571680009 and main CI 43573166532 each passed 688 Node tests and all 225 browser scenarios without retries. Pages 43574825195 promoted exact main artifact 14106330531 without rebuilding or repeating browsers. All 56 checked live shell/worker URLs byte-match; worker cache digest `03d2a194f9797fda` reconciles. See [RELEASE_2026_11_14.md](RELEASE_2026_11_14.md).

Explicit, unchecked-by-default ODT review retention now preserves the existing full Slate Forge review model, including row changes, cell/list replacements, nested structural decisions, prior-format values and comments. Other editors receive an accepted editable document. Fresh unchanged packages restore review; externally changed or invalid packages use current native content. The export disclosure includes deleted content, comments, prior formatting, original embedded images and hidden editable canvas layers. Native/image-only canvas choices retain image previews. Validated private table widths also survive retained DOCX snapshots. Read [ODT_RETAINED_REVIEW.md](ODT_RETAINED_REVIEW.md).

Two actual native Word row controls lost their history through Writer conversion. Keep that native interoperability limit explicit. Eight accepted-view Writer resaves verify current-content fallback, not native row-history exchange. Broader native history, paint and layout cases remain in the compatibility inventory. The user aims for completion across all areas and permits discovering work; do not impose a new finite freeze. Continue solo and preserve originals, backups, storage formats/identifiers/origins, private Site, fonts and mobile safe areas. No device gate or background watcher.

## Published whole-list/table review continuation — November 13, 2026

PR #30 is merged and live at https://slate-web.iiankehn.com/ from runtime `07a3d52e980f762723adf20f56037523c087c6c7`. PR CI 43510468689 and main CI 43512922483 each passed 678 Node tests and all 220 browser scenarios without retries. Pages 43515979791 promoted exact main artifact 14080667059 without rebuilding or repeating browsers. All 56 checked live shell/worker URLs byte-match; worker cache digest `3256efdb04040b43` reconciles. See [RELEASE_2026_11_13.md](RELEASE_2026_11_13.md).

Complete top-level list/table revisions now transfer through native ODT with paragraph anchors, preserving both decisions and the tested structure/design through 39 actual Writer resaves. See [ODT_CONTAINER_REVISIONS.md](ODT_CONTAINER_REVISIONS.md). Required hyperlink types are corrected. Retained failures explain the hidden-column and adjacent-history refusals. The first PR run was superseded for a stronger import-completion assertion; the next failed an export-guidance phrase check. The repaired source passed both accepted gates above, with no weakened assertions or retry-only acceptance. PR #30 is merged; no feature PR remains open.

This implementation batch and its publication are complete. Individual row/cell/list-item and nested review, unanchored container changes, broader paint/layout and the other [compatibility inventory](COMPATIBILITY_INVENTORY.md) cases remain explicit limits. Earlier writing/ribbon, editable redaction, native group and paragraph/boundary extensions remain included. Continue solo; preserve originals, backups, storage formats/identifiers/origins, private Site, fonts and mobile safe areas. Documentation-only follow-up reuses this runtime/artifact evidence. No background watcher or device QA gate is added.

## Previous paragraph-boundary release — November 12, 2026

The previous PR #29 release was published at https://slate-web.iiankehn.com/ from runtime `34486e3a8d1520feab44df5ccc57e82c5c6f8dd6`. PR CI 43150746850 and main CI 43152635085 each passed 668 Node tests and all 215 browser scenarios without retries. Pages 43154942139 promoted exact main artifact 13914789082 without rebuilding or repeating browsers. All 56 checked live shell/worker URLs match; worker cache digest `8d5ba8bf49c9c1f2` reconciles. See [RELEASE_2026_11_12.md](RELEASE_2026_11_12.md).

The supported ODT paragraph split/join extension is published with 19 corrected actual Writer resaves and independent DOCX-to-ODT controls; see [ODT_PARAGRAPH_BOUNDARIES.md](ODT_PARAGRAPH_BOUNDARIES.md). Earlier writing selection/context/clipboard/ribbon controls, genuine editable redaction and native group/whole-paragraph review work remain published. PR #29 is merged; no feature PR remains open. The initial retry-only redaction-test failure was repaired from trace evidence and remains recorded.

The implemented batch and its publication are complete. The broader [compatibility inventory](COMPATIBILITY_INVENTORY.md) still contains substantive unsupported paint, layout and nested/object/list/table/row review cases. Rich paragraph joins combined with keep/page-break flags explicitly refuse after demonstrated Writer formatting loss. Do not claim those limits are implemented or universal Office parity. Continue solo and preserve originals, backups, fonts, storage formats/origins and mobile safe areas. Reuse this runtime/artifact evidence for documentation-only follow-up; no background CI watcher or device QA gate is added.

## Previous batch published — November 11, 2026

The writing/sharing/native office batch is merged through PR #28 and live from runtime `994a2ae0e1859939ed9d013ce89128485847a055`. PR/main verification each passed 656 Node cases and 210 browser scenarios without retries. Pages 43116607297 promoted the exact main artifact; all 56 checked live shell/worker URLs match. See [RELEASE_2026_11_11.md](RELEASE_2026_11_11.md). PRs #25–#27 are closed as superseded with their branches/history preserved.

The implemented items described below are published. Broader compatibility cases remain inventoried and are not marked complete by this release. Earlier pending/failed CI statements below record implementation history.

## Reopened user-selected work — November 9–10, 2026

The user explicitly requested broader Word/ODT compatibility and true editable redacted DOCX/ODT/HTML output, and subsequently requested document-scoped writing commands, clipboard/context-menu improvements and independent ribbon density/collapse controls. This supersedes the historical finite freeze below. No device-testing gate is added.

- Current editable batch: logical text/range and whole-object removal from a fresh sharing model, preserving unmarked editable writing and supported canvas vectors; no page-image wrappers. See [EDITABLE_REDACTION.md](EDITABLE_REDACTION.md).
- Current compatibility batch: adjacent opaque shapes, uniform text, PNG/JPEG, paths and lines using native leaf helpers; occupied path frames repair an observed editor shift. Flat child positions/rotations retain membership without unsupported raw group transforms. Actual corrected-editor exchange passes within existing tolerance; [ODT_HETEROGENEOUS_GROUPS.md](ODT_HETEROGENEOUS_GROUPS.md) retains both failed and corrected evidence. Remaining known cases are inventoried and classified in [COMPATIBILITY_INVENTORY.md](COMPATIBILITY_INVENTORY.md); this batch does not complete that entire category.
- A further bounded rigid leaf-matrix importer normalizes explicit-unit rotation/translation to existing native output, backed by one actual raw/control Writer corpus; general affine and ambiguous unitless translations remain refused. See [ODT_RIGID_LEAF_MATRICES.md](ODT_RIGID_LEAF_MATRICES.md).
- The isolated UI-only checkpoint is integrated after its failed browser trace exposed asynchronous Select All focus and stale scroll-event menu dismissal. Both have targeted product repairs; no unchanged failed CI is rerun. See [WRITING_COMMANDS.md](WRITING_COMMANDS.md).
- Nested opaque canvas hierarchy is now implemented through eight levels across native ODT/DOCX, grouping controls and fresh sharing copies. Actual 24-object Writer exchange passes with maximum .1-unit geometry delta. See [NESTED_NATIVE_GROUPS.md](NESTED_NATIVE_GROUPS.md); this extension is published in PR #28.
- Native whole-paragraph ODT revision support now preserves bounded paragraph/heading changes through safe boundary anchors and existing review decisions. The corrected 17-case Writer corpus and a paragraph-design fixture pass; the initial heading-loss failure is retained. See [ODT_PARAGRAPH_REVISIONS.md](ODT_PARAGRAPH_REVISIONS.md). Nested/object/row histories remain unsupported; the published extensions above cover paragraph boundaries and complete list/table review.
- Work solo under the latest user instruction. Release after source review and required exact-source PR/main checks, then reuse the successful main artifact for Pages and verify live files/cache. PR #27 browser run 43102981189 had 204 first-attempt passes and one retry-only WebKit timeout, so its strict gate failed. The trace-backed startup-helper repair waits for the actual workspace dialog. The corrected PR #28 source passed both required PR/main checks and exact-artifact publication; see the release evidence above. PR #26 remains a preserved earlier checkpoint.

## Historical completion record — previous bounded release

## Finite completion boundary

The active bounded implementation roadmap is complete and published. The user selected suite-wide flattened redacted PDF output and the bounded opaque ODF stroke-group follow-on. The release checklist below is complete; stop here. Unsupported compatibility cases and research are recorded limits, not an expanding backlog or automatic next batch.

Keep the product local-first and account-free. Preserve saved documents, fonts, backups, storage identifiers, public/private hosting identities and the confirmed mobile safe-area fix. No accounts, cloud sync, paid services or telemetry are introduced.

## Final release checklist

- [x] Implement one-level adjacent opaque native ODF line/arrow groups, retaining child geometry/order and editable membership.
- [x] Repair effective graphic-style validation, preserve namespace declarations and synchronize OCR test file injection with initialization.
- [x] Obtain independent source review and exact-source PR verification: 582 Node cases and 165 browser scenarios without retries at `50117804e4462889ce392aea1d61ef537245822c`.
- [x] Verify merged main runtime `d8535f28c91922d919a0f53f1df756c36e2fcb69` in required CI.
- [x] Promote that successful main artifact through Pages without rebuilding or repeating browsers.
- [x] Verify live files/cache against the exact promoted artifact and record handoff evidence.

Published runtime `d8535f28c91922d919a0f53f1df756c36e2fcb69` at https://slate-web.iiankehn.com/ . [PR verification](https://github.com/iiankehn/slate-forge-web/actions/runs/42580266841) and [merged-main verification](https://github.com/iiankehn/slate-forge-web/actions/runs/42683902860) each passed 582 Node cases and 165 browser scenarios without retries. [Pages promotion](https://github.com/iiankehn/slate-forge-web/actions/runs/42686729685) reused main artifact `13704782234`, archive SHA-256 `c285e2d9732a13e2a1428828da770c6f283feefa021c10e3e4069717f8592daf`, without rebuilding or rerunning browsers. All 53 verified live shell/worker URLs matched that exact archive; worker cache digest `2fd596f2fcf3bc65` reconciled. The finite bounded implementation roadmap is complete.

## Delivered bounded scope

The everyday writing release, ODT comments/inline revisions, original-canvas retention, native shapes/text boxes, pictures and bounded shape/stroke transforms remain delivered within their evidence documents. Suite-wide [redacted PDF copies](REDACTION.md) preserve originals/backups and remove marked output pixels. The final [ODF stroke-group batch](ODT_GROUPS.md) preserves only supported adjacent opaque line/arrow groups; unsupported group paint and geometry fail explicitly.

## Explicitly optional or deferred

Rectangle/ellipse or picture/text group expansion, translucent/group paint effects, transformed/deeper groups, arbitrary raw matrices, mirrored/skewed text, transformed bordered contours and foreign stroke scaling/shearing lists are not required to close this bounded roadmap. Existing preview/retained-source alternatives and refusal messages remain available. Editable redacted DOCX/ODT/HTML and automatic sensitive-text discovery are outside the first redaction release.

ODT review history beyond inline text remains constrained research: standard formatting-change metadata does not retain the previous formatting. Do not invent Reject behavior or turn an app-specific history design into a completion task.

Physical-device, assistive-technology, printing, real storage-pressure and broad external-editor checks remain explicit manual QA limits in [DEVICE_QA.md](DEVICE_QA.md). Existing fixture/headless/browser evidence is not universal Word/LibreOffice or physical-device certification. Maintain evidence for changes that are actually requested; do not repeatedly run unchanged tests or expand optional fidelity work to claim completeness.

## Evidence and history

[ODT groups](ODT_GROUPS.md) · [redaction](REDACTION.md) · [ODT compatibility](ODT_COMPATIBILITY.md) · [inline revisions](ODT_TEXT_REVISIONS.md) · [original canvases](ODT_EDITABLE_CANVASES.md) · [native shapes](ODT_NATIVE_SHAPES.md) · [native strokes](ODT_NATIVE_STROKES.md) · [native pictures](ODT_NATIVE_PICTURES.md) · [bounded transforms](ODT_NATIVE_TRANSFORMS.md) · [stroke transforms](ODT_STROKE_TRANSFORMS.md) · [release pipeline](RELEASE_PIPELINE.md) · [release readiness](RELEASE_READINESS.md).

The earlier completed checklist and chronological entries remain in [ROADMAP_HISTORY.md](ROADMAP_HISTORY.md).
