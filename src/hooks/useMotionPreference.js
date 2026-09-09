import { useEffect, useState } from 'react';

const eventName = 'nivas:motion';
function readPreference() {
  try {
    const saved = localStorage.getItem('nivas_motion');
    if (saved) return saved !== 'off';
  } catch { /* Storage may be unavailable in private mode. */ }
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function useMotionPreference() {
  const [motion, setMotion] = useState(readPreference);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setMotion(readPreference());
    window.addEventListener(eventName, sync);
    window.addEventListener('storage', sync);
    media.addEventListener('change', sync);
    return () => {
      window.removeEventListener(eventName, sync);
      window.removeEventListener('storage', sync);
      media.removeEventListener('change', sync);
    };
  }, []);
  useEffect(() => {
    document.documentElement.dataset.nivasMotion = motion ? 'on' : 'off';
  }, [motion]);
  const toggleMotion = () => {
    const next = !motion;
    try { localStorage.setItem('nivas_motion', next ? 'on' : 'off'); } catch { /* Keep the local choice. */ }
    setMotion(next);
    window.dispatchEvent(new Event(eventName));
  };
  return { motion, toggleMotion };
}
