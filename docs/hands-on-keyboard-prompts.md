# Hands-on-keyboard prompt pack

> **Presenter quick use:** Open the Signal Desk app at <http://127.0.0.1:4173>, this page, `product/roadmap.json`, and a terminal at the repository root. Paste the ladder prompts into **one Copilot session** so context accumulates. After every **Human checkpoint**, stop scrolling, inspect the cited proof or diff, and ask a person to accept, challenge, revise, or defer it. Copilot drafts; people decide. Signal Desk and **all customers, quotes, metrics, dates, designs, and plans are SYNTHETIC / DEMO-ONLY**.

This is the copy/paste companion to the exact [45-minute facilitator flow](facilitator-guide.md). It covers product discovery, design, roadmap, GitHub issue/project planning, and one deliberately small live-code preview. Use plain-language prompts reliably; a `/prompt-name` may be convenient when the client surfaces repository prompt files, but it is never required.

## Open and preflight

From PowerShell at the repository root:

```powershell
node --version
npm run demo:check
npm start
```

Keep that server running. In a second terminal, these local commands are safe:

```powershell
npm run issues:preview
npm run issues:preview:json
```

Open:

1. <http://127.0.0.1:4173>
2. `docs/hands-on-keyboard-prompts.md`
3. `product/roadmap.json`
4. Optional local design proof: `design/local-design-context.json` and `design/saved-views-ux-brief.md`

Do not paste real customer information, credentials, private designs, or MCP configuration. Do not run generated `gh` commands. Do not use destructive `git reset`, `git clean`, or `git checkout` commands. If stage state becomes uncertain, keep the repository unchanged and continue from committed artifacts.

### One-session contract

Paste once before the ladder:

```text
We are running the Signal Desk hands-on demo in one session. Everything in this repository is SYNTHETIC / DEMO-ONLY. Ground repository claims in path:line citations; label product evidence with stable IDs, provenance, limitations, and counter-signals. Separate fact, interpretation, recommendation, assumption, and unknown. Preserve every open humanDecisionFlag. Preview before editing, never write to Figma or GitHub, and pause whenever a prompt says Human checkpoint. Keep a short running context ledger of accepted facts, challenged claims, deferred decisions, and unapproved proposals.
```

## Ladder index

| Stage | Suggested time | Result | Reusable prompt file |
| --- | ---: | --- | --- |
| 1. Orient | 1 min | product/repository map | plain-language prompt |
| 2. Assess completeness | 4 min | implemented/partial/missing matrix | `repository-feature-assessment.prompt.md` |
| 3. Assess blast radius | 3 min | current/future dependency and effort bands | same assessment file |
| 4. Synthesize evidence | 5 min | evidence/counter-signal matrix | `evidence-to-spec.prompt.md` |
| 5. Draft decision brief | 4 min | options, spec delta, open questions/non-goals | `product-decision-brief.prompt.md` |
| 6. Review UX | 5 min | heuristic/accessibility/state findings | `figma-ux-review.prompt.md` |
| 7. Optional Figma branch | 2 min | read-only comparison or clean skip | same UX file |
| 8. Preview tiny code change | 4 min | exact diff and targeted validation | `ui-change-preview.prompt.md` |
| 9. Preview issues | 5 min | epic and dependency-ordered children | `epic-subissue-draft.prompt.md` |
| 10. Compare roadmap scenarios | 4 min | keep/hold/split options and decision flags | `roadmap-scenario-review.prompt.md` |
| 11. Open Roadmap Studio | 3 min | focused read-only handoff | plain-language prompt |
| 12. Draft program update | 3 min | evidence, decisions, risks, asks, next steps | `stakeholder-program-update.prompt.md` |

## Canonical conversation ladder

### 1 · 60-second repository/product orientation

| Field | Presenter cue |
| --- | --- |
| Recommended timing | 1 minute |
| Presenter action | Show Signal Desk, then paste. Ask Copilot to orient, not assess or recommend. |
| Expected proof/artifacts | A concise map citing `product/brief.md`, `app/app.js`, `src/features/saved-views/`, `test/saved-views.test.js`, `design/`, `product/evidence/`, and `product/roadmap.json`; synthetic label and current browser-local boundary. |
| Human checkpoint | Ask whether the framing and source hierarchy are correct. Do not accept a feature verdict yet. |

**Exact prompt**

```text
In 60 seconds, orient this room to Signal Desk and the Saved Views product question. Using product/brief.md as product context, app/app.js plus src/features/saved-views/ and test/saved-views.test.js as implementation proof, design/ as local design context, product/evidence/ as SYNTHETIC / DEMO-ONLY signals, and product/roadmap.json as the authoritative plan, give: product/user/problem in three bullets, a repository map, what is authoritative for each kind of claim, and the safety boundaries. Cite repository claims as path:line. Do not assess completeness, size work, recommend scope, or edit anything. End at Human checkpoint: “Is this the right product and source framing?”
```

