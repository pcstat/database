#!/usr/bin/env node
/**
 * Rewrites every URL in database.json so it points at a new public address of this repo.
 * Use it once when the database moves to its real Cloudflare Pages domain:
 *
 *   pnpm set-base-url https://data.example.org
 *
 * Nothing else needs to change — executives.json (and the other data files) only hold
 * paths that are relative to this base.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const base = process.argv[2]?.replace(/\/+$/, "");
if (!base || !/^https?:\/\/.+/.test(base)) {
  console.error("Usage: pnpm set-base-url https://your-database.pages.dev");
  process.exit(1);
}

const file = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../database.json");
const index = JSON.parse(fs.readFileSync(file, "utf8"));
for (const key of Object.keys(index)) {
  index[key] = key === "imageBase" ? `${base}/photos/` : `${base}/${key}.json`;
}
fs.writeFileSync(file, JSON.stringify(index, null, 2) + "\n");
console.log(`database.json now points at ${base}`);
