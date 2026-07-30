import { normalizeFilters } from "../filters/filter-state.js";

export const SAVED_VIEWS_KEY = "signal-desk.saved-views.v1";
const MAX_VIEWS = 20;

function validView(value) {
  return value
    && typeof value.id === "string"
    && typeof value.name === "string"
    && value.name.trim().length > 0
    && typeof value.createdAt === "string"
    && !Number.isNaN(Date.parse(value.createdAt));
}

export function readSavedViews(storage) {
  try {
    const parsed = JSON.parse(storage.getItem(SAVED_VIEWS_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(validView).slice(0, MAX_VIEWS).map((view) => ({
      id: view.id,
      name: view.name.trim().slice(0, 60),
      createdAt: view.createdAt,
      filters: normalizeFilters(view.filters)
    }));
  } catch {
    return [];
  }
}

export function writeSavedViews(storage, views) {
  try {
    storage.setItem(SAVED_VIEWS_KEY, JSON.stringify(views.slice(0, MAX_VIEWS)));
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Storage unavailable" };
  }
}

export function createSavedView({ name, filters }, now = () => new Date(), id = () => crypto.randomUUID()) {
  const cleanName = typeof name === "string" ? name.trim().slice(0, 60) : "";
  if (!cleanName) throw new TypeError("A view name is required");
  return {
    id: id(),
    name: cleanName,
    filters: normalizeFilters(filters),
    createdAt: now().toISOString()
  };
}

export function saveView(storage, view) {
  const current = readSavedViews(storage);
  return writeSavedViews(storage, [view, ...current.filter((item) => item.id !== view.id)]);
}

export function removeView(storage, id) {
  return writeSavedViews(storage, readSavedViews(storage).filter((view) => view.id !== id));
}
