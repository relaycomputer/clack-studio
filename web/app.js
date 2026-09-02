/**
 * ⚡ CLACK-STUDIO — 16-Bit Relay Computer Simulator & Lab
 */

// ==========================================
// CONSTANTS & OPCODES
// ==========================================
const MEM_SIZE = 1024;
const FRAMEBUFFER_START = 768; // 0x0300
const FRAMEBUFFER_WORDS = 256; // 64x64 pixels = 4096 bits = 256 words

const OP = {
  NOP:   0xF000,
  LDA:   0x1400,
  LDAM:  0x1800,
  LDAMM: 0x1C00,
  STAM:  0x2800,
  STAMM: 0x2C00,
  ADD:   0x3440,
  AND:   0x3480,
  OR:    0x34C0,
  NOT:   0x3540,
  SHR:   0x3580,
  SHL:   0x35C0,
  BA:    0x4000,
  BC:    0x4008,
  BN:    0x4010,
  BE:    0x4020,
  BZ:    0x4018,
  CALL:  0x5000,
  RET:   0x6000
};

// ==========================================
// AUDIO ENGINE (Mechanical Relay Click Synth)
// ==========================================
class RelayAudioEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    if (this.enabled) this.init();
    return this.enabled;
  }

  playClick(pitchVariance = 1.0) {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      // Noise buffer for mechanical snap
      const bufferSize = this.ctx.sampleRate * 0.008; // 8ms
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      // Bandpass filter for authentic relay coil/spring resonance
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400 * pitchVariance, now);
      filter.Q.setValueAtTime(4.0, now);

      // Gain Envelope
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.008);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(now);
      noise.stop(now + 0.01);
    } catch (e) {
      // Audio context might be restricted
    }
  }
}

// ==========================================
// CORE RELAY CPU EMULATOR
// ==========================================
class RelayComputer {
  constructor() {
    this.memory = new Uint16Array(MEM_SIZE);
    this.reset();
  }

  reset() {
    this.pc = 0;
    this.accu = 0;
    this.stack = 0;
    this.carry = 0;
    this.zero = true;
    this.negative = false;
    this.even = true;
    this.ir = 0;
    this.addressBus = 0;
    this.dataBus = 0;
    this.read = 0;
    this.write = 0;
    this.cycles = 0;
    this.halted = false;
    this.haltReason = '';
    this.lastWriteAddr = -1;
    this.history = [];
  }

