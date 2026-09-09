import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Native 3D sculptures: no image planes, remote models, or text textures.
export const LOGIN_WORLDS = {
  student: { accent: 0x64c8ff, action: 'Wave hello', label: 'Student explorer robot' },
  warden: { accent: 0x64e6ba, action: 'Turn the key', label: 'Warden shield and floating key' },
  admin: { accent: 0xd1a8ff, action: 'Pulse the core', label: 'Admin command cube and orbiting nodes' },
};

function kit() {
  const group = new THREE.Group();
  const materials = new Map();
  const material = (color, metalness = 0.12, roughness = 0.28, glow = false) => {
    const key = `${color}:${metalness}:${roughness}:${glow}`;
    if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({ color, metalness, roughness, ...(glow ? { emissive: color, emissiveIntensity: 0.45 } : {}) }));
    return materials.get(key);
  };
  const mesh = (geometry, mat, parent = group, position = [0, 0, 0]) => {
    const item = new THREE.Mesh(geometry, mat);
    item.position.set(...position);
    item.castShadow = true;
    item.receiveShadow = true;
    parent.add(item);
    return item;
  };
  const box = (size, color, position = [0, 0, 0], parent = group, radius = 0.12) => mesh(new RoundedBoxGeometry(...size, 3, Math.min(radius, ...size.map(v => v / 2 - 0.001))), typeof color === 'number' ? material(color) : color, parent, position);
  const sphere = (radius, color, position, parent = group) => mesh(new THREE.SphereGeometry(radius, 28, 20), typeof color === 'number' ? material(color) : color, parent, position);
  const torus = (radius, tube, mat, position, parent = group, arc = Math.PI * 2) => mesh(new THREE.TorusGeometry(radius, tube, 12, 72, arc), mat, parent, position);
  return { group, material, mesh, box, sphere, torus };
}

function makeStudent() {
  const k = kit();
  const { group, material, box, sphere, torus } = k;
  const pearl = material(0xf1f7ff, 0.16, 0.24);
  const blue = material(0x3598ef, 0.26, 0.25);
  const navy = material(0x102647, 0.45, 0.24);
  const cyan = material(0x91e8ff, 0.12, 0.24, true);
  const body = new THREE.Group(); group.add(body);
  box([1.05, 0.85, 0.78], pearl, [0, -0.28, 0], body, 0.25);
  box([0.65, 0.35, 0.10], blue, [0, -0.22, 0.43], body);
  const chestLight = sphere(0.075, cyan, [0, -0.2, 0.51], body);
  const head = new THREE.Group(); head.position.y = 0.70; body.add(head);
  box([1.61, 1.13, 1.02], pearl, [0, 0, 0], head, 0.28);
  box([1.25, 0.56, 0.14], navy, [0, -0.01, 0.52], head, 0.17);
  const eyes = new THREE.Group(); eyes.position.set(0, 0.01, 0.62); head.add(eyes);
  box([0.12, 0.23, 0.07], cyan, [-0.28, 0, 0], eyes, 0.059);
  box([0.12, 0.23, 0.07], cyan, [0.28, 0, 0], eyes, 0.059);
  const smile = torus(0.10, 0.017, cyan, [0, -0.11, 0.63], head, Math.PI);
  smile.rotation.z = Math.PI;
  for (const side of [-1, 1]) {
    const cup = sphere(0.27, blue, [side * 0.86, 0.04, 0], head); cup.scale.set(0.52, 1, 0.9);
    const dot = sphere(0.115, cyan, [side * 0.99, 0.04, 0], head); dot.scale.x = 0.22;
    const foot = box([0.39, 0.26, 0.63], blue, [side * 0.31, -0.92, 0.09], body, 0.125);
    foot.rotation.z = side * 0.10;
  }
  const band = torus(0.83, 0.045, blue, [0, 0.02, -0.06], head, Math.PI);
  band.scale.y = 0.83;
  const cap = new THREE.Group(); head.add(cap); cap.position.set(0, 0.63, 0); cap.rotation.z = -0.12;
  box([0.8, 0.17, 0.62], navy, [0, -0.04, 0], cap, 0.08);
  box([1.31, 0.09, 1.05], blue, [0, 0.08, 0], cap, 0.04);
  sphere(0.06, cyan, [0, 0.17, 0], cap);
  const tassel = box([0.035, 0.47, 0.035], material(0xffca72, 0.5), [0.48, -0.16, 0.32], cap, 0.015);
  sphere(0.06, material(0xffca72, 0.5), [0.48, -0.42, 0.32], cap).scale.y = 1.4;
  const arms = [-1, 1].map(side => {
    const arm = new THREE.Group(); arm.position.set(side * 0.69, 0.02, 0); body.add(arm);
    box([0.27, 0.53, 0.3], blue, [side * 0.05, -0.20, 0], arm);
    sphere(0.19, pearl, [side * 0.05, -0.48, 0.03], arm);
    return arm;
  });
  const book = new THREE.Group(); book.position.set(-1.25, -0.55, 0.45); group.add(book);
  const pages = new THREE.Group(); book.add(pages);
  for (const side of [-1, 1]) {
    const page = new THREE.Group(); pages.add(page); page.rotation.y = -side * 0.24;
    box([0.40, 0.57, 0.055], material(0x8b6def), [side * 0.20, 0, 0], page, 0.025);
    box([0.35, 0.51, 0.07], pearl, [side * 0.19, 0, 0.06], page, 0.025);
    for (let i = 0; i < 3; i++) box([0.21, 0.015, 0.009], material(0x84b9dd), [side * 0.19, 0.12 - i * 0.1, 0.101], page, 0.004);
  }
  const satellite = sphere(0.15, material(0xffcd78, 0.5, 0.23), [1.31, -0.4, 0.4]);
  const orbit = torus(0.30, 0.018, cyan, [1.31, -0.4, 0.4]); orbit.rotation.x = 0.7;
  return { group, update(time, { pointer, burst, focus }) {
    const privateField = focus === 'password';
    body.position.y = Math.sin(time * 1.6) * 0.09;
    head.rotation.y = privateField ? -0.28 : pointer.x * 0.24;
    head.rotation.x = privateField ? 0.08 : -pointer.y * 0.14;
    eyes.position.x = pointer.x * 0.09;
    eyes.position.y = 0.01 + pointer.y * 0.045;
    const blink = Math.sin(time * 1.25) > 0.996;
    eyes.scale.y = privateField || blink ? 0.13 : 1;
    arms[0].rotation.z = -0.12 - Math.sin(time * 1.8) * 0.045;
    arms[1].rotation.z = 0.17 + burst * (1.8 + Math.sin(time * 16) * 0.45);
    book.position.y = -0.55 + Math.sin(time * 1.5 + 1.2) * 0.11;
    book.rotation.set(-0.12, 0.3 + Math.sin(time) * 0.14, -0.16);
    pages.children.forEach((page, i) => { page.rotation.y = (i ? -1 : 1) * (0.24 + Math.sin(time * 2.3) * 0.08); });
    satellite.position.y = -0.4 + Math.sin(time * 1.8) * 0.12;
    orbit.position.copy(satellite.position); orbit.rotation.y = time * 0.4;
    tassel.rotation.z = Math.sin(time * 2) * 0.14;
    chestLight.scale.setScalar(focus === 'loading' ? 1.2 + Math.sin(time * 8) * 0.25 : 1);
  } };
}

