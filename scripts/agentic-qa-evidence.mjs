#!/usr/bin/env node

import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  copyFile,
  mkdir,
  open,
  readFile,
  readdir,
  rm,
  stat,
  writeFile
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PROVENANCE = "SYNTHETIC / DEMO-ONLY";
const SCHEMA_VERSION = 1;
const MAX_DIFF_BYTES = 2 * 1024 * 1024;
const MAX_LOG_BYTES = 8 * 1024 * 1024;
const MAX_ARTIFACT_BYTES = 50 * 1024 * 1024;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const REQUIRED_GATES = Object.freeze([
  "artifact-validation",
  "unit-contracts",
  "integration-contracts",
  "full-node-suite",
  "issue-preview",
  "browser-e2e"
]);
const REQUIRED_BROWSER_CASES = Object.freeze([
  "QA-01",
  "QA-02",
  "QA-03",
  "QA-04",
  "QA-05",
  "QA-06",
  "QA-07"
]);

export const EXPLORATION_CHARTERS = Object.freeze([
  {
    id: "EX-01",
    title: "Rapid filter changes",
    objective: "Change query and facets quickly, then clear them; inspect count, URL, focus, and stale-result behavior.",
    evidence: "Capture the final state and any mismatch between controls, URL, count, and rendered cards."
  },
  {
    id: "EX-02",
    title: "Malformed local Saved Searches state",
    objective: "Set holomart.saved-searches.v1 to malformed JSON, reload, and inspect recovery without adding account or alert behavior.",
    evidence: "Capture the recovered Saved Searches panel, catalog availability, and browser console warnings."
  },
  {
    id: "EX-03",
    title: "Duplicate Saved Search names",
    objective: "Save two device-local searches with the same visible name but different filters; inspect ambiguity, apply, and delete behavior.",
    evidence: "Capture both entries and record whether the visible controls distinguish their filter state."
  },
  {
    id: "EX-04",
    title: "Keyboard and narrow reflow",
    objective: "Use keyboard-only navigation at 320 CSS pixels; inspect focus visibility, control order, dialog escape, and horizontal overflow.",
    evidence: "Capture the narrow viewport and identify the first reproducible keyboard or reflow problem."
  },
  {
    id: "EX-05",
    title: "Repeated demo-cart actions",
    objective: "Add several visible listings rapidly, reopen the demo cart, and inspect count, accessible name, and toast consistency.",
    evidence: "Capture the final cart state and record any disagreement between visible and accessible feedback."
  },
  {
    id: "EX-06",
    title: "Zero-result recovery churn",
    objective: "Alternate between a guaranteed no-match query and a valid query, using both recovery controls.",
    evidence: "Capture the zero-result state and record any hidden catalog, stale count, or URL residue after recovery."
  },
  {
    id: "EX-07",
    title: "Trust-copy consistency",
    objective: "Sample listing price context, condition, seller, stock, synthetic labels, and footer disclaimers at desktop and mobile sizes.",
    evidence: "Capture the strongest inconsistency or state that the sampled trust fields stayed aligned."
  },
  {
    id: "EX-08",
    title: "Saved Search reload lifecycle",
    objective: "Save, reload, apply, edit filters, reapply, and delete one device-local search while watching focus and feedback.",
    evidence: "Capture the post-reload entry and record any state loss, misleading persistence, or inaccessible feedback."
  }
]);

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function portable(relativePath) {
  return relativePath.split(path.sep).join("/");
}

function cleanMessage(error) {
  return (error instanceof Error ? error.message : String(error))
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 2000);
}

function validateSha(value, label) {
  assert(/^[0-9a-f]{40}$/i.test(value ?? ""), `${label} must be a full 40-character commit SHA`);
  return value.toLowerCase();
}

export function normalizeSeed(input, revision) {
  const normalizedRevision = validateSha(revision, "revision");
  const candidate = String(input ?? "auto").trim().toLowerCase();
  if (candidate === "" || candidate === "auto") {
    return Number.parseInt(normalizedRevision.slice(0, 8), 16) >>> 0;
  }
  assert(/^\d{1,10}$/.test(candidate), "seed must be 'auto' or an unsigned 32-bit integer");
  const parsed = Number(candidate);
  assert(Number.isSafeInteger(parsed) && parsed >= 0 && parsed <= 0xffffffff, "seed is outside the unsigned 32-bit range");
  return parsed >>> 0;
}

