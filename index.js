// Grab the canvas and its 2D context
const canvas = document.getElementById("particle-canvas");
const ctx = canvas.getContext("2d");

// Make the canvas fill the browser window
function setCanvasSize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", setCanvasSize);
setCanvasSize();

// Perspective settings
const focalLength = 300; // Adjust for a tighter or looser perspective

// Number of particles in the sphere
const numberOfParticles = 5000;
// Radius of the sphere
const sphereRadius = 300;

// We'll store an array of particle objects
let particles = [];

// Create particles on the *surface* of a sphere (or near-surface for variety)
function createParticles() {
  particles = [];
  for (let i = 0; i < numberOfParticles; i++) {
    const theta = Math.acos(2 * Math.random() - 1); // 0 to π
    const phi = Math.random() * 2 * Math.PI; // 0 to 2π

    // Slight variation around the surface
    const r = sphereRadius * (0.9 + 0.1 * Math.random());
    const x = r * Math.sin(theta) * Math.cos(phi);
    const y = r * Math.sin(theta) * Math.sin(phi);
    const z = r * Math.cos(theta);

    // Each particle keeps its "base" position on the sphere
    particles.push({
      baseX: x,
      baseY: y,
      baseZ: z,
      x: x,
      y: y,
      z: z,
      size: Math.random() * 2 + 1,
      // Random lifetime (in ms or frames, whichever you prefer)
      lifetime: Math.floor(Math.random() * 600 + 300), // 300 to 900 frames
    });
  }
}

// This will store our drifting center of the sphere in 3D
let sphereCenter = { x: 0, y: 0, z: 0 };

// Update function: rotate around multiple axes, drift the sphere, handle vanish/respawn
function update(t) {
  // Rotation angles based on time
  const angleY = 0.0005 * t; // rotate around Y
  const angleX = 0.0003 * t; // rotate around X
  const cosY = Math.cos(angleY);
  const sinY = Math.sin(angleY);
  const cosX = Math.cos(angleX);
  const sinX = Math.sin(angleX);

  // Drift the center of the sphere in a slow sinusoidal path
  sphereCenter.x = 100 * Math.sin(t * 0.0001);
  sphereCenter.y = 50 * Math.cos(t * 0.00015);
  sphereCenter.z = 0; // Keep Z fixed or add more drift if you want

  // Update each particle
  particles.forEach((p, index) => {
    // Decrement lifetime
    p.lifetime--;

    if (p.lifetime <= 0) {
      // Respawn this particle at a new random location on the sphere
      const theta = Math.acos(2 * Math.random() - 1);
      const phi = Math.random() * 2 * Math.PI;
      const r = sphereRadius * (0.9 + 0.1 * Math.random());
      p.baseX = r * Math.sin(theta) * Math.cos(phi);
      p.baseY = r * Math.sin(theta) * Math.sin(phi);
      p.baseZ = r * Math.cos(theta);
      p.size = Math.random() * 2 + 1;
      p.lifetime = Math.floor(Math.random() * 600 + 300);
    }

    // Rotate the base (x, y, z) around Y, then around X
    const x0 = p.baseX;
    const y0 = p.baseY;
    const z0 = p.baseZ;

    // 1) Rotate around Y
    let x1 = x0 * cosY - z0 * sinY;
    let z1 = x0 * sinY + z0 * cosY;
    let y1 = y0;

    // 2) Rotate around X
    let y2 = y1 * cosX - z1 * sinX;
    let z2 = y1 * sinX + z1 * cosX;
    let x2 = x1;

    // Update final position, plus drifting center
    p.x = x2 + sphereCenter.x;
    p.y = y2 + sphereCenter.y;
    p.z = z2 + sphereCenter.z;
  });
}

// Draw each particle with perspective & a radial gradient
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  particles.forEach((p) => {
    // Perspective scale
    const scale = focalLength / (focalLength + p.z);
    const screenX = p.x * scale + canvas.width / 2;
    const screenY = p.y * scale + canvas.height / 2;
    const size = p.size * scale;
    const opacity = Math.min(1, scale);

    // If behind the camera, skip drawing
    if (p.z > -focalLength) {
      // Radial gradient for a subtle 3D look
      const gradient = ctx.createRadialGradient(
        screenX,
        screenY,
        0,
        screenX,
        screenY,
        size
      );
      gradient.addColorStop(0, `rgba(255, 255, 255, ${opacity})`); // bright center
      gradient.addColorStop(0.5, `rgba(200, 200, 200, ${opacity * 0.7})`);
      gradient.addColorStop(1, `rgba(255, 255, 255, 0)`); // fade out at edge

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

// Initialize particles & start animation
createParticles();
requestAnimationFrame(animate);
