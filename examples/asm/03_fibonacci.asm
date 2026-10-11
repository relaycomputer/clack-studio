; ============================================================
; 🌀 16-Bit Relais-Assembler: Fibonacci-Sequenz
; ============================================================
ORG 0

START:
    LDA #0
    STAM 500       ; F0 = 0
    LDA #1
    STAM 501       ; F1 = 1
    LDA #10
    STAM 502       ; Countdown = 10 Terme

FIB_LOOP:
    ; F2 = F0 + F1
    LDAM 500
    ADD 501
    STAM 503       ; F2

    ; Weiterschieben: F0 = F1, F1 = F2
    LDAM 501
    STAM 500
    LDAM 503
    STAM 501

    ; Countdown dekrementieren
    LDAM 502
    ADD #-1
    STAM 502
    BZ DONE
    BA FIB_LOOP

DONE:
    LDAM 501       ; 10. Fibonacci-Zahl im Akku
    HALT
