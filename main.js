/**
 * CSE 160 — Assignment 5 (Three.js)
 *
 * Requirement checklist (see also on-page HUD in index.html):
 * - 20+ primary shapes: 10 boxes, 6 spheres, 4 cylinders, 1 cone, 1 torus, 1 torus knot,
 *   1 dodecahedron = 24 primitives, plus 1 textured GLB (Parrot.glb) = 25 scene objects.
 * - Three+ shape kinds: box, sphere, cylinder, cone, torus, torus knot, dodecahedron.
 * - Textured primitives: checker floor plane, multi-face textured cube, canvas-striped cube.
 * - Animated: rotating torus knot, bobbing crystal group, orbiting point light, slow plaza spin.
 * - Lights (4 kinds): AmbientLight, DirectionalLight, HemisphereLight, PointLight.
 * - Textured skybox: CubeTexture from 6 procedural canvas faces.
 * - Perspective camera + OrbitControls.
 *
 * Wow feature: UnrealBloomPass post-processing on emissive crystals; press B to toggle.
 */
import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const BASE = import.meta.env.BASE_URL;

function makeCanvasTexture(drawFn, size = 256) {
	const canvas = document.createElement('canvas');
	canvas.width = size;
	canvas.height = size;
	const ctx = canvas.getContext('2d');
	drawFn(ctx, size);
	const tex = new THREE.CanvasTexture(canvas);
	tex.colorSpace = THREE.SRGBColorSpace;
	tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
	return tex;
}

function checkerTexture(c1, c2, repeats = 8) {
	return makeCanvasTexture((ctx, s) => {
		const cell = s / repeats;
		for (let y = 0; y < repeats; y++) {
			for (let x = 0; x < repeats; x++) {
				ctx.fillStyle = (x + y) % 2 === 0 ? c1 : c2;
				ctx.fillRect(x * cell, y * cell, cell + 0.5, cell + 0.5);
			}
		}
	}, 512);
}

function stripeTexture(c1, c2, bands = 16) {
	return makeCanvasTexture((ctx, s) => {
		const h = s / bands;
		for (let i = 0; i < bands; i++) {
			ctx.fillStyle = i % 2 === 0 ? c1 : c2;
			ctx.fillRect(0, i * h, s, h + 0.5);
		}
	}, 256);
}

/** Six cubemap faces (px, nx, py, ny, pz, nz) — procedural “tropical dusk” gradients */
function buildSkyCubeTexture() {
	const W = 512;
	const makeFace = (opts) => {
		const c = document.createElement('canvas');
		c.width = W;
		c.height = W;
		const g = c.getContext('2d');
		const grd = g.createLinearGradient(0, 0, 0, W);
		grd.addColorStop(0, opts.top);
		grd.addColorStop(0.45, opts.mid);
		grd.addColorStop(1, opts.bottom);
		g.fillStyle = grd;
		g.fillRect(0, 0, W, W);
		// subtle stars
		g.fillStyle = 'rgba(255,255,255,0.35)';
		for (let i = 0; i < 80; i++) {
			const sx = Math.random() * W;
			const sy = Math.random() * W * 0.55;
			g.fillRect(sx, sy, 1.2, 1.2);
		}
		const tex = new THREE.CanvasTexture(c);
		tex.colorSpace = THREE.SRGBColorSpace;
		return tex;
	};

	const palette = (shift) => ({
		top: `hsl(${220 + shift}, 55%, 18%)`,
		mid: `hsl(${28 + shift}, 70%, 42%)`,
		bottom: `hsl(${265 + shift}, 35%, 22%)`,
	});

	const faces = [
		makeFace(palette(0)),
		makeFace(palette(4)),
		makeFace({ top: '#0a1028', mid: '#2a4a88', bottom: '#f07830' }),
		makeFace({ top: '#1a1030', mid: '#3a2060', bottom: '#281018' }),
		makeFace(palette(-6)),
		makeFace(palette(8)),
	];

	return new THREE.CubeTexture(faces);
}

const scene = new THREE.Scene();
scene.background = buildSkyCubeTexture();

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(18, 12, 22);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI * 0.495;
controls.target.set(0, 2, 0);

// ---- Four distinct light types (assignment: at least three) ----
scene.add(new THREE.AmbientLight(0x6a7cff, 0.22));

