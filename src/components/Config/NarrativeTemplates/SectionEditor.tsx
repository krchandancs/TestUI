import React, { useState } from 'react';

interface Field {
  name: string;
  cardinality: string;
}

interface Section {
  id: string;
  title: string;
  enabled: boolean;
  aiInstruction: string;
  fields: Field[];
}

interface Props {
  section: Section;
  onSave: (section: Section) => void;
}

const SectionEditor: React.FC<Props> = ({ section, onSave }) => {
  const [local, setLocal] = useState(section);

  return (
    <div style={{ padding: '16px', background: '#0f172a', borderRadius: '12px' }}>
      <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>
        Edit Section: {section.title}
      </h3>

      <label style={{ display: 'block', marginBottom: '12px' }}>
        <input
          type="checkbox"
          checked={local.enabled}
          onChange={e => setLocal({ ...local, enabled: e.target.checked })}
          style={{ marginRight: '8px' }}
        />
        Enabled
      </label>

      <div style={{ marginBottom: '12px' }}>
        <label>Title</label>
        <input
          type="text"
          value={local.title}
          onChange={e => setLocal({ ...local, title: e.target.value })}
          style={{ width: '100%', padding: '8px', marginTop: '4px' }}
        />
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label>AI Instruction</label>
        <textarea
          value={local.aiInstruction}
          onChange={e => setLocal({ ...local, aiInstruction: e.target.value })}
          style={{ width: '100%', height: '120px', padding: '8px', marginTop: '4px' }}
        />
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label>Fields</label>
        <ul style={{ marginTop: '4px' }}>
          {local.fields.map(f => (
            <li key={f.name}>
              {f.name} — <span style={{ color: '#94a3b8' }}>{f.cardinality}</span>
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={() => onSave(local)}
        style={{
          padding: '10px 20px',
          background: '#0891b2',
          color: 'white',
          borderRadius: '8px',
          border: 'none',
          cursor: 'pointer'
        }}
      >
        Save Section
      </button>
    </div>
  );
};

export default SectionEditor;