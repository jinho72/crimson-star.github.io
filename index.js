// Utility functions
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

// Set up canvas
const canvas = document.getElementById("particle-canvas");
const ctx = canvas.getContext("2d");
function setCanvasSize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", setCanvasSize);
setCanvasSize();

// Perspective settings
const focalLength = 300;

// Particle and sphere parameters
const numberOfParticles = 5000;
const sphereRadius = 300;

// Merge/Explosion timing (milliseconds)
let mergeInterval = 10000; // Every 10 seconds trigger cycle
let mergeCycle = {
  state: "normal", // "normal", "merging", "exploding"
  startTime: 0, // Time when current cycle started
  mergePhase: 1000, // Duration of merge phase
  explosionPhase: 1500, // Duration of explosion phase (longer for smooth reentry)
};
let lastMergeTime = 0; // Last cycle start time

// Global drifting center (merge point)
let sphereCenter = { x: 0, y: 0, z: 0 };

// Particle container
let particles = [];

// Create particles on (or near) the surface of a sphere
function createParticles() {
  particles = [];
  for (let i = 0; i < numberOfParticles; i++) {
    const theta = Math.acos(2 * Math.random() - 1);
    const phi = Math.random() * 2 * Math.PI;
    // Slight variation in radius
    const r = sphereRadius * (0.9 + 0.1 * Math.random());
    const x = r * Math.sin(theta) * Math.cos(phi);
    const y = r * Math.sin(theta) * Math.sin(phi);
    const z = r * Math.cos(theta);
    particles.push({
      baseX: x, // Fixed base for normal rotation
      baseY: y,
      baseZ: z,
      x: x, // Current position
      y: y,
      z: z,
      size: Math.random() * 2 + 1, // Different sizes
      flowOffsetX: Math.random() * 1000,
      flowOffsetY: Math.random() * 1000,
      flowOffsetZ: Math.random() * 1000,
      // When a merge starts, store the current position as mergeOrigin
      mergeOrigin: { x: x, y: y, z: z },
      // For curved trajectory, store a perpendicular curve vector and amplitude.
      curveVec: { x: 0, y: 0, z: 0 },
      curveAmp: 0,
    });
  }
}

// Normal update: particles follow their rotating, drifting, and flowy motion.
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
    // Rotate base position
    let x0 = p.baseX,
      y0 = p.baseY,
      z0 = p.baseZ;
    let x1 = x0 * cosY - z0 * sinY;
    let z1 = x0 * sinY + z0 * cosY;
    let y1 = y0;
    let y2 = y1 * cosX - z1 * sinX;
    let z2 = y1 * sinX + z1 * cosX;
    let x2 = x1;

    // Apply flow offsets
    const flowAmp = 10,
      flowFreq = 0.001;
    const flowX = flowAmp * Math.sin(t * flowFreq + p.flowOffsetX);
    const flowY = flowAmp * Math.sin(t * flowFreq + p.flowOffsetY);
    const flowZ = flowAmp * Math.sin(t * flowFreq + p.flowOffsetZ);

    // Final normal position
    p.x = x2 + sphereCenter.x + flowX;
    p.y = y2 + sphereCenter.y + flowY;
    p.z = z2 + sphereCenter.z + flowZ;
  });
}

// Update function with curved merge and explosion transitions.
function update(t) {
  // Always update sphereCenter based on time.
  sphereCenter.x = 100 * Math.sin(t * 0.0001);
  sphereCenter.y = 50 * Math.cos(t * 0.00015);
  sphereCenter.z = 0;

  if (mergeCycle.state === "normal") {
    normalUpdate(t);
    // Trigger merge cycle after the interval.
    if (t - lastMergeTime > mergeInterval) {
      mergeCycle.state = "merging";
      mergeCycle.startTime = t;
      // For each particle, store its current normal position as mergeOrigin
      // and compute a curve vector perpendicular to the direction to the merge point.
      particles.forEach((p) => {
        p.mergeOrigin.x = p.x;
        p.mergeOrigin.y = p.y;
        p.mergeOrigin.z = p.z;
        let dx = sphereCenter.x - p.mergeOrigin.x;
        let dy = sphereCenter.y - p.mergeOrigin.y;
        let dz = sphereCenter.z - p.mergeOrigin.z;
        let dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
        p.curveAmp = dist / 3; // Increase amplitude for a smoother curve
        p.curveVec = getPerpendicular({ x: dx, y: dy, z: dz });
      });
    }
  } else if (mergeCycle.state === "merging") {
    // Continue normal update so rotations/drifts remain current.
    normalUpdate(t);
    let progress = (t - mergeCycle.startTime) / mergeCycle.mergePhase;
    if (progress > 1) progress = 1;
    let easedProgress = easeInOutCubic(progress);
    // For each particle, interpolate from mergeOrigin to the merge point with a curved offset.
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
      // At the end of merging, transition to explosion.
      mergeCycle.state = "exploding";
      mergeCycle.startTime = t;
    }
  } else if (mergeCycle.state === "exploding") {
    // During explosion, compute progress using an ease-out function.
    let progress = (t - mergeCycle.startTime) / mergeCycle.explosionPhase;
    if (progress > 1) progress = 1;
    let easedProgress = easeOutCubic(progress);
    // For each particle, blend from the merge point toward the current normal position.
    // Compute the particle's expected normal position at time t.
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
      // Resume normal update – particles continue their revolving motion.
      normalUpdate(t);
    }
  }
}

// Draw particles with perspective & a radial gradient.
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
      gradient.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
      gradient.addColorStop(0.5, `rgba(200, 200, 200, ${opacity * 0.7})`);
      gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(screenX, screenY, size, 0, 2 * Math.PI);
      ctx.fill();
    }
  });
}

// Animation loop
function animate(t) {
  update(t);
  draw();
  requestAnimationFrame(animate);
}

// Initialize particles and start animation
createParticles();
requestAnimationFrame(animate);
