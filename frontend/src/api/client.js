import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "" : "http://localhost:8000");

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 120000,
});

// Inject Bearer token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("archon_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const submitQuery    = (query) => api.post("/api/query", { query });
export const getReport      = (id)    => api.get(`/api/report/${id}`);
export const getTrace       = (id)    => api.get(`/api/report/${id}/trace`);
export const getHistory     = ()      => api.get("/api/history");
export const deleteHistory  = (id)    => api.delete(`/api/history/${id}`);
export const getDocuments   = ()      => api.get("/api/documents");
export const getAgentsStatus= ()      => api.get("/api/agents/status");
export const getPdfUrl      = (id)    => `${BASE_URL}/api/report/${id}/pdf`;

export const uploadDocument = (file) => {
  const form = new FormData();
  form.append("file", file);
  return api.post("/api/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

/**
 * Create an SSE connection to stream live agent step updates.
 * Returns an EventSource instance. Caller should close() it when done.
 */
export const streamReportProgress = (reportId, onStep, onComplete) => {
  const url = `${BASE_URL}/api/report/${reportId}/stream`;
  const es = new EventSource(url);

  es.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === "agent_step") {
        onStep && onStep(data.step);
      } else if (data.type === "complete" || data.type === "timeout") {
        onComplete && onComplete(data);
        es.close();
      }
    } catch (_) {}
  };

  es.onerror = () => {
    es.close();
  };

  return es;
};

export default api;