import { useState } from "react";

export default function QueryInput({ onSubmit, isLoading }) {
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    if (value.trim() && !isLoading) {
      onSubmit(value.trim());
      setValue("");
    }
  };

  return (
    <div className="query-input-wrapper">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && e.metaKey) handleSubmit(); }}
        placeholder='Ask anything — e.g. "Analyze AI adoption in fintech 2024–2025"'
        rows={3}
        disabled={isLoading}
        className="query-textarea"
      />
      <button onClick={handleSubmit} disabled={isLoading || !value.trim()} className="query-btn">
        {isLoading ? "Researching…" : "Research →"}
      </button>
    </div>
  );
}