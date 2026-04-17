import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getPdfUrl } from "../api/client";

export default function ReportViewer({ report }) {
  if (!report) return null;

  const { id, query, status, report_markdown, metadata } = report;

  if (status === "running" || status === "pending") {
    return (
      <div className="report-loading">
        <div className="spinner" />
        <p>Researching <em>"{query}"</em>…</p>
        <small>Searching web + documents, synthesizing report…</small>
      </div>
    );
  }

  if (status === "error") {
    return <div className="report-error">Research failed. Please try again.</div>;
  }

  return (
    <div className="report-wrapper">
      <div className="report-actions">
        {metadata && (
          <span className="report-meta">
            {metadata.word_count} words · {metadata.section_count} sections
          </span>
        )}
        <a href={getPdfUrl(id)} target="_blank" rel="noreferrer" className="pdf-btn">
          ↓ Export PDF
        </a>
      </div>
      <div className="report-body">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{report_markdown}</ReactMarkdown>
      </div>
    </div>
  );
}