import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from "firebase/auth";
import { db, auth, firebaseConfig, clearFirebaseConfig } from "../firebase";
import {
  Mail,
  Lock,
  GraduationCap,
  ClipboardList,
  ShieldCheck,
  Wrench,
  Download,
  ArrowLeft,
  Eye,
  EyeOff,
  Sparkles,
  Play,
  KeyRound,
  X
} from "lucide-react";
import InstallWizardModal from "../components/InstallWizardModal";
import SplashScreen3D from "../components/3d/SplashScreen3D";
import Hostel3DCanvas from "../components/3d/Hostel3DCanvas";

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

  // Forgot password modal state
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMsg, setResetMsg] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  // 3D Splash Screen State (shown on first visit of the session)
  const [showSplash, setShowSplash] = useState(() => {
    return !sessionStorage.getItem("nivas_splash_viewed");
  });

  const handleSplashComplete = () => {
    sessionStorage.setItem("nivas_splash_viewed", "true");
    setShowSplash(false);
  };

  // PWA Install state
  const [canInstall, setCanInstall] = useState(() => !!window.deferredPrompt);
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

  // Developer Seed Utilities
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
          // already exists
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
      setSeedMsg("Default accounts ready! Log in with seeded admin/warden.");
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
          setError("Passwords do not match. Please re-enter.");
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
              `This account is registered as ${data.role.toUpperCase()}. Please switch to the ${data.role.toUpperCase()} tab to sign in.`
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
          setError("Account record not found. Please contact administration.");
        }
      }
    } catch (err) {
      setError(err.message || "Authentication failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setResetError("");
    setResetMsg("");
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetMsg("Password reset email sent! Check your inbox.");
    } catch (err) {
      setResetError(err.message || "Failed to send reset email.");
    } finally {
      setResetLoading(false);
    }
  };

  // Portal metadata and exact specifications from prompt
  const portalData = {
    student: {
      title: "Student Portal",
      description:
        "Check attendance, apply for leave, view notices, submit complaints and manage your hostel activities.",
      buttonText: isSignUp ? "Create Student Account" : "Sign In as STUDENT",
      accentGradient: "from-indigo-600 via-indigo-500 to-violet-600",
      pillGlow: "shadow-indigo-500/25",
      badgeColor: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20"
    },
    warden: {
      title: "Warden Portal",
      description:
        "Mark attendance, approve leave requests, publish notices and manage student details.",
      buttonText: "Sign In as WARDEN",
      accentGradient: "from-teal-600 via-emerald-600 to-emerald-500",
      pillGlow: "shadow-emerald-500/25",
      badgeColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
    },
    admin: {
      title: "Admin Portal",
      description:
        "Manage wardens, student records, notices and the complete hostel management system.",
      buttonText: "Sign In as ADMIN",
      accentGradient: "from-violet-600 via-purple-600 to-indigo-600",
      pillGlow: "shadow-violet-500/25",
      badgeColor: "text-violet-400 bg-violet-500/10 border-violet-500/20"
    }
  };

  const activePortal = portalData[role];

  return (
    <>
      {/* 1. Opening 3D Animated Splash Screen */}
      {showSplash && <SplashScreen3D onComplete={handleSplashComplete} />}

      {/* Main Container: Deep Navy / Teal Midnight Canvas */}
      <div className="min-h-screen w-full bg-[#070d1e] text-slate-100 flex flex-col relative overflow-x-hidden selection:bg-indigo-600 selection:text-white">
        {/* Subtle Ambient Radial Glows (Deep Navy, Dark Teal, Violet) */}
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#0f3b46]/25 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#8b5cf6]/15 blur-[130px] pointer-events-none" />
        <div className="absolute top-[35%] right-[25%] w-[30vw] h-[30vw] rounded-full bg-[#10b981]/10 blur-[100px] pointer-events-none" />

        {/* Top Floating App Bar */}
        <header className="relative z-30 w-full flex items-center justify-between px-5 sm:px-10 py-5 max-w-7xl mx-auto">
          {/* Logo & Brand Name */}
          <div className="flex items-center space-x-3.5">
            <div
              className="relative group cursor-pointer"
              onClick={() => setShowSplash(true)}
              title="Click to replay 3D Intro"
            >
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 opacity-60 blur-sm group-hover:opacity-100 transition-all duration-300" />
              <img
                src="/logo.svg"
                className="relative h-11 w-11 rounded-2xl bg-[#091428] p-1 border border-emerald-500/40 shadow-xl"
                alt="Nivas Logo"
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-extrabold tracking-wider bg-gradient-to-r from-white via-slate-100 to-emerald-300 bg-clip-text text-transparent">
                  NIVAS
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                  Hostel OS
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Smart Residency Management</p>
            </div>
          </div>

          {/* Action Buttons: 3D Intro & PWA Install */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={() => setShowSplash(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white text-xs font-semibold backdrop-blur-md transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95"
              title="Watch 3D Opening Animation"
            >
              <Play className="h-3.5 w-3.5 text-emerald-400" />
              <span className="hidden sm:inline">3D Intro</span>
            </button>

            {canInstall && !isStandaloneMode && (
              <button
                onClick={() => setWizardOpen(true)}
                className="flex items-center space-x-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 animate-bounce" />
                <span>Install PWA</span>
              </button>
            )}
          </div>
        </header>

        {/* 2. Responsive Split-Screen Layout (Desktop: 45% 3D / 55% Form; Mobile: 3D top / Form bottom) */}
        <main className="relative z-20 flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-3 sm:py-6 flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-12">
          {/* LEFT SIDE: 45% Animated 3D Illustration Area */}
          <div className="w-full lg:w-[45%] flex flex-col items-center justify-center min-h-[280px] sm:min-h-[380px] lg:min-h-[580px] relative">
            {/* 3D Viewport Glass Container */}
            <div className="w-full h-full max-w-[500px] rounded-3xl overflow-hidden border border-slate-700/60 bg-[#091428]/60 backdrop-blur-2xl shadow-2xl relative group">
              {/* Dynamic 3D WebGL Canvas */}
              <Hostel3DCanvas activeRole={role} />

              {/* Floating Top Badge */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border backdrop-blur-md shadow-md ${activePortal.badgeColor}`}
                >
                  {role} 3D World
                </span>
                <span className="text-[10px] text-slate-300 flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-700/60">
                  <Sparkles className="h-3 w-3 text-emerald-400 animate-spin" />
                  <span>Interactive 3D</span>
                </span>
              </div>
            </div>

            {/* Contextual description below 3D container */}
            <p className="mt-3 text-xs text-slate-400 text-center max-w-sm">
              {role === "student" && "✨ Room life, real-time attendance check, leave letters & lost item box."}
              {role === "warden" && "✨ Supervisory office, attendance register, keys & animated leave approval."}
              {role === "admin" && "✨ Miniature hostel hub, database clusters, network nodes & system telemetry."}
            </p>
          </div>

          {/* RIGHT SIDE: 55% Login Form Area */}
          <div className="w-full lg:w-[55%] max-w-lg relative">
            {/* Soft Ambient Glow Behind Card */}
            <div
              className={`absolute -inset-1.5 rounded-3xl opacity-25 blur-2xl transition-all duration-700 pointer-events-none bg-gradient-to-r ${activePortal.accentGradient}`}
            />

            {/* Frosted Glass Login Panel */}
            <div className="relative rounded-3xl border border-slate-700/70 bg-[#0b162c]/80 backdrop-blur-2xl p-6 sm:p-9 shadow-2xl space-y-6">
              {/* Back to Sign In button (Registration Mode) */}
              {isSignUp && (
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(false);
                      setError("");
                    }}
                    className="inline-flex items-center space-x-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-slate-800/60 border border-slate-700/70 px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to Sign In</span>
                  </button>
                </div>
              )}

              {/* Header Title & Subtitle */}
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  {isSignUp ? "Create Student Account" : "Sign In to Nivas"}
                </h2>
                <p className="mt-1.5 text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Welcome back! Choose your portal and continue.
                </p>
              </div>

              {/* Segmented Selector: STUDENT | WARDEN | ADMIN */}
              {!isSignUp && (
                <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-[#070e20] border border-slate-800 shadow-inner">
                  {/* Student Tab */}
                  <button
                    type="button"
                    onClick={() => {
                      setRole("student");
                      setError("");
                    }}
                    className={`flex flex-col items-center justify-center rounded-xl py-2.5 text-xs font-bold uppercase transition-all duration-300 cursor-pointer ${
                      role === "student"
                        ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/35 scale-[1.02]"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                    }`}
                  >
                    <GraduationCap className="h-4 w-4 mb-1" />
                    <span>Student</span>
                  </button>

                  {/* Warden Tab */}
                  <button
                    type="button"
                    onClick={() => {
                      setRole("warden");
                      setError("");
                    }}
                    className={`flex flex-col items-center justify-center rounded-xl py-2.5 text-xs font-bold uppercase transition-all duration-300 cursor-pointer ${
                      role === "warden"
                        ? "bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-lg shadow-emerald-600/35 scale-[1.02]"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                    }`}
                  >
                    <ClipboardList className="h-4 w-4 mb-1" />
                    <span>Warden</span>
                  </button>

                  {/* Admin Tab */}
                  <button
                    type="button"
                    onClick={() => {
                      setRole("admin");
                      setError("");
                    }}
                    className={`flex flex-col items-center justify-center rounded-xl py-2.5 text-xs font-bold uppercase transition-all duration-300 cursor-pointer ${
                      role === "admin"
                        ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/35 scale-[1.02]"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                    }`}
                  >
                    <ShieldCheck className="h-4 w-4 mb-1" />
                    <span>Admin</span>
                  </button>
                </div>
              )}

              {/* Portal Title & Short Description */}
              <div className="p-3.5 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold text-white">{activePortal.title}</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {activePortal.description}
                </p>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="rounded-2xl bg-rose-950/40 border border-rose-800/60 p-3.5 text-xs sm:text-sm text-rose-300 animate-fadeIn flex items-start space-x-2">
                  <span className="text-rose-400 mt-0.5 font-bold">⚠️</span>
                  <div className="flex-1">{error}</div>
                </div>
              )}

              {/* Input Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-3.5">
                  {/* Email Address Input */}
                  <div className="relative group">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                      <Mail className="h-4 w-4 text-slate-400 group-focus-within:text-emerald-400 transition-colors" />
                    </div>
                    <input
                      id="email-address"
                      name="email"
                      type="email"
                      required
                      className="w-full rounded-xl border border-slate-700/80 bg-[#070d1e]/80 py-3.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all duration-200"
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

                  {/* Password Input with Show/Hide Toggle */}
                  <div className="relative group">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                      <Lock className="h-4 w-4 text-slate-400 group-focus-within:text-emerald-400 transition-colors" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      className="w-full rounded-xl border border-slate-700/80 bg-[#070d1e]/80 py-3.5 pl-10 pr-11 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all duration-200"
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

                  {/* Confirm Password (Registration Only) */}
                  {isSignUp && (
                    <div className="relative group">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                        <Lock className="h-4 w-4 text-slate-400 group-focus-within:text-emerald-400 transition-colors" />
                      </div>
                      <input
                        id="confirm-password"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        className="w-full rounded-xl border border-slate-700/80 bg-[#070d1e]/80 py-3.5 pl-10 pr-11 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all duration-200"
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

                {/* Forgot Password Link (Hidden during sign up) */}
                {!isSignUp && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setResetEmail(email);
                        setResetMsg("");
                        setResetError("");
                        setForgotModalOpen(true);
                      }}
                      className="text-xs font-medium text-slate-400 hover:text-emerald-300 transition-colors cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3.5 rounded-xl text-white font-bold text-sm tracking-wide shadow-xl transition-all duration-200 cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r ${activePortal.accentGradient}`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center space-x-2">
                      <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      <span>Authenticating...</span>
                    </span>
                  ) : (
                    activePortal.buttonText
                  )}
                </button>
              </form>

              {/* Student Registration Toggle (Hidden for Warden and Admin) */}
              {(role === "student" || isSignUp) && (
                <div className="text-center pt-1">
                  <button
                    type="button"
                    className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
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

              {/* Developer Database Seed Utilities */}
              <div className="pt-4 border-t border-slate-800/80 flex flex-col items-center space-y-2">
                {seedMsg && (
                  <div className="rounded-xl bg-teal-950/40 border border-teal-800/50 p-2.5 text-xs text-teal-300 w-full text-center">
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

        {/* 3. Forgot Password Modal */}
        {forgotModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-full max-w-md rounded-3xl border border-slate-700 bg-[#091428] p-6 sm:p-8 shadow-2xl text-white space-y-4">
              <button
                onClick={() => setForgotModalOpen(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Reset Password</h3>
                  <p className="text-xs text-slate-400">We will email you a secure reset link.</p>
                </div>
              </div>

              {resetMsg && (
                <div className="rounded-xl bg-emerald-950/40 border border-emerald-800/60 p-3 text-xs text-emerald-300">
                  {resetMsg}
                </div>
              )}
              {resetError && (
                <div className="rounded-xl bg-rose-950/40 border border-rose-800/60 p-3 text-xs text-rose-300">
                  {resetError}
                </div>
              )}

              <form onSubmit={handlePasswordReset} className="space-y-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Account Email
                  </label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="Enter your registered email"
                    className="w-full rounded-xl border border-slate-700 bg-[#070d1e] py-3 px-4 text-sm text-white placeholder-slate-500 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800/50 border border-slate-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 transition-all shadow-lg cursor-pointer disabled:opacity-50"
                  >
                    {resetLoading ? "Sending Link..." : "Send Reset Link"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 4. PWA Installation Wizard Modal */}
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
