import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AppProvider } from "./store/AppContext";
import { LanguageProvider } from "./store/LanguageContext";

function App() {
  return (
    <LanguageProvider>
      <AppProvider>
        <RouterProvider router={router} />
      </AppProvider>
    </LanguageProvider>
  );
}

export default App;
