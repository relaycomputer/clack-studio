# 🏛️ Architektur, Svelte 5 & Go Single-Binary

Clack-Studio ist als hybrides System aus einem extrem schnellen Go-Backend und einem modernen, reaktiven Svelte 5 Frontend aufgebaut.

---

## 1. Architekturübersicht

```mermaid
graph TD
    subgraph Frontend["Svelte 5 + Vite (Modular & Reaktiv)"]
        APP["App.svelte (Workbench Grid)"]
        APP --> HB["HeaderBar.svelte (Metriken & Theme-Picker)"]
        APP --> MD["MatrixDisplay.svelte (Canvas 32x32 ab 0x03C0 / 64x64)"]
        APP --> FP["Frontpanel.svelte (6x LED-Bars & Lampen)"]
        APP --> TC["TransportControls.svelte (RUN, PAUSE, STEP, Speed)"]
        APP --> BS["BasicStudio.svelte (CodeMirror 6 Editor)"]
        APP --> MS["MachineCodeStudio.svelte (Loader & Konverter)"]
        APP --> DA["Disassembler.svelte (Live RAM Trace)"]
        APP --> RM["RamHeatmap.svelte (1024-Wort Matrix)"]
        APP --> LA["LogicAnalyzer.svelte (Zyklustabelle & CSV)"]
        
        ST_CPU["cpuStore.svelte.js ($state)"]
        ST_SET["settingsStore.svelte.js ($state)"]
        AUDIO["relayAudio.js (Acoustic Synth)"]
    end

    subgraph GoBackend["Go Server (clack-studio)"]
        EMBED["//go:embed frontend/dist/*"]
        API["REST API (/api/compile, /api/flash, /api/ports)"]
        SIM["16-Bit Relais-Emulator Core"]
    end

    Frontend -->|HTTP / Embed| GoBackend
```

---

## 2. Warum Svelte 5?

* **Zero Virtual DOM Overhead:** Svelte 5 verwendet native `$state`-Runes. Bei 60 Hz Simulation wird kein virtueller Baum verglichen, sondern exakt die geänderten LEDs im DOM aktualisiert.
* **CodeMirror 6:** Vollwertiger BASIC-Editor mit Syntax-Highlighting für Schlüsselwörter (`LET`, `IF`, `FOR`, `CLS`, `PSET`, `REM`), Zahlen und Kommentare.
* **Single-Binary:** Alle kompilieren Frontend-Dateien (`frontend/dist`) sind per `//go:embed` fest in die Go-Binary eingebettet.
