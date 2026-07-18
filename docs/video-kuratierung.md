# Übungsvideos — Kuratierung (zur Freigabe)

Die Videos im **Wissen**-Tab kommen aus `lib/content/videos.ts`. Sie sind bewusst
sparsam und stammen aus etablierten, evidenzbasierten Kanälen. **Bitte kurz prüfen
und freigeben**, bevor wir weitere ergänzen — jeder Kanal kann die Einbettung
sperren; dann funktioniert in der App weiterhin der „Auf YouTube ansehen"-Link.

## Aktuell eingebunden

| Übung | Titel | Kanal | YouTube-ID | Status |
|---|---|---|---|---|
| Nordic Hamstring Curl | Aufbau & Progression | E3 Rehab | `_e9vFU9-tkc` | zu prüfen |
| Nordic Hamstring Curl | Kurzdemo | E3 Rehab | `9TemDaazL8A` | zu prüfen |

## Kanäle, die sich für weitere Videos anbieten

- **E3 Rehab** — evidenzbasierte Reha/Kraft, erlaubt i. d. R. Einbettung.
- **Physiotutors** — sauber erklärte Physio-Übungen.
- **The Run Experience** — Lauf-ABC, Steigerungen, Stabi.
- Für Waden/Sprunggelenk & Achilles: „Treat My Achilles" / Athletico-Physio-Kanäle.

## So fügst du ein Video hinzu

1. Video auf YouTube öffnen, ID aus der URL kopieren (`watch?v=<ID>`).
2. In `lib/content/videos.ts` einen Eintrag ergänzen (`youtubeId`, `title`, `channel`, `topic`).
3. In der App (Wissen-Tab) testen: Spielt der Embed ab? Falls „Video nicht verfügbar":
   anderer Kanal/Video wählen (Einbettung gesperrt).
