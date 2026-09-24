import * as THREE from "three";
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let character = null;
let mixer = null;
const actions = {};
let activeAction = null;

const clock = new THREE.Clock();
const container = document.getElementById('container');
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 4, 8);
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

// OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 2, 0);

let isPointerLocked = false;
const spherical = new THREE.Spherical();

renderer.domElement.addEventListener('click', () => {
  if (!isPointerLocked) {
    renderer.domElement.requestPointerLock();
  }
});

document.addEventListener('pointerlockchange', () => {
  isPointerLocked = (document.pointerLockElement === renderer.domElement);
  controls.enabled = !isPointerLocked;
});

document.addEventListener('mousemove', (e) => {
  if (isPointerLocked) {
    const move = camera.position.clone().sub(controls.target);
    spherical.setFromVector3(move);
    spherical.theta -= e.movementX * 0.002;
    spherical.phi -= e.movementY * 0.002; 
    move.setFromSpherical(spherical);
    camera.position.copy(controls.target).add(move);
    camera.lookAt(controls.target);
  }
});

scene.background = new THREE.Color(0x87ceeb);

// Ground Plane with Standard Material (responds to 3D lighting & shadows)
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
    actions['running'] = mixer.clipAction(gltf.animations[2]);
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
}, undefined, function (error) {
  console.error("Error loading GLTF model:", error);
});

// Controls & Keyboard Input
const keys = {
  space: false,
  forward: false,
  backward: false,
  left: false,
  right: false,
  shift: false
};

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
  if ( e.key === "Shift" || e.key === "ShiftLeft" || e.key === "ShiftRight") {
    keys.shift = true;
  }
  if (keys.right || keys.left || keys.forward || keys.backward) {
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
  if ( e.key === "Shift" || e.key === "ShiftLeft" || e.key === "Shift Right") {
    keys.shift = false;
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

function updateCharacter(delta, keys) {
  if (!character) return;
  moveDirection.set(0, 0, 0);
  if (keys.space) {
    fadeToAction('hit');
  }
  else if (keys.shift && (keys.forward || keys.backward || keys.left || keys.right)) {
    fadeToAction('running');
    moveCharacter(keys, delta);
    character.position.addScaledVector(moveDirection, moveSpeed * 3 * delta);
  }
  else if (keys.forward || keys.backward || keys.left || keys.right) {
    fadeToAction('walking');
    moveCharacter(keys, delta);
    character.position.addScaledVector(moveDirection, moveSpeed * delta);
  } else {
    fadeToAction('stationary');
  }
  updateCamera();
}

const charTarget = new THREE.Vector3();

function updateCamera() {
  if (!character) return;
  charTarget.set(character.position.x, character.position.y + 2, character.position.z);
  const delta = charTarget.clone().sub(controls.target);
  camera.position.add(delta);
  controls.target.copy(charTarget);
}

const cameraForward = new THREE.Vector3();
const cameraRight = new THREE.Vector3();

function moveCharacter(keys, delta) {
  camera.getWorldDirection(cameraForward);
  cameraForward.y = 0;
  cameraForward.normalize();

  cameraRight.crossVectors(cameraForward, new THREE.Vector3(0, 1, 0)).normalize();

  if (keys.forward) moveDirection.add(cameraForward);
  if (keys.backward) moveDirection.sub(cameraForward);
  if (keys.right) moveDirection.add(cameraRight);
  if (keys.left) moveDirection.sub(cameraRight);

  if (moveDirection.lengthSq() > 0) {
    moveDirection.normalize();
    const targetAngle = Math.atan2(moveDirection.x, moveDirection.z);
    let diff = targetAngle - character.rotation.y;
    if (diff < -Math.PI) diff += Math.PI * 2;
    if (diff > Math.PI) diff -= Math.PI * 2;
    character.rotation.y += diff * Math.min(delta * 12, 1);
  }
}
function animate() {
  const delta = clock.getDelta();
  if (mixer) mixer.update(delta);
  updateCharacter(delta, keys);

  // Update OrbitControls
  controls.update();

  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);
