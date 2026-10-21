import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import {
  deterministicGateDefinitions,
  ensureExternalArtifactDirectory,
  npmInvocation,
  normalizeSeed,
  repositoryStatusViolations,
  selectExplorationCharters,
  validateQaBaseUrl,
  validateBrowserPayload,
  validateDeterministicPayload,
  validateIndependentReviewPayload
} from "../scripts/agentic-qa-evidence.mjs";

const REVISION = "0123456789abcdef0123456789abcdef01234567";
const OTHER_REVISION = "89abcdef0123456789abcdef0123456789abcdef";
const REQUIRED_GATES = [
  "artifact-validation",
  "unit-contracts",
  "integration-contracts",
  "full-node-suite",
  "issue-preview",
  "browser-e2e"
];
const REQUIRED_BROWSER_CASES = [
  "QA-01",
  "QA-02",
  "QA-03",
  "QA-04",
  "QA-05",
  "QA-06",
  "QA-07"
];

function deterministicPayload(status = "PASS") {
  const gates = REQUIRED_GATES.map((id) => ({
    id,
    status,
    command: `run-${id}`,
    log: `logs/${id}.log`
  }));
  return {
    schemaVersion: 1,
    provenance: "SYNTHETIC / DEMO-ONLY",
    testedRevision: REVISION,
    summary: {
      total: gates.length,
      passed: status === "PASS" ? gates.length : 0,
      failed: status === "FAIL" ? gates.length : 0,
      errors: status === "ERROR" ? gates.length : 0,
      conclusion: status === "PASS" ? "PASS" : "FAIL"
    },
    gates
  };
}

function browserPayload(status = "PASS") {
  const cases = REQUIRED_BROWSER_CASES.map((id) => ({
    id,
    status,
    expected: `${id} expected behavior`,
    observed: `${id} observed behavior`,
    evidence: `browser/screenshots/${id}.png`
  }));
  return {
    schemaVersion: 1,
    provenance: "SYNTHETIC / DEMO-ONLY",
    testedRevision: REVISION,
    summary: {
      total: cases.length,
      passed: status === "PASS" ? cases.length : 0,
      failed: status === "FAIL" ? cases.length : 0,
      errors: status === "ERROR" ? cases.length : 0,
      conclusion: status === "PASS" ? "PASS" : "FAIL"
    },
    cases
  };
}

function independentReport() {
  return [
    "### QA verdict",
    "Deterministic evidence passed for the immutable revision.",
    "### Deterministic evidence",
    "All required gates passed.",
    "### Independent test-strength review",
    "Assertions reach observable behavior.",
    "### Seeded exploration",
    "Three replay charters completed.",
    "### Residual risk",
    "Model reasoning remains advisory and non-deterministic."
  ].join("\n\n");
}

test("seed normalization derives auto from the immutable revision and enforces uint32", () => {
  assert.equal(normalizeSeed("auto", REVISION), 0x01234567);
  assert.equal(normalizeSeed("0", REVISION), 0);
  assert.equal(normalizeSeed("4294967295", REVISION), 0xffffffff);
  assert.throws(() => normalizeSeed("4294967296", REVISION), /unsigned 32-bit range/);
  assert.throws(() => normalizeSeed("7", "abc123"), /full 40-character commit SHA/);
});

test("seeded charter selection is stable, ordered, unique, and preserves seed zero", () => {
  const first = selectExplorationCharters(0);
  const replay = selectExplorationCharters(0);
  assert.deepEqual(replay, first);
  assert.equal(first.length, 3);
  assert.equal(new Set(first.map(({ id }) => id)).size, 3);
  assert.deepEqual(first.map(({ order }) => order), [1, 2, 3]);
  assert.deepEqual(first.map(({ id }) => id), ["EX-05", "EX-08", "EX-04"]);
  assert.notDeepEqual(
    selectExplorationCharters(0, 8).map(({ id }) => id),
    selectExplorationCharters(0x6d2b79f5, 8).map(({ id }) => id)
  );
});

test("artifact output must stay outside the repository checkout", () => {
  const root = path.resolve("repo-root");
  assert.throws(() => ensureExternalArtifactDirectory(root, root), /outside the repository/);
  assert.throws(
    () => ensureExternalArtifactDirectory(root, path.join(root, "artifacts")),
    /outside the repository/
  );
  assert.equal(
    ensureExternalArtifactDirectory(root, path.resolve("qa-artifacts")),
    path.resolve("qa-artifacts")
  );
});

test("repository status accepts only gh-aw Playwright skill files as the runtime baseline", () => {
  const runtimeStatus = [
    "?? .claude/skills/playwright-cli/SKILL.md",
    "?? .claude/skills/playwright-cli/references/session-management.md",
    ""
  ].join("\n");

  assert.equal(repositoryStatusViolations(runtimeStatus), "");
  assert.equal(
    repositoryStatusViolations(`${runtimeStatus}?? unexpected.txt\n`),
    "?? unexpected.txt"
  );
  assert.equal(
    repositoryStatusViolations(" M .claude/skills/playwright-cli/SKILL.md\n"),
    " M .claude/skills/playwright-cli/SKILL.md"
  );
});

