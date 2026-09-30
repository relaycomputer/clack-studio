<script>
  import { onMount } from 'svelte';
  import { EditorView, basicSetup } from 'codemirror';
  import { EditorState } from '@codemirror/state';
  import { basicLanguage, clackTheme } from '../codemirror/basicLanguage.js';
  import { cpu } from '../stores/cpuStore.svelte.js';
  import { settings } from '../stores/settingsStore.svelte.js';
  import FlashModal from './FlashModal.svelte';
  import ImportArrayModal from './ImportArrayModal.svelte';

  const BASIC_PRESETS = {
    ping_pong: `REM ============================================================
REM 🏓 Clack-BASIC: Ultra-Fast Autonomes Ping-Pong
REM ============================================================

REM 1. Initialisierung: Einmalig Bildschirm leeren
CLS

REM Ball-Koordinaten (Startmitte)
LET BX = 16
LET BY = 16
LET OLD_BX = 16
LET OLD_BY = 16
LET VX = 1
LET VY = 1

REM Paddle-Positionen (Hoehe 4 Pixel)
LET LY = 14
LET RY = 14
LET OLD_LY = 14
LET OLD_RY = 14

GAME_LOOP:
    REM --- Alte Positionen gezielt loeschen (Zero Flicker & Turbo-Speed!) ---
    PSET 1, OLD_LY, 0
    PSET 1, OLD_LY + 1, 0
    PSET 1, OLD_LY + 2, 0
    PSET 1, OLD_LY + 3, 0
    
    PSET 30, OLD_RY, 0
    PSET 30, OLD_RY + 1, 0
    PSET 30, OLD_RY + 2, 0
    PSET 30, OLD_RY + 3, 0
    
    PSET OLD_BX, OLD_BY, 0
    
    REM --- Neue Positionen zeichnen ---
    PSET 1, LY, 1
    PSET 1, LY + 1, 1
    PSET 1, LY + 2, 1
    PSET 1, LY + 3, 1
    
    PSET 30, RY, 1
    PSET 30, RY + 1, 1
    PSET 30, RY + 2, 1
    PSET 30, RY + 3, 1
    
    PSET BX, BY, 1
    
    REM --- Alte Positionen merken ---
    LET OLD_LY = LY
    LET OLD_RY = RY
    LET OLD_BX = BX
    LET OLD_BY = BY
    
    REM --- Ball bewegen ---
    LET BX = BX + VX
    LET BY = BY + VY
    
    REM --- Bandenkollision oben / unten ---
    IF BY <= 1 THEN
        LET VY = 1
    END IF
    IF BY >= 30 THEN
        LET VY = -1
    END IF
    
    REM --- Paddle-Kollision Links (X=2) ---
    IF BX <= 2 THEN
        LET VX = 1
    END IF
    
    REM --- Paddle-Kollision Rechts (X=29) ---
    IF BX >= 29 THEN
        LET VX = -1
    END IF
    
    REM --- Autonome KI: Linkes Paddle folgt Ball ---
    IF BY > LY + 1 THEN
        IF LY < 27 THEN
            LET LY = LY + 1
        END IF
    END IF
    IF BY < LY + 1 THEN
        IF LY > 1 THEN
            LET LY = LY - 1
        END IF
    END IF
    
    REM --- Autonome KI: Rechtes Paddle folgt Ball ---
    IF BY > RY + 1 THEN
        IF RY < 27 THEN
            LET RY = RY + 1
        END IF
    END IF
    IF BY < RY + 1 THEN
        IF RY > 1 THEN
            LET RY = RY - 1
        END IF
    END IF
    
    GOTO GAME_LOOP
`,

    graphics_demo: `REM ============================================================
REM ⚡ Clack-BASIC: 4-Display LED Matrix Grafik-Demo (32x32)
REM ============================================================

REM 1. Display leeren (Worte 960..1023)
CLS

REM 2. Diagonale Linie pixelweise zeichnen
FOR I = 0 TO 31 STEP 1
    PSET I, I, 1
NEXT I

REM 3. Horizontale Linie bei Y = 8
FOR X = 0 TO 31 STEP 1
    PSET X, 8, 1
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

  let editorContainer = $state(null);
  let editorView = $state(null);
  let fileInput = $state(null);

  let currentFileName = $state('ping_pong.bas');
  let selectedPreset = $state('ping_pong');
  let statusMessage = $state('⚡ Clack-BASIC Cross-Compiler bereit. Unterstützt CodeMirror 6 Syntax-Highlighting!');
  let statusType = $state('');
  let showListing = $state(false);
  let listingContent = $state('');

  function initEditor() {
    if (!editorContainer || editorView) return;

    const startState = EditorState.create({
      doc: BASIC_PRESETS.ping_pong,
      extensions: [
        basicSetup,
        basicLanguage,
        clackTheme,
        EditorView.lineWrapping
      ]
    });

    editorView = new EditorView({
      state: startState,
      parent: editorContainer
    });
  }

  function loadPreset(key) {
    selectedPreset = key;
    if (editorView && BASIC_PRESETS[key]) {
      editorView.dispatch({
        changes: { from: 0, to: editorView.state.doc.length, insert: BASIC_PRESETS[key] }
      });
      currentFileName = `${key}.bas`;
      statusType = '';
      statusMessage = `BASIC-Vorlage '${key}.bas' geladen. Bereit zum Kompilieren.`;
    }
  }

  function newFile() {
    const defaultTemplate = `REM ============================================================
REM ⚡ Clack-BASIC: Neues Programm
REM ============================================================

CLS
PRINT "Hallo Relais-Computer!"

HALT
`;
    currentFileName = 'unnamed.bas';
    selectedPreset = '';
    if (editorView) {
      editorView.dispatch({
        changes: { from: 0, to: editorView.state.doc.length, insert: defaultTemplate }
      });
    }
    statusType = '';
    statusMessage = '📄 Neues BASIC-Programm erstellt (unnamed.bas).';
  }

  function openFilePicker() {
    if (fileInput) {
      fileInput.value = '';
      fileInput.click();
    }
  }

  let showImportModal = $state(false);

  function handleImportResult(result) {
    if (result && result.code && editorView) {
      editorView.dispatch({
        changes: { from: 0, to: editorView.state.doc.length, insert: result.code }
      });
      currentFileName = 'imported_decompile.bas';
      selectedPreset = '';
      statusType = 'success';
      statusMessage = '📥 Array erfolgreich nach Clack-BASIC dekompiliert!';
      compileBasic(true);
    }
  }

  async function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const content = ev.target?.result;
      if (typeof content === 'string' && editorView) {
        const isArrayFile = content.includes('daten[') || content.includes('{') || file.name.endsWith('.txt') || file.name.endsWith('.ino') || file.name.endsWith('.c') || file.name.endsWith('.asm');
        if (isArrayFile && !file.name.endsWith('.bas')) {
          try {
            const resp = await fetch('/api/decompile', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ source: content })
            });
            const data = await resp.json();
            if (data.success && data.basicCode) {
              editorView.dispatch({
                changes: { from: 0, to: editorView.state.doc.length, insert: data.basicCode }
              });
              currentFileName = file.name.replace(/\.[^/.]+$/, "") + ".bas";
              selectedPreset = '';
              statusType = 'success';
              statusMessage = `🔄 '${file.name}' automatisch nach BASIC dekompiliert!`;
              compileBasic(true);
              return;
            }
          } catch (_) {}
        }

        editorView.dispatch({
          changes: { from: 0, to: editorView.state.doc.length, insert: content }
        });
        currentFileName = file.name;
        selectedPreset = '';
        statusType = 'success';
        statusMessage = `📂 '${file.name}' geladen (${content.length} Zeichen).`;
        compileBasic(true);
      }
    };
    reader.onerror = () => {
      statusType = 'error';
      statusMessage = `Fehler beim Lesen der Datei '${file.name}'.`;
    };
    reader.readAsText(file);
  }

  function saveFile() {
    if (!editorView) return;
    const content = editorView.state.doc.toString();
    const fileName = currentFileName.endsWith('.bas') ? currentFileName : currentFileName + '.bas';
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    try {
      localStorage.setItem('clack_basic_' + fileName, content);
    } catch {}

    statusType = 'success';
    statusMessage = `💾 '${fileName}' erfolgreich gespeichert & heruntergeladen.`;
  }

  function saveFileAs() {
    if (!editorView) return;
    const newName = prompt('Dateiname für "Speichern unter":', currentFileName);
    if (!newName || !newName.trim()) return;
    currentFileName = newName.trim().endsWith('.bas') ? newName.trim() : newName.trim() + '.bas';
    saveFile();
  }

  function renameFile() {
    const newName = prompt('Programm umbenennen in:', currentFileName);
    if (!newName || !newName.trim()) return;
    currentFileName = newName.trim().endsWith('.bas') ? newName.trim() : newName.trim() + '.bas';
    statusType = '';
    statusMessage = `Programm umbenannt in '${currentFileName}'.`;
  }

  async function compileBasic(loadIntoSim = false) {
    if (!editorView) return;
    const source = editorView.state.doc.toString();
    if (!source.trim()) {
      statusType = 'error';
      statusMessage = 'Fehler: Kein BASIC-Quellcode eingegeben.';
      return;
    }

    statusType = '';
    statusMessage = 'Kompiliere BASIC-Code mit Clack-BASIC...';

    const endpoint = loadIntoSim ? '/api/compile-and-load' : '/api/compile';

    try {
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: source, format: 'arduino' })
      });

      const data = await resp.json();

      if (!data.success) {
        statusType = 'error';
        statusMessage = `❌ ${data.error}`;
        return;
      }

      listingContent = data.listing || data.code;
      showListing = true;

      const pct = ((data.usedWords / data.totalWords) * 100).toFixed(1);

      if (loadIntoSim) {
        cpu.pause();
        const count = cpu.loadSource(data.arduinoCode);
        statusType = 'success';
        statusMessage = `✅ In ${data.durationMs.toFixed(2)} ms kompiliert & geladen (${count} Worte, ${pct}%). Drücke RUN!`;
      } else {
        statusType = 'success';
        statusMessage = `✅ In ${data.durationMs.toFixed(2)} ms erfolgreich kompiliert! Speicher: ${data.usedWords} / ${data.totalWords} Worte (${pct}%).`;
      }
    } catch (err) {
      statusType = 'error';
      statusMessage = `❌ Verbindungsfehler zum Compiler: ${err.message}`;
    }
  }

  async function exportCode(format) {
    if (!editorView) return;
    const source = editorView.state.doc.toString();
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

  let showFlashModal = $state(false);
  let flashCode = $state('');

  async function openFlashModal() {
    if (!editorView) return;
    const source = editorView.state.doc.toString();
    if (!source.trim()) {
      alert('Kein BASIC-Quellcode eingegeben.');
      return;
    }

    try {
      const resp = await fetch('/api/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: source, format: 'arduino' })
      });
      const data = await resp.json();
      if (!data.success) {
        alert('Kompilierfehler vor dem Flashen:\n' + data.error);
        return;
      }
      flashCode = data.code;
      showFlashModal = true;
    } catch (err) {
      alert('Fehler beim Vorbereiten des Flash-Codes: ' + err.message);
    }
  }

  async function convertToAssembly() {
    if (!editorView) return;
    const source = editorView.state.doc.toString();
    if (!source.trim()) {
      alert('Kein BASIC-Quellcode vorhanden.');
      return;
    }

    try {
      const resp = await fetch('/api/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: source, format: 'listing' })
      });
      const data = await resp.json();
      if (!data.success) {
        alert('Kompilierfehler:\n' + data.error);
        return;
      }
      settings.switchToAsm(data.listing);
    } catch (err) {
      alert('Fehler beim Konvertieren nach Assembler: ' + err.message);
    }
  }

  $effect(() => {
    if (settings.sharedBasicCode && editorView) {
      editorView.dispatch({
        changes: { from: 0, to: editorView.state.doc.length, insert: settings.sharedBasicCode }
      });
      currentFileName = 'decompiled.bas';
      selectedPreset = '';
      statusType = 'success';
      statusMessage = '🔄 BASIC-Code aus Assembler/Maschinencode dekompiliert und geladen!';
      settings.sharedBasicCode = '';
    }
  });

  onMount(() => {
    initEditor();
    if (settings.sharedBasicCode && editorView) {
      editorView.dispatch({
        changes: { from: 0, to: editorView.state.doc.length, insert: settings.sharedBasicCode }
      });
      currentFileName = 'decompiled.bas';
      settings.sharedBasicCode = '';
    } else {
      compileBasic(true);
    }
  });
</script>

<FlashModal bind:isOpen={showFlashModal} codeToFlash={flashCode} />

<ImportArrayModal 
  bind:isOpen={showImportModal} 
  targetMode="basic" 
  onImport={handleImportResult} 
/>

<input 
  type="file" 
  bind:this={fileInput} 
  accept=".bas,.txt,.clack,.c,.cpp,.h,.ino,.vhd,.asm" 
  onchange={handleFileSelect} 
  style="display: none;" 
/>

<div class="tab-pane active" id="tab-basic">
  <div class="editor-toolbar">
    <div class="file-operations-group">
      <button class="btn-subtle" onclick={newFile} title="Neues leeres BASIC-Programm erstellen">
        📄 Neu
      </button>
      <button class="btn-subtle" onclick={openFilePicker} title="BASIC-Datei von Computer öffnen (.bas, .txt)">
        📂 Öffnen...
      </button>
      <button class="btn-subtle" onclick={() => showImportModal = true} title="C-Arrays, daten[...] Zuweisungen oder Arduino .ino importieren & in BASIC dekompilieren">
        📥 Array dekompilieren
      </button>
      <button class="btn-subtle" onclick={saveFile} title="Aktuelles Programm auf Festplatte speichern">
        💾 Speichern
      </button>
      <button class="btn-subtle" onclick={saveFileAs} title="Unter neuem Dateinamen speichern...">
        💾 Als...
      </button>
      <button 
        class="file-badge" 
        onclick={renameFile} 
        title="Klicken zum Umbenennen der Datei"
      >
        <span class="file-icon">📜</span>
        <span class="file-name">{currentFileName}</span>
        <span class="file-edit-icon" title="Umbenennen">✏️</span>
      </button>
    </div>

    <div class="preset-selector">
      <label for="basic-preset-select">Vorlagen:</label>
      <select 
        id="basic-preset-select"
        value={selectedPreset} 
        onchange={(e) => loadPreset(e.target.value)}
      >
        <option value="" disabled selected={!selectedPreset}>-- Vorlage wählen --</option>
        <option value="ping_pong">🏓 Autonomes Ping-Pong</option>
        <option value="graphics_demo">🎨 4-Display Matrix Grafik</option>
        <option value="math_test">🔢 Mathematik & Logik Test</option>
        <option value="data_test">📋 DATA / READ / RESTORE</option>
        <option value="matrix_bounce_basic">✨ Bouncing Pixel Animation</option>
      </select>
    </div>

    <div class="editor-actions">
      <button class="btn btn-warning" onclick={openFlashModal} title="Kompiliert und öffnet den Arduino Mega USB-Flasher">
        🚀 Auf Arduino flashen
      </button>
      <button class="btn btn-primary" onclick={() => compileBasic(true)} title="Kompiliert BASIC und lädt den Maschinencode sofort in den Simulator">
        ⚡ In Simulator laden & Reset
      </button>
      <button class="btn btn-secondary" onclick={convertToAssembly} title="Kompiliert dieses BASIC-Programm in Assembler und öffnet es im Assembler Studio!">
        🔄 Zu Assembler
      </button>
      <button class="btn btn-secondary" onclick={() => compileBasic(false)} title="Nur kompilieren und Assembler-Listing anzeigen">
        🔍 Nur Kompilieren
      </button>
      <button class="btn-subtle" onclick={() => exportCode('arduino')} title="Maschinencode im Arduino-Loader-Format herunterladen">
        📥 Arduino-Code
      </button>
      <button class="btn-subtle" onclick={() => exportCode('c-array')} title="Maschinencode als C-Array herunterladen">
        📥 C-Array
      </button>
    </div>
  </div>

  <div class="basic-workspace-layout">
    <div class="editor-container basic-editor-box" bind:this={editorContainer}></div>
    
    {#if showListing}
      <div class="basic-listing-box">
        <div class="listing-header">
          <span>Assembler-Listing & Disassembly</span>
          <button class="btn-subtle" style="padding: 2px 6px;" onclick={() => showListing = false}>✕</button>
        </div>
        <pre class="listing-content">{listingContent}</pre>
      </div>
    {/if}
  </div>

  <div class="editor-status" class:success={statusType === 'success'} class:error={statusType === 'error'}>
    {statusMessage}
  </div>
</div>
