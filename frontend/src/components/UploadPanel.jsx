import { useState, useRef, useEffect } from "react";
import { uploadDocument, getDocuments } from "../api/client";

export default function UploadPanel({ reportMetadata }) {
  const [docs, setDocs] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success'|'error', text }
  const inputRef = useRef();

  const loadDocs = async () => {
    try {
      const res = await getDocuments();
      setDocs(res.data);
    } catch {}
  };

  useEffect(() => { loadDocs(); }, []);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMessage(null);
    try {
      const res = await uploadDocument(file);
      setMessage({ type: "success", text: `✓ Indexed ${res.data.chunk_count} chunks from "${res.data.filename}"` });
      loadDocs();
    } catch {
      setMessage({ type: "error", text: "✗ Upload failed. Only PDF and DOCX files are supported." });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="right-scroll">
      {/* Stats */}
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
        <div className="upload-dropzone">
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx"
            onChange={handleUpload}
            disabled={uploading}
          />
          <div className="upload-icon">{uploading ? "⏳" : "📂"}</div>
          <div className="upload-dropzone-text">
            {uploading ? "Indexing document…" : "Click to upload a file"}
          </div>
          <div className="upload-dropzone-hint">PDF or DOCX · Used for RAG search</div>
        </div>

        {message && (
          <div className={`upload-message ${message.type}`}>{message.text}</div>
        )}

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
        <div className="tip-title">💡 Pro tip</div>
        <div className="tip-text">
          Upload your own PDFs or DOCX files to include them in research. Archon will search your documents alongside the web.
        </div>
      </div>
    </div>
  );
}