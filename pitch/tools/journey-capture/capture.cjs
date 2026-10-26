// Walks Peter through the real MORPH client and saves every state the journey slides need.
// Run A follows the main path (form → magic page → generated lesson); run B takes the
// assessment path from the review step (follow-up question → picked themes).
const fs = require("fs");
const { open, sleep, ORIGIN } = require("./harness.cjs");
const OUT = process.argv[2];
fs.mkdirSync(OUT, { recursive: true });

const PETER_TEXT =
  "Photosynthese: Pflanzen stellen ihre Nahrung selbst her. In den Chloroplasten der Blattzellen fängt der grüne Farbstoff Chlorophyll Lichtenergie ein. Mit dieser Energie bauen die Pflanzen aus Kohlenstoffdioxid aus der Luft und Wasser aus dem Boden Traubenzucker (Glucose) auf. Dabei entsteht Sauerstoff, den die Pflanze über die Spaltöffnungen an die Luft abgibt. Die Gesamtgleichung lautet: 6 CO2 + 6 H2O + Lichtenergie → C6H12O6 + 6 O2. Die Photosynthese läuft in zwei Schritten ab: In der lichtabhängigen Reaktion wird Wasser gespalten, und die Energie wird in Form von ATP und NADPH gespeichert. Im Calvin-Zyklus nutzt die Pflanze diese Energie, um Kohlenstoffdioxid in Zucker einzubauen.";

const RECTS = {};
// element box in screenshot pixels (viewport px × device scale 1.5)
async function rect(page, key, target) {
  const r = await page.evaluate((t) => {
    let el = t.startsWith("text:") ? [...document.querySelectorAll("button,label,a,[role=radio]")].find((e) => e.offsetParent && e.innerText.trim().startsWith(t.slice(5))) : document.querySelector(t);
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return [b.x, b.y + window.scrollY, b.width, b.height];
  }, target);
  if (!r) throw new Error("no rect " + key);
  RECTS[key] = r.map((v) => Math.round(v * 1.5));
}
async function shot(page, name, full = false) {
  await page.screenshot({ path: `${OUT}/${name}.webp`, type: "webp", quality: 90, fullPage: full });
  console.log("shot", name);
}
async function click(page, text) {
  for (const h of await page.$$("button,label,[role=radio],a")) {
    if (await h.evaluate((e, t) => !!e.offsetParent && e.innerText.trim().startsWith(t), text)) {
      await h.click();
      await sleep(450);
      return;
    }
  }
  throw new Error("no button: " + text);
}
async function paste(page, selector, text) {
  await page.evaluate((sel, txt) => {
    const ta = document.querySelector(sel);
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set.call(ta, txt);
    ta.dispatchEvent(new Event("input", { bubbles: true }));
  }, selector, text);
}
// hide the caret and freeze CSS transitions/animations for crisp, repeatable stills
async function still(page) {
  await page.addStyleTag({ content: "*{caret-color:transparent!important}" });
}