  loadSource(text) {
    this.memory.fill(0);
    let count = 0;

    // Remove block comments /* ... */
    let clean = text.replace(/\/\*[\s\S]*?\*\//g, '');
    const lines = clean.split('\n');

    const regexArray = /daten\[\s*(\d+)\s*\]\s*=\s*(0x[0-9a-fA-F]+|\d+)\s*;/i;
    const regexSimple = /^\s*(\d+)\s+(0x[0-9a-fA-F]+|\d+)/i;

    for (let rawLine of lines) {
      let line = rawLine.replace(/\/\/.*$/, '').trim();
      if (!line || line.toUpperCase() === 'CLR') continue;

      let match = line.match(regexArray);
      if (match) {
        let addr = parseInt(match[1], 10);
        let val = match[2].toLowerCase().startsWith('0x')
          ? parseInt(match[2].substring(2), 16)
          : parseInt(match[2], 10);
        if (addr >= 0 && addr < MEM_SIZE && !isNaN(val)) {
          this.memory[addr] = val & 0xFFFF;
          count++;
        }
        continue;
      }

      match = line.match(regexSimple);
      if (match) {
        let addr = parseInt(match[1], 10);
        let val = match[2].toLowerCase().startsWith('0x')
          ? parseInt(match[2].substring(2), 16)
          : parseInt(match[2], 10);
        if (addr >= 0 && addr < MEM_SIZE && !isNaN(val)) {
          this.memory[addr] = val & 0xFFFF;
          count++;
        }
      }
    }

    this.reset();
    return count;
  }

  step() {
    if (this.halted || this.pc >= MEM_SIZE) {
      this.halted = true;
      if (!this.haltReason) this.haltReason = 'PC außerhalb des Speichers';
      return false;
    }

    const pc = this.pc;
    const cmd = this.memory[pc];
    this.ir = cmd;
    const opVal = pc + 1 < MEM_SIZE ? this.memory[pc + 1] : 0;

    let disasm = this.disassembleInstruction(cmd, opVal);
    let trace = {
      idx: this.history.length + 1,
      cmd: cmd,
      mnemonic: disasm.text,
      pc: pc,
      accu: this.accu,
      addr: 0,
      data: 0,
      read: 0,
      write: 0,
      carry: this.carry,
      stack: this.stack,
      cycles: this.cycles
    };

    let prevAccu = this.accu;

    switch (cmd) {
      case OP.NOP:
        this.pc++;
        this.cycles += 2;
        break;

      case OP.LDA:
        this.accu = opVal;
        this.addressBus = pc + 1;
        this.dataBus = opVal;
        this.read = opVal;
        this.write = 0;
        this.pc += 2;
        this.cycles += 4;
        break;

      case OP.LDAM:
        if (opVal >= MEM_SIZE) { this.halt("LDAM Adresse ungültig"); return false; }
        this.accu = this.memory[opVal];
        this.addressBus = opVal;
        this.dataBus = this.accu;
        this.read = this.accu;
        this.write = 0;
        this.pc += 2;
        this.cycles += 6;
        break;

      case OP.LDAMM:
        if (opVal >= MEM_SIZE) { this.halt("LDAMM Pointer 1 ungültig"); return false; }
        let ptr1 = this.memory[opVal];
        if (ptr1 >= MEM_SIZE) { this.halt("LDAMM Pointer 2 ungültig"); return false; }
        this.accu = this.memory[ptr1];
        this.addressBus = ptr1;
        this.dataBus = this.accu;
        this.read = this.accu;
        this.write = 0;
        this.pc += 2;
        this.cycles += 8;
        break;

      case OP.STAM:
        if (opVal >= MEM_SIZE) { this.halt("STAM Adresse ungültig"); return false; }
        this.memory[opVal] = this.accu;
        this.lastWriteAddr = opVal;
        this.addressBus = opVal;
        this.dataBus = this.accu;
        this.read = 0;
        this.write = this.accu;
        this.pc += 2;
        this.cycles += 6;
        break;

      case OP.STAMM:
        if (opVal >= MEM_SIZE) { this.halt("STAMM Pointer 1 ungültig"); return false; }
        let ptr2 = this.memory[opVal];
        if (ptr2 >= MEM_SIZE) { this.halt("STAMM Pointer 2 ungültig"); return false; }
        this.memory[ptr2] = this.accu;
        this.lastWriteAddr = ptr2;
        this.addressBus = ptr2;
        this.dataBus = this.accu;
        this.read = 0;
        this.write = this.accu;
        this.pc += 2;
        this.cycles += 8;
        break;

      case OP.ADD:
        let sum = this.accu + opVal;
        this.carry = sum > 0xFFFF ? 1 : 0;
        this.accu = sum & 0xFFFF;
        this.addressBus = pc + 1;
        this.dataBus = opVal;
        this.read = opVal;
        this.write = 0;
        this.pc += 2;
        this.cycles += 4;
        break;

      case OP.AND:
        this.carry = 0;
        this.accu = (this.accu & opVal) & 0xFFFF;
        this.addressBus = pc + 1;
        this.dataBus = opVal;
        this.read = opVal;
        this.write = 0;
        this.pc += 2;
        this.cycles += 4;
        break;

      case OP.OR:
        this.carry = 0;
        this.accu = (this.accu | opVal) & 0xFFFF;
        this.addressBus = pc + 1;
        this.dataBus = opVal;
        this.read = opVal;
        this.write = 0;
        this.pc += 2;
        this.cycles += 4;
        break;

      case OP.NOT:
        this.carry = 0;
        this.accu = (~this.accu) & 0xFFFF;
        this.addressBus = 0;
        this.dataBus = 0;
        this.read = 0;
        this.write = 0;
        this.pc += 2;
        this.cycles += 4;
        break;

      case OP.SHR:
        this.carry = 0;
        this.accu = (this.accu >>> 1) & 0xFFFF;
        this.addressBus = 0;
        this.dataBus = 0;
        this.read = 0;
        this.write = 0;
        this.pc += 2;
        this.cycles += 4;
        break;

      case OP.SHL:
        this.carry = 0;
        this.accu = (this.accu << 1) & 0xFFFF;
        this.addressBus = 0;
        this.dataBus = 0;
        this.read = 0;
        this.write = 0;
        this.pc += 2;
        this.cycles += 4;
        break;

      case OP.BA:
        this.pc = opVal;
        this.cycles += 4;
        break;

      case OP.BC:
        this.pc = (this.carry === 1) ? opVal : pc + 2;
        this.cycles += 4;
        break;

      case OP.BN:
        this.pc = ((this.accu & 0x8000) !== 0) ? opVal : pc + 2;
        this.cycles += 4;
        break;

      case OP.BE:
        this.pc = ((this.accu & 0x0001) === 0) ? opVal : pc + 2;
        this.cycles += 4;
        break;

      case OP.BZ:
        this.pc = (this.accu === 0) ? opVal : pc + 2;
        this.cycles += 4;
        break;

      case OP.CALL:
        this.stack = (pc + 2) & 0xFFFF;
        this.pc = opVal;
        this.cycles += 4;
        break;

      case OP.RET:
        this.pc = this.stack;
        this.cycles += 5;
        break;

      default:
        this.halt(`Unbekannter Opcode 0x${cmd.toString(16).toUpperCase()} bei PC 0x${pc.toString(16).toUpperCase()}`);
        return false;
    }

    // Update continuous flags
    this.zero = (this.accu === 0);
    this.negative = ((this.accu & 0x8000) !== 0);
    this.even = ((this.accu & 0x0001) === 0);

    // Update trace
    trace.addr = this.addressBus;
    trace.data = this.dataBus;
    trace.read = this.read;
    trace.write = this.write;
    trace.accu = this.accu;
    trace.carry = this.carry;

    if (this.history.length < 5000) {
      this.history.push(trace);
    }

    return true;
  }

  halt(reason) {
    this.halted = true;
    this.haltReason = reason;
  }

  disassembleInstruction(cmd, operand) {
    const hex = (v, len = 4) => '0x' + (v || 0).toString(16).toUpperCase().padStart(len, '0');
    switch (cmd) {
      case OP.NOP:   return { text: "NOP", words: 1, type: "SYS" };
      case OP.LDA:   return { text: `LDA #${hex(operand)} (${operand})`, words: 2, type: "LOAD" };
      case OP.LDAM:  return { text: `LDAM [${hex(operand, 3)}]`, words: 2, type: "LOAD" };
      case OP.LDAMM: return { text: `LDAMM [[${hex(operand, 3)}]]`, words: 2, type: "LOAD" };
      case OP.STAM:  return { text: `STAM [${hex(operand, 3)}]`, words: 2, type: "STORE" };
      case OP.STAMM: return { text: `STAMM [[${hex(operand, 3)}]]`, words: 2, type: "STORE" };
      case OP.ADD:   return { text: `ADD #${hex(operand)} (${operand > 32767 ? operand - 65536 : operand})`, words: 2, type: "ALU" };
      case OP.AND:   return { text: `AND #${hex(operand)}`, words: 2, type: "ALU" };
      case OP.OR:    return { text: `OR #${hex(operand)}`, words: 2, type: "ALU" };
      case OP.NOT:   return { text: "NOT A", words: 2, type: "ALU" };
      case OP.SHR:   return { text: "SHR A", words: 2, type: "ALU" };
      case OP.SHL:   return { text: "SHL A", words: 2, type: "ALU" };
      case OP.BA:    return { text: `BA ${hex(operand, 3)}`, words: 2, type: "BRANCH" };
      case OP.BC:    return { text: `BC ${hex(operand, 3)} (if Carry)`, words: 2, type: "BRANCH" };
      case OP.BN:    return { text: `BN ${hex(operand, 3)} (if < 0)`, words: 2, type: "BRANCH" };
      case OP.BE:    return { text: `BE ${hex(operand, 3)} (if Even)`, words: 2, type: "BRANCH" };
      case OP.BZ:    return { text: `BZ ${hex(operand, 3)} (if == 0)`, words: 2, type: "BRANCH" };
      case OP.CALL:  return { text: `CALL ${hex(operand, 3)}`, words: 2, type: "CALL" };
      case OP.RET:   return { text: "RET", words: 1, type: "RET" };
      default:       return { text: `DATA ${hex(cmd)}`, words: 1, type: "DATA" };
    }
  }
}

// ==========================================
// PRESET PROGRAMS
// ==========================================
const PRESETS = {
  matrix_bounce: `// ============================================================
// ⚡ 64x64 Matrix Display Demo: Animiertes Bouncing Pixel & Rahmen
// Schreibt direkt in Framebuffer-Bereich daten[768..1023] (256 Worte)
// ============================================================

// 1. Initialisierung: Zeichne Rahmen und animiere Pixel
daten[0] = 0x1400; // LDA 0xFFFF (Oberste Linie)
daten[1] = 0xFFFF;
daten[2] = 0x2800; // STAM 768
daten[3] = 768;
daten[4] = 0x2800; // STAM 769
daten[5] = 769;
daten[6] = 0x2800; // STAM 770
daten[7] = 770;
daten[8] = 0x2800; // STAM 771
daten[9] = 771;

// 2. Zeichne Unterste Linie
daten[10] = 0x2800; // STAM 1020
daten[11] = 1020;
daten[12] = 0x2800; // STAM 1021
daten[13] = 1021;
daten[14] = 0x2800; // STAM 1022
daten[15] = 1022;
daten[16] = 0x2800; // STAM 1023
daten[17] = 1023;

// 3. Startadresse für Animation
daten[18] = 0x1400; // LDA Startadresse
daten[19] = 800;
daten[20] = 0x2800; // STAM Ptr
daten[21] = 100;

// 4. Hauptschleife (Blinken / Verschieben)
daten[22] = 0x1800; // LDAM Ptr
daten[23] = 100;
daten[24] = 0x2800; // STAM dynamische Zieladresse
daten[25] = 31;     // überschreibt daten[31]

daten[26] = 0x1400; // LDA Bitmuster 0xAAAA
daten[27] = 0xAAAA;
daten[28] = 0x2800; // STAM [dynamisch]
daten[29] = 0;      // wird von daten[24] auf Adresse 100 gesetzt!

// Inkrementiere Pointer
daten[30] = 0x1800; // LDAM Ptr
daten[31] = 100;
daten[32] = 0x3440; // ADD 1
daten[33] = 1;
daten[34] = 0x2800; // STAM Ptr
daten[35] = 100;

// Prüfe ob Ptr == 1000
daten[36] = 0x3440; // ADD -1000 (0xFC18 in 2er-Komplement)
daten[37] = 0xFC18;
daten[38] = 0x4018; // BZ -> Reset zu Adresse 800
daten[39] = 18;

// Endlos weiterlaufen
daten[40] = 0x4000; // BA -> Loop
daten[41] = 22;

// Variablen
daten[100] = 800;   // Aktueller Framebuffer-Pointer
`,

  matrix_sine: `// ============================================================
// ⚡ 64x64 Matrix Demo: Box & Diagonale Muster
// ============================================================

daten[0] = 0x1400; // LDA 768 (Screen Base)
daten[1] = 768;
daten[2] = 0x2800; // STAM current_screen_ptr
daten[3] = 50;

daten[4] = 0x1400; // LDA 1 (Muster-Shift)
daten[5] = 1;
daten[6] = 0x2800; // STAM pattern
daten[7] = 51;

// Loop
daten[10] = 0x1800; // LDAM pattern
daten[11] = 51;
daten[12] = 0x35C0; // SHL A
daten[13] = 0;
daten[14] = 0x2800; // STAM pattern
daten[15] = 51;

// Dynamischer Store
daten[16] = 0x1800; // LDAM current_screen_ptr
daten[17] = 50;
daten[18] = 0x2800; // STAM Zieladresse in Befehl 25
daten[19] = 25;

daten[20] = 0x1800; // LDAM pattern
daten[21] = 51;
daten[22] = 0x2800; // STAM [screen]
daten[23] = 768;    // wird modifiziert

daten[24] = 0x1800; // LDAM current_screen_ptr
daten[25] = 50;
daten[26] = 0x3440; // ADD 1
daten[27] = 1;
daten[28] = 0x2800; // STAM current_screen_ptr
daten[29] = 50;

daten[30] = 0x4000; // BA Loop
daten[31] = 10;
`,

  math_demo: `// ============================================================
// ⚡ Mathematik-Demo: Addition, Subtraktion, 16-Bit Multiplikation
// ============================================================

// 1. Lade A = 25
daten[0] = 0x1400; // LDA 25
daten[1] = 25;
daten[2] = 0x2800; // STAM a
daten[3] = 100;

// 2. Lade B = 14
daten[4] = 0x1400; // LDA 14
daten[5] = 14;
daten[6] = 0x2800; // STAM b
daten[7] = 101;

// 3. Subtraktion A - B = A + (~B + 1)
daten[8] = 0x1800; // LDAM b
daten[9] = 101;
daten[10] = 0x3540; // NOT A
daten[11] = 0;
daten[12] = 0x3440; // ADD 1
daten[13] = 1;
daten[14] = 0x3440; // ADD 25 (A)
daten[15] = 25;
daten[16] = 0x2800; // STAM diff (Ergebnis: 11)
daten[17] = 102;

// 4. Multiplikation 12 * 7 = 84 via Shift-and-Add Subroutine
daten[18] = 0x1400; // LDA 12
daten[19] = 12;
daten[20] = 0x2800; // STAM factor1
daten[21] = 110;
daten[22] = 0x1400; // LDA 7
daten[23] = 7;
daten[24] = 0x2800; // STAM factor2
daten[25] = 111;

daten[26] = 0x5000; // CALL Subroutine __mul (Adresse 200)
daten[27] = 200;

daten[28] = 0x2800; // STAM product (Ergebnis bei 112)
daten[29] = 112;

daten[30] = 0x4000; // BA Endlosschleife
daten[31] = 30;

// --- Subroutine __mul (Multiplikation factor1 * factor2) ---
// Adresse 200
daten[200] = 0x1400; // LDA 0 (Produkt = 0)
daten[201] = 0;
daten[202] = 0x2800; // STAM prod
daten[203] = 112;

// Mul Loop
daten[204] = 0x1800; // LDAM factor2
daten[205] = 111;
daten[206] = 0x4018; // BZ -> Fertig (Ret)
daten[207] = 230;

// Check LSB(factor2) Even/Odd
daten[208] = 0x4020; // BE -> Skip Addition
daten[209] = 218;

// Add factor1 to prod
daten[210] = 0x1800; // LDAM prod
daten[211] = 112;
daten[212] = 0x3440; // ADD factor1 (12)
daten[213] = 12;
daten[214] = 0x2800; // STAM prod
daten[215] = 112;

// Shift factor1 left, factor2 right
daten[218] = 0x1800; // LDAM factor2
daten[219] = 111;
daten[220] = 0x3580; // SHR A
daten[221] = 0;
daten[222] = 0x2800; // STAM factor2
daten[223] = 111;

daten[224] = 0x4000; // BA Mul Loop
daten[225] = 204;

daten[230] = 0x1800; // LDAM prod
daten[231] = 112;
daten[232] = 0x6000; // RET
`,

  counter_flags: `// ============================================================
// ⚡ Zähler & Flag-Test (Carry, Zero, Negative, Even)
// ============================================================

daten[0] = 0x1400; // LDA 0
daten[1] = 0;
daten[2] = 0x2800; // STAM counter
daten[3] = 100;

// Loop: Counter inkrementieren
daten[10] = 0x1800; // LDAM counter
daten[11] = 100;
daten[12] = 0x3440; // ADD 1
daten[13] = 1;
daten[14] = 0x2800; // STAM counter
daten[15] = 100;

// Wenn Even -> springe zu 20, sonst weiter
daten[16] = 0x4020; // BE -> 20
daten[17] = 20;

daten[18] = 0x4000; // BA -> 10
daten[19] = 10;

daten[20] = 0x1400; // LDA 0xAA00 (Marker für Even)
daten[21] = 0xAA00;
daten[22] = 0x2800; // STAM marker
daten[23] = 101;
daten[24] = 0x4000; // BA -> 10
daten[25] = 10;
`,

  dijkstra: `// Dijkstra Kuerzester Pfad (Oesterreichische Staedte)
0 0x4000
1 50
50 0x1800
51 900
52 0x3440
53 600
54 0x2800
55 59
56 0x1400
57 0
58 0x2800
59 0
60 0x1800
61 901
62 0x3540
63 0
64 0x3440
65 1
66 0x2800
67 917
68 0x4000
69 100
100 0x1400
101 0xFFFF
102 0x2800
103 904
104 0x1400
105 30000
106 0x2800
107 905
108 0x1400
109 7
110 0x2800
111 907
112 0x3440
113 700
114 0x2800
115 119
116 0x1800
117 0
118 0x4018
119 125
120 0x4000
121 160
125 0x1800
126 907
127 0x3440
128 600
129 0x2800
130 134
134 0x1800
135 0
136 0x2800
137 906
138 0x3540
139 0
140 0x3440
141 1
142 0x3440
143 30000
144 0x4008
145 150
146 0x4000
147 160
150 0x1800
151 906
152 0x2800
153 905
154 0x1800
155 907
156 0x2800
157 904
160 0x1800
161 907
162 0x3540
163 0
164 0x3440
165 1
166 0x3440
167 1
168 0x2800
169 907
170 0x4010
171 180
172 0x4000
173 112
180 0x1800
181 904
182 0x4010
183 500
184 0x4000
185 100
500 0xF000
900 0
901 4
`
};

// ==========================================
// CLACK-BASIC PRESET PROGRAMS
// ==========================================
const BASIC_PRESETS = {
  graphics_demo: `REM ============================================================
REM ⚡ Clack-BASIC: 4-Display LED Matrix Grafik-Demo (32x32)
REM ============================================================

REM 1. Display leeren (Worte 960..1023)
CLS

REM 2. Diagonale Linie zeichnen
FOR I = 0 TO 15 STEP 1
    PSET I, I, 0xFFFF
NEXT I

REM 3. Horizontale Linie bei Y = 8
FOR X = 0 TO 31 STEP 1
    PSET X, 8, 0xAAAA
NEXT X

HALT
`,

  math_test: `REM ============================================================
REM ⚡ Clack-BASIC: Mathematik- & Logiktest
REM ============================================================

LET A = 25
LET B = 14

REM 1. Addition & Subtraktion
LET C = A + B
LET D = A - B

REM 2. 16-Bit Multiplikation
LET P = 12 * 7

REM 3. 16-Bit Division & Modulo
LET Q = 100 / 8
LET R = 100 MOD 8

REM 4. Verzweigung
IF P > 80 THEN
    LET STATUS = 1
ELSE
    LET STATUS = 0
END IF

HALT
`,

  data_test: `REM ============================================================
REM ⚡ Clack-BASIC: DATA, READ & RESTORE Test
REM ============================================================

DATA 100, 200, 300, 400

READ A, B
READ C, D

RESTORE
READ FIRST_AGAIN

HALT
`,

  matrix_bounce_basic: `REM ============================================================
REM ⚡ Clack-BASIC: Bouncing Pixel Animation (32x32 Matrix)
REM ============================================================

CLS

LET X = 0
LET Y = 0
LET DX = 1
LET DY = 1

LOOP:
    PSET X, Y, 0xFFFF
    
    LET X = X + DX
    LET Y = Y + DY
    
    IF X >= 30 THEN
        LET DX = -1
    END IF
    IF X <= 1 THEN
        LET DX = 1
    END IF
    
    IF Y >= 30 THEN
        LET DY = -1
    END IF
    IF Y <= 1 THEN
        LET DY = 1
    END IF
    
    GOTO LOOP
`
};

// ==========================================
// STUDIO UI CONTROLLER
// ==========================================
class ClackStudioApp {
  constructor() {
    this.cpu = new RelayComputer();
    this.audio = new RelayAudioEngine();
    
    this.isRunning = false;
    this.timerId = null;
    this.speedHz = 20;
    this.matrixResolution = 64;

    this.initDOM();
    this.initLEDArrays();
    this.initMatrixCanvas();
    this.initEvents();
    this.initMemoryGrid();

    // Load initial preset
    this.loadPreset('matrix_bounce');
    this.loadBasicPreset('graphics_demo');
  }

