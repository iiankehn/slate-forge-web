# Verify once per source, promote the verified artifact

The old flow ran the full browser suite on the PR, on the merged main commit, and again in the manual Pages workflow. The Pages run rebuilt the same merged source and duplicated main verification. PR and main checks cover different commits; Pages does not need another build or browser suite.

## Current flow

1. Release checks validates the PR before merge.
2. Release checks validates the merged main commit: production build, Node regressions, packaging and five-browser checks. Retry-only browser passes fail the gate. It uploads `static-site` only after those steps succeed, with 14-day artifact retention.
3. Manually dispatch **Publish GitHub Pages**, supplying that successful **main push** verification run ID. Promotion validates repository/workflow/branch/event, successful run and verification job, source ancestry on main, artifact provenance/expiry and SHA-256 digest. It extracts the exact artifact with archive/path/size checks and packages it for Pages. There is no npm install, rebuild or browser run in publication.
4. Deploy to the existing public Pages host and verify live files/cache. The separate private Site is preserved.

Example: `gh workflow run pages.yml --ref main -f verification_run_id=41861651898` promotes the stroke source `ffbec7cfadd668fbfca3a026951e2f622ce15209`. The input identifies the source to deploy, even if newer main commits contain only docs or release configuration. The workflow summary records its exact source SHA, CI run, artifact ID and digest. PR artifacts, manual verification runs, failed/skipped jobs, expired/missing artifacts and digest mismatches are refused. An expired artifact requires a new verified build of the intended main source; publication never silently rebuilds it.

Seven fast promotion-policy tests cover valid promotion, wrong provenance/checks, unreachable sources, tampering, unsafe paths/links/duplicates, missing/oversized contents and the absence of rebuild/browser commands in Pages. They run through the separate Pages promotion checks workflow on relevant changes. Product CI remains the PR/main integration gate; this change removes the redundant publication gate.

## Why not reuse an arbitrary PR artifact?

PR checkout can be a synthetic merge, and main may have changed since that check. Promotion uses a successful main push artifact so the deployed bytes have verified merged-source provenance. Choosing a prior verified main run is explicit and its source must still be reachable from current main.

## Operational limits

GitHub service incidents or an unavailable artifact can block promotion; they do not justify bypassing verification, changing hosts, clearing user storage or creating a duplicate release. Check the existing run before dispatching another. A local artifact download probe failed in this environment; runner-side artifact promotion must be exercised before claiming the new publishing path is operational. Until that proof, the workflow implementation and seven policy tests are verified, not a completed promotion.
