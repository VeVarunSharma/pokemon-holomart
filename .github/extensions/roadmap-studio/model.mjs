import { readFile, realpath, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HORIZONS = new Set(["now", "next", "later"]);
const STATUSES = new Set(["discovery", "planned", "in-progress", "gated", "candidate"]);
const LEVELS = new Set(["low", "medium", "high"]);
const EFFORTS = new Set(["small", "medium", "large", "unknown"]);
const RISK_LEVELS = new Set(["low", "medium", "high", "unknown"]);
const DECISION_STATUSES = new Set(["open", "decided", "deferred"]);
const EVIDENCE_TYPES = new Set(["customer-interview", "support-signal", "usage-analytics", "market-note"]);
const MAX_FILE_BYTES = 5 * 1024 * 1024;

export class RoadmapError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "RoadmapError";
    this.code = code;
  }
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function fail(errors, location, message) {
  errors.push(`${location}: ${message}`);
}

function object(value, location, errors) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail(errors, location, "must be an object");
    return false;
  }
  return true;
}

function string(value, location, errors, pattern) {
  if (typeof value !== "string" || value.trim() === "") {
    fail(errors, location, "must be a non-empty string");
    return false;
  }
  if (pattern && !pattern.test(value)) {
    fail(errors, location, "has an invalid format");
    return false;
  }
  return true;
}

function array(value, location, errors, minimum = 0) {
  if (!Array.isArray(value)) {
    fail(errors, location, "must be an array");
    return false;
  }
  if (value.length < minimum) fail(errors, location, `must contain at least ${minimum} item(s)`);
  return true;
}

function enumeration(value, allowed, location, errors) {
  if (!allowed.has(value)) fail(errors, location, `must be one of ${[...allowed].join(", ")}`);
}

function exactKeys(value, allowed, required, location, errors) {
  for (const key of required) {
    if (!(key in value)) fail(errors, `${location}.${key}`, "is required");
  }
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) fail(errors, `${location}.${key}`, "is not allowed");
  }
}

function validateTargetWindow(value, location, errors) {
  if (!object(value, location, errors)) return;
  exactKeys(value, ["label", "start", "end"], ["label", "start", "end"], location, errors);
  string(value.label, `${location}.label`, errors);
  for (const key of ["start", "end"]) {
    if (value[key] !== null && (typeof value[key] !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value[key]))) {
      fail(errors, `${location}.${key}`, "must be an ISO date or null");
    }
  }
}

function validateEvidence(value, location, errors) {
  if (!object(value, location, errors)) return;
  exactKeys(value, ["id", "type", "path", "summary"], ["id", "type", "path", "summary"], location, errors);
  string(value.id, `${location}.id`, errors, /^(CI|SS|AN|MK)-\d{2}$/);
  enumeration(value.type, EVIDENCE_TYPES, `${location}.type`, errors);
  string(value.path, `${location}.path`, errors);
  string(value.summary, `${location}.summary`, errors);
}

function validateRisk(value, location, errors) {
  if (!object(value, location, errors)) return;
  exactKeys(value, ["id", "description", "likelihood", "impact", "mitigation"],
    ["id", "description", "likelihood", "impact", "mitigation"], location, errors);
  string(value.id, `${location}.id`, errors, /^risk-[a-z0-9]+(?:-[a-z0-9]+)*$/);
  string(value.description, `${location}.description`, errors);
  enumeration(value.likelihood, RISK_LEVELS, `${location}.likelihood`, errors);
  enumeration(value.impact, RISK_LEVELS, `${location}.impact`, errors);
  string(value.mitigation, `${location}.mitigation`, errors);
}

function validateDecision(value, location, errors) {
  if (!object(value, location, errors)) return;
  exactKeys(value, ["id", "question", "requiredBy", "status", "options"],
    ["id", "question", "requiredBy", "status", "options"], location, errors);
  string(value.id, `${location}.id`, errors, /^decision-[a-z0-9]+(?:-[a-z0-9]+)*$/);
  string(value.question, `${location}.question`, errors);
  string(value.requiredBy, `${location}.requiredBy`, errors);
  enumeration(value.status, DECISION_STATUSES, `${location}.status`, errors);
  if (array(value.options, `${location}.options`, errors, 2)) {
    value.options.forEach((item, index) => string(item, `${location}.options[${index}]`, errors));
  }
}

