// ==========================================
// ⚡ Clack WebAssembly Cross-Compiler Service
// ==========================================

let wasmLoaded = false;
let wasmPromise = null;

export async function initClackWasm() {
  if (wasmLoaded) return true;
  if (wasmPromise) return wasmPromise;

  wasmPromise = (async () => {
    try {
      if (typeof window === 'undefined') return false;

      // 1. Ensure wasm_exec.js is loaded
      if (typeof window.Go === 'undefined') {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = './wasm_exec.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      // 2. Load & instantiate clack.wasm
      const go = new window.Go();
      let wasmInstance;

      if (WebAssembly.instantiateStreaming) {
        try {
          const streamResp = await WebAssembly.instantiateStreaming(fetch('./clack.wasm'), go.importObject);
          wasmInstance = streamResp.instance;
        } catch (_) {
          // Fallback to fetch + arrayBuffer if streaming fails (e.g. strict MIME type)
          const resp = await fetch('./clack.wasm');
          const bytes = await resp.arrayBuffer();
          const mod = await WebAssembly.instantiate(bytes, go.importObject);
          wasmInstance = mod.instance;
        }
      } else {
        const resp = await fetch('./clack.wasm');
        const bytes = await resp.arrayBuffer();
        const mod = await WebAssembly.instantiate(bytes, go.importObject);
        wasmInstance = mod.instance;
      }

      // Run Go runtime in the background (select {} keeps it running)
      go.run(wasmInstance);
      wasmLoaded = true;
      console.log('⚡ Clack WebAssembly compiler runtime initialized successfully!');
      return true;
    } catch (err) {
      console.warn('⚡ Clack WebAssembly initialization note:', err.message);
      return false;
    }
  })();

  return wasmPromise;
}

export function isWasmAvailable() {
  return typeof window !== 'undefined' && typeof window.clackCompile === 'function';
}

export function compileBasicWasm(source, format = 'arduino') {
  if (!isWasmAvailable()) {
    throw new Error('WebAssembly Compiler noch nicht bereit');
  }
  const resStr = window.clackCompile(source, format);
  return JSON.parse(resStr);
}

export function assembleCodeWasm(source) {
  if (!isWasmAvailable()) {
    throw new Error('WebAssembly Assembler noch nicht bereit');
  }
  const resStr = window.clackAssemble(source);
  return JSON.parse(resStr);
}

export function decompileCodeWasm(source) {
  if (!isWasmAvailable()) {
    throw new Error('WebAssembly Decompiler noch nicht bereit');
  }
  const resStr = window.clackDecompile(source);
  return JSON.parse(resStr);
}

export function disassembleCodeWasm(source) {
  if (!isWasmAvailable()) {
    throw new Error('WebAssembly Disassembler noch nicht bereit');
  }
  const resStr = window.clackDisassemble(source);
  return JSON.parse(resStr);
}
