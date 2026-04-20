import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// ProtectedRoute – wraps pages that require authentication
// Optionally restricts access to specific roles (e.g. ["admin", "teacher"])
// Redirects unauthenticated users to the landing page
export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, role } = useAuth();

  // Not logged in → go to landing page
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Logged in but wrong role → go to dashboard (graceful fallback)
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
