# Slate Forge Web — DEV remote-computer handoff

> **Continuation update:** DEV/Windows boot repair is deferred by the user. Continue in the hosted workspace, solo, with verification on GitHub. PR #42 is merged and published; its current release status is in [SECTION_NUMBERING.md](SECTION_NUMBERING.md). The transfer snapshot below records the earlier handoff, not a claim that DEV boots or has been configured.

Prepared November 15, 2026. This is the current entry point for continuing on **DEV**, the remote development computer. It describes the source and workflow; it does not assert that DEV has already been connected, provisioned or authenticated. No DEV hostname or filesystem path was supplied. Run the setup in the actual remote session and discover its checkout before cloning.

## 1. Read first and preserve the working agreement

Read this document, [AGENTS.md](../AGENTS.md), [GitHub verification](GITHUB_VERIFICATION.md), the newest sections of [ROADMAP.md](ROADMAP.md), and [COMPATIBILITY_INVENTORY.md](COMPATIBILITY_INVENTORY.md). [CODEX_HANDOFF.md](CODEX_HANDOFF.md) is the chronological release record. Newer user instructions override older skill/document defaults.

- **Work solo.** The user stopped all agents to reduce usage. Do not spawn/resume Dev, verification, adversarial or other agents unless explicitly requested again.
- **DEV/Codex does development; GitHub Actions executes verification.** Author source, tests and probes; review source and diagnose Actions evidence. Do not routinely run local Node/Python suites, builds, browser automation, LibreOffice conversion, PDF comparison or live release-byte/cache probes. A specific user request is needed for local diagnostic execution. Provisioning dependencies is separate from running those suites.
- No physical-device testing gate. Browser emulation and actual LibreOffice checks still belong to CI. Do not claim Microsoft Word, device, printer or assistive-technology certification.
- No perpetual/background CI watcher. Read status at useful integration points. Preserve meaningful failed evidence; do not rerun unchanged failures or relax assertions to get green.
- Continue the existing broader roadmap toward completion. The old finite freezes and multi-agent arrangements below newer records are historical. Do not reintroduce delivered features as missing work or claim universal Office parity.
- Public GitHub and GitHub Pages are authoritative. Preserve the separate private Site. No paid services, accounts, telemetry, cloud document backend or new product architecture is authorized by this handoff.

## 2. Exact transfer state

