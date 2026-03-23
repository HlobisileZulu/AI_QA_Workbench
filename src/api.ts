// ============================================================
// api.ts — Handles all communication with AI model APIs
// ============================================================
// Supports:
//   - Google Gemini (free tier — no credit card needed)
//   - Anthropic Claude (paid — sk-ant- key)
//   - Mock models (no key needed — for exploring the UI)
// ============================================================

// ── Response type shapes from each API ───────────────────────

interface GeminiResponse {
  candidates?: Array<{
    content: { parts: Array<{ text: string }> };
  }>;
  error?: { message: string; code: number };
}

interface AnthropicResponse {
  content: Array<{ type: string; text?: string }>;
  error?: { message: string };
}

// ── Mock responses — no API key needed ───────────────────────
const MOCK_RESPONSES: Record<string, string> = {
  "mock-gpt4o":
    "[Mock: GPT-4o] This is a simulated response. Select a Gemini model and paste your free API key from aistudio.google.com to get live responses.",
  "mock-claude":
    "[Mock: Claude] This is a simulated response. Select a Gemini model and paste your free API key from aistudio.google.com to get live responses.",
};

// ── Detect which API to use based on the model value ─────────
function getApiType(modelValue: string): "gemini" | "anthropic" | "mock" {
  if (modelValue.startsWith("mock-")) return "mock";
  if (modelValue.startsWith("gemini-")) return "gemini";
  if (modelValue.startsWith("claude-")) return "anthropic";
  return "mock";
}

// ── Validate API key format before calling ───────────────────
function validateKey(modelValue: string, apiKey: string): string | null {
  const type = getApiType(modelValue);
  if (type === "mock") return null;

  if (!apiKey || apiKey.trim().length < 10) {
    if (type === "gemini") {
      return "No API key found. Go to aistudio.google.com, sign in with your Google account, click Get API key, copy it, and paste it in the bar above. It is completely free — no credit card needed.";
    }
    return "No Anthropic API key found. Paste your sk-ant- key in the bar above.";
  }

  if (type === "anthropic" && !apiKey.startsWith("sk-ant-")) {
    return "That does not look like an Anthropic key (should start with sk-ant-). For a free option, select a Gemini model and get a free key from aistudio.google.com.";
  }

  return null;
}

// ── Main exported function ────────────────────────────────────
export async function callModel(
  prompt: string,
  modelValue: string,
  apiKey: string
): Promise<{ response: string; elapsed: string }> {
  const startTime = Date.now();
  const apiType = getApiType(modelValue);

  // Mock models — no API call needed
  if (apiType === "mock") {
    await delay(700);
    return {
      response:
        MOCK_RESPONSES[modelValue] ??
        "[Mock response] Select a Gemini model and paste your free API key from aistudio.google.com to run live tests.",
      elapsed: formatElapsed(startTime),
    };
  }

  // Validate key before making a real call
  const keyError = validateKey(modelValue, apiKey);
  if (keyError) return { response: keyError, elapsed: "0s" };

  if (apiType === "gemini") {
    return callGemini(prompt, modelValue, apiKey.trim(), startTime);
  }

  if (apiType === "anthropic") {
    return callAnthropic(prompt, modelValue, apiKey.trim(), startTime);
  }

  return { response: "Unknown model type.", elapsed: "0s" };
}

// ── Gemini implementation ─────────────────────────────────────
// Free tier — get your key at aistudio.google.com
// No credit card required. Limits: 15 requests/minute, 1500/day
async function callGemini(
  prompt: string,
  modelValue: string,
  apiKey: string,
  startTime: number
): Promise<{ response: string; elapsed: string }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelValue}:generateContent`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Gemini uses x-goog-api-key header, not a query param
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        systemInstruction: {
          parts: [
            {
              text: "You are an AI model being tested by a QA tester. Answer the prompt directly and helpfully.",
            },
          ],
        },
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.7,
        },
      }),
    });

    const data = (await res.json()) as GeminiResponse;

    if (data.error) {
      // Model name is wrong or not available
      if (data.error.code === 404) {
        return {
          response:
            "Model not found. Try selecting 'Gemini 2.5 Flash' from the dropdown — it is the most reliable free option right now.",
          elapsed: formatElapsed(startTime),
        };
      }
      // API key is wrong
      if (data.error.code === 400 || data.error.code === 401 || data.error.code === 403) {
        return {
          response:
            "API key problem: " + data.error.message + "\n\nDouble-check you copied the full key from aistudio.google.com and pasted it correctly.",
          elapsed: formatElapsed(startTime),
        };
      }
      // Hit the free tier rate limit
      if (data.error.code === 429) {
        return {
          response:
            "Rate limit reached — the free Gemini tier allows 15 requests per minute. Please wait 60 seconds and try again.\n\nThis is not an error with your key or the app. It is a Google limit on free accounts. If you need more requests, you can upgrade at aistudio.google.com.",
          elapsed: formatElapsed(startTime),
        };
      }
      // Any other error — show the raw message so it is debuggable
      return {
        response: `Gemini error (${data.error.code}): ${data.error.message}`,
        elapsed: formatElapsed(startTime),
      };
    }

    const text =
      data.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ??
      "No response returned from Gemini.";

    return { response: text, elapsed: formatElapsed(startTime) };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      response: `Network error: ${message}. Check your internet connection and try again.`,
      elapsed: formatElapsed(startTime),
    };
  }
}

// ── Anthropic implementation ──────────────────────────────────
async function callAnthropic(
  prompt: string,
  modelValue: string,
  apiKey: string,
  startTime: number
): Promise<{ response: string; elapsed: string }> {
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: modelValue,
        max_tokens: 1000,
        system:
          "You are an AI model being tested by a QA tester. Answer the prompt directly and helpfully.",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = (await res.json()) as AnthropicResponse;

    if (data.error) {
      return {
        response: `Anthropic error: ${data.error.message}`,
        elapsed: formatElapsed(startTime),
      };
    }

    const text = data.content
      .filter((b) => b.type === "text")
      .map((b) => b.text ?? "")
      .join("");

    return { response: text, elapsed: formatElapsed(startTime) };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      response: `Network error: ${message}`,
      elapsed: formatElapsed(startTime),
    };
  }
}

// ── Helpers ───────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatElapsed(startTime: number): string {
  return ((Date.now() - startTime) / 1000).toFixed(1) + "s";
}
