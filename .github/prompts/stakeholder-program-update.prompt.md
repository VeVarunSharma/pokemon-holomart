---
name: stakeholder-program-update
description: Draft a traceable stakeholder update from approved HoloMart evidence, decisions, risks, and delivery previews.
argument-hint: "[audience and reporting window]"
agent: delivery-planner
---

Draft a stakeholder/program update for `${input:focus:Audience and reporting window}` from [the authoritative roadmap](../../product/roadmap.json), [product brief](../../product/brief.md), [current spec](../../product/saved-searches-spec.md), [evidence index](../../product/evidence/README.md), and verified code, test, design, and issue-preview context in this conversation.

## Evidence rules

- Mark the update **SYNTHETIC / DEMO-ONLY**.
- Preserve stable initiative, work, risk, evidence, and decision IDs.
- Separate completed facts from proposals, options, assumptions, and unknowns.
- Cite repository facts and retain counter-signals; do not turn horizons, synthetic dates, or proposed measures into commitments.
- Never claim an issue, Project update, code change, or decision happened unless verified.

## Output

1. Executive headline and outcome.
2. Evidence reviewed and counter-signals.
3. Decisions made, decisions still open, and who must decide.
4. Delivery status by stable ID and dependency/gate.
5. Risks, mitigations, and confidence.
6. Specific asks and next steps with owners expressed as roles.
7. Short spoken version and copy-ready written version.

## Stop point

Stop at a draft for human fact-check and tone review. Do not send, publish, create issues, update Projects, edit the roadmap, or resolve decisions.