  initDOM() {
    this.valPC = document.getElementById('val-pc');
    this.valAccu = document.getElementById('val-accu');
    this.valStack = document.getElementById('val-stack');
    this.valCycles = document.getElementById('val-cycles');
    this.valRelayTime = document.getElementById('val-relay-time');

    this.lampRead = document.getElementById('lamp-read');
    this.lampWrite = document.getElementById('lamp-write');
    this.lampCarry = document.getElementById('lamp-carry');
    this.lampZero = document.getElementById('lamp-zero');
    this.lampNegative = document.getElementById('lamp-negative');
    this.lampEven = document.getElementById('lamp-even');

    this.hexAccu = document.getElementById('hex-accu');
    this.subAccu = document.getElementById('sub-accu');
    this.hexIR = document.getElementById('hex-ir');
    this.subIR = document.getElementById('sub-ir');
    this.hexData = document.getElementById('hex-data');
    this.subData = document.getElementById('sub-data');
    this.hexAddr = document.getElementById('hex-addr');
    this.subAddr = document.getElementById('sub-addr');
    this.hexPC = document.getElementById('hex-pc');
    this.subPC = document.getElementById('sub-pc');
    this.hexStack = document.getElementById('hex-stack');
    this.subStack = document.getElementById('sub-stack');

    this.btnRun = document.getElementById('btn-run');
    this.btnPause = document.getElementById('btn-pause');
    this.btnStep = document.getElementById('btn-step');
    this.btnStep10 = document.getElementById('btn-step10');
    this.btnReset = document.getElementById('btn-reset');
    this.sliderSpeed = document.getElementById('slider-speed');
    this.speedLabel = document.getElementById('speed-label');

    this.btnSound = document.getElementById('btn-sound');
    this.selectTheme = document.getElementById('select-theme');
    this.matrixRes = document.getElementById('matrix-res');
    this.canvas = document.getElementById('matrix-canvas');
    this.ctx = this.canvas.getContext('2d');

    this.codeEditor = document.getElementById('code-editor');
    this.selectPreset = document.getElementById('select-preset');
    this.btnLoadProg = document.getElementById('btn-load-prog');
    this.btnExportTxt = document.getElementById('btn-export-txt');
    this.editorStatus = document.getElementById('editor-status');

    // Clack-BASIC UI Elements
    this.basicCodeEditor = document.getElementById('basic-code-editor');
    this.selectBasicPreset = document.getElementById('select-basic-preset');
    this.btnCompileLoad = document.getElementById('btn-compile-load');
    this.btnCompileOnly = document.getElementById('btn-compile-only');
    this.btnExportBasicArduino = document.getElementById('btn-export-basic-arduino');
    this.btnExportBasicCarray = document.getElementById('btn-export-basic-carray');
    this.basicListingBox = document.getElementById('basic-listing-box');
    this.basicListingContent = document.getElementById('basic-listing-content');
    this.btnCloseListing = document.getElementById('btn-close-listing');
    this.basicCompilerStatus = document.getElementById('basic-compiler-status');

    this.disasmList = document.getElementById('disasm-list');
    this.memoryGrid = document.getElementById('memory-grid');
    this.memInspect = document.getElementById('mem-inspect');
    this.historyTbody = document.getElementById('history-tbody');
  }

