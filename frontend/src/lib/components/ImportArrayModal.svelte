<script>
  let { 
    isOpen = $bindable(false), 
    targetMode = 'asm', // 'asm' | 'basic' | 'machine'
    onImport = () => {} 
  } = $props();

  let arrayCode = $state('');
  let isProcessing = $state(false);
  let statusMessage = $state('');
  let statusType = $state(''); // 'success' | 'error' | ''
  let fileInputEl = $state(null);

  const PRESETS = {
    division_pi: `daten[0] = 0x4000;		// NOP
daten[1] = 400;

// DIV_LOOP
//*********
// Ckeck bitposition
daten[11] = 0x1800;		// LDAM
daten[12] = 202;			// bitposition
daten[13] = 0x4018;		// BZ
daten[14] = 83;         // Finished
daten[15] = 0x3440;		//ADD
daten[16] = 0xFFFF;		// -1
daten[17] = 0x2800;		// STAM
daten[18] = 202;			// Save bitposition -1

daten[19] = 0x1800;		// LDAM
daten[20] = 203;			// Dividend
daten[21] = 0x4010;		// BN
daten[22] = 29;         // BN_MSB_IS_ONE

daten[23] = 0x1400;		// LDA
daten[24] = 0;          // 0 into Accu
daten[25] = 0x2800;		// STAM
daten[26] = 205;		// TMP
daten[27] = 0x4000;		//BA
daten[28] = 33;        // SHIFT_DIVIDEND

daten[29] = 0x1400;		// LDA
daten[30] = 1;          // 1 into Accu
daten[31] = 0x2800;		// STAM
daten[32] = 205;		// TMP

daten[33] = 0x1800;		// LDAM
daten[34] = 203;		// Dividend
daten[35] = 0x35C0;		// SHL
daten[36] = 0x0000;
daten[37] = 0x2800;		// STAM
daten[38] = 203;		// Dividend	

daten[39] = 0x1800;		// LDAM
daten[40] = 201;		// Rest
daten[41] = 0x35C0;		// SHL
daten[42] = 0x0000;
daten[43] = 0x2800;		// STAM
daten[44] = 48;			// Write Rest to ADD command

daten[45] = 0x1800;		// LDAM
daten[46] = 205;		// TMP
daten[47] = 0x3440;		//ADD
daten[48] = 0x0000;		// Rest + TMP
daten[49] = 0x2800;		// STAM
daten[50] = 201;		// Write Rest

daten[51] = 0x2800;		// STAM
daten[52] = 60;		// Rest into add command
daten[53] = 0x1800;		// LDAM
daten[54] = 204;		// Divisor
daten[55] = 0x3540;		//NOT
daten[56] = 0;
daten[57] = 0x3440;		//ADD
daten[58] = 0x0001;
daten[59] = 0x3440;		//ADD
daten[60] = 0x0000;
daten[61] = 0x4010;		// BN
daten[62] = 75;         // Divisor > Rest

daten[63] = 0x2800;		// STAM
daten[64] = 201;			// Rest - Divisor -> Rest

daten[65] = 0x1800;		// LDAM
daten[66] = 200;		// Quotient
daten[67] = 0x35C0;		// SHL
daten[68] = 0x0000;
daten[69] = 0x3440;		//ADD
daten[70] = 0x0001;
daten[71] = 0x2800;		// STAM
daten[72] = 200;		// Quotient
daten[73] = 0x4000;		//BA
daten[74] = 11;          // Back to main loop

daten[75] = 0x1800;		// LDAM
daten[76] = 200;		// Quotient
daten[77] = 0x35C0;		// SHL
daten[78] = 0x0000;
daten[79] = 0x2800;		// STAM
daten[80] = 200;		// Quotient
daten[81] = 0x4000;		//BA
daten[82] = 11;          // Back to main loop

daten[83] = 0x1800;		// LDAM
daten[84] = 200;		// Quotient
daten[85] = 0x6000;    // RETURN

daten[200] = 0;		// Quotient
daten[201] = 0;		// Rest
daten[202] = 16;	// Bitposition
daten[203] = 400;	// Dividend
daten[204] = 24;	// Divisor
daten[205] = 0;		// TMP

daten[300] = 0x1400;		// LDA
daten[301] = 0x0000;   	// 0000 into Accu
daten[302] = 0x2800;		// STAM
daten[303] = 200;		    // Quotient
daten[304] = 0x2800;		// STAM
daten[305] = 201;		    // Rest
daten[306] = 0x2800;		// STAM
daten[307] = 205;		    // TMP
daten[308] = 0x1400;		// LDA
daten[309] = 16;   	        // Bitposition
daten[310] = 0x2800;		// STAM
daten[311] = 202;		    // TMP
daten[312] = 0x6000;    // RETURN

daten[400] = 0x5000;   // CALL to DIV
daten[401] = 11;
daten[402] = 0x2800;		// STAM
daten[403] = 407;
daten[404] = 0x1400;		// LDA
daten[405] = 300;
daten[406] = 0x3440;		//ADD
daten[407] = 0x0000;		// First two parameters
daten[408] = 0x2800;		// STAM
daten[409] = 500;
daten[410] = 0x5000;   // CALL to Init
daten[411] = 300;
daten[412] = 0x1400;		// LDA
daten[413] = 400;
daten[414] = 0x2800;		// STAM
daten[415] = 203;
daten[416] = 0x1400;		// LDA
daten[417] = 120;
daten[418] = 0x2800;		// STAM
daten[419] = 204;
daten[420] = 0x5000;   // CALL to DIV
daten[421] = 11;
daten[422] = 0x3540;    // NOT
daten[423] = 0x0000;
daten[424] = 0x3440;		//ADD
daten[425] = 0x0001;
daten[426] = 0x2800;		// STAM
daten[427] = 431;
daten[428] = 0x1800;		// LDAM
daten[429] = 500;		// Quotient
daten[430] = 0x3440;		//ADD
daten[431] = 0x0000;
daten[432] = 0x2800;		// STAM
daten[433] = 500;
daten[434] = 0x5000;   // CALL to Init
daten[435] = 300;
daten[436] = 0x1400;		// LDA
daten[437] = 400;
daten[438] = 0x2800;		// STAM
daten[439] = 203;
daten[440] = 0x1400;		// LDA
daten[441] = 336;
daten[442] = 0x2800;		// STAM
daten[443] = 204;
daten[444] = 0x5000;   // CALL to DIV
daten[445] = 11;
daten[446] = 0x2800;		// STAM
daten[447] = 451;
daten[448] = 0x1800;		// LDAM
daten[449] = 500;		// Quotient
daten[450] = 0x3440;		//ADD
daten[451] = 0x0000;
daten[452] = 0x2800;		// STAM
daten[453] = 500;

daten[500] = 0;			// PI`,

    c_array_block: `// C/C++ PROGMEM Array
const uint16_t program[] = {
    0x1400, 42,      // LDA #42
    0x2800, 500,     // STAM 500
    0x1800, 500,     // LDAM 500
    0x3440, 1,       // ADD #1
    0x2800, 500,     // STAM 500
    0x4000, 4        // BA 4 (Loop)
};`
  };

  function loadSample(key) {
    if (PRESETS[key]) {
      arrayCode = PRESETS[key];
      statusMessage = 'Beispielcode geladen.';
      statusType = 'success';
    }
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        arrayCode = text;
        statusMessage = `Datei '${file.name}' eingelesen.`;
        statusType = 'success';
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  async function processImport(mode) {
    if (!arrayCode.trim()) {
      statusMessage = 'Bitte füge zuerst Maschinencode oder ein C-Array ein.';
      statusType = 'error';
      return;
    }

    isProcessing = true;
    statusMessage = 'Verarbeite Array-Struktur...';
    statusType = '';

    try {
      if (mode === 'asm') {
        const resp = await fetch('/api/disasm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ source: arrayCode })
        });
        const data = await resp.json();
        if (data.success && data.asmCode) {
          onImport({ mode: 'asm', code: data.asmCode });
          isOpen = false;
        } else {
          statusMessage = data.error || 'Fehler beim Disassemblieren';
          statusType = 'error';
        }
      } else if (mode === 'basic') {
        const resp = await fetch('/api/decompile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ source: arrayCode })
        });
        const data = await resp.json();
        if (data.success && data.basicCode) {
          onImport({ mode: 'basic', code: data.basicCode });
          isOpen = false;
        } else {
          statusMessage = data.error || 'Fehler beim Dekompilieren';
          statusType = 'error';
        }
      } else {
        // Machine / Simulator mode
        onImport({ mode: 'machine', code: arrayCode });
        isOpen = false;
      }
    } catch (err) {
      statusMessage = `Netzwerkfehler: ${err.message}`;
      statusType = 'error';
    } finally {
      isProcessing = false;
    }
  }