async function form(page, prefix) {
  await page.goto(ORIGIN + "/application", { waitUntil: "networkidle0" });
  await still(page);
  await sleep(500);
  if (prefix) { await shot(page, "a01-about-empty"); await rect(page, "name", "#name"); await rect(page, "schule", "text:Schule"); await rect(page, "stage", "#stage-detail").catch(() => {}); await rect(page, "interests", "#interests"); }
  await page.type("#name", "Peter");
  await click(page, "Schule");
  await page.$eval("#name", (e) => e.blur());
  await sleep(250);
  if (prefix) await shot(page, "a01b-about-schule");
  await page.type("#stage-detail", "Klasse 10");
  await page.type("#interests", "Minecraft, mit Freunden zocken");
  await page.$eval("#interests", (e) => e.blur());
  await sleep(300);
  if (prefix) { await shot(page, "a02-about-filled"); await rect(page, "stage", "#stage-detail"); await rect(page, "interests", "#interests"); await rect(page, "about-next", "text:Weiter"); }
  await click(page, "Weiter");
  await sleep(300);
  if (prefix) { await shot(page, "a03-goal-empty"); await rect(page, "hausaufgaben", "text:Hausaufgaben schaffen"); await rect(page, "goal", "#goal"); await rect(page, "topic", "#topic"); await rect(page, "material", 'textarea[aria-label="Füg deinen Text ein"]'); await rect(page, "goal-next", "text:Weiter"); }
  await click(page, "Hausaufgaben schaffen");
  await page.type("#goal", "Hausaufgaben in unter 45 Minuten schaffen");
  await page.type("#topic", "Photosynthese");
  if (prefix) await shot(page, "a04-goal-typed");
  await paste(page, 'textarea[aria-label="Füg deinen Text ein"]', PETER_TEXT);
  await page.$eval('textarea[aria-label="Füg deinen Text ein"]', (e) => e.blur());
  await sleep(300);
  if (prefix) await shot(page, "a05-goal-material");
  await click(page, "Weiter");
  await sleep(300);
  if (prefix) { await shot(page, "a06-notes-empty"); await rect(page, "videos", "text:Kurze Videos"); await rect(page, "schritte", "text:Kleine Schritte mit Pausen"); await rect(page, "hard", "#hard"); await rect(page, "notes", "#notes"); await rect(page, "notes-next", "text:Weiter"); }
  await click(page, "Kurze Videos");
  await click(page, "Kleine Schritte mit Pausen");
  await page.type("#hard", "Ich fang einfach nicht an. Und nach einer Seite Text weiß ich nicht mehr, was drinstand.");
  await page.type("#notes", "Ich habe ADHS. Abends kann ich mich am besten konzentrieren.");
  await page.$eval("#notes", (e) => e.blur());
  await sleep(300);
  if (prefix) await shot(page, "a07-notes-filled");
  await click(page, "Weiter");
  await sleep(1200);
  const h2 = () => page.$eval("h2", (e) => e.innerText);
  for (let i = 0; i < 20 && (await h2()).startsWith("Stimmt das"); i++) {
    if (prefix && i === 2) { await shot(page, "b01-deck-focus"); await rect(page, "stimmt", "text:Stimmt"); }
    if (prefix && i === 5) await shot(page, "b02-deck-start");
    const card = await page.evaluate(() => document.querySelector("main").innerText);
    if (prefix && card.includes("Morph fragt")) await shot(page, "b03-deck-morph");
    // Peter answers like Peter: the strengths that don't fit his ADHD get "Eher nicht"
    const notPeter = ["lange konzentriert", "von allein gut an", "selbstbewusst"].some((t) => card.includes(t));
    await click(page, notPeter ? "Eher nicht" : "Stimmt");
    await sleep(650);
  }
  await sleep(1500);
  if (prefix) { await shot(page, "b04-summary"); await rect(page, "summary-ok", "text:Stimmt so"); await rect(page, "about-you", "#about_you"); }
  await click(page, "Stimmt so");
  await sleep(700);
  if (prefix) { await shot(page, "b05-review"); await rect(page, "build", "text:Mein Werkzeug bauen"); }
  if (prefix) await shot(page, "b05-review-full", true);
}