**One good follow-up**

```text
Compress that into a 20-second spoken orientation while preserving the browser-local boundary and synthetic-data warning.
```

**Failure/recovery prompt**

```text
Reset the orientation. Use only product/brief.md, app/app.js, src/features/saved-views/, test/saved-views.test.js, design/, product/evidence/, and product/roadmap.json. Return no uncited implementation claim and no recommendation. Mark anything not verified as unknown.
```

### 2 · Feature completeness: “is Saved Views half-built?”

| Field | Presenter cue |
| --- | --- |
| Recommended timing | 4 minutes |
| Presenter action | Paste, then open one cited implementation line and one TODO test. |
| Expected proof/artifacts | Verdict plus capability matrix: browser-local create/read/apply/delete versus absent/partial rename, update semantics, recovery communication, sync, sharing, permission model, and telemetry; code and test citations. |
| Human checkpoint | Room accepts/challenges each implemented/partial/absent/unknown classification. A TODO is not implementation. |

**Exact prompt**

```text
Using .github/prompts/repository-feature-assessment.prompt.md, answer: “Is Saved Views half-built?” Verify product/saved-views-spec.md against app/app.js, src/features/saved-views/storage.js, src/features/saved-views/implementation-notes.js, src/features/saved-views/dependency-map.js, and test/saved-views.test.js. Produce the required verdict, capability matrix, tests/gaps, and human decisions. Every implementation claim needs path:line proof; comments and TODO tests are leads, not proof. Do not propose roadmap or issue changes. Stop at the repository-interpretation Human checkpoint.
```

If repository prompt commands are available, the equivalent convenience invocation is `/repository-feature-assessment Is Saved Views half-built?`; the plain-language prompt above remains the fallback.

**One good follow-up**

```text
For the three most consequential “partial” or “absent” rows, show the exact evidence that prevents an “implemented” classification and identify what a human should verify next.
```

**Failure/recovery prompt**

```text
Your verdict is not inspectable. Rebuild it as a table with capability, implemented/partial/absent/unknown, path:line code evidence, test evidence, confidence, and disputed point. Remove any row supported only by comments, specs, or test.todo.
```

### 3 · Blast radius, dependencies, and effort without false precision

| Field | Presenter cue |
| --- | --- |
| Recommended timing | 3 minutes |
| Presenter action | Continue in the same session so the capability matrix remains context. |
| Expected proof/artifacts | Current dependency chain across filters, URL sharing, local storage, UI, and tests; separately labeled future sync/sharing chain; qualitative effort bands, unknowns, gates, and validation work. |
| Human checkpoint | Engineering partner challenges inferred edges and effort band. No points, person-days, or delivery date is approved. |

**Exact prompt**

```text
From the accepted completeness matrix, trace blast radius for hardening browser-local Saved Views. Verify the current chain through app/app.js, src/features/saved-views/storage.js, src/features/filters/filter-state.js, src/features/share/share-state.js, and relevant tests. Separately show a hypothetical future account-sync/team-sharing chain, marking every inferred or external dependency. For each work area give only repository-supported qualitative effort (small/medium/large/unknown), confidence, drivers, excluded scope, tests needed, and what evidence would narrow uncertainty. Do not invent points, person-days, staffing, dates, or precision. Stop before converting any finding into scope.
```

**One good follow-up**

```text
Which two unknowns could change the effort band most, and what is the cheapest reversible investigation for each?
```

**Failure/recovery prompt**

```text
Remove unsupported estimates. Replace every number or date with a qualitative band or unknown, cite the driver, separate current dependencies from hypothetical sync/sharing dependencies, and flag inferred edges explicitly.
```

### 4 · Customer, market, and analytics evidence with counter-signals

| Field | Presenter cue |
| --- | --- |
| Recommended timing | 5 minutes |
| Presenter action | Paste, then inspect one `CI-*`, one `AN-*`, and one counter-signal such as `CI-04`. |
| Expected proof/artifacts | Source/claim matrix with `CI-*`, `SS-*`, `AN-*`, `MK-*`, links, provenance, limitations, counter-signals, and directional-not-causal analytics. |
| Human checkpoint | People confirm whether source-to-claim interpretations are fair; no product decision is made. |

**Exact prompt**

