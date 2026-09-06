import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { createCardTexture, createIconBadgeTexture } from "./textureUtils";

export default function Portal3DScene({ role = "student" }) {
  const mountRef = useRef(null);
  const currentRoleRef = useRef(role);
  const sceneElementsRef = useRef({
    studentGroup: null,
    wardenGroup: null,
    adminGroup: null,
    approvalDoc: null,
    approvalCheck: null,
    adminLines: null
  });

  // Keep currentRoleRef in sync
  useEffect(() => {
    currentRoleRef.current = role;
  }, [role]);

  useEffect(() => {
    let animId;
    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || 400;
    let height = container.clientHeight || 400;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x060914, 0.04);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 50);
    camera.position.set(0, 0, 9);

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch (e) {
      console.warn("Portal3DScene WebGL unavailable:", e);
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 2. Lights
    const ambientLight = new THREE.AmbientLight(0x4338ca, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x818cf8, 2.0);
    keyLight.position.set(5, 8, 8);
    scene.add(keyLight);

    const fillLight = new THREE.PointLight(0x38bdf8, 2.5, 15);
    fillLight.position.set(-4, -2, 4);
    scene.add(fillLight);

    const backGlow = new THREE.PointLight(0xa855f7, 2.0, 16);
    backGlow.position.set(0, 3, -4);
    scene.add(backGlow);

    // =========================================================================
    // 3. STUDENT PORTAL 3D OBJECTS
    // =========================================================================
    const studentGroup = new THREE.Group();

    // A) Student ID Card
    const idTex = createCardTexture({
      title: "STUDENT IDENTITY",
      subtitle: "Hostel Resident Pass",
      bgGradient: ["#1e1b4b", "#0f172a"],
      accentColor: "#6366f1",
      width: 512,
      height: 320
    });
    const idCardGeo = new THREE.BoxGeometry(2.4, 1.5, 0.06);
    const idCardMat = new THREE.MeshStandardMaterial({
      map: idTex,
      metalness: 0.2,
      roughness: 0.3
    });
    const idCardMesh = new THREE.Mesh(idCardGeo, idCardMat);
    idCardMesh.position.set(-0.2, 0.3, 0.5);
    idCardMesh.rotation.set(0.1, -0.2, 0.05);
    studentGroup.add(idCardMesh);

    // B) Attendance Checkmark Token
    const attTex = createIconBadgeTexture({
      label: "Attendance",
      sublabel: "98% Present",
      symbol: "✓",
      color: "#10b981",
      bgColor: "#064e3b"
    });
    const attGeo = new THREE.CylinderGeometry(0.65, 0.65, 0.1, 32);
    const attMat = new THREE.MeshStandardMaterial({ map: attTex, metalness: 0.4, roughness: 0.2 });
    const attMesh = new THREE.Mesh(attGeo, attMat);
    attMesh.rotation.x = Math.PI / 2;
    attMesh.position.set(1.9, 1.4, -0.6);
    studentGroup.add(attMesh);

    // C) Leave Letter Scroll
    const letterTex = createIconBadgeTexture({
      label: "Leave Pass",
      sublabel: "Granted",
      symbol: "✉️",
      color: "#38bdf8",
      bgColor: "#0c4a6e"
    });
    const letterGeo = new THREE.BoxGeometry(1.0, 1.3, 0.05);
    const letterMat = new THREE.MeshStandardMaterial({ map: letterTex, roughness: 0.4 });
    const letterMesh = new THREE.Mesh(letterGeo, letterMat);
    letterMesh.position.set(-2.0, -1.1, -0.5);
    letterMesh.rotation.set(-0.15, 0.3, -0.1);
    studentGroup.add(letterMesh);

    // D) Notice Board Card
    const noticeTex = createIconBadgeTexture({
      label: "Notice Board",
      sublabel: "New Updates",
      symbol: "📢",
      color: "#a855f7",
      bgColor: "#3b0764"
    });
    const noticeGeo = new THREE.BoxGeometry(1.1, 1.1, 0.05);
    const noticeMat = new THREE.MeshStandardMaterial({ map: noticeTex, roughness: 0.4 });
    const noticeMesh = new THREE.Mesh(noticeGeo, noticeMat);
    noticeMesh.position.set(2.0, -1.0, 0.2);
    noticeMesh.rotation.set(0.1, -0.3, 0.08);
    studentGroup.add(noticeMesh);

    // E) Complaint / Feedback Bubble
    const complaintTex = createIconBadgeTexture({
      label: "Complaints",
      sublabel: "Resolved",
      symbol: "💬",
      color: "#fb923c",
      bgColor: "#431407"
    });
    const complaintGeo = new THREE.BoxGeometry(1.0, 0.9, 0.05);
    const complaintMat = new THREE.MeshStandardMaterial({ map: complaintTex, roughness: 0.4 });
    const complaintMesh = new THREE.Mesh(complaintGeo, complaintMat);
    complaintMesh.position.set(-1.8, 1.6, -0.8);
    complaintMesh.rotation.set(0.2, 0.25, -0.05);
    studentGroup.add(complaintMesh);

    // F) 3D Lost & Found Parcel Box
    const boxGroup = new THREE.Group();
    const boxGeo = new THREE.BoxGeometry(0.9, 0.9, 0.9);
    const boxMat = new THREE.MeshStandardMaterial({
      color: 0x6366f1,
      roughness: 0.3,
      metalness: 0.4
    });
    const boxMesh = new THREE.Mesh(boxGeo, boxMat);
    boxGroup.add(boxMesh);

    // Box Ribbon
    const ribbonGeo = new THREE.BoxGeometry(0.92, 0.18, 0.92);
    const ribbonMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const ribbonMesh = new THREE.Mesh(ribbonGeo, ribbonMat);
    boxGroup.add(ribbonMesh);

    boxGroup.position.set(0.1, -1.8, -0.2);
    boxGroup.rotation.set(0.3, 0.5, 0.2);
    studentGroup.add(boxGroup);

    scene.add(studentGroup);

    // =========================================================================
    // 4. WARDEN PORTAL 3D OBJECTS
    // =========================================================================
    const wardenGroup = new THREE.Group();
    wardenGroup.visible = false;

    // A) Warden Clipboard
    const boardGeo = new THREE.BoxGeometry(2.3, 3.2, 0.1);
    const boardMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.4,
      metalness: 0.6
    });
    const boardMesh = new THREE.Mesh(boardGeo, boardMat);
    wardenGroup.add(boardMesh);

    // Metallic Clip on Top
    const clipGeo = new THREE.BoxGeometry(1.1, 0.35, 0.2);
    const clipMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9, roughness: 0.2 });
    const clipMesh = new THREE.Mesh(clipGeo, clipMat);
    clipMesh.position.set(0, 1.5, 0.08);
    wardenGroup.add(clipMesh);

    // Sheet on Clipboard
    const sheetGeo = new THREE.PlaneGeometry(1.9, 2.6);
    const sheetTex = createCardTexture({
      title: "LEAVE REGISTER",
      subtitle: "Approvals & Sign-offs",
      bgGradient: ["#0f172a", "#1e1b4b"],
      accentColor: "#f59e0b",
      width: 512,
      height: 400
    });
    const sheetMat = new THREE.MeshBasicMaterial({ map: sheetTex });
    const sheetMesh = new THREE.Mesh(sheetGeo, sheetMat);
    sheetMesh.position.set(0, -0.1, 0.06);
    wardenGroup.add(sheetMesh);

    // Animated Floating Approval Request Card moving to clipboard
    const approvalDocGeo = new THREE.BoxGeometry(1.2, 0.85, 0.03);
    const approvalTex = createIconBadgeTexture({
      label: "Leave Request",
      sublabel: "Room 302",
      symbol: "📝",
      color: "#f59e0b",
      bgColor: "#451a03"
    });
    const approvalMat = new THREE.MeshStandardMaterial({ map: approvalTex, roughness: 0.3 });
    const approvalDoc = new THREE.Mesh(approvalDocGeo, approvalMat);
    approvalDoc.position.set(2.0, 0.4, 0.7);
    wardenGroup.add(approvalDoc);

    // Glowing Green Tick / Approval Stamp Indicator
    const checkGeo = new THREE.RingGeometry(0.35, 0.48, 32);
    const checkMat = new THREE.MeshBasicMaterial({ color: 0x10b981, side: THREE.DoubleSide });
    const approvalCheck = new THREE.Mesh(checkGeo, checkMat);
    approvalCheck.position.set(0.4, -0.4, 0.12);
    wardenGroup.add(approvalCheck);

    // B) Golden Master Key
    const keyGroup = new THREE.Group();
    const keyRingGeo = new THREE.TorusGeometry(0.35, 0.08, 16, 32);
    const keyRingMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.95, roughness: 0.15 });
    const keyRing = new THREE.Mesh(keyRingGeo, keyRingMat);
    keyGroup.add(keyRing);

    const keyShaftGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.2, 16);
    const keyShaft = new THREE.Mesh(keyShaftGeo, keyRingMat);
    keyShaft.position.set(0, -0.8, 0);
    keyGroup.add(keyShaft);

    const keyBitGeo = new THREE.BoxGeometry(0.3, 0.15, 0.08);
    const keyBit = new THREE.Mesh(keyBitGeo, keyRingMat);
    keyBit.position.set(0.15, -1.2, 0);
    keyGroup.add(keyBit);

    keyGroup.position.set(-2.2, 1.0, 0.2);
    keyGroup.rotation.set(0.4, 0.5, 0.1);
    wardenGroup.add(keyGroup);

    // C) Student Records Card
    const recordsTex = createIconBadgeTexture({
      label: "Records",
      sublabel: "Roll Verification",
      symbol: "👥",
      color: "#60a5fa",
      bgColor: "#172554"
    });
    const recordsGeo = new THREE.BoxGeometry(1.1, 1.1, 0.05);
    const recordsMat = new THREE.MeshStandardMaterial({ map: recordsTex });
    const recordsMesh = new THREE.Mesh(recordsGeo, recordsMat);
    recordsMesh.position.set(-2.0, -1.3, -0.2);
    recordsMesh.rotation.set(-0.2, 0.3, 0);
    wardenGroup.add(recordsMesh);

    scene.add(wardenGroup);

    // =========================================================================
    // 5. ADMIN PORTAL 3D OBJECTS
    // =========================================================================
    const adminGroup = new THREE.Group();
    adminGroup.visible = false;

    // A) Central Holographic Command Shield
    const shieldGeo = new THREE.CylinderGeometry(1.2, 1.0, 0.15, 6);
    const shieldMat = new THREE.MeshStandardMaterial({
      color: 0x8b5cf6,
      metalness: 0.8,
      roughness: 0.2,
      wireframe: true
    });
    const shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    shieldMesh.rotation.x = Math.PI / 2;
    shieldMesh.position.set(0, 0.2, 0);
    adminGroup.add(shieldMesh);

    // B) Database Storage Disks (3 Cylinders Stack)
    const dbGroup = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const diskGeo = new THREE.CylinderGeometry(0.85, 0.85, 0.35, 32);
      const diskMat = new THREE.MeshStandardMaterial({
        color: 0x1e1b4b,
        metalness: 0.8,
        roughness: 0.25
      });
      const disk = new THREE.Mesh(diskGeo, diskMat);
      disk.position.y = i * 0.45;
      dbGroup.add(disk);

      // Neon LED strip on each disk
      const ledGeo = new THREE.RingGeometry(0.86, 0.88, 32);
      const ledMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide });
      const led = new THREE.Mesh(ledGeo, ledMat);
      led.rotation.x = Math.PI / 2;
      led.position.y = i * 0.45;
      dbGroup.add(led);
    }
    dbGroup.position.set(-2.0, -0.6, 0);
    dbGroup.rotation.set(0.3, 0.4, 0);
    adminGroup.add(dbGroup);

    // C) Management Node Spheres (Warden Hub, Student Directory, System Config)
    const nodeConfigs = [
      { sym: "🛡️", col: "#ec4899", pos: [0, 2.0, -0.3], name: "Core" },
      { sym: "👔", col: "#fbbf24", pos: [2.2, 1.1, 0.2], name: "Wardens" },
      { sym: "🎓", col: "#818cf8", pos: [2.0, -1.2, 0.1], name: "Students" },
      { sym: "⚙️", col: "#34d399", pos: [-1.8, 1.7, -0.2], name: "Config" }
    ];

    const nodeMeshes = [];
    nodeConfigs.forEach((cfg) => {
      const nTex = createIconBadgeTexture({
        label: cfg.name,
        sublabel: "Online",
        symbol: cfg.sym,
        color: cfg.col,
        bgColor: "#1e1b4b",
        size: 256
      });
      const nGeo = new THREE.PlaneGeometry(1.0, 1.0);
      const nMat = new THREE.MeshBasicMaterial({ map: nTex, side: THREE.DoubleSide });
      const nMesh = new THREE.Mesh(nGeo, nMat);
      nMesh.position.set(...cfg.pos);
      adminGroup.add(nMesh);
      nodeMeshes.push(nMesh);
    });

    // Interconnected glowing lines between nodes
    const lineMat = new THREE.LineBasicMaterial({
      color: 0xc084fc,
      transparent: true,
      opacity: 0.6
    });
    const lineGeo = new THREE.BufferGeometry();
    const linePositions = [];
    // connect center shield to each outer node
    nodeConfigs.forEach((cfg) => {
      linePositions.push(0, 0.2, 0);
      linePositions.push(...cfg.pos);
    });
    lineGeo.setAttribute("position", new THREE.Float32BufferAttribute(linePositions, 3));
    const adminLines = new THREE.LineSegments(lineGeo, lineMat);
    adminGroup.add(adminLines);

    scene.add(adminGroup);

    // Save refs for animation
    sceneElementsRef.current = {
      studentGroup,
      wardenGroup,
      adminGroup,
      approvalDoc,
      approvalCheck,
      adminLines,
      nodeMeshes,
      boxGroup
    };

    // 6. Mouse / Touch Parallax Tracking
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handlePointerMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetX = x * 0.8;
      targetY = y * 0.5;
    };
    window.addEventListener("pointermove", handlePointerMove);

    // 7. Render & Physics Loop
    let startTime = performance.now();

    const animate = (time) => {
      animId = requestAnimationFrame(animate);
      const elapsed = time - startTime;

      // Parallax easing
      mouseX += (targetX - mouseX) * 0.05;
      mouseY += (targetY - mouseY) * 0.05;

      camera.position.x = mouseX;
      camera.position.y = mouseY;
      camera.lookAt(0, 0, 0);

      const active = currentRoleRef.current;

      // Smooth Cross-fade / visibility switching
      studentGroup.visible = active === "student";
      wardenGroup.visible = active === "warden";
      adminGroup.visible = active === "admin";

      if (active === "student") {
        // ID card gentle float & wobble
        idCardMesh.position.y = 0.3 + Math.sin(elapsed * 0.002) * 0.12;
        idCardMesh.rotation.y = -0.2 + Math.sin(elapsed * 0.0015) * 0.1;
        idCardMesh.rotation.x = 0.1 + Math.cos(elapsed * 0.0018) * 0.06;

        // Orbiting elements gentle breathing
        attMesh.rotation.z = elapsed * 0.001;
        attMesh.position.y = 1.4 + Math.cos(elapsed * 0.0025) * 0.1;

        letterMesh.position.y = -1.1 + Math.sin(elapsed * 0.0022) * 0.1;
        noticeMesh.position.y = -1.0 + Math.cos(elapsed * 0.002) * 0.12;
        complaintMesh.position.y = 1.6 + Math.sin(elapsed * 0.0028) * 0.08;

        boxGroup.rotation.y = elapsed * 0.001;
        boxGroup.position.y = -1.8 + Math.cos(elapsed * 0.002) * 0.1;
      } else if (active === "warden") {
        boardMesh.rotation.y = Math.sin(elapsed * 0.0015) * 0.08;
        boardMesh.position.y = Math.sin(elapsed * 0.002) * 0.08;

        // Animated Leave Approval Flow: document travels towards clipboard and stamps!
        const cycle = (elapsed % 3000) / 3000; // 3 sec loop
        if (cycle < 0.6) {
          // Document flying from right towards clipboard center
          const t = cycle / 0.6;
          approvalDoc.position.x = 2.0 - t * 1.5;
          approvalDoc.position.y = 0.4 - t * 0.4;
          approvalDoc.scale.setScalar(1.0 - t * 0.15);
          approvalCheck.scale.setScalar(0.001); // hidden
        } else {
          // Stamped! Checkmark blooms with green tick
          approvalDoc.position.x = 0.5;
          approvalDoc.position.y = 0.0;
          const stampT = Math.min((cycle - 0.6) / 0.2, 1.0);
          approvalCheck.scale.setScalar(stampT * 1.2);
        }

        keyGroup.rotation.y = elapsed * 0.0012;
        keyGroup.position.y = 1.0 + Math.sin(elapsed * 0.002) * 0.1;
        recordsMesh.position.y = -1.3 + Math.cos(elapsed * 0.002) * 0.08;
      } else if (active === "admin") {
        // Holographic shield spin
        shieldMesh.rotation.z = elapsed * 0.001;
        shieldMesh.rotation.y = elapsed * 0.0008;

        // DB disks pulse
        dbGroup.position.y = -0.6 + Math.sin(elapsed * 0.002) * 0.1;
        dbGroup.rotation.y = elapsed * 0.0007;

        // Interconnected lines opacity pulse
        lineMat.opacity = 0.4 + Math.sin(elapsed * 0.004) * 0.3;

        // Node badges face camera
        nodeMeshes.forEach((n, idx) => {
          n.position.y = nodeConfigs[idx].pos[1] + Math.sin(elapsed * 0.0025 + idx) * 0.08;
          n.lookAt(camera.position);
        });
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    // Resize handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth || 400;
      const h = container.clientHeight || 400;
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
    <div className="relative w-full h-full min-h-[300px] flex items-center justify-center pointer-events-none select-none">
      {/* Dynamic ambient nebula backlights */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 pointer-events-none ${
          role === "student"
            ? "bg-[radial-gradient(circle_at_45%_45%,rgba(99,102,241,0.28)_0%,transparent_70%)] opacity-100"
            : role === "warden"
            ? "bg-[radial-gradient(circle_at_45%_45%,rgba(245,158,11,0.24)_0%,transparent_70%)] opacity-100"
            : "bg-[radial-gradient(circle_at_45%_45%,rgba(236,72,153,0.25)_0%,transparent_70%)] opacity-100"
        }`}
      />

      {/* 3D WebGL Canvas Viewport */}
      <div ref={mountRef} className="w-full h-full min-h-[300px] flex items-center justify-center" />

      {/* Floating 3D Badge Indicator Pill */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/60 backdrop-blur-md text-[11px] font-semibold text-slate-300 flex items-center space-x-2 shadow-xl">
        <span
          className={`h-2 w-2 rounded-full animate-pulse ${
            role === "student"
              ? "bg-indigo-400 shadow-[0_0_8px_#818cf8]"
              : role === "warden"
              ? "bg-amber-400 shadow-[0_0_8px_#fbbf24]"
              : "bg-rose-400 shadow-[0_0_8px_#f43f5e]"
          }`}
        />
        <span className="tracking-wide">
          {role === "student"
            ? "Student Life & Academic Workspace"
            : role === "warden"
            ? "Warden Supervisory & Approval Deck"
            : "Admin Master Hostel Grid"}
        </span>
      </div>
    </div>
  );
}
