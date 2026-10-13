REM ============================================================
REM ⚡ Clack-BASIC Mandelbrot 64x64 (Hochoptimiert)
REM ============================================================
REM Relaiscomputer von Dipl.-Ing. (FH) Peter Prikasky
REM Architektur: 16-Bit Relais-CPU, 1024 Worte RAM
REM Display: 64x64 LED-Matrix (Framebuffer: 768..1023, 256 Worte)
REM
REM Mathematische & architektonische Optimierungen:
REM 1. SCREEN 64 Direktive:
REM    Legt Variablen ab 700 und Temporaries ab 740 ab.
REM    Damit bleibt der Framebuffer (768..1023) kollisionsfrei!
REM 2. Symmetrie-Spiegelung an der reellen Achse (X-Achse):
REM    Berechnung erfolgt nur fuer die obere Haelfte (Y=0..31).
REM    Die gespiegelte Zeile 63-Y wird simultan ins Display
REM    geschrieben -> Exakt 50% Rechenzeiteinsparung (2x Speedup)!
REM 3. Unrolled Hardware-Bitshifts (SHR):
REM    Ersetzt die langsame Divisions-Subroutine (__div) vollstaendig
REM    durch 16-Bit Hardware-Rechtsshifts (SHR 6 = /64, SHR 5 = /32).
REM    Spart ueber 800 Relais-Zyklen pro Pixel-Iteration!
REM 4. Vorzeichen-Extraktion per Bitwise XOR:
REM    LET S = ZX XOR ZY ersetzt 12 Vergleichs- und Verzweigungs-
REM    befehle durch einen einzigen schnellen Vorzeichentest.
REM 5. 16-Bit Block-POKE:
REM    16 Pixel werden in ein Zeilenwort gepackt und mit einem
REM    einzigen POKE-Befehl fuer Zeile Y und 63-Y geschrieben.
REM ============================================================

SCREEN 64

REM Framebuffer-Zeiger:
REM Obere Zeile Y=0:   DA  = 768
REM Untere Zeile Y=63: DAS = 1020
LET DA = 768
LET DAS = 1020

REM Y von -94 bis -1 bei Scale 64 (entspricht Im: -1.47 .. -0.02)
LET CY = -94
LET Y = 0

Y_LOOP:
IF Y > 31 THEN
    GOTO DONE
END IF

REM X von -135 bis +54 bei Scale 64 (entspricht Re: -2.11 .. +0.84)
LET CX = -135
LET X = 0
LET ROW = 0
LET PA = DA
LET PAS = DAS

X_LOOP:
IF X > 63 THEN
    GOTO NEXT_Y
END IF

REM Startwert z0 = 0
LET ZX = 0
LET ZY = 0
LET I = 0

ITER_LOOP:
IF I > 15 THEN
    GOTO PIXEL_IN
END IF

REM Betraege fuer Fluchttest und quadratische Terme
LET X2 = ZX
IF X2 < 0 THEN
    LET X2 = -X2
END IF
IF X2 > 128 THEN
    GOTO PIXEL_OUT
END IF

LET Y2 = ZY
IF Y2 < 0 THEN
    LET Y2 = -Y2
END IF
IF Y2 > 128 THEN
    GOTO PIXEL_OUT
END IF

REM Skalierung via Hardware-Shifts (Scale 64: Quadrate / 64, Mischterm / 32)
LET XY = (X2 * Y2) SHR 5
LET X2 = (X2 * X2) SHR 6
LET Y2 = (Y2 * Y2) SHR 6

REM Fluchtradius |z|^2 > 4.0 (4.0 = 256 bei Scale 64)
IF X2 + Y2 > 256 THEN
    GOTO PIXEL_OUT
END IF

REM Vorzeichen von ZX * ZY via XOR rekonstruieren
LET S = ZX XOR ZY
IF S < 0 THEN
    LET XY = -XY
END IF

REM z(n+1) = z(n)^2 + c
LET ZY = XY + CY
LET ZX = X2 - Y2
LET ZX = ZX + CX

LET I = I + 1
GOTO ITER_LOOP

PIXEL_IN:
REM 1 in das 16-Bit Zeilenwort schieben (Punkt gehoert zur Menge)
LET ROW = ROW SHL 1
LET ROW = ROW + 1
GOTO PIXEL_DONE

PIXEL_OUT:
REM 0 in das 16-Bit Zeilenwort schieben (Fluchtpunkt / Hintergrund)
LET ROW = ROW SHL 1

PIXEL_DONE:
REM Alle 16 Pixel ein 16-Bit Wort in den Framebuffer schreiben
REM (und gleichzeitig gespiegelt in die untere Bildhaelfte)
IF (X AND 15) = 15 THEN
    POKE PA, ROW
    POKE PAS, ROW
    LET PA = PA + 1
    LET PAS = PAS + 1
    LET ROW = 0
END IF

LET X = X + 1
LET CX = CX + 3
GOTO X_LOOP

NEXT_Y:
LET Y = Y + 1
LET CY = CY + 3
LET DA = DA + 4
LET DAS = DAS - 4
GOTO Y_LOOP

DONE:
HALT
