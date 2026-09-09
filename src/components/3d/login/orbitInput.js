const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

// Gesture state is independent of rendering, so native vertical scrolling stays available.
export function createOrbitInput() {
  const state = { yaw: 0, pitch: 0, drag: null };
  return {
    state,
    start(id, x, y, pointerType) {
      if (state.drag) return false;
      state.drag = { id, x, y, startX: x, startY: y, type: pointerType, moved: false, scrolling: false };
      return true;
    },
    move(id, x, y) {
      const drag = state.drag;
      if (!drag || drag.id !== id || drag.scrolling) return 'ignore';
      const dx = x - drag.startX, dy = y - drag.startY;
      if (!drag.moved && drag.type !== 'mouse' && Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx)) {
        drag.scrolling = true;
        return 'scroll';
      }
      if (!drag.moved && Math.hypot(dx, dy) <= 6) return 'pending';
      drag.moved = true;
      state.yaw += (x - drag.x) * 0.009;
      state.pitch = clamp(state.pitch + (y - drag.y) * 0.004, -0.42, 0.42);
      drag.x = x; drag.y = y;
      return 'rotate';
    },
    end(id) {
      const drag = state.drag;
      if (!drag || drag.id !== id) return false;
      state.drag = null;
      return !drag.moved && !drag.scrolling;
    },
    cancel(id) { if (state.drag?.id === id) state.drag = null; },
    rotate(amount) { state.yaw += amount; },
    reset() { state.yaw = 0; state.pitch = 0; state.drag = null; },
  };
}
