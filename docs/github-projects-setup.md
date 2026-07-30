# GitHub Projects setup for HoloMart

> **SYNTHETIC / DEMO-ONLY.** Use `product/roadmap.json` as the authoritative product roadmap and GitHub Issues/Projects as the live delivery view.

## Issue model

- **Initiative epic** — one `init-*` roadmap item with outcome, evidence, risks, measures, and decision gates.
- **Child issue** — one dependency-ordered `work-*` item with rationale, acceptance criteria, references, and validation.
- **Bug** — an observed defect with reproduction and expected behavior.
- **Idea/discovery** — an uncommitted question that must not imply delivery.

Keep stable IDs in titles or bodies so repository roadmap entries and GitHub work remain traceable.

## Recommended fields

| Field | Type | Values / source |
| --- | --- | --- |
| Status | Built-in single select | Todo, In Progress, Done |
| Roadmap ID | Text | `init-*` or `work-*` |
| Horizon | Single select | Now, Next, Later |
| Product status | Single select | discovery, planned, in-progress, gated, candidate |
| Work type | Single select | Initiative, Feature, Improvement, Research, Bug |
| Confidence | Single select | low, medium, high |
| Impact | Single select | low, medium, high |
| Effort | Single select | small, medium, large, unknown |
| Decision gate | Single select | Open, Decided, Deferred, None |
| Target start | Date | `targetWindow.start` |
| Target end | Date | `targetWindow.end` |

Avoid copying full evidence into fields. Keep details in the issue and repository artifacts.

## Views

1. **Roadmap board** — group by Horizon.
2. **Delivery board** — group by Status and filter to Now.
3. **Gated decisions** — filter Product status = gated or Decision gate = Open.
4. **Backlog table** — show Work type, impact, effort, confidence, and parent initiative.
5. **Timeline** — use target dates for Now/Next and label them illustrative.

## Canonical preview

```powershell
node scripts/validate-artifacts.mjs
node scripts/roadmap-to-issues.mjs --initiative init-saved-searches-preview --format json
node scripts/roadmap-to-issues.mjs --initiative init-saved-searches-preview --gh-commands
```

The preview for `init-saved-searches-preview` contains:

1. `work-search-storage-validation`
2. `work-search-core-flows`
3. `work-search-recovery`
4. `work-search-accessibility`

Account sync, price alerts, listing trust, and collector lists remain distinct initiatives so creation of one epic does not imply approval of the others.

## Automation guardrails

- New issues may enter **Todo**, never automatically enter **In Progress**.
- Issue close/reopen may update Status while preserving manual correction.
- Do not auto-close an initiative when children close.
- Do not resolve decisions, move horizons, assign people, or publish releases from synthetic metrics.
- Keep automations reversible and observable.
