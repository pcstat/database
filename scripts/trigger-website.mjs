#!/usr/bin/env node
/**
 * Rebuilds the website after the database changed.
 *
 * The website is a static export: its list pages (executives, projects, events, …) are built from this
 * database at build time, which is what makes them fully indexable by search engines. The website repo
 * builds and deploys itself in GitHub Actions, so this script starts that workflow (workflow_dispatch).
 *
 * To avoid the website building against stale data it first waits until the published database site
 * serves the same JSON as this commit.
 *
 * Env:
 *   WEBSITE_REPO_TOKEN  fine-grained token for the WEBSITE repo, permission "Actions: Read and write" (repo secret).
 *   WEBSITE_REPO        "owner/name" of the website repo.
 *   WEBSITE_WORKFLOW    workflow file to start (default "deploy.yml").
 *   WEBSITE_BRANCH      branch to run it on (default "main").
 *   PUBLIC_BASE         public address of this database, e.g. https://pcstat-database.pages.dev/
 *   CHANGED_FILES       newline-separated list of files changed by the push (optional).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { WEBSITE_REPO_TOKEN: token, WEBSITE_REPO: repo, PUBLIC_BASE: publicBase } = process.env;
const workflow = process.env.WEBSITE_WORKFLOW || "deploy.yml";
const branch = process.env.WEBSITE_BRANCH || "main";

if (!token) {
  console.log("::notice::WEBSITE_REPO_TOKEN is not set — the database was deployed but the website was NOT rebuilt.");
  process.exit(0);
}
if (!repo || !/^[\w.-]+\/[\w.-]+$/.test(repo)) {
  console.error(`::error::WEBSITE_REPO must look like "owner/name", got "${repo ?? ""}".`);
  process.exit(1);
}

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

if (publicBase) {
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
  if (pending.length) console.warn("::warning::Timed out waiting for the database site; starting the website build anyway.");
}

const apiBase = (process.env.GITHUB_API_URL || "https://api.github.com").replace(/\/$/, "");
let res;
try {
  res = await fetch(`${apiBase}/repos/${repo}/actions/workflows/${workflow}/dispatches`, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "programming-club-database",
    },
    body: JSON.stringify({ ref: branch }),
  });
} catch (error) {
  console.error(`::error::Could not reach the GitHub API: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
}
if (res.status !== 204) {
  const text = await res.text();
  console.error(`::error::Could not start ${repo}/${workflow} on "${branch}": HTTP ${res.status} ${text.slice(0, 300)}`);
  console.error("Check that WEBSITE_REPO_TOKEN has \"Actions: Read and write\" on the website repo and that the workflow exists there.");
  process.exit(1);
}
console.log(`Website rebuild started (${repo} → ${workflow}).`);
