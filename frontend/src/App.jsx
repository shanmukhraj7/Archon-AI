import { useState, useCallback } from "react";
import QueryInput from "./components/QueryInput";
import ReportViewer from "./components/ReportViewer";
import HistorySidebar from "./components/HistorySidebar";
import UploadPanel from "./components/UploadPanel";
import { submitQuery, getReport } from "./api/client";
import "./index.css";

export default function App() {
  const [activeReport, setActiveReport] = useState(null);
  const [isLoading,    setIsLoading]    = useState(false);
  const [sidebarKey,   setSidebarKey]   = useState(0);

  const pollReport = useCallback(async (id) => {
    try {
      const res = await getReport(id);
      setActiveReport(res.data);
      if (res.data.status === "running" || res.data.status === "pending") {
        setTimeout(() => pollReport(id), 2500);
      } else {
        setIsLoading(false);
        setSidebarKey((k) => k + 1);
      }
    } catch {
      setIsLoading(false);
    }
  }, []);

  const handleSubmit = async (query) => {
    setIsLoading(true);
    setActiveReport(null);
    try {
      const res = await submitQuery(query);
      setActiveReport({ id: res.data.id, query, status: "pending" });
      pollReport(res.data.id);
    } catch {
      setIsLoading(false);
    }
  };

  const handleSelectHistory = async (id) => {
    try { const res = await getReport(id); setActiveReport(res.data); } catch {}
  };

  return (
    <div className="app-layout">
      <HistorySidebar key={sidebarKey} onSelect={handleSelectHistory} activeId={activeReport?.id} />

      <main className="app-main">
        <div className="main-scroll">

          <header className="app-header">
            <div className="header-eyebrow">
              <span className="header-eyebrow-line" />
              <span className="header-eyebrow-text">AI-Powered Research</span>
              <span className="header-eyebrow-badge">v1.0</span>
            </div>

            <h1>
              Research at the<br />speed of <em>thought.</em>
            </h1>

            <p className="header-desc">
              Ask any research question. Archon searches the web, scours your
              documents, and synthesizes a structured, exportable report — in seconds.
            </p>

            <div className="header-chips">
              {["Web Search", "RAG Retrieval", "PDF Export", "Multi-LLM"].map((c) => (
                <span key={c} className="header-chip">
                  <span className="chip-dot" />
                  {c}
                </span>
              ))}
            </div>
          </header>

          <QueryInput onSubmit={handleSubmit} isLoading={isLoading} />
          <ReportViewer report={activeReport} />

        </div>
      </main>

      <aside className="app-right">
        <UploadPanel reportMetadata={activeReport?.metadata} />
      </aside>
    </div>
  );
}