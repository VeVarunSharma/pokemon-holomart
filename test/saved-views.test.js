import test from "node:test";
import assert from "node:assert/strict";
import {
  createSavedView, readSavedViews, removeView, saveView, SAVED_VIEWS_KEY, writeSavedViews
} from "../src/features/saved-views/storage.js";

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    value: (key) => values.get(key)
  };
}

test("creates a normalized, deterministic personal view", () => {
  const view = createSavedView(
    { name: "  Churn signals  ", filters: { query: " risk ", sentiment: "Negative", channel: "nope" } },
    () => new Date("2026-07-29T12:00:00Z"),
    () => "view-1"
  );
  assert.deepEqual(view, {
    id: "view-1",
    name: "Churn signals",
    filters: { query: "risk", sentiment: "Negative", channel: "All" },
    createdAt: "2026-07-29T12:00:00.000Z"
  });
});

test("rejects blank names", () => {
  assert.throws(() => createSavedView({ name: " ", filters: {} }), /name is required/);
});

test("malformed saved data is ignored without breaking the dashboard", () => {
  assert.deepEqual(readSavedViews(memoryStorage({ [SAVED_VIEWS_KEY]: "{bad json" })), []);
  assert.deepEqual(readSavedViews(memoryStorage({ [SAVED_VIEWS_KEY]: JSON.stringify({ nope: true }) })), []);
});

test("invalid records are removed and valid filters are repaired", () => {
  const storage = memoryStorage({
    [SAVED_VIEWS_KEY]: JSON.stringify([
      { id: "ok", name: " Useful ", createdAt: "2026-07-29T12:00:00Z", filters: { sentiment: "Furious" } },
      { id: 2, name: "", createdAt: "yesterday" }
    ])
  });
  assert.deepEqual(readSavedViews(storage), [{
    id: "ok",
    name: "Useful",
    createdAt: "2026-07-29T12:00:00Z",
    filters: { query: "", sentiment: "All", channel: "All" }
  }]);
});

test("saving deduplicates IDs and removing is persistent", () => {
  const storage = memoryStorage();
  const first = { id: "same", name: "First", createdAt: "2026-07-29T12:00:00Z", filters: {} };
  const updated = { ...first, name: "Updated" };
  assert.equal(saveView(storage, first).ok, true);
  assert.equal(saveView(storage, updated).ok, true);
  assert.deepEqual(readSavedViews(storage).map((view) => view.name), ["Updated"]);
  assert.equal(removeView(storage, "same").ok, true);
  assert.deepEqual(readSavedViews(storage), []);
});

test("storage quota failures are returned to the UI", () => {
  const storage = { getItem: () => null, setItem: () => { throw new Error("Quota exceeded"); } };
  assert.deepEqual(writeSavedViews(storage, []), { ok: false, error: "Quota exceeded" });
});

test.todo("persists views to the server and syncs them across devices");
test.todo("shares a view with a workspace team and resolves ownership");
test.todo("enforces viewer, editor, and administrator permissions");
test.todo("emits create, apply, share, and delete telemetry events");
test.todo("covers multi-tab conflicts and browser-level integration");