(async () => {
  // Home: Peter arrives
  {
    const { browser, page } = await open();
    await page.goto(ORIGIN + "/", { waitUntil: "networkidle0" });
    await still(page);
    await sleep(1200);
    await shot(page, "a00-home");
    await rect(page, "start", "text:Los geht");
    await browser.close();
  }
  // Run A: main path
  {
    const { browser, page } = await open();
    await page.evaluateOnNewDocument(() => { window.__DELAY = 0.4; });
    await form(page, true);
    await click(page, "Mein Werkzeug bauen");
    await sleep(1200);
    await shot(page, "d01-magic");
    await rect(page, "open", "text:Lösung öffnen");
    await click(page, "Lösung öffnen");
    await sleep(900);
    await shot(page, "d02-loader-a");
    await sleep(1300);
    await shot(page, "d03-loader-b");
    await sleep(3200);
    await shot(page, "d04-lesson-top");
    await shot(page, "d05-lesson-full", true);
    // Peter uses the lesson: card close-ups of the lab, the quiz and the flashcard
    const card = async (needle) => {
      for (const h of await page.$$("main section, main article, main div")) {
        const ok = await h.evaluate((e, t) => e.children.length > 1 && e.innerText.startsWith(t) && e.getBoundingClientRect().height < 1200, needle);
        if (ok) return h;
      }
      throw new Error("no card " + needle);
    };
    for (const [key, needle] of [["l-mission", "Deine Mission"], ["l-chunk", "Pflanzen sind"], ["l-lab", "Dein Photosynthese-Labor"], ["l-quiz", "Was gibt die Pflanze"], ["l-flash", "Chlorophyll"]]) {
      const h = await card(needle);
      const r = await h.evaluate((e) => { const b = e.getBoundingClientRect(); return [b.x, b.y + scrollY, b.width, b.height]; });
      RECTS[key] = r.map((v) => Math.round(v * 1.5));
    }
    await rect(page, "l-title", "main h1, main h2");
    await rect(page, "l-slider", 'input[type="range"]');
    const lab = await card("Dein Photosynthese-Labor");
    await lab.screenshot({ path: OUT + "/e01-lab-start.webp", type: "webp", quality: 90 });
    const sliders = await page.$$('input[type="range"]');
    console.log("sliders", sliders.length);
    await sliders[0].focus();
    for (let i = 0; i < 30; i++) { await page.keyboard.press("ArrowRight"); }
    await page.evaluate(() => document.activeElement.blur());
    await sleep(300);
    await lab.screenshot({ path: OUT + "/e02-lab-mid.webp", type: "webp", quality: 90 });
    await sliders[0].focus();
    for (let i = 0; i < 40; i++) { await page.keyboard.press("ArrowRight"); }
    await page.evaluate(() => document.activeElement.blur());
    await sleep(300);
    await lab.screenshot({ path: OUT + "/e03-lab-high.webp", type: "webp", quality: 90 });
    await click(page, "Sauerstoff");
    await page.mouse.move(5, 5);
    await page.evaluate(() => document.activeElement.blur());
    await sleep(400);
    const quiz = await card("Was gibt die Pflanze");
    await quiz.screenshot({ path: OUT + "/e04-quiz-right.webp", type: "webp", quality: 90 });
    await click(page, "Chlorophyll");
    await sleep(700);
    const flash = await card("Der grüne Farbstoff").catch(() => null);
    if (flash) await flash.screenshot({ path: OUT + "/e05-flash-back.webp", type: "webp", quality: 90 });
    await shot(page, "e06-lesson-used-full", true);
    await browser.close();
  }
  // Run B: assessment path (solution picking)
  {
    const { browser, page } = await open();
    await page.evaluateOnNewDocument(() => { window.__DELAY = 0.4; window.open = () => null; });
    await form(page, false);
    await click(page, "(DevMode)");
    await sleep(500);
    await shot(page, "c01-assess-progress");
    await sleep(1600);
    await shot(page, "c02-question");
    await rect(page, "missionen", "text:Kleine Missionen");
    await click(page, "Kleine Missionen");
    await sleep(500);
    await shot(page, "c03-assess-progress2");
    await sleep(2200);
    await shot(page, "c04-themes");
    await rect(page, "erstellen", "text:Erstellen");
    const rows = await page.evaluate(() => {
      const p = [...document.querySelectorAll("p")].find((e) => e.innerText.startsWith("Das passt"));
      return [p, ...p.nextElementSibling.querySelectorAll("li")].map((e) => { const b = e.getBoundingClientRect(); return [b.x, b.y + scrollY, b.width, b.height]; });
    });
    rows.forEach((r, i) => { RECTS["theme" + i] = r.map((v) => Math.round(v * 1.5)); });
    await rect(page, "themes-list", "ol.list-decimal");
    await sleep(3500);
    await shot(page, "c05-themes-research");
    await shot(page, "c06-themes-full", true);
    await browser.close();
  }
  fs.writeFileSync(OUT + "/rects.json", JSON.stringify(RECTS, null, 1));
})().catch((e) => { console.error(e); process.exit(1); });
