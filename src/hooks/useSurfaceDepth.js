import { useCallback, useEffect, useRef } from 'react';

// Delegated feedback never captures a pointer or cancels native touch scrolling.
export default function useSurfaceDepth(enabled) {
  const active = useRef(null);
  const clear = useCallback(() => {
    if (!active.current) return;
    active.current.style.removeProperty('--depth-x');
    active.current.style.removeProperty('--depth-y');
    delete active.current.dataset.pressed;
    active.current = null;
  }, []);
  useEffect(() => { if (!enabled) clear(); return clear; }, [enabled, clear]);
  const surface = event => {
    const card = event.target.closest?.('[data-depth]');
    if (!enabled || !card || !event.currentTarget.contains(card) || card.disabled) { clear(); return null; }
    if (active.current !== card) { clear(); active.current = card; }
    const rect = card.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
    card.style.setProperty('--touch-x', `${x * 100}%`);
    card.style.setProperty('--touch-y', `${y * 100}%`);
    return { card, x, y };
  };
  return {
    onPointerMove: event => {
      if (event.pointerType !== 'mouse') return;
      const result = surface(event);
      if (!result || result.card.contains(document.activeElement)) return;
      result.card.style.setProperty('--depth-x', `${(0.5 - result.y) * 5}deg`);
      result.card.style.setProperty('--depth-y', `${(result.x - 0.5) * 5}deg`);
    },
    onPointerDown: event => { const result = surface(event); if (result) result.card.dataset.pressed = 'true'; },
    onPointerUp: clear, onPointerCancel: clear, onPointerLeave: clear, onBlurCapture: clear,
  };
}
