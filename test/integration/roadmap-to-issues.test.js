import { test } from "vitest";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
  buildPlan,
  hereString,
  powerShellLiteral,
  renderGhCommands
} from "../../scripts/roadmap-to-issues.mjs";

const script = fileURLToPath(new URL("../../scripts/roadmap-to-issues.mjs", import.meta.url));
const roadmap = JSON.parse(await readFile(new URL("../../product/roadmap.json", import.meta.url), "utf8"));

function run(...args) {
  return execFileSync(process.execPath, [script, ...args], {
    cwd: process.cwd(),
    encoding: "utf8"
  });
}

test("gh previews omit label dependencies and retain suggested labels as metadata", () => {
  const output = run("--initiative", "init-saved-searches-preview", "--format", "json", "--gh-commands");
  const plan = JSON.parse(output);
  assert.deepEqual(plan.epic.suggestedLabels, ["synthetic-demo", "product", "saved-searches", "preview", "epic"]);
  assert.ok(plan.children.every((child) => child.suggestedLabels.includes("child-work")));
  assert.doesNotMatch(plan.ghCommandPreview, /(?:^|\s)--label(?:\s|=)/m);
  assert.match(plan.ghCommandPreview, /Suggested epic labels \(not applied\):/);
});

test("every child body carries the evidence-backed issue contract", () => {
  const plan = JSON.parse(run("--initiative", "init-saved-searches-preview", "--format", "json"));
  const requiredHeadings = [
    "## Rationale and outcome",
    "## Acceptance criteria",
    "## Blocked by",
    "## Exclusions / non-goals",
    "## Evidence",
    "## Code and design references",
    "## Validation"
  ];
  for (const child of plan.children) {
    for (const heading of requiredHeadings) assert.match(child.body, new RegExp(heading.replace("/", "\\/")));
    assert.ok(child.evidenceReferences.length > 0);
    assert.ok(child.references.length > 0);
    assert.ok(child.validation.length > 0);
    assert.ok(child.exclusions.length > 0);
  }
});

test("collector-list previews retain research and ownership boundaries", () => {
  const plan = JSON.parse(run("--initiative", "init-collector-lists", "--format", "json"));
  const problemStudy = plan.children.find(({ id }) => id === "work-lists-problem-study");
  const listModel = plan.children.find(({ id }) => id === "work-lists-model");

  assert.ok(problemStudy.references.includes("../design/collector-lists-concept-study.md#research-decision-matrix"));
  assert.ok(listModel.references.includes("../design/collector-lists-concept-study.md#guardrails"));
  assert.match(problemStudy.exclusions.join(" "), /No list implementation/);
  assert.match(listModel.exclusions.join(" "), /automatic ownership state/);
  assert.deepEqual(listModel.dependencies, ["work-lists-problem-study"]);
});

test("price-monitoring study preview retains research boundaries", () => {
  const plan = JSON.parse(run("--initiative", "init-price-drop-alerts", "--format", "json"));
  const jobStudy = plan.children.find(({ id }) => id === "work-alert-job-study");

  assert.ok(jobStudy.references.includes("../design/price-monitoring-job-study.md#research-decision-matrix"));
  assert.match(jobStudy.exclusions.join(" "), /No notification prototype/);
  assert.deepEqual(jobStudy.dependencies, []);
});

test("dependency ordering is stable when authoritative input order changes", () => {
  const initiative = structuredClone(roadmap.initiatives[0]);
  const expected = buildPlan(roadmap, initiative).children.map(({ id }) => id);
  initiative.issueDraft.childWorkItems.reverse();
  const reordered = buildPlan(roadmap, initiative).children.map(({ id }) => id);
  assert.deepEqual(reordered, expected);
  assert.deepEqual(expected, [
    "work-search-storage-validation",
    "work-search-core-flows",
    "work-search-recovery",
    "work-search-accessibility"
  ]);
});

test("PowerShell commands quote apostrophes and reject unsafe here-string delimiters", () => {
  assert.equal(powerShellLiteral("owner's/repo"), "'owner''s/repo'");
  assert.throws(() => hereString("body", "safe\n'@\nunsafe"), /cannot render PowerShell here-string/);

  const command = renderGhCommands({
    epic: { title: "Owner's epic", body: "Epic body", suggestedLabels: ["custom"] },
    children: [
      { title: "Child's task", body: "Child body", suggestedLabels: ["custom", "child-work"] }
    ]
  }, "owner's/repo");
  assert.match(command, /--repo 'owner''s\/repo'/);
  assert.match(command, /--title 'Owner''s epic'/);
  assert.match(command, /--title 'Child''s task'/);
  assert.doesNotMatch(command, /(?:^|\s)--label(?:\s|=)/m);
});

test("markdown, JSON, and command modes are deterministic and body-consistent", () => {
  const args = ["--initiative", "init-saved-searches-preview", "--gh-commands"];
  assert.equal(run(...args), run(...args));
  assert.equal(run("--format", "json"), run("--format", "json"));

  const markdown = run("--initiative", "init-saved-searches-preview");
  const json = JSON.parse(run("--initiative", "init-saved-searches-preview", "--format", "json"));
  assert.match(markdown, /work-search-storage-validation/);
  assert.ok(markdown.includes(json.children[0].body));

  const invalid = spawnSync(process.execPath, [script, "--format", "yaml"], {
    cwd: process.cwd(),
    encoding: "utf8"
  });
  assert.equal(invalid.status, 2);
  assert.match(invalid.stderr, /unsupported format/);
});
