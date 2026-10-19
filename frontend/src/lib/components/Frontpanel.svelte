<script>
  import { cpu } from '../stores/cpuStore.svelte.js';

  function hex(val, len = 4) {
    return '0x' + (val || 0).toString(16).toUpperCase().padStart(len, '0');
  }

  let signedAccu = $derived(cpu.accu > 32767 ? cpu.accu - 65536 : cpu.accu);
  let disasmIR = $derived(cpu.disassembleInstruction(cpu.ir, cpu.memory[(cpu.pc + 1) % 1024]).text.split(' ')[0]);
  let dataSub = $derived(cpu.write !== 0 ? `WR: 0x${cpu.write.toString(16).toUpperCase()}` : (cpu.read !== 0 ? `RD: 0x${cpu.read.toString(16).toUpperCase()}` : 'idle'));
  let outReg = $derived(cpu.outputRegister);
  let inReg = $derived(cpu.inputRegister);
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

    <!-- OUTPUT REGISTER (8 bit - Addr 2) -->
    <div class="led-bar-row">
      <div class="led-label" title="Hardware Output Register an RAM-Adresse 2 (8-Bit)">
        <span class="name">OUT (0x002)</span>
        <span class="badge">8-Bit OUT</span>
      </div>
      <div class="led-array">
        {#each [3, 2, 1, 0] as nibble}
          <div class="led-nibble">
            {#each [3, 2, 1, 0] as b}
              {@const bitIndex = nibble * 4 + b}
              {#if bitIndex >= 8}
                <div class="led spacer"></div>
              {:else}
                <div class="led" class:on={(outReg >> bitIndex) & 1} title="Bit {bitIndex}"></div>
              {/if}
            {/each}
          </div>
        {/each}
      </div>
      <div class="led-info">
        <div class="primary-val">{hex(outReg, 2)}</div>
        <div class="secondary-val">dec: {outReg}</div>
      </div>
    </div>

    <!-- INPUT REGISTER (8 bit - Addr 3 mit interaktiven Schaltern) -->
    <div class="led-bar-row input-reg-row">
      <div class="led-label" title="Hardware Input Register an RAM-Adresse 3 (8-Bit Schalter/Check-Boxen)">
        <span class="name">IN (0x003)</span>
        <span class="badge interactive-badge">8-Bit IN ⚙</span>
      </div>
      <div class="led-array">
        {#each [3, 2, 1, 0] as nibble}
          <div class="led-nibble" class:active-nibble={nibble < 2}>
            {#each [3, 2, 1, 0] as b}
              {@const bitIndex = nibble * 4 + b}
              {#if bitIndex >= 8}
                <div class="led spacer"></div>
              {:else}
                {@const isBitOn = Boolean((inReg >> bitIndex) & 1)}
                <button
                  type="button"
                  class="switch-btn"
                  class:active={isBitOn}
                  onclick={() => cpu.toggleInputBit(bitIndex)}
                  title="Schalter Bit {bitIndex}: {isBitOn ? '1 (EIN)' : '0 (AUS)'} - Klicken zum Umschalten"
                  aria-label="Eingabeschalter Bit {bitIndex} umschalten"
                >
                  <span class="switch-knob"></span>
                </button>
              {/if}
            {/each}
          </div>
        {/each}
      </div>
      <div class="led-info">
        <div class="primary-val">{hex(inReg, 2)}</div>
        <button
          type="button"
          class="clear-in-btn"
          onclick={() => cpu.clearInputRegister()}
          title="Alle 8 Input-Schalter auf 0 zurücksetzen"
        >
          dec: {inReg} (Reset)
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  .switch-btn {
    width: 8.5px;
    height: 12px;
    border-radius: 2px;
    background: var(--accent-led-off, #0a111a);
    border: 1px solid rgba(255, 255, 255, 0.2);
    padding: 0;
    margin: 0;
    cursor: pointer;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: center;
    transition: background 0.08s ease, border-color 0.08s ease, box-shadow 0.08s ease;
  }

  .switch-btn:hover {
    border-color: rgba(255, 255, 255, 0.6);
    background: #152233;
  }

  .switch-knob {
    width: 6.5px;
    height: 5px;
    border-radius: 1px;
    background: #64748b;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.7);
    transition: all 0.08s ease;
  }

  .switch-btn.active {
    background: rgba(16, 185, 129, 0.2);
    border-color: #10b981;
    box-shadow: 0 0 6px #10b981, inset 0 0 3px #ffffff;
    justify-content: flex-start;
  }

  .switch-btn.active .switch-knob {
    background: #10b981;
    box-shadow: 0 0 4px #10b981, inset 0 0 2px #ffffff;
  }

  .interactive-badge {
    color: #10b981 !important;
    font-weight: 700;
  }

  .clear-in-btn {
    background: transparent;
    border: none;
    padding: 0;
    margin: 0;
    font-family: inherit;
    font-size: 8.5px;
    color: var(--text-muted, #94a3b8);
    cursor: pointer;
    text-align: right;
  }

  .clear-in-btn:hover {
    color: var(--accent-color, #ffb000);
    text-decoration: underline;
  }

  .input-reg-row {
    border-color: rgba(16, 185, 129, 0.3);
  }
</style>