function seededGenerator(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 0x100000000;
  };
}

export function selectExplorationCharters(seed, count = 3, charters = EXPLORATION_CHARTERS) {
  assert(Number.isInteger(seed) && seed >= 0 && seed <= 0xffffffff, "seed must be an unsigned 32-bit integer");
  assert(Number.isInteger(count) && count > 0 && count <= charters.length, "charter count is out of range");
  const random = seededGenerator(seed);
  const indexes = charters.map((_, index) => index);
  for (let index = indexes.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [indexes[index], indexes[swapIndex]] = [indexes[swapIndex], indexes[index]];
  }
  return indexes.slice(0, count).map((index, order) => ({
    order: order + 1,
    ...charters[index],
    screenshot: `exploratory/explore-${order + 1}.png`
  }));
}

export function ensureExternalArtifactDirectory(root, candidate) {
  const resolvedRoot = path.resolve(root);
  const resolvedCandidate = path.resolve(candidate);
  const relative = path.relative(resolvedRoot, resolvedCandidate);
  const insideRoot = relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
  assert(!insideRoot, "QA artifact directory must be outside the repository checkout");
  return resolvedCandidate;
}

function artifactDirectory() {
  return ensureExternalArtifactDirectory(
    ROOT,
    process.env.QA_ARTIFACT_DIR ?? path.join(os.tmpdir(), "holomart-agentic-qa")
  );
}

function git(args, options = {}) {
  const result = spawnSync("git", args, {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: options.maxBuffer ?? MAX_LOG_BYTES,
    windowsHide: true
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`git ${args.join(" ")} failed: ${(result.stderr || result.stdout).trim()}`);
  }
  return result.stdout;
}

async function writeJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

function truncateText(value, maxBytes) {
  const bytes = Buffer.from(value);
  if (bytes.length <= maxBytes) return { text: value, truncated: false, originalBytes: bytes.length };
  const marker = "\n\n--- DIFF TRUNCATED BY QA EVIDENCE BOUND ---\n";
  const markerBytes = Buffer.byteLength(marker);
  return {
    text: `${bytes.subarray(0, maxBytes - markerBytes).toString("utf8")}${marker}`,
    truncated: true,
    originalBytes: bytes.length
  };
}

export function validateQaBaseUrl(value) {
  const baseUrl = new URL(value ?? "http://127.0.0.1:4173");
  assert(baseUrl.protocol === "http:", "QA_BASE_URL must use http for the loopback demo");
  assert(["127.0.0.1", "localhost"].includes(baseUrl.hostname), "QA_BASE_URL must remain on loopback");
  assert(/^\d+$/.test(baseUrl.port), "QA_BASE_URL must include an explicit port");
  return baseUrl;
}

function contextFromEnvironment() {
  const headSha = validateSha(process.env.QA_HEAD_SHA, "QA_HEAD_SHA");
  const baseSha = validateSha(process.env.QA_BASE_SHA, "QA_BASE_SHA");
  const seed = normalizeSeed(process.env.QA_SEED_INPUT, headSha);
  const baseUrl = validateQaBaseUrl(process.env.QA_BASE_URL);
  return {
    artifactDir: artifactDirectory(),
    baseSha,
    baseUrl,
    eventName: process.env.QA_EVENT_NAME ?? "local",
    headSha,
    repository: process.env.QA_REPOSITORY ?? "local/holomart",
    runId: process.env.QA_RUN_ID ?? "local",
    seed
  };
}

async function readServerLog(artifactDir) {
  try {
    return (await readFile(path.join(artifactDir, "logs", "server.log"), "utf8")).slice(-4000);
  } catch {
    return "server log unavailable";
  }
}

