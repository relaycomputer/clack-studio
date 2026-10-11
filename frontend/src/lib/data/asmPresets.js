// ==========================================
// 💾 Automatisch aus examples/asm/ synchronisiert
// Bitte NICHT manuell bearbeiten - Änderungen in examples/asm/ vornehmen!
// ==========================================

export const ASM_PRESETS_LIST = [
  {
    "id": "matrix_bounce",
    "label": "🏓 16-Bit Relais-Assembler: LED-Matrix Bouncing Pixel Demo",
    "filename": "matrix_bounce.asm",
    "code": "; ============================================================\n; 🏓 16-Bit Relais-Assembler: LED-Matrix Bouncing Pixel Demo\n; ============================================================\nORG 0\n\nSTART:\n    ; Framebuffer Display Wort 0 leeren (Zeile 0, Pixel 0..15)\n    LDA #0\n    STAM 960\n\n    ; Variablen initialisieren\n    LDA #0\n    STAM 500       ; Pixel-Position X (0..15)\n    LDA #1\n    STAM 501       ; Bitmaske (0x0001)\n\nBOUNCE_LOOP:\n    ; Aktuelle Bitmaske in Framebuffer schreiben\n    LDAM 501\n    STAM 960\n\n    ; Bitmaske nach links rotieren (Pixel wandert nach links)\n    LDAM 501\n    SHL\n    STAM 501\n\n    ; Pruefen ob Bit 15 erreicht (Negative Flag)\n    BN RESET_BIT\n\n    ; Pause-Schleife (Verzoegerung)\n    LDA #50\n    STAM 502\nDELAY_LOOP:\n    LDAM 502\n    ADD #-1\n    STAM 502\n    BZ BOUNCE_LOOP\n    BA DELAY_LOOP\n\nRESET_BIT:\n    LDA #1\n    STAM 501\n    BA BOUNCE_LOOP\n"
  },
  {
    "id": "collatz",
    "label": "🔢 16-Bit Relais-Assembler: Collatz-Folge (3n + 1)",
    "filename": "collatz.asm",
    "code": "; ============================================================\n; 🔢 16-Bit Relais-Assembler: Collatz-Folge (3n + 1)\n; ============================================================\nORG 0\n\nSTART:\n    NOP\n\nLOOP:\n    ; Pruefe ob V_200 == 1 (Ziel erreicht)\n    LDAM 200\n    ADD #-1\n    BZ FINISH\n\n    ; Pruefe ob Zahl gerade ist (Bit 0 == 0)\n    LDAM 200\n    BE EVEN_NUMBER\n\nODD_NUMBER:\n    ; Ungerade: 3n + 1 (entspricht 2n + n + 1)\n    LDAM 200\n    STAM 16        ; n sichern\n    SHL            ; 2n\n    ADD 16         ; 3n\n    ADD #1         ; 3n + 1\n    BA UPDATE_VAL\n\nEVEN_NUMBER:\n    ; Gerade: n / 2\n    LDAM 200\n    SHR\n\nUPDATE_VAL:\n    STAM 200       ; Neuer Wert\n    LDAM 201\n    ADD #1\n    STAM 201       ; Schrittzaehler + 1\n    BA LOOP\n\nFINISH:\n    LDAM 201       ; Ergebnis im Akku\n    HALT\n"
  },
  {
    "id": "fibonacci",
    "label": "🌀 16-Bit Relais-Assembler: Fibonacci-Sequenz",
    "filename": "fibonacci.asm",
    "code": "; ============================================================\n; 🌀 16-Bit Relais-Assembler: Fibonacci-Sequenz\n; ============================================================\nORG 0\n\nSTART:\n    LDA #0\n    STAM 500       ; F0 = 0\n    LDA #1\n    STAM 501       ; F1 = 1\n    LDA #10\n    STAM 502       ; Countdown = 10 Terme\n\nFIB_LOOP:\n    ; F2 = F0 + F1\n    LDAM 500\n    ADD 501\n    STAM 503       ; F2\n\n    ; Weiterschieben: F0 = F1, F1 = F2\n    LDAM 501\n    STAM 500\n    LDAM 503\n    STAM 501\n\n    ; Countdown dekrementieren\n    LDAM 502\n    ADD #-1\n    STAM 502\n    BZ DONE\n    BA FIB_LOOP\n\nDONE:\n    LDAM 501       ; 10. Fibonacci-Zahl im Akku\n    HALT\n"
  }
];