```text
Using .github/prompts/evidence-to-spec.prompt.md, synthesize the SYNTHETIC / DEMO-ONLY evidence for hardening the browser-local Saved Views preview. Read product/evidence/README.md, customer-support-signals.md, usage-analytics.json, and market-notes.md. Build an evidence and counter-evidence matrix with stable ID, source path, claim supported, claim not supported, provenance limitation, confidence, and counter-signal. Include repeat-triage demand, the low-frequency-reviewer counter-signal, stale/restricted criteria, duplicate/overwrite concerns, and market-pattern limitations. Treat analytics as directional, not causal. Stop at the evidence Human checkpoint before recommendations or edits.
```

Convenience invocation, if surfaced: `/evidence-to-spec browser-local Saved Views preview`; fallback: the full prompt above.

**One good follow-up**

```text
Show the weakest evidence-backed claim and rewrite it so its strength, sample limitation, and counter-signal are impossible to miss.
```

**Failure/recovery prompt**

```text
Rebuild the synthesis with no orphan claims. Every row must include a stable CI/SS/AN/MK ID, repository path, SYNTHETIC / DEMO-ONLY label, limitation, counter-signal or “none found,” and a statement of what the source cannot prove.
```

### 5 · Product decision brief and spec delta

| Field | Presenter cue |
| --- | --- |
| Recommended timing | 4 minutes |
| Presenter action | Use only after the room has reviewed the evidence interpretation. |
| Expected proof/artifacts | Decision, target user/outcome, options/tradeoffs, recommendation labeled as such, proposed scope/non-goals, edge cases, measures, and open `decision-*` flags. |
| Human checkpoint | Accept, revise, or defer recommendations and each open question; do not resolve roadmap flags or edit the spec. |

**Exact prompt**

```text
Using .github/prompts/product-decision-brief.prompt.md, draft a decision brief and spec delta for hardening init-saved-views-preview as a browser-local preview. Preserve decision-duplicate-names, decision-invalid-criteria, and decision-preview-exit as open. Make sync, team sharing, result snapshots, saved authorization state, notifications, and sensitive telemetry explicit non-goals. Include counter-signals, reversible options, acceptance boundaries, risks, and the evidence needed next. Cite product evidence by ID/path and implementation constraints as path:line. Preview only; do not edit product/saved-views-spec.md or product/roadmap.json. Stop at the decision Human checkpoint.
```

Convenience invocation, if surfaced: `/product-decision-brief init-saved-views-preview`; fallback: the full prompt above.

**One good follow-up**

```text
Turn the recommendation into three options—keep local and harden, hold for evidence, stop investing—with tradeoffs and a reversible next step for each. Do not choose for us.
```

**Failure/recovery prompt**

```text
Restore decision ownership. Reopen every decision-* flag, move unsupported statements to assumptions/unknowns, add an explicit non-goals section, and label the recommendation as a reviewable option rather than an approved decision.
```

### 6 · Local-first UI/UX, accessibility, and state review

| Field | Presenter cue |
| --- | --- |
| Recommended timing | 5 minutes |
| Presenter action | State aloud: “Local committed context is authoritative for this review; no Figma access is assumed.” |
| Expected proof/artifacts | Source-labeled matrix for create/apply/delete/empty/recovery; focus, keyboard/screen-reader, 320 px/400% reflow, non-color state, local-only language, loading/error/permission states; unverifiable visual claims marked unknown. |
| Human checkpoint | Confirm source authority and finding severity before any spec/issue draft. |

**Exact prompt**

```text
Using .github/prompts/figma-ux-review.prompt.md, review Saved Views using only design/saved-views-ux-brief.md, design/local-design-context.json, design/tokens.json, app/index.html, app/app.js, and app/styles.css. Cover create, apply, delete, empty, loading, storage failure, corrupt/old schema, stale/restricted criteria, no-results, and recovery states. Check focus return, keyboard/screen-reader semantics, status announcements, text/non-color state, 320 CSS px, 400% reflow, target size, contrast intent, reduced motion, and “this browser” language. Cite code as path:line; mark visual/runtime claims unavailable from local context unknown. Do not assume Figma or edit files. Stop at the design-source/severity Human checkpoint.
```

Convenience invocation, if surfaced: `/figma-ux-review committed local fallback`; fallback: the full prompt above.

**One good follow-up**

```text
Rank only the findings verified from committed artifacts by user harm, reversibility, and dependency; keep unknown visual claims out of the ranking.
```

**Failure/recovery prompt**

```text
Remove unsupported visual judgments. For every finding, name the local source and code citation, or mark it unknown with the exact runtime, viewport, assistive-technology, or design evidence needed to verify it.
```

### 7 · Optional Figma MCP read-only branch

