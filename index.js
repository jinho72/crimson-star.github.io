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
    this.z = Math.random() * 1100 - 200; // Range: [-200, 900]
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
  
  // Draw the particle using a radial gradient to simulate a 3D textured dot
  draw() {
    const scale = focalLength / (focalLength + this.z);
    const screenX = this.x * scale + canvas.width / 2;
    const screenY = this.y * scale + canvas.height / 2;
    const drawSize = this.size * scale;
    const opacity = Math.min(1, scale);
    
    // Create a radial gradient for a textured 3D look
    const gradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, drawSize);
    gradient.addColorStop(0, `rgba(0, 0, 0, ${opacity})`);           // Bright center
    gradient.addColorStop(0.5, `rgba(50, 50, 50, ${opacity * 0.8})`);  // Smooth mid-tone
    gradient.addColorStop(1, `rgba(0, 0, 0, 0)`);                     // Transparent edge
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(screenX, screenY, drawSize, 0, Math.PI * 2);
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
function animate(t) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  particlesArray.forEach(particle => {
    particle.update(t);
    particle.draw();
  });
  
  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);

    /* ===================== 3D Ball Logo ===================== */
    // Setup Scene, Camera, and Renderer for the ball logo
    const ballScene = new THREE.Scene();
    const ballCamera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    ballCamera.position.z = 3;

    const ballRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    ballRenderer.setSize(150, 150);
    document.getElementById('logo-container').appendChild(ballRenderer.domElement);

    // Create a sphere geometry for the ball logo
    const ballGeometry = new THREE.SphereGeometry(1, 64, 64);
    const ballTextureLoader = new THREE.TextureLoader();
    // Replace the URL below with your custom monochrome texture if desired
    const ballTexture = ballTextureLoader.load('https://threejsfundamentals.org/threejs/resources/images/checker.png');

    const ballMaterial = new THREE.MeshStandardMaterial({
      map: ballTexture,
      color: 0xffffff,
      roughness: 0.5,
      metalness: 0.1,
    });

    const ballSphere = new THREE.Mesh(ballGeometry, ballMaterial);
    ballScene.add(ballSphere);

    // Add lights for the ball logo
    const ballAmbientLight = new THREE.AmbientLight(0xffffff, 0.6);
    ballScene.add(ballAmbientLight);
    const ballPointLight = new THREE.PointLight(0xffffff, 0.8);
    ballPointLight.position.set(5, 5, 5);
    ballScene.add(ballPointLight);

    // Setup post-processing for bloom (glow) on the ball logo
    const ballRenderScene = new THREE.RenderPass(ballScene, ballCamera);
    const ballBloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(150, 150), 1.5, 0.4, 0.85);
    ballBloomPass.threshold = 0;
    ballBloomPass.strength = 1.5;
    ballBloomPass.radius = 0;

    const ballComposer = new THREE.EffectComposer(ballRenderer);
    ballComposer.setSize(150, 150);
    ballComposer.addPass(ballRenderScene);
    ballComposer.addPass(ballBloomPass);

    // Ball logo animation loop
    function animateBall() {
      requestAnimationFrame(animateBall);
      ballSphere.rotation.y += 0.005;
      ballComposer.render();
    }
    animateBall();
