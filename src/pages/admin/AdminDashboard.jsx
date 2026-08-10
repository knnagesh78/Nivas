import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { db, firebaseConfig } from "../../firebase";
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import {
  collection,
  query,
  getDocs,
  getDoc,
  setDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  serverTimestamp
} from "firebase/firestore";
import Layout from "../../components/Layout";
import {
  ShieldAlert,
  Users,
  DoorOpen,
  FileText,
  AlertCircle,
  Megaphone,
  Plus,
  Trash2,
  Lock,
  Mail,
  Check,
  X,
  Settings,
  Shield,
  Key,
  Search,
  GraduationCap,
  Eye,
  EyeOff
} from "lucide-react";

export default function AdminDashboard() {
  const { currentUser, userData, updateEmail, updatePassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "dashboard";
  const setTab = useCallback((tab) => setSearchParams({ tab }), [setSearchParams]);

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

  // Data logs
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalWardens: 0,
    totalRooms: 0,
    totalBeds: 0,
    occupiedBeds: 0,
    pendingLeaves: 0,
    openComplaints: 0,
    presentToday: 0
  });

  const [rooms, setRooms] = useState([]);
  const [wardens, setWardens] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [notices, setNotices] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const handleRemoveStudent = async (studentId, studentName) => {
    if (!window.confirm(`Are you sure you want to remove student "${studentName || "this student"}"? This will delete their student profile and user record.`)) {
      return;
    }
    try {
      await deleteDoc(doc(db, "students", studentId));
      await deleteDoc(doc(db, "users", studentId));
      setStudents(prev => prev.filter(s => s.id !== studentId));
      setStats(prev => ({ ...prev, totalStudents: Math.max(0, prev.totalStudents - 1) }));
      alert("Student removed successfully.");
    } catch (err) {
      console.error("Error removing student:", err);
      alert("Failed to remove student: " + err.message);
    }
  };

  const filteredStudents = students.filter(s => {
    const q = searchQuery.toLowerCase();
    return (
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.roomNumber && s.roomNumber.toLowerCase().includes(q)) ||
      (s.course && s.course.toLowerCase().includes(q)) ||
      (s.phone && s.phone.includes(q))
    );
  });

  // Form: Room creation
  const [roomNum, setRoomNum] = useState("");
  const [roomCapacity, setRoomCapacity] = useState(2);
  const [roomLoading, setRoomLoading] = useState(false);

  // Form: Warden creation
  const [wardenName, setWardenName] = useState("");
  const [wardenEmail, setWardenEmail] = useState("");
  const [wardenPassword, setWardenPassword] = useState("");
  const [showWardenPassword, setShowWardenPassword] = useState(false);
  const [wardenLoading, setWardenLoading] = useState(false);
  const [wardenSuccess, setWardenSuccess] = useState("");
  const [wardenError, setWardenError] = useState("");

  // Form: Admin Credentials settings
  const [adminEmail, setAdminEmail] = useState(currentUser?.email || "");
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [credLoading, setCredLoading] = useState(false);
  const [credSuccess, setCredSuccess] = useState("");
  const [credError, setCredError] = useState("");

  // Form: Notice posting
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeMsg, setNoticeMsg] = useState("");
  const [noticeLoading, setNoticeLoading] = useState(false);
  const [noticeSuccess, setNoticeSuccess] = useState("");

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

      // 3. Fetch Wardens
      const wardensSnap = await getDocs(collection(db, "wardens"));
      const wardensList = [];
      wardensSnap.forEach((doc) => {
        wardensList.push({ id: doc.id, ...doc.data() });
      });
      setWardens(wardensList);

      // 4. Fetch Leaves
      const leavesSnap = await getDocs(query(collection(db, "leaveRequests"), orderBy("requestedAt", "desc")));
      const leavesList = [];
      leavesSnap.forEach((doc) => {
        leavesList.push({ id: doc.id, ...doc.data() });
      });
      setLeaves(leavesList);

      // 5. Fetch Complaints
      const complaintsSnap = await getDocs(query(collection(db, "complaints"), orderBy("raisedAt", "desc")));
      const complaintsList = [];
      complaintsSnap.forEach((doc) => {
        complaintsList.push({ id: doc.id, ...doc.data() });
      });
      setComplaints(complaintsList);

      // 6. Fetch Notices
      const noticesSnap = await getDocs(query(collection(db, "notices"), orderBy("postedAt", "desc")));
      const noticesList = [];
      noticesSnap.forEach((doc) => {
        noticesList.push({ id: doc.id, ...doc.data() });
      });
      setNotices(noticesList);

      // 7. Today's Attendance summary
      const todayStr = new Date().toISOString().split("T")[0];
      const attSnap = await getDocs(collection(db, "attendance", todayStr, "records"));
      let presentTodayCount = 0;
      attSnap.forEach((doc) => {
        if (doc.data().status === "present") presentTodayCount++;
      });

      // Calculate stats
      const totalBeds = roomsList.reduce((acc, r) => acc + Number(r.capacity || 0), 0);
      const occupiedBeds = studentsList.filter((s) => s.roomNumber).length;
      
      setStats({
        totalStudents: studentsList.length,
        totalWardens: wardensList.length,
        totalRooms: roomsList.length,
        totalBeds,
        occupiedBeds,
        pendingLeaves: leavesList.filter((l) => l.status === "pending").length,
        openComplaints: complaintsList.filter((c) => c.status !== "resolved").length,
        presentToday: presentTodayCount
      });
    } catch (err) {
      console.error("Error fetching Admin statistics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // Create Room
  const handleAddRoom = async (e) => {
    e.preventDefault();
    if (!roomNum.trim() || roomCapacity <= 0) return;

    setRoomLoading(true);
    try {
      const roomId = `room_${roomNum.trim()}`;
      await setDoc(doc(db, "rooms", roomId), {
        roomNumber: roomNum.trim(),
        capacity: Number(roomCapacity),
        occupiedCount: 0,
        occupantUids: [],
        status: "available"
      });

      setRoomNum("");
      setRooms(prev => [
        ...prev,
        {
          id: roomId,
          roomNumber: roomNum.trim(),
          capacity: Number(roomCapacity)
        }
      ]);
      alert("Room added successfully!");
    } catch (err) {
      console.error("Error adding room:", err);
    } finally {
      setRoomLoading(false);
    }
  };

  // Delete Room
  const handleDeleteRoom = async (id) => {
    if (!window.confirm("Are you sure you want to delete this room?")) return;
    try {
      await deleteDoc(doc(db, "rooms", id));
      setRooms(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error("Error deleting room:", err);
    }
  };

  // Create Warden (using secondary auth application connection)
  const handleCreateWarden = async (e) => {
    e.preventDefault();
    setWardenLoading(true);
    setWardenSuccess("");
    setWardenError("");

    if (!wardenName.trim() || !wardenEmail.trim() || wardenPassword.length < 6) {
      setWardenError("Provide name, email, and at least a 6-character password.");
      setWardenLoading(false);
      return;
    }

    // Initialize temporary secondary App to prevent Admin log out
    const secondaryAppName = `SecondaryWardenApp_${Date.now()}`;
    const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
    const secondaryAuth = getAuth(secondaryApp);

    try {
      // 1. Sign up the warden in Firebase Auth
      const cred = await createUserWithEmailAndPassword(secondaryAuth, wardenEmail, wardenPassword);
      const uid = cred.user.uid;

      // 2. Write doc in /users
      await setDoc(doc(db, "users", uid), {
        email: wardenEmail.trim(),
        role: "warden"
      });

      // 3. Write doc in /wardens
      await setDoc(doc(db, "wardens", uid), {
        name: wardenName.trim(),
        createdAt: serverTimestamp()
      });

      // 4. Signout secondary app
      await secondaryAuth.signOut();

      setWardenSuccess(`Warden "${wardenName}" account created successfully!`);
      setWardenName("");
      setWardenEmail("");
      setWardenPassword("");

      // Refresh Wardens log
      setWardens(prev => [
        ...prev,
        { id: uid, name: wardenName.trim(), createdAt: new Date() }
      ]);
    } catch (err) {
      console.error("Error registering warden:", err);
      if (err.code === "auth/email-already-in-use") {
        setWardenError("This email address is already in use.");
      } else {
        setWardenError(err.message || "Failed to create warden account.");
      }
    } finally {
      setWardenLoading(false);
    }
  };

  // Delete Warden Account (deletes Firestore record, Auth requires admin tool, but removing from collection is basic step)
  const handleDeleteWarden = async (id) => {
    if (!window.confirm("Are you sure you want to remove this warden record?")) return;
    try {
      await deleteDoc(doc(db, "wardens", id));
      await deleteDoc(doc(db, "users", id)); // Remove role mapping
      setWardens(prev => prev.filter(w => w.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // Admin update credentials
  const handleUpdateCreds = async (e) => {
    e.preventDefault();
    setCredLoading(true);
    setCredSuccess("");
    setCredError("");

    try {
      if (adminEmail !== currentUser.email) {
        await updateEmail(adminEmail);
      }
      if (adminPassword) {
        await updatePassword(adminPassword);
      }
      setCredSuccess("Admin credentials updated successfully!");
      setAdminPassword("");
    } catch (err) {
      console.error(err);
      setCredError(err.message || "Failed to update credentials. Please re-authenticate and try again.");
    } finally {
      setCredLoading(false);
    }
  };

  // Post notice
  const handlePostNotice = async (e) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeMsg.trim()) return;

    setNoticeLoading(true);
    setNoticeSuccess("");

    try {
      const docRef = await addDoc(collection(db, "notices"), {
        title: noticeTitle.trim(),
        message: noticeMsg.trim(),
        postedBy: "admin",
        postedAt: serverTimestamp(),
        targetAudience: "all"
      });

      setNoticeTitle("");
      setNoticeMsg("");
      setNoticeSuccess("Announcement posted successfully!");
      
      setNotices(prev => [
        {
          id: docRef.id,
          title: noticeTitle.trim(),
          message: noticeMsg.trim(),
          postedBy: "admin",
          postedAt: new Date()
        },
        ...prev
      ]);
    } catch (err) {
      console.error("Error posting notice:", err);
    } finally {
      setNoticeLoading(false);
    }
  };

  // Action Leave Override
  const handleOverrideLeave = async (requestId, status) => {
    try {
      await updateDoc(doc(db, "leaveRequests", requestId), {
        status,
        reviewedBy: currentUser.uid,
        reviewedAt: serverTimestamp(),
        wardenRemark: `Status overridden by Admin (${userData?.email})`
      });

      setLeaves(prev =>
        prev.map(l => (l.id === requestId ? { ...l, status, wardenRemark: "Overridden by Admin" } : l))
      );
      alert("Leave request overridden!");
    } catch (err) {
      console.error(err);
    }
  };

  // Action Complaint Override
  const handleOverrideComplaint = async (complaintId, status) => {
    try {
      const updates = { status };
      if (status === "resolved") {
        updates.resolvedBy = currentUser.uid;
        updates.resolvedAt = serverTimestamp();
        updates.wardenRemark = "Resolved by Admin override";
      }
      await updateDoc(doc(db, "complaints", complaintId), {
        ...updates
      });

      setComplaints(prev =>
        prev.map(c => (c.id === complaintId ? { ...c, ...updates } : c))
      );
      alert("Complaint status overridden!");
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Complaint
  const handleDeleteComplaint = async (id) => {
    if (!window.confirm("Are you sure you want to delete this complaint?")) return;
    try {
      await deleteDoc(doc(db, "complaints", id));
      setComplaints(prev => prev.filter(c => c.id !== id));
      // update stats count
      setStats(prev => {
        const item = complaints.find(c => c.id === id);
        const isOpen = item && item.status !== "resolved";
        return {
          ...prev,
          openComplaints: isOpen ? prev.openComplaints - 1 : prev.openComplaints
        };
      });
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
      setLeaves(prev => prev.filter(l => l.id !== id));
      // update stats count
      setStats(prev => {
        const item = leaves.find(l => l.id === id);
        const isPending = item && item.status === "pending";
        return {
          ...prev,
          pendingLeaves: isPending ? prev.pendingLeaves - 1 : prev.pendingLeaves
        };
      });
      alert("Leave request deleted successfully!");
    } catch (err) {
      console.error("Error deleting leave request:", err);
      alert("Failed to delete leave request.");
    }
  };

  if (loading) {
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
    <Layout activeTab={activeTab} setActiveTab={setTab}>
      {/* 1. Dashboard / Statistics */}
      {activeTab === "dashboard" && (
        <div className="space-y-6 animate-fadeIn">
          <div className="rounded-3xl bg-indigo-900 p-6 sm:p-8 text-white relative overflow-hidden shadow-xl">
            <div className="relative z-10 space-y-2">
              <h2 className="text-3xl font-bold tracking-tight">Hostel Control Panel</h2>
              <p className="text-indigo-200 text-sm max-w-md">
                Administrator view. Manage rooms, register wardens, override requests, or adjust settings.
              </p>
            </div>
            <div className="absolute right-8 bottom-4 text-[10rem] font-bold text-indigo-850 opacity-20 pointer-events-none uppercase">
              Admin
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Students</span>
                <p className="text-3xl font-extrabold text-slate-800 mt-1">{stats.totalStudents}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600">
                <Users className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Wardens</span>
                <p className="text-3xl font-extrabold text-indigo-600 mt-1">{stats.totalWardens}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Shield className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rooms Configured</span>
                <p className="text-3xl font-extrabold text-slate-800 mt-1">{stats.totalRooms}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600">
                <DoorOpen className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Beds Occupied</span>
                <p className="text-3xl font-extrabold text-emerald-600 mt-1">
                  {stats.occupiedBeds} / {stats.totalBeds}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <DoorOpen className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Overrides logs */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-800 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-amber-500" />
                Active Leave Requests ({leaves.filter(l => l.status === "pending").length})
              </h3>
              
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {leaves.map((req) => (
                  <div key={req.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-slate-700">{req.studentName} (Room: {req.roomNumber})</p>
                      <p className="text-slate-400 mt-0.5">{req.fromDate} to {req.toDate}</p>
                    </div>
                    
                    <div className="flex space-x-1 items-center">
                      {req.status === "pending" ? (
                        <>
                          <button
                            onClick={() => handleOverrideLeave(req.id, "rejected")}
                            className="p-1 border border-red-200 rounded-lg text-red-500 hover:bg-red-50"
                            title="Reject Override"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleOverrideLeave(req.id, "approved")}
                            className="p-1 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
                            title="Approve Override"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <span className={`px-2 py-0.5 mr-1 text-[9px] font-bold rounded-full uppercase border ${getStatusStyle(req.status)}`}>
                            {req.status}
                          </span>
                          <button
                            onClick={() => handleDeleteLeave(req.id)}
                            className="p-1.5 border border-slate-200 hover:border-red-200 text-slate-400 hover:text-red-500 rounded-lg transition-all"
                            title="Delete Leave Request"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {leaves.length === 0 && <p className="text-xs text-slate-400 italic">No leaves records.</p>}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-800 flex items-center">
                <AlertCircle className="h-5 w-5 mr-2 text-rose-500" />
                Open Student Complaints ({complaints.filter(c => c.status !== "resolved").length})
              </h3>
              
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {complaints.map((item) => (
                  <div key={item.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
                    <div className="max-w-[70%]">
                      <p className="font-bold text-slate-700 truncate">{item.category.toUpperCase()}: {item.description}</p>
                      <p className="text-slate-400 mt-0.5">{item.studentName} | Room {item.roomNumber}</p>
                    </div>

                    {item.status !== "resolved" ? (
                      <button
                        onClick={() => handleOverrideComplaint(item.id, "resolved")}
                        className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold"
                      >
                        Resolve
                      </button>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase border ${getStatusStyle(item.status)}`}>
                          {item.status}
                        </span>
                        <button
                          onClick={() => handleDeleteComplaint(item.id)}
                          className="p-1.5 border border-slate-200 hover:border-red-200 text-slate-400 hover:text-red-500 rounded-lg transition-all"
                          title="Delete Complaint"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {complaints.length === 0 && <p className="text-xs text-slate-400 italic">No open complaints.</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student Manager Tab */}
      {activeTab === "students" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Student Directory & Removal</h2>
              <p className="text-xs text-slate-500">View student profile records and remove accounts when necessary.</p>
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
                  <th className="pb-3 text-right">Action</th>
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
                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => handleRemoveStudent(s.id, s.name)}
                        className="p-2 border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg transition-all inline-flex items-center space-x-1 cursor-pointer"
                        title="Remove Student"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="text-xs font-semibold">Remove</span>
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-slate-400 italic">
                      No students found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Room Configuration */}
      {activeTab === "rooms" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          {/* Add Room form */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-fit space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Add Hostel Room</h2>
              <p className="text-xs text-slate-500">Configure new spaces with set bed capacities.</p>
            </div>

            <form onSubmit={handleAddRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Room Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. A-102"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-sm"
                  value={roomNum}
                  onChange={(e) => setRoomNum(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Bed Capacity
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  required
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-sm"
                  value={roomCapacity}
                  onChange={(e) => setRoomCapacity(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={roomLoading}
                className="w-full rounded-xl bg-slate-900 py-3 text-center text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center"
              >
                {roomLoading ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Configure Room
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Room configuration listing */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Rooms Configuration Log</h2>
            {rooms.length === 0 ? (
              <p className="text-center py-12 text-slate-400 italic">No rooms registered.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <th className="pb-3">Room Number</th>
                      <th className="pb-3">Capacity</th>
                      <th className="pb-3 text-right">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rooms.map((room) => (
                      <tr key={room.id} className="text-sm">
                        <td className="py-3 font-semibold text-slate-700">Room {room.roomNumber}</td>
                        <td className="py-3 text-slate-500">{room.capacity} Beds</td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => handleDeleteRoom(room.id)}
                            className="p-1.5 border border-slate-200 hover:border-red-200 text-slate-400 hover:text-red-500 rounded-lg transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Manage Wardens */}
      {activeTab === "wardens" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          {/* Create Warden form */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-fit space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Create Warden Account</h2>
              <p className="text-xs text-slate-500">Register new staff/warden users directly.</p>
            </div>

            {wardenSuccess && (
              <div className="rounded-xl bg-green-50 border border-green-200 p-3 text-xs text-green-600">
                {wardenSuccess}
              </div>
            )}

            {wardenError && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-600">
                {wardenError}
              </div>
            )}

            <form onSubmit={handleCreateWarden} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vishnu Vardhan"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-sm"
                  value={wardenName}
                  onChange={(e) => setWardenName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Warden Email
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Mail className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="e.g. warden@hostel.com"
                    className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-4 text-sm"
                    value={wardenEmail}
                    onChange={(e) => setWardenEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type={showWardenPassword ? "text" : "password"}
                    required
                    placeholder="Min 6 characters"
                    className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-10 text-sm"
                    value={wardenPassword}
                    onChange={(e) => setWardenPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowWardenPassword(!showWardenPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    title={showWardenPassword ? "Hide password" : "Show password"}
                  >
                    {showWardenPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={wardenLoading}
                className="w-full rounded-xl bg-slate-900 py-3 text-center text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center"
              >
                {wardenLoading ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Register Warden
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Warden list */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Wardens List</h2>
            {wardens.length === 0 ? (
              <p className="text-center py-12 text-slate-400 italic">No warden accounts configured.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <th className="pb-3">Name</th>
                      <th className="pb-3">Role</th>
                      <th className="pb-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {wardens.map((w) => (
                      <tr key={w.id} className="text-sm">
                        <td className="py-3 font-semibold text-slate-700">{w.name}</td>
                        <td className="py-3">
                          <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 uppercase tracking-wide">
                            Warden
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => handleDeleteWarden(w.id)}
                            className="p-1.5 border border-slate-200 hover:border-red-200 text-slate-400 hover:text-red-500 rounded-lg transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Hostel Notices (Admins post notices) */}
      {activeTab === "notices" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          {/* Post Notice Form */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-fit space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Post Announcement</h2>
              <p className="text-xs text-slate-500">Post notification banners to student feeds.</p>
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
                  placeholder="e.g. Mess Closed on Sunday Night"
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
                  value={noticeMsg}
                  onChange={(e) => setNoticeMsg(e.target.value)}
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
                      onClick={async () => {
                        if (!window.confirm("Are you sure?")) return;
                        await deleteDoc(doc(db, "notices", n.id));
                        setNotices(prev => prev.filter(item => item.id !== n.id));
                      }}
                      className="absolute top-4 right-4 text-xs font-bold text-rose-600 hover:underline"
                    >
                      Delete Notice
                    </button>
                    <div>
                      <h4 className="font-bold text-sm text-slate-800">{n.title}</h4>
                      <span className="text-[10px] text-slate-400">
                        Posted: {n.postedAt?.toDate ? n.postedAt.toDate().toLocaleString() : "Just now"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{n.message}</p>
                    <p className="text-[9px] font-semibold text-indigo-500">Author: {n.postedBy}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. Settings Tab (change own credentials) */}
      {activeTab === "settings" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm max-w-xl mx-auto space-y-6 animate-fadeIn">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center">
              <Settings className="h-5 w-5 mr-2 text-indigo-600" />
              Settings & Credentials
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Change your Administrator login credentials.</p>
          </div>

          {credSuccess && (
            <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-sm text-green-600">
              {credSuccess}
            </div>
          )}

          {credError && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-600">
              {credError}
            </div>
          )}

          <form onSubmit={handleUpdateCreds} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                Admin Email Address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-4 text-sm focus:border-indigo-500 focus:outline-none"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
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
                  type={showAdminPassword ? "text" : "password"}
                  placeholder="Min 6 characters"
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-10 text-sm focus:border-indigo-500 focus:outline-none"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPassword(!showAdminPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  title={showAdminPassword ? "Hide password" : "Show password"}
                >
                  {showAdminPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={credLoading}
                className="w-full sm:w-auto px-6 rounded-xl bg-slate-900 py-3 text-center text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center justify-center"
              >
                {credLoading ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                ) : (
                  "Update Settings"
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </Layout>
  );
}
