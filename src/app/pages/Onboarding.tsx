import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Slider } from '../components/ui/slider';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Label } from '../components/ui/label';
import { useAppData } from '../store/AppContext';
import type { WorkType, IncomeFrequency, DependencyAsset, WorkProfile, IncomeData, FinancialSnapshot, PersonalInfo, HousingSituation } from '../types/financial';
import { Car, Laptop, Smartphone, Package, ChevronRight, ChevronLeft, Zap, Home, Building2, Users, Upload, CheckCircle2, AlertCircle, Loader2, FileText, Edit3 } from 'lucide-react';

// ─── STEP 0: PERSONAL INFO ────────────────────────────────────────────────────

interface Step0Props { data: PersonalInfo; onChange: (d: PersonalInfo) => void; }

const HOUSING_OPTIONS: { value: HousingSituation; label: string; desc: string; icon: typeof Home }[] = [
  { value: 'rent',   label: 'Renting',       desc: 'Apartment or house',      icon: Building2 },
  { value: 'own',    label: 'Own a home',    desc: 'Mortgage or paid off',    icon: Home },
  { value: 'family', label: 'With family',   desc: 'No rent obligation',      icon: Users },
  { value: 'other',  label: 'Other',         desc: 'Temporary, shared, etc.', icon: Package },
];

