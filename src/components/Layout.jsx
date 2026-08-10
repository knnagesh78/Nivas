import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  Calendar,
  FileText,
  AlertCircle,
  Megaphone,
  User,
  LogOut,
  Menu,
  X,
  DoorOpen,
  Users,
  Settings,
  ShieldCheck,
  ClipboardList,
  Download,
  GraduationCap,
  Package,
  Search,
  PackageCheck,
  ArrowLeft,
  ArrowUp,
  Sparkles,
  Heart,
  MapPin,
  Sun,
  Moon
} from "lucide-react";
import InstallWizardModal from "./InstallWizardModal";
import NotificationCenter from "./NotificationCenter";

export default function Layout({ children, activeTab, setActiveTab, onSelectNotification }) {
  const { userData, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);

  // True when the browser has a deferred install prompt ready
  const [canInstall, setCanInstall] = useState(() => !!window.deferredPrompt);

  // True only when running as installed standalone PWA
  const isStandaloneMode =
    window.matchMedia('(display-mode: standalone)').matches ||
    !!window.navigator.standalone;

  // Theme state: "light" (white) or "dark" (black)
  const [theme, setTheme] = useState(() => localStorage.getItem("app_theme") || "light");

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  useEffect(() => {
    localStorage.setItem("app_theme", theme);
  }, [theme]);

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

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  // Define navigation items based on role
  const getNavItems = () => {
    const role = userData?.role;
    if (role === "student") {
      return [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        { id: "lostFound", label: "Lost & Found", icon: Package },
        { id: "attendance", label: "My Attendance", icon: Calendar },
        { id: "leave", label: "Leave Requests", icon: FileText },
        { id: "complaints", label: "Complaints", icon: AlertCircle },
        { id: "profile", label: "Profile", icon: User },
      ];
    } else if (role === "warden") {
      return [
        { id: "dashboard", label: "Overview", icon: LayoutDashboard },
        { id: "handovers", label: "Lost & Found Handovers", icon: PackageCheck },
        { id: "students", label: "Students", icon: Users },
        { id: "attendance", label: "Attendance Log", icon: ClipboardList },
        { id: "leave", label: "Leave Approvals", icon: FileText },
        { id: "complaints", label: "Complaints Box", icon: AlertCircle },
        { id: "rooms", label: "Rooms & Beds", icon: DoorOpen },
        { id: "notices", label: "Notice Board", icon: Megaphone },
        { id: "settings", label: "Settings", icon: Settings },
      ];
    } else if (role === "admin") {
      return [
        { id: "dashboard", label: "Control Panel", icon: LayoutDashboard },
        { id: "students", label: "Student Manager", icon: GraduationCap },
        { id: "wardens", label: "Warden Manager", icon: Users },
        { id: "rooms", label: "Room Config", icon: DoorOpen },
        { id: "notices", label: "Hostel Notices", icon: Megaphone },
        { id: "settings", label: "Admin Settings", icon: Settings },
      ];
    }
    return [];
  };

  const navItems = getNavItems();

  // Mobile Bottom Tab Items (YouTube style navigation)
  const getMobileNavItems = () => {
    const role = userData?.role;
    if (role === "student") {
      return [
        { id: "dashboard", label: "Home", icon: LayoutDashboard },
        { id: "leave", label: "Leave", icon: FileText },
        { id: "lostFound", label: "Notice", icon: Megaphone, isCenter: true },
        { id: "complaints", label: "Complaint", icon: AlertCircle },
        { id: "profile", label: "You", icon: User, isProfile: true },
      ];
    } else if (role === "warden") {
      return [
        { id: "dashboard", label: "Home", icon: LayoutDashboard },
        { id: "leave", label: "Leave", icon: FileText },
        { id: "notices", label: "Notice", icon: Megaphone, isCenter: true },
        { id: "complaints", label: "Complaint", icon: AlertCircle },
        { id: "settings", label: "You", icon: Settings, isProfile: true },
      ];
    } else if (role === "admin") {
      return [
        { id: "dashboard", label: "Home", icon: LayoutDashboard },
        { id: "students", label: "Students", icon: GraduationCap },
        { id: "notices", label: "Notice", icon: Megaphone, isCenter: true },
        { id: "wardens", label: "Wardens", icon: Users },
        { id: "settings", label: "You", icon: Settings, isProfile: true },
      ];
    }
    return [];
  };

  const mobileNavItems = getMobileNavItems();

  const getRoleBadge = (role) => {
    switch (role) {
      case "admin":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "warden":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
    }
  };

  return (
    <div className={`flex h-screen overflow-hidden font-sans transition-colors duration-300 ${
      theme === "dark" ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
    }`}>
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex md:w-64 md:flex-col border-r transition-colors duration-300 ${
        theme === "dark" ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
      }`}>
        <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
          {/* Brand header */}
          <div className="flex items-center justify-between px-6 mb-6">
            <div className="flex items-center">
              <img src="/logo.svg" className="h-9 w-9 rounded-xl shadow-sm animate-pulse" alt="Nivas Logo" />
              <div className="ml-3">
                <h1 className={`text-lg font-bold tracking-tight leading-none ${
                  theme === "dark" ? "text-white" : "text-slate-900"
                }`}>Nivas</h1>
                <span className="text-[10px] text-indigo-500 font-semibold uppercase tracking-wider">Every stay, sorted</span>
              </div>
            </div>
            {/* Theme Toggle Button (White / Black theme) */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl border transition-all cursor-pointer shadow-xs ${
                theme === "dark"
                  ? "bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700"
                  : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
              }`}
              title={theme === "dark" ? "Switch to White Theme" : "Switch to Black Theme"}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>

          {/* User profile brief */}
          <div className="px-4 mb-4">
            <div className={`border rounded-xl p-3.5 flex items-center justify-between ${
              theme === "dark" ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-100"
            }`}>
              <div className="flex items-center space-x-3 overflow-hidden">
                <div className={`h-10 w-10 rounded-full border flex items-center justify-center font-bold flex-shrink-0 ${
                  theme === "dark" ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-200 border-slate-300 text-slate-700"
                }`}>
                  {userData?.email ? userData.email[0].toUpperCase() : "U"}
                </div>
                <div className="overflow-hidden">
                  <p className={`text-sm font-semibold truncate ${
                    theme === "dark" ? "text-slate-200" : "text-slate-800"
                  }`}>
                    {userData?.email?.split("@")[0]}
                  </p>
                  <span className={`inline-block px-2 py-0.5 mt-1 text-[10px] font-bold tracking-wide uppercase border rounded-full ${getRoleBadge(userData?.role)}`}>
                    {userData?.role}
                  </span>
                </div>
              </div>
              <NotificationCenter onSelectNotification={onSelectNotification} />
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`group flex items-center w-full px-3.5 py-3 text-sm font-bold rounded-2xl transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-600 via-indigo-700 to-slate-900 text-white shadow-lg shadow-indigo-500/25 scale-[1.02]"
                      : theme === "dark"
                      ? "text-slate-400 hover:bg-slate-800 hover:text-white"
                      : "text-slate-600 hover:bg-indigo-50/70 hover:text-indigo-600 hover:translate-x-1 hover:shadow-xs"
                  }`}
                >
                  <Icon
                    className={`mr-3 h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? "text-white animate-pulse" : theme === "dark" ? "text-slate-400 group-hover:text-white" : "text-slate-400 group-hover:text-indigo-600"
                    }`}
                  />
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="ml-auto h-2 w-2 rounded-full bg-white animate-ping"></span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Sign-out & Download */}
        <div className={`p-4 border-t space-y-2 ${theme === "dark" ? "border-slate-800" : "border-slate-100"}`}>
          {canInstall && !isStandaloneMode && (
            <button
              onClick={() => setWizardOpen(true)}
              className="flex items-center w-full px-3.5 py-2.5 text-xs font-bold text-indigo-600 bg-indigo-50/80 hover:bg-indigo-600 hover:text-white rounded-xl transition-all duration-200 border border-indigo-200/80 hover:border-indigo-600 cursor-pointer shadow-sm hover:shadow-md hover:shadow-indigo-500/20 hover:-translate-y-0.5 active:scale-95 group"
            >
              <Download className="mr-2.5 h-4 w-4 text-indigo-500 group-hover:text-white animate-bounce" />
              Download App
            </button>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-3.5 py-2.5 text-xs font-bold text-rose-600 hover:text-white hover:bg-rose-600 rounded-xl transition-all duration-200 border border-rose-100 hover:border-rose-600 cursor-pointer shadow-2xs hover:shadow-md hover:shadow-rose-500/20 hover:-translate-y-0.5 active:scale-95 group"
          >
            <LogOut className="mr-2.5 h-4 w-4 text-rose-500 group-hover:text-white transition-colors" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Top Header & Navigation */}
      <div className="flex flex-col flex-1 w-full md:w-auto overflow-hidden">
        <header className={`flex items-center justify-between px-4 py-3 border-b md:hidden ${
          theme === "dark" ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200"
        }`}>
          <div className="flex items-center">
            <img src="/logo.svg" className="h-8 w-8 rounded-lg shadow-sm" alt="Nivas Logo" />
            <span className={`ml-2.5 font-bold text-base font-sans tracking-tight ${
              theme === "dark" ? "text-white" : "text-slate-800"
            }`}>Nivas</span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Theme Toggle Button Mobile */}
            <button
              onClick={toggleTheme}
              className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                theme === "dark"
                  ? "bg-slate-800 border-slate-700 text-amber-400"
                  : "bg-slate-100 border-slate-200 text-slate-700"
              }`}
              title={theme === "dark" ? "Switch to White Theme" : "Switch to Black Theme"}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <NotificationCenter onSelectNotification={onSelectNotification} />
            <span className={`inline-block px-2.5 py-0.5 text-[9px] font-bold tracking-wide uppercase border rounded-full ${getRoleBadge(userData?.role)}`}>
              {userData?.role}
            </span>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-1 rounded-lg focus:outline-none ${
                theme === "dark" ? "text-slate-300 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 bg-slate-900 bg-opacity-50 md:hidden" onClick={() => setMobileMenuOpen(false)}>
            <nav
              className={`fixed top-14 left-0 right-0 border-b shadow-xl px-4 py-3 space-y-1 ${
                theme === "dark" ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center w-full px-3 py-2 text-sm font-semibold rounded-lg ${
                      isActive ? "bg-slate-900 text-white" : theme === "dark" ? "text-slate-300 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="mr-3 h-5 w-5 text-slate-400" />
                    {item.label}
                  </button>
                );
              })}
              <div className="pt-2 mt-2 border-t border-slate-100 space-y-1">
                {canInstall && !isStandaloneMode && (
                  <button
                    onClick={() => {
                      setWizardOpen(true);
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center w-full px-3 py-2 text-sm font-semibold text-indigo-600 rounded-lg hover:bg-indigo-50 cursor-pointer"
                  >
                    <Download className="mr-3 h-5 w-5 text-indigo-500" />
                    Download App
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-3 py-2 text-sm font-semibold text-red-600 rounded-lg hover:bg-red-50 cursor-pointer"
                >
                  <LogOut className="mr-3 h-5 w-5 text-red-500" />
                  Sign Out
                </button>
              </div>
            </nav>
          </div>
        )}

        {/* Content Area */}
        <main className={`flex-1 overflow-y-auto pb-20 md:pb-6 ${
          theme === "dark" ? "bg-slate-950" : "bg-slate-50"
        }`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
            {/* Activity Navigation / Back Button Bar */}
            {activeTab && activeTab !== "dashboard" && (
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 shadow-sm rounded-2xl p-3.5 sm:px-5">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => {
                      if (setActiveTab) setActiveTab("dashboard");
                    }}
                    className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-indigo-600 hover:text-white border border-slate-200 hover:border-indigo-600 transition-all cursor-pointer shadow-xs group"
                    title="Return to Dashboard Overview"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4 text-slate-500 group-hover:text-white transition-colors group-hover:-translate-x-1 transform" />
                    <span>Back to Dashboard</span>
                  </button>
                  <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>
                  <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-500">
                    <span>Current Activity:</span>
                    <span className="font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-lg capitalize">
                      {navItems.find((n) => n.id === activeTab)?.label || activeTab}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (setActiveTab) setActiveTab("dashboard");
                  }}
                  className="text-xs font-semibold text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                >
                  Dashboard Overview →
                </button>
              </div>
            )}
            {children}
          </div>
        </main>
      </div>

      {/* Fixed Mobile Bottom Navigation Bar (YouTube Style) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-slate-800 md:hidden px-2 py-1.5 shadow-2xl">
        <div className="grid grid-cols-5 items-center max-w-md mx-auto">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isCenter = item.isCenter;
            const isProfile = item.isProfile;

            if (isCenter) {
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className="flex flex-col items-center justify-center -mt-4 cursor-pointer"
                >
                  <div
                    className={`h-12 w-12 rounded-full flex items-center justify-center shadow-lg transition-all ${
                      isActive
                        ? "bg-indigo-600 text-white ring-4 ring-slate-900 shadow-indigo-500/50 scale-105"
                        : "bg-slate-800 text-white hover:bg-slate-700 ring-4 ring-slate-900"
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <span
                    className={`text-[10px] font-bold mt-1 ${
                      isActive ? "text-indigo-400" : "text-slate-400"
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center py-1 transition-all cursor-pointer ${
                  isActive ? "text-white font-bold" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {isProfile ? (
                  <div
                    className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-[10px] uppercase border transition-all ${
                      isActive
                        ? "bg-indigo-600 text-white border-white scale-110 shadow-sm shadow-indigo-500/50"
                        : "bg-slate-700 text-slate-200 border-slate-600"
                    }`}
                  >
                    {userData?.email ? userData.email.slice(0, 2).toUpperCase() : "ME"}
                  </div>
                ) : (
                  <Icon
                    className={`h-5 w-5 ${
                      isActive ? "text-indigo-400 scale-110" : "text-slate-400"
                    }`}
                  />
                )}
                <span
                  className={`text-[10px] mt-1 tracking-tight ${
                    isActive ? "text-white font-bold" : "text-slate-400"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
      <InstallWizardModal
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onInstalled={() => { setCanInstall(false); setWizardOpen(false); }}
      />
    </div>
  );
}
