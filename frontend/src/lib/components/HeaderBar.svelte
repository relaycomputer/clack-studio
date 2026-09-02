<script>
  import { cpu } from '../stores/cpuStore.svelte.js';
  import { settings } from '../stores/settingsStore.svelte.js';

  let signedAccu = $derived(cpu.accu > 32767 ? cpu.accu - 65536 : cpu.accu);
  let relayTimeSec = $derived((cpu.cycles * 0.05).toFixed(2));
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
    <div class="metric-card card-pc">
      <span class="label">PC</span>
      <span class="value">{hexPC}</span>
    </div>
    <div class="metric-card card-accu highlight">
      <span class="label">ACCU</span>
      <span class="value">{hexAccu} <small>({signedAccu})</small></span>
    </div>
    <div class="metric-card card-stack">
      <span class="label">STACK</span>
      <span class="value">{hexStack}</span>
    </div>
    <div class="metric-card card-cycles">
      <span class="label">CYCLES</span>
      <span class="value">{cpu.cycles}</span>
    </div>
    <div class="metric-card card-time">
      <span class="label">RELAY TIME</span>
      <span class="value">{relayTimeSec} s</span>
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
