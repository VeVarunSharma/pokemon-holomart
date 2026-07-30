---
name: roadmap-scenario-review
description: Compare bounded roadmap scenarios without silently reprioritizing or resolving decision gates.
argument-hint: "[initiatives or scenario question]"
agent: product-strategist
---

Compare roadmap scenarios for `${input:focus:Initiatives or scenario question}` using [the authoritative roadmap](../../product/roadmap.json), [product brief](../../product/brief.md), [evidence index](../../product/evidence/README.md), [decision record](../../product/decisions/0001-saved-searches-local-preview.md), and verified implementation constraints.

## Evidence rules

- Preserve stable `init-*`, `work-*`, risk, and decision IDs.
- Label all product evidence **SYNTHETIC / DEMO-ONLY**, including counter-signals and limitations.
- Treat Now / Next / Later as planning horizons, not promises.
- Use qualitative effort bands already present in the roadmap; do not invent points, dates, staffing, or certainty.

## Output

1. Current baseline and gates.
2. Two or three scenarios such as keep / hold / split / advance / stop.
3. Per-scenario outcome, supporting and opposing evidence, dependencies, opportunity cost, reversibility, risks, and validation needed.
4. Side-by-side comparison with confidence and open decision flags.
5. Preview-only roadmap and GitHub Project field deltas.
6. Recommended discussion order, not an automatic selection.

## Stop point

Stop with every human decision flag visibly open. Ask the human which scenario to keep, reject, combine, or investigate. Do not edit `product/roadmap.json`, move Project items, change issues, or perform any remote write.
