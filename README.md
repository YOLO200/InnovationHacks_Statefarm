# Crunch — Financial Wellness for Gig Workers

> Built for **InnovationHacks × State Farm** · 2026

Crunch is a financial resilience dashboard built specifically for gig economy workers — rideshare drivers, delivery workers, freelancers, and contractors. It turns raw bank statement data into plain-English survival intelligence: cash runway, risk level, tax exposure, and a prioritized action plan.

---

## The Problem

Gig workers earn unpredictably, pay self-employment taxes quarterly, have no employer benefits, and are one platform deactivation away from $0 income. Traditional financial apps were built for salaried employees. Crunch was built for everyone else.

---

## Features

### Dashboard
- **Financial Survival Score** (0–100) with sub-factor breakdown: income stability, tax reserve, savings buffer, coverage gaps
- **AI Findings Banner** — parses uploaded bank statements and surfaces key numbers automatically
- **Survival Stats** — cash runway (weeks/months), worst-month deficit, quarterly tax estimate
- **Verdict Banner** — plain-English risk assessment (Critical / Caution / Stable)
- **Do This Now** — prioritized, personalized action checklist

### AI Financial Coach
- Conversational AI coach powered by **Google Gemini 2.5 Flash** (Groq / LLaMA 3.3 fallback)
- Real-time streaming responses
- Context-aware — knows your savings, expenses, and insurance status
- Available as a full page (`/ai-coach`) and as a floating overlay on every page

### Read Aloud
- Every AI response has a speaker button to make it more accessible
- Uses **ElevenLabs** (`eleven_multilingual_v2`) for natural, same-voice multilingual speech
- Automatically falls back to the browser's Web Speech API if ElevenLabs is unavailable
- Stop button appears during playback

### Page Translation
- 6 languages: English, Español, 中文, Tiếng Việt, العربية, Français
- Language selector in the sidebar — persisted to `localStorage`
- Translates the full UI: nav labels, dashboard content, action plan, score descriptions, chat interface
- AI coach responds in the selected language automatically

### Crisis Advisor
- Scenario-based crisis planning (job loss, medical emergency, car breakdown, etc.)
- AI-generated survival plan with immediate actions and a realistic timeline
- Follow-up chat for detailed guidance

### Additional Pages
- **Claim Guard** — insurance claim assistance and documentation guidance
- **Prepare** — pre-crisis preparation tools and scenario simulation
- **Spending** — category-level spending breakdown with visual charts

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript + Vite |
| Routing | React Router v7 |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Animation | Framer Motion |
| Charts | Recharts |
| AI — primary | Google Gemini 2.5 Flash |
| AI — fallback | Groq (LLaMA 3.3 70B) |
| Text-to-Speech | ElevenLabs `eleven_multilingual_v2` → Web Speech API fallback |
| Font | Plus Jakarta Sans |
| State | React Context + localStorage |

---

## Getting Started

### Prerequisites
- Node.js 18+
- API keys for Gemini, Groq, and ElevenLabs

### Installation

```bash
git clone <repo-url>
cd InnovationHacks_Statefarm
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_GROQ_API_KEY=your_groq_api_key
VITE_ELEVENLABS_API_KEY=your_elevenlabs_api_key
VITE_ELEVENLABS_VOICE_ID=your_elevenlabs_voice_id
```

| Variable | Where to get it |
|---|---|
| `VITE_GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/) |
| `VITE_GROQ_API_KEY` | [Groq Console](https://console.groq.com/) |
| `VITE_ELEVENLABS_API_KEY` | [ElevenLabs](https://elevenlabs.io/) |
| `VITE_ELEVENLABS_VOICE_ID` | ElevenLabs → Voices → copy Voice ID |

### Run

```bash
npm run dev
# → http://localhost:5173
```

### Build

```bash
npm run build
```

---

## Project Structure

```
src/
├── app/
│   ├── layout/
│   │   └── DashboardLayout.tsx    # Sidebar, floating chat, language selector
│   ├── lib/
│   │   ├── elevenlabs.ts          # ElevenLabs TTS + Web Speech fallback
│   │   └── gemini.ts              # Gemini API wrapper
│   ├── pages/
│   │   ├── Dashboard.tsx          # Main financial dashboard
│   │   ├── AICoach.tsx            # Full-page AI chat
│   │   ├── CrisisAdvisor.tsx      # Crisis scenario planning
│   │   ├── Onboarding.tsx         # User profile + bank statement upload
│   │   ├── Spending.tsx           # Spending breakdown
│   │   ├── Prepare.tsx            # Pre-crisis preparation
│   │   └── ClaimGuard.tsx         # Insurance claim guidance
│   ├── store/
│   │   ├── AppContext.tsx          # User data + financial score calculations
│   │   └── LanguageContext.tsx     # Global language / translation state
│   └── types/
│       └── financial.ts            # TypeScript data types
└── lib/
    └── gemini.ts                   # Crisis AI (streaming + Groq fallback)
```

---

## How the Financial Survival Score Works

The score (0–100) is built from four components:

| Component | Max | Formula |
|---|---|---|
| Cash Runway | 35 | `min(runway_days / 90, 1) × 35` |
| Income Stability | 25 | `max(25 − volatility × 25, 0)` |
| Savings Cushion | 20 | `min(savings / fixed_expenses, 1) × 20` |
| Insurance Coverage | 20 | 20 if insured, 0 if not |

**Risk level** is derived separately:
- `high` — income volatility > 50% **or** worst-month surplus < $0
- `medium` — volatility > 30% **or** surplus < 20% of fixed expenses
- `low` — everything else

---

## Supported Languages

| Code | Language | Flag |
|---|---|---|
| `en` | English | 🇺🇸 |
| `es` | Español | 🇲🇽 |
| `zh` | 中文 | 🇨🇳 |
| `vi` | Tiếng Việt | 🇻🇳 |
| `ar` | العربية | 🇸🇦 |
| `fr` | Français | 🇫🇷 |

Language selection persists across sessions. The AI coach automatically responds in the active language.

---

## License

Built for hackathon purposes. All rights reserved.
