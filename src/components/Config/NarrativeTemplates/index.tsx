// src/components/Config/NarrativeTemplates/index.tsx
// ─────────────────────────────────────────────────────────────
// Narrative Templates configuration tab.
// Persists orchestratorEnabled to localStorage so SynopticReportPage
// can read it without a backend round-trip.
// ─────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { narrativeTemplateConfig } from './narrativeTemplateConfig';
import SectionList from './SectionList';
import SectionEditor from './SectionEditor';

// ── localStorage key (single source of truth across the app) ──
export const ORCHESTRATOR_MODE_KEY = 'pathscribe_orchestrator_mode';

// ── Helper: read the persisted flag, falling back to the static config ──
export function getOrchestratorMode(): boolean {
  try {
    const stored = localStorage.getItem(ORCHESTRATOR_MODE_KEY);
    if (stored !== null) return stored === 'true';
  } catch {
    // localStorage unavailable (SSR / sandboxed env) — ignore
  }
  return narrativeTemplateConfig.orchestratorEnabled;
}

// ─────────────────────────────────────────────────────────────

const NarrativeTemplatesTab: React.FC = () => {
  // Initialise from localStorage (persisted) → falls back to static config
  const [config, setConfig] = useState<any>(() => ({
    ...narrativeTemplateConfig,
    orchestratorEnabled: getOrchestratorMode(),
  }));

  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  const selectedSection =
    config.sections.find((s: any) => s.id === selectedSectionId) || null;

  // ── Toggle orchestrator mode and persist immediately ──
  const handleOrchestratorToggle = (enabled: boolean) => {
    try {
      localStorage.setItem(ORCHESTRATOR_MODE_KEY, String(enabled));
    } catch {
      // ignore write failures
    }
    setConfig((prev: any) => ({ ...prev, orchestratorEnabled: enabled }));
  };

  const updateSection = (updatedSection: any) => {
    setConfig((prev: any) => ({
      ...prev,
      sections: prev.sections.map((s: any) =>
        s.id === updatedSection.id ? updatedSection : s
      ),
    }));
  };

  const reorderSections = (newSections: any[]) => {
    setConfig((prev: any) => ({ ...prev, sections: newSections }));
  };

  return (
    <div style={{ padding: '24px', color: '#e2e8f0' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Narrative Templates</h2>
      <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '24px' }}>
        Configure the structure and AI behavior for narrative report generation.
      </p>

      {/* ── Orchestrator Mode toggle ── */}
      <div
        style={{
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        {/* Custom-styled toggle to match the screenshot */}
        <button
          role="switch"
          aria-checked={config.orchestratorEnabled}
          onClick={() => handleOrchestratorToggle(!config.orchestratorEnabled)}
          style={{
            width: '36px',
            height: '20px',
            borderRadius: '99px',
            border: 'none',
            cursor: 'pointer',
            position: 'relative',
            flexShrink: 0,
            background: config.orchestratorEnabled
              ? '#0891b2'
              : 'rgba(255,255,255,0.15)',
            transition: 'background 0.2s',
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: '2px',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              background: '#fff',
              transition: 'left 0.2s',
              left: config.orchestratorEnabled ? '18px' : '2px',
            }}
          />
        </button>

        <label
          onClick={() => handleOrchestratorToggle(!config.orchestratorEnabled)}
          style={{ fontSize: '14px', color: '#e2e8f0', cursor: 'pointer', userSelect: 'none' }}
        >
          Enable Orchestrator Mode
        </label>

        {config.orchestratorEnabled && (
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '99px',
              background: 'rgba(8,145,178,0.15)',
              color: '#38bdf8',
              border: '1px solid rgba(8,145,178,0.3)',
            }}
          >
            ACTIVE
          </span>
        )}
      </div>

      {/* ── Orchestrator mode description (shown when enabled) ── */}
      {config.orchestratorEnabled && (
        <div
          style={{
            marginBottom: '24px',
            padding: '12px 16px',
            borderRadius: '8px',
            background: 'rgba(8,145,178,0.06)',
            border: '1px solid rgba(8,145,178,0.2)',
            fontSize: '13px',
            color: '#94a3b8',
            lineHeight: 1.6,
          }}
        >
          <span style={{ color: '#38bdf8', fontWeight: 600 }}>Orchestrator Mode is ON — </span>
          The Synoptic Report page will show a live AI-driven narrative editor alongside
          the structured data fields. The AI will auto-draft each section as answers
          are filled in, and pathologists can manually regenerate at any time.
        </div>
      )}

      <SectionList
        sections={config.sections}
        onSelect={setSelectedSectionId}
        onReorder={reorderSections}
      />

      {selectedSection && (
        <SectionEditor section={selectedSection} onSave={updateSection} />
      )}
    </div>
  );
};

export default NarrativeTemplatesTab;
