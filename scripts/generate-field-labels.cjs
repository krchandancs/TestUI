#!/usr/bin/env node
// scripts/generate-field-labels.cjs
// ─────────────────────────────────────────────────────────────────────────────
// Scans all synoptic template definition files for { id, label } field nodes
// and regenerates src/utils/synopticFieldLabels.ts.
//
// Run: node scripts/generate-field-labels.cjs
// Hook: add to package.json scripts as "generate:labels" and run before build
//       when templates change.
// ─────────────────────────────────────────────────────────────────────────────

const fs   = require('fs');
const path = require('path');

const SRC_ROOT   = path.resolve(__dirname, '../src');
const OUTPUT     = path.resolve(SRC_ROOT, 'utils/synopticFieldLabels.ts');
const SCAN_DIRS  = [
  'services/templates',
  'services/synoptic',
  'components/Config/Protocols',
  'data/templates',
  'templates',
];

// ── Find all template definition files ───────────────────────────────────────
function walk(dir, results = []) {
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, results);
    else if (/\.(ts|tsx|js)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
      results.push(full);
    }
  }
  return results;
}

// ── Extract { id, label } pairs from file content ─────────────────────────────
function extractLabels(content) {
  const found = {};
  // Match: { id: 'field_id', ..., label: 'Human Label' }  (any order)
  const blockRe = /\{[^}]*\bid\s*:\s*['"`]([a-z_][a-z0-9_]*)['"`][^}]*\blabel\s*:\s*['"`]([^'"`]+)['"`][^}]*\}/gs;
  let m;
  while ((m = blockRe.exec(content)) !== null) {
    const id    = m[1];
    const label = m[2].trim();
    // Skip structural/non-field IDs
    if (/^(sec-|hdr-|rep-|h-|p-|ref-|stage-|amend-|attest-)/.test(id)) continue;
    if (id.length < 3 || label.length < 2) continue;
    found[id] = label;
  }
  // Also match: label: 'Human Label', ..., id: 'field_id'  (reversed)
  const blockRe2 = /\{[^}]*\blabel\s*:\s*['"`]([^'"`]+)['"`][^}]*\bid\s*:\s*['"`]([a-z_][a-z0-9_]*)['"`][^}]*\}/gs;
  while ((m = blockRe2.exec(content)) !== null) {
    const label = m[1].trim();
    const id    = m[2];
    if (/^(sec-|hdr-|rep-|h-|p-|ref-|stage-|amend-|attest-)/.test(id)) continue;
    if (id.length < 3 || label.length < 2) continue;
    if (!found[id]) found[id] = label;
  }
  return found;
}

// ── Main ──────────────────────────────────────────────────────────────────────
const allFiles = SCAN_DIRS.flatMap(d => walk(path.join(SRC_ROOT, d)));

if (allFiles.length === 0) {
  console.log('No template files found in scan directories. Update SCAN_DIRS in the script.');
  console.log('Existing synopticFieldLabels.ts preserved.');
  process.exit(0);
}

const extracted = {};
for (const file of allFiles) {
  const content = fs.readFileSync(file, 'utf8');
  Object.assign(extracted, extractLabels(content));
}

const count = Object.keys(extracted).length;
if (count === 0) {
  console.log('No field labels extracted — template format may have changed.');
  console.log('Check SCAN_DIRS and the id/label pattern in generate-field-labels.cjs.');
  process.exit(0);
}

// Read existing dictionary to merge (preserve manual entries not found in templates)
let existing = {};
if (fs.existsSync(OUTPUT)) {
  const currentContent = fs.readFileSync(OUTPUT, 'utf8');
  const matches = [...currentContent.matchAll(/^\s{2}(\w+):\s+'([^']+)',?/gm)];
  for (const [, id, label] of matches) existing[id] = label;
}

// Merge: template-derived labels take precedence
const merged = { ...existing, ...extracted };

// Sort alphabetically
const sorted = Object.fromEntries(
  Object.entries(merged).sort(([a], [b]) => a.localeCompare(b))
);

// Generate output
const lines = Object.entries(sorted)
  .map(([id, label]) => `  ${id.padEnd(32)}: '${label}',`);

const output = `// src/utils/synopticFieldLabels.ts
// AUTO-GENERATED — node scripts/generate-field-labels.cjs
// Do not edit manually. Run the generator when templates change.
// Generated: ${new Date().toISOString()}

export const CAP_FIELD_LABELS: Record<string, string> = {
${lines.join('\n')}
};

export function getFieldLabel(fieldId: string): string {
  return CAP_FIELD_LABELS[fieldId]
    ?? fieldId.replace(/_/g, ' ').replace(/\\b\\w/g, l => l.toUpperCase());
}
`;

fs.writeFileSync(OUTPUT, output);
console.log(`✓ synopticFieldLabels.ts updated — ${Object.keys(sorted).length} labels (${count} from templates, ${Object.keys(existing).length - count < 0 ? 0 : Object.keys(existing).length - count} preserved manual)`);
