// Canvas texture utilities for procedural 3D elements
import * as THREE from "three";

/**
 * Creates a high-res canvas texture with crisp text and icons for 3D meshes
 */
export function createCardTexture({
  title = "NIVAS",
  subtitle = "Portal",
  iconType = "star",
  bgGradient = ["#1e1b4b", "#0f172a"],
  accentColor = "#6366f1",
  width = 512,
  height = 320
}) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, bgGradient[0]);
  grad.addColorStop(1, bgGradient[1]);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(0, 0, width, height, 32);
  ctx.fill();

  // Outer glowing border
  ctx.lineWidth = 6;
  ctx.strokeStyle = accentColor;
  ctx.shadowColor = accentColor;
  ctx.shadowBlur = 18;
  ctx.stroke();

  // Subtle interior grid or pattern
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
  ctx.lineWidth = 1;
  for (let x = 30; x < width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 20);
    ctx.lineTo(x, height - 20);
    ctx.stroke();
  }

  // Top header pill
  ctx.fillStyle = accentColor;
  ctx.beginPath();
  ctx.roundRect(40, 36, 120, 24, 12);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 13px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("NIVAS OS", 100, 52);

  // Chip or hologram icon
  ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
  ctx.beginPath();
  ctx.roundRect(width - 90, 34, 50, 38, 8);
  ctx.fill();
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Title text
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 28px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(title, 40, 130);

  // Subtitle
  ctx.fillStyle = "rgba(226, 232, 240, 0.75)";
  ctx.font = "16px sans-serif";
  ctx.fillText(subtitle, 40, 165);

  // Mini simulated barcode or status indicators
  ctx.fillStyle = accentColor;
  for (let i = 0; i < 18; i++) {
    const barW = (i % 3 === 0) ? 5 : 2;
    ctx.fillRect(40 + i * 10, height - 60, barW, 26);
  }

  // Status badge
  ctx.fillStyle = "rgba(16, 185, 129, 0.2)";
  ctx.beginPath();
  ctx.roundRect(width - 150, height - 62, 110, 28, 14);
  ctx.fill();
  ctx.strokeStyle = "#10b981";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = "#34d399";
  ctx.font = "bold 12px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("● VERIFIED", width - 95, height - 44);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

/**
 * Creates circular/square icon badge textures
 */
export function createIconBadgeTexture({
  label,
  sublabel = "",
  symbol = "★",
  color = "#8b5cf6",
  bgColor = "#0f172a",
  size = 256
}) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  // Circular background
  const grad = ctx.createRadialGradient(size / 2, size / 2, 20, size / 2, size / 2, size / 2);
  grad.addColorStop(0, color + "33");
  grad.addColorStop(0.8, bgColor);
  grad.addColorStop(1, "#030712");
  ctx.fillStyle = grad;

  ctx.beginPath();
  ctx.roundRect(10, 10, size - 20, size - 20, 36);
  ctx.fill();

  // Glow ring
  ctx.lineWidth = 4;
  ctx.strokeStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 14;
  ctx.stroke();

  // Symbol / Icon
  ctx.shadowBlur = 10;
  ctx.shadowColor = color;
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 72px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(symbol, size / 2, size / 2 - 20);

  // Label
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 20px sans-serif";
  ctx.fillText(label, size / 2, size / 2 + 50);

  if (sublabel) {
    ctx.fillStyle = "rgba(203, 213, 225, 0.7)";
    ctx.font = "14px sans-serif";
    ctx.fillText(sublabel, size / 2, size / 2 + 76);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

/**
 * Creates building window glow maps
 */
export function createWindowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#0c1329";
  ctx.fillRect(0, 0, 128, 256);

  const cols = 4;
  const rows = 10;
  const winW = 16;
  const winH = 14;
  const gapX = 14;
  const gapY = 11;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const isLit = Math.random() > 0.3;
      const x = 12 + c * (winW + gapX);
      const y = 14 + r * (winH + gapY);

      if (isLit) {
        const warm = Math.random() > 0.5;
        ctx.fillStyle = warm ? "#38bdf8" : "#818cf8";
        ctx.shadowColor = warm ? "#38bdf8" : "#818cf8";
        ctx.shadowBlur = 6;
      } else {
        ctx.fillStyle = "#1e293b";
        ctx.shadowBlur = 0;
      }
      ctx.fillRect(x, y, winW, winH);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}
