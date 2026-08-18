// ─── WebRTC Call Service ────────────────────────────────────────────────────
// Handles WebRTC peer connections and Firestore signaling for voice calls.

import { db } from "../firebase";
import {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  getDoc,
  collection,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";

// ── STUN/TURN Configuration ─────────────────────────────────────────────────
const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
  ],
  iceCandidatePoolSize: 10,
};

// ── Call Document Helpers ────────────────────────────────────────────────────

/**
 * Create a new call document in Firestore with an SDP offer
 */
export async function createCallOffer(callerUid, calleeUid, callerName, calleeName) {
  const pc = new RTCPeerConnection(ICE_SERVERS);

  // Get local audio stream
  const localStream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: false,
  });

  // Add local audio tracks to peer connection
  localStream.getTracks().forEach((track) => {
    pc.addTrack(track, localStream);
  });

  // Create remote stream placeholder
  const remoteStream = new MediaStream();
  pc.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track);
    });
  };

  // Create a unique call document
  const callDocRef = doc(collection(db, "calls"));
  const callId = callDocRef.id;
  const iceCandidatesRef = collection(db, "calls", callId, "iceCandidates");

  // Collect ICE candidates and write to Firestore
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      addDoc(iceCandidatesRef, {
        ...event.candidate.toJSON(),
        sender: "caller",
      });
    }
  };

  // Create SDP offer
  const offerDescription = await pc.createOffer();
  await pc.setLocalDescription(offerDescription);

  const callData = {
    callerUid,
    calleeUid,
    callerName: callerName || "Unknown",
    calleeName: calleeName || "Unknown",
    offer: {
      type: offerDescription.type,
      sdp: offerDescription.sdp,
    },
    answer: null,
    status: "ringing",
    createdAt: serverTimestamp(),
    endedAt: null,
  };

  await setDoc(callDocRef, callData);

  return {
    callId,
    pc,
    localStream,
    remoteStream,
    callDocRef,
  };
}

/**
 * Listen for the answer from callee and complete the WebRTC handshake
 */
export function listenForAnswer(callId, pc, onAnswered, onEnded) {
  const callDocRef = doc(db, "calls", callId);

  const unsubCall = onSnapshot(callDocRef, (snapshot) => {
    const data = snapshot.data();
    if (!data) return;

    // If answer is received and we haven't set remote description yet
    if (data.answer && !pc.currentRemoteDescription) {
      const answerDescription = new RTCSessionDescription(data.answer);
      pc.setRemoteDescription(answerDescription).then(() => {
        if (onAnswered) onAnswered(data);
      });
    }

    // If call was ended or declined by the other side
    if (data.status === "ended" || data.status === "declined" || data.status === "missed") {
      if (onEnded) onEnded(data.status);
    }
  });

  // Listen for callee's ICE candidates
  const iceCandidatesRef = collection(db, "calls", callId, "iceCandidates");
  const calleeCandidatesQuery = query(iceCandidatesRef, where("sender", "==", "callee"));

  const unsubCandidates = onSnapshot(calleeCandidatesQuery, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        const candidateData = change.doc.data();
        const candidate = new RTCIceCandidate(candidateData);
        pc.addIceCandidate(candidate).catch(console.error);
      }
    });
  });

  return () => {
    unsubCall();
    unsubCandidates();
  };
}

/**
 * Answer an incoming call — create SDP answer and exchange ICE candidates
 */
export async function answerCall(callId) {
  const callDocRef = doc(db, "calls", callId);
  const callSnap = await getDoc(callDocRef);
  if (!callSnap.exists()) throw new Error("Call not found");

  const callData = callSnap.data();
  const pc = new RTCPeerConnection(ICE_SERVERS);

  // Get local audio stream
  const localStream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: false,
  });

  // Add local audio tracks
  localStream.getTracks().forEach((track) => {
    pc.addTrack(track, localStream);
  });

  // Create remote stream
  const remoteStream = new MediaStream();
  pc.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track);
    });
  };

  // Collect ICE candidates
  const iceCandidatesRef = collection(db, "calls", callId, "iceCandidates");
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      addDoc(iceCandidatesRef, {
        ...event.candidate.toJSON(),
        sender: "callee",
      });
    }
  };

  // Set remote description from caller's offer
  const offerDescription = new RTCSessionDescription(callData.offer);
  await pc.setRemoteDescription(offerDescription);

  // Create answer
  const answerDescription = await pc.createAnswer();
  await pc.setLocalDescription(answerDescription);

  // Write answer to Firestore
  await updateDoc(callDocRef, {
    answer: {
      type: answerDescription.type,
      sdp: answerDescription.sdp,
    },
    status: "answered",
  });

  // Listen for caller's ICE candidates
  const callerCandidatesQuery = query(iceCandidatesRef, where("sender", "==", "caller"));
  const unsubCandidates = onSnapshot(callerCandidatesQuery, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        const candidateData = change.doc.data();
        const candidate = new RTCIceCandidate(candidateData);
        pc.addIceCandidate(candidate).catch(console.error);
      }
    });
  });

  return {
    pc,
    localStream,
    remoteStream,
    unsubCandidates,
  };
}

/**
 * Listen for call status changes (for callee side — detect ended)
 */
export function listenForCallStatus(callId, onStatusChange) {
  const callDocRef = doc(db, "calls", callId);
  return onSnapshot(callDocRef, (snapshot) => {
    const data = snapshot.data();
    if (data && onStatusChange) {
      onStatusChange(data.status, data);
    }
  });
}

/**
 * End an active call
 */
export async function endCall(callId) {
  try {
    const callDocRef = doc(db, "calls", callId);
    await updateDoc(callDocRef, {
      status: "ended",
      endedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("Error ending call:", err);
  }
}

/**
 * Decline an incoming call
 */
export async function declineCall(callId) {
  try {
    const callDocRef = doc(db, "calls", callId);
    await updateDoc(callDocRef, {
      status: "declined",
      endedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("Error declining call:", err);
  }
}

/**
 * Mark call as missed (timed out)
 */
export async function missCall(callId) {
  try {
    const callDocRef = doc(db, "calls", callId);
    await updateDoc(callDocRef, {
      status: "missed",
      endedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("Error marking call as missed:", err);
  }
}

/**
 * Listen for incoming calls targeted at a specific user
 */
export function listenForIncomingCalls(uid, callback) {
  const callsRef = collection(db, "calls");
  const incomingQuery = query(
    callsRef,
    where("calleeUid", "==", uid),
    where("status", "==", "ringing")
  );

  return onSnapshot(incomingQuery, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        const callData = { id: change.doc.id, ...change.doc.data() };
        callback(callData);
      }
    });
  });
}

/**
 * Clean up WebRTC resources
 */
export function cleanupCall(pc, localStream) {
  if (localStream) {
    localStream.getTracks().forEach((track) => track.stop());
  }
  if (pc) {
    pc.close();
  }
}

/**
 * Clean up old call documents from Firestore (delete ICE candidates + call doc)
 */
export async function cleanupCallDoc(callId) {
  try {
    // Delete all ICE candidates
    const iceCandidatesRef = collection(db, "calls", callId, "iceCandidates");
    const candidateSnaps = await getDocs(iceCandidatesRef);
    const deletePromises = candidateSnaps.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(deletePromises);

    // Delete call document
    await deleteDoc(doc(db, "calls", callId));
  } catch (err) {
    console.error("Error cleaning up call doc:", err);
  }
}
