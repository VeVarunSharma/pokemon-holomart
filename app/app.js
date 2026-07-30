import { feedback } from "/src/data/feedback.js";
import { activeFilterCount, DEFAULT_FILTERS, filterFeedback, normalizeFilters } from "/src/features/filters/filter-state.js";
import { downloadCsv } from "/src/features/export/csv.js";
import { filtersFromUrl, filtersToUrl } from "/src/features/share/share-state.js";
import { createSavedView, readSavedViews, removeView, saveView } from "/src/features/saved-views/storage.js";

const elements = {
  form: document.querySelector("#filter-form"),
  query: document.querySelector("#query"),
  sentiment: document.querySelector("#sentiment"),
  channel: document.querySelector("#channel"),
  clear: document.querySelector("#clear-button"),
  emptyClear: document.querySelector("#empty-clear-button"),
  filterCount: document.querySelector("#filter-count"),
  resultsLabel: document.querySelector("#results-label"),
  list: document.querySelector("#feedback-list"),
  empty: document.querySelector("#empty-state"),
  resultCount: document.querySelector("#result-count"),
  negativeCount: document.querySelector("#negative-count"),
  neutralCount: document.querySelector("#neutral-count"),
  positiveCount: document.querySelector("#positive-count"),
  share: document.querySelector("#share-button"),
  export: document.querySelector("#export-button"),
  openSave: document.querySelector("#save-view-button"),
  quickSave: document.querySelector("#quick-save-button"),
  dialog: document.querySelector("#save-dialog"),
  dialogForm: document.querySelector("#save-dialog-form"),
  name: document.querySelector("#view-name"),
  preview: document.querySelector("#filter-preview"),
  views: document.querySelector("#saved-views-list"),
  toast: document.querySelector("#toast")
};

let filters = filtersFromUrl(window.location.href);
let visibleFeedback = [];
let toastTimer;

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[character]);
}

function syncControls() {
  elements.query.value = filters.query;
  elements.sentiment.value = filters.sentiment;
  elements.channel.value = filters.channel;
}

function renderFeedback() {
  visibleFeedback = filterFeedback(feedback, filters);
  const count = activeFilterCount(filters);
  elements.filterCount.textContent = count ? `(${count})` : "";
  elements.clear.disabled = count === 0;
  elements.resultsLabel.textContent = `${visibleFeedback.length} of ${feedback.length} synthetic signals`;
  elements.resultCount.textContent = visibleFeedback.length;
  for (const sentiment of ["Negative", "Neutral", "Positive"]) {
    elements[`${sentiment.toLowerCase()}Count`].textContent =
      visibleFeedback.filter((item) => item.sentiment === sentiment).length;
  }
  elements.list.innerHTML = visibleFeedback.map((item) => `
    <article class="feedback-row">
      <div class="feedback-content">
        <div class="feedback-meta">
          <strong>${escapeHtml(item.company)}</strong>
          <span>${escapeHtml(item.contact)}</span><span>·</span>
          <time datetime="${item.date}">${new Date(`${item.date}T12:00:00`).toLocaleDateString("en", { month: "short", day: "numeric" })}</time>
          <span>·</span><span>${escapeHtml(item.plan)}</span>
        </div>
        <blockquote>“${escapeHtml(item.excerpt)}”</blockquote>
      </div>
      <span class="theme-cell">${escapeHtml(item.theme)}</span>
      <span class="channel-cell">${escapeHtml(item.channel)}</span>
      <span class="sentiment-pill"><i class="dot ${item.sentiment.toLowerCase()}"></i>${escapeHtml(item.sentiment)}</span>
      <span class="vote-cell"><b>${item.votes}</b> supports</span>
    </article>
  `).join("");
  elements.empty.hidden = visibleFeedback.length !== 0;
  elements.list.hidden = visibleFeedback.length === 0;
}

