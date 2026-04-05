import { createBrowserRouter } from "react-router";
import { DashboardLayout } from "./layout/DashboardLayout";
import { Dashboard } from "./pages/Dashboard";
import { CrisisAdvisor } from "./pages/CrisisAdvisor";
import { Insurance } from "./pages/Insurance";
import { AICoach } from "./pages/AICoach";
import { Onboarding } from "./pages/Onboarding";
import { Settings } from "./pages/Settings";
import { SpendingAnalysis } from "./components/dashboard/SpendingAnalysis";
import { useAppData } from "./store/AppContext";
import { mockGigWorker } from "./data/mockData";

// Wrapper to supply mock data to SpendingAnalysis standalone page
function SpendingPage() {
  const { userData } = useAppData();
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Spending Analysis</h1>
        <p className="text-gray-500 text-sm">Detailed breakdown of your monthly expenses.</p>
      </div>
      <SpendingAnalysis data={userData ?? mockGigWorker} showDropdown />
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: "/onboarding",
    element: <Onboarding />,
  },
  {
    path: "/",
    element: <DashboardLayout />,
    children: [
      { index: true,           element: <Dashboard /> },
      { path: "crisis",        element: <CrisisAdvisor /> },
      { path: "spending",      element: <SpendingPage /> },
      { path: "insurance",     element: <Insurance /> },
      { path: "ai-coach",      element: <AICoach /> },
      { path: "settings", element: <Settings /> },
    ],
  },
]);
