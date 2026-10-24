# 4. Lösungsstrategie

Der fachliche Ablauf ist Lernziel → Charakter / KI-Zwilling → Lernpfadkarte → Generative UI → Prüfung. Rohdaten fließen in den Charakter. Ausgeführt ist das in der [Laufzeitsicht](06-laufzeitsicht.md), getragen von den Bausteinen in der [Bausteinsicht](05-bausteinsicht.md).

| Ziel / Aufgabe | Lösungsansatz |
| --- | --- |
| Lernziel und Rohdaten aufnehmen | Web-Frontend (React, TypeScript) |
| Charakter, Lernpfadkarte und Oberfläche erzeugen | Backend (FastAPI) orchestriert die KI-Schicht (Gemini, TBD) |
| Lernpfadkarte als Oberfläche ausliefern | Generative UI im Browser |
| Großen Lösungsraum eingrenzen | Personas, siehe [Prozess](../process.md#fokussierung) |
