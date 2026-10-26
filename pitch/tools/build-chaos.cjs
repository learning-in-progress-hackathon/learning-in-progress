// Generates compositions/c07.html (the chaos slide) from deterministic code.
const fs = require("fs");
const OUT = require("path").join(__dirname, "..", "compositions") + "/";

const chaosCss = (S) => `
    ${S} .cx-field { position: absolute; inset: 0; }
    ${S} .cx {
      position: absolute;
      left: 0;
      top: 0;
      background: #fff;
      border: 1px solid #e5e1d9;
      border-radius: 18px;
      box-shadow: 0 18px 50px rgba(60, 53, 88, 0.12);
      overflow: hidden;
      opacity: 0;
      will-change: transform, opacity;
    }
    ${S} .cx i { display: block; height: 10px; border-radius: 5px; background: #e4e0d8; flex: none; }
    ${S} .cx b { display: block; border-radius: 6px; flex: none; }
    ${S} .cx-chat { border-radius: 26px; padding: 18px 22px; display: flex; gap: 14px; align-items: flex-start; }
    ${S} .cx-chat.me { background: #f0ecfb; border-color: #ddd5f6; }
    ${S} .cx-chat .av { width: 34px; height: 34px; border-radius: 50%; flex: none; }
    ${S} .cx-chat .tx { flex: 1; display: flex; flex-direction: column; gap: 9px; padding-top: 4px; }
    ${S} .cx-term { background: #292632; border-color: #292632; box-shadow: 0 20px 56px rgba(41, 38, 50, 0.24); }
    ${S} .cx-term .bar, ${S} .cx-win .bar { height: 30px; display: flex; gap: 7px; align-items: center; padding: 0 14px; }
    ${S} .cx-term .bar { background: #34303f; }
    ${S} .cx-dot { width: 10px; height: 10px; border-radius: 50%; background: #d8d3e3; flex: none; }
    ${S} .cx-term .bar .cx-dot { background: #5a5468; }
    ${S} .cx-term .body { padding: 14px 18px; display: flex; flex-direction: column; gap: 8px; font-family: "JetBrains Mono", monospace; font-size: 15px; line-height: 1.25; color: #d6d2e0; white-space: nowrap; }
    ${S} .cx-term .body .ok { color: #a9d4bf; }
    ${S} .cx-term .body .pr { color: #bcb0f2; }
    ${S} .cx-code { padding: 18px 20px; display: flex; flex-direction: column; gap: 10px; }
    ${S} .cx-code .ln { display: flex; gap: 8px; }
    ${S} .cx-code .ln b { height: 10px; }
    ${S} .cx-note { border-radius: 20px; padding: 16px 20px; display: flex; gap: 16px; align-items: center; }
    ${S} .cx-note .ic { width: 44px; height: 44px; border-radius: 13px; flex: none; }
    ${S} .cx-note .tx { flex: 1; display: flex; flex-direction: column; gap: 9px; }
    ${S} .cx-note .badge { width: 26px; height: 26px; border-radius: 50%; background: #e67f63; flex: none; }
    ${S} .cx-win .bar { background: #f3f0ea; border-bottom: 1px solid #e5e1d9; }
    ${S} .cx-win .tabs { display: flex; gap: 6px; margin-left: 10px; align-self: flex-end; }
    ${S} .cx-win .tab { width: 74px; height: 22px; border-radius: 8px 8px 0 0; background: #e8e4dc; }
    ${S} .cx-win .tab.on { background: #fff; }
    ${S} .cx-win .url { margin: 12px 16px 0; height: 22px; border-radius: 11px; background: #f3f0ea; }
    ${S} .cx-win .pg { padding: 14px 16px 16px; display: flex; gap: 12px; }
    ${S} .cx-win .pg .hero { width: 38%; border-radius: 10px; flex: none; }
    ${S} .cx-win .pg .col { flex: 1; display: flex; flex-direction: column; gap: 9px; }
`;

