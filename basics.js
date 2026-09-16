import * as THREE from "three";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';



const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement);
const fontLoader = new FontLoader();
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

fontLoader.load(
  'https://cdn.jsdelivr.net/npm/three@0.149.0/examples/fonts/helvetiker_regular.typeface.json',
  (font) => {
    const textGeo = new TextGeometry('Hello World', {
      font: font,
      size: 1,
      height: 0.02,
      depth: 0.02,
      curveSegments: 12,
    });

    textGeo.center();
    const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const textMesh = new THREE.Mesh(textGeo, textMaterial);
    textMesh.position.y = 2;
    scene.add(textMesh);
  }
);
const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff42ff });
const points = [];
points.push(new THREE.Vector3(-10, 0, 0));
points.push(new THREE.Vector3(0, 10, 0));
points.push(new THREE.Vector3(10, 0, 0));
const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
const line = new THREE.Line(lineGeometry, lineMaterial);
scene.add(line);
camera.position.z = 8;

const loader = new GLTFLoader();
loader.load('assets/gal-b-lantern-4120.glb', function (gltf) {
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
  })
  model.scale.set(2.8, 2.8, 2.8);
  model.position.set(2, -0.5, 0);
  scene.add(model);
},
  undefined, function (error) {
    console.error(error);
  }
);
function animate(time) {
  controls.update();
  cube.rotation.x = time / 2000;
  cube.rotation.y = time / 1000;
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);