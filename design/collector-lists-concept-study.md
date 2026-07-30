# Collector lists low-fidelity concept study

> **SYNTHETIC / DEMO-ONLY.** This is a research aid for the HoloMart demo, not shopper evidence, an approved design, an implementation commitment, or a production promise.

Product context: [`init-collector-lists`](../product/roadmap.json) · [synthetic evidence index](../product/evidence/README.md) · [Saved Searches UX brief](saved-searches-ux-brief.md)

## Supplied design context

The issue author supplied [a Figma wireframe link](https://www.figma.com/design/ojO7TzlNBgndfaJVGEB7yV) and described it as a low-fidelity desktop study of wishlist, explicit owned collection, gift list, and dynamic Saved Search workflows. The supplied description says the study preserves explicit ownership and includes a research decision matrix.

The linked frames were not authenticated or inspected for this committed fallback. Their exact layout, content, interaction states, and accessibility behavior remain unknown. The link and description are unverified design input, not a new `CI-*`, `SS-*`, `AN-*`, or `MK-*` evidence source.

## Evidence and limitations

| Source | Observation | Limitation |
| --- | --- | --- |
| **SYNTHETIC / DEMO-ONLY** `CI-04` (`product/evidence/shopper-research-signals.md:34-41`) | One fictional occasional gift buyer expected guidance and did not notice Saved Searches. | One invented, low-confidence observation is a counter-signal, not proof of a gift-list need. |
| **SYNTHETIC / DEMO-ONLY** `MK-02` (`product/evidence/market-notes.md:5-9`) | Generic collector products distinguish stable card intent from dynamic searches. | Market familiarity does not establish HoloMart demand; search intent and ownership use different data models. |

No observed workflow currently establishes that any stable list solves a recurring problem distinct from Saved Searches. The roadmap therefore keeps the initiative **later**, **candidate**, and **low confidence**, with the primary job deferred for human decision (`product/roadmap.json:589-649`).

## Concepts to compare, not approve

| Concept | Candidate job | Boundary to test |
| --- | --- | --- |
| Wishlist | Remember stable card intent independent of current listings. | Adding intent does not imply purchase, possession, or an alert subscription. |
| Explicit owned collection | Record cards a collector deliberately says they own. | Ownership requires a separate explicit action; save, cart, and purchase events never infer it. |
| Gift list | Prepare stable gift ideas for a recipient or occasion. | Do not infer recipient identity, ownership, or social-sharing scope. |
| Saved Search | Reapply dynamic catalog criteria as listings and prices change. | Search criteria remain distinct from a stable card list and from notification consent. |
| None | Continue with guidance and Saved Searches only. | A familiar list pattern is insufficient reason to add another persistent destination. |

## Research decision matrix

Record observations before choosing a concept. A wireframe preference or synthetic quote does not satisfy the gate.

| Question | Evidence needed | Counter-signal or stop condition |
| --- | --- | --- |
| Is there a recurring stable-intent job? | Multiple observed workflows where people must retain specific card intent outside a changing query. | Guidance, history, or a Saved Search completes the job without a new persistent list. |
| Is ownership a distinct job? | People explicitly add, correct, archive, and remove owned cards in a way that cannot be inferred from commerce events. | Participants expect save, cart, or purchase to update ownership automatically. |
| Is gifting the primary job? | Repeated workflows distinguish gift intent, recipient context, and completion from personal wishlisting. | The need is occasional guidance rather than durable storage (`CI-04`). |
| Can people distinguish the models? | Participants can explain why an item is in a wishlist, owned collection, gift list, or Saved Search. | Labels or actions create overlapping destinations or ambiguous ownership. |

## Guardrails

- Saving, adding to cart, or buying never marks a card as owned.
- Ownership is only recorded through an explicit, reversible action if that concept is later approved.
- No social sharing, collection valuation, real shopper or recipient data, copyrighted card artwork, alerts, or account sync.
- Do not change roadmap status, horizon, or the deferred human decision based on this concept study.

## Accessibility questions for later concept testing

If research establishes a distinct job, test keyboard and screen-reader naming for list type and item state, focus after add/remove actions, text alternatives to color-only ownership state, reflow at 320 CSS px and 400% zoom, and explicit empty, error, and confirmation states. These are research checkpoints, not claims about the uninspected Figma frames.

## Open human decision

The primary unmet job remains **wishlisting, owned collection, gifting, or none**. Keep this decision deferred until multiple observed workflows establish a recurring problem that Saved Searches cannot meet.