async function startServer(context) {
  const logsDir = path.join(context.artifactDir, "logs");
  const logHandle = await open(path.join(logsDir, "server.log"), "w");
  const server = spawn(process.execPath, [path.join(ROOT, "scripts", "serve.mjs")], {
    cwd: ROOT,
    detached: true,
    env: {
      ...process.env,
      HOST: context.baseUrl.hostname,
      PORT: context.baseUrl.port
    },
    stdio: ["ignore", logHandle.fd, logHandle.fd],
    windowsHide: true
  });
  await logHandle.close();
  await writeFile(path.join(context.artifactDir, "server.pid"), `${server.pid}\n`, "utf8");

  for (let attempt = 1; attempt <= 40; attempt += 1) {
    if (server.exitCode !== null) break;
    try {
      const response = await fetch(context.baseUrl, { redirect: "error" });
      const body = await response.text();
      const isHoloMart = body.includes("<title>HoloMart")
        && body.includes('content="HoloMart synthetic')
        && body.includes('id="catalog"');
      if (response.ok && isHoloMart) {
        await writeJson(path.join(context.artifactDir, "server.json"), {
          baseUrl: context.baseUrl.href,
          pid: server.pid,
          readinessAttempts: attempt
        });
        server.unref();
        return;
      }
    } catch {
      // Readiness polling is bounded and reports the captured server log on failure.
    }
    await delay(250);
  }

  if (server.exitCode === null) server.kill("SIGTERM");
  throw new Error(`HoloMart server did not become ready: ${await readServerLog(context.artifactDir)}`);
}

async function prepareEvidence() {
  const context = contextFromEnvironment();
  await mkdir(path.join(context.artifactDir, "logs"), { recursive: true });
  await mkdir(path.join(context.artifactDir, "browser", "screenshots"), { recursive: true });
  await mkdir(path.join(context.artifactDir, "exploratory"), { recursive: true });

  const actualSha = git(["rev-parse", "HEAD"]).trim().toLowerCase();
  assert(actualSha === context.headSha, `checked out ${actualSha}, expected immutable revision ${context.headSha}`);
  git(["cat-file", "-e", `${context.baseSha}^{commit}`]);

  const repositoryBefore = git(["status", "--porcelain=v1", "--untracked-files=all"]);
  await writeFile(path.join(context.artifactDir, "repository-before.txt"), repositoryBefore, "utf8");
  assert(repositoryBefore.trim() === "", "repository checkout is dirty before QA execution");

  const changedFiles = git(["diff", "--name-status", `${context.baseSha}...${context.headSha}`]);
  const rawDiff = git(["diff", "--no-ext-diff", "--unified=20", `${context.baseSha}...${context.headSha}`], {
    maxBuffer: MAX_DIFF_BYTES * 4
  });
  const boundedDiff = truncateText(rawDiff, MAX_DIFF_BYTES);
  await writeFile(path.join(context.artifactDir, "changed-files.txt"), changedFiles, "utf8");
  await writeFile(path.join(context.artifactDir, "changes.patch"), boundedDiff.text, "utf8");

  const selectedCharters = selectExplorationCharters(context.seed);
  await writeJson(path.join(context.artifactDir, "exploration-plan.json"), {
    schemaVersion: SCHEMA_VERSION,
    provenance: PROVENANCE,
    testedRevision: context.headSha,
    seed: context.seed,
    algorithm: "mulberry32-fisher-yates-v1",
    replayContract: "Use the same base SHA, head SHA, seed, charter order, and evidence paths. Model interpretation can still vary.",
    selectedCharters
  });

  const playwrightConfigPath = path.join(context.artifactDir, "playwright-cli.config.json");
  await writeJson(playwrightConfigPath, {
    browser: {
      browserName: "chromium",
      isolated: true,
      launchOptions: { headless: true },
      contextOptions: { viewport: { width: 1280, height: 900 } }
    },
    capabilities: ["core", "network", "storage", "devtools"],
    saveSession: false,
    outputDir: path.join(context.artifactDir, "exploratory"),
    outputMaxSize: 20 * 1024 * 1024,
    console: { level: "warning" },
    network: { allowedOrigins: [context.baseUrl.origin] },
    timeouts: { action: 7000, navigation: 20000, expect: 7000, settle: 300 },
    imageResponses: "omit",
    snapshot: { mode: "full" },
    allowUnrestrictedFileAccess: false,
    codegen: "none"
  });

  await writeJson(path.join(context.artifactDir, "manifest.json"), {
    schemaVersion: SCHEMA_VERSION,
    provenance: PROVENANCE,
    generatedAt: new Date().toISOString(),
    workflow: "holomart-agentic-qa",
    repository: context.repository,
    eventName: context.eventName,
    runId: context.runId,
    baseRevision: context.baseSha,
    testedRevision: context.headSha,
    checkedOutRevision: actualSha,
    seed: context.seed,
    diff: {
      originalBytes: boundedDiff.originalBytes,
      truncated: boundedDiff.truncated,
      changedFileCount: changedFiles.trim() ? changedFiles.trim().split(/\r?\n/).length : 0
    },
    evidencePolicy: {
      deterministicGatesAreBlocking: true,
      exploratoryReviewIsAdvisory: true,
      artifactRetentionDays: 7,
      repositoryWritesAllowed: false
    }
  });

  await startServer(context);
  console.log(`Prepared QA evidence for ${context.headSha} with seed ${context.seed}.`);
}

