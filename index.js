// ===============================
//   UTILITY FUNCTIONS
// ===============================
function lerp(a, b, t) {
  return a + (b - a) * t;
}
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}
// Returns a normalized vector perpendicular to d (using an arbitrary cross product).
function getPerpendicular(d) {
  let arb = Math.abs(d.y) > 0.9 ? { x: 1, y: 0, z: 0 } : { x: 0, y: 1, z: 0 };
  let vx = d.y * arb.z - d.z * arb.y;
  let vy = d.z * arb.x - d.x * arb.z;
  let vz = d.x * arb.y - d.y * arb.x;
  let len = Math.sqrt(vx * vx + vy * vy + vz * vz) || 1;
  return { x: vx / len, y: vy / len, z: vz / len };
}
// Compute what the particle’s normal position would be at time t.
function getNormalPosition(p, t) {
  const angleY = 0.0005 * t;
  const angleX = 0.0003 * t;
  const cosY = Math.cos(angleY);
  const sinY = Math.sin(angleY);
  const cosX = Math.cos(angleX);
  const sinX = Math.sin(angleX);

  // Rotate the particle's base position
  let x0 = p.baseX,
    y0 = p.baseY,
    z0 = p.baseZ;
  let x1 = x0 * cosY - z0 * sinY;
  let z1 = x0 * sinY + z0 * cosY;
  let y1 = y0;
  let y2 = y1 * cosX - z1 * sinX;
  let z2 = y1 * sinX + z1 * cosX;
  let x2 = x1;

  // Liquid-like flow offsets
  const flowAmp = 10,
    flowFreq = 0.001;
  const flowX = flowAmp * Math.sin(t * flowFreq + p.flowOffsetX);
  const flowY = flowAmp * Math.sin(t * flowFreq + p.flowOffsetY);
  const flowZ = flowAmp * Math.sin(t * flowFreq + p.flowOffsetZ);

  return {
    x: x2 + sphereCenter.x + flowX,
    y: y2 + sphereCenter.y + flowY,
    z: z2 + sphereCenter.z + flowZ,
  };
}

// ===============================
//   CANVAS & PERSPECTIVE SETUP
// ===============================
const canvas = document.getElementById("particle-canvas");
const ctx = canvas.getContext("2d");
function setCanvasSize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", setCanvasSize);
setCanvasSize();

const focalLength = 300;

// ===============================
//   PARTICLE & MERGE PARAMETERS
// ===============================
const numberOfParticles = 5000;
const sphereRadius = 100;

let mergeInterval = 10000; // every 10 seconds trigger cycle
let mergeCycle = {
  state: "normal", // "normal", "merging", "exploding"
  startTime: 0,
  mergePhase: 1000, // merge phase duration
  explosionPhase: 1500, // explosion phase duration
};
let lastMergeTime = 0;

let sphereCenter = { x: 0, y: 0, z: 0 };

// Global shape state: "sphere" or "infinite"
let currentShape = "sphere";

// Global expansion factor for hover interaction
let expansionFactor = 1.0; // normally 1; expands when hovered
const targetExpansion = 1.5; // expand to 1.5 times when hovered
const expansionSpeed = 0.05; // rate of change per frame

// ===============================
//   MOUSE & MENU INTERACTION
// ===============================
let isHovered = false;
const menu = document.getElementById("menu");

// Update hover state based on mouse position relative to sphere center on screen
canvas.addEventListener("mousemove", (e) => {
  // Get mouse position relative to canvas
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  // Compute sphere center's screen coordinates (assume sphereCenter.z is 0 for this calculation)
  const centerScreenX = sphereCenter.x + canvas.width / 2;
  const centerScreenY = sphereCenter.y + canvas.height / 2;
  const dx = mouseX - centerScreenX;
  const dy = mouseY - centerScreenY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  // If mouse is within 150 pixels of the sphere center, consider it hovered.
  isHovered = distance < 150;
});

