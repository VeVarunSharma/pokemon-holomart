import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  QAError,
  analysisStateFileName,
  analyzeWorkspace,
  appendBoundedOutput,
  buildSummary,
  createManualCase,
  escapeHtml,
  mergeResults,
  parseNameStatusZ,
  parseNumstatZ,
  parsePorcelainZ,
  parseUnifiedDiffHunks,
  recordManualResult,
  reconcileAssessmentState,
  releaseReadiness,
  reportedIncompleteTests,
  resolveWorkspacePath,
  scanTestDeclarations,
  validateAnalysisId,
  validateBaseRef,
  validateSafeRecommendation,
} from "../.github/extensions/qa-change-risk/model.mjs";
import { safeCommandFor } from "../.github/extensions/qa-change-risk/repo-config.mjs";
import { renderShell } from "../.github/extensions/qa-change-risk/renderer.mjs";

function git(root, args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

async function createRepository(t, { activeSavedSearchTest = true } = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), "qa-change-risk-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await Promise.all([
    mkdir(path.join(root, "src", "features", "saved-searches"), { recursive: true }),
    mkdir(path.join(root, "test"), { recursive: true }),
  ]);
  await writeFile(path.join(root, "package.json"), JSON.stringify({
    name: "fixture",
    private: true,
    type: "module",
    scripts: { test: "node --test", validate: "node -e \"process.exit(0)\"" },
  }));
  await writeFile(path.join(root, "src", "features", "saved-searches", "storage.js"), "export const value = 1;\n");
  await writeFile(
    path.join(root, "test", "saved-searches.test.js"),
    activeSavedSearchTest
      ? 'import test from "node:test";\ntest("active coverage", () => {});\ntest.todo("future behavior");\n'
      : 'import test from "node:test";\ntest.todo("future behavior");\n',
  );
  git(root, ["init", "--quiet"]);
  git(root, ["config", "user.email", "qa@example.invalid"]);
  git(root, ["config", "user.name", "QA Fixture"]);
  git(root, ["add", "."]);
  git(root, ["commit", "--quiet", "-m", "fixture"]);
  return root;
}

test("parses porcelain status with spaces, renames, deletes, and untracked files", () => {
  const raw = [
    "M  src/file one.js",
    "?? new file.txt",
    "R  src/new name.js",
    "src/old name.js",
    " D deleted.js",
    "",
  ].join("\0");
  const parsed = parsePorcelainZ(raw);
  assert.deepEqual(parsed.map(({ path, originalPath, changeType }) => ({ path, originalPath, changeType })), [
    { path: "src/file one.js", originalPath: null, changeType: "modified" },
    { path: "new file.txt", originalPath: null, changeType: "untracked" },
    { path: "src/new name.js", originalPath: "src/old name.js", changeType: "renamed" },
    { path: "deleted.js", originalPath: null, changeType: "deleted" },
  ]);
  assert.equal(parsed[0].staged, true);
  assert.equal(parsed[3].unstaged, true);
});

test("parses numstat text, binary, and NUL-delimited rename records", () => {
  const raw = [
    "10\t2\tfile one.js",
    "-\t-\tbinary.png",
    "5\t1\t",
    "old name.js",
    "new name.js",
    "",
  ].join("\0");
  assert.deepEqual(parseNumstatZ(raw), [
    { path: "file one.js", originalPath: null, added: 10, deleted: 2, binary: false },
    { path: "binary.png", originalPath: null, added: null, deleted: null, binary: true },
    { path: "new name.js", originalPath: "old name.js", added: 5, deleted: 1, binary: false },
  ]);
});

test("parses authoritative name-status records including renames and copies", () => {
  const raw = [
    "A",
    "empty.js",
    "D",
    "removed.js",
    "R100",
    "old name.js",
    "new name.js",
    "C75\tcopy source.js",
    "copy target.js",
    "",
  ].join("\0");
  assert.deepEqual(parseNameStatusZ(raw), [
    { path: "empty.js", originalPath: null, status: "A", changeType: "added" },
    { path: "removed.js", originalPath: null, status: "D", changeType: "deleted" },
    { path: "new name.js", originalPath: "old name.js", status: "R", changeType: "renamed" },
    { path: "copy target.js", originalPath: "copy source.js", status: "C", changeType: "copied" },
  ]);
});

