const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const EXAMPLES_DIR = path.join(ROOT_DIR, 'examples');
const OUT_DIR = path.join(ROOT_DIR, 'frontend', 'src', 'lib', 'data');

fs.mkdirSync(OUT_DIR, { recursive: true });

function parseTitle(content, fallback) {
  const lines = content.split('\n');
  for (let line of lines.slice(0, 15)) {
    line = line.trim();
    if (!line) continue;
    // Remove comment prefixes
    let clean = line.replace(/^(REM|;|#|\/\/|\/\*|\*)\s*/i, '').replace(/\*\/$/, '').trim();
    // Skip separator lines like ====== or ------
    if (/^[=\-~*#]{3,}$/.test(clean)) continue;
    if (clean.length > 3) {
      return clean.replace(/^Clack-(BASIC|Assembler|Studio):\s*/i, '').trim();
    }
  }
  return fallback;
}

function processDir(subdir, ext, exportName) {
  const dirPath = path.join(EXAMPLES_DIR, subdir);
  if (!fs.existsSync(dirPath)) {
    console.warn(`Directory ${dirPath} does not exist.`);
    return;
  }

  const files = fs.readdirSync(dirPath).filter(f => f.endsWith(ext)).sort();
  const presets = [];

  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const content = fs.readFileSync(fullPath, 'utf8');
    const id = file.replace(/^\d+_/, '').replace(/\.[^.]+$/, '');
    const cleanFilename = file.replace(/^\d+_/, '');
    const title = parseTitle(content, cleanFilename);

    presets.push({
      id: id,
      label: title,
      filename: cleanFilename,
      code: content
    });
  }

  const objMap = {};
  for (const p of presets) {
    objMap[p.id] = p.code;
  }

  const codeOut = `// ==========================================
// 💾 Automatisch aus examples/${subdir}/ synchronisiert
// Bitte NICHT manuell bearbeiten - Änderungen in examples/${subdir}/ vornehmen!
// ==========================================

export const ${exportName}_LIST = ${JSON.stringify(presets, null, 2)};

export const ${exportName} = ${JSON.stringify(objMap, null, 2)};
`;

  const outFile = path.join(OUT_DIR, `${subdir}Presets.js`);
  fs.writeFileSync(outFile, codeOut, 'utf8');
  console.log(`[sync-examples] ${presets.length} Presets geschrieben nach: ${outFile}`);
}

processDir('basic', '.bas', 'BASIC_PRESETS');
processDir('asm', '.asm', 'ASM_PRESETS');
processDir('machine', '.txt', 'PRESETS');
console.log('[sync-examples] ✅ Alle Beispiele erfolgreich synchronisiert!');
