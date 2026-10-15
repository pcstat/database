#!/usr/bin/env node
/**
 * Stages exactly the files that are published on Cloudflare Pages into ./dist.
 *
 *   node scripts/build-dist.mjs          (or: pnpm build)
 *
 * Published: database.json, the data files it lists, _headers, members/ and photos/.
 * Never published: scripts, workflows, README, package.json, .claude/ …
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");

const index = JSON.parse(fs.readFileSync(path.join(ROOT, "database.json"), "utf8"));
const files = ["database.json", "_headers", ...Object.entries(index).filter(([k]) => k !== "imageBase").map(([, v]) => v)];
const folders = ["members", index.imageBase.replace(/\/+$/, "")];

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

for (const file of files) {
  if (!fs.existsSync(path.join(ROOT, file))) {
    console.error(`Missing file: ${file}`);
    process.exit(1);
  }
  fs.copyFileSync(path.join(ROOT, file), path.join(DIST, file));
}
for (const folder of folders) {
  if (fs.existsSync(path.join(ROOT, folder))) fs.cpSync(path.join(ROOT, folder), path.join(DIST, folder), { recursive: true });
}

const count = (dir) => fs.readdirSync(dir, { withFileTypes: true }).reduce((n, e) => n + (e.isDirectory() ? count(path.join(dir, e.name)) : 1), 0);
console.log(`Staged ${count(DIST)} files in dist/`);
