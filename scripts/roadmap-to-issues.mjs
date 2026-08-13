import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");
const ROADMAP_PATH = path.join(ROOT, "product", "roadmap.json");

const CHILD_CONTEXT = Object.freeze({
  "work-search-storage-validation": {
    "rationale": "Defensive reads already keep malformed browser storage from blocking the catalog; explicit record versioning and data-boundary checks are still needed for a reliable Saved Searches preview.",
    "exclusions": [
      "No account persistence, price alerts, listing snapshots, or notification infrastructure."
    ],
    "evidenceReferences": [
      "AN-06",
      "SS-03"
    ],
    "references": [
      "../src/features/saved-searches/storage.js#L3-L57",
      "../test/unit/saved-searches.test.js#L33-L67",
      "./saved-searches-spec.md#proposed-acceptance-boundaries"
    ],
    "validation": [
      "Run the saved-search storage tests for malformed, unsupported, and quota-failure records.",
      "Inspect persisted records and telemetry touchpoints against the documented data exclusions."
    ]
  },
  "work-search-core-flows": {
    "rationale": "Create, apply, and delete are present in the device-local preview, while rename and a clear active-versus-edited state remain necessary for safe reuse.",
    "exclusions": [
      "No cross-device sync, price alerts, or automatic duplicate-name policy decision."
    ],
    "evidenceReferences": [
      "CI-01",
      "SS-02",
      "SS-05"
    ],
    "references": [
      "../src/storefront/initialize-storefront.js#L172-L268",
      "../app/index.html#L124-L171",
      "./saved-searches-spec.md#proposed-acceptance-boundaries"
    ],
    "validation": [
      "Exercise create, apply, rename, and delete without leaving the device-local boundary.",
      "Verify local-only, no-alert, and active-versus-edited states with keyboard use and non-color cues."
    ]
  },
  "work-search-recovery": {
    "rationale": "Current filter normalization repairs invalid values, but the preview does not yet explain removed expansion or rarity criteria.",
    "exclusions": [
      "No silent substitution of a different expansion or rarity and no account migration implementation."
    ],
    "evidenceReferences": [
      "CI-03",
      "SS-03",
      "AN-06"
    ],
    "references": [
      "../src/features/saved-searches/storage.js#L15-L27",
      "../src/features/filters/filter-state.js#L1-L16",
      "./saved-searches-spec.md#invalid-or-unavailable-criteria"
    ],
    "validation": [
      "Test corrupt, removed, and renamed criteria with no silent broadening.",
      "Review recovery messages for specific, actionable, non-technical language."
    ]
  },
  "work-search-accessibility": {
    "rationale": "The preview includes native controls, a dialog, and live-status foundations, but all Saved Searches flows require explicit keyboard, screen-reader, reflow, and announcement validation.",
    "exclusions": [
      "No accessibility claim beyond the Saved Searches, catalog-filter, listing, and recovery flows."
    ],
    "evidenceReferences": [
      "CI-03",
      "MK-06"
    ],
    "references": [
      "../app/index.html#L114-L232",
      "../src/storefront/initialize-storefront.js#L155-L274",
      "../design/saved-searches-ux-brief.md#accessibility"
    ],
    "validation": [
      "Complete create, apply, rename, delete, and recovery using keyboard-only navigation and a supported screen reader.",
      "Check 320 CSS px reflow and programmatic status announcements."
    ]
  },
  "work-trust-content": {
    "rationale": "Collectors need concise listing language that makes price, condition, seller reputation, and market context comparable without implying a guarantee.",
    "exclusions": [
      "No real appraisal, grading, authentication, seller score, or price-feed claim."
    ],
    "evidenceReferences": [
      "CI-02",
      "MK-04"
    ],
    "references": [
      "../design/saved-searches-ux-brief.md#price-alerts-and-account-sync",
      "./brief.md#constraints",
      "../app/index.html#L173-L197"
    ],
    "validation": [
      "Review listing language for condition clarity, seller context, price freshness, and guarantee implications.",
      "Confirm synthetic market context cannot be read as a real appraisal."
    ]
  },
  "work-trust-prototype": {
    "rationale": "A prototype is needed to test whether listing trust context remains scannable across expertise levels and narrow viewports.",
    "exclusions": [
      "No production trust system or integration with real card, seller, grading, or pricing data."
    ],
    "evidenceReferences": [
      "CI-02",
      "CI-03",
      "MK-04"
    ],
    "references": [
      "../design/saved-searches-ux-brief.md#research-questions",
      "../design/saved-searches-ux-brief.md#accessibility",
      "../app/styles.css#L780-L1040"
    ],
    "validation": [
      "Test comparison comprehension at desktop and 320 CSS px.",
      "Complete listing navigation and cart actions with keyboard and a supported screen reader."
    ]
  },
  "work-sync-demand-study": {
    "rationale": "Directional later-session reuse and one mobile workflow do not establish cross-device demand, so the need must be studied before durable account storage is designed.",
    "exclusions": [
      "No account-sync implementation, price alerts, or inference that later-session reuse proves cross-device demand."
    ],
    "evidenceReferences": [
      "SS-01",
      "AN-03",
      "CI-05"
    ],
    "references": [
      "./decisions/0001-saved-searches-local-preview.md#reconsideration-gates",
      "../src/features/saved-searches/implementation-notes.js#L4-L19"
    ],
    "validation": [
      "Document cross-session, cross-device, desktop-creation, and mobile-check workflows separately.",
      "Review findings against the local-preview reconsideration gates."
    ]
  },
  "work-sync-lifecycle-review": {
    "rationale": "Durable account storage would introduce migration, retention, export, deletion, privacy, and security obligations absent from the local preview.",
    "exclusions": [
      "No storage architecture approval or implementation before named reviewers accept the lifecycle option."
    ],
    "evidenceReferences": [
      "SS-01",
      "CI-05"
    ],
    "references": [
      "./decisions/0001-saved-searches-local-preview.md#why-not-account-sync-or-alerts-now",
      "../src/features/saved-searches/dependency-map.js#L12-L19"
    ],
    "validation": [
      "Compare options across migration, export, retention, deletion, privacy, and security.",
      "Record reviewer ownership, unresolved risks, and rejected alternatives."
    ]
  },
  "work-sync-decision": {
    "rationale": "A human-owned decision record is required to weigh demand and lifecycle findings without turning a directional metric into an automatic launch.",
    "exclusions": [
      "No automatic experiment launch, production commitment, or team-sharing authorization."
    ],
    "evidenceReferences": [
      "SS-01",
      "AN-03",
      "CI-05"
    ],
    "references": [
      "./decisions/0001-saved-searches-local-preview.md#reconsideration-gates",
      "./evidence/usage-analytics.json#proposedMetricDefinitions"
    ],
    "validation": [
      "Verify the decision cites demand findings, lifecycle review, counter-signals, and rejected alternatives.",
      "Confirm the record leaves execution subject to separate approval."
    ]
  },
  "work-alert-job-study": {
    "rationale": "One price-drop request and one repeat-collector workflow are insufficient to choose exact-card thresholds, broad matching, in-product reminders, or no alert.",
    "exclusions": [
      "No notification prototype, subscription assumption, or commitment to an alert solution."
    ],
    "evidenceReferences": [
      "CI-01",
      "CI-02",
      "SS-04",
      "MK-03"
    ],
    "references": [
      "../design/price-monitoring-job-study.md#research-decision-matrix",
      "../design/saved-searches-ux-brief.md#research-questions",
      "./decisions/0001-saved-searches-local-preview.md#why-not-account-sync-or-alerts-now"
    ],
    "validation": [
      "Observe exact-card, broad-match, and non-alert monitoring workflows separately.",
      "Document sample limitations, counter-signals, and whether a recurring problem was established."
    ]
  },
  "work-alert-consent-model": {
    "rationale": "If an alert remains viable, saving must stay separate from notification consent and preferences need a complete lifecycle.",
    "exclusions": [
      "No implicit subscription from saving a search and no outbound delivery implementation."
    ],
    "evidenceReferences": [
      "SS-04",
      "MK-03",
      "MK-05"
    ],
    "references": [
      "../design/saved-searches-ux-brief.md#price-alerts-and-account-sync",
      "./saved-searches-spec.md#proposed-acceptance-boundaries"
    ],
    "validation": [
      "Walk save, subscribe, threshold, channel, cadence, quiet hours, pause, and unsubscribe as distinct states.",
      "Verify no save path creates or implies notification consent."
    ]
  },
  "work-alert-trigger-contract": {
    "rationale": "Price and inventory can change between evaluation, delivery, and open, so the trigger contract must define freshness and sold-listing outcomes.",
    "exclusions": [
      "No live pricing integration, guaranteed price, inventory reservation, or outbound delivery."
    ],
    "evidenceReferences": [
      "CI-02",
      "SS-04",
      "MK-03"
    ],
    "references": [
      "../design/saved-searches-ux-brief.md#loading-empty-and-error-states",
      "./brief.md#constraints"
    ],
    "validation": [
      "Model price changes, condition changes, sold listings, delayed delivery, and duplicate matches.",
      "Verify stale or sold inventory cannot produce a success-shaped outcome."
    ]
  },
  "work-lists-problem-study": {
    "rationale": "Generic marketplace patterns and one occasional-buyer counter-signal are insufficient to choose wishlists, owned collections, gift lists, or no new list.",
    "exclusions": [
      "No list implementation, ownership inference, social sharing, or claim that market familiarity proves demand."
    ],
    "evidenceReferences": [
      "CI-04",
      "MK-02"
    ],
    "references": [
      "./evidence/shopper-research-signals.md#ci-04--occasional-gift-buyer",
      "./evidence/market-notes.md#market-and-competitive-notes",
      "../design/collector-lists-concept-study.md#research-decision-matrix"
    ],
    "validation": [
      "Observe wishlisting, collection ownership, gifting, and dynamic-search workflows separately.",
      "Document sample limitations, counter-signals, and whether a recurring problem was established."
    ]
  },
  "work-lists-model": {
    "rationale": "If a stable list remains viable, its states and lifecycle must not blur saving, cart intent, purchase, and ownership.",
    "exclusions": [
      "No implementation, social graph, collection valuation, or automatic ownership state."
    ],
    "evidenceReferences": [
      "CI-04",
      "MK-02"
    ],
    "references": [
      "./evidence/market-notes.md#market-and-competitive-notes",
      "./brief.md#non-goals",
      "../design/collector-lists-concept-study.md#guardrails"
    ],
    "validation": [
      "Walk add, remove, archive, purchase, return, and delete semantics for each candidate list.",
      "Verify save, cart, purchase, and ownership remain distinct actions."
    ]
  }
});

