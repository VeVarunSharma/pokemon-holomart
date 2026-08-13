// @vitest-environment jsdom

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, expect, test, vi } from "vitest";
import { cards } from "../../src/data/cards.js";
import { SAVED_SEARCHES_KEY } from "../../src/features/saved-searches/storage.js";
import { initializeStorefront } from "../../src/storefront/initialize-storefront.js";

const indexHtml = await readFile(join(process.cwd(), "app", "index.html"), "utf8");
const initializedStorefronts = [];

function polyfillMissingBrowserApis() {
  const dialogPrototype = window.HTMLDialogElement.prototype;
  if (typeof dialogPrototype.showModal !== "function") {
    Object.defineProperty(dialogPrototype, "showModal", {
      configurable: true,
      value() {
        this.setAttribute("open", "");
      }
    });
  }
  if (typeof dialogPrototype.close !== "function") {
    Object.defineProperty(dialogPrototype, "close", {
      configurable: true,
      value(returnValue = "") {
        this.returnValue = returnValue;
        this.removeAttribute("open");
      }
    });
  }
  if (typeof window.requestAnimationFrame !== "function") {
    window.requestAnimationFrame = (callback) => window.setTimeout(() => callback(window.performance.now()), 0);
  }
}

function setupStorefront({ path = "/", storageValue } = {}) {
  document.open();
  document.write(indexHtml);
  document.close();
  window.history.replaceState(null, "", path);
  window.localStorage.clear();
  if (storageValue !== undefined) {
    window.localStorage.setItem(SAVED_SEARCHES_KEY, storageValue);
  }
  polyfillMissingBrowserApis();

  const downloadAdapter = vi.fn();
  const storefront = initializeStorefront({
    document,
    window,
    storage: window.localStorage,
    catalog: cards,
    downloadAdapter
  });
  initializedStorefronts.push(storefront);
  return { downloadAdapter };
}

function updateQuery(value) {
  const query = document.querySelector("#query");
  query.value = value;
  query.dispatchEvent(new window.Event("input", { bubbles: true }));
}

afterEach(() => {
  for (const storefront of initializedStorefronts.splice(0)) storefront.destroy();
  window.localStorage.clear();
});

test("renders the complete synthetic catalog and summary from the production markup", () => {
  setupStorefront();

  expect(document.querySelector("#results-label").textContent).toBe("12 of 12 synthetic listings");
  expect(document.querySelectorAll("#card-grid .product-card")).toHaveLength(12);
  expect(document.querySelector("#result-count").textContent).toBe("12");
  expect(document.querySelector("#under-market-count").textContent).toBe("11");
  expect(document.querySelector("#near-mint-count").textContent).toBe("10");
  expect(document.querySelector("#card-grid").hidden).toBe(false);
  expect(document.querySelector("#empty-state").hidden).toBe(true);
  expect(document.querySelector("#saved-searches-list").textContent).toContain("Save your first search");
});

test("syncs filters to the URL and recovers from an empty result", () => {
  setupStorefront();

  updateQuery("Pikachu");
  expect(window.location.search).toBe("?q=Pikachu");
  expect(document.querySelector("#filter-count").textContent).toBe("(1)");
  expect(document.querySelector("#result-count").textContent).toBe("1");
  expect(document.querySelector("#card-grid h3").textContent).toBe("Pikachu ex");

  updateQuery("missing synthetic listing");
  expect(window.location.search).toBe("?q=missing+synthetic+listing");
  expect(document.querySelector("#result-count").textContent).toBe("0");
  expect(document.querySelector("#card-grid").hidden).toBe(true);
  expect(document.querySelector("#empty-state").hidden).toBe(false);

  document.querySelector("#empty-clear-button").click();
  expect(window.location.search).toBe("");
  expect(document.querySelector("#query").value).toBe("");
  expect(document.querySelector("#result-count").textContent).toBe("12");
  expect(document.querySelector("#card-grid").hidden).toBe(false);
  expect(document.querySelector("#empty-state").hidden).toBe(true);
});

