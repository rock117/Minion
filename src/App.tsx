import { useEffect } from "react";
import { useStore } from "./store";
import { ConnectionSidebar } from "./components/ConnectionSidebar";
import { BucketList } from "./components/BucketList";
import { FileBrowser } from "./components/FileBrowser";
import { Boxes } from "lucide-react";
import "./App.css";

function App() {
  const loadConnections = useStore((s) => s.loadConnections);
  const activeConn = useStore((s) =>
    s.connections.find((c) => c.id === s.activeConnId),
  );

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="brand-logo">
            <Boxes size={16} strokeWidth={2.2} />
          </span>
          <span className="brand-name">Minion</span>
        </div>
        <div className="header-meta">
          {activeConn ? (
            <>
              <span className="status-dot online" />
              <span className="header-conn">{activeConn.name}</span>
              <span className="header-endpoint">{activeConn.endpoint}</span>
            </>
          ) : (
            <>
              <span className="status-dot" />
              <span className="header-conn dim">未连接</span>
            </>
          )}
        </div>
      </header>

      <div className="app-body">
        <ConnectionSidebar />
        <BucketList />
        <FileBrowser />
      </div>
    </div>
  );
}

export default App;
