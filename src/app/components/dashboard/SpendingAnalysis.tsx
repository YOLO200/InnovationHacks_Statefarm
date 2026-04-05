import { Card } from '../ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Home, ShoppingBag, Car, Smartphone, MoreHorizontal, Sparkles } from 'lucide-react';

const spendingData = [
  { name: 'Rent', amount: 800, color: '#3b82f6', icon: Home },
  { name: 'Food', amount: 400, color: '#10b981', icon: ShoppingBag },
  { name: 'Transport', amount: 200, color: '#f59e0b', icon: Car },
  { name: 'Subscriptions', amount: 200, color: '#ec4899', icon: Smartphone },
  { name: 'Misc', amount: 400, color: '#6b7280', icon: MoreHorizontal },
];

export function SpendingAnalysis() {
  const total = spendingData.reduce((sum, item) => sum + item.amount, 0);

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Where Your Money Goes</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left - Donut Chart */}
        <div className="flex items-center justify-center">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={spendingData}
                dataKey="amount"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
              >
                {spendingData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `$${value}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Right - List */}
        <div className="space-y-3">
          {spendingData.map((item, index) => {
            const Icon = item.icon;
            const percentage = ((item.amount / total) * 100).toFixed(0);
            
            return (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${item.color}20` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: item.color }} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-500">{percentage}% of total</p>
                  </div>
                </div>
                <p className="text-lg font-bold text-gray-900">
                  ${item.amount}
                </p>
              </div>
            );
          })}

          <div className="pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-900">Total Monthly</span>
              <span className="text-xl font-bold text-gray-900">${total}</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Insight */}
      <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <Sparkles className="w-4 h-4 text-yellow-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900 mb-1">AI Insight</p>
            <p className="text-sm text-gray-700">
              You are overspending on subscriptions. Reducing this by 50% can extend your runway by{' '}
              <span className="font-semibold text-yellow-700">2 weeks</span>.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
