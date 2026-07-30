import { DEFAULT_FILTERS, normalizeFilters } from "../filters/filter-state.js";

const PARAMS = Object.freeze({ query: "q", sentiment: "sentiment", channel: "channel" });

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
    const url = new URL(urlLike, "http://signal-desk.local");
    return normalizeFilters({
      query: url.searchParams.get(PARAMS.query) ?? "",
      sentiment: url.searchParams.get(PARAMS.sentiment) ?? "All",
      channel: url.searchParams.get(PARAMS.channel) ?? "All"
    });
  } catch {
    return { ...DEFAULT_FILTERS };
  }
}
