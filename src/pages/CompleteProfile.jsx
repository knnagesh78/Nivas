import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { GraduationCap, Phone, User, Home, UserCheck, ShieldAlert } from "lucide-react";
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
      !motherName.trim()
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

      <div className="w-full max-w-xl bg-white p-8 rounded-3xl border border-slate-200 shadow-2xl relative z-10 animate-fadeIn">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-2.5">
            <img src="/logo.svg" className="h-8 w-8 rounded-lg shadow-sm" alt="Nivas Logo" />
            <span className="font-bold text-slate-800 text-lg">Nivas Onboarding</span>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs font-semibold text-slate-500 hover:text-red-600 transition-all"
          >
            Sign Out
          </button>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Complete Your Profile</h2>
          <p className="mt-1.5 text-sm text-slate-500">
            Please fill out your hostel and contact information to gain access to the Student Dashboard.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                Initial Room Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Home className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. 104"
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                />
              </div>
              <p className="mt-1 text-[10px] text-slate-400">
                You can change this or the Warden can reassign you later.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                Course / Branch <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <GraduationCap className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. B.Tech CSE"
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                Year of Study <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full rounded-xl border border-slate-200 py-2.5 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Phone className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +91 9876543210"
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                Parent/Guardian Contact <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Phone className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +91 9123456789"
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={parentContact}
                  onChange={(e) => setParentContact(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                Father's Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Father's Full Name"
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                Mother's Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Mother's Full Name"
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={motherName}
                  onChange={(e) => setMotherName(e.target.value)}
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <CameraCapture photoUrl={photoUrl} onCapture={setPhotoUrl} label="Profile Photo (Optional)" />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-slate-900 py-3 text-center text-sm font-semibold text-white shadow-md hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
              ) : (
                <>
                  <UserCheck className="mr-2 h-4 w-4" />
                  Save & Enter Dashboard
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
