# Focused interface stability and UX checks

This pass follows the UI redesign, not a new document-feature roadmap. Product scope decisions are in PRODUCT_FOCUS.md. Existing formats, storage identifiers and device-copy behavior remain compatible.

## Interface behavior

- Workspace opens on ordinary visits; direct installed-app shortcuts and file launches can enter their destination directly. Its local identity area is deliberately separate from document commands. No accounts or remote storage were added.
- First-visit cards explain the product, offer shared appearance preferences and explain local saving/backups. Setup and the four-step tour can be skipped, cancelled or replayed. Completion is remembered when browser storage is available.
- Home, Insert, Layout, Review, View and Tools form a task-grouped ribbon. Formatting controls are moved rather than cloned; Undo availability follows editor state. Advanced file tools are outside the primary writing tab.
- Workspace contains recent/title-searchable documents, templates, opening/export, print, settings, backups and session controls. Destructive session actions still require the existing separate confirmation.
- Six added light/dark palettes share the original preference storage, accents and screen-only dark-page behavior. A palette does not alter saved or exported document colors.

## Verification plan and evidence

The complete Node suite checks saving, storage failure handling, imports/exports, PDF/OCR tools, review and the new interface integration. Added tests cover first/returning visits, denied preference storage, inert document titles, tour completion/cancellation, palette/pre-paint consistency and ribbon keyboard/focus behavior.

GitHub Actions runs the full production build, static packaging checks and browser scenarios across desktop Chromium/Firefox/WebKit and phone Chromium/WebKit emulation. Existing actual-download, backup restoration and offline OCR scenarios remain in the suite. New journeys cover onboarding/tour, preferences, document discovery, templates, end-session cancellation, narrow viewport overflow and automated axe WCAG A/AA checks, including every palette. Screenshots and accessibility findings are retained with browser artifacts for visual review.

Initial local result: 462 Node tests pass, as do production build, static packaging and source whitespace checks. Browser and accessibility results must be recorded after execution; no browser/device success is implied by this initial result.

This is automated regression testing plus a source/visual UX review. It does not replace user research, physical-device testing, actual screen-reader use, IME/stylus testing, real storage eviction or printer/external-word-processor certification.
