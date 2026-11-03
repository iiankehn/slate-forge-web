# Slate Forge handoff — native ODT text revisions published

## Current compatibility release

Published 2026-11-03 from `49d70dd7a7610bd1ce3e28d04f4ceed0a2b3d301` at https://slate-web.iiankehn.com/ . The user's “Next” continued Word/ODT compatibility. PR #13 adds native inline ODT insertion/deletion round trips with author/date metadata and deleted-text styling, preserved recording on/off, grouped decisions, accept/reject and undo/save/reload behavior. Converter tests retain decisions through ODT → native DOCX → ODT.

[main CI](https://github.com/iiankehn/slate-forge-web/actions/runs/41735668694) and [Pages](https://github.com/iiankehn/slate-forge-web/actions/runs/41735669867) passed 502 Node tests, production/static checks and all 110 browser scenarios without retries. All 44 live shell/worker URLs and cache digest `c4e7519fb8ae9992` are verified/reconciled against the build and platform-specific notices. A long external group-ID case was reproduced and fixed before publication; pending draft release runs were cancelled. [ODT_TEXT_REVISIONS.md](ODT_TEXT_REVISIONS.md) records the complete evidence, temporary credential expiry and explicit format limits. The injected CLI authorization was refreshed; recheck it in future sessions rather than assuming transfer.

Complex native formatting/structural revisions, object/field/line-break revisions and external-editor resaves remain bounded/unverified. ODT canvases remain image previews. Preserve the original files and HTML/workspace backups for complete review history. No storage, backup, public origin or private Site identity changed.

## Earlier release history

## Previous compatibility release — comments and canvas previews

Published 2026-11-03 from `6a0af3ea285a49ba125c8a0bbfc2c86efa227578` at https://slate-web.iiankehn.com/ . The user explicitly reopened advanced features and selected Word/ODT compatibility. PR #12 adds native ODT overlapping/ranged/cursor comments with author/date/plain bodies and resolved metadata, fitted PNG canvas previews, namespace-alias-safe imports and image descriptions without duplicated body prose. ODT previews reopen as images; keep HTML/workspace backups for editable canvases.

[main CI](https://github.com/iiankehn/slate-forge-web/actions/runs/41723609890) and [Pages](https://github.com/iiankehn/slate-forge-web/actions/runs/41723610425) passed 489 Node tests, production/static checks and all 105 browser scenarios without retries. Live shell/worker files and cache digest are verified. A main-run test-server cleanup race was reproduced and fixed before publication; the first pending Pages run was cancelled. [ODT_COMPATIBILITY.md](ODT_COMPATIBILITY.md) records exact evidence, the failed run and verification limits. No storage, backup, origin or private Site identity changed. Native ODF tracked changes, editable ODF canvas objects and external-editor/device certification remain open; universal fidelity is not claimed.

## Previous focused release history

For fresh-environment setup, dependencies, exact continuation scope and command examples, read [NEXT_CHAT_HANDOFF.md](NEXT_CHAT_HANDOFF.md). This supplements the release history below and does not reopen the completed roadmap.

Updated 2026-11-03. Published source `1407181d5c04a21fabc3fa12066b6173da23b2aa` is live at https://slate-web.iiankehn.com/ . Later documentation commits do not change its runtime. PR #11 integrates the supplied Brand Kit, PR #10 adds silent updates, PR #7 delivered the focused interface and PRs #8–9 corrected reload ownership and focus.

## Brand Kit integration — explicitly requested follow-on

PR #11 incorporates the user-supplied SlateForge-BrandKit-v1.2-review assets: Fold + Forge wordmarks in the header and Workspace, dedicated small marks in compact UI/onboarding, browser favicons and install/Apple/maskable icons. Supplied SVGs and favicon PNGs are unchanged; platform raster exports preserve the complete symbol, colors and mask-safe placement. The kit retains its upstream review-candidate label; integration follows the user's explicit request. [BRANDING.md](BRANDING.md) records provenance and platform details.

[main CI](https://github.com/iiankehn/slate-forge-web/actions/runs/41646799702) and [Pages](https://github.com/iiankehn/slate-forge-web/actions/runs/41646800305) passed production/static checks, 477 Node tests and all 100 browser scenarios without retries. Reviewed desktop ribbon, dark phone Workspace and phone onboarding captures. Live app/shell chunks, brand files, icon exports and service-worker code/manifest/cache digest are verified. Existing platform installations refresh their displayed icon on their own schedule; do not clear document storage or require reinstallation to force it. The initial branding Pages attempt (41644381970) blocked one desktop WebKit upgrade case that passed on retry after a native worker-load error. A focused regression then demonstrated reload could precede an outstanding worker check. The release fix waits for registration/update promises and stops new checks while reload is pending; the page-error gate remains strict. The focused feature roadmap remains closed.

## Silent automatic updates — explicitly requested follow-on

PR #10 implements the user's 2026-11-03 request. Online launches check for a current worker before starting the workspace; downloaded releases activate silently and compatible tabs save before reloading once. Focus, restored pages and returning online check again. Registration failures retry after reconnection. Pending saves, reported storage errors, open tool/setup dialogs, composition and offline preparation defer reloads without an update prompt. Offline or unreachable launches keep the cached release usable.

[PR CI](https://github.com/iiankehn/slate-forge-web/actions/runs/41585035123), [main CI](https://github.com/iiankehn/slate-forge-web/actions/runs/41586086505) and [Pages](https://github.com/iiankehn/slate-forge-web/actions/runs/41586088144) passed production/static checks, 476 Node tests and all 100 browser scenarios without retries. The real A→B release fixture verifies silent upgrades, retained writing/namespace IDs in two tabs and reopening B offline across all five configurations. Live shell assets/chunks and service-worker code/manifest/cache digest are verified. See [AUTOMATIC_UPDATES.md](AUTOMATIC_UPDATES.md) for behavior, rollout and verification limits. The original feature roadmap remains closed; automatic updates were an explicitly requested follow-on.

## Completed scope

The requested ribbon, Workspace start/backstage screen, first-visit setup, replayable tour, additional light/dark palettes and sans-serif interface/new-document defaults are implemented and published. Existing document font choices remain intact. [ROADMAP.md](ROADMAP.md) is complete for this release. [PRODUCT_FOCUS.md](PRODUCT_FOCUS.md) bounds advanced tools and stops further autonomous feature expansion. Do not reopen historical feature roadmaps.

## Previous interface stability work and evidence

Returning from setup/Workspace or creating a document previously queued editor focus for the next animation frame. That callback could steal focus from a field already selected by the user. These transitions now restore the editor selection synchronously. A deterministic full-app DOM regression failed before the correction and passes for setup, Continue writing and template creation. The browser journey also checks the focus handoff and repeats template creation/title discovery eight times per configuration while retaining the original document ID and content.

[PR CI](https://github.com/iiankehn/slate-forge-web/actions/runs/41467347689), [main CI](https://github.com/iiankehn/slate-forge-web/actions/runs/41468991239), [release CI](https://github.com/iiankehn/slate-forge-web/actions/runs/41469421300) and [Pages deployment](https://github.com/iiankehn/slate-forge-web/actions/runs/41469421667) passed production/static checks, all 466 Node tests and all 95 browser scenarios without retries. Configurations: desktop Chromium/Firefox/WebKit and phone Chromium/WebKit emulation. Existing download/restore, encrypted backup, offline OCR, repeated reload/separate-tab and axe accessibility journeys remain covered. Live primary assets, shell chunks and service-worker code/manifest/cache digest are verified. [UX_STABILITY.md](UX_STABILITY.md) retains exact evidence and historical retry outcomes.

The earlier single Firefox discovery failure did not recur in the expanded runs; its original trace was unavailable, so its exact historical cause is unproven. The reproducible focus race is fixed. CI now fails even when a test passes on retry, and discovery failures attach model/UI diagnostics. Treat any recurrence as a regression to investigate, not a reason to expand product scope. No reproducible release blocker remains in these verified flows.

## Continuation rules

- No new features without a new user request. Maintain the focused everyday-writing product and preserve existing work.
- Node 24/npm build a static site; the published app needs no Node server. `dist/index.html` is tracked canonical source; generated bundles are rebuilt.
- Preserve legacy `document-studio` storage identifiers, database versions, backup formats, public Pages origin and `.openai/hosting.json` private Site identity. Never clear users' storage to repair a test.
- Run appropriate Node/build/static checks for code changes; browser checks run through GitHub Actions. Local browser automation was denied by workspace policy: do not evade it through shell/CDP or alternate hosts.
- Pages publication uses the existing manual GitHub Actions workflow; a commit alone does not deploy. This release used that workflow directly. The earlier temporary trigger is removed. Preserve the separate private Site. Public Git fetch works using the explicit HTTPS repository URL.
- Preserve the preexisting untracked `docs/ROADMAP_SCOPE_AUDIT.md`; it is not the active roadmap.

The app is ready for everyday public beta/tester use. Local saving is browser/device-specific; users need independent backups. Automated checks are not physical-device, screen-reader, printer, storage-eviction or external-editor certification. Advanced format/PDF limits remain documented in the product guide and scope decisions. Earlier superseded handoff instructions remain available in Git history.
