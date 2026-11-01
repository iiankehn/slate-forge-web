# First public beta

The public beta is live at https://slate-web.iiankehn.com/ . [Verified deployment 41268357642](https://github.com/iiankehn/slate-forge-web/actions/runs/41268357642) passed all 418 Node cases across 67 test files, build/static checks and 65 browser scenarios across five configurations. Supported native Word groups/mixed paragraphs, 250-page PDFs with direct navigation and native ODT column/page-design sections are published. Physical-device checks remain deferred; phone viewports are not device certification.

The immediate goal is usable everyday writing with clear saving and recovery. The full roadmap is not a prerequisite.

## Release scope

- Create and edit documents on desktop and narrow screens; reopen device-saved work.
- Import ordinary supported documents and export files with the existing format limitations.
- Download a complete workspace ZIP and restore documents and editable PDF records. Use encrypted backups when a password-protected independent copy is needed.
- Explain local storage, independent backups, host migration and beta limitations before users rely on the app. Provide a standalone guide even when app startup fails.
- Serve the static build at a root or GitHub project path, with scoped offline caches and local PDF/OCR assets.

The guide is available from Tools → Getting started and the first-use banner. Browser storage is not an independent backup. Moving from the private Site to GitHub Pages requires an exported backup from the old host and an import at the new one.

## Release checks

Run `npm test`, `npm run build`, `npm run check:dist` and source whitespace checks. The Release checks workflow additionally runs real browser save/reload, downloaded-file reimport, complete ZIP/PDF restoration, encrypted backup password handling and offline OCR checks across Chromium, Firefox and WebKit, including phone viewport projects. A workflow definition or test listing is not passing browser evidence: check the actual run before releasing. Reports and build artifacts are retained by CI.

Phone viewport emulation does not certify physical Safari/iPhone/iPad or Android devices. Actual installed-PWA upgrades, device storage pressure/eviction, print output, assistive technology, IME and stylus use remain manual checks in DEVICE_QA.md. State their status honestly in release notes.

## Later iterations

Arbitrary page-positioned objects, complex sections and wrapping, broad Word/ODT fidelity, fine-grained structural revision interoperability, semantic/ambiguous comparison matching and larger PDF limits remain on ROADMAP.md. Supported native Word objects, split page-bottom notes and lexical rewritten-paragraph matching have shipped. Cloud accounts and collaboration remain deferred. Existing advanced tools keep their documented beta boundaries.

## Publication

GitHub development does not deploy the private Site. Pages publication uses the separate manual workflow documented in GITHUB_PAGES.md. Do not claim a public URL or successful deployment until the deployment run completes.


## Tester announcement

Slate Forge public beta: https://slate-web.iiankehn.com/

Write and edit documents in your browser, save on your device, import/export supported Word and OpenDocument files, and use local PDF/OCR and drawing tools. No account is required. Download a complete workspace backup before relying on it for important work; clearing browser data can remove device-saved documents. Import/export and pagination have documented limits, so check exchanged documents before sharing them.

Report problems at https://github.com/iiankehn/slate-forge-web/issues/new/choose with your browser/OS, steps and expected/actual result. Use a small non-confidential sample when one is needed. Feature suggestions can be submitted there too. Known feature gaps are tracked in ROADMAP.md; physical-device testing is still open.
