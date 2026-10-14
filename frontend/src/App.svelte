<script>
  import { onMount } from 'svelte';
  import HeaderBar from './lib/components/HeaderBar.svelte';
  import MatrixDisplay from './lib/components/MatrixDisplay.svelte';
  import Frontpanel from './lib/components/Frontpanel.svelte';
  import TransportControls from './lib/components/TransportControls.svelte';
  import BasicStudio from './lib/components/BasicStudio.svelte';
  import AssemblerStudio from './lib/components/AssemblerStudio.svelte';
  import MachineCodeStudio from './lib/components/MachineCodeStudio.svelte';
  import Disassembler from './lib/components/Disassembler.svelte';
  import RamHeatmap from './lib/components/RamHeatmap.svelte';
  import LogicAnalyzer from './lib/components/LogicAnalyzer.svelte';

  import { cpu } from './lib/stores/cpuStore.svelte.js';
  import { settings } from './lib/stores/settingsStore.svelte.js';
  import { BASIC_PRESETS_LIST } from './lib/data/basicPresets.js';
  import { initClackWasm } from './lib/services/wasmService.js';

  onMount(() => {
    // 1. WebAssembly Compiler im Hintergrund initialisieren
    initClackWasm();

    // 2. Initialen Maschinencode laden (Ping-Pong aus Standard-BASIC-Preset)
    if (cpu.memory[0] === 0) {
      const defaultPreset = BASIC_PRESETS_LIST.find(p => p.id === 'ping_pong') || BASIC_PRESETS_LIST[0];
      if (defaultPreset && defaultPreset.compiledCode) {
        cpu.loadSource(defaultPreset.compiledCode);
      }
    }
  });
</script>

<div class="chassis">
  <HeaderBar />

  <main class="main-grid">
    <!-- Left Column: Matrix Display & Frontpanel -->
    <section class="left-column">
      <MatrixDisplay />
      <Frontpanel />
    </section>

    <!-- Right Column: Transport Controls & Multi-Tab Workstation -->
    <section class="right-column">
      <TransportControls />

      <div class="workstation-panel">
        <div class="tabs-header" role="tablist" aria-label="Arbeitsbereich-Tabs">
          <button 
            role="tab"
            aria-selected={settings.activeTab === 'tab-basic'}
            class="tab-btn" 
            class:active={settings.activeTab === 'tab-basic'}
            onclick={() => settings.setActiveTab('tab-basic')}
          >
            📜 BASIC Studio
          </button>
          <button 
            role="tab"
            aria-selected={settings.activeTab === 'tab-asm'}
            class="tab-btn" 
            class:active={settings.activeTab === 'tab-asm'}
            onclick={() => settings.setActiveTab('tab-asm')}
          >
            ⚡ Assembler Studio
          </button>
          <button 
            role="tab"
            aria-selected={settings.activeTab === 'tab-editor'}
            class="tab-btn" 
            class:active={settings.activeTab === 'tab-editor'}
            onclick={() => settings.setActiveTab('tab-editor')}
          >
            💻 Maschinencode & Loader
          </button>
          <button 
            role="tab"
            aria-selected={settings.activeTab === 'tab-disasm'}
            class="tab-btn" 
            class:active={settings.activeTab === 'tab-disasm'}
            onclick={() => settings.setActiveTab('tab-disasm')}
          >
            🔍 Disassembler & Trace
          </button>
          <button 
            role="tab"
            aria-selected={settings.activeTab === 'tab-memory'}
            class="tab-btn" 
            class:active={settings.activeTab === 'tab-memory'}
            onclick={() => settings.setActiveTab('tab-memory')}
          >
            🧠 1024-Wort RAM Matrix
          </button>
          <button 
            role="tab"
            aria-selected={settings.activeTab === 'tab-history'}
            class="tab-btn" 
            class:active={settings.activeTab === 'tab-history'}
            onclick={() => settings.setActiveTab('tab-history')}
          >
            📊 Logic Analyzer
          </button>
        </div>

        <div class="tab-contents">
          {#if settings.activeTab === 'tab-basic'}
            <BasicStudio />
          {:else if settings.activeTab === 'tab-asm'}
            <AssemblerStudio />
          {:else if settings.activeTab === 'tab-editor'}
            <MachineCodeStudio />
          {:else if settings.activeTab === 'tab-disasm'}
            <Disassembler />
          {:else if settings.activeTab === 'tab-memory'}
            <RamHeatmap />
          {:else if settings.activeTab === 'tab-history'}
            <LogicAnalyzer />
          {/if}
        </div>
      </div>
    </section>
  </main>
</div>
