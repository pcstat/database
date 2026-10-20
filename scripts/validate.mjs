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
const PAGE_FILES = ["executives", "projects", "events", "courses", "achievements", "home", "site"];
const PILL_STYLES = ["py", "rp", "ml", "st"];
// Pages the website can link to from its sidebar.
const NAV_PATHS = ["/", "/exec", "/alumni", "/projects", "/achievements", "/events", "/about", "/courses", "/certificate"];
// Icons the website can draw in the sidebar (same drawings as the admin panel).
const NAV_ICONS = ["home", "people", "history", "box", "trophy", "calendar", "info", "book", "badge"];
const TERMINAL_COMMANDS = ["about", "stats", "team", "projects", "achievements", "events", "alumni", "verify", "join"];
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

// ── projects / achievements / events / courses ──────────────────────────────
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
    if (!e.id) err("events.json", `event "${e.title}": "id" is required (the admin panel fills it in)`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(e.date ?? "")) err("events.json", `event "${e.title}": date must be YYYY-MM-DD (got "${e.date}")`);
    checkEnum("events.json", `event "${e.title}" type`, e.type, ENUMS.eventType);
  }
}

const courses = readJson("courses.json");
if (courses) {
  checkUnique("courses.json", "course id", (courses.courses ?? []).map((c) => c.id));
  for (const c of courses.courses ?? []) {
    if (!c.id) err("courses.json", `course "${c.title}": "id" is required (the admin panel fills it in)`);
    checkEnum("courses.json", `course "${c.title}" type`, c.type, ENUMS.courseType);
  }
}

// Certificates are NOT in this repo: they live in their own repository (pcstat/certificates), because there will be
// thousands of them. Its address is configured in the website's and the admin panel's database.json ("certificates").

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

// ── site.json (club details, navigation, page texts) ────────────────────────
const site = readJson("site.json");
if (site) {
  const text = (where, value) => {
    if (typeof value !== "string" || !value.trim()) err("site.json", `${where} is required`);
  };
  const group = (key, fields) => {
    if (!site[key] || typeof site[key] !== "object" || Array.isArray(site[key])) {
      err("site.json", `"${key}" is missing`);
      return null;
    }
    for (const f of fields) text(`${key}.${f}`, site[key][f]);
    return site[key];
  };
  const club = group("club", ["name", "subtitle", "full_name", "department", "university", "email", "browser_title", "description", "share_description"]);
  if (club && !(Number.isInteger(club.founded) && club.founded > 1900 && club.founded <= new Date().getFullYear())) {
    err("site.json", `club.founded must be a year such as 2022`);
  }

  if (!Array.isArray(site.nav) || site.nav.length === 0) err("site.json", `"nav" must be a list with at least one page`);
  else {
    checkUnique("site.json", "nav path", site.nav.map((n) => n.path));
    for (const n of site.nav) {
      if (!NAV_PATHS.includes(n.path)) err("site.json", `nav: "${n.path}" is not a page of the website (${NAV_PATHS.join(", ")})`);
      text(`nav ${n.path} label`, n.label);
      checkEnum("site.json", `nav ${n.path} icon`, n.icon, NAV_ICONS);
    }
  }

  const home = group("home", ["tag", "description"]);
  if (home) {
    if (!Array.isArray(home.title_lines) || home.title_lines.length === 0 || home.title_lines.some((l) => typeof l !== "string" || !l.trim())) {
      err("site.json", `home.title_lines must be a list of non-empty lines`);
    }
    if (!Array.isArray(home.pills)) err("site.json", `home.pills must be a list`);
    else for (const pill of home.pills) {
      text("home pill label", pill.label);
      checkEnum("site.json", `home pill "${pill.label}" style`, pill.style, PILL_STYLES);
    }
    for (const key of ["projects_block", "team_block"]) {
      for (const f of ["eyebrow", "title", "accent", "link_label"]) text(`home.${key}.${f}`, home[key]?.[f]);
    }
    for (const f of ["eyebrow", "title", "accent", "text", "button_label"]) text(`home.join.${f}`, home.join?.[f]);
  }

  const terminal = group("terminal", ["title", "tagline", "motto", "focus", "join_text"]);
  if (terminal) {
    if (!Array.isArray(terminal.commands)) err("site.json", `terminal.commands must be a list`);
    else for (const c of terminal.commands) if (!TERMINAL_COMMANDS.includes(c)) err("site.json", `terminal.commands: "${c}" is not one of ${TERMINAL_COMMANDS.join(", ")}`);
  }

  for (const key of ["exec", "alumni", "projects", "achievements", "events", "courses", "certificate"]) {
    for (const f of ["eyebrow", "title", "accent", "description"]) text(`pages.${key}.${f}`, site.pages?.[key]?.[f]);
  }

  const about = group("about", ["eyebrow", "title", "accent", "description"]);
  if (about) {
    if (!Array.isArray(about.cards)) err("site.json", `about.cards must be a list`);
    else for (const c of about.cards) {
      text("about card title", c.title);
      text(`about card "${c.title}" text`, c.text);
    }
    if (!Array.isArray(about.meetups)) err("site.json", `about.meetups must be a list`);
    else for (const m of about.meetups) for (const f of ["label", "title", "detail"]) text(`about meetup ${f}`, m[f]);
    for (const f of ["title", "accent", "text", "button_label"]) text(`about.contact.${f}`, about.contact?.[f]);
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
