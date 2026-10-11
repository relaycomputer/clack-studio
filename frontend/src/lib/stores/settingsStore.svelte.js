// ==========================================
// ⚙️ Settings Store (Svelte 5 Runes)
// ==========================================

export class SettingsStore {
  theme = $state('theme-amber');
  matrixResolution = $state(32); // 32 = 4x Hardware Matrix ab 960 (0x03C0), 64 = Full Framebuffer ab 768
  matrixLayout = $state('hardware'); // 'hardware' (W0 rechts / W1 links - Real Hardware), 'linear' (W0 links / W1 rechts)
  matrixColorMode = $state('mandelbrot'); // 'theme', 'mandelbrot', 'rgb16', 'cyberpunk', 'rainbow'
  matrixMode = $state('1bit'); // '1bit' (16 px/word) or '4bit' (4 px/word, 16 colors)
  soundEnabled = $state(true);
  speedHz = $state(500);
  activeTab = $state('tab-basic');
  sharedAsmCode = $state('');
  sharedBasicCode = $state('');

  constructor() {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const t = params.get('tab');
      if (t === 'asm') this.activeTab = 'tab-asm';
      else if (t === 'editor' || t === 'machine') this.activeTab = 'tab-editor';
      else if (t === 'disasm') this.activeTab = 'tab-disasm';
      else if (t === 'memory') this.activeTab = 'tab-memory';
      else if (t === 'history') this.activeTab = 'tab-history';
    }
  }

  setTheme(newTheme) {
    this.theme = newTheme;
    if (typeof document !== 'undefined') {
      document.body.className = newTheme;
    }
  }

  setMatrixResolution(res) {
    this.matrixResolution = res;
  }

  setMatrixLayout(layout) {
    this.matrixLayout = layout;
  }

  setMatrixColorMode(mode) {
    this.matrixColorMode = mode;
  }

  setMatrixMode(mode) {
    this.matrixMode = mode;
  }

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    return this.soundEnabled;
  }

  setSpeed(hz) {
    this.speedHz = hz;
  }

  setActiveTab(tabId) {
    this.activeTab = tabId;
  }

  switchToAsm(code) {
    if (code) this.sharedAsmCode = code;
    this.activeTab = 'tab-asm';
  }

  switchToBasic(code) {
    if (code) this.sharedBasicCode = code;
    this.activeTab = 'tab-basic';
  }
}

export const settings = new SettingsStore();
