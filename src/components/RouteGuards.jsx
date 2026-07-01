import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { CONFIG } from "../config";

/** Use to wrap any route that requires the user to be logged in. */
export function RequireAuth({ children, redirectTo = "/register" }) {
  const { user, authLoading } = useAuth();
  if (authLoading) return <PageSpinner />;
  if (!user) return <Navigate to={redirectTo} replace />;
  return children;
}

/**
 * Use to wrap the /admin route. Access is based on CONFIG.adminEmails
 * (hardcoded in src/config/index.js), NOT a database role — so nobody
 * can self-promote to admin by editing a row in Supabase.
 */
export function RequireAdmin({ children }) {
  const { user, authLoading } = useAuth();
  if (authLoading) return <PageSpinner />;
  const isAdmin = !!user && CONFIG.adminEmails.includes(user.email);
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}

export function isAdminUser(user) {
  return !!user && CONFIG.adminEmails.includes(user.email);
}

export function PageSpinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "calc(100vh - 56px)" }}>
      <div className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  );
}
