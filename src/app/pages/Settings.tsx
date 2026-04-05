import { useState } from "react";
import { useNavigate } from "react-router";
import { Card } from "../components/ui/card";
import { useAppData } from "../store/AppContext";
import { mockGigWorker } from "../data/mockData";
import {
  User,
  Briefcase,
  Save,
  LogOut,
  Home,
  Building2,
  Users,
  Package,
  Car,
  Laptop,
  Smartphone,
  Zap,
  DollarSign,
  CheckCircle2,
} from "lucide-react";
import type {
  PersonalInfo,
  WorkProfile,
  HousingSituation,
  WorkType,
  IncomeFrequency,
  DependencyAsset,
} from "../types/financial";

// ── helpers ───────────────────────────────────────────────────────────────────
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
        {label}
      </label>
      {children}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  type = "text",
  placeholder = "",
}: {
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  );
}

function OptionGrid<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; icon: React.ElementType }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((opt) => {
        const Icon = opt.icon;
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex items-center gap-2.5 p-3 rounded-xl border-2 text-left transition-all ${
              active
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-gray-300 bg-white"
            }`}
          >
            <Icon
              className={`w-4 h-4 flex-shrink-0 ${active ? "text-blue-600" : "text-gray-400"}`}
            />
            <span
              className={`text-sm font-medium ${active ? "text-blue-700" : "text-gray-700"}`}
            >
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ── option configs ─────────────────────────────────────────────────────────────
const HOUSING_OPTIONS: {
  value: HousingSituation;
  label: string;
  icon: React.ElementType;
}[] = [
  { value: "rent", label: "Renting", icon: Building2 },
  { value: "own", label: "Own a home", icon: Home },
  { value: "family", label: "With family", icon: Users },
  { value: "other", label: "Other", icon: Package },
];

const WORK_TYPE_OPTIONS: {
  value: WorkType;
  label: string;
  icon: React.ElementType;
}[] = [
  { value: "rideshare", label: "Rideshare", icon: Car },
  { value: "delivery", label: "Delivery", icon: Package },
  { value: "freelance", label: "Freelance", icon: Laptop },
  { value: "contract", label: "Contract", icon: Briefcase },
];

const FREQUENCY_OPTIONS: {
  value: IncomeFrequency;
  label: string;
  icon: React.ElementType;
}[] = [
  { value: "daily", label: "Daily", icon: Zap },
  { value: "weekly", label: "Weekly", icon: DollarSign },
  { value: "mixed", label: "Mixed", icon: Smartphone },
];

const ASSET_OPTIONS: {
  value: DependencyAsset;
  label: string;
  icon: React.ElementType;
}[] = [
  { value: "car", label: "Car", icon: Car },
  { value: "laptop", label: "Laptop", icon: Laptop },
  { value: "phone", label: "Phone", icon: Smartphone },
  { value: "physical", label: "Physical", icon: Package },
  { value: "none", label: "None", icon: Zap },
];

// ── section wrapper ────────────────────────────────────────────────────────────
function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="p-2 bg-blue-50 rounded-lg">
          <Icon className="w-4 h-4 text-blue-600" />
        </div>
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </Card>
  );
}

// ── main page ──────────────────────────────────────────────────────────────────
export function Settings() {
  const { userData, setUserData, resetData } = useAppData();
  const navigate = useNavigate();
  const source = userData ?? mockGigWorker;

  const [personal, setPersonal] = useState<PersonalInfo>({
    ...source.personal,
  });
  const [profile, setProfile] = useState<WorkProfile>({ ...source.profile });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setUserData(
      personal,
      profile,
      source.income,
      source.financials,
      undefined,
      source.monthly_spending,
    );
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = () => {
    resetData();
    navigate("/onboarding", { replace: true });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Update your profile and financial details
        </p>
      </div>

      {/* Personal Info */}
      <Section icon={User} title="Personal Information">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Full Name">
            <TextInput
              value={personal.name}
              onChange={(v) => setPersonal((p) => ({ ...p, name: v }))}
              placeholder="Jane Smith"
            />
          </Field>
          <Field label="Age">
            <TextInput
              type="number"
              value={personal.age}
              onChange={(v) => setPersonal((p) => ({ ...p, age: v }))}
              placeholder="28"
            />
          </Field>
        </div>
        <Field label="Email Address">
          <TextInput
            type="email"
            value={personal.email}
            onChange={(v) => setPersonal((p) => ({ ...p, email: v }))}
            placeholder="jane@example.com"
          />
        </Field>
        <Field label="Phone Number">
          <TextInput
            type="tel"
            value={personal.phone}
            onChange={(v) => setPersonal((p) => ({ ...p, phone: v }))}
            placeholder="(555) 000-0000"
          />
        </Field>
        <Field label="Housing Situation">
          <OptionGrid
            options={HOUSING_OPTIONS}
            value={personal.housing}
            onChange={(v) => setPersonal((p) => ({ ...p, housing: v }))}
          />
        </Field>
      </Section>

      {/* Work Profile */}
      <Section icon={Briefcase} title="Work Profile">
        <Field label="Work Type">
          <OptionGrid
            options={WORK_TYPE_OPTIONS}
            value={profile.work_type}
            onChange={(v) => setProfile((p) => ({ ...p, work_type: v }))}
          />
        </Field>
        <Field label="Income Frequency">
          <OptionGrid
            options={FREQUENCY_OPTIONS}
            value={profile.income_frequency}
            onChange={(v) => setProfile((p) => ({ ...p, income_frequency: v }))}
          />
        </Field>
        <Field label="Primary Income Asset">
          <OptionGrid
            options={ASSET_OPTIONS}
            value={profile.income_dependency_asset}
            onChange={(v) =>
              setProfile((p) => ({ ...p, income_dependency_asset: v }))
            }
          />
        </Field>
      </Section>

      {/* Actions */}
      <div className="flex items-center justify-between pb-6">
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 border border-red-200 rounded-xl transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Reset & Re-onboard
        </button>

        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-xl transition-all ${
            saved
              ? "bg-green-500 text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          {saved ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saved ? "Saved!" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
