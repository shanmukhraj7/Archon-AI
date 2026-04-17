import { useState, useEffect, useCallback } from "react";
import QueryInput from "./components/QueryInput";
import ReportViewer from "./components/ReportViewer";
import HistorySidebar from "./components/HistorySidebar";
import UploadPanel from "./components/UploadPanel";
import { submitQuery, getReport } from "./api/client";
import "./index.css";

export default function App() {
  const [activeReport, setActiveReport] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarKey, setSidebarKey] = useState(0);

  const pollReport = useCallback(async (id) => {
    const res = await getReport(id);
    setActiveReport(res.data);
    if (res.data.status === "running" || res.data.status === "pending") {
      setTimeout(() => pollReport(id), 2500);
    } else {
      setIsLoading(false);
      setSidebarKey((k) => k + 1);
    }
  }, []);

  const handleSubmit = async (query) => {
    setIsLoading(true);
    setActiveReport(null);
    const res = await submitQuery(query);
    setActiveReport({ id: res.data.id, query, status: "pending" });
    pollReport(res.data.id);
  };

  const handleSelectHistory = async (id) => {
    const res = await getReport(id);
    setActiveReport(res.data);
  };

  return (
    <div className="app-layout">
      <HistorySidebar key={sidebarKey} onSelect={handleSelectHistory} activeId={activeReport?.id} />
      <main className="app-main">
        <header className="app-header">
          <h1>Research Assistant</h1>
          <p>AI-powered research: web search + your documents → structured report</p>
        </header>
        <QueryInput onSubmit={handleSubmit} isLoading={isLoading} />
        <ReportViewer report={activeReport} />
      </main>
      <aside className="app-right">
        <UploadPanel />
      </aside>
    </div>
  );
}