</script>

{#if isOpen}
  <div class="modal-backdrop" onclick={() => isOpen = false} role="presentation">
    <div class="modal-dialog" onclick={(e) => e.stopPropagation()} role="dialog">
      <div class="modal-header">
        <div class="modal-title-group">
          <span class="modal-icon">📥</span>
          <div>
            <h3 class="modal-title">Array / Maschinencode importieren</h3>
            <p class="modal-subtitle">
              Unterstützt C/C++ (<code>daten[n]=...</code>), C-Array Block (<code>{'{'} 0x... {'}'}</code>), Arduino <code>.ino</code>, VHDL und Adress-Dumps.
            </p>
          </div>
        </div>
        <button class="modal-close-btn" onclick={() => isOpen = false} title="Schließen">&times;</button>
      </div>

      <div class="modal-body">
        <div class="toolbar-row">
          <div class="quick-samples">
            <span class="sample-label">Beispiel laden:</span>
            <button class="sample-btn" onclick={() => loadSample('division_pi')}>
              🧮 Division &amp; PI (daten[...])
            </button>
            <button class="sample-btn" onclick={() => loadSample('c_array_block')}>
              📦 C-Array Block
            </button>
          </div>

          <button class="btn-file-upload" onclick={() => fileInputEl?.click()}>
            📂 Datei auswählen (.txt, .c, .ino, .vhd)
          </button>
          <input 
            type="file" 
            bind:this={fileInputEl} 
            accept=".txt,.c,.cpp,.h,.ino,.vhd,.asm" 
            style="display: none;" 
            onchange={handleFileSelect} 
          />
        </div>

        <textarea 
          class="code-textarea" 
          bind:value={arrayCode}
          placeholder="// Hier C-Array, daten[...] Zuweisungen oder Arduino-Maschinencode einfuegen..."
          rows="14"
        ></textarea>

        {#if statusMessage}
          <div class="status-box {statusType}">
            {statusMessage}
          </div>
        {/if}
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" onclick={() => isOpen = false}>
          Abbrechen
        </button>

        <div class="action-buttons">
          {#if targetMode === 'asm'}
            <button 
              class="btn btn-primary" 
              disabled={isProcessing} 
              onclick={() => processImport('asm')}
            >
              {isProcessing ? '⏳ Verarbeite...' : '⚡ In 16-Bit Assembler umwandeln'}
            </button>
          {:else if targetMode === 'basic'}
            <button 
              class="btn btn-primary" 
              disabled={isProcessing} 
              onclick={() => processImport('basic')}
            >
              {isProcessing ? '⏳ Dekompiliere...' : '⚡ In Clack-BASIC dekompilieren'}
            </button>
          {:else}
            <button 
              class="btn btn-primary" 
              disabled={isProcessing} 
              onclick={() => processImport('machine')}
            >
              ⚡ In Maschinencode-Editor laden
            </button>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
  }

  .modal-dialog {
    background: #161b22;
    border: 1px solid #30363d;
    border-radius: 12px;
    width: 90%;
    max-width: 780px;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .modal-header {
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #30363d;
    background: #0d1117;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .modal-title-group {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .modal-icon {
    font-size: 1.75rem;
  }

  .modal-title {
    margin: 0;
    font-size: 1.15rem;
    color: #f0f6fc;
    font-weight: 600;
  }

  .modal-subtitle {
    margin: 0.2rem 0 0 0;
    font-size: 0.8rem;
    color: #8b949e;
  }

  .modal-subtitle code {
    background: #21262d;
    padding: 1px 4px;
    border-radius: 4px;
    color: #58a6ff;
  }

  .modal-close-btn {
    background: none;
    border: none;
    color: #8b949e;
    font-size: 1.5rem;
    cursor: pointer;
    line-height: 1;
  }

  .modal-close-btn:hover {
    color: #f0f6fc;
  }

  .modal-body {
    padding: 1.25rem 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .toolbar-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .quick-samples {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .sample-label {
    font-size: 0.8rem;
    color: #8b949e;
  }

  .sample-btn {
    background: #21262d;
    border: 1px solid #30363d;
    color: #c9d1d9;
    padding: 0.3rem 0.6rem;
    border-radius: 6px;
    font-size: 0.75rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .sample-btn:hover {
    background: #30363d;
    color: #58a6ff;
  }

  .btn-file-upload {
    background: #1f6feb22;
    border: 1px solid #1f6feb55;
    color: #58a6ff;
    padding: 0.35rem 0.75rem;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .btn-file-upload:hover {
    background: #1f6feb44;
  }

  .code-textarea {
    width: 100%;
    background: #0d1117;
    border: 1px solid #30363d;
    border-radius: 6px;
    color: #f0f6fc;
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 0.85rem;
    padding: 0.75rem;
    resize: vertical;
    outline: none;
    box-sizing: border-box;
    line-height: 1.5;
  }

  .code-textarea:focus {
    border-color: #58a6ff;
    box-shadow: 0 0 0 2px rgba(88, 166, 255, 0.2);
  }

  .status-box {
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
    font-size: 0.8rem;
    background: #21262d;
    color: #8b949e;
    border: 1px solid #30363d;
  }

  .status-box.success {
    background: rgba(46, 160, 67, 0.15);
    border-color: rgba(46, 160, 67, 0.4);
    color: #3fb950;
  }

  .status-box.error {
    background: rgba(248, 81, 73, 0.15);
    border-color: rgba(248, 81, 73, 0.4);
    color: #f85149;
  }

  .modal-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid #30363d;
    background: #0d1117;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .action-buttons {
    display: flex;
    gap: 0.5rem;
  }
</style>
