import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

let firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Check if configured via env or stored config
const isValidConfig = (config) => {
  return (
    config &&
    config.apiKey &&
    config.apiKey !== "your_api_key_here" &&
    config.apiKey.trim() !== ""
  );
};

let app = null;
let auth = null;
let db = null;
let isFirebaseConfigured = false;

if (isValidConfig(firebaseConfig)) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    isFirebaseConfigured = true;
  } catch (error) {
    console.error("Firebase initialization failed with env config:", error);
  }
} else {
  // Try loading from localStorage
  try {
    const savedConfig = localStorage.getItem("firebase_config");
    if (savedConfig) {
      const parsedConfig = JSON.parse(savedConfig);
      if (isValidConfig(parsedConfig)) {
        app = getApps().length === 0 ? initializeApp(parsedConfig) : getApp();
        auth = getAuth(app);
        db = getFirestore(app);
        isFirebaseConfigured = true;
        firebaseConfig = parsedConfig;
      }
    }
  } catch (error) {
    console.error("Firebase initialization failed with localStorage config:", error);
  }
}

export { app, auth, db, isFirebaseConfigured, firebaseConfig };

export const saveFirebaseConfig = (config) => {
  if (isValidConfig(config)) {
    localStorage.setItem("firebase_config", JSON.stringify(config));
    window.location.reload();
    return true;
  }
  return false;
};

export const clearFirebaseConfig = () => {
  localStorage.removeItem("firebase_config");
  window.location.reload();
};
