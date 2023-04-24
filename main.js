import * as THREE from "three";
import { TextureLoader } from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const TEXTURES = ["textures/fabric.jpeg", "textures/square_pattern.avif", "textures/square_pattern.avif"];
let windEnabled = true;
let pointAttached = true;

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

  
function satisfyDistanceConstraints(p1, p2, distance) {
    const diff = new THREE.Vector3().subVectors(p2.position, p1.position);
    const currentDistance = diff.length();
    if (currentDistance === 0) return; // Prevent division by zero

    const correction = diff.multiplyScalar(1 - distance / currentDistance);
    const correctionHalf = correction.multiplyScalar(0.5);
    p1.position.add(correctionHalf);
    p2.position.sub(correctionHalf);
}
  
// Set up the scene, camera, and renderer
const windowHeight = 800;
const windowWidth = 800;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, windowWidth / windowHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(windowWidth, windowHeight);
renderer.setClearColor(0xffffff);
document.getElementById("renderer").appendChild(renderer.domElement);

const controls = new OrbitControls( camera, renderer.domElement );

// Add a white ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 1, 100);
pointLight.position.set(0, 10, 0);
scene.add(pointLight);

const pointLight2 = new THREE.PointLight(0xffffff, 1, 100);
pointLight2.position.set(0, -10, 0);
scene.add(pointLight2);

// Create the cloth geometry
const clothWidth = 10;
const clothHeight = 10;
const numParticlesWidth = 20;
const numParticlesHeight = 20;
const clothGeometry = new THREE.BufferGeometry();

const particles = [];
const vertices = [];
const indices = [];
const textureUVs = [];

let sphere;
const ballSize = 2; 
let ballPosition = new THREE.Vector3(0, -45, 0);

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

        textureUVs.push(v/numParticlesHeight, u/numParticlesWidth);
    }
}


clothGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
clothGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(textureUVs, 2));
clothGeometry.setIndex(indices);

const texture = new THREE.TextureLoader().load( "textures/square_pattern.avif");

// Create the cloth material
const clothMaterial = new THREE.MeshBasicMaterial({ map: texture, wireframe: false });
clothMaterial.side = THREE.DoubleSide; // Show both sides of the cloth

// Create the cloth mesh
const clothMesh = new THREE.Mesh(clothGeometry, clothMaterial, 
);
scene.add(clothMesh);

let ballGeo = new THREE.SphereGeometry(ballSize, 32, 16);
let ballMaterial = new THREE.MeshBasicMaterial({color:0xff0000});

sphere = new THREE.Mesh(ballGeo, ballMaterial);
sphere.castShadow = true;
sphere.receiveShadow = true;
sphere.visible = true;
scene.add(sphere);

camera.position.set(20, 5, -15); // Update the camera position for a diagonal point of view
camera.lookAt(scene.position);
controls.update();

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

        // if ((i === 0 || i === numParticlesWidth - 1) && particles[i].position.y === particles[i].original.y) {
        //     // Skip force application and integration for the top two corners
        //     continue;
        // }

        particle.force.copy(gravity).multiplyScalar(particle.mass);
        if (windEnabled) {
            particle.force.add(windForce);
        }
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
                    satisfyDistanceConstraints(particles[index], particles[index - 1], clothWidth / (numParticlesWidth - 1));
                }

                if (v > 0) {
                    satisfyDistanceConstraints(particles[index], particles[index - numParticlesWidth], clothHeight / (numParticlesHeight - 1));
                }
                if (v == 0 && (!pointAttached || (u == 0 || u == numParticlesWidth - 1))) {
                    const particle = particles[index];
                    particle.position.copy(particle.original);
                    particle.previous.copy(particle.original);
                }
            }
        }
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

    controls.update();

    renderer.render(scene, camera);
}

animate();

function updateTexture(radioButton) {
    const newTexture = new THREE.TextureLoader().load(TEXTURES[radioButton]);
    clothMaterial.map = newTexture;

    clothMesh.material.map.needsUpdate = true;
    clothMesh.material.needsUpdate = true;
}

function updateWind(wind) {
    windEnabled = wind;
}

function updateAttached(attached) {
    pointAttached = attached;
}

const textureButtons = document.querySelectorAll('input[name="texture"]');
for (let i = 0; i < textureButtons.length; i++) {
  textureButtons[i].addEventListener('change', () => updateTexture(i));
}

const windButtons = document.querySelectorAll('input[name="wind"]');
for (let i = 0; i < windButtons.length; i++) {
  windButtons[i].addEventListener('change', () => updateWind(i == 0));
}

const attachedButtons = document.querySelectorAll('input[name="attached"]');
for (let i = 0; i < attachedButtons.length; i++) {
  attachedButtons[i].addEventListener('change', () => updateAttached(i == 0));
}