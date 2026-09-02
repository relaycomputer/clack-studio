# ⚡ CLACK-STUDIO
**16-Bit Relay Computer Visual Hardware Lab & Emulator (Svelte 5 + Go)**

`clack-studio` ist ein eigenständiger visueller Hardware-Simulator und Debugger für den 16-Bit Relaisrechner mit modernem **Svelte 5 + Vite Web-Frontend**, **CodeMirror 6 BASIC IDE**, 64×64 / 32×32 LED Dot-Matrix Display, Frontpanel-LEDs, Logic Analyzer und Relais-Akustik.

---

## ✨ Features

1. **Modernes Svelte 5 + Vite Frontend:**
   * **Zero Virtual DOM Overhead:** Native Reaktivität mit Svelte 5 `$state` Runes für flüssige 60 FPS LED- und Matrix-Animationen.
   * **Dummy-Resistente Single-Binary:** Das gesamte Frontend ist per `//go:embed` fest in der Go-Binary verankert. Kein Node.js oder npm für den Anwender erforderlich!
   * **PWA Support:** Installierbar als eigenständige Desktop-/Tablet-App mit 100% Offline-Fähigkeit via Service Worker.

2. **CodeMirror 6 Clack-BASIC IDE:**
   * Echtes **Syntax-Highlighting** für BASIC (`LET`, `IF`, `FOR..NEXT`, `PSET`, `CLS`, `DATA/READ`, etc.).
   * Integrierte Vorlagen: 🏓 *Autonomes Ping-Pong*, 🎨 *4-Display Grafik-Demo*, 🔢 *Mathe & Logik*, 📋 *DATA/READ*.
   * **1-Klick Kompilieren & Sofortausführung** (`⚡ In Simulator laden & Reset`) in $<0.1\text{ ms}$.
   * Live Assembler-Listing & Disassembly Drawer.

3. **64×64 & 32×32 LED Dot-Matrix Display:**
   * **32×32 (4x Hardware Matrix):** Memory-Mapped ab `0x03C0` (`960`..`1023`).
   * **64×64 (Full Framebuffer):** Memory-Mapped ab `0x0300` (`768`..`1023`).
   * Einstellbarer Phosphor-/LED-Glow mit 4 Farbthemen: *Amber (Bernstein)*, *Phosphor Grün*, *Cyber Cyan*, *Rubin Rot*.

4. **Echtes Hardware-Frontpanel:**
   * **ACCU, IR, DATENBUS, ADRESSBUS, PC, STACK:** 16-Bit und 10-Bit LED-Leisten mit 4er-Nibble-Gruppierung.
   * **Statuslampen:** `READ`, `WRITE`, `C` (Carry), `Z` (Zero), `N` (Negative), `E` (Even).

5. **Akustik-Synthesizer (WebAudio):**
   * Authentischer zweistufiger mechanischer Relais-Klack (Anker-Impuls + Spulenresonanz) mit automatischer Browser-Freischaltung.

6. **1024-Wort RAM Heatmap & Logic Analyzer:**
   * Interaktive Speichermatrix mit Direkt-Editierung und Hover-Inspektor.
   * Zyklusgenaue Trace-Tabelle mit CSV-Export.

---

## 🚀 Starten

```bash
cd /home/veitscherbub/work/relay-computing/clack-studio

# Starten (Standard: Port 8080)
./bin/clack-studio

# Oder mit Go direkt:
go run . -port 8080
```

Öffne anschließend einfach **`http://localhost:8080`** im Browser!

---

## 🛠️ Für Entwickler (Frontend anpassen)

```bash
cd /home/veitscherbub/work/relay-computing/clack-studio/frontend

# Dev-Server mit Hot-Module-Reloading (HMR):
npm run dev

# Frontend neu bauen (wird in main.go eingebettet):
npm run build
```
