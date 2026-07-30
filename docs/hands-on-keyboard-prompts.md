# Hands-on-keyboard prompt pack

Use this sequence from the repository root. Every product signal is **SYNTHETIC / DEMO-ONLY**.

## 1. Orient to the product

```text
Read README.md and product/brief.md. In five bullets, explain HoloMart, its target shoppers, the working storefront, the Saved Searches boundary, and the decisions this demo preserves for people.
```

Expected: a Pokémon TCG singles marketplace, synthetic listing data, browser-local Saved Searches, no account sync, and no implicit price-alert consent.

## 2. Inspect the working app

```text
Trace the storefront from app/index.html through app/app.js, src/data/cards.js, filter state, export, share URL state, and Saved Searches storage. Cite every claim as path:line.
```

```text
Classify each capability as implemented, partial, absent, or unknown: catalog rendering, query/rarity/expansion filters, responsive listings, cart interaction, CSV export, URL state, Saved Searches create/apply/delete, rename, edited state, stale-criterion recovery, account sync, and price alerts.
```

Checkpoint: confirm the classifications before proposing scope.

## 3. Ask the feature question

```text
/repository-feature-assessment Is HoloMart Saved Searches half-built, what will it break, and how big is it?
```

Fallback:

```text
Use .github/prompts/repository-feature-assessment.prompt.md to assess HoloMart Saved Searches. Include a capability matrix, dependency trace, tests and gaps, product implications, and human decisions. Stop after the assessment.
```

Useful follow-up:

```text
Trace the smallest current dependency chain and separate future account-sync and price-alert chains. Mark every inferred edge.
```

## 4. Synthesize evidence

```text
/evidence-to-spec Sharpen the device-local Saved Searches preview around stale taxonomy, accessibility, and explicit non-goals. Stop at the evidence checkpoint.
```

Fallback:

```text
Build a claim matrix from product/evidence/README.md. For every CI, SS, AN, or MK claim used, include source, interpretation, confidence, limitation, and counter-signal. Do not treat a quote or count as proof.
```

Questions to ask:

```text
Which evidence supports repeat collectors, and which evidence limits the audience?
```

```text
Why does later-session reuse not establish cross-device demand?
```

```text
Why must saving a search remain separate from price-alert consent?
```

Checkpoint: approve or challenge the interpretation while leaving roadmap decisions open.

## 5. Review UX and accessibility

```text
/figma-ux-review Review Saved Searches, card listing trust context, cart actions, zero-results, storage failure, and stale-criterion recovery using only the committed local design fallback.
```

Fallback:

```text
Use design/saved-searches-ux-brief.md, design/local-design-context.json, design/tokens.json, app/index.html, app/app.js, and app/styles.css. Review keyboard, screen reader, focus, non-color state, reduced motion, 320 CSS px, 400% zoom, price/condition clarity, and alert-consent language.
```

Checkpoint: confirm source and severity before drafting issues.

## 6. Preview a small UI change

```text
/ui-change-preview Preview the smallest change that makes active-versus-edited Saved Search state explicit. Do not edit files. Show the proposed patch, affected tests, UX tradeoff, and rollback.
```

Alternative:

```text
/ui-change-preview Preview a stale-expansion recovery notice that never silently broadens the search.
```

## 7. Draft the primary epic

```text
/epic-subissue-draft init-saved-searches-preview
```

Deterministic commands:

```powershell
npm run issues:preview
npm run issues:preview:json
node scripts/roadmap-to-issues.mjs --initiative init-saved-searches-preview --gh-commands
```

Expected dependency order:

1. `work-search-storage-validation`
2. `work-search-core-flows`
3. `work-search-recovery`
4. `work-search-accessibility`

Checkpoint: review exact epic and child issue content before any external mutation.

## 8. Review the full roadmap

```text
/roadmap-review Review all HoloMart initiatives for evidence quality, counter-signals, dependencies, risks, open decisions, and horizon fit. Treat Now/Next/Later as options, not promises.
```

```text
/roadmap-scenario-review Compare these scenarios: harden Saved Searches only; add account sync next; prioritize listing trust; or research price alerts. Show evidence gained, risks, dependencies, reversibility, and decisions required.
```

## 9. Open Roadmap Studio

```text
Reload extensions from disk, then open Roadmap Studio using product/roadmap.json focused on init-saved-searches-preview.
```

```text
Draft a read-only Product-to-Engineering handoff for init-saved-searches-preview.
```

Then inspect:

```text
Focus init-listing-trust.
```

```text
Focus init-account-search-sync.
```

```text
Focus init-price-drop-alerts.
```

## 10. Prepare stakeholder communication

```text
/stakeholder-program-update Draft a concise update for product, design, and engineering leaders. Separate shipped demo behavior, validated repository facts, synthetic evidence, proposed roadmap options, open decisions, and risks.
```

## Role-based shortcuts

### Product manager

```text
Using product/roadmap.json, identify the decision with the highest uncertainty-to-impact ratio. Show evidence for and against, the cheapest next learning step, and what not to build yet.
```

### Designer

```text
Review whether the HoloMart listing card helps a collector compare price, condition, seller reputation, and stock without implying authenticity or resale guarantees.
```

### Engineer

```text
Trace the technical boundary between current localStorage Saved Searches, future account sync, and future price alerts. Identify contracts, failure modes, migrations, and tests without proposing implementation.
```

### Product operations

```text
Turn the five roadmap initiatives into a GitHub Project field model and views. Preserve stable IDs, evidence counts, decisions, and horizon semantics.
```

## 15-minute cut

1. Show the storefront and save a search.
2. Run repository feature assessment.
3. Run `npm run issues:preview`.
4. Show Roadmap Studio or `product/roadmap.json`.
5. Close on the separate gates for sync and alerts.

## 30-minute cut

1. Product frame.
2. Repository assessment.
3. Evidence-to-spec matrix.
4. Local UX review.
5. Epic preview.
6. Roadmap review.

## Safety reminders

- Do not add real shopper, seller, payment, inventory, price, or card-art data.
- Do not imply synthetic market prices are appraisals.
- Do not turn saving into notification consent.
- Do not resolve a human decision flag automatically.
- Do not mistake a roadmap horizon for a delivery commitment.
