# Schema Reference for Profile & CV Formatter

## 1. Dynamic Profile (`profile.json`)

The dynamic profile is an immersive, full-width, magazine-style editorial portfolio.

### Schema Fields
- `name` (String): Full name of the member. (Required)
- `tagline` (String): Sub-title tagline (e.g., "builds things that think.").
- `role` (String): Executive/Professional title (e.g., "Chief Engineer").
- `subtitle` (String): Secondary subtitle (e.g., "Software & Machine Learning").
- `photo` (String): URL or path to profile picture.
- `bio` (String): Monospaced biography/about paragraph.
- `location` (String): Current location (e.g., "Dhaka, BD").
- `session` (String): Academic session (e.g., "2026-27").
- `socials` (Array): List of social links (`type`, `label`, `url`).
- `stats` (Array): Metric grid values (`value`, `label`).
- `focus_areas` (Array): List of string pills representing focus fields.
- `skills` (Array): Categorized skill pill groups (`category`, `icon`, `items`).
- `timeline` (Array): Monospace experience history with fields for both desktop and mobile layouts:
  - `role` (String): Job title/position (Required)
  - `start` (String): Start year or "present" (Required)
  - `end` (String): End year or "present" (Required)
  - `description` (String): Full description for desktop layout
  - `short_desc` (String): Compact description for mobile layout
  - `tags` (Array): Skills/technologies used (e.g., ["Python", "ML"])
  - `company` (String): Organization name
  - `type` (String): Employment type (e.g., "Full-time", "Internship")
- `projects` (Array): List of projects (`title`, `description`, `tags`, `featured` boolean, `links` object).
- `publications` (Array): List of papers (`title`, `venue`, `tags`, `featured` boolean, `links` object).
- `achievements` (Array): List of honors (`title`, `event`, `year`).
- `cv_link` (String): Custom CV page redirection.

### Example `profile.json`
```json
{
  "name": "Elon Musk",
  "tagline": "builds things that think.",
  "role": "Chief Engineer",
  "subtitle": "Software & Machine Learning",
  "photo": "",
  "bio": "Elon Musk is the Chief Engineer of the Statistics Programming Club.",
  "location": "Dhaka, BD",
  "session": "2021-22",
  "socials": [
    { "type": "github", "label": "GitHub", "url": "https://github.com/elonmusk" }
  ],
  "stats": [
    { "value": "4+", "label": "Years of Experience" }
  ],
  "focus_areas": ["Deep Learning", "MLOps"],
  "skills": [
    {
      "category": "ML / AI",
      "icon": "brain",
      "items": ["PyTorch", "TensorFlow"]
    }
  ],
  "timeline": [
    {
      "role": "Senior ML Engineer",
      "start": "2023",
      "end": "present",
      "description": "Leading LLM infrastructure and agentic pipeline design.",
      "short_desc": "Leading LLM infrastructure and agentic pipeline design.",
      "tags": ["LLMs", "MLOps", "Python"],
      "company": "Acme AI",
      "type": "Full-time"
    },
    {
      "role": "ML Engineer",
      "start": "2021",
      "end": "2023",
      "description": "Developed NLP pipelines for document classification.",
      "short_desc": "NLP pipelines for document classification.",
      "tags": ["PyTorch", "NLP"],
      "company": "DataCo",
      "type": "Full-time"
    }
  ],
  "projects": [
    {
      "title": "Distribution Detective",
      "description": "A 21-distribution statistical detection pipeline...",
      "tags": ["Python", "SciPy"],
      "featured": true,
      "links": { "github": "https://github.com/elonmusk/dist-detect" }
    }
  ],
  "publications": [],
  "achievements": [],
  "cv_link": ""
}
```

## 2. Curriculum Vitae (`cv.json`)

The CV feature provides a professionally formatted "Official Record" page on screen, and a plain one-column CV when it is printed (Print / PDF). The printed CV follows today's CV conventions: a header with contact details, a short summary, then Education, Experience, Projects, Skills, Publications, Awards and any other sections, with Certifications and Languages last. It is single-column and ATS-friendly, with no photo.

### Core Profile Fields
- `name` (String): Full name.
- `role` (String): Professional title / headline.
- `summary` (String, recommended): 2–3 sentences — who you are, what you do best, what you are looking for. Shown first on the printed CV.
- `location` (String): City and Country.
- `phone` (String, optional): Phone number with country code.
- `email` (String): Contact email address.
- `github` (String): GitHub profile URL or username.
- `linkedin` (String, optional): LinkedIn profile URL.
- `website` (String, optional): Portfolio or personal site.

### Standard Sidebar Sections
- `education` (Array of objects): `degree`, `institution`, `location` (optional), `year`, `cgpa` (e.g. `"3.85 / 4.00"`), `rank` (optional), `honors` (optional, e.g. `"First Class"`), `thesis` (optional), `coursework` (optional array of strings).
- `certifications` (Array of objects): `title`, `link` (optional).
- `languages` (Array of strings).

### Dynamic Main Content Sections
Any key that is an array and not one of the standard fields will be rendered in the main column. The key name is converted from `snake_case` to `Title Case` (e.g., `technical_skills` -> `// Technical Skills`).

**Entry Structure:**
- `title` (String): Bold primary role/title.
- `subtitle` (String): Secondary company/detail.
- `location` (String, optional): Where the work was done; shown next to the subtitle.
- `link` (String, optional): Link to a project, paper or repository.
- `dates` (String): Right-aligned muted dates. Use one date style across the whole CV (`2023 – 2025` or `Jan 2023 – Dec 2025`).
- `bullets` (Array): Start with a strong verb and give a number where you can ("cut build time by 40%"). Can be strings or objects `{ "text": "...", "children": [...] }` for nested lists.
- `commas` (Array of strings): Inline flow layout.

### Example `cv.json`
```json
{
  "name": "Rahul Das",
  "role": "Intern Researcher",
  "summary": "Statistics student with hands-on experience in machine learning for health data. Looking for a research internship in applied ML.",
  "location": "Chittagong, Bangladesh",
  "phone": "+880 1700 000000",
  "email": "rahuldas12d34@gmail.com",
  "github": "github.com/rahuldadn",
  "linkedin": "linkedin.com/in/rahuldadn",
  "languages": ["Bengali", "English"],
  "education": [
    {
      "degree": "B.Sc. in Statistics",
      "institution": "University of Dhaka",
      "year": "Jan ’22 - May ’26",
      "cgpa": "3.85 / 4.00",
      "honors": "First Class",
      "thesis": "Explainable ML for breast cancer prediction",
      "coursework": ["Regression Analysis", "Machine Learning", "Survival Analysis"]
    }
  ],
  "experience": [
    {
      "title": "Intern Researcher",
      "dates": "May 2025 – July 2025",
      "subtitle": "Meta Research Lab",
      "bullets": [
        {
          "text": "Project 1: Predicting Breast Cancer...",
          "children": [
            "Developed an end-to-end ML pipeline.",
            "Conducted SHAP analysis."
          ]
        }
      ]
    }
  ],
  "technical_skills": [
    {
      "subtitle": "Programming Languages",
      "commas": ["Python", "R", "LaTeX"]
    }
  ]
}
```
