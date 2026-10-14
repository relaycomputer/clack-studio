REM ============================================================
REM ⚡ Clack-BASIC: Bouncing Pixel Animation (32x32 Matrix)
REM ============================================================

CLS

LET X = 3
LET Y = 11
LET OLD_X = 3
LET OLD_Y = 11
LET DX = 1
LET DY = 1

LOOP:
    REM Alte Pixelposition gezielt loeschen (Zero Flicker)
    PSET OLD_X, OLD_Y, 0
    
    REM Neue Pixelposition zeichnen
    PSET X, Y, 1
    
    REM Position merken
    LET OLD_X = X
    LET OLD_Y = Y
    
    REM Pixel bewegen
    LET X = X + DX
    LET Y = Y + DY
    
    REM Bandenkollision X (0..31)
    IF X >= 31 THEN
        LET DX = -1
    END IF
    IF X <= 0 THEN
        LET DX = 1
    END IF
    
    REM Bandenkollision Y (0..31)
    IF Y >= 31 THEN
        LET DY = -1
    END IF
    IF Y <= 0 THEN
        LET DY = 1
    END IF
    
    GOTO LOOP
