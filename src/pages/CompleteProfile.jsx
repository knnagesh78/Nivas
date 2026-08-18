import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { GraduationCap, Phone, User, Home, UserCheck, ShieldAlert, ArrowLeft } from "lucide-react";
import CameraCapture from "../components/CameraCapture";

export default function CompleteProfile() {
  const { completeStudentProfile, logout, userData } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [course, setCourse] = useState("");
  const [year, setYear] = useState("1st Year");
  const [phone, setPhone] = useState("");
  const [parentContact, setParentContact] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [motherName, setMotherName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (
      !name.trim() ||
      !roomNumber.trim() ||
      !course.trim() ||
      !phone.trim() ||
      !parentContact.trim() ||
      !fatherName.trim() ||
      !motherName.trim() ||
      !idNumber.trim()
    ) {
      setError("Please fill out all required fields.");
      return;
    }

    setLoading(true);
    try {
      await completeStudentProfile({
        name: name.trim(),
        roomNumber: roomNumber.trim(),
        course: course.trim(),
        year,
        phone: phone.trim(),
        parentContact: parentContact.trim(),
        fatherName: fatherName.trim(),
        motherName: motherName.trim(),
        idNumber: idNumber.trim(),
        photoUrl: photoUrl.trim() || null,
      });
      // Redirect to student page
      navigate("/student");
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background shapes */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-slate-800 opacity-50 blur-3xl"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-slate-800 opacity-50 blur-3xl"></div>

      <div className="w-full max-w-2xl bg-slate-950/80 p-8 sm:p-10 rounded-3xl border border-slate-800 shadow-2xl relative z-10 animate-fadeIn backdrop-blur-xl">
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white text-xs font-bold transition-all cursor-pointer border border-slate-800"
              title="Back to Sign In"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>
            <div className="flex items-center space-x-2">
              <img src="/logo.svg" className="h-8 w-8 rounded-lg shadow-sm" alt="Nivas Logo" />
              <span className="font-bold text-white text-lg tracking-tight">Nivas Onboarding</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs font-bold text-slate-400 hover:text-rose-400 transition-all cursor-pointer"
          >
            Sign Out
          </button>
        </div>

        <div className="mb-8 space-y-2">
          <h2 className="text-3xl font-black text-white tracking-tight">Complete Your Student Profile</h2>
          <p className="text-sm text-indigo-300">
            Please fill out your hostel identity details and contact information to access the Student Portal.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl bg-rose-950/40 border border-rose-800/60 p-4 text-xs font-bold text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-2">
                Full Name <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <User className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-2">
                Initial Room Number <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Home className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. 104"
                  className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-2">
                Course / Branch <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <GraduationCap className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. B.Tech CSE"
                  className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-2">
                Year of Study <span className="text-rose-400">*</span>
              </label>
              <select
                className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 py-3 px-4 text-sm text-white focus:border-indigo-500 focus:outline-none transition-all"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              >
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
                <option value="Postgraduate">Postgraduate</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-2">
                Phone Number <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Phone className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +91 9876543210"
                  className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-2">
                Parent/Guardian Contact <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Phone className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +91 9123456789"
                  className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                  value={parentContact}
                  onChange={(e) => setParentContact(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-2">
                Father's Name <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <User className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Father's Full Name"
                  className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none transition-all"
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-2">
                Mother's Name <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <User className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Mother's Full Name"
                  className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none transition-all"
                  value={motherName}
                  onChange={(e) => setMotherName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-2">
                Student Identification Number <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <ShieldAlert className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. 24170-cm-028"
                  className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-mono tracking-widest"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                />
              </div>
              <p className="mt-1.5 text-[10px] text-slate-400">Parents will use this ID + your email to log in.</p>
            </div>

            <div className="sm:col-span-2">
              <CameraCapture photoUrl={photoUrl} onCapture={setPhotoUrl} label="Profile Photo Capture (Optional)" />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-indigo-600 py-4 text-center text-sm font-bold text-white shadow-xl shadow-indigo-600/30 hover:bg-indigo-500 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
              ) : (
                <>
                  <UserCheck className="h-4 w-4" />
                  <span>Save Profile & Open Dashboard</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
