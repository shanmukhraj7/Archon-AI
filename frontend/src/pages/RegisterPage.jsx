import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";
import { authRegister } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showError } = useToast();

  const [form, setForm] = useState({ username: "", email: "", password: "", confirm: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (form.username.trim().length < 2) errs.username = "At least 2 characters required";
    if (!form.email.includes("@"))        errs.email    = "Enter a valid email address";
    if (form.password.length < 6)         errs.password = "At least 6 characters required";
    if (form.password !== form.confirm)   errs.confirm  = "Passwords do not match";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const res = await authRegister(form.username.trim(), form.email.trim(), form.password);
      login(res.data.access_token, res.data.user);
      navigate("/research", { replace: true });
    } catch (err) {
      showError(err.response?.data?.detail || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const fieldClass = (key) =>
    `w-full bg-[#0D0D0D] border text-primary rounded py-3.5 pl-10 pr-4 focus:outline-none transition-colors font-body-sm placeholder:text-on-surface-variant ${
      errors[key] ? "border-error focus:border-error" : "border-[#333333] focus:border-primary"
    }`;

  return (
    <AuthLayout>
      {/* Header */}
      <div className="mb-8">
        <div className="flex gap-2 mb-5">
          <span className="bg-surface-container-high text-outline font-label-caps text-[10px] px-2 py-1 rounded-sm border border-outline-variant">
            CREATE ACCOUNT
          </span>
        </div>
        <h1 className="font-display text-[32px] font-bold text-primary tracking-tighter mb-2">
          Get started
        </h1>
        <p className="font-body-sm text-on-surface-variant">
          Create your Archon AI account in seconds.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Username */}
        <div className="space-y-1.5">
          <label className="font-label-caps text-[11px] text-outline block" htmlFor="reg-username">
            USERNAME
          </label>
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors text-[20px]">
              person
            </span>
            <input
              id="reg-username"
              type="text"
              value={form.username}
              onChange={set("username")}
              required
              autoComplete="username"
              placeholder="yourname"
              className={fieldClass("username")}
            />
          </div>
          {errors.username && <p className="font-label-caps text-error text-[10px]">{errors.username}</p>}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label className="font-label-caps text-[11px] text-outline block" htmlFor="reg-email">
            EMAIL ADDRESS
          </label>
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors text-[20px]">
              mail
            </span>
            <input
              id="reg-email"
              type="email"
              value={form.email}
              onChange={set("email")}
              required
              autoComplete="email"
              placeholder="you@example.com"
              className={fieldClass("email")}
            />
          </div>
          {errors.email && <p className="font-label-caps text-error text-[10px]">{errors.email}</p>}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label className="font-label-caps text-[11px] text-outline block" htmlFor="reg-password">
            PASSWORD
          </label>
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors text-[20px]">
              lock
            </span>
            <input
              id="reg-password"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={set("password")}
              required
              autoComplete="new-password"
              placeholder="Min. 6 characters"
              className={`${fieldClass("password")} pr-12`}
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
          {errors.password && <p className="font-label-caps text-error text-[10px]">{errors.password}</p>}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <label className="font-label-caps text-[11px] text-outline block" htmlFor="reg-confirm">
            CONFIRM PASSWORD
          </label>
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors text-[20px]">
              lock_reset
            </span>
            <input
              id="reg-confirm"
              type={showConfirmPassword ? "text" : "password"}
              value={form.confirm}
              onChange={set("confirm")}
              required
              autoComplete="new-password"
              placeholder="Repeat password"
              className={`${fieldClass("confirm")} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              <span className="material-symbols-outlined text-[20px]">
                {showConfirmPassword ? "visibility_off" : "visibility"}
              </span>
            </button>
          </div>
          {errors.confirm && <p className="font-label-caps text-error text-[10px]">{errors.confirm}</p>}
        </div>

        {/* Password strength indicator */}
        {form.password && (
          <div className="space-y-1">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((n) => {
                const strength = Math.min(4, Math.floor(form.password.length / 3));
                return (
                  <div
                    key={n}
                    className={`flex-1 h-1 rounded-full transition-colors ${
                      n <= strength
                        ? strength <= 1 ? "bg-error" : strength <= 2 ? "bg-yellow-500" : strength <= 3 ? "bg-blue-400" : "bg-[#22c55e]"
                        : "bg-outline-variant"
                    }`}
                  />
                );
              })}
            </div>
            <p className="font-label-caps text-[10px] text-outline">
              {form.password.length < 6 ? "TOO SHORT" : form.password.length < 9 ? "WEAK" : form.password.length < 12 ? "GOOD" : "STRONG"}
            </p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary text-background font-label-caps py-3.5 rounded flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          {isLoading ? (
            <>
              <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
              CREATING ACCOUNT…
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              CREATE ACCOUNT
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

      {/* Login link */}
      <p className="text-center font-body-sm text-on-surface-variant">
        Already have an account?{" "}
        <Link to="/login" className="text-primary hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
