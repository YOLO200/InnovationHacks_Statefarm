import { Card } from '../ui/card';
import { Progress } from '../ui/progress';
import { Shield, AlertCircle, CheckCircle } from 'lucide-react';

const coverage = [
  { name: 'Life Insurance', covered: true },
  { name: 'Auto Insurance', covered: true },
  { name: 'Health Insurance', covered: false },
  { name: 'Disability Coverage', covered: false },
];

export function InsuranceCoverage() {
  const coveragePercentage = (coverage.filter(c => c.covered).length / coverage.length) * 100;

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">Your Protection Level</h2>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Coverage Progress</span>
          <span className="text-lg font-bold text-gray-900">{coveragePercentage}% Covered</span>
        </div>
        <Progress value={coveragePercentage} className="h-3" />
      </div>

      <div className="space-y-3">
        {coverage.map((item, index) => (
          <div
            key={index}
            className={`flex items-center justify-between p-3 rounded-xl ${
              item.covered ? 'bg-green-50' : 'bg-red-50'
            }`}
          >
            <div className="flex items-center gap-3">
              {item.covered ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <span className={`font-medium ${item.covered ? 'text-gray-900' : 'text-gray-700'}`}>
                {item.name}
              </span>
            </div>
            {!item.covered && (
              <span className="text-sm font-medium text-red-600">Missing ⚠️</span>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
        <p className="text-sm text-gray-700">
          <span className="font-semibold">Recommendation:</span> Adding health and disability coverage
          would improve your protection to 100%.
        </p>
      </div>
    </Card>
  );
}