test("parses changed line ranges for additions, edits, and deleted content", () => {
  const diff = [
    "diff --git a/src/a.js b/src/a.js",
    "--- a/src/a.js",
    "+++ b/src/a.js",
    "@@ -3,2 +3,4 @@",
    "@@ -20 +22,0 @@",
    "diff --git a/old.js b/old.js",
    "--- a/old.js",
    "+++ /dev/null",
    "@@ -1,2 +0,0 @@",
  ].join("\n");
  const hunks = parseUnifiedDiffHunks(diff);
  assert.deepEqual(hunks.get("src/a.js"), [
    { oldStart: 3, oldCount: 2, newStart: 3, newCount: 4 },
    { oldStart: 20, oldCount: 1, newStart: 22, newCount: 0 },
  ]);
  assert.deepEqual(hunks.get("old.js"), [
    { oldStart: 1, oldCount: 2, newStart: 0, newCount: 0 },
  ]);
});

test("rejects external paths and unsafe local ref syntax", () => {
  const root = path.resolve("fixture-root");
  assert.throws(() => resolveWorkspacePath(root, "..\\outside.js"), (error) =>
    error instanceof QAError && error.code === "path_invalid");
  assert.throws(() => resolveWorkspacePath(root, path.resolve(root, "absolute.js")), /Absolute paths/);
  assert.equal(validateBaseRef("main"), "main");
  assert.equal(validateBaseRef("feature/qa-risk"), "feature/qa-risk");
  assert.throws(() => validateBaseRef("--output=bad"), /simple local Git revision/);
  assert.throws(() => validateBaseRef("main..other"), /simple local Git revision/);
});

test("analysis IDs create stable domain keys independent of panel IDs", () => {
  assert.equal(validateAnalysisId("working-tree"), "working-tree");
  assert.match(analysisStateFileName("working-tree"), /^analysis-[a-f0-9]{64}\.json$/);
  assert.equal(analysisStateFileName("working-tree"), analysisStateFileName("working-tree"));
  assert.notEqual(analysisStateFileName("Risk"), analysisStateFileName("risk"));
  assert.throws(() => analysisStateFileName("../escape"), /analysisId/);
});

test("builds deterministic persistence risk and maps only active tests", async (t) => {
  const root = await createRepository(t);
  await writeFile(path.join(root, "src", "features", "saved-searches", "storage.js"), "export const value = 2;\n");
  const first = await analyzeWorkspace(root);
  const second = await analyzeWorkspace(root);
  const risk = first.risks.find((item) => item.id === "risk-saved-searches");
  assert.equal(risk.kind, "inferred");
  assert.equal(risk.impact, "high");
  assert.ok(risk.factors.some((factor) => factor.id === "persistence-state"));
  const mapped = first.recommendations.find((item) => item.testPath === "test/saved-searches.test.js");
  assert.equal(mapped.source, "existing");
  assert.equal(mapped.evidence[0].activeTests, 1);
  assert.equal(mapped.evidence[0].todoTests, 1);
  assert.ok(first.observations.every((item) => item.kind === "observed"));
  assert.ok(first.risks.some((item) => item.kind === "human-decision"));
  assert.deepEqual(first.risks, second.risks);
});

test("does not treat TODO declarations as implemented coverage", async (t) => {
  const root = await createRepository(t, { activeSavedSearchTest: false });
  await writeFile(path.join(root, "src", "features", "saved-searches", "storage.js"), "export const value = 3;\n");
  const assessment = await analyzeWorkspace(root);
  assert.equal(assessment.recommendations.some((item) => item.testPath === "test/saved-searches.test.js"), false);
  assert.ok(assessment.recommendations.some((item) => item.id === "proposed-saved-searches" && item.source === "proposed"));
  assert.ok(assessment.risks.find((item) => item.id === "risk-saved-searches").factors.some((factor) => factor.id === "missing-nearby-tests"));
});