function commandDisplay(command, args) {
  return [command, ...args].join(" ");
}

export function npmInvocation(args, platform = process.platform, commandShell = process.env.ComSpec) {
  assert(
    Array.isArray(args) && args.length > 0 && args.every((arg) => /^[a-z0-9:@._-]+$/i.test(arg)),
    "npm gate arguments must be fixed command tokens"
  );
  if (platform === "win32") {
    return {
      command: commandShell || "cmd.exe",
      args: ["/d", "/s", "/c", `npm ${args.join(" ")}`]
    };
  }
  return { command: "npm", args };
}

async function runGate(artifactDir, gate) {
  const logRelativePath = `logs/${gate.id}.log`;
  const logPath = path.join(artifactDir, ...logRelativePath.split("/"));
  const startedAt = new Date().toISOString();
  const started = performance.now();
  const result = spawnSync(gate.command, gate.args, {
    cwd: ROOT,
    encoding: "utf8",
    env: process.env,
    maxBuffer: MAX_LOG_BYTES,
    timeout: gate.timeoutMs ?? 240000,
    windowsHide: true
  });
  const durationMs = Math.round(performance.now() - started);
  const output = [
    `$ ${commandDisplay(gate.command, gate.args)}`,
    "",
    result.stdout ?? "",
    result.stderr ?? "",
    result.error ? `Runner error: ${cleanMessage(result.error)}` : ""
  ].filter(Boolean).join("\n");
  await writeFile(logPath, `${output.trimEnd()}\n`, "utf8");
  const status = result.error ? "ERROR" : result.status === 0 ? "PASS" : "FAIL";
  return {
    id: gate.id,
    category: gate.category,
    status,
    command: commandDisplay(gate.command, gate.args),
    exitCode: result.status,
    signal: result.signal,
    startedAt,
    durationMs,
    log: logRelativePath,
    error: result.error ? cleanMessage(result.error) : ""
  };
}

function markdownCell(value) {
  return String(value).replaceAll("|", "\\|").replace(/\r?\n/g, " ");
}

export function deterministicGateDefinitions(
  platform = process.platform,
  commandShell = process.env.ComSpec
) {
  return [
    {
      id: "artifact-validation",
      category: "integration",
      ...npmInvocation(["run", "validate"], platform, commandShell)
    },
    {
      id: "unit-contracts",
      category: "unit",
      ...npmInvocation(["run", "test:unit"], platform, commandShell)
    },
    {
      id: "integration-contracts",
      category: "integration",
      ...npmInvocation(["run", "test:integration"], platform, commandShell)
    },
    {
      id: "full-node-suite",
      category: "regression",
      command: process.execPath,
      args: [
        "--test",
        "test/qa-change-risk.test.js",
        "test/agentic-qa-evidence.test.js"
      ]
    },
    {
      id: "issue-preview",
      category: "integration",
      ...npmInvocation(["run", "issues:preview:json"], platform, commandShell)
    },
    {
      id: "browser-e2e",
      category: "end-to-end",
      command: process.execPath,
      args: [path.join(ROOT, "scripts", "agentic-qa-browser.cjs")]
    }
  ];
}

