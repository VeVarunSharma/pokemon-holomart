# Decision 0001: Keep Saved Searches preview local-only

> **Synthetic decision record.** Created for the HoloMart demo; it records a reversible product judgment, not a production or shopper commitment.

- **Status:** Accepted for preview
- **Decision date:** 2026-07-24
- **Review trigger:** Preview reliability and reuse gate in [roadmap](../roadmap.json), or new cross-device and price-monitoring evidence

## Context

The partial implementation stores card-catalog filters in one browser. Synthetic signals show plausible repeat use (`CI-01`, `AN-02`, `AN-03`) and reliability concerns (`CI-03`, `SS-03`, `AN-06`). One fictional request asks for price-drop alerts (`SS-04`), while an occasional gift buyer sees little value (`CI-04`). This is insufficient evidence for account persistence or notification delivery.

Source limitations are explicit in the [evidence index](../evidence/README.md).

## Decision

Keep Saved Searches **preview, personal, and browser-local** while the team:

1. hardens state validation, recovery, and active-state clarity;
2. tests accessible create/apply/rename/delete workflows;
3. measures content-free reuse and failure signals; and
4. researches account continuity and price-monitoring jobs separately.

The UI must state that searches are stored only on this device and may be removed with site data. Saving a search never creates alert consent.

## Why not account sync or alerts now

- Account sync needs authenticated storage, migration, deletion, retention, export, and support semantics.
- Alerts add threshold, price-source freshness, cadence, delivery channel, quiet-hour, unsubscribe, and inventory race-condition behavior.
- The evidence is synthetic, small, and contradictory; infrastructure would create false certainty.
- Local storage keeps the experiment reversible while the core search interaction is still changing.

## Consequences

### Positive

- Smaller blast radius and no server-stored search criteria.
- Faster learning about personal reuse, state clarity, and stale-taxonomy recovery.
- Saving remains distinct from marketing or transactional notification consent.

### Negative

- Searches do not follow a shopper across devices or browsers.
- Clearing browser data loses searches.
- A saved search cannot notify a shopper when inventory or price changes.
- Local evidence cannot directly validate notification value.

## Rejected alternatives for now

- **Account sync immediately:** premature persistence and migration commitment.
- **Price alerts immediately:** unresolved consent, freshness, and delivery behavior.
- **Remove the preview:** discards a reversible way to study repeat collector workflows.
- **Shareable URLs as the final model:** useful for handoff, but not durable personal storage.

## Reconsideration gates

Human review may reconsider sync when the preview demonstrates reliable recovery, repeated later-session use, accessible task completion, and a privacy-approved telemetry definition. Price alerts require separate evidence about monitoring behavior plus explicit consent, threshold, freshness, cadence, and unsubscribe semantics. No single metric automatically triggers release.

See the [incomplete spec](../saved-searches-spec.md) and [UX research questions](../../design/saved-searches-ux-brief.md).
