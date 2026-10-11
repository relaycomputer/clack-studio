; ============================================================
; 🔢 16-Bit Relais-Assembler: Collatz-Folge (3n + 1)
; ============================================================
ORG 0

START:
    NOP

LOOP:
    ; Pruefe ob V_200 == 1 (Ziel erreicht)
    LDAM 200
    ADD #-1
    BZ FINISH

    ; Pruefe ob Zahl gerade ist (Bit 0 == 0)
    LDAM 200
    BE EVEN_NUMBER

ODD_NUMBER:
    ; Ungerade: 3n + 1 (entspricht 2n + n + 1)
    LDAM 200
    STAM 16        ; n sichern
    SHL            ; 2n
    ADD 16         ; 3n
    ADD #1         ; 3n + 1
    BA UPDATE_VAL

EVEN_NUMBER:
    ; Gerade: n / 2
    LDAM 200
    SHR

UPDATE_VAL:
    STAM 200       ; Neuer Wert
    LDAM 201
    ADD #1
    STAM 201       ; Schrittzaehler + 1
    BA LOOP

FINISH:
    LDAM 201       ; Ergebnis im Akku
    HALT
