export const STYLES = String.raw`
:root {
    color-scheme: light dark;
    --canvas-accent: var(--true-color-blue, #0969da);
    --canvas-accent-soft: var(--true-color-blue-muted, #ddf4ff);
    --canvas-danger: #cf222e;
    --canvas-radius: 12px;
    --canvas-shadow: 0 12px 32px rgba(31, 35, 40, 0.08);
}

* {
    box-sizing: border-box;
}

html,
body {
    min-height: 100%;
}

body {
    margin: 0;
    background: var(--background-color-default, #f6f8fa);
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

button {
    cursor: pointer;
}

button:disabled,
input:disabled,
select:disabled {
    cursor: wait;
    opacity: 0.6;
}

.app {
    display: grid;
    grid-template-columns: 236px minmax(0, 1fr);
    min-height: 100vh;
}

.sidebar {
    position: sticky;
    top: 0;
    height: 100vh;
    overflow: auto;
    padding: 20px 14px;
    border-right: 1px solid var(--border-color-default, #d0d7de);
    background: var(--background-color-default, #ffffff);
}

.brand {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 8px 20px;
}

.brand-mark {
    display: grid;
    width: 34px;
    height: 34px;
    place-items: center;
    border-radius: 10px;
    background: linear-gradient(145deg, var(--canvas-accent), #8250df);
    color: #ffffff;
    font-size: 11px;
    font-weight: var(--font-weight-semibold, 600);
    letter-spacing: 0.06em;
}

.brand strong {
    display: block;
    font-size: 14px;
}

.brand span {
    color: var(--text-color-muted, #656d76);
    font-size: 11px;
}

.nav-label {
    margin: 12px 10px 6px;
    color: var(--text-color-muted, #656d76);
    font-size: 10px;
    font-weight: var(--font-weight-semibold, 600);
    letter-spacing: 0.12em;
    text-transform: uppercase;
}

.nav-item {
    display: grid;
    width: 100%;
    grid-template-columns: 28px 1fr auto;
    align-items: center;
    gap: 8px;
    margin: 2px 0;
    padding: 9px 10px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    text-align: left;
}

.nav-item:hover {
    background: color-mix(in srgb, var(--canvas-accent) 7%, transparent);
}

.nav-item.active {
    background: var(--canvas-accent-soft);
    color: var(--canvas-accent);
    font-weight: var(--font-weight-semibold, 600);
}

.nav-index {
    display: grid;
    width: 24px;
    height: 24px;
    place-items: center;
    border: 1px solid var(--border-color-default, #d0d7de);
    border-radius: 7px;
    color: var(--text-color-muted, #656d76);
    font-size: 11px;
}

.nav-item.active .nav-index {
    border-color: color-mix(in srgb, var(--canvas-accent) 35%, transparent);
    color: var(--canvas-accent);
}

.nav-count {
    min-width: 20px;
    padding: 1px 6px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--text-color-muted, #656d76) 12%, transparent);
    color: var(--text-color-muted, #656d76);
    font-size: 11px;
    text-align: center;
}

.sidebar-summary {
    margin: 22px 6px 0;
    padding: 12px;
    border: 1px solid var(--border-color-default, #d0d7de);
    border-radius: 10px;
    background: color-mix(in srgb, var(--background-color-default, #fff) 80%, var(--canvas-accent-soft));
}

.sidebar-summary strong {
    display: block;
    margin-bottom: 8px;
    font-size: 12px;
}

.progress-track {
    width: 100%;
    height: 6px;
    overflow: hidden;
    appearance: none;
    border: 0;
    border-radius: 999px;
    background: color-mix(in srgb, var(--text-color-muted, #656d76) 15%, transparent);
}

.progress-track::-webkit-progress-bar {
    border-radius: inherit;
    background: color-mix(in srgb, var(--text-color-muted, #656d76) 15%, transparent);
}

.progress-track::-webkit-progress-value {
    border-radius: inherit;
    background: linear-gradient(90deg, var(--canvas-accent), #8250df);
    transition: width 180ms ease;
}

.progress-track::-moz-progress-bar {
    border-radius: inherit;
    background: linear-gradient(90deg, var(--canvas-accent), #8250df);
}

.progress-copy {
    margin-top: 7px;
    color: var(--text-color-muted, #656d76);
    font-size: 11px;
}

.workspace {
    min-width: 0;
}

.topbar {
    position: sticky;
    z-index: 10;
    top: 0;
    display: flex;
    min-height: 70px;
    align-items: center;
    gap: 12px;
    padding: 12px 28px;
    border-bottom: 1px solid var(--border-color-default, #d0d7de);
    background: color-mix(in srgb, var(--background-color-default, #ffffff) 94%, transparent);
    backdrop-filter: blur(16px);
}

.title-wrap {
    min-width: 180px;
    flex: 1;
}

.title-input {
    width: 100%;
    max-width: 620px;
    padding: 2px 0;
    border: 0;
    outline: 0;
    background: transparent;
    font-family: var(--font-sans-display, var(--font-sans, sans-serif));
    font-size: var(--text-title-medium, 20px);
    font-weight: var(--font-weight-semibold, 600);
    line-height: 28px;
}

.save-state {
    color: var(--text-color-muted, #656d76);
    font-size: 11px;
}

.save-state.error {
    color: var(--canvas-danger);
}

.compact-select,
.button {
    min-height: 34px;
    border: 1px solid var(--border-color-default, #d0d7de);
    border-radius: 8px;
    background: var(--background-color-default, #ffffff);
}

.compact-select {
    padding: 5px 30px 5px 10px;
}

.button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    padding: 6px 12px;
    font-weight: var(--font-weight-semibold, 600);
}

.button:hover {
    border-color: color-mix(in srgb, var(--canvas-accent) 60%, var(--border-color-default, #d0d7de));
}

.button.primary {
    border-color: var(--canvas-accent);
    background: var(--canvas-accent);
    color: #ffffff;
}

.button.subtle {
    border-color: transparent;
    background: color-mix(in srgb, var(--canvas-accent) 8%, transparent);
    color: var(--canvas-accent);
}

.button.danger {
    border-color: transparent;
    background: transparent;
    color: var(--canvas-danger);
}

.button.small {
    min-height: 30px;
    padding: 4px 9px;
    font-size: 12px;
}

.owner-input {
    width: 130px;
    min-height: 34px;
}

.content {
    width: min(1120px, 100%);
    margin: 0 auto;
    padding: 34px 34px 80px;
}

.section-heading {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 24px;
}

.eyebrow {
    margin-bottom: 5px;
    color: var(--canvas-accent);
    font-size: 11px;
    font-weight: var(--font-weight-semibold, 600);
    letter-spacing: 0.11em;
    text-transform: uppercase;
}

.section-heading h1 {
    margin: 0;
    font-family: var(--font-sans-display, var(--font-sans, sans-serif));
    font-size: var(--text-title-large, 28px);
    line-height: 34px;
}

.section-heading p {
    max-width: 680px;
    margin: 7px 0 0;
    color: var(--text-color-muted, #656d76);
}

.grid {
    display: grid;
    gap: 16px;
}

.grid.two {
    grid-template-columns: repeat(2, minmax(0, 1fr));
}

.grid.three {
    grid-template-columns: repeat(3, minmax(0, 1fr));
}

.card {
    padding: 18px;
    border: 1px solid var(--border-color-default, #d0d7de);
    border-radius: var(--canvas-radius);
    background: var(--background-color-default, #ffffff);
    box-shadow: 0 1px 0 rgba(31, 35, 40, 0.03);
}

.card + .card,
.grid + .card,
.card + .grid,
.section-block + .section-block {
    margin-top: 16px;
}

.card.accent {
    border-color: color-mix(in srgb, var(--canvas-accent) 25%, var(--border-color-default, #d0d7de));
    background: linear-gradient(
        145deg,
        color-mix(in srgb, var(--canvas-accent-soft) 45%, var(--background-color-default, #fff)),
        var(--background-color-default, #fff)
    );
}

.card-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 14px;
}

.card-header h2,
.card-header h3 {
    margin: 0;
    font-size: 15px;
}

.card-header p {
    margin: 4px 0 0;
    color: var(--text-color-muted, #656d76);
    font-size: 12px;
}

.field {
    display: grid;
    gap: 6px;
}

.field + .field {
    margin-top: 13px;
}

.field-label {
    font-size: 12px;
    font-weight: var(--font-weight-semibold, 600);
}

.field-hint {
    color: var(--text-color-muted, #656d76);
    font-size: 11px;
    font-weight: 400;
}

.control {
    width: 100%;
    min-height: 38px;
    padding: 8px 10px;
    border: 1px solid var(--border-color-default, #d0d7de);
    border-radius: 8px;
    outline: none;
    background: color-mix(in srgb, var(--background-color-default, #ffffff) 96%, var(--text-color-muted, #656d76));
    transition: border-color 120ms ease, box-shadow 120ms ease;
}

.control:focus {
    border-color: var(--canvas-accent);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--canvas-accent) 18%, transparent);
}

textarea.control {
    min-height: 92px;
    resize: vertical;
}

textarea.control.large {
    min-height: 128px;
}

.list-editor {
    display: grid;
    gap: 8px;
}

.list-row {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 8px;
}

.empty {
    display: grid;
    min-height: 128px;
    place-items: center;
    padding: 24px;
    border: 1px dashed var(--border-color-default, #d0d7de);
    border-radius: 10px;
    color: var(--text-color-muted, #656d76);
    text-align: center;
}

.empty strong {
    display: block;
    margin-bottom: 4px;
    color: var(--text-color-default, #1f2328);
}

.row-stack {
    display: grid;
    gap: 12px;
}

.row-card {
    padding: 15px;
    border: 1px solid var(--border-color-default, #d0d7de);
    border-radius: 10px;
    background: color-mix(in srgb, var(--background-color-default, #ffffff) 97%, var(--canvas-accent-soft));
}

.row-card-header {
    display: grid;
    grid-template-columns: minmax(180px, 1fr) auto auto auto;
    gap: 8px;
    align-items: center;
    margin-bottom: 12px;
}

.row-title {
    border: 0;
    outline: 0;
    background: transparent;
    font-weight: var(--font-weight-semibold, 600);
}

.row-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
}

.pill {
    display: inline-flex;
    align-items: center;
    padding: 3px 8px;
    border-radius: 999px;
    background: var(--canvas-accent-soft);
    color: var(--canvas-accent);
    font-size: 11px;
    font-weight: var(--font-weight-semibold, 600);
}

.flow-list {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
    gap: 10px;
}

.flow-card {
    position: relative;
    min-height: 168px;
    padding: 15px;
    border: 1px solid var(--border-color-default, #d0d7de);
    border-radius: 10px;
    background: var(--background-color-default, #ffffff);
}

.flow-number {
    display: grid;
    width: 24px;
    height: 24px;
    place-items: center;
    margin-bottom: 10px;
    border-radius: 999px;
    background: var(--canvas-accent-soft);
    color: var(--canvas-accent);
    font-size: 11px;
    font-weight: var(--font-weight-semibold, 600);
}

.flow-card .remove-corner {
    position: absolute;
    top: 8px;
    right: 8px;
}

.matrix-row {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 2fr auto;
    gap: 8px;
    align-items: start;
    padding: 10px 0;
    border-top: 1px solid var(--border-color-default, #d0d7de);
}

.matrix-row:first-child {
    border-top: 0;
}

.a11y-row {
    display: grid;
    grid-template-columns: minmax(200px, 1.4fr) 140px minmax(180px, 1fr);
    gap: 10px;
    align-items: center;
    padding: 10px 0;
    border-top: 1px solid var(--border-color-default, #d0d7de);
}

.a11y-row:first-child {
    border-top: 0;
}

.toast {
    position: fixed;
    z-index: 30;
    right: 20px;
    bottom: 20px;
    max-width: 360px;
    padding: 10px 14px;
    border: 1px solid var(--border-color-default, #d0d7de);
    border-radius: 9px;
    background: var(--background-color-default, #ffffff);
    box-shadow: var(--canvas-shadow);
    opacity: 0;
    pointer-events: none;
    transform: translateY(8px);
    transition: opacity 150ms ease, transform 150ms ease;
}

.toast.visible {
    opacity: 1;
    transform: translateY(0);
}

.loading {
    display: grid;
    min-height: 70vh;
    place-items: center;
    color: var(--text-color-muted, #656d76);
}

.error-panel {
    max-width: 560px;
    margin: 80px auto;
    padding: 20px;
    border: 1px solid color-mix(in srgb, var(--canvas-danger) 30%, transparent);
    border-radius: 12px;
    background: color-mix(in srgb, var(--canvas-danger) 6%, var(--background-color-default, #fff));
}

@media (max-width: 980px) {
    .app {
        grid-template-columns: 76px minmax(0, 1fr);
    }

    .sidebar {
        padding-inline: 9px;
    }

    .brand {
        justify-content: center;
        padding-inline: 0;
    }

    .brand-copy,
    .nav-item > span:not(.nav-index),
    .nav-label,
    .sidebar-summary {
        display: none;
    }

    .nav-item {
        grid-template-columns: 1fr;
        justify-items: center;
        padding: 9px;
    }

    .nav-index {
        width: 30px;
        height: 30px;
    }

    .grid.three {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 720px) {
    .app {
        display: block;
    }

    .sidebar {
        position: sticky;
        z-index: 20;
        top: 0;
        display: flex;
        width: 100%;
        height: auto;
        align-items: center;
        gap: 4px;
        padding: 7px;
        overflow-x: auto;
        border-right: 0;
        border-bottom: 1px solid var(--border-color-default, #d0d7de);
    }

    .brand {
        padding: 0 5px 0 0;
    }

    .brand-mark {
        width: 30px;
        height: 30px;
    }

    .nav-item {
        width: auto;
        flex: 0 0 auto;
        margin: 0;
    }

    .topbar {
        position: static;
        flex-wrap: wrap;
        padding: 12px 16px;
    }

    .title-wrap {
        flex-basis: 100%;
    }

    .content {
        padding: 24px 16px 60px;
    }

    .grid.two,
    .row-grid {
        grid-template-columns: 1fr;
    }

    .row-card-header,
    .matrix-row,
    .a11y-row {
        grid-template-columns: 1fr;
    }
}
`;

