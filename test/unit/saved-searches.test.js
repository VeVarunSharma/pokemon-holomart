import { expect, test } from "vitest";
import {
  createSavedSearch,
  readSavedSearches,
  readSavedSearchesState,
  removeSearch,
  renameSearch,
  saveSearch,
  SAVED_SEARCHES_KEY,
  writeSavedSearches
} from "../../src/features/saved-searches/storage.js";

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
  expect(search).toEqual({
    id: "search-1",
    name: "Pikachu chase cards",
    schemaVersion: 1,
    filters: { query: "pikachu", rarity: "Special Illustration Rare", expansion: "All" },
    createdAt: "2026-07-29T12:00:00.000Z",
    updatedAt: "2026-07-29T12:00:00.000Z",
    unavailableCriteria: []
  });
});

test("rejects blank names", () => {
  expect(() => createSavedSearch({ name: " ", filters: {} })).toThrow(/name is required/);
});

test("malformed saved data is ignored without breaking the catalog", () => {
  expect(readSavedSearches(memoryStorage({ [SAVED_SEARCHES_KEY]: "{bad json" }))).toEqual([]);
  expect(readSavedSearches(memoryStorage({ [SAVED_SEARCHES_KEY]: JSON.stringify({ nope: true }) }))).toEqual([]);
});

test("invalid records are removed and valid filters are repaired", () => {
  const storage = memoryStorage({
    [SAVED_SEARCHES_KEY]: JSON.stringify([
      { id: "ok", name: " Useful ", createdAt: "2026-07-29T12:00:00Z", filters: { rarity: "Legendary" } },
      { id: 2, name: "", createdAt: "yesterday" }
    ])
  });
  expect(readSavedSearches(storage)).toEqual([{
    id: "ok",
    name: "Useful",
    schemaVersion: 1,
    createdAt: "2026-07-29T12:00:00Z",
    updatedAt: "2026-07-29T12:00:00Z",
    filters: { query: "", rarity: "All", expansion: "All" },
    unavailableCriteria: [{ field: "rarity", value: "Legendary" }]
  }]);
});

test("reports corrupt, unsupported, and stale records without blocking valid searches", () => {
  const state = readSavedSearchesState(memoryStorage({
    [SAVED_SEARCHES_KEY]: JSON.stringify([
      {
        id: "stale",
        name: "Old taxonomy",
        schemaVersion: 1,
        createdAt: "2026-07-29T12:00:00Z",
        filters: { rarity: "Legendary", expansion: "Base Set" }
      },
      {
        id: "future",
        name: "Future record",
        schemaVersion: 2,
        createdAt: "2026-07-29T12:00:00Z",
        filters: {}
      }
    ])
  }));

  expect(state.searches).toHaveLength(1);
  expect(state.searches[0].filters).toEqual({ query: "", rarity: "All", expansion: "All" });
  expect(state.searches[0].unavailableCriteria).toEqual([
    { field: "rarity", value: "Legendary" },
    { field: "expansion", value: "Base Set" }
  ]);
  expect(state.issues).toEqual([{ type: "unsupported-version", recordName: "Future record" }]);
});

test("invalid records cannot crowd valid searches out of the read limit", () => {
  const invalid = Array.from({ length: 20 }, (_, index) => ({ id: index }));
  const storage = memoryStorage({
    [SAVED_SEARCHES_KEY]: JSON.stringify([
      ...invalid,
      { id: "valid", name: "Still visible", createdAt: "2026-07-29T12:00:00Z", filters: {} }
    ])
  });

  expect(readSavedSearches(storage).map((search) => search.id)).toEqual(["valid"]);
});

test("mutations preserve unsupported records for a newer app version", () => {
  const future = {
    id: "future",
    name: "Future record",
    schemaVersion: 2,
    createdAt: "2026-07-29T12:00:00Z",
    filters: { futureCriterion: true }
  };
  const storage = memoryStorage({ [SAVED_SEARCHES_KEY]: JSON.stringify([future]) });

  expect(saveSearch(storage, {
    id: "current",
    name: "Current record",
    createdAt: "2026-07-29T12:00:00Z",
    filters: {}
  }).ok).toBe(true);
  expect(JSON.parse(storage.value(SAVED_SEARCHES_KEY))).toContainEqual(future);
});

test("saving deduplicates IDs and removing is persistent", () => {
  const storage = memoryStorage();
  const first = { id: "same", name: "First", createdAt: "2026-07-29T12:00:00Z", filters: {} };
  const updated = { ...first, name: "Updated" };
  expect(saveSearch(storage, first).ok).toBe(true);
  expect(saveSearch(storage, updated).ok).toBe(true);
  expect(readSavedSearches(storage).map((search) => search.name)).toEqual(["Updated"]);
  expect(removeSearch(storage, "same").ok).toBe(true);
  expect(readSavedSearches(storage)).toEqual([]);
});

test("renaming preserves identity and criteria while updating the record", () => {
  const storage = memoryStorage();
  const search = createSavedSearch(
    { name: "Old name", filters: { query: "Mew" } },
    () => new Date("2026-07-29T12:00:00Z"),
    () => "search-1"
  );
  saveSearch(storage, search);

  expect(renameSearch(
    storage,
    "search-1",
    "  New name  ",
    () => new Date("2026-08-13T15:00:00Z")
  )).toEqual({ ok: true });
  expect(readSavedSearches(storage)[0]).toMatchObject({
    id: "search-1",
    name: "New name",
    filters: { query: "Mew", rarity: "All", expansion: "All" },
    createdAt: "2026-07-29T12:00:00.000Z",
    updatedAt: "2026-08-13T15:00:00.000Z"
  });
});

test("writes only the versioned local search contract", () => {
  const storage = memoryStorage();
  expect(writeSavedSearches(storage, [{
    id: "safe",
    name: "Safe",
    filters: { query: "Pikachu" },
    createdAt: "2026-07-29T12:00:00Z",
    listingSnapshot: { price: 1 },
    alertConsent: true
  }]).ok).toBe(true);

  expect(JSON.parse(storage.value(SAVED_SEARCHES_KEY))[0]).toEqual({
    id: "safe",
    name: "Safe",
    schemaVersion: 1,
    filters: { query: "Pikachu", rarity: "All", expansion: "All" },
    createdAt: "2026-07-29T12:00:00Z",
    updatedAt: "2026-07-29T12:00:00Z"
  });
});

test("storage quota failures are returned to the UI", () => {
  const storage = { getItem: () => null, setItem: () => { throw new Error("Quota exceeded"); } };
  expect(writeSavedSearches(storage, [])).toEqual({ ok: false, error: "Quota exceeded" });
});

test.todo("persists searches to an account and syncs them across devices");
test.todo("creates price alerts with explicit frequency and channel preferences");
test.todo("emits create, apply, alert, and delete telemetry events");
test.todo("covers multi-tab conflicts and browser-level integration");