const hemi = new THREE.HemisphereLight(0xaaccff, 0x402010, 0.55);
hemi.position.set(0, 40, 0);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xffe0c8, 1.25);
sun.position.set(-22, 28, 12);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 2;
sun.shadow.camera.far = 90;
sun.shadow.camera.left = -35;
sun.shadow.camera.right = 35;
sun.shadow.camera.top = 35;
sun.shadow.camera.bottom = -35;
scene.add(sun);

const point = new THREE.PointLight(0x66ffee, 2.2, 60, 2);
point.position.set(8, 6, 8);
point.castShadow = false;
scene.add(point);

// ---- Ground ----
const groundMat = new THREE.MeshStandardMaterial({
	map: checkerTexture('#1e2a44', '#2d4a6a', 24),
	roughness: 0.85,
	metalness: 0.05,
});
const ground = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// ---- Materials shared / instanced ----
const cubeFaceMats = [
	new THREE.MeshStandardMaterial({ map: checkerTexture('#8b4513', '#deb887', 6) }),
	new THREE.MeshStandardMaterial({ map: checkerTexture('#2e8b57', '#90ee90', 6) }),
	new THREE.MeshStandardMaterial({ map: stripeTexture('#4169e1', '#87ceeb', 12) }),
	new THREE.MeshStandardMaterial({ map: checkerTexture('#c04040', '#ffb4b4', 8) }),
	new THREE.MeshStandardMaterial({ map: stripeTexture('#ffd700', '#ff8c00', 10) }),
	new THREE.MeshStandardMaterial({ map: checkerTexture('#444', '#aaa', 10) }),
];

const phongGreen = new THREE.MeshPhongMaterial({ color: 0x3cb371, shininess: 70 });
const phongGold = new THREE.MeshPhongMaterial({ color: 0xd4af37, shininess: 90 });
const stdStone = new THREE.MeshStandardMaterial({ color: 0x8899aa, roughness: 0.6, metalness: 0.1 });

// ---- Layout: 10 cubes ----
for (let i = 0; i < 10; i++) {
	const angle = (i / 10) * Math.PI * 2;
	const r = 10 + (i % 3) * 1.2;
	const mesh = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.6 + (i % 4) * 0.25, 1.2), cubeFaceMats);
	mesh.position.set(Math.cos(angle) * r, 0.8, Math.sin(angle) * r);
	mesh.castShadow = mesh.receiveShadow = true;
	scene.add(mesh);
}

// ---- 6 spheres ----
const sphereGroup = new THREE.Group();
for (let i = 0; i < 6; i++) {
	const m = new THREE.Mesh(
		new THREE.SphereGeometry(0.55 + (i % 3) * 0.12, 28, 24),
		i % 2 === 0 ? phongGreen : phongGold,
	);
	const a = (i / 6) * Math.PI * 2;
	m.position.set(Math.cos(a) * 4.5, 3.2 + i * 0.35, Math.sin(a) * 4.5);
	m.castShadow = true;
	sphereGroup.add(m);
}
scene.add(sphereGroup);

// ---- 4 cylinders ----
for (let i = 0; i < 4; i++) {
	const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 4.5, 16), stdStone);
	mesh.position.set(-6 + i * 4, 2.25, -8);
	mesh.castShadow = mesh.receiveShadow = true;
	scene.add(mesh);
}

// ---- cone, torus, torus knot, dodecahedron ----
const cone = new THREE.Mesh(new THREE.ConeGeometry(1.1, 2.8, 20), phongGold);
cone.position.set(-10, 1.4, 6);
cone.castShadow = true;
scene.add(cone);

const torus = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.35, 16, 40), phongGreen);
torus.position.set(10, 1.3, 4);
torus.rotation.x = Math.PI / 2.2;
torus.castShadow = true;
scene.add(torus);

const torusKnot = new THREE.Mesh(
	new THREE.TorusKnotGeometry(0.9, 0.28, 120, 16),
	new THREE.MeshStandardMaterial({ color: 0x8844cc, metalness: 0.35, roughness: 0.35 }),
);
torusKnot.position.set(0, 3.8, -6);
torusKnot.castShadow = true;
scene.add(torusKnot);

const dodec = new THREE.Mesh(new THREE.DodecahedronGeometry(1.1, 0), stdStone);
dodec.position.set(-12, 1.1, -4);
dodec.castShadow = true;
scene.add(dodec);

