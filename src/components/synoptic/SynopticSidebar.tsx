// PathScribe — SynopticSidebar
// Thin wrapper that applies the synoptic page's sidebar border and scroll
// behaviour to the existing Sidebar component.
// The Computational insights section has been moved into the Results tab
// of the left panel — no sidebar real estate needed.

import React from 'react';

interface Props {
  children: React.ReactNode;
}

const SynopticSidebar: React.FC<Props> = ({ children }) => (
  <div style={{
    height:        '100%',
    display:       'flex',
    flexDirection: 'column',
    borderRight:   '1px solid rgba(255,255,255,0.08)',
    overflowY:     'auto',
  }}>
    {children}
  </div>
);

export default SynopticSidebar;
