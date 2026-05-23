import { Link } from "react-router-dom";

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Left brand panel — hidden on mobile */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 border-r border-outline-variant bg-[#0D0D0D] p-12">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded border border-outline-variant bg-surface-container-high flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-[20px]">hub</span>
          </div>
          <div>
            <p className="font-headline-md text-primary font-bold tracking-tighter text-[16px] leading-tight">ARCHON AI</p>
            <p className="font-label-caps text-outline text-[10px]">V2.0.4 CORE</p>
          </div>
        </Link>

        {/* Brand copy */}
        <div>
          <h2 className="font-display text-[40px] font-bold text-primary tracking-tighter leading-[1.1] mb-6">
            Intelligence,<br />Structured.
          </h2>
          <p className="font-body-sm text-on-surface-variant leading-relaxed mb-10">
            Archon AI runs a multi-agent pipeline to research any topic and deliver structured, cited reports in seconds.
          </p>

          {/* Feature list */}
          {[
            { icon: "psychology",   text: "6-agent research pipeline"    },
            { icon: "verified",     text: "Source validation & scoring"  },
            { icon: "description",  text: "Exportable PDF reports"       },
            { icon: "search",       text: "Hybrid BM25 + semantic search" },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-primary text-[18px]">{icon}</span>
              <span className="font-body-sm text-on-surface-variant">{text}</span>
            </div>
          ))}
        </div>

        <p className="font-label-caps text-outline text-[10px]"> 2026 ARCHON AI · ALL RIGHTS RESERVED</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12">
        {/* Mobile logo */}
        <Link to="/" className="flex items-center gap-3 mb-10 lg:hidden">
          <div className="w-8 h-8 rounded border border-outline-variant bg-surface-container-high flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-[18px]">hub</span>
          </div>
          <p className="font-headline-md text-primary font-bold tracking-tighter text-[16px]">ARCHON AI</p>
        </Link>
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
