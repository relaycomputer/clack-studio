# 🚀 Arduino-Flasher, Auto-Port-Erkennung & Web-Serial

Clack-Studio verfügt über einen integrierten Flasher, um geschriebene BASIC-Programme oder Maschinencode direkt über USB in das Speichersubsystem des Relaisrechners zu schreiben.

---

## 1. Funktionsweise

```mermaid
flowchart LR
    A["📜 BASIC oder Maschinencode"] --> B["⚡ '🚀 Auf Arduino flashen' Button"]
    B --> C["🔍 Automatische USB-Port-Erkennung (/api/ports)"]
    C --> D["⚡ DTR-Reset & Zeilenweiser Upload (115200 Baud)"]
    D --> E["🖥️ Live-Fortschritt & Bestätigung im Terminal-Log"]
    E --> F["🤖 Relais-Speichersubsystem & Computer starten!"]
```

---

## 2. Zwei Upload-Wege

1. **Backend Serial Flasher (`POST /api/flash`):**
   * Verwendet die Go-Serial-Bibliothek (`go.bug.st/serial`).
   * Führt einen Hardware-Reset via DTR-Signal aus.
   * Sendet Zeile für Zeile (`CLR`, `addr val`, `RUN`) mit Pacing-Pufferung.
2. **Web Serial API (`navigator.serial`):**
   * Ermöglicht in Chromium-Browsern (Chrome, Brave, Edge) oder der installierten PWA das direkte Flashen vom Browser auf den Arduino über USB.