function updateFilters(next, { replaceHistory = true } = {}) {
  filters = normalizeFilters(next);
  syncControls();
  renderFeedback();
  if (replaceHistory) history.replaceState(null, "", filtersToUrl(filters, window.location.href));
}

function showToast(message) {
  clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.hidden = false;
  toastTimer = setTimeout(() => { elements.toast.hidden = true; }, 2600);
}

function describeFilters(viewFilters) {
  const parts = [];
  if (viewFilters.query) parts.push(`“${viewFilters.query}”`);
  if (viewFilters.sentiment !== "All") parts.push(viewFilters.sentiment);
  if (viewFilters.channel !== "All") parts.push(viewFilters.channel);
  return parts.length ? parts.join(" · ") : "All feedback";
}

function renderSavedViews() {
  const views = readSavedViews(localStorage);
  elements.views.innerHTML = views.length
    ? `<div class="view-list">${views.map((view) => `
        <div class="saved-view">
          <button class="saved-view-apply" type="button" data-view-id="${escapeHtml(view.id)}">
            <strong>${escapeHtml(view.name)}</strong>
            <small>${escapeHtml(describeFilters(view.filters))}</small>
          </button>
          <button class="delete-view" type="button" data-delete-id="${escapeHtml(view.id)}" aria-label="Delete ${escapeHtml(view.name)}">×</button>
        </div>`).join("")}</div>`
    : `<p class="saved-empty">No saved views yet. Filter the feedback, then save your first personal view.</p>`;
}

function openSaveDialog() {
  elements.name.value = "";
  const chips = describeFilters(filters).split(" · ");
  elements.preview.innerHTML = chips.map((part) => `<span>${escapeHtml(part)}</span>`).join("");
  elements.dialog.showModal();
  requestAnimationFrame(() => elements.name.focus());
}

elements.form.addEventListener("input", () => updateFilters(Object.fromEntries(new FormData(elements.form))));
elements.form.addEventListener("submit", (event) => event.preventDefault());
elements.clear.addEventListener("click", () => updateFilters(DEFAULT_FILTERS));
elements.emptyClear.addEventListener("click", () => updateFilters(DEFAULT_FILTERS));
elements.openSave.addEventListener("click", openSaveDialog);
elements.quickSave.addEventListener("click", openSaveDialog);
elements.export.addEventListener("click", () => {
  downloadCsv(visibleFeedback);
  showToast(`Exported ${visibleFeedback.length} signals`);
});
elements.share.addEventListener("click", async () => {
  const url = filtersToUrl(filters, window.location.href);
  try {
    await navigator.clipboard.writeText(url);
    showToast("Share link copied");
  } catch {
    window.prompt("Copy this view link", url);
  }
});
elements.dialogForm.addEventListener("submit", (event) => {
  const submitter = event.submitter?.value;
  if (submitter === "cancel") return;
  event.preventDefault();
  if (!elements.dialogForm.reportValidity()) return;
  const view = createSavedView({ name: elements.name.value, filters });
  const result = saveView(localStorage, view);
  if (!result.ok) {
    showToast("Couldn’t save this view in your browser");
    return;
  }
  elements.dialog.close();
  renderSavedViews();
  showToast(`Saved “${view.name}” on this browser`);
});
elements.views.addEventListener("click", (event) => {
  const applyButton = event.target.closest("[data-view-id]");
  const deleteButton = event.target.closest("[data-delete-id]");
  if (applyButton) {
    const view = readSavedViews(localStorage).find((item) => item.id === applyButton.dataset.viewId);
    if (view) {
      updateFilters(view.filters);
      showToast(`Applied “${view.name}”`);
    }
  }
  if (deleteButton) {
    const result = removeView(localStorage, deleteButton.dataset.deleteId);
    renderSavedViews();
    showToast(result.ok ? "Saved view removed" : "Couldn’t remove this view");
  }
});
document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    elements.query.focus();
  }
});

syncControls();
renderFeedback();
renderSavedViews();
