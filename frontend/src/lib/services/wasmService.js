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

      // Helper to resolve asset URLs with fallbacks
      function getCandidateUrls(filename) {
        const list = [];
        try {
          let base = window.location.href;
          const u = new URL(base);
          if (!u.pathname.endsWith('/') && !u.pathname.includes('.')) {
            u.pathname += '/';
          }
          list.push(new URL(filename, u.href).href);
        } catch (_) {}
        list.push('./' + filename);
        list.push('/studio/' + filename);
        list.push('/' + filename);
        return [...new Set(list)];
      }

      // 1. Ensure wasm_exec.js is loaded
      if (typeof window.Go === 'undefined') {
        const scriptUrls = getCandidateUrls('wasm_exec.js');
        let loaded = false;
        for (const sUrl of scriptUrls) {
          try {
            await new Promise((resolve, reject) => {
              const script = document.createElement('script');
              script.src = sUrl;
              script.onload = () => { loaded = true; resolve(); };
              script.onerror = reject;
              document.head.appendChild(script);
            });
            if (loaded && typeof window.Go !== 'undefined') break;
          } catch (_) {}
        }
        if (typeof window.Go === 'undefined') {
          throw new Error('wasm_exec.js konnte unter keinem Pfad geladen werden');
        }
      }

      // 2. Load & instantiate clack.wasm with candidate fallback fetches
      const go = new window.Go();
      let wasmInstance;
      const wasmUrls = getCandidateUrls('clack.wasm');
      let wasmResponse = null;

      for (const wUrl of wasmUrls) {
        try {
          const resp = await fetch(wUrl);
          if (resp.ok) {
            const ct = resp.headers.get('content-type') || '';
            // Make sure it is not an HTML 404 page
            if (!ct.includes('text/html')) {
              wasmResponse = resp;
              break;
            }
          }
        } catch (_) {}
      }

      if (!wasmResponse) {
        throw new Error('clack.wasm konnte von keinem Speicherort geladen werden');
      }

      if (WebAssembly.instantiateStreaming) {
        try {
          // Response can only be read once, clone just in case
          const streamResp = await WebAssembly.instantiateStreaming(wasmResponse.clone(), go.importObject);
          wasmInstance = streamResp.instance;
        } catch (_) {
          const bytes = await wasmResponse.arrayBuffer();
          const mod = await WebAssembly.instantiate(bytes, go.importObject);
          wasmInstance = mod.instance;
        }
      } else {
        const bytes = await wasmResponse.arrayBuffer();
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
