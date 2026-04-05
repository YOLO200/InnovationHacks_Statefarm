import { useState } from 'react';
import { Card } from '../ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Home, ShoppingBag, Car, Smartphone, Wrench, Shield, CreditCard, MoreHorizontal, ChevronDown } from 'lucide-react';
import type { GigWorkerData, SpendingBreakdown } from '../../types/financial';

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

interface Props { data: GigWorkerData; showDropdown?: boolean; }

export function SpendingAnalysis({ data, showDropdown = false }: Props) {
  const hasMonthly = showDropdown && data.monthly_spending && data.monthly_spending.length > 0;
  const [selectedMonth, setSelectedMonth] = useState<string>(
    hasMonthly ? data.monthly_spending[0].month : ''
  );
  const [hovered, setHovered] = useState<{ label: string; amount: number; color: string } | null>(null);

  const breakdown: SpendingBreakdown = hasMonthly
    ? (data.monthly_spending.find(m => m.month === selectedMonth)?.breakdown ?? data.financials.spending_breakdown)
    : (data.monthly_spending?.length > 0 ? data.monthly_spending[0].breakdown : data.financials.spending_breakdown);

  const items = CATEGORY_META
    .map(m => ({ ...m, amount: breakdown[m.key] }))
    .filter(m => m.amount > 0);

  const total = items.reduce((s, i) => s + i.amount, 0);

  // ── SPENDING PAGE: large side-by-side layout ──────────────────────────────
  if (showDropdown) {
    return (
      <Card className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Spending Breakdown</h2>
            <p className="text-sm text-gray-500 mt-0.5">Where your money is going</p>
          </div>
          {hasMonthly ? (
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="appearance-none text-sm text-gray-700 bg-gray-100 px-4 py-2 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer font-medium"
              >
                {data.monthly_spending.map(m => (
                  <option key={m.month} value={m.month}>{m.month}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          ) : (
            <span className="text-sm text-gray-400 bg-gray-100 px-3 py-1.5 rounded-xl">Last month</span>
          )}
        </div>

        {/* Side-by-side: donut left, legend right */}
        <div className="flex gap-10 items-center">
          {/* Large donut */}
          <div className="flex-shrink-0 flex flex-col items-center">
            <div className="relative">
              <ResponsiveContainer width={300} height={300}>
                <PieChart>
                  <Pie
                    data={items}
                    dataKey="amount"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={135}
                    paddingAngle={2}
                    onMouseEnter={(_, i) => setHovered({ label: items[i].label, amount: items[i].amount, color: items[i].color })}
                    onMouseLeave={() => setHovered(null)}
                  >
                    {items.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                {hovered ? (
                  <>
                    <span className="text-2xl font-bold" style={{ color: hovered.color }}>
                      ${hovered.amount.toLocaleString()}
                    </span>
                    <span className="text-sm font-medium text-gray-500 mt-0.5">{hovered.label}</span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl font-bold text-gray-900">${total.toLocaleString()}</span>
                    <span className="text-sm text-gray-400 mt-0.5">total</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-3">
            {items.map((item, i) => {
              const Icon = item.icon;
              const pct = total > 0 ? ((item.amount / total) * 100) : 0;
              const isHovered = hovered?.label === item.label;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-4 p-3 rounded-xl transition-colors cursor-default ${isHovered ? 'bg-gray-50' : ''}`}
                  onMouseEnter={() => setHovered({ label: item.label, amount: item.amount, color: item.color })}
                  onMouseLeave={() => setHovered(null)}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${item.color}18` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: item.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-gray-800">{item.label}</span>
                      <span className="text-sm font-bold text-gray-900">${item.amount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: item.color }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 w-8 text-right">{pct.toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    );
  }

  // ── DASHBOARD: compact stacked layout ────────────────────────────────────
  return (
    <Card className="p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Spending Breakdown</h2>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">Last month</span>
      </div>

      <div className="flex flex-col items-center mb-4">
        <div className="relative">
          <ResponsiveContainer width={160} height={160}>
            <PieChart>
              <Pie
                data={items}
                dataKey="amount"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={42}
                outerRadius={70}
                paddingAngle={2}
                onMouseEnter={(_, i) => setHovered({ label: items[i].label, amount: items[i].amount, color: items[i].color })}
                onMouseLeave={() => setHovered(null)}
              >
                {items.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-base font-bold text-gray-900">${total.toLocaleString()}</span>
            <span className="text-xs text-gray-400">total</span>
          </div>
        </div>
        <div className="h-5 flex items-center justify-center">
          {hovered ? (
            <span className="text-xs font-semibold" style={{ color: hovered.color }}>
              {hovered.label}: ${hovered.amount.toLocaleString()}
            </span>
          ) : (
            <span className="text-xs text-gray-300">hover a slice</span>
          )}
        </div>
      </div>

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
