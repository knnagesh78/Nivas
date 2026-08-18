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
        onClick={handleCall}
        disabled={isDisabled}
        className={`group relative inline-flex items-center justify-center px-5 py-3 rounded-2xl font-bold text-sm transition-all duration-300 cursor-pointer overflow-hidden ${
          isDisabled
            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
            : "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/30 hover:scale-[1.02] active:scale-[0.98]"
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
      onClick={handleCall}
      disabled={isDisabled}
      className={`group relative p-2 rounded-xl transition-all duration-200 cursor-pointer ${
        isDisabled
          ? "bg-slate-100 text-slate-300 cursor-not-allowed"
          : "bg-green-50 dark:bg-green-950/60 text-green-600 dark:text-green-400 hover:bg-green-500 hover:text-white border border-green-200 dark:border-green-800/50 hover:border-green-500 hover:shadow-md hover:shadow-green-500/20 active:scale-90"
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
        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-400 animate-pulse ring-2 ring-white dark:ring-slate-900" />
      )}
    </button>
  );
}
