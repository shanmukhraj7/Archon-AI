import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getPdfUrl } from "../api/client";
import AgentTrace from "./AgentTrace";

export default function ReportViewer({ report }) {
  if (!report) return null;

  const { id, query, status, report_markdown, metadata, created_at } = report;

  /* ── Loading ── */
  if (status === "running" || status === "pending") {
    return (
      <div className="report-loading">
        <div className="loading-orb-wrap">
          <div className="loading-orb">🔍</div>
          <div className="loading-ring" />
        </div>

        <div className="loading-title">
          Researching&nbsp;
          <span className="loading-query">"{query}"</span>
        </div>

        <div className="loading-steps">
          {[
            { icon: "🧠", label: "Planning research strategy" },
            { icon: "🌐", label: "Executing hybrid retrieval" },
            { icon: "✅", label: "Validating source quality" },
            { icon: "📝", label: "Summarizing findings" },
            { icon: "✍️", label: "Writing structured report" },
            { icon: "🧐", label: "Reviewing for completeness" },
          ].map((s, i) => (
            <div key={i} className="loading-step">
              <span className="step-icon">{s.icon}</span>
              <span style={{ flex: 1 }}>{s.label}…</span>
              <div className="step-bar">
                <div className="step-bar-fill" style={{ animationDelay: `${i * 0.6}s` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (status === "error") {
    const msg = (report_markdown || "An unknown error occurred.")
      .replace(/^##\s*Error\s*/i, "").trim();
    return (
      <div className="report-error">
        <div className="err-icon-wrap">⚠️</div>
        <div>
          <div className="err-title">Research Failed</div>
          <div className="err-msg">{msg}</div>
        </div>
      </div>
    );
  }

  /* ── Done ── */
  const date = created_at
    ? new Date(created_at).toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric",
      })
    : "";

  return (
    <div className="report-wrapper">
      {/* Topbar */}
      <div className="report-topbar">
        <div className="topbar-left">
          <span className="report-badge">
            <span className="badge-dot" />
            Complete
          </span>

          {metadata && (
            <div className="report-stats">
              <span className="report-stat">{metadata.word_count} words</span>
              <span className="report-stat">{metadata.section_count} sections</span>
              {date && <span className="report-stat">{date}</span>}
            </div>
          )}
        </div>

        <div className="topbar-right">
          <a
            href={getPdfUrl(id)}
            target="_blank"
            rel="noreferrer"
            className="pdf-btn"
          >
            ↓ Export PDF
          </a>
        </div>
      </div>

      {/* Evaluation Metrics */}
      {metadata && metadata.eval_scores && (
        <div className="eval-metrics">
          <div className="eval-metrics-title">Report Quality Metrics</div>
          <div className="eval-metrics-grid">
            {[
              { label: "Faithfulness", value: metadata.eval_scores.faithfulness, help: "Are claims grounded in sources?" },
              { label: "Answer Relevance", value: metadata.eval_scores.answer_relevance, help: "Does the report answer the query?" },
              { label: "Source Coverage", value: metadata.eval_scores.source_coverage, help: "Were all sub-topics addressed?" }
            ].map((metric, idx) => {
              const pct = Math.round((metric.value || 0) * 100);
              return (
                <div key={idx} className="metric-card" title={metric.help}>
                  <div className="metric-header">
                    <span>{metric.label}</span>
                    <span className="metric-pct">{pct}%</span>
                  </div>
                  <div className="metric-bar-bg">
                    <div className="metric-bar-fill" style={{ width: `${pct}%`, backgroundColor: pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Agent Trace Panel */}
      <AgentTrace reportId={id} metadata={metadata} />

      {/* Body */}
      <div className="report-body">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {report_markdown}
        </ReactMarkdown>
      </div>
    </div>
  );
}