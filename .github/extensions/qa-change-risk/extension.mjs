import { spawn } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { CanvasError, createCanvas, joinSession } from "@github/copilot-sdk/extension";
import {
  QAError,
  analysisStateFileName,
  analyzeWorkspace,
  assertResultModel,
  buildSummary,
  createManualCase,
  planItems,
  projectWorkspaceFromExtension,
  reconcileAssessmentState,
  recordManualResult,
  recordRiskReview,
  reportedIncompleteTests,
  releaseReadiness,
  validateAnalysisId,
  validateBaseRef,
  validateFocusPaths,
  validateSafeRecommendation,
  appendBoundedOutput,
} from "./model.mjs";
import { renderShell } from "./renderer.mjs";

const MAX_REQUEST_BYTES = 64 * 1024;
const MAX_RUN_HISTORY = 30;
const CONFIRMATION_TTL_MS = 5 * 60 * 1000;
const PROCESS_STOP_TIMEOUT_MS = 2_000;
const panels = new Map();
const analyses = new Map();
const analysisInitializations = new Map();
const repositoryRoot = projectWorkspaceFromExtension(import.meta.url);
let sessionWorkspacePath;

function toCanvasError(error) {
  if (error instanceof CanvasError) return error;
  if (error instanceof QAError) return new CanvasError(error.code, error.message);
  return new CanvasError("qa_change_risk_failed", error instanceof Error ? error.message : "QA Change-Risk operation failed.");
}

function json(res, status, payload) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  });
  res.end(JSON.stringify(payload));
}

function text(res, status, contentType, value, fileName) {
  res.writeHead(status, {
    "content-type": contentType,
    "content-disposition": `attachment; filename="${fileName}"`,
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  });
  res.end(value);
}

async function requestBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_REQUEST_BYTES) throw new QAError("request_too_large", "Request body exceeds 64 KB.");
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  if (!String(req.headers["content-type"] ?? "").toLowerCase().startsWith("application/json")) {
    throw new QAError("content_type_invalid", "Request content type must be application/json.");
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new QAError("request_json_invalid", "Request body must be valid JSON.");
  }
}

function validateInputObject(input, allowed, required = []) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new QAError("input_invalid", "Input must be a JSON object.");
  }
  const unsupported = Object.keys(input).find((key) => !allowed.includes(key));
  if (unsupported) throw new QAError("input_invalid", `Unsupported input field: ${unsupported}`);
  const missing = required.find((key) => !(key in input));
  if (missing) throw new QAError("input_invalid", `Missing required input field: ${missing}`);
  return input;
}

function artifactPath(analysisId) {
  if (!sessionWorkspacePath) {
    throw new QAError("session_storage_unavailable", "Session artifact storage is unavailable.");
  }
  return path.join(sessionWorkspacePath, "files", "qa-change-risk", analysisStateFileName(analysisId));
}

function persistedState(record) {
  return {
    schemaVersion: "1.0.0",
    analysisId: record.id,
    assessmentFingerprint: record.assessment?.fingerprint ?? record.persistedFingerprint ?? null,
    manualCases: record.manualCases.map((item) => ({
      id: item.id,
      title: item.title,
      category: item.category,
      rationale: item.rationale,
      linkedRiskIds: item.linkedRiskIds,
    })),
    results: record.results,
    riskReviews: record.riskReviews,
  };
}

async function persistRecord(record) {
  const destination = artifactPath(record.id);
  await mkdir(path.dirname(destination), { recursive: true });
  record.persisting = (record.persisting ?? Promise.resolve()).catch(() => {}).then(() =>
    writeFile(destination, `${JSON.stringify(persistedState(record), null, 2)}\n`, { encoding: "utf8", mode: 0o600 }));
  await record.persisting;
}

