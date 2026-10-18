#!/usr/bin/env node
/**
 * Validates the database repo. Run with `pnpm validate` (or `node scripts/validate.mjs`).
 * Exits with code 1 when any error is found, so CI blocks a bad commit before the website redeploys.
 *
 * Plain Node, no dependencies.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const warnings = [];
const err = (file, msg) => errors.push(`${file}: ${msg}`);
const warn = (file, msg) => warnings.push(`${file}: ${msg}`);

const ENUMS = {
  projectStatus: ["active", "completed", "research", "publication"],
  achievementTier: ["gold", "silver", "bronze", "special", "community"],
  eventType: ["upcoming", "workshop", "contest", "seminar", "other"],
  courseType: ["course", "certificate"],
};
const PAGE_FILES = ["executives", "projects", "events", "courses", "achievements", "certificates", "home"];
const isAbsolute = (v) => /^https?:\/\//i.test(v) || v.startsWith("/");

function readJson(rel) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) {
    err(rel, "file is missing");
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(abs, "utf8"));
  } catch (e) {
    err(rel, `invalid JSON — ${e.message}`);
    return null;
  }
}

function checkUnique(file, label, values) {
  const seen = new Set();
  for (const v of values) {
    if (seen.has(v)) err(file, `duplicate ${label} "${v}"`);
    seen.add(v);
  }
}

function checkEnum(file, where, value, allowed) {
  if (!allowed.includes(value)) err(file, `${where}: "${value}" is not one of ${allowed.join(", ")}`);
}

function checkLocalFile(file, where, rel) {
  if (!rel) return;
  if (isAbsolute(rel)) return; // external link — not our business
  if (!fs.existsSync(path.join(ROOT, rel))) err(file, `${where}: file "${rel}" does not exist`);
}

// ── database.json (index) ────────────────────────────────────────────────────
// Every entry is a path relative to this repo's published root (no domain names live in this repo).
// The website and the admin panel know where the repo is published from their own database.json.
const index = readJson("database.json");
if (index) {
  if (!index.imageBase || isAbsolute(index.imageBase) || !index.imageBase.endsWith("/")) {
    err("database.json", `"imageBase" must be a relative folder path ending with "/" (e.g. "photos/")`);
  } else if (!fs.existsSync(path.join(ROOT, index.imageBase))) {
    err("database.json", `"imageBase" folder "${index.imageBase}" does not exist`);
  }
  for (const key of PAGE_FILES) {
    const file = index[key];
    if (!file) {
      err("database.json", `missing key "${key}"`);
      continue;
    }
    if (isAbsolute(file)) err("database.json", `"${key}" must be a relative path, not a URL (got "${file}")`);
    else if (file !== `${key}.json`) err("database.json", `"${key}" must be "${key}.json" (got "${file}")`);
  }
}

// ── executives.json ──────────────────────────────────────────────────────────
const executives = readJson("executives.json");
const memberIds = new Set();
if (executives) {
  const sessions = (executives.committees ?? []).map((c) => c.session);
  checkUnique("executives.json", "committee session", sessions);
  if (!sessions.includes(executives.current_committee)) {
    err("executives.json", `"current_committee" ("${executives.current_committee}") does not match any committee session`);
  }
  const allIds = [];
  for (const committee of executives.committees ?? []) {
    const where = `committee ${committee.session}`;
    if (!committee.label) err("executives.json", `${where}: "label" is required`);
    // total_members is the number of club members (shown as "MEMBERS"); when it is absent the home page counts the
    // listed executives instead (shown as "EXECUTIVES"). The two numbers are different things, so no comparison here.
    if (committee.total_members !== undefined && !(Number.isInteger(committee.total_members) && committee.total_members >= 0)) {
      err("executives.json", `${where}: "total_members" must be a whole number (or left out)`);
    }
    const highlighted = committee.members.filter((m) => m.highlight).length;
    if (highlighted > 1) warn("executives.json", `${where}: ${highlighted} members are highlighted (only one is expected)`);
    for (const m of committee.members) {
      const who = `${where} / ${m.name ?? m.student_id}`;
      for (const f of ["student_id", "name", "initial", "session"]) if (!m[f]) err("executives.json", `${who}: "${f}" is required`);
      if (m.session && m.session !== committee.session) err("executives.json", `${who}: member session "${m.session}" differs from committee session "${committee.session}"`);
      allIds.push(m.student_id);
      memberIds.add(m.student_id);
      if (m.icon_link && !isAbsolute(m.icon_link)) checkLocalFile("executives.json", `${who} icon_link`, `photos/${m.icon_link}`);
      checkLocalFile("executives.json", `${who} profile_link`, m.profile_link);
      checkLocalFile("executives.json", `${who} cv_link`, m.cv_link);
      for (const s of m.socials ?? []) if (!s.url) err("executives.json", `${who}: a social link has no url`);
    }
  }
  checkUnique("executives.json", "student_id", allIds);
}
const currentExecutiveIds = new Set(
  (executives?.committees ?? []).find((c) => c.session === executives?.current_committee)?.members.map((m) => m.student_id) ?? [],
);

// ── projects / achievements / events / courses / certificates ───────────────
function checkMemberRefs(file, where, ids) {
  for (const id of ids ?? []) if (!memberIds.has(id)) err(file, `${where}: unknown member id "${id}"`);
}

const projects = readJson("projects.json");
const projectIds = new Set();
if (projects) {
  checkUnique("projects.json", "project id", (projects.projects ?? []).map((p) => p.id));
  for (const p of projects.projects ?? []) {
    if (!p.id) err("projects.json", `project "${p.title}": "id" is required`);
    else if (/\s/.test(p.id)) err("projects.json", `project "${p.title}": the id must not contain spaces`);
    else projectIds.add(p.id);
    checkEnum("projects.json", `project "${p.title}" status`, p.status, ENUMS.projectStatus);
    checkMemberRefs("projects.json", `project "${p.title}"`, p.members);
  }
}

const achievements = readJson("achievements.json");
if (achievements) {
  for (const a of achievements.achievements ?? []) {
    checkEnum("achievements.json", `achievement "${a.title}" tier`, a.tier, ENUMS.achievementTier);
    checkMemberRefs("achievements.json", `achievement "${a.title}"`, a.members);
  }
}

const events = readJson("events.json");
if (events) {
  checkUnique("events.json", "event id", (events.events ?? []).map((e) => e.id));
  for (const e of events.events ?? []) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(e.date ?? "")) err("events.json", `event "${e.title}": date must be YYYY-MM-DD (got "${e.date}")`);
    checkEnum("events.json", `event "${e.title}" type`, e.type, ENUMS.eventType);
  }
}

const courses = readJson("courses.json");
if (courses) {
  checkUnique("courses.json", "course id", (courses.courses ?? []).map((c) => c.id));
  for (const c of courses.courses ?? []) checkEnum("courses.json", `course "${c.title}" type`, c.type, ENUMS.courseType);
}

const certificates = readJson("certificates.json");
if (certificates) {
  checkUnique("certificates.json", "certificate id", (certificates.issued_certificates ?? []).map((c) => c.id));
  for (const c of certificates.issued_certificates ?? []) {
    for (const f of ["id", "recipient", "date"]) if (!c[f]) err("certificates.json", `certificate ${c.id ?? "?"}: "${f}" is required`);
    if (!c.course && !c.course1) err("certificates.json", `certificate ${c.id ?? "?"}: "course" (or "course1") is required`);
    else if (!c.course) warn("certificates.json", `certificate ${c.id}: has no "course", so the verification page shows an empty course`);
  }
}

// ── home.json (what the home page pins) ─────────────────────────────────────
const home = readJson("home.json");
if (home) {
  for (const [key, label] of [["pinned_executives", "executive"], ["pinned_projects", "project"]]) {
    if (!Array.isArray(home[key])) err("home.json", `"${key}" must be a list`);
    else checkUnique("home.json", `pinned ${label}`, home[key]);
  }
  for (const id of home.pinned_executives ?? []) {
    if (!memberIds.has(id)) err("home.json", `pinned executive "${id}" is not a known student_id`);
    else if (!currentExecutiveIds.has(id)) err("home.json", `pinned executive "${id}" is not in the current committee`);
  }
  for (const id of home.pinned_projects ?? []) {
    if (!projectIds.has(id)) err("home.json", `pinned project "${id}" is not a known project id`);
  }
}

// ── members/<slug>/{profile,cv}.json ────────────────────────────────────────
const membersDir = path.join(ROOT, "members");
if (fs.existsSync(membersDir)) {
  for (const slug of fs.readdirSync(membersDir)) {
    for (const file of ["profile.json", "cv.json"]) {
      const rel = `members/${slug}/${file}`;
      if (!fs.existsSync(path.join(ROOT, rel))) continue;
      const data = readJson(rel);
      if (data && !data.name) err(rel, `"name" is required`);
    }
  }
}

// ── report ───────────────────────────────────────────────────────────────────
for (const w of warnings) console.warn(`⚠  ${w}`);
for (const e of errors) console.error(`✖  ${e}`);
if (errors.length) {
  console.error(`\n${errors.length} error(s), ${warnings.length} warning(s).`);
  process.exit(1);
}
console.log(`✔ Database is valid (${warnings.length} warning(s)).`);