// ===============================
//   PARTICLE CREATION
// ===============================
let particles = [];
function createParticles() {
  particles = [];
  for (let i = 0; i < numberOfParticles; i++) {
    const theta = Math.acos(2 * Math.random() - 1);
    const phi = Math.random() * 2 * Math.PI;
    const r = sphereRadius * (0.9 + 0.1 * Math.random());
    const x = r * Math.sin(theta) * Math.cos(phi);
    const y = r * Math.sin(theta) * Math.sin(phi);
    const z = r * Math.cos(theta);
    particles.push({
      baseX: x,
      baseY: y,
      baseZ: z,
      x: x,
      y: y,
      z: z,
      size: Math.random() * 2 + 1,
      flowOffsetX: Math.random() * 1000,
      flowOffsetY: Math.random() * 1000,
      flowOffsetZ: Math.random() * 1000,
      mergeOrigin: { x: x, y: y, z: z },
      curveVec: { x: 0, y: 0, z: 0 },
      curveAmp: 0,
    });
  }
}
createParticles();

// ===============================
//   SHAPE MORPHING FUNCTIONS
// ===============================
function setBasePositionsForShape(shape) {
  if (shape === "sphere") {
    for (let i = 0; i < particles.length; i++) {
      const theta = Math.acos(2 * Math.random() - 1);
      const phi = Math.random() * 2 * Math.PI;
      const r = sphereRadius * (0.9 + 0.1 * Math.random());
      particles[i].baseX = r * Math.sin(theta) * Math.cos(phi);
      particles[i].baseY = r * Math.sin(theta) * Math.sin(phi);
      particles[i].baseZ = r * Math.cos(theta);
    }
  } else if (shape === "infinite") {
    const a = 50; // size of loop
    const tubeRadius = 20;
    for (let i = 0; i < particles.length; i++) {
      const tParam = Math.random() * 2 * Math.PI;
      const cx = a * Math.cos(tParam);
      const cy = a * Math.sin(tParam) * Math.cos(tParam);
      const cz = 10 * Math.sin(2 * tParam);
      const offsetAngle = Math.random() * 2 * Math.PI;
      const offsetR = Math.random() * tubeRadius;
      particles[i].baseX = cx + offsetR * Math.cos(offsetAngle);
      particles[i].baseY = cy + offsetR * Math.sin(offsetAngle);
      particles[i].baseZ = cz + (Math.random() - 0.5) * 10;
    }
  }
}

// ===============================
//   NORMAL UPDATE (ROTATION & FLOW)
// ===============================
function normalUpdate(t) {
  const angleY = 0.0005 * t;
  const angleX = 0.0003 * t;
  const cosY = Math.cos(angleY),
    sinY = Math.sin(angleY);
  const cosX = Math.cos(angleX),
    sinX = Math.sin(angleX);

  // Update the drifting sphere center (merge point)
  sphereCenter.x = 100 * Math.sin(t * 0.0001);
  sphereCenter.y = 50 * Math.cos(t * 0.00015);
  sphereCenter.z = 0;

  particles.forEach((p) => {
    let x0 = p.baseX,
      y0 = p.baseY,
      z0 = p.baseZ;
    let x1 = x0 * cosY - z0 * sinY;
    let z1 = x0 * sinY + z0 * cosY;
    let y1 = y0;
    let y2 = y1 * cosX - z1 * sinX;
    let z2 = y1 * sinX + z1 * cosX;
    let x2 = x1;
    const flowAmp = 10,
      flowFreq = 0.001;
    const flowX = flowAmp * Math.sin(t * flowFreq + p.flowOffsetX);
    const flowY = flowAmp * Math.sin(t * flowFreq + p.flowOffsetY);
    const flowZ = flowAmp * Math.sin(t * flowFreq + p.flowOffsetZ);

    p.x = x2 + sphereCenter.x + flowX;
    p.y = y2 + sphereCenter.y + flowY;
    p.z = z2 + sphereCenter.z + flowZ;
  });
}

