import { BrowserRouter, Routes, Route } from "react-router-dom";

// Page components – rendered based on the current route
import Dashboard from "./pages/dashboard";
import ClickSpark from "./components/UI/clickSpark";
import CalendarPage from "./pages/calendar";
import Courses from './pages/courses'
import Onboarding from "./pages/onboarding";
import Login from "./pages/login";
import Signup from "./pages/signup";
import SettingsPage from "./pages/settings";

// Root application component – sets up routing and the shared layout
function App() {
  return (
    <BrowserRouter>
      <ClickSpark
        sparkColor="#3C0078"
        sparkSize={10}
        sparkRadius={15}
        sparkCount={8}
        duration={400}
      >

        {/* Main content area – padded to avoid overlapping the fixed menus */}
        <main className="pt-24 pl-40 pr-40">
          <Routes>
            <Route path="/" element={<Onboarding />} />
          <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/courses/*" element={<Courses />} />
            <Route path="/login" element={<Login />} />
            <Route path="/student/login" element={<Login role="student" />} />
            <Route path="/teacher/login" element={<Login role="teacher" />} />
            <Route path="/admin/login" element={<Login role="admin" />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </ClickSpark>
    </BrowserRouter>
  );
}

export default App
