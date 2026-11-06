import { useEffect, useState } from "react";
import { useStore } from "./store";
import { ConnectionSidebar } from "./components/ConnectionSidebar";
import { BucketList } from "./components/BucketList";
import { FileBrowser } from "./components/FileBrowser";
import { SettingsDialog } from "./components/SettingsDialog";
import { DialogProvider } from "./dialogs";
import { useT } from "./i18n";
import { Settings } from "lucide-react";
import "./App.css";

function App() {
  const loadConnections = useStore((s) => s.loadConnections);
  const activeConn = useStore((s) =>
    s.connections.find((c) => c.id === s.activeConnId),
  );
  const t = useT();
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  return (
    <DialogProvider>
      <div className="app">
        <header className="app-header">
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
                <span className="header-conn dim">
                  {t("app.notConnected")}
                </span>
              </>
            )}
          </div>
          <button
            className="icon-btn header-settings"
            title={t("settings.open")}
            onClick={() => setShowSettings(true)}
          >
            <Settings size={16} />
          </button>
        </header>

        <div className="app-body">
          <ConnectionSidebar />
          <BucketList />
          <FileBrowser />
        </div>
      </div>

      {showSettings && (
        <SettingsDialog onClose={() => setShowSettings(false)} />
      )}
    </DialogProvider>
  );
}

export default App;
