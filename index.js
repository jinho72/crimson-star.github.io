 /* ===================== Particle Animation ===================== */
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

    // Perspective settings for the 3D projection (for particles)
    const focalLength = 200;

    // Define a flow field that produces a swirling x–y motion with a z oscillation
    function getFlowVector(x, y, z, t) {
      let r = Math.sqrt(x * x + y * y) + 0.0001;
      let vx = -y / r * 1.5;
      let vy =  x / r * 1.5;
      vx += Math.sin(t * 0.0005) * 0.5;
      vy += Math.cos(t * 0.0005) * 0.5;
      const vz = Math.sin(z * 0.01 + t * 0.0003) * 1.5;
      return { vx, vy, vz };
    }

    // Particle class: represents each particle in 3D space
    class Particle {
      constructor() {
        this.reset();
        this.size = Math.random() * 3 + 1;
      }
      reset() {
        this.x = (Math.random() - 0.5) * canvas.width;
        this.y = (Math.random() - 0.5) * canvas.height;
        this.z = Math.random() * 1100 - 200;
      }
      update(t) {
        const flow = getFlowVector(this.x, this.y, this.z, t);
        this.x += flow.vx;
        this.y += flow.vy;
        this.z += flow.vz;
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
      draw() {
        const scale = focalLength / (focalLength + this.z);
        const screenX = this.x * scale + canvas.width / 2;
        const screenY = this.y * scale + canvas.height / 2;
        const drawSize = this.size * scale;
        const opacity = Math.min(1, scale);
        ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
        ctx.beginPath();
        ctx.arc(screenX, screenY, drawSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Initialize particles
    const particlesArray = [];
    const numberOfParticles = 3000;
    function initParticles() {
      particlesArray.length = 0;
      for (let i = 0; i < numberOfParticles; i++) {
        particlesArray.push(new Particle());
      }
    }
    initParticles();

    // Particle animation loop
    function animateParticles(t) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particlesArray.forEach(particle => {
        particle.update(t);
        particle.draw();
      });
      requestAnimationFrame(animateParticles);
    }
    requestAnimationFrame(animateParticles);

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