test("ignores commented and explicitly disabled test declarations", () => {
  const declarations = scanTestDeclarations([
    'import test from "node:test";',
    '// test("commented line", () => {});',
    '/* test("commented block", () => {}); */',
    'test.skip("skipped modifier", () => {});',
    'test("skipped option", { skip: true }, () => {});',
    'test("todo option", { todo: "later" }, () => {});',
    'test("active", { skip: false }, () => {});',
    'test.only("active only", () => {});',
    'test.todo("future");',
    '/x/.test("x");',
    'test("dynamic options", options, () => {});',
    'test("shorthand skip", { skip }, () => {});',
    'test("spread options", { ...options }, () => {});',
    'test({ skip: true }, () => {});',
    'test("two argument todo", { todo: true });',
    'test("two argument skip", { skip: true });',
    'test("quoted skip", { "skip": true }, () => {});',
    'test("computed option", { [key]: true }, () => {});',
    'test("getter option", { get skip() { return true; } }, () => {});',
    'test("method option", { skip() {} }, () => {});',
    'test("expression option", { skip: false || true }, () => {});',
    'test("duplicate option", { skip: false, skip: true }, () => {});',
    'test("ambiguous two argument", options);',
    'test("statically safe options", { timeout: 50, skip: false, todo: false }, () => {});',
    'test("regex option", { pattern: /}/, skip: true }, () => {});',
  ].join("\n"));
  assert.deepEqual(declarations.activeLines, [7, 8, 24]);
  assert.equal(declarations.disabledCount, 15);
  assert.equal(declarations.todoCount, 3);
});

test("does not count shadowed or conditionally registered test bindings", () => {
  const shadowed = scanTestDeclarations([
    'import test from "node:test";',
    "function helper(test) {",
    '  test("not registered", () => {});',
    "}",
    'test("real but conservatively unresolved", () => {});',
  ].join("\n"));
  assert.deepEqual(shadowed, { activeLines: [], todoCount: 0, disabledCount: 0 });

  const conditional = scanTestDeclarations([
    'import test from "node:test";',
    "if (false)",
    'test("not registered", () => {});',
  ].join("\n"));
  assert.deepEqual(conditional, { activeLines: [], todoCount: 0, disabledCount: 0 });
});

test("does not claim tests changed without implementation when mapped implementation also changed", async (t) => {
  const root = await createRepository(t);
  await writeFile(path.join(root, "src", "features", "saved-searches", "storage.js"), "export const value = 6;\n");
  await writeFile(
    path.join(root, "test", "saved-searches.test.js"),
    'import test from "node:test";\ntest("updated coverage", () => {});\n',
  );
  const assessment = await analyzeWorkspace(root);
  const testRisk = assessment.risks.find((item) => item.id === "risk-tests");
  assert.equal(testRisk.factors.some((factor) => factor.id === "tests-without-implementation"), false);
});

test("includes committed branch changes when a local base ref is supplied", async (t) => {
  const root = await createRepository(t);
  const base = git(root, ["rev-parse", "HEAD"]);
  await writeFile(path.join(root, "src", "features", "saved-searches", "storage.js"), "export const value = 4;\n");
  git(root, ["add", "."]);
  git(root, ["commit", "--quiet", "-m", "branch change"]);
  const assessment = await analyzeWorkspace(root, { baseRef: base });
  assert.equal(assessment.changes.some((item) => item.path === "src/features/saved-searches/storage.js"), true);
  assert.equal(assessment.changes.find((item) => item.path === "src/features/saved-searches/storage.js").branchComparison, true);
});

test("uses name-status for empty, binary, and deleted committed changes", async (t) => {
  const root = await createRepository(t);
  const base = git(root, ["rev-parse", "HEAD"]);
  await writeFile(path.join(root, "src", "features", "saved-searches", "empty.js"), "");
  await writeFile(path.join(root, "src", "features", "saved-searches", "binary.dat"), Buffer.from([0, 1, 2, 3]));
  await rm(path.join(root, "src", "features", "saved-searches", "storage.js"));
  git(root, ["add", "."]);
  git(root, ["commit", "--quiet", "-m", "status shapes"]);
  const assessment = await analyzeWorkspace(root, { baseRef: base });
  assert.equal(assessment.changes.find((item) => item.path.endsWith("empty.js")).changeType, "added");
  assert.equal(assessment.changes.find((item) => item.path.endsWith("binary.dat")).changeType, "added");
  assert.equal(assessment.changes.find((item) => item.path.endsWith("storage.js")).changeType, "deleted");
});

