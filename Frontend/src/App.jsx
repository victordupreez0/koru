import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Page components – rendered based on the current route
import Dashboard from "./pages/dashboard";
import ClickSpark from "./components/UI/clickSpark";
import CalendarPage from "./pages/calendar";
import Courses from './pages/courses'
import Onboarding from "./pages/onboarding";
import Login from "./pages/login";
import SettingsPage from "./pages/settings";
import ProtectedRoute from "./components/ProtectedRoute";

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
            {/* Public routes – landing & role-specific login portals */}
            <Route path="/" element={<Onboarding />} />
            <Route path="/student/login" element={<Login role="student" />} />
            <Route path="/teacher/login" element={<Login role="teacher" />} />
            <Route path="/admin/login" element={<Login role="admin" />} />

            {/* Protected routes – require authentication */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
            <Route path="/courses/*" element={<ProtectedRoute><Courses /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

            {/* Catch-all – redirect unknown paths to landing */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </ClickSpark>
    </BrowserRouter>
  );
}

export default App
