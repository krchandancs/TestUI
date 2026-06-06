import React from 'react';
import '../../../pathscribe.css';

const CommentModalShell: React.FC<{
  title: string;
  subtitle?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  footerLeft?: React.ReactNode;
  editorMode?: boolean;  // removes body padding so ruler renders flush
}> = ({ title, subtitle, onClose, children, footerLeft, editorMode }) => {
  // ── Drag state ────────────────────────────────────────────────────────────
  const [pos, setPos] = React.useState<{ x: number; y: number } | null>(null);
  const dragging = React.useRef(false);
  const dragStart = React.useRef({ mx: 0, my: 0, px: 0, py: 0 });

  const onHeaderMouseDown = (e: React.MouseEvent) => {
    // Don't start drag if clicking the close button
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    dragging.current = true;
    const current = pos ?? { x: 0, y: 0 };
    dragStart.current = { mx: e.clientX, my: e.clientY, px: current.x, py: current.y };
  };

  React.useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - dragStart.current.mx;
      const dy = e.clientY - dragStart.current.my;
      setPos({ x: dragStart.current.px + dx, y: dragStart.current.py + dy });
    };
    const onUp = () => { dragging.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  // When pos is null the modal sits centred via flexbox (default).
  // Once dragged, we switch to absolute positioning.
  const isPositioned = pos !== null;

  return (
    <div
      data-capture-hide="true"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 8000,
        background: isPositioned ? 'transparent' : 'rgba(0,0,0,0.55)',
        backdropFilter: isPositioned ? 'none' : 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        // Once dragging has started, pointer events on the backdrop are off
        // so the backdrop-click-to-close doesn't fire while repositioning
        pointerEvents: 'auto',
      }}
    >
      {/* Invisible full-screen close layer — only active before first drag */}
      {!isPositioned && (
        <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 0 }} />
      )}

      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: isPositioned ? 'fixed' : 'relative',
          ...(isPositioned
            ? {
                left: `calc(50% + ${pos!.x}px)`,
                top:  `calc(50% + ${pos!.y}px)`,
                transform: 'translate(-50%, -50%)',
              }
            : {}),
          width: '75vw', height: '85vh',
          background: 'white', borderRadius: '16px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.35)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          zIndex: 1,
          // Smooth drop shadow when dragging for depth feel
          transition: dragging.current ? 'none' : 'box-shadow 0.2s',
        }}
      >
        {/* Header — drag handle */}
        <div
          onMouseDown={onHeaderMouseDown}
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
            flexShrink: 0,
            cursor: 'grab',
            background: '#f8fafc',
            borderRadius: '16px 16px 0 0',
            userSelect: 'none',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: subtitle ? '4px' : 0 }}>
              {/* Drag grip dots */}
              <span style={{ color: '#cbd5e1', fontSize: '14px', letterSpacing: '1px', flexShrink: 0 }}>⠿</span>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>{title}</h3>
            </div>
            {subtitle && <div style={{ fontSize: '12px', color: '#64748b', paddingLeft: '22px' }}>{subtitle}</div>}
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '20px', lineHeight: 1, padding: '2px 0 0 16px', flexShrink: 0 }}
            onMouseEnter={e => e.currentTarget.style.color = '#475569'}
            onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
          >✕</button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: editorMode ? '0' : '20px 24px', display: 'flex', flexDirection: 'column', gap: editorMode ? '0' : '16px' }}>
          {children}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, background: '#f8fafc' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', maxWidth: '60%' }}>{footerLeft}</div>
          <button
            onClick={onClose}
            style={{ padding: '8px 22px', background: '#0891B2', border: 'none', borderRadius: '8px', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = '#0e7490'}
            onMouseLeave={e => e.currentTarget.style.background = '#0891B2'}
          >Save</button>
        </div>
      </div>
    </div>
  );
};

// ─── ReportCommentModal ───────────────────────────────────────────────────────

export { CommentModalShell };
