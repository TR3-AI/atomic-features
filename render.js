#!/usr/bin/env node
// Renders maps/<slug>.md → <slug>.html (one page per atomic feature),
// updates pages.json. Usage: node render.js <slug>   (run from repo root)
const fs = require("fs");

const slug = process.argv[2];
if (!slug) { console.error("usage: node render.js <slug>"); process.exit(1); }

const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const rich = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/`(.+?)`/g, "<code>$1</code>");

const md = fs.readFileSync(`maps/${slug}.md`, "utf8").replace(/\r\n/g, "\n");
const lines = md.split("\n");

const title = (lines[0].match(/^# (.+?) — atomic features/) || [])[1] || slug;
const srcText = (lines.find((l) => l.startsWith("Source:")) || "").replace(/^Source:\s*/, "").trim();
const srcUrl = (srcText.match(/https?:\/\/\S+/) || [])[0] || "";
const srcLabel = srcUrl ? `<a href="${esc(srcUrl)}">${esc(srcText)}</a>` : esc(srcText);
const updated = (lines.find((l) => l.startsWith("Updated:")) || "").replace("Updated:", "").trim();
const count = (lines.find((l) => l.startsWith("Atoms:")) || "").replace("Atoms:", "").trim();

const chunks = md.split(/^## /m).slice(1);
const inline = (chunk, k) => {
  const m = chunk.match(new RegExp(`^${k}:\\s*(.+)$`, "m"));
  return m ? m[1].trim() : "";
};
const block = (chunk, k) => {
  const m = chunk.match(new RegExp(`^${k}:\\s*\\n([\\s\\S]*?)(?=^[A-Z][A-Za-z ]*:|\\Z)`, "m"));
  return m ? m[1].trim() : "";
};
const numbered = (text) => [...text.matchAll(/^\d+\.\s+(.+)$/gm)].map((x) => x[1].trim());

const atoms = chunks.map((chunk, idx) => {
  const name = chunk.split("\n")[0].trim();
  const buildSteps = numbered(block(chunk, "Build"));
  const verifySteps = numbered(block(chunk, "Verify"));
  return `
  <section class="fbox">
    <div class="fhead"><span class="fnum">A${idx + 1}</span><h3>${esc(name)}</h3><span class="fdept">${esc(inline(chunk, "From"))}</span></div>
    <div class="fsec"><div class="flbl">Build</div>
      <ol class="fsteps">
        ${buildSteps.map((s) => `<li>${rich(s)}</li>`).join("\n        ")}
      </ol>
    </div>
    <div class="fsec"><div class="flbl">Contract</div>
      <div class="pre">${rich(inline(chunk, "Contract"))}</div>
    </div>
    <div class="fsec"><div class="flbl">Verify</div>
      <ol class="fsteps">
        ${verifySteps.map((s) => `<li>${rich(s)}</li>`).join("\n        ")}
      </ol>
    </div>
    <div class="verdict ok"><span>Success</span> ${rich(inline(chunk, "Success"))}</div>
    <div class="verdict bad"><span>Failure</span> ${rich(inline(chunk, "Failure"))}</div>
  </section>`;
});

const tpl = fs.readFileSync("template.html", "utf8");
const stats = `<div class="stats">
    <div class="stat"><span class="snum">${esc(count)}</span><span class="slbl">atoms</span></div>
  </div>`;
const html = tpl
  .replaceAll("{{TITLE}}", esc(title))
  .replaceAll("{{SOURCE_URL}}", srcUrl || "#")
  .replaceAll("{{SOURCE_LABEL}}", srcLabel)
  .replaceAll("{{COUNT}}", esc(`${count} atoms`))
  .replaceAll("{{UPDATED}}", esc(updated))
  .replaceAll("{{KIT_FOOT}}", "")
  .replace("{{STATS}}", stats)
  .replace("{{RESEARCH}}", "")
  .replace("{{FEATURES}}", atoms.join("\n"));

fs.writeFileSync(`${slug}.html`, html);

const manifest = JSON.parse(fs.readFileSync("pages.json", "utf8"));
const entry = {
  file: `${slug}.html`,
  title: `${title} — atomic features`,
  desc: `${count} atoms, each independently buildable and independently verifiable — ready for parallel workers.`,
  date: updated,
  emoji: "⚛️",
  status: "open",
};
const i = manifest.findIndex((e) => e.file === entry.file);
if (i >= 0) manifest[i] = entry; else manifest.unshift(entry);
fs.writeFileSync("pages.json", JSON.stringify(manifest, null, 2) + "\n");
console.log(`rendered ${slug}.html (${atoms.length} atoms)`);
