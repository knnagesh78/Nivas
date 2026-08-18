import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updatePassword as fbUpdatePassword,
  updateEmail as fbUpdateEmail
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { getToken } from "firebase/messaging";
import { auth, db, messaging, isFirebaseConfigured } from "../firebase";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sign up a student
  async function signupStudent(email, password) {
    if (!isFirebaseConfigured) throw new Error("Firebase is not configured.");
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create record in users collection
    await setDoc(doc(db, "users", user.uid), {
      email: email,
      role: "student",
      profileComplete: false,
    });

    // Refresh internal states
    setCurrentUser(user);
    setUserData({
      email: email,
      role: "student",
      profileComplete: false,
    });

    return user;
  }

  // Login
  async function login(email, password) {
    if (!isFirebaseConfigured) throw new Error("Firebase is not configured.");
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Fetch profile data
    const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
    if (userDoc.exists()) {
      setUserData(userDoc.data());
    }
    return userCredential;
  }

  // Logout
  async function logout() {
    if (!isFirebaseConfigured) return;
    await signOut(auth);
    setCurrentUser(null);
    setUserData(null);
  }

  // Complete profile
  async function completeStudentProfile(profileDetails) {
    if (!currentUser) throw new Error("No authenticated user.");
    
    const uid = currentUser.uid;
    // Write student details to students/{uid}
    await setDoc(doc(db, "students", uid), {
      ...profileDetails,
      createdAt: serverTimestamp()
    });

    // Update users/{uid}
    await updateDoc(doc(db, "users", uid), {
      profileComplete: true
    });

    // Refresh userData state
    setUserData(prev => ({ ...prev, profileComplete: true }));
  }

  // Change password
  async function updatePassword(newPassword) {
    if (!auth.currentUser) throw new Error("Not logged in");
    return fbUpdatePassword(auth.currentUser, newPassword);
  }

  // Change email
  async function updateEmail(newEmail) {
    if (!auth.currentUser) throw new Error("Not logged in");
    // Update in auth
    await fbUpdateEmail(auth.currentUser, newEmail);
    // Update in users database
    await updateDoc(doc(db, "users", auth.currentUser.uid), {
      email: newEmail
    });
    setUserData(prev => ({ ...prev, email: newEmail }));
  }

  // Function to manually refresh user data when changes are made
  async function refreshUserData() {
    if (currentUser) {
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }
    }
  }

  // ── Request FCM token and save to student document ──────────────────────
  async function requestAndSaveFCMToken(uid) {
    try {
      if (!messaging) return; // FCM not supported in this browser
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;

      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || "",
        serviceWorkerRegistration: await navigator.serviceWorker.register("/firebase-messaging-sw.js"),
      });

      if (token) {
        // Save token to student document
        await updateDoc(doc(db, "students", uid), {
          fcmToken: token,
        }).catch(() => {
          // Student doc might not exist yet (profile not completed)
          // That's ok, token will be saved when profile is completed
        });
      }
    } catch (err) {
      console.warn("FCM token registration skipped:", err.message);
    }
  }

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
            // Request FCM token for push notifications (non-blocking)
            requestAndSaveFCMToken(user.uid);
          } else {
            setUserData(null);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUserData(null);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userData,
    signupStudent,
    login,
    logout,
    completeStudentProfile,
    updatePassword,
    updateEmail,
    refreshUserData,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
