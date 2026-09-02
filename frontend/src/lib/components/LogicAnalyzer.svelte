<script>
  import { cpu } from '../stores/cpuStore.svelte.js';

  function hex(v, l = 4) {
    return '0x' + (v || 0).toString(16).toUpperCase().padStart(l, '0');
  }

  let entries = $derived(cpu.history.slice(-100).reverse());

  function exportCSV() {
    let csv = "Index,Befehl_Hex,Mnemonic,PC_Hex,Accu_Hex,Addr_Hex,Data_Hex,Read_Hex,Write_Hex,Carry,Stack_Hex,Zyklen\n";
    for (let r of cpu.history) {
      csv += `${r.idx},${hex(r.cmd)},"${r.mnemonic}",${hex(r.pc,3)},${hex(r.accu)},${hex(r.addr,3)},${hex(r.data)},${r.read ? hex(r.read) : '0'},${r.write ? hex(r.write) : '0'},${r.carry},${hex(r.stack,3)},${r.cycles}\n`;
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'relay_logic_analyzer_trace.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function clearHistory() {
    cpu.history = [];
  }
</script>

<div class="tab-pane active" id="tab-history">
  <div class="history-toolbar">
    <span>Ausführungs-History (Zyklus für Zyklus)</span>
    <div class="history-actions">
      <button class="btn-subtle" onclick={exportCSV}>Export als CSV</button>
      <button class="btn-subtle" onclick={clearHistory}>History leeren</button>
    </div>
  </div>
  <div class="history-table-container">
    <table class="history-table">
      <thead>
        <tr>
          <th>Idx</th>
          <th>Cmd</th>
          <th>Befehl</th>
          <th>PC</th>
          <th>Accu</th>
          <th>Addr</th>
          <th>Data</th>
          <th>R</th>
          <th>W</th>
          <th>Flag</th>
          <th>Stack</th>
          <th>Zyklen</th>
        </tr>
      </thead>
      <tbody>
        {#each entries as r (r.idx)}
          <tr>
            <td>{r.idx.toString().padStart(4, '0')}</td>
            <td>{hex(r.cmd)}</td>
            <td>{r.mnemonic}</td>
            <td>{hex(r.pc, 3)}</td>
            <td>{hex(r.accu)}</td>
            <td>{hex(r.addr, 3)}</td>
            <td>{hex(r.data)}</td>
            <td>{r.read ? hex(r.read) : '-'}</td>
            <td>{r.write ? hex(r.write) : '-'}</td>
            <td>{r.carry}</td>
            <td>{hex(r.stack, 3)}</td>
            <td>{r.cycles}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
