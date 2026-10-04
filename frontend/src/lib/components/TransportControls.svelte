<script>
  import { cpu } from '../stores/cpuStore.svelte.js';
  import { settings } from '../stores/settingsStore.svelte.js';

  // Relais-Schaltzeiten & Takt-Presets:
  // Basis: 1 Relais-Befehlszyklus = 50 ms (10ms Anzug + 5ms Prellen + 15ms ALU + 20ms Latch) -> 20 Hz Original
  const SPEED_PRESETS = [
    { hz: 1, label: '1 Hz (1000ms / 0.05× Zeitlupe)', shortLabel: '1 Hz (0.05×)' },
    { hz: 5, label: '5 Hz (200ms / 0.25× Zeitlupe)', shortLabel: '5 Hz (0.25×)' },
    { hz: 20, label: '20 Hz (50ms / 1.0× Original-Hardware)', shortLabel: '⚡ 20 Hz (Original)' },
    { hz: 100, label: '100 Hz (10ms / 5.0× Turbo)', shortLabel: '100 Hz (5.0×)' },
    { hz: 500, label: 'MAX (Echtzeit / ~500+ Hz)', shortLabel: '🚀 MAX (Echtzeit)' }
  ];

  let currentStep = $derived.by(() => {
    if (settings.speedHz >= 500) return 4;
    if (settings.speedHz >= 100) return 3;
    if (settings.speedHz >= 20) return 2;
    if (settings.speedHz >= 5) return 1;
    return 0;
  });

  let hardwareTimeFormatted = $derived.by(() => {
    const totalSec = cpu.cycles * 0.05;
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

  <div class="speed-control" title="Original-Relaisrechner: 20 Hz = 50 ms pro Befehl">
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
    <span class="hardware-time-badge" title="Original Hardware-Laufzeit auf 20 Hz Relaisrechner (50 ms pro Hardware-Takt)">
      ⚙️ Relais-Laufzeit: {hardwareTimeFormatted} <small>({cpu.instructions} Befehle / {cpu.cycles} Takte)</small>
    </span>
  </div>
</div>
