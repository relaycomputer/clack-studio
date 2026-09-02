<script>
  import { cpu } from '../stores/cpuStore.svelte.js';
  import { settings } from '../stores/settingsStore.svelte.js';

  let speedText = $derived(
    settings.speedHz >= 500 ? 'MAX SPEED (Echtzeit)' :
    settings.speedHz <= 5 ? `${settings.speedHz} Hz (~${Math.round(1000/settings.speedHz)}ms Relais-Takt)` :
    `${settings.speedHz} Hz (~${Math.round(1000/settings.speedHz)}ms)`
  );

  function handleSpeedInput(e) {
    const val = parseInt(e.target.value, 10);
    if (val === 100) {
      settings.setSpeed(500);
    } else {
      settings.setSpeed(val);
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
    <label for="slider-speed">Taktfrequenz:</label>
    <input 
      type="range" 
      id="slider-speed" 
      min="1" 
      max="100" 
      value={settings.speedHz >= 500 ? 100 : settings.speedHz}
      oninput={handleSpeedInput}
    />
    <span class="speed-val">{speedText}</span>
  </div>
</div>
