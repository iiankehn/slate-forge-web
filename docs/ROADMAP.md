# Slate Forge development roadmap

## Current continuation — November 13, 2026

`feat/odt-list-table-revisions` implements complete native ODT list/table review decisions with 39 accepted actual Writer resaves. Read [ODT_CONTAINER_REVISIONS.md](ODT_CONTAINER_REVISIONS.md). Both outcomes, stable table grids/design, numbering, empty anchors, rich runs and independent history survive; retained failures explain the explicit anchor/grid refusals. Standard hyperlink types are also corrected. Source validation covers 117 XML parts with documented LibreOffice extension exclusions.

All 678 Node tests, the production build and static packaging pass locally. Required PR/main browser gates precede exact-artifact publication. This extension is not yet live. Individual row/cell/list-item changes and nested histories remain unsupported; do not close every broader compatibility row. Continue solo, preserve the PR #29 release, storage/origins/private Site/fonts/mobile safe areas, and reuse unchanged evidence. No background watcher or device QA gate.

## Published paragraph-boundary continuation — November 12, 2026

PR #29 is merged and live at https://slate-web.iiankehn.com/ from runtime `34486e3a8d1520feab44df5ccc57e82c5c6f8dd6`. PR CI 43150746850 and main CI 43152635085 each passed 668 Node tests and all 215 browser scenarios without retries. Pages 43154942139 promoted exact main artifact 13914789082 without rebuilding or repeating browsers. All 56 checked live shell/worker URLs match; worker cache digest `8d5ba8bf49c9c1f2` reconciles. See [RELEASE_2026_11_12.md](RELEASE_2026_11_12.md).

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
- Native whole-paragraph ODT revision support now preserves bounded paragraph/heading changes through safe boundary anchors and existing review decisions. The corrected 17-case Writer corpus and a paragraph-design fixture pass; the initial heading-loss failure is retained. See [ODT_PARAGRAPH_REVISIONS.md](ODT_PARAGRAPH_REVISIONS.md). Nested/object/row changes remain unsupported; the bounded paragraph-boundary extension is the current continuation above.
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
