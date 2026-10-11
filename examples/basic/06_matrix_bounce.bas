REM ============================================================
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
