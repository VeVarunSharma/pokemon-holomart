import test from "node:test";
import assert from "node:assert/strict";
import { filtersFromUrl, filtersToUrl } from "../src/features/share/share-state.js";
import { DEFAULT_FILTERS } from "../src/features/filters/filter-state.js";

test("URL serialization is stable and drops unrelated parameters", () => {
  const url = filtersToUrl(
    { query: "churn risk", sentiment: "Negative", channel: "Interview" },
    "https://example.test/app?old=value#feedback"
  );
  assert.equal(url, "https://example.test/app?q=churn+risk&sentiment=Negative&channel=Interview#feedback");
});

test("default filters serialize without a query string", () => {
  assert.equal(filtersToUrl(DEFAULT_FILTERS, "https://example.test/?q=old"), "https://example.test/");
});

test("malformed and invalid URL state falls back safely", () => {
  assert.deepEqual(filtersFromUrl("http://[invalid"), DEFAULT_FILTERS);
  assert.deepEqual(filtersFromUrl("https://example.test/?sentiment=Furious&channel=Pager"), DEFAULT_FILTERS);
});

test("serialized filters round trip", () => {
  const expected = { query: "billing", sentiment: "Neutral", channel: "Support" };
  assert.deepEqual(filtersFromUrl(filtersToUrl(expected, "https://example.test")), expected);
});
