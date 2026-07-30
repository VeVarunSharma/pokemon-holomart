export const RARITIES = Object.freeze([
  "All",
  "Illustration Rare",
  "Special Illustration Rare",
  "Hyper Rare",
  "Secret Rare"
]);
export const EXPANSIONS = Object.freeze([
  "All",
  "Scarlet & Violet",
  "Scarlet & Violet—151",
  "Paldean Fates",
  "Paldea Evolved",
  "Twilight Masquerade",
  "Surging Sparks",
  "Crown Zenith",
  "Evolving Skies"
]);
export const DEFAULT_FILTERS = Object.freeze({
  query: "",
  rarity: "All",
  expansion: "All"
});

export function normalizeFilters(input = {}) {
  const query = typeof input.query === "string" ? input.query.trim().slice(0, 120) : "";
  return {
    query,
    rarity: RARITIES.includes(input.rarity) ? input.rarity : DEFAULT_FILTERS.rarity,
    expansion: EXPANSIONS.includes(input.expansion) ? input.expansion : DEFAULT_FILTERS.expansion
  };
}

export function filterCards(items, input) {
  const filters = normalizeFilters(input);
  const needle = filters.query.toLocaleLowerCase();
  return items.filter((item) => {
    const haystack = [item.name, item.set, item.number, item.rarity, item.condition, item.seller]
      .join(" ")
      .toLocaleLowerCase();
    return (!needle || haystack.includes(needle))
      && (filters.rarity === "All" || item.rarity === filters.rarity)
      && (filters.expansion === "All" || item.set === filters.expansion);
  });
}

export function activeFilterCount(input) {
  const filters = normalizeFilters(input);
  return Number(Boolean(filters.query))
    + Number(filters.rarity !== "All")
    + Number(filters.expansion !== "All");
}
