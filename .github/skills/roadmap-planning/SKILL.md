---
name: roadmap-planning
description: Use this skill whenever a user asks to plan, review, draft, or turn a HoloMart roadmap initiative into an epic, sub-issues, delivery work, or GitHub Project updates—even if they do not say “roadmap planning.”
---

# Roadmap planning

Create an evidence-backed, GitHub-ready plan while keeping product decisions and external writes human-owned.

## Use cases

1. “Turn Saved Searches into an epic” → draft the epic and dependency-ordered child issues.
2. “Review the Next horizon” → assess evidence, gates, sequencing, and options.
3. “Prepare roadmap items for GitHub Projects” → map approved work to issue and Project fields without creating resources.

## Prerequisites

- Repository read/search access.
- `product/roadmap.json` is present and parses.
- No MCP server or external authentication is required.
- For a design review, use committed local design context unless the human explicitly supplies another artifact.

## Workflow

### 1. Select and verify

1. Read `product/roadmap.json`; select the requested initiative, defaulting to `init-saved-searches-preview`.
2. Confirm its initiative ID, horizon, status, confidence, dependencies, decision flags, and existing `issueDraft`.
3. State that the roadmap and all evidence are **SYNTHETIC / DEMO-ONLY**.

**Checkpoint 1 — selection:** ask the human to confirm the selected entry before treating any interpretation as approved scope.

### 2. Build the trace

1. Open every `evidenceReferences[].path`.
2. Record evidence ID/type, observation, interpretation, limitation, and counter-signal. Never treat counts or quotes as proof.
3. Inspect relevant product and design context.
4. Verify implementation claims in `app/**`, `src/**`, and `test/**`; cite each as `path:line`.
5. Classify capabilities as implemented, partial, missing, or unknown.

### 3. Frame the decision

Produce:

- outcome and target user;
- evidence and counter-evidence;
- scope and non-goals;
- assumptions and unknowns;
- risks and guardrails;
- open `humanDecisionFlags`;
- dependencies and release gates.

Do not resolve a decision flag, move a horizon, or expand local Saved Searches into account sync or price alerts without a supplied human decision.

**Checkpoint 2 — evidence and scope:** stop for human review of the trace, boundaries, and proposed choices.

### 4. Draft GitHub work

Draft one epic and child issues in dependency order. Preserve roadmap IDs.

Each epic includes:

- outcome, evidence links, counter-signals, boundaries, risks;
- success measures and guardrails;
- open decisions;
- done-when and explicit non-goals.

Each child includes:

- stable work ID and parent initiative ID;
- rationale and cited evidence/code;
- acceptance criteria and validation;
- blocked-by relationships;
- assumptions/unknowns and exclusions.

**Checkpoint 3 — exact issue preview:** show complete titles, bodies, labels, parent/sub-issue relationships, and dependency edges.

### 5. Prepare, never presume, a write

Use `node scripts/roadmap-to-issues.mjs --initiative <id>` for the canonical dry run. Add `--format json` for structured output or `--gh-commands` to preview PowerShell-compatible commands. Command previews deliberately omit `--label`; proposed labels remain visible as `suggestedLabels` metadata and comments, so missing custom labels cannot make an approved create command fail. Normal preview never queries GitHub.

The script deterministically augments the roadmap's child records with grounded rationale, exclusions, evidence IDs, repository references, and validation steps maintained in the generator; artifact validation checks those references. It does not apply changes or create labels. A human must separately review remote repository, suggested labels, issue types, Project fields, and commands.

**Checkpoint 4 — remote write:** require explicit approval immediately before any external mutation. Approval of scope or draft is not approval to write.

## Output format

```text
Provenance: SYNTHETIC / DEMO-ONLY
Initiative: <id> — <title>

Evidence trace
| ID | Type | Observation | Limitation/counter-signal | Source |

Implementation trace
| Capability | Status | path:line | Unknown |

Epic
<exact title, labels, and body>

Child issues (dependency order)
1. <work-id> — <title>
   Dependencies:
   Acceptance:
   Validation:

Human decisions required
- <decision and options>

Write status: PREVIEW ONLY
```

## Error handling

| Failure | Response |
| --- | --- |
| Initiative is missing or ambiguous | List stable IDs/titles and stop; do not guess. |
| Evidence path/ID cannot be verified | Mark the claim unsupported and block issue finalization. |
| Code and roadmap disagree | Show both with citations; classify as a human-owned discrepancy. |
| Dependency is missing or cyclic | Report the exact chain and do not claim delivery readiness. |
| Design context is unavailable | Use local committed fallback; mark unverifiable visual judgments. |
| Remote tooling/auth is unavailable | Keep the plan local and preview-only; do not weaken the checkpoint. |

## Post-run reflection

Report which sources were used, which claims remain assumptions, which decisions remain open, and whether any proposed work exceeded the authoritative roadmap. Never retain real customer data or credentials.
