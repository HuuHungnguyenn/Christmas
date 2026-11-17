"use strict";

// Canvas adaptation of the supplied Pygame/NumPy scene.
const MESSAGE = "MERRY CHRISTMAS 2026";
const TAU = 2 * Math.PI;
const COLS = 88;
const ROWS = 74;
const CELL_W = 9;
const CELL_H = 15;
const ASPECT = CELL_H / CELL_W;
const GROUND = -0.98;
const BASE = -0.80;
const TIP = 0.86;
const TILT = 0.22;
const CT = Math.cos(TILT);
const ST = Math.sin(TILT);
const CAMERA = 4;
const SCALE = 28;
const HORIZON = ROWS * 0.45;

const RED = [0.95, 0.12, 0.10];
const GOLD = [1, 0.76, 0.22];
const SILVER = [0.86, 0.88, 0.95];
const BLUE = [0.15, 0.38, 1];
const GREEN = [0.10, 0.72, 0.25];
const WARM = [1, 0.84, 0.55];
const WHITE = [1, 1, 1];
const BARK = [0.45, 0.27, 0.12];
const FLOOR_COLOR = [0.42, 0.45, 0.58];
const [NEEDLE, SNOW, TRUNK, GARLAND, BALL, BULB, GIFT, RIBBON, FLOOR] = Array.from({ length: 9 }, (_, i) => i);
const RAMPS = [".:-~=+*xv%&#@W", "-=+*#W@", ".:=#%", "-~=*@", ".:o%&@", "oO0@", ".-=+#%@", "+xX#", "..-"];
const GLYPH_FONT = '14px "DejaVu Sans Mono", Consolas, monospace';

const clamp = (x) => Math.min(1, Math.max(0, x));
const wrap = (x, period) => ((x % period) + period) % period;
const envelope = (y) => 0.58 * (1 - clamp((y - BASE) / (TIP - BASE))) ** 1.05;
const grow = (y) => 0.4 + 6.1 * clamp((y - GROUND) / (TIP - GROUND));

let seed = 7;
function random() {
  seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
  return seed / 4294967296;
}

function normal() {
  return Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(TAU * random());
}

function unit(x, y, z) {
  const length = Math.hypot(x, y, z) || 1;
  return [x / length, y / length, z / length];
}

function sphere(count) {
  return Array.from({ length: count }, (_, i) => {
    const y = 1 - 2 * (i + 0.5) / count;
    const angle = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
    const r = Math.sqrt(1 - y * y);
    return [Math.cos(angle) * r, y, Math.sin(angle) * r];
  });
}

const LIGHT = unit(-0.5, 0.6, -0.65);

