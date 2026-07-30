# Saved Views — deliberately incomplete product spec

> **Status:** Synthetic demo draft; intentionally incomplete for Copilot-assisted enrichment and human review. This is not a production commitment.

## Summary

Saved Views lets a person name the current Feedback filter configuration and reopen it later in the same browser. The existing partial preview demonstrates storage and application, but does not yet meet a reliable, accessible personal-workflow bar. Team sharing remains a separate decision.

Related: [product brief](brief.md) · [synthetic evidence](evidence/README.md) · [UX brief](../design/saved-views-ux-brief.md) · [preview decision](decisions/0001-saved-views-local-preview.md) · [roadmap](roadmap.json)

## User problem

Frequent feedback triagers repeatedly reconstruct useful filter combinations. A shortcut can reduce that setup, but only if people understand which view is active, can distinguish temporary edits from saved changes, and receive a safe explanation when stored criteria are stale or inaccessible.

## Proposed preview scope

- Create a personal view from the current supported filter state.
- Require a non-empty name; define duplicate handling before implementation.
- List, apply, rename, and delete browser-local views.
- Show the active view and whether current filters differ from it.
- Validate stored data on read and recover without blocking the Feedback page.
- Re-evaluate current data permissions whenever a view is applied.
- Emit content-free events proposed in [synthetic analytics](evidence/usage-analytics.json).

## Out of scope for this increment

- Server persistence, cross-device sync, team/default views, notifications, folders, and public links.
- Saving free-text feedback, result snapshots, or authorization state.
- Promise of full mobile creation parity.

## Draft behavior

### Create

1. User configures supported filters and chooses **Save view**.
2. Dialog requests a name and explains “Saved in this browser only.”
3. On success, the view appears in the picker and becomes active.
4. **Incomplete:** duplicate-name policy and maximum count are undecided.

### Apply and modify

1. Selecting a view replaces supported filters with its validated configuration.
2. The header names the active view and exposes its filter summary.
3. A later filter edit marks the state as changed.
4. **Incomplete:** whether updates are explicit-only or can overwrite in place is undecided.

### Rename and delete

- Rename preserves the stable local identifier and filter configuration.
- Delete requires clear confirmation; undo is preferred but not yet scoped.
- **Incomplete:** retention and recovery behavior are undecided.

### Invalid or restricted criteria

- Ignore no criterion silently.
- Apply valid criteria, identify omitted criteria in plain language, and offer edit/delete recovery.
- Never restore access from stored state; current permissions win.
- **Incomplete:** whether partial application is safer than refusing the whole view requires research.

## Draft data shape

Illustrative only; field names are not an API contract.

```json
{
  "id": "view_local_01",
  "name": "Onboarding friction",
  "schemaVersion": 1,
  "filters": {
    "themes": ["onboarding"],
    "severity": ["high"],
    "dateRange": "last-30-days"
  },
  "createdAt": "2026-07-20T10:00:00Z",
  "updatedAt": "2026-07-20T10:00:00Z"
}
```

Do not store result content, account identifiers, user-entered feedback, access tokens, or permission grants.

## Assumptions to test

1. Repeat triagers receive more value than occasional reviewers (`CI-01` versus `CI-04`).
2. Reopening a configuration is more useful than search history alone.
3. Explicit “update view” behavior is clearer than automatic persistence (`SS-05`).
4. People can recover from stale criteria without losing trust (`CI-03`, `MK-06`).
5. Mobile value is mainly opening and understanding a view, not constructing one (`CI-05`, `AN-07`).
6. Local-only persistence is acceptable while the experience remains visibly preview.

## Open questions

- Which filters are safe and stable enough to serialize?
- Are names unique, case-insensitively unique, or allowed to repeat with metadata?
- Should applying a partly invalid view proceed, pause for review, or depend on severity?
- How should “edited from view” differ from “unsaved filters” in language and visuals?
- Is undo required for delete in preview?
- What event and session definitions make reuse meaningful without collecting sensitive content?
- What evidence would justify server sync? What separate evidence would justify team sharing?
- Who may create, edit, archive, or designate a future team default?
- Should a shareable URL experiment precede shared persisted views, given `MK-03` risks?

## Human decision points

| Decision | Options | Current leaning | Needed evidence |
| --- | --- | --- | --- |
| Duplicate names | Block, allow, or disambiguate | Disambiguate or block | Naming usability test |
| Save changes | Explicit update, auto-update, save-as-only | Explicit update plus save as | `SS-05` follow-up |
| Invalid criteria | Partial apply or fail closed | Explain and partial apply unless permission-sensitive | Recovery study and security review |
| Mobile creation | Full, reduced, or view-only | Open/view with reduced editing | More than one synthetic workflow |
| Persistence gate | Remain local or add account sync | Remain local now | Reliability and reuse evidence |
| Sharing gate | Personal only or team scope | Personal only now | Ownership and governance research |

## Proposed acceptance boundaries

These are a starting point for refinement, not final acceptance criteria.

- Core create/apply/rename/delete operations work with keyboard-only navigation.
- Reloading the same browser restores valid views; clearing site data removes them.
- Corrupt or unsupported stored records do not break Feedback.
- Active and modified state is perceivable without color alone.
- Applying a view cannot broaden current access.
- Telemetry contains event metadata only, with no view name or filter value.

## Measurement and release

Use the proposed measures in the [product brief](brief.md) and event definitions in [usage evidence](evidence/usage-analytics.json). Preview release requires accessibility checks, corrupt-state recovery tests, permission review, visible local-only language, and a documented rollback. The roadmap's `init-saved-views-preview` entry is authoritative for sequencing and decision gates.
