import { Link } from "react-router-dom";

const FEATURES = [
  {
    icon: "merge",
    title: "Multi-Report Merging",
    desc: "Fuse findings from multiple research threads into a single, coherent master document with zero duplication.",
    tag: "FUSION",
  },
  {
    icon: "fact_check",
    title: "Contradiction Detection",
    desc: "Automatically surface conflicting claims across sources and highlight areas requiring deeper verification.",
    tag: "VALIDATION",
  },
  {
    icon: "account_tree",
    title: "Knowledge Graph",
    desc: "Construct a living ontology of concepts, entities, and their relationships across your entire research base.",
    tag: "GRAPH",
  },
  {
    icon: "summarize",
    title: "Executive Distillation",
    desc: "Compress hundreds of pages of research into precise, board-ready executive summaries with key signal extraction.",
    tag: "NLP",
  },
  {
    icon: "lightbulb",
    title: "Insight Extraction",
    desc: "AI-powered identification of non-obvious insights hidden within large volumes of structured research data.",
    tag: "AI",
  },
  {
    icon: "file_copy",
    title: "Report Templates",
    desc: "Generate standardized output formats: investment memos, competitive briefs, technical assessments, and more.",
    tag: "EXPORT",
  },
];

export default function SynthesisPage() {
  return (
    <div className="p-4 md:p-8 max-w-[1440px] mx-auto">
      <div className="mb-12 border-b border-outline-variant pb-8">
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="bg-surface-container-high text-outline font-label-caps text-[10px] px-2 py-1 rounded-sm border border-outline-variant">
            SYNTHESIS ENGINE
          </span>
          <span className="bg-surface-container-high text-primary font-label-caps text-[10px] px-2 py-1 rounded-sm border border-primary flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            IN DEVELOPMENT
          </span>
        </div>
        <h1 className="font-display text-[32px] md:text-[40px] font-bold text-primary tracking-tighter mb-3 max-w-3xl">
          Synthesis Engine
        </h1>
        <p className="font-body-sm text-on-surface-variant max-w-2xl leading-relaxed">
          Merge multiple research threads into unified, structured knowledge documents.
          The Synthesis Engine transforms scattered intelligence into actionable, coherent output.
        </p>
      </div>

      {/* How it works */}
      <div className="mb-12">
        <h2 className="font-label-caps text-outline text-[10px] mb-6 tracking-widest">HOW IT WORKS</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { step: "01", icon: "library_books", title: "Select Reports", desc: "Choose two or more completed research reports from your history." },
            { step: "02", icon: "psychology",    title: "AI Synthesis",   desc: "Archon's synthesis model merges, deduplicates, and reconciles all findings." },
            { step: "03", icon: "description",   title: "Export Output",  desc: "Download a unified PDF, markdown, or structured JSON knowledge document." },
          ].map(({ step, icon, title, desc }) => (
            <div key={step} className="architectural-card p-6 rounded relative overflow-hidden group hover:border-primary transition-colors">
              <span className="absolute top-4 right-4 font-headline-lg text-[40px] text-outline-variant font-bold leading-none select-none">{step}</span>
              <span className="material-symbols-outlined text-primary text-[28px] mb-4 block">{icon}</span>
              <h3 className="font-headline-md text-primary text-[16px] mb-2">{title}</h3>
              <p className="font-body-sm text-on-surface-variant text-[13px] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-12">
        <h2 className="font-label-caps text-outline text-[10px] mb-6 tracking-widest">PLANNED CAPABILITIES</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <div key={i} className="architectural-card p-6 rounded group hover:border-primary transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded border border-[#333333] bg-[#1A1A1A] flex items-center justify-center group-hover:border-primary transition-colors">
                  <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors text-[20px]">{f.icon}</span>
                </div>
                <span className="font-label-caps text-[9px] text-outline border border-outline-variant px-2 py-1 rounded-sm">{f.tag}</span>
              </div>
              <h3 className="font-headline-md text-primary text-[16px] mb-2">{f.title}</h3>
              <p className="font-body-sm text-on-surface-variant text-[13px] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="architectural-card rounded p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="font-headline-md text-primary mb-1">Build your knowledge base first</h3>
          <p className="font-body-sm text-on-surface-variant">Run several research sessions — Synthesis works best with multiple reports.</p>
        </div>
        <Link to="/research" className="shrink-0 bg-primary text-background font-label-caps py-3 px-6 rounded flex items-center gap-2 hover:opacity-90 transition-opacity">
          <span className="material-symbols-outlined text-[16px]">add</span>
          NEW RESEARCH
        </Link>
      </div>
    </div>
  );
}
