/**
 * IdentifierFormatsSection.tsx
 * src/components/Config/System/IdentifierFormatsSection.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Configuration UI for institution-specific identifier formats.
 *
 * Allows admins to set the regex patterns used by the Search page's smart
 * identifier box to auto-detect accession numbers, MRNs, and patient names.
 *
 * Usage — add to components/Config/System/index.tsx:
 *   import IdentifierFormatsSection from './IdentifierFormatsSection';
import '../../../pathscribe.css';
 *   // Inside your System tab render:
 *   <IdentifierFormatsSection />
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState, useEffect } from 'react';
import { useSystemConfig } from '../../../contexts/SystemConfigContext';
import type { IdentifierFormats } from '../../../types/systemConfig';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const testPattern = (pattern: string, example: string): boolean => {
  try { return new RegExp(pattern).test(example); } catch { return false; }
};

const isValidRegex = (pattern: string): boolean => {
  try { new RegExp(pattern); return true; } catch { return false; }
};

// ─── Sub-component: single format row ────────────────────────────────────────

const FormatRow: React.FC<{
  label:       string;
  description: string;
  pattern:     string;
  example:     string;
  onPatternChange: (v: string) => void;
  onExampleChange: (v: string) => void;
}> = ({ label, description, pattern, example, onPatternChange, onExampleChange }) => {
  const valid   = isValidRegex(pattern);
  const matches = valid && testPattern(pattern, example);

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '7px 10px', fontSize: 13,
    background: 'rgba(15,23,42,0.7)',
    border: '1px solid rgba(148,163,184,0.25)',
    borderRadius: 8, color: '#f1f5f9', outline: 'none',
    fontFamily: 'monospace',
  };

  return (
    <div style={{ padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>{label}</span>
        <span style={{ fontSize: 11, color: '#64748b' }}>{description}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 6 }}>
        {/* Pattern input */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>
            Pattern (regex)
          </div>
          <input
            value={pattern}
            onChange={e => onPatternChange(e.target.value)}
            style={{
              ...inputStyle,
              borderColor: !valid ? 'rgba(239,68,68,0.5)' : 'rgba(148,163,184,0.25)',
            }}
            placeholder="e.g. ^[A-Z]\d{2}-\d{4}$"
            spellCheck={false}
          />
          {!valid && (
            <div style={{ fontSize: 11, color: '#ef4444', marginTop: 3 }}>Invalid regex pattern</div>
          )}
        </div>

        {/* Example input */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>
            Example (for testing)
          </div>
          <div style={{ position: 'relative' }}>
            <input
              value={example}
              onChange={e => onExampleChange(e.target.value)}
              style={inputStyle}
              placeholder="e.g. S26-4200"
              spellCheck={false}
            />
            {example && valid && (
              <div style={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                fontSize: 11, fontWeight: 700,
                color: matches ? '#10B981' : '#ef4444',
              }}>
                {matches ? '✓ match' : '✗ no match'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Live preview */}
      {valid && example && (
        <div style={{
          fontSize: 11, padding: '6px 10px', borderRadius: 6,
          background: matches ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
          border: `1px solid ${matches ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
          color: matches ? '#6ee7b7' : '#fca5a5',
        }}>
          {matches
            ? `✓ "${example}" matches this pattern — will be detected as ${label}`
            : `✗ "${example}" does not match this pattern — check your regex`
          }
        </div>
      )}
    </div>
  );
};

// ─── Main section component ───────────────────────────────────────────────────

const IdentifierFormatsSection: React.FC = () => {
  const { config, updateConfig } = useSystemConfig();

  const [local,    setLocal]    = useState<IdentifierFormats>(config.identifierFormats);
  const [saved,    setSaved]    = useState(false);
  const [dirty,    setDirty]    = useState(false);

  useEffect(() => { setLocal(config.identifierFormats); }, [config.identifierFormats]);

  const update = (field: keyof IdentifierFormats, value: string) => {
    setLocal(prev => ({ ...prev, [field]: value }));
    setDirty(true);
    setSaved(false);
  };

  const handleSave = () => {
    updateConfig({ identifierFormats: local });
    setDirty(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = () => {
    setLocal(config.identifierFormats);
    setDirty(false);
  };

  const allValid =
    isValidRegex(local.accessionPattern) &&
    isValidRegex(local.mrnPattern);

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 12,
      padding: '20px 24px',
      marginBottom: 24,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', marginBottom: 2 }}>
            Identifier Formats
          </h3>
          <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
            Define how accession numbers and MRNs are formatted at your institution.
            The Search page uses these patterns to auto-detect what a user has typed.
          </p>
        </div>
      </div>

      {/* Detection order note */}
      <div style={{
        fontSize: 11, color: '#64748b', padding: '8px 12px',
        background: 'rgba(255,255,255,0.03)', borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.06)', marginBottom: 4,
        lineHeight: 1.6,
      }}>
        <strong style={{ color: '#94a3b8' }}>Detection order:</strong>{' '}
        Accession pattern → MRN pattern → Patient name (contains space/comma) → All fields (ambiguous)
      </div>

      {/* Format rows */}
      <FormatRow
        label="Accession Number"
        description="Unique case identifier assigned by your LIS"
        pattern={local.accessionPattern}
        example={local.accessionExample}
        onPatternChange={v => update('accessionPattern', v)}
        onExampleChange={v => update('accessionExample', v)}
      />
      <FormatRow
        label="MRN / Hospital ID"
        description="Patient medical record number"
        pattern={local.mrnPattern}
        example={local.mrnExample}
        onPatternChange={v => update('mrnPattern', v)}
        onExampleChange={v => update('mrnExample', v)}
      />

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16 }}>
        <button
          onClick={handleSave}
          disabled={!dirty || !allValid}
          style={{
            padding: '8px 20px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, cursor: dirty && allValid ? 'pointer' : 'not-allowed',
            background: dirty && allValid ? '#0891B2' : 'rgba(255,255,255,0.06)',
            color: dirty && allValid ? '#fff' : '#475569',
            transition: 'all 0.15s',
          }}
        >
          Save
        </button>
        {dirty && (
          <button
            onClick={handleReset}
            style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: '#94a3b8', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            Revert
          </button>
        )}
        {saved && (
          <span style={{ fontSize: 12, color: '#10B981', fontWeight: 600 }}>✓ Saved</span>
        )}
        {dirty && !allValid && (
          <span style={{ fontSize: 12, color: '#ef4444' }}>Fix invalid patterns before saving</span>
        )}
      </div>
    </div>
  );
};

export default IdentifierFormatsSection;
