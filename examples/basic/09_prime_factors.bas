10 CLS
20 REM ============================================================
30 REM ⚡ PRIMFAKTORZERLEGUNG MIT MATRIX-VISUALISIERUNG
40 REM Liest Zahl von Hardware IN-Port (RAM-Adresse 3, Schalter)
50 REM Zeigt gefundene Primfaktoren als Balken auf der 32x32 Matrix
60 REM Gibt jeden Primfaktor live auf Hardware OUT-Port (Adresse 2)
70 REM ============================================================
80 N = PEEK(3)
90 IF N < 2 THEN N = 60
100 POKE 2, N
110 COL = 2
120 D = 2
130 REM Hauptschleife ueber Teiler D
140 IF N <= 1 THEN GOTO 290
150 R = N MOD D
160 IF R <> 0 THEN GOTO 270
170 REM Faktor D gefunden!
180 POKE 2, D
190 H = D
200 IF H > 28 THEN H = 28
210 FOR Y = 0 TO H
220 PLOT COL, 31 - Y, 1
230 NEXT Y
240 COL = COL + 3
250 N = N / D
260 GOTO 140
270 D = D + 1
280 GOTO 140
290 REM Fertig: Port 2 signalisiert 255 (0xFF)
300 POKE 2, 255
310 END
