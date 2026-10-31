# Slate Forge reliability batch · 2026-10-29

This release combines offline readiness, save coordination and review-safe bulk editing. The Site remains owner-private, local-first and account-free inside the app. No paid APIs, telemetry or cloud documents were added. Existing origin and storage identifiers are retained.

## Included

- **Offline preparation:** Tools and App status expose explicit PDF/OCR preparation. The active service worker supplies its exact cache and component manifest. Downloads use same-origin, allowlisted component paths, reject redirects/sign-in HTML, skip cached files and show progress. Cancel/closing the panel keeps successful files for a later retry. Preparation requires a cached app shell; component downloads do not bypass the host sign-in gate. Updates are blocked while preparation is active.
- **Save coordination:** Concurrent flush requests share one flight per writer. A flush continues to the latest version when edits arrive while saving; an old workspace completion cannot acknowledge a newly opened workspace. Errors retain dirty state and existing backup warnings. File → Save on this device and Ctrl/Cmd+S await device and enabled recovery writes and report outstanding PDF/save problems. Mobile suspension can still interrupt asynchronous writes.
- **Tracked bulk editing:** Replace One/All and writing transformations create per-range insert/delete revisions across paragraphs in one undoable transaction. Deleted revision text is excluded from search. Matches overlapping unresolved revisions are rejected atomically, and passes above 5,000 replacements require a narrower search/selection. Accept/reject yields the expected final text. Native code-block edits stay untracked rather than duplicating old text; tracked bulk edits in code blocks are refused explicitly.
- **Formatting safety:** Clear formatting removes visual text marks while retaining comments and revision marks, preventing deleted text from being silently restored. This applies to both paragraph controls and Writing tools.

## Verification

- Full suite: **164 tests pass** (19 added in this batch); production build and diff checks pass.
- Production dependency audit: **zero known vulnerabilities** at this check.
- Save tests cover overlapping flushes, edits during writes, rejected writes/retry and workspace switches.
- Offline tests cover missing/cached assets, progress, absent shells, external/API/query URLs, sign-in HTML/redirects, quota errors, cancel/resume and the generated worker manifest. Existing service-worker tests continue to ensure online sign-in responses are not bypassed and arbitrary document/API requests are not cached.
- Review tests cover multi-paragraph tracking, one-step undo, accept/reject, atomic rejection of overlapping/reviewed matches, tracked transformations, annotation-preserving formatting cleanup, append-plugin integration and code-block behavior. A generated DOCX contains the expected two native insertions and two deletions for a two-paragraph replacement.
- The complete application source was bundled and started in a DOM integration harness with fake IndexedDB. Startup, Find controls, the offline-unavailable path and Save command wiring pass. Dialog/layout methods are stubbed; this is source integration evidence, not a rendering or real-browser test.

## Remaining launch gates

Live browser access was blocked by the session URL policy, so this batch has no new visual/browser-workflow certification. Physical Safari/Chrome/Firefox, installed/offline PDF/OCR launching, secure-context storage permission, real service-worker updates, completed browser downloads/reimports, actual printed PDFs and real storage-pressure/suspension behavior remain unverified. Use DEVICE_QA.md for those results.

Complex mixed-section live editing, arbitrary page-wide object coordinates/two-sided text flow, multi-page/language OCR, native PDF text editing and cross-device collaboration remain outside the completed implementation. Preview/DOCX retain their documented capabilities and limits. This release does not claim Word parity or public-launch certification.
