import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { currentUser, userData, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-indigo-600"></div>
      </div>
    );
  }

  // If not logged in, redirect to login page
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If student profile is incomplete, force them to complete-profile
  if (
    userData?.role === "student" &&
    !userData?.profileComplete &&
    location.pathname !== "/complete-profile"
  ) {
    return <Navigate to="/complete-profile" replace />;
  }

  // If student profile is already complete, prevent them from going to complete-profile
  if (
    userData?.role === "student" &&
    userData?.profileComplete &&
    location.pathname === "/complete-profile"
  ) {
    return <Navigate to="/" replace />;
  }

  // Check if user has permission for this route
  if (allowedRoles && userData && !allowedRoles.includes(userData.role)) {
    // Redirect to their respective dashboards
    if (userData.role === "admin") return <Navigate to="/admin" replace />;
    if (userData.role === "warden") return <Navigate to="/warden" replace />;
    return <Navigate to="/student" replace />;
  }

  return children;
}
