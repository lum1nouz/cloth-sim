class Particle {
    constructor(x, y, z, mass = 1) {
      this.position = new THREE.Vector3(x, y, z);
      this.previous = new THREE.Vector3(x, y, z);
      this.original = new THREE.Vector3(x, y, z);
      this.mass = mass;
      this.velocity = new THREE.Vector3();
      this.force = new THREE.Vector3();
    }

    
}

  
function satisfyConstraints(p1, p2, distance) {
    const diff = new THREE.Vector3().subVectors(p2.position, p1.position);
    const currentDistance = diff.length();
    if (currentDistance === 0) return; // Prevent division by zero

    const correction = diff.multiplyScalar(1 - distance / currentDistance);
    const correctionHalf = correction.multiplyScalar(0.5);
    p1.position.add(correctionHalf);
    p2.position.sub(correctionHalf);
}
  
// Set up the scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0xffffff);
document.body.appendChild(renderer.domElement);

// Add a white ambient light
const ambientLight = new THREE.AmbientLight(0xffffff);
scene.add(ambientLight);

// Create the cloth geometry
const clothWidth = 10;
const clothHeight = 10;
const numParticlesWidth = 50;
const numParticlesHeight = 50;
const clothGeometry = new THREE.BufferGeometry();

const particles = [];
const vertices = [];
const indices = [];

for (let v = 0; v < numParticlesHeight; v++) {
    for (let u = 0; u < numParticlesWidth; u++) {
        const x = (u / (numParticlesWidth - 1)) * clothWidth - clothWidth / 2;
        const y = (v / (numParticlesHeight - 1)) * clothHeight - clothHeight / 2;
        const z = 0;

        const index = u + numParticlesWidth * (numParticlesHeight - 1 - v); // Reverse the order
        particles[index] = new Particle(x, y, z);
        vertices.push(x, y, z);

        if (u < numParticlesWidth - 1 && v < numParticlesHeight - 1) {
            const a = u + numParticlesWidth * v;
            const b = u + numParticlesWidth * (v + 1);
            const c = (u + 1) + numParticlesWidth * (v + 1);
            const d = (u + 1) + numParticlesWidth * v;

            indices.push(a, b, d);
            indices.push(b, c, d);
        }

        

        
    }
}


clothGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
clothGeometry.setIndex(indices);

// Create the cloth material
const clothMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: true });

// Create the cloth mesh
const clothMesh = new THREE.Mesh(clothGeometry, clothMaterial);
scene.add(clothMesh);

camera.position.set(20, 5, -15); // Update the camera position for a diagonal point of view
camera.lookAt(scene.position);

// Wind
const windForce = new THREE.Vector3(10, -5, 15);

// Simulation
const timeStep = 5 / 60;
const constraintIterations = 150;
const gravity = new THREE.Vector3(0, -9.8, 0);

function simulate() {
    // Apply forces
    const windStrength = Math.cos(performance.now() / 1000) * 20 + 5; // Adjust the frequency and amplitude of the wind
    windForce.set(windStrength, 0, 2);
    for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];

        if ((i === 0 || i === numParticlesWidth - 1) && particles[i].position.y === particles[i].original.y) {
            // Skip force application and integration for the top two corners
            continue;
        }

        particle.force.copy(gravity).multiplyScalar(particle.mass);
        particle.force.add(windForce);
    }


    // Verlet integration
    for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];
        const newPos = new THREE.Vector3().addVectors(particle.position, particle.velocity.multiplyScalar(timeStep));
        newPos.add(particle.force.multiplyScalar(timeStep * timeStep / (2 * particle.mass)));
        particle.velocity.add(particle.force.multiplyScalar(timeStep / particle.mass));
        particle.previous.copy(particle.position);
        particle.position.copy(newPos);
    }

    

    // Constraints
    for (let i = 0; i < constraintIterations; i++) {
        for (let v = 0; v < numParticlesHeight; v++) {
            for (let u = 0; u < numParticlesWidth; u++) {
            const index = u + numParticlesWidth * v;

            if (u > 0) {
                satisfyConstraints(particles[index], particles[index - 1], clothWidth / (numParticlesWidth - 1));
            }

            if (v > 0) {
                satisfyConstraints(particles[index], particles[index - numParticlesWidth], clothHeight / (numParticlesHeight - 1));
            }
            }
        }
    }

    // Pin the entire top side
    for (let u = 0; u < numParticlesWidth; u++) {
        const particle = particles[u];
        particle.position.copy(particle.original);
        particle.previous.copy(particle.original);
    }

    // Update geometry
    const positions = clothGeometry.attributes.position.array;
    for (let i = 0; i < particles.length; i++) {
        positions[i * 3] = particles[i].position.x;
        positions[i * 3 + 1] = particles[i].position.y;
        positions[i * 3 + 2] = particles[i].position.z;
    }

    clothGeometry.attributes.position.needsUpdate = true;
}

// Animate the scene
function animate() {
    requestAnimationFrame(animate);

    simulate();

    renderer.render(scene, camera);
}

animate();
