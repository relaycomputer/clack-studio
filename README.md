# ⚡ CLACK-STUDIO
**16-Bit Relay Computer Visual Hardware Lab & Emulator (Svelte 5 + Go)**

`clack-studio` ist ein eigenständiger visueller Hardware-Simulator, Assembler, Compiler und Debugger für den 16-Bit Relaisrechner mit modernem **Svelte 5 + Vite Web-Frontend**, **CodeMirror 6 BASIC & Assembler IDE**, 64×64 / 32×32 Multi-Color LED Matrix Display, Frontpanel-LEDs, Logic Analyzer, zyklengenauer Relais-Akustik und Arduino-Flasher.

---

## ✨ Features (v2.5.2)

### 1. ⏱️ Cycle-Accurate Timing & Hardware-Metriken (Neu in v2.5.1)
* **Befehlsgenaue Takt-Gewichtung:**
  * `NOP`: 1 Takt (~50 ms)
  * `LDA #imm`, `ADD #imm`, `AND`, `OR`, `NOT`, `SHR`, `SHL`, `BA`, `BC`, `BN`, `BE`, `BZ`, `RET`: 2 Takte (~100 ms)
  * `LDAM addr`, `STAM addr`, `CALL addr`: 3 Takte (~150 ms)
  * `LDAMM [ptr]`, `STAMM [ptr]`: 4 Takte (~200 ms)
* **Differenzierte Zähler:**
  * `BEFEHLE`: Anzahl logisch ausgeführter Befehlsschritte.
  * `CYCLES`: Exakte Summe der physikalischen Hardware-Maschinentakte.
  * `RELAIS-ZEIT`: Reale Ausführungszeit auf 20 Hz Relais-Hardware ($50\,	ext{ms}$ pro Hardware-Takt).
* **Logic Analyzer:** Neue Spalte `Takte` (`+N`) für jeden Einzelschritt + zyklengenauer CSV-Export.

### 2. 🎨 Multi-Color LED-Matrix Display (Neu in v2.5.2)
* **64×64 (Full Framebuffer):** Memory-Mapped ab `0x0300` (768..1023).
* **32×32 (4x Hardware Matrix):** Memory-Mapped ab `0x03C0` (960..1023).
* **5 Hardware-Farbpaletten:**
  * 🔥 **Mandelbrot Flame / Heatmap:** 16-Stufen Farbverlauf (ideal für Fraktale).
  * 🎨 **16-Farben Hardware RGB:** Authentische PICO-8 / Retro CGA-Farbpalette.
  * 🌆 **Cyberpunk Neon:** Leuchtendes Pink, Cyan und Electric Blue.
  * 🌈 **Regenbogen-Spektrum:** 16-Stufen Spektralfarben.
  * 💡 **Klassisch Monochrom:** Bernstein, Phosphor-Grün, Cyan, Rubin.
* **4-Bit Nibble Mode:** 16 echte RGB-Farben pro Pixel direkt aus dem RAM (4 Pixel pro 16-Bit-Wort).
* **High-Performance Engine:** Direct-Rendering in $<1\,	ext{ms}$ bei 60 FPS.

### 3. 📥 Universeller C/C++ & VHDL Array-Importer (Neu in v2.5.0)
* **Multi-Format Parser:** Liest `daten[n] = 0x...;`, C99 `[n] = 0x...`, Array-Blöcke `{ 0x1400, ... }`, `.ino` Sketches, VHDL ROMs `(n => x"...")` und Memory Dumps per Drag & Drop oder Copy-Paste.
* **Presets:** Vorkonfigurierter **151-Wort Integer Division & Software PI Algorithmus** und Dijkstra-Routing.
* **Erweiterte Konvertierung:** 1-Klick-Wechsel zwischen C-Array (`daten[n] = ...;`) und Arduino-Loader (`addr val`).

### 4. ⚡ Assembler Studio & Zwei-Wege-Decompiler
* **Assembler Studio:** 16-Bit Relais-Assembler (`LDA`, `LDAM`, `STAM`, `ADD`, `BA`, `BZ`, `CALL`, `RET`, etc.) mit CodeMirror 6 Syntax-Highlighting und Direkt-Simulation.
* **Auto-Disassembler:** Wandelt rohen Maschinencode mit automatischer Sprungziel- und Subroutinen-Erkennung (`SUB_xxx`, `LABEL_xxx`) und Erhalt aller Kommentare in lesbaren Assembler um.
* **Assembler-to-BASIC Decompiler:** 1-Klick-Rückübersetzung von Maschinencode $ightarrow$ strukturierten BASIC-Quellcode.

### 5. 💻 Modernes Svelte 5 + Go Single-Binary Frontend
* **Zero Virtual DOM Overhead:** Native Reaktivität mit Svelte 5 Runes (`$state`, `$derived`).
* **Standalone Single-Binary:** Das gesamte Frontend ist per `//go:embed` fest in die Go-Binary einkompiliert.
* **USB-Flasher:** Direktes Flashen auf den Arduino Mega Speicher-Controller aus dem Browser via Web-Serial / API.

---

## 🚀 Starten & Ausführen

```bash
# Vorkompilierte Binary starten (Port 8080):
./bin/clack-studio

# Oder direkt mit Go:
go run . -port 8080
```

Öffne anschließend **`http://localhost:8080`** im Browser.

---

## 📦 Multi-Platform Binaries

Unter den [Releases auf Forgejo](https://git.latentforge.dev/relay-computing/clack-studio/releases):
- 🐧 **Linux (x86_64):** `clack-studio-linux-amd64`
- 🪟 **Windows (x64):** `clack-studio-windows-amd64.exe`
- 🍏 **macOS Apple Silicon (ARM64):** `clack-studio-darwin-arm64`
- 🍏 **macOS Intel (x64):** `clack-studio-darwin-amd64`

---

## 🛠️ Für Entwickler

```bash
cd frontend

# Dev-Server mit Hot-Module-Reloading (HMR):
npm run dev

# Frontend neu bauen:
npm run build
```
