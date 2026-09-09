import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  ArrowRight,
  ArrowLeft,
  Smartphone,
  Monitor,
  CheckCircle2,
  Share2,
  PlusSquare,
  Zap,
  CloudOff,
  Download,
  Sparkles,
  Info
} from "lucide-react";

export default function InstallWizardModal({ isOpen, onClose, onInstalled }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [platform, setPlatform] = useState("chrome"); // "chrome" | "ios" | "desktop"
  const [deferredPrompt, setDeferredPrompt] = useState(() => window.deferredPrompt || null);
  const [installState, setInstallState] = useState("idle"); // "idle" | "installing" | "success" | "failed"

  // Keep callback refs fresh so setTimeout/event handlers never go stale
  const onCloseRef = useRef(onClose);
  const onInstalledRef = useRef(onInstalled);
  const successHandled = useRef(false); // prevent double-fire

  useEffect(() => {
    onCloseRef.current = onClose;
    onInstalledRef.current = onInstalled;
  });

  // Central success handler — safe against stale closures
  const handleInstallSuccess = useCallback(() => {
    if (successHandled.current) return;
    successHandled.current = true;

    setInstallState("success");
    setCurrentStep(3);
    localStorage.setItem("pwa_installed", "true");
    window.dispatchEvent(new Event("storage"));
    window.deferredPrompt = null;

    onInstalledRef.current?.();

    // Auto-close after 2.5 s
    setTimeout(() => {
      onCloseRef.current?.();
    }, 2500);
  }, []);

  useEffect(() => {
    // Reset success guard each time the modal opens fresh
    if (isOpen) {
      successHandled.current = false;
      setCurrentStep(1);
      setInstallState("idle");
      // Pick up any already-captured prompt
      if (window.deferredPrompt) setDeferredPrompt(window.deferredPrompt);
    }
  }, [isOpen]);

  useEffect(() => {
    // Detect platform
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);

    if (isIOS) setPlatform("ios");
    else if (!isMobile) setPlatform("desktop");
    else setPlatform("chrome");

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      window.deferredPrompt = e;
      setDeferredPrompt(e);
    };

    // Listen for the native appinstalled event
    const handleAppInstalled = () => {
      handleInstallSuccess();
    };

    // Also listen for our custom pwa:installable event from main.jsx
    const handleInstallable = () => {
      if (window.deferredPrompt) setDeferredPrompt(window.deferredPrompt);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("pwa:installable", handleInstallable);
    window.addEventListener("pwa:installed", handleInstallSuccess);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("pwa:installable", handleInstallable);
      window.removeEventListener("pwa:installed", handleInstallSuccess);
    };
  }, [handleInstallSuccess]);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert(
        "Automatic install is not available right now.\n\n" +
        "Possible reasons:\n" +
        "• Already installed on this device\n" +
        "• Browser doesn't support PWA install\n" +
        "• You previously dismissed the prompt (wait 24h)\n\n" +
        "Try the manual steps below or use Chrome on Android/Desktop."
      );
      return;
    }

    setInstallState("installing");
    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);

    if (outcome === "accepted") {
      // handleInstallSuccess will be called by the appinstalled event.
      // Trigger it manually as a fallback for browsers that don't fire appinstalled.
      handleInstallSuccess();
    } else {
      setInstallState("failed");
      setTimeout(() => setInstallState("idle"), 2500);
    }
  };

  const steps = [
    { id: 1, name: "Benefits" },
    { id: 2, name: "Setup Guide" },
    { id: 3, name: "Ready!" }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-150 dark:border-slate-800 overflow-hidden z-10 transition-all duration-300 animate-fadeIn flex flex-col max-h-[90vh]">

        {/* Header Gradient */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-6 py-5 text-white flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-md shadow-inner text-white">
              <Download className="h-5 w-5 text-white animate-bounce" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg tracking-tight">Nivas Downloader</h3>
              <p className="text-xs text-indigo-100">Install web app for a native experience</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/15 hover:bg-white/25 transition-all text-white outline-none focus:ring-2 focus:ring-white/30"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="flex bg-indigo-50 dark:bg-slate-800 h-1.5 w-full">
          <div
            className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-full transition-all duration-300"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
        </div>

        {/* Body Content */}
        <div className="flex-grow p-6 overflow-y-auto">

          {/* STEP 1: BENEFITS */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-fadeIn">
              <div className="text-center space-y-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-indigo-50 to-purple-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60 shadow-xs">
                  <Sparkles className="h-3.5 w-3.5 mr-1 text-indigo-500" /> Premium Feature
                </span>
                <h4 className="text-xl font-extrabold text-slate-800 dark:text-white">Download Nivas App</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Convert this website into a lightning-fast standalone app on your home screen.
                </p>
              </div>

              {/* Grid of benefits */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                <div className="flex items-start space-x-3 p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/80 dark:border-amber-800/50 hover:border-amber-400 hover:shadow-md hover:shadow-amber-500/10 transition-all">
                  <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-slate-800 dark:text-slate-200">Instant Access</h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Launch directly from your home screen dock or app list.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3.5 rounded-2xl bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent border border-blue-200/80 dark:border-blue-800/50 hover:border-blue-400 hover:shadow-md hover:shadow-blue-500/10 transition-all">
                  <div className="p-2 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 shrink-0">
                    <CloudOff className="h-5 w-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-slate-800 dark:text-slate-200">Offline Standby</h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Review cached logs, profiles, and pages even without internet.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3.5 rounded-2xl bg-gradient-to-br from-rose-500/10 via-pink-500/5 to-transparent border border-rose-200/80 dark:border-rose-800/50 hover:border-rose-400 hover:shadow-md hover:shadow-rose-500/10 transition-all">
                  <div className="p-2 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 shrink-0">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-slate-800 dark:text-slate-200">Immersive Screen</h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Hides browser URL bars for a beautiful native layout.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-200/80 dark:border-emerald-800/50 hover:border-emerald-400 hover:shadow-md hover:shadow-emerald-500/10 transition-all">
                  <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-slate-800 dark:text-slate-200">Zero MB Cost</h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Saves device storage! Takes less than 1MB to download.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: INSTALLATION GUIDES */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-fadeIn">
              {/* Platform Selector Tabs */}
              <div className="flex border border-slate-200 dark:border-slate-800 rounded-2xl p-1 bg-slate-50 dark:bg-slate-950/60">
                <button
                  onClick={() => setPlatform("chrome")}
                  className={`flex-1 flex items-center justify-center py-2.5 text-xs font-bold rounded-xl transition-all ${
                    platform === "chrome"
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Smartphone className="h-3.5 w-3.5 mr-1.5" />
                  Chrome/Android
                </button>
                <button
                  onClick={() => setPlatform("ios")}
                  className={`flex-1 flex items-center justify-center py-2.5 text-xs font-bold rounded-xl transition-all ${
                    platform === "ios"
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Share2 className="h-3.5 w-3.5 mr-1.5" />
                  Safari (iOS)
                </button>
                <button
                  onClick={() => setPlatform("desktop")}
                  className={`flex-1 flex items-center justify-center py-2.5 text-xs font-bold rounded-xl transition-all ${
                    platform === "desktop"
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Monitor className="h-3.5 w-3.5 mr-1.5" />
                  Desktop/Other
                </button>
              </div>

              {/* CHROME/ANDROID INSTRUCTIONS */}
              {platform === "chrome" && (
                <div className="space-y-4 pt-1">
                  {deferredPrompt ? (
                    <div className="bg-gradient-to-br from-indigo-50 via-purple-50/50 to-pink-50/30 dark:bg-slate-800/60 border border-indigo-200/80 dark:border-slate-700 rounded-2xl p-5 text-center space-y-4 shadow-sm">
                      <div className="mx-auto bg-gradient-to-tr from-indigo-600 to-purple-600 text-white p-4 rounded-2xl w-fit shadow-lg shadow-indigo-500/25">
                        <Download className="h-6 w-6 animate-pulse" />
                      </div>
                      <div>
                        <h5 className="font-extrabold text-slate-800 dark:text-white text-base">Direct Install Available!</h5>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Click the button below to download and install Nivas on your device instantly.
                        </p>
                      </div>
                      <button
                        onClick={handleInstallClick}
                        disabled={installState === "installing"}
                        className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-95 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-indigo-500/25 active:scale-95 disabled:opacity-50"
                      >
                        {installState === "installing" ? "Installing App…" : "Install Nivas Now"}
                      </button>
                      {installState === "failed" && (
                        <p className="text-xs text-rose-500">You cancelled the install. Try again anytime.</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl p-3 flex items-start space-x-2.5 text-xs text-amber-800 dark:text-amber-200">
                        <Info className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <strong>Manual Mode:</strong> Your browser has either already installed the app, or the install prompt is not ready yet. Try refreshing the page, or follow these steps:
                        </div>
                      </div>

                      <div className="space-y-3.5 pt-2">
                        <div className="flex items-center space-x-4">
                          <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-xs">1</div>
                          <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">Tap the browser's menu (three dots icon in top-right or bottom-right corner).</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-xs">2</div>
                          <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong> from the list.</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-xs">3</div>
                          <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">Confirm the install when prompted. That's it!</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* IOS SAFARI INSTRUCTIONS */}
              {platform === "ios" && (
                <div className="space-y-5 pt-1">
                  <div className="bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800/60 rounded-xl p-3.5 flex items-start space-x-3 text-xs text-indigo-900 dark:text-indigo-200">
                    <Info className="h-4 w-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                    <div>
                      Apple iOS does not support direct click-to-install. Please open this page in <strong>Safari browser</strong> and follow these steps:
                    </div>
                  </div>

                  <div className="space-y-4 pt-1">
                    <div className="flex items-center space-x-4 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-150 dark:border-slate-800">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-xs">1</div>
                      <div className="flex-grow">
                        <p className="text-sm text-slate-700 dark:text-slate-200 font-medium">Tap the <strong>Share</strong> button at the bottom of Safari.</p>
                      </div>
                      <div className="bg-indigo-50 dark:bg-slate-700 p-2 rounded-xl shadow-xs border border-indigo-100 dark:border-slate-600 text-indigo-600 dark:text-indigo-400">
                        <Share2 className="h-5 w-5" />
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-150 dark:border-slate-800">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-xs">2</div>
                      <div className="flex-grow">
                        <p className="text-sm text-slate-700 dark:text-slate-200 font-medium">Scroll down the menu and choose <strong>"Add to Home Screen"</strong>.</p>
                      </div>
                      <div className="bg-indigo-50 dark:bg-slate-700 p-2 rounded-xl shadow-xs border border-indigo-100 dark:border-slate-600 text-indigo-600 dark:text-indigo-400">
                        <PlusSquare className="h-5 w-5" />
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-150 dark:border-slate-800">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-xs">3</div>
                      <div className="flex-grow">
                        <p className="text-sm text-slate-700 dark:text-slate-200 font-medium">Tap <strong>"Add"</strong> in the top-right corner to complete installation.</p>
                      </div>
                      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm">
                        Add
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* DESKTOP/OTHER INSTRUCTIONS */}
              {platform === "desktop" && (
                <div className="space-y-4 pt-1">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    To install Nivas on your desktop computer, follow these simple steps depending on your browser:
                  </p>

                  <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-150 dark:border-slate-800">
                    <div>
                      <h6 className="font-bold text-xs text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">Chrome & Edge</h6>
                      <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                        Look at the right side of your browser URL/search bar. Click the <strong>Install</strong> icon (looks like a desktop screen with a down arrow, or a plus sign) and click Install.
                      </p>
                    </div>

                    <hr className="border-slate-200 dark:border-slate-700" />

                    <div>
                      <h6 className="font-bold text-xs text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">Firefox</h6>
                      <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                        Click the three horizontal lines in the top right, and select <strong>"More Tools"</strong> followed by <strong>"Install Website as App"</strong> (if supported by your OS).
                      </p>
                    </div>

                    <hr className="border-slate-200 dark:border-slate-700" />

                    <div>
                      <h6 className="font-bold text-xs text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">macOS Safari</h6>
                      <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                        Click <strong>File</strong> in the top macOS menu bar, and choose <strong>"Add to Dock…"</strong> to place Nivas directly into your desktop launcher bar.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: READY / SUCCESS */}
          {currentStep === 3 && (
            <div className="text-center py-6 space-y-5 animate-fadeIn">
              <div className="mx-auto bg-gradient-to-tr from-emerald-500 to-teal-600 text-white p-4 rounded-3xl w-fit shadow-lg shadow-emerald-500/25">
                <CheckCircle2 className="h-10 w-10 animate-pulse" />
              </div>
              <div className="space-y-2">
                <h4 className="text-xl font-extrabold text-slate-800 dark:text-white">You're All Set!</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Nivas has been successfully installed. Look for the Nivas icon on your home screen, dock, or apps dashboard.
                </p>
              </div>

              <div className="inline-flex items-center space-x-2 text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 py-2 px-3 rounded-full border border-emerald-200 dark:border-emerald-800/60 font-bold">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>This window will close automatically…</span>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50/80 dark:bg-slate-950/60 px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            {currentStep > 1 && currentStep < 3 ? (
              <button
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-all py-2 px-3 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-xl"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
            ) : (
              <span className="text-xs text-slate-400">Step {currentStep} of {steps.length}</span>
            )}
          </div>

          <div>
            {currentStep < steps.length ? (
              <button
                onClick={() => setCurrentStep(prev => prev + 1)}
                className="flex items-center space-x-1.5 py-2.5 px-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-indigo-500/20"
              >
                <span>Continue</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => {
                  localStorage.setItem("pwa_installed", "true");
                  window.dispatchEvent(new Event("storage"));
                  onClose();
                }}
                className="py-2.5 px-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-indigo-500/20"
              >
                Close Now
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
