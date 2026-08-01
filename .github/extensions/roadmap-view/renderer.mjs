function serializeForScript(value) {
    return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function renderRoadmapHtml(config) {
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Product Roadmap</title>
  <style>
    :root {
      color-scheme: light dark;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      overflow: hidden;
      background: var(--background-color-default, #ffffff);
      color: var(--text-color-default, #1f2328);
      font-family: var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
      font-size: var(--text-body-medium, 14px);
      line-height: var(--leading-body-medium, 20px);
    }

    button,
    input,
    select,
    textarea {
      color: inherit;
      font: inherit;
    }

    button,
    select {
      cursor: pointer;
    }

    button:focus-visible,
    input:focus-visible,
    select:focus-visible,
    textarea:focus-visible {
      outline: 2px solid var(--color-focus-outline, #0969da);
      outline-offset: 2px;
    }

    .app {
      display: grid;
      grid-template-rows: auto auto minmax(0, 1fr) auto;
      height: 100vh;
      min-width: 0;
    }

    .topbar {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 24px;
      padding: 24px 28px 18px;
      border-bottom: 1px solid var(--border-color-default, #d0d7de);
      background:
        radial-gradient(circle at 15% -60%, color-mix(in srgb, var(--true-color-blue, #0969da) 14%, transparent), transparent 42%),
        var(--background-color-default, #ffffff);
    }

    .eyebrow {
      margin: 0 0 5px;
      color: var(--true-color-blue, #0969da);
      font-size: 11px;
      font-weight: var(--font-weight-semibold, 600);
      letter-spacing: 0.11em;
      text-transform: uppercase;
    }

    h1 {
      margin: 0;
      font-family: var(--font-sans-display, var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif));
      font-size: clamp(22px, 2.6vw, var(--text-title-large, 30px));
      font-weight: var(--font-weight-semibold, 600);
      line-height: var(--leading-title-large, 36px);
      letter-spacing: -0.025em;
    }

    .subtitle {
      max-width: 720px;
      margin: 5px 0 0;
      color: var(--text-color-muted, #656d76);
    }

    .primary-button,
    .secondary-button,
    .danger-button {
      min-height: 36px;
      border-radius: 8px;
      padding: 7px 13px;
      border: 1px solid var(--border-color-default, #d0d7de);
      font-weight: var(--font-weight-semibold, 600);
      white-space: nowrap;
    }

    .primary-button {
      border-color: var(--true-color-blue, #0969da);
      background: var(--true-color-blue, #0969da);
      color: var(--color-white, #ffffff);
    }

    .primary-button:hover {
      filter: brightness(0.94);
    }

    .secondary-button {
      background: color-mix(in srgb, var(--background-color-default, #ffffff) 84%, var(--text-color-default, #1f2328));
    }

    .secondary-button:hover {
      background: color-mix(in srgb, var(--background-color-default, #ffffff) 76%, var(--text-color-default, #1f2328));
    }

    .danger-button {
      border-color: color-mix(in srgb, var(--true-color-red, #cf222e) 42%, var(--border-color-default, #d0d7de));
      background: transparent;
      color: var(--true-color-red, #cf222e);
    }

    .overview {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 18px;
      padding: 14px 28px;
      border-bottom: 1px solid var(--border-color-default, #d0d7de);
    }

    .metrics {
      display: flex;
      gap: 8px;
      min-width: 0;
    }

    .metric {
      min-width: 96px;
      padding: 7px 11px;
      border: 1px solid var(--border-color-default, #d0d7de);
      border-radius: 8px;
      background: color-mix(in srgb, var(--background-color-default, #ffffff) 94%, var(--text-color-default, #1f2328));
    }

    .metric-value {
      display: block;
      font-size: 17px;
      font-weight: var(--font-weight-semibold, 600);
      line-height: 20px;
    }

    .metric-label {
      display: block;
      color: var(--text-color-muted, #656d76);
      font-size: 11px;
      line-height: 16px;
    }

    .filters {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .search-wrap {
      position: relative;
    }

    .search-wrap::before {
      position: absolute;
      top: 50%;
      left: 11px;
      width: 8px;
      height: 8px;
      transform: translateY(-65%);
      border: 1.5px solid var(--text-color-muted, #656d76);
      border-radius: 50%;
      content: "";
      pointer-events: none;
    }

    .search-wrap::after {
      position: absolute;
      top: 57%;
      left: 19px;
      width: 5px;
      height: 1.5px;
      transform: rotate(45deg);
      background: var(--text-color-muted, #656d76);
      content: "";
      pointer-events: none;
    }

    input[type="search"],
    select,
    input[type="text"],
    input[type="date"],
    input[type="number"],
    textarea {
      width: 100%;
      border: 1px solid var(--border-color-default, #d0d7de);
      border-radius: 7px;
      background: var(--background-color-default, #ffffff);
    }

    input[type="search"] {
      width: min(30vw, 250px);
      height: 34px;
      padding: 6px 10px 6px 31px;
    }

    .filters select {
      width: auto;
      height: 34px;
      padding: 5px 28px 5px 9px;
    }

    .timeline-shell {
      min-height: 0;
      overflow: auto;
      background:
        linear-gradient(90deg, color-mix(in srgb, var(--border-color-default, #d0d7de) 34%, transparent) 1px, transparent 1px),
        color-mix(in srgb, var(--background-color-default, #ffffff) 97%, var(--text-color-default, #1f2328));
      background-size: 28px 28px;
    }

    .timeline {
      display: grid;
      grid-template-columns: repeat(var(--quarter-count, 4), minmax(285px, 1fr));
      min-width: max(100%, calc(var(--quarter-count, 4) * 285px));
      min-height: 100%;
    }

    .quarter {
      min-width: 0;
      padding: 0 14px 24px;
      border-right: 1px solid var(--border-color-default, #d0d7de);
    }

    .quarter:last-child {
      border-right: 0;
    }

    .quarter-header {
      position: sticky;
      z-index: 2;
      top: 0;
      margin: 0 -14px 14px;
      padding: 17px 16px 13px;
      border-bottom: 1px solid var(--border-color-default, #d0d7de);
      background: color-mix(in srgb, var(--background-color-default, #ffffff) 94%, transparent);
      backdrop-filter: blur(12px);
    }

    .quarter-label {
      margin: 0;
      font-size: 15px;
      font-weight: var(--font-weight-semibold, 600);
    }

    .quarter-objective {
      min-height: 18px;
      margin: 2px 0 0;
      overflow: hidden;
      color: var(--text-color-muted, #656d76);
      font-size: 12px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .quarter-count {
      display: inline-block;
      margin-left: 6px;
      color: var(--text-color-muted, #656d76);
      font-size: 11px;
      font-weight: 400;
    }

    .card-list {
      display: grid;
      gap: 10px;
    }

    .roadmap-card {
      position: relative;
      width: 100%;
      overflow: hidden;
      border: 1px solid var(--border-color-default, #d0d7de);
      border-radius: 10px;
      padding: 13px 13px 12px 16px;
      background: var(--background-color-default, #ffffff);
      color: inherit;
      text-align: left;
      box-shadow: 0 1px 2px color-mix(in srgb, var(--text-color-default, #1f2328) 7%, transparent);
      transition: border-color 120ms ease, box-shadow 120ms ease, transform 120ms ease;
    }

    .roadmap-card::before {
      position: absolute;
      inset: 0 auto 0 0;
      width: 3px;
      background: var(--status-color, var(--text-color-muted, #656d76));
      content: "";
    }

    .roadmap-card:hover {
      border-color: color-mix(in srgb, var(--true-color-blue, #0969da) 55%, var(--border-color-default, #d0d7de));
      box-shadow: 0 5px 16px color-mix(in srgb, var(--text-color-default, #1f2328) 11%, transparent);
      transform: translateY(-1px);
    }

    .roadmap-card[data-status="planned"] {
      --status-color: var(--text-color-muted, #656d76);
    }

    .roadmap-card[data-status="in-progress"] {
      --status-color: var(--true-color-blue, #0969da);
    }

    .roadmap-card[data-status="at-risk"] {
      --status-color: var(--true-color-red, #cf222e);
    }

    .roadmap-card[data-status="done"] {
      --status-color: var(--true-color-green, #1a7f37);
    }

    .roadmap-card.is-focused {
      border-color: var(--true-color-blue, #0969da);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--true-color-blue, #0969da) 22%, transparent);
    }

    .card-kicker,
    .card-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .category,
    .status {
      overflow: hidden;
      font-size: 10px;
      font-weight: var(--font-weight-semibold, 600);
      letter-spacing: 0.045em;
      text-overflow: ellipsis;
      text-transform: uppercase;
      white-space: nowrap;
    }

    .category {
      color: var(--text-color-muted, #656d76);
    }

    .status {
      color: var(--status-color, var(--text-color-muted, #656d76));
    }

    .card-title {
      margin: 7px 0 0;
      font-size: 14px;
      font-weight: var(--font-weight-semibold, 600);
      line-height: 19px;
    }

    .card-description {
      display: -webkit-box;
      margin: 5px 0 0;
      overflow: hidden;
      color: var(--text-color-muted, #656d76);
      font-size: 12px;
      line-height: 17px;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
    }

    .progress-track {
      height: 4px;
      margin: 12px 0 8px;
      overflow: hidden;
      border-radius: 999px;
      background: color-mix(in srgb, var(--text-color-muted, #656d76) 18%, transparent);
    }

    .progress-fill {
      height: 100%;
      border-radius: inherit;
      background: var(--status-color, var(--true-color-blue, #0969da));
    }

    .card-meta {
      color: var(--text-color-muted, #656d76);
      font-size: 11px;
    }

    .empty-quarter {
      display: grid;
      min-height: 95px;
      place-items: center;
      border: 1px dashed var(--border-color-default, #d0d7de);
      border-radius: 10px;
      color: var(--text-color-muted, #656d76);
      font-size: 12px;
      text-align: center;
    }

    .loading,
    .error-state {
      display: grid;
      min-height: 100%;
      place-items: center;
      padding: 40px;
      color: var(--text-color-muted, #656d76);
      text-align: center;
    }

    .error-state strong {
      display: block;
      margin-bottom: 8px;
      color: var(--text-color-default, #1f2328);
    }

    .footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-height: 32px;
      gap: 16px;
      padding: 6px 28px;
      border-top: 1px solid var(--border-color-default, #d0d7de);
      color: var(--text-color-muted, #656d76);
      font-size: 11px;
    }

    .live-state {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .live-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--true-color-green, #1a7f37);
    }

    dialog {
      width: min(620px, calc(100vw - 32px));
      max-height: calc(100vh - 48px);
      overflow: auto;
      border: 1px solid var(--border-color-default, #d0d7de);
      border-radius: 12px;
      padding: 0;
      background: var(--background-color-default, #ffffff);
      color: var(--text-color-default, #1f2328);
      box-shadow: 0 18px 55px rgba(0, 0, 0, 0.24);
    }

    dialog::backdrop {
      background: rgba(0, 0, 0, 0.42);
      backdrop-filter: blur(2px);
    }

    .dialog-header {
      padding: 20px 22px 14px;
      border-bottom: 1px solid var(--border-color-default, #d0d7de);
    }

    .dialog-title {
      margin: 0;
      font-size: 18px;
      font-weight: var(--font-weight-semibold, 600);
    }

    .dialog-subtitle {
      margin: 3px 0 0;
      color: var(--text-color-muted, #656d76);
      font-size: 12px;
    }

    .form-body {
      display: grid;
      gap: 15px;
      padding: 18px 22px;
    }

    .form-row {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }

    .field {
      display: grid;
      gap: 5px;
    }

    .field label,
    .field-label {
      font-size: 12px;
      font-weight: var(--font-weight-semibold, 600);
    }

    .field input,
    .field select,
    .field textarea {
      min-height: 36px;
      padding: 7px 9px;
    }

    .field textarea {
      min-height: 84px;
      resize: vertical;
    }

    .progress-input {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 44px;
      align-items: center;
      gap: 10px;
    }

    .progress-input input {
      min-height: auto;
      padding: 0;
    }

    .progress-output {
      color: var(--text-color-muted, #656d76);
      font-size: 12px;
      text-align: right;
    }

    .dialog-actions {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      padding: 14px 22px 18px;
      border-top: 1px solid var(--border-color-default, #d0d7de);
    }

    .dialog-actions-right {
      display: flex;
      gap: 8px;
      margin-left: auto;
    }

    .toast {
      position: fixed;
      z-index: 20;
      right: 20px;
      bottom: 44px;
      max-width: min(380px, calc(100vw - 40px));
      transform: translateY(14px);
      border: 1px solid var(--border-color-default, #d0d7de);
      border-radius: 8px;
      padding: 10px 13px;
      background: var(--text-color-default, #1f2328);
      color: var(--background-color-default, #ffffff);
      box-shadow: 0 8px 28px rgba(0, 0, 0, 0.18);
      opacity: 0;
      pointer-events: none;
      transition: opacity 140ms ease, transform 140ms ease;
    }

    .toast.is-visible {
      transform: translateY(0);
      opacity: 1;
    }

    @media (max-width: 760px) {
      .topbar,
      .overview {
        align-items: stretch;
        flex-direction: column;
      }

      .topbar {
        padding: 18px;
      }

      .overview {
        padding: 12px 18px;
      }

      .metrics {
        overflow-x: auto;
      }

      .filters {
        width: 100%;
      }

      .search-wrap {
        flex: 1;
      }

      input[type="search"] {
        width: 100%;
      }

      .footer {
        padding-inline: 18px;
      }

      .form-row {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="app">
    <header class="topbar">
      <div>
        <p class="eyebrow">Product roadmap</p>
        <h1 id="roadmap-title">Loading roadmap...</h1>
        <p class="subtitle" id="roadmap-subtitle"></p>
      </div>
      <button class="primary-button" id="add-item" type="button">+ Add item</button>
    </header>

    <section class="overview" aria-label="Roadmap overview and filters">
      <div class="metrics">
        <div class="metric">
          <span class="metric-value" id="metric-total">-</span>
          <span class="metric-label">Total items</span>
        </div>
        <div class="metric">
          <span class="metric-value" id="metric-progress">-</span>
          <span class="metric-label">In progress</span>
        </div>
        <div class="metric">
          <span class="metric-value" id="metric-risk">-</span>
          <span class="metric-label">At risk</span>
        </div>
        <div class="metric">
          <span class="metric-value" id="metric-done">-</span>
          <span class="metric-label">Completed</span>
        </div>
      </div>
      <div class="filters">
        <label class="search-wrap">
          <span hidden>Search roadmap</span>
          <input id="search" type="search" placeholder="Search roadmap" />
        </label>
        <label>
          <span hidden>Filter by status</span>
          <select id="status-filter">
            <option value="all">All statuses</option>
            <option value="planned">Planned</option>
            <option value="in-progress">In progress</option>
            <option value="at-risk">At risk</option>
            <option value="done">Done</option>
          </select>
        </label>
      </div>
    </section>

    <main class="timeline-shell" id="timeline-shell">
      <div class="loading" id="loading">Loading roadmap data...</div>
      <div class="timeline" id="timeline" hidden></div>
    </main>

    <footer class="footer">
      <span id="visible-count">Loading items</span>
      <span class="live-state"><span class="live-dot"></span><span id="sync-state">Backed by roadmap.json</span></span>
    </footer>
  </div>

  <dialog id="item-dialog">
    <form id="item-form">
      <div class="dialog-header">
        <h2 class="dialog-title" id="dialog-title">Add roadmap item</h2>
        <p class="dialog-subtitle">Changes are saved directly to the repository roadmap file.</p>
      </div>
      <div class="form-body">
        <input id="item-id" name="id" type="hidden" />
        <div class="field">
          <label for="item-title">Title</label>
          <input id="item-title" name="title" type="text" maxlength="160" required />
        </div>
        <div class="field">
          <label for="item-description">Description</label>
          <textarea id="item-description" name="description" maxlength="2000"></textarea>
        </div>
        <div class="form-row">
          <div class="field">
            <label for="item-quarter">Quarter</label>
            <select id="item-quarter" name="quarter" required></select>
          </div>
          <div class="field">
            <label for="item-status">Status</label>
            <select id="item-status" name="status">
              <option value="planned">Planned</option>
              <option value="in-progress">In progress</option>
              <option value="at-risk">At risk</option>
              <option value="done">Done</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="field">
            <label for="item-category">Category</label>
            <input id="item-category" name="category" type="text" maxlength="80" placeholder="General" />
          </div>
          <div class="field">
            <label for="item-owner">Owner</label>
            <input id="item-owner" name="owner" type="text" maxlength="120" placeholder="Unassigned" />
          </div>
        </div>
        <div class="form-row">
          <div class="field">
            <label for="item-target-date">Target date</label>
            <input id="item-target-date" name="targetDate" type="date" />
          </div>
          <div class="field">
            <span class="field-label">Progress</span>
            <div class="progress-input">
              <input id="item-progress" name="progress" type="range" min="0" max="100" step="5" value="0" />
              <output class="progress-output" id="progress-output" for="item-progress">0%</output>
            </div>
          </div>
        </div>
      </div>
      <div class="dialog-actions">
        <button class="danger-button" id="delete-item" type="button" hidden>Delete</button>
        <div class="dialog-actions-right">
          <button class="secondary-button" id="cancel-item" type="button">Cancel</button>
          <button class="primary-button" type="submit">Save item</button>
        </div>
      </div>
    </form>
  </dialog>

  <div class="toast" id="toast" role="status" aria-live="polite"></div>

  <script>
    const config = ${serializeForScript(config)};
    const state = {
      focusPending: Boolean(config.focusItemId),
      query: "",
      roadmap: null,
      status: "all",
    };

    const elements = {
      addItem: document.getElementById("add-item"),
      cancelItem: document.getElementById("cancel-item"),
      deleteItem: document.getElementById("delete-item"),
      dialog: document.getElementById("item-dialog"),
      dialogTitle: document.getElementById("dialog-title"),
      form: document.getElementById("item-form"),
      itemCategory: document.getElementById("item-category"),
      itemDescription: document.getElementById("item-description"),
      itemId: document.getElementById("item-id"),
      itemOwner: document.getElementById("item-owner"),
      itemProgress: document.getElementById("item-progress"),
      itemQuarter: document.getElementById("item-quarter"),
      itemStatus: document.getElementById("item-status"),
      itemTargetDate: document.getElementById("item-target-date"),
      itemTitle: document.getElementById("item-title"),
      loading: document.getElementById("loading"),
      metricDone: document.getElementById("metric-done"),
      metricProgress: document.getElementById("metric-progress"),
      metricRisk: document.getElementById("metric-risk"),
      metricTotal: document.getElementById("metric-total"),
      progressOutput: document.getElementById("progress-output"),
      roadmapSubtitle: document.getElementById("roadmap-subtitle"),
      roadmapTitle: document.getElementById("roadmap-title"),
      search: document.getElementById("search"),
      statusFilter: document.getElementById("status-filter"),
      syncState: document.getElementById("sync-state"),
      timeline: document.getElementById("timeline"),
      toast: document.getElementById("toast"),
      visibleCount: document.getElementById("visible-count"),
    };

    function escapeHtml(value) {
      return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }

    function formatStatus(status) {
      return status
        .split("-")
        .map(function (part) {
          return part.charAt(0).toUpperCase() + part.slice(1);
        })
        .join(" ");
    }

    function formatDate(value) {
      if (!value) {
        return "No target date";
      }
      const date = new Date(value + "T00:00:00");
      return date.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
      });
    }

    function matchingItems() {
      const query = state.query.trim().toLowerCase();
      return state.roadmap.items.filter(function (item) {
        const matchesStatus =
          state.status === "all" || item.status === state.status;
        const searchText = [
          item.title,
          item.description,
          item.category,
          item.owner,
        ].join(" ").toLowerCase();
        return matchesStatus && (!query || searchText.includes(query));
      });
    }

    function itemCard(item) {
      const owner = item.owner || "Unassigned";
      const description = item.description
        ? '<p class="card-description">' + escapeHtml(item.description) + "</p>"
        : "";
      return (
        '<button class="roadmap-card" type="button" data-item-id="' +
        escapeHtml(item.id) +
        '" data-status="' +
        escapeHtml(item.status) +
        '" aria-label="Edit ' +
        escapeHtml(item.title) +
        '">' +
        '<div class="card-kicker">' +
        '<span class="category">' +
        escapeHtml(item.category) +
        "</span>" +
        '<span class="status">' +
        escapeHtml(formatStatus(item.status)) +
        "</span>" +
        "</div>" +
        '<h3 class="card-title">' +
        escapeHtml(item.title) +
        "</h3>" +
        description +
        '<div class="progress-track" aria-label="' +
        item.progress +
        '% complete"><div class="progress-fill" style="width:' +
        item.progress +
        '%"></div></div>' +
        '<div class="card-meta"><span>' +
        escapeHtml(owner) +
        "</span><span>" +
        escapeHtml(formatDate(item.targetDate)) +
        "</span></div>" +
        "</button>"
      );
    }

    function render() {
      if (!state.roadmap) {
        return;
      }

      const items = state.roadmap.items;
      const visibleItems = matchingItems();
      document.title = state.roadmap.title;
      elements.roadmapTitle.textContent = state.roadmap.title;
      elements.roadmapSubtitle.textContent = state.roadmap.subtitle;
      elements.metricTotal.textContent = items.length;
      elements.metricProgress.textContent = items.filter(function (item) {
        return item.status === "in-progress";
      }).length;
      elements.metricRisk.textContent = items.filter(function (item) {
        return item.status === "at-risk";
      }).length;
      elements.metricDone.textContent = items.filter(function (item) {
        return item.status === "done";
      }).length;

      elements.timeline.style.setProperty(
        "--quarter-count",
        state.roadmap.quarters.length,
      );
      elements.timeline.innerHTML = state.roadmap.quarters
        .map(function (quarter) {
          const quarterItems = visibleItems
            .filter(function (item) {
              return item.quarter === quarter.id;
            })
            .sort(function (a, b) {
              return (a.targetDate || "9999").localeCompare(
                b.targetDate || "9999",
              );
            });
          const cards = quarterItems.length
            ? quarterItems.map(itemCard).join("")
            : '<div class="empty-quarter">No matching items in this quarter</div>';
          return (
            '<section class="quarter" aria-labelledby="quarter-' +
            escapeHtml(quarter.id) +
            '">' +
            '<header class="quarter-header">' +
            '<h2 class="quarter-label" id="quarter-' +
            escapeHtml(quarter.id) +
            '">' +
            escapeHtml(quarter.label) +
            '<span class="quarter-count">' +
            quarterItems.length +
            "</span></h2>" +
            '<p class="quarter-objective">' +
            escapeHtml(quarter.objective || "") +
            "</p>" +
            "</header>" +
            '<div class="card-list">' +
            cards +
            "</div>" +
            "</section>"
          );
        })
        .join("");

      elements.timeline.querySelectorAll("[data-item-id]").forEach(
        function (card) {
          card.addEventListener("click", function () {
            const item = state.roadmap.items.find(function (candidate) {
              return candidate.id === card.dataset.itemId;
            });
            if (item) {
              openEditor(item);
            }
          });
        },
      );

      elements.loading.hidden = true;
      elements.timeline.hidden = false;
      elements.visibleCount.textContent =
        visibleItems.length +
        (visibleItems.length === 1 ? " item shown" : " items shown");

      if (state.focusPending && config.focusItemId) {
        const focused = elements.timeline.querySelector(
          '[data-item-id="' + CSS.escape(config.focusItemId) + '"]',
        );
        if (focused) {
          focused.classList.add("is-focused");
          requestAnimationFrame(function () {
            focused.scrollIntoView({
              behavior: "smooth",
              block: "center",
              inline: "center",
            });
          });
        }
        state.focusPending = false;
      }
    }

    function populateQuarters(selectedQuarter) {
      elements.itemQuarter.innerHTML = state.roadmap.quarters
        .map(function (quarter) {
          const selected = quarter.id === selectedQuarter ? " selected" : "";
          return (
            '<option value="' +
            escapeHtml(quarter.id) +
            '"' +
            selected +
            ">" +
            escapeHtml(quarter.label) +
            "</option>"
          );
        })
        .join("");
    }

    function openEditor(item) {
      const isEditing = Boolean(item);
      const defaultQuarter = state.roadmap.quarters[0].id;
      elements.form.reset();
      elements.itemId.value = isEditing ? item.id : "";
      elements.itemTitle.value = isEditing ? item.title : "";
      elements.itemDescription.value = isEditing ? item.description : "";
      elements.itemStatus.value = isEditing ? item.status : "planned";
      elements.itemCategory.value = isEditing ? item.category : "";
      elements.itemOwner.value = isEditing ? item.owner : "";
      elements.itemTargetDate.value = isEditing ? item.targetDate : "";
      elements.itemProgress.value = isEditing ? item.progress : 0;
      elements.progressOutput.textContent =
        elements.itemProgress.value + "%";
      populateQuarters(isEditing ? item.quarter : defaultQuarter);
      elements.dialogTitle.textContent = isEditing
        ? "Edit roadmap item"
        : "Add roadmap item";
      elements.deleteItem.hidden = !isEditing;
      elements.dialog.showModal();
      requestAnimationFrame(function () {
        elements.itemTitle.focus();
      });
    }

    async function request(path, options) {
      const response = await fetch(path, options);
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "The roadmap request failed.");
      }
      return payload;
    }

    let toastTimer;
    function showToast(message) {
      clearTimeout(toastTimer);
      elements.toast.textContent = message;
      elements.toast.classList.add("is-visible");
      toastTimer = setTimeout(function () {
        elements.toast.classList.remove("is-visible");
      }, 2600);
    }

    async function loadRoadmap() {
      try {
        state.roadmap = await request("/api/roadmap");
        render();
      } catch (error) {
        elements.loading.className = "error-state";
        elements.loading.innerHTML =
          "<div><strong>Could not load the roadmap</strong>" +
          escapeHtml(error.message) +
          '<br><br><button class="secondary-button" id="retry-load" type="button">Try again</button></div>';
        document.getElementById("retry-load").addEventListener(
          "click",
          loadRoadmap,
        );
      }
    }

    elements.addItem.addEventListener("click", function () {
      openEditor(null);
    });
    elements.cancelItem.addEventListener("click", function () {
      elements.dialog.close();
    });
    elements.itemProgress.addEventListener("input", function () {
      elements.progressOutput.textContent =
        elements.itemProgress.value + "%";
    });
    elements.search.addEventListener("input", function () {
      state.query = elements.search.value;
      render();
    });
    elements.statusFilter.addEventListener("change", function () {
      state.status = elements.statusFilter.value;
      render();
    });
    elements.dialog.addEventListener("click", function (event) {
      if (event.target === elements.dialog) {
        elements.dialog.close();
      }
    });

    elements.form.addEventListener("submit", async function (event) {
      event.preventDefault();
      const id = elements.itemId.value;
      const item = {
        category: elements.itemCategory.value.trim(),
        description: elements.itemDescription.value.trim(),
        owner: elements.itemOwner.value.trim(),
        progress: Number(elements.itemProgress.value),
        quarter: elements.itemQuarter.value,
        status: elements.itemStatus.value,
        targetDate: elements.itemTargetDate.value,
        title: elements.itemTitle.value.trim(),
      };

      try {
        const result = id
          ? await request("/api/items/" + encodeURIComponent(id), {
              body: JSON.stringify(item),
              headers: { "Content-Type": "application/json" },
              method: "PATCH",
            })
          : await request("/api/items", {
              body: JSON.stringify(item),
              headers: { "Content-Type": "application/json" },
              method: "POST",
            });
        state.roadmap = result.roadmap;
        elements.dialog.close();
        render();
        showToast(id ? "Roadmap item updated" : "Roadmap item added");
      } catch (error) {
        showToast(error.message);
      }
    });

    elements.deleteItem.addEventListener("click", async function () {
      const id = elements.itemId.value;
      const item = state.roadmap.items.find(function (candidate) {
        return candidate.id === id;
      });
      if (!item || !window.confirm('Delete "' + item.title + '"?')) {
        return;
      }

      try {
        const result = await request(
          "/api/items/" + encodeURIComponent(id),
          { method: "DELETE" },
        );
        state.roadmap = result.roadmap;
        elements.dialog.close();
        render();
        showToast("Roadmap item deleted");
      } catch (error) {
        showToast(error.message);
      }
    });

    const events = new EventSource("/events");
    events.addEventListener("open", function () {
      elements.syncState.textContent = "Live updates connected";
    });
    events.addEventListener("error", function () {
      elements.syncState.textContent = "Reconnecting live updates";
    });
    events.addEventListener("roadmap", function (event) {
      state.roadmap = JSON.parse(event.data);
      render();
    });
    window.addEventListener("beforeunload", function () {
      events.close();
    });

    loadRoadmap();
  </script>
</body>
</html>`;
}
