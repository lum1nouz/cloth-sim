class Particle {
	constructor(position) {
	  this.position = position.clone();
	  this.previousPosition = position.clone();
	  this.originalPosition = position.clone();
	  this.acceleration = new THREE.Vector3(0, -9.81, 0);
	  this.mass = 1;
	}
  
	applyForce(force) {
	  this.acceleration.add(force.clone().divideScalar(this.mass));
	}
  
	integrate(timeStep) {
	  const newPosition = this.position.clone().multiplyScalar(2).sub(this.previousPosition).add(this.acceleration.clone().multiplyScalar(timeStep * timeStep));
	  this.previousPosition = this.position;
	  this.position = newPosition;
	  this.acceleration.set(0, -9.81, 0);
	}
  }
  
  const distanceConstraint = (p1, p2, distance) => {
	const currentDistance = p1.position.distanceTo(p2.position);
	const correction = (currentDistance - distance) / currentDistance;
	const correctionVector = p2.position.clone().sub(p1.position).multiplyScalar(correction * 0.5);
	p1.position.add(correctionVector);
	p2.position.sub(correctionVector);
  };
  
  const createClothParticles = (width, height, segmentsX, segmentsY) => {
	const particles = [];
	const widthStep = width / segmentsX;
	const heightStep = height / segmentsY;
  
	for (let y = 0; y <= segmentsY; y++) {
	  for (let x = 0; x <= segmentsX; x++) {
		const position = new THREE.Vector3(x * widthStep - width / 2, height / 2 - y * heightStep, 0);
		particles.push(new Particle(position));
	  }
	}
  
	return particles;
  };
  
  const updateClothGeometry = (particles, geometry) => {
	const vertices = geometry.attributes.position.array;
  
	for (let i = 0, j = 0; i < particles.length; i++, j += 3) {
	  vertices[j] = particles[i].position.x;
	  vertices[j + 1] = particles[i].position.y;
	  vertices[j + 2] = particles[i].position.z;
	}
  
	geometry.attributes.position.needsUpdate = true;
	geometry.computeVertexNormals();
  };
  
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  
  const clothGeometry = new THREE.PlaneBufferGeometry(5, 5, 32, 32);
  const clothMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
  const cloth = new THREE.Mesh(clothGeometry, clothMaterial);
  scene.add(cloth);
  
  const particles = createClothParticles(5, 5, 32, 32);
  particles[0].mass = 0; // Pin the top-left corner
  particles[32].mass = 0; // Pin the top-right corner
  
  camera.position.z = 10;
  
  const timeStep = 1/60;
  const constraintIterations = 10;

const animate = () => {
  requestAnimationFrame(animate);

  for (let i = 0; i < particles.length; i++) {
    particles[i].integrate(timeStep);
  }

  for (let i = 0; i < constraintIterations; i++) {
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 32; x++) {
        const index = y * 33 + x;
        const indexRight = y * 33 + x + 1;
        const indexDown = (y + 1) * 33 + x;

        distanceConstraint(particles[index], particles[indexRight], 5 / 32);
        distanceConstraint(particles[index], particles[indexDown], 5 / 32);
      }
    }
  }

  updateClothGeometry(particles, clothGeometry);
  renderer.render(scene, camera);
};

animate();





  