#!/usr/bin/env node
// css-audit.js — PathScribe CSS completeness checker
// Run from project root: node css-audit.js
// Reports every className used in src/ that has no matching rule in pathscribe.css

const fs   = require('fs');
const path = require('path');

const SRC_DIR  = path.join(__dirname);
const CSS_FILE = path.join(__dirname, 'pathscribe.css');

// ── 1. Extract all defined classes from pathscribe.css ────────────────────────
function getDefinedClasses(cssPath) {
  const css     = fs.readFileSync(cssPath, 'utf8');
  const defined = new Set();
  // Match .classname (including modifiers like .ps-btn--active, .ps-btn:hover)
  const re = /\.([a-zA-Z][a-zA-Z0-9_-]*)(?=[^{]*\{)/g;
  let m;
  while ((m = re.exec(css)) !== null) {
    defined.add(m[1]);
    // Also add the base class for BEM modifiers (e.g. ps-btn--active → ps-btn)
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
    } else if (entry.isFile() && /\.(tsx|ts|jsx|js)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

// ── 3. Extract className values from a file ───────────────────────────────────
function extractClassNames(filePath) {
  const src     = fs.readFileSync(filePath, 'utf8');
  const found   = new Map(); // className → [lineNumbers]
  const lines   = src.split('\n');

  lines.forEach((line, i) => {
    // className="foo bar baz"  or  className={'foo bar'}  or  className={`foo ${x} bar`}
    const patterns = [
      /className=["'`]([^"'`]+)["'`]/g,
      /className=\{["'`]([^"'`]+)["'`]\}/g,
      // template literals — extract static parts
      /className=\{`([^`]+)`\}/g,
    ];
    for (const re of patterns) {
      let m;
      while ((m = re.exec(line)) !== null) {
        // Split on spaces, ${...} expressions, and conditional operators
        const raw = m[1].replace(/\$\{[^}]+\}/g, ' ');
        for (const cls of raw.split(/\s+/).filter(Boolean)) {
          // Skip obviously non-class tokens
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
console.log('\n🔍  PathScribe CSS Audit\n' + '─'.repeat(50));

if (!fs.existsSync(CSS_FILE)) {
  console.error('❌  pathscribe.css not found at', CSS_FILE);
  process.exit(1);
}

const defined   = getDefinedClasses(CSS_FILE);
const srcFiles  = walkDir(SRC_DIR);
console.log(`📁  Scanned ${srcFiles.length} source files`);
console.log(`🎨  ${defined.size} classes defined in pathscribe.css\n`);

// Collect all usages
const missing = new Map(); // className → [{file, lines}]
const used    = new Map(); // className → count

for (const file of srcFiles) {
  const classes = extractClassNames(file);
  const rel     = path.relative(__dirname, file);

  for (const [cls, lines] of classes) {
    used.set(cls, (used.get(cls) || 0) + lines.length);

    // Skip Tailwind utilities (single-word or contain -)  
    // Only flag ps-* and fm-* and tmpl-* and other namespaced classes we own
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

// Group by file for readability
const byFile = new Map();
for (const [cls, usages] of missing) {
  for (const { file, lines } of usages) {
    if (!byFile.has(file)) byFile.set(file, []);
    byFile.get(file).push({ cls, lines });
  }
}

console.log(`❌  ${missing.size} MISSING classes (used in src but not defined in pathscribe.css)\n`);

// Sort files alphabetically
const sortedFiles = [...byFile.keys()].sort();
for (const file of sortedFiles) {
  console.log(`  📄  ${file}`);
  for (const { cls, lines } of byFile.get(file).sort((a,b) => a.cls.localeCompare(b.cls))) {
    console.log(`       ✗  .${cls.padEnd(45)}  line${lines.length > 1 ? 's' : ''} ${lines.slice(0,3).join(', ')}${lines.length > 3 ? '…' : ''}`);
  }
  console.log('');
}

// Summary list for easy copy-paste
console.log('─'.repeat(50));
console.log('MISSING CLASS LIST (copy into pathscribe.css task):\n');
const sortedMissing = [...missing.keys()].sort();
for (const cls of sortedMissing) {
  console.log(`  .${cls} {}`);
}
console.log('\n' + '─'.repeat(50));
console.log(`Total: ${missing.size} missing  |  ${defined.size} defined  |  ${used.size} unique classes used in src\n`);

