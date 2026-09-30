<script>
  import { cpu } from '../stores/cpuStore.svelte.js';
  import FlashModal from './FlashModal.svelte';
  import ImportArrayModal from './ImportArrayModal.svelte';

  const PRESETS = {
    division_pi: `// ============================================================
// ⚡ Division & PI Berechnung (Software PI Algorithmus)
// ============================================================
daten[0] = 0x4000;		// BA 400 (Start Main Programm)
daten[1] = 400;

// DIV_LOOP (Unterprogramm Division)
daten[11] = 0x1800;		// LDAM 202 (Bitposition)
daten[12] = 202;
daten[13] = 0x4018;		// BZ 83 (Fertig)
daten[14] = 83;
daten[15] = 0x3440;		// ADD -1
daten[16] = 0xFFFF;
daten[17] = 0x2800;		// STAM 202
daten[18] = 202;
daten[19] = 0x1800;		// LDAM 203 (Dividend)
daten[20] = 203;
daten[21] = 0x4010;		// BN 29 (MSB ist 1)
daten[22] = 29;
daten[23] = 0x1400;		// LDA 0
daten[24] = 0;
daten[25] = 0x2800;		// STAM 205 (TMP)
daten[26] = 205;
daten[27] = 0x4000;		// BA 33 (Shift Dividend)
daten[28] = 33;
daten[29] = 0x1400;		// LDA 1
daten[30] = 1;
daten[31] = 0x2800;		// STAM 205 (TMP)
daten[32] = 205;
daten[33] = 0x1800;		// LDAM 203
daten[34] = 203;
daten[35] = 0x35C0;		// SHL
daten[36] = 0x0000;
daten[37] = 0x2800;		// STAM 203
daten[38] = 203;
daten[39] = 0x1800;		// LDAM 201 (Rest)
daten[40] = 201;
daten[41] = 0x35C0;		// SHL
daten[42] = 0x0000;
daten[43] = 0x2800;		// STAM 48
daten[44] = 48;
daten[45] = 0x1800;		// LDAM 205
daten[46] = 205;
daten[47] = 0x3440;		// ADD Rest+TMP
daten[48] = 0x0000;
daten[49] = 0x2800;		// STAM 201
daten[50] = 201;
daten[51] = 0x2800;		// STAM 60
daten[52] = 60;
daten[53] = 0x1800;		// LDAM 204 (Divisor)
daten[54] = 204;
daten[55] = 0x3540;		// NOT
daten[56] = 0;
daten[57] = 0x3440;		// ADD 1
daten[58] = 0x0001;
daten[59] = 0x3440;		// ADD
daten[60] = 0x0000;
daten[61] = 0x4010;		// BN 75 (Divisor > Rest)
daten[62] = 75;
daten[63] = 0x2800;		// STAM 201
daten[64] = 201;
daten[65] = 0x1800;		// LDAM 200 (Quotient)
daten[66] = 200;
daten[67] = 0x35C0;		// SHL
daten[68] = 0x0000;
daten[69] = 0x3440;		// ADD 1
daten[70] = 0x0001;
daten[71] = 0x2800;		// STAM 200
daten[72] = 200;
daten[73] = 0x4000;		// BA 11 (Loop)
daten[74] = 11;
daten[75] = 0x1800;		// LDAM 200
daten[76] = 200;
daten[77] = 0x35C0;		// SHL
daten[78] = 0x0000;
daten[79] = 0x2800;		// STAM 200
daten[80] = 200;
daten[81] = 0x4000;		// BA 11
daten[82] = 11;
daten[83] = 0x1800;		// LDAM 200
daten[84] = 200;
daten[85] = 0x6000;    // RETURN

// Variablen
daten[200] = 0;		// Quotient
daten[201] = 0;		// Rest
daten[202] = 16;	// Bitposition
daten[203] = 400;	// Dividend
daten[204] = 24;	// Divisor
daten[205] = 0;		// TMP

// Init DIV
daten[300] = 0x1400;		// LDA 0
daten[301] = 0x0000;
daten[302] = 0x2800;		// STAM 200
daten[303] = 200;
daten[304] = 0x2800;		// STAM 201
daten[305] = 201;
daten[306] = 0x2800;		// STAM 205
daten[307] = 205;
daten[308] = 0x1400;		// LDA 16
daten[309] = 16;
daten[310] = 0x2800;		// STAM 202
daten[311] = 202;
daten[312] = 0x6000;    // RETURN

// Main Programm
daten[400] = 0x5000;   // CALL 11 (DIV)
daten[401] = 11;
daten[402] = 0x2800;		// STAM 407
daten[403] = 407;
daten[404] = 0x1400;		// LDA 300
daten[405] = 300;
daten[406] = 0x3440;		// ADD 0
daten[407] = 0x0000;
daten[408] = 0x2800;		// STAM 500
daten[409] = 500;
daten[410] = 0x5000;   // CALL 300 (Init)
daten[411] = 300;
daten[412] = 0x1400;		// LDA 400
daten[413] = 400;
daten[414] = 0x2800;		// STAM 203
daten[415] = 203;
daten[416] = 0x1400;		// LDA 120
daten[417] = 120;
daten[418] = 0x2800;		// STAM 204
daten[419] = 204;
daten[420] = 0x5000;   // CALL 11 (DIV)
daten[421] = 11;
daten[422] = 0x3540;    // NOT
daten[423] = 0x0000;
daten[424] = 0x3440;		// ADD 1
daten[425] = 0x0001;
daten[426] = 0x2800;		// STAM 431
daten[427] = 431;
daten[428] = 0x1800;		// LDAM 500
daten[429] = 500;
daten[430] = 0x3440;		// ADD 0
daten[431] = 0x0000;
daten[432] = 0x2800;		// STAM 500
daten[433] = 500;
daten[434] = 0x5000;   // CALL 300 (Init)
daten[435] = 300;
daten[436] = 0x1400;		// LDA 400
daten[437] = 400;
daten[438] = 0x2800;		// STAM 203
daten[439] = 203;
daten[440] = 0x1400;		// LDA 336
daten[441] = 336;
daten[442] = 0x2800;		// STAM 204
daten[443] = 204;
daten[444] = 0x5000;   // CALL 11 (DIV)
daten[445] = 11;
daten[446] = 0x2800;		// STAM 451
daten[447] = 451;
daten[448] = 0x1800;		// LDAM 500
daten[449] = 500;
daten[450] = 0x3440;		// ADD 0
daten[451] = 0x0000;
daten[452] = 0x2800;		// STAM 500
daten[453] = 500;

daten[500] = 0;			// PI
`,

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

  let codeText = $state(PRESETS.division_pi);
  let statusMessage = $state("Unterstützt 'daten[n] = ...', C-Array Block '{ 0x... }', Arduino .ino und Loader ('0 0x4000' / 'CLR').");
  let selectedPreset = $state('division_pi');
  let showImportModal = $state(false);

  function loadPreset(key) {
    selectedPreset = key;
    if (PRESETS[key]) {
      codeText = PRESETS[key];
      loadCode();
    }
  }

  function handleImportResult(result) {
    if (result && result.code) {
      codeText = result.code;
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

  let showFlashModal = $state(false);

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

<FlashModal bind:isOpen={showFlashModal} codeToFlash={codeText} />
<ImportArrayModal bind:isOpen={showImportModal} targetMode="machine" onImport={handleImportResult} />

<div class="tab-pane active" id="tab-editor">
  <div class="editor-toolbar">
    <div class="preset-selector">
      <label for="machine-preset-select">Beispielprogramm laden:</label>
      <select 
        id="machine-preset-select"
        value={selectedPreset} 
        onchange={(e) => loadPreset(e.target.value)}
      >
        <option value="division_pi">⚡ Division & PI Berechnung (Software PI Algorithmus)</option>
        <option value="matrix_bounce">🎨 64x64 Matrix: Bouncing Ball & Frame</option>
        <option value="dijkstra">🗺️ Dijkstra: Kürzester Weg Österreich (17 Städte)</option>
      </select>
    </div>
    <div class="editor-actions">
      <button class="btn btn-primary" onclick={() => showImportModal = true} title="Beliebiges C-Array, Arduino .ino oder VHDL Array importieren">
        📥 Array importieren
      </button>
      <button class="btn btn-warning" onclick={() => showFlashModal = true} title="Maschinencode direkt auf Arduino Mega flashen">
        🚀 Auf Arduino flashen
      </button>
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