function validateMeasure(value, location, errors) {
  if (!object(value, location, errors)) return;
  exactKeys(value, ["metric", "criterion", "source", "guardrail"],
    ["metric", "criterion", "source", "guardrail"], location, errors);
  string(value.metric, `${location}.metric`, errors);
  string(value.criterion, `${location}.criterion`, errors);
  string(value.source, `${location}.source`, errors);
  if (typeof value.guardrail !== "boolean") fail(errors, `${location}.guardrail`, "must be a boolean");
}

function validateChild(value, location, errors) {
  if (!object(value, location, errors)) return;
  exactKeys(value, ["id", "title", "acceptanceCriteria", "dependencies"],
    ["id", "title", "acceptanceCriteria", "dependencies"], location, errors);
  string(value.id, `${location}.id`, errors, /^work-[a-z0-9]+(?:-[a-z0-9]+)*$/);
  string(value.title, `${location}.title`, errors);
  if (array(value.acceptanceCriteria, `${location}.acceptanceCriteria`, errors, 1)) {
    value.acceptanceCriteria.forEach((item, index) => string(item, `${location}.acceptanceCriteria[${index}]`, errors));
  }
  if (array(value.dependencies, `${location}.dependencies`, errors)) {
    value.dependencies.forEach((item, index) => string(item, `${location}.dependencies[${index}]`, errors));
    if (new Set(value.dependencies).size !== value.dependencies.length) fail(errors, `${location}.dependencies`, "must be unique");
  }
}

function validateIssueDraft(value, location, errors) {
  if (!object(value, location, errors)) return;
  exactKeys(value, ["title", "body", "labels", "childWorkItems"],
    ["title", "body", "labels", "childWorkItems"], location, errors);
  string(value.title, `${location}.title`, errors);
  string(value.body, `${location}.body`, errors);
  if (array(value.labels, `${location}.labels`, errors)) {
    value.labels.forEach((item, index) => string(item, `${location}.labels[${index}]`, errors));
  }
  if (array(value.childWorkItems, `${location}.childWorkItems`, errors, 1)) {
    value.childWorkItems.forEach((item, index) => validateChild(item, `${location}.childWorkItems[${index}]`, errors));
  }
}

function validateInitiative(value, index, errors) {
  const location = `initiatives[${index}]`;
  if (!object(value, location, errors)) return;
  const keys = ["id", "title", "outcome", "horizon", "status", "confidence", "impact", "effort",
    "targetWindow", "ownerRole", "dependencies", "evidenceReferences", "evidenceCount", "risks",
    "humanDecisionFlags", "successMeasures", "issueDraft"];
  exactKeys(value, keys, keys, location, errors);
  string(value.id, `${location}.id`, errors, /^init-[a-z0-9]+(?:-[a-z0-9]+)*$/);
  string(value.title, `${location}.title`, errors);
  string(value.outcome, `${location}.outcome`, errors);
  enumeration(value.horizon, HORIZONS, `${location}.horizon`, errors);
  enumeration(value.status, STATUSES, `${location}.status`, errors);
  enumeration(value.confidence, LEVELS, `${location}.confidence`, errors);
  enumeration(value.impact, LEVELS, `${location}.impact`, errors);
  enumeration(value.effort, EFFORTS, `${location}.effort`, errors);
  validateTargetWindow(value.targetWindow, `${location}.targetWindow`, errors);
  string(value.ownerRole, `${location}.ownerRole`, errors);
  if (array(value.dependencies, `${location}.dependencies`, errors)) {
    value.dependencies.forEach((item, itemIndex) => string(item, `${location}.dependencies[${itemIndex}]`, errors));
    if (new Set(value.dependencies).size !== value.dependencies.length) fail(errors, `${location}.dependencies`, "must be unique");
  }
  if (array(value.evidenceReferences, `${location}.evidenceReferences`, errors)) {
    value.evidenceReferences.forEach((item, itemIndex) => validateEvidence(item, `${location}.evidenceReferences[${itemIndex}]`, errors));
    if (value.evidenceCount !== value.evidenceReferences.length) {
      fail(errors, `${location}.evidenceCount`, "must equal evidenceReferences.length");
    }
  }
  if (!Number.isInteger(value.evidenceCount) || value.evidenceCount < 0) {
    fail(errors, `${location}.evidenceCount`, "must be a non-negative integer");
  }
  if (array(value.risks, `${location}.risks`, errors)) value.risks.forEach((item, itemIndex) => validateRisk(item, `${location}.risks[${itemIndex}]`, errors));
  if (array(value.humanDecisionFlags, `${location}.humanDecisionFlags`, errors)) value.humanDecisionFlags.forEach((item, itemIndex) => validateDecision(item, `${location}.humanDecisionFlags[${itemIndex}]`, errors));
  if (array(value.successMeasures, `${location}.successMeasures`, errors, 1)) value.successMeasures.forEach((item, itemIndex) => validateMeasure(item, `${location}.successMeasures[${itemIndex}]`, errors));
  validateIssueDraft(value.issueDraft, `${location}.issueDraft`, errors);
}

