<script>
  import { onMount } from 'svelte';
  import { EditorView, basicSetup } from 'codemirror';
  import { EditorState } from '@codemirror/state';
  import { basicLanguage, clackTheme } from '../codemirror/basicLanguage.js';
  import { cpu } from '../stores/cpuStore.svelte.js';
  import FlashModal from './FlashModal.svelte';

  const BASIC_PRESETS = {
    ping_pong: `REM ============================================================
REM 🏓 Clack-BASIC: Autonomes Ping-Pong (Self-Playing AI Pong)
REM Laeuft in Echtzeit auf der 32x32 LED-Matrix (Worte 960..1023)
REM ============================================================

CLS

LET BX = 16
LET BY = 16
LET VX = 1
LET VY = 1

LET LY = 14
LET RY = 14

GAME_LOOP:
    CLS
    
    REM 1. Linkes Paddle zeichnen (X=1, Hoehe 4)
    PSET 1, LY, 0xFFFF
    PSET 1, LY + 1, 0xFFFF
    PSET 1, LY + 2, 0xFFFF
    PSET 1, LY + 3, 0xFFFF
    
    REM 2. Rechtes Paddle zeichnen (X=30, Hoehe 4)
    PSET 30, RY, 0xFFFF
    PSET 30, RY + 1, 0xFFFF
    PSET 30, RY + 2, 0xFFFF
    PSET 30, RY + 3, 0xFFFF
    
    REM 3. Ball zeichnen
    PSET BX, BY, 0xFFFF
    
    REM 4. Ball bewegen
    LET BX = BX + VX
    LET BY = BY + VY
    
    REM 5. Bandenkollision oben / unten
    IF BY <= 1 THEN
        LET VY = 1
    END IF
    IF BY >= 30 THEN
        LET VY = -1
    END IF
    
    REM 6. Paddle-Kollision Links / Rechts
    IF BX <= 2 THEN
        LET VX = 1
    END IF
    IF BX >= 29 THEN
        LET VX = -1
    END IF
    
    REM 7. Autonome KI: Paddles folgen Ball-Hoehe
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

  let editorContainer = $state(null);
  let editorView = $state(null);

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
      statusType = '';
      statusMessage = `BASIC-Vorlage '${key}' geladen. Bereit zum Kompilieren.`;
    }
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

  onMount(() => {
    initEditor();
  });
</script>

<FlashModal bind:isOpen={showFlashModal} codeToFlash={flashCode} />

<div class="tab-pane active" id="tab-basic">
  <div class="editor-toolbar">
    <div class="preset-selector">
      <label for="basic-preset-select">BASIC Vorlage:</label>
      <select 
        id="basic-preset-select"
        value={selectedPreset} 
        onchange={(e) => loadPreset(e.target.value)}
      >
        <option value="ping_pong">🏓 Autonomes Ping-Pong (ping_pong.bas)</option>
        <option value="graphics_demo">🎨 4-Display Matrix Grafik (graphics_demo.bas)</option>
        <option value="math_test">🔢 Mathematik & Logik Test (math_test.bas)</option>
        <option value="data_test">📋 DATA / READ / RESTORE (data_test.bas)</option>
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
