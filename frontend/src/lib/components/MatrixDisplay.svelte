<script>
  import { onMount } from 'svelte';
  import { cpu, FRAMEBUFFER_32_START, FRAMEBUFFER_64_START } from '../stores/cpuStore.svelte.js';
  import { settings } from '../stores/settingsStore.svelte.js';

  let canvas = $state(null);
  let activePixels = $state(0);
  let animId = null;

  // 16-Color Hardware Palette (PICO-8 / Retro Hardware RGB)
  const PALETTE_RGB16 = [
    '#000000', // 0: Black
    '#1d2b53', // 1: Dark Blue
    '#7e2553', // 2: Dark Purple
    '#008751', // 3: Dark Green
    '#ab5236', // 4: Brown
    '#5f574f', // 5: Dark Gray
    '#c2c3c7', // 6: Light Gray
    '#fff1e8', // 7: White
    '#ff004d', // 8: Red
    '#ffa300', // 9: Orange
    '#ffec27', // 10: Yellow
    '#00e436', // 11: Light Green
    '#29adff', // 12: Cyan
    '#83769c', // 13: Indigo
    '#ff77a8', // 14: Pink
    '#ffccaa'  // 15: Peach
  ];

  // Mandelbrot Fire/Heatmap Palette (16 Stufen)
  const PALETTE_MANDELBROT = [
    '#0a0826', // 0: Deep Night
    '#161348', // 1: Navy
    '#2c1a6d', // 2: Violet
    '#4b1d82', // 3: Purple
    '#731f8f', // 4: Magenta
    '#9e1f89', // 5: Deep Pink
    '#c72473', // 6: Coral Red
    '#ea3c53', // 7: Crimson
    '#f96432', // 8: Orange-Red
    '#fd8f19', // 9: Bright Orange
    '#fdb911', // 10: Amber
    '#fde324', // 11: Gold
    '#fdf955', // 12: Light Yellow
    '#e4fc92', // 13: Lime Glow
    '#d2fdcf', // 14: Mint
    '#ffffff'  // 15: White Glow
  ];

  // Cyberpunk Neon Palette (16 Stufen)
  const PALETTE_CYBERPUNK = [
    '#050814', '#0d1b2a', '#1b263b', '#415a77',
    '#00f5d4', '#00bbf9', '#0077b6', '#7209b7',
    '#b5179e', '#f72585', '#ff0054', '#ff5400',
    '#ffbd00', '#70e000', '#38b000', '#ffffff'
  ];

  // Rainbow Spectrum Palette (16 Stufen)
  const PALETTE_RAINBOW = [
    '#050510', '#3a0ca3', '#4361ee', '#4cc9f0',
    '#06d6a0', '#2ec4b6', '#52b788', '#90e0ef',
    '#ffb703', '#fb8500', '#e63946', '#d90429',
    '#ef476f', '#f72585', '#b5179e', '#ffffff'
  ];

  function getPalette(name) {
    switch (name) {
      case 'mandelbrot': return PALETTE_MANDELBROT;
      case 'rgb16': return PALETTE_RGB16;
      case 'cyberpunk': return PALETTE_CYBERPUNK;
      case 'rainbow': return PALETTE_RAINBOW;
      default: return null;
    }
  }

  function getThemeColors() {
    if (settings.theme === 'theme-green') {
      return { on: '#33ff85', glow: 'rgba(0, 255, 102, 0.6)', off: '#001a0a' };
    } else if (settings.theme === 'theme-cyan') {
      return { on: '#33dcff', glow: 'rgba(0, 212, 255, 0.6)', off: '#00141a' };
    } else if (settings.theme === 'theme-ruby') {
      return { on: '#ff5c77', glow: 'rgba(255, 51, 85, 0.6)', off: '#1a0408' };
    }
    return { on: '#ffc433', glow: 'rgba(255, 176, 0, 0.6)', off: '#161100' };
  }

  function render() {
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    const w = canvas.width;
    const h = canvas.height;
    const res = settings.matrixResolution;
    const dotSize = w / res;
    const radius = Math.max(1, (dotSize / 2) * 0.82);

    ctx.fillStyle = '#05070a';
    ctx.fillRect(0, 0, w, h);

    let litCount = 0;
    const themeCols = getThemeColors();
    const palette = getPalette(settings.matrixColorMode);
    const is4Bit = settings.matrixMode === '4bit';

    if (is4Bit) {
      // 4-Bit Nibble Mode: 4 Pixels per 16-bit word (16 Colors)
      const wordsPerRow = res / 4;
      const baseAddr = 768;

      for (let y = 0; y < res; y++) {
        for (let wo = 0; wo < wordsPerRow; wo++) {
          const addr = baseAddr + (y * wordsPerRow) + wo;
          const word = (addr < cpu.memory.length) ? cpu.memory[addr] : 0;

          for (let p = 0; p < 4; p++) {
            const x = (wo * 4) + p;
            if (x >= res) break;

            const shift = (3 - p) * 4;
            const colorIdx = (word >> shift) & 0x0F;

            const cx = x * dotSize + dotSize / 2;
            const cy = y * dotSize + dotSize / 2;

            if (colorIdx > 0) {
              litCount++;
              const color = palette ? palette[colorIdx] : themeCols.on;
              ctx.fillStyle = color;
              ctx.beginPath();
              ctx.arc(cx, cy, radius, 0, Math.PI * 2);
              ctx.fill();
            } else {
              ctx.fillStyle = themeCols.off;
              ctx.beginPath();
              ctx.arc(cx, cy, radius, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      }
    } else {
      // 1-Bit Mode: 16 Pixels per word (Standard Framebuffer)
      const baseAddr = (res === 64) ? FRAMEBUFFER_64_START : FRAMEBUFFER_32_START;
      const wordsPerRow = (res === 64) ? 4 : 2;

      for (let y = 0; y < res; y++) {
        for (let wo = 0; wo < wordsPerRow; wo++) {
          const addr = baseAddr + (y * wordsPerRow) + wo;
          const word = (addr < cpu.memory.length) ? cpu.memory[addr] : 0;

          for (let bit = 15; bit >= 0; bit--) {
            // Hardware 32x32: Word 0 (wo=0, addr 960) ist rechte Hälfte (X=16..31), Word 1 (wo=1, addr 961) ist linke Hälfte (X=0..15)
            // Linear 32x32: Word 0 ist linke Hälfte, Word 1 ist rechte Hälfte
            let x;
            if (res === 32) {
              const isHw = settings.matrixLayout === 'hardware';
              const colWord = isHw ? (1 - wo) : wo;
              x = (colWord * 16) + (15 - bit);
            } else {
              x = (wo * 16) + (15 - bit);
            }
            if (x >= res) break;

            const isSet = (word >> bit) & 1;
            const cx = x * dotSize + dotSize / 2;
            const cy = y * dotSize + dotSize / 2;

            if (isSet) {
              litCount++;
              let color = themeCols.on;

              if (palette) {
                // Multi-Color Fractal / Heatmap Gradient based on distance & position
                const dist = Math.sqrt(Math.pow(x - res / 2, 2) + Math.pow(y - res / 2, 2));
                const maxDist = res * 0.7;
                const idx = Math.min(15, Math.max(1, Math.floor((dist / maxDist) * 15)));
                color = palette[idx];
              }

              ctx.fillStyle = color;
              ctx.beginPath();
              ctx.arc(cx, cy, radius, 0, Math.PI * 2);
              ctx.fill();
            } else {
              ctx.fillStyle = themeCols.off;
              ctx.beginPath();
              ctx.arc(cx, cy, radius, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      }
    }

    activePixels = litCount;
  }

  function drawTestPattern() {
    const is4Bit = settings.matrixMode === '4bit';
    if (is4Bit) {
      // 4-bit Color Ramp Test
      const baseAddr = 768;
      for (let y = 0; y < 32; y++) {
        for (let wo = 0; wo < 8; wo++) {
          const c0 = (y + wo * 4 + 0) % 16;
          const c1 = (y + wo * 4 + 1) % 16;
          const c2 = (y + wo * 4 + 2) % 16;
          const c3 = (y + wo * 4 + 3) % 16;
          cpu.memory[baseAddr + y * 8 + wo] = (c0 << 12) | (c1 << 8) | (c2 << 4) | c3;
        }
      }
    } else {
      const start = settings.matrixResolution === 32 ? 960 : 768;
      const count = settings.matrixResolution === 32 ? 64 : 256;
      for (let i = 0; i < count; i++) {
        cpu.memory[start + i] = (i % 2 === 0) ? 0xAAAA : 0x5555;
      }
    }
  }

  onMount(() => {
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
        title="Hardware-Matrix Auflösung wählen"
      >
        <option value={32}>32 × 32 (4x Hardware Matrix ab 0x03C0 / 960)</option>
        <option value={64}>64 × 64 (Full Framebuffer ab 0x0300 / 768)</option>
      </select>
      {#if settings.matrixResolution === 32}
        <select 
          value={settings.matrixLayout} 
          onchange={(e) => settings.setMatrixLayout(e.target.value)}
          title="Wort-Reihenfolge: Hardware-Relais (W0 rechts, W1 links) vs. Linear (W0 links, W1 rechts)"
        >
          <option value="hardware">⚡ Hardware (W0 rechts / W1 links)</option>
          <option value="linear">↔️ Linear (W0 links / W1 rechts)</option>
        </select>
      {/if}
      <select 
        value={settings.matrixColorMode} 
        onchange={(e) => settings.setMatrixColorMode(e.target.value)}
        title="Farbschema & Palette wählen"
      >
        <option value="mandelbrot">🔥 Mandelbrot Flame / Heatmap</option>
        <option value="rgb16">🎨 16-Farben Hardware RGB (PICO-8)</option>
        <option value="cyberpunk">🌆 Cyberpunk Neon (Pink/Cyan)</option>
        <option value="rainbow">🌈 Regenbogen Spektrum</option>
        <option value="theme">💡 Monochrom (Theme-Farbe)</option>
      </select>
      <select 
        value={settings.matrixMode} 
        onchange={(e) => settings.setMatrixMode(e.target.value)}
        title="Bit-Farbtiefe: 1-Bit Bitmap (16 Px/Wort) oder 4-Bit Nibble RGB (4 Px/Wort)"
      >
        <option value="1bit">1-Bit Bitmap (16 Px/Wort)</option>
        <option value="4bit">4-Bit RGB (16 Farben / 4 Px/Wort)</option>
      </select>
    </div>
  </div>
  <div class="matrix-canvas-container">
    <canvas bind:this={canvas} width="384" height="384"></canvas>
    <div class="matrix-grid-overlay"></div>
  </div>
  <div class="matrix-footer">
    <span class="pixel-status-badge">
      ⚡ {activePixels} LEDs aktiv
    </span>
    <span class="mem-base-tag">
      {settings.matrixMode === '4bit' ? 'RAM: 0x0300 (4-Bit RGB)' : (settings.matrixResolution === 32 ? 'RAM: 0x03C0 (960..1023)' : 'RAM: 0x0300 (768..1023)')}
    </span>
    <div class="matrix-actions">
      <button class="btn-subtle btn-accent-pulse" onclick={() => settings.setRelayDefaults()} title="Auf Standard des echten Relaissystems zurücksetzen: 32×32, Linear, Monochrom, 1-Bit">
        ⚡ Relais-Standard
      </button>
      <button class="btn-subtle" onclick={drawTestPattern} title="Schachbrett- / Farb-Testmuster in den Framebuffer schreiben">
        Testmuster
      </button>
      <button class="btn-subtle" onclick={() => cpu.clearScreen(settings.matrixResolution === 32 ? 960 : 768, settings.matrixResolution === 32 ? 64 : 256)}>
        Leeren
      </button>
    </div>
  </div>
</div>

<style>
  .matrix-controls {
    display: flex;
    gap: 6px;
    align-items: center;
    flex-wrap: wrap;
  }

  .matrix-controls select {
    background: #090e15;
    color: var(--text-bright);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    padding: 3px 6px;
    font-size: 11px;
    font-family: inherit;
    cursor: pointer;
  }

  .matrix-actions {
    display: flex;
    gap: 6px;
  }

  .pixel-status-badge {
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 600;
    color: var(--accent-color);
  }

  .mem-base-tag {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-muted);
    background: #090e15;
    padding: 2px 6px;
    border-radius: 3px;
    border: 1px solid var(--border-color);
  }
</style>