test("uses merge-base semantics and excludes changes unique to an advanced base branch", async (t) => {
  const root = await createRepository(t);
  const currentBranch = git(root, ["branch", "--show-current"]);
  git(root, ["checkout", "--quiet", "-b", "advanced-base"]);
  await mkdir(path.join(root, "app"), { recursive: true });
  await writeFile(path.join(root, "app", "upstream-only.js"), "export const upstream = true;\n");
  git(root, ["add", "."]);
  git(root, ["commit", "--quiet", "-m", "upstream only"]);
  git(root, ["checkout", "--quiet", currentBranch]);
  await writeFile(path.join(root, "src", "features", "saved-searches", "storage.js"), "export const value = 5;\n");
  git(root, ["add", "."]);
  git(root, ["commit", "--quiet", "-m", "local branch change"]);
  const assessment = await analyzeWorkspace(root, { baseRef: "advanced-base" });
  assert.equal(assessment.changes.some((item) => item.path === "src/features/saved-searches/storage.js"), true);
  assert.equal(assessment.changes.some((item) => item.path === "app/upstream-only.js"), false);
  assert.notEqual(assessment.baseRefCommit, assessment.baseCommit);
});

test("canonicalizes root focus and includes rename source capabilities", async (t) => {
  const root = await createRepository(t);
  await writeFile(path.join(root, "src", "features", "saved-searches", "storage.js"), "export const value = 8;\n");
  const rootAssessment = await analyzeWorkspace(root, { focusPaths: ["."] });
  assert.deepEqual(rootAssessment.focusPaths, [""]);
  assert.equal(rootAssessment.focusedChangeCount, 1);
  const noMatchAssessment = await analyzeWorkspace(root, { focusPaths: ["docs"] });
  const noMatchSummary = buildSummary({
    id: "focused",
    assessment: noMatchAssessment,
    manualCases: [],
    results: {},
    riskReviews: {},
  });
  assert.match(noMatchSummary.markdown, /No local changes matched the selected focus paths \(0 of 1 shown\)/);
  assert.doesNotMatch(noMatchSummary.markdown, /Clean working tree/);
  assert.equal(noMatchSummary.json.totalChangeCount, 1);

  git(root, ["add", "."]);
  git(root, ["commit", "--quiet", "-m", "root focus change"]);
  await mkdir(path.join(root, "moved"), { recursive: true });
  git(root, ["mv", "src/features/saved-searches/storage.js", "moved/storage.js"]);
  const renameAssessment = await analyzeWorkspace(root, { focusPaths: ["src/features/saved-searches"] });
  assert.equal(renameAssessment.changes.some((item) => item.originalPath === "src/features/saved-searches/storage.js"), true);
  assert.equal(renameAssessment.risks.some((item) => item.id === "risk-saved-searches"), true);
});

