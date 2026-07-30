# Saved Searches UX/design brief

> **Synthetic local design artifact.** This brief supports the HoloMart demo and is safe to commit. It is not shopper research, a production-ready design, or a substitute for accessibility, privacy, or notification-consent review.

Product context: [brief](../product/brief.md) · [incomplete spec](../product/saved-searches-spec.md) · [decision record](../product/decisions/0001-saved-searches-local-preview.md) · [synthetic evidence](../product/evidence/README.md)

## Experience principles

- Keep criteria inspectable: a named search must not hide why cards appear.
- Keep commerce context visible: price, condition, and seller trust remain adjacent to results.
- Make persistence boundaries visible: “stored on this device only” appears at create and manage points.
- Separate saving, editing, overwriting, and alert consent.
- Recover in context; malformed local state must not block card discovery.

## Primary flows

### Create from current filters

1. Shopper configures card, rarity, and expansion filters.
2. **Save this search** opens a focused dialog with name, criteria summary, and local-only note.
3. Validation is inline and announced.
4. Success closes the dialog and announces that the search was saved on this device.

### Open and understand

1. Saved Searches lists personal local shortcuts with name and criteria summary.
2. Selection applies validated criteria.
3. Catalog shows the active search, result count, and filter state.
4. If current filters change, show **Edited** with explicit **Update search** and **Save as new** actions.

### Manage

- Rename preserves the stable local identifier.
- Delete uses a confirmation naming the search; explore undo.
- Invalid searches remain manageable instead of disappearing silently.

### Recover

- If an expansion or rarity is unavailable, identify the omitted criterion and never substitute silently.
- Offer **Review filters**, **Update search**, and **Delete search** as appropriate.
- If local storage cannot be parsed, isolate bad records, load the catalog, and explain recovery.

## Responsive behavior

- **Wide (≥1024 px):** Saved Searches stays beside the catalog and persistent filter controls.
- **Medium (600–1023 px):** panel moves above results; saved searches can scroll horizontally.
- **Narrow (<600 px):** prioritize open/apply, criteria summary, price, and recovery. Complex creation may be reduced pending research (`CI-05`, `AN-07`).
- No horizontal scrolling for primary actions at 320 CSS px.
- Zoom/reflow at 400% preserves order, labels, card price, and access to actions.

## Loading, empty, and error states

| State | Required behavior |
| --- | --- |
| No saved searches | Explain repeat-use value and local persistence. |
| No card matches | Preserve criteria; distinguish zero inventory from load failure. |
| Empty filter set | Decide whether “all listings” is savable; do not create accidentally. |
| Storage unavailable | Keep browsing functional and explain the browser limitation. |
| Corrupt/old schema | Quarantine invalid record and avoid raw error codes. |
| Expansion/rarity removed | Explain the unavailable criterion and offer recovery. |
| Listing fetch error | Keep search context, offer retry, and do not imply corruption. |
| Price data stale | Label freshness; do not present a price comparison as guaranteed. |

## Keyboard behavior

- Use native buttons, dialogs, inputs, selects, and forms where possible.
- Tab order follows visual and task order; opening the dialog moves focus to the name field.
- `Escape` closes without saving and returns focus to the invoker.
- `Enter` applies or submits only in the expected native context.
- Destructive actions are not triggered by an ambiguous shortcut.
- After rename/delete, move focus predictably.
- Do not require drag, hover, or pointer precision.

## Accessibility

- Target WCAG 2.2 AA with automated and manual keyboard/screen-reader checks.
- Provide programmatic names for searches, criteria, result counts, prices, conditions, sellers, and cart actions.
- Announce save/apply/recovery/cart outcomes through a non-disruptive live region.
- Convey active, changed, unavailable, loading, and error states with text and semantics, not color alone.
- Maintain at least 4.5:1 text contrast and 3:1 meaningful component contrast using [tokens](tokens.json).
- Touch targets are at least 24×24 CSS px, with 44×44 preferred for primary narrow-screen actions.
- Respect reduced motion; no animation is required to understand state.
- Criteria summaries and price comparisons remain understandable when read linearly.

## Price alerts and account sync

Current searches are device-local shortcuts, not durable account records or notification subscriptions.

- Account sync needs lifecycle, migration, export, deletion, and multi-device conflict semantics.
- Price alert opt-in must be separate from **Save search**.
- Any alert concept must specify threshold, currency, price source, freshness, frequency, channel, quiet hours, pause, and unsubscribe.
- A sold listing must not produce a success-shaped alert outcome.
- Price comparisons are context, not appraisals or guaranteed resale value.

## Research questions

1. Can repeat collectors create and reopen a search without explanation?
2. Do shoppers distinguish saved state from filters edited after opening?
3. Which stale-criterion recovery model builds trust: partial apply or stop-and-review?
4. Is duplicate-name prevention clearer than metadata-based disambiguation?
5. Does an occasional buyer prefer search history to Saved Searches?
6. On narrow screens, is applying and understanding sufficient?
7. Which price-monitoring job, if any, justifies an alert?
8. Can alert consent remain clearly separate from saving a search?

## Design handoff and fallback

No external design system or Figma file is required. Use [local design context](local-design-context.json) and [design tokens](tokens.json) as the authentication-independent source for the demo.
