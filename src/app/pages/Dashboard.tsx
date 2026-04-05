import { useAppData } from '../store/AppContext';
import { mockGigWorker } from '../data/mockData';
import { FinancialHealthScore } from '../components/dashboard/FinancialHealthScore';
import { AIInsights } from '../components/dashboard/AIInsights';

export function Dashboard() {
  const { userData } = useAppData();
  const data = userData ?? mockGigWorker;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <FinancialHealthScore data={data} />

      <AIInsights data={data} />
    </div>
  );
}
