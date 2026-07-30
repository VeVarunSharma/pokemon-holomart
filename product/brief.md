# HoloMart product brief

> **Synthetic demo artifact.** HoloMart, its shoppers, sellers, listings, prices, quotes, usage, and plans are fictional. Pokémon names are used only to illustrate the marketplace concept; this repository includes no card artwork and makes no production commitment.

## Product and users

HoloMart is a marketplace for discovering and buying Pokémon TCG singles from independent sellers. It brings card identity, condition, seller trust, and market-price context into one decision surface.

- **Collectors** hunt for exact cards, printings, rarities, and conditions without rebuilding the same filters.
- **Players** compare playable copies and lower-cost conditions.
- **Gift buyers** need plain-language guidance without deep set knowledge.
- **Independent sellers** need trustworthy listings and qualified demand.

## Problem

High-intent collectors revisit the same narrow searches—such as a Pokémon, expansion, rarity, and condition—while inventory and prices change around them. The current **Saved Searches** preview stores a query in one browser, but it cannot sync to an account, explain stale criteria, or notify a shopper when a matching listing crosses a price threshold.

The product decision is not simply “build alerts.” First, HoloMart must make the saved-search foundation reliable and legible, then separately validate account continuity and notification consent.

## Strategy

1. Help shoppers narrow a large catalog with confidence, not just speed.
2. Keep price, condition, and seller context visible at the decision point.
3. Treat Saved Searches as shopper-controlled shortcuts, not notification consent.
4. Expand from browser-local recall to account sync and price alerts only through explicit evidence and safety gates.

See the [synthetic evidence index](evidence/README.md), [incomplete Saved Searches spec](saved-searches-spec.md), and [preview decision record](decisions/0001-saved-searches-local-preview.md).

## Goals

- Reduce repeat search setup for collectors who revisit a chase-card query.
- Make saved criteria, active state, and local-only persistence easy to understand.
- Recover safely when an expansion, rarity, or catalog field changes.
- Learn whether later-session reuse reflects real cross-device and price-monitoring needs.
- Preserve a separate, explicit opt-in for any future price alert.

## Non-goals

- Account sync or outbound alerts in the current preview.
- Authenticating, grading, pricing, or shipping real cards in this demo.
- Treating a synthetic market price as a valuation guarantee.
- Bundling real customer, seller, payment, or inventory data.
- Claiming that directional synthetic signals establish demand or causality.

## Constraints

- Current Saved Searches state is browser-local and can disappear with site data.
- Catalog taxonomies change; stored expansion and rarity values can become stale.
- Search state must never include payment data, addresses, seller credentials, or card images.
- Price alerts require separate consent, threshold, frequency, quiet-hour, and unsubscribe semantics.
- Narrow screens must preserve browsing and recovery even if complex search creation is reduced.
- All inventory, prices, ratings, and availability shown in the working app are synthetic.

## Success metrics and guardrails

These are proposed decision aids, not real baselines or launch targets.

| Measure | Proposed interpretation |
| --- | --- |
| Time to restore a repeat card search | Directionally lower for returning collectors |
| Later-session reuse rate | Portion of created searches reopened in a later synthetic session |
| Search-to-listing engagement | Diagnostic signal that restored criteria still produce useful inventory |
| Successful stale-filter recovery | Search opens safely or explains unavailable criteria |
| Save-to-alert opt-in | Must remain a separate future funnel, never an implicit subscription |
| Accessible task completion | Create, apply, rename, delete, and recover work with keyboard and screen reader |
| Unintended notification count | Must remain zero before any alert experiment |

Metric definitions and limitations are in [usage and analytics evidence](evidence/usage-analytics.json). The authoritative planning artifact is [roadmap.json](roadmap.json).
