const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const GROQ_KEY   = import.meta.env.VITE_GROQ_API_KEY   as string | undefined;
const GEMINI_MODEL = 'gemini-2.5-flash';
const GROQ_MODEL   = 'llama-3.3-70b-versatile';

// ─── SHARED UTILITY ───────────────────────────────────────────────────────────
export class QuotaExceededError extends Error {
  constructor() { super('Gemini API quota exceeded.'); }
}

// Internal: call Groq with a plain text prompt, returns text
async function callGroqText(prompt: string, maxTokens = 8192): Promise<string> {
  if (!GROQ_KEY) throw new Error('VITE_GROQ_API_KEY not set.');
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_KEY}` },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: maxTokens,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Groq request failed (${res.status})`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

// Internal: check if a Gemini body contains image data (multimodal — Groq can't handle this)
function hasImageData(body: object): boolean {
  const str = JSON.stringify(body);
  return str.includes('"inlineData"');
}

// Extract text prompt from a Gemini-format body
function extractTextFromGeminiBody(body: object): string {
  const b = body as { contents?: { parts?: { text?: string }[] }[] };
  return b.contents?.flatMap(c => c.parts ?? []).map(p => p.text ?? '').join('\n') ?? '';
}

export async function callGemini(
  _tag: string,
  body: object
): Promise<string> {
  // Try Gemini first
  if (GEMINI_KEY) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
      );
      if (res.status === 429) throw new QuotaExceededError();
      if (res.ok) {
        const data = await res.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      }
    } catch (e) {
      // If image data is involved (OCR), can't fall back to Groq — rethrow
      if (hasImageData(body)) throw e;
      // Otherwise fall through to Groq
      console.warn('[Gemini] failed, trying Groq:', (e as Error).message);
    }
  }

  // Groq fallback (text-only)
  if (hasImageData(body)) throw new Error('Gemini API unavailable and Groq cannot process images.');
  const prompt = extractTextFromGeminiBody(body);
  return callGroqText(prompt);
}

export interface CrisisAction {
  text: string;
  detail: string;
  urgent: boolean;
}

export interface CrisisRecommendation {
  title: string;
  saving: string;
  detail: string;
  category: 'medical' | 'financial' | 'housing' | 'general';
}

export interface SurvivalOptimization {
  action: string;
  impact: string;
  items: string[];
}

export interface FinancialImpactData {
  estimatedCostMin: number;
  estimatedCostMax: number;
  insuranceCoveragePercent: number;
  outOfPocket: number;
}

export interface CrisisAIResponse {
  crisisTitle: string;
  immediateActions: CrisisAction[];
  smartRecommendations: CrisisRecommendation[];
  financialImpact: FinancialImpactData;
  runoutMonths: number;
  survivalPlan: SurvivalOptimization[];
  extendedRunwayMonths: number;
}

interface UserContext {
  savings: number;
  monthlyExpenses: number;
  avgMonthlyIncome: number;
  runwayDays: number;
  hasInsurance: boolean;
  workType: string;
}

async function callTextModel(prompt: string): Promise<string> {
  // Try Gemini first
  if (GEMINI_KEY) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 8192 },
          }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        if (text) return text;
      }
      console.warn('[Gemini] text call failed, trying Groq');
    } catch (e) {
      console.warn('[Gemini] text call error, trying Groq:', (e as Error).message);
    }
  }
  // Groq fallback
  return callGroqText(prompt);
}

