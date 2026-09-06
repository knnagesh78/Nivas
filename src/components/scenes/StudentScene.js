import * as THREE from "three";
import { createCardTexture, createIconBadgeTexture } from "../3d/textureUtils";

/**
 * Builds the soft-3D Student Hostel-Life Environment
 * Elements:
 * - Hostel room floor slab with soft rug
 * - Study table with rounded legs & modern chair
 * - Student figure seated at desk studying
 * - Laptop with glowing screen typing animation
 * - Books stack & desk lamp
 * - Backpack resting beside desk
 * - Student ID card floating with lanyard
 * - Attendance card with glowing checkmark tick
 * - Floating leave application document
 * - Notice board card
 * - Complaint speech bubble
 * - Lost & Found box with opening lid
 */
export function createStudentScene() {
  const group = new THREE.Group();
  group.name = "StudentScene";

  // Palette: Deep navy, teal, emerald, violet, soft mint, off-white
  const navy = 0x0a1128;
  const teal = 0x0f3b46;
  const emerald = 0x10b981;
  const violet = 0x8b5cf6;
  const indigo = 0x6366f1;
  const mint = 0xa7f3d0;
  const wood = 0x1e293b;
  const offWhite = 0xf8fafc;

  // 1. Room Floor Slab (Soft isometric base with rounded feel)
  const floorGeo = new THREE.BoxGeometry(5.2, 0.25, 4.4);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x0e1838,
    roughness: 0.4,
    metalness: 0.2
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.position.y = -1.5;
  group.add(floor);

  // Soft Room Rug
  const rugGeo = new THREE.BoxGeometry(3.6, 0.04, 3.0);
  const rugMat = new THREE.MeshStandardMaterial({
    color: 0x132347,
    roughness: 0.8
  });
  const rug = new THREE.Mesh(rugGeo, rugMat);
  rug.position.set(0, -1.35, 0.2);
  group.add(rug);

  // Mint trim line on rug
  const rugTrimGeo = new THREE.BoxGeometry(3.4, 0.05, 0.08);
  const rugTrimMat = new THREE.MeshBasicMaterial({ color: mint });
  const rugTrim = new THREE.Mesh(rugTrimGeo, rugTrimMat);
  rugTrim.position.set(0, -1.33, 1.6);
  group.add(rugTrim);

  // 2. Study Table
  const tableGroup = new THREE.Group();
  const tableTopGeo = new THREE.BoxGeometry(2.4, 0.1, 1.3);
  const tableTopMat = new THREE.MeshStandardMaterial({
    color: wood,
    roughness: 0.3,
    metalness: 0.3
  });
  const tableTop = new THREE.Mesh(tableTopGeo, tableTopMat);
  tableTop.position.set(0, -0.4, 0);
  tableGroup.add(tableTop);

  // Table Legs (4 rounded legs)
  const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.95, 12);
  const legMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.3 });
  const legPositions = [
    [-1.05, -0.9, -0.5],
    [1.05, -0.9, -0.5],
    [-1.05, -0.9, 0.5],
    [1.05, -0.9, 0.5]
  ];
  legPositions.forEach(([x, y, z]) => {
    const leg = new THREE.Mesh(legGeo, legMat);
    leg.position.set(x, y, z);
    tableGroup.add(leg);
  });
  group.add(tableGroup);

  // 3. Laptop (Base + Screen)
  const laptopGroup = new THREE.Group();
  const lapBaseGeo = new THREE.BoxGeometry(0.65, 0.02, 0.45);
  const lapMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.2 });
  const lapBase = new THREE.Mesh(lapBaseGeo, lapMat);
  laptopGroup.add(lapBase);

  const lapScreenGeo = new THREE.BoxGeometry(0.65, 0.42, 0.02);
  const lapScreen = new THREE.Mesh(lapScreenGeo, lapMat);
  lapScreen.position.set(0, 0.21, -0.21);
  lapScreen.rotation.x = -0.18;
  laptopGroup.add(lapScreen);

  // Glowing screen face
  const screenFaceGeo = new THREE.PlaneGeometry(0.58, 0.36);
  const screenFaceMat = new THREE.MeshBasicMaterial({ color: mint });
  const screenFace = new THREE.Mesh(screenFaceGeo, screenFaceMat);
  screenFace.position.set(0, 0.21, -0.19);
  screenFace.rotation.x = -0.18;
  laptopGroup.add(screenFace);

  laptopGroup.position.set(-0.1, -0.34, 0);
  group.add(laptopGroup);

  // 4. Stylized Soft-3D Student Figure
  const studentGroup = new THREE.Group();

  // Torso / Hoodie
  const torsoGeo = new THREE.CylinderGeometry(0.24, 0.3, 0.65, 16);
  const torsoMat = new THREE.MeshStandardMaterial({ color: indigo, roughness: 0.5 });
  const torso = new THREE.Mesh(torsoGeo, torsoMat);
  torso.position.set(0, -0.35, 0.85);
  studentGroup.add(torso);

  // Head
  const headGeo = new THREE.SphereGeometry(0.2, 20, 20);
  const headMat = new THREE.MeshStandardMaterial({ color: 0xfcd34d, roughness: 0.6 });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.set(0, 0.12, 0.85);
  studentGroup.add(head);

  // Modern Headphones
  const hpBandGeo = new THREE.TorusGeometry(0.22, 0.03, 12, 24, Math.PI);
  const hpMat = new THREE.MeshStandardMaterial({ color: mint, metalness: 0.5 });
  const hpBand = new THREE.Mesh(hpBandGeo, hpMat);
  hpBand.position.set(0, 0.14, 0.85);
  hpBand.rotation.z = Math.PI;
  studentGroup.add(hpBand);

  // Arms typing towards laptop
  const armGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.45, 12);
  const armMat = new THREE.MeshStandardMaterial({ color: indigo, roughness: 0.5 });
  const leftArm = new THREE.Mesh(armGeo, armMat);
  leftArm.position.set(-0.24, -0.3, 0.55);
  leftArm.rotation.set(0.6, 0, 0.3);
  studentGroup.add(leftArm);

  const rightArm = new THREE.Mesh(armGeo, armMat);
  rightArm.position.set(0.24, -0.3, 0.55);
  rightArm.rotation.set(0.6, 0, -0.3);
  studentGroup.add(rightArm);

  group.add(studentGroup);

  // 5. Backpack beside table
  const bpGroup = new THREE.Group();
  const bpBodyGeo = new THREE.BoxGeometry(0.35, 0.5, 0.28);
  const bpMat = new THREE.MeshStandardMaterial({ color: teal, roughness: 0.6 });
  const bpBody = new THREE.Mesh(bpBodyGeo, bpMat);
  bpGroup.add(bpBody);

  const bpPocketGeo = new THREE.BoxGeometry(0.26, 0.24, 0.1);
  const bpPocketMat = new THREE.MeshStandardMaterial({ color: emerald });
  const bpPocket = new THREE.Mesh(bpPocketGeo, bpPocketMat);
  bpPocket.position.set(0, -0.1, 0.18);
  bpGroup.add(bpPocket);

  bpGroup.position.set(1.4, -1.05, 0.4);
  bpGroup.rotation.set(0.1, -0.4, 0.1);
  group.add(bpGroup);

  // 6. Books Stack on Desk
  const bookGroup = new THREE.Group();
  const bookColors = [violet, mint, teal];
  for (let i = 0; i < 3; i++) {
    const bGeo = new THREE.BoxGeometry(0.32, 0.05, 0.42);
    const bMat = new THREE.MeshStandardMaterial({ color: bookColors[i], roughness: 0.4 });
    const bMesh = new THREE.Mesh(bGeo, bMat);
    bMesh.position.y = i * 0.055;
    bMesh.rotation.y = (i - 1) * 0.08;
    bookGroup.add(bMesh);
  }
  bookGroup.position.set(-0.85, -0.32, -0.1);
  group.add(bookGroup);

  // =========================================================================
  // FLOATING INTERACTIVE FEATURE OBJECTS
  // =========================================================================

  // A) Student ID Card Floating on Left
  const idTex = createCardTexture({
    title: "STUDENT ID",
    subtitle: "Hostel Resident Pass",
    bgGradient: ["#0f3b46", "#0a1128"],
    accentColor: "#34d399",
    width: 512,
    height: 320
  });
  const idCardGeo = new THREE.BoxGeometry(1.6, 1.0, 0.04);
  const idCardMat = new THREE.MeshStandardMaterial({ map: idTex, metalness: 0.2, roughness: 0.3 });
  const idCardMesh = new THREE.Mesh(idCardGeo, idCardMat);
  idCardMesh.position.set(-1.8, 0.9, 0.4);
  idCardMesh.rotation.set(0.1, 0.35, -0.05);
  group.add(idCardMesh);

  // B) Attendance Card with Pulsing Checkmark
  const attTex = createIconBadgeTexture({
    label: "Attendance",
    sublabel: "98% Present",
    symbol: "✓",
    color: "#10b981",
    bgColor: "#064e3b"
  });
  const attGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.08, 32);
  const attMat = new THREE.MeshStandardMaterial({ map: attTex, metalness: 0.3, roughness: 0.2 });
  const attMesh = new THREE.Mesh(attGeo, attMat);
  attMesh.rotation.x = Math.PI / 2;
  attMesh.position.set(1.9, 1.2, -0.4);
  group.add(attMesh);

  // C) Floating Leave Application Document
  const leaveTex = createIconBadgeTexture({
    label: "Leave Pass",
    sublabel: "Approved",
    symbol: "✉️",
    color: "#a7f3d0",
    bgColor: "#0f3b46"
  });
  const leaveGeo = new THREE.BoxGeometry(0.9, 1.15, 0.04);
  const leaveMat = new THREE.MeshStandardMaterial({ map: leaveTex, roughness: 0.4 });
  const leaveMesh = new THREE.Mesh(leaveGeo, leaveMat);
  leaveMesh.position.set(-1.9, -0.5, -0.3);
  leaveMesh.rotation.set(-0.15, 0.3, 0.05);
  group.add(leaveMesh);

  // D) Notice Board Card
  const noticeTex = createIconBadgeTexture({
    label: "Hostel Notice",
    sublabel: "New Postings",
    symbol: "📢",
    color: "#8b5cf6",
    bgColor: "#2e1065"
  });
  const noticeGeo = new THREE.BoxGeometry(1.05, 1.05, 0.04);
  const noticeMat = new THREE.MeshStandardMaterial({ map: noticeTex, roughness: 0.4 });
  const noticeMesh = new THREE.Mesh(noticeGeo, noticeMat);
  noticeMesh.position.set(1.8, -0.4, 0.5);
  noticeMesh.rotation.set(0.1, -0.3, 0.08);
  group.add(noticeMesh);

  // E) Complaint Message Box / Speech Bubble
  const compTex = createIconBadgeTexture({
    label: "Complaints",
    sublabel: "Quick Resolve",
    symbol: "💬",
    color: "#38bdf8",
    bgColor: "#082f49"
  });
  const compGeo = new THREE.BoxGeometry(0.95, 0.85, 0.04);
  const compMat = new THREE.MeshStandardMaterial({ map: compTex, roughness: 0.4 });
  const compMesh = new THREE.Mesh(compGeo, compMat);
  compMesh.position.set(-0.3, 1.8, -0.6);
  compMesh.rotation.set(0.08, 0.05, -0.02);
  group.add(compMesh);

  // F) Lost & Found Box with Animated Opening Lid
  const lostBoxGroup = new THREE.Group();
  const lBoxGeo = new THREE.BoxGeometry(0.75, 0.5, 0.6);
  const lBoxMat = new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.4 });
  const lBox = new THREE.Mesh(lBoxGeo, lBoxMat);
  lostBoxGroup.add(lBox);

  // Lid pivot group
  const lidPivot = new THREE.Group();
  lidPivot.position.set(0, 0.25, -0.3);
  const lidGeo = new THREE.BoxGeometry(0.78, 0.08, 0.64);
  const lidMat = new THREE.MeshStandardMaterial({ color: mint, roughness: 0.3 });
  const lid = new THREE.Mesh(lidGeo, lidMat);
  lid.position.set(0, 0.04, 0.32);
  lidPivot.add(lid);
  lostBoxGroup.add(lidPivot);

  // Mystery package glow item inside box
  const insideItemGeo = new THREE.SphereGeometry(0.12, 16, 16);
  const insideItemMat = new THREE.MeshBasicMaterial({ color: 0x6ee7b7 });
  const insideItem = new THREE.Mesh(insideItemGeo, insideItemMat);
  insideItem.position.set(0, 0.1, 0);
  lostBoxGroup.add(insideItem);

  lostBoxGroup.position.set(0.1, -1.15, -1.2);
  group.add(lostBoxGroup);

  // Update animation tick function
  function update(elapsed) {
    // Student typing subtle motion
    leftArm.rotation.x = 0.6 + Math.sin(elapsed * 0.006) * 0.04;
    rightArm.rotation.x = 0.6 + Math.cos(elapsed * 0.007) * 0.04;
    screenFaceMat.color.setHex((Math.sin(elapsed * 0.003) > 0) ? 0xa7f3d0 : 0x6ee7b7);

    // ID Card floating gently
    idCardMesh.position.y = 0.9 + Math.sin(elapsed * 0.002) * 0.08;
    idCardMesh.rotation.y = 0.35 + Math.cos(elapsed * 0.0015) * 0.06;

    // Attendance pulse & subtle rotation
    attMesh.position.y = 1.2 + Math.cos(elapsed * 0.0025) * 0.08;
    attMesh.rotation.z = elapsed * 0.0008;

    // Leave card gently bobbing
    leaveMesh.position.y = -0.5 + Math.sin(elapsed * 0.0022) * 0.07;

    // Notice card subtle slide
    noticeMesh.position.y = -0.4 + Math.cos(elapsed * 0.002) * 0.08;

    // Lost & found lid opening slightly (0 to ~22 degrees)
    const lidCycle = (Math.sin(elapsed * 0.002) + 1) * 0.5;
    lidPivot.rotation.x = -lidCycle * 0.38;

    // Complaint bubble float
    compMesh.position.y = 1.8 + Math.sin(elapsed * 0.0028) * 0.06;
  }

  return { group, update };
}
