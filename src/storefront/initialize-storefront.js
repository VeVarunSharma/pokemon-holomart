import { activeFilterCount, DEFAULT_FILTERS, filterCards, normalizeFilters } from "../features/filters/filter-state.js";
import { filtersFromUrl, filtersToUrl } from "../features/share/share-state.js";
import {
  createSavedSearch,
  readSavedSearches,
  removeSearch,
  saveSearch
} from "../features/saved-searches/storage.js";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2
});

export function initializeStorefront({
  document: documentRef,
  window: windowRef,
  storage,
  catalog,
  downloadAdapter
}) {
  if (!documentRef?.querySelector || !windowRef?.location) {
    throw new TypeError("A browser document and window are required");
  }
  if (!storage?.getItem || !storage?.setItem) {
    throw new TypeError("A browser-compatible storage adapter is required");
  }
  if (!Array.isArray(catalog)) {
    throw new TypeError("A catalog array is required");
  }
  if (typeof downloadAdapter !== "function") {
    throw new TypeError("A download adapter is required");
  }

  const elements = {
    form: documentRef.querySelector("#filter-form"),
    query: documentRef.querySelector("#query"),
    rarity: documentRef.querySelector("#rarity"),
    expansion: documentRef.querySelector("#expansion"),
    clear: documentRef.querySelector("#clear-button"),
    emptyClear: documentRef.querySelector("#empty-clear-button"),
    filterCount: documentRef.querySelector("#filter-count"),
    resultsLabel: documentRef.querySelector("#results-label"),
    grid: documentRef.querySelector("#card-grid"),
    empty: documentRef.querySelector("#empty-state"),
    resultCount: documentRef.querySelector("#result-count"),
    underMarketCount: documentRef.querySelector("#under-market-count"),
    nearMintCount: documentRef.querySelector("#near-mint-count"),
    export: documentRef.querySelector("#export-button"),
    openSave: documentRef.querySelector("#save-search-button"),
    quickSave: documentRef.querySelector("#quick-save-button"),
    dialog: documentRef.querySelector("#save-search-dialog"),
    dialogForm: documentRef.querySelector("#save-search-form"),
    name: documentRef.querySelector("#search-name"),
    preview: documentRef.querySelector("#filter-preview"),
    searches: documentRef.querySelector("#saved-searches-list"),
    cart: documentRef.querySelector("#cart-button"),
    cartCount: documentRef.querySelector("#cart-count"),
    toast: documentRef.querySelector("#toast")
  };

  const missingElement = Object.entries(elements).find(([, element]) => !element);
  if (missingElement) {
    throw new Error(`Storefront markup is missing #${missingElement[0]}`);
  }

  let filters = filtersFromUrl(windowRef.location.href);
  let visibleCards = [];
  let cartCount = 0;
  let toastTimer;

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[character]);
  }

  function syncControls() {
    elements.query.value = filters.query;
    elements.rarity.value = filters.rarity;
    elements.expansion.value = filters.expansion;
  }

  function marketMessage(card) {
    const difference = Math.abs(card.marketPrice - card.price);
    if (difference < 0.01) return "At market";
    return card.price < card.marketPrice
      ? `${currency.format(difference)} below market`
      : `${currency.format(difference)} above market`;
  }

  function renderCatalog() {
    visibleCards = filterCards(catalog, filters);
    const count = activeFilterCount(filters);

    elements.filterCount.textContent = count ? `(${count})` : "";
    elements.clear.disabled = count === 0;
    elements.resultsLabel.textContent = `${visibleCards.length} of ${catalog.length} synthetic listings`;
    elements.resultCount.textContent = visibleCards.length;
    elements.underMarketCount.textContent = visibleCards.filter((card) => card.price <= card.marketPrice).length;
    elements.nearMintCount.textContent = visibleCards.filter((card) => card.condition === "Near Mint").length;

    elements.grid.innerHTML = visibleCards.map((card) => `
      <article class="product-card">
        <div class="card-visual ${escapeHtml(card.artClass)}">
          <span class="listing-badge">${escapeHtml(card.badge)}</span>
          <span class="card-code">${escapeHtml(card.id)}</span>
          <span class="foil-orbit"></span>
          <strong aria-hidden="true">${escapeHtml(card.glyph)}</strong>
          <small>${escapeHtml(card.name)}</small>
        </div>
        <div class="product-copy">
          <p class="set-line">${escapeHtml(card.set)} <span>•</span> ${escapeHtml(card.number)}</p>
          <h3>${escapeHtml(card.name)}</h3>
          <div class="tag-row">
            <span>${escapeHtml(card.rarity)}</span>
            <span>${escapeHtml(card.condition)}</span>
          </div>
          <div class="price-row">
            <div>
              <strong>${currency.format(card.price)}</strong>
              <small>${escapeHtml(marketMessage(card))}</small>
            </div>
            <button class="add-button" type="button" data-add-id="${escapeHtml(card.id)}" aria-label="Add ${escapeHtml(card.name)} to cart">
              <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
            </button>
          </div>
          <div class="seller-row">
            <span class="seller-avatar" aria-hidden="true">${escapeHtml(card.seller.slice(0, 1))}</span>
            <span><strong>${escapeHtml(card.seller)}</strong><small>★ ${card.rating.toFixed(1)} · ${card.reviews} sales</small></span>
            <em>${card.stock} left</em>
          </div>
        </div>
      </article>
    `).join("");

    elements.empty.hidden = visibleCards.length !== 0;
    elements.grid.hidden = visibleCards.length === 0;
  }

  function updateFilters(next, { replaceHistory = true } = {}) {
    filters = normalizeFilters(next);
    syncControls();
    renderCatalog();
    if (replaceHistory) {
      windowRef.history.replaceState(null, "", filtersToUrl(filters, windowRef.location.href));
    }
  }

  function showToast(message) {
    windowRef.clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.hidden = false;
    toastTimer = windowRef.setTimeout(() => {
      elements.toast.hidden = true;
    }, 2600);
  }

  function describeFilters(searchFilters) {
    const parts = [];
    if (searchFilters.query) parts.push(`“${searchFilters.query}”`);
    if (searchFilters.rarity !== "All") parts.push(searchFilters.rarity);
    if (searchFilters.expansion !== "All") parts.push(searchFilters.expansion);
    return parts.length ? parts.join(" · ") : "All card listings";
  }

  function renderSavedSearches() {
    const searches = readSavedSearches(storage);
    elements.searches.innerHTML = searches.length
      ? `<div class="search-list">${searches.map((search) => `
          <div class="saved-search">
            <button class="saved-search-apply" type="button" data-search-id="${escapeHtml(search.id)}">
              <strong>${escapeHtml(search.name)}</strong>
              <small>${escapeHtml(describeFilters(search.filters))}</small>
            </button>
            <button class="delete-search" type="button" data-delete-id="${escapeHtml(search.id)}" aria-label="Delete ${escapeHtml(search.name)}">×</button>
          </div>`).join("")}</div>`
      : `<div class="searches-empty">
          <span aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M6 4h12v16l-6-3-6 3z"/></svg></span>
          <strong>Save your first search</strong>
          <p>Keep a shortcut to the cards and expansions you collect.</p>
        </div>`;
  }

  function openSaveDialog() {
    elements.name.value = "";
    const chips = describeFilters(filters).split(" · ");
    elements.preview.innerHTML = chips.map((part) => `<span>${escapeHtml(part)}</span>`).join("");
    elements.dialog.showModal();
    windowRef.requestAnimationFrame(() => elements.name.focus());
  }

  function addCardToCart(cardId) {
    const card = catalog.find((item) => item.id === cardId);
    if (!card) {
      showToast("This listing is no longer available");
      return;
    }
    cartCount += 1;
    elements.cartCount.textContent = cartCount;
    elements.cart.setAttribute("aria-label", `Open cart, ${cartCount} ${cartCount === 1 ? "item" : "items"}`);
    showToast(`${card.name} added to your demo cart`);
  }

  const removeListeners = [];
  function listen(target, type, listener) {
    target.addEventListener(type, listener);
    removeListeners.push(() => target.removeEventListener(type, listener));
  }

  listen(elements.form, "input", () => updateFilters(Object.fromEntries(new windowRef.FormData(elements.form))));
  listen(elements.form, "submit", (event) => event.preventDefault());
  listen(elements.clear, "click", () => updateFilters(DEFAULT_FILTERS));
  listen(elements.emptyClear, "click", () => updateFilters(DEFAULT_FILTERS));
  listen(elements.openSave, "click", openSaveDialog);
  listen(elements.quickSave, "click", openSaveDialog);
  listen(elements.export, "click", () => {
    downloadAdapter(visibleCards);
    showToast(`Exported ${visibleCards.length} card listings`);
  });
  listen(elements.grid, "click", (event) => {
    const button = event.target.closest("[data-add-id]");
    if (button) addCardToCart(button.dataset.addId);
  });
  listen(elements.cart, "click", () => {
    showToast(cartCount
      ? `Your demo cart has ${cartCount} ${cartCount === 1 ? "card" : "cards"}`
      : "Your demo cart is empty");
  });
  listen(elements.dialogForm, "submit", (event) => {
    if (event.submitter?.value === "cancel") return;
    event.preventDefault();
    if (!elements.dialogForm.reportValidity()) return;

    const search = createSavedSearch({ name: elements.name.value, filters });
    const result = saveSearch(storage, search);
    if (!result.ok) {
      showToast("Couldn’t save this search in your browser");
      return;
    }

    elements.dialog.close();
    renderSavedSearches();
    showToast(`Saved “${search.name}” on this device`);
  });
  listen(elements.searches, "click", (event) => {
    const applyButton = event.target.closest("[data-search-id]");
    const deleteButton = event.target.closest("[data-delete-id]");

    if (applyButton) {
      const search = readSavedSearches(storage).find((item) => item.id === applyButton.dataset.searchId);
      if (search) {
        updateFilters(search.filters);
        showToast(`Applied “${search.name}”`);
      }
    }

    if (deleteButton) {
      const result = removeSearch(storage, deleteButton.dataset.deleteId);
      renderSavedSearches();
      showToast(result.ok ? "Saved search removed" : "Couldn’t remove this search");
    }
  });
  listen(documentRef, "keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      elements.query.focus();
    }
  });

  syncControls();
  renderCatalog();
  renderSavedSearches();

  return {
    destroy() {
      windowRef.clearTimeout(toastTimer);
      for (const removeListener of removeListeners) removeListener();
    }
  };
}
