# Customer interview and support signals

> **Provenance label: SYNTHETIC / DEMO-ONLY.** These are fictional composite notes created for product-planning practice. Names, companies, dates, and quotes are invented. The sample is intentionally small and contradictory.

## Interview-style notes

### CI-01 — repeat triage setup

- **Synthetic participant:** PM at a mid-sized subscription business
- **Synthetic session:** 2026-07-08, workflow walkthrough
- **Signal:** Recreates a “high severity + onboarding + last 30 days” filter several times per week.
- **Invented quote:** “I know the shape I need; I just don’t want to rebuild it every Monday.”
- **Tension:** Would prefer a small set of curated team views over many personal views.
- **Confidence:** Low; one fictional participant and no timing study.

### CI-02 — personal workspace preference

- **Synthetic participant:** Research operations lead
- **Synthetic session:** 2026-07-10, concept discussion
- **Signal:** Values private, temporary configurations while exploring sensitive themes.
- **Invented quote:** “Please don’t publish every scratch filter to the team.”
- **Tension:** Strong personal-view need conflicts with a sharing-first interpretation of CI-01.
- **Confidence:** Low; concept reaction, not observed behavior.

### CI-03 — provenance and stale filters

- **Synthetic participant:** Support insights manager
- **Synthetic session:** 2026-07-14, prototype review
- **Signal:** Wants to know why an item appears and which filters are active. Asked what happens when a tag is renamed.
- **Invented quote:** “A shortcut that silently changes the answer is worse than rebuilding it.”
- **Tension:** Reliability and explanation may matter more than create speed.
- **Confidence:** Low-to-medium for identifying a risk; not evidence of prevalence.

### CI-04 — low-frequency reviewer

- **Synthetic participant:** Design manager
- **Synthetic session:** 2026-07-15, navigation test
- **Signal:** Reviews feedback monthly and did not notice the Saved Views control without prompting.
- **Invented quote:** “Search history might be enough for me.”
- **Tension:** The feature may chiefly serve frequent triagers, not all collaborators.
- **Confidence:** Low; one fictional usability observation.

### CI-05 — mobile recovery, not creation

- **Synthetic participant:** Customer success lead
- **Synthetic session:** 2026-07-17, contextual inquiry
- **Signal:** Checks an existing queue on a phone before meetings, but creates complex filters on desktop.
- **Invented quote:** “On mobile, let me open the list and see what it means; I won’t build it there.”
- **Tension:** Full mobile creation parity could add effort without matching the observed fictional workflow.
- **Confidence:** Low; directional design input only.

## Support-style signals

### SS-01 — “filters disappeared”

- **Synthetic channel/date:** Support ticket, 2026-07-06
- **Signal:** A user expected browser-local saved filters to follow them to another device.
- **Risk:** Preview language and persistence boundaries are unclear.
- **Count represented:** 1 fictional ticket.

### SS-02 — duplicate view names

- **Synthetic channel/date:** Support ticket, 2026-07-11
- **Signal:** Two local views with the same name made the picker ambiguous.
- **Risk:** Naming rules, timestamps, and rename affordance are underspecified.
- **Count represented:** 1 fictional ticket.

### SS-03 — restricted source after role change

- **Synthetic channel/date:** Escalation note, 2026-07-13
- **Signal:** A stored filter referenced a source the fictional user could no longer access.
- **Risk:** Applying a configuration must re-evaluate current permissions and explain omitted criteria.
- **Count represented:** 1 fictional escalation.

### SS-04 — request for a shared weekly view

- **Synthetic channel/date:** Feature request, 2026-07-18
- **Signal:** A product operations lead asked to pin one team-wide queue.
- **Counter-signal:** The request describes curation and governance, not simply a “share” button.
- **Count represented:** 1 fictional request.

### SS-05 — accidental overwrite concern

- **Synthetic channel/date:** Chat transcript summary, 2026-07-20
- **Signal:** A user was unsure whether changing filters had changed the saved configuration.
- **Risk:** “Apply,” “update,” and “save as new” need distinct feedback.
- **Count represented:** 1 fictional contact.

## Product judgment prompted

The set supports hardening personal reuse and state legibility, but does **not** establish broad demand for team sharing. CI-01/SS-04 favor curated shared workflows; CI-02 favors private exploration; CI-04 questions relevance for occasional users. The [Saved Views spec](../saved-views-spec.md) therefore leaves sharing and mobile creation as explicit decisions.