// ===============================
//   UPDATE FUNCTION (MERGE/EXPLOSION & MORPH)
// ===============================
function update(t) {
  sphereCenter.x = 100 * Math.sin(t * 0.0001);
  sphereCenter.y = 50 * Math.cos(t * 0.00015);
  sphereCenter.z = 0;

  if (mergeCycle.state === "normal") {
    normalUpdate(t);
    if (t - lastMergeTime > mergeInterval) {
      mergeCycle.state = "merging";
      mergeCycle.startTime = t;
      particles.forEach((p) => {
        p.mergeOrigin.x = p.x;
        p.mergeOrigin.y = p.y;
        p.mergeOrigin.z = p.z;
        let dx = sphereCenter.x - p.mergeOrigin.x;
        let dy = sphereCenter.y - p.mergeOrigin.y;
        let dz = sphereCenter.z - p.mergeOrigin.z;
        let dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
        p.curveAmp = dist / 3;
        p.curveVec = getPerpendicular({ x: dx, y: dy, z: dz });
      });
    }
  } else if (mergeCycle.state === "merging") {
    normalUpdate(t);
    let progress = (t - mergeCycle.startTime) / mergeCycle.mergePhase;
    if (progress > 1) progress = 1;
    let easedProgress = easeInOutCubic(progress);
    particles.forEach((p) => {
      let lx = lerp(p.mergeOrigin.x, sphereCenter.x, easedProgress);
      let ly = lerp(p.mergeOrigin.y, sphereCenter.y, easedProgress);
      let lz = lerp(p.mergeOrigin.z, sphereCenter.z, easedProgress);
      let offset = p.curveAmp * Math.sin(Math.PI * easedProgress);
      p.x = lx + p.curveVec.x * offset;
      p.y = ly + p.curveVec.y * offset;
      p.z = lz + p.curveVec.z * offset;
    });
    if (progress === 1) {
      mergeCycle.state = "exploding";
      mergeCycle.startTime = t;
    }
  } else if (mergeCycle.state === "exploding") {
    let progress = (t - mergeCycle.startTime) / mergeCycle.explosionPhase;
    if (progress > 1) progress = 1;
    let easedProgress = easeOutCubic(progress);
    particles.forEach((p) => {
      let normalPos = getNormalPosition(p, t);
      let lx = lerp(sphereCenter.x, normalPos.x, easedProgress);
      let ly = lerp(sphereCenter.y, normalPos.y, easedProgress);
      let lz = lerp(sphereCenter.z, normalPos.z, easedProgress);
      let offset = p.curveAmp * Math.sin(Math.PI * easedProgress);
      p.x = lx + p.curveVec.x * offset;
      p.y = ly + p.curveVec.y * offset;
      p.z = lz + p.curveVec.z * offset;
    });
    if (progress === 1) {
      mergeCycle.state = "normal";
      lastMergeTime = t;
      // Alternate base shape upon explosion:
      if (currentShape === "sphere") {
        currentShape = "infinite";
        setBasePositionsForShape("infinite");
      } else {
        currentShape = "sphere";
        setBasePositionsForShape("sphere");
      }
      normalUpdate(t);
    }
  }

  // ------------------------------
  //  INTERACTIVE EXPANSION (HOVER)
  // ------------------------------
  // Update expansionFactor: if hovered, target is targetExpansion; else 1.
  if (isHovered) {
    expansionFactor += (targetExpansion - expansionFactor) * expansionSpeed;
  } else {
    expansionFactor += (1 - expansionFactor) * expansionSpeed;
  }

  // Update menu display: position menu at sphere center (screen coords) and fade in/out.
  const centerScreenX = sphereCenter.x + canvas.width / 2;
  const centerScreenY = sphereCenter.y + canvas.height / 2;
  // Smoothly update menu position
  menu.style.transform = `translate(${centerScreenX - 50}px, ${
    centerScreenY - 50
  }px)`;
  menu.style.opacity = isHovered ? 1 : 0;
}

// ===============================
//   DRAW FUNCTION (with expansion effect)
// ===============================
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach((p) => {
    // Apply expansion: scale particle's offset from sphereCenter by expansionFactor.
    const effX = sphereCenter.x + (p.x - sphereCenter.x) * expansionFactor;
    const effY = sphereCenter.y + (p.y - sphereCenter.y) * expansionFactor;
    const effZ = sphereCenter.z + (p.z - sphereCenter.z) * expansionFactor;

    const scale = focalLength / (focalLength + effZ);
    const screenX = effX * scale + canvas.width / 2;
    const screenY = effY * scale + canvas.height / 2;
    const size = p.size * scale;
    const opacity = Math.min(1, scale);
    if (effZ > -focalLength) {
      const gradient = ctx.createRadialGradient(
        screenX,
        screenY,
        0,
        screenX,
        screenY,
        size
      );
      gradient.addColorStop(0.2, `rgba(255, 255, 255, ${opacity})`);
      gradient.addColorStop(0.5, `rgba(200, 200, 200, ${opacity * 0.7})`);
      gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
      ctx.beginPath();
      ctx.arc(screenX, screenY, size, 0, 2 * Math.PI);
      ctx.fillStyle = gradient;
      ctx.fill();
    }
  });
}

// ===============================
//   ANIMATION LOOP
// ===============================
function animate(t) {
  update(t);
  draw();
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