function usage() {
  return `Usage: node scripts/roadmap-to-issues.mjs [options]

Deterministically generate a PREVIEW-ONLY epic and child issue plan.

Options:
  --initiative <id-or-title>  Initiative ID or exact title (default: init-saved-searches-preview)
  --format <markdown|json>    Output format (default: markdown)
  --gh-commands               Append PowerShell issue-create commands (labels are never applied)
  --repo <owner/name>         Include --repo in previewed gh commands
  --list                      List available initiatives and exit
  --help                      Show this help

Remote apply mode is intentionally not implemented. Review the output before
running any command yourself.`;
}

function fail(message) {
  console.error(`Error: ${message}\n\n${usage()}`);
  process.exitCode = 2;
}

function parseArgs(argv) {
  const options = {
    initiative: "init-saved-searches-preview",
    format: "markdown",
    ghCommands: false,
    repo: null,
    list: false,
    help: false
  };

  const valueOptions = new Map([
    ["--initiative", "initiative"],
    ["--format", "format"],
    ["--repo", "repo"]
  ]);

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--gh-commands") {
      options.ghCommands = true;
    } else if (argument === "--list") {
      options.list = true;
    } else if (argument === "--help" || argument === "-h") {
      options.help = true;
    } else if (argument === "--apply") {
      throw new Error("--apply is intentionally unsupported; this generator is dry-run only");
    } else if (valueOptions.has(argument)) {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error(`${argument} requires a value`);
      }
      options[valueOptions.get(argument)] = value;
      index += 1;
    } else {
      throw new Error(`unknown argument: ${argument}`);
    }
  }

  if (!["markdown", "json"].includes(options.format)) {
    throw new Error(`unsupported format "${options.format}"; use markdown or json`);
  }
  if (options.repo && !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(options.repo)) {
    throw new Error(`invalid repository "${options.repo}"; expected owner/name`);
  }
  return options;
}

