import { useState, useCallback, useEffect } from "react";
import { uploadDocument, getDocuments } from "../api/client";

export default function UploadPanel({ reportMetadata }) {
  const [contextFiles, setContextFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [logMessages, setLogMessages] = useState([]);
  const [error, setError] = useState(null);

  const fetchContext = useCallback(async () => {
    try {
      const res = await getDocuments();
      setContextFiles(Array.isArray(res.data) ? res.data : (res.data.active_documents || []));
    } catch {}
  }, []);

  useEffect(() => {
    fetchContext();
    const interval = setInterval(fetchContext, 5000);
    return () => clearInterval(interval);
  }, [fetchContext]);

  const addLog = (msg) => {
    setLogMessages((prev) => [...prev, `> ${msg}`]);
  };

  const handleUpload = async (file) => {
    setIsUploading(true);
    setError(null);
    addLog(`Initializing ingest pipeline for ${file.name}...`);
    try {
      await uploadDocument(file);
      addLog(`Parsing structural metadata...`);
      addLog(`Vectorizing semantic chunks (k=512)...`);
      await fetchContext();
      addLog(`Index built successfully. Context updated.`);
    } catch (e) {
      setError(e.message);
      addLog(`ERR: Pipeline failed for ${file.name}`);
    } finally {
      setIsUploading(false);
      setTimeout(() => setLogMessages([]), 5000);
    }
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="flex items-center gap-4 border-b border-outline-variant pb-2">
        <h3 className="font-label-caps text-[12px] text-primary tracking-widest flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]">account_tree</span>
          CONTEXT
        </h3>
        <h3 className="font-label-caps text-[12px] text-outline tracking-widest">
          SOURCES
        </h3>
      </div>

      <div
        className={`w-full p-8 rounded border border-dashed text-center flex flex-col items-center justify-center transition-colors cursor-pointer min-h-[160px] ${
          isDragging 
            ? "border-primary bg-surface-container-high" 
            : "border-outline-variant bg-[#0D0D0D] hover:border-outline"
        }`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => document.getElementById("file-upload").click()}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          onChange={(e) => {
            if (e.target.files.length > 0) handleUpload(e.target.files[0]);
          }}
        />
        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-outline animate-spin">refresh</span>
            <span className="font-body-sm text-outline">Processing...</span>
          </div>
        ) : (
          <>
            <span className="material-symbols-outlined text-outline text-[32px] mb-2">cloud_upload</span>
            <p className="font-body-sm text-primary mb-1">Drag files to ingest</p>
            <p className="font-label-caps text-outline text-[10px]">PDF, CSV, MD UP TO 50MB</p>
          </>
        )}
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-label-caps text-[10px] text-outline">
            ACTIVE IN CONTEXT ({contextFiles.length})
          </h4>
          {contextFiles.length > 0 && (
            <button className="font-label-caps text-[10px] text-primary hover:underline">
              CLEAR
            </button>
          )}
        </div>

        <div className="space-y-2">
          {contextFiles.map((doc, idx) => (
            <div key={idx} className="architectural-card p-4 rounded flex items-center gap-4 group">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-error text-[18px]">
                    {doc.metadata?.file_type === "application/pdf" ? "picture_as_pdf" : "description"}
                  </span>
                  <span className="font-body-sm text-primary truncate">
                    {doc.metadata?.original_filename || `Document ${idx + 1}`}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-label-caps text-outline text-[10px]">Processed</span>
                  <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                  <span className="font-label-caps text-outline text-[10px]">
                    {Math.round((doc.metadata?.file_size || 0) / 1024)}KB
                  </span>
                </div>
              </div>
            </div>
          ))}
          {contextFiles.length === 0 && !isUploading && (
            <div className="architectural-card p-4 rounded text-center">
              <span className="font-body-sm text-outline">No context loaded</span>
            </div>
          )}
        </div>
      </div>

      {logMessages.length > 0 && (
        <div className="mt-8 border-t border-outline-variant pt-4">
          <div className="font-label-caps text-primary text-[10px] space-y-1">
            {logMessages.map((msg, i) => (
              <div key={i} className={i === logMessages.length - 1 ? "text-primary font-bold" : "text-outline"}>
                {msg}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}