test("recovers malformed storage and supports Saved Search save, apply, rename, edit, and delete", () => {
  setupStorefront({ storageValue: "{not valid json" });
  expect(document.querySelector("#saved-searches-list").textContent).toContain("Save your first search");
  expect(document.querySelector("#saved-searches-list").textContent).toContain("Some saved search data couldn’t be loaded");

  updateQuery("Mew");
  document.querySelector("#save-search-button").click();
  const dialog = document.querySelector("#save-search-dialog");
  expect(dialog.open).toBe(true);

  document.querySelector("#search-name").value = "Mew shortlist";
  const form = document.querySelector("#save-search-form");
  const submitter = form.querySelector('button[value="default"]');
  form.dispatchEvent(new window.SubmitEvent("submit", {
    bubbles: true,
    cancelable: true,
    submitter
  }));

  expect(dialog.open).toBe(false);
  expect(document.querySelector("#saved-searches-list").textContent).toContain("Mew shortlist");
  const storedSearches = JSON.parse(window.localStorage.getItem(SAVED_SEARCHES_KEY));
  expect(storedSearches).toHaveLength(1);
  expect(storedSearches[0].filters.query).toBe("Mew");

  document.querySelector("#clear-button").click();
  expect(document.querySelector("#result-count").textContent).toBe("12");
  document.querySelector("[data-search-id]").click();
  expect(document.querySelector("#query").value).toBe("Mew");
  expect(document.querySelector("#result-count").textContent).toBe("1");
  expect(window.location.search).toBe("?q=Mew");
  expect(document.querySelector("[data-search-state]").textContent).toBe("Active");
  expect(document.querySelector("[data-search-id]").getAttribute("aria-current")).toBe("true");

  updateQuery("Mew ex");
  expect(document.querySelector("[data-search-state]").textContent).toBe("Edited");

  document.querySelector("[data-rename-id]").click();
  expect(document.querySelector("#save-dialog-title").textContent).toBe("Rename saved search");
  expect(document.querySelector("#search-name").value).toBe("Mew shortlist");
  document.querySelector("#search-name").value = "Mew favorites";
  form.dispatchEvent(new window.SubmitEvent("submit", {
    bubbles: true,
    cancelable: true,
    submitter
  }));
  expect(document.querySelector("#saved-searches-list").textContent).toContain("Mew favorites");
  expect(JSON.parse(window.localStorage.getItem(SAVED_SEARCHES_KEY))[0].id).toBe(storedSearches[0].id);

  vi.spyOn(window, "confirm").mockReturnValue(true);
  document.querySelector("[data-delete-id]").click();
  expect(document.querySelector("#saved-searches-list").textContent).toContain("Save your first search");
  expect(JSON.parse(window.localStorage.getItem(SAVED_SEARCHES_KEY))).toEqual([]);
});

test("explains and safely omits unavailable saved criteria", () => {
  setupStorefront({
    storageValue: JSON.stringify([{
      id: "stale",
      name: "Old taxonomy",
      schemaVersion: 1,
      createdAt: "2026-07-29T12:00:00Z",
      filters: { query: "Pikachu", rarity: "Legendary", expansion: "Base Set" }
    }])
  });

  expect(document.querySelector("#saved-searches-list").textContent)
    .toContain("Unavailable rarity “Legendary” and expansion “Base Set” will be omitted.");
  document.querySelector("[data-search-id]").click();
  expect(document.querySelector("#query").value).toBe("Pikachu");
  expect(document.querySelector("#rarity").value).toBe("All");
  expect(document.querySelector("#expansion").value).toBe("All");
  expect(document.querySelector("#toast").textContent)
    .toContain("Unavailable rarity “Legendary” and expansion “Base Set” were omitted.");
});

test("reports demo cart status and updates its count", () => {
  setupStorefront();
  const cart = document.querySelector("#cart-button");
  const toast = document.querySelector("#toast");

  cart.click();
  expect(toast.textContent).toBe("Your demo cart is empty");

  document.querySelector("[data-add-id]").click();
  expect(document.querySelector("#cart-count").textContent).toBe("1");
  expect(cart.getAttribute("aria-label")).toBe("Open cart, 1 item");
  expect(toast.textContent).toContain("added to your demo cart");

  cart.click();
  expect(toast.textContent).toBe("Your demo cart has 1 card");
});

test("invokes the injected export adapter with the visible catalog", () => {
  const { downloadAdapter } = setupStorefront();
  updateQuery("Pikachu");

  document.querySelector("#export-button").click();

  expect(downloadAdapter).toHaveBeenCalledOnce();
  expect(downloadAdapter).toHaveBeenCalledWith([expect.objectContaining({
    id: "SV08-238",
    name: "Pikachu ex"
  })]);
  expect(document.querySelector("#toast").textContent).toBe("Exported 1 card listings");
});