// Shared, deterministic chaos: build(field) creates the cards; render(T) poses them
// for "chaos time" T (identical function in c07 and c08, so c08 frame 0 == c07 @5.4).
const chaosJs = `
      function mkChaos(field) {
        var TILES = ["#e9e3fb", "#e3eef5", "#e3f0e9", "#f8e7df", "#eee8f7", "#f7efce"];
        var INK = ["#6955c6", "#e67f63", "#89b6a1", "#47718a", "#b2644f", "#755899"];
        var TERM = [
          ["<span class=pr>$</span> npm run dev", "compiling 214 modules", "<span class=ok>ready</span> in 1.8s"],
          ["<span class=pr>$</span> git pull --rebase", "CONFLICT src/app.ts", "fix and continue"],
          ["<span class=pr>$</span> claude --resume", "reading 38 files", "<span class=ok>done</span> 12 edits"],
          ["<span class=pr>$</span> pytest -q", "41 passed, 3 failed", "rerun --lf"],
          ["<span class=pr>$</span> docker compose up", "db  starting", "api waiting"]
        ];
        var N = 74, items = [];
        function H(i, k) { var h = Math.imul((i + 1) * 73856093 ^ (k + 7) * 19349663, 2654435761) >>> 0; h ^= h >>> 15; return (Math.imul(h, 2246822519) >>> 0); }
        function r(i, k, a, b) { return a + (H(i, k) % 10000) / 10000 * (b - a); }
        function bars(i, n, min, max) { var s = ""; for (var j = 0; j < n; j++) s += '<i style="width:' + Math.round(r(i, 40 + j, min, max)) + '%"></i>'; return s; }
        for (var i = 0; i < N; i++) {
          var kind = H(i, 1) % 5, el = document.createElement("div"), w, html = "";
          var t = TILES[H(i, 2) % 6], ink = INK[H(i, 3) % 6];
          if (kind === 0) {
            w = Math.round(r(i, 4, 240, 380));
            el.className = "cx cx-chat" + (H(i, 5) % 3 === 0 ? " me" : "");
            html = '<span class="av" style="background:' + t + '"></span><div class="tx">' + bars(i, 2 + H(i, 6) % 2, 45, 100) + "</div>";
          } else if (kind === 1) {
            w = Math.round(r(i, 4, 330, 440));
            var L = TERM[H(i, 7) % TERM.length];
            el.className = "cx cx-term";
            html = '<div class="bar"><span class="cx-dot"></span><span class="cx-dot"></span><span class="cx-dot"></span></div><div class="body"><div>' + L.join("</div><div>") + "</div></div>";
          } else if (kind === 2) {
            w = Math.round(r(i, 4, 280, 400));
            el.className = "cx cx-code";
            var n = 4 + H(i, 8) % 3;
            for (var j = 0; j < n; j++) {
              var ind = (H(i, 60 + j) % 3) * 22;
              html += '<div class="ln" style="padding-left:' + ind + 'px"><b style="width:' + Math.round(r(i, 70 + j, 30, 70)) + 'px;background:' + INK[H(i, 80 + j) % 6] + ';opacity:.55"></b><i style="width:' + Math.round(r(i, 90 + j, 40, 150)) + 'px"></i></div>';
            }
          } else if (kind === 3) {
            w = Math.round(r(i, 4, 300, 420));
            el.className = "cx cx-note";
            html = '<span class="ic" style="background:' + t + '"></span><div class="tx"><b style="height:12px;width:' + Math.round(r(i, 9, 40, 70)) + '%;background:' + ink + ';opacity:.5"></b>' + bars(i, 1, 60, 95) + '</div>' + (H(i, 10) % 2 ? '<span class="badge"></span>' : "");
          } else {
            w = Math.round(r(i, 4, 380, 500));
            el.className = "cx cx-win";
            var tabs = 2 + H(i, 11) % 3, tb = "";
            for (var j = 0; j < tabs; j++) tb += '<span class="tab' + (j === 0 ? " on" : "") + '"></span>';
            html = '<div class="bar"><span class="cx-dot"></span><span class="cx-dot"></span><span class="cx-dot"></span><span class="tabs">' + tb + '</span></div><div class="url"></div><div class="pg"><b class="hero" style="background:' + t + ';height:' + Math.round(r(i, 12, 70, 110)) + 'px"></b><div class="col">' + bars(i, 4, 40, 100) + "</div></div>";
          }
          el.style.width = w + "px";
          el.innerHTML = html;
          el.setAttribute("aria-hidden", "true"); el.setAttribute("data-layout-ignore", ""); el.setAttribute("data-contrast-ignore", "");
          field.appendChild(el);
          // spread: golden-ratio sequence for coverage + hash jitter, slight overflow at edges
          var gx = (i * 0.6180339887 + 0.13) % 1, gy = (i * 0.7548776662 + 0.41) % 1;
          items.push({
            el: el,
            x: -120 + gx * 1900 + r(i, 20, -60, 60) - w / 2 + 120,
            y: -60 + gy * 1080 + r(i, 21, -50, 50) - 60,
            rot: r(i, 22, -4.5, 4.5),
            s0: 0.15 + 3.75 * Math.sqrt(i / (N - 1)),
            ax: r(i, 23, 6, 16), ay: r(i, 24, 5, 12),
            wx: r(i, 25, 0.45, 0.95), wy: r(i, 26, 0.4, 0.85),
            px: r(i, 27, 0, 6.28), py: r(i, 28, 0, 6.28)
          });
        }
        return function render(T) {
          for (var k = 0; k < items.length; k++) {
            var it = items[k], p = (T - it.s0) / 0.5;
            p = p < 0 ? 0 : p > 1 ? 1 : p;
            var e = 1 - Math.pow(1 - p, 3);
            var dx = it.ax * Math.sin(T * it.wx + it.px), dy = it.ay * Math.sin(T * it.wy + it.py);
            it.el.style.opacity = e.toFixed(4);
            it.el.style.transform = "translate(" + (it.x + dx).toFixed(2) + "px," + (it.y + dy + 34 * (1 - e)).toFixed(2) + "px) rotate(" + it.rot.toFixed(2) + "deg) scale(" + (0.92 + 0.08 * e).toFixed(4) + ")";
          }
        };
      }
`;

