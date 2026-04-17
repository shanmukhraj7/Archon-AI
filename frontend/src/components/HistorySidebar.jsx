import { useEffect, useState } from "react";
import { getHistory, deleteHistory } from "../api/client";

export default function HistorySidebar({ onSelect, activeId }) {
  const [history, setHistory] = useState([]);

  const load = async () => {
    const res = await getHistory();
    setHistory(res.data);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    await deleteHistory(id);
    load();
  };

  const statusDot = (s) => ({ done: "🟢", running: "🟡", pending: "🟡", error: "🔴" }[s] || "⚪");

  return (
    <aside className="history-sidebar">
      <h3>History</h3>
      {history.length === 0 && <p className="history-empty">No past queries yet.</p>}
      <ul className="history-list">
        {history.map((item) => (
          <li key={item.id} className={`history-item ${activeId === item.id ? "active" : ""}`} onClick={() => onSelect(item.id)}>
            <span className="h-dot">{statusDot(item.status)}</span>
            <div className="h-content">
              <p className="h-query">{item.query}</p>
              {item.summary && <p className="h-summary">{item.summary.slice(0, 80)}…</p>}
            </div>
            <button className="h-delete" onClick={(e) => handleDelete(e, item.id)}>✕</button>
          </li>
        ))}
      </ul>
    </aside>
  );
}