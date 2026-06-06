import React, { useState, useEffect } from 'react';
import '../../../pathscribe.css';
import { modelService } from '../../../services';
import { AIModel } from '../../../services/models/IModelService';

const statusStyle: Record<string, React.CSSProperties> = {
  Active:  { color: '#81C995', background: 'rgba(129,201,149,0.15)', border: '1px solid rgba(129,201,149,0.3)'  },
  Retired: { color: '#9AA0A6', background: 'rgba(154,160,166,0.10)', border: '1px solid rgba(154,160,166,0.2)' },
  Beta:    { color: '#FDD663', background: 'rgba(253,214,99,0.12)',  border: '1px solid rgba(253,214,99,0.3)'   },
};

const ModelsTab: React.FC = () => {
  const [models,  setModels]  = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    modelService.getAll().then(res => {
      if (res.ok) setModels(res.data);
      setLoading(false);
    });
  }, []);

  const handleSetDefault = async (id: string) => {
    const res = await modelService.setDefault(id);
    if (res.ok) setModels(prev => prev.map(m => ({ ...m, isDefault: m.id === id })));
  };

  if (loading) return (
    <div style={{ padding: '40px 24px', textAlign: 'center', color: '#6b7280', fontSize: 14 }}>Loading models...</div>
  );

  return (
    <div style={{ padding: '24px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF', marginBottom: '4px' }}>Models</h2>
      <p style={{ fontSize: '14px', color: '#9AA0A6', marginBottom: '24px' }}>View and compare AI model performance across versions.</p>
      <div style={{ border: '1px solid rgba(255,255,255,0.10)', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
              {['Model', 'Type', 'Accuracy', 'Cases Processed', 'Status', 'Default'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#9AA0A6', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {models.map((m, i) => (
              <tr key={m.id} style={{ borderBottom: i < models.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none', opacity: m.status === 'Retired' ? 0.6 : 1 }}>
                <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: 600, color: '#DEE4E7' }}>
                  {m.name} {m.version}
                </td>
                <td style={{ padding: '14px 16px', fontSize: '14px', color: '#9AA0A6' }}>{m.type}</td>
                <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: 700, color: '#8AB4F8' }}>{m.accuracy}%</td>
                <td style={{ padding: '14px 16px', fontSize: '14px', color: '#9AA0A6' }}>{m.casesProcessed.toLocaleString()}</td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{ padding: '3px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 600, ...statusStyle[m.status] }}>{m.status}</span>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  {m.isDefault ? (
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#8AB4F8' }}>✓ Default</span>
                  ) : m.status !== 'Retired' ? (
                    <button
                      onClick={() => handleSetDefault(m.id)}
                      style={{ padding: '4px 12px', fontSize: '12px', fontWeight: 600, border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, background: 'rgba(255,255,255,0.07)', cursor: 'pointer', color: '#DEE4E7' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                    >Set Default</button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ModelsTab;