| Field | Presenter cue |
| --- | --- |
| Recommended timing | 2 minutes; otherwise skip cleanly |
| Presenter action | First confirm authentication, permission to display the selected file/selection, and that read-only retrieval is appropriate. Never configure MCP on stage. |
| Expected proof/artifacts | A source-labeled comparison of the supplied, pre-authorized selection with local brief/current UI; no comments, edits, exports, or hidden-file exploration. |
| Human checkpoint | A person confirms source, selection, and read-only boundary before retrieval; confirms findings afterward. |

**Exact prompt — use only after confirmation**

```text
Authentication and permission to display this specific Figma selection have been confirmed by the presenter. Read only the supplied selection/URL: [PASTE PRE-AUTHORIZED FIGMA SELECTION OR URL]. Compare only that selection with design/saved-views-ux-brief.md and the current Saved Views implementation. Identify the Figma node/frame source for each claim, distinguish observed design detail from inference, and mark anything outside the selection unknown. Do not modify Figma, post comments, inspect unrelated files, export assets, configure MCP, or write anywhere. Stop at the read-only design-review Human checkpoint.
```

**One good follow-up**

```text
Show only differences between the pre-authorized Figma selection and committed local context; label which source the presenter has declared authoritative and leave conflicts for human resolution.
```

**Failure/recovery prompt**

```text
Figma is unavailable or permission is unclear. Stop external retrieval now. Continue the review only from design/saved-views-ux-brief.md, design/local-design-context.json, design/tokens.json, app/index.html, app/app.js, and app/styles.css. Mark unavailable visual detail unknown; do not troubleshoot MCP on stage.
```

### 8 · Safe live code-change preview, then approved apply/test

| Field | Presenter cue |
| --- | --- |
| Recommended timing | 4 minutes maximum |
| Presenter action | Ask the room for a tiny change; default to empty-state local-persistence copy. Paste preview prompt. Show exact diff. Apply only after a clear human “approve this diff.” |
| Expected proof/artifacts | One small diff preview, impacted state/accessibility tradeoff, exact `npm run test:saved-views` command and manual app check; after approval, applied diff plus test output. |
| Human checkpoint | First approve/reject the exact diff. After apply/test, inspect results. Approval never implies commit, push, PR, or remote write. |

**Exact preview prompt**

```text
Using .github/prompts/ui-change-preview.prompt.md, preview—but do not apply—the smallest reversible patch that changes the Saved Views empty-state copy to state clearly that views are stored in this browser. Ground current behavior in app/app.js and relevant markup/styles/tests; include the exact unified diff, UX/accessibility tradeoff, blast radius, exact targeted test command, and one manual check at http://127.0.0.1:4173. Do not edit files, add dependencies, broaden scope, commit, or write remotely. Stop for explicit approval of the exact diff.
```

Convenience invocation, if surfaced: `/ui-change-preview clarify browser-local Saved Views empty-state copy`; fallback: the full prompt above.

**Only after explicit human approval, paste**

```text
The human approved exactly the previously previewed diff. Re-check that the working tree and cited lines still match the preview; if they do not, stop and show the difference. Otherwise apply only that diff, run npm run test:saved-views, report the exact result, and describe the manual check at http://127.0.0.1:4173. Do not make any additional change, commit, push, open a pull request, or write remotely. Stop at the post-test Human checkpoint.
```

**One good follow-up**

```text
Compare the applied diff with the approved preview and list any difference. If none, say “matches approved preview”; do not suggest extra cleanup.
```

**Failure/recovery prompt**

```text
Stop editing. Show the current diff for the approved file, compare it with the approved preview, and identify any mismatch. Do not reset, clean, checkout, or overwrite anything. If no change was approved, leave the working tree untouched and continue with the committed app as the demo proof.
```

### 9 · Epic and dependency-ordered child issue preview

| Field | Presenter cue |
| --- | --- |
| Recommended timing | 5 minutes |
| Presenter action | Paste the prompt or run the deterministic local preview. Scroll titles, bodies, labels, stable IDs, acceptance criteria, and blocked-by edges. |
| Expected proof/artifacts | Epic `init-saved-views-preview`; children ordered `work-view-storage-validation`, `work-view-core-flows`, `work-view-recovery`, `work-view-accessibility`; explicit preview-only status. |
| Human checkpoint | Scope/evidence approval and exact issue-preview approval are separate. Neither is remote-write approval. |

**Exact prompt**

```text
Using .github/prompts/epic-subissue-draft.prompt.md, preview the epic and dependency-ordered child issues for init-saved-views-preview from product/roadmap.json. Preserve evidence links, non-goals, open decisions, acceptance criteria, validation, labels, stable IDs, parent/child relationships, and blocked-by edges. Show exact proposed titles and bodies. Do not create or update an issue, Project, milestone, label, or relationship. End with “PREVIEW ONLY — NO REMOTE WRITES PERFORMED” and stop at the exact-issue-preview Human checkpoint.
```

