// Three.js scene setup
let scene, camera, renderer, particleBall;
let mouseX = 0, mouseY = 0;
let targetX = 0, targetY = 0;
let bgm, textSound;
let lastPlayedText = 0;
const TEXT_SOUND_DELAY = 500; // Minimum delay between text sounds in milliseconds
let currentSection = 0;
let isMuted = false;

// Camera positions for each section
const cameraPositions = {
    0: { x: 0, y: 0, z: 50 },      // Initial view
    1: { x: 0, y: 0, z: 15 },      // Inside ball
    2: { x: 10, y: 5, z: 15 },     // Section 1
    3: { x: -10, y: -5, z: 15 },   // Section 2
    4: { x: 5, y: 10, z: 15 },     // Section 3
    5: { x: -5, y: -10, z: 15 },   // Section 4
    6: { x: 15, y: 0, z: 15 },     // Section 5
    7: { x: -15, y: 0, z: 15 },    // Section 6
    8: { x: 0, y: 0, z: 50 }       // Back to initial view
};

// Initialize Three.js scene
function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('universe-container').appendChild(renderer.domElement);

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    createParticleBall();
    
    camera.position.z = 50;

    // Initialize audio
    initAudio();

    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);
    // Handle mouse movement
    document.addEventListener('mousemove', onMouseMove, false);
    // Handle scroll
    window.addEventListener('scroll', onScroll, { passive: true });
    
    // Initialize custom cursor
    initCustomCursor();
}

// Handle scroll
function onScroll() {
    const scrollPosition = window.pageYOffset;
    const windowHeight = window.innerHeight;
    const newSection = Math.round(scrollPosition / windowHeight);

    if (newSection !== currentSection) {
        currentSection = newSection;
        updateCamera();
        
        // Smooth scroll to section
        const targetScroll = currentSection * windowHeight;
        window.scrollTo({
            top: targetScroll,
            behavior: 'smooth'
        });
    }

    // Hide initial instruction after first scroll
    if (scrollPosition > 50) {
        document.querySelector('.initial-instruction').classList.add('hidden');
    }

    // Show/hide sections based on scroll position
    document.querySelectorAll('.section').forEach((section, index) => {
        const rect = section.getBoundingClientRect();
        const isInView = rect.top < windowHeight / 2 && rect.bottom > windowHeight / 2;
        
        if (isInView) {
            if (!section.classList.contains('visible')) {
                section.classList.add('visible');
                // Play sound only once per section
                if (!section.dataset.soundPlayed) {
                    playTextSound();
                    section.dataset.soundPlayed = 'true';
                }
            }
        } else {
            section.classList.remove('visible');
        }
    });
}

// Update camera position
function updateCamera() {
    const targetPosition = cameraPositions[currentSection];
    if (targetPosition) {
        gsap.to(camera.position, {
            x: targetPosition.x,
            y: targetPosition.y,
            z: targetPosition.z,
            duration: 1,
            ease: "power2.inOut"
        });

        if (particleBall) {
            gsap.to(particleBall.rotation, {
                x: Math.random() * Math.PI * 2,
                y: Math.random() * Math.PI * 2,
                duration: 1,
                ease: "power2.inOut"
            });
        }
    }
}

// Initialize audio
function initAudio() {
    bgm = document.getElementById('bgm');
    textSound = document.getElementById('textSound');
    const muteButton = document.getElementById('muteButton');
    
    // Set volume levels
    bgm.volume = 0.3;
    textSound.volume = 0.2;

    // Start background music automatically
    const startAudio = () => {
        if (!isMuted) {
            bgm.play().catch(error => console.log('Audio play failed:', error));
        }
    };

    // Try to start audio on page load
    startAudio();

    // Also try on first user interaction
    document.addEventListener('click', startAudio, { once: true });
    document.addEventListener('touchstart', startAudio, { once: true });

    // Preload the text sound
    textSound.load();

    // Handle mute button click
    muteButton.addEventListener('click', () => {
        isMuted = !isMuted;
        muteButton.classList.toggle('muted');
        
        if (isMuted) {
            bgm.pause();
            textSound.pause();
            muteButton.querySelector('i').classList.remove('fa-volume-up');
            muteButton.querySelector('i').classList.add('fa-volume-mute');
        } else {
            bgm.play().catch(error => console.log('Audio play failed:', error));
            muteButton.querySelector('i').classList.remove('fa-volume-mute');
            muteButton.querySelector('i').classList.add('fa-volume-up');
        }
    });
}

// Play text sound with delay
function playTextSound() {
    if (isMuted) return;
    
    const now = Date.now();
    if (now - lastPlayedText >= TEXT_SOUND_DELAY) {
        textSound.currentTime = 0;
        textSound.play().catch(error => console.log('Text sound play failed:', error));
        lastPlayedText = now;
    }
}

// Create particle ball
function createParticleBall() {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const particleCount = 5000;
    const radius = 20;

    for (let i = 0; i < particleCount; i++) {
        const theta = THREE.MathUtils.randFloatSpread(360);
        const phi = THREE.MathUtils.randFloatSpread(360);

        const x = radius * Math.sin(theta) * Math.cos(phi);
        const y = radius * Math.sin(theta) * Math.sin(phi);
        const z = radius * Math.cos(theta);

        vertices.push(x, y, z);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

    const material = new THREE.PointsMaterial({
        color: 0x4ecdc4,
        size: 0.1,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true
    });

    particleBall = new THREE.Points(geometry, material);
    scene.add(particleBall);
}

// Custom cursor
function initCustomCursor() {
    const cursor = document.querySelector('.cursor');
    const cursorDot = document.querySelector('.cursor-dot');

    document.addEventListener('mousemove', (e) => {
        gsap.to(cursor, {
            x: e.clientX - 10,
            y: e.clientY - 10,
            duration: 0.2
        });
        gsap.to(cursorDot, {
            x: e.clientX - 2,
            y: e.clientY - 2,
            duration: 0.1
        });
    });

    // Add hover effect to interactive elements
    const interactiveElements = document.querySelectorAll('a, .animated-list li');
    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
    });
}

// Handle mouse movement
function onMouseMove(event) {
    mouseX = (event.clientX - window.innerWidth / 2) / 100;
    mouseY = (event.clientY - window.innerHeight / 2) / 100;
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Smooth camera movement
    targetX += (mouseX - targetX) * 0.05;
    targetY += (mouseY - targetY) * 0.05;

    camera.position.x += (targetX - camera.position.x) * 0.1;
    camera.position.y += (-targetY - camera.position.y) * 0.1;
    camera.lookAt(scene.position);

    // Rotate particle ball
    if (particleBall) {
        particleBall.rotation.x += 0.001;
        particleBall.rotation.y += 0.002;
    }

    renderer.render(scene, camera);
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Initialize everything
init();
animate(); 