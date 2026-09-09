import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { createStudentScene } from '../scenes/StudentScene';
import { createWardenScene } from '../scenes/WardenScene';
import { createAdminScene } from '../scenes/AdminScene';

const palettes = { student: 0x67bcff, warden: 0x48dfb4, admin: 0xffc76b };

// One renderer, interruptible transitions, and complete GPU resource cleanup.
export default function Hostel3DCanvas({ activeRole = 'student', motion = true }) {
  const mountRef = useRef(null);
  const roleRef = useRef(activeRole);
  const motionRef = useRef(motion);
  const controller = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    roleRef.current = activeRole;
    controller.current?.draw();
  }, [activeRole]);
  useEffect(() => {
    motionRef.current = motion;
    controller.current?.draw();
  }, [motion]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;
    let renderer;
    let disposed = false;
    let frame = 0;
    let visible = true;
    let lastTime = 0;
    let elapsed = 0;
    let lastPaint = 0;
    const pointer = new THREE.Vector2();
    const cameraOffset = new THREE.Vector2();
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 80);
    let fit = 1;
    const environments = {};
    const weights = { student: 0, warden: 0, admin: 0 };
    weights[roleRef.current] = 1;

    function disposeScene() {
      const geometries = new Set();
      const materials = new Set();
      const textures = new Set();
      scene.traverse(object => {
        if (object.geometry) geometries.add(object.geometry);
        for (const material of (Array.isArray(object.material) ? object.material : [object.material])) {
          if (!material) continue;
          materials.add(material);
          for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
        }
      });
      textures.forEach(texture => texture.dispose());
      materials.forEach(material => material.dispose());
      geometries.forEach(geometry => geometry.dispose());
    }

    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1.25 : 1.6));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.45;
      container.appendChild(renderer.domElement);
      scene.add(new THREE.HemisphereLight(0xe7f2ff, 0x22334c, 2.8));
      const key = new THREE.DirectionalLight(0xffffff, 3.8);
      key.position.set(4, 8, 8);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0x7fcfff, 2.2);
      rim.position.set(-5, 4, -2);
      scene.add(rim);
      for (const [role, factory] of Object.entries({ student: createStudentScene, warden: createWardenScene, admin: createAdminScene })) {
        const environment = factory();
        const pivot = new THREE.Group();
        pivot.add(environment.group);
        scene.add(pivot);
        environments[role] = { ...environment, pivot };
      }
    } catch (error) {
      console.warn('The decorative 3D scene could not start.', error);
      disposeScene();
      renderer?.dispose();
      renderer?.domElement.remove();
      setFailed(true);
      return;
    }

    const accent = new THREE.PointLight(palettes[roleRef.current], 12, 20);
    accent.position.set(-4, 3, 5);
    scene.add(accent);
    const targetColor = new THREE.Color();
    const onContextLost = event => {
      event.preventDefault();
      cancelAnimationFrame(frame);
      frame = 0;
      disposed = true;
      setFailed(true);
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);

    function paint(time) {
      frame = 0;
      if (disposed || document.hidden || !visible) return;
      if (motionRef.current && time - lastPaint < 32) { requestDraw(); return; }
      const delta = Math.min(lastTime ? (time - lastTime) / 1000 : 1 / 30, 0.05);
      lastTime = time;
      lastPaint = time;
      if (motionRef.current) elapsed += delta * 1000;
      const damping = 1 - Math.exp(-delta * 9);
      const active = roleRef.current;
      for (const [role, environment] of Object.entries(environments)) {
        const target = role === active ? 1 : 0;
        weights[role] = motionRef.current ? THREE.MathUtils.lerp(weights[role], target, damping) : target;
        if (Math.abs(weights[role] - target) < 0.002) weights[role] = target;
        const weight = weights[role];
        environment.pivot.visible = weight > 0.002;
        environment.pivot.scale.setScalar(0.7 + weight * 0.3);
        environment.pivot.position.set((1 - weight) * (role === active ? 2.2 : -2.2), -(1 - weight) * 1.7, -(1 - weight) * 3);
        environment.pivot.rotation.y = (1 - weight) * -0.45;
        if (environment.pivot.visible) environment.update(motionRef.current ? elapsed : 1800);
      }
      cameraOffset.lerp(motionRef.current ? pointer : new THREE.Vector2(), damping);
      camera.position.set((3.6 + cameraOffset.x) * fit, (2.8 + cameraOffset.y) * fit, 9.8 * fit);
      camera.lookAt(0, 0.1, 0);
      targetColor.setHex(palettes[active]);
      accent.color.lerp(targetColor, motionRef.current ? damping : 1);
      renderer.render(scene, camera);
      if (motionRef.current) requestDraw();
    }
    function requestDraw() {
      if (!frame && !disposed && visible && !document.hidden) frame = requestAnimationFrame(paint);
    }
    controller.current = { draw: requestDraw };
    const resize = () => {
      const width = Math.max(1, container.clientWidth);
      const height = Math.max(1, container.clientHeight);
      camera.aspect = width / height;
      fit = Math.max(1, 1.05 / camera.aspect);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      requestDraw();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible) { cancelAnimationFrame(frame); frame = 0; }
      else { lastTime = 0; requestDraw(); }
    });
    intersection.observe(container);
    const visibility = () => {
      if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
      else { lastTime = 0; requestDraw(); }
    };
    const move = event => {
      if (event.pointerType !== 'mouse' || !motionRef.current) return;
      const bounds = container.getBoundingClientRect();
      pointer.set(((event.clientX - bounds.left) / bounds.width - 0.5) * 0.65, -((event.clientY - bounds.top) / bounds.height - 0.5) * 0.4);
    };
    const leave = () => pointer.set(0, 0);
    container.addEventListener('pointermove', move);
    container.addEventListener('pointerleave', leave);
    document.addEventListener('visibilitychange', visibility);
    resize();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      controller.current = null;
      observer.disconnect();
      intersection.disconnect();
      container.removeEventListener('pointermove', move);
      container.removeEventListener('pointerleave', leave);
      document.removeEventListener('visibilitychange', visibility);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      disposeScene();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div className="nivas-canvas" aria-hidden="true">
    <div ref={mountRef} className="nivas-canvas-mount" />
    {failed && <div className="nivas-scene-fallback"><img src="/logo.svg" alt="" /><span>{activeRole} portal</span></div>}
  </div>;
}
