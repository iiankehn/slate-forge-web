# Slate Forge web development

This is the browser/PWA project, separate from Slate Android. Read docs/CODEX_HANDOFF.md, docs/ROADMAP.md, docs/RELEASE_READINESS.md and the latest section of docs/RELEASE_BATCH.md before starting work.

Work in coherent feature batches, implement and verify them, and update the roadmap against actual evidence. Preserve existing work; do not reset, force-push or discard changes. Keep the app local-first, account-free, without paid services, telemetry or cloud documents. Preserve legacy document-studio storage identifiers and database versions unless a tested migration requires a change. Workspace tokens are local namespaces, not authentication or device fingerprints.

Run npm ci when dependencies are missing, npm test for regression checks and npm run build for production output. dist/index.html is canonical tracked source; the build does not recreate it. Source whitespace check: git diff --check -- . ':!dist/*.js' ':!dist/chunks/*'. Bundled JavaScript contains intentional whitespace in text literals.

Preserve the existing private Site and origin in .openai/hosting.json. A GitHub commit does not publish that Site. Use the supported Sites deployment integration if available; never invent credentials, recreate the Site, make it public or silently replace its origin. A different origin cannot automatically access documents already stored on users' devices.

Browser automation was blocked by URL policy in the previous workspace. Never evade a policy denial through alternate hosts, raw CDP or shell browser automation. Independently evaluate permitted browser capabilities in a new environment. Synthetic DOM/IndexedDB and LibreOffice checks are not physical-device or Microsoft Word certification. Track unverified real-browser, downloads, print, PWA lifecycle, IME, accessibility and actual storage-pressure gates explicitly.