export function validateRoadmap(value, schema) {
  const errors = [];
  if (!object(value, "roadmap", errors)) throw new RoadmapError("roadmap_invalid", errors[0]);
  const topKeys = ["$schema", "schemaVersion", "metadata", "horizons", "initiatives"];
  exactKeys(value, topKeys, topKeys, "roadmap", errors);
  if (value.$schema !== "./roadmap.schema.json") fail(errors, "roadmap.$schema", "must equal ./roadmap.schema.json");
  if (value.schemaVersion !== "1.0.0") fail(errors, "roadmap.schemaVersion", "must equal 1.0.0");
  if (schema && (schema?.properties?.schemaVersion?.const !== "1.0.0" || !schema?.$defs?.initiative)) {
    fail(errors, "schema", "is not the supported roadmap schema");
  }
  if (object(value.metadata, "metadata", errors)) {
    const keys = ["product", "title", "updatedAt", "authoritative", "provenance", "sources"];
    exactKeys(value.metadata, keys, keys, "metadata", errors);
    string(value.metadata.product, "metadata.product", errors);
    string(value.metadata.title, "metadata.title", errors);
    if (typeof value.metadata.updatedAt !== "string" || Number.isNaN(Date.parse(value.metadata.updatedAt))) {
      fail(errors, "metadata.updatedAt", "must be an ISO date-time");
    }
    if (value.metadata.authoritative !== true) fail(errors, "metadata.authoritative", "must be true");
    if (object(value.metadata.provenance, "metadata.provenance", errors)) {
      exactKeys(value.metadata.provenance, ["label", "description", "limitations"],
        ["label", "description", "limitations"], "metadata.provenance", errors);
      if (value.metadata.provenance.label !== "SYNTHETIC / DEMO-ONLY") fail(errors, "metadata.provenance.label", "must identify demo-only data");
      string(value.metadata.provenance.description, "metadata.provenance.description", errors);
      if (array(value.metadata.provenance.limitations, "metadata.provenance.limitations", errors, 1)) {
        value.metadata.provenance.limitations.forEach((item, index) => string(item, `metadata.provenance.limitations[${index}]`, errors));
      }
    }
    if (array(value.metadata.sources, "metadata.sources", errors, 1)) {
      value.metadata.sources.forEach((item, index) => string(item, `metadata.sources[${index}]`, errors));
    }
  }
  if (array(value.horizons, "horizons", errors, 3)) {
    const seen = new Set();
    value.horizons.forEach((horizon, index) => {
      const location = `horizons[${index}]`;
      if (!object(horizon, location, errors)) return;
      exactKeys(horizon, ["id", "label", "order", "definition"], ["id", "label", "order", "definition"], location, errors);
      enumeration(horizon.id, HORIZONS, `${location}.id`, errors);
      string(horizon.label, `${location}.label`, errors);
      if (!Number.isInteger(horizon.order) || horizon.order < 1) fail(errors, `${location}.order`, "must be a positive integer");
      string(horizon.definition, `${location}.definition`, errors);
      if (seen.has(horizon.id)) fail(errors, `${location}.id`, "must be unique");
      seen.add(horizon.id);
    });
    for (const id of HORIZONS) if (!seen.has(id)) fail(errors, "horizons", `must include ${id}`);
  }
  if (array(value.initiatives, "initiatives", errors, 1)) {
    value.initiatives.forEach((item, index) => validateInitiative(item, index, errors));
    const ids = value.initiatives.map((item) => item?.id);
    if (new Set(ids).size !== ids.length) fail(errors, "initiatives", "initiative ids must be unique");
  }
  if (errors.length) {
    const suffix = errors.length > 1 ? ` (+${errors.length - 1} more)` : "";
    throw new RoadmapError("roadmap_invalid", `${errors[0]}${suffix}`);
  }
  return value;
}

