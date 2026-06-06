import { Navigate, Outlet } from "react-router-dom";
import './pathscribe.css';
import { useEffect } from "react";
import { useAuth } from "@contexts/AuthContext";

const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  // Force a re-check of auth state on mount.
  // This ensures Back/Forward cannot resurrect stale UI state.
  useEffect(() => {
    // Triggering a re-render is enough because isAuthenticated
    // is derived from localStorage in the updated AuthContext.
  }, []);

  if (loading) {
    return <div style={{ background: "#0f172a", height: "100vh" }} />;
  }

  if (!isAuthenticated) {
   return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