function Step0({ data, onChange }: Step0Props) {
  const field = (label: string, key: keyof PersonalInfo, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <input
        type={type}
        value={data[key] as string}
        onChange={e => onChange({ ...data, [key]: e.target.value })}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        {field('Full Name', 'name', 'text', 'Jane Smith')}
        {field('Age', 'age', 'number', '28')}
      </div>
      {field('Email Address', 'email', 'email', 'jane@example.com')}
      {field('Phone Number', 'phone', 'tel', '(555) 000-0000')}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Housing Situation</label>
        <div className="grid grid-cols-2 gap-3">
          {HOUSING_OPTIONS.map(opt => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange({ ...data, housing: opt.value })}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  data.housing === opt.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Icon className={`w-4 h-4 mb-1 ${data.housing === opt.value ? 'text-blue-600' : 'text-gray-400'}`} />
                <p className="text-sm font-semibold text-gray-900">{opt.label}</p>
                <p className="text-xs text-gray-500">{opt.desc}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── STEP 1 ───────────────────────────────────────────────────────────────────
interface Step1Props { data: WorkProfile; onChange: (d: WorkProfile) => void; }

const WORK_TYPES: { value: WorkType; label: string; emoji: string; desc: string }[] = [
  { value: 'rideshare', label: 'Rideshare', emoji: '🚗', desc: 'Uber, Lyft, etc.' },
  { value: 'delivery',  label: 'Delivery',  emoji: '📦', desc: 'DoorDash, Instacart, etc.' },
  { value: 'freelance', label: 'Freelance', emoji: '💻', desc: 'Design, writing, dev work' },
  { value: 'contract',  label: 'Contract',  emoji: '📋', desc: 'Short-term contracts' },
];

const FREQUENCIES: { value: IncomeFrequency; label: string; desc: string }[] = [
  { value: 'daily',  label: 'Daily',   desc: 'Paid per trip/task' },
  { value: 'weekly', label: 'Weekly',  desc: 'Weekly deposits' },
  { value: 'mixed',  label: 'Mixed',   desc: 'Multiple sources' },
];

const DEPENDENCIES: { value: DependencyAsset; label: string; icon: typeof Car }[] = [
  { value: 'car',      label: 'Car',      icon: Car },
  { value: 'laptop',   label: 'Laptop',   icon: Laptop },
  { value: 'phone',    label: 'Phone',    icon: Smartphone },
  { value: 'physical', label: 'Body/Health', icon: Package },
  { value: 'none',     label: 'None',     icon: Zap },
];

function Step1({ data, onChange }: Step1Props) {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Work Type</h3>
        <div className="grid grid-cols-2 gap-3">
          {WORK_TYPES.map(t => (
            <button
              key={t.value}
              onClick={() => onChange({ ...data, work_type: t.value })}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                data.work_type === t.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-1">{t.emoji}</div>
              <div className="font-semibold text-gray-900 text-sm">{t.label}</div>
              <div className="text-xs text-gray-500">{t.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Income Frequency</h3>
        <RadioGroup
          value={data.income_frequency}
          onValueChange={v => onChange({ ...data, income_frequency: v as IncomeFrequency })}
          className="grid grid-cols-3 gap-3"
        >
          {FREQUENCIES.map(f => (
            <Label
              key={f.value}
              htmlFor={`freq-${f.value}`}
              className={`flex flex-col items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                data.income_frequency === f.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <RadioGroupItem value={f.value} id={`freq-${f.value}`} className="sr-only" />
              <span className="font-semibold text-gray-900 text-sm">{f.label}</span>
              <span className="text-xs text-gray-500 text-center mt-1">{f.desc}</span>
            </Label>
          ))}
        </RadioGroup>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          What do you depend on to earn?
        </h3>
        <div className="flex gap-3 flex-wrap">
          {DEPENDENCIES.map(dep => {
            const Icon = dep.icon;
            return (
              <button
                key={dep.value}
                onClick={() => onChange({ ...data, income_dependency_asset: dep.value })}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                  data.income_dependency_asset === dep.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {dep.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}


function SliderField({ label, value, min, max, step, color, onChange }: {
  label: string; value: number; min: number; max: number; step: number;
  color: string; onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <Label className="text-sm font-medium text-gray-700">{label}</Label>
        <span className={`text-lg font-bold ${color}`}>${value.toLocaleString()}</span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={min}
        max={max}
        step={step}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-gray-400">
        <span>${min.toLocaleString()}</span>
        <span>${max.toLocaleString()}</span>
      </div>
    </div>
  );
}


// ─── STEP 3: BANK STATEMENT UPLOAD ───────────────────────────────────────────
import { callGemini, QuotaExceededError } from '../lib/gemini';

type StatementType = 'checking' | 'savings' | 'credit';

interface UploadedFile { type: StatementType; file: File; base64: string; }

interface SpendingBreakdownShape {
  housing: number;
  food: number;
  gas: number;
  maintenance: number;
  phone: number;
  insurance: number;
  debt: number;
  other: number;
}

interface ExtractedData {
  avg_monthly_income: number;
  low_monthly_income: number;
  high_monthly_income: number;
  savings: number;
  fixed_expenses: number;
  debt_payments: number;
  has_insurance: boolean;
  spending_breakdown: SpendingBreakdownShape;
  monthly_spending: { month: string; breakdown: SpendingBreakdownShape }[];
}

const STATEMENT_SLOTS: { type: StatementType; label: string; desc: string; color: string; bg: string; border: string }[] = [
  { type: 'checking', label: 'Checking Statement', desc: 'Shows monthly transactions & expenses', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-300' },
  { type: 'savings',  label: 'Savings Statement',  desc: 'Shows current savings balance',        color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-300' },
  { type: 'credit',   label: 'Credit Card Statement', desc: 'Shows debt & monthly payments',     color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-300' },
];

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]); // strip the data:...;base64, prefix
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function extractFromStatements(files: UploadedFile[]): Promise<ExtractedData> {
  const parts: object[] = files.map(f => ({
    inlineData: { mimeType: f.file.type || 'application/pdf', data: f.base64 },
  }));

  const labels = files.map(f => `${f.type} statement: ${f.file.name}`).join(', ');

  parts.push({
    text: `These are bank/financial statements from the past year: ${labels}.

Analyze ALL documents together and extract the following. Return ONLY valid JSON, no markdown, no explanation:
{
  "avg_monthly_income": <average monthly income/deposits across all months as a number>,
  "low_monthly_income": <lowest single month income/deposits as a number>,
  "high_monthly_income": <highest single month income/deposits as a number>,
  "savings": <current savings account balance as a number>,
  "fixed_expenses": <average total monthly expenses/outflows from checking as a number>,
  "debt_payments": <total monthly credit card or debt payments as a number>,
  "has_insurance": <true if any insurance payment is visible, otherwise false>,
  "spending_breakdown": {
    "housing": <rent or mortgage from most recent month>,
    "food": <groceries and restaurants from most recent month>,
    "gas": <fuel from most recent month>,
    "maintenance": <car/home repairs from most recent month>,
    "phone": <phone bill from most recent month>,
    "insurance": <insurance premiums from most recent month>,
    "debt": <loan/credit payments from most recent month>,
    "other": <everything else from most recent month>
  },
  "monthly_spending": [
    {
      "month": <"Month YYYY" e.g. "June 2024">,
      "breakdown": {
        "housing": <number>,
        "food": <number>,
        "gas": <number>,
        "maintenance": <number>,
        "phone": <number>,
        "insurance": <number>,
        "debt": <number>,
        "other": <number>
      }
    }
  ]
}

Rules:
- Income figures: scan all months in the checking account deposits/credits to find avg/low/high — ignore transfers between own accounts
- fixed_expenses: average monthly outflows across all months from the checking account — exclude transfers to savings, transfers between own accounts, and one-time payments over $2,000
- savings: look ONLY at the savings account statement — find the line explicitly labeled "Ending Balance", "Closing Balance", "Available Balance", or "Account Balance" at the end of the most recent statement period — do NOT use the checking account balance under any circumstances
- debt_payments: from the credit card statement, use the actual "Payment Made" or "Minimum Payment Due" amount from the most recent month — do NOT use the total outstanding balance
- spending_breakdown: use ONLY the most recent calendar month's transactions
- monthly_spending: produce one entry per calendar month found across ALL statements — sorted newest month first — each with the same 8 category breakdown
- Categorize by merchant name: "Shell", "BP", "Chevron" → gas; "Kroger", "Whole Foods", "McDonald's" → food; "AT&T", "Verizon", "T-Mobile" → phone; "State Farm", "Allstate", "Geico" → insurance; "Rent", "Mortgage", "Apartment" → housing; "Jiffy Lube", "AutoZone", "Midas" → maintenance
- Do not double-count transactions across categories
- If a category has no transactions in a month, use 0
- Return ONLY the JSON object, nothing else`,
  });

  const text = await callGemini('onboarding', { contents: [{ parts }] });
  const cleaned = text.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned) as ExtractedData;
}

interface Step3Props {
  income: IncomeData;
  financials: Omit<FinancialSnapshot, 'spending_breakdown'>;
  onIncomeChange: (d: IncomeData) => void;
  onFinancialsChange: (d: Omit<FinancialSnapshot, 'spending_breakdown'>) => void;
  onSpendingExtracted: (s: FinancialSnapshot['spending_breakdown']) => void;
  onMonthlySpendingExtracted: (ms: { month: string; breakdown: FinancialSnapshot['spending_breakdown'] }[]) => void;
}

function Step3({ income, financials, onIncomeChange, onFinancialsChange, onSpendingExtracted, onMonthlySpendingExtracted }: Step3Props) {
  const [uploads, setUploads] = useState<Partial<Record<StatementType, UploadedFile>>>({});
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [manualMode, setManualMode] = useState(false);

  const allUploaded = STATEMENT_SLOTS.every(s => uploads[s.type]);

  const handleFile = async (type: StatementType, file: File) => {
    const base64 = await fileToBase64(file);
    setUploads(prev => ({ ...prev, [type]: { type, file, base64 } }));
    setStatus('idle');
  };

  const handleDrop = (type: StatementType, e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(type, file);
  };

  const analyze = async () => {
    setStatus('loading');
    setErrorMsg('');
    try {
      const files = Object.values(uploads) as UploadedFile[];
      const extracted = await extractFromStatements(files);
      onIncomeChange({
        avg_monthly_income: extracted.avg_monthly_income,
        low_monthly_income: extracted.low_monthly_income,
        high_monthly_income: extracted.high_monthly_income,
      });
      onFinancialsChange({
        savings: extracted.savings,
        fixed_expenses: extracted.fixed_expenses,
        debt_payments: extracted.debt_payments,
        has_insurance: extracted.has_insurance,
      });
      onSpendingExtracted(extracted.spending_breakdown);
      onMonthlySpendingExtracted(extracted.monthly_spending ?? []);
      setStatus('done');
    } catch (e) {
      setErrorMsg(
        e instanceof QuotaExceededError
          ? 'Gemini API quota exceeded. Check your usage at console.cloud.google.com or try again later.'
          : (e as Error).message
      );
      setStatus('error');
    }
  };

  // ── Manual entry: two-column layout ────────────────────────────────────────
  if (manualMode) {
    const volatility = income.avg_monthly_income > 0
      ? ((income.high_monthly_income - income.low_monthly_income) / income.avg_monthly_income * 100).toFixed(0)
      : '0';

    return (
      <div className="space-y-6">
        <button
          onClick={() => setManualMode(false)}
          className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 transition-colors"
        >
          ← Back to upload
        </button>

        <div className="grid grid-cols-2 gap-8">
          {/* Left column — Income Snapshot */}
          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-1">Income Snapshot</p>
              <p className="text-sm text-gray-500">Based on your past year of earnings</p>
            </div>
            <SliderField
              label="Average Monthly Income"
              value={income.avg_monthly_income}
              min={500} max={10000} step={100}
              color="text-blue-600"
              onChange={v => onIncomeChange({ ...income, avg_monthly_income: v })}
            />
            <SliderField
              label="Lowest Month"
              value={income.low_monthly_income}
              min={0} max={income.avg_monthly_income} step={100}
              color="text-red-500"
              onChange={v => onIncomeChange({ ...income, low_monthly_income: v })}
            />
            <SliderField
              label="Highest Month"
              value={income.high_monthly_income}
              min={income.avg_monthly_income} max={15000} step={100}
              color="text-green-600"
              onChange={v => onIncomeChange({ ...income, high_monthly_income: v })}
            />
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-xs text-amber-800">
                <span className="font-semibold">Volatility: {volatility}%</span>
                {Number(volatility) > 50
                  ? ' — Very high. Plan from your lowest month.'
                  : Number(volatility) > 30
                  ? " — Moderate. We'll use worst-case planning."
                  : ' — Relatively stable.'}
              </p>
            </div>
          </div>

          {/* Right column — Financial Snapshot */}
          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold text-green-600 uppercase tracking-widest mb-1">Financial Snapshot</p>
              <p className="text-sm text-gray-500">Your current balances and obligations</p>
            </div>
            <SliderField
              label="Current Savings"
              value={financials.savings}
              min={0} max={20000} step={100}
              color="text-green-600"
              onChange={v => onFinancialsChange({ ...financials, savings: v })}
            />
            <SliderField
              label="Fixed Monthly Expenses"
              value={financials.fixed_expenses}
              min={500} max={8000} step={50}
              color="text-red-500"
              onChange={v => onFinancialsChange({ ...financials, fixed_expenses: v })}
            />
            <SliderField
              label="Monthly Debt Payments"
              value={financials.debt_payments}
              min={0} max={2000} step={25}
              color="text-orange-500"
              onChange={v => onFinancialsChange({ ...financials, debt_payments: v })}
            />
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Insurance?</p>
              <div className="flex gap-2">
                {[{ label: "Yes, covered", value: true }, { label: 'No insurance', value: false }].map(opt => (
                  <button
                    key={String(opt.value)}
                    onClick={() => onFinancialsChange({ ...financials, has_insurance: opt.value })}
                    className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                      financials.has_insurance === opt.value
                        ? opt.value ? 'border-green-500 bg-green-50 text-green-700' : 'border-red-400 bg-red-50 text-red-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Upload view ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <p className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
        🔒 Statements are sent only to Gemini AI for analysis and never stored on any server.
      </p>

      {STATEMENT_SLOTS.map(slot => {
        const uploaded = uploads[slot.type];
        return (
          <label
            key={slot.type}
            onDragOver={e => e.preventDefault()}
            onDrop={e => handleDrop(slot.type, e)}
            className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
              uploaded ? `${slot.bg} ${slot.border}` : 'border-dashed border-gray-300 hover:border-gray-400 bg-white'
            }`}
          >
            <input
              type="file"
              accept=".pdf,.csv,.png,.jpg,.jpeg"
              className="sr-only"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(slot.type, f); }}
            />
            <div className={`p-2.5 rounded-xl ${uploaded ? 'bg-white/70' : 'bg-gray-100'}`}>
              {uploaded
                ? <CheckCircle2 className={`w-5 h-5 ${slot.color}`} />
                : <Upload className="w-5 h-5 text-gray-400" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${uploaded ? slot.color : 'text-gray-700'}`}>{slot.label}</p>
              <p className="text-xs text-gray-500 truncate">{uploaded ? uploaded.file.name : slot.desc}</p>
            </div>
            {uploaded ? (
              <button
                type="button"
                onClick={e => { e.preventDefault(); setUploads(prev => { const n = { ...prev }; delete n[slot.type]; return n; }); setStatus('idle'); }}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors px-2"
              >✕</button>
            ) : (
              <span className="text-xs text-gray-400">PDF, CSV, Image</span>
            )}
          </label>
        );
      })}

      {allUploaded && status !== 'done' && (
        <button
          onClick={analyze}
          disabled={status === 'loading'}
          className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          {status === 'loading'
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing 12 months of statements…</>
            : <><FileText className="w-4 h-4" /> Analyze with AI</>
          }
        </button>
      )}

      {status === 'error' && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {status === 'done' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-green-700 text-sm font-semibold">
            <CheckCircle2 className="w-4 h-4" /> Data extracted successfully
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Avg Income',   value: income.avg_monthly_income,    color: 'text-blue-600' },
              { label: 'Low Month',    value: income.low_monthly_income,    color: 'text-red-500' },
              { label: 'High Month',   value: income.high_monthly_income,   color: 'text-green-600' },
              { label: 'Savings',      value: financials.savings,           color: 'text-green-600' },
              { label: 'Expenses/mo',  value: financials.fixed_expenses,    color: 'text-red-500' },
              { label: 'Debt Pmts',    value: financials.debt_payments,     color: 'text-orange-500' },
            ].map(item => (
              <div key={item.label} className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                <p className="text-xs text-gray-500 mb-0.5">{item.label}</p>
                <p className={`text-base font-bold ${item.color}`}>${item.value.toLocaleString()}</p>
              </div>
            ))}
          </div>
          <button
            onClick={() => setManualMode(true)}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" /> Edit values manually
          </button>
        </div>
      )}

      {status !== 'done' && (
        <button
          onClick={() => setManualMode(true)}
          className="w-full text-center text-sm text-gray-400 hover:text-gray-600 transition-colors py-1"
        >
          Enter values manually instead →
        </button>
      )}
    </div>
  );
}

// ─── MAIN ONBOARDING ──────────────────────────────────────────────────────────
const STEPS = ['Personal Info', 'Work Profile', 'Bank Statements'];

export function Onboarding() {
  const navigate = useNavigate();
  const { setUserData } = useAppData();

  const [step, setStep] = useState(0);
  const [personal, setPersonal] = useState<PersonalInfo>({
    name: '', age: '', email: '', phone: '', housing: 'rent',
  });
  const [profile, setProfile] = useState<WorkProfile>({
    work_type: 'rideshare',
    income_frequency: 'daily',
    income_dependency_asset: 'car',
  });
  const [income, setIncome] = useState<IncomeData>({
    avg_monthly_income: 2500,
    low_monthly_income: 1200,
    high_monthly_income: 4000,
  });
  const [financials, setFinancials] = useState<Omit<FinancialSnapshot, 'spending_breakdown'>>({
    savings: 800,
    fixed_expenses: 1800,
    debt_payments: 200,
    has_insurance: false,
  });
  const [spendingBreakdown, setSpendingBreakdown] = useState<FinancialSnapshot['spending_breakdown'] | null>(null);
  const [monthlySpending, setMonthlySpending] = useState<{ month: string; breakdown: FinancialSnapshot['spending_breakdown'] }[]>([]);

  const handleFinish = () => {
    setUserData(
      personal,
      profile,
      income,
      { ...financials, spending_breakdown: spendingBreakdown ?? { housing: 0, food: 0, gas: 0, maintenance: 0, phone: 0, insurance: 0, debt: 0, other: 0 } },
      spendingBreakdown ?? undefined,
      monthlySpending,
    );
    navigate('/');
  };

  const stepDescriptions = [
    "Let's get to know you before we build your financial picture.",
    'Tell us about your work so we can tailor your financial model.',
    "Upload your past year of bank statements. We'll extract income and expenses automatically.",
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left panel — branding + step list */}
      <div className="hidden lg:flex w-80 xl:w-96 flex-shrink-0 bg-gradient-to-br from-blue-600 to-indigo-700 flex-col justify-between p-10">
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <span className="text-white text-xl font-bold">Crunch</span>
          </div>

          <h2 className="text-white text-2xl font-bold leading-snug mb-3">
            Your financial survival dashboard starts here.
          </h2>
          <p className="text-blue-200 text-sm leading-relaxed mb-10">
            Built for gig workers and variable income earners. We plan for your worst months, not your best.
          </p>

          {/* Step list */}
          <div className="space-y-4">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
                  i < step ? 'bg-white text-blue-600'
                  : i === step ? 'bg-white text-blue-600 ring-4 ring-white/30'
                  : 'bg-white/20 text-white/60'
                }`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <div>
                  <p className={`text-sm font-semibold transition-all ${i === step ? 'text-white' : i < step ? 'text-blue-200' : 'text-white/50'}`}>{s}</p>
                  {i === step && <p className="text-xs text-blue-300 mt-0.5">Current step</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-blue-300 text-xs">
          🔒 Your data is stored locally in your browser and never sent to any server.
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-200 bg-white">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="font-bold text-gray-900">Crunch</span>
          </div>
          {/* Mobile step counter */}
          <div className="lg:hidden text-sm text-gray-500">Step {step + 1} of {STEPS.length}</div>
          {/* Desktop step label */}
          <div className="hidden lg:block">
            <span className="text-sm text-gray-500">Step {step + 1} of {STEPS.length}</span>
          </div>
          {/* Mobile progress bar */}
          <div className="hidden lg:flex flex-1 mx-8 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Form body */}
        <div className="flex-1 flex items-start justify-center px-8 py-10">
          <div className={`w-full ${step === 2 ? 'max-w-4xl' : 'max-w-2xl'}`}>
            <div className="mb-8">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-2">{STEPS[step]}</p>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {step === 0 && 'Tell us about yourself'}
                {step === 1 && 'What kind of work do you do?'}
                {step === 2 && 'Upload your bank statements'}
              </h1>
              <p className="text-gray-500">{stepDescriptions[step]}</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
              {step === 0 && <Step0 data={personal} onChange={setPersonal} />}
              {step === 1 && <Step1 data={profile} onChange={setProfile} />}
              {step === 2 && (
                <Step3
                  income={income}
                  financials={financials}
                  onIncomeChange={setIncome}
                  onFinancialsChange={setFinancials}
                  onSpendingExtracted={setSpendingBreakdown}
                  onMonthlySpendingExtracted={setMonthlySpending}
                />
              )}
            </div>

            {/* Nav buttons */}
            <div className="flex justify-between items-center mt-6">
              <button
                onClick={() => setStep(s => s - 1)}
                disabled={step === 0}
                className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all bg-white"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              {step < STEPS.length - 1 ? (
                <button
                  onClick={() => setStep(s => s + 1)}
                  className="flex items-center gap-2 px-7 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
                >
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleFinish}
                  className="flex items-center gap-2 px-7 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-md"
                >
                  Build My Dashboard <Zap className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
