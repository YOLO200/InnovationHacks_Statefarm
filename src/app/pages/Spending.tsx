import { useState } from "react";
import { useAppData } from "../store/AppContext";
import type { SpendingBreakdown, WorkType } from "../types/financial";

function fmt(n: number) {
  return n.toLocaleString();
}

// ─── ESSENTIAL ITEMS ──────────────────────────────────────────────────────────
const FOOD_ESSENTIAL = 0.6; // 60% of food = groceries

type SpendItem = {
  key: string;
  label: string;
  desc: string;
  icon: string;
  iconBg: string;
  barColor: string;
  amount: number;
};
type CutItem = SpendItem & { cutTag: string };

function buildEssential(bd: SpendingBreakdown, wt: WorkType): SpendItem[] {
  const isDriver = wt === "rideshare" || wt === "delivery";
  const groceries = Math.round(bd.food * FOOD_ESSENTIAL);
  return [
    bd.housing > 0 && {
      key: "housing",
      label: "Rent / Mortgage",
      desc: "Your housing — non-negotiable",
      icon: "🏠",
      iconBg: "#fee2e2",
      barColor: "#3b82f6",
      amount: bd.housing,
    },
    bd.debt > 0 && {
      key: "debt",
      label: isDriver ? "Car payment" : "Debt payments",
      desc: isDriver ? "Your work vehicle payment" : "Monthly loan obligations",
      icon: isDriver ? "🚗" : "💳",
      iconBg: "#fef3c7",
      barColor: "#f97316",
      amount: bd.debt,
    },
    bd.gas > 0 && {
      key: "gas",
      label: "Gas",
      desc: isDriver ? "Your job runs on this" : "Transportation fuel",
      icon: "⛽",
      iconBg: "#fef9c3",
      barColor: "#f59e0b",
      amount: bd.gas,
    },
    bd.phone > 0 && {
      key: "phone",
      label: "Phone & data plan",
      desc: isDriver ? "Required to accept rides" : "Work communication",
      icon: "📱",
      iconBg: "#eff6ff",
      barColor: "#8b5cf6",
      amount: bd.phone,
    },
    bd.insurance > 0 && {
      key: "insurance",
      label: isDriver ? "Car insurance" : "Insurance",
      desc: isDriver ? "Required to drive" : "Required coverage",
      icon: "🛡️",
      iconBg: "#f0fdf4",
      barColor: "#22c55e",
      amount: bd.insurance,
    },
    bd.maintenance > 0 && {
      key: "maintenance",
      label: "Vehicle maintenance",
      desc: isDriver
        ? "Oil changes & repairs — keeps you earning"
        : "Equipment upkeep",
      icon: "🔧",
      iconBg: "#fff7ed",
      barColor: "#f97316",
      amount: bd.maintenance,
    },
    groceries > 0 && {
      key: "groceries",
      label: "Groceries",
      desc: "Home cooking — food essentials",
      icon: "🛒",
      iconBg: "#ecfdf5",
      barColor: "#10b981",
      amount: groceries,
    },
  ].filter((x): x is SpendItem => !!x && x.amount > 0);
}

function buildNonEssential(bd: SpendingBreakdown): CutItem[] {
  const dining = Math.round(bd.food * (1 - FOOD_ESSENTIAL));
  const items: CutItem[] = [];

  if (dining > 0) {
    items.push({
      key: "dining",
      label: "Dining out & delivery",
      desc: "Restaurants, food delivery apps",
      icon: "🍔",
      iconBg: "#fef2f2",
      barColor: "#ef4444",
      amount: dining,
      cutTag: "Cut first",
    });
  }
  if (bd.other > 0) {
    if (bd.other > 80) {
      const ent = Math.round(bd.other * 0.6);
      const sub = bd.other - ent;
      if (ent > 0)
        items.push({
          key: "entertainment",
          label: "Entertainment",
          desc: "Streaming, gaming, outings",
          icon: "🎮",
          iconBg: "#faf5ff",
          barColor: "#8b5cf6",
          amount: ent,
          cutTag: items.length === 0 ? "Cut first" : "Cut second",
        });
      if (sub > 0)
        items.push({
          key: "subscriptions",
          label: "Subscriptions",
          desc: "Monthly recurring services",
          icon: "📺",
          iconBg: "#f0f9ff",
          barColor: "#0ea5e9",
          amount: sub,
          cutTag: "Cut third",
        });
    } else {
      items.push({
        key: "other",
        label: "Entertainment & subscriptions",
        desc: "Non-essential recurring costs",
        icon: "🎮",
        iconBg: "#faf5ff",
        barColor: "#8b5cf6",
        amount: bd.other,
        cutTag: items.length === 0 ? "Cut first" : "Cut second",
      });
    }
  }
  return items;
}

