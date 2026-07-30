# Facilitator guide · 45 minutes

## Before the room

Run `npm run demo:check`, start `npm start`, and open <http://127.0.0.1:4173>. Keep `npm run issues:preview` ready. Use committed local design context unless Figma access was independently authenticated and approved.

Everything shown is **SYNTHETIC / DEMO-ONLY**. HoloMart includes no real shopper, seller, inventory, pricing, payment, or card-art data.

## 0–5 · Frame the product

**Say:** “HoloMart is a fictional Pokémon TCG marketplace. Collectors can search singles, compare condition and seller context, and save a search. The interesting product boundary is what happens next: local recall works, but account sync and price alerts do not.”

Show the storefront:

1. Search `Pikachu`.
2. Select **Special Illustration Rare**.
3. Save the search as `Pikachu chase cards`.
4. Add a listing to the demo cart.
5. Point out **Stored on this device only** and **Price alerts are next**.

Set the contract: Copilot finds, synthesizes, and drafts. People approve product interpretations, roadmap choices, and remote writes.

## 5–13 · Is Saved Searches half-built?

```text
/repository-feature-assessment Is HoloMart Saved Searches half-built, what will it break, and how big is it?
```

Fallback:

```text
Using .github/prompts/repository-feature-assessment.prompt.md, assess HoloMart Saved Searches. Cite every repository claim as path:line and stop at the human checkpoint.
```

Expected proof:

- create/read/apply/delete and defensive local reads are implemented;
- rename, active-versus-edited state, and explicit stale-criterion recovery are incomplete;
- account sync, price alerts, notification preferences, and live price integration are absent;
- current tests and TODO boundaries are separated from implemented behavior.

**Checkpoint:** accept or challenge the capability classifications. A citation makes a claim inspectable; it does not approve scope.

## 13–21 · Turn evidence into product judgment

```text
/evidence-to-spec Sharpen the device-local Saved Searches preview around stale criteria, accessibility, and explicit non-goals. Stop at the evidence checkpoint.
```

Expected proof:

- repeat-collector signal (`CI-01`) versus occasional-buyer counter-signal (`CI-04`);
- later-session reuse that does not prove cross-device demand (`AN-03`);
- price-alert request that still needs consent and freshness semantics (`SS-04`);
- explicit exclusions for account sync, alerts, listing snapshots, real prices, and sensitive telemetry.

Ask: “Which statement is a code fact, which is an evidence interpretation, and which remains an assumption?”

**Checkpoint:** confirm only the source/claim interpretation. Keep all roadmap `humanDecisionFlags` open.

## 21–29 · Review experience and trust

State the source: “Figma is optional. This run uses committed local design context.”

```text
/figma-ux-review Review Saved Searches, listing trust context, empty states, and stale-criterion recovery using the committed local design fallback.
```

Expected proof:

- native keyboard and dialog behavior;
- 320 px and 400% reflow;
- readable card, price, condition, seller, and stock context;
- market comparison framed as context, not appraisal;
- local-only persistence and separate alert consent;
- zero-result, storage-error, stale-filter, and listing-error states.

**Checkpoint:** confirm design source and finding severity before drafting work.

## 29–37 · Build the handoff

```text
/epic-subissue-draft init-saved-searches-preview
```

Deterministic fallback:

```powershell
npm run issues:preview
npm run issues:preview:json
```

Expected child order:

1. `work-search-storage-validation`
2. `work-search-core-flows`
3. `work-search-recovery`
4. `work-search-accessibility`

The preview preserves evidence, risks, guardrails, decisions, acceptance criteria, and dependency edges. It does not create remote resources.

**Checkpoint:** review exact issue titles, bodies, labels, and scope. Draft approval and write approval are separate unless the user explicitly directs both.

## 37–42 · Explore the roadmap

```text
Reload extensions from disk, then open Roadmap Studio using product/roadmap.json focused on init-saved-searches-preview. Draft a read-only handoff.
```

Point out the five initiatives:

- harden Saved Searches;
- improve listing trust comparison;
- evaluate account sync;
- research explicit price-drop alerts;
- explore collector lists.

Now/Next/Later are horizons, not promises. Account sync and alerts are gated separately because their risks and evidence differ.

If the canvas is unavailable, open `product/roadmap.json` and use `npm run issues:preview:json`.

## 42–45 · Close

**Say:** “We started with a working commerce product, used repository evidence to expose its honest boundary, sharpened the requirement with contradictory evidence, reviewed the experience, and turned the roadmap into dependency-ordered work. Copilot accelerated traceability; people kept the decisions.”

Return to three questions:

- **What exists?** A real local catalog and Saved Searches implementation.
- **What could break?** Stale criteria, unclear persistence, misleading price context, and accidental alert consent.
- **What comes next?** Bounded initiatives with evidence, gates, and explicit unknowns.

## Time-box recovery

| Behind by | Recovery |
| --- | --- |
| 1–2 min | Skip the dependency follow-up. |
| 3–5 min | Skip a UI micro-change and use deterministic issue preview. |
| 6–8 min | Skip Figma and use roadmap JSON instead of canvas. |
| Copilot stalls | Narrate expected proof from named artifacts and run local commands. |
| Ahead | Inspect one code citation or ask what evidence would change a gate. |
