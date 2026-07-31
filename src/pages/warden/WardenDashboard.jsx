import React, { useState, useEffect } from "react";
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
import {
  Users,
  Calendar,
  FileText,
  AlertCircle,
  Megaphone,
  CheckCircle,
  XCircle,
  Search,
  Check,
  X,
  Edit2,
  Download,
  AlertTriangle,
  DoorOpen,
  ClipboardList,
  Plus
} from "lucide-react";

export default function WardenDashboard() {
  const { currentUser } = useAuth();
  const [activeTab, setTab] = useState("dashboard");

  // Data states
  const [students, setStudents] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

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
  const [attendanceRecords, setAttendanceRecords] = useState({}); // studentUid -> "present"/"absent"
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceSuccess, setAttendanceSuccess] = useState("");

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

    } catch (err) {
      console.error("Error fetching Warden data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch attendance for selected date
  useEffect(() => {
    const fetchAttendanceForDate = async () => {
      if (!attendanceDate) return;
      try {
        const attendanceSnap = await getDocs(collection(db, "attendance", attendanceDate, "records"));
        const records = {};
        attendanceSnap.forEach((doc) => {
          records[doc.id] = doc.data().status;
        });
        
        // Pre-fill with "present" for unmarked students to make marking faster
        const defaultRecords = {};
        students.forEach((student) => {
          defaultRecords[student.id] = records[student.id] || "present";
        });
        
        setAttendanceRecords(defaultRecords);
        setAttendanceSuccess("");
      } catch (err) {
        console.error("Error fetching attendance for date:", err);
      }
    };

    if (students.length > 0) {
      fetchAttendanceForDate();
    }
  }, [attendanceDate, students]);

  // Mark Attendance submit
  const handleSaveAttendance = async () => {
    setAttendanceLoading(true);
    setAttendanceSuccess("");
    try {
      const batch = writeBatch(db);
      
      for (const [studentUid, status] of Object.entries(attendanceRecords)) {
        const recordRef = doc(db, "attendance", attendanceDate, "records", studentUid);
        batch.set(recordRef, {
          status,
          markedBy: currentUser.uid,
          timestamp: serverTimestamp()
        });
      }

      await batch.commit();
      setAttendanceSuccess(`Attendance for ${attendanceDate} saved successfully!`);
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

  // CSV Export Utility
  const handleExportCSV = (type) => {
    let headers = [];
    let rows = [];
    let filename = "";

    if (type === "attendance") {
      filename = `attendance_report_${attendanceDate}.csv`;
      headers = ["Student Name", "Room Number", "Course", "Year", "Attendance Status"];
      rows = filteredStudents.map(student => [
        `"${student.name}"`,
        `"${student.roomNumber || "Unassigned"}"`,
        `"${student.course || ""}"`,
        `"${student.year || ""}"`,
        `"${attendanceRecords[student.id] || "Absent"}"`
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
      s.course?.toLowerCase().includes(q)
    );
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
    <Layout activeTab={activeTab} setActiveTab={setTab}>
      {/* 1. Dashboard Overview */}
      {activeTab === "dashboard" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top stats banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Students</span>
                <p className="text-3xl font-extrabold text-slate-800 mt-1">{totalStudents}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Users className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Leaves</span>
                <p className="text-3xl font-extrabold text-amber-600 mt-1">{pendingLeavesCount}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                <FileText className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Open Complaints</span>
                <p className="text-3xl font-extrabold text-rose-600 mt-1">{openComplaintsCount}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
                <AlertCircle className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Occupied Beds</span>
                <p className="text-3xl font-extrabold text-emerald-600 mt-1">
                  {Object.values(occupancyMap).reduce((a, b) => a + b, 0)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <DoorOpen className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Actions Panel */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-800">Quick Operations</h3>
              <p className="text-xs text-slate-500">Shortcut buttons for warden operations.</p>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => setTab("attendance")}
                  className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-150 rounded-xl text-left transition-all"
                >
                  <ClipboardList className="h-6 w-6 text-indigo-600 mb-2" />
                  <p className="text-sm font-bold text-slate-700">Mark Attendance</p>
                  <span className="text-[10px] text-slate-400">Mark present/absent logs</span>
                </button>

                <button
                  onClick={() => setTab("leave")}
                  className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-150 rounded-xl text-left transition-all"
                >
                  <FileText className="h-6 w-6 text-amber-600 mb-2" />
                  <p className="text-sm font-bold text-slate-700">Approve Leaves</p>
                  <span className="text-[10px] text-slate-400">Review student requests</span>
                </button>

                <button
                  onClick={() => setTab("complaints")}
                  className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-150 rounded-xl text-left transition-all"
                >
                  <AlertCircle className="h-6 w-6 text-rose-600 mb-2" />
                  <p className="text-sm font-bold text-slate-700">Resolve Complaints</p>
                  <span className="text-[10px] text-slate-400">Track issues box</span>
                </button>

                <button
                  onClick={() => setTab("notices")}
                  className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-150 rounded-xl text-left transition-all"
                >
                  <Megaphone className="h-6 w-6 text-emerald-600 mb-2" />
                  <p className="text-sm font-bold text-slate-700">Post Notice</p>
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
                        <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                          {s.photoUrl ? (
                            <img src={s.photoUrl} className="h-full w-full rounded-full object-cover" onError={(e) => e.target.style.display='none'} />
                          ) : (
                            s.name ? s.name[0].toUpperCase() : "S"
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{s.name || "Incomplete Profile"}</p>
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
                    </td>
                    <td className="py-3.5">
                      <button
                        onClick={() => {
                          setSelectedStudent(s);
                          setAssignRoomNum(s.roomNumber || "");
                        }}
                        className="p-2 border border-slate-200 text-slate-600 hover:text-indigo-600 rounded-lg hover:border-indigo-200 transition-all flex items-center space-x-1"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        <span className="text-xs font-semibold">Assign Room</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Assign Room Modal Popup */}
          {selectedStudent && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900 bg-opacity-50 p-4 backdrop-blur-xs">
              <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-fadeIn">
                <div className="bg-slate-800 p-4 text-white">
                  <h3 className="font-bold text-base">Reassign Room</h3>
                  <p className="text-xs text-slate-300">Set room for {selectedStudent.name}</p>
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
                      className="flex-1 border border-slate-200 rounded-xl py-2 text-center text-xs font-bold text-slate-500 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-slate-900 rounded-xl py-2 text-center text-xs font-bold text-white hover:bg-slate-800"
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
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Daily Attendance Log</h2>
              <p className="text-xs text-slate-500">Record hostel check-in present/absent logs.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <input
                type="date"
                className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
              />
              <button
                onClick={() => handleExportCSV("attendance")}
                className="flex items-center space-x-2 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-950 transition-all hover:bg-slate-50"
              >
                <Download className="h-4 w-4" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {attendanceSuccess && (
            <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-sm text-green-600">
              {attendanceSuccess}
            </div>
          )}

          {students.length === 0 ? (
            <p className="text-center py-12 text-slate-400 italic">No students registered to mark attendance.</p>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-150 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <th className="p-3">Student Name</th>
                      <th className="p-3">Room</th>
                      <th className="p-3 text-center">Status (Toggle)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {students.map((student) => (
                      <tr key={student.id} className="text-sm hover:bg-slate-50/50">
                        <td className="p-3 font-semibold text-slate-700">{student.name || "Incomplete Profile"}</td>
                        <td className="p-3">
                          <span className="text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                            {student.roomNumber || "Unassigned"}
                          </span>
                        </td>
                        <td className="p-3 flex justify-center">
                          <div className="inline-flex rounded-lg bg-slate-100 p-1 border border-slate-200">
                            <button
                              onClick={() =>
                                setAttendanceRecords((prev) => ({ ...prev, [student.id]: "present" }))
                              }
                              className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                                attendanceRecords[student.id] === "present"
                                  ? "bg-emerald-500 text-white shadow-sm"
                                  : "text-slate-500"
                              }`}
                            >
                              Present
                            </button>
                            <button
                              onClick={() =>
                                setAttendanceRecords((prev) => ({ ...prev, [student.id]: "absent" }))
                              }
                              className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                                attendanceRecords[student.id] === "absent"
                                  ? "bg-rose-500 text-white shadow-sm"
                                  : "text-slate-500"
                              }`}
                            >
                              Absent
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleSaveAttendance}
                  disabled={attendanceLoading}
                  className="px-6 rounded-xl bg-slate-900 py-3 text-center text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center"
                >
                  {attendanceLoading ? (
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></span>
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Save Attendance Sheet
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

                    <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full uppercase border text-center max-w-fit ${getStatusStyle(req.status)}`}>
                      {req.status}
                    </span>
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

                    <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full uppercase border text-center max-w-fit ${getStatusStyle(item.status)}`}>
                      {item.status}
                    </span>
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
                          className="w-full bg-slate-900 text-white rounded-lg py-2.5 text-center text-xs font-bold hover:bg-slate-800"
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
                className="w-full rounded-xl bg-slate-900 py-3 text-center text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center transition-all"
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
    </Layout>
  );
}
