# Focused interface stability and UX checks

This pass follows the UI redesign, not a new document-feature roadmap. Product scope decisions are in PRODUCT_FOCUS.md. Existing formats, storage identifiers and device-copy behavior remain compatible.

## Interface behavior

- Workspace opens on ordinary visits; direct installed-app shortcuts and file launches can enter their destination directly. Its local identity area is deliberately separate from document commands. No accounts or remote storage were added.
- First-visit cards explain the product, offer shared appearance preferences and explain local saving/backups. Setup and the four-step tour can be skipped, cancelled or replayed. Completion is remembered when browser storage is available.
- Home, Insert, Layout, Review, View and Tools form a task-grouped ribbon. Formatting controls are moved rather than cloned; Undo availability follows editor state. Advanced file tools are outside the primary writing tab.
- Workspace contains recent/title-searchable documents, templates, opening/export, print, settings, backups and session controls. Destructive session actions still require the existing separate confirmation.
- Six added light/dark palettes share the original preference storage, accents and screen-only dark-page behavior. A palette does not alter saved or exported document colors.

The user also specifies sans-serif throughout the app experience. Interface typography and new-document defaults use sans-serif; existing document font choices remain document formatting. Mobile Workspace navigation overrides the old fixed sidebar rule so it cannot cover document actions.

## Verification plan and evidence

The complete Node suite checks saving, storage failure handling, imports/exports, PDF/OCR tools, review and the new interface integration. Added tests cover first/returning visits, denied preference storage, inert document titles, tour completion/cancellation, palette/pre-paint consistency and ribbon keyboard/focus behavior.

GitHub Actions runs the full production build, static packaging checks and browser scenarios across desktop Chromium/Firefox/WebKit and phone Chromium/WebKit emulation. Existing actual-download, backup restoration and offline OCR scenarios remain in the suite. New journeys cover onboarding/tour, preferences, document discovery, templates, end-session cancellation, narrow viewport overflow and automated axe WCAG A/AA checks, including every palette. Screenshots and accessibility findings are retained with browser artifacts for visual review.

Initial local result: 462 Node tests pass, as do production build, static packaging and source whitespace checks. Browser and accessibility results must be recorded after execution; no browser/device success is implied by this initial result.

This is automated regression testing plus a source/visual UX review. It does not replace user research, physical-device testing, actual screen-reader use, IME/stylus testing, real storage eviction or printer/external-word-processor certification.


## Verified implementation