// ---- Striped cube (extra textured primitive) ----
const stripeCube = new THREE.Mesh(
	new THREE.BoxGeometry(1.4, 1.4, 1.4),
	new THREE.MeshStandardMaterial({ map: stripeTexture('#222', '#ff6699', 14), roughness: 0.45 }),
);
stripeCube.position.set(6, 0.9, -10);
stripeCube.castShadow = true;
scene.add(stripeCube);

// ---- Emissive “crystals” for bloom wow ----
const crystalGroup = new THREE.Group();
const crystalGeo = new THREE.OctahedronGeometry(0.45, 0);
const crystalMat = new THREE.MeshStandardMaterial({
	color: 0x111122,
	emissive: new THREE.Color(0xff33aa),
	emissiveIntensity: 3.2,
	metalness: 0.9,
	roughness: 0.15,
});
for (let i = 0; i < 5; i++) {
	const c = new THREE.Mesh(crystalGeo, crystalMat.clone());
	c.material.emissive = new THREE.Color().setHSL(0.85 + i * 0.04, 1, 0.55);
	c.material.emissiveIntensity = 3.5;
	c.position.set(Math.cos(i) * 2.2, 2.4 + i * 0.25, Math.sin(i) * 2.2);
	c.castShadow = true;
	crystalGroup.add(c);
}
crystalGroup.position.set(-4, 0, 4);
scene.add(crystalGroup);

// ---- GLB model ----
const loader = new GLTFLoader();
loader.load(
	`${BASE}models/Parrot.glb`,
	(gltf) => {
		const root = gltf.scene;
		root.traverse((o) => {
			if (o.isMesh) {
				o.castShadow = true;
				o.receiveShadow = true;
			}
		});
		const box = new THREE.Box3().setFromObject(root);
		const size = new THREE.Vector3();
		box.getSize(size);
		const scale = 3.2 / Math.max(size.x, size.y, size.z);
		root.scale.setScalar(scale);
		root.position.set(12, 2.1, -6);
		root.rotation.y = -0.9;
		scene.add(root);
	},
	undefined,
	(err) => {
		console.warn('Parrot.glb load failed (check deploy path /models/Parrot.glb):', err);
	},
);

// ---- Post-processing (bloom) ----
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomResolution = new THREE.Vector2(window.innerWidth, window.innerHeight);
const bloomPass = new UnrealBloomPass(bloomResolution, 0.85, 0.35, 0.82);
composer.addPass(bloomPass);

const outputPass = new OutputPass();
composer.addPass(outputPass);

let bloomEnabled = true;

window.addEventListener('keydown', (e) => {
	if (e.key === 'b' || e.key === 'B') {
		bloomEnabled = !bloomEnabled;
	}
});

window.addEventListener('resize', () => {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
	composer.setSize(window.innerWidth, window.innerHeight);
});

const timer = new THREE.Timer();
timer.connect(document);

function animate(now) {
	requestAnimationFrame(animate);
	timer.update(now);
	const t = timer.getElapsed();

	controls.update();

	torusKnot.rotation.x = t * 0.55;
	torusKnot.rotation.y = t * 0.72;

	sphereGroup.rotation.y = t * 0.15;
	for (let i = 0; i < sphereGroup.children.length; i++) {
		const m = sphereGroup.children[i];
		m.position.y = 3.2 + i * 0.35 + Math.sin(t * 1.4 + i) * 0.25;
	}

	crystalGroup.children.forEach((mesh, i) => {
		mesh.rotation.y = t * (0.8 + i * 0.07);
		mesh.position.y = 2.4 + i * 0.25 + Math.sin(t * 2 + i) * 0.12;
	});

	point.position.x = Math.cos(t * 0.9) * 12;
	point.position.z = Math.sin(t * 0.9) * 12;
	point.position.y = 5 + Math.sin(t * 1.1) * 1.5;

	cone.rotation.y = t * 0.4;
	torus.rotation.z = t * 0.35;
	dodec.rotation.set(t * 0.2, t * 0.31, 0);
	stripeCube.rotation.y = t * 0.5;

	if (bloomEnabled) {
		composer.render();
	} else {
		renderer.render(scene, camera);
	}
}

animate();
