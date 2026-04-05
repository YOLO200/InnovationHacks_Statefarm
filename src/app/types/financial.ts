export type WorkType = 'rideshare' | 'delivery' | 'freelance' | 'contract';
export type IncomeFrequency = 'daily' | 'weekly' | 'mixed';
export type DependencyAsset = 'car' | 'laptop' | 'phone' | 'physical' | 'none';
export type RiskLevel = 'low' | 'medium' | 'high';

export interface WorkProfile {
  work_type: WorkType;
  income_frequency: IncomeFrequency;
  income_dependency_asset: DependencyAsset;
}

export interface IncomeData {
  avg_monthly_income: number;
  low_monthly_income: number;
  high_monthly_income: number;
}

export interface SpendingBreakdown {
  housing: number;
  food: number;
  gas: number;
  maintenance: number;
  phone: number;
  insurance: number;
  debt: number;
  other: number;
}

export interface FinancialSnapshot {
  savings: number;
  fixed_expenses: number;
  debt_payments: number;
  has_insurance: boolean;
  spending_breakdown: SpendingBreakdown;
}

export interface DerivedMetrics {
  income_volatility_score: number;   // (high - low) / avg
  safe_monthly_budget: number;       // low_income - fixed_expenses
  risk_level: RiskLevel;
  cash_runway_days: number;          // savings / (fixed_expenses / 30), based on LOW income
  financial_health_score: number;    // 0–100
}

export interface MonthlySpending {
  month: string;          // e.g. "June 2024"
  breakdown: SpendingBreakdown;
}

export interface GigWorkerData {
  profile: WorkProfile;
  income: IncomeData;
  financials: FinancialSnapshot;
  derived: DerivedMetrics;
  monthly_spending: MonthlySpending[]; // all months from uploaded statements, newest first
}
