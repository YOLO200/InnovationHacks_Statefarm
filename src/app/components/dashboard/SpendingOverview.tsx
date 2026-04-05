import { Card } from '../ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Home, ShoppingBag, Car, Smartphone, MoreHorizontal, ArrowRight } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '../ui/button';

const spendingData = [
  { name: 'Rent', amount: 800, color: '#3b82f6', icon: Home },
  { name: 'Food', amount: 400, color: '#10b981', icon: ShoppingBag },
  { name: 'Transport', amount: 200, color: '#f59e0b', icon: Car },
  { name: 'Subscriptions', amount: 200, color: '#ec4899', icon: Smartphone },
  { name: 'Misc', amount: 400, color: '#6b7280', icon: MoreHorizontal },
];

export function SpendingOverview() {
  const total = spendingData.reduce((sum, item) => sum + item.amount, 0);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Where Your Money Goes</h2>
        <Link to="/dashboard/spending">
          <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
            View Details
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-6">
        {/* Compact Donut Chart */}
        <div className="w-40 h-40 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={spendingData}
                dataKey="amount"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={2}
              >
                {spendingData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Compact List */}
        <div className="flex-1 space-y-2">
          {spendingData.map((item, index) => {
            const Icon = item.icon;
            const percentage = ((item.amount / total) * 100).toFixed(0);
            
            return (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-gray-700">{item.name}</span>
                  <span className="text-xs text-gray-500">{percentage}%</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">${item.amount}</span>
              </div>
            );
          })}
          <div className="pt-2 border-t flex justify-between">
            <span className="text-sm font-semibold text-gray-900">Total</span>
            <span className="text-sm font-bold text-gray-900">${total}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