[PR CI 41396459279](https://github.com/iiankehn/slate-forge-web/actions/runs/41396459279) passed 462 Node tests, production/static checks and all 90 browser scenarios without retries on `4d9c05aeb8c8713cd65bcbe050ea66cecceef457`. The selected axe WCAG A/AA checks reported no violations across all tested setup, Workspace, preference and palette states in the five browser configurations. Production dependency audit: zero known vulnerabilities.

Findings fixed: Undo availability with a persistent ribbon; duplicate controls; inherited mobile sidebar positioning that covered Workspace actions; setup-step ARIA semantics; dialog names; light-palette secondary-text contrast; keyboard/direct-launch navigation; and inherited serif interface styles. Existing document font choices remain intact; new blank/Forge documents use Arial.

Reviewed captures: [desktop ribbon](ui/ribbon-desktop.png), [mobile Workspace](ui/workspace-mobile.png), [mobile onboarding](ui/onboarding-mobile.png).

## Published UI release

PR #7 is merged at `cb577796b7bc0173b141852116a91044057a20e1`. [Main CI](https://github.com/iiankehn/slate-forge-web/actions/runs/41397146965) passed and [Pages 41397164913](https://github.com/iiankehn/slate-forge-web/actions/runs/41397164913) deployed successfully. Live HTML, app/PDF scripts, styles, help, PDF worker and service-worker code/assets are verified. The cache version reconciles with CI platform-specific notices.

The PR run passed all 90 browser cases without retries. The Pages repetition had one phone WebKit save/reload case that passed on retry (89 first-pass, one retry). This is under follow-up investigation before declaring reload stability complete. It must not be described as a retry-free deployment run.

## Reload follow-up published

PR #8 is merged and revision `3304b071ce3f6cba1823936d36ffd1a2c2006cd5` is live. The ownership channel now closes on page navigation and reconnects on back/forward restoration. Focused tests reproduce the unloading-page ownership response; a browser regression checks six reloads, a separate tab and a final original-tab reload while retaining the document ID, title and text. Save journeys wait for explicit save completion. Storage identifiers and file formats are unchanged.

- [PR CI 41398848560](https://github.com/iiankehn/slate-forge-web/actions/runs/41398848560): 465 Node tests and all 95 browser scenarios passed without retries.
- [Main CI 41400063361](https://github.com/iiankehn/slate-forge-web/actions/runs/41400063361): 465 Node tests and all 95 browser scenarios passed without retries.
- [Pages 41400063530](https://github.com/iiankehn/slate-forge-web/actions/runs/41400063530): deployed successfully after 465 tests and 95 completed browser scenarios. Repeated reload/second-tab checks passed in all five configurations. One desktop Firefox document-discovery/template journey needed a retry (94 first-pass, one retry); its intermittent locator failure remains unconfirmed test instability. Do not call this deployment run retry-free.
- Live HTML, app/PDF scripts, stylesheet, help and PDF worker match the verified build. Service-worker code and asset lists match, and its version reconciles with CI package notices. HTTPS responses are verified.

The requested interface pass and full automated suite are complete. The reload lifecycle fix is published. The Firefox UI retry remains a known follow-up; it does not add product feature scope. This release remains a public beta, with the physical-device and user-research limits stated above.


## Final focus correction and completed stability release

PR #9 corrects a reproducible next-frame focus race: setup completion, Continue writing and document creation could queue editor focus after the user had already selected another field. These transitions now focus synchronously while retaining the existing editor selection. The full-app DOM regression failed before the correction (expected title focus; actual document-content focus) and now passes for setup, Continue writing and template creation. The browser journey checks the same handoff before writing.

Document discovery now runs eight create-template/search/open cycles per configuration, checking the original document ID and body. Failures retain a model/title/query/results snapshot. CI rejects flaky cases even when their retry passes. The first expanded diagnostic run [41466214465](https://github.com/iiankehn/slate-forge-web/actions/runs/41466214465) passed 465 Node tests and 95 browser cases without retries. The earlier isolated Firefox failure did not recur; no original failure trace was retained, so its exact cause is unproven. This evidence must not be described as a conclusive reproduction of that historical failure.

Final-code evidence: [PR CI](https://github.com/iiankehn/slate-forge-web/actions/runs/41467347689), [main CI](https://github.com/iiankehn/slate-forge-web/actions/runs/41468991239), [release CI](https://github.com/iiankehn/slate-forge-web/actions/runs/41469421300) and [Pages deployment](https://github.com/iiankehn/slate-forge-web/actions/runs/41469421667) passed production/static checks, all 466 Node tests and all 95 browser scenarios without retries. Each run includes all five configurations, 40 template/discovery cycles, the focus handoff, repeated reload/separate-tab isolation, actual downloads/restore, encrypted backup, offline OCR and the existing axe checks.

Published source: `e2b7d0479daf44bab59efd266cfe8cb2a1829888`. Live primary assets and shell chunks match the local production build; service-worker code, asset lists and cache digest reconcile with the deployed platform-specific third-party notices. A temporary workflow-file push trigger started the explicitly authorized Pages release after the local CLI credential expired. It was immediately removed; publication remains manual-only. No product feature, storage identifier, file format, public origin or private Site identity changed.

The requested interface/stability release is complete and suitable for everyday public beta/tester use. Automated evidence does not certify physical devices, actual assistive-technology use, printer behavior, browser eviction or complex external-editor compatibility. Any future discovery recurrence should fail CI and be investigated from its retained diagnostics.


## Silent-update follow-on published — 2026-11-03

PR #10 / `9cc8e41684c744e3485f9d6e70f091994796b6a9` adds the explicitly requested automatic update behavior. [PR CI](https://github.com/iiankehn/slate-forge-web/actions/runs/41585035123), [main CI](https://github.com/iiankehn/slate-forge-web/actions/runs/41586086505) and [Pages](https://github.com/iiankehn/slate-forge-web/actions/runs/41586088144) passed 476 Node tests, build/static checks and all 100 browser scenarios without retries. The upgrade fixture publishes A then B, checks both saved tabs switch automatically with their writing intact, and reopens B offline in all five configurations. Live files/chunks and worker code/manifest/cache digest are verified. [AUTOMATIC_UPDATES.md](AUTOMATIC_UPDATES.md) records behavior, initial legacy-tab adoption, offline/save-failure fallback and verification limits. Original interface/roadmap scope stays closed.


## Brand Kit integration published — 2026-11-03

PR #11 / `1407181d5c04a21fabc3fa12066b6173da23b2aa` incorporates the supplied v1.2 Fold + Forge artwork. [main CI](https://github.com/iiankehn/slate-forge-web/actions/runs/41646799702) and [Pages](https://github.com/iiankehn/slate-forge-web/actions/runs/41646800305) passed 477 Node tests, production/static checks and all 100 browser scenarios without retries. Logo loading, responsive layouts and existing axe checks pass across the five configurations. Desktop ribbon, dark phone Workspace and phone onboarding captures are reviewed and linked in [BRANDING.md](BRANDING.md). Live shell/brand/icon files and worker code/manifest/cache digest are verified. Storage, document formatting, launch identifiers and private Site identity remain unchanged. OS icon refresh is platform-controlled; no storage clearing is required. The first Pages attempt 41644381970 blocked a retry-only WebKit worker-load error; the reload-ordering fix was verified before publication. This completes the explicit branding request and adds no product functions.
