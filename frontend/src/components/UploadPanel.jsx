import { useState, useRef } from "react";
import { uploadDocument, getDocuments } from "../api/client";

export default function UploadPanel() {
  const [docs, setDocs] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const inputRef = useRef();

  const loadDocs = async () => {
    const res = await getDocuments();
    setDocs(res.data);
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMessage("");
    try {
      const res = await uploadDocument(file);
      setMessage(`✓ Indexed ${res.data.chunk_count} chunks from "${res.data.filename}"`);
      loadDocs();
    } catch {
      setMessage("✗ Upload failed. Check file type (PDF/DOCX only).");
    } finally {
      setUploading(false);
      inputRef.current.value = "";
    }
  };

  return (
    <div className="upload-panel">
      <h3>Upload Documents</h3>
      <p className="upload-hint">Add PDFs or DOCX files to search alongside the web.</p>
      <input ref={inputRef} type="file" accept=".pdf,.docx" onChange={handleUpload} disabled={uploading} className="file-input" />
      {message && <p className="upload-message">{message}</p>}
      {docs.length > 0 && (
        <ul className="doc-list">
          {docs.map((d) => (
            <li key={d.id}>📄 {d.filename} <span>({d.chunk_count} chunks)</span></li>
          ))}
        </ul>
      )}
    </div>
  );
}