Convenience invocation, if surfaced: `/epic-subissue-draft init-saved-views-preview`; fallback: the full prompt above. Deterministic fallback:

```powershell
npm run issues:preview
npm run issues:preview:json
```

To show commands without executing them:

```powershell
node scripts/roadmap-to-issues.mjs --initiative init-saved-views-preview --gh-commands
```

**One good follow-up**

```text
Audit the preview for stable-ID loss, missing non-goals, unresolved decision flags, dependency-order mistakes, or acceptance criteria that are not testable. Propose corrections only; do not write.
```

**Failure/recovery prompt**

```text
Cancel any remote-write plan. Return to product/roadmap.json and produce preview text only. State whether any write occurred; if none, say so. Preserve init-saved-views-preview and all work-* IDs, then stop. Do not invoke gh or any GitHub write tool.
```

### 10 · Roadmap prioritization and scenario comparison

| Field | Presenter cue |
| --- | --- |
| Recommended timing | 4 minutes |
| Presenter action | Compare the Now preview with one gated Next option; keep choices visible. |
| Expected proof/artifacts | Baseline plus keep/hold/split/advance/stop scenarios; evidence and counter-signals, dependencies, opportunity cost, qualitative effort/confidence, and open decision flags. |
| Human checkpoint | Room selects a discussion direction or asks for evidence; no horizon/status/file/Project change occurs. |

**Exact prompt**

```text
Using .github/prompts/roadmap-scenario-review.prompt.md, compare three scenarios: (A) keep init-saved-views-preview focused on local reliability/accessibility, (B) split init-filter-provenance into a separately sequenced discovery track, and (C) hold init-personal-view-sync until decision-sync-gate and decision-sync-retention have evidence and owners. Include supporting evidence, counter-signals, dependencies, opportunity cost, reversibility, risks, qualitative effort/confidence, and evidence needed next. Keep Now/Next/Later as non-commitment horizons and every humanDecisionFlag open. Preview deltas only; do not edit product/roadmap.json or GitHub Projects. Stop for human scenario review.
```

Convenience invocation, if surfaced: `/roadmap-scenario-review Saved Views local hardening versus provenance and account sync`; fallback: the full prompt above.

**One good follow-up**

```text
Stress-test scenario A against CI-04 and scenario C against SS-01. What evidence would falsify each recommendation?
```

**Failure/recovery prompt**

```text
Undo the apparent decision in the narrative, not in any file. Restore all decision-* statuses from product/roadmap.json, relabel changes as options, remove invented dates/points, and show a side-by-side scenario comparison ending in open questions.
```

### 11 · Roadmap Studio focus and read-only handoff

| Field | Presenter cue |
| --- | --- |
| Recommended timing | 3 minutes |
| Presenter action | Ask Copilot to reload extensions and open the canvas. If unavailable, immediately use the JSON/local preview fallback. |
| Expected proof/artifacts | Five validated initiatives, focus on `init-saved-views-preview`, filters, stable IDs, risks/dependencies/decisions, and read-only Product-to-Engineering Markdown handoff. |
| Human checkpoint | Ask keep/hold/split as a discussion only. Canvas exploration does not authorize roadmap or GitHub changes. |

**Exact prompt**

```text
Reload extensions from disk, then open Roadmap Studio using product/roadmap.json focused on init-saved-views-preview. Validate and display the initiative, work items, evidence, dependencies, risks, and open human decision flags. Draft a read-only Product-to-Engineering handoff that preserves stable IDs and makes Now/Next/Later non-commitment horizons. Do not change the roadmap, resolve a decision, create issues, or update a GitHub Project. Stop at the read-only handoff Human checkpoint.
```

**One good follow-up**

```text
Focus the handoff on work-view-storage-validation and its downstream blocked-by edges; show what is verified, inferred, and still awaiting product/design/engineering judgment.
```

**Failure/recovery prompt**

```text
Roadmap Studio is unavailable. Do not debug or reinstall it on stage. Read product/roadmap.json directly and use npm run issues:preview:json as the local structured fallback. Produce the same read-only handoff with stable IDs, risks, dependencies, and open decisions; do not write.
```

### 12 · Program/stakeholder update

| Field | Presenter cue |
| --- | --- |
| Recommended timing | 3 minutes |
| Presenter action | Ask for a draft based only on reviewed context; read the short spoken version. |
| Expected proof/artifacts | Synthetic-labeled headline, evidence and counter-signals, accepted/deferred decisions, status by stable ID, risks, asks, role owners, and next steps; no false claim that work or writes occurred. |
| Human checkpoint | Fact-check status, audience, tone, asks, and decision ownership before sending anywhere. |