function contained(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
}

export async function resolveRoadmapPath(workspacePath, requestedPath = "product/roadmap.json") {
  if (!workspacePath) throw new RoadmapError("workspace_unavailable", "The extension has no workspace path.");
  if (typeof requestedPath !== "string" || requestedPath.trim() === "") {
    throw new RoadmapError("roadmap_path_invalid", "Roadmap path must be a non-empty string.");
  }
  const root = await realpath(workspacePath);
  const candidate = path.resolve(root, requestedPath);
  if (path.extname(candidate).toLowerCase() !== ".json" || !contained(root, candidate)) {
    throw new RoadmapError("roadmap_path_invalid", "Roadmap path must identify a workspace-contained JSON file.");
  }
  let resolved;
  try {
    resolved = await realpath(candidate);
  } catch {
    throw new RoadmapError("roadmap_not_found", `Roadmap file was not found: ${requestedPath}`);
  }
  if (!contained(root, resolved)) {
    throw new RoadmapError("roadmap_path_invalid", "Roadmap symlink resolves outside the workspace.");
  }
  return { root, filePath: resolved, durablePath: path.relative(root, resolved) };
}

async function readJsonFile(filePath, label) {
  const details = await stat(filePath);
  if (!details.isFile()) throw new RoadmapError("roadmap_read_failed", `${label} is not a file.`);
  if (details.size > MAX_FILE_BYTES) throw new RoadmapError("roadmap_too_large", `${label} exceeds 5 MB.`);
  let text;
  try {
    text = await readFile(filePath, "utf8");
  } catch (error) {
    throw new RoadmapError("roadmap_read_failed", `Could not read ${label}: ${error.message}`);
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new RoadmapError("roadmap_json_invalid", `${label} is not valid JSON: ${error.message}`);
  }
}

export async function loadRoadmapFile(workspacePath, requestedPath = "product/roadmap.json") {
  const resolved = await resolveRoadmapPath(workspacePath, requestedPath);
  const roadmap = await readJsonFile(resolved.filePath, "Roadmap");
  if (typeof roadmap?.$schema !== "string") throw new RoadmapError("roadmap_invalid", "roadmap.$schema is required.");
  const schemaCandidate = path.resolve(path.dirname(resolved.filePath), roadmap.$schema);
  if (path.extname(schemaCandidate).toLowerCase() !== ".json" || !contained(resolved.root, schemaCandidate)) {
    throw new RoadmapError("schema_path_invalid", "Roadmap schema must be a workspace-contained JSON file.");
  }
  let schemaPath;
  try {
    schemaPath = await realpath(schemaCandidate);
  } catch {
    throw new RoadmapError("schema_not_found", `Roadmap schema was not found: ${roadmap.$schema}`);
  }
  if (!contained(resolved.root, schemaPath)) throw new RoadmapError("schema_path_invalid", "Roadmap schema resolves outside the workspace.");
  const schema = await readJsonFile(schemaPath, "Roadmap schema");
  validateRoadmap(roadmap, schema);
  return { roadmap, schema, filePath: resolved.filePath, durablePath: resolved.durablePath };
}

export function filterInitiatives(roadmap, { horizon = "all", status = "all" } = {}) {
  if (horizon !== "all" && !HORIZONS.has(horizon)) throw new RoadmapError("filter_invalid", `Unknown horizon: ${horizon}`);
  if (status !== "all" && !STATUSES.has(status)) throw new RoadmapError("filter_invalid", `Unknown status: ${status}`);
  return roadmap.initiatives.filter((initiative) =>
    (horizon === "all" || initiative.horizon === horizon) &&
    (status === "all" || initiative.status === status));
}

export function focusInitiative(roadmap, initiativeId) {
  if (typeof initiativeId !== "string" || initiativeId.trim() === "") {
    throw new RoadmapError("initiative_id_invalid", "initiativeId is required.");
  }
  const initiative = roadmap.initiatives.find((item) => item.id === initiativeId);
  if (!initiative) throw new RoadmapError("initiative_not_found", `Unknown initiative id: ${initiativeId}`);
  return initiative;
}

export function resolveRenderFocus(searchParams, currentFocus = null) {
  if (!searchParams.has("focus")) return currentFocus ?? null;
  return searchParams.get("focus") || null;
}

