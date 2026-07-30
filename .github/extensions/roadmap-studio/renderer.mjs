import { escapeHtml, filterInitiatives, focusInitiative } from "./model.mjs";

const e = escapeHtml;

function pills(item) {
  return [
    `<span class="pill status">${e(item.status)}</span>`,
    `<span class="pill">confidence <strong>${e(item.confidence)}</strong></span>`,
    `<span class="pill">impact <strong>${e(item.impact)}</strong></span>`,
    `<span class="pill">effort <strong>${e(item.effort)}</strong></span>`,
  ].join("");
}

function list(values, renderer) {
  if (!values.length) return '<p class="empty">None recorded</p>';
  return `<ul>${values.map((value) => `<li>${renderer(value)}</li>`).join("")}</ul>`;
}

function card(item, focused) {
  const savedSearches = /saved searches/i.test(`${item.title} ${item.outcome}`);
  return `<article class="initiative ${focused ? "focused" : ""} ${savedSearches ? "saved-searches" : ""}" id="${e(item.id)}">
    ${savedSearches ? '<div class="feature-label">Saved Searches</div>' : ""}
    <div class="card-head">
      <div><p class="eyebrow">${e(item.id)}</p><h3>${e(item.title)}</h3></div>
      <button class="focus-button" type="button" data-focus="${e(item.id)}">${focused ? "Focused" : "Focus"}</button>
    </div>
    <p class="outcome">${e(item.outcome)}</p>
    <div class="pills">${pills(item)}</div>
    <dl class="facts">
      <div><dt>Target</dt><dd>${e(item.targetWindow.label)}<small>${e(item.targetWindow.start ?? "Unscheduled")} → ${e(item.targetWindow.end ?? "Unscheduled")}</small></dd></div>
      <div><dt>Owner role</dt><dd>${e(item.ownerRole)}</dd></div>
      <div><dt>Dependencies</dt><dd>${item.dependencies.length ? item.dependencies.map(e).join(" · ") : "None"}</dd></div>
      <div><dt>Evidence</dt><dd>${e(item.evidenceCount)} committed reference${item.evidenceCount === 1 ? "" : "s"}</dd></div>
    </dl>
    <details ${focused ? "open" : ""}><summary>Evidence references <span>${e(item.evidenceCount)}</span></summary>
      ${list(item.evidenceReferences, (ref) => `<strong>${e(ref.id)}</strong> <span class="muted">${e(ref.type)}</span><br>${e(ref.summary)}<br><code>${e(ref.path)}</code>`)}
    </details>
    <details ${focused ? "open" : ""}><summary>Risks <span>${e(item.risks.length)}</span></summary>
      ${list(item.risks, (risk) => `<strong>${e(risk.description)}</strong><br><span class="muted">${e(risk.likelihood)} likelihood · ${e(risk.impact)} impact</span><br>Mitigation: ${e(risk.mitigation)}`)}
    </details>
    <details ${focused ? "open" : ""}><summary>Success measures <span>${e(item.successMeasures.length)}</span></summary>
      ${list(item.successMeasures, (measure) => `<strong>${e(measure.metric)}${measure.guardrail ? " · guardrail" : ""}</strong><br>${e(measure.criterion)}<br><code>${e(measure.source)}</code>`)}
    </details>
    <details class="decisions" ${focused ? "open" : ""}><summary>Human decisions <span>${e(item.humanDecisionFlags.length)}</span></summary>
      ${list(item.humanDecisionFlags, (decision) => `<strong>${e(decision.question)}</strong><br><span class="muted">${e(decision.status)} · required ${e(decision.requiredBy)}</span>${list(decision.options, (option) => e(option))}`)}
    </details>
  </article>`;
}

export function renderRoadmap(roadmap, filters = {}) {
  const items = filterInitiatives(roadmap, filters);
  const focusId = filters.focus || null;
  if (focusId) focusInitiative(roadmap, focusId);
  const byHorizon = new Map(roadmap.horizons.map((horizon) => [horizon.id, []]));
  for (const item of items) byHorizon.get(item.horizon)?.push(item);
  const horizons = roadmap.horizons
    .filter((horizon) => filters.horizon === "all" || !filters.horizon || horizon.id === filters.horizon)
    .sort((a, b) => a.order - b.order);
  const focused = focusId ? items.find((item) => item.id === focusId) : null;
  const spotlight = focused ? `<section class="focus-stage" aria-label="Focused initiative">
    <p class="eyebrow">Focused initiative</p>
    ${card(focused, true)}
  </section>` : "";
  const lanes = horizons.map((horizon) => `<section class="lane" aria-labelledby="lane-${e(horizon.id)}">
      <header><div><p class="eyebrow">${e(horizon.id)}</p><h2 id="lane-${e(horizon.id)}">${e(horizon.label)}</h2></div><span class="count">${byHorizon.get(horizon.id).length}</span></header>
      <p class="lane-definition">${e(horizon.definition)}</p>
      <div class="lane-items">${byHorizon.get(horizon.id).map((item) => card(item, item.id === focusId)).join("") || '<p class="empty lane-empty">No matching initiatives</p>'}</div>
    </section>`).join("");
  return `<div class="result-summary" role="status">${items.length} of ${roadmap.initiatives.length} initiatives${focused ? ` · Focused: ${e(focused.title)}` : ""}</div>
    ${spotlight}
    <main class="roadmap">${lanes}</main>`;
}

