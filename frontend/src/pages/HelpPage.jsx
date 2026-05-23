import { useState } from "react";
import { Link } from "react-router-dom";

const FAQS = [
  {
    q: "How does the Archon AI research pipeline work?",
    a: "Archon uses a multi-agent system where specialized agents handle query decomposition, information retrieval, source verification, and synthesis. Each research session runs these agents in parallel to produce a structured, cited report.",
  },
  {
    q: "What data sources does Archon search?",
    a: "By default, Archon searches public web sources via its retrieval agents. You can also upload your own documents (PDFs, CSV, Markdown) via the Context panel to ground research in proprietary data.",
  },
  {
    q: "How long does a research report take?",
    a: "Most reports complete in 30–120 seconds depending on query complexity, research depth setting, and source availability. Deep and Exhaustive modes may take longer.",
  },
  {
    q: "Can I export my reports?",
    a: "Yes. Every completed report has an 'Export PDF' button. You can also access raw markdown via the API. More export formats (DOCX, JSON, LaTeX) are planned.",
  },
  {
    q: "How do I increase research depth?",
    a: "Go to Settings → Research Configuration → Research Depth. Options are Shallow, Balanced, Deep, and Exhaustive. Deeper modes consume more tokens but produce more comprehensive reports.",
  },
  {
    q: "What happens if a research session fails?",
    a: "Failed reports display an error message with the cause. Common causes include API key issues, network timeouts, or queries that are too ambiguous. You can retry by starting a new session with a refined query.",
  },
  {
    q: "Is my research data private?",
    a: "All research sessions are stored locally in your backend instance. No data is shared externally unless you configure third-party integrations. See Settings for data region info.",
  },
  {
    q: "How do I upload context documents?",
    a: "When a report is open, use the Context panel on the right side. Drag and drop a PDF, CSV, or Markdown file — it will be vectorized and used to ground subsequent research sessions.",
  },
];

function FAQ({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="architectural-card rounded overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-surface-container transition-colors group"
      >
        <span className="font-body-sm text-primary font-medium pr-4">{q}</span>
        <span
          className={`material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-all shrink-0 ${open ? "rotate-180" : ""}`}
          style={{ transition: "transform 0.2s" }}
        >
          expand_more
        </span>
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-outline-variant">
          <p className="font-body-sm text-on-surface-variant leading-relaxed pt-4">{a}</p>
        </div>
      )}
    </div>
  );
}

export default function HelpPage() {
  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8 border-b border-outline-variant pb-8">
        <div className="flex gap-2 mb-4">
          <span className="bg-surface-container-high text-outline font-label-caps text-[10px] px-2 py-1 rounded-sm border border-outline-variant">
            DOCUMENTATION
          </span>
        </div>
        <h1 className="font-display text-[32px] md:text-[40px] font-bold text-primary tracking-tighter mb-2">
          Help & FAQ
        </h1>
        <p className="font-body-sm text-on-surface-variant">Everything you need to get the most out of Archon AI.</p>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {[
          { icon: "rocket_launch", title: "Quick Start",    desc: "Get your first report in 60 seconds.",  to: "/research" },
          { icon: "settings",      title: "Configuration",  desc: "Tune research depth and output format.", to: "/settings" },
          { icon: "history",       title: "Past Reports",   desc: "Browse and re-read previous research.",  to: "/history"  },
        ].map(({ icon, title, desc, to }) => (
          <Link
            key={title}
            to={to}
            className="architectural-card p-5 rounded flex flex-col gap-3 group hover:border-primary transition-colors"
          >
            <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors text-[24px]">{icon}</span>
            <div>
              <p className="font-body-sm text-primary font-medium mb-1">{title}</p>
              <p className="font-body-sm text-on-surface-variant text-[13px]">{desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* FAQ */}
      <div className="mb-10">
        <h2 className="font-label-caps text-outline text-[10px] tracking-widest mb-6">FREQUENTLY ASKED QUESTIONS</h2>
        <div className="space-y-2">
          {FAQS.map((f, i) => <FAQ key={i} {...f} />)}
        </div>
      </div>

      {/* Contact */}
      <div className="architectural-card rounded p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="font-headline-md text-primary mb-1">Still need help?</h3>
          <p className="font-body-sm text-on-surface-variant">
            Open an issue on GitHub or check the project README for advanced configuration.
          </p>
        </div>
        <a
          href="https://github.com"
          target="_blank"
          rel="noreferrer"
          className="shrink-0 border border-outline-variant text-primary font-label-caps py-3 px-6 rounded flex items-center gap-2 hover:border-primary transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">open_in_new</span>
          GITHUB
        </a>
      </div>
    </div>
  );
}
