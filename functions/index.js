// ─── Firebase Cloud Functions: Call Push Notifications ──────────────────────
// Triggers when a new call document is created in Firestore.
// Sends a high-priority FCM push notification to the callee's device so their
// phone rings even when the app is closed.

const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

// Initialize Firebase Admin SDK
initializeApp();

const db = getFirestore();
const messaging = getMessaging();

/**
 * Firestore trigger: fires when a new document is created in `calls/{callId}`
 *
 * When a student initiates a call (status: "ringing"), this function:
 * 1. Looks up the callee's FCM token from their student document
 * 2. Sends a high-priority data message to ring their device
 */
exports.onCallCreated = onDocumentCreated("calls/{callId}", async (event) => {
  const callData = event.data?.data();
  if (!callData) return;

  // Only send notification for new ringing calls
  if (callData.status !== "ringing") return;

  const { calleeUid, callerName, calleeName } = callData;
  const callId = event.params.callId;

  try {
    // Look up callee's FCM token from their student document
    const studentDoc = await db.collection("students").doc(calleeUid).get();
    if (!studentDoc.exists) {
      console.log(`No student document found for callee ${calleeUid}`);
      return;
    }

    const fcmToken = studentDoc.data().fcmToken;
    if (!fcmToken) {
      console.log(`No FCM token found for callee ${calleeUid}`);
      return;
    }

    // Send high-priority data message (not notification — so we control display)
    const message = {
      token: fcmToken,
      data: {
        type: "incoming_call",
        callId: callId,
        callerName: callerName || "Unknown",
        calleeName: calleeName || "Unknown",
        title: "📞 Incoming Call",
        body: `${callerName || "A roommate"} is calling you...`,
      },
      android: {
        priority: "high",
        ttl: 45000, // 45 seconds — match the call timeout
      },
      webpush: {
        headers: {
          Urgency: "high",
          TTL: "45",
        },
        fcmOptions: {
          link: "/",
        },
      },
    };

    const response = await messaging.send(message);
    console.log(`[Call ${callId}] Push notification sent to ${calleeUid}:`, response);
  } catch (error) {
    console.error(`[Call ${callId}] Error sending push notification:`, error);

    // If token is invalid, remove it from the student document
    if (
      error.code === "messaging/invalid-registration-token" ||
      error.code === "messaging/registration-token-not-registered"
    ) {
      try {
        await db.collection("students").doc(calleeUid).update({
          fcmToken: null,
        });
        console.log(`Removed invalid FCM token for ${calleeUid}`);
      } catch (cleanupError) {
        console.error("Error removing invalid token:", cleanupError);
      }
    }
  }
});
