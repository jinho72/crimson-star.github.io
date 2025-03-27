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
const numberOfParticles = 3000;
// Radius of the sphere
const sphereRadius = 250;

// We'll store particles with their base (x, y, z) on the sphere
let particles = [];

// 1) Create particles on the *surface* of a sphere
function createParticles() {
  particles = [];

  for (let i = 0; i < numberOfParticles; i++) {
    // Random spherical coordinates
    const theta = Math.acos(2 * Math.random() - 1); // 0 to π
    const phi = Math.random() * 2 * Math.PI; // 0 to 2π

    // Place each particle on the sphere surface
    const x = sphereRadius * Math.sin(theta) * Math.cos(phi);
    const y = sphereRadius * Math.sin(theta) * Math.sin(phi);
    const z = sphereRadius * Math.cos(theta);

    // Store each particle's base position
    particles.push({
      baseX: x,
      baseY: y,
      baseZ: z,
      size: Math.random() * 2 + 1, // random size
    });
  }
}

// 2) Update function: rotate around the Y-axis
function update(t) {
  // Angle for rotation based on time
  const angle = 0.0005 * t; // rotation speed around Y
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);

  particles.forEach((p) => {
    // Rotate the base (x, z) around Y, keep y unchanged
    const x0 = p.baseX;
    const z0 = p.baseZ;

    p.x = x0 * cosA - z0 * sinA;
    p.y = p.baseY;
    p.z = x0 * sinA + z0 * cosA;
  });
}

// 3) Draw each particle with perspective & a radial gradient
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  particles.forEach((p) => {
    // Perspective scale
    const scale = focalLength / (focalLength + p.z);
    const screenX = p.x * scale + canvas.width / 2;
    const screenY = p.y * scale + canvas.height / 2;
    const size = p.size * scale;
    const opacity = Math.min(1, scale);

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
  });
}

// 4) Animation loop
function animate(t) {
  update(t);
  draw();
  requestAnimationFrame(animate);
}

// Initialize particles & start animation
createParticles();
requestAnimationFrame(animate);
