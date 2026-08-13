import { expect, test } from "vitest";
import { cardsToCsv, escapeCsv } from "../../src/features/export/csv.js";

test("CSV escaping handles commas, quotes, line breaks, null, and numbers", () => {
  expect(escapeCsv('A "quoted", value')).toBe('"A ""quoted"", value"');
  expect(escapeCsv("line one\nline two")).toBe('"line one\nline two"');
  expect(escapeCsv(null)).toBe("");
  expect(escapeCsv(42)).toBe("42");
});

test("catalog export has deterministic columns and CRLF rows", () => {
  const csv = cardsToCsv([{
    id: "SV-1", name: "Pikachu ex", set: "Scarlet & Violet, Demo", number: "001/100",
    rarity: "Illustration Rare", condition: "Near Mint", price: 42,
    marketPrice: 44.5, seller: 'Ace "Cards"', stock: 2
  }]);
  const [header, row] = csv.split("\r\n");
  expect(header).toBe("ID,Card,Expansion,Number,Rarity,Condition,Price,Market price,Seller,Stock");
  expect(row).toBe('SV-1,Pikachu ex,"Scarlet & Violet, Demo",001/100,Illustration Rare,Near Mint,42,44.5,"Ace ""Cards""",2');
});

test("empty exports still include headers", () => {
  expect(cardsToCsv([])).toMatch(/^ID,Card,/);
});
