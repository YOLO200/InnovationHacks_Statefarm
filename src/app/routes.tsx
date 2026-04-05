import { createBrowserRouter } from "react-router";
import { DashboardLayout } from "./layout/DashboardLayout";
import { Dashboard } from "./pages/Dashboard";
import { CrisisAdvisor } from "./pages/CrisisAdvisor";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { SpendingAnalysis } from "./components/dashboard/SpendingAnalysis";
import { Insurance } from "./pages/Insurance";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <DashboardLayout />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: "crisis",
        element: <CrisisAdvisor />,
      },
      {
        path: "scenarios",
        element: (
          <PlaceholderPage
            title="Scenarios"
            description="Run AI-powered financial scenarios to prepare for life's uncertainties."
          />
        ),
      },
      {
        path: "spending",
        element: (
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Spending Analysis
              </h1>
              <p className="text-gray-600">
                Detailed breakdown of your monthly expenses and
                opportunities to save.
              </p>
            </div>
            <SpendingAnalysis />
          </div>
        ),
      },
      {
        path: "insurance",
        element: <Insurance />,
      },
      {
        path: "insights",
        element: (
          <PlaceholderPage
            title="AI Insights"
            description="Personalized financial recommendations powered by artificial intelligence."
          />
        ),
      },
      {
        path: "settings",
        element: (
          <PlaceholderPage
            title="Settings"
            description="Customize your Crunch experience and preferences."
          />
        ),
      },
    ],
  },
]);