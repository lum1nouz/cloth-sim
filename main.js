import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

var clothGeometry;

// Tutorial geometry
const geometry = new THREE.BoxGeometry( 1, 1, 1 );
const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
const cube = new THREE.Mesh( geometry, material );
scene.add( cube );

camera.position.z = 5;

function animate() {
	requestAnimationFrame( animate );

	renderer.render( scene, camera );
}

function plane(width, height) {

	return function(u, v) {

		var x = (u - 0.5) * width;
		var y = (v + 0.5) * height;

		return new THREE.Vector3( x, y, 0 );

	};

}

function init() {
    // TODO: Make sure to change the top variables so that they are initialized here
    //       instead
    // TODO: Custom parameters to match what we want
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

    clothGeometry = new THREE.ParametricGeometry()
    clothGeometry.dynamic = true;
}


animate();

