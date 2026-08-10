import React, { useState } from "react";
import {
  X,
  MapPin,
  Calendar,
  User,
  Tag,
  CheckCircle,
  AlertCircle,
  Clock,
  ShieldCheck,
  Package,
  Handshake,
  ExternalLink
} from "lucide-react";

export default function ItemDetailModal({
  isOpen,
  onClose,
  item,
  currentUser,
  userData,
  onReportFound,
  onOpenSubmitProof,
  onWardenApprove
}) {
  const [finderNote, setFinderNote] = useState("");
  const [showFinderInput, setShowFinderInput] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  if (!isOpen || !item) return null;

  const isOwner = item.reporterUid === currentUser?.uid;
  const isWarden = userData?.role === "warden" || userData?.role === "admin";
  const isFinder = item.finderUid === currentUser?.uid;

  const handleFinderSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await onReportFound(item.id, finderNote);
      setShowFinderInput(false);
      setFinderNote("");
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleWardenConfirm = async () => {
    if (!window.confirm("Confirm that you have physically verified ownership and handed over this item?")) {
      return;
    }
    setActionLoading(true);
    try {
      await onWardenApprove(item.id);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "LOST":
        return {
          label: "LOST",
          bg: "bg-rose-100 text-rose-800 border-rose-200",
          bannerBg: "bg-rose-50 border-rose-200 text-rose-900",
          icon: AlertCircle,
          bannerText: "This item is currently missing. If you found it, click 'I Found This Item' below."
        };
      case "FOUND_PENDING":
        return {
          label: "FOUND (PROOF REQUIRED)",
          bg: "bg-amber-100 text-amber-800 border-amber-200",
          bannerBg: "bg-amber-50 border-amber-200 text-amber-900",
          icon: Clock,
          bannerText: isOwner
            ? "Your item was reported found! Please submit proof of ownership to initiate handover verification."
            : "Item reported found! Awaiting owner to submit proof of ownership."
        };
      case "PROOF_SUBMITTED":
        return {
          label: "PROOF SUBMITTED",
          bg: "bg-indigo-100 text-indigo-800 border-indigo-200",
          bannerBg: "bg-indigo-50 border-indigo-200 text-indigo-900",
          icon: Package,
          bannerText: "Proof of ownership submitted! Currently awaiting Warden Verification and handover scheduling."
        };
      case "RESOLVED":
        return {
          label: "RESOLVED",
          bg: "bg-emerald-100 text-emerald-800 border-emerald-200",
          bannerBg: "bg-emerald-50 border-emerald-200 text-emerald-900",
          icon: ShieldCheck,
          bannerText: "This item has been successfully verified and handed over to its owner."
        };
      default:
        return {
          label: status,
          bg: "bg-slate-100 text-slate-800 border-slate-200",
          bannerBg: "bg-slate-50 border-slate-200 text-slate-900",
          icon: AlertCircle,
          bannerText: ""
        };
    }
  };

  const statusConfig = getStatusBadge(item.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900 bg-opacity-60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-fadeIn flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1 text-xs font-black uppercase tracking-wider rounded-full border ${statusConfig.bg}`}>
              {statusConfig.label}
            </span>
            <span className="text-xs text-slate-400 font-mono">#{item.id.substring(0, 7)}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Status Indicator Banner */}
          <div className={`p-4 rounded-2xl border flex items-start space-x-3 ${statusConfig.bannerBg}`}>
            <StatusIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div className="text-xs font-semibold leading-relaxed">
              {statusConfig.bannerText}
            </div>
          </div>

          {/* Main Info Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Image */}
            <div>
              {item.imageUrl ? (
                <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 max-h-64 flex items-center justify-center">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-64 object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ) : (
                <div className="h-56 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-400 space-y-2">
                  <Package className="h-10 w-10 text-slate-300" />
                  <span className="text-xs font-medium">No Reference Image Provided</span>
                </div>
              )}
            </div>

            {/* Right: Item Metadata */}
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                  {item.category}
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-2 tracking-tight">
                  {item.title}
                </h2>
              </div>

              <div className="space-y-2 text-xs text-slate-600 border-t border-b border-slate-100 py-3">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  <span>
                    <strong className="text-slate-700">Last Seen:</strong> {item.location}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  <span>
                    <strong className="text-slate-700">Posted On:</strong>{" "}
                    {item.createdAt?.toDate
                      ? item.createdAt.toDate().toLocaleString()
                      : "Recently"}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  <span>
                    <strong className="text-slate-700">Reporter:</strong>{" "}
                    {item.reporterName} ({item.reporterRoom ? `Room ${item.reporterRoom}` : "Student"})
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Description
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {item.description}
                </p>
              </div>
            </div>
          </div>

          {/* Finder Info & Proof Information if present */}
          {(item.finderName || item.proofDetails) && (
            <div className="border-t border-slate-200 pt-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center space-x-2">
                <Handshake className="h-4 w-4 text-indigo-600" />
                <span>Handover & Verification Details</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Finder Info */}
                {item.finderName && (
                  <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl space-y-1 text-xs">
                    <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                      Finder Information
                    </span>
                    <p className="font-bold text-slate-900">{item.finderName}</p>
                    <p className="text-slate-500">Room: {item.finderRoom || "N/A"}</p>
                    {item.finderNote && (
                      <p className="text-slate-600 italic pt-1 text-[11px]">
                        "{item.finderNote}"
                      </p>
                    )}
                  </div>
                )}

                {/* Owner Submitted Proof Info */}
                {item.proofDetails && (
                  <div className="bg-indigo-50/50 border border-indigo-100 p-3.5 rounded-2xl space-y-1 text-xs">
                    <span className="font-bold text-indigo-900 uppercase tracking-wider text-[10px]">
                      Submitted Proof of Ownership
                    </span>
                    <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                      {item.proofDetails}
                    </p>
                    {item.proofImageUrl && (
                      <div className="pt-2">
                        <img
                          src={item.proofImageUrl}
                          alt="Proof"
                          className="h-24 w-full object-cover rounded-xl border border-indigo-200"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Contextual Action Controls */}
          <div className="pt-4 border-t border-slate-200">
            {/* 1. LOST status -> Non-owner sees "I Found This Item" */}
            {item.status === "LOST" && !isOwner && (
              <div className="space-y-3">
                {!showFinderInput ? (
                  <button
                    onClick={() => setShowFinderInput(true)}
                    className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2"
                  >
                    <Handshake className="h-5 w-5" />
                    <span>I Found This Item</span>
                  </button>
                ) : (
                  <form onSubmit={handleFinderSubmit} className="bg-indigo-50 border border-indigo-200 p-4 rounded-2xl space-y-3">
                    <h4 className="text-xs font-bold text-indigo-900 uppercase">
                      Confirm Found Item Details
                    </h4>
                    <input
                      type="text"
                      placeholder="Optional note e.g. Left with Warden / Kept safely in Room 204"
                      className="w-full rounded-xl border border-indigo-200 p-2.5 text-xs bg-white focus:outline-none"
                      value={finderNote}
                      onChange={(e) => setFinderNote(e.target.value)}
                    />
                    <div className="flex space-x-2 pt-1">
                      <button
                        type="submit"
                        disabled={actionLoading}
                        className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs disabled:opacity-50"
                      >
                        {actionLoading ? "Submitting..." : "Send Found Notification"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowFinderInput(false)}
                        className="px-4 py-2 bg-white border border-slate-200 text-slate-600 font-semibold text-xs rounded-xl hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* 2. FOUND_PENDING status -> Owner sees "Submit Proof of Ownership" */}
            {item.status === "FOUND_PENDING" && isOwner && (
              <button
                onClick={() => {
                  onClose();
                  onOpenSubmitProof(item);
                }}
                className="w-full py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 animate-bounce"
              >
                <ShieldCheck className="h-5 w-5" />
                <span>Submit Proof of Ownership</span>
              </button>
            )}

            {/* 3. PROOF_SUBMITTED status -> Warden action */}
            {item.status === "PROOF_SUBMITTED" && isWarden && (
              <button
                onClick={handleWardenConfirm}
                disabled={actionLoading}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2"
              >
                <CheckCircle className="h-5 w-5" />
                <span>{actionLoading ? "Processing..." : "Approve & Confirm Handover"}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
