# Slate Forge handoff — interface and stability release complete

Updated 2026-11-02. Published source `e2b7d0479daf44bab59efd266cfe8cb2a1829888` is live at https://slate-web.iiankehn.com/ . Later documentation and workflow-cleanup commits do not change its runtime. PR #9 contains the final focus fix; PR #7 delivered the interface and PR #8 corrected reload ownership.

## Completed scope

The requested ribbon, Workspace start/backstage screen, first-visit setup, replayable tour, additional light/dark palettes and sans-serif interface/new-document defaults are implemented and published. Existing document font choices remain intact. [ROADMAP.md](ROADMAP.md) is complete for this release. [PRODUCT_FOCUS.md](PRODUCT_FOCUS.md) bounds advanced tools and stops further autonomous feature expansion. Do not reopen historical feature roadmaps.

## Final stability work and evidence

Returning from setup/Workspace or creating a document previously queued editor focus for the next animation frame. That callback could steal focus from a field already selected by the user. These transitions now restore the editor selection synchronously. A deterministic full-app DOM regression failed before the correction and passes for setup, Continue writing and template creation. The browser journey also checks the focus handoff and repeats template creation/title discovery eight times per configuration while retaining the original document ID and content.

[PR CI](https://github.com/iiankehn/slate-forge-web/actions/runs/41467347689), [main CI](https://github.com/iiankehn/slate-forge-web/actions/runs/41468991239), [release CI](https://github.com/iiankehn/slate-forge-web/actions/runs/41469421300) and [Pages deployment](https://github.com/iiankehn/slate-forge-web/actions/runs/41469421667) passed production/static checks, all 466 Node tests and all 95 browser scenarios without retries. Configurations: desktop Chromium/Firefox/WebKit and phone Chromium/WebKit emulation. Existing download/restore, encrypted backup, offline OCR, repeated reload/separate-tab and axe accessibility journeys remain covered. Live primary assets, shell chunks and service-worker code/manifest/cache digest are verified. [UX_STABILITY.md](UX_STABILITY.md) retains exact evidence and historical retry outcomes.

The earlier single Firefox discovery failure did not recur in the expanded runs; its original trace was unavailable, so its exact historical cause is unproven. The reproducible focus race is fixed. CI now fails even when a test passes on retry, and discovery failures attach model/UI diagnostics. Treat any recurrence as a regression to investigate, not a reason to expand product scope. No reproducible release blocker remains in these verified flows.

## Continuation rules

- No new features without a new user request. Maintain the focused everyday-writing product and preserve existing work.
- Node 24/npm build a static site; the published app needs no Node server. `dist/index.html` is tracked canonical source; generated bundles are rebuilt.
- Preserve legacy `document-studio` storage identifiers, database versions, backup formats, public Pages origin and `.openai/hosting.json` private Site identity. Never clear users' storage to repair a test.
- Run appropriate Node/build/static checks for code changes; browser checks run through GitHub Actions. Local browser automation was denied by workspace policy: do not evade it through shell/CDP or alternate hosts.
- Pages publication is manual-only again. A temporary trigger started this explicitly authorized release after the CLI credential expired; it was removed immediately. The connected GitHub app remains usable. Public Git fetch works using the explicit HTTPS repository URL.
- Preserve the preexisting untracked `docs/ROADMAP_SCOPE_AUDIT.md`; it is not the active roadmap.

The app is ready for everyday public beta/tester use. Local saving is browser/device-specific; users need independent backups. Automated checks are not physical-device, screen-reader, printer, storage-eviction or external-editor certification. Advanced format/PDF limits remain documented in the product guide and scope decisions. Earlier superseded handoff instructions remain available in Git history.
