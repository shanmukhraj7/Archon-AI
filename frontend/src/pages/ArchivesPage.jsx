import { Link } from "react-router-dom";

const CATEGORIES = [
  { icon: "science",       label: "Technology & AI",      count: 0 },
  { icon: "trending_up",   label: "Markets & Finance",    count: 0 },
  { icon: "public",        label: "Geopolitics",           count: 0 },
  { icon: "biotech",       label: "Life Sciences",         count: 0 },
  { icon: "bolt",          label: "Energy & Climate",     count: 0 },
  { icon: "inventory_2",   label: "Industry Reports",     count: 0 },
];

export default function ArchivesPage() {
  return (
    <div className="p-4 md:p-8 max-w-[1440px] mx-auto">
      <div className="mb-12 border-b border-outline-variant pb-8">
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="bg-surface-container-high text-outline font-label-caps text-[10px] px-2 py-1 rounded-sm border border-outline-variant">
            ARCHIVES
          </span>
          <span className="bg-surface-container-high text-primary font-label-caps text-[10px] px-2 py-1 rounded-sm border border-primary flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            IN DEVELOPMENT
          </span>
        </div>
        <h1 className="font-display text-[32px] md:text-[40px] font-bold text-primary tracking-tighter mb-3">
          Research Archives
        </h1>
        <p className="font-body-sm text-on-surface-variant max-w-2xl leading-relaxed">
          Long-term intelligent storage for completed research, organized by domain, date, and relevance.
          Everything is searchable, taggable, and exportable.
        </p>
      </div>

      {/* Domain categories */}
      <div className="mb-12">
        <h2 className="font-label-caps text-outline text-[10px] mb-6 tracking-widest">KNOWLEDGE DOMAINS</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {CATEGORIES.map(({ icon, label, count }) => (
            <div key={label} className="architectural-card p-6 rounded group hover:border-primary transition-colors cursor-pointer">
              <div className="flex items-start justify-between mb-6">
                <div className="w-10 h-10 rounded border border-[#333333] bg-[#1A1A1A] flex items-center justify-center group-hover:border-primary transition-colors">
                  <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors text-[20px]">{icon}</span>
                </div>
                <span className="font-headline-lg text-[28px] text-outline-variant font-bold">{count}</span>
              </div>
              <h3 className="font-body-sm text-primary text-[14px] font-medium">{label}</h3>
              <p className="font-label-caps text-outline text-[10px] mt-1">REPORTS</p>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="mb-12">
        <h2 className="font-label-caps text-outline text-[10px] mb-6 tracking-widest">ARCHIVE FEATURES</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { icon: "search",       title: "Full-Text Search",      desc: "Semantic search across every sentence in your entire research history." },
            { icon: "label",        title: "Smart Tagging",          desc: "AI-suggested tags automatically organize reports by topic, entity, and theme." },
            { icon: "schedule",     title: "Retention Policies",     desc: "Configure auto-archive schedules, expiry rules, and tiered storage policies." },
            { icon: "cloud_upload", title: "External Import",       desc: "Import PDFs, Word docs, and markdown files directly into your archive." },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="architectural-card p-5 rounded flex items-start gap-4 group hover:border-primary transition-colors">
              <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors text-[22px] mt-0.5 shrink-0">{icon}</span>
              <div>
                <h3 className="font-body-sm text-primary font-medium mb-1">{title}</h3>
                <p className="font-body-sm text-on-surface-variant text-[13px] leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="architectural-card rounded p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="font-headline-md text-primary mb-1">Your archive starts with research</h3>
          <p className="font-body-sm text-on-surface-variant">Completed reports are automatically archived and tagged when this feature launches.</p>
        </div>
        <Link to="/history" className="shrink-0 border border-outline-variant text-primary font-label-caps py-3 px-6 rounded flex items-center gap-2 hover:border-primary transition-colors">
          <span className="material-symbols-outlined text-[16px]">history</span>
          VIEW HISTORY
        </Link>
      </div>
    </div>
  );
}
