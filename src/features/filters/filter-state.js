export const SENTIMENTS = Object.freeze(["All", "Positive", "Neutral", "Negative"]);
export const CHANNELS = Object.freeze(["All", "Interview", "Support", "Survey", "Community"]);
export const DEFAULT_FILTERS = Object.freeze({
  query: "",
  sentiment: "All",
  channel: "All"
});

export function normalizeFilters(input = {}) {
  const query = typeof input.query === "string" ? input.query.trim().slice(0, 120) : "";
  return {
    query,
    sentiment: SENTIMENTS.includes(input.sentiment) ? input.sentiment : DEFAULT_FILTERS.sentiment,
    channel: CHANNELS.includes(input.channel) ? input.channel : DEFAULT_FILTERS.channel
  };
}

export function filterFeedback(items, input) {
  const filters = normalizeFilters(input);
  const needle = filters.query.toLocaleLowerCase();
  return items.filter((item) => {
    const haystack = [item.company, item.contact, item.excerpt, item.theme, item.plan]
      .join(" ")
      .toLocaleLowerCase();
    return (!needle || haystack.includes(needle))
      && (filters.sentiment === "All" || item.sentiment === filters.sentiment)
      && (filters.channel === "All" || item.channel === filters.channel);
  });
}

export function activeFilterCount(input) {
  const filters = normalizeFilters(input);
  return Number(Boolean(filters.query))
    + Number(filters.sentiment !== "All")
    + Number(filters.channel !== "All");
}
