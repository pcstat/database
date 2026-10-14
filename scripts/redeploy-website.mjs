#!/usr/bin/env node
/**
 * Asks Cloudflare Pages to rebuild the website after the database changed.
 *
 * The website is a static export: list pages (executives, projects, events, …) are built from
 * this database at build time, which is what makes them fully indexable by search engines.
 * So every content change — from the admin panel or a manual commit — must trigger a rebuild.
 *
 * To avoid the website building against stale data, this script first waits until the
 * published database site (Cloudflare Pages) serves the same JSON as this commit.
 *
 * Env:
 *   WEBSITE_DEPLOY_HOOK  Cloudflare Pages deploy-hook URL of the WEBSITE project (repo secret).
 *   CHANGED_FILES        newline-separated list of files changed by the push (optional).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const hook = process.env.WEBSITE_DEPLOY_HOOK;
if (!hook) {
  console.log("::notice::WEBSITE_DEPLOY_HOOK is not set — skipping website redeploy.");
  process.exit(0);
}

const index = JSON.parse(fs.readFileSync(path.join(ROOT, "database.json"), "utf8"));
const publicBase = new URL("./", index.executives).href; // e.g. https://data.example.org/
const changed = (process.env.CHANGED_FILES ?? "")
  .split("\n")
  .map((f) => f.trim())
  .filter((f) => f.endsWith(".json") && fs.existsSync(path.join(ROOT, f)));

const canon = (text) => JSON.stringify(JSON.parse(text));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function isLive(file) {
  try {
    const res = await fetch(`${publicBase}${file}?cb=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) return false;
    return canon(await res.text()) === canon(fs.readFileSync(path.join(ROOT, file), "utf8"));
  } catch {
    return false;
  }
}

const deadline = Date.now() + 10 * 60 * 1000;
let pending = [...changed];
while (pending.length && Date.now() < deadline) {
  const results = await Promise.all(pending.map(async (f) => [f, await isLive(f)]));
  pending = results.filter(([, ok]) => !ok).map(([f]) => f);
  if (pending.length) {
    console.log(`Waiting for the database site to publish: ${pending.join(", ")}`);
    await sleep(15_000);
  }
}
if (pending.length) console.warn("::warning::Timed out waiting for the database site; triggering the rebuild anyway.");

const res = await fetch(hook, { method: "POST" });
if (!res.ok) {
  console.error(`Deploy hook failed: ${res.status} ${res.statusText}`);
  process.exit(1);
}
console.log("Website rebuild triggered.");
