#!/usr/bin/env node
/**
 * scripts/modal-audit.cjs
 * ─────────────────────────────────────────────────────────────────────────────
 * Audits modal components across the PathScribe src/ tree.
 *
 * Reports:
 *   1. All files that behave like modals (named *Modal* or detected by content)
 *   2. Import count per modal — zero = candidate for removal
 *   3. Non-standard names that should be renamed to include "Modal"
 *   4. Inline style count per modal for CSS audit backlog
 *
 * Usage:
 *   node scripts/modal-audit.cjs
 *   node scripts/modal-audit.cjs --json        (machine-readable output)
 *   node scripts/modal-audit.cjs --unused-only  (show only zero-import files)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const fs   = require('fs');
const path = require('path');

const SRC_ROOT    = path.resolve(__dirname, '../src');
const SHOW_JSON   = process.argv.includes('--json');
const UNUSED_ONLY = process.argv.includes('--unused-only');

// ── Modal detection heuristics ────────────────────────────────────────────────

const MODAL_CONTENT_PATTERNS = [
  /ps-overlay/,
  /fm-overlay/,
  /className=["'`][^"'`]*overlay/i,
  /if\s*\(!show\)\s*return null/,
  /if\s*\(!isOpen\)\s*return null/,
  /zIndex:\s*\d{4,}/,          // zIndex >= 1000
  /position:\s*['"]fixed['"]/,
  /role=["']dialog["']/,
  /aria-modal=["']true["']/,
];

const MODAL_NAME_PATTERN = /[Mm]odal/;

const LIKELY_MODAL_PROPS = [
  /show\s*:\s*boolean/,
  /isOpen\s*:\s*boolean/,
  /visible\s*:\s*boolean/,
  /onClose\s*:\s*\(/,
  /onCancel\s*:\s*\(/,
  /onDismiss\s*:\s*\(/,
];


// ── Non-modal exclusions — components that trigger heuristics but aren't dialogs ──
const NON_MODAL_SUFFIXES = [
  'Page', 'Editor', 'Table', 'Panel', 'Drawer', 'Shell', 'Section', 'Tab',
  'Bar', 'Renderer', 'Viewer', 'Provider', 'Context', 'Hook', 'Overlay',
  'Shared', 'Actions', 'Service', 'Store', 'Config', 'Layout', 'App',
];

const NON_MODAL_EXACT = new Set([
  'App', 'AppShell', 'NavBar', 'Home',
]);

function isLikelyNotModal(baseName) {
  if (NON_MODAL_EXACT.has(baseName)) return true;
  // Has 'Modal' in name → definitely a modal regardless of suffix
  if (MODAL_NAME_PATTERN.test(baseName)) return false;
  // Non-modal suffix → skip unless has Modal in name
  return NON_MODAL_SUFFIXES.some(s => baseName.endsWith(s));
}

// ── File walker ───────────────────────────────────────────────────────────────

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && !['node_modules', 'dist', '.git'].includes(entry.name)) {
      walk(full, files);
    } else if (entry.isFile() && /\.(tsx|ts)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
      files.push(full);
    }
  }
  return files;
}

// ── Analysis ──────────────────────────────────────────────────────────────────

const allFiles = walk(SRC_ROOT);
const allContents = new Map(); // path → content

for (const f of allFiles) {
  allContents.set(f, fs.readFileSync(f, 'utf8'));
}

// Detect modal files
const modals = [];

for (const [filePath, content] of allContents) {
  const rel        = path.relative(SRC_ROOT, filePath);
  const baseName   = path.basename(filePath, path.extname(filePath));
  const isNamed    = MODAL_NAME_PATTERN.test(baseName);
  const contentHits = MODAL_CONTENT_PATTERNS.filter(p => p.test(content)).length;
  const propHits    = LIKELY_MODAL_PROPS.filter(p => p.test(content)).length;

  // Exclude known non-modal component types
  if (isLikelyNotModal(baseName)) continue;
  // Must match ≥2 content/prop signals OR be explicitly named Modal
  if (!isNamed && contentHits + propHits < 3) continue;

  // Count imports across the codebase
  const importers = [];
  for (const [otherPath, otherContent] of allContents) {
    if (otherPath === filePath) continue;
    // Match: import ... from '...baseName'  or  require('...baseName')
    const escaped = baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`['"\`][^'"\`]*${escaped}['"\`]`).test(otherContent)) {
      importers.push(path.relative(SRC_ROOT, otherPath));
    }
  }

  // Count inline styles
  const inlineCount = (content.match(/style=\{\{/g) || []).length;

  modals.push({
    file:         rel,
    baseName,
    isNamed,
    importers,
    importCount:  importers.length,
    inlineStyles: inlineCount,
    contentHits,
    propHits,
    suggestedName: !isNamed
      ? baseName + 'Modal'
      : null,
  });
}

// Sort: unused first, then by path
modals.sort((a, b) => a.importCount - b.importCount || a.file.localeCompare(b.file));

// ── Output ────────────────────────────────────────────────────────────────────

if (SHOW_JSON) {
  console.log(JSON.stringify(modals, null, 2));
  process.exit(0);
}

const display = UNUSED_ONLY ? modals.filter(m => m.importCount === 0) : modals;

const RED    = '\x1b[31m';
const YELLOW = '\x1b[33m';
const GREEN  = '\x1b[32m';
const CYAN   = '\x1b[36m';
const DIM    = '\x1b[2m';
const RESET  = '\x1b[0m';
const BOLD   = '\x1b[1m';

console.log(`\n${BOLD}PathScribe Modal Audit${RESET}  ${DIM}(${modals.length} modals found in src/)${RESET}\n`);
console.log(`${'File'.padEnd(60)} ${'Imports'.padEnd(8)} ${'Inline CSS'.padEnd(11)} Notes`);
console.log('─'.repeat(110));

for (const m of display) {
  const importCol = m.importCount === 0
    ? `${RED}  0${RESET}`
    : m.importCount < 2
    ? `${YELLOW}  ${m.importCount}${RESET}`
    : `${GREEN}  ${m.importCount}${RESET}`;

  const cssCol = m.inlineStyles === 0
    ? `${GREEN}  0${RESET}`
    : m.inlineStyles <= 5
    ? `${YELLOW}  ${m.inlineStyles}${RESET}`
    : `${RED} ${String(m.inlineStyles).padStart(2)}${RESET}`;

  const notes = [];
  if (!m.isNamed)          notes.push(`${YELLOW}⚠ rename → ${m.suggestedName}${RESET}`);
  if (m.importCount === 0) notes.push(`${RED}✗ unused — remove?${RESET}`);
  if (m.inlineStyles > 10) notes.push(`${RED}✗ CSS audit needed${RESET}`);
  else if (m.inlineStyles > 0) notes.push(`${YELLOW}△ minor CSS${RESET}`);

  const fileCol = m.file.length > 58 ? '…' + m.file.slice(-57) : m.file;

  console.log(
    `${fileCol.padEnd(60)} ${importCol.padEnd(16)} ${cssCol.padEnd(19)} ${notes.join('  ')}`
  );
}

// Summary
const unused      = modals.filter(m => m.importCount === 0);
const badNames    = modals.filter(m => !m.isNamed);
const cssBacklog  = modals.filter(m => m.inlineStyles > 0);
const cssClean    = modals.filter(m => m.inlineStyles === 0);

console.log('\n' + '─'.repeat(110));
console.log(`\n${BOLD}Summary${RESET}`);
console.log(`  Total modals detected : ${modals.length}`);
console.log(`  ${GREEN}CSS-clean              : ${cssClean.length}${RESET}`);
console.log(`  ${YELLOW}CSS backlog (>0 inline) : ${cssBacklog.length}${RESET}`);
console.log(`  ${RED}Unused (0 imports)     : ${unused.length}${RESET}  ${unused.map(m => m.baseName).join(', ')}`);
console.log(`  ${YELLOW}Non-standard names     : ${badNames.length}${RESET}  ${badNames.map(m => `${m.baseName} → ${m.suggestedName}`).join(', ')}`);
console.log('');
