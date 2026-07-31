import fs from "fs";
import path from "path";
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

// Custom .env parser to avoid external packages
const loadEnv = () => {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    envContent.split("\n").forEach((line) => {
      // Ignore comments and empty lines
      if (line.trim().startsWith("#") || !line.trim()) return;
      const parts = line.split("=");
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join("=").trim().replace(/(^["']|["']$)/g, "");
        process.env[key] = val;
      }
    });
    console.log("Loaded configurations from .env file.");
  } else {
    console.warn("No .env file found. Looking for environment variables.");
  }
};

loadEnv();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "your_api_key_here") {
  console.error("\n❌ ERROR: Firebase credentials are not set!");
  console.error("Please configure VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID, etc. in a `.env` file.");
  console.error("Alternatively, you can seed using the setup assistant in the browser application.\n");
  process.exit(1);
}

console.log(`Connecting to Firebase project: ${firebaseConfig.projectId}...`);

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const seedAccounts = async () => {
  // 1. Seed Admin
  const adminEmail = "knnagesh7815@gmail.com";
  const adminPass = "nagesh123";
  const adminName = "Nagesh";

  // 2. Seed Warden
  const wardenEmail = "vishnuvardhanreddy@hostel.com";
  const wardenPass = "vishnu@123";
  const wardenName = "Vishnu Vardhan Reddy";

  console.log("\n-------------------------------------------");
  console.log("Starting account seeding...");
  console.log("-------------------------------------------\n");

  try {
    console.log(`[1/4] Registering Admin Auth account: ${adminEmail}...`);
    let adminUid = "";
    try {
      const adminCred = await createUserWithEmailAndPassword(auth, adminEmail, adminPass);
      adminUid = adminCred.user.uid;
      console.log(`✅ Admin Auth account created: UID = ${adminUid}`);
    } catch (authError) {
      if (authError.code === "auth/email-already-in-use") {
        console.log("ℹ️ Admin Auth account already exists. Proceeding to sync Firestore record.");
        // We cannot get UID directly if it already exists from client auth SDK, but we will print warning.
        console.log("⚠️ If the account exists but Firestore records are missing, please delete the user in the Firebase console first.");
      } else {
        throw authError;
      }
    }

    if (adminUid) {
      console.log("[2/4] Saving Admin Firestore details...");
      await setDoc(doc(db, "users", adminUid), {
        email: adminEmail,
        role: "admin",
        name: adminName
      });
      console.log("✅ Admin Firestore records saved.");
      await signOut(auth); // Clear credentials context
    }

    console.log(`\n[3/4] Registering Warden Auth account: ${wardenEmail}...`);
    let wardenUid = "";
    try {
      const wardenCred = await createUserWithEmailAndPassword(auth, wardenEmail, wardenPass);
      wardenUid = wardenCred.user.uid;
      console.log(`✅ Warden Auth account created: UID = ${wardenUid}`);
    } catch (authError) {
      if (authError.code === "auth/email-already-in-use") {
        console.log("ℹ️ Warden Auth account already exists. Proceeding to sync Firestore record.");
      } else {
        throw authError;
      }
    }

    if (wardenUid) {
      console.log("[4/4] Saving Warden Firestore details...");
      await setDoc(doc(db, "users", wardenUid), {
        email: wardenEmail,
        role: "warden"
      });
      await setDoc(doc(db, "wardens", wardenUid), {
        name: wardenName,
        createdAt: new Date()
      });
      console.log("✅ Warden Firestore records saved.");
      await signOut(auth); // Clear credentials context
    }

    console.log("\n🎉 Seeding completed successfully!");
    console.log("You can now login with either account from the application.\n");
  } catch (error) {
    console.error("\n❌ Seeding failed with error:", error.message || error);
  } finally {
    process.exit(0);
  }
};

seedAccounts();