function makeWarden() {
  const k = kit();
  const { group, material, mesh, box, sphere, torus } = k;
  const mint = material(0x36c9a4, 0.3, 0.2);
  const pearl = material(0xeafff7, 0.16, 0.24);
  const gold = material(0xffc36c, 0.72, 0.22);
  const dark = material(0x125654, 0.3, 0.25);
  const shield = new THREE.Group(); group.add(shield); shield.position.set(-0.18, 0.03, 0);
  const shape = new THREE.Shape();
  shape.moveTo(0, 1.08); shape.bezierCurveTo(0.34, 0.82, 0.7, 0.98, 0.9, 0.75);
  shape.lineTo(0.86, -0.02); shape.bezierCurveTo(0.8, -0.6, 0.4, -0.97, 0, -1.17);
  shape.bezierCurveTo(-0.4, -0.97, -0.8, -0.6, -0.86, -0.02); shape.lineTo(-0.9, 0.75);
  shape.bezierCurveTo(-0.7, 0.98, -0.34, 0.82, 0, 1.08);
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.3, bevelEnabled: true, bevelSegments: 5, steps: 1, bevelSize: 0.11, bevelThickness: 0.11, curveSegments: 18 });
  mesh(geometry, mint, shield, [0, 0, -0.1]);
  const inset = mesh(geometry, pearl, shield, [0, 0.04, 0.28]); inset.scale.set(0.78, 0.78, 0.14);
  const center = mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.11, 48), dark, shield, [0, 0.02, 0.41]); center.rotation.x = Math.PI / 2;
  const check = new THREE.Group(); shield.add(check); check.position.set(0, 0.02, 0.49);
  box([0.13, 0.32, 0.075], pearl, [-0.11, -0.025, 0], check, 0.04).rotation.z = 0.78;
  box([0.13, 0.51, 0.075], pearl, [0.09, 0.045, 0], check, 0.04).rotation.z = -0.64;
  const keyPivot = new THREE.Group(); group.add(keyPivot); keyPivot.position.set(1.18, 0.33, 0.55);
  const key = new THREE.Group(); keyPivot.add(key);
  torus(0.28, 0.095, gold, [0, 0.45, 0], key);
  box([0.15, 0.95, 0.15], gold, [0, -0.16, 0], key, 0.06);
  box([0.33, 0.14, 0.17], gold, [0.11, -0.38, 0], key, 0.05);
  box([0.29, 0.14, 0.17], gold, [0.09, -0.61, 0], key, 0.05);
  const ring = torus(1.51, 0.033, material(0x63edc9, 0.35, 0.2, true), [0, -0.04, 0]); ring.rotation.set(1.12, -0.2, 0.1);
  const dot = sphere(0.10, gold, [-1.5, 0, 0]);
  const lock = new THREE.Group(); group.add(lock); lock.position.set(-1.21, 0.92, 0.30); lock.rotation.z = 0.12;
  const shackle = torus(0.18, 0.042, pearl, [0, 0.12, 0], lock, Math.PI);
  box([0.44, 0.34, 0.21], dark, [0, -0.09, 0], lock);
  sphere(0.038, gold, [0, -0.07, 0.13], lock);
  return { group, update(time, { pointer, burst, focus }) {
    shield.position.y = 0.03 + Math.sin(time * 1.3) * 0.10;
    shield.rotation.y = pointer.x * 0.12;
    check.scale.setScalar(1 + burst * 0.15 + (focus === 'loading' ? Math.sin(time * 5) * 0.06 : 0));
    keyPivot.position.y = 0.33 + Math.sin(time * 1.6 + 1) * 0.12;
    key.rotation.set(-0.10, Math.sin(time * 0.7) * 0.30 + burst * Math.PI * 2, (focus === 'email' ? -0.45 : -0.24) + Math.sin(time * 1.1) * 0.07);
    ring.rotation.z = time * 0.16;
    dot.position.set(Math.cos(time * 0.8) * 1.52, Math.sin(time * 0.8) * 0.48, Math.sin(time * 0.8) * 1.25);
    lock.position.y = 0.92 + Math.sin(time * 1.9) * 0.07;
    shackle.position.y = focus === 'password' ? 0.12 : 0.18 + burst * 0.10;
  } };
}

