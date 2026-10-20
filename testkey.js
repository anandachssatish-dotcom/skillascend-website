// Run:  node testkey.js
// Checks your Gemini key and shows which models work. It never prints the key.
const fs = require("fs"), path = require("path");
try {
  const p = [".env", "_env"].map(f => path.join(__dirname, f)).find(x => fs.existsSync(x));
  if (p) for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_]\w*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2].trim().replace(/^["']|["']$/g, "");
    if (!process.env[m[1]]) process.env[m[1]] = v;
  }
} catch {}
const KEY = String(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "").trim();
const MODEL = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";
const B = "https://generativelanguage.googleapis.com/v1beta";
if (!KEY) { console.log("No key found. Put GEMINI_API_KEY=... in .env"); process.exit(1); }
console.log(`Key: starts with "${KEY.slice(0, 3)}", length ${KEY.length}`);
console.log(`Model in use: ${MODEL}\n`);

async function call(url, opts, how) {
  try {
    const r = await fetch(url, { ...opts, signal: AbortSignal.timeout(20000) });
    const j = await r.json().catch(() => ({}));
    return { how, status: r.status, ok: r.ok, msg: j.error?.message || "", reason: j.error?.details?.[0]?.reason || "", j };
  } catch (e) { return { how, status: 0, ok: false, msg: e.message, reason: "" }; }
}
(async () => {
  const list = await Promise.all([
    call(`${B}/models`, { headers: { "x-goog-api-key": KEY } }, "key in header"),
    call(`${B}/models?key=${encodeURIComponent(KEY)}`, {}, "key in URL")
  ]);
  list.forEach(r => console.log(`List models (${r.how}): ${r.ok ? "OK" : "FAILED " + r.status + " " + r.reason + " " + r.msg.slice(0, 120)}`));
  const good = list.find(r => r.ok);
  if (!good) {
    console.log("\nThe key is rejected both ways. Create a NEW key at aistudio.google.com/app/apikey,");
    console.log("make sure it is in a project with the Gemini API enabled, then try again.");
    return;
  }
  const names = (good.j.models || []).filter(m => (m.supportedGenerationMethods || []).includes("generateContent"))
    .map(m => m.name.replace("models/", "")).filter(n => /gemini/.test(n) && /flash/.test(n));
  console.log("\nFlash models your key can use:\n  " + (names.join("\n  ") || "(none found)"));

  const body = JSON.stringify({ contents: [{ parts: [{ text: 'Reply with JSON {"ok":true}' }] }], generationConfig: { responseMimeType: "application/json", maxOutputTokens: 50 } });
  const hdr = good.how === "key in header";
  const t = await call(`${B}/models/${encodeURIComponent(MODEL)}:generateContent${hdr ? "" : "?key=" + encodeURIComponent(KEY)}`,
    { method: "POST", headers: { "content-type": "application/json", ...(hdr ? { "x-goog-api-key": KEY } : {}) }, body }, MODEL);
  console.log(`\nTest with ${MODEL}: ${t.ok ? "WORKS ✓" : "FAILED " + t.status + " " + t.reason + " " + t.msg.slice(0, 150)}`);
  if (!t.ok && names.length) console.log(`\nTry this in .env:  GEMINI_MODEL=${names[0]}`);
})();