  initLEDArrays() {
    this.createLEDs('leds-accu', 16);
    this.createLEDs('leds-ir', 16);
    this.createLEDs('leds-data', 16);
    this.createLEDs('leds-addr', 10);
    this.createLEDs('leds-pc', 10);
    this.createLEDs('leds-stack', 10);
  }

  createLEDs(containerId, count) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = '';

    // Create 4 nibble groups (15..12, 11..8, 7..4, 3..0)
    for (let nibble = 3; nibble >= 0; nibble--) {
      const nibbleDiv = document.createElement('div');
      nibbleDiv.className = 'led-nibble';

      for (let b = 3; b >= 0; b--) {
        const bitIndex = nibble * 4 + b;
        const led = document.createElement('div');

        if (bitIndex >= count) {
          // Spacer/inactive upper slot for 10-bit registers
          led.className = 'led spacer';
        } else {
          led.className = 'led';
          led.id = `${containerId}-bit-${bitIndex}`;
          led.title = `Bit ${bitIndex}`;
        }
        nibbleDiv.appendChild(led);
      }

      el.appendChild(nibbleDiv);
    }
  }

  updateLEDArray(containerId, value, count) {
    for (let i = 0; i < count; i++) {
      const led = document.getElementById(`${containerId}-bit-${i}`);
      if (led) {
        const bit = (value >> i) & 1;
        if (bit) led.classList.add('on');
        else led.classList.remove('on');
      }
    }
  }

