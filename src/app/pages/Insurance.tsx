import { DetailedCoverage } from '../components/insurance/DetailedCoverage';
import { InsuranceChecker } from '../components/insurance/InsuranceChecker';

export function Insurance() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Insurance Center</h1>
        <p className="text-gray-600">
          Manage your coverage and check insurance documents for errors.
        </p>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Detailed Coverage */}
        <DetailedCoverage />

        {/* Right Column - Insurance Checker */}
        <InsuranceChecker />
      </div>
    </div>
  );
}
