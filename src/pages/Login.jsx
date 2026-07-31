import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { db, auth, firebaseConfig, clearFirebaseConfig } from "../firebase";
import { Mail, Lock, User, GraduationCap, Shield, Wrench } from "lucide-react";

export default function Login() {
  const [role, setRole] = useState("student"); // "student" | "warden" | "admin"
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { login, signupStudent, logout } = useAuth();
  const navigate = useNavigate();

  const [seedLoading, setSeedLoading] = useState(false);
  const [seedMsg, setSeedMsg] = useState("");

  const handleSeedDatabase = async () => {
    setSeedLoading(true);
    setSeedMsg("");
    try {
      // 1. Create Admin
      let adminUid = "";
      try {
        const cred = await createUserWithEmailAndPassword(auth, "knnagesh7815@gmail.com", "nagesh123");
        adminUid = cred.user.uid;
      } catch (err) {
        if (err.code === "auth/email-already-in-use") {
          setSeedMsg("Accounts already exists. Firestore records sync started.");
        } else {
          throw err;
        }
      }

      if (adminUid) {
        await setDoc(doc(db, "users", adminUid), {
          email: "knnagesh7815@gmail.com",
          role: "admin",
          name: "Nagesh"
        });
      }

      // 2. Create Warden
      let wardenUid = "";
      const secondaryAppName = `WardenSeederApp_${Date.now()}`;
      const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
      const secondaryAuth = getAuth(secondaryApp);
      try {
        const cred = await createUserWithEmailAndPassword(secondaryAuth, "vishnuvardhanreddy@hostel.com", "vishnu@123");
        wardenUid = cred.user.uid;
      } catch (err) {
        if (err.code === "auth/email-already-in-use") {
          // Ignore if exists
        } else {
          throw err;
        }
      }

      if (wardenUid) {
        await setDoc(doc(db, "users", wardenUid), {
          email: "vishnuvardhanreddy@hostel.com",
          role: "warden"
        });
        await setDoc(doc(db, "wardens", wardenUid), {
          name: "Vishnu Vardhan Reddy",
          createdAt: serverTimestamp()
        });
      }
      
      await secondaryAuth.signOut();
      setSeedMsg("Seeding completed! Log in with seeded admin/warden accounts.");
    } catch (err) {
      console.error(err);
      setSeedMsg(`Seeding error: ${err.message}`);
    } finally {
      setSeedLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const cred = await login(email, password);
      const userDoc = await getDoc(doc(db, "users", cred.user.uid));
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data.role !== role) {
          // Force sign out since role doesn't match the selected tab
          await logout();
          setError(
            `This account is registered as an ${data.role.toUpperCase()}. Please select the correct tab to log in.`
          );
          setLoading(false);
          return;
        }

        // Redirect based on role
        if (role === "admin") navigate("/admin");
        else if (role === "warden") navigate("/warden");
        else {
          if (!data.profileComplete) {
            navigate("/complete-profile");
          } else {
            navigate("/student");
          }
        }
      } else {
        await logout();
        setError("Account not found in user records.");
      }
    } catch (err) {
      console.error(err);
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setError("Invalid email or password.");
      } else {
        setError(err.message || "Failed to log in.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password should be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      await signupStudent(email, password);
      // Auth state will redirect them to complete profile automatically
      navigate("/complete-profile");
    } catch (err) {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        setError("This email address is already in use.");
      } else {
        setError(err.message || "Failed to register.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background shapes */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-slate-800 opacity-50 blur-3xl"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-slate-800 opacity-50 blur-3xl"></div>

      <div className="w-full max-w-md space-y-8 bg-slate-850 p-8 rounded-3xl border border-slate-800 shadow-2xl relative z-10 bg-slate-950/60 backdrop-blur-md">
        <div>
          <img src="/logo.svg" className="mx-auto h-16 w-16 rounded-2xl shadow-lg shadow-indigo-500/10 animate-pulse" alt="Nivas Logo" />
          <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-white">
            {isSignUp ? "Create Student Account" : "Sign In to Nivas"}
          </h2>
          <p className="mt-2 text-center text-sm text-indigo-400 font-medium">
            Every stay, sorted
          </p>
        </div>

        {/* Role Selector Tabs (Only show if not signing up) */}
        {!isSignUp && (
          <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-900 p-1 border border-slate-800">
            <button
              onClick={() => {
                setRole("student");
                setError("");
              }}
              className={`flex flex-col items-center justify-center rounded-lg py-2.5 text-xs font-bold uppercase transition-all ${
                role === "student"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <GraduationCap className="h-4 w-4 mb-1" />
              Student
            </button>
            <button
              onClick={() => {
                setRole("warden");
                setError("");
              }}
              className={`flex flex-col items-center justify-center rounded-lg py-2.5 text-xs font-bold uppercase transition-all ${
                role === "warden"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <User className="h-4 w-4 mb-1" />
              Warden
            </button>
            <button
              onClick={() => {
                setRole("admin");
                setError("");
              }}
              className={`flex flex-col items-center justify-center rounded-lg py-2.5 text-xs font-bold uppercase transition-all ${
                role === "admin"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Shield className="h-4 w-4 mb-1" />
              Admin
            </button>
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-950/40 border border-red-800/60 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-5" onSubmit={isSignUp ? handleSignUp : handleLogin}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <Mail className="h-5 w-5 text-slate-500" />
              </div>
              <input
                id="email-address"
                name="email"
                type="email"
                required
                className="w-full rounded-xl border border-slate-800 bg-slate-900/50 py-3.5 pl-11 pr-4 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <Lock className="h-5 w-5 text-slate-500" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full rounded-xl border border-slate-800 bg-slate-900/50 py-3.5 pl-11 pr-4 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {isSignUp && (
              <div className="relative animate-fadeIn">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Lock className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  required
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/50 py-3.5 pl-11 pr-4 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white hover:bg-indigo-500 outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all disabled:opacity-50"
            >
              {loading ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
              ) : isSignUp ? (
                "Create Account"
              ) : (
                `Sign In as ${role.toUpperCase()}`
              )}
            </button>
          </div>
        </form>

        {/* Toggle sign in / sign up link (only for Student role) */}
        {(role === "student" || isSignUp) && (
          <div className="text-center">
            <button
              type="button"
              className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-all"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
                setRole("student");
              }}
            >
              {isSignUp
                ? "Already have an account? Sign In"
                : "Are you a student? Register here"}
            </button>
          </div>
        )}

        {/* Browser Seeding & Connection Reset Utility */}
        <div className="pt-4 border-t border-slate-800/60 mt-4 flex flex-col items-center space-y-2">
          {seedMsg && (
            <div className="mb-2 rounded-xl bg-indigo-950/40 border border-indigo-800/50 p-3 text-xs text-indigo-300 w-full text-center">
              {seedMsg}
            </div>
          )}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs">
            <button
              type="button"
              disabled={seedLoading}
              onClick={handleSeedDatabase}
              className="inline-flex items-center space-x-1.5 text-slate-400 hover:text-white transition-all font-semibold cursor-pointer"
            >
              <Wrench className="h-3.5 w-3.5 text-slate-500" />
              <span>{seedLoading ? "Seeding..." : "Seed Default DB"}</span>
            </button>
            {localStorage.getItem("firebase_config") && (
              <button
                type="button"
                onClick={clearFirebaseConfig}
                className="text-rose-450 hover:text-rose-350 transition-all font-semibold cursor-pointer"
              >
                Reset Connection
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
