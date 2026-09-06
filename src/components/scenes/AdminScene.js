import * as THREE from "three";
import { createCardTexture, createIconBadgeTexture, createWindowTexture } from "../3d/textureUtils";

/**
 * Builds the Admin Control Center & Miniature Hostel Network 3D Environment
 * Elements:
 * - Hexagonal command podium with glowing cybernetic ring circuits
 * - Central miniature 3D hostel building
 * - 3 Database server canisters with glowing LED strips rotating slowly
 * - Interactive node network:
 *     Student Node -> Hostel Core -> Warden Node -> Admin Console -> Database
 * - Moving data packets (glowing pulses traveling along connecting lines)
 * - Translucent glass dashboard card with rising analytics graph bars
 * - Illuminating Admin Security Shield
 */
export function createAdminScene() {
  const group = new THREE.Group();
  group.name = "AdminScene";

  // Palette: Deep navy, dark teal, emerald, violet, indigo, soft mint
  const navy = 0x070d1e;
  const teal = 0x0f3b46;
  const emerald = 0x10b981;
  const violet = 0x8b5cf6;
  const indigo = 0x6366f1;
  const mint = 0xa7f3d0;

  // 1. Hexagonal Control Podium
  const baseGeo = new THREE.CylinderGeometry(2.8, 3.1, 0.25, 6);
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x091428,
    roughness: 0.3,
    metalness: 0.5
  });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.y = -1.4;
  group.add(base);

  // Concentric Glowing Neon Rings on Podium
  const outerRingGeo = new THREE.RingGeometry(2.5, 2.65, 32);
  const outerRingMat = new THREE.MeshBasicMaterial({ color: violet, side: THREE.DoubleSide });
  const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
  outerRing.rotation.x = -Math.PI / 2;
  outerRing.position.y = -1.26;
  group.add(outerRing);

  const innerRingGeo = new THREE.RingGeometry(1.6, 1.72, 32);
  const innerRingMat = new THREE.MeshBasicMaterial({ color: mint, side: THREE.DoubleSide });
  const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
  innerRing.rotation.x = -Math.PI / 2;
  innerRing.position.y = -1.25;
  group.add(innerRing);

  // 2. Central Miniature 3D Hostel Building
  const hostelGroup = new THREE.Group();
  const windowTex = createWindowTexture();

  // Main Central Tower
  const towerGeo = new THREE.BoxGeometry(1.4, 2.2, 1.2);
  const towerMat = new THREE.MeshStandardMaterial({
    color: 0x111c38,
    roughness: 0.3,
    metalness: 0.5,
    map: windowTex
  });
  const tower = new THREE.Mesh(towerGeo, towerMat);
  tower.position.y = -0.15;
  hostelGroup.add(tower);

  // East Wing
  const eastWingGeo = new THREE.BoxGeometry(0.9, 1.6, 0.9);
  const eastWingMat = new THREE.MeshStandardMaterial({
    color: 0x0e243a,
    roughness: 0.4,
    map: windowTex
  });
  const eastWing = new THREE.Mesh(eastWingGeo, eastWingMat);
  eastWing.position.set(1.05, -0.45, 0.1);
  hostelGroup.add(eastWing);

  // Glowing Canopy Entrance
  const entranceGeo = new THREE.BoxGeometry(0.9, 0.08, 0.6);
  const entranceMat = new THREE.MeshStandardMaterial({ color: emerald, emissive: emerald, emissiveIntensity: 0.5 });
  const entrance = new THREE.Mesh(entranceGeo, entranceMat);
  entrance.position.set(0, -0.9, 0.7);
  hostelGroup.add(entrance);

  // Rooftop Mast / Status Beacon
  const mastGeo = new THREE.CylinderGeometry(0.02, 0.03, 0.6, 8);
  const mastMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 });
  const mast = new THREE.Mesh(mastGeo, mastMat);
  mast.position.set(0, 1.25, 0);
  hostelGroup.add(mast);

  const beaconGeo = new THREE.SphereGeometry(0.08, 16, 16);
  const beaconMat = new THREE.MeshBasicMaterial({ color: mint });
  const beacon = new THREE.Mesh(beaconGeo, beaconMat);
  beacon.position.set(0, 1.55, 0);
  hostelGroup.add(beacon);

  group.add(hostelGroup);

  // 3. Database Server Canisters (3 stacked cylinders on left)
  const dbGroup = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const canisterGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.28, 24);
    const canisterMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.3,
      metalness: 0.7
    });
    const canister = new THREE.Mesh(canisterGeo, canisterMat);
    canister.position.y = i * 0.35;
    dbGroup.add(canister);

    // Glowing LED Ring on each canister
    const ledGeo = new THREE.RingGeometry(0.56, 0.58, 24);
    const ledMat = new THREE.MeshBasicMaterial({ color: mint, side: THREE.DoubleSide });
    const led = new THREE.Mesh(ledGeo, ledMat);
    led.rotation.x = Math.PI / 2;
    led.position.y = i * 0.35;
    dbGroup.add(led);
  }
  dbGroup.position.set(-1.8, -0.6, 0.3);
  group.add(dbGroup);

  // 4. Translucent Glass Analytics Dashboard Card (with animated rising bars)
  const dashGroup = new THREE.Group();
  const dashBackGeo = new THREE.PlaneGeometry(1.6, 1.1);
  const dashBackMat = new THREE.MeshPhysicalMaterial({
    color: 0x0a1628,
    transmission: 0.75,
    opacity: 0.85,
    transparent: true,
    roughness: 0.2,
    metalness: 0.2
  });
  const dashBack = new THREE.Mesh(dashBackGeo, dashBackMat);
  dashGroup.add(dashBack);

  // Animated Rising Bar Charts on the Dashboard
  const barMeshes = [];
  const barHeights = [0.25, 0.45, 0.7, 0.55, 0.85];
  for (let b = 0; b < 5; b++) {
    const barGeo = new THREE.BoxGeometry(0.12, 1.0, 0.04);
    const barMat = new THREE.MeshBasicMaterial({
      color: b % 2 === 0 ? emerald : mint
    });
    const bar = new THREE.Mesh(barGeo, barMat);
    bar.position.set(-0.5 + b * 0.25, -0.3, 0.03);
    dashGroup.add(bar);
    barMeshes.push({ mesh: bar, baseHeight: barHeights[b] });
  }

  dashGroup.position.set(1.9, -0.2, 0.4);
  dashGroup.rotation.y = -0.35;
  group.add(dashGroup);

  // 5. Illuminating Admin Security Shield (Top Center)
  const shieldGeo = new THREE.CylinderGeometry(0.65, 0.55, 0.1, 6);
  const shieldMat = new THREE.MeshStandardMaterial({
    color: violet,
    roughness: 0.2,
    metalness: 0.8,
    wireframe: true
  });
  const shield = new THREE.Mesh(shieldGeo, shieldMat);
  shield.rotation.x = Math.PI / 2;
  shield.position.set(0, 1.8, 0);
  group.add(shield);

  // Shield Emblem Core
  const shieldCoreGeo = new THREE.SphereGeometry(0.2, 16, 16);
  const shieldCoreMat = new THREE.MeshBasicMaterial({ color: 0xc084fc });
  const shieldCore = new THREE.Mesh(shieldCoreGeo, shieldCoreMat);
  shieldCore.position.set(0, 1.8, 0);
  group.add(shieldCore);

  // 6. Interactive Network Nodes (Student Management, Warden Management, System Config)
  const nodeDefs = [
    { label: "Student Hub", sub: "1,240 Active", sym: "🎓", col: "#10b981", pos: [-1.9, 0.8, -0.2] },
    { label: "Warden Deck", sub: "8 In-Charge", sym: "📋", col: "#fbbf24", pos: [1.8, 0.9, -0.2] },
    { label: "Notice Admin", sub: "Published", sym: "📢", col: "#a855f7", pos: [0, -1.0, 1.4] }
  ];

  const nodeMeshes = [];
  nodeDefs.forEach((nd) => {
    const nTex = createIconBadgeTexture({
      label: nd.label,
      sublabel: nd.sub,
      symbol: nd.sym,
      color: nd.col,
      bgColor: "#091428",
      size: 256
    });
    const nGeo = new THREE.PlaneGeometry(0.85, 0.85);
    const nMat = new THREE.MeshBasicMaterial({ map: nTex, side: THREE.DoubleSide });
    const nMesh = new THREE.Mesh(nGeo, nMat);
    nMesh.position.set(...nd.pos);
    group.add(nMesh);
    nodeMeshes.push(nMesh);
  });

  // 7. Network Connection Lines & Traveling Data Packets
  const lineMat = new THREE.LineBasicMaterial({
    color: mint,
    transparent: true,
    opacity: 0.65
  });
  const linePositions = [];
  // Connect shield -> building, building -> student hub, building -> warden deck, building -> database
  const linePoints = [
    [0, 1.8, 0], [0, 0, 0],
    [0, 0, 0], [-1.9, 0.8, -0.2],
    [0, 0, 0], [1.8, 0.9, -0.2],
    [0, 0, 0], [-1.8, -0.6, 0.3],
    [0, 0, 0], [1.9, -0.2, 0.4]
  ];
  linePoints.forEach(([x, y, z]) => linePositions.push(x, y, z));

  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute("position", new THREE.Float32BufferAttribute(linePositions, 3));
  const networkLines = new THREE.LineSegments(lineGeo, lineMat);
  group.add(networkLines);

  // Traveling glowing data packets along lines
  const packetCount = 4;
  const packetGeo = new THREE.SphereGeometry(0.06, 12, 12);
  const packetMat = new THREE.MeshBasicMaterial({ color: mint });
  const packets = [];
  for (let p = 0; p < packetCount; p++) {
    const pMesh = new THREE.Mesh(packetGeo, packetMat);
    group.add(pMesh);
    packets.push({ mesh: pMesh, routeIdx: p % 4, offset: p * 0.25 });
  }

  // Animation tick function
  function update(elapsed) {
    // Miniature hostel building gentle rotation
    hostelGroup.rotation.y = elapsed * 0.0004;

    // Beacon blink
    beaconMat.color.setHex(Math.sin(elapsed * 0.008) > 0 ? 0x6ee7b7 : 0x059669);

    // Database canisters rotate slowly
    dbGroup.rotation.y = elapsed * 0.0008;

    // Security shield soft rotation & breathing
    shield.rotation.z = elapsed * 0.001;
    shieldCore.scale.setScalar(1.0 + Math.sin(elapsed * 0.004) * 0.15);

    // Rising analytics graph bars
    barMeshes.forEach(({ mesh, baseHeight }, idx) => {
      const scaleY = baseHeight * (0.8 + Math.sin(elapsed * 0.003 + idx) * 0.3);
      mesh.scale.y = scaleY;
      mesh.position.y = -0.3 + scaleY * 0.5;
    });

    // Traveling data packets animation
    packets.forEach((pkt) => {
      const progress = ((elapsed * 0.0006 + pkt.offset) % 1.0);
      let targetEnd = [0, 0, 0];
      if (pkt.routeIdx === 0) targetEnd = [-1.9, 0.8, -0.2];
      else if (pkt.routeIdx === 1) targetEnd = [1.8, 0.9, -0.2];
      else if (pkt.routeIdx === 2) targetEnd = [-1.8, -0.6, 0.3];
      else targetEnd = [1.9, -0.2, 0.4];

      pkt.mesh.position.x = 0 + (targetEnd[0] - 0) * progress;
      pkt.mesh.position.y = 0 + (targetEnd[1] - 0) * progress;
      pkt.mesh.position.z = 0 + (targetEnd[2] - 0) * progress;
    });
  }

  return { group, update };
}
