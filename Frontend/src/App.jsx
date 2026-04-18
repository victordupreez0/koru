import { BrowserRouter, Routes, Route } from "react-router-dom";

// Page components – rendered based on the current route
import Dashboard from "./pages/dashboard";
import CalendarPage from "./pages/calendar";
import Onboarding from "./pages/onboarding";
import Login from "./pages/login";
import Signup from "./pages/signup";
import SettingsPage from "./pages/settings";

// Root application component – sets up routing and the shared layout
function App() {
  return (
    <BrowserRouter>

      {/* Main content area – padded to avoid overlapping the fixed menus */}
      <main className="pt-24 pl-40 pr-40">
        <Routes>
          <Route path="/" element={<Onboarding />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App
