import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CallProvider } from "./context/CallContext";
import { isFirebaseConfigured } from "./firebase";
import ConfigModal from "./components/ConfigModal";
import ProtectedRoute from "./components/ProtectedRoute";
import IncomingCallModal from "./components/IncomingCallModal";
import ActiveCallScreen from "./components/ActiveCallScreen";
import Login from "./pages/Login";
import CompleteProfile from "./pages/CompleteProfile";
import StudentDashboard from "./pages/student/StudentDashboard";
import WardenDashboard from "./pages/warden/WardenDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";

function RootRedirect() {
  const { currentUser, userData } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (!userData) {
    // If auth state loaded but Firestore user doc isn't loaded yet
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-indigo-600"></div>
      </div>
    );
  }

  // Redirect to correct panel
  if (userData.role === "admin") return <Navigate to="/admin" replace />;
  if (userData.role === "warden") return <Navigate to="/warden" replace />;
  
  if (userData.role === "student") {
    if (!userData.profileComplete) {
      return <Navigate to="/complete-profile" replace />;
    }
    return <Navigate to="/student" replace />;
  }

  return <Navigate to="/login" replace />;
}

export default function App() {
  // If Firebase is not configured, show the Config Modal
  if (!isFirebaseConfigured) {
    return <ConfigModal />;
  }

  return (
    <AuthProvider>
      <CallProvider>
        <BrowserRouter>
          {/* Global call overlays — rendered above all routes */}
          <IncomingCallModal />
          <ActiveCallScreen />
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />

            {/* Protected Onboarding */}
            <Route
              path="/complete-profile"
              element={
                <ProtectedRoute allowedRoles={["student"]}>
                  <CompleteProfile />
                </ProtectedRoute>
              }
            />

            {/* Role-based Dashboards */}
            <Route
              path="/student"
              element={
                <ProtectedRoute allowedRoles={["student"]}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/warden"
              element={
                <ProtectedRoute allowedRoles={["warden"]}>
                  <WardenDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Fallback & Redirects */}
            <Route path="/" element={<RootRedirect />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </CallProvider>
    </AuthProvider>
  );
}
