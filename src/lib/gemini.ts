const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const GROQ_KEY   = import.meta.env.VITE_GROQ_API_KEY   as string | undefined;
const GEMINI_MODEL = 'gemini-2.5-flash';
const GROQ_MODEL   = 'llama-3.3-70b-versatile';

// ─── SHARED UTILITY ───────────────────────────────────────────────────────────
export class QuotaExceededError extends Error {
  constructor() { super('Gemini API quota exceeded.'); }
}

// Cleans up common AI JSON output issues before parsing
export function cleanJson(raw: string): string {
  // Strip markdown code fences
  let s = raw.replace(/```[\w]*\n?/g, '').trim();
  // Extract the outermost { ... } block
  const start = s.indexOf('{');
  const end   = s.lastIndexOf('}');
  if (start !== -1 && end !== -1) s = s.slice(start, end + 1);
  // Collapse literal newlines/tabs to spaces so they don't break JSON string values
  // (JSON.parse rejects unescaped \n inside string literals)
  s = s.replace(/[\r\n\t]+/g, ' ');
  // Remove trailing commas before } or ]
  s = s.replace(/,\s*([}\]])/g, '$1');
  // Replace smart/curly quotes with straight quotes
  s = s.replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'");
  // Repair unescaped inner double-quotes inside JSON string values.
  // Walk char-by-char tracking string context; replace rogue " with '
  s = repairInnerQuotes(s);
  return s;
}

function repairInnerQuotes(s: string): string {
  let out = '';
  let inString = false;
  let escaped = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (escaped) { out += ch; escaped = false; continue; }
    if (ch === '\\') { out += ch; escaped = true; continue; }
    if (ch === '"') {
      if (!inString) {
        inString = true;
        out += ch;
      } else {
        // Peek ahead past whitespace to decide if this closes the string
        let j = i + 1;
        while (j < s.length && s[j] === ' ') j++;
        const next = s[j] ?? '';
        if (next === ':' || next === ',' || next === '}' || next === ']' || j >= s.length) {
          inString = false;
          out += ch; // legitimate closing quote
        } else {
          out += "'"; // inner quote — replace with single quote
        }
      }
    } else {
      out += ch;
    }
  }
  return out;
}

function parseJson<T>(raw: string): T {
  const cleaned = cleanJson(raw);
  try {
    return JSON.parse(cleaned) as T;
  } catch (e) {
    throw new Error(`JSON parse failed: ${(e as Error).message}. Raw snippet: ${cleaned.slice(0, 300)}`);
  }
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

export interface UserContext {
  savings: number;
  monthlyExpenses: number;
  avgMonthlyIncome: number;
  lowMonthlyIncome?: number;
  runwayDays: number;
  hasInsurance: boolean;
  workType: string;
  healthScore?: number;
  riskLevel?: string;
  incomeVolatility?: number;
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

  let rawText = '';
  if (!res.ok) {
    console.warn('[Gemini] analyzeCrisis failed, trying Groq');
    rawText = await callGroqText(prompt, 8192);
  } else {
    const data = await res.json();
    rawText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  }

  if (!rawText) throw new Error('No response from AI.');
  return parseJson<CrisisAIResponse>(rawText);
}

// ─── PREPARE PAGE RECOMMENDATIONS ────────────────────────────────────────────
export interface PrepTask {
  title: string;
  description: string;
  time: string;
  impact: 'Critical' | 'High' | 'Medium';
}

export interface PrepSpendingCut {
  category: string;
  current: number;
  target: number;
  saving: number;
  tip: string;
}

export interface PrepCoverageGap {
  name: string;
  covered: boolean;
  risk: string;
  fix: string;
  urgency: 'critical' | 'high' | 'medium';
}

export interface PrepPlatformTip {
  title: string;
  body: string;
}

export interface PrepareRecommendations {
  tasks: PrepTask[];
  spendingCuts: PrepSpendingCut[];
  coverageGaps: PrepCoverageGap[];
  platformTips: PrepPlatformTip[];
}

export async function generatePrepareRecommendations(ctx: {
  workType: string;
  avgMonthlyIncome: number;
  lowMonthlyIncome: number;
  highMonthlyIncome: number;
  savings: number;
  fixedExpenses: number;
  debtPayments: number;
  hasInsurance: boolean;
  cashRunwayDays: number;
  incomeVolatility: number;
  spending: Record<string, number>;
}): Promise<PrepareRecommendations> {
  if (!GEMINI_KEY && !GROQ_KEY) throw new Error('No AI API key configured.');

  const spendingLines = Object.entries(ctx.spending)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => `  ${k}: $${v.toLocaleString()}/mo`)
    .join('\n');

  const prompt = `You are a financial advisor AI for gig workers. Generate fully personalized recommendations based ONLY on the data below — no generic advice.

USER DATA:
- Work type: ${ctx.workType}
- Avg monthly income: $${ctx.avgMonthlyIncome.toLocaleString()}
- Income range: $${ctx.lowMonthlyIncome.toLocaleString()}–$${ctx.highMonthlyIncome.toLocaleString()}/mo
- Income volatility: ${Math.round(ctx.incomeVolatility * 100)}%
- Savings: $${ctx.savings.toLocaleString()}
- Fixed expenses: $${ctx.fixedExpenses.toLocaleString()}/mo
- Debt payments: $${ctx.debtPayments.toLocaleString()}/mo
- Has health insurance: ${ctx.hasInsurance ? 'Yes' : 'No'}
- Cash runway: ${ctx.cashRunwayDays} days (${(ctx.cashRunwayDays / 30).toFixed(1)} months)
- Monthly spending breakdown:
${spendingLines}

Return ONLY a valid JSON object (no markdown, no code fences, start with {, end with }):
{
  "tasks": [
    {
      "title": "Specific action with real dollar amounts from their data",
      "description": "2–3 sentences using their exact numbers. No generic advice.",
      "time": "X min",
      "impact": "Critical"
    }
  ],
  "spendingCuts": [
    {
      "category": "Category name",
      "current": 0,
      "target": 0,
      "saving": 0,
      "tip": "Specific tip referencing their actual spending amount"
    }
  ],
  "coverageGaps": [
    {
      "name": "Coverage type",
      "covered": false,
      "risk": "Specific risk in dollars based on their income/savings",
      "fix": "Specific actionable fix with estimated cost",
      "urgency": "critical"
    }
  ],
  "platformTips": [
    {
      "title": "Specific tip title for their work type",
      "body": "Detailed tip using their actual income numbers"
    }
  ]
}

Rules:
- tasks: exactly 4 items. impact must be "Critical", "High", or "Medium". Order by urgency. Every title and description must reference their specific dollar amounts.
- spendingCuts: 2–4 items. Only flag categories where current spend is above healthy % of their income. current and target are monthly dollar amounts. saving = current - target. If all spending is healthy, still return 2 items with saving: 0 and a tip about maintaining their discipline.
- coverageGaps: exactly 3 items specific to their work type (${ctx.workType}). covered is true only for health insurance if hasInsurance is true. urgency must be "critical", "high", or "medium".
- platformTips: exactly 3 tips tailored specifically for ${ctx.workType} workers at $${ctx.avgMonthlyIncome.toLocaleString()}/mo income. Reference their actual income in at least 2 tips.
- Return ONLY the JSON object, nothing else.`;

  const raw = await callTextModel(prompt);
  return parseJson<PrepareRecommendations>(raw);
}

// ─── FOLLOW-UP CHAT ───────────────────────────────────────────────────────────
export async function streamCrisisChat(
  question: string,
  crisisTitle: string,
  userCtx: { savings: number; monthlyExpenses: number; hasInsurance: boolean; avgMonthlyIncome?: number; lowMonthlyIncome?: number; runwayDays?: number; healthScore?: number; riskLevel?: string; incomeVolatility?: number; workType?: string } | null,
  history: { role: string; content: string }[],
  onToken: (t: string) => void,
  onDone: () => void,
  onError: (e: string) => void
) {
  if (!GEMINI_KEY && !GROQ_KEY) { onError('No AI API key set. Add VITE_GEMINI_API_KEY or VITE_GROQ_API_KEY to your .env file.'); return; }

  const dataBlock = userCtx ? `
User's current financial data:
- Work type: ${userCtx.workType ?? 'gig worker'}
- Avg monthly income: $${userCtx.avgMonthlyIncome?.toLocaleString() ?? '?'}
- Lowest monthly income: $${userCtx.lowMonthlyIncome?.toLocaleString() ?? '?'}
- Monthly expenses: $${userCtx.monthlyExpenses.toLocaleString()}
- Savings: $${userCtx.savings.toLocaleString()} (${userCtx.runwayDays ?? '?'} days runway)
- Health score: ${userCtx.healthScore ?? '?'}/100 — ${userCtx.riskLevel ?? '?'} risk
- Income volatility: ${userCtx.incomeVolatility != null ? Math.round(userCtx.incomeVolatility * 100) + '%' : '?'}
- Insurance: ${userCtx.hasInsurance ? 'yes' : 'no'}` : 'No financial data available.';

  const systemPrompt = `You are Crunch Guide, a financial crisis prevention assistant for gig workers.
${crisisTitle !== 'General Financial Coaching' ? `Context: the user is dealing with "${crisisTitle}".` : ''}
${dataBlock}

Only answer using the user's data above. Never guess or hallucinate. If data is missing say: "I can't verify that from your current data."

Help with: runway, spending pressure, volatility, bills, what to do today, whether things are improving, dashboard numbers.
Do NOT help with: insurance product recommendations, investment advice, legal advice, tax filing advice, medical advice, or anything unrelated to the user's financial situation. If asked, reply: "That's outside what I can help with. Ask me about your runway, spending, or what to do today."

Style: plain English, direct, 1–4 sentences max, one practical action when relevant. Be brief — never exceed 4 sentences.`;

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
          generationConfig: { maxOutputTokens: 200 },
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

    // Groq fallback
    if (!text) {
      const fullPrompt = `${systemPrompt}\n\nUser: ${question}`;
      text = await callGroqText(fullPrompt, 200);
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

// ─── CLAIM GUARD — EOB ANALYSIS ───────────────────────────────────────────────

export interface EOBError {
  title: string;
  description: string;
  impact: string;
  carcCode: string;
}
export interface EOBCorrect {
  title: string;
  description: string;
}
export interface EOBAnalysis {
  claimId: string;
  claimDate: string;
  totalOvercharge: number;
  detectedInsurer: string;
  detectedState: string;
  errors: EOBError[];
  correct: EOBCorrect[];
  summary: string;
}

// JSON schema that Gemini enforces natively — no parsing errors possible
const EOB_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    claimId:          { type: 'STRING' },
    claimDate:        { type: 'STRING' },
    totalOvercharge:  { type: 'NUMBER' },
    detectedInsurer:  { type: 'STRING' },
    detectedState:    { type: 'STRING' },
    errors: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          title:       { type: 'STRING' },
          description: { type: 'STRING' },
          impact:      { type: 'STRING' },
          carcCode:    { type: 'STRING' },
        },
        required: ['title', 'description', 'impact', 'carcCode'],
      },
    },
    correct: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          title:       { type: 'STRING' },
          description: { type: 'STRING' },
        },
        required: ['title', 'description'],
      },
    },
    summary: { type: 'STRING' },
  },
  required: ['claimId', 'claimDate', 'totalOvercharge', 'detectedInsurer', 'detectedState', 'errors', 'correct', 'summary'],
};

const EOB_SYSTEM_PROMPT = `You are an expert insurance billing analyst. Carefully read this Explanation of Benefits (EOB), denial letter, or medical bill.

Find ALL billing errors, incorrect denials, wrong calculations, and overcharges. For each issue found:
1. Identify the CARC code if present (e.g. CO-50, OA-23, PR-1) — put it in carcCode field, or empty string if none
2. Explain what the error is in plain English
3. Cite the specific rule, billing code, or policy clause
4. State the exact financial impact

Also note any items that were processed correctly.

Rules:
- detectedInsurer: name of the insurance company from the document, or empty string
- detectedState: 2-letter US state code detected from the document (e.g. IL, AZ, CA), or empty string
- totalOvercharge: total dollar amount the patient was overcharged (0 if none confirmed)
- carcCode: the CARC/RARC reason code from the denial (e.g. CO-50, OA-23), or empty string
- summary: one clear sentence — what the patient actually owes vs what they were charged`;

export async function analyzeEOB(
  content: { type: 'text'; text: string } | { type: 'image'; base64: string; mimeType: string }
): Promise<EOBAnalysis> {
  if (!GEMINI_KEY && !GROQ_KEY) throw new Error('No AI API key set. Add VITE_GEMINI_API_KEY or VITE_GROQ_API_KEY to your .env file.');

  // ── Gemini path (JSON schema mode — guaranteed valid JSON output) ──
  if (GEMINI_KEY) {
    try {
      const parts = content.type === 'image'
        ? [{ text: EOB_SYSTEM_PROMPT }, { inlineData: { mimeType: content.mimeType, data: content.base64 } }]
        : [{ text: `${EOB_SYSTEM_PROMPT}\n\nDocument text:\n${content.text}` }];

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 8192,
              responseMimeType: 'application/json',
              responseSchema: EOB_RESPONSE_SCHEMA,
            },
          }),
        }
      );
      if (res.status === 429) throw new QuotaExceededError();
      if (res.ok) {
        const data = await res.json();
        const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        if (raw) return JSON.parse(raw) as EOBAnalysis;
      }
    } catch (e) {
      if (content.type === 'image') throw e; // Groq can't handle images
      console.warn('[Gemini] analyzeEOB failed, trying Groq:', (e as Error).message);
    }
  }

  // ── Groq fallback (text-only) ──
  if (content.type === 'image') throw new Error('Gemini API unavailable and Groq cannot process images. Add VITE_GEMINI_API_KEY to your .env.');
  if (!GROQ_KEY) throw new Error('No API key available. Add VITE_GEMINI_API_KEY or VITE_GROQ_API_KEY to your .env.');

  const prompt = `${EOB_SYSTEM_PROMPT}

Document text:
${content.text}

Return ONLY a raw JSON object. Start with { and end with }. No markdown fences, no extra text.
Use single quotes inside string values if you need quotes (never double-quotes inside strings).`;

  const raw = await callGroqText(prompt, 8192);
  return parseJson<EOBAnalysis>(raw);
}

// ─── CLAIM GUARD — CHATBOT ────────────────────────────────────────────────────

export async function streamClaimChat(
  question: string,
  eobContext: { analysis: EOBAnalysis; originalText: string },
  history: { role: string; content: string }[],
  onToken: (t: string) => void,
  onDone: () => void,
  onError: (e: string) => void
): Promise<void> {
  if (!GEMINI_KEY && !GROQ_KEY) { onError('No AI API key set.'); return; }

  const { analysis, originalText } = eobContext;
  const errorSummary = analysis.errors.length > 0
    ? analysis.errors.map((e, i) => `${i + 1}. ${e.title}${e.carcCode ? ` (${e.carcCode})` : ''}: ${e.impact}`).join('\n')
    : 'No errors found.';

  const systemPrompt = `You are ClaimGuard, a friendly insurance literacy assistant. You help people understand their insurance documents in plain English.

EOB CONTEXT:
- Claim ID: ${analysis.claimId || 'not found'}
- Insurer: ${analysis.detectedInsurer || 'not detected'}
- State: ${analysis.detectedState || 'not detected'}
- Total overcharge found: $${analysis.totalOvercharge.toLocaleString()}
- Errors flagged: ${errorSummary}
- Summary: ${analysis.summary}
${originalText ? `\nOriginal document excerpt:\n${originalText.slice(0, 600)}` : ''}

Rules:
- Answer ONLY about their specific document and the errors found
- Explain in plain English — no jargon without explanation
- If asked about legal action ("can I sue"), say: "I can't give legal advice, but here is the appeal process..."
- Keep answers concise (2–3 short paragraphs max)
- If asked about a different claim, say "Please start a new analysis for that document"`;

  const contents = [
    ...history.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
    { role: 'user', parts: [{ text: question }] },
  ];

  let text = '';
  try {
    if (GEMINI_KEY) {
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
      if (res.ok) {
        const data = await res.json();
        text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      }
    }
    if (!text && GROQ_KEY) {
      text = await callGroqText(`${systemPrompt}\n\nUser: ${question}`, 1024);
    }
    if (!text) { onError('No response received.'); return; }

    const words = text.split(' ');
    for (let i = 0; i < words.length; i++) {
      onToken((i === 0 ? '' : ' ') + words[i]);
      await new Promise(r => setTimeout(r, 15));
    }
    onDone();
  } catch {
    onError('Network error. Check your connection.');
  }
}