**Exact prompt**

```text
Using .github/prompts/stakeholder-program-update.prompt.md, draft a SYNTHETIC / DEMO-ONLY update for product, design, engineering, and program stakeholders based on this session. Summarize: evidence reviewed and counter-signals; accepted, challenged, and deferred interpretations; decisions made versus decision-* flags still open; status of init-saved-views-preview and its work-* dependencies; UX/accessibility and delivery risks; explicit asks with role owners; and next steps. State accurately whether a code patch was only previewed or approved/tested, and that no GitHub/Figma remote writes occurred. Provide a 30-second spoken version and a concise written version. Stop for human fact-check; do not send or publish.
```

Convenience invocation, if surfaced: `/stakeholder-program-update cross-functional demo readout`; fallback: the full prompt above.

**One good follow-up**

```text
Rewrite the written version for an executive reader without dropping counter-signals, open decisions, explicit asks, or the no-remote-write status.
```

**Failure/recovery prompt**

```text
Reconcile the update with the session context ledger and product/roadmap.json. Remove any unverified completion, approval, date, commitment, issue, Project, code-change, or Figma claim. Separate facts, proposals, open decisions, asks, and next steps.
```

## Focused prompt menus

Each prompt is standalone. Paste the full text; the named prompt file is optional convenience, not required command support.

### PM · product discovery and strategy

**Opportunity frame from the repo**

```text
Using product/brief.md, product/saved-views-spec.md, product/evidence/README.md, and verified app/src/test evidence, frame the opportunity for frequent feedback triagers. Separate user problem, current workaround, code reality, evidence, counter-signal, assumption, and unknown. Label all signals SYNTHETIC / DEMO-ONLY and cite stable IDs/paths. Do not recommend scope; stop for human problem-framing review.
```

**Decision brief**

```text
Using .github/prompts/product-decision-brief.prompt.md, compare keep/hold/stop options for init-saved-views-preview. Preserve decision-duplicate-names, decision-invalid-criteria, and decision-preview-exit as open. Preview only; stop before editing the spec or roadmap.
```

**Evidence gap plan**

```text
For decision-preview-exit in product/roadmap.json, map current CI/SS/AN/MK evidence, counter-signals, and limitations. Propose the smallest reversible research or instrumentation checks that would reduce uncertainty without collecting free text, customer content, filter values, or names. Do not define an automatic ship threshold.
```

**Adjacent opportunity guardrail**

```text
Compare init-saved-views-preview, init-personal-view-sync, init-curated-team-views, and init-feedback-digests. Explain where personal recall, account continuity, governed sharing, and notification consent differ. Cite product/roadmap.json and keep all gates open; do not collapse them into one feature.
```

### Product design · UI/UX/accessibility

**State inventory**

```text
Using design/saved-views-ux-brief.md, design/local-design-context.json, app/index.html, app/app.js, and app/styles.css, create a verified state inventory for create/apply/edited/delete/empty/loading/storage-failure/corrupt/stale/restricted/no-results/recovery. Cite current implementation as path:line and mark missing or visually unverified states unknown. Preview findings only.
```

**Accessibility review**

```text
Using .github/prompts/figma-ux-review.prompt.md with committed local context, inspect keyboard order, dialog focus and return, screen-reader names/status, non-color state, 320 px/400% reflow, contrast intent, target size, and reduced motion for Saved Views. Do not claim runtime results that were not tested; stop for severity review.
```

**Permission-safe content**

```text
Draft three content options for the decision-invalid-criteria recovery state that explain omitted criteria without revealing restricted field/source/value existence. Ground constraints in design/saved-views-ux-brief.md and SS-03, compare comprehension/privacy tradeoffs, and leave the product choice open.
```

**Tiny UI preview**

```text
Using .github/prompts/ui-change-preview.prompt.md, preview the smallest diff for clearer “this browser” empty-state language in app/app.js. Include exact test/manual checks and stop before editing.
```

### Program/project management · GitHub Issues/Projects

**Epic preview**

```text
Using .github/prompts/epic-subissue-draft.prompt.md, preview init-saved-views-preview and its four dependency-ordered work-* children from product/roadmap.json. Preserve exact bodies, labels, acceptance criteria, open decisions, and blocked-by edges. No GitHub writes.
```

**Dependency/owner review**

```text
Audit product/roadmap.json dependencies and ownerRole values for init-saved-views-preview, init-filter-provenance, and init-personal-view-sync. Separate internal stable-ID dependencies from external review dependencies, identify missing decision owners as questions, and do not assign named people or change the roadmap.
```

**Project field preview**