function clientApp() {
    const sections = [
        {
            id: "brief",
            label: "Product brief",
            eyebrow: "Frame the opportunity",
            title: "Product brief",
            description: "Align the team on the customer problem, intended outcome, and boundaries before prescribing a solution.",
        },
        {
            id: "requirements",
            label: "Requirements",
            eyebrow: "Define the contract",
            title: "Requirements",
            description: "Capture what must be true for the experience to deliver value, including priority and testable acceptance criteria.",
        },
        {
            id: "experience",
            label: "Experience",
            eyebrow: "Shape the journey",
            title: "Experience design",
            description: "Describe the user job, experience principles, primary flow, and behavior across loading, empty, error, and success states.",
        },
        {
            id: "interface",
            label: "UI specification",
            eyebrow: "Specify the interface",
            title: "UI specification",
            description: "Inventory screens and components, then document responsive, content, interaction, and visual direction.",
        },
        {
            id: "delivery",
            label: "Delivery",
            eyebrow: "Measure and de-risk",
            title: "Delivery and validation",
            description: "Define success signals, instrumentation, accessibility coverage, dependencies, risks, and unresolved questions.",
        },
    ];

    const state = {
        spec: null,
        section: "brief",
        dirty: false,
        saving: false,
        version: 0,
        saveTimer: null,
    };

    const byId = (id) => document.getElementById(id);
    const escapeHtml = (value) => String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

    function getPath(object, path) {
        return path.split(".").reduce((value, key) => value?.[key], object);
    }

    function setPath(object, path, value) {
        const keys = path.split(".");
        const finalKey = keys.pop();
        const parent = keys.reduce((current, key) => current[key], object);
        parent[finalKey] = value;
    }

    function makeId(prefix) {
        return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
    }

    function field(label, path, value, options = {}) {
        const hint = options.hint
            ? `<span class="field-hint">${escapeHtml(options.hint)}</span>`
            : "";
        const rows = options.large ? " large" : "";
        return `<label class="field">
            <span class="field-label">${escapeHtml(label)} ${hint}</span>
            <textarea class="control${rows}" data-path="${escapeHtml(path)}" placeholder="${escapeHtml(options.placeholder ?? "")}">${escapeHtml(value)}</textarea>
        </label>`;
    }

    function textInput(label, rowPath, rowId, key, value, placeholder = "") {
        return `<label class="field">
            <span class="field-label">${escapeHtml(label)}</span>
            <input class="control" data-row-path="${escapeHtml(rowPath)}" data-row-id="${escapeHtml(rowId)}" data-key="${escapeHtml(key)}" value="${escapeHtml(value)}" placeholder="${escapeHtml(placeholder)}" />
        </label>`;
    }

    function rowTextarea(label, rowPath, rowId, key, value, placeholder = "") {
        return `<label class="field">
            <span class="field-label">${escapeHtml(label)}</span>
            <textarea class="control" data-row-path="${escapeHtml(rowPath)}" data-row-id="${escapeHtml(rowId)}" data-key="${escapeHtml(key)}" placeholder="${escapeHtml(placeholder)}">${escapeHtml(value)}</textarea>
        </label>`;
    }

    function selectOptions(values, current) {
        return values.map((value) => `<option value="${escapeHtml(value)}"${value === current ? " selected" : ""}>${escapeHtml(value)}</option>`).join("");
    }

    function heading() {
        const section = sections.find((item) => item.id === state.section);
        return `<header class="section-heading">
            <div>
                <div class="eyebrow">${escapeHtml(section.eyebrow)}</div>
                <h1>${escapeHtml(section.title)}</h1>
                <p>${escapeHtml(section.description)}</p>
            </div>
        </header>`;
    }

    function listEditor(path, values, placeholder) {
        const rows = values.map((value, index) => `<div class="list-row">
            <input class="control" data-list-path="${escapeHtml(path)}" data-index="${index}" value="${escapeHtml(value)}" placeholder="${escapeHtml(placeholder)}" />
            <button class="button danger small" type="button" data-remove-list="${escapeHtml(path)}" data-index="${index}" aria-label="Remove item">Remove</button>
        </div>`).join("");
        return `<div class="list-editor">
            ${rows || `<div class="empty"><div><strong>No items yet</strong>Add the first one when it becomes useful.</div></div>`}
            <div><button class="button subtle small" type="button" data-add-list="${escapeHtml(path)}">+ Add item</button></div>
        </div>`;
    }

    function renderBrief() {
        const spec = state.spec;
        return `${heading()}
            <section class="card accent">
                ${field("One-line pitch", "brief.oneLiner", spec.brief.oneLiner, {
                    placeholder: "For [audience], this product helps [outcome] by [differentiator].",
                    hint: "Make the value legible in one breath.",
                })}
            </section>
            <div class="grid three">
                <section class="card">
                    ${field("Customer problem", "brief.problem", spec.brief.problem, {
                        placeholder: "What is painful, costly, risky, or impossible today?",
                    })}
                </section>
                <section class="card">
                    ${field("Primary audience", "brief.audience", spec.brief.audience, {
                        placeholder: "Who has this problem? Include context and constraints.",
                    })}
                </section>
                <section class="card">
                    ${field("Value proposition", "brief.value", spec.brief.value, {
                        placeholder: "What changes for the customer, and why is this approach better?",
                    })}
                </section>
            </div>
            <div class="grid three">
                <section class="card">
                    <div class="card-header"><div><h2>Goals</h2><p>Measurable outcomes this work should create.</p></div></div>
                    ${listEditor("brief.goals", spec.brief.goals, "Outcome or success condition")}
                </section>
                <section class="card">
                    <div class="card-header"><div><h2>Non-goals</h2><p>Explicit boundaries that prevent scope drift.</p></div></div>
                    ${listEditor("brief.nonGoals", spec.brief.nonGoals, "What this release will not solve")}
                </section>
                <section class="card">
                    <div class="card-header"><div><h2>Assumptions</h2><p>Beliefs that need evidence or validation.</p></div></div>
                    ${listEditor("brief.assumptions", spec.brief.assumptions, "Assumption to validate")}
                </section>
            </div>`;
    }

    function requirementCard(item) {
        return `<article class="row-card">
            <div class="row-card-header">
                <input class="row-title" data-row-path="requirements" data-row-id="${escapeHtml(item.id)}" data-key="title" value="${escapeHtml(item.title)}" placeholder="Requirement title" />
                <select class="compact-select" data-row-path="requirements" data-row-id="${escapeHtml(item.id)}" data-key="priority" aria-label="Priority">
                    ${selectOptions(["Must", "Should", "Could", "Won't"], item.priority)}
                </select>
                <select class="compact-select" data-row-path="requirements" data-row-id="${escapeHtml(item.id)}" data-key="status" aria-label="Status">
                    ${selectOptions(["Proposed", "Ready", "In progress", "Done"], item.status)}
                </select>
                <button class="button danger small" type="button" data-remove-row="requirements" data-row-id="${escapeHtml(item.id)}">Remove</button>
            </div>
            <div class="row-grid">
                ${textInput("Owner", "requirements", item.id, "owner", item.owner, "Name or team")}
                ${rowTextarea("Description", "requirements", item.id, "description", item.description, "Describe the customer-visible behavior or constraint.")}
                ${rowTextarea("Acceptance criteria", "requirements", item.id, "acceptanceCriteria", item.acceptanceCriteria, "Use observable, testable outcomes.")}
            </div>
        </article>`;
    }

    function renderRequirements() {
        const rows = state.spec.requirements.map(requirementCard).join("");
        return `${heading()}
            <section class="card">
                <div class="card-header">
                    <div><h2>Product requirements</h2><p>Prioritize the contract, not implementation tasks.</p></div>
                    <button class="button primary small" type="button" data-add-row="requirements">+ Requirement</button>
                </div>
                <div class="row-stack">
                    ${rows || `<div class="empty"><div><strong>No requirements yet</strong>Start with the smallest customer-visible behavior that must be true.</div></div>`}
                </div>
            </section>`;
    }

    function flowCard(item, index) {
        return `<article class="flow-card">
            <span class="flow-number">${index + 1}</span>
            <button class="button danger small remove-corner" type="button" data-remove-row="experience.flow" data-row-id="${escapeHtml(item.id)}" aria-label="Remove step">x</button>
            ${textInput("Step", "experience.flow", item.id, "name", item.name, "e.g. Discover")}
            ${textInput("Actor", "experience.flow", item.id, "actor", item.actor, "User, system, admin")}
            ${rowTextarea("What happens", "experience.flow", item.id, "description", item.description, "Intent, action, and response")}
        </article>`;
    }

    function stateRow(item) {
        return `<div class="matrix-row">
            <input class="control" data-row-path="experience.states" data-row-id="${escapeHtml(item.id)}" data-key="surface" value="${escapeHtml(item.surface)}" placeholder="Surface" />
            <input class="control" data-row-path="experience.states" data-row-id="${escapeHtml(item.id)}" data-key="state" value="${escapeHtml(item.state)}" placeholder="Loading / empty / error" />
            <input class="control" data-row-path="experience.states" data-row-id="${escapeHtml(item.id)}" data-key="trigger" value="${escapeHtml(item.trigger)}" placeholder="Trigger" />
            <textarea class="control" data-row-path="experience.states" data-row-id="${escapeHtml(item.id)}" data-key="behavior" placeholder="Expected content and behavior">${escapeHtml(item.behavior)}</textarea>
            <button class="button danger small" type="button" data-remove-row="experience.states" data-row-id="${escapeHtml(item.id)}">Remove</button>
        </div>`;
    }

    function renderExperience() {
        const spec = state.spec;
        return `${heading()}
            <section class="card accent">
                ${field("Job story", "experience.jobStory", spec.experience.jobStory, {
                    placeholder: "When [situation], I want to [motivation], so I can [expected outcome].",
                    hint: "Center context and motivation rather than persona traits.",
                })}
            </section>
            <section class="card">
                <div class="card-header"><div><h2>Experience principles</h2><p>Decision filters for interaction, content, and visual design.</p></div></div>
                ${listEditor("experience.principles", spec.experience.principles, "e.g. Progressive disclosure over configuration walls")}
            </section>
            <section class="card">
                <div class="card-header">
                    <div><h2>Primary user flow</h2><p>Map the happy path before branching into exceptions.</p></div>
                    <button class="button primary small" type="button" data-add-row="experience.flow">+ Flow step</button>
                </div>
                <div class="flow-list">
                    ${spec.experience.flow.map(flowCard).join("") || `<div class="empty"><div><strong>No flow steps yet</strong>Start at the user's entry point and end at a meaningful outcome.</div></div>`}
                </div>
            </section>
            <section class="card">
                <div class="card-header">
                    <div><h2>State matrix</h2><p>Specify loading, empty, error, permission, offline, partial, and success behavior.</p></div>
                    <button class="button primary small" type="button" data-add-row="experience.states">+ State</button>
                </div>
                <div>
                    ${spec.experience.states.map(stateRow).join("") || `<div class="empty"><div><strong>No UI states yet</strong>Document the states that are easiest to miss in a happy-path mockup.</div></div>`}
                </div>
            </section>`;
    }

    function screenCard(item) {
        return `<article class="row-card">
            <div class="row-card-header">
                <input class="row-title" data-row-path="ui.screens" data-row-id="${escapeHtml(item.id)}" data-key="name" value="${escapeHtml(item.name)}" placeholder="Screen or surface name" />
                <span class="pill">Screen</span>
                <span></span>
                <button class="button danger small" type="button" data-remove-row="ui.screens" data-row-id="${escapeHtml(item.id)}">Remove</button>
            </div>
            <div class="row-grid">
                ${textInput("Purpose", "ui.screens", item.id, "purpose", item.purpose, "The decision or task this screen enables")}
                ${textInput("Primary action", "ui.screens", item.id, "primaryAction", item.primaryAction, "Main call to action")}
                ${rowTextarea("Notes", "ui.screens", item.id, "notes", item.notes, "Hierarchy, transitions, edge cases, or references")}
            </div>
        </article>`;
    }

    function componentCard(item) {
        return `<article class="row-card">
            <div class="row-card-header">
                <input class="row-title" data-row-path="ui.components" data-row-id="${escapeHtml(item.id)}" data-key="name" value="${escapeHtml(item.name)}" placeholder="Component name" />
                <span class="pill">Component</span>
                <span></span>
                <button class="button danger small" type="button" data-remove-row="ui.components" data-row-id="${escapeHtml(item.id)}">Remove</button>
            </div>
            <div class="row-grid">
                ${rowTextarea("Behavior", "ui.components", item.id, "behavior", item.behavior, "Interaction, focus, validation, and state changes")}
                ${rowTextarea("Variants", "ui.components", item.id, "variants", item.variants, "Sizes, hierarchy, state, and responsive variants")}
            </div>
        </article>`;
    }

    function renderInterface() {
        const spec = state.spec;
        return `${heading()}
            <div class="grid three">
                <section class="card">
                    ${field("Visual direction", "ui.visualDirection", spec.ui.visualDirection, {
                        placeholder: "Tone, density, hierarchy, references, and constraints.",
                    })}
                </section>
                <section class="card">
                    ${field("Responsive behavior", "ui.responsiveBehavior", spec.ui.responsiveBehavior, {
                        placeholder: "Breakpoints, reflow, priority, truncation, and input modes.",
                    })}
                </section>
                <section class="card">
                    ${field("Content guidance", "ui.contentGuidance", spec.ui.contentGuidance, {
                        placeholder: "Voice, terminology, labels, helper text, and error copy.",
                    })}
                </section>
            </div>
            <section class="card">
                <div class="card-header">
                    <div><h2>Screen inventory</h2><p>Give every surface a purpose and a dominant action.</p></div>
                    <button class="button primary small" type="button" data-add-row="ui.screens">+ Screen</button>
                </div>
                <div class="row-stack">
                    ${spec.ui.screens.map(screenCard).join("") || `<div class="empty"><div><strong>No screens yet</strong>List the minimum set of surfaces needed to complete the flow.</div></div>`}
                </div>
            </section>
            <section class="card">
                <div class="card-header">
                    <div><h2>Component behavior</h2><p>Document interaction contracts and meaningful variants.</p></div>
                    <button class="button primary small" type="button" data-add-row="ui.components">+ Component</button>
                </div>
                <div class="row-stack">
                    ${spec.ui.components.map(componentCard).join("") || `<div class="empty"><div><strong>No components yet</strong>Add components whose behavior or variants need explicit agreement.</div></div>`}
                </div>
            </section>`;
    }

    function metricCard(item) {
        return `<article class="row-card">
            <div class="row-card-header">
                <input class="row-title" data-row-path="delivery.metrics" data-row-id="${escapeHtml(item.id)}" data-key="name" value="${escapeHtml(item.name)}" placeholder="Metric name" />
                <span class="pill">Outcome</span>
                <span></span>
                <button class="button danger small" type="button" data-remove-row="delivery.metrics" data-row-id="${escapeHtml(item.id)}">Remove</button>
            </div>
            <div class="row-grid">
                ${textInput("Target", "delivery.metrics", item.id, "target", item.target, "Baseline to target, with timeframe")}
                ${textInput("Signal / source", "delivery.metrics", item.id, "signal", item.signal, "Dashboard, study, survey, or query")}
            </div>
        </article>`;
    }

    function analyticsRow(item) {
        return `<div class="matrix-row">
            <input class="control" data-row-path="delivery.analytics" data-row-id="${escapeHtml(item.id)}" data-key="name" value="${escapeHtml(item.name)}" placeholder="event_name" />
            <input class="control" data-row-path="delivery.analytics" data-row-id="${escapeHtml(item.id)}" data-key="trigger" value="${escapeHtml(item.trigger)}" placeholder="Trigger" />
            <input class="control" data-row-path="delivery.analytics" data-row-id="${escapeHtml(item.id)}" data-key="properties" value="${escapeHtml(item.properties)}" placeholder="Properties" />
            <span></span>
            <button class="button danger small" type="button" data-remove-row="delivery.analytics" data-row-id="${escapeHtml(item.id)}">Remove</button>
        </div>`;
    }

    function accessibilityRow(item) {
        return `<div class="a11y-row">
            <strong>${escapeHtml(item.label)}</strong>
            <select class="compact-select" data-row-path="delivery.accessibility" data-row-id="${escapeHtml(item.id)}" data-key="status">
                ${selectOptions(["Not reviewed", "In progress", "Met", "Exception"], item.status)}
            </select>
            <input class="control" data-row-path="delivery.accessibility" data-row-id="${escapeHtml(item.id)}" data-key="notes" value="${escapeHtml(item.notes)}" placeholder="Evidence, owner, or exception" />
        </div>`;
    }

    function renderDelivery() {
        const spec = state.spec;
        return `${heading()}
            <section class="card">
                <div class="card-header">
                    <div><h2>Success metrics</h2><p>Pair customer outcomes with a baseline, target, and source.</p></div>
                    <button class="button primary small" type="button" data-add-row="delivery.metrics">+ Metric</button>
                </div>
                <div class="row-stack">
                    ${spec.delivery.metrics.map(metricCard).join("") || `<div class="empty"><div><strong>No metrics yet</strong>Define how the team will know the product changed customer behavior or outcomes.</div></div>`}
                </div>
            </section>
            <section class="card">
                <div class="card-header">
                    <div><h2>Analytics plan</h2><p>Instrument decisions and outcomes, not every click.</p></div>
                    <button class="button primary small" type="button" data-add-row="delivery.analytics">+ Event</button>
                </div>
                ${spec.delivery.analytics.map(analyticsRow).join("") || `<div class="empty"><div><strong>No analytics events yet</strong>Add only events needed to answer a product question.</div></div>`}
            </section>
            <section class="card">
                <div class="card-header"><div><h2>Accessibility readiness</h2><p>Track evidence throughout design and implementation.</p></div></div>
                ${spec.delivery.accessibility.map(accessibilityRow).join("")}
            </section>
            <div class="grid three">
                <section class="card">
                    <div class="card-header"><div><h2>Dependencies</h2><p>Teams, systems, decisions, or capabilities.</p></div></div>
                    ${listEditor("delivery.dependencies", spec.delivery.dependencies, "Dependency and owner")}
                </section>
                <section class="card">
                    <div class="card-header"><div><h2>Risks</h2><p>Uncertainty that could affect value or delivery.</p></div></div>
                    ${listEditor("delivery.risks", spec.delivery.risks, "Risk and mitigation")}
                </section>
                <section class="card">
                    <div class="card-header"><div><h2>Open questions</h2><p>Decisions still needed, ideally with an owner.</p></div></div>
                    ${listEditor("delivery.openQuestions", spec.delivery.openQuestions, "Question, owner, and decision date")}
                </section>
            </div>`;
    }

    function renderSection() {
        const renderers = {
            brief: renderBrief,
            requirements: renderRequirements,
            experience: renderExperience,
            interface: renderInterface,
            delivery: renderDelivery,
        };
        byId("content").innerHTML = renderers[state.section]();
        document.querySelectorAll(".nav-item").forEach((item) => {
            item.classList.toggle("active", item.dataset.section === state.section);
        });
        updateSummary();
    }

    function completion() {
        const spec = state.spec;
        const checks = [
            spec.brief.oneLiner,
            spec.brief.problem,
            spec.brief.audience,
            spec.brief.goals.length,
            spec.requirements.length,
            spec.experience.jobStory,
            spec.experience.flow.length,
            spec.experience.states.length,
            spec.ui.screens.length,
            spec.ui.responsiveBehavior,
            spec.delivery.metrics.length,
            spec.delivery.accessibility.some((item) => item.status === "Met"),
        ];
        const complete = checks.filter(Boolean).length;
        return Math.round((complete / checks.length) * 100);
    }

    function updateSummary() {
        if (!state.spec) {
            return;
        }
        const spec = state.spec;
        byId("nav-requirements").textContent = spec.requirements.length;
        byId("nav-experience").textContent = spec.experience.flow.length + spec.experience.states.length;
        byId("nav-interface").textContent = spec.ui.screens.length + spec.ui.components.length;
        byId("nav-delivery").textContent = spec.delivery.openQuestions.length;
        const percent = completion();
        byId("progress-bar").value = percent;
        byId("progress-copy").textContent = `${percent}% of core spec signals covered`;
    }

    function markChanged() {
        state.dirty = true;
        state.version += 1;
        setSaveState("Unsaved changes");
        clearTimeout(state.saveTimer);
        state.saveTimer = setTimeout(saveNow, 650);
        updateSummary();
    }

    function setSaveState(message, error = false) {
        const element = byId("save-state");
        element.textContent = message;
        element.classList.toggle("error", error);
    }

    async function request(path, options) {
        const response = await fetch(path, options);
        if (!response.ok) {
            let message = `Request failed (${response.status})`;
            try {
                const payload = await response.json();
                message = payload.error || message;
            } catch {
                // The HTTP status still communicates a useful failure.
            }
            throw new Error(message);
        }
        return response;
    }

    async function saveNow() {
        clearTimeout(state.saveTimer);
        if (!state.dirty || state.saving) {
            return;
        }

        state.saving = true;
        const snapshotVersion = state.version;
        const snapshot = structuredClone(state.spec);
        setSaveState("Saving...");

        try {
            const response = await request("/api/spec", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(snapshot),
            });
            const saved = await response.json();
            state.spec.meta.updatedAt = saved.meta.updatedAt;
            state.dirty = state.version !== snapshotVersion;
            setSaveState(state.dirty ? "Unsaved changes" : "Saved");
        } catch (error) {
            state.dirty = true;
            setSaveState(error.message, true);
        } finally {
            state.saving = false;
            if (state.dirty && state.version !== snapshotVersion) {
                state.saveTimer = setTimeout(saveNow, 200);
            }
        }
    }

    function changeRow(element) {
        const rows = getPath(state.spec, element.dataset.rowPath);
        const row = rows.find((item) => item.id === element.dataset.rowId);
        if (!row) {
            return;
        }
        row[element.dataset.key] = element.value;
        markChanged();
    }

    function handleValueChange(event) {
        const element = event.target;
        if (element.dataset.path) {
            setPath(state.spec, element.dataset.path, element.value);
            markChanged();
            return;
        }
        if (element.dataset.listPath) {
            getPath(state.spec, element.dataset.listPath)[Number(element.dataset.index)] = element.value;
            markChanged();
            return;
        }
        if (element.dataset.rowPath) {
            changeRow(element);
        }
    }

    const rowFactories = {
        requirements: () => ({
            id: makeId("req"),
            title: "",
            priority: "Should",
            status: "Proposed",
            owner: "",
            description: "",
            acceptanceCriteria: "",
        }),
        "experience.flow": () => ({
            id: makeId("flow"),
            name: "",
            actor: "",
            description: "",
        }),
        "experience.states": () => ({
            id: makeId("state"),
            surface: "",
            state: "",
            trigger: "",
            behavior: "",
        }),
        "ui.screens": () => ({
            id: makeId("screen"),
            name: "",
            purpose: "",
            primaryAction: "",
            notes: "",
        }),
        "ui.components": () => ({
            id: makeId("component"),
            name: "",
            behavior: "",
            variants: "",
        }),
        "delivery.metrics": () => ({
            id: makeId("metric"),
            name: "",
            target: "",
            signal: "",
        }),
        "delivery.analytics": () => ({
            id: makeId("event"),
            name: "",
            trigger: "",
            properties: "",
        }),
    };

    function handleClick(event) {
        const nav = event.target.closest("[data-section]");
        if (nav) {
            state.section = nav.dataset.section;
            renderSection();
            return;
        }

        const addList = event.target.closest("[data-add-list]");
        if (addList) {
            getPath(state.spec, addList.dataset.addList).push("");
            markChanged();
            renderSection();
            return;
        }

        const removeList = event.target.closest("[data-remove-list]");
        if (removeList) {
            getPath(state.spec, removeList.dataset.removeList).splice(Number(removeList.dataset.index), 1);
            markChanged();
            renderSection();
            return;
        }

        const addRow = event.target.closest("[data-add-row]");
        if (addRow) {
            const path = addRow.dataset.addRow;
            getPath(state.spec, path).push(rowFactories[path]());
            markChanged();
            renderSection();
            return;
        }

        const removeRow = event.target.closest("[data-remove-row]");
        if (removeRow) {
            const path = removeRow.dataset.removeRow;
            const rows = getPath(state.spec, path);
            const index = rows.findIndex((item) => item.id === removeRow.dataset.rowId);
            if (index >= 0) {
                rows.splice(index, 1);
                markChanged();
                renderSection();
            }
        }
    }

    async function exportMarkdown() {
        await saveNow();
        try {
            const response = await request("/api/export");
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = `${state.spec.documentId}.md`;
            anchor.click();
            URL.revokeObjectURL(url);
            showToast("Markdown export downloaded.");
        } catch (error) {
            showToast(error.message);
        }
    }

    async function copyBrief() {
        const spec = state.spec;
        const value = [
            spec.meta.title,
            spec.brief.oneLiner,
            `Problem: ${spec.brief.problem || "Not defined"}`,
            `Audience: ${spec.brief.audience || "Not defined"}`,
            `Goals: ${spec.brief.goals.join("; ") || "Not defined"}`,
        ].join("\n\n");
        try {
            await navigator.clipboard.writeText(value);
            showToast("Brief copied to clipboard.");
        } catch {
            showToast("Clipboard access is unavailable.");
        }
    }

    let toastTimer;
    function showToast(message) {
        const toast = byId("toast");
        toast.textContent = message;
        toast.classList.add("visible");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove("visible"), 2200);
    }

    function renderNav() {
        byId("nav").innerHTML = sections.map((section, index) => `<button class="nav-item${section.id === state.section ? " active" : ""}" type="button" data-section="${escapeHtml(section.id)}">
            <span class="nav-index">${index + 1}</span>
            <span>${escapeHtml(section.label)}</span>
            ${section.id === "brief" ? "" : `<span class="nav-count" id="nav-${escapeHtml(section.id)}">0</span>`}
        </button>`).join("");
    }

    async function loadSpec() {
        const response = await request("/api/spec");
        state.spec = await response.json();
        state.dirty = false;
        byId("spec-title").value = state.spec.meta.title;
        byId("spec-status").value = state.spec.meta.status;
        byId("spec-owner").value = state.spec.meta.owner;
        ["spec-title", "spec-status", "spec-owner", "copy-brief", "export"].forEach((id) => {
            byId(id).disabled = false;
        });
        setSaveState("Saved");
        renderSection();
    }

    function connectEvents() {
        const events = new EventSource("/events");
        events.addEventListener("spec-updated", async () => {
            if (state.saving || state.dirty) {
                return;
            }
            try {
                await loadSpec();
                showToast("Specification updated.");
            } catch (error) {
                setSaveState(error.message, true);
            }
        });
    }

    async function initialize() {
        renderNav();
        try {
            await loadSpec();
            connectEvents();
        } catch (error) {
            byId("content").innerHTML = `<div class="error-panel"><strong>Unable to load this specification.</strong><p>${escapeHtml(error.message)}</p></div>`;
            setSaveState("Load failed", true);
        }
    }

    document.addEventListener("input", (event) => {
        if (event.target.tagName !== "SELECT") {
            handleValueChange(event);
        }
    });
    document.addEventListener("change", (event) => {
        if (event.target.tagName === "SELECT") {
            handleValueChange(event);
        }
    });
    document.addEventListener("click", handleClick);
    byId("export").addEventListener("click", exportMarkdown);
    byId("copy-brief").addEventListener("click", copyBrief);
    document.addEventListener("keydown", (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
            event.preventDefault();
            saveNow();
        }
    });
    window.addEventListener("beforeunload", (event) => {
        if (state.dirty) {
            event.preventDefault();
        }
    });

    initialize();
}

export const APP_JS = `(${clientApp.toString()})();`;

export function renderHtml() {
    return `<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Product design specs</title>
        <link rel="stylesheet" href="/styles.css" />
    </head>
    <body>
        <div class="app">
            <aside class="sidebar">
                <div class="brand">
                    <div class="brand-mark">PRD</div>
                    <div class="brand-copy">
                        <strong>Product canvas</strong>
                        <span>PM / Design / UX</span>
                    </div>
                </div>
                <div class="nav-label">Specification</div>
                <nav id="nav" aria-label="Specification sections"></nav>
                <div class="sidebar-summary">
                    <strong>Spec readiness</strong>
                    <progress class="progress-track" id="progress-bar" max="100" value="0"></progress>
                    <div class="progress-copy" id="progress-copy">0% of core spec signals covered</div>
                </div>
            </aside>
            <main class="workspace">
                <header class="topbar">
                    <div class="title-wrap">
                        <input class="title-input" id="spec-title" data-path="meta.title" aria-label="Specification title" disabled />
                        <div class="save-state" id="save-state">Loading...</div>
                    </div>
                    <input class="control owner-input" id="spec-owner" data-path="meta.owner" placeholder="Owner" aria-label="Owner" disabled />
                    <select class="compact-select" id="spec-status" data-path="meta.status" aria-label="Specification status" disabled>
                        <option>Draft</option>
                        <option>In review</option>
                        <option>Approved</option>
                        <option>Shipped</option>
                    </select>
                    <button class="button" id="copy-brief" type="button" disabled>Copy brief</button>
                    <button class="button primary" id="export" type="button" disabled>Export .md</button>
                </header>
                <div class="content" id="content">
                    <div class="loading">Loading product specification...</div>
                </div>
            </main>
        </div>
        <div class="toast" id="toast" role="status"></div>
        <script src="/app.js"></script>
    </body>
</html>`;
}
