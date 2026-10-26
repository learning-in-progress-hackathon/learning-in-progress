# MORPH – Pitch-Deck

Die Pitch-Präsentation zu **MORPH**, unserem Beitrag zum Hackathon *Learning in Progress*.
MORPH erzeugt mit KI für jeden Menschen eine eigene, passende Lernoberfläche, abgestimmt auf seine
Fähigkeiten, Bedürfnisse und Interessen. Gleicher Lernstoff, völlig unterschiedliche Lernerlebnisse.

- Produkt-Repo: <https://github.com/learning-in-progress-hackathon/learning-in-progress>
- Live: <https://binnendifferenzierung.online>
- Wie das Deck entstanden ist: [docs/ENTSTEHUNG.md](docs/ENTSTEHUNG.md)
- Alle Folien mit Sprechtext: [docs/FOLIEN.md](docs/FOLIEN.md)

Das Deck ist mit [HyperFrames](https://hyperframes.heygen.com) gebaut: HTML, CSS und GSAP-Animationen,
die als klickbare Slideshow laufen. Es ist kein Video und kein PowerPoint.

## Präsentieren

Voraussetzung: Node.js (gebaut und geprüft mit v23) und ein Chromium-Browser (Chrome, Edge, Arc).

```bash
npm run present
```

Das startet einen lokalen Server und öffnet die Präsenter-Ansicht im Browser. Dort:

| Aktion | Taste |
| --- | --- |
| Publikumsfenster öffnen | **P** oder „Present“ |
| Nächster Schritt | → · Leertaste · Klick |
| Einen Schritt zurück | ← · Backspace |

- **Präsenter-Ansicht:** aktuelle Folie, nächste Folie, Sprechtext und Timer.
- **Bildschirm teilen:** In Google Meet den Publikums-**Tab** teilen. In Zoom das Publikumsfenster in ein eigenes Fenster ziehen und dieses Fenster teilen.
- **Wichtig:** `npm run present` verwenden, nicht `npx hyperframes present`. Das Skript pinnt die HyperFrames-Version, auf die unsere Navigation abgestimmt ist (siehe unten).
- **Offline:** Das Deck braucht kein Internet. Schriften und GSAP liegen im Projekt.
- **Nicht rendern:** `npm run render` ergibt bei einer Slideshow nur die erste Folie als MP4.

### Navigation

Ein Skript in `index.html` passt die Slideshow-Steuerung von HyperFrames an:

- **Vorwärts** spielt die Animation bis zum nächsten Stopp ab. Ein Klick mitten in einer Animation setzt sie fort, nichts geht kaputt.
- **Zurück** springt genau einen Schritt zurück, auch über Foliengrenzen.
- **Reduzierte Bewegung:** Ist im System „Bewegung reduzieren“ an, springt das Deck ohne Animation direkt zu jedem Schritt.

Das Skript greift auf interne Methoden des HyperFrames-Players zu. Deshalb ist die Version in
`package.json` gepinnt (`hyperframes@0.8.195`).

## Projektstruktur

```
index.html              Haupt-Komposition: gemeinsame Styles, Folien-Reihenfolge,
                        Klick-Stopps und Sprechtexte (Slideshow-JSON), Navigations-Skript
compositions/           eine Datei pro Folie
  c01–c07.html          Teil 1: „Der Handwerker“ – wie wir KI genutzt haben
  s01–s17.html          Teil 2: Problem, Idee, MORPH, User Journey, Team, Domain
assets/
  fonts/                DM Sans, Fraunces, Caveat (aus @fontsource, lokal)
  vendor/gsap.min.js    GSAP 3.14.2, lokal
  images/               Bilder aus dem Team (Lernzimmer, Blob mit Baskenmütze)
  journey/              Aufnahmen der echten MORPH-App für die User Journey
tools/
  build-chaos.cjs       erzeugt compositions/c07.html (die Überforderungs-Folie)
  journey-capture/      Skripte, mit denen die App-Aufnahmen entstanden sind
  export-notes.cjs      erzeugt docs/FOLIEN.md aus den Sprechtexten in index.html
docs/                   Entstehung des Decks und alle Sprechtexte
package.json            gepinnte HyperFrames-Befehle
```

Folien-Dateinamen und Folienposition stimmen nicht überein, weil Folien im Lauf der Arbeit eingefügt
und gelöscht wurden. Die Reihenfolge steht nur in `index.html`.

## Folienübersicht

| # | Datei | Folie | Klicks |
| --- | --- | --- | --- |
| 1 | c01 | Stellenanzeige – „Gesucht: *Handwerker.*“ | 1 |
| 2 | c02 | Arbeitszeugnis | 3 |
| 3 | c03 | Tempo – ~~Tage~~ → 30 Min | 2 |
| 4 | c04 | Bauplan – Mensch, KI, Mensch | 1 |
| 5 | c05 | Paradox – Hilfe der KI vs. was wir prüfen können | 1 |
| 6 | c06 | „Can you…?“ – künstliche und kulturelle Intelligenz | 2 |
| 7 | c07 | Überforderung | 1 |
| 8 | s01 | Bildung – „…viele wollen, aber *nicht können.*“ | 1 |
| 9 | s02 | Inklusion – gleicher Raum, andere Bedürfnisse | 2 |
| 10 | s03 | Binnendifferenzierung | – |
| 11 | s04 | Das lohnt sich nicht – zu wenige für einen Markt | 1 |
| 12 | s05 | In einer idealen Welt – eine UI für jeden einzeln | 1 |
| 13 | s06 | Was man bräuchte – 10.000 UIs?! | 1 |
| 14 | s07 | Gestatten, MORPH | – |
| 15 | s08 | Ankommen – Peters Onboarding (echte App) | 3 |
| 16 | s09 | Verstehen – Karten, Zusammenfassung, AI Twin | 2 |
| 17 | s11 | Erschaffen – Generierung und Peters Lernseite | 3 |
| 18 | s12 | The ~~Sky~~ AI is the limit | – |
| 19 | s13 | DOTS → NOTS, DSGVOh Yeah!, ~~BIAS~~ SCIENCE | 5 |
| 20 | s14 | „… generating a team slide …“ | – |
| 21 | s15 | Team – 10 Menschen, 1 KI | – |
| 22 | s16 | One more thing | – |
| 23 | s17 | Wir sind JETZT live auf: binnendifferenzierung.online | 1 |

## Bearbeiten

```bash
npm run dev        # Studio-Vorschau zum Bearbeiten
npm run check      # Prüfung: Lint, Laufzeit, Layout, Kontrast
npx hyperframes snapshot --at 12.5   # Standbild bei Sekunde 12.5 (siehe index.html für die Zeiten)
```

- **Design:** Gestaltung nach dem [Style Guide](https://github.com/learning-in-progress-hackathon/learning-in-progress/blob/main/doc/design/STYLE_GUIDE.md) des Produkts: Cream-Hintergrund, ein Lila-Akzent, DM Sans mit Fraunces-Hervorhebung.
- **Zeitachse:** Jede Folie ist ein Abschnitt auf einer gemeinsamen Zeitachse. Die Klick-Stopps sind absolute Sekunden in `index.html`. Wer eine Folie verlängert, muss die Startzeiten aller folgenden Folien und ihre Klick-Stopps mitverschieben.