| Item | Verified handoff baseline |
| --- | --- |
| Repository | https://github.com/iiankehn/slate-forge-web |
| Development base | `main`; most recent pre-handoff docs commit `68e87c2c5b665668351c8187730afdaa97b10fe5` |
| Latest feature | [PR #41](https://github.com/iiankehn/slate-forge-web/pull/41), merged |
| Accepted PR source | `f5f0960ffaa450f7fe57c09b4986f9d1e4ed7a96` |
| Published runtime | `6039a864bfc7842698b95cc70e2a10bfcc727992` |
| Public origin | https://slate-web.iiankehn.com/ |
| PR CI | [43757442567](https://github.com/iiankehn/slate-forge-web/actions/runs/43757442567) |
| Main CI | [43758352155](https://github.com/iiankehn/slate-forge-web/actions/runs/43758352155) |
| Acceptance | 758 Node regressions, 20 tooling-policy checks, 270 browser cases across five profiles, ten actual LibreOffice 24.2.7.2 probes; no flaky browser results |
| Pages promotion | [43759063028](https://github.com/iiankehn/slate-forge-web/actions/runs/43759063028), succeeded |
| Exact static-site artifact | `14179515809`, 50,270,306 bytes |
| Archive SHA-256 | `f2560464f01e28a72ecde68f0d117d8155684fbe89f866250347c75a4971c8e1` |
| Live proof | All 56 checked shell/worker URLs matched; cache `0b3fcca8b8e92f8e`; first publication check |
| Last pre-handoff docs CI | [43759414014](https://github.com/iiankehn/slate-forge-web/actions/runs/43759414014), succeeded; runtime jobs explicitly skipped, zero artifacts |
| Open PRs / unfinished release | None at preparation; recheck GitHub on DEV |
| Local status at preparation | Clean `main`, synchronized with `origin/main`; no implementation in progress |

The handoff commit will be newer than the recorded docs baseline. Obtain its SHA from Git after fetching; do not mistake a documentation commit for a new published runtime. [Release evidence](RELEASE_2026_11_15_SECTION_GEOMETRY.md) records the accepted feature. No background monitor was left running.

The old machine also has preserved worktrees `/workspace/slate-forge-web-ui` (`feat/writing-commands-and-ribbon`, `8ac7e14`) and `/workspace/slate-forge-web-reflections` (`feat/odt-rigid-reflections`, `b5ff717`). These are historical checkpoints, not current development bases; do not merge them again. The primary checkout was `/workspace/slate-forge-web`. Fresh DEV can use any suitable path. Do not copy node_modules, expired credentials, caches or scratch-generated output as source authority. Preserve `docs/ROADMAP_SCOPE_AUDIT.md` if encountered in an older checkout; it is not the active roadmap.

## 3. Tools and installation inventory

### Required on DEV

| Tool | Version / installation | Purpose |
| --- | --- | --- |
| Bash or equivalent terminal | Linux/Ubuntu reference; use DEV's supplied shell | Source and Git operations |
| Git | Supported system version | Clone/fetch/branches/commits/push |
| ripgrep (`rg`) | System package `ripgrep` | Fast source/file searches |
| Python 3 | Ubuntu 24.04 system Python is the CI reference | Documentation/helper editing and policy scripts; no local test execution by default |
| Node.js + npm | **Node 24.x**, `.nvmrc` = `24`, engines `>=24 <25`; npm bundled with Node | Project dependency/tool support; CI executes build/tests |
| GitHub CLI (`gh`) | Current supported release; official package or DEV's credential setup | PRs, Actions summaries/artifacts, merge and manual Pages dispatch |
| CA certificates / HTTPS networking | Preserve injected enterprise proxy/CA configuration | GitHub, npm and runner/package downloads |
| Editor and coding assistant | DEV's chosen IDE/agent | Editing, reviewing diffs, terminal integration; no special IDE extension is required by the app |

Ubuntu example, if not already provisioned and system package installation is available:

```bash
sudo apt-get update
sudo apt-get install -y git ripgrep python3 ca-certificates curl gh
```

Use DEV's approved Node installer/version manager to provision Node 24. If `nvm` is already installed, run `nvm install 24` and `nvm use 24`. **nvm is optional**, not a project dependency. Do not rely on Ubuntu's default `nodejs` package being the correct major. Provision `gh` from its official installation instructions if DEV's package repositories do not provide it. System installation permissions and remote access are environment-specific.

### Project dependencies: install together, never manually one by one

In the correct checkout, `npm ci` installs the committed lockfile, including development dependencies. Do not regenerate the lockfile for setup, use `--omit=dev`, globally install Playwright or run `npm update` as housekeeping. Node/npm may execute dependency installation hooks; this is dependency provisioning, not permission to run local application suites.

`package.json` / `package-lock.json` are authoritative. Major tools include Tiptap/ProseMirror, DOMPurify, docx, Mammoth, fflate, esbuild, jsdom, fake-indexeddb, Playwright **1.64.1**, axe, PDF.js/pdf-lib/@cantoo/pdf-lib/fontkit, node-forge, Tesseract/language data, Transformers/ONNX and geometry/text helpers. The semantic model is committed under `assets/semantic`; OCR data comes from npm packages. No model API, database server, Docker daemon or paid service is required on DEV.

### GitHub runner tools: workflows install these, DEV does not need them routinely

| Tool | How supplied / role |
| --- | --- |
| Playwright browser binaries and OS libraries | Pinned `mcr.microsoft.com/playwright` v1.64.1-noble container, immutable digest in `ci.yml`; desktop Chromium/Firefox/WebKit and phone Chromium/WebKit |
| Node/npm and locked dependencies | `actions/setup-node` reads `.nvmrc`, followed by `npm ci` |
| LibreOffice Writer | Ubuntu runner package `libreoffice-writer`; actual accepted editor was 24.2.7.2, not a Microsoft Word installation |
| PyMuPDF (`fitz`) | Runner package `python3-fitz`; renders/inspects PDFs |
| lxml | Runner package `python3-lxml`; validates ODF Relax NG with the committed schema |
| Fonts | `fonts-liberation`, `fonts-crosextra-carlito`; render environment |
| Pages artifact/upload/deploy tools | SHA-pinned GitHub Actions, installed by workflows; no global npm installation |

The exact Office installation recipe is in [office-probes.yml](../.github/workflows/office-probes.yml):

```bash
# Reference for GitHub runners; not a request to install/run Office probes on DEV.
sudo apt-get install -y --no-install-recommends libreoffice-writer python3-fitz python3-lxml fonts-liberation fonts-crosextra-carlito
```

Office scripts use `/usr/bin/python3` so apt-provided modules are visible. Do not replace that with an unrelated virtualenv interpreter. Local Playwright browser installation (`npx playwright install --with-deps chromium firefox webkit`) is unnecessary under the current workflow; only consider it for separately requested local diagnosis where browser policy permits. Older evidence mentions Poppler tools and OpenSSL diagnostics; neither is required for the current runner Office harness or normal DEV continuation. Install those only if a new, explicitly selected diagnostic actually needs them (`poppler-utils` for `pdftotext`/`pdftoppm`/`pdfinfo`, `openssl` for OpenSSL on Ubuntu). `curl` is a general download utility; no separate `jq` installation is needed for the shown `gh --json`/`--jq` commands.

### Assistant skills and connected tools

- **Cloudflare security-audit skill:** https://github.com/cloudflare/security-audit-skill . A source copy was inspected at `/workspace/scratch/security-audit-skill-install`, commit `c1c8a8c1471069fb0e188eeaff69b8e8db6564a8`. That machine path is not portable and is not proof the DEV assistant has it installed. The upstream installation command is:

  ```bash
  npx skills add https://github.com/cloudflare/security-audit-skill --skill security-audit
  # Add --global only if a user-level installation is wanted.
  ```

  Install through the chosen assistant's supported skill setup and confirm it appears in its skill list. Read the installed SKILL.md and relevant guidance before use. Use focused security guidance during ordinary development; installation does not authorize a full audit, new agent fleet or local target execution. The full upstream audit orchestrates agents and requires an OS-enforced sandbox; the user's solo/GitHub execution rules take precedence. No complete audit certification is claimed here.
- **Start Feature Work**, **Slate Forge Release**, **Slate Forge Storage Checks** were available as user cloud skills in the prior assistant. Their package locators were respectively `c6/6ae3dd7195288191a453f0eeb13f82e3/start-feature-work`, `c6/6ae3db7643ac8191a02b26b3beda3c30/slate-forge-release`, and `c6/6ae3dbb4ef0c81919d4c5dfb319b9c68/slate-forge-storage-checks`. These are assistant package locators, not npm packages or filesystem paths. Reconnect the same user skill library or transfer through the assistant's skill mechanism if supported. They are optional: this handoff, AGENTS.md and committed scripts preserve the operational requirements. Older skill defaults for local testing/Sites publishing are superseded.
- The **connected GitHub app** was used to read job logs, update/merge PRs and inspect metadata. It is an assistant connector, not a binary installed with npm. Reconnect through the assistant's app settings if desired; `gh` provides the necessary repository/Actions path without it. The prior connector could not dispatch manual Pages; DEV needs authorized `gh` or an equivalent GitHub workflow-dispatch capability.
- Terminal execution, patch/file editing and assistant tool orchestration are capabilities of the chosen remote assistant. There is no project npm package to install for `functions.exec` or `apply_patch`. Browser/desktop tools, if separately requested, come from DEV's remote-computer integration. Do not assume the previous session's tools, skill aliases or credentials transfer.

## 4. Bring DEV up safely

Discover an existing checkout first. For an existing repository:

```bash
git status --short
git branch --show-current
git log -3 --oneline
git fetch origin main
git rev-list --left-right --count HEAD...origin/main
```

Only fast-forward a clean, appropriate branch with `git merge --ff-only origin/main`. Preserve dirty files and unpublished commits; use a separate worktree if needed. Never reset, clean, force-push, silently stash or switch over pending work. Use `set -e` in multi-step mutation scripts so a failed switch stops subsequent commands.

For a genuinely new checkout:

```bash
git clone https://github.com/iiankehn/slate-forge-web.git
cd slate-forge-web
node --version
npm --version
npm ci
```

Do not append local build/test commands to setup. Before making changes, read any applicable ancestor or nested AGENTS.md files and recheck repository status.

Configure GitHub authorization in DEV's credential settings or supported `gh auth login` flow, never by pasting tokens into chat, commands, logs or repository files. Then inspect:

```bash
gh auth status
gh pr list --repo iiankehn/slate-forge-web --state open
gh run list --repo iiankehn/slate-forge-web --limit 5
```

Credentials need the relevant repository write/PR/merge and Actions dispatch/read capabilities. Verify actual access; prior credentials expired more than once. A connected app's successful read does not prove CLI dispatch authorization. Public clone/read needs no secret. Do not copy a credential-bearing remote URL.

No local server needs to run for source development. If the user separately asks to preview a downloaded accepted build on DEV, `node scripts/serve-dist.mjs` serves `http://127.0.0.1:4173/slate-forge-web/`; use DEV's supported port forwarding and stop the process when done. There is no `npm dev`/`npm start`. The server does not build source. Obtain an accepted artifact rather than rebuilding solely for reassurance. Respect browser URL/security policy; never evade a denial through alternate hosts, CDP or shell automation.

## 5. Architecture and files to know

| Area | Main entry points |
| --- | --- |
| UI / writing | `app.mjs`, `dist/index.html`, `src/editor-extensions.mjs`, `src/writing-*`, `src/app-menus.mjs` |
| Sections / measured output | `src/sections.mjs`, `src/section-output.mjs`, `src/pagination.mjs`; `src/live-pagination.mjs` is the separate live-editing path |
| Word | `src/docx-export.mjs`, `src/docx-import.mjs`, `src/docx-sections.mjs`, native drawings and review modules |
| ODT | `src/odt.mjs`, `src/odt-pages.mjs`, `src/odt-page-runs.mjs`, `src/odt-styles.mjs`, native designs and change modules |
| Canvases | `src/design-model.mjs`, `src/design-editor.mjs`, `src/design-groups.mjs`, affine/outlines/layout helpers |
| Sharing/redaction | `src/redacted-pdf.mjs`, `src/redaction-*`, `src/editable-redaction-*` |
| Saving/recovery/backups | `src/device-storage.mjs`, `src/recovery.mjs`, `src/save-drain.mjs`, `src/tool-storage.mjs`, `src/workspace-backup.mjs`, `src/encrypted-backup.mjs` |
| PDF / OCR | `src/pdf-workspace.mjs`, `src/pdf-*.mjs`, `src/ocr-*.mjs` |
| App updates/offline | `src/app-updates.mjs`, `src/offline-*.mjs`, `scripts/pwa.mjs` |
| Tests/evidence generators | `test/*.test.mjs`, `e2e/*.spec.mjs`, `scripts/*office*`, `scripts/prepare-*-probe.mjs`, `test/fixtures/office-probes/manifest.json` |
| CI/release | `.github/workflows/ci.yml`, `office-probes.yml`, `pages.yml`, `scripts/ci_plan.py`, `scripts/promote-pages.py`, `scripts/verify-live.py` |

**`dist/index.html` is canonical tracked source. Never delete the entire `dist/` directory.** Builds regenerate bundles/vendor assets but do not recreate every tracked source. Let CI perform routine builds. `package-lock.json` and pinned workflow action/container versions are authoritative; do not refresh them merely for environment setup.

## 6. What is already delivered

Do not repeat implementation for these:

- Writing-scoped Select All, custom context/clipboard commands with original/thin/text-only paste choices, common-command ribbon work, independent compact/collapsed ribbon preferences and File labeling: [WRITING_COMMANDS.md](WRITING_COMMANDS.md).
- Confirmed mobile header/safe-area repair: [MOBILE_SAFE_AREAS.md](MOBILE_SAFE_AREAS.md). Preserve it; device retesting is not a release gate.
- Suite-wide flattened redacted PDF and genuine editable redacted DOCX/ODT/HTML copies: [REDACTION.md](REDACTION.md), [EDITABLE_REDACTION.md](EDITABLE_REDACTION.md). Copies remove marked content; originals/history/backups remain. Do not confuse ordinary PDF text replacement with redaction.
- Bounded editable native ODT/Word canvases, supported opaque hierarchy to eight levels, static GIF/WebP ODT export, thin transformed pictures, affine picture import and rigid bordered contours. Exact bounds/failed alternatives are linked from the compatibility inventory.
- Bounded native ODT comments, inline/paragraph/boundary/whole-list/table revisions; optional full Slate Forge ODT retained review with stale-package fallback. Native history fidelity is a separate claim from retained app snapshots.
- Supported master-page orientation, sequential text columns in ODT/preview, bounded native Word section reopening, explicit section header/footer replacement/clearing, list paragraph/bullet repair.
- PR #41: optional `size: A4|Letter`, `margin: 15|22|30` section overrides. Legacy section shape/default inheritance is unchanged. Continuous editing remains global; measured preview uses per-section geometry. Native ODT nested scopes restore parents; Word handles document-level sections and refuses nested geometry. Images/canvases use active bounds. Native import reads current values rather than inventing old intent.

## 7. Remaining work and sensible restart point

The latest feature and release are complete. No partially implemented next feature is waiting. Use the **remaining rows** in [COMPATIBILITY_INVENTORY.md](COMPATIBILITY_INVENTORY.md), verify current source, and select one coherent extension. This is an inventory of genuine limits, not a promise every Office dialect has a finite interchangeable implementation.

| Remaining area | Boundary / evidence needed |
| --- | --- |
| Section/layout fidelity | Custom paper and asymmetric/custom margins, numbering restarts, complex furniture and nested Word geometry remain bounded/refused. Extending these needs an explicit supported representation and independent actual-editor controls. |
| Sequential DOCX export | Still refused: Writer discarded the tested noColumnBalance setting. Keep the original failed representation; do not remove the guard without a different representation and strict actual-resave evidence. Explicit foreign declarations may import; absent declarations are never guessed. See WORD_SECTION_FLOW.md and SEQUENTIAL_COLUMNS.md. |
| Native structural review | Individual row/cell/list-item/object/nested or unanchored revisions remain incomplete. App-retained history already preserves broader data but does not establish native editor history exchange. |
| Rich paragraph boundaries | Keep/page-break combinations retain explicit refusals after actual Writer formatting loss. |
| Paint/text/geometry | Group opacity/compositing, arbitrary effects/gradients, mirrored/skewed native ODF text and mixed rich canvas text, nonrigid bordered contours/custom curves/arrowheads, foreign ambiguous matrices and minimum-frame failures remain guarded. |
| Other picture dialects | Unsupported animation/effects/metadata and raw cropped WebP remain refused after actual failures; supported WebP export already normalizes to full-resolution PNG. |
| Inherent missing history | Native ODT format-change metadata lacks prior values. Do not invent faithful Reject; app-retained full review is a distinct delivered path. |

Recommended next planning step, **not a new user-selected priority**: inspect the section/layout rows following PR #41 and compare their representation cost with a bounded native-review extension. Define acceptance and refusal behavior before coding. Do not rerun baseline suites simply to start work. Update the inventory when a row changes and explain actual progress without declaring the whole project complete.

## 8. Last-batch traps to preserve

- ODT side-margin resolution must use the actual shorthand for absent sides, not the selected left value. `left=30 mm` plus shorthand `15 mm` is asymmetric and must not enter uniform supported projection. Initial CI 43756347772 and diagnostic 43756990378 remain recorded failures; final PR/main runs passed after the parser repair.
- Page-image placement preserves x and shrinks width at the paper edge. At x=205 mm on Letter, remaining width is 10.9 mm; do not move the anchor to satisfy an incorrect assertion.
- Compact 15 mm Word margins use 7.5 mm header/footer distances. Active column widths and parent geometry restoration matter for media.
- Explicit blank header/footer flags distinguish clearing from old empty-text inheritance. Page numbers remain global; nested Word clearing still refuses.
- Portable Unicode Arial bullets repair the actual Symbol U+25CF → U+F06C resave drift. Keep retained failed files and diagnostics; do not weaken the strict render checks.
- Independent geometry/furniture controls are raw XML transformations authored in committed GitHub generators, not products of the importer/exporter under test.

## 9. Storage, privacy and identity invariants

Keep existing browser origin, IndexedDB names/versions and backup/session formats unless an explicit compatible migration is required. Examples: `document-studio-device` v1, `document-studio-recovery` v1, `slate-forge-tools` v1, session key `document-studio.session.v1`. Check actual code before touching them. Workspace tokens are local namespaces, not authentication.

Snapshot before queued writes; reject stale revisions; bind asynchronous work to its original workspace/tool lifetime. Ordinary saves remain independent of optional encrypted recovery. Preserve last good data on failures and export paths. Commit related restored records atomically where supported; validate archive/type/size/model before writes. End session must block late writers from recreating removed ordinary data while preserving unrelated workspaces and deliberately retained encrypted recovery. Use isolated fixtures/fake IndexedDB in authored tests, never real-user storage clearing.

Preserve originals, history, complete backups, body font choices and mobile safe areas. Retained review may include deleted content, prior formatting, source images and hidden layers; preserve disclosures. Redaction outputs are fresh copies and do not erase originals or backups. Browser documents do not transfer between computers/origins with the repository: use the app's explicit backup/export/restore if the user wants document transfer. Never put documents, recovery codes, signing keys or credentials into Git.

Private Site identity `.openai/hosting.json`: `appgprj_6ae296f07e4881918b653497e03232d7`, static directory `dist`. Keep its existing audience/origin; do not recreate, deploy to it or change sharing as a workaround. This web repository is separate from Slate Android.

## 10. Develop, verify and publish without duplicate work

1. Inspect status and current evidence, create a feature branch from synchronized main, implement a coherent batch and author meaningful regressions/probes. Review changes and source whitespace with `git diff --check`. Preserve unsupported-case guards.
2. Push the branch and open/update its PR. `.github/workflows/ci.yml` builds once, runs Node/tooling, five parallel browser profiles and actual Office probes. The stable `verify` job fails closed; retry-only browser success fails. Updated PR commits cancel obsolete checks.
3. Read summaries when useful. For failures, retrieve the relevant log/profile trace/Office report, repair the cause and push a new revision. No routine local reruns. Keep unrelated passing evidence.
4. Review the final diff and successful exact-head PR checks, then merge. Merged-main checks validate the actual merge source; this is intentional, not duplicate local browser testing.
5. Promote the **successful main push** runtime run with a `static-site` artifact. Manual diagnostic runs and docs-only runs cannot be promoted. A commit/push does not deploy Pages.

   ```bash
   gh workflow run pages.yml --repo iiankehn/slate-forge-web --ref main -f verification_run_id=SUCCESSFUL_MAIN_RUNTIME_RUN_ID
   ```

   Replace the placeholder with the new accepted runtime run ID; do not republish the old release as startup housekeeping.
6. Pages verifies the candidate's repository/event/branch/ancestry/gates/digest, promotes its exact archive without rebuilding/retesting, and Actions verifies live bytes/cache. Read `verify-live` evidence; a deployment success alone is insufficient.
7. Record feature source, merge SHA, PR/main/Pages runs, immutable artifact ID/archive digest, checked URLs/cache and material limits in release docs, roadmap and handoff. Docs-only follow-up should run only `plan`/`verify`, skip runtime jobs and create zero artifacts. No `[skip ci]` workaround and no new runtime deployment for docs.
8. End with a clean or explicitly explained worktree and no background watcher. Report what actually shipped and what remains.

Useful commands (read summaries; do not continuously poll):

```bash
gh pr checks PR_NUMBER --repo iiankehn/slate-forge-web
gh run view RUN_ID --repo iiankehn/slate-forge-web --json status,conclusion,jobs
gh run view RUN_ID --repo iiankehn/slate-forge-web --log-failed
gh api repos/iiankehn/slate-forge-web/actions/runs/RUN_ID/artifacts
```

`static-site`, Node/browser/Office artifacts retain 14 days; release metadata/evidence retains 30 days. Summaries and committed release notes preserve durable facts after artifact expiration. Do not promote expired/missing artifacts or manually bypass verification. Retrieve signed artifact URLs without logging them; avoid dumping tokens, environment variables or unfiltered credential responses.

## 11. Starter prompt for the DEV assistant

> Continue Slate Forge Web from https://github.com/iiankehn/slate-forge-web. Find or safely clone the repository on DEV. Read docs/DEV_HANDOFF.md and applicable AGENTS.md before work. Work solo. PR #41 is merged and published; there is no in-flight feature. Preserve existing work, origins, private Site, storage/backup compatibility, fonts and mobile fixes. Codex develops and authors tests; GitHub Actions runs all routine tests/builds/browser/Office/live verification. Inspect the remaining compatibility inventory, choose the next coherent roadmap extension and continue implementation without reopening delivered work. Use exact-source PR/main gates and promote the accepted main artifact through Pages. Do not spawn agents, add a physical-device gate, bypass failures or leave background monitoring running. Verify current GitHub state and authentication rather than relying on the snapshot.
