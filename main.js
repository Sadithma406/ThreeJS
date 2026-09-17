import * as THREE from "three";
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let character = null;
let mixer = null;
const actions = {};
let activeAction = null;

const clock = new THREE.Clock();
const container = document.getElementById('container');
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

// Ground Plane
const texture = new THREE.TextureLoader().load('assets/grass-bg.jpeg');
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;
texture.repeat.set(20, 20);
const geometry = new THREE.PlaneGeometry(100, 100);
const material = new THREE.MeshBasicMaterial({ map: texture });
const background = new THREE.Mesh(geometry, material);
background.rotation.x = -Math.PI / 2;
scene.add(background);

scene.background = new THREE.Color(0x87ceeb);

// Character Loading
const loader = new GLTFLoader();
loader.load('assets/charactor-with-animations.glb', function (gltf) {
  character = gltf.scene;
  character.traverse((child) => {
    const oldMaterial = child.material;
    if (child.isMesh) {
      child.material = new THREE.MeshBasicMaterial({
        map: oldMaterial.map,
        color: oldMaterial.color,
      });
    }
  });
  character.scale.set(3.2, 3.2, 3.2);
  character.position.set(0, 0, 0);
  scene.add(character);

  if (gltf.animations && gltf.animations.length > 0) {
    mixer = new THREE.AnimationMixer(character);
    actions['stationary'] = mixer.clipAction(gltf.animations[3]);
    actions['walking'] = mixer.clipAction(gltf.animations[1]);
  }
  activeAction = actions['stationary'];
  if (activeAction) activeAction.play();
},
  undefined, function (error) {
    console.error("Error loading GLTF model:", error);
  }
);

let isKeyPressed = false;
window.addEventListener('keydown', () => {
  isKeyPressed = true;
});

window.addEventListener('keyup', () => {
  isKeyPressed = false;
});

function fadeToAction(name, duration = 0.2) {
  const previousAction = activeAction;
  const nextAction = actions[name];

  if (previousAction !== nextAction && nextAction) {
    if (previousAction) previousAction.fadeOut(duration);
    nextAction.reset().fadeIn(duration).play();
    activeAction = nextAction;
  }
}
const moveSpeed = 5.0;
const moveDirection = new THREE.Vector3();
const targetCameraPos = new THREE.Vector3();

function updateCharacter(delta) {
  if (!character) return;

  moveDirection.set(0, 0, 0);

  if (isKeyPressed) {
    fadeToAction('walking');
    moveDirection.z -= 1;
    character.position.addScaledVector(moveDirection, moveSpeed * delta);
  } else {
    fadeToAction('stationary');
  }

  targetCameraPos.set(
    character.position.x,
    character.position.y + 2,
    character.position.z + 4
  );
  camera.position.lerp(targetCameraPos, 0.1);
  camera.lookAt(character.position.x, character.position.y + 2, character.position.z);

}

function animate() {
  const delta = clock.getDelta();
  if (mixer) mixer.update(delta);
  updateCharacter(delta);

  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);