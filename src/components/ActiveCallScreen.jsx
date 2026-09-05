// ─── Active Call Screen ─────────────────────────────────────────────────────
// Full-screen overlay during an active WebRTC voice call.
// Shows call duration, mute/speaker/end controls, and connection quality.

import React, { useState, useMemo } from "react";
import { Phone, PhoneOff, Mic, MicOff, Volume2, Volume1, Wifi, Minimize2, Maximize2 } from "lucide-react";
import { useCall } from "../context/CallContext";

function formatDuration(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default function ActiveCallScreen() {
  const {
    callState,
    calleeInfo,
    callerInfo,
    isMuted,
    isSpeaker,
    callDuration,
    endReason,
    endCall,
    toggleMute,
    toggleSpeaker,
  } = useCall();

  const [isMinimized, setIsMinimized] = useState(false);

  // Automatically minimize when the call connects so they can see the home page
  React.useEffect(() => {
    if (callState === "active") {
      setIsMinimized(true);
    }
  }, [callState]);

  // The person we are talking to
  const peerName = useMemo(() => {
    // If we initiated, the peer is calleeInfo; if we received, the peer is callerInfo
    if (callState === "active" || callState === "outgoing" || callState === "ended") {
      // Determine based on available info
      return calleeInfo?.name || callerInfo?.name || "Roommate";
    }
    return "Roommate";
  }, [callState, calleeInfo, callerInfo]);

  const peerInitial = peerName[0]?.toUpperCase() || "R";

  if (callState !== "active" && callState !== "outgoing" && callState !== "ended") {
    return null;
  }

  // End screen
  if (callState === "ended") {
    return (
      <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center animate-fadeIn">
          <div className="h-20 w-20 mx-auto rounded-full bg-slate-800 flex items-center justify-center mb-4 ring-4 ring-slate-700/50">
            <PhoneOff className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-1">Call Ended</h3>
          <p className="text-sm text-slate-400 capitalize">
            {endReason === "declined" && "Call was declined"}
            {endReason === "missed" && "No answer"}
            {endReason === "ended" && `Duration: ${formatDuration(callDuration)}`}
            {endReason === "disconnected" && "Connection lost"}
            {endReason === "error" && "Call failed"}
            {!endReason && "Call ended"}
          </p>
        </div>
      </div>
    );
  }

  // Minimized floating widget
  if (isMinimized) {
    return (
      <div className="fixed bottom-20 right-6 z-[9998] animate-fadeIn">
        <div className="flex items-center space-x-3 p-3 rounded-full bg-slate-900 border border-slate-700 shadow-2xl">
          {/* Avatar / Status Indicator */}
          <div className="relative shrink-0">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
              <span className="text-lg font-black text-white">{peerInitial}</span>
            </div>
            <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-green-400 ring-2 ring-slate-900 animate-pulse" />
          </div>
          
          {/* Info & Duration */}
          <div className="flex-1 min-w-0 pr-2 cursor-pointer" onClick={() => setIsMinimized(false)}>
            <p className="text-xs font-bold text-white truncate w-24">{peerName}</p>
            <p className="text-[10px] text-green-400 font-mono mt-0.5">
              {callState === "outgoing" ? "Calling..." : formatDuration(callDuration)}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-1 shrink-0 border-l border-slate-700 pl-2">
            <button
              onClick={toggleMute}
              className={`p-2 rounded-full transition-all ${isMuted ? "bg-white text-slate-900" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
            >
              {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
            <button
              onClick={endCall}
              className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-all shadow-md shadow-red-500/20"
            >
              <PhoneOff className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsMinimized(false)}
              className="p-2 rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all ml-1"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9998] flex flex-col bg-gradient-to-br from-slate-950 via-indigo-950/80 to-slate-950">
      {/* Ambient background glow */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full bg-indigo-600/10 blur-3xl" />
        <div className="absolute bottom-1/3 left-1/3 h-48 w-48 rounded-full bg-purple-600/10 blur-3xl" />
      </div>

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 pt-12">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setIsMinimized(true)}
            className="p-2 -ml-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all backdrop-blur-sm cursor-pointer"
          >
            <Minimize2 className="h-5 w-5" />
          </button>
          <div className="flex items-center space-x-2 bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm">
            <Wifi className="h-4 w-4 text-green-400" />
            <span className="text-xs font-bold text-green-400">
              {callState === "outgoing" ? "Connecting..." : "Connected"}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-2 bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm">
          <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-slate-400 font-mono">
            {callState === "outgoing" ? "Ringing..." : "Voice Call"}
          </span>
        </div>
      </div>

      {/* Main content — centered */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
        {/* Avatar */}
        <div className="relative mb-6">
          {callState === "outgoing" && (
            <div className="absolute -inset-4 rounded-full border-2 border-indigo-400/20 animate-ping" style={{ animationDuration: "2s" }} />
          )}
          {callState === "active" && (
            <div className="absolute -inset-4 rounded-full border-2 border-green-400/10 animate-pulse" style={{ animationDuration: "3s" }} />
          )}
          <div className="h-32 w-32 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-indigo-500/20 ring-4 ring-white/10">
            <span className="text-5xl font-black text-white">{peerInitial}</span>
          </div>
        </div>

        {/* Name */}
        <h2 className="text-2xl font-black text-white tracking-tight mb-1">{peerName}</h2>
        <p className="text-sm text-slate-400 mb-2">Hostel Roommate</p>

        {/* Duration / Status */}
        <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
          {callState === "outgoing" ? (
            <p className="text-sm font-bold text-indigo-300 animate-pulse flex items-center space-x-2">
              <Phone className="h-4 w-4 animate-bounce" />
              <span>Calling...</span>
            </p>
          ) : (
            <p className="text-lg font-mono font-bold text-white tracking-wider">
              {formatDuration(callDuration)}
            </p>
          )}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="relative z-10 pb-16 px-6">
        {/* Control buttons */}
        <div className="flex items-center justify-center space-x-8 mb-8">
          {/* Mute */}
          <button
            onClick={toggleMute}
            className={`flex flex-col items-center space-y-2 cursor-pointer group transition-all`}
          >
            <div className={`h-14 w-14 rounded-full flex items-center justify-center transition-all duration-200 ${
              isMuted
                ? "bg-white text-slate-900 shadow-lg shadow-white/20"
                : "bg-white/10 text-white hover:bg-white/20 border border-white/10"
            }`}>
              {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </div>
            <span className={`text-[10px] font-bold tracking-wide ${isMuted ? "text-white" : "text-slate-400"}`}>
              {isMuted ? "Unmute" : "Mute"}
            </span>
          </button>

          {/* Speaker */}
          <button
            onClick={toggleSpeaker}
            className="flex flex-col items-center space-y-2 cursor-pointer group transition-all"
          >
            <div className={`h-14 w-14 rounded-full flex items-center justify-center transition-all duration-200 ${
              isSpeaker
                ? "bg-white text-slate-900 shadow-lg shadow-white/20"
                : "bg-white/10 text-white hover:bg-white/20 border border-white/10"
            }`}>
              {isSpeaker ? <Volume2 className="h-6 w-6" /> : <Volume1 className="h-6 w-6" />}
            </div>
            <span className={`text-[10px] font-bold tracking-wide ${isSpeaker ? "text-white" : "text-slate-400"}`}>
              Speaker
            </span>
          </button>
        </div>

        {/* End Call button */}
        <div className="flex justify-center">
          <button
            onClick={endCall}
            className="group h-16 w-16 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-2xl shadow-red-500/30 transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer hover:shadow-red-500/50"
          >
            <PhoneOff className="h-7 w-7 text-white transition-transform group-hover:rotate-[135deg]" />
          </button>
        </div>
      </div>

      {/* Subtle grid overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)",
          backgroundSize: "24px 24px"
        }}
      />
    </div>
  );
}