const cardCss = (S) => `
    ${S} .veil {
      position: absolute;
      left: 50%;
      top: 50%;
      width: 1700px;
      height: 900px;
      margin: -450px 0 0 -850px;
      border-radius: 50%;
      background: radial-gradient(closest-side, rgba(247, 245, 239, 0.9), rgba(247, 245, 239, 0.55) 55%, rgba(247, 245, 239, 0));
    }
    ${S} .card {
      position: absolute;
      left: 50%;
      top: 50%;
      width: 1240px;
      margin: -150px 0 0 -620px;
      padding: 56px 64px 60px;
      border-radius: 32px;
      background: #fff;
      border: 1px solid #e5e1d9;
      box-shadow: 0 30px 90px rgba(60, 53, 88, 0.2);
      text-align: center;
    }
    ${S} .card p {
      font-size: 64px;
      font-weight: 600;
      line-height: 1.12;
      letter-spacing: -0.045em;
      color: #292632;
    }
    ${S} .card p + p { margin-top: 14px; }
    ${S} .card p.a { color: #706b78; font-weight: 500; font-size: 56px; }
`;
const cardHtml = (P) => `
      <div class="veil" id="${P}-veil" aria-hidden="true"></div>
      <div class="card" id="${P}-card">
        <p class="a">Für uns: ein Hackathon.</p>
        <p>Für Menschen mit ADHS: <em>jeder Lerntag.</em></p>
      </div>`;

const head = (id, extraCss) => `<template>
  <style>
    #root { position: absolute; inset: 0; }
    .${id} { font-family: var(--font-sans); }
${extraCss}
  </style>`;

// ---------- c07 ----------
const c07 = `${head("c07", chaosCss(".c07") + cardCss(".c07"))}
  <div id="root" data-composition-id="c07" data-width="1920" data-height="1080" data-layout-allow-overlap>
    <div class="slide c07">
      <div class="cx-field" id="c07-field" aria-hidden="true" data-layout-ignore></div>${cardHtml("c07")}
    </div>
  </div>
  <script>
    (function () {${chaosJs}
      var render = mkChaos(document.getElementById("c07-field"));
      var tl = gsap.timeline({ paused: true });
      // chaos clock: local time == chaos time; cards pile up 0 -> 4.4, drift never stops
      var clock = { T: 0 };
      tl.fromTo(clock, { T: 0 }, { T: 5.8, duration: 5.8, ease: "none", onUpdate: function () { render(clock.T); } }, 0);
      render(0);
      // click (4.5): a calm card in the middle of the noise
      tl.fromTo("#c07-veil", { opacity: 0 }, { opacity: 1, duration: 0.8, ease: "sine.inOut" }, 4.5);
      tl.fromTo("#c07-card", { opacity: 0, y: 30, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: "power3.out" }, 4.6);
      tl.set({}, {}, 5.8);
      window.__timelines["c07"] = tl;
    })();
  </script>
</template>
`;

fs.writeFileSync(OUT + "c07.html", c07);
console.log("ok");
