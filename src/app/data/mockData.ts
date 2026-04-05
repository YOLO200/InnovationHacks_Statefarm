import type { GigWorkerData } from '../types/financial';

export const mockGigWorker: GigWorkerData = {
  personal: {
    name: 'Alex Rivera',
    age: '31',
    email: 'alex@example.com',
    phone: '(555) 000-0000',
    housing: 'rent',
  },
  profile: {
    work_type: 'rideshare',
    income_frequency: 'daily',
    income_dependency_asset: 'car',
  },
  income: {
    avg_monthly_income: 2800,
    low_monthly_income: 1600,
    high_monthly_income: 4200,
  },
  financials: {
    savings: 1200,
    fixed_expenses: 1850,
    debt_payments: 280,
    has_insurance: false,
    spending_breakdown: {
      housing: 800,
      food: 320,
      gas: 310,
      maintenance: 140,
      phone: 80,
      insurance: 0,
      debt: 280,
      other: 120,
    },
  },
  derived: {
    income_volatility_score: (4200 - 1600) / 2800, // 0.93
    safe_monthly_budget: 1600 - 1850,              // -250 (deficit)
    risk_level: 'high',
    cash_runway_days: Math.round(1200 / (1850 / 30)), // ~19 days
    financial_health_score: 28,
  },
  monthly_spending: [],
};