async function loadPersisted(analysisId) {
  try {
    const parsed = JSON.parse(await readFile(artifactPath(analysisId), "utf8"));
    if (parsed?.schemaVersion !== "1.0.0" || parsed.analysisId !== analysisId) {
      throw new QAError("state_invalid", "Persisted QA state has an unsupported shape.");
    }
    const manualCases = Array.isArray(parsed.manualCases)
      ? parsed.manualCases.map((item) => createManualCase(item, item.id))
      : [];
    if (new Set(manualCases.map((item) => item.id)).size !== manualCases.length) {
      throw new QAError("state_invalid", "Persisted manual case IDs must be unique.");
    }
    const state = {
      manualCases,
      results: parsed.results && typeof parsed.results === "object" ? parsed.results : {},
      riskReviews: parsed.riskReviews && typeof parsed.riskReviews === "object" ? parsed.riskReviews : {},
      assessmentFingerprint: typeof parsed.assessmentFingerprint === "string" ? parsed.assessmentFingerprint : null,
    };
    assertResultModel(state);
    return state;
  } catch (error) {
    if (error?.code === "ENOENT") return { manualCases: [], results: {}, riskReviews: {}, assessmentFingerprint: null };
    if (error instanceof QAError) throw error;
    throw new QAError("state_invalid", "Persisted QA state is unreadable or invalid JSON.");
  }
}

function sameInputs(record, baseRef, focusPaths) {
  return record.baseRef === baseRef && JSON.stringify(record.focusPaths) === JSON.stringify(focusPaths);
}

function applyAssessment(record, assessment) {
  const reconciled = reconcileAssessmentState({
    assessment,
    manualCases: record.manualCases,
    existingResults: record.results,
    existingRiskReviews: record.riskReviews,
    previousFingerprint: record.assessment?.fingerprint ?? record.persistedFingerprint,
  });
  record.assessment = assessment;
  record.results = reconciled.results;
  record.riskReviews = reconciled.riskReviews;
  record.persistedFingerprint = assessment.fingerprint;
  record.resultsInvalidated = reconciled.evidenceChanged;
}

async function refreshRecordNow(record) {
  if (record.activeRuns.size) {
    throw new QAError("tests_running", "Wait for active test runs to finish or cancel them before refreshing the diff.");
  }
  const assessment = await analyzeWorkspace(repositoryRoot, {
    baseRef: record.baseRef,
    focusPaths: record.focusPaths,
  });
  applyAssessment(record, assessment);
  record.updatedAt = new Date().toISOString();
  await persistRecord(record);
  return record;
}

function queueRecordOperation(record, handler) {
  const operation = (record.operations ?? Promise.resolve()).catch(() => {}).then(handler);
  record.operations = operation.then(() => undefined, () => undefined);
  return operation;
}

function queueRefresh(record, nextInputs = null) {
  return queueRecordOperation(record, async () => {
    if (record.activeRuns.size) {
      throw new QAError("tests_running", "Wait for active test runs to finish or cancel them before refreshing the diff.");
    }
    if (nextInputs) {
      record.baseRef = nextInputs.baseRef;
      record.focusPaths = nextInputs.focusPaths;
    }
    return refreshRecordNow(record);
  });
}

async function initializeAnalysis(analysisId) {
  const existing = analyses.get(analysisId);
  if (existing) return existing;
  let initialization = analysisInitializations.get(analysisId);
  if (!initialization) {
    initialization = (async () => {
      const persisted = await loadPersisted(analysisId);
      const record = {
        id: analysisId,
        baseRef: null,
        focusPaths: [],
        assessment: null,
        persistedFingerprint: persisted.assessmentFingerprint,
        manualCases: persisted.manualCases,
        results: persisted.results,
        riskReviews: persisted.riskReviews,
        runs: [],
        activeRuns: new Map(),
        activeByTest: new Map(),
        pendingAssessment: null,
        persisting: Promise.resolve(),
        operations: Promise.resolve(),
        updatedAt: null,
      };
      analyses.set(analysisId, record);
      return record;
    })().finally(() => analysisInitializations.delete(analysisId));
    analysisInitializations.set(analysisId, initialization);
  }
  return initialization;
}

async function getAnalysis(input = {}) {
  const analysisId = validateAnalysisId(input.analysisId);
  const baseRef = validateBaseRef(input.baseRef);
  const focusPaths = validateFocusPaths(repositoryRoot, input.focusPaths);
  const record = await initializeAnalysis(analysisId);
  if (record.activeRuns.size) {
    if (!sameInputs(record, baseRef, focusPaths)) {
      throw new QAError("tests_running", "Analysis inputs cannot change while tests are active.");
    }
    return record;
  }
  return queueRefresh(record, { baseRef, focusPaths });
}

