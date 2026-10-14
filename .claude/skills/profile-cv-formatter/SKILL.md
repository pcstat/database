---
name: profile-cv-formatter
description: Format raw text, resumes, markdown, or PDFs into perfectly structured cv.json or profile.json files. Use when the user wants to convert raw information into a profile or CV JSON for the website.
---

# Profile & CV JSON Formatter

This skill helps convert raw information (resumes, text, markdown, or PDFs) into perfectly structured `cv.json` or `profile.json` files that conform to the Statistics Programming Club website schemas.

## Workflow

1. **Receive Raw Info**: The user provides raw information (by pasting text, pointing to a file, or asking you to read a PDF/Markdown/TXT file). If they point to a file, use your tools to read and extract the text.
2. **Clarify Intent**: If the user didn't specify, ask them: "Do you want to build a `cv.json` (Curriculum Vitae Schema) or a `profile.json` (Dynamic Profile Schema)?"
3. **Format Data**:
   - Reference `REFERENCE.md` in this directory for the exact JSON schemas and examples.
   - Extract the raw info and meticulously map it to the requested JSON schema.
   - Ensure all keys and structures match the required format exactly.
   - **For timeline entries**: Include both `description` (full) and `short_desc` (compact) fields to support both desktop and mobile layouts. If only one description is provided, use it for both fields.
4. **Save File**:
   - Save the generated JSON file directly in the current working directory.
   - Name it `cv.json` or `profile.json` (or append the student ID if provided, e.g., `cv_12345.json`).
5. **Next Steps (Handoff)**:
   - Provide the following instructions to the user:
     > "I have generated your `[filename].json` file. To publish it on the website:
     > 1. Put it in `members/<your-slug>/` of the database repo (as `profile.json` or `cv.json`) and your photo in `photos/executives/`.
     > 2. In `executives.json`, set your `profile_link` / `cv_link` to `members/<your-slug>/profile.json` / `members/<your-slug>/cv.json` and `icon_link` to `executives/<photo-file>` (relative paths, no domain).
     > 3. Commit — the website rebuilds automatically. (Or send the files to the maintainer, who can also do this from the admin panel.)"

## Schemas & Guidelines

- DO NOT invent new fields that aren't supported by the schemas.
- For `cv.json`, any custom array fields will be converted from `snake_case` to Title Case for section headers. Follow the visual layout schema detailed in `REFERENCE.md`.
- Read the detailed schema specifications and examples in [REFERENCE.md](REFERENCE.md) before generating the JSON.
