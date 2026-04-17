import { useEffect, useState } from "react";
import { getHistory, deleteHistory } from "../api/client";

export default function HistorySidebar({ onSelect, activeId }) {
  const [history, setHistory] = useState([]);

  const load = async () => {
    try {
      const res = await getHistory();
      setHistory(res.data);
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    await deleteHistory(id);
    load();
  };

  const statusClass = (s) =>
    ({ done: "done", running: "running", pending: "pending", error: "error" }[s] || "pending");

  const timeAgo = (iso) => {
    if (!iso) return "";
    const diff = (Date.now() - new Date(iso)) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <aside className="history-sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">⚡</div>
          <span className="sidebar-logo-text">Archon</span>
        </div>
        <div className="sidebar-tagline">AI Research Assistant</div>
      </div>

      <div className="sidebar-section-label">Recent Research</div>

      <ul className="history-list">
        {history.length === 0 && (
          <p className="history-empty">
            No research yet.<br />Submit a query to get started.
          </p>
        )}
        {history.map((item) => (
          <li
            key={item.id}
            className={`history-item ${activeId === item.id ? "active" : ""}`}
            onClick={() => onSelect(item.id)}
          >
            <span className={`h-status ${statusClass(item.status)}`} />
            <div className="h-content">
              <p className="h-query">{item.query}</p>
              {item.summary && (
                <p className="h-summary">{item.summary.slice(0, 72)}…</p>
              )}
              <p className="h-summary">{timeAgo(item.created_at)}</p>
            </div>
            <button className="h-delete" onClick={(e) => handleDelete(e, item.id)} title="Delete">
              ✕
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}