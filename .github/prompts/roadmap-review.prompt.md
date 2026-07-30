---
name: roadmap-review
description: Review roadmap sequencing, evidence strength, gates, and delivery risk without reprioritizing automatically.
argument-hint: "[initiative, horizon, or review question]"
agent: product-strategist
---

Review `${input:focus:Initiative, horizon, or review question}` against [the authoritative roadmap](../../product/roadmap.json), [product brief](../../product/brief.md), [evidence index](../../product/evidence/README.md), [UX brief](../../design/saved-views-ux-brief.md), and repository implementation evidence.

## Human checkpoint

Present recommendations as options. Stop before changing roadmap files, GitHub issues, or Projects. Require the human to approve each horizon/status/dependency change and then separately approve any external write.

## Output

1. Roadmap snapshot by Now / Next / Later.
2. Evidence scorecard: supporting signals, counter-signals, provenance, limitations.
3. Implementation reality with `path:line` citations.
4. Dependency and gate review, including circularity or missing owners.
5. Options: keep / advance / hold / split / stop, with tradeoffs.
6. Open decisions, assumptions, unknowns, and evidence needed next.
7. Preview-only proposed roadmap delta and GitHub Project field changes.

Never convert synthetic metrics into automatic ship gates or imply that Next/Later items are commitments.
