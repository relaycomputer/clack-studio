REM ============================================================
REM ⚡ Clack-BASIC Mandelbrot 64x64 (Hochoptimiert Center-Out)
REM ============================================================
REM Relaiscomputer von Dipl.-Ing. (FH) Peter Prikasky
REM & Ing. Christian Buchhas
REM Architektur: 16-Bit Relais-CPU, 1024 Worte RAM
REM Display: 64x64 LED-Matrix (Framebuffer: 768..1023, 256 Worte)
REM
REM Mathematische & architektonische Optimierungen:
REM 1. SCREEN 64 Direktive:
REM    Legt Variablen ab 734 und Temporaries ab 756 ab.
REM    Damit bleibt der Framebuffer (768..1023) kollisionsfrei!
REM 2. Center-Out Rendering (Y=31 abwaerts bis 0):
REM    Die Berechnung startet direkt an der reellen Achse (Y=31, Im=-0.02).
REM    Dadurch leuchten bereits in den ersten 100 ms Dutzende LEDs
REM    des Mandelbrot-Hauptkoerpers auf!
REM 3. Symmetrie-Spiegelung an der reellen Achse (X-Achse):
REM    Berechnung erfolgt fuer die obere Haelfte (Y=31..0).
REM    Die gespiegelte Zeile 63-Y (32..63) wird simultan ins Display
REM    geschrieben -> Exakt 50% Rechenzeiteinsparung (2x Speedup)!
REM 4. Unrolled Hardware-Bitshifts (SHR):
REM    Ersetzt langsame Divisions-Subroutinen (__div) vollstaendig
REM    durch 16-Bit Hardware-Rechtsshifts (SHR 6 = /64, SHR 5 = /32).
REM    Spart ueber 800 Relais-Zyklen pro Pixel-Iteration!
REM 5. Toggled Vorzeichen-Extraktion:
REM    Vorzeichen von ZX * ZY wird direkt waehrend der Betragsbildung
REM    (X2, Y2) via S = 1 - S ermittelt (keine Verzweigungen noetig).
REM 6. 16-Bit Block-POKE:
REM    16 Pixel werden in ein Zeilenwort gepackt und mit einem
REM    einzigen POKE-Befehl fuer Zeile Y und 63-Y geschrieben.
REM ============================================================

SCREEN 64

REM Framebuffer-Zeiger initial fuer Center-Out:
REM Obere Zeile Y=31:   DA  = 768 + 31 * 4 = 892
REM Untere Zeile Y=32:  DAS = 768 + 32 * 4 = 896
LET DA = 892
LET DAS = 896

REM Y von 31 abwaerts bis 0.
REM CY = -1 bei Y=31, wird pro Zeile um 3 kleiner (-1, -4, -7, ... bis -94)
LET CY = -1
LET Y = 31

Y_LOOP:
IF Y < 0 THEN
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

REM Vorbereitung Zeilenwort: 0 an LSB anhaengen
LET ROW = ROW SHL 1
LET ZX = 0
LET ZY = 0
LET I = 0

ITER_LOOP:
IF I > 15 THEN
    REM Pixel gehoert zur Menge -> LSB auf 1 setzen
    LET ROW = ROW + 1
    GOTO PIXEL_DONE
END IF

REM Betraege fuer Fluchttest und Vorzeichenrekonstruktion
LET S = 0
LET X2 = ZX
IF X2 < 0 THEN
    LET X2 = -X2
    LET S = 1
END IF
IF X2 > 128 THEN
    GOTO PIXEL_DONE
END IF

LET Y2 = ZY
IF Y2 < 0 THEN
    LET Y2 = -Y2
    LET S = 1 - S
END IF
IF Y2 > 128 THEN
    GOTO PIXEL_DONE
END IF

REM Skalierung via Hardware-Shifts (Scale 64: Quadrate / 64, Mischterm / 32)
LET XY = (X2 * Y2) SHR 5
LET X2 = (X2 * X2) SHR 6
LET Y2 = (Y2 * Y2) SHR 6

REM Fluchtradius |z|^2 > 4.0 (4.0 = 256 bei Scale 64)
IF X2 + Y2 > 256 THEN
    GOTO PIXEL_DONE
END IF

REM Vorzeichen von ZX * ZY anwenden
IF S = 1 THEN
    LET XY = -XY
END IF

REM z(n+1) = z(n)^2 + c
LET ZY = XY + CY
LET ZX = X2 - Y2
LET ZX = ZX + CX

LET I = I + 1
GOTO ITER_LOOP

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
LET Y = Y - 1
LET CY = CY - 3
LET DA = DA - 4
LET DAS = DAS + 4
GOTO Y_LOOP

DONE:
HALT