function selectInitiative(roadmap, selector) {
  const normalized = selector.trim().toLocaleLowerCase("en-US");
  const matches = roadmap.initiatives.filter((initiative) =>
    initiative.id.toLocaleLowerCase("en-US") === normalized
    || initiative.title.toLocaleLowerCase("en-US") === normalized
  );
  if (matches.length === 1) return matches[0];
  if (matches.length > 1) {
    throw new Error(`initiative selector "${selector}" is ambiguous`);
  }
  throw new Error(
    `initiative "${selector}" not found. Available IDs: ${roadmap.initiatives.map(({ id }) => id).join(", ")}`
  );
}

export function dependencyOrder(items) {
  const byId = new Map(items.map((item) => [item.id, item]));
  const dependents = new Map(items.map((item) => [item.id, []]));
  const remainingDependencies = new Map(items.map((item) => [
    item.id,
    item.dependencies.filter((dependency) => byId.has(dependency)).length
  ]));
  const ordered = [];

  for (const item of items) {
    for (const dependency of item.dependencies) {
      if (byId.has(dependency)) dependents.get(dependency).push(item.id);
    }
  }

  const ready = items
    .filter((item) => remainingDependencies.get(item.id) === 0)
    .map((item) => item.id)
    .sort();
  while (ready.length) {
    const id = ready.shift();
    ordered.push(byId.get(id));
    for (const dependent of dependents.get(id).sort()) {
      const remaining = remainingDependencies.get(dependent) - 1;
      remainingDependencies.set(dependent, remaining);
      if (remaining === 0) {
        ready.push(dependent);
        ready.sort();
      }
    }
  }
  if (ordered.length !== items.length) {
    const cycleIds = items
      .filter((item) => remainingDependencies.get(item.id) > 0)
      .map((item) => item.id)
      .sort();
    throw new Error(`child dependency cycle includes ${cycleIds.join(", ")}`);
  }
  return ordered;
}

