import { text } from "node:stream/consumers";
import { expect, test } from "@playwright/test";

const CATALOG_SIZE = 12;
const SAVED_SEARCHES_KEY = "holomart.saved-searches.v1";

async function expectUrlFilters(page, expected) {
  await expect.poll(() => Object.fromEntries(new URL(page.url()).searchParams.entries())).toEqual(expected);
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.goto("/");
});

test("loads the storefront with its synthetic catalog boundary", async ({ page }) => {
  await expect(page).toHaveTitle(/HoloMart/);
  await expect(page.getByRole("heading", {
    level: 1,
    name: "Find the card your binder is missing."
  })).toBeVisible();
  await expect(page.getByRole("heading", {
    level: 2,
    name: "Shop the latest chase cards"
  })).toBeVisible();
  await expect(page.getByRole("heading", {
    level: 2,
    name: "Saved searches"
  })).toBeVisible();

  await expect(page.getByText(`${CATALOG_SIZE} of ${CATALOG_SIZE} synthetic listings`, {
    exact: true
  })).toBeVisible();
  await expect(page.getByRole("article")).toHaveCount(CATALOG_SIZE);
  await expect(page.getByText("Demo inventory", { exact: true })).toBeVisible();
  await expect(page.getByText(
    /Fictional product demo\. Inventory, sellers, ratings, availability, and prices are synthetic\./
  )).toBeVisible();
});

test("filters listings, restores URL state, and recovers from no results", async ({ page }) => {
  const search = page.getByRole("searchbox", { name: "Search cards" });
  const rarity = page.getByRole("combobox", { name: "Rarity" });
  const expansion = page.getByRole("combobox", { name: "Expansion" });

  await search.fill("Pikachu");
  await rarity.selectOption("Special Illustration Rare");
  await expansion.selectOption("Surging Sparks");

  await expectUrlFilters(page, {
    q: "Pikachu",
    rarity: "Special Illustration Rare",
    expansion: "Surging Sparks"
  });
  await expect(page.getByText(`1 of ${CATALOG_SIZE} synthetic listings`, {
    exact: true
  })).toBeVisible();
  await expect(page.getByRole("article")).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 3, name: "Pikachu ex" })).toBeVisible();

  await page.reload();

  await expect(search).toHaveValue("Pikachu");
  await expect(rarity).toHaveValue("Special Illustration Rare");
  await expect(expansion).toHaveValue("Surging Sparks");
  await expect(page.getByRole("article")).toHaveCount(1);

  await search.fill("missing synthetic listing");

  await expect(page.getByRole("heading", {
    level: 2,
    name: "No cards match this search"
  })).toBeVisible();
  await expect(page.getByText(`0 of ${CATALOG_SIZE} synthetic listings`, {
    exact: true
  })).toBeVisible();
  await expect(page.getByRole("article")).toHaveCount(0);
  await expectUrlFilters(page, {
    q: "missing synthetic listing",
    rarity: "Special Illustration Rare",
    expansion: "Surging Sparks"
  });

  await page.getByRole("button", { name: "Clear filters" }).click();

  await expectUrlFilters(page, {});
  await expect(search).toHaveValue("");
  await expect(rarity).toHaveValue("All");
  await expect(expansion).toHaveValue("All");
  await expect(page.getByRole("article")).toHaveCount(CATALOG_SIZE);
  await expect(page.getByRole("heading", {
    level: 2,
    name: "No cards match this search"
  })).toBeHidden();
});

