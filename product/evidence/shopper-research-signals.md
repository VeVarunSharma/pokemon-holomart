# Shopper interview and support signals

> **Provenance label: SYNTHETIC / DEMO-ONLY.** These are fictional composite notes created for product-planning practice. Participants, dates, quotes, tickets, prices, and workflows are invented. The sample is intentionally small and contradictory.

## Interview-style notes

### CI-01 — repeat chase-card search

- **Synthetic participant:** Set collector completing a Scarlet & Violet—151 binder
- **Synthetic session:** 2026-07-08, marketplace walkthrough
- **Signal:** Recreates “151 + illustration rare + near mint” several times each week.
- **Invented quote:** “I know exactly what I’m hunting; I don’t want to rebuild it every night.”
- **Tension:** Would value a price alert, but only for a narrow subset of cards.
- **Confidence:** Low; one fictional participant and no timing study.

### CI-02 — price context before purchase

- **Synthetic participant:** Competitive player who also collects favorite Pokémon
- **Synthetic session:** 2026-07-10, purchase journey
- **Signal:** Compares multiple sellers and a market reference before buying.
- **Invented quote:** “A low price gets my attention, but condition and seller history decide the purchase.”
- **Tension:** Faster checkout is less important than trustworthy comparison.
- **Confidence:** Low; concept reaction, not observed production behavior.

### CI-03 — stale criteria and trust

- **Synthetic participant:** Long-time collector with saved marketplace bookmarks
- **Synthetic session:** 2026-07-14, prototype review
- **Signal:** Asked what happens when a rarity label or expansion filter changes.
- **Invented quote:** “A shortcut that quietly shows a different set is worse than starting over.”
- **Tension:** Reliability and explanation may matter more than save speed.
- **Confidence:** Low-to-medium for identifying a risk, not its prevalence.

### CI-04 — occasional gift buyer

- **Synthetic participant:** Parent shopping for a birthday gift
- **Synthetic session:** 2026-07-15, navigation test
- **Signal:** Did not notice Saved Searches and expected guided recommendations instead.
- **Invented quote:** “I’m here once; help me know what’s appropriate.”
- **Tension:** The feature likely serves repeat collectors rather than all shoppers.
- **Confidence:** Low; one fictional usability observation.

### CI-05 — mobile stock check

- **Synthetic participant:** Collector visiting local trade nights
- **Synthetic session:** 2026-07-17, contextual inquiry
- **Signal:** Checks saved hunts and current prices on a phone, but creates detailed filters on desktop.
- **Invented quote:** “On my phone, show me whether the card appeared and what it costs.”
- **Tension:** Full mobile creation parity may not match the workflow.
- **Confidence:** Low; directional design input only.

## Support-style signals

### SS-01 — saved searches disappeared

- **Synthetic channel/date:** Support ticket, 2026-07-06
- **Signal:** A shopper expected a browser-local search to appear after signing in on another device.
- **Risk:** Preview language and persistence boundaries are unclear.
- **Count represented:** 1 fictional ticket.

### SS-02 — duplicate search names

- **Synthetic channel/date:** Support ticket, 2026-07-11
- **Signal:** Two local searches named “Pikachu” made the panel ambiguous.
- **Risk:** Naming rules, metadata, and rename affordances are underspecified.
- **Count represented:** 1 fictional ticket.

### SS-03 — stale expansion filter

- **Synthetic channel/date:** Escalation note, 2026-07-13
- **Signal:** A stored search referenced an expansion value removed from the catalog taxonomy.
- **Risk:** Applying a search must explain unavailable criteria instead of silently broadening results.
- **Count represented:** 1 fictional escalation.

### SS-04 — price-drop alert request

- **Synthetic channel/date:** Feature request, 2026-07-18
- **Signal:** A collector asked for an alert when a matching near-mint card dropped below a chosen price.
- **Counter-signal:** The request requires threshold, freshness, channel, frequency, and sold-inventory behavior—not just a toggle.
- **Count represented:** 1 fictional request.

### SS-05 — accidental overwrite concern

- **Synthetic channel/date:** Chat transcript summary, 2026-07-20
- **Signal:** A shopper was unsure whether changing the rarity had changed the saved search.
- **Risk:** Apply, update, and save-as-new need distinct feedback.
- **Count represented:** 1 fictional contact.

## Product judgment prompted

The set supports hardening personal repeat search and state legibility, but does **not** establish broad demand for account sync or price alerts. CI-01 favors repeat collector workflows; CI-04 questions relevance for occasional buyers; SS-04 suggests alert value but exposes substantial consent and freshness work. The [Saved Searches spec](../saved-searches-spec.md) therefore leaves sync, alerts, and full mobile creation as explicit decisions.
