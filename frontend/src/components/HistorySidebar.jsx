import { useEffect, useState } from "react";
import { NavLink, Link, useNavigate, useMatch } from "react-router-dom";
import { getHistory, deleteHistory } from "../api/client";

const WORKSPACE_LINKS = [
  { to: "/history", icon: "history", label: "History" },
  { to: "/drafts", icon: "description", label: "Drafts" },
  { to: "/settings", icon: "settings", label: "Settings" },
];

const BOTTOM_LINKS = [
  { to: "/help", icon: "help_outline", label: "Help" },
  { to: "/logout", icon: "logout", label: "Logout" },
];

function SideNavLink({ to, icon, label, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `w-full flex items-center gap-3 py-3 px-4 font-medium transition-colors rounded ${isActive
          ? "bg-surface-container text-primary"
          : "text-on-surface-variant hover:bg-surface-container-high hover:text-primary"
        }`
      }
    >
      <span className="material-symbols-outlined text-[18px]">{icon}</span>
      <span className="font-body-sm text-[13px]">{label}</span>
    </NavLink>
  );
}

export default function HistorySidebar({ isOpen, onClose }) {
  const [history, setHistory] = useState([]);
  const navigate = useNavigate();

  // detect which research report is currently active (for sidebar highlight)
  const reportMatch = useMatch("/research/:id");
  const activeId = reportMatch?.params?.id;

  useEffect(() => {
    getHistory()
      .then((res) => setHistory(Array.isArray(res.data) ? res.data : (res.data.reports || [])))
      .catch(() => { });
  }, []);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await deleteHistory(id);
      setHistory((prev) => prev.filter((h) => h.id !== id));
      if (activeId === id) navigate("/research");
    } catch { }
  };

  const handleSelectReport = (id) => {
    navigate(`/research/${id}`);
    if (onClose) onClose();
  };

  const handleNav = () => {
    if (onClose) onClose();
  };

  const content = (
    <nav className="flex flex-col h-full py-6 bg-surface w-72 md:w-64 shrink-0">
      {/* Logo */}
      <div className="px-6 mb-8 flex items-center justify-between">
        <Link to="/research" onClick={handleNav} className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-surface-container-high border border-outline-variant flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-primary text-[18px]">hub</span>
          </div>
          <div>
            <p className="font-headline-md text-primary font-bold tracking-tighter text-[16px] leading-tight">ARCHON AI</p>
            <p className="font-label-caps text-on-surface-variant text-[10px]">V2.0.4 CORE</p>
          </div>
        </Link>
        {onClose && (
          <button onClick={onClose} className="md:hidden text-on-surface-variant hover:text-primary p-1" aria-label="Close menu">
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        )}
      </div>

      {/* New Research CTA */}
      <div className="px-4 mb-8">
        <Link
          to="/research"
          onClick={handleNav}
          className="w-full bg-primary text-background font-label-caps py-3 px-4 rounded flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          NEW RESEARCH
        </Link>
      </div>

      {/* Workspace links */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1 custom-scrollbar">
        <div className="px-4 mb-2">
          <span className="font-label-caps text-outline text-[10px]">WORKSPACE</span>
        </div>
        {WORKSPACE_LINKS.map(({ to, icon, label }) => (
          <SideNavLink key={label} to={to} icon={icon} label={label} onClick={handleNav} />
        ))}

        {/* Recent analyses */}
        <div className="px-4 mt-6 mb-2">
          <span className="font-label-caps text-outline text-[10px]">RECENT ANALYSES</span>
        </div>
        {history.length === 0 && (
          <p className="px-4 py-2 text-[12px] text-outline font-label-caps">No history yet</p>
        )}
        {history.slice(0, 12).map((h) => (
          <div
            key={h.id}
            onClick={() => handleSelectReport(h.id)}
            className={`w-full flex items-center justify-between py-2 px-4 rounded cursor-pointer transition-colors group ${activeId === h.id
                ? "bg-surface-container border-l-2 border-primary"
                : "hover:bg-surface-container"
              }`}
          >
            <div className="flex flex-col overflow-hidden text-left min-w-0">
              <span className={`font-body-sm text-[13px] truncate ${activeId === h.id ? "text-primary" : "text-on-surface-variant group-hover:text-primary"
                }`}>
                {h.query}
              </span>
            </div>
            <button
              onClick={(e) => handleDelete(e, h.id)}
              className="text-on-surface-variant hover:text-error opacity-0 group-hover:opacity-100 transition-opacity p-1 shrink-0"
              aria-label="Delete report"
            >
              <span className="material-symbols-outlined text-[14px]">delete</span>
            </button>
          </div>
        ))}
      </div>

      {/* Bottom links */}
      <div className="px-2 mt-auto pt-4 border-t border-outline-variant space-y-1">
        {BOTTOM_LINKS.map(({ to, icon, label }) => (
          <SideNavLink key={label} to={to} icon={icon} label={label} onClick={handleNav} />
        ))}
      </div>
    </nav>
  );

  return (
    <>
      {/* Desktop — always visible */}
      <div className="hidden md:flex h-full border-r border-outline-variant">
        {content}
      </div>

      {/* Mobile drawer */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <div className="relative z-10 h-full border-r border-outline-variant animate-slideInLeft">
            {content}
          </div>
        </div>
      )}
    </>
  );
}