# Orchestration Plan

## Mode Selection

- Repo: `/Users/stephenbrown/Code/OPENSOURCE/openastroids`
- Branch: `dev`
- Work mode: full `$sb-cbi` autopilot
- Run folder: `agent-runs/2026-06-20-codebase-pass`
- Verifiable gates: Git remote read, dry-run push, `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, `npm outdated`, `npm audit`, source search, diff review
- Human-decision blockers: product roadmap changes, backend/auth/database additions, broad architecture rewrites, risky major dependency migrations
- Resume policy: restart from `run-state.md`, verify branch sync and dirty-file ownership, then continue the recorded next action

## Loop Plan

| Phase | Loop | Verify Gate | Stop Condition |
| --- | --- | --- | --- |
| Preflight and Repo Docs | Orchestration Planning Loop, Docs Sweep Loop | Docs match current repo and checks pass | Plan, state, queue, docs, and report pushed |
| Baseline Validation | Baseline Validation Loop | Lint, typecheck, tests, build, and dependency diagnostics are recorded | Baseline is clean or failures are classified |
| Findings Backlog | Findings Queue Loop, Architecture Fitness Loop, Lean Code Loop | Evidence-backed backlog and scorecard | Backlog, scorecard, and queue are pushed |
| Execute Fixes and Improvements | Task Queue Loop, Fix Validation Loop, Architecture Fitness Loop, Lean Code Loop | Targeted checks and lint pass for each task | Highest-priority executable findings are done or deferred |
| Package and Dead-Code Cleanup | Package Cleanup Loop, Dead Code Loop | Safe package/dead-code changes pass lint/tests/build | Safe cleanup complete or deferred with evidence |
| Review | Judge Loop | Diff/reports pass reviewer gate | Findings are resolved, queued, or deferred |
| Stabilization | Stabilization Loop, Judge Loop | Final quality gates pass and no P0/P1 or architecture Fail items remain | Completion criteria pass or a real blocker is recorded |
| Integrator | Final Completion Gate | Branch synced, tree clean, reports complete | Final report pushed |

## File Ownership

| Task | Owned Files | Notes |
| --- | --- | --- |
| T-001 | 00-orchestration-plan.md, run-state.md, task-queue.md | Startup planning and resume state |
| T-002 | AGENTS.md, spec.md, README.md, 01-preflight-and-repo-docs.md | Evidence-backed repo docs sweep |
| T-003 | 02-baseline-validation.md, task-queue.md, run-state.md | Baseline command results |
| T-004 | 03-findings-backlog.md, task-queue.md, run-state.md | Findings, scorecard, execution order |
| T-005 | Source files named by findings, 04-execute-fixes-and-improvements.md, task-queue.md | Small prioritized fixes only |
| T-006 | package.json, package-lock.json, proven-unused files, 05-package-and-dead-code-cleanup.md | Safe dependency/dead-code cleanup |
| T-007 | 06-review.md, 07-stabilization-loop.md, 08-integrator.md, final-report.md | Review, stabilization, final report |
