import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { createCardTexture, createIconBadgeTexture, createWindowTexture } from "./textureUtils";

export default function SplashScreen3D({ onComplete }) {
  const mountRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Initializing 3D Environment...");
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    let animId;
    let renderer, scene, camera;
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene & Camera Setup
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x060914, 0.035);

    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 5, 14);
    camera.lookAt(0, 1.5, 0);

    // 2. WebGL Renderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch (e) {
      console.warn("WebGL initialization fallback:", e);
      // Fallback timer if WebGL fails
      const fallbackTimer = setTimeout(() => {
        if (onComplete) onComplete();
      }, 2000);
      return () => clearTimeout(fallbackTimer);
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 3. Lighting (Midnight blue, vibrant indigo, cyan highlights)
    const ambientLight = new THREE.AmbientLight(0x4338ca, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x818cf8, 2.2);
    dirLight.position.set(8, 12, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const cyanPoint = new THREE.PointLight(0x38bdf8, 3, 20);
    cyanPoint.position.set(-6, 4, 4);
    scene.add(cyanPoint);

    const purplePoint = new THREE.PointLight(0xc084fc, 2.5, 18);
    purplePoint.position.set(6, 2, -4);
    scene.add(purplePoint);

    // 4. Glowing Platform / Podium
    const platformGroup = new THREE.Group();
    const hexGeo = new THREE.CylinderGeometry(4.8, 5.2, 0.4, 6);
    const hexMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.2,
      metalness: 0.8
    });
    const platformMesh = new THREE.Mesh(hexGeo, hexMat);
    platformMesh.receiveShadow = true;
    platformMesh.position.y = -0.2;
    platformGroup.add(platformMesh);

    // Glowing Neon Rings on Platform
    const ringGeo = new THREE.RingGeometry(4.4, 4.6, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x6366f1,
      side: THREE.DoubleSide
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.y = 0.02;
    platformGroup.add(ringMesh);

    const innerRingGeo = new THREE.RingGeometry(2.8, 2.95, 32);
    const innerRingMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide
    });
    const innerRingMesh = new THREE.Mesh(innerRingGeo, innerRingMat);
    innerRingMesh.rotation.x = -Math.PI / 2;
    innerRingMesh.position.y = 0.03;
    platformGroup.add(innerRingMesh);

    scene.add(platformGroup);

    // 5. Miniature 3D Futuristic Hostel Building
    const buildingGroup = new THREE.Group();
    buildingGroup.position.y = -4; // starts lower for rising entrance animation

    const windowTex = createWindowTexture();

    // Central Tower
    const mainTowerGeo = new THREE.BoxGeometry(2.4, 4.2, 2.0);
    const towerMat = new THREE.MeshStandardMaterial({
      color: 0x1e1b4b,
      roughness: 0.3,
      metalness: 0.6,
      map: windowTex
    });
    const mainTower = new THREE.Mesh(mainTowerGeo, towerMat);
    mainTower.position.y = 2.1;
    mainTower.castShadow = true;
    mainTower.receiveShadow = true;
    buildingGroup.add(mainTower);

    // Residential Wing (Left)
    const wingGeo = new THREE.BoxGeometry(1.6, 3.0, 1.8);
    const wingMat = new THREE.MeshStandardMaterial({
      color: 0x172554,
      roughness: 0.3,
      metalness: 0.5,
      map: windowTex
    });
    const leftWing = new THREE.Mesh(wingGeo, wingMat);
    leftWing.position.set(-1.8, 1.5, 0.2);
    leftWing.castShadow = true;
    buildingGroup.add(leftWing);

    // Glass Atrium / Bridge (Right)
    const atriumGeo = new THREE.BoxGeometry(1.4, 2.6, 1.5);
    const atriumMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      transmission: 0.85,
      opacity: 0.9,
      transparent: true,
      roughness: 0.1,
      metalness: 0.1,
      reflectivity: 0.9
    });
    const atrium = new THREE.Mesh(atriumGeo, atriumMat);
    atrium.position.set(1.6, 1.3, 0.4);
    buildingGroup.add(atrium);

    // Modern Entrance Canopy
    const canopyGeo = new THREE.BoxGeometry(1.8, 0.12, 1.2);
    const canopyMat = new THREE.MeshStandardMaterial({
      color: 0x6366f1,
      emissive: 0x4338ca,
      emissiveIntensity: 0.6
    });
    const canopy = new THREE.Mesh(canopyGeo, canopyMat);
    canopy.position.set(0, 0.7, 1.3);
    buildingGroup.add(canopy);

    // Illuminated Entrance Door Glass
    const doorGeo = new THREE.PlaneGeometry(0.8, 0.65);
    const doorMat = new THREE.MeshBasicMaterial({ color: 0x67e8f9, side: THREE.DoubleSide });
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(0, 0.33, 1.01);
    buildingGroup.add(door);

    // Roof Terrace with Glowing Edge
    const roofCapGeo = new THREE.BoxGeometry(2.5, 0.15, 2.1);
    const roofCapMat = new THREE.MeshBasicMaterial({ color: 0xc084fc });
    const roofCap = new THREE.Mesh(roofCapGeo, roofCapMat);
    roofCap.position.set(0, 4.25, 0);
    buildingGroup.add(roofCap);

    // Rooftop Antenna / Mast
    const mastGeo = new THREE.CylinderGeometry(0.04, 0.06, 1.2, 8);
    const mastMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 });
    const mast = new THREE.Mesh(mastGeo, mastMat);
    mast.position.set(0, 4.85, 0);
    buildingGroup.add(mast);

    const beaconGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.set(0, 5.45, 0);
    buildingGroup.add(beacon);

    scene.add(buildingGroup);

    // 6. Orbiting 3D Portal & Feature Badges
    const orbitingBadges = [];
    const badgeConfigs = [
      { label: "Student", sub: "Portal", sym: "🎓", col: "#818cf8", bg: "#1e1b4b", radius: 4.8, height: 2.2, speed: 0.7, phase: 0 },
      { label: "Warden", sub: "Portal", sym: "📋", col: "#fbbf24", bg: "#1c1917", radius: 4.8, height: 1.6, speed: 0.7, phase: (Math.PI * 2) / 8 * 1 },
      { label: "Admin", sub: "Control", sym: "🛡️", col: "#f43f5e", bg: "#270613", radius: 4.8, height: 2.4, speed: 0.7, phase: (Math.PI * 2) / 8 * 2 },
      { label: "Attendance", sub: "Punch", sym: "📅", col: "#34d399", bg: "#064e3b", radius: 4.8, height: 1.4, speed: 0.7, phase: (Math.PI * 2) / 8 * 3 },
      { label: "Leave Pass", sub: "Letters", sym: "✉️", col: "#38bdf8", bg: "#0c4a6e", radius: 4.8, height: 2.5, speed: 0.7, phase: (Math.PI * 2) / 8 * 4 },
      { label: "Notice", sub: "Board", sym: "📢", col: "#a855f7", bg: "#3b0764", radius: 4.8, height: 1.8, speed: 0.7, phase: (Math.PI * 2) / 8 * 5 },
      { label: "Complaints", sub: "Box", sym: "⚠️", col: "#fb923c", bg: "#431407", radius: 4.8, height: 2.3, speed: 0.7, phase: (Math.PI * 2) / 8 * 6 },
      { label: "Lost & Found", sub: "Portal", sym: "📦", col: "#22d3ee", bg: "#164e63", radius: 4.8, height: 1.5, speed: 0.7, phase: (Math.PI * 2) / 8 * 7 }
    ];

    const cardGeo = new THREE.PlaneGeometry(1.2, 0.9);
    badgeConfigs.forEach((cfg) => {
      const tex = createIconBadgeTexture({
        label: cfg.label,
        sublabel: cfg.sub,
        symbol: cfg.sym,
        color: cfg.col,
        bgColor: cfg.bg,
        size: 256
      });
      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(cardGeo, mat);
      scene.add(mesh);
      orbitingBadges.push({ mesh, cfg });
    });

    // 7. Ambient Stardust Particles
    const starGeo = new THREE.BufferGeometry();
    const starCount = 280;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 26;
      starPositions[i + 1] = Math.random() * 14 - 1;
      starPositions[i + 2] = (Math.random() - 0.5) * 26;
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.08,
      transparent: true,
      opacity: 0.65
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // 8. Animation Loop
    let startTime = performance.now();
    const duration = 2600; // 2.6 seconds total

    const animate = (time) => {
      animId = requestAnimationFrame(animate);

      const elapsed = time - startTime;
      const progressFraction = Math.min(elapsed / duration, 1.0);

      // Building rising animation (smooth cubic ease out)
      if (buildingGroup.position.y < 0) {
        const ease = 1 - Math.pow(1 - Math.min(elapsed / 1200, 1), 3);
        buildingGroup.position.y = -4 + ease * 4;
      }

      // Gentle building & platform rotation
      buildingGroup.rotation.y = elapsed * 0.00035;
      platformGroup.rotation.y = -elapsed * 0.0002;

      // Beacon blinking
      beaconMat.color.setHex((Math.sin(elapsed * 0.008) > 0) ? 0x38bdf8 : 0x0369a1);

      // Orbiting Badges Movement & Billboard Facing
      orbitingBadges.forEach(({ mesh, cfg }) => {
        const angle = cfg.phase + elapsed * 0.001 * cfg.speed;
        const x = Math.cos(angle) * cfg.radius;
        const z = Math.sin(angle) * cfg.radius;
        const bob = Math.sin(elapsed * 0.003 + cfg.phase) * 0.22;

        mesh.position.set(x, cfg.height + bob, z);
        mesh.lookAt(camera.position); // always face user for maximum crisp readability
      });

      // Starfield gentle drift
      starField.rotation.y = elapsed * 0.0001;

      // Update progress state
      const currentPercent = Math.floor(progressFraction * 100);
      setProgress(currentPercent);

      if (currentPercent < 35) {
        setStatusText("Constructing 3D Miniature Hostel...");
      } else if (currentPercent < 70) {
        setStatusText("Calibrating Student, Warden & Admin Hubs...");
      } else if (currentPercent < 95) {
        setStatusText("Syncing Cloud Security & Modules...");
      } else {
        setStatusText("Ready! Welcome to Nivas...");
      }

      // Smooth camera zoom during the final 400ms
      if (progressFraction > 0.85) {
        const zoomT = (progressFraction - 0.85) / 0.15;
        camera.position.z = 14 - zoomT * 4.5;
        camera.position.y = 5 - zoomT * 1.5;
      }

      renderer.render(scene, camera);

      // Auto completion trigger
      if (progressFraction >= 1.0 && !isExiting) {
        setIsExiting(true);
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 320);
      }
    };

    animId = requestAnimationFrame(animate);

    // Resize handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      if (renderer && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer?.dispose();
    };
  }, [onComplete, isExiting]);

  const handleSkip = () => {
    setIsExiting(true);
    setTimeout(() => {
      if (onComplete) onComplete();
    }, 200);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between bg-[#060914] text-white select-none transition-all duration-500 overflow-hidden ${
        isExiting ? "opacity-0 scale-105 pointer-events-none" : "opacity-100 scale-100"
      }`}
    >
      {/* Background glow radial backdrop */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(99,102,241,0.22)_0%,rgba(6,9,20,0.95)_75%)] pointer-events-none" />

      {/* Top Header Bar */}
      <div className="relative z-10 w-full flex items-center justify-between px-6 pt-6 max-w-5xl">
        <div className="flex items-center space-x-3">
          <img
            src="/logo.svg"
            alt="Nivas Logo"
            className="h-11 w-11 rounded-2xl shadow-lg shadow-indigo-500/30 border border-indigo-500/30"
          />
          <div>
            <span className="text-xl font-black tracking-wider bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
              NIVAS
            </span>
            <span className="block text-[10px] font-semibold tracking-widest text-indigo-400 uppercase">
              Hostel Management OS
            </span>
          </div>
        </div>

        <button
          onClick={handleSkip}
          className="text-xs font-semibold px-4 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700/60 text-slate-300 hover:text-white backdrop-blur-md transition-all cursor-pointer active:scale-95 shadow-lg"
        >
          Skip Intro →
        </button>
      </div>

      {/* 3D WebGL Canvas Viewport */}
      <div
        ref={mountRef}
        className="relative w-full flex-1 flex items-center justify-center cursor-grab active:cursor-grabbing"
      />

      {/* Bottom Progress & Features Ribbon */}
      <div className="relative z-10 w-full max-w-md px-6 pb-8 text-center space-y-4">
        {/* Status Line */}
        <div className="flex items-center justify-between text-xs font-medium text-slate-400 px-1">
          <span className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-indigo-500 animate-ping" />
            <span className="text-slate-300">{statusText}</span>
          </span>
          <span className="font-mono text-indigo-400 font-bold">{progress}%</span>
        </div>

        {/* Glowing Progress Bar */}
        <div className="relative h-2 w-full bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/60 p-[1px] shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 rounded-full transition-all duration-150 shadow-[0_0_12px_rgba(99,102,241,0.8)]"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Feature Highlights Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[11px] text-slate-400 font-medium">
          <span className="px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-indigo-300">
            🎓 Student
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-amber-300">
            📋 Warden
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-rose-300">
            🛡️ Admin
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-cyan-300">
            ⚡ 3D Experience
          </span>
        </div>
      </div>
    </div>
  );
}
