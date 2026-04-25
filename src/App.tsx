
import { NavBar } from './components/NavBar';
import { ToolBar } from './components/ToolBar';
import { Workspace } from './components/Workspace';
import { PropertyPanel } from './components/PropertyPanel';

function App() {
  return (
    <div className="h-screen w-screen flex flex-col bg-background text-zinc-100 overflow-hidden">
      <NavBar />
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <div className="flex-1 flex overflow-hidden">
          <ToolBar />
          <Workspace />
        </div>
        <PropertyPanel />
      </div>
    </div>
  );
}

export default App;
