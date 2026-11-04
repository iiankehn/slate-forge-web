# Verify once per source, promote the verified artifact

The old flow ran the full browser suite on the PR, on the merged main commit, and again in the manual Pages workflow. The Pages run rebuilt the same merged source and duplicated main verification. PR and main checks cover different commits; Pages does not need another build or browser suite.

## Current flow

1. Release checks validates the PR before merge.
2. Release checks validates the merged main commit: production build, Node regressions, packaging and five-browser checks. Retry-only browser passes fail the gate. It uploads `static-site` only after those steps succeed, with 14-day artifact retention.
3. Manually dispatch **Publish GitHub Pages**, supplying that successful **main push** verification run ID. Promotion validates repository/workflow/branch/event, successful run and verification job, source ancestry on main, artifact provenance/expiry and SHA-256 digest. It extracts the exact artifact with archive/path/size checks and packages it for Pages. There is no npm install, rebuild or browser run in publication.
4. Deploy to the existing public Pages host and verify live files/cache. The separate private Site is preserved.

Example: `gh workflow run pages.yml --ref main -f verification_run_id=41861651898` promotes the stroke source `ffbec7cfadd668fbfca3a026951e2f622ce15209`. The input identifies the source to deploy, even if newer main commits contain only docs or release configuration. The workflow summary records its exact source SHA, CI run, artifact ID and digest. PR artifacts, manual verification runs, failed/skipped jobs, expired/missing artifacts and digest mismatches are refused. An expired artifact requires a new verified build of the intended main source; publication never silently rebuilds it.

Seven fast promotion-policy tests cover valid promotion, wrong provenance/checks, unreachable sources, tampering, unsafe paths/links/duplicates, missing/oversized contents and the absence of rebuild/browser commands in Pages. They run through the separate Pages promotion checks workflow on relevant changes. Product CI remains the PR/main integration gate for app/build changes; this change removes the redundant publication gate. For a docs/release-tooling-only change, confirm the app/build input diff is empty, run the affected policy checks, reuse the already-verified runtime artifact, and respect any repository-required checks rather than repeating unchanged browsers.

## Why not reuse an arbitrary PR artifact?

PR checkout can be a synthetic merge, and main may have changed since that check. Promotion uses a successful main push artifact so the deployed bytes have verified merged-source provenance. Choosing a prior verified main run is explicit and its source must still be reachable from current main.

## Operational limits

GitHub service incidents or an unavailable artifact can block promotion; they do not justify bypassing verification, changing hosts, clearing user storage or creating a duplicate release. Check the existing run before dispatching another. A local artifact-download probe failed in this environment. Runner-side promotion subsequently succeeded; the local failure was not a reason to rebuild or weaken verification.

## Operational proof — 2026-11-04

[PR #18](https://github.com/iiankehn/slate-forge-web/pull/18) merged the workflow and roadmap cleanup at configuration source `572281ba8473fb05c7abead48a62b69250b70c56`. The seven policy tests passed on [the PR](https://github.com/iiankehn/slate-forge-web/actions/runs/41886330716) and [main](https://github.com/iiankehn/slate-forge-web/actions/runs/41886683812). App and build inputs were unchanged, and no required checks were reported for the PR. Automatically triggered full runtime checks 41886330299 and 41886684020 were cancelled for this tooling-only change; they are not recorded as passes.

[Promotion/deployment 41886753392](https://github.com/iiankehn/slate-forge-web/actions/runs/41886753392) succeeded with only checkout, artifact retrieval/verification, Pages packaging and deployment. It selected main verification run `41861651898`, runtime source `ffbec7cfadd668fbfca3a026951e2f622ce15209`, artifact `13340128360` and SHA-256 `e95671825f14f65bc143a3aef52e3478cf4b57093304b6de95b436139c8d6a6e`. That runtime already passed 529 Node tests and 130 browser scenarios without retries; none were repeated by publication. Live verification after promotion checked 45 shell/worker URLs and reconciled cache `bd1c60e2117542ac`. Publication now promotes the exact tested bytes, independently of newer docs/configuration commits.