test("QA base URL stays on explicit HTTP loopback", () => {
  assert.equal(validateQaBaseUrl(undefined).href, "http://127.0.0.1:4173/");
  assert.equal(validateQaBaseUrl("http://localhost:43175").href, "http://localhost:43175/");
  for (const value of [
    "https://127.0.0.1:43175",
    "http://example.com:43175",
    "http://127.0.0.1.example.com:43175",
    "http://127.0.0.1"
  ]) {
    assert.throws(() => validateQaBaseUrl(value), /QA_BASE_URL/);
  }
});

test("npm gate invocation uses fixed tokens and a Windows command shell", () => {
  assert.deepEqual(npmInvocation(["run", "validate"], "linux"), {
    command: "npm",
    args: ["run", "validate"]
  });
  assert.deepEqual(npmInvocation(["run", "validate"], "win32", "C:\\Windows\\System32\\cmd.exe"), {
    command: "C:\\Windows\\System32\\cmd.exe",
    args: ["/d", "/s", "/c", "npm run validate"]
  });
  assert.throws(
    () => npmInvocation(["run", "validate&&whoami"], "win32", "cmd.exe"),
    /fixed command tokens/
  );
});

test("deterministic gates use the current Vitest and native Node suites", () => {
  const gates = deterministicGateDefinitions("linux");
  const byId = Object.fromEntries(gates.map((gate) => [gate.id, gate]));

  assert.deepEqual(
    { command: byId["unit-contracts"].command, args: byId["unit-contracts"].args },
    { command: "npm", args: ["run", "test:unit"] }
  );
  assert.deepEqual(
    { command: byId["integration-contracts"].command, args: byId["integration-contracts"].args },
    { command: "npm", args: ["run", "test:integration"] }
  );
  assert.deepEqual(byId["full-node-suite"].args, [
    "--test",
    "test/qa-change-risk.test.js",
    "test/agentic-qa-evidence.test.js"
  ]);
});

test("deterministic evidence rejects stale revisions, missing gates, and inconsistent summaries", () => {
  assert.deepEqual(validateDeterministicPayload(deterministicPayload(), REVISION), {
    allPassed: true,
    gateCount: REQUIRED_GATES.length
  });
  assert.throws(
    () => validateDeterministicPayload(deterministicPayload(), OTHER_REVISION),
    /stale revision/
  );

  const missingGate = deterministicPayload();
  missingGate.gates.pop();
  assert.throws(
    () => validateDeterministicPayload(missingGate, REVISION),
    /every required gate exactly once/
  );

  const weakSummary = deterministicPayload();
  weakSummary.summary.passed = 0;
  assert.throws(
    () => validateDeterministicPayload(weakSummary, REVISION),
    /passed count disagrees/
  );
});

test("browser evidence rejects stale revisions, incomplete cases, and missing evidence", () => {
  assert.deepEqual(validateBrowserPayload(browserPayload(), REVISION), {
    allPassed: true,
    caseCount: REQUIRED_BROWSER_CASES.length
  });
  assert.throws(
    () => validateBrowserPayload(browserPayload(), OTHER_REVISION),
    /stale revision/
  );

  const duplicateCase = browserPayload();
  duplicateCase.cases[6].id = "QA-01";
  assert.throws(
    () => validateBrowserPayload(duplicateCase, REVISION),
    /QA-01 through QA-07 exactly once/
  );

  const missingEvidence = browserPayload();
  missingEvidence.cases[0].evidence = "";
  assert.throws(
    () => validateBrowserPayload(missingEvidence, REVISION),
    /missing its evidence path/
  );
});

test("independent review requires one bounded verdict and every report section", () => {
  const report = independentReport();
  const payload = {
    items: [{
      type: "record_qa_verdict",
      verdict: "pass",
      summary: "All deterministic gates passed and independent review completed.",
      report
    }]
  };
  assert.deepEqual(validateIndependentReviewPayload(payload), {
    verdict: "pass",
    summary: payload.items[0].summary,
    report
  });

  const duplicate = structuredClone(payload);
  duplicate.items.push(structuredClone(duplicate.items[0]));
  assert.throws(
    () => validateIndependentReviewPayload(duplicate),
    /exactly one record_qa_verdict/
  );

  const missingSection = structuredClone(payload);
  missingSection.items[0].report = missingSection.items[0].report.replace("### Residual risk", "Residual risk");
  assert.throws(
    () => validateIndependentReviewPayload(missingSection),
    /missing ### Residual risk/
  );
});

test("independent review enforces UTF-8 summary and report byte bounds", () => {
  const report = independentReport();
  const payload = (summary, reviewReport) => ({
    items: [{ type: "record_qa_verdict", verdict: "pass", summary, report: reviewReport }]
  });
  assert.equal(
    validateIndependentReviewPayload(payload("é".repeat(5), report)).summary,
    "é".repeat(5)
  );
  for (const [summary, reviewReport, message] of [
    ["123456789", report, /summary must be 10-2000 UTF-8 bytes/],
    ["s".repeat(2001), report, /summary must be 10-2000 UTF-8 bytes/],
    ["valid summary", "r".repeat(199), /report must be 200-50000 UTF-8 bytes/],
    ["valid summary", `${report}${"r".repeat(50001)}`, /report must be 200-50000 UTF-8 bytes/]
  ]) {
    assert.throws(() => validateIndependentReviewPayload(payload(summary, reviewReport)), message);
  }
});
