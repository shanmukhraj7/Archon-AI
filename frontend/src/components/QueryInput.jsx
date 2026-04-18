import { useState } from "react";

const EXAMPLES = [
  { icon: "📈", text: "Analyze AI adoption trends in fintech for 2024–2025" },
  { icon: "👔", text: "Hiring trends for freshers in tech this year" },
  { icon: "🌐", text: "Compare remote work policies across Fortune 500" },
  { icon: "⚛️", text: "Recent breakthroughs in quantum computing" },
];

export default function QueryInput({ onSubmit, isLoading }) {
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    if (value.trim() && !isLoading) {
      onSubmit(value.trim());
      setValue("");
    }
  };

  return (
    <>
      <div className="query-card">
        <div className="query-top">
          <span className="query-top-dot" />
          <span className="query-top-label">Research Query</span>
        </div>

        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit(); }}
          placeholder='e.g. "Analyze the impact of AI on software jobs in 2024–2025"'
          rows={3}
          disabled={isLoading}
          className="query-textarea"
          autoFocus
        />

        <div className="query-bar">
          <span className="query-shortcuts">
            <span className="kbd">⌘</span>
            <span style={{ margin: "0 2px" }}>+</span>
            <span className="kbd">↵</span>
            <span style={{ marginLeft: 6 }}>to submit</span>
          </span>

          <button
            onClick={handleSubmit}
            disabled={isLoading || !value.trim()}
            className="query-btn"
          >
            {isLoading ? (
              <>
                <span className="btn-spinner" />
                Researching…
              </>
            ) : (
              <>Research →</>
            )}
          </button>
        </div>
      </div>

      {!isLoading && (
        <div className="examples-wrap">
          <div className="examples-label">Try an example</div>
          <div className="examples-grid">
            {EXAMPLES.map((ex, i) => (
              <button
                key={i}
                className="ex-chip"
                onClick={() => setValue(ex.text)}
              >
                <span className="ex-chip-icon">{ex.icon}</span>
                {ex.text}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}