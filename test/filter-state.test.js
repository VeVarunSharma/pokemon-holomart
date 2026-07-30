import test from "node:test";
import assert from "node:assert/strict";
import { activeFilterCount, DEFAULT_FILTERS, filterFeedback, normalizeFilters } from "../src/features/filters/filter-state.js";

const items = [
  { company: "Alpha", contact: "A", excerpt: "Needs team sharing", theme: "Collaboration", plan: "Enterprise", sentiment: "Negative", channel: "Interview" },
  { company: "Beta", contact: "B", excerpt: "Fast and clear", theme: "Performance", plan: "Starter", sentiment: "Positive", channel: "Survey" }
];

test("invalid filters safely normalize to defaults", () => {
  assert.deepEqual(normalizeFilters({ query: 42, sentiment: "Angry", channel: null }), DEFAULT_FILTERS);
});

test("query is trimmed and capped", () => {
  const filters = normalizeFilters({ query: `  ${"x".repeat(140)}  ` });
  assert.equal(filters.query.length, 120);
});

test("filtering searches text and combines exact facets", () => {
  assert.deepEqual(filterFeedback(items, { query: "team", sentiment: "Negative", channel: "Interview" }), [items[0]]);
  assert.deepEqual(filterFeedback(items, { query: "team", sentiment: "Positive" }), []);
});

test("active filter count ignores defaults and invalid values", () => {
  assert.equal(activeFilterCount({ query: "alpha", sentiment: "Negative", channel: "bogus" }), 2);
});
