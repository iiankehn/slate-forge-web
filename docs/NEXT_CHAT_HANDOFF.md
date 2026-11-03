# Next-chat handoff — Slate Forge web

Prepared 2026-11-03 from the repository at `56774d1`. This is a continuation guide, not a new feature roadmap. Fetch current `main` before relying on the historical commit or test counts below.

## Product, scope and exact stopping point

- Repository: https://github.com/iiankehn/slate-forge-web — branch `main`.
- Public app: https://slate-web.iiankehn.com/ . Separate project from Slate Android.
- The agreed essential-product roadmap is complete. Ribbon, Workspace/backstage, onboarding, tour, light/dark palettes, sans-serif defaults, silent updates and supplied Brand Kit icons are implemented and published. Core editing, local saving/recovery/backups, supported import/export and printing are implemented.
- The last task was a read-only feature-completeness assessment. It found no further required features in the approved scope and no open GitHub issues/PRs at that time. Do not convert this assessment or historical limitations into a new backlog.
- Advanced layout fidelity, exact Word/ODT interchange, full native Word nested review, general PDF text reflow/vertical replacement, general XFA scripts/bindings and comprehensive signature revocation/LTV remain bounded, frozen or excluded by `docs/PRODUCT_FOCUS.md`. RFC3161 timestamp support already exists. Accounts, cloud sync and broader desktop-office parity are not completion requirements.
- Remaining work is documented manual verification, fixing demonstrated defects, and reconciling stale documentation. `docs/FULL_ROADMAP_PROGRESS.md` and parts of `docs/PUBLIC_BETA.md` still describe superseded scope. `docs/DEVICE_QA.md` also contains historical capability claims that must be checked against current source, not blindly reopened as missing features.
- The user has not selected a new implementation task after this assessment. Continue only within the next request; do not autonomously expand the roadmap.

## Read first and instruction precedence

Read `AGENTS.md`, `docs/CODEX_HANDOFF.md`, `docs/ROADMAP.md`, `docs/PRODUCT_FOCUS.md`, `docs/RELEASE_READINESS.md` and `docs/UX_STABILITY.md`. Read `docs/AUTOMATIC_UPDATES.md`, `docs/BRANDING.md` and `docs/DEVICE_QA.md` when relevant. Check for more specific AGENTS.md files before edits.

Current ROADMAP/PRODUCT_FOCUS and the user's latest instructions supersede older eight-area feature mandates and historical release sections. The user explicitly authorizes necessary commands, repository changes and public Pages publication without routine approval questions. No new features without a new request. Preserve user work and report actual evidence candidly.

If available, use the Start Feature Work skill for synchronization and Slate Forge Release for releases; use Slate Forge Storage Checks for persistence/file-format changes. Those skills may describe the earlier Sites provider: this repo's current public deployment is GitHub Pages. Preserve the separate private Site; do not deploy there or replace it as a workaround. The repo scripts and workflows make continuation possible without installing these optional assistant skills/plugins.

## Fresh environment: required tools and dependencies

- Linux is the reference environment; CI uses Ubuntu 24.04 in a pinned Playwright container.
- Git, CA certificates and HTTPS access to GitHub and the npm registry/package download hosts.
- **Node.js 24.x** and its npm. `.nvmrc` is `24`; package engines require `>=24 <25`. The previous workspace had Node `v24.19.0` / npm `11.9.0`; those patch versions are observations, not extra version requirements.
- Install all project and development dependencies with **`npm ci`**, using committed `package-lock.json`. Do not use `--omit=dev` or regenerate the lockfile merely to start work. Tiptap, PDF libraries, Tesseract/OCR language data, Transformers/ONNX, esbuild, jsdom/fake-indexeddb, Playwright and axe are already declared; no manual global installs of those packages are needed.
- Python 3 is useful for optional skill helper scripts; it is not required by the app's declared build/test scripts.
- GitHub CLI (`gh`) with repository write/Actions access, or equivalent connected GitHub tools, is needed to push changes, inspect authenticated workflow results and dispatch releases. Reading/cloning this public repo needs no credentials. Verify supplied authentication with `gh auth status`; never print tokens or assume credentials transfer between chats.
- No backend, database server, API keys, paid services, Docker or external model service is required to build or serve the app. The semantic model is tracked under `assets/semantic`; OCR assets are supplied by npm dependencies and copied during the build.
- The original Brand Kit ZIP and old workspace screenshots are not startup dependencies. Integrated brand files and license/provenance are committed under `dist/brand` and `docs/BRANDING.md`.

For a genuinely new workspace, with Node 24 already provisioned:

```bash
git clone https://github.com/iiankehn/slate-forge-web.git
cd slate-forge-web
node --version
npm --version
npm ci
npm run build
npm run check:dist
```

If nvm is already installed, `nvm install 24` and `nvm use 24` select the supported major. Otherwise provision Node 24 through the environment's supported installer; do not silently run the project on an older Node release.

For an existing checkout, inspect before integration:

```bash
git status --short
git branch --show-current
git log -1 --oneline
git fetch origin main
git rev-list --left-right --count HEAD...origin/main
```

