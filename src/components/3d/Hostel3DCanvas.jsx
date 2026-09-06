import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { createStudentScene } from "../scenes/StudentScene";
import { createWardenScene } from "../scenes/WardenScene";
import { createAdminScene } from "../scenes/AdminScene";

/**
 * Master 3D WebGL Canvas for the Nivas Login Page
 * Coordinates:
 * - Student, Warden, and Admin 3D environments
 * - Smooth 600ms animated transitions between scenes
 * - Camera motion, ambient lighting shift, and mouse parallax
 * - High-efficiency resource management & mobile optimization
 */
export default function Hostel3DCanvas({ activeRole = "student" }) {
  const mountRef = useRef(null);
  const [webGLSupported, setWebGLSupported] = useState(true);

  // Keep ref of activeRole so the animation loop always knows the target
  const targetRoleRef = useRef(activeRole);
  const currentTransitionRef = useRef({
    fromRole: activeRole,
    toRole: activeRole,
    startTime: performance.now(),
    duration: 650, // 650ms smooth transition
    isTransitioning: false
  });

  useEffect(() => {
    if (activeRole !== targetRoleRef.current) {
      currentTransitionRef.current = {
        fromRole: targetRoleRef.current,
        toRole: activeRole,
        startTime: performance.now(),
        duration: 650,
        isTransitioning: true
      };
      targetRoleRef.current = activeRole;
    }
  }, [activeRole]);

  useEffect(() => {
    let animId;
    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || 450;
    let height = container.clientHeight || 500;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x070d1e, 0.035);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 50);
    camera.position.set(0, 1.2, 8.5);

    // 2. WebGL Renderer
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance"
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      container.appendChild(renderer.domElement);
    } catch (err) {
      console.warn("WebGL initialization failed:", err);
      setWebGLSupported(false);
      return;
    }

    // 3. Dynamic Ambient & Directional Lighting
    const ambientLight = new THREE.AmbientLight(0x0f3b46, 1.8);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xa7f3d0, 1.6);
    keyLight.position.set(6, 10, 8);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const accentLight = new THREE.PointLight(0x8b5cf6, 2.4, 18);
    accentLight.position.set(-5, 4, 5);
    scene.add(accentLight);

    const rimLight = new THREE.PointLight(0x10b981, 2.0, 16);
    rimLight.position.set(4, -2, -4);
    scene.add(rimLight);

    // 4. Build the Three Environments
    const studentEnv = createStudentScene();
    const wardenEnv = createWardenScene();
    const adminEnv = createAdminScene();

    scene.add(studentEnv.group);
    scene.add(wardenEnv.group);
    scene.add(adminEnv.group);

    // Initialize visibility & scale based on activeRole
    const envs = {
      student: studentEnv,
      warden: wardenEnv,
      admin: adminEnv
    };

    Object.keys(envs).forEach((roleKey) => {
      const isCurrent = roleKey === targetRoleRef.current;
      envs[roleKey].group.visible = isCurrent;
      envs[roleKey].group.scale.setScalar(isCurrent ? 1.0 : 0.01);
      envs[roleKey].group.position.y = isCurrent ? 0 : -2.0;
    });

    // 5. Mouse / Touch Parallax Tracking
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    const handlePointerMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetMouseX = x * 0.45;
      targetMouseY = y * 0.25;
    };
    window.addEventListener("pointermove", handlePointerMove);

    // 6. Animation & Scene Transition Loop
    let startTime = performance.now();

    const animate = (time) => {
      animId = requestAnimationFrame(animate);
      const elapsed = time - startTime;

      // Parallax smooth damping
      mouseX += (targetMouseX - mouseX) * 0.06;
      mouseY += (targetMouseY - mouseY) * 0.06;
      camera.position.x = mouseX;
      camera.position.y = 1.2 + mouseY;
      camera.lookAt(0, 0, 0);

      // Handle Smooth 650ms Transition Between Scenes
      const transition = currentTransitionRef.current;
      const transElapsed = time - transition.startTime;
      const progress = Math.min(transElapsed / transition.duration, 1.0);

      // Cubic Ease-In-Out
      const ease =
        progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      if (transition.isTransitioning) {
        const fromEnv = envs[transition.fromRole];
        const toEnv = envs[transition.toRole];

        if (fromEnv && toEnv) {
          // Outgoing scene smoothly scales down and slides down
          fromEnv.group.visible = true;
          const outScale = Math.max(1.0 - ease, 0.01);
          fromEnv.group.scale.setScalar(outScale);
          fromEnv.group.position.y = -ease * 2.0;

          // Incoming scene smoothly scales up from bottom
          toEnv.group.visible = true;
          const inScale = Math.max(ease, 0.01);
          toEnv.group.scale.setScalar(inScale);
          toEnv.group.position.y = -(1.0 - ease) * 2.0;

          // Transition lighting color subtly
          if (transition.toRole === "student") {
            accentLight.color.setHex(0x8b5cf6);
            rimLight.color.setHex(0xa7f3d0);
          } else if (transition.toRole === "warden") {
            accentLight.color.setHex(0xf59e0b);
            rimLight.color.setHex(0x10b981);
          } else if (transition.toRole === "admin") {
            accentLight.color.setHex(0x6366f1);
            rimLight.color.setHex(0x34d399);
          }
        }

        if (progress >= 1.0) {
          transition.isTransitioning = false;
          // Clean up visibility of non-active scenes
          Object.keys(envs).forEach((roleKey) => {
            const isTarget = roleKey === transition.toRole;
            envs[roleKey].group.visible = isTarget;
            envs[roleKey].group.scale.setScalar(isTarget ? 1.0 : 0.01);
            envs[roleKey].group.position.y = isTarget ? 0 : -2.0;
          });
        }
      }

      // Update the active environment's internal animation loop
      const activeEnv = envs[targetRoleRef.current];
      if (activeEnv && activeEnv.update) {
        activeEnv.update(elapsed);
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    // Resize handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth || 450;
      const h = container.clientHeight || 500;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("resize", handleResize);
      if (renderer && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer?.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-full min-h-[300px] flex items-center justify-center select-none overflow-hidden">
      {/* Dynamic Ambient Glow Behind 3D Elements */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 pointer-events-none ${
          activeRole === "student"
            ? "bg-[radial-gradient(circle_at_45%_50%,rgba(99,102,241,0.22)_0%,transparent_70%)] opacity-100"
            : activeRole === "warden"
            ? "bg-[radial-gradient(circle_at_45%_50%,rgba(16,185,129,0.20)_0%,transparent_70%)] opacity-100"
            : "bg-[radial-gradient(circle_at_45%_50%,rgba(139,92,246,0.22)_0%,transparent_70%)] opacity-100"
        }`}
      />

      {/* WebGL Canvas Container */}
      <div ref={mountRef} className="w-full h-full min-h-[300px] flex items-center justify-center cursor-grab active:cursor-grabbing" />

      {/* Fallback for devices without WebGL */}
      {!webGLSupported && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-900/90 backdrop-blur-md">
          <div className="h-16 w-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-3xl mb-3">
            {activeRole === "student" ? "🎓" : activeRole === "warden" ? "📋" : "🛡️"}
          </div>
          <h4 className="text-base font-bold text-white capitalize">{activeRole} Portal 3D Hub</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            Interactive hostel environment active. WebGL hardware acceleration disabled.
          </p>
        </div>
      )}

      {/* Role State Indicator Pill at Bottom */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-slate-900/85 border border-slate-700/60 backdrop-blur-md text-[11px] font-semibold text-slate-200 flex items-center space-x-2 shadow-2xl pointer-events-none">
        <span
          className={`h-2 w-2 rounded-full animate-ping ${
            activeRole === "student"
              ? "bg-indigo-400"
              : activeRole === "warden"
              ? "bg-emerald-400"
              : "bg-violet-400"
          }`}
        />
        <span className="tracking-wide">
          {activeRole === "student" && "Hostel Student Life & Academic Deck"}
          {activeRole === "warden" && "Supervisory Office & Leave Approvals"}
          {activeRole === "admin" && "Hostel System Grid & Network Control"}
        </span>
      </div>
    </div>
  );
}
