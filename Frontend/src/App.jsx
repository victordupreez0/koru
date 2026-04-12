import Menu from "./components/menu";
import SideMenu from "./components/sideMenu";
import Dashboard from "./pages/dashboard";


function App() {
  return (
    <>
      <Menu />
      <SideMenu />
      <main className="pt-24 pl-40 pr-4">
        <Dashboard />
      </main>
    </>
  );
}

export default App
