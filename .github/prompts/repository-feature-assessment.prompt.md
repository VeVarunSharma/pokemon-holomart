---
name: repository-feature-assessment
description: Assess a HoloMart feature from repository implementation evidence before making product claims.
argument-hint: "[feature or product question]"
agent: product-strategist
---

Assess `${input:focus:Feature or product question}` using repository evidence.

Start with [the product brief](../../product/brief.md), [Saved Searches spec](../../product/saved-searches-spec.md), and relevant `app/**`, `src/**`, and `test/**` files. Treat [implementation notes](../../src/features/saved-searches/implementation-notes.js) and [dependency map](../../src/features/saved-searches/dependency-map.js) as leads, then verify them in code.

## Human checkpoint

Stop after producing the assessment. Ask the human to confirm the boundaries and disputed findings before proposing roadmap or remote issue changes. Do not write externally.

## Output

1. **Verdict:** implemented / partial / absent / unknown.
2. **Capability matrix:** claim, status, `path:line` evidence, confidence.
3. **Dependency trace:** current and missing dependencies, each evidenced or marked inferred.
4. **Tests and gaps:** current coverage and named unknowns.
5. **Product implications:** assumptions and risks, not automatic scope.
6. **Human decisions:** exact questions requiring judgment.

Every repository claim needs a file-and-line citation. Do not treat TODO tests or comments as implemented behavior.
