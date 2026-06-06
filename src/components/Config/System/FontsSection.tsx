/**
 * FontsSection.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Manages the list of fonts approved for use in the PathScribeEditor toolbar.
 *
 * Architecture role:
 *   One of the focused section components in the System config tab.
 *   Reads and writes approvedFonts via SystemConfigContext so changes are
 *   immediately available to PathScribeEditor anywhere in the app.
 *
 * Behaviour:
 *   - AVAILABLE_FONTS defines the full pool of fonts that can be approved.
 *     Add new fonts to that list to make them available to admins.
 *   - Each font has a toggle. Enabled fonts appear in approvedFonts in
 *     SystemConfig and are shown in the editor toolbar font picker.
 *   - Disabled fonts are visible here but greyed out — easy to re-enable.
 *   - At least one font must remain enabled (toggle is blocked if it's the last).
 *   - Font names render in their own typeface so admins can see what they're
 *     approving at a glance.
 *
 * Consumed by:
 *   components/Config/System/index.tsx  (renders this as the 'fonts' section)
 *
 * Related files:
 *   types/systemConfig.ts            ← approvedFonts: string[] field
 *   contexts/SystemConfigContext.tsx ← useSystemConfig hook
 *   components/Editor/PathScribeEditor.tsx ← reads approvedFonts for toolbar
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState } from 'react';
import '../../../pathscribe.css';
import { useSystemConfig } from '../../../contexts/SystemConfigContext';

// ─── Full available font pool ─────────────────────────────────────────────────
// These are the fonts admins can choose to approve or disable.
// Add new entries here to expand the pool — no other changes needed.

interface FontEntry {
  name: string;       // CSS font-family value
  label: string;      // display name (usually same as name)
  category: string;   // grouping label
}

const AVAILABLE_FONTS: FontEntry[] = [
  // Serif — traditional clinical/academic documents
  { name: 'Times New Roman', label: 'Times New Roman', category: 'Serif'      },
  { name: 'Georgia',         label: 'Georgia',         category: 'Serif'      },
  { name: 'Garamond',        label: 'Garamond',        category: 'Serif'      },
  { name: 'Palatino',        label: 'Palatino',        category: 'Serif'      },

  // Sans-serif — clean, modern reports
  { name: 'Arial',           label: 'Arial',           category: 'Sans-Serif' },
  { name: 'Helvetica',       label: 'Helvetica',       category: 'Sans-Serif' },
  { name: 'Calibri',         label: 'Calibri',         category: 'Sans-Serif' },
  { name: 'Verdana',         label: 'Verdana',         category: 'Sans-Serif' },
  { name: 'Trebuchet MS',    label: 'Trebuchet MS',    category: 'Sans-Serif' },
  { name: 'Tahoma',          label: 'Tahoma',          category: 'Sans-Serif' },
  { name: 'Roboto',          label: 'Roboto',          category: 'Sans-Serif' },

  // Monospace — codes, lab values, structured data
  { name: 'Courier New',     label: 'Courier New',     category: 'Monospace'  },
  { name: 'Consolas',        label: 'Consolas',        category: 'Monospace'  },
  { name: 'Lucida Console',  label: 'Lucida Console',  category: 'Monospace'  },
];

// Derive sorted category list preserving insertion order
const CATEGORIES = Array.from(new Set(AVAILABLE_FONTS.map(f => f.category)));

// ─── Toggle component ─────────────────────────────────────────────────────────

interface ToggleProps {
  enabled: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}

const Toggle: React.FC<ToggleProps> = ({ enabled, onChange, disabled = false }) => (
  <button
    role="switch"
    aria-checked={enabled}
    disabled={disabled}
    onClick={() => !disabled && onChange(!enabled)}
    title={disabled ? 'At least one font must remain enabled' : undefined}
    style={{
      width: '40px', height: '22px', borderRadius: '11px', border: 'none',
      background: disabled ? '#334155' : enabled ? '#0891B2' : '#475569',
      cursor: disabled ? 'not-allowed' : 'pointer',
      position: 'relative', transition: 'background 0.2s', flexShrink: 0,
      opacity: disabled ? 0.5 : 1,
    }}
  >
    <span style={{
      position: 'absolute', top: '2px',
      left: enabled ? '20px' : '2px',
      width: '18px', height: '18px', borderRadius: '50%',
      background: 'white', transition: 'left 0.2s',
      boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
    }} />
  </button>
);

// ─── Main component ───────────────────────────────────────────────────────────

const FontsSection: React.FC = () => {
  const { config, updateConfig } = useSystemConfig();
  const [search, setSearch] = useState('');

  const approvedFonts = config.approvedFonts;

  const isApproved = (fontName: string) => approvedFonts.includes(fontName);

  const toggleFont = (fontName: string, enable: boolean) => {
    if (enable) {
      updateConfig({ approvedFonts: [...approvedFonts, fontName] });
    } else {
      // Prevent disabling the last enabled font
      if (approvedFonts.length <= 1) return;
      updateConfig({ approvedFonts: approvedFonts.filter(f => f !== fontName) });
    }
  };

  const filteredFonts = (category: string) =>
    AVAILABLE_FONTS
      .filter(f => f.category === category)
      .filter(f => f.label.toLowerCase().includes(search.toLowerCase()));

  const approvedCount = approvedFonts.length;
  const totalCount    = AVAILABLE_FONTS.length;

  return (
    <div style={{ padding: '4px 0', maxWidth: '560px' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#f1f5f9', margin: '0 0 4px' }}>
          🔤 Approved Fonts
        </h2>
        <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 8px', lineHeight: '1.5' }}>
          Toggle fonts on or off to control what appears in the PathScribeEditor
          toolbar. Disabled fonts are preserved here but hidden from pathologists.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '12px', fontWeight: 600,
            color: '#10B981',
            background: 'rgba(16,185,129,0.1)',
            border: '1px solid rgba(16,185,129,0.25)',
            padding: '2px 10px', borderRadius: '99px',
          }}>
            {approvedCount} of {totalCount} enabled
          </span>
          {approvedCount <= 1 && (
            <span style={{ fontSize: '11px', color: '#F59E0B' }}>
              ⚠ At least one font must remain enabled
            </span>
          )}
        </div>
      </div>

      {/* ── Search ── */}
      <input
        type="text"
        placeholder="Search fonts…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{
          width: '100%', padding: '8px 12px', marginBottom: '16px',
          borderRadius: '7px', border: '1px solid rgba(255,255,255,0.12)',
          background: 'rgba(255,255,255,0.05)', color: '#f1f5f9',
          fontSize: '13px', outline: 'none', boxSizing: 'border-box',
        }}
      />

      {/* ── Font groups ── */}
      {CATEGORIES.map(category => {
        const fonts = filteredFonts(category);
        if (fonts.length === 0) return null;

        return (
          <div key={category} style={{ marginBottom: '20px' }}>
            {/* Category label */}
            <div style={{
              fontSize: '11px', fontWeight: 700, color: '#64748b',
              textTransform: 'uppercase', letterSpacing: '0.6px',
              marginBottom: '8px', paddingLeft: '2px',
            }}>
              {category}
            </div>

            {fonts.map(font => {
              const enabled  = isApproved(font.name);
              const isLast   = enabled && approvedCount <= 1;

              return (
                <div key={font.name} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 14px', marginBottom: '6px',
                  border: `1px solid ${enabled ? 'rgba(8,145,178,0.25)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: '8px',
                  background: enabled ? 'rgba(8,145,178,0.06)' : 'rgba(255,255,255,0.02)',
                  transition: 'all 0.15s',
                  opacity: enabled ? 1 : 0.5,
                }}>
                  {/* Font name rendered in its own typeface */}
                  <div>
                    <span style={{
                      fontFamily: font.name,
                      fontSize: '15px',
                      color: enabled ? '#f1f5f9' : '#64748b',
                      display: 'block',
                      marginBottom: '1px',
                    }}>
                      {font.label}
                    </span>
                    <span style={{ fontSize: '11px', color: '#475569', fontFamily: 'inherit' }}>
                      {font.category}
                    </span>
                  </div>

                  {/* Status + toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      fontSize: '11px', fontWeight: 600,
                      color: enabled ? '#10B981' : '#475569',
                    }}>
                      {enabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <Toggle
                      enabled={enabled}
                      onChange={val => toggleFont(font.name, val)}
                      disabled={isLast}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

    </div>
  );
};

export default FontsSection;
