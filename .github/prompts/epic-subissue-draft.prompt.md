---
name: epic-subissue-draft
description: Draft a GitHub-ready epic and dependency-ordered child issues without creating them.
argument-hint: "[initiative id or title; defaults to Saved Views]"
agent: delivery-planner
---

Draft an epic and child issue plan for `${input:initiative:Initiative ID or exact title (default: init-saved-views-preview)}`, defaulting to `init-saved-views-preview`, from [the authoritative roadmap](../../product/roadmap.json). Verify relevant product, design, code, and tests before extending the roadmap's existing `issueDraft`.

## Human checkpoints

1. **Selection:** confirm the initiative and authoritative roadmap entry.
2. **Evidence/scope:** show citations, counter-signals, non-goals, and open decisions; stop for review.
3. **Issue preview:** show exact titles, bodies, labels, dependencies, and proposed sub-issue links.
4. **Write approval:** require a separate explicit approval before any `gh` or GitHub write. Draft approval is not write approval.

## Output

- Epic: title, labels, outcome, evidence table, boundaries, risks, success/guardrail measures, open decisions, done-when.
- Children in dependency order: stable roadmap work ID, title, rationale, acceptance criteria, dependencies, evidence/code citations, validation.
- Link plan: parent/child relationship and blocked-by edges.
- Assumptions/unknowns.
- Exact dry-run command: `node scripts/roadmap-to-issues.mjs --initiative <id> --gh-commands`. The commands omit labels; report `suggestedLabels` separately and do not query or create repository labels.

All evidence is **SYNTHETIC / DEMO-ONLY**. Do not create issues.
