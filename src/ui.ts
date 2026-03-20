// ============================================================
// ui.ts — DOM rendering functions
// ============================================================
// Every function here takes data and updates the page.
// None of them store state — they just read from state.ts
// and paint the HTML. This separation (logic vs. display)
// is called the "separation of concerns" principle.
// ============================================================

import { TestResult, Bug, Verdict, BugStatus, Severity } from "./types";
import { computeMetrics, getBugs } from "./state";

// ── Helper: safely get a DOM element by ID ───────────────────
// Instead of typing "as HTMLElement" everywhere, this helper
// throws a clear error if the element is missing. Much easier
// to debug than a silent null crash.
export function el<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Element #${id} not found in DOM`);
  return element as T;
}

// ── API key status bar ────────────────────────────────────────

export function updateApiStatus(key: string): void {
  const dot = el("api-dot");
  const label = el("api-label");
  const notice = el("no-key-notice");

  // Accept Gemini keys (any reasonable length) or Anthropic keys (sk-ant-)
  const isGemini = key.length > 20 && !key.startsWith("sk-ant-");
  const isAnthropic = key.startsWith("sk-ant-") && key.length > 20;
  const isValid = isGemini || isAnthropic;
  const hasInput = key.length > 0;

  dot.className = "api-status" + (isValid ? " ok" : hasInput ? " err" : "");
  label.textContent = isValid
    ? isGemini ? "Gemini key ready" : "Anthropic key ready"
    : hasInput
    ? "Key too short — check you copied the full key"
    : "No key — get a free one at aistudio.google.com";
  notice.style.display = isValid ? "none" : "block";
}

// ── Tab switching ─────────────────────────────────────────────

export function switchTab(name: string): void {
  const tabNames = ["test", "results", "bugs", "feedback"];
  document.querySelectorAll(".tab").forEach((tab, i) => {
    tab.classList.toggle("active", tabNames[i] === name);
  });
  document.querySelectorAll<HTMLElement>(".view").forEach((view) => {
    view.classList.remove("active");
  });
  el(name === "test" ? "view-test" : `view-${name}`).classList.add("active");
}

// ── Test runner UI ────────────────────────────────────────────

export function showLoadingState(): void {
  el("run-btn").innerHTML =
    '<span class="spinner"></span>Running...';
  (el("run-btn") as HTMLButtonElement).disabled = true;
  el("eval-section").style.display = "none";
}

export function showEvalSection(response: string, elapsed: string): void {
  el("ai-response-box").textContent = response;
  el("resp-time").textContent = elapsed;
  el("eval-section").style.display = "block";
  el("run-btn").innerHTML = "Run test";
  (el("run-btn") as HTMLButtonElement).disabled = false;
}

export function resetEvalForm(): void {
  (el("eval-notes") as HTMLTextAreaElement).value = "";
  (el("verdict-select") as HTMLSelectElement).value = "pass";
  document.querySelectorAll(".star").forEach((s) => s.classList.remove("on"));
}

export function renderStars(rating: number): void {
  document.querySelectorAll<HTMLElement>(".star").forEach((star) => {
    const val = parseInt(star.dataset["v"] ?? "0");
    star.classList.toggle("on", val <= rating);
  });
}

// ── Results list ──────────────────────────────────────────────

export function renderResults(
  results: TestResult[],
  onDelete: (id: number) => void
): void {
  const list = el("results-list");

  if (results.length === 0) {
    list.innerHTML =
      '<div class="empty">No tests run yet. Go to Test runner to start.</div>';
    renderMetrics();
    return;
  }

  // We build the HTML as a string and set it all at once —
  // faster than creating DOM nodes one by one.
  list.innerHTML = results
    .map(
      (r) => `
    <div class="result-row">
      <div style="flex:1;min-width:0">
        <div class="result-prompt">${escapeHtml(r.prompt)}</div>
        <div class="result-meta">
          ${escapeHtml(r.model)} · ${escapeHtml(r.category)} · ${r.timestamp} · ${r.elapsed}
          ${r.rating > 0 ? " · " + "★".repeat(r.rating) : ""}
        </div>
        ${r.notes ? `<div class="result-note">${escapeHtml(r.notes)}</div>` : ""}
      </div>
      <div style="display:flex;gap:6px;align-items:center;flex-shrink:0">
        <span class="badge badge-${r.verdict}">${r.verdict}</span>
        <button class="btn-small" data-delete-id="${r.id}">remove</button>
      </div>
    </div>`
    )
    .join("");

  // Attach delete button listeners
  // We use event delegation: one listener on the parent
  // instead of one per button — more efficient.
  list.querySelectorAll<HTMLButtonElement>("[data-delete-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = parseInt(btn.dataset["deleteId"] ?? "0");
      onDelete(id);
    });
  });

  renderMetrics();
}

