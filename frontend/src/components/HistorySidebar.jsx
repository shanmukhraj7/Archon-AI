import { useEffect, useState } from "react";
import { getHistory, deleteHistory } from "../api/client";

const timeAgo = (iso) => {
  if (!iso) return "";
  const s = (Date.now() - new Date(iso)) / 1000;
  if (s < 60)    return "just now";
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

const dotClass = (status) =>
  ({ done: "done", running: "running", pending: "pending", error: "error" }[status] ?? "pending");

export default function HistorySidebar({ onSelect, activeId }) {
  const [history, setHistory] = useState([]);

  const load = async () => {
    try { const r = await getHistory(); setHistory(r.data); } catch {}
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try { await deleteHistory(id); load(); } catch {}
  };

  return (
    <aside className="history-sidebar">
      {/* Brand */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">⚡</div>
          <span className="sidebar-logo-text">Archon</span>
        </div>
        <div className="sidebar-tagline">AI Research Assistant</div>
      </div>

      <div className="sidebar-section-label">Recent Research</div>

      <ul className="history-list">
        {history.length === 0 ? (
          <div className="history-empty">
            <span className="history-empty-icon">🔬</span>
            No research yet.<br />Submit a query to get started.
          </div>
        ) : (
          history.map((item) => (
            <li
              key={item.id}
              className={`history-item${activeId === item.id ? " active" : ""}`}
              onClick={() => onSelect(item.id)}
            >
              <span className={`h-dot ${dotClass(item.status)}`} />
              <div className="h-content">
                <p className="h-query">{item.query}</p>
                <p className="h-meta">
                  {item.summary
                    ? item.summary.slice(0, 60) + "…"
                    : timeAgo(item.created_at)}
                </p>
              </div>
              <button
                className="h-del"
                title="Delete"
                onClick={(e) => handleDelete(e, item.id)}
              >✕</button>
            </li>
          ))
        )}
      </ul>
    </aside>
  );
}