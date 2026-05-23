import { Link } from "react-router-dom";

const MOCK_NOTIFICATIONS = [
  { id: 1, icon: "check_circle", color: "text-[#22c55e]", title: "Research Complete", desc: 'Your report on "AI Hardware Market Trends" is ready.', time: "2m ago", unread: true },
  { id: 2, icon: "info",         color: "text-primary",   title: "System Update",    desc: "Archon Core updated to v2.0.4 with improved synthesis accuracy.", time: "1h ago", unread: true },
  { id: 3, icon: "warning",      color: "text-error",     title: "Research Failed",  desc: 'Report on "Quantum Computing Landscape" encountered a timeout error.', time: "3h ago", unread: false },
  { id: 4, icon: "check_circle", color: "text-[#22c55e]", title: "Research Complete", desc: 'Your report on "LLM Provider Competitive Analysis" is ready.', time: "Yesterday", unread: false },
];

export default function NotificationsPage() {
  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8 border-b border-outline-variant pb-8 flex items-end justify-between">
        <div>
          <div className="flex gap-2 mb-4">
            <span className="bg-surface-container-high text-outline font-label-caps text-[10px] px-2 py-1 rounded-sm border border-outline-variant">
              SYSTEM
            </span>
          </div>
          <h1 className="font-display text-[32px] md:text-[40px] font-bold text-primary tracking-tighter mb-2">
            Notifications
          </h1>
          <p className="font-body-sm text-on-surface-variant">
            {MOCK_NOTIFICATIONS.filter((n) => n.unread).length} unread notifications
          </p>
        </div>
        <button className="font-label-caps text-[11px] text-primary hover:underline shrink-0">
          MARK ALL READ
        </button>
      </div>

      {/* Notification list */}
      <div className="space-y-2">
        {MOCK_NOTIFICATIONS.map((n) => (
          <div
            key={n.id}
            className={`architectural-card rounded p-5 flex items-start gap-4 transition-colors group hover:border-primary ${
              n.unread ? "border-outline-variant" : "opacity-60"
            }`}
          >
            <div className={`w-10 h-10 rounded border border-[#333333] bg-[#1A1A1A] flex items-center justify-center shrink-0 group-hover:border-primary transition-colors`}>
              <span className={`material-symbols-outlined text-[20px] ${n.color}`}>{n.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-body-sm text-primary font-medium">{n.title}</p>
                {n.unread && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
              </div>
              <p className="font-body-sm text-on-surface-variant text-[13px] leading-relaxed">{n.desc}</p>
            </div>
            <span className="font-label-caps text-[10px] text-outline shrink-0">{n.time}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-12 architectural-card rounded p-8 flex flex-col items-center text-center">
        <span className="material-symbols-outlined text-outline text-[40px] mb-4">notifications_active</span>
        <h3 className="font-headline-md text-primary mb-2">Stay informed</h3>
        <p className="font-body-sm text-on-surface-variant max-w-sm mb-6">
          Notifications will appear here as your research agents complete tasks, encounter errors, or surface new insights.
        </p>
        <Link to="/settings" className="border border-outline-variant text-primary font-label-caps text-[11px] py-2 px-5 rounded hover:border-primary transition-colors">
          CONFIGURE ALERTS
        </Link>
      </div>
    </div>
  );
}
