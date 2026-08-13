---
name: qa-bug-reproduction
description: Reproduce and classify a HoloMart defect report with exact evidence and no production edits.
argument-hint: "[reported defect and available environment details]"
agent: qa-engineer
---

Investigate `${input:report:Reported defect and available environment details}`.

## Method

1. Translate the report into explicit preconditions, inputs, actions, and expected behavior.
2. Trace the relevant implementation and current tests with `path:line` citations.
3. Use the smallest deterministic reproduction available.
4. Repeat only when needed to distinguish intermittent behavior from an invalid setup.
5. Classify the outcome as reproduced, not reproduced, intermittent, or blocked.

## Boundaries

- Do not edit any file.
- Do not install dependencies, use live external services, or change local state outside disposable test setup.
- Do not edit production code or create a regression test during this workflow.
- Never commit, push, call `gh`, or write remotely.
- Preserve HoloMart synthetic-data and product-scope boundaries.

## Output

1. Outcome classification and confidence.
2. Exact environment and preconditions.
3. Numbered reproduction steps.
4. Expected and actual behavior.
5. Evidence: commands, output, logs, and `path:line` references.
6. Severity if reproduced.
7. Existing coverage and the smallest recommended regression test.
8. Production-fix recommendation without applying it.
9. Unknowns, blockers, and next evidence needed.
