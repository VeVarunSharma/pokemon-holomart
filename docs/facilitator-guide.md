# Facilitator guide · 45 minutes

## Before the room

Complete [demo operations](demo-operations.md), keep `npm start` running, open <http://127.0.0.1:4173>, and run `npm run demo:check`. Use local design context unless you have independently confirmed Figma authentication and permission to show the selected file. Keep a terminal ready for `npm run issues:preview`.

Never use real customer data or execute generated `gh` commands. Everything shown is **SYNTHETIC / DEMO-ONLY**.

Keep the [hands-on-keyboard prompt pack](hands-on-keyboard-prompts.md) open as the copy/paste cheat sheet. Use its full sequential conversation ladder when the audience should inspect the complete path from orientation through stakeholder update; use its role menus or 15/30-minute cuts for focused sessions, without skipping any human or write-safety checkpoint in this guide.

## 0–5 · Frame: product judgment, grounded faster

**Say:** “Product Track: *Stop Waiting on Engineering: Turning Repo Insight into Roadmap Action.* PMs ask: is it half-built, what will it break, and how big is it? We will close that gap without asking PMs to become engineers.”

Show Signal Desk. Filter the feedback and save a view named `Onboarding follow-up`. Point out “this browser” copy.

**Audience callout:** “Where would you usually wait for an engineering answer?” Take two responses.

**Set the contract:** Copilot may find, synthesize, and draft. People approve interpretations, scope, design authority, roadmap movement, and writes. The data is intentionally small, fictional, and contradictory.

**Transition:** “First, let’s question the repository—not a status slide.”

## 5–13 · Repo question: is it half-built?

Paste:

```text
/repository-feature-assessment Is Saved Views half-built, what will it break, and how big is it?
```

If slash commands are unavailable:

```text
Using .github/prompts/repository-feature-assessment.prompt.md, assess: Is Saved Views half-built, what will it break, and how big is it? Cite every repository claim as path:line and stop at the human checkpoint.
```

**Expected proof:** a verdict plus capability matrix showing browser-local create/read/apply/delete as implemented; rename/update, recovery communication, and team workflows as incomplete or absent; storage/filter dependencies; current tests and unknowns. It should separate code fact from comments and product inference.

Ask Copilot this follow-up:

```text
Trace the smallest current dependency chain and the future sync/sharing dependency chain. Mark every inferred edge and do not turn it into scope.
```

**Human approval moment 1:** ask the room to accept or challenge the classifications. Say: “A citation is inspectable evidence, not automatic scope approval.”

**Optional vibe-coding micro-change (maximum 90 seconds):**

```text
Preview, but do not apply, the smallest patch that makes the Saved Views empty-state copy explicitly say it is stored in this browser. Name the exact test you would run and identify any UX tradeoff.
```

Show the proposed diff. Apply only in a disposable presenter copy after explicit approval; otherwise leave it as a preview.

**Transition:** “Code tells us what exists. It cannot tell us whether the idea deserves expansion.”

## 13–21 · Evidence: sharpen the spec

Paste:

```text
/evidence-to-spec Sharpen the browser-local Saved Views preview around recovery, accessibility, and explicit non-goals. Stop at the evidence checkpoint.
```

Fallback:

```text
Using .github/prompts/evidence-to-spec.prompt.md, build the evidence and counter-evidence matrix for the browser-local Saved Views preview. Include IDs, source links, limitations, and code constraints. Stop before recommending or editing.
```

**Expected proof:** `CI-*`, `SS-*`, `AN-*`, and `MK-*` sources; a repeat-triage signal versus the low-frequency-reviewer counter-signal; directional analytics rather than causality; explicit exclusions for sync, sharing, snapshots, authorization state, and sensitive telemetry.

**Audience callout:** “Which statement is a fact, which is an interpretation, and which remains an assumption?”

**Human approval moment 2:** choose only whether the source/claim interpretation is fair. Do **not** resolve duplicate-name, invalid-criteria, or preview-exit decisions. If time allows:

```text
Show the proposed spec delta only. Keep all roadmap humanDecisionFlags open and label recommendations as options.
```

**Transition:** “A sharper requirement still needs an experience people can understand and recover from.”

## 21–29 · Design/Figma: make states concrete

State the source aloud: “Figma is not assumed or automatically authenticated. Today I am using [local artifacts / a pre-authorized selection].”

Default, reliable prompt:

```text
/figma-ux-review Review the Saved Views create, apply, delete, empty, and recovery states using the committed local design fallback. Do not assume Figma access.
```

