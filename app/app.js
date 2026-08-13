import { cards } from "/src/data/cards.js";
import { downloadCsv } from "/src/features/export/csv.js";
import { initializeStorefront } from "/src/storefront/initialize-storefront.js";

initializeStorefront({
  document,
  window,
  storage: window.localStorage,
  catalog: cards,
  downloadAdapter: downloadCsv
});
