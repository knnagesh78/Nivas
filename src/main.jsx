import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// ── PWA Install Prompt: capture BEFORE React mounts so it is never lost ──────
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.deferredPrompt = e;
  // Let any already-mounted React components know they can show install UI
  window.dispatchEvent(new CustomEvent('pwa:installable'));
});

window.addEventListener('appinstalled', () => {
  window.deferredPrompt = null;
  localStorage.setItem('pwa_installed', 'true');
  window.dispatchEvent(new CustomEvent('pwa:installed'));
});
// ─────────────────────────────────────────────────────────────────────────────

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// ── Service Worker Registration with Safe Update Detection ──────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Check if the page is already controlled by a service worker on load
    const hasController = !!navigator.serviceWorker.controller;

    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('[SW] Registered:', reg.scope);

        // Check if there's already a waiting worker on load
        if (reg.waiting) {
          notifyUpdate(reg.waiting);
        }

        // Listen for new service workers installing
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // A new service worker is installed and waiting to take over
              notifyUpdate(newWorker);
            }
          });
        });
      })
      .catch((err) => console.warn('[SW] Registration failed:', err));

    // Only reload the page when the service worker changes IF we were already controlled.
    // This prevents reload loops or double-reloads on the very first install.
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      if (hasController) {
        refreshing = true;
        window.location.reload();
      }
    });
  });
}

/**
 * Show a lightweight "Update available" toast and reload on confirmation.
 * Sends SKIP_WAITING to the new worker so it activates immediately.
 */
function notifyUpdate(worker) {
  if (document.getElementById('sw-update-toast')) return;

  const toast = document.createElement('div');
  toast.id = 'sw-update-toast';
  toast.style.cssText = [
    'position:fixed', 'bottom:20px', 'left:50%', 'transform:translateX(-50%)',
    'z-index:99999', 'display:flex', 'align-items:center', 'gap:12px',
    'background:#1e293b', 'color:#f1f5f9',
    'padding:14px 20px', 'border-radius:14px',
    'box-shadow:0 8px 32px rgba(0,0,0,0.4)',
    'font-family:system-ui,sans-serif', 'font-size:14px',
    'border:1px solid rgba(255,255,255,0.08)',
    'backdrop-filter:blur(12px)',
    'animation:slideUp 0.3s ease'
  ].join(';');

  toast.innerHTML = `
    <span style="font-size:18px">🔄</span>
    <span><strong style="color:#a5b4fc">Nivas updated!</strong><br>
    <span style="font-size:12px;color:#94a3b8">Reload to get the latest version & icons.</span></span>
    <button id="sw-reload-btn" style="
      background:#4f46e5;color:white;border:none;
      padding:8px 16px;border-radius:8px;cursor:pointer;
      font-size:13px;font-weight:600;white-space:nowrap;
      transition:background 0.2s
    ">Reload Now</button>
    <button id="sw-dismiss-btn" style="
      background:transparent;color:#64748b;border:none;
      padding:4px;cursor:pointer;font-size:18px;line-height:1
    ">✕</button>
  `;

  if (!document.getElementById('sw-toast-style')) {
    const style = document.createElement('style');
    style.id = 'sw-toast-style';
    style.textContent = '@keyframes slideUp{from{opacity:0;transform:translateX(-50%) translateY(20px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}';
    document.head.appendChild(style);
  }

  document.body.appendChild(toast);

  document.getElementById('sw-reload-btn').addEventListener('click', () => {
    worker.postMessage('SKIP_WAITING');
  });
  document.getElementById('sw-dismiss-btn').addEventListener('click', () => {
    toast.remove();
  });
}
