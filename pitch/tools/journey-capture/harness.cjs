// Loads the built MORPH client in headless Chrome without a server: static files come from dist/ via
// request interception, /api calls are answered in the page by a fetch stub (mocks.js), with real timing.
const fs = require("fs");
const path = require("path");
const puppeteer = require("/tmp/claude-501/npmcache/_npx/ff34db7ae5ef6ceb/node_modules/puppeteer-core");

const ROOT = "/private/tmp/claude-501/-Users-tobi-hackathon-pitch-pitch/831dcd8a-3642-4ef8-94f9-f74700ccb307/scratchpad";
const DIST = path.join(ROOT, "src/lip/client/dist");
const CHROME =
  "/Users/tobi/.cache/hyperframes/chrome/chrome-headless-shell/mac_arm-152.0.7977.30/chrome-headless-shell-mac-arm64/chrome-headless-shell";
const ORIGIN = "http://morph.test";
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".png": "image/png", ".json": "application/json" };

async function open({ width = 1440, height = 900, scale = 1.5 } = {}) {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    pipe: true,
    // the macOS sandbox denies Chrome's mach rendezvous; single-process avoids it (as HyperFrames does)
    args: ["--no-sandbox", "--single-process", "--disable-gpu-compositing", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: scale });
  await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "light" }, { name: "prefers-reduced-motion", value: "no-preference" }]);
  const mocks = fs.readFileSync(path.join(__dirname, "mocks.js"), "utf8");
  const scale_json = fs.readFileSync(path.join(ROOT, "src/lip/server/app/data/scale.json"), "utf8");
  await page.evaluateOnNewDocument(`window.__SCALE = ${scale_json};\n${mocks}`);
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    const url = new URL(req.url());
    if (url.origin !== ORIGIN) return req.abort();
    let file = path.join(DIST, decodeURIComponent(url.pathname));
    if (!file.startsWith(DIST) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(DIST, "index.html");
    req.respond({ status: 200, contentType: TYPES[path.extname(file)] || "application/octet-stream", body: fs.readFileSync(file) });
  });
  page.on("pageerror", (e) => console.log("PAGE ERROR", e.message));
  page.on("console", (m) => console.log("CONSOLE", m.type(), m.text().slice(0, 300)));
  return { browser, page, ORIGIN };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

module.exports = { open, sleep, ORIGIN, ROOT };
