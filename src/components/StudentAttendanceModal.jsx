import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { X, Calendar, User, Clock, AlertCircle } from "lucide-react";

export default function StudentAttendanceModal({ student, onClose }) {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!student) return;

    const fetchAttendance = async () => {
      setLoading(true);
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
              doc(db, "attendance", dateStr, "records", student.id)
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
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [student]);

  if (!student) return null;

  const total = attendance.length;
  const present = attendance.filter((r) => r.status === "present").length;
  const absent = attendance.filter((r) => r.status === "absent").length;
  const rate = total > 0 ? Math.round((present / total) * 100) : 100;

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 shrink-0">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xl">
              {student.photoUrl ? (
                <img src={student.photoUrl} alt="Avatar" className="h-full w-full rounded-full object-cover" onError={(e) => e.target.style.display='none'} />
              ) : (
                student.name ? student.name[0].toUpperCase() : "S"
              )}
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">{student.name || "Student"}</h2>
              <p className="text-xs font-semibold text-slate-500 flex items-center space-x-2">
                <span>Room: {student.roomNumber || "Unassigned"}</span>
                <span>•</span>
                <span>{student.course || "N/A"}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-200/50 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div className="py-20 flex justify-center items-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600"></div>
            </div>
          ) : (
            <>
              {/* Summary Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 p-5 rounded-2xl flex flex-col justify-center">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Attendance Rate</span>
                  <div className="flex items-baseline space-x-2 mt-1">
                    <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{rate}%</span>
                    <span className="text-xs text-slate-400">Last 30 Days</span>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl flex flex-col justify-center items-center text-center">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Present</span>
                  <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{present}</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Days Marked</span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl flex flex-col justify-center items-center text-center">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Absent</span>
                  <span className="text-3xl font-black text-rose-500 mt-1">{absent}</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Days Missed</span>
                </div>
              </div>

              {/* Attendance Log Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
                <div className="bg-slate-50 dark:bg-slate-950/60 p-4 border-b border-slate-200 dark:border-slate-800 flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">Detailed Log (Last 30 Days)</h3>
                </div>
                
                {attendance.length === 0 ? (
                  <div className="p-8 text-center">
                    <AlertCircle className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500 font-medium">No attendance records found.</p>
                    <p className="text-xs text-slate-400 mt-1">Attendance has not been tracked for this student in the last 30 days.</p>
                  </div>
                ) : (
                  <div className="max-h-60 overflow-y-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50/50 dark:bg-slate-900/50 sticky top-0 backdrop-blur-md">
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
                          <th className="py-3 px-6">Date</th>
                          <th className="py-3 px-6">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {attendance.map((record) => (
                          <tr key={record.date} className="text-sm hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="py-3 px-6 font-semibold text-slate-700 dark:text-slate-300">{record.date}</td>
                            <td className="py-3 px-6">
                              <span className={`inline-flex px-2.5 py-1 text-[10px] font-bold rounded-full uppercase border ${getStatusStyle(record.status)}`}>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
