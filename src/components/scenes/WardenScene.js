import * as THREE from "three";
import { createCardTexture, createIconBadgeTexture } from "../3d/textureUtils";

/**
 * Builds the professional Warden Office & Supervisory 3D Environment
 * Elements:
 * - Office floor slab with dark teal/navy executive tone
 * - Warden office desk with rounded edges
 * - Warden figure in professional attire seated at desk
 * - Clipboard with attendance ledger
 * - Golden hostel master keys on ring rotating gently
 * - Student profile cards stacked neatly
 * - Dynamic Leave Approval Action:
 *     Student Leave Request moves toward warden -> stamp moves down -> green [✓ APPROVED] mark blooms!
 * - Notice board panel on office wall
 * - Hostel monitoring status panel with room indicators
 */
export function createWardenScene() {
  const group = new THREE.Group();
  group.name = "WardenScene";

  // Palette: Dark teal, emerald, deep navy, gold/brass, mint
  const navy = 0x070d1e;
  const teal = 0x0f3b46;
  const darkTeal = 0x0a262e;
  const emerald = 0x10b981;
  const mint = 0xa7f3d0;
  const gold = 0xf59e0b;
  const deskWood = 0x1e293b;

  // 1. Executive Office Floor Slab
  const floorGeo = new THREE.BoxGeometry(5.2, 0.25, 4.4);
  const floorMat = new THREE.MeshStandardMaterial({
    color: darkTeal,
    roughness: 0.35,
    metalness: 0.3
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.position.y = -1.5;
  group.add(floor);

  // Emerald/Mint Executive Floor Inlay
  const inlayGeo = new THREE.BoxGeometry(4.6, 0.03, 3.8);
  const inlayMat = new THREE.MeshStandardMaterial({ color: 0x0d333d, roughness: 0.5 });
  const inlay = new THREE.Mesh(inlayGeo, inlayMat);
  inlay.position.set(0, -1.36, 0);
  group.add(inlay);

  // 2. Warden Executive Desk
  const deskGroup = new THREE.Group();
  const deskTopGeo = new THREE.BoxGeometry(2.6, 0.12, 1.4);
  const deskTopMat = new THREE.MeshStandardMaterial({
    color: deskWood,
    roughness: 0.25,
    metalness: 0.4
  });
  const deskTop = new THREE.Mesh(deskTopGeo, deskTopMat);
  deskTop.position.set(0, -0.4, 0);
  deskGroup.add(deskTop);

  // Desk modesty panel & solid pedestal sides
  const sideGeo = new THREE.BoxGeometry(0.1, 0.95, 1.3);
  const sideMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 });
  const leftSide = new THREE.Mesh(sideGeo, sideMat);
  leftSide.position.set(-1.2, -0.9, 0);
  deskGroup.add(leftSide);

  const rightSide = new THREE.Mesh(sideGeo, sideMat);
  rightSide.position.set(1.2, -0.9, 0);
  deskGroup.add(rightSide);

  const backPanelGeo = new THREE.BoxGeometry(2.3, 0.8, 0.06);
  const backPanel = new THREE.Mesh(backPanelGeo, sideMat);
  backPanel.position.set(0, -0.85, -0.6);
  deskGroup.add(backPanel);
  group.add(deskGroup);

  // 3. Stylized Soft-3D Warden Figure
  const wardenGroup = new THREE.Group();

  // Torso / Supervisory Blazer (Teal & Emerald)
  const torsoGeo = new THREE.CylinderGeometry(0.26, 0.32, 0.7, 16);
  const torsoMat = new THREE.MeshStandardMaterial({ color: teal, roughness: 0.4, metalness: 0.2 });
  const torso = new THREE.Mesh(torsoGeo, torsoMat);
  torso.position.set(0, -0.32, 0.85);
  wardenGroup.add(torso);

  // Tie/Badge
  const tieGeo = new THREE.BoxGeometry(0.08, 0.35, 0.04);
  const tieMat = new THREE.MeshBasicMaterial({ color: emerald });
  const tie = new THREE.Mesh(tieGeo, tieMat);
  tie.position.set(0, -0.28, 1.05);
  wardenGroup.add(tie);

  // Head
  const headGeo = new THREE.SphereGeometry(0.2, 20, 20);
  const headMat = new THREE.MeshStandardMaterial({ color: 0xfcd34d, roughness: 0.6 });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.set(0, 0.16, 0.85);
  wardenGroup.add(head);

  // Formal Collar
  const collarGeo = new THREE.TorusGeometry(0.18, 0.04, 12, 24);
  const collarMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc });
  const collar = new THREE.Mesh(collarGeo, collarMat);
  collar.position.set(0, 0.03, 0.85);
  collar.rotation.x = Math.PI / 2;
  wardenGroup.add(collar);

  // Arms holding stamp / inspecting clipboard
  const armGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.48, 12);
  const armMat = new THREE.MeshStandardMaterial({ color: teal, roughness: 0.4 });
  const leftArm = new THREE.Mesh(armGeo, armMat);
  leftArm.position.set(-0.25, -0.3, 0.55);
  leftArm.rotation.set(0.5, 0, 0.25);
  wardenGroup.add(leftArm);

  const rightArm = new THREE.Mesh(armGeo, armMat);
  rightArm.position.set(0.25, -0.3, 0.55);
  rightArm.rotation.set(0.5, 0, -0.25);
  wardenGroup.add(rightArm);

  group.add(wardenGroup);

  // 4. Heavy Clipboard on Desk
  const clipGroup = new THREE.Group();
  const boardGeo = new THREE.BoxGeometry(0.9, 1.25, 0.04);
  const boardMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
  const board = new THREE.Mesh(boardGeo, boardMat);
  clipGroup.add(board);

  // Gold metallic clip
  const clipHeadGeo = new THREE.BoxGeometry(0.4, 0.12, 0.08);
  const clipHeadMat = new THREE.MeshStandardMaterial({ color: gold, metalness: 0.9, roughness: 0.2 });
  const clipHead = new THREE.Mesh(clipHeadGeo, clipHeadMat);
  clipHead.position.set(0, 0.58, 0.03);
  clipGroup.add(clipHead);

  // Official Leave Register Sheet on Clipboard
  const regSheetGeo = new THREE.PlaneGeometry(0.78, 1.05);
  const regSheetTex = createCardTexture({
    title: "ATTENDANCE REGISTER",
    subtitle: "Daily Roll & Sign-offs",
    bgGradient: ["#0f3b46", "#070d1e"],
    accentColor: "#f59e0b",
    width: 512,
    height: 400
  });
  const regSheetMat = new THREE.MeshBasicMaterial({ map: regSheetTex });
  const regSheet = new THREE.Mesh(regSheetGeo, regSheetMat);
  regSheet.position.set(0, -0.04, 0.025);
  clipGroup.add(regSheet);

  clipGroup.position.set(-0.45, -0.32, 0.1);
  clipGroup.rotation.x = -Math.PI / 2.2;
  clipGroup.rotation.z = -0.15;
  group.add(clipGroup);

  // 5. Official Stamp Mesh (Animated stamping down)
  const stampGroup = new THREE.Group();
  const stampHandleGeo = new THREE.CylinderGeometry(0.05, 0.08, 0.28, 16);
  const stampHandleMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.4 });
  const stampHandle = new THREE.Mesh(stampHandleGeo, stampHandleMat);
  stampHandle.position.y = 0.18;
  stampGroup.add(stampHandle);

  const stampBaseGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.08, 16);
  const stampBaseMat = new THREE.MeshStandardMaterial({ color: emerald, metalness: 0.7, roughness: 0.2 });
  const stampBase = new THREE.Mesh(stampBaseGeo, stampBaseMat);
  stampBase.position.y = 0.04;
  stampGroup.add(stampBase);

  stampGroup.position.set(-0.15, -0.1, 0.15);
  group.add(stampGroup);

  // 6. DYNAMIC ANIMATED LEAVE REQUEST DOCUMENT
  // Student Leave Request moves towards Warden -> Stamp moves down -> Green [✓ APPROVED] check appears!
  const approvalDocGeo = new THREE.BoxGeometry(0.7, 0.95, 0.02);
  const docTex = createIconBadgeTexture({
    label: "Leave Request",
    sublabel: "Roll #104",
    symbol: "📄",
    color: "#fbbf24",
    bgColor: "#1e293b"
  });
  const docMat = new THREE.MeshStandardMaterial({ map: docTex, roughness: 0.3 });
  const approvalDoc = new THREE.Mesh(approvalDocGeo, docMat);
  approvalDoc.position.set(1.5, 0.5, 0.3);
  group.add(approvalDoc);

  // Green Approval Check Mark Ribbon / Stamp Ring
  const checkRingGeo = new THREE.RingGeometry(0.22, 0.32, 32);
  const checkRingMat = new THREE.MeshBasicMaterial({ color: emerald, side: THREE.DoubleSide });
  const checkRing = new THREE.Mesh(checkRingGeo, checkRingMat);
  checkRing.position.set(-0.15, -0.26, 0.15);
  checkRing.rotation.x = -Math.PI / 2;
  group.add(checkRing);

  // 7. Golden Hostel Master Keys (Rotating gently on ring)
  const keyRingGroup = new THREE.Group();
  const ringGeo = new THREE.TorusGeometry(0.24, 0.05, 16, 24);
  const keyMat = new THREE.MeshStandardMaterial({ color: gold, metalness: 0.95, roughness: 0.15 });
  const keyRing = new THREE.Mesh(ringGeo, keyMat);
  keyRingGroup.add(keyRing);

  // 2 Master Keys
  for (let k = 0; k < 2; k++) {
    const kShaftGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.75, 12);
    const kShaft = new THREE.Mesh(kShaftGeo, keyMat);
    kShaft.position.set((k - 0.5) * 0.12, -0.45, 0);
    kShaft.rotation.z = (k - 0.5) * 0.2;
    keyRingGroup.add(kShaft);

    const kBitGeo = new THREE.BoxGeometry(0.16, 0.08, 0.04);
    const kBit = new THREE.Mesh(kBitGeo, keyMat);
    kBit.position.set((k - 0.5) * 0.12 + 0.08, -0.7, 0);
    keyRingGroup.add(kBit);
  }
  keyRingGroup.position.set(-1.8, 0.8, 0.2);
  group.add(keyRingGroup);

  // 8. Student Profile Cards (Stacked neatly, top card slides)
  const profileTex = createIconBadgeTexture({
    label: "Student Profile",
    sublabel: "Room 204 • Clear",
    symbol: "👤",
    color: "#38bdf8",
    bgColor: "#0f3b46"
  });
  const profGeo = new THREE.BoxGeometry(0.9, 1.1, 0.03);
  const profMat = new THREE.MeshStandardMaterial({ map: profileTex, roughness: 0.3 });
  const profCard = new THREE.Mesh(profGeo, profMat);
  profCard.position.set(1.8, -0.5, 0.2);
  profCard.rotation.set(0.1, -0.3, 0.05);
  group.add(profCard);

  // 9. Official Warden Notice Bulletin on Wall
  const bulletinTex = createIconBadgeTexture({
    label: "Warden Notice",
    sublabel: "Hostel Rules & Curfew",
    symbol: "📌",
    color: "#34d399",
    bgColor: "#064e3b"
  });
  const bullGeo = new THREE.BoxGeometry(1.1, 1.1, 0.04);
  const bullMat = new THREE.MeshStandardMaterial({ map: bulletinTex, roughness: 0.4 });
  const bulletin = new THREE.Mesh(bullGeo, bullMat);
  bulletin.position.set(-1.8, -0.6, -0.3);
  bulletin.rotation.set(-0.1, 0.3, -0.05);
  group.add(bulletin);

  // Update animation loop
  function update(elapsed) {
    // Golden Master Key rotates gently
    keyRingGroup.rotation.y = elapsed * 0.0012;
    keyRingGroup.position.y = 0.8 + Math.sin(elapsed * 0.002) * 0.08;

    // Meaningful Leave Approval Sequence:
    // Cycle duration = 3.5 seconds
    const cycle = (elapsed % 3500) / 3500;

    if (cycle < 0.5) {
      // Document floats towards desk
      const t = cycle / 0.5;
      approvalDoc.position.x = 1.6 - t * 1.75;
      approvalDoc.position.y = 0.6 - t * 0.9;
      approvalDoc.position.z = 0.3 - t * 0.15;
      approvalDoc.rotation.x = -t * 1.3;
      approvalDoc.rotation.z = -t * 0.2;

      // Stamp in resting up position
      stampGroup.position.y = -0.08;
      // Check ring hidden
      checkRing.scale.setScalar(0.001);
    } else if (cycle < 0.65) {
      // Stamp presses down onto document
      const t = (cycle - 0.5) / 0.15;
      const press = Math.sin(t * Math.PI);
      stampGroup.position.y = -0.08 - press * 0.12;

      approvalDoc.position.set(-0.15, -0.3, 0.15);
      approvalDoc.rotation.set(-Math.PI / 2.3, 0, -0.2);

      // Check ring blooms
      checkRing.scale.setScalar(Math.min(t * 1.2, 1.0));
    } else {
      // Document stays stamped with vibrant green tick, then fades/resets
      approvalDoc.position.set(-0.15, -0.3, 0.15);
      stampGroup.position.y = -0.08;
      checkRing.scale.setScalar(1.0 + Math.sin(elapsed * 0.006) * 0.06);
    }

    // Profile card gentle slide
    profCard.position.y = -0.5 + Math.cos(elapsed * 0.002) * 0.07;
  }

  return { group, update };
}
