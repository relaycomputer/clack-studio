# ⚡ CLACK-STUDIO
**16-Bit Relay Computer Visual Hardware Lab & Emulator**

`clack-studio` ist ein eigenständiger visueller Hardware-Simulator und Debugger für den 16-Bit Relaisrechner mit integriertem Web-Frontend, 64x64 Dot-Matrix-Display, Bus-LEDs und Relais-Akustik.

---

## ✨ Features

1. **64×64 & 32×32 LED Dot-Matrix Display:**
   * Echtes Memory-Mapped Framebuffer-Display ab Adresse `0x0300` (`768`..`1023`).
   * 1-Bit Bitmap (16 Pixel pro Speicherwort $\rightarrow$ 256 Worte für 64×64).
   * Einstellbarer Phosphor-/LED-Glow mit Farbthemen: *Amber (Bernstein)*, *Phosphor Grün*, *Cyber Cyan*, *Rubin Rot*.

2. **Echte Hardware-Frontpanel Visualisierung:**
   * **ACCU:** 16-Bit LED-Leiste (Hex, Vorzeichen/Dezimal, Binär).
   * **IR (Befehlsregister):** 16-Bit LED-Leiste mit Mnemonic-Decoder (`LDA`, `STAM`, `ADD`, `BZ`, etc.).
   * **DATENBUS & ADRESSBUS:** Live blinkende 16-Bit / 10-Bit Bus-LEDs.
   * **Statuslampen:** `READ`, `WRITE`, `C` (Carry), `Z` (Zero), `N` (Negative), `E` (Even).

3. **Akustik-Synthesizer (WebAudio):**
   * Authentischer mechanischer Relais-Klack-Soundeffekt bei Schaltzyklen.

4. **Integrierter Clack-BASIC Cross-Compiler:**
   * Eigener **BASIC-Compiler Tab** direkt im Studio.
   * BASIC-Code eingeben (`LET`, `IF..THEN..ELSE`, `FOR..NEXT`, `PSET`, `CLS`, `DATA/READ`, `*`, `/`).
   * **1-Klick Kompilieren & Sofortausführung** (`⚡ In Simulator laden & Reset`).
   * Live Assembler-Listing & Disassembly-Ansicht.
   * Direkter Download als Arduino Loader Format (`.txt`) oder C-Array (`.c`).

5. **Multi-Tab Workstation:**
   * **Clack-BASIC Compiler:** Direkte BASIC-Entwicklungsumgebung mit Vorlagen.
   * **Code Studio & Loader:** Maschinencode-Editor mit bidirektionalem Format-Konverter.
   * **Live Disassembler:** Scrollbare Übersicht aller 1024 Worte mit aktivem `PC`-Cursor.
   * **1024-Wort RAM Matrix:** Interaktive Speicher-Heatmap mit Lese-/Schreibanimation und Live-Zellen-Editor.
   * **Logic Analyzer History:** Zyklusgenaue Trace-Tabelle, exportierbar als `.csv` und `.txt`.

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
