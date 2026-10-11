; ============================================================
; 🏓 16-Bit Relais-Assembler: LED-Matrix Bouncing Pixel Demo
; ============================================================
ORG 0

START:
    ; Framebuffer Display Wort 0 leeren (Zeile 0, Pixel 0..15)
    LDA #0
    STAM 960

    ; Variablen initialisieren
    LDA #0
    STAM 500       ; Pixel-Position X (0..15)
    LDA #1
    STAM 501       ; Bitmaske (0x0001)

BOUNCE_LOOP:
    ; Aktuelle Bitmaske in Framebuffer schreiben
    LDAM 501
    STAM 960

    ; Bitmaske nach links rotieren (Pixel wandert nach links)
    LDAM 501
    SHL
    STAM 501

    ; Pruefen ob Bit 15 erreicht (Negative Flag)
    BN RESET_BIT

    ; Pause-Schleife (Verzoegerung)
    LDA #50
    STAM 502
DELAY_LOOP:
    LDAM 502
    ADD #-1
    STAM 502
    BZ BOUNCE_LOOP
    BA DELAY_LOOP

RESET_BIT:
    LDA #1
    STAM 501
    BA BOUNCE_LOOP
