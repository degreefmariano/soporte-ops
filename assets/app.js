(function () {
  "use strict";

  const STORAGE_KEY = "soporte-ops-tickets-v1";
  const state = {
    tickets: loadTickets(),
    filters: { priorities: new Set(), estado: "", search: "" },
    activeTab: "cola",
  };

  function buildSeed() {
    return TICKETS.map((t) => ({
      ...t,
      creado: new Date(Date.now() - t.edadMinutos * 60000).toISOString(),
    }));
  }

  function loadTickets() {
    const seed = buildSeed();
    let saved = {};
    try {
      saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch (e) {}
    const overrides = saved.overrides || {};
    const extra = saved.extra || [];
    seed.forEach((t) => {
      if (overrides[t.id]) Object.assign(t, overrides[t.id]);
    });
    return seed.concat(extra);
  }

  function persist() {
    const seedIds = new Set(TICKETS.map((t) => t.id));
    const overrides = {};
    state.tickets.forEach((t) => {
      if (seedIds.has(t.id)) {
        overrides[t.id] = {
          estado: t.estado,
          causaRaiz: t.causaRaiz,
          solucion: t.solucion,
          prevencion: t.prevencion,
        };
      }
    });
    const extra = state.tickets.filter((t) => !seedIds.has(t.id));
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ overrides, extra }));
    } catch (e) {}
  }

  const PRIORITY_ORDER = { P1: 0, P2: 1, P3: 2, P4: 3 };
  const PRIORITY_COLOR = { P1: "#F5455C", P2: "#FF9F43", P3: "#4FD1C5", P4: "#8C9AAB" };

  function minutesSince(dateStr) {
    return (Date.now() - new Date(dateStr).getTime()) / 60000;
  }

  function slaInfo(ticket) {
    if (ticket.estado === "Resuelto") return { pct: 100, label: "Cumplido", cls: "sla-ok" };
    const limit = SLA_MINUTES[ticket.prioridad];
    const elapsed = minutesSince(ticket.creado);
    const pct = Math.max(0, Math.min(100, 100 - (elapsed / limit) * 100));
    let label, cls;
    if (elapsed > limit) { label = "Vencido"; cls = "sla-over"; }
    else if (elapsed > limit * 0.75) { label = "En riesgo"; cls = "sla-risk"; }
    else { label = "En curso"; cls = "sla-ok"; }
    return { pct, label, cls, elapsed, limit };
  }

  function formatAge(dateStr) {
    const mins = minutesSince(dateStr);
    if (mins < 60) return Math.round(mins) + "m";
    const hrs = mins / 60;
    if (hrs < 24) return Math.round(hrs) + "h";
    return Math.round(hrs / 24) + "d";
  }

  function ringSVG(ticket) {
    const sla = slaInfo(ticket);
    const r = 13, c = 2 * Math.PI * r;
    const color = sla.cls === "sla-over" ? "var(--danger)" : sla.cls === "sla-risk" ? "var(--warn)" : "var(--ok)";
    const offset = c - (sla.pct / 100) * c;
    return `<div class="ring" title="SLA ${Math.round(sla.pct)}% restante">
      <svg width="32" height="32" viewBox="0 0 32 32">
        <circle class="ring-track" cx="16" cy="16" r="${r}"></circle>
        <circle class="ring-progress" cx="16" cy="16" r="${r}" stroke="${color}"
          stroke-dasharray="${c}" stroke-dashoffset="${offset}"></circle>
      </svg>
    </div>`;
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (s) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[s]));
  }

  function applyFilters(list) {
    const { priorities, estado, search } = state.filters;
    return list.filter((t) => {
      if (priorities.size && !priorities.has(t.prioridad)) return false;
      if (estado && t.estado !== estado) return false;
      if (search) {
        const hay = (t.cliente + " " + t.asunto + " " + t.id).toLowerCase();
        if (!hay.includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }

  function sortQueue(list) {
    return [...list].sort((a, b) => {
      const aOver = slaInfo(a).cls === "sla-over" ? 0 : 1;
      const bOver = slaInfo(b).cls === "sla-over" ? 0 : 1;
      if (aOver !== bOver) return aOver - bOver;
      if (PRIORITY_ORDER[a.prioridad] !== PRIORITY_ORDER[b.prioridad]) {
        return PRIORITY_ORDER[a.prioridad] - PRIORITY_ORDER[b.prioridad];
      }
      return new Date(a.creado) - new Date(b.creado);
    });
  }

  function renderSummary() {
    const all = state.tickets;
    const abiertos = all.filter((t) => t.estado !== "Resuelto").length;
    const riesgo = all.filter((t) => slaInfo(t).cls === "sla-risk").length;
    const vencido = all.filter((t) => slaInfo(t).cls === "sla-over").length;
    const resueltos = all.filter((t) => t.estado === "Resuelto").length;
    document.getElementById("sum-abiertos").textContent = abiertos;
    document.getElementById("sum-riesgo").textContent = riesgo;
    document.getElementById("sum-vencido").textContent = vencido;
    document.getElementById("sum-resueltos").textContent = resueltos;

    ["P1", "P2", "P3", "P4"].forEach((p) => {
      const n = all.filter((t) => t.prioridad === p).length;
      const el = document.querySelector(`[data-count-priority="${p}"]`);
      if (el) el.textContent = n;
    });
  }

  function renderQueue() {
    const filtered = sortQueue(applyFilters(state.tickets));
    const table = document.getElementById("queue-table");
    document.getElementById("queue-count").textContent = filtered.length + " tickets";

    if (!filtered.length) {
      table.innerHTML = `<div class="empty-state">No hay tickets que coincidan con estos filtros.</div>`;
      return;
    }

    table.innerHTML = filtered
      .map((t) => {
        const sla = slaInfo(t);
        const estadoCls = "estado-" + t.estado.replace(" ", "-");
        return `<div class="ticket-row" data-ticket-id="${t.id}" role="row">
          ${ringSVG(t)}
          <span class="badge-pri ${t.prioridad}">${t.prioridad}</span>
          <div class="ticket-main">
            <div class="ticket-id">${t.id}</div>
            <div class="ticket-subject">${escapeHtml(t.asunto)}</div>
            <div class="ticket-client">${escapeHtml(t.cliente)} · ${escapeHtml(t.categoria)}</div>
          </div>
          <span class="estado-pill ${estadoCls} col-estado">${t.estado}</span>
          <span class="sla-tag ${sla.cls}">${sla.label}</span>
          <span class="age-tag col-age">${formatAge(t.creado)}</span>
        </div>`;
      })
      .join("");

    table.querySelectorAll(".ticket-row").forEach((row) => {
      row.addEventListener("click", () => openDrawer(row.dataset.ticketId));
    });
  }

  function openDrawer(ticketId) {
    const t = state.tickets.find((x) => x.id === ticketId);
    if (!t) return;
    const sla = slaInfo(t);
    const content = document.getElementById("drawer-content");

    const field = (label, value) =>
      `<div class="dr-section"><h4>${label}</h4><p class="${value ? "" : "is-empty"}">${value ? escapeHtml(value) : "Sin información registrada aún."}</p></div>`;

    const logsHtml = t.logs && t.logs.length
      ? t.logs.map((l) => `<div>${escapeHtml(l)}</div>`).join("")
      : `<div class="is-empty">Sin entradas de log para este ticket.</div>`;

    content.innerHTML = `
      <div class="dr-header">
        <div>
          <div class="dr-id">${t.id}</div>
          <h3 class="dr-subject">${escapeHtml(t.asunto)}</h3>
        </div>
        <button class="dr-close" id="dr-close" aria-label="Cerrar">&times;</button>
      </div>
      <div class="dr-meta">
        <span class="dr-meta-tag badge-pri ${t.prioridad}" style="display:inline">${t.prioridad}</span>
        <span class="dr-meta-tag">${escapeHtml(t.cliente)}</span>
        <span class="dr-meta-tag">${escapeHtml(t.categoria)}</span>
        <span class="dr-meta-tag ${sla.cls}">SLA: ${sla.label}</span>
      </div>
      ${field("Diagnóstico", t.diagnostico)}
      ${field("Causa raíz", t.causaRaiz)}
      ${field("Solución aplicada", t.solucion)}
      ${field("Acciones preventivas", t.prevencion)}
      <div class="dr-section">
        <h4>Logs relevantes</h4>
        <div class="log-console">${logsHtml}</div>
      </div>
      <div class="dr-actions">
        <button class="btn" id="dr-escalate">Escalar a Nivel 3</button>
        <button class="btn btn-primary" id="dr-resolve">${t.estado === "Resuelto" ? "Reabrir" : "Marcar resuelto"}</button>
      </div>
    `;

    document.getElementById("dr-close").addEventListener("click", closeDrawer);
    document.getElementById("dr-escalate").addEventListener("click", () => {
      t.estado = "Escalado";
      persist();
      renderAll();
      openDrawer(t.id);
    });
    document.getElementById("dr-resolve").addEventListener("click", () => {
      t.estado = t.estado === "Resuelto" ? "Abierto" : "Resuelto";
      persist();
      renderAll();
      openDrawer(t.id);
    });

    document.getElementById("drawer-overlay").classList.add("is-open");
  }

  function closeDrawer() {
    document.getElementById("drawer-overlay").classList.remove("is-open");
  }

  function renderKB(query) {
    const grid = document.getElementById("kb-grid");
    const q = (query || "").toLowerCase();
    const filtered = KB_ARTICLES.filter(
      (a) => !q || (a.title + a.category + a.summary).toLowerCase().includes(q)
    );
    if (!filtered.length) {
      grid.innerHTML = `<div class="empty-state">No se encontraron artículos para esa búsqueda.</div>`;
      return;
    }
    grid.innerHTML = filtered
      .map(
        (a) => `<div class="kb-card">
          <div class="kb-card-top">
            <span class="kb-id">${a.id}</span>
            <span class="kb-cat">${escapeHtml(a.category)}</span>
          </div>
          <h3 class="kb-title">${escapeHtml(a.title)}</h3>
          <p class="kb-summary">${escapeHtml(a.summary)}</p>
          <div class="kb-updated">Actualizado ${a.updated}</div>
        </div>`
      )
      .join("");
  }

  let chartPriority, chartCategory;

  function renderTrends() {
    const all = state.tickets;
    document.getElementById("m-total").textContent = all.length;

    const resolved = all.filter((t) => t.estado === "Resuelto");
    document.getElementById("m-sla").textContent =
      all.length ? Math.round((all.filter((t) => slaInfo(t).cls !== "sla-over").length / all.length) * 100) + "%" : "—";

    const catCounts = {};
    all.forEach((t) => { catCounts[t.categoria] = (catCounts[t.categoria] || 0) + 1; });
    const topCat = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0];
    document.getElementById("m-top-cat").textContent = topCat ? `${topCat[0]} (${topCat[1]})` : "—";

    document.getElementById("m-mttr").textContent = "3h 40m";

    const priCounts = { P1: 0, P2: 0, P3: 0, P4: 0 };
    all.forEach((t) => { priCounts[t.prioridad]++; });

    if (window.Chart) {
      const ctx1 = document.getElementById("chart-priority");
      if (chartPriority) chartPriority.destroy();
      chartPriority = new Chart(ctx1, {
        type: "doughnut",
        data: {
          labels: Object.keys(priCounts),
          datasets: [{
            data: Object.values(priCounts),
            backgroundColor: Object.keys(priCounts).map((p) => PRIORITY_COLOR[p]),
            borderWidth: 0,
          }],
        },
        options: {
          plugins: { legend: { position: "bottom", labels: { color: "#93A1B0", boxWidth: 10, font: { size: 11 } } } },
          cutout: "62%",
        },
      });

      const sortedCats = Object.entries(catCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);
      const ctx2 = document.getElementById("chart-category");
      if (chartCategory) chartCategory.destroy();
      chartCategory = new Chart(ctx2, {
        type: "bar",
        data: {
          labels: sortedCats.map((c) => c[0]),
          datasets: [{ data: sortedCats.map((c) => c[1]), backgroundColor: "#5B8DEF", borderRadius: 4 }],
        },
        options: {
          indexAxis: "y",
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { color: "#5C6B7A", font: { size: 11 } }, grid: { color: "#1C2430" } },
            y: { ticks: { color: "#93A1B0", font: { size: 11 } }, grid: { display: false } },
          },
        },
      });
    }
  }

  function renderAll() {
    renderSummary();
    renderQueue();
    if (state.activeTab === "tendencias") renderTrends();
  }

  function switchTab(name) {
    state.activeTab = name;
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.toggle("is-active", b.dataset.tabTarget === name));
    document.querySelectorAll(".view").forEach((v) => { v.hidden = v.dataset.view !== name; });
    if (name === "tendencias") renderTrends();
    if (name === "conocimiento") renderKB(document.getElementById("kb-search").value);
  }

  function init() {
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => switchTab(btn.dataset.tabTarget));
    });

    document.querySelectorAll("#filter-priority .chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        const p = chip.dataset.priority;
        if (state.filters.priorities.has(p)) state.filters.priorities.delete(p);
        else state.filters.priorities.add(p);
        chip.classList.toggle("is-active");
        renderQueue();
      });
    });

    document.getElementById("filter-estado").addEventListener("change", (e) => {
      state.filters.estado = e.target.value;
      renderQueue();
    });

    document.getElementById("filter-search").addEventListener("input", (e) => {
      state.filters.search = e.target.value;
      renderQueue();
    });

    document.getElementById("kb-search").addEventListener("input", (e) => renderKB(e.target.value));

    document.getElementById("drawer-overlay").addEventListener("click", (e) => {
      if (e.target.id === "drawer-overlay") closeDrawer();
    });

    const modalOverlay = document.getElementById("modal-overlay");
    document.getElementById("btn-new-ticket").addEventListener("click", () => modalOverlay.classList.add("is-open"));
    document.getElementById("btn-cancel-new").addEventListener("click", () => modalOverlay.classList.remove("is-open"));
    modalOverlay.addEventListener("click", (e) => { if (e.target.id === "modal-overlay") modalOverlay.classList.remove("is-open"); });

    document.getElementById("form-new-ticket").addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const id = "TCK-" + Math.floor(4000 + Math.random() * 999);
      state.tickets.unshift({
        id,
        cliente: fd.get("cliente"),
        asunto: fd.get("asunto"),
        categoria: fd.get("categoria"),
        prioridad: fd.get("prioridad"),
        estado: "Abierto",
        creado: new Date().toISOString(),
        diagnostico: fd.get("diagnostico") || "",
        causaRaiz: "",
        solucion: "",
        prevencion: "",
        logs: [],
      });
      persist();
      e.target.reset();
      modalOverlay.classList.remove("is-open");
      renderAll();
    });

    renderAll();
    renderKB("");
  }

  document.addEventListener("DOMContentLoaded", init);
})();
