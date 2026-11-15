# GitHub-owned verification

The November 15 user instruction moves repeatable testing and build execution out of Codex. Codex develops code, writes tests/probes, reviews source and diagnoses failures. GitHub Actions runs the checks and retains their evidence. This supersedes older local-validation instructions in the repository and skill defaults. Local test/build/editor execution requires a specific user request for diagnosis.

## Release checks

- `plan` compares the actual changed paths and checks source whitespace. Only known documentation changes skip runtime execution. Changed fixtures, workflows, tools or unknown paths trigger full verification. The unmodified upstream ODF schema is the single vendored whitespace exemption.
- `build` installs the locked dependencies, builds and checks static packaging once, then uploads `static-site`.
- `node` downloads that same build and runs the full existing Node regression suite, retaining its log and summary.
- `tooling` runs every Python policy test, including promotion rules, planning/gate behavior, live verification and Office manifest checks. The separate promotion-checks workflow is now manual diagnosis only.
- `browser` downloads the same build into five independent runners: desktop Chromium, Firefox and WebKit, plus phone Chromium and WebKit. Each runner retains JSON, HTML, screenshots and traces under its profile-specific artifact. Test assertions, profile coverage and retry-only failure policy are preserved. Matrix fail-fast is off, so one profile failure does not erase the others' evidence.
- `office` invokes the reusable Office workflow. Fresh isolated LibreOffice profiles resave/render the committed accepted probes; Node reimports the actual results, input XML validates against the vendored ODF 1.3 schema, and declared page/text/render expectations must pass. The runner records its actual editor version. These fresh checks supplement earlier LibreOfficeDev fixtures; they do not claim Microsoft Word or physical-device certification.
- `verify` is the stable final gate. Missing, failed, cancelled or unexpectedly skipped runtime stages fail it. Docs-only handling must be explicitly planned and successful. A docs-only run creates no runtime artifact and cannot be promoted.

Updated PRs cancel their obsolete checks. Main push checks remain separate because they validate the merged commit. Diagnostic manual runs remain ineligible for Pages promotion. Parallel runners reduce sequential browser wait time; they do not guarantee a particular duration or amount of hosted-runner usage.

## Office probe development

Add a case to `test/fixtures/office-probes/manifest.json` and extend the committed checker when a new feature needs different geometry/content assertions. Author new fixture generators as committed workflow steps and execute them in Actions before promoting accepted outputs into the regression corpus. The manifest explicitly declares input, expected pages/sections/text and render policy. The reusable workflow can also be dispatched for one accepted case. Keep failed representations as evidence and name their limits; do not silently relax a render policy to turn a failure green.

No local editor conversion or PDF comparison is required. `office-results` contains the source/resaved PDFs, actual resave, editor version and JSON report. Failure leaves the job red and retains available evidence. Existing fixture regression cases continue to run in the Node suite.

## Publication and release evidence

Pages remains a deliberate manual promotion of a successful main CI run. Repository, workflow, event, branch, completed `verify` job, source ancestry, unique immutable artifact, digest and extraction bounds are checked before deployment. A per-file SHA-256 manifest records exactly what was promoted.

After deployment, `verify-live` retrieves that artifact by its exact ID and validates every extracted file against the promotion manifest. It reconciles the worker's complete cache digest and byte-compares the public shell/worker URLs with the candidate. Brief publication propagation retries are recorded separately from test retries. A live mismatch fails the publication workflow. The existing public origin and private Site identity remain unchanged.

`release-evidence` retains the manifest and `live-verification.json` for 30 days. The Actions summary names the source SHA, CI run, artifact ID, archive digest, live URL count and worker digest. Codex reads this evidence to update the handoff, without downloading/revalidating the full site locally.

## Working rhythm

Develop and review a coherent batch, push it, and let Actions execute. Read summaries at integration points. When a check fails, retrieve the relevant log/profile report, make a source-backed repair and push a new revision. Avoid repeated full-log downloads, routine local reruns and continual status polling. Do not leave a watcher running after ending a turn.

PR #37 is merged. PR CI 43687642290 and main CI 43688210737 passed the new GitHub-only pipeline: 723 Node regressions, 20 tooling-policy tests, all 250 browser scenarios across five parallel profiles, and four fresh LibreOffice 24.2.7.2 exchange probes. Browser retry-only passes remain failures. Pages 43688736615 promoted main artifact 14151247002 from source `23fe7078146c1295a6702abac5f3d38a38739298`; GitHub verified all 56 live shell/worker URLs and cache `f9ac5bd25803f1ed` on its first publication check. No local test, build, editor or release-byte suite ran for this work. See [RELEASE_2026_11_15_GITHUB_VERIFICATION.md](RELEASE_2026_11_15_GITHUB_VERIFICATION.md). Product and storage/build inputs are unchanged from PR #36. The documentation-only path passed in CI 43688949267: plan and verify succeeded, runtime jobs explicitly skipped and no runtime artifact was created.
