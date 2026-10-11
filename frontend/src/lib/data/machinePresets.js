// ==========================================
// 💾 Presets fuer MachineCodeStudio
// ==========================================

export const PRESETS = {
  division_pi: `// ============================================================
// ⚡ Division & PI Berechnung (Software PI Algorithmus)
// ============================================================
daten[0] = 0x4000;		// BA 400 (Start Main Programm)
daten[1] = 400;

// DIV_LOOP (Unterprogramm Division)
daten[11] = 0x1800;		// LDAM 202 (Bitposition)
daten[12] = 202;
daten[13] = 0x4018;		// BZ 83 (Fertig)
daten[14] = 83;
daten[15] = 0x3440;		// ADD -1
daten[16] = 0xFFFF;
daten[17] = 0x2800;		// STAM 202
daten[18] = 202;
daten[19] = 0x1800;		// LDAM 203 (Dividend)
daten[20] = 203;
daten[21] = 0x4010;		// BN 29 (MSB ist 1)
daten[22] = 29;
daten[23] = 0x1400;		// LDA 0
daten[24] = 0;
daten[25] = 0x2800;		// STAM 205 (TMP)
daten[26] = 205;
daten[27] = 0x4000;		// BA 33 (Shift Dividend)
daten[28] = 33;
daten[29] = 0x1400;		// LDA 1
daten[30] = 1;
daten[31] = 0x2800;		// STAM 205 (TMP)
daten[32] = 205;
daten[33] = 0x1800;		// LDAM 203
daten[34] = 203;
daten[35] = 0x35C0;		// SHL
daten[36] = 0x0000;
daten[37] = 0x2800;		// STAM 203
daten[38] = 203;
daten[39] = 0x1800;		// LDAM 201 (Rest)
daten[40] = 201;
daten[41] = 0x35C0;		// SHL
daten[42] = 0x0000;
daten[43] = 0x2800;		// STAM 48
daten[44] = 48;
daten[45] = 0x1800;		// LDAM 205
daten[46] = 205;
daten[47] = 0x3440;		// ADD Rest+TMP
daten[48] = 0x0000;
daten[49] = 0x2800;		// STAM 201
daten[50] = 201;
daten[51] = 0x2800;		// STAM 60
daten[52] = 60;
daten[53] = 0x1800;		// LDAM 204 (Divisor)
daten[54] = 204;
daten[55] = 0x3540;		// NOT
daten[56] = 0;
daten[57] = 0x3440;		// ADD 1
daten[58] = 0x0001;
daten[59] = 0x3440;		// ADD
daten[60] = 0x0000;
daten[61] = 0x4010;		// BN 75 (Divisor > Rest)
daten[62] = 75;
daten[63] = 0x2800;		// STAM 201
daten[64] = 201;
daten[65] = 0x1800;		// LDAM 200 (Quotient)
daten[66] = 200;
daten[67] = 0x35C0;		// SHL
daten[68] = 0x0000;
daten[69] = 0x3440;		// ADD 1
daten[70] = 0x0001;
daten[71] = 0x2800;		// STAM 200
daten[72] = 200;
daten[73] = 0x4000;		// BA 11 (Loop)
daten[74] = 11;
daten[75] = 0x1800;		// LDAM 200
daten[76] = 200;
daten[77] = 0x35C0;		// SHL
daten[78] = 0x0000;
daten[79] = 0x2800;		// STAM 200
daten[80] = 200;
daten[81] = 0x4000;		// BA 11
daten[82] = 11;
daten[83] = 0x1800;		// LDAM 200
daten[84] = 200;
daten[85] = 0x6000;    // RETURN

// Variablen
daten[200] = 0;		// Quotient
daten[201] = 0;		// Rest
daten[202] = 16;	// Bitposition
daten[203] = 400;	// Dividend
daten[204] = 24;	// Divisor
daten[205] = 0;		// TMP

// Init DIV
daten[300] = 0x1400;		// LDA 0
daten[301] = 0x0000;
daten[302] = 0x2800;		// STAM 200
daten[303] = 200;
daten[304] = 0x2800;		// STAM 201
daten[305] = 201;
daten[306] = 0x2800;		// STAM 205
daten[307] = 205;
daten[308] = 0x1400;		// LDA 16
daten[309] = 16;
daten[310] = 0x2800;		// STAM 202
daten[311] = 202;
daten[312] = 0x6000;    // RETURN

// Main Programm
daten[400] = 0x5000;   // CALL 11 (DIV)
daten[401] = 11;
daten[402] = 0x2800;		// STAM 407
daten[403] = 407;
daten[404] = 0x1400;		// LDA 300
daten[405] = 300;
daten[406] = 0x3440;		// ADD 0
daten[407] = 0x0000;
daten[408] = 0x2800;		// STAM 500
daten[409] = 500;
daten[410] = 0x5000;   // CALL 300 (Init)
daten[411] = 300;
daten[412] = 0x1400;		// LDA 400
daten[413] = 400;
daten[414] = 0x2800;		// STAM 203
daten[415] = 203;
daten[416] = 0x1400;		// LDA 120
daten[417] = 120;
daten[418] = 0x2800;		// STAM 204
daten[419] = 204;
daten[420] = 0x5000;   // CALL 11 (DIV)
daten[421] = 11;
daten[422] = 0x3540;    // NOT
daten[423] = 0x0000;
daten[424] = 0x3440;		// ADD 1
daten[425] = 0x0001;
daten[426] = 0x2800;		// STAM 431
daten[427] = 431;
daten[428] = 0x1800;		// LDAM 500
daten[429] = 500;
daten[430] = 0x3440;		// ADD 0
daten[431] = 0x0000;
daten[432] = 0x2800;		// STAM 500
daten[433] = 500;
daten[434] = 0x5000;   // CALL 300 (Init)
daten[435] = 300;
daten[436] = 0x1400;		// LDA 400
daten[437] = 400;
daten[438] = 0x2800;		// STAM 203
daten[439] = 203;
daten[440] = 0x1400;		// LDA 336
daten[441] = 336;
daten[442] = 0x2800;		// STAM 204
daten[443] = 204;
daten[444] = 0x5000;   // CALL 11 (DIV)
daten[445] = 11;
daten[446] = 0x2800;		// STAM 451
daten[447] = 451;
daten[448] = 0x1800;		// LDAM 500
daten[449] = 500;
daten[450] = 0x3440;		// ADD 0
daten[451] = 0x0000;
daten[452] = 0x2800;		// STAM 500
daten[453] = 500;

daten[500] = 0;			// PI
`,

  gleichung_2x2: "/*\n  Relay computer: solve 2 linear equations with 2 unknowns and show them on 32x32 display\n  ----------------------------------------------------------------------------------------\n      a*x + b*y = c\n      d*x + e*y = f\n\n  Signed input range for this 16-bit version:\n      a,b,c,d,e,f = -39..+39\n\n  Results:\n      daten[900] = X10  (37 means 3.7, -13 means -1.3)\n      daten[901] = Y10\n\n  Method:\n      D  = a*e - b*d\n      Nx = c*e - b*f\n      Ny = a*f - c*d\n\n      X10 = sign(Nx/D) * floor((10*abs(Nx) + abs(D)/2) / abs(D))\n      Y10 = sign(Ny/D) * floor((10*abs(Ny) + abs(D)/2) / abs(D))\n\n  Multiplication and division are both implemented in software.\n  MUL accepts signed operands. DIV works on the positive magnitudes prepared by the main code.\n\n  Demo equations:\n      3*x + 7*y = 2\n      4*x + 6*y = 7\n\n  Exact solution:\n      x = 3.7\n      y = -1.3\n\n  Expected fixed-point results:\n      X10 =  37 = 0x0025\n      Y10 = -13 = 0xFFF3\n\n  Display:\n      8-row block 1: a, b -> c as 8-bit binary values\n      8-row block 2: d, e -> f as 8-bit binary values\n      8-row block 3: horizontal line\n      8-row block 4: X10 left (16 bit), Y10 right (16 bit)\n\n  The center rows used are y=3, 11, 19 and 27.\n*/\n\n// ===== BOOT/INPUT =====\ndaten[0] = 0x4000;    // BA - jump to main\ndaten[1] = 0x0028;    // DISPLAY_INIT\ndaten[20] = 0x0003;    // a = 3\ndaten[21] = 0x0007;    // b = 7\ndaten[22] = 0x0002;    // c = 2\ndaten[23] = 0x0004;    // d = 4\ndaten[24] = 0x0006;    // e = 6\ndaten[25] = 0x0007;    // f = 7\n\n\n// ===== DISPLAY INIT =====\n// 32x32 display: daten[960] is row 0 right half, daten[961] row 0 left half.\n//\n// Layout:\n//   row  3: [a=00000011][b=00000111] [arrow] [c=00000010]\n//   row 11: [d=00000100][e=00000110] [arrow] [f=00000111]\n//   row 19: horizontal separator\n//   row 27: X10 on left 16 pixels, Y10 on right 16 pixels (written at the end)\n//\n// Arrow occupies the high byte of the right 16-bit word.\n// top/bottom = 0x04, center = 0x3E.\n\ndaten[40] = 0x1400;    // LDA arrow top/bottom\ndaten[41] = 0x0400;\ndaten[42] = 0x2800;    // STAM row 2 right\ndaten[43] = 0x03C4;    // 964\ndaten[44] = 0x2800;    // STAM row 4 right\ndaten[45] = 0x03C8;    // 968\n\ndaten[46] = 0x1400;    // LDA equation 1 right: arrow + c\ndaten[47] = 0x3E02;\ndaten[48] = 0x2800;    // STAM row 3 right\ndaten[49] = 0x03C6;    // 966\n\ndaten[50] = 0x1400;    // LDA equation 1 left: a + b\ndaten[51] = 0x0307;\ndaten[52] = 0x2800;    // STAM row 3 left\ndaten[53] = 0x03C7;    // 967\n\ndaten[54] = 0x1400;    // LDA arrow top/bottom\ndaten[55] = 0x0400;\ndaten[56] = 0x2800;    // STAM row 10 right\ndaten[57] = 0x03D4;    // 980\ndaten[58] = 0x2800;    // STAM row 12 right\ndaten[59] = 0x03D8;    // 984\n\ndaten[60] = 0x1400;    // LDA equation 2 right: arrow + f\ndaten[61] = 0x3E07;\ndaten[62] = 0x2800;    // STAM row 11 right\ndaten[63] = 0x03D6;    // 982\n\ndaten[64] = 0x1400;    // LDA equation 2 left: d + e\ndaten[65] = 0x0406;\ndaten[66] = 0x2800;    // STAM row 11 left\ndaten[67] = 0x03D7;    // 983\n\ndaten[68] = 0x1400;    // LDA full horizontal line\ndaten[69] = 0xFFFF;\ndaten[70] = 0x2800;    // STAM row 19 right\ndaten[71] = 0x03E6;    // 998\ndaten[72] = 0x2800;    // STAM row 19 left\ndaten[73] = 0x03E7;    // 999\n\ndaten[74] = 0x1400;    // LDA 0\ndaten[75] = 0x0000;\ndaten[76] = 0x2800;    // clear result row 27 right (Y10)\ndaten[77] = 0x03F6;    // 1014\ndaten[78] = 0x2800;    // clear result row 27 left (X10)\ndaten[79] = 0x03F7;    // 1015\n\ndaten[80] = 0x4000;    // BA START\ndaten[81] = 0x0064;    // 100\n\n// ===== MAIN =====\n\n// START\ndaten[100] = 0x1800;    // LDAM\ndaten[101] = 0x0014;\ndaten[102] = 0x2800;    // STAM\ndaten[103] = 0x0320;\ndaten[104] = 0x1800;    // LDAM\ndaten[105] = 0x0018;\ndaten[106] = 0x2800;    // STAM\ndaten[107] = 0x0321;\ndaten[108] = 0x1400;    // LDA\ndaten[109] = 0x0000;\ndaten[110] = 0x2800;    // STAM\ndaten[111] = 0x0322;\ndaten[112] = 0x5000;    // CALL\ndaten[113] = 0x0258;    // MUL\ndaten[114] = 0x2800;    // STAM\ndaten[115] = 0x0334;\ndaten[116] = 0x1800;    // LDAM\ndaten[117] = 0x0015;\ndaten[118] = 0x2800;    // STAM\ndaten[119] = 0x0320;\ndaten[120] = 0x1800;    // LDAM\ndaten[121] = 0x0017;\ndaten[122] = 0x2800;    // STAM\ndaten[123] = 0x0321;\ndaten[124] = 0x1400;    // LDA\ndaten[125] = 0x0000;\ndaten[126] = 0x2800;    // STAM\ndaten[127] = 0x0322;\ndaten[128] = 0x5000;    // CALL\ndaten[129] = 0x0258;    // MUL\ndaten[130] = 0x2800;    // STAM\ndaten[131] = 0x0335;\ndaten[132] = 0x1800;    // LDAM\ndaten[133] = 0x0016;\ndaten[134] = 0x2800;    // STAM\ndaten[135] = 0x0320;\ndaten[136] = 0x1800;    // LDAM\ndaten[137] = 0x0018;\ndaten[138] = 0x2800;    // STAM\ndaten[139] = 0x0321;\ndaten[140] = 0x1400;    // LDA\ndaten[141] = 0x0000;\ndaten[142] = 0x2800;    // STAM\ndaten[143] = 0x0322;\ndaten[144] = 0x5000;    // CALL\ndaten[145] = 0x0258;    // MUL\ndaten[146] = 0x2800;    // STAM\ndaten[147] = 0x0336;\ndaten[148] = 0x1800;    // LDAM\ndaten[149] = 0x0015;\ndaten[150] = 0x2800;    // STAM\ndaten[151] = 0x0320;\ndaten[152] = 0x1800;    // LDAM\ndaten[153] = 0x0019;\ndaten[154] = 0x2800;    // STAM\ndaten[155] = 0x0321;\ndaten[156] = 0x1400;    // LDA\ndaten[157] = 0x0000;\ndaten[158] = 0x2800;    // STAM\ndaten[159] = 0x0322;\ndaten[160] = 0x5000;    // CALL\ndaten[161] = 0x0258;    // MUL\ndaten[162] = 0x2800;    // STAM\ndaten[163] = 0x0337;\ndaten[164] = 0x1800;    // LDAM\ndaten[165] = 0x0014;\ndaten[166] = 0x2800;    // STAM\ndaten[167] = 0x0320;\ndaten[168] = 0x1800;    // LDAM\ndaten[169] = 0x0019;\ndaten[170] = 0x2800;    // STAM\ndaten[171] = 0x0321;\ndaten[172] = 0x1400;    // LDA\ndaten[173] = 0x0000;\ndaten[174] = 0x2800;    // STAM\ndaten[175] = 0x0322;\ndaten[176] = 0x5000;    // CALL\ndaten[177] = 0x0258;    // MUL\ndaten[178] = 0x2800;    // STAM\ndaten[179] = 0x0338;\ndaten[180] = 0x1800;    // LDAM\ndaten[181] = 0x0016;\ndaten[182] = 0x2800;    // STAM\ndaten[183] = 0x0320;\ndaten[184] = 0x1800;    // LDAM\ndaten[185] = 0x0017;\ndaten[186] = 0x2800;    // STAM\ndaten[187] = 0x0321;\ndaten[188] = 0x1400;    // LDA\ndaten[189] = 0x0000;\ndaten[190] = 0x2800;    // STAM\ndaten[191] = 0x0322;\ndaten[192] = 0x5000;    // CALL\ndaten[193] = 0x0258;    // MUL\ndaten[194] = 0x2800;    // STAM\ndaten[195] = 0x0339;\ndaten[196] = 0x1800;    // LDAM\ndaten[197] = 0x0335;\ndaten[198] = 0x3540;    // NOT\ndaten[199] = 0x0000;\ndaten[200] = 0x3440;    // ADD\ndaten[201] = 0x0001;\ndaten[202] = 0x2800;    // STAM - patch negative operand\ndaten[203] = 0x00CF;    // D_SUB_ADD+1\ndaten[204] = 0x1800;    // LDAM\ndaten[205] = 0x0334;\n\n// D_SUB_ADD\ndaten[206] = 0x3440;    // ADD - D_SUB\ndaten[207] = 0x0000;\ndaten[208] = 0x2800;    // STAM\ndaten[209] = 0x033E;\ndaten[210] = 0x1800;    // LDAM\ndaten[211] = 0x0337;\ndaten[212] = 0x3540;    // NOT\ndaten[213] = 0x0000;\ndaten[214] = 0x3440;    // ADD\ndaten[215] = 0x0001;\ndaten[216] = 0x2800;    // STAM - patch negative operand\ndaten[217] = 0x00DD;    // NX_SUB_ADD+1\ndaten[218] = 0x1800;    // LDAM\ndaten[219] = 0x0336;\n\n// NX_SUB_ADD\ndaten[220] = 0x3440;    // ADD - NX_SUB\ndaten[221] = 0x0000;\ndaten[222] = 0x2800;    // STAM\ndaten[223] = 0x033F;\ndaten[224] = 0x1800;    // LDAM\ndaten[225] = 0x0339;\ndaten[226] = 0x3540;    // NOT\ndaten[227] = 0x0000;\ndaten[228] = 0x3440;    // ADD\ndaten[229] = 0x0001;\ndaten[230] = 0x2800;    // STAM - patch negative operand\ndaten[231] = 0x00EB;    // NY_SUB_ADD+1\ndaten[232] = 0x1800;    // LDAM\ndaten[233] = 0x0338;\n\n// NY_SUB_ADD\ndaten[234] = 0x3440;    // ADD - NY_SUB\ndaten[235] = 0x0000;\ndaten[236] = 0x2800;    // STAM\ndaten[237] = 0x0340;\ndaten[238] = 0x1800;    // LDAM - D\ndaten[239] = 0x033E;\ndaten[240] = 0x4018;    // BZ - D==0\ndaten[241] = 0x0198;    // ERROR\ndaten[242] = 0x4010;    // BN - D<0\ndaten[243] = 0x00F6;    // NEG_D\ndaten[244] = 0x4000;    // BA\ndaten[245] = 0x0110;    // ROUND_X\n\n// NEG_D\ndaten[246] = 0x1800;    // LDAM - D\ndaten[247] = 0x033E;\ndaten[248] = 0x3540;    // NOT\ndaten[249] = 0x0000;\ndaten[250] = 0x3440;    // ADD\ndaten[251] = 0x0001;\ndaten[252] = 0x2800;    // STAM - negate\ndaten[253] = 0x033E;\ndaten[254] = 0x1800;    // LDAM - Nx\ndaten[255] = 0x033F;\ndaten[256] = 0x3540;    // NOT\ndaten[257] = 0x0000;\ndaten[258] = 0x3440;    // ADD\ndaten[259] = 0x0001;\ndaten[260] = 0x2800;    // STAM - negate\ndaten[261] = 0x033F;\ndaten[262] = 0x1800;    // LDAM - Ny\ndaten[263] = 0x0340;\ndaten[264] = 0x3540;    // NOT\ndaten[265] = 0x0000;\ndaten[266] = 0x3440;    // ADD\ndaten[267] = 0x0001;\ndaten[268] = 0x2800;    // STAM - negate\ndaten[269] = 0x0340;\ndaten[270] = 0x4000;    // BA\ndaten[271] = 0x0110;    // ROUND_X\n\n// ROUND_X\ndaten[272] = 0x1400;    // LDA\ndaten[273] = 0x0000;\ndaten[274] = 0x2800;    // STAM - sign=0\ndaten[275] = 0x0341;\ndaten[276] = 0x1800;    // LDAM\ndaten[277] = 0x033F;\ndaten[278] = 0x4010;    // BN\ndaten[279] = 0x011A;    // ROUND_X_NEG\ndaten[280] = 0x4000;    // BA\ndaten[281] = 0x0124;    // ROUND_X_ABS\n\n// ROUND_X_NEG\ndaten[282] = 0x3540;    // NOT\ndaten[283] = 0x0000;\ndaten[284] = 0x3440;    // ADD\ndaten[285] = 0x0001;\ndaten[286] = 0x2800;    // STAM - abs numerator\ndaten[287] = 0x033F;\ndaten[288] = 0x1400;    // LDA\ndaten[289] = 0x0001;\ndaten[290] = 0x2800;    // STAM - sign=1\ndaten[291] = 0x0341;\n\n// ROUND_X_ABS\ndaten[292] = 0x1800;    // LDAM - D\ndaten[293] = 0x033E;\ndaten[294] = 0x3580;    // SHR - D/2\ndaten[295] = 0x0000;\ndaten[296] = 0x2800;    // STAM - patch +D/2\ndaten[297] = 0x0137;    // ROUND_X_ADD_HALF+1\ndaten[298] = 0x1800;    // LDAM - abs N\ndaten[299] = 0x033F;\ndaten[300] = 0x35C0;    // SHL - 2N\ndaten[301] = 0x0000;\ndaten[302] = 0x2800;    // STAM - patch +2N\ndaten[303] = 0x0135;    // ROUND_X_ADD_2N+1\ndaten[304] = 0x35C0;    // SHL - 4N\ndaten[305] = 0x0000;\ndaten[306] = 0x35C0;    // SHL - 8N\ndaten[307] = 0x0000;\n\n// ROUND_X_ADD_2N\ndaten[308] = 0x3440;    // ADD - 10N\ndaten[309] = 0x0000;\n\n// ROUND_X_ADD_HALF\ndaten[310] = 0x3440;    // ADD - rounding\ndaten[311] = 0x0000;\ndaten[312] = 0x2800;    // STAM - DIV_N\ndaten[313] = 0x032A;\ndaten[314] = 0x1800;    // LDAM\ndaten[315] = 0x033E;\ndaten[316] = 0x2800;    // STAM - DIV_D\ndaten[317] = 0x032B;\ndaten[318] = 0x5000;    // CALL\ndaten[319] = 0x02BC;    // DIV\ndaten[320] = 0x1800;    // LDAM - sign\ndaten[321] = 0x0341;\ndaten[322] = 0x4018;    // BZ\ndaten[323] = 0x014E;    // ROUND_X_POS\ndaten[324] = 0x1800;    // LDAM\ndaten[325] = 0x032C;\ndaten[326] = 0x3540;    // NOT\ndaten[327] = 0x0000;\ndaten[328] = 0x3440;    // ADD\ndaten[329] = 0x0001;\ndaten[330] = 0x2800;    // STAM - negative result\ndaten[331] = 0x0384;\ndaten[332] = 0x4000;    // BA\ndaten[333] = 0x0154;    // ROUND_Y\n\n// ROUND_X_POS\ndaten[334] = 0x1800;    // LDAM\ndaten[335] = 0x032C;\ndaten[336] = 0x2800;    // STAM - positive result\ndaten[337] = 0x0384;\ndaten[338] = 0x4000;    // BA\ndaten[339] = 0x0154;    // ROUND_Y\n\n// ROUND_Y\ndaten[340] = 0x1400;    // LDA\ndaten[341] = 0x0000;\ndaten[342] = 0x2800;    // STAM - sign=0\ndaten[343] = 0x0341;\ndaten[344] = 0x1800;    // LDAM\ndaten[345] = 0x0340;\ndaten[346] = 0x4010;    // BN\ndaten[347] = 0x015E;    // ROUND_Y_NEG\ndaten[348] = 0x4000;    // BA\ndaten[349] = 0x0168;    // ROUND_Y_ABS\n\n// ROUND_Y_NEG\ndaten[350] = 0x3540;    // NOT\ndaten[351] = 0x0000;\ndaten[352] = 0x3440;    // ADD\ndaten[353] = 0x0001;\ndaten[354] = 0x2800;    // STAM - abs numerator\ndaten[355] = 0x0340;\ndaten[356] = 0x1400;    // LDA\ndaten[357] = 0x0001;\ndaten[358] = 0x2800;    // STAM - sign=1\ndaten[359] = 0x0341;\n\n// ROUND_Y_ABS\ndaten[360] = 0x1800;    // LDAM - D\ndaten[361] = 0x033E;\ndaten[362] = 0x3580;    // SHR - D/2\ndaten[363] = 0x0000;\ndaten[364] = 0x2800;    // STAM - patch +D/2\ndaten[365] = 0x017B;    // ROUND_Y_ADD_HALF+1\ndaten[366] = 0x1800;    // LDAM - abs N\ndaten[367] = 0x0340;\ndaten[368] = 0x35C0;    // SHL - 2N\ndaten[369] = 0x0000;\ndaten[370] = 0x2800;    // STAM - patch +2N\ndaten[371] = 0x0179;    // ROUND_Y_ADD_2N+1\ndaten[372] = 0x35C0;    // SHL - 4N\ndaten[373] = 0x0000;\ndaten[374] = 0x35C0;    // SHL - 8N\ndaten[375] = 0x0000;\n\n// ROUND_Y_ADD_2N\ndaten[376] = 0x3440;    // ADD - 10N\ndaten[377] = 0x0000;\n\n// ROUND_Y_ADD_HALF\ndaten[378] = 0x3440;    // ADD - rounding\ndaten[379] = 0x0000;\ndaten[380] = 0x2800;    // STAM - DIV_N\ndaten[381] = 0x032A;\ndaten[382] = 0x1800;    // LDAM\ndaten[383] = 0x033E;\ndaten[384] = 0x2800;    // STAM - DIV_D\ndaten[385] = 0x032B;\ndaten[386] = 0x5000;    // CALL\ndaten[387] = 0x02BC;    // DIV\ndaten[388] = 0x1800;    // LDAM - sign\ndaten[389] = 0x0341;\ndaten[390] = 0x4018;    // BZ\ndaten[391] = 0x0192;    // ROUND_Y_POS\ndaten[392] = 0x1800;    // LDAM\ndaten[393] = 0x032C;\ndaten[394] = 0x3540;    // NOT\ndaten[395] = 0x0000;\ndaten[396] = 0x3440;    // ADD\ndaten[397] = 0x0001;\ndaten[398] = 0x2800;    // STAM - negative result\ndaten[399] = 0x0385;\ndaten[400] = 0x4000;    // BA\ndaten[401] = 0x01A0;    // DONE\n\n// ROUND_Y_POS\ndaten[402] = 0x1800;    // LDAM\ndaten[403] = 0x032C;\ndaten[404] = 0x2800;    // STAM - positive result\ndaten[405] = 0x0385;\ndaten[406] = 0x4000;    // BA\ndaten[407] = 0x01A0;    // DONE\n\n// ERROR\ndaten[408] = 0x1400;    // LDA - error code\ndaten[409] = 0x7FFF;\ndaten[410] = 0x2800;    // STAM\ndaten[411] = 0x0384;\ndaten[412] = 0x2800;    // STAM\ndaten[413] = 0x0385;\ndaten[414] = 0x4000;    // BA\ndaten[415] = 0x01A0;    // DONE\n\n// DONE\n// Result representation: signed fixed-point x10/y10.\n// Example here: X10=37 means x=3.7; Y10=-13 means y=-1.3.\n// Visual order is X on the left 16 pixels, Y on the right 16 pixels.\n// Because the display memory stores the right half first:\n//   daten[1014] = Y10\n//   daten[1015] = X10\n\ndaten[416] = 0x1800;    // LDAM X10\ndaten[417] = 0x0384;    // 900\ndaten[418] = 0x2800;    // STAM row 27 left\ndaten[419] = 0x03F7;    // 1015\n\ndaten[420] = 0x1800;    // LDAM Y10\ndaten[421] = 0x0385;    // 901\ndaten[422] = 0x2800;    // STAM row 27 right\ndaten[423] = 0x03F6;    // 1014\n\ndaten[424] = 0xF000;    // NOP - result remains on display; stop clock here\n\n\n// ===== MUL (signed 16-bit inputs, safe here for -39..39) =====\n\ndaten[600] = 0x1400;    // LDA 0\ndaten[601] = 0x0000;\ndaten[602] = 0x2800;    // STAM MUL_SIGN\ndaten[603] = 0x032F;\ndaten[604] = 0x1800;    // LDAM MUL_A\ndaten[605] = 0x0320;\ndaten[606] = 0x4010;    // BN A<0\ndaten[607] = 0x0266;\ndaten[608] = 0x1800;    // LDAM MUL_B\ndaten[609] = 0x0321;\ndaten[610] = 0x4010;    // BN B<0\ndaten[611] = 0x0272;\ndaten[612] = 0x4000;    // BA MUL_LOOP\ndaten[613] = 0x0288;\ndaten[614] = 0x3540;    // NOT\ndaten[615] = 0x0000;\ndaten[616] = 0x3440;    // ADD 1\ndaten[617] = 0x0001;\ndaten[618] = 0x2800;    // STAM abs(A)\ndaten[619] = 0x0320;\ndaten[620] = 0x1400;    // LDA 1\ndaten[621] = 0x0001;\ndaten[622] = 0x2800;    // STAM sign=1\ndaten[623] = 0x032F;\ndaten[624] = 0x4000;    // BA A_OK\ndaten[625] = 0x0260;\ndaten[626] = 0x3540;    // NOT\ndaten[627] = 0x0000;\ndaten[628] = 0x3440;    // ADD 1\ndaten[629] = 0x0001;\ndaten[630] = 0x2800;    // STAM abs(B)\ndaten[631] = 0x0321;\ndaten[632] = 0x1800;    // LDAM sign\ndaten[633] = 0x032F;\ndaten[634] = 0x4018;    // BZ sign was 0\ndaten[635] = 0x0282;\ndaten[636] = 0x1400;    // LDA 0\ndaten[637] = 0x0000;\ndaten[638] = 0x2800;    // STAM sign=0\ndaten[639] = 0x032F;\ndaten[640] = 0x4000;    // BA loop\ndaten[641] = 0x0288;\ndaten[642] = 0x1400;    // LDA 1\ndaten[643] = 0x0001;\ndaten[644] = 0x2800;    // STAM sign=1\ndaten[645] = 0x032F;\ndaten[646] = 0x4000;    // BA loop\ndaten[647] = 0x0288;\ndaten[648] = 0x1800;    // LDAM b\ndaten[649] = 0x0321;\ndaten[650] = 0x4018;    // BZ done\ndaten[651] = 0x02A6;\ndaten[652] = 0x4020;    // BE b even\ndaten[653] = 0x0298;\ndaten[654] = 0x1800;    // LDAM a\ndaten[655] = 0x0320;\ndaten[656] = 0x2800;    // STAM patch MUL_ADD+1\ndaten[657] = 0x0295;\ndaten[658] = 0x1800;    // LDAM result\ndaten[659] = 0x0322;\ndaten[660] = 0x3440;    // ADD patched a\ndaten[661] = 0x0000;\ndaten[662] = 0x2800;    // STAM result\ndaten[663] = 0x0322;\ndaten[664] = 0x1800;    // LDAM a\ndaten[665] = 0x0320;\ndaten[666] = 0x35C0;    // SHL\ndaten[667] = 0x0000;\ndaten[668] = 0x2800;    // STAM a\ndaten[669] = 0x0320;\ndaten[670] = 0x1800;    // LDAM b\ndaten[671] = 0x0321;\ndaten[672] = 0x3580;    // SHR\ndaten[673] = 0x0000;\ndaten[674] = 0x2800;    // STAM b\ndaten[675] = 0x0321;\ndaten[676] = 0x4000;    // BA loop\ndaten[677] = 0x0288;\ndaten[678] = 0x1800;    // LDAM sign\ndaten[679] = 0x032F;\ndaten[680] = 0x4018;    // BZ positive\ndaten[681] = 0x02B1;\ndaten[682] = 0x1800;    // LDAM result\ndaten[683] = 0x0322;\ndaten[684] = 0x3540;    // NOT\ndaten[685] = 0x0000;\ndaten[686] = 0x3440;    // ADD 1\ndaten[687] = 0x0001;\ndaten[688] = 0x6000;    // RET negative\ndaten[689] = 0x1800;    // LDAM result\ndaten[690] = 0x0322;\ndaten[691] = 0x6000;    // RET positive\n\n// ===== DIV =====\n\n// DIV\ndaten[700] = 0x1400;    // LDA\ndaten[701] = 0x0000;\ndaten[702] = 0x2800;    // STAM - Q=0\ndaten[703] = 0x032C;\ndaten[704] = 0x1400;    // LDA\ndaten[705] = 0x0000;\ndaten[706] = 0x2800;    // STAM - REM=0\ndaten[707] = 0x032D;\ndaten[708] = 0x1400;    // LDA\ndaten[709] = 0x000F;\ndaten[710] = 0x2800;    // STAM - 15 input bits\ndaten[711] = 0x032E;\ndaten[712] = 0x1800;    // LDAM - D\ndaten[713] = 0x032B;\ndaten[714] = 0x3540;    // NOT\ndaten[715] = 0x0000;\ndaten[716] = 0x3440;    // ADD\ndaten[717] = 0x0001;\ndaten[718] = 0x2800;    // STAM - patch -D\ndaten[719] = 0x02F1;    // DIV_COMPARE+1\n\n// DIV_LOOP\ndaten[720] = 0x1800;    // LDAM - N bitstream\ndaten[721] = 0x032A;\ndaten[722] = 0x35C0;    // SHL\ndaten[723] = 0x0000;\ndaten[724] = 0x2800;    // STAM\ndaten[725] = 0x032A;\ndaten[726] = 0x4010;    // BN\ndaten[727] = 0x02E0;    // DIV_BIT1\n\n// DIV_BIT0\ndaten[728] = 0x1800;    // LDAM - REM\ndaten[729] = 0x032D;\ndaten[730] = 0x35C0;    // SHL\ndaten[731] = 0x0000;\ndaten[732] = 0x2800;    // STAM\ndaten[733] = 0x032D;\ndaten[734] = 0x4000;    // BA\ndaten[735] = 0x02E8;    // DIV_AFTER_BIT\n\n// DIV_BIT1\ndaten[736] = 0x1800;    // LDAM - REM\ndaten[737] = 0x032D;\ndaten[738] = 0x35C0;    // SHL\ndaten[739] = 0x0000;\ndaten[740] = 0x3440;    // ADD\ndaten[741] = 0x0001;\ndaten[742] = 0x2800;    // STAM\ndaten[743] = 0x032D;\n\n// DIV_AFTER_BIT\ndaten[744] = 0x1800;    // LDAM - Q\ndaten[745] = 0x032C;\ndaten[746] = 0x35C0;    // SHL\ndaten[747] = 0x0000;\ndaten[748] = 0x2800;    // STAM\ndaten[749] = 0x032C;\ndaten[750] = 0x1800;    // LDAM - REM\ndaten[751] = 0x032D;\n\n// DIV_COMPARE\ndaten[752] = 0x3440;    // ADD - REM-D\ndaten[753] = 0x0000;\ndaten[754] = 0x4010;    // BN\ndaten[755] = 0x02FC;    // DIV_NO_SUB\ndaten[756] = 0x2800;    // STAM - REM -= D\ndaten[757] = 0x032D;\ndaten[758] = 0x1800;    // LDAM\ndaten[759] = 0x032C;\ndaten[760] = 0x3440;    // ADD\ndaten[761] = 0x0001;\ndaten[762] = 0x2800;    // STAM - set quotient bit\ndaten[763] = 0x032C;\n\n// DIV_NO_SUB\ndaten[764] = 0x1800;    // LDAM\ndaten[765] = 0x032E;\ndaten[766] = 0x3440;    // ADD\ndaten[767] = 0xFFFF;\ndaten[768] = 0x2800;    // STAM\ndaten[769] = 0x032E;\ndaten[770] = 0x4018;    // BZ\ndaten[771] = 0x0306;    // DIV_DONE\ndaten[772] = 0x4000;    // BA\ndaten[773] = 0x02D0;    // DIV_LOOP\n\n// DIV_DONE\ndaten[774] = 0x1800;    // LDAM\ndaten[775] = 0x032C;\ndaten[776] = 0x6000;    // RET\n\n\n// ===== VARIABLES =====\ndaten[800] = 0x0000;    // MUL_A\ndaten[801] = 0x0000;    // MUL_B\ndaten[802] = 0x0000;    // MUL_R\ndaten[810] = 0x0000;    // DIV_N (destroyed)\ndaten[811] = 0x0001;    // DIV_D (>0)\ndaten[812] = 0x0000;    // DIV_Q\ndaten[813] = 0x0000;    // DIV_REM\ndaten[814] = 0x0000;    // DIV_COUNT\ndaten[815] = 0x0000;    // MUL_SIGN\ndaten[820] = 0x0000;    // a*e\ndaten[821] = 0x0000;    // b*d\ndaten[822] = 0x0000;    // c*e\ndaten[823] = 0x0000;    // b*f\ndaten[824] = 0x0000;    // a*f\ndaten[825] = 0x0000;    // c*d\ndaten[830] = 0x0000;    // D\ndaten[831] = 0x0000;    // Nx\ndaten[832] = 0x0000;    // Ny\ndaten[833] = 0x0000;    // SIGN scratch\ndaten[900] = 0x0000;    // X10 result\ndaten[901] = 0x0000;    // Y10 result\n// ===== DISPLAY RAM INITIAL STATE =====\ndaten[960] = 0x0000;\ndaten[961] = 0x0000;\ndaten[962] = 0x0000;\ndaten[963] = 0x0000;\ndaten[964] = 0x0000;\ndaten[965] = 0x0000;\ndaten[966] = 0x0000;\ndaten[967] = 0x0000;\ndaten[968] = 0x0000;\ndaten[969] = 0x0000;\ndaten[970] = 0x0000;\ndaten[971] = 0x0000;\ndaten[972] = 0x0000;\ndaten[973] = 0x0000;\ndaten[974] = 0x0000;\ndaten[975] = 0x0000;\ndaten[976] = 0x0000;\ndaten[977] = 0x0000;\ndaten[978] = 0x0000;\ndaten[979] = 0x0000;\ndaten[980] = 0x0000;\ndaten[981] = 0x0000;\ndaten[982] = 0x0000;\ndaten[983] = 0x0000;\ndaten[984] = 0x0000;\ndaten[985] = 0x0000;\ndaten[986] = 0x0000;\ndaten[987] = 0x0000;\ndaten[988] = 0x0000;\ndaten[989] = 0x0000;\ndaten[990] = 0x0000;\ndaten[991] = 0x0000;\ndaten[992] = 0x0000;\ndaten[993] = 0x0000;\ndaten[994] = 0x0000;\ndaten[995] = 0x0000;\ndaten[996] = 0x0000;\ndaten[997] = 0x0000;\ndaten[998] = 0x0000;\ndaten[999] = 0x0000;\ndaten[1000] = 0x0000;\ndaten[1001] = 0x0000;\ndaten[1002] = 0x0000;\ndaten[1003] = 0x0000;\ndaten[1004] = 0x0000;\ndaten[1005] = 0x0000;\ndaten[1006] = 0x0000;\ndaten[1007] = 0x0000;\ndaten[1008] = 0x0000;\ndaten[1009] = 0x0000;\ndaten[1010] = 0x0000;\ndaten[1011] = 0x0000;\ndaten[1012] = 0x0000;\ndaten[1013] = 0x0000;\ndaten[1014] = 0x0000;\ndaten[1015] = 0x0000;\ndaten[1016] = 0x0000;\ndaten[1017] = 0x0000;\ndaten[1018] = 0x0000;\ndaten[1019] = 0x0000;\ndaten[1020] = 0x0000;\ndaten[1021] = 0x0000;\ndaten[1022] = 0x0000;\ndaten[1023] = 0x0000;\n",

  matrix_bounce: `// ============================================================
// ⚡ 64x64 Matrix Display Demo: Animiertes Bouncing Pixel & Rahmen
// Schreibt direkt in Framebuffer-Bereich daten[768..1023] (256 Worte)
// ============================================================

daten[0] = 0x1400; // LDA 0xFFFF (Oberste Linie)
daten[1] = 0xFFFF;
daten[2] = 0x2800; // STAM 768
daten[3] = 768;
daten[4] = 0x2800; // STAM 769
daten[5] = 769;
daten[6] = 0x2800; // STAM 770
daten[7] = 770;
daten[8] = 0x2800; // STAM 771
daten[9] = 771;

// Diagonale Pixel
daten[10] = 0x1400; // LDA 0x8000
daten[11] = 0x8000;
daten[12] = 0x2800; // STAM 776
daten[13] = 776;

daten[14] = 0x1400; // LDA 0x4000
daten[15] = 0x4000;
daten[16] = 0x2800; // STAM 780
daten[17] = 780;

daten[18] = 0x4000; // BA 18 (Halt/Loop)
daten[19] = 18;
`,

    dijkstra: `// ============================================================
// ⚡ Dijkstra Algorithmus: Kuerzester Weg in Oesterreich (17 Staedte)
// ============================================================
daten[0] = 0x1400; // LDA Startknoten
daten[1] = 0;
daten[2] = 0x2800; // STAM start_node
daten[3] = 500;
daten[4] = 0x4000; // BA Ende
daten[5] = 4;
`
  };
