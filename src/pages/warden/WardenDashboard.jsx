import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  setDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  serverTimestamp,
  writeBatch
} from "firebase/firestore";
import Layout from "../../components/Layout";
import WardenHandovers from "../../components/WardenHandovers";
import StudentAttendanceModal from "../../components/StudentAttendanceModal";
import {
  Users,
  FileText,
  AlertCircle,
  Megaphone,
  Search,
  Check,
  X,
  Edit2,
  Download,
  DoorOpen,
  ClipboardList,
  Trash2,
  Settings,
  Key,
  Mail,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  RotateCcw,
  Phone,
  Hash,
  UserCheck,
  AlertTriangle
} from "lucide-react";

export default function WardenDashboard() {
  const { currentUser, updatePassword, updateEmail } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "dashboard";
  const setTab = useCallback((tab) => setSearchParams({ tab }), [setSearchParams]);

  const handleSelectNotification = async (notif) => {
    if (notif.itemId) {
      setTab("handovers");
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
        setTab("dashboard");
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
  }, [activeTab, navigate, setTab]);

  // Data states
  const [students, setStudents] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewAttendanceStudent, setViewAttendanceStudent] = useState(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [complaintCategoryFilter, setComplaintCategoryFilter] = useState("all");
  const [complaintStatusFilter, setComplaintStatusFilter] = useState("all");
  const [complaintPriorityFilter, setComplaintPriorityFilter] = useState("all");

  // Attendance Marking
  const getLocalDateString = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const [attendanceDate, setAttendanceDate] = useState(getLocalDateString());
  const [attendanceRecords, setAttendanceRecords] = useState({}); // studentUid -> "present" | "absent" | "leave"
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceSuccess, setAttendanceSuccess] = useState("");
  const [attendanceMeta, setAttendanceMeta] = useState({
    isSubmitted: false,
    updatedAt: null,
    markedByEmail: ""
  });
  const [attendanceSearchQuery, setAttendanceSearchQuery] = useState("");
  const [attendanceStatusFilter, setAttendanceStatusFilter] = useState("all");
  const [todayAttendanceSummary, setTodayAttendanceSummary] = useState({
    total: 0,
    present: 0,
    absent: 0,
    leave: 0,
    isMarked: false
  });

  // Assign Room modal/form
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [assignRoomNum, setAssignRoomNum] = useState("");

  // Leave approval remarks
  const [leaveRemarks, setLeaveRemarks] = useState({}); // requestId -> remark

  // Complaint resolution remarks
  const [complaintRemarks, setComplaintRemarks] = useState({}); // complaintId -> remark
  const [complaintStatusUpdate, setComplaintStatusUpdate] = useState({}); // complaintId -> status
  const [complaintPriorityUpdate, setComplaintPriorityUpdate] = useState({}); // complaintId -> priority

  // Notice form
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeMessage, setNoticeMessage] = useState("");
  const [noticeLoading, setNoticeLoading] = useState(false);
  const [noticeSuccess, setNoticeSuccess] = useState("");

  // Settings states
  const [wardenSelfEmail, setWardenSelfEmail] = useState(currentUser?.email || "");
  const [wardenNewPassword, setWardenNewPassword] = useState("");
  const [wardenConfirmPassword, setWardenConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState("");
  const [settingsError, setSettingsError] = useState("");

  const handleUpdateWardenSettings = async (e) => {
    e.preventDefault();
    setSettingsSuccess("");
    setSettingsError("");

    if (wardenNewPassword && wardenNewPassword !== wardenConfirmPassword) {
      setSettingsError("Passwords do not match.");
      return;
    }
    if (wardenNewPassword && wardenNewPassword.length < 6) {
      setSettingsError("Password must be at least 6 characters.");
      return;
    }

    setSettingsLoading(true);
    try {
      if (wardenSelfEmail && wardenSelfEmail !== currentUser.email) {
        await updateEmail(wardenSelfEmail);
      }
      if (wardenNewPassword) {
        await updatePassword(wardenNewPassword);
        setWardenNewPassword("");
        setWardenConfirmPassword("");
      }
      setSettingsSuccess("Account credentials updated successfully!");
    } catch (err) {
      console.error(err);
      if (err.code === "auth/requires-recent-login") {
        setSettingsError("For security reasons, please sign out and sign back in before changing password/email.");
      } else {
        setSettingsError(err.message || "Failed to update settings.");
      }
    } finally {
      setSettingsLoading(false);
    }
  };

  // Fetch all data
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Students
      const studentsSnap = await getDocs(collection(db, "students"));
      const studentsList = [];
      studentsSnap.forEach((doc) => {
        studentsList.push({ id: doc.id, ...doc.data() });
      });
      setStudents(studentsList);

      // 2. Fetch Rooms
      const roomsSnap = await getDocs(collection(db, "rooms"));
      const roomsList = [];
      roomsSnap.forEach((doc) => {
        roomsList.push({ id: doc.id, ...doc.data() });
      });
      setRooms(roomsList);

      // 3. Fetch Leaves
      const leavesQuery = query(collection(db, "leaveRequests"), orderBy("requestedAt", "desc"));
      const leavesSnap = await getDocs(leavesQuery);
      const leavesList = [];
      leavesSnap.forEach((doc) => {
        leavesList.push({ id: doc.id, ...doc.data() });
      });
      setLeaves(leavesList);

      // 4. Fetch Complaints
      const complaintsQuery = query(collection(db, "complaints"), orderBy("raisedAt", "desc"));
      const complaintsSnap = await getDocs(complaintsQuery);
      const complaintsList = [];
      complaintsSnap.forEach((doc) => {
        complaintsList.push({ id: doc.id, ...doc.data() });
      });
      setComplaints(complaintsList);

      // 5. Fetch Notices
      const noticesQuery = query(collection(db, "notices"), orderBy("postedAt", "desc"));
      const noticesSnap = await getDocs(noticesQuery);
      const noticesList = [];
      noticesSnap.forEach((doc) => {
        noticesList.push({ id: doc.id, ...doc.data() });
      });
      setNotices(noticesList);

      // 6. Today's Attendance summary for dashboard
      const todayStr = getLocalDateString();
      try {
        const todayAttSnap = await getDocs(collection(db, "attendance", todayStr, "records"));
        const summaryDoc = await getDoc(doc(db, "attendance", todayStr));
        let pCount = 0;
        let aCount = 0;
        let lCount = 0;
        todayAttSnap.forEach((d) => {
          const st = d.data().status;
          if (st === "present") pCount++;
          else if (st === "absent") aCount++;
          else if (st === "leave") lCount++;
        });
        setTodayAttendanceSummary({
          total: studentsList.length,
          present: pCount,
          absent: aCount,
          leave: lCount,
          isMarked: !todayAttSnap.empty || (summaryDoc.exists() && summaryDoc.data().isSubmitted)
        });
      } catch (attErr) {
        console.warn("Could not fetch today attendance summary:", attErr);
      }

    } catch (err) {
      console.error("Error fetching Warden data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Approved leaves active on selected attendanceDate
  const studentsOnLeaveToday = useMemo(() => {
    const map = {};
    leaves.forEach((l) => {
      const isApproved = l.status === "approved";
      const from = l.fromDate || l.startDate;
      const to = l.toDate || l.endDate;
      const sId = l.studentUid || l.studentId;
      if (isApproved && from && to && sId) {
        if (attendanceDate >= from && attendanceDate <= to) {
          map[sId] = l;
        }
      }
    });
    return map;
  }, [leaves, attendanceDate]);

  // Fetch attendance for selected date
  useEffect(() => {
    const fetchAttendanceForDate = async () => {
      if (!attendanceDate) return;
      try {
        const attendanceSnap = await getDocs(collection(db, "attendance", attendanceDate, "records"));
        const summaryDoc = await getDoc(doc(db, "attendance", attendanceDate));
        
        const records = {};
        const hasExistingRecords = !attendanceSnap.empty;
        attendanceSnap.forEach((doc) => {
          records[doc.id] = doc.data().status;
        });
        
        const defaultRecords = {};
        students.forEach((student) => {
          if (records[student.id]) {
            defaultRecords[student.id] = records[student.id];
          } else if (studentsOnLeaveToday[student.id]) {
            defaultRecords[student.id] = "leave";
          } else {
            // Default to present for quick marking
            defaultRecords[student.id] = "present";
          }
        });
        
        setAttendanceRecords(defaultRecords);
        setAttendanceMeta({
          isSubmitted: hasExistingRecords || (summaryDoc.exists() && summaryDoc.data().isSubmitted),
          updatedAt: summaryDoc.exists() ? summaryDoc.data().updatedAt : null,
          markedByEmail: summaryDoc.exists() ? summaryDoc.data().markedByEmail : ""
        });
        setAttendanceSuccess("");
      } catch (err) {
        console.error("Error fetching attendance for date:", err);
      }
    };

    if (students.length > 0) {
      fetchAttendanceForDate();
    }
  }, [attendanceDate, students, studentsOnLeaveToday]);

  // Quick bulk marking handlers
  const handleMarkAllPresent = () => {
    const updated = {};
    students.forEach((s) => {
      if (studentsOnLeaveToday[s.id]) {
        updated[s.id] = "leave";
      } else {
        updated[s.id] = "present";
      }
    });
    setAttendanceRecords(updated);
  };

  const handleMarkAllAbsent = () => {
    const updated = {};
    students.forEach((s) => {
      updated[s.id] = "absent";
    });
    setAttendanceRecords(updated);
  };

  const handleResetAttendance = () => {
    const updated = {};
    students.forEach((s) => {
      if (studentsOnLeaveToday[s.id]) {
        updated[s.id] = "leave";
      } else {
        updated[s.id] = "present";
      }
    });
    setAttendanceRecords(updated);
  };

  // Mark Attendance submit
  const handleSaveAttendance = async () => {
    setAttendanceLoading(true);
    setAttendanceSuccess("");
    try {
      const batch = writeBatch(db);
      let presentCount = 0;
      let absentCount = 0;
      let leaveCount = 0;
      
      students.forEach((student) => {
        const status = attendanceRecords[student.id] || "absent";
        if (status === "present") presentCount++;
        else if (status === "absent") absentCount++;
        else if (status === "leave") leaveCount++;

        const recordRef = doc(db, "attendance", attendanceDate, "records", student.id);
        batch.set(recordRef, {
          studentId: student.id,
          studentName: student.name || "Incomplete Profile",
          idNumber: student.idNumber || "",
          roomNumber: student.roomNumber || "Unassigned",
          course: student.course || "",
          year: student.year || "",
          phone: student.phone || "",
          parentContact: student.parentContact || "",
          status,
          date: attendanceDate,
          updatedAt: serverTimestamp(),
          wardenId: currentUser.uid,
          wardenEmail: currentUser.email || ""
        }, { merge: true });
      });

      // Also set parent document summary
      const summaryRef = doc(db, "attendance", attendanceDate);
      batch.set(summaryRef, {
        date: attendanceDate,
        totalStudents: students.length,
        presentCount,
        absentCount,
        leaveCount,
        isSubmitted: true,
        markedBy: currentUser.uid,
        markedByEmail: currentUser.email || "",
        updatedAt: serverTimestamp()
      }, { merge: true });

      await batch.commit();

      setAttendanceMeta({
        isSubmitted: true,
        updatedAt: new Date(),
        markedByEmail: currentUser.email || ""
      });

      setAttendanceSuccess(`Attendance for ${attendanceDate} saved successfully! (${presentCount} Present, ${absentCount} Absent, ${leaveCount} On Leave)`);

      // Update today's banner if saving for today
      if (attendanceDate === getLocalDateString()) {
        setTodayAttendanceSummary({
          total: students.length,
          present: presentCount,
          absent: absentCount,
          leave: leaveCount,
          isMarked: true
        });
      }
    } catch (err) {
      console.error("Error saving attendance:", err);
    } finally {
      setAttendanceLoading(false);
    }
  };

  // Update room assignment
  const handleAssignRoom = async (e) => {
    e.preventDefault();
    if (!selectedStudent || !assignRoomNum.trim()) return;

    try {
      // 1. Update Student record
      await updateDoc(doc(db, "students", selectedStudent.id), {
        roomNumber: assignRoomNum.trim()
      });

      // 2. Refresh local state
      setStudents(prev =>
        prev.map(s => (s.id === selectedStudent.id ? { ...s, roomNumber: assignRoomNum.trim() } : s))
      );

      setSelectedStudent(null);
      setAssignRoomNum("");
    } catch (err) {
      console.error("Error assigning room:", err);
    }
  };

  // Remove Student
  const handleRemoveStudent = async (studentId, studentName) => {
    if (!window.confirm(`Are you sure you want to remove student "${studentName || "this student"}"? This will delete their student profile and user record.`)) {
      return;
    }
    try {
      await deleteDoc(doc(db, "students", studentId));
      await deleteDoc(doc(db, "users", studentId));
      setStudents(prev => prev.filter(s => s.id !== studentId));
      alert("Student removed successfully.");
    } catch (err) {
      console.error("Error removing student:", err);
      alert("Failed to remove student: " + err.message);
    }
  };

  // Action Leave (Approve/Reject)
  const handleActionLeave = async (requestId, status) => {
    const remark = leaveRemarks[requestId] || "";
    try {
      await updateDoc(doc(db, "leaveRequests", requestId), {
        status,
        reviewedBy: currentUser.uid,
        reviewedAt: serverTimestamp(),
        wardenRemark: remark
      });

      // Update local state
      setLeaves(prev =>
        prev.map(l =>
          l.id === requestId
            ? {
                ...l,
                status,
                wardenRemark: remark,
                reviewedBy: currentUser.uid,
                reviewedAt: { toDate: () => new Date() } // placeholder for UI
              }
            : l
        )
      );
    } catch (err) {
      console.error("Error reviewing leave:", err);
    }
  };

  // Action Complaint (Resolve/Status/Priority update)
  const handleActionComplaint = async (complaintId) => {
    const remark = complaintRemarks[complaintId] || "";
    const status = complaintStatusUpdate[complaintId];
    const priority = complaintPriorityUpdate[complaintId];

    const updates = {};
    if (remark) updates.wardenRemark = remark;
    if (status) updates.status = status;
    if (priority) updates.priority = priority;

    if (Object.keys(updates).length === 0) return;

    if (status === "resolved") {
      updates.resolvedBy = currentUser.uid;
      updates.resolvedAt = serverTimestamp();
    }

    try {
      await updateDoc(doc(db, "complaints", complaintId), {
        ...updates
      });

      // Update local state
      setComplaints(prev =>
        prev.map(c =>
          c.id === complaintId
            ? {
                ...c,
                ...updates,
                resolvedAt: status === "resolved" ? { toDate: () => new Date() } : c.resolvedAt
              }
            : c
        )
      );

      alert("Complaint updated successfully!");
    } catch (err) {
      console.error("Error updating complaint:", err);
    }
  };

  // Post Notice
  const handlePostNotice = async (e) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeMessage.trim()) return;

    setNoticeLoading(true);
    setNoticeSuccess("");

    try {
      const docRef = await addDoc(collection(db, "notices"), {
        title: noticeTitle.trim(),
        message: noticeMessage.trim(),
        postedBy: "warden",
        postedAt: serverTimestamp(),
        targetAudience: "all"
      });

      // Refresh notice log
      setNotices(prev => [
        {
          id: docRef.id,
          title: noticeTitle.trim(),
          message: noticeMessage.trim(),
          postedBy: "warden",
          postedAt: new Date()
        },
        ...prev
      ]);

      setNoticeTitle("");
      setNoticeMessage("");
      setNoticeSuccess("Notice posted successfully!");
    } catch (err) {
      console.error("Error posting notice:", err);
    } finally {
      setNoticeLoading(false);
    }
  };

  // Delete Notice
  const handleDeleteNotice = async (id) => {
    if (!window.confirm("Are you sure you want to delete this notice?")) return;
    try {
      await deleteDoc(doc(db, "notices", id));
      setNotices(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error("Error deleting notice:", err);
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

  // CSV Export Utility
  const handleExportCSV = (type) => {
    let headers = [];
    let rows = [];
    let filename = "";

    if (type === "attendance") {
      filename = `attendance_report_${attendanceDate}.csv`;
      headers = [
        "Student Name",
        "Student ID / Roll No",
        "Room Number",
        "Course",
        "Year",
        "Student Phone",
        "Parent Contact",
        "Attendance Status",
        "Date"
      ];
      rows = students.map(student => [
        `"${student.name || ""}"`,
        `"${student.idNumber || ""}"`,
        `"${student.roomNumber || "Unassigned"}"`,
        `"${student.course || ""}"`,
        `"${student.year || ""}"`,
        `"${student.phone || ""}"`,
        `"${student.parentContact || ""}"`,
        `"${attendanceRecords[student.id] || "absent"}"`,
        `"${attendanceDate}"`
      ]);
    } else if (type === "complaints") {
      filename = "complaints_log.csv";
      headers = ["Category", "Priority", "Status", "Student Name", "Room Number", "Description", "Remark", "Filed Date"];
      rows = complaints.map(c => [
        `"${c.category}"`,
        `"${c.priority}"`,
        `"${c.status}"`,
        `"${c.studentName}"`,
        `"${c.roomNumber}"`,
        `"${c.description.replace(/"/g, '""')}"`,
        `"${(c.wardenRemark || "").replace(/"/g, '""')}"`,
        `"${c.raisedAt?.toDate ? c.raisedAt.toDate().toLocaleDateString() : "Just now"}"`
      ]);
    }

    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper filters
  const filteredStudents = students.filter(s => {
    const q = searchQuery.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      s.roomNumber?.toLowerCase().includes(q) ||
      s.course?.toLowerCase().includes(q) ||
      s.year?.toLowerCase().includes(q) ||
      s.idNumber?.toLowerCase().includes(q) ||
      s.phone?.toLowerCase().includes(q) ||
      s.parentContact?.toLowerCase().includes(q)
    );
  });

  // Filter for Attendance Tab
  const filteredAttendanceStudents = students.filter(s => {
    const q = attendanceSearchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      s.name?.toLowerCase().includes(q) ||
      s.roomNumber?.toLowerCase().includes(q) ||
      s.course?.toLowerCase().includes(q) ||
      s.idNumber?.toLowerCase().includes(q) ||
      s.phone?.toLowerCase().includes(q);

    const status = attendanceRecords[s.id] || "unmarked";
    const matchesFilter =
      attendanceStatusFilter === "all" ||
      (attendanceStatusFilter === "present" && status === "present") ||
      (attendanceStatusFilter === "absent" && status === "absent") ||
      (attendanceStatusFilter === "leave" && status === "leave");

    return matchesSearch && matchesFilter;
  });

  const filteredComplaints = complaints.filter(c => {
    const matchCat = complaintCategoryFilter === "all" || c.category === complaintCategoryFilter;
    const matchStat = complaintStatusFilter === "all" || c.status === complaintStatusFilter;
    const matchPrio = complaintPriorityFilter === "all" || c.priority === complaintPriorityFilter;
    return matchCat && matchStat && matchPrio;
  });

  // Calculate dynamic stats
  const totalStudents = students.length;
  const pendingLeavesCount = leaves.filter(l => l.status === "pending").length;
  const openComplaintsCount = complaints.filter(c => c.status !== "resolved").length;
  
  // Compute Room Occupancy counts
  const computeOccupancy = () => {
    const map = {};
    students.forEach(s => {
      if (s.roomNumber) {
        map[s.roomNumber] = (map[s.roomNumber] || 0) + 1;
      }
    });
    return map;
  };
  const occupancyMap = computeOccupancy();

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

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-indigo-600"></div>
      </div>
    );
  }

  return (
    <Layout
      displayName={currentUser?.displayName || currentUser?.email?.split("@")[0]}
      activeTab={activeTab}
      setActiveTab={setTab}
      onSelectNotification={handleSelectNotification}
    >
      {/* Lost & Found Handovers Tab */}
      {activeTab === "handovers" && <WardenHandovers />}

      {/* 1. Dashboard Overview */}
      {activeTab === "dashboard" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top stats banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 flex items-center justify-between shadow-sm card-hover">
              <div>
                <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Total Students</span>
                <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{totalStudents}</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-xs">
                <Users className="h-6 w-6" />
              </div>
            </div>

            {/* Today's Attendance Card */}
            <div
              onClick={() => setTab("attendance")}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 flex items-center justify-between shadow-sm card-hover cursor-pointer group"
              title="Click to manage attendance"
            >
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Today's Attendance</span>
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase ${
                    todayAttendanceSummary.isMarked
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                  }`}>
                    {todayAttendanceSummary.isMarked ? "Marked" : "Pending"}
                  </span>
                </div>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  {todayAttendanceSummary.isMarked
                    ? `${todayAttendanceSummary.present} / ${totalStudents}`
                    : "Not Marked"}
                </p>
                <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                  {todayAttendanceSummary.isMarked
                    ? `${todayAttendanceSummary.absent} Absent • ${todayAttendanceSummary.leave} On Leave`
                    : "Tap to record check-in"}
                </p>
              </div>
              <div className={`h-12 w-12 rounded-2xl border flex items-center justify-center shadow-xs transition-transform group-hover:scale-110 ${
                todayAttendanceSummary.isMarked
                  ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-100 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400"
                  : "bg-amber-50 dark:bg-amber-950/60 border-amber-100 dark:border-amber-800 text-amber-600 dark:text-amber-400"
              }`}>
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 flex items-center justify-between shadow-sm card-hover">
              <div>
                <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Pending Leaves</span>
                <p className="text-3xl font-black text-amber-600 dark:text-amber-400 mt-1">{pendingLeavesCount}</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-800/50 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-xs">
                <FileText className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 flex items-center justify-between shadow-sm card-hover">
              <div>
                <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Open Complaints</span>
                <p className="text-3xl font-black text-rose-600 dark:text-rose-400 mt-1">{openComplaintsCount}</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-100 dark:border-rose-800/50 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-xs">
                <AlertCircle className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 flex items-center justify-between shadow-sm card-hover">
              <div>
                <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Occupied Beds</span>
                <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  {Object.values(occupancyMap).reduce((a, b) => a + b, 0)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-800/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xs">
                <DoorOpen className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Actions Panel */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Quick Operations</h3>
                <p className="text-xs text-slate-500">Shortcut buttons for warden operations.</p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  onClick={() => setTab("attendance")}
                  className="p-4 bg-slate-50 dark:bg-slate-950/60 hover:bg-indigo-50/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-indigo-200 rounded-2xl text-left transition-all duration-200 group cursor-pointer"
                >
                  <div className="h-10 w-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <ClipboardList className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600">Mark Attendance</p>
                  <span className="text-[10px] text-slate-400">Mark present/absent logs</span>
                </button>

                <button
                  onClick={() => setTab("leave")}
                  className="p-4 bg-slate-50 dark:bg-slate-950/60 hover:bg-amber-50/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-amber-200 rounded-2xl text-left transition-all duration-200 group cursor-pointer"
                >
                  <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <FileText className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-amber-600">Approve Leaves</p>
                  <span className="text-[10px] text-slate-400">Review student requests</span>
                </button>

                <button
                  onClick={() => setTab("complaints")}
                  className="p-4 bg-slate-50 dark:bg-slate-950/60 hover:bg-rose-50/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-rose-200 rounded-2xl text-left transition-all duration-200 group cursor-pointer"
                >
                  <div className="h-10 w-10 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-rose-600">Resolve Complaints</p>
                  <span className="text-[10px] text-slate-400">Track issues box</span>
                </button>

                <button
                  onClick={() => setTab("notices")}
                  className="p-4 bg-slate-50 dark:bg-slate-950/60 hover:bg-emerald-50/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-emerald-200 rounded-2xl text-left transition-all duration-200 group cursor-pointer"
                >
                  <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Megaphone className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600">Post Notice</p>
                  <span className="text-[10px] text-slate-400">Post announcements board</span>
                </button>
              </div>
            </div>

            {/* Recent Notices Log */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-800">Recent Notices</h3>
              {notices.length === 0 ? (
                <p className="text-sm text-slate-400 italic py-6">No notices posted yet.</p>
              ) : (
                <div className="space-y-4 divide-y divide-slate-150 max-h-60 overflow-y-auto pr-2">
                  {notices.map((n) => (
                    <div key={n.id} className="pt-3 first:pt-0">
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-bold text-slate-700">{n.title}</p>
                        <button
                          onClick={() => handleDeleteNotice(n.id)}
                          className="text-[10px] font-semibold text-rose-600 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">{n.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Students Tab (Directory & Assignments) */}
      {activeTab === "students" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Student Directory</h2>
              <p className="text-xs text-slate-500">Manage rooms and view student contact records.</p>
            </div>
            
            <div className="relative max-w-sm w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                className="w-full rounded-xl border border-slate-200 pl-9 pr-4 py-2 text-sm focus:outline-none"
                placeholder="Search by name, room, course..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3">Student</th>
                  <th className="pb-3">Room</th>
                  <th className="pb-3">Course / Year</th>
                  <th className="pb-3">Contacts</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((s) => (
                  <tr key={s.id} className="text-sm">
                    <td className="py-3.5">
                      <div className="flex items-center space-x-3">
                        <div className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 overflow-hidden shrink-0">
                          {s.photoUrl ? (
                            <img src={s.photoUrl} className="h-full w-full rounded-full object-cover" onError={(e) => e.target.style.display='none'} />
                          ) : (
                            s.name ? s.name[0].toUpperCase() : "S"
                          )}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="font-bold text-slate-800 dark:text-slate-200">{s.name || "Incomplete Profile"}</p>
                            {s.idNumber && (
                              <span className="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 text-indigo-700 dark:text-indigo-300 text-[10px] font-extrabold">
                                #{s.idNumber}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400">UID: {s.id.substring(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5">
                      <span className="font-semibold text-slate-700 bg-slate-50 border border-slate-150 px-2.5 py-1 rounded-lg">
                        {s.roomNumber || "Unassigned"}
                      </span>
                    </td>
                    <td className="py-3.5 text-slate-500">
                      <p>{s.course || "N/A"}</p>
                      <p className="text-xs">{s.year || ""}</p>
                    </td>
                    <td className="py-3.5 text-xs text-slate-500 space-y-0.5">
                      <p><span className="font-semibold text-slate-600">Self:</span> {s.phone || "N/A"}</p>
                      <p><span className="font-semibold text-slate-600">Parent:</span> {s.parentContact || "N/A"}</p>
                      <p><span className="font-semibold text-slate-600">Father:</span> {s.fatherName || "N/A"}</p>
                      <p><span className="font-semibold text-slate-600">Mother:</span> {s.motherName || "N/A"}</p>
                    </td>
                    <td className="py-3.5">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedStudent(s);
                            setAssignRoomNum(s.roomNumber || "");
                          }}
                          className="p-2 border border-slate-200 text-slate-600 hover:text-indigo-600 rounded-lg hover:border-indigo-200 transition-all flex items-center space-x-1"
                          title="Assign Room"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          <span className="text-xs font-semibold">Assign Room</span>
                        </button>
                        <button
                          onClick={() => setViewAttendanceStudent(s)}
                          className="p-2 border border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg transition-all flex items-center space-x-1 cursor-pointer"
                          title="View Attendance"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span className="text-xs font-semibold">Attendance</span>
                        </button>
                        <button
                          onClick={() => handleRemoveStudent(s.id, s.name)}
                          className="p-2 border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg transition-all flex items-center space-x-1 cursor-pointer"
                          title="Remove Student"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="text-xs font-semibold">Remove</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Assign Room Modal Popup */}
          {selectedStudent && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
              <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-fadeIn">
                <div className="bg-gradient-to-r from-teal-600 to-emerald-600 p-4 text-white">
                  <h3 className="font-bold text-base">Reassign Room</h3>
                  <p className="text-xs text-teal-100">Set room for {selectedStudent.name}</p>
                </div>
                <form onSubmit={handleAssignRoom} className="p-4 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                      Room Number
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 102"
                      className="w-full border border-slate-300 rounded-xl p-2 text-sm outline-none"
                      value={assignRoomNum}
                      onChange={(e) => setAssignRoomNum(e.target.value)}
                    />
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedStudent(null)}
                      className="flex-1 border border-slate-200 rounded-xl py-2 text-center text-xs font-bold text-slate-500 hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-teal-600 rounded-xl py-2 text-center text-xs font-bold text-white hover:bg-teal-700 shadow-sm transition-all cursor-pointer"
                    >
                      Save Room
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Mark Attendance Tab */}
      {activeTab === "attendance" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6 animate-fadeIn">
          {/* Header & Date Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center space-x-2.5">
                <h2 className="text-xl font-black text-slate-900 dark:text-white">Daily Attendance Log</h2>
                {attendanceMeta.isSubmitted ? (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    Saved in Database
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-xs font-bold">
                    <Clock className="h-3.5 w-3.5 mr-1" />
                    Unsaved Draft
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Record hostel check-in present/absent logs, detect approved leaves, and synchronize with Firebase.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Quick Date buttons */}
              <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 text-xs">
                <button
                  onClick={() => setAttendanceDate(getLocalDateString())}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    attendanceDate === getLocalDateString()
                      ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => {
                    const y = new Date();
                    y.setDate(y.getDate() - 1);
                    setAttendanceDate(getLocalDateString(y));
                  }}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    (() => {
                      const y = new Date();
                      y.setDate(y.getDate() - 1);
                      return attendanceDate === getLocalDateString(y);
                    })()
                      ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                  }`}
                >
                  Yesterday
                </button>
              </div>

              {/* Date picker */}
              <div className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5">
                <Calendar className="h-4 w-4 text-slate-400" />
                <input
                  type="date"
                  className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                />
              </div>

              {/* Export CSV */}
              <button
                onClick={() => handleExportCSV("attendance")}
                className="flex items-center space-x-1.5 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-all hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <Download className="h-4 w-4" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {attendanceSuccess && (
            <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 p-4 text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center space-x-2 animate-fadeIn">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <span>{attendanceSuccess}</span>
            </div>
          )}

          {/* Date Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Students</span>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{students.length}</p>
              </div>
              <div className="h-9 w-9 rounded-xl bg-slate-200/60 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                <Users className="h-4 w-4" />
              </div>
            </div>

            <div className="bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 p-4 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Present</span>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {Object.values(attendanceRecords).filter((v) => v === "present").length}
                </p>
              </div>
              <div className="h-9 w-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>

            <div className="bg-rose-50/60 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 p-4 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Absent</span>
                <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-0.5">
                  {Object.values(attendanceRecords).filter((v) => v === "absent").length}
                </p>
              </div>
              <div className="h-9 w-9 rounded-xl bg-rose-100 dark:bg-rose-950/80 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <XCircle className="h-4 w-4" />
              </div>
            </div>

            <div className="bg-amber-50/60 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 p-4 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider">On Leave</span>
                <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
                  {Object.values(attendanceRecords).filter((v) => v === "leave").length}
                </p>
              </div>
              <div className="h-9 w-9 rounded-xl bg-amber-100 dark:bg-amber-950/80 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Clock className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* Search, Filter & Bulk Controls Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/70 dark:bg-slate-950/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
            {/* Search Box */}
            <div className="relative flex-1 max-w-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-900 focus:outline-none focus:border-indigo-500 dark:text-white"
                placeholder="Search student, roll no, room..."
                value={attendanceSearchQuery}
                onChange={(e) => setAttendanceSearchQuery(e.target.value)}
              />
            </div>

            {/* Status Filter tabs */}
            <div className="flex items-center space-x-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-1 rounded-xl text-xs">
              <button
                type="button"
                data-plain="true"
                onClick={() => setAttendanceStatusFilter("all")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  attendanceStatusFilter === "all"
                    ? "bg-teal-600 text-white shadow-md shadow-teal-600/20"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                All ({students.length})
              </button>
              <button
                type="button"
                data-plain="true"
                onClick={() => setAttendanceStatusFilter("present")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  attendanceStatusFilter === "present"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                }`}
              >
                Present ({Object.values(attendanceRecords).filter((v) => v === "present").length})
              </button>
              <button
                type="button"
                data-plain="true"
                onClick={() => setAttendanceStatusFilter("absent")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  attendanceStatusFilter === "absent"
                    ? "bg-rose-600 text-white shadow-xs"
                    : "text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                }`}
              >
                Absent ({Object.values(attendanceRecords).filter((v) => v === "absent").length})
              </button>
              <button
                type="button"
                data-plain="true"
                onClick={() => setAttendanceStatusFilter("leave")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  attendanceStatusFilter === "leave"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                }`}
              >
                Leave ({Object.values(attendanceRecords).filter((v) => v === "leave").length})
              </button>
            </div>

            {/* Quick Bulk Action Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleMarkAllPresent}
                className="px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white text-xs font-bold transition-all shadow-xs"
                title="Mark all active students present"
              >
                Mark All Present
              </button>
              <button
                onClick={handleMarkAllAbsent}
                className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-600 hover:text-white text-xs font-bold transition-all shadow-xs"
                title="Mark all students absent"
              >
                Mark All Absent
              </button>
              <button
                onClick={handleResetAttendance}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                title="Reset to default leave detection"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {students.length === 0 ? (
            <div className="text-center py-16 text-slate-400 italic">
              <Users className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-600">No students registered in database.</p>
              <p className="text-xs text-slate-400 mt-0.5">Students can complete their onboarding profile from student portal.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                      <th className="p-4">Student & Identity</th>
                      <th className="p-4">Room</th>
                      <th className="p-4">Contacts / Parent</th>
                      <th className="p-4">Leave Status</th>
                      <th className="p-4 text-center">Attendance Toggle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {filteredAttendanceStudents.map((student) => {
                      const onLeave = studentsOnLeaveToday[student.id];
                      const status = attendanceRecords[student.id] || "absent";

                      return (
                        <tr
                          key={student.id}
                          className="text-sm hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                        >
                          {/* Student Details Column */}
                          <td className="p-4">
                            <div className="flex items-center space-x-3">
                              <div className="h-10 w-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm shadow-xs overflow-hidden shrink-0">
                                {student.photoUrl ? (
                                  <img
                                    src={student.photoUrl}
                                    alt={student.name}
                                    className="h-full w-full object-cover"
                                    onError={(e) => (e.target.style.display = "none")}
                                  />
                                ) : (
                                  student.name ? student.name[0].toUpperCase() : "S"
                                )}
                              </div>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <p className="font-bold text-slate-800 dark:text-slate-200">
                                    {student.name || "Incomplete Profile"}
                                  </p>
                                  {student.idNumber && (
                                    <span className="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 text-indigo-700 dark:text-indigo-300 text-[10px] font-extrabold">
                                      #{student.idNumber}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-400">
                                  {student.course || "Course N/A"} {student.year ? `• ${student.year}` : ""}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Room Column */}
                          <td className="p-4 whitespace-nowrap">
                            <span className="whitespace-nowrap inline-flex items-center text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg">
                              {student.roomNumber ? `Room ${student.roomNumber}` : "Unassigned"}
                            </span>
                          </td>

                          {/* Emergency Contacts Column */}
                          <td className="p-4 text-xs text-slate-500 space-y-0.5">
                            {student.phone ? (
                              <p className="flex items-center">
                                <span className="font-semibold text-slate-600 dark:text-slate-400 mr-1">Self:</span>
                                <span>{student.phone}</span>
                              </p>
                            ) : null}
                            {student.parentContact ? (
                              <p className="flex items-center text-amber-700 dark:text-amber-400 font-semibold">
                                <span className="font-bold mr-1">Parent:</span>
                                <span>{student.parentContact}</span>
                              </p>
                            ) : null}
                            {!student.phone && !student.parentContact && (
                              <span className="text-slate-400 italic text-[11px]">No contact added</span>
                            )}
                          </td>

                          {/* Leave Status Column */}
                          <td className="p-4">
                            {onLeave ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Approved Leave
                                </span>
                                <p className="text-[10px] text-slate-400 max-w-40 truncate" title={onLeave.reason}>
                                  {onLeave.reason || "Out-station permission"}
                                </p>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-medium">In Hostel</span>
                            )}
                          </td>

                          {/* 3-Way Attendance Status Toggle with Distinct Colors */}
                          <td className="p-4 text-center">
                            <div className="att-toggle-group">
                              <button
                                type="button"
                                data-plain="true"
                                onClick={() =>
                                  setAttendanceRecords((prev) => ({ ...prev, [student.id]: "present" }))
                                }
                                className={`att-btn ${status === "present" ? "is-present" : ""}`}
                                title="Mark Present (Green)"
                              >
                                <Check className="h-3.5 w-3.5" />
                                <span>Present</span>
                              </button>

                              <button
                                type="button"
                                data-plain="true"
                                onClick={() =>
                                  setAttendanceRecords((prev) => ({ ...prev, [student.id]: "absent" }))
                                }
                                className={`att-btn ${status === "absent" ? "is-absent" : ""}`}
                                title="Mark Absent (Red)"
                              >
                                <X className="h-3.5 w-3.5" />
                                <span>Absent</span>
                              </button>

                              <button
                                type="button"
                                data-plain="true"
                                onClick={() =>
                                  setAttendanceRecords((prev) => ({ ...prev, [student.id]: "leave" }))
                                }
                                className={`att-btn ${status === "leave" ? "is-leave" : ""}`}
                                title="Mark Leave (Amber)"
                              >
                                <Clock className="h-3.5 w-3.5" />
                                <span>Leave</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Bottom Action / Save Bar */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="text-xs text-slate-500">
                  <span>Selected Date: </span>
                  <strong className="text-slate-800 dark:text-slate-200 font-bold">{attendanceDate}</strong>
                  <span className="mx-2">•</span>
                  <span>
                    Summary:{" "}
                    <strong className="text-emerald-600">
                      {Object.values(attendanceRecords).filter((v) => v === "present").length} Present
                    </strong>
                    ,{" "}
                    <strong className="text-rose-600">
                      {Object.values(attendanceRecords).filter((v) => v === "absent").length} Absent
                    </strong>
                    ,{" "}
                    <strong className="text-amber-600">
                      {Object.values(attendanceRecords).filter((v) => v === "leave").length} On Leave
                    </strong>
                  </span>
                </div>

                <button
                  onClick={handleSaveAttendance}
                  disabled={attendanceLoading}
                  className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all flex items-center justify-center cursor-pointer"
                >
                  {attendanceLoading ? (
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></span>
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Save Attendance Sheet to Database
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Leave Management Tab */}
      {activeTab === "leave" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 animate-fadeIn">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Leave Applications</h2>
            <p className="text-xs text-slate-500">Approve or reject student out-station request permissions.</p>
          </div>

          {leaves.length === 0 ? (
            <p className="text-center py-12 text-slate-400 italic">No leave applications submitted.</p>
          ) : (
            <div className="space-y-4">
              {leaves.map((req) => (
                <div key={req.id} className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-800 text-sm">{req.studentName}</span>
                        <span className="text-xs font-semibold text-slate-400 bg-slate-200 px-2 py-0.5 rounded">
                          Room: {req.roomNumber}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Duration: <span className="font-bold">{req.fromDate}</span> to <span className="font-bold">{req.toDate}</span>
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full uppercase border text-center max-w-fit ${getStatusStyle(req.status)}`}>
                        {req.status}
                      </span>
                      {(req.status === "approved" || req.status === "rejected") && (
                        <button
                          onClick={() => handleDeleteLeave(req.id)}
                          className="p-1.5 border border-slate-200 hover:border-red-200 text-slate-400 hover:text-red-500 rounded-lg transition-all"
                          title="Delete Leave Request"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide block mb-0.5">Reason</span>
                    <p className="text-xs text-slate-600 bg-white border border-slate-100 p-3 rounded-xl leading-relaxed whitespace-pre-line">
                      {req.reason}
                    </p>
                  </div>

                  {req.status === "pending" ? (
                    <div className="space-y-3 pt-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                          Warden Remark (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Approved. Inform parents upon arrival."
                          className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none bg-white"
                          value={leaveRemarks[req.id] || ""}
                          onChange={(e) =>
                            setLeaveRemarks((prev) => ({ ...prev, [req.id]: e.target.value }))
                          }
                        />
                      </div>

                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleActionLeave(req.id, "rejected")}
                          className="px-4 py-2 border border-red-200 hover:bg-red-50 text-red-600 rounded-xl text-xs font-bold flex items-center"
                        >
                          <X className="h-3.5 w-3.5 mr-1" />
                          Reject
                        </button>
                        <button
                          onClick={() => handleActionLeave(req.id, "approved")}
                          className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center hover:bg-emerald-600"
                        >
                          <Check className="h-3.5 w-3.5 mr-1" />
                          Approve
                        </button>
                      </div>
                    </div>
                  ) : (
                    req.wardenRemark && (
                      <div className="bg-white border border-slate-100 p-2.5 rounded-lg text-xs">
                        <span className="font-bold text-slate-700">Warden Remark: </span>
                        <span className="text-slate-600">{req.wardenRemark}</span>
                      </div>
                    )
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. Complaints management */}
      {activeTab === "complaints" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 animate-fadeIn">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Complaints Box</h2>
              <p className="text-xs text-slate-500">Track and update hostel maintenance/facilities issues.</p>
            </div>

            <button
              onClick={() => handleExportCSV("complaints")}
              className="flex items-center space-x-2 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-950 transition-all hover:bg-slate-50 max-w-fit"
            >
              <Download className="h-4 w-4" />
              <span>Export Complaints CSV</span>
            </button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Category</label>
              <select
                className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs"
                value={complaintCategoryFilter}
                onChange={(e) => setComplaintCategoryFilter(e.target.value)}
              >
                <option value="all">All Categories</option>
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
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Status</label>
              <select
                className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs"
                value={complaintStatusFilter}
                onChange={(e) => setComplaintStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Priority</label>
              <select
                className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs"
                value={complaintPriorityFilter}
                onChange={(e) => setComplaintPriorityFilter(e.target.value)}
              >
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {filteredComplaints.length === 0 ? (
            <p className="text-center py-12 text-slate-400 italic">No complaints match current filters.</p>
          ) : (
            <div className="space-y-4">
              {filteredComplaints.map((item) => (
                <div key={item.id} className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="font-bold text-slate-800 text-sm">{item.studentName}</span>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-200 px-2 py-0.5 rounded">
                          Room: {item.roomNumber}
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-wider bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Raised: {item.raisedAt?.toDate ? item.raisedAt.toDate().toLocaleString() : "Just now"}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full uppercase border text-center max-w-fit ${getStatusStyle(item.status)}`}>
                        {item.status}
                      </span>
                      {item.status === "resolved" && (
                        <button
                          onClick={() => handleDeleteComplaint(item.id)}
                          className="p-1.5 border border-slate-200 hover:border-red-200 text-slate-400 hover:text-red-500 rounded-lg transition-all"
                          title="Delete Complaint"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide block mb-0.5">Description</span>
                      <p className="text-xs text-slate-600 bg-white border border-slate-100 p-3 rounded-xl leading-relaxed whitespace-pre-line">
                        {item.description}
                      </p>
                    </div>

                    {item.photoUrl && (
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide block mb-0.5">Submitted Photo</span>
                        <div className="rounded-xl overflow-hidden border border-slate-200 max-h-40 max-w-sm">
                          <img src={item.photoUrl} alt="Complaint Attachment" className="object-cover h-full w-full" onError={(e) => e.target.style.display='none'} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions & Remarks */}
                  <div className="bg-white border border-slate-100 rounded-xl p-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Update Status</label>
                        <select
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                          value={complaintStatusUpdate[item.id] || item.status}
                          onChange={(e) =>
                            setComplaintStatusUpdate((prev) => ({ ...prev, [item.id]: e.target.value }))
                          }
                        >
                          <option value="open">Open</option>
                          <option value="in-progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Set Priority</label>
                        <select
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                          value={complaintPriorityUpdate[item.id] || item.priority}
                          onChange={(e) =>
                            setComplaintPriorityUpdate((prev) => ({ ...prev, [item.id]: e.target.value }))
                          }
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>

                      <div className="flex items-end">
                        <button
                          onClick={() => handleActionComplaint(item.id)}
                          className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl py-2.5 text-center text-xs font-bold shadow-md shadow-teal-600/20 transition-all cursor-pointer"
                        >
                          Update Complaint
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                        Resolution Remark / Note
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Plumber called; tap replaced."
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none"
                        value={complaintRemarks[item.id] || item.wardenRemark || ""}
                        onChange={(e) =>
                          setComplaintRemarks((prev) => ({ ...prev, [item.id]: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6. Rooms Tab (Occupancy check) */}
      {activeTab === "rooms" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 animate-fadeIn">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Room Occupancy & Capacity</h2>
            <p className="text-xs text-slate-500">Track available hostel spaces and beds.</p>
          </div>

          {rooms.length === 0 ? (
            <p className="text-center py-12 text-slate-400 italic">No rooms registered. Admins can configure rooms in Admin dashboard.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map((room) => {
                const count = occupancyMap[room.roomNumber] || 0;
                const capacity = Number(room.capacity) || 1;
                const isFull = count >= capacity;
                const occupants = students.filter(s => s.roomNumber === room.roomNumber);

                return (
                  <div key={room.id} className="border border-slate-200 rounded-2xl p-5 space-y-3 bg-slate-50/50">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-base text-slate-800">Room {room.roomNumber}</span>
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md border ${
                        isFull ? "bg-red-50 text-red-700 border-red-200" : "bg-green-50 text-green-700 border-green-200"
                      }`}>
                        {isFull ? "Full" : "Available"}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 bg-white border border-slate-100 p-3 rounded-xl text-xs">
                      <div className="flex-grow">
                        <span className="text-[10px] text-slate-400 font-bold block">Capacity Status</span>
                        <span className="font-bold text-slate-700">{count} / {capacity} Beds Occupied</span>
                      </div>
                      <div className="w-12 bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-full" style={{ width: `${Math.min((count/capacity)*100, 100)}%` }}></div>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Occupants ({occupants.length})</span>
                      {occupants.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">Room is empty.</p>
                      ) : (
                        <div className="space-y-1">
                          {occupants.map(occ => (
                            <div key={occ.id} className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-100 text-xs">
                              <span className="font-semibold text-slate-700">{occ.name}</span>
                              <span className="text-[10px] text-slate-400">{occ.course}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 7. Notice Board Tab (Wardens post notices) */}
      {activeTab === "notices" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          {/* Post Notice Form */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-fit space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Post Announcement</h2>
              <p className="text-xs text-slate-500">Post notifications visible to all student portals.</p>
            </div>

            {noticeSuccess && (
              <div className="rounded-xl bg-green-50 border border-green-200 p-3 text-xs text-green-600">
                {noticeSuccess}
              </div>
            )}

            <form onSubmit={handlePostNotice} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Notice Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Water Outage Announcement"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Message Body
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder="Type notice message details here..."
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-indigo-500 focus:outline-none"
                  value={noticeMessage}
                  onChange={(e) => setNoticeMessage(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={noticeLoading}
                className="w-full rounded-2xl bg-teal-600 hover:bg-teal-700 py-3 text-center text-sm font-bold text-white shadow-md shadow-teal-600/20 disabled:opacity-50 flex items-center justify-center transition-all cursor-pointer"
              >
                {noticeLoading ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                ) : (
                  <>
                    <Megaphone className="mr-2 h-4 w-4" />
                    Publish Announcement
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Past Notices List */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Manage Published Notices</h2>

            {notices.length === 0 ? (
              <div className="text-center py-12 text-slate-400 italic">No notices published.</div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {notices.map((n) => (
                  <div key={n.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2 relative">
                    <button
                      onClick={() => handleDeleteNotice(n.id)}
                      className="absolute top-4 right-4 text-xs font-bold text-rose-600 hover:underline"
                    >
                      Remove Notice
                    </button>
                    <div>
                      <h4 className="font-bold text-sm text-slate-800">{n.title}</h4>
                      <span className="text-[10px] text-slate-400">
                        Posted: {n.postedAt?.toDate ? n.postedAt.toDate().toLocaleString() : "Just now"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{n.message}</p>
                    <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-wide pt-1">
                      Target Audience: {n.targetAudience || "all"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 8. Settings & Credentials Tab */}
      {activeTab === "settings" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm max-w-xl mx-auto space-y-6 animate-fadeIn">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center">
              <Settings className="h-5 w-5 mr-2 text-indigo-600" />
              Warden Settings & Security
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Update your email address or edit your login password.</p>
          </div>

          {settingsSuccess && (
            <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-sm text-green-600">
              {settingsSuccess}
            </div>
          )}

          {settingsError && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-600">
              {settingsError}
            </div>
          )}

          <form onSubmit={handleUpdateWardenSettings} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                Warden Email Address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-4 text-sm focus:border-indigo-500 focus:outline-none"
                  value={wardenSelfEmail}
                  onChange={(e) => setWardenSelfEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                New Password (Leave blank to keep current)
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Key className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Min 6 characters"
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-10 text-sm focus:border-indigo-500 focus:outline-none"
                  value={wardenNewPassword}
                  onChange={(e) => setWardenNewPassword(e.target.value)}
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

            {wardenNewPassword && (
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
                    placeholder="Repeat new password"
                    className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-10 text-sm focus:border-indigo-500 focus:outline-none"
                    value={wardenConfirmPassword}
                    onChange={(e) => setWardenConfirmPassword(e.target.value)}
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
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={settingsLoading}
                className="w-full sm:w-auto px-6 rounded-2xl bg-teal-600 hover:bg-teal-700 py-3 text-center text-sm font-bold text-white shadow-md shadow-teal-600/20 disabled:opacity-50 transition-all flex items-center justify-center cursor-pointer"
              >
                {settingsLoading ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                ) : (
                  "Update Settings"
                )}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {viewAttendanceStudent && (
        <StudentAttendanceModal 
          student={viewAttendanceStudent} 
          onClose={() => setViewAttendanceStudent(null)} 
        />
      )}
    </Layout>
  );
}
