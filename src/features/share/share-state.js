import { DEFAULT_FILTERS, normalizeFilters } from "../filters/filter-state.js";

const PARAMS = Object.freeze({ query: "q", rarity: "rarity", expansion: "expansion" });

export function filtersToUrl(input, baseUrl) {
  const filters = normalizeFilters(input);
  const url = new URL(baseUrl);
  url.search = "";
  for (const [key, param] of Object.entries(PARAMS)) {
    if (filters[key] !== DEFAULT_FILTERS[key]) url.searchParams.set(param, filters[key]);
  }
  return url.toString();
}

export function filtersFromUrl(urlLike) {
  try {
    const url = new URL(urlLike, "http://holomart.local");
    return normalizeFilters({
      query: url.searchParams.get(PARAMS.query) ?? "",
      rarity: url.searchParams.get(PARAMS.rarity) ?? "All",
      expansion: url.searchParams.get(PARAMS.expansion) ?? "All"
    });
  } catch {
    return { ...DEFAULT_FILTERS };
  }
}