async function runDeterministicGates() {
  const context = contextFromEnvironment();
  const manifest = await readJson(path.join(context.artifactDir, "manifest.json"));
  assert(manifest.testedRevision === context.headSha, "manifest revision does not match requested revision");
  const gates = deterministicGateDefinitions();

  const results = [];
  for (const gate of gates) results.push(await runGate(context.artifactDir, gate));
  const passed = results.filter(({ status }) => status === "PASS").length;
  const payload = {
    schemaVersion: SCHEMA_VERSION,
    provenance: PROVENANCE,
    generatedAt: new Date().toISOString(),
    testedRevision: context.headSha,
    baseRevision: context.baseSha,
    seed: context.seed,
    summary: {
      total: results.length,
      passed,
      failed: results.filter(({ status }) => status === "FAIL").length,
      errors: results.filter(({ status }) => status === "ERROR").length,
      conclusion: passed === results.length ? "PASS" : "FAIL"
    },
    gates: results
  };
  await writeJson(path.join(context.artifactDir, "deterministic-results.json"), payload);

  const report = [
    "# HoloMart deterministic QA evidence",
    "",
    `**${PROVENANCE}** - repository fixtures and the loopback app only.`,
    "",
    `Tested revision: \`${context.headSha}\``,
    `Base revision: \`${context.baseSha}\``,
    `Seed: \`${context.seed}\``,
    `Blocking result: **${payload.summary.conclusion}** (${passed}/${results.length} gates passed)`,
    "",
    "| Gate | Layer | Result | Command | Evidence |",
    "| --- | --- | --- | --- | --- |",
    ...results.map((result) =>
      `| ${result.id} | ${result.category} | ${result.status} | \`${markdownCell(result.command)}\` | \`${result.log}\` |`
    ),
    "",
    "The deterministic result is authoritative for workflow pass/fail. AI exploratory observations cannot override it."
  ].join("\n");
  await writeFile(path.join(context.artifactDir, "deterministic-report.md"), `${report}\n`, "utf8");
  console.log(`Deterministic QA result: ${payload.summary.conclusion} (${passed}/${results.length}).`);
}

export function validateDeterministicPayload(payload, expectedRevision) {
  assert(payload?.schemaVersion === SCHEMA_VERSION, "deterministic results schema is unsupported");
  assert(payload?.provenance === PROVENANCE, "deterministic results provenance is missing");
  assert(payload?.testedRevision === expectedRevision, "deterministic results reference a stale revision");
  assert(Array.isArray(payload?.gates), "deterministic results gates are missing");
  const receivedIds = payload.gates.map(({ id }) => id);
  assert(
    receivedIds.length === REQUIRED_GATES.length
      && REQUIRED_GATES.every((id) => receivedIds.filter((candidate) => candidate === id).length === 1),
    "deterministic results must contain every required gate exactly once"
  );
  for (const gate of payload.gates) {
    assert(["PASS", "FAIL", "ERROR"].includes(gate.status), `${gate.id} has an invalid status`);
    assert(typeof gate.command === "string" && gate.command.length > 0, `${gate.id} is missing its command`);
    assert(typeof gate.log === "string" && gate.log.startsWith("logs/"), `${gate.id} is missing its bounded log path`);
  }
  const passed = payload.gates.filter(({ status }) => status === "PASS").length;
  const failed = payload.gates.filter(({ status }) => status === "FAIL").length;
  const errors = payload.gates.filter(({ status }) => status === "ERROR").length;
  assert(payload.summary?.total === payload.gates.length, "deterministic summary total disagrees with gate results");
  assert(payload.summary?.passed === passed, "deterministic summary passed count disagrees with gate results");
  assert(payload.summary?.failed === failed, "deterministic summary failed count disagrees with gate results");
  assert(payload.summary?.errors === errors, "deterministic summary error count disagrees with gate results");
  const allPassed = payload.gates.every(({ status }) => status === "PASS");
  assert(payload.summary?.conclusion === (allPassed ? "PASS" : "FAIL"), "deterministic conclusion disagrees with gate results");
  return { allPassed, gateCount: payload.gates.length };
}

export function validateBrowserPayload(payload, expectedRevision) {
  assert(payload?.schemaVersion === SCHEMA_VERSION, "browser results schema is unsupported");
  assert(payload?.provenance === PROVENANCE, "browser results provenance is missing");
  assert(payload?.testedRevision === expectedRevision, "browser results reference a stale revision");
  assert(Array.isArray(payload?.cases), "browser results cases are missing");
  const receivedIds = payload.cases.map(({ id }) => id);
  assert(
    receivedIds.length === REQUIRED_BROWSER_CASES.length
      && REQUIRED_BROWSER_CASES.every((id) => receivedIds.filter((candidate) => candidate === id).length === 1),
    "browser results must contain QA-01 through QA-07 exactly once"
  );
  for (const testCase of payload.cases) {
    assert(["PASS", "FAIL", "ERROR"].includes(testCase.status), `${testCase.id} has an invalid status`);
    assert(typeof testCase.expected === "string" && testCase.expected.length > 0, `${testCase.id} is missing expected behavior`);
    assert(typeof testCase.observed === "string" && testCase.observed.length > 0, `${testCase.id} is missing observed behavior`);
    assert(typeof testCase.evidence === "string" && testCase.evidence.length > 0, `${testCase.id} is missing its evidence path`);
  }
  const passed = payload.cases.filter(({ status }) => status === "PASS").length;
  const failed = payload.cases.filter(({ status }) => status === "FAIL").length;
  const errors = payload.cases.filter(({ status }) => status === "ERROR").length;
  assert(payload.summary?.total === payload.cases.length, "browser summary total disagrees with case results");
  assert(payload.summary?.passed === passed, "browser summary passed count disagrees with case results");
  assert(payload.summary?.failed === failed, "browser summary failed count disagrees with case results");
  assert(payload.summary?.errors === errors, "browser summary error count disagrees with case results");
  const allPassed = payload.cases.every(({ status }) => status === "PASS");
  assert(payload.summary?.conclusion === (allPassed ? "PASS" : "FAIL"), "browser conclusion disagrees with case results");
  return { allPassed, caseCount: payload.cases.length };
}

