# Assignment 5 — Three.js (Derrick Vo)

Interactive **tropical dusk plaza**: 24+ primitive meshes, textured GLB (`public/models/Parrot.glb`), procedural skybox, four light types, OrbitControls, and **UnrealBloomPass** glow on emissive crystals (**press `B`** to toggle bloom — wow feature, also described in the on-page HUD).

## Run locally

```bash
npm install
npm run dev
```

## Build (for GitHub Pages or static hosting)

```bash
npm run build
```

Upload the contents of the `dist/` folder to your host (e.g. GitHub Pages from `/docs` or the `gh-pages` branch).  
`vite.config.js` uses `base: './'` so relative URLs work on project pages.

## Canvas submission

Zip the **entire project** (including `node_modules` only if your instructor asks — usually exclude `node_modules` and run `npm install` from the README). Typical name: `Derrick_Vo_Assignment_5.zip`.

## Live link

After deployment, paste the **public URL** as a **comment** on your Canvas submission.

## Model credit

`Parrot.glb` is from the [three.js examples](https://github.com/mrdoob/three.js/tree/master/examples/models/gltf) (MIT license).
