import React, { useState, useEffect } from "react";
import { 
  X, 
  ArrowRight, 
  ArrowLeft, 
  Smartphone, 
  Monitor, 
  CheckCircle2, 
  Share2, 
  PlusSquare, 
  HelpCircle, 
  Zap, 
  CloudOff, 
  Download, 
  Sparkles,
  Info
} from "lucide-react";

export default function InstallWizardModal({ isOpen, onClose }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [platform, setPlatform] = useState("chrome"); // "chrome" | "ios" | "desktop"
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installState, setInstallState] = useState("idle"); // "idle" | "installing" | "success" | "failed"

  useEffect(() => {
    // Detect platform on mount
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);

    if (isIOS) {
      setPlatform("ios");
    } else if (!isMobile) {
      setPlatform("desktop");
    } else {
      setPlatform("chrome"); // default to chrome/android
    }

    // Capture standard install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      window.deferredPrompt = e; // share globally as fallback
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    
    // Check if it was already saved on window
    if (window.deferredPrompt) {
      setDeferredPrompt(window.deferredPrompt);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert("Installation shortcut not supported by your browser or already installed. Please check browser settings.");
      return;
    }
    
    setInstallState("installing");
    deferredPrompt.prompt();
    
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setInstallState("success");
      localStorage.setItem('pwa_installed', 'true');
      window.dispatchEvent(new Event("storage"));
      setDeferredPrompt(null);
      window.deferredPrompt = null;
      setCurrentStep(3); // skip to completion
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
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-10 transition-all duration-300 animate-fadeIn flex flex-col max-h-[90vh]">
        
        {/* Header Gradient */}
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-800 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white/10 p-2 rounded-xl backdrop-blur-md">
              <Download className="h-5 w-5 text-indigo-200 animate-bounce" />
            </div>
            <div>
              <h3 className="font-bold text-lg tracking-tight">Nivas Downloader</h3>
              <p className="text-xs text-indigo-200">Install web app for a native experience</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-all text-white outline-none focus:ring-2 focus:ring-white/30"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="flex bg-slate-100 h-1.5 w-full">
          <div 
            className="bg-indigo-600 h-full transition-all duration-300" 
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
        </div>

        {/* Body Content */}
        <div className="flex-grow p-6 overflow-y-auto">
          
          {/* STEP 1: BENEFITS */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-fadeIn">
              <div className="text-center space-y-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
                  <Sparkles className="h-3.5 w-3.5 mr-1" /> Premium Feature
                </span>
                <h4 className="text-xl font-bold text-slate-800">Download Nivas App</h4>
                <p className="text-sm text-slate-500">
                  Convert this website into a lightning-fast standalone app on your home screen.
                </p>
              </div>

              {/* Grid of benefits */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                <div className="flex items-start space-x-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/20 transition-all">
                  <Zap className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-semibold text-sm text-slate-800">Instant Access</h5>
                    <p className="text-xs text-slate-500 mt-0.5">Launch directly from your home screen dock or app list.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/20 transition-all">
                  <CloudOff className="h-5 w-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-semibold text-sm text-slate-800">Offline Standby</h5>
                    <p className="text-xs text-slate-500 mt-0.5">Review cached logs, profiles, and pages even without internet.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/20 transition-all">
                  <Smartphone className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-semibold text-sm text-slate-800">Immersive Screen</h5>
                    <p className="text-xs text-slate-500 mt-0.5">Hides browser URL bars for a beautiful native layout.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/20 transition-all">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-semibold text-sm text-slate-800">Zero MB Cost</h5>
                    <p className="text-xs text-slate-500 mt-0.5">Saves device storage! Takes less than 1MB to download.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: INSTALLATION GUIDES */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-fadeIn">
              {/* Platform Selector Tabs */}
              <div className="flex border border-slate-200 rounded-xl p-1 bg-slate-50">
                <button
                  onClick={() => setPlatform("chrome")}
                  className={`flex-1 flex items-center justify-center py-2 text-xs font-bold rounded-lg transition-all ${
                    platform === "chrome"
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Smartphone className="h-3.5 w-3.5 mr-1.5" />
                  Chrome/Android
                </button>
                <button
                  onClick={() => setPlatform("ios")}
                  className={`flex-1 flex items-center justify-center py-2 text-xs font-bold rounded-lg transition-all ${
                    platform === "ios"
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Share2 className="h-3.5 w-3.5 mr-1.5" />
                  Safari (iOS)
                </button>
                <button
                  onClick={() => setPlatform("desktop")}
                  className={`flex-1 flex items-center justify-center py-2 text-xs font-bold rounded-lg transition-all ${
                    platform === "desktop"
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                      : "text-slate-500 hover:text-slate-800"
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
                    <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 text-center space-y-4">
                      <div className="mx-auto bg-indigo-600 text-white p-3.5 rounded-full w-fit">
                        <Download className="h-6 w-6 animate-pulse" />
                      </div>
                      <div>
                        <h5 className="font-bold text-slate-800 text-base">Direct Install Available!</h5>
                        <p className="text-xs text-slate-500 mt-1">
                          Click the button below to download and install Nivas on your device instantly.
                        </p>
                      </div>
                      <button
                        onClick={handleInstallClick}
                        disabled={installState === "installing"}
                        className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-indigo-600/20 active:scale-95 disabled:opacity-50"
                      >
                        {installState === "installing" ? "Installing App..." : "Install Nivas Now"}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start space-x-2.5 text-xs text-amber-800">
                        <Info className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <strong>Manual Mode:</strong> Your browser has either already installed the application, or does not support automatic prompts. Follow these quick steps to download manually:
                        </div>
                      </div>

                      <div className="space-y-3.5 pt-2">
                        <div className="flex items-center space-x-4">
                          <div className="h-7 w-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs flex-shrink-0">1</div>
                          <span className="text-sm text-slate-600 font-medium">Tap the browser's menu (three dots icon in top-right or bottom-right corner).</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="h-7 w-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs flex-shrink-0">2</div>
                          <span className="text-sm text-slate-600 font-medium">Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong> from the list.</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="h-7 w-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs flex-shrink-0">3</div>
                          <span className="text-sm text-slate-600 font-medium">Confirm the install when prompted. That's it!</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* IOS SAFARI INSTRUCTIONS */}
              {platform === "ios" && (
                <div className="space-y-5 pt-1">
                  <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3.5 flex items-start space-x-3 text-xs text-indigo-850">
                    <Info className="h-4.5 w-4.5 text-indigo-500 flex-shrink-0 mt-0.5" />
                    <div>
                      Apple iOS does not support direct click-to-install. Please open this page in <strong>Safari browser</strong> and follow these steps:
                    </div>
                  </div>

                  <div className="space-y-4 pt-1">
                    <div className="flex items-center space-x-4 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs flex-shrink-0">1</div>
                      <div className="flex-grow">
                        <p className="text-sm text-slate-700 font-medium">Tap the <strong>Share</strong> button at the bottom of Safari.</p>
                      </div>
                      <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200 text-indigo-600">
                        <Share2 className="h-5 w-5" />
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs flex-shrink-0">2</div>
                      <div className="flex-grow">
                        <p className="text-sm text-slate-700 font-medium">Scroll down the menu and choose <strong>"Add to Home Screen"</strong>.</p>
                      </div>
                      <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200 text-indigo-600">
                        <PlusSquare className="h-5 w-5" />
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs flex-shrink-0">3</div>
                      <div className="flex-grow">
                        <p className="text-sm text-slate-700 font-medium">Tap <strong>"Add"</strong> in the top-right corner to complete installation.</p>
                      </div>
                      <div className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">
                        Add
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* DESKTOP/OTHER INSTRUCTIONS */}
              {platform === "desktop" && (
                <div className="space-y-4 pt-1">
                  <p className="text-sm text-slate-500">
                    To install Nivas on your desktop computer, follow these simple steps depending on your browser:
                  </p>

                  <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div>
                      <h6 className="font-bold text-xs text-indigo-600 uppercase tracking-wide">Chrome & Edge</h6>
                      <p className="text-sm text-slate-700 mt-1">
                        Look at the right side of your browser URL/search bar. Click the <strong>Install</strong> icon (looks like a desktop screen with a down arrow, or a plus sign) and click Install.
                      </p>
                    </div>

                    <hr className="border-slate-200" />

                    <div>
                      <h6 className="font-bold text-xs text-indigo-600 uppercase tracking-wide">Firefox</h6>
                      <p className="text-sm text-slate-700 mt-1">
                        Click the three horizontal lines in the top right, and select <strong>"More Tools"</strong> followed by <strong>"Install Website as App"</strong> (if supported by your OS).
                      </p>
                    </div>

                    <hr className="border-slate-200" />

                    <div>
                      <h6 className="font-bold text-xs text-indigo-600 uppercase tracking-wide">macOS Safari</h6>
                      <p className="text-sm text-slate-700 mt-1">
                        Click <strong>File</strong> in the top macOS menu bar, and choose <strong>"Add to Dock..."</strong> to place Nivas directly into your desktop launcher bar.
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
              <div className="mx-auto bg-green-50 border border-green-200 text-green-600 p-4 rounded-full w-fit">
                <CheckCircle2 className="h-10 w-10 animate-pulse" />
              </div>
              <div className="space-y-2">
                <h4 className="text-xl font-bold text-slate-800">You're All Set!</h4>
                <p className="text-sm text-slate-500 max-w-sm mx-auto">
                  Nivas has been queued for download or successfully installed. Look for the Nivas logo on your device home screen, dock, or apps dashboard.
                </p>
              </div>
              
              <div className="inline-flex items-center space-x-2 text-xs bg-slate-50 text-slate-500 py-2 px-3 rounded-full border border-slate-100">
                <HelpCircle className="h-4 w-4 text-slate-400" />
                <span>Need help? Open this wizard anytime from the sidebar settings!</span>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            {currentStep > 1 ? (
              <button
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-all py-2 px-3 hover:bg-slate-200/50 rounded-xl"
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
                className="flex items-center space-x-1.5 py-2 px-4.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-indigo-600/10"
              >
                <span>Continue</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => {
                  localStorage.setItem('pwa_installed', 'true');
                  window.dispatchEvent(new Event("storage"));
                  onClose();
                }}
                className="py-2 px-5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all"
              >
                Close Wizard
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
