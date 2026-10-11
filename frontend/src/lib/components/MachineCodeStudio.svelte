<script>
  import { cpu } from '../stores/cpuStore.svelte.js';
  import FlashModal from './FlashModal.svelte';
  import ImportArrayModal from './ImportArrayModal.svelte';
  import { PRESETS } from '../data/machinePresets.js';

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
        <option value="gleichung_2x2">📐 2x2 Gleichungssystem auf 32x32 Matrix (Hardware-Standard)</option>
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
