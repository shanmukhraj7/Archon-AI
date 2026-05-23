import { useState } from "react";

export default function QueryInput({ onSubmit, isLoading }) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSubmit(query);
    }
  };

  const handleCardClick = (text) => {
    if (!isLoading) {
      onSubmit(text);
    }
  };

  return (
    <div className="w-full max-w-3xl flex flex-col items-center px-2">
      <h2 className="font-display text-[32px] md:text-[48px] font-bold text-center mb-8 md:mb-12 tracking-tighter text-primary leading-[1.1]">
        Ignite Your Intelligence
      </h2>

      <form onSubmit={handleSubmit} className="w-full relative mb-16 group">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors text-[24px]">
          search
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={isLoading}
          className="w-full bg-[#0D0D0D] border border-[#333333] text-primary rounded py-4 pl-12 pr-12 focus:outline-none focus:border-primary transition-colors font-body-lg placeholder:text-on-surface-variant disabled:opacity-50"
          placeholder="Enter research query, entity, or topic..."
        />
        <button
          type="submit"
          disabled={!query.trim() || isLoading}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-background p-2 rounded flex items-center justify-center hover:opacity-90 disabled:opacity-50 disabled:hover:opacity-50 transition-opacity h-[40px] w-[40px]"
        >
          {isLoading ? (
            <span className="material-symbols-outlined animate-spin text-[20px]">refresh</span>
          ) : (
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          )}
        </button>
      </form>

      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
        {[
          {
            icon: "trending_up",
            title: "Market Trends",
            desc: "Analyze macroeconomic shifts and sector-specific momentum.",
            query: "Analyze current market trends in AI hardware",
          },
          {
            icon: "analytics",
            title: "Competitor Analysis",
            desc: "Deep dive into rival strategies, positioning, and vulnerabilities.",
            query: "Provide a competitor analysis for major LLM providers",
          },
          {
            icon: "account_tree",
            title: "Tech Ecosystem Map",
            desc: "Visualize technological dependencies and emerging architectures.",
            query: "Map the current technology ecosystem for quantum computing",
          },
          {
            icon: "groups",
            title: "Consumer Insights",
            desc: "Synthesize sentiment data and behavioral patterns.",
            query: "Synthesize consumer insights on spatial computing adoption",
          },
        ].map((c, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleCardClick(c.query)}
            disabled={isLoading}
            className="architectural-card p-6 rounded text-left flex flex-col gap-4 group transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-10 h-10 rounded border border-[#333333] bg-[#1A1A1A] flex items-center justify-center group-hover:border-primary transition-colors">
              <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors text-[20px]">
                {c.icon}
              </span>
            </div>
            <div>
              <h3 className="font-headline-md text-primary mb-2 tracking-tight text-[20px]">{c.title}</h3>
              <p className="font-body-sm text-on-surface-variant leading-relaxed text-[14px]">
                {c.desc}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}