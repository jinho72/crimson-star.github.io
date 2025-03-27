


// Get the canvas and its 2D context
const canvas = document.getElementById('particle-canvas');
const ctx = canvas.getContext('2d');

// Resize the canvas to fill the window
function setCanvasSize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', setCanvasSize);
setCanvasSize();

// --- Double Helix Parameters ---
// Focal length for perspective projection (lower value => stronger effect)
const focalLength = 600;
// Helix radius (distance from center)
const R = 100;
// Pitch: how far (in z) the spiral advances per radian of rotation
const pitch = 10;
// Total angular extent for each particle's journey (in radians)
// (e.g., 8*π corresponds to 4 full turns)
const totalAngle = 5 * Math.PI;
// Base z offset to center the helix along the z-axis
const baseZ = (totalAngle * pitch) / 2;
// Rotation speed: how fast particles move along the helix (radians per ms)
const rotationSpeed = 0.0002;

// --- Particle Class for the Double Helix ---
class Particle {
  constructor(strand) {
    // Each particle belongs to one of two strands (0 or 1)
    this.strand = strand;
    // Initialize with a random angle along the helix
    this.angle = Math.random() * totalAngle;
  }
  
  // Update the particle's position along the helix based on elapsed time
  update(deltaTime) {
    this.angle += rotationSpeed * deltaTime;
    // Loop back when a particle reaches the end of the helix
    if (this.angle > totalAngle) {
      this.angle -= totalAngle;
    }
  }
  
  // Draw the particle using a 3D perspective projection
  draw() {
    // For the double helix, add a 180° offset (PI radians) for one of the strands
    const actualAngle = this.angle + (this.strand === 1 ? Math.PI : 0);
    // Calculate the 3D coordinates:
    // x and y positions come from the helix circle
    const x3d = R * Math.cos(actualAngle);
    const y3d = R * Math.sin(actualAngle);
    // z position progresses along the helix
    const z3d = this.angle * pitch - baseZ;
    
    // Perspective projection: particles nearer (lower z) appear larger
    const scale = focalLength / (focalLength + z3d);
    const screenX = canvas.width / 2 + x3d * scale;
    const screenY = canvas.height / 2 + y3d * scale;
    
    // Set a base size (you can adjust as desired)
    const drawSize = 3 * scale;
    
    // Change the color if you like:
    // Here we use a constant color (e.g., a shade of blue), but you can change it.
    ctx.fillStyle = `rgba(0, 102, 204, ${Math.min(1, scale)})`;
    
    ctx.beginPath();
    ctx.arc(screenX, screenY, drawSize, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Create a set of particles forming the double helix
const particles = [];
// Total particles per strand (total particles will be double this number)
const particlesPerStrand = 200;
for (let i = 0; i < particlesPerStrand; i++) {
  // Alternate strands: one for strand 0 and one for strand 1
  particles.push(new Particle(0));
  particles.push(new Particle(1));
}

// Animation loop
let lastTime = performance.now();
function animate(currentTime) {
  const deltaTime = currentTime - lastTime;
  lastTime = currentTime;
  
  // Clear the canvas for the new frame
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Update and draw each particle
  particles.forEach(particle => {
    particle.update(deltaTime);
    particle.draw();
  });
  
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
