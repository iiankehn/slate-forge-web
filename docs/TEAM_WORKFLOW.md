# Slate Forge two-specialist workflow

The user's latest instruction retains only `dev` and `adversarial_review`. This supersedes the earlier five-specialist setup. Root coordinates scope, resolves findings and gives release clearance. Keep updates concise and stop at the finite roadmap finish line; unsupported optional features are not new completion requirements.

| Role | Ownership |
| --- | --- |
| `dev` | Sole source writer for assigned files; implements scoped fixes, owns meaningful verification, records exact-source evidence, and performs integration/publication only after root clearance. |
| `adversarial_review` | Independently challenges source, failure handling, test sufficiency, compatibility, evidence and release claims. Remains read-only unless root explicitly assigns an edit. Reuses Dev's evidence and requests missing reproductions instead of duplicating checks. |
| Root | Assigns explicit task/file scope and acceptance bounds, resolves disagreements, triages blockers and clears integration/publication after independent review. |

Preserve pending user work, storage identifiers, backup compatibility, origins, private Site identity and the mobile fix. Never reset, force-push, discard user work or silently stash. Dev is the only source writer; root coordinates any reassignment. Do not spawn more specialists or reopen retired roles without explicit user direction.

Record source SHA or source-diff identity, command/CI run, result, retries, artifacts and remaining limits in the feature evidence. Reuse unchanged results. Passing CI alone does not replace independent adversarial review. Send confirmed blockers to Dev, verify the affected repairs, then reassess. No unchanged full tests, builds or browser checks merely for reassurance; documentation-only bookkeeping uses affected checks.

Release follows the existing PR/main gates. After root and adversarial clearance, promote the successful merged-main immutable artifact through Pages; do not rebuild or rerun browsers in publication. Verify live files/cache against those exact artifact bytes, then finish handoff/roadmap documentation. The separate private Site is preserved.

## Current finite closure

The repaired bounded ODF stroke-group batch is the final active implementation batch. PR #24 passed at source `50117804e4462889ce392aea1d61ef537245822c`; merged runtime is `d8535f28c91922d919a0f53f1df756c36e2fcb69`. Reviewed main verification, artifact promotion and live verification are complete. Published runtime `d8535f28c91922d919a0f53f1df756c36e2fcb69` at https://slate-web.iiankehn.com/ . [PR verification](https://github.com/iiankehn/slate-forge-web/actions/runs/42580266841) and [merged-main verification](https://github.com/iiankehn/slate-forge-web/actions/runs/42683902860) each passed 582 Node cases and 165 browser scenarios without retries. [Pages promotion](https://github.com/iiankehn/slate-forge-web/actions/runs/42686729685) reused main artifact `13704782234`, archive SHA-256 `c285e2d9732a13e2a1428828da770c6f283feefa021c10e3e4069717f8592daf`, without rebuilding or rerunning browsers. All 53 verified live shell/worker URLs matched that exact archive; worker cache digest `2fd596f2fcf3bc65` reconciled. The finite bounded implementation roadmap is complete.

The earlier automatic CI-only promotion controller was stopped. The failed original main run `42572161888` is not a promotion source. Rectangle/ellipse groups, broader paint, general matrices, deeper groups and review-history research are optional/deferred. Do not start another feature batch to declare this bounded roadmap complete.