// ─── SPEND ROW ────────────────────────────────────────────────────────────────
function SpendRow({
  item,
  pctLabel,
  barPct,
  tagLabel,
  tagStyle,
}: {
  item: SpendItem;
  pctLabel: number;
  barPct: number;
  tagLabel: string;
  tagStyle: React.CSSProperties;
}) {
  return (
    <div className="flex items-center gap-3 px-[18px] py-3 border-b border-slate-100 last:border-b-0">
      {/* Icon */}
      <div
        className="w-[34px] h-[34px] rounded-lg flex items-center justify-center text-[15px] flex-shrink-0"
        style={{ backgroundColor: item.iconBg }}
      >
        {item.icon}
      </div>
      {/* Name */}
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-slate-900 leading-snug">
          {item.label}
        </div>
        <div className="text-[11px] text-slate-400 leading-snug">
          {item.desc}
        </div>
      </div>
      {/* Bar */}
      <div className="w-[130px] flex-shrink-0">
        <div className="h-[5px] bg-slate-100 rounded-full overflow-hidden mb-0.5">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.max(2, Math.min(100, barPct))}%`,
              backgroundColor: item.barColor,
            }}
          />
        </div>
        <div className="text-[10px] text-slate-400 text-right">{pctLabel}%</div>
      </div>
      {/* Amount */}
      <div className="text-[14px] font-bold text-slate-900 min-w-[64px] text-right">
        ${fmt(item.amount)}
      </div>
      {/* Tag */}
      <span
        className="text-[10px] font-semibold px-2 py-[3px] rounded-full flex-shrink-0"
        style={tagStyle}
      >
        {tagLabel}
      </span>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export function Spending() {
  const { userData } = useAppData();

  const hasMonths = (userData?.monthly_spending?.length ?? 0) > 0;
  // Display months oldest → newest in tabs
  const monthsAsc = hasMonths ? [...userData!.monthly_spending].reverse() : [];

  const [selectedMonth, setSelectedMonth] = useState(
    hasMonths ? monthsAsc[monthsAsc.length - 1].month : "",
  );

  if (!userData) return null;

  const { financials, income, derived, profile, monthly_spending } = userData;

  // Get breakdown for selected month
  const bd: SpendingBreakdown = hasMonths
    ? (monthly_spending.find((m) => m.month === selectedMonth)?.breakdown ??
      financials.spending_breakdown)
    : financials.spending_breakdown;

  const essential = buildEssential(bd, profile.work_type);
  const nonEssential = buildNonEssential(bd);

  const totalEssential = essential.reduce((s, i) => s + i.amount, 0);
  const totalNonEssential = nonEssential.reduce((s, i) => s + i.amount, 0);
  const total = totalEssential + totalNonEssential;
  const essentialPct =
    total > 0 ? Math.round((totalEssential / total) * 100) : 0;

  // Runway extension if all non-essentials cut
  const crisisFloor = Math.max(1, totalEssential);
  const currentRunwayWeeks = Math.round(derived.cash_runway_days / 7);
  const extendedRunwayDays =
    crisisFloor > 0 ? Math.round(financials.savings / (crisisFloor / 30)) : 0;
  const extendedRunwayWeeks = Math.round(extendedRunwayDays / 7);

  const keepStyle: React.CSSProperties = {
    background: "#fef2f2",
    color: "#991b1b",
  };
  const cutStyle: React.CSSProperties = {
    background: "#f0fdf4",
    color: "#15803d",
  };

  return (
    <div className="p-7 max-w-5xl mx-auto">
      {/* ── Month tabs ── */}
      {hasMonths && (
        <div className="flex gap-1.5 mb-5 flex-wrap">
          {monthsAsc.map((m) => (
            <button
              key={m.month}
              onClick={() => setSelectedMonth(m.month)}
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold border-[1.5px] transition-all cursor-pointer"
              style={
                selectedMonth === m.month
                  ? {
                      background: "#2d3dbd",
                      color: "#fff",
                      borderColor: "#2d3dbd",
                    }
                  : {
                      background: "#fff",
                      color: "#64748b",
                      borderColor: "#e2e8f0",
                    }
              }
            >
              {m.month}
            </button>
          ))}
        </div>
      )}

      {/* ── Navy verdict banner ── */}
      <div
        className="rounded-2xl p-6 mb-5 text-white"
        style={{
          background: "linear-gradient(135deg,#2d3dbd 0%,#1a237e 100%)",
        }}
      >
        <h3 className="text-[18px] font-black mb-1 tracking-tight">
          In a crisis, you could free up ${fmt(totalNonEssential)}/mo
        </h3>
        <p
          className="text-[13px] mb-4 leading-relaxed"
          style={{ color: "rgba(255,255,255,0.7)" }}
        >
          That's your non-essential spending{" "}
          {selectedMonth ? `in ${selectedMonth}` : "this month"} — things you
          could cut if income stopped. Your essential costs are fixed and can't
          be reduced.
        </p>
        <div className="grid grid-cols-3 gap-2.5">
          {[
            {
              label: "Total spent",
              val: `$${fmt(total)}`,
              sub: selectedMonth || "This month",
              green: false,
            },
            {
              label: "Essential (can't cut)",
              val: `$${fmt(totalEssential)}`,
              sub: `${essentialPct}% of spending`,
              green: false,
            },
            {
              label: "You could save",
              val: `$${fmt(totalNonEssential)}`,
              sub: "in a crisis month",
              green: true,
            },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-lg p-3"
              style={{ background: "rgba(255,255,255,0.1)" }}
            >
              <div
                className="text-[10px] font-semibold uppercase tracking-wide mb-1"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                {s.label}
              </div>
              <div
                className="text-xl font-black"
                style={{ color: s.green ? "#4ade80" : "#fff" }}
              >
                {s.val}
              </div>
              <div
                className="text-[10px] mt-0.5"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                {s.sub}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Essential bucket ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-3.5 overflow-hidden">
        <div className="flex items-center justify-between px-[18px] py-3.5 border-b border-slate-100">
          <h3 className="text-[13px] font-bold flex items-center gap-2">
            <span className="text-base">🔴</span>
            Essential spending — these keep you working &amp; housed
          </h3>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[15px] font-black text-slate-900">
              ${fmt(totalEssential)}
            </span>
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
              Don't cut in crisis
            </span>
          </div>
        </div>
        {essential.map((item) => (
          <SpendRow
            key={item.key}
            item={item}
            pctLabel={total > 0 ? Math.round((item.amount / total) * 100) : 0}
            barPct={
              totalEssential > 0 ? (item.amount / totalEssential) * 100 : 0
            }
            tagLabel="Keep"
            tagStyle={keepStyle}
          />
        ))}
        {essential.length === 0 && (
          <div className="px-5 py-4 text-sm text-slate-400">
            No essential spending data found.
          </div>
        )}
      </div>

      {/* ── Non-essential bucket ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-3.5 overflow-hidden">
        <div className="flex items-center justify-between px-[18px] py-3.5 border-b border-slate-100">
          <h3 className="text-[13px] font-bold flex items-center gap-2">
            <span className="text-base">🟢</span>
            Non-essential spending — cut these first in a crisis
          </h3>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span
              className="text-[15px] font-black"
              style={{ color: "#15803d" }}
            >
              ${fmt(totalNonEssential)}
            </span>
            <span
              className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
              style={{
                background: "#f0fdf4",
                color: "#15803d",
                border: "1px solid #bbf7d0",
              }}
            >
              Crisis buffer
            </span>
          </div>
        </div>
        {nonEssential.length > 0 ? (
          nonEssential.map((item) => (
            <SpendRow
              key={item.key}
              item={item}
              pctLabel={
                totalNonEssential > 0
                  ? Math.round((item.amount / totalNonEssential) * 100)
                  : 0
              }
              barPct={
                totalNonEssential > 0
                  ? (item.amount / totalNonEssential) * 100
                  : 0
              }
              tagLabel={item.cutTag}
              tagStyle={cutStyle}
            />
          ))
        ) : (
          <div className="px-5 py-4 text-sm text-slate-400">
            Your spending appears to be all essentials — very lean budget.
          </div>
        )}
      </div>

      {/* ── Insight box ── */}
      <div
        className="rounded-xl p-4"
        style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}
      >
        <div
          className="text-[13px] font-bold mb-1"
          style={{ color: "#2d3dbd" }}
        >
          💡 If this month had been a crisis month
        </div>
        <div className="text-[13px] leading-relaxed text-slate-800">
          Cutting all non-essentials saves ${fmt(totalNonEssential)}/mo. That
          extends the time your savings would last from{" "}
          <strong>
            {currentRunwayWeeks} weeks → {extendedRunwayWeeks} weeks
          </strong>
          .{" "}
          {extendedRunwayWeeks < 24
            ? `Not enough to hit your 6-month goal, but it buys you time to figure things out. The real fix is building that savings buffer up.`
            : `That puts you past the 6-month safety threshold — solid position.`}
        </div>
      </div>
    </div>
  );
}
