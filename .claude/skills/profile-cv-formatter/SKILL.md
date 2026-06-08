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
     > "I have generated your `[filename].json` file. To link this to the website, please:
     > 1. Upload this JSON file and your profile picture to a public repository on your GitHub.
     > 2. Share the raw GitHub links with the website maintainer.
     > 3. Ask the maintainer to update your entry in `public/resources/data/executives.json` with the new links."

## Schemas & Guidelines

- DO NOT invent new fields that aren't supported by the schemas.
- For `cv.json`, any custom array fields will be converted from `snake_case` to Title Case for section headers. Follow the visual layout schema detailed in `REFERENCE.md`.
- Read the detailed schema specifications and examples in [REFERENCE.md](REFERENCE.md) before generating the JSON.
