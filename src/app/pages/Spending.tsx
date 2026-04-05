import { useAppData } from '../store/AppContext';
import { mockGigWorker } from '../data/mockData';
import { SpendingAnalysis } from '../components/dashboard/SpendingAnalysis';

export function Spending() {
  const { userData } = useAppData();
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Spending Analysis</h1>
        <p className="text-gray-500 text-sm">Detailed breakdown of your monthly expenses.</p>
      </div>
      <SpendingAnalysis data={userData ?? mockGigWorker} showDropdown />
    </div>
  );
}
