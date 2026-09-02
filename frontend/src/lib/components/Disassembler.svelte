<script>
  import { cpu, MEM_SIZE } from '../stores/cpuStore.svelte.js';

  let listContainer = $state(null);

  function hex(v, l = 4) {
    return '0x' + (v || 0).toString(16).toUpperCase().padStart(l, '0');
  }

  // Generate disassembled rows dynamically from current memory
  let rows = $derived.by(() => {
    const list = [];
    let i = 0;
    while (i < MEM_SIZE) {
      const cmd = cpu.memory[i];
      const op = i + 1 < MEM_SIZE ? cpu.memory[i + 1] : 0;
      const dis = cpu.disassembleInstruction(cmd, op);

      list.push({
        addr: i,
        cmd: cmd,
        dis: dis,
        isActive: (i === cpu.pc)
      });

      i += dis.words;
    }
    return list;
  });

  export function scrollToPC() {
    if (!listContainer) return;
    const el = listContainer.querySelector('.disasm-row.active');
    if (el) {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }
</script>

<div class="tab-pane active" id="tab-disasm">
  <div class="disasm-toolbar">
    <span>Live Disassembler des 1024-Wort Speichers</span>
    <button class="btn-subtle" onclick={scrollToPC}>Zu aktivem PC springen</button>
  </div>
  <div class="disasm-container" bind:this={listContainer}>
    {#each rows as row (row.addr)}
      <div class="disasm-row" class:active={row.isActive}>
        <span class="disasm-addr">{hex(row.addr, 3)}</span>
        <span class="disasm-hex">{hex(row.cmd, 4)}</span>
        <span class="disasm-code">{row.dis.text}</span>
        <span class="disasm-type">{row.dis.type}</span>
      </div>
    {/each}
  </div>
</div>
