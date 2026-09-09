import React, { useState } from "react";
import { ShieldAlert, KeyRound, CheckCircle2 } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function PinSetupModal({ studentUid, onComplete }) {
  const [idNumber, setIdNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!idNumber.trim()) {
      setError("Identification Number cannot be empty.");
      return;
    }

    setLoading(true);
    try {
      await updateDoc(doc(db, "students", studentUid), {
        idNumber: idNumber.trim()
      });
      setSuccess(true);
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 1500);
    } catch (err) {
      console.error("Error setting ID Number:", err);
      setError("Failed to save Identification Number. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/45 backdrop-blur-md p-4 animate-fadeIn">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        
        {/* Background ambient glow */}
        <div className="absolute -top-20 -right-20 h-64 w-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 text-center mb-6">
          <div className="h-16 w-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-200 shadow-sm">
            <ShieldAlert className="h-8 w-8 text-rose-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Identification Required</h2>
          <p className="text-sm text-slate-600">
            Nivas now supports a <strong>Parent Portal</strong>. Please set your Student Identification Number so your parents can log in securely.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-rose-50 border border-rose-200 rounded-xl text-center">
            <p className="text-xs font-bold text-rose-600">{error}</p>
          </div>
        )}

        {success ? (
          <div className="py-6 text-center animate-fadeIn">
            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900 mb-1">ID Saved Successfully!</h3>
            <p className="text-xs text-slate-500">Taking you to dashboard...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="relative z-10 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                Student Identification Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. 24170-cm-028"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-3 pl-10 pr-4 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all font-mono tracking-widest text-center"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all flex justify-center items-center cursor-pointer shadow-lg shadow-indigo-600/20 disabled:opacity-50"
            >
              {loading ? (
                <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                "Save & Continue"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
