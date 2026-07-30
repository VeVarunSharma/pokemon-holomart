import { normalizeFilters } from "../filters/filter-state.js";

export const SAVED_SEARCHES_KEY = "holomart.saved-searches.v1";
const MAX_SEARCHES = 20;

function validSearch(value) {
  return value
    && typeof value.id === "string"
    && typeof value.name === "string"
    && value.name.trim().length > 0
    && typeof value.createdAt === "string"
    && !Number.isNaN(Date.parse(value.createdAt));
}

export function readSavedSearches(storage) {
  try {
    const parsed = JSON.parse(storage.getItem(SAVED_SEARCHES_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(validSearch).slice(0, MAX_SEARCHES).map((search) => ({
      id: search.id,
      name: search.name.trim().slice(0, 60),
      createdAt: search.createdAt,
      filters: normalizeFilters(search.filters)
    }));
  } catch {
    return [];
  }
}

export function writeSavedSearches(storage, searches) {
  try {
    storage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(searches.slice(0, MAX_SEARCHES)));
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Storage unavailable" };
  }
}

export function createSavedSearch({ name, filters }, now = () => new Date(), id = () => crypto.randomUUID()) {
  const cleanName = typeof name === "string" ? name.trim().slice(0, 60) : "";
  if (!cleanName) throw new TypeError("A search name is required");
  return {
    id: id(),
    name: cleanName,
    filters: normalizeFilters(filters),
    createdAt: now().toISOString()
  };
}

export function saveSearch(storage, search) {
  const current = readSavedSearches(storage);
  return writeSavedSearches(storage, [search, ...current.filter((item) => item.id !== search.id)]);
}

export function removeSearch(storage, id) {
  return writeSavedSearches(storage, readSavedSearches(storage).filter((search) => search.id !== id));
}
