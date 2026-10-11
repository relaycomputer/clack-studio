REM ============================================================
REM Clack-BASIC Mandelbrot 32x32 - Version ohne FOR
REM
REM WICHTIG:
REM Keine FOR/NEXT-Schleifen. Der Clack-BASIC Compiler legt die
REM FOR-Endwerte im Temp-Bereich 950..959 ab. Dieser Bereich wird
REM fuer Ausdrucks-Temporaries zyklisch wiederverwendet; bei diesem
REM komplexeren Programm wurden dadurch die Schleifengrenzen
REM ueberschrieben.
REM
REM Festkomma: 1.0 = 32
REM X: -67 .. +26  -> ca. -2.09 .. +0.81
REM Y: -47 .. +46  -> ca. -1.47 .. +1.44
REM 20 Iterationen pro Pixel
REM ============================================================

LET DA = 960
LET CY = -47
LET Y = 0

Y_LOOP:

IF Y > 31 THEN
    GOTO DONE
END IF

LET CX = -67
LET X = 0
LET ROW = 0

X_LOOP:

IF X > 31 THEN
    GOTO NEXT_Y
END IF

REM z = 0
LET ZX = 0
LET ZY = 0
LET I = 0

ITER_LOOP:

REM Nach 20 Iterationen gilt der Punkt als innerhalb
IF I > 19 THEN
    GOTO PIXEL_IN
END IF

REM Betraege der Komponenten
LET X2 = ZX
IF X2 < 0 THEN
    LET X2 = -X2
END IF

LET Y2 = ZY
IF Y2 < 0 THEN
    LET Y2 = -Y2
END IF

REM Schneller Fluchttest: |Re(z)| > 2 oder |Im(z)| > 2
REM 2.0 = 64 bei Scale 32
IF X2 > 64 THEN
    GOTO PIXEL_OUT
END IF

IF Y2 > 64 THEN
    GOTO PIXEL_OUT
END IF

REM |ZX*ZY| sichern
LET XY = X2 * Y2

REM Quadrate wieder auf Scale 32 bringen
LET X2 = X2 * X2
LET X2 = X2 / 32

LET Y2 = Y2 * Y2
LET Y2 = Y2 / 32

REM |z|^2 > 4 ?
REM 4.0 = 128 bei Scale 32
IF X2 + Y2 > 128 THEN
    GOTO PIXEL_OUT
END IF

REM 2*ZX*ZY / 32 = ZX*ZY / 16
LET XY = XY / 16

REM Vorzeichen von ZX*ZY rekonstruieren
IF ZX < 0 THEN
    IF ZY >= 0 THEN
        LET XY = -XY
    END IF
ELSE
    IF ZY < 0 THEN
        LET XY = -XY
    END IF
END IF

REM z(n+1) = z(n)^2 + c
LET ZY = XY + CY
LET ZX = X2 - Y2
LET ZX = ZX + CX

LET I = I + 1
GOTO ITER_LOOP


PIXEL_IN:

REM Eine 1 in das 16-Bit-Zeilenwort schieben
LET ROW = ROW SHL 1
LET ROW = ROW + 1
GOTO PIXEL_DONE


PIXEL_OUT:

REM Eine 0 in das 16-Bit-Zeilenwort schieben
LET ROW = ROW SHL 1


PIXEL_DONE:

REM Hardware 32x32 Matrix Zuordnung:
REM X=0..15  (Linke Haelfte)  -> Wort 1 (DA + 1)
REM X=16..31 (Rechte Haelfte) -> Wort 0 (DA)
IF X = 15 THEN
    POKE DA + 1, ROW
    LET ROW = 0
END IF

IF X = 31 THEN
    POKE DA, ROW
END IF

LET X = X + 1
LET CX = CX + 3
GOTO X_LOOP


NEXT_Y:

LET Y = Y + 1
LET CY = CY + 3
LET DA = DA + 2
GOTO Y_LOOP


DONE:

HALT
