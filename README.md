# Statistics Programming Club - Demo Data

This repository contains comprehensive demo data used for testing and developing the Statistics Programming Club website. It provides a set of highly detailed, professionally structured JSON profiles and CVs for the current executive committee, serving as a benchmark for data formatting and rendering.

## 🚀 Project Overview

The goal of this data set is to provide a realistic testing environment for the website's member profile and CV pages. Each executive has a corresponding directory containing:
- `profile.json`: A dynamic, magazine-style editorial portfolio schema.
- `cv.json`: A professional, official record schema for academic and professional history.
- `icon.webp/jpg`: Profile imagery.

## 👥 Current Committee (2026-27)

The following executives are included in this demo data:

- **Elon Musk** - Chief Engineer
- **Jensen Huang** - AI Architect
- **Sam Altman** - LLM Strategist
- **Demis Hassabis** - Research Lead
- **Satya Nadella** - Cloud Visionary
- **Tim Cook** - Operations Master
- **Sundar Pichai** - Search Architect
- **Mark Zuckerberg** - Social Engineer

## 🛠 Data Structure

The data is organized by individual directories:
`./<executive-name>/`
  - `profile.json` $\rightarrow$ Dynamic profile data
  - `cv.json` $\rightarrow$ Professional CV data
  - `icon.*` $\rightarrow$ Profile picture

### Schema Reference
For the exact JSON specifications, refer to:
`.claude/skills/profile-cv-formatter/REFERENCE.md`

## 📈 Usage

This data is primarily used to:
1.  **Test UI Rendering**: Ensure that long descriptions, nested bullets, and various skill categories render correctly across desktop and mobile layouts.
2.  **Validate Formatters**: Test the `profile-cv-formatter` skill's ability to generate and update profiles based on raw information.
3.  **Demo Capabilities**: Showcase the website's ability to handle diverse professional backgrounds and complex achievement lists.

---
*This is demo data and does not represent the actual membership of the club.*
