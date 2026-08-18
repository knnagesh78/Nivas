// ─── Incoming Call Modal ────────────────────────────────────────────────────
// Full-screen overlay shown when another student is calling.
// Features animated pulse rings, vibration-style effects, and accept/decline buttons.

import React, { useEffect, useRef } from "react";
import { Phone, PhoneOff, User } from "lucide-react";
import { useCall } from "../context/CallContext";

export default function IncomingCallModal() {
  const { callState, currentCallId, callerInfo, answerCall, declineCall } = useCall();
  const ringtoneRef = useRef(null);

  // Play a ringtone sound using Web Audio API
  useEffect(() => {
    if (callState !== "ringing") return;

    let audioCtx = null;
    let intervalId = null;

    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();

      const playRingTone = () => {
        // Create a pleasant two-tone ring
        const now = audioCtx.currentTime;
        
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc1.type = "sine";
        osc1.frequency.value = 440; // A4
        osc2.type = "sine";
        osc2.frequency.value = 523.25; // C5

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(audioCtx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.8);
        osc2.stop(now + 0.8);
      };

      playRingTone();
      intervalId = setInterval(playRingTone, 2000);

      // Vibrate if supported
      if ("vibrate" in navigator) {
        const vibratePattern = () => navigator.vibrate([300, 200, 300, 200, 300]);
        vibratePattern();
        const vibrateInterval = setInterval(vibratePattern, 2000);
        ringtoneRef.current = { intervalId, vibrateInterval, audioCtx };
      } else {
        ringtoneRef.current = { intervalId, audioCtx };
      }
    } catch (err) {
      console.warn("Could not play ringtone:", err);
    }

    return () => {
      if (ringtoneRef.current?.intervalId) clearInterval(ringtoneRef.current.intervalId);
      if (ringtoneRef.current?.vibrateInterval) clearInterval(ringtoneRef.current.vibrateInterval);
      if (ringtoneRef.current?.audioCtx) ringtoneRef.current.audioCtx.close().catch(() => {});
      if ("vibrate" in navigator) navigator.vibrate(0);
    };
  }, [callState]);

  if (callState !== "ringing") return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      {/* Animated background rings */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        <div className="absolute h-80 w-80 rounded-full border border-indigo-500/10 animate-ping" style={{ animationDuration: "3s" }} />
        <div className="absolute h-96 w-96 rounded-full border border-indigo-500/5 animate-ping" style={{ animationDuration: "4s", animationDelay: "0.5s" }} />
        <div className="absolute h-[500px] w-[500px] rounded-full border border-purple-500/5 animate-ping" style={{ animationDuration: "5s", animationDelay: "1s" }} />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6">
        {/* Caller avatar with pulse */}
        <div className="relative mb-8">
          <div className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping" style={{ animationDuration: "1.5s" }} />
          <div className="absolute -inset-3 rounded-full bg-indigo-500/10 animate-pulse" />
          <div className="relative h-28 w-28 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-indigo-500/30 ring-4 ring-indigo-400/20">
            <span className="text-4xl font-black text-white">
              {callerInfo?.name ? callerInfo.name[0].toUpperCase() : <User className="h-12 w-12" />}
            </span>
          </div>
        </div>

        {/* Caller info */}
        <div className="mb-2">
          <p className="text-indigo-300/80 text-xs font-bold uppercase tracking-[0.25em] mb-2">
            Incoming Call
          </p>
          <h2 className="text-3xl font-black text-white tracking-tight">
            {callerInfo?.name || "Unknown Caller"}
          </h2>
          <p className="text-sm text-slate-400 mt-2 flex items-center justify-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            <span>Roommate Voice Call</span>
          </p>
        </div>

        {/* Swipe hint text */}
        <p className="text-xs text-slate-500 mt-4 mb-12 animate-pulse">
          Tap to answer or decline
        </p>

        {/* Action Buttons */}
        <div className="flex items-center space-x-16">
          {/* Decline */}
          <button
            onClick={() => declineCall(currentCallId)}
            className="group flex flex-col items-center cursor-pointer"
          >
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-xl shadow-red-500/30 transition-all duration-200 hover:scale-110 active:scale-95 group-hover:shadow-2xl group-hover:shadow-red-500/40">
              <PhoneOff className="h-7 w-7 text-white" />
            </div>
            <span className="text-xs font-bold text-red-400 mt-3 tracking-wide">Decline</span>
          </button>

          {/* Accept */}
          <button
            onClick={() => answerCall(currentCallId)}
            className="group flex flex-col items-center cursor-pointer"
          >
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-green-400/30 animate-ping" style={{ animationDuration: "1.5s" }} />
              <div className="relative h-16 w-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-xl shadow-green-500/30 transition-all duration-200 hover:scale-110 active:scale-95 group-hover:shadow-2xl group-hover:shadow-green-500/40">
                <Phone className="h-7 w-7 text-white" />
              </div>
            </div>
            <span className="text-xs font-bold text-green-400 mt-3 tracking-wide">Accept</span>
          </button>
        </div>
      </div>

      {/* Subtle grid overlay */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)",
          backgroundSize: "32px 32px"
        }}
      />
    </div>
  );
}
