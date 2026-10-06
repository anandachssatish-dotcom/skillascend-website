# SkillAscend – Gemini setup

## 1. Add your API key

Open the `.env` file in this folder and replace only:

`PASTE_YOUR_GEMINI_API_KEY_HERE`

with your real Gemini API key.

Example:

`GEMINI_API_KEY=AIzaSy...`

Do not add quotes.

## 2. Start the app

Recommended: double-click `start.bat`.

Or open PowerShell in this folder and run:

`node server.js`

Then open:

`http://localhost:3000`

## 3. Model

The project is configured for `gemini-3.1-flash-lite`, a currently available Gemini API model.

## Important

- Keep `.env` private. Do not upload it to GitHub.
- `.gitignore` already excludes `.env`.
- You do not need to install dotenv; `server.js` loads `.env` itself.
- Node.js 18 or newer is required.
