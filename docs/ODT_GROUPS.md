# Bounded native ODF groups

## Current reopened extension — unpublished

The November 10 user mandate extends membership to adjacent opaque rectangles/ellipses, uniform text, PNG/JPEG pictures, bounded paths and lines. Each child uses the existing native geometry/paint reader. Named or inherited group text/paragraph overrides are refused when text is present; image opacity is checked after picture decoding. Group paint effects, nonadjacent membership, raw group transforms and deeper nesting remain refused. Flat scene child positions and rotations are exported per leaf; no unsupported raw group transform is emitted. See [COMPATIBILITY_INVENTORY.md](COMPATIBILITY_INVENTORY.md) for actual-editor failures, the occupied-path repair and [corrected actual-editor proof](ODT_HETEROGENEOUS_GROUPS.md). These features are not published yet.

## Previously published stroke boundary

This batch supports one-level groups of adjacent opaque native lines/arrows, with absolute child geometry and no group transform or paint effects. Group membership and child order survive reopening and native ODT re-export. Hidden objects remain omitted; locking and original group names are not transferred.

The existing actual LibreOffice one-level grouped-stroke probe is the exchange corpus. Focused checks compare geometry and order through import/export/import. The prior actual-editor resave establishes the corpus geometry; this batch does not claim a new LibreOffice execution or Word certification.

Non-stroke grouped objects, active group opacity/paint, clipping, transformed groups, deeper nesting, separated grouped layers and raw matrices remain explicit preview cases. Existing primitive paint bounds and stroke representability limits remain enforced. No document storage or backup format changes.

## Reviewed repair and release evidence

Group validation now resolves only graphic-property elements, preserving default/named/inherited provenance. Paragraph/text defaults (including text-scoped opacity) are not mistaken for group paint. Actual inherited graphical opacity or visible shadows are refused; semantic neutral overrides such as 100% opacity and hidden shadow are accepted. Only enumerated inert drawing defaults from the actual corpus are tolerated. Explicit or inherited named fill/stroke colors and offsets remain refused, even when equal to a default. Missing/cyclic/deep style ancestry fails closed. Harmless XMLNS declarations do not bypass substantive namespace/attribute checks.

Review exposed the first group's inherited-opacity gap. The first repair candidate `9462f015aab1beaa5608a579f3ffb1a7b46606db` over-refused legitimate LibreOffice defaults: its focused run had 35 passes and four failures. It was not released. The scoped repair at `50117804e4462889ce392aea1d61ef537245822c` passed all 45 focused affected checks, production/static/whitespace checks, and PR #24 CI `42580266841` with 582 Node cases and 165 browser scenarios without retries.

The original merged-main run `42572161888` failed the existing Firefox OCR scenario on both attempts: 570 Node cases passed, 35 browser scenarios passed, one failed and 129 did not run. Its retained trace showed file injection while initialization was busy and the input disabled. The repair waits for actual ready/enabled state; product initialization protection remains intact. That failed run has no promotable static-site artifact.

Merged runtime: `d8535f28c91922d919a0f53f1df756c36e2fcb69`; required main CI: `42683902860`. Published runtime `d8535f28c91922d919a0f53f1df756c36e2fcb69` at https://slate-web.iiankehn.com/ . [PR verification](https://github.com/iiankehn/slate-forge-web/actions/runs/42580266841) and [merged-main verification](https://github.com/iiankehn/slate-forge-web/actions/runs/42683902860) each passed 582 Node cases and 165 browser scenarios without retries. [Pages promotion](https://github.com/iiankehn/slate-forge-web/actions/runs/42686729685) reused main artifact `13704782234`, archive SHA-256 `c285e2d9732a13e2a1428828da770c6f283feefa021c10e3e4069717f8592daf`, without rebuilding or rerunning browsers. All 53 verified live shell/worker URLs matched that exact archive; worker cache digest `2fd596f2fcf3bc65` reconciled. The finite bounded implementation roadmap is complete.

The completion above applies to that historical bounded stroke release. The user subsequently reopened broader compatibility; the current extension and remaining cases are tracked separately above and in the inventory.
