// Make sure Three.js is included as an external dependency

// --- Scene Setup ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 1, 5000);
camera.position.set(0, 0, 600);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Handle window resizing
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- Double Helix Parameters ---
const R = 100;                         // Helix radius
const pitch = 20;                      // How far along z per radian
const totalAngle = 8 * Math.PI;         // Total angular span (8π = 4 full turns)
const baseZ = (totalAngle * pitch) / 2;  // Centering the helix along z
const rotationSpeed = 0.0005;          // Radians per millisecond

// --- Particle Setup ---
const particlesPerStrand = 200;
const totalParticles = particlesPerStrand * 2;
const positions = new Float32Array(totalParticles * 3);
const angles = new Float32Array(totalParticles); // Store each particle's angle
const strands = new Uint8Array(totalParticles);    // 0 or 1 for the two strands

// Initialize particle data
for (let i = 0; i < totalParticles; i++) {
  // For each strand, set a random starting angle along the helix
  angles[i] = Math.random() * totalAngle;
  // Alternate strands: first half 0, second half 1 (or alternate for more mix)
  strands[i] = i % 2; 
}

// Create BufferGeometry and Points
const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

const material = new THREE.PointsMaterial({
  size: 4,
  color: 0x0099cc,
  transparent: true,
  opacity: 0.8
});

const points = new THREE.Points(geometry, material);
scene.add(points);

// --- Animation Loop ---
let lastTime = performance.now();
function animate(currentTime) {
  const deltaTime = currentTime - lastTime;
  lastTime = currentTime;
  
  // Update each particle's angle and compute its new 3D position
  for (let i = 0; i < totalParticles; i++) {
    // Increment the angle over time
    angles[i] += rotationSpeed * deltaTime;
    if (angles[i] > totalAngle) angles[i] -= totalAngle;
    
    // For one strand add a 180° offset
    const actualAngle = angles[i] + (strands[i] === 1 ? Math.PI : 0);
    // Calculate 3D coordinates of the helix
    const x = R * Math.cos(actualAngle);
    const y = R * Math.sin(actualAngle);
    const z = angles[i] * pitch - baseZ;
    
    positions[i * 3]     = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  }
  
  // Inform Three.js that positions have updated
  geometry.attributes.position.needsUpdate = true;
  
  // Slowly rotate the whole scene for an extra 3D effect
  scene.rotation.y += 0.001;
  
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
