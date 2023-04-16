import * as THREE from 'https://unpkg.com/three/build/three.module.js';

let scene;
let camera;
let renderer; 

let rest = 25;
let xSegs = 60;
let ySegs = 20;

// Tutorial geometry
// const geometry = new THREE.BoxGeometry( 1, 1, 1 );
// const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
// const cube = new THREE.Mesh( geometry, material );
// scene.add( cube );

let clothGeometry;
let clothFunction = plane(rest * xSegs, rest * ySegs)
let cloth = new Cloth(xSegs, ySegs);

function Cloth(w, h) {
	this.w = w;
	this.h = h;
}

function plane(width, height) {

	return function(u, v) {
		let x = (u - 0.5) * width;
		let y = (v + 0.5) * height;

		return new THREE.Vector3(x, y, 0);
	};

}

function init() {
    // TODO: Make sure to change the top variables so that they are initialized here
    //       instead
    // TODO: Custom parameters to match what we want
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.x = 5;
    camera.position.z = 1500;
    scene.add(camera);

    clothGeometry = new THREE.ParametricGeometry(clothFunction, cloth.w, cloth.h)
    clothGeometry.dynamic = true;

    clothObject = new THREE.Mesh(clothGeometry, material);
    clothObject.position.set(0, 50, 0);
    scene.add(clothObject);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
}


function animate() {
	requestAnimationFrame( animate );
    camera.lookAt( scene.position );
	renderer.render( scene, camera );
} 

init();
animate();
