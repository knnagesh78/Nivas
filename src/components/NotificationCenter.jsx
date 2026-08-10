import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  writeBatch
} from "firebase/firestore";
import { Bell, Check, CheckCheck, Package, AlertCircle, ShieldCheck } from "lucide-react";

export default function NotificationCenter({ onSelectNotification }) {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "notifications"),
      where("recipientUid", "==", currentUser.uid)
    );

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
        setNotifications(list);
      },
      (error) => {
        console.error("Error listening to notifications:", error);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = async (notificationId, e) => {
    if (e) e.stopPropagation();
    try {
      await updateDoc(doc(db, "notifications", notificationId), {
        read: true
      });
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const batch = writeBatch(db);
      const unreadList = notifications.filter((n) => !n.read);
      unreadList.forEach((n) => {
        batch.update(doc(db, "notifications", n.id), { read: true });
      });
      await batch.commit();
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.read) {
      await handleMarkAsRead(notif.id);
    }
    setIsOpen(false);
    if (onSelectNotification) {
      onSelectNotification(notif);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "FOUND_PENDING":
        return <Package className="h-4 w-4 text-amber-500 flex-shrink-0" />;
      case "PROOF_SUBMITTED":
        return <AlertCircle className="h-4 w-4 text-indigo-500 flex-shrink-0" />;
      case "RESOLVED":
        return <ShieldCheck className="h-4 w-4 text-emerald-500 flex-shrink-0" />;
      default:
        return <Bell className="h-4 w-4 text-slate-500 flex-shrink-0" />;
    }
  };

  return (
    <div className="relative inline-block text-left">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 focus:outline-none transition-all cursor-pointer"
        title="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Popover Drawer */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-slate-200 shadow-2xl z-50 overflow-hidden animate-fadeIn">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white">
              <div className="flex items-center space-x-2">
                <Bell className="h-4 w-4 text-indigo-400" />
                <h3 className="text-sm font-bold">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-extrabold bg-indigo-500 text-white rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-[11px] font-semibold text-indigo-300 hover:text-white flex items-center space-x-1 cursor-pointer"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 italic">
                  No notifications yet.
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3.5 flex items-start space-x-3 cursor-pointer transition-all hover:bg-slate-50 ${
                      !notif.read ? "bg-indigo-50/40" : "bg-white"
                    }`}
                  >
                    <div className="pt-0.5">{getIcon(notif.type)}</div>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center justify-between">
                        <p
                          className={`text-xs font-bold ${
                            !notif.read ? "text-slate-900" : "text-slate-700"
                          }`}
                        >
                          {notif.title || "Notification"}
                        </p>
                        <span className="text-[10px] text-slate-400">
                          {notif.createdAt?.toDate
                            ? notif.createdAt.toDate().toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit"
                              })
                            : "Just now"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>
                    </div>
                    {!notif.read && (
                      <button
                        onClick={(e) => handleMarkAsRead(notif.id, e)}
                        className="p-1 text-slate-400 hover:text-indigo-600 rounded-full hover:bg-white transition-all cursor-pointer"
                        title="Mark as read"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
