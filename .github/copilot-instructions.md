# Signal Desk Copilot guidance

Signal Desk is a synthetic customer-feedback demo. Help with normal coding tasks directly; apply the controls below when making product or repository claims.

- Cite repository claims with `path:line` evidence. Separate what is implemented, partial, missing, or inferred.
- Label product evidence by provenance: **SYNTHETIC / DEMO-ONLY**, source ID (`CI-*`, `SS-*`, `AN-*`, or `MK-*`), and limitation. Do not turn a quote or count into proof.
- State assumptions, unknowns, counter-signals, and unresolved human decisions explicitly.
- Never add real customer data, credentials, integration configuration, access tokens, or production promises. Use only the committed synthetic artifacts.
- Treat `product/roadmap.json` as the authoritative roadmap. Do not silently resolve its decision flags or expand local-only Saved Views into sync/sharing.
- Preview issue, pull-request, Project, or other external mutations first. Require explicit human review and approval before any remote write; do not infer approval from a request for a draft.
