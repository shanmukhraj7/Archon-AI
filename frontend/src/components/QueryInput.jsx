import { useState } from "react";

const EXAMPLES = [
  "Analyze AI adoption trends in fintech for 2024–2025",
  "What are the hiring trends for freshers in tech this year?",
  "Compare remote work policies across Fortune 500 companies",
  "Summarize recent breakthroughs in quantum computing",
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
        <div className="query-label">
          <span className="query-label-dot" />
          Research Query
        </div>
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit(); }}
          placeholder='e.g. "Analyze the impact of AI on software engineering jobs in 2024–2025"'
          rows={3}
          disabled={isLoading}
          className="query-textarea"
          autoFocus
        />
        <div className="query-footer">
          <span className="query-hint">
            <kbd>⌘</kbd> + <kbd>Enter</kbd> to submit
          </span>
          <button onClick={handleSubmit} disabled={isLoading || !value.trim()} className="query-btn">
            {isLoading ? (
              <>
                <span className="btn-spinner" />
                Researching…
              </>
            ) : (
              <>
                <span>Research</span>
                <span>→</span>
              </>
            )}
          </button>
        </div>
      </div>

      {!isLoading && (
        <div className="examples-section">
          <div className="examples-label">Try an example</div>
          <div className="examples-grid">
            {EXAMPLES.map((ex, i) => (
              <button key={i} className="example-chip" onClick={() => setValue(ex)}>
                {ex}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}