function makeAdmin() {
  const k = kit();
  const { group, material, box, sphere, torus } = k;
  const violet = material(0x8664ea, 0.45, 0.2);
  const dark = material(0x212042, 0.42, 0.24);
  const gold = material(0xffce7b, 0.7, 0.21);
  const pearl = material(0xded6ff, 0.2, 0.23);
  const glow = material(0x9de7ff, 0.25, 0.2, true);
  const core = new THREE.Group(); group.add(core);
  box([1.55, 1.55, 1.55], violet, [0, 0, 0], core, 0.23);
  box([1.15, 1.15, 0.10], dark, [0, 0, 0.79], core, 0.14);
  const tiles = [];
  for (let row = 0; row < 2; row++) for (let col = 0; col < 2; col++) {
    const tile = box([0.35, 0.35, 0.09], row === col ? gold : glow, [(col - 0.5) * 0.46, (row - 0.5) * 0.46, 0.88], core, 0.085);
    tiles.push(tile);
  }
  const crown = torus(0.34, 0.07, gold, [0, 0.89, 0], core); crown.rotation.x = Math.PI / 2;
  sphere(0.17, glow, [0, 0.91, 0], core);
  for (let i = 0; i < 3; i++) box([0.055, 0.16 + i * 0.15, 0.55], pearl, [0.796, -0.25 + i * 0.12, (i - 1) * 0.22], core, 0.025);
  const orbits = new THREE.Group(); group.add(orbits);
  const rings = [0, 1].map(i => {
    const ring = torus(1.62 + i * 0.19, 0.023, i ? pearl : gold, [0, 0, 0], orbits);
    ring.rotation.set(i ? 0.45 : 1.12, i ? -0.45 : 0.32, i ? 0.7 : -0.2);
    return ring;
  });
  const nodes = Array.from({ length: 4 }, (_, i) => {
    const node = new THREE.Group(); group.add(node);
    box([0.34, 0.34, 0.34], i % 2 ? gold : pearl, [0, 0, 0], node, 0.10);
    sphere(0.058, glow, [0, 0, 0.20], node);
    return node;
  });
  return { group, update(time, { pointer, burst, focus }) {
    core.position.y = Math.sin(time * 1.35) * 0.11;
    core.rotation.set(-0.1 + pointer.y * 0.08, -0.28 + Math.sin(time * 0.4) * 0.12, 0.08);
    const busy = focus === 'loading' ? 1 : 0;
    const scale = 1 + burst * 0.08 + busy * Math.sin(time * 5) * 0.025;
    core.scale.setScalar(scale);
    tiles.forEach((tile, i) => {
      tile.position.z = 0.88 + burst * (0.28 + i * 0.08) + (focus === 'email' ? 0.08 : 0) + Math.max(0, Math.sin(time * 1.8 - i)) * 0.035;
    });
    nodes.forEach((node, i) => {
      const angle = time * (0.24 + busy * 0.35) + i * Math.PI / 2;
      const radius = 1.67 + burst * 0.3;
      node.position.set(Math.cos(angle) * radius, Math.sin(angle + 0.7) * 0.87, Math.sin(angle) * 0.75);
      node.rotation.set(time * 0.22, -angle, 0.15);
    });
    rings[0].rotation.z = -0.2 + time * 0.1;
    rings[1].rotation.z = 0.7 - time * 0.12;
    crown.rotation.z = time * 0.5;
  } };
}

export function createLoginSculpture(role) {
  return ({ student: makeStudent, warden: makeWarden, admin: makeAdmin }[role] || makeStudent)();
}
