import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { db, auth, firebaseConfig, clearFirebaseConfig } from "../firebase";
import {
  Mail,
  Lock,
  User,
  GraduationCap,
  Shield,
  Wrench,
  Download,
  ArrowLeft,
  Eye,
  EyeOff,
  Sparkles,
  Play
} from "lucide-react";
import InstallWizardModal from "../components/InstallWizardModal";
import SplashScreen3D from "../components/3d/SplashScreen3D";
import Portal3DScene from "../components/3d/Portal3DScene";

export default function Login() {
  const [role, setRole] = useState("student"); // "student" | "warden" | "admin"
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);

  // Splash screen state: show 3D splash on fresh session load
  const [showSplash, setShowSplash] = useState(() => {
    // Show splash screen on first visit in session
    return !sessionStorage.getItem("nivas_splash_viewed");
  });

  const handleSplashComplete = () => {
    sessionStorage.setItem("nivas_splash_viewed", "true");
    setShowSplash(false);
  };

  // True when the browser has a deferred install prompt ready
  const [canInstall, setCanInstall] = useState(() => !!window.deferredPrompt);

  // True only when the app is running in standalone (already installed)
  const isStandaloneMode =
    window.matchMedia("(display-mode: standalone)").matches ||
    !!window.navigator.standalone;

  useEffect(() => {
    const handleInstallable = () => setCanInstall(true);
    const handleInstalled = () => {
      setCanInstall(false);
      setWizardOpen(false);
    };
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
        const cred = await createUserWithEmailAndPassword(
          auth,
          "knnagesh7815@gmail.com",
          "nagesh123"
        );
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
        const cred = await createUserWithEmailAndPassword(
          secondaryAuth,
          "vishnuvardhanreddy@hostel.com",
          "vishnu@123"
        );
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
            setError(
              `This account is registered as an ${data.role.toUpperCase()}. Please select the correct tab.`
            );
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
          setError("Account not found in the database.");
        }
      }
    } catch (err) {
      setError(err.message || "Authentication failed. Please verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  // Portal metadata
  const portalInfo = {
    student: {
      tagline: "Access attendance, leave, notices, complaints, and more.",
      cta: isSignUp ? "Create Student Account" : "Sign In as STUDENT",
      accent: "from-indigo-600 via-indigo-500 to-purple-600",
      glowColor: "rgba(99, 102, 241, 0.4)",
      badge: "Student Portal"
    },
    warden: {
      tagline: "Manage attendance, approve leaves, post notices, and view student details.",
      cta: "Sign In as WARDEN",
      accent: "from-amber-600 via-amber-500 to-yellow-600",
      glowColor: "rgba(245, 158, 11, 0.4)",
      badge: "Warden Deck"
    },
    admin: {
      tagline: "Manage wardens, student records, notices, and the full hostel system.",
      cta: "Sign In as ADMIN",
      accent: "from-rose-600 via-purple-600 to-indigo-600",
      glowColor: "rgba(225, 29, 72, 0.4)",
      badge: "Master Admin"
    }
  };

  const currentInfo = portalInfo[role];

  return (
    <>
      {/* 3D Animated Splash Screen */}
      {showSplash && <SplashScreen3D onComplete={handleSplashComplete} />}

      <div className="min-h-screen w-full bg-[#060914] text-slate-100 flex flex-col relative overflow-x-hidden selection:bg-indigo-600 selection:text-white">
        {/* Dynamic ambient nebula backdrops */}
        <div className="absolute top-[-15%] left-[-10%] w-[55vw] h-[55vw] rounded-full bg-indigo-900/25 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[55vw] h-[55vw] rounded-full bg-purple-900/20 blur-[130px] pointer-events-none" />
        <div className="absolute top-[40%] right-[20%] w-[35vw] h-[35vw] rounded-full bg-cyan-900/15 blur-[100px] pointer-events-none" />

        {/* Top Floating App Bar */}
        <header className="relative z-30 w-full flex items-center justify-between px-4 sm:px-8 py-5 max-w-7xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="relative group cursor-pointer" onClick={() => setShowSplash(true)}>
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 opacity-60 blur-sm group-hover:opacity-100 transition-all duration-300" />
              <img
                src="/logo.svg"
                className="relative h-11 w-11 rounded-2xl bg-slate-900 p-1 border border-indigo-500/40 shadow-xl"
                alt="Nivas Logo"
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-extrabold tracking-wider bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
                  NIVAS
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
                  PWA 2.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Smart Hostel Ecosystem</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Replay 3D Splash Button */}
            <button
              onClick={() => setShowSplash(true)}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/60 text-slate-300 hover:text-white text-xs font-semibold backdrop-blur-md transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95"
              title="Watch 3D Intro Splash"
            >
              <Play className="h-3.5 w-3.5 text-indigo-400" />
              <span className="hidden sm:inline">3D Intro</span>
            </button>

            {/* PWA Download Button */}
            {canInstall && !isStandaloneMode && (
              <button
                onClick={() => setWizardOpen(true)}
                className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-500/25 hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 animate-bounce" />
                <span>Install App</span>
              </button>
            )}
          </div>
        </header>

        {/* Main Content Area: Responsive Split Grid (3D Scene + Glassmorphic Card) */}
        <main className="relative z-20 flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-4 sm:py-8 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12">
          {/* LEFT: Interactive 3D Portal Experience */}
          <div className="w-full lg:w-1/2 flex flex-col items-center justify-center min-h-[320px] sm:min-h-[420px] lg:min-h-[560px] relative order-1 lg:order-1">
            {/* 3D Scene Viewport */}
            <div className="w-full h-full max-w-[520px] rounded-3xl overflow-hidden border border-slate-800/60 bg-slate-950/40 backdrop-blur-xl shadow-2xl relative group">
              <Portal3DScene role={role} />

              {/* Portal Info Overlay at the top of 3D container */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                <span className="px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/60 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-slate-200 shadow-md">
                  {currentInfo.badge}
                </span>
                <span className="text-[10px] text-slate-400 flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-900/60 border border-slate-800">
                  <Sparkles className="h-3 w-3 text-indigo-400 animate-spin" />
                  <span>Interactive 3D</span>
                </span>
              </div>
            </div>

            {/* Micro feature pills below 3D viewport */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 max-w-md text-center">
              <span className="text-xs text-slate-400">
                {role === "student" && "✨ Live Attendance • Leave Applications • Notices • Complaints Box • Lost & Found"}
                {role === "warden" && "✨ Warden Ledger • Instant Leave Sign-offs • Student Directories • Campus Notices"}
                {role === "admin" && "✨ Centralized Hostel Grid • Wardens Roster • Student Database • Security Matrix"}
              </span>
            </div>
          </div>

          {/* RIGHT: Modern Glassmorphic Login Form */}
          <div className="w-full lg:w-1/2 max-w-md relative order-2 lg:order-2">
            {/* Glow Behind the Glass Card */}
            <div
              className="absolute -inset-1 rounded-3xl opacity-30 blur-2xl transition-all duration-700 pointer-events-none"
              style={{ background: currentInfo.glowColor }}
            />

            <div className="relative rounded-3xl border border-slate-700/60 bg-slate-900/70 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl shadow-black/60 space-y-6">
              {/* Back to Sign In button when registering */}
              {isSignUp && (
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(false);
                      setError("");
                    }}
                    className="inline-flex items-center space-x-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 bg-slate-800/60 border border-slate-700/70 px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to Sign In</span>
                  </button>
                </div>
              )}

              {/* Header Title */}
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  {isSignUp ? "Create Student Account" : "Sign In to Nivas"}
                </h2>
                <p className="mt-1.5 text-xs sm:text-sm text-slate-400 leading-relaxed">
                  {currentInfo.tagline}
                </p>
              </div>

              {/* Portal Segmented Selector */}
              {!isSignUp && (
                <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-inner">
                  <button
                    type="button"
                    onClick={() => {
                      setRole("student");
                      setError("");
                    }}
                    className={`flex flex-col items-center justify-center rounded-xl py-2.5 text-xs font-bold uppercase transition-all duration-200 cursor-pointer ${
                      role === "student"
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30 scale-[1.02]"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
                    }`}
                  >
                    <GraduationCap className="h-4 w-4 mb-1" />
                    <span>Student</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRole("warden");
                      setError("");
                    }}
                    className={`flex flex-col items-center justify-center rounded-xl py-2.5 text-xs font-bold uppercase transition-all duration-200 cursor-pointer ${
                      role === "warden"
                        ? "bg-gradient-to-r from-amber-600 to-yellow-600 text-white shadow-lg shadow-amber-600/30 scale-[1.02]"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
                    }`}
                  >
                    <User className="h-4 w-4 mb-1" />
                    <span>Warden</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRole("admin");
                      setError("");
                    }}
                    className={`flex flex-col items-center justify-center rounded-xl py-2.5 text-xs font-bold uppercase transition-all duration-200 cursor-pointer ${
                      role === "admin"
                        ? "bg-gradient-to-r from-rose-600 to-purple-600 text-white shadow-lg shadow-rose-600/30 scale-[1.02]"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
                    }`}
                  >
                    <Shield className="h-4 w-4 mb-1" />
                    <span>Admin</span>
                  </button>
                </div>
              )}

              {/* Error Alert */}
              {error && (
                <div className="rounded-2xl bg-rose-950/40 border border-rose-800/60 p-3.5 text-xs sm:text-sm text-rose-300 animate-fadeIn flex items-start space-x-2">
                  <span className="text-rose-400 mt-0.5">⚠️</span>
                  <div className="flex-1">{error}</div>
                </div>
              )}

              {/* Credentials Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-3.5">
                  {/* Email Input */}
                  <div className="relative group">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                      <Mail className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-400 transition-colors" />
                    </div>
                    <input
                      id="email-address"
                      name="email"
                      type="email"
                      required
                      className="w-full rounded-xl border border-slate-700/80 bg-slate-950/60 py-3.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all duration-200"
                      placeholder={
                        role === "student"
                          ? "student@hostel.edu"
                          : role === "warden"
                          ? "warden@hostel.com"
                          : "admin@hostel.com"
                      }
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  {/* Password Input */}
                  <div className="relative group">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                      <Lock className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-400 transition-colors" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      className="w-full rounded-xl border border-slate-700/80 bg-slate-950/60 py-3.5 pl-10 pr-11 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all duration-200"
                      placeholder="Enter security password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-200 cursor-pointer transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Confirm Password Input (Sign Up Only) */}
                  {isSignUp && (
                    <div className="relative group">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                        <Lock className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-400 transition-colors" />
                      </div>
                      <input
                        id="confirm-password"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        className="w-full rounded-xl border border-slate-700/80 bg-slate-950/60 py-3.5 pl-10 pr-11 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all duration-200"
                        placeholder="Confirm security password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-200 cursor-pointer transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  )}
                </div>

                {/* Submit Action Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3.5 rounded-xl text-white font-bold text-sm tracking-wide shadow-xl transition-all duration-200 cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r ${currentInfo.accent}`}
                  style={{ boxShadow: `0 8px 24px -4px ${currentInfo.glowColor}` }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center space-x-2">
                      <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      <span>Authenticating...</span>
                    </span>
                  ) : (
                    currentInfo.cta
                  )}
                </button>
              </form>

              {/* Student Registration Toggle */}
              {(role === "student" || isSignUp) && (
                <div className="text-center pt-1">
                  <button
                    type="button"
                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
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

              {/* Developer DB Utilities & Connection Management */}
              <div className="pt-4 border-t border-slate-800/80 flex flex-col items-center space-y-2">
                {seedMsg && (
                  <div className="rounded-xl bg-indigo-950/40 border border-indigo-800/50 p-2.5 text-xs text-indigo-300 w-full text-center">
                    {seedMsg}
                  </div>
                )}
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs">
                  <button
                    type="button"
                    disabled={seedLoading}
                    onClick={handleSeedDatabase}
                    className="inline-flex items-center space-x-1.5 text-slate-400 hover:text-slate-200 transition-colors font-medium cursor-pointer"
                  >
                    <Wrench className="h-3.5 w-3.5 text-slate-500" />
                    <span>{seedLoading ? "Seeding..." : "Seed Default DB"}</span>
                  </button>
                  {localStorage.getItem("firebase_config") && (
                    <button
                      type="button"
                      onClick={clearFirebaseConfig}
                      className="text-rose-400 hover:text-rose-300 transition-colors font-medium cursor-pointer"
                    >
                      Reset Connection
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* PWA Install Wizard Modal */}
        <InstallWizardModal
          isOpen={wizardOpen}
          onClose={() => setWizardOpen(false)}
          onInstalled={() => {
            setCanInstall(false);
            setWizardOpen(false);
          }}
        />
      </div>
    </>
  );
}
