import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp
} from "firebase/firestore";
import {
  Search,
  Plus,
  Filter,
  Package,
  MapPin,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  ShieldCheck,
  Tag
} from "lucide-react";

import ReportItemModal from "./ReportItemModal";
import SubmitProofModal from "./SubmitProofModal";
import ItemDetailModal from "./ItemDetailModal";

export default function LostFoundFeed({ initialSelectedItem = null, onClearSelectedItem = null }) {
  const { currentUser, userData } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusTab, setStatusTab] = useState("ALL"); // ALL, LOST, FOUND_PENDING, PROOF_SUBMITTED, RESOLVED
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  // Modals state
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [submitProofModalOpen, setSubmitProofModalOpen] = useState(false);
  const [selectedItemForProof, setSelectedItemForProof] = useState(null);
  const [detailModalItem, setDetailModalItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Open item modal if selected from notification
  useEffect(() => {
    if (initialSelectedItem) {
      setDetailModalItem(initialSelectedItem);
    }
  }, [initialSelectedItem]);

  // Real-time listener for lostFoundItems
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
        console.error("Error fetching lost and found items:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // 1. Handle Report Lost Item
  const handleReportItem = async (formData) => {
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "lostFoundItems"), {
        title: formData.title,
        category: formData.category,
        location: formData.location,
        description: formData.description,
        imageUrl: formData.imageUrl,
        status: "LOST",
        reporterUid: currentUser.uid,
        reporterName: userData?.name || currentUser?.email?.split("@")[0] || "Student",
        reporterRoom: userData?.roomNumber || "",
        createdAt: serverTimestamp()
      });

      setReportModalOpen(false);
    } catch (err) {
      console.error("Error reporting lost item:", err);
      alert("Failed to post lost item: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Handle Finder clicking "I Found This Item"
  const handleReportFound = async (itemId, finderNote) => {
    try {
      const targetItem = items.find((i) => i.id === itemId);
      if (!targetItem) return;

      // Update item status to FOUND_PENDING
      await updateDoc(doc(db, "lostFoundItems", itemId), {
        status: "FOUND_PENDING",
        finderUid: currentUser.uid,
        finderName: userData?.name || currentUser?.email?.split("@")[0] || "Student",
        finderRoom: userData?.roomNumber || "",
        finderNote: finderNote || "",
        foundAt: serverTimestamp()
      });

      // Send notification to Owner
      await addDoc(collection(db, "notifications"), {
        recipientUid: targetItem.reporterUid,
        itemId: itemId,
        title: "Your lost item was reported found!",
        message: `${userData?.name || "A student"} reported finding "${targetItem.title}". Please submit proof of ownership.`,
        type: "FOUND_PENDING",
        read: false,
        createdAt: serverTimestamp()
      });

      // Close modal or update detail item state
      setDetailModalItem((prev) =>
        prev
          ? {
              ...prev,
              status: "FOUND_PENDING",
              finderUid: currentUser.uid,
              finderName: userData?.name || "Student",
              finderNote
            }
          : null
      );
    } catch (err) {
      console.error("Error updating item as found:", err);
      alert("Failed to update status: " + err.message);
    }
  };

  // 3. Handle Owner submitting proof
  const handleSubmitProof = async (formData) => {
    if (!selectedItemForProof) return;
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, "lostFoundItems", selectedItemForProof.id), {
        status: "PROOF_SUBMITTED",
        proofDetails: formData.proofDetails,
        proofImageUrl: formData.proofImageUrl,
        proofSubmittedAt: serverTimestamp()
      });

      // Notify Wardens (broadcast via notification collection)
      await addDoc(collection(db, "notifications"), {
        recipientUid: "warden", // or query wardens
        itemId: selectedItemForProof.id,
        title: "New Ownership Proof Submitted",
        message: `Owner submitted proof for "${selectedItemForProof.title}". Verification needed.`,
        type: "PROOF_SUBMITTED",
        read: false,
        createdAt: serverTimestamp()
      });

      setSubmitProofModalOpen(false);
      setSelectedItemForProof(null);
    } catch (err) {
      console.error("Error submitting proof:", err);
      alert("Failed to submit proof: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Handle Warden approving handover
  const handleWardenApprove = async (itemId) => {
    try {
      const targetItem = items.find((i) => i.id === itemId);
      if (!targetItem) return;

      await updateDoc(doc(db, "lostFoundItems", itemId), {
        status: "RESOLVED",
        resolvedAt: serverTimestamp(),
        resolvedBy: currentUser.uid
      });

      // Notify Owner
      await addDoc(collection(db, "notifications"), {
        recipientUid: targetItem.reporterUid,
        itemId: itemId,
        title: "Item Handover Approved & Resolved!",
        message: `Your item "${targetItem.title}" has been verified and confirmed resolved.`,
        type: "RESOLVED",
        read: false,
        createdAt: serverTimestamp()
      });

      setDetailModalItem((prev) => (prev ? { ...prev, status: "RESOLVED" } : null));
    } catch (err) {
      console.error("Error approving handover:", err);
      alert("Failed to approve handover: " + err.message);
    }
  };

  // Filtered items computation
  const filteredItems = items.filter((item) => {
    // Search query match
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      item.title?.toLowerCase().includes(q) ||
      item.category?.toLowerCase().includes(q) ||
      item.location?.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q);

    // Status tab match
    let matchesStatus = true;
    if (statusTab === "ACTIVE") {
      matchesStatus = item.status === "LOST";
    } else if (statusTab === "FOUND_PENDING") {
      matchesStatus = item.status === "FOUND_PENDING" || item.status === "PROOF_SUBMITTED";
    } else if (statusTab === "RESOLVED") {
      matchesStatus = item.status === "RESOLVED";
    }

    // Category match
    const matchesCategory = categoryFilter === "ALL" || item.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "LOST":
        return { label: "LOST", style: "bg-rose-50 text-rose-700 border-rose-200" };
      case "FOUND_PENDING":
        return { label: "FOUND (PENDING)", style: "bg-amber-50 text-amber-700 border-amber-200" };
      case "PROOF_SUBMITTED":
        return { label: "PROOF SUBMITTED", style: "bg-indigo-50 text-indigo-700 border-indigo-200" };
      case "RESOLVED":
        return { label: "RESOLVED", style: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      default:
        return { label: status, style: "bg-slate-50 text-slate-700 border-slate-200" };
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner & Header CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Lost & Found Portal</h2>
          <p className="text-xs text-slate-500 mt-1">
            Report lost items, declare found belongings, and securely verify ownership.
          </p>
        </div>

        <button
          onClick={() => setReportModalOpen(true)}
          className="flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm px-5 py-3 rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer"
        >
          <Plus className="h-5 w-5" />
          <span>Report Lost Item</span>
        </button>
      </div>

      {/* Controls & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search Input */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by item name, category, or location..."
              className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Category Dropdown Filter */}
          <div className="relative">
            <select
              className="w-full rounded-xl border border-slate-200 p-2.5 text-sm bg-white focus:border-indigo-500 focus:outline-none appearance-none font-semibold text-slate-700"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="ALL">All Categories</option>
              <option value="Electronics">Electronics</option>
              <option value="ID & Cards">ID & Cards</option>
              <option value="Keys">Keys</option>
              <option value="Clothing">Clothing</option>
              <option value="Other">Other</option>
            </select>
            <Tag className="absolute right-3.5 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center space-x-2 border-t border-slate-100 pt-3 overflow-x-auto">
          {[
            { id: "ALL", label: "All Items" },
            { id: "ACTIVE", label: "Active (Lost)" },
            { id: "FOUND_PENDING", label: "Found (In Progress)" },
            { id: "RESOLVED", label: "Resolved" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex-shrink-0 cursor-pointer ${
                statusTab === tab.id
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Item Cards Grid */}
      {filteredItems.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3">
          <Package className="h-12 w-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">No Items Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            No lost & found reports match your search query or selected filter criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const badge = getStatusBadge(item.status);
            return (
              <div
                key={item.id}
                onClick={() => setDetailModalItem(item)}
                className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  {/* Reference Image Thumbnail */}
                  <div className="relative h-48 bg-slate-100 overflow-hidden flex items-center justify-center">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <Package className="h-12 w-12 text-slate-300" />
                    )}

                    {/* Visual Status Badge overlay */}
                    <span
                      className={`absolute top-3 left-3 px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-full border shadow-sm ${badge.style}`}
                    >
                      {badge.label}
                    </span>
                  </div>

                  {/* Card Content */}
                  <div className="p-5 space-y-3">
                    <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                      {item.category}
                    </span>

                    <h3 className="text-base font-bold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                      {item.title}
                    </h3>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>

                    <div className="pt-2 border-t border-slate-100 space-y-1 text-[11px] text-slate-500">
                      <div className="flex items-center space-x-1.5">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{item.location}</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                        <span>
                          {item.createdAt?.toDate
                            ? item.createdAt.toDate().toLocaleDateString()
                            : "Recently"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600">
                  <span className="truncate">By {item.reporterName}</span>
                  <span className="text-indigo-600 font-bold group-hover:underline">Details &rarr;</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <ReportItemModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        onSubmit={handleReportItem}
        isSubmitting={isSubmitting}
      />

      <SubmitProofModal
        isOpen={submitProofModalOpen}
        onClose={() => {
          setSubmitProofModalOpen(false);
          setSelectedItemForProof(null);
        }}
        item={selectedItemForProof}
        onSubmit={handleSubmitProof}
        isSubmitting={isSubmitting}
      />

      <ItemDetailModal
        isOpen={!!detailModalItem}
        onClose={() => {
          setDetailModalItem(null);
          if (onClearSelectedItem) onClearSelectedItem();
        }}
        item={detailModalItem}
        currentUser={currentUser}
        userData={userData}
        onReportFound={handleReportFound}
        onOpenSubmitProof={(itemToProof) => {
          setSelectedItemForProof(itemToProof);
          setSubmitProofModalOpen(true);
        }}
        onWardenApprove={handleWardenApprove}
      />
    </div>
  );
}
