import React, { useState, useEffect } from "react";
import { getTrace } from "../api/client";

export default function AgentTrace({ reportId, metadata }) {
  const [isOpen, setIsOpen] = useState(false);
  const [traceData, setTraceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && !traceData && !loading) {
      setLoading(true);
      getTrace(reportId)
        .then((res) => {
          setTraceData(res.data);
          setLoading(false);
        })
        .catch((err) => {
          setError("Failed to load trace data");
          setLoading(false);
        });
    }
  }, [isOpen, reportId, traceData, loading]);

  return (
    <div className="agent-trace-panel">
      <div 
        className="agent-trace-header" 
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="agent-trace-title">
          <span className="icon">🕵️</span> Agent Execution Trace
        </div>
        <div className="agent-trace-toggle">
          {isOpen ? "▲ Hide" : "▼ Show"}
        </div>
      </div>

      {isOpen && (
        <div className="agent-trace-body">
          {/* Top-level metadata like validator/reviewer scores from the DB metadata field */}
          {metadata && (
            <div className="agent-scores">
              {metadata.source_quality_score !== undefined && (
                <div className="score-badge validator">
                  <strong>Validator Score:</strong> {metadata.source_quality_score}/10
                </div>
              )}
              {metadata.review_score !== undefined && (
                <div className={`score-badge reviewer ${metadata.review_passed ? "pass" : "fail"}`}>
                  <strong>Review Score:</strong> {metadata.review_score}/10 
                  <span className="status-label">{metadata.review_passed ? " (PASS)" : " (FAIL)"}</span>
                </div>
              )}
            </div>
          )}

          {metadata?.review_feedback && !metadata.review_passed && (
            <div className="reviewer-feedback">
              <strong>Reviewer Feedback:</strong> {metadata.review_feedback}
            </div>
          )}

          {loading && <div className="trace-loading">Loading trace timeline...</div>}
          {error && <div className="trace-error">{error}</div>}

          {/* Timeline built from the DecisionTrace API */}
          {traceData && traceData.steps && (
            <div className="trace-timeline">
              {traceData.steps.map((step, idx) => (
                <div key={idx} className="trace-step">
                  <div className={`step-dot ${step.success ? "success" : "error"}`}></div>
                  <div className="step-content">
                    <div className="step-name">
                      {step.node_name.replace("_", " ").toUpperCase()}
                      <span className="step-duration">{step.duration_ms}ms</span>
                    </div>
                    <div className="step-details">
                      {step.output_summary}
                    </div>
                  </div>
                </div>
              ))}
              <div className="trace-summary">
                Total Execution Time: {traceData.total_duration_ms}ms | {traceData.step_count} Steps
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
