import { Link } from "react-router-dom";

export default function DraftsPage() {
  return (
    <div className="p-4 md:p-8 max-w-[1440px] mx-auto">
      <div className="mb-12 border-b border-outline-variant pb-8">
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="bg-surface-container-high text-outline font-label-caps text-[10px] px-2 py-1 rounded-sm border border-outline-variant">
            WORKSPACE
          </span>
          <span className="bg-surface-container-high text-primary font-label-caps text-[10px] px-2 py-1 rounded-sm border border-primary flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            IN DEVELOPMENT
          </span>
        </div>
        <h1 className="font-display text-[32px] md:text-[40px] font-bold text-primary tracking-tighter mb-3">
          Draft Workspace
        </h1>
        <p className="font-body-sm text-on-surface-variant max-w-2xl leading-relaxed">
          Save research in-progress, annotate sections, and collaborate on living documents before publishing.
        </p>
      </div>

      {/* Empty state */}
      <div className="architectural-card rounded p-16 md:p-24 flex flex-col items-center text-center mb-12">
        <div className="w-16 h-16 rounded border border-outline-variant bg-[#1A1A1A] flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-outline text-[32px]">description</span>
        </div>
        <h3 className="font-headline-md text-primary text-[20px] mb-3">No drafts yet</h3>
        <p className="font-body-sm text-on-surface-variant max-w-sm leading-relaxed mb-8">
          Drafts let you pause mid-research, annotate reports, and share work-in-progress before finalizing.
        </p>
        <Link
          to="/research"
          className="bg-primary text-background font-label-caps py-3 px-6 rounded flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          START RESEARCH
        </Link>
      </div>

      {/* Planned features */}
      <div>
        <h2 className="font-label-caps text-outline text-[10px] mb-6 tracking-widest">COMING TO DRAFTS</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { icon: "edit_note",    title: "Inline Annotation",      desc: "Highlight and comment on any section of a report." },
            { icon: "group",        title: "Team Collaboration",      desc: "Share drafts with your team for review and co-editing." },
            { icon: "history",      title: "Version History",         desc: "Track all changes and restore any previous version." },
            { icon: "publish",      title: "One-Click Publish",       desc: "Promote a draft to a final report instantly." },
            { icon: "comment",      title: "Threaded Comments",       desc: "Contextual discussion threads attached to specific passages." },
            { icon: "schedule",     title: "Scheduled Publishing",    desc: "Set a date and time to automatically finalize and share." },
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
    </div>
  );
}
