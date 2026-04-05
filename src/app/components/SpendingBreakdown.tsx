import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card } from './ui/card';

export interface SpendingCategory {
  name: string;
  amount: number;
  color: string;
}

interface SpendingBreakdownProps {
  data: SpendingCategory[];
}

export function SpendingBreakdown({ data }: SpendingBreakdownProps) {
  const total = data.reduce((sum, item) => sum + item.amount, 0);

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Spending Breakdown</h2>
      <div className="h-64 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="amount"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-2">
        {data.map((category, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: category.color }}
              />
              <span className="text-sm">{category.name}</span>
            </div>
            <span className="font-medium">${category.amount.toFixed(2)}</span>
          </div>
        ))}
        <div className="pt-2 mt-2 border-t flex justify-between font-semibold">
          <span>Total Spending</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>
    </Card>
  );
}