function buildScene() {
  const points = [];
  const tips = [];
  function add(x, y, z, nx, ny, nz, color, kind, start, gain = 1, phase = 0, center = null) {
    const [ux, uy, uz] = unit(nx, ny, nz);
    points.push({ x, y, z, ux, uy, uz, color, kind, start, gain, phase, center, jitter: 0.12 * normal() });
  }

  // The tiers are made of drooping branches plus a darker inner cone.
  for (let tier = 0; tier < 24; tier++) {
    const y = BASE + 0.02 + (TIP - BASE - 0.08) * tier / 23;
    const radius = envelope(y) + 0.05;
    const branches = Math.floor(6 + 12 * (1 - (y - BASE) / (TIP - BASE)));
    for (let branch = 0; branch < branches; branch++) {
      const angle = TAU * (branch + 0.5 * random()) / branches + tier * 0.77;
      const c = Math.cos(angle);
      const s = Math.sin(angle);
      const length = radius * (0.85 + 0.23 * random());
      const count = Math.floor(60 + 380 * length);
      for (let j = 0; j < count; j++) {
        const u = random() ** 0.65;
        const along = u * length;
        const across = (0.025 + 0.09 * u) * normal();
        const py = y + 0.06 * along - 0.20 * along * along + 0.012 * normal();
        const [nx, ny, nz] = unit(c * 0.75 + 0.3 * normal(), 0.55 + 0.3 * normal(), s * 0.75 + 0.3 * normal());
        const snowy = u > 0.5 && ny > 0.5 && random() < 0.06 * u;
        const green = random();
        const color = snowy ? WHITE : [0.10 + 0.12 * green, 0.48 + 0.38 * green, 0.18 + 0.14 * green];
        const gain = snowy ? 1 : (0.55 + 0.45 * u ** 1.3) * (0.75 + 0.35 * random());
        add(c * along - s * across, py, s * along + c * across, nx, ny, nz, color, snowy ? SNOW : NEEDLE, grow(py), gain);
      }
      const end = length * 0.93;
      tips.push([c * end, y + 0.06 * end - 0.20 * end * end, s * end]);
    }
  }

  const innerGreen = [0.12, 0.55, 0.20];
  for (let i = 0; i < 16000; i++) {
    const y = BASE + (TIP - BASE - 0.1) * random();
    const angle = TAU * random();
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const radius = 0.8 * envelope(y);
    add(c * radius, y, s * radius, c, 0.3, s, innerGreen, NEEDLE, grow(y), 0.8);
  }

  for (let i = 0; i < 1500; i++) {
    const y = GROUND + (BASE + 0.1 - GROUND) * random();
    const angle = TAU * random();
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    add(c * 0.075, y, s * 0.075, c, 0, s, BARK, TRUNK, grow(y));
  }

  for (let i = 0; i < 2500; i++) {
    const angle = TAU * random();
    const radius = 1.25 * Math.sqrt(random());
    add(radius * Math.cos(angle), GROUND, radius * Math.sin(angle), 0, 1, 0, FLOOR_COLOR, FLOOR, 0, 0.45);
  }

  for (let i = 0; i < 2600; i++) {
    const u = i / 2599;
    const y = BASE + 0.15 + (TIP - BASE - 0.45) * u;
    const angle = TAU * 3.6 * u + 0.9;
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const radius = envelope(y) + 0.07;
    const swag = -0.07 * Math.abs(Math.sin(angle * 2.5));
    for (let strand = 0; strand < 4; strand++) {
      add(c * radius + 0.016 * normal(), y + swag + 0.016 * normal(), s * radius + 0.016 * normal(),
        c + 0.6 * normal(), 0.3 + 0.6 * normal(), s + 0.6 * normal(), GOLD, GARLAND, 6.5 + 2.3 * u, 1, TAU * random());
    }
  }

  const ornament = sphere(160);
  for (let i = 0; i < 34; i++) {
    const u = (i + random()) / 34;
    const y = BASE + 0.08 + (TIP - BASE - 0.38) * u;
    const angle = i * 2.39996 + 0.4 * random();
    const radius = 0.058 + 0.032 * (1 - u);
    const distance = envelope(y);
    const center = [distance * Math.cos(angle), y - 0.03, distance * Math.sin(angle)];
    const color = i % 2 === 0 ? RED : (i % 4 === 1 ? GOLD : SILVER);
    const start = 8 + 2.5 * u + 0.3 * random();
    for (const [x, y, z] of ornament) {
      add(center[0] + x * radius, center[1] + y * radius, center[2] + z * radius,
        x, y, z, color, BALL, start, 1, 0, center);
    }
  }

  const bulb = sphere(16);
  const bulbColors = [RED, GOLD, BLUE, GREEN, WHITE];
  for (let i = 0; i < Math.min(170, tips.length); i++) {
    const j = i + Math.floor(random() * (tips.length - i));
    [tips[i], tips[j]] = [tips[j], tips[i]];
    const center = tips[i];
    const color = random() < 0.60 ? WARM : bulbColors[Math.floor(random() * bulbColors.length)];
    const start = 9 + 2.5 * random();
    const phase = TAU * random();
    for (const [x, y, z] of bulb) {
      add(center[0] + x * 0.03, center[1] + y * 0.03, center[2] + z * 0.03,
        x, y, z, color, BULB, start, 1, phase, center);
    }
  }

  const gifts = [
    [0.3, 0.66, 0.24, 0.28, 0.24, 0.4, RED, GOLD],
    [1.5, 0.62, 0.18, 0.20, 0.18, 0.9, BLUE, GOLD],
    [2.6, 0.68, 0.30, 0.22, 0.26, 0.1, GOLD, RED],
    [3.7, 0.64, 0.20, 0.30, 0.20, 0.6, GREEN, RED],
    [4.7, 0.60, 0.26, 0.18, 0.30, 0.3, SILVER, RED],
    [5.6, 0.70, 0.22, 0.24, 0.22, 1.1, RED, SILVER],
  ];
  gifts.forEach(([angle, distance, w, h, d, rotation, body, ribbon], i) => {
    const center = [distance * Math.cos(angle), GROUND, distance * Math.sin(angle)];
    const c = Math.cos(rotation);
    const s = Math.sin(rotation);
    const start = 10 + 2 * i / gifts.length;
    function giftPoint(x, y, z, nx, ny, nz, isRibbon) {
      add(center[0] + c * x - s * z, GROUND + y, center[2] + s * x + c * z,
        c * nx - s * nz, ny, s * nx + c * nz, isRibbon ? ribbon : body,
        isRibbon ? RIBBON : GIFT, start, 1, 0, center);
    }

    const faces = [
      [w * d, (a, b) => [a * w, h, b * d, 0, 1, 0]],
      [w * d, (a, b) => [a * w, 0, b * d, 0, -1, 0]],
      [h * d, (a, b) => [w / 2, (a + 0.5) * h, b * d, 1, 0, 0]],
      [h * d, (a, b) => [-w / 2, (a + 0.5) * h, b * d, -1, 0, 0]],
      [w * h, (a, b) => [a * w, (b + 0.5) * h, d / 2, 0, 0, 1]],
      [w * h, (a, b) => [a * w, (b + 0.5) * h, -d / 2, 0, 0, -1]],
    ];
    for (const [area, sample] of faces) {
      for (let j = 0; j < Math.floor(2500 * area); j++) {
        const p = sample(random() - 0.5, random() - 0.5);
        giftPoint(...p, Math.abs(p[0]) < 0.022 || Math.abs(p[2]) < 0.022);
      }
    }

    for (let j = 0; j < 120; j++) {
      const a = TAU * random();
      const side = random() < 0.5 ? -1 : 1;
      giftPoint(side * (0.03 + 0.03 * Math.cos(a)), h + 0.03 + 0.03 * Math.sin(a), 0,
        side * Math.cos(a), Math.sin(a), -0.4, true);
    }
  });

  return points;
}

