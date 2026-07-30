#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");
const ROADMAP_PATH = path.join(ROOT, "product", "roadmap.json");

const CHILD_CONTEXT = Object.freeze({
  "work-view-storage-validation": {
    "rationale": "Defensive reads already keep malformed browser storage from blocking the dashboard; explicit record versioning and data-boundary checks are still needed for a reliable local preview.",
    "exclusions": [
      "No server persistence, account sync, team sharing, or permissions infrastructure."
    ],
    "evidenceReferences": [
      "AN-06",
      "SS-03"
    ],
    "references": [
      "../src/features/saved-views/storage.js#L3-L57",
      "../test/saved-views.test.js#L34-L68",
      "./saved-views-spec.md#proposed-acceptance-boundaries"
    ],
    "validation": [
      "Run the saved-view storage tests for malformed, unsupported, and quota-failure records.",
      "Inspect persisted records and telemetry touchpoints against the documented data exclusions."
    ]
  },
  "work-view-core-flows": {
    "rationale": "Create, apply, and delete are present in the browser-local preview, while rename and a clear active-versus-edited state remain necessary for safe reuse.",
    "exclusions": [
      "No cross-device sync, team ownership, or automatic duplicate-name policy decision."
    ],
    "evidenceReferences": [
      "CI-01",
      "SS-02",
      "SS-05"
    ],
    "references": [
      "../app/app.js#L104-L175",
      "../app/index.html#L56-L74",
      "./saved-views-spec.md#proposed-acceptance-boundaries"
    ],
    "validation": [
      "Exercise create, apply, rename, and delete without leaving the browser-local boundary.",
      "Verify local-only and active-versus-edited states with keyboard use and non-color cues."
    ]
  },
  "work-view-recovery": {
    "rationale": "Current filter normalization repairs some invalid values, but the preview does not yet explain omissions or model permission changes safely.",
    "exclusions": [
      "No role-based permissions implementation or disclosure of inaccessible source and field details."
    ],
    "evidenceReferences": [
      "CI-03",
      "SS-03",
      "AN-06"
    ],
    "references": [
      "../src/features/saved-views/storage.js#L15-L27",
      "../src/features/filters/filter-state.js#L1-L16",
      "./saved-views-spec.md#invalid-or-restricted-criteria"
    ],
    "validation": [
      "Test corrupt, removed, and restricted criteria with current access re-evaluated on each apply.",
      "Review recovery messages to ensure restricted context is not disclosed."
    ]
  },
  "work-view-accessibility": {
    "rationale": "The preview includes dialog and live-status foundations, but all saved-view flows require explicit keyboard, screen-reader, reflow, and announcement validation.",
    "exclusions": [
      "No accessibility claim beyond the saved-view core and recovery flows."
    ],
    "evidenceReferences": [
      "CI-03",
      "MK-06"
    ],
    "references": [
      "../app/index.html#L101-L137",
      "../app/app.js#L118-L175",
      "../design/saved-views-ux-brief.md#accessibility"
    ],
    "validation": [
      "Complete create, apply, rename, delete, and recovery using keyboard-only navigation and a supported screen reader.",
      "Check 320 CSS px reflow and programmatic status announcements."
    ]
  },
  "work-provenance-content": {
    "rationale": "Reviewers need concise language that distinguishes applied, edited, stale, and safely omitted criteria without exposing restricted context.",
    "exclusions": [
      "No disclosure of restricted source or field details and no final progressive-disclosure layout decision."
    ],
    "evidenceReferences": [
      "CI-03",
      "SS-03",
      "MK-06"
    ],
    "references": [
      "../design/saved-views-ux-brief.md#research-questions",
      "./saved-views-spec.md#invalid-or-restricted-criteria"
    ],
    "validation": [
      "Review every state label for a clear active, edited, stale, or restricted meaning.",
      "Threat-review omission copy for restricted-context disclosure."
    ]
  },
  "work-provenance-prototype": {
    "rationale": "A prototype is needed to test whether filter provenance stays understandable without overwhelming routine review.",
    "exclusions": [
      "No production implementation and no exposure of restricted criterion details."
    ],
    "evidenceReferences": [
      "CI-03",
      "SS-03",
      "MK-06"
    ],
    "references": [
      "../design/saved-views-ux-brief.md#research-questions",
      "../design/saved-views-ux-brief.md#accessibility"
    ],
    "validation": [
      "Test comprehension of the summary and omissions at desktop and 320 CSS px.",
      "Complete disclosure interactions with keyboard and a supported screen reader."
    ]
  },
  "work-sync-demand-study": {
    "rationale": "Directional later-session reuse does not establish cross-device demand, so the workflow need must be studied before durable storage is designed.",
    "exclusions": [
      "No account-sync implementation, team sharing, or inference that later-session reuse proves cross-device demand."
    ],
    "evidenceReferences": [
      "SS-01",
      "AN-03",
      "CI-02"
    ],
    "references": [
      "./decisions/0001-saved-views-local-preview.md#reconsideration-gates",
      "../src/features/saved-views/implementation-notes.js#L4-L19"
    ],
    "validation": [
      "Document observed cross-session and cross-device workflows separately, including counter-signals.",
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
      "CI-02"
    ],
    "references": [
      "./decisions/0001-saved-views-local-preview.md#why-not-sync-or-sharing-now",
      "../src/features/saved-views/dependency-map.js#L12-L19"
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
      "CI-02"
    ],
    "references": [
      "./decisions/0001-saved-views-local-preview.md#reconsideration-gates",
      "./evidence/usage-analytics.json#proposedMetricDefinitions"
    ],
    "validation": [
      "Verify the decision cites demand findings, lifecycle review, counter-signals, and rejected alternatives.",
      "Confirm the record leaves execution subject to separate approval."
    ]
  },
  "work-team-role-model": {
    "rationale": "Governed team views require explicit responsibilities so private scratch work is not published and default designation is not implied by sharing.",
    "exclusions": [
      "No team-view implementation, open publishing, or automatic conversion of personal views."
    ],
    "evidenceReferences": [
      "CI-01",
      "CI-02",
      "SS-04",
      "MK-02"
    ],
    "references": [
      "../design/saved-views-ux-brief.md#permissions-and-future-team-sharing-concept",
      "./decisions/0001-saved-views-local-preview.md#why-not-sync-or-sharing-now"
    ],
    "validation": [
      "Walk create, update, archive, transfer, and default designation through each proposed role.",
      "Verify every private-to-shared transition requires an intentional action."
    ]
  },
  "work-team-threat-model": {
    "rationale": "Shared definitions, names, counts, and omission messages could reveal restricted context even when result access is enforced.",
    "exclusions": [
      "No assumption that publisher access transfers to viewers and no realistic customer data."
    ],
    "evidenceReferences": [
      "SS-03",
      "MK-02",
      "MK-04"
    ],
    "references": [
      "../design/saved-views-ux-brief.md#permissions-and-future-team-sharing-concept",
      "../src/features/saved-views/implementation-notes.js#L4-L19"
    ],
    "validation": [
      "Review names, criteria, counts, omissions, and revoked-access scenarios for disclosure.",
      "Verify each scenario evaluates the current viewer's access."
    ]
  },
  "work-team-concept-test": {
    "rationale": "A bounded concept test can compare curated coordination with private-work counter-scenarios before any sharing investment is approved.",
    "exclusions": [
      "No production sharing, workspace default, or claim that synthetic findings establish demand."
    ],
    "evidenceReferences": [
      "CI-01",
      "CI-02",
      "SS-04",
      "MK-04"
    ],
    "references": [
      "../design/saved-views-ux-brief.md#permissions-and-future-team-sharing-concept",
      "./evidence/README.md"
    ],
    "validation": [
      "Test curation, private scratch work, restricted access, and default-view counter-scenarios.",
      "Report the synthetic sample, limitations, counter-signals, and unresolved governance decisions."
    ]
  },
  "work-digest-problem-study": {
    "rationale": "One fictional low-frequency workflow and generic market patterns are insufficient to choose a digest over history, reminders, or no change.",
    "exclusions": [
      "No notification prototype, subscription assumption, or commitment to a digest solution."
    ],
    "evidenceReferences": [
      "CI-04",
      "MK-05"
    ],
    "references": [
      "./evidence/customer-support-signals.md#ci-04--low-frequency-reviewer",
      "./evidence/market-notes.md#market-and-competitive-notes"
    ],
    "validation": [
      "Observe periodic-review workflows and compare digest, history, reminder, and no-change options.",
      "Document sample limitations, counter-signals, and whether a recurring problem was established."
    ]
  },
  "work-digest-consent-model": {
    "rationale": "If a digest remains viable, saving a view must stay separate from notification consent and stale criteria need a safe recovery path.",
    "exclusions": [
      "No implicit subscription from saving a view and no outbound delivery implementation."
    ],
    "evidenceReferences": [
      "CI-04",
      "MK-05"
    ],
    "references": [
      "./evidence/market-notes.md#market-and-competitive-notes",
      "./saved-views-spec.md#invalid-or-restricted-criteria"
    ],
    "validation": [
      "Walk save, subscribe, frequency change, pause, unsubscribe, and stale-view recovery as distinct states.",
      "Verify no save path creates or implies notification consent."
    ]
  }
});

function usage() {
  return `Usage: node scripts/roadmap-to-issues.mjs [options]

Deterministically generate a PREVIEW-ONLY epic and child issue plan.

Options:
  --initiative <id-or-title>  Initiative ID or exact title (default: init-saved-views-preview)
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
    initiative: "init-saved-views-preview",
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
