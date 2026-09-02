<script>
  import { cpu, MEM_SIZE } from '../stores/cpuStore.svelte.js';
  import { settings } from '../stores/settingsStore.svelte.js';

  let inspectText = $state('Klicke auf eine Zelle, um Details anzuzeigen oder zu editieren.');
  let searchAddr = $state('');

  function hex(v, l = 4) {
    return '0x' + (v || 0).toString(16).toUpperCase().padStart(l, '0');
  }

  function handleCellHover(addr) {
    const val = cpu.memory[addr];
    const op = (addr + 1 < MEM_SIZE) ? cpu.memory[addr + 1] : 0;
    const dis = cpu.disassembleInstruction(val, op);
    inspectText = `RAM [${hex(addr, 3)} / ${addr}]: <b>${hex(val, 4)}</b> (${val}) — <i>${dis.text}</i>`;
  }

  function handleCellClick(addr) {
    const current = cpu.memory[addr];
    const input = prompt(`Wert für Adresse ${addr} (Hex 0x... oder Dec):`, hex(current, 4));
    if (input !== null) {
      let val = input.toLowerCase().startsWith('0x') ? parseInt(input.substring(2), 16) : parseInt(input, 10);
      if (!isNaN(val)) {
        cpu.setMemoryCell(addr, val);
      }
    }
  }

  function isScreen(addr) {
    return settings.matrixResolution === 32 ? (addr >= 960 && addr < 1024) : (addr >= 768 && addr < 1024);
  }

  function getCellClass(addr) {
    if (addr === cpu.pc) return 'cell-pc';
    if (addr === cpu.lastWriteAddr) return 'cell-write';
    if (isScreen(addr)) return 'cell-screen';
    const val = cpu.memory[addr];
    if (val !== 0) {
      if ((val >= 0x1000 && val <= 0x6000) || val === 0xF000) {
        return 'cell-code';
      }
      return 'cell-data';
    }
    return '';
  }
</script>

<div class="tab-pane active" id="tab-memory">
  <div class="mem-toolbar">
    <div class="mem-legend">
      <span class="legend-item"><span class="box code"></span> Code</span>
      <span class="legend-item"><span class="box data"></span> Daten / Variablen</span>
      <span class="legend-item"><span class="box screen"></span> Framebuffer</span>
      <span class="legend-item"><span class="box pc"></span> Aktiver PC</span>
      <span class="legend-item"><span class="box write"></span> Letzter Schreibzugriff</span>
    </div>
    <div class="mem-search">
      <input 
        type="number" 
        placeholder="Adresse (0..1023)" 
        min="0" 
        max="1023"
        bind:value={searchAddr}
        oninput={() => {
          const a = parseInt(searchAddr, 10);
          if (!isNaN(a) && a >= 0 && a < 1024) handleCellHover(a);
        }}
      />
    </div>
  </div>

  <div class="memory-grid-container">
    {#each Array(MEM_SIZE) as _, i}
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div 
        class="mem-cell {getCellClass(i)}"
        title="Adresse {hex(i, 3)} ({i})"
        onmouseenter={() => handleCellHover(i)}
        onclick={() => handleCellClick(i)}
      ></div>
    {/each}
  </div>

  <div class="mem-inspect">
    {@html inspectText}
  </div>
</div>
