import { Card } from '../ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Home, ShoppingBag, Car, Smartphone, Wrench, Shield, CreditCard, MoreHorizontal } from 'lucide-react';
import type { GigWorkerData } from '../../types/financial';

const CATEGORY_META = [
  { key: 'housing',     label: 'Housing',     color: '#3b82f6', icon: Home },
  { key: 'food',        label: 'Food',        color: '#10b981', icon: ShoppingBag },
  { key: 'gas',         label: 'Gas',         color: '#f59e0b', icon: Car },
  { key: 'maintenance', label: 'Maintenance', color: '#f97316', icon: Wrench },
  { key: 'phone',       label: 'Phone',       color: '#8b5cf6', icon: Smartphone },
  { key: 'insurance',   label: 'Insurance',   color: '#06b6d4', icon: Shield },
  { key: 'debt',        label: 'Debt',        color: '#ef4444', icon: CreditCard },
  { key: 'other',       label: 'Other',       color: '#6b7280', icon: MoreHorizontal },
] as const;

interface Props { data: GigWorkerData; }

export function SpendingAnalysis({ data }: Props) {
  const breakdown = data.financials.spending_breakdown;
  const items = CATEGORY_META
    .map(m => ({ ...m, amount: breakdown[m.key] }))
    .filter(m => m.amount > 0);

  const total = items.reduce((s, i) => s + i.amount, 0);

  return (
    <Card className="p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Spending Breakdown</h2>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">Last month</span>
      </div>

      {/* Compact donut */}
      <div className="flex items-center justify-center mb-4">
        <div className="relative">
          <ResponsiveContainer width={160} height={160}>
            <PieChart>
              <Pie data={items} dataKey="amount" nameKey="label" cx="50%" cy="50%" innerRadius={42} outerRadius={70} paddingAngle={2}>
                {items.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v: number) => [`$${v}`, '']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-base font-bold text-gray-900">${total.toLocaleString()}</span>
            <span className="text-xs text-gray-400">total</span>
          </div>
        </div>
      </div>

      {/* Compact category list */}
      <div className="space-y-1.5 flex-1">
        {items.map((item, i) => {
          const Icon = item.icon;
          const pct = total > 0 ? ((item.amount / total) * 100).toFixed(0) : '0';
          return (
            <div key={i} className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${item.color}18` }}>
                <Icon className="w-3.5 h-3.5" style={{ color: item.color }} />
              </div>
              <span className="text-xs text-gray-600 flex-1">{item.label}</span>
              <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: item.color }} />
              </div>
              <span className="text-xs font-semibold text-gray-800 w-12 text-right">${item.amount}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
