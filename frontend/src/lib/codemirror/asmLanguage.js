// ==========================================
// 🎨 CodeMirror 6 Clack-Assembly Syntax Highlighter
// ==========================================

import { StreamLanguage } from '@codemirror/language';

// Tokenizer for Clack 16-Bit Relay Assembly
const asmStream = {
  token(stream) {
    // Skip whitespace
    if (stream.eatSpace()) return null;

    // Comments (; or // or #)
    if (stream.match(/^;.*/) || stream.match(/^\/\/.*/) || stream.match(/^#\s+.*/)) {
      stream.skipToEnd();
      return 'lineComment';
    }

    // Directives: ORG, EQU, DATA, DW, DB
    if (stream.match(/^(ORG|EQU|DATA|DW|DB)\b/i)) {
      return 'meta';
    }

    // Immediate Prefix: #val
    if (stream.match(/^#(?:\w+|0x[0-9a-fA-F]+|\d+)/i)) {
      return 'number';
    }

    // Hex numbers: 0x1400, $1400
    if (stream.match(/^(?:0x[0-9a-fA-F]+|\$[0-9a-fA-F]+)/i)) {
      return 'number';
    }

    // Binary numbers: %1010, 0b1010
    if (stream.match(/^(?:%[01]+|0b[01]+)/i)) {
      return 'number';
    }

    // Decimal numbers: 123, -5
    if (stream.match(/^-?\d+/)) {
      return 'number';
    }

    // Labels with colon: START:, LOOP:, SUB_12:
    if (stream.match(/^[a-zA-Z_][a-zA-Z0-9_]*:/)) {
      return 'labelName';
    }

    // Memory Brackets: [500], [BALL_X]
    if (stream.match(/^\[[^\]]+\]/)) {
      return 'propertyName';
    }

    // C-Array style: daten[123] = ...
    if (stream.match(/^daten\[\s*\d+\s*\]/i)) {
      return 'propertyName';
    }

    // Identifiers & Mnemonics
    if (stream.match(/^[a-zA-Z_][a-zA-Z0-9_]*/)) {
      const word = stream.current().toUpperCase();
      const mnemonics = [
        'NOP', 'LDA', 'LDAM', 'LDAMM', 'STAM', 'STAMM',
        'ADD', 'AND', 'OR', 'NOT', 'SHR', 'SHL',
        'BA', 'BC', 'BN', 'BZ', 'BE',
        'CALL', 'RET', 'HALT'
      ];

      if (mnemonics.includes(word)) return 'keyword';
      return 'variableName';
    }

    // Punctuation
    stream.next();
    return 'punctuation';
  }
};

export const asmLanguage = StreamLanguage.define(asmStream);
