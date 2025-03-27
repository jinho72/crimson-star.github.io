 // Setup Scene, Camera, and Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.z = 3;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(150, 150);
    document.getElementById('logo-container').appendChild(renderer.domElement);

    // Create a sphere geometry
    const geometry = new THREE.SphereGeometry(1, 64, 64);
    const textureLoader = new THREE.TextureLoader();
    // Replace the URL with your custom monochrome texture if desired
    const texture = textureLoader.load('https://threejsfundamentals.org/threejs/resources/images/checker.png');

    const material = new THREE.MeshStandardMaterial({
      map: texture,
      color: 0xffffff,
      roughness: 0.5,
      metalness: 0.1,
    });

    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    // Add lights for a soft glowing effect
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 0.8);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    // Set up post-processing for bloom (glow)
    const renderScene = new THREE.RenderPass(scene, camera);
    const bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(150, 150), 1.5, 0.4, 0.85);
    bloomPass.threshold = 0;
    bloomPass.strength = 1.5;
    bloomPass.radius = 0;
    
    const composer = new THREE.EffectComposer(renderer);
    composer.setSize(150, 150);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);

    // Animation loop
    function animate() {
      requestAnimationFrame(animate);
      sphere.rotation.y += 0.005;
      composer.render();
    }
    animate();


// Get the canvas and its 2D context
const canvas = document.getElementById('particle-canvas');
const ctx = canvas.getContext('2d');

// Ensure the canvas always fills the window
function setCanvasSize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', setCanvasSize);
setCanvasSize();

// Perspective settings for the 3D projection
const focalLength = 200; // Adjusts the strength of the perspective

// Define a flow field that produces a swirling (divergence‑free) x–y motion,
// with a small time‑varying offset and an independent z oscillation.
function getFlowVector(x, y, z, t) {
  // Calculate the distance from the origin (avoid division by zero)
  let r = Math.sqrt(x * x + y * y) + 0.0001;
  // Create a swirling (rotational) flow that is divergence‑free:
  // These values cause particles to circulate around the center.
  let vx = -y / r * 1.5;
  let vy =  x / r * 1.5;
  
  // Add a small time‑varying offset to break uniform rotation
  vx += Math.sin(t * 0.0005) * 0.5;
  vy += Math.cos(t * 0.0005) * 0.5;
  
  // For z, use a sine oscillation that produces free movement in depth
  const vz = Math.sin(z * 0.01 + t * 0.0003) * 1.5;
  
  return { vx, vy, vz };
}

// Particle class: each particle exists in 3D space and flows according to the flow field.
class Particle {
  constructor() {
    this.reset();
    this.size = Math.random() * 3 + 1; // Base size
  }
  
  // Reset the particle to a random position within a 3D volume
  reset() {
    // x and y are set in a coordinate system centered at 0
    this.x = (Math.random() - 0.5) * canvas.width;
    this.y = (Math.random() - 0.5) * canvas.height;
    // z defines depth: negative values bring it forward; positive values push it back
    this.z = Math.random() * 1100 - 200; // Range: [-100, 1000]
  }
  
  // Update the particle's position using the flow field.
  update(t) {
    const flow = getFlowVector(this.x, this.y, this.z, t);
    this.x += flow.vx;
    this.y += flow.vy;
    this.z += flow.vz;
    
    // Determine when the particle goes out of bounds and reset it
    const margin = 50;
    const scale = focalLength / (focalLength + this.z);
    const screenX = this.x * scale + canvas.width / 2;
    const screenY = this.y * scale + canvas.height / 2;
    
    if (
      screenX < -margin ||
      screenX > canvas.width + margin ||
      screenY < -margin ||
      screenY > canvas.height + margin ||
      this.z < -100 ||
      this.z > 1000
    ) {
      this.reset();
    }
  }
  
  // Draw the particle using a simple perspective projection
  draw() {
    const scale = focalLength / (focalLength + this.z);
    const screenX = this.x * scale + canvas.width / 2;
    const screenY = this.y * scale + canvas.height / 2;
    const drawSize = this.size * scale;
    const opacity = Math.min(1, scale);
    
    ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
    ctx.beginPath();
    ctx.arc(screenX, screenY, drawSize, 0, Math.PI * 5);
    ctx.fill();
  }
}

// Create and initialize particles
const particlesArray = [];
const numberOfParticles = 3000;

function initParticles() {
  particlesArray.length = 0;
  for (let i = 0; i < numberOfParticles; i++) {
    particlesArray.push(new Particle());
  }
}
initParticles();

// Animation loop: update and draw all particles.
// The global time (t) is used in the flow field for continuously changing velocities.
function animate(t) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  particlesArray.forEach(particle => {
    particle.update(t);
    particle.draw();
  });
  
  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
