# Slate Forge — essential product and stability scope

The latest user direction replaces the former eight-area feature-completion mandate. No new document-engine features. Evaluate unfinished scope by everyday usefulness and maintenance cost; see [PRODUCT_FOCUS.md](PRODUCT_FOCUS.md) for decisions to keep, bound or stop each area. The previous feature roadmap is preserved in Git history.

Completed interface pass (PR #7):

- [x] A distinct ribbon with grouped everyday commands.
- [x] A Workspace start/backstage screen for documents, templates, opening, print, preferences and local session management.
- [x] First-visit setup cards and a skippable/replayable tour.
- [x] More light and dark palettes, preserving existing preferences and document colors.

After the interface changes, run stability and UX regressions across the existing product and these flows. Fix resulting defects without expanding scope. Preserve local saving, backup compatibility, the public GitHub Pages host and the separate private Site identity. Future accounts are not part of this release.

The UI release is published with sans-serif interface and new-document defaults. The current follow-up is reload reliability from a phone WebKit retry observed in deployment checks; it is stability work, not added feature scope.
