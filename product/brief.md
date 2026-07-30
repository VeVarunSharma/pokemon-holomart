# Signal Desk product brief

> **Synthetic demo artifact.** Signal Desk, its customers, quotes, usage, and plans are fictional. Nothing here describes a real customer or production commitment.

## Product and users

Signal Desk helps product teams turn scattered customer feedback into a reviewable queue and a traceable set of decisions.

- **Product managers** synthesize themes, prioritize follow-up, and communicate decisions.
- **Product operations leads** maintain intake quality and shared working practices.
- **Designers and researchers** find relevant feedback and preserve context.
- **Support and success partners** contribute signals and need visibility into outcomes.

## Problem

People repeatedly rebuild the same filters when they return to a feedback queue. A partially implemented **Saved Views** preview can store a filter configuration in one browser, but it cannot yet explain its state, recover reliably when fields change, or support team workflows. The team must decide whether to harden the private workflow before investing in sharing.

## Strategy

1. Make repeat review work faster without obscuring how a result set was produced.
2. Prefer reversible, observable workflow improvements over premature collaboration infrastructure.
3. Treat saved configurations as user-controlled shortcuts, not as durable records or authorization boundaries.
4. Expand from personal recall to team coordination only when evidence and permission semantics are strong enough.

See the [synthetic evidence index](evidence/README.md), [incomplete Saved Views spec](saved-views-spec.md), and [preview decision record](decisions/0001-saved-views-local-preview.md).

## Goals

- Reduce repeated filter setup for people who revisit a queue.
- Make the active view and its filters legible and keyboard accessible.
- Learn which configurations are reused, edited, or abandoned.
- Establish explicit gates for sync and sharing rather than implying they already exist.

## Non-goals

- Cross-workspace sharing or real-time co-editing in the current preview.
- Treating a saved view as a report, alert, permission grant, or canonical taxonomy.
- Importing real customer data into this demo.
- Claiming that directional synthetic signals prove demand or causality.

## Constraints

- Current preview state is browser-local and can be cleared with site data.
- Saved filters may reference fields that are later renamed, removed, or restricted.
- A view must never reveal feedback the viewer cannot otherwise access.
- Mobile layouts must preserve review and recovery, but not every dense desktop control.
- Instrumentation in the demo is illustrative and must avoid free-text or customer content.
- Scope is sized for evidence-backed planning, not a production launch promise.

## Success metrics and guardrails

These are **proposed measures**, not baselines or targets backed by real telemetry.

| Measure | Proposed interpretation |
| --- | --- |
| Median time from opening Feedback to a useful result set | Directionally lower for repeat tasks |
| Reuse rate | Portion of created views opened on a later synthetic session |
| Successful recovery rate | View still opens after a referenced field changes, or gives an actionable explanation |
| Edit-after-open rate | Diagnostic signal; can indicate useful templates or stale views |
| Delete/abandon rate | Guardrail against clutter and accidental creation |
| Accessibility task completion | Core create, apply, rename, and delete flows complete with keyboard and screen reader |
| Permission incident count | Must remain zero before any sharing release |

Metric definitions and limitations are in [usage/analytics evidence](evidence/usage-analytics.json). The authoritative planning artifact is [roadmap.json](roadmap.json).
