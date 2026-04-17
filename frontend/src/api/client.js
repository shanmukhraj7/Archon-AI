import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  timeout: 120000,
});

export const submitQuery = (query) => api.post("/api/query", { query });
export const getReport = (id) => api.get(`/api/report/${id}`);
export const getHistory = () => api.get("/api/history");
export const deleteHistory = (id) => api.delete(`/api/history/${id}`);
export const uploadDocument = (file) => {
  const form = new FormData();
  form.append("file", file);
  return api.post("/api/upload", form, { headers: { "Content-Type": "multipart/form-data" } });
};
export const getDocuments = () => api.get("/api/documents");
export const getPdfUrl = (id) => `${api.defaults.baseURL}/api/report/${id}/pdf`;