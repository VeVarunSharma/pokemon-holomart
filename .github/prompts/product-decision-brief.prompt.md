---
name: product-decision-brief
description: Turn approved Saved Searches evidence into a decision brief and spec delta while preserving open product choices.
argument-hint: "[decision or scope; defaults to device-local Saved Searches preview]"
agent: product-strategist
---

Prepare a decision brief for `${input:focus:Decision or scope (default: device-local Saved Searches preview)}`. Use [the product brief](../../product/brief.md), [current spec](../../product/saved-searches-spec.md), [authoritative roadmap](../../product/roadmap.json), [evidence index](../../product/evidence/README.md), [UX brief](../../design/saved-searches-ux-brief.md), and verified implementation/test evidence.

## Evidence rules

- Label every signal **SYNTHETIC / DEMO-ONLY** and cite its stable evidence ID and repository path.
- Separate fact, interpretation, recommendation, counter-signal, assumption, and unknown.
- Cite code claims as `path:line`; do not use TODO tests or comments as proof of implementation.
- Preserve every `humanDecisionFlags` status and never manufacture certainty, targets, dates, or effort precision.

## Output

1. Decision to make, target user, desired outcome, and why now.
2. Supporting evidence and counter-signals with limitations.
3. Current implementation boundary and constraints.
4. Options and tradeoffs, including keep/hold/stop where relevant.
5. Recommended option, confidence, reversibility, risks, and evidence needed next.
6. Proposed spec delta: scope, non-goals, behavior, edge cases, acceptance boundaries, and measures.
7. Explicit open questions mapped to stable decision IDs.

## Stop point

Stop after a preview of the brief and spec delta. Ask the human to accept, revise, or defer each recommendation and open question. Do not edit product files, resolve decision flags, change the roadmap, or write to GitHub.
