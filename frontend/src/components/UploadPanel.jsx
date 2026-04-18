import { useState, useRef, useEffect } from "react";
import { uploadDocument, getDocuments } from "../api/client";

export default function UploadPanel({ reportMetadata }) {
  const [docs, setDocs]         = useState([]);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg]            = useState(null);
  const inputRef = useRef();

  const loadDocs = async () => {
    try { const r = await getDocuments(); setDocs(r.data); } catch {}
  };

  useEffect(() => { loadDocs(); }, []);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setMsg(null);
    try {
      const r = await uploadDocument(file);
      setMsg({ type: "success", text: `✓ Indexed ${r.data.chunk_count} chunks from "${r.data.filename}"` });
      loadDocs();
    } catch {
      setMsg({ type: "error", text: "✗ Upload failed. Only PDF and DOCX supported." });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="right-scroll">

      {/* Report stats */}
      {reportMetadata && (
        <div>
          <div className="panel-title">Report Stats</div>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{reportMetadata.word_count ?? "—"}</div>
              <div className="stat-label">Words</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{reportMetadata.section_count ?? "—"}</div>
              <div className="stat-label">Sections</div>
            </div>
          </div>
        </div>
      )}

      {/* Upload */}
      <div>
        <div className="panel-title">Your Documents</div>
        <div className="upload-zone">
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx"
            onChange={handleUpload}
            disabled={uploading}
          />
          <div className="upload-zone-icon">{uploading ? "⏳" : "📂"}</div>
          <div className="upload-zone-title">
            {uploading ? "Indexing…" : "Click to upload"}
          </div>
          <div className="upload-zone-hint">PDF or DOCX · Searched alongside the web</div>
        </div>

        {msg && <div className={`upload-msg ${msg.type}`}>{msg.text}</div>}

        {docs.length > 0 && (
          <ul className="doc-list">
            {docs.map((d) => (
              <li key={d.id} className="doc-item">
                <span className="doc-icon">📄</span>
                <span className="doc-name">{d.filename}</span>
                <span className="doc-chunks">{d.chunk_count}c</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Tip */}
      <div className="tip-card">
        <div className="tip-head">💡 Pro Tip</div>
        <div className="tip-body">
          Upload PDFs or DOCX files to include your own documents in research.
          Archon will search them alongside live web results.
        </div>
      </div>

    </div>
  );
}