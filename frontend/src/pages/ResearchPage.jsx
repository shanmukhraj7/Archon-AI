import { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import QueryInput from "../components/QueryInput";
import ReportViewer from "../components/ReportViewer";
import UploadPanel from "../components/UploadPanel";
import { submitQuery, getReport } from "../api/client";
import { useToast } from "../context/ToastContext";

export default function ResearchPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showError } = useToast();

  const [activeReport, setActiveReport] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load report when navigating to /research/:id
  useEffect(() => {
    if (id) {
      setIsLoading(false);
      getReport(id)
        .then((res) => {
          setActiveReport(res.data);
          if (res.data.status === "running" || res.data.status === "pending") {
            pollReport(id);
          }
        })
        .catch(() => {
          showError("Could not load report. It may have been deleted.");
          navigate("/research");
        });
    } else {
      setActiveReport(null);
    }
  }, [id, pollReport]);

  const pollReport = useCallback(async (reportId) => {
    try {
      const res = await getReport(reportId);
      setActiveReport(res.data);
      if (res.data.status === "running" || res.data.status === "pending") {
        setTimeout(() => pollReport(reportId), 2500);
      } else {
        setIsLoading(false);
      }
    } catch {
      setIsLoading(false);
    }
  }, []);

  const handleSubmit = async (query) => {
    setIsLoading(true);
    setActiveReport(null);
    try {
      const res = await submitQuery(query);
      const newId = res.data.id;
      setActiveReport({ id: newId, query, status: "pending" });
      navigate(`/research/${newId}`, { replace: false });
      pollReport(newId);
    } catch (err) {
      setIsLoading(false);
      showError(err.response?.data?.detail || "Failed to start research. Check backend logs or API keys.");
    }
  };

  return (
    <div className="p-4 md:p-8 h-full">
      {!activeReport ? (
        <div className="w-full h-full flex items-center justify-center py-8">
          <QueryInput onSubmit={handleSubmit} isLoading={isLoading} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start max-w-[1440px] mx-auto">
          <div className="lg:col-span-9 space-y-8 md:space-y-12">
            <ReportViewer report={activeReport} />
          </div>
          <div className="lg:col-span-3">
            <div className="lg:sticky lg:top-0 space-y-8">
              <UploadPanel reportMetadata={activeReport?.metadata} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
