<script>
  import { onMount, onDestroy } from 'svelte';
  import { cpu } from '../stores/cpuStore.svelte.js';
  import { settings } from '../stores/settingsStore.svelte.js';

  let signedAccu = $derived(cpu.accu > 32767 ? cpu.accu - 65536 : cpu.accu);
  
  // Format physical relay hardware time (70 ms pro Zyklus / 14.3 Hz)
  let relayTimeSec = $derived.by(() => {
    const totalSec = cpu.cycles * 0.07; // 70ms pro Takt
    if (totalSec < 60) {
      return `${totalSec.toFixed(2)} s`;
    }
    const mins = Math.floor(totalSec / 60);
    const secs = (totalSec % 60).toFixed(1);
    if (mins < 60) {
      return `${mins}m ${secs}s`;
    }
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hours}h ${remMins}m`;
  });

  let hexPC = $derived('0x' + cpu.pc.toString(16).toUpperCase().padStart(4, '0'));
  let hexAccu = $derived('0x' + cpu.accu.toString(16).toUpperCase().padStart(4, '0'));
  let hexStack = $derived('0x' + cpu.stack.toString(16).toUpperCase().padStart(4, '0'));

  let isStandalone = $state(false);
  let isShutDown = $state(false);
  let keepaliveTimer = null;

  onMount(async () => {
    try {
      const res = await fetch('/api/info');
      if (res.ok) {
        const info = await res.json();
        if (info.standalone) {
          isStandalone = true;
          // Initialer Keepalive
          fetch('/api/keepalive', { method: 'POST' }).catch(() => {});
          // Zyklischer Heartbeat alle 3 Sekunden
          keepaliveTimer = setInterval(() => {
            fetch('/api/keepalive', { method: 'POST' }).catch(() => {});
          }, 3000);

          window.addEventListener('beforeunload', () => {
            navigator.sendBeacon('/api/leave');
          });
        }
      }
    } catch (e) {
      isStandalone = false;
    }
  });

  onDestroy(() => {
    if (keepaliveTimer) clearInterval(keepaliveTimer);
  });

  async function handleShutdownClick() {
    if (confirm("Möchtest du Clack-Studio wirklich beenden und den Hintergrundprozess schließen?")) {
      try {
        await fetch('/api/shutdown', { method: 'POST' });
      } catch (e) {}
      isShutDown = true;
      if (keepaliveTimer) clearInterval(keepaliveTimer);
    }
  }
</script>

<header class="header-bar">
  <div class="brand">
    <div class="brand-logo">⚡</div>
    <div class="brand-text">
      <h1>CLACK-STUDIO</h1>
      <span class="subtitle">16-Bit Relay Computer Visual Hardware Lab & Emulator</span>
    </div>
  </div>
  
  <div class="header-metrics">
    <div class="metric-card card-pc" title="Program Counter (Befehlszeiger)">
      <span class="label">PC</span>
      <span class="value">{hexPC}</span>
    </div>
    <div class="metric-card card-accu highlight" title="Akku-Hauptregister (Hexadezimal und Vorzeichenbehaftet)">
      <span class="label">ACCU</span>
      <span class="value">{hexAccu} <small>({signedAccu})</small></span>
    </div>
    <div class="metric-card card-stack" title="SR (10-Bit Subroutine Return Address / Rücksprungadresse)">
      <span class="label">SR</span>
      <span class="value">{hexStack}</span>
    </div>
    <div class="metric-card card-instr" title="Ausgeführte Befehle">
      <span class="label">BEFEHLE</span>
      <span class="value">{cpu.instructions}</span>
    </div>
    <div class="metric-card card-cycles" title="Ausgeführte Hardware-Maschinentakte (zyklengenau)">
      <span class="label">CYCLES</span>
      <span class="value">{cpu.cycles}</span>
    </div>
    <div class="metric-card card-time" title="Berechnete Originaldauer auf echter 14.3 Hz Relais-Hardware (70 ms pro Hardware-Takt)">
      <span class="label">RELAIS-ZEIT</span>
      <span class="value">{relayTimeSec}</span>
    </div>
  </div>

  <div class="header-tools">
    <div class="audio-toggle-wrapper">
      <button 
        class="btn-icon" 
        title="Relais-Klick Audio ein/ausschalten"
        onclick={() => settings.toggleSound()}
      >
        <span class="icon">{settings.soundEnabled ? '🔊' : '🔇'}</span> 
        <span class="txt">{settings.soundEnabled ? 'Klick: AN' : 'Klick: AUS'}</span>
      </button>
    </div>
    <div class="theme-selector">
      <label for="theme-select">Farbe:</label>
      <select 
        id="theme-select"
        value={settings.theme} 
        onchange={(e) => settings.setTheme(e.target.value)}
      >
        <option value="theme-amber">Amber (Bernstein)</option>
        <option value="theme-green">Phosphor Grün</option>
        <option value="theme-cyan">Cyber Cyan</option>
        <option value="theme-ruby">Rubin Rot</option>
      </select>
    </div>

    {#if isStandalone}
      <button 
        class="btn-shutdown" 
        title="Clack-Studio Server sauber beenden und Prozess stoppen"
        onclick={handleShutdownClick}
      >
        <span class="icon">🛑</span>
        <span class="txt">Beenden</span>
      </button>
    {/if}
  </div>
</header>

{#if isShutDown}
  <div class="shutdown-overlay">
    <div class="shutdown-dialog">
      <div class="shutdown-icon">⚡</div>
      <h2>Clack-Studio wurde beendet</h2>
      <p>Der Hintergrundprozess wurde sauber geschlossen.</p>
      <p class="hint">Du kannst dieses Browser-Fenster jetzt schließen.</p>
    </div>
  </div>
{/if}
