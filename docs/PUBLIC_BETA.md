# First public beta

Verified release runtime: commit `338be73`; [GitHub CI run 41241670375](https://github.com/iiankehn/slate-forge-web/actions/runs/41241670375) passed all 61 Node test-file runners, production/static checks and all 20 browser scenarios across desktop Chromium/Firefox/WebKit and phone Chromium/WebKit. Actual downloaded-file restoration and offline French OCR passed. Physical-device/manual gates remain open; no public deployment is claimed.

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

Native Word drawing/editing fidelity, arbitrary page-positioned objects, complex sections and wrapping, split footnotes, fine-grained structural revision interoperability, rewritten/ambiguous comparison moves and larger PDF limits remain on ROADMAP.md. Cloud accounts and collaboration remain deferred. Existing advanced tools keep their documented beta boundaries.

## Publication

GitHub development does not deploy the private Site. Pages publication uses the separate manual workflow documented in GITHUB_PAGES.md. Do not claim a public URL or successful deployment until the deployment run completes.