export const ASM_PRESETS = {
  "matrix_bounce": "; ============================================================\n; 🏓 16-Bit Relais-Assembler: LED-Matrix Bouncing Pixel Demo\n; ============================================================\nORG 0\n\nSTART:\n    ; Framebuffer Display Wort 0 leeren (Zeile 0, Pixel 0..15)\n    LDA #0\n    STAM 960\n\n    ; Variablen initialisieren\n    LDA #0\n    STAM 500       ; Pixel-Position X (0..15)\n    LDA #1\n    STAM 501       ; Bitmaske (0x0001)\n\nBOUNCE_LOOP:\n    ; Aktuelle Bitmaske in Framebuffer schreiben\n    LDAM 501\n    STAM 960\n\n    ; Bitmaske nach links rotieren (Pixel wandert nach links)\n    LDAM 501\n    SHL\n    STAM 501\n\n    ; Pruefen ob Bit 15 erreicht (Negative Flag)\n    BN RESET_BIT\n\n    ; Pause-Schleife (Verzoegerung)\n    LDA #50\n    STAM 502\nDELAY_LOOP:\n    LDAM 502\n    ADD #-1\n    STAM 502\n    BZ BOUNCE_LOOP\n    BA DELAY_LOOP\n\nRESET_BIT:\n    LDA #1\n    STAM 501\n    BA BOUNCE_LOOP\n",
  "collatz": "; ============================================================\n; 🔢 16-Bit Relais-Assembler: Collatz-Folge (3n + 1)\n; ============================================================\nORG 0\n\nSTART:\n    NOP\n\nLOOP:\n    ; Pruefe ob V_200 == 1 (Ziel erreicht)\n    LDAM 200\n    ADD #-1\n    BZ FINISH\n\n    ; Pruefe ob Zahl gerade ist (Bit 0 == 0)\n    LDAM 200\n    BE EVEN_NUMBER\n\nODD_NUMBER:\n    ; Ungerade: 3n + 1 (entspricht 2n + n + 1)\n    LDAM 200\n    STAM 16        ; n sichern\n    SHL            ; 2n\n    ADD 16         ; 3n\n    ADD #1         ; 3n + 1\n    BA UPDATE_VAL\n\nEVEN_NUMBER:\n    ; Gerade: n / 2\n    LDAM 200\n    SHR\n\nUPDATE_VAL:\n    STAM 200       ; Neuer Wert\n    LDAM 201\n    ADD #1\n    STAM 201       ; Schrittzaehler + 1\n    BA LOOP\n\nFINISH:\n    LDAM 201       ; Ergebnis im Akku\n    HALT\n",
  "fibonacci": "; ============================================================\n; 🌀 16-Bit Relais-Assembler: Fibonacci-Sequenz\n; ============================================================\nORG 0\n\nSTART:\n    LDA #0\n    STAM 500       ; F0 = 0\n    LDA #1\n    STAM 501       ; F1 = 1\n    LDA #10\n    STAM 502       ; Countdown = 10 Terme\n\nFIB_LOOP:\n    ; F2 = F0 + F1\n    LDAM 500\n    ADD 501\n    STAM 503       ; F2\n\n    ; Weiterschieben: F0 = F1, F1 = F2\n    LDAM 501\n    STAM 500\n    LDAM 503\n    STAM 501\n\n    ; Countdown dekrementieren\n    LDAM 502\n    ADD #-1\n    STAM 502\n    BZ DONE\n    BA FIB_LOOP\n\nDONE:\n    LDAM 501       ; 10. Fibonacci-Zahl im Akku\n    HALT\n"
};
