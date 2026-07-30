import test from "node:test";
import assert from "node:assert/strict";
import { escapeCsv, feedbackToCsv } from "../src/features/export/csv.js";

test("CSV escaping handles commas, quotes, line breaks, null, and numbers", () => {
  assert.equal(escapeCsv('A "quoted", value'), '"A ""quoted"", value"');
  assert.equal(escapeCsv("line one\nline two"), '"line one\nline two"');
  assert.equal(escapeCsv(null), "");
  assert.equal(escapeCsv(42), "42");
});

test("feedback export has deterministic columns and CRLF rows", () => {
  const csv = feedbackToCsv([{
    id: "FB-1", company: "Acme, Inc.", channel: "Survey", theme: "Export",
    sentiment: "Neutral", plan: "Scale", date: "2026-01-01",
    excerpt: 'Needs "clean" CSV', votes: 4
  }]);
  const [header, row] = csv.split("\r\n");
  assert.equal(header, "ID,Company,Channel,Theme,Sentiment,Plan,Date,Feedback,Votes");
  assert.equal(row, 'FB-1,"Acme, Inc.",Survey,Export,Neutral,Scale,2026-01-01,"Needs ""clean"" CSV",4');
});

test("empty exports still include headers", () => {
  assert.match(feedbackToCsv([]), /^ID,Company,/);
});
