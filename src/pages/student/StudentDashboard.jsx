import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  serverTimestamp,
  limit
} from "firebase/firestore";
import Layout from "../../components/Layout";
import CameraCapture from "../../components/CameraCapture";
import LostFoundFeed from "../../components/LostFoundFeed";
import {
  Home,
  User,
  Calendar,
  FileText,
  AlertCircle,
  Megaphone,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  Send,
  BookOpen,
  Trash2,
  Lock,
  Key,
  Eye,
  EyeOff
} from "lucide-react";

export default function StudentDashboard() {
  const { currentUser, userData, completeStudentProfile, updatePassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "dashboard";
  const setActiveTab = useCallback((tab) => setSearchParams({ tab }), [setSearchParams]);
  const [selectedNotifItem, setSelectedNotifItem] = useState(null);

  const handleSelectNotification = async (notif) => {
    if (notif.itemId) {
      try {
        const docSnap = await getDoc(doc(db, "lostFoundItems", notif.itemId));
        if (docSnap.exists()) {
          setSelectedNotifItem({ id: docSnap.id, ...docSnap.data() });
          setActiveTab("lostFound");
        }
      } catch (err) {
        console.error("Error fetching notification item:", err);
      }
    }
  };

  // Mobile Back Button interception
  useEffect(() => {
    // Push a dummy state to ensure we always have an entry to pop
    window.history.pushState({ noExit: true }, "", window.location.href);

    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab") || "dashboard";

      if (tab !== "dashboard") {
        setActiveTab("dashboard");
        // Push the dummy state back to intercept the next back click
        window.history.pushState({ noExit: true }, "", window.location.href);
      } else {
        navigate("/login");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [activeTab, navigate, setActiveTab]);
  const [studentDetails, setStudentDetails] = useState(null);
  const [roommates, setRoommates] = useState([]);
  const [notices, setNotices] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [complaints, setComplaints] = useState([]);

  // Form states
  const [leaveReason, setLeaveReason] = useState("");
  const [leaveFrom, setLeaveFrom] = useState("");
  const [leaveTo, setLeaveTo] = useState("");
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [leaveSuccess, setLeaveSuccess] = useState("");

  const [complaintCategory, setComplaintCategory] = useState("maintenance");
  const [complaintPriority, setComplaintPriority] = useState("medium");
  const [complaintDesc, setComplaintDesc] = useState("");
  const [complaintPhoto, setComplaintPhoto] = useState("");
  const [complaintLoading, setComplaintLoading] = useState(false);
  const [complaintSuccess, setComplaintSuccess] = useState("");

  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editParent, setEditParent] = useState("");
  const [editFather, setEditFather] = useState("");
  const [editMother, setEditMother] = useState("");
  const [editCourse, setEditCourse] = useState("");
  const [editYear, setEditYear] = useState("");
  const [editPhoto, setEditPhoto] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }

    setPasswordLoading(true);
    try {
      await updatePassword(newPassword);
      setPasswordSuccess("Password updated successfully!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error(err);
      if (err.code === "auth/requires-recent-login") {
        setPasswordError("For security reasons, please log out and log back in before changing your password.");
      } else {
        setPasswordError(err.message || "Failed to update password.");
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const [loadingData, setLoadingData] = useState(true);

  // Fetch Student details & roommate list
  useEffect(() => {
    if (!currentUser) return;

    const fetchStudentAndRoommates = async () => {
      try {
        const studentDoc = await getDoc(doc(db, "students", currentUser.uid));
        if (studentDoc.exists()) {
          const details = studentDoc.data();
          setStudentDetails(details);
          
          // Seed edit form states
          setEditName(details.name || "");
          setEditPhone(details.phone || "");
          setEditParent(details.parentContact || "");
          setEditFather(details.fatherName || "");
          setEditMother(details.motherName || "");
          setEditCourse(details.course || "");
          setEditYear(details.year || "");
          setEditPhoto(details.photoUrl || "");

          // Fetch Roommates
          if (details.roomNumber) {
            const roommatesQuery = query(
              collection(db, "students"),
              where("roomNumber", "==", details.roomNumber)
            );
            const snapshots = await getDocs(roommatesQuery);
            const list = [];
            snapshots.forEach((doc) => {
              if (doc.id !== currentUser.uid) {
                list.push({ id: doc.id, ...doc.data() });
              }
            });
            setRoommates(list);
          }
        }
      } catch (err) {
        console.error("Error fetching student details:", err);
      } finally {
        setLoadingData(false);
      }
    };

    fetchStudentAndRoommates();
  }, [currentUser]);

  // Fetch notices, leaves, complaints, and attendance
  useEffect(() => {
    if (!currentUser) return;

    const fetchData = async () => {
      // 1. Notices (all notices)
      try {
        const noticesQuery = query(
          collection(db, "notices"),
          orderBy("postedAt", "desc"),
          limit(20)
        );
        const noticesSnap = await getDocs(noticesQuery);
        const noticesList = [];
        noticesSnap.forEach((doc) => {
          noticesList.push({ id: doc.id, ...doc.data() });
        });
        setNotices(noticesList);
      } catch (err) {
        console.error("Error loading notices:", err);
      }

      // 2. Leave Requests (Query without orderBy to avoid composite index requirements, sort in memory)
      try {
        const leavesQuery = query(
          collection(db, "leaveRequests"),
          where("studentUid", "==", currentUser.uid)
        );
        const leavesSnap = await getDocs(leavesQuery);
        const leavesList = [];
        leavesSnap.forEach((doc) => {
          leavesList.push({ id: doc.id, ...doc.data() });
        });
        // Sort in memory by requestedAt desc
        leavesList.sort((a, b) => {
          const aTime = a.requestedAt?.seconds || a.requestedAt?.toMillis?.() / 1000 || 0;
          const bTime = b.requestedAt?.seconds || b.requestedAt?.toMillis?.() / 1000 || 0;
          return bTime - aTime;
        });
        setLeaves(leavesList);
      } catch (err) {
        console.error("Error loading leaves:", err);
      }

      // 3. Complaints (Query without orderBy to avoid composite index requirements, sort in memory)
      try {
        const complaintsQuery = query(
          collection(db, "complaints"),
          where("studentUid", "==", currentUser.uid)
        );
        const complaintsSnap = await getDocs(complaintsQuery);
        const complaintsList = [];
        complaintsSnap.forEach((doc) => {
          complaintsList.push({ id: doc.id, ...doc.data() });
        });
        // Sort in memory by raisedAt desc
        complaintsList.sort((a, b) => {
          const aTime = a.raisedAt?.seconds || a.raisedAt?.toMillis?.() / 1000 || 0;
          const bTime = b.raisedAt?.seconds || b.raisedAt?.toMillis?.() / 1000 || 0;
          return bTime - aTime;
        });
        setComplaints(complaintsList);
      } catch (err) {
        console.error("Error loading complaints:", err);
      }

      // 4. Attendance
      // For the last 30 days, check records parallelly using local date strings
      try {
        const last30Days = [];
        for (let i = 0; i < 30; i++) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          // Format using local date string format (YYYY-MM-DD)
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, "0");
          const day = String(d.getDate()).padStart(2, "0");
          const dateStr = `${year}-${month}-${day}`;
          last30Days.push(dateStr);
        }

        const attendancePromises = last30Days.map(async (dateStr) => {
          try {
            const recordDoc = await getDoc(
              doc(db, "attendance", dateStr, "records", currentUser.uid)
            );
            if (recordDoc.exists()) {
              return { date: dateStr, status: recordDoc.data().status };
            }
          } catch (e) {
            console.error(`Error reading attendance for ${dateStr}:`, e);
          }
          return { date: dateStr, status: "Not Marked" };
        });

        const attendanceResults = await Promise.all(attendancePromises);
        setAttendance(attendanceResults.filter((r) => r.status !== "Not Marked"));
      } catch (err) {
        console.error("Error loading attendance log:", err);
      }
    };

    fetchData();
  }, [currentUser, activeTab]);

  // Apply Leave
  const handleApplyLeave = async (e) => {
    e.preventDefault();
    setLeaveLoading(true);
    setLeaveSuccess("");

    if (!leaveReason.trim() || !leaveFrom || !leaveTo) {
      setLeaveLoading(false);
      return;
    }

    try {
      await addDoc(collection(db, "leaveRequests"), {
        studentUid: currentUser.uid,
        studentName: studentDetails?.name || "Student",
        roomNumber: studentDetails?.roomNumber || "Unassigned",
        reason: leaveReason,
        fromDate: leaveFrom,
        toDate: leaveTo,
        status: "pending",
        requestedAt: serverTimestamp()
      });

      setLeaveReason("");
      setLeaveFrom("");
      setLeaveTo("");
      setLeaveSuccess("Leave application submitted successfully!");
      
      // Refresh list
      const leavesQuery = query(
        collection(db, "leaveRequests"),
        where("studentUid", "==", currentUser.uid),
        orderBy("requestedAt", "desc")
      );
      const leavesSnap = await getDocs(leavesQuery);
      const leavesList = [];
      leavesSnap.forEach((doc) => {
        leavesList.push({ id: doc.id, ...doc.data() });
      });
      setLeaves(leavesList);
    } catch (err) {
      console.error(err);
    } finally {
      setLeaveLoading(false);
    }
  };

  // Raise Complaint
  const handleRaiseComplaint = async (e) => {
    e.preventDefault();
    setComplaintLoading(true);
    setComplaintSuccess("");

    if (!complaintDesc.trim()) {
      setComplaintLoading(false);
      return;
    }

    try {
      await addDoc(collection(db, "complaints"), {
        studentUid: currentUser.uid,
        studentName: studentDetails?.name || "Student",
        roomNumber: studentDetails?.roomNumber || "Unassigned",
        category: complaintCategory,
        description: complaintDesc,
        photoUrl: complaintPhoto.trim() || null,
        status: "open",
        priority: complaintPriority,
        raisedAt: serverTimestamp()
      });

      setComplaintDesc("");
      setComplaintPhoto("");
      setComplaintSuccess("Complaint filed successfully!");

      // Refresh list
      const complaintsQuery = query(
        collection(db, "complaints"),
        where("studentUid", "==", currentUser.uid),
        orderBy("raisedAt", "desc")
      );
      const complaintsSnap = await getDocs(complaintsQuery);
      const complaintsList = [];
      complaintsSnap.forEach((doc) => {
        complaintsList.push({ id: doc.id, ...doc.data() });
      });
      setComplaints(complaintsList);
    } catch (err) {
      console.error(err);
    } finally {
      setComplaintLoading(false);
    }
  };

  // Update Profile
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileSuccess("");

    try {
      // Update in students/{uid}
      await updateDoc(doc(db, "students", currentUser.uid), {
        name: editName.trim(),
        phone: editPhone.trim(),
        parentContact: editParent.trim(),
        fatherName: editFather.trim(),
        motherName: editMother.trim(),
        course: editCourse.trim(),
        year: editYear,
        photoUrl: editPhoto.trim() || null
      });

      // Update in users/{uid} for general caching
      await updateDoc(doc(db, "users", currentUser.uid), {
        name: editName.trim()
      });

      setStudentDetails((prev) => ({
        ...prev,
        name: editName.trim(),
        phone: editPhone.trim(),
        parentContact: editParent.trim(),
        fatherName: editFather.trim(),
        motherName: editMother.trim(),
        course: editCourse.trim(),
        year: editYear,
        photoUrl: editPhoto.trim() || null
      }));

      setProfileSuccess("Profile updated successfully!");
    } catch (err) {
      console.error(err);
    } finally {
      setProfileLoading(false);
    }
  };

  // Delete Complaint
  const handleDeleteComplaint = async (id) => {
    if (!window.confirm("Are you sure you want to delete this complaint?")) return;
    try {
      await deleteDoc(doc(db, "complaints", id));
      setComplaints((prev) => prev.filter((c) => c.id !== id));
      alert("Complaint deleted successfully!");
    } catch (err) {
      console.error("Error deleting complaint:", err);
      alert("Failed to delete complaint.");
    }
  };

  // Delete Leave Request
  const handleDeleteLeave = async (id) => {
    if (!window.confirm("Are you sure you want to delete this leave request?")) return;
    try {
      await deleteDoc(doc(db, "leaveRequests", id));
      setLeaves((prev) => prev.filter((l) => l.id !== id));
      alert("Leave request deleted successfully!");
    } catch (err) {
      console.error("Error deleting leave request:", err);
      alert("Failed to delete leave request.");
    }
  };

  if (loadingData) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-indigo-600"></div>
      </div>
    );
  }

  // Get status color styling
  const getStatusStyle = (status) => {
    switch (status) {
      case "approved":
      case "present":
      case "resolved":
        return "bg-green-100 text-green-800 border-green-200";
      case "rejected":
      case "absent":
        return "bg-red-100 text-red-800 border-red-200";
      case "in-progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-amber-100 text-amber-800 border-amber-200";
    }
  };

  return (
    <Layout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onSelectNotification={handleSelectNotification}
    >
      {/* Lost & Found Tab */}
      {activeTab === "lostFound" && (
        <LostFoundFeed
          initialSelectedItem={selectedNotifItem}
          onClearSelectedItem={() => setSelectedNotifItem(null)}
        />
      )}

      {/* 1. Dashboard / Overview */}
      {activeTab === "dashboard" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Welcome Banner */}
          <div className="rounded-3xl bg-slate-900 p-6 sm:p-8 text-white relative overflow-hidden shadow-xl">
            <div className="relative z-10 space-y-2">
              <h2 className="text-3xl font-bold tracking-tight">
                Welcome back, {studentDetails?.name}!
              </h2>
              <p className="text-slate-300 text-sm max-w-md">
                Keep track of your leaves, register complaints, check attendance, or read notices.
              </p>
            </div>
            <div className="absolute right-8 bottom-4 text-[10rem] font-bold text-slate-800 opacity-20 pointer-events-none uppercase">
              {studentDetails?.roomNumber || "N/A"}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Quick Stats / Info Widget */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider">My Room Details</h3>
              <div className="flex justify-between items-center bg-slate-50 border border-slate-100 p-4 rounded-xl">
                <div>
                  <span className="text-xs font-semibold text-slate-400">Room Number</span>
                  <p className="text-2xl font-bold text-slate-800">{studentDetails?.roomNumber || "Not Assigned"}</p>
                </div>
                <div className="h-10 w-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-bold">
                  {studentDetails?.roomNumber}
                </div>
              </div>

              {/* Roommate details */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Roommates ({roommates.length})</span>
                {roommates.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No roommates assigned yet.</p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {roommates.map((rm) => (
                      <div key={rm.id} className="flex items-center space-x-3 p-2 bg-slate-50 hover:bg-slate-100 rounded-lg transition-all border border-slate-150">
                        <div className="h-7 w-7 rounded-full bg-slate-200 flex items-center justify-center font-bold text-xs text-slate-600">
                          {rm.name[0].toUpperCase()}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className="text-xs font-bold text-slate-800 truncate">{rm.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">{rm.course}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Attendance Widget */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider">Attendance (Last 30 Days)</h3>
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full border-4 border-emerald-500 flex items-center justify-center font-bold text-emerald-600 text-lg">
                  {attendance.length > 0
                    ? Math.round(
                        (attendance.filter((r) => r.status === "present").length /
                          attendance.length) *
                          100
                      )
                    : 100}
                  %
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Attendance Rate</p>
                  <p className="text-xs text-slate-500">
                    Present: {attendance.filter((r) => r.status === "present").length} | Absent:{" "}
                    {attendance.filter((r) => r.status === "absent").length}
                  </p>
                </div>
              </div>
              
              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={() => setActiveTab("attendance")}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-all flex items-center"
                >
                  View full attendance log &rarr;
                </button>
              </div>
            </div>

            {/* Quick Leave / Complaint Status Widget */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider">Recent Activity</h3>
              <div className="space-y-3">
                {leaves.length > 0 ? (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <div>
                      <p className="text-xs font-bold text-slate-800">Leave Request</p>
                      <p className="text-[10px] text-slate-400">{leaves[0].fromDate} to {leaves[0].toDate}</p>
                    </div>
                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase border ${getStatusStyle(leaves[0].status)}`}>
                      {leaves[0].status}
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No leaves applied yet.</p>
                )}

                {complaints.length > 0 ? (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <div>
                      <p className="text-xs font-bold text-slate-800">Complaint: {complaints[0].category}</p>
                      <p className="text-[10px] text-slate-400 truncate max-w-40">{complaints[0].description}</p>
                    </div>
                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase border ${getStatusStyle(complaints[0].status)}`}>
                      {complaints[0].status}
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No complaints filed yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* Notices Section */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center space-x-2">
              <Megaphone className="h-5 w-5 text-indigo-600" />
              <h3 className="text-lg font-bold text-slate-900">Hostel Notice Board</h3>
            </div>
            {notices.length === 0 ? (
              <p className="text-sm text-slate-400 italic py-4">No announcements posted at this time.</p>
            ) : (
              <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto pr-2 space-y-4">
                {notices.map((notice) => (
                  <div key={notice.id} className="pt-4 first:pt-0">
                    <div className="flex items-start justify-between">
                      <h4 className="text-sm font-bold text-slate-800">{notice.title}</h4>
                      <span className="text-[10px] text-slate-400">
                        {notice.postedAt?.toDate ? notice.postedAt.toDate().toLocaleDateString() : "Just now"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500 leading-relaxed whitespace-pre-line">{notice.message}</p>
                    <p className="mt-1 text-[9px] font-semibold text-indigo-500">Posted by: {notice.postedBy === "admin" ? "Admin" : "Warden"}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Attendance History */}
      {activeTab === "attendance" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 animate-fadeIn">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Attendance Log</h2>
            <p className="text-xs text-slate-500 mt-1">Review your daily attendance marked by the Warden.</p>
          </div>

          {attendance.length === 0 ? (
            <div className="text-center py-12 text-slate-400 italic">No attendance records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attendance.map((record) => (
                    <tr key={record.date} className="text-sm">
                      <td className="py-3 font-semibold text-slate-700">{record.date}</td>
                      <td className="py-3">
                        <span className={`inline-flex px-2.5 py-0.5 text-xs font-bold rounded-full uppercase border ${getStatusStyle(record.status)}`}>
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 3. Leave Requests */}
      {activeTab === "leave" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          {/* Apply leave form */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-fit space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Apply for Leave</h2>
              <p className="text-xs text-slate-500">Request permission to temporarily leave the hostel premises.</p>
            </div>

            {leaveSuccess && (
              <div className="rounded-xl bg-green-50 border border-green-200 p-3 text-xs text-green-600">
                {leaveSuccess}
              </div>
            )}

            <form onSubmit={handleApplyLeave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Reason for Leave
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="e.g. Visiting home for festival holidays."
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-indigo-500 focus:outline-none"
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    From Date
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-sm"
                    value={leaveFrom}
                    onChange={(e) => setLeaveFrom(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    To Date
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-sm"
                    value={leaveTo}
                    onChange={(e) => setLeaveTo(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={leaveLoading}
                className="w-full rounded-xl bg-slate-900 py-3 text-center text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center transition-all"
              >
                {leaveLoading ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Request
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Leave history */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Leave History</h2>

            {leaves.length === 0 ? (
              <div className="text-center py-12 text-slate-400 italic">No leave requests found.</div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {leaves.map((request) => (
                  <div key={request.id} className="border border-slate-100 rounded-xl p-4 space-y-3 bg-slate-50/50">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Duration</span>
                        <p className="text-sm font-bold text-slate-700">{request.fromDate} to {request.toDate}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full uppercase border ${getStatusStyle(request.status)}`}>
                          {request.status}
                        </span>
                        {(request.status === "approved" || request.status === "rejected") && (
                          <button
                            onClick={() => handleDeleteLeave(request.id)}
                            className="p-1 border border-slate-200 hover:border-red-200 text-slate-400 hover:text-red-500 rounded-lg transition-all"
                            title="Delete Leave Request"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Reason</span>
                      <p className="text-xs text-slate-600 mt-0.5 whitespace-pre-line leading-relaxed">{request.reason}</p>
                    </div>

                    {request.wardenRemark && (
                      <div className="bg-white border border-slate-100 p-2.5 rounded-lg text-xs">
                        <span className="font-bold text-slate-700">Warden Remark: </span>
                        <span className="text-slate-600">{request.wardenRemark}</span>
                      </div>
                    )}

                    <div className="text-[10px] text-slate-400 flex justify-between pt-1 border-t border-slate-100/50">
                      <span>Applied: {request.requestedAt?.toDate ? request.requestedAt.toDate().toLocaleString() : "Just now"}</span>
                      {request.reviewedAt && (
                        <span>Reviewed: {request.reviewedAt?.toDate ? request.reviewedAt.toDate().toLocaleDateString() : ""}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Complaints */}
      {activeTab === "complaints" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          {/* File a complaint */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-fit space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">File a Complaint</h2>
              <p className="text-xs text-slate-500">Report facility damages, food issues, or behavior complaints.</p>
            </div>

            {complaintSuccess && (
              <div className="rounded-xl bg-green-50 border border-green-200 p-3 text-xs text-green-600">
                {complaintSuccess}
              </div>
            )}

            <form onSubmit={handleRaiseComplaint} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-sm"
                    value={complaintCategory}
                    onChange={(e) => setComplaintCategory(e.target.value)}
                  >
                    <option value="maintenance">Maintenance</option>
                    <option value="food">Mess / Food</option>
                    <option value="cleanliness">Cleanliness</option>
                    <option value="electrical">Electrical</option>
                    <option value="plumbing">Plumbing</option>
                    <option value="wifi">Wi-Fi / Internet</option>
                    <option value="ragging/behavior">Ragging/Behavior</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Priority
                  </label>
                  <select
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-sm"
                    value={complaintPriority}
                    onChange={(e) => setComplaintPriority(e.target.value)}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe the issue in detail..."
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-indigo-500 focus:outline-none"
                  value={complaintDesc}
                  onChange={(e) => setComplaintDesc(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Photo URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="e.g. image link of leakage/broken item"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                  value={complaintPhoto}
                  onChange={(e) => setComplaintPhoto(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={complaintLoading}
                className="w-full rounded-xl bg-slate-900 py-3 text-center text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center transition-all"
              >
                {complaintLoading ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Submit Complaint
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Complaints list */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Complaints Log</h2>

            {complaints.length === 0 ? (
              <div className="text-center py-12 text-slate-400 italic">No complaints raised yet.</div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {complaints.map((item) => (
                  <div key={item.id} className="border border-slate-100 rounded-xl p-4 space-y-3 bg-slate-50/50">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className={`inline-block px-2 py-0.5 text-[9px] font-bold tracking-wider rounded-md uppercase border border-indigo-200 bg-indigo-50 text-indigo-700 mr-2`}>
                          {item.category}
                        </span>
                        <span className={`inline-block px-2 py-0.5 text-[9px] font-bold tracking-wider rounded-md uppercase border ${
                          item.priority === "high" ? "bg-red-50 text-red-700 border-red-200" :
                          item.priority === "medium" ? "bg-amber-50 text-amber-700 border-amber-200" :
                          "bg-slate-50 text-slate-700 border-slate-200"
                        }`}>
                          {item.priority} Priority
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full uppercase border ${getStatusStyle(item.status)}`}>
                          {item.status}
                        </span>
                        {item.status === "resolved" && (
                          <button
                            onClick={() => handleDeleteComplaint(item.id)}
                            className="p-1 border border-slate-200 hover:border-red-200 text-slate-400 hover:text-red-500 rounded-lg transition-all"
                            title="Delete Complaint"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">{item.description}</p>
                    </div>

                    {item.photoUrl && (
                      <div className="rounded-lg overflow-hidden border border-slate-200 max-h-40 max-w-xs">
                        <img src={item.photoUrl} alt="Complaint detail" className="object-cover h-full w-full" onError={(e) => e.target.style.display='none'} />
                      </div>
                    )}

                    {item.wardenRemark && (
                      <div className="bg-white border border-slate-100 p-2.5 rounded-lg text-xs">
                        <span className="font-bold text-slate-700">Warden Remark: </span>
                        <span className="text-slate-600">{item.wardenRemark}</span>
                      </div>
                    )}

                    <div className="text-[10px] text-slate-400 flex justify-between pt-1 border-t border-slate-100/50">
                      <span>Filed: {item.raisedAt?.toDate ? item.raisedAt.toDate().toLocaleString() : "Just now"}</span>
                      {item.resolvedAt && (
                        <span>Resolved: {item.resolvedAt?.toDate ? item.resolvedAt.toDate().toLocaleDateString() : ""}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. Profile Tab */}
      {activeTab === "profile" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm max-w-2xl mx-auto space-y-6 animate-fadeIn">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Manage Profile</h2>
            <p className="text-xs text-slate-500">Update your contact information and student details.</p>
          </div>

          {profileSuccess && (
            <div className="rounded-xl bg-green-50 border border-green-200 p-3 text-xs text-green-600">
              {profileSuccess}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-sm"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Room Number (Read Only)
                </label>
                <input
                  type="text"
                  disabled
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-sm bg-slate-50 text-slate-400 font-semibold cursor-not-allowed"
                  value={studentDetails?.roomNumber || "Unassigned"}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-sm"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Parent / Guardian Contact
                </label>
                <input
                  type="tel"
                  required
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-sm"
                  value={editParent}
                  onChange={(e) => setEditParent(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Father's Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Father's Full Name"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-sm"
                  value={editFather}
                  onChange={(e) => setEditFather(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Mother's Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Mother's Full Name"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-sm"
                  value={editMother}
                  onChange={(e) => setEditMother(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Course
                </label>
                <input
                  type="text"
                  required
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-sm"
                  value={editCourse}
                  onChange={(e) => setEditCourse(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Year of Study
                </label>
                <select
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:outline-none"
                  value={editYear}
                  onChange={(e) => setEditYear(e.target.value)}
                >
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                  <option value="Postgraduate">Postgraduate</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <CameraCapture photoUrl={editPhoto} onCapture={setEditPhoto} label="Profile Photo (Optional)" />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={profileLoading}
                className="w-full sm:w-auto px-6 rounded-xl bg-slate-900 py-3 text-center text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center justify-center"
              >
                {profileLoading ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </form>

          {/* Change Password Card */}
          <div className="pt-6 border-t border-slate-200 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center">
                <Lock className="h-4 w-4 mr-2 text-indigo-600" />
                Change Password
              </h3>
              <p className="text-xs text-slate-500">Update your account password securely.</p>
            </div>

            {passwordSuccess && (
              <div className="rounded-xl bg-green-50 border border-green-200 p-3 text-xs text-green-600">
                {passwordSuccess}
              </div>
            )}

            {passwordError && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-600">
                {passwordError}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  New Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Key className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    placeholder="Min 6 characters"
                    className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-10 text-sm focus:border-indigo-500 focus:outline-none"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    title={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Key className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    placeholder="Repeat new password"
                    className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-10 text-sm focus:border-indigo-500 focus:outline-none"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    title={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={passwordLoading}
                className="w-full sm:w-auto px-6 rounded-xl bg-indigo-600 py-2.5 text-center text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center cursor-pointer"
              >
                {passwordLoading ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                ) : (
                  "Update Password"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
