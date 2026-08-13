---
name: qa-change-verification
description: Verify a HoloMart change against its requirements using targeted tests and repository evidence.
argument-hint: "[change, diff, or acceptance criteria to verify]"
agent: qa-engineer
---

Verify `${input:change:Change, diff, or acceptance criteria}`.

## Boundaries

- Inspect the relevant change, requirements, implementation, and existing tests.
- Run the smallest relevant established test or validation command first; broaden only when evidence requires it.
- Do not edit files by default.
- Add or update files under `test/**` only when this request explicitly asks for regression-test changes.
- Never edit production code, dependencies, workflows, product artifacts, or design artifacts.
- Never commit, push, call `gh`, or write remotely.
- Cite repository claims as `path:line`.

## Output

1. Verification verdict: pass, fail, partial, or blocked.
2. Acceptance-criteria trace with evidence and confidence.
3. Commands run and observed outcomes.
4. Regression risks and untested paths.
5. Confirmed findings with reproduction details and severity.
6. Test files changed, or `None`.
7. Production recommendations that were not applied.
8. Unknowns, blockers, and residual risk.