test("persists a Saved Search across reload, then applies and deletes it", async ({ page }) => {
  const savedSearchName = "151 illustration rares";
  const rarity = page.getByRole("combobox", { name: "Rarity" });
  const expansion = page.getByRole("combobox", { name: "Expansion" });

  await expect(page.getByText("Save your first search", { exact: true })).toBeVisible();
  await rarity.selectOption("Illustration Rare");
  await expansion.selectOption("Scarlet & Violet—151");
  await page.getByRole("button", { name: "Save this search", exact: true }).click();

  const dialog = page.getByRole("dialog", { name: "Save this search" });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Search name").fill(savedSearchName);
  await dialog.getByRole("button", { name: "Save search", exact: true }).click();

  await expect(dialog).toBeHidden();
  await expect(page.getByRole("status")).toHaveText(`Saved “${savedSearchName}” on this device`);
  await expect(page.getByRole("button", { name: new RegExp(`^${savedSearchName}`) })).toBeVisible();

  const storedSearches = await page.evaluate(
    (key) => JSON.parse(window.localStorage.getItem(key)),
    SAVED_SEARCHES_KEY
  );
  expect(storedSearches).toHaveLength(1);
  expect(storedSearches[0]).toMatchObject({
    name: savedSearchName,
    schemaVersion: 1,
    filters: {
      query: "",
      rarity: "Illustration Rare",
      expansion: "Scarlet & Violet—151"
    }
  });

  await page.reload();

  const savedSearch = page.getByRole("button", { name: new RegExp(`^${savedSearchName}`) });
  await expect(savedSearch).toBeVisible();
  await page.getByRole("button", { name: /^Clear/ }).click();
  await expect(page.getByRole("article")).toHaveCount(CATALOG_SIZE);

  await savedSearch.click();

  await expect(page.getByRole("status")).toHaveText(`Applied “${savedSearchName}”`);
  await expect(savedSearch).toBeFocused();
  await expect(page.getByText("Active", { exact: true })).toBeVisible();
  await expect(rarity).toHaveValue("Illustration Rare");
  await expect(expansion).toHaveValue("Scarlet & Violet—151");
  await expect(page.getByRole("article")).toHaveCount(2);
  await expectUrlFilters(page, {
    rarity: "Illustration Rare",
    expansion: "Scarlet & Violet—151"
  });

  await page.getByRole("searchbox", { name: "Search cards" }).fill("illustration");
  await expect(page.getByText("Edited", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: `Update ${savedSearchName}` })).toBeVisible();
  await expect(page.getByRole("button", { name: `Save edits to ${savedSearchName} as new` })).toBeVisible();

  await page.getByRole("button", { name: `Rename ${savedSearchName}` }).click();
  const renameDialog = page.getByRole("dialog", { name: "Rename saved search" });
  await expect(renameDialog.getByLabel("Search name")).toBeFocused();
  await renameDialog.getByLabel("Search name").fill("151 favorites");
  await renameDialog.getByRole("button", { name: "Rename search" }).click();
  await expect(page.getByRole("button", { name: /^151 favorites/ })).toBeVisible();

  page.once("dialog", async (confirmation) => {
    expect(confirmation.message()).toBe("Delete “151 favorites” from this device?");
    await confirmation.accept();
  });
  await page.getByRole("button", { name: "Delete 151 favorites" }).click();

  await expect(page.getByRole("status")).toHaveText("Saved search removed");
  await expect(page.getByText("Save your first search", { exact: true })).toBeVisible();
  await expect(page.evaluate((key) => window.localStorage.getItem(key), SAVED_SEARCHES_KEY))
    .resolves.toBe("[]");

  await page.reload();
  await expect(page.getByText("Save your first search", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /^151 favorites/ })).toHaveCount(0);
});

test("updates the demo cart count, accessible label, and visible status", async ({ page }) => {
  const emptyCart = page.getByRole("button", { name: "Open cart, 0 items" });
  await expect(emptyCart.getByText("0", { exact: true })).toBeVisible();

  await emptyCart.click();
  await expect(page.getByRole("status")).toHaveText("Your demo cart is empty");

  await page.getByRole("button", { name: "Add Pikachu ex to cart" }).click();

  const cartWithItem = page.getByRole("button", { name: "Open cart, 1 item" });
  await expect(cartWithItem).toBeVisible();
  await expect(cartWithItem.getByText("1", { exact: true })).toBeVisible();
  await expect(page.getByRole("status")).toHaveText("Pikachu ex added to your demo cart");

  await cartWithItem.click();
  await expect(page.getByRole("status")).toHaveText("Your demo cart has 1 card");
});

test("downloads deterministic CSV for the visible synthetic listing", async ({ page }) => {
  await page.getByRole("searchbox", { name: "Search cards" }).fill("Pikachu");
  await expect(page.getByRole("article")).toHaveCount(1);

  const beforeDate = new Date().toISOString().slice(0, 10);
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export catalog" }).click();
  const download = await downloadPromise;
  await expect(page.getByRole("status")).toHaveText("Exported 1 card listings");
  const afterDate = new Date().toISOString().slice(0, 10);

  expect([
    `holomart-card-catalog-${beforeDate}.csv`,
    `holomart-card-catalog-${afterDate}.csv`
  ]).toContain(download.suggestedFilename());

  const stream = await download.createReadStream();
  expect(stream).not.toBeNull();
  await expect(text(stream)).resolves.toBe([
    "ID,Card,Expansion,Number,Rarity,Condition,Price,Market price,Seller,Stock",
    "SV08-238,Pikachu ex,Surging Sparks,238/191,Special Illustration Rare,Near Mint,329,341.28,Mossdeep Cards,1"
  ].join("\r\n"));
});

test("moves keyboard focus to card search with Ctrl+K", async ({ page }) => {
  const search = page.getByRole("searchbox", { name: "Search cards" });
  await page.getByRole("button", { name: "Open cart, 0 items" }).focus();

  await page.keyboard.press("Control+K");

  await expect(search).toBeFocused();
  await search.fill("Mew");
  await expect(page.getByRole("article")).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 3, name: "Mew ex" })).toBeVisible();
});
