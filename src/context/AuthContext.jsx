import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updatePassword as fbUpdatePassword,
  updateEmail as fbUpdateEmail,
  signInWithCustomToken
} from "firebase/auth";
import { initializeApp, getApp, getApps } from "firebase/app";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, arrayUnion } from "firebase/firestore";
import { getToken } from "firebase/messaging";
import { auth, db, messaging, functions, isFirebaseConfigured, firebaseConfig } from "../firebase";

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

  // Parent Login via ID Number using synthetic credentials locally
  async function parentLogin(idNumber) {
    if (!isFirebaseConfigured) throw new Error("Firebase is not configured.");
    
    // 1. Get the synthetic credentials
    const parentEmail = `parent_${idNumber}@nivas.local`;
    const parentPassword = `Pass_${idNumber}`;

    // 2. Sign in with the synthetic credentials directly
    const userCredential = await signInWithEmailAndPassword(auth, parentEmail, parentPassword);

    // 3. Find which student this parent belongs to by checking the mapping collection
    const mapDoc = await getDoc(doc(db, "student_id_map", idNumber));
    if (!mapDoc.exists()) {
      // Clean up if something is horribly wrong
      await signOut(auth);
      throw new Error("Student mapping not found. Invalid ID Number.");
    }

    const studentUid = mapDoc.data().studentUid;

    // 4. Force fetch of the parent's user document
    const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
    if (userDoc.exists()) {
      setUserData(userDoc.data());
    }

    return {
      syntheticEmail: parentEmail,
      linkedStudentId: studentUid
    };
  }

  // Logout
  async function logout() {
    if (!isFirebaseConfigured) return;
    await signOut(auth);
    setCurrentUser(null);
    setUserData(null);
  }

  // Complete profile and automatically provision Parent Auth Account
  async function completeStudentProfile(profileDetails) {
    if (!currentUser) throw new Error("No authenticated user.");
    
    const uid = currentUser.uid;
    const { idNumber, ...otherDetails } = profileDetails;
    
    // 1. Use a secondary Firebase App to create the Parent Account so the Student doesn't get logged out!
    let parentUid = null;
    const parentEmail = `parent_${idNumber}@nivas.local`;
    const parentPassword = `Pass_${idNumber}`;

    try {
      const secondaryApp = getApps().find(app => app.name === "SecondaryParentApp") || initializeApp(firebaseConfig, "SecondaryParentApp");
      const secondaryAuth = secondaryApp.auth ? secondaryApp.auth() : (await import("firebase/auth")).getAuth(secondaryApp);
      
      const parentCred = await createUserWithEmailAndPassword(secondaryAuth, parentEmail, parentPassword);
      parentUid = parentCred.user.uid;
      
      // Immediately sign out the secondary app
      await signOut(secondaryAuth);
    } catch (error) {
      // If the parent account already exists, we can try to log in to get the UID
      if (error.code === 'auth/email-already-in-use') {
        const secondaryApp = getApp("SecondaryParentApp");
        const secondaryAuth = (await import("firebase/auth")).getAuth(secondaryApp);
        const parentCred = await signInWithEmailAndPassword(secondaryAuth, parentEmail, parentPassword);
        parentUid = parentCred.user.uid;
        await signOut(secondaryAuth);
      } else {
        console.error("Failed to provision parent account:", error);
      }
    }

    // 2. Write student details to students/{uid} and add the parent UID to the parents array!
    await setDoc(doc(db, "students", uid), {
      ...profileDetails,
      parents: parentUid ? [parentUid] : [],
      createdAt: serverTimestamp()
    });

    // 3. Create the mapping document in student_id_map so the Parent can find this student using just the idNumber
    await setDoc(doc(db, "student_id_map", idNumber), {
      studentUid: uid
    });

    // 4. Create the Parent's user document
    if (parentUid) {
      await setDoc(doc(db, "users", parentUid), {
        email: parentEmail,
        role: "parent",
        linkedStudentId: uid,
        createdAt: serverTimestamp()
      });
    }

    // 5. Update the student's own users/{uid} document
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
    parentLogin,
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
