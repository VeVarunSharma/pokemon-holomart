#!/usr/bin/env node

import { access, readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { buildPlan } from "./roadmap-to-issues.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const checks = [];

const requiredFiles = [
  "product/roadmap.json",
  "product/roadmap.schema.json",
  "product/brief.md",
  "product/saved-searches-spec.md",
  "product/evidence/README.md",
  "product/evidence/shopper-research-signals.md",
  "product/evidence/usage-analytics.json",
  "product/evidence/market-notes.md",
  "design/collector-lists-concept-study.md",
  "design/saved-searches-ux-brief.md",
  "design/local-design-context.json",
  ".github/copilot-instructions.md",
  ".github/instructions/product-evidence.instructions.md",
  ".github/instructions/workflow-safety.instructions.md",
  ".github/prompts/repository-feature-assessment.prompt.md",
  ".github/prompts/evidence-to-spec.prompt.md",
  ".github/prompts/figma-ux-review.prompt.md",
  ".github/prompts/epic-subissue-draft.prompt.md",
  ".github/prompts/roadmap-review.prompt.md",
  ".github/prompts/product-decision-brief.prompt.md",
  ".github/prompts/ui-change-preview.prompt.md",
  ".github/prompts/qa-test-plan.prompt.md",
  ".github/prompts/qa-change-verification.prompt.md",
  ".github/prompts/qa-bug-reproduction.prompt.md",
  ".github/prompts/roadmap-scenario-review.prompt.md",
  ".github/prompts/stakeholder-program-update.prompt.md",
  ".github/agents/product-strategist.agent.md",
  ".github/agents/ux-reviewer.agent.md",
  ".github/agents/delivery-planner.agent.md",
  ".github/agents/qa-engineer.agent.md",
  ".github/agents/issue-qa.agent.md",
  ".github/skills/roadmap-planning/SKILL.md",
  ".github/ISSUE_TEMPLATE/product-discovery.yml",
  ".github/ISSUE_TEMPLATE/epic.yml",
  ".github/ISSUE_TEMPLATE/design-review.yml",
  ".github/ISSUE_TEMPLATE/config.yml",
  ".github/PULL_REQUEST_TEMPLATE.md",
  ".github/workflows/holomart-agentic-qa.md",
  ".github/workflows/holomart-agentic-qa.lock.yml",
  ".gitattributes",
  "scripts/agentic-qa-evidence.mjs",
  "scripts/agentic-qa-browser.cjs",
  "scripts/roadmap-to-issues.mjs",
  "scripts/validate-artifacts.mjs",
  "test/agentic-qa-evidence.test.js",
  "docs/agentic-qa-demo.md",
  "docs/demo-operations.md",
  "docs/github-projects-setup.md",
  "docs/hands-on-keyboard-prompts.md"
];

function record(condition, message) {
  if (condition) checks.push(message);
  else errors.push(message);
}

async function exists(relativePath) {
  try {
    await access(path.join(ROOT, relativePath));
    return true;
  } catch {
    return false;
  }
}

async function readJson(relativePath) {
  try {
    return JSON.parse(await readFile(path.join(ROOT, relativePath), "utf8"));
  } catch (error) {
    errors.push(`${relativePath}: invalid or unreadable JSON (${error.message})`);
    return null;
  }
}

async function readText(relativePath) {
  try {
    return await readFile(path.join(ROOT, relativePath), "utf8");
  } catch (error) {
    errors.push(`${relativePath}: unreadable text (${error.message})`);
    return "";
  }
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function headingAnchorExists(markdown, fragment) {
  const normalizedFragment = decodeURIComponent(fragment).toLowerCase();
  return markdown.split(/\r?\n/).some((line) => {
    const match = /^(#{1,6})\s+(.+?)\s*$/.exec(line);
    if (!match) return false;
    const anchor = match[2]
      .replace(/[`*_~]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^\p{L}\p{N}\s-]/gu, "")
      .replace(/\s/g, "-");
    return anchor === normalizedFragment;
  });
}

async function validateLink(link, sourceRelativePath, evidenceId = null) {
  const [relativeTarget, fragment] = link.split("#", 2);
  const absoluteTarget = path.resolve(path.dirname(path.join(ROOT, sourceRelativePath)), relativeTarget);
  const relativeResolved = path.relative(ROOT, absoluteTarget);
  if (relativeResolved.startsWith("..") || path.isAbsolute(relativeResolved)) {
    errors.push(`${sourceRelativePath}: link escapes repository (${link})`);
    return;
  }
  try {
    const content = await readFile(absoluteTarget, "utf8");
    if (fragment && path.extname(absoluteTarget).toLowerCase() === ".md") {
      record(headingAnchorExists(content, fragment), `${sourceRelativePath}: missing heading fragment in ${link}`);
    }
    if (evidenceId) {
      record(content.includes(evidenceId), `${sourceRelativePath}: ${evidenceId} not found in ${link}`);
    }
  } catch {
    errors.push(`${sourceRelativePath}: linked file not found (${link})`);
  }
}

async function walk(relativeDirectory) {
  const absoluteDirectory = path.join(ROOT, relativeDirectory);
  let entries;
  try {
    entries = await readdir(absoluteDirectory, { withFileTypes: true });
  } catch {
    return [];
  }
  const files = [];
  for (const entry of entries) {
    const relativeEntry = path.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(relativeEntry));
    else files.push(relativeEntry);
  }
  return files;
}

for (const requiredFile of requiredFiles) {
  record(await exists(requiredFile), `required file missing: ${requiredFile}`);
}

const jsonFiles = [
  "product/roadmap.json",
  "product/roadmap.schema.json",
  "product/evidence/usage-analytics.json",
  "design/local-design-context.json",
  "design/tokens.json"
];
const parsedJson = new Map();
for (const jsonFile of jsonFiles) {
  parsedJson.set(jsonFile, await readJson(jsonFile));
}

const roadmap = parsedJson.get("product/roadmap.json");
if (roadmap) {
  record(roadmap.$schema === "./roadmap.schema.json", "roadmap: $schema must reference ./roadmap.schema.json");
  record(roadmap.schemaVersion === "1.0.0", "roadmap: unsupported schemaVersion");
  record(roadmap.metadata?.authoritative === true, "roadmap: metadata.authoritative must be true");
  record(roadmap.metadata?.provenance?.label === "SYNTHETIC / DEMO-ONLY", "roadmap: synthetic provenance label missing");
  record(Array.isArray(roadmap.horizons) && roadmap.horizons.length >= 3, "roadmap: expected at least three horizons");
  record(Array.isArray(roadmap.initiatives) && roadmap.initiatives.length > 0, "roadmap: initiatives must be non-empty");

  const horizonIds = new Set((roadmap.horizons ?? []).map(({ id }) => id));
  const initiativeIds = new Set();
  const workIds = new Set();
  const allDependencies = [];

  for (const initiative of roadmap.initiatives ?? []) {
    record(/^init-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(initiative.id), `roadmap: invalid initiative ID ${initiative.id}`);
    record(!initiativeIds.has(initiative.id), `roadmap: duplicate initiative ID ${initiative.id}`);
    initiativeIds.add(initiative.id);
    record(horizonIds.has(initiative.horizon), `roadmap: ${initiative.id} references unknown horizon ${initiative.horizon}`);
    record(initiative.evidenceCount === initiative.evidenceReferences?.length, `roadmap: ${initiative.id} evidenceCount mismatch`);
    record(Array.isArray(initiative.issueDraft?.childWorkItems) && initiative.issueDraft.childWorkItems.length > 0, `roadmap: ${initiative.id} has no child work`);

    const evidenceIds = new Set();
    for (const reference of initiative.evidenceReferences ?? []) {
      record(/^(CI|SS|AN|MK)-[0-9]{2}$/.test(reference.id), `roadmap: ${initiative.id} has invalid evidence ID ${reference.id}`);
      record(!evidenceIds.has(reference.id), `roadmap: ${initiative.id} repeats evidence ID ${reference.id}`);
      evidenceIds.add(reference.id);
      await validateLink(reference.path, "product/roadmap.json", reference.id);
    }

    let issuePlan;
    try {
      issuePlan = buildPlan(roadmap, initiative);
    } catch (error) {
      errors.push(`roadmap: ${initiative.id} issue preview failed (${error.message})`);
    }
    for (const item of initiative.issueDraft?.childWorkItems ?? []) {
      const generatedChild = issuePlan?.children.find(({ id }) => id === item.id);
      record(/^work-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.id), `roadmap: invalid work ID ${item.id}`);
      record(!workIds.has(item.id), `roadmap: duplicate work ID ${item.id}`);
      workIds.add(item.id);
      record(Array.isArray(item.acceptanceCriteria) && item.acceptanceCriteria.length > 0, `roadmap: ${item.id} needs acceptance criteria`);
      record(typeof generatedChild?.rationale === "string" && generatedChild.rationale.trim().length > 0, `roadmap: ${item.id} preview needs a rationale`);
      record(Array.isArray(generatedChild?.exclusions) && generatedChild.exclusions.length > 0, `roadmap: ${item.id} preview needs exclusions`);
      record(Array.isArray(generatedChild?.evidenceReferences) && generatedChild.evidenceReferences.length > 0, `roadmap: ${item.id} preview needs evidence references`);
      record(Array.isArray(generatedChild?.references) && generatedChild.references.length > 0, `roadmap: ${item.id} preview needs code, design, or product references`);
      record(Array.isArray(generatedChild?.validation) && generatedChild.validation.length > 0, `roadmap: ${item.id} preview needs validation steps`);
      for (const evidenceId of generatedChild?.evidenceReferences ?? []) {
        record(evidenceIds.has(evidenceId), `roadmap: ${item.id} references evidence ${evidenceId} outside ${initiative.id}`);
      }
      for (const reference of generatedChild?.references ?? []) {
        await validateLink(reference, "product/roadmap.json");
      }
      for (const dependency of item.dependencies ?? []) {
        allDependencies.push({ owner: item.id, dependency });
      }
    }
    for (const dependency of initiative.dependencies ?? []) {
      allDependencies.push({ owner: initiative.id, dependency });
    }
    for (const measure of initiative.successMeasures ?? []) {
      await validateLink(measure.source, "product/roadmap.json");
    }
  }

  for (const { owner, dependency } of allDependencies) {
    if (dependency.startsWith("init-")) {
      record(initiativeIds.has(dependency), `roadmap: ${owner} references unknown initiative dependency ${dependency}`);
    } else if (dependency.startsWith("work-")) {
      record(workIds.has(dependency), `roadmap: ${owner} references unknown work dependency ${dependency}`);
    } else {
      record(typeof dependency === "string" && dependency.trim().length > 0, `roadmap: ${owner} has an empty external dependency`);
    }
    record(owner !== dependency, `roadmap: ${owner} depends on itself`);
  }

  const internalEdges = new Map();
  for (const id of [...initiativeIds, ...workIds]) internalEdges.set(id, []);
  for (const { owner, dependency } of allDependencies) {
    if (internalEdges.has(owner) && internalEdges.has(dependency)) internalEdges.get(owner).push(dependency);
  }
  const visiting = new Set();
  const visited = new Set();
  function visit(id) {
    if (visiting.has(id)) {
      errors.push(`roadmap: dependency cycle includes ${id}`);
      return;
    }
    if (visited.has(id)) return;
    visiting.add(id);
    for (const dependency of internalEdges.get(id)) visit(dependency);
    visiting.delete(id);
    visited.add(id);
  }
  for (const id of internalEdges.keys()) visit(id);

  for (const source of roadmap.metadata?.sources ?? []) {
    await validateLink(source, "product/roadmap.json");
  }
}

const forbiddenConfigPaths = [
  ".mcp.json",
  ".github/mcp.json",
  ".github/copilot-mcp.json",
  ".env",
  ".env.local",
  "figma.config.json"
];
for (const forbiddenPath of forbiddenConfigPaths) {
  record(!(await exists(forbiddenPath)), `forbidden real integration or secret config present: ${forbiddenPath}`);
}

const forbiddenGeneratedFiles = [
  ".github/aw/actions-lock.json",
  ".poutine.yml"
];
for (const generatedFile of forbiddenGeneratedFiles) {
  record(!(await exists(generatedFile)), `generated tool file must not remain in the checkout: ${generatedFile}`);
}

const workflowSource = await readText(".github/workflows/holomart-agentic-qa.md");
const workflowLock = await readText(".github/workflows/holomart-agentic-qa.lock.yml");
const evidenceHarness = await readText("scripts/agentic-qa-evidence.mjs");
const browserHarness = await readText("scripts/agentic-qa-browser.cjs");
const qaRunbook = await readText("docs/agentic-qa-demo.md");

if (workflowSource) {
  const sourceChecks = [
    [/^  stale-check: full$/m, "workflow source: full stale-lock checks must remain enabled"],
    [/ref: \$\{\{ github\.event\.pull_request\.head\.sha \|\| inputs\.revision \}\}/, "workflow source: checkout must use the immutable PR head or manual revision"],
    [/QA_HEAD_SHA: \$\{\{ github\.event\.pull_request\.head\.sha \|\| inputs\.revision \}\}/, "workflow source: QA_HEAD_SHA must use the immutable tested revision"],
    [/QA_BASE_SHA: \$\{\{ github\.event\.pull_request\.base\.sha \|\| inputs\.base_revision \}\}/, "workflow source: QA_BASE_SHA must use the reviewed base revision"],
    [/^  github: false$/m, "workflow source: GitHub tools must remain disabled"],
    [/^  edit: false$/m, "workflow source: edit tools must remain disabled"],
    [/--deny-tool=write/, "workflow source: Copilot write tool denial is missing"],
    [/^  allowed-github-references: \[\]$/m, "workflow source: GitHub reference expansion must remain disabled"],
    [/^  threat-detection: false$/m, "workflow source: issue-writing detection reporting must remain disabled"],
    [/^  report-failure-as-issue: false$/m, "workflow source: failure issue reporting must remain disabled"],
    [/^  report-failed-jobs: false$/m, "workflow source: failed-job issue reporting must remain disabled"],
    [/^max-daily-ai-credits: -1$/m, "workflow source: issue-writing daily credit guardrail must remain disabled"],
    [/record-qa-verdict:/, "workflow source: non-networked structured verdict output is missing"],
    [/report:\r?\n\s+description: "Complete Markdown QA report/, "workflow source: independent Markdown report output is missing"],
    [/playwright@1\.51\.1/, "workflow source: deterministic Playwright runtime must stay pinned"],
    [/name: holomart-agentic-qa-evidence[\s\S]*?retention-days: 7/, "workflow source: bounded seven-day evidence upload is missing"],
    [/steps\.upload-qa-evidence\.outcome == 'success'/, "workflow source: bounded bundle cleanup guard is missing"],
    [/agentic-qa-evidence\.mjs cleanup/, "workflow source: staged QA bundle cleanup is missing"],
    [/node scripts\/agentic-qa-evidence\.mjs enforce/, "workflow source: final deterministic enforcement is missing"],
    [/SYNTHETIC \/ DEMO-ONLY/, "workflow source: synthetic provenance boundary is missing"],
    [/AI observation override/, "workflow source: deterministic authority boundary is missing"],
    [/Do not reward test volume or coverage alone\./, "workflow source: independent assertion-strength review is missing"]
  ];
  for (const [pattern, message] of sourceChecks) record(pattern.test(workflowSource), message);

  const bashTools = workflowSource.match(/^  bash:\r?\n([\s\S]*?)(?=^  [a-z-]+:|^safe-outputs:)/m)?.[1] ?? "";
  record(bashTools.length > 0, "workflow source: bounded shell tool allowlist is missing");
  record(
    !/^\s+-\s+"(?:git|gh|curl|wget|node|npm|npx|bash|sh|pwsh|powershell)\b/im.test(bashTools),
    "workflow source: agent shell allowlist exposes a repository, network, runtime, or shell command"
  );
  record(!/\b(?:run-code|upload|pdf|video|tracing)\b/i.test(bashTools), "workflow source: prohibited Playwright capability is exposed");
}

if (workflowLock) {
  const metadataMatch = /^# gh-aw-metadata: (\{.+\})$/m.exec(workflowLock);
  let metadata = null;
  try {
    metadata = metadataMatch ? JSON.parse(metadataMatch[1]) : null;
  } catch {
    // The explicit metadata check below reports the failure.
  }
  record(metadata?.schema_version === "v4", "workflow lock: gh-aw v4 metadata is missing");
  record(metadata?.compiler_version === "v0.85.4", "workflow lock: expected gh-aw compiler v0.85.4");
  record(metadata?.strict === true, "workflow lock: strict compilation metadata is missing");

  const sourceMatch = /^---\r?\n[\s\S]*?\r?\n---\r?\n?([\s\S]*)$/.exec(workflowSource);
  const normalizedBody = sourceMatch?.[1].trim().replace(/\r\n/g, "\n") ?? "";
  record(
    normalizedBody.length > 0 && metadata?.body_hash === sha256(normalizedBody),
    "workflow lock: prompt body hash is stale"
  );

  const writePermissions = [...workflowLock.matchAll(/^\s+([a-z-]+): write$/gm)].map((match) => match[1]);
  record(
    writePermissions.length === 1 && writePermissions[0] === "copilot-requests",
    `workflow lock: only copilot-requests may be write-scoped (found: ${writePermissions.join(", ") || "none"})`
  );
  record(/^permissions: \{\}$/m.test(workflowLock), "workflow lock: top-level permissions must default to none");
  record(/persist-credentials: false/.test(workflowLock), "workflow lock: checkout credentials must not persist");
  record(
    /ref: \$\{\{ github\.event\.pull_request\.head\.sha \|\| inputs\.revision \}\}/.test(workflowLock),
    "workflow lock: checkout does not target the immutable tested revision"
  );

  const prohibitedLockPatterns = [
    [/safe_outputs_auto_create_issue|["']create_issue["']|create_issue:/, "issue creation"],
    [/["']add_comment["']|add_comment:/, "comment creation"],
    [/["']create_pull_request["']|create_pull_request:/, "pull-request creation"],
    [/push_to_pull_request_branch|push-to-pull-request-branch/, "code push"],
    [/dispatch_repository|repository-dispatch/, "repository dispatch"],
    [/handle_detection_runs|report_failed_jobs/, "framework issue reporting"],
    [/target-repo|allowed-repos/, "cross-repository output"]
  ];
  for (const [pattern, operation] of prohibitedLockPatterns) {
    record(!pattern.test(workflowLock), `workflow lock: prohibited ${operation} path is compiled`);
  }

  const actionRefs = [...workflowLock.matchAll(/^\s+uses:\s+([^\s#]+)(?:\s+#.*)?$/gm)]
    .map((match) => match[1]);
  record(actionRefs.length > 0, "workflow lock: no action references found");
  for (const actionRef of actionRefs) {
    record(
      /@[0-9a-f]{40}$/.test(actionRef),
      `workflow lock: action reference is not pinned to a full commit SHA (${actionRef})`
    );
  }
  const containerRefs = [...workflowLock.matchAll(/^\s+container:\s+([^\s#]+)$/gm)]
    .map((match) => match[1]);
  for (const containerRef of containerRefs) {
    record(
      /@sha256:[0-9a-f]{64}$/.test(containerRef),
      `workflow lock: container is not pinned to a sha256 digest (${containerRef})`
    );
  }
}

if (evidenceHarness) {
  const evidenceChecks = [
    [/const MAX_DIFF_BYTES = 2 \* 1024 \* 1024;/, "evidence harness: 2 MB diff bound is missing"],
    [/const MAX_LOG_BYTES = 8 \* 1024 \* 1024;/, "evidence harness: 8 MB log bound is missing"],
    [/const MAX_ARTIFACT_BYTES = 50 \* 1024 \* 1024;/, "evidence harness: 50 MB bundle bound is missing"],
    [/const MAX_FILE_BYTES = 10 \* 1024 \* 1024;/, "evidence harness: 10 MB file bound is missing"],
    [/QA artifact directory must be outside the repository checkout/, "evidence harness: external artifact path guard is missing"],
    [/export function validateQaBaseUrl/, "evidence harness: testable loopback URL guard is missing"],
    [/repository checkout is dirty before QA execution/, "evidence harness: pre-run repository cleanliness check is missing"],
    [/"repository-clean"/, "evidence harness: post-run repository cleanliness check is missing"],
    [/checked out \$\{actualSha\}, expected immutable revision/, "evidence harness: immutable revision check is missing"],
    [/mulberry32-fisher-yates-v1/, "evidence harness: replay algorithm identifier is missing"],
    [/deterministicGatesAreBlocking: true/, "evidence harness: deterministic blocking policy is missing"],
    [/exploratoryReviewIsAdvisory: true/, "evidence harness: exploratory advisory policy is missing"],
    [/artifactRetentionDays: 7/, "evidence harness: seven-day evidence policy is missing"],
    [/validateIndependentReviewPayload/, "evidence harness: independent report schema validation is missing"],
    [/independent-review-evidence/, "evidence harness: independent review finalization check is missing"],
    [/89504e470d0a1a0a/, "evidence harness: exploratory PNG validation is missing"],
    [/async function cleanupEvidence/, "evidence harness: bounded bundle cleanup is missing"]
  ];
  for (const [pattern, message] of evidenceChecks) record(pattern.test(evidenceHarness), message);
}

if (browserHarness) {
  for (const caseId of ["QA-01", "QA-02", "QA-03", "QA-04", "QA-05", "QA-06", "QA-07"]) {
    record(browserHarness.includes(`id: "${caseId}"`), `browser harness: ${caseId} is missing`);
  }
  record(browserHarness.includes('const PROVENANCE = "SYNTHETIC / DEMO-ONLY";'), "browser harness: synthetic provenance is missing");
  record(/127\.0\.0\.1/.test(browserHarness), "browser harness: loopback default is missing");
  record(/run\(\)\.catch\(\(error\)/.test(browserHarness), "browser harness: structured infrastructure failure handler is missing");
}

if (qaRunbook) {
  const documentationChecks = [
    [/gh aw validate holomart-agentic-qa --strict --no-check-update/, "QA runbook: strict validation command is missing"],
    [/gh aw compile holomart-agentic-qa --action-mode release --action-tag 53843da968225dc56e1590978a7ed6407a8438ac --no-check-update/, "QA runbook: immutable gh-aw compile command is missing"],
    [/node scripts\\agentic-qa-evidence\.mjs prepare/, "QA runbook: local evidence preparation command is missing"],
    [/gh workflow run holomart-agentic-qa\.lock\.yml/, "QA runbook: approval-gated dispatch preview is missing"],
    [/gh run download/, "QA runbook: artifact download command is missing"],
    [/independent-review\.md/, "QA runbook: independent review artifact is not documented"],
    [/seven days/i, "QA runbook: evidence retention is not documented"],
    [/shadow repository/i, "QA runbook: optional shadow-repository decision is not documented"],
    [/separate approval/i, "QA runbook: shadow-repository approval boundary is missing"],
    [/SYNTHETIC \/ DEMO-ONLY/, "QA runbook: synthetic provenance boundary is missing"]
  ];
  for (const [pattern, message] of documentationChecks) record(pattern.test(qaRunbook), message);
}

const scanFiles = [
  ...await walk(".github"),
  ...await walk("scripts"),
  ...await walk("product"),
  ...await walk("design")
].filter((file) => !/\.(png|jpg|jpeg|gif|ico)$/i.test(file));
const qaPromptFiles = new Set([
  ".github/prompts/qa-test-plan.prompt.md",
  ".github/prompts/qa-change-verification.prompt.md",
  ".github/prompts/qa-bug-reproduction.prompt.md"
]);
const secretPatterns = [
  { name: "private key", pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { name: "GitHub token", pattern: /\bgh[psu]_[A-Za-z0-9]{30,}\b/ },
  { name: "AWS access key", pattern: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: "assigned secret", pattern: /\b(?:api[_-]?key|access[_-]?token|client[_-]?secret)\s*[:=]\s*["'][^"'\s]{12,}["']/i }
];
for (const relativeFile of scanFiles) {
  let content;
  try {
    content = await readFile(path.join(ROOT, relativeFile), "utf8");
  } catch {
    continue;
  }
  const portableFile = relativeFile.split(path.sep).join("/");
  for (const { name, pattern } of secretPatterns) {
    record(!pattern.test(content), `${relativeFile}: possible ${name}`);
  }
  if (qaPromptFiles.has(portableFile)) {
    record(/^agent:\s*qa-engineer\s*$/m.test(content), `${relativeFile}: must route to qa-engineer`);
  }
  if (relativeFile.endsWith(".agent.md")) {
    const frontmatter = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    record(Boolean(frontmatter), `${relativeFile}: missing agent frontmatter`);
    if (frontmatter) {
      record(!/\bfigma\b/i.test(frontmatter[1]), `${relativeFile}: Figma must not be enabled in agent frontmatter`);
      record(!/\bmcp\b/i.test(frontmatter[1]), `${relativeFile}: MCP tools/config must not be enabled in agent frontmatter`);
      if (portableFile === ".github/agents/qa-engineer.agent.md") {
        const toolsBlock = frontmatter[1].match(/^tools:\s*\r?\n((?:\s+-\s+[^\r\n]+\r?\n?)*)/m)?.[1] ?? "";
        const tools = toolsBlock
          .split(/\r?\n/)
          .map((line) => line.replace(/^\s*-\s*/, "").trim())
          .filter(Boolean);
        record(tools.join(",") === "read,search,execute,edit", `${relativeFile}: tools must be exactly read, search, execute, edit`);
        record(content.includes("Create or edit files under `test/**` only"), `${relativeFile}: test-only edit boundary missing`);
        record(content.includes("Never edit `app/**`, `src/**`, `scripts/**`, `product/**`, `design/**`"), `${relativeFile}: production edit boundary missing`);
        record(content.includes("Never commit, push, call `gh`"), `${relativeFile}: remote-write boundary missing`);
      }
    }
  }
}

if (errors.length) {
  console.error(`Artifact validation failed (${errors.length} error${errors.length === 1 ? "" : "s"}):`);
  for (const error of errors.sort()) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Artifact validation passed (${checks.length} checks).`);
  console.log(`Validated ${requiredFiles.length} required files, ${jsonFiles.length} JSON artifacts, roadmap references/dependencies, and secret/integration safety.`);
}
