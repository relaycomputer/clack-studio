<script>
  import { cpu } from '../stores/cpuStore.svelte.js';
  import { settings } from '../stores/settingsStore.svelte.js';

  function hex(v, l = 3) {
    return (v || 0).toString(16).toUpperCase().padStart(l, '0');
  }

  // Relais-Schaltzeiten & Takt-Presets:
  // Basis: 1 Relais-Hardware-Takt = 70 ms (14.3 Hz Original-Hardware laut Peter)
  const SPEED_PRESETS = [
    { hz: 1, label: '1 Hz (1000ms / 0.07× Zeitlupe)', shortLabel: '1 Hz (0.07×)' },
    { hz: 5, label: '5 Hz (200ms / 0.35× Zeitlupe)', shortLabel: '5 Hz (0.35×)' },
    { hz: 14.3, label: '14.3 Hz (70ms / 1.0× Original-Hardware)', shortLabel: '⚡ 14.3 Hz (Original)' },
    { hz: 100, label: '100 Hz (10ms / 7.0× Turbo)', shortLabel: '100 Hz (7.0×)' },
    { hz: 500, label: 'MAX (Echtzeit / ~500+ Hz)', shortLabel: '🚀 MAX (Echtzeit)' }
  ];

  let currentStep = $derived.by(() => {
    if (settings.speedHz >= 500) return 4;
    if (settings.speedHz >= 100) return 3;
    if (settings.speedHz >= 14) return 2;
    if (settings.speedHz >= 5) return 1;
    return 0;
  });

  let hardwareTimeFormatted = $derived.by(() => {
    // 70 ms (0.07 s) pro T-State / Hardware-Takt
    const totalSec = cpu.cycles * 0.07;
    if (totalSec < 60) return `${totalSec.toFixed(2)}s`;
    const mins = Math.floor(totalSec / 60);
    const secs = (totalSec % 60).toFixed(1);
    if (mins < 60) return `${mins}m ${secs}s`;
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hours}h ${remMins}m`;
  });

  function handleSliderChange(e) {
    const idx = parseInt(e.target.value, 10);
    if (idx >= 0 && idx < SPEED_PRESETS.length) {
      settings.setSpeed(SPEED_PRESETS[idx].hz);
    }
  }
</script>

<div class="transport-bar">
  <div class="transport-buttons">
    <button 
      class="btn btn-success" 
      disabled={cpu.isRunning} 
      onclick={() => cpu.run()}
    >
      <span class="btn-icon">▶</span> RUN
    </button>
    <button 
      class="btn btn-warning" 
      disabled={!cpu.isRunning} 
      onclick={() => cpu.pause()}
    >
      <span class="btn-icon">⏸</span> PAUSE
    </button>
    <button 
      class="btn btn-primary" 
      onclick={() => cpu.stepSingle()}
    >
      <span class="btn-icon">⏭</span> STEP (1)
    </button>
    <button 
      class="btn btn-secondary" 
      onclick={() => cpu.stepMulti(10)}
    >
      <span class="btn-icon">⏩</span> STEP (10)
    </button>
    <button 
      class="btn btn-danger" 
      onclick={() => cpu.reset()}
    >
      <span class="btn-icon">🔄</span> RESET
    </button>
  </div>

  <div class="speed-control" title="Original-Relaisrechner: 14.3 Hz = 70 ms pro Takt">
    <label for="slider-speed">Takt:</label>
    <input 
      type="range" 
      id="slider-speed" 
      min="0" 
      max="4" 
      step="1"
      value={currentStep}
      oninput={handleSliderChange}
    />
    <span class="speed-val">{SPEED_PRESETS[currentStep].label}</span>
    <span class="hardware-time-badge" title="Original Hardware-Laufzeit auf 14.3 Hz Relaisrechner (70 ms pro Hardware-Takt)">
      ⚙️ Relais-Laufzeit: {hardwareTimeFormatted} <small>({cpu.instructions} Befehle / {cpu.cycles} Takte)</small>
    </span>

    {#if cpu.hitBreakpoint !== null}
      <span class="badge-bp hit" title="Halt durch Breakpoint bei PC 0x{hex(cpu.hitBreakpoint, 3)}">
        🛑 BP @ 0x{hex(cpu.hitBreakpoint, 3)}
      </span>
    {:else if cpu.breakpoints.size > 0}
      <span class="badge-bp" title="{cpu.breakpoints.size} aktive(r) Breakpoint(s)">
        🔴 {cpu.breakpoints.size} BP
      </span>
    {/if}

    {#if cpu.halted}
      <span class="badge-halt" title={cpu.haltReason}>
        🛑 {cpu.haltReason}
      </span>
    {:else if cpu.instructions === 0 && cpu.memory[cpu.pc] === 0}
      <span class="badge-empty-ram" title="Speicher ist noch leer. Wähle ein Preset oder lade ein Programm.">
        💡 Kein Programm im RAM
      </span>
    {/if}
  </div>
</div>
