import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging, isSupported as isMessagingSupported } from "firebase/messaging";

const getEnvVal = (envValue, defaultValue) => {
  return envValue && envValue !== "your_api_key_here" && envValue.trim() !== ""
    ? envValue
    : defaultValue;
};

let firebaseConfig = {
  apiKey: getEnvVal(import.meta.env.VITE_FIREBASE_API_KEY, "AIzaSyACTx17O0nOj960fX70GrU3VFN2TbEWBXI"),
  authDomain: getEnvVal(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN, "nivas-33144.firebaseapp.com"),
  projectId: getEnvVal(import.meta.env.VITE_FIREBASE_PROJECT_ID, "nivas-33144"),
  storageBucket: getEnvVal(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET, "nivas-33144.firebasestorage.app"),
  messagingSenderId: getEnvVal(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID, "166280590956"),
  appId: getEnvVal(import.meta.env.VITE_FIREBASE_APP_ID, "1:166280590956:web:074e445773de5c20484a49"),
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
let messaging = null;
let isFirebaseConfigured = false;

if (isValidConfig(firebaseConfig)) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    isFirebaseConfigured = true;
    // Initialize FCM (async check — not all browsers support it)
    isMessagingSupported().then((supported) => {
      if (supported) {
        messaging = getMessaging(app);
      }
    }).catch(() => {});
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
        // Initialize FCM (async check)
        isMessagingSupported().then((supported) => {
          if (supported) {
            messaging = getMessaging(app);
          }
        }).catch(() => {});
      }
    }
  } catch (error) {
    console.error("Firebase initialization failed with localStorage config:", error);
  }
}

export { app, auth, db, messaging, isFirebaseConfigured, firebaseConfig };

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
