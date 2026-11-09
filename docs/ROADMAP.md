# Slate Forge development roadmap

The user-selected **suite-wide redacted PDF copy** is published. The active follow-on returns to **Word/ODT compatibility**. The everyday writing release is complete. Keep the product local-first and account-free, preserve saved documents/fonts/backups, and keep the existing public and private hosting identities. XFA/signature expansion, accounts and cloud sync remain outside this work.

## Current position

- Suite-wide redacted PDF copies are published for writing, canvases, PDFs and scan/image sources; originals and backups remain intact. See [REDACTION.md](REDACTION.md) for bounds and evidence.

- Native ODT comments and inline insertion/deletion review are published.
- Original-canvas retention, native basic shapes/text boxes, and native lines/arrows/paths are published within their documented bounds.
- Native PNG/JPEG canvas pictures with supported crop, horizontal flip and opacity are published; see [ODT_NATIVE_PICTURES.md](ODT_NATIVE_PICTURES.md). Native pictures embed whole files and metadata. Bounded vertical flips now work through the transform extension.
- Bounded basic-shape/picture rotation and X skew, rotated text and vertical picture flips are published; see [ODT_NATIVE_TRANSFORMS.md](ODT_NATIVE_TRANSFORMS.md).
- Rigid stroke rotations/reflections, axis-line recovery and skew/pressure stroke outlines are published; see [ODT_STROKE_TRANSFORMS.md](ODT_STROKE_TRANSFORMS.md).
- The reported mobile header clipping is user-confirmed fixed; preserve its safe-area protection.
- Delivery now promotes a successful main CI artifact without rebuilding or rerunning browsers; the promotion/deployment path has been exercised. See [RELEASE_PIPELINE.md](RELEASE_PIPELINE.md).

## Ordered remaining work

| Order | Item | Completion boundary |
| --- | --- | --- |
| 1 — next compatibility batch | Bounded native ODF group/matrix compatibility | Start with the actual one-level opaque group corpus. Prove child geometry/order and group paint semantics before adding supported groups. Raw matrices, deeper hierarchy, mirrored/skewed text, bordered contours and foreign stroke scaling/shearing lists remain explicit until representable and demonstrated in actual editors. |
| Alongside each feature | Target-editor exchange evidence | Maintain a small representative document corpus. Record stable LibreOffice/Word behavior where those actual editors are available; keep headless, browser and physical-device evidence distinct. Fix reproduced data loss or incorrect output before broadening scope. |
| Constrained research | ODT review history beyond inline text | Standard ODF formatting-change metadata does not include previous formatting. Do not invent Reject behavior. Any app-specific history retention is a separate, explicit design; native structural revisions need a bounded representation before implementation. |

Finish one coherent product batch, record its supported behavior and material limits, then proceed in this order. Do not turn every discovered format limitation into an unprioritized feature branch. Release logs and CI counts belong in the linked evidence documents, not in this backlog.

## Acceptance and release

Use focused regressions while implementing. PR checks protect the proposed change; main checks verify the merged source and publish its immutable `static-site` artifact. Pages selects that successful main run and deploys those exact bytes without rebuilding or rerunning browsers. Keep the strict retry-only failure gate. Reuse existing evidence for unchanged inputs; docs-only release bookkeeping does not require a product rebuild.

After deployment, verify the live shell/worker files and cache manifest. Record unsupported cases honestly. Existing device/keyboard/accessibility/printing gates remain in [DEVICE_QA.md](DEVICE_QA.md); the confirmed header defect is closed.

## Evidence and history

[ODT compatibility](ODT_COMPATIBILITY.md) · [inline revisions](ODT_TEXT_REVISIONS.md) · [original canvases](ODT_EDITABLE_CANVASES.md) · [native shapes](ODT_NATIVE_SHAPES.md) · [native strokes](ODT_NATIVE_STROKES.md) · [native pictures](ODT_NATIVE_PICTURES.md) · [bounded transforms](ODT_NATIVE_TRANSFORMS.md) · [stroke transforms](ODT_STROKE_TRANSFORMS.md) · [release readiness](RELEASE_READINESS.md).

The former completed essential-product checklist and chronological release entries are preserved in [ROADMAP_HISTORY.md](ROADMAP_HISTORY.md).
