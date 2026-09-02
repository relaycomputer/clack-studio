<script>
  import { cpu } from '../stores/cpuStore.svelte.js';
  import { settings } from '../stores/settingsStore.svelte.js';

  let signedAccu = $derived(cpu.accu > 32767 ? cpu.accu - 65536 : cpu.accu);
  
  // Format physical relay hardware time (~50 ms pro Zyklus / 20 Hz)
  let relayTimeSec = $derived.by(() => {
    const totalSec = cpu.cycles * 0.05; // 50ms pro Takt
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
    <div class="metric-card card-stack" title="Stack-Rücksprungadresse (CALL / RET)">
      <span class="label">STACK</span>
      <span class="value">{hexStack}</span>
    </div>
    <div class="metric-card card-cycles" title="Ausgeführte Maschinentakte">
      <span class="label">CYCLES</span>
      <span class="value">{cpu.cycles}</span>
    </div>
    <div class="metric-card card-time" title="Berechnete Originaldauer auf echter 20 Hz Relais-Hardware (50 ms / Takt)">
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
  </div>
</header>
