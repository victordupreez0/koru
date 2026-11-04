import { useEffect } from "react";
import { HashRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";

// Page components – rendered based on the current route
import Dashboard from "./pages/dashboard";
import ClickSpark from "./components/UI/clickSpark";
import RouteSpeechAnnouncer from "./components/UI/routeSpeechAnnouncer";
import CalendarPage from "./pages/calendar";
import Courses from './pages/courses'
import Onboarding from "./pages/onboarding";
import Login from "./pages/login";
import Signup from "./pages/signup";
import { AuthShell } from "./components/AuthLayout";
import SettingsPage from "./pages/settings";
import ProtectedRoute from "./components/ProtectedRoute";
import TeacherAssistant from "./pages/Assistant/teacherAssistant";
import Profile from "./pages/profile/profile";
import AnalyticsPage from "./pages/analytics";
import AdminCourses from "./pages/courses/adminCourses";
import AppSidebar from "./components/AppSidebar";
import DesignSystemPreview from "./pages/DesignSystemPreview";

// Routes that render full-bleed, outside the app shell (no sidebar, no gutter)
const PUBLIC_PATHS = ["/", "/student/login", "/teacher/login", "/admin/login", "/signup"];

function isPublicPath(pathname) {
  return (
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith("/profile/")
  );
}

// Layout that decides whether to show the app shell based on the current route.
function AppShell() {
  const location = useLocation();
  const isIframeMode = window.self !== window.top;
  const isPublic = isPublicPath(location.pathname);

  return (
    <>
      {!isPublic ? <AppSidebar /> : null}

      <main
        className={
          isPublic || isIframeMode
            ? ""
            : "py-4 pl-[112px] pr-4 min-h-screen transition-all duration-300"
        }
      >
        <Routes>
          {/* Public routes – landing & role-specific login portals */}
          <Route element={<AuthShell />}>
            <Route path="/" element={<Onboarding />} />
            <Route path="/student/login" element={<Login role="student" />} />
            <Route path="/teacher/login" element={<Login role="teacher" />} />
            <Route path="/admin/login" element={<Login role="admin" />} />
            <Route path="/signup" element={<Signup />} />
          </Route>

          {/* Protected routes – require authentication */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
          <Route path="/courses/*" element={<ProtectedRoute><Courses /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/teacherassistant" element={<ProtectedRoute allowedRoles={["teacher", "admin", "student"]}><TeacherAssistant /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
          <Route path="/admin/courses" element={<ProtectedRoute allowedRoles={["admin"]}><AdminCourses /></ProtectedRoute>} />

          {/* Profile routes */}
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/profile/:slug" element={<Profile publicRoute />} />

          {/* Design-system preview – development only */}
          {import.meta.env.DEV ? (
            <Route path="/design-system" element={<DesignSystemPreview />} />
          ) : null}

          {/* Catch-all – redirect unknown paths to landing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}

// Root application component – sets up routing and the shared layout
function App() {
  const { role } = useAuth();

  // Stamp the user role on <body> so CSS can drive role-specific backgrounds
  useEffect(() => {
    if (role) {
      document.body.setAttribute("data-role", role);
    } else {
      document.body.removeAttribute("data-role");
    }
  }, [role]);

  return (
    <HashRouter>
      <RouteSpeechAnnouncer />
      <ClickSpark
        sparkColor="#3C0078"
        sparkSize={10}
        sparkRadius={15}
        sparkCount={8}
        duration={400}
      >
        <AppShell />
      </ClickSpark>
    </HashRouter>
  );
}

export default App
