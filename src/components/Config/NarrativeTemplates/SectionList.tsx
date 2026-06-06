import React from 'react';

interface Section {
  id: string;
  title: string;
  order: number;
}

interface Props {
  sections: Section[];
  onSelect: (id: string) => void;
  onReorder: (sections: Section[]) => void;
}

const SectionList: React.FC<Props> = ({ sections, onSelect, onReorder }) => {
  const move = (index: number, direction: number) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= sections.length) return;

    const updated = [...sections];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;

    const reordered = updated.map((s, i) => ({ ...s, order: i + 1 }));
    onReorder(reordered);
  };

  return (
    <div style={{ marginBottom: '24px' }}>
      <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>Sections</h3>

      {sections.map((section, index) => (
        <div
          key={section.id}
          style={{
            padding: '12px',
            background: '#1e293b',
            borderRadius: '8px',
            marginBottom: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer'
          }}
          onClick={() => onSelect(section.id)}
        >
          <div>
            <strong>{section.title}</strong>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
              Order: {section.order}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={(e) => { e.stopPropagation(); move(index, -1); }}>↑</button>
            <button onClick={(e) => { e.stopPropagation(); move(index, 1); }}>↓</button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SectionList;