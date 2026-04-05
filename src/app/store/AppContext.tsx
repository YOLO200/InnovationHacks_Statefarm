import { createContext, useContext, useState, ReactNode } from 'react';
import type {
  GigWorkerData, WorkProfile, IncomeData, FinancialSnapshot,
  DerivedMetrics, RiskLevel, SpendingBreakdown, WorkType,
} from '../types/financial';

// ─── DERIVED METRICS ──────────────────────────────────────────────────────────
export function computeDerived(income: IncomeData, financials: FinancialSnapshot): DerivedMetrics {
  const { avg_monthly_income, low_monthly_income, high_monthly_income } = income;
  const { savings, fixed_expenses } = financials;

  const volatility = (high_monthly_income - low_monthly_income) / avg_monthly_income;
  const safeBudget = low_monthly_income - fixed_expenses;
  const runwayDays = fixed_expenses > 0 ? Math.round(savings / (fixed_expenses / 30)) : 0;

  const riskLevel: RiskLevel =
    volatility > 0.5 || safeBudget < 0 ? 'high'
    : volatility > 0.3 || safeBudget < fixed_expenses * 0.2 ? 'medium'
    : 'low';

  // Health score (0–100)
  const runwayScore = Math.min((runwayDays / 90) * 35, 35);          // 35 pts → 3-month runway
  const volatilityScore = Math.max(25 - volatility * 25, 0);         // 25 pts → zero volatility
  const cushionScore = Math.min((savings / fixed_expenses) * 20, 20); // 20 pts → 1 month saved
  const insuranceScore = financials.has_insurance ? 20 : 0;           // 20 pts → insured
  const healthScore = Math.min(Math.round(runwayScore + volatilityScore + cushionScore + insuranceScore), 100);

  return { income_volatility_score: volatility, safe_monthly_budget: safeBudget, risk_level: riskLevel, cash_runway_days: runwayDays, financial_health_score: healthScore };
}

// ─── SPENDING BREAKDOWN ESTIMATOR ─────────────────────────────────────────────
export function estimateSpending(
  work_type: WorkType,
  fixed_expenses: number,
  debt_payments: number,
  has_insurance: boolean,
): SpendingBreakdown {
  const base = fixed_expenses - debt_payments;
  const isDriver = work_type === 'rideshare' || work_type === 'delivery';
  const insurance = has_insurance ? Math.round(base * 0.08) : 0;
  const gas = isDriver ? Math.round(base * 0.18) : Math.round(base * 0.07);
  const maintenance = isDriver ? Math.round(base * 0.08) : Math.round(base * 0.02);
  const phone = Math.round(base * 0.05);
  const food = Math.round(base * 0.18);
  const housing = Math.round(base * 0.46);
  const other = Math.max(base - housing - food - gas - maintenance - phone - insurance, 0);

  return { housing, food, gas, maintenance, phone, insurance, debt: debt_payments, other };
}

// ─── CONTEXT ──────────────────────────────────────────────────────────────────
interface AppContextType {
  userData: GigWorkerData | null;
  isOnboarded: boolean;
  setUserData: (profile: WorkProfile, income: IncomeData, financials: FinancialSnapshot, realSpending?: SpendingBreakdown) => void;
  resetData: () => void;
}

const AppContext = createContext<AppContextType | null>(null);
const STORAGE_KEY = 'lifeshock_user_data';

export function AppProvider({ children }: { children: ReactNode }) {
  const [userData, setUserDataState] = useState<GigWorkerData | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? (JSON.parse(stored) as GigWorkerData) : null;
    } catch { return null; }
  });

  const setUserData = (profile: WorkProfile, income: IncomeData, financials: FinancialSnapshot, realSpending?: SpendingBreakdown) => {
    // Use real spending from bank statements if available, otherwise estimate from work type
    const spending = realSpending ?? estimateSpending(profile.work_type, financials.fixed_expenses, financials.debt_payments, financials.has_insurance);
    const fullFinancials: FinancialSnapshot = { ...financials, spending_breakdown: spending };
    const derived = computeDerived(income, fullFinancials);
    const data: GigWorkerData = { profile, income, financials: fullFinancials, derived };
    setUserDataState(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  const resetData = () => {
    setUserDataState(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AppContext.Provider value={{ userData, isOnboarded: !!userData, setUserData, resetData }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppData must be used within AppProvider');
  return ctx;
}