function publicRun(entry, run) {
  const active = entry.record.activeRuns.get(run.id);
  return {
    id: run.id,
    testId: run.testId,
    title: run.title,
    command: run.command,
    status: run.status,
    output: run.output,
    truncated: run.truncated,
    startedAt: run.startedAt,
    endedAt: run.endedAt,
    exitCode: run.exitCode,
    durationMs: run.durationMs,
    cancellable: Boolean(active && active.ownerInstanceId === entry.instanceId && ["queued", "running"].includes(run.status)),
  };
}

function snapshot(entry) {
  const record = entry.record;
  return {
    analysisId: record.id,
    updatedAt: record.updatedAt,
    assessment: record.assessment,
    riskReviews: record.riskReviews,
    plan: planItems(record).map((item) => ({
      ...item,
      result: record.results[item.id] ?? { status: "not-run", note: "", updatedAt: null, exitCode: null, durationMs: null },
    })),
    runs: record.runs.map((run) => publicRun(entry, run)),
    readiness: releaseReadiness(record),
    resultsInvalidated: Boolean(record.resultsInvalidated),
    persistence: "session-artifact",
  };
}

function broadcast(record) {
  const payload = `event: update\ndata: ${JSON.stringify({ analysisId: record.id })}\n\n`;
  for (const entry of panels.values()) {
    if (entry.record !== record) continue;
    for (const client of entry.sseClients) client.write(payload);
  }
}

function getEntry(instanceId) {
  const entry = panels.get(instanceId);
  if (!entry) throw new QAError("canvas_instance_unavailable", `QA Change-Risk instance is not open: ${instanceId}`);
  return entry;
}

function recommendation(record, testId) {
  const item = record.assessment.recommendations.find((candidate) => candidate.id === testId);
  if (!item) throw new QAError("test_item_not_found", `Unknown automated test-plan item: ${testId}`);
  return item;
}

async function previewCommands(entry, input) {
  validateInputObject(input, ["testIds"], ["testIds"]);
  if (!Array.isArray(input.testIds) || input.testIds.length < 1 || input.testIds.length > 20) {
    throw new QAError("test_selection_invalid", "Select between 1 and 20 automated tests.");
  }
  const testIds = [...new Set(input.testIds)];
  if (testIds.length !== input.testIds.length || testIds.some((value) => typeof value !== "string")) {
    throw new QAError("test_selection_invalid", "Test IDs must be unique strings.");
  }
  const commands = [];
  for (const testId of testIds) {
    if (entry.record.activeByTest.has(testId)) {
      throw new QAError("test_already_running", `Test is already queued or running: ${testId}`);
    }
    const item = recommendation(entry.record, testId);
    commands.push(await validateSafeRecommendation(repositoryRoot, item));
  }
  const confirmationId = randomUUID();
  entry.confirmations.clear();
  entry.confirmations.set(confirmationId, {
    testIds,
    assessmentFingerprint: entry.record.assessment.fingerprint,
    expiresAt: Date.now() + CONFIRMATION_TTL_MS,
  });
  return { confirmationId, commands: commands.map((command) => command.display), expiresInSeconds: CONFIRMATION_TTL_MS / 1000 };
}

