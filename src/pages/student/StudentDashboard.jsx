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
import CallButton from "../../components/CallButton";
import PinSetupModal from "../../components/PinSetupModal";
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
  EyeOff,
  Sparkles,
  DoorOpen,
  Phone,
  GraduationCap,
  ShieldCheck,
  QrCode,
  Activity,
  Check,
  UserCheck,
  BadgeCheck,
  Camera,
  Bell,
  Package,
  PhoneCall
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
  const [editIdNumber, setEditIdNumber] = useState("");
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
          
          // Cache student name for call feature
          if (details.name) {
            localStorage.setItem("student_name", details.name);
          }
          
          // Seed edit form states
          setEditName(details.name || "");
          setEditPhone(details.phone || "");
          setEditParent(details.parentContact || "");
          setEditFather(details.fatherName || "");
          setEditMother(details.motherName || "");
          setEditCourse(details.course || "");
          setEditYear(details.year || "");
          setEditIdNumber(details.idNumber || "");
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
        idNumber: editIdNumber.trim() || null,
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

  // Emergency PIN Setup callback
  const handlePinSetupComplete = () => {
    // Just refresh the student data to dismiss the modal
    if (currentUser) {
      getDoc(doc(db, "students", currentUser.uid)).then(doc => {
        if (doc.exists()) {
          setStudentDetails(doc.data());
          setEditIdNumber(doc.data().idNumber || "");
        }
      });
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

  // Force PIN setup for existing students
  if (studentDetails && !studentDetails.idNumber) {
    return <PinSetupModal studentUid={currentUser.uid} onComplete={handlePinSetupComplete} />;
  }

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

      {/* Call Roommates Tab */}
      {activeTab === "calls" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header */}
          <div className="relative rounded-3xl bg-gradient-to-br from-slate-950 via-green-950 to-slate-900 p-6 sm:p-8 text-white overflow-hidden shadow-2xl border border-green-500/20">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

            <div className="relative z-10">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-3 rounded-2xl bg-green-500/20 border border-green-400/20 backdrop-blur-sm">
                  <PhoneCall className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight">Call Roommates</h2>
                  <p className="text-xs text-green-300/70 mt-0.5">Free voice calls over data — no SIM needed</p>
                </div>
              </div>
              <p className="text-sm text-slate-300/80 max-w-lg leading-relaxed mt-4">
                Call your hostel roommates directly from the app using your internet connection.
                Works on WiFi and mobile data — completely free, no phone number required.
              </p>
            </div>
          </div>

          {/* Roommates List with Call Buttons */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-green-50 dark:bg-green-950/60 border border-green-100 dark:border-green-800/50 text-green-600 dark:text-green-400">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Your Roommates</h3>
                  <p className="text-xs text-slate-400">Room {studentDetails?.roomNumber || "N/A"} • {roommates.length} roommate{roommates.length !== 1 ? "s" : ""}</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-green-50 dark:bg-green-950/60 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-800/50">
                Data Call
              </span>
            </div>

            {roommates.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                  <User className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                </div>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">No roommates found</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs mx-auto">
                  Other students assigned to Room {studentDetails?.roomNumber || "your room"} will appear here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {roommates.map((rm) => (
                  <div
                    key={rm.id}
                    className="group relative flex items-center space-x-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 hover:border-green-300 dark:hover:border-green-700 transition-all hover:shadow-md"
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-500/20">
                        {rm.name ? rm.name[0].toUpperCase() : "S"}
                      </div>
                      {/* Online indicator */}
                      <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-green-400 ring-2 ring-white dark:ring-slate-900 flex items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{rm.name || "Student"}</p>
                      <p className="text-xs text-slate-400 truncate">{rm.course || "Student"} • {rm.year || ""}</p>
                      <p className="text-[10px] text-slate-400 mt-1 flex items-center space-x-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-400 inline-block" />
                        <span>Available for voice call</span>
                      </p>
                    </div>

                    {/* Call button */}
                    <CallButton calleeUid={rm.id} calleeName={rm.name || "Roommate"} size="lg" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* How it works section */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">How Voice Calling Works</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 text-center">
                <div className="h-10 w-10 mx-auto mb-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 flex items-center justify-center">
                  <PhoneCall className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">1. Tap Call</p>
                <p className="text-[10px] text-slate-400 mt-1">Press the call button next to your roommate's name</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 text-center">
                <div className="h-10 w-10 mx-auto mb-3 rounded-xl bg-green-50 dark:bg-green-950/60 text-green-500 flex items-center justify-center">
                  <Bell className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">2. They Get Notified</p>
                <p className="text-[10px] text-slate-400 mt-1">Your roommate's phone rings — even if the app is closed</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 text-center">
                <div className="h-10 w-10 mx-auto mb-3 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-500 flex items-center justify-center">
                  <Activity className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">3. Talk Free</p>
                <p className="text-[10px] text-slate-400 mt-1">Voice call connects over WiFi/data — no charges!</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1. Dashboard / Overview */}
      {activeTab === "dashboard" && (
        <div className="space-y-8 animate-fadeIn">
          {/* Hero Banner with Glassmorphism & Action Hub */}
          <div className="relative rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-6 sm:p-10 text-white overflow-hidden shadow-2xl border border-indigo-500/20">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-10 -left-10 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-bold bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 backdrop-blur-md">
                    <Sparkles className="h-3.5 w-3.5 mr-1.5 text-indigo-400 animate-pulse" />
                    Student Dashboard
                  </span>
                  {studentDetails?.roomNumber && (
                    <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 backdrop-blur-md">
                      <DoorOpen className="h-3.5 w-3.5 mr-1.5 text-emerald-400" />
                      Room {studentDetails.roomNumber}
                    </span>
                  )}
                  {studentDetails?.course && (
                    <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-bold bg-purple-500/20 border border-purple-400/30 text-purple-300 backdrop-blur-md">
                      <GraduationCap className="h-3.5 w-3.5 mr-1.5 text-purple-400" />
                      {studentDetails.course} ({studentDetails.year || "1st Year"})
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                  <span className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">Active Resident</span>
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-2">
                <div className="space-y-2">
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
                    Welcome, <span className="bg-gradient-to-r from-indigo-300 via-white to-purple-300 bg-clip-text text-transparent">{studentDetails?.name || "Student"}</span>
                  </h2>
                  <p className="text-slate-300 text-sm max-w-xl leading-relaxed">
                    Your central portal for hostel life. Track attendance, manage leave requests, monitor complaint resolutions, and view official notice board updates in real-time.
                  </p>
                </div>

                {/* Quick Action Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:flex md:flex-col gap-2.5 shrink-0">
                  <button
                    onClick={() => setActiveTab("leave")}
                    className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 transition-all cursor-pointer hover:scale-105 active:scale-95"
                  >
                    <Send className="h-4 w-4" />
                    <span>Apply Leave</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("complaints")}
                    className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-white font-bold text-xs backdrop-blur-md transition-all cursor-pointer hover:scale-105 active:scale-95"
                  >
                    <Plus className="h-4 w-4 text-amber-400" />
                    <span>File Complaint</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("profile")}
                    className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-white font-bold text-xs backdrop-blur-md transition-all cursor-pointer hover:scale-105 active:scale-95"
                  >
                    <User className="h-4 w-4 text-emerald-400" />
                    <span>Edit Profile</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("lostFound")}
                    className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-white font-bold text-xs backdrop-blur-md transition-all cursor-pointer hover:scale-105 active:scale-95"
                  >
                    <Package className="h-4 w-4 text-indigo-400" />
                    <span>Lost & Found</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* My Room & Roommates Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800/50 text-indigo-600 dark:text-indigo-400">
                    <DoorOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">Room Allocation</h3>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">Hostel Accommodation</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  {studentDetails?.roomNumber ? `Room ${studentDetails.roomNumber}` : "Unassigned"}
                </span>
              </div>

              <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/60 p-4 rounded-2xl">
                <div>
                  <span className="text-xs font-medium text-slate-400">Room Number</span>
                  <p className="text-3xl font-black text-slate-900 dark:text-white">{studentDetails?.roomNumber || "N/A"}</p>
                </div>
                <div className="h-12 w-12 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-black text-base shadow-lg shadow-indigo-500/20">
                  {studentDetails?.roomNumber || "?"}
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  <span>Roommates ({roommates.length})</span>
                </div>
                {roommates.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">No roommates currently registered in this room.</p>
                ) : (
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {roommates.map((rm) => (
                      <div key={rm.id} className="flex items-center space-x-3 p-2.5 bg-slate-50 dark:bg-slate-950/40 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all border border-slate-150 dark:border-slate-800">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                          {rm.name ? rm.name[0].toUpperCase() : "S"}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{rm.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">{rm.course || "Student"}</p>
                        </div>
                        <CallButton calleeUid={rm.id} calleeName={rm.name || "Roommate"} size="sm" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Attendance Stat Meter */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-800/50 text-emerald-600 dark:text-emerald-400">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">Attendance Rate</h3>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">Last 30 Days</p>
                  </div>
                </div>
              </div>

              {(() => {
                const total = attendance.length;
                const present = attendance.filter((r) => r.status === "present").length;
                const absent = attendance.filter((r) => r.status === "absent").length;
                const rate = total > 0 ? Math.round((present / total) * 100) : 100;

                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 p-4 rounded-2xl">
                      <div>
                        <span className="text-xs font-semibold text-slate-400">Monthly Average</span>
                        <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{rate}%</p>
                      </div>
                      <div className="h-14 w-14 rounded-full border-4 border-emerald-500/30 border-t-emerald-500 flex items-center justify-center font-extrabold text-emerald-600 dark:text-emerald-400 text-sm shadow-inner">
                        {present}/{total}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Present</span>
                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{present} Days</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Absent</span>
                        <span className="text-sm font-black text-rose-500">{absent} Days</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setActiveTab("attendance")}
                  className="w-full text-center text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline transition-all py-1 cursor-pointer flex items-center justify-center space-x-1"
                >
                  <span>View detailed attendance records</span>
                  <span>&rarr;</span>
                </button>
              </div>
            </div>

            {/* Quick Activity Center */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-100 dark:border-purple-800/50 text-purple-600 dark:text-purple-400">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">Recent Activity</h3>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">Status Tracker</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Latest Leave Request</span>
                  {leaves.length > 0 ? (
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                      <div className="overflow-hidden pr-2">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{leaves[0].reason}</p>
                        <p className="text-[10px] text-slate-400">{leaves[0].fromDate} to {leaves[0].toDate}</p>
                      </div>
                      <span className={`px-2.5 py-1 text-[9px] font-extrabold rounded-full uppercase border shrink-0 ${getStatusStyle(leaves[0].status)}`}>
                        {leaves[0].status}
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-xl text-center">No leave requests submitted yet.</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Latest Complaint</span>
                  {complaints.length > 0 ? (
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                      <div className="overflow-hidden pr-2">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 capitalize truncate">{complaints[0].category} Issue</p>
                        <p className="text-[10px] text-slate-400 truncate max-w-44">{complaints[0].description}</p>
                      </div>
                      <span className={`px-2.5 py-1 text-[9px] font-extrabold rounded-full uppercase border shrink-0 ${getStatusStyle(complaints[0].status)}`}>
                        {complaints[0].status}
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-xl text-center">No complaints submitted yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Announcements & Notice Board Section */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800/50 text-indigo-600 dark:text-indigo-400">
                  <Megaphone className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Hostel Notice Board</h3>
                  <p className="text-xs text-slate-400">Official announcements from the Warden & Hostel Administration</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {notices.length} Active {notices.length === 1 ? "Notice" : "Notices"}
              </span>
            </div>

            {notices.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                <Bell className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-500">No active notices posted right now.</p>
                <p className="text-xs text-slate-400 mt-1">Check back later for hostel updates, curfew times, and maintenance schedules.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[420px] overflow-y-auto pr-1">
                {notices.map((notice) => (
                  <div key={notice.id} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-150 dark:border-slate-800 space-y-3 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all">
                    <div className="flex items-start justify-between">
                      <h4 className="text-base font-bold text-slate-900 dark:text-white leading-snug">{notice.title}</h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900 shrink-0">
                        {notice.postedBy === "admin" ? "Admin" : "Warden"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">{notice.message}</p>
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 text-[10px] font-medium text-slate-400 flex justify-between items-center">
                      <span>Posted: {notice.postedAt?.toDate ? notice.postedAt.toDate().toLocaleString() : "Recently"}</span>
                    </div>
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
        <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
          {/* Digital Hostel Student ID Card Header */}
          <div className="relative rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 sm:p-8 text-white overflow-hidden shadow-2xl border border-indigo-500/30">
            {/* Ambient Lighting */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Avatar Box */}
              <div className="relative shrink-0">
                <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-1 shadow-xl">
                  <div className="h-full w-full rounded-[14px] bg-slate-900 overflow-hidden flex items-center justify-center">
                    {editPhoto || studentDetails?.photoUrl ? (
                      <img src={editPhoto || studentDetails.photoUrl} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-4xl font-black text-white">
                        {studentDetails?.name ? studentDetails.name[0].toUpperCase() : "S"}
                      </span>
                    )}
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-slate-950 p-1.5 rounded-full shadow-lg border-2 border-slate-900" title="Active Verified Resident">
                  <BadgeCheck className="h-4 w-4" />
                </div>
              </div>

              {/* Student Identification Details */}
              <div className="flex-1 text-center md:text-left space-y-3">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-500/20 border border-indigo-400/30 text-indigo-300">
                    <ShieldCheck className="h-3.5 w-3.5 mr-1.5 text-indigo-400" />
                    Digital Hostel ID Card
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">
                    <Check className="h-3.5 w-3.5 mr-1.5 text-emerald-400" />
                    Verified Resident
                  </span>
                </div>

                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {studentDetails?.name || "Student Name"}
                  </h2>
                  <p className="text-sm font-semibold text-indigo-300">
                    {studentDetails?.course || "Course Unset"} &bull; {studentDetails?.year || "Year Unset"}
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Room Assigned</span>
                    <span className="font-extrabold text-white">{studentDetails?.roomNumber || "Unassigned"}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Mobile Phone</span>
                    <span className="font-extrabold text-white truncate block">{studentDetails?.phone || "Not set"}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Parent Contact</span>
                    <span className="font-extrabold text-white truncate block">{studentDetails?.parentContact || "Not set"}</span>
                  </div>
                </div>
              </div>

              {/* QR Badge graphic stamp */}
              <div className="hidden lg:flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/10 shrink-0">
                <QrCode className="h-16 w-16 text-indigo-300" />
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mt-1">NIVAS PASS</span>
              </div>
            </div>
          </div>

          {/* Profile Form Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center space-x-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800/50 text-indigo-600 dark:text-indigo-400">
                <User className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Personal & Academic Details</h3>
                <p className="text-xs text-slate-400">Update your student information, contact numbers, and profile picture.</p>
              </div>
            </div>

            {profileSuccess && (
              <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 p-4 text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center space-x-2">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>{profileSuccess}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                      <User className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Your full name"
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-3 pl-10 pr-4 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                  </div>
                </div>

                {/* Room Number (Read Only) */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Room Number (Assigned by Warden)
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                      <DoorOpen className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      disabled
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/80 py-3 pl-10 pr-4 text-sm text-slate-400 font-semibold cursor-not-allowed"
                      value={studentDetails?.roomNumber || "Unassigned"}
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                      <Phone className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +91 9876543210"
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-3 pl-10 pr-4 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                    />
                  </div>
                </div>

                {/* Parent Contact */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Parent / Guardian Contact <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                      <Phone className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="tel"
                      required
                      placeholder="Parent's phone number"
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-3 pl-10 pr-4 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all"
                      value={editParent}
                      onChange={(e) => setEditParent(e.target.value)}
                    />
                  </div>
                </div>

                {/* Father's Name */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Father's Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                      <User className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Father's full name"
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-3 pl-10 pr-4 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all"
                      value={editFather}
                      onChange={(e) => setEditFather(e.target.value)}
                    />
                  </div>
                </div>

                {/* Student Identification Number */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Student Identification Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                      <Lock className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 24170-cm-028"
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-3 pl-10 pr-4 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all font-mono tracking-widest"
                      value={editIdNumber}
                      onChange={(e) => setEditIdNumber(e.target.value)}
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-slate-400">Parents use this ID + your email to log in.</p>
                </div>

                {/* Mother's Name */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Mother's Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                      <User className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Mother's full name"
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-3 pl-10 pr-4 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all"
                      value={editMother}
                      onChange={(e) => setEditMother(e.target.value)}
                    />
                  </div>
                </div>

                {/* Course */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Course / Branch <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                      <GraduationCap className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="e.g. B.Tech CSE"
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-3 pl-10 pr-4 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all"
                      value={editCourse}
                      onChange={(e) => setEditCourse(e.target.value)}
                    />
                  </div>
                </div>

                {/* Year of Study */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Year of Study <span className="text-rose-500">*</span>
                  </label>
                  <select
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-3 px-4 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none transition-all"
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

                {/* Profile Photo Camera Capture */}
                <div className="sm:col-span-2 pt-2">
                  <CameraCapture photoUrl={editPhoto} onCapture={setEditPhoto} label="Profile Photo Capture (Optional)" />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 transition-all cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {profileLoading ? (
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4" />
                      <span>Save Profile Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Change Password Security Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center space-x-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800/50 text-indigo-600 dark:text-indigo-400">
                <Lock className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Account Security</h3>
                <p className="text-xs text-slate-400">Update your account login password to keep your portal secure.</p>
              </div>
            </div>

            {passwordSuccess && (
              <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 p-4 text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center space-x-2">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 p-4 text-xs font-bold text-rose-700 dark:text-rose-300">
                {passwordError}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-5 max-w-lg">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  New Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                    <Key className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    placeholder="At least 6 characters"
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-3 pl-10 pr-12 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none transition-all"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    title={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                    <Key className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    placeholder="Repeat new password"
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-3 pl-10 pr-12 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none transition-all"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    title={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-6 py-3 rounded-2xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {passwordLoading ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  ) : (
                    <span>Update Password</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