export function validateIndependentReviewPayload(payload) {
  assert(Array.isArray(payload?.items), "agent output items are missing");
  const verdictItems = payload.items.filter(({ type }) => type === "record_qa_verdict");
  assert(verdictItems.length === 1, "agent output must contain exactly one record_qa_verdict item");
  const [item] = verdictItems;
  assert(["pass", "fail", "blocked"].includes(item.verdict), "independent QA verdict is invalid");
  assert(
    typeof item.summary === "string"
      && Buffer.byteLength(item.summary.trim(), "utf8") >= 10
      && Buffer.byteLength(item.summary, "utf8") <= 2000,
    "independent QA summary must be 10-2000 UTF-8 bytes"
  );
  assert(
    typeof item.report === "string"
      && Buffer.byteLength(item.report.trim(), "utf8") >= 200
      && Buffer.byteLength(item.report, "utf8") <= 50000,
    "independent QA report must be 200-50000 UTF-8 bytes"
  );
  for (const heading of [
    "### QA verdict",
    "### Deterministic evidence",
    "### Independent test-strength review",
    "### Seeded exploration",
    "### Residual risk"
  ]) {
    assert(item.report.includes(heading), `independent QA report is missing ${heading}`);
  }
  return {
    verdict: item.verdict,
    summary: item.summary.trim(),
    report: item.report.trim()
  };
}

async function collectIndependentReviewEvidence(context, deterministicPassed) {
  if (/^local(?:-|$)/.test(context.eventName)) {
    return {
      passed: true,
      detail: "independent agent evidence is not required for local deterministic replay"
    };
  }

  const ghAwRoot = path.resolve(context.artifactDir, "..", "..");
  const agentOutputPath = path.join(ghAwRoot, "agent_output.json");
  const payload = await readJson(agentOutputPath);
  const review = validateIndependentReviewPayload(payload);
  assert(deterministicPassed !== null, "deterministic evidence is unavailable for verdict comparison");
  const expectedVerdict = deterministicPassed ? "pass" : "fail";
  assert(
    review.verdict === expectedVerdict,
    `independent QA verdict ${review.verdict} disagrees with deterministic result ${expectedVerdict}`
  );
  assert(review.report.includes(context.headSha), "independent QA report omits the tested revision");
  assert(review.report.includes(String(context.seed)), "independent QA report omits the replay seed");

  const plan = await readJson(path.join(context.artifactDir, "exploration-plan.json"));
  assert(plan.testedRevision === context.headSha, "exploration plan references a stale revision");
  assert(plan.seed === context.seed, "exploration plan seed disagrees with the requested seed");
  assert(plan.selectedCharters?.length === 3, "exploration plan must contain exactly three charters");
  for (const charter of plan.selectedCharters) {
    assert(review.report.includes(charter.id), `independent QA report omits charter ${charter.id}`);
    assert(review.report.includes(charter.screenshot), `independent QA report omits ${charter.screenshot}`);
    assert(
      /^exploratory\/explore-[123]\.png$/.test(charter.screenshot),
      `exploration screenshot path is outside the fixed evidence contract: ${charter.screenshot}`
    );
    const screenshot = await readFile(path.join(context.artifactDir, ...charter.screenshot.split("/")));
    assert(
      screenshot.length > 8 && screenshot.subarray(0, 8).toString("hex") === "89504e470d0a1a0a",
      `${charter.screenshot} is not a non-empty PNG`
    );
  }

  await writeJson(path.join(context.artifactDir, "independent-verdict.json"), {
    schemaVersion: SCHEMA_VERSION,
    provenance: PROVENANCE,
    generatedAt: new Date().toISOString(),
    testedRevision: context.headSha,
    seed: context.seed,
    verdict: review.verdict,
    summary: review.summary,
    selectedCharters: plan.selectedCharters.map(({ id, screenshot }) => ({ id, screenshot }))
  });
  await writeFile(
    path.join(context.artifactDir, "independent-review.md"),
    `${review.report}\n`,
    "utf8"
  );
  await copyFile(agentOutputPath, path.join(context.artifactDir, "agent-output.json"));
  return {
    passed: true,
    detail: `recorded ${review.verdict} verdict and ${plan.selectedCharters.length} replay screenshots`
  };
}

