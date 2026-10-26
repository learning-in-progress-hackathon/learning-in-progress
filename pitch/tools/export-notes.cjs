// Writes docs/FOLIEN.md from the slideshow island in index.html: every slide with its speaker notes.
// Run after changing slides or notes: node tools/export-notes.cjs
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const start = html.indexOf('type="application/hyperframes-slideshow+json">') + 'type="application/hyperframes-slideshow+json">'.length;
const { slides } = JSON.parse(html.slice(start, html.indexOf("</script>", start)));
const labels = Object.fromEntries([...html.matchAll(/<div id="([cs]\d\d)" class="clip"[^>]*?data-label="([^"]*)"/g)].map((m) => [m[1], m[2]]));

const parts = [
  "# Folien und Sprechtexte",
  "",
  "Automatisch erzeugt aus `index.html` mit `node tools/export-notes.cjs`. Nicht von Hand bearbeiten.",
  "[Klick] markiert die Stelle, an der der nächste Schritt der Folie kommt.",
  "",
];
slides.forEach((slide, i) => {
  const clicks = slide.fragments.length - 1;
  parts.push(`## ${i + 1}. ${labels[slide.sceneId] || slide.sceneId}`);
  parts.push("");
  parts.push(`Datei: \`compositions/${slide.sceneId}.html\` · Klicks auf der Folie: ${clicks}`);
  parts.push("");
  parts.push(slide.notes ? `> ${slide.notes}` : "> (kein Sprechtext)");
  parts.push("");
});
fs.mkdirSync(path.join(root, "docs"), { recursive: true });
fs.writeFileSync(path.join(root, "docs", "FOLIEN.md"), parts.join("\n"));
console.log(`docs/FOLIEN.md: ${slides.length} Folien`);