const canvas = document.querySelector("#tree");
const context = canvas.getContext("2d", { alpha: false });
context.font = GLYPH_FONT;
context.textAlign = "center";
context.textBaseline = "middle";

const bloom = document.createElement("canvas");
bloom.width = COLS;
bloom.height = ROWS;
const bloomContext = bloom.getContext("2d");
const bloomImage = bloomContext.createImageData(COLS, ROWS);

const points = buildScene();
const depth = new Float64Array(COLS * ROWS);
const visible = new Array(COLS * ROWS);
const stars = Array.from({ length: Math.floor(COLS * ROWS / 20) }, () => ({
  x: Math.floor(random() * COLS),
  y: Math.floor(random() * ROWS),
  glyph: "..'.+*"[Math.floor(random() * 6)],
  phase: random() * TAU,
}));
const flakes = Array.from({ length: Math.floor(COLS * ROWS / 60) }, () => ({
  x: random() * COLS,
  y: random() * ROWS,
  speed: 1.5 + 2.5 * random(),
  phase: random() * TAU,
  near: random() < 0.35,
}));

function glyph(col, row, character, color, brightness, glow = 0, specular = 0) {
  if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return;
  const r = clamp(color[0] * brightness * (1 - specular) + specular);
  const g = clamp(color[1] * brightness * (1 - specular) + specular);
  const b = clamp(color[2] * brightness * (1 - specular) + specular);
  context.fillStyle = `rgb(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)})`;
  context.fillText(character, (col + 0.5) * CELL_W, (row + 0.5) * CELL_H);
  if (glow > 0) {
    const i = 4 * (row * COLS + col);
    bloomImage.data[i] = r * 255;
    bloomImage.data[i + 1] = g * 255;
    bloomImage.data[i + 2] = b * 255;
    bloomImage.data[i + 3] = 255 * clamp(glow);
  }
}