Inspect fetch errors without exposing credential-bearing remotes. An explicit public HTTPS fetch is available when a workspace's inherited remote helper fails. Only fast-forward when appropriate; preserve changes and unpublished commits. Never reset, clean, force-push or silently stash to synchronize. In the previous workspace, `docs/ROADMAP_SCOPE_AUDIT.md` was a preexisting untracked file: preserve it if present; it is not authoritative scope and is not needed for a fresh clone.

## Development, validation and browser tooling

```bash
# Serve the production build; leave this process running in its own terminal.
node scripts/serve-dist.mjs
# Open http://127.0.0.1:4173/slate-forge-web/
```

There is no npm dev/start script. `dist/index.html` is tracked canonical HTML, not disposable build output. Never delete the entire `dist` directory: the build regenerates bundles/vendor files but does not recreate all tracked sources. Rebuild after source changes.

For code changes, use focused regression checks as appropriate, then the required release checks:

```bash
npm test
npm run build
npm run check:dist
git diff --check -- . ':!dist/*.js' ':!dist/chunks/*'
```

Do not rerun expensive unchanged checks merely for reassurance. A documentation-only handoff does not require another full runtime suite. Bundled JavaScript includes intentional whitespace in text literals, hence the whitespace exclusions.

Browser checks use the repo's Playwright `1.64.1` and axe dependencies. `playwright.config.mjs` starts the static server automatically. Existing GitHub Actions install all dependencies and run `npm run test:browser -- --max-failures=1` across desktop Chromium/Firefox/WebKit and phone Chromium/WebKit emulation. CI rejects retry-only successes (`failOnFlakyTests`); report retries honestly.

**The previous workspace denied local browser automation by URL/security policy.** Follow current policy; never evade a denial through shell browser automation, CDP, alternate hosts or changed origins. Prefer the existing GitHub Actions workflows for browser evidence. In a different environment where local automation is permitted, browser execution additionally requires the matching Playwright browser binaries and OS libraries (`npx playwright install --with-deps chromium firefox webkit` on a supported Linux host). That installation is unnecessary for ordinary source/Node work and for the existing CI container, which already supplies the matching browsers/libraries. Do not install an unrelated global Playwright version.

For a managed cloud environment, read its runtime skill and check environment/network/credential readiness before network or container work. Preserve injected proxy/CA settings and do not expose secrets. At handoff, managed network status was unrestricted; that does not establish the next environment's policy or credentials.

## Publication and known-good evidence

Public deployment is the existing manual workflow `.github/workflows/pages.yml`, named **Publish GitHub Pages**. `.github/workflows/ci.yml` is **Release checks**. A push alone does not deploy Pages. The public domain, Pages configuration and HTTPS are already set up; no new hosting project or domain setup is needed.

With authenticated `gh`, after the intended code is integrated on `main`:

```bash
gh workflow run ci.yml --repo iiankehn/slate-forge-web --ref main
gh run list --repo iiankehn/slate-forge-web --workflow ci.yml --limit 5
# Dispatch publication only for an intended release, not startup housekeeping.
gh workflow run pages.yml --repo iiankehn/slate-forge-web --ref main
gh run list --repo iiankehn/slate-forge-web --workflow pages.yml --limit 5
# Watch the actual returned run ID, then inspect failures/artifacts if needed.
# gh run watch RUN_ID --repo iiankehn/slate-forge-web --exit-status
```

Ordinary main pushes/PRs already trigger Release checks; manual dispatch is optional when a new run is actually needed. Pages independently rebuilds and reruns Node/static/browser checks before deployment. Follow the workflow's current pinned image and actions rather than replacing them with older examples. Verify live artifacts against the built release, including service-worker manifest/cache digest, before claiming publication.

Last verified runtime source: `1407181d5c04a21fabc3fa12066b6173da23b2aa`. Later documentation-only commits do not change that runtime. Historical successful evidence: **477 Node tests and 100 browser scenarios without retries**, production/static checks and live asset verification:

- CI: https://github.com/iiankehn/slate-forge-web/actions/runs/41646799702
- Pages: https://github.com/iiankehn/slate-forge-web/actions/runs/41646800305

An initial branding deployment was correctly blocked on a retry-only WebKit worker-load failure. The release fix drains outstanding registration/update checks before reload and stops new checks once reload is pending. Do not remove that protection or weaken the page-error/retry gate.

## Invariants and remaining evidence limits

Keep the app local-first/account-free, with no telemetry, paid APIs or cloud documents. Preserve `document-studio` storage identifiers, database versions, workspace namespaces, backup/file formats, existing document fonts and all saved work. Never clear real user storage to repair an issue. Workspace IDs are local namespaces, not authentication.

Preserve the public origin: data stored on another origin does not transfer automatically. Preserve `.openai/hosting.json` and its separate private Site ID `appgprj_6ae296f07e4881918b653497e03232d7`; do not change its audience or recreate it.

Silent updates checkpoint/flush saves and defer reload for errors, pending tools/dialogs/composition/offline preparation. Offline launches retain cached operation; already-open legacy tabs and OS-controlled installed-icon refresh have documented platform limits. Do not promise impossible instantaneous updates or force reinstall/storage deletion.

The repo assesses the app as ready for everyday public beta/tester use. Physical devices, real assistive technology, printers, storage eviction and external-editor compatibility are not certified by the automated suite. These are verification limits, not permission to add new product features. Recheck current source before accepting any historical unsupported-feature claim.
