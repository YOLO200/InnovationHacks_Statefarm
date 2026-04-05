import { Card } from '../ui/card';
import { Shield, CheckCircle2, AlertCircle, XCircle, TrendingUp } from 'lucide-react';
import { Progress } from '../ui/progress';

interface CoverageItem {
  type: string;
  status: 'covered' | 'partial' | 'none';
  coverage: number;
  details: string;
  monthlyPremium?: number;
}

const coverageData: CoverageItem[] = [
  {
    type: 'Health Insurance',
    status: 'partial',
    coverage: 60,
    details: 'Basic plan, $2,500 deductible',
    monthlyPremium: 250,
  },
  {
    type: 'Life Insurance',
    status: 'covered',
    coverage: 100,
    details: '$500,000 term life policy',
    monthlyPremium: 45,
  },
  {
    type: 'Disability Insurance',
    status: 'none',
    coverage: 0,
    details: 'No coverage - High risk!',
  },
  {
    type: 'Auto Insurance',
    status: 'covered',
    coverage: 100,
    details: 'Full coverage with $500 deductible',
    monthlyPremium: 120,
  },
  {
    type: 'Homeowners/Renters',
    status: 'partial',
    coverage: 50,
    details: 'Basic renters insurance',
    monthlyPremium: 25,
  },
  {
    type: 'Umbrella Policy',
    status: 'none',
    coverage: 0,
    details: 'Recommended for added protection',
  },
];

export function DetailedCoverage() {
  const totalCoverage = Math.round(
    coverageData.reduce((sum, item) => sum + item.coverage, 0) / coverageData.length
  );
  const totalMonthlyPremium = coverageData.reduce(
    (sum, item) => sum + (item.monthlyPremium || 0),
    0
  );

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'covered':
        return {
          icon: CheckCircle2,
          color: 'text-green-600',
          bg: 'bg-green-50',
          border: 'border-green-200',
          label: 'Fully Covered',
        };
      case 'partial':
        return {
          icon: AlertCircle,
          color: 'text-yellow-600',
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          label: 'Partial Coverage',
        };
      default:
        return {
          icon: XCircle,
          color: 'text-red-600',
          bg: 'bg-red-50',
          border: 'border-red-200',
          label: 'No Coverage',
        };
    }
  };

  const getProtectionLevel = (coverage: number) => {
    if (coverage >= 80) return { label: 'Excellent', color: 'text-green-600', bg: 'bg-green-600' };
    if (coverage >= 60) return { label: 'Good', color: 'text-blue-600', bg: 'bg-blue-600' };
    if (coverage >= 40) return { label: 'Fair', color: 'text-yellow-600', bg: 'bg-yellow-600' };
    return { label: 'At Risk', color: 'text-red-600', bg: 'bg-red-600' };
  };

  const protectionLevel = getProtectionLevel(totalCoverage);

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Shield className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Insurance Coverage</h2>
            <p className="text-sm text-gray-600">Your complete protection overview</p>
          </div>
        </div>
      </div>

      {/* Overall Protection Score */}
      <div className="mb-6 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm text-gray-600 mb-1">Overall Protection Level</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">{totalCoverage}%</span>
              <span className={`text-sm font-semibold ${protectionLevel.color}`}>
                {protectionLevel.label}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600 mb-1">Monthly Premium</p>
            <p className="text-2xl font-bold text-blue-600">${totalMonthlyPremium}</p>
          </div>
        </div>
        <Progress value={totalCoverage} className="h-3" />
        <p className="text-xs text-gray-600 mt-2">
          {totalCoverage < 70
            ? '⚠️ Critical gaps in coverage detected - review recommendations below'
            : totalCoverage < 85
            ? '💡 Good coverage, but consider filling gaps for complete protection'
            : '✅ Excellent coverage! You\'re well protected against life shocks'}
        </p>
      </div>

      {/* Coverage Breakdown */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Coverage Breakdown</h3>
        {coverageData.map((item, index) => {
          const config = getStatusConfig(item.status);
          const StatusIcon = config.icon;

          return (
            <div
              key={index}
              className={`p-4 rounded-xl border ${config.border} ${config.bg} transition-all hover:shadow-md`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 flex-1">
                  <StatusIcon className={`w-5 h-5 ${config.color}`} />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{item.type}</h4>
                    <p className="text-sm text-gray-600">{item.details}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${config.color}`}>{item.coverage}%</p>
                  {item.monthlyPremium && (
                    <p className="text-xs text-gray-600">${item.monthlyPremium}/mo</p>
                  )}
                </div>
              </div>
              
              {/* Coverage Progress */}
              <div className="mt-2">
                <div className="h-1.5 bg-white rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      item.status === 'covered'
                        ? 'bg-green-500'
                        : item.status === 'partial'
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    } transition-all`}
                    style={{ width: `${item.coverage}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Recommendations */}
      <div className="mt-6 p-4 bg-purple-50 rounded-xl border border-purple-200">
        <div className="flex items-start gap-3">
          <TrendingUp className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-gray-900 mb-1">AI Recommendations</h4>
            <ul className="space-y-1 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-purple-600">•</span>
                <span>Consider disability insurance - protects 60% of income if unable to work</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600">•</span>
                <span>Upgrade health insurance to reduce out-of-pocket risk during emergencies</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600">•</span>
                <span>Umbrella policy could save $500k+ in liability protection for just $20/mo</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Card>
  );
}
