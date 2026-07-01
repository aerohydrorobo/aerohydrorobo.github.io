import { useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/AuthContext";
import { RequireAuth, RequireAdmin, PageSpinner } from "./components/RouteGuards";
import Navbar from "./components/Navbar";

import HomePage from "./pages/HomePage";
import FeedPage from "./pages/FeedPage";
import AuthPage from "./pages/AuthPage";
import VerifyPage from "./pages/VerifyPage";
import DashboardPage from "./pages/DashboardPage";
import EngineersPage from "./pages/EngineersPage";
import GigsPage from "./pages/GigsPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import MessagesPage from "./pages/MessagesPage";
import AdminPage from "./pages/AdminPage";

/**
 * ---------------------------------------------------------------
 * HOW TO ADD A NEW PAGE / FEATURE:
 * 1. Create the component in src/pages/YourPage.jsx
 * 2. Import it above
 * 3. Add ONE <Route> line in <AppRoutes> below
 * 4. (Optional) Add a nav link in src/components/Navbar.jsx
 * That's it — no other file needs to change.
 * ---------------------------------------------------------------
 */

// Pages still receive a `navigate(key)` prop for backward compatibility
// with existing page code (which calls navigate("dashboard") etc.).
// New pages are free to use react-router's useNavigate()/<Link> directly instead.
function useLegacyNavigate() {
  const navigate = useNavigate();
  return (key) => {
    if (key.startsWith("profile-")) {
      navigate(`/engineers/${key.replace("profile-", "")}`);
      return;
    }
    const map = {
      home: "/",
      register: "/register",
      verify: "/verify",
      dashboard: "/dashboard",
      engineers: "/engineers",
      gigs: "/gigs",
      leaderboard: "/leaderboard",
      messages: "/messages",
      admin: "/admin",
    };
    navigate(map[key] || `/${key}`);
  };
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function AppRoutes() {
  const { user, profile, setUser } = useAuth();
  const navigate = useLegacyNavigate();

  return (
    <Routes>
      <Route path="/" element={<HomePage navigate={navigate} user={user} />} />
      <Route path="/feed" element={<FeedPage user={user} profile={profile} />} />
      <Route path="/register" element={<AuthPage navigate={navigate} setUser={setUser} />} />
      <Route path="/verify" element={<VerifyPage navigate={navigate} user={user} />} />
      <Route path="/engineers" element={<EngineersPage navigate={navigate} user={user} />} />
      <Route path="/engineers/:id" element={<EngineersPage navigate={navigate} user={user} />} />
      <Route path="/gigs" element={<GigsPage navigate={navigate} user={user} />} />
      <Route path="/leaderboard" element={<LeaderboardPage />} />

      <Route path="/dashboard" element={
        <RequireAuth><DashboardPage navigate={navigate} user={user} /></RequireAuth>
      } />
      <Route path="/messages" element={
        <RequireAuth><MessagesPage user={user} profile={profile} /></RequireAuth>
      } />
      <Route path="/admin" element={
        <RequireAdmin><AdminPage /></RequireAdmin>
      } />

      {/* Unknown URL -> send home instead of a blank page */}
      <Route path="*" element={<HomePage navigate={navigate} user={user} />} />
    </Routes>
  );
}

function AppShell() {
  const { user, profile, authLoading } = useAuth();

  if (authLoading) return <PageSpinner />;

  return (
    <>
      <ScrollToTop />
      <Navbar user={user} profile={profile} />
      <AppRoutes />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
