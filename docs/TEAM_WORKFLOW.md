# Slate Forge specialist workflow

The user requested this five-specialist workflow on 2026-11-09. Apply it to substantive roadmap work, feature changes, defect fixes and release evaluation. Root remains the coordinator; implementation and independent checks belong to the assigned specialists.

## Ownership

| Specialist | Responsibility | Required handoff |
| --- | --- | --- |
| `dev` | Implement assigned changes and repair confirmed findings within the agreed task and file scope. | Concrete change, behavior and limits, touched files, and the checks needed to evaluate it. |
| `verification` | Own check execution and the shared evidence ledger. Select meaningful existing/focused checks, observe CI and record failures, retries, source revisions and verification limits. | Evidence tied to the exact source tested, with pass/fail status and remaining gaps. |
| `results_analysis` | Analyze implementation and verification results against the intended outcome. Identify unsupported conclusions and distinguish facts from hypotheses. | Evidence-based assessment, discrepancies and concrete questions or findings. |
| `quality_check` | Independently review correctness, maintainability, usability, accessibility implications, documentation and compatibility within scope. | Prioritized findings with file references, impact and acceptance criteria. |
| `adversarial_review` | Challenge the design and process: attempt to disprove assumptions, expose failure paths, data-loss risks, misleading claims, weak tests and unsafe release shortcuts. | Reproducible counterexamples or clearly labeled risks, severity and the evidence needed to resolve them. |

Root assigns tasks and file scopes, coordinates dependencies, reconciles conflicting conclusions, sends confirmed blockers to Dev, integrates changes and owns release decisions. Root does not replace the specialists by performing substantive development, verification and review alone. Specialist roles remain available for follow-up assignments; they do not imply work continues while idle.

## Task and source discipline

Before work begins, root gives each specialist the objective, acceptance boundary, source revision, dependencies, allowed files and whether the task is read-only or permits edits/checks. Specialists report uncertainty or scope conflicts before changing unrelated files. Do not spawn additional agents without an explicit assignment authorizing it.

Use one source writer at a time: Dev owns implementation files during an assigned change. Reviewers remain read-only unless root explicitly reassigns a bounded edit. If genuinely independent edits are needed, use explicit non-overlapping file ownership or isolated worktrees; integration stays with root. Preserve pending user work. Never reset, clean, force-push, discard changes or silently stash to synchronize a task.

Once a concrete change exists, verification, results analysis, quality review and adversarial review can proceed in parallel. Results analysis may begin with available evidence and finalize after Verification supplies the completed ledger. Reviewers return findings to root rather than patching the shared source behind Dev's work.

## Shared evidence and fixes

Verification is the single owner of check execution and the evidence ledger. Record the exact commit or source-diff identity, command or CI run, result, failures/retries, relevant artifacts and limitations. A prior run is reusable only when its relevant inputs are unchanged.

Other specialists reuse that evidence rather than independently repeating tests. They may inspect source, logs and artifacts read-only. When a check or reproduction is missing, request it through Verification with the hypothesis and expected distinguishing result. Do not rerun unchanged expensive checks for reassurance. Documentation-only setup does not require product tests or a build.

Root triages findings and routes confirmed blockers to Dev with impact and acceptance criteria. Dev returns a bounded fix; Verification runs affected checks and updates the ledger. Relevant reviewers reassess the fix. Disputed findings remain explicit until root resolves them from evidence; do not silently drop a blocker or treat an untested assumption as a pass.

## Integration and release gate

Passing CI alone does not authorize automatic publication before independent review. Root must review the specialist handoffs, resolve confirmed blockers and record material remaining limits before releasing. Verification results and independent review cover different responsibilities; neither substitutes for the other.

After review clearance, root follows the existing repository release workflow: verify the merged main source, promote its successful immutable artifact to the existing Pages host, verify the live files/cache and update the handoff and roadmap. Preserve storage identifiers, backup compatibility, public/private hosting identities and existing product boundaries. Publication must not add another build or browser run when the successful main artifact already supplies that evidence.

## Current held change

PR #23 merged bounded native ODF stroke groups at `31fa635b2b20bbc513bd40fd149029e30decf4e1`. Main verification run `42572161888` was already underway when the user requested this team setup. The previous automatic promotion controller was stopped. The change remains held for independent team review; this configuration setup does not authorize resuming product development or deploying it. The previous verified public release is suite-wide redacted PDF export from `3d91e753f259750946ab996c4c3c6f75caeabcda`.
