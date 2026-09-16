import * as THREE from "three";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let number = 0;

const container = document.getElementById('container');
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement);

camera.position.z = 8;

const clock = new THREE.Clock();
let mixer;

const loader = new GLTFLoader();
loader.load('assets/charactor-with-animations.glb', function (gltf) {
  const model = gltf.scene;

  model.traverse((child) => {
    if (child.isMesh && child.material) {
      const oldMesh = child.material;
      child.material = new THREE.MeshBasicMaterial({
        color: oldMesh.color,
        map: oldMesh.map,
        transparent: oldMesh.transparent,
      });
    }
  });

  model.scale.set(1.2, 1.2, 1.2);
  model.position.set(2, -0.5, 0);
  scene.add(model);

  if (gltf.animations && gltf.animations.length > 0) {
    document.getElementById('h').innerText = gltf.animations.length;
    mixer = new THREE.AnimationMixer(model);
    mixer.clipAction(gltf.animations[number]).play();
    number++;
    setInterval(() => {
      mixer.stopAllAction();
      if (number >= gltf.animations.length) {
        number = 0;
      }
      mixer.clipAction(gltf.animations[number]).play();
      number++;
    }, 5000);
  }
},
  undefined, function (error) {
    console.error(error);
  }
);

function animate(time) {
  const delta = clock.getDelta();
  if (mixer) mixer.update(delta);

  controls.update();
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);