test("constructs only fixed allowlisted commands on Windows and non-Windows", async (t) => {
  assert.deepEqual(safeCommandFor({ commandId: "npm-test" }, "win32"), {
    executable: "npm.cmd",
    args: ["test"],
    display: "npm test",
  });
  assert.deepEqual(safeCommandFor({ commandId: "npm-validate" }, "linux"), {
    executable: "npm",
    args: ["run", "validate"],
    display: "npm run validate",
  });
  assert.throws(() => safeCommandFor({ commandId: "free-form", executable: "powershell" }), /not allowlisted/);

  const root = await mkdtemp(path.join(os.tmpdir(), "qa-safe-command-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, "test"), { recursive: true });
  await writeFile(path.join(root, "package.json"), JSON.stringify({
    name: "safe-command-fixture",
    private: true,
    type: "module",
    scripts: { test: "node --test" },
  }));
  await writeFile(path.join(root, "test", "saved-searches.test.js"), 'import test from "node:test";\n');
  const command = await validateSafeRecommendation(root, {
    mode: "automated",
    source: "existing",
    selectable: true,
    commandId: "targeted-node-test",
    testPath: "test/saved-searches.test.js",
  }, "win32");
  assert.equal(command.executable, process.execPath);
  assert.deepEqual(command.args, ["--test", path.normalize("test/saved-searches.test.js")]);
  await assert.rejects(
    validateSafeRecommendation(root, {
      mode: "automated",
      source: "existing",
      selectable: true,
      commandId: "targeted-node-test",
      testPath: "../outside.test.js",
    }),
    /not allowlisted/,
  );

  const npmCommand = await validateSafeRecommendation(root, {
    mode: "automated",
    source: "existing",
    selectable: true,
    commandId: "npm-test",
    testPath: null,
  }, process.platform);
  const execution = spawnSync(npmCommand.executable, npmCommand.args, {
    cwd: root,
    shell: false,
    encoding: "utf8",
    windowsHide: true,
  });
  assert.equal(execution.status, 0, execution.stderr || execution.error?.message);
  if (process.platform === "win32") {
    assert.match(npmCommand.resolvedLauncher, /npm\.cmd-compatible/);
  } else {
    assert.equal(npmCommand.executable, "npm");
    assert.equal(npmCommand.resolvedLauncher, undefined);
  }
});

test("escapes renderer inputs and never uses dynamic innerHTML", () => {
  assert.equal(
    escapeHtml(`<img src="x" onerror='bad'>&`),
    "&lt;img src=&quot;x&quot; onerror=&#39;bad&#39;&gt;&amp;",
  );
  const html = renderShell(`"><script>alert("x")</script>`);
  assert.doesNotMatch(html, /nonce=""><script>alert/);
  assert.doesNotMatch(html, /\.innerHTML\s*=/);
  assert.match(html, /role="tablist"/);
  assert.match(html, /aria-live="polite"/);
});

test("strips ANSI output and bounds retained logs", () => {
  const bounded = appendBoundedOutput("before\n", `\u001b[31m${"x".repeat(100)}\u001b[0m`, 48);
  assert.equal(bounded.truncated, true);
  assert.match(bounded.output, /^\[Earlier output truncated\]/);
  assert.doesNotMatch(bounded.output, /\u001b/);
  assert.ok(bounded.output.length <= 48);
});

test("records validated manual transitions and exports assumptions and decisions", () => {
  const manual = createManualCase({
    title: "Keyboard review",
    category: "accessibility",
    rationale: "Confirm focus order.",
  }, "manual-user-1");
  const assessment = {
    provenance: { label: "SYNTHETIC / DEMO-ONLY", limitation: "Decision support only." },
    baseRef: "HEAD",
    baseCommit: "1234567890abcdef",
    changes: [],
    risks: [{
      id: "decision-release-readiness",
      kind: "human-decision",
      title: "Human decision",
      likelihood: "unknown",
      impact: "unknown",
      evidence: [],
    }],
    recommendations: [],
    assumptions: ["Mapping is inferred."],
    unknowns: ["Browser behavior is unknown."],
  };
  const record = {
    id: "working-tree",
    assessment,
    manualCases: [manual],
    results: mergeResults([manual]),
    riskReviews: {},
  };
  recordManualResult(record, manual.id, "pass", "Focus order is usable.", new Date("2026-08-13T00:00:00Z"));
  assert.equal(record.results[manual.id].status, "pass");
  assert.throws(() => recordManualResult(record, manual.id, "running", ""), /Status must be/);
  assert.throws(() => recordManualResult(record, manual.id, "pass", 42), /note must be a string/);
  const summary = buildSummary(record);
  assert.match(summary.markdown, /## Assumptions/);
  assert.match(summary.markdown, /## Unknowns/);
  assert.match(summary.markdown, /Unresolved human decision/);
  assert.equal(summary.json.tests[0].result.status, "pass");
});

test("invalidates recorded evidence and risk reviews when the assessment fingerprint changes", () => {
  const recommendation = { id: "npm-test" };
  const risk = { id: "risk-storefront", kind: "inferred" };
  const existingResults = {
    "npm-test": {
      status: "pass",
      note: "",
      updatedAt: "2026-08-13T00:00:00.000Z",
      exitCode: 0,
      durationMs: 10,
    },
  };
  const unchanged = reconcileAssessmentState({
    assessment: { fingerprint: "same", recommendations: [recommendation], risks: [risk] },
    existingResults,
    existingRiskReviews: { "risk-storefront": "accepted" },
    previousFingerprint: "same",
  });
  assert.equal(unchanged.evidenceChanged, false);
  assert.equal(unchanged.results["npm-test"].status, "pass");
  assert.equal(unchanged.riskReviews["risk-storefront"], "accepted");

  const changed = reconcileAssessmentState({
    assessment: { fingerprint: "new", recommendations: [recommendation], risks: [risk] },
    existingResults,
    existingRiskReviews: { "risk-storefront": "accepted" },
    previousFingerprint: "old",
    now: new Date("2026-08-13T01:00:00Z"),
  });
  assert.equal(changed.evidenceChanged, true);
  assert.equal(changed.results["npm-test"].status, "not-run");
  assert.match(changed.results["npm-test"].note, /invalidated/);
  assert.deepEqual(changed.riskReviews, {});
});

test("focused fingerprints include runnable tests outside the focus path", async (t) => {
  const root = await createRepository(t);
  await writeFile(path.join(root, "src", "features", "saved-searches", "storage.js"), "export const value = 7;\n");
  const before = await analyzeWorkspace(root, { focusPaths: ["src/features/saved-searches"] });
  await writeFile(
    path.join(root, "test", "saved-searches.test.js"),
    'import test from "node:test";\ntest("changed evidence", () => {});\n',
  );
  const after = await analyzeWorkspace(root, { focusPaths: ["src/features/saved-searches"] });
  assert.notEqual(before.fingerprint, after.fingerprint);
  assert.deepEqual(after.focusPaths, ["src/features/saved-searches"]);
});

test("full-suite fingerprints include unconfigured test changes outside the focus path", async (t) => {
  const root = await createRepository(t);
  await writeFile(path.join(root, "test", "unconfigured.test.js"), 'import test from "node:test";\ntest("extra", () => {});\n');
  git(root, ["add", "."]);
  git(root, ["commit", "--quiet", "-m", "extra test"]);
  await writeFile(path.join(root, "src", "features", "saved-searches", "storage.js"), "export const value = 9;\n");
  const before = await analyzeWorkspace(root, { focusPaths: ["src/features/saved-searches"] });
  assert.equal(before.recommendations.some((item) => item.commandId === "npm-test"), true);
  await writeFile(path.join(root, "test", "unconfigured.test.js"), 'import test from "node:test";\ntest("changed extra", () => {});\n');
  const after = await analyzeWorkspace(root, { focusPaths: ["src/features/saved-searches"] });
  assert.notEqual(before.fingerprint, after.fingerprint);
});

test("skipped evidence remains a release-readiness review item", () => {
  const readiness = releaseReadiness({
    assessment: { recommendations: [{ id: "check" }] },
    manualCases: [],
    results: { check: { status: "skipped" } },
  });
  assert.deepEqual(readiness, { level: "review", label: "Review needed: skipped evidence remains" });
  assert.deepEqual(reportedIncompleteTests("ℹ skipped 3\nℹ todo 2\n"), { skipped: 3, todo: 2, total: 5 });
  assert.deepEqual(reportedIncompleteTests("# skipped 2\n# todo 1\n"), { skipped: 2, todo: 1, total: 3 });
  assert.deepEqual(
    reportedIncompleteTests("ok 1 - conditional # SKIP\nok 2 - future # TODO\n"),
    { skipped: 1, todo: 1, total: 2 },
  );
  assert.deepEqual(reportedIncompleteTests("skipped 0\ntodo 0\n"), { skipped: 0, todo: 0, total: 0 });
});

test("renderer source uses text nodes for diff paths, logs, and notes", async () => {
  const renderer = await readFile(new URL("../.github/extensions/qa-change-risk/renderer.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(renderer, /\.innerHTML\s*=/);
  assert.match(renderer, /textContent/);
  assert.match(renderer, /node\("pre", \{ text:run\.output/);
});

test("extension source cleans process trees on panel close and provider shutdown", async () => {
  const extension = await readFile(new URL("../.github/extensions/qa-change-risk/extension.mjs", import.meta.url), "utf8");
  assert.match(extension, /Stop-Process -Id \$id/);
  assert.match(extension, /Stop-Process -Id \$RootPid/);
  assert.match(extension, /detached: process\.platform !== "win32"/);
  assert.match(extension, /session\.on\("session\.shutdown"/);
  assert.match(extension, /process\.once\("SIGTERM"/);
  assert.match(extension, /shutdownPromise/);
  assert.match(extension, /executeBatch\(entry, prepared\)\.catch/);
  assert.match(extension, /latestAssessment = await analyzeWorkspace/);
  assert.match(extension, /assessmentFingerprint: entry\.record\.assessment\.fingerprint/);
  assert.match(extension, /process\.kill\(-child\.pid, "SIGKILL"\)/);
});
