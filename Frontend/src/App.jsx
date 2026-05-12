import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";

// Page components – rendered based on the current route
import Dashboard from "./pages/dashboard";
import ClickSpark from "./components/UI/clickSpark";
import RouteSpeechAnnouncer from "./components/UI/routeSpeechAnnouncer";
import CalendarPage from "./pages/calendar";
import Courses from './pages/courses'
import Onboarding from "./pages/onboarding";
import Login from "./pages/login";
import SettingsPage from "./pages/settings";
import ProtectedRoute from "./components/ProtectedRoute";
import TeacherAssistant from "./pages/Assistant/teacherAssistant";
import Profile from "./pages/profile/profile";
import AnalyticsPage from "./pages/analytics";

// Root application component – sets up routing and the shared layout
function App() {
  const [isDark, setIsDark] = useState(() => document.body.classList.contains("theme-dark"));

  useEffect(() => {
    const handler = () => setIsDark(document.body.classList.contains("theme-dark"));
    window.addEventListener("learnonline-settings-changed", handler);
    return () => window.removeEventListener("learnonline-settings-changed", handler);
  }, []);

  return (
    <BrowserRouter>
      <RouteSpeechAnnouncer />
      <ClickSpark
        sparkColor={isDark ? "#9BE9EA" : "#3C0078"}
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
            <Route path="/teacherassistant" element={<ProtectedRoute><TeacherAssistant /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />

            {/* Profile routes*/}
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/profile/:slug" element={<Profile publicRoute />} />

            {/* Catch-all – redirect unknown paths to landing */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </ClickSpark>
    </BrowserRouter>
  );
}

export default App