```text
Using docs/github-projects-setup.md and product/roadmap.json, preview Project field values for init-saved-views-preview and work-view-storage-validation through work-view-accessibility. Show stable ID, horizon, status, confidence, impact, effort band, dependency, and open-decision indicator. Do not create or update a Project.
```

**Program update**

```text
Using .github/prompts/stakeholder-program-update.prompt.md, draft a weekly update for init-saved-views-preview with evidence, decisions, work-* dependency status, risks, asks, and next steps. Keep proposals and facts separate; stop before sending.
```

### Engineering handoff and risk review

**Implementation boundary**

```text
Verify the Saved Views implementation boundary across app/app.js, src/features/saved-views/storage.js, src/features/filters/filter-state.js, src/features/share/share-state.js, and test/*.test.js. Return capability, path:line proof, failure mode, test coverage, and unknown. Treat test.todo as absent coverage, not implementation.
```

**Risk review**

```text
For work-view-storage-validation and work-view-recovery, trace corrupt schema, storage quota, stale field, restricted criterion, and multi-tab risks. Separate current verified handling from proposed handling, cite code/tests, and list the cheapest validation for each. Do not design account sync.
```

**Dependency-ordered handoff**

```text
Draft a read-only engineering handoff for work-view-storage-validation → work-view-core-flows/work-view-recovery → work-view-accessibility. Preserve acceptance criteria from product/roadmap.json, add verified code/test touchpoints and unknowns, and identify which open decision-* flags block detailed design. Do not edit or create issues.
```

**Test plan without false coverage**

```text
Build a test-plan preview for the accepted browser-local scope using test/saved-views.test.js plus relevant filter/share tests. Separate existing passing coverage, TODO coverage, proposed unit/integration/manual accessibility checks, and out-of-scope sync/sharing tests. Name exact existing npm commands; do not claim tests were run.
```

## Session recipes

Safety checkpoints remain mandatory in every cut. Skipping a stage means using its reviewed artifact as context, not silently approving it.

### 15-minute lightning

| Minute | Run | Skip/compress safely |
| ---: | --- | --- |
| 0–1 | Paste the one-session contract and Stage 1 orientation. | No audience discussion yet. |
| 1–5 | Stage 2 completeness. | Fold Stage 3 into one follow-up: ask for top two dependencies/unknowns, no estimates. Pause for classification approval. |
| 5–8 | Stage 4 evidence matrix. | Show one support, one counter-signal, one limitation. Pause for interpretation approval. |
| 8–11 | Stage 6 local UX review. | Skip Figma entirely; keep design-source/severity checkpoint. |
| 11–13 | Stage 9 deterministic `npm run issues:preview`. | Skip generated prose and all write-shaped commands; inspect IDs/order. |
| 13–15 | Stage 11 JSON/canvas handoff plus Stage 12 spoken update. | Skip live code and scenario comparison. Keep roadmap and fact-check checkpoints. |

### 30-minute working session

| Minute | Run | Skip/compress safely |
| ---: | --- | --- |
| 0–2 | Contract + Stage 1. | — |
| 2–8 | Stages 2–3. | Review representative citations; keep classification/effort checkpoint. |
| 8–13 | Stage 4. | — |
| 13–17 | Stage 5. | Review spec delta, do not resolve flags. |
| 17–22 | Stage 6. | Stage 7 only if already authorized; otherwise local fallback. |
| 22–25 | Stage 8 preview only. | Apply/test only if approved instantly; otherwise preserve preview and move on. |
| 25–28 | Stage 9 local preview. | Do not show generated `gh` commands. |
| 28–30 | Stage 11 handoff + Stage 12 spoken close. | Skip Stage 10; state roadmap decisions remain open. |

### 45-minute full session

| Minute | Run | Notes |
| ---: | --- | --- |
| 0–2 | Contract + Stage 1 | Establish source hierarchy and synthetic boundary. |
| 2–8 | Stages 2–3 | Inspect citations; challenge false precision. |
| 8–14 | Stage 4 | Evidence and counter-signals. |
| 14–18 | Stage 5 | Decision brief/spec delta, flags remain open. |
| 18–24 | Stage 6 | Local-first design review. |
| 24–26 | Stage 7 | Optional only if pre-authorized; otherwise use recovery prompt. |
| 26–30 | Stage 8 | Preview; apply/test only after explicit approval. |
| 30–35 | Stage 9 | Exact issue preview, no write. |
| 35–39 | Stage 10 | Scenarios and open decisions. |
| 39–42 | Stage 11 | Roadmap Studio or JSON fallback. |
| 42–45 | Stage 12 | Human-reviewed stakeholder close. |

## Audience interaction and transitions

