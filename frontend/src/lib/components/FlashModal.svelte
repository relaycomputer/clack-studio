<script>
  import { onMount } from 'svelte';

  let { isOpen = $bindable(false), codeToFlash = '' } = $props();

  let ports = $state([]);
  let selectedPort = $state('');
  let baudRate = $state(115200);
  let isLoadingPorts = $state(false);
  let isFlashing = $state(false);
  let flashLogs = $state([]);
  let progressPct = $state(0);
  let flashSuccess = $state(null);
  let hasWebSerial = $state(typeof navigator !== 'undefined' && 'serial' in navigator);

  async function fetchPorts() {
    isLoadingPorts = true;
    try {
      const resp = await fetch('/api/ports');
      const data = await resp.json();
      if (data.success && data.ports) {
        ports = data.ports;
        // Auto-select first Arduino or first port
        const arduino = ports.find(p => p.isArduino);
        if (arduino) {
          selectedPort = arduino.name;
        } else if (ports.length > 0 && !selectedPort) {
          selectedPort = ports[0].name;
        }
      }
    } catch (e) {
      addLog(`❌ Fehler beim Suchen der seriellen Ports: ${e.message}`);
    } finally {
      isLoadingPorts = false;
    }
  }

  function addLog(msg) {
    flashLogs = [...flashLogs, `[${new Date().toLocaleTimeString()}] ${msg}`];
  }

  async function startServerFlash() {
    if (!selectedPort) {
      alert('Bitte wähle zuerst einen seriellen Port aus.');
      return;
    }
    if (!codeToFlash.trim()) {
      alert('Kein Maschinencode zum Flashen vorhanden.');
      return;
    }

    isFlashing = true;
    flashLogs = [];
    flashSuccess = null;
    progressPct = 10;
    addLog(`Starte Upload auf ${selectedPort} (${baudRate} Baud)...`);

    try {
      progressPct = 30;
      const resp = await fetch('/api/flash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          port: selectedPort,
          baud: baudRate,
          source: codeToFlash
        })
      });

      progressPct = 80;
      const data = await resp.json();

      if (data.logs) {
        data.logs.forEach(l => addLog(l));
      }

      if (data.success) {
        progressPct = 100;
        flashSuccess = true;
        addLog(`🎉 ${data.message}`);
      } else {
        flashSuccess = false;
        addLog(`❌ Fehler beim Flashen: ${data.message}`);
      }
    } catch (e) {
      flashSuccess = false;
      addLog(`❌ Netzwerkfehler: ${e.message}`);
    } finally {
      isFlashing = false;
    }
  }

  // Web Serial API (Direct Browser-to-USB)
  async function startWebSerialFlash() {
    if (!hasWebSerial) {
      alert('Web Serial wird von deinem Browser nicht unterstützt. Bitte nutze Google Chrome, Brave oder Edge.');
      return;
    }

    isFlashing = true;
    flashLogs = [];
    flashSuccess = null;
    progressPct = 10;
    addLog('Fordere Web-Serial Port an...');

    try {
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: baudRate });
      addLog('Port erfolgreich geöffnet. Starte Übertragung...');

      progressPct = 30;
      const writer = port.writable.getWriter();
      const encoder = new TextEncoder();

      // Split lines and send
      const lines = codeToFlash.split('\n');
      let sent = 0;
      for (let line of lines) {
        let trimmed = line.trim();
        if (trimmed) {
          await writer.write(encoder.encode(trimmed + '\n'));
          sent++;
          progressPct = Math.min(95, 30 + Math.round((sent / lines.length) * 65));
          await new Promise(r => setTimeout(r, 4));
        }
      }

      writer.releaseLock();
      await port.close();

      progressPct = 100;
      flashSuccess = true;
      addLog(`🎉 ${sent} Zeilen erfolgreich via Web-Serial geflasht!`);
    } catch (e) {
      flashSuccess = false;
      addLog(`❌ Web-Serial Fehler: ${e.message}`);
    } finally {
      isFlashing = false;
    }
  }

  onMount(() => {
    fetchPorts();
  });

  $effect(() => {
    if (isOpen) {
      fetchPorts();
    }
  });
</script>

