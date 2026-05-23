import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";

export default function LogoutPage() {
  const navigate = useNavigate();
  const { showMessage } = useToast();
  const { logout } = useAuth();

  useEffect(() => {
    logout();
    showMessage("You have been logged out.");
    const t = setTimeout(() => navigate("/login", { replace: true }), 1500);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line

  return (
    <div className="flex flex-col items-center justify-center min-h-full p-8 text-center">
      <span className="material-symbols-outlined text-primary text-[48px] animate-pulse mb-4">logout</span>
      <h1 className="font-headline-md text-primary text-[20px] mb-2">Logging out…</h1>
      <p className="font-body-sm text-on-surface-variant">Redirecting you to the home page.</p>
    </div>
  );
}
