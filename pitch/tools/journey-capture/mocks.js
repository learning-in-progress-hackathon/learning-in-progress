// In-page stand-in for the MORPH API. /survey and /profile port the server's deterministic logic
// (server/app/routers/survey.py, profile.py, scale.py); the Hermes endpoints stream canned answers for Peter.
(function () {
  // randomUUID only exists in secure contexts; the capture origin is plain http
  if (!crypto.randomUUID) { let n = 0; crypto.randomUUID = () => "00000000-0000-4000-8000-" + String(++n).padStart(12, "0"); }
  const S = window.__SCALE;
  const loc = (e, k, lang) => (lang !== "en" && e[k + "_" + lang] !== undefined ? e[k + "_" + lang] : e[k]);
  window.__DELAY = 1; // capture script can speed up or slow down the streams

  function survey(lang) {
    const rs = S.response_scale;
    return {
      version: S.version,
      response_scale: { min: rs.min, max: rs.max, labels: loc(rs, "labels", lang) },
      categories: S.categories.map((c) => ({ id: c.id, title: loc(c, "title", lang), hint: loc(c, "hint", lang) })),
      questions: S.categories.flatMap((c) => c.items.map((i) => ({ id: i.id, category: c.id, text: loc(i, "text", lang), priority: i.priority }))),
      deck: S.categories.map((c) => ({
        category: c.id,
        title: loc(c, "title", lang),
        low: { text: loc(c.bands.low, "student_text", lang), reason: loc(c.bands.low, "student_reason", lang) },
        medium: { text: loc(c.bands.medium, "student_text", lang) },
        high: { text: loc(c.bands.high, "student_text", lang), reason: loc(c.bands.high, "student_reason", lang) },
      })),
    };
  }

  function bandFor(score) {
    for (const b of S.scoring.bands) if (b.min <= score && score <= b.max) return b.id;
    return "high";
  }
  function profile(req) {
    const lo = S.response_scale.min, hi = S.response_scale.max;
    const instr = {};
    for (const c of S.categories) {
      const vals = c.items.filter((i) => i.id in req.answers).map((i) => (i.reverse ? lo + hi - req.answers[i.id] : req.answers[i.id]));
      let band = "unknown";
      if (vals.length) {
        const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
        band = bandFor(Math.floor(((mean - lo) / (hi - lo)) * 100 + 0.5));
      } else if (req.bands && req.bands[c.id]) band = req.bands[c.id];
      if (band !== "unknown") instr[c.id] = c.bands[band].ai_instructions;
    }
    return { scale_version: S.version, student: req.student, goal: req.goal, material: req.material, learning_instructions: instr, preferences: req.preferences, about_you: req.about_you || "" };
  }

  const SOURCE = {
    source_title: "Teaching Children with ADHD: Instructional Strategies and Practices (U.S. Department of Education)",
    source_url: "https://www2.ed.gov/rschstat/research/pubs/adhd/adhd-teaching-2008.pdf",
  };

  const cards = {
    token: "peter-intake",
    cards: [
      { id: "h1", text: "Wenn eine Aufgabe groß aussieht, fange ich lieber gar nicht erst an.", yes: null, no: null },
      { id: "h2", text: "Wenn ich etwas ausprobieren kann, bleibe ich viel länger dran als beim Lesen.", yes: null, no: null },
      { id: "h3", text: "Ein Beispiel aus Minecraft würde mir helfen, Photosynthese zu verstehen.", yes: null, no: null },
    ],
  };
  const summary = {
    about_you:
      "Du lernst am besten in kleinen Schritten mit kurzen Pausen. Lange Texte verlierst du schnell, aber wenn du etwas ausprobieren kannst, bleibst du dran. Ein klarer, kleiner Start hilft dir, überhaupt anzufangen – und ein Bezug zu Minecraft macht es leichter.",
  };
  const research = {
    summary: "Kurze, klar strukturierte Einheiten, sofortiges Feedback und aktives Ausprobieren helfen Schülern mit ADHS beim Anfangen und Dranbleiben.",
    findings: [
      Object.assign({ need: "Kommt schwer ins Anfangen", strategy: "Aufgaben in kleine Teilschritte zerlegen", how_to_apply: "Jede Einheit beginnt mit einem Schritt, der unter zwei Minuten dauert." }, SOURCE),
      Object.assign({ need: "Verliert bei langen Texten den Faden", strategy: "Kurze Abschnitte, Schlüsselbegriffe hervorheben", how_to_apply: "Höchstens drei Sätze pro Block, Fachbegriffe fett." }, SOURCE),
      Object.assign({ need: "Braucht schnelle Rückmeldung", strategy: "Sofortiges Feedback zu jeder Antwort", how_to_apply: "Nach jedem Block eine Mini-Frage mit direkter Auflösung." }, SOURCE),
    ],
  };

  const lab = {
    type: "Lab",
    props: {
      title: "Dein Photosynthese-Labor",
      sliders: [
        { key: "licht", label: "Lichtstärke", unit: "%", min: 0, max: 100, step: 1, value: 25, effect: "saturating", k: 30 },
        { key: "co2", label: "CO₂-Gehalt", unit: "ppm", min: 0, max: 1000, step: 10, value: 400, effect: "saturating", k: 250 },
        { key: "temp", label: "Temperatur", unit: "°C", min: 0, max: 45, step: 1, value: 25, effect: "optimum", k: 25, width: 12 },
      ],
      output: { label: "Fotosyntheserate", unit: "%", max: 100 },
      notes: [
        { upTo: 20, text: "Bei wenig Licht fehlt der Pflanze Energie." },
        { upTo: 60, text: "Mehr Licht, mehr Zucker – die Rate steigt." },
        { upTo: 100, text: "Jetzt bremst nicht mehr das Licht, sondern CO₂ oder Temperatur." },
      ],
      source: "Mit dieser Energie bauen die Pflanzen aus Kohlenstoffdioxid aus der Luft und Wasser aus dem Boden Traubenzucker (Glucose) auf.",
    },
    children: [],
  };
  const lessonElements = {
    lesson: { type: "Lesson", props: { title: "Mission Photosynthese" }, children: ["b1", "b2", "b3", "b4", "b5"] },
    b1: { type: "Steps", props: { title: "Deine Mission in 3 Schritten", steps: [ { label: "Bauen", text: "Bau dir im Labor eine Pflanze, die richtig viel Zucker macht." }, { label: "Herausfinden", text: "Finde heraus, was sie bremst." }, { label: "Prüfen", text: "Beantworte eine Frage – fertig!" } ], source: "Die Photosynthese läuft in zwei Schritten ab." }, children: [] },
    b2: { type: "Chunk", props: { heading: "Pflanzen sind kleine Zuckerfabriken", text: "Wie dein Ofen in Minecraft: Rein kommen Licht, Wasser und CO₂ – raus kommen Zucker und Sauerstoff. Die Fabrik heißt Chloroplast.", source: "In den Chloroplasten der Blattzellen fängt der grüne Farbstoff Chlorophyll Lichtenergie ein." }, children: [] },
    b3: lab,
    b4: { type: "Quiz", props: { question: "Was gibt die Pflanze bei der Photosynthese an die Luft ab?", options: ["Kohlenstoffdioxid", "Sauerstoff", "Traubenzucker"], answer: 1, explanation: "Sauerstoff entsteht und geht über die Spaltöffnungen nach draußen.", source: "Dabei entsteht Sauerstoff, den die Pflanze über die Spaltöffnungen an die Luft abgibt." }, children: [] },
    b5: { type: "Flashcard", props: { front: "Chlorophyll", back: "Der grüne Farbstoff, der Lichtenergie einfängt.", source: "der grüne Farbstoff Chlorophyll" }, children: [] },
  };

  let assessCalls = 0;
  const assessAnswers = [
    { done: false, question: "Was hilft dir eher, dranzubleiben?", options: ["Kleine Missionen mit Belohnung", "Ein Beispiel aus Minecraft", "Erst ausprobieren, dann lesen"], themes: [] },
    {
      done: true, question: "", options: [],
      themes: [
        { theme: "sim-missions", reason: "Du bleibst dran, wenn du selbst ausprobieren kannst – ein Labor statt einer Textseite." },
        { theme: "chunked", reason: "Kleine Schritte mit klarem Start, damit das Anfangen leicht fällt." },
        { theme: "hobby-framing", reason: "Photosynthese erklärt mit Minecraft: Der Chloroplast ist dein Ofen." },
      ],
    },
  ];

  function stream(events) {
    const enc = new TextEncoder();
    return new ReadableStream({
      async start(ctrl) {
        for (const [wait, event, data] of events) {
          await new Promise((r) => setTimeout(r, wait * window.__DELAY));
          ctrl.enqueue(enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        }
        ctrl.close();
      },
    });
  }
  const json = (data, wait = 300) => new Promise((r) => setTimeout(() => r(new Response(JSON.stringify(data), { status: 200, headers: { "Content-Type": "application/json" } })), wait * window.__DELAY));
  const sse = (events) => Promise.resolve(new Response(stream(events), { status: 200, headers: { "Content-Type": "text/event-stream" } }));

  const realFetch = window.fetch.bind(window);
  window.fetch = function (input, init) {
    const url = new URL(typeof input === "string" ? input : input.url, location.href);
    if (!url.pathname.startsWith("/api/")) return realFetch(input, init);
    const p = url.pathname.slice(4);
    const body = init && init.body ? JSON.parse(init.body) : {};
    if (p === "/survey") return json(survey(url.searchParams.get("lang") || "de"), 50);
    if (p === "/profile") return json(profile(body), 600);
    if (p === "/intake/cards") return json(cards, 900);
    if (p === "/intake/summary") return json(summary, 1500);
    if (p === "/research")
      return sse([
        [400, "status", { text: "Suche nach Studien zu ADHS und Lernen…" }],
        [1400, "status", { text: "Lese: Teaching Children with ADHD (U.S. Department of Education)" }],
        [1600, "status", { text: "Leite Strategien für Peter ab…" }],
        [1200, "done", research],
      ]);
    if (p === "/assess") {
      const reply = assessAnswers[Math.min(assessCalls++, assessAnswers.length - 1)];
      return sse([
        [300, "status", { text: "Hermes liest dein Profil…" }],
        [500, "reasoning", { text: "Peter fängt schwer an und verliert bei langen Texten den Faden. " }],
        [700, "reasoning", { text: "Er mag kurze Videos und kleine Schritte; Minecraft als Bezug. " }],
        [700, "status", { text: "Hermes gleicht das Material ab…" }],
        [800, "done", reply],
      ]);
    }
    if (p === "/solution") return json({ spec: { root: "lesson", elements: lessonElements } }, 9000);
    if (p === "/generate") {
      const ev = [
        [300, "status", { text: "Morph liest deinen Text…" }],
        [500, "patch", { patch: { op: "add", path: "/root", value: "lesson" } }],
        [100, "patch", { patch: { op: "add", path: "/elements/lesson", value: lessonElements.lesson } }],
      ];
      ["b1", "b2", "b3", "b4", "b5"].forEach((k, i) => {
        ev.push([i === 0 ? 700 : 900, "status", { text: i < 2 ? "Morph formt deine Seite…" : "Fast fertig…" }]);
        ev.push([200, "patch", { patch: { op: "add", path: "/elements/" + k, value: lessonElements[k] } }]);
      });
      ev.push([500, "done", { spec: { root: "lesson", elements: lessonElements } }]);
      return sse(ev);
    }
    return json({ detail: "not mocked: " + p }, 10).then((r) => new Response(r.body, { status: 404 }));
  };
})();
