/**
 * Shared Gemini API utility
 *
 * - One AbortController per named "slot" (e.g. 'chat', 'onboarding').
 *   Calling callGemini with the same slot while a request is in flight
 *   cancels the previous one before starting the new one.
 * - Detects quota-exceeded (HTTP 429 / RESOURCE_EXHAUSTED) and throws
 *   a QuotaExceededError so callers can show a distinct UI message.
 */

export const GEMINI_MODEL = 'gemini-2.5-flash';

// ─── QUOTA STATE ──────────────────────────────────────────────────────────────
const QUOTA_KEY = 'crunch_quota_exceeded';

export function markQuotaExceeded() {
  sessionStorage.setItem(QUOTA_KEY, '1');
}

export function clearQuotaExceeded() {
  sessionStorage.removeItem(QUOTA_KEY);
}

export function isQuotaExceeded(): boolean {
  return sessionStorage.getItem(QUOTA_KEY) === '1';
}

// ─── ERROR TYPE ───────────────────────────────────────────────────────────────
export class QuotaExceededError extends Error {
  constructor() {
    super(
      'You have exceeded your Gemini API quota. ' +
      'Check your usage at console.cloud.google.com or wait for the quota to reset.'
    );
    this.name = 'QuotaExceededError';
  }
}

// ─── PER-SLOT ABORT CONTROLLERS ───────────────────────────────────────────────
const controllers: Record<string, AbortController> = {};

/**
 * Make a Gemini generateContent call.
 *
 * @param slot   Logical name for this caller ('chat' | 'onboarding').
 *               A second call with the same slot cancels the first.
 * @param body   Full request body (contents, systemInstruction, generationConfig…)
 */
export async function callGemini(slot: string, body: object): Promise<string> {
  const key = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  if (!key) throw new Error('No API key. Add VITE_GEMINI_API_KEY to your .env file and restart.');

  // Cancel any in-flight request for this slot
  if (controllers[slot]) {
    controllers[slot].abort();
  }
  const controller = new AbortController();
  controllers[slot] = controller;

  let res: Response;
  try {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      }
    );
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw new Error('Request cancelled.');
    throw new Error('Network error. Check your connection.');
  } finally {
    // Clean up only if this controller is still the active one
    if (controllers[slot] === controller) delete controllers[slot];
  }

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const status = (errBody as { error?: { status?: string } })?.error?.status;
    if (res.status === 429 || status === 'RESOURCE_EXHAUSTED') {
      markQuotaExceeded();
      throw new QuotaExceededError();
    }
    throw new Error(
      (errBody as { error?: { message?: string } })?.error?.message ||
      `Gemini request failed (${res.status}).`
    );
  }

  clearQuotaExceeded(); // successful call → quota is fine
  const data = await res.json();
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  if (!text) throw new Error('Gemini returned an empty response.');
  return text;
}
