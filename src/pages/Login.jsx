import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { db, auth, firebaseConfig, clearFirebaseConfig } from "../firebase";
import { Mail, Lock, User, GraduationCap, Shield, Wrench, Download, ArrowLeft, Eye, EyeOff, Users } from "lucide-react";
import InstallWizardModal from "../components/InstallWizardModal";

export default function Login() {
  const [role, setRole] = useState("student"); // "student" | "warden" | "admin" | "parent"
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);

  // True when the browser has a deferred install prompt ready
  const [canInstall, setCanInstall] = useState(() => !!window.deferredPrompt);

  // True only when the app is running in standalone (already installed)
  const isStandaloneMode =
    window.matchMedia('(display-mode: standalone)').matches ||
    !!window.navigator.standalone;

  useEffect(() => {
    const handleInstallable = () => setCanInstall(true);
    const handleInstalled = () => { setCanInstall(false); setWizardOpen(false); };
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      window.deferredPrompt = e;
      setCanInstall(true);
    };

    window.addEventListener("pwa:installable", handleInstallable);
    window.addEventListener("pwa:installed", handleInstalled);
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("pwa:installable", handleInstallable);
      window.removeEventListener("pwa:installed", handleInstalled);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  
  const { login, signupStudent, logout, parentLogin } = useAuth();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (role === "student" && isSignUp) {
        if (password !== confirmPassword) {
          setError("Passwords do not match");
          setLoading(false);
          return;
        }
        await signupStudent(email, password);
        navigate("/complete-profile");
      } else {
        const cred = await login(email, password);
        const userDoc = await getDoc(doc(db, "users", cred.user.uid));
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.role !== role) {
            await logout();
            setError(`This account is registered as an ${data.role.toUpperCase()}. Please select the correct tab.`);
            setLoading(false);
            return;
          }

          if (role === "admin") navigate("/admin");
          else if (role === "warden") navigate("/warden");
          else {
            if (!data.profileComplete) navigate("/complete-profile");
            else navigate("/student");
          }
        } else {
          await logout();
          setError("Account not found.");
        }
      }
    } catch (err) {
      setError(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-slate-800 opacity-50 blur-3xl"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-slate-800 opacity-50 blur-3xl"></div>

      {canInstall && !isStandaloneMode && (
        <div className="absolute top-6 right-6 z-20">
          <button
            onClick={() => setWizardOpen(true)}
            className="flex items-center space-x-2 bg-slate-800/40 border border-slate-700/60 text-indigo-400 hover:text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all backdrop-blur-md cursor-pointer hover:bg-slate-800/70 shadow-lg shadow-indigo-500/5 hover:scale-105 active:scale-95"
          >
            <Download className="h-4 w-4 animate-bounce" />
            <span>Download App</span>
          </button>
        </div>
      )}

      <div className="w-full max-w-md space-y-8 bg-slate-850 p-8 rounded-3xl border border-slate-800 shadow-2xl relative z-10 bg-slate-950/60 backdrop-blur-md">
        {isSignUp && (
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setError("");
              }}
              className="inline-flex items-center space-x-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Sign In</span>
            </button>
          </div>
        )}

        <div>
          <img src="/logo.svg" className="mx-auto h-16 w-16 rounded-2xl shadow-lg shadow-indigo-500/10 animate-pulse" alt="Nivas Logo" />
          <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-white">
            {isSignUp ? "Create Student Account" : "Sign In to Nivas"}
          </h2>
        </div>

        {!isSignUp && (
          <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-900 p-1 border border-slate-800">
            <button
              onClick={() => { setRole("student"); setError(""); }}
              className={`flex flex-col items-center justify-center rounded-lg py-2.5 text-xs font-bold uppercase transition-all ${
                role === "student" ? "bg-indigo-600 text-white" : "text-slate-400"
              }`}
            >
              <GraduationCap className="h-4 w-4 mb-1" /> Student
            </button>
            <button
              onClick={() => { setRole("warden"); setError(""); }}
              className={`flex flex-col items-center justify-center rounded-lg py-2.5 text-xs font-bold uppercase transition-all ${
                role === "warden" ? "bg-indigo-600 text-white" : "text-slate-400"
              }`}
            >
              <User className="h-4 w-4 mb-1" /> Warden
            </button>
            <button
              onClick={() => { setRole("admin"); setError(""); }}
              className={`flex flex-col items-center justify-center rounded-lg py-2.5 text-xs font-bold uppercase transition-all ${
                role === "admin" ? "bg-indigo-600 text-white" : "text-slate-400"
              }`}
            >
              <Shield className="h-4 w-4 mb-1" /> Admin
            </button>
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-950/40 border border-red-800/60 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
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
                type={showPassword ? "text" : "password"}
                required
                className="w-full rounded-xl border border-slate-800 bg-slate-900/50 py-3.5 pl-11 pr-11 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-500"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            {isSignUp && (
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Lock className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/50 py-3.5 pl-11 pr-11 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-500"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50"
          >
            {loading ? "Please wait..." : isSignUp ? "Create Student Account" : `Sign In as ${role.toUpperCase()}`}
          </button>
        </form>

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
      <InstallWizardModal
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onInstalled={() => { setCanInstall(false); setWizardOpen(false); }}
      />
    </div>
  );
}