function snow(t, near) {
  for (const flake of flakes) {
    if (flake.near !== near) continue;
    const col = Math.floor(wrap(flake.x + 1.5 * Math.sin(0.8 * t + flake.phase), COLS));
    const row = Math.floor(wrap(flake.y + t * flake.speed * (near ? 1.6 : 1), ROWS));
    glyph(col, row, near ? "*" : ".", WHITE, near ? 0.95 : 0.58, near ? 0.16 : 0);
  }
}

function drawTree(t) {
  const angle = TAU * (t % 20) / 20;
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  depth.fill(Infinity);
  visible.fill(null);

  // Keep the nearest point in each cell, and shade only those points.
  for (const p of points) {
    const age = t - p.start;
    if (age < 0) continue;
    let { x, y, z } = p;
    if (p.center && age < 0.35) {
      const v = age / 0.35 - 1;
      const size = 1 + 2.7 * v ** 3 + 1.7 * v ** 2;
      x = p.center[0] + (x - p.center[0]) * size;
      y = p.center[1] + (y - p.center[1]) * size;
      z = p.center[2] + (z - p.center[2]) * size;
    }
    const turnedZ = x * s + z * c;
    const cameraZ = turnedZ * CT - y * ST;
    const zoom = SCALE * CAMERA / (CAMERA + cameraZ);
    const col = Math.floor(COLS / 2 + (x * c - z * s) * zoom * ASPECT);
    const row = Math.floor(HORIZON - (y * CT + turnedZ * ST) * zoom);
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) continue;
    const i = row * COLS + col;
    if (cameraZ <= depth[i]) {
      depth[i] = cameraZ;
      visible[i] = p;
    }
  }

  for (let i = 0; i < visible.length; i++) {
    const p = visible[i];
    if (!p) continue;
    const nx = p.ux * c - p.uz * s;
    const z = p.ux * s + p.uz * c;
    const ny = p.uy * CT + z * ST;
    const nz = z * CT - p.uy * ST;
    const lambert = clamp(nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]);
    let { kind, color } = p;
    let level = (0.45 + 0.55 * lambert) * p.gain;
    let brightness = level * (kind === NEEDLE || kind === FLOOR ? 1.18 : 1);
    let glow = 0;
    let specular = 0;
    if (kind === NEEDLE && t - p.start < 0.25) {
      kind = SNOW;
      color = WHITE;
      brightness = 0.95;
      level = 0.9;
    } else if (kind === BULB) {
      const twinkle = 0.5 + 0.5 * Math.sin(4 * t + p.phase);
      level = 0.35 + 0.65 * twinkle;
      brightness = 0.55 + 0.6 * twinkle;
      glow = 0.5 * twinkle;
    } else if (kind === GARLAND) {
      brightness *= 0.75 + 0.45 * Math.sin(6 * t + p.phase) ** 2;
      glow = 0.14;
    } else if (kind === BALL) {
      specular = lambert ** 14;
      level += specular;
      glow = 0.35 * specular;
    }
    const ramp = RAMPS[kind];
    const shade = Math.min(15, Math.floor(clamp(level + p.jitter) * 16));
    const character = ramp[Math.floor(shade * ramp.length / 16)];
    glyph(i % COLS, Math.floor(i / COLS), character, color, brightness, glow, specular);
  }
}

