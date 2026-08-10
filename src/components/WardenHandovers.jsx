import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import {
  collection,
  query,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp
} from "firebase/firestore";
import {
  ShieldCheck,
  CheckCircle,
  Package,
  User,
  MapPin,
  Clock,
  ExternalLink,
  AlertCircle
} from "lucide-react";

export default function WardenHandovers() {
  const { currentUser } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "lostFoundItems"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        // Sort in memory by createdAt desc
        list.sort((a, b) => {
          const aTime = a.createdAt?.seconds || a.createdAt?.toMillis?.() / 1000 || 0;
          const bTime = b.createdAt?.seconds || b.createdAt?.toMillis?.() / 1000 || 0;
          return bTime - aTime;
        });
        setItems(list);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching handover queue items:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleApproveHandover = async (itemId) => {
    if (!window.confirm("Approve proof and mark handover as resolved?")) return;
    setActionLoading(true);
    try {
      const targetItem = items.find((i) => i.id === itemId);
      if (!targetItem) return;

      await updateDoc(doc(db, "lostFoundItems", itemId), {
        status: "RESOLVED",
        resolvedAt: serverTimestamp(),
        resolvedBy: currentUser.uid
      });

      // Send confirmation notification to owner
      await addDoc(collection(db, "notifications"), {
        recipientUid: targetItem.reporterUid,
        itemId: itemId,
        title: "Lost Item Handover Confirmed!",
        message: `Warden verified your proof for "${targetItem.title}" and approved the handover.`,
        type: "RESOLVED",
        read: false,
        createdAt: serverTimestamp()
      });

      setSelectedItem(null);
      alert("Handover approved and item marked as RESOLVED!");
    } catch (err) {
      console.error("Error approving handover:", err);
      alert("Failed to approve handover: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const pendingItems = items.filter((i) => i.status === "PROOF_SUBMITTED");
  const otherItems = items.filter((i) => i.status !== "PROOF_SUBMITTED");

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-6 w-6 text-indigo-400" />
            <h2 className="text-2xl font-black tracking-tight">Warden Handover Dashboard</h2>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Review ownership claims, inspect submitted proof details side-by-side with original photos, and authorize item handovers.
          </p>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl px-5 py-3 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Pending Verifications
          </span>
          <p className="text-3xl font-black text-amber-400">{pendingItems.length}</p>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Pending Review List */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-sm font-extrabold uppercase text-slate-500 tracking-wider flex items-center justify-between">
            <span>Pending Review Queue ({pendingItems.length})</span>
          </h3>

          {pendingItems.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-slate-400 italic text-xs">
              No pending proof verifications at this time.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`bg-white border p-4 rounded-2xl cursor-pointer transition-all ${
                    selectedItem?.id === item.id
                      ? "border-indigo-600 ring-2 ring-indigo-500/20 shadow-md"
                      : "border-slate-200 hover:border-indigo-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                      Proof Submitted
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      #{item.id.substring(0, 6)}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 mt-2">{item.title}</h4>
                  <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{item.category}</p>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                    <span>Owner: {item.reporterName}</span>
                    <span>Room: {item.reporterRoom || "N/A"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* All items summary table */}
          <div className="pt-4">
            <h3 className="text-sm font-extrabold uppercase text-slate-500 tracking-wider mb-3">
              All Hostel Items ({items.length})
            </h3>
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
              <div className="divide-y divide-slate-100">
                {items.map((i) => (
                  <div
                    key={i.id}
                    onClick={() => setSelectedItem(i)}
                    className="p-3 text-xs flex items-center justify-between hover:bg-slate-50 cursor-pointer"
                  >
                    <div>
                      <p className="font-bold text-slate-800">{i.title}</p>
                      <p className="text-[10px] text-slate-400">{i.category}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 text-[9px] font-bold rounded-full border uppercase ${
                        i.status === "RESOLVED"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : i.status === "PROOF_SUBMITTED"
                          ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                          : i.status === "FOUND_PENDING"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}
                    >
                      {i.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Side-by-Side Verification Panel */}
        <div className="lg:col-span-2">
          {selectedItem ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 animate-fadeIn">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-xs font-bold uppercase text-indigo-600 tracking-wider">
                    {selectedItem.category}
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 mt-1">{selectedItem.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedItem.description}</p>
                </div>

                <button
                  onClick={() => handleApproveHandover(selectedItem.id)}
                  disabled={actionLoading || selectedItem.status === "RESOLVED"}
                  className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md hover:shadow-lg disabled:opacity-50 transition-all flex items-center space-x-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>{selectedItem.status === "RESOLVED" ? "Resolved" : "Approve & Confirm Handover"}</span>
                </button>
              </div>

              {/* Participant Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Owner details */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-1 text-xs">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                    Item Owner / Reporter
                  </span>
                  <p className="font-bold text-slate-900 text-sm">{selectedItem.reporterName}</p>
                  <p className="text-slate-600">Room Number: {selectedItem.reporterRoom || "Not specified"}</p>
                  <p className="text-slate-400 text-[10px]">Posted: {selectedItem.createdAt?.toDate ? selectedItem.createdAt.toDate().toLocaleString() : "N/A"}</p>
                </div>

                {/* Finder details */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-1 text-xs">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                    Finder Information
                  </span>
                  <p className="font-bold text-slate-900 text-sm">{selectedItem.finderName || "Not reported yet"}</p>
                  <p className="text-slate-600">Room Number: {selectedItem.finderRoom || "N/A"}</p>
                  {selectedItem.finderNote && (
                    <p className="text-slate-500 italic text-[11px]">"{selectedItem.finderNote}"</p>
                  )}
                </div>
              </div>

              {/* Side-by-Side Visual Verification Panel */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold uppercase text-slate-700 tracking-wider">
                  Side-by-Side Proof Comparison
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Left: Original Reference Image */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2">
                    <span className="text-[11px] font-bold text-slate-700 block">
                      1. Original Item Image
                    </span>
                    {selectedItem.imageUrl ? (
                      <img
                        src={selectedItem.imageUrl}
                        alt="Original Item"
                        className="w-full h-48 object-cover rounded-xl border border-slate-200"
                      />
                    ) : (
                      <div className="h-48 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-xs italic">
                        No reference image
                      </div>
                    )}
                  </div>

                  {/* Right: Submitted Proof Image */}
                  <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-3 space-y-2">
                    <span className="text-[11px] font-bold text-indigo-900 block">
                      2. Submitted Proof Photo / Receipt
                    </span>
                    {selectedItem.proofImageUrl ? (
                      <img
                        src={selectedItem.proofImageUrl}
                        alt="Submitted Proof"
                        className="w-full h-48 object-cover rounded-xl border border-indigo-200"
                      />
                    ) : (
                      <div className="h-48 rounded-xl border-2 border-dashed border-indigo-200 flex items-center justify-center text-indigo-400 text-xs italic">
                        No proof image attached
                      </div>
                    )}
                  </div>
                </div>

                {/* Submitted Proof Text Claim Details */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
                    Owner's Submitted Proof Explanation
                  </span>
                  <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-line font-medium">
                    {selectedItem.proofDetails || "No detailed proof text submitted yet."}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 space-y-3">
              <Package className="h-12 w-12 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">Select an Item from the Queue</p>
              <p className="text-xs text-slate-400">
                Click on any item on the left to inspect side-by-side proof and approve handover.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