export async function analyzeCrisis(
  description: string,
  userCtx: UserContext | null
): Promise<CrisisAIResponse> {
  if (!GEMINI_KEY && !GROQ_KEY) throw new Error('No AI API key set. Add VITE_GEMINI_API_KEY or VITE_GROQ_API_KEY to your .env file.');

  const financialContext = userCtx
    ? `User's financial situation:
- Savings: $${userCtx.savings.toLocaleString()}
- Monthly expenses: $${userCtx.monthlyExpenses.toLocaleString()}
- Average monthly income: $${userCtx.avgMonthlyIncome.toLocaleString()}
- Current cash runway: ${userCtx.runwayDays} days (${(userCtx.runwayDays / 30).toFixed(1)} months)
- Has insurance: ${userCtx.hasInsurance ? 'Yes' : 'No'}
- Work type: ${userCtx.workType}`
    : 'No financial data — use typical estimates for a gig worker.';

  const prompt = `You are a financial crisis advisor AI for gig workers. A user is facing this situation: "${description}"

${financialContext}

Respond with ONLY a valid JSON object (no markdown, no code blocks, no explanation) in this exact structure:
{
  "crisisTitle": "Short descriptive title (max 5 words)",
  "immediateActions": [
    { "text": "First urgent action", "detail": "Specific contact info or location detail", "urgent": true },
    { "text": "Second urgent action", "detail": "Specific helpful detail", "urgent": true },
    { "text": "Third action", "detail": "Helpful context", "urgent": false },
    { "text": "Fourth action", "detail": "Helpful context", "urgent": false }
  ],
  "smartRecommendations": [
    { "title": "Cost-saving tip", "saving": "$X or X%", "detail": "One clear sentence", "category": "medical" },
    { "title": "Financial move", "saving": "$X or X%", "detail": "One clear sentence", "category": "financial" },
    { "title": "Practical action", "saving": "$X/mo", "detail": "One clear sentence", "category": "general" },
    { "title": "Resource or aid", "saving": "Up to X%", "detail": "One clear sentence", "category": "housing" }
  ],
  "financialImpact": {
    "estimatedCostMin": 0,
    "estimatedCostMax": 0,
    "insuranceCoveragePercent": 0,
    "outOfPocket": 0
  },
  "runoutMonths": 0.0,
  "survivalPlan": [
    { "action": "Strategy 1", "impact": "+X.X months", "items": ["Step 1", "Step 2", "Step 3"] },
    { "action": "Strategy 2", "impact": "+X.X months", "items": ["Step 1", "Step 2", "Step 3"] },
    { "action": "Strategy 3", "impact": "+X.X months", "items": ["Step 1", "Step 2", "Step 3"] }
  ],
  "extendedRunwayMonths": 0.0
}

Rules:
- Exactly 4 immediateActions: first 2 urgent true, last 2 urgent false
- Exactly 4 smartRecommendations with these categories in order: medical, financial, general, housing
- Exactly 3 survivalPlan items
- Use the user's actual savings and expenses to compute realistic runoutMonths and outOfPocket
- extendedRunwayMonths = runoutMonths + sum of all survival plan impacts
- Return ONLY the JSON, nothing else`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 8192 },
      }),
    }
  );

  if (!res.ok) {
    // Gemini failed — fall back to Groq
    console.warn('[Gemini] analyzeCrisis failed, trying Groq');
    const groqText = await callGroqText(prompt, 8192);
    const match = groqText.match(/\{[\s\S]*\}/);
    if (!match) throw new Error(`Groq response unparseable. Raw: ${groqText.slice(0, 200)}`);
    return JSON.parse(match[0]) as CrisisAIResponse;
  }

  const data = await res.json();
  const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  if (!text) throw new Error('No response from Gemini.');

  // Extract JSON — handles markdown code blocks and any surrounding text
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`Could not parse AI response. Raw: ${text.slice(0, 200)}`);

  try {
    return JSON.parse(jsonMatch[0]) as CrisisAIResponse;
  } catch {
    throw new Error(`JSON parse failed. Raw: ${jsonMatch[0].slice(0, 200)}`);
  }
}

// ─── FOLLOW-UP CHAT ───────────────────────────────────────────────────────────
export async function streamCrisisChat(
  question: string,
  crisisTitle: string,
  userCtx: { savings: number; monthlyExpenses: number; hasInsurance: boolean } | null,
  history: { role: string; content: string }[],
  onToken: (t: string) => void,
  onDone: () => void,
  onError: (e: string) => void
) {
  if (!GEMINI_KEY && !GROQ_KEY) { onError('No AI API key set. Add VITE_GEMINI_API_KEY or VITE_GROQ_API_KEY to your .env file.'); return; }

  const systemPrompt = `You are a financial crisis advisor helping someone through: "${crisisTitle}".
${userCtx ? `Their finances: $${userCtx.savings.toLocaleString()} savings, $${userCtx.monthlyExpenses.toLocaleString()}/mo expenses, insurance: ${userCtx.hasInsurance ? 'yes' : 'no'}.` : ''}
Give specific, actionable, empathetic advice. Keep responses concise (2–3 short paragraphs). Use plain language, no jargon.`;

  const contents = [
    ...history.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
    { role: 'user', parts: [{ text: question }] },
  ];

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: { maxOutputTokens: 1024 },
        }),
      }
    );

    let text: string = '';
    if (!res.ok) {
      console.warn('[Gemini] streamCrisisChat failed, trying Groq');
    } else {
      const data = await res.json();
      text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    }

    // Groq fallback if Gemini gave nothing
    if (!text) {
      const fullPrompt = `${systemPrompt}\n\nUser: ${question}`;
      text = await callGroqText(fullPrompt, 1024);
    }
    if (!text) { onError('No response received.'); return; }

    // Simulate streaming word by word
    const words = text.split(' ');
    for (let i = 0; i < words.length; i++) {
      onToken((i === 0 ? '' : ' ') + words[i]);
      await new Promise(r => setTimeout(r, 18));
    }
    onDone();
  } catch {
    onError('Network error. Check your connection.');
  }
}
