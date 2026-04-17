import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getPdfUrl } from "../api/client";

export default function ReportViewer({ report }) {
  if (!report) return null;

  const { id, query, status, report_markdown, metadata, created_at } = report;

  if (status === "running" || status === "pending") {
    return (
      <div className="report-loading">
        <div className="loading-orb">🔍</div>
        <div className="loading-title">
          Researching <span className="loading-query">"{query}"</span>
        </div>
        <div className="loading-steps">
          <div className="loading-step">
            <span className="step-icon">🧠</span>
            Breaking query into sub-topics…
          </div>
          <div className="loading-step">
            <span className="step-icon">🌐</span>
            Searching the web for current data…
          </div>
          <div className="loading-step">
            <span className="step-icon">📝</span>
            Synthesizing structured report…
          </div>
        </div>
      </div>
    );
  }

  if (status === "error") {
    const errText = report_markdown || "An unknown error occurred.";
    const shortErr = errText.replace(/^##\s*Error\s*/i, "").trim();
    return (
      <div className="report-error">
        <span className="report-error-icon">⚠️</span>
        <div>
          <div className="report-error-title">Research Failed</div>
          <div className="report-error-msg">{shortErr}</div>
        </div>
      </div>
    );
  }

  const date = created_at
    ? new Date(created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "";

  return (
    <div className="report-wrapper">
      <div className="report-topbar">
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span className="report-badge">Complete</span>
          {metadata && (
            <span className="report-meta-text">
              {metadata.word_count} words · {metadata.section_count} sections
              {date ? ` · ${date}` : ""}
            </span>
          )}
        </div>
        <div className="report-topbar-right">
          <a href={getPdfUrl(id)} target="_blank" rel="noreferrer" className="pdf-btn">
            ↓ Export PDF
          </a>
        </div>
      </div>
      <div className="report-body">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{report_markdown}</ReactMarkdown>
      </div>
    </div>
  );
}