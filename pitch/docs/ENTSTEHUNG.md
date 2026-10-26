# Wie das Pitch-Deck entstanden ist

Dieses Deck wurde am Hackathon-Wochenende (25.–26. Oktober 2026) gemeinsam von einem Teammitglied und
einem KI-Coding-Agenten (Claude Code) gebaut. Das Teammitglied hat Inhalt, Dramaturgie und jede Änderung
vorgegeben, der Agent hat umgesetzt, geprüft und Vorschläge gemacht. Das passt zum Thema des ersten Teils
der Präsentation: Die KI ist der Handwerker, den Bauplan machen wir.

## Ausgangslage

- **Ein Konzept-Entwurf** mit 16 Folien: pro Folie eine kleine Überschrift, sichtbarer Text, Animationsideen und Moderatornotizen. Offene Stellen waren mit „?“ markiert.
- **Das Produkt-Repo** [learning-in-progress](https://github.com/learning-in-progress-hackathon/learning-in-progress) mit dem [Style Guide](https://github.com/learning-in-progress-hackathon/learning-in-progress/blob/main/doc/design/STYLE_GUIDE.md).
- **Ein zweiter Entwurf** eines Kollegen für einen Teil über unsere KI-Nutzung („Der Handwerker“), mit genauen Folienvorgaben und Sprechtexten.
- **Zwei Bilder** aus dem Team: ein Lernzimmer mit Osmose-Simulation und ein blauer Flauschblob mit Baskenmütze.

## Werkzeuge

- **[HyperFrames](https://hyperframes.heygen.com) 0.8.195** im Slideshow-Modus: Folien sind HTML-Kompositionen mit GSAP-Zeitachse, `hyperframes present` liefert Präsenter-Ansicht, Publikumsfenster und Sprechtexte.
- **Claude Code** als Agent. An drei Stellen hat er auf Wunsch je drei Unter-Agenten parallel an verschiedenen Folien arbeiten lassen.
- **Headless Chrome** mit `hyperframes check` und `hyperframes snapshot`: Nach jeder Änderung wurde das Deck automatisch geprüft und als Standbild an jedem Klick-Stopp angesehen.

## Ablauf in Iterationen

1. **Erster Entwurf (16 Folien).**
   - Umsetzung des Konzepts im Style Guide: Cream-Hintergrund, Tinte, ein Lila-Akzent, DM Sans mit Fraunces-Hervorhebung.
   - Offene „?“-Stellen blieben als Platzhalter.
   - Danach haben drei Agenten parallel je ein Drittel der Folien verfeinert. Dafür wurde jede Folie in eine eigene Datei aufgeteilt, damit sich die Agenten nicht gegenseitig überschreiben.
2. **Spannungsbogen.** Folie 6 wurde von „Die Lösung“ zu „Was man bräuchte“ und endet mit „Aber das wären ja … 10.000 *UIs?!*“. Erst danach kommt „Gestatten, MORPH“.
3. **Feedback-Runde 1.**
   - **Tempo und Steuerung:** Animationen wurden schneller, Klicks sicherer, „zurück“ geht immer genau einen Schritt.
   - **Logo:** Das MORPH-Logo erscheint erst nach dem Reveal.
   - **Neue Folien:** Inklusion (Klassenzimmer) und „Das lohnt sich nicht“ (Markt-Grafik).
   - **Umgebaute Folien:** „AI is the limit“, DOTS/NOTS mit BIAS → SCIENCE und die Team-Folie.
4. **Teil des Kollegen.**
   - Seine neun Folien („Der Handwerker“) kamen vor die bisherige erste Folie und wurden an unseren Stil angepasst. Statt Anthrazit und Baustellen-Gelb gelten Cream und Lila, Gelb bleibt nur als Textmarker. Drei Agenten haben sie parallel gebaut.
   - Später wurden die zwei dunklen Fokus-Folien wieder entfernt.
5. **User Journey aus der echten App.** Statt Platzhaltern zeigen drei Folien Peters Weg durch MORPH: Ankommen, Verstehen, Erschaffen (Details unten). Eine vierte Folie zur Lösungsauswahl wurde wieder entfernt.
6. **Peters Lernseite.** Die generierte Seite auf der Erschaffen-Folie wurde durch eine eigens gestaltete, animierte Seite ersetzt: Ein Blattquerschnitt wird von 2D zur 3D-Explosionszeichnung (siehe Transparenz).

## Technische Entscheidungen

- **Eine Datei pro Folie** (`compositions/`). So konnten mehrere Agenten gleichzeitig arbeiten, und Änderungen bleiben übersichtlich.
- **Klick-Stopps statt Video.** HyperFrames navigiert in einer Slideshow, indem es auf feste Zeitpunkte springt. Damit Animationen trotzdem sichtbar ablaufen, passt ein Skript in `index.html` die Steuerung des Players an:
  - Vorwärts spielt bis zum nächsten Stopp ab, und ein früher Klick setzt die Animation fort.
  - Zurück springt einen Schritt.
  - Bei „Bewegung reduzieren“ springt das Deck direkt.
  - Weil das Skript interne Methoden nutzt, ist die HyperFrames-Version gepinnt.
- **Alles lokal.** Schriften kommen aus den npm-Paketen `@fontsource`, GSAP liegt in `assets/vendor/`. Das Deck läuft ohne Internet, wichtig bei Hackathon-WLAN.
- **Chaos-Folie aus einem Generator.** Die 74 Elemente der Überforderungs-Folie entstehen deterministisch aus `tools/build-chaos.cjs`. Bei Änderungen dieses Skript anpassen und `node tools/build-chaos.cjs` ausführen.

## Wie die App-Aufnahmen entstanden sind

Für die User-Journey-Folien wurde das Frontend aus dem Branch `integration/app` gebaut und in einem
Headless-Browser durchgeklickt: Peter tippt, wählt, fügt Material ein, beantwortet Karten und benutzt die
Lernseite. Von jedem Zustand gibt es einen Screenshot und die Position aller Felder und Knöpfe. Die Folien
spielen diese Aufnahmen im Browserfenster ab. Eine Kamera zoomt mit, Eingaben erscheinen Feld für Feld, und
ein Mauszeiger klickt die echten Knöpfe.

Peter ist die Demo-Persona aus dem Repo (`client/src/features/demo/personas.ts`): Klasse 10, Photosynthese,
ADHS, „kommt nicht ins Anfangen“.

Die Skripte liegen in `tools/journey-capture/`:

| Datei | Zweck |
| --- | --- |
| `harness.cjs` | startet Chrome und liefert die gebaute App ohne Server aus |
| `mocks.js` | beantwortet die API-Aufrufe der App im Browser |
| `capture.cjs` | geht Peters Weg und speichert Screenshots und `rects.json` |

Die Pfade in `harness.cjs` zeigen noch auf das temporäre Arbeitsverzeichnis, in dem die Aufnahmen
entstanden sind. Für eine neue Aufnahme müssen sie auf einen eigenen Checkout mit gebautem Client
(`client/dist`) und auf einen lokalen Chrome zeigen.

## Transparenz: Was echt ist und was nicht

**Echt**
- Alle App-Oberflächen auf den Journey-Folien: Startseite, Formular, Karten-Deck, Zusammenfassung, Prüfen, Magic-Seite und der Morph-Lader.
- Fragebogen und Profil-Bewertung rechnen exakt wie das Backend. Die Logik aus `server/app/scale.py` und den Routern wurde dafür nach JavaScript übertragen, weil das Backend lokal nicht lief (es braucht Python 3.14 und einen KI-Zugang).

**Simuliert**

Folgende Inhalte hätte im Live-Betrieb die KI erzeugt. Für die Aufnahmen wurden sie passend zu Peter vorgegeben:
- die zusätzliche Karte „Morph fragt“,
- die Zusammenfassung „Das habe ich verstanden“,
- die Rückfrage und die gewählten Lernwege,
- die Recherche-Ergebnisse.

Als Recherchequelle ist ein echtes Dokument aus dem Repo angegeben: *Teaching Children with ADHD* des
U.S. Department of Education. Die daraus abgeleiteten Strategien sind formuliert, nicht von der App erzeugt.

**Gestaltetes Zielbild**

Die Lernseite auf der Erschaffen-Folie (Blattquerschnitt, 2D → 3D-Explosionszeichnung, Lupe, Lichtfluss)
ist von Hand gestaltet und zeigt, wie eine Seite für Peter aussehen soll. Die App erzeugt heute Lernseiten
aus vorgegebenen Bausteinen (Text, Labor mit Reglern, Quiz, Karteikarte), aber keine solche 3D-Grafik.
Aufnahmen der tatsächlich generierten Seite liegen noch in `assets/journey/` (`d05-lesson-full.webp`,
`e01`–`e04`).

**Weitere Folien**
- **Folie 20 („generating a team slide“):** Die Generierungs-Animation ist inszeniert.
- **Folie 18:** Das Bild des Lernzimmers stammt aus dem Team.

## Bekannte Grenzen

- **Live-Durchklicken:** Der Agent konnte das Deck in seiner Sandbox nicht über `npm run present` starten. Geprüft wurde mit `hyperframes check` und mit Standbildern an jedem Klick-Stopp und an Zwischenpunkten.
- **Quiz-Antwort in der App:** In der echten App ist die gewählte, richtige Antwort beim Darüberfahren mit der Maus schlecht lesbar (weißer Text auf hellem Lila). Das ist in den Aufnahmen umgangen.
- **Tippfehler in der App:** Der DevMode-Knopf heißt „Mein Werzeug bauen“.