function repositoryPath(relativeFromProduct) {
  const [target, fragment] = relativeFromProduct.split("#", 2);
  const normalized = path.posix.normalize(path.posix.join("product", target));
  return fragment ? `${normalized}#${fragment}` : normalized;
}

function buildChildBody(initiative, item) {
  const dependencies = item.dependencies.length
    ? item.dependencies.map((dependency) => `- \`${dependency}\``).join("\n")
    : "- None";
  const acceptance = item.acceptanceCriteria.map((criterion) => `- [ ] ${criterion}`).join("\n");
  const exclusions = item.exclusions.map((exclusion) => `- ${exclusion}`).join("\n");
  const evidence = item.evidenceReferences.map((evidenceId) => {
    const reference = initiative.evidenceReferences.find(({ id }) => id === evidenceId);
    return `- **${reference.id}:** ${reference.summary} — \`${repositoryPath(reference.path)}\``;
  }).join("\n");
  const references = item.references.map((reference) => `- \`${repositoryPath(reference)}\``).join("\n");
  const validation = item.validation.map((step) => `- [ ] ${step}`).join("\n");
  return `## Parent initiative
\`${initiative.id}\` — ${initiative.title}

## Work item
\`${item.id}\`

## Rationale and outcome
${item.rationale}

## Acceptance criteria
${acceptance}

## Blocked by
${dependencies}

## Exclusions / non-goals
${exclusions}

## Evidence
**SYNTHETIC / DEMO-ONLY.** These sources are directional and retain their documented limitations.

${evidence}

## Code and design references
${references}

## Validation
${validation}

## Provenance and review
**SYNTHETIC / DEMO-ONLY.** Confirm repository evidence and unresolved human decisions before implementation. This draft creates no customer or production commitment.`;
}

