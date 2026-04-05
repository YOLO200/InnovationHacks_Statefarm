import { createBrowserRouter } from "react-router";
import { DashboardLayout } from "./layout/DashboardLayout";
import { Dashboard } from "./pages/Dashboard";
import { CrisisAdvisor } from "./pages/CrisisAdvisor";
import { Prepare } from "./pages/Prepare";
import { Spending } from "./pages/Spending";
import { ClaimGuard } from "./pages/ClaimGuard";
import { Onboarding } from "./pages/Onboarding";
import { Settings } from "./pages/Settings";

export const router = createBrowserRouter([
  {
    path: "/onboarding",
    element: <Onboarding />,
  },
  {
    path: "/",
    element: <DashboardLayout />,
    children: [
      { index: true,          element: <Dashboard /> },
      { path: "prepare",      element: <Prepare /> },
      { path: "crisis",       element: <CrisisAdvisor /> },
      { path: "spending",     element: <Spending /> },
      { path: "claim-guard",  element: <ClaimGuard /> },
      { path: "settings", element: <Settings /> },
    ],
  },
]);
