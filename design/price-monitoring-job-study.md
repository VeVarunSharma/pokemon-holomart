# Collector price-monitoring job study

> **SYNTHETIC / DEMO-ONLY.** This is a research plan for the HoloMart demo, not observed shopper research, an approved alert design, an implementation commitment, or authorization to send notifications.

Product context: [`init-price-drop-alerts`](../product/roadmap.json) · [synthetic evidence index](../product/evidence/README.md) · [Saved Searches UX brief](saved-searches-ux-brief.md) · [local-only decision](../product/decisions/0001-saved-searches-local-preview.md)

## Evidence and limitations

| Source | Observation | Limitation or counter-signal |
| --- | --- | --- |
| **SYNTHETIC / DEMO-ONLY** `CI-01` (`product/evidence/shopper-research-signals.md:7-14`) | One fictional collector repeatedly recreated a narrow expansion, rarity, and condition search and expressed interest in alerts for only a subset of cards. | One low-confidence interview-style note with no timing study does not identify an exact card, threshold, or recurring alert job. |
| **SYNTHETIC / DEMO-ONLY** `CI-02` (`product/evidence/shopper-research-signals.md:16-23`) | One fictional shopper compared prices before buying. | This was a concept reaction, not observed behavior; condition and seller history mattered more than price alone. |
| **SYNTHETIC / DEMO-ONLY** `SS-04` (`product/evidence/shopper-research-signals.md:75-80`) | One fictional request asked for a matching near-mint card below a chosen price. | One request does not establish frequency or demand and leaves freshness, channel, cadence, and sold-inventory behavior unresolved. |
| **SYNTHETIC / DEMO-ONLY** `MK-03` (`product/evidence/market-notes.md:5-11`) | An invented generic market pattern combines item criteria with a price threshold. | No live marketplace was studied; pattern familiarity does not prove HoloMart value, and saving is not notification consent. |

The sample is invented, tiny, non-representative, and contradictory (`product/evidence/README.md:1-17`). It supports comparing workflows, not choosing or shipping an alert.

## Workflows to observe separately

| Workflow | Job to test | Observation prompts | Counter-signal or stop condition |
| --- | --- | --- | --- |
| Exact-card threshold | Notice when a deliberately identified card or printing in an acceptable condition crosses a chosen price. | Ask the collector to identify the card, acceptable condition, threshold, and action they would take; observe repeated checks over time. | Identity or condition remains ambiguous, the threshold changes opportunistically, or a notice would not change the next action. |
| Broad inventory monitoring | Notice any new or changed listing matching reusable catalog criteria such as expansion and rarity. | Observe how the collector defines acceptable matches, handles irrelevant results, and decides whether price, condition, or seller makes a match actionable. | Match volume creates noise, criteria drift, or the collector narrows to one card rather than monitoring a category. |
| Non-alert monitoring | Revisit a local Saved Search, review an in-product “new matches” reminder, use history/bookmarks, or make no product investment. | Observe whether a collector remembers to return, understands freshness, and completes the comparison without outbound delivery. | The collector repeatedly misses a time-sensitive opportunity and can explain why an explicit notification would materially change the outcome. |

These workflows are not interchangeable. Exact-card monitoring requires stable identity and a specific threshold; broad monitoring evaluates changing inventory against reusable criteria; a non-alert workflow keeps review shopper-initiated and may satisfy the job without notification consent.

## Research decision matrix

Record observed behavior for each workflow before selecting a concept. A preference, synthetic quote, generic market pattern, or prototype reaction does not satisfy the gate.

| Question | Evidence needed | Counter-signal or non-alert alternative |
| --- | --- | --- |
| Is exact-card monitoring recurring and actionable? | Multiple observed later-session checks for an intentionally identified card or printing, with a stable condition boundary and threshold that changes the shopper's next action. | Manual revisit, wishlist, bookmark, or in-product reminder completes the job; identity, condition, or threshold is unstable. |
| Is broad inventory monitoring a distinct recurring job? | Multiple observed workflows where collectors repeatedly review new matching inventory and can explain acceptable match breadth. | Irrelevant-match volume is high, or collectors consistently narrow to an exact card. |
| Is outbound notification necessary? | Repeated observed cases where shopper-initiated review is insufficient and timely delivery changes a concrete next action. | A Saved Search, history, scheduled self-reminder, or in-product new-match state is sufficient; price alone is not actionable. |
| Was a recurring problem established? | More than a single request or workflow, observed over time across an explicitly documented sample, with counter-signals retained. | The evidence remains one-off, stated preference only, contradictory, or adequately served without an alert. |

## Current outcome

No recurring alert problem is established. The available material contains one fictional request and one fictional repeat-search workflow, but no separate observation of exact-card, broad-match, and non-alert monitoring over time. Price-only action is also weakened by the `CI-02` condition and seller-trust counter-signal.

Keep `decision-alert-job` and `decision-alert-consent` open (`product/roadmap.json:523-537`). Human review must still choose **exact-card threshold, any matching listing, or no alert investment**, and separately decide whether any consent model should be explored.

## Guardrails and unknowns

- No notification prototype, subscription assumption, account sync, outbound delivery, or alert commitment.
- Saving a search never creates notification consent.
- Do not add live pricing, real shopper or seller data, inventory feeds, credentials, integration configuration, or copyrighted card artwork.
- Unknowns include monitoring frequency, stable card identity, acceptable match breadth, currency, price source, freshness, condition changes, sold-listing outcomes, and whether an in-product reminder is sufficient.
- A later concept still requires separate consent, lifecycle, freshness, accessibility, and inventory-race review; this study does not resolve those decisions.

## Validation

This change is documentation and planning only. Verify the generated `work-alert-job-study` preview references this study, retains no dependencies and excludes notification implementation. Confirm the roadmap remains **next**, **discovery**, and **low confidence**, with both alert decisions open. No storefront, persistence, pricing, or notification behavior should change.
