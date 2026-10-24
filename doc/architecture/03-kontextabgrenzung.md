# 3. Kontextabgrenzung

## 3.1 Fachlicher Kontext

```mermaid
flowchart LR
  learner[Lernende]
  material[Lernmaterial]
  system[Learning in Progress]
  sources[Wissens- und Forschungsquellen]

  learner -->|Profil, Ziele, Herausforderungen| system
  material -->|Upload| system
  system -->|angepasste Lernoberfläche| learner
  system -->|Recherche, was diesem Profil hilft| sources
```

| Nachbar | Input | Output |
| --- | --- | --- |
| Lernende | Profil, Ziele, was bereits funktioniert | Angepasste Oberfläche zum Lernen |
| Lernmaterial | Hochgeladene Inhalte, zum Beispiel Text oder Vorlesung | Inhalt in anderer Form, Wissen unverändert |
| Wissens- und Forschungsquellen | — | Belege dafür, welche Form diesem Profil hilft |

## 3.2 Technischer Kontext

```mermaid
flowchart LR
  browser[Browser]
  frontend[Frontend]
  backend[Backend]
  gemini[Gemini]

  browser --- frontend
  frontend <-->|HTTP| backend
  backend <-->|API, Details offen| gemini
```

Kanäle, Formate und Authentifizierung sind offen.
