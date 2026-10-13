<script>
  import { cpu } from '../stores/cpuStore.svelte.js';

  function hex(val, len = 4) {
    return '0x' + (val || 0).toString(16).toUpperCase().padStart(len, '0');
  }

  let signedAccu = $derived(cpu.accu > 32767 ? cpu.accu - 65536 : cpu.accu);
  let disasmIR = $derived(cpu.disassembleInstruction(cpu.ir, cpu.memory[(cpu.pc + 1) % 1024]).text.split(' ')[0]);
  let dataSub = $derived(cpu.write !== 0 ? `WR: 0x${cpu.write.toString(16).toUpperCase()}` : (cpu.read !== 0 ? `RD: 0x${cpu.read.toString(16).toUpperCase()}` : 'idle'));
</script>

<div class="panel frontpanel">
  <div class="panel-header">
    <div class="panel-title">
      <span class="dot live-dot"></span>
      <span>HARDWARE REGISTER & BUS-LEDS</span>
    </div>
    
    <!-- Status Indicator Lamps -->
    <div class="status-lamps">
      <div class="lamp-group">
        <span class="lamp-dot" class:active={cpu.read !== 0}></span>
        <span class="lamp-text">READ</span>
      </div>
      <div class="lamp-group">
        <span class="lamp-dot" class:active={cpu.write !== 0}></span>
        <span class="lamp-text">WRITE</span>
      </div>
      <div class="lamp-group">
        <span class="lamp-dot" class:active={cpu.carry === 1}></span>
        <span class="lamp-text">C</span>
      </div>
      <div class="lamp-group">
        <span class="lamp-dot" class:active={cpu.zero}></span>
        <span class="lamp-text">Z</span>
      </div>
      <div class="lamp-group">
        <span class="lamp-dot" class:active={cpu.negative}></span>
        <span class="lamp-text">N</span>
      </div>
      <div class="lamp-group">
        <span class="lamp-dot" class:active={cpu.even}></span>
        <span class="lamp-text">E</span>
      </div>
    </div>
  </div>

  <div class="registers-stack">
    <!-- ACCU (16 bit) -->
    <div class="led-bar-row">
      <div class="led-label">
        <span class="name">ACCU</span>
        <span class="badge">16-Bit</span>
      </div>
      <div class="led-array">
        {#each [3, 2, 1, 0] as nibble}
          <div class="led-nibble">
            {#each [3, 2, 1, 0] as b}
              {@const bitIndex = nibble * 4 + b}
              <div class="led" class:on={(cpu.accu >> bitIndex) & 1} title="Bit {bitIndex}"></div>
            {/each}
          </div>
        {/each}
      </div>
      <div class="led-info">
        <div class="primary-val">{hex(cpu.accu, 4)}</div>
        <div class="secondary-val">dec: {signedAccu}</div>
      </div>
    </div>

    <!-- IR (16 bit) -->
    <div class="led-bar-row">
      <div class="led-label">
        <span class="name">IR (BEFEHL)</span>
        <span class="badge">16-Bit</span>
      </div>
      <div class="led-array">
        {#each [3, 2, 1, 0] as nibble}
          <div class="led-nibble">
            {#each [3, 2, 1, 0] as b}
              {@const bitIndex = nibble * 4 + b}
              <div class="led" class:on={(cpu.ir >> bitIndex) & 1} title="Bit {bitIndex}"></div>
            {/each}
          </div>
        {/each}
      </div>
      <div class="led-info">
        <div class="primary-val">{hex(cpu.ir, 4)}</div>
        <div class="secondary-val highlight-cmd">{disasmIR}</div>
      </div>
    </div>

    <!-- DATA BUS (16 bit) -->
    <div class="led-bar-row">
      <div class="led-label">
        <span class="name">DATENBUS</span>
        <span class="badge">16-Bit</span>
      </div>
      <div class="led-array">
        {#each [3, 2, 1, 0] as nibble}
          <div class="led-nibble">
            {#each [3, 2, 1, 0] as b}
              {@const bitIndex = nibble * 4 + b}
              <div class="led" class:on={(cpu.dataBus >> bitIndex) & 1} title="Bit {bitIndex}"></div>
            {/each}
          </div>
        {/each}
      </div>
      <div class="led-info">
        <div class="primary-val">{hex(cpu.dataBus, 4)}</div>
        <div class="secondary-val">{dataSub}</div>
      </div>
    </div>

    <!-- ADRESS BUS (10 bit) -->
    <div class="led-bar-row">
      <div class="led-label">
        <span class="name">ADRESSBUS</span>
        <span class="badge">10-Bit</span>
      </div>
      <div class="led-array">
        {#each [3, 2, 1, 0] as nibble}
          <div class="led-nibble">
            {#each [3, 2, 1, 0] as b}
              {@const bitIndex = nibble * 4 + b}
              {#if bitIndex >= 10}
                <div class="led spacer"></div>
              {:else}
                <div class="led" class:on={(cpu.addressBus >> bitIndex) & 1} title="Bit {bitIndex}"></div>
              {/if}
            {/each}
          </div>
        {/each}
      </div>
      <div class="led-info">
        <div class="primary-val">{hex(cpu.addressBus, 4)}</div>
        <div class="secondary-val">RAM: {cpu.addressBus}</div>
      </div>
    </div>

    <!-- PC (10 bit) -->
    <div class="led-bar-row">
      <div class="led-label">
        <span class="name">PC</span>
        <span class="badge">10-Bit</span>
      </div>
      <div class="led-array">
        {#each [3, 2, 1, 0] as nibble}
          <div class="led-nibble">
            {#each [3, 2, 1, 0] as b}
              {@const bitIndex = nibble * 4 + b}
              {#if bitIndex >= 10}
                <div class="led spacer"></div>
              {:else}
                <div class="led" class:on={(cpu.pc >> bitIndex) & 1} title="Bit {bitIndex}"></div>
              {/if}
            {/each}
          </div>
        {/each}
      </div>
      <div class="led-info">
        <div class="primary-val">{hex(cpu.pc, 4)}</div>
        <div class="secondary-val">step: {cpu.pc}</div>
      </div>
    </div>

    <!-- SR (10 bit Subroutine Return Address) -->
    <div class="led-bar-row">
      <div class="led-label" title="SR (Subroutine Return Address): 10-Bit Hardware-Rücksprungadresse (CALL / RET)">
        <span class="name">SR (Return)</span>
        <span class="badge">10-Bit</span>
      </div>
      <div class="led-array">
        {#each [3, 2, 1, 0] as nibble}
          <div class="led-nibble">
            {#each [3, 2, 1, 0] as b}
              {@const bitIndex = nibble * 4 + b}
              {#if bitIndex >= 10}
                <div class="led spacer"></div>
              {:else}
                <div class="led" class:on={(cpu.stack >> bitIndex) & 1} title="Bit {bitIndex}"></div>
              {/if}
            {/each}
          </div>
        {/each}
      </div>
      <div class="led-info">
        <div class="primary-val">{hex(cpu.stack, 4)}</div>
        <div class="secondary-val">ret: {hex(cpu.stack, 3)}</div>
      </div>
    </div>
  </div>
</div>
