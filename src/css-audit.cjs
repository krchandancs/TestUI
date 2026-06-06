#!/usr/bin/env node
// css-audit.cjs — PathScribe CSS completeness checker
// Place anywhere in the project and run: node src/css-audit.cjs
// Uses process.cwd() so it always resolves from the terminal location

const fs   = require('fs');
const path = require('path');

const ROOT     = process.cwd();
const SRC_DIR  = path.join(ROOT, 'src');
const CSS_FILE = path.join(ROOT, 'src', 'pathscribe.css');

// ── 1. Extract all defined classes from pathscribe.css ────────────────────────
function getDefinedClasses(cssPath) {
  const css     = fs.readFileSync(cssPath, 'utf8');
  const defined = new Set();
  const re = /\.([a-zA-Z][a-zA-Z0-9_-]*)(?=[^{]*\{)/g;
  let m;
  while ((m = re.exec(css)) !== null) {
    defined.add(m[1]);
    const base = m[1].split('--')[0].split('__')[0];
    defined.add(base);
  }
  return defined;
}

// ── 2. Walk src/ and collect all .tsx/.ts/.jsx files ─────────────────────────
function walkDir(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules') {
      walkDir(full, files);
    } else if (entry.isFile() && /\.(tsx|ts|jsx|js|cjs)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

// ── 3. Extract className values from a file ───────────────────────────────────
function extractClassNames(filePath) {
  const src   = fs.readFileSync(filePath, 'utf8');
  const found = new Map();
  const lines = src.split('\n');

  lines.forEach((line, i) => {
    const patterns = [
      /className=["'`]([^"'`]+)["'`]/g,
      /className=\{["'`]([^"'`]+)["'`]\}/g,
      /className=\{`([^`]+)`\}/g,
    ];
    for (const re of patterns) {
      let m;
      while ((m = re.exec(line)) !== null) {
        const raw = m[1].replace(/\$\{[^}]+\}/g, ' ');
        for (const cls of raw.split(/\s+/).filter(Boolean)) {
          if (cls.includes('(') || cls.includes(')') || cls.startsWith("'") ||
              cls.startsWith('"') || cls === '?' || cls === ':') continue;
          if (!found.has(cls)) found.set(cls, []);
          found.get(cls).push(i + 1);
        }
      }
    }
  });

  return found;
}

// ── 4. Run audit ──────────────────────────────────────────────────────────────
console.log('\n🔍  PathScribe CSS Audit');
console.log('─'.repeat(50));
console.log('   Root:  ' + ROOT);
console.log('   CSS:   ' + CSS_FILE);
console.log('   Src:   ' + SRC_DIR + '\n');

if (!fs.existsSync(CSS_FILE)) {
  console.error('❌  pathscribe.css not found at ' + CSS_FILE);
  process.exit(1);
}

const defined  = getDefinedClasses(CSS_FILE);
const srcFiles = walkDir(SRC_DIR).filter(f => !f.endsWith('css-audit.cjs'));
console.log(`📁  Scanned ${srcFiles.length} source files`);
console.log(`🎨  ${defined.size} classes defined in pathscribe.css\n`);

const missing = new Map();
const used    = new Map();

for (const file of srcFiles) {
  const classes = extractClassNames(file);
  const rel     = path.relative(ROOT, file);

  for (const [cls, lines] of classes) {
    used.set(cls, (used.get(cls) || 0) + lines.length);
    const isOurs = /^(ps-|fm-|tmpl-|comp-|tpl-|ps_)/.test(cls);
    if (!isOurs) continue;
    if (!defined.has(cls)) {
      if (!missing.has(cls)) missing.set(cls, []);
      missing.get(cls).push({ file: rel, lines });
    }
  }
}

// ── 5. Report ─────────────────────────────────────────────────────────────────
if (missing.size === 0) {
  console.log('✅  All namespaced classes are defined in pathscribe.css!\n');
  process.exit(0);
}

const byFile = new Map();
for (const [cls, usages] of missing) {
  for (const { file, lines } of usages) {
    if (!byFile.has(file)) byFile.set(file, []);
    byFile.get(file).push({ cls, lines });
  }
}

console.log(`❌  ${missing.size} MISSING classes\n`);

for (const file of [...byFile.keys()].sort()) {
  console.log(`  📄  ${file}`);
  for (const { cls, lines } of byFile.get(file).sort((a,b) => a.cls.localeCompare(b.cls))) {
    console.log(`       ✗  .${cls.padEnd(45)} line${lines.length > 1 ? 's' : ''} ${lines.slice(0,3).join(', ')}${lines.length > 3 ? '…' : ''}`);
  }
  console.log('');
}

console.log('─'.repeat(50));
console.log('MISSING CLASS LIST:\n');
for (const cls of [...missing.keys()].sort()) {
  console.log(`  .${cls} {}`);
}
console.log('\n' + '─'.repeat(50));
console.log(`Total: ${missing.size} missing  |  ${defined.size} defined  |  ${used.size} unique classes used\n`);
