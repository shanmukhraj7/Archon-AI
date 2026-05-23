import { useState } from "react";
import { NavLink, Link, useMatch } from "react-router-dom";
import { Outlet } from "react-router-dom";
import HistorySidebar from "../components/HistorySidebar";

const NAV_TABS = [
  { to: "/research", label: "Research", end: false },
  { to: "/analysis",  label: "Analysis",  end: true },
  { to: "/synthesis", label: "Synthesis", end: true },
  { to: "/archives",  label: "Archives",  end: true },
];

export default function AppLayout() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <HistorySidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Right column */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* ── Top App Bar ── */}
        <header className="flex justify-between items-center px-4 md:px-8 h-16 w-full shrink-0 bg-surface border-b border-outline-variant z-10">
          {/* Mobile: hamburger + logo */}
          <div className="flex items-center gap-3 md:hidden">
            <button
              id="mobile-menu-btn"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="text-on-surface-variant hover:text-primary transition-colors p-1 -ml-1"
              aria-label="Open menu"
            >
              <span className="material-symbols-outlined text-[24px]">menu</span>
            </button>
            <Link to="/research" className="font-headline-md font-black text-primary tracking-tighter text-[16px]">
              ARCHON AI
            </Link>
          </div>

          {/* Desktop: nav tabs */}
          <nav className="hidden md:flex items-center gap-8 h-full" aria-label="Main navigation">
            {NAV_TABS.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `h-full flex items-center font-body-sm transition-colors border-b-2 ${
                    isActive
                      ? "text-primary border-primary"
                      : "text-on-surface-variant border-transparent hover:text-primary"
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Right icons */}
          <div className="flex items-center gap-1">
            <NavLink
              to="/notifications"
              className={({ isActive }) =>
                `p-2 rounded transition-colors ${
                  isActive ? "text-primary bg-surface-container-high" : "text-on-surface-variant hover:text-primary hover:bg-surface-container-high"
                }`
              }
              aria-label="Notifications"
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
            </NavLink>
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `p-2 rounded transition-colors ${
                  isActive ? "text-primary bg-surface-container-high" : "text-on-surface-variant hover:text-primary hover:bg-surface-container-high"
                }`
              }
              aria-label="Profile"
            >
              <span className="material-symbols-outlined text-[20px]">account_circle</span>
            </NavLink>
          </div>
        </header>

        {/* ── Page content via Outlet ── */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
