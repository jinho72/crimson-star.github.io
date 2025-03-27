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

// Particle class: each particle will converge onto a 3D sphere target and then rotate slowly.
class Particle {
  constructor() {
    // Start with a random scattered position
    this.x = (Math.random() - 0.5) * canvas.width;
    this.y = (Math.random() - 0.5) * canvas.height;
    this.z = (Math.random() - 0.5) * 1000; // spread in depth

    // Set a target position on a sphere using spherical coordinates
    const R = 300; // sphere radius
    const theta = Math.acos(2 * Math.random() - 1); // polar angle
    const phi = Math.random() * Math.PI * 2;          // azimuthal angle
    // Use cube-root distribution for a uniform density within the sphere
    const r = R * Math.cbrt(Math.random());
    this.targetX = r * Math.sin(theta) * Math.cos(phi);
    this.targetY = r * Math.sin(theta) * Math.sin(phi);
    this.targetZ = r * Math.cos(theta);
    
    this.size = Math.random() * 3 + 1; // Base size for drawing
  }
  
  update(t) {
    // Compute the vector from current position to target
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dz = this.targetZ - this.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    
    // Speed factor for convergence (adjust as needed)
    const convergeSpeed = 0.02;
    
    if (distance > 1) {
      // Particle is still converging: move a fraction toward its target
      this.x += dx * convergeSpeed;
      this.y += dy * convergeSpeed;
      this.z += dz * convergeSpeed;
    } else {
      // Once the particle is near its target, apply a slow rotation about the Y-axis.
      // Compute a small rotation angle (using time t, scaled appropriately)
      const angle = 0.001 * t; // Adjust this factor to change rotation speed
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const xOld = this.x;
      // Rotate the (x, z) coordinates around Y
      this.x = xOld * cosA - this.z * sinA;
      this.z = xOld * sinA + this.z * cosA;
    }
  }
  
  draw() {
    // Perspective projection: scale based on z depth
    const scale = focalLength / (focalLength + this.z);
    const screenX = this.x * scale + canvas.width / 2;
    const screenY = this.y * scale + canvas.height / 2;
    const drawSize = this.size * scale;
    const opacity = Math.min(1, scale);
    
    // Create a radial gradient for a 3D-textured dot
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
  // Clear the entire canvas each frame
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Update and draw each particle
  particlesArray.forEach(particle => {
    particle.update(t);
    particle.draw();
  });
  
  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
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
