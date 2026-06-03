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

Upload the **contents of the `dist/` folder** after `npm run build` (not the raw repo root). GitHub Actions or the `gh-pages` branch should publish **`dist/`** only.

`vite.config.js` sets `base: '/cse160-assignment5/'` to match  
`https://dvo7.github.io/cse160-assignment5/` — if you rename the repo, update `base` to `'/YourRepoName/'`.

## Local dev (with this `base`)

After changing `base` to your repo path, open:

`http://localhost:5173/cse160-assignment5/`

(or run `npm run dev` and use the URL Vite prints).

## Canvas submission

Zip the **entire project** (including `node_modules` only if your instructor asks — usually exclude `node_modules` and run `npm install` from the README). Typical name: `Derrick_Vo_Assignment_5.zip`.

## Live link

After deployment, paste the **public URL** as a **comment** on your Canvas submission.

## Model credit

`Parrot.glb` is from the [three.js examples](https://github.com/mrdoob/three.js/tree/master/examples/models/gltf) (MIT license).
