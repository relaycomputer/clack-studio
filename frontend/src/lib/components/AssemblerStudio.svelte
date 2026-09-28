<script>
  import { onMount } from 'svelte';
  import { EditorView, basicSetup } from 'codemirror';
  import { EditorState } from '@codemirror/state';
  import { asmLanguage } from '../codemirror/asmLanguage.js';
  import { clackTheme } from '../codemirror/basicLanguage.js';
  import { cpu } from '../stores/cpuStore.svelte.js';
  import { settings } from '../stores/settingsStore.svelte.js';
  import FlashModal from './FlashModal.svelte';

  const ASM_PRESETS = {
    matrix_bounce: `; ============================================================
; 🏓 16-Bit Relais-Assembler: LED-Matrix Bouncing Pixel Demo
; ============================================================
ORG 0

START:
    ; Framebuffer Display Wort 0 leeren (Zeile 0, Pixel 0..15)
    LDA #0
    STAM 960

    ; Variablen initialisieren
    LDA #0
    STAM 500       ; Pixel-Position X (0..15)
    LDA #1
    STAM 501       ; Bitmaske (0x0001)

BOUNCE_LOOP:
    ; Aktuelle Bitmaske in Framebuffer schreiben
    LDAM 501
    STAM 960

    ; Bitmaske nach links rotieren (Pixel wandert nach links)
    LDAM 501
    SHL
    STAM 501

    ; Pruefen ob Bit 15 erreicht (Negative Flag)
    BN RESET_BIT

    ; Pause-Schleife (Verzoegerung)
    LDA #50
    STAM 502
DELAY_LOOP:
    LDAM 502
    ADD #-1
    STAM 502
    BZ BOUNCE_LOOP
    BA DELAY_LOOP

RESET_BIT:
    LDA #1
    STAM 501
    BA BOUNCE_LOOP
`,

    collatz: `; ============================================================
; 🔢 16-Bit Relais-Assembler: Collatz-Folge (3n + 1)
; ============================================================
ORG 0

START:
    NOP

LOOP:
    ; Pruefe ob V_200 == 1 (Ziel erreicht)
    LDAM 200
    ADD #-1
    BZ FINISH

    ; Pruefe ob Zahl gerade ist (Bit 0 == 0)
    LDAM 200
    BE EVEN_NUMBER

ODD_NUMBER:
    ; Ungerade: 3n + 1 (entspricht 2n + n + 1)
    LDAM 200
    STAM 16        ; n sichern
    SHL            ; 2n
    ADD 16         ; 3n
    ADD #1         ; 3n + 1
    BA UPDATE_VAL

EVEN_NUMBER:
    ; Gerade: n / 2
    LDAM 200
    SHR

UPDATE_VAL:
    STAM 200       ; Neuer Wert
    LDAM 201
    ADD #1
    STAM 201       ; Schrittzaehler + 1
    BA LOOP

FINISH:
    LDAM 201       ; Ergebnis im Akku
    HALT
`,

    fibonacci: `; ============================================================
; 🌀 16-Bit Relais-Assembler: Fibonacci-Sequenz
; ============================================================
ORG 0

START:
    LDA #0
    STAM 500       ; F0 = 0
    LDA #1
    STAM 501       ; F1 = 1
    LDA #10
    STAM 502       ; Countdown = 10 Terme

FIB_LOOP:
    ; F2 = F0 + F1
    LDAM 500
    ADD 501
    STAM 503       ; F2

    ; Weiterschieben: F0 = F1, F1 = F2
    LDAM 501
    STAM 500
    LDAM 503
    STAM 501

    ; Countdown dekrementieren
    LDAM 502
    ADD #-1
    STAM 502
    BZ DONE
    BA FIB_LOOP

DONE:
    LDAM 501       ; 10. Fibonacci-Zahl im Akku
    HALT
`
  };

  let editorContainer;
  let editorView;
  let currentPreset = $state('matrix_bounce');
  let currentFileName = $state('matrix_bounce.asm');
  let isEditingFileName = $state(false);
  let fileNameInputEl = $state(null);
  let fileInputEl = $state(null);

  let compileStatus = $state({
    loading: false,
    success: null,
    message: '',
    words: 0,
    timeMs: 0
  });

  let decompileStatus = $state({
    loading: false,
    message: ''
  });

  let assembledArduinoCode = $state('');
  let isFlashModalOpen = $state(false);

  onMount(() => {
    const startCode = settings.sharedAsmCode || ASM_PRESETS.matrix_bounce;

    const state = EditorState.create({
      doc: startCode,
      extensions: [
        basicSetup,
        asmLanguage,
        clackTheme,
        EditorView.lineWrapping
      ]
    });

    editorView = new EditorView({
      state,
      parent: editorContainer
    });

    if (settings.sharedAsmCode) {
      currentFileName = 'decompiled.asm';
      settings.sharedAsmCode = '';
    }

    return () => {
      editorView?.destroy();
    };
  });

  $effect(() => {
    if (settings.sharedAsmCode && editorView) {
      setEditorContent(settings.sharedAsmCode);
      currentFileName = 'decompiled.asm';
      settings.sharedAsmCode = '';
    }
  });

  function setEditorContent(code) {
    if (!editorView) return;
    editorView.dispatch({
      changes: {
        from: 0,
        to: editorView.state.doc.length,
        insert: code
      }
    });
  }

  function loadPreset(key) {
    currentPreset = key;
    currentFileName = `${key}.asm`;
    if (ASM_PRESETS[key]) {
      setEditorContent(ASM_PRESETS[key]);
    }
  }

  // --- Dateiverwaltung ---
  function newFile() {
    currentFileName = 'unnamed.asm';
    setEditorContent(`; ============================================================
; ⚡ Neues Clack-Assembler Programm
; ============================================================
ORG 0

START:
    LDA #16
    STAM 500
LOOP:
    LDAM 500
    ADD #1
    STAM 500
    BA LOOP
`);
  }

  function openFilePicker() {
    fileInputEl?.click();
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    currentFileName = file.name;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        setEditorContent(text);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function saveFile() {
    const code = editorView?.state.doc.toString() || '';
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFileName || 'program.asm';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function saveFileAs() {
    const newName = prompt('Dateinamen eingeben:', currentFileName || 'program.asm');
    if (newName && newName.trim() !== '') {
      currentFileName = newName.trim().endsWith('.asm') ? newName.trim() : `${newName.trim()}.asm`;
      saveFile();
    }
  }

  function startRename() {
    isEditingFileName = true;
    setTimeout(() => fileNameInputEl?.focus(), 50);
  }

  function finishRename() {
    isEditingFileName = false;
    if (!currentFileName.trim()) {
      currentFileName = 'unnamed.asm';
    } else if (!currentFileName.includes('.')) {
      currentFileName += '.asm';
    }
  }

  // --- Assemblieren & Simulator ---
  async function assembleCode(autoLoad = false) {
    const source = editorView?.state.doc.toString() || '';
    compileStatus.loading = true;
    compileStatus.success = null;
    compileStatus.message = 'Assembliere...';

    try {
      const resp = await fetch('/api/assemble', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source })
      });
      const data = await resp.json();

      if (data.success) {
        compileStatus.success = true;
        compileStatus.words = data.usedWords;
        compileStatus.timeMs = data.durationMs;
        compileStatus.message = `Erfolg: ${data.usedWords} Worte in ${data.durationMs.toFixed(2)} ms`;
        assembledArduinoCode = data.arduinoCode;

        if (autoLoad && data.carrayCode) {
          cpu.loadProgram(data.carrayCode);
          cpu.reset();
        }
        return true;
      } else {
        compileStatus.success = false;
        compileStatus.message = data.error || 'Fehler beim Assemblieren';
        return false;
      }
    } catch (err) {
      compileStatus.success = false;
      compileStatus.message = `Verbindungsfehler: ${err.message}`;
      return false;
    } finally {
      compileStatus.loading = false;
    }
  }

  // --- Assembler to BASIC Decompiler ---
  async function decompileToBasic() {
    const source = editorView?.state.doc.toString() || '';
    decompileStatus.loading = true;
    decompileStatus.message = 'Dekompiliere nach Clack-BASIC...';

    try {
      const resp = await fetch('/api/decompile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source })
      });
      const data = await resp.json();

      if (data.success && data.basicCode) {
        // Switch to BASIC tab and load code
        settings.switchToBasic(data.basicCode);
      } else {
        alert(data.error || 'Dekompilier-Fehler');
      }
    } catch (err) {
      alert(`Fehler beim Dekompilieren: ${err.message}`);
    } finally {
      decompileStatus.loading = false;
    }
  }

  async function openFlashDialog() {
    const ok = await assembleCode(false);
    if (ok) {
      isFlashModalOpen = true;
    }
  }
