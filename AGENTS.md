# Slate Forge web development

## Current mandate — focused product and interface

The interface pass and reload fix are published; see UX_STABILITY.md for exact evidence. No autonomous new feature work. Report retry counts honestly and keep intermittent test failures visible.

Use sans-serif for the interface and new-document defaults; preserve fonts chosen in existing documents. No new document-engine or advanced feature development. Implement the explicitly requested ribbon, first-visit onboarding/tour, start/backstage workspace and more light/dark palettes. Evaluate unfinished scope against ordinary writing needs. Then run stability, accessibility and UX regressions. Existing public GitHub Pages release authorization remains in force; preserve the private Site and all existing storage identifiers. Older audit/feature mandates below are historical.

## Latest user mandate — audit and publish current implementation

The user now explicitly requests a complete audit, a readiness assessment and publication of what is implemented. This supersedes the feature-only prohibition below. Run tests/build/static/browser CI and fix release blockers; do not expand feature scope. Publish to the existing public GitHub Pages host through the current repository workflows, preserving the separate private Site identity and all storage identifiers. No further routine approval questions are needed.

## Active user mandate — locked feature-only phase

Work only on the eight approved areas in docs/ROADMAP.md. That file supersedes older roadmap/backlog snapshots. No added feature scope, no tests, builds, validation, audits, browser/device checks or CI during this phase. Use [skip ci] commits on the implementation branch; do not merge/deploy untested work. The user targets end-of-day feature completion if possible; do not promise or claim completion without the implementation. Continue without routine approval questions. Older verification/release commands below are references for the deferred release phase and must not run now.

This is the browser/PWA project, separate from Slate Android. Read docs/CODEX_HANDOFF.md, docs/ROADMAP.md, docs/RELEASE_READINESS.md and the latest section of docs/RELEASE_BATCH.md before starting work.

Work in coherent feature batches, implement and verify them, and update the roadmap against actual evidence. Preserve existing work; do not reset, force-push or discard changes. Keep the app local-first, account-free, without paid services, telemetry or cloud documents. Preserve legacy document-studio storage identifiers and database versions unless a tested migration requires a change. Workspace tokens are local namespaces, not authentication or device fingerprints.

Run npm ci when dependencies are missing, npm test for regression checks and npm run build for production output. dist/index.html is canonical tracked source; the build does not recreate it. Source whitespace check: git diff --check -- . ':!dist/*.js' ':!dist/chunks/*'. Bundled JavaScript contains intentional whitespace in text literals.

Preserve the existing private Site and origin in .openai/hosting.json. A GitHub commit does not publish that Site. Use the supported Sites deployment integration if available; never invent credentials, recreate the Site, make it public or silently replace its origin. A different origin cannot automatically access documents already stored on users' devices.

Browser automation was blocked by URL policy in the previous workspace. Never evade a policy denial through alternate hosts, raw CDP or shell browser automation. Independently evaluate permitted browser capabilities in a new environment. Synthetic DOM/IndexedDB and LibreOffice checks are not physical-device or Microsoft Word certification. Track unverified real-browser, downloads, print, PWA lifecycle, IME, accessibility and actual storage-pressure gates explicitly.
