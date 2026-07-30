# Market and competitive notes

> **Provenance label: SYNTHETIC / DEMO-ONLY.** These are invented desk-research notes describing generic product patterns. They are not current claims about named vendors, do not use live pricing or feature data, and should not be used for procurement or competitive positioning.

| ID | Synthetic observation | Possible implication | Counterpoint / uncertainty |
| --- | --- | --- | --- |
| `MK-01` | Feedback and work-management tools often expose reusable filters as named personal views. | “Save current filters” may be a recognizable mental model. | Familiarity does not prove discoverability or value in Signal Desk. |
| `MK-02` | Some collaborative tools distinguish personal, shared, and default views. | Visibility and ownership could be explicit properties. | This adds permission, lifecycle, and governance work that the local preview does not support. |
| `MK-03` | Dense analytics products sometimes encode filter state in URLs. | A link could support lightweight handoff before full shared-view infrastructure. | URLs can leak sensitive criteria, become long, and still require server-side permission checks. |
| `MK-04` | Products with many views commonly add favorites, sorting, folders, or administration. | View proliferation is a foreseeable cost of broad sharing. | Building organization controls before observed clutter would be premature. |
| `MK-05` | Saved searches may power alerts or digests. | Reusable criteria could later support notifications. | A saved view is not consent to receive messages; freshness and delivery semantics differ. |
| `MK-06` | Systems with mutable schemas display warnings when saved filters no longer resolve. | Recovery and stale-state explanation are table stakes for trust. | We have no real benchmark showing which recovery pattern performs best. |

## Tensions to keep visible

- Pattern familiarity favors a conventional view picker, while the fictional analytics suggest low preview discoverability may also be caused by weak placement or low demand.
- Shared/default views could reduce duplicate setup, but they introduce a stronger governance problem than the current evidence justifies.
- URL state may be a reversible experiment, but it is not an authorization or persistence solution.
- Notification expansion could increase value but should remain separate from Saved Views success.

Use these notes with the [other evidence](README.md), not as a feature checklist. Roadmap evidence references use the IDs above.
