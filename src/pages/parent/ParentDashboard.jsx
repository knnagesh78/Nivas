import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { LogOut, Home, Calendar, Clock, AlertCircle, FileText, User } from "lucide-react";

export default function ParentDashboard() {
  const { currentUser, userData, logout } = useAuth();
  const navigate = useNavigate();

  const [studentDetails, setStudentDetails] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser || userData?.role !== "parent" || !userData?.linkedStudentId) {
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      try {
        const studentUid = userData.linkedStudentId;
        
        // Fetch Student Profile
        const studentDoc = await getDoc(doc(db, "students", studentUid));
        if (studentDoc.exists()) {
          setStudentDetails(studentDoc.data());
        }

        // Fetch Attendance via collectionGroup
        // Note: the rules for collection group queries require uniform rules, so we'll fetch them individually if there are issues,
        // but for now, we'll use collectionGroup("records"). Make sure the documents have studentUid field!
        // Wait, WardenDashboard doesn't write studentUid. To fix this without migrating data, 
        // we can just fetch the dates and then fetch the specific student's record for each date.
        const datesSnap = await getDocs(collection(db, "attendance"));
        const attList = [];
        for (const dateDoc of datesSnap.docs) {
          const recordDoc = await getDoc(doc(db, "attendance", dateDoc.id, "records", studentUid));
          if (recordDoc.exists()) {
            attList.push({ id: dateDoc.id, date: dateDoc.id, ...recordDoc.data() });
          }
        }
        attList.sort((a, b) => b.date.localeCompare(a.date));
        setAttendance(attList);

        // Fetch Leaves
        const leavesQuery = query(collection(db, "leaveRequests"), where("studentUid", "==", studentUid));
        const leavesSnap = await getDocs(leavesQuery);
        const leavesList = [];
        leavesSnap.forEach(d => leavesList.push({ id: d.id, ...d.data() }));
        leavesList.sort((a, b) => (b.requestedAt?.toMillis() || 0) - (a.requestedAt?.toMillis() || 0));
        setLeaves(leavesList);

        // Fetch Complaints
        const compQuery = query(collection(db, "complaints"), where("studentUid", "==", studentUid));
        const compSnap = await getDocs(compQuery);
        const compList = [];
        compSnap.forEach(d => compList.push({ id: d.id, ...d.data() }));
        compList.sort((a, b) => (b.raisedAt?.toMillis() || 0) - (a.raisedAt?.toMillis() || 0));
        setComplaints(compList);

      } catch (err) {
        console.error("Error fetching parent dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser, userData, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold">Parent Portal</h1>
            <p className="text-xs text-slate-500">Viewing: {studentDetails?.name || "Student"}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center space-x-2 text-xs font-bold text-rose-500 hover:text-rose-600 bg-rose-50 dark:bg-rose-950/30 px-3 py-2 rounded-lg transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        
        {/* Profile Summary */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex flex-col sm:flex-row items-center gap-6 shadow-sm">
          {studentDetails?.photoUrl ? (
            <img src={studentDetails.photoUrl} alt="Student" className="h-24 w-24 rounded-full object-cover border-4 border-slate-100 dark:border-slate-800 shadow-lg" />
          ) : (
            <div className="h-24 w-24 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-500 border-4 border-slate-100 dark:border-slate-800 shadow-lg">
              <User className="h-10 w-10" />
            </div>
          )}
          <div className="text-center sm:text-left">
            <h2 className="text-2xl font-black">{studentDetails?.name || "No Name Provided"}</h2>
            <p className="text-slate-500 text-sm mt-1">{studentDetails?.course || "Course N/A"} • Room {studentDetails?.roomNumber || "Unassigned"}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Attendance Section */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center space-x-3 pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-500">
                <Calendar className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold">Recent Attendance</h3>
            </div>
            {attendance.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No attendance records found.</p>
            ) : (
              <div className="space-y-3">
                {attendance.slice(0, 5).map(record => (
                  <div key={record.id} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                    <span className="text-sm font-semibold">{record.date}</span>
                    <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-full ${
                      record.status === "Present" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                      record.status === "Absent" ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" :
                      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    }`}>
                      {record.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Leave Requests */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center space-x-3 pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-500">
                <Clock className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold">Leave Requests</h3>
            </div>
            {leaves.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No leave requests found.</p>
            ) : (
              <div className="space-y-3">
                {leaves.slice(0, 5).map(leave => (
                  <div key={leave.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{leave.fromDate} to {leave.toDate}</span>
                      <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-full ${
                        leave.status === "approved" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                        leave.status === "rejected" ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" :
                        "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      }`}>
                        {leave.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{leave.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Complaints */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm md:col-span-2">
            <div className="flex items-center space-x-3 pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-500">
                <AlertCircle className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold">Complaints / Issues</h3>
            </div>
            {complaints.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No complaints raised.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {complaints.map(comp => (
                  <div key={comp.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold uppercase text-slate-900 dark:text-slate-100">{comp.category}</span>
                      <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-full ${
                        comp.status === "resolved" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      }`}>
                        {comp.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2">{comp.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
