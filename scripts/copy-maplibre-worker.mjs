// MapLibre runs in a Web Worker. Bundling moves maplibre-gl away from its
// worker file, so a copy is served from /public and passed to setWorkerUrl().
// Runs before `dev` and `build` so the copy always matches the installed version.
import { copyFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
const require = createRequire(import.meta.url);
const dist = dirname(require.resolve("maplibre-gl/dist/maplibre-gl.css"));
copyFileSync(
  join(dist, "maplibre-gl-worker.mjs"),
  join(import.meta.dirname, "..", "public", "maplibre-gl-worker.mjs"),
);
