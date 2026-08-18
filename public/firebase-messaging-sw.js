// ─── Firebase Messaging Service Worker ──────────────────────────────────────
// Handles push notifications for incoming calls even when the app is closed.
// Firebase automatically looks for this file at /firebase-messaging-sw.js

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Firebase config — must match your app's config
firebase.initializeApp({
  apiKey: "AIzaSyACTx17O0nOj960fX70GrU3VFN2TbEWBXI",
  authDomain: "nivas-33144.firebaseapp.com",
  projectId: "nivas-33144",
  storageBucket: "nivas-33144.firebasestorage.app",
  messagingSenderId: "166280590956",
  appId: "1:166280590956:web:074e445773de5c20484a49",
});

const messaging = firebase.messaging();

// Handle background messages (when app is not in focus)
messaging.onBackgroundMessage((payload) => {
  console.log('[FCM SW] Background message received:', payload);

  const { title, body, callerName, callId, type } = payload.data || {};

  if (type === 'incoming_call') {
    const notificationTitle = title || `📞 Incoming Call`;
    const notificationOptions = {
      body: body || `${callerName || 'A roommate'} is calling you...`,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: `call-${callId}`,
      requireInteraction: true, // Keep notification visible until user interacts
      vibrate: [300, 100, 300, 100, 300], // Vibration pattern for call
      actions: [
        { action: 'answer', title: '✅ Answer' },
        { action: 'decline', title: '❌ Decline' }
      ],
      data: { callId, type: 'incoming_call', url: '/' }
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
  }
});

// Handle notification click (open app when notification is tapped)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const { callId, type } = event.notification.data || {};
  const action = event.action;

  if (type === 'incoming_call') {
    // Open or focus the app
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // If app is already open, focus it and send a message
        for (const client of clientList) {
          if ('focus' in client) {
            client.focus();
            client.postMessage({
              type: 'INCOMING_CALL_NOTIFICATION_CLICK',
              callId,
              action: action || 'answer'
            });
            return;
          }
        }
        // If app is not open, open it
        if (self.clients.openWindow) {
          return self.clients.openWindow(`/?callId=${callId}&action=${action || 'answer'}`);
        }
      })
    );
  }
});
