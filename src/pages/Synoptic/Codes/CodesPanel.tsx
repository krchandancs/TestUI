import React, { useState } from 'react';
import '../../../pathscribe.css';
import type { MedicalCode, FieldVerification, SpecimenOption } from '../synopticTypes';
import CodeBadge from './CodeBadge';
import type { CodeSourceMeta } from '../codeConstants';
import { SOURCE_META } from '../codeConstants';
import AddCodeModal from './AddCodeModal';

const CodesPanel: React.FC<{
  codes: MedicalCode[];
  onRemove: (id: string) => void;
  onVerify: (id: string, verification: FieldVerification) => void;
  onAddToSpecimens: (codes: Omit<MedicalCode, 'id' | 'source'>[], specimenIndices: number[]) => void;
  allSpecimens: SpecimenOption[];
  activeSpecimenIndex: number;
  readOnly?: boolean;
}> = ({ codes, onRemove, onVerify, onAddToSpecimens, allSpecimens, activeSpecimenIndex, readOnly }) => {
  const [codeTab,  setCodeTab]  = useState<'SNOMED' | 'ICD'>('SNOMED');
  const [showModal, setShowModal] = useState(false);

  const displayed   = codes.filter(c => c.system === codeTab);
  const snomedCount = codes.filter(c => c.system === 'SNOMED').length;
  const icdCount    = codes.filter(c => c.system === 'ICD').length;

  return (
    <div>
      {/* Legend */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', padding: '8px 10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', marginBottom: '14px', fontSize: '11px' }}>
        {Object.entries(SOURCE_META).map(([k, v]: [string, CodeSourceMeta]) => (
          <span key={k} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ padding: '1px 6px', borderRadius: '10px', background: v.bg, color: v.color, fontWeight: 700 }}>{v.label}</span>
            {k === 'system' ? '= CAP/RCPath (locked)' : k === 'ai' ? '= AI-assigned' : '= Manual (yours)'}
          </span>
        ))}
      </div>

      {/* View tabs (SNOMED / ICD) + single Add Code button */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', alignItems: 'center' }}>
        {(['SNOMED', 'ICD'] as const).map(sys => (
          <button key={sys} onClick={() => setCodeTab(sys)}
            style={{ padding: '5px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, border: '1.5px solid', cursor: 'pointer', transition: 'all 0.15s', background: codeTab === sys ? (sys === 'SNOMED' ? '#0f766e' : '#0369a1') : 'white', color: codeTab === sys ? 'white' : (sys === 'SNOMED' ? '#0f766e' : '#0369a1'), borderColor: sys === 'SNOMED' ? '#0f766e' : '#0369a1' }}>
            {sys === 'SNOMED' ? 'SNOMED CT' : 'ICD-10'}
            <span style={{ fontSize: '10px', opacity: 0.8, marginLeft: '5px' }}>{sys === 'SNOMED' ? snomedCount : icdCount}</span>
          </button>
        ))}
        <div style={{ flex: 1 }} />
        {!readOnly && (
          <button onClick={() => setShowModal(true)}
            style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, border: 'none', background: '#0891B2', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
            onMouseEnter={e => e.currentTarget.style.background = '#0e7490'}
            onMouseLeave={e => e.currentTarget.style.background = '#0891B2'}>
            + Add Code
          </button>
        )}
      </div>

      {/* Code list */}
      <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
        {displayed.length === 0
          ? <div style={{ color: '#94a3b8', fontSize: '13px', padding: '24px', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #e2e8f0' }}>
              No {codeTab === 'SNOMED' ? 'SNOMED CT' : 'ICD-10'} codes assigned.
              {!readOnly && <><br/><span style={{ color: '#0891B2', cursor: 'pointer', fontWeight: 600 }} onClick={() => setShowModal(true)}>+ Add one now</span></>}
            </div>
          : displayed.map(c => <CodeBadge key={c.id} code={c} onRemove={onRemove} onVerify={onVerify} readOnly={readOnly} />)
        }
      </div>

      {showModal && (
        <AddCodeModal
          existingCodes={codes}
          allSpecimens={allSpecimens}
          activeSpecimenIndex={activeSpecimenIndex}
          onAddToSpecimens={onAddToSpecimens}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

// ─── Comment Modal Shell ──────────────────────────────────────────────────────
// Shared draggable 3/4-page modal used by both comment modals.
// Drag by the header bar to reposition anywhere on screen.

export { CodesPanel };
