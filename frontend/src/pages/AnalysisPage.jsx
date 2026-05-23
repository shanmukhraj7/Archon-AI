import { Link } from "react-router-dom";

const FEATURES = [
  {
    icon: "scatter_plot",
    title: "Correlation Matrix",
    desc: "Identify hidden relationships and dependencies between variables across multiple datasets and research sources.",
    tag: "QUANTITATIVE",
  },
  {
    icon: "trending_up",
    title: "Trend Analysis",
    desc: "Extract temporal patterns and forecast trajectories from your research data with AI-powered signal detection.",
    tag: "PREDICTIVE",
  },
  {
    icon: "share",
    title: "Entity Network",
    desc: "Visualize how organizations, people, and concepts interconnect across your entire research corpus.",
    tag: "GRAPH",
  },
  {
    icon: "psychology",
    title: "Sentiment Timeline",
    desc: "Track sentiment shifts over time across sources, news, and public discourse for any entity or topic.",
    tag: "NLP",
  },
  {
    icon: "compare",
    title: "Comparative Benchmarking",
    desc: "Side-by-side quantitative comparison of competitors, technologies, or market segments.",
    tag: "COMPARATIVE",
  },
  {
    icon: "bug_report",
    title: "Anomaly Detection",
    desc: "Surface outlier signals and unexpected data patterns that may indicate strategic opportunities or risks.",
    tag: "STATISTICAL",
  },
];

export default function AnalysisPage() {
  return (
    <div className="p-4 md:p-8 max-w-[1440px] mx-auto">
      {/* Header */}
      <div className="mb-12 border-b border-outline-variant pb-8">
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="bg-surface-container-high text-outline font-label-caps text-[10px] px-2 py-1 rounded-sm border border-outline-variant">
            ANALYSIS STUDIO
          </span>
          <span className="bg-surface-container-high text-primary font-label-caps text-[10px] px-2 py-1 rounded-sm border border-primary flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            IN DEVELOPMENT
          </span>
        </div>
        <h1 className="font-display text-[32px] md:text-[40px] font-bold text-primary tracking-tighter mb-3 max-w-3xl">
          Analysis Studio
        </h1>
        <p className="font-body-sm text-on-surface-variant max-w-2xl leading-relaxed">
          Cross-dimensional data analysis and pattern extraction across multiple research reports. 
          Uncover correlations, trends, and structural insights that single-report analysis misses.
        </p>
      </div>

      {/* Feature preview grid */}
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
              <h3 className="font-headline-md text-primary text-[16px] mb-2 tracking-tight">{f.title}</h3>
              <p className="font-body-sm text-on-surface-variant text-[13px] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="architectural-card rounded p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="font-headline-md text-primary mb-1">Ready to analyze?</h3>
          <p className="font-body-sm text-on-surface-variant">Start with a research session — your reports will be ready for analysis here.</p>
        </div>
        <Link
          to="/research"
          className="shrink-0 bg-primary text-background font-label-caps py-3 px-6 rounded flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          NEW RESEARCH
        </Link>
      </div>
    </div>
  );
}
