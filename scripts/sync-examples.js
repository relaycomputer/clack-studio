const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const EXAMPLES_DIR = path.join(ROOT_DIR, 'examples');
const OUT_DIR = path.join(ROOT_DIR, 'frontend', 'src', 'lib', 'data');
const CLACK_DIR = path.resolve(ROOT_DIR, '..', 'clack-basic');
const CLACK_BIN = path.join(CLACK_DIR, 'bin', 'clack');

fs.mkdirSync(OUT_DIR, { recursive: true });

if (fs.existsSync(path.join(CLACK_DIR, 'go.mod'))) {
  try {
    fs.mkdirSync(path.join(CLACK_DIR, 'bin'), { recursive: true });
    execSync('go build -o bin/clack .', { cwd: CLACK_DIR, stdio: 'pipe' });
    console.log(`[sync-examples] Built latest clack-basic compiler at ${CLACK_BIN}`);
  } catch (err) {
    console.warn(`[sync-examples] Could not rebuild clack-basic binary:`, err.message);
  }
}

function parseTitle(content, fallback) {
  const lines = content.split('\n');
  for (let line of lines.slice(0, 15)) {
    line = line.trim();
    if (!line) continue;
    let clean = line.replace(/^(REM|;|#|\/\/|\/\*|\*)\s*/i, '').replace(/\*\/$/, '').trim();
    if (/^[=\-~*#]{3,}$/.test(clean)) continue;
    if (clean.length > 3) {
      return clean.replace(/^Clack-(BASIC|Assembler|Studio):\s*/i, '').trim();
    }
  }
  return fallback;
}

function compileFile(filePath, type) {
  if (!fs.existsSync(CLACK_BIN)) {
    console.warn(`[sync-examples] Compiler binary not found at ${CLACK_BIN}`);
    return '';
  }
  const tmpOut = path.join('/tmp', `clack_sync_${Date.now()}_${Math.random().toString(36).slice(2)}.txt`);
  try {
    const cmd = type === 'basic' 
      ? `"${CLACK_BIN}" compile "${filePath}" -o "${tmpOut}" --format=arduino`
      : `"${CLACK_BIN}" asm "${filePath}" -o "${tmpOut}" --format=arduino`;
    execSync(cmd, { stdio: 'pipe' });
    if (fs.existsSync(tmpOut)) {
      const code = fs.readFileSync(tmpOut, 'utf8');
      fs.unlinkSync(tmpOut);
      return code;
    }
  } catch (err) {
    console.warn(`[sync-examples] Failed to compile ${filePath}:`, err.message);
  } finally {
    if (fs.existsSync(tmpOut)) {
      try { fs.unlinkSync(tmpOut); } catch {}
    }
  }
  return '';
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

    let compiledCode = '';
    if (subdir === 'basic') {
      compiledCode = compileFile(fullPath, 'basic');
      const txtPath = fullPath.replace(/\.bas$/i, '.txt');
      if (compiledCode && fs.existsSync(txtPath)) {
        fs.writeFileSync(txtPath, compiledCode, 'utf8');
      }
    } else if (subdir === 'asm') {
      compiledCode = compileFile(fullPath, 'asm');
    } else if (subdir === 'machine') {
      compiledCode = content;
    }

    presets.push({
      id: id,
      label: title,
      filename: cleanFilename,
      code: content,
      compiledCode: compiledCode
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
