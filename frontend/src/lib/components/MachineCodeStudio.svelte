<script>
  import { cpu } from '../stores/cpuStore.svelte.js';

  const PRESETS = {
    matrix_bounce: `// ============================================================
// ⚡ 64x64 Matrix Display Demo: Animiertes Bouncing Pixel & Rahmen
// Schreibt direkt in Framebuffer-Bereich daten[768..1023] (256 Worte)
// ============================================================

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

// Diagonale Pixel
daten[10] = 0x1400; // LDA 0x8000
daten[11] = 0x8000;
daten[12] = 0x2800; // STAM 776
daten[13] = 776;

daten[14] = 0x1400; // LDA 0x4000
daten[15] = 0x4000;
daten[16] = 0x2800; // STAM 780
daten[17] = 780;

daten[18] = 0x4000; // BA 18 (Halt/Loop)
daten[19] = 18;
`,

    dijkstra: `// ============================================================
// ⚡ Dijkstra Algorithmus: Kuerzester Weg in Oesterreich (17 Staedte)
// ============================================================
daten[0] = 0x1400; // LDA Startknoten
daten[1] = 0;
daten[2] = 0x2800; // STAM start_node
daten[3] = 500;
daten[4] = 0x4000; // BA Ende
daten[5] = 4;
`
  };

  let codeText = $state(PRESETS.matrix_bounce);
  let statusMessage = $state("Unterstützt 'daten[n] = ...' und Arduino Speichersubsystem Format ('0 0x4000' / 'CLR').");
  let selectedPreset = $state('matrix_bounce');

  function loadPreset(key) {
    selectedPreset = key;
    if (PRESETS[key]) {
      codeText = PRESETS[key];
      loadCode();
    }
  }

  function loadCode() {
    cpu.pause();
    const count = cpu.loadSource(codeText);
    statusMessage = `Erfolgreich ${count} Speicherworte geladen. Bereit.`;
  }

  function convertFormat() {
    const isArrayFormat = codeText.includes('daten[');
    const lines = codeText.split('\n');
    let converted = [];

    if (isArrayFormat) {
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
      codeText = converted.join('\n');
      statusMessage = "In Arduino-Loader Format ('addr val') konvertiert.";
    } else {
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
      codeText = converted.join('\n');
      statusMessage = "In C-Array Format ('daten[n] = ...;') konvertiert.";
    }
  }

  function exportArduinoFormat() {
    let output = "// Maschinencode fuer Arduino Relais-Speichersubsystem & upload.py\nCLR\n\n";
    for (let i = 0; i < cpu.memory.length; i++) {
      if (cpu.memory[i] !== 0) {
        const val = cpu.memory[i];
        const hexVal = '0x' + val.toString(16).toUpperCase().padStart(4, '0');
        const opVal = i + 1 < cpu.memory.length ? cpu.memory[i+1] : 0;
        const dis = cpu.disassembleInstruction(val, opVal);
        output += `${i} ${hexVal} // ${dis.text}\n`;
      }
    }
    output += "\nRUN\n";
    downloadFile(output, 'relais_arduino_loader.txt');
  }

  function exportCArrayFormat() {
    let output = "// Exportiert aus Clack-Studio (C-Array Format)\n\n";
    for (let i = 0; i < cpu.memory.length; i++) {
      if (cpu.memory[i] !== 0) {
        const val = cpu.memory[i];
        const hexVal = '0x' + val.toString(16).toUpperCase().padStart(4, '0');
        output += `daten[${i}] = ${hexVal};\n`;
      }
    }
    downloadFile(output, 'relais_programm.txt');
  }

  function downloadFile(content, filename) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
</script>

<div class="tab-pane active" id="tab-editor">
  <div class="editor-toolbar">
    <div class="preset-selector">
      <label for="machine-preset-select">Beispielprogramm laden:</label>
      <select 
        id="machine-preset-select"
        value={selectedPreset} 
        onchange={(e) => loadPreset(e.target.value)}
      >
        <option value="matrix_bounce">🎨 64x64 Matrix: Bouncing Ball & Frame</option>
        <option value="dijkstra">🗺️ Dijkstra: Kürzester Weg Österreich (17 Städte)</option>
      </select>
    </div>
    <div class="editor-actions">
      <button class="btn-subtle" onclick={convertFormat} title="Zwischen 'daten[n]=...' und Arduino Loader 'addr val' wechseln">
        🔄 Format konvertieren
      </button>
      <button class="btn btn-primary" onclick={loadCode}>
        ⚡ In Simulator laden & Reset
      </button>
      <button class="btn-subtle" onclick={exportArduinoFormat}>
        📥 Arduino-Format
      </button>
      <button class="btn-subtle" onclick={exportCArrayFormat}>
        📥 C-Array Format
      </button>
    </div>
  </div>

  <div class="editor-container">
    <textarea bind:value={codeText} spellcheck="false" placeholder="// Maschinencode eingeben..."></textarea>
  </div>
  <div class="editor-status">
    {statusMessage}
  </div>
</div>
