# Mobile header and safe areas

The user reported an iPhone screen where the entire document header was covered and the ribbon was the first visible app row. The redesign's later `.app-header` padding shorthands override the earlier `safe-area-inset-top` rule. In dark standalone mode the app requests a translucent iOS status bar, so that omission can put the title, save status and header buttons under the system status area.

## Correction

The outer `.shell` now reserves top and horizontal hardware safe areas independently of header padding. The status footer reserves bottom space without doubling horizontal insets. Fullscreen Workspace and the onboarding/tour dialogs also respect safe areas. Normal zero-inset browser layouts and document formatting are unchanged. Native ribbon horizontal scrolling remains available inside the ribbon; the document itself must not overflow horizontally.

CSS custom properties default to the actual `env(safe-area-inset-*)` values. Browser regression tests override those properties only in disposable test pages to simulate hardware insets; no inset override is stored in user preferences. Pinch zoom remains enabled.

## Verification

The browser journey checks onboarding, title/brand/menu/status controls, footer controls, title focus, document scrolling, ribbon scrolling and fullscreen Workspace. It covers a 393 px portrait viewport with 59/34 px top/bottom insets, a shorter viewport, landscape with left/right cutouts, a smaller 320 px viewport and a zero-inset layout. It checks geometry and document/title retention and captures portrait/landscape evidence across the existing five browser configurations.

These are simulated viewport/inset checks, not physical iPhone or installed-PWA certification. The user's original screenshot is physical-device evidence of the defect; a post-release check on that device remains necessary. Record actual CI, release and live-file verification outcomes before claiming publication.

No storage identifiers, database versions, backup formats, public origin or private Site settings change.
