import test from "node:test";
import assert from "node:assert/strict";
import {
  createSavedSearch, readSavedSearches, removeSearch, saveSearch, SAVED_SEARCHES_KEY, writeSavedSearches
} from "../src/features/saved-searches/storage.js";

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    value: (key) => values.get(key)
  };
}

test("creates a normalized, deterministic personal search", () => {
  const search = createSavedSearch(
    { name: "  Pikachu chase cards  ", filters: { query: " pikachu ", rarity: "Special Illustration Rare", expansion: "nope" } },
    () => new Date("2026-07-29T12:00:00Z"),
    () => "search-1"
  );
  assert.deepEqual(search, {
    id: "search-1",
    name: "Pikachu chase cards",
    filters: { query: "pikachu", rarity: "Special Illustration Rare", expansion: "All" },
    createdAt: "2026-07-29T12:00:00.000Z"
  });
});

test("rejects blank names", () => {
  assert.throws(() => createSavedSearch({ name: " ", filters: {} }), /name is required/);
});

test("malformed saved data is ignored without breaking the catalog", () => {
  assert.deepEqual(readSavedSearches(memoryStorage({ [SAVED_SEARCHES_KEY]: "{bad json" })), []);
  assert.deepEqual(readSavedSearches(memoryStorage({ [SAVED_SEARCHES_KEY]: JSON.stringify({ nope: true }) })), []);
});

test("invalid records are removed and valid filters are repaired", () => {
  const storage = memoryStorage({
    [SAVED_SEARCHES_KEY]: JSON.stringify([
      { id: "ok", name: " Useful ", createdAt: "2026-07-29T12:00:00Z", filters: { rarity: "Legendary" } },
      { id: 2, name: "", createdAt: "yesterday" }
    ])
  });
  assert.deepEqual(readSavedSearches(storage), [{
    id: "ok",
    name: "Useful",
    createdAt: "2026-07-29T12:00:00Z",
    filters: { query: "", rarity: "All", expansion: "All" }
  }]);
});

test("saving deduplicates IDs and removing is persistent", () => {
  const storage = memoryStorage();
  const first = { id: "same", name: "First", createdAt: "2026-07-29T12:00:00Z", filters: {} };
  const updated = { ...first, name: "Updated" };
  assert.equal(saveSearch(storage, first).ok, true);
  assert.equal(saveSearch(storage, updated).ok, true);
  assert.deepEqual(readSavedSearches(storage).map((search) => search.name), ["Updated"]);
  assert.equal(removeSearch(storage, "same").ok, true);
  assert.deepEqual(readSavedSearches(storage), []);
});

test("storage quota failures are returned to the UI", () => {
  const storage = { getItem: () => null, setItem: () => { throw new Error("Quota exceeded"); } };
  assert.deepEqual(writeSavedSearches(storage, []), { ok: false, error: "Quota exceeded" });
});

test.todo("persists searches to an account and syncs them across devices");
test.todo("creates price alerts with explicit frequency and channel preferences");
test.todo("handles removed expansions and renamed rarity values");
test.todo("emits create, apply, alert, and delete telemetry events");
test.todo("covers multi-tab conflicts and browser-level integration");
