// ==========================================
// ⚡ 16-Bit Relay CPU Store (Svelte 5 Runes)
// ==========================================

import { audio } from '../audio/relayAudio.js';
import { settings } from './settingsStore.svelte.js';
import { BASIC_PRESETS_LIST } from '../data/basicPresets.js';

export const MEM_SIZE = 1024;
export const FRAMEBUFFER_64_START = 768; // 0x0300
export const FRAMEBUFFER_32_START = 960; // 0x03C0

export const OP = {
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

export class CPUStore {
  // Reactive CPU Registers & State
  pc = $state(0);
  accu = $state(0);
  stack = $state(0);
  carry = $state(0);
  zero = $state(true);
  negative = $state(false);
  even = $state(true);
  ir = $state(0);
  addressBus = $state(0);
  dataBus = $state(0);
  read = $state(0);
  write = $state(0);
  instructions = $state(0);
  cycles = $state(0);
  halted = $state(false);
  haltReason = $state('');
  lastWriteAddr = $state(-1);
  displayWrites = 0;
  frameCompleted = false;
  callDepth = 0;

  // 1024-Word RAM array (Uint16Array wrapped in $state)
  memory = $state(new Uint16Array(MEM_SIZE));

  // Logic Analyzer Execution Trace History
  history = $state([]);

  // Simulation execution loop timer
  isRunning = $state(false);
  timerId = null;
  _lastSoundTime = 0;

  // Breakpoints
  breakpoints = $state(new Set());
  hitBreakpoint = $state(null);

  toggleBreakpoint(addr) {
    const s = new Set(this.breakpoints);
    if (s.has(addr)) {
      s.delete(addr);
    } else {
      s.add(addr);
    }
    this.breakpoints = s;
  }

  clearBreakpoints() {
    this.breakpoints = new Set();
    this.hitBreakpoint = null;
  }

  getInstructionCycles(cmd) {
    switch (cmd) {
      case OP.NOP: return 2;   // Fetch Opcode (2 Takte)
      case OP.LDA: return 4;   // Fetch Opcode + Fetch Immediate (4 Takte)
      case OP.LDAM: return 6;  // Fetch Opcode + Fetch Address + Read RAM (6 Takte)
      case OP.LDAMM: return 8; // Fetch Opcode + Fetch Pointer + Read Pointer Target + Read Effective RAM (8 Takte)
      case OP.STAM: return 6;  // Fetch Opcode + Fetch Address + Write RAM (6 Takte)
      case OP.STAMM: return 8; // Fetch Opcode + Fetch Pointer + Read Pointer Target + Write Effective RAM (8 Takte)
      case OP.ADD:
      case OP.AND:
      case OP.OR:
      case OP.NOT:
      case OP.SHR:
      case OP.SHL:
      case OP.BA:
      case OP.BC:
      case OP.BN:
      case OP.BE:
      case OP.BZ:
        return 4;              // Fetch Opcode + Fetch Operand / Target & ALU latch (4 Takte)
      case OP.CALL: return 4;  // Fetch Opcode + Fetch Target + Save Stack (4 Takte)
      case OP.RET: return 5;   // Fetch Opcode + Load Stack to PC (5 Takte)
      default: return 2;
    }
  }

  reset() {
    this.pause();
    this.hitBreakpoint = null;
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
    this.instructions = 0;
    this.cycles = 0;
    this.halted = false;
    this.haltReason = '';
    this.lastWriteAddr = -1;
    this.displayWrites = 0;
    this.frameCompleted = false;
    this.callDepth = 0;
    this.history = [];
  }

  loadSource(text) {
    this.reset();
    const newMem = new Uint16Array(MEM_SIZE);
    let count = 0;

    let clean = text.replace(/\/\*[\s\S]*?\*\//g, '');
    const lines = clean.split('\n');

    const regexArray = /(?:daten|array|mem|memory|ram|rom|buffer)\s*\[\s*(\d+)\s*\]\s*=\s*(0x[0-9a-fA-F]+|\d+)\s*;?/i;
    const regexC99 = /\[\s*(\d+)\s*\]\s*=\s*(0x[0-9a-fA-F]+|\d+)\s*,?/i;
    const regexVhdl = /(\d+)\s*=>\s*(?:x"([0-9a-fA-F]+)"|(0x[0-9a-fA-F]+|\d+))\s*,?/i;
    const regexSimple = /^\s*(\d+)[\s:]+(0x[0-9a-fA-F]+|\d+)/i;

    let hasIndexed = false;

    for (let rawLine of lines) {
      let line = rawLine.replace(/\/\/.*$/, '').replace(/--.*$/, '').trim();
      if (!line || line.toUpperCase() === 'CLR' || line.toUpperCase() === 'RUN') continue;

      let match = line.match(regexArray);
      if (match) {
        let addr = parseInt(match[1], 10);
        let val = match[2].toLowerCase().startsWith('0x')
          ? parseInt(match[2].substring(2), 16)
          : parseInt(match[2], 10);
        if (addr >= 0 && addr < MEM_SIZE) {
          newMem[addr] = val & 0xFFFF;
          count++;
          hasIndexed = true;
        }
        continue;
      }

      match = line.match(regexC99);
      if (match) {
        let addr = parseInt(match[1], 10);
        let val = match[2].toLowerCase().startsWith('0x')
          ? parseInt(match[2].substring(2), 16)
          : parseInt(match[2], 10);
        if (addr >= 0 && addr < MEM_SIZE) {
          newMem[addr] = val & 0xFFFF;
          count++;
          hasIndexed = true;
        }
        continue;
      }

      match = line.match(regexVhdl);
      if (match) {
        let addr = parseInt(match[1], 10);
        let valStr = match[2] ? ('0x' + match[2]) : match[3];
        let val = valStr.toLowerCase().startsWith('0x')
          ? parseInt(valStr.substring(2), 16)
          : parseInt(valStr, 10);
        if (addr >= 0 && addr < MEM_SIZE) {
          newMem[addr] = val & 0xFFFF;
          count++;
          hasIndexed = true;
        }
        continue;
      }

      match = line.match(regexSimple);
      if (match) {
        let addr = parseInt(match[1], 10);
        let val = match[2].toLowerCase().startsWith('0x')
          ? parseInt(match[2].substring(2), 16)
          : parseInt(match[2], 10);
        if (addr >= 0 && addr < MEM_SIZE) {
          newMem[addr] = val & 0xFFFF;
          count++;
          hasIndexed = true;
        }
      }
    }

    // Fallback: sequential array block { 0x1400, 400, ... }
    if (!hasIndexed) {
      const startIdx = clean.search(/[{(\[]/);
      const endIdx = clean.search(/[})\]][^})\]]*$/);
      let blockContent = clean;
      if (startIdx >= 0 && endIdx > startIdx) {
        blockContent = clean.substring(startIdx + 1, endIdx);
      }
      const tokenRegex = /(?:0x[0-9a-fA-F]+|x"[0-9a-fA-F]+"|\b\d+\b)/g;
      const tokens = blockContent.match(tokenRegex);
      if (tokens) {
        for (let i = 0; i < tokens.length && i < MEM_SIZE; i++) {
          let token = tokens[i];
          let val = 0;
          if (token.toLowerCase().startsWith('x"')) {
            val = parseInt(token.substring(2, token.length - 1), 16);
          } else if (token.toLowerCase().startsWith('0x')) {
            val = parseInt(token.substring(2), 16);
          } else {
            val = parseInt(token, 10);
          }
          if (!isNaN(val)) {
            newMem[i] = val & 0xFFFF;
            count++;
          }
        }
      }
    }

    this.memory = newMem;
    return count;
  }

  loadProgram(text) {
    return this.loadSource(text);
  }

  step() {
    if (this.halted) return false;

    const currentPC = this.pc;
    const cmd = this.memory[this.pc];
    this.ir = cmd;

    const stepCycles = this.getInstructionCycles(cmd);
    this.instructions++;
    this.cycles += stepCycles;

    this.read = 0;
    this.write = 0;
    this.lastWriteAddr = -1;

    const needTrace = this.history.length < 5000 && settings.activeTab === 'tab-history';
    let trace = null;

    const nextWord = () => {
      this.pc = (this.pc + 1) % MEM_SIZE;
      return this.memory[this.pc];
    };

    if (needTrace) {
      const disasm = this.disassembleInstruction(cmd, this.memory[(this.pc + 1) % MEM_SIZE]);
      trace = {
        idx: this.instructions,
        pc: currentPC,
        cmd: cmd,
        mnemonic: disasm.text,
        accu: this.accu,
        addr: 0,
        data: 0,
        read: 0,
        write: 0,
        carry: this.carry,
        stack: this.stack,
        stepCycles: stepCycles,
        cycles: this.cycles
      };
    }

    switch (cmd) {
      case OP.NOP:
        this.pc = (this.pc + 1) % MEM_SIZE;
        break;

      case OP.LDA: {
        const val = nextWord();
        this.accu = val;
        this.dataBus = val;
        this.addressBus = this.pc;
        this.read = val;
        this.pc = (this.pc + 1) % MEM_SIZE;
        break;
      }

      case OP.LDAM: {
        const addr = nextWord() % MEM_SIZE;
        const val = this.memory[addr];
        this.accu = val;
        this.addressBus = addr;
        this.dataBus = val;
        this.read = val;
        this.pc = (this.pc + 1) % MEM_SIZE;
        break;
      }

      case OP.LDAMM: {
        const ptrAddr = nextWord() % MEM_SIZE;
        const targetAddr = this.memory[ptrAddr] % MEM_SIZE;
        const val = this.memory[targetAddr];
        this.accu = val;
        this.addressBus = targetAddr;
        this.dataBus = val;
        this.read = val;
        this.pc = (this.pc + 1) % MEM_SIZE;
        break;
      }

      case OP.STAM: {
        const addr = nextWord() % MEM_SIZE;
        this.memory[addr] = this.accu;
        this.addressBus = addr;
        this.dataBus = this.accu;
        this.write = this.accu;
        this.lastWriteAddr = addr;
        if (addr >= 768 && addr < 1024) this.displayWrites++;
        this.pc = (this.pc + 1) % MEM_SIZE;
        break;
      }

      case OP.STAMM: {
        const ptrAddr = nextWord() % MEM_SIZE;
        const targetAddr = this.memory[ptrAddr] % MEM_SIZE;
        this.memory[targetAddr] = this.accu;
        this.addressBus = targetAddr;
        this.dataBus = this.accu;
        this.write = this.accu;
        this.lastWriteAddr = targetAddr;
        if (targetAddr >= 768 && targetAddr < 1024) this.displayWrites++;
        this.pc = (this.pc + 1) % MEM_SIZE;
        break;
      }

      case OP.ADD: {
        const operand = nextWord();
        const sum = this.accu + operand;
        this.carry = (sum > 0xFFFF) ? 1 : 0;
        this.accu = sum & 0xFFFF;
        this.addressBus = this.pc;
        this.dataBus = operand;
        this.read = operand;
        this.pc = (this.pc + 1) % MEM_SIZE;
        break;
      }

      case OP.AND: {
        const operand = nextWord();
        this.accu = (this.accu & operand) & 0xFFFF;
        this.addressBus = this.pc;
        this.dataBus = operand;
        this.read = operand;
        this.pc = (this.pc + 1) % MEM_SIZE;
        break;
      }

      case OP.OR: {
        const operand = nextWord();
        this.accu = (this.accu | operand) & 0xFFFF;
        this.addressBus = this.pc;
        this.dataBus = operand;
        this.read = operand;
        this.pc = (this.pc + 1) % MEM_SIZE;
        break;
      }

      case OP.NOT:
        nextWord();
        this.accu = (~this.accu) & 0xFFFF;
        this.pc = (this.pc + 1) % MEM_SIZE;
        break;

      case OP.SHR:
        nextWord();
        this.carry = this.accu & 1;
        this.accu = (this.accu >> 1) & 0xFFFF;
        this.pc = (this.pc + 1) % MEM_SIZE;
        break;

      case OP.SHL:
        nextWord();
        this.carry = (this.accu & 0x8000) ? 1 : 0;
        this.accu = (this.accu << 1) & 0xFFFF;
        this.pc = (this.pc + 1) % MEM_SIZE;
        break;

      case OP.BA: {
        const target = nextWord() % MEM_SIZE;
        if (target === currentPC) {
          this.halt("Endlosschleife (BA auf sich selbst)");
          return false;
        }
        if (target < currentPC && this.callDepth === 0 && this.displayWrites >= 2) {
          this.frameCompleted = true;
        }
        this.pc = target;
        break;
      }

      case OP.BC: {
        const target = nextWord() % MEM_SIZE;
        if (this.carry === 1) {
          if (target < currentPC && this.callDepth === 0 && this.displayWrites >= 2) this.frameCompleted = true;
          this.pc = target;
        } else this.pc = (this.pc + 1) % MEM_SIZE;
        break;
      }

      case OP.BN: {
        const target = nextWord() % MEM_SIZE;
        if (this.negative) {
          if (target < currentPC && this.callDepth === 0 && this.displayWrites >= 2) this.frameCompleted = true;
          this.pc = target;
        } else this.pc = (this.pc + 1) % MEM_SIZE;
        break;
      }

      case OP.BE: {
        const target = nextWord() % MEM_SIZE;
        if (this.even) {
          if (target < currentPC && this.callDepth === 0 && this.displayWrites >= 2) this.frameCompleted = true;
          this.pc = target;
        } else this.pc = (this.pc + 1) % MEM_SIZE;
        break;
      }

      case OP.BZ: {
        const target = nextWord() % MEM_SIZE;
        if (this.zero) {
          if (target < currentPC && this.callDepth === 0 && this.displayWrites >= 2) this.frameCompleted = true;
          this.pc = target;
        } else this.pc = (this.pc + 1) % MEM_SIZE;
        break;
      }

      case OP.CALL: {
        const target = nextWord() % MEM_SIZE;
        this.callDepth++;
        this.stack = (this.pc + 1) % MEM_SIZE;
        this.pc = target;
        break;
      }

      case OP.RET:
        if (this.callDepth > 0) this.callDepth--;
        this.pc = this.stack % MEM_SIZE;
        break;

      default:
        if (cmd === 0 && this.instructions === 1) {
          this.halt("Speicher ist leer (Opcode 0x0000 bei PC 0x000). Bitte zuerst ein Programm kompilieren oder laden.");
        } else {
          this.halt(`Halt / Unbekannter Opcode 0x${(cmd || 0).toString(16).toUpperCase().padStart(4, '0')} bei PC 0x${currentPC.toString(16).toUpperCase().padStart(3, '0')}`);
        }
        return false;
    }

    // Update ALU flags
    this.zero = (this.accu === 0);
    this.negative = ((this.accu & 0x8000) !== 0);
    this.even = ((this.accu & 0x0001) === 0);

    // Update trace (only when active to keep emulation ultra-fast)
    if (trace) {
      trace.addr = this.addressBus;
      trace.data = this.dataBus;
      trace.read = this.read;
      trace.write = this.write;
      trace.accu = this.accu;
      trace.carry = this.carry;

      if (this.history.length < 5000) {
        this.history.push(trace);
      }
    }

    return true;
  }

  halt(reason) {
    this.halted = true;
    this.haltReason = reason;
    this.pause();
  }

  stepSingle() {
    this.pause();
    this.hitBreakpoint = null;
    const ok = this.step();
    if (settings.soundEnabled) {
      audio.playClick(1.0);
    }
    return ok;
  }

  stepMulti(count = 10) {
    this.pause();
    this.hitBreakpoint = null;
    for (let i = 0; i < count; i++) {
      if (this.breakpoints.has(this.pc)) {
        this.hitBreakpoint = this.pc;
        break;
      }
      if (!this.step()) break;
    }
    if (settings.soundEnabled) {
      audio.playClick(1.1);
    }
  }

  run() {
    if (this.isRunning) return;

    // Falls vorher angehalten/beendet: von vorn beginnen
    if (this.halted) {
      this.reset();
    }

    // Speicherleerlauf-Prüfung: Falls PC auf 0 steht und RAM dort 0x0000 ist
    if (this.instructions === 0 && this.pc === 0 && this.memory[0] === 0) {
      const defaultPreset = BASIC_PRESETS_LIST.find(p => p.id === 'ping_pong') || BASIC_PRESETS_LIST[0];
      if (defaultPreset && defaultPreset.compiledCode) {
        this.loadSource(defaultPreset.compiledCode);
      } else {
        this.halt("Speicher ist leer (Opcode 0x0000 bei PC 0x000). Bitte zuerst ein Programm kompilieren oder laden.");
        return;
      }
    }

    this.isRunning = true;
    this.halted = false;
    this.hitBreakpoint = null;

    // Falls der PC bereits auf einem Breakpoint steht: Einzelschritt ausführen, um fortzusetzen
    if (this.breakpoints.has(this.pc)) {
      if (!this.step()) {
        this.pause();
        return;
      }
    }

    const loop = () => {
      if (!this.isRunning) return;

      const hz = settings.speedHz;
      let stepsPerBatch = 1;
      let intervalMs = 20;

      if (hz >= 500) {
        // Turbo Compute (Mandelbrot): bis zu 15.000 Schritte pro Batch (~1 Mio Schritte/Sek.)
        // Arcade Animation (Ping-Pong / Matrix Bounce): schaltet dank frameCompleted sauber bei ~60 FPS
        stepsPerBatch = 15000;
        intervalMs = 16;
      } else if (hz >= 100) {
        stepsPerBatch = 200;
        intervalMs = 20;
      } else if (hz >= 14) {
        stepsPerBatch = 1;
        intervalMs = 70; // 14.3 Hz Original Hardware (70 ms pro Relais-Takt)
      } else if (hz >= 5) {
        stepsPerBatch = 1;
        intervalMs = 200;
      } else {
        stepsPerBatch = 1;
        intervalMs = 1000;
      }

      for (let i = 0; i < stepsPerBatch; i++) {
        if (this.breakpoints.has(this.pc)) {
          this.hitBreakpoint = this.pc;
          this.pause();
          return;
        }
        if (!this.step()) {
          this.pause();
          return;
        }
        if (this.breakpoints.has(this.pc)) {
          this.hitBreakpoint = this.pc;
          this.pause();
          return;
        }
        if (this.frameCompleted) {
          this.frameCompleted = false;
          this.displayWrites = 0;
          break; // Vollständiges Display-Frame gerendert: Batch an Animation-Frame übergeben!
        }
      }

      if (settings.soundEnabled) {
        const now = performance.now();
        if (now - this._lastSoundTime >= 70) {
          this._lastSoundTime = now;
          audio.playClick(0.9 + Math.random() * 0.2);
        }
      }

      this.timerId = setTimeout(loop, intervalMs);
    };

    loop();
  }

  pause() {
    this.isRunning = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  setMemoryCell(addr, val) {
    if (addr >= 0 && addr < MEM_SIZE) {
      this.memory[addr] = val & 0xFFFF;
    }
  }

  clearScreen(startAddr = 960, count = 64) {
    for (let i = startAddr; i < startAddr + count && i < MEM_SIZE; i++) {
      this.memory[i] = 0;
    }
  }

  disassembleInstruction(cmd, operand = 0) {
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

export const cpu = new CPUStore();
