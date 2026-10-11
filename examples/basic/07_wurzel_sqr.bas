REM ============================================================
REM ⚡ Clack-BASIC: Hardwarenahe Wurzelfunktion (SQR / SQRT)
REM ============================================================
REM 1. Ganzzahlige Quadratwurzel (8-Schritt Bit-by-Bit)
LET R1 = SQR(64)       REM Ergibt 8
LET R2 = SQR(100)      REM Ergibt 10
LET R3 = SQRT(25)      REM Ergibt 5

REM 2. Festkomma-Wurzel mit Nachkommastellen (Differenzextraktion)
LET W2_1 = SQR(2, 1)   REM Ergibt 14  (1.4)
LET W2_2 = SQR(2, 2)   REM Ergibt 141 (1.41)
LET W3_2 = SQR(3, 2)   REM Ergibt 173 (1.73)
LET W10_2 = SQR(10, 2) REM Ergibt 316 (3.16)

HALT
