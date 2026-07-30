# Saved Views UX/design brief

> **Synthetic local design artifact.** This brief supports the Signal Desk demo and is safe to commit. It is not customer research, a production-ready design, or a substitute for accessibility/security review.

Product context: [brief](../product/brief.md) · [incomplete spec](../product/saved-views-spec.md) · [decision record](../product/decisions/0001-saved-views-local-preview.md) · [synthetic evidence](../product/evidence/README.md)

## Experience principles

- Keep filters inspectable: a named view must not hide why results appear.
- Make persistence boundaries visible: “this browser only” belongs at creation and management points.
- Separate applying, editing, and overwriting.
- Recover in context; malformed local state must not block Feedback.
- Treat permissions as live constraints, never saved properties.

## Primary flows

### Create from current filters

1. User configures Feedback filters.
2. **Save view** opens a focused dialog with name, filter summary, and local-only note.
3. Validation is inline and announced.
4. Success closes the dialog, selects the new view, and announces “View saved in this browser.”

### Open and understand

1. View picker lists personal local views with name and optional last-updated metadata.
2. Selection applies validated criteria.
3. Page shows active view name, filter chips/summary, and result loading.
4. If current filters change, show “Edited” and explicit **Update view** / **Save as new** actions.

### Manage

- Rename is available from the view menu and preserves the stable identifier.
- Delete uses a confirmation that names the view and explains impact; explore undo.
- Invalid views remain manageable rather than disappearing silently.

### Recover

- If some criteria are unavailable, show what was omitted and why, without exposing restricted values.
- Offer **Review filters**, **Update view**, and **Delete view** as appropriate.
- If local storage cannot be parsed, isolate bad records, load Feedback without them, and explain recovery.

## Responsive behavior

- **Wide (≥1024 px):** picker and active-state controls may sit in the filter toolbar; management menu stays adjacent.
- **Medium (600–1023 px):** allow toolbar wrapping; keep active view and edited state together.
- **Narrow (<600 px):** prioritize open/apply, active summary, and recovery. Use a bottom sheet or full-screen dialog for the picker. Complex creation/editing may be reduced, pending research (`CI-05`, `AN-07`).
- No horizontal scrolling for primary actions at 320 CSS px. Result density may reduce before controls become icon-only.
- Zoom/reflow at 400% must preserve order, labels, and access to actions.

## Loading, empty, and error states

| State | Required behavior |
| --- | --- |
| Loading local views | Avoid a long skeleton for synchronous reads; if delayed, label status and keep filters usable. |
| No views | Explain value and local persistence; **Save current filters** only when supported filters exist. |
| No results after apply | Preserve active view and filters; distinguish “zero matches” from load failure. |
| Empty filter set | Decide whether “all feedback” is savable; do not create accidentally. |
| Storage unavailable | Keep filtering functional, disable persistence, explain browser limitation without blame. |
| Corrupt/old schema | Quarantine invalid record, describe recovery, and avoid raw data/error codes. |
| Permission/field change | Re-check current access, identify omitted criteria safely, never broaden results. |
| Result fetch error | Keep view context, offer retry, and avoid implying the view itself is corrupt. |

## Keyboard behavior

- Use native button, dialog, menu/listbox, input, and form semantics where possible.
- Tab order follows visual/task order; opening a dialog moves focus to its heading or first field.
- `Escape` closes a dismissible surface without saving and returns focus to the invoker.
- Arrow-key behavior follows the chosen ARIA pattern; do not invent a hybrid picker/menu.
- `Enter` applies the highlighted view only when consistent with that pattern.
- Destructive actions are not triggered by a single ambiguous shortcut.
- After rename/delete, move focus predictably to the renamed item, next item, or picker trigger.
- Do not require drag, hover, or pointer precision.

## Accessibility

- Target WCAG 2.2 AA; validate with automated checks and manual keyboard/screen-reader testing.
- Provide programmatic names for view, menu, edited state, and result count.
- Announce save/apply/recovery outcomes in a non-disruptive live region.
- Convey active, changed, invalid, loading, and error states with text/semantics, not color alone.
- Maintain at least 4.5:1 text contrast and 3:1 meaningful UI/component contrast using [tokens](tokens.json).
- Touch targets should be at least 24×24 CSS px, with 44×44 preferred for primary narrow-screen actions.
- Respect reduced motion; no motion is required to understand state.
- Filter summaries must be understandable when read linearly.

## Permissions and future team-sharing concept

Current local views are personal shortcuts, not permission objects. A future model might distinguish **owner**, **editor**, and **viewer**, plus an administrator-curated **workspace default**. This is a research concept only.

- Applying any view intersects criteria with the viewer's current data access.
- Shared definitions must avoid revealing restricted filter values, source names, counts, or existence.
- Role changes, deleted fields, ownership transfer, archive/delete, audit history, and default-view governance need explicit semantics.
- “Share” and “make default” should be different permissions.
- Private scratch views remain private unless the owner intentionally changes visibility.

## Research questions

1. Can frequent triagers create and reopen a view without explanation?
2. Do users distinguish active saved state from filters edited after opening?
3. Which recovery model builds trust when criteria are stale: partial apply or stop-and-review?
4. Is duplicate-name prevention clearer than metadata-based disambiguation?
5. What does an occasional reviewer expect from search history versus Saved Views?
6. On narrow screens, is applying and understanding sufficient?
7. Who should own, update, archive, and designate future shared/default views?
8. Can permission omissions be explained without leaking restricted context?

## Design handoff and fallback

No external design system or Figma file is required. Use [local design context](local-design-context.json) and [design tokens](tokens.json) as the authentication-independent source for the demo. They intentionally define structure and behavior without pretending to be final visual comps.