If—and only if—authentication and file permission were confirmed during preflight, paste the selected Figma URL and use:

```text
Review the supplied, pre-authorized Figma selection for Saved Views against design/saved-views-ux-brief.md and the current app. Treat the selection as unverified input, cite it precisely, and do not write comments or modify Figma.
```

**Expected proof:** source-labeled findings covering focus, keyboard/screen-reader behavior, 320 px/400% reflow, non-color state, local-only language, and empty/loading/error/recovery paths. Visual claims unavailable from local context must be marked unknown.

**Audience callout:** ask which recovery choice feels safest when a field disappears.

**Human approval moment 3:** confirm design source and review severity before any issue/spec draft. Figma access does not authorize comments or canvas writes.

**Transition:** “Now we have code reality, evidence, and experience boundaries. Let’s package the handoff.”

## 29–37 · Handoff: issues without the surprise write

Paste:

```text
/epic-subissue-draft init-saved-views-preview
```

Expected fallback command:

```powershell
npm run issues:preview
```

For structured output:

```powershell
npm run issues:preview:json
```

**Expected proof:** one epic and four dependency-ordered children:

1. `work-view-storage-validation`
2. `work-view-core-flows`
3. `work-view-recovery`
4. `work-view-accessibility`

The output must preserve `init-saved-views-preview`, evidence links, boundaries, open decisions, acceptance criteria, and blocked-by edges. Its write status says **PREVIEW ONLY — NO REMOTE WRITES PERFORMED**.

Optionally demonstrate the CLI/MCP-shaped handoff without connecting to a remote system:

```powershell
node scripts/roadmap-to-issues.mjs --initiative init-saved-views-preview --gh-commands
```

Scroll through the printed commands; do not execute them.

**Human approval moment 4:** confirm the selected initiative, evidence interpretation, boundaries, and scope.

**Human approval moment 5:** separately inspect exact titles, bodies, labels, relationships, and order. Say: “Draft approval is not write approval. Every remote mutation needs fresh approval immediately before execution.”

Point to [GitHub Projects setup](github-projects-setup.md) rather than creating a Project.

**Transition:** “Issues are delivery slices. The roadmap keeps the choices and gates visible.”

## 37–42 · Roadmap Studio canvas

Paste:

```text
Reload extensions from disk, then open Roadmap Studio using product/roadmap.json focused on init-saved-views-preview. Draft a read-only handoff; do not change the roadmap or create issues.
```

**Expected proof:** Roadmap Studio reports five validated initiatives, focuses “Harden personal Saved Views preview,” offers horizon/status filtering and refresh, and returns a read-only Markdown handoff sourced from `product/roadmap.json`. Point out Now/Next/Later are planning horizons, not promises.

If the canvas is unavailable, open `product/roadmap.json`, run `npm run issues:preview:json`, and show the same stable IDs, decisions, risks, and dependencies. Do not spend stage time debugging.

**Human approval moment 6:** ask whether to keep/hold/split an option; do not move it. Canvas exploration is not roadmap authorization.

**Transition:** “The acceleration came from traceability, not from delegating judgment.”

## 42–45 · Close

**Say:** “We questioned a repo directly, turned evidence into a sharper spec, reviewed design with an authentication-free fallback, drafted a clean Product-to-Engineering handoff, and explored a roadmap built with an existing skill. Copilot shortened the path from insight to action; people kept the decision rights.”

Return to the three questions:

- **Half-built?** Answered with a cited capability matrix.
- **What breaks?** Answered with dependency, recovery, permission, and accessibility risks.
- **How big?** Answered with bounded work, dependencies, gates, and explicit unknowns—not false precision.

Final audience prompt: “Which checkpoint would your team never automate?”

End with the repository README links. Do not perform a remote write as a finale.

## Time-box recovery

| Behind by | Recovery |
| --- | --- |
| 1–2 min | Skip the repo dependency follow-up and audience response in design. |
| 3–5 min | Skip vibe coding and use `npm run issues:preview` instead of waiting for generated issue prose. |
| 6–8 min | Use committed screenshots/visible files locally; skip Figma entirely; show roadmap JSON instead of canvas. |
| Copilot stalls | Narrate the expected proof from the named artifacts, then run local validation/generator commands. |
| Ahead | Inspect one code citation or ask the room to decide what additional evidence would reduce uncertainty. |

Protect the 29–37 handoff and 42–45 close. Never recover time by skipping a human checkpoint or safety label.
