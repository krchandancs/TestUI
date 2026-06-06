import React, { useState } from 'react';
import '../../../pathscribe.css';
import { AdminTemplateList } from './AdminTemplateList';

type TemplateSection = 'review' | 'list';

export const TemplatesTab: React.FC = () => {
  const [active, setActive] = useState<TemplateSection>('review');

  return (
    <div>
      {/* Sub-nav */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {([['review', 'Template Review Queue'], ['list', 'All Templates']] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            style={{
              padding: '6px 14px',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '13px',
              cursor: 'pointer',
              background: active === id ? '#0891b2' : 'white',
              color: active === id ? 'white' : '#64748b',
              fontWeight: active === id ? 600 : 500,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {active === 'review' && <AdminTemplateList />}
      {active === 'list' && (
        <div style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
            All Templates
          </h2>
          <p style={{ fontSize: '14px', color: '#64748b' }}>
            Manage all grossing and reporting templates.
          </p>
        </div>
      )}
    </div>
  );
};
