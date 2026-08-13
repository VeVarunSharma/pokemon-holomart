# Listing signal hierarchy and language

> **Provenance: SYNTHETIC / DEMO-ONLY.** This content guide applies only to HoloMart's fictional listings, prices, conditions, sellers, ratings, and market references. It defines comparison language for the demo; it is not an appraisal, grading, authentication, seller-scoring, or price-feed standard.

## Evidence and limits

| Source | Observation | Interpretation for this guide | Limitation / counter-signal |
| --- | --- | --- | --- |
| **SYNTHETIC / DEMO-ONLY** `CI-02` (`product/evidence/shopper-research-signals.md:16-23`) | One fictional shopper compares price, condition, seller history, and a market reference. | Keep the four signals distinguishable at the decision point. | One invented concept reaction does not establish shopper behavior or the best hierarchy. |
| **SYNTHETIC / DEMO-ONLY** `MK-04` (`product/evidence/market-notes.md:5-10`) | Generic fictional market notes say collectible marketplaces emphasize condition, seller reputation, and price context. | Use those signals as comparison inputs, not proof. | More metadata can increase cognitive load and cannot guarantee authenticity. |

The product brief excludes real authentication, grading, and valuation claims (`product/brief.md:37-43`) and identifies all displayed commerce data as synthetic (`product/brief.md:45-52`). The hierarchy below is therefore a proposed demo content baseline, not evidence that the signals are accurate or sufficient.

## Hierarchy

Present signals in this reading order. Price and condition form the primary comparison pair; seller context is secondary; market context is supporting and must never visually overtake the listing price.

| Priority | Signal | Required label and content pattern | Meaning | Do not imply |
| --- | --- | --- | --- | --- |
| 1 | Listing price | **Listing price** · `$X.XX` | The fictional seller's current asking price for this demo listing. | Fair value, future value, appraisal, or resale return. |
| 2 | Condition | **Seller-reported condition** · `{condition}` | The condition label supplied with the fictional listing. | Independent grading, verification, authentication, or a condition guarantee. |
| 3 | Seller context | **Demo seller** · `{name}`; **Synthetic rating** · `{rating} · {count} demo sales` | Fictional history that can help compare demo sellers. | Trustworthiness, endorsement, identity verification, or a real seller score. |
| 4 | Market context | **Demo market reference** · `{difference} below/above demo reference · {freshness}` | An illustrative comparison to a synthetic reference value. | Live market coverage, an appraisal, a recommended purchase, or guaranteed resale value. |

Stock and promotional badges are supplementary. They must not interrupt the four-signal reading order or use authentication, valuation, or urgency language that the demo cannot support.

## Freshness and unavailable context

- Show source type and freshness together: **Demo market reference · Updated {demo date}**.
- Until the synthetic data includes an update timestamp, use **freshness unavailable**. Do not invent a date or use “current,” “live,” or “tracked.”
- If the reference is absent, show **Demo market reference unavailable**; do not infer one from listing price.
- “Below/above demo reference” describes arithmetic only. Avoid “deal,” “great value,” “undervalued,” “investment,” or “expected return.”

## Guarantee-safe language

| Avoid | Use instead |
| --- | --- |
| “Authenticated” or “authentic” | Omit the claim; HoloMart performs no authentication. |
| “Condition guaranteed” or “condition-graded” | “Seller-reported condition” |
| “Trusted seller” or “verified seller” | “Demo seller” and “Synthetic rating” |
| “Market price,” “price guide,” or “market value” without qualification | “Demo market reference” |
| “Worth,” “investment,” “resale value,” or “guaranteed return” | “Comparison context only—not an appraisal or resale guarantee” |

The boundary must appear wherever the four signals are explained: **Synthetic demo context only. No authentication, grading, appraisal, or resale guarantee.**

## Responsive and accessibility handoff

- Preserve the semantic reading order: listing price, seller-reported condition, demo seller context, then demo market reference.
- Keep each visible label in the accessible name; do not rely on color, icons, badge position, or a tooltip to explain the signal.
- Do not separate a comparison amount from its **demo reference** and freshness labels.
- If space requires progressive disclosure, keep the listing price and seller-reported condition visible. Which additional signals must remain visible on every future card is still an unresolved human decision in `product/roadmap.json:291-298`; this guide does not close it.

## Content review checklist

- Price is identified as a listing price rather than value.
- Condition is attributed to the fictional seller.
- Seller rating and sales are identified as synthetic demo history.
- Market comparison says **demo reference** and includes freshness or **freshness unavailable**.
- No label, badge, helper text, accessible name, or empty state implies authenticity, independent grading, appraisal, or resale value.
