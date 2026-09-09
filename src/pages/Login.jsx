import React, { useState, useEffect, useCallback } from "react";
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
import { Mail, Lock, GraduationCap, ClipboardList, ShieldCheck, Wrench, Download, ArrowRight, Eye, EyeOff, Play, Pause, CalendarDays, DoorOpen, FileCheck2, Users, Megaphone } from "lucide-react";
import useMotionPreference from "../hooks/useMotionPreference";
import ResetPasswordDialog from "../components/ResetPasswordDialog";
import InstallWizardModal from "../components/InstallWizardModal";
import SplashScreen3D from "../components/3d/SplashScreen3D";
import InteractiveLoginWorld from "../components/3d/login/InteractiveLoginWorld";

export default function Login() {
  const { motion, toggleMotion } = useMotionPreference();
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
  const [focusField, setFocusField] = useState('idle');

  // Forgot password modal state
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMsg, setResetMsg] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  // 3D Splash Screen State (shown on first visit of the session)
  const [showSplash, setShowSplash] = useState(() => {
    try { return motion && !sessionStorage.getItem("nivas_splash_viewed"); } catch { return false; }
  });

  const handleSplashComplete = useCallback(() => {
    try { sessionStorage.setItem("nivas_splash_viewed", "true"); } catch { /* Session storage is optional. */ }
    setShowSplash(false);
  }, []);

  // PWA Install state
  const [, setCanInstall] = useState(() => !!window.deferredPrompt);
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

  const portals = {
    student: { label: "Student", title: "Welcome home.", sceneTitle: <>Your space.<br /><em>Your people.</em></>, description: "Your room, attendance, and everyday hostel life, together.", number: "01", icon: GraduationCap, features: [[CalendarDays, "Attendance"], [FileCheck2, "Leave requests"], [DoorOpen, "Room life"]] },
    warden: { label: "Warden", title: "Make every day flow.", sceneTitle: <>A helping hand.<br /><em>A happier hostel.</em></>, description: "Attendance, approvals, and student support in one place.", number: "02", icon: ClipboardList, features: [[FileCheck2, "Approvals"], [Users, "Students"], [Megaphone, "Notices"]] },
    admin: { label: "Admin", title: "See the whole picture.", sceneTitle: <>One hostel.<br /><em>Everything connected.</em></>, description: "Manage your people, rooms, and hostel operations.", number: "03", icon: ShieldCheck, features: [[Users, "People"], [DoorOpen, "Rooms"], [Megaphone, "Notices"]] }
  };
  const portal = portals[role];
  const PortalIcon = portal.icon;
  const chooseRole = (next) => {
    if (loading) return;
    setRole(next);
    setIsSignUp(false);
    setError("");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setFocusField('idle');
  };
  const lightCard = (event) => {
    const card = event.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
    card.style.setProperty('--light-x', `${x * 100}%`);
    card.style.setProperty('--light-y', `${y * 100}%`);
    return { card, x, y };
  };
  const handleTilt = (event) => {
    if (!motion || event.pointerType !== 'mouse') return;
    const { card, x, y } = lightCard(event);
    // Keep the typing surface still while a field has focus.
    if (card.contains(document.activeElement) && document.activeElement?.tagName === 'INPUT') return;
    card.style.setProperty('--tilt-x', `${-(y - 0.5) * 7}deg`);
    card.style.setProperty('--tilt-y', `${(x - 0.5) * 7}deg`);
  };
  const resetTilt = (event) => {
    event.currentTarget.style.setProperty('--tilt-x', '0deg');
    event.currentTarget.style.setProperty('--tilt-y', '0deg');
    event.currentTarget.dataset.touch = 'idle';
  };
  const handleCardPress = (event) => {
    if (!motion) return;
    lightCard(event);
    if (event.pointerType !== 'mouse') event.currentTarget.dataset.touch = 'active';
  };
  const handleFormFocus = (event) => {
    resetTilt(event);
    const name = event.target.closest('.nivas-field')?.querySelector('input')?.name;
    setFocusField(name === 'email' ? 'email' : name === 'password' || name === 'confirmPassword' ? 'password' : 'idle');
  };

  return (
    <div className="nivas-login" data-portal={role}>
      {showSplash && <SplashScreen3D onComplete={handleSplashComplete} motion={motion} />}
      <header className="nivas-topbar" inert={showSplash || undefined}>
        <a className="nivas-brand" href="/login" aria-label="Nivas home">
          <img src="/logo.svg" alt="" /><span>nivas<span className="nivas-brand-period">.</span></span>
          <span className="nivas-brand-caption">HOSTEL MANAGEMENT</span>
        </a>
        <div className="nivas-top-actions">
          <button type="button" className="nivas-quiet-button" onClick={toggleMotion} aria-pressed={motion} aria-label={motion ? 'Pause animations' : 'Enable animations'}>
            {motion ? <Pause size={16} /> : <Play size={16} />}<span>Motion {motion ? 'on' : 'off'}</span>
          </button>
          {!isStandaloneMode && <button type="button" className="nivas-install" onClick={() => setWizardOpen(true)}><Download size={16} /><span>Install app</span></button>}
        </div>
      </header>

      <main className="nivas-entry" inert={showSplash || undefined}>
        <div className="nivas-mobile-portals" role="group" aria-label="Choose your login portal">
          {Object.entries(portals).map(([key, value]) => {
            const Icon = value.icon;
            return <button key={key} type="button" aria-pressed={role === key} disabled={loading} onClick={() => chooseRole(key)}><Icon size={17} />{value.label}</button>;
          })}
        </div>
        <section className="nivas-world" aria-label={`${portal.label} portal illustration`}>
          <div className="nivas-world-grid" aria-hidden="true" />
          <div className="nivas-world-heading" key={role}>
            <span className="nivas-eyebrow"><span>{portal.number} /</span> {portal.label.toUpperCase()} PORTAL</span>
            <h1>{portal.sceneTitle}</h1>
          </div>
          <div className="nivas-world-stage">
            {!showSplash && <InteractiveLoginWorld role={role} motion={motion} formState={loading ? 'loading' : focusField} />}
          </div>
          <div className="nivas-world-bottom">
            <div className="nivas-features" key={`features-${role}`}>
              {portal.features.map(([Icon, text]) => <span key={text}><Icon size={16} />{text}</span>)}
            </div>
            <div className="nivas-world-meta"><span>Every stay, sorted.</span><button type="button" onClick={() => setShowSplash(true)}><Play size={13} />Replay intro</button></div>
          </div>
        </section>

        <section className="nivas-form-side" aria-label="Sign in">
          <div className="nivas-form-card" data-field={focusField} data-loading={loading} onPointerMove={handleTilt} onPointerDown={handleCardPress} onPointerUp={resetTilt} onPointerCancel={resetTilt} onPointerLeave={resetTilt} onFocusCapture={handleFormFocus} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocusField('idle'); }}>
            <div className="nivas-portal-switch" role="group" aria-label="Choose your login portal">
              {Object.entries(portals).map(([key, value]) => {
                const Icon = value.icon;
                return <button key={key} type="button" aria-pressed={role === key} disabled={loading} onClick={() => chooseRole(key)}><Icon size={18} /><span>{value.label}</span></button>;
              })}
            </div>
            <div key={`${role}-${isSignUp}`} className="nivas-form-heading">
              <div className="nivas-role-mark"><PortalIcon size={25} /></div>
              <p className="nivas-form-kicker">{isSignUp ? 'JOIN YOUR HOSTEL' : `${portal.label.toUpperCase()} SIGN IN`}</p>
              <h2>{isSignUp ? 'Your next chapter.' : portal.title}</h2>
              <p>{isSignUp ? 'Create your student account to get started.' : portal.description}</p>
            </div>
            {error && <div className="nivas-error" role="alert">{error}</div>}
            <form onSubmit={handleSubmit} className="nivas-login-form" aria-busy={loading}>
              <label htmlFor="email-address">Email address</label>
              <div className="nivas-field"><Mail size={18} /><input id="email-address" name="email" type="email" autoComplete="username" required placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} disabled={loading} /></div>
              <div className="nivas-label-row"><label htmlFor="password">Password</label>
                {!isSignUp && <button type="button" onClick={() => { setResetEmail(email); setResetMsg(''); setResetError(''); setForgotModalOpen(true); }}>Forgot password?</button>}
              </div>
              <div className="nivas-field"><Lock size={18} /><input id="password" name="password" type={showPassword ? 'text' : 'password'} required autoComplete={isSignUp ? 'new-password' : 'current-password'} placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} disabled={loading} /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
              {isSignUp && <><label htmlFor="confirm-password">Confirm password</label><div className="nivas-field"><Lock size={18} /><input id="confirm-password" name="confirmPassword" autoComplete="new-password" type={showConfirmPassword ? 'text' : 'password'} required placeholder="Enter it once more" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} disabled={loading} /><button type="button" aria-label={showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'} onClick={() => setShowConfirmPassword(!showConfirmPassword)}>{showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></>}
              <button type="submit" className="nivas-submit" disabled={loading}>{loading ? <><span className="nivas-spinner" />{isSignUp ? 'Creating your account…' : 'Signing you in…'}</> : <><span>{isSignUp ? 'Create student account' : `Sign in as ${portal.label.toLowerCase()}`}</span><ArrowRight size={19} /></>}</button>
            </form>
            {role === 'student' ? <p className="nivas-register">{isSignUp ? 'Already part of Nivas?' : 'New to your hostel?'} <button type="button" disabled={loading} onClick={() => { setIsSignUp(!isSignUp); setError(''); }}>{isSignUp ? 'Sign in' : 'Create an account'}</button></p> : <p className="nivas-register">Use the account provided by your administrator.</p>}
            <div className="nivas-form-footer"><Lock size={14} /><span>Your hostel. Your own space.</span></div>
          </div>
        </section>
      </main>
      <footer className="nivas-page-footer"><span>NIVAS / HOSTEL MANAGEMENT</span><span>Student · Warden · Admin</span></footer>
      {import.meta.env.DEV && <details className="nivas-dev-tools"><summary>Development tools</summary><button type="button" disabled={seedLoading} onClick={handleSeedDatabase}><Wrench size={14} />{seedLoading ? 'Preparing…' : 'Seed default database'}</button>{localStorage.getItem('firebase_config') && <button type="button" onClick={clearFirebaseConfig}>Reset connection</button>}{seedMsg && <p role="status">{seedMsg}</p>}</details>}
      <ResetPasswordDialog open={forgotModalOpen} onClose={() => setForgotModalOpen(false)} email={resetEmail} setEmail={setResetEmail} onSubmit={handlePasswordReset} loading={resetLoading} message={resetMsg} error={resetError} />
      <InstallWizardModal isOpen={wizardOpen} onClose={() => setWizardOpen(false)} onInstalled={() => { setCanInstall(false); setWizardOpen(false); }} />
    </div>
  );
}
