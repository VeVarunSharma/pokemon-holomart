import { readFile } from "node:fs/promises";
import { describe, expect, test } from "vitest";
import { cards } from "../../src/data/cards.js";

const readRepositoryFile = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8");

describe("listing trust content", () => {
  test("documents the ordered synthetic signal hierarchy and unresolved decision", async () => {
    const guide = await readRepositoryFile("design/listing-signal-content-guide.md");

    expect(guide).toContain("**Provenance: SYNTHETIC / DEMO-ONLY.**");
    expect(guide.indexOf("| 1 | Listing price |")).toBeLessThan(guide.indexOf("| 2 | Condition |"));
    expect(guide.indexOf("| 2 | Condition |")).toBeLessThan(guide.indexOf("| 3 | Seller context |"));
    expect(guide.indexOf("| 3 | Seller context |")).toBeLessThan(guide.indexOf("| 4 | Market context |"));
    expect(guide).toContain("still an unresolved human decision");
  });

  test("keeps customer-facing demo artifacts free of guarantee claims", async () => {
    const artifacts = await Promise.all([
      readRepositoryFile("app/index.html"),
      readRepositoryFile("design/holomart-existing-state-wireframe.svg")
    ]);
    const customerFacingContent = artifacts.join("\n");

    expect(customerFacingContent).not.toMatch(/condition[- ]graded|condition guaranteed|trusted seller/i);
    expect(customerFacingContent).not.toMatch(/\b(?:at|below|above) market\b|great value/i);
    expect(customerFacingContent).toContain("Seller-reported condition");
    expect(customerFacingContent).toContain("freshness unavailable");
    expect(cards.some(({ badge }) => /authentic|great value|\b(?:at|below|above) market\b/i.test(badge)))
      .toBe(false);
  });
});