function buildEpicBody(initiative) {
  const evidence = initiative.evidenceReferences.map((reference) =>
    `- **${reference.id} (${reference.type}):** ${reference.summary} — \`${repositoryPath(reference.path)}\``
  ).join("\n");
  const decisions = initiative.humanDecisionFlags.map((decision) =>
    `- **${decision.id} — ${decision.status}:** ${decision.question}\n  - Required by: ${decision.requiredBy}\n  - Options: ${decision.options.join("; ")}`
  ).join("\n");
  const risks = initiative.risks.map((risk) =>
    `- **${risk.id}:** ${risk.description} (${risk.likelihood} likelihood / ${risk.impact} impact)\n  - Mitigation: ${risk.mitigation}`
  ).join("\n");
  const measures = initiative.successMeasures.map((measure) =>
    `- **${measure.metric}${measure.guardrail ? " (guardrail)" : ""}:** ${measure.criterion} — \`${repositoryPath(measure.source)}\``
  ).join("\n");

  return `${initiative.issueDraft.body}

## Roadmap context
- Initiative: \`${initiative.id}\`
- Horizon/status: ${initiative.horizon} / ${initiative.status}
- Confidence: ${initiative.confidence}
- Owner role: ${initiative.ownerRole}

## Evidence trace
**SYNTHETIC / DEMO-ONLY.** Interpret these directional sources with their limitations and counter-signals.

${evidence}

## Risks
${risks}

## Proposed measures and guardrails
${measures}

## Open human decisions
${decisions}

Creating this epic does not resolve these decisions, approve child issues, or authorize roadmap movement.`;
}

export function buildPlan(roadmap, initiative) {
  const children = dependencyOrder(initiative.issueDraft.childWorkItems).map((roadmapItem) => {
    const context = CHILD_CONTEXT[roadmapItem.id];
    if (!context) throw new Error(`child issue context missing for ${roadmapItem.id}`);
    const unknownEvidence = context.evidenceReferences.filter((id) =>
      !initiative.evidenceReferences.some((reference) => reference.id === id)
    );
    if (unknownEvidence.length) {
      throw new Error(`${roadmapItem.id} references evidence outside ${initiative.id}: ${unknownEvidence.join(", ")}`);
    }
    const item = { ...roadmapItem, ...context };
    return {
      id: item.id,
      title: item.title,
      suggestedLabels: [...initiative.issueDraft.labels, "child-work"],
      rationale: item.rationale,
      dependencies: [...item.dependencies],
      acceptanceCriteria: [...item.acceptanceCriteria],
      exclusions: [...item.exclusions],
      evidenceReferences: [...item.evidenceReferences],
      references: [...item.references],
      validation: [...item.validation],
      body: buildChildBody(initiative, item)
    };
  });

  return {
    generatedFrom: "product/roadmap.json",
    childContextFrom: "scripts/roadmap-to-issues.mjs",
    schemaVersion: roadmap.schemaVersion,
    provenance: roadmap.metadata.provenance.label,
    writeStatus: "PREVIEW ONLY — NO REMOTE WRITES PERFORMED",
    initiative: {
      id: initiative.id,
      title: initiative.title,
      outcome: initiative.outcome,
      horizon: initiative.horizon,
      status: initiative.status,
      confidence: initiative.confidence,
      ownerRole: initiative.ownerRole,
      dependencies: [...initiative.dependencies],
      evidence: initiative.evidenceReferences.map((reference) => ({ ...reference })),
      risks: initiative.risks.map((risk) => ({ ...risk })),
      humanDecisions: initiative.humanDecisionFlags.map((decision) => ({ ...decision })),
      successMeasures: initiative.successMeasures.map((measure) => ({ ...measure }))
    },
    epic: {
      title: initiative.issueDraft.title,
      suggestedLabels: [...initiative.issueDraft.labels, "epic"],
      body: buildEpicBody(initiative)
    },
    children,
    humanCheckpoints: [
      "Confirm the selected roadmap initiative.",
      "Review evidence, counter-signals, scope, and unresolved decisions.",
      "Review exact epic/child titles, bodies, suggested labels, and dependency edges.",
      "Separately approve each remote write immediately before execution."
    ]
  };
}

function markdownList(values, empty = "None") {
  return values.length ? values.map((value) => `- ${value}`).join("\n") : `- ${empty}`;
}

function renderMarkdown(plan) {
  const evidence = plan.initiative.evidence.map((item) =>
    `| ${item.id} | ${item.type} | ${item.summary} | \`${repositoryPath(item.path)}\` |`
  ).join("\n");
  const decisions = plan.initiative.humanDecisions.map((item) =>
    `- **${item.id} (${item.status}):** ${item.question}\n  - Required by: ${item.requiredBy}\n  - Options: ${item.options.join("; ")}`
  );
  const children = plan.children.map((child, index) => `### ${index + 1}. ${child.id} — ${child.title}

**Suggested labels (not applied by commands):** ${child.suggestedLabels.map((label) => `\`${label}\``).join(", ")}

