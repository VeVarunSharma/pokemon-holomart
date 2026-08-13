---
name: ui-change-preview
description: Preview one small HoloMart UI change and its validation before any file edit.
argument-hint: "[small UI change to preview]"
---

Preview `${input:change:Small UI change to preview}` against [the current UI](../../app/app.js), [styles](../../app/styles.css), [Saved Searches tests](../../test/unit/saved-searches.test.js), [UX brief](../../design/saved-searches-ux-brief.md), [local design context](../../design/local-design-context.json), and [tokens](../../design/tokens.json).

## Evidence rules

- Use committed local context; do not assume or connect to Figma.
- Cite current behavior as `path:line` and mark unavailable visual/runtime claims unknown.
- Keep the proposal to the smallest reversible change. Include keyboard, focus, screen-reader, reflow, state, copy, and regression implications that actually apply.
- Do not invent exact effort, modify dependencies, or broaden scope.

## Output

1. Current behavior and user problem.
2. Proposed files and minimal unified-diff preview.
3. UX/accessibility tradeoff and blast radius.
4. Exact targeted validation command, expected result, and manual check.
5. Assumptions, unknowns, and rollback approach.

## Stop point

Stop before editing any file. Require explicit human approval of the exact diff. After approval, apply only that diff, run the named validation, report results, and stop again; never commit, push, open a pull request, or write remotely.