export function resolveInitiativeFocus(roadmap, focus) {
  if (typeof focus !== "string" || focus.trim() === "") {
    throw new RoadmapError("initiative_id_invalid", "initiativeFocus must be a non-empty string.");
  }
  const normalized = focus.trim().toLowerCase();
  const exact = roadmap.initiatives.find((item) => item.id.toLowerCase() === normalized);
  if (exact) return exact;
  const matches = roadmap.initiatives.filter((item) =>
    item.id.toLowerCase().includes(normalized) ||
    item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").includes(normalized));
  if (matches.length === 1) return matches[0];
  if (matches.length > 1) {
    throw new RoadmapError("initiative_focus_ambiguous", `Initiative focus is ambiguous: ${focus}`);
  }
  throw new RoadmapError("initiative_not_found", `Unknown initiative focus: ${focus}`);
}

export function projectWorkspaceFromExtension(extensionUrl) {
  const extensionDirectory = path.dirname(fileURLToPath(extensionUrl));
  return path.resolve(extensionDirectory, "..", "..", "..");
}

export async function prepareRoadmapOpen(workspacePath, input = {}) {
  const roadmapPath = input?.roadmapPath ?? "product/roadmap.json";
  const loaded = await loadRoadmapFile(workspacePath, roadmapPath);
  const requestedFocus = input?.initiativeFocus ?? null;
  const focus = requestedFocus ? resolveInitiativeFocus(loaded.roadmap, requestedFocus).id : null;
  return { ...loaded, roadmapPath, focus };
}

function bullets(values, render = (value) => value) {
  return values.length ? values.map((value) => `- ${render(value)}`).join("\n") : "- None";
}

function md(value) {
  return String(value ?? "").replace(/\r?\n/g, " ").trim();
}

export function draftHandoff(roadmap, initiativeId) {
  const item = focusInitiative(roadmap, initiativeId);
  const children = item.issueDraft.childWorkItems.map((child) => {
    const criteria = child.acceptanceCriteria.map((criterion) => `  - ${md(criterion)}`).join("\n");
    const dependencies = child.dependencies.length ? child.dependencies.map(md).join(", ") : "None";
    return `- **${md(child.id)} — ${md(child.title)}**\n${criteria}\n  - Dependencies: ${dependencies}`;
  }).join("\n");
  return `# Product-to-Engineering handoff: ${md(item.title)}

**Initiative:** \`${md(item.id)}\`<br>
**Horizon / status:** ${md(item.horizon)} / ${md(item.status)}<br>
**Confidence / impact / effort:** ${md(item.confidence)} / ${md(item.impact)} / ${md(item.effort)}<br>
**Target window:** ${md(item.targetWindow.label)} (${md(item.targetWindow.start ?? "unscheduled")} – ${md(item.targetWindow.end ?? "unscheduled")})<br>
**Owner role:** ${md(item.ownerRole)}

## Outcome
${md(item.outcome)}

## Scope
${item.issueDraft.body.trim()}

### Child work
${children}

## Dependencies
${bullets(item.dependencies, md)}

## Evidence (${item.evidenceCount})
${bullets(item.evidenceReferences, (evidence) => `**${md(evidence.id)}** (${md(evidence.type)}): ${md(evidence.summary)} — \`${md(evidence.path)}\``)}

## Risks
${bullets(item.risks, (risk) => `**${md(risk.id)}** [${md(risk.likelihood)} likelihood / ${md(risk.impact)} impact]: ${md(risk.description)} Mitigation: ${md(risk.mitigation)}`)}

## Success measures
${bullets(item.successMeasures, (measure) => `**${md(measure.metric)}${measure.guardrail ? " (guardrail)" : ""}:** ${md(measure.criterion)} Source: \`${md(measure.source)}\``)}

## Human decisions
${bullets(item.humanDecisionFlags, (decision) => `**${md(decision.id)}** [${md(decision.status)}] ${md(decision.question)} Required by: ${md(decision.requiredBy)} Options: ${decision.options.map(md).join("; ")}`)}
`;
}

export function roadmapMetadata(roadmap, durablePath, focusedInitiativeId = null) {
  return {
    roadmapPath: durablePath,
    product: roadmap.metadata.product,
    title: roadmap.metadata.title,
    updatedAt: roadmap.metadata.updatedAt,
    initiativeCount: roadmap.initiatives.length,
    focusedInitiativeId,
  };
}
