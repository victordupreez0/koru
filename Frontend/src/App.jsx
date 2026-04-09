import { BrowserRouter, Routes, Route } from "react-router-dom";
import Menu from "./components/menu";
import SideMenu from "./components/sideMenu";
import Dashboard from "./pages/dashboard";
import CalendarPage from "./pages/calendar";


function App() {
  return (
    <BrowserRouter>
      <Menu />
      <SideMenu />
      <main className="pt-24 pl-40 pr-40">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/calendar" element={<CalendarPage />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App
