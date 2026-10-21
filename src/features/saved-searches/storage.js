import { EXPANSIONS, normalizeFilters, RARITIES } from "../filters/filter-state.js";

export const SAVED_SEARCHES_KEY = "holomart.saved-searches.v1";
export const SAVED_SEARCH_SCHEMA_VERSION = 1;
const MAX_SEARCHES = 20;

function validSearch(value) {
  return value
    && typeof value.id === "string"
    && typeof value.name === "string"
    && value.name.trim().length > 0
    && typeof value.createdAt === "string"
    && !Number.isNaN(Date.parse(value.createdAt));
}

function unavailableCriteria(filters = {}) {
  const unavailable = [];
  if (typeof filters.rarity === "string" && !RARITIES.includes(filters.rarity)) {
    unavailable.push({ field: "rarity", value: filters.rarity.slice(0, 120) });
  }
  if (typeof filters.expansion === "string" && !EXPANSIONS.includes(filters.expansion)) {
    unavailable.push({ field: "expansion", value: filters.expansion.slice(0, 120) });
  }
  return unavailable;
}

function storedFilters(search) {
  const filters = normalizeFilters(search.filters);
  for (const criterion of search.unavailableCriteria ?? unavailableCriteria(search.filters)) {
    if ((criterion.field === "rarity" || criterion.field === "expansion")
      && typeof criterion.value === "string") {
      filters[criterion.field] = criterion.value.slice(0, 120);
    }
  }
  return filters;
}

function persistedSearch(search) {
  if (!validSearch(search)) return null;
  return {
    id: search.id,
    name: search.name.trim().slice(0, 60),
    schemaVersion: SAVED_SEARCH_SCHEMA_VERSION,
    filters: storedFilters(search),
    createdAt: search.createdAt,
    updatedAt: typeof search.updatedAt === "string" && !Number.isNaN(Date.parse(search.updatedAt))
      ? search.updatedAt
      : search.createdAt
  };
}

export function readSavedSearchesState(storage) {
  try {
    const parsed = JSON.parse(storage.getItem(SAVED_SEARCHES_KEY) ?? "[]");
    if (!Array.isArray(parsed)) {
      return { searches: [], issues: [{ type: "corrupt-storage" }] };
    }

    const searches = [];
    const issues = [];
    for (const search of parsed) {
      if (!validSearch(search)) {
        issues.push({ type: "invalid-record" });
        continue;
      }
      if (search.schemaVersion !== undefined && search.schemaVersion !== SAVED_SEARCH_SCHEMA_VERSION) {
        issues.push({ type: "unsupported-version", recordName: search.name.trim().slice(0, 60) });
        continue;
      }

      if (searches.length >= MAX_SEARCHES) continue;
      searches.push({
        id: search.id,
        name: search.name.trim().slice(0, 60),
        schemaVersion: SAVED_SEARCH_SCHEMA_VERSION,
        createdAt: search.createdAt,
        updatedAt: typeof search.updatedAt === "string" && !Number.isNaN(Date.parse(search.updatedAt))
          ? search.updatedAt
          : search.createdAt,
        filters: normalizeFilters(search.filters),
        unavailableCriteria: unavailableCriteria(search.filters)
      });
    }
    return { searches, issues };
  } catch {
    return { searches: [], issues: [{ type: "corrupt-storage" }] };
  }
}

export function readSavedSearches(storage) {
  return readSavedSearchesState(storage).searches;
}

export function writeSavedSearches(storage, searches) {
  try {
    const records = searches.slice(0, MAX_SEARCHES).map(persistedSearch).filter(Boolean);
    storage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(records));
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Storage unavailable" };
  }
}

function unsupportedSearches(storage) {
  try {
    const parsed = JSON.parse(storage.getItem(SAVED_SEARCHES_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((search) => validSearch(search)
      && search.schemaVersion !== undefined
      && search.schemaVersion !== SAVED_SEARCH_SCHEMA_VERSION);
  } catch {
    return [];
  }
}

function writeSearchMutation(storage, searches) {
  try {
    const records = searches.slice(0, MAX_SEARCHES).map(persistedSearch).filter(Boolean);
    storage.setItem(SAVED_SEARCHES_KEY, JSON.stringify([...records, ...unsupportedSearches(storage)]));
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Storage unavailable" };
  }
}

export function createSavedSearch({ name, filters }, now = () => new Date(), id = () => crypto.randomUUID()) {
  const cleanName = typeof name === "string" ? name.trim().slice(0, 60) : "";
  if (!cleanName) throw new TypeError("A search name is required");
  const timestamp = now().toISOString();
  return {
    id: id(),
    name: cleanName,
    schemaVersion: SAVED_SEARCH_SCHEMA_VERSION,
    filters: normalizeFilters(filters),
    createdAt: timestamp,
    updatedAt: timestamp,
    unavailableCriteria: []
  };
}

export function saveSearch(storage, search) {
  const current = readSavedSearches(storage);
  return writeSearchMutation(storage, [search, ...current.filter((item) => item.id !== search.id)]);
}

export function removeSearch(storage, id) {
  return writeSearchMutation(storage, readSavedSearches(storage).filter((search) => search.id !== id));
}

export function renameSearch(storage, id, name, now = () => new Date()) {
  const cleanName = typeof name === "string" ? name.trim().slice(0, 60) : "";
  if (!cleanName) return { ok: false, error: "A search name is required" };

  const searches = readSavedSearches(storage);
  const search = searches.find((item) => item.id === id);
  if (!search) return { ok: false, error: "Saved search not found" };
  search.name = cleanName;
  search.updatedAt = now().toISOString();
  return writeSearchMutation(storage, searches);
}