{#if isOpen}
  <div class="modal-backdrop" onclick={() => !isFlashing && (isOpen = false)} role="presentation">
    <div class="modal-content" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()} role="dialog" aria-modal="true" tabindex="-1">
      <div class="modal-header">
        <div class="modal-title">
          <span class="icon">🚀</span>
          <h3>Arduino Mega Relais-Loader & Flasher</h3>
        </div>
        <button class="btn-subtle" onclick={() => isOpen = false} disabled={isFlashing}>✕</button>
      </div>

      <div class="modal-body">
        <div class="flash-settings">
          <div class="form-group">
            <label for="port-select">Serieller Port (USB):</label>
            <div class="port-select-row">
              <select id="port-select" bind:value={selectedPort} disabled={isFlashing}>
                {#if ports.length === 0}
                  <option value="">Keine seriellen Ports gefunden</option>
                {:else}
                  {#each ports as p}
                    <option value={p.name}>
                      {p.name} {p.isArduino ? '⭐ (Arduino Mega)' : `(${p.description})`}
                    </option>
                  {/each}
                {/if}
              </select>
              <button class="btn-subtle" onclick={fetchPorts} disabled={isLoadingPorts || isFlashing} title="Ports neu suchen">
                🔄 {isLoadingPorts ? '...' : 'Suchen'}
              </button>
            </div>
          </div>

          <div class="form-group">
            <label for="baud-select">Baudrate:</label>
            <select id="baud-select" bind:value={baudRate} disabled={isFlashing}>
              <option value={115200}>115200 Baud (Standard)</option>
              <option value={57600}>57600 Baud</option>
              <option value={9600}>9600 Baud</option>
            </select>
          </div>
        </div>

        {#if isFlashing || progressPct > 0}
          <div class="progress-container">
            <div class="progress-bar-bg">
              <div 
                class="progress-bar-fill" 
                class:success={flashSuccess === true}
                class:error={flashSuccess === false}
                style="width: {progressPct}%"
              ></div>
            </div>
            <span class="progress-text">{progressPct}%</span>
          </div>
        {/if}

        <div class="terminal-log-container">
          <div class="terminal-header">
            <span>Live Übertragungs-Protokoll:</span>
            <span>{flashLogs.length} Einträge</span>
          </div>
          <div class="terminal-content">
            {#if flashLogs.length === 0}
              <div class="terminal-empty">Bereit zum Flashen. Wähle den Port und klicke auf 'Flashen'.</div>
            {:else}
              {#each flashLogs as l}
                <div class="log-line" class:log-ok={l.includes('✅') || l.includes('🎉')} class:log-err={l.includes('❌')}>{l}</div>
              {/each}
            {/if}
          </div>
        </div>
      </div>

      <div class="modal-footer">
        {#if hasWebSerial}
          <button 
            class="btn btn-secondary" 
            onclick={startWebSerialFlash} 
            disabled={isFlashing}
            title="Direkt über Web Serial API im Browser übertragen"
          >
            🔌 Web-Serial (Browser-zu-USB)
          </button>
        {/if}

        <button 
          class="btn btn-primary" 
          onclick={startServerFlash} 
          disabled={isFlashing || !selectedPort}
        >
          {isFlashing ? '⏳ Flasht...' : '🚀 Auf Arduino Mega flashen'}
        </button>
        <button class="btn btn-subtle" onclick={() => isOpen = false} disabled={isFlashing}>
          Schließen
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(4, 7, 12, 0.85);
    backdrop-filter: blur(6px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
  }

  .modal-content {
    background: #0d141e;
    border: 1px solid #23344d;
    border-radius: 12px;
    width: 620px;
    max-width: 95vw;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(255, 176, 0, 0.15);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 18px;
    background: #111a27;
    border-bottom: 1px solid #23344d;
  }

  .modal-title {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .modal-title h3 {
    margin: 0;
    font-size: 15px;
    font-family: var(--font-display);
    color: var(--text-bright);
    letter-spacing: 0.5px;
  }

  .modal-body {
    padding: 18px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .flash-settings {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 14px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .form-group label {
    font-size: 11px;
    font-family: var(--font-display);
    color: var(--text-muted);
    font-weight: 600;
  }

  .port-select-row {
    display: flex;
    gap: 8px;
  }

  select {
    width: 100%;
    background: #080c12;
    color: var(--text-bright);
    border: 1px solid #23344d;
    padding: 8px 10px;
    border-radius: 6px;
    font-family: var(--font-mono);
    font-size: 12px;
  }

  .progress-container {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .progress-bar-bg {
    flex: 1;
    height: 8px;
    background: #080c12;
    border-radius: 4px;
    border: 1px solid #23344d;
    overflow: hidden;
  }

  .progress-bar-fill {
    height: 100%;
    background: var(--accent-color);
    transition: width 0.2s ease;
  }

  .progress-bar-fill.success {
    background: #33ff85;
  }

  .progress-bar-fill.error {
    background: #ff5c77;
  }

  .progress-text {
    font-size: 11px;
    font-family: var(--font-mono);
    color: var(--text-muted);
    width: 35px;
    text-align: right;
  }

  .terminal-log-container {
    background: #06090e;
    border: 1px solid #23344d;
    border-radius: 6px;
    overflow: hidden;
  }

  .terminal-header {
    display: flex;
    justify-content: space-between;
    background: #0a0f16;
    padding: 6px 10px;
    font-size: 10px;
    color: var(--text-muted);
    font-family: var(--font-display);
    border-bottom: 1px solid #1a273a;
  }

  .terminal-content {
    height: 140px;
    overflow-y: auto;
    padding: 10px;
    font-family: var(--font-mono);
    font-size: 11px;
    line-height: 1.4;
  }

  .terminal-empty {
    color: #486581;
    font-style: italic;
  }

  .log-line {
    color: #9fb3c8;
  }

  .log-line.log-ok {
    color: #55ff99;
    font-weight: 600;
  }

  .log-line.log-err {
    color: #ff5577;
    font-weight: 600;
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding: 14px 18px;
    background: #111a27;
    border-top: 1px solid #23344d;
  }
</style>
