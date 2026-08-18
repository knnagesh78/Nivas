// ─── Call Context ─────────────────────────────────────────────────────────────
// Global state manager for WebRTC voice calls.
// Wraps the entire app so calls can be received from any screen.

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "./AuthContext";
import {
  createCallOffer,
  listenForAnswer,
  answerCall as answerCallService,
  listenForCallStatus,
  endCall as endCallService,
  declineCall as declineCallService,
  missCall as missCallService,
  listenForIncomingCalls,
  cleanupCall,
  cleanupCallDoc,
} from "../services/callService";

const CallContext = createContext();

export function useCall() {
  return useContext(CallContext);
}

export function CallProvider({ children }) {
  const { currentUser } = useAuth();

  // ── Call State ──────────────────────────────────────────────────────────────
  const [callState, setCallState] = useState("idle"); // idle | outgoing | ringing | active | ended
  const [currentCallId, setCurrentCallId] = useState(null);
  const [callerInfo, setCallerInfo] = useState(null);   // { uid, name }
  const [calleeInfo, setCalleeInfo] = useState(null);   // { uid, name }
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [endReason, setEndReason] = useState(null);

  // ── Refs ────────────────────────────────────────────────────────────────────
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const unsubCallRef = useRef(null);
  const unsubCandidatesRef = useRef(null);
  const unsubIncomingRef = useRef(null);
  const callTimerRef = useRef(null);
  const missedTimerRef = useRef(null);

  // ── Cleanup Helper ─────────────────────────────────────────────────────────
  const resetCallState = useCallback((reason = null) => {
    // Stop call timer
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    // Stop missed timer
    if (missedTimerRef.current) {
      clearTimeout(missedTimerRef.current);
      missedTimerRef.current = null;
    }
    // Unsubscribe listeners
    if (unsubCallRef.current) {
      unsubCallRef.current();
      unsubCallRef.current = null;
    }
    if (unsubCandidatesRef.current) {
      unsubCandidatesRef.current();
      unsubCandidatesRef.current = null;
    }
    // Cleanup WebRTC
    cleanupCall(pcRef.current, localStreamRef.current);
    pcRef.current = null;
    localStreamRef.current = null;
    remoteStreamRef.current = null;

    // Reset state
    setEndReason(reason);
    setCallState(reason ? "ended" : "idle");
    setIsMuted(false);
    setIsSpeaker(false);
    setCallDuration(0);

    // Auto-reset to idle after showing end reason
    if (reason) {
      setTimeout(() => {
        setCallState("idle");
        setCurrentCallId(null);
        setCallerInfo(null);
        setCalleeInfo(null);
        setEndReason(null);
      }, 2000);
    } else {
      setCurrentCallId(null);
      setCallerInfo(null);
      setCalleeInfo(null);
    }
  }, []);

  // ── Start Call Timer ───────────────────────────────────────────────────────
  const startCallTimer = useCallback(() => {
    setCallDuration(0);
    callTimerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  }, []);

  // ── Initiate a Call (Caller Side) ──────────────────────────────────────────
  const initiateCall = useCallback(async (calleeUid, calleeName, callerName) => {
    if (callState !== "idle" || !currentUser) return;

    try {
      setCallState("outgoing");
      setCalleeInfo({ uid: calleeUid, name: calleeName });
      setCallerInfo({ uid: currentUser.uid, name: callerName });

      const { callId, pc, localStream, remoteStream } = await createCallOffer(
        currentUser.uid,
        calleeUid,
        callerName,
        calleeName
      );

      pcRef.current = pc;
      localStreamRef.current = localStream;
      remoteStreamRef.current = remoteStream;
      setCurrentCallId(callId);

      // Play remote audio
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
      }

      // Monitor connection state
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
          endCallService(callId);
          resetCallState("disconnected");
        }
      };

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === "disconnected" || pc.iceConnectionState === "failed") {
          endCallService(callId);
          resetCallState("disconnected");
        }
      };

      // Listen for answer
      const unsub = listenForAnswer(
        callId,
        pc,
        () => {
          // Call answered!
          if (missedTimerRef.current) {
            clearTimeout(missedTimerRef.current);
            missedTimerRef.current = null;
          }
          setCallState("active");
          startCallTimer();
        },
        (reason) => {
          // Call ended/declined/missed
          resetCallState(reason);
        }
      );
      unsubCallRef.current = unsub;

      // Auto-end if no answer in 45 seconds
      missedTimerRef.current = setTimeout(() => {
        if (callState === "outgoing") {
          missCallService(callId);
          resetCallState("missed");
        }
      }, 45000);

    } catch (err) {
      console.error("Error initiating call:", err);
      resetCallState("error");
    }
  }, [callState, currentUser, resetCallState, startCallTimer]);

  // ── Answer Incoming Call (Callee Side) ─────────────────────────────────────
  const handleAnswerCall = useCallback(async (callId) => {
    try {
      if (missedTimerRef.current) {
        clearTimeout(missedTimerRef.current);
        missedTimerRef.current = null;
      }
      setCallState("active");

      const { pc, localStream, remoteStream, unsubCandidates } = await answerCallService(callId);

      pcRef.current = pc;
      localStreamRef.current = localStream;
      remoteStreamRef.current = remoteStream;
      unsubCandidatesRef.current = unsubCandidates;

      // Play remote audio
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
      }

      // Start call timer
      startCallTimer();

      // Listen for call status changes (e.g. caller ends the call)
      const unsubStatus = listenForCallStatus(callId, (status) => {
        if (status === "ended") {
          resetCallState("ended");
        }
      });
      unsubCallRef.current = unsubStatus;

      // Monitor connection state
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
          endCallService(callId);
          resetCallState("disconnected");
        }
      };

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === "disconnected" || pc.iceConnectionState === "failed") {
          endCallService(callId);
          resetCallState("disconnected");
        }
      };

    } catch (err) {
      console.error("Error answering call:", err);
      resetCallState("error");
    }
  }, [resetCallState, startCallTimer]);

  // ── Decline Incoming Call ──────────────────────────────────────────────────
  const handleDeclineCall = useCallback(async (callId) => {
    await declineCallService(callId);
    resetCallState(null);
  }, [resetCallState]);

  // ── End Active Call ────────────────────────────────────────────────────────
  const handleEndCall = useCallback(async () => {
    if (currentCallId) {
      await endCallService(currentCallId);
      // Cleanup call doc after a short delay
      setTimeout(() => cleanupCallDoc(currentCallId), 5000);
    }
    resetCallState("ended");
  }, [currentCallId, resetCallState]);

  // ── Toggle Mute ────────────────────────────────────────────────────────────
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, []);

  // ── Toggle Speaker ─────────────────────────────────────────────────────────
  const toggleSpeaker = useCallback(() => {
    setIsSpeaker((prev) => !prev);
    // Note: Speaker routing is handled by the browser/OS on mobile
    // On desktop, we can adjust audio output if available
    if (remoteAudioRef.current && remoteAudioRef.current.setSinkId) {
      // The actual speaker routing depends on available audio devices
      // This is a simplified version
      setIsSpeaker((prev) => !prev);
    }
  }, []);

  // ── Listen for Incoming Calls ──────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;

    const unsub = listenForIncomingCalls(currentUser.uid, (incomingCall) => {
      // Only show if we're not already in a call
      if (callState === "idle") {
        setCurrentCallId(incomingCall.id);
        setCallerInfo({
          uid: incomingCall.callerUid,
          name: incomingCall.callerName,
        });
        setCalleeInfo({
          uid: incomingCall.calleeUid,
          name: incomingCall.calleeName,
        });
        setCallState("ringing");

        // Auto-miss after 30 seconds if not answered
        missedTimerRef.current = setTimeout(() => {
          missCallService(incomingCall.id);
          resetCallState(null);
        }, 30000);
      }
    });

    unsubIncomingRef.current = unsub;

    return () => {
      if (unsubIncomingRef.current) {
        unsubIncomingRef.current();
      }
    };
  }, [currentUser, callState, resetCallState]);

  // ── Context Value ──────────────────────────────────────────────────────────
  const value = {
    callState,
    currentCallId,
    callerInfo,
    calleeInfo,
    isMuted,
    isSpeaker,
    callDuration,
    endReason,
    initiateCall,
    answerCall: handleAnswerCall,
    declineCall: handleDeclineCall,
    endCall: handleEndCall,
    toggleMute,
    toggleSpeaker,
  };

  return (
    <CallContext.Provider value={value}>
      {children}
      {/* Hidden audio element for playing remote audio */}
      <audio
        ref={remoteAudioRef}
        autoPlay
        playsInline
        style={{ display: "none" }}
      />
    </CallContext.Provider>
  );
}
