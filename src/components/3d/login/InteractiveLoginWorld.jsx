import { useEffect, useId, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, RotateCcw, Sparkles, MoveHorizontal } from 'lucide-react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createLoginSculpture, LOGIN_WORLDS } from './createLoginSculpture';
import { createOrbitInput } from './orbitInput';

export default function InteractiveLoginWorld({ role = 'student', motion = true, formState = 'idle', controls = true }) {
  const mount = useRef(null);
  const engine = useRef(null);
  const inputs = useRef(null);
  if (!inputs.current) inputs.current = createOrbitInput();
  const config = useRef({ role, motion, formState });
  const [failed, setFailed] = useState(false);
  const [dragging, setDragging] = useState(false);
  const hintId = useId();
  const world = LOGIN_WORLDS[role];

  useEffect(() => {
    config.current.role = role;
    inputs.current.reset();
    setDragging(false);
    engine.current?.draw();
  }, [role]);
  useEffect(() => {
    config.current.motion = motion;
    config.current.formState = formState;
    engine.current?.draw();
  }, [motion, formState]);

  useEffect(() => {
    const element = mount.current;
    if (!element) return;
    let renderer, environmentMap;
    let raf = 0, lastFrame = 0, lastPaint = 0, elapsed = 0, burst = 0;
    let stopped = false, inView = true, fit = 1;
    const targetPointer = new THREE.Vector2();
    const pointer = new THREE.Vector2();
    const rotation = new THREE.Vector2();
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 35);
    const worlds = {};
    const weights = { student: 0, warden: 0, admin: 0 };
    weights[config.current.role] = 1;
    const geometries = new Set(), materials = new Set();
    const mobileDevice = window.matchMedia('(any-pointer: coarse)').matches || window.innerWidth < 768;
    function addWorld(key) {
      const sculpture = createLoginSculpture(key);
      const pivot = new THREE.Group(); pivot.add(sculpture.group); scene.add(pivot);
      worlds[key] = { ...sculpture, pivot };
    }
    function disposeContents() {
      scene.traverse(object => {
        if (object.geometry) geometries.add(object.geometry);
        if (object.material) for (const mat of (Array.isArray(object.material) ? object.material : [object.material])) materials.add(mat);
      });
      geometries.forEach(item => item.dispose());
      materials.forEach(item => item.dispose());
      environmentMap?.dispose();
      renderer?.dispose();
      renderer?.domElement.remove();
    }
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobileDevice ? 1.25 : 1.8));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.0;
      renderer.shadowMap.enabled = !mobileDevice;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      element.appendChild(renderer.domElement);
      const room = new RoomEnvironment();
      const generator = new THREE.PMREMGenerator(renderer);
      environmentMap = generator.fromScene(room, 0.04);
      scene.environment = environmentMap.texture;
      scene.environmentIntensity = 0.75;
      room.dispose(); generator.dispose();
      scene.add(new THREE.HemisphereLight(0xc6e4ff, 0x283154, 1.4));
      const key = new THREE.DirectionalLight(0xffffff, 3.2); key.position.set(-3, 6, 6); key.castShadow = true;
      key.shadow.mapSize.set(512, 512); key.shadow.camera.left = -4; key.shadow.camera.right = 4;
      key.shadow.camera.top = 4; key.shadow.camera.bottom = -4; key.shadow.normalBias = 0.035;
      scene.add(key);
      const rim = new THREE.DirectionalLight(0xb2bdff, 2.1); rim.position.set(4, 2, -2); scene.add(rim);
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(15, 15), new THREE.ShadowMaterial({ opacity: 0.16 }));
      floor.rotation.x = -Math.PI / 2; floor.position.y = -1.58; floor.receiveShadow = true; scene.add(floor);
      addWorld(config.current.role);
    } catch (error) {
      console.warn('Interactive illustration could not start.', error);
      disposeContents();
      setFailed(true);
      return;
    }
    const accent = new THREE.PointLight(LOGIN_WORLDS[config.current.role].accent, 8, 12);
    accent.position.set(-3, 1, 4); scene.add(accent);
    const accentTarget = new THREE.Color();
    function requestDraw() {
      if (!raf && !stopped && inView && !document.hidden) raf = requestAnimationFrame(paint);
    }
    function paint(now) {
      raf = 0;
      if (stopped || !inView || document.hidden) return;
      const enabled = config.current.motion;
      if (enabled && now - lastPaint < (mobileDevice ? 32 : 16)) { requestDraw(); return; }
      const delta = Math.min(lastFrame ? (now - lastFrame) / 1000 : 1 / 30, 0.05);
      lastFrame = now; lastPaint = now;
      if (enabled) { elapsed += delta; burst *= Math.exp(-delta * 1.6); }
      const damping = enabled ? 1 - Math.exp(-delta * 11) : 1;
      const orbit = inputs.current.state;
      rotation.x = THREE.MathUtils.lerp(rotation.x, orbit.pitch, damping);
      rotation.y = THREE.MathUtils.lerp(rotation.y, orbit.yaw, damping);
      pointer.lerp(targetPointer, damping);
      const current = config.current.role;
      if (!worlds[current]) addWorld(current);
      for (const [key, sculpture] of Object.entries(worlds)) {
        const target = key === current ? 1 : 0;
        weights[key] = THREE.MathUtils.lerp(weights[key], target, damping);
        if (Math.abs(weights[key] - target) < 0.001) weights[key] = target;
        const weight = weights[key];
        sculpture.pivot.visible = weight > 0.001;
        sculpture.pivot.scale.setScalar(0.72 + weight * 0.28);
        sculpture.pivot.position.set((1 - weight) * (target ? 3 : -3), -(1 - weight) * 0.5, -(1 - weight) * 2);
        sculpture.pivot.rotation.set(rotation.x + pointer.y * 0.05, rotation.y + pointer.x * 0.13 + (1 - weight) * 0.4, 0);
        if (sculpture.pivot.visible) sculpture.update(enabled ? elapsed : 1.8, { pointer, burst: enabled ? burst : 0, focus: config.current.formState });
      }
      camera.position.set(pointer.x * 0.10, 0.72 + pointer.y * 0.08, 7.5 * fit);
      camera.lookAt(0, 0.16, 0);
      accentTarget.setHex(LOGIN_WORLDS[current].accent); accent.color.lerp(accentTarget, damping);
      renderer.render(scene, camera);
      if (enabled) requestDraw();
    }
    const resize = () => {
      const width = Math.max(1, element.clientWidth), height = Math.max(1, element.clientHeight);
      camera.aspect = width / height;
      fit = Math.max(1, 1 / camera.aspect);
      camera.updateProjectionMatrix(); renderer.setSize(width, height); requestDraw();
    };
    const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(element);
    const intersection = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (!inView) { cancelAnimationFrame(raf); raf = 0; }
      else { lastFrame = 0; requestDraw(); }
    }); intersection.observe(element);
    const visibility = () => {
      if (document.hidden) { cancelAnimationFrame(raf); raf = 0; }
      else { lastFrame = 0; requestDraw(); }
    };
    const lostContext = event => { event.preventDefault(); stopped = true; cancelAnimationFrame(raf); raf = 0; setFailed(true); };
    renderer.domElement.addEventListener('webglcontextlost', lostContext);
    document.addEventListener('visibilitychange', visibility);
    engine.current = {
      draw: requestDraw,
      point(x, y) { targetPointer.set(x, y); requestDraw(); },
      activate() { if (config.current.motion) { burst = 1; requestDraw(); } },
      reset() { inputs.current.reset(); targetPointer.set(0, 0); burst = 0; requestDraw(); },
    };
    resize();
    return () => {
      stopped = true; cancelAnimationFrame(raf); engine.current = null;
      resizeObserver.disconnect(); intersection.disconnect();
      document.removeEventListener('visibilitychange', visibility);
      renderer.domElement.removeEventListener('webglcontextlost', lostContext);
      disposeContents();
    };
  }, []);

  const rotate = amount => { inputs.current.rotate(amount); engine.current?.draw(); };
  const pointerDown = event => {
    if (!controls || failed || !event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
    inputs.current.start(event.pointerId, event.clientX, event.clientY, event.pointerType);
  };
  const pointerMove = event => {
    if (!controls || failed || !event.isPrimary) return;
    const rect = event.currentTarget.getBoundingClientRect();
    engine.current?.point(Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1)), Math.max(-1, Math.min(1, 1 - (event.clientY - rect.top) / rect.height * 2)));
    const action = inputs.current.move(event.pointerId, event.clientX, event.clientY);
    if (action === 'rotate') {
      if (!event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.setPointerCapture(event.pointerId);
      setDragging(true); engine.current?.draw();
    }
  };
  const pointerUp = event => {
    const tapped = inputs.current.end(event.pointerId);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    setDragging(false);
    if (tapped) engine.current?.activate();
  };
  const pointerCancel = event => { inputs.current.cancel(event.pointerId); setDragging(false); engine.current?.point(0, 0); };
  const keyDown = event => {
    if (!controls || failed) return;
    if (['ArrowLeft', 'ArrowRight', 'Enter', ' ', 'r', 'R'].includes(event.key)) event.preventDefault();
    if (event.key === 'ArrowLeft') rotate(-0.25);
    if (event.key === 'ArrowRight') rotate(0.25);
    if (event.key === 'Enter' || event.key === ' ') engine.current?.activate();
    if (event.key.toLowerCase() === 'r') engine.current?.reset();
  };
  return <div className="nivas-interactive-world" data-role={role}>
    <div className={`nivas-world-viewport${dragging ? ' is-dragging' : ''}`} role={controls ? 'group' : undefined} tabIndex={controls && !failed ? 0 : undefined} aria-label={world.label} aria-describedby={controls ? hintId : undefined}
      onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerCancel} onLostPointerCapture={pointerCancel} onPointerLeave={event => { if (!event.currentTarget.hasPointerCapture(event.pointerId)) { inputs.current.cancel(event.pointerId); engine.current?.point(0, 0); } }} onKeyDown={keyDown}>
      <div className="nivas-world-renderer" ref={mount} aria-hidden="true" />
      {failed && <div className="nivas-world-fallback"><img src="/logo.svg" alt="" /><span>{world.label}</span><small>Your portal is ready to use.</small></div>}
    </div>
    {controls && <div className="nivas-world-controls">
      <p id={hintId}><MoveHorizontal size={14} />Drag to rotate · Tap to interact<span className="nivas-sr-only">. Arrow keys rotate. Enter plays the animation. R resets the view.</span></p>
      <div className="nivas-world-buttons">
        <button type="button" onClick={() => rotate(-0.35)} disabled={failed} aria-label="Rotate model left"><ArrowLeft size={16} /></button>
        <button type="button" className="nivas-world-action" onClick={() => engine.current?.activate()} disabled={failed || !motion}><Sparkles size={15} />{world.action}</button>
        <button type="button" onClick={() => rotate(0.35)} disabled={failed} aria-label="Rotate model right"><ArrowRight size={16} /></button>
        <button type="button" onClick={() => engine.current?.reset()} disabled={failed} aria-label="Reset model rotation"><RotateCcw size={15} /></button>
      </div>
    </div>}
  </div>;
}
