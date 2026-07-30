import { cards } from "/src/data/cards.js";
import { activeFilterCount, DEFAULT_FILTERS, filterCards, normalizeFilters } from "/src/features/filters/filter-state.js";
import { downloadCsv } from "/src/features/export/csv.js";
import { filtersFromUrl, filtersToUrl } from "/src/features/share/share-state.js";
import {
  createSavedSearch,
  readSavedSearches,
  removeSearch,
  saveSearch
} from "/src/features/saved-searches/storage.js";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2
});

const elements = {
  form: document.querySelector("#filter-form"),
  query: document.querySelector("#query"),
  rarity: document.querySelector("#rarity"),
  expansion: document.querySelector("#expansion"),
  clear: document.querySelector("#clear-button"),
  emptyClear: document.querySelector("#empty-clear-button"),
  filterCount: document.querySelector("#filter-count"),
  resultsLabel: document.querySelector("#results-label"),
  grid: document.querySelector("#card-grid"),
  empty: document.querySelector("#empty-state"),
  resultCount: document.querySelector("#result-count"),
  underMarketCount: document.querySelector("#under-market-count"),
  nearMintCount: document.querySelector("#near-mint-count"),
  export: document.querySelector("#export-button"),
  openSave: document.querySelector("#save-search-button"),
  quickSave: document.querySelector("#quick-save-button"),
  dialog: document.querySelector("#save-search-dialog"),
  dialogForm: document.querySelector("#save-search-form"),
  name: document.querySelector("#search-name"),
  preview: document.querySelector("#filter-preview"),
  searches: document.querySelector("#saved-searches-list"),
  cart: document.querySelector("#cart-button"),
  cartCount: document.querySelector("#cart-count"),
  toast: document.querySelector("#toast")
};

let filters = filtersFromUrl(window.location.href);
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
  visibleCards = filterCards(cards, filters);
  const count = activeFilterCount(filters);

  elements.filterCount.textContent = count ? `(${count})` : "";
  elements.clear.disabled = count === 0;
  elements.resultsLabel.textContent = `${visibleCards.length} of ${cards.length} synthetic listings`;
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
    history.replaceState(null, "", filtersToUrl(filters, window.location.href));
  }
}

function showToast(message) {
  clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.hidden = false;
  toastTimer = setTimeout(() => {
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
  const searches = readSavedSearches(localStorage);
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
  requestAnimationFrame(() => elements.name.focus());
}

function addCardToCart(cardId) {
  const card = cards.find((item) => item.id === cardId);
  if (!card) {
    showToast("This listing is no longer available");
    return;
  }
  cartCount += 1;
  elements.cartCount.textContent = cartCount;
  elements.cart.setAttribute("aria-label", `Open cart, ${cartCount} ${cartCount === 1 ? "item" : "items"}`);
  showToast(`${card.name} added to your demo cart`);
}

elements.form.addEventListener("input", () => updateFilters(Object.fromEntries(new FormData(elements.form))));
elements.form.addEventListener("submit", (event) => event.preventDefault());
elements.clear.addEventListener("click", () => updateFilters(DEFAULT_FILTERS));
elements.emptyClear.addEventListener("click", () => updateFilters(DEFAULT_FILTERS));
elements.openSave.addEventListener("click", openSaveDialog);
elements.quickSave.addEventListener("click", openSaveDialog);
elements.export.addEventListener("click", () => {
  downloadCsv(visibleCards);
  showToast(`Exported ${visibleCards.length} card listings`);
});
elements.grid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-add-id]");
  if (button) addCardToCart(button.dataset.addId);
});
elements.cart.addEventListener("click", () => {
  showToast(cartCount
    ? `Your demo cart has ${cartCount} ${cartCount === 1 ? "card" : "cards"}`
    : "Your demo cart is empty");
});
elements.dialogForm.addEventListener("submit", (event) => {
  if (event.submitter?.value === "cancel") return;
  event.preventDefault();
  if (!elements.dialogForm.reportValidity()) return;

  const search = createSavedSearch({ name: elements.name.value, filters });
  const result = saveSearch(localStorage, search);
  if (!result.ok) {
    showToast("Couldn’t save this search in your browser");
    return;
  }

  elements.dialog.close();
  renderSavedSearches();
  showToast(`Saved “${search.name}” on this device`);
});
elements.searches.addEventListener("click", (event) => {
  const applyButton = event.target.closest("[data-search-id]");
  const deleteButton = event.target.closest("[data-delete-id]");

  if (applyButton) {
    const search = readSavedSearches(localStorage).find((item) => item.id === applyButton.dataset.searchId);
    if (search) {
      updateFilters(search.filters);
      showToast(`Applied “${search.name}”`);
    }
  }

  if (deleteButton) {
    const result = removeSearch(localStorage, deleteButton.dataset.deleteId);
    renderSavedSearches();
    showToast(result.ok ? "Saved search removed" : "Couldn’t remove this search");
  }
});
document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    elements.query.focus();
  }
});

syncControls();
renderCatalog();
renderSavedSearches();
