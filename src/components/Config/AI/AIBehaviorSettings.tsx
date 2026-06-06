/**
 * AIBehaviorSettings.tsx
 * src/components/Config/AI/AIBehaviorSettings.tsx
 */
import React from 'react';
import { aiBehaviorService } from '@/services';
import type { AIBehaviorConfig } from '@/services';

// Dynamic color tokens — used only where value changes at runtime
// (static colours live in pathscribe.css via .ps-ai-* classes)
const C_TEAL  = '#0891B2';
const C_GREEN = '#10b981';
const C_AMBER = '#f59e0b';

export const AIBehaviorSettings: React.FC = () => {
  const [config,  setConfig]  = React.useState<AIBehaviorConfig | null>(null);
  const [saved,   setSaved]   = React.useState(false);
  const [dirty,   setDirty]   = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    aiBehaviorService.get().then(res => {
      if (res.ok) setConfig(res.data);
      setLoading(false);
    });
  }, []);

  const update = (changes: Partial<AIBehaviorConfig>) => {
    setConfig(prev => prev ? { ...prev, ...changes } : prev);
    setDirty(true);
    setSaved(false);
  };

  const handleSave = async () => {
    if (!config) return;
    await aiBehaviorService.update(config);
    setDirty(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = async () => {
    const res = await aiBehaviorService.reset();
    if (res.ok) { setConfig(res.data); setDirty(false); setSaved(false); }
  };

  if (loading || !config) return (
    <div className="ps-ai-loading">Loading AI settings…</div>
  );

  const ToggleBtn = ({ field, val, label }: { field: keyof AIBehaviorConfig; val: boolean; label: string }) => (
    <button
      onClick={() => update({ [field]: val } as Partial<AIBehaviorConfig>)}
      className={`ps-toggle-btn${(config[field] as boolean) === val ? ' active' : ''}`}
    >{label}</button>
  );

  // Threshold colour changes dynamically based on value
  const thresholdColor = config.confidenceThreshold >= 85 ? C_GREEN
    : config.confidenceThreshold >= 70 ? C_TEAL
    : C_AMBER;

  return (
    <div className="ps-ai-settings">

      <div className="ps-ai-settings-header">
        <h3 className="ps-ai-settings-title">AI Suggestion Behaviour</h3>
        <p className="ps-ai-settings-subtitle">
          Controls how AI-extracted field values are applied to synoptic reports.
        </p>
      </div>

      {/* ── Auto-insert + Confidence threshold ───────────────────────────── */}
      <div className="ps-ai-settings-card">

        <div className="ps-conf-row">
          <div className="ps-ai-row-content">
            <div className="ps-ai-row-label">Auto-insert suggestions</div>
            <div className="ps-ai-row-desc">
              <strong>Off (recommended)</strong> — AI suggestions appear as badges below each
              field. The pathologist clicks <em>Confirm</em> to accept or <em>Override</em> to
              reject. Stronger audit trail; each acceptance is a deliberate clinical decision.
              <br /><br />
              <strong>On</strong> — AI values are written directly into fields when confidence
              is at or above the threshold. Faster for high-volume routine cases.
            </div>
          </div>
          <div className="ps-ai-toggles">
            <ToggleBtn field="autoInsertSuggestions" val={false} label="Off" />
            <ToggleBtn field="autoInsertSuggestions" val={true}  label="On"  />
          </div>
        </div>

        <div className="ps-conf-row ps-conf-row--last">
          <div className="ps-ai-row-content">
            <div className="ps-ai-row-label">Confidence threshold</div>
            <div className="ps-ai-row-desc">
              Fields where AI confidence is below this threshold show a{' '}
              <span style={{ color: C_AMBER, fontWeight: 600 }}>⚠ low confidence</span> badge
              and are never auto-inserted regardless of the setting above.
            </div>
            <div className="ps-ai-threshold-row">
              <input
                type="range" min={50} max={99} step={5}
                value={config.confidenceThreshold}
                onChange={e => update({ confidenceThreshold: Number(e.target.value) })}
                className="ps-ai-range"
                style={{ accentColor: C_TEAL }}
              />
              <span className="ps-ai-threshold-value" style={{ color: thresholdColor }}>
                {config.confidenceThreshold}%
              </span>
            </div>
            <div className="ps-ai-threshold-labels">
              <span>50% — permissive</span>
              <span>75% — recommended</span>
              <span>99% — strict</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Additional toggles ────────────────────────────────────────────── */}
      <div className="ps-ai-settings-card">
        <div className="ps-conf-row">
          <div className="ps-ai-row-content">
            <div className="ps-ai-row-label">Show confidence scores</div>
            <div className="ps-ai-row-desc">
              Display percentage confidence on each AI suggestion badge in the synoptic editor.
            </div>
          </div>
          <div className="ps-ai-toggles">
            <ToggleBtn field="showConfidenceScores" val={true}  label="On"  />
            <ToggleBtn field="showConfidenceScores" val={false} label="Off" />
          </div>
        </div>
        <div className="ps-conf-row ps-conf-row--last">
          <div className="ps-ai-row-content">
            <div className="ps-ai-row-label">Subspecialty routing</div>
            <div className="ps-ai-row-desc">
              Filter AI suggestions based on the assigned pathologist's subspecialty to improve relevance.
            </div>
          </div>
          <div className="ps-ai-toggles">
            <ToggleBtn field="subspecialtyRouting" val={true}  label="On"  />
            <ToggleBtn field="subspecialtyRouting" val={false} label="Off" />
          </div>
        </div>
      </div>

      {/* ── Actions ──────────────────────────────────────────────────────── */}
      <div className="ps-ai-actions">
        <button onClick={handleSave} disabled={!dirty} className="ps-btn-primary">
          {saved ? '✓ Saved' : 'Save settings'}
        </button>
        <button onClick={handleReset} className="fm-btn-cancel">
          Reset to defaults
        </button>
        {saved && <span className="ps-ai-saved-msg" style={{ color: C_GREEN }}>Settings saved</span>}
      </div>
    </div>
  );
};

export default AIBehaviorSettings;
