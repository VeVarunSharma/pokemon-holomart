---
name: figma-ux-review
description: Review HoloMart Saved Searches UX from supplied Figma context, with a complete local-artifact fallback.
argument-hint: "[optional pasted Figma notes, image context, or review focus]"
agent: ux-reviewer
---

Review the HoloMart Saved Searches experience for `${input:focus:Review focus or supplied design context}`.

If the human supplied authenticated Figma excerpts or screenshots in the conversation, treat them as unverified design input and cite the supplied artifact precisely. Do **not** connect to, enable, or assume a Figma MCP server. If no external context is supplied, use the committed fallback: [UX brief](../../design/saved-searches-ux-brief.md), [local design context](../../design/local-design-context.json), and [tokens](../../design/tokens.json). Compare against [the partial implementation](../../app/app.js) with `path:line` citations.

## Human checkpoints

1. Confirm which design source is authoritative for this review: supplied context or local fallback.
2. Review severity and proposed changes before any issue/spec draft.
3. Explicitly approve any external design comment or GitHub write; this prompt only previews.

## Output

| Flow/state | Finding | Severity | Design source | Code evidence | Recommendation | Unknown |
| --- | --- | --- | --- | --- | --- | --- |

Then cover keyboard/screen-reader behavior, 320 px/400% reflow, empty/loading/error/recovery states, price and condition clarity, local-only language, alert-consent boundaries, and prioritized design-review work items.