export function renderShell(roadmap, durablePath, initialFocus = null) {
  const statusOptions = [...new Set(roadmap.initiatives.map((item) => item.status))].sort();
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Roadmap Studio</title>
  <style>
    :root { color-scheme: light dark; }
    * { box-sizing: border-box; }
    body { margin:0; background:var(--background-color-default,#f6f8fa); color:var(--text-color-default,#1f2328); font:var(--text-body-medium,14px)/var(--leading-body-medium,20px) var(--font-sans,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif); }
    button,select { font:inherit; color:inherit; }
    button:focus-visible,select:focus-visible,summary:focus-visible { outline:2px solid var(--color-focus-outline,#0969da); outline-offset:2px; }
    .topbar { position:sticky; top:0; z-index:5; padding:18px clamp(14px,3vw,34px); background:color-mix(in srgb,var(--background-color-default,#fff) 92%,transparent); border-bottom:1px solid var(--border-color-default,#d0d7de); backdrop-filter:blur(14px); }
    .brand { display:flex; justify-content:space-between; gap:18px; align-items:flex-start; }
    .brand h1 { margin:1px 0 4px; font-size:var(--text-title-large,26px); line-height:1.2; letter-spacing:-.03em; }
    .brand p { margin:0; color:var(--text-color-muted,#59636e); }
    .artifact { max-width:42ch; text-align:right; font-family:var(--font-mono,Consolas,monospace); font-size:12px; overflow-wrap:anywhere; }
    .controls { display:grid; grid-template-columns:repeat(3,minmax(140px,1fr)) auto; gap:10px; margin-top:16px; align-items:end; }
    label { display:grid; gap:5px; color:var(--text-color-muted,#59636e); font-size:12px; font-weight:var(--font-weight-semibold,600); }
    select,button { min-height:38px; border:1px solid var(--border-color-default,#d0d7de); border-radius:8px; background:var(--background-color-default,#fff); padding:7px 10px; }
    button { cursor:pointer; font-weight:var(--font-weight-semibold,600); }
    button:hover { background:var(--true-color-blue-muted,#ddf4ff); }
    .result-summary { padding:14px clamp(14px,3vw,34px) 0; color:var(--text-color-muted,#59636e); }
    .roadmap { display:grid; grid-template-columns:repeat(3,minmax(260px,1fr)); gap:16px; padding:14px clamp(14px,3vw,34px) 36px; align-items:start; }
    .focus-stage { width:min(760px,calc(100% - 28px)); margin:16px auto 8px; padding:14px; border-radius:16px; background:color-mix(in srgb,var(--true-color-blue-muted,#ddf4ff) 70%,transparent); }
    .lane { min-width:0; border-top:3px solid var(--true-color-blue,#0969da); }
    .lane:nth-child(2) { border-color:#8250df; }.lane:nth-child(3) { border-color:#bf8700; }
    .lane>header { display:flex; justify-content:space-between; align-items:center; padding:14px 2px 0; }
    h2,h3 { margin:0; line-height:1.25; } h2 { font-size:20px; } h3 { font-size:17px; }
    .eyebrow { margin:0 0 3px; color:var(--text-color-muted,#59636e); text-transform:uppercase; letter-spacing:.08em; font-size:10px; font-weight:700; }
    .count { min-width:28px; padding:3px 8px; border-radius:99px; text-align:center; background:var(--true-color-blue-muted,#ddf4ff); }
    .lane-definition { min-height:60px; color:var(--text-color-muted,#59636e); }
    .lane-items { display:grid; gap:12px; }
    .initiative { position:relative; overflow:hidden; padding:16px; border:1px solid var(--border-color-default,#d0d7de); border-radius:12px; background:var(--background-color-default,#fff); box-shadow:0 1px 2px rgba(31,35,40,.06); }
    .initiative.focused { border:2px solid var(--color-focus-outline,#0969da); box-shadow:0 8px 28px rgba(9,105,218,.18); }
    .initiative.saved-searches { background:linear-gradient(145deg,var(--true-color-blue-muted,#ddf4ff),var(--background-color-default,#fff) 40%); }
    .feature-label { margin:-16px -16px 14px; padding:6px 16px; background:var(--true-color-blue,#0969da); color:var(--color-white,#fff); text-transform:uppercase; font-size:10px; font-weight:700; letter-spacing:.1em; }
    .card-head { display:flex; align-items:flex-start; justify-content:space-between; gap:10px; }
    .focus-button { min-height:30px; padding:4px 8px; font-size:12px; }
    .outcome { color:var(--text-color-muted,#59636e); }
    .pills { display:flex; flex-wrap:wrap; gap:5px; margin:12px 0; }
    .pill { padding:3px 7px; border:1px solid var(--border-color-default,#d0d7de); border-radius:99px; font-size:11px; text-transform:capitalize; }
    .pill.status { border-color:transparent; background:var(--true-color-blue-muted,#ddf4ff); }
    .facts { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin:14px 0; }
    .facts div { min-width:0; }.facts dt { color:var(--text-color-muted,#59636e); font-size:11px; }.facts dd { margin:2px 0; overflow-wrap:anywhere; }.facts small { display:block; color:var(--text-color-muted,#59636e); }
    details { border-top:1px solid var(--border-color-default,#d0d7de); padding-top:9px; margin-top:9px; }
    summary { display:flex; justify-content:space-between; cursor:pointer; font-weight:600; }
    ul { padding-left:19px; } li+li { margin-top:8px; } code { font:var(--text-code-inline,12px) var(--font-mono,Consolas,monospace); overflow-wrap:anywhere; }
    .muted,.empty { color:var(--text-color-muted,#59636e); }.lane-empty { padding:20px;border:1px dashed var(--border-color-default,#d0d7de);border-radius:10px; }
    .notice { display:none; margin-top:10px; padding:8px 10px; border-radius:7px; background:var(--true-color-red-muted,#ffebe9); color:var(--text-color-default,#1f2328); }
    .notice.visible { display:block; }
    @media (max-width:900px) { .roadmap { grid-template-columns:1fr; }.lane-definition { min-height:auto; }.controls { grid-template-columns:1fr 1fr; }.artifact { display:none; } }
    @media (max-width:480px) { .topbar { position:static; }.controls { grid-template-columns:1fr; }.facts { grid-template-columns:1fr; }.brand h1 { font-size:22px; } }
    @media (prefers-reduced-motion:no-preference) { .initiative { transition:border-color .15s,box-shadow .15s,transform .15s; }.initiative:hover { transform:translateY(-1px); } }
  </style>
</head>
<body>
  <header class="topbar">
    <div class="brand"><div><p class="eyebrow">${e(roadmap.metadata.provenance.label)}</p><h1>Roadmap Studio</h1><p>${e(roadmap.metadata.product)} · ${e(roadmap.metadata.title)}</p></div><p class="artifact" title="Durable artifact identity">${e(durablePath)}<br>Updated ${e(roadmap.metadata.updatedAt)}</p></div>
    <form class="controls" id="controls">
      <label>Horizon<select id="horizon"><option value="all">All horizons</option>${roadmap.horizons.sort((a,b)=>a.order-b.order).map((h) => `<option value="${e(h.id)}">${e(h.label)}</option>`).join("")}</select></label>
      <label>Status<select id="status"><option value="all">All statuses</option>${statusOptions.map((status) => `<option value="${e(status)}">${e(status)}</option>`).join("")}</select></label>
      <label>Focus<select id="focus"><option value="" ${initialFocus ? "" : "selected"}>No focus</option>${roadmap.initiatives.map((item) => `<option value="${e(item.id)}" ${item.id === initialFocus ? "selected" : ""}>${e(item.title)}</option>`).join("")}</select></label>
      <button type="button" id="refresh">Refresh file</button>
    </form>
    <div class="notice" id="notice" role="alert"></div>
  </header>
  <div id="content" aria-live="polite"></div>
  <script>
    const controls = ["horizon","status","focus"].map(id => document.getElementById(id));
    const content = document.getElementById("content");
    const notice = document.getElementById("notice");
    function showError(message) { notice.textContent = message; notice.classList.add("visible"); }
    function clearError() { notice.textContent = ""; notice.classList.remove("visible"); }
    async function render() {
      clearError();
      const query = new URLSearchParams({ horizon: controls[0].value, status: controls[1].value, focus: controls[2].value });
      const response = await fetch("/api/render?" + query);
      if (!response.ok) throw new Error((await response.json()).error || "Unable to render roadmap");
      content.innerHTML = await response.text();
      const focusOption = controls[2].selectedOptions[0];
      document.title = focusOption?.value ? "Roadmap Studio · " + focusOption.textContent : "Roadmap Studio";
      content.querySelectorAll("[data-focus]").forEach(button => button.addEventListener("click", async () => {
        const response = await fetch("/api/focus", { method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify({initiativeId:button.dataset.focus}) });
        if (!response.ok) return showError((await response.json()).error);
        controls[2].value = button.dataset.focus;
        render().catch(error => showError(error.message));
      }));
      const focused = controls[2].value && document.getElementById(controls[2].value);
      if (focused) focused.scrollIntoView({ block:"nearest", behavior:"smooth" });
    }
    controls.forEach(control => control.addEventListener("change", () => render().catch(error => showError(error.message))));
    document.getElementById("refresh").addEventListener("click", async () => {
      clearError();
      const response = await fetch("/api/refresh", { method:"POST" });
      if (!response.ok) return showError((await response.json()).error);
      await render();
    });
    render().catch(error => showError(error.message));
  </script>
</body>
</html>`;
}
