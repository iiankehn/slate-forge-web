# Slate Forge handoff — silent updates published; focused roadmap complete

Updated 2026-11-03. Published source `9cc8e41684c744e3485f9d6e70f091994796b6a9` is live at https://slate-web.iiankehn.com/ . Later documentation commits do not change its runtime. PR #10 adds silent updates; PR #7 delivered the focused interface and PRs #8–9 corrected reload ownership and focus.

## Silent automatic updates — explicitly requested follow-on

PR #10 implements the user's 2026-11-03 request. Online launches check for a current worker before starting the workspace; downloaded releases activate silently and compatible tabs save before reloading once. Focus, restored pages and returning online check again. Registration failures retry after reconnection. Pending saves, reported storage errors, open tool/setup dialogs, composition and offline preparation defer reloads without an update prompt. Offline or unreachable launches keep the cached release usable.

[PR CI](https://github.com/iiankehn/slate-forge-web/actions/runs/41585035123), [main CI](https://github.com/iiankehn/slate-forge-web/actions/runs/41586086505) and [Pages](https://github.com/iiankehn/slate-forge-web/actions/runs/41586088144) passed production/static checks, 476 Node tests and all 100 browser scenarios without retries. The real A→B release fixture verifies silent upgrades, retained writing/namespace IDs in two tabs and reopening B offline across all five configurations. Live shell assets/chunks and service-worker code/manifest/cache digest are verified. See [AUTOMATIC_UPDATES.md](AUTOMATIC_UPDATES.md) for behavior, rollout and verification limits. The original feature roadmap remains closed; this is the single explicitly requested follow-on.

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
