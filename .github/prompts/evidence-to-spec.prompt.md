---
name: evidence-to-spec
description: Synthesize synthetic product evidence into a reviewable Saved Views specification update.
argument-hint: "[scope or decision to synthesize]"
agent: product-strategist
---

Synthesize `${input:focus:Scope or decision to synthesize}` into a product-spec proposal using [the evidence index](../../product/evidence/README.md), [customer/support signals](../../product/evidence/customer-support-signals.md), [usage evidence](../../product/evidence/usage-analytics.json), [market notes](../../product/evidence/market-notes.md), [current spec](../../product/saved-views-spec.md), and [roadmap](../../product/roadmap.json).

For each claim, include the evidence ID, type, **SYNTHETIC / DEMO-ONLY** label, repository link, confidence/limitation, and any counter-signal. Use code `path:line` citations for implementation constraints.

## Human checkpoints

1. **Evidence check:** stop with a source/claim matrix; the human confirms which interpretations are fair.
2. **Decision check:** present unresolved options and a recommendation; the human chooses or defers.
3. **Draft check:** only after those decisions, produce a patch-ready spec section. Never edit or publish it without explicit approval.

## Output

- Problem and target user
- Evidence and counter-evidence matrix
- Assumptions and unknowns
- Proposed scope / non-goals
- Behavior and edge cases
- Acceptance boundaries and proposed measures
- Open human decisions
- Traceability table from requirement to evidence and code