</script>

<div class="studio-container">
  <!-- Top Action & File Toolbar -->
  <div class="studio-toolbar">
    <div class="toolbar-left">
      <!-- File Management -->
      <div class="file-operations-group">
        <button class="tool-btn file-btn" onclick={newFile} title="Neues Programm erstellen">
          📄 Neu
        </button>
        <button class="tool-btn file-btn" onclick={openFilePicker} title="Assembler-Datei von Festplatte oeffnen">
          📂 Oeffnen...
        </button>
        <input 
          type="file" 
          accept=".asm,.txt,.s,.inc" 
          bind:this={fileInputEl} 
          onchange={handleFileSelect} 
          style="display: none;" 
        />
        <button class="tool-btn file-btn" onclick={saveFile} title="Aktuelle Datei speichern">
          💾 Speichern
        </button>
        <button class="tool-btn file-btn" onclick={saveFileAs} title="Unter neuem Namen speichern">
          💾 Als...
        </button>

        <!-- Active File Badge -->
        <div class="file-badge" title="Klicken zum Umbenennen">
          <span class="file-icon">📜</span>
          {#if isEditingFileName}
            <input 
              type="text" 
              class="file-name-input" 
              bind:this={fileNameInputEl}
              bind:value={currentFileName} 
              onblur={finishRename}
              onkeydown={(e) => e.key === 'Enter' && finishRename()}
            />
          {:else}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <span class="file-name" onclick={startRename}>{currentFileName}</span>
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <span class="file-edit-icon" onclick={startRename}>✏️</span>
          {/if}
        </div>
      </div>

      <!-- Presets -->
      <div class="preset-selector">
        <label for="asm-preset-select">Preset:</label>
        <select 
          id="asm-preset-select"
          bind:value={currentPreset} 
          onchange={(e) => loadPreset(e.target.value)}
        >
          <option value="matrix_bounce">🏓 LED-Matrix Bouncing Pixel</option>
          <option value="collatz">🔢 Collatz-Folge 3n+1 Benchmark</option>
          <option value="fibonacci">🌀 Fibonacci-Rechner</option>
        </select>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="toolbar-right">
      <button 
        class="action-btn compile-btn"
        disabled={compileStatus.loading}
        onclick={() => assembleCode(true)}
      >
        {#if compileStatus.loading}
          ⏳ Assembliere...
        {:else}
          ⚡ In Simulator laden & Reset
        {/if}
      </button>

      <button 
        class="action-btn decompile-btn"
        disabled={decompileStatus.loading}
        onclick={decompileToBasic}
        title="Wandelt diesen Assembler-Code in lesbares Clack-BASIC um!"
      >
        {#if decompileStatus.loading}
          ⏳ Wandle um...
        {:else}
          🔄 In BASIC umwandeln
        {/if}
      </button>

      <button 
        class="action-btn flash-btn"
        onclick={openFlashDialog}
      >
        🚀 Auf Arduino flashen
      </button>
    </div>
  </div>

  <!-- Status Bar -->
  {#if compileStatus.success !== null}
    <div class="status-banner" class:error={!compileStatus.success} class:success={compileStatus.success}>
      <span>{compileStatus.message}</span>
      {#if compileStatus.success}
        <span class="badge">{compileStatus.words} / 1024 Worte</span>
      {/if}
    </div>
  {/if}

  <!-- CodeMirror Editor -->
  <div class="editor-wrapper" bind:this={editorContainer}></div>

  <!-- Flash Modal -->
  <FlashModal 
    bind:isOpen={isFlashModalOpen}
    initialSource={assembledArduinoCode}
  />
</div>

<style>
  .studio-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #0d1117;
    border-radius: 8px;
    overflow: hidden;
  }

  .studio-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: #161b22;
    border-bottom: 1px solid #30363d;
    gap: 8px;
    flex-wrap: wrap;
  }

  .toolbar-left, .toolbar-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .preset-selector {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #8b949e;
    font-size: 12px;
  }

  .preset-selector select {
    background: #0d1117;
    color: #c9d1d9;
    border: 1px solid #30363d;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
  }

  .action-btn {
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all 0.2s;
  }

  .compile-btn {
    background: #238636;
    color: #ffffff;
  }
  .compile-btn:hover:not(:disabled) {
    background: #2ea043;
  }

  .decompile-btn {
    background: #1f6feb;
    color: #ffffff;
  }
  .decompile-btn:hover:not(:disabled) {
    background: #388bfd;
  }

  .flash-btn {
    background: #8957e5;
    color: #ffffff;
  }
  .flash-btn:hover {
    background: #a371f7;
  }

  .action-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .status-banner {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 12px;
    font-size: 12px;
    border-bottom: 1px solid #30363d;
  }

  .status-banner.success {
    background: rgba(46, 160, 67, 0.15);
    color: #3fb950;
    border-color: #238636;
  }

  .status-banner.error {
    background: rgba(248, 81, 73, 0.15);
    color: #f85149;
    border-color: #da3633;
  }

  .badge {
    background: #30363d;
    padding: 2px 6px;
    border-radius: 10px;
    font-size: 11px;
  }

  .editor-wrapper {
    flex: 1;
    overflow: hidden;
    height: 100%;
    min-height: 450px;
  }

  :global(.editor-wrapper .cm-editor) {
    height: 100%;
  }
</style>
