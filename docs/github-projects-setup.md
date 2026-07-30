# GitHub Projects setup for the Signal Desk demo

> **SYNTHETIC / DEMO-ONLY.** This is a recommended, manual setup. It does not create issues, Projects, fields, workflows, or integrations.

Use `product/roadmap.json` as the authoritative roadmap and GitHub Issues/Projects as a reviewed delivery view. Preview proposed mutations and obtain explicit human approval before creating or changing remote resources.

## Recommended issue model

Use repository issue forms for consistent intake:

- **Product discovery** — a problem, evidence/counter-evidence, repository reality, and decision to make.
- **Epic** — one approved roadmap initiative with its stable `init-*` ID.
- **Design review** — a flow/state review grounded in supplied context or the committed local fallback.
- **Task/feature issue** — one roadmap `work-*` item, normally created as a sub-issue of its epic.

If organization issue types are available, map these to `Discovery`, `Epic`, `Design review`, and `Task`. Otherwise use labels with the same names. Do not create issue types or labels during the demo without separate approval.

## Epic and sub-issue relationships

1. Generate a dry run:

   ```powershell
   node scripts/roadmap-to-issues.mjs --initiative init-saved-views-preview
   ```

2. Review synthetic evidence, code citations, scope/non-goals, decision flags, labels, and dependency order.
3. After explicit write approval, create the epic and children manually or review the PowerShell-compatible commands from `--gh-commands`. These commands omit `--label` so repository-specific labels are never an execution prerequisite; suggested labels appear only in preview metadata/comments and require a separate repository review.
4. Add each child as a GitHub sub-issue of the epic. Preserve `init-*` and `work-*` IDs in issue bodies.
5. Represent internal dependencies with blocked-by/blocks relationships when available; otherwise keep a checklist in the child and epic.

Creating an epic does not approve children. Creating children does not approve roadmap movement.

## Suggested Project fields

| Field | Type | Suggested values / source |
| --- | --- | --- |
| Title | Built-in | Issue title |
| Status | Single select | Triage, Discovery, Ready, In progress, In review, Done, Stopped |
| Roadmap ID | Text | Stable `init-*` or `work-*` ID |
| Work type | Single select | Discovery, Epic, Design review, Task |
| Horizon | Single select | Now, Next, Later; from roadmap |
| Product status | Single select | discovery, planned, in-progress, gated, candidate |
| Confidence | Single select | low, medium, high |
| Impact | Single select | low, medium, high |
| Effort | Single select | small, medium, large, unknown |
| Target start / date | Date | `targetWindow.start` / `targetWindow.end` |
| Owner role | Text | Roadmap role, not an inferred assignee |
| Evidence count | Number | Checked `evidenceReferences.length` |
| Decision gate | Single select | Open, Decided, Deferred, None |
| Provenance | Single select | SYNTHETIC / DEMO-ONLY |

Avoid duplicating full evidence or acceptance criteria in Project fields; retain them in the issue and authoritative repository artifacts.

## Safe automation recommendations

Configure only after a human reviews the exact rule:

- Add issues created from approved templates to the Project.
- Set initial Project `Status` to **Triage**, never **Ready** or **In progress**.
- Reflect issue close/reopen in Project status while allowing manual correction.
- Flag an epic when all sub-issues close; do not auto-close the epic.
- Surface open decision gates and blocked items; do not auto-resolve them.
- Never advance Horizon, approve gates, create issues, assign people, or publish a release from synthetic metrics.

Keep automation reversible and observable. Do not store credentials or real integration configuration in this repository.

## Roadmap views

1. **Now / Next / Later board** — group by Horizon; show confidence, impact, effort, and decision gate.
2. **Delivery board** — group by Status; filter to Now; show parent epic and blocked state.
3. **Evidence and decisions table** — group by Decision gate; show evidence count and provenance.
4. **Timeline** — use target dates only for Now/Next; clearly label illustrative windows.
5. **Design/accessibility review** — filter Work type = Design review or label = design.
6. **Gated options** — filter Product status = gated or Decision gate = Open.

Next/Later views are options, not commitments. Keep deferred work visible without implying a delivery promise.

## Demo-ready Saved Views setup

For `init-saved-views-preview`, preview the epic and these dependency-ordered children:

1. `work-view-storage-validation`
2. `work-view-core-flows` and `work-view-recovery`
3. `work-view-accessibility`

The epic remains browser-local in scope. Account sync, team sharing, permissions infrastructure, and notifications stay separate gated initiatives. Before presenting Project changes, run:

```powershell
node scripts/validate-artifacts.mjs
node scripts/roadmap-to-issues.mjs --initiative init-saved-views-preview --format json
node scripts/roadmap-to-issues.mjs --initiative init-saved-views-preview --gh-commands
```

Review the output; do not run the printed `gh` commands during setup.