export function renderMetrics(): void {
  const m = computeMetrics();
  el("m-total").textContent = String(m.total);
  el("m-pass").textContent = String(m.passed);
  el("m-fail").textContent = String(m.failed);
  el("m-avg").textContent =
    m.avgRating !== null ? m.avgRating.toFixed(1) : "—";
}

// ── Bug tracker ───────────────────────────────────────────────

export function showBugForm(prefill?: { title: string; desc: string }): void {
  if (prefill) {
    (el("bug-title") as HTMLInputElement).value = prefill.title;
    (el("bug-desc") as HTMLTextAreaElement).value = prefill.desc;
  }
  el("bug-form-wrap").style.display = "block";
}

export function hideBugForm(): void {
  el("bug-form-wrap").style.display = "none";
  (el("bug-title") as HTMLInputElement).value = "";
  (el("bug-desc") as HTMLTextAreaElement).value = "";
}

export function renderBugs(
  bugs: Bug[],
  onToggle: (id: number) => void
): void {
  const list = el("bug-list");

  if (bugs.length === 0) {
    list.innerHTML = '<div class="empty">No bugs logged yet.</div>';
    return;
  }

  list.innerHTML = bugs
    .map(
      (b) => `
    <div class="bug-row">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <span class="bug-title">${escapeHtml(b.title)}</span>
          <span class="badge sev-${b.severity}" style="margin-left:8px">${b.severity}</span>
          <span class="badge badge-${b.status}" style="margin-left:4px">${b.status}</span>
        </div>
        <button class="btn-small" data-toggle-id="${b.id}">
          ${b.status === "open" ? "Mark closed" : "Reopen"}
        </button>
      </div>
      ${b.description ? `<div class="bug-meta" style="margin-top:6px;white-space:pre-wrap">${escapeHtml(b.description)}</div>` : ""}
      <div class="bug-meta" style="margin-top:4px">${b.timestamp}</div>
    </div>`
    )
    .join("");

  list.querySelectorAll<HTMLButtonElement>("[data-toggle-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = parseInt(btn.dataset["toggleId"] ?? "0");
      onToggle(id);
    });
  });
}

// ── Feedback analysis ─────────────────────────────────────────

export function renderFeedback(results: TestResult[]): void {
  const m = computeMetrics();
  const bugs = getBugs();

  el("f-total").textContent = String(m.total);
  el("f-pass-pct").textContent =
    m.passRate !== null ? Math.round(m.passRate) + "%" : "—";
  el("f-avg-rat").textContent =
    m.avgRating !== null ? m.avgRating.toFixed(1) : "—";
  el("f-bugs").textContent = String(
    bugs.filter((b) => b.status === "open").length
  );

  const withNotes = results.filter((r) => r.notes);
  const fl = el("feedback-list");
  fl.innerHTML = withNotes.length
    ? withNotes
        .map(
          (r) => `
      <div class="feedback-item">
        <div class="result-prompt">${escapeHtml(r.prompt.slice(0, 80))}${r.prompt.length > 80 ? "…" : ""}</div>
        <div class="result-meta">
          ${escapeHtml(r.model)} ·
          <span class="badge badge-${r.verdict}">${r.verdict}</span>
          ${r.rating > 0 ? " · " + "★".repeat(r.rating) : ""}
        </div>
        <div style="font-size:13px;margin-top:4px">${escapeHtml(r.notes)}</div>
      </div>`
        )
        .join("")
    : '<div class="empty">Add notes when saving test results — they\'ll appear here.</div>';

  // Severity breakdown
  const sl = el("bug-severity-summary");
  if (!bugs.length) {
    sl.innerHTML = '<div class="empty">No bugs logged yet.</div>';
    return;
  }
  const count = (s: Severity) => bugs.filter((b) => b.severity === s).length;
  sl.innerHTML = `
    <div class="metric-grid">
      <div class="metric"><div class="metric-val sev-high-val">${count("high")}</div><div class="metric-label">High</div></div>
      <div class="metric"><div class="metric-val sev-med-val">${count("med")}</div><div class="metric-label">Medium</div></div>
      <div class="metric"><div class="metric-val sev-low-val">${count("low")}</div><div class="metric-label">Low</div></div>
      <div class="metric"><div class="metric-val">${bugs.filter((b) => b.status === "open").length}</div><div class="metric-label">Open total</div></div>
    </div>`;
}

// ── Security helper ───────────────────────────────────────────
// ALWAYS escape user input before inserting into HTML.
// Without this, a prompt like <script>alert('xss')</script>
// would execute as real JavaScript — a security vulnerability.
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
