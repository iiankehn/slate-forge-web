# Next-chat handoff — Slate Forge web

## Current compatibility release — native ODF shapes

Published 2026-11-04 from `65d854db558b8af9974c874cd08b82f60d86e168` at https://slate-web.iiankehn.com/ . Native ODF export/reimport supports rectangles, rounded rectangles, ellipses and uniform text boxes. It reads current native objects, omits hidden/private scene data and preserves the existing preview modes. [main CI](https://github.com/iiankehn/slate-forge-web/actions/runs/41838522282) and [Pages](https://github.com/iiankehn/slate-forge-web/actions/runs/41838535562) passed 520 Node tests, production/static checks and all 125 browser scenarios without retries. Verified 45 live shell/worker URLs and reconciled cache digest `8b1134f3aee723e2` against platform-specific notices. See [ODT_NATIVE_SHAPES.md](ODT_NATIVE_SHAPES.md) for supported objects, actual LibreOffice headless resaves/rendering and remaining limits. Storage/origin identities and the confirmed mobile safe-area fix are unchanged.

Native ODF batch (2026-11-04): the bounded shapes/text-box release is published from `65d854db558b8af9974c874cd08b82f60d86e168`; see ODT_NATIVE_SHAPES.md for supported objects and evidence. Preserve prior retained-canvas modes and the confirmed mobile fix.

## Previous compatibility release — ODT original canvases

Published 2026-11-04 from `c75516ffde44e5aee44367aee72b1f4f26977a73` at https://slate-web.iiankehn.com/ . ODT can retain original editable Slate Forge canvases alongside PNG previews, and import honors the ODF recording default found in a LibreOffice resave; changed/ambiguous previews fall back to images, and image-only copies omit retained scenes. Export now enforces the existing packed/expanded opening limits. [main CI](https://github.com/iiankehn/slate-forge-web/actions/runs/41777777965) and [Pages](https://github.com/iiankehn/slate-forge-web/actions/runs/41777778525) passed 513 Node tests, production/static checks and all 120 browser scenarios without retries. Verified 45 live shell/worker URLs and reconciled cache digest `f1606aa1167db141` against platform-specific notices. Native ODF objects, formatting/structural revisions and broader Word/LibreOffice resave testing remain open. The user-confirmed mobile header fix and all storage/origin identities are preserved. See [ODT_EDITABLE_CANVASES.md](ODT_EDITABLE_CANVASES.md).

Word/ODT continuation (2026-11-04): original-canvas retention for ODT is published from `c75516ffde44e5aee44367aee72b1f4f26977a73`; see ODT_EDITABLE_CANVASES.md for release evidence and remaining compatibility limits. Preserve the user-confirmed mobile header fix.

