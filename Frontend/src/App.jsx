import { BrowserRouter, Routes, Route } from "react-router-dom";

// Layout components – always visible on every page
import Menu from "./components/menu";
import SideMenu from "./components/sideMenu";

// Page components – rendered based on the current route
import Dashboard from "./pages/dashboard";
import CalendarPage from "./pages/calendar";
import Courses from "./pages/courses";

// Root application component – sets up routing and the shared layout
function App() {
  return (
    <BrowserRouter>
      {/* Top navigation bar (floating, centred) */}
      <Menu />

      {/* Side navigation bar (floating, bottom-left) */}
      <SideMenu />

      {/* Main content area – padded to avoid overlapping the fixed menus */}
      <main className="pt-24 pl-40 pr-40">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/courses" element={<Courses />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App