| After stage | Ask the room | Presenter transition |
| --- | --- | --- |
| Orientation | “Which source should win if the spec and running code disagree about what exists?” | “Now that we know the sources, let’s question the repository—not a status slide.” |
| Completeness | “Which classification would you challenge, and what proof would change it?” | “A capability map tells us what exists; next we expose what it touches.” |
| Blast radius | “Which inferred dependency needs an engineer, designer, or policy owner?” | “Code can bound the work, but it cannot prove the opportunity.” |
| Evidence | “Which is fact, interpretation, assumption, and counter-signal?” | “Reviewed evidence can sharpen a decision without making it for us.” |
| Decision brief | “Which open question blocks acceptance criteria, and which can be deferred?” | “A sharper requirement still needs an understandable, recoverable experience.” |
| UX | “What should happen when a saved criterion disappears or becomes restricted?” | “We can now preview one tiny improvement without surrendering change control.” |
| Code preview | “Do we approve this exact diff, reject it, or keep it as a concept?” | “A patch proves a feedback loop; a delivery plan still needs traceability.” |
| Issue preview | “Are these slices independently testable and correctly blocked?” | “Issues package work; the roadmap preserves choices and gates.” |
| Scenarios | “What evidence would make us hold or stop, not just advance?” | “Let’s focus the authoritative plan without changing it.” |
| Roadmap Studio | “Keep, hold, split, or investigate—which deserves discussion?” | “Finally, let’s communicate facts, risks, and asks without inventing progress.” |
| Update | “What would you refuse to send until a named role confirms it?” | “The acceleration came from traceability; people kept the decision rights.” |

## Live failure anti-patterns and repair prompts

### Vague answer or no citations

```text
Stop and make this inspectable. Re-answer as a table; every implementation claim must have path:line proof and every product claim a stable evidence ID/path plus limitation. Mark anything else assumption or unknown. Do not continue to recommendations.
```

### Overconfident sizing

```text
Remove points, person-days, dates, staffing assumptions, and precision not present in the repository. Use only small/medium/large/unknown with confidence, cited drivers, excluded scope, and the two investigations most likely to change the band.
```

### Unsupported visual claim

```text
Retract visual or runtime claims not verified from the declared source. Cite the exact local artifact/Figma node/runtime observation for each remaining claim, or mark it unknown with the evidence needed. Do not infer pixel quality from structural JSON.
```

### Human decision auto-resolved

```text
Restore every humanDecisionFlag exactly as recorded in product/roadmap.json. Recast the selection as options with tradeoffs and identify who must decide by role. Do not edit a status, horizon, requirement, or acceptance criterion.
```

### Attempted remote write

```text
Stop before any remote mutation. Do not invoke gh or a GitHub/Figma write tool. State what was proposed, whether any write actually occurred, and return to a preview of exact titles/bodies/relationships or comments. Draft approval is not write approval.
```

If a write did occur unexpectedly, stop the demo and inspect/audit it outside the stage flow; do not attempt destructive cleanup live.

### Figma unavailable

```text
Do not debug authentication, permissions, or MCP configuration on stage. Use design/saved-views-ux-brief.md, design/local-design-context.json, design/tokens.json, and the current app as the complete local fallback. Mark unavailable visual details unknown.
```

### Canvas unavailable

```text
Do not reinstall or debug the canvas. Read product/roadmap.json directly, run npm run issues:preview:json if structured output helps, and produce a read-only handoff preserving init-*, work-*, risk-*, and decision-* IDs. No writes.
```

### Context drift

```text
Pause and rebuild a context ledger from this session: accepted facts, challenged claims, deferred decisions, approved actions, unapproved proposals, and files/commands actually changed or run. Reconcile it with product/roadmap.json and cited repository proof before continuing.
```

### Time pressure

```text
Switch to lightning mode. Preserve the next Human checkpoint and safety boundary, summarize already-reviewed proof in three bullets, use the committed local fallback, and run only npm run issues:preview if an artifact is needed. Skip optional Figma, live apply, generated gh commands, and canvas debugging.
```

## Final presenter check

- [ ] Every displayed claim is cited, synthetic-labeled, or explicitly unknown.
- [ ] Counter-signals remain visible.
- [ ] No qualitative effort band became a false estimate or promise.
- [ ] `decision-*` flags remain human-owned.
- [ ] Figma was local-only or explicitly pre-authorized and read-only.
- [ ] The code diff was previewed before any apply; targeted validation was reported honestly.
- [ ] Issue and Project output remained preview-only.
- [ ] No remote write, MCP configuration, secret, or real customer data was introduced.
- [ ] The closing update distinguishes evidence, decisions, risks, asks, and next steps.

Copy, paste, inspect, pause, decide.
