# Decision 0001: Keep Saved Views preview local-only

> **Synthetic decision record.** Created for the Signal Desk demo; it records a reversible product judgment, not a production or customer commitment.

- **Status:** Accepted for preview
- **Decision date:** 2026-07-24
- **Review trigger:** Preview reliability and reuse gate in [roadmap](../roadmap.json), or new permission/governance evidence

## Context

The partial implementation stores filter configurations in one browser. Synthetic signals show plausible repeat use (`CI-01`, `AN-02`, `AN-03`) and reliability concerns (`CI-03`, `SS-03`, `AN-06`). One fictional request supports a curated shared view (`SS-04`), while another participant values private scratch work (`CI-02`). This is insufficient evidence for identity-bound sync or team governance.

Source limitations are explicit in the [evidence index](../evidence/README.md).

## Decision

Keep Saved Views **preview, personal, and browser-local** while the team:

1. hardens state validation, recovery, and active-state clarity;
2. tests accessible create/apply/rename/delete workflows;
3. measures content-free reuse and failure signals; and
4. researches ownership, permissions, and lifecycle before sharing.

The UI must state that views are saved only in this browser and may be removed when site data is cleared. Stored configurations never grant access; current permissions are evaluated on every application.

## Why not sync or sharing now

- Cross-device sync needs authenticated storage, migration, deletion, retention, and support semantics.
- Sharing adds creator/editor/viewer/default-view roles and behavior when access or fields change.
- The evidence is synthetic, small, and contradictory; shipping infrastructure would create false certainty.
- Local storage keeps the experiment reversible while the core interaction is still changing.

## Consequences

### Positive

- Smaller blast radius and no server-stored configuration data.
- Faster learning about personal reuse, state clarity, and stale-filter recovery.
- Private exploratory configurations stay private by default.

### Negative

- Views do not follow a person across devices or browsers.
- Clearing browser data loses views.
- Support expectations may diverge unless preview language is prominent.
- Local evidence cannot directly validate team-sharing value.

## Rejected alternatives for now

- **Account sync immediately:** premature persistence and migration commitment.
- **Team sharing immediately:** unresolved authorization and governance.
- **Remove the preview:** would discard a reversible way to study the workflow.
- **Shareable URLs as the final model:** potentially useful experiment, but not durable storage or an authorization boundary (`MK-03`).

## Reconsideration gates

Human review may reconsider sync when the preview demonstrates reliable recovery, repeated later-session use, accessible task completion, and a privacy-approved telemetry definition. Team sharing requires separate evidence about curation, ownership, revocation, defaults, and restricted fields. No single metric automatically triggers release.

See the [incomplete spec](../saved-views-spec.md) and [UX research questions](../../design/saved-views-ux-brief.md).
