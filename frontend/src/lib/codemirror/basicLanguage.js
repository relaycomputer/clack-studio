// ==========================================
// 🎨 CodeMirror 6 Clack-BASIC Syntax Highlighter
// ==========================================

import { StreamLanguage } from '@codemirror/language';
import { EditorView } from '@codemirror/view';

// Tokenizer for BASIC using StreamLanguage
const basicStream = {
  token(stream) {
    // Skip whitespace
    if (stream.eatSpace()) return null;

    // Comments
    if (stream.match(/^REM\b/i) || stream.match(/^\/\/.*/) || stream.match(/^'.*/)) {
      stream.skipToEnd();
      return 'lineComment';
    }

    // Strings
    if (stream.match(/^"[^"]*"/)) {
      return 'string';
    }

    // Numbers: Hex 0x..., &H..., Binary 0b..., Decimal
    if (stream.match(/^0x[0-9a-fA-F]+/i) || stream.match(/^&H[0-9a-fA-F]+/i) || stream.match(/^0b[01]+/i) || stream.match(/^\d+/)) {
      return 'number';
    }

    // Identifiers & Keywords
    if (stream.match(/^[a-zA-Z_][a-zA-Z0-9_]*/)) {
      const word = stream.current().toUpperCase();
      const keywords = [
        'LET', 'IF', 'THEN', 'ELSE', 'END', 'FOR', 'TO', 'STEP', 'NEXT',
        'GOTO', 'GOSUB', 'RETURN', 'DATA', 'READ', 'RESTORE', 'POKE', 'PEEK',
        'CLS', 'PSET', 'PRINT', 'HALT', 'NOP'
      ];
      const operators = [
        'AND', 'OR', 'NOT', 'XOR', 'SHL', 'SHR', 'MOD'
      ];

      if (keywords.includes(word)) return 'keyword';
      if (operators.includes(word)) return 'operator';
      return 'variableName';
    }

    // Punctuation and single operators
    stream.next();
    return 'punctuation';
  }
};

export const basicLanguage = StreamLanguage.define(basicStream);

// Dark Cyberpunk / Industrial Amber theme for CodeMirror
export const clackTheme = EditorView.theme({
  '&': {
    backgroundColor: '#070a0f',
    color: '#a8d4ff',
    height: '100%',
    fontSize: '13px',
    fontFamily: '"Fira Code", monospace'
  },
  '.cm-content': {
    caretColor: '#ffb000',
    padding: '12px'
  },
  '&.cm-focused .cm-cursor': {
    borderLeftColor: '#ffb000'
  },
  '&.cm-focused .cm-selectionBackground, ::selection': {
    backgroundColor: 'rgba(255, 176, 0, 0.25)'
  },
  '.cm-gutters': {
    backgroundColor: '#0c121a',
    color: '#415a77',
    borderRight: '1px solid #1e293b'
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(255, 255, 255, 0.03)'
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#162231',
    color: '#ffb000'
  }
}, { dark: true });
