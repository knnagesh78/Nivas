// ─── Call Button ────────────────────────────────────────────────────────────
// Reusable button for initiating a WebRTC voice call to a roommate.
// Shows animated phone icon with ripple effect and calling state.

import React, { useState } from "react";
import { Phone, PhoneCall, Loader2 } from "lucide-react";
import { useCall } from "../context/CallContext";
import { useAuth } from "../context/AuthContext";

export default function CallButton({ calleeUid, calleeName, size = "sm", className = "" }) {
  const { initiateCall, callState } = useCall();
  const { currentUser } = useAuth();
  const [isInitiating, setIsInitiating] = useState(false);

  // Look up caller name from localStorage or use email prefix
  const getCallerName = () => {
    try {
      // Try to get from student details if cached
      const stored = localStorage.getItem("student_name");
      if (stored) return stored;
    } catch {}
    return currentUser?.email?.split("@")[0] || "Student";
  };

  const handleCall = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (callState !== "idle" || isInitiating) return;

    setIsInitiating(true);
    try {
      await initiateCall(calleeUid, calleeName, getCallerName());
    } catch (err) {
      console.error("Failed to initiate call:", err);
    } finally {
      setIsInitiating(false);
    }
  };

  const isDisabled = callState !== "idle" || isInitiating;

  if (size === "lg") {
    return (
      <button
        data-plain="true"
        onClick={handleCall}
        disabled={isDisabled}
        className={`group relative inline-flex items-center justify-center px-5 py-3 rounded-2xl font-bold text-sm transition-all duration-300 cursor-pointer overflow-hidden ${
          isDisabled
            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
            : "bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/35 hover:scale-[1.02] active:scale-[0.98]"
        } ${className}`}
        title={`Call ${calleeName}`}
      >
        {/* Ripple effect */}
        {!isDisabled && (
          <div className="absolute inset-0 rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        )}
        <div className="relative flex items-center space-x-2">
          {isInitiating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Phone className="h-4 w-4 transition-transform group-hover:rotate-12 group-hover:scale-110" />
          )}
          <span>{isInitiating ? "Connecting..." : `Call ${calleeName?.split(" ")[0] || "Roommate"}`}</span>
        </div>
      </button>
    );
  }

  // Small (icon-only) variant — used in roommate cards
  return (
    <button
      data-plain="true"
      onClick={handleCall}
      disabled={isDisabled}
      className={`group relative p-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
        isDisabled
          ? "bg-slate-100 text-slate-300 cursor-not-allowed"
          : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 hover:bg-gradient-to-tr hover:from-emerald-500 hover:to-teal-500 hover:text-white border border-emerald-200 dark:border-emerald-800/50 hover:border-emerald-400 shadow-xs hover:shadow-md hover:shadow-emerald-500/25 active:scale-95"
      } ${className}`}
      title={`Voice call ${calleeName}`}
    >
      {isInitiating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <PhoneCall className="h-4 w-4 transition-transform group-hover:scale-110 group-hover:rotate-12" />
      )}
      {/* Pulse indicator when idle */}
      {!isDisabled && !isInitiating && (
        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 animate-pulse ring-2 ring-white dark:ring-slate-900" />
      )}
    </button>
  );
}
