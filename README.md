# ⚡ Clack Studio — Visual Relay Computer & Simulator

<div align="center">

[![Svelte 5](https://img.shields.io/badge/Frontend-Svelte%205%20Runes-FF3E00?style=flat-square&logo=svelte)](https://svelte.dev/)
[![Go Backend](https://img.shields.io/badge/Backend-Go%201.24-00ADD8?style=flat-square&logo=go)](https://go.dev/)
[![Live Simulator](https://img.shields.io/badge/Simulator-clack--studio.relaycomputer.org-38bdf8?style=flat-square)](https://clack-studio.relaycomputer.org)
[![Accessibility](https://img.shields.io/badge/A11y-WCAG%20AAA-success?style=flat-square)](https://relaycomputer.org)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

**Cycle-accurate 16-bit relay computer visual hardware lab, emulator, CodeMirror 6 IDE, and USB hardware flasher.**

[Launch Simulator](https://clack-studio.relaycomputer.org) • [Relay Computer Project](https://relaycomputer.org) • [Compiler Repo](https://github.com/relaycomputer/clack-basic)

</div>

---

## 🏛️ Overview

`clack-studio` is a cycle-accurate hardware simulator and interactive laboratory for the discrete 16-bit electromechanical relay computer. Built with **Svelte 5 Runes** and compiled into a standalone, single-binary **Go server** via `//go:embed`, it lets you write, compile, trace, step, and analyze relay code entirely inside your browser or as a native desktop lab.

---

## ✨ Key Features

### 1. ⏱️ Cycle-Accurate Timing & Hardware Acoustics
* **Instruction-Weighted Machine Cycles:**
  * `NOP`: 1 cycle (~50 ms on 20 Hz hardware)
  * `LDA #imm`, `ADD #imm`, `AND`, `OR`, `NOT`, `SHR`, `SHL`, `BA`, `BC`, `BN`, `BE`, `BZ`, `RET`: 2 cycles (~100 ms)
  * `LDAM addr`, `STAM addr`, `CALL addr`: 3 cycles (~150 ms)
  * `LDAMM [ptr]`, `STAMM [ptr]`: 4 cycles (~200 ms)
* **Real Relay Acoustics:** Web Audio API relay contact click synthesizer simulating the physical clack of coil armatures on every microcode step.
* **Hardware Execution Timers:** Displays logical instructions, physical machine cycles, and real execution time on 20 Hz relay hardware ($50\,\text{ms}$ per cycle).

### 2. 🎨 Multi-Color LED Matrix Display
* **Resolutions:**
  * `32×32` (Physical 4-tile LED matrix configuration, memory-mapped from `0x03C0`).
  * `64×64` (Full framebuffer, memory-mapped from `0x0300`).
* **5 Authentic Palettes:** Mandelbrot Flame, 16-Color Hardware RGB (PICO-8), Cyberpunk Neon, Rainbow Spectrum, and Classic Monochrome (Amber/Phosphor-Green).
* **Color Depth:** 1-Bit (Monochrome) & 4-Bit Nibble Mode (16 RGB colors directly addressed from 16-bit RAM words).
* **Interactive Toolbars:** Canvas controls toolbar for live grid resolution, layout, palette, and color depth selection.

### 3. 🔍 Logic Analyzer & Hardware Trace
* Cycle-accurate bus trace recording: `CMD`, `PC`, `ACCU`, `ADDR`, `DATA BUS`, `READ`, `WRITE`, `CARRY`, and `RETURN STACK`.
* Step-by-step execution metrics (`+Cycles`) and 1-click CSV trace export for external logic timing verification.

### 4. 🧠 1024-Word RAM Matrix & Inspector
* Real-time visual heatmap of the entire 1024-word memory space (`0x0000` to `0x03FF`).
* Color-coded memory segments: Program Code, Subroutines, Data Variables, and Video Framebuffer.
* Live address inspector with value editing and memory search.

### 5. 💻 Integrated CodeMirror 6 IDE Suite
* **BASIC Studio:** Full syntax highlighting, live linting, compiler diagnostics, and instant compilation to machine code.
* **Assembler Studio:** 16-bit relay assembly IDE with labels, jump resolution, and two-way decompiler to Clack-BASIC.
* **Machine Code & Loader:** Direct hex editing, C-array importer (`daten[n] = 0x...;`), and Arduino loader generator.
* **Arduino Mega USB Flasher:** Built-in Web Serial API flasher to program the physical relay machine with one click.

---

## 🚀 Running Locally

```bash
# Clone the repository
git clone https://github.com/relaycomputer/clack-studio.git
cd clack-studio

# Build frontend & backend
npm run build --prefix frontend
go build -o bin/clack-studio .

# Start the local laboratory
./bin/clack-studio
```
The browser will automatically open at `http://127.0.0.1:8080`.

---

## 👥 Engineering Team & Contacts

| Domain | Lead Engineer | Contact |
| :--- | :--- | :--- |
| **Hardware Architecture & Discrete Relays** | **Peter Prikasky** ([relaiscomputer.at](https://relaiscomputer.at)) | `hardware@relaycomputer.org` |
| **Software, Compiler & Simulation** | **Christian Buchhas** ([relaycomputer.org](https://relaycomputer.org)) | `software@relaycomputer.org` |
| **Public Community Chat (Matrix)** | **The Relay Computer Project** | [`#relaycomputer:matrix.org`](https://matrix.to/#/#relaycomputer:matrix.org) |
| **General Inquiries & Community** | **The Relay Computer Project** | `contact@relaycomputer.org` |

---

## 📜 License

Distributed under the MIT License. See [LICENSE](LICENSE) for details.
