import React, { useState } from "react";
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
  ClipboardList
} from "lucide-react";

export default function Layout({ children, activeTab, setActiveTab }) {
  const { userData, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
        { id: "attendance", label: "My Attendance", icon: Calendar },
        { id: "leave", label: "Leave Requests", icon: FileText },
        { id: "complaints", label: "Complaints", icon: AlertCircle },
        { id: "profile", label: "Profile", icon: User },
      ];
    } else if (role === "warden") {
      return [
        { id: "dashboard", label: "Overview", icon: LayoutDashboard },
        { id: "students", label: "Students", icon: Users },
        { id: "attendance", label: "Attendance Log", icon: ClipboardList },
        { id: "leave", label: "Leave Approvals", icon: FileText },
        { id: "complaints", label: "Complaints Box", icon: AlertCircle },
        { id: "rooms", label: "Rooms & Beds", icon: DoorOpen },
        { id: "notices", label: "Notice Board", icon: Megaphone },
      ];
    } else if (role === "admin") {
      return [
        { id: "dashboard", label: "Control Panel", icon: LayoutDashboard },
        { id: "wardens", label: "Warden Manager", icon: Users },
        { id: "rooms", label: "Room Config", icon: DoorOpen },
        { id: "notices", label: "Hostel Notices", icon: Megaphone },
        { id: "settings", label: "Admin Settings", icon: Settings },
      ];
    }
    return [];
  };

  const navItems = getNavItems();

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
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col bg-white border-r border-slate-200">
        <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
          {/* Brand header */}
          <div className="flex items-center px-6 mb-6">
            <div className="h-9 w-9 rounded-xl bg-slate-900 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              H
            </div>
            <div className="ml-3">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none">Hostelify</h1>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Management System</span>
            </div>
          </div>

          {/* User profile brief */}
          <div className="px-4 mb-4">
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 flex items-center">
              <div className="h-10 w-10 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-bold text-slate-700">
                {userData?.email ? userData.email[0].toUpperCase() : "U"}
              </div>
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-semibold text-slate-800 truncate">
                  {userData?.email?.split("@")[0]}
                </p>
                <span className={`inline-block px-2 py-0.5 mt-1 text-[10px] font-bold tracking-wide uppercase border rounded-full ${getRoleBadge(userData?.role)}`}>
                  {userData?.role}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 space-y-1 bg-white">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`group flex items-center w-full px-3 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                    isActive
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon
                    className={`mr-3 h-5 w-5 flex-shrink-0 ${
                      isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600"
                    }`}
                  />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Sign-out */}
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2.5 text-sm font-semibold text-red-600 rounded-xl hover:bg-red-50 transition-all"
          >
            <LogOut className="mr-3 h-5 w-5 text-red-500" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Top Header & Navigation */}
      <div className="flex flex-col flex-1 w-full md:w-auto overflow-hidden">
        <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 md:hidden">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold shadow-sm">
              H
            </div>
            <span className="ml-2.5 font-bold text-slate-800 text-base">Hostelify</span>
          </div>

          <div className="flex items-center space-x-2">
            <span className={`inline-block px-2.5 py-0.5 text-[9px] font-bold tracking-wide uppercase border rounded-full ${getRoleBadge(userData?.role)}`}>
              {userData?.role}
            </span>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1 text-slate-600 hover:bg-slate-100 rounded-lg focus:outline-none"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 bg-slate-900 bg-opacity-50 md:hidden" onClick={() => setMobileMenuOpen(false)}>
            <nav
              className="fixed top-14 left-0 right-0 bg-white border-b border-slate-200 shadow-xl px-4 py-3 space-y-1"
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
                      isActive ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="mr-3 h-5 w-5 text-slate-400" />
                    {item.label}
                  </button>
                );
              })}
              <div className="pt-2 mt-2 border-t border-slate-100">
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-3 py-2 text-sm font-semibold text-red-600 rounded-lg hover:bg-red-50"
                >
                  <LogOut className="mr-3 h-5 w-5 text-red-500" />
                  Sign Out
                </button>
              </div>
            </nav>
          </div>
        )}

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
