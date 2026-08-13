---
name: qa-test-plan
description: Build a risk-based HoloMart test plan from requirements, implementation, and current coverage.
argument-hint: "[feature, requirement, or risk to assess]"
agent: qa-engineer
---

Build a risk-based test plan for `${input:scope:Feature, requirement, or risk}`.

## Boundaries

- This is analysis-only. Do not edit files.
- Read the relevant requirements, implementation, tests, and repository configuration before planning.
- Cite every repository claim as `path:line`.
- Mark requirements as verified, inferred, conflicting, or unknown.
- Treat TODO tests and comments as gaps, not implemented behavior.
- Preserve all HoloMart synthetic-data, local-only Saved Searches, roadmap, and remote-write boundaries.

## Output

1. Scope, verified requirements, assumptions, and non-goals.
2. Risk matrix ordered by impact and likelihood.
3. Requirement-to-current-coverage trace.
4. Prioritized test cases with ID, category, preconditions, procedure, expected result, automation level, and priority.
5. Exact targeted commands and any necessary manual checks.
6. Testability blockers, unknowns, and residual risk.

Stop after the plan. Do not add tests or modify production code.
