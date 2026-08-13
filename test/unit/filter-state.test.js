import { expect, test } from "vitest";
import { activeFilterCount, DEFAULT_FILTERS, filterCards, normalizeFilters } from "../../src/features/filters/filter-state.js";

const items = [
  { name: "Pikachu ex", set: "Surging Sparks", number: "238/191", rarity: "Special Illustration Rare", condition: "Near Mint", seller: "Mossdeep Cards" },
  { name: "Bulbasaur", set: "Scarlet & Violet—151", number: "166/165", rarity: "Illustration Rare", condition: "Near Mint", seller: "Viridian Vault" }
];

test("invalid filters safely normalize to defaults", () => {
  expect(normalizeFilters({ query: 42, rarity: "Legendary", expansion: null })).toEqual(DEFAULT_FILTERS);
});

test("query is trimmed and capped", () => {
  const filters = normalizeFilters({ query: `  ${"x".repeat(140)}  ` });
  expect(filters.query).toHaveLength(120);
});

test("filtering searches text and combines exact facets", () => {
  expect(filterCards(items, { query: "pikachu", rarity: "Special Illustration Rare", expansion: "Surging Sparks" })).toEqual([items[0]]);
  expect(filterCards(items, { query: "pikachu", rarity: "Illustration Rare" })).toEqual([]);
});

test("active filter count ignores defaults and invalid values", () => {
  expect(activeFilterCount({ query: "pikachu", rarity: "Special Illustration Rare", expansion: "bogus" })).toBe(2);
});
