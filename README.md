# Statistics Programming Club — Database

All content of the club website lives here as plain JSON + photos. This repo contains **no code that runs on the site**: the website (`programming-club-demo`) reads it, and the admin panel (`programming-club-demo-admin`) edits it.

> The current content is demo data (famous people as fake members). It is replaced by the real data when this structure moves to the real repo — see [Moving to the real repo](#moving-to-the-real-repo).

```
database.json              ← index: absolute URLs of every file below + the photo base URL
_headers                   ← CORS, so the website can fetch profiles/CVs/certificates in the browser
executives.json            ← committees and members
projects.json              ← projects & publications
events.json                ← events
courses.json               ← courses & certificates list
achievements.json          ← achievements + tally strip
certificates.json          ← issued certificates (verification page)
members/<slug>/profile.json  ← optional "dynamic profile" of a member
members/<slug>/cv.json       ← optional CV of a member
photos/executives/<slug>.<ext>   ← member icons
scripts/                   ← validate.mjs, redeploy-website.mjs, set-base-url.mjs
```

## How the pieces fit together

```
admin panel ──commit──▶ this repo (GitHub) ──▶ Cloudflare Pages (serves the JSON + photos)
                              │
                              └─ GitHub Action: validate → wait until Pages serves the new files
                                               → call the website's deploy hook
                                                         │
                       website (Cloudflare Pages) ◀──────┘  rebuilds static pages from the fresh data
```

* List pages (home stats, executives, alumni, projects, achievements, events, courses) are **built into static HTML** at deploy time — best for SEO. That is why a content change triggers a website rebuild.
* Profile, CV and certificate pages read their JSON **in the browser** from this repo's site, so they are always current.

### One-time setup

1. Create a Cloudflare Pages project for this repo (no build command, output directory `/`).
2. Create a **deploy hook** in the *website's* Cloudflare Pages project (Settings → Builds → Deploy hooks).
3. Add it to this repo as the secret `WEBSITE_DEPLOY_HOOK` (Settings → Secrets and variables → Actions).

Without the secret the workflow still validates the data and just skips the rebuild.

## Conventions

* **No domain names inside the data files.** Image paths and member links are relative:
  * `icon_link`: relative to `photos/` — e.g. `executives/elon-musk.webp` (resolved with `imageBase` from `database.json`).
  * `profile_link` / `cv_link`: relative to the repo root — e.g. `members/elon-musk/cv.json`.
  * Absolute `https://…` links are also accepted and used as they are.
* JSON is formatted with 2 spaces and a trailing newline (the admin panel writes it that way).
* Run `pnpm validate` (or `node scripts/validate.mjs`) before committing — CI runs the same check.

## Moving to the real repo

1. Copy this structure into the real database repo and replace the demo content.
2. Deploy it on Cloudflare Pages and run `pnpm set-base-url https://<your-database-domain>` — this rewrites `database.json` only.
3. In the website, set `NEXT_PUBLIC_DATABASE_INDEX_URL` to `https://<your-database-domain>/database.json`.
4. In the admin panel, set `DATABASE_REPO` to the new repo.
5. Add the `WEBSITE_DEPLOY_HOOK` secret to the new repo.

## File reference

### `database.json`

```json
{
  "imageBase": "https://<database-domain>/photos/",
  "executives": "https://<database-domain>/executives.json",
  "projects": "…/projects.json",
  "events": "…/events.json",
  "courses": "…/courses.json",
  "achievements": "…/achievements.json",
  "certificates": "…/certificates.json"
}
```

### `executives.json`

```json
{
  "current_committee": "2026-27",
  "committees": [
    { "session": "2026-27", "label": "2026 – 2027", "total_members": 8, "members": [ … ] }
  ]
}
```

| Field | Description |
|---|---|
| `current_committee` | Must match a `session`. That committee is **Current Executives**; every other one is **Past Executives**. |
| `committees` | Newest first. |
| `session` | Unique ID, no spaces (e.g. `2026-27`). |
| `label` | Text shown on the website (e.g. `2026 – 2027`). |
| `total_members` | Optional. Used for the home page "members" stat; falls back to the number of listed members. |

Member:

```json
{
  "student_id": "2020001",
  "initial": "E",
  "role": "Chief Engineer",
  "role_display": "// CHIEF ENGINEER",
  "name": "Elon Musk",
  "session": "2026-27",
  "highlight": false,
  "bio": "…",
  "socials": [{ "type": "github", "label": "GitHub", "url": "https://github.com/…" }],
  "icon_link": "executives/elon-musk.webp",
  "profile_link": "members/elon-musk/profile.json",
  "cv_link": "members/elon-musk/cv.json"
}
```

| Field | Description |
|---|---|
| `student_id` | Unique across **all** committees. Used by projects and achievements to reference members. |
| `initial` | Letter shown when there is no photo. |
| `role` / `role_display` | Short role (alumni cards) / role with the `//` prefix (executive cards). |
| `session` | Must equal the committee's `session`. |
| `highlight` | `true` gives the wide featured card. One per committee at most. |
| `socials[].type` | `linkedin`, `github`, `facebook`, `email`, `codeforces`, `twitter`, `instagram`, `website`. |
| `icon_link`, `profile_link`, `cv_link` | Optional, see [Conventions](#conventions). `profile_link` enables the magazine-style profile; `cv_link` enables the CV page. |

### `projects.json`

`{ "projects": [ { title, description, status, tags[], members[], year, link?, demo_link?, featured? } ] }`

`status`: `active` · `completed` · `research` · `publication`. `members` are `student_id`s. `link` shows a **Repo ↗** button, `demo_link` a **Demo ↗** button.

### `achievements.json`

`{ "tally": [ { value, label } ], "achievements": [ { title, event, category, year, tier, team_label, members[], featured? } ] }`

`tier`: `gold` · `silver` · `bronze` · `special` · `community`. The `tally` strip is typed by hand (see the website's `docs/TODO.md`).

### `events.json`

`{ "note": "…", "events": [ { id, title, date, time, location, audience, type, register_link?, details_link? } ] }`

`date` is `YYYY-MM-DD`. `type`: `upcoming` · `workshop` · `contest` · `seminar` · `other`.

### `courses.json`

`{ "courses": [ { id, title, provider, description, type, year, link?, featured? } ] }` — `type`: `course` · `certificate`.

### `certificates.json`

`{ "issued_certificates": [ { id, recipient, course (or course1 + course2), date, template?, reason, reason2, person1, post1, person2, post2, modules?, hours?, score?, grade? } ] }`

`template` is the name of an SVG template in the website repo (`public/resources/certificates/svg/`, default `Certificate_A.svg`).

### `members/<slug>/profile.json` and `cv.json`

Schemas are documented in [`.claude/skills/profile-cv-formatter/REFERENCE.md`](.claude/skills/profile-cv-formatter/REFERENCE.md). The same folder holds a Claude skill that converts a raw résumé into these files.