async function finalizeRun(entry, run, error, exitCode) {
  if (run.finalized) return;
  run.finalized = true;
  const record = entry.record;
  const active = record.activeRuns.get(run.id);
  const isLastActive = record.activeRuns.size === 1 && Boolean(active);
  let latestAssessment = null;
  let evidenceError = null;
  if (run.startedAt || isLastActive) {
    try {
      latestAssessment = await analyzeWorkspace(repositoryRoot, {
        baseRef: record.baseRef,
        focusPaths: record.focusPaths,
      });
      record.pendingAssessment = latestAssessment;
    } catch (analysisError) {
      evidenceError = analysisError;
      record.pendingAssessment = null;
    }
  }
  const assessmentChanged = Boolean(
    latestAssessment && run.assessmentFingerprint &&
    latestAssessment.fingerprint !== run.assessmentFingerprint,
  );
  record.activeRuns.delete(run.id);
  record.activeByTest.delete(run.testId);
  run.endedAt = new Date().toISOString();
  run.durationMs = run.startedAt ? Date.parse(run.endedAt) - Date.parse(run.startedAt) : null;
  run.exitCode = Number.isInteger(exitCode) ? exitCode : null;
  const incompleteTests = ["npm-test", "targeted-node-test"].includes(run.commandId)
    ? reportedIncompleteTests(run.output)
    : { skipped: 0, todo: 0, total: 0 };
  if (evidenceError || assessmentChanged) {
    run.status = "blocked";
    const reason = evidenceError
      ? "Local Git evidence could not be revalidated after the command completed."
      : "Local Git evidence changed while the command was running.";
    const appended = appendBoundedOutput(run.output, `\n${reason} The result was discarded.\n`);
    run.output = appended.output;
    run.truncated ||= appended.truncated;
    record.results[run.testId] = {
      status: "blocked",
      note: `${reason} Refresh the assessment and rerun this check.`,
      updatedAt: run.endedAt,
      exitCode: run.exitCode,
      durationMs: run.durationMs,
    };
  } else if (run.cancelRequested) {
    run.status = "cancelled";
    record.results[run.testId] = {
      status: "blocked",
      note: "Cancelled by the user before completion.",
      updatedAt: run.endedAt,
      exitCode: run.exitCode,
      durationMs: run.durationMs,
    };
  } else if (error) {
    run.status = "blocked";
    const appended = appendBoundedOutput(run.output, `\n${error.message}\n`);
    run.output = appended.output;
    run.truncated ||= appended.truncated;
    record.results[run.testId] = {
      status: "blocked",
      note: "The allowlisted process could not complete.",
      updatedAt: run.endedAt,
      exitCode: run.exitCode,
      durationMs: run.durationMs,
    };
  } else if (exitCode === 0 && incompleteTests.total > 0) {
    run.status = "skipped";
    const incompleteSummary = [
      incompleteTests.skipped ? `${incompleteTests.skipped} skipped` : null,
      incompleteTests.todo ? `${incompleteTests.todo} TODO` : null,
    ].filter(Boolean).join(" and ");
    record.results[run.testId] = {
      status: "skipped",
      note: `The command exited successfully but reported ${incompleteSummary}; evidence remains incomplete.`,
      updatedAt: run.endedAt,
      exitCode: 0,
      durationMs: run.durationMs,
    };
  } else if (exitCode === 0) {
    run.status = "passed";
    record.results[run.testId] = {
      status: "pass",
      note: "",
      updatedAt: run.endedAt,
      exitCode: 0,
      durationMs: run.durationMs,
    };
  } else {
    run.status = "failed";
    record.results[run.testId] = {
      status: "fail",
      note: "The allowlisted command returned a non-zero exit code.",
      updatedAt: run.endedAt,
      exitCode: run.exitCode,
      durationMs: run.durationMs,
    };
  }
  if (!record.activeRuns.size && record.pendingAssessment) {
    const pendingAssessment = record.pendingAssessment;
    record.pendingAssessment = null;
    if (pendingAssessment.fingerprint !== record.assessment.fingerprint) {
      applyAssessment(record, pendingAssessment);
    }
  }
  if (active?.child) active.child.removeAllListeners();
  let persistenceError = null;
  try {
    await persistRecord(record);
  } catch (error) {
    persistenceError = error;
    run.status = "blocked";
    const appended = appendBoundedOutput(run.output, `\nResult metadata could not be persisted: ${error.message}\n`);
    run.output = appended.output;
    run.truncated ||= appended.truncated;
    record.results[run.testId] = {
      status: "blocked",
      note: "Result metadata could not be persisted to the session artifact.",
      updatedAt: run.endedAt,
      exitCode: run.exitCode,
      durationMs: run.durationMs,
    };
  } finally {
    broadcast(record);
    active?.resolveDone();
  }
  if (persistenceError) {
    throw new QAError("result_persistence_failed", "A test finished, but its result metadata could not be persisted.");
  }
  return { evidenceInvalid: Boolean(evidenceError || assessmentChanged) };
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

const WINDOWS_STOP_TREE_SCRIPT = [
  "& {",
  "param([int]$RootPid)",
  "$processes = @(Get-CimInstance Win32_Process | Select-Object ProcessId, ParentProcessId)",
  "$ids = [System.Collections.Generic.List[int]]::new()",
  "$ids.Add($RootPid)",
  "for ($index = 0; $index -lt $ids.Count; $index++) {",
  "  $parent = $ids[$index]",
  "  foreach ($item in $processes) {",
  "    $candidate = [int]$item.ProcessId",
  "    if ([int]$item.ParentProcessId -eq $parent -and -not $ids.Contains($candidate)) { $ids.Add($candidate) }",
  "  }",
  "}",
  "Stop-Process -Id $RootPid -Force -ErrorAction SilentlyContinue",
  "foreach ($id in $ids) { if ($id -ne $RootPid) { Stop-Process -Id $id -Force -ErrorAction SilentlyContinue } }",
  "}",
].join("\n");

function childExited(child) {
  return child.exitCode !== null || child.signalCode !== null;
}

async function terminateProcessTree(active) {
  const child = active.child;
  if (!child?.pid || childExited(child)) return;
  if (process.platform === "win32") {
    const powershell = path.join(
      process.env.SystemRoot || "C:\\Windows",
      "System32",
      "WindowsPowerShell",
      "v1.0",
      "powershell.exe",
    );
    await new Promise((resolve) => {
      const stopper = spawn(powershell, [
        "-NoProfile",
        "-NonInteractive",
        "-ExecutionPolicy",
        "Bypass",
        "-Command",
        WINDOWS_STOP_TREE_SCRIPT,
        String(child.pid),
      ], {
        shell: false,
        windowsHide: true,
        stdio: "ignore",
      });
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        resolve();
      };
      stopper.once("error", () => {
        if (!childExited(child)) child.kill();
        finish();
      });
      stopper.once("close", finish);
    });
    return;
  }
  try {
    process.kill(-child.pid, "SIGTERM");
  } catch {
    if (!childExited(child)) child.kill("SIGTERM");
  }
  await delay(PROCESS_STOP_TIMEOUT_MS);
  try {
    process.kill(-child.pid, "SIGKILL");
  } catch {
    if (!childExited(child)) child.kill("SIGKILL");
  }
}

