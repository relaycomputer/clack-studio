<script>
  import { cpu } from '../stores/cpuStore.svelte.js';
  import { settings } from '../stores/settingsStore.svelte.js';

  // Tactile speed presets:
  const SPEED_PRESETS = [
    { hz: 1, label: '1 Hz (1s Relais)' },
    { hz: 5, label: '5 Hz (200ms)' },
    { hz: 20, label: '20 Hz (50ms)' },
    { hz: 100, label: '100 Hz (10ms)' },
    { hz: 500, label: 'MAX (Echtzeit)' }
  ];

  let currentStep = $derived.by(() => {
    if (settings.speedHz >= 500) return 4;
    if (settings.speedHz >= 100) return 3;
    if (settings.speedHz >= 20) return 2;
    if (settings.speedHz >= 5) return 1;
    return 0;
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

  <div class="speed-control">
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
  </div>
</div>
