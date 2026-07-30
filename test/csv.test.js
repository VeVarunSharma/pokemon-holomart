import test from "node:test";
import assert from "node:assert/strict";
import { cardsToCsv, escapeCsv } from "../src/features/export/csv.js";

test("CSV escaping handles commas, quotes, line breaks, null, and numbers", () => {
  assert.equal(escapeCsv('A "quoted", value'), '"A ""quoted"", value"');
  assert.equal(escapeCsv("line one\nline two"), '"line one\nline two"');
  assert.equal(escapeCsv(null), "");
  assert.equal(escapeCsv(42), "42");
});

test("catalog export has deterministic columns and CRLF rows", () => {
  const csv = cardsToCsv([{
    id: "SV-1", name: "Pikachu ex", set: "Scarlet & Violet, Demo", number: "001/100",
    rarity: "Illustration Rare", condition: "Near Mint", price: 42,
    marketPrice: 44.5, seller: 'Ace "Cards"', stock: 2
  }]);
  const [header, row] = csv.split("\r\n");
  assert.equal(header, "ID,Card,Expansion,Number,Rarity,Condition,Price,Market price,Seller,Stock");
  assert.equal(row, 'SV-1,Pikachu ex,"Scarlet & Violet, Demo",001/100,Illustration Rare,Near Mint,42,44.5,"Ace ""Cards""",2');
});

test("empty exports still include headers", () => {
  assert.match(cardsToCsv([]), /^ID,Card,/);
});
