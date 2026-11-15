# GitHub-owned verification rollout — November 15, 2026

PR #37 moves routine execution out of Codex. Codex develops, authors tests/probes, reviews source and diagnoses GitHub evidence. Actions executes builds, tests, Office conversions and release-byte checks. This is the user's explicit workflow change, superseding older local-validation instructions and skill defaults. Solo development continues.

## Observed pipeline evidence

- Configuration PR source: `fc25246e6ddd5eac86fc1fd3dab12fe46e51b189`; [PR CI 43687642290](https://github.com/iiankehn/slate-forge-web/actions/runs/43687642290) passed.
- Merged source: `23fe7078146c1295a6702abac5f3d38a38739298`; [main CI 43688210737](https://github.com/iiankehn/slate-forge-web/actions/runs/43688210737) passed.
- Both required gates passed one production build/static check, **723 Node regressions**, **20 Python tooling-policy tests**, **250 browser scenarios** across five parallel profiles without retry-only acceptance, and **four actual Office exchanges** with explicit pixel/geometry/native import/schema assertions.
- The runner recorded LibreOffice **24.2.7.2 420(Build:2)**. This fresh baseline supplements the earlier LibreOfficeDev 26.8 fixtures; it does not certify Microsoft Word or physical devices.
- The final `verify` aggregator remained a required successful job. Known docs-only changes use explicit lightweight planning/whitespace validation with no promotable runtime artifact. Unknown paths and fixtures trigger full checks. Missing/failed/cancelled or unexpectedly skipped runtime stages fail the gate.
- All test/build execution occurred on GitHub. No local Node/Python suite, build, browser run, Office conversion, artifact validation or live-byte probe was used for this rollout.

## Publication evidence generated on GitHub

[Pages 43688736615](https://github.com/iiankehn/slate-forge-web/actions/runs/43688736615) promoted the exact successful main artifact **14151247002**, archive SHA-256 `4c5047b3da8a5eb1d7b3a786535b3f8d156de7b865e7c8d9c45f68abcd99428b`, archive size **50,264,235 bytes**. It retained the per-file SHA-256 manifest, deployed those bytes, downloaded that artifact by its exact ID and verified it against the manifest. The GitHub `verify-live` job then confirmed all **56** public shell/worker URLs byte-match and reconciled cache digest **`f9ac5bd25803f1ed`** on **one publication check**. The `release-evidence` artifact retains machine-readable proof for 30 days; workflow summaries show source/run/artifact/digest details.

Pages performed no rebuild or browser rerun. Review/merge and manual promotion remain deliberate. Full site archives are no longer downloaded to Codex for repeat verification. Browser JSON/HTML/screenshots/traces are split by profile; Node and Office reports have separate artifacts. Updated PRs cancel stale PR checks automatically. No watcher is left running after a turn.

## Scope and operating instructions

App source, build inputs, package versions, fonts, private Site identity, public origin, storage identifiers and backup formats are unchanged from the PR #36 product baseline. The worker cache digest is unchanged. This rollout changes engineering execution and evidence ownership, without adding product roadmap items.

Use [GITHUB_VERIFICATION.md](GITHUB_VERIFICATION.md) and the current top sections of AGENTS.md/CODEX_HANDOFF.md. Earlier local validation commands are historical defaults overridden by the user. Run a local diagnostic only when the user specifically requests it. Do not turn passing CI into another local test cycle. The separate promotion-checks workflow is now a manual focused diagnostic; its tests are included in the main tooling job.

The final docs-only follow-up passed CI 43688949267 through the new lightweight Actions path. Plan and verify succeeded; runtime jobs explicitly skipped and no runtime artifact was created. It reuses the runtime/publication evidence above.
