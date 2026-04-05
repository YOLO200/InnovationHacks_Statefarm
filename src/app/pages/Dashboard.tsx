import { useAppData } from '../store/AppContext';
import { mockGigWorker } from '../data/mockData';
import { FinancialHealthScore } from '../components/dashboard/FinancialHealthScore';
import { CashRunway } from '../components/dashboard/CashRunway';
import { IncomeStabilityCard } from '../components/dashboard/IncomeStabilityCard';
import { SafeBudgetIndicator } from '../components/dashboard/SafeBudgetIndicator';
import { AIInsights } from '../components/dashboard/AIInsights';

export function Dashboard() {
  const { userData } = useAppData();
  const data = userData ?? mockGigWorker;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <FinancialHealthScore data={data} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CashRunway data={data} />
        <IncomeStabilityCard data={data} />
      </div>

      <SafeBudgetIndicator data={data} />

      <AIInsights data={data} />
    </div>
  );
}
