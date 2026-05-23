import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getHistory, deleteHistory } from "../api/client";
import { useToast } from "../context/ToastContext";

const STATUS_COLORS = {
  done:    { dot: "bg-[#22c55e]", text: "text-[#22c55e]", label: "DONE"    },
  error:   { dot: "bg-error",     text: "text-error",     label: "ERROR"   },
  running: { dot: "bg-primary animate-pulse", text: "text-primary", label: "RUNNING" },
  pending: { dot: "bg-primary animate-pulse", text: "text-primary", label: "PENDING" },
};

export default function HistoryPage() {
  const navigate = useNavigate();
  const { showError } = useToast();
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    setIsLoading(true);
    getHistory()
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : (res.data.reports || []);
        setReports(data);
      })
      .catch(() => showError("Failed to load history."))
      .finally(() => setIsLoading(false));
  }, []); // eslint-disable-line

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await deleteHistory(id);
      setReports((prev) => prev.filter((r) => r.id !== id));
    } catch {
      showError("Failed to delete report.");
    }
  };

  const filtered = useMemo(() => {
    let list = [...reports];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((r) => r.query?.toLowerCase().includes(q));
    }
    if (sortBy === "newest") list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    if (sortBy === "oldest") list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    if (sortBy === "az")     list.sort((a, b) => (a.query || "").localeCompare(b.query || ""));
    return list;
  }, [reports, search, sortBy]);

  const formatDate = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="p-4 md:p-8 max-w-[1440px] mx-auto">
      {/* Page header */}
      <div className="mb-8 border-b border-outline-variant pb-8">
        <div className="flex gap-2 mb-4">
          <span className="bg-surface-container-high text-outline font-label-caps text-[10px] px-2 py-1 rounded-sm border border-outline-variant">
            WORKSPACE
          </span>
        </div>
        <h1 className="font-display text-[32px] md:text-[40px] font-bold text-primary tracking-tighter mb-2">
          Research History
        </h1>
        <p className="font-body-sm text-on-surface-variant">
          All past research sessions — click any entry to view the full report.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search queries..."
            className="w-full bg-[#0D0D0D] border border-[#333333] text-primary rounded py-3 pl-10 pr-4 focus:outline-none focus:border-primary transition-colors font-body-sm placeholder:text-on-surface-variant"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-[#0D0D0D] border border-[#333333] text-primary rounded py-3 px-4 focus:outline-none focus:border-primary transition-colors font-label-caps text-[12px] cursor-pointer shrink-0"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="az">A → Z</option>
        </select>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "TOTAL REPORTS", value: reports.length },
          { label: "COMPLETED",     value: reports.filter((r) => r.status === "done").length },
          { label: "FAILED",        value: reports.filter((r) => r.status === "error").length },
          { label: "SHOWING",       value: filtered.length },
        ].map(({ label, value }) => (
          <div key={label} className="architectural-card p-4 rounded">
            <span className="font-label-caps text-outline text-[10px] block mb-1">{label}</span>
            <span className="font-headline-lg text-primary text-[28px]">{value}</span>
          </div>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-24">
          <span className="material-symbols-outlined text-primary text-[40px] animate-pulse">psychology</span>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filtered.length === 0 && (
        <div className="architectural-card rounded p-16 flex flex-col items-center text-center">
          <span className="material-symbols-outlined text-outline text-[48px] mb-4">history</span>
          <h3 className="font-headline-md text-primary mb-2">
            {search ? "No results found" : "No research history yet"}
          </h3>
          <p className="font-body-sm text-on-surface-variant mb-6">
            {search ? "Try a different search term." : "Start a new research session to see it here."}
          </p>
          {!search && (
            <button
              onClick={() => navigate("/research")}
              className="bg-primary text-background font-label-caps py-2 px-6 rounded hover:opacity-90 transition-opacity"
            >
              START RESEARCH
            </button>
          )}
        </div>
      )}

      {/* Report list */}
      {!isLoading && filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map((r) => {
            const s = STATUS_COLORS[r.status] || STATUS_COLORS.done;
            return (
              <div
                key={r.id}
                onClick={() => navigate(`/research/${r.id}`)}
                className="architectural-card rounded p-5 flex items-center justify-between gap-4 cursor-pointer group hover:border-primary transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${s.dot}`} />
                  <div className="min-w-0">
                    <p className="font-body-sm text-primary truncate group-hover:text-white transition-colors">
                      {r.query}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`font-label-caps text-[10px] ${s.text}`}>{s.label}</span>
                      <span className="w-1 h-1 rounded-full bg-outline-variant" />
                      <span className="font-label-caps text-outline text-[10px]">{formatDate(r.created_at)}</span>
                      {r.metadata?.word_count && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-outline-variant" />
                          <span className="font-label-caps text-outline text-[10px]">{r.metadata.word_count} words</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={(e) => handleDelete(e, r.id)}
                    className="text-on-surface-variant hover:text-error opacity-0 group-hover:opacity-100 transition-all p-2 rounded hover:bg-surface-container"
                    aria-label="Delete"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                  <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors text-[18px]">
                    arrow_forward
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
