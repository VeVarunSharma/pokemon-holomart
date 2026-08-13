import { escapeHtml } from "./model.mjs";

export function renderShell(nonce) {
  const safeNonce = escapeHtml(nonce);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>QA Change-Risk</title>
  <style nonce="${safeNonce}">
    :root { color-scheme: light dark; }
    * { box-sizing: border-box; }
    body { margin:0; background:var(--background-color-default,#f6f8fa); color:var(--text-color-default,#1f2328); font:var(--text-body-medium,14px)/var(--leading-body-medium,20px) var(--font-sans,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif); }
    button,input,select,textarea { font:inherit; color:inherit; }
    button,input,select,textarea { border:1px solid var(--border-color-default,#d0d7de); border-radius:7px; background:var(--background-color-default,#fff); }
    button { min-height:36px; padding:7px 11px; cursor:pointer; font-weight:var(--font-weight-semibold,600); }
    button:hover:not(:disabled) { background:var(--true-color-blue-muted,#ddf4ff); }
    button:disabled { cursor:not-allowed; opacity:.55; }
    button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible,[role="tab"]:focus-visible { outline:2px solid var(--color-focus-outline,#0969da); outline-offset:2px; }
    code,pre { font-family:var(--font-mono,"SFMono-Regular",Consolas,monospace); font-size:var(--text-code-inline,12px); }
    .topbar { position:sticky; top:0; z-index:10; padding:16px clamp(14px,3vw,34px); border-bottom:1px solid var(--border-color-default,#d0d7de); background:color-mix(in srgb,var(--background-color-default,#fff) 94%,transparent); backdrop-filter:blur(12px); }
    .brand,.toolbar,.summary,.tabs,.card-head,.facts,.run-actions { display:flex; align-items:center; gap:10px; }
    .brand { justify-content:space-between; align-items:flex-start; }
    h1 { margin:1px 0 3px; font-size:var(--text-title-large,26px); line-height:1.2; letter-spacing:-.03em; }
    h2,h3 { margin:0; line-height:1.3; }
    h2 { font-size:20px; } h3 { font-size:16px; }
    p { margin:6px 0; }
    .eyebrow { margin:0; color:var(--text-color-muted,#59636e); text-transform:uppercase; letter-spacing:.09em; font-size:10px; font-weight:700; }
    .muted { color:var(--text-color-muted,#59636e); }
    .toolbar { justify-content:flex-end; flex-wrap:wrap; }
    .summary { margin-top:14px; flex-wrap:wrap; color:var(--text-color-muted,#59636e); }
    .summary strong { color:var(--text-color-default,#1f2328); }
    .tabs { padding:0 clamp(14px,3vw,34px); border-bottom:1px solid var(--border-color-default,#d0d7de); background:var(--background-color-default,#fff); }
    [role="tab"] { border:0; border-bottom:3px solid transparent; border-radius:0; background:transparent; padding:12px 14px 9px; }
    [role="tab"][aria-selected="true"] { border-bottom-color:var(--true-color-blue,#0969da); color:var(--true-color-blue,#0969da); }
    [role="tabpanel"] { padding:20px clamp(14px,3vw,34px) 42px; }
    [hidden] { display:none !important; }
    .panel-head { display:flex; justify-content:space-between; gap:18px; align-items:end; margin-bottom:16px; }
    .controls { display:flex; gap:9px; align-items:end; flex-wrap:wrap; }
    label { display:grid; gap:4px; font-size:12px; color:var(--text-color-muted,#59636e); font-weight:var(--font-weight-semibold,600); }
    select,input,textarea { padding:7px 9px; min-height:36px; }
    textarea { resize:vertical; min-height:82px; }
    .grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(290px,1fr)); gap:12px; align-items:start; }
    .card { min-width:0; padding:15px; border:1px solid var(--border-color-default,#d0d7de); border-radius:11px; background:var(--background-color-default,#fff); box-shadow:0 1px 2px rgba(31,35,40,.05); }
    .card-head { justify-content:space-between; align-items:flex-start; }
    .badges { display:flex; gap:5px; flex-wrap:wrap; margin:9px 0; }
    .badge { display:inline-flex; align-items:center; min-height:22px; padding:2px 7px; border:1px solid var(--border-color-default,#d0d7de); border-radius:99px; font-size:11px; text-transform:capitalize; }
    .badge.observed,.badge.pass { background:#dafbe1; color:#116329; border-color:transparent; }
    .badge.inferred,.badge.review { background:var(--true-color-blue-muted,#ddf4ff); border-color:transparent; }
    .badge.human-decision,.badge.blocked,.badge.fail { background:var(--true-color-red-muted,#ffebe9); border-color:transparent; }
    .badge.not-run,.badge.skipped,.badge.proposed { background:color-mix(in srgb,var(--background-color-default,#fff) 75%,var(--border-color-default,#d0d7de)); }
    .facts { align-items:flex-start; flex-wrap:wrap; color:var(--text-color-muted,#59636e); font-size:12px; }
    .evidence,.factors,.mitigations { margin:10px 0 0; padding-left:20px; }
    li+li { margin-top:5px; }
    .evidence code { overflow-wrap:anywhere; }
    .empty { padding:24px; border:1px dashed var(--border-color-default,#d0d7de); border-radius:10px; color:var(--text-color-muted,#59636e); text-align:center; }
    .plan-row { display:grid; grid-template-columns:auto 1fr; gap:11px; }
    .plan-row input[type="checkbox"] { width:18px; height:18px; margin-top:2px; }
    .command { display:block; margin-top:8px; padding:8px; border-radius:6px; background:color-mix(in srgb,var(--background-color-default,#fff) 80%,var(--border-color-default,#d0d7de)); overflow-wrap:anywhere; }
    .confirmation { margin:16px 0; padding:16px; border:2px solid var(--true-color-blue,#0969da); border-radius:11px; background:var(--true-color-blue-muted,#ddf4ff); }
    .confirmation ol { margin-bottom:14px; }
    .manual-form { display:grid; grid-template-columns:1fr 180px; gap:10px; margin:20px 0; padding:16px; border:1px solid var(--border-color-default,#d0d7de); border-radius:11px; }
    .manual-form .wide { grid-column:1/-1; }
    .result-card { display:grid; gap:9px; }
    .section-title { margin-top:22px; }
    .run-actions { justify-content:space-between; flex-wrap:wrap; }
    pre { max-height:300px; margin:0; padding:11px; overflow:auto; white-space:pre-wrap; overflow-wrap:anywhere; border:1px solid var(--border-color-default,#d0d7de); border-radius:7px; background:#0d1117; color:#f0f6fc; }
    .manual-result { display:grid; gap:8px; margin-top:8px; }
    .notice { display:none; margin-top:10px; padding:9px 11px; border-radius:7px; background:var(--true-color-red-muted,#ffebe9); }
    .notice.visible { display:block; }
    .status { min-height:20px; margin-top:8px; color:var(--text-color-muted,#59636e); }
    .readiness { padding:7px 10px; border-radius:7px; background:var(--true-color-blue-muted,#ddf4ff); font-weight:600; }
    @media (max-width:700px) {
      .topbar { position:static; }
      .brand,.panel-head { display:grid; }
      .toolbar { justify-content:flex-start; }
      .manual-form { grid-template-columns:1fr; }
      .manual-form .wide { grid-column:auto; }
      .tabs { overflow-x:auto; }
      [role="tabpanel"] { padding-top:16px; }
    }
    @media (prefers-reduced-motion:no-preference) {
      .card { transition:border-color .15s,box-shadow .15s,transform .15s; }
      .card:hover { transform:translateY(-1px); box-shadow:0 5px 16px rgba(31,35,40,.08); }
    }
  </style>
</head>
<body>
  <header class="topbar">
    <div class="brand">
      <div><p class="eyebrow">SYNTHETIC / DEMO-ONLY</p><h1>QA Change-Risk</h1><p class="muted">Local diff evidence, transparent risk, and explicit test runs</p></div>
      <div class="toolbar">
        <button id="refresh" type="button">Refresh diff</button>
        <button id="export-markdown" type="button">Export Markdown</button>
        <button id="export-json" type="button">Export JSON</button>
      </div>
    </div>
    <div class="summary" id="summary" aria-live="polite"></div>
    <div class="notice" id="notice" role="alert"></div>
    <div class="status" id="status" role="status" aria-live="polite"></div>
  </header>

  <nav class="tabs" role="tablist" aria-label="QA workflow">
    <button role="tab" id="tab-risks" aria-controls="panel-risks" aria-selected="true" tabindex="0">Risks</button>
    <button role="tab" id="tab-plan" aria-controls="panel-plan" aria-selected="false" tabindex="-1">Test Plan</button>
    <button role="tab" id="tab-results" aria-controls="panel-results" aria-selected="false" tabindex="-1">Results</button>
  </nav>

  <main>
    <section role="tabpanel" id="panel-risks" aria-labelledby="tab-risks">
      <div class="panel-head">
        <div><p class="eyebrow">Evidence and inference</p><h2>Risks</h2><p class="muted">Observed changes are separate from inferred regression risk and human decisions.</p></div>
        <div class="controls">
          <label>Kind<select id="risk-kind"><option value="all">All kinds</option><option value="inferred">Inferred</option><option value="human-decision">Human decisions</option></select></label>
          <label>Likelihood<select id="risk-level"><option value="all">All levels</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option><option value="unknown">Unknown</option></select></label>
        </div>
      </div>
      <section aria-labelledby="changes-title"><h3 id="changes-title">Observed change inventory</h3><div class="grid" id="changes"></div></section>
      <section aria-labelledby="risks-title"><h3 id="risks-title" class="section-title">Risk assessment and decisions</h3><div class="grid" id="risks"></div></section>
    </section>

    <section role="tabpanel" id="panel-plan" aria-labelledby="tab-plan" hidden>
      <div class="panel-head">
        <div><p class="eyebrow">Existing versus proposed</p><h2>Test Plan</h2><p class="muted">Only selected existing allowlisted tests can be previewed and run.</p></div>
        <button id="review-selected" type="button">Review selected commands</button>
      </div>
      <div class="confirmation" id="confirmation" hidden aria-live="polite">
        <h3>Exact commands awaiting confirmation</h3>
        <p>Review these commands, then explicitly choose <strong>Run selected</strong>.</p>
        <ol id="confirmation-commands"></ol>
        <div class="run-actions"><button id="cancel-confirmation" type="button">Cancel</button><button id="run-selected" type="button">Run selected</button></div>
      </div>
      <form class="manual-form" id="manual-form">
        <label>Manual case title<input name="title" maxlength="120" required></label>
        <label>Category<select name="category"><option value="exploratory">Exploratory</option><option value="accessibility">Accessibility</option><option value="integration">Integration</option><option value="unit">Unit</option></select></label>
        <label class="wide">Rationale<textarea name="rationale" maxlength="500" required></textarea></label>
        <div class="wide"><button type="submit">Add manual case</button></div>
      </form>
      <div class="grid" id="plan"></div>
    </section>

    <section role="tabpanel" id="panel-results" aria-labelledby="tab-results" hidden>
      <div class="panel-head">
        <div><p class="eyebrow">Bounded local evidence</p><h2>Results</h2><p class="muted">Output is held only for this live session; persisted metadata excludes command logs.</p></div>
        <label>Status<select id="result-filter"><option value="all">All results</option><option value="pass">Pass</option><option value="fail">Fail</option><option value="blocked">Blocked</option><option value="skipped">Skipped</option><option value="not-run">Not run</option></select></label>
      </div>
      <div id="readiness" class="readiness"></div>
      <section aria-labelledby="runs-title"><h3 id="runs-title" class="section-title">Automated runs</h3><div class="grid" id="runs"></div></section>
      <section aria-labelledby="recorded-title"><h3 id="recorded-title" class="section-title">Recorded results</h3><div class="grid" id="results"></div></section>
    </section>
  </main>

  <script nonce="${safeNonce}">
    const state = { snapshot: null, selected: new Set(), confirmationId: null };
    const byId = (id) => document.getElementById(id);
    const notice = byId("notice");
    const status = byId("status");

    function setStatus(message) { status.textContent = message || ""; }
    function showError(message) { notice.textContent = message; notice.classList.add("visible"); }
    function clearError() { notice.textContent = ""; notice.classList.remove("visible"); }
    function node(tag, options = {}, children = []) {
      const element = document.createElement(tag);
      if (options.className) element.className = options.className;
      if (options.text !== undefined) element.textContent = String(options.text);
      if (options.type) element.type = options.type;
      if (options.value !== undefined) element.value = options.value;
      if (options.disabled !== undefined) element.disabled = options.disabled;
      for (const [name, value] of Object.entries(options.attrs || {})) element.setAttribute(name, String(value));
      for (const child of Array.isArray(children) ? children : [children]) if (child) element.append(child);
      return element;
    }
    function badge(text, extra = "") { return node("span", { className: "badge " + extra, text }); }
    function evidenceLabel(item) {
      if (!item.line) return item.path;
      return item.path + ":" + item.line + (item.endLine ? "-" + item.endLine : "");
    }
    async function request(url, options = {}) {
      clearError();
      const response = await fetch(url, options);
      const payload = await response.json().catch(() => ({ error: "Request failed." }));
      if (!response.ok) throw new Error(payload.error || payload.message || "Request failed.");
      return payload;
    }
    async function loadState(message = "") {
      const snapshot = await request("/api/state");
      state.snapshot = snapshot;
      const ids = new Set(snapshot.plan.filter((item) => item.selectable).map((item) => item.id));
      for (const selected of [...state.selected]) if (!ids.has(selected)) state.selected.delete(selected);
      render();
      if (message) setStatus(message);
    }
    function renderSummary() {
      const snapshot = state.snapshot;
      const parts = [
        node("span", { text: "Analysis " }), node("code", { text: snapshot.analysisId }),
        node("span", { text: " · " + snapshot.assessment.focusedChangeCount + " of " + snapshot.assessment.totalChangeCount + " changes" }),
        node("span", { text: " · Local base " }), node("code", { text: snapshot.assessment.baseRef }),
        node("strong", { text: " · " + snapshot.readiness.label }),
        snapshot.resultsInvalidated ? node("strong", { text: " · Prior results reset after evidence changed" }) : null,
      ].filter(Boolean);
      byId("summary").replaceChildren(...parts);
    }
    function renderChanges() {
      const container = byId("changes");
      container.replaceChildren();
      const changes = state.snapshot.assessment.changes;
      if (!changes.length) return container.append(node("p", { className: "empty", text: state.snapshot.assessment.clean ? "Clean working tree: no local changes observed." : "No changes match the selected focus paths." }));
      for (const change of changes) {
        const evidence = node("ul", { className: "evidence" });
        const ranges = change.hunks.length ? change.hunks : [{ newStart: null, newCount: 0 }];
        for (const range of ranges) {
          const text = range.newStart
            ? change.path + ":" + range.newStart + (range.newCount > 1 ? "-" + (range.newStart + range.newCount - 1) : "")
            : change.path + " (no changed text line available)";
          evidence.append(node("li", {}, node("code", { text })));
        }
        const card = node("article", { className: "card" }, [
          node("div", { className: "card-head" }, [node("h3", { text: change.path }), badge("observed", "observed")]),
          node("div", { className: "badges" }, [badge(change.changeType), badge(change.staged ? "staged" : "not staged"), badge(change.binary ? "binary" : "text")]),
          node("p", { className: "muted", text: "Observed from local Git. " + (change.added ?? "?") + " added · " + (change.deleted ?? "?") + " deleted." }),
          evidence,
        ]);
        container.append(card);
      }
    }
    function renderRisks() {
      const container = byId("risks");
      container.replaceChildren();
      const kind = byId("risk-kind").value;
      const level = byId("risk-level").value;
      const risks = state.snapshot.assessment.risks.filter((risk) =>
        (kind === "all" || risk.kind === kind) && (level === "all" || risk.likelihood === level));
      if (!risks.length) return container.append(node("p", { className: "empty", text: "No risks match these filters." }));
      for (const risk of risks) {
        const factorList = node("ul", { className: "factors" });
        if (risk.factors.length) for (const factor of risk.factors) factorList.append(node("li", { text: factor.label + " (+" + factor.weight + ")" }));
        else factorList.append(node("li", { className: "muted", text: "No numeric factor; human judgment remains open." }));
        const evidence = node("ul", { className: "evidence" });
        for (const item of risk.evidence.slice(0, 12)) evidence.append(node("li", {}, node("code", { text: evidenceLabel(item) })));
        const content = [
          node("div", { className: "card-head" }, [node("h3", { text: risk.title }), badge(risk.kind, risk.kind)]),
          node("div", { className: "badges" }, [badge("likelihood " + risk.likelihood, risk.likelihood), badge("impact " + risk.impact, risk.impact)]),
          node("p", { text: risk.rationale }),
          node("p", { className: "muted", text: risk.journey }),
          node("strong", { text: "Transparent factors" }), factorList,
          node("strong", { text: "Evidence" }), evidence,
        ];
        if (risk.kind === "inferred") {
          const select = node("select", { attrs: { "aria-label": "Review status for " + risk.title } });
          for (const value of ["unreviewed", "accepted", "questioned"]) {
            const option = node("option", { text: value, value });
            if ((state.snapshot.riskReviews[risk.id] || "unreviewed") === value) option.selected = true;
            select.append(option);
          }
          select.addEventListener("change", async () => {
            try {
              await request("/api/risk-review", { method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify({ riskId:risk.id, status:select.value }) });
              await loadState("Risk review saved.");
            } catch (error) { showError(error.message); }
          });
          content.push(node("label", { text: "Human review" }, select));
        }
        container.append(node("article", { className: "card" }, content));
      }
    }
    function clearConfirmation() {
      state.confirmationId = null;
      byId("confirmation").hidden = true;
      byId("confirmation-commands").replaceChildren();
    }
    function renderPlan() {
      const container = byId("plan");
      container.replaceChildren();
      for (const item of state.snapshot.plan) {
        const body = node("div");
        body.append(
          node("div", { className: "card-head" }, [node("h3", { text: item.title }), badge(item.source, item.source === "existing" ? "observed" : "proposed")]),
          node("div", { className: "badges" }, [badge(item.category), badge(item.mode), badge(item.result.status, item.result.status)]),
          node("p", { text: item.rationale }),
        );
        if (item.exactCommand) body.append(node("code", { className: "command", text: item.exactCommand }));
        const evidence = node("ul", { className: "evidence" });
        for (const entry of item.evidence.slice(0, 6)) evidence.append(node("li", {}, node("code", { text: evidenceLabel(entry) })));
        if (item.evidence.length) body.append(node("strong", { text: "Evidence" }), evidence);
        const children = [body];
        if (item.selectable) {
          const checkbox = node("input", { type:"checkbox", attrs: { "aria-label":"Select " + item.title } });
          checkbox.checked = state.selected.has(item.id);
          checkbox.addEventListener("change", () => {
            checkbox.checked ? state.selected.add(item.id) : state.selected.delete(item.id);
            clearConfirmation();
          });
          children.unshift(checkbox);
        }
        container.append(node("article", { className: "card plan-row" }, children));
      }
      if (!state.snapshot.plan.length) container.append(node("p", { className:"empty", text:"No test plan is needed for a clean focused diff." }));
    }
    function renderRuns() {
      const container = byId("runs");
      container.replaceChildren();
      if (!state.snapshot.runs.length) return container.append(node("p", { className:"empty", text:"No automated tests have been started from this canvas." }));
      for (const run of state.snapshot.runs) {
        const actions = node("div", { className:"run-actions" }, [
          node("span", { className:"muted", text: run.command + " · " + run.status + (run.exitCode === null ? "" : " · exit " + run.exitCode) }),
        ]);
        if (run.status === "running" || run.status === "queued") {
          const cancel = node("button", { type:"button", text:"Cancel run" });
          cancel.addEventListener("click", async () => {
            try {
              await request("/api/run/cancel", { method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify({ runId:run.id }) });
              setStatus("Cancellation requested.");
            } catch (error) { showError(error.message); }
          });
          actions.append(cancel);
        }
        const content = [
          node("div", { className:"card-head" }, [node("h3", { text:run.title }), badge(run.status, run.status === "passed" ? "pass" : run.status === "failed" ? "fail" : run.status)]),
          actions,
        ];
        if (run.output) content.push(node("pre", { text:run.output + (run.truncated ? "\\n[Output was bounded to the most recent content.]" : "") }));
        container.append(node("article", { className:"card result-card" }, content));
      }
    }
    function renderResults() {
      const filter = byId("result-filter").value;
      const container = byId("results");
      container.replaceChildren();
      byId("readiness").textContent = state.snapshot.readiness.label + ". This is decision support, not release authorization.";
      const items = state.snapshot.plan.filter((item) => filter === "all" || item.result.status === filter);
      if (!items.length) return container.append(node("p", { className:"empty", text:"No recorded results match this filter." }));
      for (const item of items) {
        const card = node("article", { className:"card result-card" }, [
          node("div", { className:"card-head" }, [node("h3", { text:item.title }), badge(item.result.status, item.result.status)]),
          node("p", { className:"muted", text:item.mode + " · " + item.source + (item.result.updatedAt ? " · " + item.result.updatedAt : "") }),
        ]);
        if (item.result.exitCode !== null) card.append(node("p", { text:"Exit code " + item.result.exitCode + (item.result.durationMs === null ? "" : " · " + item.result.durationMs + " ms") }));
        if (item.result.note) card.append(node("p", { text:item.result.note }));
        if (item.mode === "manual") {
          const statusSelect = node("select", { attrs:{"aria-label":"Result status for " + item.title} });
          for (const value of ["not-run","pass","fail","blocked","skipped"]) {
            const option = node("option", { value, text:value });
            if (item.result.status === value) option.selected = true;
            statusSelect.append(option);
          }
          const note = node("textarea", { attrs:{ maxlength:"2000", "aria-label":"Result note for " + item.title } });
          note.value = item.result.note || "";
          const save = node("button", { type:"button", text:"Save manual result" });
          save.addEventListener("click", async () => {
            try {
              await request("/api/manual-result", { method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify({ itemId:item.id, status:statusSelect.value, note:note.value }) });
              await loadState("Manual result saved.");
            } catch (error) { showError(error.message); }
          });
          card.append(node("div", { className:"manual-result" }, [statusSelect, note, save]));
        }
        container.append(card);
      }
    }
    function render() {
      renderSummary();
      renderChanges();
      renderRisks();
      renderPlan();
      renderRuns();
      renderResults();
    }
    function activateTab(tab) {
      const tabs = [...document.querySelectorAll('[role="tab"]')];
      for (const candidate of tabs) {
        const active = candidate === tab;
        candidate.setAttribute("aria-selected", String(active));
        candidate.tabIndex = active ? 0 : -1;
        byId(candidate.getAttribute("aria-controls")).hidden = !active;
      }
      tab.focus();
    }
    for (const tab of document.querySelectorAll('[role="tab"]')) {
      tab.addEventListener("click", () => activateTab(tab));
      tab.addEventListener("keydown", (event) => {
        if (!["ArrowLeft","ArrowRight","Home","End"].includes(event.key)) return;
        event.preventDefault();
        const tabs = [...document.querySelectorAll('[role="tab"]')];
        const index = tabs.indexOf(tab);
        const target = event.key === "Home" ? tabs[0] : event.key === "End" ? tabs.at(-1) : tabs[(index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length];
        activateTab(target);
      });
    }
    byId("risk-kind").addEventListener("change", renderRisks);
    byId("risk-level").addEventListener("change", renderRisks);
    byId("result-filter").addEventListener("change", renderResults);
    byId("refresh").addEventListener("click", async () => {
      try {
        setStatus("Refreshing local Git evidence…");
        await request("/api/refresh", { method:"POST" });
        clearConfirmation();
        await loadState("Diff and deterministic assessment refreshed.");
      } catch (error) { showError(error.message); setStatus(""); }
    });
    byId("review-selected").addEventListener("click", async () => {
      try {
        if (!state.selected.size) throw new Error("Select at least one existing automated test.");
        const preview = await request("/api/run/preview", { method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify({ testIds:[...state.selected] }) });
        state.confirmationId = preview.confirmationId;
        const list = byId("confirmation-commands");
        list.replaceChildren();
        for (const command of preview.commands) list.append(node("li", {}, node("code", { text:command })));
        byId("confirmation").hidden = false;
        byId("confirmation").scrollIntoView({ block:"nearest" });
      } catch (error) { showError(error.message); }
    });
    byId("cancel-confirmation").addEventListener("click", clearConfirmation);
    byId("run-selected").addEventListener("click", async () => {
      try {
        if (!state.confirmationId) throw new Error("Review the exact commands again before running.");
        await request("/api/run", { method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify({ confirmationId:state.confirmationId }) });
        clearConfirmation();
        state.selected.clear();
        activateTab(byId("tab-results"));
        await loadState("Selected tests started.");
      } catch (error) { showError(error.message); }
    });
    byId("manual-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      try {
        const form = new FormData(event.currentTarget);
        await request("/api/manual-case", { method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify({ title:form.get("title"), category:form.get("category"), rationale:form.get("rationale") }) });
        event.currentTarget.reset();
        await loadState("Manual test case added.");
      } catch (error) { showError(error.message); }
    });
    async function download(format) {
      clearError();
      const response = await fetch("/api/export?format=" + format);
      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error:"Export failed." }));
        throw new Error(payload.error || "Export failed.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "qa-change-risk." + (format === "json" ? "json" : "md");
      anchor.click();
      URL.revokeObjectURL(url);
    }
    byId("export-markdown").addEventListener("click", () => download("markdown").catch((error) => showError(error.message)));
    byId("export-json").addEventListener("click", () => download("json").catch((error) => showError(error.message)));

    const events = new EventSource("/events");
    events.onopen = () => setStatus("");
    events.addEventListener("update", () => loadState().catch((error) => showError(error.message)));
    events.onerror = () => setStatus("Live updates reconnecting…");
    loadState("Local QA assessment loaded.").catch((error) => showError(error.message));
  </script>
</body>
</html>`;
}