**Blocked by**
${markdownList(child.dependencies.map((dependency) => `\`${dependency}\``))}

**Acceptance criteria**
${markdownList(child.acceptanceCriteria.map((criterion) => `[ ] ${criterion}`))}

<details>
<summary>Exact issue body</summary>

${child.body}

</details>`).join("\n\n");

  return `# GitHub issue plan: ${plan.initiative.title}

> **${plan.provenance}** · **${plan.writeStatus}**
>
> Roadmap source: \`${plan.generatedFrom}\` · Child issue context: \`${plan.childContextFrom}\` · Initiative: \`${plan.initiative.id}\`

## Roadmap context

- Horizon/status: **${plan.initiative.horizon} / ${plan.initiative.status}**
- Confidence: **${plan.initiative.confidence}**
- Owner role: ${plan.initiative.ownerRole}
- Outcome: ${plan.initiative.outcome}
- Initiative dependencies:
${markdownList(plan.initiative.dependencies)}

## Evidence trace

| ID | Type | Roadmap interpretation | Source |
| --- | --- | --- | --- |
${evidence}

## Open human decisions

${markdownList(decisions)}

## Epic

**Title:** ${plan.epic.title}

**Suggested labels (not applied by commands):** ${plan.epic.suggestedLabels.map((label) => `\`${label}\``).join(", ")}

${plan.epic.body}

## Child issues in dependency order

${children}

## Human checkpoints

${plan.humanCheckpoints.map((checkpoint, index) => `${index + 1}. [ ] ${checkpoint}`).join("\n")}

No issue, sub-issue relationship, Project item, or other remote resource was created.`;
}

export function powerShellLiteral(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

export function hereString(name, value) {
  if (value.includes("\n'@")) {
    throw new Error(`cannot render PowerShell here-string for ${name}`);
  }
  return `$${name} = @'\n${value}\n'@`;
}

export function renderGhCommands(plan, repo) {
  const repoArgument = repo ? ` --repo ${powerShellLiteral(repo)}` : "";
  const lines = [
    "# PREVIEW ONLY. Review and run manually after explicit approval.",
    "# These commands create issues only; link sub-issues in GitHub after their URLs are known.",
    "# Suggested labels are comments only. Label flags are not emitted, so custom labels are not prerequisites.",
    `# Suggested epic labels (not applied): ${plan.epic.suggestedLabels.join(", ")}`,
    hereString("epicBody", plan.epic.body),
    `gh issue create${repoArgument} --title ${powerShellLiteral(plan.epic.title)} --body $epicBody`
  ];
  plan.children.forEach((child, index) => {
    const variable = `childBody${index + 1}`;
    lines.push(
      "",
      `# Suggested child labels (not applied): ${child.suggestedLabels.join(", ")}`,
      hereString(variable, child.body),
      `gh issue create${repoArgument} --title ${powerShellLiteral(child.title)} --body $${variable}`
    );
  });
  return lines.join("\n");
}

async function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    fail(error.message);
    return;
  }

  if (options.help) {
    console.log(usage());
    return;
  }

  let roadmap;
  try {
    roadmap = JSON.parse(await readFile(ROADMAP_PATH, "utf8"));
  } catch (error) {
    fail(`cannot read authoritative roadmap: ${error.message}`);
    return;
  }

  if (options.list) {
    for (const initiative of roadmap.initiatives) {
      console.log(`${initiative.id}\t${initiative.horizon}\t${initiative.status}\t${initiative.title}`);
    }
    return;
  }

  try {
    const initiative = selectInitiative(roadmap, options.initiative);
    const plan = buildPlan(roadmap, initiative);
    const commandPreview = options.ghCommands ? renderGhCommands(plan, options.repo) : null;
    const output = options.format === "json"
      ? JSON.stringify(commandPreview ? { ...plan, ghCommandPreview: commandPreview } : plan, null, 2)
      : renderMarkdown(plan);
    console.log(output);
    if (commandPreview && options.format === "markdown") {
      console.log("\n\n## gh command preview (PowerShell)\n");
      console.log(commandPreview);
    }
  } catch (error) {
    fail(error.message);
  }
}

if (path.resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  await main();
}
