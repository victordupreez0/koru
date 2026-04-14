import Menu from "./components/menu";
import SideMenu from "./components/sideMenu";
import Dashboard from "./pages/dashboard";
import ClickSpark from "./components/UI/clickSpark";


function App() {
  return (
    <ClickSpark
      sparkColor="#3C0078"
      sparkSize={10}
      sparkRadius={15}
      sparkCount={8}
      duration={400}
    >
      <Menu />
      <SideMenu />
      <main className="pt-24 pl-40 pr-4">
        <Dashboard />
      </main>
    </ClickSpark>
  );
}

export default App
