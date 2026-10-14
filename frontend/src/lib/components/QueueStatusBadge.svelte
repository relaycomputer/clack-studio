<script>
  import { onMount, onDestroy } from 'svelte';

  /**
   * Props:
   *  - isCompiling: boolean (active compile request in progress)
   *  - lastDurationMs: number | null (last compile time in ms)
   *  - lastQueueWaitMs: number | null (last queue wait time in ms)
   */
  let { isCompiling = false, lastDurationMs = null, lastQueueWaitMs = null } = $props();

  let queueStats = $state({
    activeWorkers: 0,
    maxWorkers: 2,
    queueLength: 0,
    maxQueueLength: 50,
    totalProcessed: 0,
    totalErrors: 0,
    avgWaitTimeMs: 0,
    avgProcessTimeMs: 0,
    connected: false
  });

  let pollInterval = null;

  async function fetchQueueStats() {
    try {
      const resp = await fetch('/api/queue/stats', {
        headers: { 'Accept': 'application/json' }
      });
      if (resp.ok) {
        const ct = resp.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          const data = await resp.json();
          queueStats = { ...data, connected: true };
          return;
        }
      }
    } catch (_) {
      // Backend not running or WASM only mode
    }
    queueStats.connected = false;
  }

  onMount(() => {
    fetchQueueStats();
    pollInterval = setInterval(fetchQueueStats, 3000);
  });

  onDestroy(() => {
    if (pollInterval) clearInterval(pollInterval);
  });
</script>

<div class="queue-badge-container" title={queueStats.connected ? `Compiler-Queue: ${queueStats.activeWorkers}/${queueStats.maxWorkers} Worker aktiv, ${queueStats.queueLength} in Warteschlange. Gesamt verarbeitet: ${queueStats.totalProcessed}` : 'WebAssembly / Lokaler In-Browser Modus'}>
  {#if isCompiling}
    <div class="badge processing pulse">
      <span class="indicator spin">⏳</span>
      <span class="label">Kompiliert...</span>
      {#if queueStats.connected && queueStats.queueLength > 0}
        <span class="queue-pos">Pos: {queueStats.queueLength}</span>
      {/if}
    </div>
  {:else if queueStats.connected}
    <div class="badge online">
      <span class="dot online-dot"></span>
      <span class="label">Queue: {queueStats.activeWorkers}/{queueStats.maxWorkers}</span>
      {#if queueStats.queueLength > 0}
        <span class="queue-tag">+{queueStats.queueLength}</span>
      {/if}
      {#if lastDurationMs !== null}
        <span class="last-time">⚡ {lastDurationMs.toFixed(1)}ms{#if lastQueueWaitMs !== null && lastQueueWaitMs > 0}<span class="wait-tag" title="Queue-Wartezeit: {lastQueueWaitMs.toFixed(0)} ms"> +{lastQueueWaitMs.toFixed(0)}ms Q</span>{/if}</span>
      {/if}
    </div>
  {:else}
    <div class="badge wasm">
      <span class="dot wasm-dot"></span>
      <span class="label">WASM</span>
      {#if lastDurationMs !== null}
        <span class="last-time">⚡ {lastDurationMs.toFixed(1)}ms</span>
      {/if}
    </div>
  {/if}
</div>

<style>
  .queue-badge-container {
    display: inline-flex;
    align-items: center;
    user-select: none;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 0.72rem;
  }

  .badge {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 2px 7px;
    border-radius: 9999px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #94a3b8;
    transition: all 0.2s ease;
  }

  .badge.online {
    background: rgba(16, 185, 129, 0.1);
    border-color: rgba(16, 185, 129, 0.25);
    color: #6ee7b7;
  }

  .badge.processing {
    background: rgba(245, 158, 11, 0.15);
    border-color: rgba(245, 158, 11, 0.4);
    color: #fde68a;
  }

  .badge.wasm {
    background: rgba(99, 102, 241, 0.1);
    border-color: rgba(99, 102, 241, 0.25);
    color: #a5b4fc;
  }

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }

  .online-dot {
    background: #10b981;
    box-shadow: 0 0 6px #10b981;
  }

  .wasm-dot {
    background: #6366f1;
    box-shadow: 0 0 6px #6366f1;
  }

  .queue-tag {
    background: #f59e0b;
    color: #0f172a;
    font-weight: 700;
    font-size: 0.65rem;
    padding: 0 4px;
    border-radius: 4px;
  }

  .queue-pos {
    background: rgba(245, 158, 11, 0.3);
    padding: 0 4px;
    border-radius: 3px;
    font-weight: 600;
  }

  .last-time {
    color: #cbd5e1;
    opacity: 0.85;
    font-size: 0.68rem;
    margin-left: 2px;
    border-left: 1px solid rgba(255, 255, 255, 0.15);
    padding-left: 4px;
  }

  .wait-tag {
    color: #fde68a;
    font-size: 0.62rem;
    opacity: 0.9;
  }

  .spin {
    display: inline-block;
    animation: spin 1.2s infinite linear;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .pulse {
    animation: pulse-border 1.5s infinite ease-in-out;
  }

  @keyframes pulse-border {
    0%, 100% { border-color: rgba(245, 158, 11, 0.4); }
    50% { border-color: rgba(245, 158, 11, 0.8); box-shadow: 0 0 8px rgba(245, 158, 11, 0.3); }
  }
</style>
