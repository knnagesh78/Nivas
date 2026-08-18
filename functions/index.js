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
  const { studentEmail, pin } = request.data;
  const callerUid = request.auth?.uid;

  if (!callerUid) {
    throw new HttpsError("unauthenticated", "User must be authenticated (anonymously) to verify PIN.");
  }

  if (!studentEmail || !pin) {
    throw new HttpsError("invalid-argument", "Student email and PIN are required.");
  }

  try {
    // 1. Find the student by email in the users collection first to get the UID,
    //    or search directly in the students collection if email is stored there.
    //    We'll search the users collection since emails are reliably there.
    const usersQuery = await db.collection("users").where("email", "==", studentEmail).where("role", "==", "student").limit(1).get();
    
    if (usersQuery.empty) {
      throw new HttpsError("not-found", "Student not found with this email.");
    }
    
    const studentUid = usersQuery.docs[0].id;

    // 2. Fetch the student's full profile to check the PIN
    const studentDoc = await db.collection("students").doc(studentUid).get();
    
    if (!studentDoc.exists) {
      throw new HttpsError("not-found", "Student profile not found.");
    }

    const studentData = studentDoc.data();
    
    if (!studentData.pin) {
      throw new HttpsError("failed-precondition", "This student has not set up a Parent PIN yet.");
    }

    if (studentData.pin !== pin) {
      throw new HttpsError("permission-denied", "Incorrect PIN.");
    }

    // 3. Set custom user claims for the parent
    await getAuth().setCustomUserClaims(callerUid, {
      role: "parent",
      linkedStudentId: studentUid
    });

    // 4. Also store a record in the users collection so the frontend can easily read the role
    await db.collection("users").doc(callerUid).set({
      email: `parent_${studentUid}@nivas.local`, // Dummy email
      role: "parent",
      linkedStudentId: studentUid,
      createdAt: new Date()
    });

    return { 
      success: true, 
      linkedStudentId: studentUid,
      studentName: studentData.name || "Student"
    };

  } catch (error) {
    console.error("Error verifying parent PIN:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", "An error occurred while verifying the PIN.");
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

    // 2. Query students who do not have a pin
    const studentsSnap = await db.collection("students").get();
    
    const tokens = [];
    studentsSnap.forEach(doc => {
      const data = doc.data();
      if (!data.pin && data.fcmToken) {
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
        title: "🚨 Action Required: Security Update",
        body: "Please open the Nivas app to set your Parent Access PIN immediately."
      },
      data: {
        type: "system_alert",
      },
      android: {
        priority: "high"
      }
    };

    const response = await messaging.sendEachForMulticast(message);
    
    return { 
      success: true, 
      count: response.successCount, 
      failed: response.failureCount,
      message: `Successfully notified ${response.successCount} students.` 
    };

  } catch (error) {
    console.error("Error sending emergency notifications:", error);
    throw new HttpsError("internal", "Failed to send emergency notifications.");
  }
});
