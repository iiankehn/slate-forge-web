# Slate Forge: a smaller, dependable writing product

Current extension: [ODT_STROKE_TRANSFORMS.md](ODT_STROKE_TRANSFORMS.md) records rigid stroke rotations/reflections, axis-line recovery and skew/pressure stroke outlines. Group/matrix compatibility is next. Unsupported text, bordered-contour and stroke-list scaling/shearing cases remain explicit, as do geometry/paint limits. Earlier compatibility sections are previous releases; preview and retained-original alternatives remain supported.

## Requested advanced follow-on — 2026-11-03

After the focused release and limitations review, the user explicitly reopened advanced-feature work and selected Word/ODT compatibility as the lead area. The first batch adds native ODT comments and canvas preview export. The subsequent “Next” request continued with published native inline ODT text revisions; see ODT_TEXT_REVISIONS.md. This supersedes the freeze below for requested compatibility work; it does not promise universal office fidelity or authorize unrelated accounts/cloud features. Preserve existing saved work and validate each supported behavior. See [ODT_COMPATIBILITY.md](ODT_COMPATIBILITY.md).

The latest direction supersedes the former eight-area completion roadmap. Stop expanding the document engine. Prioritize everyday writing, easy file handling and confidence that work is safe. There is no usage dataset supporting a literal 99% figure; the decisions below follow the user's essential-task criterion.

## Keep and make dependable

- Rich text, headings, lists, links, ordinary images and tables.
- Blank documents and useful everyday templates.
- Clear local autosave, document discovery, opening files, backups and session controls.
- Supported editable document exports, preview and print/PDF.
- Simple page settings, find/replace and basic comments/review.
- Comfortable light/dark palettes, accessible navigation and responsive writing.

## Decisions on unfinished scope

| Previous area | Product decision |
| --- | --- |
| Complex image wrapping | Keep ordinary placement and wrapping. Stop pursuing arbitrary nested, table-crossing and publication-layout parity. |
| Advanced pagination/sections | Keep simple pages, margins and supported columns. Stop pursuing a full desktop publishing layout engine. Fix text loss/overflow and misleading output as stability defects. |
| Universal Word/ODT fidelity | Keep useful supported import/export and visible warnings. Stop promising exact compatibility for all styles, fields, drawings and master pages. |
| Nested native review fidelity | Keep basic comments and review. Freeze complex suggestion-tree and native Word hierarchy expansion. |
| General PDF editing/reflow | Keep existing bounded PDF tools under Tools. Stop pursuing general PDF content reflow or universal font/script editing. |
| General XFA execution | Freeze compatibility expansion. Existing bounded support remains an advanced tool; it is not a core product promise. |
| Broad certification workflows | Freeze permission/appearance workflow expansion. Preserve existing signed-file safety checks. |
| LTV/archive signature infrastructure | Remove from the active roadmap. This does not justify the scope and maintenance burden for this product. |

Drawing, semantic comparison and sophisticated PDF/signature tools are also maintenance-only. Do not add to them as part of ordinary product work. This decision does not erase saved documents, remove original files or break existing backup formats. Removing existing capabilities later should consider data compatibility and actual user feedback; absence from the primary ribbon is not evidence that data was removed.

## This interface pass only

A distinct task-grouped ribbon, a Workspace start/backstage screen, three first-visit setup cards, a skippable/replayable tour, additional light/dark palettes, and sans-serif interface/new-document defaults. Workspace separates document actions, settings and local session identity so a future account area can fit without introducing accounts, sign-in, sync or remote storage now.

Then stabilize the whole product: existing save/restore/export/offline regressions plus first-visit/returning-visit behavior, keyboard access, focus, destructive-action cancellation, narrow layouts and palette persistence. Automated browser emulation and UX heuristics are not user research or physical-device certification. Findings belong in stability work, not an expanding feature roadmap.
