import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import ResearchPage       from "./pages/ResearchPage";
import HistoryPage        from "./pages/HistoryPage";
import AnalysisPage       from "./pages/AnalysisPage";
import SynthesisPage      from "./pages/SynthesisPage";
import ArchivesPage       from "./pages/ArchivesPage";
import DraftsPage         from "./pages/DraftsPage";
import SettingsPage       from "./pages/SettingsPage";
import NotificationsPage  from "./pages/NotificationsPage";
import ProfilePage        from "./pages/ProfilePage";
import HelpPage           from "./pages/HelpPage";
import LogoutPage         from "./pages/LogoutPage";
import NotFoundPage       from "./pages/NotFoundPage";
import LoginPage          from "./pages/LoginPage";
import RegisterPage       from "./pages/RegisterPage";
import { useAuth }        from "./context/AuthContext";
import "./index.css";

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <span className="material-symbols-outlined text-primary text-[32px] animate-spin">refresh</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected Routes share the AppLayout shell (sidebar + header) */}
      <Route element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/research" replace />} />
        <Route path="/research"     element={<ResearchPage />} />
        <Route path="/research/:id" element={<ResearchPage />} />
        <Route path="/history"      element={<HistoryPage />} />
        <Route path="/analysis"     element={<AnalysisPage />} />
        <Route path="/synthesis"    element={<SynthesisPage />} />
        <Route path="/archives"     element={<ArchivesPage />} />
        <Route path="/drafts"       element={<DraftsPage />} />
        <Route path="/settings"     element={<SettingsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/profile"      element={<ProfilePage />} />
        <Route path="/help"         element={<HelpPage />} />
        <Route path="/logout"       element={<LogoutPage />} />
      </Route>

      {/* 404 — outside layout so it's full screen */}
      <Route path="*" element={
        <div className="flex h-screen overflow-hidden bg-background">
          <div className="flex-1 flex flex-col items-center justify-center">
            <NotFoundPage />
          </div>
        </div>
      } />
    </Routes>
  );
}