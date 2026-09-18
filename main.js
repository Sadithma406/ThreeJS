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
    actions['hit'] = mixer.clipAction(gltf.animations[4]);
    actions['hit'].setLoop(THREE.LoopOnce);
    actions['hit'].clampWhenFinished = true;
    
  }
  activeAction = actions['stationary'];
  if (activeAction) activeAction.play();

  mixer.addEventListener('finished', function (e) {
    if (e.action === actions['hit']) {
      keys.space = false;
    }
  });
},
  undefined, function (error) {
    console.error("Error loading GLTF model:", error);
  }
);
const keys = {
  space: false,
  forward: false,
  backward: false,
  left: false,
  right: false
}
window.addEventListener('keydown', (e) => {
  if (e.code === "Space") {
    keys.space = true;
  }
  if (e.key === "w" || e.code == "ArrowUp" || e.key === "W") {
    keys.forward = true;
  }
  if (e.key === "s" || e.code == "ArrowDown" || e.key === "S") {
    keys.backward = true;
  }
  if (e.key === "a" || e.code == "ArrowLeft" || e.key === "A") {
    keys.left = true;
  }
  if (e.key === "d" || e.code == "ArrowRight" || e.key === "D") {
    keys.right = true;
  }
  if(keys.right || keys.left || keys.forward || keys.backward){
    keys.space = false;
  }
});

window.addEventListener('keyup', (e) => {
  if (e.key === "w" || e.code == "ArrowUp" || e.key === "W") {
    keys.forward = false;
  }
  if (e.key === "s" || e.code == "ArrowDown" || e.key === "S") {
    keys.backward = false;
  }
  if (e.key === "a" || e.code == "ArrowLeft" || e.key === "A") {
    keys.left = false;
  }
  if (e.key === "d" || e.code == "ArrowRight" || e.key === "D") {
    keys.right = false;
  }
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

function updateCharacter(delta, keys) {
  if (!character) return;
  moveDirection.set(0, 0, 0);
  if (keys.space) {
    fadeToAction('hit');
  } else if (keys.forward || keys.backward || keys.left || keys.right) {
    fadeToAction('walking');
    moveCharacter(keys);
    character.position.addScaledVector(moveDirection, moveSpeed * delta);
  } else {
    fadeToAction('stationary');
  }
  updateCamera();
}

function updateCamera() {
  targetCameraPos.set(
    character.position.x,
    character.position.y + 2,
    character.position.z + 7
  );
  camera.position.lerp(targetCameraPos, 0.05);
  camera.lookAt(character.position.x, character.position.y + 2, character.position.z);
}

function moveCharacter(keys) {
  if (keys.forward) {
    character.rotation.y = Math.PI;
    moveDirection.z -= 1;
  }
  if (keys.backward) {
    character.rotation.y = 0;
    moveDirection.z += 1;
  }
  if (keys.left) {
    character.rotation.y = -Math.PI / 2;
    moveDirection.x -= 1;
  }
  if (keys.right) {
    character.rotation.y = Math.PI / 2;
    moveDirection.x += 1;
  }
}
function animate() {
  const delta = clock.getDelta();
  if (mixer) mixer.update(delta);
  updateCharacter(delta, keys);

  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);