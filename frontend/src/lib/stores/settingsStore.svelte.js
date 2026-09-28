// ==========================================
// ⚙️ Settings Store (Svelte 5 Runes)
// ==========================================

export class SettingsStore {
  theme = $state('theme-amber');
  matrixResolution = $state(32); // 32 = 4x Hardware Matrix ab 960 (0x03C0), 64 = Full Framebuffer ab 768
  soundEnabled = $state(true);
  speedHz = $state(500);
  activeTab = $state('tab-basic');
  sharedAsmCode = $state('');
  sharedBasicCode = $state('');

  setTheme(newTheme) {
    this.theme = newTheme;
    if (typeof document !== 'undefined') {
      document.body.className = newTheme;
    }
  }

  setMatrixResolution(res) {
    this.matrixResolution = res;
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
