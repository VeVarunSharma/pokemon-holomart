#!/usr/bin/env node

import { access, readFile, readdir } from "node:fs/promises";
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
  "scripts/roadmap-to-issues.mjs",
  "scripts/validate-artifacts.mjs",
  "docs/github-projects-setup.md",
  "docs/hands-on-keyboard-prompts.md",
  "docs/qa-architecture.md"
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