Previous mobile runtime: `95fc8402f0b879dd59457222647a5222e279175a` (2026-11-04), the mobile safe-area correction requested after the user supplied an iPhone screenshot with the title/header covered. Read MOBILE_SAFE_AREAS.md first for the cause, shell/Workspace/onboarding fix, reviewed captures and affected-device confirmation scope. [main CI](https://github.com/iiankehn/slate-forge-web/actions/runs/41772922302) and [Pages](https://github.com/iiankehn/slate-forge-web/actions/runs/41772922806) passed 502 Node tests, production/static checks and all 115 browser scenarios without retries. Live shell/worker files and cache digest `a1c3d8e5f2390c87` are verified/reconciled. On 2026-11-04 the user replied “Confirmed fixed” after the published update, confirming the reported header clipping is resolved on the affected device. Prior native ODT text revisions remain published and unchanged; advanced work stays within the selected Word/ODT area.

Latest direction (2026-11-03): the user then requested advanced features and selected Word/ODT compatibility, superseding the earlier focused-only direction for that area. See ODT_COMPATIBILITY.md for the native ODT comments/canvas-preview batch and its verification boundaries. Earlier scope statements below describe the prior stopping point.

Prepared 2026-11-03 from the repository at `56774d1`. This is a continuation guide, not a new feature roadmap. Fetch current `main` before relying on the historical commit or test counts below.

Codex environment/tooling supplement verified 2026-11-03 after handoff commit `b426344`. Environment access and app connections must be checked again in the next chat; a repository document cannot provision credentials or override platform policy.

Post-release review 2026-11-03: the user requested remaining-limitations work and explicitly chose to keep the focused product scope. Read [POST_RELEASE_REVIEW.md](POST_RELEASE_REVIEW.md). Stale beta/roadmap/device-QA claims were reconciled; 477 Node tests passed again. No runtime defect was established or new runtime deployment required. Physical devices, screen readers, printed PDFs, real storage eviction and target-editor exchange still require actual evidence. FULL_ROADMAP_PROGRESS and PUBLIC_BETA now reflect current scope; older capability claims elsewhere remain historical until checked against source.

## Product, scope and exact stopping point

- Repository: https://github.com/iiankehn/slate-forge-web — branch `main`.
- Public app: https://slate-web.iiankehn.com/ . Separate project from Slate Android.
- The agreed essential-product roadmap is complete. Ribbon, Workspace/backstage, onboarding, tour, light/dark palettes, sans-serif defaults, silent updates and supplied Brand Kit icons are implemented and published. Core editing, local saving/recovery/backups, supported import/export and printing are implemented.
- The last task was a read-only feature-completeness assessment. It found no further required features in the approved scope and no open GitHub issues/PRs at that time. Do not convert this assessment or historical limitations into a new backlog.
- Advanced layout fidelity, exact Word/ODT interchange, full native Word nested review, general PDF text reflow/vertical replacement, general XFA scripts/bindings and comprehensive signature revocation/LTV remain bounded, frozen or excluded by `docs/PRODUCT_FOCUS.md`. RFC3161 timestamp support already exists. Accounts, cloud sync and broader desktop-office parity are not completion requirements.
- Remaining work is documented manual verification and fixing demonstrated defects. The post-release review reconciles FULL_ROADMAP_PROGRESS, PUBLIC_BETA and known stale DEVICE_QA capability claims. Recheck current source before treating any older limitation as a missing feature.
- The user selected focused limitations/verification work after this assessment. Follow POST_RELEASE_REVIEW; do not autonomously expand the roadmap.

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

## Codex environment, connected apps and tools

Use a Codex session with a writable checkout, a shell/command execution tool, filesystem read/edit capability, and outbound HTTPS for repository/package access. A chat with only GitHub file-reading tools cannot run this project's build or Node tests. The previous checkout was `/workspace/slate-forge-web`; paths and attachment locations do not automatically transfer to a new environment.

| Capability | Required setup or supported alternative |
| --- | --- |
| Shell and files | In this session, `functions.exec` orchestrates `tools.exec_command`, `tools.write_stdin`, `tools.apply_patch` and `tools.view_image`. Discover the next session's equivalent tools rather than assuming these exact names exist. Use command sessions for long-running work and file patches for edits. |
| GitHub app | The connected **GitHub** app is available here for repository metadata/files, issues, PRs, checks/logs and artifacts. Prefer its supported capabilities for those operations. Give it access to `iiankehn/slate-forge-web` in the next session, or use authenticated `gh` for capabilities the app lacks. A public repository's readability does not prove mutation/Actions access. |
| Git transport and Actions | Git plus an authenticated GitHub CLI/credential helper or another supported credential provider. A connected app's authorization does not automatically configure shell Git or `gh`. Verify each path used. The latest verified CLI identity was `iiankehn`, with `ADMIN` permission on this repo; do not assume this transfers. |
| Managed cloud environment | If using the **Cloud Environment** app, call its `environment_status` tool and follow the cloud-environment-runtime skill. Wait for a selected starting environment only when its tools/files are needed. Confirm network and credential readiness; do not copy an old environment ID. A normal supported terminal/workspace is sufficient if this app is absent. |
| Source search and file transfer | `rg` is preferred; Git/file tools are alternatives. `curl`, CA certificates, `unzip` and `zip` are useful for live-asset checks and CI artifact inspection. If an uploaded file is needed, use the session's supported download tool or its supplied local path. Old `/tmp` attachments are not guaranteed to exist. |
| Browser and visual inspection | Existing GitHub Actions provide the supported cross-browser suite. Retrieve logs, traces and screenshots using GitHub artifact tools or `gh run download`, then use an image viewer where available. A separate interactive browser tool is optional; it must be permitted by current policy. Do not bypass a browser-policy denial. |
| Skills | If available: Start Feature Work, Slate Forge Release, Slate Forge Storage Checks and cloud-environment-runtime. Discover/read them through the session's skills tools; do not assume old skill filesystem paths exist. Repo instructions/scripts remain available without those skills. |
| Sites | The **Sites** app is available in this session but is not required for public GitHub Pages development or release. Preserve its existing private project; do not install/use Sites to replace Pages. |

No Notion, Slack, email, Figma, image-generation, security-plugin or database app is needed to resume this project. Do not introduce an unrelated app connection or external service as a startup dependency. An image-generation tool is not needed to reuse the committed approved branding. Do not spawn extra agents as a startup requirement.

For shell publishing, the selected identity needs repository contents write access, PR access if using PRs, Actions read access for results/artifacts and Actions write access to dispatch workflows. Editing workflow files can require additional workflow authorization from the chosen GitHub credential type. Pages deployment itself uses the existing workflow's `pages: write` and `id-token: write` job permissions; do not place a personal token in the app or repository. Use least-privilege supported credentials and report the specific missing operation if access fails. Never copy credentials into this handoff.

The previous session's `gh` used an injected `GH_TOKEN`. Managed-environment status separately reported no configured secret bindings; that does not mean CLI authentication was absent. Check observed CLI/app behavior rather than inferring access from an environment-variable listing. Do not dump the environment or secret files. Use existing injected authentication normally; only report actual missing access, not a presumed need to log in again.

The current workflows use Microsoft's Playwright `v1.64.1-noble` container, pinned by digest in `.github/workflows/ci.yml` and `pages.yml`. Docker is installed in this workspace but is optional for local source/build work. If deliberately reproducing that container elsewhere, read the current image pin and the cloud runtime's Docker/proxy/CA guidance first. Do not assume a working Docker daemon or registry access merely because its CLI exists.

Allow outbound HTTPS to the actual GitHub/API/raw/artifact hosts and npm package hosts used by supported tools and `package-lock.json`. Browser binary hosts are only needed for permitted local browser installation; container registry access is only needed where containers are actually pulled. GitHub Actions perform their own runner downloads. Report a denied destination accurately; never disable TLS verification, remove the proxy or route around a policy denial.

Use a writable workspace with room for the checkout, npm dependencies, generated bundles/vendor assets and test artifacts. This workspace's installed `node_modules` was approximately 930 MiB and the tracked semantic assets approximately 23 MiB; these are observations, not fixed budgets. Allow several GiB of working space, particularly for optional browser downloads. No special PDF/OCR API key, external model download or original branding archive is needed for the standard build.

## Startup preflight in a new Codex chat

1. Discover the available command/file, GitHub, environment and image-viewing tools. Read applicable environment and repository instructions. Check actual platform approvals/network/browser policy; prior user authorization does not bypass those controls.
2. Locate the existing checkout or clone the public repository. Inspect local changes and safely synchronize as described above. Check Node 24 before installing dependencies; run `npm ci` if dependencies are absent or the lockfile changed.
3. Verify shell tooling and authenticated GitHub access with the read-only commands below. If only the connected GitHub app is available, perform equivalent repo/workflow access checks there. Do not print credential-bearing remote URLs.
4. Use the fresh-clone build/static checks above to establish startup readiness when the environment is new. Confirm the local server can bind port 4173 when needed. Do not start a second server while Playwright is configured to manage it.
5. Do not assume screenshots, local documents, untracked files, shell sessions, authentication or package installations transferred from the previous chat. Committed source, models, branding, instructions and release evidence are available from the repo. Stop only the dependent operation when a real capability is missing and continue independent authorized work.

```bash
for sf_tool in git node npm gh rg curl python3 unzip zip; do
  command -v "$sf_tool" || true
done
node -e 'if (Number(process.versions.node.split(".")[0]) !== 24) { console.error("Node 24 is required"); process.exit(1); } console.log("Node", process.versions.node)'
npm --version
git status --short
gh auth status
gh repo view iiankehn/slate-forge-web --json nameWithOwner,viewerPermission
gh workflow list --repo iiankehn/slate-forge-web
```

The tool-discovery loop is informational: missing optional tools do not invalidate source work. `gh auth status` is designed to mask tokens; never add `--show-token`. `gh workflow list` verifies read access, not dispatch permission. Confirm write/dispatch access through the intended authorized operation, not an unrelated test mutation or dummy deployment. Before committing, ensure Git author identity is configured through the environment's supported setup; never copy a prior session's personal identity blindly.

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
