import { HeroSection } from '../components/dashboard/HeroSection';
import { CashRunway } from '../components/dashboard/CashRunway';
import { SpendingAnalysis } from '../components/dashboard/SpendingAnalysis';
import { SpendingOverview } from '../components/dashboard/SpendingOverview';
import { ScenarioSimulation } from '../components/dashboard/ScenarioSimulation';
import { InsuranceCoverage } from '../components/dashboard/InsuranceCoverage';
import { ActionPlan } from '../components/dashboard/ActionPlan';
import { ActionPlanWithRunway } from '../components/dashboard/ActionPlanWithRunway';

export function Dashboard() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Hero Section */}
      <HeroSection score={72} status="stable" />

      {/* Two Column Layout - Insurance and Action Plan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InsuranceCoverage />
        <ActionPlanWithRunway savings={8000} monthlyExpenses={1800} />
      </div>

      {/* Two Column Layout - Spending Overview and Scenario Simulation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SpendingOverview />
        <ScenarioSimulation />
      </div>
    </div>
  );
}