async function processIsAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function stopServer(artifactDir) {
  let pid;
  try {
    pid = Number.parseInt((await readFile(path.join(artifactDir, "server.pid"), "utf8")).trim(), 10);
  } catch {
    return { stopped: false, detail: "server.pid is unavailable" };
  }
  if (!Number.isSafeInteger(pid) || pid <= 0) return { stopped: false, detail: "server.pid is invalid" };
  if (!(await processIsAlive(pid))) return { stopped: true, detail: `server process ${pid} had already exited` };
  try {
    process.kill(pid, "SIGTERM");
  } catch (error) {
    return { stopped: false, detail: cleanMessage(error) };
  }
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (!(await processIsAlive(pid))) return { stopped: true, detail: `stopped server process ${pid}` };
    await delay(100);
  }
  return { stopped: false, detail: `server process ${pid} did not stop after SIGTERM` };
}

async function walkFiles(directory, relative = "") {
  const entries = await readdir(path.join(directory, relative), { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const child = path.join(relative, entry.name);
    if (entry.isDirectory()) files.push(...await walkFiles(directory, child));
    else files.push(child);
  }
  return files;
}

async function inventoryArtifacts(artifactDir) {
  const excluded = new Set(["artifact-inventory.json", "checksums.sha256", "finalization.json"]);
  const files = (await walkFiles(artifactDir))
    .map(portable)
    .filter((file) => !excluded.has(file))
    .sort();
  const inventory = [];
  let totalBytes = 0;
  for (const relativePath of files) {
    const absolutePath = path.join(artifactDir, ...relativePath.split("/"));
    const fileStat = await stat(absolutePath);
    assert(fileStat.size <= MAX_FILE_BYTES, `${relativePath} exceeds the 10 MB per-file evidence bound`);
    const contents = await readFile(absolutePath);
    totalBytes += fileStat.size;
    inventory.push({
      path: relativePath,
      bytes: fileStat.size,
      sha256: createHash("sha256").update(contents).digest("hex")
    });
  }
  assert(totalBytes <= MAX_ARTIFACT_BYTES, "QA evidence exceeds the 50 MB artifact bound");
  return { files: inventory, totalBytes };
}

async function finalizeEvidence() {
  const context = contextFromEnvironment();
  await mkdir(context.artifactDir, { recursive: true });
  const checks = [];
  const addCheck = (id, passed, detail) => checks.push({ id, passed, detail });
  const server = await stopServer(context.artifactDir);
  addCheck("server-stopped", server.stopped, server.detail);

  let actualSha = "";
  try {
    actualSha = git(["rev-parse", "HEAD"]).trim().toLowerCase();
    addCheck("revision-current", actualSha === context.headSha, `checked out ${actualSha}; expected ${context.headSha}`);
  } catch (error) {
    addCheck("revision-current", false, cleanMessage(error));
  }

  let repositoryAfter = "";
  try {
    repositoryAfter = git(["status", "--porcelain=v1", "--untracked-files=all"]);
    addCheck(
      "repository-clean",
      repositoryAfter.trim() === "",
      repositoryAfter.trim() === "" ? "no tracked or untracked checkout changes" : repositoryAfter.trim()
    );
  } catch (error) {
    addCheck("repository-clean", false, cleanMessage(error));
  }
  await writeFile(path.join(context.artifactDir, "repository-after.txt"), repositoryAfter, "utf8");

  try {
    const manifest = await readJson(path.join(context.artifactDir, "manifest.json"));
    addCheck(
      "manifest-current",
      manifest.testedRevision === context.headSha
        && manifest.baseRevision === context.baseSha
        && manifest.seed === context.seed,
      `manifest head=${manifest.testedRevision}, base=${manifest.baseRevision}, seed=${manifest.seed}`
    );
  } catch (error) {
    addCheck("manifest-current", false, cleanMessage(error));
  }

  let deterministicPassed = null;
  try {
    const deterministic = await readJson(path.join(context.artifactDir, "deterministic-results.json"));
    const validation = validateDeterministicPayload(deterministic, context.headSha);
    deterministicPassed = validation.allPassed;
    addCheck(
      "deterministic-gates",
      validation.allPassed,
      `${validation.gateCount} required gates; conclusion=${deterministic.summary.conclusion}`
    );
  } catch (error) {
    addCheck("deterministic-gates", false, cleanMessage(error));
  }

  try {
    const browser = await readJson(path.join(context.artifactDir, "browser-results.json"));
    const validation = validateBrowserPayload(browser, context.headSha);
    addCheck(
      "browser-evidence",
      validation.allPassed,
      `${validation.caseCount} required browser cases; conclusion=${browser.summary?.conclusion ?? "unknown"}`
    );
  } catch (error) {
    addCheck("browser-evidence", false, cleanMessage(error));
  }

  try {
    const independentReview = await collectIndependentReviewEvidence(context, deterministicPassed);
    addCheck("independent-review-evidence", independentReview.passed, independentReview.detail);
  } catch (error) {
    addCheck("independent-review-evidence", false, cleanMessage(error));
  }

  let inventory = { files: [], totalBytes: 0 };
  try {
    inventory = await inventoryArtifacts(context.artifactDir);
    addCheck("artifact-bounds", true, `${inventory.files.length} files, ${inventory.totalBytes} bytes`);
  } catch (error) {
    addCheck("artifact-bounds", false, cleanMessage(error));
  }
  await writeJson(path.join(context.artifactDir, "artifact-inventory.json"), {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    totalBytes: inventory.totalBytes,
    files: inventory.files
  });
  await writeFile(
    path.join(context.artifactDir, "checksums.sha256"),
    `${inventory.files.map((file) => `${file.sha256}  ${file.path}`).join("\n")}\n`,
    "utf8"
  );

  const passed = checks.every(({ passed: checkPassed }) => checkPassed);
  await writeJson(path.join(context.artifactDir, "finalization.json"), {
    schemaVersion: SCHEMA_VERSION,
    provenance: PROVENANCE,
    generatedAt: new Date().toISOString(),
    testedRevision: context.headSha,
    baseRevision: context.baseSha,
    seed: context.seed,
    conclusion: passed ? "PASS" : "FAIL",
    checks
  });
  console.log(`QA evidence finalization: ${passed ? "PASS" : "FAIL"}.`);
}

async function enforceEvidence() {
  const context = contextFromEnvironment();
  const finalization = await readJson(path.join(context.artifactDir, "finalization.json"));
  assert(finalization.testedRevision === context.headSha, "finalization references a stale revision");
  if (finalization.conclusion !== "PASS") {
    for (const check of finalization.checks ?? []) {
      if (!check.passed) console.error(`- ${check.id}: ${check.detail}`);
    }
    throw new Error("QA evidence failed closed");
  }
  console.log(`All deterministic QA gates passed for ${context.headSha} (seed ${context.seed}).`);
}

async function cleanupEvidence() {
  const context = contextFromEnvironment();
  await rm(context.artifactDir, { recursive: true, force: true });
  console.log(`Removed staged QA evidence after its bounded-retention upload: ${context.artifactDir}`);
}

async function recordInfrastructureFailure(error) {
  try {
    const directory = artifactDirectory();
    await mkdir(directory, { recursive: true });
    await writeJson(path.join(directory, "infrastructure-error.json"), {
      schemaVersion: SCHEMA_VERSION,
      provenance: PROVENANCE,
      generatedAt: new Date().toISOString(),
      error: cleanMessage(error)
    });
  } catch {
    // The original error remains the actionable failure.
  }
}

async function main() {
  const command = process.argv[2];
  if (command === "prepare") return prepareEvidence();
  if (command === "run") return runDeterministicGates();
  if (command === "finalize") return finalizeEvidence();
  if (command === "enforce") return enforceEvidence();
  if (command === "cleanup") return cleanupEvidence();
  throw new Error("usage: node scripts/agentic-qa-evidence.mjs <prepare|run|finalize|enforce|cleanup>");
}

const isMain = process.argv[1]
  && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isMain) {
  main().catch(async (error) => {
    await recordInfrastructureFailure(error);
    console.error(cleanMessage(error));
    process.exitCode = 1;
  });
}
