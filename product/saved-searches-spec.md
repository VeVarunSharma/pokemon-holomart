# Saved Searches — deliberately incomplete product spec

> **Status:** Synthetic demo draft; intentionally incomplete for Copilot-assisted enrichment and human review. This is not a production commitment.

## Summary

Saved Searches lets a shopper name the current Pokémon card catalog filters and reopen them later in the same browser. The partial preview demonstrates local storage and application, but it does not yet meet a reliable, accessible shopper-workflow bar. Account sync and price alerts remain separate decisions.

Related: [product brief](brief.md) · [synthetic evidence](evidence/README.md) · [UX brief](../design/saved-searches-ux-brief.md) · [preview decision](decisions/0001-saved-searches-local-preview.md) · [roadmap](roadmap.json)

## User problem

Collectors repeatedly reconstruct precise catalog queries while listings appear, sell, and change price. A shortcut saves setup only when shoppers understand which criteria are active, can distinguish temporary edits from saved state, and receive a safe explanation when an expansion or rarity no longer exists.

## Proposed preview scope

- Create a personal search from the supported query, rarity, and expansion filters.
- Require a non-empty name; define duplicate handling before implementation.
- List, apply, rename, and delete browser-local searches.
- Show the active search and whether current filters differ from it.
- Validate stored data on read and recover without blocking the card catalog.
- Emit content-free events proposed in [synthetic analytics](evidence/usage-analytics.json).
- Repeat clear “stored on this device only” language at creation and management points.

## Out of scope for this increment

- Account persistence, cross-device sync, price alerts, watchlists, folders, and seller notifications.
- Saving listing snapshots, card images, payment state, addresses, or seller credentials.
- Promise of full mobile creation parity.
- Any real price, inventory, seller, or fulfillment integration.

## Draft behavior

### Create

1. Shopper configures supported catalog filters and chooses **Save this search**.
2. Dialog requests a name and explains that the search stays on this device.
3. On success, the search appears in the Saved Searches panel and becomes available to reopen.
4. **Incomplete:** duplicate-name policy and maximum count remain open.

### Apply and modify

1. Selecting a saved search replaces supported filters with its validated configuration.
2. The catalog names the active search and exposes a readable filter summary.
3. A later filter edit marks the state as changed.
4. **Incomplete:** whether updates are explicit-only or can overwrite in place remains open.

### Rename and delete

- Rename preserves the stable local identifier and filter configuration.
- Delete requires clear confirmation; undo is preferred but not yet scoped.
- **Incomplete:** retention and recovery behavior remain open.

### Invalid or unavailable criteria

- Ignore no criterion silently.
- Apply safe criteria, identify unavailable criteria in plain language, and offer edit/delete recovery.
- Never substitute a different expansion or rarity without acknowledgement.
- **Incomplete:** whether partial application is safer than stop-and-review requires research.

## Draft data shape

Illustrative only; field names are not an API contract.

```json
{
  "id": "search_local_01",
  "name": "151 illustration rares",
  "schemaVersion": 1,
  "filters": {
    "query": "",
    "rarity": "Illustration Rare",
    "expansion": "Scarlet & Violet—151"
  },
  "createdAt": "2026-07-20T10:00:00Z",
  "updatedAt": "2026-07-20T10:00:00Z"
}
```

Do not store listing snapshots, prices, card images, free-text seller content, account identifiers, payment data, access tokens, or alert consent in this local record.

## Assumptions to test

1. Repeat collectors receive more value than occasional gift buyers (`CI-01` versus `CI-04`).
2. Reopening exact criteria is more useful than generic search history.
3. Explicit **Update search** behavior is clearer than automatic persistence (`SS-05`).
4. Shoppers can recover from stale taxonomy without losing trust (`CI-03`, `MK-06`).
5. Mobile value is mainly opening a search and checking stock, not constructing complex filters (`CI-05`, `AN-07`).
6. Local-only persistence is acceptable while the experience remains visibly preview.
7. Saving a search does not imply interest in an alert (`SS-04`, `MK-05`).

## Open questions

- Which catalog filters are stable enough to serialize?
- Are names unique, case-insensitively unique, or repeatable with metadata?
- Should applying a partly invalid search proceed or pause for review?
- How should “edited from search” differ from unsaved filters?
- Is undo required for delete in preview?
- What event and session definitions make reuse meaningful without collecting search content?
- What evidence would justify account sync?
- What separate evidence would justify price alerts?
- What threshold, cadence, channel, quiet-hours, and unsubscribe model would alerts require?
- Should a shareable URL remain a lightweight handoff rather than durable storage?

## Human decision points

| Decision | Options | Current leaning | Needed evidence |
| --- | --- | --- | --- |
| Duplicate names | Block, allow, or disambiguate | Disambiguate or block | Naming usability test |
| Save changes | Explicit update, auto-update, or save-as-only | Explicit update plus save as | `SS-05` follow-up |
| Invalid criteria | Partial apply or stop for review | Explain and partially apply | Recovery study |
| Mobile creation | Full, reduced, or open-only | Open with reduced editing | Broader mobile workflow sample |
| Persistence gate | Remain local or add account sync | Remain local now | Reliability and cross-device evidence |
| Alert gate | No alerts or explicit opt-in | No alerts in preview | Price-monitoring research and consent review |

## Proposed acceptance boundaries

- Core create/apply/rename/delete operations work with keyboard-only navigation.
- Reloading the same browser restores valid searches; clearing site data removes them.
- Corrupt or unsupported stored records do not break the catalog.
- Active and modified state is perceivable without color alone.
- Unavailable expansion or rarity criteria are explained rather than silently replaced.
- Telemetry contains event metadata only, with no search name or filter value.
- Saving a search creates no notification subscription.

## Measurement and release

Use the proposed measures in the [product brief](brief.md) and event definitions in [usage evidence](evidence/usage-analytics.json). Preview release requires accessibility checks, corrupt-state recovery tests, visible local-only language, and a documented rollback. The roadmap’s `init-saved-searches-preview` entry is authoritative for sequencing and decision gates.
