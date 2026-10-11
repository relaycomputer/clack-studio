// ==========================================
// 💾 Presets fuer BasicStudio
// ==========================================

export const BASIC_PRESETS = {
  ping_pong: `REM ============================================================
REM 🏓 Clack-BASIC: Ultra-Fast Autonomes Ping-Pong
REM ============================================================

REM 1. Initialisierung: Einmalig Bildschirm leeren
CLS

REM Ball-Koordinaten (Startmitte)
LET BX = 16
LET BY = 16
LET OLD_BX = 16
LET OLD_BY = 16
LET VX = 1
LET VY = 1

REM Paddle-Positionen (Hoehe 4 Pixel)
LET LY = 14
LET RY = 14
LET OLD_LY = 14
LET OLD_RY = 14

GAME_LOOP:
    REM --- Alte Positionen gezielt loeschen (Zero Flicker & Turbo-Speed!) ---
    PSET 1, OLD_LY, 0
    PSET 1, OLD_LY + 1, 0
    PSET 1, OLD_LY + 2, 0
    PSET 1, OLD_LY + 3, 0
    
    PSET 30, OLD_RY, 0
    PSET 30, OLD_RY + 1, 0
    PSET 30, OLD_RY + 2, 0
    PSET 30, OLD_RY + 3, 0
    
    PSET OLD_BX, OLD_BY, 0
    
    REM --- Neue Positionen zeichnen ---
    PSET 1, LY, 1
    PSET 1, LY + 1, 1
    PSET 1, LY + 2, 1
    PSET 1, LY + 3, 1
    
    PSET 30, RY, 1
    PSET 30, RY + 1, 1
    PSET 30, RY + 2, 1
    PSET 30, RY + 3, 1
    
    PSET BX, BY, 1
    
    REM --- Alte Positionen merken ---
    LET OLD_LY = LY
    LET OLD_RY = RY
    LET OLD_BX = BX
    LET OLD_BY = BY
    
    REM --- Ball bewegen ---
    LET BX = BX + VX
    LET BY = BY + VY
    
    REM --- Bandenkollision oben / unten ---
    IF BY <= 1 THEN
        LET VY = 1
    END IF
    IF BY >= 30 THEN
        LET VY = -1
    END IF
    
    REM --- Paddle-Kollision Links (X=2) ---
    IF BX <= 2 THEN
        LET VX = 1
    END IF
    
    REM --- Paddle-Kollision Rechts (X=29) ---
    IF BX >= 29 THEN
        LET VX = -1
    END IF
    
    REM --- Autonome KI: Linkes Paddle folgt Ball ---
    IF BY > LY + 1 THEN
        IF LY < 27 THEN
            LET LY = LY + 1
        END IF
    END IF
    IF BY < LY + 1 THEN
        IF LY > 1 THEN
            LET LY = LY - 1
        END IF
    END IF
    
    REM --- Autonome KI: Rechtes Paddle folgt Ball ---
    IF BY > RY + 1 THEN
        IF RY < 27 THEN
            LET RY = RY + 1
        END IF
    END IF
    IF BY < RY + 1 THEN
        IF RY > 1 THEN
            LET RY = RY - 1
        END IF
    END IF
    
    GOTO GAME_LOOP
`,

  mandelbrot: "REM ============================================================\nREM Clack-BASIC Mandelbrot 32x32 - Version ohne FOR\nREM\nREM WICHTIG:\nREM Keine FOR/NEXT-Schleifen. Der Clack-BASIC Compiler legt die\nREM FOR-Endwerte im Temp-Bereich 950..959 ab. Dieser Bereich wird\nREM fuer Ausdrucks-Temporaries zyklisch wiederverwendet; bei diesem\nREM komplexeren Programm wurden dadurch die Schleifengrenzen\nREM ueberschrieben.\nREM\nREM Festkomma: 1.0 = 32\nREM X: -67 .. +26  -> ca. -2.09 .. +0.81\nREM Y: -47 .. +46  -> ca. -1.47 .. +1.44\nREM 20 Iterationen pro Pixel\nREM ============================================================\n\nLET DA = 960\nLET CY = -47\nLET Y = 0\n\nY_LOOP:\n\nIF Y > 31 THEN\n    GOTO DONE\nEND IF\n\nLET CX = -67\nLET X = 0\nLET ROW = 0\n\nX_LOOP:\n\nIF X > 31 THEN\n    GOTO NEXT_Y\nEND IF\n\nREM z = 0\nLET ZX = 0\nLET ZY = 0\nLET I = 0\n\nITER_LOOP:\n\nREM Nach 20 Iterationen gilt der Punkt als innerhalb\nIF I > 19 THEN\n    GOTO PIXEL_IN\nEND IF\n\nREM Betraege der Komponenten\nLET X2 = ZX\nIF X2 < 0 THEN\n    LET X2 = -X2\nEND IF\n\nLET Y2 = ZY\nIF Y2 < 0 THEN\n    LET Y2 = -Y2\nEND IF\n\nREM Schneller Fluchttest: |Re(z)| > 2 oder |Im(z)| > 2\nREM 2.0 = 64 bei Scale 32\nIF X2 > 64 THEN\n    GOTO PIXEL_OUT\nEND IF\n\nIF Y2 > 64 THEN\n    GOTO PIXEL_OUT\nEND IF\n\nREM |ZX*ZY| sichern\nLET XY = X2 * Y2\n\nREM Quadrate wieder auf Scale 32 bringen\nLET X2 = X2 * X2\nLET X2 = X2 / 32\n\nLET Y2 = Y2 * Y2\nLET Y2 = Y2 / 32\n\nREM |z|^2 > 4 ?\nREM 4.0 = 128 bei Scale 32\nIF X2 + Y2 > 128 THEN\n    GOTO PIXEL_OUT\nEND IF\n\nREM 2*ZX*ZY / 32 = ZX*ZY / 16\nLET XY = XY / 16\n\nREM Vorzeichen von ZX*ZY rekonstruieren\nIF ZX < 0 THEN\n    IF ZY >= 0 THEN\n        LET XY = -XY\n    END IF\nELSE\n    IF ZY < 0 THEN\n        LET XY = -XY\n    END IF\nEND IF\n\nREM z(n+1) = z(n)^2 + c\nLET ZY = XY + CY\nLET ZX = X2 - Y2\nLET ZX = ZX + CX\n\nLET I = I + 1\nGOTO ITER_LOOP\n\n\nPIXEL_IN:\n\nREM Eine 1 in das 16-Bit-Zeilenwort schieben\nLET ROW = ROW SHL 1\nLET ROW = ROW + 1\nGOTO PIXEL_DONE\n\n\nPIXEL_OUT:\n\nREM Eine 0 in das 16-Bit-Zeilenwort schieben\nLET ROW = ROW SHL 1\n\n\nPIXEL_DONE:\n\nREM Clack-Studio stellt die beiden 16-Pixel-Woerter in der\nREM logischen X-Reihenfolge dar:\nREM   X=0..15  -> erstes Wort der Zeile\nREM   X=16..31 -> zweites Wort der Zeile\nREM\nREM Daher fuer die Simulatoranzeige:\nREM Hardware 32x32 Matrix Zuordnung:\nREM X=0..15  (Linke Haelfte)  -> Wort 1 (DA + 1)\nREM X=16..31 (Rechte Haelfte) -> Wort 0 (DA)\nIF X = 15 THEN\n    POKE DA + 1, ROW\n    LET ROW = 0\nEND IF\n\nIF X = 31 THEN\n    POKE DA, ROW\nEND IF\n\nLET X = X + 1\nLET CX = CX + 3\nGOTO X_LOOP\n\n\nNEXT_Y:\n\nLET Y = Y + 1\nLET CY = CY + 3\nLET DA = DA + 2\nGOTO Y_LOOP\n\n\nDONE:\n\nHALT\n",

  graphics_demo: `REM ============================================================
REM ⚡ Clack-BASIC: 4-Display LED Matrix Grafik-Demo (32x32)
REM ============================================================

REM 1. Display leeren (Worte 960..1023)
CLS

REM 2. Diagonale Linie pixelweise zeichnen
FOR I = 0 TO 31 STEP 1
    PSET I, I, 1
NEXT I

REM 3. Horizontale Linie bei Y = 8
FOR X = 0 TO 31 STEP 1
    PSET X, 8, 1
NEXT X

HALT
`,

    math_test: `REM ============================================================
REM ⚡ Clack-BASIC: Mathematik- & Logiktest
REM ============================================================

LET A = 25
LET B = 14

REM 1. Addition & Subtraktion
LET C = A + B
LET D = A - B

REM 2. 16-Bit Multiplikation
LET P = 12 * 7

REM 3. 16-Bit Division & Modulo
LET Q = 100 / 8
LET R = 100 MOD 8

REM 4. Verzweigung
IF P > 80 THEN
    LET STATUS = 1
ELSE
    LET STATUS = 0
END IF

HALT
`,

    data_test: `REM ============================================================
REM ⚡ Clack-BASIC: DATA, READ & RESTORE Test
REM ============================================================

DATA 100, 200, 300, 400

READ A, B
READ C, D

RESTORE
READ FIRST_AGAIN

HALT
`,

    matrix_bounce_basic: `REM ============================================================
REM ⚡ Clack-BASIC: Bouncing Pixel Animation (32x32 Matrix)
REM ============================================================

CLS

LET X = 0
LET Y = 0
LET DX = 1
LET DY = 1

LOOP:
    PSET X, Y, 0xFFFF
    
    LET X = X + DX
    LET Y = Y + DY
    
    IF X >= 30 THEN
        LET DX = -1
    END IF
    IF X <= 1 THEN
        LET DX = 1
    END IF
    
    IF Y >= 30 THEN
        LET DY = -1
    END IF
    IF Y <= 1 THEN
        LET DY = 1
    END IF
    
    GOTO LOOP
`
  };
