// ─── Firebase Cloud Functions: Call Push Notifications ──────────────────────
// Triggers when a new call document is created in Firestore.
// Sends a high-priority FCM push notification to the callee's device so their
// phone rings even when the app is closed.

const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");
const { getAuth } = require("firebase-admin/auth");

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
});

// ─── Firebase Cloud Functions: Parent PIN Verification ────────────────────────
/**
 * Callable function: verifyParentPin
 * 
 * Verifies the provided student email and PIN. If correct, assigns a custom 
 * claim to the caller's Firebase Auth token granting 'parent' access.
 */
exports.verifyParentPin = onCall(async (request) => {
  const { idNumber } = request.data;

  if (!idNumber) {
    throw new HttpsError("invalid-argument", "Student Identification Number is required.");
  }

  try {
    // 1. Query the students collection directly by idNumber
    const studentsQuery = await db.collection("students").where("idNumber", "==", idNumber).limit(1).get();
    
    if (studentsQuery.empty) {
      throw new HttpsError("not-found", "No student found with this Identification Number.");
    }
    
    const studentDoc = studentsQuery.docs[0];
    const studentUid = studentDoc.id;
    const studentData = studentDoc.data();

    // 2. Generate stable credentials for the parent
    const parentUid = `parent_${studentUid}`;
    const parentEmail = `parent_${studentUid}@nivas.local`;
    const parentPassword = `Pass_${idNumber}`;

    // 3. Ensure the parent Auth user exists
    try {
      await getAuth().getUser(parentUid);
      // If it exists, update the password just in case the student changed their ID
      await getAuth().updateUser(parentUid, { password: parentPassword });
    } catch (e) {
      if (e.code === 'auth/user-not-found') {
        await getAuth().createUser({
          uid: parentUid,
          email: parentEmail,
          password: parentPassword,
        });
      } else {
        throw e;
      }
    }

    // 4. Set custom claims for the parent
    await getAuth().setCustomUserClaims(parentUid, {
      role: "parent",
      linkedStudentId: studentUid
    });

    // 5. Store a record in the users collection
    await db.collection("users").doc(parentUid).set({
      email: parentEmail,
      role: "parent",
      linkedStudentId: studentUid,
      createdAt: new Date()
    });

    return { 
      success: true, 
      syntheticEmail: parentEmail,
      syntheticPassword: parentPassword,
      linkedStudentId: studentUid,
      studentName: studentData.name || "Student"
    };

  } catch (error) {
    console.error("Error verifying parent ID Number:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("unknown", `DEBUG: ${error.message}`);
  }
});

// ─── Firebase Cloud Functions: Emergency PIN Notification ───────────────────
/**
 * Callable function: sendEmergencyPinNotification
 * 
 * Sends a push notification to all students who have not yet set up their Parent Access PIN.
 * Restricted to Admins.
 */
exports.sendEmergencyPinNotification = onCall(async (request) => {
  const callerUid = request.auth?.uid;

  if (!callerUid) {
    throw new HttpsError("unauthenticated", "User must be authenticated.");
  }

  try {
    // 1. Verify caller is an Admin
    const userDoc = await db.collection("users").doc(callerUid).get();
    if (!userDoc.exists || userDoc.data().role !== "admin") {
      throw new HttpsError("permission-denied", "Only admins can send emergency notifications.");
    }

    // 2. Query students who do not have an idNumber
    const studentsSnap = await db.collection("students").get();
    
    const tokens = [];
    studentsSnap.forEach(doc => {
      const data = doc.data();
      if (!data.idNumber && data.fcmToken) {
        tokens.push(data.fcmToken);
      }
    });

    if (tokens.length === 0) {
      return { success: true, count: 0, message: "No eligible students found to notify." };
    }

    // 3. Send multicast message
    const message = {
      tokens: tokens,
      notification: {
        title: "🚨 Action Required: Identification Number",
        body: "Please open the Nivas app to update your Student Identification Number immediately."
      },
      data: {
        type: "system_alert",
      },
      android: {
        priority: "high"
      }
    };

    const response = await messaging.sendEachForMulticast(message);
    
    return { success: true, count: response.successCount, message: `Successfully notified ${response.successCount} students.` };
  } catch (error) {
    console.error("Error sending emergency ID notification:", error);
    throw new HttpsError("internal", "Failed to send emergency notification.");
  }
});

// ─── Firebase Cloud Functions: Incoming Call Push Notification ──────────────
/**
 * Background trigger: onCallCreated
 * 
 * Fires when a new document is created in the "calls" collection.
 * Looks up the callee's FCM token and sends an "Incoming Call" push notification.
 */
exports.onCallCreated = onDocumentCreated("calls/{callId}", async (event) => {
  const callDoc = event.data;
  if (!callDoc) return;

  const callData = callDoc.data();
  const calleeUid = callData.calleeUid;
  const callerName = callData.callerName || "Someone";

  if (!calleeUid) return;

  try {
    // 1. Fetch callee's fcm token from users or students collection
    let fcmToken = null;

    // Check users collection first
    const userDoc = await db.collection("users").doc(calleeUid).get();
    if (userDoc.exists && userDoc.data().fcmToken) {
      fcmToken = userDoc.data().fcmToken;
    } else {
      // Fallback to students collection
      const studentDoc = await db.collection("students").doc(calleeUid).get();
      if (studentDoc.exists && studentDoc.data().fcmToken) {
        fcmToken = studentDoc.data().fcmToken;
      }
    }

    if (!fcmToken) {
      console.log(`No FCM token found for callee ${calleeUid}. Skipping push notification.`);
      return;
    }

    // 2. Send push notification
    const message = {
      token: fcmToken,
      notification: {
        title: "Incoming Call",
        body: `${callerName} is calling you. Tap to answer!`
      },
      data: {
        type: "incoming_call",
        callId: event.params.callId,
        callerUid: callData.callerUid,
        callerName: callerName
      },
      android: {
        priority: "high",
        notification: {
          channelId: "calls",
          sound: "default"
        }
      },
      apns: {
        payload: {
          aps: {
            sound: "default"
          }
        }
      }
    };

    await getMessaging().send(message);
    console.log(`Successfully sent incoming call push notification to ${calleeUid}`);

  } catch (error) {
    console.error("Error sending incoming call push notification:", error);
  }
});
