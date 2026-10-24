# 5. Bausteinsicht

Die Reihenfolge Lernziel → Charakter / KI-Zwilling → Lernpfadkarte → Generative UI → Prüfung steht in der [Laufzeitsicht](06-laufzeitsicht.md). Hier stehen die Teile, die diesen Ablauf tragen.

## 5.1 Whitebox Gesamtsystem

| Baustein | Verantwortung |
| --- | --- |
| Frontend | Nimmt Lernziel und Rohdaten auf, zeigt die generative UI |
| Backend | API und Orchestrierung von Charakter, Lernpfadkarte und Erzeugung der Oberfläche |
| AI Layer | Baut aus den Rohdaten den Charakter (KI-Zwilling), leitet die Lernpfadkarte ab und generiert die Oberfläche |

Schnittstellen zwischen den Bausteinen sind offen.

## 5.2 Whiteboxes der Ebene 2

Offen.
