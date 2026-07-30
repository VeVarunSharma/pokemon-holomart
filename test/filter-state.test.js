import test from "node:test";
import assert from "node:assert/strict";
import { activeFilterCount, DEFAULT_FILTERS, filterCards, normalizeFilters } from "../src/features/filters/filter-state.js";

const items = [
  { name: "Pikachu ex", set: "Surging Sparks", number: "238/191", rarity: "Special Illustration Rare", condition: "Near Mint", seller: "Mossdeep Cards" },
  { name: "Bulbasaur", set: "Scarlet & Violet—151", number: "166/165", rarity: "Illustration Rare", condition: "Near Mint", seller: "Viridian Vault" }
];

test("invalid filters safely normalize to defaults", () => {
  assert.deepEqual(normalizeFilters({ query: 42, rarity: "Legendary", expansion: null }), DEFAULT_FILTERS);
});

test("query is trimmed and capped", () => {
  const filters = normalizeFilters({ query: `  ${"x".repeat(140)}  ` });
  assert.equal(filters.query.length, 120);
});

test("filtering searches text and combines exact facets", () => {
  assert.deepEqual(filterCards(items, { query: "pikachu", rarity: "Special Illustration Rare", expansion: "Surging Sparks" }), [items[0]]);
  assert.deepEqual(filterCards(items, { query: "pikachu", rarity: "Illustration Rare" }), []);
});

test("active filter count ignores defaults and invalid values", () => {
  assert.equal(activeFilterCount({ query: "pikachu", rarity: "Special Illustration Rare", expansion: "bogus" }), 2);
});
