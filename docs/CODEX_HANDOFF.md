# Slate Forge web — Codex handoff

## Project and baseline

GitHub destination: iiankehn/slate-forge-web, private. This is a migration of the existing web application, not either Android repository. Source baseline is Sites commit 3e8348a9734ee1195c661ed997f98af7c79a1107. All 313 automated tests, production build and source whitespace checks passed for that baseline. Migration instructions/docs do not change runtime behavior.

Existing live Site: https://document-studio-iian.iiankehn.chatgpt.site
Site project ID: appgprj_6ae296f07e4881918b653497e03232d7
Last verified deployment: appgdep_6ae53f65f42c81918c33ef451d8e1892
Saved version: appgprj_6ae296f07e4881918b653497e03232d7~appgver_a0632476eb408191a8851b7637b0560b

The existing Site remains the live host. GitHub development and publication are separate until a supported integration is configured. Do not change audience or origin. User documents live in browser device storage and are not part of this repository; moving code does not move document data.

## Architecture and commands

Plain JavaScript ES modules with a Tiptap/ProseMirror rich-text editor. app.mjs integrates menus, workspace state and dialogs; src/ holds editor extensions, import/export, layout/pagination, local storage/recovery, PDF, OCR and canvas models. test/ contains Node and JSDOM/fake-indexeddb tests. Production builds use esbuild. dist/index.html is retained source, and dist/ includes generated production assets and local PDF/OCR components. npm ci; npm test; npm run build. Dependencies are pinned by package-lock.json. OCR uses local English Tesseract assets; PDF uses PDF.js/pdf-lib. No paid service or application account is required.

Settings retain White/Colored/Grey/Dark/System themes, independent accents and screen-only dark paper. Desktop menus and mobile hamburger share a catalog; command search is Ctrl/Cmd+K. Ordinary IndexedDB autosave is independent of encrypted recovery. Workspace tokens provide local namespacing, not account identity. End-session tombstones and optimistic revisions prevent late writers from resurrecting ended work. Preserve document-studio identifiers for compatibility.

Existing capabilities and limitations are recorded in docs/ROADMAP.md and docs/RELEASE_READINESS.md; docs/RELEASE_BATCH.md is chronological release evidence, so its final sections supersede older limitations. docs/DEVICE_QA.md lists physical checks. Latest batch adds exact-content sibling move matching and shared-text formatting checks in edited paragraphs; rewritten/cross-parent/ambiguous matching remains incomplete. The full app supports rich text/review/comments, DOCX/ODT/HTML/JSON/ZIP/encrypted exports, editable canvases, PDF forms/ink, local OCR drafts, backups/recovery and 200-document local workspaces.

## Important boundaries

Source image inputs allow up to 1 GB but native decoding and an 80 MP cap still apply; embedded images are optimized. DOCX input allows 20 MB with expanded-archive bounds. PDF capacity/backup byte limits remain bounded; see source/docs. Do not raise a cap and claim device validation without evidence. DOCX custom XML retains editable Slate Forge canvas scenes, including hidden layers/uncropped images when enabled; other word processors see image previews rather than native editable shapes.

Native Word drawing objects, free page-coordinate images with surrounding text, arbitrary/two-sided wrap, complex live sections/pagination and footnotes, structural/object revision tracking, advanced format fidelity, additional OCR languages and larger PDF capacity remain open. Provider sign-in, cloud collaboration and separate notes/coding apps are deferred scope, not required for the account-free release.

## Continuing work

Read the current roadmap; select a coherent, substantial batch and finish implementation, tests, build, documentation and reviewable commits/PRs. The user dislikes repeated tiny handoffs and unnecessary confirmation. Do not claim the entire roadmap or production certification merely because tests pass. Physical Safari/iPhone/iPad, Android 12+ Chrome, desktop browsers, accessibility/IME/stylus, real storage eviction/quota and installed PWA/download/print checks are still open. Target generic Android 12+, not a particular device.

Prior reusable startup/release/storage skills were installed in the original Work environment; their installed availability is environment-specific. Their essential checks are represented by AGENTS.md and the repository docs. Do not depend on absolute paths to those skills or original Sites helper scripts in another environment.

## GitHub source packaging

The GitHub repository tracks all editable source, tests, canonical HTML/CSS/PWA manifest/icons and documentation. Reproducible generated JavaScript chunks, service worker, license notices and npm-provided PDF/OCR vendor bundles are ignored; npm ci followed by npm run build regenerates them. The original complete Sites history remains in its original source repository; the GitHub import starts a new history with this recorded baseline.
