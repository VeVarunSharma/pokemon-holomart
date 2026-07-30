import test from "node:test";
import assert from "node:assert/strict";
import { filtersFromUrl, filtersToUrl } from "../src/features/share/share-state.js";
import { DEFAULT_FILTERS } from "../src/features/filters/filter-state.js";

test("URL serialization is stable and drops unrelated parameters", () => {
  const url = filtersToUrl(
    { query: "pikachu ex", rarity: "Special Illustration Rare", expansion: "Surging Sparks" },
    "https://example.test/app?old=value#catalog"
  );
  assert.equal(url, "https://example.test/app?q=pikachu+ex&rarity=Special+Illustration+Rare&expansion=Surging+Sparks#catalog");
});

test("default filters serialize without a query string", () => {
  assert.equal(filtersToUrl(DEFAULT_FILTERS, "https://example.test/?q=old"), "https://example.test/");
});

test("malformed and invalid URL state falls back safely", () => {
  assert.deepEqual(filtersFromUrl("http://[invalid"), DEFAULT_FILTERS);
  assert.deepEqual(filtersFromUrl("https://example.test/?rarity=Legendary&expansion=Unknown"), DEFAULT_FILTERS);
});

test("serialized filters round trip", () => {
  const expected = { query: "charizard", rarity: "Special Illustration Rare", expansion: "Paldean Fates" };
  assert.deepEqual(filtersFromUrl(filtersToUrl(expected, "https://example.test")), expected);
});
