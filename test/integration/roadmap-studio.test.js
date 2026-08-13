import { test } from "vitest";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  RoadmapError,
  draftHandoff,
  escapeHtml,
  filterInitiatives,
  focusInitiative,
  loadRoadmapFile,
  prepareRoadmapOpen,
  projectWorkspaceFromExtension,
  resolveRoadmapPath,
  resolveInitiativeFocus,
  resolveRenderFocus,
  validateRoadmap,
} from "../../.github/extensions/roadmap-studio/model.mjs";
import { renderRoadmap, renderShell } from "../../.github/extensions/roadmap-studio/renderer.mjs";

const roadmap = JSON.parse(await readFile(new URL("../../product/roadmap.json", import.meta.url), "utf8"));
const schema = JSON.parse(await readFile(new URL("../../product/roadmap.schema.json", import.meta.url), "utf8"));

test("validates the committed roadmap against its supported contract", () => {
  assert.equal(validateRoadmap(structuredClone(roadmap), schema).initiatives.length, 5);
});

test("loads the workspace artifact and rejects paths outside the JSON boundary", async () => {
  const extensionUrl = new URL("../../.github/extensions/roadmap-studio/extension.mjs", import.meta.url);
  assert.equal(projectWorkspaceFromExtension(extensionUrl), process.cwd());
  const loaded = await loadRoadmapFile(process.cwd(), "product/roadmap.json");
  assert.equal(loaded.durablePath, path.join("product", "roadmap.json"));
  assert.equal(loaded.roadmap.metadata.product, "HoloMart");
  await assert.rejects(
    resolveRoadmapPath(process.cwd(), path.join("..", "outside.json")),
    (error) => error instanceof RoadmapError && error.code === "roadmap_path_invalid",
  );
  await assert.rejects(
    resolveRoadmapPath(process.cwd(), "README.md"),
    (error) => error instanceof RoadmapError && error.code === "roadmap_path_invalid",
  );
  const opened = await prepareRoadmapOpen(projectWorkspaceFromExtension(extensionUrl), {
    initiativeFocus: "saved-searches-preview",
  });
  assert.equal(opened.roadmapPath, "product/roadmap.json");
  assert.equal(opened.focus, "init-saved-searches-preview");
});

test("rejects malformed nested records and evidence count mismatches", () => {
  const invalid = structuredClone(roadmap);
  invalid.initiatives[0].evidenceCount = 999;
  invalid.initiatives[0].risks[0].likelihood = "certain";
  assert.throws(() => validateRoadmap(invalid, schema), (error) =>
    error instanceof RoadmapError &&
    error.code === "roadmap_invalid" &&
    /evidenceCount/.test(error.message));
});

test("escapes all HTML-significant characters", () => {
  assert.equal(
    escapeHtml(`<img src="x" onerror='bad'>&`),
    "&lt;img src=&quot;x&quot; onerror=&#39;bad&#39;&gt;&amp;",
  );
});

test("filters by horizon and status without mutating the roadmap", () => {
  const original = structuredClone(roadmap);
  const filtered = filterInitiatives(roadmap, { horizon: "next", status: "gated" });
  assert.deepEqual(filtered.map((item) => item.id), ["init-account-search-sync"]);
  assert.deepEqual(roadmap, original);
  assert.throws(() => filterInitiatives(roadmap, { horizon: "someday" }), /Unknown horizon/);
});

test("focus validates ids and the renderer makes Saved Searches central", () => {
  const focused = focusInitiative(roadmap, "init-saved-searches-preview");
  assert.match(focused.title, /Saved Searches/);
  assert.equal(resolveInitiativeFocus(roadmap, "saved-searches-preview").id, focused.id);
  const html = renderRoadmap(roadmap, {
    horizon: "all",
    status: "all",
    focus: focused.id,
  });
  assert.match(html, /focus-stage/);
  assert.match(html, /initiative focused saved-searches/);
  assert.throws(() => focusInitiative(roadmap, "init-unknown"), /Unknown initiative id/);
});

test("render focus distinguishes an absent query parameter from an explicit clear", () => {
  const focusedId = "init-saved-searches-preview";
  assert.equal(resolveRenderFocus(new URLSearchParams(), focusedId), focusedId);
  assert.equal(resolveRenderFocus(new URLSearchParams("focus="), focusedId), null);
  assert.equal(resolveRenderFocus(new URLSearchParams(`focus=${focusedId}`), null), focusedId);

  const clearedHtml = renderRoadmap(roadmap, { horizon: "all", status: "all", focus: null });
  assert.doesNotMatch(clearedHtml, /focus-stage|Focused:/);
  const clearedShell = renderShell(roadmap, "product/roadmap.json", null);
  assert.match(clearedShell, /<option value="" selected>No focus<\/option>/);
  assert.match(clearedShell, /document\.title = focusOption\?\.value \? "Roadmap Studio · "/);
});

test("renderer escapes roadmap content before HTML injection", () => {
  const malicious = structuredClone(roadmap);
  malicious.initiatives[0].title = `<script>alert("x")</script>`;
  const html = renderRoadmap(malicious, { horizon: "now", status: "all" });
  assert.doesNotMatch(html, /<script>alert/);
  assert.match(html, /&lt;script&gt;alert\(&quot;x&quot;\)&lt;\/script&gt;/);
});

test("handoff is evidence-grounded and covers engineering decision inputs", () => {
  const handoff = draftHandoff(roadmap, "init-saved-searches-preview");
  assert.match(handoff, /^# Product-to-Engineering handoff:/);
  assert.match(handoff, /## Scope/);
  assert.match(handoff, /### Child work/);
  assert.match(handoff, /## Dependencies/);
  assert.match(handoff, /## Evidence \(10\)/);
  assert.match(handoff, /CI-01/);
  assert.match(handoff, /## Risks/);
  assert.match(handoff, /risk-silent-stale-search/);
  assert.match(handoff, /## Success measures/);
  assert.match(handoff, /## Human decisions/);
  assert.match(handoff, /decision-duplicate-search-names/);
  assert.match(handoff, /work-search-storage-validation/);
});

test("handoff rejects unknown initiative ids", () => {
  assert.throws(
    () => draftHandoff(roadmap, "init-does-not-exist"),
    (error) => error instanceof RoadmapError && error.code === "initiative_not_found",
  );
});
