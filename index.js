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
  const cosY = Math.cos(angleY),
    sinY = Math.sin(angleY);
  const cosX = Math.cos(angleX),
    sinX = Math.sin(angleX);
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
let mergeInterval = 10000; // Every 10 seconds trigger cycle
let mergeCycle = {
  state: "normal", // "normal", "merging", "exploding"
  startTime: 0,
  mergePhase: 1000, // merge phase duration in ms
  explosionPhase: 1500, // explosion phase duration in ms
};
let lastMergeTime = 0;
let sphereCenter = { x: 0, y: 0, z: 0 };

// Global shape state: "sphere" or "stl"
// (Particles will morph between a sphere and the STL contour shape)
let currentShape = "sphere";

// ===============================
//   MOUSE & MENU INTERACTION
// ===============================
let isHovered = false;
let mousePos = { x: canvas.width / 2, y: canvas.height / 2 };
const menu = document.getElementById("menu"); // single menu that follows cursor
canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  mousePos.x = e.clientX - rect.left;
  mousePos.y = e.clientY - rect.top;
  isHovered = true;
});
canvas.addEventListener("mouseout", () => {
  isHovered = false;
});

// ===============================
//   INTERACTION TARGET ASSIGNMENT (for 1 sphere per menu)
// ===============================
const interactionSphereRadius = 30; // radius of the small sphere around the cursor
function assignInteractionTargets(t) {
  // Compute the interaction center in world space from the mouse position.
  let targetCenter = {
    x: mousePos.x - canvas.width / 2,
    y: mousePos.y - canvas.height / 2,
    z: 0,
  };
  // For each particle, assign an interaction target that lies on a small sphere
  // centered at targetCenter. To create organic swirling, each particle uses its own persistent angle.
  particles.forEach((p) => {
    if (p.interactionAngle === undefined) {
      p.interactionAngle = Math.random() * 2 * Math.PI;
    }
    p.interactionAngle += 0.01;
    // Randomize radius slightly
    let r =
      interactionSphereRadius + 5 * Math.sin(t * 0.002 + p.interactionAngle);
    p.interactionTarget = {
      x: targetCenter.x + r * Math.cos(p.interactionAngle),
      y: targetCenter.y + r * Math.sin(p.interactionAngle),
      z: targetCenter.z + 5 * Math.sin(t * 0.003 + p.interactionAngle),
    };
  });
}
function clearInteractionTargets() {
  particles.forEach((p) => {
    p.interactionTarget = null;
  });
}
// Update menu element to follow the cursor.
function updateMenuPosition() {
  if (menu) {
    menu.style.transform = `translate(${mousePos.x}px, ${mousePos.y}px)`;
    menu.style.opacity = 1;
  }
}

// ===============================
//   GLOBAL EXPANSION (OPTIONAL)
// ===============================
let expansionFactor = 1.0;
const targetExpansion = 1.5;
const expansionSpeed = 0.05;

// ===============================
//   PARTICLE CREATION
// ===============================
let particles = [];
function createParticles() {
  particles = [];
  for (let i = 0; i < numberOfParticles; i++) {
    let u = Math.random();
    let c = 2 * u - 1;
    const alpha = 2;
    c = c >= 0 ? Math.pow(c, 1 / alpha) : -Math.pow(-c, 1 / alpha);
    const theta = Math.acos(c);
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
      interactionTarget: null,
    });
  }
}
createParticles();

// ===============================
//   SET BASE POSITIONS FOR SHAPES
// ===============================
// We now support two shapes: "sphere" and "stl"
// For "stl", we use an array "stlContourPoints" that must be defined externally.
function setBasePositionsForShape(shape) {
  if (shape === "sphere") {
    for (let i = 0; i < particles.length; i++) {
      let u = Math.random();
      let c = 2 * u - 1;
      const alpha = 2;
      c = c >= 0 ? Math.pow(c, 1 / alpha) : -Math.pow(-c, 1 / alpha);
      const theta = Math.acos(c);
      const phi = Math.random() * 2 * Math.PI;
      const r = sphereRadius * (0.9 + 0.1 * Math.random());
      particles[i].baseX = r * Math.sin(theta) * Math.cos(phi);
      particles[i].baseY = r * Math.sin(theta) * Math.sin(phi);
      particles[i].baseZ = r * Math.cos(theta);
    }
  } else if (shape === "stl") {
    // Use the precomputed contour points from your STL file.
    // Ensure stlContourPoints is an array of { x, y, z } objects.
    if (
      typeof stlContourPoints !== "undefined" &&
      stlContourPoints.length > 0
    ) {
      const len = stlContourPoints.length;
      for (let i = 0; i < particles.length; i++) {
        // Cycle through the contour points if there are fewer than particles.
        const pt = stlContourPoints[i % len];
        // Optionally, add a bit of random variation:
        particles[i].baseX = pt.x + (Math.random() - 0.5) * 5;
        particles[i].baseY = pt.y + (Math.random() - 0.5) * 5;
        particles[i].baseZ = pt.z + (Math.random() - 0.5) * 5;
      }
    } else {
      console.warn(
        "stlContourPoints is not defined or empty. Falling back to sphere."
      );
      setBasePositionsForShape("sphere");
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
//   UPDATE FUNCTION (MERGE/EXPLOSION, MORPH, & INTERACTION)
// ===============================
function update(t) {
  sphereCenter.x = 100 * Math.sin(t * 0.0001);
  sphereCenter.y = 50 * Math.cos(t * 0.00015);
  sphereCenter.z = 0;

  // INTERACTIVE MODE:
  if (isHovered) {
    // In interactive mode, assign targets so that particles cluster around three separate small spheres.
    assignInteractionTargets(t);
    particles.forEach((p) => {
      p.x = lerp(p.x, p.interactionTarget.x, 0.05);
      p.y = lerp(p.y, p.interactionTarget.y, 0.05);
      p.z = lerp(p.z, p.interactionTarget.z, 0.05);
    });
    updateMenuPosition();
    return; // Skip merge/explosion logic when interacting.
  } else {
    clearInteractionTargets();
  }

  // MERGE/EXPLOSION CYCLE:
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
      // Alternate between "sphere" and "stl" shapes.
      if (currentShape === "sphere") {
        currentShape = "stl";
        setBasePositionsForShape("stl");
      } else {
        currentShape = "sphere";
        setBasePositionsForShape("sphere");
      }
      normalUpdate(t);
    }
  }
  // Hide menu when not in interactive mode.
  if (menu) {
    menu.style.opacity = 0;
  }
}

// ===============================
//   DRAW FUNCTION
// ===============================
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach((p) => {
    const scale = focalLength / (focalLength + p.z);
    const screenX = p.x * scale + canvas.width / 2;
    const screenY = p.y * scale + canvas.height / 2;
    const size = p.size * scale;
    const opacity = Math.min(1, scale);
    if (p.z > -focalLength) {
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
