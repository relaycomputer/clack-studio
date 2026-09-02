<script>
  import { onMount } from 'svelte';
  import { cpu, FRAMEBUFFER_32_START, FRAMEBUFFER_64_START } from '../stores/cpuStore.svelte.js';
  import { settings } from '../stores/settingsStore.svelte.js';

  let canvas = $state(null);
  let animId = null;

  function render() {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const res = settings.matrixResolution;
    const dotSize = w / res;
    const radius = Math.max(1, (dotSize / 2) * 0.78);

    ctx.fillStyle = '#060a0f';
    ctx.fillRect(0, 0, w, h);

    // Theme color configuration
    let onColor = '#ffc433';
    let glowColor = 'rgba(255, 176, 0, 0.6)';
    let offColor = '#161100';

    if (settings.theme === 'theme-green') {
      onColor = '#33ff85';
      glowColor = 'rgba(0, 255, 102, 0.6)';
      offColor = '#001a0a';
    } else if (settings.theme === 'theme-cyan') {
      onColor = '#33dcff';
      glowColor = 'rgba(0, 212, 255, 0.6)';
      offColor = '#00141a';
    } else if (settings.theme === 'theme-ruby') {
      onColor = '#ff5c77';
      glowColor = 'rgba(255, 51, 85, 0.6)';
      offColor = '#1a0408';
    }

    if (res === 64) {
      // 64x64: 4 words per row (64 bits), 64 rows = 256 words ab 768
      for (let y = 0; y < 64; y++) {
        for (let wordOffset = 0; wordOffset < 4; wordOffset++) {
          const currentWordAddr = FRAMEBUFFER_64_START + (y * 4) + wordOffset;
          const word = (currentWordAddr < cpu.memory.length) ? cpu.memory[currentWordAddr] : 0;

          for (let bit = 15; bit >= 0; bit--) {
            const x = (wordOffset * 16) + (15 - bit);
            const isSet = (word >> bit) & 1;

            const cx = x * dotSize + dotSize / 2;
            const cy = y * dotSize + dotSize / 2;

            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);

            if (isSet) {
              ctx.fillStyle = onColor;
              ctx.shadowColor = glowColor;
              ctx.shadowBlur = 4;
              ctx.fill();
            } else {
              ctx.fillStyle = offColor;
              ctx.shadowBlur = 0;
              ctx.fill();
            }
          }
        }
      }
    } else {
      // 32x32: 2 words per row (32 bits), 32 rows = 64 words ab 960 (4x Matrix)
      for (let y = 0; y < 32; y++) {
        for (let wordOffset = 0; wordOffset < 2; wordOffset++) {
          const currentWordAddr = FRAMEBUFFER_32_START + (y * 2) + wordOffset;
          const word = (currentWordAddr < cpu.memory.length) ? cpu.memory[currentWordAddr] : 0;

          for (let bit = 15; bit >= 0; bit--) {
            const x = (wordOffset * 16) + (15 - bit);
            const isSet = (word >> bit) & 1;

            const cx = x * dotSize + dotSize / 2;
            const cy = y * dotSize + dotSize / 2;

            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);

            if (isSet) {
              ctx.fillStyle = onColor;
              ctx.shadowColor = glowColor;
              ctx.shadowBlur = 6;
              ctx.fill();
            } else {
              ctx.fillStyle = offColor;
              ctx.shadowBlur = 0;
              ctx.fill();
            }
          }
        }
      }
    }
  }

  onMount(() => {
    // Continuous 60 FPS render loop for rock-solid visual updates
    function loop() {
      render();
      animId = requestAnimationFrame(loop);
    }
    loop();

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  });
</script>

<div class="panel matrix-panel">
  <div class="panel-header">
    <div class="panel-title">
      <span class="dot live-dot"></span>
      <span>LED-MATRIX DISPLAY</span>
    </div>
    <div class="matrix-controls">
      <select 
        value={settings.matrixResolution} 
        onchange={(e) => settings.setMatrixResolution(parseInt(e.target.value, 10))}
      >
        <option value={32}>32 × 32 (4x Hardware Matrix ab 0x03C0 / 960)</option>
        <option value={64}>64 × 64 (Full Framebuffer ab 0x0300 / 768)</option>
      </select>
      <span class="mem-base-tag">
        {settings.matrixResolution === 32 ? 'RAM: 0x03C0 (960..1023)' : 'RAM: 0x0300 (768..1023)'}
      </span>
    </div>
  </div>
  <div class="matrix-canvas-container">
    <canvas bind:this={canvas} width="384" height="384"></canvas>
    <div class="matrix-grid-overlay"></div>
  </div>
  <div class="matrix-footer">
    <span>
      {settings.matrixResolution === 32 
        ? 'Modus: 4x 8x32/16x16 Matrix (64 Worte Framebuffer)' 
        : 'Modus: 1-Bit Bitmap (16 Pixels / Wort) | 256 Worte Framebuffer'}
    </span>
    <button class="btn-subtle" onclick={() => cpu.clearScreen(settings.matrixResolution === 32 ? 960 : 768, settings.matrixResolution === 32 ? 64 : 256)}>
      Screen leeren
    </button>
  </div>
</div>
