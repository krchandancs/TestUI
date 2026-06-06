/**
 * components/EnhancementRequest/EnhancementRequestButton.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Trigger button for Enhancement Requests and QA / Testing Feedback.
 *
 * mode="enhancement"  (default)
 *   💡 lightbulb — submits a product enhancement request
 *   Routes to the product team email (ENHANCEMENT_EMAIL in config)
 *
 * mode="qa"
 *   🐛 bug — submits QA / testing feedback
 *   Routes to QA team email (QA_EMAIL in config), cc's admin
 *   Categories restricted to QA-relevant set
 *   Only rendered in non-production environments unless showInProd=true
 *
 * Drop-in path: src/components/EnhancementRequest/EnhancementRequestButton.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState } from 'react';
import { EnhancementRequestModal } from './EnhancementRequestModal';

export type EnhancementButtonMode = 'enhancement' | 'qa';

interface Props {
  mode?:        EnhancementButtonMode;
  showInProd?:  boolean;  // QA button only — show in production (default: false)
}

const ENV = import.meta.env.MODE ?? 'development';  // 'development' | 'staging' | 'production'

export const EnhancementRequestButton: React.FC<Props> = ({
  mode = 'enhancement',
  showInProd = false,
}) => {
  const [open, setOpen] = useState(false);

  // QA button hides in production unless explicitly enabled
  if (mode === 'qa' && ENV === 'production' && !showInProd) return null;

  const isQA    = mode === 'qa';
  const icon    = isQA ? '🐛' : '💡';
  const tooltip = isQA ? 'Submit QA / Testing Feedback' : 'Submit Enhancement Request';

  const handleClick = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <>
      <button
        onClick={handleClick}
        title={tooltip}
        style={{
          background:  'none',
          border:      'none',
          padding:     '4px 8px',
          fontSize:    '22px',
          cursor:      'pointer',
          lineHeight:  '30px',
          // fontSize (dup):    '16px',
          opacity:     0.75,
          transition:  'opacity 0.2s ease',
          flexShrink:  0,
          position:    'relative',
          zIndex:      99999,
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = '1'}
        onMouseLeave={e => e.currentTarget.style.opacity = '0.75'}
      >
        {icon}
      </button>

      {open && (
        <EnhancementRequestModal
          mode={mode}
          onClose={handleClose}
        />
      )}
    </>
  );
};
