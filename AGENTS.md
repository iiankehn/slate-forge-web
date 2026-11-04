# Slate Forge web development

## Current mandate

2026-11-04 mobile stability follow-up: the user reported the entire top header cut off on an iPhone screenshot. The safe-area correction is published; read docs/MOBILE_SAFE_AREAS.md for evidence and the user-confirmed affected-device header fix. Preserve inset protection independently of header padding, and keep Workspace scrolling/tour controls inside their protected region.

Continuation: the user's “Next” continues Word/ODT compatibility. The native inline ODT revision batch is published, with evidence in docs/ODT_TEXT_REVISIONS.md; preserve explicit refusal of unsupported revision structures and all existing storage/origin invariants.

2026-11-03 follow-on: the user explicitly requested advanced features and selected Word/ODT compatibility. The first compatibility batch is now published; docs/ODT_COMPATIBILITY.md records evidence and bounds. This request supersedes the earlier freeze below for selected compatibility work. Preserve pending post-release documentation work. Other advanced areas remain bounded until selected; no universal-fidelity claim is implied.

The requested interface, stability, silent-update and branding integration release is complete and published. Read docs/CODEX_HANDOFF.md, docs/ROADMAP.md, docs/PRODUCT_FOCUS.md and docs/UX_STABILITY.md for current scope and evidence. No autonomous new features or reopening of historical roadmaps. Fix reproducible defects within the focused product; report intermittent failures and retry counts honestly. The user authorizes necessary commands, repository changes and public Pages publication without routine approval questions.

Use sans-serif for the interface and new-document defaults; preserve font choices in existing documents. Keep the app local-first, account-free and without paid services, telemetry or cloud documents. Advanced compatibility tools are bounded maintenance areas, not new completion requirements. This browser/PWA project is separate from Slate Android.

## Source, verification and release

Preserve existing work; do not reset, force-push or discard pending changes. Preserve the preexisting untracked docs/ROADMAP_SCOPE_AUDIT.md. It is not the active roadmap.

Use Node 24. Run npm ci when dependencies are missing, npm test for affected regression checks, npm run build for production output and npm run check:dist for static packaging. dist/index.html is canonical tracked source; the build does not recreate it. Source whitespace check: git diff --check -- . ':!dist/*.js' ':!dist/chunks/*'. Bundled JavaScript contains intentional whitespace in text literals. Do not repeat expensive unchanged checks without a reason.

Browser checks run through GitHub Actions across five configurations; CI rejects tests that pass only on retry. Browser automation was denied by URL policy in this workspace. Never evade a policy denial through alternate hosts, raw CDP or shell browser automation. Synthetic DOM/IndexedDB and browser emulation are not physical-device, screen-reader, printer or external-editor certification. Preserve meaningful evidence and manual-verification limits.

Publish authorized releases through the existing manual GitHub Pages workflow to https://slate-web.iiankehn.com/ and verify the live artifacts. A GitHub commit alone does not deploy Pages. Preserve the separate private Site and origin in .openai/hosting.json; do not recreate it, change its audience or silently replace its origin. Update the handoff and roadmap against actual implementation and evidence.

## Storage compatibility

Preserve legacy document-studio storage identifiers, database versions and backup/file formats unless a tested migration is explicitly required. Workspace tokens are local namespaces, not authentication or device fingerprints. Different origins cannot automatically access existing browser documents. Never clear real user storage as a repair step. Saving, encrypted recovery, backups, PDF journals and OCR drafts require appropriate regression coverage when changed.
