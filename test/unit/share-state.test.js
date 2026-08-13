import { expect, test } from "vitest";
import { filtersFromUrl, filtersToUrl } from "../../src/features/share/share-state.js";
import { DEFAULT_FILTERS } from "../../src/features/filters/filter-state.js";

test("URL serialization is stable and drops unrelated parameters", () => {
  const url = filtersToUrl(
    { query: "pikachu ex", rarity: "Special Illustration Rare", expansion: "Surging Sparks" },
    "https://example.test/app?old=value#catalog"
  );
  expect(url).toBe("https://example.test/app?q=pikachu+ex&rarity=Special+Illustration+Rare&expansion=Surging+Sparks#catalog");
});

test("default filters serialize without a query string", () => {
  expect(filtersToUrl(DEFAULT_FILTERS, "https://example.test/?q=old")).toBe("https://example.test/");
});

test("malformed and invalid URL state falls back safely", () => {
  expect(filtersFromUrl("http://[invalid")).toEqual(DEFAULT_FILTERS);
  expect(filtersFromUrl("https://example.test/?rarity=Legendary&expansion=Unknown")).toEqual(DEFAULT_FILTERS);
});

test("serialized filters round trip", () => {
  const expected = { query: "charizard", rarity: "Special Illustration Rare", expansion: "Paldean Fates" };
  expect(filtersFromUrl(filtersToUrl(expected, "https://example.test"))).toEqual(expected);
});
