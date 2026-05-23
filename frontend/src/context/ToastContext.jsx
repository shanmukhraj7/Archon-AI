import { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const showError = useCallback((msg) => {
    setError(msg);
    setTimeout(() => setError(null), 5000);
  }, []);

  const showMessage = useCallback((msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showError, showMessage }}>
      {children}

      {/* Global error toast */}
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[999] bg-[#1A0505] border border-error text-error px-4 md:px-6 py-3 rounded shadow-lg flex items-center gap-3 max-w-[90vw] md:max-w-xl animate-stepSlide">
          <span className="material-symbols-outlined text-[20px] shrink-0">warning</span>
          <span className="font-body-sm flex-1 break-words">{error}</span>
          <button onClick={() => setError(null)} className="ml-2 hover:text-white shrink-0" aria-label="Dismiss">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Global info toast */}
      {message && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[999] bg-surface-container-high border border-primary text-primary px-4 md:px-6 py-3 rounded shadow-lg flex items-center gap-3 max-w-[90vw] md:max-w-md animate-stepSlide">
          <span className="material-symbols-outlined text-[20px] shrink-0">info</span>
          <span className="font-body-sm flex-1">{message}</span>
          <button onClick={() => setMessage(null)} className="ml-2 hover:text-outline shrink-0" aria-label="Dismiss">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
};