async function executeRun(entry, run, item, command) {
  const record = entry.record;
  const active = record.activeRuns.get(run.id);
  if (!active || run.cancelRequested || entry.closed) {
    run.cancelRequested = true;
    return finalizeRun(entry, run, null, null);
  }
  run.status = "running";
  run.startedAt = new Date().toISOString();
  let child;
  try {
    child = spawn(command.executable, command.args, {
      cwd: repositoryRoot,
      shell: false,
      detached: process.platform !== "win32",
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    active.child = child;
  } catch (error) {
    return finalizeRun(entry, run, error, null);
  }
  const append = (chunk) => {
    const bounded = appendBoundedOutput(run.output, chunk);
    run.output = bounded.output;
    run.truncated ||= bounded.truncated;
    broadcast(record);
  };
  child.stdout?.on("data", append);
  child.stderr?.on("data", append);
  let spawnError = null;
  child.once("error", (error) => {
    spawnError = error;
  });
  const exitCode = await new Promise((resolve) => child.once("close", resolve));
  return finalizeRun(entry, run, spawnError, exitCode);
}

async function settleBatchFailure(entry, prepared, startIndex, error) {
  for (let index = startIndex; index < prepared.length; index += 1) {
    const run = prepared[index].run;
    if (run.finalized) continue;
    const active = entry.record.activeRuns.get(run.id);
    if (active?.child && !childExited(active.child)) {
      run.cancelRequested = true;
      await terminateProcessTree(active);
    }
    await finalizeRun(entry, run, error, null).catch(() => {});
  }
}

async function executeBatch(entry, prepared) {
  for (let index = 0; index < prepared.length; index += 1) {
    try {
      const outcome = await executeRun(entry, prepared[index].run, prepared[index].item, prepared[index].command);
      if (outcome?.evidenceInvalid) {
        await settleBatchFailure(
          entry,
          prepared,
          index + 1,
          new QAError("assessment_changed_during_run", "Local Git evidence changed or could not be verified during the test batch."),
        );
        return;
      }
    } catch (error) {
      await settleBatchFailure(entry, prepared, index, error);
      return;
    }
  }
}

async function startConfirmedRuns(entry, confirmationId) {
  if (typeof confirmationId !== "string") throw new QAError("confirmation_invalid", "A confirmation ID is required.");
  const confirmation = entry.confirmations.get(confirmationId);
  entry.confirmations.delete(confirmationId);
  if (!confirmation || confirmation.expiresAt < Date.now()) {
    throw new QAError("confirmation_expired", "Command confirmation is missing or expired. Review the exact commands again.");
  }
  const prepared = await queueRecordOperation(entry.record, async () => {
    await refreshRecordNow(entry.record);
    if (confirmation.assessmentFingerprint !== entry.record.assessment.fingerprint) {
      broadcast(entry.record);
      throw new QAError("assessment_changed", "Local Git evidence changed after command review. Review the refreshed plan and exact commands again.");
    }
    if (entry.closed) throw new QAError("canvas_instance_unavailable", "The canvas panel closed before tests could start.");
    const reserved = [];
    for (const testId of confirmation.testIds) {
      if (entry.record.activeByTest.has(testId)) {
        throw new QAError("test_already_running", `Test is already queued or running: ${testId}`);
      }
      const item = recommendation(entry.record, testId);
      reserved.push({ testId, item, command: await validateSafeRecommendation(repositoryRoot, item) });
    }
    for (const preparedRun of reserved) {
      const run = {
        id: randomUUID(),
        testId: preparedRun.testId,
        title: preparedRun.item.title,
        command: preparedRun.command.display,
        commandId: preparedRun.item.commandId,
        status: "queued",
        output: "",
        truncated: false,
        startedAt: null,
        endedAt: null,
        exitCode: null,
        durationMs: null,
        cancelRequested: false,
        finalized: false,
        assessmentFingerprint: entry.record.assessment.fingerprint,
      };
      entry.record.runs.unshift(run);
      entry.record.runs.splice(MAX_RUN_HISTORY);
      let resolveDone;
      const done = new Promise((resolve) => {
        resolveDone = resolve;
      });
      entry.record.activeRuns.set(run.id, {
        child: null,
        ownerInstanceId: entry.instanceId,
        testId: run.testId,
        done,
        resolveDone,
      });
      entry.record.activeByTest.set(run.testId, run.id);
      preparedRun.run = run;
    }
    return reserved;
  });
  broadcast(entry.record);
  void executeBatch(entry, prepared).catch(() => {});
  return { accepted: prepared.map(({ run }) => ({ runId: run.id, testId: run.testId })) };
}

async function cancelRun(entry, runId) {
  if (typeof runId !== "string") throw new QAError("run_id_invalid", "A run ID is required.");
  const active = entry.record.activeRuns.get(runId);
  const run = entry.record.runs.find((candidate) => candidate.id === runId);
  if (!active || !run) throw new QAError("run_not_active", `Run is not active: ${runId}`);
  if (active.ownerInstanceId !== entry.instanceId) {
    throw new QAError("run_not_owned", "This panel can only cancel a process that it started.");
  }
  run.cancelRequested = true;
  if (active.child && !childExited(active.child)) {
    await terminateProcessTree(active);
  } else {
    await finalizeRun(entry, run, null, null);
  }
  broadcast(entry.record);
  return { runId, cancellationRequested: true };
}

async function addManualCase(entry, input) {
  validateInputObject(input, ["title", "category", "rationale"], ["title", "category", "rationale"]);
  const item = createManualCase(input, `manual-user-${randomUUID()}`);
  entry.record.manualCases.push(item);
  entry.record.results[item.id] = { status: "not-run", note: "", updatedAt: null, exitCode: null, durationMs: null };
  await persistRecord(entry.record);
  broadcast(entry.record);
  return item;
}

async function saveManualResult(entry, input) {
  validateInputObject(input, ["itemId", "status", "note"], ["itemId", "status"]);
  const result = recordManualResult(entry.record, input.itemId, input.status, input.note ?? "");
  await persistRecord(entry.record);
  broadcast(entry.record);
  return result;
}

async function saveRiskReview(entry, input) {
  validateInputObject(input, ["riskId", "status"], ["riskId", "status"]);
  const result = recordRiskReview(entry.record, input.riskId, input.status);
  await persistRecord(entry.record);
  broadcast(entry.record);
  return result;
}

async function refreshEntry(entry) {
  entry.confirmations.clear();
  await queueRefresh(entry.record);
  broadcast(entry.record);
  return snapshot(entry);
}

async function route(entry, req, res) {
  const url = new URL(req.url ?? "/", "http://127.0.0.1");
  if (req.method === "GET" && url.pathname === "/") {
    const nonce = randomBytes(18).toString("base64");
    res.writeHead(200, {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "content-security-policy": `default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}'; connect-src 'self'; base-uri 'none'; form-action 'self'`,
      "referrer-policy": "no-referrer",
      "x-content-type-options": "nosniff",
    });
    res.end(renderShell(nonce));
    return;
  }
  if (req.method === "GET" && url.pathname === "/events") {
    res.writeHead(200, {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-store",
      "connection": "keep-alive",
      "x-content-type-options": "nosniff",
    });
    res.write(": connected\n\n");
    entry.sseClients.add(res);
    req.once("close", () => entry.sseClients.delete(res));
    return;
  }
  if (req.method === "GET" && url.pathname === "/api/state") {
    json(res, 200, snapshot(entry));
    return;
  }
  if (req.method === "GET" && url.pathname === "/api/export") {
    const summary = buildSummary(entry.record);
    if (url.searchParams.get("format") === "json") {
      text(res, 200, "application/json; charset=utf-8", `${JSON.stringify(summary.json, null, 2)}\n`, "qa-change-risk.json");
      return;
    }
    if (!url.searchParams.has("format") || url.searchParams.get("format") === "markdown") {
      text(res, 200, "text/markdown; charset=utf-8", `${summary.markdown}\n`, "qa-change-risk.md");
      return;
    }
    throw new QAError("export_format_invalid", "Export format must be markdown or json.");
  }
  if (req.method === "POST" && url.pathname === "/api/refresh") {
    json(res, 200, await refreshEntry(entry));
    return;
  }
  if (req.method === "POST" && url.pathname === "/api/manual-case") {
    json(res, 201, await addManualCase(entry, await requestBody(req)));
    return;
  }
  if (req.method === "POST" && url.pathname === "/api/manual-result") {
    json(res, 200, await saveManualResult(entry, await requestBody(req)));
    return;
  }
  if (req.method === "POST" && url.pathname === "/api/risk-review") {
    json(res, 200, await saveRiskReview(entry, await requestBody(req)));
    return;
  }
  if (req.method === "POST" && url.pathname === "/api/run/preview") {
    json(res, 200, await previewCommands(entry, await requestBody(req)));
    return;
  }
  if (req.method === "POST" && url.pathname === "/api/run") {
    const input = validateInputObject(await requestBody(req), ["confirmationId"], ["confirmationId"]);
    json(res, 202, await startConfirmedRuns(entry, input.confirmationId));
    return;
  }
  if (req.method === "POST" && url.pathname === "/api/run/cancel") {
    const input = validateInputObject(await requestBody(req), ["runId"], ["runId"]);
    json(res, 200, await cancelRun(entry, input.runId));
    return;
  }
  json(res, 404, { code: "endpoint_not_found", error: "Endpoint not found." });
}

async function startServer(entry) {
  const server = createServer(async (req, res) => {
    try {
      await route(entry, req, res);
    } catch (error) {
      const known = error instanceof QAError;
      json(res, known ? 400 : 500, {
        code: known ? error.code : "internal_error",
        error: error instanceof Error ? error.message : "Request failed.",
      });
    }
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  return { server, url: `http://127.0.0.1:${port}/` };
}

async function closeEntry(entry) {
  if (entry.closing) return entry.closing;
  entry.closing = (async () => {
    entry.closed = true;
    entry.confirmations.clear();
    const completions = [];
    for (const [runId, active] of [...entry.record.activeRuns]) {
      if (active.ownerInstanceId !== entry.instanceId) continue;
      const run = entry.record.runs.find((candidate) => candidate.id === runId);
      if (!run) continue;
      run.cancelRequested = true;
      completions.push(active.done);
      if (active.child && !childExited(active.child)) {
        await terminateProcessTree(active);
      } else {
        await finalizeRun(entry, run, null, null);
      }
    }
    await Promise.race([
      Promise.allSettled(completions),
      delay(PROCESS_STOP_TIMEOUT_MS + 1_000),
    ]);
    for (const client of entry.sseClients) client.end();
    entry.sseClients.clear();
    if (entry.server?.listening) {
      await new Promise((resolve) => entry.server.close(resolve));
    }
  })();
  return entry.closing;
}

let shutdownPromise = null;
function shutdownAll() {
  if (!shutdownPromise) {
    const entries = [...panels.values()];
    panels.clear();
    shutdownPromise = Promise.allSettled(entries.map((entry) => closeEntry(entry))).then(() => undefined);
  }
  return shutdownPromise;
}

const canvas = createCanvas({
  id: "qa-change-risk",
  displayName: "QA Change-Risk",
  description: "Turn a local Git diff into an evidence-backed risk assessment, test plan, and explicit test results.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    properties: {
      baseRef: { type: "string", minLength: 1, maxLength: 200 },
      focusPaths: {
        type: "array",
        maxItems: 50,
        uniqueItems: true,
        items: { type: "string", minLength: 1, maxLength: 500 },
      },
      analysisId: {
        type: "string",
        pattern: "^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$",
      },
    },
  },
  actions: [
    {
      name: "refresh_diff",
      description: "Reload local Git evidence and recompute the deterministic QA assessment without running tests.",
      inputSchema: { type: "object", additionalProperties: false },
      handler: async (ctx) => {
        try {
          return await refreshEntry(getEntry(ctx.instanceId));
        } catch (error) {
          throw toCanvasError(error);
        }
      },
    },
    {
      name: "get_test_plan",
      description: "Return current risks, test recommendations, evidence, and result states without executing tests.",
      inputSchema: { type: "object", additionalProperties: false },
      handler: (ctx) => {
        try {
          const current = snapshot(getEntry(ctx.instanceId));
          return {
            analysisId: current.analysisId,
            assessment: current.assessment,
            riskReviews: current.riskReviews,
            plan: current.plan,
            readiness: current.readiness,
          };
        } catch (error) {
          throw toCanvasError(error);
        }
      },
    },
    {
      name: "record_manual_result",
      description: "Record a validated status and note for an existing manual test-plan item.",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        required: ["itemId", "status"],
        properties: {
          itemId: { type: "string", minLength: 1 },
          status: { enum: ["pass", "fail", "blocked", "skipped", "not-run"] },
          note: { type: "string", maxLength: 2000 },
        },
      },
      handler: async (ctx) => {
        try {
          return await saveManualResult(getEntry(ctx.instanceId), ctx.input);
        } catch (error) {
          throw toCanvasError(error);
        }
      },
    },
    {
      name: "export_summary",
      description: "Return read-only Markdown and JSON QA evidence without writing remotely.",
      inputSchema: { type: "object", additionalProperties: false },
      handler: (ctx) => {
        try {
          return buildSummary(getEntry(ctx.instanceId).record);
        } catch (error) {
          throw toCanvasError(error);
        }
      },
    },
  ],
  open: async (ctx) => {
    try {
      if (shutdownPromise) throw new QAError("provider_shutting_down", "QA Change-Risk is shutting down.");
      const record = await getAnalysis(ctx.input ?? {});
      let entry = panels.get(ctx.instanceId);
      if (entry) {
        entry.record = record;
        entry.closed = false;
        entry.confirmations.clear();
      } else {
        entry = {
          instanceId: ctx.instanceId,
          record,
          confirmations: new Map(),
          sseClients: new Set(),
          closed: false,
          server: null,
          url: null,
        };
        Object.assign(entry, await startServer(entry));
        panels.set(ctx.instanceId, entry);
      }
      return {
        title: "QA Change-Risk",
        status: `${record.assessment.focusedChangeCount} local changes · ${record.assessment.risks.length} risks/decisions`,
        url: entry.url,
      };
    } catch (error) {
      throw toCanvasError(error);
    }
  },
  onClose: async (ctx) => {
    const entry = panels.get(ctx.instanceId);
    if (!entry) return;
    panels.delete(ctx.instanceId);
    await closeEntry(entry);
  },
});

const session = await joinSession({ canvases: [canvas] });
sessionWorkspacePath = session.workspacePath;
session.on("session.shutdown", () => {
  void shutdownAll();
});

let signalShutdownStarted = false;
function handleShutdownSignal() {
  if (signalShutdownStarted) return;
  signalShutdownStarted = true;
  const forcedExit = setTimeout(() => process.exit(1), 4_000);
  forcedExit.unref();
  void shutdownAll().finally(() => process.exit(0));
}

process.once("SIGTERM", handleShutdownSignal);
process.once("SIGINT", handleShutdownSignal);
