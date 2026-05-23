import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authMe } from "../api/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // verifying token on first mount

  // On app load: validate the stored token with /api/auth/me
  useEffect(() => {
    const token = localStorage.getItem("archon_token");
    if (!token) {
      setIsLoading(false);
      return;
    }
    authMe()
      .then((res) => setUser(res.data))
      .catch(() => {
        // Token expired or invalid — clear it
        localStorage.removeItem("archon_token");
      })
      .finally(() => setIsLoading(false));
  }, []);

  /** Call after successful login or register — stores token and sets user. */
  const login = useCallback((token, userData) => {
    localStorage.setItem("archon_token", token);
    setUser(userData);
  }, []);

  /** Clear token and user state. */
  const logout = useCallback(() => {
    localStorage.removeItem("archon_token");
    setUser(null);
  }, []);

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
