import { useEffect } from "react";
import { useStore } from "./store";
import { ConnectionSidebar } from "./components/ConnectionSidebar";
import { BucketList } from "./components/BucketList";
import { FileBrowser } from "./components/FileBrowser";
import "./App.css";

function App() {
  const loadConnections = useStore((s) => s.loadConnections);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  return (
    <div className="app">
      <ConnectionSidebar />
      <BucketList />
      <FileBrowser />
    </div>
  );
}

export default App;
