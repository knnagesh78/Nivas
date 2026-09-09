import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { X, Calendar, AlertCircle, CheckCircle2, XCircle, Clock, Phone, User, Hash } from "lucide-react";

export default function StudentAttendanceModal({ student, onClose }) {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    if (!student) return;

    const fetchAttendance = async () => {
      setLoading(true);
      try {
        // 1. Fetch approved leaves for this student to cross-reference
        let approvedLeaves = [];
        try {
          const leavesSnap = await getDocs(collection(db, "leaveRequests"));
          approvedLeaves = leavesSnap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(l => (l.studentUid === student.id || l.studentId === student.id) && l.status === "approved");
        } catch (e) {
          console.warn("Could not query leaves:", e);
        }

        const last30Days = [];
        for (let i = 0; i < 30; i++) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, "0");
          const day = String(d.getDate()).padStart(2, "0");
          const dateStr = `${year}-${month}-${day}`;
          last30Days.push({
            date: dateStr,
            dayName: d.toLocaleDateString("en-US", { weekday: "short" })
          });
        }

        const attendancePromises = last30Days.map(async ({ date, dayName }) => {
          try {
            const recordDoc = await getDoc(
              doc(db, "attendance", date, "records", student.id)
            );
            if (recordDoc.exists()) {
              const data = recordDoc.data();
              return {
                date,
                dayName,
                status: data.status || "present",
                updatedAt: data.updatedAt
              };
            }
          } catch (e) {
            console.error(`Error reading attendance for ${date}:`, e);
          }

          // Check if student was on approved leave on this date
          const onLeave = approvedLeaves.find(l => {
            const from = l.fromDate || l.startDate;
            const to = l.toDate || l.endDate;
            return from && to && date >= from && date <= to;
          });
          if (onLeave) {
            return {
              date,
              dayName,
              status: "leave",
              reason: onLeave.reason || "Approved Leave"
            };
          }

          return { date, dayName, status: "Not Marked" };
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
  const leave = attendance.filter((r) => r.status === "leave").length;
  const rate = total > 0 ? Math.round(((present + leave) / total) * 100) : 100;

  const filteredAttendance = attendance.filter((r) => {
    if (filterStatus === "all") return true;
    return r.status === filterStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "present":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Present
          </span>
        );
      case "absent":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-bold rounded-full bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="h-3 w-3 mr-1" />
            Absent
          </span>
        );
      case "leave":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="h-3 w-3 mr-1" />
            On Leave
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
      <div
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-100 bg-slate-50 shrink-0">
          <div className="flex items-center space-x-4">
            <div className="h-14 w-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xl shadow-xs overflow-hidden shrink-0">
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
                <h2 className="text-xl font-black text-slate-900 dark:text-white">{student.name || "Student"}</h2>
                {student.idNumber && (
                  <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 text-indigo-700 dark:text-indigo-300 text-[11px] font-extrabold">
                    #{student.idNumber}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 font-semibold mt-1">
                <span className="bg-slate-200/70 dark:bg-slate-800 px-2 py-0.5 rounded">
                  Room {student.roomNumber || "Unassigned"}
                </span>
                <span>•</span>
                <span>{student.course || "Course N/A"} {student.year ? `(${student.year})` : ""}</span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 text-[11px] text-slate-400 mt-1.5">
                {student.phone && (
                  <span className="flex items-center">
                    <Phone className="h-3 w-3 mr-1 text-slate-400" />
                    Student: <strong className="ml-1 text-slate-600 dark:text-slate-300">{student.phone}</strong>
                  </span>
                )}
                {student.parentContact && (
                  <span className="flex items-center">
                    <Phone className="h-3 w-3 mr-1 text-amber-500" />
                    Parent: <strong className="ml-1 text-slate-600 dark:text-slate-300">{student.parentContact}</strong>
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-200/50 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div className="py-20 flex flex-col justify-center items-center space-y-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600"></div>
              <span className="text-xs text-slate-400 font-semibold">Loading attendance records from database...</span>
            </div>
          ) : (
            <>
              {/* Summary Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 p-4 rounded-2xl flex flex-col justify-center">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Attendance</span>
                  <div className="flex items-baseline space-x-1 mt-1">
                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{rate}%</span>
                    <span className="text-[10px] text-slate-400">Rate</span>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex flex-col justify-center items-center text-center">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Present</span>
                  <span className="text-2xl font-black text-emerald-600 mt-1">{present}</span>
                  <span className="text-[10px] text-slate-400">Days Marked</span>
                </div>

                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex flex-col justify-center items-center text-center">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Absent</span>
                  <span className="text-2xl font-black text-rose-500 mt-1">{absent}</span>
                  <span className="text-[10px] text-slate-400">Days Missed</span>
                </div>

                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex flex-col justify-center items-center text-center">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">On Leave</span>
                  <span className="text-2xl font-black text-amber-500 mt-1">{leave}</span>
                  <span className="text-[10px] text-slate-400">Days Approved</span>
                </div>
              </div>

              {/* Attendance Log Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                <div className="bg-slate-50 p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-indigo-500" />
                    <h3 className="text-sm font-bold text-slate-800">
                      Detailed Log (Last 30 Days) - {total} Days Recorded
                    </h3>
                  </div>

                  {/* Filter tabs */}
                  <div className="flex items-center space-x-1 bg-slate-200/60 p-1 rounded-xl text-xs">
                    <button
                      onClick={() => setFilterStatus("all")}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                        filterStatus === "all" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500"
                      }`}
                    >
                      All ({total})
                    </button>
                    <button
                      onClick={() => setFilterStatus("present")}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                        filterStatus === "present" ? "bg-emerald-500 text-white shadow-xs" : "text-slate-500"
                      }`}
                    >
                      Present ({present})
                    </button>
                    <button
                      onClick={() => setFilterStatus("absent")}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                        filterStatus === "absent" ? "bg-rose-500 text-white shadow-xs" : "text-slate-500"
                      }`}
                    >
                      Absent ({absent})
                    </button>
                    {leave > 0 && (
                      <button
                        onClick={() => setFilterStatus("leave")}
                        className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                          filterStatus === "leave" ? "bg-amber-500 text-white shadow-xs" : "text-slate-500"
                        }`}
                      >
                        Leave ({leave})
                      </button>
                    )}
                  </div>
                </div>

                {filteredAttendance.length === 0 ? (
                  <div className="p-10 text-center">
                    <AlertCircle className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-600 font-semibold">No attendance records matching filter.</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {total === 0
                        ? "No attendance has been submitted for this student in the last 30 days."
                        : "Try switching to 'All' to view all recorded dates."}
                    </p>
                  </div>
                ) : (
                  <div className="max-h-72 overflow-y-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50 sticky top-0 backdrop-blur-xs">
                        <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          <th className="py-2.5 px-5">Date</th>
                          <th className="py-2.5 px-5">Day</th>
                          <th className="py-2.5 px-5 text-right">Attendance Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredAttendance.map((record) => (
                          <tr
                            key={record.date}
                            className="text-sm hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                          >
                            <td className="py-3 px-5 font-semibold text-slate-800 dark:text-slate-200">
                              {record.date}
                            </td>
                            <td className="py-3 px-5 text-xs text-slate-400">
                              {record.dayName}
                            </td>
                            <td className="py-3 px-5 text-right">
                              {getStatusBadge(record.status)}
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
