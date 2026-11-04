# Slate Forge development roadmap

The active scope is the user-selected **Word/ODT compatibility** follow-on. The everyday writing release is complete. Keep the product local-first and account-free, preserve saved documents/fonts/backups, and keep the existing public and private hosting identities. Unrelated PDF/XFA/signature expansion, accounts and cloud sync are outside this work.

## Current position

- Native ODT comments and inline insertion/deletion review are published.
- Original-canvas retention, native basic shapes/text boxes, and native lines/arrows/paths are published within their documented bounds.
- The reported mobile header clipping is user-confirmed fixed; preserve its safe-area protection.
- The GitHub incident-delayed stroke release has now deployed and its live files are verified. See [ODT_NATIVE_STROKES.md](ODT_NATIVE_STROKES.md).
- Current delivery work removes the redundant Pages rebuild/browser run by promoting a successful main CI artifact. See [RELEASE_PIPELINE.md](RELEASE_PIPELINE.md).

## Ordered remaining work

| Order | Item | Completion boundary |
| --- | --- | --- |
| 1 — next product batch | Native ODF canvas pictures | Bounded embedded-image export/reimport with supported crop/flip/opacity behavior; read current external edits, omit hidden/private originals in native mode, refuse unsupported cases, and preserve preview/retained-original alternatives. |
| 2 | Broader native ODF transforms | Add supported rotations and affine geometry deliberately, with current-object reimport and representative external-editor fixtures. Keep unsupported groups/transforms explicit. |
| 3 — alongside each feature | Target-editor exchange evidence | Maintain a small representative document corpus. Record stable LibreOffice/Word behavior where those actual editors are available; keep headless, browser and physical-device evidence distinct. Fix reproduced data loss or incorrect output before broadening scope. |
| Constrained research | ODT review history beyond inline text | Standard ODF formatting-change metadata does not include previous formatting. Do not invent Reject behavior. Any app-specific history retention is a separate, explicit design; native structural revisions need a bounded representation before implementation. |

Finish one coherent product batch, record its supported behavior and material limits, then proceed in this order. Do not turn every discovered format limitation into an unprioritized feature branch. Release logs and CI counts belong in the linked evidence documents, not in this backlog.

## Acceptance and release

Use focused regressions while implementing. PR checks protect the proposed change; main checks verify the merged source and publish its immutable `static-site` artifact. Pages selects that successful main run and deploys those exact bytes without rebuilding or rerunning browsers. Keep the strict retry-only failure gate. Reuse existing evidence for unchanged inputs; docs-only release bookkeeping does not require a product rebuild.

After deployment, verify the live shell/worker files and cache manifest. Record unsupported cases honestly. Existing device/keyboard/accessibility/printing gates remain in [DEVICE_QA.md](DEVICE_QA.md); the confirmed header defect is closed.

## Evidence and history

[ODT compatibility](ODT_COMPATIBILITY.md) · [inline revisions](ODT_TEXT_REVISIONS.md) · [original canvases](ODT_EDITABLE_CANVASES.md) · [native shapes](ODT_NATIVE_SHAPES.md) · [native strokes](ODT_NATIVE_STROKES.md) · [release readiness](RELEASE_READINESS.md).

The former completed essential-product checklist and chronological release entries are preserved in [ROADMAP_HISTORY.md](ROADMAP_HISTORY.md).