function drawStar(t) {
  const age = t - 12;
  const on = clamp(age / 0.3);
  const flash = clamp(1 - age) ** 2;
  const cy = HORIZON - (TIP + 0.09) * CT * SCALE * CAMERA / (CAMERA - (TIP + 0.09) * ST);
  const cx = COLS / 2;
  const radius = (1.6 + 1.6 * on * on * (3 - 2 * on)) * (1 + 0.05 * Math.sin(3 * t));
  const tint = GOLD.map((channel) => channel + (1 - channel) * flash);
  const power = 1 + 1.6 * flash;

  for (let k = 0; k < 8; k++) {
    const angle = k * TAU / 8 + 0.1 * Math.sin(0.7 * t);
    if (Math.sin(angle) < -0.3) continue;
    const reach = radius * (3 + 0.8 * Math.sin(3 * t + 1.3 * k)) * (k % 2 === 0 ? 1 : 0.6) * (1 + flash);
    const ch = "-/|\\"[wrap(Math.round(angle / (TAU / 8)), 4)];
    for (let r = radius * 1.1; r < reach; r += 0.5) {
      glyph(Math.round(cx + Math.cos(angle) * r * ASPECT), Math.round(cy - Math.sin(angle) * r),
        ch, tint, power * 0.6 * (1 - r / reach), 0.22);
    }
  }

  const turn = 0.15 * Math.sin(0.9 * t);
  for (let row = Math.floor(cy - radius); row <= Math.ceil(cy + radius); row++) {
    for (let col = Math.floor(cx - radius * ASPECT); col <= Math.ceil(cx + radius * ASPECT); col++) {
      const dx = (col - cx) / ASPECT;
      const dy = row - cy;
      const r = Math.hypot(dx, dy) / radius;
      const a = wrap(Math.atan2(dx, -dy) - turn, TAU / 5) / (TAU / 5);
      if (r <= 0.45 + 0.55 * Math.abs(a - 0.5) * 2) {
        glyph(col, row, r < 0.35 ? "@" : (r < 0.65 ? "#" : "*"), tint, power * (1.15 - 0.3 * r), 0.8);
      }
    }
  }
}

function drawMessage(t) {
  const letters = [...MESSAGE].join(" ").replaceAll("   ", "     ");
  const shown = Math.min(letters.length, Math.floor((t - 13) * 10));
  const x = Math.floor((COLS - letters.length) / 2);
  const row = ROWS - 3;
  context.fillStyle = "#06080e";
  context.fillRect((x - 2) * CELL_W, (row - 1) * CELL_H, (shown + 4) * CELL_W, 3 * CELL_H);
  context.save();
  context.font = GLYPH_FONT.replace("14px", "17px");
  const colors = [RED, GOLD, GREEN];
  for (let i = 0; i < shown; i++) {
    if (letters[i] === " ") continue;
    const color = colors[(Math.floor(i / 2) + Math.floor(t * 1.5)) % colors.length];
    glyph(x + i, row, letters[i], color, 0.95 + 0.2 * Math.sin(5 * t + i), 0.35);
  }
  context.restore();
}

function draw(t) {
  context.fillStyle = "#06080e";
  context.fillRect(0, 0, canvas.width, canvas.height);
  bloomImage.data.fill(0);
  for (const star of stars) {
    glyph(star.x, star.y, star.glyph, SILVER, 0.20 + 0.64 * Math.sin(1.3 * t + star.phase) ** 8);
  }
  snow(t, false);
  drawTree(t);
  if (t > 12) drawStar(t);
  snow(t, true);
  if (t > 13) drawMessage(t);

  bloomContext.putImageData(bloomImage, 0, 0);
  context.save();
  context.globalCompositeOperation = "lighter";
  context.filter = "blur(9px)";
  context.drawImage(bloom, 0, 0, canvas.width, canvas.height);
  context.restore();
}

const pauseButton = document.querySelector("#pause");
const replayButton = document.querySelector("#replay");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
let time = 20;
let paused = reducedMotion.matches;
let frameId = 0;
let previous = null;

function animate(now) {
  if (previous === null || now - previous >= 1000 / 31) {
    if (previous !== null) time += Math.min((now - previous) / 1000, 0.1);
    previous = now;
    draw(time);
  }
  frameId = requestAnimationFrame(animate);
}

function setPaused(value) {
  paused = value;
  pauseButton.textContent = paused ? "Tiếp tục" : "Tạm dừng";
  cancelAnimationFrame(frameId);
  previous = null;
  if (!paused) frameId = requestAnimationFrame(animate);
}

pauseButton.addEventListener("click", () => setPaused(!paused));
replayButton.addEventListener("click", () => {
  time = 0;
  draw(time);
  setPaused(false);
});
reducedMotion.addEventListener("change", ({ matches }) => setPaused(matches));
document.addEventListener("keydown", (event) => {
  if (event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.code === "Space" && event.target === document.body) {
    event.preventDefault();
    pauseButton.click();
  }
  if (event.key.toLowerCase() === "r") replayButton.click();
});

draw(time);
setPaused(paused);