  initMatrixCanvas() {
    this.renderMatrix();
  }

  renderMatrix() {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const res = this.matrixResolution;
    const dotSize = w / res;
    const radius = (dotSize / 2) * 0.78;

    this.ctx.fillStyle = '#060a0f';
    this.ctx.fillRect(0, 0, w, h);

    // Get active theme accent
    let theme = document.body.className;
    let onColor = '#ffc433';
    let glowColor = 'rgba(255, 176, 0, 0.5)';
    let offColor = '#1a1300';

    if (theme.includes('theme-green')) {
      onColor = '#33ff85';
      glowColor = 'rgba(0, 255, 102, 0.5)';
      offColor = '#00260f';
    } else if (theme.includes('theme-cyan')) {
      onColor = '#33dcff';
      glowColor = 'rgba(0, 212, 255, 0.5)';
      offColor = '#002026';
    } else if (theme.includes('theme-ruby')) {
      onColor = '#ff5c77';
      glowColor = 'rgba(255, 51, 85, 0.5)';
      offColor = '#26060c';
    }

    let wordIdx = FRAMEBUFFER_START;

    if (res === 64) {
      // 64x64: 4 words per row (4 * 16 = 64 bits), 64 rows = 256 words
      for (let y = 0; y < 64; y++) {
        for (let wordOffset = 0; wordOffset < 4; wordOffset++) {
          const currentWordAddr = FRAMEBUFFER_START + (y * 4) + wordOffset;
          const word = currentWordAddr < MEM_SIZE ? this.cpu.memory[currentWordAddr] : 0;

          for (let bit = 15; bit >= 0; bit--) {
            const x = (wordOffset * 16) + (15 - bit);
            const isSet = (word >> bit) & 1;

            const cx = x * dotSize + dotSize / 2;
            const cy = y * dotSize + dotSize / 2;

            this.ctx.beginPath();
            this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);

            if (isSet) {
              this.ctx.fillStyle = onColor;
              this.ctx.shadowColor = glowColor;
              this.ctx.shadowBlur = 4;
              this.ctx.fill();
            } else {
              this.ctx.fillStyle = offColor;
              this.ctx.shadowBlur = 0;
              this.ctx.fill();
            }
          }
        }
      }
    } else {
      // 32x32: 2 words per row, 32 rows = 64 words
      for (let y = 0; y < 32; y++) {
        for (let wordOffset = 0; wordOffset < 2; wordOffset++) {
          const currentWordAddr = FRAMEBUFFER_START + (y * 2) + wordOffset;
          const word = currentWordAddr < MEM_SIZE ? this.cpu.memory[currentWordAddr] : 0;

          for (let bit = 15; bit >= 0; bit--) {
            const x = (wordOffset * 16) + (15 - bit);
            const isSet = (word >> bit) & 1;

            const cx = x * dotSize + dotSize / 2;
            const cy = y * dotSize + dotSize / 2;

            this.ctx.beginPath();
            this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);

            if (isSet) {
              this.ctx.fillStyle = onColor;
              this.ctx.shadowColor = glowColor;
              this.ctx.shadowBlur = 6;
              this.ctx.fill();
            } else {
              this.ctx.fillStyle = offColor;
              this.ctx.shadowBlur = 0;
              this.ctx.fill();
            }
          }
        }
      }
    }
  }

  initMemoryGrid() {
    this.memoryGrid.innerHTML = '';
    for (let i = 0; i < MEM_SIZE; i++) {
      const cell = document.createElement('div');
      cell.className = 'mem-cell';
      cell.id = `mem-cell-${i}`;
      cell.dataset.addr = i;
      cell.title = `Adresse 0x${i.toString(16).toUpperCase().padStart(3, '0')} (${i})`;
      
      cell.addEventListener('mouseenter', () => {
        const val = this.cpu.memory[i];
        const hex = '0x' + val.toString(16).toUpperCase().padStart(4, '0');
        const disasm = this.cpu.disassembleInstruction(val, this.cpu.memory[(i+1)%MEM_SIZE]);
        this.memInspect.innerHTML = `RAM [0x${i.toString(16).toUpperCase().padStart(3, '0')} / ${i}]: <b>${hex}</b> (${val}) — <i>${disasm.text}</i>`;
      });

      cell.addEventListener('click', () => {
        const current = this.cpu.memory[i];
        const input = prompt(`Wert für Adresse ${i} (Hex 0x... oder Dec):`, '0x' + current.toString(16).toUpperCase());
        if (input !== null) {
          let val = input.toLowerCase().startsWith('0x') ? parseInt(input.substring(2), 16) : parseInt(input, 10);
          if (!isNaN(val)) {
            this.cpu.memory[i] = val & 0xFFFF;
            this.updateUI();
          }
        }
      });

      this.memoryGrid.appendChild(cell);
    }
  }

  updateMemoryGrid() {
    for (let i = 0; i < MEM_SIZE; i++) {
      const cell = document.getElementById(`mem-cell-${i}`);
      if (!cell) continue;

      const val = this.cpu.memory[i];
      cell.className = 'mem-cell';

      if (i === this.cpu.pc) {
        cell.classList.add('cell-pc');
      } else if (i === this.cpu.lastWriteAddr) {
        cell.classList.add('cell-write');
      } else if (i >= FRAMEBUFFER_START) {
        cell.classList.add('cell-screen');
      } else if (val !== 0) {
        if (val >= 0x1000 && val <= 0x6000 || val === 0xF000) {
          cell.classList.add('cell-code');
        } else {
          cell.classList.add('cell-data');
        }
      }
    }
  }

  initEvents() {
    // Transport Buttons
    this.btnRun.addEventListener('click', () => this.run());
    this.btnPause.addEventListener('click', () => this.pause());
    this.btnStep.addEventListener('click', () => this.stepSingle());
    this.btnStep10.addEventListener('click', () => this.stepMulti(10));
    this.btnReset.addEventListener('click', () => this.reset());

    // Speed Slider
    this.sliderSpeed.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      if (val === 100) {
        this.speedHz = 2000;
        this.speedLabel.innerText = "MAX SPEED (Echtzeit)";
      } else if (val <= 5) {
        this.speedHz = val;
        this.speedLabel.innerText = `${val} Hz (~${Math.round(1000/val)}ms Relais-Takt)`;
      } else {
        this.speedHz = val;
        this.speedLabel.innerText = `${val} Hz (~${Math.round(1000/val)}ms)`;
      }
      if (this.isRunning) {
        this.pause();
        this.run();
      }
    });

    // Audio Button
    this.btnSound.addEventListener('click', () => {
      const on = this.audio.toggle();
      this.btnSound.querySelector('.txt').innerText = on ? "Klick: AN" : "Klick: AUS";
      this.btnSound.querySelector('.icon').innerText = on ? "🔊" : "🔇";
    });

    // Theme Selector
    this.selectTheme.addEventListener('change', (e) => {
      document.body.className = e.target.value;
      this.renderMatrix();
    });

    // Matrix Res
    this.matrixRes.addEventListener('change', (e) => {
      this.matrixResolution = parseInt(e.target.value, 10);
      this.renderMatrix();
    });

    document.getElementById('btn-clear-screen').addEventListener('click', () => {
      for (let i = FRAMEBUFFER_START; i < FRAMEBUFFER_START + FRAMEBUFFER_WORDS && i < MEM_SIZE; i++) {
        this.cpu.memory[i] = 0;
      }
      this.renderMatrix();
      this.updateMemoryGrid();
    });

    // Preset Selection
    this.selectPreset.addEventListener('change', (e) => {
      this.loadPreset(e.target.value);
    });

    this.btnLoadProg.addEventListener('click', () => {
      this.loadCodeFromEditor();
    });

    this.btnExportTxt.addEventListener('click', () => {
      this.exportCodeTxt();
    });

    document.getElementById('btn-clear-history').addEventListener('click', () => {
      this.cpu.history = [];
      this.renderHistory();
    });

    document.getElementById('btn-export-csv').addEventListener('click', () => {
      this.exportHistoryCSV();
    });

    document.getElementById('btn-export-arduino').addEventListener('click', () => {
      this.exportArduinoFormat();
    });

    document.getElementById('btn-convert-format').addEventListener('click', () => {
      this.convertEditorFormat();
    });

    document.getElementById('btn-scroll-to-pc').addEventListener('click', () => {
      this.scrollToPC();
    });

    // Clack-BASIC Compiler Events
    if (this.selectBasicPreset) {
      this.selectBasicPreset.addEventListener('change', (e) => {
        this.loadBasicPreset(e.target.value);
      });
    }

    if (this.btnCompileLoad) {
      this.btnCompileLoad.addEventListener('click', () => {
        this.compileBasic(true);
      });
    }

    if (this.btnCompileOnly) {
      this.btnCompileOnly.addEventListener('click', () => {
        this.compileBasic(false);
      });
    }

    if (this.btnExportBasicArduino) {
      this.btnExportBasicArduino.addEventListener('click', () => {
        this.exportBasicCode('arduino');
      });
    }

    if (this.btnExportBasicCarray) {
      this.btnExportBasicCarray.addEventListener('click', () => {
        this.exportBasicCode('c-array');
      });
    }

    if (this.btnCloseListing) {
      this.btnCloseListing.addEventListener('click', () => {
        this.basicListingBox.style.display = 'none';
      });
    }

    // Tabs switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const pane = document.getElementById(btn.dataset.tab);
        if (pane) pane.classList.add('active');

        if (btn.dataset.tab === 'tab-disasm') this.renderDisassembler();
        if (btn.dataset.tab === 'tab-memory') this.updateMemoryGrid();
        if (btn.dataset.tab === 'tab-history') this.renderHistory();
      });
    });
  }

  loadBasicPreset(key) {
    if (BASIC_PRESETS[key] && this.basicCodeEditor) {
      this.basicCodeEditor.value = BASIC_PRESETS[key];
      if (this.basicCompilerStatus) {
        this.basicCompilerStatus.className = 'editor-status';
        this.basicCompilerStatus.innerText = `BASIC-Vorlage '${key}' geladen. Bereit zum Kompilieren.`;
      }
    }
  }

  async compileBasic(loadIntoSim = false) {
    if (!this.basicCodeEditor) return;
    const source = this.basicCodeEditor.value;
    if (!source.trim()) {
      if (this.basicCompilerStatus) {
        this.basicCompilerStatus.className = 'editor-status error';
        this.basicCompilerStatus.innerText = 'Fehler: Kein BASIC-Quellcode eingegeben.';
      }
      return;
    }

    if (this.basicCompilerStatus) {
      this.basicCompilerStatus.className = 'editor-status';
      this.basicCompilerStatus.innerText = 'Kompiliere BASIC-Code mit Clack-BASIC...';
    }

    const endpoint = loadIntoSim ? '/api/compile-and-load' : '/api/compile';

    try {
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: source, format: 'arduino' })
      });

      const data = await resp.json();

      if (!data.success) {
        if (this.basicCompilerStatus) {
          this.basicCompilerStatus.className = 'editor-status error';
          this.basicCompilerStatus.innerText = `❌ ${data.error}`;
        }
        return;
      }

      // Show Listing
      if (this.basicListingContent && this.basicListingBox) {
        this.basicListingContent.innerText = data.listing || data.code;
        this.basicListingBox.style.display = 'flex';
      }

      const pct = ((data.usedWords / data.totalWords) * 100).toFixed(1);

      if (loadIntoSim) {
        this.pause();
        const count = this.cpu.loadSource(data.arduinoCode);
        this.updateUI();
        this.renderDisassembler();
        if (this.basicCompilerStatus) {
          this.basicCompilerStatus.className = 'editor-status success';
          this.basicCompilerStatus.innerText = `✅ In ${data.durationMs.toFixed(2)} ms kompiliert & geladen (${count} Worte, ${pct}%). Drücke RUN!`;
        }
      } else {
        if (this.basicCompilerStatus) {
          this.basicCompilerStatus.className = 'editor-status success';
          this.basicCompilerStatus.innerText = `✅ In ${data.durationMs.toFixed(2)} ms erfolgreich kompiliert! Speicher: ${data.usedWords} / ${data.totalWords} Worte (${pct}%).`;
        }
      }

    } catch (err) {
      if (this.basicCompilerStatus) {
        this.basicCompilerStatus.className = 'editor-status error';
        this.basicCompilerStatus.innerText = `❌ Verbindungsfehler zum Compiler: ${err.message}`;
      }
    }
  }

  async exportBasicCode(format) {
    if (!this.basicCodeEditor) return;
    const source = this.basicCodeEditor.value;
    try {
      const resp = await fetch('/api/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: source, format: format })
      });
      const data = await resp.json();
      if (!data.success) {
        alert('Kompilierfehler:\n' + data.error);
        return;
      }

      const ext = format === 'c-array' ? 'c' : 'txt';
      const filename = `clack_compiled.${ext}`;
      const blob = new Blob([data.code], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Fehler beim Exportieren: ' + err.message);
    }
  }

  loadPreset(key) {
    if (PRESETS[key]) {
      this.codeEditor.value = PRESETS[key];
      this.loadCodeFromEditor();
    }
  }

  loadCodeFromEditor() {
    this.pause();
    const count = this.cpu.loadSource(this.codeEditor.value);
    this.editorStatus.innerText = `Erfolgreich ${count} Speicherworte geladen. Bereit.`;
    this.updateUI();
    this.renderDisassembler();
  }

  convertEditorFormat() {
    const text = this.codeEditor.value;
    const isArrayFormat = text.includes('daten[');
    const lines = text.split('\n');
    let converted = [];

    if (isArrayFormat) {
      // Convert daten[123] = 0x1400; -> 123 0x1400
      converted.push('// Konvertiert in Arduino-Loader Format (addr val)');
      converted.push('CLR');
      converted.push('');
      const regex = /daten\[\s*(\d+)\s*\]\s*=\s*(0x[0-9a-fA-F]+|\d+)\s*;\s*(?:\/\/(.*))?/i;
      for (let raw of lines) {
        let match = raw.match(regex);
        if (match) {
          let addr = match[1];
          let val = match[2];
          let comment = match[3] ? ` // ${match[3].trim()}` : '';
          converted.push(`${addr} ${val}${comment}`);
        } else if (raw.trim().startsWith('//') || raw.trim().startsWith('#')) {
          converted.push(raw);
        } else if (!raw.trim()) {
          converted.push('');
        }
      }
      this.codeEditor.value = converted.join('\n');
      this.editorStatus.innerText = "In Arduino-Loader Format ('addr val') konvertiert.";
    } else {
      // Convert 123 0x1400 -> daten[123] = 0x1400;
      converted.push('// Konvertiert in C-Array Format');
      converted.push('');
      const regex = /^\s*(\d+)\s+(0x[0-9a-fA-F]+|\d+)\s*(?:\/\/(.*))?/i;
      for (let raw of lines) {
        let trimmed = raw.trim();
        if (trimmed.toUpperCase() === 'CLR' || trimmed.toUpperCase() === 'RUN') continue;
        let match = raw.match(regex);
        if (match) {
          let addr = match[1];
          let val = match[2];
          let comment = match[3] ? ` // ${match[3].trim()}` : '';
          converted.push(`daten[${addr}] = ${val};${comment}`);
        } else if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('#')) {
          converted.push(raw);
        } else if (!trimmed) {
          converted.push('');
        }
      }
      this.codeEditor.value = converted.join('\n');
      this.editorStatus.innerText = "In C-Array Format ('daten[n] = ...;') konvertiert.";
    }
  }

  exportArduinoFormat() {
    let output = "// Maschinencode fuer Arduino Relais-Speichersubsystem & upload.py\nCLR\n\n";
    for (let i = 0; i < MEM_SIZE; i++) {
      if (this.cpu.memory[i] !== 0) {
        const val = this.cpu.memory[i];
        const hexVal = '0x' + val.toString(16).toUpperCase().padStart(4, '0');
        const opVal = i + 1 < MEM_SIZE ? this.cpu.memory[i+1] : 0;
        const dis = this.cpu.disassembleInstruction(val, opVal);
        output += `${i} ${hexVal} // ${dis.text}\n`;
      }
    }
    output += "\nRUN\n";
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'relais_arduino_loader.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  exportCodeTxt() {
    let output = "// Exportiert aus Clack-Studio (C-Array Format)\n\n";
    for (let i = 0; i < MEM_SIZE; i++) {
      if (this.cpu.memory[i] !== 0) {
        const val = this.cpu.memory[i];
        const hexVal = '0x' + val.toString(16).toUpperCase().padStart(4, '0');
        output += `daten[${i}] = ${hexVal};\n`;
      }
    }
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'relais_programm.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  exportHistoryCSV() {
    let csv = "Idx,Cmd,Befehl,PC,Accu,Addr,Data,Read,Write,Carry,Stack,Cycles\n";
    for (let row of this.cpu.history) {
      csv += `${row.idx},0x${row.cmd.toString(16).toUpperCase()},"${row.mnemonic}",0x${row.pc.toString(16).toUpperCase()},${row.accu},0x${row.addr.toString(16).toUpperCase()},0x${row.data.toString(16).toUpperCase()},${row.read},${row.write},${row.carry},0x${row.stack.toString(16).toUpperCase()},${row.cycles}\n`;
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'relay_trace_history.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  run() {
    if (this.isRunning) return;
    this.audio.init();
    this.isRunning = true;
    this.btnRun.disabled = true;
    this.btnPause.disabled = false;

    const interval = Math.max(1, Math.floor(1000 / this.speedHz));
    const batch = this.speedHz > 100 ? Math.floor(this.speedHz / 60) : 1;

    this.timerId = setInterval(() => {
      let alive = true;
      for (let i = 0; i < batch && alive; i++) {
        alive = this.cpu.step();
        if (this.speedHz <= 50) {
          this.audio.playClick(0.9 + Math.random() * 0.2);
        }
      }

      this.updateUI();

      if (!alive) {
        this.pause();
        this.editorStatus.innerText = `Simulation gestoppt: ${this.cpu.haltReason}`;
      }
    }, interval);
  }

  pause() {
    this.isRunning = false;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.btnRun.disabled = false;
    this.btnPause.disabled = true;
    this.updateUI();
  }

  stepSingle() {
    this.pause();
    this.audio.init();
    const alive = this.cpu.step();
    this.audio.playClick(1.0);
    this.updateUI();
    if (!alive) {
      this.editorStatus.innerText = `Simulation gestoppt: ${this.cpu.haltReason}`;
    }
  }

  stepMulti(count) {
    this.pause();
    this.audio.init();
    for (let i = 0; i < count; i++) {
      if (!this.cpu.step()) break;
    }
    this.audio.playClick(1.1);
    this.updateUI();
  }

  reset() {
    this.pause();
    this.cpu.reset();
    this.loadCodeFromEditor();
    this.updateUI();
  }

  updateUI() {
    const hex = (v, l = 4) => '0x' + (v || 0).toString(16).toUpperCase().padStart(l, '0');

    // Header Metrics
    this.valPC.innerText = hex(this.cpu.pc, 4);
    let signedAccu = this.cpu.accu > 32767 ? this.cpu.accu - 65536 : this.cpu.accu;
    this.valAccu.innerHTML = `${hex(this.cpu.accu, 4)} <small>(${signedAccu})</small>`;
    this.valStack.innerText = hex(this.cpu.stack, 4);
    this.valCycles.innerText = this.cpu.cycles.toLocaleString();
    
    // Estimated relay time (70ms cycle)
    const relaySeconds = (this.cpu.cycles * 0.035).toFixed(2);
    this.valRelayTime.innerText = `${relaySeconds} s`;

    // Status Lamps
    this.setLamp(this.lampRead, this.cpu.read !== 0);
    this.setLamp(this.lampWrite, this.cpu.write !== 0);
    this.setLamp(this.lampCarry, this.cpu.carry === 1);
    this.setLamp(this.lampZero, this.cpu.zero);
    this.setLamp(this.lampNegative, this.cpu.negative);
    this.setLamp(this.lampEven, this.cpu.even);

    // Frontpanel Harmonized Value Badges
    this.hexAccu.innerText = hex(this.cpu.accu, 4);
    this.subAccu.innerText = `dec: ${signedAccu}`;

    let disasm = this.cpu.disassembleInstruction(this.cpu.ir, this.cpu.memory[(this.cpu.pc + 1) % MEM_SIZE]);
    this.hexIR.innerText = hex(this.cpu.ir, 4);
    this.subIR.innerText = disasm.text.split(' ')[0];

    this.hexData.innerText = hex(this.cpu.dataBus, 4);
    this.subData.innerText = this.cpu.write !== 0 ? `WR: ${this.cpu.write}` : (this.cpu.read !== 0 ? `RD: ${this.cpu.read}` : 'idle');

    this.hexAddr.innerText = hex(this.cpu.addressBus, 4);
    this.subAddr.innerText = `RAM: ${this.cpu.addressBus}`;

    this.hexPC.innerText = hex(this.cpu.pc, 4);
    this.subPC.innerText = `step: ${this.cpu.pc}`;

    this.hexStack.innerText = hex(this.cpu.stack, 4);
    this.subStack.innerText = `ret: ${hex(this.cpu.stack, 3)}`;

    // Frontpanel LED Arrays (all 6 rows)
    this.updateLEDArray('leds-accu', this.cpu.accu, 16);
    this.updateLEDArray('leds-ir', this.cpu.ir, 16);
    this.updateLEDArray('leds-data', this.cpu.dataBus, 16);
    this.updateLEDArray('leds-addr', this.cpu.addressBus, 10);
    this.updateLEDArray('leds-pc', this.cpu.pc, 10);
    this.updateLEDArray('leds-stack', this.cpu.stack, 10);

    // Render LED Screen Matrix
    this.renderMatrix();

    // Active tab updates
    const activeTab = document.querySelector('.tab-btn.active');
    if (activeTab) {
      if (activeTab.dataset.tab === 'tab-disasm') this.updateDisassemblerCursor();
      if (activeTab.dataset.tab === 'tab-memory') this.updateMemoryGrid();
      if (activeTab.dataset.tab === 'tab-history') this.renderHistory();
    }
  }

  setLamp(el, active) {
    if (active) el.classList.add('active');
    else el.classList.remove('active');
  }

  renderDisassembler() {
    let html = '';
    const hex = (v, l = 4) => '0x' + (v || 0).toString(16).toUpperCase().padStart(l, '0');

    let i = 0;
    while (i < MEM_SIZE) {
      const cmd = this.cpu.memory[i];
      const op = i + 1 < MEM_SIZE ? this.cpu.memory[i + 1] : 0;
      const dis = this.cpu.disassembleInstruction(cmd, op);

      const isActive = (i === this.cpu.pc);
      const activeClass = isActive ? 'active' : '';

      html += `
        <div class="disasm-row ${activeClass}" id="disasm-addr-${i}">
          <span class="disasm-addr">${hex(i, 3)}</span>
          <span class="disasm-hex">${hex(cmd, 4)}</span>
          <span class="disasm-code">${dis.text}</span>
          <span class="disasm-type">${dis.type}</span>
        </div>
      `;

      i += dis.words;
    }

    this.disasmList.innerHTML = html;
    this.scrollToPC();
  }

  updateDisassemblerCursor() {
    document.querySelectorAll('.disasm-row.active').forEach(r => r.classList.remove('active'));
    const activeRow = document.getElementById(`disasm-addr-${this.cpu.pc}`);
    if (activeRow) {
      activeRow.classList.add('active');
    }
  }

  scrollToPC() {
    const activeRow = document.getElementById(`disasm-addr-${this.cpu.pc}`);
    if (activeRow) {
      activeRow.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }

  renderHistory() {
    if (!this.historyTbody) return;
    const entries = this.cpu.history.slice(-100).reverse(); // Last 100
    const hex = (v, l = 4) => '0x' + (v || 0).toString(16).toUpperCase().padStart(l, '0');

    let html = '';
    for (let r of entries) {
      html += `
        <tr>
          <td>${r.idx.toString().padStart(4, '0')}</td>
          <td>${hex(r.cmd)}</td>
          <td>${r.mnemonic}</td>
          <td>${hex(r.pc, 3)}</td>
          <td>${hex(r.accu)}</td>
          <td>${hex(r.addr, 3)}</td>
          <td>${hex(r.data)}</td>
          <td>${r.read ? hex(r.read) : '-'}</td>
          <td>${r.write ? hex(r.write) : '-'}</td>
          <td>${r.carry}</td>
          <td>${hex(r.stack, 3)}</td>
          <td>${r.cycles}</td>
        </tr>
      `;
    }
    this.historyTbody.innerHTML = html;
  }
}

// Start application when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
  window.app = new ClackStudioApp();
});
