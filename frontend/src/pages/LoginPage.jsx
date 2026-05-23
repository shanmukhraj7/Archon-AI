import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";
import { authLogin } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showError } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setIsLoading(true);
    try {
      const res = await authLogin(email.trim(), password);
      login(res.data.access_token, res.data.user);
      navigate("/research", { replace: true });
    } catch (err) {
      showError(err.response?.data?.detail || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      {/* Header */}
      <div className="mb-8">
        <div className="flex gap-2 mb-5">
          <span className="bg-surface-container-high text-outline font-label-caps text-[10px] px-2 py-1 rounded-sm border border-outline-variant">
            SECURE LOGIN
          </span>
        </div>
        <h1 className="font-display text-[32px] font-bold text-primary tracking-tighter mb-2">
          Welcome back
        </h1>
        <p className="font-body-sm text-on-surface-variant">
          Sign in to continue your research.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div className="space-y-1.5">
          <label className="font-label-caps text-[11px] text-outline block" htmlFor="login-email">
            EMAIL ADDRESS
          </label>
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors text-[20px]">
              mail
            </span>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="w-full bg-[#0D0D0D] border border-[#333333] text-primary rounded py-3.5 pl-10 pr-4 focus:outline-none focus:border-primary transition-colors font-body-sm placeholder:text-on-surface-variant"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label className="font-label-caps text-[11px] text-outline block" htmlFor="login-password">
            PASSWORD
          </label>
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors text-[20px]">
              lock
            </span>
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full bg-[#0D0D0D] border border-[#333333] text-primary rounded py-3.5 pl-10 pr-12 focus:outline-none focus:border-primary transition-colors font-body-sm placeholder:text-on-surface-variant"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <span className="material-symbols-outlined text-[20px]">
                {showPassword ? "visibility_off" : "visibility"}
              </span>
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading || !email.trim() || !password}
          className="w-full bg-primary text-background font-label-caps py-3.5 rounded flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          {isLoading ? (
            <>
              <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
              SIGNING IN…
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[18px]">login</span>
              SIGN IN
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-4 my-6">
        <div className="flex-1 h-px bg-outline-variant" />
        <span className="font-label-caps text-outline text-[10px]">OR</span>
        <div className="flex-1 h-px bg-outline-variant" />
      </div>

      {/* Register link */}
      <p className="text-center font-body-sm text-on-surface-variant">
        Don't have an account?{" "}
        <Link to="/register" className="text-primary hover:underline font-medium">
          Create one
        </Link>
      </p>
    </AuthLayout>
  );
}
