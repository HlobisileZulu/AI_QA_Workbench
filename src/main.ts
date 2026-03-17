// ============================================================
// main.ts — App entry point & event wiring
// ============================================================
// This file is the "glue". It:
//   1. Waits for the page to load
//   2. Attaches event listeners to buttons/inputs
//   3. Calls api.ts when the user runs a test
//   4. Calls state.ts to save data
//   5. Calls ui.ts to re-render the page
//
// Notice: no business logic lives here — it just coordinates
// between the other modules.
// ============================================================

import { callModel } from "./api";
import {
  setApiKey,
  getApiKey,
  addResult,
  removeResult,
  getResults,
  addBug,
  toggleBugStatus,
  getBugs,
} from "./state";
import {
  el,
  updateApiStatus,
  switchTab,
  showLoadingState,
  showEvalSection,
  resetEvalForm,
  renderStars,
  renderResults,
  renderBugs,
  renderFeedback,
  showBugForm,
  hideBugForm,
} from "./ui";
import { TestResult, Bug, Verdict, Severity } from "./types";

// ── App state (UI-only, not persisted) ───────────────────────
// These two variables track what's "in flight" — the current
// test being evaluated and the current star rating.
let currentTest: Omit<TestResult, "id" | "verdict" | "notes" | "rating"> | null = null;
// Omit<T, K> is a TypeScript utility type — it creates a new
// type that is T but with keys K removed. Here we use it to
// represent a test that hasn't been evaluated yet.

let starRating = 0;

// ── Initialise ────────────────────────────────────────────────
// DOMContentLoaded fires when HTML is parsed and ready.
// We wait for it so our getElementById calls don't fail.
document.addEventListener("DOMContentLoaded", () => {
  bindApiKey();
  bindTabs();
  bindTestRunner();
  bindEvaluation();
  bindBugTracker();
});

// ── API key bar ───────────────────────────────────────────────
function bindApiKey(): void {
  const input = el<HTMLInputElement>("api-key-input");
  input.addEventListener("input", () => {
    const key = input.value.trim();
    setApiKey(key);
    updateApiStatus(key);
  });
}

// ── Tab navigation ────────────────────────────────────────────
function bindTabs(): void {
  // querySelectorAll returns a NodeList — we spread it to an
  // array so we can use .forEach on it comfortably.
  const tabs = [...document.querySelectorAll<HTMLElement>(".tab")];
  const names = ["test", "results", "bugs", "feedback"];

  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => {
      switchTab(names[i]);
      // Re-render the active tab's content when switching to it
      if (names[i] === "results") renderResults(getResults(), handleDeleteResult);
      if (names[i] === "bugs") renderBugs(getBugs(), handleToggleBug);
      if (names[i] === "feedback") renderFeedback(getResults());
    });
  });
}

// ── Test runner ───────────────────────────────────────────────
function bindTestRunner(): void {
  el("run-btn").addEventListener("click", handleRunTest);
}

async function handleRunTest(): Promise<void> {
  const promptInput = el<HTMLTextAreaElement>("prompt-input");
  const modelSelect = el<HTMLSelectElement>("model-select");
  const categorySelect = el<HTMLSelectElement>("category-select");

  const prompt = promptInput.value.trim();
  if (!prompt) {
    promptInput.focus();
    return; // Don't run if prompt is empty
  }

  showLoadingState();

  // Destructuring assignment — pull named fields from the
  // returned object in one line.
  const { response, elapsed } = await callModel(
    prompt,
    modelSelect.value,
    getApiKey()
  );

  // Store the current test so the eval form can reference it
  currentTest = {
    prompt,
    model: modelSelect.options[modelSelect.selectedIndex].text,
    modelValue: modelSelect.value,
    category: categorySelect.value,
    aiResponse: response,
    elapsed,
    timestamp: new Date().toLocaleTimeString(),
  };

  showEvalSection(response, elapsed);
  resetEvalForm();
  starRating = 0;
}

// ── Evaluation form ───────────────────────────────────────────
function bindEvaluation(): void {
  // Star rating — clicking a star sets the rating
  document.querySelectorAll<HTMLElement>(".star").forEach((star) => {
    star.addEventListener("click", () => {
      const val = parseInt(star.dataset["v"] ?? "0");
      starRating = val;
      renderStars(val);
    });
  });

  el("save-result-btn").addEventListener("click", handleSaveResult);
  el("log-bug-btn").addEventListener("click", handleLogBugFromTest);
}

function handleSaveResult(): void {
  if (!currentTest) return;

  const verdict = (el<HTMLSelectElement>("verdict-select").value) as Verdict;
  const notes = (el<HTMLTextAreaElement>("eval-notes").value).trim();

  // Build the full TestResult object
  const result: TestResult = {
    ...currentTest,        // Spread all fields from currentTest
    id: Date.now(),        // Simple unique ID using timestamp
    verdict,
    rating: starRating,
    notes,
  };

  addResult(result);
  currentTest = null;
  el("eval-section").style.display = "none";
  (el<HTMLTextAreaElement>("prompt-input")).value = "";

  // Switch to results tab and re-render
  switchTab("results");
  renderResults(getResults(), handleDeleteResult);
}

function handleLogBugFromTest(): void {
  if (!currentTest) return;
  switchTab("bugs");
  renderBugs(getBugs(), handleToggleBug);
  showBugForm({
    title: `Issue with: ${currentTest.prompt.slice(0, 60)}`,
    desc: `Model: ${currentTest.model}\nCategory: ${currentTest.category}\n\nPrompt:\n${currentTest.prompt}\n\nResponse:\n${currentTest.aiResponse}`,
  });
}

function handleDeleteResult(id: number): void {
  removeResult(id);
  renderResults(getResults(), handleDeleteResult);
}

// ── Bug tracker ───────────────────────────────────────────────
function bindBugTracker(): void {
  el("add-bug-btn").addEventListener("click", () => showBugForm());
  el("cancel-bug-btn").addEventListener("click", hideBugForm);
  el("save-bug-btn").addEventListener("click", handleSaveBug);
}

function handleSaveBug(): void {
  const title = (el<HTMLInputElement>("bug-title").value).trim();
  if (!title) {
    el("bug-title").focus();
    return;
  }

  const bug: Bug = {
    id: Date.now(),
    title,
    severity: (el<HTMLSelectElement>("bug-severity").value) as Severity,
    description: (el<HTMLTextAreaElement>("bug-desc").value).trim(),
    status: "open",
    timestamp: new Date().toLocaleTimeString(),
  };

  addBug(bug);
  hideBugForm();
  renderBugs(getBugs(), handleToggleBug);
}

function handleToggleBug(id: number): void {
  toggleBugStatus(id);
  renderBugs(getBugs(), handleToggleBug);
}
