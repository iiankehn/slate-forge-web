# Mobile header and safe areas

The user reported an iPhone screen where the entire document header was covered and the ribbon was the first visible app row. The redesign's later `.app-header` padding shorthands override the earlier `safe-area-inset-top` rule. In dark standalone mode the app requests a translucent iOS status bar, so that omission can put the title, save status and header buttons under the system status area.

## Correction

The outer `.shell` now reserves top and horizontal hardware safe areas independently of header padding. The status footer reserves bottom space without doubling horizontal insets. Fullscreen Workspace and the onboarding/tour dialogs also respect safe areas. Workspace content scrolls inside its protected region, and its tour launcher is positioned relative to the inset sidebar. Zero-inset browser layouts retain their existing padding; document formatting is unchanged. Native ribbon horizontal scrolling remains available inside the ribbon; the document itself must not overflow horizontally.

CSS custom properties default to the actual `env(safe-area-inset-*)` values. Browser regression tests override those properties only in disposable test pages to simulate hardware insets; no inset override is stored in user preferences. Pinch zoom remains enabled.

## Verification

The browser journey checks onboarding, title/brand/menu/status controls, footer controls, title focus, document scrolling, ribbon scrolling and fullscreen Workspace. It covers a 393 px portrait viewport with 59/34 px top/bottom insets, a shorter viewport, landscape with left/right cutouts, a smaller 320 px viewport and a zero-inset layout. It checks geometry and document/title retention and captures portrait/landscape evidence across the existing five browser configurations.

These are simulated viewport/inset checks, not physical iPhone or installed-PWA certification. The user's original screenshot is physical-device evidence of the defect; a post-release check on that device remains necessary. Record actual CI, release and live-file verification outcomes before claiming publication.

No storage identifiers, database versions, backup formats, public origin or private Site settings change.

## PR evidence

[PR #14](https://github.com/iiankehn/slate-forge-web/pull/14) passed [CI 41742376487](https://github.com/iiankehn/slate-forge-web/actions/runs/41742376487): 502 Node tests, production/static checks and all 115 browser scenarios without retries on `3d997d1`. The five new geometry journeys include the Workspace tour button and safe inner scrolling. The earlier complete shell/scrolling draft also passed 502/115 in run 41740512246; the initial superseded run 41740255486 was cancelled.

Reviewed final phone-WebKit captures: [portrait](ui/mobile-safe-area-portrait.png) and [landscape](ui/mobile-safe-area-landscape.png). The reserved bands simulate OS safe areas; the browser does not draw iOS status icons or a physical notch. These are generated test documents, not the user's screenshot or personal data. Physical-device post-release verification remains open.

## Publication and device retest

Published runtime `95fc8402f0b879dd59457222647a5222e279175a` is live at https://slate-web.iiankehn.com/ (2026-11-04). [Pages 41772922806](https://github.com/iiankehn/slate-forge-web/actions/runs/41772922806) passed 502 Node tests, production/static checks and all 115 browser scenarios without retries before deployment. Live verification checked 44 shell/worker URLs against the build; service-worker code/manifests match and cache digest `a1c3d8e5f2390c87` reconciles with the live platform-specific THIRD-PARTY-NOTICES.txt substituted into the build digest. Optional assets used from the build were not all individually fetched from production.

On the affected iPhone, save work and reopen the app online to receive the release. Check that the brand, title, save indicator and menu are below the system status area. Repeat after rotation and after showing/dismissing the keyboard, then check Workspace and its tour control. Record browser/OS version and whether the app is installed or running in a browser. These physical-device results have not yet been supplied.

Final merged-source evidence: [main CI](https://github.com/iiankehn/slate-forge-web/actions/runs/41772922302) and [Pages](https://github.com/iiankehn/slate-forge-web/actions/runs/41772922806) passed 502 Node tests, production/static checks and all 115 browser scenarios without retries. Physical iPhone results remain pending; the automatic checks and reviewed captures simulate viewport/inset geometry.
